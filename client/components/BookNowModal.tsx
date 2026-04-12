import React from "react";

interface BookNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookDayPass: () => void;
  onBookRoom: () => void;
  onBookAmenity: () => void;
}

export default function BookNowModal({ isOpen, onClose, onBookDayPass, onBookRoom, onBookAmenity }: BookNowModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xs text-center relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <span className="text-xl">×</span>
        </button>
        <h3 className="text-lg font-semibold mb-6 text-gray-900">What would you like to book?</h3>
        <div className="space-y-4">
          <button
            className="w-full py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-semibold transition"
            onClick={() => { onBookDayPass(); onClose(); }}
          >
            Book Day Pass
          </button>
          <button
            className="w-full py-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold transition"
            onClick={() => { onBookRoom(); onClose(); }}
          >
            Book Rooms
          </button>
          <button
            className="w-full py-3 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold transition"
            onClick={() => { onBookAmenity(); onClose(); }}
          >
            Book Amenities
          </button>
        </div>
      </div>
    </div>
  );
}
