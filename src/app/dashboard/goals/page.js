// src/app/dashboard/goals/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getGoalAllocations, getAvailableBalance } from '@/lib/goalUtils';
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
import {
  Plus,
  Target,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  DollarSign,
  Flag,
  Loader2,
  PiggyBank,
  Clock,
  Calendar,
  Award,
  TrendingDown,
} from 'lucide-react';

export default function FinancialGoalsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showDeallocateModal, setShowDeallocateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);

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
      setAccounts(result.accounts);
      
      if (result.accounts.length > 0 && !goalFormData.linkedAccountId) {
        setGoalFormData((prev) => ({ ...prev, linkedAccountId: result.accounts[0].id }));
        setTransactionFormData((prev) => ({ ...prev, accountId: result.accounts[0].id }));
      }
    }
  };

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

    const totalDays = Math.ceil((targetDate - startDate) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

    // FIXED: Calculate months remaining properly
    const monthsRemaining = Math.max(1, daysRemaining / 30);
    const monthlyRequired = daysRemaining > 0 ? (targetAmount - currentAmount) / monthsRemaining : 0;

    const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
    const onTrack = percentageComplete >= expectedProgress;

    return {
      percentageComplete: percentageComplete.toFixed(1),
      daysRemaining: Math.max(0, daysRemaining),
      monthsRemaining: Math.max(1, Math.ceil(monthsRemaining)),
      onTrack,
      monthlyRequired: Math.max(0, monthlyRequired).toFixed(0),
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

      if (editingGoal) {
        // Update existing goal
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
        // Create new goal
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
          totalAllocated: currentAmount,
          totalDeallocated: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await addDoc(collection(db, 'users', user.uid, 'financialGoals'), goalData);
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

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (submitting || !selectedGoal) return;

    const amount = parseFloat(transactionFormData.amount);
    if (!amount || amount <= 0) {
      return showToast('Please enter a valid amount', 'error');
    }

    setSubmitting(true);

    try {
      // Update goal (virtual allocation - no actual money movement)
      const newCurrentAmount = selectedGoal.currentAmount + amount;
      const newStatus = newCurrentAmount >= selectedGoal.targetAmount ? 'completed' : 'active';
      const newPercentage = (newCurrentAmount / selectedGoal.targetAmount) * 100;

      await updateDoc(doc(db, 'users', user.uid, 'financialGoals', selectedGoal.id), {
        currentAmount: newCurrentAmount,
        totalAllocated: (selectedGoal.totalAllocated || 0) + amount,
        status: newStatus,
        lastAllocationDate: transactionFormData.date,
        updatedAt: Timestamp.now(),
      });

      // Record allocation history
      await addDoc(collection(db, 'users', user.uid, 'goalTransactions'), {
        goalId: selectedGoal.id,
        type: 'allocate',
        amount,
        date: transactionFormData.date,
        accountId: transactionFormData.accountId,
        description: transactionFormData.description || `Allocated to ${selectedGoal.goalName}`,
        createdAt: Timestamp.now(),
      });

      // Check milestones
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
        showToast('Amount allocated successfully', 'success');
      }

      await loadData();
      closeAllocateModal();
    } catch (error) {
      console.error('Error allocating:', error);
      showToast('Error allocating amount', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeallocate = async (e) => {
    e.preventDefault();
    if (submitting || !selectedGoal) return;

    const amount = parseFloat(transactionFormData.amount);
    if (!amount || amount <= 0) {
      return showToast('Please enter a valid amount', 'error');
    }

    if (amount > selectedGoal.currentAmount) {
      return showToast('Amount exceeds current allocation', 'error');
    }

    setSubmitting(true);

    try {
      // Update goal (virtual deallocation)
      const newCurrentAmount = selectedGoal.currentAmount - amount;

      await updateDoc(doc(db, 'users', user.uid, 'financialGoals', selectedGoal.id), {
        currentAmount: newCurrentAmount,
        totalDeallocated: (selectedGoal.totalDeallocated || 0) + amount,
        updatedAt: Timestamp.now(),
      });

      // Record deallocation history
      await addDoc(collection(db, 'users', user.uid, 'goalTransactions'), {
        goalId: selectedGoal.id,
        type: 'deallocate',
        amount,
        date: transactionFormData.date,
        accountId: transactionFormData.accountId,
        description: transactionFormData.description || `Deallocated from ${selectedGoal.goalName}`,
        createdAt: Timestamp.now(),
      });

      showToast('Amount deallocated successfully', 'success');
      await loadData();
      closeDeallocateModal();
    } catch (error) {
      console.error('Error deallocating:', error);
      showToast('Error deallocating amount', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      // Get all goal transactions
      const transRef = collection(db, 'users', user.uid, 'goalTransactions');
      const q = query(transRef, where('goalId', '==', goalToDelete.id));
      const snapshot = await getDocs(q);

      // Delete all transactions
      for (const transDoc of snapshot.docs) {
        await deleteDoc(transDoc.ref);
      }

      // Delete goal
      await deleteDoc(doc(db, 'users', user.uid, 'financialGoals', goalToDelete.id));

      showToast('Goal deleted successfully', 'success');
      await loadData();
    } catch (error) {
      console.error('Error deleting goal:', error);
      showToast('Error deleting goal', 'error');
    } finally {
      setShowDeleteModal(false);
      setGoalToDelete(null);
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

  const openAllocateModal = (goal) => {
    setSelectedGoal(goal);
    setTransactionFormData({
      amount: goal.monthlyContribution?.toString() || '',
      accountId: goal.linkedAccountId || accounts[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setShowAllocateModal(true);
  };

  const closeAllocateModal = () => {
    setShowAllocateModal(false);
    setSelectedGoal(null);
  };

  const openDeallocateModal = (goal) => {
    setSelectedGoal(goal);
    setTransactionFormData({
      amount: '',
      accountId: goal.linkedAccountId || accounts[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setShowDeallocateModal(true);
  };

  const closeDeallocateModal = () => {
    setShowDeallocateModal(false);
    setSelectedGoal(null);
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

  const totalAllocated = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;

  // Calculate total available in linked accounts
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

const getAvailableBalance = (accountId) => {
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return 0;
  const { allocated } = getAccountAllocations(accountId);
  return Math.max(0, account.balance - allocated);
};

  const accountAllocations = getAccountAllocations();

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-sm text-gray-500 mt-1">Virtual allocation for your savings goals</p>
        </div>
        <button
          onClick={() => openGoalModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
        >
          <Plus size={16} />
          New Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Allocated</p>
            <PiggyBank size={14} className="text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-600">৳{totalAllocated.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Across all goals</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Target</p>
            <Target size={14} className="text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-600">৳{totalTarget.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{((totalAllocated/totalTarget)*100 || 0).toFixed(1)}% achieved</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Active Goals</p>
            <Flag size={14} className="text-orange-600" />
          </div>
          <p className="text-xl font-bold text-orange-600">{activeGoals}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Completed</p>
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-600">{completedGoals}</p>
        </div>
      </div>

      {/* Account Allocations */}
      {Object.keys(accountAllocations).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Account Allocations</h2>
          {Object.entries(accountAllocations).map(([accountId, data]) => {
            if (!data.account) return null;
            
            const available = data.account.balance - data.totalAllocated;
            const allocationPercentage = (data.totalAllocated / data.account.balance) * 100;

            return (
              <div key={accountId} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <PiggyBank size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">{data.account.name}</p>
                      <p className="text-sm text-blue-700">
                        {data.goals.length} goal{data.goals.length !== 1 ? 's' : ''} using this account
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      ৳{data.account.balance.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600">Total Balance</p>
                  </div>
                </div>

                {/* Allocation Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-700">Allocated: ৳{data.totalAllocated.toLocaleString()}</span>
                    <span className="text-green-700">Available: ৳{available.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                      style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Goals Breakdown */}
                <div className="bg-white/70 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-bold text-blue-900 mb-2">Goal Allocations:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.goals.map(goal => {
                      const goalPercent = (goal.currentAmount / goal.targetAmount) * 100;
                      return (
                        <div key={goal.id} className="bg-white rounded-lg p-2 border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{categoryIcons[goal.category]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{goal.goalName}</p>
                              <p className="text-xs text-gray-600">
                                ৳{goal.currentAmount.toLocaleString()} / ৳{goal.targetAmount.toLocaleString()}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-blue-600">{goalPercent.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full bg-gradient-to-r ${categoryColors[goal.category]}`}
                              style={{ width: `${Math.min(goalPercent, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex gap-2">
          {['all', 'active', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition ${
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
                className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-12 h-12 bg-gradient-to-br ${categoryColor} rounded-xl flex items-center justify-center text-2xl shadow-sm`}>
                      {categoryIcon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{goal.goalName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[goal.priority]}`}>
                          {goal.priority.toUpperCase()}
                        </span>
                        {goal.status === 'completed' && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{goal.description || `Target by ${formatDate(goal.targetDate)}`}</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {goal.status === 'active' && (
                      <>
                        <button
                          onClick={() => openAllocateModal(goal)}
                          className="p-2 hover:bg-green-50 rounded-lg"
                          title="Allocate"
                        >
                          <ArrowUpCircle size={18} className="text-green-600" />
                        </button>
                        <button
                          onClick={() => openDeallocateModal(goal)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          title="Deallocate"
                        >
                          <ArrowDownCircle size={18} className="text-red-600" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/goals/${goal.id}`)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="View Details"
                    >
                      <Eye size={18} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => openGoalModal(goal)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 size={18} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        setGoalToDelete(goal);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">
                      ৳{goal.currentAmount.toLocaleString()} / ৳{goal.targetAmount.toLocaleString()}
                    </span>
                    <span className="font-medium text-gray-900">{metrics.percentageComplete}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all bg-gradient-to-r ${categoryColor}`}
                      style={{ width: `${Math.min(metrics.percentageComplete, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Target Date</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(goal.targetDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Days Left</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Clock size={14} />
                      {metrics.daysRemaining} days
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Need</p>
                    <p className="font-semibold text-blue-600">৳{metrics.monthlyRequired}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className={`font-semibold flex items-center gap-1 ${metrics.onTrack ? 'text-green-600' : 'text-orange-600'}`}>
                      {metrics.onTrack ? (
                        <>
                          <CheckCircle2 size={14} /> On Track
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} /> Behind
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                </h2>
                <button onClick={closeGoalModal} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleGoalSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  <strong>Virtual Goals:</strong> Money stays in your account. Goals just track how much you've mentally allocated.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (৳) *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Amount (৳)</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Contribution (৳)</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Linked Account *
                  </label>
                  <select
                    value={goalFormData.linkedAccountId}
                    onChange={(e) => setGoalFormData((p) => ({ ...p, linkedAccountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    disabled={submitting}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (৳{a.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <PiggyBank size={12} />
                    This is where your money physically stays
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
                <label htmlFor="enableNotifications" className="text-sm text-gray-700">
                  Enable milestone notifications
                </label>
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2 border-t border-gray-100 -mx-6 px-6 mt-6">
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

      {/* Allocate Modal */}
      {showAllocateModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Allocate to Goal</h2>
              <button onClick={closeAllocateModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800 mb-2">
                <strong>Virtual Allocation:</strong> This just marks money for this goal. Money stays in your account.
              </p>
              <p className="text-sm font-medium text-blue-900">{selectedGoal.goalName}</p>
              <p className="text-xs text-blue-700">
                Current: ৳{selectedGoal.currentAmount.toLocaleString()} / ৳{selectedGoal.targetAmount.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleAllocate} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
                <select
                  value={transactionFormData.accountId}
                  onChange={(e) => setTransactionFormData((p) => ({ ...p, accountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  required
                  disabled={submitting}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (৳{a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <ArrowUpCircle size={12} />
                  Money stays in this account (virtual allocation only)
                </p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
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
                  onClick={closeAllocateModal}
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
                      <span>Allocating...</span>
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

      {/* Deallocate Modal */}
      {showDeallocateModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Deallocate from Goal</h2>
              <button onClick={closeDeallocateModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{selectedGoal.goalName}</p>
              <p className="text-xs text-gray-600">
                Allocated: ৳{selectedGoal.currentAmount.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleDeallocate} className="space-y-4">
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
                    Remaining: ৳{(selectedGoal.currentAmount - parseFloat(transactionFormData.amount || 0)).toLocaleString()}
                  </p>
                )}
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
                  placeholder="Emergency..."
                  disabled={submitting}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  ⚠️ This will reduce your goal allocation (money stays in account)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDeallocateModal}
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
                    <span>Deallocate</span>
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
                This will permanently delete "{goalToDelete.goalName}" and all allocation history.
              </p>
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-4">
                Note: Your money will remain in your account (it was virtual allocation only)
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setGoalToDelete(null);
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