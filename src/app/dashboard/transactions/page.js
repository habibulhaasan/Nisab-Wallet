// src/app/dashboard/transactions/page.js
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAccounts, updateAccount } from '@/lib/firestoreCollections';
import { getAvailableBalance } from '@/lib/goalUtils';
import {
  Plus,
  Edit2,
  Trash2,
  Receipt,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Search,
  Wallet,
  AlertTriangle,
  ArrowRightLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function TransactionsPage() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);

  // Fees & charges state
  const [hasFees, setHasFees] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeAccountId, setFeeAccountId] = useState('');
  const [feeCategoryId, setFeeCategoryId] = useState('');

  // Inline add-category state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6B7280');
  const [addingCat, setAddingCat] = useState(false);

  const [filterType, setFilterType] = useState('All');
  const [filterAccount, setFilterAccount] = useState('All');
  const [dateFilter, setDateFilter] = useState('Weekly');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const [modalTab, setModalTab] = useState('expense');

  const [formData, setFormData] = useState({
    type: 'Expense',
    amount: '',
    accountId: '',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [transferData, setTransferData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Store available balances for each account
  const [accountsWithAvailable, setAccountsWithAvailable] = useState([]);

  const [summaryIncome, setSummaryIncome] = useState(0);
  const [summaryExpense, setSummaryExpense] = useState(0);
  const [summaryNet, setSummaryNet] = useState(0);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadTransactionsAndTransfers(),
      loadAccounts(),
      loadCategories(),
    ]);
    setLoading(false);
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      // Calculate available balance for each account
      const accountsWithAvailableBalance = await Promise.all(
        result.accounts.map(async (account) => {
          const available = await getAvailableBalance(user.uid, account.id, account.balance);
          return {
            ...account,
            availableBalance: available,
          };
        })
      );
      
      setAccounts(result.accounts);
      setAccountsWithAvailable(accountsWithAvailableBalance);
      
      if (result.accounts.length > 0 && !formData.accountId) {
        setFormData((prev) => ({ ...prev, accountId: result.accounts[0].id }));
        setTransferData((prev) => ({
          ...prev,
          fromAccountId: result.accounts[0].id,
          toAccountId: result.accounts.length > 1 ? result.accounts[1].id : '',
        }));
      }
    }
  };

  const loadTransactionsAndTransfers = async () => {
    try {
      const transRef = collection(db, 'users', user.uid, 'transactions');
      const transferRef = collection(db, 'users', user.uid, 'transfers');
      
      let normal = [];
      let transfers = [];

      try {
        const qTransSimple = query(transRef, orderBy('date', 'desc'));
        const snapTrans = await getDocs(qTransSimple);
        normal = snapTrans.docs.map((doc) => ({
          id: doc.id,
          collectionType: 'transactions',
          ...doc.data(),
        }));
      } catch (fallbackError) {
        const snapTrans = await getDocs(transRef);
        normal = snapTrans.docs.map((doc) => ({
          id: doc.id,
          collectionType: 'transactions',
          ...doc.data(),
        }));
      }

      try {
        const qTransferSimple = query(transferRef, orderBy('date', 'desc'));
        const snapTransfer = await getDocs(qTransferSimple);
        transfers = snapTransfer.docs.map((doc) => ({
          id: doc.id,
          collectionType: 'transfers',
          ...doc.data(),
        }));
      } catch (fallbackError) {
        const snapTransfer = await getDocs(transferRef);
        transfers = snapTransfer.docs.map((doc) => ({
          id: doc.id,
          collectionType: 'transfers',
          ...doc.data(),
        }));
      }

      const expandedTransfers = [];
      transfers.forEach((transfer) => {
        expandedTransfers.push({
          id: `${transfer.id}-expense`,
          originalId: transfer.id,
          collectionType: 'transfers',
          type: 'Expense',
          amount: transfer.amount,
          accountId: transfer.fromAccountId,
          accountName: transfer.fromAccountName,
          description: transfer.description || `Transfer to ${transfer.toAccountName}`,
          date: transfer.date,
          createdAt: transfer.createdAt,
          isTransfer: true,
          transferDirection: 'from',
          relatedAccountId: transfer.toAccountId,
          relatedAccountName: transfer.toAccountName,
        });

        expandedTransfers.push({
          id: `${transfer.id}-income`,
          originalId: transfer.id,
          collectionType: 'transfers',
          type: 'Income',
          amount: transfer.amount,
          accountId: transfer.toAccountId,
          accountName: transfer.toAccountName,
          description: transfer.description || `Transfer from ${transfer.fromAccountName}`,
          date: transfer.date,
          createdAt: transfer.createdAt,
          isTransfer: true,
          transferDirection: 'to',
          relatedAccountId: transfer.fromAccountId,
          relatedAccountName: transfer.fromAccountName,
        });
      });

      const all = [...normal, ...expandedTransfers].sort((a, b) => {
        const dateCompare = (b.date || '').localeCompare(a.date || '');
        if (dateCompare !== 0) return dateCompare;
        
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        
        if (aTime !== 0 || bTime !== 0) {
          return bTime - aTime;
        }
        
        return 0;
      });
      
      setTransactions(all);
    } catch (error) {
      console.error('Error loading records:', error);
      showToast('Failed to load records', 'error');
    }
  };

  const loadCategories = async () => {
    try {
      const ref = collection(db, 'users', user.uid, 'categories');
      const snap = await getDocs(ref);
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      showToast('Failed to load categories', 'error');
    }
  };

  useEffect(() => {
    if (!transactions.length) return;

    const range = getSummaryDateRange();

    const filtered = range
      ? transactions.filter((t) => t.date >= range.start && t.date <= range.end)
      : transactions;

    const inc = filtered
      .filter((t) => t.type === 'Income' && !t.isTransfer)
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const exp = filtered
      .filter((t) => t.type === 'Expense' && !t.isTransfer)
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    setSummaryIncome(inc);
    setSummaryExpense(exp);
    setSummaryNet(inc - exp);
  }, [transactions, dateFilter, customDateRange.start, customDateRange.end]);

  const getSummaryDateRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    if (dateFilter === 'Daily') {
      const todayStr = formatDateToISO(now);
      return { start: todayStr, end: todayStr };
    }
    
    if (dateFilter === 'Weekly') {
      const dayOfWeek = now.getDay();
      const daysFromSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1);
      
      const weekStart = new Date(now);
      weekStart.setDate(day - daysFromSaturday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      return {
        start: formatDateToISO(weekStart),
        end: formatDateToISO(weekEnd),
      };
    }
    
    if (dateFilter === 'Monthly') {
      const monthStart = new Date(year, month, 1, 12, 0, 0);
      const monthEnd = new Date(year, month + 1, 0, 12, 0, 0);
      
      return {
        start: formatDateToISO(monthStart),
        end: formatDateToISO(monthEnd),
      };
    }
    
    if (dateFilter === 'Yearly') {
      const yearStart = new Date(year, 0, 1, 12, 0, 0);
      const yearEnd = new Date(year, 11, 31, 12, 0, 0);
      
      return {
        start: formatDateToISO(yearStart),
        end: formatDateToISO(yearEnd),
      };
    }
    
    if (dateFilter === 'Custom' && customDateRange.start && customDateRange.end) {
      return customDateRange;
    }
    
    return null;
  };

  const formatDateToISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDate = (dStr) => {
    const d = new Date(dStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    
    if (modalTab === 'transfer') return handleTransferSubmit(e);

    if (!formData.amount || !formData.accountId || !formData.categoryId) {
      return showToast('Please fill in all required fields', 'error');
    }

    const amount = parseFloat(formData.amount);
    const account = accounts.find((a) => a.id === formData.accountId);

    if (!account) return showToast('Invalid account', 'error');

    setSubmitting(true);
    setCheckingBalance(true);

    try {
      // CRITICAL: Check AVAILABLE balance for expenses
      if (formData.type === 'Expense') {
        const availableBalance = await getAvailableBalance(user.uid, formData.accountId, account.balance);
        
        if (amount > availableBalance) {
          const allocated = account.balance - availableBalance;
          setSubmitting(false);
          setCheckingBalance(false);
          return showToast(
            `Insufficient available balance! Account has ৳${account.balance.toLocaleString()} total, ` +
            `but ৳${allocated.toLocaleString()} is allocated to goals. ` +
            `Only ৳${availableBalance.toLocaleString()} available to spend.`,
            'error'
          );
        }
      }

      if (editingTransaction) {
        const oldAmount = parseFloat(editingTransaction.amount);
        const oldAcc = accounts.find((a) => a.id === editingTransaction.accountId);
        const newAcc = accounts.find((a) => a.id === formData.accountId);
        
        if (!newAcc) return showToast('Invalid account', 'error');

        let revertedBalance;
        if (oldAcc) {
          if (editingTransaction.type === 'Income') {
            revertedBalance = oldAcc.balance - oldAmount;
          } else {
            revertedBalance = oldAcc.balance + oldAmount;
          }
        }

        if (formData.type === 'Expense') {
          let checkBalance;
          
          if (oldAcc?.id === newAcc.id) {
            checkBalance = revertedBalance;
          } else {
            checkBalance = newAcc.balance;
          }

          const availableAfterRevert = await getAvailableBalance(user.uid, newAcc.id, checkBalance);

          if (amount > availableAfterRevert) {
            const allocated = checkBalance - availableAfterRevert;
            setSubmitting(false);
            setCheckingBalance(false);
            return showToast(
              `Insufficient available balance in ${newAcc.name}. ` +
              `Total: ৳${checkBalance.toLocaleString()}, ` +
              `Allocated: ৳${allocated.toLocaleString()}, ` +
              `Available: ৳${availableAfterRevert.toLocaleString()}`,
              'error'
            );
          }
        }

        if (oldAcc) {
          await updateAccount(user.uid, oldAcc.id, { balance: revertedBalance });
        }

        await updateDoc(
          doc(db, 'users', user.uid, 'transactions', editingTransaction.id),
          {
            type: formData.type,
            amount,
            accountId: formData.accountId,
            categoryId: formData.categoryId,
            description: formData.description,
            date: formData.date,
            isRiba: formData.type === 'Income' && isRibaCategory(formData.categoryId),
            updatedAt: Timestamp.now(),
          }
        );

        let finalBalance;
        
        if (oldAcc?.id === newAcc.id) {
          if (formData.type === 'Income') {
            finalBalance = revertedBalance + amount;
          } else {
            finalBalance = revertedBalance - amount;
          }
        } else {
          if (formData.type === 'Income') {
            finalBalance = newAcc.balance + amount;
          } else {
            finalBalance = newAcc.balance - amount;
          }
        }
        
        await updateAccount(user.uid, newAcc.id, { balance: finalBalance });

        showToast('Updated', 'success');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'transactions'), {
          type: formData.type,
          amount,
          accountId: formData.accountId,
          categoryId: formData.categoryId,
          description: formData.description,
          date: formData.date,
          isRiba: formData.type === 'Income' && isRibaCategory(formData.categoryId),
          createdAt: Timestamp.now(),
        });

        let newBal =
          formData.type === 'Income'
            ? account.balance + amount
            : account.balance - amount;

        // Record fees/charges as a separate expense transaction
        if (hasFees && parseFloat(feeAmount) > 0 && feeAccountId && feeCategoryId) {
          const feeAmt = parseFloat(feeAmount);
          const feeAcc = accounts.find(a => a.id === feeAccountId);
          if (feeAcc) {
            await addDoc(collection(db, 'users', user.uid, 'transactions'), {
              type: 'Expense',
              amount: feeAmt,
              accountId: feeAccountId,
              categoryId: feeCategoryId,
              description: `Charge/fee for: ${formData.description || getCategoryName(formData.categoryId)}`,
              date: formData.date,
              isFee: true,
              createdAt: Timestamp.now(),
            });
            const feeAccNewBal = feeAcc.id === account.id
              ? newBal - feeAmt
              : feeAcc.balance - feeAmt;
            if (feeAcc.id === account.id) {
              newBal = feeAccNewBal;
            } else {
              await updateAccount(user.uid, feeAcc.id, { balance: feeAccNewBal });
            }
          }
        }

        await updateAccount(user.uid, account.id, { balance: newBal });

        showToast('Added', 'success');
      }

      await loadData();
      closeModal();
    } catch (err) {
      console.error(err);
      showToast('Error saving', 'error');
    } finally {
      setSubmitting(false);
      setCheckingBalance(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount) {
      return showToast('Fill all required fields', 'error');
    }

    if (transferData.fromAccountId === transferData.toAccountId) {
      return showToast('Cannot transfer to same account', 'error');
    }

    const amount = parseFloat(transferData.amount);
    const from = accounts.find((a) => a.id === transferData.fromAccountId);
    const to = accounts.find((a) => a.id === transferData.toAccountId);

    if (!from || !to) return showToast('Invalid accounts', 'error');

    setSubmitting(true);
    setCheckingBalance(true);

    try {
      // Check available balance for transfer
      const availableBalance = await getAvailableBalance(user.uid, from.id, from.balance);
      
      if (amount > availableBalance) {
        const allocated = from.balance - availableBalance;
        setSubmitting(false);
        setCheckingBalance(false);
        return showToast(
          `Insufficient available balance in ${from.name}! ` +
          `Total: ৳${from.balance.toLocaleString()}, ` +
          `Allocated: ৳${allocated.toLocaleString()}, ` +
          `Available: ৳${availableBalance.toLocaleString()}`,
          'error'
        );
      }

      if (editingTransaction) {
        const originalTransferId = editingTransaction.originalId;
        const oldAmount = parseFloat(editingTransaction.amount);
        
        let revertFromId, revertToId;
        if (editingTransaction.transferDirection === 'from') {
          revertFromId = editingTransaction.accountId;
          revertToId = editingTransaction.relatedAccountId;
        } else {
          revertFromId = editingTransaction.relatedAccountId;
          revertToId = editingTransaction.accountId;
        }

        const revertFrom = accounts.find((a) => a.id === revertFromId);
        const revertTo = accounts.find((a) => a.id === revertToId);

        if (revertFrom) {
          await updateAccount(user.uid, revertFrom.id, {
            balance: revertFrom.balance + oldAmount,
          });
        }
        if (revertTo) {
          await updateAccount(user.uid, revertTo.id, {
            balance: revertTo.balance - oldAmount,
          });
        }

        const fromAccountAfterRevert = revertFrom?.id === from.id
          ? { ...from, balance: revertFrom.balance + oldAmount }
          : from;

        const availableAfterRevert = await getAvailableBalance(
          user.uid, 
          fromAccountAfterRevert.id, 
          fromAccountAfterRevert.balance
        );

        if (amount > availableAfterRevert) {
          if (revertFrom) {
            await updateAccount(user.uid, revertFrom.id, { balance: revertFrom.balance });
          }
          if (revertTo) {
            await updateAccount(user.uid, revertTo.id, { balance: revertTo.balance });
          }
          setSubmitting(false);
          setCheckingBalance(false);
          return showToast('Insufficient available balance after reverting', 'error');
        }

        await updateDoc(
          doc(db, 'users', user.uid, 'transfers', originalTransferId),
          {
            fromAccountId: transferData.fromAccountId,
            fromAccountName: from.name,
            toAccountId: transferData.toAccountId,
            toAccountName: to.name,
            amount,
            description: transferData.description || '',
            date: transferData.date,
            updatedAt: Timestamp.now(),
          }
        );

        const fromFinalBalance = revertFrom?.id === from.id
          ? revertFrom.balance + oldAmount - amount
          : from.balance - amount;
        
        const toFinalBalance = revertTo?.id === to.id
          ? revertTo.balance - oldAmount + amount
          : to.balance + amount;

        await updateAccount(user.uid, from.id, { balance: fromFinalBalance });
        await updateAccount(user.uid, to.id, { balance: toFinalBalance });

        showToast('Transfer updated', 'success');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'transfers'), {
          fromAccountId: transferData.fromAccountId,
          fromAccountName: from.name,
          toAccountId: transferData.toAccountId,
          toAccountName: to.name,
          amount,
          description: transferData.description || '',
          date: transferData.date,
          createdAt: Timestamp.now(),
        });

        await updateAccount(user.uid, from.id, { balance: from.balance - amount });
        await updateAccount(user.uid, to.id, { balance: to.balance + amount });

        showToast('Transfer completed', 'success');
      }

      await loadData();
      closeModal();
    } catch (err) {
      console.error(err);
      showToast('Error saving transfer', 'error');
    } finally {
      setSubmitting(false);
      setCheckingBalance(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;

    try {
      if (transactionToDelete.isTransfer) {
        const originalTransferId = transactionToDelete.originalId;
        
        let fromAccountId, toAccountId;
        if (transactionToDelete.transferDirection === 'from') {
          fromAccountId = transactionToDelete.accountId;
          toAccountId = transactionToDelete.relatedAccountId;
        } else {
          fromAccountId = transactionToDelete.relatedAccountId;
          toAccountId = transactionToDelete.accountId;
        }

        const from = accounts.find((a) => a.id === fromAccountId);
        const to = accounts.find((a) => a.id === toAccountId);

        if (from) {
          await updateAccount(user.uid, from.id, {
            balance: from.balance + transactionToDelete.amount,
          });
        }
        if (to) {
          await updateAccount(user.uid, to.id, {
            balance: to.balance - transactionToDelete.amount,
          });
        }

        await deleteDoc(doc(db, 'users', user.uid, 'transfers', originalTransferId));
      } else {
        const acc = accounts.find((a) => a.id === transactionToDelete.accountId);
        if (acc) {
          const newBal =
            transactionToDelete.type === 'Income'
              ? acc.balance - transactionToDelete.amount
              : acc.balance + transactionToDelete.amount;
          await updateAccount(user.uid, acc.id, { balance: newBal });
        }

        await deleteDoc(doc(db, 'users', user.uid, 'transactions', transactionToDelete.id));
      }

      showToast('Deleted successfully', 'success');
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Delete failed', 'error');
    } finally {
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    }
  };

  const handleEdit = (record) => {
    setEditingTransaction(record);

    if (record.isTransfer) {
      setModalTab('transfer');
      if (record.transferDirection === 'from') {
        setTransferData({
          fromAccountId: record.accountId,
          toAccountId: record.relatedAccountId,
          amount: record.amount.toString(),
          description: record.description || '',
          date: record.date,
        });
      } else {
        setTransferData({
          fromAccountId: record.relatedAccountId,
          toAccountId: record.accountId,
          amount: record.amount.toString(),
          description: record.description || '',
          date: record.date,
        });
      }
    } else {
      setModalTab(record.type.toLowerCase());
      setFormData({
        type: record.type,
        amount: record.amount.toString(),
        accountId: record.accountId,
        categoryId: record.categoryId,
        description: record.description || '',
        date: record.date,
      });
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
    setModalTab('expense');
    setSubmitting(false);
    setCheckingBalance(false);
    setHasFees(false);
    setFeeAmount('');
    setFeeAccountId('');
    setFeeCategoryId('');
    setShowAddCat(false);
    setNewCatName('');
    setNewCatColor('#6B7280');
    setFormData({
      type: 'Expense',
      amount: '',
      accountId: accounts[0]?.id || '',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setTransferData({
      fromAccountId: accounts[0]?.id || '',
      toAccountId: accounts[1]?.id || '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || 'Unknown';
  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || 'Unknown';
  const getCategoryColor = (id) => categories.find((c) => c.id === id)?.color || '#6B7280';
  const isRibaCategory = (categoryId) => {
    const name = (categories.find(c => c.id === categoryId)?.name || '').toLowerCase();
    return name.includes('riba') || name.includes('interest');
  };
  const getAccountAvailable = (id) => accountsWithAvailable.find((a) => a.id === id)?.availableBalance || 0;

  const getDateRangeForFilter = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    let range;
    switch (dateFilter) {
      case 'Daily':
        const todayStr = formatDateToISO(now);
        range = { start: todayStr, end: todayStr };
        break;
        
      case 'Weekly':
        const dayOfWeek = now.getDay();
        const daysFromSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1);
        
        const weekStart = new Date(now);
        weekStart.setDate(day - daysFromSaturday);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        range = {
          start: formatDateToISO(weekStart),
          end: formatDateToISO(weekEnd),
        };
        break;
        
      case 'Monthly':
        const monthStart = new Date(year, month, 1, 12, 0, 0);
        const monthEnd = new Date(year, month + 1, 0, 12, 0, 0);
        
        range = {
          start: formatDateToISO(monthStart),
          end: formatDateToISO(monthEnd),
        };
        break;
        
      case 'Yearly':
        const yearStart = new Date(year, 0, 1, 12, 0, 0);
        const yearEnd = new Date(year, 11, 31, 12, 0, 0);
        
        range = {
          start: formatDateToISO(yearStart),
          end: formatDateToISO(yearEnd),
        };
        break;
        
      case 'Custom':
        range = customDateRange.start && customDateRange.end ? customDateRange : null;
        break;
        
      default:
        range = null;
    }
    
    return range;
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'All' && t.type !== filterType) return false;

    if (filterAccount !== 'All') {
      if (t.accountId !== filterAccount) return false;
    }

    const range = getDateRangeForFilter();
    if (range) {
      if (t.date < range.start || t.date > range.end) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const desc = (t.description || '').toLowerCase();
      let match = desc.includes(q) || String(t.amount).includes(q);

      if (!t.isTransfer) {
        match ||= getCategoryName(t.categoryId).toLowerCase().includes(q);
      }
      match ||= getAccountName(t.accountId).toLowerCase().includes(q);

      if (!match) return false;
    }
    return true;
  });

  const grouped = filteredTransactions.reduce((acc, t) => {
    const d = t.date;
    if (!acc[d]) acc[d] = { records: [], dayIncome: 0, dayExpense: 0 };
    acc[d].records.push(t);
    if (t.type === 'Income') acc[d].dayIncome += Number(t.amount || 0);
    if (t.type === 'Expense') acc[d].dayExpense += Number(t.amount || 0);
    return acc;
  }, {});

  const getDisabledReason = () => {
    if (accounts.length === 0 && categories.length === 0) {
      return 'Please add accounts and categories first';
    }
    if (accounts.length === 0) {
      return 'Please add at least one account first';
    }
    if (categories.length === 0) {
      return 'Please add at least one category first';
    }
    return null;
  };

  const isButtonDisabled = accounts.length === 0 || categories.length === 0;
  const disabledReason = getDisabledReason();

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">Track your income, expenses and transfers</p>
        </div>
        <div className="relative group">
          <button
            onClick={() => setShowModal(true)}
            disabled={isButtonDisabled}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Plus size={16} />
            Add Transaction
          </button>
          
          {isButtonDisabled && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p>{disabledReason}</p>
              </div>
              <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Balance</p>
            <Wallet size={14} className="text-gray-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">৳{totalBalance.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Income</p>
            <ArrowUpCircle size={14} className="text-green-500" />
          </div>
          <p className="text-xl font-bold text-green-600">৳{summaryIncome.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">Excluding transfers</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Expense</p>
            <ArrowDownCircle size={14} className="text-red-500" />
          </div>
          <p className="text-xl font-bold text-red-600">৳{summaryExpense.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">Excluding transfers</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Net</p>
            <Receipt size={14} className="text-gray-400" />
          </div>
          <p className={`text-xl font-bold ${summaryNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ৳{Math.abs(summaryNet).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Individual Account Balances */}
      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
        {accountsWithAvailable.map((acc) => (
          <div
            key={acc.id}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 min-w-[160px] flex flex-col justify-center"
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">
              {acc.name}
            </p>
            <p className="text-sm font-black text-gray-900 truncate">
              ৳{(acc.balance || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-green-600 font-medium">
              Available: ৳{(acc.availableBalance || 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
        
      {/* Filters - keeping exact same as original */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-1">
              {['All', 'Income', 'Expense'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`flex-1 py-1.5 text-xs rounded transition ${
                    filterType === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="All">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== 'Custom') setCustomDateRange({ start: '', end: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="Daily">Today</option>
              <option value="Weekly">This Week</option>
              <option value="Monthly">This Month</option>
              <option value="Yearly">This Year</option>
              <option value="All">All Time</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {dateFilter === 'Custom' && (
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange((p) => ({ ...p, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange((p) => ({ ...p, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions List - keeping exact same */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
          No records found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden max-h-[65vh] overflow-y-auto">
          {Object.entries(grouped).map(([date, { records, dayIncome, dayExpense }]) => (
            <div key={date}>
              <div className="sticky top-0 bg-gray-50 px-4 py-2.5 flex justify-between items-center z-10 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-500" />
                  <span className="text-sm font-medium">{formatDate(date)}</span>
                </div>
                <div className="flex gap-5 text-xs">
                  <span className="text-green-600 font-medium">+৳{dayIncome.toLocaleString()}</span>
                  <span className="text-red-600 font-medium">-৳{dayExpense.toLocaleString()}</span>
                </div>
              </div>

              {records.map((t) => (
                <div
                  key={t.id}
                  className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3 border-b border-gray-100 last:border-b-0 group"
                >
                  {/* Clickable info area → opens detail popup */}
                  <button
                    type="button"
                    onClick={() => setViewingTransaction(t)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        t.isTransfer ? 'bg-blue-50' : t.type === 'Income' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {t.isTransfer ? (
                        <ArrowRightLeft size={15} className="text-blue-500" />
                      ) : t.type === 'Income' ? (
                        <ArrowUpCircle size={16} className="text-green-600" />
                      ) : (
                        <ArrowDownCircle size={16} className="text-red-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {!t.isTransfer && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(t.categoryId) }} />
                        )}
                        <p className="text-sm font-medium truncate">
                          {t.isTransfer
                            ? (t.type === 'Income'
                                ? `From ${t.relatedAccountName}`
                                : `To ${t.relatedAccountName}`)
                            : getCategoryName(t.categoryId)
                          }
                        </p>
                        {t.isFee && <span className="text-[9px] bg-orange-100 text-orange-600 font-bold px-1 rounded">FEE</span>}
                        {t.isRiba && <span className="text-[9px] bg-amber-100 text-amber-600 font-bold px-1 rounded">RIBA</span>}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {getAccountName(t.accountId)}{t.description ? ` · ${t.description}` : ''}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className={`text-sm font-bold ${
                      t.isTransfer ? 'text-blue-600' : t.type === 'Income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.type === 'Income' ? '+' : '-'}৳{Number(t.amount).toLocaleString()}
                    </p>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleEdit(t)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit2 size={13} className="text-gray-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTransactionToDelete(t); setShowDeleteModal(true); }}
                        className="p-1.5 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={13} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={modalTab === 'transfer' ? handleTransferSubmit : handleSubmit} className="space-y-4">
              {!editingTransaction && (
                <div className="flex bg-gray-100 p-1 rounded-md">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab('income');
                      setFormData(p => ({ ...p, type: 'Income', categoryId: '' }));
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-all ${
                      modalTab === 'income'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab('expense');
                      setFormData(p => ({ ...p, type: 'Expense', categoryId: '' }));
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-all ${
                      modalTab === 'expense'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (accounts.length < 2) {
                        showToast('Need at least 2 accounts for transfer', 'error');
                        return;
                      }
                      setModalTab('transfer');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-all ${
                      modalTab === 'transfer'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    } ${accounts.length < 2 ? 'opacity-50' : ''}`}
                  >
                    Transfer
                  </button>
                </div>
              )}

              {modalTab === 'transfer' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase ml-1 text-blue-600">
                      Amount (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={transferData.amount}
                      onChange={(e) => setTransferData(p => ({ ...p, amount: e.target.value }))}
                      className="w-full border-2 rounded-lg p-3 text-2xl font-bold text-center outline-none transition-colors bg-blue-50 text-blue-600 border-blue-100 focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">
                        From Account
                      </label>
                      <select
                        value={transferData.fromAccountId}
                        onChange={(e) => setTransferData(p => ({ ...p, fromAccountId: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        required
                        disabled={submitting}
                      >
                        {accountsWithAvailable.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} (Avail: ৳{(a.availableBalance || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-blue-500 uppercase mb-1 block ml-1">
                        To Account
                      </label>
                      <select
                        value={transferData.toAccountId}
                        onChange={(e) => setTransferData(p => ({ ...p, toAccountId: e.target.value }))}
                        className="w-full bg-blue-50 border-blue-100 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                        required
                        disabled={submitting}
                      >
                        <option value="">Select Destination</option>
                        {accountsWithAvailable.filter(a => a.id !== transferData.fromAccountId).map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={transferData.date}
                        onChange={(e) => setTransferData(p => ({ ...p, date: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">
                        Note
                      </label>
                      <input
                        type="text"
                        value={transferData.description}
                        onChange={(e) => setTransferData(p => ({ ...p, description: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. Savings..."
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 text-white rounded-lg text-sm font-bold shadow-lg transition-all mt-2 uppercase tracking-widest bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>{checkingBalance ? 'Checking...' : 'Confirming...'}</span>
                      </>
                    ) : (
                      <span>{editingTransaction ? 'Update Transfer' : 'Confirm Transfer'}</span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase ml-1 ${
                      modalTab === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Amount (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                      className={`w-full border-2 rounded-lg p-3 text-2xl font-bold text-center outline-none transition-colors ${
                        modalTab === 'income'
                          ? 'bg-green-50 text-green-600 border-green-100 focus:ring-green-500'
                          : 'bg-red-50 text-red-600 border-red-100 focus:ring-red-500'
                      } focus:ring-1`}
                      placeholder="0.00"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">
                        Account
                      </label>
                      <select
                        value={formData.accountId}
                        onChange={(e) => setFormData(p => ({ ...p, accountId: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        required
                        disabled={submitting}
                      >
                        {accountsWithAvailable.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} (Avail: ৳{(a.availableBalance || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`text-[10px] font-bold uppercase mb-1 block ml-1 ${
                        modalTab === 'income' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        Category
                      </label>
                      {!showAddCat ? (
                        <div className="flex gap-1">
                          <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                            className={`flex-1 rounded-lg p-2.5 text-xs font-bold focus:ring-1 outline-none border ${
                              modalTab === 'income'
                                ? 'bg-green-50 border-green-100 focus:ring-green-500'
                                : 'bg-red-50 border-red-100 focus:ring-red-500'
                            }`}
                            required
                            disabled={submitting}
                          >
                            <option value="">Select Category</option>
                            {categories
                              .filter(c => c.type?.toLowerCase() === formData.type.toLowerCase())
                              .map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowAddCat(true)}
                            title="Add new category"
                            className="px-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-lg font-bold flex-shrink-0"
                          >+</button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newCatName}
                              onChange={e => setNewCatName(e.target.value)}
                              placeholder="Category name…"
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-400"
                              autoFocus
                              disabled={addingCat}
                            />
                            <input
                              type="color"
                              value={newCatColor}
                              onChange={e => setNewCatColor(e.target.value)}
                              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
                              title="Pick colour"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={addingCat || !newCatName.trim()}
                              onClick={async () => {
                                if (!newCatName.trim()) return;
                                setAddingCat(true);
                                try {
                                  const { addCategory } = await import('@/lib/firestoreCollections');
                                  const res = await addCategory(user.uid, {
                                    name: newCatName.trim(),
                                    type: formData.type,
                                    color: newCatColor,
                                  });
                                  if (res.success) {
                                    await loadCategories();
                                    setFormData(p => ({ ...p, categoryId: res.id }));
                                    showToast(`"${newCatName.trim()}" added`, 'success');
                                    setShowAddCat(false);
                                    setNewCatName('');
                                    setNewCatColor('#6B7280');
                                  }
                                } catch(err) {
                                  showToast('Failed to add category', 'error');
                                } finally {
                                  setAddingCat(false);
                                }
                              }}
                              className="flex-1 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                            >{addingCat ? 'Saving…' : 'Save'}</button>
                            <button
                              type="button"
                              onClick={() => { setShowAddCat(false); setNewCatName(''); setNewCatColor('#6B7280'); }}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg"
                            >Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">
                        Note
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. Rent, Salary..."
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Fees & Charges toggle — only for expense tab */}
                  {modalTab === 'expense' && (
                    <div className="border border-dashed border-orange-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setHasFees(p => !p)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-orange-50 text-orange-700 text-xs font-bold hover:bg-orange-100 transition-colors"
                      >
                        <span>+ Fees / Charges</span>
                        <span className="text-orange-400">{hasFees ? '▲ Hide' : '▼ Show'}</span>
                      </button>
                      {hasFees && (
                        <div className="p-3 space-y-2 bg-white">
                          <p className="text-[10px] text-gray-400">A separate expense entry will be recorded for this fee.</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-orange-500 uppercase block mb-1">Fee Amount (৳)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={feeAmount}
                                onChange={e => setFeeAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-400"
                                disabled={submitting}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Fee Account</label>
                              <select
                                value={feeAccountId || formData.accountId}
                                onChange={e => setFeeAccountId(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-400"
                                disabled={submitting}
                              >
                                {accountsWithAvailable.map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Fee Category</label>
                            <select
                              value={feeCategoryId}
                              onChange={e => setFeeCategoryId(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-400"
                              disabled={submitting}
                            >
                              <option value="">Select Category</option>
                              {categories.filter(c => c.type?.toLowerCase() === 'expense').map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-4 text-white rounded-lg text-sm font-bold shadow-lg transition-all mt-2 uppercase tracking-widest ${
                      modalTab === 'income'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>{checkingBalance ? 'Checking...' : 'Confirming...'}</span>
                      </>
                    ) : (
                      <span>{editingTransaction ? 'Update' : `Confirm ${modalTab === 'income' ? 'Income' : 'Expense'}`}</span>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── Transaction Detail Popup ─────────────────────────────────────────── */}
      {viewingTransaction && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">
            {/* Colour-coded header */}
            <div className={`px-5 pt-5 pb-4 ${
              viewingTransaction.isTransfer ? 'bg-blue-600'
              : viewingTransaction.type === 'Income' ? 'bg-green-600'
              : 'bg-red-600'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/75 text-[10px] font-bold uppercase tracking-widest">
                  {viewingTransaction.isTransfer ? 'Transfer' : viewingTransaction.type}
                  {viewingTransaction.isFee ? ' · Fee/Charge' : ''}
                  {viewingTransaction.isRiba ? ' · Riba' : ''}
                </span>
                <button type="button" onClick={() => setViewingTransaction(null)} className="text-white/70 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <p className="text-white text-3xl font-black">
                {viewingTransaction.type === 'Income' ? '+' : '-'}৳{Number(viewingTransaction.amount).toLocaleString()}
              </p>
              <p className="text-white/80 text-sm mt-0.5 font-medium">
                {viewingTransaction.isTransfer
                  ? (viewingTransaction.type === 'Income'
                      ? `Transfer from ${viewingTransaction.relatedAccountName}`
                      : `Transfer to ${viewingTransaction.relatedAccountName}`)
                  : getCategoryName(viewingTransaction.categoryId)}
              </p>
            </div>

            {/* Detail rows */}
            <div className="px-5 py-4 space-y-3.5">
              <_TxnDetailRow label="Date"
                value={new Date(viewingTransaction.date).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                icon={<Calendar size={14} className="text-gray-400" />} />
              <_TxnDetailRow label="Account"
                value={getAccountName(viewingTransaction.accountId)}
                icon={<Wallet size={14} className="text-gray-400" />} />
              {!viewingTransaction.isTransfer && viewingTransaction.categoryId && (
                <_TxnDetailRow label="Category"
                  value={getCategoryName(viewingTransaction.categoryId)}
                  dot={getCategoryColor(viewingTransaction.categoryId)} />
              )}
              {viewingTransaction.isTransfer && (
                <_TxnDetailRow
                  label={viewingTransaction.type === 'Income' ? 'From Account' : 'To Account'}
                  value={viewingTransaction.relatedAccountName}
                  icon={<ArrowRightLeft size={14} className="text-blue-400" />} />
              )}
              {viewingTransaction.description && (
                <_TxnDetailRow label="Note"
                  value={viewingTransaction.description}
                  icon={<Receipt size={14} className="text-gray-400" />} />
              )}
              {viewingTransaction.isRiba && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-semibold">Riba / Interest — purify via Sadaqah</p>
                </div>
              )}
              {viewingTransaction.isFee && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  <AlertCircle size={13} className="text-orange-500 flex-shrink-0" />
                  <p className="text-xs text-orange-700 font-semibold">Fee / Charge entry</p>
                </div>
              )}
              {viewingTransaction.isZakatPayment && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <Receipt size={13} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 font-semibold">Zakat payment</p>
                </div>
              )}
              {viewingTransaction.createdAt?.toDate && (
                <_TxnDetailRow label="Recorded"
                  value={viewingTransaction.createdAt.toDate().toLocaleString('en-BD')}
                  icon={<Calendar size={13} className="text-gray-300" />} />
              )}
            </div>

            {/* Actions */}
            {!viewingTransaction.isTransfer && (
              <div className="px-5 pb-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setViewingTransaction(null); handleEdit(viewingTransaction); }}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 flex items-center justify-center gap-1.5"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => { setViewingTransaction(null); setTransactionToDelete(viewingTransaction); setShowDeleteModal(true); }}
                  className="flex-1 py-2.5 bg-red-50 border-2 border-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
            {viewingTransaction.isTransfer && (
              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => { setViewingTransaction(null); setTransactionToDelete(viewingTransaction); setShowDeleteModal(true); }}
                  className="w-full py-2.5 bg-red-50 border-2 border-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Delete Transfer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <AlertTriangle size={36} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Delete this record?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. Balances will be adjusted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Reusable detail row for the transaction detail popup ────────────────────
function _TxnDetailRow({ label, value, icon, dot }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {dot && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: dot }} />}
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{label}</span>
      </div>
      <span className="text-sm text-gray-800 font-semibold text-right break-words max-w-[58%]">{value}</span>
    </div>
  );
}
