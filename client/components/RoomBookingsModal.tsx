import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

interface Booking {
  id: number;
  room_name: string;
  room_numbers: string;
  check_in: string;
  check_out: string;
  guests: number;
  contact_number: string;
  special_requests: string;
  total_amount: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface RoomBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export default function RoomBookingsModal({ isOpen, onClose }: RoomBookingsModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (isOpen) {
      fetchBookings();
    }
  }, [isOpen]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings/room', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
        setCurrentPage(1); // Reset to first page on new data
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return bookings.slice(startIndex, endIndex);
  }, [bookings, currentPage]);

  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
                <span className="text-2xl">🏠</span>
              </div>
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-gray-900">Room Bookings</h2>
                <p className="text-sm text-gray-600">Your room reservations</p>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading bookings...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : bookings.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Room Bookings Yet</h3>
                <p className="text-gray-600 mb-6">You haven't made any room reservations.</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition"
                >
                  Book a Room
                </button>
              </div>
            ) : (
              /* Bookings Grid */
              <div className="space-y-4">
                {paginatedBookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{booking.room_name}</h3>
                        <p className="text-sm text-gray-600">{booking.room_numbers}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Check-in</p>
                        <p className="font-medium text-gray-900">
                          {new Date(booking.check_in).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Check-out</p>
                        <p className="font-medium text-gray-900">
                          {new Date(booking.check_out).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Guests</p>
                        <p className="font-medium text-gray-900">{booking.guests} people</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Contact</p>
                        <p className="font-medium text-gray-900">{booking.contact_number}</p>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="mb-3">
                        <p className="text-gray-500 text-sm">Special Requests</p>
                        <p className="text-gray-700 text-sm">{booking.special_requests}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <p className="text-gray-500 text-sm">
                        Booked on {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                      <p className="font-bold text-yellow-700">{booking.total_amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && bookings.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, bookings.length)} of {bookings.length} bookings
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="px-4 py-1 text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
