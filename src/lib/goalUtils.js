// src/lib/goalUtils.js
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Get all active goal allocations for a specific account
 * @param {string} userId - User ID
 * @param {string} accountId - Account ID
 * @returns {Promise<{allocated: number, goals: Array}>}
 */
export async function getGoalAllocations(userId, accountId) {
  try {
    const goalsRef = collection(db, 'users', userId, 'financialGoals');
    const q = query(
      goalsRef,
      where('linkedAccountId', '==', accountId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const goals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    const totalAllocated = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
    
    return {
      allocated: totalAllocated,
      goals: goals,
    };
  } catch (error) {
    console.error('Error getting goal allocations:', error);
    return {
      allocated: 0,
      goals: [],
    };
  }
}

/**
 * Get available balance for an account (total - allocated to goals)
 * @param {string} userId - User ID
 * @param {string} accountId - Account ID
 * @param {number} totalBalance - Current account balance
 * @returns {Promise<number>}
 */
export async function getAvailableBalance(userId, accountId, totalBalance) {
  const { allocated } = await getGoalAllocations(userId, accountId);
  return Math.max(0, totalBalance - allocated);
}

/**
 * Check if user can spend a specific amount from account
 * @param {string} userId - User ID
 * @param {string} accountId - Account ID
 * @param {number} totalBalance - Current account balance
 * @param {number} amount - Amount to spend
 * @returns {Promise<{canSpend: boolean, available: number, allocated: number}>}
 */
export async function canSpend(userId, accountId, totalBalance, amount) {
  const { allocated } = await getGoalAllocations(userId, accountId);
  const available = Math.max(0, totalBalance - allocated);
  
  return {
    canSpend: available >= amount,
    available: available,
    allocated: allocated,
  };
}

/**
 * Get all accounts with their allocation info
 * @param {string} userId - User ID
 * @param {Array} accounts - Array of account objects with id and balance
 * @returns {Promise<Array>}
 */
export async function getAccountsWithAllocations(userId, accounts) {
  const accountsWithAllocations = await Promise.all(
    accounts.map(async (account) => {
      const { allocated, goals } = await getGoalAllocations(userId, account.id);
      const available = Math.max(0, account.balance - allocated);
      
      return {
        ...account,
        allocated,
        available,
        allocatedGoals: goals,
      };
    })
  );
  
  return accountsWithAllocations;
}
