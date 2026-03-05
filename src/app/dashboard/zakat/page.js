// src/app/dashboard/zakat/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAccounts } from '@/lib/firestoreCollections';
import { getJewellery } from '@/lib/jewelleryCollections';
import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, orderBy, serverTimestamp, where, getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateId } from '@/lib/firestoreCollections';
import {
  gregorianToHijri,
  addOneHijriYear,
  daysUntilHijriAnniversary,
  hasOneHijriYearPassed,
  calculateZakat,
  formatHijriDate,
  ZAKAT_STATUS,
  calculateZakatableWealth,
  generateInstallmentSchedule,
} from '@/lib/zakatUtils';
import {
  recordZakatPayment,
  setupZakatInstallments,
  payZakatInstallment,
  getActivePaymentPlan,
  getZakatHistory,
  autoCompleteCycleIfYearPassed,
} from '@/lib/zakatMonitoring';
import { useSettings, formatAmount } from '@/hooks/useSettings';
import { showToast } from '@/components/Toast';
import {
  Star, Wallet, Calendar, Clock, CheckCircle2, AlertCircle, Gem,
  Settings, History, ChevronDown, ChevronUp,
  CreditCard, CalendarDays, X, Loader2, Info, Banknote,
  Building2, Smartphone, Coins, HandCoins, TrendingUp, Target,
  Minus, ArrowRight, Check, AlertTriangle, CalendarClock,
  Bell, RefreshCw, Sparkles, PlayCircle, ToggleLeft, ToggleRight, Ban,
} from 'lucide-react';
import NisabSettingsModal from '@/components/zakat/NisabSettingsModal';

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPER — always dd/mm/yyyy
// ─────────────────────────────────────────────────────────────────────────────
const fmtDate = (isoOrDate) => {
  if (!isoOrDate) return '—';
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (isNaN(d.getTime())) return isoOrDate;
    const dd   = String(d.getDate()).padStart(2, '0');
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch { return String(isoOrDate); }
};

