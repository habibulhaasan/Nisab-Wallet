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
} from '@/lib/zakatUtils';
import {
  recordZakatPayment,
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
  const [zakatPayments,   setZakatPayments]   = useState([]);

  const [loading,             setLoading]             = useState(true);
  const [showSettingsModal,   setShowSettingsModal]   = useState(false);
  const [showPaymentModal,    setShowPaymentModal]    = useState(false);
  const [prefillPayAmount,    setPrefillPayAmount]    = useState(null);
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
        }
        if (data.status === 'due' && !foundDue) {
          foundDue = data;
        }
      }
      setCycleHistory(cycles); setDueCycle(foundDue);
      if (!foundActive) { setActiveCycle(null); }
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
            <button onClick={() => { setPrefillPayAmount(null); setShowPaymentModal(true); }}
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
                <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                  {/* DUE header */}
                  <div className="px-5 py-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">Zakat Payment Due</p>
                      <p className="text-sm text-gray-500">One Hijri year has passed. Pay in full or in parts — each payment is recorded separately.</p>
                    </div>
                  </div>

                  {/* Zakat amount + progress */}
                  {(() => {
                    const cycle      = (dueCycle && dueCycle.id !== activeCycle?.id) ? dueCycle : activeCycle;
                    const dueTotal   = cycle?.zakatDue || zakatAmount;
                    const paidSoFar  = cycle?.totalPaid || 0;
                    const remaining  = Math.max(0, dueTotal - paidSoFar);
                    const pct        = dueTotal > 0 ? Math.min(100, Math.round((paidSoFar / dueTotal) * 100)) : 0;
                    const payments   = cycle?.payments || [];

                    return (
                      <div className="px-5 pb-4 space-y-4">
                        {/* Summary row */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                            <p className="text-[10px] text-red-500 font-semibold uppercase">Total Due</p>
                            <p className="text-sm font-bold text-red-700">{fmt(dueTotal)}</p>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                            <p className="text-[10px] text-emerald-500 font-semibold uppercase">Paid</p>
                            <p className="text-sm font-bold text-emerald-700">{fmt(paidSoFar)}</p>
                          </div>
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                            <p className="text-[10px] text-amber-500 font-semibold uppercase">Remaining</p>
                            <p className="text-sm font-bold text-amber-700">{fmt(remaining)}</p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {paidSoFar > 0 && (
                          <div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{pct}% paid</p>
                          </div>
                        )}

                        {/* Payment records accordion */}
                        {payments.length > 0 && (
                          <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Payment Records ({payments.length})
                              </p>
                              <p className="text-xs text-emerald-600 font-semibold">{fmt(paidSoFar)} paid</p>
                            </div>
                            <div className="divide-y divide-gray-50">
                              {payments.map((p, i) => (
                                <div key={p.paymentId || i} className="flex items-center gap-3 px-4 py-3">
                                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800">{fmt(p.amount)}</p>
                                    <p className="text-xs text-gray-400">
                                      {fmtDate(p.date)}
                                      {p.accountName ? ` · ${p.accountName}` : ''}
                                      {p.recipient   ? ` · to ${p.recipient}` : ''}
                                      {p.note        ? ` · ${p.note}`         : ''}
                                    </p>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-400">#{i + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setPrefillPayAmount(null); setShowPaymentModal(true); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors">
                            <CreditCard className="w-4 h-4" />
                            {paidSoFar > 0 ? 'Pay More' : 'Pay Zakat'}
                          </button>
                          {paidSoFar > 0 && remaining > 0 && (
                            <button
                              onClick={() => { setPrefillPayAmount(Math.round(remaining * 100) / 100); setShowPaymentModal(true); }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors">
                              <CreditCard className="w-4 h-4" />
                              Pay Remaining ({fmt(remaining)})
                            </button>
                          )}
                          <button onClick={markAsExempt}
                            className="px-4 py-2.5 bg-gray-100 text-gray-600 font-medium text-sm rounded-xl hover:bg-gray-200 transition-colors">
                            Exempt
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* ── Installment Plan Card — always visible when plan exists ── */}
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
                <p><strong>Riba (Interest) Excluded:</strong> Any interest/riba marked on your accounts (<code>ribaBalance</code>) is automatically deducted — it is impure wealth and must be given to charity, not counted in Zakat.</p>
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
        <PayZakatModal
          zakatDueTotal={dueCycle && dueCycle.id !== activeCycle?.id ? (dueCycle.zakatDue || 0) : zakatAmount}
          alreadyPaid={(dueCycle && dueCycle.id !== activeCycle?.id ? dueCycle : activeCycle)?.totalPaid || 0}
          activeCycle={dueCycle && dueCycle.id !== activeCycle?.id ? dueCycle : activeCycle}
          accounts={accounts} userId={user.uid} fmt={fmt}
          prefillAmount={prefillPayAmount}
          onClose={() => { setShowPaymentModal(false); setPrefillPayAmount(null); }}
          onSuccess={async (isFullyPaid, paid, remaining) => {
            setShowPaymentModal(false);
            setPrefillPayAmount(null);
            showToast(
              isFullyPaid
                ? 'JazakAllah Khayran! Zakat fully paid. 🤲'
                : `৳${paid.toLocaleString()} recorded. ৳${remaining.toLocaleString()} remaining.`,
              'success'
            );
            await loadZakatCycles();
            await loadAllAssets();
            await loadPaymentHistory();
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

// ─── Pay Zakat Modal (partial-payment friendly) ───────────────────────────────

function PayZakatModal({ zakatDueTotal, alreadyPaid, activeCycle, accounts, userId, fmt, onClose, onSuccess, prefillAmount }) {
  const totalPaid    = alreadyPaid || 0;
  const remaining    = Math.max(0, zakatDueTotal - totalPaid);

  const sortedAccounts = [...accounts]
    .filter(a => Number(a.balance) > 0)
    .sort((a, b) => {
      if (a.type?.toLowerCase() === 'cash') return -1;
      if (b.type?.toLowerCase() === 'cash') return 1;
      return a.name.localeCompare(b.name);
    });

  const [amount,      setAmount]      = useState(prefillAmount != null ? String(prefillAmount) : String(Math.round(remaining * 100) / 100));
  const [accountId,   setAccountId]   = useState(sortedAccounts[0]?.id || '');
  const [recipient,   setRecipient]   = useState('');
  const [note,        setNote]        = useState('');
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const parsed   = parseFloat(amount) || 0;
  const selAcc   = sortedAccounts.find(a => a.id === accountId);
  const afterPay = parsed > 0 && selAcc ? selAcc.balance - parsed : null;
  const newTotal = totalPaid + parsed;
  const newRemaining = Math.max(0, zakatDueTotal - newTotal);
  const isFullPay    = newTotal >= zakatDueTotal;

  const handlePay = async () => {
    setError('');
    if (parsed <= 0)               { setError('Enter a valid amount.'); return; }
    if (!accountId || !selAcc)     { setError('Select an account.'); return; }
    if (parsed > selAcc.balance)   { setError(`Insufficient balance in ${selAcc.name}.`); return; }

    setSaving(true);
    const res = await recordZakatPayment(userId, {
      cycleDocId:        activeCycle.id,
      zakatDueTotal,
      paymentAmount:     parsed,
      fromAccountId:     accountId,
      fromAccountName:   selAcc.name,
      fromAccountBalance: selAcc.balance,
      paymentDate:       date,
      recipient,
      note,
    });
    setSaving(false);

    if (res.success) {
      onSuccess(res.isFullyPaid, parsed, newRemaining);
    } else {
      setError(res.error || 'Payment failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh]">

        {/* Header */}
        <div className="flex-shrink-0 bg-emerald-600 px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-white" />
            <div>
              <p className="text-white font-bold">Pay Zakat</p>
              <p className="text-emerald-200 text-xs">
                {totalPaid > 0 ? `${fmt(totalPaid)} paid · ${fmt(remaining)} remaining` : `Total due: ${fmt(zakatDueTotal)}`}
              </p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-white/80 hover:text-white" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-[10px] text-red-500 font-semibold uppercase">Total Due</p>
              <p className="text-sm font-bold text-red-700">{fmt(zakatDueTotal)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-[10px] text-emerald-500 font-semibold uppercase">Paid So Far</p>
              <p className="text-sm font-bold text-emerald-700">{fmt(totalPaid)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-[10px] text-amber-500 font-semibold uppercase">Remaining</p>
              <p className="text-sm font-bold text-amber-700">{fmt(remaining)}</p>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Payment Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
              <input
                type="number" min="0.01" step="0.01"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                className="w-full pl-8 pr-3 py-3 border-2 border-emerald-200 bg-emerald-50 rounded-xl text-xl font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="0.00"
              />
            </div>
            {/* Quick fill buttons */}
            <div className="flex gap-2 mt-2">
              <button onClick={() => setAmount(String(Math.round(remaining * 100) / 100))}
                className="flex-1 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                Pay All ({fmt(remaining)})
              </button>
              {remaining > 0 && (
                <button onClick={() => setAmount(String(Math.round(remaining / 2 * 100) / 100))}
                  className="flex-1 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Half ({fmt(remaining / 2)})
                </button>
              )}
            </div>
          </div>

          {/* After-payment preview */}
          {parsed > 0 && (
            <div className={`flex items-start gap-3 p-3 rounded-xl border ${isFullPay ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-100'}`}>
              <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isFullPay ? 'text-emerald-600' : 'text-blue-500'}`} />
              <div className="text-xs">
                {isFullPay ? (
                  <p className="font-semibold text-emerald-800">✓ This will fully clear your Zakat!</p>
                ) : (
                  <>
                    <p className="font-semibold text-blue-800">After this payment:</p>
                    <p className="text-blue-700">{fmt(newRemaining)} will still remain due</p>
                  </>
                )}
                {afterPay !== null && (
                  <p className={`mt-0.5 ${afterPay < 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    {selAcc?.name} balance after: {fmt(Math.max(0, afterPay))}
                    {afterPay < 0 && ' ⚠ Insufficient!'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Account selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Pay From Account</label>
            <div className="space-y-2">
              {sortedAccounts.map(acc => (
                <button key={acc.id} onClick={() => setAccountId(acc.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${accountId === acc.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800">{acc.name}
                      <span className="ml-1.5 text-xs text-gray-400 font-normal">({acc.type})</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Balance: <span className="font-semibold text-gray-700">{fmt(acc.balance)}</span></p>
                  </div>
                  {accountId === acc.id && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                </button>
              ))}
              {sortedAccounts.length === 0 && (
                <p className="text-sm text-red-500 p-3 bg-red-50 rounded-xl">No accounts with balance available.</p>
              )}
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Recipient <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
            <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)}
              placeholder="e.g. Local mosque, charity name…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Payment Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Note <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Any notes…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 text-sm">
            Cancel
          </button>
          <button onClick={handlePay} disabled={saving || parsed <= 0 || !accountId}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording…</> : <><CreditCard className="w-4 h-4" /> Record Payment</>}
          </button>
        </div>
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

  // ── Analytics computations ──────────────────────────────────────────────────
  const completedCycles = cycleHistory.filter(c => c.status === 'paid' || c.status === 'exempt');
  const paidCycles      = cycleHistory.filter(c => c.status === 'paid');
  const exemptCycles    = cycleHistory.filter(c => c.status === 'exempt');
  const activeCycles    = cycleHistory.filter(c => c.status === 'active' || c.status === 'due');

  const totalZakatPaid  = paidCycles.reduce((s, c) => s + (c.zakatPaid || 0), 0);
  const totalZakatDue   = paidCycles.reduce((s, c) => s + (c.zakatDue  || 0), 0);
  const avgZakatPerCycle = paidCycles.length > 0 ? totalZakatPaid / paidCycles.length : 0;

  const allPayments = cycleHistory.flatMap(c => (c.payments || []).map(p => ({ ...p, cycleId: c.id })));
  const largestPayment  = allPayments.reduce((m, p) => p.amount > (m?.amount || 0) ? p : m, null);
  const smallestPayment = allPayments.length > 0 ? allPayments.reduce((m, p) => p.amount < (m?.amount || Infinity) ? p : m, null) : null;

  // Wealth growth: compare startWealth across sorted cycles
  const sortedByDate = [...cycleHistory].filter(c => c.startWealth).sort((a, b) => a.startDate?.localeCompare(b.startDate));
  const wealthGrowth = sortedByDate.length >= 2
    ? ((sortedByDate.at(-1).startWealth - sortedByDate[0].startWealth) / sortedByDate[0].startWealth * 100).toFixed(1)
    : null;

  // Payment discipline: % of due cycles that were fully paid on time
  const disciplinePct = completedCycles.length > 0
    ? Math.round((paidCycles.length / completedCycles.length) * 100)
    : null;

  // Bar chart data: zakatDue per completed cycle (up to last 8)
  const chartCycles = paidCycles.slice(-8).map((c, i) => ({
    label:    `C${cycleHistory.length - cycleHistory.indexOf(c)}`,
    due:      c.zakatDue  || 0,
    paid:     c.zakatPaid || 0,
    date:     c.startDate,
  }));
  const chartMax = Math.max(...chartCycles.map(c => c.due), 1);

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

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ id: 'cycles', label: 'Cycles' }, { id: 'analytics', label: 'Analytics' }].map(({ id, label }) => (
          <button key={id} onClick={() => setHistoryView(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${historyView === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════ CYCLES TAB ══════════ */}
      {historyView === 'cycles' && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Cycles', value: cycleHistory.length,    color: 'text-gray-900' },
              { label: 'Paid',         value: paidCycles.length,      color: 'text-emerald-700' },
              { label: 'Total Paid',   value: fmt(totalZakatPaid),    color: 'text-gray-900', small: true },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <p className={`font-bold ${s.small ? 'text-base' : 'text-2xl'} ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">All Cycles</h3>
            </div>
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
                      <div className="border-t border-gray-100 bg-gray-50/60 px-5 pb-5 pt-4 space-y-5">

                        {/* ── Cycle summary strip ── */}
                        {(() => {
                          const zakatDue  = cycle.zakatDue  || 0;
                          const zakatPaid = cycle.zakatPaid || cycle.totalPaid || 0;
                          const remaining = Math.max(0, zakatDue - zakatPaid);
                          const pct       = zakatDue > 0 ? Math.min(100, Math.round((zakatPaid / zakatDue) * 100)) : 0;
                          return zakatDue > 0 ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Zakat Summary</p>
                              <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                  <p className="text-[10px] text-red-500 font-semibold uppercase mb-0.5">Total Due</p>
                                  <p className="text-base font-bold text-red-700">{fmt(zakatDue)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-emerald-500 font-semibold uppercase mb-0.5">Paid</p>
                                  <p className="text-base font-bold text-emerald-700">{fmt(zakatPaid)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-amber-500 font-semibold uppercase mb-0.5">Remaining</p>
                                  <p className={`text-base font-bold ${remaining > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{fmt(remaining)}</p>
                                </div>
                              </div>
                              {zakatDue > 0 && (
                                <div>
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-1">{pct}% paid</p>
                                </div>
                              )}
                            </div>
                          ) : null;
                        })()}

                        {/* ── Cycle dates & wealth ── */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">Cycle Details</p>
                          <div className="divide-y divide-gray-50">
                            {[
                              { label: 'Started',         value: fmtDate(cycle.startDate),              icon: '📅' },
                              { label: 'Started (Hijri)', value: formatHijriDate(cycle.startDateHijri),  icon: '🌙' },
                              cycle.endDate && { label: 'Ended',  value: fmtDate(cycle.endDate),         icon: '📅' },
                              { label: 'Wealth at Start', value: fmt(cycle.startWealth || 0),            icon: '💰' },
                              cycle.endWealth !== undefined && { label: 'Wealth at End', value: fmt(cycle.endWealth), icon: '💰' },
                              { label: 'Nisab at Start',  value: fmt(cycle.nisabAtStart || 0),           icon: '⚖️' },
                              cycle.nisabAtEnd && { label: 'Nisab at Year End', value: fmt(cycle.nisabAtEnd), icon: '⚖️' },
                            ].filter(Boolean).map((row, i) => (
                              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                                <p className="text-xs text-gray-500 flex items-center gap-1.5"><span>{row.icon}</span>{row.label}</p>
                                <p className="text-xs font-semibold text-gray-800">{row.value}</p>
                              </div>
                            ))}
                            <div className="flex items-center justify-between px-4 py-2.5">
                              <p className="text-xs text-gray-500 flex items-center gap-1.5"><span>📋</span>Status</p>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusBadge[cycle.status] || statusBadge.exempt}`}>
                                {cycle.status === 'paid' ? 'Paid ✓' : cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ── Nisab auto-fetch note ── */}
                        {cycle.nisabAtEndNote && (
                          <div className={`flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed ${cycle.nisabAtEndFetched ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                            <Sparkles className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cycle.nisabAtEndFetched ? 'text-emerald-600' : 'text-amber-600'}`} />
                            <div>
                              <p className="font-semibold mb-0.5">Nisab at Year End</p>
                              <p>{cycle.nisabAtEndNote}</p>
                              {cycle.silverPerGramAtEnd && <p className="text-gray-500 mt-0.5">Silver: ৳{Number(cycle.silverPerGramAtEnd).toLocaleString()}/gram</p>}
                            </div>
                          </div>
                        )}

                        {/* ── Payment records ── */}
                        {cycle.payments && cycle.payments.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 pt-3 pb-2">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payments ({cycle.payments.length})</p>
                              <p className="text-xs font-semibold text-emerald-600">{fmt(cycle.zakatPaid || cycle.totalPaid || 0)} paid</p>
                            </div>
                            <div className="divide-y divide-gray-50">
                              {cycle.payments.map((pmt, pi) => (
                                <div key={pmt.paymentId || pi} className="flex items-start gap-3 px-4 py-3">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-semibold text-gray-800">{fmt(pmt.amount)}</p>
                                      <p className="text-xs text-gray-400 flex-shrink-0">{fmtDate(pmt.date)}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">#{pi + 1}{pmt.accountName ? ` · ${pmt.accountName}` : ''}{pmt.recipient ? ` · to ${pmt.recipient}` : ''}</p>
                                    {pmt.note && <p className="text-xs text-gray-400 mt-0.5 italic">"{pmt.note}"</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Wealth breakdown ── */}
                        {cycle.startBreakdown && Object.values(cycle.startBreakdown).some(v => v > 0) && (
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">Wealth Breakdown at Start</p>
                            <div className="divide-y divide-gray-50">
                              {[['Accounts', cycle.startBreakdown.accountsTotal], ['Investments', cycle.startBreakdown.investmentsTotal],
                                ['Goals', cycle.startBreakdown.goalsTotal], ['Jewellery', cycle.startBreakdown.jewelleryTotal],
                                ['Loans (−)', cycle.startBreakdown.loansTotal]].filter(([, v]) => v > 0).map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                                  <p className="text-xs text-gray-500">{label}</p>
                                  <p className="text-xs font-semibold text-gray-800">{fmt(value)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cycle.status === 'exempt' && <p className="text-xs text-gray-600 bg-gray-100 rounded-xl p-3">ℹ️ Wealth was below Nisab at year end — Zakat was not required for this cycle.</p>}
                        {cycle.status === 'paid'   && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">✅ Zakat fully paid. JazakAllah Khayran.</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ══════════ ANALYTICS TAB ══════════ */}
      {historyView === 'analytics' && (
        <div className="space-y-4">

          {/* ── Key metrics grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '🕌', label: 'Total Cycles',      value: cycleHistory.length,        sub: `${activeCycles.length} active` },
              { icon: '✅', label: 'Fully Paid',         value: paidCycles.length,          sub: `${exemptCycles.length} exempt` },
              { icon: '💸', label: 'Total Zakat Paid',   value: fmt(totalZakatPaid),        sub: totalZakatDue > 0 ? `of ${fmt(totalZakatDue)} due` : 'all-time', small: true },
              { icon: '📊', label: 'Avg per Cycle',      value: fmt(avgZakatPerCycle),      sub: 'paid cycles only', small: true },
            ].map((m, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-xl mb-1">{m.icon}</p>
                <p className={`font-bold text-gray-900 ${m.small ? 'text-base' : 'text-2xl'}`}>{m.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{m.label}</p>
                {m.sub && <p className="text-[10px] text-gray-400 mt-0.5">{m.sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Payment discipline ── */}
          {disciplinePct !== null && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Payment Discipline</p>
                  <p className="text-xs text-gray-400">How consistently you've paid Zakat when due</p>
                </div>
                <p className={`text-2xl font-bold ${disciplinePct >= 80 ? 'text-emerald-600' : disciplinePct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {disciplinePct}%
                </p>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${disciplinePct >= 80 ? 'bg-emerald-500' : disciplinePct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${disciplinePct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                <span>{paidCycles.length} paid</span>
                <span>{exemptCycles.length} exempt</span>
                <span>{completedCycles.length} completed total</span>
              </div>
            </div>
          )}

          {/* ── Zakat per cycle bar chart ── */}
          {chartCycles.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-gray-800 text-sm mb-1">Zakat Due per Cycle</p>
              <p className="text-xs text-gray-400 mb-4">Last {chartCycles.length} paid cycles</p>
              <div className="flex items-end gap-2 h-28">
                {chartCycles.map((c, i) => {
                  const pct = Math.round((c.due / chartMax) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full flex items-end" style={{ height: '88px' }}>
                        <div className="w-full bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600"
                          style={{ height: `${Math.max(4, pct)}%` }}
                          title={`${c.label}: ${fmt(c.due)}`} />
                      </div>
                      <p className="text-[10px] text-gray-400">{c.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-2 border-t border-gray-50 pt-2">
                <span>Lowest: {fmt(Math.min(...chartCycles.map(c => c.due)))}</span>
                <span>Highest: {fmt(Math.max(...chartCycles.map(c => c.due)))}</span>
              </div>
            </div>
          )}

          {/* ── Wealth trend ── */}
          {sortedByDate.length >= 2 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-gray-800 text-sm mb-3">Wealth at Cycle Start — Trend</p>
              <div className="space-y-2">
                {sortedByDate.slice(-6).map((c, i, arr) => {
                  const pct = Math.round((c.startWealth / Math.max(...arr.map(x => x.startWealth))) * 100);
                  const prev = arr[i - 1];
                  const diff = prev ? c.startWealth - prev.startWealth : null;
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <p className="text-[10px] text-gray-400 w-20 flex-shrink-0">{fmtDate(c.startDate)}</p>
                      <div className="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${Math.max(4, pct)}%` }} />
                      </div>
                      <p className="text-xs font-semibold text-gray-700 w-24 text-right flex-shrink-0">{fmt(c.startWealth)}</p>
                      {diff !== null && (
                        <p className={`text-[10px] w-14 text-right flex-shrink-0 font-medium ${diff >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                          {diff >= 0 ? '▲' : '▼'} {fmt(Math.abs(diff))}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {wealthGrowth !== null && (
                <p className={`text-xs mt-3 font-medium ${Number(wealthGrowth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {Number(wealthGrowth) >= 0 ? '📈' : '📉'} Wealth {Number(wealthGrowth) >= 0 ? 'grew' : 'decreased'} by {Math.abs(wealthGrowth)}% since first cycle
                </p>
              )}
            </div>
          )}

          {/* ── Notable payments ── */}
          {allPayments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">Notable Payments</p>
              <div className="divide-y divide-gray-50">
                {[
                  largestPayment  && { label: '🏆 Largest single payment',  pmt: largestPayment  },
                  smallestPayment && smallestPayment !== largestPayment && { label: '🌱 Smallest single payment', pmt: smallestPayment },
                ].filter(Boolean).map(({ label, pmt }, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700">{label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {fmtDate(pmt.date)}{pmt.accountName ? ` · ${pmt.accountName}` : ''}{pmt.recipient ? ` · to ${pmt.recipient}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{fmt(pmt.amount)}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-gray-700">🔢 Total payments made</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">across all cycles</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{allPayments.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty state for analytics */}
          {paidCycles.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="font-medium text-gray-600 text-sm">Analytics available after first paid cycle</p>
              <p className="text-xs text-gray-400 mt-1">Complete your first Zakat cycle to see trends and insights here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}