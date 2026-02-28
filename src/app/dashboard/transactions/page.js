// src/app/dashboard/transactions/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAccounts, updateAccount, generateId } from '@/lib/firestoreCollections';
import { getAvailableBalance } from '@/lib/goalUtils';
import { unmarkSold } from '@/lib/jewelleryCollections';
import {
  Plus, Edit2, Trash2, Receipt, X, ArrowUpCircle, ArrowDownCircle,
  Calendar, Search, Wallet, AlertTriangle, ArrowRightLeft, AlertCircle,
  Loader2, Zap, ChevronRight, Info,
} from 'lucide-react';
import { showToast } from '@/components/Toast';

// ─── System-category helper ────────────────────────────────────────────────
// Finds or creates a named system category (e.g. "Fees & Charges", "Interest / Riba")
async function getOrCreateSystemCategory(uid, name, type, color, extraFields = {}) {
  const ref = collection(db, 'users', uid, 'categories');
  const q   = query(ref, where('name', '==', name));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;

  const docRef = await addDoc(ref, {
    name,
    type,
    color,
    categoryId: generateId(),
    isSystem: true,
    ...extraFields,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ─── Quick inline Add-Category mini-form ──────────────────────────────────
function InlineCategoryForm({ type, onSaved, onCancel }) {
  const { user } = useAuth();
  const [name,    setName]    = useState('');
  const [color,   setColor]   = useState(type === 'Income' ? '#10B981' : '#EF4444');
  const [saving,  setSaving]  = useState(false);

  const COLORS = [
    '#EF4444','#F59E0B','#10B981','#3B82F6',
    '#6366F1','#8B5CF6','#EC4899','#06B6D4',
    '#84CC16','#F97316',
  ];

  const handleSave = async () => {
    if (!name.trim()) { showToast('Enter a category name', 'error'); return; }
    setSaving(true);
    try {
      const ref    = collection(db, 'users', user.uid, 'categories');
      const docRef = await addDoc(ref, {
        name: name.trim(),
        type,
        color,
        categoryId: generateId(),
        createdAt: serverTimestamp(),
      });
      showToast(`"${name.trim()}" added!`, 'success');
      onSaved({ id: docRef.id, name: name.trim(), type, color });
    } catch {
      showToast('Failed to add category', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`mt-2 p-3 rounded-lg border-2 ${
      type === 'Income' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    }`}>
      <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">New {type} Category</p>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }}
        placeholder="Category name…"
        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md mb-2 outline-none focus:ring-1 focus:ring-gray-400"
      />
      <div className="flex gap-1 mb-2 flex-wrap">
        {COLORS.map(c => (
          <button key={c} type="button" onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-1 ring-gray-700 scale-110' : ''}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-1.5 text-xs border border-gray-300 rounded-md text-gray-600 hover:bg-white">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className={`flex-1 py-1.5 text-xs text-white rounded-md font-bold ${
            type === 'Income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          } disabled:opacity-60`}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Category selector with inline "Add new" ──────────────────────────────
function CategorySelect({ value, onChange, categories, type, disabled, onCategoryCreated }) {
  const [showInline, setShowInline] = useState(false);
  const filtered = categories.filter(c =>
    c.type?.toLowerCase() === type.toLowerCase() ||
    c.type === 'Both'
  );
  const isIncome = type === 'Income';

  return (
    <div>
      <select
        value={value}
        onChange={e => {
          if (e.target.value === '__add_new__') {
            setShowInline(true);
          } else {
            setShowInline(false);
            onChange(e.target.value);
          }
        }}
        className={`w-full rounded-lg p-2.5 text-xs font-bold focus:ring-1 outline-none border ${
          isIncome
            ? 'bg-green-50 border-green-100 focus:ring-green-500'
            : 'bg-red-50 border-red-100 focus:ring-red-500'
        }`}
        required
        disabled={disabled}
      >
        <option value="">Select Category</option>
        {filtered.map(c => (
          <option key={c.id} value={c.id}>{c.name}{c.isRiba ? ' ⚠' : ''}</option>
        ))}
        <option value="__add_new__">➕ Add new category…</option>
      </select>

      {showInline && (
        <InlineCategoryForm
          type={type}
          onSaved={(newCat) => {
            onCategoryCreated(newCat);
            onChange(newCat.id);
            setShowInline(false);
          }}
          onCancel={() => setShowInline(false)}
        />
      )}
    </div>
  );
}

// ─── Charges field component ──────────────────────────────────────────────
function ChargesField({ value, onChange, disabled, note, onNoteChange }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value > 0 || note) setOpen(true);
  }, []);

  return (
    <div className="col-span-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Add related charges / fees (optional)
        </button>
      ) : (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] font-bold text-orange-700 uppercase">Related Charges / Fees</span>
            </div>
            <button type="button" onClick={() => { setOpen(false); onChange(0); onNoteChange(''); }}
              className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 font-semibold block mb-1">Amount (৳)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={value || ''}
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                disabled={disabled}
                className="w-full px-2.5 py-1.5 text-sm font-bold border border-orange-200 bg-white rounded-md outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-semibold block mb-1">Label</label>
              <input
                type="text"
                value={note || ''}
                onChange={e => onNoteChange(e.target.value)}
                placeholder="e.g. TDS, Bank fee…"
                disabled={disabled}
                className="w-full px-2.5 py-1.5 text-sm border border-orange-200 bg-white rounded-md outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
          </div>
          <p className="text-[10px] text-orange-600 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Will be recorded separately as an expense under "Fees &amp; Charges"
          </p>
        </div>
      )}
    </div>
  );
}

// ─── NEW: Transaction Detail Modal Component ──────────────────────────────
function TransactionDetailModal({ transaction, accounts, categories, onClose, onEdit, onDelete }) {
  if (!transaction) return null;

  const account = accounts.find(a => a.id === transaction.accountId);
  const category = categories.find(c => c.id === transaction.categoryId);
  const relatedAccount = accounts.find(a => a.id === transaction.relatedAccountId);

  const isTransfer = transaction.isTransfer;
  const isIncome = transaction.type === 'Income';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 animate-fadeIn md:flex md:items-center md:justify-center md:p-4"
      onClick={onClose}>
      <div className="bg-white w-full h-full md:h-auto md:max-w-md md:rounded-2xl shadow-2xl animate-slideUpMobile md:animate-slideUp overflow-hidden flex flex-col md:max-h-[85vh]"
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className={`relative px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 flex-shrink-0 ${
          isTransfer ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
          isIncome ? 'bg-gradient-to-br from-green-500 to-green-600' :
          'bg-gradient-to-br from-red-500 to-red-600'
        }`}>
          {/* Mobile handle */}
          <div className="md:hidden flex justify-center mb-2">
            <div className="w-10 h-1 bg-white/30 rounded-full"></div>
          </div>

          <button onClick={onClose}
            className="absolute top-3 md:top-4 right-3 md:right-4 text-white/80 hover:text-white transition-colors">
            <X size={20} className="md:w-6 md:h-6" />
          </button>
          
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            {isTransfer ? (
              <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl">
                <ArrowRightLeft size={20} className="text-white md:w-6 md:h-6" />
              </div>
            ) : isIncome ? (
              <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl">
                <ArrowUpCircle size={20} className="text-white md:w-6 md:h-6" />
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl">
                <ArrowDownCircle size={20} className="text-white md:w-6 md:h-6" />
              </div>
            )}
            <div>
              <h3 className="text-white text-xs md:text-sm font-semibold uppercase tracking-wide">
                {isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
              </h3>
              <p className="text-white/80 text-[10px] md:text-xs">Transaction Details</p>
            </div>
          </div>

          {/* Amount */}
          <div className="text-center py-3 md:py-4">
            <div className="text-white/80 text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1">
              Amount
            </div>
            <div className="text-white text-3xl md:text-4xl font-bold">
              ৳{parseFloat(transaction.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4">
          
          {/* Transfer specific details */}
          {isTransfer && (
            <>
              <DetailRow 
                label={transaction.transferDirection === 'from' ? 'From Account' : 'To Account'} 
                value={account?.name || 'Unknown'} 
                icon={<Wallet size={14} className="md:w-4 md:h-4" />}
              />
              <DetailRow 
                label={transaction.transferDirection === 'from' ? 'To Account' : 'From Account'} 
                value={relatedAccount?.name || 'Unknown'} 
                icon={<Wallet size={14} className="md:w-4 md:h-4" />}
              />
            </>
          )}

          {/* Income/Expense specific details */}
          {!isTransfer && (
            <>
              <DetailRow 
                label="Account" 
                value={account?.name || 'Unknown'} 
                icon={<Wallet size={14} className="md:w-4 md:h-4" />}
              />
              <DetailRow 
                label="Category" 
                value={
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" 
                      style={{ backgroundColor: category?.color || '#9CA3AF' }} />
                    <span>{category?.name || 'Unknown'}</span>
                    {category?.isRiba && <span className="text-amber-600">⚠</span>}
                  </div>
                }
                icon={<Receipt size={14} className="md:w-4 md:h-4" />}
              />
            </>
          )}

          {/* Date */}
          <DetailRow 
            label="Date" 
            value={formatDate(transaction.date)} 
            icon={<Calendar size={14} className="md:w-4 md:h-4" />}
          />

          {/* Created At */}
          {transaction.createdAt && (
            <DetailRow 
              label="Created At" 
              value={formatDateTime(transaction.createdAt)} 
              icon={<Calendar size={14} className="md:w-4 md:h-4" />}
            />
          )}

          {/* Description/Note */}
          {transaction.description && (
            <DetailRow 
              label="Note" 
              value={transaction.description} 
              icon={<Info size={14} className="md:w-4 md:h-4" />}
            />
          )}

          {/* Charge badge */}
          {transaction.isCharge && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 md:p-3">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-orange-600 md:w-3.5 md:h-3.5" />
                <span className="text-[11px] md:text-xs font-semibold text-orange-900">Transaction Fee/Charge</span>
              </div>
            </div>
          )}

          {/* Source info */}
          {transaction.source && (
            <DetailRow 
              label="Source" 
              value={
                transaction.source === 'jewellery_sale' ? '💎 Jewellery Sale' :
                transaction.source === 'goal' ? '🎯 Goal' :
                transaction.source
              }
              icon={<Zap size={14} className="md:w-4 md:h-4" />}
            />
          )}

          {/* Riba warning */}
          {transaction.isRiba && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 md:p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5 md:w-3.5 md:h-3.5" />
                <p className="text-[11px] md:text-xs text-amber-800">
                  <strong>Riba/Interest income.</strong> Should be donated as Sadaqah.
                </p>
              </div>
              {transaction.sadaqahDone && (
                <div className="flex items-center gap-1.5 text-green-700">
                  <span className="text-[11px] md:text-xs font-semibold">✓ Purified</span>
                </div>
              )}
            </div>
          )}

          {/* Transaction ID */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-wide">Transaction ID</p>
            <p className="text-[11px] md:text-xs text-gray-600 font-mono break-all">{transaction.id}</p>
          </div>
        </div>

        {/* Action buttons - Fixed at bottom */}
        <div className="flex-shrink-0 p-3 md:p-4 border-t border-gray-100 flex gap-2 md:gap-3 bg-white">
          {!isTransfer && (
            <button
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
              className="flex-1 py-2.5 md:py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg font-semibold text-xs md:text-sm transition-colors flex items-center justify-center gap-1.5 md:gap-2"
            >
              <Edit2 size={14} className="md:w-4 md:h-4" />
              Edit
            </button>
          )}
          <button
            onClick={() => {
              onDelete(transaction);
              onClose();
            }}
            className={`${isTransfer ? 'flex-1' : 'flex-1'} py-2.5 md:py-3 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg font-semibold text-xs md:text-sm transition-colors flex items-center justify-center gap-1.5 md:gap-2`}
          >
            <Trash2 size={14} className="md:w-4 md:h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for detail rows
function DetailRow({ label, value, icon }) {
  return (
    <div className="flex items-start gap-2 md:gap-3 py-1.5 md:py-2">
      <div className="text-gray-400 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">
          {label}
        </p>
        <div className="text-xs md:text-sm text-gray-900 font-medium break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function TransactionsPage() {
  const { user } = useAuth();

  const [transactions,        setTransactions]        = useState([]);
  const [accounts,            setAccounts]            = useState([]);
  const [categories,          setCategories]          = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [submitting,          setSubmitting]          = useState(false);
  const [checkingBalance,     setCheckingBalance]     = useState(false);

  const [showModal,           setShowModal]           = useState(false);
  const [showDeleteModal,     setShowDeleteModal]     = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [editingTransaction,  setEditingTransaction]  = useState(null);

  const [filterType,          setFilterType]          = useState('All');
  const [filterAccount,       setFilterAccount]       = useState('All');
  const [dateFilter,          setDateFilter]          = useState('Weekly');
  const [customDateRange,     setCustomDateRange]     = useState({ start: '', end: '' });
  const [searchQuery,         setSearchQuery]         = useState('');

  const [modalTab,            setModalTab]            = useState('expense');

  const [formData,            setFormData]            = useState({
    type: 'Expense', amount: '', accountId: '', categoryId: '',
    description: '', date: new Date().toISOString().split('T')[0],
    chargeAmount: 0, chargeNote: '',
  });

  const [transferData,        setTransferData]        = useState({
    fromAccountId: '', toAccountId: '', amount: '',
    description: '', date: new Date().toISOString().split('T')[0],
    chargeAmount: 0, chargeNote: '',
  });

  const [accountsWithAvailable, setAccountsWithAvailable] = useState([]);
  const [summaryIncome,         setSummaryIncome]         = useState(0);
  const [summaryExpense,        setSummaryExpense]        = useState(0);
  const [summaryNet,            setSummaryNet]            = useState(0);

  // NEW: Transaction detail modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadTransactionsAndTransfers(), loadAccounts(), loadCategories()]);
    setLoading(false);
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      const withAvail = await Promise.all(
        result.accounts.map(async (a) => ({
          ...a,
          availableBalance: await getAvailableBalance(user.uid, a.id, a.balance),
        }))
      );
      setAccounts(result.accounts);
      setAccountsWithAvailable(withAvail);
      if (result.accounts.length > 0 && !formData.accountId) {
        setFormData(p => ({ ...p, accountId: result.accounts[0].id }));
        setTransferData(p => ({
          ...p,
          fromAccountId: result.accounts[0].id,
          toAccountId: result.accounts.length > 1 ? result.accounts[1].id : '',
        }));
      }
    }
  };

  const loadTransactionsAndTransfers = async () => {
    try {
      const transRef   = collection(db, 'users', user.uid, 'transactions');
      const transferRef = collection(db, 'users', user.uid, 'transfers');
      let normal = [], transfers = [];

      try {
        const snap = await getDocs(query(transRef, orderBy('date', 'desc')));
        normal = snap.docs.map(d => ({ id: d.id, collectionType: 'transactions', ...d.data() }));
      } catch {
        const snap = await getDocs(transRef);
        normal = snap.docs.map(d => ({ id: d.id, collectionType: 'transactions', ...d.data() }));
      }

      try {
        const snap = await getDocs(query(transferRef, orderBy('date', 'desc')));
        transfers = snap.docs.map(d => ({ id: d.id, collectionType: 'transfers', ...d.data() }));
      } catch {
        const snap = await getDocs(transferRef);
        transfers = snap.docs.map(d => ({ id: d.id, collectionType: 'transfers', ...d.data() }));
      }

      const expandedTransfers = [];
      transfers.forEach(t => {
        expandedTransfers.push({
          id: `${t.id}-expense`, originalId: t.id, collectionType: 'transfers',
          type: 'Expense', amount: t.amount, accountId: t.fromAccountId,
          accountName: t.fromAccountName,
          description: t.description || `Transfer to ${t.toAccountName}`,
          date: t.date, createdAt: t.createdAt, isTransfer: true,
          transferDirection: 'from', relatedAccountId: t.toAccountId,
          relatedAccountName: t.toAccountName,
        });
        expandedTransfers.push({
          id: `${t.id}-income`, originalId: t.id, collectionType: 'transfers',
          type: 'Income', amount: t.amount, accountId: t.toAccountId,
          accountName: t.toAccountName,
          description: t.description || `Transfer from ${t.fromAccountName}`,
          date: t.date, createdAt: t.createdAt, isTransfer: true,
          transferDirection: 'to', relatedAccountId: t.fromAccountId,
          relatedAccountName: t.fromAccountName,
        });
      });

      const all = [...normal, ...expandedTransfers].sort((a, b) => {
        const dc = (b.date || '').localeCompare(a.date || '');
        if (dc !== 0) return dc;
        return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      });
      setTransactions(all);
    } catch (err) {
      console.error(err);
      showToast('Failed to load records', 'error');
    }
  };

  const loadCategories = async () => {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'categories'));
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      showToast('Failed to load categories', 'error');
    }
  };

  // Called by InlineCategoryForm after saving — adds to local state so select is immediately populated
  const handleCategoryCreated = (newCat) => {
    setCategories(prev => [...prev, newCat]);
  };

  // ── Summary ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!transactions.length) return;
    const range = getSummaryDateRange();
    const filtered = range
      ? transactions.filter(t => t.date >= range.start && t.date <= range.end)
      : transactions;
    const inc = filtered.filter(t => t.type === 'Income' && !t.isTransfer).reduce((s, t) => s + Number(t.amount || 0), 0);
    const exp = filtered.filter(t => t.type === 'Expense' && !t.isTransfer).reduce((s, t) => s + Number(t.amount || 0), 0);
    setSummaryIncome(inc);
    setSummaryExpense(exp);
    setSummaryNet(inc - exp);
  }, [transactions, dateFilter, customDateRange.start, customDateRange.end]);

  const getSummaryDateRange = () => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    if (dateFilter === 'Daily') { const s = fmtISO(now); return { start: s, end: s }; }
    if (dateFilter === 'Weekly') {
      const dow = now.getDay();
      const diff = dow === 6 ? 0 : dow + 1;
      const ws = new Date(now); ws.setDate(d - diff);
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      return { start: fmtISO(ws), end: fmtISO(we) };
    }
    if (dateFilter === 'Monthly') return { start: fmtISO(new Date(y,m,1)), end: fmtISO(new Date(y,m+1,0)) };
    if (dateFilter === 'Yearly')  return { start: fmtISO(new Date(y,0,1)), end: fmtISO(new Date(y,11,31)) };
    if (dateFilter === 'Custom' && customDateRange.start && customDateRange.end) return customDateRange;
    return null;
  };

  const fmtISO = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const d = String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  };

  const formatDate = (s) => {
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };

  const totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);

  // ── Save charge as separate expense transaction ────────────────────────
  const recordCharge = async (chargeAmount, chargeNote, accountId, date) => {
    if (!chargeAmount || chargeAmount <= 0 || !accountId) return;
    const feeCatId = await getOrCreateSystemCategory(
      user.uid, 'Fees & Charges', 'Expense', '#F97316'
    );
    const account  = accounts.find(a => a.id === accountId);
    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
      type:        'Expense',
      amount:      chargeAmount,
      accountId,
      categoryId:  feeCatId,
      description: chargeNote || 'Transaction charge',
      date,
      isCharge:    true,
      createdAt:   Timestamp.now(),
    });
    // Deduct charge from account balance
    if (account) {
      await updateAccount(user.uid, accountId, { balance: account.balance - chargeAmount });
    }
    // Update local accounts state so next balance check is accurate
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: a.balance - chargeAmount } : a));
  };

  // ── handleSubmit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (modalTab === 'transfer') return handleTransferSubmit(e);

    if (!formData.amount || !formData.accountId || !formData.categoryId) {
      return showToast('Please fill in all required fields', 'error');
    }

    const amount  = parseFloat(formData.amount);
    const account = accounts.find(a => a.id === formData.accountId);
    if (!account) return showToast('Invalid account', 'error');

    setSubmitting(true);
    setCheckingBalance(true);

    try {
      // Balance check for expenses (include charge amount)
      const totalDeduct = formData.type === 'Expense'
        ? amount + (formData.chargeAmount || 0)
        : 0;

      if (formData.type === 'Expense') {
        const avail = await getAvailableBalance(user.uid, formData.accountId, account.balance);
        if (totalDeduct > avail) {
          setSubmitting(false); setCheckingBalance(false);
          return showToast(`Insufficient balance! Available: ৳${avail.toLocaleString()}`, 'error');
        }
      }

      // Check if selected category is Riba — add isRiba flag to transaction
      const selectedCat = categories.find(c => c.id === formData.categoryId);
      const isRiba = selectedCat?.isRiba === true;

      if (editingTransaction) {
        const oldAmount = parseFloat(editingTransaction.amount);
        const oldAcc    = accounts.find(a => a.id === editingTransaction.accountId);
        const newAcc    = accounts.find(a => a.id === formData.accountId);
        if (!newAcc) return showToast('Invalid account', 'error');

        let revertedBalance;
        if (oldAcc) {
          revertedBalance = editingTransaction.type === 'Income'
            ? oldAcc.balance - oldAmount
            : oldAcc.balance + oldAmount;
        }
        if (oldAcc) await updateAccount(user.uid, oldAcc.id, { balance: revertedBalance });

        await updateDoc(doc(db, 'users', user.uid, 'transactions', editingTransaction.id), {
          type: formData.type, amount,
          accountId: formData.accountId, categoryId: formData.categoryId,
          description: formData.description, date: formData.date,
          isRiba, updatedAt: Timestamp.now(),
        });

        const finalBalance = oldAcc?.id === newAcc.id
          ? (formData.type === 'Income' ? revertedBalance + amount : revertedBalance - amount)
          : (formData.type === 'Income' ? newAcc.balance + amount : newAcc.balance - amount);
        await updateAccount(user.uid, newAcc.id, { balance: finalBalance });
        showToast('Updated', 'success');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'transactions'), {
          type: formData.type, amount,
          accountId: formData.accountId, categoryId: formData.categoryId,
          description: formData.description, date: formData.date,
          isRiba, sadaqahDone: false,
          createdAt: Timestamp.now(),
        });
        const newBal = formData.type === 'Income'
          ? account.balance + amount
          : account.balance - amount;
        await updateAccount(user.uid, account.id, { balance: newBal });

        // Record charges as separate expense
        if (formData.chargeAmount > 0) {
          await recordCharge(
            formData.chargeAmount, formData.chargeNote,
            formData.accountId, formData.date
          );
          showToast(`Added + ৳${formData.chargeAmount.toLocaleString()} charge recorded`, 'success');
        } else {
          showToast('Added', 'success');
        }
      }

      await loadData();
      closeModal();
    } catch (err) {
      console.error(err);
      showToast('Error saving', 'error');
    } finally {
      setSubmitting(false);
      setCheckingBalance(false);
    }
  };

  // ── handleTransferSubmit ──────────────────────────────────────────────
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount) {
      return showToast('Fill all required fields', 'error');
    }
    if (transferData.fromAccountId === transferData.toAccountId) {
      return showToast('Cannot transfer to same account', 'error');
    }

    const amount  = parseFloat(transferData.amount);
    const charge  = transferData.chargeAmount || 0;
    const from    = accounts.find(a => a.id === transferData.fromAccountId);
    const to      = accounts.find(a => a.id === transferData.toAccountId);
    if (!from || !to) return showToast('Invalid accounts', 'error');

    setSubmitting(true);
    setCheckingBalance(true);

    try {
      const avail = await getAvailableBalance(user.uid, from.id, from.balance);
      if (amount + charge > avail) {
        setSubmitting(false); setCheckingBalance(false);
        return showToast(
          `Insufficient balance in ${from.name}! Available: ৳${avail.toLocaleString()}`, 'error'
        );
      }

      if (editingTransaction) {
        const oldAmount  = parseFloat(editingTransaction.amount);
        let rFromId, rToId;
        if (editingTransaction.transferDirection === 'from') {
          rFromId = editingTransaction.accountId; rToId = editingTransaction.relatedAccountId;
        } else {
          rFromId = editingTransaction.relatedAccountId; rToId = editingTransaction.accountId;
        }
        const rFrom = accounts.find(a => a.id === rFromId);
        const rTo   = accounts.find(a => a.id === rToId);
        if (rFrom) await updateAccount(user.uid, rFrom.id, { balance: rFrom.balance + oldAmount });
        if (rTo)   await updateAccount(user.uid, rTo.id,   { balance: rTo.balance - oldAmount });

        await updateDoc(doc(db, 'users', user.uid, 'transfers', editingTransaction.originalId), {
          fromAccountId: transferData.fromAccountId, fromAccountName: from.name,
          toAccountId:   transferData.toAccountId,   toAccountName:   to.name,
          amount, description: transferData.description || '',
          date: transferData.date, updatedAt: Timestamp.now(),
        });

        const fromFinal = rFrom?.id === from.id ? rFrom.balance + oldAmount - amount : from.balance - amount;
        const toFinal   = rTo?.id   === to.id   ? rTo.balance - oldAmount + amount   : to.balance + amount;
        await updateAccount(user.uid, from.id, { balance: fromFinal });
        await updateAccount(user.uid, to.id,   { balance: toFinal });
        showToast('Transfer updated', 'success');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'transfers'), {
          fromAccountId: transferData.fromAccountId, fromAccountName: from.name,
          toAccountId:   transferData.toAccountId,   toAccountName:   to.name,
          amount, description: transferData.description || '',
          date: transferData.date, createdAt: Timestamp.now(),
        });
        await updateAccount(user.uid, from.id, { balance: from.balance - amount });
        await updateAccount(user.uid, to.id,   { balance: to.balance + amount });

        // Charge comes out of the FROM account (on top of transfer amount)
        if (charge > 0) {
          await recordCharge(charge, transferData.chargeNote, transferData.fromAccountId, transferData.date);
          showToast(`Transfer done + ৳${charge.toLocaleString()} charge recorded`, 'success');
        } else {
          showToast('Transfer completed', 'success');
        }
      }

      await loadData();
      closeModal();
    } catch (err) {
      console.error(err);
      showToast('Error saving transfer', 'error');
    } finally {
      setSubmitting(false);
      setCheckingBalance(false);
    }
  };

  // ── handleDelete ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!transactionToDelete) return;
    try {
      if (transactionToDelete.isTransfer) {
        const originalTransferId = transactionToDelete.originalId;
        let fromId, toId;
        if (transactionToDelete.transferDirection === 'from') {
          fromId = transactionToDelete.accountId; toId = transactionToDelete.relatedAccountId;
        } else {
          fromId = transactionToDelete.relatedAccountId; toId = transactionToDelete.accountId;
        }
        const from = accounts.find(a => a.id === fromId);
        const to   = accounts.find(a => a.id === toId);
        if (from) await updateAccount(user.uid, from.id, { balance: from.balance + transactionToDelete.amount });
        if (to)   await updateAccount(user.uid, to.id,   { balance: to.balance - transactionToDelete.amount });
        await deleteDoc(doc(db, 'users', user.uid, 'transfers', originalTransferId));
      } else {
        const acc = accounts.find(a => a.id === transactionToDelete.accountId);
        if (acc) {
          const nb = transactionToDelete.type === 'Income'
            ? acc.balance - transactionToDelete.amount
            : acc.balance + transactionToDelete.amount;
          await updateAccount(user.uid, acc.id, { balance: nb });
        }
        await deleteDoc(doc(db, 'users', user.uid, 'transactions', transactionToDelete.id));

        // Jewellery undo
        if (transactionToDelete.source === 'jewellery_sale' && transactionToDelete.jewelleryId) {
          await unmarkSold(user.uid, transactionToDelete.jewelleryId);
        }
      }
      showToast('Deleted successfully', 'success');
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Delete failed', 'error');
    } finally {
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    }
  };

  // ── handleEdit ────────────────────────────────────────────────────────
  const handleEdit = (record) => {
    setEditingTransaction(record);
    if (record.isTransfer) {
      setModalTab('transfer');
      const fd = record.transferDirection === 'from'
        ? { fromAccountId: record.accountId, toAccountId: record.relatedAccountId }
        : { fromAccountId: record.relatedAccountId, toAccountId: record.accountId };
      setTransferData({ ...fd, amount: record.amount.toString(), description: record.description || '', date: record.date, chargeAmount: 0, chargeNote: '' });
    } else {
      setModalTab(record.type.toLowerCase());
      setFormData({ type: record.type, amount: record.amount.toString(), accountId: record.accountId, categoryId: record.categoryId, description: record.description || '', date: record.date, chargeAmount: 0, chargeNote: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
    setModalTab('expense');
    setSubmitting(false);
    setCheckingBalance(false);
    setFormData({ type: 'Expense', amount: '', accountId: accounts[0]?.id || '', categoryId: '', description: '', date: new Date().toISOString().split('T')[0], chargeAmount: 0, chargeNote: '' });
    setTransferData({ fromAccountId: accounts[0]?.id || '', toAccountId: accounts[1]?.id || '', amount: '', description: '', date: new Date().toISOString().split('T')[0], chargeAmount: 0, chargeNote: '' });
  };

  // ── NEW: Handle transaction click to show details ──────────────────────
  const handleTransactionClick = (txn) => {
    setSelectedTransaction(txn);
    setShowDetailModal(true);
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const getAccountName  = id => accounts.find(a => a.id === id)?.name || 'Unknown';
  const getCategoryName = id => categories.find(c => c.id === id)?.name || 'Unknown';
  const getCategoryColor = id => categories.find(c => c.id === id)?.color || '#6B7280';
  const isRibaTx = t => !!t.isRiba;

  // ── Filter ────────────────────────────────────────────────────────────
  const getRange = () => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    switch (dateFilter) {
      case 'Daily':   { const s = fmtISO(now); return { start: s, end: s }; }
      case 'Weekly':  { const dw = now.getDay(), diff = dw===6?0:dw+1; const ws = new Date(now); ws.setDate(d-diff); const we = new Date(ws); we.setDate(ws.getDate()+6); return { start: fmtISO(ws), end: fmtISO(we) }; }
      case 'Monthly': return { start: fmtISO(new Date(y,m,1)), end: fmtISO(new Date(y,m+1,0)) };
      case 'Yearly':  return { start: fmtISO(new Date(y,0,1)), end: fmtISO(new Date(y,11,31)) };
      case 'Custom':  return customDateRange.start && customDateRange.end ? customDateRange : null;
      default:        return null;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'All' && t.type !== filterType) return false;
    if (filterAccount !== 'All' && t.accountId !== filterAccount) return false;
    const range = getRange();
    if (range && (t.date < range.start || t.date > range.end)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      let match = (t.description || '').toLowerCase().includes(q) || String(t.amount).includes(q);
      if (!t.isTransfer) match ||= getCategoryName(t.categoryId).toLowerCase().includes(q);
      match ||= getAccountName(t.accountId).toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const grouped = filteredTransactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = { records: [], dayIncome: 0, dayExpense: 0 };
    acc[t.date].records.push(t);
    if (t.type === 'Income') acc[t.date].dayIncome += Number(t.amount || 0);
    if (t.type === 'Expense') acc[t.date].dayExpense += Number(t.amount || 0);
    return acc;
  }, {});

  const isButtonDisabled = accounts.length === 0 || categories.length === 0;
  const disabledReason = accounts.length === 0 && categories.length === 0
    ? 'Please add accounts and categories first'
    : accounts.length === 0 ? 'Please add at least one account first'
    : categories.length === 0 ? 'Please add at least one category first'
    : null;

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">Track your income, expenses and transfers</p>
        </div>
        <div className="relative group">
          <button
            onClick={() => setShowModal(true)}
            disabled={isButtonDisabled}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Plus size={16} /> Add Transaction
          </button>
          {isButtonDisabled && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p>{disabledReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Balance</p>
            <Wallet size={14} className="text-gray-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">৳{totalBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Income</p>
            <ArrowUpCircle size={14} className="text-green-500" />
          </div>
          <p className="text-xl font-bold text-green-600">৳{summaryIncome.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">Excluding transfers</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Expense</p>
            <ArrowDownCircle size={14} className="text-red-500" />
          </div>
          <p className="text-xl font-bold text-red-600">৳{summaryExpense.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">Excluding transfers</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Net</p>
            <Receipt size={14} className="text-gray-400" />
          </div>
          <p className={`text-xl font-bold ${summaryNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ৳{Math.abs(summaryNet).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Account balances */}
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {accountsWithAvailable.map(acc => (
          <div key={acc.id} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 min-w-[160px] flex flex-col">
            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">{acc.name}</p>
            <p className="text-sm font-black text-gray-900 truncate">৳{(acc.balance||0).toLocaleString()}</p>
            <p className="text-[10px] text-green-600 font-medium">Available: ৳{(acc.availableBalance||0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-1">
              {['All','Income','Expense'].map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`flex-1 py-1.5 text-xs rounded transition ${filterType===t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
            <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
              <option value="All">All Accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
            <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); if (e.target.value !== 'Custom') setCustomDateRange({ start:'', end:'' }); }}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
              <option value="Daily">Today</option>
              <option value="Weekly">This Week</option>
              <option value="Monthly">This Month</option>
              <option value="Yearly">This Year</option>
              <option value="All">All Time</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm" />
            </div>
          </div>
        </div>
        {dateFilter === 'Custom' && (
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
              <input type="date" value={customDateRange.start}
                onChange={e => setCustomDateRange(p => ({ ...p, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
              <input type="date" value={customDateRange.end}
                onChange={e => setCustomDateRange(p => ({ ...p, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full mx-auto" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">No records found</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden max-h-[65vh] overflow-y-auto">
          {Object.entries(grouped).map(([date, { records, dayIncome, dayExpense }]) => (
            <div key={date}>
              <div className="sticky top-0 bg-gray-50 px-4 py-2.5 flex justify-between items-center z-10 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-500" />
                  <span className="text-sm font-medium">{formatDate(date)}</span>
                </div>
                <div className="flex gap-5 text-xs">
                  <span className="text-green-600 font-medium">+৳{dayIncome.toLocaleString()}</span>
                  <span className="text-red-600 font-medium">-৳{dayExpense.toLocaleString()}</span>
                </div>
              </div>
              {records.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleTransactionClick(t)}
                  className={`px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3 border-b border-gray-100 last:border-b-0 cursor-pointer ${t.isRiba ? 'bg-amber-50/50' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'Income' ? 'bg-green-50' : 'bg-red-50'}`}>
                      {t.type === 'Income'
                        ? <ArrowUpCircle size={16} className="text-green-600" />
                        : <ArrowDownCircle size={16} className="text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {!t.isTransfer && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(t.categoryId) }} />}
                        {t.isTransfer && <ArrowRightLeft size={12} className="text-blue-500" />}
                        <p className="text-sm font-medium truncate">
                          {t.isTransfer
                            ? (t.type === 'Income' ? `From ${t.relatedAccountName}` : `To ${t.relatedAccountName}`)
                            : getCategoryName(t.categoryId)}
                        </p>
                        {t.isRiba && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                            RIBA
                          </span>
                        )}
                        {t.isCharge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-orange-100 text-orange-700 rounded-full border border-orange-200">
                            FEE
                          </span>
                        )}
                        {t.isRiba && t.sadaqahDone && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-100 text-green-700 rounded-full border border-green-200">
                            ✓ Purified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{getAccountName(t.accountId)}</p>
                      {t.description && <p className="text-xs text-gray-500 truncate mt-0.5">{t.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className={`text-base font-semibold ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'Income' ? '+' : '-'}৳{Number(t.amount).toLocaleString()}
                    </p>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {!t.isTransfer && (
                        <button onClick={() => handleEdit(t)} className="p-1 hover:bg-gray-100 rounded">
                          <Edit2 size={15} className="text-gray-500" />
                        </button>
                      )}
                      <button onClick={() => { setTransactionToDelete(t); setShowDeleteModal(true); }} className="p-1 hover:bg-red-50 rounded">
                        <Trash2 size={15} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* NEW: Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          accounts={accounts}
          categories={categories}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
          onEdit={handleEdit}
          onDelete={(txn) => {
            setTransactionToDelete(txn);
            setShowDeleteModal(true);
          }}
        />
      )}

      {/* ── Transaction Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={modalTab === 'transfer' ? handleTransferSubmit : handleSubmit} className="space-y-4">
              {/* Tabs */}
              {!editingTransaction && (
                <div className="flex bg-gray-100 p-1 rounded-md">
                  {[['income','Income'],['expense','Expense'],['transfer','Transfer']].map(([tab, label]) => (
                    <button key={tab} type="button"
                      onClick={() => {
                        if (tab === 'transfer' && accounts.length < 2) {
                          showToast('Need at least 2 accounts for transfer', 'error'); return;
                        }
                        setModalTab(tab);
                        if (tab !== 'transfer') setFormData(p => ({ ...p, type: tab === 'income' ? 'Income' : 'Expense', categoryId: '' }));
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded transition-all ${
                        modalTab === tab
                          ? tab === 'income' ? 'bg-green-600 text-white shadow-sm'
                            : tab === 'expense' ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      } ${tab === 'transfer' && accounts.length < 2 ? 'opacity-50' : ''}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Form content */}
              {modalTab === 'transfer' ? (
                /* ── Transfer form ── */
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-600 uppercase ml-1">Amount (৳)</label>
                    <input type="number" step="0.01" value={transferData.amount}
                      onChange={e => setTransferData(p => ({ ...p, amount: e.target.value }))}
                      className="w-full bg-blue-50 text-blue-600 border-2 border-blue-100 rounded-lg p-3 text-2xl font-bold text-center outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00" required disabled={submitting} />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-blue-500 uppercase mb-1 block ml-1">From Account</label>
                      <select value={transferData.fromAccountId}
                        onChange={e => setTransferData(p => ({ ...p, fromAccountId: e.target.value }))}
                        className="w-full bg-blue-50 border-blue-100 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        required disabled={submitting}>
                        <option value="">Select Source</option>
                        {accountsWithAvailable.map(a => (
                          <option key={a.id} value={a.id}>{a.name} (Avail: ৳{(a.availableBalance||0).toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-blue-500 uppercase mb-1 block ml-1">To Account</label>
                      <select value={transferData.toAccountId}
                        onChange={e => setTransferData(p => ({ ...p, toAccountId: e.target.value }))}
                        className="w-full bg-blue-50 border-blue-100 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        required disabled={submitting}>
                        <option value="">Select Destination</option>
                        {accountsWithAvailable.filter(a => a.id !== transferData.fromAccountId).map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Date</label>
                      <input type="date" value={transferData.date}
                        onChange={e => setTransferData(p => ({ ...p, date: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        required disabled={submitting} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Note</label>
                      <input type="text" value={transferData.description}
                        onChange={e => setTransferData(p => ({ ...p, description: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. Savings…" disabled={submitting} />
                    </div>
                    {/* Charges */}
                    <ChargesField
                      value={transferData.chargeAmount}
                      onChange={v => setTransferData(p => ({ ...p, chargeAmount: v }))}
                      note={transferData.chargeNote}
                      onNoteChange={n => setTransferData(p => ({ ...p, chargeNote: n }))}
                      disabled={submitting}
                    />
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full py-4 text-white rounded-lg text-sm font-bold shadow-lg transition-all mt-2 uppercase tracking-widest bg-blue-600 hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2">
                    {submitting
                      ? <><Loader2 className="animate-spin" size={16} /><span>{checkingBalance ? 'Checking…' : 'Confirming…'}</span></>
                      : <span>{editingTransaction ? 'Update Transfer' : 'Confirm Transfer'}</span>}
                  </button>
                </>
              ) : (
                /* ── Income / Expense form ── */
                <>
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase ml-1 ${modalTab === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      Amount (৳)
                    </label>
                    <input type="number" step="0.01" value={formData.amount}
                      onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                      className={`w-full border-2 rounded-lg p-3 text-2xl font-bold text-center outline-none transition-colors ${
                        modalTab === 'income'
                          ? 'bg-green-50 text-green-600 border-green-100 focus:ring-green-500'
                          : 'bg-red-50 text-red-600 border-red-100 focus:ring-red-500'
                      } focus:ring-1`}
                      placeholder="0.00" required disabled={submitting} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Account</label>
                      <select value={formData.accountId}
                        onChange={e => setFormData(p => ({ ...p, accountId: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        required disabled={submitting}>
                        {accountsWithAvailable.map(a => (
                          <option key={a.id} value={a.id}>{a.name} (Avail: ৳{(a.availableBalance||0).toLocaleString()})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`text-[10px] font-bold uppercase mb-1 block ml-1 ${modalTab === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        Category
                      </label>
                      <CategorySelect
                        value={formData.categoryId}
                        onChange={v => setFormData(p => ({ ...p, categoryId: v }))}
                        categories={categories}
                        type={formData.type}
                        disabled={submitting}
                        onCategoryCreated={handleCategoryCreated}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Date</label>
                      <input type="date" value={formData.date}
                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        required disabled={submitting} />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Note</label>
                      <input type="text" value={formData.description}
                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. Rent, Salary…" disabled={submitting} />
                    </div>

                    {/* Charges — available on both income and expense tabs */}
                    <ChargesField
                      value={formData.chargeAmount}
                      onChange={v => setFormData(p => ({ ...p, chargeAmount: v }))}
                      note={formData.chargeNote}
                      onNoteChange={n => setFormData(p => ({ ...p, chargeNote: n }))}
                      disabled={submitting}
                    />
                  </div>

                  {/* Riba warning */}
                  {modalTab === 'income' && categories.find(c => c.id === formData.categoryId)?.isRiba && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        <strong>Riba / Interest income detected.</strong> As per Islamic principle, this amount should be donated as Sadaqah without expectation of reward. You can track and purify it on the <strong>Riba Tracker</strong> page.
                      </p>
                    </div>
                  )}

                  <button type="submit" disabled={submitting}
                    className={`w-full py-4 text-white rounded-lg text-sm font-bold shadow-lg transition-all mt-2 uppercase tracking-widest ${
                      modalTab === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-70 flex items-center justify-center gap-2`}>
                    {submitting
                      ? <><Loader2 className="animate-spin" size={16} /><span>{checkingBalance ? 'Checking…' : 'Confirming…'}</span></>
                      : <span>{editingTransaction ? 'Update' : `Confirm ${modalTab === 'income' ? 'Income' : 'Expense'}`}</span>}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <AlertTriangle size={36} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Delete this record?</h3>
              <p className="text-sm text-gray-600 mb-6">This action cannot be undone. Balances will be adjusted.</p>
              {transactionToDelete?.source === 'jewellery_sale' && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">
                  ⚠ This is a jewellery sale — the item will be marked active again.
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUpMobile {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-slideUpMobile {
          animation: slideUpMobile 0.3s ease-out;
        }
        
        /* Mobile bottom sheet positioning */
        @media (max-width: 768px) {
          .animate-slideUpMobile {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: 20px 20px 0 0;
            max-height: 90vh;
          }
        }
      `}</style>
    </div>
  );
}
