import { X, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTimeTracker, useClickTracker } from "@/hooks/use-activity-tracker";
import { compressImage, validateImageFile, createThumbnail } from "@/lib/imageUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onBookingSuccess?: () => void;
  room: {
    name: string;
    price: string;
    entranceFee: string;
    capacity: string;
    roomNumbers: string;
    features: string;
    image: string;
  };
}

// Helper function to extract room type from room name
const extractRoomType = (roomName: string): string => {
  const nameLower = roomName.toLowerCase();
  if (nameLower.includes('premium') || nameLower.includes('luxury')) return 'premium';
  if (nameLower.includes('deluxe')) return 'deluxe';
  if (nameLower.includes('standard')) return 'standard';
  if (nameLower.includes('cottage') || nameLower.includes('kubo')) return 'cottage';
  return 'standard';
};

export default function RoomDetailModal({ isOpen, onClose, isLoggedIn, onLoginClick, onBookingSuccess, room }: RoomDetailModalProps) {
  const roomType = extractRoomType(room.name);
  
  // Track time spent viewing this room
  useTimeTracker(
    'view_room',
    roomType,
    room.name,
    { price: room.price, capacity: room.capacity }
  );
  
  const { trackClick } = useClickTracker();
  
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<Array<{checkIn: string, checkOut: string}>>([]);
  const [dateCheckLoading, setDateCheckLoading] = useState(false);
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    guests: "",
    contactNumber: "",
    specialRequests: "",
    paymentProof: null as File | null,
    extraItems: [] as Array<{ item: string; quantity: number; price: number }>,
  });

  const [extraItemsOptions, setExtraItemsOptions] = useState<Array<{ name: string; price: number; unit: string }>>([]);
  const [selectedExtraItemName, setSelectedExtraItemName] = useState("");
  const [extraItemsLoading, setExtraItemsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Fetch unavailable dates when booking form opens
  useEffect(() => {
    if (showBookingForm && room.roomNumbers) {
      fetchUnavailableDates();
      fetchRoomExtraItems();
    }
  }, [showBookingForm, room.roomNumbers]);

  const parsePriceNumber = (value: string) => {
    const numeric = Number(String(value).replace(/[^\d.]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const fetchRoomExtraItems = async () => {
    try {
      setExtraItemsLoading(true);

      const roomsRes = await fetch('/api/facilities/rooms', { credentials: 'include' });
      const roomsData = await roomsRes.json();
      if (!roomsData.success || !Array.isArray(roomsData.rooms)) {
        setExtraItemsOptions([]);
        return;
      }

      const matchedRoom = roomsData.rooms.find((r: any) => r.room_name === room.name);
      if (!matchedRoom?.id) {
        setExtraItemsOptions([]);
        return;
      }

      const itemsRes = await fetch(`/api/facilities/rooms/${matchedRoom.id}/extra-items`, { credentials: 'include' });
      const itemsData = await itemsRes.json();

      if (!itemsData.success || !Array.isArray(itemsData.items)) {
        setExtraItemsOptions([]);
        return;
      }

      const normalized = itemsData.items
        .filter((item: any) => item?.item_name)
        .map((item: any) => ({
          name: String(item.item_name),
          price: parsePriceNumber(String(item.price || '0')),
          unit: String(item.unit || 'item')
        }));

      setExtraItemsOptions(normalized);
    } catch (error) {
      console.error('Failed to fetch room extra items:', error);
      setExtraItemsOptions([]);
    } finally {
      setExtraItemsLoading(false);
    }
  };

  // Fetch unavailable dates for this room
  const fetchUnavailableDates = async () => {
    try {
      setDateCheckLoading(true);
      const response = await fetch(`/api/bookings/room/unavailable-dates?roomNumbers=${encodeURIComponent(room.roomNumbers)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUnavailableDates(data.unavailableDates || []);
      }
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
    } finally {
      setDateCheckLoading(false);
    }
  };

  // Check if selected dates overlap with unavailable dates
  const checkDateAvailability = (checkIn: string, checkOut: string): boolean => {
    if (!checkIn || !checkOut) return true;
    
    const selectedStart = new Date(checkIn);
    const selectedEnd = new Date(checkOut);
    
    console.log('🔍 Checking availability for:', { checkIn, checkOut });
    console.log('📅 Unavailable dates:', unavailableDates);
    
    for (const booking of unavailableDates) {
      const bookedStart = new Date(booking.checkIn);
      const bookedEnd = new Date(booking.checkOut);
      
      console.log('Comparing with booking:', {
        bookedStart: booking.checkIn,
        bookedEnd: booking.checkOut,
        selectedStart: checkIn,
        selectedEnd: checkOut
      });
      
      // Two date ranges overlap if: selectedStart < bookedEnd AND selectedEnd > bookedStart
      const overlaps = selectedStart < bookedEnd && selectedEnd > bookedStart;
      
      console.log('Overlap detected?', overlaps);
      
      if (overlaps) {
        console.log('❌ DATES OVERLAP - Not available!');
        return false; // Dates overlap with a booked period
      }
    }
    
    console.log('✅ No overlap - Dates available!');
    return true; // No overlap, dates are available
  };

  // Scroll to top when error or loading message changes
  useEffect(() => {
    if ((error || loadingMessage || success) && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [error, loadingMessage, success]);

  if (!isOpen) return null;

  // Calculate number of nights
  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  // Calculate extra items total
  const calculateExtraItemsTotal = () => {
    return formData.extraItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  // Calculate total amount (nights * room price + entrance fee per person + extra items)
  const calculateTotalAmount = () => {
    const nights = calculateNights();
    if (nights === 0) return 0;
    
    const pricePerNight = parseInt(room.price.replace(/[₱,]/g, '')) || 0;
    const entranceFeePerPerson = parseInt(room.entranceFee.replace(/[₱,]/g, '')) || 0;
    const numberOfGuests = parseInt(formData.guests) || 0;
    const extraItemsTotal = calculateExtraItemsTotal();
    
    return (nights * pricePerNight) + (entranceFeePerPerson * numberOfGuests) + extraItemsTotal;
  };

  // Calculate reservation fee (50% of total)
  const calculateReservationFee = () => {
    return Math.ceil(calculateTotalAmount() / 2);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
      setShowBookingForm(false);
      setError("");
      setSuccess("");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const validation = validateImageFile(file, 10);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      setFormData({ ...formData, paymentProof: file });
      setError("");
      setLoadingMessage("Processing image...");
      
      // Create ultra-fast thumbnail for instant preview
      try {
        const thumbnail = await createThumbnail(file);
        setPreviewUrl(thumbnail);
        setLoadingMessage("");
      } catch (err) {
        console.error('Failed to compress image:', err);
        setLoadingMessage("");
        // Fallback to original if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate form before showing confirmation
    if (!formData.checkIn || !formData.checkOut || !formData.guests || !formData.contactNumber) {
      setError("Please fill in all required fields");
      return;
    }

    // Check if selected dates are available
    if (!checkDateAvailability(formData.checkIn, formData.checkOut)) {
      setError("❌ These dates are not available. This room is already booked for the selected period. Please choose different dates.");
      return;
    }

    if (!formData.paymentProof) {
      setError("Please upload payment proof");
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    setLoadingMessage("Submitting booking...");
    setShowConfirmDialog(false);

    try {
      // Validate form
      if (!formData.checkIn || !formData.checkOut || !formData.guests || !formData.contactNumber) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      if (!formData.paymentProof) {
        setError("Please upload payment proof");
        setLoading(false);
        setLoadingMessage("");
        return;
      }

      setLoadingMessage("Checking availability...");
      // Check room availability first
      const availabilityResponse = await fetch(
        `/api/bookings/room/check-availability?roomNumbers=${encodeURIComponent(room.roomNumbers)}&checkIn=${formData.checkIn}&checkOut=${formData.checkOut}`,
        {
          credentials: 'include'
        }
      );

      const availabilityData = await availabilityResponse.json();

      // Only check availability if the API call was successful
      if (availabilityData.success && !availabilityData.available) {
        setError("Sorry, this room is not available for the selected dates. Please choose different dates.");
        setLoading(false);
        setLoadingMessage("");
        return;
      }

      // If availability check failed (e.g., table doesn't exist yet), proceed anyway
      // The backend will handle the validation when creating the booking

      setLoadingMessage("Compressing image...");
      // Compress image before uploading
      const base64Image = await compressImage(formData.paymentProof, 1200, 1200, 0.8);
      
      setLoadingMessage("Submitting booking...");

      const response = await fetch('/api/bookings/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            roomName: room.name,
            roomType: extractRoomType(room.name),
            roomNumbers: room.roomNumbers,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            guests: parseInt(formData.guests),
            contactNumber: formData.contactNumber,
            specialRequests: formData.specialRequests,
            extraItems: formData.extraItems,
            totalAmount: `₱${calculateTotalAmount().toLocaleString()}`,
            paymentProof: base64Image,
          }),
        });

      const data = await response.json();

      if (data.success) {        setLoadingMessage("");
        setSuccess("Booking submitted successfully!");
        
        // Wait briefly to show success message, then navigate to bookings
        setTimeout(() => {
          onClose();
          setShowBookingForm(false);
          setFormData({
            checkIn: "",
            checkOut: "",
            guests: "",
            contactNumber: "",
            specialRequests: "",
            paymentProof: null,
            extraItems: [],
          });
          setPreviewUrl("");
          setSuccess("");
          
          // Navigate to room booking history
          if (onBookingSuccess) {
            onBookingSuccess();
          }
        }, 1500);
      } else {
        setError(data.message || "Booking failed");
      }
      setLoading(false);
      setLoadingMessage("");
    } catch (err) {
      setError("Booking failed. Please try again.");
      setLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalContentRef}
        className="relative w-full max-w-lg sm:max-w-xl lg:max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-2xl animate-scaleIn max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl sm:rounded-2xl">
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600 mx-auto mb-4"></div>
              <p className="text-gray-900 font-semibold text-lg mb-2">{loadingMessage || "Processing..."}</p>
              <p className="text-gray-600 text-sm">Please wait, do not close this window</p>
            </div>
          </div>
        )}
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
            setShowBookingForm(false);
            setError("");
            setSuccess("");
          }}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Close modal"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {!showBookingForm ? (
          // Room Details View
          <div>
            <img
              src={room.image}
              alt={room.name}
              className="w-full h-64 object-cover rounded-t-2xl"
            />
            <div className="p-8">
              <h2 className="font-serif text-3xl text-gray-900 mb-4">{room.name}</h2>
              <p className="text-yellow-700 text-3xl font-bold mb-2">{room.price} <span className="text-sm font-normal text-gray-500">/ NIGHT</span></p>
              <p className="text-sm text-gray-600 mb-6">{room.entranceFee}</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="font-semibold text-gray-900">Capacity</p>
                    <p className="text-gray-600">{room.capacity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛏️</span>
                  <div>
                    <p className="font-semibold text-gray-900">Room Numbers</p>
                    <p className="text-gray-600">{room.roomNumbers}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{room.features.includes('AIRCON') ? '❄️' : '🌀'}</span>
                  <div>
                    <p className="font-semibold text-gray-900">Features</p>
                    <p className="text-gray-600">{room.features}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Reservation Fee:</strong> A deposit is required to confirm your booking. Please upload proof of payment after completing the transfer.
                </p>
              </div>

              {isLoggedIn ? (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full py-3.5 sm:py-3 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white font-semibold rounded-lg transition-colors touch-manipulation text-base sm:text-sm"
                >
                  Book Now
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-700 font-medium">Please log in first to make a booking</p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onLoginClick();
                    }}
                    className="w-full py-3.5 sm:py-3 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white font-semibold rounded-lg transition-colors touch-manipulation text-base sm:text-sm"
                  >
                    Log In
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Booking Form View
          <div className="p-4 sm:p-8">
            <h2 className="font-serif text-xl sm:text-2xl text-gray-900 mb-2">Book {room.name}</h2>
            <p className="text-gray-600 mb-6">Fill in your details to complete the booking</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-green-700 text-base font-medium flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            {loadingMessage && !loading && !loading && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                {loadingMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: Booking Details */}
              <div className="space-y-4">
                <div className="pb-2 border-b-2 border-yellow-200">
                  <h3 className="text-lg font-semibold text-gray-900">📋 Section 1: Booking Details</h3>
                  <p className="text-sm text-gray-600">Fill in your reservation information</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in Date *
                    </label>
                    <input
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => {
                        const newCheckIn = e.target.value;
                        setFormData({ ...formData, checkIn: newCheckIn });
                        setError(""); // Clear previous errors
                        
                        // Check availability if both dates are selected
                        if (newCheckIn && formData.checkOut) {
                          if (!checkDateAvailability(newCheckIn, formData.checkOut)) {
                            setError("❌ These dates are not available. This room is already booked for the selected period. Please choose different dates.");
                          }
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out Date *
                    </label>
                    <input
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => {
                        const newCheckOut = e.target.value;
                        setFormData({ ...formData, checkOut: newCheckOut });
                        setError(""); // Clear previous errors
                        
                        // Check availability if both dates are selected
                        if (formData.checkIn && newCheckOut) {
                          if (!checkDateAvailability(formData.checkIn, newCheckOut)) {
                            setError("❌ These dates are not available. This room is already booked for the selected period. Please choose different dates.");
                          }
                        }
                      }}
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-base"
                      required
                    />
                  </div>
                </div>

                {/* Show booked dates info */}
                {unavailableDates.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900 mb-2">📅 Currently Booked Dates:</p>
                    <div className="text-xs text-blue-700 space-y-1 max-h-24 overflow-y-auto">
                      {unavailableDates.map((booking, index) => (
                        <div key={index}>
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing Breakdown */}
                {formData.checkIn && formData.checkOut && calculateNights() > 0 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">💰 Pricing Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Number of Nights:</span>
                        <span className="font-medium text-gray-900">{calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Room Rate:</span>
                        <span className="font-medium text-gray-900">{room.price} × {calculateNights()} = ₱{(parseInt(room.price.replace(/[₱,]/g, '')) * calculateNights()).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Entrance Fee:</span>
                        <span className="font-medium text-gray-900">
                          {formData.guests ? (
                            `${room.entranceFee} × ${formData.guests} ${parseInt(formData.guests) === 1 ? 'guest' : 'guests'} = ₱${(parseInt(room.entranceFee.replace(/[₱,]/g, '')) * parseInt(formData.guests)).toLocaleString()}`
                          ) : (
                            room.entranceFee + ' per guest'
                          )}
                        </span>
                      </div>
                      {/* Special Requests / Extra Items Breakdown */}
                      {formData.extraItems.length > 0 && (
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="text-sm font-medium text-gray-700 mb-1">Special Requests / Extra Items:</div>
                          {formData.extraItems.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm pl-4">
                              <span className="text-gray-600">{item.item} × {item.quantity}:</span>
                              <span className="font-medium text-gray-900">₱{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-medium pl-4 mt-1">
                            <span className="text-gray-700">Extra Items Subtotal:</span>
                            <span className="text-gray-900">₱{calculateExtraItemsTotal().toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                      <div className="border-t-2 border-yellow-400 pt-2 mt-2 flex justify-between">
                        <span className="font-bold text-gray-900">Total Amount:</span>
                        <span className="font-bold text-yellow-700 text-lg">₱{calculateTotalAmount().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-yellow-300 pt-2">
                        <span className="font-semibold text-gray-900">Reservation Fee (50%):</span>
                        <span className="font-bold text-green-700">₱{calculateReservationFee().toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-300 rounded text-xs text-gray-700">
                      <strong>Note:</strong> Pay the reservation fee now. Remaining balance of ₱{(calculateTotalAmount() - calculateReservationFee()).toLocaleString()} will be paid upon check-in.
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    value={formData.guests}
                    onChange={(e) => {
                      const value = e.target.value;
                      const maxCapacity = parseInt(room.capacity.split(' ')[0]);
                      
                      // Only allow numbers within the valid range
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= maxCapacity)) {
                        setFormData({ ...formData, guests: value });
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent typing if max capacity is reached
                      const maxCapacity = parseInt(room.capacity.split(' ')[0]);
                      const currentValue = parseInt(formData.guests || '0');
                      
                      if (e.key >= '0' && e.key <= '9' && currentValue >= maxCapacity) {
                        e.preventDefault();
                      }
                    }}
                    min="1"
                    max={room.capacity.split(' ')[0]}
                    className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="+63 900 000 0000"
                    className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests / Extra Items (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Add extra items or services to your booking (e.g., extra bedding, meals, equipment)</p>
                  <div className="space-y-3">
                    {/* Add Extra Item Button */}
                    <div className="flex gap-2">
                      <select
                        value={selectedExtraItemName}
                        onChange={(e) => setSelectedExtraItemName(e.target.value)}
                        className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-base"
                        disabled={extraItemsLoading || extraItemsOptions.length === 0}
                      >
                        <option value="">
                          {extraItemsLoading ? 'Loading items...' : extraItemsOptions.length === 0 ? 'No extra items available' : 'Select an item to add...'}
                        </option>
                        {extraItemsOptions.map((item) => (
                          <option key={item.name} value={item.name}>
                            {item.name} - ₱{item.price}/{item.unit}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const selectedName = selectedExtraItemName;
                          if (!selectedName) return;
                          
                          const selectedItem = extraItemsOptions.find(item => item.name === selectedName);
                          if (!selectedItem) return;
                          
                          // Check if item already exists
                          const existingIndex = formData.extraItems.findIndex(item => item.item === selectedName);
                          if (existingIndex >= 0) {
                            // Increase quantity if already exists
                            const updated = [...formData.extraItems];
                            updated[existingIndex].quantity += 1;
                            setFormData({ ...formData, extraItems: updated });
                          } else {
                            // Add new item
                            setFormData({
                              ...formData,
                              extraItems: [...formData.extraItems, {
                                item: selectedName,
                                quantity: 1,
                                price: selectedItem.price
                              }]
                            });
                          }
                          setSelectedExtraItemName('');
                        }}
                        disabled={extraItemsLoading || extraItemsOptions.length === 0 || !selectedExtraItemName}
                        className="px-6 py-3 sm:py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition text-base whitespace-nowrap"
                      >
                        Add Item
                      </button>
                    </div>

                    {/* Selected Extra Items */}
                    {formData.extraItems.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Selected Items:</p>
                        {formData.extraItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.item}</p>
                              <p className="text-xs text-gray-500">₱{item.price} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...formData.extraItems];
                                  if (updated[index].quantity > 1) {
                                    updated[index].quantity -= 1;
                                    setFormData({ ...formData, extraItems: updated });
                                  } else {
                                    updated.splice(index, 1);
                                    setFormData({ ...formData, extraItems: updated });
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                                title="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...formData.extraItems];
                                  updated[index].quantity += 1;
                                  setFormData({ ...formData, extraItems: updated });
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                                title="Increase quantity"
                              >
                                +
                              </button>
                              <span className="ml-2 text-sm font-semibold text-gray-900 w-20 text-right">
                                ₱{(item.price * item.quantity).toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formData.extraItems.filter((_, i) => i !== index);
                                  setFormData({ ...formData, extraItems: updated });
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                                title="Remove item"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Additional Notes / Custom Requests */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Additional Notes or Custom Requests
                      </label>
                      <textarea
                        value={formData.specialRequests}
                        onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                        placeholder="Any other special requests or notes? (e.g., early check-in, dietary restrictions, accessibility needs)"
                        rows={3}
                        className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-base resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Payment Information */}
              <div className="space-y-4">
                <div className="pb-2 border-b-2 border-yellow-200">
                  <h3 className="text-lg font-semibold text-gray-900">💳 Section 2: Reservation Fee Payment</h3>
                  <p className="text-sm text-gray-600">Pay the reservation fee via GCash to confirm your booking</p>
                </div>

                {/* GCash Payment Details */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                      <div className="w-32 h-40 sm:w-40 sm:h-48 bg-white rounded-lg border-2 border-blue-300 overflow-hidden">
                        <img 
                          src="/gcash-qr.jpg" 
                          alt="GCash QR Code" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">GCash Payment Details</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700"><span className="font-medium">Account Name:</span> Prisville Resort</p>
                        <p className="text-gray-700"><span className="font-medium">Mobile Number:</span> +63 912 345 6789</p>
                        {calculateReservationFee() > 0 ? (
                          <p className="text-gray-700"><span className="font-medium">Reservation Fee:</span> <span className="font-bold text-green-700">₱{calculateReservationFee().toLocaleString()}</span></p>
                        ) : (
                          <p className="text-gray-700"><span className="font-medium">Reservation Fee:</span> <span className="text-gray-500 italic">Select dates to see amount</span></p>
                        )}
                      </div>
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded">
                        <p className="text-xs text-gray-700">
                          <strong>Note:</strong> This is a reservation fee (50% of total) to secure your booking. The remaining balance will be paid upon arrival.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Payment Proof */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Payment Proof *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-500 transition-colors">
                    {previewUrl ? (
                      <div className="space-y-2">
                        <img src={previewUrl} alt="Payment proof" className="max-h-40 mx-auto rounded" />
                        <label className="cursor-pointer text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                        <p className="text-sm text-gray-600 mb-1">Click to upload payment proof</p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          required
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 py-3.5 sm:py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation text-base sm:text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 sm:py-3 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base sm:text-sm"
                >
                  {loading ? (loadingMessage || "Submitting...") : "Submit Booking"}
                </button>
              </div>
            </form>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Your Booking</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to submit this booking? Please make sure all details are correct and you have uploaded your payment proof.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmedSubmit}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Yes, Submit Booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}
