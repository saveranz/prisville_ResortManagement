import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Home, Package, LogOut, CheckCircle, XCircle, TrendingUp, Clock, DollarSign, FileText, Plus, Minus, TrendingDown } from "lucide-react";

interface Booking {
  id: number;
  user_email: string;
  booking_date?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  number_of_pax?: number;
  room_name?: string;
  amenity_name?: string;
  total_amount: string;
  status: string;
  created_at: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'amenities' | 'daypass' | 'inventory'>('overview');
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
  }, []);

  useEffect(() => {
    calculateStats();
  }, [roomBookings, amenityBookings, dayPassBookings]);

  const calculateStats = () => {
    const allBookings = [...roomBookings, ...amenityBookings, ...dayPassBookings];
    const today = new Date().toISOString().split('T')[0];
    
    const totalBookings = allBookings.length;
    const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
    const approvedToday = allBookings.filter(b => 
      b.status === 'approved' && 
      new Date(b.created_at).toISOString().split('T')[0] === today
    ).length;
    
    const totalRevenue = allBookings
      .filter(b => b.status === 'approved')
      .reduce((sum, b) => sum + parseFloat(b.total_amount.replace(/[₱,]/g, '')), 0);

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
          <div key={`${booking.id}-${booking.user_email}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                booking.room_name ? 'bg-green-100 text-green-700' :
                booking.amenity_name ? 'bg-yellow-100 text-yellow-600' :
                'bg-teal-100 text-teal-600'
              }`}>
                {booking.room_name ? <Home size={20} /> :
                 booking.amenity_name ? <Calendar size={20} /> :
                 <Users size={20} />}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{booking.user_email}</p>
                <p className="text-sm text-gray-500">
                  {booking.room_name || booking.amenity_name || 'Day Pass'} • {formatDate(booking.check_in || booking.booking_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-900">{booking.total_amount}</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Guest</th>
              {type === 'room' && <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Room</th>}
              {type === 'amenity' && <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amenity</th>}
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Guests</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900">#{booking.id}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-semibold">
                        {booking.user_email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{booking.user_email}</span>
                  </div>
                </td>
                {type === 'room' && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.room_name}</td>}
                {type === 'amenity' && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.amenity_name}</td>}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDateTime(booking.check_in || booking.booking_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {booking.guests || booking.number_of_pax}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{booking.total_amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                    booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                    booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateBookingStatus(type, booking.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-xs"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => updateBookingStatus(type, booking.id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-xs"
                      >
                        <XCircle size={16} />
                        Reject
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
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-700 to-yellow-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">Prisville</h1>
              <p className="text-xs text-gray-500">Resort Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp size={20} />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('rooms')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'rooms'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home size={20} />
            <span>Room Bookings</span>
            {roomBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                {roomBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('amenities')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'amenities'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar size={20} />
            <span>Amenities</span>
            {amenityBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                {amenityBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('daypass')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'daypass'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users size={20} />
            <span>Day Pass</span>
            {dayPassBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                {dayPassBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'inventory'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package size={20} />
            <span>Inventory</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-700 font-semibold text-sm">
                {user?.name?.charAt(0) || 'R'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeTab === 'overview' ? 'Dashboard Overview' :
                 activeTab === 'rooms' ? 'Room Bookings' :
                 activeTab === 'amenities' ? 'Amenity Bookings' :
                 activeTab === 'daypass' ? 'Day Pass Bookings' :
                 'Inventory Management'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {activeTab === 'inventory' 
                  ? 'Manage inventory items and financial transactions'
                  : 'Manage all resort bookings and operations'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Today's Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
                      <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                        <TrendingUp size={14} />
                        All time
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Pending</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingBookings}</p>
                      <p className="text-orange-600 text-sm mt-2 flex items-center gap-1">
                        <Clock size={14} />
                        Awaiting approval
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Clock className="text-orange-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Approved Today</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.approvedToday}</p>
                      <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Confirmed
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">₱{stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                        <DollarSign size={14} />
                        Approved bookings
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <DollarSign className="text-emerald-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Room Bookings</h3>
                    <Home size={24} />
                  </div>
                  <p className="text-3xl font-bold mb-2">{roomBookings.length}</p>
                  <button
                    onClick={() => setActiveTab('rooms')}
                    className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                  >
                    View Details
                  </button>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Amenity Bookings</h3>
                    <Calendar size={24} />
                  </div>
                  <p className="text-3xl font-bold mb-2">{amenityBookings.length}</p>
                  <button
                    onClick={() => setActiveTab('amenities')}
                    className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                  >
                    View Details
                  </button>
                </div>

                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Day Pass</h3>
                    <Users size={24} />
                  </div>
                  <p className="text-3xl font-bold mb-2">{dayPassBookings.length}</p>
                  <button
                    onClick={() => setActiveTab('daypass')}
                    className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
                {renderRecentBookings()}
              </div>
            </>
          )}
          
          {activeTab === 'rooms' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {renderBookingTable(roomBookings, 'room')}
            </div>
          )}
          
          {activeTab === 'amenities' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {renderBookingTable(amenityBookings, 'amenity')}
            </div>
          )}
          
          {activeTab === 'daypass' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {renderBookingTable(dayPassBookings, 'daypass')}
            </div>
          )}
          
          {activeTab === 'inventory' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">₱{calculateTotals().income.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="text-green-600" size={32} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">₱{calculateTotals().expenses.toLocaleString()}</p>
                    </div>
                    <TrendingDown className="text-red-600" size={32} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className={`text-2xl font-bold ${calculateTotals().profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ₱{calculateTotals().profit.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="text-blue-600" size={32} />
                  </div>
                </div>
              </div>

              {/* Navigation Tabs for Inventory */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex gap-8">
                  <button
                    onClick={() => setInventoryTab('inventory')}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      inventoryTab === 'inventory'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Package size={20} />
                    Inventory Items
                  </button>
                  <button
                    onClick={() => setInventoryTab('transactions')}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      inventoryTab === 'transactions'
                        ? 'border-green-500 text-green-600'
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
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
                    <button
                      onClick={() => setShowAddItem(!showAddItem)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
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
                          className="px-4 py-2 border rounded-lg text-gray-900"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Category"
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                          className="px-4 py-2 border rounded-lg text-gray-900"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Quantity"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          className="px-4 py-2 border rounded-lg text-gray-900"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Unit (pcs, kg, etc)"
                          value={newItem.unit}
                          onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                          className="px-4 py-2 border rounded-lg text-gray-900"
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Unit Price"
                          value={newItem.unit_price}
                          onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                          className="px-4 py-2 border rounded-lg text-gray-900"
                          required
                        />
                        <button type="submit" className="col-span-5 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                          Save Item
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inventory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{item.item_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.quantity} {item.unit}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.unit_price}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              ₱{(item.quantity * parseFloat(item.unit_price.replace(/[₱,]/g, ''))).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Plus size={20} />
                                </button>
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Minus size={20} />
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
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Financial Transactions</h2>
                    <button
                      onClick={() => setShowAddTransaction(!showAddTransaction)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Plus size={20} />
                      Add Transaction
                    </button>
                  </div>

                  {showAddTransaction && (
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                      <form onSubmit={handleAddTransaction} className="grid grid-cols-2 gap-4">
                        <select
                          value={newTransaction.type}
                          onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'income' | 'expense' })}
                          className="px-4 py-2 border rounded-lg text-gray-900"
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
                          className="px-4 py-2 border rounded-lg text-gray-900"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={newTransaction.description}
                          onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                          className="px-4 py-2 border rounded-lg text-gray-900 col-span-2"
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={newTransaction.amount}
                          onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                          className="px-4 py-2 border rounded-lg text-gray-900"
                          required
                        />
                        <input
                          type="date"
                          value={newTransaction.transaction_date}
                          onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                          className="px-4 py-2 border rounded-lg text-gray-900"
                          required
                        />
                        <button type="submit" className="col-span-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                          Save Transaction
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{transaction.transaction_date}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{transaction.category}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                            <td className={`px-6 py-4 text-sm font-semibold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
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
        </div>
      </div>
    </div>
  );
}
