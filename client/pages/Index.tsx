import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import BookNowModal from "@/components/BookNowModal";
  const [isBookNowModalOpen, setIsBookNowModalOpen] = useState(false);
  // Handlers for Book Now modal
  const handleBookDayPass = useCallback(() => {
    setIsDayPassModalOpen(true);
    // Optionally scroll to day pass section if you add one
  }, []);
  const handleBookRoom = useCallback(() => {
    // Scroll to BookingWidget (hero section)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const handleBookAmenity = useCallback(() => {
    // Scroll to amenities section
    const amenitiesSection = document.getElementById('amenities');
    if (amenitiesSection) {
      amenitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
import { useSearchParams } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import BookingWidget from "@/components/BookingWidget";
import RoomDetailModal from "@/components/RoomDetailModal";
import AmenityDetailModal from "@/components/AmenityDetailModal";
import DayPassDetailModal from "@/components/DayPassDetailModal";
import Recommendations from "@/components/Recommendations";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import FAQModal from "@/components/FAQModal";

interface RoomCatalogItem {
  id: number;
  room_name: string;
  room_type: string;
  room_numbers: string;
  capacity: number;
  price_per_night: string;
  amenities?: string;
  description?: string;
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [searchData, setSearchData] = useState<any>(null);
  const [availabilityResults, setAvailabilityResults] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<any>(null);
  const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false);
  const [isDayPassModalOpen, setIsDayPassModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [recommendationsKey, setRecommendationsKey] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [openRoomBookingsTrigger, setOpenRoomBookingsTrigger] = useState(0);
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
  const [roomsCatalog, setRoomsCatalog] = useState<RoomCatalogItem[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const GALLERY_TOTAL = 18;
  const galleryImages = Array.from({ length: GALLERY_TOTAL }, (_, i) => `/${i + 1}.jpg`);
  const galleryAutoPlay = useRef<ReturnType<typeof setInterval> | null>(null);
  const galleryHovered = useRef(false);

  const startGalleryAutoPlay = useCallback(() => {
    if (galleryAutoPlay.current) clearInterval(galleryAutoPlay.current);
    galleryAutoPlay.current = setInterval(() => {
      if (!galleryHovered.current) {
        setGalleryIndex(prev => (prev + 1) % GALLERY_TOTAL);
      }
    }, 2500);
  }, []);

  useEffect(() => {
    startGalleryAutoPlay();
    return () => { if (galleryAutoPlay.current) clearInterval(galleryAutoPlay.current); };
  }, [startGalleryAutoPlay]);
  const isCheckingAuth = useRef(false);
  const lastScrollY = useRef(0);
  const hasScrolledDown = useRef(false);
  const isRefreshing = useRef(false);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (isCheckingAuth.current) return;
      isCheckingAuth.current = true;
      
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setIsLoggedIn(true);
            setUserId(data.user.id);
            setUserRole(data.user.role);
          } else {
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        isCheckingAuth.current = false;
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchRoomsCatalog = async () => {
      try {
        const response = await fetch('/api/facilities/rooms', { credentials: 'include' });
        const data = await response.json();
        if (data.success && Array.isArray(data.rooms)) {
          setRoomsCatalog(data.rooms);
        }
      } catch (error) {
        console.error('Failed to fetch rooms catalog:', error);
      }
    };

    fetchRoomsCatalog();
  }, []);

  // Check for verification success and show toast
  useEffect(() => {
    const verification = searchParams.get('verification');
    if (verification === 'success') {
      // Show success toast
      toast({
        variant: "success",
        title: "Registration Successful!",
        description: "Your account has been verified and you're now logged in. Welcome to Prisville Resort!",
        duration: 3000,
      });
      
      // Remove the query parameter from URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast]);

  // Scroll to top refresh functionality with throttle
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      // Throttle to max once per 150ms
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        
        const currentScrollY = window.scrollY;
        
        // Track if user has scrolled down significantly (at least 300px)
        if (currentScrollY > 300) {
          hasScrolledDown.current = true;
        }
        
        // Trigger refresh when reaching the very top after scrolling down
        if (currentScrollY === 0 && hasScrolledDown.current && !isRefreshing.current) {
          handleRefresh();
          hasScrolledDown.current = false;
        }
        
        lastScrollY.current = currentScrollY;
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, []);

  const handleRefresh = async () => {
    isRefreshing.current = true;
    
    // Force recommendations to refresh by changing key
    setRecommendationsKey(prev => prev + 1);
    
    // Wait a bit before allowing another refresh
    setTimeout(() => {
      isRefreshing.current = false;
    }, 1000);
  };

  const handleSearch = useCallback((data: any) => {
    setSearchData(data);
  }, []);

  const handleAvailabilityCheck = useCallback((results: any) => {
    setAvailabilityResults(results);
    // Scroll to results section
    setTimeout(() => {
      const resultsSection = document.getElementById('availability-results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  const handleRoomClick = useCallback((room: any) => {
    setSelectedRoom(room);
    setIsRoomModalOpen(true);
  }, []);

  const handleAmenityClick = useCallback((amenity: any) => {
    setSelectedAmenity(amenity);
    setIsAmenityModalOpen(true);
  }, []);

  const handleLoginClick = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const getRoomImage = useCallback((roomType: string) => {
    if (roomType.includes('Standard')) {
      return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&h=400&fit=crop";
    }
    if (roomType.includes('Large Family')) {
      return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop";
    }
    if (roomType.includes('Family Fan')) {
      return "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop";
    }
    if (roomType.includes('Non-Aircon')) {
      return "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop";
    }
    return "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=400&fit=crop";
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <Header 
        externalLoginModalOpen={isLoginModalOpen}
        onLoginModalChange={(isOpen) => {
          setIsLoginModalOpen(isOpen);
        }}
        onLoginSuccess={() => {
          // Update login state immediately after successful login
          setIsLoggedIn(true);
        }}
        onLogoutSuccess={() => {
          // Reset login state immediately after logout
          setIsLoggedIn(false);
        }}
        onOpenRoomBookings={() => {
          // Trigger is watched by Header to open room bookings modal
          setOpenRoomBookingsTrigger(prev => prev + 1);
        }}
        openRoomBookingsTrigger={openRoomBookingsTrigger}
      />
      
      {/* Announcement Banner */}
      <AnnouncementBanner 
        userId={userId || 0} 
        userRole={userRole || 'guest'} 
      />

      {/* Hero Section */}
      <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-zoomSlow"
          style={{
            backgroundImage:
                "linear-gradient(135deg, rgba(25, 70, 50, 0.35) 0%, rgba(15, 35, 50, 0.45) 100%), url('/image2.png')",
            backgroundAttachment: "fixed",
            backgroundPosition: "center",
          }}
        />

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center pt-24 sm:pt-32 px-4">
          {/* Main Heading */}
          <div className="text-center px-4 mb-12 sm:mb-16 md:mb-24">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white leading-tight italic mb-4 sm:mb-6">
              Experience Nature in Luxury
            </h1>
            <p className="text-white/70 text-xs sm:text-sm md:text-base max-w-2xl mx-auto px-4">
              Discover our exclusive collection of luxury accommodations
            </p>
          </div>

          {/* Booking Widget */}
          <div className="w-full max-w-6xl px-2 sm:px-4">
            <BookingWidget 
              onSearch={handleSearch}
              onAvailabilityCheck={handleAvailabilityCheck}
            />
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-gray-900 to-transparent z-20" />
      </section>

      {/* Availability Calendar Section */}
      {availabilityResults && availabilityResults.availabilityCalendar && (
        <section id="availability-results" className="py-16 px-4 md:px-8 lg:px-12 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4">
                Availability Calendar
              </h2>
              <p className="text-gray-600">
                Showing availability for the next 60 days • {availabilityResults.guests} {availabilityResults.guests === 1 ? 'Guest' : 'Guests'}
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 px-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-700">High Availability (3-4 options)</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-yellow-500 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-700">Limited Availability (1-2 options)</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-200 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-700">No Availability</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 md:p-8">
              {(() => {
                const calendar = availabilityResults.availabilityCalendar;
                const monthGroups: { [key: string]: typeof calendar } = {};
                
                calendar.forEach((day: any) => {
                  const date = new Date(day.date);
                  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                  if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
                  monthGroups[monthKey].push(day);
                });

                return Object.entries(monthGroups).map(([monthKey, days]) => {
                  const [year, month] = monthKey.split('-');
                  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  
                  return (
                    <div key={monthKey} className="mb-6 sm:mb-8 last:mb-0">
                      <h3 className="text-lg sm:text-xl font-serif text-gray-900 mb-3 sm:mb-4">{monthName}</h3>
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {/* Day headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 py-1 sm:py-2">
                            {day}
                          </div>
                        ))}
                        
                        {/* Add empty cells for days before the month starts */}
                        {(() => {
                          const firstDay = new Date(days[0].date);
                          const firstDayOfWeek = firstDay.getDay();
                          return Array(firstDayOfWeek).fill(null).map((_, i) => (
                            <div key={`empty-${i}`}></div>
                          ));
                        })()}
                        
                        {/* Calendar days */}
                        {days.map((day: any) => {
                          const date = new Date(day.date);
                          const dayNum = date.getDate();
                          const totalAvailable = day.availableRooms + day.availableAmenities;
                          
                          let bgColor = 'bg-red-200';
                          if (totalAvailable >= 3) bgColor = 'bg-green-500';
                          else if (totalAvailable > 0) bgColor = 'bg-yellow-500';
                          
                          return (
                            <div
                              key={day.date}
                              className={`${bgColor} rounded sm:rounded-lg p-2 sm:p-3 text-center cursor-pointer hover:opacity-80 active:opacity-70 transition group relative touch-manipulation`}
                              title={`${day.date}: ${day.availableRooms} rooms, ${day.availableAmenities} amenities`}
                            >
                              <div className="font-semibold text-gray-900 text-sm sm:text-base">{dayNum}</div>
                              <div className="text-[9px] sm:text-xs text-gray-700 mt-0.5 sm:mt-1 leading-tight">
                                {totalAvailable > 0 ? `${totalAvailable} available` : 'Booked'}
                              </div>
                              
                              {/* Tooltip on hover - hide on mobile */}
                              <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                                <div>{day.availableRooms} rooms</div>
                                <div>{day.availableAmenities} amenities</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Close Button */}
            <div className="text-center mt-6 sm:mt-8">
              <button
                onClick={() => setAvailabilityResults(null)}
                className="bg-primary hover:bg-primary/90 active:bg-primary/80 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg transition touch-manipulation text-sm sm:text-base font-medium"
              >
                Close Calendar
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Personalized Recommendations - Only show when logged in */}
      {isLoggedIn && (
        <Recommendations 
          key={recommendationsKey}
          isLoggedIn={isLoggedIn}
          onRoomClick={handleRoomClick}
          onAmenityClick={handleAmenityClick}
          onDayPassClick={() => setIsDayPassModalOpen(true)}
        />
      )}

      {/* About Section */}
      <section className="relative py-16 sm:py-20 md:py-32 px-4 md:px-8 lg:px-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="animate-slideInLeft">
              <p className="text-yellow-700 text-xs md:text-sm font-medium tracking-[0.3em] uppercase mb-3 md:mb-4">
                Welcome to Prisville
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-6 md:mb-8">
                Your Perfect Getaway in Bongabong
              </h2>
              
              <div className="space-y-3 md:space-y-4 text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed mb-6 md:mb-8">
                <p>
                  Located at BB2, Bongabong, Prisville Triangle Resort offers the perfect blend of comfort and nature. With 10 well-appointed rooms featuring aircon and fan options, pools, function halls, and event spaces, we provide everything you need for a memorable stay.
                </p>
                <p>
                  Open daily from <span className="font-semibold text-gray-900">6AM to 11PM</span> for day tours and overnight stays.
                </p>
              </div>

              {/* Entrance Fee Box */}
              <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded-lg mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.8,10.9C9.53,10.31 8.8,9.7 8.8,8.75C8.8,7.66 9.81,6.9 11.5,6.9C13.28,6.9 13.94,7.75 14,9H16.21C16.14,7.28 15.09,5.7 13,5.19V3H10V5.16C8.06,5.58 6.5,6.84 6.5,8.77C6.5,11.08 8.41,12.23 11.2,12.9C13.7,13.5 14.2,14.38 14.2,15.31C14.2,16 13.71,17.1 11.5,17.1C9.44,17.1 8.63,16.18 8.52,15H6.32C6.44,17.19 8.08,18.42 10,18.83V21H13V18.85C14.95,18.5 16.5,17.35 16.5,15.3C16.5,12.46 14.07,11.5 11.8,10.9Z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Entrance Fee: ₱100 per person</h3>
                    <p className="text-sm text-gray-600">
                      Required for all guests upon entry. Grants access to all resort facilities including swimming pools and common areas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Contact us:</h3>
                <div className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-yellow-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                  </svg>
                  <span>Phone: <a href="tel:09515601087" className="text-yellow-700 hover:text-yellow-800 font-medium">09515601087</a></span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-yellow-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
                  </svg>
                  <span>Email: <a href="mailto:prisvilletriangleresort@yahoo.com" className="text-yellow-700 hover:text-yellow-800 font-medium">prisvilletriangleresort@yahoo.com</a></span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-yellow-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2.04C6.5,2.04 2,6.53 2,12.06C2,17.06 5.66,21.21 10.44,21.96V14.96H7.9V12.06H10.44V9.85C10.44,7.34 11.93,5.96 14.22,5.96C15.31,5.96 16.45,6.15 16.45,6.15V8.62H15.19C13.95,8.62 13.56,9.39 13.56,10.18V12.06H16.34L15.89,14.96H13.56V21.96A10,10 0 0,0 22,12.06C22,6.53 17.5,2.04 12,2.04Z"/>
                  </svg>
                  <span>Facebook: <a href="https://www.facebook.com/prisvilletriangleresort" target="_blank" rel="noopener noreferrer" className="text-yellow-700 hover:text-yellow-800 font-medium">Prisville Triangle Resort</a></span>
                </div>
              </div>

              {/* Book Now Button */}
              <button
                className="px-8 sm:px-10 py-3 sm:py-4 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-semibold uppercase tracking-widest transition-all duration-300 text-sm sm:text-base w-full sm:w-auto"
                onClick={() => setIsBookNowModalOpen(true)}
              >
                Book Now
              </button>
                  {/* Book Now Modal */}
                  <BookNowModal
                    isOpen={isBookNowModalOpen}
                    onClose={() => setIsBookNowModalOpen(false)}
                    onBookDayPass={handleBookDayPass}
                    onBookRoom={handleBookRoom}
                    onBookAmenity={handleBookAmenity}
                  />
                  {/* Day Pass Section */}
                  <section id="day-pass" className="relative py-16 sm:py-20 md:py-32 px-4 md:px-8 lg:px-12 bg-yellow-50 overflow-hidden">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
                      {/* Left: Info */}
                      <div className="flex-1 animate-slideInLeft">
                        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-yellow-900 mb-4">Day Pass Booking</h2>
                        <p className="text-yellow-800 text-base md:text-lg mb-6">Enjoy full access to all resort facilities, pools, and common areas from <b>6AM to 11PM</b> with our affordable day pass. Perfect for families, friends, and groups!</p>
                        <ul className="list-disc pl-6 text-yellow-900 mb-6">
                          <li>Unlimited pool access</li>
                          <li>Use of common areas and amenities</li>
                          <li>Free parking</li>
                          <li>Discounts on select amenities</li>
                        </ul>
                        <button
                          className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg shadow transition"
                          onClick={() => setIsDayPassModalOpen(true)}
                        >
                          Book Day Pass
                        </button>
                      </div>
                      {/* Right: Image */}
                      <div className="flex-1 animate-slideInRight">
                        <img src="/daypass-pool.jpg" alt="Day Pass Pool" className="rounded-2xl shadow-2xl w-full max-w-md mx-auto" />
                      </div>
                    </div>
                  </section>
            </div>

            {/* Right Image */}
            <div className="relative animate-slideInRight mt-8 lg:mt-0" style={{ animationDelay: '0.2s' }}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                    src="/backgroundimage.png"
                  alt="Prisville Triangle Resort Pool"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              {/* Decorative Element */}
              <div className="absolute -bottom-6 -right-6 w-32 sm:w-48 h-32 sm:h-48 bg-yellow-600/20 rounded-2xl -z-10 animate-float"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Rooms & Cottages Section */}
      <section id="rooms" className="relative py-16 sm:py-20 md:py-32 px-4 md:px-8 lg:px-12 bg-gray-900 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_50%)] animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header with fade-in animation */}
          <div className="text-center mb-12 md:mb-16 animate-fadeInUp">
            <p className="text-yellow-600/80 text-xs md:text-sm font-medium tracking-[0.3em] uppercase mb-3 md:mb-4">
              {roomsCatalog.length > 0 ? `${roomsCatalog.length} Comfortable Room Types Available` : 'Comfortable Rooms Available'}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl text-white mb-4">
              Rooms & Cottages
            </h2>
          </div>

          {/* Room Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {roomsCatalog.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-4 text-center text-gray-300 py-10">
                Room catalog is currently unavailable.
              </div>
            )}

            {roomsCatalog.map((room, index) => {
              const roomImage = getRoomImage(room.room_type);
              const featureList = (room.amenities || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3);

              return (
                <div
                  key={room.id}
                  onClick={() => handleRoomClick({
                    name: room.room_name,
                    price: room.price_per_night,
                    entranceFee: "₱100 entrance fee per person",
                    capacity: `${room.capacity} PEOPLE`,
                    roomNumbers: `ROOMS ${room.room_numbers}`,
                    features: featureList.join(', ') || room.room_type,
                    image: roomImage,
                    description: room.description || ''
                  })}
                  className="group bg-white rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fadeInUp cursor-pointer"
                  style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={roomImage}
                      alt={room.room_name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-2xl text-gray-900 mb-4">{room.room_name}</h3>
                    <p className="text-yellow-700 text-2xl font-bold mb-4">
                      {room.price_per_night} <span className="text-sm font-normal text-gray-500">/ NIGHT</span>
                    </p>
                    <p className="text-xs text-gray-600 mb-4">💰 ₱100 entrance fee per person</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>👥</span>
                        <span>Up to {room.capacity} guests</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🛏️</span>
                        <span>ROOMS {room.room_numbers}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{room.room_type.includes('Aircon') ? '❄️' : '🌀'}</span>
                        <span>{room.room_type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section id="amenities" className="relative py-20 md:py-32 px-4 md:px-12 bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,215,0,0.15),transparent_50%)] animate-pulse" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fadeInDown">
            <p className="text-yellow-600/80 text-xs md:text-sm font-medium tracking-[0.3em] uppercase mb-4">
              Amenities & Services
            </p>
            <h2 className="font-serif text-4xl md:text-6xl text-white mb-4">
              Resort Facilities
            </h2>
          </div>

          {/* Facilities Grid */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Swimming Pools */}
            <div 
              className="text-center group animate-scaleIn cursor-pointer" 
              style={{ animationDelay: '0.1s' }}
              onClick={() => setIsDayPassModalOpen(true)}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-yellow-600/50 flex items-center justify-center group-hover:border-yellow-500 group-hover:scale-110 transition-all duration-500">
                <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 15c1.67-2.83 4.33-4 7-4s5.33 1.17 7 4c1.67-2.83 4.33-4 7-4v2c-2 0-4 1.33-5 3h-2c-1-1.67-3-3-5-3s-4 1.33-5 3H4c-1-1.67-3-3-5-3v-2m0 4c1.67-2.83 4.33-4 7-4s5.33 1.17 7 4c1.67-2.83 4.33-4 7-4v2c-2 0-4 1.33-5 3h-2c-1-1.67-3-3-5-3s-4 1.33-5 3H4c-1-1.67-3-3-5-3v-2z"/>
                </svg>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-white mb-2">Swimming Pools</h3>
              <p className="text-yellow-600 text-lg font-semibold mb-2">₱100 per pax</p>
              <button className="text-yellow-600/80 hover:text-yellow-500 text-sm transition">Click for day pass</button>
            </div>

            {/* Function Hall */}
            <div 
              className="text-center group animate-scaleIn cursor-pointer" 
              style={{ animationDelay: '0.2s' }}
              onClick={() => handleAmenityClick({
                name: 'Function Hall',
                type: 'Function Hall',
                price: '₱10,000',
                capacity: 'Up to 150 guests',
                features: 'Air-conditioned, Stage, Sound System, Catering Services',
                image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop'
              })}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-yellow-600/50 flex items-center justify-center group-hover:border-yellow-500 group-hover:scale-110 transition-all duration-500">
                <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H10.5V12H13.5V15H16L12,19Z"/>
                </svg>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-white mb-2">Function Hall</h3>
              <p className="text-yellow-600 text-lg font-semibold mb-2">₱10,000</p>
              <button className="text-yellow-600/80 hover:text-yellow-500 text-sm transition">Click for details</button>
            </div>

            {/* Event Space */}
            <div 
              className="text-center group animate-scaleIn cursor-pointer" 
              style={{ animationDelay: '0.3s' }}
              onClick={() => handleAmenityClick({
                name: 'Event Space',
                type: 'Event Space',
                price: '₱25,000',
                capacity: 'Up to 300 guests',
                features: 'Open-air, Garden Setting, Lighting, Full Catering, Bar Service',
                image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop'
              })}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-yellow-600/50 flex items-center justify-center group-hover:border-yellow-500 group-hover:scale-110 transition-all duration-500">
                <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,3L2,21H22M12,8.5L16.5,16H7.5M12,13A0.5,0.5 0 0,1 12.5,13.5A0.5,0.5 0 0,1 12,14A0.5,0.5 0 0,1 11.5,13.5A0.5,0.5 0 0,1 12,13Z"/>
                </svg>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-white mb-2">Event Space</h3>
              <p className="text-yellow-600 text-lg font-semibold mb-2">₱25,000</p>
              <button className="text-yellow-600/80 hover:text-yellow-500 text-sm transition">Click for details</button>
            </div>

            {/* 10 Rooms Available */}
            <div className="text-center group animate-scaleIn" style={{ animationDelay: '0.4s' }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-yellow-600/50 flex items-center justify-center group-hover:border-yellow-500 group-hover:scale-110 transition-all duration-500">
                <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,3L2,12H5V20H19V12H22L12,3M11,8H13V11H16V13H13V16H11V13H8V11H11V8Z"/>
                </svg>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-white mb-2">10 Rooms Available</h3>
            </div>

            {/* Cottages & Huts */}
            <div className="text-center group animate-scaleIn" style={{ animationDelay: '0.5s' }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-yellow-600/50 flex items-center justify-center group-hover:border-yellow-500 group-hover:scale-110 transition-all duration-500">
                <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19,9.3V4H17V7.6L12,3L2,12H5V20H11V14H13V20H19V12H22L19,9.3M10,10C10,8.9 10.9,8 12,8C13.1,8 14,8.9 14,10H10Z"/>
                </svg>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-white mb-2">Cottages & Huts</h3>
            </div>

            {/* Maximum 5 Hours */}
            <div className="text-center group animate-scaleIn" style={{ animationDelay: '0.6s' }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-yellow-600/50 flex items-center justify-center group-hover:border-yellow-500 group-hover:scale-110 transition-all duration-500">
                <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22A9,9 0 0,0 21,13A9,9 0 0,0 12,4M12.5,8H11V14L15.2,16.2L16,14.9L12.5,13.2V8Z"/>
                </svg>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-white mb-2">Maximum 5 Hours</h3>
              <p className="text-white/60 text-sm">Amenity Use</p>
            </div>
          </div>
        </div>
      </section>

      {/* Accommodation Check-in/Check-out Section */}
      <section id="accommodation" className="relative h-[600px] md:h-[700px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/image2.png')",
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
          <div className="animate-fadeInDown">
            <p className="text-white/80 text-xs md:text-sm font-medium tracking-[0.3em] uppercase mb-6">
              Check-in & Check-out
            </p>
            <h2 className="font-serif text-4xl md:text-6xl text-white mb-4">
              Check-in: After 12 PM
            </h2>
            <h2 className="font-serif text-4xl md:text-6xl text-white mb-8">
              Check-out: Before 12 PM
            </h2>
            <div className="max-w-2xl mx-auto mb-10">
              <p className="text-white/90 text-base md:text-lg mb-2">
                Strict check-in and check-out policy. Valid ID required upon check-in.
              </p>
              <p className="text-white/90 text-base md:text-lg">
                No cancellation, no refund. Rebooking in case of bad weather.
              </p>
            </div>
            <button className="px-10 py-3 border-2 border-white text-white hover:bg-white hover:text-gray-900 font-medium uppercase tracking-widest transition-all duration-300">
              Book Now
            </button>
          </div>
        </div>
      </section>



      {/* Gallery Section */}
      <section id="gallery" className="relative py-20 md:py-32 bg-gray-950 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          {/* Heading */}
          <div className="text-center mb-12">
            <p className="text-yellow-600 text-xs font-semibold tracking-[0.3em] uppercase mb-3">Photo Gallery</p>
            <h2 className="font-serif text-3xl md:text-5xl text-white">Life at Prisville</h2>
            <p className="text-white/50 mt-4 text-sm max-w-md mx-auto">A glimpse into paradise</p>
          </div>

          {/* Carousel */}
          <div
            className="relative select-none"
            onMouseEnter={() => { galleryHovered.current = true; }}
            onMouseLeave={() => { galleryHovered.current = false; }}
          >
            {/* Film strip viewport */}
            <div
              className="relative w-full rounded-2xl overflow-hidden"
              style={{ aspectRatio: '16/9' }}
            >
              {/* Track */}
              <div
                className="flex h-full transition-transform duration-500 ease-in-out"
                style={{
                  width: `${GALLERY_TOTAL * 100}%`,
                  transform: `translateX(-${(galleryIndex * 100) / GALLERY_TOTAL}%)`,
                }}
              >
                {galleryImages.map((src, i) => (
                  <div
                    key={i}
                    className="h-full flex-shrink-0"
                    style={{ width: `${100 / GALLERY_TOTAL}%` }}
                  >
                    <img
                      src={src}
                      alt={`Resort photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Left arrow */}
              <button
                onClick={() => {
                  setGalleryIndex(prev => (prev - 1 + GALLERY_TOTAL) % GALLERY_TOTAL);
                  startGalleryAutoPlay();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white rounded-full w-11 h-11 flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Right arrow */}
              <button
                onClick={() => {
                  setGalleryIndex(prev => (prev + 1) % GALLERY_TOTAL);
                  startGalleryAutoPlay();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white rounded-full w-11 h-11 flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label="Next image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Counter badge */}
              <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                {galleryIndex + 1} / {GALLERY_TOTAL}
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-5">
              {galleryImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setGalleryIndex(i); startGalleryAutoPlay(); }}
                  className={`rounded-full transition-all duration-300 ${
                    i === galleryIndex
                      ? 'bg-yellow-500 w-6 h-2'
                      : 'bg-white/30 hover:bg-white/60 w-2 h-2'
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {galleryImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => { setGalleryIndex(i); startGalleryAutoPlay(); }}
                  className={`flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    i === galleryIndex
                      ? 'border-yellow-500 opacity-100 scale-105'
                      : 'border-transparent opacity-40 hover:opacity-75'
                  }`}
                >
                  <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 px-4 md:px-12 bg-gradient-to-r from-green-900/30 to-gray-900 border-t border-green-700/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-5xl text-white mb-6">
            Ready to Escape?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Join us for an unforgettable experience where luxury meets nature. 
            Book your stay today and discover the ultimate in hospitality.
          </p>
          <button className="px-12 py-3 rounded-full bg-yellow-700 hover:bg-yellow-800 text-white font-medium uppercase tracking-widest transition">
            Start Booking
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-green-700/20 py-12 px-4 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-serif text-xl text-white mb-4">About Us</h4>
              <p className="text-white/60 text-sm">
                A premier luxury resort destination blending nature with sophistication.
              </p>
            </div>
            <div>
              <h4 className="font-serif text-xl text-white mb-4">Rooms</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-yellow-600 transition">Suites</a></li>
                <li><a href="#" className="hover:text-yellow-600 transition">Villas</a></li>
                <li><a href="#" className="hover:text-yellow-600 transition">Cottages</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-xl text-white mb-4">Services</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-yellow-600 transition">Spa</a></li>
                <li><a href="#" className="hover:text-yellow-600 transition">Restaurant</a></li>
                <li><a href="#" className="hover:text-yellow-600 transition">Events</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-xl text-white mb-4">Contact</h4>
              <p className="text-white/60 text-sm">
                Email: info@luxury.com<br />
                Phone: +1 (555) 123-4567
              </p>
            </div>
          </div>
          <div className="border-t border-green-700/20 pt-8 text-center text-white/50 text-sm">
            <p>&copy; 2025 Luxury Resort. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetailModal 
          isOpen={isRoomModalOpen}
          onClose={() => {
            setIsRoomModalOpen(false);
            setSelectedRoom(null);
          }}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onBookingSuccess={() => {
            // Open room bookings modal after successful booking
            setOpenRoomBookingsTrigger(prev => prev + 1);
          }}
          room={selectedRoom}
        />
      )}

      {/* Amenity Detail Modal */}
      {selectedAmenity && (
        <AmenityDetailModal
          isOpen={isAmenityModalOpen}
          onClose={() => {
            setIsAmenityModalOpen(false);
            setSelectedAmenity(null);
          }}
          isLoggedIn={isLoggedIn}
          onLoginClick={handleLoginClick}
          amenity={selectedAmenity}
        />
      )}

      {/* Day Pass Detail Modal */}
      <DayPassDetailModal
        isOpen={isDayPassModalOpen}
        onClose={() => setIsDayPassModalOpen(false)}
        isLoggedIn={isLoggedIn}
        onLoginClick={handleLoginClick}
        pricePerPax="₱100"
      />

      {/* FAQ Modal */}
      <FAQModal
        isOpen={isFAQModalOpen}
        onClose={() => setIsFAQModalOpen(false)}
      />

      {/* Floating FAQ Button */}
      <button
        onClick={() => setIsFAQModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#2d5240] text-white pl-4 pr-5 py-3 rounded-full shadow-xl border-2 border-white hover:bg-[#3d6b4f] hover:scale-105 transition-all duration-300 group"
        aria-label="Help & FAQ"
      >
        <HelpCircle size={22} className="group-hover:rotate-12 transition-transform flex-shrink-0" />
        <span className="text-sm font-semibold">Help</span>
      </button>
    </div>
  );
}
