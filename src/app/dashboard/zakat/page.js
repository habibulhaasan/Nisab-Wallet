// src/app/dashboard/zakat/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAccounts } from '@/lib/firestoreCollections';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateId } from '@/lib/firestoreCollections';
import { 
  gregorianToHijri, 
  addOneHijriYear, 
  daysUntilHijriAnniversary,
  hasOneHijriYearPassed,
  calculateZakat,
  determineZakatStatus,
  formatHijriDate,
  ZAKAT_STATUS 
} from '@/lib/zakatUtils';
import { Star, Wallet, Calendar, Clock, CheckCircle2, AlertCircle, Settings, History, Calculator } from 'lucide-react';

export default function ZakatPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [nisabThreshold, setNisabThreshold] = useState(0);
  const [silverPricePerGram, setSilverPricePerGram] = useState(0);
  const [silverPricePerVori, setSilverPricePerVori] = useState(0);
  const [priceUnit, setPriceUnit] = useState('gram'); // 'gram' or 'vori'
  const [activeCycle, setActiveCycle] = useState(null);
  const [cycleHistory, setCycleHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Constants
  const NISAB_SILVER_GRAMS = 612.36; // 52.5 Tola = 612.36 grams
  const NISAB_SILVER_VORI = 52.5; // 52.5 Vori/Tola
  const GRAMS_PER_VORI = 11.664; // 1 Vori = 11.664 grams

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadAccounts(),
      loadNisabSettings(),
      loadZakatCycles(),
    ]);
    setLoading(false);
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
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
          if (data.silverPricePerGram !== undefined) {
            setSilverPricePerGram(data.silverPricePerGram);
          }
          if (data.silverPricePerVori !== undefined) {
            setSilverPricePerVori(data.silverPricePerVori);
          }
          if (data.priceUnit !== undefined) {
            setPriceUnit(data.priceUnit);
          }
        });
      }
    } catch (error) {
      console.error('Error loading nisab settings:', error);
    }
  };

  const loadZakatCycles = async () => {
    try {
      const cyclesRef = collection(db, 'users', user.uid, 'zakatCycles');
      const q = query(cyclesRef, orderBy('startDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const cycles = [];
      let foundActive = false;
      
      querySnapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        cycles.push(data);
        
        if (data.status === 'active' && !foundActive) {
          setActiveCycle(data);
          foundActive = true;
        }
      });
      
      setCycleHistory(cycles);
      
      if (!foundActive) {
        setActiveCycle(null);
      }
    } catch (error) {
      console.error('Error loading zakat cycles:', error);
    }
  };

  const calculateNisabFromPrice = () => {
    if (priceUnit === 'gram') {
      return silverPricePerGram * NISAB_SILVER_GRAMS;
    } else {
      return silverPricePerVori * NISAB_SILVER_VORI;
    }
  };

  const saveNisabSettings = async () => {
    try {
      const calculatedNisab = calculateNisabFromPrice();
      
      const settingsData = {
        nisabThreshold: calculatedNisab,
        silverPricePerGram: parseFloat(silverPricePerGram) || 0,
        silverPricePerVori: parseFloat(silverPricePerVori) || 0,
        priceUnit: priceUnit,
        updatedAt: serverTimestamp(),
      };
      
      const settingsRef = collection(db, 'users', user.uid, 'settings');
      const querySnapshot = await getDocs(settingsRef);
      
      if (querySnapshot.empty) {
        await addDoc(settingsRef, settingsData);
      } else {
        querySnapshot.forEach(async (docSnap) => {
          await updateDoc(doc(db, 'users', user.uid, 'settings', docSnap.id), settingsData);
        });
      }
      
      setNisabThreshold(calculatedNisab);
      setShowSettingsModal(false);
      
      await checkAndStartCycle(calculatedNisab);
    } catch (error) {
      alert('Error saving settings: ' + error.message);
    }
  };

  const checkAndStartCycle = async (nisabValue) => {
    const totalWealth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    if (totalWealth >= nisabValue && nisabValue > 0 && !activeCycle) {
      await startNewCycle(totalWealth, nisabValue);
    }
  };

  const startNewCycle = async (wealthAmount, nisabAmount) => {
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const hijriDate = gregorianToHijri(todayString);
      const cycleId = generateId();
      
      const newCycle = {
        cycleId,
        status: 'active',
        startDate: todayString,
        startDateHijri: hijriDate,
        startWealth: wealthAmount,
        nisabAtStart: nisabAmount,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'users', user.uid, 'zakatCycles'), newCycle);
      await loadZakatCycles();
    } catch (error) {
      console.error('Error starting cycle:', error);
    }
  };

  const payZakat = async () => {
    if (!activeCycle) return;
    
    const totalWealth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const zakatAmount = calculateZakat(totalWealth);
    
    if (confirm(`Pay Zakat of ৳${zakatAmount.toLocaleString()}?`)) {
      try {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const hijriDate = gregorianToHijri(todayString);
        
        await updateDoc(doc(db, 'users', user.uid, 'zakatCycles', activeCycle.id), {
          status: 'paid',
          endDate: todayString,
          endDateHijri: hijriDate,
          endWealth: totalWealth,
          zakatPaid: zakatAmount,
          paidAt: serverTimestamp(),
        });
        
        if (totalWealth >= nisabThreshold) {
          await startNewCycle(totalWealth, nisabThreshold);
        }
        
        await loadZakatCycles();
        alert('Zakat payment recorded successfully!');
      } catch (error) {
        alert('Error recording payment: ' + error.message);
      }
    }
  };

  const markAsExempt = async () => {
    if (!activeCycle) return;
    
    if (confirm('Mark this cycle as exempt (wealth fell below Nisab)?')) {
      try {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const hijriDate = gregorianToHijri(todayString);
        const totalWealth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        
        await updateDoc(doc(db, 'users', user.uid, 'zakatCycles', activeCycle.id), {
          status: 'exempt',
          endDate: todayString,
          endDateHijri: hijriDate,
          endWealth: totalWealth,
          updatedAt: serverTimestamp(),
        });
        
        await loadZakatCycles();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  const totalWealth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  // Determine actual Zakat status
  let zakatStatus = ZAKAT_STATUS.NOT_MANDATORY;
  let progressPercentage = 0;
  let daysRemaining = 0;
  let yearEndDate = null;
  let zakatAmount = 0;
  
  if (nisabThreshold > 0) {
    progressPercentage = Math.min((totalWealth / nisabThreshold) * 100, 100);
    zakatAmount = calculateZakat(totalWealth);
    
    if (activeCycle && activeCycle.status === 'active') {
      // Check if year has completed
      if (hasOneHijriYearPassed(activeCycle.startDate)) {
        // Year completed - check wealth status
        zakatStatus = totalWealth >= nisabThreshold ? ZAKAT_STATUS.DUE : ZAKAT_STATUS.EXEMPT;
      } else {
        // Still monitoring
        zakatStatus = ZAKAT_STATUS.MONITORING;
        daysRemaining = daysUntilHijriAnniversary(activeCycle.startDate);
        yearEndDate = addOneHijriYear(activeCycle.startDate);
      }
    } else if (totalWealth >= nisabThreshold) {
      // Wealth above Nisab but no cycle - ready to start
      zakatStatus = ZAKAT_STATUS.NOT_MANDATORY;
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Zakat Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor your Zakat obligations</p>
        </div>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Nisab Settings</span>
        </button>
      </div>

      {/* Main Zakat Status Card */}
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
                <h2 className="text-xl font-semibold text-gray-900">Current Status</h2>
                <p className="text-sm text-gray-600">Real-time monitoring</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
              zakatStatus === ZAKAT_STATUS.NOT_MANDATORY ? 'bg-gray-900 text-white' :
              zakatStatus === ZAKAT_STATUS.MONITORING ? 'bg-blue-600 text-white' :
              zakatStatus === ZAKAT_STATUS.DUE ? 'bg-red-600 text-white' :
              zakatStatus === ZAKAT_STATUS.PAID ? 'bg-green-600 text-white' :
              'bg-gray-600 text-white'
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
              <p className="text-3xl font-bold text-gray-900 mb-1">৳{totalWealth.toLocaleString()}</p>
              <p className="text-xs text-gray-500">All accounts combined</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Nisab Threshold</p>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">৳{nisabThreshold.toLocaleString()}</p>
              <p className="text-xs text-gray-500">52.5 Tola Silver (612.36g)</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress to Nisab</span>
              <span className="text-sm font-semibold text-emerald-600">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner border border-emerald-100">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {zakatStatus === ZAKAT_STATUS.NOT_MANDATORY && nisabThreshold > 0 && totalWealth >= nisabThreshold && !activeCycle && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Wealth Reached Nisab!</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Your wealth (৳{totalWealth.toLocaleString()}) has reached the Nisab threshold (৳{nisabThreshold.toLocaleString()}). 
                    A new monitoring cycle will start automatically. The system will track for one Hijri year from today.
                  </p>
                  <button
                    onClick={() => checkAndStartCycle(nisabThreshold)}
                    className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Start Monitoring Cycle Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {zakatStatus === ZAKAT_STATUS.NOT_MANDATORY && (nisabThreshold === 0 || totalWealth < nisabThreshold) && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">No Active Cycle</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {nisabThreshold === 0 
                      ? 'Please set the Nisab threshold in settings to begin tracking.'
                      : `Your wealth (৳${totalWealth.toLocaleString()}) has not reached the Nisab threshold (৳${nisabThreshold.toLocaleString()}). A monitoring cycle will start automatically when your wealth reaches the threshold.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {zakatStatus === ZAKAT_STATUS.MONITORING && activeCycle && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Monitoring Active</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Your wealth reached the Nisab threshold. The one Hijri year monitoring period is in progress.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Cycle Started (Hijri)</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatHijriDate(activeCycle.startDateHijri)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Cycle Started (Gregorian)</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{new Date(activeCycle.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Days Remaining</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{daysRemaining} days</p>
                      <p className="text-xs text-gray-500 mt-0.5">Until {yearEndDate?.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {zakatStatus === ZAKAT_STATUS.EXEMPT && activeCycle && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Cycle Completed - Exempt</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    One Hijri year has passed, but your wealth (৳{totalWealth.toLocaleString()}) is below the Nisab threshold (৳{nisabThreshold.toLocaleString()}). 
                    You are exempt from Zakat for this cycle. A new cycle will start when your wealth reaches Nisab again.
                  </p>
                  <button
                    onClick={markAsExempt}
                    className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    Mark Cycle as Exempt
                  </button>
                </div>
              </div>
            </div>
          )}

          {zakatStatus === ZAKAT_STATUS.DUE && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Zakat Payment Due</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    One Hijri year has passed and your wealth is still at or above the Nisab threshold. Zakat is now obligatory.
                  </p>
                  <div className="bg-red-50 rounded-lg p-4 mb-4">
                    <p className="text-xs text-red-600 font-medium mb-1">Zakat Amount (2.5%)</p>
                    <p className="text-2xl font-bold text-gray-900">৳{zakatAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={payZakat}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      Mark as Paid
                    </button>
                    <button
                      onClick={markAsExempt}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Mark as Exempt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cycle History */}
      {cycleHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <History className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Cycle History</h2>
          </div>
          <div className="space-y-3">
            {cycleHistory.map((cycle) => (
              <div key={cycle.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      cycle.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      cycle.status === 'paid' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {cycle.status.toUpperCase()}
                    </span>
                  </div>
                  {cycle.zakatPaid && (
                    <span className="text-sm font-semibold text-green-600">
                      Paid: ৳{cycle.zakatPaid.toLocaleString()}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500 mb-1">Start Date (Hijri)</p>
                    <p className="text-sm font-medium text-gray-900">{formatHijriDate(cycle.startDateHijri)}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500 mb-1">Start Date (Gregorian)</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(cycle.startDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Start Wealth</p>
                    <p className="font-medium text-gray-900">৳{cycle.startWealth?.toLocaleString()}</p>
                  </div>
                  {cycle.endWealth !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">End Wealth</p>
                      <p className="font-medium text-gray-900">৳{cycle.endWealth?.toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Nisab at Start</p>
                    <p className="font-medium text-gray-900">৳{cycle.nisabAtStart?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Nisab Calculator</h2>
            </div>

            <div className="space-y-4">
              {/* Price Unit Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calculate Nisab Using
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceUnit('gram')}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      priceUnit === 'gram'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Per Gram
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceUnit('vori')}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      priceUnit === 'vori'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Per Vori (Tola)
                  </button>
                </div>
              </div>

              {/* Price Input */}
              {priceUnit === 'gram' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Silver Price per Gram (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={silverPricePerGram}
                    onChange={(e) => setSilverPricePerGram(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                    placeholder="Enter price per gram"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current silver price per gram in BDT
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Silver Price per Vori/Tola (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={silverPricePerVori}
                    onChange={(e) => setSilverPricePerVori(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                    placeholder="Enter price per vori"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current silver price per Vori (11.664g) in BDT
                  </p>
                </div>
              )}

              {/* Calculated Nisab */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-600 uppercase">Calculated Nisab</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">৳{calculateNisabFromPrice().toLocaleString()}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {priceUnit === 'gram' 
                    ? `612.36 grams × ৳${silverPricePerGram}/gram`
                    : `52.5 Vori × ৳${silverPricePerVori}/Vori`
                  }
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Note:</strong> The Nisab is equivalent to 52.5 Tola (Vori) or 612.36 grams of silver. 
                  You can get current prices from <a href="https://bajuslive.com/" target="_blank" rel="noopener noreferrer" className="underline">bajuslive.com</a>.
                  When your wealth reaches this threshold, a monitoring cycle will automatically begin.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNisabSettings}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                >
                  Save & Calculate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}