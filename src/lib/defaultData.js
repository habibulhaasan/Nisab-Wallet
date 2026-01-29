// src/lib/defaultData.js
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './firestoreCollections';

/**
 * Default accounts that every user gets
 */
const DEFAULT_ACCOUNTS = [
  { name: 'Cash', type: 'Cash', balance: 0, isDefault: true },
  { name: 'Bank 1', type: 'Bank', balance: 0, isDefault: true },
  { name: 'bKash', type: 'Mobile Banking', balance: 0, isDefault: true },
  { name: 'Bank 2', type: 'Bank', balance: 0, isDefault: true }
];

/**
 * Default income categories
 */
const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', type: 'Income', color: '#10B981', isDefault: true },
  { name: 'Bonus', type: 'Income', color: '#3B82F6', isDefault: true },
  { name: 'Loan', type: 'Income', color: '#F59E0B', isDefault: true }
];

/**
 * Default expense categories
 */
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Transportation', type: 'Expense', color: '#EF4444', isDefault: true },
  { name: 'Shopping', type: 'Expense', color: '#8B5CF6', isDefault: true },
  { name: 'Foods', type: 'Expense', color: '#EC4899', isDefault: true },
  { name: 'Healthcare', type: 'Expense', color: '#06B6D4', isDefault: true },
  { name: 'Loan Repay', type: 'Expense', color: '#F97316', isDefault: true }
];

/**
 * Initialize default accounts for a user
 */
export const initializeDefaultAccounts = async (userId) => {
  try {
    const accountsRef = collection(db, 'users', userId, 'accounts');
    
    // Check if user already has accounts
    const existingAccounts = await getDocs(accountsRef);
    if (!existingAccounts.empty) {
      return { success: true, message: 'Accounts already exist' };
    }

    // Create default accounts
    const promises = DEFAULT_ACCOUNTS.map(account => 
      addDoc(accountsRef, {
        accountId: generateId(),
        ...account,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );

    await Promise.all(promises);
    return { success: true, message: 'Default accounts created' };
  } catch (error) {
    console.error('Error initializing default accounts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize default categories for a user
 */
export const initializeDefaultCategories = async (userId) => {
  try {
    const categoriesRef = collection(db, 'users', userId, 'categories');
    
    // Check if user already has categories
    const existingCategories = await getDocs(categoriesRef);
    if (!existingCategories.empty) {
      return { success: true, message: 'Categories already exist' };
    }

    // Create default categories (income + expense)
    const allCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
    const promises = allCategories.map(category => 
      addDoc(categoriesRef, {
        categoryId: generateId(),
        ...category,
        createdAt: serverTimestamp()
      })
    );

    await Promise.all(promises);
    return { success: true, message: 'Default categories created' };
  } catch (error) {
    console.error('Error initializing default categories:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize all default data for a new user
 */
export const initializeUserDefaults = async (userId) => {
  try {
    await initializeDefaultAccounts(userId);
    await initializeDefaultCategories(userId);
    return { success: true };
  } catch (error) {
    console.error('Error initializing user defaults:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get default accounts list (for reference)
 */
export const getDefaultAccounts = () => DEFAULT_ACCOUNTS;

/**
 * Get default categories list (for reference)
 */
export const getDefaultCategories = () => [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];