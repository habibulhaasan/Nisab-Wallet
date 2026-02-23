// src/lib/investmentCollections.js

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
// INVESTMENTS
// ============================================

export const investmentsCollection = (userId) =>
  collection(db, 'users', userId, 'investments');

/**
 * Investment Types
 */
export const INVESTMENT_TYPES = {
  STOCK: 'stock',
  MUTUAL_FUND: 'mutual_fund',
  DPS: 'dps',
  FDR: 'fdr',
  SAVINGS_CERTIFICATE: 'savings_certificate',
  BOND: 'bond',
  PPF: 'ppf',
  PENSION_FUND: 'pension_fund',
  CRYPTO: 'crypto',
  REAL_ESTATE: 'real_estate',
  GOLD: 'gold',
  OTHER: 'other'
};

/**
 * Investment Status
 */
export const INVESTMENT_STATUS = {
  ACTIVE: 'active',
  MATURED: 'matured',
  SOLD: 'sold',
  CLOSED: 'closed'
};

/**
 * Add investment
 */
export const addInvestment = async (userId, investmentData) => {
  try {
    const investmentId = generateId();
    const docRef = await addDoc(investmentsCollection(userId), {
      investmentId,
      ...investmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id, investmentId };
  } catch (error) {
    console.error('Error adding investment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all investments
 */
export const getInvestments = async (userId) => {
  try {
    const q = query(investmentsCollection(userId), orderBy('purchaseDate', 'desc'));
    const snapshot = await getDocs(q);
    const investments = [];
    
    snapshot.forEach(doc => {
      investments.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, investments };
  } catch (error) {
    console.error('Error getting investments:', error);
    return { success: false, error: error.message, investments: [] };
  }
};

/**
 * Get investment by ID
 */
export const getInvestment = async (userId, investmentDocId) => {
  try {
    const docRef = doc(db, 'users', userId, 'investments', investmentDocId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, investment: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Investment not found' };
    }
  } catch (error) {
    console.error('Error getting investment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get investments by type
 */
export const getInvestmentsByType = async (userId, type) => {
  try {
    const q = query(
      investmentsCollection(userId),
      where('type', '==', type),
      orderBy('purchaseDate', 'desc')
    );
    const snapshot = await getDocs(q);
    const investments = [];
    
    snapshot.forEach(doc => {
      investments.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, investments };
  } catch (error) {
    console.error('Error getting investments by type:', error);
    return { success: false, error: error.message, investments: [] };
  }
};

/**
 * Get investments by status
 */
export const getInvestmentsByStatus = async (userId, status) => {
  try {
    const q = query(
      investmentsCollection(userId),
      where('status', '==', status),
      orderBy('purchaseDate', 'desc')
    );
    const snapshot = await getDocs(q);
    const investments = [];
    
    snapshot.forEach(doc => {
      investments.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, investments };
  } catch (error) {
    console.error('Error getting investments by status:', error);
    return { success: false, error: error.message, investments: [] };
  }
};

/**
 * Update investment
 */
export const updateInvestment = async (userId, investmentDocId, updates) => {
  try {
    const docRef = doc(db, 'users', userId, 'investments', investmentDocId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating investment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete investment
 */
export const deleteInvestment = async (userId, investmentDocId) => {
  try {
    const docRef = doc(db, 'users', userId, 'investments', investmentDocId);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting investment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate investment returns
 */
export const calculateReturns = (investment) => {
  const { purchasePrice, currentValue, quantity = 1 } = investment;
  
  const totalInvested = purchasePrice * quantity;
  const totalCurrentValue = currentValue * quantity;
  const absoluteReturn = totalCurrentValue - totalInvested;
  const percentageReturn = totalInvested > 0 
    ? ((absoluteReturn / totalInvested) * 100) 
    : 0;
  
  return {
    totalInvested,
    totalCurrentValue,
    absoluteReturn,
    percentageReturn
  };
};

/**
 * Calculate portfolio summary
 */
export const calculatePortfolioSummary = (investments) => {
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let totalDividends = 0;
  
  const activeInvestments = investments.filter(inv => inv.status === INVESTMENT_STATUS.ACTIVE);
  
  activeInvestments.forEach(investment => {
    const returns = calculateReturns(investment);
    totalInvested += returns.totalInvested;
    totalCurrentValue += returns.totalCurrentValue;
    totalDividends += investment.totalDividends || 0;
  });
  
  const absoluteReturn = totalCurrentValue - totalInvested;
  const percentageReturn = totalInvested > 0 
    ? ((absoluteReturn / totalInvested) * 100) 
    : 0;
  
  const totalReturns = absoluteReturn + totalDividends;
  const totalReturnPercentage = totalInvested > 0
    ? ((totalReturns / totalInvested) * 100)
    : 0;
  
  return {
    totalInvested,
    totalCurrentValue,
    absoluteReturn,
    percentageReturn,
    totalDividends,
    totalReturns,
    totalReturnPercentage,
    activeCount: activeInvestments.length,
    totalCount: investments.length
  };
};

/**
 * Get portfolio allocation by type
 */
export const getPortfolioAllocation = (investments) => {
  const allocation = {};
  let total = 0;
  
  const activeInvestments = investments.filter(inv => inv.status === INVESTMENT_STATUS.ACTIVE);
  
  activeInvestments.forEach(investment => {
    const returns = calculateReturns(investment);
    const value = returns.totalCurrentValue;
    
    if (!allocation[investment.type]) {
      allocation[investment.type] = {
        value: 0,
        count: 0,
        percentage: 0
      };
    }
    
    allocation[investment.type].value += value;
    allocation[investment.type].count += 1;
    total += value;
  });
  
  // Calculate percentages
  Object.keys(allocation).forEach(type => {
    allocation[type].percentage = total > 0 
      ? ((allocation[type].value / total) * 100).toFixed(2)
      : 0;
  });
  
  return allocation;
};

/**
 * Add dividend/interest payment
 */
export const addDividend = async (userId, investmentDocId, dividendData) => {
  try {
    const docRef = doc(db, 'users', userId, 'investments', investmentDocId);
    const investmentSnap = await getDoc(docRef);
    
    if (!investmentSnap.exists()) {
      return { success: false, error: 'Investment not found' };
    }
    
    const investment = investmentSnap.data();
    const dividends = investment.dividends || [];
    const totalDividends = (investment.totalDividends || 0) + dividendData.amount;
    
    dividends.push({
      ...dividendData,
      recordedAt: new Date().toISOString()
    });
    
    await updateDoc(docRef, {
      dividends,
      totalDividends,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding dividend:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get investment type label
 */
export const getInvestmentTypeLabel = (type) => {
  const labels = {
    [INVESTMENT_TYPES.STOCK]: 'Stock',
    [INVESTMENT_TYPES.MUTUAL_FUND]: 'Mutual Fund',
    [INVESTMENT_TYPES.DPS]: 'DPS (Deposit Pension Scheme)',
    [INVESTMENT_TYPES.FDR]: 'FDR (Fixed Deposit)',
    [INVESTMENT_TYPES.SAVINGS_CERTIFICATE]: 'Savings Certificate',
    [INVESTMENT_TYPES.BOND]: 'Bond',
    [INVESTMENT_TYPES.PPF]: 'PPF (Public Provident Fund)',
    [INVESTMENT_TYPES.PENSION_FUND]: 'Pension Fund',
    [INVESTMENT_TYPES.CRYPTO]: 'Cryptocurrency',
    [INVESTMENT_TYPES.REAL_ESTATE]: 'Real Estate',
    [INVESTMENT_TYPES.GOLD]: 'Gold',
    [INVESTMENT_TYPES.OTHER]: 'Other'
  };
  
  return labels[type] || type;
};

/**
 * Get investment type color
 */
export const getInvestmentTypeColor = (type) => {
  const colors = {
    [INVESTMENT_TYPES.STOCK]: '#3B82F6',           // Blue
    [INVESTMENT_TYPES.MUTUAL_FUND]: '#10B981',     // Green
    [INVESTMENT_TYPES.DPS]: '#F59E0B',             // Amber
    [INVESTMENT_TYPES.FDR]: '#8B5CF6',             // Purple
    [INVESTMENT_TYPES.SAVINGS_CERTIFICATE]: '#EC4899', // Pink
    [INVESTMENT_TYPES.BOND]: '#6366F1',            // Indigo
    [INVESTMENT_TYPES.PPF]: '#14B8A6',             // Teal
    [INVESTMENT_TYPES.PENSION_FUND]: '#F97316',    // Orange
    [INVESTMENT_TYPES.CRYPTO]: '#EAB308',          // Yellow
    [INVESTMENT_TYPES.REAL_ESTATE]: '#84CC16',     // Lime
    [INVESTMENT_TYPES.GOLD]: '#FBBF24',            // Gold
    [INVESTMENT_TYPES.OTHER]: '#6B7280'            // Gray
  };
  
  return colors[type] || '#6B7280';
};