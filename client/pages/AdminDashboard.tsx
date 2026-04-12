import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, Calendar, TrendingUp, FileText, 
  Settings, LogOut, BarChart3, DollarSign,
  CheckCircle, Clock, XCircle, UserCheck, BedDouble,
  Activity, Download, Menu, X, UserCog, MessageSquare,
  Plus, Pencil, Trash2, Lock, Unlock, Package, ShieldCheck, RefreshCw
} from "lucide-react";
import AdminSiteSettings from "./AdminSiteSettings";
import { PaymentSettingsEditor } from "../components/PaymentSettingsEditor";
import AdminInquiries from "./AdminInquiries";
import ReceptionistInventory from "./ReceptionistInventory";

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
  status: 'active' | 'locked' | 'deleted';
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
  special_requests?: string;
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

interface ActivityTypeCount {
  activity_type: string;
  count: number;
}

interface BookingViewFrequency {
  roomViews: number;
  amenityViews: number;
  dayPassViews: number;
  totalBookingViews: number;
  totalBookingViewTime: number;
}

interface BookingViewsByDay {
  date: string;
  roomViews: number;
  amenityViews: number;
  dayPassViews: number;
  total: number;
}

interface TopViewedItem {
  activity_type: string;
  label: string;
  count: number;
  total_time: number;
}

interface MostEngagedUser {
  user_id: number;
  name: string;
  email: string;
  total_views: number;
  total_time: number;
}

interface ActivityAnalytics {
  totalActivities: number;
  activitiesLast7Days: number;
  uniqueTrackedUsers: number;
  uniqueSessions: number;
  topActivityTypes: ActivityTypeCount[];
  activityByDay: Array<{ date: string; count: number }>;
  activityTypesTrend: Array<{ activity_type: string; count: number }>;
  bookingViewFrequency: BookingViewFrequency;
  bookingViewsByDay: BookingViewsByDay[];
  topViewedItems: TopViewedItem[];
  mostEngagedUsers: MostEngagedUser[];
}

// Interfaces for analytics and monitoring features only
// Operational interfaces (Booking, AmenityBooking, DayPassBooking, RoomStatus) 
// have been removed as those are handled in the Receptionist Dashboard

interface InventoryItem {
  id: number;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: string;
  last_updated: string;
  created_at: string;
}

interface InventoryTransaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: string;
  transaction_date: string;
  created_at: string;
}

interface StockTransaction {
  id: number;
  item_id: number;
  item_name: string;
  category: string;
  unit: string;
  type: 'received' | 'issued';
  quantity: number;
  performed_by: string;
  supplier: string | null;
  notes: string | null;
  created_at: string;
}

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

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

interface RoomFormState {
  room_name: string;
  room_type: 'Standard Room (Aircon)' | 'Non-Aircon Room' | 'Family Fan Room' | 'Large Family Room';
  room_numbers: string;
  capacity: string;
  price_per_night: string;
  amenities: string;
  description: string;
  special_requests: string;
  is_active: boolean;
}

interface ExtraItem {
  id: number;
  item_name: string;
  price: string;
  unit?: string;
  description?: string;
  is_active: boolean;
}

interface ExtraItemFormState {
  item_name: string;
  price: string;
  unit: string;
  description: string;
}

const DEFAULT_EXTRA_ITEM_FORM: ExtraItemFormState = {
  item_name: '',
  price: '',
  unit: '',
  description: ''
};

