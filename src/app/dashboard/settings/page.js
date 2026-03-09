// src/app/dashboard/settings/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { generateId } from '@/lib/firestoreCollections';
import { getCurrentSubscription, getUserSubscriptionHistory } from '@/lib/subscriptionUtils';
import {
  User, Download, Trash2, AlertTriangle, CheckCircle, FileText, Database,
  LogOut, Upload, Palette, DollarSign, Settings as SettingsIcon, CreditCard,
  Calendar, ChevronDown, ChevronUp, Filter, Package, X, Check
} from 'lucide-react';

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-6 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium max-w-sm
      ${type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
      {type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
    </div>
  );
}

// ─── All exportable collections ───────────────────────────────────────────────
const ALL_COLLECTIONS = [
  { key: 'accounts',          label: 'Accounts',           icon: '🏦', hasDate: false },
  { key: 'transactions',      label: 'Transactions',        icon: '💳', hasDate: true  },
  { key: 'transfers',         label: 'Transfers',           icon: '↔️',  hasDate: true  },
  { key: 'categories',        label: 'Categories',          icon: '🏷️',  hasDate: false },
  { key: 'zakatCycles',       label: 'Zakat Cycles',        icon: '🕌', hasDate: false },
  { key: 'zakatPayments',     label: 'Zakat Payments',      icon: '💰', hasDate: false },
  { key: 'lendings',          label: 'Lendings',            icon: '🤝', hasDate: false },
  { key: 'loans',             label: 'Loans',               icon: '📋', hasDate: false },
  { key: 'investments',       label: 'Investments',         icon: '📈', hasDate: false },
  { key: 'goals',             label: 'Goals',               icon: '🎯', hasDate: false },
  { key: 'jewellery',         label: 'Jewellery',           icon: '💎', hasDate: false },
  { key: 'ribaTransactions',  label: 'Riba Transactions',   icon: '⚠️',  hasDate: true  },
  { key: 'financialGoals',    label: 'Financial Goals',     icon: '🏆', hasDate: false },
  { key: 'settings',          label: 'Settings',            icon: '⚙️',  hasDate: false },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const themeContext = useTheme();
  const router = useRouter();

  const [loading,          setLoading]          = useState(false);
  const [displayName,      setDisplayName]      = useState('');
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [deleteConfirm,    setDeleteConfirm]    = useState('');
  const [toast,            setToast]            = useState(null);

  // Subscription
  const [currentSubscription,  setCurrentSubscription]  = useState(null);
  const [subscriptionHistory,  setSubscriptionHistory]  = useState([]);
  const [showSubHistory,       setShowSubHistory]        = useState(false);

  // Preferences
  const [theme,      setTheme]      = useState(themeContext?.theme || 'light');
  const [currency,   setCurrency]   = useState('BDT');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [language,   setLanguage]   = useState(themeContext?.language || 'en');

  // Export UI state
  const [exportMode,       setExportMode]       = useState(null); // null | 'all' | 'selective' | 'daterange'
  const [selectedCols,     setSelectedCols]     = useState(ALL_COLLECTIONS.map(c => c.key));
  const [exportFormat,     setExportFormat]     = useState('json'); // 'json' | 'csv'
  const [dateFrom,         setDateFrom]         = useState('');
  const [dateTo,           setDateTo]           = useState('');

  // ── helpers ──────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => setToast({ message, type });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const calculateFinalEndDate = (history) => {
    if (!history?.length) return null;
    const active = history.filter(s => s.status === 'active' || s.status === 'pending_approval');
    if (!active.length) return null;
    return active.sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0].endDate;
  };

  const hasPendingExtensions   = (h) => h?.some(s => s.status === 'pending_approval' && s.isExtension);
  const getPendingCount        = (h) => h?.filter(s => s.status === 'pending_approval' && s.isExtension).length ?? 0;

  // ── data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      loadPreferences();
      loadSubscriptionData();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'settings'));
      if (!snap.empty) {
        snap.forEach(d => {
          const data = d.data();
          if (data.theme)      setTheme(data.theme);
          if (data.currency)   setCurrency(data.currency);
          if (data.dateFormat) setDateFormat(data.dateFormat);
          if (data.language)   setLanguage(data.language);
        });
      }
    } catch (e) { console.error(e); }
  };

  const loadSubscriptionData = async () => {
    try {
      const sub = await getCurrentSubscription(user.uid);
      if (sub.success && sub.subscription) setCurrentSubscription(sub.subscription);
      const hist = await getUserSubscriptionHistory(user.uid);
      if (hist.success) setSubscriptionHistory(hist.subscriptions);
    } catch (e) { console.error(e); }
  };

  // ── profile ───────────────────────────────────────────────────────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      showToast('Profile updated successfully!');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
    finally { setLoading(false); }
  };

  // ── preferences ───────────────────────────────────────────────────────────
  const savePreferences = async () => {
    setLoading(true);
    try {
      const settingsRef  = collection(db, 'users', user.uid, 'settings');
      const snap         = await getDocs(settingsRef);
      const preferences  = { theme, currency, dateFormat, language, updatedAt: serverTimestamp() };
      if (snap.empty) {
        await addDoc(settingsRef, preferences);
      } else {
        for (const d of snap.docs)
          await updateDoc(doc(db, 'users', user.uid, 'settings', d.id), preferences);
      }
      localStorage.setItem('theme', theme);
      localStorage.setItem('language', language);
      localStorage.setItem('currency', currency);
      localStorage.setItem('dateFormat', dateFormat);
      document.documentElement.setAttribute('data-theme', theme);
      themeContext?.updateTheme?.(theme);
      themeContext?.updateLanguage?.(language);
      showToast('Preferences saved! Refreshing…');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
    finally { setLoading(false); }
  };

  // ── EXPORT ────────────────────────────────────────────────────────────────

  /** Fetch one collection, optionally filtered by date range on the `date` field */
  const fetchCollection = async (colKey, fromDate, toDate) => {
    const colRef = collection(db, 'users', user.uid, colKey);
    const snap   = await getDocs(colRef);
    let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // For jewellery, embed the nested priceHistory sub-collection
    if (colKey === 'jewellery') {
      docs = await Promise.all(docs.map(async (item) => {
        try {
          const subSnap = await getDocs(
            collection(db, 'users', user.uid, 'jewellery', item.id, 'priceHistory')
          );
          return {
            ...item,
            priceHistory: subSnap.docs.map(s => ({ id: s.id, ...s.data() })),
          };
        } catch { return item; }
      }));
    }

    const colMeta = ALL_COLLECTIONS.find(c => c.key === colKey);
    if (colMeta?.hasDate && (fromDate || toDate)) {
      docs = docs.filter(d => {
        const dateStr = d.date || d.startDate || '';
        if (!dateStr) return false;
        if (fromDate && dateStr < fromDate) return false;
        if (toDate   && dateStr > toDate)   return false;
        return true;
      });
    }
    return docs;
  };

  /** Convert array of objects to CSV string */
  const toCSV = (rows) => {
    if (!rows.length) return '';
    const keys    = [...new Set(rows.flatMap(r => Object.keys(r)))];
    const escape  = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header  = keys.map(escape).join(',');
    const lines   = rows.map(r => keys.map(k => escape(r[k])).join(','));
    return [header, ...lines].join('\n');
  };

  /** Trigger browser download */
  const downloadFile = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const runExport = async () => {
    if (!exportMode) return;
    setLoading(true);
    try {
      const fromDate = dateFrom || null;
      const toDate   = dateTo   || null;
      const colsToExport = exportMode === 'all'
        ? ALL_COLLECTIONS.map(c => c.key)
        : selectedCols;

      if (!colsToExport.length) {
        showToast('Select at least one data type to export.', 'error');
        setLoading(false); return;
      }

      const today = new Date().toISOString().split('T')[0];

      if (exportFormat === 'json') {
        // ── JSON export ──────────────────────────────────────────────────
        const payload = {
          exportDate:  new Date().toISOString(),
          exportedBy:  { email: user.email, displayName: user.displayName },
          dateFilter:  fromDate || toDate ? { from: fromDate, to: toDate } : 'none',
          collections: {},
        };
        for (const key of colsToExport) {
          payload.collections[key] = await fetchCollection(key, fromDate, toDate);
        }
        const totalRecords = Object.values(payload.collections).reduce((s, a) => s + a.length, 0);
        payload.totalRecords = totalRecords;

        downloadFile(
          JSON.stringify(payload, null, 2),
          `nisab-wallet-export-${today}.json`,
          'application/json'
        );
        showToast(`Exported ${totalRecords} records across ${colsToExport.length} collections.`);

      } else {
        // ── CSV export — one file per collection ─────────────────────────
        let exported = 0;
        for (const key of colsToExport) {
          const rows = await fetchCollection(key, fromDate, toDate);
          if (!rows.length) continue;
          const csv = toCSV(rows);
          downloadFile(csv, `${key}-${today}.csv`, 'text/csv');
          exported += rows.length;
          // small delay so browser doesn't block multiple downloads
          await new Promise(r => setTimeout(r, 300));
        }
        showToast(`Exported ${exported} records as CSV files.`);
      }
    } catch (err) { showToast('Export failed: ' + err.message, 'error'); }
    finally { setLoading(false); }
  };

  // ── IMPORT ────────────────────────────────────────────────────────────────
  const handleImportData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) { showToast('Please select a valid JSON file', 'error'); return; }
    if (!confirm('This will ADD the imported data alongside your existing data. Continue?')) {
      e.target.value = ''; return;
    }
    setLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Support both old format (data.accounts) and new format (data.collections.accounts)
      const cols = data.collections || {
        accounts:     data.accounts     || [],
        transactions: data.transactions || [],
        categories:   data.categories   || [],
        transfers:    data.transfers    || [],
      };

      let totals = {};
      for (const [key, rows] of Object.entries(cols)) {
        if (!Array.isArray(rows) || !rows.length) continue;
        let count = 0;
        for (const row of rows) {
          const { id, priceHistory, ...rest } = row; // strip old id & sub-collections
          const newRef = await addDoc(collection(db, 'users', user.uid, key), {
            ...rest,
            [`${key.replace(/s$/, '')}Id`]: generateId(),
            createdAt: serverTimestamp(),
          });
          // Restore jewellery priceHistory sub-collection
          if (key === 'jewellery' && Array.isArray(priceHistory) && priceHistory.length) {
            for (const ph of priceHistory) {
              const { id: phId, ...phRest } = ph;
              await addDoc(
                collection(db, 'users', user.uid, 'jewellery', newRef.id, 'priceHistory'),
                { ...phRest, createdAt: serverTimestamp() }
              );
            }
          }
          count++;
        }
        totals[key] = count;
      }

      const summary = Object.entries(totals).map(([k, v]) => `${k}: ${v}`).join(', ');
      showToast(`Imported — ${summary}`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) { showToast('Import failed: ' + err.message, 'error'); }
    finally { setLoading(false); e.target.value = ''; }
  };

  // ── DELETE ALL ────────────────────────────────────────────────────────────
  const handleDeleteWalletData = async () => {
    if (deleteConfirm !== 'DELETE') { showToast('Type DELETE to confirm', 'error'); return; }
    setLoading(true);
    try {
      // Every known top-level sub-collection under users/{uid}
      const topLevelCols = [
        'accounts', 'transactions', 'transfers', 'categories',
        'zakatCycles', 'zakatPayments',
        'lendings', 'loans',
        'investments', 'goals',
        'jewellery',
        'ribaTransactions',
        'financialGoals',
        'notifications',
        'settings',
      ];

      for (const colName of topLevelCols) {
        const snap = await getDocs(collection(db, 'users', user.uid, colName));
        // Delete any nested sub-collections first (jewellery → priceHistory)
        for (const docSnap of snap.docs) {
          if (colName === 'jewellery') {
            const subSnap = await getDocs(
              collection(db, 'users', user.uid, 'jewellery', docSnap.id, 'priceHistory')
            );
            await Promise.all(subSnap.docs.map(s => deleteDoc(s.ref)));
          }
          await deleteDoc(docSnap.ref);
        }
      }

      showToast('All wallet data deleted. Your login account is still active.');
      setShowDeleteModal(false);
      setDeleteConfirm('');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
    finally { setLoading(false); }
  };

  const currencies = [
    { code: 'BDT', symbol: '৳',   name: 'Bangladeshi Taka' },
    { code: 'USD', symbol: '$',   name: 'US Dollar' },
    { code: 'EUR', symbol: '€',   name: 'Euro' },
    { code: 'GBP', symbol: '£',   name: 'British Pound' },
    { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
    { code: 'SAR', symbol: 'SR',  name: 'Saudi Riyal' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  ];

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* ── Subscription ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
          </div>
          <button onClick={() => router.push('/dashboard/subscription')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            Extend Subscription
          </button>
        </div>

        {currentSubscription ? (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Current Plan</p>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{currentSubscription.planName}</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Expires: <strong>{formatDate(currentSubscription.endDate)}</strong></span>
                  </div>
                  {(() => {
                    const finalDate = calculateFinalEndDate(subscriptionHistory);
                    return finalDate && finalDate !== currentSubscription.endDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="text-purple-700 font-medium">
                          Final expiry: <strong>{formatDate(finalDate)}</strong>
                          {getPendingCount(subscriptionHistory) > 0 && (
                            <span className="text-xs ml-1 text-purple-500">({getPendingCount(subscriptionHistory)} pending)</span>
                          )}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Amount: <strong>৳{currentSubscription.amount?.toLocaleString() || 0}</strong></span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentSubscription.status === 'active' ? 'bg-green-100 text-green-800' :
                  currentSubscription.status === 'trial'  ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                  {currentSubscription.status === 'active' ? 'Active' :
                   currentSubscription.status === 'trial'  ? 'Trial' : currentSubscription.status}
                </span>
                {hasPendingExtensions(subscriptionHistory) && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Extension Pending</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-yellow-800">No active subscription. Click "Extend Subscription" to get started.</p>
          </div>
        )}

        {subscriptionHistory.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <button onClick={() => setShowSubHistory(!showSubHistory)}
              className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="text-sm font-medium text-gray-700">
                Subscription History ({subscriptionHistory.filter(s => s.amount > 0 || s.status === 'trial').length} records)
              </span>
              {showSubHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showSubHistory && (
              <div className="mt-3">
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-xl text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Plan','Status','Amount','Duration','Payment','Transaction ID','Start','End'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {subscriptionHistory
                        .filter(s => s.amount > 0 || s.status === 'trial')
                        .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt))
                        .map((sub, i) => (
                          <React.Fragment key={i}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{sub.planName}</span>
                                  {sub.isExtension && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Ext</span>}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  sub.status === 'active'           ? 'bg-green-100 text-green-800' :
                                  sub.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                  sub.status === 'rejected'         ? 'bg-red-100 text-red-800' :
                                  sub.status === 'trial'            ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-600'}`}>
                                  {sub.status === 'pending_approval' ? 'Pending' : sub.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 font-semibold text-gray-900">৳{sub.amount?.toLocaleString() || 0}</td>
                              <td className="px-3 py-3 text-gray-600 text-center">{sub.durationDays || 0}d</td>
                              <td className="px-3 py-3 text-gray-600">{sub.paymentMethod || '—'}</td>
                              <td className="px-3 py-3 font-mono text-xs text-gray-500">{sub.transactionId || '—'}</td>
                              <td className="px-3 py-3 text-gray-600">{formatDate(sub.startDate)}</td>
                              <td className="px-3 py-3 text-gray-600">{formatDate(sub.endDate)}</td>
                            </tr>
                            {sub.rejectionReason && (
                              <tr><td colSpan={8} className="px-3 py-2 bg-red-50 text-xs text-red-800"><strong>Reason:</strong> {sub.rejectionReason}</td></tr>
                            )}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {subscriptionHistory
                    .filter(s => s.amount > 0 || s.status === 'trial')
                    .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt))
                    .map((sub, i) => (
                      <div key={i} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-gray-900">{sub.planName}</span>
                              {sub.isExtension && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Ext</span>}
                            </div>
                            <div className="text-lg font-bold">৳{sub.amount?.toLocaleString() || 0}</div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            sub.status === 'active' ? 'bg-green-100 text-green-800' :
                            sub.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                            sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            sub.status === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                            {sub.status === 'pending_approval' ? 'Pending' : sub.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-3">
                          <div><p className="text-gray-400">Duration</p><p className="font-medium">{sub.durationDays || 0} days</p></div>
                          <div><p className="text-gray-400">Payment</p><p className="font-medium">{sub.paymentMethod || '—'}</p></div>
                          <div className="col-span-2"><p className="text-gray-400">Transaction ID</p><p className="font-mono text-[10px] break-all">{sub.transactionId || '—'}</p></div>
                          <div><p className="text-gray-400">Start</p><p className="font-medium">{formatDate(sub.startDate)}</p></div>
                          <div><p className="text-gray-400">End</p><p className="font-medium">{formatDate(sub.endDate)}</p></div>
                        </div>
                        {sub.rejectionReason && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-800">
                            <strong>Rejected:</strong> {sub.rejectionReason}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Profile ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} disabled={loading}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-medium disabled:bg-gray-400">
            {loading ? 'Updating…' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* ── App Preferences ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">App Preferences</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Theme', icon: <Palette className="w-4 h-4" />, value: theme, setter: setTheme,
              options: [['light','Light'],['dark','Dark'],['auto','Auto']] },
            { label: 'Currency', icon: <DollarSign className="w-4 h-4" />, value: currency, setter: setCurrency,
              options: currencies.map(c => [c.code, `${c.symbol} - ${c.name} (${c.code})`]) },
            { label: 'Date Format', icon: <Calendar className="w-4 h-4" />, value: dateFormat, setter: setDateFormat,
              options: [['DD/MM/YYYY','DD/MM/YYYY'],['MM/DD/YYYY','MM/DD/YYYY'],['YYYY-MM-DD','YYYY-MM-DD']] },
            { label: 'Language', icon: null, value: language, setter: setLanguage,
              options: [['en','English'],['bn','বাংলা (Bengali)'],['ar','العربية (Arabic)']] },
          ].map(({ label, icon, value, setter, options }) => (
            <div key={label}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                {icon}<span>{label}</span>
              </label>
              <select value={value} onChange={e => setter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          <button onClick={savePreferences} disabled={loading}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-medium disabled:bg-gray-400">
            {loading ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* ── Import ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Upload className="w-5 h-5 text-gray-700" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Import Data</h2>
            <p className="text-xs text-gray-400 mt-0.5">Supports both old and new export formats</p>
          </div>
        </div>
        <label htmlFor="import-file"
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
          <Upload className="w-10 h-10 text-gray-300" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Click to upload backup file</p>
            <p className="text-xs text-gray-400 mt-0.5">JSON files only · Adds data alongside existing records</p>
          </div>
          <input type="file" accept=".json" onChange={handleImportData} className="hidden" id="import-file" disabled={loading} />
        </label>
      </div>

      {/* ── Export ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Download className="w-5 h-5 text-gray-700" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
            <p className="text-xs text-gray-400 mt-0.5">Download your data in JSON or CSV format</p>
          </div>
        </div>

        {/* Export mode selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { id: 'all',       icon: <Database className="w-5 h-5" />,  title: 'Export All',       sub: 'Every collection, all records' },
            { id: 'selective', icon: <Package className="w-5 h-5" />,   title: 'Choose Data',      sub: 'Pick which collections to include' },
            { id: 'daterange', icon: <Filter className="w-5 h-5" />,    title: 'By Date Range',    sub: 'Filter transactions & transfers' },
          ].map(m => (
            <button key={m.id} onClick={() => setExportMode(exportMode === m.id ? null : m.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                exportMode === m.id
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
              <div className={`mt-0.5 flex-shrink-0 ${exportMode === m.id ? 'text-white' : 'text-gray-500'}`}>{m.icon}</div>
              <div>
                <p className="font-semibold text-sm">{m.title}</p>
                <p className={`text-xs mt-0.5 ${exportMode === m.id ? 'text-gray-300' : 'text-gray-400'}`}>{m.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Export panel */}
        {exportMode && (
          <div className="border border-gray-200 rounded-xl p-4 space-y-4">

            {/* Selective: collection checkboxes */}
            {exportMode === 'selective' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Select collections to export</p>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedCols(ALL_COLLECTIONS.map(c => c.key))}
                      className="text-xs text-blue-600 hover:underline">All</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => setSelectedCols([])}
                      className="text-xs text-gray-500 hover:underline">None</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_COLLECTIONS.map(col => {
                    const checked = selectedCols.includes(col.key);
                    return (
                      <button key={col.key}
                        onClick={() => setSelectedCols(prev => checked ? prev.filter(k => k !== col.key) : [...prev, col.key])}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                          checked ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        <span>{col.icon}</span>
                        <span className="flex-1 text-xs font-medium">{col.label}</span>
                        {checked && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Date range: pickers */}
            {exportMode === 'daterange' && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Date range <span className="text-gray-400 font-normal">(applies to Transactions & Transfers)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Leave blank to export all records of each collection</p>
                {/* Also show collection selector for date range mode */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-600">Include collections</p>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedCols(ALL_COLLECTIONS.map(c => c.key))} className="text-xs text-blue-600 hover:underline">All</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => setSelectedCols([])} className="text-xs text-gray-500 hover:underline">None</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_COLLECTIONS.map(col => {
                      const checked = selectedCols.includes(col.key);
                      return (
                        <button key={col.key}
                          onClick={() => setSelectedCols(prev => checked ? prev.filter(k => k !== col.key) : [...prev, col.key])}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
                            checked ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                          <span>{col.icon}</span>
                          <span className="flex-1 font-medium">{col.label}</span>
                          {checked && <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />}
                          {col.hasDate && <span className="text-[9px] text-blue-500 font-bold">DATE</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Format selector — shared */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Export format</p>
              <div className="flex gap-3">
                {[['json','JSON — Single file, all collections'], ['csv','CSV — Separate file per collection']].map(([f, label]) => (
                  <button key={f} onClick={() => setExportFormat(f)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                      exportFormat === f ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Export button */}
            <button onClick={runExport} disabled={loading || (exportMode === 'selective' && selectedCols.length === 0)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm rounded-xl transition-colors">
              <Download className="w-4 h-4" />
              {loading ? 'Exporting…' : `Export ${
                exportMode === 'all' ? 'All Data' :
                exportMode === 'selective' ? `${selectedCols.length} collection${selectedCols.length !== 1 ? 's' : ''}` :
                'by Date Range'
              }`}
            </button>
          </div>
        )}
      </div>

      {/* ── App Information ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">App Information</h2>
        </div>
        <div className="space-y-0 divide-y divide-gray-100 text-sm">
          {[
            ['Version',          '1.0.0'],
            ['User ID',          <span className="font-mono text-xs">{user?.uid?.slice(0, 24)}…</span>],
            ['Account Created',  user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2.5">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Danger Zone ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 text-sm text-red-800">
          <p><strong>Warning:</strong> Permanently deletes ALL wallet data across every collection.</p>
          <p className="text-xs text-red-600 mt-1">Your login account will remain active. This cannot be undone.</p>
        </div>
        <button onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-sm">
          <Trash2 className="w-4 h-4" /> Delete All Wallet Data
        </button>
      </div>

      {/* ── Logout ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <button onClick={async () => { await logout(); router.push('/'); }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* ── Delete Modal ──────────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete All Wallet Data</h2>
            </div>
            <p className="text-sm text-gray-500 mb-1 mt-3">This will permanently delete:</p>
            <ul className="text-sm text-gray-600 mb-4 space-y-0.5 ml-4 list-disc">
              {[
                'All accounts & balances',
                'All transactions & transfers',
                'All categories',
                'All Zakat cycles & payments',
                'All investments & financial goals',
                'All lendings & loans',
                'All jewellery & price history',
                'All riba transaction records',
                'All settings & preferences',
              ].map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
              💡 Consider exporting your data first before deleting.
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">Type <strong className="text-red-600">DELETE</strong> to confirm</p>
            <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl mb-4 text-sm focus:outline-none focus:border-red-400"
              placeholder="Type DELETE" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDeleteWalletData}
                disabled={deleteConfirm !== 'DELETE' || loading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400">
                {loading ? 'Deleting…' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}