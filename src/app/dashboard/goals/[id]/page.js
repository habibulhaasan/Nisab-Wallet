'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAccounts } from '@/lib/firestoreCollections';
import { showToast } from '@/components/Toast';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Flag,
  PieChart,
} from 'lucide-react';

export default function GoalDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const goalId = params.id;

  const [goal, setGoal] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user && goalId) loadData();
  }, [user, goalId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadGoal(), loadTransactions(), loadAccounts()]);
    setLoading(false);
  };

  const loadGoal = async () => {
    try {
      const goalDoc = await getDoc(doc(db, 'users', user.uid, 'financialGoals', goalId));
      if (goalDoc.exists()) {
        setGoal({ id: goalDoc.id, ...goalDoc.data() });
      } else {
        showToast('Goal not found', 'error');
        router.push('/dashboard/goals');
      }
    } catch (error) {
      console.error('Error loading goal:', error);
      showToast('Error loading goal', 'error');
    }
  };

  const loadTransactions = async () => {
    try {
      const transRef = collection(db, 'users', user.uid, 'goalTransactions');
      const q = query(transRef, where('goalId', '==', goalId), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const transData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(transData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
    }
  };

  const handleDeleteGoal = async () => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'financialGoals', goalId));
      showToast('Goal deleted successfully', 'success');
      router.push('/dashboard/goals');
    } catch (error) {
      console.error('Error deleting goal:', error);
      showToast('Error deleting goal', 'error');
    }
  };

  const exportTransactions = () => {
    if (transactions.length === 0) {
      return showToast('No transactions to export', 'error');
    }

    const csv = [
      ['Date', 'Type', 'Amount', 'Account', 'Description'].join(','),
      ...transactions.map((t) =>
        [
          t.date,
          t.type,
          t.amount,
          getAccountName(t.accountId),
          t.description || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${goal.goalName}-transactions.csv`;
    a.click();
    showToast('Transactions exported', 'success');
  };

  const calculateMetrics = () => {
    if (!goal) return {};

    const currentAmount = parseFloat(goal.currentAmount) || 0;
    const targetAmount = parseFloat(goal.targetAmount) || 1;
    const percentageComplete = Math.min((currentAmount / targetAmount) * 100, 100);

    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const startDate = goal.startDate ? new Date(goal.startDate) : new Date(goal.createdAt?.toDate?.() || today);

    const totalDays = Math.ceil((targetDate - startDate) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

    const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
    const onTrack = percentageComplete >= expectedProgress;

    const monthlyRequired = daysRemaining > 0 ? (targetAmount - currentAmount) / (daysRemaining / 30) : 0;

    const totalDeposits = transactions.filter((t) => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = transactions.filter((t) => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);

    return {
      percentageComplete: percentageComplete.toFixed(1),
      daysRemaining: Math.max(0, daysRemaining),
      daysElapsed,
      totalDays,
      onTrack,
      monthlyRequired: monthlyRequired.toFixed(0),
      totalDeposits,
      totalWithdrawals,
      netSavings: totalDeposits - totalWithdrawals,
    };
  };

  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || 'Unknown';

  const categoryIcons = {
    hajj: '🕋',
    marriage: '💍',
    education: '🎓',
    emergency: '🆘',
    house: '🏠',
    car: '🚗',
    business: '💼',
    other: '🎯',
  };

  const categoryColors = {
    hajj: 'from-emerald-500 to-green-500',
    marriage: 'from-pink-500 to-rose-500',
    education: 'from-blue-500 to-cyan-500',
    emergency: 'from-red-500 to-orange-500',
    house: 'from-purple-500 to-pink-500',
    car: 'from-indigo-500 to-blue-500',
    business: 'from-orange-500 to-yellow-500',
    other: 'from-gray-500 to-gray-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full"></div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={64} className="mx-auto mb-4 text-gray-300" />
        <p className="text-lg text-gray-600">Goal not found</p>
      </div>
    );
  }

  const metrics = calculateMetrics();
  const categoryColor = categoryColors[goal.category] || categoryColors.other;
  const categoryIcon = categoryIcons[goal.category] || categoryIcons.other;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/goals')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 bg-gradient-to-br ${categoryColor} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
              {categoryIcon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{goal.goalName}</h1>
              <p className="text-sm text-gray-500">{goal.description || 'Financial Goal'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportTransactions}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={() => router.push(`/dashboard/goals?edit=${goalId}`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Progress Overview</h2>
          {goal.status === 'completed' ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
              <CheckCircle2 size={16} />
              Completed
            </span>
          ) : (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              metrics.onTrack ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {metrics.onTrack ? 'On Track' : 'Behind Schedule'}
            </span>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">
              ৳{goal.currentAmount.toLocaleString()} / ৳{goal.targetAmount.toLocaleString()}
            </span>
            <span className="font-bold text-gray-900">{metrics.percentageComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all bg-gradient-to-r ${categoryColor}`}
              style={{ width: `${Math.min(metrics.percentageComplete, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <DollarSign size={24} className="mx-auto mb-2 text-green-600" />
            <p className="text-xs text-gray-500 mb-1">Saved</p>
            <p className="text-lg font-bold text-green-600">৳{goal.currentAmount.toLocaleString()}</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Target size={24} className="mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-gray-500 mb-1">Target</p>
            <p className="text-lg font-bold text-blue-600">৳{goal.targetAmount.toLocaleString()}</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock size={24} className="mx-auto mb-2 text-orange-600" />
            <p className="text-xs text-gray-500 mb-1">Days Left</p>
            <p className="text-lg font-bold text-orange-600">{metrics.daysRemaining}</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <TrendingUp size={24} className="mx-auto mb-2 text-purple-600" />
            <p className="text-xs text-gray-500 mb-1">Monthly Needed</p>
            <p className="text-lg font-bold text-purple-600">৳{metrics.monthlyRequired}</p>
          </div>
        </div>
      </div>

      {/* Goal Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Goal Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Category</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{goal.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Priority</span>
                <span className={`text-sm font-medium capitalize ${
                  goal.priority === 'high' ? 'text-red-600' :
                  goal.priority === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {goal.priority}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Start Date</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(goal.startDate || goal.createdAt?.toDate?.()).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Target Date</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(goal.targetDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Linked Account</span>
                <span className="text-sm font-medium text-gray-900">{getAccountName(goal.accountId)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Monthly Contribution</span>
                <span className="text-sm font-medium text-gray-900">
                  {goal.monthlyContribution ? `৳${goal.monthlyContribution.toLocaleString()}` : 'Flexible'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Deposits</span>
                <span className="text-sm font-medium text-green-600">
                  ৳{metrics.totalDeposits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Withdrawals</span>
                <span className="text-sm font-medium text-red-600">
                  ৳{metrics.totalWithdrawals.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Net Savings</span>
                <span className="text-sm font-medium text-blue-600">
                  ৳{metrics.netSavings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Days Elapsed</span>
                <span className="text-sm font-medium text-gray-900">{metrics.daysElapsed} days</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Total Duration</span>
                <span className="text-sm font-medium text-gray-900">{metrics.totalDays} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Transactions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {transactions.map((trans) => (
                <div
                  key={trans.id}
                  className={`flex items-start justify-between p-4 rounded-lg border ${
                    trans.type === 'deposit' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {trans.type === 'deposit' ? (
                      <TrendingUp size={20} className="text-green-600 mt-1" />
                    ) : (
                      <TrendingDown size={20} className="text-red-600 mt-1" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {trans.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                      </p>
                      <p className="text-xs text-gray-600">{getAccountName(trans.accountId)}</p>
                      {trans.description && (
                        <p className="text-xs text-gray-500 mt-1">{trans.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(trans.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      trans.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trans.type === 'deposit' ? '+' : '-'}৳{trans.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award size={20} />
          Milestones
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[25, 50, 75, 100].map((milestone) => {
            const achieved = parseFloat(metrics.percentageComplete) >= milestone;
            return (
              <div
                key={milestone}
                className={`p-4 rounded-lg text-center ${
                  achieved ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`text-3xl mb-2 ${achieved ? '' : 'opacity-30'}`}>
                  {milestone === 25 ? '✨' : milestone === 50 ? '🌟' : milestone === 75 ? '🎊' : '🎉'}
                </div>
                <p className={`text-lg font-bold ${achieved ? 'text-green-600' : 'text-gray-400'}`}>
                  {milestone}%
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {achieved ? 'Achieved!' : 'Not yet'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Delete Goal?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will permanently delete "{goal.goalName}" and all transaction history.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGoal}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}