// src/app/dashboard/zakat/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAccounts } from '@/lib/firestoreCollections';
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
  fetchAndCalculateWealth,
} from '@/lib/zakatMonitoring';
import { useSettings, formatAmount } from '@/hooks/useSettings';
import { showToast } from '@/components/Toast';
import {
  Star, Wallet, Calendar, Clock, CheckCircle2, AlertCircle,
  Settings, History, Calculator, ChevronDown, ChevronUp,
  CreditCard, CalendarDays, X, Loader2, Info, Banknote,
  Building2, Smartphone, Coins, HandCoins, TrendingUp, Target,
  Minus, ArrowRight, Check,
} from 'lucide-react';

export default function ZakatPage() {
  const { user } = useAuth();
  const settings = useSettings();

  // ── Raw data ─────────────────────────────────────────────────────────────
  const [accounts,        setAccounts]        = useState([]);
  const [lendings,        setLendings]        = useState([]);
  const [loans,           setLoans]           = useState([]);
  const [investments,     setInvestments]     = useState([]);
  const [goals,           setGoals]           = useState([]);

  // ── Nisab settings ───────────────────────────────────────────────────────
  const [nisabThreshold,      setNisabThreshold]      = useState(0);
  const [silverPricePerGram,  setSilverPricePerGram]  = useState(0);
  const [silverPricePerVori,  setSilverPricePerVori]  = useState(0);
  const [priceUnit,           setPriceUnit]           = useState('gram');

  // ── Zakat cycle state ────────────────────────────────────────────────────
  const [activeCycle,     setActiveCycle]     = useState(null);
  const [cycleHistory,    setCycleHistory]    = useState([]);
  const [wealthBreakdown, setWealthBreakdown] = useState(null);
  const [activePayment,   setActivePayment]   = useState(null); // installment plan

  // ── UI state ─────────────────────────────────────────────────────────────
  const [loading,           setLoading]           = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPaymentModal,  setShowPaymentModal]  = useState(false);
  const [activeTab,         setActiveTab]         = useState('overview'); // 'overview' | 'history'
  const [expandedCycleId,   setExpandedCycleId]  = useState(null);

  // Constants
  const NISAB_SILVER_GRAMS = 612.36;
  const NISAB_SILVER_VORI  = 52.5;

  // ── Load all data ────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([
      loadAllAssets(),
      loadNisabSettings(),
      loadZakatCycles(),
    ]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadAllAssets = async () => {
    try {
      const [accResult, lendSnap, loanSnap, invSnap, goalSnap] = await Promise.all([
        getAccounts(user.uid),
        getDocs(collection(db, 'users', user.uid, 'lendings')),
        getDocs(collection(db, 'users', user.uid, 'loans')),
        getDocs(collection(db, 'users', user.uid, 'investments')),
        getDocs(collection(db, 'users', user.uid, 'financialGoals')),
      ]);

      const accs = accResult.success ? accResult.accounts : [];
      const lends = lendSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const lns   = loanSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const invs  = invSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const gls   = goalSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      setAccounts(accs);
      setLendings(lends);
      setLoans(lns);
      setInvestments(invs);
      setGoals(gls);

      const breakdown = calculateZakatableWealth({
        accounts: accs, lendings: lends, loans: lns, investments: invs, goals: gls,
      });
      setWealthBreakdown(breakdown);
    } catch (err) {
      console.error('Error loading assets:', err);
    }
  };

  const loadNisabSettings = async () => {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'settings'));
      snap.forEach((d) => {
        const data = d.data();
        if (data.nisabThreshold    !== undefined) setNisabThreshold(data.nisabThreshold);
        if (data.silverPricePerGram !== undefined) setSilverPricePerGram(data.silverPricePerGram);
        if (data.silverPricePerVori !== undefined) setSilverPricePerVori(data.silverPricePerVori);
        if (data.priceUnit           !== undefined) setPriceUnit(data.priceUnit);
      });
    } catch (err) {
      console.error('Error loading nisab settings:', err);
    }
  };

  const loadZakatCycles = async () => {
    try {
      const q    = query(collection(db, 'users', user.uid, 'zakatCycles'), orderBy('startDate', 'desc'));
      const snap = await getDocs(q);
      const cycles = [];
      let foundActive = false;

      for (const docSnap of snap.docs) {
        const data = { id: docSnap.id, ...docSnap.data() };
        cycles.push(data);
        if (data.status === 'active' && !foundActive) {
          setActiveCycle(data);
          foundActive = true;
          // Load installment plan if exists
          const plan = await getActivePaymentPlan(user.uid, docSnap.id);
          setActivePayment(plan);
        }
      }
      setCycleHistory(cycles);
      if (!foundActive) { setActiveCycle(null); setActivePayment(null); }
    } catch (err) {
      console.error('Error loading cycles:', err);
    }
  };

  // ── Nisab calculations ───────────────────────────────────────────────────
  const calculateNisabFromPrice = () => {
    if (priceUnit === 'gram') return silverPricePerGram * NISAB_SILVER_GRAMS;
    return silverPricePerVori * NISAB_SILVER_VORI;
  };

  const saveNisabSettings = async () => {
    try {
      const calculated = calculateNisabFromPrice();
      const settingsData = {
        nisabThreshold:     calculated,
        silverPricePerGram: parseFloat(silverPricePerGram) || 0,
        silverPricePerVori: parseFloat(silverPricePerVori) || 0,
        priceUnit,
        updatedAt:          serverTimestamp(),
      };
      const settingsRef = collection(db, 'users', user.uid, 'settings');
      const snap        = await getDocs(settingsRef);
      if (snap.empty) {
        await addDoc(settingsRef, settingsData);
      } else {
        await updateDoc(doc(db, 'users', user.uid, 'settings', snap.docs[0].id), settingsData);
      }
      setNisabThreshold(calculated);
      setShowSettingsModal(false);
      showToast('Nisab settings saved!', 'success');
      await checkAndStartCycle(calculated);
    } catch (err) {
      showToast('Error saving settings: ' + err.message, 'error');
    }
  };

  const checkAndStartCycle = async (nisabValue) => {
    const wealth = wealthBreakdown?.netZakatableWealth || 0;
    if (wealth >= nisabValue && nisabValue > 0 && !activeCycle) {
      await startNewCycle(wealth, nisabValue);
    }
  };

  const startNewCycle = async (wealthAmount, nisabAmount) => {
    try {
      const today    = new Date().toISOString().split('T')[0];
      const hijriDate = gregorianToHijri(today);
      const cycleId  = generateId();
      const newCycle = {
        cycleId,
        status:         'active',
        startDate:      today,
        startDateHijri: hijriDate,
        startWealth:    wealthAmount,
        startBreakdown: wealthBreakdown,
        nisabAtStart:   nisabAmount,
        paymentStatus:  'unpaid',
        createdAt:      serverTimestamp(),
      };
      await addDoc(collection(db, 'users', user.uid, 'zakatCycles'), newCycle);
      await loadZakatCycles();
      showToast('Zakat monitoring cycle started!', 'success');
    } catch (err) {
      console.error('Error starting cycle:', err);
    }
  };

  const markAsExempt = async () => {
    if (!activeCycle) return;
    try {
      const today     = new Date().toISOString().split('T')[0];
      const hijriDate = gregorianToHijri(today);
      await updateDoc(doc(db, 'users', user.uid, 'zakatCycles', activeCycle.id), {
        status:       'exempt',
        endDate:      today,
        endDateHijri: hijriDate,
        endWealth:    wealthBreakdown?.netZakatableWealth || 0,
        updatedAt:    serverTimestamp(),
      });
      await loadZakatCycles();
      showToast('Cycle marked as exempt.', 'info');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  // ── Derived Zakat status ─────────────────────────────────────────────────
  const totalWealth = wealthBreakdown?.netZakatableWealth || 0;
  let zakatStatus       = ZAKAT_STATUS.NOT_MANDATORY;
  let progressPercentage = 0;
  let daysRemaining     = 0;
  let yearEndDate       = null;
  let zakatAmount       = 0;

  if (nisabThreshold > 0) {
    progressPercentage = Math.min((totalWealth / nisabThreshold) * 100, 100);
    zakatAmount        = calculateZakat(totalWealth);

    if (activeCycle && activeCycle.status === 'active') {
      if (hasOneHijriYearPassed(activeCycle.startDate)) {
        zakatStatus = totalWealth >= nisabThreshold ? ZAKAT_STATUS.DUE : ZAKAT_STATUS.EXEMPT;
      } else {
        zakatStatus     = ZAKAT_STATUS.MONITORING;
        daysRemaining   = daysUntilHijriAnniversary(activeCycle.startDate);
        yearEndDate     = addOneHijriYear(activeCycle.startDate);
      }
    } else if (totalWealth >= nisabThreshold) {
      zakatStatus = ZAKAT_STATUS.NOT_MANDATORY; // will show "start cycle" prompt
    }
  }

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

  const fmt = (n) => formatAmount(n, settings.currency);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Zakat Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor your Zakat obligations</p>
        </div>
        <div className="flex items-center gap-2">
          {zakatStatus === ZAKAT_STATUS.DUE && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <CreditCard className="w-4 h-4" />
              Pay Zakat
            </button>
          )}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Nisab Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Overview',        icon: Star       },
          { id: 'history',  label: 'Zakat History',   icon: History    },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════ OVERVIEW TAB ══════ */}
      {activeTab === 'overview' && (
        <>
          {/* Main Status Card */}
          <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border border-emerald-200 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>
            <div className="relative p-6 md:p-8">
              {/* Status header */}
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
                  'bg-emerald-600 text-white'
                }`}>
                  {zakatStatus}
                </span>
              </div>

              {/* Wealth grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <WealthStatCard
                  label="Net Zakatable Wealth"
                  value={fmt(totalWealth)}
                  sub="After liabilities"
                  icon={<Wallet className="w-4 h-4 text-emerald-600" />}
                />
                <WealthStatCard
                  label="Nisab Threshold"
                  value={nisabThreshold > 0 ? fmt(nisabThreshold) : 'Not set'}
                  sub="52.5 Tola Silver"
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                />
                {zakatStatus === ZAKAT_STATUS.DUE && (
                  <WealthStatCard
                    label="Zakat Due (2.5%)"
                    value={fmt(zakatAmount)}
                    sub="Obligatory amount"
                    icon={<AlertCircle className="w-4 h-4 text-red-600" />}
                    highlight
                  />
                )}
                {zakatStatus === ZAKAT_STATUS.MONITORING && activeCycle && (
                  <WealthStatCard
                    label="Days Remaining"
                    value={`${daysRemaining} days`}
                    sub={yearEndDate ? `Until ${yearEndDate.toLocaleDateString()}` : ''}
                    icon={<Clock className="w-4 h-4 text-blue-600" />}
                  />
                )}
              </div>

              {/* Progress bar */}
              {nisabThreshold > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress to Nisab</span>
                    <span className="text-sm font-semibold text-emerald-600">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner border border-emerald-100">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status message blocks */}
              {zakatStatus === ZAKAT_STATUS.NOT_MANDATORY && nisabThreshold > 0 && totalWealth >= nisabThreshold && !activeCycle && (
                <ActionBlock
                  icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                  title="Wealth Reached Nisab!"
                  body={`Your wealth (${fmt(totalWealth)}) has reached the Nisab threshold (${fmt(nisabThreshold)}). Start monitoring now.`}
                  action={{ label: 'Start Monitoring Cycle', onClick: () => checkAndStartCycle(nisabThreshold), color: 'green' }}
                />
              )}

              {zakatStatus === ZAKAT_STATUS.NOT_MANDATORY && (nisabThreshold === 0 || totalWealth < nisabThreshold) && (
                <ActionBlock
                  icon={<AlertCircle className="w-5 h-5 text-gray-600" />}
                  title="No Active Cycle"
                  body={nisabThreshold === 0
                    ? 'Set the Nisab threshold in settings to begin tracking.'
                    : `Your wealth (${fmt(totalWealth)}) has not reached the Nisab threshold (${fmt(nisabThreshold)}).`}
                />
              )}

              {zakatStatus === ZAKAT_STATUS.MONITORING && activeCycle && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">Monitoring Active</p>
                      <p className="text-sm text-gray-600 mb-4">
                        Monitoring since your wealth reached Nisab. One Hijri year must pass.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <MiniInfoCard label="Cycle Started (Hijri)" value={formatHijriDate(activeCycle.startDateHijri)} icon={<Calendar className="w-3 h-3 text-blue-600" />} />
                        <MiniInfoCard label="Started (Gregorian)" value={new Date(activeCycle.startDate).toLocaleDateString()} icon={<Calendar className="w-3 h-3 text-blue-600" />} />
                        <MiniInfoCard label="Days Remaining" value={`${daysRemaining} days`} sub={yearEndDate ? `Until ${yearEndDate.toLocaleDateString()}` : ''} icon={<Clock className="w-3 h-3 text-blue-600" />} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {zakatStatus === ZAKAT_STATUS.EXEMPT && activeCycle && (
                <ActionBlock
                  icon={<CheckCircle2 className="w-5 h-5 text-gray-600" />}
                  title="Cycle Completed — Exempt"
                  body={`One Hijri year passed but wealth (${fmt(totalWealth)}) is below Nisab (${fmt(nisabThreshold)}). You are exempt.`}
                  action={{ label: 'Mark Cycle as Exempt & Close', onClick: markAsExempt, color: 'gray' }}
                />
              )}

              {zakatStatus === ZAKAT_STATUS.DUE && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">Zakat Payment Due</p>
                      <p className="text-sm text-gray-600 mb-3">
                        One Hijri year has passed and your wealth is at or above Nisab. Zakat is now obligatory.
                      </p>
                      <div className="bg-red-50 rounded-lg p-4 mb-4">
                        <p className="text-xs text-red-600 font-medium mb-1">Zakat Amount (2.5%)</p>
                        <p className="text-2xl font-bold text-gray-900">{fmt(zakatAmount)}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                        >
                          Pay Zakat
                        </button>
                        <button
                          onClick={markAsExempt}
                          className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          Mark Exempt
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Installment Tracker (shown when active installment plan exists) */}
          {activePayment && activePayment.type === 'installment' && activePayment.status === 'active' && (
            <InstallmentTracker
              payment={activePayment}
              accounts={accounts}
              onPayInstallment={async (installmentIndex, accountId) => {
                const acc = accounts.find((a) => a.id === accountId);
                const res = await payZakatInstallment(user.uid, {
                  paymentDocId: activePayment.id,
                  installmentIndex,
                  accountBalance: acc?.balance || 0,
                });
                if (res.success) {
                  showToast('Installment paid!', 'success');
                  await loadZakatCycles();
                  await loadAllAssets();
                } else {
                  showToast('Error: ' + res.error, 'error');
                }
              }}
              fmt={fmt}
            />
          )}

          {/* Wealth Breakdown */}
          <WealthBreakdownCard
            breakdown={wealthBreakdown}
            accounts={accounts}
            lendings={lendings}
            loans={loans}
            investments={investments}
            goals={goals}
            nisabThreshold={nisabThreshold}
            fmt={fmt}
          />

          {/* Info card */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 space-y-1">
                <p className="font-semibold">How Your Zakat is Calculated</p>
                <p><strong>Included:</strong> Cash, Bank, Mobile Banking, Gold, Silver accounts + Money lent to others (receivables) + Active investments + Financial goal savings.</p>
                <p><strong>Deducted:</strong> Outstanding loan amounts you owe to others.</p>
                <p><strong>Rate:</strong> 2.5% of net zakatable wealth, once per Hijri year if wealth stays ≥ Nisab.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════ HISTORY TAB ══════ */}
      {activeTab === 'history' && (
        <ZakatHistoryTab
          cycleHistory={cycleHistory}
          expandedCycleId={expandedCycleId}
          setExpandedCycleId={setExpandedCycleId}
          fmt={fmt}
        />
      )}

      {/* ══════ PAYMENT MODAL ══════ */}
      {showPaymentModal && (
        <ZakatPaymentModal
          zakatAmount={zakatAmount}
          activeCycle={activeCycle}
          accounts={accounts}
          userId={user.uid}
          fmt={fmt}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={async () => {
            setShowPaymentModal(false);
            showToast('JazakAllah Khayran! Zakat recorded.', 'success');
            await loadZakatCycles();
            await loadAllAssets();
          }}
        />
      )}

      {/* ══════ NISAB SETTINGS MODAL ══════ */}
      {showSettingsModal && (
        <NisabSettingsModal
          priceUnit={priceUnit}
          setPriceUnit={setPriceUnit}
          silverPricePerGram={silverPricePerGram}
          setSilverPricePerGram={setSilverPricePerGram}
          silverPricePerVori={silverPricePerVori}
          setSilverPricePerVori={setSilverPricePerVori}
          calculatedNisab={calculateNisabFromPrice()}
          onSave={saveNisabSettings}
          onClose={() => setShowSettingsModal(false)}
          NISAB_SILVER_GRAMS={NISAB_SILVER_GRAMS}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function WealthStatCard({ label, value, sub, icon, highlight }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${highlight ? 'border-red-200' : 'border-emerald-100'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-semibold uppercase tracking-wide ${highlight ? 'text-red-600' : 'text-emerald-600'}`}>{label}</p>
        {icon}
      </div>
      <p className={`text-xl font-bold text-gray-900 mb-0.5 ${highlight ? 'text-red-700' : ''}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function MiniInfoCard({ label, value, sub, icon }) {
  return (
    <div className="bg-blue-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-blue-600 font-medium">{label}</p>
      </div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function ActionBlock({ icon, title, body, action }) {
  const colorMap = {
    green: 'bg-green-600 hover:bg-green-700',
    gray:  'bg-gray-900 hover:bg-gray-800',
  };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{body}</p>
          {action && (
            <button
              onClick={action.onClick}
              className={`w-full px-4 py-2.5 ${colorMap[action.color] || colorMap.gray} text-white rounded-lg transition-colors text-sm font-medium`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEALTH BREAKDOWN CARD
// ─────────────────────────────────────────────────────────────────────────────

function WealthBreakdownCard({ breakdown, accounts, lendings, loans, investments, goals, nisabThreshold, fmt }) {
  if (!breakdown) return null;

  const rows = [
    { label: 'Cash Accounts',         value: breakdown.accountBreakdown?.cash || 0,          icon: <Banknote className="w-4 h-4 text-emerald-600" />,     type: 'asset' },
    { label: 'Bank Accounts',         value: breakdown.accountBreakdown?.bank || 0,          icon: <Building2 className="w-4 h-4 text-blue-600" />,        type: 'asset' },
    { label: 'Mobile Banking',        value: breakdown.accountBreakdown?.mobile_banking || 0, icon: <Smartphone className="w-4 h-4 text-purple-600" />,    type: 'asset' },
    { label: 'Gold',                  value: breakdown.accountBreakdown?.gold || 0,          icon: <Coins className="w-4 h-4 text-amber-500" />,           type: 'asset' },
    { label: 'Silver',                value: breakdown.accountBreakdown?.silver || 0,        icon: <Coins className="w-4 h-4 text-gray-400" />,            type: 'asset' },
    { label: 'Other Accounts',        value: breakdown.accountBreakdown?.other || 0,         icon: <Wallet className="w-4 h-4 text-gray-500" />,           type: 'asset' },
    { label: 'Lendings (Receivable)', value: breakdown.lendingsTotal,                        icon: <HandCoins className="w-4 h-4 text-cyan-600" />,        type: 'asset' },
    { label: 'Investments',           value: breakdown.investmentsTotal,                     icon: <TrendingUp className="w-4 h-4 text-pink-600" />,       type: 'asset' },
    { label: 'Savings Goals',         value: breakdown.goalsTotal,                           icon: <Target className="w-4 h-4 text-orange-500" />,         type: 'asset' },
    { label: 'Loans (Liability)',     value: breakdown.loansTotal,                           icon: <Minus className="w-4 h-4 text-red-500" />,             type: 'liability' },
  ].filter((r) => r.value > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Wealth Breakdown</h3>
          <p className="text-xs text-gray-500">All assets included in Zakat calculation</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Net Zakatable</p>
          <p className="font-bold text-gray-900">{fmt(breakdown.netZakatableWealth)}</p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No assets recorded yet.</p>
        ) : (
          rows.map((row, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">{row.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{row.label}</p>
              </div>
              <p className={`font-semibold text-sm ${row.type === 'liability' ? 'text-red-600' : 'text-gray-800'}`}>
                {row.type === 'liability' ? '−' : '+'} {fmt(row.value)}
              </p>
            </div>
          ))
        )}
        {/* Totals */}
        {rows.length > 0 && (
          <>
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Total Assets</span>
              <span className="font-semibold text-gray-900">{fmt(breakdown.totalAssets)}</span>
            </div>
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
                  {breakdown.netZakatableWealth >= nisabThreshold && nisabThreshold > 0
                    ? '✓ Above Nisab'
                    : nisabThreshold > 0
                      ? `${fmt(nisabThreshold - breakdown.netZakatableWealth)} below Nisab`
                      : 'Set Nisab to compare'
                  }
                </p>
              </div>
              <p className="font-bold text-lg text-emerald-700">{fmt(breakdown.netZakatableWealth)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTALLMENT TRACKER
// ─────────────────────────────────────────────────────────────────────────────

function InstallmentTracker({ payment, accounts, onPayInstallment, fmt }) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [payingIndex,       setPayingIndex]       = useState(null);

  const totalPaid     = payment.paidAmount || 0;
  const progressPct   = Math.round((totalPaid / payment.totalAmount) * 100);
  const payableAccs   = accounts.filter((a) => ['cash', 'bank', 'mobile_banking'].includes(a.type) && a.balance > 0);

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
          <span>Paid: {fmt(totalPaid)}</span>
          <span>{progressPct}%</span>
        </div>
      </div>

      {/* Account selector */}
      <div className="px-6 pt-4 pb-2">
        <label className="text-xs font-medium text-gray-600 block mb-1">Pay installments from:</label>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {payableAccs.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.name} — {fmt(acc.balance)}</option>
          ))}
        </select>
      </div>

      <div className="px-6 pb-4 space-y-2">
        {payment.installments.map((inst, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              inst.status === 'paid' ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex-shrink-0">
              {inst.status === 'paid'
                ? <Check className="w-4 h-4 text-emerald-600" />
                : <Clock className="w-4 h-4 text-gray-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">Installment {inst.installmentNumber}</p>
              <p className="text-xs text-gray-500">
                {inst.status === 'paid' ? `Paid on ${inst.paidDate}` : `Due: ${inst.dueDate}`}
              </p>
            </div>
            <p className={`text-sm font-semibold ${inst.status === 'paid' ? 'text-emerald-700' : 'text-gray-700'}`}>
              {fmt(inst.amount)}
            </p>
            {inst.status !== 'paid' && (
              <button
                onClick={async () => {
                  setPayingIndex(index);
                  await onPayInstallment(index, selectedAccountId);
                  setPayingIndex(null);
                }}
                disabled={payingIndex === index || !selectedAccountId}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                {payingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                Pay
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────

function ZakatPaymentModal({ zakatAmount, activeCycle, accounts, userId, fmt, onClose, onSuccess }) {
  const [mode,           setMode]           = useState('select'); // select | instant | installment
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [fromAccountId,  setFromAccountId]  = useState('');
  const [paymentMethod,  setPaymentMethod]  = useState('cash');
  const [recipient,      setRecipient]      = useState('');
  const [note,           setNote]           = useState('');
  const [installments,   setInstallments]   = useState(3);
  const [previewSched,   setPreviewSched]   = useState([]);

  const payableAccs = accounts.filter((a) =>
    ['cash', 'bank', 'mobile_banking'].includes(a.type) && a.balance > 0
  );
  const selectedAcc = payableAccs.find((a) => a.id === fromAccountId);

  useEffect(() => {
    if (mode === 'installment') {
      setPreviewSched(generateInstallmentSchedule(zakatAmount, installments));
    }
  }, [mode, installments, zakatAmount]);

  const handleInstant = async () => {
    if (!fromAccountId) { setError('Please select an account.'); return; }
    if (!selectedAcc || selectedAcc.balance < zakatAmount) { setError('Insufficient balance.'); return; }
    setLoading(true); setError('');
    const res = await recordZakatPayment(userId, {
      cycleId: activeCycle.cycleId || activeCycle.id,
      cycleDocId: activeCycle.id,
      zakatAmount,
      fromAccountId,
      fromAccountName: selectedAcc.name,
      fromAccountBalance: selectedAcc.balance,
      paymentMethod, recipient, note,
    });
    setLoading(false);
    if (res.success) onSuccess();
    else setError(res.error || 'Payment failed.');
  };

  const handleInstallment = async () => {
    if (!fromAccountId) { setError('Please select an account.'); return; }
    setLoading(true); setError('');
    const res = await setupZakatInstallments(userId, {
      cycleId: activeCycle.id,
      cycleDocId: activeCycle.id,
      zakatAmount,
      fromAccountId,
      fromAccountName: selectedAcc?.name || '',
      numberOfInstallments: installments,
      paymentMethod, recipient, note,
    });
    setLoading(false);
    if (res.success) onSuccess();
    else setError(res.error || 'Failed to set up installments.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:w-[460px] rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
          {mode !== 'select' && (
            <button onClick={() => setMode('select')} className="text-gray-500 text-sm hover:text-gray-700">← Back</button>
          )}
          <h3 className="font-bold text-gray-900 flex-1">
            {mode === 'select' ? 'Pay Zakat' : mode === 'instant' ? 'Full Payment' : 'Installment Plan'}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Amount badge */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl p-4 text-center">
            <p className="text-emerald-100 text-sm">Total Zakat Due (2.5%)</p>
            <p className="text-2xl font-bold">{fmt(zakatAmount)}</p>
          </div>

          {/* Mode selection */}
          {mode === 'select' && (
            <>
              <p className="text-sm text-gray-500 text-center">How would you like to pay?</p>
              <button
                onClick={() => setMode('instant')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl transition-all text-left group"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Pay Full Amount Now</p>
                  <p className="text-xs text-gray-500">Pay {fmt(zakatAmount)} from one account</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </button>
              <button
                onClick={() => setMode('installment')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all text-left group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Pay in Installments</p>
                  <p className="text-xs text-gray-500">Split over 2–12 monthly payments</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </button>
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  Zakat payments are automatically recorded as expense transactions and deducted from your account balance.
                </p>
              </div>
            </>
          )}

          {/* Instant payment form */}
          {mode === 'instant' && (
            <>
              <PaymentFormFields
                accounts={payableAccs}
                fromAccountId={fromAccountId}
                setFromAccountId={setFromAccountId}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                recipient={recipient}
                setRecipient={setRecipient}
                note={note}
                setNote={setNote}
                requiredAmount={zakatAmount}
                fmt={fmt}
              />
              {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
              <button
                onClick={handleInstant}
                disabled={loading || !fromAccountId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Processing...' : `Pay ${fmt(zakatAmount)}`}
              </button>
            </>
          )}

          {/* Installment form */}
          {mode === 'installment' && (
            <>
              {/* Count selector */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Number of Installments</label>
                <div className="grid grid-cols-5 gap-2">
                  {[2, 3, 4, 6, 12].map((n) => (
                    <button
                      key={n}
                      onClick={() => setInstallments(n)}
                      className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                        installments === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{fmt(zakatAmount / installments)} per month</p>
              </div>

              {/* Preview */}
              {previewSched.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Schedule Preview</p>
                  {previewSched.map((s) => (
                    <div key={s.installmentNumber} className="flex justify-between text-xs">
                      <span className="text-gray-600">Installment {s.installmentNumber} — {s.dueDate}</span>
                      <span className="font-medium text-gray-800">{fmt(s.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <PaymentFormFields
                accounts={payableAccs}
                fromAccountId={fromAccountId}
                setFromAccountId={setFromAccountId}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                recipient={recipient}
                setRecipient={setRecipient}
                note={note}
                setNote={setNote}
                requiredAmount={zakatAmount / installments}
                fmt={fmt}
                label="Account for Payments"
              />
              {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
              <button
                onClick={handleInstallment}
                disabled={loading || !fromAccountId}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Setting up...' : `Start ${installments}-Month Plan`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentFormFields({
  accounts, fromAccountId, setFromAccountId, paymentMethod, setPaymentMethod,
  recipient, setRecipient, note, setNote, requiredAmount, fmt, label = 'Pay From Account',
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
        {accounts.length === 0 ? (
          <p className="text-sm text-red-500 p-3 bg-red-50 rounded-xl">No accounts with sufficient balance.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => {
              const sufficient = acc.balance >= requiredAmount;
              return (
                <button
                  key={acc.id}
                  onClick={() => setFromAccountId(acc.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    fromAccountId === acc.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'
                  } ${!sufficient ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800">{acc.name}</p>
                    <p className="text-xs text-gray-500">Balance: {fmt(acc.balance)} {!sufficient && '— Insufficient'}</p>
                  </div>
                  {fromAccountId === acc.id && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Payment Method</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="mobile">Mobile Banking</option>
          <option value="check">Check/Cheque</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Recipient <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)}
          placeholder="e.g. Local mosque, charity..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Any notes..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY TAB
// ─────────────────────────────────────────────────────────────────────────────

function ZakatHistoryTab({ cycleHistory, expandedCycleId, setExpandedCycleId, fmt }) {
  if (cycleHistory.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-600">No Zakat history yet</p>
        <p className="text-sm text-gray-400 mt-1">Your cycle history will appear here after your first cycle completes.</p>
      </div>
    );
  }

  const statusBadge = {
    active:  'bg-blue-100 text-blue-700',
    due:     'bg-red-100 text-red-700',
    paid:    'bg-emerald-100 text-emerald-700',
    exempt:  'bg-gray-100 text-gray-600',
  };

  const totalPaid  = cycleHistory.filter((c) => c.status === 'paid').reduce((s, c) => s + (c.zakatPaid || 0), 0);
  const paidCount  = cycleHistory.filter((c) => c.status === 'paid').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Cycles',   value: cycleHistory.length, color: 'text-gray-900' },
          { label: 'Paid Cycles',    value: paidCount,           color: 'text-emerald-700' },
          { label: 'Total Paid',     value: fmt(totalPaid),      color: 'text-gray-900', small: true },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
            <p className={`font-bold ${s.small ? 'text-base' : 'text-2xl'} ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cycle list */}
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
                <button
                  onClick={() => setExpandedCycleId(isExpanded ? null : cycle.id)}
                  className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-600">#{cycleNum}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">
                      Cycle {cycleNum} — {cycle.startDate}
                    </p>
                    <p className="text-xs text-gray-400">{formatHijriDate(cycle.startDateHijri)}</p>
                  </div>
                  {cycle.zakatPaid ? (
                    <p className="text-sm font-semibold text-emerald-700 hidden sm:block">{fmt(cycle.zakatPaid)}</p>
                  ) : null}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusBadge[cycle.status] || statusBadge.exempt}`}>
                    {cycle.status === 'paid' ? 'Paid ✓' : cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-6 pb-5 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                      {[
                        { label: 'Start Date',          value: cycle.startDate },
                        { label: 'Start (Hijri)',        value: formatHijriDate(cycle.startDateHijri) },
                        { label: 'Wealth at Start',     value: fmt(cycle.startWealth || 0) },
                        { label: 'Nisab at Start',      value: fmt(cycle.nisabAtStart || 0) },
                        cycle.endDate && { label: 'End Date',    value: cycle.endDate },
                        cycle.endWealth !== undefined && { label: 'End Wealth', value: fmt(cycle.endWealth) },
                        cycle.zakatPaid && { label: 'Zakat Paid',  value: fmt(cycle.zakatPaid), highlight: true },
                        { label: 'Status', value: cycle.status },
                      ].filter(Boolean).map((item, i) => (
                        <div key={i} className="bg-white rounded-lg p-2.5">
                          <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                          <p className={`text-sm font-semibold ${item.highlight ? 'text-emerald-700' : 'text-gray-800'}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown at start */}
                    {cycle.startBreakdown && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Wealth Breakdown at Cycle Start</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            ['Accounts',    cycle.startBreakdown.accountsTotal],
                            ['Lendings',    cycle.startBreakdown.lendingsTotal],
                            ['Investments', cycle.startBreakdown.investmentsTotal],
                            ['Goals',       cycle.startBreakdown.goalsTotal],
                            ['Loans',       cycle.startBreakdown.loansTotal],
                          ].filter(([, v]) => v > 0).map(([label, value]) => (
                            <div key={label} className="bg-white rounded-lg p-2 text-xs">
                              <p className="text-gray-400">{label}</p>
                              <p className="font-semibold text-gray-800">{fmt(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {cycle.status === 'exempt' && (
                      <p className="text-xs text-gray-500 bg-gray-100 rounded-lg p-3">
                        ℹ️ Wealth was below Nisab at year end. Zakat was not required for this cycle.
                      </p>
                    )}
                    {cycle.status === 'paid' && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-3">
                        ✅ Zakat paid. JazakAllah Khayran.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NISAB SETTINGS MODAL (unchanged from original, just extracted)
// ─────────────────────────────────────────────────────────────────────────────

function NisabSettingsModal({
  priceUnit, setPriceUnit, silverPricePerGram, setSilverPricePerGram,
  silverPricePerVori, setSilverPricePerVori, calculatedNisab, onSave, onClose, NISAB_SILVER_GRAMS,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Nisab Calculator</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Calculate Nisab Using</label>
            <div className="grid grid-cols-2 gap-2">
              {[['gram', 'Per Gram'], ['vori', 'Per Vori (Tola)']].map(([val, label]) => (
                <button key={val} type="button" onClick={() => setPriceUnit(val)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    priceUnit === val ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {priceUnit === 'gram' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Silver Price per Gram (৳)</label>
              <input type="number" step="0.01" value={silverPricePerGram}
                onChange={(e) => setSilverPricePerGram(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                placeholder="Enter price per gram" />
              <p className="text-xs text-gray-500 mt-1">Current silver price per gram in BDT</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Silver Price per Vori/Tola (৳)</label>
              <input type="number" step="0.01" value={silverPricePerVori}
                onChange={(e) => setSilverPricePerVori(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                placeholder="Enter price per vori" />
              <p className="text-xs text-gray-500 mt-1">Current silver price per Vori (11.664g) in BDT</p>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-600 uppercase">Calculated Nisab</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">৳{calculatedNisab.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">
              {priceUnit === 'gram'
                ? `612.36 grams × ৳${silverPricePerGram}/gram`
                : `52.5 Vori × ৳${silverPricePerVori}/Vori`}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>Note:</strong> Nisab = 52.5 Tola (Vori) or 612.36 grams of silver.
              Check current prices at <a href="https://bajuslive.com/" target="_blank" rel="noopener noreferrer" className="underline">bajuslive.com</a>.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
            <button onClick={onSave}  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium">Save & Calculate</button>
          </div>
        </div>
      </div>
    </div>
  );
}