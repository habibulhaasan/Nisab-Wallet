// src/app/dashboard/analytics/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign, PieChart as PieIcon, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadTransactions(),
      loadCategories(),
    ]);
    setLoading(false);
  };

  const loadTransactions = async () => {
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const querySnapshot = await getDocs(transactionsRef);
      const trans = [];
      querySnapshot.forEach((doc) => {
        trans.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(trans);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      const querySnapshot = await getDocs(categoriesRef);
      const cats = [];
      querySnapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() });
      });
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Filter transactions based on time range
  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate;

    if (timeRange === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (timeRange === 'custom' && customStartDate && customEndDate) {
      return transactions.filter(t => t.date >= customStartDate && t.date <= customEndDate);
    }

    if (startDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      return transactions.filter(t => t.date >= startDateStr);
    }

    return transactions;
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate summary stats
  const totalIncome = filteredTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Category breakdown for pie chart
  const getCategoryData = (type) => {
    const categoryTotals = {};
    
    filteredTransactions
      .filter(t => t.type === type)
      .forEach(t => {
        const category = categories.find(c => c.id === t.categoryId);
        const categoryName = category ? category.name : 'Unknown';
        
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = 0;
        }
        categoryTotals[categoryName] += t.amount;
      });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const expenseCategoryData = getCategoryData('Expense');
  const incomeCategoryData = getCategoryData('Income');

  // Monthly trend data
  const getMonthlyTrend = () => {
    const monthlyData = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }
      
      if (t.type === 'Income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const monthlyTrendData = getMonthlyTrend();

  // Weekly trend data
  const getWeeklyTrend = () => {
    const weeklyData = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      if (!weeklyData[dayOfWeek]) {
        weeklyData[dayOfWeek] = { day: dayOfWeek, income: 0, expense: 0 };
      }
      
      if (t.type === 'Income') {
        weeklyData[dayOfWeek].income += t.amount;
      } else {
        weeklyData[dayOfWeek].expense += t.amount;
      }
    });

    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayOrder.map(day => weeklyData[day] || { day, income: 0, expense: 0 });
  };

  const weeklyTrendData = getWeeklyTrend();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Insights into your finances</p>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div className="flex flex-wrap gap-2">
            {['week', 'month', 'year', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === 'week' ? 'Last 7 Days' : range === 'month' ? 'This Month' : range === 'year' ? 'This Year' : 'Custom Range'}
              </button>
            ))}
          </div>
          
          {timeRange === 'custom' && (
            <div className="flex items-center space-x-2 ml-auto">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No data for this period</p>
          <p className="text-sm text-gray-400">Add transactions to see analytics</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-600">৳{totalIncome.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-600">৳{totalExpense.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <DollarSign className="w-5 h-5 text-gray-500" />
              </div>
              <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netBalance >= 0 ? '+' : ''}৳{netBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Income vs Expense Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              {timeRange === 'week' ? 'Weekly' : timeRange === 'month' || timeRange === 'custom' ? 'Daily' : 'Monthly'} Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeRange === 'week' ? weeklyTrendData : monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={timeRange === 'week' ? 'day' : 'month'} stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                  formatter={(value) => `৳${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Income" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" name="Expense" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Categories */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieIcon className="w-5 h-5 mr-2" />
                Expense by Category
              </h2>
              {expenseCategoryData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No expense data</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `৳${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {expenseCategoryData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-gray-700">{item.name}</span>
                        </div>
                        <span className="font-medium text-gray-900">৳{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Income Categories */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieIcon className="w-5 h-5 mr-2" />
                Income by Category
              </h2>
              {incomeCategoryData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No income data</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={incomeCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {incomeCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `৳${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {incomeCategoryData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-gray-700">{item.name}</span>
                        </div>
                        <span className="font-medium text-gray-900">৳{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Transaction Count */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
                <p className="text-sm text-gray-600 mt-1">Total Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{filteredTransactions.filter(t => t.type === 'Income').length}</p>
                <p className="text-sm text-gray-600 mt-1">Income Entries</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{filteredTransactions.filter(t => t.type === 'Expense').length}</p>
                <p className="text-sm text-gray-600 mt-1">Expense Entries</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  ৳{filteredTransactions.length > 0 ? (totalExpense / filteredTransactions.filter(t => t.type === 'Expense').length || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Avg. Expense</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}