// src/app/dashboard/admin/finance/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getRevenueStatistics, checkIsAdmin, getAllUsers } from '@/lib/adminUtils';
import { getUserSubscriptionHistory } from '@/lib/subscriptionUtils';
import { 
  DollarSign, TrendingUp, Users, Calendar, Download, 
  CreditCard, Clock, CheckCircle 
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinanceDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month, year

  useEffect(() => {
    if (user) {
      checkAdminAndLoad();
    }
  }, [user]);

  const checkAdminAndLoad = async () => {
    const adminStatus = await checkIsAdmin(user.uid);
    if (!adminStatus) {
      router.push('/dashboard');
      return;
    }
    setIsAdmin(true);
    loadFinanceData();
  };

  const loadFinanceData = async () => {
    setLoading(true);
    
    // Get revenue statistics
    const statsResult = await getRevenueStatistics();
    if (statsResult.success) {
      setStats(statsResult.statistics);
    }

    // Get all payments
    const usersResult = await getAllUsers();
    if (usersResult.success) {
      const allPayments = [];
      
      for (const u of usersResult.users) {
        const subsResult = await getUserSubscriptionHistory(u.id);
        if (subsResult.success) {
          subsResult.subscriptions.forEach(sub => {
            if (sub.amount > 0 && sub.status !== 'pending_approval') {
              allPayments.push({
                ...sub,
                userName: u.name,
                userEmail: u.email,
                userId: u.id
              });
            }
          });
        }
      }
      
      // Sort by date (newest first)
      allPayments.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setPayments(allPayments);
    }
    
    setLoading(false);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'User', 'Email', 'Plan', 'Amount', 'Payment Method', 'Transaction ID', 'Status'],
      ...payments.map(p => [
        p.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
        p.userName || 'Unknown',
        p.userEmail || 'N/A',
        p.planName || 'N/A',
        `৳${p.amount}`,
        p.paymentMethod || 'N/A',
        p.transactionId || 'N/A',
        p.status || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Prepare chart data
  const getRevenueChartData = () => {
    if (!stats?.revenueByDate) return [];
    
    return Object.entries(stats.revenueByDate)
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        revenue: amount
      }))
      .slice(-30); // Last 30 days
  };

  const getPaymentMethodData = () => {
    const methodCounts = {};
    payments.forEach(p => {
      const method = p.paymentMethod || 'Unknown';
      methodCounts[method] = (methodCounts[method] || 0) + p.amount;
    });
    
    return Object.entries(methodCounts).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading finance data...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <DollarSign className="mr-2" size={28} />
            Finance Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track revenue, payments, and financial analytics
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download size={18} className="mr-2" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <DollarSign className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ৳{stats?.totalRevenue?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Paid Subscriptions</p>
            <CheckCircle className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.paidSubscriptions || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Active subscribers</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Free Users</p>
            <Users className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.freeUsers || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Lifetime access</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Trial Users</p>
            <Clock className="text-yellow-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.trialUsers || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Currently on trial</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={getRevenueChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Payment Method</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={getPaymentMethodData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getPaymentMethodData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
          <span className="text-sm text-gray-500">{payments.length} total payments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {payment.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.userName}</p>
                      <p className="text-xs text-gray-500">{payment.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{payment.planName}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    ৳{payment.amount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payment.paymentMethod}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payment.transactionId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payment.status === 'active' ? 'bg-green-100 text-green-800' :
                      payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payments.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No payment history yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}