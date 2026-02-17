import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface BookingWidgetProps {
  onSearch?: (data: { checkIn: string; checkOut: string; guests: number }) => void;
}

export default function BookingWidget({ onSearch }: BookingWidgetProps) {
  const [checkInDate, setCheckInDate] = useState("2025-01-16");
  const [checkOutDate, setCheckOutDate] = useState("2025-01-18");
  const [guests, setGuests] = useState(4);
  const [showGuestMenu, setShowGuestMenu] = useState(false);

  const handleSearch = () => {
    onSearch?.({ checkIn: checkInDate, checkOut: checkOutDate, guests });
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
          className="px-6 sm:px-7 py-3 md:py-2 rounded-full bg-yellow-700 hover:bg-yellow-800 text-white font-medium text-xs md:text-sm uppercase tracking-widest transition w-full md:w-auto flex-shrink-0"
        >
          <span className="hidden sm:inline">Check Availability</span>
          <span className="sm:hidden">Search</span>
        </button>
      </div>
    </div>
  );
}
