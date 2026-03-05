import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ReceptionistLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Check if user is receptionist or admin
        if (data.user.role === 'receptionist' || data.user.role === 'admin') {
          setSuccess(`Welcome back, ${data.user.name}! Redirecting to dashboard...`);
          setTimeout(() => {
            if (data.user.role === 'admin') {
              window.location.href = '/admin/dashboard';
            } else {
              window.location.href = '/receptionist/dashboard';
            }
          }, 1500);
        } else {
          setError('Access denied. Staff access only.');
          setLoading(false);
        }
      } else {
        setError(data.message || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-2 border-blue-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full shadow-md flex items-center justify-center overflow-hidden bg-white">
            <img src="/PTR-logo.png" alt="Prisville Logo" className="w-full h-full object-cover scale-150" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2 tracking-tight">Staff Portal</h1>
          <p className="text-gray-600 font-medium">Admin & Receptionist Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg shadow-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 font-medium"
              placeholder="receptionist@prisville.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 text-blue-600 py-3.5 rounded-xl font-bold tracking-wide transition-all disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:border-gray-300 hover:shadow-md"
          >
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Main Site
          </a>
        </div>
      </div>
    </div>
  );
}
