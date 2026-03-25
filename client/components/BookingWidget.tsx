import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

interface RoomAvailabilityTarget {
  name: string;
  roomNumbers: string;
  capacity: number;
}

const FALLBACK_ROOMS: RoomAvailabilityTarget[] = [
  { name: "Standard Room (Aircon)", roomNumbers: "101, 102, 103", capacity: 4 },
  { name: "Large Family Room", roomNumbers: "104, 108", capacity: 10 },
  { name: "Family Fan Room", roomNumbers: "105, 106, 107", capacity: 8 },
  { name: "Non-Aircon Room", roomNumbers: "109, 110", capacity: 4 },
];

interface BookingWidgetProps {
  onSearch?: (data: { checkIn: string; checkOut: string; guests: number }) => void;
  onAvailabilityCheck?: (data: { 
    availabilityCalendar: {
      date: string;
      availableRooms: number;
      availableAmenities: number;
    }[];
    startDate: string;
    endDate: string;
    guests: number;
  }) => void;
}

export default function BookingWidget({ onSearch, onAvailabilityCheck }: BookingWidgetProps) {
  // Set default dates starting from today
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const [checkInDate, setCheckInDate] = useState(today);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [guests, setGuests] = useState(4);
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [roomsData, setRoomsData] = useState<RoomAvailabilityTarget[]>(FALLBACK_ROOMS);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/facilities/rooms', { credentials: 'include' });
        const data = await response.json();

        if (data.success && Array.isArray(data.rooms) && data.rooms.length > 0) {
          setRoomsData(
            data.rooms.map((room: any) => ({
              name: room.room_name,
              roomNumbers: room.room_numbers,
              capacity: Number(room.capacity) || 1
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch rooms for availability checks:', error);
      }
    };

    fetchRooms();
  }, []);

  const amenitiesData = [
    { name: "Function Hall", type: "function_hall", capacity: 100 },
    { name: "Event Space", type: "event_space", capacity: 50 },
  ];

  const checkAvailability = async () => {
    setIsChecking(true);
    
    try {
      // Generate dates for the next 60 days starting from today
      const today = new Date();
      const dates: string[] = [];
      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      // Check availability for each date
      const availabilityCalendar = await Promise.all(
        dates.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          const checkOut = nextDay.toISOString().split('T')[0];

          // Check room availability for this date
          const roomChecks = await Promise.all(
            roomsData.map(async (room) => {
              try {
                const response = await fetch(
                  `/api/bookings/room/check-availability?roomNumbers=${encodeURIComponent(room.roomNumbers)}&checkIn=${date}&checkOut=${checkOut}`,
                  { credentials: 'include' }
                );
                const data = await response.json();
                return data.available;
              } catch (error) {
                return false;
              }
            })
          );

          // Check amenity availability for this date
          const amenityChecks = await Promise.all(
            amenitiesData.map(async (amenity) => {
              try {
                const response = await fetch(
                  `/api/bookings/amenity/check-availability?amenityType=${encodeURIComponent(amenity.type)}&bookingDate=${date}&startTime=09:00&endTime=17:00`,
                  { credentials: 'include' }
                );
                const data = await response.json();
                return data.available;
              } catch (error) {
                return false;
              }
            })
          );

          return {
            date,
            availableRooms: roomChecks.filter(Boolean).length,
            availableAmenities: amenityChecks.filter(Boolean).length,
          };
        })
      );

      // Call the callback with calendar results
      onAvailabilityCheck?.({
        availabilityCalendar,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        guests,
      });

    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSearch = () => {
    checkAvailability();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0">
      <div className="bg-black/35 backdrop-blur-lg rounded-2xl md:rounded-full border border-white/15 p-4 sm:p-5 md:p-7 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-4">
        
        {/* Check In */}
        <div className="flex flex-col flex-1 md:border-r border-white/10 md:pr-4 py-2 md:py-0">
          <label className="text-white/50 text-xs font-medium tracking-widest uppercase mb-1">Check In</label>
          <input
            type="date"
            value={checkInDate}
            min={today}
            onChange={(e) => setCheckInDate(e.target.value)}
            className="text-white font-serif text-sm md:text-base lg:text-lg bg-transparent border-none outline-none cursor-pointer w-full"
          />
        </div>

        {/* Check Out */}
        <div className="flex flex-col flex-1 md:border-r border-white/10 md:px-4 py-2 md:py-0 border-t md:border-t-0 pt-4 md:pt-0">
          <label className="text-white/50 text-xs font-medium tracking-widest uppercase mb-1">Check Out</label>
          <input
            type="date"
            value={checkOutDate}
            min={checkInDate || today}
            onChange={(e) => setCheckOutDate(e.target.value)}
            className="text-white font-serif text-sm md:text-base lg:text-lg bg-transparent border-none outline-none cursor-pointer w-full"
          />
        </div>

        {/* Guests */}
        <div className="flex flex-col flex-1 md:border-r border-white/10 md:px-4 py-2 md:py-0 relative border-t md:border-t-0 pt-4 md:pt-0">
          <label className="text-white/50 text-xs font-medium tracking-widest uppercase mb-1">Guest</label>
          <button
            onClick={() => setShowGuestMenu(!showGuestMenu)}
            className="flex items-center gap-1 text-white font-serif text-sm md:text-base lg:text-lg bg-transparent border-none outline-none cursor-pointer hover:text-yellow-400 transition whitespace-nowrap justify-start"
          >
            {guests} {guests === 1 ? "GUEST" : "GUESTS"}
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </button>

          {showGuestMenu && (
            <div className="absolute top-full left-0 mt-2 bg-black/90 backdrop-blur-md rounded-lg border border-white/15 p-1 z-20 min-w-[140px] max-w-[200px] w-full">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setGuests(num);
                    setShowGuestMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-white text-sm hover:bg-yellow-600/30 transition rounded"
                >
                  {num} {num === 1 ? "Guest" : "Guests"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isChecking}
          className="px-6 sm:px-7 py-3 md:py-2 rounded-full bg-yellow-700 hover:bg-yellow-800 text-white font-medium text-xs md:text-sm uppercase tracking-widest transition w-full md:w-auto flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Checking...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Check Availability</span>
              <span className="sm:hidden">Search</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
