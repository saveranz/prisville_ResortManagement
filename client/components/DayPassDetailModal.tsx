import { X, Upload, Trash2 } from "lucide-react";
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

interface DayPassDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  pricePerPax: string;
}

interface Guest {
  name: string;
  age: string;
  gender: string;
}

export default function DayPassDetailModal({ isOpen, onClose, isLoggedIn, onLoginClick, pricePerPax }: DayPassDetailModalProps) {
  // Track time spent viewing day pass
  useTimeTracker(
    'view_daypass',
    'day_pass',
    'Day Pass',
    { pricePerPax }
  );
  
  const { trackClick } = useClickTracker();
  
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    bookingDate: "",
    numberOfPax: "",
    contactNumber: "",
    specialRequests: "",
    paymentProof: null as File | null,
  });
  const [guests, setGuests] = useState<Guest[]>([]);
  const [currentGuest, setCurrentGuest] = useState<Guest>({ name: "", age: "", gender: "" });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Scroll to top when error or loading message changes
  useEffect(() => {
    if ((error || loadingMessage || success) && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [error, loadingMessage, success]);

  if (!isOpen) return null;

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

  const calculateTotalAmount = () => {
    const pax = parseInt(formData.numberOfPax) || 0;
    const priceNum = parseInt(pricePerPax.replace(/[₱,]/g, '')) || 0;
    return pax * priceNum;
  };

  // Calculate reservation fee (50% of total)
  const calculateReservationFee = () => {
    return Math.ceil(calculateTotalAmount() / 2);
  };

  const handleAddGuest = () => {
    if (currentGuest.name.trim()) {
      setGuests([...guests, currentGuest]);
      setCurrentGuest({ name: "", age: "", gender: "" });
    }
  };

  const handleRemoveGuest = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    console.log("=== DAY PASS BOOKING SUBMISSION STARTED ===");
    console.log("Form Data:", {
      bookingDate: formData.bookingDate,
      numberOfPax: formData.numberOfPax,
      contactNumber: formData.contactNumber,
      specialRequests: formData.specialRequests,
      hasPaymentProof: !!formData.paymentProof,
      paymentProofSize: formData.paymentProof?.size,
      paymentProofType: formData.paymentProof?.type,
      numberOfGuests: guests.length,
      guests: guests
    });

    // Validate form
    if (!formData.bookingDate || !formData.numberOfPax || !formData.contactNumber) {
      console.error("❌ Validation failed: Missing required fields");
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.paymentProof) {
      console.error("❌ Validation failed: No payment proof");
      setError("Please upload payment proof");
      return;
    }

    console.log("✅ Form validation passed");

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    setLoadingMessage("Checking availability...");
    setShowConfirmDialog(false);

    try {
      // Check availability first
      console.log("🔍 Checking availability for date:", formData.bookingDate);
      const availabilityResponse = await fetch(
        `/api/bookings/day-pass/check-availability?bookingDate=${formData.bookingDate}`,
        {
          credentials: 'include'
        }
      );

      const availabilityData = await availabilityResponse.json();
      console.log("Availability response:", availabilityData);

      // Only check availability if the API call was successful
      if (availabilityData.success && !availabilityData.available) {
        console.error("❌ Date not available");
        setError("Sorry, day pass is fully booked for this date. Please choose another date.");
        setLoading(false);
        setLoadingMessage("");
        return;
      }
      console.log("✅ Date is available");

      setLoadingMessage("Compressing image...");
      // Compress image before uploading
      console.log("📤 Compressing payment proof...");
      const base64Image = await compressImage(formData.paymentProof, 1200, 1200, 0.8);
      const totalAmount = calculateTotalAmount();

      setLoadingMessage("Submitting booking...");

      const bookingPayload = {
          bookingDate: formData.bookingDate,
          numberOfPax: parseInt(formData.numberOfPax),
          contactNumber: formData.contactNumber,
          specialRequests: formData.specialRequests,
          totalAmount: `₱${totalAmount.toLocaleString()}`,
          paymentProof: base64Image,
          guests: guests,
        };

      console.log("📤 Sending booking request:", {
          ...bookingPayload,
          paymentProof: `[base64 string, ${base64Image.length} characters]`
        });

      const response = await fetch('/api/bookings/day-pass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(bookingPayload),
        });

      console.log("📥 Response status:", response.status, response.statusText);

      const data = await response.json();
        console.log("📥 Response data:", data);

        if (data.success) {
          console.log("✅ Booking submitted successfully!");
          setLoadingMessage("");
          setSuccess("Day pass booking submitted successfully! Waiting for approval.");
          setTimeout(() => {
            onClose();
            setShowBookingForm(false);
            setFormData({
              bookingDate: "",
              numberOfPax: "",
              contactNumber: "",
              specialRequests: "",
              paymentProof: null,
            });
            setGuests([]);
            setCurrentGuest({ name: "", age: "", gender: "" });
            setPreviewUrl("");
            setSuccess("");
          }, 2000);
      } else {
        console.error("❌ Booking failed:", data.message);
        setError(data.message || "Booking failed");
      }
      setLoading(false);
      setLoadingMessage("");
    } catch (err) {
      console.error("❌ Exception during booking submission:", err);
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
          // Day Pass Details View
          <div>
            <img
              src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop"
              alt="Day Pass"
              className="w-full h-64 object-cover rounded-t-2xl"
            />
            <div className="p-8">
              <h2 className="font-serif text-3xl text-gray-900 mb-4">Day Pass</h2>
              <p className="text-yellow-700 text-3xl font-bold mb-6">{pricePerPax} per person</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏊</span>
                  <div>
                    <p className="font-semibold text-gray-900">Pool Access</p>
                    <p className="text-gray-600">Full day access to all swimming pools</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏖️</span>
                  <div>
                    <p className="font-semibold text-gray-900">Resort Facilities</p>
                    <p className="text-gray-600">Use of resort amenities and common areas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <p className="font-semibold text-gray-900">Operating Hours</p>
                    <p className="text-gray-600">8:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Payment Required:</strong> A deposit is required to confirm your day pass booking. Please upload proof of payment after completing the transfer.
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
            <h2 className="font-serif text-xl sm:text-2xl text-gray-900 mb-2">Book Day Pass</h2>
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

            {loadingMessage && !loading && (
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.bookingDate}
                    onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Persons *
                  </label>
                  <input
                    type="number"
                    value={formData.numberOfPax}
                    onChange={(e) => setFormData({ ...formData, numberOfPax: e.target.value })}
                    min="1"
                    className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-base"
                    required
                  />
                  {formData.numberOfPax && (
                    <p className="mt-2 text-sm text-gray-600">
                      Total Amount: <span className="font-bold text-yellow-700">₱{calculateTotalAmount().toLocaleString()}</span>
                    </p>
                  )}
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

                {/* Guest Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guest Information (Optional)
                  </label>
                  
                  {/* Guest List */}
                  {guests.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {guests.map((guest, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{guest.name}</p>
                            <p className="text-sm text-gray-600">
                              {guest.age && `Age: ${guest.age}`}
                              {guest.age && guest.gender && " • "}
                              {guest.gender && `Gender: ${guest.gender.charAt(0).toUpperCase() + guest.gender.slice(1)}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGuest(index)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Guest Form */}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={currentGuest.name}
                        onChange={(e) => setCurrentGuest({ ...currentGuest, name: e.target.value })}
                        placeholder="Guest name"
                        className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={currentGuest.age}
                        onChange={(e) => setCurrentGuest({ ...currentGuest, age: e.target.value })}
                        placeholder="Age"
                        className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <select
                        value={currentGuest.gender}
                        onChange={(e) => setCurrentGuest({ ...currentGuest, gender: e.target.value })}
                        className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 text-sm bg-white"
                      >
                        <option value="">Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={handleAddGuest}
                        disabled={!currentGuest.name || currentGuest.name.trim() === ""}
                        className="w-full px-3 py-2.5 sm:py-2 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 disabled:bg-gray-400 disabled:hover:bg-gray-400 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      >
                        Add
                      </button>
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
                        {formData.numberOfPax && calculateTotalAmount() > 0 && (
                          <>
                            <p className="text-gray-700"><span className="font-medium">Total Amount:</span> ₱{calculateTotalAmount().toLocaleString()}</p>
                            <p className="text-gray-700"><span className="font-medium">Reservation Fee (50%):</span> <span className="font-bold text-green-700">₱{calculateReservationFee().toLocaleString()}</span></p>
                          </>
                        )}
                      </div>
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded">
                        <p className="text-xs text-gray-700">
                          {formData.numberOfPax && calculateTotalAmount() > 0 ? (
                            <>
                              <strong>Note:</strong> Pay 50% reservation fee now (₱{calculateReservationFee().toLocaleString()}). Remaining balance (₱{(calculateTotalAmount() - calculateReservationFee()).toLocaleString()}) will be paid upon arrival.
                            </>
                          ) : (
                            <>
                              <strong>Note:</strong> This is a reservation fee to secure your booking. The remaining balance will be paid upon arrival.
                            </>
                          )}
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
              <AlertDialogContent className="z-[200]">
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
