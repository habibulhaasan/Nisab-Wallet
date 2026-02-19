// src/app/dashboard/recurring/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  getRecurringTransaction,
  getRecurringLogs,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  deleteRecurringTransaction,
} from '@/lib/recurringTransactionsCollections';
import { getAccounts } from '@/lib/firestoreCollections';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft,
  Calendar,
  Repeat,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Pause,
  Play,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import RecurringFormModal from '@/components/RecurringFormModal';
import { showToast } from '@/components/Toast';

export default function RecurringDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const recurringId = params?.id;

  const [recurring, setRecurring] = useState(null);
  const [logs, setLogs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountsWithAvailable, setAccountsWithAvailable] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
  });

  useEffect(() => {
    if (user && recurringId) {
      loadData();
    }
  }, [user, recurringId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadRecurring(),
      loadLogs(),
      loadAccounts(),
      loadCategories(),
    ]);
    setLoading(false);
  };

  const loadRecurring = async () => {
    const result = await getRecurringTransaction(user.uid, recurringId);
    if (result.success) {
      setRecurring(result.transaction);
    } else {
      showToast('Recurring transaction not found', 'error');
      router.push('/dashboard/recurring');
    }
  };

  const loadLogs = async () => {
    const result = await getRecurringLogs(user.uid, recurringId);
    if (result.success) {
      setLogs(result.logs);
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

  const handlePause = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Pause Recurring Transaction?',
      message: 'No transactions will be created until you resume it.',
      type: 'warning',
      onConfirm: async () => {
        const result = await pauseRecurringTransaction(user.uid, recurringId);
        if (result.success) {
          showToast('Paused successfully', 'success');
          await loadData();
        } else {
          showToast('Failed to pause', 'error');
        }
      },
    });
  };

  const handleResume = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Resume Recurring Transaction?',
      message: 'Transactions will be created according to schedule.',
      type: 'success',
      onConfirm: async () => {
        const result = await resumeRecurringTransaction(user.uid, recurringId);
        if (result.success) {
          showToast('Resumed successfully', 'success');
          await loadData();
        } else {
          showToast('Failed to resume', 'error');
        }
      },
    });
  };

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Recurring Transaction?',
      message: (
        <div>
          <p className="mb-3">
            Are you sure you want to delete this recurring transaction?
          </p>
          <p className="text-xs text-gray-500">
            Past transactions will not be deleted. Only the recurring schedule will be removed.
          </p>
        </div>
      ),
      type: 'danger',
      onConfirm: async () => {
        const result = await deleteRecurringTransaction(user.uid, recurringId, false);
        if (result.success) {
          showToast('Deleted successfully', 'success');
          router.push('/dashboard/recurring');
        } else {
          showToast('Failed to delete', 'error');
        }
      },
    });
  };

  const getAccountName = (id) => {
    const acc = accounts.find((a) => a.id === id);
    return acc?.name || 'Unknown';
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.name || 'Unknown';
  };

  const getFrequencyText = () => {
    if (!recurring) return '';
    
    const interval = recurring.interval > 1 ? `${recurring.interval} ` : '';
    
    switch (recurring.frequency) {
      case 'daily':
        return `Every ${interval}day${recurring.interval > 1 ? 's' : ''}`;
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Every ${interval}week${recurring.interval > 1 ? 's' : ''} on ${days[recurring.dayOfWeek]}`;
      case 'monthly':
        return `Every ${interval}month${recurring.interval > 1 ? 's' : ''} on day ${recurring.dayOfMonth}`;
      case 'yearly':
        return `Every ${interval}year${recurring.interval > 1 ? 's' : ''}`;
      case 'custom':
        return `Custom dates (${recurring.customDates?.length || 0} dates)`;
      default:
        return recurring.frequency;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
            <CheckCircle className="w-4 h-4" />
            Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">
            <Pause className="w-4 h-4" />
            Paused
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
            <CheckCircle className="w-4 h-4" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const getLogStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getLogStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'Pending Approval';
      case 'skipped':
        return 'Skipped';
      default:
        return status;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!recurring) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Recurring transaction not found</p>
      </div>
    );
  }

  const isIncome = recurring.type === 'income';

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/recurring')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Recurring Transactions
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                isIncome ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isIncome ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  {recurring.description || 'Unnamed Recurring Transaction'}
                </h1>
                {getStatusBadge(recurring.status)}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Amount</p>
            <p className={`text-3xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
              ৳{recurring.amount.toLocaleString()}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Frequency</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <Repeat className="w-4 h-4" />
                {getFrequencyText()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Account</p>
              <p className="text-sm font-medium text-gray-900">
                {getAccountName(recurring.accountId)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Category</p>
              <p className="text-sm font-medium text-gray-900">
                {getCategoryName(recurring.categoryId)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Start Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(recurring.startDate)}
              </p>
            </div>

            {recurring.status === 'active' && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Next Due</p>
                <p className="text-sm font-medium text-blue-600">
                  {formatDate(recurring.nextDueDate)}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 mb-1">Completed</p>
              <p className="text-sm font-medium text-gray-900">
                {recurring.completedCount} time{recurring.completedCount !== 1 ? 's' : ''}
              </p>
            </div>

            {recurring.endCondition !== 'never' && (
              <div>
                <p className="text-sm text-gray-500 mb-1">End Condition</p>
                <p className="text-sm font-medium text-gray-900">
                  {recurring.endCondition === 'until' && `Until ${formatDate(recurring.endDate)}`}
                  {recurring.endCondition === 'after' && `After ${recurring.occurrences} occurrences`}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>

            {recurring.status === 'active' && (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}

            {recurring.status === 'paused' && (
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}

            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Execution History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Execution History</h2>
          <p className="text-sm text-gray-500 mt-1">
            {logs.length} execution{logs.length !== 1 ? 's' : ''}
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No execution history yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Transactions will appear here once they're created
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <LogEntry
                key={log.id}
                log={log}
                recurring={recurring}
                getLogStatusIcon={getLogStatusIcon}
                getLogStatusText={getLogStatusText}
                formatDate={formatDate}
                router={router}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <RecurringFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={async () => {
            await loadData();
            setShowEditModal(false);
          }}
          editingRecurring={recurring}
          accounts={accountsWithAvailable}
          categories={categories}
          userId={user.uid}
        />
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
    </div>
  );
}

// Log Entry Component
function LogEntry({ log, recurring, getLogStatusIcon, getLogStatusText, formatDate, router }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50';
      case 'pending':
        return 'bg-yellow-50';
      case 'failed':
        return 'bg-red-50';
      case 'skipped':
        return 'bg-gray-50';
      default:
        return 'bg-white';
    }
  };

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${getStatusColor(log.status)}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getLogStatusIcon(log.status)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getLogStatusText(log.status)}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(log.dueDate)}
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              ৳{log.amount.toLocaleString()}
            </p>
          </div>

          {log.status === 'success' && log.transactionId && (
            <button
              onClick={() => router.push(`/dashboard/transactions`)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
            >
              <ExternalLink className="w-3 h-3" />
              View Transaction
            </button>
          )}

          {log.status === 'pending' && (
            <div className="mt-2">
              <p className="text-xs text-yellow-700">
                Insufficient balance. Please approve manually in Pending Approvals.
              </p>
            </div>
          )}

          {log.status === 'failed' && log.failureReason && (
            <div className="mt-2">
              <p className="text-xs text-red-700">
                Reason: {log.failureReason}
              </p>
            </div>
          )}

          {log.status === 'skipped' && (
            <p className="text-xs text-gray-500 mt-1">
              Manually skipped by user
            </p>
          )}
        </div>
      </div>
    </div>
  );
}