import { X, Mail, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ResendVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export default function ResendVerificationModal({ isOpen, onClose, defaultEmail = "" }: ResendVerificationModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyVerified) {
          toast({
            variant: "default",
            title: "Already Verified",
            description: "This account is already verified. You can log in now.",
          });
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setEmailSent(true);
          toast({
            variant: "success",
            title: "Email Sent",
            description: "Check your inbox for the verification email.",
          });
        }
      } else {
        setError(data.message || "Failed to send verification email");
      }
    } catch (err) {
      setError("Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setEmailSent(false);
    setError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition z-10"
        >
          <X size={24} />
        </button>

        {/* Modal Content */}
        <div className="p-8">
          {!emailSent ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="text-blue-600" size={32} />
                </div>
                <h2 className="font-serif text-3xl text-gray-900 mb-2">
                  Resend Verification
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter your email to receive a new verification link
                </p>
              </div>

              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-black"
                    required
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-900">
                    <strong>Note:</strong> The verification link will be valid for 24 hours.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? "Sending..." : "Send Verification Email"}
                </button>
              </form>

              {/* Back to Login */}
              <p className="text-center text-sm text-gray-600 mt-6">
                Already verified?{" "}
                <button 
                  onClick={handleClose}
                  className="text-primary hover:text-primary/80 font-semibold"
                >
                  Log in
                </button>
              </p>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={48} />
                </div>
                <h2 className="font-serif text-3xl text-gray-900 mb-4">
                  Email Sent!
                </h2>
                <p className="text-gray-600 mb-2">
                  We've sent a new verification link to:
                </p>
                <p className="text-gray-900 font-semibold mb-6">
                  {email}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>What to do next:</strong>
                  </p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link</li>
                    <li>Your email will be verified automatically</li>
                    <li>Log in to your account</li>
                  </ol>
                </div>
                <p className="text-xs text-gray-500 mb-6">
                  The link will expire in 24 hours.
                </p>
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-md mb-3"
                >
                  Send Again
                </button>
                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-md"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
