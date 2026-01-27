// src/app/dashboard/admin/user/[userId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { isAdmin } from '@/lib/adminCheck';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ArrowLeft, User, Wallet, Receipt, TrendingUp, 
  ArrowRightLeft, Calendar, Tag, Coins, DollarSign,
  Activity, PieChart, BarChart3, Clock, Shield
} from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function UserDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    accounts: [],
    transactions: [],
    transfers: [],
    categories: [],
    zakatCycles: [],
    settings: null,
  });
  const [stats, setStats] = useState({
    totalWealth: 0,
    totalIncome: 0,
    totalExpense: 0,
    accountsCount: 0,
    transactionsCount: 0,
    categoriesCount: 0,
    transfersCount: 0,
  });

  useEffect(() => {
    if (user) {
      if (!isAdmin(user.email)) {
        showToast('Access denied. Admin only.', 'error');
        router.push('/dashboard');
        return;
      }
      loadUserData();
    }
  }, [user, userId, router]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAccounts(),
        loadTransactions(),
        loadTransfers(),
        loadCategories(),
        loadZakatCycles(),
        loadSettings(),
      ]);
      calculateStats();
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('Failed to load user data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const accountsRef = collection(db, 'users', userId, 'accounts');
      const snapshot = await getDocs(accountsRef);
      const accounts = [];
      snapshot.forEach((doc) => {
        accounts.push({ id: doc.id, ...doc.data() });
      });
      setUserData(prev => ({ ...prev, accounts }));
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const q = query(transactionsRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const transactions = [];
      snapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      setUserData(prev => ({ ...prev, transactions }));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadTransfers = async () => {
    try {
      const transfersRef = collection(db, 'users', userId, 'transfers');
      const q = query(transfersRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const transfers = [];
      snapshot.forEach((doc) => {
        transfers.push({ id: doc.id, ...doc.data() });
      });
      setUserData(prev => ({ ...prev, transfers }));
    } catch (error) {
      console.error('Error loading transfers:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesRef = collection(db, 'users', userId, 'categories');
      const snapshot = await getDocs(categoriesRef);
      const categories = [];
      snapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() });
      });
      setUserData(prev => ({ ...prev, categories }));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadZakatCycles = async () => {
    try {
      const zakatRef = collection(db, 'users', userId, 'zakatCycles');
      const q = query(zakatRef, orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);
      const cycles = [];
      snapshot.forEach((doc) => {
        cycles.push({ id: doc.id, ...doc.data() });
      });
      setUserData(prev => ({ ...prev, zakatCycles: cycles }));
    } catch (error) {
      console.error('Error loading zakat cycles:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsRef = collection(db, 'users', userId, 'settings');
      const snapshot = await getDocs(settingsRef);
      if (!snapshot.empty) {
        const settingsDoc = snapshot.docs[0];
        setUserData(prev => ({ ...prev, settings: { id: settingsDoc.id, ...settingsDoc.data() } }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const calculateStats = () => {
    const totalWealth = userData.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalIncome = userData.transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = userData.transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalWealth,
      totalIncome,
      totalExpense,
      accountsCount: userData.accounts.length,
      transactionsCount: userData.transactions.length,
      categoriesCount: userData.categories.length,
      transfersCount: userData.transfers.length,
    });
  };

  useEffect(() => {
    if (userData.accounts.length > 0 || userData.transactions.length > 0) {
      calculateStats();
    }
  }, [userData]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return date;
    if (date.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const getCategoryName = (categoryId) => {
    const category = userData.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getAccountName = (accountId) => {
    const account = userData.accounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push('/dashboard/admin')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">User Details</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">User ID: {userId}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Wealth</p>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">৳{stats.totalWealth.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Income</p>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">৳{stats.totalIncome.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Expense</p>
            <Activity className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">৳{stats.totalExpense.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net</p>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <p className={`text-2xl font-semibold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ৳{(stats.totalIncome - stats.totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Counts Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Wallet className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Accounts</p>
              <p className="text-lg font-semibold text-gray-900">{stats.accountsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Receipt className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Transactions</p>
              <p className="text-lg font-semibold text-gray-900">{stats.transactionsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <ArrowRightLeft className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Transfers</p>
              <p className="text-lg font-semibold text-gray-900">{stats.transfersCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Tag className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Categories</p>
              <p className="text-lg font-semibold text-gray-900">{stats.categoriesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Info */}
      {userData.settings && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Settings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Currency</p>
              <p className="text-sm font-medium text-gray-900">{userData.settings.currency || 'BDT'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Date Format</p>
              <p className="text-sm font-medium text-gray-900">{userData.settings.dateFormat || 'DD/MM/YYYY'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Theme</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{userData.settings.theme || 'Light'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Nisab Threshold</p>
              <p className="text-sm font-medium text-gray-900">৳{(userData.settings.nisabThreshold || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Accounts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Accounts ({userData.accounts.length})</h2>
          <Wallet className="w-5 h-5 text-gray-400" />
        </div>
        {userData.accounts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No accounts found</p>
        ) : (
          <div className="space-y-3">
            {userData.accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{account.name}</p>
                  <p className="text-xs text-gray-500">{account.type}</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">৳{account.balance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Categories ({userData.categories.length})</h2>
          <Tag className="w-5 h-5 text-gray-400" />
        </div>
        {userData.categories.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No categories found</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {userData.categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                  <p className="text-xs text-gray-500">{category.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Receipt className="w-5 h-5 text-gray-400" />
        </div>
        {userData.transactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No transactions found</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {userData.transactions.slice(0, 20).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      transaction.type === 'Income' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.type}
                    </span>
                    <p className="text-sm font-medium text-gray-900">{getCategoryName(transaction.categoryId)}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {getAccountName(transaction.accountId)} • {formatDate(transaction.date)}
                  </p>
                  {transaction.description && (
                    <p className="text-xs text-gray-400 mt-1">{transaction.description}</p>
                  )}
                </div>
                <p className={`text-sm font-semibold ${
                  transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'Income' ? '+' : '-'}৳{transaction.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfers */}
      {userData.transfers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transfers</h2>
            <ArrowRightLeft className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {userData.transfers.slice(0, 10).map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {transfer.fromAccountName} → {transfer.toAccountName}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(transfer.date)}</p>
                  {transfer.description && (
                    <p className="text-xs text-gray-400 mt-1">{transfer.description}</p>
                  )}
                </div>
                <p className="text-sm font-semibold text-blue-600">৳{transfer.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zakat Cycles */}
      {userData.zakatCycles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Zakat Cycles</h2>
            <Coins className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {userData.zakatCycles.map((cycle) => (
              <div key={cycle.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    cycle.status === 'active' 
                      ? 'bg-blue-100 text-blue-700'
                      : cycle.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {cycle.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                  {cycle.zakatAmount && (
                    <p className="text-lg font-semibold text-gray-900">৳{cycle.zakatAmount.toLocaleString()}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="font-medium">{formatDate(cycle.startDate)}</p>
                  </div>
                  {cycle.endDate && (
                    <div>
                      <p className="text-gray-500">End Date</p>
                      <p className="font-medium">{formatDate(cycle.endDate)}</p>
                    </div>
                  )}
                  {cycle.nisabThreshold && (
                    <div>
                      <p className="text-gray-500">Nisab Threshold</p>
                      <p className="font-medium">৳{cycle.nisabThreshold.toLocaleString()}</p>
                    </div>
                  )}
                  {cycle.paymentStatus && (
                    <div>
                      <p className="text-gray-500">Payment Status</p>
                      <p className="font-medium capitalize">{cycle.paymentStatus}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">User Data Overview</p>
              <p className="text-xs text-blue-700">All data is displayed in read-only mode</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            Back to Admin
          </button>
        </div>
      </div>
    </div>
  );
}