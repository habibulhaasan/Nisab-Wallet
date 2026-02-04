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
  getDoc,
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
  Award,
  Heart,
  Home,
  Car,
  GraduationCap,
  Building2,
  Package,
  PiggyBank,
  Clock,
} from 'lucide-react';

export default function FinancialGoalsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [sharedSavingsAccountId, setSharedSavingsAccountId] = useState(null);

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
    await Promise.all([loadGoals(), loadAccounts(), loadCategories()]);
    await ensureSharedSavingsAccount();
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
      
      // Find shared savings account
      const sharedSavings = result.accounts.find(a => a.name === 'Goals Savings' && a.isSharedGoalAccount);
      if (sharedSavings) {
        setSharedSavingsAccountId(sharedSavings.id);
      }
      
      if (result.accounts.length > 0 && !goalFormData.linkedAccountId) {
        const regularAccounts = result.accounts.filter(a => !a.isSharedGoalAccount && !a.isGoalAccount);
        setGoalFormData((prev) => ({ ...prev, linkedAccountId: regularAccounts[0]?.id || '' }));
        setTransactionFormData((prev) => ({ ...prev, accountId: regularAccounts[0]?.id || '' }));
      }
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      const snapshot = await getDocs(categoriesRef);
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Ensure shared savings account exists
  const ensureSharedSavingsAccount = async () => {
    try {
      // Check if shared savings account already exists
      const accountsRef = collection(db, 'users', user.uid, 'accounts');
      const q = query(accountsRef, where('isSharedGoalAccount', '==', true));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setSharedSavingsAccountId(snapshot.docs[0].id);
        return snapshot.docs[0].id;
      }

      // Create shared savings account
      const newAccount = {
        name: 'Goals Savings',
        type: 'Savings',
        balance: 0,
        currency: 'BDT',
        isSharedGoalAccount: true,
        description: 'Shared savings account for all financial goals',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'accounts'), newAccount);
      setSharedSavingsAccountId(docRef.id);
      await loadAccounts();
      return docRef.id;
    } catch (error) {
      console.error('Error ensuring shared savings account:', error);
      return null;
    }
  };

  // Auto-create category if it doesn't exist
  const ensureCategory = async (name, type) => {
    let category = categories.find((c) => c.name === name && c.type === type);
    if (!category) {
      const newCategory = {
        name,
        type,
        icon: name === 'Savings' ? '💰' : name === 'Redemption' ? '🎁' : '📦',
        color: name === 'Savings' ? '#10B981' : name === 'Redemption' ? '#3B82F6' : '#6B7280',
        createdAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'categories'), newCategory);
      category = { id: docRef.id, ...newCategory };
      setCategories((prev) => [...prev, category]);
    }
    return category.id;
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

    const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
    const onTrack = percentageComplete >= expectedProgress;

    const monthlyRequired = daysRemaining > 0 ? (targetAmount - currentAmount) / (daysRemaining / 30) : 0;

    return {
      percentageComplete: percentageComplete.toFixed(1),
      daysRemaining: Math.max(0, daysRemaining),
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

      // Ensure shared savings account exists
      const savingsAccId = await ensureSharedSavingsAccount();

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
          totalDeposited: currentAmount,
          totalWithdrawn: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await addDoc(collection(db, 'users', user.uid, 'financialGoals'), goalData);

        // If there's initial amount, create initial deposit
        if (currentAmount > 0) {
          const savingsCategoryId = await ensureCategory('Savings', 'Expense');
          const linkedAccount = accounts.find((a) => a.id === goalFormData.linkedAccountId);
          const savingsAccount = accounts.find((a) => a.id === savingsAccId);

          if (linkedAccount && linkedAccount.balance >= currentAmount) {
            // Deduct from linked account
            await updateDoc(doc(db, 'users', user.uid, 'accounts', goalFormData.linkedAccountId), {
              balance: linkedAccount.balance - currentAmount,
              updatedAt: Timestamp.now(),
            });

            // Add to shared savings account
            await updateDoc(doc(db, 'users', user.uid, 'accounts', savingsAccId), {
              balance: (savingsAccount?.balance || 0) + currentAmount,
              updatedAt: Timestamp.now(),
            });

            // Create expense transaction
            await addDoc(collection(db, 'users', user.uid, 'transactions'), {
              type: 'Expense',
              amount: currentAmount,
              accountId: goalFormData.linkedAccountId,
              categoryId: savingsCategoryId,
              description: `Savings: ${goalFormData.goalName}`,
              date: new Date().toISOString().split('T')[0],
              createdAt: Timestamp.now(),
            });

            // Create income transaction to savings account
            await addDoc(collection(db, 'users', user.uid, 'transactions'), {
              type: 'Income',
              amount: currentAmount,
              accountId: savingsAccId,
              categoryId: savingsCategoryId,
              description: `Savings: ${goalFormData.goalName}`,
              date: new Date().toISOString().split('T')[0],
              createdAt: Timestamp.now(),
            });
          }
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

    const linkedAccount = accounts.find((a) => a.id === transactionFormData.accountId);
    if (!linkedAccount || linkedAccount.balance < amount) {
      return showToast('Insufficient account balance', 'error');
    }

    setSubmitting(true);

    try {
      const savingsAccId = await ensureSharedSavingsAccount();
      const savingsCategoryId = await ensureCategory('Savings', 'Expense');
      const savingsAccount = accounts.find((a) => a.id === savingsAccId);

      // 1. Deduct from linked account
      await updateDoc(doc(db, 'users', user.uid, 'accounts', transactionFormData.accountId), {
        balance: linkedAccount.balance - amount,
        updatedAt: Timestamp.now(),
      });

      // 2. Add to shared savings account
      await updateDoc(doc(db, 'users', user.uid, 'accounts', savingsAccId), {
        balance: (savingsAccount?.balance || 0) + amount,
        updatedAt: Timestamp.now(),
      });

      // 3. Update goal
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

      // 4. Create expense transaction (from linked account)
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type: 'Expense',
        amount,
        accountId: transactionFormData.accountId,
        categoryId: savingsCategoryId,
        description: transactionFormData.description || `Savings: ${selectedGoal.goalName}`,
        date: transactionFormData.date,
        createdAt: Timestamp.now(),
      });

      // 5. Create income transaction (to savings account)
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type: 'Income',
        amount,
        accountId: savingsAccId,
        categoryId: savingsCategoryId,
        description: transactionFormData.description || `Savings: ${selectedGoal.goalName}`,
        date: transactionFormData.date,
        createdAt: Timestamp.now(),
      });

      // 6. Record goal transaction
      await addDoc(collection(db, 'users', user.uid, 'goalTransactions'), {
        goalId: selectedGoal.id,
        type: 'deposit',
        amount,
        date: transactionFormData.date,
        accountId: transactionFormData.accountId,
        description: transactionFormData.description || 'Deposit',
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
        showToast('Deposit recorded successfully', 'success');
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
      return showToast('Amount exceeds current goal balance', 'error');
    }

    setSubmitting(true);

    try {
      const savingsAccId = await ensureSharedSavingsAccount();
      const redemptionCategoryId = await ensureCategory('Redemption', 'Income');
      const savingsAccount = accounts.find((a) => a.id === savingsAccId);

      // 1. Deduct from shared savings account
      await updateDoc(doc(db, 'users', user.uid, 'accounts', savingsAccId), {
        balance: (savingsAccount?.balance || 0) - amount,
        updatedAt: Timestamp.now(),
      });

      // 2. Add to linked account
      const linkedAccount = accounts.find((a) => a.id === transactionFormData.accountId);
      await updateDoc(doc(db, 'users', user.uid, 'accounts', transactionFormData.accountId), {
        balance: linkedAccount.balance + amount,
        updatedAt: Timestamp.now(),
      });

      // 3. Update goal
      const newCurrentAmount = selectedGoal.currentAmount - amount;

      await updateDoc(doc(db, 'users', user.uid, 'financialGoals', selectedGoal.id), {
        currentAmount: newCurrentAmount,
        totalWithdrawn: (selectedGoal.totalWithdrawn || 0) + amount,
        updatedAt: Timestamp.now(),
      });

      // 4. Create expense transaction (from savings account)
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type: 'Expense',
        amount,
        accountId: savingsAccId,
        categoryId: redemptionCategoryId,
        description: transactionFormData.description || `Redemption: ${selectedGoal.goalName}`,
        date: transactionFormData.date,
        createdAt: Timestamp.now(),
      });

      // 5. Create income transaction (to linked account)
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type: 'Income',
        amount,
        accountId: transactionFormData.accountId,
        categoryId: redemptionCategoryId,
        description: transactionFormData.description || `Redemption: ${selectedGoal.goalName}`,
        date: transactionFormData.date,
        createdAt: Timestamp.now(),
      });

      // 6. Record goal transaction
      await addDoc(collection(db, 'users', user.uid, 'goalTransactions'), {
        goalId: selectedGoal.id,
        type: 'withdrawal',
        amount,
        date: transactionFormData.date,
        accountId: transactionFormData.accountId,
        description: transactionFormData.description || 'Withdrawal',
        createdAt: Timestamp.now(),
      });

      showToast('Withdrawal recorded successfully', 'success');
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
      
      const deposits = snapshot.docs.filter(d => d.data().type === 'deposit');
      const withdrawals = snapshot.docs.filter(d => d.data().type === 'withdrawal');
      
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
      const savingsAccId = await ensureSharedSavingsAccount();
      
      // Get all goal transactions
      const transRef = collection(db, 'users', user.uid, 'goalTransactions');
      const q = query(transRef, where('goalId', '==', goalToDelete.id));
      const snapshot = await getDocs(q);

      // Reverse all transactions
      for (const transDoc of snapshot.docs) {
        const trans = transDoc.data();
        
        if (trans.type === 'deposit') {
          // Return money from savings account to linked account
          const linkedAccount = accounts.find(a => a.id === trans.accountId);
          const savingsAccount = accounts.find(a => a.id === savingsAccId);

          if (linkedAccount) {
            await updateDoc(doc(db, 'users', user.uid, 'accounts', trans.accountId), {
              balance: linkedAccount.balance + trans.amount,
              updatedAt: Timestamp.now(),
            });
          }

          if (savingsAccount) {
            await updateDoc(doc(db, 'users', user.uid, 'accounts', savingsAccId), {
              balance: Math.max(0, (savingsAccount?.balance || 0) - trans.amount),
              updatedAt: Timestamp.now(),
            });
          }
        } else if (trans.type === 'withdrawal') {
          // Return money to savings account from linked account
          const linkedAccount = accounts.find(a => a.id === trans.accountId);
          const savingsAccount = accounts.find(a => a.id === savingsAccId);

          if (linkedAccount) {
            await updateDoc(doc(db, 'users', user.uid, 'accounts', trans.accountId), {
              balance: Math.max(0, linkedAccount.balance - trans.amount),
              updatedAt: Timestamp.now(),
            });
          }

          if (savingsAccount) {
            await updateDoc(doc(db, 'users', user.uid, 'accounts', savingsAccId), {
              balance: (savingsAccount?.balance || 0) + trans.amount,
              updatedAt: Timestamp.now(),
            });
          }
        }

        // Delete transaction
        await deleteDoc(transDoc.ref);
      }

      // Delete associated main transactions
      const mainTransRef = collection(db, 'users', user.uid, 'transactions');
      const mainTransSnapshot = await getDocs(mainTransRef);
      for (const doc of mainTransSnapshot.docs) {
        const trans = doc.data();
        if (trans.description && trans.description.includes(goalToDelete.goalName)) {
          await deleteDoc(doc.ref);
        }
      }

      // Delete goal
      await deleteDoc(doc(db, 'users', user.uid, 'financialGoals', goalToDelete.id));

      showToast('Goal deleted and all transactions reversed', 'success');
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
        linkedAccountId: goal.linkedAccountId || goal.accountId || accounts.filter(a => !a.isSharedGoalAccount && !a.isGoalAccount)[0]?.id || '',
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
        linkedAccountId: accounts.filter(a => !a.isSharedGoalAccount && !a.isGoalAccount)[0]?.id || '',
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
      accountId: goal.linkedAccountId || goal.accountId || accounts.filter(a => !a.isSharedGoalAccount && !a.isGoalAccount)[0]?.id || '',
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
      accountId: goal.linkedAccountId || goal.accountId || accounts.filter(a => !a.isSharedGoalAccount && !a.isGoalAccount)[0]?.id || '',
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

  const totalSaved = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;

  const regularAccounts = accounts.filter(a => !a.isSharedGoalAccount && !a.isGoalAccount);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-sm text-gray-500 mt-1">Save for what matters most</p>
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
            <p className="text-xs font-medium text-gray-500 uppercase">Total Saved</p>
            <PiggyBank size={14} className="text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-600">৳{totalSaved.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">In Goals Savings</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Target</p>
            <Target size={14} className="text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-600">৳{totalTarget.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{((totalSaved/totalTarget)*100).toFixed(1)}% achieved</p>
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

      {/* Shared Savings Account Info */}
      {sharedSavingsAccountId && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
              <PiggyBank size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-emerald-900">Goals Savings Account</p>
              <p className="text-sm text-emerald-700">
                All goals save to this shared account
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">
                ৳{(accounts.find(a => a.id === sharedSavingsAccountId)?.balance || 0).toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600">{goals.length} goals</p>
            </div>
          </div>
          
          {/* Goals Breakdown */}
          {goals.length > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-200">
              <p className="text-xs font-medium text-emerald-800 mb-2">Breakdown:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {goals.slice(0, 6).map(goal => (
                  <div key={goal.id} className="flex items-center gap-2 text-xs">
                    <span className="text-base">{categoryIcons[goal.category]}</span>
                    <span className="text-emerald-700 truncate flex-1">{goal.goalName}</span>
                    <span className="font-medium text-emerald-900">৳{goal.currentAmount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {goals.length > 6 && (
                <p className="text-xs text-emerald-600 mt-2">+ {goals.length - 6} more goals</p>
              )}
            </div>
          )}
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
                      <p className="text-sm text-gray-600">{goal.description || `Target by ${new Date(goal.targetDate).toLocaleDateString()}`}</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {goal.status === 'active' && (
                      <>
                        <button
                          onClick={() => openDepositModal(goal)}
                          className="p-2 hover:bg-green-50 rounded-lg"
                          title="Deposit"
                        >
                          <ArrowUpCircle size={18} className="text-green-600" />
                        </button>
                        <button
                          onClick={() => openWithdrawModal(goal)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          title="Withdraw"
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
                      onClick={() => openDeleteModal(goal)}
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
                    <p className="text-xs text-gray-500">Days Remaining</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Clock size={14} />
                      {metrics.daysRemaining} days
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Target</p>
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
                  <div>
                    <p className="text-xs text-gray-500">Linked Account</p>
                    <p className="font-semibold text-gray-900 truncate">{getAccountName(goal.linkedAccountId)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Goal Modal - KEEPING SAME AS BEFORE */}
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
                    Linked Account (for deposits/withdrawals) *
                  </label>
                  <select
                    value={goalFormData.linkedAccountId}
                    onChange={(e) => setGoalFormData((p) => ({ ...p, linkedAccountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    disabled={submitting}
                  >
                    {regularAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (৳{a.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <PiggyBank size={12} />
                    Money will be saved in the shared "Goals Savings" account
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

      {/* Deposit Modal */}
      {showDepositModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Make Deposit</h2>
              <button onClick={closeDepositModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{selectedGoal.goalName}</p>
              <p className="text-xs text-gray-600">
                Current: ৳{selectedGoal.currentAmount.toLocaleString()} / ৳{selectedGoal.targetAmount.toLocaleString()}
              </p>
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
                    New balance: ৳{(selectedGoal.currentAmount + parseFloat(transactionFormData.amount || 0)).toLocaleString()}
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
                  {regularAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (৳{a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <ArrowUpCircle size={12} />
                  Will be saved to "Goals Savings" account
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
                    <span>Deposit</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Withdraw</h2>
              <button onClick={closeWithdrawModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{selectedGoal.goalName}</p>
              <p className="text-xs text-gray-600">
                Available: ৳{selectedGoal.currentAmount.toLocaleString()}
              </p>
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
                    Remaining: ৳{(selectedGoal.currentAmount - parseFloat(transactionFormData.amount || 0)).toLocaleString()}
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
                  {regularAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (৳{a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <ArrowDownCircle size={12} />
                  Will be withdrawn from "Goals Savings" account
                </p>
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
                  ⚠️ Withdrawing will reduce your goal progress
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
                    <span>Withdraw</span>
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
                This will permanently delete "{goalToDelete.goalName}" and reverse all transactions.
              </p>
              
              {deleteImpact && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                  <p className="text-sm font-medium text-red-900 mb-2">Impact:</p>
                  <ul className="text-xs text-red-800 space-y-1">
                    <li>• {deleteImpact.transactionCount} transactions will be deleted</li>
                    <li>• {deleteImpact.deposits} deposits reversed (৳{deleteImpact.totalDeposits.toLocaleString()})</li>
                    <li>• {deleteImpact.withdrawals} withdrawals reversed (৳{deleteImpact.totalWithdrawals.toLocaleString()})</li>
                    <li>• Net balance (৳{deleteImpact.netAmount.toLocaleString()}) will be returned</li>
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
                  Delete & Reverse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}