// src/app/dashboard/riba/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  collection, getDocs, query, orderBy, where,
  updateDoc, addDoc, doc, Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAccounts, updateAccount, generateId } from '@/lib/firestoreCollections';
import { showToast } from '@/components/Toast';
import {
  AlertTriangle, CheckCircle2, Loader2, X, Heart,
  Info, TrendingDown, Wallet, BookOpen, ChevronRight,
  AlertCircle, HandCoins, Plus, Calendar, ArrowUpRight,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────
const fmtBDT = (n) => '৳' + Number(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 });
const fmtDate = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Sadaqah modal ─────────────────────────────────────────────────────────
function SadaqahModal({ transaction, accounts, onDone, onClose }) {
  const { user }    = useAuth();
  const [amount,    setAmount]    = useState(String(transaction.amount));
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [note,      setNote]      = useState('');
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);
  const [saving,    setSaving]    = useState(false);

  const parsed  = parseFloat(amount) || 0;
  const account = accounts.find(a => a.id === accountId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parsed <= 0)  { showToast('Enter sadaqah amount', 'error'); return; }
    if (!accountId)   { showToast('Select an account', 'error'); return; }
    if (!account)     { showToast('Invalid account', 'error'); return; }
    if (parsed > account.balance) {
      showToast(`Insufficient balance in ${account.name}`, 'error'); return;
    }

    setSaving(true);
    try {
      // 1. Find or create "Sadaqah / Charity" expense category
      const catRef   = collection(db, 'users', user.uid, 'categories');
      const catQuery = query(catRef, where('name', '==', 'Sadaqah / Charity'));
      const catSnap  = await getDocs(catQuery);
      let catId;
      if (!catSnap.empty) {
        catId = catSnap.docs[0].id;
      } else {
        const newCat = await addDoc(catRef, {
          name:      'Sadaqah / Charity',
          type:      'Expense',
          color:     '#10B981',
          categoryId: generateId(),
          isSystem:  true,
          createdAt: serverTimestamp(),
        });
        catId = newCat.id;
      }

      // 2. Record expense transaction for sadaqah
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type:        'Expense',
        amount:      parsed,
        accountId,
        categoryId:  catId,
        description: note || `Sadaqah — purifying Riba from "${transaction.description || 'Interest'}"`,
        date,
        isSadaqah:   true,
        ribaRefId:   transaction.id,
        createdAt:   Timestamp.now(),
      });

      // 3. Deduct from account
      await updateAccount(user.uid, accountId, { balance: account.balance - parsed });

      // 4. Mark the riba transaction as sadaqahDone = true
      await updateDoc(doc(db, 'users', user.uid, 'transactions', transaction.id), {
        sadaqahDone:   true,
        sadaqahAmount: parsed,
        sadaqahDate:   date,
        updatedAt:     Timestamp.now(),
      });

      showToast('Sadaqah recorded. May Allah accept it. 🤲', 'success');
      onDone();
    } catch (err) {
      console.error(err);
      showToast('Failed to record sadaqah', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-white" />
              <h2 className="font-bold text-white">Record Sadaqah</h2>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-emerald-100 text-xs mt-1">Donate to purify the Riba income</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Source reference */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-amber-600 uppercase mb-0.5">Riba Source</p>
            <p className="text-sm font-semibold text-gray-800">{transaction.description || 'Interest Income'}</p>
            <p className="text-xs text-gray-500">{fmtDate(transaction.date)} · {fmtBDT(transaction.amount)} received</p>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Sadaqah Amount (৳)</label>
            <input type="number" step="0.01" min="0.01"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-emerald-200 bg-emerald-50 rounded-xl text-xl font-bold text-emerald-700 text-center outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="0.00" required />
            <p className="text-[10px] text-gray-400 text-center mt-1">
              Full amount: {fmtBDT(transaction.amount)} — you may donate any amount
            </p>
          </div>

          {/* Account */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">From Account</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-400" required>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} (৳{(a.balance||0).toLocaleString()})</option>
              ))}
            </select>
            {account && parsed > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Balance after: <span className={parsed > account.balance ? 'text-red-500 font-bold' : 'text-gray-600'}>
                  {fmtBDT(account.balance - parsed)}
                </span>
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Date of Donation</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400" required />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Note (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Donated to masjid…"
              className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>

          {/* Islamic note */}
          <div className="flex gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Give this in Sadaqah without expecting any reward (Sawab) from Allah. The intention is to rid yourself of what is impermissible, not to gain reward.
            </p>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
              {saving ? 'Recording…' : 'Record Sadaqah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function RibaPage() {
  const { user } = useAuth();

  const [ribaTxns,   setRibaTxns]   = useState([]);
  const [accounts,   setAccounts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [sadaqahFor, setSadaqahFor] = useState(null); // transaction to donate for

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [accResult, catSnap] = await Promise.all([
        getAccounts(user.uid),
        getDocs(collection(db, 'users', user.uid, 'categories')),
      ]);

      const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (accResult.success) setAccounts(accResult.accounts);
      setCategories(cats);

      // Find category IDs whose name contains "riba" or "interest"
      const ribaCatIds = cats
        .filter(c => {
          const n = (c.name || '').toLowerCase();
          return n.includes('riba') || n.includes('interest');
        })
        .map(c => c.id);

      // Query 1: transactions explicitly flagged isRiba = true
      let ribaByFlag = [];
      try {
        const snap = await getDocs(query(
          collection(db, 'users', user.uid, 'transactions'),
          where('isRiba', '==', true),
          orderBy('date', 'desc')
        ));
        ribaByFlag = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch {
        // fallback without orderBy (index may not exist yet)
        try {
          const snap = await getDocs(query(
            collection(db, 'users', user.uid, 'transactions'),
            where('isRiba', '==', true)
          ));
          ribaByFlag = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch { /* ignore */ }
      }

      // Query 2: Income transactions in a Riba/Interest category (no isRiba flag on old records)
      let ribaByCat = [];
      for (const catId of ribaCatIds) {
        try {
          const snap = await getDocs(query(
            collection(db, 'users', user.uid, 'transactions'),
            where('categoryId', '==', catId),
            where('type', '==', 'Income')
          ));
          ribaByCat.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch { /* ignore */ }
      }

      // Merge — deduplicate by id, flag ones found by category (so the page treats them as riba)
      const seen = new Set(ribaByFlag.map(t => t.id));
      for (const t of ribaByCat) {
        if (!seen.has(t.id)) {
          ribaByFlag.push({ ...t, isRiba: true }); // treat as riba for display
          seen.add(t.id);
        }
      }

      // Sort newest first
      ribaByFlag.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setRibaTxns(ribaByFlag);

    } catch (err) {
      console.error(err);
      showToast('Failed to load Riba records', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalRiba       = ribaTxns.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalPurified   = ribaTxns.filter(t => t.sadaqahDone).reduce((s, t) => s + Number(t.sadaqahAmount || t.amount || 0), 0);
  const totalUnpurified = ribaTxns.filter(t => !t.sadaqahDone).reduce((s, t) => s + Number(t.amount || 0), 0);
  const unpurifiedCount = ribaTxns.filter(t => !t.sadaqahDone).length;

  const getCategoryName = id => categories.find(c => c.id === id)?.name || 'Interest';
  const getAccountName  = id => accounts.find(a => a.id === id)?.name || 'Unknown';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Riba Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track interest income and purify it through Sadaqah
          </p>
        </div>
      </div>

      {/* ── Islamic context banner ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">Understanding Riba in Modern Finance</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Interest (Riba) is prohibited in Islam, but it is embedded in today's financial system — bank savings accounts, fixed deposits, bonds, and more. When you receive it, the Islamic ruling is to <strong>not use it for personal benefit</strong>. Instead, donate it as Sadaqah to remove it from your wealth — <em>without expecting any reward (Sawab)</em> from Allah, purely to rid yourself of what is impermissible. Recording these transactions helps you stay accountable.
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500 font-medium">Total Riba Received</span>
          </div>
          <p className="text-xl font-bold text-amber-700">{fmtBDT(totalRiba)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{ribaTxns.length} transaction{ribaTxns.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 font-medium">Unpurified (Pending)</span>
          </div>
          <p className="text-xl font-bold text-red-600">{fmtBDT(totalUnpurified)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{unpurifiedCount} item{unpurifiedCount !== 1 ? 's' : ''} need Sadaqah</p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500 font-medium">Donated as Sadaqah</span>
          </div>
          <p className="text-xl font-bold text-emerald-700">{fmtBDT(totalPurified)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {ribaTxns.filter(t => t.sadaqahDone).length} item{ribaTxns.filter(t => t.sadaqahDone).length !== 1 ? 's' : ''} purified
          </p>
        </div>
      </div>

      {/* ── Unpurified warning ── */}
      {unpurifiedCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-800">
            You have <strong>{fmtBDT(totalUnpurified)}</strong> in unpurified Riba.
            Please donate it as Sadaqah to cleanse your wealth.
          </p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-gray-500 text-sm">Loading Riba records…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && ribaTxns.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-4 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">No Riba income recorded</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm">
              When you record income transactions under the <strong>"Interest / Riba"</strong> category,
              they will appear here for tracking and Sadaqah.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            Go to <strong className="mx-1">Transactions → Add → Income</strong> and select the <strong className="ml-1">Interest / Riba</strong> category
          </div>
        </div>
      )}

      {/* ── Transaction list ── */}
      {!loading && ribaTxns.length > 0 && (
        <div className="space-y-3">
          {/* Unpurified first */}
          {ribaTxns.filter(t => !t.sadaqahDone).length > 0 && (
            <>
              <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider px-1">
                Pending Purification ({ribaTxns.filter(t => !t.sadaqahDone).length})
              </h2>
              {ribaTxns.filter(t => !t.sadaqahDone).map(t => (
                <RibaCard
                  key={t.id}
                  transaction={t}
                  getCategoryName={getCategoryName}
                  getAccountName={getAccountName}
                  onSadaqah={() => setSadaqahFor(t)}
                />
              ))}
            </>
          )}

          {/* Purified */}
          {ribaTxns.filter(t => t.sadaqahDone).length > 0 && (
            <>
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider px-1 pt-2">
                Purified ✓ ({ribaTxns.filter(t => t.sadaqahDone).length})
              </h2>
              {ribaTxns.filter(t => t.sadaqahDone).map(t => (
                <RibaCard
                  key={t.id}
                  transaction={t}
                  getCategoryName={getCategoryName}
                  getAccountName={getAccountName}
                  onSadaqah={null}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Sadaqah modal ── */}
      {sadaqahFor && (
        <SadaqahModal
          transaction={sadaqahFor}
          accounts={accounts}
          onDone={() => { setSadaqahFor(null); loadAll(); }}
          onClose={() => setSadaqahFor(null)}
        />
      )}
    </div>
  );
}

// ─── Riba transaction card ─────────────────────────────────────────────────
function RibaCard({ transaction: t, getCategoryName, getAccountName, onSadaqah }) {
  const isPurified = t.sadaqahDone;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${
      isPurified ? 'border-emerald-200' : 'border-amber-200'
    }`}>
      {isPurified && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-1.5 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700">Purified via Sadaqah</span>
          <span className="text-xs text-emerald-500 ml-auto">{fmtDate(t.sadaqahDate)} · {fmtBDT(t.sadaqahAmount)}</span>
        </div>
      )}

      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isPurified ? 'bg-emerald-50' : 'bg-amber-50'
          }`}>
            {isPurified
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              : <AlertTriangle className="w-5 h-5 text-amber-500" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">
                {t.description || getCategoryName(t.categoryId)}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                RIBA
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{getAccountName(t.accountId)} · {fmtDate(t.date)}</p>
            {t.description && (
              <p className="text-xs text-gray-400 mt-0.5">{getCategoryName(t.categoryId)}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <p className="text-base font-bold text-amber-700">+{fmtBDT(t.amount)}</p>
          {!isPurified && onSadaqah && (
            <button
              onClick={onSadaqah}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
            >
              <Heart className="w-3.5 h-3.5" />
              Give Sadaqah
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
