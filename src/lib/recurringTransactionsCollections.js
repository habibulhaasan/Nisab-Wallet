// src/lib/recurringTransactionsCollections.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { getAvailableBalance } from './goalUtils';
import { getAccounts, updateAccount } from './firestoreCollections';

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================
// RECURRING TRANSACTIONS CRUD
// ============================================

export const recurringTransactionsCollection = (userId) => 
  collection(db, 'users', userId, 'recurringTransactions');

export const recurringLogsCollection = (userId) => 
  collection(db, 'users', userId, 'recurringLogs');

// Calculate next due date based on frequency
export const calculateNextDueDate = (currentDate, frequency, interval = 1, dayOfWeek = null, dayOfMonth = null) => {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + interval);
      break;
      
    case 'weekly':
      date.setDate(date.getDate() + (7 * interval));
      break;
      
    case 'monthly':
      const targetDay = dayOfMonth || date.getDate();
      date.setMonth(date.getMonth() + interval);
      
      // Handle month-end cases (e.g., Jan 31 -> Feb 28)
      const maxDayInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(targetDay, maxDayInMonth));
      break;
      
    case 'yearly':
      date.setFullYear(date.getFullYear() + interval);
      break;
      
    default:
      break;
  }
  
  return date.toISOString().split('T')[0];
};

