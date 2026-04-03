import { X, Eye, EyeOff, Mail, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ForgotPasswordModal from "./ForgotPasswordModal";
import ResendVerificationModal from "./ResendVerificationModal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, role: 'client' | 'admin' | 'receptionist') => void;
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isResendVerificationOpen, setIsResendVerificationOpen] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (data.success) {
        // Show toast notification
        toast({
          variant: "success",
          title: data.requiresVerification 
            ? "Verification Required" 
            : "Registration Successful",
          description: data.requiresVerification 
            ? "Please check your email and verify your account to complete registration." 
            : "Your account has been created.",
        });
        
        // Clear form
        setName("");
        setPassword("");
        
        // If requires verification, show verification pending screen
        if (data.requiresVerification) {
          setError("");
          setRegisteredEmail(email);
          setEmail("");
          setVerificationPending(true);
        } else {
          setEmail("");
          // Switch to login form after 2 seconds (fallback for non-verification flow)
          setTimeout(() => {
            setIsRegistering(false);
          }, 2000);
        }
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Redirect based on user role
        if (data.user.role === 'admin') {
          // Admin - redirect to admin dashboard
          toast({
            variant: "success",
            title: "Login Successful",
            description: `Welcome back, ${data.user.name}`,
            duration: 3000,
          });
          setTimeout(() => {
            window.location.href = '/admin/dashboard';
          }, 1000);
        } else if (data.user.role === 'receptionist') {
          // Receptionist - redirect to receptionist dashboard
          toast({
            variant: "success",
            title: "Login Successful",
            description: `Welcome back, ${data.user.name}`,
            duration: 3000,
          });
          setTimeout(() => {
            window.location.href = '/receptionist/dashboard';
          }, 1000);
        } else {
          // Regular client - stay on main site
          toast({
            variant: "success",
            title: "Login Successful",
            description: `Welcome back, ${data.user.name}`,
            duration: 3000,
          });
          onLogin(email, data.user.role);
          setEmail("");
          setPassword("");
          setError("");
        }
      } else {
        // Check if error is due to unverified email
        if (data.requiresVerification) {
          setUnverifiedEmail(data.email || email);
          setError(data.message || "Please verify your email before logging in.");
        } else {
          setError(data.message || "Invalid email or password");
        }
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-scaleIn max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition z-10"
        >
          <X size={24} />
        </button>

        {/* Modal Content */}
        <div className="p-8">
          {verificationPending ? (
            /* Verification Pending Screen */
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="text-blue-600" size={32} />
              </div>
              <h2 className="font-serif text-3xl text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-600 text-sm mb-2">
                We sent a verification link to:
              </p>
              <p className="text-gray-900 font-semibold mb-6">{registeredEmail}</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
                <p className="text-sm text-blue-900 mb-2"><strong>What to do next:</strong></p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link</li>
                  <li>Come back and log in</li>
                </ol>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Didn't receive the email? Click below to resend.
              </p>

              <button
                type="button"
                disabled={resending}
                onClick={async () => {
                  setResending(true);
                  try {
                    const response = await fetch('/api/auth/resend-verification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: registeredEmail })
                    });
                    const data = await response.json();
                    if (data.success) {
                      toast({
                        variant: "success",
                        title: "Email Sent",
                        description: "A new verification email has been sent. Check your inbox.",
                      });
                    } else {
                      toast({
                        variant: "destructive",
                        title: "Failed",
                        description: data.message || "Could not resend email.",
                      });
                    }
                  } catch {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Failed to resend verification email.",
                    });
                  } finally {
                    setResending(false);
                  }
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 mb-3"
              >
                <RefreshCw size={16} className={resending ? "animate-spin" : ""} />
                {resending ? "Sending..." : "Resend Verification Email"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerificationPending(false);
                  setIsRegistering(false);
                  setError("");
                }}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-md"
              >
                Back to Login
              </button>
            </div>
          ) : (
          <>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center overflow-hidden bg-white">
              <img src="/PTR-logo.png" alt="PTR Logo" className="w-full h-full object-cover scale-150" />
            </div>
            <h2 className="font-serif text-3xl text-gray-900 mb-2">
              {isRegistering ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-600 text-sm">
              {isRegistering ? "Sign up for a new account" : "Sign in to your account"}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={isRegistering ? handleRegister : handleLogin}>
            {/* Error Message */}
            {error && (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
                {/* Show resend verification button if needed */}
                {unverifiedEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResendVerificationOpen(true);
                      onClose();
                    }}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-300"
                  >
                    Resend Verification Email
                  </button>
                )}
              </div>
            )}

            {/* Name Field (Registration only) */}
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-black"
                  required
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-black"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-black"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            {!isRegistering && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button 
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? "Please wait..." : (isRegistering ? "Sign Up" : "Sign In")}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <p className="text-center text-sm text-gray-600 mt-6">
            {isRegistering ? (
              <>
                Already have an account?{" "}
                <button 
                  onClick={() => {
                    setIsRegistering(false);
                    setError("");
                  }}
                  className="text-primary hover:text-primary/80 font-semibold"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button 
                  onClick={() => {
                    setIsRegistering(true);
                    setError("");
                  }}
                  className="text-primary hover:text-primary/80 font-semibold"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
          </>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={isForgotPasswordOpen} 
        onClose={() => setIsForgotPasswordOpen(false)} 
      />

      {/* Resend Verification Modal */}
      <ResendVerificationModal 
        isOpen={isResendVerificationOpen} 
        onClose={() => setIsResendVerificationOpen(false)}
        defaultEmail={unverifiedEmail}
      />
    </div>
  );
}
