// src/app/dashboard/goals/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAccounts } from '@/lib/firestoreCollections';
import { showToast } from '@/components/Toast';
import { getAvailableBalance } from '@/lib/goalUtils';
import {
  Plus,
  Target,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  Flag,
  Loader2,
  PiggyBank,
  Clock,
  Wallet,
  Building2,
} from 'lucide-react';

export default function FinancialGoalsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountsWithAvailable, setAccountsWithAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [deleteImpact, setDeleteImpact] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');

  const [goalFormData, setGoalFormData] = useState({
    goalName: '',
    category: 'other',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    monthlyContribution: '',
    linkedAccountId: '',
    priority: 'medium',
    description: '',
    enableNotifications: true,
  });

  const [transactionFormData, setTransactionFormData] = useState({
    amount: '',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadGoals(), loadAccounts()]);
    setLoading(false);
  };

  const loadGoals = async () => {
    try {
      const goalsRef = collection(db, 'users', user.uid, 'financialGoals');
      const q = query(goalsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const goalsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading goals:', error);
      showToast('Failed to load goals', 'error');
    }
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      // Calculate available balance for each account
      const accountsWithAvailableBalance = await Promise.all(
        result.accounts.map(async (account) => {
          const available = await getAvailableBalance(user.uid, account.id, account.balance);
          return {
            ...account,
            availableBalance: available,
          };
        })
      );
      
      setAccounts(result.accounts);
      setAccountsWithAvailable(accountsWithAvailableBalance);
      
      if (result.accounts.length > 0 && !goalFormData.linkedAccountId) {
        setGoalFormData((prev) => ({ ...prev, linkedAccountId: result.accounts[0].id }));
        setTransactionFormData((prev) => ({ ...prev, accountId: result.accounts[0].id }));
      }
    }
  };

  // Calculate allocated amount per account
  const getAccountAllocations = (accountId) => {
    const accountGoals = goals.filter(
      (g) => g.linkedAccountId === accountId && g.status === 'active'
    );
    const totalAllocated = accountGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    return {
      allocated: totalAllocated,
      goals: accountGoals,
    };
  };

  // Get available balance for account (total - allocated)
  const getAvailableBalanceSync = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return 0;
    const { allocated } = getAccountAllocations(accountId);
    return Math.max(0, account.balance - allocated);
  };

  // Format date as dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const calculateGoalMetrics = (goal) => {
    const currentAmount = parseFloat(goal.currentAmount) || 0;
    const targetAmount = parseFloat(goal.targetAmount) || 1;
    const percentageComplete = Math.min((currentAmount / targetAmount) * 100, 100);

    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const startDate = goal.startDate ? new Date(goal.startDate) : new Date(goal.createdAt?.toDate?.() || today);

    const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    const monthsRemaining = Math.max(1, daysRemaining / 30);

    const totalDays = Math.ceil((targetDate - startDate) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

    const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
    const onTrack = percentageComplete >= expectedProgress;

    const remainingAmount = targetAmount - currentAmount;
    const monthlyRequired = daysRemaining > 0 ? remainingAmount / monthsRemaining : 0;

    return {
      percentageComplete: percentageComplete.toFixed(1),
      daysRemaining: Math.max(0, daysRemaining),
      monthsRemaining: monthsRemaining.toFixed(1),
      onTrack,
      monthlyRequired: monthlyRequired.toFixed(0),
    };
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!goalFormData.goalName || !goalFormData.targetAmount || !goalFormData.targetDate) {
      return showToast('Please fill in required fields', 'error');
    }

    setSubmitting(true);

    try {
      const targetAmount = parseFloat(goalFormData.targetAmount);
      const currentAmount = parseFloat(goalFormData.currentAmount) || 0;

      // Check if account has enough available balance
      if (!editingGoal && currentAmount > 0) {
        const available = getAvailableBalanceSync(goalFormData.linkedAccountId);
        const account = accounts.find((a) => a.id === goalFormData.linkedAccountId);
        const accountBalance = account?.balance || 0;

        if (currentAmount > available) {
          setSubmitting(false);
          return showToast(
            `Insufficient available balance. Account has ৳${accountBalance.toLocaleString()} total but only ৳${available.toLocaleString()} is available (৳${(accountBalance - available).toLocaleString()} already allocated to other goals)`,
            'error'
          );
        }
      }

      if (editingGoal) {
        await updateDoc(doc(db, 'users', user.uid, 'financialGoals', editingGoal.id), {
          goalName: goalFormData.goalName,
          category: goalFormData.category,
          targetAmount,
          targetDate: goalFormData.targetDate,
          monthlyContribution: parseFloat(goalFormData.monthlyContribution) || 0,
          linkedAccountId: goalFormData.linkedAccountId,
          priority: goalFormData.priority,
          description: goalFormData.description || '',
          enableNotifications: goalFormData.enableNotifications,
          updatedAt: Timestamp.now(),
        });
        showToast('Goal updated successfully', 'success');
      } else {
        const goalData = {
          goalName: goalFormData.goalName,
          category: goalFormData.category,
          targetAmount,
          currentAmount,
          startDate: new Date().toISOString().split('T')[0],
          targetDate: goalFormData.targetDate,
          monthlyContribution: parseFloat(goalFormData.monthlyContribution) || 0,
          linkedAccountId: goalFormData.linkedAccountId,
          priority: goalFormData.priority,
          description: goalFormData.description || '',
          status: 'active',
          enableNotifications: goalFormData.enableNotifications,
          totalDeposited: currentAmount,
          totalWithdrawn: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await addDoc(collection(db, 'users', user.uid, 'financialGoals'), goalData);

        if (currentAmount > 0) {
          await addDoc(collection(db, 'users', user.uid, 'goalTransactions'), {
            goalId: 'temp',
            type: 'deposit',
            amount: currentAmount,
            date: new Date().toISOString().split('T')[0],
            accountId: goalFormData.linkedAccountId,
            description: 'Initial allocation',
            createdAt: Timestamp.now(),
          });
        }

        showToast('Goal created successfully! 🎯', 'success');
      }

      await loadData();
      closeGoalModal();
    } catch (error) {
      console.error('Error saving goal:', error);
      showToast('Error saving goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (submitting || !selectedGoal) return;

    const amount = parseFloat(transactionFormData.amount);
    if (!amount || amount <= 0) {
      return showToast('Please enter a valid amount', 'error');
    }

    const available = getAvailableBalanceSync(transactionFormData.accountId);
    const account = accounts.find((a) => a.id === transactionFormData.accountId);

    if (amount > available) {
      return showToast(
        `Insufficient available balance. Total: ৳${account.balance.toLocaleString()}, Available: ৳${available.toLocaleString()} (৳${(account.balance - available).toLocaleString()} already allocated to other goals)`,
        'error'
      );
    }

    setSubmitting(true);

    try {
      const newCurrentAmount = selectedGoal.currentAmount + amount;
      const newStatus = newCurrentAmount >= selectedGoal.targetAmount ? 'completed' : 'active';
      const newPercentage = (newCurrentAmount / selectedGoal.targetAmount) * 100;

      await updateDoc(doc(db, 'users', user.uid, 'financialGoals', selectedGoal.id), {
        currentAmount: newCurrentAmount,
        totalDeposited: (selectedGoal.totalDeposited || 0) + amount,
        status: newStatus,
        lastContributionDate: transactionFormData.date,
        updatedAt: Timestamp.now(),
      });

      await addDoc(collection(db, 'users', user.uid, 'goalTransactions'), {
        goalId: selectedGoal.id,
        type: 'deposit',
        amount,
        date: transactionFormData.date,
        accountId: transactionFormData.accountId,
        description: transactionFormData.description || 'Deposit',
        createdAt: Timestamp.now(),
      });

      const oldPercentage = (selectedGoal.currentAmount / selectedGoal.targetAmount) * 100;
      if (newStatus === 'completed') {
        showToast('🎉 Congratulations! Goal completed!', 'success');
      } else if (newPercentage >= 75 && oldPercentage < 75) {
        showToast('🎊 75% complete! Almost there!', 'success');
      } else if (newPercentage >= 50 && oldPercentage < 50) {
        showToast('🌟 Halfway there! Keep going!', 'success');
      } else if (newPercentage >= 25 && oldPercentage < 25) {
        showToast('✨ 25% complete! Great start!', 'success');
      } else {
        showToast('Allocation increased successfully', 'success');
      }

      await loadData();
      closeDepositModal();
    } catch (error) {
      console.error('Error processing deposit:', error);
      showToast('Error processing deposit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (submitting || !selectedGoal) return;

    const amount = parseFloat(transactionFormData.amount);
    if (!amount || amount <= 0) {
      return showToast('Please enter a valid amount', 'error');
    }

    if (amount > selectedGoal.currentAmount) {
      return showToast('Amount exceeds allocated balance', 'error');
    }

    setSubmitting(true);

    try {
      const newCurrentAmount = selectedGoal.currentAmount - amount;

      await updateDoc(doc(db, 'users', user.uid, 'financialGoals', selectedGoal.id), {
        currentAmount: newCurrentAmount,
        totalWithdrawn: (selectedGoal.totalWithdrawn || 0) + amount,
        updatedAt: Timestamp.now(),
      });

      await addDoc(collection(db, 'users', user.uid, 'goalTransactions'), {
        goalId: selectedGoal.id,
        type: 'withdrawal',
        amount,
        date: transactionFormData.date,
        accountId: transactionFormData.accountId,
        description: transactionFormData.description || 'Withdrawal',
        createdAt: Timestamp.now(),
      });

      showToast('Allocation reduced successfully', 'success');
      await loadData();
      closeWithdrawModal();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      showToast('Error processing withdrawal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDeleteImpact = async (goal) => {
    try {
      const transRef = collection(db, 'users', user.uid, 'goalTransactions');
      const q = query(transRef, where('goalId', '==', goal.id));
      const snapshot = await getDocs(q);

      const deposits = snapshot.docs.filter((d) => d.data().type === 'deposit');
      const withdrawals = snapshot.docs.filter((d) => d.data().type === 'withdrawal');

      const totalDeposits = deposits.reduce((sum, d) => sum + d.data().amount, 0);
      const totalWithdrawals = withdrawals.reduce((sum, d) => sum + d.data().amount, 0);

      return {
        transactionCount: snapshot.docs.length,
        deposits: deposits.length,
        withdrawals: withdrawals.length,
        totalDeposits,
        totalWithdrawals,
        netAmount: goal.currentAmount,
      };
    } catch (error) {
      console.error('Error calculating impact:', error);
      return null;
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      const transRef = collection(db, 'users', user.uid, 'goalTransactions');
      const q = query(transRef, where('goalId', '==', goalToDelete.id));
      const snapshot = await getDocs(q);

      for (const transDoc of snapshot.docs) {
        await deleteDoc(transDoc.ref);
      }

      await deleteDoc(doc(db, 'users', user.uid, 'financialGoals', goalToDelete.id));

      showToast(
        `Goal deleted. ৳${goalToDelete.currentAmount.toLocaleString()} is now available in your account`,
        'success'
      );
      await loadData();
    } catch (error) {
      console.error('Error deleting goal:', error);
      showToast('Error deleting goal', 'error');
    } finally {
      setShowDeleteModal(false);
      setGoalToDelete(null);
      setDeleteImpact(null);
    }
  };

  const openGoalModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalFormData({
        goalName: goal.goalName,
        category: goal.category,
        targetAmount: goal.targetAmount.toString(),
        currentAmount: goal.currentAmount.toString(),
        targetDate: goal.targetDate,
        monthlyContribution: goal.monthlyContribution?.toString() || '',
        linkedAccountId: goal.linkedAccountId || accounts[0]?.id || '',
        priority: goal.priority,
        description: goal.description || '',
        enableNotifications: goal.enableNotifications !== false,
      });
    } else {
      setEditingGoal(null);
      setGoalFormData({
        goalName: '',
        category: 'other',
        targetAmount: '',
        currentAmount: '0',
        targetDate: '',
        monthlyContribution: '',
        linkedAccountId: accounts[0]?.id || '',
        priority: 'medium',
        description: '',
        enableNotifications: true,
      });
    }
    setShowGoalModal(true);
  };

  const closeGoalModal = () => {
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  const openDepositModal = (goal) => {
    setSelectedGoal(goal);
    setTransactionFormData({
      amount: goal.monthlyContribution?.toString() || '',
      accountId: goal.linkedAccountId || accounts[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setShowDepositModal(true);
  };

  const closeDepositModal = () => {
    setShowDepositModal(false);
    setSelectedGoal(null);
  };

  const openWithdrawModal = (goal) => {
    setSelectedGoal(goal);
    setTransactionFormData({
      amount: '',
      accountId: goal.linkedAccountId || accounts[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setShowWithdrawModal(true);
  };

  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
    setSelectedGoal(null);
  };

  const openDeleteModal = async (goal) => {
    setGoalToDelete(goal);
    const impact = await calculateDeleteImpact(goal);
    setDeleteImpact(impact);
    setShowDeleteModal(true);
  };

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

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };

  const getAccountName = (id) => {
    if (!id) return 'Unknown';
    const account = accounts.find((a) => a.id === id);
    return account?.name || 'Unknown';
  };

  const filteredGoals = goals.filter((goal) => {
    if (filterStatus === 'all') return true;
    return goal.status === filterStatus;
  });

  const totalAllocated = goals
    .filter((g) => g.status === 'active')
    .reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-sm text-gray-500 mt-1">Virtual allocations from your accounts</p>
        </div>
        <button
          onClick={() => openGoalModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium w-full sm:w-auto"
        >
          <Plus size={16} />
          New Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Allocated</p>
            <PiggyBank size={14} className="text-green-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-green-600">
            ৳{totalAllocated.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Virtual savings</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Target</p>
            <Target size={14} className="text-blue-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-blue-600">
            ৳{totalTarget.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {totalTarget > 0 ? ((totalAllocated / totalTarget) * 100).toFixed(1) : 0}% achieved
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Active</p>
            <Flag size={14} className="text-orange-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-orange-600">{activeGoals}</p>
          <p className="text-xs text-gray-500 mt-1">In progress</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Done</p>
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-600">{completedGoals}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
      </div>

      {/* Account Allocations Info */}
      {accounts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Wallet size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-blue-900 mb-1">Account Allocations</p>
              <p className="text-xs sm:text-sm text-blue-700 mb-3">
                Goals are virtual allocations. Money stays in your accounts.
              </p>

              <div className="space-y-2">
                {accounts.map((account) => {
                  const { allocated, goals: accountGoals } = getAccountAllocations(account.id);
                  const available = account.balance - allocated;

                  if (allocated === 0) return null;

                  return (
                    <div
                      key={account.id}
                      className="bg-white/80 rounded-lg p-3 border border-blue-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {account.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Total: ৳{account.balance.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <p className="text-xs text-gray-600">Available</p>
                          <p className={`font-bold ${available < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ৳{available.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-blue-100">
                        <p className="text-xs font-medium text-blue-800 mb-1.5">
                          Allocated: ৳{allocated.toLocaleString()}
                        </p>
                        {accountGoals.map((goal) => (
                          <div
                            key={goal.id}
                            className="flex items-center justify-between text-xs bg-blue-50 rounded px-2 py-1"
                          >
                            <span className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className="text-sm flex-shrink-0">
                                {categoryIcons[goal.category]}
                              </span>
                              <span className="text-blue-700 truncate">{goal.goalName}</span>
                            </span>
                            <span className="font-semibold text-blue-900 ml-2 flex-shrink-0">
                              ৳{goal.currentAmount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {available < 0 && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs text-red-600 font-medium">
                            ⚠️ Warning: You've spent ৳{Math.abs(available).toLocaleString()} of your goal money!
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'active', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 sm:px-4 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Goals List */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
          <Target size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900">No goals found</p>
          <p className="text-sm text-gray-500 mt-1">Create your first goal to start saving</p>
          <button
            onClick={() => openGoalModal()}
            className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => {
            const metrics = calculateGoalMetrics(goal);
            const categoryColor = categoryColors[goal.category] || categoryColors.other;
            const categoryIcon = categoryIcons[goal.category] || categoryIcons.other;

            return (
              <div
                key={goal.id}
                className="bg-white rounded-lg shadow-sm p-4 sm:p-5 border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${categoryColor} rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm flex-shrink-0`}
                  >
                    {categoryIcon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {goal.goalName}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${priorityColors[goal.priority]}`}
                      >
                        {goal.priority.toUpperCase()}
                      </span>
                      {goal.status === 'completed' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0">
                          <CheckCircle2 size={12} /> Done
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 mb-1">
                      {goal.description || `Target by ${formatDate(goal.targetDate)}`}
                    </p>
                    {/* ADDED: Show linked account */}
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Building2 size={12} />
                      <span className="font-medium">{getAccountName(goal.linkedAccountId)}</span>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {goal.status === 'active' && (
                      <>
                        <button
                          onClick={() => openDepositModal(goal)}
                          className="p-1.5 sm:p-2 hover:bg-green-50 rounded-lg"
                          title="Add Money"
                        >
                          <ArrowUpCircle size={16} className="text-green-600 sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                          onClick={() => openWithdrawModal(goal)}
                          className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg"
                          title="Remove Money"
                        >
                          <ArrowDownCircle size={16} className="text-red-600 sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/goals/${goal.id}`)}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
                      title="Details"
                    >
                      <Eye size={16} className="text-gray-600 sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={() => openGoalModal(goal)}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 size={16} className="text-gray-600 sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(goal)}
                      className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-gray-600 sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">
                      ৳{goal.currentAmount.toLocaleString()} / ৳
                      {goal.targetAmount.toLocaleString()}
                    </span>
                    <span className="font-medium text-gray-900">
                      {metrics.percentageComplete}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                    <div
                      className={`h-2.5 sm:h-3 rounded-full transition-all bg-gradient-to-r ${categoryColor}`}
                      style={{ width: `${Math.min(metrics.percentageComplete, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-0.5">Days Left</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Clock size={12} className="sm:w-[14px] sm:h-[14px]" />
                      {metrics.daysRemaining}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-0.5">Monthly Need</p>
                    <p className="font-semibold text-blue-600">
                      ৳{metrics.monthlyRequired}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-0.5">Status</p>
                    <p
                      className={`font-semibold flex items-center gap-1 ${
                        metrics.onTrack ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {metrics.onTrack ? (
                        <>
                          <CheckCircle2 size={12} className="sm:w-[14px] sm:h-[14px]" /> Track
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} className="sm:w-[14px] sm:h-[14px]" /> Behind
                        </>
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-0.5">Account</p>
                    <p className="font-semibold text-gray-900 truncate">
                      {getAccountName(goal.linkedAccountId)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Goal Modal - FIT WITHIN SCREEN */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl my-4 shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                </h2>
                <button onClick={closeGoalModal} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleGoalSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Goal Name *</label>
                  <input
                    type="text"
                    value={goalFormData.goalName}
                    onChange={(e) => setGoalFormData((p) => ({ ...p, goalName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="e.g., Hajj 2027"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={goalFormData.category}
                    onChange={(e) => setGoalFormData((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    disabled={submitting}
                  >
                    <option value="hajj">🕋 Hajj</option>
                    <option value="marriage">💍 Marriage</option>
                    <option value="education">🎓 Education</option>
                    <option value="emergency">🆘 Emergency Fund</option>
                    <option value="house">🏠 House</option>
                    <option value="car">🚗 Car</option>
                    <option value="business">💼 Business</option>
                    <option value="other">🎯 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    value={goalFormData.priority}
                    onChange={(e) => setGoalFormData((p) => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    disabled={submitting}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Target Amount (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={goalFormData.targetAmount}
                    onChange={(e) => setGoalFormData((p) => ({ ...p, targetAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="500000"
                    required
                    disabled={submitting}
                  />
                </div>

                {!editingGoal && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Initial Amount (৳)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={goalFormData.currentAmount}
                      onChange={(e) => setGoalFormData((p) => ({ ...p, currentAmount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="0"
                      disabled={submitting}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Target Date *</label>
                  <input
                    type="date"
                    value={goalFormData.targetDate}
                    onChange={(e) => setGoalFormData((p) => ({ ...p, targetDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Monthly Contribution (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={goalFormData.monthlyContribution}
                    onChange={(e) => setGoalFormData((p) => ({ ...p, monthlyContribution: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="5000"
                    disabled={submitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Allocate From Account *
                  </label>
                  <select
                    value={goalFormData.linkedAccountId}
                    onChange={(e) => setGoalFormData((p) => ({ ...p, linkedAccountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    disabled={submitting}
                  >
                    {accountsWithAvailable.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Available: ৳{a.availableBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Money will stay in this account but marked as allocated
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={goalFormData.description}
                    onChange={(e) => setGoalFormData((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    rows="2"
                    placeholder="Optional description..."
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="enableNotifications"
                  checked={goalFormData.enableNotifications}
                  onChange={(e) => setGoalFormData((p) => ({ ...p, enableNotifications: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="enableNotifications" className="text-xs sm:text-sm text-gray-700">
                  Enable milestone notifications
                </label>
              </div>

              <div className="flex gap-3 pt-3 sticky bottom-0 bg-white border-t border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2 mt-4">
                <button
                  type="button"
                  onClick={closeGoalModal}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingGoal ? 'Update Goal' : 'Create Goal'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal - FIT WITHIN SCREEN */}
      {showDepositModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Allocate to Goal</h2>
              <button onClick={closeDepositModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{selectedGoal.goalName}</p>
              <p className="text-xs text-gray-600">
                Current: ৳{selectedGoal.currentAmount.toLocaleString()} / ৳{selectedGoal.targetAmount.toLocaleString()}
              </p>
              {/* ADDED: Show account */}
              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                <Building2 size={12} />
                <span className="font-medium">{getAccountName(selectedGoal.linkedAccountId)}</span>
              </div>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionFormData.amount}
                  onChange={(e) => setTransactionFormData((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder={selectedGoal.monthlyContribution?.toString() || '5000'}
                  required
                  disabled={submitting}
                  autoFocus
                />
                {transactionFormData.amount && (
                  <p className="text-xs text-gray-600 mt-1">
                    New allocation: ৳{(selectedGoal.currentAmount + parseFloat(transactionFormData.amount || 0)).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Account *</label>
                <select
                  value={transactionFormData.accountId}
                  onChange={(e) => setTransactionFormData((p) => ({ ...p, accountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  required
                  disabled={submitting}
                >
                  {accountsWithAvailable.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Avail: ৳{a.availableBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={transactionFormData.date}
                  onChange={(e) => setTransactionFormData((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={transactionFormData.description}
                  onChange={(e) => setTransactionFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Monthly contribution..."
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDepositModal}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Allocate</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal - FIT WITHIN SCREEN */}
      {showWithdrawModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Remove from Goal</h2>
              <button onClick={closeWithdrawModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{selectedGoal.goalName}</p>
              <p className="text-xs text-gray-600">
                Allocated: ৳{selectedGoal.currentAmount.toLocaleString()}
              </p>
              {/* ADDED: Show account */}
              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                <Building2 size={12} />
                <span className="font-medium">{getAccountName(selectedGoal.linkedAccountId)}</span>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionFormData.amount}
                  onChange={(e) => setTransactionFormData((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="10000"
                  required
                  disabled={submitting}
                  max={selectedGoal.currentAmount}
                  autoFocus
                />
                {transactionFormData.amount && (
                  <p className="text-xs text-gray-600 mt-1">
                    Remaining allocation: ৳{(selectedGoal.currentAmount - parseFloat(transactionFormData.amount || 0)).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Account *</label>
                <select
                  value={transactionFormData.accountId}
                  onChange={(e) => setTransactionFormData((p) => ({ ...p, accountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  required
                  disabled={submitting}
                >
                  {accountsWithAvailable.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={transactionFormData.date}
                  onChange={(e) => setTransactionFormData((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={transactionFormData.description}
                  onChange={(e) => setTransactionFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="Emergency withdrawal..."
                  disabled={submitting}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  ⚠️ Removing allocation will reduce your goal progress
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeWithdrawModal}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Remove</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && goalToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Delete Goal?</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently delete "{goalToDelete.goalName}".
              </p>
              
              {deleteImpact && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                  <p className="text-sm font-medium text-red-900 mb-2">Impact:</p>
                  <ul className="text-xs text-red-800 space-y-1">
                    <li>• Allocated amount (৳{deleteImpact.netAmount.toLocaleString()}) will become available</li>
                    <li>• {deleteImpact.transactionCount} transaction records will be deleted</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setGoalToDelete(null);
                    setDeleteImpact(null);
                  }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGoal}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                >
                  Delete Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}