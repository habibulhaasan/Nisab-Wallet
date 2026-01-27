// src/app/dashboard/transfer/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateId, getAccounts, updateAccount } from '@/lib/firestoreCollections';
import { ArrowRightLeft, ArrowRight, Wallet, Calendar, Clock, CheckCircle } from 'lucide-react';

export default function TransferPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadAccounts(),
      loadTransfers(),
    ]);
    setLoading(false);
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
      if (result.accounts.length > 0 && !formData.fromAccountId) {
        setFormData(prev => ({ 
          ...prev, 
          fromAccountId: result.accounts[0].id,
          toAccountId: result.accounts.length > 1 ? result.accounts[1].id : ''
        }));
      }
    }
  };

  const loadTransfers = async () => {
    try {
      const transfersRef = collection(db, 'users', user.uid, 'transfers');
      const q = query(transfersRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const trans = [];
      querySnapshot.forEach((doc) => {
        trans.push({ id: doc.id, ...doc.data() });
      });
      setTransfers(trans);
    } catch (error) {
      console.error('Error loading transfers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fromAccountId || !formData.toAccountId || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      alert('Cannot transfer to the same account');
      return;
    }

    const amount = parseFloat(formData.amount);
    
    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    const fromAccount = accounts.find(a => a.id === formData.fromAccountId);
    const toAccount = accounts.find(a => a.id === formData.toAccountId);

    if (!fromAccount || !toAccount) {
      alert('Invalid accounts selected');
      return;
    }

    if (fromAccount.balance < amount) {
      alert(`Insufficient balance in ${fromAccount.name}. Available: ৳${fromAccount.balance.toLocaleString()}`);
      return;
    }

    setSubmitting(true);

    try {
      const transferId = generateId();
      
      // Create transfer record
      await addDoc(collection(db, 'users', user.uid, 'transfers'), {
        transferId,
        fromAccountId: formData.fromAccountId,
        fromAccountName: fromAccount.name,
        toAccountId: formData.toAccountId,
        toAccountName: toAccount.name,
        amount,
        description: formData.description || '',
        date: formData.date,
        createdAt: serverTimestamp(),
      });

      // Update FROM account (subtract)
      await updateAccount(user.uid, fromAccount.id, {
        balance: fromAccount.balance - amount
      });

      // Update TO account (add)
      await updateAccount(user.uid, toAccount.id, {
        balance: toAccount.balance + amount
      });

      // Reset form
      setFormData({
        fromAccountId: accounts[0]?.id || '',
        toAccountId: accounts.length > 1 ? accounts[1].id : '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      // Reload data
      await loadData();
      
      alert('Transfer completed successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown';
  };

  const getAccountBalance = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.balance : 0;
  };

  const availableToAccounts = accounts.filter(a => a.id !== formData.fromAccountId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Transfer Money</h1>
        <p className="text-sm text-gray-500 mt-1">Move funds between your accounts</p>
      </div>

      {accounts.length < 2 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ArrowRightLeft className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Need at least 2 accounts</p>
          <p className="text-sm text-gray-400 mb-4">Create another account to enable transfers</p>
          <button
            onClick={() => window.location.href = '/dashboard/accounts'}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Go to Accounts</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transfer Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">New Transfer</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* From Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  From Account
                </label>
                <select
                  value={formData.fromAccountId}
                  onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  required
                  disabled={submitting}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (৳{account.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Visual Arrow */}
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </div>
              </div>

              {/* To Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  To Account
                </label>
                <select
                  value={formData.toAccountId}
                  onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  required
                  disabled={submitting}
                >
                  <option value="">Select account</option>
                  {availableToAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (৳{account.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  placeholder="0.00"
                  required
                  disabled={submitting}
                />
                {formData.fromAccountId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: ৳{getAccountBalance(formData.fromAccountId).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  placeholder="Add notes..."
                  rows="3"
                  disabled={submitting}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !formData.toAccountId}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Transfer Money</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Transfer History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transfers</h2>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-12">
                <ArrowRightLeft className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">No transfers yet</p>
                <p className="text-xs text-gray-400">Your transfer history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {transfers.map((transfer) => (
                  <div key={transfer.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {transfer.fromAccountName}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {transfer.toAccountName}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(transfer.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-lg font-semibold text-gray-900">
                          ৳{transfer.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {transfer.description && (
                      <p className="text-xs text-gray-600 ml-13 pl-1">
                        {transfer.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      {accounts.length >= 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">How Transfers Work</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Money is moved instantly between your accounts</li>
                <li>• Both account balances are updated automatically</li>
                <li>• Transfer history is maintained for your records</li>
                <li>• You can backdate transfers using the date field</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}