// Create Recurring Transaction
export const addRecurringTransaction = async (userId, data) => {
  try {
    const recurringId = generateId();
    
    const docRef = await addDoc(recurringTransactionsCollection(userId), {
      recurringId,
      type: data.type, // 'income' or 'expense'
      amount: parseFloat(data.amount),
      accountId: data.accountId,
      categoryId: data.categoryId,
      frequency: data.frequency, // daily/weekly/monthly/yearly/custom
      interval: parseInt(data.interval) || 1,
      dayOfWeek: data.dayOfWeek || null, // For weekly
      dayOfMonth: data.dayOfMonth || null, // For monthly
      customDates: data.customDates || [], // For custom
      startDate: data.startDate,
      endCondition: data.endCondition, // never/until/after
      endDate: data.endDate || null,
      occurrences: data.occurrences ? parseInt(data.occurrences) : null,
      completedCount: 0,
      status: 'active', // active/paused/completed/deleted
      nextDueDate: data.startDate,
      description: data.description || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return { success: true, id: docRef.id, recurringId };
  } catch (error) {
    console.error('Error adding recurring transaction:', error);
    return { success: false, error: error.message };
  }
};

// Get all Recurring Transactions
export const getRecurringTransactions = async (userId, statusFilter = null) => {
  try {
    let q;
    if (statusFilter) {
      q = query(
        recurringTransactionsCollection(userId),
        where('status', '==', statusFilter),
        orderBy('nextDueDate', 'asc')
      );
    } else {
      q = query(
        recurringTransactionsCollection(userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    const transactions = [];
    snapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, transactions };
  } catch (error) {
    console.error('Error getting recurring transactions:', error);
    return { success: false, error: error.message, transactions: [] };
  }
};

// Get single Recurring Transaction
export const getRecurringTransaction = async (userId, docId) => {
  try {
    const docRef = doc(db, 'users', userId, 'recurringTransactions', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, transaction: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Recurring transaction not found' };
    }
  } catch (error) {
    console.error('Error getting recurring transaction:', error);
    return { success: false, error: error.message };
  }
};

// Update Recurring Transaction
export const updateRecurringTransaction = async (userId, docId, data) => {
  try {
    const docRef = doc(db, 'users', userId, 'recurringTransactions', docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating recurring transaction:', error);
    return { success: false, error: error.message };
  }
};

// Pause Recurring Transaction
export const pauseRecurringTransaction = async (userId, docId) => {
  return updateRecurringTransaction(userId, docId, { status: 'paused' });
};

// Resume Recurring Transaction
export const resumeRecurringTransaction = async (userId, docId) => {
  return updateRecurringTransaction(userId, docId, { status: 'active' });
};

// Delete Recurring Transaction
export const deleteRecurringTransaction = async (userId, docId, deleteTransactions = false) => {
  try {
    const batch = writeBatch(db);
    
    if (deleteTransactions) {
      // Get all logs for this recurring transaction
      const logsQuery = query(
        recurringLogsCollection(userId),
        where('recurringId', '==', docId)
      );
      const logsSnapshot = await getDocs(logsQuery);
      
      // Delete associated transactions
      const transactionsToDelete = [];
      logsSnapshot.forEach((logDoc) => {
        const log = logDoc.data();
        if (log.transactionId) {
          transactionsToDelete.push(log.transactionId);
        }
      });
      
      // Delete transactions
      for (const txnId of transactionsToDelete) {
        const txnRef = doc(db, 'users', userId, 'transactions', txnId);
        batch.delete(txnRef);
      }
      
      // Delete logs
      logsSnapshot.forEach((logDoc) => {
        batch.delete(logDoc.ref);
      });
    }
    
    // Delete recurring transaction
    const recurringRef = doc(db, 'users', userId, 'recurringTransactions', docId);
    batch.delete(recurringRef);
    
    await batch.commit();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting recurring transaction:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// RECURRING LOGS CRUD
// ============================================

// Create Execution Log
export const addRecurringLog = async (userId, logData) => {
  try {
    const logId = generateId();
    
    const docRef = await addDoc(recurringLogsCollection(userId), {
      logId,
      recurringId: logData.recurringId,
      recurringDocId: logData.recurringDocId,
      dueDate: logData.dueDate,
      status: logData.status, // success/failed/pending/skipped
      transactionId: logData.transactionId || null,
      failureReason: logData.failureReason || null,
      amount: logData.amount,
      executedAt: logData.executedAt || serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    
    return { success: true, id: docRef.id, logId };
  } catch (error) {
    console.error('Error adding recurring log:', error);
    return { success: false, error: error.message };
  }
};

// Get Logs for Recurring Transaction
export const getRecurringLogs = async (userId, recurringDocId) => {
  try {
    const q = query(
      recurringLogsCollection(userId),
      where('recurringDocId', '==', recurringDocId),
      orderBy('dueDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const logs = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, logs };
  } catch (error) {
    console.error('Error getting recurring logs:', error);
    return { success: false, error: error.message, logs: [] };
  }
};

// Get Pending Approval Logs
export const getPendingApprovalLogs = async (userId) => {
  try {
    const q = query(
      recurringLogsCollection(userId),
      where('status', '==', 'pending'),
      orderBy('dueDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const logs = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, logs };
  } catch (error) {
    console.error('Error getting pending logs:', error);
    return { success: false, error: error.message, logs: [] };
  }
};

// ============================================
// PROCESS RECURRING TRANSACTIONS
// ============================================

// Process a single recurring transaction
export const processRecurringTransaction = async (userId, recurringDocId, recurring, accounts) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if it's time to process
  if (recurring.nextDueDate > today || recurring.status !== 'active') {
    return { success: true, skipped: true, reason: 'Not due yet or not active' };
  }
  
  // Check if already processed today
  const logsQuery = query(
    recurringLogsCollection(userId),
    where('recurringDocId', '==', recurringDocId),
    where('dueDate', '==', recurring.nextDueDate)
  );
  const existingLogs = await getDocs(logsQuery);
  
  if (!existingLogs.empty) {
    return { success: true, skipped: true, reason: 'Already processed' };
  }
  
  // Get account
  const account = accounts.find(a => a.id === recurring.accountId);
  if (!account) {
    await addRecurringLog(userId, {
      recurringId: recurring.recurringId,
      recurringDocId,
      dueDate: recurring.nextDueDate,
      status: 'failed',
      failureReason: 'Account not found',
      amount: recurring.amount,
    });
    return { success: false, error: 'Account not found' };
  }
  
  // Check available balance for expenses
  if (recurring.type === 'expense') {
    const availableBalance = await getAvailableBalance(userId, account.id, account.balance);
    
    if (recurring.amount > availableBalance) {
      // Insufficient balance - create pending log
      await addRecurringLog(userId, {
        recurringId: recurring.recurringId,
        recurringDocId,
        dueDate: recurring.nextDueDate,
        status: 'pending',
        failureReason: 'insufficient_balance',
        amount: recurring.amount,
      });
      
      return { 
        success: false, 
        pending: true, 
        error: 'Insufficient balance',
        availableBalance,
        required: recurring.amount
      };
    }
  }
  
  // Create transaction
  try {
    const transactionId = generateId();
    const transactionRef = doc(collection(db, 'users', userId, 'transactions'));
    
    await addDoc(collection(db, 'users', userId, 'transactions'), {
      transactionId,
      type: recurring.type,
      amount: recurring.amount,
      accountId: recurring.accountId,
      categoryId: recurring.categoryId,
      date: recurring.nextDueDate,
      description: recurring.description || `Recurring: ${recurring.description}`,
      recurringId: recurring.recurringId,
      createdAt: serverTimestamp(),
    });
    
    // Update account balance
    const newBalance = recurring.type === 'income'
      ? account.balance + recurring.amount
      : account.balance - recurring.amount;
    
    await updateAccount(userId, account.id, { balance: newBalance });
    
    // Create success log
    await addRecurringLog(userId, {
      recurringId: recurring.recurringId,
      recurringDocId,
      dueDate: recurring.nextDueDate,
      status: 'success',
      transactionId,
      amount: recurring.amount,
    });
    
    // Calculate next due date
    const nextDueDate = calculateNextDueDate(
      recurring.nextDueDate,
      recurring.frequency,
      recurring.interval,
      recurring.dayOfWeek,
      recurring.dayOfMonth
    );
    
    // Update recurring transaction
    const updateData = {
      completedCount: recurring.completedCount + 1,
      nextDueDate,
    };
    
    // Check if completed
    if (recurring.endCondition === 'after' && recurring.completedCount + 1 >= recurring.occurrences) {
      updateData.status = 'completed';
    } else if (recurring.endCondition === 'until' && nextDueDate > recurring.endDate) {
      updateData.status = 'completed';
    }
    
    await updateRecurringTransaction(userId, recurringDocId, updateData);
    
    return { success: true, transactionId };
  } catch (error) {
    console.error('Error processing recurring transaction:', error);
    
    await addRecurringLog(userId, {
      recurringId: recurring.recurringId,
      recurringDocId,
      dueDate: recurring.nextDueDate,
      status: 'failed',
      failureReason: error.message,
      amount: recurring.amount,
    });
    
    return { success: false, error: error.message };
  }
};

// Process all due recurring transactions
export const processAllRecurringTransactions = async (userId) => {
  try {
    // Get all active recurring transactions
    const result = await getRecurringTransactions(userId, 'active');
    if (!result.success) return result;
    
    // Get all accounts
    const accountsResult = await getAccounts(userId);
    if (!accountsResult.success) return accountsResult;
    
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      pending: 0,
      skipped: 0,
      details: [],
    };
    
    for (const recurring of result.transactions) {
      const processResult = await processRecurringTransaction(
        userId, 
        recurring.id, 
        recurring, 
        accountsResult.accounts
      );
      
      results.processed++;
      
      if (processResult.success) {
        if (processResult.skipped) {
          results.skipped++;
        } else {
          results.succeeded++;
        }
      } else {
        if (processResult.pending) {
          results.pending++;
        } else {
          results.failed++;
        }
      }
      
      results.details.push({
        recurringId: recurring.recurringId,
        description: recurring.description,
        ...processResult,
      });
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
    return { success: false, error: error.message };
  }
};

// Manually approve and execute pending transaction
export const approveRecurringTransaction = async (userId, logDocId, recurringDocId) => {
  try {
    // Get the log
    const logRef = doc(db, 'users', userId, 'recurringLogs', logDocId);
    const logDoc = await getDoc(logRef);
    
    if (!logDoc.exists()) {
      return { success: false, error: 'Log not found' };
    }
    
    const log = logDoc.data();
    
    if (log.status !== 'pending') {
      return { success: false, error: 'Log is not pending' };
    }
    
    // Get recurring transaction
    const recurringResult = await getRecurringTransaction(userId, recurringDocId);
    if (!recurringResult.success) return recurringResult;
    
    const recurring = recurringResult.transaction;
    
    // Get accounts
    const accountsResult = await getAccounts(userId);
    if (!accountsResult.success) return accountsResult;
    
    const account = accountsResult.accounts.find(a => a.id === recurring.accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }
    
    // Re-check balance
    const availableBalance = await getAvailableBalance(userId, account.id, account.balance);
    
    if (recurring.amount > availableBalance) {
      return { 
        success: false, 
        error: 'Still insufficient balance',
        availableBalance,
        required: recurring.amount
      };
    }
    
    // Create transaction
    const transactionId = generateId();
    
    await addDoc(collection(db, 'users', userId, 'transactions'), {
      transactionId,
      type: recurring.type,
      amount: recurring.amount,
      accountId: recurring.accountId,
      categoryId: recurring.categoryId,
      date: log.dueDate,
      description: recurring.description || `Recurring: ${recurring.description}`,
      recurringId: recurring.recurringId,
      createdAt: serverTimestamp(),
    });
    
    // Update account balance
    const newBalance = recurring.type === 'income'
      ? account.balance + recurring.amount
      : account.balance - recurring.amount;
    
    await updateAccount(userId, account.id, { balance: newBalance });
    
    // Update log to success
    await updateDoc(logRef, {
      status: 'success',
      transactionId,
      executedAt: serverTimestamp(),
    });
    
    // Calculate next due date if needed
    const nextDueDate = calculateNextDueDate(
      log.dueDate,
      recurring.frequency,
      recurring.interval,
      recurring.dayOfWeek,
      recurring.dayOfMonth
    );
    
    // Update recurring transaction
    const updateData = {
      completedCount: recurring.completedCount + 1,
      nextDueDate,
    };
    
    // Check if completed
    if (recurring.endCondition === 'after' && recurring.completedCount + 1 >= recurring.occurrences) {
      updateData.status = 'completed';
    } else if (recurring.endCondition === 'until' && nextDueDate > recurring.endDate) {
      updateData.status = 'completed';
    }
    
    await updateRecurringTransaction(userId, recurringDocId, updateData);
    
    return { success: true, transactionId };
  } catch (error) {
    console.error('Error approving recurring transaction:', error);
    return { success: false, error: error.message };
  }
};

// Skip pending transaction
export const skipRecurringTransaction = async (userId, logDocId, recurringDocId) => {
  try {
    // Get the log
    const logRef = doc(db, 'users', userId, 'recurringLogs', logDocId);
    const logDoc = await getDoc(logRef);
    
    if (!logDoc.exists()) {
      return { success: false, error: 'Log not found' };
    }
    
    const log = logDoc.data();
    
    if (log.status !== 'pending') {
      return { success: false, error: 'Log is not pending' };
    }
    
    // Update log to skipped
    await updateDoc(logRef, {
      status: 'skipped',
      failureReason: 'User skipped',
      executedAt: serverTimestamp(),
    });
    
    // Get recurring transaction and update next due date
    const recurringResult = await getRecurringTransaction(userId, recurringDocId);
    if (!recurringResult.success) return recurringResult;
    
    const recurring = recurringResult.transaction;
    
    const nextDueDate = calculateNextDueDate(
      log.dueDate,
      recurring.frequency,
      recurring.interval,
      recurring.dayOfWeek,
      recurring.dayOfMonth
    );
    
    await updateRecurringTransaction(userId, recurringDocId, {
      nextDueDate,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error skipping recurring transaction:', error);
    return { success: false, error: error.message };
  }
};