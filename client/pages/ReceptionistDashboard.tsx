// Utility to format peso values
function formatPeso(value: string | number) {
  const num = Number(value);
  if (isNaN(num)) return '-';
  return "\u20b1" + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Home, Package, LogOut, CheckCircle, XCircle, TrendingUp, Clock, DollarSign, FileText, Plus, Minus, TrendingDown, Image as ImageIcon, X, LogIn, LogOutIcon, AlertCircle, History, Settings, MessageSquare, Filter, Menu, ChevronLeft, ChevronRight, ChevronDown, Maximize2, Minimize2, ArrowDownToLine, ArrowUpFromLine, ExternalLink, Edit, Archive } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'walkin' | 'amenities' | 'daypass' | 'daypasswalkin' | 'inventory' | 'checkin' | 'roomstatus' | 'history' | 'issues'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // History sub-tab state
  const [historyTab, setHistoryTab] = useState<'rooms' | 'daypass'>('rooms');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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
  
  // Inventory management states - removed stock log and financial transactions
  // const [inventoryTab, setInventoryTab] = useState<'inventory' | 'transactions'>('inventory');
  
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
  // Stay history search state
  const [stayHistorySearch, setStayHistorySearch] = useState('');
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
  
  // Walk-in booking states
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInBookings, setWalkInBookings] = useState<any[]>([]);
  const [walkInForm, setWalkInForm] = useState({
    numberOfPax: '',
    guestName: '',
    contactNumber: '',
    roomNumber: '',
    totalAmount: '',
    downPayment: '',
    balance: ''
  });
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [walkInSearchTerm, setWalkInSearchTerm] = useState('');
  const [walkInPage, setWalkInPage] = useState(1);
  const walkInPerPage = 10;
  
  // Walk-in edit states
  const [editingWalkIn, setEditingWalkIn] = useState<any>(null);
  const [showEditWalkInModal, setShowEditWalkInModal] = useState(false);
  
  // Day pass walk-in states
  const [showDayPassWalkInModal, setShowDayPassWalkInModal] = useState(false);
  const [dayPassWalkInBookings, setDayPassWalkInBookings] = useState<any[]>([]);
  const [dayPassWalkInForm, setDayPassWalkInForm] = useState({
    representativeName: '',
    numberOfPax: '',
    cottageType: '', // 'concrete' or 'kubo'
    timeOfDay: '', // 'day' or 'night'
    totalAmount: ''
  });
  const [dayPassWalkInLoading, setDayPassWalkInLoading] = useState(false);
  const [dayPassWalkInSearchTerm, setDayPassWalkInSearchTerm] = useState('');
  const [dayPassWalkInPage, setDayPassWalkInPage] = useState(1);
  const dayPassWalkInPerPage = 10;
  
  // Sidebar submenu expansion states
  const [roomsMenuExpanded, setRoomsMenuExpanded] = useState(false);
  const [dayPassMenuExpanded, setDayPassMenuExpanded] = useState(false);
  
  // Amenity booking creation states
  const [showAmenityBookingModal, setShowAmenityBookingModal] = useState(false);
  const [availableAmenities, setAvailableAmenities] = useState<any[]>([]);
  const [amenityBookingForm, setAmenityBookingForm] = useState({
    guestName: '',
    guestEmail: '',
    contactNumber: '',
    amenityId: '',
    amenityName: '',
    amenityType: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    guests: '',
    occasion: '',
    eventDetails: '',
    totalAmount: ''
  });
  const [amenityBookingLoading, setAmenityBookingLoading] = useState(false);
  
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

  // Filtered stay history for search (must be after all useState)
  const filteredStayHistory = useMemo(() => {
    if (!stayHistorySearch.trim()) return stayHistory;
    const search = stayHistorySearch.toLowerCase();
    return stayHistory.filter(stay =>
      (stay.guest_name && stay.guest_name.toLowerCase().includes(search)) ||
      (stay.user_email && stay.user_email.toLowerCase().includes(search)) ||
      (stay.room_name && stay.room_name.toLowerCase().includes(search)) ||
      (stay.amenity_name && stay.amenity_name.toLowerCase().includes(search)) ||
      (stay.booking_type && stay.booking_type.toLowerCase().includes(search)) ||
      (stay.room_numbers && stay.room_numbers.toLowerCase().includes(search))
    );
  }, [stayHistory, stayHistorySearch]);

  // Combined room history (stay_history + walk_in_bookings)
  const combinedRoomHistory = useMemo(() => {
    // Get room bookings from stay_history
    const roomStayHistory = filteredStayHistory.filter((stay: StayHistory) => stay.booking_type === 'room');
    
    // Convert walk-in bookings to history format
    const walkInHistory = walkInBookings.map((walkIn: any) => ({
      id: `walkin-${walkIn.id}`,
      guest_name: walkIn.guest_name,
      user_email: '',
      booking_type: 'walk-in',
      room_name: '',
      room_numbers: walkIn.room_number,
      amenity_name: null,
      check_in_date: null,
      actual_check_in: walkIn.created_at,
      actual_check_out: walkIn.created_at, // Walk-ins are considered checked out
      nights_stayed: 0,
      total_spent: walkIn.total_amount || walkIn.amount || '0',
      rating: null,
      staff_notes: null,
      created_at: walkIn.created_at
    }));
    
    // Filter walk-ins by search term
    const filteredWalkIns = stayHistorySearch.trim() 
      ? walkInHistory.filter((walkIn: any) =>
          (walkIn.guest_name && walkIn.guest_name.toLowerCase().includes(stayHistorySearch.toLowerCase())) ||
          (walkIn.room_numbers && walkIn.room_numbers.toLowerCase().includes(stayHistorySearch.toLowerCase()))
        )
      : walkInHistory;
    
    // Combine and sort by date (most recent first)
    return [...roomStayHistory, ...filteredWalkIns].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredStayHistory, walkInBookings, stayHistorySearch]);

  // Combined day pass history (stay_history + day_pass_walk_in_bookings)
  const combinedDayPassHistory = useMemo(() => {
    // Get day pass bookings from stay_history
    const dayPassStayHistory = filteredStayHistory.filter((stay: StayHistory) => stay.booking_type === 'day_pass');
    
    // Convert day pass walk-in bookings to history format
    const dayPassWalkInHistory = dayPassWalkInBookings.map((walkIn: any) => ({
      id: `daypass-walkin-${walkIn.id}`,
      guest_name: walkIn.representative_name,
      user_email: '',
      booking_type: 'day-pass-walk-in',
      room_name: null,
      room_numbers: null,
      amenity_name: null,
      check_in_date: null,
      actual_check_in: walkIn.created_at,
      actual_check_out: walkIn.created_at, // Walk-ins are considered checked out
      nights_stayed: 0,
      total_spent: walkIn.total_amount || '0',
      rating: null,
      staff_notes: null,
      created_at: walkIn.created_at,
      // Additional fields for day pass walk-ins
      cottage_type: walkIn.cottage_type,
      time_of_day: walkIn.time_of_day,
      number_of_pax: walkIn.number_of_pax
    }));
    
    // Filter walk-ins by search term
    const filteredDayPassWalkIns = stayHistorySearch.trim()
      ? dayPassWalkInHistory.filter((walkIn: any) =>
          (walkIn.guest_name && walkIn.guest_name.toLowerCase().includes(stayHistorySearch.toLowerCase())) ||
          (walkIn.cottage_type && walkIn.cottage_type.toLowerCase().includes(stayHistorySearch.toLowerCase())) ||
          (walkIn.time_of_day && walkIn.time_of_day.toLowerCase().includes(stayHistorySearch.toLowerCase()))
        )
      : dayPassWalkInHistory;
    
    // Combine and sort by date (most recent first)
    return [...dayPassStayHistory, ...filteredDayPassWalkIns].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredStayHistory, dayPassWalkInBookings, stayHistorySearch]);

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

  // Filtered walk-in bookings
  const filteredWalkInBookings = useMemo(() => {
    if (!walkInSearchTerm) return walkInBookings;
    
    const searchLower = walkInSearchTerm.toLowerCase();
    return walkInBookings.filter(w =>
      w.guest_name?.toLowerCase().includes(searchLower) ||
      w.contact_number?.toLowerCase().includes(searchLower) ||
      w.room_number?.toLowerCase().includes(searchLower) ||
      w.address?.toLowerCase().includes(searchLower)
    );
  }, [walkInBookings, walkInSearchTerm]);

  // Paginated walk-in bookings
  const paginatedWalkInBookings = useMemo(() => {
    const startIndex = (walkInPage - 1) * walkInPerPage;
    const endIndex = startIndex + walkInPerPage;
    return filteredWalkInBookings.slice(startIndex, endIndex);
  }, [filteredWalkInBookings, walkInPage, walkInPerPage]);

  const totalWalkInPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredWalkInBookings.length / walkInPerPage));
  }, [filteredWalkInBookings.length, walkInPerPage]);
  
  // Debug pagination
  console.log('[Walk-In Pagination]', {
    totalBookings: walkInBookings.length,
    filteredBookings: filteredWalkInBookings.length,
    currentPage: walkInPage,
    perPage: walkInPerPage,
    totalPages: totalWalkInPages,
    showing: paginatedWalkInBookings.length,
    calculation: `${filteredWalkInBookings.length} / ${walkInPerPage} = ${filteredWalkInBookings.length / walkInPerPage}, ceil = ${Math.ceil(filteredWalkInBookings.length / walkInPerPage)}`
  });

  // Filtered day pass walk-in bookings
  const filteredDayPassWalkInBookings = useMemo(() => {
    if (!dayPassWalkInSearchTerm) return dayPassWalkInBookings;
    
    const searchLower = dayPassWalkInSearchTerm.toLowerCase();
    return dayPassWalkInBookings.filter(w =>
      w.representative_name?.toLowerCase().includes(searchLower) ||
      w.cottage_type?.toLowerCase().includes(searchLower)
    );
  }, [dayPassWalkInBookings, dayPassWalkInSearchTerm]);

  // Paginated day pass walk-in bookings
  const paginatedDayPassWalkInBookings = useMemo(() => {
    const startIndex = (dayPassWalkInPage - 1) * dayPassWalkInPerPage;
    const endIndex = startIndex + dayPassWalkInPerPage;
    return filteredDayPassWalkInBookings.slice(startIndex, endIndex);
  }, [filteredDayPassWalkInBookings, dayPassWalkInPage, dayPassWalkInPerPage]);

  const totalDayPassWalkInPages = Math.ceil(filteredDayPassWalkInBookings.length / dayPassWalkInPerPage);

  useEffect(() => {
    checkAuth();
    fetchAllBookings();
    fetchInventory();
    fetchTransactions();
    fetchRoomStatuses();
    fetchCheckedInGuests();
    fetchStayHistory();
    fetchBookingIssues();
    fetchWalkInBookings();
    fetchDayPassWalkInBookings();
    fetchAvailableAmenities();
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
      .reduce((sum, t) => sum + parseFloat(t.amount.replace(/[?,]/g, '')), 0);

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

  const confirmLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
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
            title: "⚠️ Low Stock Warning",
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

  const handleWalkInBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInLoading(true);
    
    try {
      // Calculate the actual values to send
      const totalAmount = parseFloat(walkInForm.totalAmount) || 0;
      const downPayment = walkInForm.downPayment ? parseFloat(walkInForm.downPayment) : totalAmount;
      const balance = totalAmount - downPayment;

      const payload = {
        numberOfPax: walkInForm.numberOfPax,
        guestName: walkInForm.guestName,
        contactNumber: walkInForm.contactNumber,
        roomNumber: walkInForm.roomNumber,
        totalAmount: totalAmount,
        downPayment: downPayment,
        balance: balance
      };

      const response = await fetch('/api/bookings/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Walk-in recorded",
          description: `Walk-in for ${walkInForm.guestName} has been recorded successfully.`,
        });
        setShowWalkInModal(false);
        setWalkInForm({
          numberOfPax: '',
          guestName: '',
          contactNumber: '',
          roomNumber: '',
          totalAmount: '',
          downPayment: '',
          balance: ''
        });
        fetchWalkInBookings();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || 'Failed to record walk-in',
        });
      }
    } catch (error) {
      console.error('Error recording walk-in:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to record walk-in',
      });
    } finally {
      setWalkInLoading(false);
    }
  };

  const handleUpdateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInLoading(true);
    
    try {
      const totalAmount = parseFloat(walkInForm.totalAmount) || 0;
      const downPayment = walkInForm.downPayment ? parseFloat(walkInForm.downPayment) : totalAmount;
      const balance = totalAmount - downPayment;

      const payload = {
        id: editingWalkIn.id,
        numberOfPax: walkInForm.numberOfPax,
        guestName: walkInForm.guestName,
        contactNumber: walkInForm.contactNumber,
        roomNumber: walkInForm.roomNumber,
        totalAmount: totalAmount,
        downPayment: downPayment,
        balance: balance
      };

      const response = await fetch(`/api/bookings/walk-in/${editingWalkIn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Walk-in updated",
          description: `Walk-in for ${walkInForm.guestName} has been updated successfully.`,
        });
        setShowEditWalkInModal(false);
        setEditingWalkIn(null);
        setWalkInForm({
          numberOfPax: '',
          guestName: '',
          contactNumber: '',
          roomNumber: '',
          totalAmount: '',
          downPayment: '',
          balance: ''
        });
        fetchWalkInBookings();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || 'Failed to update walk-in',
        });
      }
    } catch (error) {
      console.error('Error updating walk-in:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to update walk-in',
      });
    } finally {
      setWalkInLoading(false);
    }
  };

  const handleArchiveWalkIn = async (id: number) => {
    try {
      const response = await fetch(`/api/bookings/walk-in/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Walk-in archived",
          description: "Walk-in record has been archived successfully.",
        });
        fetchWalkInBookings();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || 'Failed to archive walk-in',
        });
      }
    } catch (error) {
      console.error('Error archiving walk-in:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to archive walk-in',
      });
    }
  };

  const fetchWalkInBookings = async () => {
    try {
      console.log('[Frontend] Fetching walk-in bookings...');
      const response = await fetch('/api/bookings/walk-in', { credentials: 'include' });
      console.log('[Frontend] Response status:', response.status);
      const data = await response.json();
      console.log('[Frontend] Response data:', data);
      if (data.success) {
        console.log('[Frontend] Setting walk-in bookings, count:', data.bookings?.length);
        setWalkInBookings(data.bookings);
      } else {
        console.error('[Frontend] API returned success: false', data);
      }
    } catch (error) {
      console.error('[Frontend] Error fetching walk-in bookings:', error);
    }
  };

  const handleDayPassWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setDayPassWalkInLoading(true);
    
    try {
      const response = await fetch('/api/bookings/day-pass-walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dayPassWalkInForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Day pass walk-in recorded",
          description: `Walk-in for ${dayPassWalkInForm.representativeName} has been recorded successfully.`,
        });
        setShowDayPassWalkInModal(false);
        setDayPassWalkInForm({
          representativeName: '',
          numberOfPax: '',
          cottageType: '',
          timeOfDay: '',
          totalAmount: ''
        });
        fetchDayPassWalkInBookings();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || 'Failed to record day pass walk-in',
        });
      }
    } catch (error) {
      console.error('Error recording day pass walk-in:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to record day pass walk-in',
      });
    } finally {
      setDayPassWalkInLoading(false);
    }
  };

  const fetchDayPassWalkInBookings = async () => {
    try {
      console.log('🔍 [DAY PASS WALK-IN] Starting fetch...');
      const response = await fetch('/api/bookings/day-pass-walk-in', { credentials: 'include' });
      console.log('🔍 [DAY PASS WALK-IN] Response status:', response.status);
      const data = await response.json();
      console.log('🔍 [DAY PASS WALK-IN] Full response data:', JSON.stringify(data, null, 2));
      console.log('🔍 [DAY PASS WALK-IN] Success flag:', data.success);
      console.log('🔍 [DAY PASS WALK-IN] Bookings array:', data.bookings);
      console.log('🔍 [DAY PASS WALK-IN] Bookings count:', data.bookings?.length || 0);
      
      if (data.success) {
        if (data.bookings && data.bookings.length > 0) {
          console.log('✅ [DAY PASS WALK-IN] Setting', data.bookings.length, 'bookings');
          console.log('✅ [DAY PASS WALK-IN] First booking:', JSON.stringify(data.bookings[0], null, 2));
          console.log('✅ [DAY PASS WALK-IN] All bookings:', data.bookings.map((b: any) => ({
            id: b.id,
            name: b.representative_name,
            pax: b.number_of_pax,
            cottage: b.cottage_type,
            time: b.time_of_day,
            amount: b.total_amount
          })));
        } else {
          console.warn('⚠️ [DAY PASS WALK-IN] No bookings returned from API');
        }
        setDayPassWalkInBookings(data.bookings || []);
        console.log('🎯 [DAY PASS WALK-IN] State updated, new length should be:', data.bookings?.length || 0);
      } else {
        console.error('❌ [DAY PASS WALK-IN] API returned success: false');
      }
    } catch (error) {
      console.error('❌ [DAY PASS WALK-IN] Fetch error:', error);
    }
  };

  // Amenity booking functions
  const fetchAvailableAmenities = async () => {
    try {
      const response = await fetch('/api/facilities/amenities', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setAvailableAmenities(data.amenities);
      }
    } catch (error) {
      console.error('Error fetching amenities:', error);
    }
  };

  const handleAmenityBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAmenityBookingLoading(true);
    
    try {
      // Create a user account if email doesn't exist (walk-in guest)
      const response = await fetch('/api/bookings/amenity/receptionist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(amenityBookingForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Amenity booking created",
          description: `Booking for ${amenityBookingForm.guestName} has been created successfully.`,
        });
        setShowAmenityBookingModal(false);
        setAmenityBookingForm({
          guestName: '',
          guestEmail: '',
          contactNumber: '',
          amenityId: '',
          amenityName: '',
          amenityType: '',
          bookingDate: '',
          startTime: '',
          endTime: '',
          guests: '',
          occasion: '',
          eventDetails: '',
          totalAmount: ''
        });
        fetchAllBookings();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || 'Failed to create amenity booking',
        });
      }
    } catch (error) {
      console.error('Error creating amenity booking:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to create amenity booking',
      });
    } finally {
      setAmenityBookingLoading(false);
    }
  };

  const handleAmenitySelection = (amenityId: string) => {
    const selectedAmenity = availableAmenities.find(a => a.id === parseInt(amenityId));
    if (selectedAmenity) {
      setAmenityBookingForm(prev => ({
        ...prev,
        amenityId,
        amenityName: selectedAmenity.amenity_name,
        amenityType: selectedAmenity.amenity_type
      }));
    }
  };

  const calculateTotals = () => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        const amount = parseFloat(t.amount.replace(/[?,]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        const amount = parseFloat(t.amount.replace(/[?,]/g, ''));
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
                  {booking.room_name || booking.amenity_name || 'Day Pass'} � {formatDate(booking.check_in || booking.booking_date)}
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
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Expandable Icon-Only/Full Navigation */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarExpanded ? 'w-64' : 'w-20'} bg-gray-100 shadow-sm flex flex-col border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo/Menu Button */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarExpanded ? (
            <>
              {/* Logo and Company Name when expanded */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm">
                  <img src="/PTR-logo.png" alt="Prisville Logo" className="w-full h-full object-cover scale-150" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Prisville Resort</span>
              </div>
              {/* Menu button to collapse */}
              <button 
                onClick={() => setSidebarExpanded(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Menu size={18} className="text-gray-700" />
              </button>
            </>
          ) : (
            /* Menu button when collapsed */
            <button 
              onClick={() => setSidebarExpanded(true)}
              className="w-12 h-12 rounded-xl bg-amber-800 hover:bg-amber-700 flex items-center justify-center transition-colors mx-auto"
            >
              <Menu size={24} className="text-white" />
            </button>
          )}
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
            className={`w-full h-12 flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-800 text-white'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            title={!sidebarExpanded ? "Dashboard" : undefined}
          >
            <TrendingUp size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Dashboard</span>}
          </button>
          
          <button
            onClick={() => { 
              setRoomsMenuExpanded(!roomsMenuExpanded);
              setActiveTab('rooms'); 
              setMobileMenuOpen(false); 
            }}
            className={`w-full h-12 flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} rounded-lg transition-all relative ${
              activeTab === 'rooms' || activeTab === 'walkin'
                ? 'bg-amber-800 text-white'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            title={!sidebarExpanded ? "Room Bookings" : undefined}
          >
            <Home size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Room Bookings</span>}
            {roomBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className={`${sidebarExpanded ? 'ml-auto' : 'absolute -top-1 -right-1'} bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
                {roomBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
            {sidebarExpanded && (
              <ChevronDown size={16} className={`ml-auto transition-transform ${roomsMenuExpanded ? 'rotate-180' : ''}`} />
            )}
          </button>
          
          {/* Room Bookings Sub-menu */}
          {sidebarExpanded && roomsMenuExpanded && (
            <button
              onClick={() => { setActiveTab('walkin'); setMobileMenuOpen(false); }}
              className={`w-full h-10 flex items-center justify-start pl-12 pr-4 gap-3 rounded-lg transition-all ${
                activeTab === 'walkin'
                  ? 'bg-amber-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <LogIn size={16} className="flex-shrink-0" />
              <span className="text-sm font-medium">Walk-In</span>
            </button>
          )}

          <button
            onClick={() => { setActiveTab('amenities'); setMobileMenuOpen(false); }}
            className={`w-full h-12 flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} rounded-lg transition-all relative ${
              activeTab === 'amenities'
                ? 'bg-amber-800 text-white'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            title={!sidebarExpanded ? "Amenities" : undefined}
          >
            <Calendar size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Amenities</span>}
            {amenityBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className={`${sidebarExpanded ? 'ml-auto' : 'absolute -top-1 -right-1'} bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
                {amenityBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { 
              setDayPassMenuExpanded(!dayPassMenuExpanded);
              setActiveTab('daypass'); 
              setMobileMenuOpen(false); 
            }}
            className={`w-full h-12 flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} rounded-lg transition-all relative ${
              activeTab === 'daypass' || activeTab === 'daypasswalkin'
                ? 'bg-amber-800 text-white'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            title={!sidebarExpanded ? "Day Pass" : undefined}
          >
            <Users size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Day Pass</span>}
            {dayPassBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className={`${sidebarExpanded ? 'ml-auto' : 'absolute -top-1 -right-1'} bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
                {dayPassBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
            {sidebarExpanded && (
              <ChevronDown size={16} className={`ml-auto transition-transform ${dayPassMenuExpanded ? 'rotate-180' : ''}`} />
            )}
          </button>
          
          {/* Day Pass Sub-menu */}
          {sidebarExpanded && dayPassMenuExpanded && (
            <button
              onClick={() => { setActiveTab('daypasswalkin'); setMobileMenuOpen(false); }}
              className={`w-full h-10 flex items-center justify-start pl-12 pr-4 gap-3 rounded-lg transition-all ${
                activeTab === 'daypasswalkin'
                  ? 'bg-amber-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <LogIn size={16} className="flex-shrink-0" />
              <span className="text-sm font-medium">Walk-In</span>
            </button>
          )}

          <button
            onClick={() => { setActiveTab('inventory'); setMobileMenuOpen(false); }}
            className={`w-full h-12 flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} rounded-lg transition-all ${
              activeTab === 'inventory'
                ? 'bg-amber-800 text-white'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            title={!sidebarExpanded ? "Inventory" : undefined}
          >
            <Package size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Inventory</span>}
          </button>

          <button
            onClick={() => { setActiveTab('checkin'); setMobileMenuOpen(false); }}
            className={`w-full h-12 flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} rounded-lg transition-all ${
              activeTab === 'checkin'
                ? 'bg-amber-800 text-white'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            title={!sidebarExpanded ? "Check-In / Check-Out" : undefined}
          >
            <LogIn size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Check-In / Out</span>}
          </button>

          <button
            onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
            className={`w-full h-12 flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-amber-800 text-white'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            title={!sidebarExpanded ? "History" : undefined}
          >
            <History size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">History</span>}
          </button>

          <button
            onClick={() => { setActiveTab('roomstatus'); setMobileMenuOpen(false); }}
            className={`w-full h-12 flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} rounded-lg transition-all ${
              activeTab === 'roomstatus'
                ? 'bg-amber-800 text-white'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            title={!sidebarExpanded ? "Room Status" : undefined}
          >
            <Settings size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Room Status</span>}
          </button>

          {/* Issues button removed */}
        </nav>

        {/* User Profile Icon */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full h-12 flex items-center ${sidebarExpanded ? 'justify-start px-4 gap-3' : 'justify-center'} rounded-lg bg-amber-800 hover:bg-amber-700 text-white transition-colors`}
            title={!sidebarExpanded ? "Logout" : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto min-w-0">
        {/* Header - Clean Minimalist Design */}
        <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Left: Company Logo/Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-800 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PR</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 hidden sm:block">Prisville Resort</span>
          </div>

          {/* Right: User Info */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 size={18} className="text-gray-600" />
              ) : (
                <Maximize2 size={18} className="text-gray-600" />
              )}
            </button>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-amber-800 flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {user?.name?.charAt(0) || 'R'}
                </span>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name || user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 lg:p-8 bg-gray-50">
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards - First Dark, Rest Light */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Dark Card - Total Bookings */}
                <div className="bg-amber-800 rounded-2xl p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-amber-100 text-sm font-medium mb-1">Total Bookings</p>
                      <p className="text-4xl font-bold">{stats.totalBookings}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                  </div>
                  <p className="text-amber-200 text-sm">+{stats.totalBookings > 0 ? '2,031' : '0'}</p>
                </div>

                {/* Light Card - Total Revenue */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-1">Total Revenue</p>
                      <p className="text-4xl font-bold text-gray-900">₱{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <DollarSign size={24} className="text-gray-700" />
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">+$2,201</p>
                </div>

                {/* Light Card - Pending */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-1">Pending</p>
                      <p className="text-4xl font-bold text-gray-900">{stats.pendingBookings}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Clock size={24} className="text-gray-700" />
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">+3,392</p>
                </div>

                {/* Light Card - Approved Today */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-1">Approved Today</p>
                      <p className="text-4xl font-bold text-gray-900">{stats.approvedToday}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <CheckCircle size={24} className="text-gray-700" />
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">-1.2%</p>
                </div>
              </div>

              {/* Quick Actions - Clean Card Design */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Home size={24} className="text-gray-700" />
                    </div>
                    <Settings size={18} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Room Bookings</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-4">{roomBookings.length}</p>
                  <button
                    onClick={() => setActiveTab('rooms')}
                    className="w-full bg-amber-800 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Calendar size={24} className="text-gray-700" />
                    </div>
                    <Settings size={18} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Amenity Bookings</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-4">{amenityBookings.length}</p>
                  <button
                    onClick={() => setActiveTab('amenities')}
                    className="w-full bg-amber-800 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Users size={24} className="text-gray-700" />
                    </div>
                    <Settings size={18} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Day Pass</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-4">{dayPassBookings.length}</p>
                  <button
                    onClick={() => setActiveTab('daypass')}
                    className="w-full bg-amber-800 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Recent Bookings - Clean Design */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                  <Settings size={18} className="text-gray-400" />
                </div>
                {renderRecentBookings()}
              </div>
            </>
          )}
          
          {activeTab === 'rooms' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-x-auto">
              {/* Title Header */}
              <div className="px-3 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Room Booking Reservations</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage and review all room booking requests</p>
                </div>
              </div>
              
              {/* Search and Filter UI */}
              <div className="p-3 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
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
                  <div className="w-full sm:w-48 mt-2 sm:mt-0">
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
                    <div className="flex items-end mt-2 sm:mt-0">
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
                <div className="mt-2 text-xs sm:text-sm text-gray-600">
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
          
          {activeTab === 'walkin' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200">
              {/* Title Header */}
              <div className="px-3 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Walk-In Bookings</h3>
                  <p className="text-sm text-gray-600 mt-1">Record and manage walk-in guests</p>
                </div>
                <button
                  onClick={() => setShowWalkInModal(true)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Walk-In
                </button>
              </div>

              {/* Search Filter */}
              <div className="p-3 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Search by name, contact, or address..."
                      value={walkInSearchTerm}
                      onChange={(e) => setWalkInSearchTerm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  {walkInSearchTerm && (
                    <div className="flex items-end mt-2 sm:mt-0">
                      <button
                        onClick={() => setWalkInSearchTerm('')}
                        className="px-4 py-2.5 text-sm text-primary hover:text-primary/80 flex items-center gap-2 font-semibold border-2 border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <X size={16} />
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-gray-600">
                  Showing <span className="font-semibold text-primary">{paginatedWalkInBookings.length}</span> of {filteredWalkInBookings.length} walk-ins
                  {filteredWalkInBookings.length !== walkInBookings.length && ` (filtered from ${walkInBookings.length} total)`}
                </div>
              </div>

              {/* Walk-In Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600">Loading walk-ins...</p>
                  </div>
                ) : filteredWalkInBookings.length === 0 ? (
                  <div className="text-center py-20">
                    <Users size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg text-gray-500">{walkInSearchTerm ? 'No walk-ins found matching your search' : 'No walk-ins recorded yet'}</p>
                  </div>
                ) : (
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Date</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Guest Name</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Room No.</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Contact No.</th>
                        <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">No. of Pax</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Total Amount</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Down Payment</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Balance</th>
                        <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Status</th>
                        <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedWalkInBookings.map((walkIn: any) => (
                        <tr key={walkIn.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700">
                            {formatDate(walkIn.created_at)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-accent text-xs font-bold">
                                  {walkIn.guest_name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-gray-900">{walkIn.guest_name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-primary">
                            {walkIn.room_number}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700">
                            {walkIn.contact_number}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700 text-center">
                            {walkIn.number_of_pax}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold text-gray-900">
                            ₱{parseFloat(walkIn.total_amount || walkIn.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-green-700 font-semibold">
                            ₱{parseFloat(walkIn.down_payment || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold">
                            <span className={parseFloat(walkIn.balance || 0) > 0 ? 'text-orange-600' : 'text-green-600'}>
                              ₱{parseFloat(walkIn.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            {parseFloat(walkIn.balance || 0) > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                Partial
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                Paid
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingWalkIn(walkIn);
                                  setWalkInForm({
                                    numberOfPax: walkIn.number_of_pax?.toString() || '',
                                    guestName: walkIn.guest_name || '',
                                    contactNumber: walkIn.contact_number || '',
                                    roomNumber: walkIn.room_number || '',
                                    totalAmount: walkIn.total_amount?.toString() || walkIn.amount?.toString() || '',
                                    downPayment: walkIn.down_payment?.toString() || '',
                                    balance: walkIn.balance?.toString() || ''
                                  });
                                  setShowEditWalkInModal(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to archive walk-in record for ${walkIn.guest_name}? This will hide it from the active list.`)) {
                                    handleArchiveWalkIn(walkIn.id);
                                  }
                                }}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                title="Archive"
                              >
                                <Archive size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              {!loading && filteredWalkInBookings.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((walkInPage - 1) * walkInPerPage) + 1} to {Math.min(walkInPage * walkInPerPage, filteredWalkInBookings.length)} of {filteredWalkInBookings.length} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWalkInPage(p => Math.max(1, p - 1))}
                      disabled={walkInPage === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalWalkInPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setWalkInPage(page)}
                          className={`px-3 py-1.5 text-sm rounded-lg ${
                            page === walkInPage
                              ? 'bg-primary text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setWalkInPage(p => Math.min(totalWalkInPages, p + 1))}
                      disabled={walkInPage === totalWalkInPages}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'amenities' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200">
              {/* Title Header */}
              <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Amenity Booking Reservations</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage and review all amenity booking requests</p>
                  </div>
                  <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                    <button
                      onClick={() => setShowAmenityBookingModal(true)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg text-sm whitespace-nowrap"
                    >
                      <Plus size={18} />
                      Add Booking
                    </button>
                    <button
                      onClick={() => {
                        setShowAmenityBookingModal(true);
                        // You can add a flag here to indicate it's a walk-in if needed
                      }}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg text-sm whitespace-nowrap"
                    >
                      <LogIn size={18} />
                      Walk-In
                    </button>
                  </div>
                </div>
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
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Day Pass Reservations</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage and review all day pass booking requests</p>
                </div>
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
          
          {activeTab === 'daypasswalkin' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200">
              {/* Title Header */}
              <div className="px-3 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Walk-In Day Pass</h3>
                  <p className="text-sm text-gray-600 mt-1">Record walk-in day pass guests</p>
                </div>
                <button
                  onClick={() => setShowDayPassWalkInModal(true)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Walk-In
                </button>
              </div>

              {/* Search Filter */}
              <div className="p-3 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Search by name or cottage..."
                      value={dayPassWalkInSearchTerm}
                      onChange={(e) => setDayPassWalkInSearchTerm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  {dayPassWalkInSearchTerm && (
                    <div className="flex items-end mt-2 sm:mt-0">
                      <button
                        onClick={() => setDayPassWalkInSearchTerm('')}
                        className="px-4 py-2.5 text-sm text-primary hover:text-primary/80 flex items-center gap-2 font-semibold border-2 border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <X size={16} />
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-gray-600">
                  Showing <span className="font-semibold text-primary">{paginatedDayPassWalkInBookings.length}</span> of {filteredDayPassWalkInBookings.length} walk-ins
                  {filteredDayPassWalkInBookings.length !== dayPassWalkInBookings.length && ` (filtered from ${dayPassWalkInBookings.length} total)`}
                </div>
              </div>

              {/* Day Pass Walk-In Table */}
              <div className="overflow-x-auto">
                {(() => {
                  console.log('[Table Render] dayPassWalkInBookings length:', dayPassWalkInBookings.length);
                  console.log('[Table Render] dayPassWalkInBookings:', dayPassWalkInBookings);
                  console.log('[Table Render] loading:', loading);
                  console.log('[Table Render] filtered count:', dayPassWalkInBookings.filter(w => 
                    !dayPassWalkInSearchTerm || 
                    w.representative_name?.toLowerCase().includes(dayPassWalkInSearchTerm.toLowerCase()) ||
                    w.cottage_type?.toLowerCase().includes(dayPassWalkInSearchTerm.toLowerCase())
                  ).length);
                  return null;
                })()}
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600">Loading walk-ins...</p>
                  </div>
                ) : filteredDayPassWalkInBookings.length === 0 ? (
                  <div className="text-center py-20">
                    <Users size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg text-gray-500">{dayPassWalkInSearchTerm ? 'No walk-ins found matching your search' : 'No day pass walk-ins recorded yet'}</p>
                  </div>
                ) : (
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Date</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Representative Name</th>
                        <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">No. of Pax</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Cottage Type</th>
                        <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Time</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedDayPassWalkInBookings.map((walkIn: any) => (
                        <tr key={walkIn.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700">
                            {formatDate(walkIn.created_at)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-accent text-xs font-bold">
                                  {walkIn.representative_name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-gray-900">{walkIn.representative_name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700 text-center">
                            {walkIn.number_of_pax}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs font-medium">
                            <span className={`px-2 py-1 rounded-full font-semibold ${
                              walkIn.cottage_type === 'concrete' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {walkIn.cottage_type === 'concrete' ? 'Concrete' : 'Kubo'}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-center">
                            <span className={`px-2 py-1 rounded-full font-semibold ${
                              walkIn.time_of_day === 'day' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {walkIn.time_of_day === 'day' ? 'Day' : 'Night'}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold text-gray-900">
                            ₱{parseFloat(walkIn.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              {!loading && filteredDayPassWalkInBookings.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((dayPassWalkInPage - 1) * dayPassWalkInPerPage) + 1} to {Math.min(dayPassWalkInPage * dayPassWalkInPerPage, filteredDayPassWalkInBookings.length)} of {filteredDayPassWalkInBookings.length} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDayPassWalkInPage(p => Math.max(1, p - 1))}
                      disabled={dayPassWalkInPage === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalDayPassWalkInPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setDayPassWalkInPage(page)}
                          className={`px-3 py-1.5 text-sm rounded-lg ${
                            page === dayPassWalkInPage
                              ? 'bg-primary text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setDayPassWalkInPage(p => Math.min(totalDayPassWalkInPages, p + 1))}
                      disabled={dayPassWalkInPage === totalDayPassWalkInPages}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next
                      <ChevronRight size={16} />
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
                          <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Guests</th>
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
                                  <p className="text-[10px] text-gray-400">#{guest.booking_id} � {guest.booking_type}</p>
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
                {roomStatuses.slice(0, 8).map((room: RoomStatus) => (
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
            <>
              {/* Sub-tabs Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-2">
                  <button
                    onClick={() => setHistoryTab('rooms')}
                    className={`px-6 py-3 font-semibold text-sm rounded-t-xl transition-all ${
                      historyTab === 'rooms'
                        ? 'bg-white text-primary border-t-2 border-x-2 border-primary border-b-0'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Home size={20} className="inline mr-2" />
                    Room Bookings
                  </button>
                  <button
                    onClick={() => setHistoryTab('daypass')}
                    className={`px-6 py-3 font-semibold text-sm rounded-t-xl transition-all ${
                      historyTab === 'daypass'
                        ? 'bg-white text-primary border-t-2 border-x-2 border-primary border-b-0'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Users size={20} className="inline mr-2" />
                    Day Pass Bookings
                  </button>
                </nav>
              </div>

              {/* Room Bookings History */}
              {historyTab === 'rooms' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-display font-bold text-gray-900">Room Bookings History</h3>
                    <p className="text-sm text-gray-600 mt-1">Check-in/check-out history for room bookings (online & walk-ins)</p>
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
                        {combinedRoomHistory.map((stay: any) => (
                          <tr key={stay.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-black truncate max-w-[180px]">{stay.guest_name || stay.user_email}</p>
                                <p className="text-[10px] text-gray-400">{stay.room_name || 'Room Booking'}</p>
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
                              {stay.booking_type === 'walk-in' ? (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Paid</span>
                              ) : stay.actual_check_out ? (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Checked Out</span>
                              ) : (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Checked In</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {combinedRoomHistory.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No room booking history records</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Day Pass History */}
              {historyTab === 'daypass' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-display font-bold text-gray-900">Day Pass Bookings History</h3>
                    <p className="text-sm text-gray-600 mt-1">History for day pass bookings (online & walk-ins)</p>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search guest or type..."
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
                          <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Representative Name</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-accent uppercase">No. of Pax</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Cottage Type</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-accent uppercase">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-accent uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {combinedDayPassHistory.map((stay: any) => {
                          // Get cottage type, time, and pax from the record
                          const cottageType = stay.cottage_type 
                            ? (stay.cottage_type === 'concrete' ? 'Concrete' : 'Kubo')
                            : '-';
                          const timeOfDay = stay.time_of_day
                            ? (stay.time_of_day === 'day' ? 'Day' : 'Night')
                            : '-';
                          const numberOfPax = stay.number_of_pax || '-';
                          
                          return (
                            <tr key={stay.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                {stay.created_at ? new Date(stay.created_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <span className="text-accent text-xs font-bold">
                                      {(stay.guest_name || stay.user_email || '?').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-black truncate">{stay.guest_name || stay.user_email}</p>
                                    <p className="text-[10px] text-gray-400">
                                      {stay.booking_type === 'day-pass-walk-in' ? 'Walk-In' : 'Online Booking'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-black text-center">
                                {numberOfPax}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {cottageType !== '-' ? (
                                  <span className={`px-2 py-1 rounded-full font-semibold text-xs ${
                                    cottageType === 'Concrete' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {cottageType}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                {timeOfDay !== '-' ? (
                                  <span className={`px-2 py-1 rounded-full font-semibold text-xs ${
                                    timeOfDay === 'Day' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'
                                  }`}>
                                    {timeOfDay}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-green-600">
                                {formatPeso(stay.total_spent)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {combinedDayPassHistory.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No day pass booking history records</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
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

      {/* Walk-In Booking Modal */}
      <Dialog open={showWalkInModal} onOpenChange={setShowWalkInModal}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <Plus className="text-accent" size={24} /> Record Walk-In
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Record a walk-in guest. Date will be automatically set to today.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWalkInBooking} className="space-y-4">
            <div>
              <Label className="text-gray-700">Number of Pax *</Label>
              <Input 
                type="number" 
                min="1" 
                placeholder="Number of people" 
                value={walkInForm.numberOfPax}
                onChange={(e) => setWalkInForm({ ...walkInForm, numberOfPax: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Guest Name *</Label>
              <Input 
                type="text" 
                placeholder="Full name" 
                value={walkInForm.guestName}
                onChange={(e) => setWalkInForm({ ...walkInForm, guestName: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Room Number *</Label>
              <Input 
                type="text" 
                placeholder="e.g., 101, 202" 
                value={walkInForm.roomNumber}
                onChange={(e) => setWalkInForm({ ...walkInForm, roomNumber: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Contact Number *</Label>
              <Input 
                type="tel" 
                placeholder="+63 XXX XXX XXXX" 
                value={walkInForm.contactNumber}
                onChange={(e) => setWalkInForm({ ...walkInForm, contactNumber: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Total Amount (₱) *</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="0.00" 
                value={walkInForm.totalAmount}
                onChange={(e) => {
                  const total = parseFloat(e.target.value) || 0;
                  const dp = parseFloat(walkInForm.downPayment) || total; // Default to full amount
                  setWalkInForm({ 
                    ...walkInForm, 
                    totalAmount: e.target.value,
                    downPayment: walkInForm.downPayment || e.target.value, // Auto-fill if empty
                    balance: (total - dp).toFixed(2)
                  });
                }}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Amount Paid (₱)</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="Full amount (leave empty for full payment)" 
                value={walkInForm.downPayment}
                onChange={(e) => {
                  const total = parseFloat(walkInForm.totalAmount) || 0;
                  const dp = e.target.value ? parseFloat(e.target.value) : total; // If empty, use total
                  setWalkInForm({ 
                    ...walkInForm, 
                    downPayment: e.target.value,
                    balance: (total - dp).toFixed(2)
                  });
                }}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty if customer pays full amount</p>
            </div>

            <div>
              <Label className="text-gray-700">Balance (₱)</Label>
              <Input 
                type="text" 
                value={(() => {
                  const total = parseFloat(walkInForm.totalAmount) || 0;
                  const dp = walkInForm.downPayment ? parseFloat(walkInForm.downPayment) : total;
                  const balance = total - dp;
                  return `₱${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
                className="bg-gray-100 border-gray-300 text-gray-900 mt-1 font-semibold" 
                disabled
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Automatically calculated</p>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowWalkInModal(false)}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                disabled={walkInLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                disabled={walkInLoading}
              >
                {walkInLoading ? 'Recording...' : 'Record Walk-In'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Walk-In Modal */}
      <Dialog open={showEditWalkInModal} onOpenChange={setShowEditWalkInModal}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <Edit className="text-accent" size={24} /> Edit Walk-In
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Update walk-in guest information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateWalkIn} className="space-y-4">
            <div>
              <Label className="text-gray-700">Number of Pax *</Label>
              <Input 
                type="number" 
                min="1" 
                placeholder="Number of people" 
                value={walkInForm.numberOfPax}
                onChange={(e) => setWalkInForm({ ...walkInForm, numberOfPax: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Guest Name *</Label>
              <Input 
                type="text" 
                placeholder="Full name" 
                value={walkInForm.guestName}
                onChange={(e) => setWalkInForm({ ...walkInForm, guestName: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Room Number *</Label>
              <Input 
                type="text" 
                placeholder="e.g., 101, 202" 
                value={walkInForm.roomNumber}
                onChange={(e) => setWalkInForm({ ...walkInForm, roomNumber: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Contact Number *</Label>
              <Input 
                type="tel" 
                placeholder="+63 XXX XXX XXXX" 
                value={walkInForm.contactNumber}
                onChange={(e) => setWalkInForm({ ...walkInForm, contactNumber: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Total Amount (₱) *</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="0.00" 
                value={walkInForm.totalAmount}
                onChange={(e) => {
                  const total = parseFloat(e.target.value) || 0;
                  const dp = parseFloat(walkInForm.downPayment) || total; // Default to full amount
                  setWalkInForm({ 
                    ...walkInForm, 
                    totalAmount: e.target.value,
                    downPayment: walkInForm.downPayment || e.target.value, // Auto-fill if empty
                    balance: (total - dp).toFixed(2)
                  });
                }}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Amount Paid (₱)</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="Full amount (leave empty for full payment)" 
                value={walkInForm.downPayment}
                onChange={(e) => {
                  const total = parseFloat(walkInForm.totalAmount) || 0;
                  const dp = e.target.value ? parseFloat(e.target.value) : total; // If empty, use total
                  setWalkInForm({ 
                    ...walkInForm, 
                    downPayment: e.target.value,
                    balance: (total - dp).toFixed(2)
                  });
                }}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty if customer pays full amount</p>
            </div>

            <div>
              <Label className="text-gray-700">Balance (₱)</Label>
              <Input 
                type="text" 
                value={(() => {
                  const total = parseFloat(walkInForm.totalAmount) || 0;
                  const dp = walkInForm.downPayment ? parseFloat(walkInForm.downPayment) : total;
                  const balance = total - dp;
                  return `₱${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
                className="bg-gray-100 border-gray-300 text-gray-900 mt-1 font-semibold" 
                disabled
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Automatically calculated</p>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditWalkInModal(false);
                  setEditingWalkIn(null);
                  setWalkInForm({
                    numberOfPax: '',
                    guestName: '',
                    contactNumber: '',
                    roomNumber: '',
                    totalAmount: '',
                    downPayment: '',
                    balance: ''
                  });
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                disabled={walkInLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                disabled={walkInLoading}
              >
                {walkInLoading ? 'Updating...' : 'Update Walk-In'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Day Pass Walk-In Modal */}
      <Dialog open={showDayPassWalkInModal} onOpenChange={setShowDayPassWalkInModal}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <Plus className="text-accent" size={24} /> Record Day Pass Walk-In
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Record a walk-in day pass guest. Amount is auto-calculated based on cottage type and time.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDayPassWalkIn} className="space-y-4">
            <div>
              <Label className="text-gray-700">Representative Name *</Label>
              <Input 
                type="text" 
                placeholder="Main contact person" 
                value={dayPassWalkInForm.representativeName}
                onChange={(e) => setDayPassWalkInForm({ ...dayPassWalkInForm, representativeName: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Number of Pax *</Label>
              <Input 
                type="number" 
                min="1" 
                placeholder="Total people in group" 
                value={dayPassWalkInForm.numberOfPax}
                onChange={(e) => {
                  const pax = parseInt(e.target.value) || 0;
                  const timeOfDay = dayPassWalkInForm.timeOfDay;
                  
                  let total = 0;
                  if (timeOfDay) {
                    if (timeOfDay === 'day') {
                      // Day: 500 per cottage + 100 per pax
                      total = 500 + (100 * pax);
                    } else {
                      // Night: 600 per cottage + 150 per pax
                      total = 600 + (150 * pax);
                    }
                  }
                  
                  setDayPassWalkInForm({ 
                    ...dayPassWalkInForm, 
                    numberOfPax: e.target.value,
                    totalAmount: total.toString()
                  });
                }}
                className="bg-white border-gray-300 text-gray-900 mt-1" 
                required 
              />
            </div>

            <div>
              <Label className="text-gray-700">Cottage Type *</Label>
              <select
                value={dayPassWalkInForm.cottageType}
                onChange={(e) => {
                  const cottageType = e.target.value;
                  const pax = parseInt(dayPassWalkInForm.numberOfPax) || 0;
                  const timeOfDay = dayPassWalkInForm.timeOfDay;
                  
                  let total = 0;
                  if (pax > 0 && timeOfDay) {
                    if (timeOfDay === 'day') {
                      // Day: 500 per cottage + 100 per pax
                      total = 500 + (100 * pax);
                    } else {
                      // Night: 600 per cottage + 150 per pax
                      total = 600 + (150 * pax);
                    }
                  }
                  
                  setDayPassWalkInForm({ 
                    ...dayPassWalkInForm, 
                    cottageType,
                    totalAmount: total.toString()
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                required
              >
                <option value="">Select cottage type</option>
                <option value="concrete">Concrete</option>
                <option value="kubo">Kubo</option>
              </select>
            </div>

            <div>
              <Label className="text-gray-700">Time of Day *</Label>
              <select
                value={dayPassWalkInForm.timeOfDay}
                onChange={(e) => {
                  const timeOfDay = e.target.value;
                  const pax = parseInt(dayPassWalkInForm.numberOfPax) || 0;
                  
                  let total = 0;
                  if (pax > 0) {
                    if (timeOfDay === 'day') {
                      // Day: 500 per cottage + 100 per pax
                      total = 500 + (100 * pax);
                    } else {
                      // Night: 600 per cottage + 150 per pax
                      total = 600 + (150 * pax);
                    }
                  }
                  
                  setDayPassWalkInForm({ 
                    ...dayPassWalkInForm, 
                    timeOfDay,
                    totalAmount: total.toString()
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                required
              >
                <option value="">Select time</option>
                <option value="day">Day</option>
                <option value="night">Night</option>
              </select>
            </div>

            <div>
              <Label className="text-gray-700">Total Amount (₱)</Label>
              <Input 
                type="text" 
                value={dayPassWalkInForm.totalAmount ? `₱${parseFloat(dayPassWalkInForm.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱0.00'}
                className="bg-gray-100 border-gray-300 text-gray-900 mt-1 font-semibold text-lg" 
                disabled
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Automatically calculated based on selections</p>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDayPassWalkInModal(false);
                  setDayPassWalkInForm({
                    representativeName: '',
                    numberOfPax: '',
                    cottageType: '',
                    timeOfDay: '',
                    totalAmount: ''
                  });
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                disabled={dayPassWalkInLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                disabled={dayPassWalkInLoading}
              >
                {dayPassWalkInLoading ? 'Recording...' : 'Record Walk-In'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Amenity Booking Modal */}
      <Dialog open={showAmenityBookingModal} onOpenChange={setShowAmenityBookingModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Create Amenity Booking</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new amenity booking for a guest. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAmenityBookingSubmit} className="space-y-4">
            {/* Guest Information */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">Guest Information</h4>
              
              <div>
                <Label className="text-gray-700">Guest Name *</Label>
                <Input
                  type="text"
                  placeholder="Full name"
                  value={amenityBookingForm.guestName}
                  onChange={(e) => setAmenityBookingForm({ ...amenityBookingForm, guestName: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-gray-700">Email Address *</Label>
                <Input
                  type="email"
                  placeholder="guest@example.com"
                  value={amenityBookingForm.guestEmail}
                  onChange={(e) => setAmenityBookingForm({ ...amenityBookingForm, guestEmail: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-gray-700">Contact Number *</Label>
                <Input
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={amenityBookingForm.contactNumber}
                  onChange={(e) => setAmenityBookingForm({ ...amenityBookingForm, contactNumber: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 mt-1"
                  required
                />
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">Booking Details</h4>
              
              <div>
                <Label className="text-gray-700">Select Amenity *</Label>
                <select
                  value={amenityBookingForm.amenityId}
                  onChange={(e) => handleAmenitySelection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white mt-1 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Choose an amenity...</option>
                  {availableAmenities.map((amenity) => (
                    <option key={amenity.id} value={amenity.id}>
                      {amenity.amenity_name} - {amenity.base_price || amenity.price_per_pax} 
                      {amenity.price_per_pax && ' per pax'} (Capacity: {amenity.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Booking Date *</Label>
                  <Input
                    type="date"
                    value={amenityBookingForm.bookingDate}
                    onChange={(e) => setAmenityBookingForm({ ...amenityBookingForm, bookingDate: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900 mt-1"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-700">Number of Guests *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Number of guests"
                    value={amenityBookingForm.guests}
                    onChange={(e) => setAmenityBookingForm({ ...amenityBookingForm, guests: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900 mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Start Time *</Label>
                  <Input
                    type="time"
                    value={amenityBookingForm.startTime}
                    onChange={(e) => setAmenityBookingForm({ ...amenityBookingForm, startTime: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900 mt-1"
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-700">End Time *</Label>
                  <Input
                    type="time"
                    value={amenityBookingForm.endTime}
                    onChange={(e) => setAmenityBookingForm({ ...amenityBookingForm, endTime: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900 mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-700">Occasion/Event Type *</Label>
                <Input
                  type="text"
                  placeholder="e.g., Birthday Party, Wedding, Corporate Event"
                  value={amenityBookingForm.occasion}
                  onChange={(e) => setAmenityBookingForm({ ...amenityBookingForm, occasion: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-gray-700">Event Details (Optional)</Label>
                <Textarea
                  placeholder="Additional details about the event..."
                  value={amenityBookingForm.eventDetails}
                  onChange={(e) => setAmenityBookingForm({ ...amenityBookingForm, eventDetails: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 mt-1 min-h-[80px]"
                />
              </div>

              <div>
                <Label className="text-gray-700">Total Amount (?) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amenityBookingForm.totalAmount}
                  onChange={(e) => setAmenityBookingForm({ ...amenityBookingForm, totalAmount: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 mt-1"
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline" 
                onClick={() => setShowAmenityBookingModal(false)}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                disabled={amenityBookingLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                disabled={amenityBookingLoading}
              >
                {amenityBookingLoading ? 'Creating...' : 'Create Booking'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <LogOut className="text-amber-800" size={24} />
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to logout?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmLogout}
              className="bg-amber-800 hover:bg-amber-700 text-white"
            >
              Yes, Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