// ─────────────────────────────────────────────────────────────────────────────
// START / EDIT CYCLE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function StartCycleModal({ totalWealth, nisabThreshold, fmt, onConfirm, onClose, editMode = false, currentStartDate = null }) {
  const today      = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(currentStartDate || today);
  const [saving,    setSaving]    = useState(false);

  const hijriPreview = (() => {
    try { return gregorianToHijri(startDate); } catch { return null; }
  })();

  const isBackdated   = startDate < today;
  const alreadyPassed = startDate ? hasOneHijriYearPassed(startDate) : false;

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(startDate);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: 'min(95vh, 640px)' }}>

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CalendarClock className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">
                  {editMode ? 'Correct Cycle Start Date' : 'Start Zakat Monitoring'}
                </h2>
                <p className="text-xs text-gray-500">
                  {editMode ? 'Update when your Nisab cycle actually began' : 'Set when your Nisab cycle began'}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* Context explanation */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 flex-shrink-0" />
              {editMode ? 'Correcting your cycle start date' : 'Already a Sahib al-Mal?'}
            </p>
            <p>
              {editMode
                ? 'The app started your cycle from today, but if your wealth crossed Nisab on an earlier date, set that actual date here. This corrects your remaining days and Zakat due date.'
                : "If your wealth was already above Nisab before you started using this app, set the actual date your wealth first crossed the Nisab threshold — not today's date. This ensures your one Hijri year is counted correctly."}
            </p>
          </div>

          {/* Wealth summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">Current Wealth</p>
              <p className="font-bold text-gray-900">{totalWealth > 0 ? fmt(totalWealth) : <span className="text-gray-400 font-normal text-sm">Not calculated yet</span>}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">Nisab Threshold</p>
              {nisabThreshold > 0
                ? <p className="font-bold text-emerald-700">{fmt(nisabThreshold)}</p>
                : <p className="text-xs text-amber-600 font-medium mt-0.5">Not set — update in Nisab Settings</p>
              }
            </div>
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cycle Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              max={today}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 focus:border-emerald-500 rounded-xl text-sm font-medium outline-none transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Cannot be a future date. Leave as today if wealth just reached Nisab.
            </p>
          </div>

          {/* Hijri preview */}
          {hijriPreview && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs text-emerald-600 font-medium">Hijri Start Date</p>
                  <p className="text-sm font-bold text-emerald-900">{formatHijriDate(hijriPreview)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-600 font-medium">
                    {alreadyPassed ? 'Year End' : 'Zakat Due On'}
                  </p>
                  <p className="text-sm font-bold text-emerald-900">
                    {(() => {
                      try { return fmtDate(addOneHijriYear(startDate)); }
                      catch { return '—'; }
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Backdated warning */}
          {isBackdated && !alreadyPassed && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Backdating to <strong>{fmtDate(startDate)}</strong> — the one Hijri year countdown
                will use this date. You will have{' '}
                <strong>{daysUntilHijriAnniversary(startDate)} days remaining</strong> from today.
              </p>
            </div>
          )}

          {/* Already passed warning */}
          {alreadyPassed && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-800 leading-relaxed">
                <p className="font-semibold mb-0.5">One Hijri year has already passed!</p>
                <p>
                  Using <strong>{fmtDate(startDate)}</strong> means the year is already complete.
                  If your wealth was ≥ Nisab on that end date, <strong>Zakat is immediately due</strong>.
                  The cycle will be marked as due right away.
                </p>
              </div>
            </div>
          )}

          {/* Today shortcut */}
          {startDate !== today && (
            <button
              onClick={() => setStartDate(today)}
              className="w-full py-2 text-xs font-medium text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded-xl transition-colors"
            >
              Reset to today
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || !startDate}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Saving…' : alreadyPassed
              ? (editMode ? 'Update & Mark Due' : 'Start & Mark Due')
              : (editMode ? 'Update Start Date' : 'Start Monitoring')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NISAB REMINDER BANNER
// Shown when daysRemaining ≤ 3 (within 3 days of year end)
// ─────────────────────────────────────────────────────────────────────────────
function NisabReminderBanner({ daysRemaining, yearEndDate, onOpenSettings }) {
  const isUrgent  = daysRemaining <= 1;
  const isWarning = daysRemaining <= 3;
  if (!isWarning) return null;

  return (
    <div className={`rounded-xl border p-4 ${
      isUrgent
        ? 'bg-red-50 border-red-300'
        : 'bg-amber-50 border-amber-300'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUrgent ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          <Bell className={`w-4 h-4 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${isUrgent ? 'text-red-900' : 'text-amber-900'}`}>
            {isUrgent
              ? '⚠️ Zakat Year Ends Tomorrow — Update Nisab Now!'
              : `🔔 Zakat Year Ends in ${daysRemaining} Days — Refresh Nisab`}
          </p>
          <p className={`text-xs mt-1 leading-relaxed ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
            Your Hijri year completes on <strong>{fmtDate(yearEndDate)}</strong>. For an accurate
            Zakat calculation, please update the silver price in Nisab Settings before your year
            ends. The system will also try to auto-fetch the latest price at year-end, but a
            manual refresh ensures accuracy.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Update Nisab Settings
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ${
              isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              Auto-fetch will run at year-end as backup
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ZakatPage() {
  const { user } = useAuth();
  const settings = useSettings();

  const [accounts,        setAccounts]        = useState([]);
  const [lendings,        setLendings]        = useState([]);
  const [loans,           setLoans]           = useState([]);
  const [investments,     setInvestments]     = useState([]);
  const [goals,           setGoals]           = useState([]);
  const [jewellery,       setJewellery]       = useState([]);
  const [ribaTransactions, setRibaTransactions] = useState([]);

  const [nisabThreshold,     setNisabThreshold]     = useState(0);
  const [silverPricePerGram, setSilverPricePerGram] = useState(0);
  const [silverPricePerVori, setSilverPricePerVori] = useState(0);
  const [priceUnit,          setPriceUnit]          = useState('gram');
  const [goldPricePerGram,   setGoldPricePerGram]   = useState(0);
  const [goldPricePerVori,   setGoldPricePerVori]   = useState(0);
  const [applyDeduction,     setApplyDeduction]     = useState(false);

  const [activeCycle,     setActiveCycle]     = useState(null);
  const [dueCycle,        setDueCycle]        = useState(null);
  const [cycleHistory,    setCycleHistory]    = useState([]);
  const [wealthBreakdown, setWealthBreakdown] = useState(null);
  const [activePayment,   setActivePayment]   = useState(null);
  const [zakatPayments,   setZakatPayments]   = useState([]);

  const [loading,             setLoading]             = useState(true);
  const [showSettingsModal,   setShowSettingsModal]   = useState(false);
  const [showPaymentModal,    setShowPaymentModal]    = useState(false);
  const [showStartCycleModal, setShowStartCycleModal] = useState(false);
  const [editStartCycleMode,  setEditStartCycleMode]  = useState(false);
  const [activeTab,           setActiveTab]           = useState('overview');
  const [expandedCycleId,     setExpandedCycleId]     = useState(null);
  const [autoCheckDone,       setAutoCheckDone]       = useState(false);

  const loadAllAssets = useCallback(async () => {
    try {
      const [accResult, lendSnap, loanSnap, invSnap, goalSnap, jewResult, txSnap, catSnap] = await Promise.all([
        getAccounts(user.uid),
        getDocs(collection(db, 'users', user.uid, 'lendings')),
        getDocs(collection(db, 'users', user.uid, 'loans')),
        getDocs(collection(db, 'users', user.uid, 'investments')),
        getDocs(collection(db, 'users', user.uid, 'financialGoals')),
        getJewellery(user.uid),
        getDocs(collection(db, 'users', user.uid, 'transactions')),
        getDocs(collection(db, 'users', user.uid, 'categories')),
      ]);
      const accs  = accResult.success ? accResult.accounts : [];
      const jws   = jewResult.success ? jewResult.items    : [];
      const lends = lendSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const lns   = loanSnap.docs.map(d  => ({ id: d.id, ...d.data() }));
      const invs  = invSnap.docs.map(d   => ({ id: d.id, ...d.data() }));
      const gls   = goalSnap.docs.map(d  => ({ id: d.id, ...d.data() }));
      const cats  = catSnap.docs.map(d   => ({ id: d.id, ...d.data() }));
      // Riba = flagged explicitly OR category name is 'interest' or 'riba' (case-insensitive)
      const ribaCategories = new Set(
        cats
          .filter(c => c.isRiba === true || /^(interest|riba)$/i.test(c.name || ''))
          .map(c => c.id)
      );
      const ribas = txSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t => t.isRiba === true || ribaCategories.has(t.categoryId));
      setAccounts(accs); setLendings(lends); setLoans(lns);
      setInvestments(invs); setGoals(gls); setJewellery(jws); setRibaTransactions(ribas);
      const breakdown = calculateZakatableWealth({ accounts: accs, lendings: lends, loans: lns, investments: invs, goals: gls, jewellery: jws, ribaTransactions: ribas });
      setWealthBreakdown(breakdown);
      return breakdown;
    } catch (err) { console.error('loadAllAssets:', err); return null; }
  }, [user]);

  const loadNisabSettings = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'settings'));
      let thresh = 0;
      snap.forEach(d => {
        const data = d.data();
        if (data.nisabThreshold     !== undefined) { setNisabThreshold(data.nisabThreshold); thresh = data.nisabThreshold; }
        if (data.silverPricePerGram !== undefined) setSilverPricePerGram(data.silverPricePerGram);
        if (data.silverPricePerVori !== undefined) setSilverPricePerVori(data.silverPricePerVori);
        if (data.goldPricePerGram   !== undefined) setGoldPricePerGram(data.goldPricePerGram);
        if (data.goldPricePerVori   !== undefined) setGoldPricePerVori(data.goldPricePerVori);
        if (data.priceUnit          !== undefined) setPriceUnit(data.priceUnit);
        if (data.applyDeduction     !== undefined) setApplyDeduction(data.applyDeduction);
      });
      return thresh;
    } catch (err) { console.error('loadNisabSettings:', err); return 0; }
  }, [user]);

  const loadZakatCycles = useCallback(async () => {
    try {
      const q    = query(collection(db, 'users', user.uid, 'zakatCycles'), orderBy('startDate', 'desc'));
      const snap = await getDocs(q);
      const cycles = [];
      let foundActive = false;
      let foundDue    = null;
      for (const docSnap of snap.docs) {
        const data = { id: docSnap.id, ...docSnap.data() };
        cycles.push(data);
        if (data.status === 'active' && !foundActive) {
          setActiveCycle(data); foundActive = true;
          const plan = await getActivePaymentPlan(user.uid, docSnap.id);
          setActivePayment(plan);
        }
        if (data.status === 'due' && !foundDue) foundDue = data;
      }
      setCycleHistory(cycles); setDueCycle(foundDue);
      if (!foundActive) { setActiveCycle(null); setActivePayment(null); }
      return { cycles, foundActive, foundDue };
    } catch (err) { console.error('loadZakatCycles:', err); return {}; }
  }, [user]);

  const loadPaymentHistory = useCallback(async () => {
    try { setZakatPayments(await getZakatHistory(user.uid)); } catch (err) { console.error(err); }
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([loadAllAssets(), loadNisabSettings(), loadZakatCycles(), loadPaymentHistory()]);
    setLoading(false);
  }, [user, loadAllAssets, loadNisabSettings, loadZakatCycles, loadPaymentHistory]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-complete cycle if Hijri year passed (triggers auto-fetch of Nisab)
  useEffect(() => {
    if (autoCheckDone || !activeCycle || !wealthBreakdown || nisabThreshold === 0) return;
    if (!hasOneHijriYearPassed(activeCycle.startDate)) return;
    setAutoCheckDone(true);
    (async () => {
      const result = await autoCompleteCycleIfYearPassed(
        user.uid, activeCycle, wealthBreakdown.netZakatableWealth, nisabThreshold, wealthBreakdown
      );
      if (result.acted) {
        const msg = result.nisabFetched
          ? `Zakat year completed. Nisab auto-updated to ৳${result.effectiveNisab?.toLocaleString()}. ${result.isDue ? 'Zakat is due.' : 'You are exempt.'}`
          : `Zakat year completed (saved Nisab used — update manually for accuracy). ${result.isDue ? 'Zakat is due.' : 'You are exempt.'}`;
        showToast(msg, result.isDue ? 'info' : 'success');
        await loadData();
      }
    })();
  }, [activeCycle, wealthBreakdown, nisabThreshold]);

  // ── toggleLendingZakat — save countForZakat on a lending document ──────────
  const toggleLendingZakat = async (lendingId, newValue) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'lendings', lendingId), {
        countForZakat: newValue,
        updatedAt: serverTimestamp(),
      });
      // Optimistically update local state then recalculate breakdown
      const updatedLendings = lendings.map(l =>
        l.id === lendingId ? { ...l, countForZakat: newValue } : l
      );
      setLendings(updatedLendings);
      const breakdown = calculateZakatableWealth({
        accounts, lendings: updatedLendings, loans, investments, goals, jewellery, ribaTransactions
      });
      setWealthBreakdown(breakdown);
      showToast(
        newValue
          ? 'Lending counted in Zakat wealth.'
          : 'Lending excluded from Zakat wealth.',
        'success'
      );
    } catch (err) { showToast('Error updating lending: ' + err.message, 'error'); }
  };

  const saveNisabSettings = async (payload) => {
    try {
      const settingsData = {
        nisabThreshold:     payload.nisabThreshold,
        silverPricePerGram: payload.silverPricePerGram || 0,
        silverPricePerVori: payload.silverPricePerVori || 0,
        goldPricePerGram:   payload.goldPricePerGram   || 0,
        goldPricePerVori:   payload.goldPricePerVori   || 0,
        priceUnit:          payload.priceUnit          || 'gram',
        priceSource:        payload.priceSource        || 'manual',
        lastFetched:        payload.lastFetched        || null,
        usdToBdt:           payload.usdToBdt           || null,
        updatedAt:          serverTimestamp(),
      };
      const settingsRef = collection(db, 'users', user.uid, 'settings');
      const snap = await getDocs(settingsRef);
      if (snap.empty) await addDoc(settingsRef, settingsData);
      else await updateDoc(doc(db, 'users', user.uid, 'settings', snap.docs[0].id), settingsData);
      setNisabThreshold(payload.nisabThreshold);
      setSilverPricePerGram(payload.silverPricePerGram || 0);
      setSilverPricePerVori(payload.silverPricePerVori || 0);
      setGoldPricePerGram(payload.goldPricePerGram     || 0);
      setGoldPricePerVori(payload.goldPricePerVori     || 0);
      setPriceUnit(payload.priceUnit                   || 'gram');
      setApplyDeduction(payload.applyDeduction         || false);
      setShowSettingsModal(false);
      showToast('Nisab settings saved!', 'success');
      if (wealthBreakdown?.netZakatableWealth >= payload.nisabThreshold && payload.nisabThreshold > 0 && !activeCycle) {
        setShowStartCycleModal(true);
      }
    } catch (err) { showToast('Error saving settings: ' + err.message, 'error'); }
  };

  // ── startNewCycle — accepts optional custom start date ────────────────────
  const startNewCycle = async (customStartDate) => {
    try {
      const startDate         = customStartDate || new Date().toISOString().split('T')[0];
      const hijriDate         = gregorianToHijri(startDate);
      const yearAlreadyPassed = hasOneHijriYearPassed(startDate);
      const nisabNotSet       = !nisabThreshold || nisabThreshold === 0;

      if (yearAlreadyPassed) {
        const today    = new Date().toISOString().split('T')[0];
        const endHijri = gregorianToHijri(today);
        const zakatDue = (wealthBreakdown?.netZakatableWealth || 0) * 0.025;
        await addDoc(collection(db, 'users', user.uid, 'zakatCycles'), {
          cycleId:        generateId(),
          status:         'due',
          startDate,
          startDateHijri: hijriDate,
          startWealth:    wealthBreakdown?.netZakatableWealth || 0,
          startBreakdown: wealthBreakdown,
          nisabAtStart:   nisabThreshold || 0,
          endDate:        today,
          endDateHijri:   endHijri,
          endWealth:      wealthBreakdown?.netZakatableWealth || 0,
          zakatDue,
          paymentStatus:  'unpaid',
          createdAt:      serverTimestamp(),
        });
        showToast('One Hijri year has passed — Zakat is now due!', 'info');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'zakatCycles'), {
          cycleId:        generateId(),
          status:         'active',
          startDate,
          startDateHijri: hijriDate,
          startWealth:    wealthBreakdown?.netZakatableWealth || 0,
          startBreakdown: wealthBreakdown,
          nisabAtStart:   nisabThreshold || 0,
          paymentStatus:  'unpaid',
          createdAt:      serverTimestamp(),
        });
        const isBackdated = startDate < new Date().toISOString().split('T')[0];
        if (nisabNotSet) {
          showToast(`Cycle started from ${fmtDate(startDate)}. Please set your Nisab threshold in settings.`, 'info');
        } else {
          showToast(
            isBackdated
              ? `Cycle started from ${fmtDate(startDate)} — ${daysUntilHijriAnniversary(startDate)} days remaining.`
              : 'Zakat monitoring cycle started!',
            'success'
          );
        }
      }
      setShowStartCycleModal(false);
      await loadZakatCycles();
    } catch (err) { console.error(err); showToast('Error starting cycle: ' + err.message, 'error'); }
  };

  // ── editCycleStartDate — update start date of EXISTING active cycle ───────
  const editCycleStartDate = async (newStartDate) => {
    if (!activeCycle) return;
    try {
      const hijriDate         = gregorianToHijri(newStartDate);
      const yearAlreadyPassed = hasOneHijriYearPassed(newStartDate);

      if (yearAlreadyPassed) {
        const today    = new Date().toISOString().split('T')[0];
        const endHijri = gregorianToHijri(today);
        const zakatDue = (wealthBreakdown?.netZakatableWealth || 0) * 0.025;
        await updateDoc(doc(db, 'users', user.uid, 'zakatCycles', activeCycle.id), {
          startDate:      newStartDate,
          startDateHijri: hijriDate,
          status:         'due',
          endDate:        today,
          endDateHijri:   endHijri,
          endWealth:      wealthBreakdown?.netZakatableWealth || 0,
          zakatDue,
          updatedAt:      serverTimestamp(),
        });
        showToast('Start date updated — one Hijri year has already passed. Zakat is now due!', 'info');
      } else {
        await updateDoc(doc(db, 'users', user.uid, 'zakatCycles', activeCycle.id), {
          startDate:      newStartDate,
          startDateHijri: hijriDate,
          updatedAt:      serverTimestamp(),
        });
        const days = daysUntilHijriAnniversary(newStartDate);
        showToast(`Cycle start date updated to ${fmtDate(newStartDate)} — ${days} days remaining.`, 'success');
      }
      setShowStartCycleModal(false);
      setEditStartCycleMode(false);
      await loadZakatCycles();
    } catch (err) { showToast('Error updating date: ' + err.message, 'error'); }
  };

  const markAsExempt = async () => {
    if (!activeCycle) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await updateDoc(doc(db, 'users', user.uid, 'zakatCycles', activeCycle.id), {
        status: 'exempt', endDate: today, endDateHijri: gregorianToHijri(today),
        endWealth: wealthBreakdown?.netZakatableWealth || 0, updatedAt: serverTimestamp(),
      });
      await loadZakatCycles(); showToast('Cycle marked as exempt.', 'info');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  const totalWealth = wealthBreakdown?.netZakatableWealth || 0;
  let zakatStatus = ZAKAT_STATUS.NOT_MANDATORY;
  let progressPercentage = 0, daysRemaining = 0, yearEndDate = null, zakatAmount = 0;

  // Always compute cycle state if there's an active cycle — even before Nisab is set
  if (activeCycle && activeCycle.status === 'active') {
    zakatAmount = nisabThreshold > 0 ? calculateZakat(totalWealth) : 0;
    if (nisabThreshold > 0) progressPercentage = Math.min((totalWealth / nisabThreshold) * 100, 100);
    if (hasOneHijriYearPassed(activeCycle.startDate)) {
      zakatStatus = (nisabThreshold > 0 && totalWealth >= nisabThreshold) ? ZAKAT_STATUS.DUE : ZAKAT_STATUS.EXEMPT;
    } else {
      zakatStatus   = ZAKAT_STATUS.MONITORING;
      daysRemaining = daysUntilHijriAnniversary(activeCycle.startDate);
      yearEndDate   = addOneHijriYear(activeCycle.startDate);
    }
  } else if (nisabThreshold > 0) {
    progressPercentage = Math.min((totalWealth / nisabThreshold) * 100, 100);
    zakatAmount = calculateZakat(totalWealth);
    if (dueCycle && !activeCycle) {
      zakatStatus = ZAKAT_STATUS.DUE;
      zakatAmount = dueCycle.zakatDue || zakatAmount;
    } else if (totalWealth >= nisabThreshold && !activeCycle) {
      zakatStatus = ZAKAT_STATUS.NOT_MANDATORY;
    }
  }

  const fmt = (n) => formatAmount(n, settings.currency);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-gray-500 text-sm">Calculating your Zakat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Zakat Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor your Zakat obligations</p>
        </div>
        <div className="flex items-center gap-2">
          {(zakatStatus === ZAKAT_STATUS.DUE || dueCycle) && (
            <button onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
              <CreditCard className="w-4 h-4" /> Pay Zakat
            </button>
          )}
          {/* Always-accessible manual cycle start — for new users or those below Nisab */}
          {!activeCycle && zakatStatus !== ZAKAT_STATUS.DUE && (
            <button
              onClick={() => { setEditStartCycleMode(false); setShowStartCycleModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors text-sm font-medium"
            >
              <PlayCircle className="w-4 h-4" /> Start Zakat Cycle
            </button>
          )}
          <button onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
            <Settings className="w-4 h-4" /> Nisab Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ id: 'overview', label: 'Overview', icon: Star }, { id: 'history', label: 'Zakat History', icon: History }].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* ── Nisab Reminder Banner (≤3 days to year end) ── */}
          {zakatStatus === ZAKAT_STATUS.MONITORING && daysRemaining <= 3 && yearEndDate && (
            <NisabReminderBanner
              daysRemaining={daysRemaining}
              yearEndDate={yearEndDate}
              onOpenSettings={() => setShowSettingsModal(true)}
            />
          )}

          {/* ── Previous Zakat Due Banner ── */}
          {dueCycle && activeCycle && dueCycle.id !== activeCycle.id && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 text-sm">Previous Zakat Still Unpaid</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Your Hijri year ended on <strong>{fmtDate(dueCycle.endDate)}</strong> with zakat due of{' '}
                    <strong>{fmt(dueCycle.zakatDue || 0)}</strong>.
                    A new monitoring cycle has auto-started. Please clear the previous payment.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                    <div className="bg-amber-100 rounded-lg p-2 text-xs">
                      <p className="text-amber-600">Cycle Ended</p>
                      <p className="font-semibold text-amber-900">{fmtDate(dueCycle.endDate)}</p>
                    </div>
                    <div className="bg-amber-100 rounded-lg p-2 text-xs">
                      <p className="text-amber-600">Zakat Due (2.5%)</p>
                      <p className="font-semibold text-amber-900">{fmt(dueCycle.zakatDue || 0)}</p>
                    </div>
                    <div className="bg-amber-100 rounded-lg p-2 text-xs">
                      <p className="text-amber-600">Wealth at Year End</p>
                      <p className="font-semibold text-amber-900">{fmt(dueCycle.endWealth || 0)}</p>
                    </div>
                  </div>
                  {/* Show auto-Nisab note if applicable */}
                  {dueCycle.nisabAtEndNote && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-100 rounded-lg p-2">
                      <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{dueCycle.nisabAtEndNote}</span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-amber-700 bg-amber-100 rounded-lg p-2">
                    <strong>New cycle started:</strong> {fmtDate(activeCycle.startDate)} — monitoring continues while previous zakat is pending.
                  </div>
                  <button onClick={() => setShowPaymentModal(true)}
                    className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors">
                    Pay Previous Zakat Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Main Status Card ── */}
          <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border border-emerald-200 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>
            <div className="relative p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Star className="w-6 h-6 text-emerald-600" fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Current Status</h2>
                    <p className="text-sm text-gray-600">Real-time monitoring</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                  zakatStatus === ZAKAT_STATUS.NOT_MANDATORY ? 'bg-gray-900 text-white' :
                  zakatStatus === ZAKAT_STATUS.MONITORING    ? 'bg-blue-600 text-white' :
                  zakatStatus === ZAKAT_STATUS.DUE           ? 'bg-red-600 text-white' :
                  zakatStatus === ZAKAT_STATUS.EXEMPT        ? 'bg-gray-600 text-white' :
                  'bg-emerald-600 text-white'}`}>
                  {zakatStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <WealthStatCard label="Net Zakatable Wealth" value={fmt(totalWealth)} sub="After liabilities" icon={<Wallet className="w-4 h-4 text-emerald-600" />} />
                <WealthStatCard label="Nisab Threshold" value={nisabThreshold > 0 ? fmt(nisabThreshold) : 'Not set'} sub="52.5 Tola Silver" icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
                {zakatStatus === ZAKAT_STATUS.DUE && (
                  <WealthStatCard label="Zakat Due (2.5%)" value={fmt(zakatAmount)} sub="Obligatory amount" icon={<AlertCircle className="w-4 h-4 text-red-600" />} highlight />
                )}
                {zakatStatus === ZAKAT_STATUS.MONITORING && activeCycle && (
                  <WealthStatCard
                    label="Days Remaining"
                    value={`${daysRemaining} days`}
                    sub={yearEndDate ? `Until ${fmtDate(yearEndDate)}` : ''}
                    icon={<Clock className={`w-4 h-4 ${daysRemaining <= 3 ? 'text-red-500' : 'text-blue-600'}`} />}
                    highlight={daysRemaining <= 3}
                  />
                )}
              </div>

              {nisabThreshold > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress to Nisab</span>
                    <span className="text-sm font-semibold text-emerald-600">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner border border-emerald-100">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                  </div>
                </div>
              )}

              {/* Wealth reached Nisab */}
              {zakatStatus === ZAKAT_STATUS.NOT_MANDATORY && nisabThreshold > 0 && totalWealth >= nisabThreshold && !activeCycle && (
                <ActionBlock
                  icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                  title="Wealth Reached Nisab!"
                  body={`Your wealth (${fmt(totalWealth)}) has reached the Nisab threshold (${fmt(nisabThreshold)}). Start monitoring — you can set the date your wealth first crossed Nisab.`}
                  action={{ label: 'Start Monitoring Cycle', onClick: () => setShowStartCycleModal(true), color: 'green' }}
                />
              )}

              {zakatStatus === ZAKAT_STATUS.NOT_MANDATORY && (nisabThreshold === 0 || totalWealth < nisabThreshold) && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">No Active Cycle</p>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        {nisabThreshold === 0
                          ? 'Nisab threshold is not set yet. You can still start your Zakat cycle manually if you were already a Sahib al-Mal before joining this app.'
                          : `Your current wealth (${fmt(totalWealth)}) has not yet reached the Nisab threshold (${fmt(nisabThreshold)}). If you were already above Nisab before joining, you can start your cycle manually.`}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => { setEditStartCycleMode(false); setShowStartCycleModal(true); }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <PlayCircle className="w-4 h-4" /> Start Cycle Manually
                        </button>
                        {nisabThreshold === 0 && (
                          <button
                            onClick={() => setShowSettingsModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                          >
                            <Settings className="w-4 h-4" /> Set Nisab First
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {zakatStatus === ZAKAT_STATUS.MONITORING && activeCycle && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">Monitoring Active</p>
                        <button
                          onClick={() => { setEditStartCycleMode(true); setShowStartCycleModal(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <CalendarClock className="w-3.5 h-3.5" /> Edit Start Date
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Monitoring since your wealth reached Nisab. One Hijri year must pass.</p>
                      {/* Nisab not set reminder */}
                      {(!nisabThreshold || nisabThreshold === 0) && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-xs text-amber-800">
                            <p className="font-semibold mb-0.5">Nisab threshold not set</p>
                            <p>Your cycle is running but Nisab is not configured. Set it now so the system can correctly determine when Zakat is due.</p>
                          </div>
                          <button
                            onClick={() => setShowSettingsModal(true)}
                            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Settings className="w-3 h-3" /> Set Nisab
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <MiniInfoCard label="Cycle Started (Hijri)" value={formatHijriDate(activeCycle.startDateHijri)} icon={<Calendar className="w-3 h-3 text-blue-600" />} />
                        <MiniInfoCard label="Started (Gregorian)" value={fmtDate(activeCycle.startDate)} icon={<Calendar className="w-3 h-3 text-blue-600" />} />
                        <MiniInfoCard
                          label="Days Remaining"
                          value={`${daysRemaining} days`}
                          sub={yearEndDate ? `Until ${fmtDate(yearEndDate)}` : ''}
                          icon={<Clock className={`w-3 h-3 ${daysRemaining <= 3 ? 'text-red-500' : 'text-blue-600'}`} />}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {zakatStatus === ZAKAT_STATUS.EXEMPT && activeCycle && (
                <ActionBlock icon={<CheckCircle2 className="w-5 h-5 text-gray-600" />} title="Cycle Completed — Exempt"
                  body={`One Hijri year passed but wealth (${fmt(totalWealth)}) is below Nisab (${fmt(nisabThreshold)}). You are exempt.`}
                  action={{ label: 'Mark Cycle as Exempt & Close', onClick: markAsExempt, color: 'gray' }} />
              )}

              {zakatStatus === ZAKAT_STATUS.DUE && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">Zakat Payment Due</p>
                      <p className="text-sm text-gray-600 mb-3">One Hijri year has passed. Zakat is now obligatory.</p>
                      {/* Show auto-Nisab note on the active/due cycle */}
                      {(activeCycle?.nisabAtEndNote || dueCycle?.nisabAtEndNote) && (
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-700 leading-relaxed">
                            {activeCycle?.nisabAtEndNote || dueCycle?.nisabAtEndNote}
                          </p>
                        </div>
                      )}
                      <div className="bg-red-50 rounded-lg p-4 mb-4">
                        <p className="text-xs text-red-600 font-medium mb-1">Zakat Amount (2.5%)</p>
                        <p className="text-2xl font-bold text-gray-900">{fmt(zakatAmount)}</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setShowPaymentModal(true)}
                          className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                          Pay Zakat
                        </button>
                        <button onClick={markAsExempt}
                          className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                          Mark Exempt
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Installment tracker */}
          {activePayment && activePayment.type === 'installment' && activePayment.status === 'active' && (
            <InstallmentTracker payment={activePayment} accounts={accounts}
              onPayInstallment={async (installmentIndex, accountId) => {
                const acc = accounts.find(a => a.id === accountId);
                const res = await payZakatInstallment(user.uid, { paymentDocId: activePayment.id, installmentIndex, accountId, accountBalance: acc?.balance || 0 });
                if (res.success) { showToast('Installment paid!', 'success'); await loadZakatCycles(); await loadAllAssets(); await loadPaymentHistory(); }
                else showToast('Error: ' + res.error, 'error');
              }} fmt={fmt} />
          )}

          <WealthBreakdownCard breakdown={wealthBreakdown} accounts={accounts} lendings={lendings}
            loans={loans} investments={investments} goals={goals} jewellery={jewellery}
            ribaTransactions={ribaTransactions}
            nisabThreshold={nisabThreshold} fmt={fmt}
            onToggleLending={toggleLendingZakat} />

          {/* How Zakat is Calculated */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 space-y-1">
                <p className="font-semibold">How Your Zakat is Calculated</p>
                <p><strong>Included:</strong> Purified account balances + Active investments + Savings goal amounts + Jewellery (resale value after 15% deduction) + Lendings you mark as "Count for Zakat".</p>
                <p><strong>Riba (Interest) Excluded:</strong> Any interest/riba marked on your accounts (<code>Haram Income</code>) is automatically deducted — it is impure wealth and must be given to charity, not counted in Zakat.</p>
                <p><strong>Lendings (your choice):</strong> Money you lent out still belongs to you Islamically. Use the toggle on each lending to include or exclude it based on your certainty of recovery. Scholars allow deferring Zakat on uncertain debts.</p>
                <p><strong>Deducted:</strong> Outstanding loan amounts you owe to others.</p>
                <p><strong>Rate:</strong> 2.5% of net zakatable wealth, once per Hijri year if wealth stays ≥ Nisab.</p>
                <p><strong>Nisab at Year End:</strong> The system auto-fetches the latest silver price when your Hijri year completes for an accurate calculation.</p>
              </div>
            </div>
          </div>

          {/* Jewellery reminder */}
          {jewellery.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Gem className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    {jewellery.filter(j => j.currentZakatValue > 0).length} of {jewellery.length} jewellery item{jewellery.length > 1 ? 's' : ''} priced
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {jewellery.filter(j => !j.currentZakatValue).length > 0
                      ? `${jewellery.filter(j => !j.currentZakatValue).length} item(s) need a price check to be included.`
                      : 'All jewellery items are included in your Zakat total.'}
                  </p>
                </div>
              </div>
              <a href="/dashboard/jewellery"
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap">
                <Gem className="w-3.5 h-3.5" /> Jewellery Tracker
              </a>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <ZakatHistoryTab cycleHistory={cycleHistory} zakatPayments={zakatPayments}
          expandedCycleId={expandedCycleId} setExpandedCycleId={setExpandedCycleId} fmt={fmt} />
      )}

      {/* ── Start / Edit Cycle Modal ── */}
      {showStartCycleModal && (
        <StartCycleModal
          totalWealth={totalWealth}
          nisabThreshold={nisabThreshold}
          fmt={fmt}
          editMode={editStartCycleMode}
          currentStartDate={editStartCycleMode ? activeCycle?.startDate : null}
          onConfirm={editStartCycleMode ? editCycleStartDate : startNewCycle}
          onClose={() => { setShowStartCycleModal(false); setEditStartCycleMode(false); }}
        />
      )}

      {showPaymentModal && (
        <ZakatPaymentModal
          zakatAmount={dueCycle && dueCycle.id !== activeCycle?.id ? (dueCycle.zakatDue || 0) : zakatAmount}
          activeCycle={dueCycle && dueCycle.id !== activeCycle?.id ? dueCycle : activeCycle}
          accounts={accounts} userId={user.uid} fmt={fmt}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={async () => {
            setShowPaymentModal(false); showToast('JazakAllah Khayran! Zakat recorded.', 'success');
            await loadZakatCycles(); await loadAllAssets(); await loadPaymentHistory();
          }} />
      )}

      {showSettingsModal && (
        <NisabSettingsModal
          initialSilverPerGram={silverPricePerGram} initialSilverPerVori={silverPricePerVori}
          initialGoldPerGram={goldPricePerGram} initialGoldPerVori={goldPricePerVori}
          initialPriceUnit={priceUnit} initialNisab={nisabThreshold} initialApplyDeduction={applyDeduction}
          onSave={saveNisabSettings} onClose={() => setShowSettingsModal(false)} />
      )}
    </div>
  );
}

// ─── Small UI Components ──────────────────────────────────────────────────────

function WealthStatCard({ label, value, sub, icon, highlight }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${highlight ? 'border-red-200' : 'border-emerald-100'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-semibold uppercase tracking-wide ${highlight ? 'text-red-600' : 'text-emerald-600'}`}>{label}</p>
        {icon}
      </div>
      <p className={`text-xl font-bold mb-0.5 ${highlight ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function MiniInfoCard({ label, value, sub, icon }) {
  return (
    <div className="bg-blue-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">{icon}<p className="text-xs text-blue-600 font-medium">{label}</p></div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function ActionBlock({ icon, title, body, action }) {
  const colorMap = { green: 'bg-green-600 hover:bg-green-700', gray: 'bg-gray-900 hover:bg-gray-800' };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{body}</p>
          {action && (
            <button onClick={action.onClick}
              className={`w-full px-4 py-2.5 ${colorMap[action.color] || colorMap.gray} text-white rounded-lg transition-colors text-sm font-medium`}>
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Wealth Breakdown Card ────────────────────────────────────────────────────

function WealthBreakdownCard({ breakdown, accounts, lendings, loans, investments, goals, jewellery = [], ribaTransactions = [], nisabThreshold, fmt, onToggleLending }) {
  const [openSections, setOpenSections] = useState({});
  if (!breakdown) return null;

  const toggle = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const normalizeType = (raw) => {
    if (!raw) return 'other';
    const t = raw.trim();
    if (['Mobile Banking', 'mobile_banking', 'mobile banking'].includes(t)) return 'mobile_banking';
    return t.toLowerCase().replace(/\s+/g, '_');
  };

  const filterAccs = (type) => accounts.filter(a => normalizeType(a.type) === type && Number(a.balance) > 0);
  const cashAccs   = filterAccs('cash');
  const bankAccs   = filterAccs('bank');
  const mobileAccs = filterAccs('mobile_banking');
  const goldAccs   = filterAccs('gold');
  const silverAccs = filterAccs('silver');
  const otherAccs  = accounts.filter(a => !['cash','bank','mobile_banking','gold','silver'].includes(normalizeType(a.type)) && Number(a.balance) > 0);

  const activeLendings    = lendings.filter(l => l.status === 'active');
  const activeInvestments = investments.filter(i => i.status === 'active');
  const activeGoals       = goals.filter(g => g.status === 'active' && Number(g.currentAmount) > 0);

  const Section = ({ sectionKey, icon, label, total, badge, badgeColor = 'bg-gray-100 text-gray-600', excluded = false, rightSlot, children }) => {
    const isOpen  = !!openSections[sectionKey];
    const hasKids = !!children;
    return (
      <div className="border-b border-gray-50 last:border-0">
        <button onClick={() => hasKids && toggle(sectionKey)}
          className={`w-full flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors text-left ${hasKids ? 'cursor-pointer' : 'cursor-default'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${excluded ? 'bg-gray-100' : 'bg-gray-50'}`}>{icon}</div>
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <p className={`text-sm ${excluded ? 'text-gray-400' : 'text-gray-700'}`}>{label}</p>
            {badge && <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badgeColor}`}>{badge}</span>}
            {excluded && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-400 italic">not counted</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {rightSlot ? rightSlot : (
              <p className={`font-semibold text-sm ${excluded ? 'text-gray-300 line-through' : total < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {excluded ? fmt(total) : (total < 0 ? '− ' : '+ ') + fmt(Math.abs(total))}
              </p>
            )}
            {hasKids && (isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
          </div>
        </button>
        {isOpen && hasKids && <div className="px-6 pb-3 bg-gray-50/70 space-y-1.5">{children}</div>}
      </div>
    );
  };

  const AccRow = ({ name, balance, type }) => (
    <div className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border border-gray-50">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
        <span className="text-xs text-gray-600">{name}</span>
        {type && <span className="text-xs text-gray-400">({type})</span>}
      </div>
      <span className="text-xs font-semibold text-gray-700">{fmt(balance)}</span>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Wealth Breakdown</h3>
          <p className="text-xs text-gray-500">Click categories to see individual accounts</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Net Zakatable</p>
          <p className="font-bold text-gray-900">{fmt(breakdown.netZakatableWealth)}</p>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {(breakdown.accountBreakdown?.cash || 0) > 0 && (
          <Section sectionKey="cash" icon={<Banknote className="w-4 h-4 text-emerald-600" />} label="Cash Accounts"
            total={breakdown.accountBreakdown.cash} badge={`${cashAccs.length} acct${cashAccs.length > 1 ? 's' : ''}`} badgeColor="bg-emerald-50 text-emerald-700">
            {cashAccs.map(a => <AccRow key={a.id} name={a.name} balance={a.balance} />)}
          </Section>
        )}
        {(breakdown.accountBreakdown?.bank || 0) > 0 && (
          <Section sectionKey="bank" icon={<Building2 className="w-4 h-4 text-blue-600" />} label="Bank Accounts"
            total={breakdown.accountBreakdown.bank} badge={`${bankAccs.length} acct${bankAccs.length > 1 ? 's' : ''}`} badgeColor="bg-blue-50 text-blue-700">
            {bankAccs.map(a => <AccRow key={a.id} name={a.name} balance={a.balance} />)}
          </Section>
        )}
        {(breakdown.accountBreakdown?.mobile_banking || 0) > 0 && (
          <Section sectionKey="mobile" icon={<Smartphone className="w-4 h-4 text-purple-600" />} label="Mobile Banking"
            total={breakdown.accountBreakdown.mobile_banking} badge={`${mobileAccs.length} acct${mobileAccs.length > 1 ? 's' : ''}`} badgeColor="bg-purple-50 text-purple-700">
            {mobileAccs.map(a => <AccRow key={a.id} name={a.name} balance={a.balance} />)}
          </Section>
        )}
        {(breakdown.accountBreakdown?.gold || 0) > 0 && (
          <Section sectionKey="gold" icon={<Coins className="w-4 h-4 text-amber-500" />} label="Gold Accounts"
            total={breakdown.accountBreakdown.gold} badge={`${goldAccs.length} acct${goldAccs.length > 1 ? 's' : ''}`} badgeColor="bg-amber-50 text-amber-700">
            {goldAccs.map(a => <AccRow key={a.id} name={a.name} balance={a.balance} />)}
          </Section>
        )}
        {(breakdown.accountBreakdown?.silver || 0) > 0 && (
          <Section sectionKey="silver" icon={<Coins className="w-4 h-4 text-gray-400" />} label="Silver Accounts"
            total={breakdown.accountBreakdown.silver} badge={`${silverAccs.length} acct${silverAccs.length > 1 ? 's' : ''}`} badgeColor="bg-gray-100 text-gray-600">
            {silverAccs.map(a => <AccRow key={a.id} name={a.name} balance={a.balance} />)}
          </Section>
        )}
        {(breakdown.accountBreakdown?.other || 0) > 0 && (
          <Section sectionKey="other" icon={<Wallet className="w-4 h-4 text-gray-500" />} label="Other Accounts"
            total={breakdown.accountBreakdown.other} badge={`${otherAccs.length} acct${otherAccs.length > 1 ? 's' : ''}`}>
            {otherAccs.map(a => <AccRow key={a.id} name={a.name} balance={a.balance} type={a.type} />)}
          </Section>
        )}
        {/* Lendings — per-lending Zakat toggle inside accordion */}
        {activeLendings.length > 0 && (
          <Section
            sectionKey="lendings"
            icon={<HandCoins className="w-4 h-4 text-cyan-600" />}
            label="Lendings (Receivable)"
            total={0}
            badge={`${activeLendings.length} active`}
            badgeColor="bg-cyan-50 text-cyan-600"
            rightSlot={
              <div className="flex items-center gap-2">
                {(breakdown.lendingsIncludedTotal || 0) > 0 && (
                  <span className="text-xs font-semibold text-emerald-700">+{fmt(breakdown.lendingsIncludedTotal)}</span>
                )}
                {(breakdown.lendingsExcludedTotal || 0) > 0 && (
                  <span className="text-xs text-gray-300 line-through">{fmt(breakdown.lendingsExcludedTotal)}</span>
                )}
                {(breakdown.lendingsIncludedTotal || 0) === 0 && (breakdown.lendingsExcludedTotal || 0) === 0 && (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            }
          >
            {/* Islamic guidance note */}
            <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 mb-2">
              <p className="text-xs text-cyan-800 leading-relaxed">
                <strong>Islamic ruling:</strong> Money you lent belongs to you and is technically Zakatable.
                Toggle each lending based on your certainty of recovery. Scholars permit deferring Zakat on
                uncertain debts until received.
              </p>
            </div>

            {/* Per-lending rows with toggle */}
            <div className="space-y-2">
              {activeLendings.map(l => {
                const amt     = Number(l.remainingBalance ?? l.principalAmount ?? 0);
                const counted = l.countForZakat === true;
                return (
                  <div key={l.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    counted ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {l.borrowerName || l.name || 'Unknown borrower'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className={`text-xs font-semibold ${counted ? 'text-emerald-700' : 'text-gray-400 line-through'}`}>
                          {fmt(amt)}
                        </p>
                        {l.dueDate && (
                          <span className="text-xs text-gray-400">Due: {fmtDate(l.dueDate)}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          counted ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {counted ? '✓ Counted' : 'Not counted'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleLending && onToggleLending(l.id, !counted)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 ${
                        counted
                          ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600'
                      }`}
                      title={counted ? 'Click to exclude from Zakat' : 'Click to include in Zakat'}
                    >
                      {counted
                        ? <><ToggleRight className="w-3.5 h-3.5" /> Include</>
                        : <><ToggleLeft className="w-3.5 h-3.5" /> Exclude</>}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Summary line */}
            {(breakdown.lendingsIncludedTotal || 0) > 0 && (breakdown.lendingsExcludedTotal || 0) > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex gap-4">
                <span className="text-emerald-700">✓ {fmt(breakdown.lendingsIncludedTotal)} counted</span>
                <span className="text-gray-400">{fmt(breakdown.lendingsExcludedTotal)} deferred</span>
              </div>
            )}
          </Section>
        )}
        {breakdown.investmentsTotal > 0 && (
          <Section sectionKey="investments" icon={<TrendingUp className="w-4 h-4 text-pink-600" />} label="Investments"
            total={breakdown.investmentsTotal} badge={`${activeInvestments.length} active`} badgeColor="bg-pink-50 text-pink-700">
            {activeInvestments.map(inv => {
              const qty = Number(inv.quantity) || 1;
              const val = (Number(inv.currentValue) || Number(inv.purchasePrice) || 0) * qty;
              return (
                <div key={inv.id} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border border-gray-50">
                  <span className="text-xs text-gray-600">{inv.name || inv.symbol || 'Investment'}</span>
                  <span className="text-xs font-semibold text-gray-700">{fmt(val)}</span>
                </div>
              );
            })}
          </Section>
        )}
        {breakdown.goalsTotal > 0 && (
          <Section sectionKey="goals" icon={<Target className="w-4 h-4 text-orange-500" />} label="Savings Goals"
            total={breakdown.goalsTotal} badge={`${activeGoals.length} goal${activeGoals.length > 1 ? 's' : ''}`} badgeColor="bg-orange-50 text-orange-700">
            {activeGoals.map(g => (
              <div key={g.id} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border border-gray-50">
                <span className="text-xs text-gray-600">{g.name || 'Goal'}</span>
                <span className="text-xs font-semibold text-gray-700">{fmt(Number(g.currentAmount) || 0)}</span>
              </div>
            ))}
          </Section>
        )}
        {breakdown.jewelleryTotal > 0 && (
          <div className="flex items-center gap-3 px-6 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0"><Gem className="w-4 h-4 text-amber-400" /></div>
            <div className="flex-1"><p className="text-sm text-gray-700">{breakdown.jewelleryCount > 0 ? `Jewellery (${breakdown.jewelleryCount} item${breakdown.jewelleryCount > 1 ? 's' : ''}, −15%)` : 'Jewellery'}</p></div>
            <p className="font-semibold text-sm text-gray-800">+ {fmt(breakdown.jewelleryTotal)}</p>
          </div>
        )}
        {breakdown.loansTotal > 0 && (
          <div className="flex items-center gap-3 px-6 py-3.5 bg-red-50/50">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0"><Minus className="w-4 h-4 text-red-500" /></div>
            <div className="flex-1"><p className="text-sm text-gray-700">Loans (Liability)</p></div>
            <p className="font-semibold text-sm text-red-600">− {fmt(breakdown.loansTotal)}</p>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
          <span className="text-sm font-medium text-gray-700">Total Assets</span>
          <span className="font-semibold text-gray-900">{fmt(breakdown.totalAssets)}</span>
        </div>
        {(breakdown.ribaTotal || 0) > 0 && (
          <div className="flex items-start gap-3 px-6 py-3 bg-orange-50 border-t border-orange-100">
            <Ban className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-orange-800 font-medium">Riba (Interest) Excluded</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Interest income is impure wealth — excluded from Zakat and must be given to charity without intention of reward.
                {ribaTransactions.length > 0 && ` (${ribaTransactions.length} transaction${ribaTransactions.length > 1 ? 's' : ''})`}
              </p>
            </div>
            <span className="text-sm font-semibold text-orange-700 flex-shrink-0">− {fmt(breakdown.ribaTotal)}</span>
          </div>
        )}
        {breakdown.loansTotal > 0 && (
          <div className="flex items-center justify-between px-6 py-2 text-red-600 text-sm">
            <span>Less: Loans</span>
            <span className="font-medium">− {fmt(breakdown.loansTotal)}</span>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-3 bg-emerald-50">
          <div>
            <p className="font-bold text-emerald-900">Net Zakatable Wealth</p>
            <p className="text-xs text-emerald-600">
              {breakdown.netZakatableWealth >= nisabThreshold && nisabThreshold > 0 ? '✓ Above Nisab'
                : nisabThreshold > 0 ? `${fmt(nisabThreshold - breakdown.netZakatableWealth)} below Nisab`
                : 'Set Nisab to compare'}
            </p>
          </div>
          <p className="font-bold text-lg text-emerald-700">{fmt(breakdown.netZakatableWealth)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Installment Tracker ──────────────────────────────────────────────────────

function InstallmentTracker({ payment, accounts, onPayInstallment, fmt }) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [payingIndex, setPayingIndex] = useState(null);

  const payableAccs = accounts.filter(a => Number(a.balance) > 0);
  useEffect(() => { if (payableAccs.length > 0 && !selectedAccountId) setSelectedAccountId(payableAccs[0].id); }, [payableAccs]);

  const totalPaid   = payment.paidAmount || 0;
  const progressPct = Math.round((totalPaid / payment.totalAmount) * 100);

  return (
    <div className="bg-white border border-blue-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-blue-100 bg-blue-50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-blue-900">Installment Plan Active</h3>
            <p className="text-xs text-blue-600">{payment.numberOfInstallments} payments — {fmt(payment.totalAmount / payment.numberOfInstallments)} each</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-500">Remaining</p>
            <p className="font-bold text-blue-800">{fmt(payment.remainingAmount)}</p>
          </div>
        </div>
        <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-blue-500 mt-1">
          <span>Paid: {fmt(totalPaid)}</span><span>{progressPct}%</span>
        </div>
      </div>
      <div className="px-6 pt-4 pb-2">
        <label className="text-xs font-medium text-gray-600 block mb-1">Pay installments from:</label>
        <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300">
          {payableAccs.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.type}) — {fmt(acc.balance)}</option>)}
        </select>
      </div>
      <div className="px-6 pb-4 space-y-2">
        {payment.installments.map((inst, index) => (
          <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${inst.status === 'paid' ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex-shrink-0">{inst.status === 'paid' ? <Check className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-gray-400" />}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">Installment {inst.installmentNumber}</p>
              <p className="text-xs text-gray-500">
                {inst.status === 'paid' ? `Paid on ${fmtDate(inst.paidDate)}` : `Due: ${fmtDate(inst.dueDate)}`}
              </p>
            </div>
            <p className={`text-sm font-semibold ${inst.status === 'paid' ? 'text-emerald-700' : 'text-gray-700'}`}>{fmt(inst.amount)}</p>
            {inst.status !== 'paid' && (
              <button onClick={async () => { setPayingIndex(index); await onPayInstallment(index, selectedAccountId); setPayingIndex(null); }}
                disabled={payingIndex === index || !selectedAccountId}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                {payingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />} Pay
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function ZakatPaymentModal({ zakatAmount, activeCycle, accounts, userId, fmt, onClose, onSuccess }) {
  const [mode,           setMode]           = useState('select');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [fromAccountId,  setFromAccountId]  = useState('');
  const [paymentMethod,  setPaymentMethod]  = useState('cash');
  const [recipient,      setRecipient]      = useState('');
  const [note,           setNote]           = useState('');
  const [installments,   setInstallments]   = useState(3);
  const [previewSched,   setPreviewSched]   = useState([]);

  const allAccounts = accounts.filter(a => Number(a.balance) > 0).sort((a, b) => Number(b.balance) - Number(a.balance));
  const selectedAcc = allAccounts.find(a => a.id === fromAccountId);

  useEffect(() => {
    if (mode === 'installment') setPreviewSched(generateInstallmentSchedule(zakatAmount, installments));
  }, [mode, installments, zakatAmount]);

  const typeLabel = (type) => ({ cash: 'Cash', bank: 'Bank', mobile_banking: 'Mobile', gold: 'Gold', silver: 'Silver' }[type?.toLowerCase?.().replace(/\s+/g, '_')] || type || '');

  const handleInstant = async () => {
    if (!fromAccountId) { setError('Please select an account.'); return; }
    if (!selectedAcc || selectedAcc.balance < zakatAmount) { setError('Insufficient balance in selected account.'); return; }
    setLoading(true); setError('');
    const res = await recordZakatPayment(userId, {
      cycleDocId: activeCycle.id, zakatDueTotal: zakatAmount, paymentAmount: zakatAmount,
      fromAccountId, fromAccountName: selectedAcc.name, fromAccountBalance: selectedAcc.balance,
      paymentMethod, recipient, note,
    });
    setLoading(false);
    if (res.success) onSuccess(); else setError(res.error || 'Payment failed.');
  };

  const handleInstallment = async () => {
    if (!fromAccountId) { setError('Please select an account.'); return; }
    setLoading(true); setError('');
    const instNote = [note, `${installments} installments of ${fmt(zakatAmount / installments)} each`].filter(Boolean).join(' — ');
    const res = await setupZakatInstallments(userId, {
      cycleDocId: activeCycle.id, zakatAmount, fromAccountId, fromAccountName: selectedAcc?.name || '',
      numberOfInstallments: installments, paymentMethod, recipient, note: instNote,
    });
    setLoading(false);
    if (res.success) onSuccess(); else setError(res.error || 'Failed to set up installments.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:w-[480px] rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
          {mode !== 'select' && <button onClick={() => setMode('select')} className="text-gray-500 text-sm hover:text-gray-700">← Back</button>}
          <h3 className="font-bold text-gray-900 flex-1">{mode === 'select' ? 'Pay Zakat' : mode === 'instant' ? 'Full Payment' : 'Installment Plan'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl p-4 text-center">
            <p className="text-emerald-100 text-sm">Total Zakat Due (2.5%)</p>
            <p className="text-2xl font-bold">{fmt(zakatAmount)}</p>
          </div>

          {mode === 'select' && (
            <>
              <p className="text-sm text-gray-500 text-center">How would you like to pay?</p>
              {[
                { m: 'instant', icon: <CreditCard className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-100', title: 'Pay Full Amount Now', sub: `Pay ${fmt(zakatAmount)} from one account`, hover: 'hover:border-emerald-300 hover:bg-emerald-50' },
                { m: 'installment', icon: <CalendarDays className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100', title: 'Pay in Installments', sub: 'Split over 2–12 monthly payments', hover: 'hover:border-blue-300 hover:bg-blue-50' },
              ].map(({ m, icon, bg, title, sub, hover }) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`w-full flex items-center gap-4 p-4 border-2 border-gray-100 ${hover} rounded-xl transition-all text-left group`}>
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>{icon}</div>
                  <div className="flex-1"><p className="font-semibold text-gray-800">{title}</p><p className="text-xs text-gray-500">{sub}</p></div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">Recorded as "Zakat Payment" expense. Balance deducted automatically from your account.</p>
              </div>
            </>
          )}

          {mode === 'instant' && (
            <>
              <AccountSelector accounts={allAccounts} fromAccountId={fromAccountId} setFromAccountId={setFromAccountId} requiredAmount={zakatAmount} fmt={fmt} typeLabel={typeLabel} />
              <CommonFields paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} recipient={recipient} setRecipient={setRecipient} note={note} setNote={setNote} />
              {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
              <button onClick={handleInstant} disabled={loading || !fromAccountId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Processing...' : `Pay ${fmt(zakatAmount)}`}
              </button>
            </>
          )}

          {mode === 'installment' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Number of Installments</label>
                <div className="grid grid-cols-5 gap-2">
                  {[2, 3, 4, 6, 12].map(n => (
                    <button key={n} onClick={() => setInstallments(n)}
                      className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${installments === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {n}x
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{fmt(zakatAmount / installments)} per month</p>
              </div>
              {previewSched.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Schedule Preview</p>
                  {previewSched.map(s => (
                    <div key={s.installmentNumber} className="flex justify-between text-xs">
                      <span className="text-gray-600">Installment {s.installmentNumber} — {fmtDate(s.dueDate)}</span>
                      <span className="font-medium text-gray-800">{fmt(s.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <AccountSelector accounts={allAccounts} fromAccountId={fromAccountId} setFromAccountId={setFromAccountId} requiredAmount={zakatAmount / installments} fmt={fmt} typeLabel={typeLabel} label="Account for Payments" />
              <CommonFields paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} recipient={recipient} setRecipient={setRecipient} note={note} setNote={setNote} />
              {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
              <button onClick={handleInstallment} disabled={loading || !fromAccountId}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Setting up...' : `Start ${installments}-Month Plan`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountSelector({ accounts, fromAccountId, setFromAccountId, requiredAmount, fmt, typeLabel, label = 'Pay From Account' }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
      {accounts.length === 0 ? (
        <p className="text-sm text-red-500 p-3 bg-red-50 rounded-xl">No accounts with available balance.</p>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {accounts.map(acc => {
            const sufficient = acc.balance >= requiredAmount;
            return (
              <button key={acc.id} onClick={() => setFromAccountId(acc.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${fromAccountId === acc.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-800">{acc.name}</p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{typeLabel(acc.type)}</span>
                  </div>
                  <p className="text-xs mt-0.5">
                    Balance: <span className={`font-semibold ${sufficient ? 'text-emerald-700' : 'text-orange-500'}`}>{fmt(acc.balance)}</span>
                    {!sufficient && <span className="text-orange-400 ml-1">— may be insufficient</span>}
                  </p>
                </div>
                {fromAccountId === acc.id && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommonFields({ paymentMethod, setPaymentMethod, recipient, setRecipient, note, setNote }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Payment Method</label>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="mobile">Mobile Banking</option>
          <option value="check">Check/Cheque</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Recipient <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="e.g. Local mosque, charity..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Any notes..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function ZakatHistoryTab({ cycleHistory, zakatPayments, expandedCycleId, setExpandedCycleId, fmt }) {
  const [historyView, setHistoryView] = useState('cycles');

  const statusBadge = {
    active: 'bg-blue-100 text-blue-700',
    due:    'bg-red-100 text-red-700',
    paid:   'bg-emerald-100 text-emerald-700',
    exempt: 'bg-gray-100 text-gray-600',
  };
  const totalPaid = cycleHistory.filter(c => c.status === 'paid').reduce((s, c) => s + (c.zakatPaid || 0), 0);
  const paidCount = cycleHistory.filter(c => c.status === 'paid').length;

  if (cycleHistory.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-600">No Zakat history yet</p>
        <p className="text-sm text-gray-400 mt-1">Your cycle history will appear here after your first cycle completes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Cycles', value: cycleHistory.length,       color: 'text-gray-900' },
          { label: 'Paid Cycles',  value: paidCount,                 color: 'text-emerald-700' },
          { label: 'Total Paid',   value: fmt(totalPaid),            color: 'text-gray-900', small: true },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
            <p className={`font-bold ${s.small ? 'text-base' : 'text-2xl'} ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ id: 'cycles', label: 'Cycles' }, { id: 'payments', label: 'Payment Records' }].map(({ id, label }) => (
          <button key={id} onClick={() => setHistoryView(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${historyView === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {historyView === 'cycles' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">All Cycles</h3></div>
          <div className="divide-y divide-gray-50">
            {cycleHistory.map((cycle, idx) => {
              const isExpanded = expandedCycleId === cycle.id;
              const cycleNum   = cycleHistory.length - idx;
              return (
                <div key={cycle.id}>
                  <button onClick={() => setExpandedCycleId(isExpanded ? null : cycle.id)}
                    className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-600">#{cycleNum}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm">Cycle {cycleNum} — {fmtDate(cycle.startDate)}</p>
                      <p className="text-xs text-gray-400">{formatHijriDate(cycle.startDateHijri)}</p>
                    </div>
                    {cycle.zakatPaid
                      ? <p className="text-sm font-semibold text-emerald-700 hidden sm:block">{fmt(cycle.zakatPaid)}</p>
                      : cycle.zakatDue
                      ? <p className="text-sm font-semibold text-red-600 hidden sm:block">{fmt(cycle.zakatDue)} due</p>
                      : null}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusBadge[cycle.status] || statusBadge.exempt}`}>
                      {cycle.status === 'paid' ? 'Paid ✓' : cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-5 bg-gray-50 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                        {[
                          { label: 'Start Date',      value: fmtDate(cycle.startDate) },
                          { label: 'Start (Hijri)',   value: formatHijriDate(cycle.startDateHijri) },
                          { label: 'Wealth at Start', value: fmt(cycle.startWealth || 0) },
                          { label: 'Nisab at Start',  value: fmt(cycle.nisabAtStart || 0) },
                          cycle.endDate     && { label: 'End Date',    value: fmtDate(cycle.endDate) },
                          cycle.endWealth !== undefined && { label: 'End Wealth', value: fmt(cycle.endWealth) },
                          cycle.nisabAtEnd  && { label: 'Nisab at Year End', value: fmt(cycle.nisabAtEnd) },
                          cycle.zakatDue    && { label: 'Zakat Due',   value: fmt(cycle.zakatDue),  highlight: true },
                          cycle.zakatPaid   && { label: 'Zakat Paid',  value: fmt(cycle.zakatPaid), highlight: true },
                          { label: 'Status', value: cycle.status },
                        ].filter(Boolean).map((item, i) => (
                          <div key={i} className="bg-white rounded-lg p-2.5">
                            <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                            <p className={`text-sm font-semibold ${item.highlight ? 'text-emerald-700' : 'text-gray-800'}`}>{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Auto-Nisab transparency note */}
                      {cycle.nisabAtEndNote && (
                        <div className={`flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed ${
                          cycle.nisabAtEndFetched
                            ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                            : 'bg-amber-50 border border-amber-200 text-amber-800'
                        }`}>
                          <Sparkles className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cycle.nisabAtEndFetched ? 'text-emerald-600' : 'text-amber-600'}`} />
                          <div>
                            <p className="font-semibold mb-0.5">Nisab at Year End</p>
                            <p>{cycle.nisabAtEndNote}</p>
                            {cycle.nisabAtEndFetchedAt && (
                              <p className="text-gray-400 mt-0.5">Fetched: {fmtDate(cycle.nisabAtEndFetchedAt)}</p>
                            )}
                            {cycle.silverPerGramAtEnd && (
                              <p className="text-gray-500 mt-0.5">Silver price: ৳{Number(cycle.silverPerGramAtEnd).toLocaleString()}/gram</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment records */}
                      {cycle.payments && cycle.payments.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Records</p>
                          <div className="space-y-1.5">
                            {cycle.payments.map((pmt, pi) => (
                              <div key={pi} className="bg-white rounded-lg p-2.5 flex items-center gap-3">
                                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-700">
                                    {pmt.isInstallment ? `Installment ${pmt.installmentNum}/${pmt.installmentTotal}` : 'Full Payment'}
                                    {pmt.accountName ? ` · ${pmt.accountName}` : ''}
                                  </p>
                                  {pmt.note && <p className="text-xs text-gray-400 truncate">{pmt.note}</p>}
                                  <p className="text-xs text-gray-400">{fmtDate(pmt.date)}</p>
                                </div>
                                <p className="text-xs font-semibold text-emerald-700 flex-shrink-0">{fmt(pmt.amount)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cycle.startBreakdown && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Wealth Breakdown at Cycle Start</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[['Accounts', cycle.startBreakdown.accountsTotal], ['Investments', cycle.startBreakdown.investmentsTotal],
                              ['Goals', cycle.startBreakdown.goalsTotal], ['Jewellery', cycle.startBreakdown.jewelleryTotal],
                              ['Loans', cycle.startBreakdown.loansTotal]].filter(([, v]) => v > 0).map(([label, value]) => (
                              <div key={label} className="bg-white rounded-lg p-2 text-xs">
                                <p className="text-gray-400">{label}</p>
                                <p className="font-semibold text-gray-800">{fmt(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cycle.status === 'exempt' && <p className="text-xs text-gray-500 bg-gray-100 rounded-lg p-3">ℹ️ Wealth was below Nisab at year end. Zakat was not required for this cycle.</p>}
                      {cycle.status === 'paid'   && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-3">✅ Zakat paid. JazakAllah Khayran.</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {historyView === 'payments' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">All Zakat Payments</h3>
            <p className="text-xs text-gray-500 mt-0.5">Individual transaction records</p>
          </div>
          {zakatPayments.length === 0 ? (
            <div className="p-8 text-center"><p className="text-sm text-gray-400">No payment records yet.</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {zakatPayments.map(pmt => (
                <div key={pmt.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${pmt.type === 'installment' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                        {pmt.type === 'installment' ? <CalendarDays className="w-4 h-4 text-blue-600" /> : <CreditCard className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{pmt.type === 'installment' ? `Installment Plan (${pmt.numberOfInstallments}x)` : 'Full Payment'}</p>
                        <p className="text-xs text-gray-500">{fmtDate(pmt.startDate)}</p>
                        {pmt.fromAccountName && <p className="text-xs text-gray-400">From: {pmt.fromAccountName}</p>}
                        {pmt.note && <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{pmt.note}</p>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">{fmt(pmt.totalAmount)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pmt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : pmt.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {pmt.status === 'completed' ? 'Completed' : pmt.status === 'active' ? 'In Progress' : pmt.status}
                      </span>
                    </div>
                  </div>
                  {pmt.type === 'installment' && pmt.installments && (
                    <div className="mt-3 ml-11">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress: {fmt(pmt.paidAmount || 0)} / {fmt(pmt.totalAmount)}</span>
                        <span>{Math.round(((pmt.paidAmount || 0) / pmt.totalAmount) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, ((pmt.paidAmount || 0) / pmt.totalAmount) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}