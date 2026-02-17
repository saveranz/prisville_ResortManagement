import { X, Upload } from "lucide-react";
import { useState } from "react";
import { useTimeTracker, useClickTracker } from "@/hooks/use-activity-tracker";

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
    setSuccess("");
    setLoading(true);

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
            totalAmount: room.price,
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
            setShowBookingForm(false);
            setError("");
            setSuccess("");
          }}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
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
                  className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors"
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
                    className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Log In
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Booking Form View
          <div className="p-8">
            <h2 className="font-serif text-2xl text-gray-900 mb-2">Book {room.name}</h2>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
              </div>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-gray-900"
                  placeholder="Any special requirements or requests..."
                />
              </div>

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

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Submit Booking"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
