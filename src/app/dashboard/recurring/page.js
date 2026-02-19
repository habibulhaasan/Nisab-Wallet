// src/app/dashboard/recurring/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getRecurringTransactions,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  deleteRecurringTransaction,
  processAllRecurringTransactions,
  getPendingApprovalLogs,
} from '@/lib/recurringTransactionsCollections';
import { getAccounts } from '@/lib/firestoreCollections';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Plus,
  Repeat,
  Play,
  Pause,
  Trash2,
  Edit,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import ConfirmDialog, { AlertDialog } from '@/components/ConfirmDialog';
import RecurringFormModal from '@/components/RecurringFormModal';
import { showToast } from '@/components/Toast';

export default function RecurringTransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [recurring, setRecurring] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountsWithAvailable, setAccountsWithAvailable] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pendingLogs, setPendingLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
  });

  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all/active/paused/completed

  useEffect(() => {
    if (user) {
      loadData();
      // Process recurring transactions on page load
      processRecurringOnLoad();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadRecurringTransactions(),
      loadAccounts(),
      loadCategories(),
      loadPendingLogs(),
    ]);
    setLoading(false);
  };

  const loadRecurringTransactions = async () => {
    const result = await getRecurringTransactions(user.uid);
    if (result.success) {
      setRecurring(result.transactions);
    }
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
      
      // Calculate available balance for each account
      const { getAvailableBalance } = await import('@/lib/goalUtils');
      const accountsWithAvailableBalance = await Promise.all(
        result.accounts.map(async (account) => {
          const available = await getAvailableBalance(user.uid, account.id, account.balance);
          return {
            ...account,
            availableBalance: available,
          };
        })
      );
      setAccountsWithAvailable(accountsWithAvailableBalance);
    }
  };

  const loadCategories = async () => {
    try {
      const ref = collection(db, 'users', user.uid, 'categories');
      const snap = await getDocs(ref);
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPendingLogs = async () => {
    const result = await getPendingApprovalLogs(user.uid);
    if (result.success) {
      setPendingLogs(result.logs);
    }
  };

  const processRecurringOnLoad = async () => {
    try {
      const result = await processAllRecurringTransactions(user.uid);
      if (result.success && result.results) {
        const { succeeded, pending, failed } = result.results;
        
        if (succeeded > 0 || pending > 0 || failed > 0) {
          let message = [];
          if (succeeded > 0) message.push(`${succeeded} processed`);
          if (pending > 0) message.push(`${pending} pending approval`);
          if (failed > 0) message.push(`${failed} failed`);
          
          showToast(message.join(', '), succeeded > 0 ? 'success' : 'info');
          
          // Reload data if anything was processed
          if (succeeded > 0 || pending > 0) {
            await loadData();
          }
        }
      }
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
    }
  };

  const handleCreateNew = () => {
    setEditingRecurring(null);
    setShowCreateModal(true);
  };

  const handleEdit = (rec) => {
    setEditingRecurring(rec);
    setShowCreateModal(true);
  };

  const handlePause = (rec) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Pause Recurring Transaction?',
      message: `Are you sure you want to pause "${rec.description}"? No transactions will be created until you resume it.`,
      type: 'warning',
      onConfirm: async () => {
        const result = await pauseRecurringTransaction(user.uid, rec.id);
        if (result.success) {
          showToast('Paused successfully', 'success');
          await loadData();
        } else {
          showToast('Failed to pause', 'error');
        }
      },
    });
  };

  const handleResume = (rec) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Resume Recurring Transaction?',
      message: `Resume "${rec.description}"? Transactions will be created according to schedule.`,
      type: 'success',
      onConfirm: async () => {
        const result = await resumeRecurringTransaction(user.uid, rec.id);
        if (result.success) {
          showToast('Resumed successfully', 'success');
          await loadData();
        } else {
          showToast('Failed to resume', 'error');
        }
      },
    });
  };

  const handleDelete = (rec) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Recurring Transaction?',
      message: (
        <div>
          <p className="mb-3">
            Are you sure you want to delete "{rec.description}"?
          </p>
          <p className="text-xs text-gray-500">
            Note: Past transactions will not be deleted. Only the recurring schedule will be removed.
          </p>
        </div>
      ),
      type: 'danger',
      onConfirm: async () => {
        const result = await deleteRecurringTransaction(user.uid, rec.id, false);
        if (result.success) {
          showToast('Deleted successfully', 'success');
          await loadData();
        } else {
          showToast('Failed to delete', 'error');
        }
      },
    });
  };

  const handleRefresh = async () => {
    setProcessing(true);
    await processRecurringOnLoad();
    setProcessing(false);
  };

  const getAccountName = (id) => {
    const acc = accounts.find((a) => a.id === id);
    return acc?.name || 'Unknown';
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.name || 'Unknown';
  };

  const getFrequencyText = (rec) => {
    const interval = rec.interval > 1 ? `${rec.interval} ` : '';
    
    switch (rec.frequency) {
      case 'daily':
        return `Every ${interval}day${rec.interval > 1 ? 's' : ''}`;
      case 'weekly':
        return `Every ${interval}week${rec.interval > 1 ? 's' : ''}`;
      case 'monthly':
        return `Every ${interval}month${rec.interval > 1 ? 's' : ''} on ${rec.dayOfMonth}${getOrdinalSuffix(rec.dayOfMonth)}`;
      case 'yearly':
        return `Every ${interval}year${rec.interval > 1 ? 's' : ''}`;
      case 'custom':
        return 'Custom dates';
      default:
        return rec.frequency;
    }
  };

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            <Pause className="w-3 h-3" />
            Paused
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const filteredRecurring = recurring.filter((rec) => {
    if (statusFilter === 'all') return rec.status !== 'deleted';
    return rec.status === statusFilter;
  });

  const stats = {
    total: recurring.filter(r => r.status !== 'deleted').length,
    active: recurring.filter(r => r.status === 'active').length,
    paused: recurring.filter(r => r.status === 'paused').length,
    completed: recurring.filter(r => r.status === 'completed').length,
    pending: pendingLogs.length,
  };

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recurring Transactions</h1>
            <p className="text-sm text-gray-500 mt-1">Automate your regular income and expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={processing}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Process due transactions"
            >
              <RefreshCw className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Recurring</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-green-600 font-medium">Active</p>
            <p className="text-xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-yellow-600 font-medium">Paused</p>
            <p className="text-xl font-bold text-yellow-600">{stats.paused}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-blue-600 font-medium">Completed</p>
            <p className="text-xl font-bold text-blue-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-red-600 font-medium">Pending</p>
            <p className="text-xl font-bold text-red-600">{stats.pending}</p>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {pendingLogs.length > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">
                  {pendingLogs.length} recurring transaction{pendingLogs.length > 1 ? 's' : ''} pending approval
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Insufficient balance prevented automatic execution. Review and approve manually.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/recurring/pending')}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'active', 'paused', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'all' && ` (${stats.total})`}
              {status === 'active' && ` (${stats.active})`}
              {status === 'paused' && ` (${stats.paused})`}
              {status === 'completed' && ` (${stats.completed})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredRecurring.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <Repeat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No recurring transactions yet' : `No ${statusFilter} recurring transactions`}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Set up automatic transactions for regular income and expenses
          </p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Recurring
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecurring.map((rec) => (
            <RecurringCard
              key={rec.id}
              recurring={rec}
              getAccountName={getAccountName}
              getCategoryName={getCategoryName}
              getFrequencyText={getFrequencyText}
              getDaysUntil={getDaysUntil}
              getStatusBadge={getStatusBadge}
              onEdit={handleEdit}
              onPause={handlePause}
              onResume={handleResume}
              onDelete={handleDelete}
              onViewDetails={() => router.push(`/dashboard/recurring/${rec.id}`)}
            />
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <RecurringFormModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRecurring(null);
          }}
          onSuccess={async () => {
            await loadData();
            setShowCreateModal(false);
            setEditingRecurring(null);
          }}
          editingRecurring={editingRecurring}
          accounts={accountsWithAvailable}
          categories={categories}
          userId={user.uid}
        />
      )}
    </div>
  );
}

// Recurring Transaction Card Component
function RecurringCard({
  recurring,
  getAccountName,
  getCategoryName,
  getFrequencyText,
  getDaysUntil,
  getStatusBadge,
  onEdit,
  onPause,
  onResume,
  onDelete,
  onViewDetails,
}) {
  const [showActions, setShowActions] = useState(false);

  const isIncome = recurring.type === 'income';

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
      onClick={() => setShowActions(!showActions)}
    >
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isIncome ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {recurring.description || 'Unnamed'}
              </h3>
            </div>
            <p className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
              ৳{recurring.amount.toLocaleString()}
            </p>
          </div>
          {getStatusBadge(recurring.status)}
        </div>

        <div className="space-y-1 text-xs text-gray-600 mb-3">
          <p className="flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            {getFrequencyText(recurring)}
          </p>
          <p>{getAccountName(recurring.accountId)} • {getCategoryName(recurring.categoryId)}</p>
          {recurring.status === 'active' && (
            <p className="flex items-center gap-1 text-blue-600 font-medium">
              <Clock className="w-3 h-3" />
              Next: {getDaysUntil(recurring.nextDueDate)}
            </p>
          )}
        </div>

        {showActions && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Details
            </button>
            {recurring.status === 'active' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPause(recurring);
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors flex items-center justify-center gap-1"
              >
                <Pause className="w-3 h-3" />
                Pause
              </button>
            )}
            {recurring.status === 'paused' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResume(recurring);
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3" />
                Resume
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(recurring);
              }}
              className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex-1 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isIncome ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isIncome ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900">
                {recurring.description || 'Unnamed'}
              </h3>
              {getStatusBadge(recurring.status)}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                {getFrequencyText(recurring)}
              </span>
              <span>•</span>
              <span>{getAccountName(recurring.accountId)}</span>
              <span>•</span>
              <span>{getCategoryName(recurring.categoryId)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
              ৳{recurring.amount.toLocaleString()}
            </p>
            {recurring.status === 'active' && (
              <p className="text-xs text-blue-600 font-medium">
                Next: {getDaysUntil(recurring.nextDueDate)}
              </p>
            )}
          </div>

          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {recurring.status === 'active' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPause(recurring);
                }}
                className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            {recurring.status === 'paused' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResume(recurring);
                }}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Resume"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(recurring);
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}