import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, XCircle, Info, Activity } from "lucide-react";

export default function Debug() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [bookings, setBookings] = useState<any>(null);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAuth = async () => {
    setLoading(true);
    try {
      console.log('🔍 Debug Page - Checking auth...');
      console.log('🔍 Debug Page - Cookies:', document.cookie);
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      console.log('🔍 Debug Page - Response status:', response.status);
      const data = await response.json();
      console.log('🔍 Debug Page - Response data:', data);
      setAuthStatus(data);
    } catch (error) {
      console.error('❌ Debug Page - Auth check error:', error);
      setAuthStatus({ error: 'Failed to check auth' });
    } finally {
      setLoading(false);
    }
  };

  const checkRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recommendations', { credentials: 'include' });
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      setRecommendations({ error: 'Failed to fetch recommendations' });
    } finally {
      setLoading(false);
    }
  };

  const checkBookings = async () => {
    setLoading(true);
    try {
      const [roomRes, amenityRes, dayPassRes] = await Promise.all([
        fetch('/api/bookings/room', { credentials: 'include' }),
        fetch('/api/bookings/amenity', { credentials: 'include' }),
        fetch('/api/bookings/day-pass', { credentials: 'include' })
      ]);

      const roomData = await roomRes.json();
      const amenityData = await amenityRes.json();
      const dayPassData = await dayPassRes.json();

      setBookings({
        rooms: roomData,
        amenities: amenityData,
        dayPasses: dayPassData
      });
    } catch (error) {
      setBookings({ error: 'Failed to fetch bookings' });
    } finally {
      setLoading(false);
    }
  };

  const checkActivity = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/activity/stats', { credentials: 'include' });
      const data = await response.json();
      setActivityStats(data);
    } catch (error) {
      setActivityStats({ error: 'Failed to fetch activity stats' });
    } finally {
      setLoading(false);
    }
  };

  const runAllChecks = () => {
    checkAuth();
    checkRecommendations();
    checkBookings();
    checkActivity();
  };

  useEffect(() => {
    runAllChecks();
  }, []);

  const renderStatus = (success: boolean) => {
    return success ? 
      <CheckCircle className="text-green-500" size={20} /> : 
      <XCircle className="text-red-500" size={20} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 System Debug Dashboard</h1>
              <p className="text-gray-600">Test and verify the recommendations system</p>
            </div>
            <button
              onClick={runAllChecks}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh All
            </button>
          </div>
        </div>

        {/* Auth Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold">Authentication Status</h2>
            {authStatus && renderStatus(authStatus.success)}
          </div>
          
          {/* Cookie Information */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-1">🍪 Browser Cookies:</p>
            <pre className="text-xs text-blue-800 overflow-auto">
              {document.cookie || '(No cookies found)'}
            </pre>
          </div>

          {authStatus ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm overflow-auto">{JSON.stringify(authStatus, null, 2)}</pre>
            </div>
          ) : (
            <div className="text-gray-500">Click "Refresh All" to check</div>
          )}
          {authStatus?.success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-green-900">✅ User is logged in</p>
                  <p className="text-sm text-green-700">
                    Logged in as: <strong>{authStatus.user?.email}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
          {authStatus && !authStatus.success && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-red-900">❌ User is NOT logged in</p>
                  <p className="text-sm text-red-700">
                    You need to log in to see personalized recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold">Recommendations API</h2>
            {recommendations && renderStatus(recommendations.success)}
          </div>
          {recommendations ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm overflow-auto">{JSON.stringify(recommendations, null, 2)}</pre>
            </div>
          ) : (
            <div className="text-gray-500">Click "Refresh All" to check</div>
          )}
          {recommendations?.success && recommendations.recommendations?.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-green-900">
                    ✅ Recommendations working! ({recommendations.recommendations.length} found)
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    {recommendations.recommendations.map((rec: any, idx: number) => (
                      <li key={idx}>• {rec.title} ({rec.type})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {recommendations?.success && recommendations.recommendations?.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-yellow-900">⚠️ No recommendations generated</p>
                  <p className="text-sm text-yellow-700">
                    This could mean you have no booking history. Try making a booking first.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bookings Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-orange-600" size={24} />
            <h2 className="text-xl font-bold">Your Bookings (Activity Tracker)</h2>
          </div>
          {bookings ? (
            <div className="space-y-4">
              {/* Room Bookings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Room Bookings</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {bookings.rooms?.success && bookings.rooms.bookings?.length > 0 ? (
                    <div>
                      <p className="text-green-600 font-semibold mb-2">
                        ✅ {bookings.rooms.bookings.length} room booking(s)
                      </p>
                      <pre className="text-xs overflow-auto">{JSON.stringify(bookings.rooms.bookings, null, 2)}</pre>
                    </div>
                  ) : (
                    <p className="text-gray-500">No room bookings found</p>
                  )}
                </div>
              </div>

              {/* Amenity Bookings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Amenity Bookings</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {bookings.amenities?.success && bookings.amenities.bookings?.length > 0 ? (
                    <div>
                      <p className="text-green-600 font-semibold mb-2">
                        ✅ {bookings.amenities.bookings.length} amenity booking(s)
                      </p>
                      <pre className="text-xs overflow-auto">{JSON.stringify(bookings.amenities.bookings, null, 2)}</pre>
                    </div>
                  ) : (
                    <p className="text-gray-500">No amenity bookings found</p>
                  )}
                </div>
              </div>

              {/* Day Pass Bookings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Day Pass Bookings</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {bookings.dayPasses?.success && bookings.dayPasses.bookings?.length > 0 ? (
                    <div>
                      <p className="text-green-600 font-semibold mb-2">
                        ✅ {bookings.dayPasses.bookings.length} day pass booking(s)
                      </p>
                      <pre className="text-xs overflow-auto">{JSON.stringify(bookings.dayPasses.bookings, null, 2)}</pre>
                    </div>
                  ) : (
                    <p className="text-gray-500">No day pass bookings found</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Click "Refresh All" to check</div>
          )}
        </div>

        {/* Activity Tracking Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold">👁️ Browsing Activity Tracker</h2>
          </div>
          {activityStats ? (
            activityStats.success ? (
              <div className="space-y-4">
                {/* Viewed Rooms */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🏠 Most Viewed Rooms</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {activityStats.stats?.viewedRooms?.length > 0 ? (
                      <div className="space-y-2">
                        {activityStats.stats.viewedRooms.map((room: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div>
                              <p className="font-semibold">{room.item_name}</p>
                              <p className="text-sm text-gray-600">Type: {room.item_type}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-green-600 font-bold">{room.view_count} views</p>
                              <p className="text-gray-500">{Math.floor(room.total_time / 60)} min spent</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No room views tracked yet</p>
                    )}
                  </div>
                </div>

                {/* Viewed Amenities */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🎉 Most Viewed Amenities</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {activityStats.stats?.viewedAmenities?.length > 0 ? (
                      <div className="space-y-2">
                        {activityStats.stats.viewedAmenities.map((amenity: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div>
                              <p className="font-semibold">{amenity.item_name}</p>
                              <p className="text-sm text-gray-600">Type: {amenity.item_type}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-green-600 font-bold">{amenity.view_count} views</p>
                              <p className="text-gray-500">{Math.floor(amenity.total_time / 60)} min spent</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No amenity views tracked yet</p>
                    )}
                  </div>
                </div>

                {/* Day Pass Views */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🎫 Day Pass Interest</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {activityStats.stats?.dayPassViews?.view_count > 0 ? (
                      <div className="bg-white p-3 rounded border">
                        <p className="text-green-600 font-bold">{activityStats.stats.dayPassViews.view_count} views</p>
                        <p className="text-sm text-gray-600">{Math.floor((activityStats.stats.dayPassViews.total_time || 0) / 60)} minutes spent exploring</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">No day pass views yet</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="font-semibold text-purple-900">📊 How It Works</p>
                  <p className="text-sm text-purple-700 mt-1">
                    The system tracks which rooms, amenities, and services you view, how long you spend looking at them, 
                    and uses this data to generate personalized recommendations - even before you make any bookings!
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-auto">{JSON.stringify(activityStats, null, 2)}</pre>
              </div>
            )
          ) : (
            <div className="text-gray-500">Click "Refresh All" to check</div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">📖 How to Use This Dashboard</h3>
          <ol className="text-sm text-blue-800 space-y-2">
            <li><strong>1. Check Authentication:</strong> Make sure you're logged in. If not, go back to the home page and log in.</li>
            <li><strong>2. Check Recommendations:</strong> If logged in, you should see recommendations. If not, make a booking first.</li>
            <li><strong>3. Check Bookings:</strong> Your bookings are what drive the recommendations. More bookings = better recommendations!</li>
            <li><strong>4. Browser Console:</strong> Open your browser's developer tools (F12) and check the Console tab for detailed logs.</li>
          </ol>
        </div>

        {/* Troubleshooting */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 mb-3">⚠️ Important: Server Restart Required</h3>
          <div className="text-sm text-yellow-800 space-y-3">
            <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-300">
              <p className="font-bold text-lg mb-2">🔄 Sessions are now persisted to disk!</p>
              <p className="mb-3">The server has been updated to use a file-based session store, which means your login sessions will survive server restarts.</p>
              
              <div className="bg-white p-3 rounded border border-yellow-400 mb-3">
                <p className="font-bold mb-2">To fix the "Not Authenticated" issue:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Stop the dev server:</strong> Press <kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl+C</kbd> in your terminal</li>
                  <li><strong>Restart the server:</strong> Run <code className="bg-gray-200 px-2 py-1 rounded">npm run dev</code></li>
                  <li><strong>Login again:</strong> Go to home page and login</li>
                  <li><strong>Test here:</strong> Come back to /debug and it should work!</li>
                </ol>
              </div>

              <p className="text-xs italic">💡 Why? The old in-memory sessions were cleared on every hot-reload. Now sessions are saved to disk and persist across restarts!</p>
            </div>

            <p><strong>If you're still seeing "Not Authenticated" after restarting:</strong></p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Check Cookies:</strong> Look at the "Browser Cookies" section above. You should see a cookie named <code className="bg-yellow-100 px-1 rounded">prisville.sid</code></li>
              <li><strong>Browser Console:</strong> Press F12, go to Console tab, and look for auth-related logs showing your session data</li>
              <li><strong>Clear Browser Data:</strong> Try clearing cookies (Ctrl+Shift+Delete) and login fresh</li>
              <li><strong>Try Incognito Mode:</strong> Test in a private/incognito window</li>
            </ul>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
