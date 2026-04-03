import { useState, useEffect } from 'react';
import { X, HelpCircle, Send, ChevronDown, ChevronUp, BookOpen, MessageSquarePlus, Clock, Phone, Mail, Tag } from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  general:    { label: 'General',                color: 'text-slate-700',   bg: 'bg-slate-100' },
  booking:    { label: 'Booking & Reservations', color: 'text-emerald-800', bg: 'bg-emerald-50' },
  facilities: { label: 'Facilities & Amenities', color: 'text-amber-800',   bg: 'bg-amber-50' },
  payment:    { label: 'Payment',                color: 'text-blue-800',    bg: 'bg-blue-50' },
  policies:   { label: 'Policies',              color: 'text-rose-800',    bg: 'bg-rose-50' },
};

export default function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'inquiry'>('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: '', category: 'general'
  });

  useEffect(() => {
    if (isOpen) fetchFAQs();
  }, [isOpen]);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/faqs');
      const data = await res.json();
      if (data.success) setFaqs(data.faqs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '', category: 'general' });
        setTimeout(() => { setActiveTab('faq'); setSubmitStatus('idle'); }, 3000);
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const groupedFAQs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  if (!isOpen) return null;

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3d6b4f] focus:border-transparent transition-all bg-gray-50 focus:bg-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh', height: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex-shrink-0 bg-[#2d5240] text-white rounded-t-2xl">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <HelpCircle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight">Help Center</h2>
                <p className="text-xs text-white/70 mt-0.5">Find answers or send us a message</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 pb-0 gap-1">
            <button
              onClick={() => setActiveTab('faq')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all ${
                activeTab === 'faq'
                  ? 'bg-white text-[#2d5240]'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen size={15} />
              FAQs ({faqs.length})
            </button>
            <button
              onClick={() => setActiveTab('inquiry')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all ${
                activeTab === 'inquiry'
                  ? 'bg-white text-[#2d5240]'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquarePlus size={15} />
              Ask Us
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50">

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="p-5 space-y-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-[#2d5240] rounded-full animate-spin mb-3" />
                  <p className="text-sm">Loading FAQs...</p>
                </div>
              ) : Object.keys(groupedFAQs).length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <HelpCircle size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No FAQs available yet</p>
                </div>
              ) : (
                Object.entries(groupedFAQs).map(([cat, items]) => {
                  const cfg = CATEGORY_CONFIG[cat] ?? { label: cat, color: 'text-gray-700', bg: 'bg-gray-100' };
                  return (
                    <div key={cat}>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </div>
                      <div className="space-y-2">
                        {items.map(faq => (
                          <div
                            key={faq.id}
                            className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                              expandedFAQ === faq.id ? 'border-[#2d5240]/30 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <button
                              onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                              className="w-full px-4 py-3.5 flex items-center justify-between text-left gap-3 bg-white text-gray-900"
                            >
                              <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                              <span className="flex-shrink-0 text-gray-400">
                                {expandedFAQ === faq.id
                                  ? <ChevronUp size={16} className="text-[#2d5240]" />
                                  : <ChevronDown size={16} />}
                              </span>
                            </button>
                            {expandedFAQ === faq.id && (
                              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                                <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Inquiry Tab */}
          {activeTab === 'inquiry' && (
            <div className="p-5">
              {submitStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <Send size={28} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Thanks for reaching out. We'll respond to your email within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  {submitStatus === 'error' && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      Something went wrong. Please try again.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex text-xs font-semibold text-gray-600 mb-1.5 items-center gap-1">
                        <span>Full Name</span><span className="text-red-400">*</span>
                      </label>
                      <input type="text" required placeholder="Juan dela Cruz"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="flex text-xs font-semibold text-gray-600 mb-1.5 items-center gap-1">
                        <Mail size={12} /><span>Email</span><span className="text-red-400">*</span>
                      </label>
                      <input type="email" required placeholder="juan@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex text-xs font-semibold text-gray-600 mb-1.5 items-center gap-1">
                        <Phone size={12} /><span>Phone</span><span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input type="tel" placeholder="+63 912 345 6789"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="flex text-xs font-semibold text-gray-600 mb-1.5 items-center gap-1">
                        <Tag size={12} /><span>Category</span>
                      </label>
                      <select value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className={inputCls}>
                        <option value="general">General Inquiry</option>
                        <option value="booking">Booking & Reservations</option>
                        <option value="facilities">Facilities & Amenities</option>
                        <option value="payment">Payment</option>
                        <option value="policies">Policies</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <input type="text" required placeholder="How can we help you?"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className={inputCls} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea required rows={5} placeholder="Please provide details about your inquiry..."
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className={`${inputCls} resize-none`} />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#2d5240] hover:bg-[#3d6b4f] text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-60"
                  >
                    <Send size={16} />
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <Clock size={12} /> We typically respond within 24 hours
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
