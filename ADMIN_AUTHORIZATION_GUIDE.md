# Admin Authorization Guide

## Overview

This document describes the authorization system and role separation implemented for admin and staff access control in the Prisville application.

## Role Separation Philosophy

### Admin Role (Strategic Oversight)
- **Purpose**: High-level monitoring, analytics, reporting, and system administration
- **Focus**: Strategic decision-making based on data insights
- **Access**: Admin-specific dashboard with analytics and reports

### Receptionist Role (Operational Management)
- **Purpose**: Day-to-day resort operations
- **Focus**: Guest services, booking management, inventory tracking
- **Access**: Receptionist dashboard with operational tools

### Key Principle
**Admins cannot access receptionist pages, and receptionists cannot access admin pages.** Each role has a dedicated dashboard tailored to their responsibilities.

## Authorization Middleware

Located in `server/middleware/auth.ts`, the following middleware functions are available:

### 1. `requireAuth`
- **Purpose**: Ensures user is authenticated (logged in)
- **Returns**: 401 Unauthorized if not logged in
- **Use Case**: Routes that require any authenticated user

### 2. `requireAdmin`
- **Purpose**: Ensures user has admin role
- **Returns**: 
  - 401 Unauthorized if not logged in
  - 403 Forbidden if not admin
- **Use Case**: Admin-only operations (dashboard, user management, reports)

### 3. `requireStaff`
- **Purpose**: Ensures user has admin OR receptionist role
- **Returns**: 
  - 401 Unauthorized if not logged in
  - 403 Forbidden if not staff
- **Use Case**: Operations accessible to both admin and receptionist (booking management, check-in/out)

### 4. `requireReceptionist`
- **Purpose**: Ensures user has receptionist OR admin role
- **Returns**: 
  - 401 Unauthorized if not logged in
  - 403 Forbidden if not receptionist/admin
- **Use Case**: Receptionist-specific operations (inventory, room status)

## Admin Dashboard Features

### Available Sections

1. **Overview** - Dashboard KPIs and key metrics
   - Total bookings, revenue, occupancy rate
   - Pending approvals count
   - Active users statistics
   - Booking trends visualization

2. **Analytics** - Booking trend analysis
   - Comprehensive booking analytics
   - Links to receptionist dashboard for operational details

3. **Guests** - Guest activity monitoring  
   - Guest booking history
   - Activity tracking
   - Guest statistics

4. **Occupancy** - Room occupancy overview
   - Current occupancy status
   - Room availability summary
   - Upcoming bookings overview

5. **Reports** - Generate operational reports
   - Booking reports
   - Revenue reports
   - Occupancy reports
   - Guest analytics reports
   - CSV export functionality

6. **Facilities** - View facilities information
   - Room catalog with pricing
   - Amenities overview
   - Facility statistics

7. **Users** - User management
   - View all users
   - Manage user roles (client/receptionist/admin)
   - User activity overview

### Removed Operational Features

The following operational features were removed from Admin Dashboard:

- ❌ **Individual Booking Management** - Approve/reject bookings (receptionist task)
- ❌ **Inventory Management** - Stock tracking and transactions (receptionist task)
- ❌ **Check-In/Check-Out** - Guest check-in/out operations (receptionist task)
- ❌ **Room Status Management** - Update room cleaning status (receptionist task)

## Receptionist Dashboard Features

### Available Sections (Receptionist Only)

1. **All Bookings** - Manage individual bookings
   - View all room, amenity, and day pass bookings
   - Approve or reject booking requests
   - View payment proofs
   - Filter and search bookings

2. **Check-In/Out** - Guest checking operations
   - Check in arriving guests
   - Check out departing guests
   - View currently checked-in guests

3. **Room Status** - Room management
   - Update room status (occupied/available/cleaning/maintenance)
   - Mark rooms as cleaned
   - Add notes for housekeeping

4. **Inventory** - Stock management
   - Track inventory items
   - Record transactions (in/out)
   - Monitor stock levels
   - Low stock alerts

5. **Stay History** - Guest history tracking
   - View completed stays
   - Add staff notes
   - Track guest ratings

6. **Issues** - Booking issue management
   - View and respond to booking issues
   - Update issue status and priority
   - Track resolutions

## Frontend Route Protection

### Admin Routes
- `/admin/dashboard` - Requires `role === 'admin'`
- `/admin/announcements` - Requires `role === 'admin'`

**Protection**: Redirects to `/` if user is not admin

### Receptionist Routes
- `/receptionist/dashboard` - Requires `role === 'receptionist'`
- `/receptionist/inventory` - Requires `role === 'receptionist'`

