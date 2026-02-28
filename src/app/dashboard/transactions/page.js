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

// ─── Charges input field ──────────────────────────────────────────────────
function ChargesField({ value, onChange, note, onNoteChange, disabled }) {
  const [showNoteInput, setShowNoteInput] = useState(!!note);

  return (
    <div className="col-span-2">
      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1 ml-1">
        Charges / Fees (৳)
        <span className="text-[9px] text-gray-400 font-normal">(Optional)</span>
      </label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setShowNoteInput(true)}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="0.00"
        disabled={disabled}
      />
      {showNoteInput && (
        <input
          type="text"
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 mt-2"
          placeholder="Describe the charge…"
          disabled={disabled}
        />
      )}
    </div>
  );
}

// ─── NEW: Transaction Detail Popup Component ──────────────────────────────
function TransactionDetailModal({ transaction, accounts, categories, onClose, onEdit, onDelete }) {
  if (!transaction) return null;

  const account = accounts.find(a => a.id === transaction.accountId);
  const category = categories.find(c => c.id === transaction.categoryId);
  const fromAccount = accounts.find(a => a.id === transaction.fromAccountId);
  const toAccount = accounts.find(a => a.id === transaction.toAccountId);

  const isTransfer = transaction.type === 'Transfer';
  const isIncome = transaction.type === 'Income';
  const isExpense = transaction.type === 'Expense';

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slideUp"
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className={`relative px-6 pt-6 pb-4 rounded-t-2xl ${
          isTransfer ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
          isIncome ? 'bg-gradient-to-br from-green-500 to-green-600' :
          'bg-gradient-to-br from-red-500 to-red-600'
        }`}>
          <button onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            {isTransfer ? (
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <ArrowRightLeft size={24} className="text-white" />
              </div>
            ) : isIncome ? (
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <ArrowDownCircle size={24} className="text-white" />
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <ArrowUpCircle size={24} className="text-white" />
              </div>
            )}
            <div>
              <h3 className="text-white text-sm font-semibold uppercase tracking-wide">
                {isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
              </h3>
              <p className="text-white/80 text-xs">Transaction Details</p>
            </div>
          </div>

          {/* Amount */}
          <div className="text-center py-4">
            <div className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
              Amount
            </div>
            <div className="text-white text-4xl font-bold">
              ৳{parseFloat(transaction.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* Transfer specific details */}
          {isTransfer && (
            <>
              <DetailRow 
                label="From Account" 
                value={fromAccount?.name || 'Unknown'} 
                icon={<Wallet size={16} />}
              />
              <DetailRow 
                label="To Account" 
                value={toAccount?.name || 'Unknown'} 
                icon={<Wallet size={16} />}
              />
            </>
          )}

          {/* Income/Expense specific details */}
          {!isTransfer && (
            <>
              <DetailRow 
                label="Account" 
                value={account?.name || 'Unknown'} 
                icon={<Wallet size={16} />}
              />
              <DetailRow 
                label="Category" 
                value={
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category?.color || '#9CA3AF' }} />
                    <span>{category?.name || 'Unknown'}</span>
                    {category?.isRiba && <span className="text-amber-600">⚠</span>}
                  </div>
                }
                icon={<Receipt size={16} />}
              />
            </>
          )}

          {/* Date */}
          <DetailRow 
            label="Date" 
            value={formatDate(transaction.createdAt || transaction.date)} 
            icon={<Calendar size={16} />}
          />

          {/* Description/Note */}
          {transaction.description && (
            <DetailRow 
              label="Note" 
              value={transaction.description} 
              icon={<Info size={16} />}
            />
          )}

          {/* Charges */}
          {transaction.chargeAmount && parseFloat(transaction.chargeAmount) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-900">Charges / Fees</span>
                <span className="text-sm font-bold text-amber-900">
                  ৳{parseFloat(transaction.chargeAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {transaction.chargeNote && (
                <p className="text-xs text-amber-700">{transaction.chargeNote}</p>
              )}
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
              icon={<Zap size={16} />}
            />
          )}

          {/* Riba warning */}
          {category?.isRiba && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                This is Riba/Interest income. Should be donated as Sadaqah.
              </p>
            </div>
          )}

          {/* Transaction ID */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Transaction ID</p>
            <p className="text-xs text-gray-600 font-mono break-all">{transaction.id}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => {
              onEdit(transaction);
              onClose();
            }}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            onClick={() => {
              onDelete(transaction);
              onClose();
            }}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
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
    <div className="flex items-start gap-3 py-2">
      <div className="text-gray-400 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">
          {label}
        </p>
        <div className="text-sm text-gray-900 font-medium break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions,    setTransactions]    = useState([]);
  const [accounts,        setAccounts]        = useState([]);
  const [accountsWithAvailable, setAccountsWithAvailable] = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showModal,       setShowModal]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [modalTab,        setModalTab]        = useState('income');
  const [submitting,      setSubmitting]      = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [searchQuery,     setSearchQuery]     = useState('');

  // NEW: Transaction detail modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Income',
    amount: '',
    accountId: '',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    chargeAmount: '',
    chargeNote: '',
  });

  const [transferData, setTransferData] = useState({
    amount: '',
    fromAccountId: '',
    toAccountId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    chargeAmount: '',
    chargeNote: '',
  });

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const ref = collection(db, 'users', user.uid, 'transactions');
      const q = query(ref, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load transactions', 'error');
    }
  }, [user]);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const accts = await getAccounts(user.uid);
      setAccounts(accts);
      const withAvail = await Promise.all(accts.map(async a => ({
        ...a,
        availableBalance: await getAvailableBalance(user.uid, a.id),
      })));
      setAccountsWithAvailable(withAvail);
    } catch (err) {
      console.error(err);
      showToast('Failed to load accounts', 'error');
    }
  }, [user]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!user) return;
    try {
      const ref = collection(db, 'users', user.uid, 'categories');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load categories', 'error');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchTransactions(), fetchAccounts(), fetchCategories()])
        .finally(() => setLoading(false));
    }
  }, [user, fetchTransactions, fetchAccounts, fetchCategories]);

  // Handle category created inline
  const handleCategoryCreated = (newCat) => {
    setCategories(prev => [...prev, newCat]);
  };

  // Open modal for new transaction
  const openModal = (tab = 'income') => {
    setModalTab(tab);
    setEditingTransaction(null);
    setFormData({
      type: tab === 'income' ? 'Income' : 'Expense',
      amount: '',
      accountId: accountsWithAvailable[0]?.id || '',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      chargeAmount: '',
      chargeNote: '',
    });
    setTransferData({
      amount: '',
      fromAccountId: accountsWithAvailable[0]?.id || '',
      toAccountId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      chargeAmount: '',
      chargeNote: '',
    });
    setShowModal(true);
  };

  // Handle edit
  const handleEditClick = (txn) => {
    setEditingTransaction(txn);
    if (txn.type === 'Transfer') {
      setModalTab('transfer');
      setTransferData({
        amount: txn.amount.toString(),
        fromAccountId: txn.fromAccountId || '',
        toAccountId: txn.toAccountId || '',
        description: txn.description || '',
        date: txn.date || new Date().toISOString().split('T')[0],
        chargeAmount: txn.chargeAmount?.toString() || '',
        chargeNote: txn.chargeNote || '',
      });
    } else {
      setModalTab(txn.type.toLowerCase());
      setFormData({
        type: txn.type,
        amount: txn.amount.toString(),
        accountId: txn.accountId,
        categoryId: txn.categoryId || '',
        description: txn.description || '',
        date: txn.date || new Date().toISOString().split('T')[0],
        chargeAmount: txn.chargeAmount?.toString() || '',
        chargeNote: txn.chargeNote || '',
      });
    }
    setShowModal(true);
  };

  // Handle delete
  const handleDeleteClick = (txn) => {
    setTransactionToDelete(txn);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    try {
      const txn = transactionToDelete;
      const txnRef = doc(db, 'users', user.uid, 'transactions', txn.id);
      
      // Reverse the transaction
      if (txn.type === 'Transfer') {
        const fromAcc = accounts.find(a => a.id === txn.fromAccountId);
        const toAcc = accounts.find(a => a.id === txn.toAccountId);
        if (fromAcc) await updateAccount(user.uid, txn.fromAccountId, { balance: fromAcc.balance + parseFloat(txn.amount) });
        if (toAcc) await updateAccount(user.uid, txn.toAccountId, { balance: toAcc.balance - parseFloat(txn.amount) });
        
        if (txn.chargeAmount && parseFloat(txn.chargeAmount) > 0) {
          if (fromAcc) await updateAccount(user.uid, txn.fromAccountId, { balance: fromAcc.balance + parseFloat(txn.chargeAmount) });
        }
      } else {
        const acc = accounts.find(a => a.id === txn.accountId);
        if (acc) {
          const delta = txn.type === 'Income' 
            ? -(parseFloat(txn.amount) || 0) 
            : (parseFloat(txn.amount) || 0);
          await updateAccount(user.uid, txn.accountId, { balance: acc.balance + delta });
          
          if (txn.chargeAmount && parseFloat(txn.chargeAmount) > 0) {
            await updateAccount(user.uid, txn.accountId, { balance: acc.balance + parseFloat(txn.chargeAmount) });
          }
        }
      }

      // If jewellery sale, unmark it
      if (txn.source === 'jewellery_sale' && txn.jewelleryId) {
        await unmarkSold(user.uid, txn.jewelleryId);
      }

      await deleteDoc(txnRef);
      showToast('Transaction deleted', 'success');
      fetchTransactions();
      fetchAccounts();
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete transaction', 'error');
    }
  };

  // Handle submit (Income/Expense)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }

    const chargeAmt = parseFloat(formData.chargeAmount || 0);
    if (chargeAmt < 0) {
      showToast('Charge amount cannot be negative', 'error');
      return;
    }

    setSubmitting(true);
    setCheckingBalance(true);

    try {
      const acc = accountsWithAvailable.find(a => a.id === formData.accountId);
      if (!acc) {
        showToast('Account not found', 'error');
        setSubmitting(false);
        setCheckingBalance(false);
        return;
      }

      const availBal = acc.availableBalance || 0;
      if (formData.type === 'Expense' && (amt + chargeAmt) > availBal) {
        showToast(`Insufficient balance. Available: ৳${availBal.toLocaleString()}`, 'error');
        setSubmitting(false);
        setCheckingBalance(false);
        return;
      }

      setCheckingBalance(false);

      if (editingTransaction) {
        // Update existing
        const oldTxn = editingTransaction;
        const txnRef = doc(db, 'users', user.uid, 'transactions', oldTxn.id);
        
        // Reverse old
        const oldAcc = accounts.find(a => a.id === oldTxn.accountId);
        if (oldAcc) {
          const reverseDelta = oldTxn.type === 'Income' ? -parseFloat(oldTxn.amount) : parseFloat(oldTxn.amount);
          await updateAccount(user.uid, oldTxn.accountId, { balance: oldAcc.balance + reverseDelta });
          
          if (oldTxn.chargeAmount && parseFloat(oldTxn.chargeAmount) > 0) {
            await updateAccount(user.uid, oldTxn.accountId, { balance: oldAcc.balance + parseFloat(oldTxn.chargeAmount) });
          }
        }

        // Apply new
        const newDelta = formData.type === 'Income' ? amt : -amt;
        await updateAccount(user.uid, formData.accountId, { balance: acc.balance + newDelta });
        
        if (chargeAmt > 0) {
          await updateAccount(user.uid, formData.accountId, { balance: acc.balance - chargeAmt });
        }

        // Handle charge category
        let chargeCatId = null;
        if (chargeAmt > 0) {
          chargeCatId = await getOrCreateSystemCategory(user.uid, 'Fees & Charges', 'Expense', '#F97316');
        }

        await updateDoc(txnRef, {
          type: formData.type,
          amount: amt,
          accountId: formData.accountId,
          categoryId: formData.categoryId,
          description: formData.description,
          date: formData.date,
          chargeAmount: chargeAmt || 0,
          chargeNote: formData.chargeNote || '',
          chargeCategoryId: chargeCatId,
          updatedAt: serverTimestamp(),
        });

        showToast('Transaction updated', 'success');
      } else {
        // Create new
        const newDelta = formData.type === 'Income' ? amt : -amt;
        await updateAccount(user.uid, formData.accountId, { balance: acc.balance + newDelta });
        
        if (chargeAmt > 0) {
          await updateAccount(user.uid, formData.accountId, { balance: acc.balance - chargeAmt });
        }

        let chargeCatId = null;
        if (chargeAmt > 0) {
          chargeCatId = await getOrCreateSystemCategory(user.uid, 'Fees & Charges', 'Expense', '#F97316');
        }

        await addDoc(collection(db, 'users', user.uid, 'transactions'), {
          type: formData.type,
          amount: amt,
          accountId: formData.accountId,
          categoryId: formData.categoryId,
          description: formData.description,
          date: formData.date,
          chargeAmount: chargeAmt || 0,
          chargeNote: formData.chargeNote || '',
          chargeCategoryId: chargeCatId,
          createdAt: serverTimestamp(),
        });

        showToast(`${formData.type} added!`, 'success');
      }

      fetchTransactions();
      fetchAccounts();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to save transaction', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle transfer submit
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const amt = parseFloat(transferData.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }

    if (!transferData.fromAccountId || !transferData.toAccountId) {
      showToast('Select both accounts', 'error');
      return;
    }

    if (transferData.fromAccountId === transferData.toAccountId) {
      showToast('From and To accounts must be different', 'error');
      return;
    }

    const chargeAmt = parseFloat(transferData.chargeAmount || 0);
    if (chargeAmt < 0) {
      showToast('Charge amount cannot be negative', 'error');
      return;
    }

    setSubmitting(true);
    setCheckingBalance(true);

    try {
      const fromAcc = accountsWithAvailable.find(a => a.id === transferData.fromAccountId);
      const toAcc = accounts.find(a => a.id === transferData.toAccountId);

      if (!fromAcc || !toAcc) {
        showToast('Account not found', 'error');
        setSubmitting(false);
        setCheckingBalance(false);
        return;
      }

      const availBal = fromAcc.availableBalance || 0;
      if ((amt + chargeAmt) > availBal) {
        showToast(`Insufficient balance. Available: ৳${availBal.toLocaleString()}`, 'error');
        setSubmitting(false);
        setCheckingBalance(false);
        return;
      }

      setCheckingBalance(false);

      if (editingTransaction) {
        // Update existing transfer
        const oldTxn = editingTransaction;
        const txnRef = doc(db, 'users', user.uid, 'transactions', oldTxn.id);
        
        // Reverse old
        const oldFrom = accounts.find(a => a.id === oldTxn.fromAccountId);
        const oldTo = accounts.find(a => a.id === oldTxn.toAccountId);
        if (oldFrom) await updateAccount(user.uid, oldTxn.fromAccountId, { balance: oldFrom.balance + parseFloat(oldTxn.amount) });
        if (oldTo) await updateAccount(user.uid, oldTxn.toAccountId, { balance: oldTo.balance - parseFloat(oldTxn.amount) });
        
        if (oldTxn.chargeAmount && parseFloat(oldTxn.chargeAmount) > 0) {
          if (oldFrom) await updateAccount(user.uid, oldTxn.fromAccountId, { balance: oldFrom.balance + parseFloat(oldTxn.chargeAmount) });
        }

        // Apply new
        await updateAccount(user.uid, transferData.fromAccountId, { balance: fromAcc.balance - amt });
        await updateAccount(user.uid, transferData.toAccountId, { balance: toAcc.balance + amt });
        
        if (chargeAmt > 0) {
          await updateAccount(user.uid, transferData.fromAccountId, { balance: fromAcc.balance - chargeAmt });
        }

        let chargeCatId = null;
        if (chargeAmt > 0) {
          chargeCatId = await getOrCreateSystemCategory(user.uid, 'Fees & Charges', 'Expense', '#F97316');
        }

        await updateDoc(txnRef, {
          type: 'Transfer',
          amount: amt,
          fromAccountId: transferData.fromAccountId,
          toAccountId: transferData.toAccountId,
          description: transferData.description,
          date: transferData.date,
          chargeAmount: chargeAmt || 0,
          chargeNote: transferData.chargeNote || '',
          chargeCategoryId: chargeCatId,
          updatedAt: serverTimestamp(),
        });

        showToast('Transfer updated', 'success');
      } else {
        // Create new transfer
        await updateAccount(user.uid, transferData.fromAccountId, { balance: fromAcc.balance - amt });
        await updateAccount(user.uid, transferData.toAccountId, { balance: toAcc.balance + amt });
        
        if (chargeAmt > 0) {
          await updateAccount(user.uid, transferData.fromAccountId, { balance: fromAcc.balance - chargeAmt });
        }

        let chargeCatId = null;
        if (chargeAmt > 0) {
          chargeCatId = await getOrCreateSystemCategory(user.uid, 'Fees & Charges', 'Expense', '#F97316');
        }

        await addDoc(collection(db, 'users', user.uid, 'transactions'), {
          type: 'Transfer',
          amount: amt,
          fromAccountId: transferData.fromAccountId,
          toAccountId: transferData.toAccountId,
          description: transferData.description,
          date: transferData.date,
          chargeAmount: chargeAmt || 0,
          chargeNote: transferData.chargeNote || '',
          chargeCategoryId: chargeCatId,
          createdAt: serverTimestamp(),
        });

        showToast('Transfer completed!', 'success');
      }

      fetchTransactions();
      fetchAccounts();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to process transfer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // NEW: Handle transaction click to show details
  const handleTransactionClick = (txn) => {
    setSelectedTransaction(txn);
    setShowDetailModal(true);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const acc = accounts.find(a => a.id === txn.accountId);
    const cat = categories.find(c => c.id === txn.categoryId);
    const fromAcc = accounts.find(a => a.id === txn.fromAccountId);
    const toAcc = accounts.find(a => a.id === txn.toAccountId);
    
    return (
      txn.description?.toLowerCase().includes(q) ||
      acc?.name?.toLowerCase().includes(q) ||
      cat?.name?.toLowerCase().includes(q) ||
      fromAcc?.name?.toLowerCase().includes(q) ||
      toAcc?.name?.toLowerCase().includes(q) ||
      txn.amount?.toString().includes(q) ||
      txn.type?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <Receipt size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
                <p className="text-sm text-gray-500">Manage your income, expenses & transfers</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => openModal('income')}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95 group">
              <ArrowDownCircle size={20} className="mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold uppercase tracking-wide">Income</p>
            </button>
            <button onClick={() => openModal('expense')}
              className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95 group">
              <ArrowUpCircle size={20} className="mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold uppercase tracking-wide">Expense</p>
            </button>
            <button onClick={() => openModal('transfer')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95 group">
              <ArrowRightLeft size={20} className="mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold uppercase tracking-wide">Transfer</p>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h2>
          
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'No transactions match your search' : 'No transactions yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map(txn => {
                const account = accounts.find(a => a.id === txn.accountId);
                const category = categories.find(c => c.id === txn.categoryId);
                const fromAccount = accounts.find(a => a.id === txn.fromAccountId);
                const toAccount = accounts.find(a => a.id === txn.toAccountId);
                
                const isTransfer = txn.type === 'Transfer';
                const isIncome = txn.type === 'Income';

                return (
                  <div
                    key={txn.id}
                    onClick={() => handleTransactionClick(txn)}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group hover:border-gray-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2.5 rounded-lg ${
                          isTransfer ? 'bg-blue-100' : isIncome ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isTransfer ? (
                            <ArrowRightLeft size={18} className="text-blue-600" />
                          ) : isIncome ? (
                            <ArrowDownCircle size={18} className="text-green-600" />
                          ) : (
                            <ArrowUpCircle size={18} className="text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {isTransfer ? (
                              <p className="font-semibold text-sm text-gray-900 truncate">
                                {fromAccount?.name || 'Unknown'} → {toAccount?.name || 'Unknown'}
                              </p>
                            ) : (
                              <>
                                {category && (
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: category.color }} />
                                )}
                                <p className="font-semibold text-sm text-gray-900 truncate">
                                  {category?.name || 'Unknown Category'}
                                </p>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="truncate">
                              {isTransfer ? (txn.description || 'Transfer') : (account?.name || 'Unknown')}
                            </span>
                            {txn.description && !isTransfer && (
                              <>
                                <span>•</span>
                                <span className="truncate">{txn.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-3">
                        <div className="text-right">
                          <p className={`font-bold text-sm ${
                            isTransfer ? 'text-blue-600' : isIncome ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isTransfer ? '' : isIncome ? '+' : '-'}৳{parseFloat(txn.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          {txn.chargeAmount && parseFloat(txn.chargeAmount) > 0 && (
                            <p className="text-[10px] text-amber-600 font-semibold">
                              +৳{parseFloat(txn.chargeAmount).toLocaleString()} fee
                            </p>
                          )}
                        </div>
                        
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* NEW: Transaction Detail Modal */}
      {showDetailModal && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          accounts={accounts}
          categories={categories}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setModalTab('income')}
                  className={`flex-1 py-2.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                    modalTab === 'income' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('expense')}
                  className={`flex-1 py-2.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                    modalTab === 'expense' ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('transfer')}
                  className={`flex-1 py-2.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                    modalTab === 'transfer' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Transfer
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={modalTab === 'transfer' ? handleTransferSubmit : handleSubmit}>
                {modalTab === 'transfer' ? (
                  /* ── Transfer form ── */
                  <>
                    <div className="space-y-1 mb-4">
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

      {/* Add animations to your global CSS */}
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
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
