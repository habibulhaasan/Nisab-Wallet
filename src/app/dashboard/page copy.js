// src/app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAccounts } from '@/lib/firestoreCollections';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSettings, formatAmount, translate } from '@/hooks/useSettings';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { 
  gregorianToHijri, 
  addOneHijriYear, 
  daysUntilHijriAnniversary,
  hasOneHijriYearPassed,
  calculateZakat,
  formatHijriDate,
  ZAKAT_STATUS 
} from '@/lib/zakatUtils';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Plus, 
  ArrowRightLeft, 
  FileText, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  Calendar,
  HandCoins,
  AlertCircle,
  Banknote
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const settings = useSettings();
  const [accounts, setAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nisabThreshold, setNisabThreshold] = useState(0);
  const [activeCycle, setActiveCycle] = useState(null);
  const [thisMonthIncome, setThisMonthIncome] = useState(0);
  const [thisMonthExpense, setThisMonthExpense] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const t = (key) => translate(key, settings.language);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      loadAccounts(),
      loadLoans(),
      loadNisabSettings(),
      loadActiveCycle(),
      loadTransactions(),
    ]);
    setLoading(false);
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
    }
  };

  const loadLoans = async () => {
    try {
      const loansRef = collection(db, 'users', user.uid, 'loans');
      const snapshot = await getDocs(loansRef);
      const loansData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLoans(loansData);
    } catch (error) {
      console.error('Error loading loans:', error);
    }
  };

  const loadNisabSettings = async () => {
    try {
      const settingsRef = collection(db, 'users', user.uid, 'settings');
      const querySnapshot = await getDocs(settingsRef);
      
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.nisabThreshold !== undefined) {
            setNisabThreshold(data.nisabThreshold);
          }
        });
      }
    } catch (error) {
      console.error('Error loading nisab:', error);
    }
  };

  const loadActiveCycle = async () => {
    try {
      const cyclesRef = collection(db, 'users', user.uid, 'zakatCycles');
      const q = query(cyclesRef, where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          setActiveCycle({ id: doc.id, ...doc.data() });
        });
      }
    } catch (error) {
      console.error('Error loading cycle:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      // Get current month date range
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      // First day of current month
      const firstDay = new Date(year, month, 1, 12, 0, 0);
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      
      // Last day of current month
      const lastDay = new Date(year, month + 1, 0);
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

      // Load transactions
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const snapshot = await getDocs(transactionsRef);
      
      let income = 0;
      let expense = 0;
      const allTransactions = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const transactionDate = data.date;
        
        // Store all transactions for recent list
        allTransactions.push({
          id: doc.id,
          ...data,
        });

        // Calculate this month's income and expenses
        if (transactionDate >= startDate && transactionDate <= endDate) {
          if (data.type === 'Income') {
            income += Number(data.amount || 0);
          } else if (data.type === 'Expense') {
            expense += Number(data.amount || 0);
          }
        }
      });

      // Load transfers for this month
      const transfersRef = collection(db, 'users', user.uid, 'transfers');
      const transfersSnapshot = await getDocs(transfersRef);
      
      transfersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const transferDate = data.date;
        
        if (transferDate >= startDate && transferDate <= endDate) {
          allTransactions.push({
            id: doc.id,
            ...data,
            isTransfer: true,
          });
        }
      });

      setThisMonthIncome(income);
      setThisMonthExpense(expense);
      
      // Sort by date and get recent 5
      const sorted = allTransactions
        .sort((a, b) => {
          const dateCompare = (b.date || '').localeCompare(a.date || '');
          if (dateCompare !== 0) return dateCompare;
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        })
        .slice(0, 5);
      
      setRecentTransactions(sorted);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const accountsCount = accounts.length;

  // Loan calculations
  const activeLoans = loans.filter((l) => l.status === 'active');
  const totalDebt = activeLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
  const totalMonthlyPayment = activeLoans.reduce((sum, l) => sum + (l.monthlyPayment || 0), 0);
  
  // Get next payment due
  const upcomingPayments = activeLoans
    .filter((l) => l.nextPaymentDue)
    .map((l) => {
      const today = new Date();
      const due = new Date(l.nextPaymentDue);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...l, daysUntilDue: diffDays };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const nextPaymentDue = upcomingPayments.length > 0 ? upcomingPayments[0] : null;
  
  // Zakat calculations
  let zakatStatus = ZAKAT_STATUS.NOT_MANDATORY;
  let zakatProgress = 0;
  let daysRemaining = 0;
  let yearEndDate = null;
  let zakatAmount = 0;
  
  if (nisabThreshold > 0) {
    zakatProgress = Math.min((totalBalance / nisabThreshold) * 100, 100);
    zakatAmount = calculateZakat(totalBalance);
    
    if (activeCycle && activeCycle.status === 'active') {
      if (hasOneHijriYearPassed(activeCycle.startDate)) {
        zakatStatus = totalBalance >= nisabThreshold ? ZAKAT_STATUS.DUE : ZAKAT_STATUS.EXEMPT;
      } else {
        zakatStatus = ZAKAT_STATUS.MONITORING;
        daysRemaining = daysUntilHijriAnniversary(activeCycle.startDate);
        yearEndDate = addOneHijriYear(activeCycle.startDate);
      }
    } else if (totalBalance >= nisabThreshold) {
      zakatStatus = 'Ready to Monitor';
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  };

  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || 'Unknown';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div>
        <SubscriptionBanner />
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.displayName || 'User'}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your finances</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('totalBalance')}</p>
            <Wallet className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{formatAmount(totalBalance, settings.currency)}</p>
          <p className="text-xs text-gray-400 mt-1">{t('allAccounts')}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('accounts')}</p>
            <CreditCard className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{accountsCount}</p>
          <p className="text-xs text-gray-400 mt-1">Active accounts</p>
        </div>

        <button
          onClick={() => router.push('/dashboard/transactions')}
          className="bg-white rounded-lg p-5 border border-gray-200 hover:border-green-300 transition-colors text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide group-hover:text-green-600 transition-colors">{t('income')}</p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-green-600">{formatAmount(thisMonthIncome, settings.currency)}</p>
          <p className="text-xs text-gray-400 mt-1">{t('thisMonth')}</p>
        </button>

        <button
          onClick={() => router.push('/dashboard/transactions')}
          className="bg-white rounded-lg p-5 border border-gray-200 hover:border-red-300 transition-colors text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide group-hover:text-red-600 transition-colors">{t('expenses')}</p>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-semibold text-red-600">{formatAmount(thisMonthExpense, settings.currency)}</p>
          <p className="text-xs text-gray-400 mt-1">{t('thisMonth')}</p>
        </button>
      </div>

      {/* Loan Summary Cards */}
      {activeLoans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/dashboard/loans')}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-5 border border-amber-200 hover:border-amber-300 transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Active Loans</p>
              <HandCoins className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{activeLoans.length}</p>
            <p className="text-xs text-amber-600 mt-1">Click to manage</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/loans')}
            className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-5 border border-red-200 hover:border-red-300 transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Total Debt</p>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-semibold text-red-600">{formatAmount(totalDebt, settings.currency)}</p>
            <p className="text-xs text-red-600 mt-1">Remaining balance</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/loans')}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200 hover:border-blue-300 transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                {nextPaymentDue ? 'Next Payment Due' : 'Monthly Payment'}
              </p>
              <Banknote className="w-4 h-4 text-blue-600" />
            </div>
            {nextPaymentDue ? (
              <>
                <p className="text-2xl font-semibold text-blue-600">
                  {formatAmount(nextPaymentDue.monthlyPayment || 0, settings.currency)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {nextPaymentDue.daysUntilDue === 0 ? 'Due today!' :
                   nextPaymentDue.daysUntilDue === 1 ? 'Due tomorrow' :
                   nextPaymentDue.daysUntilDue < 0 ? 'Overdue!' :
                   `Due in ${nextPaymentDue.daysUntilDue} days`}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold text-blue-600">
                  {formatAmount(totalMonthlyPayment, settings.currency)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Total per month</p>
              </>
            )}
          </button>
        </div>
      )}

      {/* Zakat Status Card */}
      <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border border-emerald-200 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Star className="w-6 h-6 text-emerald-600" fill="currentColor" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('zakatStatus')}</h2>
                <p className="text-sm text-gray-600">Real-time monitoring</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
              zakatStatus === ZAKAT_STATUS.NOT_MANDATORY ? 'bg-gray-900 text-white' :
              zakatStatus === ZAKAT_STATUS.MONITORING ? 'bg-blue-600 text-white' :
              zakatStatus === ZAKAT_STATUS.DUE ? 'bg-red-600 text-white' :
              'bg-emerald-600 text-white'
            }`}>
              {zakatStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Total Wealth</p>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{formatAmount(totalBalance, settings.currency)}</p>
              <p className="text-xs text-gray-500">All accounts combined</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Nisab Threshold</p>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{formatAmount(nisabThreshold, settings.currency)}</p>
              <p className="text-xs text-gray-500">52.5 Tola Silver equivalent</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress to Nisab</span>
              <span className="text-sm font-semibold text-emerald-600">{zakatProgress.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner border border-emerald-100">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" 
                style={{ width: `${zakatProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Status Messages */}
          {zakatStatus === ZAKAT_STATUS.NOT_MANDATORY && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">No Active Cycle</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {nisabThreshold === 0 
                      ? 'Set the Nisab threshold in the Zakat page to begin tracking.'
                      : 'Your wealth has not yet reached the Nisab threshold. When it does, a monitoring cycle will begin automatically.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {zakatStatus === ZAKAT_STATUS.MONITORING && activeCycle && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Monitoring Active</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Cycle started when your wealth reached Nisab on {new Date(activeCycle.startDate).toLocaleDateString()}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Cycle Started</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatHijriDate(activeCycle.startDateHijri)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(activeCycle.startDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Days Remaining</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{daysRemaining} days</p>
                      <p className="text-xs text-gray-500 mt-0.5">Until Hijri year ends</p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Year End Date</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {yearEndDate ? formatHijriDate(gregorianToHijri(yearEndDate.toISOString().split('T')[0])) : '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{yearEndDate?.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {zakatStatus === ZAKAT_STATUS.DUE && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-red-100">
              <div className="flex items-start space-x-3">
                <Star className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 mb-1">Zakat Payment Required</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    One Hijri year has passed and your wealth is at or above Nisab. Zakat is now obligatory.
                  </p>
                  <div className="bg-red-50 rounded-lg p-4 mb-3">
                    <p className="text-xs text-red-600 font-medium mb-1">Zakat Amount (2.5%)</p>
                    <p className="text-2xl font-bold text-gray-900">{formatAmount(zakatAmount, settings.currency)}</p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/zakat')}
                    className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    Go to Zakat Page to Pay
                  </button>
                </div>
              </div>
            </div>
          )}

          {!activeCycle && zakatStatus === ZAKAT_STATUS.MONITORING && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Ready to Start Monitoring</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Your wealth has reached the Nisab threshold. Visit the Zakat page to start the monitoring cycle.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/zakat')}
                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Start Zakat Monitoring
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => router.push('/dashboard/accounts')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <Plus className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Add Account</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/transactions')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <Receipt className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Add Transaction</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/transactions')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <ArrowRightLeft className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Transfer</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/analytics')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <button 
            onClick={() => router.push('/dashboard/transactions')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            View all
          </button>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">No transactions yet</p>
            <p className="text-xs text-gray-400 mb-4">Add income or expenses to start tracking</p>
            <button
              onClick={() => router.push('/dashboard/transactions')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.isTransfer ? 'bg-blue-50' :
                    transaction.type === 'Income' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {transaction.isTransfer ? (
                      <ArrowRightLeft size={16} className="text-blue-600" />
                    ) : transaction.type === 'Income' ? (
                      <TrendingUp size={16} className="text-green-600" />
                    ) : (
                      <TrendingDown size={16} className="text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.isTransfer 
                        ? `Transfer: ${transaction.fromAccountName} → ${transaction.toAccountName}`
                        : transaction.description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaction.date)} • {getAccountName(transaction.accountId || transaction.fromAccountId)}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${
                  transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'Income' ? '+' : '-'}
                  {formatAmount(transaction.amount || 0, settings.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}