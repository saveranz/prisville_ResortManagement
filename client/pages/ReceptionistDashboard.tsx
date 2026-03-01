import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Home, Package, LogOut, CheckCircle, XCircle, TrendingUp, Clock, DollarSign, FileText, Plus, Minus, TrendingDown, Image as ImageIcon, X, LogIn, LogOutIcon, AlertCircle, History, Settings, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Booking {
  id: number;
  user_email: string;
  booking_date?: string;
  booking_type?: string;
  check_in?: string;
  check_out?: string;
  check_in_date?: string;
  check_out_date?: string;
  actual_check_in?: string;
  actual_check_out?: string;
  room_status?: string;
  guests?: number;
  number_of_pax?: number;
  room_name?: string;
  room_numbers?: string;
  amenity_name?: string;
  total_amount: string;
  status: string;
  created_at: string;
  payment_proof?: string;
}

interface RoomStatus {
  id: number;
  room_name: string;
  room_numbers: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance' | 'out_of_order';
  current_booking_id?: number;
  current_guest_email?: string;
  last_cleaned?: string;
  notes?: string;
}

interface StayHistory {
  id: number;
  user_email: string;
  booking_type: string;
  room_name?: string;
  amenity_name?: string;
  check_in_date?: string;
  actual_check_in?: string;
  actual_check_out?: string;
  nights_stayed: number;
  total_spent: string;
  rating?: number;
  staff_notes?: string;
  created_at: string;
}

interface BookingIssue {
  id: number;
  booking_id: number;
  booking_type: string;
  user_email: string;
  issue_type: string;
  priority: string;
  subject: string;
  description: string;
  status: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  approvedToday: number;
  totalRevenue: number;
}

