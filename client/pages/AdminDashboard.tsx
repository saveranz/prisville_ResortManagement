import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Calendar, TrendingUp, FileText, 
  Building2, Settings, LogOut, BarChart3, DollarSign,
  CheckCircle, Clock, XCircle, UserCheck, BedDouble,
  Percent, Activity, Download, Menu, X, UserCog, MessageSquare
} from "lucide-react";
import AdminSiteSettings from "./AdminSiteSettings";
import AdminInquiries from "./AdminInquiries";

interface DashboardStats {
  totalBookings: number;
  roomBookings: number;
  amenityBookings: number;
  dayPassBookings: number;
  pendingApprovals: number;
  checkedInGuests: number;
  totalRevenue: string;
  totalUsers: number;
  activeUsers: number;
  occupancyRate: string;
  recentBookings: number;
  bookingTrends: any[];
  statusBreakdown: any[];
}

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  created_at: string;
  total_bookings: number;
}

interface Guest {
  id: number;
  email: string;
  name: string;
  phone: string;
  total_room_bookings: number;
  total_amenity_bookings: number;
  total_daypass_bookings: number;
  last_booking_date: string;
  currently_checked_in: number;
}

interface Room {
  id: number;
  room_name: string;
  room_type: string;
  room_numbers: string;
  capacity: number;
  price_per_night: string;
  amenities?: string;
  description?: string;
  is_active: boolean;
  total_bookings: number;
  approved_bookings: number;
  is_occupied: number;
}

interface Amenity {
  id: number;
  amenity_name: string;
  amenity_type: string;
  capacity: number;
  price_per_pax?: string;
  base_price?: string;
  operating_hours?: string;
  features?: string;
  description?: string;
  is_active: boolean;
  total_bookings: number;
  approved_bookings: number;
}

interface RoomOccupancy {
  room_name: string;
  is_occupied: number;
  current_guest: string | null;
  check_in_date: string | null;
  expected_checkout: string | null;
  upcoming_bookings: number;
}

// Interfaces for analytics and monitoring features only
// Operational interfaces (Booking, AmenityBooking, DayPassBooking, InventoryItem, InventoryTransaction, RoomStatus) 
// have been removed as those are handled in the Receptionist Dashboard

interface StayHistory {
  id: number;
  booking_id: number;
  user_id: number;
  guest_name: string;
  room_number: string;
  actual_check_in: string;
  actual_check_out: string;
  total_amount_paid: string;
}

interface BookingIssue {
  id: number;
  booking_id: number;
  booking_type: 'room' | 'amenity' | 'day_pass';
  issue_description: string;
  status: 'open' | 'in_progress' | 'resolved';
  reported_at: string;
  resolved_at?: string;
  resolved_by?: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [roomOccupancy, setRoomOccupancy] = useState<RoomOccupancy[]>([]);
  
  // REMOVED - Operational data for receptionist only
  // const [roomBookings, setRoomBookings] = useState<Booking[]>([]);
  // const [amenityBookings, setAmenityBookings] = useState<AmenityBooking[]>([]);
  // const [dayPassBookings, setDayPassBookings] = useState<DayPassBooking[]>([]);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  
  // REMOVED - Operational filters for receptionist
  // const [roomSearchTerm, setRoomSearchTerm] = useState('');
  // const [roomStatusFilter, setRoomStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  // const [amenitySearchTerm, setAmenitySearchTerm] = useState('');
  // const [amenityStatusFilter, setAmenityStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  // const [dayPassSearchTerm, setDayPassSearchTerm] = useState('');
  // const [dayPassStatusFilter, setDayPassStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Booking sub-tabs - REMOVED: Operational tasks are for receptionist
  // const [bookingTab, setBookingTab] = useState<'rooms' | 'amenities' | 'daypasses'>('rooms');
  
  // Inventory management - REMOVED: Operational tasks are for receptionist
  // const [inventoryTab, setInventoryTab] = useState<'items' | 'transactions'>('items');
  // const [inventory, setInventory] = useState<InventoryItem[]>([]);
  // const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  
  // Check-in/Check-out - REMOVED: Operational tasks are for receptionist
  // const [checkedInGuests, setCheckedInGuests] = useState<any[]>([]);
  // const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  
  // Stay history and issues
  const [stayHistory, setStayHistory] = useState<StayHistory[]>([]);
  const [bookingIssues, setBookingIssues] = useState<BookingIssue[]>([]);
  
  // Report filters
  const [reportType, setReportType] = useState('bookings');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      const data = await response.json();
      
