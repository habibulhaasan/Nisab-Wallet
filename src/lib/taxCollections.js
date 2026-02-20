// src/lib/taxCollections.js

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
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './firestoreCollections';
import {
  getCurrentIncomeYear,
  getFiscalYearDates,
  getTaxYear as getTaxYearFromIncome,
  getFilingDeadline
} from './taxCategories';

// ============================================
// TAX CATEGORY MAPPINGS
// ============================================

export const taxMappingsCollection = (userId) =>
  collection(db, 'users', userId, 'taxCategoryMappings');

/**
 * Save tax category mappings
 */
export const saveTaxMappings = async (userId, mappings) => {
  try {
    const batch = writeBatch(db);
    const mappingsRef = taxMappingsCollection(userId);
    
    // Delete existing mappings
    const existing = await getDocs(mappingsRef);
    existing.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Add new mappings
    mappings.forEach(mapping => {
      const docRef = doc(mappingsRef);
      batch.set(docRef, {
        mappingId: generateId(),
        ...mapping,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error saving tax mappings:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all tax mappings for user
 */
export const getTaxMappings = async (userId) => {
  try {
    const snapshot = await getDocs(taxMappingsCollection(userId));
    const mappings = [];
    
    snapshot.forEach(doc => {
      mappings.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, mappings };
  } catch (error) {
    console.error('Error getting tax mappings:', error);
    return { success: false, error: error.message, mappings: [] };
  }
};

/**
 * Update single tax mapping
 */
export const updateTaxMapping = async (userId, mappingId, updates) => {
  try {
    const mappingRef = doc(db, 'users', userId, 'taxCategoryMappings', mappingId);
    await updateDoc(mappingRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating tax mapping:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// TAX YEARS
// ============================================

export const taxYearsCollection = (userId) =>
  collection(db, 'users', userId, 'taxYears');

/**
 * Create or get tax year
 */
export const createTaxYear = async (userId, incomeYear = null) => {
  try {
    // Use current income year if not provided
    const year = incomeYear || getCurrentIncomeYear();
    const { start, end } = getFiscalYearDates(year);
    const taxYear = getTaxYearFromIncome(year);
    const deadline = getFilingDeadline(taxYear);
    
    // Check if already exists
    const q = query(
      taxYearsCollection(userId),
      where('incomeYear', '==', year)
    );
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      return {
        success: true,
        taxYear: { id: existing.docs[0].id, ...existing.docs[0].data() },
        isNew: false
      };
    }
    
    // Create new tax year
    const taxYearId = generateId();
    const docRef = await addDoc(taxYearsCollection(userId), {
      taxYearId,
      incomeYear: year,
      fiscalYearStart: start,
      fiscalYearEnd: end,
      taxYear: taxYear,
      filingDeadline: deadline,
      status: 'draft', // draft, in_review, filed
      
      // Cached totals (will be calculated)
      totalIncome: 0,
      totalExpenses: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      taxYear: {
        id: docRef.id,
        taxYearId,
        incomeYear: year,
        fiscalYearStart: start,
        fiscalYearEnd: end,
        taxYear: taxYear,
        filingDeadline: deadline,
        status: 'draft'
      },
      isNew: true
    };
  } catch (error) {
    console.error('Error creating tax year:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all tax years for user
 */
export const getTaxYears = async (userId) => {
  try {
    const q = query(
      taxYearsCollection(userId),
      orderBy('fiscalYearStart', 'desc')
    );
    const snapshot = await getDocs(q);
    const taxYears = [];
    
    snapshot.forEach(doc => {
      taxYears.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, taxYears };
  } catch (error) {
    console.error('Error getting tax years:', error);
    return { success: false, error: error.message, taxYears: [] };
  }
};

/**
 * Get single tax year
 */
export const getTaxYear = async (userId, taxYearDocId) => {
  try {
    const docRef = doc(db, 'users', userId, 'taxYears', taxYearDocId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        taxYear: { id: docSnap.id, ...docSnap.data() }
      };
    } else {
      return { success: false, error: 'Tax year not found' };
    }
  } catch (error) {
    console.error('Error getting tax year:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update tax year
 */
export const updateTaxYear = async (userId, taxYearDocId, updates) => {
  try {
    const docRef = doc(db, 'users', userId, 'taxYears', taxYearDocId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating tax year:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete tax year
 */
export const deleteTaxYear = async (userId, taxYearDocId) => {
  try {
    const docRef = doc(db, 'users', userId, 'taxYears', taxYearDocId);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting tax year:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// TAX ASSETS (Manual entries)
// ============================================

export const taxAssetsCollection = (userId) =>
  collection(db, 'users', userId, 'taxAssets');

/**
 * Add tax asset
 */
export const addTaxAsset = async (userId, assetData) => {
  try {
    const assetId = generateId();
    const docRef = await addDoc(taxAssetsCollection(userId), {
      assetId,
      ...assetData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id, assetId };
  } catch (error) {
    console.error('Error adding tax asset:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get tax assets for a specific tax year
 */
export const getTaxAssets = async (userId, taxYearDocId = null) => {
  try {
    let q;
    if (taxYearDocId) {
      q = query(
        taxAssetsCollection(userId),
        where('taxYearId', '==', taxYearDocId)
      );
    } else {
      q = taxAssetsCollection(userId);
    }
    
    const snapshot = await getDocs(q);
    const assets = [];
    
    snapshot.forEach(doc => {
      assets.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, assets };
  } catch (error) {
    console.error('Error getting tax assets:', error);
    return { success: false, error: error.message, assets: [] };
  }
};

/**
 * Update tax asset
 */
export const updateTaxAsset = async (userId, assetDocId, updates) => {
  try {
    const docRef = doc(db, 'users', userId, 'taxAssets', assetDocId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating tax asset:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete tax asset
 */
export const deleteTaxAsset = async (userId, assetDocId) => {
  try {
    const docRef = doc(db, 'users', userId, 'taxAssets', assetDocId);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting tax asset:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// TAX LIABILITIES (Manual entries)
// ============================================

export const taxLiabilitiesCollection = (userId) =>
  collection(db, 'users', userId, 'taxLiabilities');

/**
 * Add tax liability
 */
export const addTaxLiability = async (userId, liabilityData) => {
  try {
    const liabilityId = generateId();
    const docRef = await addDoc(taxLiabilitiesCollection(userId), {
      liabilityId,
      ...liabilityData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id, liabilityId };
  } catch (error) {
    console.error('Error adding tax liability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get tax liabilities for a specific tax year
 */
export const getTaxLiabilities = async (userId, taxYearDocId = null) => {
  try {
    let q;
    if (taxYearDocId) {
      q = query(
        taxLiabilitiesCollection(userId),
        where('taxYearId', '==', taxYearDocId)
      );
    } else {
      q = taxLiabilitiesCollection(userId);
    }
    
    const snapshot = await getDocs(q);
    const liabilities = [];
    
    snapshot.forEach(doc => {
      liabilities.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, liabilities };
  } catch (error) {
    console.error('Error getting tax liabilities:', error);
    return { success: false, error: error.message, liabilities: [] };
  }
};

/**
 * Update tax liability
 */
export const updateTaxLiability = async (userId, liabilityDocId, updates) => {
  try {
    const docRef = doc(db, 'users', userId, 'taxLiabilities', liabilityDocId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating tax liability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete tax liability
 */
export const deleteTaxLiability = async (userId, liabilityDocId) => {
  try {
    const docRef = doc(db, 'users', userId, 'taxLiabilities', liabilityDocId);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting tax liability:', error);
    return { success: false, error: error.message };
  }
};