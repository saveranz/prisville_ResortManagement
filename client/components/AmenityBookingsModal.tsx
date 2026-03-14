import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface AmenityBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

interface AmenityBooking {
  id: number;
  amenity_name: string;
  amenity_type: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests: number;
  contact_number: string;
  event_details: string;
  total_amount: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function AmenityBookingsModal({ isOpen, onClose, userEmail }: AmenityBookingsModalProps) {
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (isOpen) {
      fetchBookings();
    }
  }, [isOpen]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings/amenity', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookings(data.bookings);
          setCurrentPage(1); // Reset to first page on new data
        }
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
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

  const formatTime = (timeString: string) => {
    // timeString comes in "HH:MM:SS" format from MySQL
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
                <span className="text-2xl">🏛️</span>
              </div>
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-gray-900">Amenity Bookings</h2>
                <p className="text-sm text-gray-600">Function halls & event spaces</p>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Amenity Bookings Yet</h3>
                <p className="text-gray-600 mb-6">You haven't reserved any function halls or event spaces.</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition"
                >
                  Book an Amenity
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-serif text-xl text-gray-900 mb-1">
                          {booking.amenity_name}
                        </h3>
                        <p className="text-sm text-gray-500">{booking.amenity_type}</p>
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
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium text-gray-900">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Guests</p>
                        <p className="font-medium text-gray-900">{booking.guests} people</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact</p>
                        <p className="font-medium text-gray-900">{booking.contact_number}</p>
                      </div>
                    </div>

                    {booking.event_details && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Event Details</p>
                        <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                          {booking.event_details}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        Booked on {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-yellow-700 font-bold text-lg">{booking.total_amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && bookings.length > itemsPerPage && (
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