      // Enforce admin-only access
      if (!data.success || data.user.role !== 'admin') {
        navigate('/');
        return;
      }
      
      fetchDashboardData();
    } catch (error) {
      console.error('Auth check failed:', error);
      // Redirect if auth check fails
      navigate('/');
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Admin dashboard focuses on analytics and monitoring only
      // Operational data (inventory, room status, check-in) is for receptionist
      const [
        statsRes, usersRes, guestsRes, roomsRes, amenitiesRes, occupancyRes,
        stayHistoryRes, issuesRes
      ] = await Promise.all([
        fetch('/api/admin/dashboard/stats', { credentials: 'include' }),
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/admin/guest-activity', { credentials: 'include' }),
        fetch('/api/facilities/rooms', { credentials: 'include' }),
        fetch('/api/facilities/amenities', { credentials: 'include' }),
        fetch('/api/admin/room-occupancy', { credentials: 'include' }),
        fetch('/api/stay-history/all', { credentials: 'include' }),
        fetch('/api/booking-issues', { credentials: 'include' })
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const guestsData = await guestsRes.json();
      const roomsData = await roomsRes.json();
      const amenitiesData = await amenitiesRes.json();
      const occupancyData = await occupancyRes.json();
      const stayHistoryData = await stayHistoryRes.json();
      const issuesData = await issuesRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (usersData.success) setUsers(usersData.users);
      if (guestsData.success) setGuests(guestsData.guests);
      if (roomsData.success) setRooms(roomsData.rooms);
      if (amenitiesData.success) setAmenities(amenitiesData.amenities);
      if (occupancyData.success) setRoomOccupancy(occupancyData.rooms);
      if (stayHistoryData.success) setStayHistory(stayHistoryData.history || []);
      if (issuesData.success) setBookingIssues(issuesData.issues || []);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtered bookings using useMemo
  // REMOVED: Booking management functions - these are operational tasks for receptionist
  // Admin should only view analytics, not manage individual bookings
  
  // REMOVED: updateUserRole function - Staff roles are managed separately, not via dropdown
  // Admin views staff list for monitoring purposes only

  // Booking action handlers - Removed as these are receptionist-only functions
  // Admin should view data, not perform operational actions

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      let url = '';
      const params = new URLSearchParams();
      
      if (reportStartDate) params.append('startDate', reportStartDate);
      if (reportEndDate) params.append('endDate', reportEndDate);

      switch (reportType) {
        case 'bookings':
          url = `/api/reports/bookings?${params}`;
          break;
        case 'revenue':
          params.append('groupBy', 'day');
          url = `/api/reports/revenue?${params}`;
          break;
        case 'occupancy':
          url = `/api/reports/occupancy?${params}`;
          break;
        case 'guests':
          url = `/api/reports/guests?${params}`;
          break;
      }

      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();

      if (data.success) {
        setReportData(data.report);
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const exportReportCSV = () => {
    if (!reportData) return;

    let csvContent = '';
    let filename = '';

    switch (reportType) {
      case 'bookings':
        filename = `bookings_report_${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = 'ID,Type,Email,Details,Date,Amount,Status\\n';
        reportData.bookings.forEach((b: any) => {
          csvContent += `${b.id},${b.booking_type || 'room'},${b.user_email},"${b.room_name || b.amenity_name || ''}",${b.check_in || b.booking_date},${b.total_amount},${b.status}\\n`;
        });
        break;
        
      case 'revenue':
        filename = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = 'Period,Room Revenue,Amenity Revenue,Day Pass Revenue,Total Revenue\\n';
        reportData.data.forEach((d: any) => {
          csvContent += `${d.period},${d.roomRevenue},${d.amenityRevenue},${d.dayPassRevenue},${d.totalRevenue}\\n`;
        });
        break;

      case 'occupancy':
        filename = `occupancy_report_${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = 'Date,Occupied Rooms,Total Rooms,Occupancy Rate\\n';
        reportData.dailyOccupancy.forEach((d: any) => {
          csvContent += `${d.date},${d.occupied_rooms},${d.total_rooms},${d.occupancyRate}%\\n`;
        });
        break;

      case 'guests':
        filename = `guests_report_${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = 'Email,Name,Total Bookings,Total Spent,Last Booking\\n';
        reportData.guests.forEach((g: any) => {
          csvContent += `${g.email},"${g.first_name} ${g.last_name}",${g.total_bookings},₱${g.total_spent},${g.last_booking_date}\\n`;
        });
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-accent flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
          <p className="mt-4 text-white text-xl">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-xl flex flex-col border-r border-primary/20
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center overflow-hidden bg-white">
              <img src="/PTR-logo.png" alt="Prisville Logo" className="w-full h-full object-cover scale-150" />
            </div>
            <div>
              <h1 className="font-display font-bold text-gray-900 text-lg tracking-tight">Prisville</h1>
              <p className="text-xs text-gray-600 font-medium">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <BarChart3 size={20} />
            <span className="tracking-wide">Overview</span>
          </button>

          <button
            onClick={() => { setActiveTab('reservations'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'reservations'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Calendar size={20} />
            <span className="tracking-wide">Analytics</span>
          </button>

          <button
            onClick={() => { setActiveTab('guests'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'guests'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Users size={20} />
            <span className="tracking-wide">Guests</span>
          </button>

          <button
            onClick={() => { setActiveTab('occupancy'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'occupancy'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <BedDouble size={20} />
            <span className="tracking-wide">Occupancy</span>
          </button>

          <button
            onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'reports'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <FileText size={20} />
            <span className="tracking-wide">Reports</span>
          </button>

          <button
            onClick={() => { setActiveTab('facilities'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'facilities'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Building2 size={20} />
            <span className="tracking-wide">Facilities</span>
          </button>

          <button
            onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <UserCog size={20} />
            <span className="tracking-wide">Staff</span>
          </button>

          <button
            onClick={() => { setActiveTab('inquiries'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'inquiries'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <MessageSquare size={20} />
            <span className="tracking-wide">Inquiries & FAQ</span>
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Settings size={20} />
            <span className="tracking-wide">Site Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary shadow-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Administrator</p>
              <p className="text-xs text-gray-600">System Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-semibold shadow-md"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
          <button
            onClick={() => navigate('/admin/announcements')}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all font-semibold border border-primary/30"
          >
            <FileText size={18} />
            <span>Announcements</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={24} className="text-gray-700" />
            </button>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 tracking-tight truncate">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'reservations' && 'All Reservations'}
                {activeTab === 'guests' && 'Guest Activity'}
                {activeTab === 'occupancy' && 'Room Occupancy Status'}
                {activeTab === 'reports' && 'Generate Reports'}
                {activeTab === 'facilities' && 'Facility Management'}
                {activeTab === 'users' && 'Staff Management'}
                {activeTab === 'inquiries' && 'Inquiries & FAQ Management'}
                {activeTab === 'settings' && 'Site Settings'}
              </h2>
              <p className="text-gray-600 text-sm mt-1 font-medium hidden sm:block">
                {activeTab === 'overview' && 'Monitor resort operations and key metrics'}
                {activeTab === 'reservations' && 'View and manage all bookings'}
                {activeTab === 'guests' && 'Track guest activity and bookings'}
                {activeTab === 'occupancy' && 'Monitor room availability and status'}
                {activeTab === 'reports' && 'Generate and export operational reports'}
                {activeTab === 'facilities' && 'Manage rooms and amenities'}
                {activeTab === 'users' && 'Manage user accounts and roles'}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block text-right bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-sm border border-gray-200">
                <p className="text-xs text-gray-600 font-medium">Today's Date</p>
                <p className="text-sm sm:text-base font-bold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50">

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">Dashboard Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Bookings</p>
                    <p className="text-3xl font-display font-bold text-blue-600 mt-1">{stats.totalBookings}</p>
                    <p className="text-xs text-gray-500 mt-1">All time</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Calendar className="text-white" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                    <p className="text-3xl font-display font-bold text-green-600 mt-1">₱{parseFloat(stats.totalRevenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Approved bookings</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <DollarSign className="text-white" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Pending Approvals</p>
                    <p className="text-3xl font-display font-bold text-orange-600 mt-1">{stats.pendingApprovals}</p>
                    <p className="text-xs text-gray-500 mt-1">Require attention</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <Clock className="text-white" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Occupancy Rate</p>
                    <p className="text-3xl font-display font-bold text-primary mt-1">{stats.occupancyRate}%</p>
                    <p className="text-xs text-gray-500 mt-1">Currently occupied</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Percent className="text-white" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Checked-In Guests</p>
                    <p className="text-3xl font-display font-bold text-purple-600 mt-1">{stats.checkedInGuests}</p>
                    <p className="text-xs text-gray-500 mt-1">Currently staying</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <UserCheck className="text-white" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Users</p>
                    <p className="text-3xl font-display font-bold text-indigo-600 mt-1">{stats.totalUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.activeUsers} active</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <Users className="text-white" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-pink-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Room Bookings</p>
                    <p className="text-3xl font-display font-bold text-pink-600 mt-1">{stats.roomBookings}</p>
                    <p className="text-xs text-gray-500 mt-1">Total rooms</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                    <BedDouble className="text-white" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Recent Bookings</p>
                    <p className="text-3xl font-display font-bold text-teal-600 mt-1">{stats.recentBookings}</p>
                    <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                    <Activity className="text-white" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Status Breakdown */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-display font-bold text-gray-900 mb-4">Booking Status Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.statusBreakdown.map((status: any) => (
                  <div key={status.status} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 capitalize">{status.status}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{status.count}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        status.status === 'approved' ? 'bg-green-100' :
                        status.status === 'pending' ? 'bg-orange-100' :
                        'bg-red-100'
                      }`}>
                        {status.status === 'approved' && <CheckCircle className="text-green-600" size={20} />}
                        {status.status === 'pending' && <Clock className="text-orange-600" size={20} />}
                        {status.status === 'rejected' && <XCircle className="text-red-600" size={20} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-gray-900">All Reservations</h2>
              <button
                onClick={() => navigate('/receptionist/dashboard')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Manage Bookings
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Room Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.roomBookings || 0}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Amenity Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.amenityBookings || 0}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Day Pass Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.dayPassBookings || 0}</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Use the <strong>Receptionist Dashboard</strong> to manage individual bookings, approve requests, and handle check-ins/check-outs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Guests Tab - Part 1: Continue in next message due to length */}
        {activeTab === 'guests' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">Guest Activity</h2>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary to-accent">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Room Bookings</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Amenity Bookings</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Day Pass</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Last Booking</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {guests.map((guest) => (
                      <tr key={guest.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {guest.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{guest.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{guest.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{guest.total_room_bookings}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{guest.total_amenity_bookings}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{guest.total_daypass_bookings}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {guest.last_booking_date ? new Date(guest.last_booking_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {guest.currently_checked_in > 0 ? (
                            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                              Checked In
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                              Not Staying
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Occupancy Tab */}
        {activeTab === 'occupancy' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">Room Occupancy Status</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <p className="text-sm text-gray-600 font-medium">Total Rooms</p>
                <p className="text-3xl font-display font-bold text-blue-600 mt-2">{roomOccupancy.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <p className="text-sm text-gray-600 font-medium">Occupied</p>
                <p className="text-3xl font-display font-bold text-green-600 mt-2">
                  {roomOccupancy.filter(r => r.is_occupied === 1).length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500">
                <p className="text-sm text-gray-600 font-medium">Available</p>
                <p className="text-3xl font-display font-bold text-gray-600 mt-2">
                  {roomOccupancy.filter(r => r.is_occupied === 0).length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary">
                <p className="text-sm text-gray-600 font-medium">Occupancy Rate</p>
                <p className="text-3xl font-display font-bold text-primary mt-2">{stats?.occupancyRate}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary to-accent">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Room</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Current Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Check-In</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Expected Checkout</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Upcoming</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {roomOccupancy.map((room) => (
                      <tr key={room.room_name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{room.room_name}</td>
                        <td className="px-4 py-3">
                          {room.is_occupied === 1 ? (
                            <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                              Occupied
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{room.current_guest || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {room.check_in_date ? new Date(room.check_in_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {room.expected_checkout ? new Date(room.expected_checkout).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{room.upcoming_bookings} bookings</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">Generate Reports</h2>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="bookings">Bookings Report</option>
                    <option value="revenue">Revenue Report</option>
                    <option value="occupancy">Occupancy Report</option>
                    <option value="guests">Guest Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={generateReport}
                    disabled={generatingReport}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <TrendingUp size={18} />
                    Generate
                  </button>
                  {reportData && (
                    <button
                      onClick={exportReportCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      title="Export as CSV"
                    >
                      <Download size={18} />
                    </button>
                  )}
                </div>
              </div>

              {generatingReport && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="mt-4 text-gray-600">Generating report...</p>
                </div>
              )}

              {reportData && !generatingReport && (
                <div className="mt-6">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {reportType === 'bookings' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-xl font-bold text-gray-900">{reportData.summary.totalBookings}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Approved</p>
                            <p className="text-xl font-bold text-green-600">{reportData.summary.approvedBookings}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-xl font-bold text-orange-600">{reportData.summary.pendingBookings}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Revenue</p>
                            <p className="text-xl font-bold text-primary">₱{parseFloat(reportData.summary.totalRevenue).toLocaleString()}</p>
                          </div>
                        </>
                      )}
                      {reportType === 'revenue' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Grand Total</p>
                            <p className="text-xl font-bold text-green-600">₱{parseFloat(reportData.summary.grandTotal).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Bookings</p>
                            <p className="text-xl font-bold text-primary">{reportData.summary.totalBookings}</p>
                          </div>
                        </>
                      )}
                      {reportType === 'occupancy' && (
                        <div>
                          <p className="text-sm text-gray-600">Average Occupancy</p>
                          <p className="text-xl font-bold text-primary">{reportData.summary.averageOccupancy}%</p>
                        </div>
                      )}
                      {reportType === 'guests' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Total Guests</p>
                            <p className="text-xl font-bold text-primary">{reportData.summary.totalGuests}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Spent</p>
                            <p className="text-xl font-bold text-green-600">₱{parseFloat(reportData.summary.totalSpent).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Avg per Guest</p>
                            <p className="text-xl font-bold text-gray-900">₱{parseFloat(reportData.summary.avgSpentPerGuest).toLocaleString()}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    Period: {reportData.period.startDate} to {reportData.period.endDate}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Facilities Tab */}
        {activeTab === 'facilities' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">Facility Management</h2>

            {/* Rooms Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-display font-bold text-gray-900 mb-4">Rooms</h3>
              {rooms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No rooms configured yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <div key={room.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{room.room_name}</h4>
                          <p className="text-sm text-gray-600">{room.room_type}</p>
                        </div>
                        {room.is_occupied === 1 ? (
                          <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                            Occupied
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                            Available
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">Capacity: <span className="font-semibold text-gray-900">{room.capacity} guests</span></p>
                        <p className="text-gray-600">Price: <span className="font-semibold text-gray-900">{room.price_per_night}/night</span></p>
                        <p className="text-gray-600">Room Numbers: <span className="font-semibold text-gray-900">{room.room_numbers}</span></p>
                        <p className="text-gray-600">Total Bookings: <span className="font-semibold text-gray-900">{room.total_bookings}</span></p>
                        <p className="text-gray-600">Approved: <span className="font-semibold text-gray-900">{room.approved_bookings}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-display font-bold text-gray-900 mb-4">Amenities</h3>
              {amenities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No amenities configured yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {amenities.map((amenity) => (
                    <div key={amenity.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 mb-2">{amenity.amenity_name}</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">Type: <span className="font-semibold text-gray-900 capitalize">{amenity.amenity_type.replace('-', ' ')}</span></p>
                        <p className="text-gray-600">Capacity: <span className="font-semibold text-gray-900">{amenity.capacity} guests</span></p>
                        {amenity.price_per_pax && (
                          <p className="text-gray-600">Price per Pax: <span className="font-semibold text-gray-900">{amenity.price_per_pax}</span></p>
                        )}
                        {amenity.base_price && (
                          <p className="text-gray-600">Base Price: <span className="font-semibold text-gray-900">{amenity.base_price}</span></p>
                        )}
                        {amenity.operating_hours && (
                          <p className="text-gray-600 text-xs mt-1">{amenity.operating_hours}</p>
                        )}
                        <p className="text-gray-600">Total Bookings: <span className="font-semibold text-gray-900">{amenity.total_bookings}</span></p>
                        <p className="text-gray-600">Approved: <span className="font-semibold text-gray-900">{amenity.approved_bookings}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REMOVED: Bookings Management Tab - Operational task for receptionist */}

        {/* REMOVED: Inventory Management Tab - Operational task for receptionist */}

        {/* REMOVED: Check-In/Check-Out Tab - Operational task for receptionist */}

        {/* REMOVED: Room Status Board Tab - Operational task for receptionist */}

        {/* REMOVED: Stay History Tab - Data kept for monitoring but tab removed */}

        {/* REMOVED: Booking Issues Tab - Data kept for monitoring but tab removed */}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">Staff Management</h2>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary to-accent">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Joined Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">#{user.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.phone || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'receptionist' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Site Settings Tab */}
        {activeTab === 'settings' && (
          <AdminSiteSettings />
        )}

        {/* Inquiries & FAQ Tab */}
        {activeTab === 'inquiries' && (
          <AdminInquiries />
        )}

        </div>
      </div>

      {/* Payment Proof Modal */}
      {viewingProof && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingProof(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Payment Proof</h3>
              <button
                onClick={() => setViewingProof(null)}
                className="px-3 py-1 bg-gray-200  hover:bg-gray-300 rounded-lg text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <img 
                src={viewingProof} 
                alt="Payment Proof" 
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

