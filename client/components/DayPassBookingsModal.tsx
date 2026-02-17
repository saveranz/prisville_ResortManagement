import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface DayPassBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

interface DayPassBooking {
  id: number;
  booking_date: string;
  number_of_pax: number;
  contact_number: string;
  special_requests: string;
  total_amount: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  guests?: Array<{
    guest_name: string;
    age: number | null;
    gender: string | null;
  }>;
}

export default function DayPassBookingsModal({ isOpen, onClose, userEmail }: DayPassBookingsModalProps) {
  const [bookings, setBookings] = useState<DayPassBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBookings();
    }
  }, [isOpen]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings/day-pass', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookings(data.bookings);
        }
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300"
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl animate-scaleIn max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition z-10"
        >
          <X size={24} />
        </button>

        {/* Modal Content */}
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-2xl">🏊</span>
              </div>
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-gray-900">Day Pass Bookings</h2>
                <p className="text-sm text-gray-600">Swimming & day tours</p>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Day Pass Bookings Yet</h3>
                <p className="text-gray-600 mb-6">You haven't booked any day passes for swimming or tours.</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition"
                >
                  Book a Day Pass
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-serif text-xl text-gray-900 mb-1">
                          Day Pass
                        </h3>
                        <p className="text-sm text-gray-500">Swimming Pool Access</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(booking.status)}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium text-gray-900">{formatDate(booking.booking_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Number of Persons</p>
                        <p className="font-medium text-gray-900">{booking.number_of_pax} pax</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact</p>
                        <p className="font-medium text-gray-900">{booking.contact_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="font-bold text-yellow-700 text-lg">{booking.total_amount}</p>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                        <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                          {booking.special_requests}
                        </p>
                      </div>
                    )}

                    {booking.guests && booking.guests.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Guest Information</p>
                        <div className="space-y-2">
                          {booking.guests.map((guest, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                              <p className="font-medium text-gray-900">{guest.guest_name}</p>
                              <p className="text-sm text-gray-600">
                                {guest.age && `Age: ${guest.age}`}
                                {guest.age && guest.gender && " • "}
                                {guest.gender && `Gender: ${guest.gender.charAt(0).toUpperCase() + guest.gender.slice(1)}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        Booked on {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
