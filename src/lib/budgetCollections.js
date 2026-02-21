// src/lib/budgetCollections.js

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './firestoreCollections';

// ============================================
// BUDGETS
// ============================================

export const budgetsCollection = (userId) =>
  collection(db, 'users', userId, 'budgets');

/**
 * Add a budget
 */
export const addBudget = async (userId, budgetData) => {
  try {
    const budgetId = generateId();
    const docRef = await addDoc(budgetsCollection(userId), {
      budgetId,
      ...budgetData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id, budgetId };
  } catch (error) {
    console.error('Error adding budget:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all budgets for user
 */
export const getBudgets = async (userId) => {
  try {
    const snapshot = await getDocs(budgetsCollection(userId));
    const budgets = [];
    
    snapshot.forEach(doc => {
      budgets.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, budgets };
  } catch (error) {
    console.error('Error getting budgets:', error);
    return { success: false, error: error.message, budgets: [] };
  }
};

/**
 * Get budgets for specific month
 */
export const getBudgetsForMonth = async (userId, year, month) => {
  try {
    const q = query(
      budgetsCollection(userId),
      where('year', '==', year),
      where('month', '==', month)
    );
    const snapshot = await getDocs(q);
    const budgets = [];
    
    snapshot.forEach(doc => {
      budgets.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, budgets };
  } catch (error) {
    console.error('Error getting budgets for month:', error);
    return { success: false, error: error.message, budgets: [] };
  }
};

/**
 * Update budget
 */
export const updateBudget = async (userId, budgetDocId, updates) => {
  try {
    const docRef = doc(db, 'users', userId, 'budgets', budgetDocId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating budget:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete budget
 */
export const deleteBudget = async (userId, budgetDocId) => {
  try {
    const docRef = doc(db, 'users', userId, 'budgets', budgetDocId);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting budget:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Copy budgets to next month
 */
export const copyBudgetsToNextMonth = async (userId, fromYear, fromMonth, toYear, toMonth) => {
  try {
    const result = await getBudgetsForMonth(userId, fromYear, fromMonth);
    if (!result.success || result.budgets.length === 0) {
      return { success: false, error: 'No budgets found to copy' };
    }
    
    const batch = [];
    for (const budget of result.budgets) {
      const newBudget = {
        categoryId: budget.categoryId,
        categoryName: budget.categoryName,
        amount: budget.amount,
        year: toYear,
        month: toMonth,
        rollover: budget.rollover || false,
        notes: budget.notes
      };
      
      batch.push(addBudget(userId, newBudget));
    }
    
    await Promise.all(batch);
    return { success: true };
  } catch (error) {
    console.error('Error copying budgets:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// BILL REMINDERS
// ============================================

export const billRemindersCollection = (userId) =>
  collection(db, 'users', userId, 'billReminders');

/**
 * Add a bill reminder
 */
export const addBillReminder = async (userId, billData) => {
  try {
    const billId = generateId();
    const docRef = await addDoc(billRemindersCollection(userId), {
      billId,
      ...billData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id, billId };
  } catch (error) {
    console.error('Error adding bill reminder:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all bill reminders for user
 */
export const getBillReminders = async (userId) => {
  try {
    const q = query(billRemindersCollection(userId), orderBy('nextDueDate', 'asc'));
    const snapshot = await getDocs(q);
    const bills = [];
    
    snapshot.forEach(doc => {
      bills.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, bills };
  } catch (error) {
    console.error('Error getting bill reminders:', error);
    return { success: false, error: error.message, bills: [] };
  }
};

/**
 * Get upcoming bills (within next N days)
 */
export const getUpcomingBills = async (userId, daysAhead = 7) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];
    
    const q = query(
      billRemindersCollection(userId),
      where('nextDueDate', '>=', todayStr),
      where('nextDueDate', '<=', futureStr),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    const bills = [];
    
    snapshot.forEach(doc => {
      bills.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, bills };
  } catch (error) {
    console.error('Error getting upcoming bills:', error);
    return { success: false, error: error.message, bills: [] };
  }
};

/**
 * Get overdue bills
 */
export const getOverdueBills = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const q = query(
      billRemindersCollection(userId),
      where('nextDueDate', '<', today),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    const bills = [];
    
    snapshot.forEach(doc => {
      bills.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, bills };
  } catch (error) {
    console.error('Error getting overdue bills:', error);
    return { success: false, error: error.message, bills: [] };
  }
};

/**
 * Update bill reminder
 */
export const updateBillReminder = async (userId, billDocId, updates) => {
  try {
    const docRef = doc(db, 'users', userId, 'billReminders', billDocId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating bill reminder:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete bill reminder
 */
export const deleteBillReminder = async (userId, billDocId) => {
  try {
    const docRef = doc(db, 'users', userId, 'billReminders', billDocId);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting bill reminder:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark bill as paid and calculate next due date
 */
export const markBillAsPaid = async (userId, billDocId, paymentDate, transactionId = null) => {
  try {
    const docRef = doc(db, 'users', userId, 'billReminders', billDocId);
    const billSnap = await getDoc(docRef);
    
    if (!billSnap.exists()) {
      return { success: false, error: 'Bill not found' };
    }
    
    const bill = billSnap.data();
    const nextDueDate = calculateNextDueDate(bill.nextDueDate, bill.frequency);
    
    // Add to payment history
    const paymentHistory = bill.paymentHistory || [];
    paymentHistory.push({
      date: paymentDate,
      amount: bill.amount,
      transactionId,
      paidAt: new Date().toISOString()
    });
    
    await updateDoc(docRef, {
      lastPaidDate: paymentDate,
      nextDueDate: nextDueDate,
      paymentHistory: paymentHistory,
      updatedAt: serverTimestamp()
    });
    
    return { success: true, nextDueDate };
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate next due date based on frequency
 */
const calculateNextDueDate = (currentDueDate, frequency) => {
  const date = new Date(currentDueDate);
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'bi-weekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'semi-annually':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  
  return date.toISOString().split('T')[0];
};

/**
 * Get bills by category
 */
export const getBillsByCategory = async (userId, categoryId) => {
  try {
    const q = query(
      billRemindersCollection(userId),
      where('categoryId', '==', categoryId)
    );
    const snapshot = await getDocs(q);
    const bills = [];
    
    snapshot.forEach(doc => {
      bills.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, bills };
  } catch (error) {
    console.error('Error getting bills by category:', error);
    return { success: false, error: error.message, bills: [] };
  }
};

/**
 * Get bill payment statistics
 */
export const getBillPaymentStats = async (userId) => {
  try {
    const allBills = await getBillReminders(userId);
    if (!allBills.success) return allBills;
    
    const active = allBills.bills.filter(b => b.status === 'active');
    const paused = allBills.bills.filter(b => b.status === 'paused');
    
    const overdue = await getOverdueBills(userId);
    const upcoming = await getUpcomingBills(userId, 7);
    
    const totalMonthly = active.reduce((sum, bill) => {
      if (bill.frequency === 'monthly') return sum + (bill.amount || 0);
      if (bill.frequency === 'weekly') return sum + (bill.amount || 0) * 4;
      if (bill.frequency === 'bi-weekly') return sum + (bill.amount || 0) * 2;
      if (bill.frequency === 'quarterly') return sum + (bill.amount || 0) / 3;
      if (bill.frequency === 'semi-annually') return sum + (bill.amount || 0) / 6;
      if (bill.frequency === 'annually') return sum + (bill.amount || 0) / 12;
      return sum;
    }, 0);
    
    return {
      success: true,
      stats: {
        total: allBills.bills.length,
        active: active.length,
        paused: paused.length,
        overdue: overdue.bills?.length || 0,
        upcoming: upcoming.bills?.length || 0,
        totalMonthlyAmount: totalMonthly
      }
    };
  } catch (error) {
    console.error('Error getting bill stats:', error);
    return { success: false, error: error.message };
  }
};