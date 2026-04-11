// Utility to format peso values
function formatPeso(value: string | number) {
  const num = Number(value);
  if (isNaN(num)) return '-';
  return "\u20b1" + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Home, Package, LogOut, CheckCircle, XCircle, TrendingUp, Clock, DollarSign, FileText, Plus, Minus, TrendingDown, Image as ImageIcon, X, LogIn, LogOutIcon, AlertCircle, History, Settings, MessageSquare, Filter, Menu, ChevronLeft, ChevronRight, Maximize2, Minimize2, ArrowDownToLine, ArrowUpFromLine, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ReceptionistInventory from "./ReceptionistInventory";

interface Booking {
  id: number;
  user_email: string;
  guest_name?: string;
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
  guest_name?: string;
  booking_type: string;
  room_name?: string;
  room_numbers?: string;
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
  min_stock: number;
  unit: string;
  unit_price: string;
  supplier: string | null;
  expiry_date: string | null;
  last_updated: string;
  created_at: string;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  
  // Check-in/Check-out sub-tab state
  const [checkInTab, setCheckInTab] = useState<'checkin' | 'checkout'>('checkin');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [showIssueStock, setShowIssueStock] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [receiveForm, setReceiveForm] = useState({ quantity: '', supplier: '', notes: '' });
  const [issueForm, setIssueForm] = useState({ quantity: '', notes: '' });
  const [addingNewCategory, setAddingNewCategory] = useState(false);
  const [addingNewSupplier, setAddingNewSupplier] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: '',
    category: '',
    quantity: '',
    unit: '',
    unit_price: '',
    min_stock: '',
    supplier: '',
    expiry_date: ''
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
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [checkInRooms, setCheckInRooms] = useState<RoomStatus[]>([]);
  const [checkInRoomsLoading, setCheckInRoomsLoading] = useState(false);  const [checkOutModal, setCheckOutModal] = useState({ open: false, booking: null as Booking | null, bookingType: '', notes: '' });
  
  // Transaction filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'income' | 'expense',
    category: 'all',
    startDate: '',
    endDate: ''
  });
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  
  // Booking filters and search
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [amenitySearchTerm, setAmenitySearchTerm] = useState('');
  const [amenityStatusFilter, setAmenityStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [dayPassSearchTerm, setDayPassSearchTerm] = useState('');
  const [dayPassStatusFilter, setDayPassStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [checkInSearchTerm, setCheckInSearchTerm] = useState('');
  const [checkOutSearchTerm, setCheckOutSearchTerm] = useState('');
  
  // Pagination for bookings
  const [roomBookingsPage, setRoomBookingsPage] = useState(1);
  const [amenityBookingsPage, setAmenityBookingsPage] = useState(1);
  const [dayPassBookingsPage, setDayPassBookingsPage] = useState(1);
  const bookingsPerPage = 20;
  
  // Pagination for inventory
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryItemsPerPage = 20;
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  
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

  // Get unique categories from transactions
  const uniqueCategories = useMemo(() => {
    const categories = new Set(transactions.map(t => t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (filters.type !== 'all' && t.type !== filters.type) return false;
      
      // Category filter
      if (filters.category !== 'all' && t.category !== filters.category) return false;
      
      // Date filters
      if (filters.startDate && t.transaction_date < filters.startDate) return false;
      if (filters.endDate && t.transaction_date > filters.endDate) return false;
      
      // Search filter
      if (transactionSearchTerm) {
        const searchLower = transactionSearchTerm.toLowerCase();
        return (
          t.description.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower) ||
          t.amount.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [transactions, filters, transactionSearchTerm]);

  const clearFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.category !== 'all' || filters.startDate || filters.endDate;

  // Filtered inventory items
  const filteredInventory = useMemo(() => {
    if (!inventorySearchTerm) return inventory;
    
    const searchLower = inventorySearchTerm.toLowerCase();
    return inventory.filter(item => 
      item.item_name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      item.unit.toLowerCase().includes(searchLower)
    );
  }, [inventory, inventorySearchTerm]);

  // Paginated inventory items
  const paginatedInventory = useMemo(() => {
    const startIndex = (inventoryPage - 1) * inventoryItemsPerPage;
    const endIndex = startIndex + inventoryItemsPerPage;
    return filteredInventory.slice(startIndex, endIndex);
  }, [filteredInventory, inventoryPage, inventoryItemsPerPage]);

  const totalInventoryPages = Math.ceil(filteredInventory.length / inventoryItemsPerPage);

  // Filtered room bookings
  const filteredRoomBookings = useMemo(() => {
    return roomBookings.filter(booking => {
      // Status filter
      if (roomStatusFilter !== 'all' && booking.status !== roomStatusFilter) return false;
      
      // Search filter
      if (roomSearchTerm) {
        const searchLower = roomSearchTerm.toLowerCase();
        return (
          booking.user_email?.toLowerCase().includes(searchLower) ||
          booking.room_name?.toLowerCase().includes(searchLower) ||
          booking.room_numbers?.toLowerCase().includes(searchLower) ||
          booking.id.toString().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [roomBookings, roomStatusFilter, roomSearchTerm]);

  // Paginated room bookings
  const paginatedRoomBookings = useMemo(() => {
    const startIndex = (roomBookingsPage - 1) * bookingsPerPage;
    const endIndex = startIndex + bookingsPerPage;
    return filteredRoomBookings.slice(startIndex, endIndex);
  }, [filteredRoomBookings, roomBookingsPage]);

  const totalRoomBookingsPages = Math.ceil(filteredRoomBookings.length / bookingsPerPage);

  // Filtered amenity bookings
  const filteredAmenityBookings = useMemo(() => {
    return amenityBookings.filter(booking => {
      // Status filter
      if (amenityStatusFilter !== 'all' && booking.status !== amenityStatusFilter) return false;
      
      // Search filter
      if (amenitySearchTerm) {
        const searchLower = amenitySearchTerm.toLowerCase();
        return (
          booking.user_email?.toLowerCase().includes(searchLower) ||
          booking.amenity_name?.toLowerCase().includes(searchLower) ||
          booking.id.toString().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [amenityBookings, amenityStatusFilter, amenitySearchTerm]);

  // Paginated amenity bookings
  const paginatedAmenityBookings = useMemo(() => {
    const startIndex = (amenityBookingsPage - 1) * bookingsPerPage;
    const endIndex = startIndex + bookingsPerPage;
    return filteredAmenityBookings.slice(startIndex, endIndex);
  }, [filteredAmenityBookings, amenityBookingsPage]);

  const totalAmenityBookingsPages = Math.ceil(filteredAmenityBookings.length / bookingsPerPage);

  // Filtered day pass bookings
  const filteredDayPassBookings = useMemo(() => {
    return dayPassBookings.filter(booking => {
      // Status filter
      if (dayPassStatusFilter !== 'all' && booking.status !== dayPassStatusFilter) return false;
      
      // Search filter
      if (dayPassSearchTerm) {
        const searchLower = dayPassSearchTerm.toLowerCase();
        return (
          booking.user_email?.toLowerCase().includes(searchLower) ||
          booking.id.toString().includes(searchLower) ||
          booking.number_of_pax?.toString().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [dayPassBookings, dayPassStatusFilter, dayPassSearchTerm]);

  // Paginated day pass bookings
  const paginatedDayPassBookings = useMemo(() => {
    const startIndex = (dayPassBookingsPage - 1) * bookingsPerPage;
    const endIndex = startIndex + bookingsPerPage;
    return filteredDayPassBookings.slice(startIndex, endIndex);
  }, [filteredDayPassBookings, dayPassBookingsPage]);

  const totalDayPassBookingsPages = Math.ceil(filteredDayPassBookings.length / bookingsPerPage);

  // Filtered check-in bookings
  const filteredCheckInBookings = useMemo(() => {
    const checkInReady = roomBookings.filter(b => b.status === 'approved' && !b.actual_check_in);
    
    if (!checkInSearchTerm) return checkInReady;
    
    const searchLower = checkInSearchTerm.toLowerCase();
    return checkInReady.filter(booking => 
      booking.user_email?.toLowerCase().includes(searchLower) ||
      booking.room_name?.toLowerCase().includes(searchLower) ||
      booking.room_numbers?.toLowerCase().includes(searchLower) ||
      booking.id.toString().includes(searchLower)
    );
  }, [roomBookings, checkInSearchTerm]);

  // Filtered check-out guests
  const filteredCheckOutGuests = useMemo(() => {
    if (!checkOutSearchTerm) return checkedInGuests;
    
    const searchLower = checkOutSearchTerm.toLowerCase();
    return checkedInGuests.filter((guest: any) => 
      guest.user_email?.toLowerCase().includes(searchLower) ||
      guest.room_name?.toLowerCase().includes(searchLower) ||
      guest.amenity_name?.toLowerCase().includes(searchLower) ||
      guest.booking_id?.toString().includes(searchLower)
    );
  }, [checkedInGuests, checkOutSearchTerm]);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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
      .reduce((sum, t) => sum + parseFloat(t.amount.replace(/[â‚±,]/g, '')), 0);

    setStats({ totalBookings, pendingBookings, approvedToday, totalRevenue });
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json();
      
      // Enforce receptionist-only access (admin uses separate dashboard)
      if (!data.success || data.user.role !== 'receptionist') {
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

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const { toast } = useToast();

  // Inventory Management Functions
  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setInventory(data.items);
        // Check for low stock items
        const lowStockItems = (data.items as InventoryItem[]).filter(
          (item) => item.min_stock > 0 && item.quantity <= item.min_stock
        );
        if (lowStockItems.length > 0) {
          toast({
            variant: "destructive",
            title: "âš ï¸ Low Stock Warning",
            description: `${lowStockItems.length} item${lowStockItems.length > 1 ? 's are' : ' is'} at or below PAR level: ${lowStockItems.map(i => i.item_name).join(', ')}`,
          });
        }
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
    setSelectedRoom('');
    setCheckInRooms([]);
    setCheckInConfirmModal({ open: true, booking, bookingType });

    // Fetch real-time room availability for this booking
    if (bookingType === 'room') {
      setCheckInRoomsLoading(true);
      try {
        const response = await fetch(`/api/checkin/available-rooms?bookingId=${booking.id}`, { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          setCheckInRooms(data.rooms);
        }
      } catch (error) {
        console.error('Error fetching available rooms:', error);
      } finally {
        setCheckInRoomsLoading(false);
      }
    }
  };

  const confirmCheckIn = async () => {
    const { booking, bookingType } = checkInConfirmModal;
    if (!booking) return;

    // For room bookings, require a room selection
    if (bookingType === 'room' && !selectedRoom) {
      setNotificationModal({ open: true, message: 'Please select a room for the guest', type: 'error' });
      return;
    }

    setCheckInConfirmModal({ open: false, booking: null, bookingType: '' });

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId: booking.id, bookingType, assignedRoom: selectedRoom || undefined })
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
    if (newItem.category === '__new__' || newItem.supplier === '__new__') return;
    const itemToSend = { ...newItem, supplier: newItem.supplier || '' };
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(itemToSend)
      });
      const data = await response.json();
      if (data.success) {
        fetchInventory();
        setShowAddItem(false);
        setNewItem({ item_name: '', category: '', quantity: '', unit: '', unit_price: '', min_stock: '', supplier: '', expiry_date: '' });
        setAddingNewCategory(false);
        setAddingNewSupplier(false);
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

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    try {
      const response = await fetch('/api/inventory/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedInventoryItem.id, ...receiveForm })
      });
      const data = await response.json();
      if (data.success) {
        setShowReceiveStock(false);
        setSelectedInventoryItem(null);
        setReceiveForm({ quantity: '', supplier: '', notes: '' });
        fetchInventory();
      } else {
        alert(data.message || 'Failed to receive stock');
      }
    } catch (error) {
      console.error('Error receiving stock:', error);
    }
  };

  const handleIssueStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    try {
      const response = await fetch('/api/inventory/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedInventoryItem.id, ...issueForm })
      });
      const data = await response.json();
      if (data.success) {
        setShowIssueStock(false);
        setSelectedInventoryItem(null);
        setIssueForm({ quantity: '', notes: '' });
        fetchInventory();
      } else {
        alert(data.message || 'Failed to issue stock');
      }
    } catch (error) {
      console.error('Error issuing stock:', error);
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
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        const amount = parseFloat(t.amount.replace(/[â‚±,]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        const amount = parseFloat(t.amount.replace(/[â‚±,]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    
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
          <div key={`${booking.id}-${booking.user_email}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 bg-gradient-to-r from-white to-primary/5 rounded-xl border border-primary/20 hover:shadow-md transition-all">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm border-2 ${
                booking.room_name ? 'bg-primary/10 border-primary/30 text-primary' :
                booking.amenity_name ? 'bg-primary/10 border-primary/30 text-primary' :
                'bg-primary/10 border-primary/30 text-primary'
              }`}>
                {booking.room_name ? <Home size={22} /> :
                 booking.amenity_name ? <Calendar size={22} /> :
                 <Users size={22} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{booking.guest_name || booking.user_email}</p>
                <p className="text-sm text-gray-600 truncate">
                  {booking.room_name || booking.amenity_name || 'Day Pass'} â€¢ {formatDate(booking.check_in || booking.booking_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="font-bold text-gray-900 text-sm sm:text-base">{booking.total_amount}</span>
              <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-sm whitespace-nowrap ${
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
            <tr className="bg-gray-800">
              <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Booking ID</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Guest Name</th>
              {type === 'room' && <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Room Type</th>}
              {type === 'amenity' && <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Amenity</th>}
              <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Date</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Guests</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Total Price</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Payment Proof</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Status</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Actions</th>
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
                        {(booking.guest_name || booking.user_email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-700 truncate max-w-[120px]" title={booking.guest_name || booking.user_email}>{booking.guest_name || booking.user_email}</span>
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
                <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold text-gray-900">
                  {booking.total_amount}
                </td>
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
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

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
              <p className="text-xs text-gray-600 font-medium">Resort Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
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
            onClick={() => { setActiveTab('rooms'); setMobileMenuOpen(false); }}
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
            onClick={() => { setActiveTab('amenities'); setMobileMenuOpen(false); }}
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
            onClick={() => { setActiveTab('daypass'); setMobileMenuOpen(false); }}
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
            onClick={() => { setActiveTab('inventory'); setMobileMenuOpen(false); }}
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
            onClick={() => { setActiveTab('checkin'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'checkin'
                ? 'bg-primary/10 text-primary font-semibold  border-l-4 border-primary'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <LogIn size={20} />
            <span className="tracking-wide">Check-In / Check-Out</span>
          </button>

          <button
            onClick={() => { setActiveTab('roomstatus'); setMobileMenuOpen(false); }}
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
            onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
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
            onClick={() => { setActiveTab('issues'); setMobileMenuOpen(false); }}
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
              <p className="text-gray-600 text-sm mt-1 font-medium hidden sm:block">
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
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 size={16} className="text-gray-700" />
                ) : (
                  <Maximize2 size={16} className="text-gray-700" />
                )}
              </button>
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
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                      <p className="text-3xl font-display font-bold text-gray-900 mt-2 tracking-tight">â‚±{stats.totalRevenue.toLocaleString()}</p>
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
                    View Details â†’
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
                    View Details â†’
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
                    View Details â†’
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
              {/* Title Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Room Booking Reservations</h3>
                <p className="text-sm text-gray-600 mt-1">Manage and review all room booking requests</p>
              </div>
              
              {/* Search and Filter UI */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Search by email, name, or booking ID..."
                      value={roomSearchTerm}
                      onChange={(e) => setRoomSearchTerm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={roomStatusFilter}
                      onChange={(e) => setRoomStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  {(roomSearchTerm || roomStatusFilter !== 'all') && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setRoomSearchTerm('');
                          setRoomStatusFilter('all');
                        }}
                        className="px-4 py-2.5 text-sm text-primary hover:text-primary/80 flex items-center gap-2 font-semibold border-2 border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <X size={16} />
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Showing <span className="font-semibold text-primary">{paginatedRoomBookings.length}</span> of {filteredRoomBookings.length} bookings
                  {filteredRoomBookings.length !== roomBookings.length && ` (filtered from ${roomBookings.length} total)`}
                </div>
              </div>
              {renderBookingTable(paginatedRoomBookings, 'room')}
              
              {/* Pagination Controls */}
              {filteredRoomBookings.length > bookingsPerPage && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {((roomBookingsPage - 1) * bookingsPerPage) + 1} to {Math.min(roomBookingsPage * bookingsPerPage, filteredRoomBookings.length)} of {filteredRoomBookings.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRoomBookingsPage(prev => Math.max(1, prev - 1))}
                      disabled={roomBookingsPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <span className="px-4 py-1.5 text-sm font-medium text-gray-700">
                      Page {roomBookingsPage} of {totalRoomBookingsPages}
                    </span>
                    <button
                      onClick={() => setRoomBookingsPage(prev => Math.min(totalRoomBookingsPages, prev + 1))}
                      disabled={roomBookingsPage === totalRoomBookingsPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'amenities' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200">
              {/* Title Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Amenity Booking Reservations</h3>
                <p className="text-sm text-gray-600 mt-1">Manage and review all amenity booking requests</p>
              </div>
              
              {/* Search and Filter UI */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Search by email, name, or booking ID..."
                      value={amenitySearchTerm}
                      onChange={(e) => setAmenitySearchTerm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={amenityStatusFilter}
                      onChange={(e) => setAmenityStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  {(amenitySearchTerm || amenityStatusFilter !== 'all') && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setAmenitySearchTerm('');
                          setAmenityStatusFilter('all');
                        }}
                        className="px-4 py-2.5 text-sm text-primary hover:text-primary/80 flex items-center gap-2 font-semibold border-2 border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <X size={16} />
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Showing <span className="font-semibold text-primary">{paginatedAmenityBookings.length}</span> of {filteredAmenityBookings.length} bookings
                  {filteredAmenityBookings.length !== amenityBookings.length && ` (filtered from ${amenityBookings.length} total)`}
                </div>
              </div>
              {renderBookingTable(paginatedAmenityBookings, 'amenity')}
              
              {/* Pagination Controls */}
              {filteredAmenityBookings.length > bookingsPerPage && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {((amenityBookingsPage - 1) * bookingsPerPage) + 1} to {Math.min(amenityBookingsPage * bookingsPerPage, filteredAmenityBookings.length)} of {filteredAmenityBookings.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAmenityBookingsPage(prev => Math.max(1, prev - 1))}
                      disabled={amenityBookingsPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <span className="px-4 py-1.5 text-sm font-medium text-gray-700">
                      Page {amenityBookingsPage} of {totalAmenityBookingsPages}
                    </span>
                    <button
                      onClick={() => setAmenityBookingsPage(prev => Math.min(totalAmenityBookingsPages, prev + 1))}
                      disabled={amenityBookingsPage === totalAmenityBookingsPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'daypass' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200">
              {/* Title Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Day Pass Reservations</h3>
                <p className="text-sm text-gray-600 mt-1">Manage and review all day pass booking requests</p>
              </div>
              
              {/* Search and Filter UI */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Search by email, name, or booking ID..."
                      value={dayPassSearchTerm}
                      onChange={(e) => setDayPassSearchTerm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={dayPassStatusFilter}
                      onChange={(e) => setDayPassStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  {(dayPassSearchTerm || dayPassStatusFilter !== 'all') && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setDayPassSearchTerm('');
                          setDayPassStatusFilter('all');
                        }}
                        className="px-4 py-2.5 text-sm text-primary hover:text-primary/80 flex items-center gap-2 font-semibold border-2 border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <X size={16} />
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Showing <span className="font-semibold text-primary">{paginatedDayPassBookings.length}</span> of {filteredDayPassBookings.length} bookings
                  {filteredDayPassBookings.length !== dayPassBookings.length && ` (filtered from ${dayPassBookings.length} total)`}
                </div>
              </div>
              {renderBookingTable(paginatedDayPassBookings, 'daypass')}
              
              {/* Pagination Controls */}
              {filteredDayPassBookings.length > bookingsPerPage && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {((dayPassBookingsPage - 1) * bookingsPerPage) + 1} to {Math.min(dayPassBookingsPage * bookingsPerPage, filteredDayPassBookings.length)} of {filteredDayPassBookings.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDayPassBookingsPage(prev => Math.max(1, prev - 1))}
                      disabled={dayPassBookingsPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <span className="px-4 py-1.5 text-sm font-medium text-gray-700">
                      Page {dayPassBookingsPage} of {totalDayPassBookingsPages}
                    </span>
                    <button
                      onClick={() => setDayPassBookingsPage(prev => Math.min(totalDayPassBookingsPages, prev + 1))}
                      disabled={dayPassBookingsPage === totalDayPassBookingsPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'inventory' && (
            <ReceptionistInventory embedded />
          )}

          {/* Check-In/Check-Out Tab */}
          {activeTab === 'checkin' && (
            <>
              {/* Sub-tabs Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-2">
                  <button
                    onClick={() => setCheckInTab('checkin')}
                    className={`px-6 py-3 font-semibold text-sm rounded-t-xl transition-all ${
                      checkInTab === 'checkin'
                        ? 'bg-white text-primary border-t-2 border-x-2 border-primary border-b-0'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <LogIn size={20} className="inline mr-2" />
                    Check-In
                  </button>
                  <button
                    onClick={() => setCheckInTab('checkout')}
                    className={`px-6 py-3 font-semibold text-sm rounded-t-xl transition-all ${
                      checkInTab === 'checkout'
                        ? 'bg-white text-primary border-t-2 border-x-2 border-primary border-b-0'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <LogOutIcon size={20} className="inline mr-2" />
                    Check-Out
                  </button>
                </nav>
              </div>

              {/* Check-In Content */}
              {checkInTab === 'checkin' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                  <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <h3 className="text-lg font-display font-bold text-gray-900">Ready for Check-In</h3>
                    <p className="text-sm text-gray-600 mt-1">Approved bookings ready to be checked in</p>
                  </div>
                  
                  {/* Search Filter */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                          type="text"
                          placeholder="Search by email, room name, room number, or booking ID..."
                          value={checkInSearchTerm}
                          onChange={(e) => setCheckInSearchTerm(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      {checkInSearchTerm && (
                        <div className="flex items-end">
                          <button
                            onClick={() => setCheckInSearchTerm('')}
                            className="px-4 py-2.5 text-sm text-primary hover:text-primary/80 flex items-center gap-2 font-semibold border-2 border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                          >
                            <X size={16} />
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      Showing <span className="font-semibold text-primary">{filteredCheckInBookings.length}</span> booking(s) ready for check-in
                      {filteredCheckInBookings.length !== roomBookings.filter(b => b.status === 'approved' && !b.actual_check_in).length && ` (filtered from ${roomBookings.filter(b => b.status === 'approved' && !b.actual_check_in).length} total)`}
                    </div>
                  </div>
                  
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center py-16">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-gray-600">Loading bookings...</p>
                    </div>
                  ) : filteredCheckInBookings.length === 0 ? (
                    <div className="text-center py-20">
                      <LogIn size={64} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg text-gray-500">{checkInSearchTerm ? 'No bookings found matching your search' : 'No pending check-ins'}</p>
                    </div>
                  ) : (
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-800">
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Guest</th>
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Room</th>
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Stay Period</th>
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Guests</th>
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Amount</th>
                          <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredCheckInBookings.map(booking => (
                            <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-bold text-xs">
                                      {(booking.guest_name || booking.user_email)?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-900 truncate max-w-[160px]">{booking.guest_name || booking.user_email}</p>
                                    <p className="text-[10px] text-gray-400">#{booking.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <p className="text-xs font-medium text-gray-900">{booking.room_name}</p>
                                <p className="text-[10px] text-gray-500">{booking.room_numbers || 'N/A'}</p>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <p className="text-xs text-gray-700">{formatDateTime(booking.check_in)}</p>
                                <p className="text-[10px] text-gray-500">to {formatDateTime(booking.check_out)}</p>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700 text-center">{booking.guests || 0}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold text-gray-900">{booking.total_amount}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleCheckIn(booking, 'room')}
                                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md text-xs"
                                >
                                  <LogIn size={14} />
                                  Check In
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
                </div>
              )}

              {/* Check-Out Content */}
              {checkInTab === 'checkout' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                  <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <h3 className="text-lg font-display font-bold text-gray-900">Currently Checked-In Guests</h3>
                    <p className="text-sm text-gray-600 mt-1">Active guests ready for check-out</p>
                  </div>
                  
                  {/* Search Filter */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                          type="text"
                          placeholder="Search by email, room/amenity name, or booking ID..."
                          value={checkOutSearchTerm}
                          onChange={(e) => setCheckOutSearchTerm(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      {checkOutSearchTerm && (
                        <div className="flex items-end">
                          <button
                            onClick={() => setCheckOutSearchTerm('')}
                            className="px-4 py-2.5 text-sm text-primary hover:text-primary/80 flex items-center gap-2 font-semibold border-2 border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                          >
                            <X size={16} />
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      Showing <span className="font-semibold text-primary">{filteredCheckOutGuests.length}</span> guest(s) currently checked in
                      {filteredCheckOutGuests.length !== checkedInGuests.length && ` (filtered from ${checkedInGuests.length} total)`}
                    </div>
                  </div>
                  
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center py-16">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-gray-600">Loading guests...</p>
                    </div>
                  ) : filteredCheckOutGuests.length === 0 ? (
                    <div className="text-center py-20">
                      <Users size={64} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg text-gray-500">{checkOutSearchTerm ? 'No guests found matching your search' : 'No guests currently checked in'}</p>
                    </div>
                  ) : (
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-800">
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Guest</th>
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Room/Amenity</th>
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Room #</th>
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Check-In</th>
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Expected Out</th>
                          <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Status</th>
                          <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredCheckOutGuests.map((guest: any) => (
                          <tr key={`${guest.booking_type}-${guest.booking_id}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-accent font-bold text-xs">
                                    {(guest.guest_name || guest.user_email)?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate max-w-[160px]">{guest.guest_name || guest.user_email}</p>
                                  <p className="text-[10px] text-gray-400">#{guest.booking_id} Â· {guest.booking_type}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                              {guest.room_name || guest.amenity_name || 'Day Pass'}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold text-gray-900">
                              {guest.room_numbers ? `Room ${guest.room_numbers}` : '-'}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700">
                              {formatDateTime(guest.actual_check_in)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700">
                              {formatDateTime(guest.check_out || guest.check_out_date)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                Active
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleCheckOut({ ...guest, id: guest.booking_id }, guest.booking_type)}
                                className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-lg font-semibold transition-all shadow-md text-xs"
                              >
                                <LogOutIcon size={14} />
                                Check Out
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                </div>
              )}
            </>
          )}

          {/* Room Status Tab */}
          {activeTab ==='roomstatus' && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-display font-bold text-gray-900 mb-1 sm:mb-2">Room Status Board</h3>
                <p className="text-xs sm:text-sm text-gray-600">Monitor and update room availability</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
                <h3 className="text-lg font-display font-bold text-gray-900">Check-In / Check-Out History</h3>
                <p className="text-sm text-gray-600 mt-1">Complete record of all guest check-ins and check-outs</p>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search guest, room, or type..."
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64"
                    value={stayHistorySearch || ''}
                    onChange={e => setStayHistorySearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary/20 border-b-2 border-primary/30">
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Room #</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Check-In</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Check-Out</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Nights</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredStayHistory.map((stay: StayHistory) => (
                      <tr key={stay.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-black truncate max-w-[180px]">{stay.guest_name || stay.user_email}</p>
                            <p className="text-[10px] text-gray-400">{stay.room_name || stay.amenity_name || 'Day Pass'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-accent/20 text-accent border border-accent/30 text-xs font-semibold rounded-full">
                            {stay.booking_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-black">
                          {stay.room_numbers ? `Room ${stay.room_numbers}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-black">
                          {stay.actual_check_in ? new Date(stay.actual_check_in).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-black">
                          {stay.actual_check_out ? new Date(stay.actual_check_out).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-black">{stay.nights_stayed || '-'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">
                          {formatPeso(stay.total_spent)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {stay.actual_check_out ? (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Checked Out</span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Checked In</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStayHistory.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No check-in/check-out history records</p>
                  </div>
                )}
              </div>
            </div>
            // --- Stay History Search State and Filtering ---
            const [stayHistorySearch, setStayHistorySearch] = useState('');
            const filteredStayHistory = useMemo(() => {
              if (!stayHistorySearch) return stayHistory;
              const s = stayHistorySearch.toLowerCase();
              return stayHistory.filter((stay: StayHistory) =>
                (stay.guest_name && stay.guest_name.toLowerCase().includes(s)) ||
                (stay.user_email && stay.user_email.toLowerCase().includes(s)) ||
                (stay.room_name && stay.room_name.toLowerCase().includes(s)) ||
                (stay.amenity_name && stay.amenity_name.toLowerCase().includes(s)) ||
                (stay.booking_type && stay.booking_type.toLowerCase().includes(s))
              );
            }, [stayHistory, stayHistorySearch]);
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
      <Dialog open={checkInConfirmModal.open} onOpenChange={(open) => { setCheckInConfirmModal({ ...checkInConfirmModal, open }); if (!open) setSelectedRoom(''); }}>
        <DialogContent className="bg-white border-primary/20 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <LogIn className="text-primary" size={24} />
              Check-In Guest
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {checkInConfirmModal.bookingType === 'room' 
                ? 'Select an available room and confirm check-in.'
                : 'Please confirm that you want to check in this guest.'}
            </DialogDescription>
          </DialogHeader>
          {checkInConfirmModal.booking && (
            <div className="py-2 space-y-3">
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Guest Name</p>
                <p className="font-semibold text-gray-900">{checkInConfirmModal.booking.guest_name || checkInConfirmModal.booking.user_email}</p>
              </div>
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Booking For</p>
                <p className="font-semibold text-gray-900">
                  {checkInConfirmModal.booking.room_name || 
                   checkInConfirmModal.booking.amenity_name || 
                   'Day Pass'}
                </p>
              </div>

              {/* Room Selection for room bookings */}
              {checkInConfirmModal.bookingType === 'room' && checkInConfirmModal.booking.room_name && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-gray-800">Assign Room</p>
                  {checkInRoomsLoading ? (
                    <p className="text-sm text-gray-500 italic">Loading available rooms...</p>
                  ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {(() => {
                      const availableRooms = checkInRooms.filter(
                        (r: RoomStatus) => r.status === 'available'
                      );
                      const unavailableRooms = checkInRooms.filter(
                        (r: RoomStatus) => r.status !== 'available'
                      );

                      if (checkInRooms.length === 0) {
                        return <p className="col-span-3 text-sm text-gray-500 italic">No room status data available</p>;
                      }

                      return (
                        <>
                          {availableRooms.map((room: RoomStatus) => (
                            <button
                              key={room.room_numbers}
                              onClick={() => setSelectedRoom(room.room_numbers)}
                              className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                                selectedRoom === room.room_numbers
                                  ? 'border-green-600 bg-green-100 text-green-800 ring-2 ring-green-300'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-green-400 hover:bg-green-50'
                              }`}
                            >
                              Room {room.room_numbers}
                            </button>
                          ))}
                          {unavailableRooms.map((room: RoomStatus) => (
                            <button
                              key={room.room_numbers}
                              disabled
                              className="px-3 py-2.5 rounded-lg border-2 border-gray-100 bg-gray-50 text-gray-400 text-sm font-semibold cursor-not-allowed"
                              title={`Room ${room.room_numbers} - ${room.status}`}
                            >
                              Room {room.room_numbers}
                              <span className="block text-[10px] font-normal capitalize">{room.status}</span>
                            </button>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                  )}
                  {!selectedRoom && !checkInRoomsLoading && (
                    <p className="text-xs text-yellow-700">Please select a room to proceed</p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setCheckInConfirmModal({ open: false, booking: null, bookingType: '' }); setSelectedRoom(''); }}
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCheckIn}
              disabled={checkInConfirmModal.bookingType === 'room' && !selectedRoom}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="text-sm text-gray-600">Guest Name</p>
                <p className="font-semibold text-gray-900">{checkOutModal.booking.guest_name || checkOutModal.booking.user_email}</p>
              </div>
              <div className="bg-accent/5 border border-accent/20 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Booking For</p>
                <p className="font-semibold text-gray-900">
                  {checkOutModal.booking.room_name || 
                   checkOutModal.booking.amenity_name || 
                   'Day Pass'}
                </p>
              </div>
              {checkOutModal.booking.room_numbers && (
                <div className="bg-accent/5 border border-accent/20 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-gray-600">Assigned Room</p>
                  <p className="font-semibold text-gray-900">Room {checkOutModal.booking.room_numbers}</p>
                </div>
              )}
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

      {/* Receive Stock Modal */}
      <Dialog open={showReceiveStock} onOpenChange={(open) => { setShowReceiveStock(open); if (!open) { setSelectedInventoryItem(null); setReceiveForm({ quantity: '', supplier: '', notes: '' }); } }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <ArrowDownToLine className="text-green-600" size={24} /> Receive Stock
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Record delivery for <strong>{selectedInventoryItem?.item_name}</strong> (Current: {selectedInventoryItem?.quantity} {selectedInventoryItem?.unit})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReceiveStock} className="space-y-4">
            <div>
              <Label className="text-gray-700">Quantity Received *</Label>
              <Input type="number" min="1" placeholder="How many received?" value={receiveForm.quantity}
                onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" required />
            </div>
            <div>
              <Label className="text-gray-700">Supplier</Label>
              <Input type="text" placeholder="Supplier name" value={receiveForm.supplier}
                onChange={(e) => setReceiveForm({ ...receiveForm, supplier: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" />
            </div>
            <div>
              <Label className="text-gray-700">Notes</Label>
              <Input type="text" placeholder="e.g., Invoice #12345" value={receiveForm.notes}
                onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowReceiveStock(false)}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300">Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold">Receive Stock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Stock Modal */}
      <Dialog open={showIssueStock} onOpenChange={(open) => { setShowIssueStock(open); if (!open) { setSelectedInventoryItem(null); setIssueForm({ quantity: '', notes: '' }); } }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <ArrowUpFromLine className="text-blue-600" size={24} /> Issue Stock
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Issue stock for <strong>{selectedInventoryItem?.item_name}</strong> (Available: {selectedInventoryItem?.quantity} {selectedInventoryItem?.unit})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleIssueStock} className="space-y-4">
            <div>
              <Label className="text-gray-700">Quantity to Issue *</Label>
              <Input type="number" min="1" max={selectedInventoryItem?.quantity} placeholder="How many to issue?" value={issueForm.quantity}
                onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" required />
            </div>
            <div>
              <Label className="text-gray-700">Notes / Reason</Label>
              <Input type="text" placeholder="e.g., For Room 101 cleaning" value={issueForm.notes}
                onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowIssueStock(false)}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300">Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Issue Stock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
