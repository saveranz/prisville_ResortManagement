import { Link, useNavigate } from "react-router-dom";
import { Menu, User, Calendar, Home, Umbrella, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import LoginModal from "./LoginModal";
import RoomBookingsModal from "./RoomBookingsModal";
import AmenityBookingsModal from "./AmenityBookingsModal";
import DayPassBookingsModal from "./DayPassBookingsModal";

type UserRole = 'client' | 'admin' | 'receptionist' | null;

interface HeaderProps {
  onLoginModalChange?: (isOpen: boolean) => void;
  externalLoginModalOpen?: boolean;
  onLoginSuccess?: () => void;
  onLogoutSuccess?: () => void;
}

export default function Header({ onLoginModalChange, externalLoginModalOpen, onLoginSuccess, onLogoutSuccess }: HeaderProps = {}) {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoomBookingsModalOpen, setIsRoomBookingsModalOpen] = useState(false);
  const [isAmenityBookingsModalOpen, setIsAmenityBookingsModalOpen] = useState(false);
  const [isDayPassBookingsModalOpen, setIsDayPassBookingsModalOpen] = useState(false);

  // Check if user is logged in from server session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUserEmail(data.user.email);
            setUserRole(data.user.role);
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Sync with external login modal state
  useEffect(() => {
    if (externalLoginModalOpen !== undefined && externalLoginModalOpen !== isLoginModalOpen) {
      setIsLoginModalOpen(externalLoginModalOpen);
    }
  }, [externalLoginModalOpen]);

  const handleLogin = (email: string, role: 'client' | 'admin' | 'receptionist') => {
    setUserEmail(email);
    setUserRole(role);
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    
    // Notify parent of successful login
    if (onLoginSuccess) {
      onLoginSuccess();
    }
    
    // Notify parent that modal closed
    if (onLoginModalChange) {
      onLoginModalChange(false);
    }

    // Redirect based on role
    if (role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else if (role === 'receptionist') {
      window.location.href = '/receptionist/dashboard';
    }
    // If role is 'client', stay on current page
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setIsLoggedIn(false);
        setUserEmail("");
        setUserRole(null);
        setIsDropdownOpen(false);
        
        // Notify parent component of logout
        if (onLogoutSuccess) {
          onLogoutSuccess();
        }
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggedIn(false);
      setUserEmail("");
      setUserRole(null);
      setIsDropdownOpen(false);
      
      // Notify parent even on error to reset state
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
    }
  };

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 120; // Height of fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-center px-6 md:px-12 py-4 bg-black/25 backdrop-blur-md border-b border-white/5 relative">
        {/* Left Side: Menu Button */}
        <div className="absolute left-4 md:left-12 flex items-center z-10">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center gap-2 text-white hover:text-primary transition"
          >
            <Menu size={20} />
            <span className="hidden sm:inline text-xs font-medium tracking-widest">Menu</span>
          </button>
        </div>

        {/* Center Content: Navigation + Logo + Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 lg:gap-12 relative z-10">
          {/* Left Navigation Items */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-6">
            {[
              { name: "Rooms", id: "rooms" },
              { name: "Amenities", id: "amenities" },
              { name: "Accommodation", id: "accommodation" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleScrollTo(item.id)}
                className="text-white text-xs font-medium tracking-wide uppercase whitespace-nowrap hover:text-primary transition"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Center Logo */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-2 sm:mx-4 md:mx-6 lg:mx-8 rounded-full border-2 border-white/40 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-serif text-[10px] sm:text-xs md:text-sm font-medium">PTR</span>
          </div>

          {/* Right Navigation Items */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-6">
            {[
              { name: "Experiences", id: "experiences" },
              { name: "Offers", id: "offers" },
              { name: "Contact", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleScrollTo(item.id)}
                className="text-white text-xs font-medium tracking-wide uppercase whitespace-nowrap hover:text-primary transition"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Buttons */}
        <div className="absolute right-4 md:right-12 flex items-center gap-2 sm:gap-3 z-10">
          {isCheckingAuth ? (
            <div className="w-20 h-9 animate-pulse bg-white/10 rounded-full"></div>
          ) : !isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  setIsLoginModalOpen(true);
                  if (onLoginModalChange) {
                    onLoginModalChange(true);
                  }
                }}
                className="px-3 sm:px-6 py-2 rounded-full border border-white/40 hover:border-white text-white text-[10px] sm:text-xs md:text-sm font-medium transition"
              >
                <span className="hidden sm:inline">Login</span>
                <User size={16} className="sm:hidden" />
              </button>
              <Link
                to="/"
                className="px-3 sm:px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-[10px] sm:text-xs md:text-sm font-medium transition"
              >
                <span className="hidden sm:inline">Booking ↗</span>
                <Calendar size={16} className="sm:hidden" />
              </Link>
            </>
          ) : userRole === 'client' ? (
            <>
              <Link
                  to="/"
                  className="px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-xs md:text-sm font-medium transition"
                >
                  Booking ↗
                </Link>
                {/* User Dropdown - Only for Clients */}
                <div className="relative z-[300]">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/40 hover:border-white text-white text-xs md:text-sm font-medium transition"
                  >
                    <User size={16} />
                    <span className="hidden md:inline">Account</span>
                    <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl overflow-hidden animate-fadeInDown z-[300]">
                      {/* User Info */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <p className="text-xs text-gray-500">Signed in as Client</p>
                        <p className="text-sm font-semibold text-black truncate">{userEmail}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setIsRoomBookingsModalOpen(true);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition text-gray-700"
                        >
                          <Home size={18} className="text-primary" />
                          <div>
                            <p className="text-sm font-medium">Room Bookings</p>
                            <p className="text-xs text-gray-500">View your room reservations</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setIsAmenityBookingsModalOpen(true);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition text-gray-700"
                        >
                          <Umbrella size={18} className="text-primary" />
                          <div>
                            <p className="text-sm font-medium">Amenity Bookings</p>
                            <p className="text-xs text-gray-500">Function halls & event spaces</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setIsDayPassBookingsModalOpen(true);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition text-gray-700"
                        >
                          <Calendar size={18} className="text-primary" />
                          <div>
                            <p className="text-sm font-medium">Day Pass Bookings</p>
                            <p className="text-xs text-gray-500">Swimming & day tours</p>
                          </div>
                        </button>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-200">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-50 transition text-red-600"
                        >
                          <LogOut size={18} />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/10 z-30 animate-fadeInDown">
          <div className="px-6 py-4 space-y-4">
            {[
              { name: "Rooms", id: "rooms" },
              { name: "Amenities", id: "amenities" },
              { name: "Accommodation", id: "accommodation" },
              { name: "Experiences", id: "experiences" },
              { name: "Offers", id: "offers" },
              { name: "Contact", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handleScrollTo(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left text-white text-sm font-medium tracking-wide uppercase hover:text-primary transition"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          if (onLoginModalChange) {
            onLoginModalChange(false);
          }
        }}
        onLogin={handleLogin}
      />

      {/* Room Bookings Modal */}
      <RoomBookingsModal
        isOpen={isRoomBookingsModalOpen}
        onClose={() => setIsRoomBookingsModalOpen(false)}
        userEmail={userEmail}
      />

      {/* Amenity Bookings Modal */}
      <AmenityBookingsModal
        isOpen={isAmenityBookingsModalOpen}
        onClose={() => setIsAmenityBookingsModalOpen(false)}
        userEmail={userEmail}
      />

      {/* Day Pass Bookings Modal */}
      <DayPassBookingsModal
        isOpen={isDayPassBookingsModalOpen}
        onClose={() => setIsDayPassBookingsModalOpen(false)}
        userEmail={userEmail}
      />
    </header>
  );
}
