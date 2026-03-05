# Admin Dashboard Refactoring - Role Separation

## Overview
Removing operational features from AdminDashboard to enforce proper role separation. Admin should focus on analytics, monitoring, and reporting ONLY.

## Sections to Remove

### 1. Bookings Management Tab (Lines ~1142-1401)
- **Reason**: Booking management (approve/reject) is an operational task for receptionist
- **Keep**: Stats and analytics about bookings in Overview and Reports
- **Remove**: Individual booking management interface

### 2. Inventory Management Tab (Lines ~1404-1451)  
- **Reason**: Inventory tracking is an operational task for receptionist
- **Keep**: Overview stats if needed
- **Remove**: Full inventory management interface

### 3. Check-In/Check-Out Tab (Lines ~1454-1520 approx)
- **Reason**: Check-in/check-out is a daily operational task for receptionist
- **Keep**: Stats about current occupancy
- **Remove**: Check-in/check-out management interface

## State Variables to Remove

- `roomBookings`, `amenityBookings`, `dayPassBookings` - detailed booking arrays
- `bookingTab` - sub-tab for booking types
- `inventoryTab`, `inventory`, `transactions` - inventory management
- `checkedInGuests`, `roomStatuses` - operational check-in data
- Search and filter states for bookings

## API Calls to Remove from fetchDashboardData

- `/api/bookings/room/all`
- `/api/bookings/amenity/all`
- `/api/bookings/day-pass/all`
- `/api/inventory`
- `/api/inventory/transactions`
- `/api/checkin/current`
- `/api/room-status`

## Tabs to Keep

1. **Overview** - Dashboard KPIs and metrics
2. **Analytics** - Booking trends and analytics  
3. **Guests** - Guest activity monitoring
4. **Occupancy** - Room occupancy overview
5. **Reports** - Generate operational reports
6. **Facilities** - View facilities info (no management)
7. **Users** - User role management

## Result

Admin dashboard becomes a pure analytics/monitoring interface focused on:
- High-level visibility into resort operations
- Data analytics and reporting
- User management
- System-wide monitoring

All operational tasks (booking approval, inventory, check-in/out) remain in ReceptionistDashboard.
