import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Mail, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    
    if (!tokenParam) {
      setError("Invalid verification link. Please check your email for the correct link.");
      setVerifying(false);
      return;
    }

    verify(tokenParam);
  }, [searchParams]);

  const verify = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: verificationToken })
      });

      const data = await response.json();

      if (data.success) {
        // Redirect immediately to home page with success flag
        navigate('/?verification=success');
      } else {
        setError(data.message || "Failed to verify email");
        setVerifying(false);
      }
    } catch (err) {
      setError("Failed to verify email. Please try again.");
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    // Note: User would need to provide email - for now, redirect to login
    navigate('/?show=resend-verification');
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" />
          <h1 className="font-serif text-2xl text-gray-900 mb-2">
            Verifying Your Email
          </h1>
          <p className="text-gray-600">Please wait while we verify your account...</p>
        </div>
      </div>
    );
  }

  // If verified is true, the component already redirected above
  // This section is only for errors

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="text-red-600" size={48} />
          </div>
          <h1 className="font-serif text-3xl text-gray-900 mb-2">
            Verification Failed
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "We couldn't verify your email address."}
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-yellow-900 mb-2">
              <strong>Common reasons:</strong>
            </p>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>The verification link has expired (24 hours)</li>
              <li>The link has already been used</li>
              <li>The link was copied incorrectly</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/?show=resend-verification')}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              Request New Verification Email
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all duration-300"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
