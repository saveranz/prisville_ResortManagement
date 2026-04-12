import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus, Minus, DollarSign, TrendingUp, TrendingDown, Filter, X, Edit, Archive, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, CalendarClock, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

interface StockTransaction {
  id: number;
  item_id: number;
  item_name: string;
  unit: string;
  category: string;
  type: 'received' | 'issued';
  quantity: number;
  performed_by: string;
  supplier: string | null;
  notes: string | null;
  created_at: string;
}

interface FinancialTransaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: string;
  transaction_date: string;
  created_at: string;
}

interface InventoryStats {
  total_items: number;
  low_stock_count: number;
  expiring_soon_count: number;
  total_categories: number;
  monthly_cost: number;
  top_used: { item_name: string; category: string; total_issued: number }[];
}

const CATEGORIES = ['Housekeeping', 'Guest Amenities', 'Cleaning', 'Kitchen', 'Maintenance', 'Pool', 'Office', 'Other'];

export default function ReceptionistInventory({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'stock-log' | 'transactions'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [showIssueStock, setShowIssueStock] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryItemsPerPage = 20;
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'expiring'>('all');
  const navigate = useNavigate();

  // Financial transaction filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'income' | 'expense',
    category: 'all',
    startDate: '',
    endDate: ''
  });
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');

  const emptyNewItem = { item_name: '', category: '', quantity: '', unit: '', unit_price: '', min_stock: '', supplier: '', expiry_date: '' };
  const [newItem, setNewItem] = useState(emptyNewItem);
  const [editItem, setEditItem] = useState(emptyNewItem);

  const [receiveForm, setReceiveForm] = useState({ quantity: '', supplier: '', notes: '' });
  const [issueForm, setIssueForm] = useState({ quantity: '', notes: '' });

  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    checkAuth();
    fetchInventory();
    fetchStats();
    fetchFinancialTransactions();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json();
      if (!data.success || data.user.role !== 'receptionist') {
        navigate('/');
      }
    } catch (error) {
      navigate('/');
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setInventory(data.items);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/inventory/stats', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchStockTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/stock-transactions', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setStockTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching stock transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/transactions', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setFinancialTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock transactions when tab switches to stock-log
  useEffect(() => {
    if (activeTab === 'stock-log' && stockTransactions.length === 0) {
      fetchStockTransactions();
    }
  }, [activeTab]);

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
        setShowAddItem(false);
        setNewItem(emptyNewItem);
        fetchInventory();
        fetchStats();
      } else {
        alert(data.message || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      const response = await fetch('/api/inventory/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedItem.id, ...editItem })
      });
      const data = await response.json();
      if (data.success) {
        setShowEditItem(false);
        setSelectedItem(null);
        fetchInventory();
        fetchStats();
      } else {
        alert(data.message || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleArchiveItem = async () => {
    if (!selectedItem) return;
    try {
      const response = await fetch('/api/inventory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedItem.id })
      });
      const data = await response.json();
      if (data.success) {
        setShowArchiveConfirm(false);
        setSelectedItem(null);
        fetchInventory();
        fetchStats();
      } else {
        alert(data.message || 'Failed to archive item');
      }
    } catch (error) {
      console.error('Error archiving item:', error);
      alert('Failed to archive item');
    }
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      const response = await fetch('/api/inventory/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedItem.id, ...receiveForm })
      });
      const data = await response.json();
      if (data.success) {
        setShowReceiveStock(false);
        setSelectedItem(null);
        setReceiveForm({ quantity: '', supplier: '', notes: '' });
        fetchInventory();
        fetchStats();
      } else {
        alert(data.message || 'Failed to receive stock');
      }
    } catch (error) {
      console.error('Error receiving stock:', error);
      alert('Failed to receive stock');
    }
  };

  const handleIssueStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      const response = await fetch('/api/inventory/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedItem.id, ...issueForm })
      });
      const data = await response.json();
      if (data.success) {
        setShowIssueStock(false);
        setSelectedItem(null);
        setIssueForm({ quantity: '', notes: '' });
        fetchInventory();
        fetchStats();
      } else {
        alert(data.message || 'Failed to issue stock');
      }
    } catch (error) {
      console.error('Error issuing stock:', error);
      alert('Failed to issue stock');
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
        setShowAddTransaction(false);
        setNewTransaction({ type: 'income', category: '', description: '', amount: '', transaction_date: new Date().toISOString().split('T')[0] });
        fetchFinancialTransactions();
      } else {
        alert('Failed to add transaction');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditItem({
      item_name: item.item_name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      unit_price: String(parseFloat(String(item.unit_price).replace(/[\u20b1,]/g, ''))),
      min_stock: String(item.min_stock || 0),
      supplier: item.supplier || '',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : ''
    });
    setShowEditItem(true);
  };

  const openReceiveModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setReceiveForm({ quantity: '', supplier: item.supplier || '', notes: '' });
    setShowReceiveStock(true);
  };

  const openIssueModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIssueForm({ quantity: '', notes: '' });
    setShowIssueStock(true);
  };

  // Get unique categories from financial transactions
  const uniqueCategories = useMemo(() => {
    const categories = new Set(financialTransactions.map(t => t.category));
    return Array.from(categories).sort();
  }, [financialTransactions]);

  // Filter financial transactions
  const filteredFinancialTransactions = useMemo(() => {
    return financialTransactions.filter(t => {
      if (filters.type !== 'all' && t.type !== filters.type) return false;
      if (filters.category !== 'all' && t.category !== filters.category) return false;
      if (filters.startDate && t.transaction_date < filters.startDate) return false;
      if (filters.endDate && t.transaction_date > filters.endDate) return false;
      if (transactionSearchTerm) {
        const s = transactionSearchTerm.toLowerCase();
        return t.description.toLowerCase().includes(s) || t.category.toLowerCase().includes(s) || t.amount.toLowerCase().includes(s);
      }
      return true;
    });
  }, [financialTransactions, filters, transactionSearchTerm]);

  const calculateTotals = () => {
    const income = filteredFinancialTransactions.filter(t => t.type === 'income').reduce((sum, t) => {
      const amount = parseFloat(t.amount.replace(/[\u20b1,]/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const expenses = filteredFinancialTransactions.filter(t => t.type === 'expense').reduce((sum, t) => {
      const amount = parseFloat(t.amount.replace(/[\u20b1,]/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    return { income, expenses, profit: income - expenses };
  };

  const totals = calculateTotals();

  const clearFilters = () => {
    setFilters({ type: 'all', category: 'all', startDate: '', endDate: '' });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.category !== 'all' || filters.startDate || filters.endDate;

  const calculatedTotal = useMemo(() => {
    const qty = parseFloat(newItem.quantity) || 0;
    const price = parseFloat(newItem.unit_price) || 0;
    return qty * price;
  }, [newItem.quantity, newItem.unit_price]);

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(String(price).replace(/[\u20b1,]/g, ''));
    if (isNaN(numPrice)) return '0';
    return numPrice.toLocaleString();
  };

  // Filtered inventory items
  const filteredInventory = useMemo(() => {
    let items = inventory;
    if (inventorySearchTerm) {
      const s = inventorySearchTerm.toLowerCase();
      items = items.filter(item =>
        item.item_name.toLowerCase().includes(s) ||
        item.category.toLowerCase().includes(s) ||
        item.unit.toLowerCase().includes(s) ||
        (item.supplier && item.supplier.toLowerCase().includes(s))
      );
    }
    if (categoryFilter !== 'all') {
      items = items.filter(item => item.category === categoryFilter);
    }
    if (stockFilter === 'low') {
      items = items.filter(item => item.min_stock > 0 && item.quantity <= item.min_stock);
    } else if (stockFilter === 'expiring') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      items = items.filter(item => item.expiry_date && new Date(item.expiry_date) <= thirtyDaysFromNow);
    }
    return items;
  }, [inventory, inventorySearchTerm, categoryFilter, stockFilter]);

  const paginatedInventory = useMemo(() => {
    const startIndex = (inventoryPage - 1) * inventoryItemsPerPage;
    return filteredInventory.slice(startIndex, startIndex + inventoryItemsPerPage);
  }, [filteredInventory, inventoryPage]);

  const totalInventoryPages = Math.ceil(filteredInventory.length / inventoryItemsPerPage);

  const isLowStock = (item: InventoryItem) => item.min_stock > 0 && item.quantity <= item.min_stock;
  const isExpiringSoon = (item: InventoryItem) => {
    if (!item.expiry_date) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(item.expiry_date) <= thirtyDaysFromNow;
  };

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50'}>
      {/* Header */}
      {!embedded && (
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/receptionist/dashboard')} className="text-primary hover:text-primary/80">
              â† Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          </div>
        </div>
      </div>
      )}

      {/* Stats Cards */}
      <div className={embedded ? 'mt-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6'}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_items || inventory.length}</p>
                <p className="text-xs text-gray-500">{stats?.total_categories || 0} categories</p>
              </div>
              <Package className="text-primary" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Alerts</p>
                <p className={`text-2xl font-bold ${(stats?.low_stock_count || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats?.low_stock_count || 0}
                </p>
                <p className="text-xs text-gray-500">below PAR level</p>
              </div>
              <AlertTriangle className={(stats?.low_stock_count || 0) > 0 ? 'text-red-600' : 'text-green-600'} size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className={`text-2xl font-bold ${(stats?.expiring_soon_count || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {stats?.expiring_soon_count || 0}
                </p>
                <p className="text-xs text-gray-500">within 30 days</p>
              </div>
              <CalendarClock className={(stats?.expiring_soon_count || 0) > 0 ? 'text-orange-600' : 'text-green-600'} size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-primary">{"\u20b1"}{(stats?.monthly_cost || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">received items value</p>
              </div>
              <BarChart3 className="text-primary" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={embedded ? 'mt-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6'}>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package size={20} />
              Inventory Items
            </button>
            <button
              onClick={() => setActiveTab('stock-log')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stock-log' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ArrowDownToLine size={20} />
              Stock Log
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign size={20} />
              Financial Transactions
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className={embedded ? 'mt-4 pb-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12'}>

        {/* =========== INVENTORY ITEMS TAB =========== */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex flex-col gap-3">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
              </div>
              <div className="flex gap-2 items-center flex-wrap overflow-x-auto whitespace-nowrap min-w-0">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={inventorySearchTerm}
                  onChange={(e) => { setInventorySearchTerm(e.target.value); setInventoryPage(1); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setInventoryPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={stockFilter}
                  onChange={(e) => { setStockFilter(e.target.value as 'all' | 'low' | 'expiring'); setInventoryPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                >
                  <option value="all">All Stock</option>
                  <option value="low">⚠️ Low Stock</option>
                  <option value="expiring">📅 Expiring Soon</option>
                </select>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-md"
                  style={{ marginLeft: 'auto' }}
                >
                  <Plus size={20} />
                  Add Item
                </button>
              </div>
            </div>
            {/* Fallback Add Item button for extra visibility if main button is hidden */}
            <div className="flex justify-end px-6 py-2">
              <button
                onClick={() => setShowAddItem(true)}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 min-w-[120px]"
              >
                <Plus size={20} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary/5 border-b-2 border-primary/20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Item Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">PAR Level</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedInventory.length === 0 ? (
                    <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-500">No items found.</td></tr>
                  ) : paginatedInventory.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${isLowStock(item) ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">#{item.id}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-black">{item.item_name}</td>
                      <td className="px-4 py-3 text-sm text-black">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-black font-semibold">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.min_stock > 0 ? `${item.min_stock} ${item.unit}` : 'â€”'}</td>
                      <td className="px-4 py-3 text-sm text-black">{"\u20b1"}{formatPrice(String(item.unit_price))}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.supplier || 'â€”'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.expiry_date ? (
                          <span className={isExpiringSoon(item) ? 'text-orange-600 font-semibold' : ''}>
                            {new Date(item.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        ) : 'â€”'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isLowStock(item) && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">Low Stock</span>
                        )}
                        {isExpiringSoon(item) && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 ml-1">Expiring</span>
                        )}
                        {!isLowStock(item) && !isExpiringSoon(item) && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-1">
                          <button onClick={() => openReceiveModal(item)} title="Receive Stock"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <ArrowDownToLine size={16} />
                          </button>
                          <button onClick={() => openIssueModal(item)} title="Issue Stock"
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <ArrowUpFromLine size={16} />
                          </button>
                          <button onClick={() => openEditModal(item)} title="Edit Item"
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => { setSelectedItem(item); setShowArchiveConfirm(true); }} title="Archive Item"
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                            <Archive size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalInventoryPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((inventoryPage - 1) * inventoryItemsPerPage) + 1} to {Math.min(inventoryPage * inventoryItemsPerPage, filteredInventory.length)} of {filteredInventory.length} items
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setInventoryPage(p => Math.max(1, p - 1))} disabled={inventoryPage === 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                  </button>
                  {Array.from({ length: totalInventoryPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setInventoryPage(p)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${p === inventoryPage ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setInventoryPage(p => Math.min(totalInventoryPages, p + 1))} disabled={inventoryPage === totalInventoryPages}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========== STOCK LOG TAB =========== */}
        {activeTab === 'stock-log' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Stock Receiving & Issuance Log</h2>
              <p className="text-sm text-gray-500 mt-1">All stock movements â€” deliveries received and items issued to staff.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary/5 border-b-2 border-primary/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Performed By</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockTransactions.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No stock transactions yet.</td></tr>
                  ) : stockTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-black">
                        {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          t.type === 'received' ? 'bg-green-100 text-green-800' : 'bg-primary/10 text-primary'
                        }`}>
                          {t.type === 'received' ? 'ðŸ“¦ Received' : 'ðŸ“¤ Issued'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-black">{t.item_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.category}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-black">{t.quantity} {t.unit}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.supplier || 'â€”'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.performed_by}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t.notes || 'â€”'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========== FINANCIAL TRANSACTIONS TAB =========== */}
        {activeTab === 'transactions' && (
          <div>
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">{"\u20b1"}{totals.income.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="text-green-600" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{"\u20b1"}{totals.expenses.toLocaleString()}</p>
                  </div>
                  <TrendingDown className="text-red-600" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Net Profit</p>
                    <p className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-primary' : 'text-red-600'}`}>
                      {"\u20b1"}{totals.profit.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="text-primary" size={32} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Financial Transactions</h2>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={transactionSearchTerm}
                    onChange={(e) => setTransactionSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      showFilters || hasActiveFilters ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Filter size={20} />
                    Filters {hasActiveFilters && `(${Object.values(filters).filter(v => v && v !== 'all').length})`}
                  </button>
                  <button
                    onClick={() => setShowAddTransaction(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Add Transaction
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-900">Filter Transactions</h3>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                        <X size={16} /> Clear All
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value as 'all' | 'income' | 'expense' })}
                        className="w-full px-4 py-2 border rounded-lg text-gray-900">
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg text-gray-900">
                        <option value="all">All Categories</option>
                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg text-gray-900" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{filteredFinancialTransactions.length}</span> of <span className="font-semibold text-gray-900">{financialTransactions.length}</span> transactions
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary/5 border-b-2 border-primary/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFinancialTransactions.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions found.</td></tr>
                    ) : filteredFinancialTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-100">
                        <td className="px-6 py-4 text-sm font-semibold text-black">
                          {new Date(t.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-black">{t.category}</td>
                        <td className="px-6 py-4 text-sm text-black">{t.description}</td>
                        <td className={`px-6 py-4 text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '-'}{t.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== MODALS ========== */}

      {/* Add Item Modal */}
      <Dialog open={showAddItem} onOpenChange={(open) => { setShowAddItem(open); if (!open) setNewItem(emptyNewItem); }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <Plus className="text-primary" size={24} /> Add New Item
            </DialogTitle>
            <DialogDescription className="text-gray-600">Fill in the details for the new inventory item.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input type="text" placeholder="Enter item name" value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" required>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input type="text" placeholder="pcs, kg, etc." value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input type="number" placeholder="0" value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ({"\u20b1"}) *</label>
                  <input type="number" step="0.01" placeholder="0.00" value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAR Level</label>
                  <input type="number" placeholder="Min stock" value={newItem.min_stock}
                    onChange={(e) => setNewItem({ ...newItem, min_stock: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input type="text" placeholder="Supplier name" value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input type="date" value={newItem.expiry_date}
                    onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              </div>
            </div>
            {(newItem.quantity && newItem.unit_price) && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Calculated Total Value:</span>
                  <span className="text-2xl font-bold text-primary">{"\u20b1"}{calculatedTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <button type="button" onClick={() => { setShowAddItem(false); setNewItem(emptyNewItem); }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold">Save Item</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={showEditItem} onOpenChange={(open) => { setShowEditItem(open); if (!open) setSelectedItem(null); }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <Edit className="text-primary" size={24} /> Edit Item
            </DialogTitle>
            <DialogDescription className="text-gray-600">Update item details. Quantity changes should use Receive/Issue Stock.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditItem} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input type="text" value={editItem.item_name}
                  onChange={(e) => setEditItem({ ...editItem, item_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={editItem.category} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" required>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input type="text" value={editItem.unit}
                    onChange={(e) => setEditItem({ ...editItem, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ({"\u20b1"}) *</label>
                  <input type="number" step="0.01" value={editItem.unit_price}
                    onChange={(e) => setEditItem({ ...editItem, unit_price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAR Level (Min Stock)</label>
                  <input type="number" value={editItem.min_stock}
                    onChange={(e) => setEditItem({ ...editItem, min_stock: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input type="text" placeholder="Supplier name" value={editItem.supplier}
                    onChange={(e) => setEditItem({ ...editItem, supplier: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input type="date" value={editItem.expiry_date}
                    onChange={(e) => setEditItem({ ...editItem, expiry_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <button type="button" onClick={() => setShowEditItem(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold">Save Changes</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <strong>{selectedItem?.item_name}</strong>? This will hide the item from the inventory for non-admins, but keep all stock transaction history. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItem(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveItem} className="bg-yellow-600 text-white hover:bg-yellow-700">Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receive Stock Modal */}
      <Dialog open={showReceiveStock} onOpenChange={(open) => { setShowReceiveStock(open); if (!open) { setSelectedItem(null); setReceiveForm({ quantity: '', supplier: '', notes: '' }); } }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <ArrowDownToLine className="text-green-600" size={24} /> Receive Stock
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Record delivery for <strong>{selectedItem?.item_name}</strong> (Current: {selectedItem?.quantity} {selectedItem?.unit})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReceiveStock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received *</label>
              <input type="number" min="1" placeholder="How many received?" value={receiveForm.quantity}
                onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input type="text" placeholder="Supplier name" value={receiveForm.supplier}
                onChange={(e) => setReceiveForm({ ...receiveForm, supplier: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" placeholder="e.g., Invoice #12345" value={receiveForm.notes}
                onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <DialogFooter className="gap-2">
              <button type="button" onClick={() => setShowReceiveStock(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Receive Stock</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Stock Modal */}
      <Dialog open={showIssueStock} onOpenChange={(open) => { setShowIssueStock(open); if (!open) { setSelectedItem(null); setIssueForm({ quantity: '', notes: '' }); } }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <ArrowUpFromLine className="text-primary" size={24} /> Issue Stock
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Issue stock for <strong>{selectedItem?.item_name}</strong> (Available: {selectedItem?.quantity} {selectedItem?.unit})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleIssueStock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Issue *</label>
              <input type="number" min="1" max={selectedItem?.quantity} placeholder="How many to issue?" value={issueForm.quantity}
                onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Reason</label>
              <input type="text" placeholder="e.g., For Room 101 cleaning" value={issueForm.notes}
                onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
            <DialogFooter className="gap-2">
              <button type="button" onClick={() => setShowIssueStock(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold">Issue Stock</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Financial Transaction Modal */}
      <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <DollarSign className="text-primary" size={24} /> Add Transaction
            </DialogTitle>
            <DialogDescription className="text-gray-600">Record a financial transaction.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select value={newTransaction.type} onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'income' | 'expense' })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" required>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <input type="text" placeholder="Category" value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <input type="text" placeholder="Description" value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({"\u20b1"}) *</label>
                <input type="number" step="0.01" placeholder="0.00" value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={newTransaction.transaction_date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" required />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <button type="button" onClick={() => setShowAddTransaction(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Save Transaction</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
