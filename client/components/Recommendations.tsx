import { useState, useEffect, useCallback, useMemo } from "react";
import { Sparkles } from "lucide-react";

interface Recommendation {
  type: 'room' | 'amenity' | 'daypass' | 'promotion';
  title: string;
  description: string;
  reason: string;
  priority: number;
  itemData?: {
    name: string;
    price?: string;
    image?: string;
    capacity?: string;
    features?: string;
    roomNumbers?: string;
  };
}

interface UserStats {
  totalBookings: number;
  favoriteRoomType: string;
  lastBooking: string | null;
}

interface RecommendationsProps {
  isLoggedIn: boolean;
  onRoomClick?: (room: any) => void;
  onAmenityClick?: (amenity: any) => void;
  onDayPassClick?: () => void;
}

export default function Recommendations({ isLoggedIn, onRoomClick, onAmenityClick, onDayPassClick }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Room and amenity data
  const roomsData = [
    { name: "Standard Room (Aircon)", price: "₱1,800/night", entranceFee: "₱100/person", capacity: "4 guests", roomNumbers: "101, 102, 103", features: "• Air conditioning\n• Private bathroom\n• WiFi\n• Comfortable beds", image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop" },
    { name: "Large Family Room", price: "₱3,700/night", entranceFee: "₱100/person", capacity: "10 guests", roomNumbers: "104, 108", features: "• Air conditioning\n• Spacious layout\n• Multiple beds\n• Perfect for families", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop" },
    { name: "Family Fan Room", price: "₱2,700/night", entranceFee: "₱100/person", capacity: "6-8 guests", roomNumbers: "105, 106, 107", features: "• Natural ventilation\n• Fan cooling\n• Multiple beds\n• Budget-friendly", image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop" },
    { name: "Non-Aircon Room", price: "₱1,000 - ₱1,200/night", entranceFee: "₱100/person", capacity: "2-4 guests", roomNumbers: "109, 110", features: "• Natural ventilation\n• Fan cooling\n• Private bathroom\n• Budget option", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop" },
  ];

  const amenitiesData = [
    { name: "Function Hall", type: "function_hall", price: "₱8,000/day", capacity: "100 guests", features: "• Air conditioned\n• Sound system\n• Tables and chairs\n• Stage area", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop" },
    { name: "Event Space", type: "event_space", price: "₱5,000/day", capacity: "50 guests", features: "• Semi-outdoor\n• Garden view\n• Decorations included\n• Catering available", image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop" },
  ];

  useEffect(() => {
    // Fetch recommendations when component mounts or login state changes
    if (isLoggedIn) {
      fetchRecommendations();
    } else {
      // Clear recommendations when logged out
      setRecommendations([]);
      setUserStats(null);
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchRecommendations = async () => {
    console.log('🔍 Fetching recommendations...');
    setLoading(true);
    try {
      const response = await fetch('/api/recommendations', { credentials: 'include' });
      const data = await response.json();
      console.log('📥 Recommendations API response:', data);
      if (data.success) {
        console.log(`✅ Received ${data.recommendations?.length || 0} recommendations`);
        
        // Enrich recommendations with actual item data
        const enrichedRecommendations = data.recommendations.map((rec: Recommendation) => {
          if (rec.type === 'room') {
            // Find matching room
            const room = roomsData.find(r => r.name === rec.title);
            if (room) {
              return { ...rec, itemData: room };
            }
          } else if (rec.type === 'amenity') {
            // Find matching amenity
            const amenity = amenitiesData.find(a => a.name === rec.title);
            if (amenity) {
              return { ...rec, itemData: amenity };
            }
          }
          return rec;
        });
        
        setRecommendations(enrichedRecommendations);
        setUserStats(data.userStats);
      } else {
        console.log('❌ Recommendations fetch failed:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = useCallback((rec: Recommendation) => {
    if (rec.type === 'room' && rec.itemData && onRoomClick) {
      onRoomClick(rec.itemData);
    } else if (rec.type === 'amenity' && rec.itemData && onAmenityClick) {
      onAmenityClick(rec.itemData);
    } else if (rec.type === 'daypass' && onDayPassClick) {
      onDayPassClick();
    }
  }, [onRoomClick, onAmenityClick, onDayPassClick]);

  // Memoize displayable recommendations
  const displayableRecommendations = useMemo(() => {
    return recommendations.filter(rec => 
      rec.itemData || rec.type === 'promotion' || rec.type === 'daypass'
    );
  }, [recommendations]);

  if (loading) {
    console.log('⏳ Recommendations loading...');
    return null;
  }

  if (displayableRecommendations.length === 0) {
    console.log('ℹ️ No displayable recommendations');
    return null;
  }

  console.log(`🎯 Showing ${displayableRecommendations.length} recommendations`);

  return (
    <div className="bg-gray-900 py-8 sm:py-12 px-2 sm:px-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header - Netflix style */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 px-2 sm:px-4">
          <Sparkles className="text-yellow-500 flex-shrink-0" size={24} />
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              {recommendations.some(r => r.reason.includes('Viewed')) 
                ? 'Because You Viewed' 
                : 'Recommended For You'}
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
              {recommendations.some(r => r.reason.includes('Viewed')) 
                ? 'Based on your recent browsing' 
                : 'Discover what makes Prisville special'}
            </p>
          </div>
        </div>

        {/* Carousel Container - Netflix style */}
        <div className="relative group">
          {/* Scrollable Items */}
          <div
            id="recommendations-scroll"
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2 sm:px-4 pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {displayableRecommendations.map((rec, index) => (
              <div
                key={index}
                onClick={() => handleItemClick(rec)}
                className="flex-shrink-0 w-[260px] sm:w-[280px] md:w-[320px] cursor-pointer group/card transform transition-all duration-300 hover:scale-105 hover:z-10 snap-start touch-manipulation"
              >
                {rec.itemData ? (
                  // Room/Amenity Card with Image
                  <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                    {/* Image */}
                    <div className="relative h-[180px] overflow-hidden">
                      <img
                        src={rec.itemData.image}
                        alt={rec.itemData.name}
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-white font-bold text-lg mb-1">{rec.itemData.name}</h3>
                      <p className="text-yellow-500 font-semibold text-sm mb-2">{rec.itemData.price}</p>
                      <p className="text-gray-400 text-xs mb-3">{rec.reason}</p>
                      
                      {/* Features */}
                      <div className="text-gray-300 text-xs space-y-1">
                        {rec.itemData.capacity && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">👥</span>
                            <span>{rec.itemData.capacity}</span>
                          </div>
                        )}
                        {rec.itemData.roomNumbers && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">🚪</span>
                            <span>Rooms {rec.itemData.roomNumbers}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                ) : (
                  // Promotional/Generic Card
                  <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg p-6 shadow-xl h-full min-h-[280px] flex flex-col justify-between">
                    <div>
                      <h3 className="text-white font-bold text-xl mb-2">{rec.title}</h3>
                      <p className="text-yellow-100 text-sm mb-3">{rec.description}</p>
                    </div>
                    <p className="text-yellow-200 text-xs italic">{rec.reason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
