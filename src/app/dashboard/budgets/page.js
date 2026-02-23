// src/app/dashboard/budgets/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  getBudgetsForMonth,
  addBudget,
  updateBudget
} from '@/lib/budgetCollections';
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Save,
  ChevronRight,
  Info
} from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function BudgetsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [previousMonthBudgets, setPreviousMonthBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Always use current month
  const currentDate = new Date();
  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1;
  
  // Budget inputs for each category
  const [budgetInputs, setBudgetInputs] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadCategories(),
      loadBudgets(),
      loadPreviousMonthBudgets(),
      loadTransactions()
    ]);
    setLoading(false);
  };

  const loadCategories = async () => {
    try {
      const ref = collection(db, 'users', user.uid, 'categories');
      const q = query(ref, where('type', '==', 'Expense'));
      const snap = await getDocs(q);
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(cats.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBudgets = async () => {
    const result = await getBudgetsForMonth(user.uid, selectedYear, selectedMonth);
    if (result.success) {
      setBudgets(result.budgets);
      
      // Initialize budget inputs from existing budgets
      const inputs = {};
      result.budgets.forEach(budget => {
        inputs[budget.categoryId] = budget.amount.toString();
      });
      setBudgetInputs(inputs);
      setHasUnsavedChanges(false);
    }
  };

  const loadPreviousMonthBudgets = async () => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    
    const result = await getBudgetsForMonth(user.uid, prevYear, prevMonth);
    if (result.success) {
      setPreviousMonthBudgets(result.budgets);
      
      // Auto-fill from previous month if current month has no budgets
      if (budgets.length === 0 && result.budgets.length > 0) {
        const inputs = {};
        result.budgets.forEach(budget => {
          inputs[budget.categoryId] = budget.amount.toString();
        });
        setBudgetInputs(inputs);
      }
    }
  };

  const loadTransactions = async () => {
    try {
      const ref = collection(db, 'users', user.uid, 'transactions');
      const snap = await getDocs(ref);
      const allTransactions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter for current month (exclude transfers, goals, lending, loans)
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      const filtered = allTransactions.filter(t => 
        t.type === 'Expense' &&
        t.date >= startDate &&
        t.date <= endDate &&
        !t.isTransfer &&
        !t.collectionType &&
        !t.source &&
        !t.goalId &&
        !t.lendingId &&
        !t.loanId
      );
      
      setTransactions(filtered);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const calculateSpent = (categoryId) => {
    return transactions
      .filter(t => t.categoryId === categoryId)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  const handleInputChange = (categoryId, value) => {
    setBudgetInputs(prev => ({
      ...prev,
      [categoryId]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const updates = [];
      const nextMonthBudgets = [];

      // Calculate next month
      const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;

      for (const category of categories) {
        const inputValue = budgetInputs[category.id];
        const amount = parseFloat(inputValue);

        // Skip if no input or invalid
        if (!inputValue || isNaN(amount) || amount <= 0) {
          continue;
        }

        // Check if budget already exists for this category (current month)
        const existingBudget = budgets.find(b => b.categoryId === category.id);

        const budgetData = {
          categoryId: category.id,
          categoryName: category.name,
          amount: amount,
          year: selectedYear,
          month: selectedMonth,
          rollover: false,
          notes: ''
        };

        if (existingBudget) {
          // Update existing
          updates.push(updateBudget(user.uid, existingBudget.id, budgetData));
        } else {
          // Create new
          updates.push(addBudget(user.uid, budgetData));
        }

        // Prepare next month's budget (carry forward)
        nextMonthBudgets.push({
          categoryId: category.id,
          categoryName: category.name,
          amount: amount,
          year: nextYear,
          month: nextMonth
        });
      }

      if (updates.length === 0) {
        showToast('No budgets to save', 'info');
        setSaving(false);
        return;
      }

      // Save current month budgets
      await Promise.all(updates);

      // Now carry forward to next month
      const nextMonthResult = await getBudgetsForMonth(user.uid, nextYear, nextMonth);
      const existingNextMonthBudgets = nextMonthResult.success ? nextMonthResult.budgets : [];

      const carryForwardUpdates = [];
      for (const nextBudget of nextMonthBudgets) {
        // Check if next month already has a budget for this category
        const existingNextBudget = existingNextMonthBudgets.find(b => b.categoryId === nextBudget.categoryId);

        if (existingNextBudget) {
          // Update next month's budget with new amount
          carryForwardUpdates.push(
            updateBudget(user.uid, existingNextBudget.id, nextBudget)
          );
        } else {
          // Create new budget for next month
          carryForwardUpdates.push(
            addBudget(user.uid, nextBudget)
          );
        }
      }

      // Execute carry forward
      if (carryForwardUpdates.length > 0) {
        await Promise.all(carryForwardUpdates);
      }
      
      showToast(`${updates.length} budget(s) saved and carried forward to next month`, 'success');
      setHasUnsavedChanges(false);
      await loadBudgets();
    } catch (error) {
      console.error('Error saving budgets:', error);
      showToast('Failed to save budgets', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    router.push(`/dashboard/budgets/${categoryId}`);
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 100) return { Icon: AlertCircle, color: 'text-red-600' };
    if (percentage >= 80) return { Icon: AlertCircle, color: 'text-yellow-600' };
    return { Icon: CheckCircle, color: 'text-green-600' };
  };

  // Calculate totals
  const totalBudget = categories.reduce((sum, cat) => {
    const amount = parseFloat(budgetInputs[cat.id]) || 0;
    return sum + amount;
  }, 0);

  const totalSpent = categories.reduce((sum, cat) => {
    return sum + calculateSpent(cat.id);
  }, 0);

  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <PiggyBank className="w-7 h-7" />
              Budget Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {getMonthName(selectedMonth)} {selectedYear} - Set your monthly budgets
            </p>
          </div>
          
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 shadow-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save All Budgets
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      {budgets.length === 0 && previousMonthBudgets.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Budgets auto-filled from last month
              </p>
              <p className="text-xs text-blue-700">
                Your previous budgets have been carried forward. Adjust any amounts and save. 
                Changes will automatically apply to future months.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Carry Forward Info */}
      {budgets.length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 mb-1">
                Auto Carry-Forward Active
              </p>
              <p className="text-xs text-green-700">
                Your budgets automatically continue each month. Update any amount here and it will apply to all future months.
                Click any category to see monthly history.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {getMonthName(selectedMonth)} {selectedYear} Summary
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Budget</p>
            <p className="text-xl font-bold text-gray-900">৳{totalBudget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Spent</p>
            <p className="text-xl font-bold text-red-600">৳{totalSpent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Remaining</p>
            <p className={`text-xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ৳{totalRemaining.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Used</p>
            <p className="text-xl font-bold text-gray-900">{overallPercentage.toFixed(0)}%</p>
          </div>
        </div>

        {totalBudget > 0 && (
          <div className="relative">
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${getProgressColor(overallPercentage)}`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-gray-200">
          {categories.map((category) => {
            const budgetAmount = parseFloat(budgetInputs[category.id]) || 0;
            const spent = calculateSpent(category.id);
            const remaining = budgetAmount - spent;
            const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
            const status = getStatusIcon(percentage);
            const StatusIcon = status.Icon;

            return (
              <div
                key={category.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={(e) => {
                  // Don't navigate if clicking on input
                  if (e.target.tagName !== 'INPUT') {
                    handleCategoryClick(category.id);
                  }
                }}
              >
                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center gap-4">
                  {/* Category Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {category.name}
                      </h3>
                    </div>
                  </div>

                  {/* Budget Input */}
                  <div className="w-32 sm:w-40">
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-xs text-gray-500">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        value={budgetInputs[category.id] || ''}
                        onChange={(e) => handleInputChange(category.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Progress */}
                  {budgetAmount > 0 && (
                    <div className="w-32 lg:w-48">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-600">
                          ৳{spent.toLocaleString()}
                        </span>
                        <StatusIcon className={`w-3 h-3 ${status.color}`} />
                      </div>
                      <div className="relative mb-1">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${getProgressColor(percentage)}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{percentage.toFixed(0)}% used</p>
                    </div>
                  )}

                  {/* Remaining */}
                  <div className="w-24 text-right">
                    {budgetAmount > 0 ? (
                      <p className={`text-sm font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ৳{remaining.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">No budget</p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>

                {/* Mobile Layout */}
                <div className="sm:hidden">
                  {/* Category Name and Input */}
                  <div className="flex items-center gap-3 mb-3">
                    {/* Category */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {category.name}
                        </h3>
                      </div>
                    </div>

                    {/* Budget Input */}
                    <div className="w-28">
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-xs text-gray-500">৳</span>
                        <input
                          type="number"
                          step="0.01"
                          value={budgetInputs[category.id] || ''}
                          onChange={(e) => handleInputChange(category.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>

                  {/* Progress Bar (Below category name) */}
                  {budgetAmount > 0 && (
                    <div className="pl-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-600">
                          ৳{spent.toLocaleString()} / ৳{budgetAmount.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <StatusIcon className={`w-3 h-3 ${status.color}`} />
                          <span className="text-xs font-medium text-gray-600">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${getProgressColor(percentage)}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className={`text-xs mt-1 ${remaining >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                        Remaining: ৳{remaining.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* No Budget Message */}
                  {budgetAmount === 0 && (
                    <div className="pl-5">
                      <p className="text-xs text-gray-400 italic">No budget set</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button at Bottom */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-20 sm:bottom-6 left-0 right-0 px-4 sm:px-0 sm:max-w-6xl sm:mx-auto z-10">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full sm:w-auto sm:float-right px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 shadow-2xl flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Saving Budgets...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All Budgets
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