## Backend API Route Protection

### Admin-Only Routes (requireAdmin middleware)
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:userId/role` - Update user role
- `GET /api/admin/guest-activity` - Guest activity summary
- `GET /api/admin/room-occupancy` - Room occupancy details
- `GET /api/admin/booking-issues` - All booking issues

**Reports:**
- `GET /api/reports/bookings` - Booking report
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/occupancy` - Occupancy report
- `GET /api/reports/guests` - Guest report

**Announcements Management:**
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:announcementId` - Update announcement
- `DELETE /api/announcements/:announcementId` - Delete announcement
- `PUT /api/announcements/:announcementId/toggle-status` - Toggle announcement status

### Staff Routes (requireStaff - Admin + Receptionist)

**Booking Management:**
- `GET /api/bookings/room/all` - Get all room bookings
- `PUT /api/bookings/room/status` - Update room booking status
- `GET /api/bookings/amenity/all` - Get all amenity bookings
- `PUT /api/bookings/amenity/status` - Update amenity booking status
- `GET /api/bookings/day-pass/all` - Get all day pass bookings
- `PUT /api/bookings/day-pass/status` - Update day pass booking status

**Stay History:**
- `GET /api/stay-history/all` - Get all stay history
- `GET /api/stay-history/statistics` - Get guest statistics
- `PUT /api/stay-history` - Update stay history

**Booking Issues:**
- `GET /api/booking-issues` - Get all booking issues
- `PUT /api/booking-issues/status` - Update issue status
- `PUT /api/booking-issues/priority` - Update issue priority
- `DELETE /api/booking-issues/:id` - Delete booking issue

### Receptionist Routes (requireReceptionist - Receptionist + Admin)

**Inventory Management:**
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Add inventory item
- `PUT /api/inventory/update-quantity` - Update inventory quantity
- `GET /api/inventory/transactions` - Get transactions
- `POST /api/inventory/transactions` - Add transaction

**Room Status:**
- `GET /api/room-status` - Get all room status
- `PUT /api/room-status` - Update room status
- `PUT /api/room-status/cleaned` - Mark room as cleaned
- `GET /api/room-status/by-number` - Get room status by number

**Check-in/Check-out:**
- `POST /api/checkin` - Check in guest
- `POST /api/checkout` - Check out guest
- `GET /api/checkin/current` - Get currently checked in guests

## User Roles

The system supports three user roles:

1. **client** - Regular guests/users
2. **receptionist** - Front desk staff
3. **admin** - System administrators

## Default Admin Account

As defined in `database/mock_data.sql`:

- **Email**: admin@prisville.com
- **Password**: admin123 (should be hashed in production)
- **Role**: admin

## Session Management

User authentication is managed through Express sessions:
- Session data includes: `userId`, `userEmail`, `userName`, `userRole`
- Sessions are stored in MySQL using `express-mysql-session`
- Default session lifetime: 24 hours

## Error Responses

**401 Unauthorized** - User is not logged in:
```json
{
  "success": false,
  "message": "Authentication required. Please login."
}
```

**403 Forbidden** - User lacks required role:
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

## Implementation Notes

1. **Middleware Order**: Authorization middleware is applied directly to route definitions in `server/index.ts`
2. **Duplicate Checks**: Some routes may have redundant role checks in their handlers - these can be removed since middleware now handles authorization
3. **Frontend Protection**: Frontend pages (AdminDashboard, AdminAnnouncements) also check user role on mount
4. **Testing**: Test authorization with different user roles to ensure proper access control

## Security Best Practices

1. Always use HTTPS in production (set `cookie.secure = true`)
2. Regularly rotate the `SESSION_SECRET`
3. Implement rate limiting on authentication endpoints
4. Use strong password hashing (bcrypt with appropriate salt rounds)
5. Implement password reset functionality with secure tokens
6. Add audit logging for admin actions
7. Consider implementing 2FA for admin accounts

## Testing Authorization

```bash
# Login as admin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@prisville.com","password":"admin123"}' \
  -c cookies.txt

# Access protected admin route
curl http://localhost:8080/api/admin/dashboard/stats \
  -b cookies.txt

# Should receive 403 if logged in as non-admin
# Should receive 401 if not logged in
```

## Future Enhancements

1. Add role-based UI components/routes
2. Implement permission system (more granular than roles)
3. Add audit trail for admin actions
4. Implement IP whitelisting for admin access
5. Add login attempt tracking and account lockout
6. Implement session timeout with activity tracking
