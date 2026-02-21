// src/app/dashboard/budgets/[categoryId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getBudgets } from '@/lib/budgetCollections';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

export default function BudgetCategoryDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const categoryId = params?.categoryId;

  const [category, setCategory] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && categoryId) {
      loadData();
    }
  }, [user, categoryId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadCategory(),
      loadMonthlyData()
    ]);
    setLoading(false);
  };

  const loadCategory = async () => {
    try {
      const docRef = doc(db, 'users', user.uid, 'categories', categoryId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setCategory({ id: docSnap.id, ...docSnap.data() });
      } else {
        router.push('/dashboard/budgets');
      }
    } catch (error) {
      console.error('Error loading category:', error);
    }
  };

  const loadMonthlyData = async () => {
    try {
      // Get all budgets for this category
      const budgetResult = await getBudgets(user.uid);
      const categoryBudgets = budgetResult.success 
        ? budgetResult.budgets.filter(b => b.categoryId === categoryId)
        : [];

      // Get all transactions for this category
      const transRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(transRef, where('categoryId', '==', categoryId), where('type', '==', 'Expense'));
      const transSnap = await getDocs(q);
      const categoryTransactions = transSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter out transfers, goals, lending, loans
      const realTransactions = categoryTransactions.filter(t => 
        !t.isTransfer &&
        !t.collectionType &&
        !t.source &&
        !t.goalId &&
        !t.lendingId &&
        !t.loanId
      );

      // Get last 12 months
      const months = [];
      const today = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        // Find budget for this month
        const budget = categoryBudgets.find(b => b.year === year && b.month === month);
        const budgetAmount = budget ? budget.amount : 0;

        // Calculate spending for this month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const monthTransactions = realTransactions.filter(t => 
          t.date >= startDate && t.date <= endDate
        );

        const spent = monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const remaining = budgetAmount - spent;
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

        months.push({
          year,
          month,
          monthName: date.toLocaleString('default', { month: 'short' }),
          budget: budgetAmount,
          spent,
          remaining,
          percentage,
          transactionCount: monthTransactions.length
        });
      }

      setMonthlyData(months);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 100) return { Icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' };
    if (percentage >= 80) return { Icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
  };

  // Calculate overall stats
  const totalBudget = monthlyData.reduce((sum, m) => sum + m.budget, 0);
  const totalSpent = monthlyData.reduce((sum, m) => sum + m.spent, 0);
  const avgMonthlyBudget = monthlyData.length > 0 ? totalBudget / monthlyData.length : 0;
  const avgMonthlySpent = monthlyData.length > 0 ? totalSpent / monthlyData.length : 0;

  // Find highest and lowest spending months
  const monthsWithBudget = monthlyData.filter(m => m.budget > 0);
  const highestSpending = monthsWithBudget.length > 0 
    ? monthsWithBudget.reduce((max, m) => m.spent > max.spent ? m : max, monthsWithBudget[0])
    : null;
  const lowestSpending = monthsWithBudget.length > 0
    ? monthsWithBudget.reduce((min, m) => m.spent < min.spent ? m : min, monthsWithBudget[0])
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Category not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/budgets')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Budgets
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: category.color }}
            >
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-sm text-gray-500">Budget history (Last 12 months)</p>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Total Budget</p>
              <p className="text-lg font-bold text-gray-900">৳{totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Total Spent</p>
              <p className="text-lg font-bold text-red-600">৳{totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Avg Budget</p>
              <p className="text-lg font-bold text-blue-600">৳{avgMonthlyBudget.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Avg Spent</p>
              <p className="text-lg font-bold text-purple-600">৳{avgMonthlySpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {highestSpending && lowestSpending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 mb-1">Highest Spending</p>
                <p className="text-xs text-red-700">
                  {highestSpending.monthName} {highestSpending.year}: ৳{highestSpending.spent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 mb-1">Lowest Spending</p>
                <p className="text-xs text-green-700">
                  {lowestSpending.monthName} {lowestSpending.year}: ৳{lowestSpending.spent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly History */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly History
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {monthlyData.map((monthData, index) => {
            const status = getStatusIcon(monthData.percentage);
            const StatusIcon = status.Icon;
            const isCurrentMonth = index === monthlyData.length - 1;

            return (
              <div
                key={`${monthData.year}-${monthData.month}`}
                className={`p-4 ${isCurrentMonth ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Month */}
                  <div className="flex-shrink-0 sm:w-24">
                    <p className="text-sm font-semibold text-gray-900">
                      {monthData.monthName} {monthData.year}
                    </p>
                    {isCurrentMonth && (
                      <span className="inline-block text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full mt-1">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex-1 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Budget</p>
                      <p className="font-semibold text-gray-900">
                        {monthData.budget > 0 ? `৳${monthData.budget.toLocaleString()}` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Spent</p>
                      <p className="font-semibold text-red-600">
                        ৳{monthData.spent.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {monthData.transactionCount} transactions
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Remaining</p>
                      <p className={`font-semibold ${monthData.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {monthData.budget > 0 ? `৳${monthData.remaining.toLocaleString()}` : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {monthData.budget > 0 && (
                    <div className="sm:w-48">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        <span className="text-xs text-gray-600">
                          {monthData.percentage.toFixed(0)}% used
                        </span>
                      </div>
                      <div className="relative">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${getProgressColor(monthData.percentage)}`}
                            style={{ width: `${Math.min(monthData.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Budget Indicator */}
                  {monthData.budget === 0 && (
                    <div className="sm:w-48">
                      <span className="text-xs text-gray-400 italic">No budget set</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {monthlyData.every(m => m.budget === 0 && m.spent === 0) && (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No budget history yet
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Start by setting a budget for this category
          </p>
          <button
            onClick={() => router.push('/dashboard/budgets')}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Budgets
          </button>
        </div>
      )}
    </div>
  );
}