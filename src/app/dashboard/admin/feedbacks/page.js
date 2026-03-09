// src/app/dashboard/admin/feedbacks/page.js
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { checkIsAdmin } from '@/lib/adminUtils';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDate, formatDateTime } from '@/lib/dateUtils';
import { ToastContainer } from '@/components/ToastNotification';
import { useToast } from '@/hooks/useToast';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  MessageSquare, Star, StickyNote, CheckCircle, Trash2, Mail,
  Calendar, X, Save, Search, Filter, RefreshCw, Shield,
  ChevronDown, ChevronUp, ArrowLeft, Eye, EyeOff, BarChart2,
  Download, Users, TrendingUp, XCircle
} from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color = 'gray', sub }) {
  const colors = {
    gray:   'bg-gray-50   border-gray-200   text-gray-600',
    blue:   'bg-blue-50   border-blue-200   text-blue-600',
    green:  'bg-green-50  border-green-200  text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <div className="opacity-70">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

// ─── Rating Stars ─────────────────────────────────────────────────────────────
function RatingStars({ rating = 0 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'resolved')
    return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Resolved</span>;
  return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">New</span>;
}

// ─── Type Badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const map = {
    bug:         'bg-red-100 text-red-700',
    feature:     'bg-blue-100 text-blue-700',
    general:     'bg-gray-100 text-gray-700',
    complaint:   'bg-orange-100 text-orange-700',
    compliment:  'bg-emerald-100 text-emerald-700',
  };
  const cls = map[type?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${cls}`}>
      {type || 'Feedback'}
    </span>
  );
}

// ─── Notes Modal ─────────────────────────────────────────────────────────────
function NotesModal({ item, onClose, onSave }) {
  const [notes, setNotes] = useState(item?.adminNotes || '');
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-purple-600" /> Admin Notes
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm">
            <p className="text-xs text-gray-400 mb-1 font-medium">Feedback from {item?.userName}</p>
            <p className="text-gray-700 leading-relaxed">{item?.message}</p>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add internal notes (only visible to admins)…"
            rows={5}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => onSave(notes)}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ item, onClose, onResolve, onFeature, onOpenNotes, onDelete }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-bold text-gray-900">Feedback Detail</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status & badges */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            <TypeBadge type={item.type} />
            {item.featured && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> Featured
              </span>
            )}
            {item.adminNotes && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <StickyNote className="w-3 h-3" /> Has Notes
              </span>
            )}
          </div>

          {/* Rating */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1.5">Rating</p>
            <RatingStars rating={item.rating} />
          </div>

          {/* User info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <p className="text-xs text-gray-400 font-medium mb-2">Submitted by</p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{item.userName || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="break-all">{item.userEmail || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateTime(item.createdAt)}</span>
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Message</p>
            <p className="text-sm text-gray-800 leading-relaxed bg-white border border-gray-200 rounded-xl p-4">
              {item.message}
            </p>
          </div>

          {/* Admin notes */}
          {item.adminNotes && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">Admin Notes</p>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-800 leading-relaxed">
                {item.adminNotes}
              </div>
              {item.notesUpdatedAt && (
                <p className="text-xs text-gray-400 mt-1">Updated {formatDateTime(item.notesUpdatedAt)}</p>
              )}
            </div>
          )}

          {/* Resolution info */}
          {item.status === 'resolved' && item.resolvedAt && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-xs text-green-700 font-medium">
                ✓ Resolved on {formatDateTime(item.resolvedAt)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {item.status === 'new' && (
              <button onClick={() => onResolve(item)}
                className="flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Resolve
              </button>
            )}
            {item.status === 'resolved' && (
              <button onClick={() => onResolve(item)}
                className="flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium">
                <XCircle className="w-4 h-4" /> Re-open
              </button>
            )}
            <button onClick={() => onFeature(item)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border ${
                item.featured
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}>
              <Star className={`w-4 h-4 ${item.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {item.featured ? 'Unfeature' : 'Feature'}
            </button>
            <button onClick={() => onOpenNotes(item)}
              className="flex items-center justify-center gap-2 py-2.5 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 rounded-xl text-sm font-medium">
              <StickyNote className="w-4 h-4" /> Notes
            </button>
            <button onClick={() => onDelete(item)}
              className="flex items-center justify-center gap-2 py-2.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-xl text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminFeedbacksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [feedback, setFeedback]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);

  // filters
  const [search, setSearch]                 = useState('');
  const [filterStatus, setFilterStatus]     = useState('all');   // all | new | resolved
  const [filterType, setFilterType]         = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');   // all | featured | not_featured
  const [filterRating, setFilterRating]     = useState('all');   // all | 1-5
  const [sortBy, setSortBy]                 = useState('newest'); // newest | oldest | rating_high | rating_low
  const [showFilters, setShowFilters]       = useState(false);

  // modals / drawers
  const [selectedItem, setSelectedItem]     = useState(null);   // detail drawer
  const [notesItem, setNotesItem]           = useState(null);   // notes modal
  const [confirmDialog, setConfirmDialog]   = useState({ isOpen: false });

  // ── Admin guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    const isAdmin = await checkIsAdmin(user.uid);
    if (!isAdmin) {
      addToast('Access denied. Admin only.', 'error');
      router.push('/dashboard');
      return;
    }
    loadFeedback();
  };

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadFeedback = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const allFeedback = [];
      const usersSnap = await getDocs(collection(db, 'users'));

      for (const userDoc of usersSnap.docs) {
        const fbRef   = collection(db, 'users', userDoc.id, 'feedback');
        const fbSnap  = await getDocs(query(fbRef, orderBy('createdAt', 'desc')));
        fbSnap.forEach(fbDoc => {
          allFeedback.push({
            id: fbDoc.id,
            userId: userDoc.id,
            ...fbDoc.data(),
          });
        });
      }

      // Sort newest first
      allFeedback.sort((a, b) => {
        const da = a.createdAt?.toDate?.() || new Date(0);
        const db_ = b.createdAt?.toDate?.() || new Date(0);
        return db_ - da;
      });

      setFeedback(allFeedback);
    } catch (err) {
      addToast('Error loading feedback: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    feedback.length,
    newCount: feedback.filter(f => f.status === 'new').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
    featured: feedback.filter(f => f.featured).length,
    avgRating: feedback.length
      ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length).toFixed(1)
      : '—',
  }), [feedback]);

  // ── Filtered + sorted list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...feedback];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.message?.toLowerCase().includes(q) ||
        f.userName?.toLowerCase().includes(q) ||
        f.userEmail?.toLowerCase().includes(q) ||
        f.adminNotes?.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all')   list = list.filter(f => f.status === filterStatus);
    if (filterType !== 'all')     list = list.filter(f => (f.type || 'general').toLowerCase() === filterType);
    if (filterFeatured === 'featured')     list = list.filter(f => f.featured);
    if (filterFeatured === 'not_featured') list = list.filter(f => !f.featured);
    if (filterRating !== 'all')   list = list.filter(f => f.rating === Number(filterRating));

    switch (sortBy) {
      case 'oldest':      list.sort((a, b) => (a.createdAt?.toDate?.() || 0) - (b.createdAt?.toDate?.() || 0)); break;
      case 'rating_high': list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'rating_low':  list.sort((a, b) => (a.rating || 0) - (b.rating || 0)); break;
      default:            list.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
    }

    return list;
  }, [feedback, search, filterStatus, filterType, filterFeatured, filterRating, sortBy]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const toggleResolved = async (item) => {
    try {
      const ref = doc(db, 'users', item.userId, 'feedback', item.id);
      const next = item.status === 'resolved' ? 'new' : 'resolved';
      await updateDoc(ref, {
        status: next,
        ...(next === 'resolved'
          ? { resolvedAt: new Date(), resolvedBy: user.uid }
          : { resolvedAt: null }),
      });
      addToast(next === 'resolved' ? 'Marked as resolved' : 'Re-opened', 'success');
      setSelectedItem(prev => prev?.id === item.id ? { ...prev, status: next } : prev);
      loadFeedback(true);
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  const toggleFeatured = async (item) => {
    try {
      const ref = doc(db, 'users', item.userId, 'feedback', item.id);
      const next = !item.featured;
      await updateDoc(ref, { featured: next, featuredAt: next ? new Date() : null });
      addToast(next ? 'Featured on landing page' : 'Removed from landing page', 'success');
      setSelectedItem(prev => prev?.id === item.id ? { ...prev, featured: next } : prev);
      loadFeedback(true);
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  const saveNotes = async (notes) => {
    if (!notesItem) return;
    try {
      const ref = doc(db, 'users', notesItem.userId, 'feedback', notesItem.id);
      await updateDoc(ref, { adminNotes: notes, notesUpdatedAt: new Date(), notesUpdatedBy: user.uid });
      addToast('Notes saved', 'success');
      setNotesItem(null);
      setSelectedItem(prev => prev?.id === notesItem.id ? { ...prev, adminNotes: notes } : prev);
      loadFeedback(true);
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  const confirmDelete = (item) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Feedback',
      message: 'This will permanently delete this feedback entry. This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', item.userId, 'feedback', item.id));
          addToast('Feedback deleted', 'success');
          setSelectedItem(null);
          loadFeedback(true);
        } catch (err) { addToast('Error: ' + err.message, 'error'); }
      },
    });
  };

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!filtered.length) { addToast('No feedback to export', 'error'); return; }
    const headers = ['Date', 'User', 'Email', 'Type', 'Rating', 'Status', 'Featured', 'Message', 'Admin Notes'];
    const rows = filtered.map(f => [
      formatDate(f.createdAt),
      f.userName || '',
      f.userEmail || '',
      f.type || '',
      f.rating || '',
      f.status || '',
      f.featured ? 'Yes' : 'No',
      (f.message || '').replace(/"/g, '""'),
      (f.adminNotes || '').replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast(`Exported ${filtered.length} entries`, 'success');
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading feedback…</p>
        </div>
      </div>
    );
  }

  // ── Unique types for filter dropdown ─────────────────────────────────────────
  const feedbackTypes = ['all', ...new Set(feedback.map(f => (f.type || 'general').toLowerCase()))];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/admin')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Feedback Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {stats.total} total · {stats.newCount} unresolved
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadFeedback(true)} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total"    value={stats.total}    icon={<MessageSquare className="w-4 h-4" />} color="gray" />
        <StatCard label="New"      value={stats.newCount} icon={<TrendingUp    className="w-4 h-4" />} color="orange"
          sub={stats.total ? `${Math.round(stats.newCount / stats.total * 100)}% of total` : ''} />
        <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle  className="w-4 h-4" />} color="green" />
        <StatCard label="Featured" value={stats.featured} icon={<Star         className="w-4 h-4" />} color="yellow" />
        <StatCard label="Avg Rating" value={stats.avgRating} icon={<BarChart2 className="w-4 h-4" />} color="blue" />
      </div>

      {/* ── Search & Filters ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search messages, names, emails, notes…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              showFilters ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 border-t border-gray-100">
            {/* Status */}
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            {/* Type */}
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Type</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none capitalize">
                {feedbackTypes.map(t => (
                  <option key={t} value={t} className="capitalize">{t === 'all' ? 'All' : t}</option>
                ))}
              </select>
            </div>
            {/* Featured */}
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Featured</label>
              <select value={filterFeatured} onChange={e => setFilterFeatured(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                <option value="all">All</option>
                <option value="featured">Featured only</option>
                <option value="not_featured">Not featured</option>
              </select>
            </div>
            {/* Rating */}
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Rating</label>
              <select value={filterRating} onChange={e => setFilterRating(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                <option value="all">All ratings</option>
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </div>
            {/* Sort */}
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Sort by</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="rating_high">Highest rating</option>
                <option value="rating_low">Lowest rating</option>
              </select>
            </div>
          </div>
        )}

        {/* Active filter summary */}
        {(filterStatus !== 'all' || filterType !== 'all' || filterFeatured !== 'all' || filterRating !== 'all' || search) && (
          <div className="flex items-center justify-between pt-1 text-xs text-gray-500 border-t border-gray-100">
            <span>Showing <strong className="text-gray-900">{filtered.length}</strong> of {stats.total} results</span>
            <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterType('all'); setFilterFeatured('all'); setFilterRating('all'); }}
              className="text-blue-600 hover:underline font-medium">Clear all</button>
          </div>
        )}
      </div>

      {/* ── Feedback List ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No feedback found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filtered.map(item => (
            <div key={`${item.userId}-${item.id}`}
              className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex flex-col md:flex-row md:items-start gap-4">

                {/* Left: content */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedItem(item)}>
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <StatusBadge status={item.status} />
                    <TypeBadge type={item.type} />
                    <RatingStars rating={item.rating} />
                    {item.featured && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> Featured
                      </span>
                    )}
                    {item.adminNotes && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        <StickyNote className="w-3 h-3" /> Notes
                      </span>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mb-2">
                    <span className="font-medium text-gray-700">{item.userName || 'Unknown User'}</span>
                    <span className="text-gray-300">•</span>
                    <span className="break-all">{item.userEmail}</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{item.message}</p>

                  {/* Admin notes preview */}
                  {item.adminNotes && (
                    <div className="mt-2 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-700 line-clamp-1">
                      <span className="font-semibold">Note: </span>{item.adminNotes}
                    </div>
                  )}
                </div>

                {/* Right: action buttons */}
                <div className="flex md:flex-col items-center gap-2 flex-shrink-0">
                  <button onClick={() => setSelectedItem(item)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="View details">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleResolved(item)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.status === 'new'
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-orange-500 hover:bg-orange-50'
                    }`}
                    title={item.status === 'new' ? 'Mark resolved' : 'Re-open'}>
                    {item.status === 'new' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                  <button onClick={() => toggleFeatured(item)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.featured ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={item.featured ? 'Remove from landing page' : 'Feature on landing page'}>
                    <Star className={`w-4 h-4 ${item.featured ? 'fill-yellow-400' : ''}`} />
                  </button>
                  <button onClick={() => setNotesItem(item)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.adminNotes ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Add/edit admin notes">
                    <StickyNote className="w-4 h-4" />
                  </button>
                  <button onClick={() => confirmDelete(item)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      {selectedItem && (
        <DetailDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onResolve={toggleResolved}
          onFeature={toggleFeatured}
          onOpenNotes={(item) => { setNotesItem(item); }}
          onDelete={confirmDelete}
        />
      )}

      {/* ── Notes Modal ───────────────────────────────────────────────────── */}
      {notesItem && (
        <NotesModal
          item={notesItem}
          onClose={() => setNotesItem(null)}
          onSave={saveNotes}
        />
      )}

      {/* ── Confirm Dialog ────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
      />

      {/* ── Toasts ────────────────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}