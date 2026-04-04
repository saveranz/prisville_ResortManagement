import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus, Minus, DollarSign, TrendingUp, TrendingDown, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: string;
  transaction_date: string;
  created_at: string;
}

export default function ReceptionistInventory() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryItemsPerPage = 20;
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const navigate = useNavigate();

  // Transaction filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'income' | 'expense',
    category: 'all',
    startDate: '',
    endDate: ''
  });
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');

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

  useEffect(() => {
    checkAuth();
    fetchInventory();
    fetchTransactions();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json();
      
      // Enforce receptionist-only access (admin uses separate dashboard)
      if (!data.success || data.user.role !== 'receptionist') {
        navigate('/');
      }
    } catch (error) {
      // Redirect on auth error
      navigate('/');
    }
  };

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
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/transactions', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
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
        setShowAddItem(false);
        setNewItem({ item_name: '', category: '', quantity: '', unit: '', unit_price: '' });
        fetchInventory();
      } else {
        alert('Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
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
        setNewTransaction({
          type: 'income',
          category: '',
          description: '',
          amount: '',
          transaction_date: new Date().toISOString().split('T')[0]
        });
        fetchTransactions();
      } else {
        alert('Failed to add transaction');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  const updateQuantity = async (id: number, change: number) => {
    try {
      const response = await fetch('/api/inventory/update-quantity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: id, change })
      });

      const data = await response.json();
      if (data.success) {
        fetchInventory();
      } else {
        alert('Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity');
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

  const calculateTotals = () => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        const amount = parseFloat(t.amount.replace(/[₱,]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        const amount = parseFloat(t.amount.replace(/[₱,]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    return { income, expenses, profit: income - expenses };
  };

  const totals = calculateTotals();

  const clearFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.category !== 'all' || filters.startDate || filters.endDate;

  // Calculate total price for new item
  const calculatedTotal = useMemo(() => {
    const qty = parseFloat(newItem.quantity) || 0;
    const price = parseFloat(newItem.unit_price) || 0;
    return qty * price;
  }, [newItem.quantity, newItem.unit_price]);

  // Format price without .00 if not needed
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price.replace(/[₱,]/g, ''));
    return numPrice % 1 === 0 ? numPrice.toLocaleString() : numPrice.toLocaleString();
  };

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
  }, [filteredInventory, inventoryPage]);

  const totalInventoryPages = Math.ceil(filteredInventory.length / inventoryItemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/receptionist/dashboard')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">₱{totals.income.toLocaleString()}</p>
              </div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">₱{totals.expenses.toLocaleString()}</p>
              </div>
              <TrendingDown className="text-red-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ₱{totals.profit.toLocaleString()}
                </p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package size={20} />
              Inventory Items
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign size={20} />
              Transactions
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={inventorySearchTerm}
                  onChange={(e) => {
                    setInventorySearchTerm(e.target.value);
                    setInventoryPage(1); // Reset to first page on search
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowAddItem(!showAddItem)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Item
                </button>
              </div>
            </div>

            {showAddItem && (
              <Dialog open={showAddItem} onOpenChange={(open) => { setShowAddItem(open); if (!open) setNewItem({ item_name: '', category: '', quantity: '', unit: '', unit_price: '' }); }}>
                <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
                      <Plus className="text-blue-600" size={24} />
                      Add New Item
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Fill in the details for the new inventory item.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddItem} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                        <input
                          type="text"
                          placeholder="Enter item name"
                          value={newItem.item_name}
                          onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <input
                            type="text"
                            placeholder="e.g., Toiletries"
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                          <input
                            type="text"
                            placeholder="pcs, kg, etc."
                            value={newItem.unit}
                            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₱)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newItem.unit_price}
                            onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    {(newItem.quantity && newItem.unit_price) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Calculated Total Value:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            ₱{calculatedTotal.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {newItem.quantity} × ₱{parseFloat(newItem.unit_price).toLocaleString()} = Total Value
                        </p>
                      </div>
                    )}
                    
                    <DialogFooter className="gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowAddItem(false); setNewItem({ item_name: '', category: '', quantity: '', unit: '', unit_price: '' }); }}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                        Save Item
                      </button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-50 border-b-2 border-amber-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Total Value</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Date Added</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 text-sm font-semibold text-black">{item.item_name}</td>
                      <td className="px-6 py-4 text-sm text-black">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-black">{item.quantity} {item.unit}</td>
                      <td className="px-6 py-4 text-sm text-black">₱{formatPrice(item.unit_price)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-black">
                        ₱{(item.quantity * parseFloat(item.unit_price.replace(/[₱,]/g, ''))).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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
            
            {/* Pagination Controls */}
            {totalInventoryPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((inventoryPage - 1) * inventoryItemsPerPage) + 1} to {Math.min(inventoryPage * inventoryItemsPerPage, filteredInventory.length)} of {filteredInventory.length} items
                  {inventorySearchTerm && ` (filtered from ${inventory.length} total)`}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInventoryPage(prev => Math.max(1, prev - 1))}
                    disabled={inventoryPage === 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalInventoryPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setInventoryPage(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          pageNum === inventoryPage
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setInventoryPage(prev => Math.min(totalInventoryPages, prev + 1))}
                    disabled={inventoryPage === totalInventoryPages}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Financial Transactions</h2>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={transactionSearchTerm}
                  onChange={(e) => setTransactionSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    showFilters || hasActiveFilters
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter size={20} />
                  Filters {hasActiveFilters && `(${Object.values(filters).filter(v => v && v !== 'all').length})`}
                </button>
                <button
                  onClick={() => setShowAddTransaction(!showAddTransaction)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
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
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <X size={16} />
                      Clear All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value as 'all' | 'income' | 'expense' })}
                      className="w-full px-4 py-2 border rounded-lg text-gray-900"
                    >
                      <option value="all">All Types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg text-gray-900"
                    >
                      <option value="all">All Categories</option>
                      {uniqueCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg text-gray-900"
                    />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> of <span className="font-semibold text-gray-900">{transactions.length}</span> transactions
                </div>
              </div>
            )}            

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
                <thead className="bg-amber-50 border-b-2 border-amber-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No transactions found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 text-sm font-semibold text-black">
                        {new Date(transaction.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-black">{transaction.category}</td>
                      <td className="px-6 py-4 text-sm text-black">{transaction.description}</td>
                      <td className={`px-6 py-4 text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{transaction.amount}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