const DEFAULT_ROOM_FORM: RoomFormState = {
  room_name: '',
  room_type: 'Standard Room (Aircon)',
  room_numbers: '',
  capacity: '2',
  price_per_night: 'â‚±1600',
  amenities: '',
  description: '',
  special_requests: '',
  is_active: true
};

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
  const [activityAnalytics, setActivityAnalytics] = useState<ActivityAnalytics | null>(null);
  const [activityRange, setActivityRange] = useState<'week' | 'month' | 'year'>('week');
  const [activityRefreshing, setActivityRefreshing] = useState(false);
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomFormLoading, setRoomFormLoading] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [roomForm, setRoomForm] = useState<RoomFormState>(DEFAULT_ROOM_FORM);
  
  // REMOVED - Operational data for receptionist only
  // const [roomBookings, setRoomBookings] = useState<Booking[]>([]);
  // const [amenityBookings, setAmenityBookings] = useState<AmenityBooking[]>([]);
  // const [dayPassBookings, setDayPassBookings] = useState<DayPassBooking[]>([]);
  const [roomExtraItems, setRoomExtraItems] = useState<ExtraItem[]>([]);
  const [showExtraItemsModal, setShowExtraItemsModal] = useState(false);
  const [extraItemForm, setExtraItemForm] = useState<ExtraItemFormState>(DEFAULT_EXTRA_ITEM_FORM);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [extraItemLoading, setExtraItemLoading] = useState(false);
  
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  
  // User management state
  const [userActionLoading, setUserActionLoading] = useState<{[key: number]: boolean}>({});
  const [userActionConfirm, setUserActionConfirm] = useState<{userId: number; action: 'lock' | 'unlock' | 'delete'} | null>(null);

  // Inventory tab state
  const [inventorySubTab, setInventorySubTab] = useState<'items' | 'transactions' | 'stock-log'>('items');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'' | 'income' | 'expense'>('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ type: 'income' as 'income' | 'expense', category: '', description: '', amount: '', transaction_date: new Date().toISOString().split('T')[0] });
  const [transactionSaving, setTransactionSaving] = useState(false);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);

  // Audit trail state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  
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

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory();
      fetchInventoryTransactions();
      fetchStockTransactions();
    } else if (activeTab === 'audit') {
      fetchAuditLogs(1);
    }
  }, [activeTab]);

  useEffect(() => {
    setInventoryPage(1);
  }, [inventorySearch, inventorySubTab]);

  useEffect(() => {
    setTransactionPage(1);
  }, [transactionSearch, transactionTypeFilter, inventorySubTab]);

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
        statsRes, usersRes, guestsRes, roomsRes, amenitiesRes,
        stayHistoryRes, issuesRes, activityRes
      ] = await Promise.all([
        fetch('/api/admin/dashboard/stats', { credentials: 'include' }),
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/admin/guest-activity', { credentials: 'include' }),
        fetch('/api/facilities/rooms', { credentials: 'include' }),
        fetch('/api/facilities/amenities', { credentials: 'include' }),
        fetch('/api/stay-history/all', { credentials: 'include' }),
        fetch('/api/booking-issues', { credentials: 'include' }),
        fetch(`/api/admin/activity-analytics?range=${activityRange}`, { credentials: 'include' })
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const guestsData = await guestsRes.json();
      const roomsData = await roomsRes.json();
      const amenitiesData = await amenitiesRes.json();
      const stayHistoryData = await stayHistoryRes.json();
      const issuesData = await issuesRes.json();
      const activityData = await activityRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (usersData.success) setUsers(usersData.users);
      if (guestsData.success) setGuests(guestsData.guests);
      if (roomsData.success) setRooms(roomsData.rooms);
      if (amenitiesData.success) setAmenities(amenitiesData.amenities);
      if (stayHistoryData.success) setStayHistory(stayHistoryData.history || []);
      if (issuesData.success) setBookingIssues(issuesData.issues || []);
      if (activityData.success) setActivityAnalytics(activityData.analytics);

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

  const formatActivityType = (activityType: string) => {
    return activityType
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const formatCompactDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSeconds = (seconds: number) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatChartTick = (dateString: string) => {
    if (!dateString) return '';
    // YYYY-MM format (annual monthly buckets)
    if (String(dateString).length === 7) {
      const [year, month] = String(dateString).split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    }
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatChartTooltipLabel = (dateString: string) => {
    if (!dateString) return '';
    const s = String(dateString);
    if (s.length === 7) {
      const [year, month] = s.split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const fetchActivityAnalytics = async (range: 'week' | 'month' | 'year') => {
    setActivityRefreshing(true);
    try {
      const res = await fetch(`/api/admin/activity-analytics?range=${range}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setActivityAnalytics(data.analytics);
    } catch (error) {
      console.error('Failed to refresh activity analytics:', error);
    } finally {
      setActivityRefreshing(false);
    }
  };

  const handleRangeChange = (range: 'week' | 'month' | 'year') => {
    setActivityRange(range);
    fetchActivityAnalytics(range);
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      // Admin should see all items, including archived
      const res = await fetch('/api/inventory?showArchived=1', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setInventory(data.items || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchInventoryTransactions = async () => {
    setInventoryLoading(true);
    try {
      const res = await fetch('/api/inventory/transactions', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setInventoryTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchStockTransactions = async () => {
    try {
      const res = await fetch('/api/inventory/stock-transactions', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setStockTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch stock transactions:', error);
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.category || !newTransaction.amount || !newTransaction.transaction_date) return;
    setTransactionSaving(true);
    try {
      const res = await fetch('/api/inventory/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddTransaction(false);
        setNewTransaction({ type: 'income', category: '', description: '', amount: '', transaction_date: new Date().toISOString().split('T')[0] });
        fetchInventoryTransactions();
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
    } finally {
      setTransactionSaving(false);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (auditActionFilter) params.append('action', auditActionFilter);
      if (auditStartDate) params.append('startDate', auditStartDate);
      if (auditEndDate) params.append('endDate', auditEndDate);
      const res = await fetch(`/api/admin/audit-logs?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
        setAuditTotalPages(data.pagination?.totalPages || 1);
        setAuditPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  // Filtered bookings using useMemo
  // REMOVED: Booking management functions - these are operational tasks for receptionist
  // Admin should only view analytics, not manage individual bookings
  
  // REMOVED: updateUserRole function - user roles are managed separately, not via dropdown
  // Admin views user list for monitoring purposes only

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

    const escapeCsvValue = (value: unknown) => {
      const stringValue = String(value ?? '');
      const escaped = stringValue.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const toCsv = (rows: unknown[][]) => rows
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(','))
      .join('\r\n');

    let csvContent = '';
    let filename = '';

    switch (reportType) {
      case 'bookings':
        filename = `bookings_report_${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = toCsv([
          ['Booking ID', 'Type', 'Guest', 'Item', 'Date', 'Status', 'Amount'],
          ...(reportData.bookings || []).map((booking: any) => [
            `#${booking.id}`,
            booking.booking_type || '-',
            booking.user_name || booking.user_email || '-',
            booking.room_name || booking.amenity_name || 'Day Pass',
            booking.created_at ? formatDate(booking.created_at) : '-',
            booking.status || '-',
            booking.total_amount || 'â‚±0.00'
          ])
        ]);
        break;
        
      case 'revenue':
        filename = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = toCsv([
          [
            'Period',
            'Room Bookings',
            'Amenity Bookings',
            'Day Pass Bookings',
            'Total Bookings',
            'Room Revenue',
            'Amenity Revenue',
            'Day Pass Revenue',
            'Total Revenue'
          ],
          ...(reportData.data || []).map((row: any) => [
            row.period,
            row.roomBookings || 0,
            row.amenityBookings || 0,
            row.dayPassBookings || 0,
            row.totalBookings || 0,
            Number(row.roomRevenue || 0).toFixed(2),
            Number(row.amenityRevenue || 0).toFixed(2),
            Number(row.dayPassRevenue || 0).toFixed(2),
            Number(row.totalRevenue || 0).toFixed(2)
          ])
        ]);
        break;

      case 'occupancy':
        filename = `occupancy_report_${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = [
          toCsv([
            ['Daily Occupancy'],
            ['Date', 'Occupied Rooms', 'Total Rooms', 'Occupancy Rate'],
            ...(reportData.dailyOccupancy || []).map((row: any) => [
              row.date ? formatDate(row.date) : '-',
              row.occupied_rooms || 0,
              row.total_rooms || 0,
              `${row.occupancyRate || '0'}%`
            ])
          ]),
          '',
          toCsv([
            ['Room Type Breakdown'],
            ['Room Type', 'Total Bookings', 'Check-ins'],
            ...(reportData.roomTypeBreakdown || []).map((row: any) => [
              row.room_type || 'N/A',
              row.total_bookings || 0,
              row.check_ins || 0
            ])
          ])
        ].join('\r\n');
        break;

      case 'guests':
        filename = `guests_report_${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = toCsv([
          ['Guest Name', 'Email', 'Phone', 'Total Bookings', 'Total Spent', 'First Booking', 'Last Booking'],
          ...(reportData.guests || []).map((guest: any) => [
            guest.name || '-',
            guest.email || '-',
            guest.phone || '-',
            guest.total_bookings || 0,
            Number(guest.total_spent || 0).toFixed(2),
            guest.first_booking_date ? formatDate(guest.first_booking_date) : '-',
            guest.last_booking_date ? formatDate(guest.last_booking_date) : '-'
          ])
        ]);
        break;
    }

    const csvWithBom = `\uFEFF${csvContent}`;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
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

  const openCreateRoomForm = () => {
    setEditingRoomId(null);
    setRoomForm(DEFAULT_ROOM_FORM);
    setShowRoomForm(true);
  };

  const openEditRoomForm = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomForm({
      room_name: room.room_name,
      room_type: room.room_type as RoomFormState['room_type'],
      room_numbers: room.room_numbers,
      capacity: String(room.capacity),
      price_per_night: room.price_per_night,
      amenities: room.amenities || '',
      description: room.description || '',
      special_requests: room.special_requests || '',
      is_active: room.is_active
    });
    setShowRoomForm(true);
  };

  const saveRoom = async () => {
    if (!roomForm.room_name.trim() || !roomForm.room_numbers.trim() || !roomForm.capacity.trim() || !roomForm.price_per_night.trim()) {
      alert('Please complete all required room fields.');
      return;
    }

    const capacityValue = parseInt(roomForm.capacity, 10);
    if (Number.isNaN(capacityValue) || capacityValue <= 0) {
      alert('Capacity must be a valid number greater than 0.');
      return;
    }

    setRoomFormLoading(true);
    try {
      const endpoint = editingRoomId ? `/api/facilities/rooms/${editingRoomId}` : '/api/facilities/rooms';
      const method = editingRoomId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...roomForm,
          room_name: roomForm.room_name.trim(),
          room_numbers: roomForm.room_numbers.trim(),
          amenities: roomForm.amenities.trim(),
          description: roomForm.description.trim(),
          special_requests: roomForm.special_requests.trim(),
          capacity: capacityValue
        })
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.message || 'Failed to save room');
        return;
      }

      setShowRoomForm(false);
      setEditingRoomId(null);
      setRoomForm(DEFAULT_ROOM_FORM);
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to save room:', error);
      alert('Failed to save room');
    } finally {
      setRoomFormLoading(false);
    }
  };

  const removeRoom = async (room: Room) => {
    const confirmed = window.confirm(`Delete ${room.room_name}? This will hide it from guest/client booking options.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/facilities/rooms/${room.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();

      if (!data.success) {
        alert(data.message || 'Failed to delete room');
        return;
      }

      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to delete room:', error);
      alert('Failed to delete room');
    }
  };

  // User management functions
  const handleUserAction = async (userId: number, action: 'lock' | 'unlock' | 'delete') => {
    const confirmMessages = {
      lock: 'Lock this user account? They won\'t be able to login.',
      unlock: 'Activate this user account?',
      delete: 'Delete this user account permanently? This cannot be undone.'
    };

    if (!window.confirm(confirmMessages[action])) return;

    setUserActionLoading({ ...userActionLoading, [userId]: true });
    try {
      const endpoint = action === 'delete' 
        ? `/api/admin/users/${userId}`
        : `/api/admin/users/${userId}/${action}`;
      const method = action === 'delete' ? 'DELETE' : 'PUT';

      const response = await fetch(endpoint, {
        method,
        credentials: 'include'
      });
      const data = await response.json();

      if (!data.success) {
        alert(data.message || `Failed to ${action} user`);
        return;
      }

      await fetchDashboardData();
      setUserActionConfirm(null);
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      alert(`Failed to ${action} user`);
    } finally {
      setUserActionLoading({ ...userActionLoading, [userId]: false });
    }
  };

    const fetchRoomExtraItems = async (roomId: number) => {
      try {
        const response = await fetch(`/api/facilities/rooms/${roomId}/extra-items`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          setRoomExtraItems(data.items);
        }
      } catch (error) {
        console.error('Failed to fetch extra items:', error);
      }
    };

    const openExtraItemsModal = (roomId: number) => {
      setShowRoomForm(false);
      fetchRoomExtraItems(roomId);
      setExtraItemForm(DEFAULT_EXTRA_ITEM_FORM);
      setEditingItemId(null);
      setShowExtraItemsModal(true);
    };

    const saveExtraItem = async (roomId: number) => {
      if (!extraItemForm.item_name.trim() || !extraItemForm.price.trim()) {
        alert('Item name and price are required');
        return;
      }

      setExtraItemLoading(true);
      try {
        const endpoint = editingItemId 
          ? `/api/facilities/rooms/${roomId}/extra-items/${editingItemId}`
          : `/api/facilities/rooms/${roomId}/extra-items`;
        const method = editingItemId ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            item_name: extraItemForm.item_name.trim(),
            price: extraItemForm.price.trim(),
            unit: extraItemForm.unit.trim() || null,
            description: extraItemForm.description.trim() || null
          })
        });

        const data = await response.json();
        if (!data.success) {
          alert(data.message || 'Failed to save item');
          return;
        }

        setExtraItemForm(DEFAULT_EXTRA_ITEM_FORM);
        setEditingItemId(null);
        await fetchRoomExtraItems(roomId);
      } catch (error) {
        console.error('Failed to save extra item:', error);
        alert('Failed to save item');
      } finally {
        setExtraItemLoading(false);
      }
    };

    const deleteExtraItem = async (roomId: number, itemId: number) => {
      const confirmed = window.confirm('Delete this extra item?');
      if (!confirmed) return;

      try {
        const response = await fetch(`/api/facilities/rooms/${roomId}/extra-items/${itemId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await response.json();

        if (!data.success) {
          alert(data.message || 'Failed to delete item');
          return;
        }

        await fetchRoomExtraItems(roomId);
      } catch (error) {
        console.error('Failed to delete extra item:', error);
        alert('Failed to delete item');
      }
    };

  const filteredRooms = rooms.filter((room) => {
    if (!roomSearchTerm) return true;
    const search = roomSearchTerm.toLowerCase();
    return (
      room.room_name.toLowerCase().includes(search) ||
      room.room_type.toLowerCase().includes(search) ||
      room.room_numbers.toLowerCase().includes(search)
    );
  });

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
            <BedDouble size={20} />
            <span className="tracking-wide">Room Bookings</span>
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
            <span className="tracking-wide">Users</span>
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

          <button
            onClick={() => { setActiveTab('inventory'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'inventory'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Package size={20} />
            <span className="tracking-wide">Inventory</span>
          </button>

          <button
            onClick={() => { setActiveTab('audit'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'audit'
                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <ShieldCheck size={20} />
            <span className="tracking-wide">Audit Trail</span>
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
                {activeTab === 'reports' && 'Generate Reports'}
                {activeTab === 'facilities' && 'Room Bookings CMS'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'inquiries' && 'Inquiries & FAQ Management'}
                {activeTab === 'settings' && 'Site Settings'}
                {activeTab === 'inventory' && 'Inventory & Transactions'}
                {activeTab === 'audit' && 'Audit Trail'}
              </h2>
              <p className="text-gray-600 text-sm mt-1 font-medium hidden sm:block">
                {activeTab === 'overview' && 'Monitor resort operations and key metrics'}
                {activeTab === 'reservations' && 'View and manage all bookings'}
                {activeTab === 'guests' && 'Track guest activity and bookings'}
                {activeTab === 'reports' && 'Generate and export operational reports'}
                {activeTab === 'facilities' && 'Add, edit, and delete rooms shown across booking flows'}
                {activeTab === 'users' && 'Manage user accounts and roles'}
                {activeTab === 'inventory' && 'View inventory items and manage financial transactions'}
                {activeTab === 'audit' && 'Track all admin actions and system changes'}
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
                    <p className="text-3xl font-display font-bold text-green-600 mt-1">â‚±{parseFloat(stats.totalRevenue).toLocaleString()}</p>
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
            <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-6 border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-sans font-semibold tracking-tight text-slate-900">Tracked User Activities</h3>
                  <p className="text-sm font-sans text-slate-500">Booking funnel visibility across room, amenity, and day pass interests.</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-0.5 p-1 bg-slate-100 rounded-xl">
                    {(['week', 'month', 'year'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRangeChange(r)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          activityRange === r
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {r === 'week' ? 'Weekly' : r === 'month' ? 'Monthly' : 'Annual'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => fetchActivityAnalytics(activityRange)}
                    disabled={activityRefreshing}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-sans text-sm disabled:opacity-50"
                  >
                    {activityRefreshing ? 'Loadingâ€¦' : 'Refresh'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
                <div className="rounded-2xl p-4 border border-slate-200 bg-gradient-to-br from-white to-slate-50">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">Total Tracked Events</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">{activityAnalytics?.totalActivities ?? 0}</p>
                </div>
                <div className="rounded-2xl p-4 border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                  <p className="text-xs uppercase tracking-wide text-emerald-700 font-medium">
                    {activityRange === 'week' ? 'Events (7d)' : activityRange === 'month' ? 'Events (30d)' : 'Events (1yr)'}
                  </p>
                  <p className="text-2xl font-semibold text-emerald-700 mt-2">{activityAnalytics?.activitiesLast7Days ?? 0}</p>
                </div>
                <div className="rounded-2xl p-4 border border-sky-200 bg-gradient-to-br from-sky-50 to-white">
                  <p className="text-xs uppercase tracking-wide text-sky-700 font-medium">
                    Room Views ({activityRange === 'week' ? '7d' : activityRange === 'month' ? '30d' : '1yr'})
                  </p>
                  <p className="text-2xl font-semibold text-sky-700 mt-2">{activityAnalytics?.bookingViewFrequency?.roomViews ?? 0}</p>
                </div>
                <div className="rounded-2xl p-4 border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
                  <p className="text-xs uppercase tracking-wide text-cyan-700 font-medium">
                    Amenity Views ({activityRange === 'week' ? '7d' : activityRange === 'month' ? '30d' : '1yr'})
                  </p>
                  <p className="text-2xl font-semibold text-cyan-700 mt-2">{activityAnalytics?.bookingViewFrequency?.amenityViews ?? 0}</p>
                </div>
                <div className="rounded-2xl p-4 border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                  <p className="text-xs uppercase tracking-wide text-amber-700 font-medium">
                    Day Pass Views ({activityRange === 'week' ? '7d' : activityRange === 'month' ? '30d' : '1yr'})
                  </p>
                  <p className="text-2xl font-semibold text-amber-700 mt-2">{activityAnalytics?.bookingViewFrequency?.dayPassViews ?? 0}</p>
                </div>
                <div className="rounded-2xl p-4 border border-violet-200 bg-gradient-to-br from-violet-50 to-white">
                  <p className="text-xs uppercase tracking-wide text-violet-700 font-medium">
                    View Time ({activityRange === 'week' ? '7d' : activityRange === 'month' ? '30d' : '1yr'})
                  </p>
                  <p className="text-2xl font-semibold text-violet-700 mt-2">{formatSeconds(activityAnalytics?.bookingViewFrequency?.totalBookingViewTime ?? 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-b from-slate-50/70 to-white">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4 tracking-tight">
                    Booking Views Trend ({activityRange === 'week' ? 'Last 7 Days' : activityRange === 'month' ? 'Last 30 Days' : 'Last 12 Months'})
                  </h4>
                  {(activityAnalytics?.bookingViewsByDay || []).length === 0 ? (
                    <div className="flex items-center justify-center h-72 text-slate-500">
                      <p>No booking activity data available.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={activityAnalytics?.bookingViewsByDay || []} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                        <defs>
                          <linearGradient id="roomViewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="amenityViewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="dayPassViewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ec" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={formatChartTick} stroke="#64748b" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                          labelFormatter={(value) => formatChartTooltipLabel(String(value))}
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="roomViews" name="Room" stroke="#0284c7" fill="url(#roomViewsGradient)" strokeWidth={2.25} />
                        <Area type="monotone" dataKey="amenityViews" name="Amenity" stroke="#0f766e" fill="url(#amenityViewsGradient)" strokeWidth={2.25} />
                        <Area type="monotone" dataKey="dayPassViews" name="Day Pass" stroke="#d97706" fill="url(#dayPassViewsGradient)" strokeWidth={2.25} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-b from-white to-slate-50/70">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4 tracking-tight">
                    Top Viewed Booking Interests ({activityRange === 'week' ? 'Last 7 Days' : activityRange === 'month' ? 'Last 30 Days' : 'Last 12 Months'})
                  </h4>
                  {(activityAnalytics?.topViewedItems || []).length === 0 ? (
                    <div className="flex items-center justify-center h-72 text-slate-500">
                      <p>No top-viewed booking data available.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={activityAnalytics?.topViewedItems || []} margin={{ top: 8, right: 12, left: -12, bottom: 50 }}>
                        <defs>
                          <linearGradient id="topItemsBarGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ec" vertical={false} />
                        <XAxis
                          dataKey="label"
                          stroke="#64748b"
                          angle={-30}
                          textAnchor="end"
                          height={76}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => String(value).length > 14 ? `${String(value).slice(0, 14)}...` : String(value)}
                        />
                        <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'total_time') {
                              return [formatSeconds(Number(value)), 'Total View Time'];
                            }
                            return [value, name === 'count' ? 'Views' : name];
                          }}
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }}
                        />
                        <Bar dataKey="count" fill="url(#topItemsBarGradient)" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                    Most Engaged Users ({activityRange === 'week' ? 'Last 7 Days' : activityRange === 'month' ? 'Last 30 Days' : 'Last 12 Months'})
                  </h4>
                  <span className="text-xs text-slate-500">Based on booking-related views</span>
                </div>
                {(activityAnalytics?.mostEngagedUsers || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No user-level booking engagement data yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="text-left border-b border-slate-200">
                          <th className="py-2 pr-4 text-xs uppercase tracking-wide text-slate-500 font-semibold">User</th>
                          <th className="py-2 px-4 text-xs uppercase tracking-wide text-slate-500 font-semibold">Email</th>
                          <th className="py-2 px-4 text-xs uppercase tracking-wide text-slate-500 font-semibold">Total Views</th>
                          <th className="py-2 pl-4 text-xs uppercase tracking-wide text-slate-500 font-semibold">Total View Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activityAnalytics?.mostEngagedUsers || []).map((user) => (
                          <tr key={user.user_id} className="border-b border-slate-100 last:border-b-0">
                            <td className="py-3 pr-4 text-sm text-slate-900 font-medium">{user.name || `User #${user.user_id}`}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{user.email}</td>
                            <td className="py-3 px-4 text-sm text-slate-900">{user.total_views}</td>
                            <td className="py-3 pl-4 text-sm text-slate-900">{formatSeconds(user.total_time)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border border-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                  >
                    <TrendingUp size={18} />
                    Generate Report
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
                            <p className="text-xl font-bold text-primary">â‚±{parseFloat(reportData.summary.totalRevenue).toLocaleString()}</p>
                          </div>
                        </>
                      )}
                      {reportType === 'revenue' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Grand Total</p>
                            <p className="text-xl font-bold text-green-600">â‚±{parseFloat(reportData.summary.grandTotal).toLocaleString()}</p>
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
                            <p className="text-xl font-bold text-green-600">â‚±{parseFloat(reportData.summary.totalSpent).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Avg per Guest</p>
                            <p className="text-xl font-bold text-gray-900">â‚±{parseFloat(reportData.summary.avgSpentPerGuest).toLocaleString()}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    Period: {reportData.period.startDate} to {reportData.period.endDate}
                  </div>

                  {reportType === 'bookings' && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Booking ID</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Guest</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Item</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {reportData.bookings?.length ? reportData.bookings.map((booking: any) => (
                              <tr key={`${booking.booking_type}-${booking.id}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">#{booking.id}</td>
                                <td className="px-4 py-3 text-sm capitalize text-gray-700">{booking.booking_type || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{booking.user_name || booking.user_email || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{booking.room_name || booking.amenity_name || 'Day Pass'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{formatDate(booking.created_at)}</td>
                                <td className="px-4 py-3 text-sm capitalize text-gray-700">{booking.status || '-'}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{booking.total_amount || 'â‚±0.00'}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No booking records found for the selected period.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {reportType === 'revenue' && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px]">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Period</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Room Bookings</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Amenity Bookings</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Day Pass Bookings</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Bookings</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Room Revenue</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Amenity Revenue</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Day Pass Revenue</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {reportData.data?.length ? reportData.data.map((row: any) => (
                              <tr key={row.period} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{row.period}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{row.roomBookings || 0}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{row.amenityBookings || 0}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{row.dayPassBookings || 0}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.totalBookings || 0}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">â‚±{Number(row.roomRevenue || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">â‚±{Number(row.amenityRevenue || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">â‚±{Number(row.dayPassRevenue || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-green-700">â‚±{Number(row.totalRevenue || 0).toLocaleString()}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">No revenue records found for the selected period.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {reportType === 'occupancy' && (
                    <div className="space-y-4 mt-4">
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                          <h4 className="text-sm font-semibold text-gray-800">Daily Occupancy</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[720px]">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Occupied Rooms</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Rooms</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Occupancy Rate</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {reportData.dailyOccupancy?.length ? reportData.dailyOccupancy.map((row: any) => (
                                <tr key={row.date} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{formatDate(row.date)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{row.occupied_rooms || 0}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{row.total_rooms || 0}</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-primary">{row.occupancyRate || '0'}%</td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">No occupancy records found for the selected period.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                          <h4 className="text-sm font-semibold text-gray-800">Room Type Breakdown</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[620px]">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Room Type</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Bookings</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Check-ins</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {reportData.roomTypeBreakdown?.length ? reportData.roomTypeBreakdown.map((row: any, index: number) => (
                                <tr key={`${row.room_type || 'unknown'}-${index}`} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{row.room_type || 'N/A'}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{row.total_bookings || 0}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{row.check_ins || 0}</td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">No room type data found for the selected period.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === 'guests' && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px]">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Guest Name</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Phone</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Bookings</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Spent</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">First Booking</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Last Booking</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {reportData.guests?.length ? reportData.guests.map((guest: any) => (
                              <tr key={guest.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{guest.name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{guest.email || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{guest.phone || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{guest.total_bookings || 0}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-green-700">â‚±{Number(guest.total_spent || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{guest.first_booking_date ? formatDate(guest.first_booking_date) : '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{guest.last_booking_date ? formatDate(guest.last_booking_date) : '-'}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No guest records found for the selected period.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Room Bookings CMS Tab */}
        {activeTab === 'facilities' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">Room Bookings CMS</h2>

            <div className="bg-white rounded-xl shadow-md border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Manage room catalog used by booking and availability flows.</p>
                  <input
                    type="text"
                    value={roomSearchTerm}
                    onChange={(e) => setRoomSearchTerm(e.target.value)}
                    placeholder="Search room name, type, or room numbers"
                    className="w-full md:max-w-md px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <button
                  onClick={openCreateRoomForm}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm border border-blue-700"
                >
                  <Plus size={18} />
                  Add Room
                </button>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <h3 className="text-base sm:text-lg font-display font-bold text-gray-900">Room Bookings Data Table</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">All active room types and editable catalog details.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-y border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wide">Room Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wide">Room Numbers</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wide">Capacity</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wide">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRooms.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No rooms found</td>
                      </tr>
                    )}
                    {filteredRooms.map((room) => (
                      <tr key={room.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{room.room_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{room.room_type}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{room.room_numbers}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{room.capacity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{room.price_per_night}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            room.is_occupied === 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {room.is_occupied === 1 ? 'Occupied' : 'Available'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openEditRoomForm(room)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit room"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => removeRoom(room)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete room"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {showRoomForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => {
                setShowRoomForm(false);
                setEditingRoomId(null);
                setRoomForm(DEFAULT_ROOM_FORM);
              }}>
                <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold text-gray-900">
                      {editingRoomId ? 'Edit Room' : 'Add New Room'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowRoomForm(false);
                        setEditingRoomId(null);
                        setRoomForm(DEFAULT_ROOM_FORM);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-6 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                        <input
                          type="text"
                          value={roomForm.room_name}
                          onChange={(e) => setRoomForm({ ...roomForm, room_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                        <select
                          value={roomForm.room_type}
                          onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value as RoomFormState['room_type'] })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="Standard Room (Aircon)">Standard Room (Aircon)</option>
                          <option value="Non-Aircon Room">Non-Aircon Room</option>
                          <option value="Family Fan Room">Family Fan Room</option>
                          <option value="Large Family Room">Large Family Room</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Numbers</label>
                        <input
                          type="text"
                          value={roomForm.room_numbers}
                          onChange={(e) => setRoomForm({ ...roomForm, room_numbers: e.target.value })}
                          placeholder="e.g. 101, 102, 103"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                        <input
                          type="number"
                          min={1}
                          value={roomForm.capacity}
                          onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Night</label>
                        <input
                          type="text"
                          value={roomForm.price_per_night}
                          onChange={(e) => setRoomForm({ ...roomForm, price_per_night: e.target.value })}
                          placeholder="e.g. â‚±1600"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-7">
                        <input
                          id="room-active"
                          type="checkbox"
                          checked={roomForm.is_active}
                          onChange={(e) => setRoomForm({ ...roomForm, is_active: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <label htmlFor="room-active" className="text-sm text-gray-700">Active</label>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                        <input
                          type="text"
                          value={roomForm.amenities}
                          onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                          placeholder="e.g. Air conditioning, TV, Private bathroom"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          rows={3}
                          value={roomForm.description}
                          onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                        <textarea
                          rows={3}
                          value={roomForm.special_requests}
                          onChange={(e) => setRoomForm({ ...roomForm, special_requests: e.target.value })}
                          placeholder="e.g. No smoking, No pets, Quiet hours after 10 PM"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setShowRoomForm(false);
                        setEditingRoomId(null);
                        setRoomForm(DEFAULT_ROOM_FORM);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                      disabled={roomFormLoading}
                    >
                      Cancel
                    </button>
                      {editingRoomId && (
                        <button
                          onClick={() => openExtraItemsModal(editingRoomId)}
                          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
                          disabled={roomFormLoading}
                        >
                          Manage Extra Items
                        </button>
                      )}
                    <button
                      onClick={saveRoom}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 border border-emerald-700 shadow-sm font-semibold"
                      disabled={roomFormLoading}
                    >
                      {roomFormLoading ? 'Saving...' : editingRoomId ? 'Update Room' : 'Create Room'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showExtraItemsModal && editingRoomId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => {
                setShowExtraItemsModal(false);
                setExtraItemForm(DEFAULT_EXTRA_ITEM_FORM);
                setEditingItemId(null);
              }}>
                <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold text-gray-900">Manage Extra Items</h3>
                    <button
                      onClick={() => {
                        setShowExtraItemsModal(false);
                        setExtraItemForm(DEFAULT_EXTRA_ITEM_FORM);
                        setEditingItemId(null);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-6 max-h-[75vh] overflow-y-auto">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        {editingItemId ? 'Edit Item' : 'Add New Item'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
                          <input
                            type="text"
                            value={extraItemForm.item_name}
                            onChange={(e) => setExtraItemForm({ ...extraItemForm, item_name: e.target.value })}
                            placeholder="e.g. Extra Bed"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
                          <input
                            type="text"
                            value={extraItemForm.price}
                            onChange={(e) => setExtraItemForm({ ...extraItemForm, price: e.target.value })}
                            placeholder="e.g. â‚±150"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                          <input
                            type="text"
                            value={extraItemForm.unit}
                            onChange={(e) => setExtraItemForm({ ...extraItemForm, unit: e.target.value })}
                            placeholder="e.g. bed, fan, set"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <button
                            onClick={() => saveExtraItem(editingRoomId)}
                            disabled={extraItemLoading}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
                          >
                            {extraItemLoading ? 'Saving...' : editingItemId ? 'Update' : 'Add Item'}
                          </button>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            rows={2}
                            value={extraItemForm.description}
                            onChange={(e) => setExtraItemForm({ ...extraItemForm, description: e.target.value })}
                            placeholder="Optional description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Available Items ({roomExtraItems.length})</h4>
                    {roomExtraItems.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-4">No extra items added yet</p>
                    ) : (
                      <div className="space-y-2">
                        {roomExtraItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.item_name}</p>
                              <p className="text-sm text-gray-600">
                                {item.price} {item.unit && `/ ${item.unit}`}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setExtraItemForm({
                                    item_name: item.item_name,
                                    price: item.price,
                                    unit: item.unit || '',
                                    description: item.description || ''
                                  });
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => deleteExtraItem(editingRoomId, item.id)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setShowExtraItemsModal(false);
                        setExtraItemForm(DEFAULT_EXTRA_ITEM_FORM);
                        setEditingItemId(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
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
            <h2 className="text-2xl font-display font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Manage receptionist and admin accounts, control access, and lock accounts as needed.</p>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary to-accent">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Account Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Joined Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Actions</th>
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
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'receptionist' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-700' :
                            user.status === 'locked' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {user.status === 'active' ? 'Active' : 
                             user.status === 'locked' ? 'Locked' : 
                             'Deleted'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {user.status === 'active' && (
                              <>
                                <button
                                  onClick={() => handleUserAction(user.id, 'lock')}
                                  disabled={userActionLoading[user.id] || user.role === 'admin'}
                                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  <Lock size={14} />
                                  Lock
                                </button>
                                <button
                                  onClick={() => handleUserAction(user.id, 'delete')}
                                  disabled={userActionLoading[user.id] || user.role === 'admin'}
                                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </>
                            )}
                            {user.status === 'locked' && (
                              <button
                                onClick={() => handleUserAction(user.id, 'unlock')}
                                disabled={userActionLoading[user.id] || user.role === 'admin'}
                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                <Unlock size={14} />
                                Activate
                              </button>
                            )}
                            {user.role === 'admin' && (
                              <span className="px-3 py-1 text-xs text-gray-500">No actions</span>
                            )}
                          </div>
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
          <>
            <AdminSiteSettings />
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-2">Reservation Payment Settings</h3>
              <PaymentSettingsEditor isAdmin={true} />
            </div>
          </>
        )}

        {/* Inquiries & FAQ Tab */}
        {activeTab === 'inquiries' && (
          <AdminInquiries />
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <ReceptionistInventory embedded />
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
                  <select value={auditActionFilter} onChange={e => setAuditActionFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">All Actions</option>
                    <option value="LOCK_USER">Lock User</option>
                    <option value="UNLOCK_USER">Unlock User</option>
                    <option value="DELETE_USER">Delete User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={auditStartDate} onChange={e => setAuditStartDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input type="date" value={auditEndDate} onChange={e => setAuditEndDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <button onClick={() => fetchAuditLogs(1)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                  <RefreshCw size={14} className={auditLoading ? 'animate-spin' : ''} />
                  Filter
                </button>
              </div>
            </div>

            {/* Logs table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {auditLoading ? (
                <div className="p-8 text-center text-gray-400">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No audit logs found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Date & Time</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Admin</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Target</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Details</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{log.user_name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              log.action === 'LOCK_USER' ? 'bg-yellow-100 text-yellow-800' :
                              log.action === 'UNLOCK_USER' ? 'bg-green-100 text-green-700' :
                              log.action === 'DELETE_USER' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{log.entity_type} #{log.entity_id}</td>
                          <td className="px-4 py-3 text-gray-600">{log.details}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip_address || 'â€”'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {auditTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => fetchAuditLogs(auditPage - 1)} disabled={auditPage <= 1 || auditLoading} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  Previous
                </button>
                <span className="text-sm text-gray-600">Page {auditPage} of {auditTotalPages}</span>
                <button onClick={() => fetchAuditLogs(auditPage + 1)} disabled={auditPage >= auditTotalPages || auditLoading} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  Next
                </button>
              </div>
            )}
          </div>
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

