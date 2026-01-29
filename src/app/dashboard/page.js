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
import { Wallet, CreditCard, TrendingUp, TrendingDown, Star, Plus, ArrowRightLeft, FileText, Receipt, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const settings = useSettings();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nisabThreshold, setNisabThreshold] = useState(0);
  const [activeCycle, setActiveCycle] = useState(null);

  const t = (key) => translate(key, settings.language);

  useEffect(() => {
    if (user) {
      loadAccounts();
      loadNisabSettings();
      loadActiveCycle();
    }
  }, [user]);

  const loadAccounts = async () => {
    setLoading(true);
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
    }
    setLoading(false);
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

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const accountsCount = accounts.length;
  const thisMonthIncome = 0;
  const thisMonthExpense = 0;
  
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
      // Check if year has completed
      if (hasOneHijriYearPassed(activeCycle.startDate)) {
        // Year completed - check wealth status
        zakatStatus = totalBalance >= nisabThreshold ? ZAKAT_STATUS.DUE : ZAKAT_STATUS.EXEMPT;
      } else {
        // Still monitoring - wealth can fluctuate
        zakatStatus = ZAKAT_STATUS.MONITORING;
        daysRemaining = daysUntilHijriAnniversary(activeCycle.startDate);
        yearEndDate = addOneHijriYear(activeCycle.startDate);
      }
    } else if (totalBalance >= nisabThreshold) {
      // Wealth above Nisab but no cycle
      zakatStatus = 'Ready to Monitor';
    }
  }
  

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}

      <div>
      <SubscriptionBanner />
      {/* Rest of content */}
    </div>

    
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {user?.displayName || 'User'}
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
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('accounts')}</p>
            <CreditCard className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{accountsCount}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('income')}</p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-green-600">{formatAmount(thisMonthIncome, settings.currency)}</p>
          <p className="text-xs text-gray-400 mt-1">{t('thisMonth')}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('expenses')}</p>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-semibold text-red-600">{formatAmount(thisMonthExpense, settings.currency)}</p>
          <p className="text-xs text-gray-400 mt-1">{t('thisMonth')}</p>
        </div>
      </div>

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
              <p className="text-3xl font-bold text-gray-900 mb-1">৳{totalBalance.toLocaleString()}</p>
              <p className="text-xs text-gray-500">All accounts combined</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Nisab Threshold</p>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">৳{nisabThreshold.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold text-gray-900">৳{zakatAmount.toLocaleString()}</p>
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
      </div>
    </div>
  );
}