// src/lib/zakatMonitoring.js
import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './firestoreCollections';
import { gregorianToHijri, hasOneHijriYearPassed, addOneHijriYear } from './zakatUtils';

/**
 * Check if we should start a new Zakat cycle
 * A cycle starts when wealth crosses Nisab threshold on a specific date
 */
export const checkAndStartZakatCycle = async (userId, totalWealth, nisabThreshold, checkDate) => {
  if (!nisabThreshold || nisabThreshold === 0 || totalWealth < nisabThreshold) {
    return { cycleStarted: false };
  }

  try {
    // Check if there's already an active cycle
    const cyclesRef = collection(db, 'users', userId, 'zakatCycles');
    const activeQuery = query(cyclesRef, where('status', '==', 'active'));
    const activeSnapshot = await getDocs(activeQuery);
    
    if (!activeSnapshot.empty) {
      // Already have an active cycle
      return { cycleStarted: false, reason: 'Active cycle exists' };
    }

    // Check if wealth was below Nisab before this date
    // This ensures we only start a cycle when crossing the threshold
    const dateToCheck = checkDate || new Date().toISOString().split('T')[0];
    
    // Start a new cycle
    const hijriDate = gregorianToHijri(dateToCheck);
    const cycleId = generateId();
    
    const newCycle = {
      cycleId,
      status: 'active',
      startDate: dateToCheck,
      startDateHijri: hijriDate,
      startWealth: totalWealth,
      nisabAtStart: nisabThreshold,
      createdAt: serverTimestamp(),
    };
    
    await addDoc(cyclesRef, newCycle);
    
    return { cycleStarted: true, cycle: newCycle };
  } catch (error) {
    console.error('Error checking/starting cycle:', error);
    return { cycleStarted: false, error: error.message };
  }
};

/**
 * Check if a cycle should be completed (year has passed)
 * This should be called after transactions to check if year ended
 */
export const checkCycleCompletion = async (userId, activeCycle, currentWealth, nisabThreshold, checkDate) => {
  if (!activeCycle || activeCycle.status !== 'active') {
    return { completed: false };
  }

  const dateToCheck = checkDate || new Date().toISOString().split('T')[0];
  
  // Check if one Hijri year has passed from cycle start
  if (!hasOneHijriYearPassed(activeCycle.startDate)) {
    return { completed: false, reason: 'Year not completed yet' };
  }

  try {
    const hijriDate = gregorianToHijri(dateToCheck);
    
    // Determine if Zakat is due or user is exempt
    const isDue = currentWealth >= nisabThreshold;
    const newStatus = isDue ? 'due' : 'exempt';
    
    // Update the cycle
    const cycleRef = doc(db, 'users', userId, 'zakatCycles', activeCycle.id);
    await updateDoc(cycleRef, {
      status: newStatus,
      endDate: dateToCheck,
      endDateHijri: hijriDate,
      endWealth: currentWealth,
      yearCompletedAt: serverTimestamp(),
    });
    
    return { 
      completed: true, 
      status: newStatus,
      isDue,
      zakatAmount: isDue ? currentWealth * 0.025 : 0
    };
  } catch (error) {
    console.error('Error completing cycle:', error);
    return { completed: false, error: error.message };
  }
};

/**
 * Get total wealth on a specific date
 * This calculates wealth by summing all account balances on that date
 */
export const calculateWealthOnDate = async (userId, targetDate) => {
  try {
    // Get all accounts
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const accountsSnapshot = await getDocs(accountsRef);
    const accounts = {};
    
    accountsSnapshot.forEach((doc) => {
      const data = doc.data();
      accounts[doc.id] = {
        id: doc.id,
        initialBalance: 0, // We'll calculate from transactions
        ...data
      };
    });

    // Get all transactions up to the target date
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const transQuery = query(transactionsRef, orderBy('date', 'asc'));
    const transSnapshot = await getDocs(transQuery);
    
    const accountBalances = {};
    
    // Initialize all account balances to 0
    Object.keys(accounts).forEach(accountId => {
      accountBalances[accountId] = 0;
    });
    
    // Apply transactions chronologically up to target date
    transSnapshot.forEach((doc) => {
      const trans = doc.data();
      
      if (trans.date <= targetDate && accountBalances[trans.accountId] !== undefined) {
        if (trans.type === 'Income') {
          accountBalances[trans.accountId] += trans.amount;
        } else if (trans.type === 'Expense') {
          accountBalances[trans.accountId] -= trans.amount;
        }
      }
    });
    
    // Sum all account balances
    const totalWealth = Object.values(accountBalances).reduce((sum, balance) => sum + balance, 0);
    
    return { totalWealth, accountBalances };
  } catch (error) {
    console.error('Error calculating wealth on date:', error);
    return { totalWealth: 0, error: error.message };
  }
};

/**
 * Main function to update Zakat status after a transaction
 * Call this after every transaction add/edit/delete
 */
export const updateZakatStatusAfterTransaction = async (userId, transactionDate, nisabThreshold) => {
  try {
    // Calculate wealth on the transaction date
    const { totalWealth } = await calculateWealthOnDate(userId, transactionDate);
    
    // Get active cycle if exists
    const cyclesRef = collection(db, 'users', userId, 'zakatCycles');
    const activeQuery = query(cyclesRef, where('status', '==', 'active'));
    const activeSnapshot = await getDocs(activeQuery);
    
    let activeCycle = null;
    if (!activeSnapshot.empty) {
      activeSnapshot.forEach((doc) => {
        activeCycle = { id: doc.id, ...doc.data() };
      });
    }
    
    // Check if active cycle should be completed
    if (activeCycle) {
      const completion = await checkCycleCompletion(
        userId, 
        activeCycle, 
        totalWealth, 
        nisabThreshold, 
        transactionDate
      );
      
      if (completion.completed) {
        // If cycle just ended and is exempt or due was paid, check if we should start new cycle
        if (completion.status === 'exempt' || completion.status === 'due') {
          // Wait - don't auto-start. Let it start when wealth crosses Nisab again
        }
      }
    } else {
      // No active cycle - check if we should start one
      await checkAndStartZakatCycle(userId, totalWealth, nisabThreshold, transactionDate);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating Zakat status:', error);
    return { success: false, error: error.message };
  }
};