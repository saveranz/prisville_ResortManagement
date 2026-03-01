import { X, Upload } from "lucide-react";
import { useState } from "react";
import { useTimeTracker, useClickTracker } from "@/hooks/use-activity-tracker";
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

export default function RoomDetailModal({ isOpen, onClose, isLoggedIn, onLoginClick, room }: RoomDetailModalProps) {
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
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    guests: "",
    contactNumber: "",
    specialRequests: "",
    paymentProof: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

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

  // Calculate total amount (nights * room price + entrance fee per person)
  const calculateTotalAmount = () => {
    const nights = calculateNights();
    if (nights === 0) return 0;
    
    const pricePerNight = parseInt(room.price.replace(/[₱,]/g, '')) || 0;
    const entranceFeePerPerson = parseInt(room.entranceFee.replace(/[₱,]/g, '')) || 0;
    const numberOfGuests = parseInt(formData.guests) || 0;
    
    return (nights * pricePerNight) + (entranceFeePerPerson * numberOfGuests);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, paymentProof: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        return;
      }

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
        return;
      }

      // If availability check failed (e.g., table doesn't exist yet), proceed anyway
      // The backend will handle the validation when creating the booking

      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(formData.paymentProof);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

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
            totalAmount: `₱${calculateTotalAmount().toLocaleString()}`,
            paymentProof: base64Image,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess("Booking submitted successfully! Waiting for approval.");
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
            });
            setPreviewUrl("");
            setSuccess("");
          }, 2000);
        } else {
          setError(data.message || "Booking failed");
        }
        setLoading(false);
      };
    } catch (err) {
      setError("Booking failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg sm:max-w-xl lg:max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-2xl animate-scaleIn max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
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
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
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
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-base"
                      required
                    />
                  </div>
                </div>

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
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
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
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-gray-900 text-base"
                    placeholder="Any special requirements or requests..."
                  />
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
                  {loading ? "Submitting..." : "Submit Booking"}
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
