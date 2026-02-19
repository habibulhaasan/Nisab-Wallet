// src/app/dashboard/recurring/pending/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getPendingApprovalLogs,
  getRecurringTransaction,
  approveRecurringTransaction,
  skipRecurringTransaction,
} from '@/lib/recurringTransactionsCollections';
import { getAccounts } from '@/lib/firestoreCollections';
import { getAvailableBalance } from '@/lib/goalUtils';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showToast } from '@/components/Toast';

export default function PendingApprovalsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState([]);
  const [accountsWithBalance, setAccountsWithBalance] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null); // logId being processed

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadPendingLogs(),
      loadAccounts(),
      loadCategories(),
    ]);
    setLoading(false);
  };

  const loadPendingLogs = async () => {
    const result = await getPendingApprovalLogs(user.uid);
    if (result.success) {
      // Enrich with recurring details
      const enrichedLogs = await Promise.all(
        result.logs.map(async (log) => {
          const recResult = await getRecurringTransaction(user.uid, log.recurringDocId);
          return {
            ...log,
            recurringDetails: recResult.success ? recResult.transaction : null,
          };
        })
      );
      setLogs(enrichedLogs);
    }
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      // Calculate available balance for each
      const enriched = await Promise.all(
        result.accounts.map(async (acc) => {
          const available = await getAvailableBalance(user.uid, acc.id, acc.balance);
          return { ...acc, availableBalance: available };
        })
      );
      setAccountsWithBalance(enriched);
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

  const handleApprove = (log) => {
    const account = accountsWithBalance.find(a => a.id === log.recurringDetails?.accountId);
    
    if (!account) {
      showToast('Account not found', 'error');
      return;
    }

    const available = account.availableBalance;
    const required = log.amount;

    if (required > available) {
      const shortfall = required - available;
      setConfirmDialog({
        isOpen: true,
        title: 'Still Insufficient Balance',
        message: (
          <div className="space-y-2">
            <p>Cannot approve this transaction yet.</p>
            <div className="bg-red-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-red-900">Account: {account.name}</p>
              <p className="text-red-700">Available: ৳{available.toLocaleString()}</p>
              <p className="text-red-700">Required: ৳{required.toLocaleString()}</p>
              <p className="text-red-900 font-medium">Short by: ৳{shortfall.toLocaleString()}</p>
            </div>
          </div>
        ),
        type: 'danger',
        onConfirm: () => {},
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Approve Transaction?',
      message: (
        <div className="space-y-2">
          <p>Create this transaction now?</p>
          <div className="bg-green-50 rounded-lg p-3 text-sm">
            <p className="font-medium">Amount: ৳{required.toLocaleString()}</p>
            <p className="text-gray-600">From: {account.name}</p>
            <p className="text-gray-600">Available: ৳{available.toLocaleString()}</p>
          </div>
        </div>
      ),
      type: 'success',
      onConfirm: async () => {
        setProcessing(log.id);
        const result = await approveRecurringTransaction(user.uid, log.id, log.recurringDocId);
        
        if (result.success) {
          showToast('Transaction approved and created', 'success');
          await loadData();
        } else {
          showToast(result.error || 'Failed to approve', 'error');
        }
        setProcessing(null);
      },
    });
  };

  const handleSkip = (log) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Skip This Transaction?',
      message: 'This occurrence will be skipped and the next due date will be calculated.',
      type: 'warning',
      onConfirm: async () => {
        setProcessing(log.id);
        const result = await skipRecurringTransaction(user.uid, log.id, log.recurringDocId);
        
        if (result.success) {
          showToast('Transaction skipped', 'success');
          await loadData();
        } else {
          showToast('Failed to skip', 'error');
        }
        setProcessing(null);
      },
    });
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.name || 'Unknown';
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

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve recurring transactions that couldn't be processed automatically
          </p>
        </div>
      </div>

      {/* Account Balances Summary */}
      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        {accountsWithBalance.map((acc) => (
          <div
            key={acc.id}
            className="bg-white rounded-lg border border-gray-200 px-4 py-3 min-w-[160px]"
          >
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-medium text-gray-500">{acc.name}</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              ৳{(acc.balance || 0).toLocaleString()}
            </p>
            <p className="text-xs text-green-600">
              Available: ৳{(acc.availableBalance || 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Pending List */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-sm text-gray-500">
            No recurring transactions pending approval
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <PendingLogCard
              key={log.id}
              log={log}
              accountsWithBalance={accountsWithBalance}
              getCategoryName={getCategoryName}
              formatDate={formatDate}
              onApprove={handleApprove}
              onSkip={handleSkip}
              processing={processing === log.id}
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
    </div>
  );
}

// Pending Log Card Component
function PendingLogCard({ 
  log, 
  accountsWithBalance, 
  getCategoryName, 
  formatDate,
  onApprove, 
  onSkip,
  processing 
}) {
  const recurring = log.recurringDetails;
  
  if (!recurring) {
    return null;
  }

  const account = accountsWithBalance.find(a => a.id === recurring.accountId);
  const available = account?.availableBalance || 0;
  const required = log.amount;
  const canAfford = available >= required;
  const shortfall = canAfford ? 0 : required - available;

  return (
    <div className="bg-white rounded-lg border border-yellow-200 p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 mt-0.5">
          <Clock className="w-6 h-6 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {recurring.description || 'Unnamed Transaction'}
          </h3>
          <p className="text-sm text-gray-600">
            Due: {formatDate(log.dueDate)} • {getCategoryName(recurring.categoryId)}
          </p>
        </div>
        <p className="text-lg font-bold text-gray-900">
          ৳{required.toLocaleString()}
        </p>
      </div>

      {/* Balance Info */}
      <div className={`rounded-lg p-3 mb-4 ${canAfford ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-start justify-between text-sm">
          <div>
            <p className="font-medium text-gray-900 mb-1">
              {account?.name || 'Unknown Account'}
            </p>
            <p className={canAfford ? 'text-green-700' : 'text-red-700'}>
              Available: ৳{available.toLocaleString()}
            </p>
            {!canAfford && (
              <p className="text-red-900 font-medium mt-1">
                Short by: ৳{shortfall.toLocaleString()}
              </p>
            )}
          </div>
          {canAfford ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSkip(log)}
          disabled={processing}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
        >
          Skip This Month
        </button>
        <button
          onClick={() => onApprove(log)}
          disabled={processing || !canAfford}
          className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            canAfford
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {processing ? 'Processing...' : canAfford ? 'Approve & Pay' : 'Insufficient Balance'}
        </button>
      </div>
    </div>
  );
}