import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, Clock, CheckCircle, XCircle, Send, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  response?: string;
  responder_name?: string;
  responded_at?: string;
  created_at: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_active: boolean;
}

export default function AdminInquiries() {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'faqs'>('inquiries');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState('all');

  // FAQ form state
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchInquiries();
    fetchFAQs();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await fetch('/api/admin/inquiries', { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setInquiries(data.inquiries);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/admin/faqs', { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setFAQs(data.faqs);
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    }
  };

  const handleRespondToInquiry = async () => {
    if (!selectedInquiry || !response.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/inquiries/${selectedInquiry.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ response })
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Response sent successfully!' });
        setResponse('');
        setSelectedInquiry(null);
        fetchInquiries();
      } else {
        setMessage({ type: 'error', text: 'Failed to send response' });
      }
    } catch (error) {
      console.error('Failed to respond:', error);
      setMessage({ type: 'error', text: 'Failed to send response' });
    } finally {
      setSubmitting(false);
    }
  };

  const updateInquiryStatus = async (inquiryId: number, status: string, priority?: string) => {
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, priority })
      });

      if (response.ok) {
        fetchInquiries();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSaveFAQ = async () => {
    setSubmitting(true);
    setMessage(null);

    try {
      const url = editingFAQ 
        ? `/api/admin/faqs/${editingFAQ.id}`
        : '/api/admin/faqs';
      const method = editingFAQ ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(faqForm)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingFAQ ? 'FAQ updated!' : 'FAQ created!' });
        setFaqForm({ question: '', answer: '', category: 'general', display_order: 0, is_active: true });
        setEditingFAQ(null);
        fetchFAQs();
      } else {
        setMessage({ type: 'error', text: 'Failed to save FAQ' });
      }
    } catch (error) {
      console.error('Failed to save FAQ:', error);
      setMessage({ type: 'error', text: 'Failed to save FAQ' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFAQ = async (faqId: number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetch(`/api/admin/faqs/${faqId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'FAQ deleted successfully' });
        fetchFAQs();
      }
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
      setMessage({ type: 'error', text: 'Failed to delete FAQ' });
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    if (filter === 'all') return true;
    return inquiry.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 text-gray-600',
      normal: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    };
    return styles[priority as keyof typeof styles] || styles.normal;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-gray-900">Inquiries & FAQ Management</h2>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <AlertCircle size={20} />
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
            activeTab === 'inquiries'
              ? 'bg-gradient-to-r from-primary to-accent text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Guest Inquiries ({inquiries.length})
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
            activeTab === 'faqs'
              ? 'bg-gradient-to-r from-primary to-accent text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Manage FAQs ({faqs.length})
        </button>
      </div>

      {/* Inquiries Tab */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {['all', 'pending', 'in_progress', 'resolved', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {/* Inquiries List */}
          <div className="bg-white rounded-xl shadow-md">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading inquiries...</div>
            ) : filteredInquiries.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No inquiries found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{inquiry.subject}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(inquiry.status)}`}>
                            {inquiry.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(inquiry.priority)}`}>
                            {inquiry.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          From: {inquiry.name} ({inquiry.email})
                          {inquiry.phone && ` • ${inquiry.phone}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(inquiry.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedInquiry(selectedInquiry?.id === inquiry.id ? null : inquiry)}
                        className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 text-sm"
                      >
                        {selectedInquiry?.id === inquiry.id ? 'Close' : 'View'}
                      </button>
                    </div>

                    {selectedInquiry?.id === inquiry.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                          <p className="text-gray-700">{inquiry.message}</p>
                        </div>

                        {inquiry.response && (
                          <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Response</label>
                            <p className="text-gray-700">{inquiry.response}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Responded by {inquiry.responder_name} on {inquiry.responded_at && new Date(inquiry.responded_at).toLocaleString()}
                            </p>
                          </div>
                        )}

                        {inquiry.status !== 'resolved' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Send Response</label>
                            <textarea
                              value={response}
                              onChange={(e) => setResponse(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="Type your response..."
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={handleRespondToInquiry}
                                disabled={submitting || !response.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                              >
                                <Send size={16} />
                                {submitting ? 'Sending...' : 'Send Response'}
                              </button>
                              <select
                                value={inquiry.status}
                                onChange={(e) => updateInquiryStatus(inquiry.id, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          {/* FAQ Form */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="booking">Booking & Reservations</option>
                  <option value="facilities">Facilities & Amenities</option>
                  <option value="payment">Payment</option>
                  <option value="policies">Policies</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={faqForm.display_order}
                  onChange={(e) => setFaqForm({ ...faqForm, display_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                type="text"
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter the question..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
              <textarea
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Enter the answer..."
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={faqForm.is_active}
                  onChange={(e) => setFaqForm({ ...faqForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Active (Visible to guests)</span>
              </label>
              <div className="flex-1"></div>
              {editingFAQ && (
                <button
                  onClick={() => {
                    setEditingFAQ(null);
                    setFaqForm({ question: '', answer: '', category: 'general', display_order: 0, is_active: true });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveFAQ}
                disabled={submitting || !faqForm.question || !faqForm.answer}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                <Plus size={18} />
                {submitting ? 'Saving...' : (editingFAQ ? 'Update FAQ' : 'Add FAQ')}
              </button>
            </div>
          </div>

          {/* FAQs List */}
          <div className="bg-white rounded-xl shadow-md divide-y divide-gray-200">
            {faqs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No FAQs yet</div>
            ) : (
              faqs.map((faq) => (
                <div key={faq.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                          {faq.category}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                          Order: {faq.display_order}
                        </span>
                        {faq.is_active ? (
                          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                            <Eye size={12} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-500 rounded">
                            <EyeOff size={12} /> Hidden
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-sm text-gray-600">{faq.answer}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingFAQ(faq);
                          setFaqForm({
                            question: faq.question,
                            answer: faq.answer,
                            category: faq.category,
                            display_order: faq.display_order,
                            is_active: faq.is_active
                          });
                        }}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteFAQ(faq.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
