import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket } from "mysql2";

interface BookingHistory extends RowDataPacket {
  room_name?: string;
  room_type?: string;
  amenity_type?: string;
  total_bookings: number;
  last_booking: Date;
}

interface Recommendation {
  type: 'room' | 'amenity' | 'daypass' | 'promotion';
  title: string;
  description: string;
  reason: string;
  priority: number;
}

// Get personalized recommendations for logged-in user
export const getUserRecommendations: RequestHandler = async (req, res) => {
  try {
    console.log('=== Recommendations API called ===');
    console.log('Session:', { 
      userId: req.session.userId, 
      userEmail: req.session.userEmail,
      sessionId: req.sessionID 
    });
    
    const isLoggedIn = !!req.session.userId;
    console.log(isLoggedIn ? '✅ User authenticated' : 'ℹ️ Anonymous user');

    const recommendations: Recommendation[] = [];
    let totalBookings = 0;
    let roomBookings: BookingHistory[] = [];
    let amenityBookings: BookingHistory[] = [];
    let dayPassBookings: BookingHistory[] = [];

    // Get user's booking history (only for logged-in users)
    if (isLoggedIn) {
      [roomBookings] = await db.query<BookingHistory[]>(
        `SELECT room_name, COUNT(*) as total_bookings, MAX(created_at) as last_booking
         FROM room_bookings 
         WHERE user_id = ? AND status = 'approved'
         GROUP BY room_name
         ORDER BY total_bookings DESC, last_booking DESC`,
        [req.session.userId]
      );

      [amenityBookings] = await db.query<BookingHistory[]>(
        `SELECT amenity_type, COUNT(*) as total_bookings, MAX(created_at) as last_booking
         FROM amenity_bookings 
         WHERE user_id = ? AND status = 'approved'
         GROUP BY amenity_type
         ORDER BY total_bookings DESC`,
        [req.session.userId]
      );

      [dayPassBookings] = await db.query<BookingHistory[]>(
        `SELECT COUNT(*) as total_bookings, MAX(created_at) as last_booking
         FROM day_pass_bookings 
         WHERE user_id = ? AND status = 'approved'`,
        [req.session.userId]
      );

      const [allBookings] = await db.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total_count FROM (
          SELECT id FROM room_bookings WHERE user_id = ? AND status = 'approved'
          UNION ALL
          SELECT id FROM amenity_bookings WHERE user_id = ? AND status = 'approved'
          UNION ALL
          SELECT id FROM day_pass_bookings WHERE user_id = ? AND status = 'approved'
        ) as all_bookings`,
        [req.session.userId, req.session.userId, req.session.userId]
      );

      totalBookings = allBookings[0]?.total_count || 0;

      console.log('📊 User booking stats:', {
        totalBookings,
        roomBookingsCount: roomBookings.length,
        amenityBookingsCount: amenityBookings.length,
        dayPassBookingsCount: dayPassBookings.length
      });
    }

    // Get user's browsing activity (what they viewed)
    // For logged-in users: look at ALL activities across all sessions
    // For anonymous users: look at current session activities
    let viewedRooms: RowDataPacket[] = [];
    let viewedAmenities: RowDataPacket[] = [];
    let viewedDayPass: RowDataPacket[] = [];

    try {
      if (isLoggedIn) {
        // Query by user_id for logged-in users
        [viewedRooms] = await db.query<RowDataPacket[]>(
          `SELECT item_type, item_name, COUNT(*) as view_count, SUM(time_spent) as total_time
           FROM user_activity_tracking
           WHERE user_id = ? AND activity_type = 'view_room' AND item_type IS NOT NULL
           GROUP BY item_type, item_name
           ORDER BY view_count DESC, total_time DESC
           LIMIT 5`,
          [req.session.userId]
        );

        [viewedAmenities] = await db.query<RowDataPacket[]>(
          `SELECT item_type, item_name, COUNT(*) as view_count, SUM(time_spent) as total_time
           FROM user_activity_tracking
           WHERE user_id = ? AND activity_type = 'view_amenity' AND item_type IS NOT NULL
           GROUP BY item_type, item_name
           ORDER BY view_count DESC, total_time DESC
           LIMIT 5`,
          [req.session.userId]
        );

        [viewedDayPass] = await db.query<RowDataPacket[]>(
          `SELECT COUNT(*) as view_count, SUM(time_spent) as total_time
           FROM user_activity_tracking
           WHERE user_id = ? AND activity_type = 'view_daypass'`,
          [req.session.userId]
        );
      } else {
        // Query by session_id for anonymous users
        [viewedRooms] = await db.query<RowDataPacket[]>(
          `SELECT item_type, item_name, COUNT(*) as view_count, SUM(time_spent) as total_time
           FROM user_activity_tracking
           WHERE session_id = ? AND activity_type = 'view_room' AND item_type IS NOT NULL
           GROUP BY item_type, item_name
           ORDER BY view_count DESC, total_time DESC
           LIMIT 5`,
          [req.sessionID]
        );

        [viewedAmenities] = await db.query<RowDataPacket[]>(
          `SELECT item_type, item_name, COUNT(*) as view_count, SUM(time_spent) as total_time
           FROM user_activity_tracking
           WHERE session_id = ? AND activity_type = 'view_amenity' AND item_type IS NOT NULL
           GROUP BY item_type, item_name
           ORDER BY view_count DESC, total_time DESC
           LIMIT 5`,
          [req.sessionID]
        );

        [viewedDayPass] = await db.query<RowDataPacket[]>(
          `SELECT COUNT(*) as view_count, SUM(time_spent) as total_time
           FROM user_activity_tracking
           WHERE session_id = ? AND activity_type = 'view_daypass'`,
          [req.sessionID]
        );
      }

      console.log('👁️ Browsing stats:', {
        viewedRoomsCount: viewedRooms.length,
        viewedAmenitiesCount: viewedAmenities.length,
        dayPassViews: viewedDayPass[0]?.view_count || 0
      });
    } catch (error) {
      console.log('⚠️ Activity tracking table might not exist yet:', error);
      // Continue without browsing recommendations if table doesn't exist
    }

    // Rule 0: Recommend based on what they viewed (browsing behavior)
    // Works for both logged-in and anonymous users
    if (viewedRooms.length > 0) {
      console.log('📍 Showing recommendations based on viewed rooms:', viewedRooms.length);
      // Show top 3 viewed rooms
      viewedRooms.slice(0, 3).forEach((room, index) => {
        const viewCount = room.view_count;
        const timeSpent = room.total_time || 0;
        
        recommendations.push({
          type: 'room',
          title: `${room.item_name}`,
          description: `You've shown interest in this room. Book now for a comfortable stay!`,
          reason: 'Recommended for you',
          priority: 10 - index // First viewed gets highest priority
        });
      });
    }

    if (viewedAmenities.length > 0) {
      console.log('📍 Showing recommendations based on viewed amenities:', viewedAmenities.length);
      // Show top 3 viewed amenities
      viewedAmenities.slice(0, 3).forEach((amenity, index) => {
        recommendations.push({
          type: 'amenity',
          title: `${amenity.item_name}`,
          description: `Perfect for your event needs. Reserve your spot today!`,
          reason: 'Recommended for you',
          priority: 9 - index
        });
      });
    }

    if (viewedDayPass.length > 0 && viewedDayPass[0]?.view_count >= 1) {
      console.log('📍 Showing day pass recommendation');
      recommendations.push({
        type: 'daypass',
        title: 'Day Pass Experience',
        description: 'Experience our resort facilities for a day - perfect for a quick getaway!',
        reason: 'Recommended for you',
        priority: 8
      });
    }

    // Only show generic recommendations if user has NO browsing activity at all
    if (recommendations.length === 0 && viewedRooms.length === 0 && viewedAmenities.length === 0 && (viewedDayPass.length === 0 || viewedDayPass[0]?.view_count === 0)) {
      console.log('ℹ️ No activity detected, showing welcome recommendations');
      
      recommendations.push({
        type: 'promotion',
        title: '✨ Welcome to Prisville!',
        description: 'Start exploring our resort - browse rooms, amenities, and day pass options to get personalized recommendations.',
        reason: 'Discover our offerings',
        priority: 10
      });

      recommendations.push({
        type: 'room',
        title: 'Explore Our Rooms',
        description: 'Discover our comfortable accommodations for your perfect stay.',
        reason: 'Popular choice',
        priority: 7
      });

      recommendations.push({
        type: 'amenity',
        title: 'Check Out Our Amenities',
        description: 'From function halls to event spaces, perfect for your special occasions.',
        reason: 'Popular choice',
        priority: 6
      });

      recommendations.push({
        type: 'daypass',
        title: 'Day Pass Available',
        description: 'Enjoy our resort facilities with our convenient day pass option.',
        reason: 'Popular choice',
        priority: 5
      });
    }

    // Rule 1: Recommend rooms based on previous stays (for logged-in users with bookings)
    if (isLoggedIn && roomBookings.length > 0) {
      const favoriteRoom = roomBookings[0];
      const roomName = favoriteRoom.room_name.toLowerCase();
      
      if (roomName.includes('deluxe')) {
        recommendations.push({
          type: 'room',
          title: 'Upgrade to Premium Suite',
          description: 'Experience luxury with our Premium Suites - perfect for your next stay!',
          reason: 'Recommended for you',
          priority: 9
        });
      } else if (roomName.includes('standard')) {
        recommendations.push({
          type: 'room',
          title: 'Try Our Deluxe Rooms',
          description: 'Enhance your experience with more space and better amenities.',
          reason: 'Recommended for you',
          priority: 8
        });
      }
    }

    // Rule 2: Recommend amenities based on booking patterns
    if (amenityBookings.length > 0) {
      const hasEventSpace = amenityBookings.some(b => b.amenity_type === 'event_space');
      const hasFunctionHall = amenityBookings.some(b => b.amenity_type === 'function_hall');
      
      if (hasEventSpace && !hasFunctionHall) {
        recommendations.push({
          type: 'amenity',
          title: 'Function Hall Special Offer',
          description: 'Host your next event in our spacious function hall with 20% off!',
          reason: 'Recommended for you',
          priority: 7
        });
      } else if (hasFunctionHall && !hasEventSpace) {
        recommendations.push({
          type: 'amenity',
          title: 'Intimate Event Space Available',
          description: 'Book our cozy event space for smaller, more personal gatherings.',
          reason: 'Recommended for you',
          priority: 6
        });
      }
    }

    // Rule 3: Day pass recommendations
    if (dayPassBookings.length > 0 && dayPassBookings[0].total_bookings >= 2) {
      recommendations.push({
        type: 'daypass',
        title: 'Day Pass Loyalty Discount',
        description: 'Get 15% off your next day pass booking as a valued returning guest!',
        reason: 'Recommended for you',
        priority: 8
      });
    } else if (dayPassBookings.length === 0) {
      recommendations.push({
        type: 'daypass',
        title: 'Try Our Day Pass Experience',
        description: 'Enjoy our resort facilities for a day - perfect for a quick getaway!',
        reason: 'Popular choice',
        priority: 5
      });
    }

    // Rule 4: Loyalty rewards for frequent guests
    if (totalBookings >= 5) {
      recommendations.push({
        type: 'promotion',
        title: '🎉 VIP Guest Status',
        description: 'Congratulations! You\'re one of our valued VIP guests. Enjoy exclusive perks!',
        reason: 'Special offer for you',
        priority: 10
      });
    } else if (totalBookings >= 3) {
      recommendations.push({
        type: 'promotion',
        title: 'Frequent Guest Bonus',
        description: 'Book 2 more times to unlock VIP status and exclusive benefits!',
        reason: 'Special offer for you',
        priority: 7
      });
    }

    // Rule 5: Seasonal recommendations
    const currentMonth = new Date().getMonth();
    const isSummer = currentMonth >= 3 && currentMonth <= 7; // April to August
    const isHoliday = currentMonth === 11 || currentMonth === 0; // December or January

    if (isSummer && dayPassBookings.length === 0) {
      recommendations.push({
        type: 'promotion',
        title: '☀️ Summer Pool Party Special',
        description: 'Beat the heat! Day pass with BBQ lunch buffet at special rates.',
        reason: 'Limited time offer',
        priority: 8
      });
    }

    if (isHoliday) {
      recommendations.push({
        type: 'promotion',
        title: '🎄 Holiday Celebration Package',
        description: 'Book now for the holiday season with up to 30% off on stays!',
        reason: 'Limited time offer',
        priority: 9
      });
    }

    // Rule 6: First-time logged-in user without bookings (but has browsing activity)
    if (isLoggedIn && totalBookings === 0 && recommendations.length > 0) {
      recommendations.push({
        type: 'promotion',
        title: '✨ Ready to Book?',
        description: 'First-time guest discount: 10% off your first booking!',
        reason: 'Special offer for you',
        priority: 10
      });
    }

    // Rule 6.5: General recommendations for logged-in users with pending bookings
    if (isLoggedIn && totalBookings > 0 && roomBookings.length === 0 && amenityBookings.length === 0 && dayPassBookings.length === 0) {
      recommendations.push({
        type: 'promotion',
        title: '🎉 Your Booking is Being Processed!',
        description: 'Thank you for your booking request. We\'re reviewing it and will confirm soon.',
        reason: 'Processing your request',
        priority: 8
      });
      recommendations.push({
        type: 'daypass',
        title: 'Explore While You Wait',
        description: 'Enjoy our day pass facilities while your booking is being processed.',
        reason: 'Popular choice',
        priority: 7
      });
    }

    // Rule 7: Re-engagement for inactive users
    if (roomBookings.length > 0) {
      const lastBooking = new Date(roomBookings[0].last_booking);
      const daysSinceLastBooking = Math.floor((Date.now() - lastBooking.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastBooking > 90 && daysSinceLastBooking < 365) {
        recommendations.push({
          type: 'promotion',
          title: 'We Miss You! Come Back Offer',
          description: 'It\'s been a while! Enjoy 15% off your return booking.',
          reason: 'Special offer for you',
          priority: 9
        });
      }
    }

    // Rule 8: General recommendation for active users
    if (totalBookings > 0 && recommendations.length === 0) {
      recommendations.push({
        type: 'promotion',
        title: 'Thank You for Choosing Prisville!',
        description: 'We appreciate your continued support. Discover more ways to enjoy our resort.',
        reason: 'Special offer for you',
        priority: 5
      });
    }

    // Sort by priority (highest first)
    recommendations.sort((a, b) => b.priority - a.priority);

    // Return top 5 recommendations
    const topRecommendations = recommendations.slice(0, 5);

    console.log(`✅ Generated ${recommendations.length} total recommendations, returning top ${topRecommendations.length}`);
    console.log('📌 Recommendations:', topRecommendations.map(r => ({ type: r.type, title: r.title, priority: r.priority })));

    res.json({ 
      success: true, 
      recommendations: topRecommendations,
      userStats: {
        totalBookings,
        favoriteRoomType: roomBookings[0]?.room_name || 'none',
        lastBooking: roomBookings[0]?.last_booking || amenityBookings[0]?.last_booking || dayPassBookings[0]?.last_booking
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Save user preferences
export const saveUserPreferences: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Please login to save preferences' 
      });
      return;
    }

    const { preferred_room_types, preferred_amenities, budget_range, interests, special_occasions } = req.body;

    // Check if preferences exist
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [req.session.userId]
    );

    if (existing.length > 0) {
      // Update existing preferences
      await db.query(
        `UPDATE user_preferences 
         SET preferred_room_types = ?, preferred_amenities = ?, budget_range = ?, 
             interests = ?, special_occasions = ?
         WHERE user_id = ?`,
        [preferred_room_types, preferred_amenities, budget_range, interests, special_occasions, req.session.userId]
      );
    } else {
      // Insert new preferences
      await db.query(
        `INSERT INTO user_preferences 
         (user_id, preferred_room_types, preferred_amenities, budget_range, interests, special_occasions) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.session.userId, preferred_room_types, preferred_amenities, budget_range, interests, special_occasions]
      );
    }

    res.json({ 
      success: true, 
      message: 'Preferences saved successfully'
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save preferences',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get user preferences
export const getUserPreferences: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Please login to get preferences' 
      });
      return;
    }

    const [preferences] = await db.query<RowDataPacket[]>(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [req.session.userId]
    );

    res.json({ 
      success: true, 
      preferences: preferences[0] || null
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get preferences',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
