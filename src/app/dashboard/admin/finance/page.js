// src/app/dashboard/admin/finance/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getRevenueStatistics, checkIsAdmin, getAllUsers, approveSubscription, rejectSubscription } from '@/lib/adminUtils';
import { getUserSubscriptionHistory } from '@/lib/subscriptionUtils';
import { 
  DollarSign, TrendingUp, Users, Calendar, Download, 
  CreditCard, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ToastContainer } from '@/components/ToastNotification';
import { useToast } from '@/hooks/useToast';

export default function FinanceDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all, approved, pending, rejected
  const { toasts, addToast, removeToast } = useToast();

  // Format date as dd/mm/yyyy
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

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
            // Include all paid subscriptions (approved, pending, rejected)
            if (sub.amount > 0) {
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

  const handleApprove = async (userId, subscriptionId, paymentData) => {
    if (!confirm(`Approve payment of ৳${paymentData.amount} from ${paymentData.userName}?`)) {
      return;
    }

    const result = await approveSubscription(userId, subscriptionId, user.uid);
    
    if (result.success) {
      addToast('Payment approved successfully', 'success');
      loadFinanceData();
    } else {
      addToast('Error: ' + result.error, 'error');
    }
  };

  const handleReject = async (userId, subscriptionId, paymentData) => {
    const reason = prompt('Please provide a reason for rejection:');
    
    if (!reason || !reason.trim()) {
      addToast('Rejection reason is required', 'error');
      return;
    }

    const result = await rejectSubscription(userId, subscriptionId, user.uid, reason);
    
    if (result.success) {
      addToast('Payment rejected', 'success');
      loadFinanceData();
    } else {
      addToast('Error: ' + result.error, 'error');
    }
  };

  const exportToCSV = () => {
    const filteredPayments = statusFilter === 'all' 
      ? payments 
      : payments.filter(p => {
          if (statusFilter === 'approved') return p.status === 'active';
          if (statusFilter === 'pending') return p.status === 'pending_approval';
          if (statusFilter === 'rejected') return p.status === 'rejected';
          return true;
        });

    const csvContent = [
      ['Date', 'User', 'Email', 'Plan', 'Amount', 'Payment Method', 'Transaction ID', 'Status'],
      ...filteredPayments.map(p => [
        formatDate(p.createdAt),
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

  // Calculate statistics
  const approvedRevenue = payments
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingRevenue = payments
    .filter(p => p.status === 'pending_approval')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const approvedCount = payments.filter(p => p.status === 'active').length;
  const pendingCount = payments.filter(p => p.status === 'pending_approval').length;

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
    payments.filter(p => p.status === 'active').forEach(p => {
      const method = p.paymentMethod || 'Unknown';
      methodCounts[method] = (methodCounts[method] || 0) + p.amount;
    });
    
    return Object.entries(methodCounts).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Filter payments
  const filteredPayments = statusFilter === 'all' 
    ? payments 
    : payments.filter(p => {
        if (statusFilter === 'approved') return p.status === 'active';
        if (statusFilter === 'pending') return p.status === 'pending_approval';
        if (statusFilter === 'rejected') return p.status === 'rejected';
        return true;
      });

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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Approved Revenue</p>
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ৳{approvedRevenue?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">{approvedCount} payments</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Pending Revenue</p>
            <Clock className="text-yellow-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            ৳{pendingRevenue?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">{pendingCount} awaiting</p>
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
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ({payments.length})</option>
              <option value="approved">Approved ({approvedCount})</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="rejected">Rejected ({payments.filter(p => p.status === 'rejected').length})</option>
            </select>
            <span className="text-sm text-gray-500">{filteredPayments.length} payments</span>
          </div>
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
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.userName}</p>
                      <p className="text-xs text-gray-500">{payment.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {payment.planName}
                    {payment.isExtension && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Extension
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    ৳{payment.amount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payment.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 font-mono">{payment.transactionId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payment.status === 'active' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.status === 'active' ? 'Approved' :
                       payment.status === 'pending_approval' ? 'Pending' :
                       payment.status === 'rejected' ? 'Rejected' :
                       payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payment.status === 'pending_approval' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(payment.userId, payment.id, payment)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(payment.userId, payment.id, payment)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                    {payment.status === 'rejected' && payment.rejectionReason && (
                      <span className="text-xs text-red-600" title={payment.rejectionReason}>
                        <AlertCircle size={16} className="inline" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No payments found</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} position="top" />
    </div>
  );
}