interface InventoryItem {
  id: number;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: string;
  last_updated: string;
}

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: string;
  transaction_date: string;
  created_at: string;
}

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'amenities' | 'daypass' | 'inventory' | 'checkin' | 'roomstatus' | 'history' | 'issues'>('overview');
  const [roomBookings, setRoomBookings] = useState<Booking[]>([]);
  const [amenityBookings, setAmenityBookings] = useState<Booking[]>([]);
  const [dayPassBookings, setDayPassBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingBookings: 0,
    approvedToday: 0,
    totalRevenue: 0
  });
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  
  // Inventory management states
  const [inventoryTab, setInventoryTab] = useState<'inventory' | 'transactions'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: '',
    category: '',
    quantity: '',
    unit: '',
    unit_price: ''
  });
  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  
  // New feature states
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [checkedInGuests, setCheckedInGuests] = useState<Booking[]>([]);
  const [stayHistory, setStayHistory] = useState<StayHistory[]>([]);
  const [bookingIssues, setBookingIssues] = useState<BookingIssue[]>([]);
  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState<Booking | null>(null);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [newIssue, setNewIssue] = useState({
    bookingId: 0,
    bookingType: 'room',
    userEmail: '',
    issueType: 'complaint',
    priority: 'medium',
    subject: '',
    description: ''
  });
  
  // Notification modal states
  const [notificationModal, setNotificationModal] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });
  const [checkInConfirmModal, setCheckInConfirmModal] = useState({ open: false, booking: null as Booking | null, bookingType: '' });
  const [checkOutModal, setCheckOutModal] = useState({ open: false, booking: null as Booking | null, bookingType: '', notes: '' });
  
  const navigate = useNavigate();

  // Helper function to format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to format date with time
  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    checkAuth();
    fetchAllBookings();
    fetchInventory();
    fetchTransactions();
    fetchRoomStatuses();
    fetchCheckedInGuests();
    fetchStayHistory();
    fetchBookingIssues();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [roomBookings, amenityBookings, dayPassBookings, transactions]);

  const calculateStats = () => {
    const allBookings = [...roomBookings, ...amenityBookings, ...dayPassBookings];
    const today = new Date().toISOString().split('T')[0];
    
    const totalBookings = allBookings.length;
    const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
    const approvedToday = allBookings.filter(b => 
      b.status === 'approved' && 
      new Date(b.created_at).toISOString().split('T')[0] === today
    ).length;
    
    // Calculate total revenue from transaction history (income transactions only)
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.replace(/[₱,]/g, '')), 0);

    setStats({ totalBookings, pendingBookings, approvedToday, totalRevenue });
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json();
      
      if (!data.success || (data.user.role !== 'receptionist' && data.user.role !== 'admin')) {
        window.location.href = '/';
      } else {
        setUser(data.user);
      }
    } catch (error) {
      window.location.href = '/';
    }
  };

  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const [roomsRes, amenitiesRes, dayPassRes] = await Promise.all([
        fetch('/api/bookings/room/all', { credentials: 'include' }),
        fetch('/api/bookings/amenity/all', { credentials: 'include' }),
        fetch('/api/bookings/day-pass/all', { credentials: 'include' })
      ]);

      const roomsData = await roomsRes.json();
      const amenitiesData = await amenitiesRes.json();
      const dayPassData = await dayPassRes.json();

      if (roomsData.success) setRoomBookings(roomsData.bookings);
      if (amenitiesData.success) setAmenityBookings(amenitiesData.bookings);
      if (dayPassData.success) setDayPassBookings(dayPassData.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (type: string, bookingId: number, status: 'approved' | 'rejected') => {
    try {
      const endpoint = type === 'room' ? '/api/bookings/room/status' :
                      type === 'amenity' ? '/api/bookings/amenity/status' :
                      '/api/bookings/day-pass/status';

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId, status })
      });

      const data = await response.json();

      if (data.success) {
        fetchAllBookings(); // Refresh the list
      } else {
        alert('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Inventory Management Functions
  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setInventory(data.items);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/inventory/transactions', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // New Feature Functions
  const fetchRoomStatuses = async () => {
    try {
      const response = await fetch('/api/room-status', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setRoomStatuses(data.rooms);
      }
    } catch (error) {
      console.error('Error fetching room statuses:', error);
    }
  };

  const fetchCheckedInGuests = async () => {
    try {
      const response = await fetch('/api/checkin/current', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setCheckedInGuests(data.guests);
      }
    } catch (error) {
      console.error('Error fetching checked-in guests:', error);
    }
  };

  const fetchStayHistory = async () => {
    try {
      const response = await fetch('/api/stay-history/all', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setStayHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching stay history:', error);
    }
  };

  const fetchBookingIssues = async () => {
    try {
      const response = await fetch('/api/booking-issues', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setBookingIssues(data.issues);
      }
    } catch (error) {
      console.error('Error fetching booking issues:', error);
    }
  };

  const handleCheckIn = async (booking: Booking, bookingType: string) => {
    setCheckInConfirmModal({ open: true, booking, bookingType });
  };

  const confirmCheckIn = async () => {
    const { booking, bookingType } = checkInConfirmModal;
    if (!booking) return;

    setCheckInConfirmModal({ open: false, booking: null, bookingType: '' });

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId: booking.id, bookingType })
      });

      const data = await response.json();
      if (data.success) {
        setNotificationModal({ open: true, message: 'Guest checked in successfully!', type: 'success' });
        fetchAllBookings();
        fetchCheckedInGuests();
        fetchRoomStatuses();
        fetchStayHistory();
      } else {
        setNotificationModal({ open: true, message: data.message || 'Failed to check in guest', type: 'error' });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setNotificationModal({ open: true, message: 'Failed to check in guest', type: 'error' });
    }
  };

  const handleCheckOut = async (booking: Booking, bookingType: string) => {
    setCheckOutModal({ open: true, booking, bookingType, notes: '' });
  };

  const confirmCheckOut = async () => {
    const { booking, bookingType, notes } = checkOutModal;
    if (!booking) return;

    setCheckOutModal({ open: false, booking: null, bookingType: '', notes: '' });

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId: booking.id, bookingType, notes })
      });

      const data = await response.json();
      if (data.success) {
        setNotificationModal({ open: true, message: 'Guest checked out successfully!', type: 'success' });
        fetchAllBookings();
        fetchCheckedInGuests();
        fetchRoomStatuses();
        fetchStayHistory();
      } else {
        setNotificationModal({ open: true, message: data.message || 'Failed to check out guest', type: 'error' });
      }
    } catch (error) {
      console.error('Check-out error:', error);
      setNotificationModal({ open: true, message: 'Failed to check out guest', type: 'error' });
    }
  };

  const handleUpdateRoomStatus = async (roomNumbers: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/room-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roomNumbers, status, notes })
      });

      const data = await response.json();
      if (data.success) {
        fetchRoomStatuses();
      } else {
        alert('Failed to update room status');
      }
    } catch (error) {
      console.error('Error updating room status:', error);
      alert('Failed to update room status');
    }
  };

  const handleMarkRoomCleaned = async (roomNumbers: string) => {
    try {
      const response = await fetch('/api/room-status/cleaned', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roomNumbers })
      });

      const data = await response.json();
      if (data.success) {
        fetchRoomStatuses();
      }
    } catch (error) {
      console.error('Error marking room as cleaned:', error);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/booking-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newIssue)
      });

      const data = await response.json();
      if (data.success) {
        alert('Issue reported successfully');
        fetchBookingIssues();
        setShowIssueModal(false);
        setNewIssue({ bookingId: 0, bookingType: 'room', userEmail: '', issueType: 'complaint', priority: 'medium', subject: '', description: '' });
      }
    } catch (error) {
      console.error('Error creating issue:', error);
    }
  };

  const handleUpdateIssueStatus = async (issueId: number, status: string, resolution?: string) => {
    try {
      const response = await fetch('/api/booking-issues/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ issueId, status, resolution })
      });

      const data = await response.json();
      if (data.success) {
        fetchBookingIssues();
      }
    } catch (error) {
      console.error('Error updating issue status:', error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newItem)
      });
      const data = await response.json();
      if (data.success) {
        fetchInventory();
        setShowAddItem(false);
        setNewItem({ item_name: '', category: '', quantity: '', unit: '', unit_price: '' });
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const updateQuantity = async (itemId: number, change: number) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ change })
      });
      const data = await response.json();
      if (data.success) {
        fetchInventory();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTransaction)
      });
      const data = await response.json();
      if (data.success) {
        fetchTransactions();
        setShowAddTransaction(false);
        setNewTransaction({
          type: 'income',
          category: '',
          description: '',
          amount: '',
          transaction_date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const calculateTotals = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.replace(/[₱,]/g, '')), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.replace(/[₱,]/g, '')), 0);
    
    return {
      income,
      expenses,
      profit: income - expenses
    };
  };

  const renderRecentBookings = () => {
    const allBookings = [...roomBookings, ...amenityBookings, ...dayPassBookings]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    if (allBookings.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
          <p>No bookings yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {allBookings.map((booking) => (
          <div key={`${booking.id}-${booking.user_email}`} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-primary/5 rounded-xl border border-primary/20 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border-2 ${
                booking.room_name ? 'bg-primary/10 border-primary/30 text-primary' :
                booking.amenity_name ? 'bg-primary/10 border-primary/30 text-primary' :
                'bg-primary/10 border-primary/30 text-primary'
              }`}>
                {booking.room_name ? <Home size={22} /> :
                 booking.amenity_name ? <Calendar size={22} /> :
                 <Users size={22} />}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{booking.user_email}</p>
                <p className="text-sm text-gray-600">
                  {booking.room_name || booking.amenity_name || 'Day Pass'} • {formatDate(booking.check_in || booking.booking_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-900">{booking.total_amount}</span>
              <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {booking.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBookingTable = (bookings: Booking[], type: string) => {
    if (loading) {
      return (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      );
    }

    if (bookings.length === 0) {
      return (
        <div className="text-center py-20">
          <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500">No bookings found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gradient-to-r from-primary to-primary/90">
              <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase whitespace-nowrap">ID</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Guest</th>
              {type === 'room' && <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Room</th>}
              {type === 'amenity' && <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Amenity</th>}
              <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Date</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Pax</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Amount</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Proof</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Status</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-xs font-semibold text-gray-900">#{booking.id}</span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-primary text-xs font-bold">
                        {booking.user_email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-700 truncate max-w-[120px]" title={booking.user_email}>{booking.user_email}</span>
                  </div>
                </td>
                {type === 'room' && <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-gray-900">{booking.room_name}</td>}
                {type === 'amenity' && <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-gray-900">{booking.amenity_name}</td>}
                <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700">
                  {formatDate(booking.check_in || booking.booking_date)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700 text-center">
                  {booking.guests || booking.number_of_pax}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold text-gray-900">{booking.total_amount}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {booking.payment_proof ? (
                    <button
                      onClick={() => setViewingProof(booking.payment_proof || null)}
                      className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-xs font-semibold"
                    >
                      <ImageIcon size={12} />
                      View
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm ${
                    booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                    booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {booking.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-xs">
                  {booking.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateBookingStatus(type, booking.id, 'approved')}
                        className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded-lg flex items-center gap-1 transition-all font-semibold text-xs"
                        title="Approve"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => updateBookingStatus(type, booking.id, 'rejected')}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-300 px-2 py-1 rounded-lg flex items-center gap-1 transition-all font-semibold text-xs"
                        title="Reject"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-xl flex flex-col border-r border-primary/20">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center overflow-hidden bg-white">
              <img src="/PTR-logo.png" alt="Prisville Logo" className="w-full h-full object-cover scale-150" />
            </div>
            <div>
              <h1 className="font-display font-bold text-gray-900 text-lg tracking-tight">Prisville</h1>
              <p className="text-xs text-gray-600 font-medium">Resort Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-accent/10 text-accent font-semibold  border-l-4 border-accent'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <TrendingUp size={20} />
            <span className="tracking-wide">Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('rooms')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'rooms'
                ? 'bg-primary/10 text-primary font-semibold  border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Home size={20} />
            <span className="tracking-wide">Room Bookings</span>
            {roomBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow-lg">
                {roomBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('amenities')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'amenities'
                ? 'bg-primary/10 text-primary font-semibold  border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Calendar size={20} />
            <span className="tracking-wide">Amenities</span>
            {amenityBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow-lg">
                {amenityBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('daypass')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'daypass'
                ? 'bg-primary/10 text-primary font-semibold  border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Users size={20} />
            <span className="tracking-wide">Day Pass</span>
            {dayPassBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow-lg">
                {amenityBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'inventory'
                ? 'bg-primary/10 text-primary font-semibold  border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Package size={20} />
            <span className="tracking-wide">Inventory</span>
          </button>

          <div className="pt-2 mt-2 border-t border-gray-200">
            <p className="text-xs font-semibold text-accent px-4 mb-2 tracking-wider">RESORT OPERATIONS</p>
          </div>

          <button
            onClick={() => setActiveTab('checkin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'checkin'
                ? 'bg-primary/10 text-primary font-semibold  border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <LogIn size={20} />
            <span className="tracking-wide">Check-In/Out</span>
          </button>

          <button
            onClick={() => setActiveTab('roomstatus')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'roomstatus'
                ? 'bg-primary/10 text-primary font-semibold  border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Settings size={20} />
            <span className="tracking-wide">Room Status</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-primary/10 text-primary font-semibold  border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <History size={20} />
            <span className="tracking-wide">Stay History</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'issues'
                ? 'bg-primary/10 text-primary font-semibold  border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <AlertCircle size={20} />
            <span className="tracking-wide">Issues</span>
            {bookingIssues.filter(i => i.status === 'open').length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow-lg">
                {bookingIssues.filter(i => i.status === 'open').length}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-accent shadow-md flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-sm">
                {user?.name?.charAt(0) || 'R'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-semibold shadow-md"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">
                {activeTab === 'overview' ? 'Dashboard Overview' :
                 activeTab === 'rooms' ? 'Room Bookings' :
                 activeTab === 'amenities' ? 'Amenity Bookings' :
                 activeTab === 'daypass' ? 'Day Pass Bookings' :
                 activeTab === 'inventory' ? 'Inventory Management' :
                 activeTab === 'checkin' ? 'Check-In / Check-Out' :
                 activeTab === 'roomstatus' ? 'Room Status Board' :
                 activeTab === 'history' ? 'Stay History' :
                 activeTab === 'issues' ? 'Booking Issues' :
                 'Dashboard'}
              </h2>
              <p className="text-gray-600 text-sm mt-1 font-medium">
                {activeTab === 'inventory' 
                  ? 'Manage inventory items and financial transactions'
                  : activeTab === 'checkin'
                  ? 'Manage guest check-ins and check-outs'
                  : activeTab === 'roomstatus'
                  ? 'Monitor and update room availability and status'
                  : activeTab === 'history'
                  ? 'View guest stay records and statistics'
                  : activeTab === 'issues'
                  ? 'Track and resolve booking issues and requests'
                  : 'Manage all resort bookings and operations'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
                <p className="text-xs text-gray-600 font-medium">Today's Date</p>
                <p className="text-base font-bold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 bg-gray-50">
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md border-l-4 border-primary p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
                      <p className="text-3xl font-display font-bold text-gray-900 mt-2 tracking-tight">{stats.totalBookings}</p>
                      <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
                        <TrendingUp size={14} />
                        All time
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 shadow-sm flex items-center justify-center">
                      <FileText className="text-primary" size={26} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border-l-4 border-primary p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Pending</p>
                      <p className="text-3xl font-display font-bold text-gray-900 mt-2 tracking-tight">{stats.pendingBookings}</p>
                      <p className="text-orange-400 text-sm mt-2 flex items-center gap-1">
                        <Clock size={14} />
                        Awaiting approval
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 shadow-sm flex items-center justify-center">
                      <Clock className="text-primary" size={26} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border-l-4 border-primary p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Approved Today</p>
                      <p className="text-3xl font-display font-bold text-gray-900 mt-2 tracking-tight">{stats.approvedToday}</p>
                      <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Confirmed
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 shadow-sm flex items-center justify-center">
                      <CheckCircle className="text-primary" size={26} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border-l-4 border-accent p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-display font-bold text-gray-900 mt-2 tracking-tight">₱{stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-accent text-sm mt-2 flex items-center gap-1">
                        <DollarSign size={14} />
                        Income transactions
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/30 shadow-sm flex items-center justify-center">
                      <DollarSign className="text-accent" size={26} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-md border-l-4 border-primary p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-semibold text-gray-900 tracking-tight">Room Bookings</h3>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Home size={24} className="text-primary" />
                    </div>
                  </div>
                  <p className="text-4xl font-display font-bold mb-2 text-gray-900 tracking-tight">{roomBookings.length}</p>
                  <button
                    onClick={() => setActiveTab('rooms')}
                    className="mt-4 w-full bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-lg"
                  >
                    View Details →
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-md border-l-4 border-primary p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-semibold text-gray-900 tracking-tight">Amenity Bookings</h3>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Calendar size={24} className="text-primary" />
                    </div>
                  </div>
                  <p className="text-4xl font-display font-bold mb-2 text-gray-900 tracking-tight">{amenityBookings.length}</p>
                  <button
                    onClick={() => setActiveTab('amenities')}
                    className="mt-4 w-full bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-lg"
                  >
                    View Details →
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-md border-l-4 border-accent p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-semibold text-gray-900 tracking-tight">Day Pass</h3>
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
                      <Users size={24} className="text-accent" />
                    </div>
                  </div>
                  <p className="text-4xl font-display font-bold mb-2 text-gray-900 tracking-tight">{dayPassBookings.length}</p>
                  <button
                    onClick={() => setActiveTab('daypass')}
                    className="mt-4 w-full bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-lg"
                  >
                    View Details →
                  </button>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all">
                <h3 className="text-xl font-display font-bold text-gray-900 mb-5 flex items-center gap-2 tracking-tight">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <Clock className="text-accent" size={20} />
                  </div>
                  Recent Bookings
                </h3>
                {renderRecentBookings()}
              </div>
            </>
          )}
          
          {activeTab === 'rooms' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200">
              {renderBookingTable(roomBookings, 'room')}
            </div>
          )}
          
          {activeTab === 'amenities' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200">
              {renderBookingTable(amenityBookings, 'amenity')}
            </div>
          )}
          
          {activeTab === 'daypass' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200">
              {renderBookingTable(dayPassBookings, 'daypass')}
            </div>
          )}
          
          {activeTab === 'inventory' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Income</p>
                      <p className="text-3xl font-display font-bold text-green-600 mt-1 tracking-tight">₱{calculateTotals().income.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                      <TrendingUp className="text-white" size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Expenses</p>
                      <p className="text-3xl font-display font-bold text-red-600 mt-1 tracking-tight">₱{calculateTotals().expenses.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                      <TrendingDown className="text-white" size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Net Profit</p>
                      <p className={`text-3xl font-display font-bold mt-1 tracking-tight ${calculateTotals().profit >= 0 ? 'text-primary' : 'text-red-600'}`}>
                        ₱{calculateTotals().profit.toLocaleString()}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${calculateTotals().profit >= 0 ? 'bg-gradient-to-br from-primary to-primary/90' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                      <DollarSign className="text-white" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs for Inventory */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex gap-8">
                  <button
                    onClick={() => setInventoryTab('inventory')}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-semibold text-sm transition-all ${
                      inventoryTab === 'inventory'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Package size={20} />
                    Inventory Items
                  </button>
                  <button
                    onClick={() => setInventoryTab('transactions')}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-semibold text-sm transition-all ${
                      inventoryTab === 'transactions'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign size={20} />
                    Transactions
                  </button>
                </nav>
              </div>

              {/* Inventory Items */}
              {inventoryTab === 'inventory' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-display font-bold text-gray-900 tracking-tight">Inventory Items</h2>
                    <button
                      onClick={() => setShowAddItem(!showAddItem)}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground px-5 py-2.5 rounded-xl border border-accent/50 hover:shadow-accent/20 hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
                    >
                      <Plus size={20} />
                      Add Item
                    </button>
                  </div>

                  {showAddItem && (
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                      <form onSubmit={handleAddItem} className="grid grid-cols-5 gap-4">
                        <input
                          type="text"
                          placeholder="Item Name"
                          value={newItem.item_name}
                          onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Category"
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Quantity"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Unit (pcs, kg, etc)"
                          value={newItem.unit}
                          onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Unit Price"
                          value={newItem.unit_price}
                          onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                        <button type="submit" className="col-span-5 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-3 rounded-xl border border-accent/50 hover:shadow-accent/20 hover:shadow-lg transition-all font-semibold">
                          Save Item
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-primary/20 border-b-2 border-primary/30">
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Item Name</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Category</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Price</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Total</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {inventory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-700/30 transition-colors">
                            <td className="px-3 py-2 text-xs text-white whitespace-nowrap">{item.item_name}</td>
                            <td className="px-3 py-2 text-xs text-white whitespace-nowrap">{item.category}</td>
                            <td className="px-3 py-2 text-xs text-white whitespace-nowrap">{item.quantity} {item.unit}</td>
                            <td className="px-3 py-2 text-xs text-white whitespace-nowrap">{item.unit_price}</td>
                            <td className="px-3 py-2 text-xs text-white whitespace-nowrap">
                              ₱{(item.quantity * parseFloat(item.unit_price.replace(/[₱,]/g, ''))).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-xs whitespace-nowrap">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="text-primary hover:text-accent p-1 transition-colors"
                                  title="Increase quantity"
                                >
                                  <Plus size={16} />
                                </button>
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="text-accent hover:text-primary p-1 transition-colors"
                                  title="Decrease quantity"
                                >
                                  <Minus size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Transactions */}
              {inventoryTab === 'transactions' && (
                <div className="bg-white rounded-xl shadow-md">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-display font-bold text-gray-900 tracking-tight">Financial Transactions</h2>
                    <button
                      onClick={() => setShowAddTransaction(!showAddTransaction)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary px-5 py-2.5 rounded-xl border-2 border-primary/30 hover:shadow-md transition-all flex items-center gap-2 font-semibold"
                    >
                      <Plus size={20} />
                      Add Transaction
                    </button>
                  </div>

                  {showAddTransaction && (
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-primary/5 to-white">
                      <form onSubmit={handleAddTransaction} className="grid grid-cols-2 gap-4">
                        <select
                          value={newTransaction.type}
                          onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'income' | 'expense' })}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        >
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Category"
                          value={newTransaction.category}
                          onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={newTransaction.description}
                          onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent col-span-2"
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={newTransaction.amount}
                          onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                        <input
                          type="date"
                          value={newTransaction.transaction_date}
                          onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                        <button type="submit" className="col-span-2 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-3 rounded-xl border border-accent/50 hover:shadow-accent/20 hover:shadow-lg transition-all font-semibold">
                          Save Transaction
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-primary/20 border-b-2 border-primary/30">
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Category</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Description</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-accent uppercase whitespace-nowrap">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-700/30 transition-colors">
                            <td className="px-3 py-2 text-xs text-white whitespace-nowrap">{transaction.transaction_date}</td>
                            <td className="px-3 py-2 text-xs whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.type === 'income' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-primary/20 text-primary border border-primary/30'
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-white whitespace-nowrap">{transaction.category}</td>
                            <td className="px-3 py-2 text-xs text-white whitespace-nowrap">{transaction.description}</td>
                            <td className={`px-3 py-2 text-xs font-semibold whitespace-nowrap ${
                              transaction.type === 'income' ? 'text-accent' : 'text-primary'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}₱{parseFloat(transaction.amount.replace(/[₱,]/g, '')).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Check-In/Check-Out Tab */}
          {activeTab === 'checkin' && (
            <>
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Approved Bookings Ready for Check-In */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-display font-bold text-gray-900">Ready for Check-In</h3>
                    <p className="text-sm text-gray-600 mt-1">Approved bookings scheduled for today</p>
                  </div>
                  <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                    {roomBookings
                      .filter(b => b.status === 'approved' && !b.actual_check_in)
                      .map(booking => (
                        <div key={booking.id} className="bg-primary/5 border border-primary/20 rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-gray-900">{booking.room_name}</p>
                              <p className="text-sm text-gray-600">{booking.user_email}</p>
                            </div>
                            <span className="px-3 py-1 bg-accent/20 text-accent border border-accent/30 text-xs font-bold rounded-full">
                              {booking.booking_type}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mb-3">
                            {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                          </div>
                          <button
                            onClick={() => handleCheckIn(booking, 'room')}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                          >
                            <LogIn size={16} />
                            Check In
                          </button>
                        </div>
                      ))}
                    {roomBookings.filter(b => b.status === 'approved' && !b.actual_check_in).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No pending check-ins</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Currently Checked-In Guests */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-display font-bold text-gray-900">Currently Checked-In</h3>
                    <p className="text-sm text-gray-600 mt-1">Active guests at the resort</p>
                  </div>
                  <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                    {checkedInGuests.map((guest: any) => (
                      <div key={`${guest.booking_type}-${guest.booking_id}`} className="border border-accent/30 bg-accent/5 rounded-xl p-4 hover:border-accent/50 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-gray-900">{guest.room_name || guest.amenity_name || 'Day Pass'}</p>
                            <p className="text-sm text-gray-600">{guest.user_email}</p>
                          </div>
                          <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full shadow-lg">
                            Active
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mb-3">
                          Checked in: {new Date(guest.actual_check_in).toLocaleString()}
                        </div>
                        <button
                          onClick={() => handleCheckOut({ ...guest, id: guest.booking_id }, guest.booking_type)}
                          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <LogOutIcon size={16} />
                          Check Out
                        </button>
                      </div>
                    ))}
                    {checkedInGuests.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No guests currently checked in</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Room Status Tab */}
          {activeTab ==='roomstatus' && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-display font-bold text-gray-900 mb-2">Room Status Board</h3>
                <p className="text-sm text-gray-600">Monitor and update room availability</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {roomStatuses.map((room: RoomStatus) => (
                  <div
                    key={room.room_numbers}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      room.status === 'available' ? 'border-primary/50 bg-primary/10 hover:border-primary' :
                      room.status === 'occupied' ? 'border-accent/50 bg-accent/10 hover:border-accent' :
                      room.status === 'cleaning' ? 'border-secondary/50 bg-secondary/10 hover:border-secondary' :
                      room.status === 'maintenance' ? 'border-red-500/50 bg-red-900/20 hover:border-red-500' :
                      'border-gray-600/50 bg-gray-700/20 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-gray-900">{room.room_numbers}</h4>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        room.status === 'available' ? 'bg-primary text-primary-foreground' :
                        room.status === 'occupied' ? 'bg-accent text-accent-foreground' :
                        room.status === 'cleaning' ? 'bg-secondary text-secondary-foreground' :
                        'bg-red-600 text-white'
                      }`}>
                        {room.status}
                      </span>
                    </div>
                    {room.current_guest_email && (
                      <p className="text-xs text-gray-600 mb-2 truncate">{room.current_guest_email}</p>
                    )}
                    {room.last_cleaned && (
                      <p className="text-xs text-gray-500 mb-3">
                        Cleaned: {new Date(room.last_cleaned).toLocaleDateString()}
                      </p>
                    )}
                    <div className="space-y-2">
                      {room.status === 'cleaning' && (
                        <button
                          onClick={() => handleMarkRoomCleaned(room.room_numbers)}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-3 rounded-lg text-xs font-semibold transition-all shadow-lg"
                        >
                          Mark Clean
                        </button>
                      )}
                      {room.status === 'available' && (
                        <button
                          onClick={() => handleUpdateRoomStatus(room.room_numbers, 'maintenance', 'Scheduled maintenance')}
                          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-2 px-3 rounded-lg text-xs font-semibold transition-all shadow-lg"
                        >
                          Maintenance
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stay History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-display font-bold text-gray-900">Guest Stay History</h3>
                <p className="text-sm text-gray-600 mt-1">Complete record of all guest stays</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary/20 border-b-2 border-primary/30">
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Check-In</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Check-Out</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Nights</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Total Spent</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {stayHistory.map((stay: StayHistory) => (
                      <tr key={stay.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">{stay.user_email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-accent/20 text-accent border border-accent/30 text-xs font-semibold rounded-full">
                            {stay.booking_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {new Date(stay.actual_check_in).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {stay.actual_check_out ? new Date(stay.actual_check_out).toLocaleString() : 'Active'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-white">{stay.nights_stayed || '-'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-400">
                          {stay.total_spent ? `₱${parseFloat(stay.total_spent).toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-yellow-400 font-semibold">
                          {stay.rating ? `⭐ ${stay.rating}/5` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {stayHistory.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No stay history records</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Booking Issues Tab */}
          {activeTab === 'issues' && (
            <div className="space-y-6">
              {/* Add Issue Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowIssueModal(true)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-xl border border-accent/50"
                >
                  <Plus size={20} />
                  Report Issue
                </button>
              </div>

              {/* Issues Grid */}
              <div className="grid grid-cols-1 gap-4">
                {bookingIssues.map((issue: BookingIssue) => (
                  <div key={issue.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:border-accent/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-lg text-gray-900">{issue.subject}</h4>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            issue.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            issue.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {issue.priority}
                          </span>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            issue.status === 'open' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            issue.status === 'in_progress' ? 'bg-primary/20 text-primary border border-primary/30' :
                            'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Guest: {issue.user_email}</span>
                          <span>Type: {issue.issue_type}</span>
                          <span>Reported: {new Date(issue.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {issue.status !== 'resolved' && (
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        {issue.status === 'open' && (
                          <button
                            onClick={() => handleUpdateIssueStatus(issue.id, 'in_progress')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg"
                          >
                            Start Working
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const resolution = prompt('Enter resolution notes:');
                            if (resolution) handleUpdateIssueStatus(issue.id, 'resolved', resolution);
                          }}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}
                    
                    {issue.resolution && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-semibold text-green-600 mb-1">Resolution:</p>
                        <p className="text-sm text-gray-600">{issue.resolution}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {bookingIssues.length === 0 && (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
                    <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No issues reported</p>
                  </div>
                )}
              </div>

              {/* Add Issue Modal */}
              {showIssueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Report New Issue</h3>
                      <button onClick={() => setShowIssueModal(false)} className="text-gray-600 hover:text-gray-900 transition-colors">
                        <X size={24} />
                      </button>
                    </div>
                    <form onSubmit={handleCreateIssue} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-1 block">Booking ID</label>
                          <input
                            type="number"
                            value={newIssue.bookingId}
                            onChange={(e) => setNewIssue({ ...newIssue, bookingId: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-1 block">Booking Type</label>
                          <select
                            value={newIssue.bookingType}
                            onChange={(e) => setNewIssue({ ...newIssue, bookingType: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          >
                            <option value="room">Room</option>
                            <option value="amenity">Amenity</option>
                            <option value="daypass">Day Pass</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Guest Email</label>
                        <input
                          type="email"
                          value={newIssue.userEmail}
                          onChange={(e) => setNewIssue({ ...newIssue, userEmail: e.target.value })}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-1 block">Issue Type</label>
                          <select
                            value={newIssue.issueType}
                            onChange={(e) => setNewIssue({ ...newIssue, issueType: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          >
                            <option value="complaint">Complaint</option>
                            <option value="request">Request</option>
                            <option value="modification">Modification</option>
                            <option value="cancellation">Cancellation</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-1 block">Priority</label>
                          <select
                            value={newIssue.priority}
                            onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Subject</label>
                        <input
                          type="text"
                          value={newIssue.subject}
                          onChange={(e) => setNewIssue({ ...newIssue, subject: e.target.value })}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Description</label>
                        <textarea
                          value={newIssue.description}
                          onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          rows={4}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 rounded-xl font-bold transition-all shadow-xl border border-accent/50"
                      >
                        Submit Issue
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal */}
      <Dialog open={notificationModal.open} onOpenChange={(open) => setNotificationModal({ ...notificationModal, open })}>
        <DialogContent className="bg-white border-primary/20 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              {notificationModal.type === 'success' ? (
                <CheckCircle className="text-accent" size={24} />
              ) : (
                <AlertCircle className="text-red-500" size={24} />
              )}
              {notificationModal.type === 'success' ? 'Success' : 'Error'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{notificationModal.message}</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setNotificationModal({ ...notificationModal, open: false })}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-In Confirmation Modal */}
      <Dialog open={checkInConfirmModal.open} onOpenChange={(open) => setCheckInConfirmModal({ ...checkInConfirmModal, open })}>
        <DialogContent className="bg-white border-primary/20 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <LogIn className="text-primary" size={24} />
              Confirm Check-In
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Please confirm that you want to check in this guest.
            </DialogDescription>
          </DialogHeader>
          {checkInConfirmModal.booking && (
            <div className="py-4 space-y-3">
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Guest Email</p>
                <p className="font-semibold text-gray-900">{checkInConfirmModal.booking.user_email}</p>
              </div>
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Booking For</p>
                <p className="font-semibold text-gray-900">
                  {checkInConfirmModal.booking.room_name || 
                   checkInConfirmModal.booking.amenity_name || 
                   'Day Pass'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCheckInConfirmModal({ open: false, booking: null, bookingType: '' })}
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCheckIn}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Confirm Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-Out Modal */}
      <Dialog open={checkOutModal.open} onOpenChange={(open) => setCheckOutModal({ ...checkOutModal, open })}>
        <DialogContent className="bg-white border-primary/20 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <LogOutIcon className="text-accent" size={24} />
              Check-Out Guest
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Add any checkout notes (optional).
            </DialogDescription>
          </DialogHeader>
          {checkOutModal.booking && (
            <div className="space-y-4">
              <div className="bg-accent/5 border border-accent/20 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Guest Email</p>
                <p className="font-semibold text-gray-900">{checkOutModal.booking.user_email}</p>
              </div>
              <div className="bg-accent/5 border border-accent/20 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Booking For</p>
                <p className="font-semibold text-gray-900">
                  {checkOutModal.booking.room_name || 
                   checkOutModal.booking.amenity_name || 
                   'Day Pass'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout-notes" className="text-gray-700">Checkout Notes</Label>
                <Textarea
                  id="checkout-notes"
                  value={checkOutModal.notes}
                  onChange={(e) => setCheckOutModal({ ...checkOutModal, notes: e.target.value })}
                  placeholder="Enter any checkout notes (e.g., room condition, damages, etc.)"
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-accent"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCheckOutModal({ open: false, booking: null, bookingType: '', notes: '' })}
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCheckOut}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Confirm Check-Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof of Payment Modal */}
      {viewingProof && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setViewingProof(null)}
        >
          <div 
            className="relative bg-white border border-gray-200 rounded-3xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-primary/5 border-b border-gray-200">
              <h3 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                <ImageIcon size={24} className="text-accent" />
                Proof of Payment
              </h3>
              <button
                onClick={() => setViewingProof(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-600 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            {/* Image */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-180px)] bg-gray-50">
              <img
                src={viewingProof}
                alt="Proof of Payment"
                className="w-full h-auto rounded-xl shadow-md border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EImage not available%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-200">
              <button
                onClick={() => setViewingProof(null)}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-xl border border-accent/50 font-bold transition-all hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
