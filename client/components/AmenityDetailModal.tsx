import { X, Upload } from "lucide-react";
import { useState } from "react";
import { useTimeTracker, useClickTracker } from "@/hooks/use-activity-tracker";

interface AmenityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  amenity: {
    name: string;
    type: string;
    price: string;
    capacity: string;
    features: string;
    image: string;
  };
}

export default function AmenityDetailModal({ isOpen, onClose, isLoggedIn, onLoginClick, amenity }: AmenityDetailModalProps) {
  // Track time spent viewing this amenity
  useTimeTracker(
    'view_amenity',
    amenity.type,
    amenity.name,
    { price: amenity.price, capacity: amenity.capacity }
  );
  
  const { trackClick } = useClickTracker();
  
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    bookingDate: "",
    startTime: "",
    endTime: "",
    guests: "",
    contactNumber: "",
    eventDetails: "",
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
      if (!formData.bookingDate || !formData.startTime || !formData.endTime || !formData.guests || !formData.contactNumber) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      if (!formData.paymentProof) {
        setError("Please upload payment proof");
        setLoading(false);
        return;
      }

      // Check amenity availability first
      const availabilityResponse = await fetch(
        `/api/bookings/amenity/check-availability?amenityType=${encodeURIComponent(amenity.type)}&bookingDate=${formData.bookingDate}&startTime=${formData.startTime}&endTime=${formData.endTime}`,
        {
          credentials: 'include'
        }
      );

      const availabilityData = await availabilityResponse.json();

      // Only check availability if the API call was successful
      if (availabilityData.success && !availabilityData.available) {
        setError("Sorry, this amenity is not available for the selected date and time. Please choose different time slot.");
        setLoading(false);
        return;
      }

      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(formData.paymentProof);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const response = await fetch('/api/bookings/amenity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            amenityName: amenity.name,
            amenityType: amenity.type,
            bookingDate: formData.bookingDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
            guests: parseInt(formData.guests),
            contactNumber: formData.contactNumber,
            eventDetails: formData.eventDetails,
            totalAmount: amenity.price,
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
              bookingDate: "",
              startTime: "",
              endTime: "",
              guests: "",
              contactNumber: "",
              eventDetails: "",
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
          // Amenity Details View
          <div>
            <img
              src={amenity.image}
              alt={amenity.name}
              className="w-full h-64 object-cover rounded-t-2xl"
            />
            <div className="p-8">
              <h2 className="font-serif text-3xl text-gray-900 mb-4">{amenity.name}</h2>
              <p className="text-yellow-700 text-3xl font-bold mb-6">{amenity.price}</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="font-semibold text-gray-900">Capacity</p>
                    <p className="text-gray-600">{amenity.capacity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <p className="font-semibold text-gray-900">Features</p>
                    <p className="text-gray-600">{amenity.features}</p>
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
            <h2 className="font-serif text-2xl text-gray-900 mb-2">Book {amenity.name}</h2>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Date *
                </label>
                <input
                  type="date"
                  value={formData.bookingDate}
                  onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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
                  Event Details (Optional)
                </label>
                <textarea
                  value={formData.eventDetails}
                  onChange={(e) => setFormData({ ...formData, eventDetails: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-gray-900"
                  placeholder="Describe your event, special requirements..."
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
