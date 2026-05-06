import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import BookNowModal from "@/components/BookNowModal";
import { useSearchParams } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import BookingWidget from "@/components/BookingWidget";
import { PaymentSettingsDisplay } from "@/components/PaymentSettingsDisplay";
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
  const [isBookNowModalOpen, setIsBookNowModalOpen] = useState(false);
  const [isDayPassModalOpen, setIsDayPassModalOpen] = useState(false);
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [searchData, setSearchData] = useState<any>(null);
  const [availabilityResults, setAvailabilityResults] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<any>(null);
  const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false);
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
      <section className="relative w-full h-screen min-h-[700px] overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-zoomSlow"
          style={{
            backgroundImage:
                "linear-gradient(135deg, rgba(15, 45, 35, 0.4) 0%, rgba(10, 25, 40, 0.5) 100%), url('/image2.png')",
            backgroundAttachment: "fixed",
            backgroundPosition: "center",
          }}
        ></div>

        {/* Animated Overlay Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.03),transparent_70%)] animate-pulse"></div>

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center pt-24 sm:pt-32 px-4">
          {/* Main Heading with Enhanced Animation */}
          <div className="text-center px-4 mb-12 sm:mb-16 md:mb-20 animate-fadeInUp">
            <div className="inline-block mb-6">
              <span className="text-yellow-500 text-xs md:text-sm font-semibold tracking-[0.3em] uppercase px-4 py-2 border border-yellow-500/30 rounded-full backdrop-blur-sm bg-yellow-500/10">
                Welcome to Paradise
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-white leading-tight mb-6 sm:mb-8 drop-shadow-2xl">
              Experience Nature<br />
              <span className="text-yellow-500 italic">in Luxury</span>
            </h1>
            <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 leading-relaxed">
              Discover our exclusive collection of luxury accommodations nestled in the heart of Bongabong
            </p>
          </div>

          {/* Booking Widget with Enhanced Styling */}
          <div className="w-full max-w-6xl px-2 sm:px-4 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <BookingWidget 
              onSearch={handleSearch}
              onAvailabilityCheck={handleAvailabilityCheck}
            />
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center gap-2 text-white/60">
              <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 sm:h-40 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent z-20"></div>
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
      <section className="relative py-20 sm:py-24 md:py-32 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left Content */}
            <div className="animate-slideInLeft">
              <div className="inline-block mb-4">
                <span className="text-yellow-700 text-xs md:text-sm font-semibold tracking-[0.3em] uppercase px-4 py-2 border border-yellow-700/30 rounded-full bg-yellow-50">
                  Welcome to Prisville
                </span>
              </div>
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-6 md:mb-8 leading-tight">
                Your Perfect<br />
                <span className="text-yellow-700">Getaway</span> in Bongabong
              </h2>
              
              <div className="space-y-4 md:space-y-5 text-gray-700 text-base sm:text-lg md:text-xl leading-relaxed mb-8 md:mb-10">
                <p className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Located at BB2, Bongabong, Prisville Triangle Resort offers the perfect blend of comfort and nature.</span>
                </p>
                <p className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>10 well-appointed rooms with aircon and fan options, pools, function halls, and event spaces.</span>
                </p>
                <p className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Open daily from <span className="font-bold text-gray-900">6AM to 11PM</span> for day tours and overnight stays.</span>
                </p>
              </div>

              {/* Entrance Fee Box - Enhanced */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-l-4 border-yellow-600 p-6 md:p-8 rounded-xl mb-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.8,10.9C9.53,10.31 8.8,9.7 8.8,8.75C8.8,7.66 9.81,6.9 11.5,6.9C13.28,6.9 13.94,7.75 14,9H16.21C16.14,7.28 15.09,5.7 13,5.19V3H10V5.16C8.06,5.58 6.5,6.84 6.5,8.77C6.5,11.08 8.41,12.23 11.2,12.9C13.7,13.5 14.2,14.38 14.2,15.31C14.2,16 13.71,17.1 11.5,17.1C9.44,17.1 8.63,16.18 8.52,15H6.32C6.44,17.19 8.08,18.42 10,18.83V21H13V18.85C14.95,18.5 16.5,17.35 16.5,15.3C16.5,12.46 14.07,11.5 11.8,10.9Z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Entrance Fee: ₱100 per person</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Required for all guests upon entry. Grants access to all resort facilities including swimming pools and common areas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information - Enhanced */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border border-gray-100 mb-8">
                <h3 className="font-bold text-gray-900 text-lg mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  <a href="tel:09515601087" className="flex items-center gap-4 text-gray-700 hover:text-yellow-700 transition-colors group">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                      <svg className="w-5 h-5 text-yellow-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Phone</div>
                      <div className="font-semibold">09515601087</div>
                    </div>
                  </a>
                  <a href="mailto:prisvilletriangleresort@yahoo.com" className="flex items-center gap-4 text-gray-700 hover:text-yellow-700 transition-colors group">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                      <svg className="w-5 h-5 text-yellow-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
                      <div className="font-semibold text-sm">prisvilletriangleresort@yahoo.com</div>
                    </div>
                  </a>
                  <a href="https://www.facebook.com/prisvilletriangleresort" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-gray-700 hover:text-yellow-700 transition-colors group">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                      <svg className="w-5 h-5 text-yellow-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2.04C6.5,2.04 2,6.53 2,12.06C2,17.06 5.66,21.21 10.44,21.96V14.96H7.9V12.06H10.44V9.85C10.44,7.34 11.93,5.96 14.22,5.96C15.31,5.96 16.45,6.15 16.45,6.15V8.62H15.19C13.95,8.62 13.56,9.39 13.56,10.18V12.06H16.34L15.89,14.96H13.56V21.96A10,10 0 0,0 22,12.06C22,6.53 17.5,2.04 12,2.04Z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Facebook</div>
                      <div className="font-semibold">Prisville Triangle Resort</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Book Now Button - Enhanced */}
              <button
                className="group relative px-10 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold uppercase tracking-widest transition-all duration-300 text-sm sm:text-base w-full sm:w-auto rounded-full shadow-xl hover:shadow-2xl hover:scale-105 overflow-hidden"
                onClick={() => setIsBookNowModalOpen(true)}
              >
                <span className="relative z-10">Book Your Stay Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-700 to-yellow-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>

            {/* Right Content - Image with Enhanced Styling */}
            <div className="animate-slideInRight">
              <div className="relative h-[450px] md:h-[550px] lg:h-[650px] rounded-2xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent z-10"></div>
                <img
                  src="/backgroundimage.png"
                  alt="Prisville Triangle Resort Pool"
                  className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-700"
                />
                {/* Floating Badge */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg z-20">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-gray-900">4.8/5</span>
                    <span className="text-gray-600 text-sm">Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rooms & Cottages Section */}
      <section id="rooms" className="relative py-20 sm:py-24 md:py-32 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.15),transparent_50%)] animate-pulse" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header with enhanced animation */}
          <div className="text-center mb-16 md:mb-20 animate-fadeInUp">
            <div className="inline-block mb-4">
              <span className="text-yellow-500 text-xs md:text-sm font-semibold tracking-[0.3em] uppercase px-4 py-2 border border-yellow-500/30 rounded-full backdrop-blur-sm bg-yellow-500/10">
                {roomsCatalog.length > 0 ? `${roomsCatalog.length} Comfortable Room Types Available` : 'Comfortable Rooms Available'}
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl text-white mb-6">
              Rooms & <span className="text-yellow-500">Cottages</span>
            </h2>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Choose from our selection of comfortable accommodations designed for your perfect stay
            </p>
          </div>

          {/* Room Cards Grid with enhanced design */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {roomsCatalog.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-4 text-center text-gray-300 py-16 bg-white/5 rounded-2xl backdrop-blur-sm">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <p className="text-lg">Room catalog is currently unavailable.</p>
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
                  className="group bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 animate-fadeInUp cursor-pointer border border-gray-100"
                  style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                >
                  <div className="relative h-72 overflow-hidden">
                    <img
                      src={roomImage}
                      alt={room.room_name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                    
                    {/* Floating Price Badge */}
                    <div className="absolute top-4 right-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-full font-bold shadow-lg">
                      {room.price_per_night}
                    </div>
                    
                    {/* Room Type Badge */}
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-900">
                      {room.room_type.includes('Aircon') ? '❄️ Air-Conditioned' : '🌀 Fan Room'}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-serif text-2xl text-gray-900 mb-3 group-hover:text-yellow-700 transition-colors">{room.room_name}</h3>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        Up to {room.capacity}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        Rooms {room.room_numbers}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <button className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold group-hover:bg-yellow-600 transition-colors duration-300 flex items-center justify-center gap-2">
                        View Details
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
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
              <button className="text-yellow-600/80 hover:text-yellow-500 text-sm transition">Click for details</button>
            </div>

            {/* Event Space */}
            <div 
              className="text-center group animate-scaleIn cursor-pointer" 
              style={{ animationDelay: '0.3s' }}
              onClick={() => handleAmenityClick({
                name: 'Event Space',
                type: 'Event Space',
                price: '₱10,000',
                capacity: 'Up to 300 guests',
                features: 'Rental of venue includes tables and chairs. Reservations for occasions, birthdays, weddings, meetings. Packages per pax/per plate',
                image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop'
              })}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-yellow-600/50 flex items-center justify-center group-hover:border-yellow-500 group-hover:scale-110 transition-all duration-500">
                <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,3L2,21H22M12,8.5L16.5,16H7.5M12,13A0.5,0.5 0 0,1 12.5,13.5A0.5,0.5 0 0,1 12,14A0.5,0.5 0 0,1 11.5,13.5A0.5,0.5 0 0,1 12,13Z"/>
                </svg>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-white mb-2">Event Space</h3>
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
          </div>
        </div>
      </section>

      {/* Day Pass Booking Information Section */}
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
              Day Pass Booking Information
            </p>
            <h2 className="font-serif text-4xl md:text-6xl text-white mb-4">
              Check-in: After 1 PM
            </h2>
            <h2 className="font-serif text-4xl md:text-6xl text-white mb-8">
              Check-out: Before 11 AM
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
      {/* Book Now Modal (always at root for proper overlay) */}
      <BookNowModal
        isOpen={isBookNowModalOpen}
        onClose={() => setIsBookNowModalOpen(false)}
        onBookDayPass={handleBookDayPass}
        onBookRoom={handleBookRoom}
        onBookAmenity={handleBookAmenity}
      />
    </div>
  );
}
