// src/lib/defaultData.js
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './firestoreCollections';

// ─── System Categories ────────────────────────────────────────────────────────
// isSystem: true  → required for app features to work correctly, cannot be deleted
// isDefault: true → pre-loaded for every new user
//
// INCOME (7)
// EXPENSE (7)
// Total system: 14
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_INCOME_CATEGORIES = [
  {
    name:     'Salary',
    type:     'Income',
    color:    '#10B981',
    isSystem: true,
    isDefault: true,
  },
  {
    name:     'Business Income',
    type:     'Income',
    color:    '#3B82F6',
    isSystem: true,
    isDefault: true,
  },
  {
    // Riba Tracker page queries for this category — must exist
    name:     'Interest / Riba',
    type:     'Income',
    color:    '#F59E0B',
    isSystem: true,
    isDefault: true,
    isRiba:   true,   // marks all transactions in this category as riba
  },
  {
    // Jewellery feature — income when jewellery is redeemed/sold
    name:     'Jewellery Redemption',
    type:     'Income',
    color:    '#F59E0B',
    isSystem: true,
    isDefault: true,
  },
  {
    // Investments feature — returns / dividends
    name:     'Investment Return',
    type:     'Income',
    color:    '#06B6D4',
    isSystem: true,
    isDefault: true,
  },
  {
    // Loans feature — when a loan is received (credited to account)
    name:     'Loan Received',
    type:     'Income',
    color:    '#8B5CF6',
    isSystem: true,
    isDefault: true,
  },
  {
    // Lendings feature — when a borrower repays you
    name:     'Lending Received',
    type:     'Income',
    color:    '#84CC16',
    isSystem: true,
    isDefault: true,
  },
];

const SYSTEM_EXPENSE_CATEGORIES = [
  {
    name:     'Food & Dining',
    type:     'Expense',
    color:    '#EC4899',
    isSystem: true,
    isDefault: true,
  },
  {
    name:     'Transport',
    type:     'Expense',
    color:    '#EF4444',
    isSystem: true,
    isDefault: true,
  },
  {
    name:     'Bills & Utilities',
    type:     'Expense',
    color:    '#6366F1',
    isSystem: true,
    isDefault: true,
  },
  {
    // Transactions page — auto-created when a transfer fee is recorded
    name:     'Fees & Charges',
    type:     'Expense',
    color:    '#F97316',
    isSystem: true,
    isDefault: true,
  },
  {
    // Zakat page / zakatMonitoring — auto-created when Zakat is paid
    name:     'Zakat Payment',
    type:     'Expense',
    color:    '#10B981',
    isSystem: true,
    isDefault: true,
  },
  {
    // Riba page — auto-created when Sadaqah is recorded to purify riba
    name:     'Sadaqah / Charity',
    type:     'Expense',
    color:    '#06B6D4',
    isSystem: true,
    isDefault: true,
  },
  {
    // Loans feature — when a loan instalment/repayment is made
    name:     'Loan Repayment',
    type:     'Expense',
    color:    '#F59E0B',
    isSystem: true,
    isDefault: true,
  },
];

// ─── Regular Default Categories ───────────────────────────────────────────────
// isDefault: true, isSystem: false → pre-loaded but user can delete them
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Bonus',    type: 'Income',  color: '#3B82F6', isDefault: true },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Shopping',   type: 'Expense', color: '#8B5CF6', isDefault: true },
  { name: 'Healthcare', type: 'Expense', color: '#06B6D4', isDefault: true },
];

// ─── All categories for reference ────────────────────────────────────────────
const ALL_SYSTEM_CATEGORIES    = [...SYSTEM_INCOME_CATEGORIES,  ...SYSTEM_EXPENSE_CATEGORIES];
const ALL_DEFAULT_CATEGORIES   = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
const ALL_CATEGORIES           = [...ALL_SYSTEM_CATEGORIES,     ...ALL_DEFAULT_CATEGORIES];

// ─── Accounts ────────────────────────────────────────────────────────────────

const DEFAULT_ACCOUNTS = [
  { name: 'Cash',   type: 'Cash',           balance: 0, isDefault: true },
  { name: 'Bank 1', type: 'Bank',           balance: 0, isDefault: true },
  { name: 'bKash',  type: 'Mobile Banking', balance: 0, isDefault: true },
  { name: 'Bank 2', type: 'Bank',           balance: 0, isDefault: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// initializeDefaultAccounts
// Only runs once — bails out if user already has accounts.
// ─────────────────────────────────────────────────────────────────────────────
export const initializeDefaultAccounts = async (userId) => {
  try {
    const accountsRef      = collection(db, 'users', userId, 'accounts');
    const existingAccounts = await getDocs(accountsRef);
    if (!existingAccounts.empty) {
      return { success: true, message: 'Accounts already exist' };
    }

    await Promise.all(
      DEFAULT_ACCOUNTS.map(account =>
        addDoc(accountsRef, {
          accountId: generateId(),
          ...account,
          createdAt:  serverTimestamp(),
          updatedAt:  serverTimestamp(),
        })
      )
    );
    return { success: true, message: 'Default accounts created' };
  } catch (error) {
    console.error('Error initializing default accounts:', error);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// initializeDefaultCategories
//
// Safe for both new AND existing users:
//   • Fetches all existing categories first
//   • Deduplicates by (type + name, case-insensitive)
//   • Only adds categories that are genuinely missing
//   • System categories are always ensured — even if user had some before
// ─────────────────────────────────────────────────────────────────────────────
export const initializeDefaultCategories = async (userId) => {
  try {
    const categoriesRef  = collection(db, 'users', userId, 'categories');
    const existingSnap   = await getDocs(categoriesRef);

    // Build a set of existing (type_name) keys for fast dedup lookup
    const existingKeys = new Set();
    existingSnap.forEach(d => {
      const data = d.data();
      if (data.name && data.type) {
        existingKeys.add(`${data.type.toLowerCase()}_${data.name.toLowerCase().trim()}`);
      }
    });

    // Determine which categories are missing
    const toAdd = ALL_CATEGORIES.filter(cat => {
      const key = `${cat.type.toLowerCase()}_${cat.name.toLowerCase().trim()}`;
      return !existingKeys.has(key);
    });

    if (toAdd.length === 0) {
      return { success: true, message: 'All categories already exist' };
    }

    await Promise.all(
      toAdd.map(cat =>
        addDoc(categoriesRef, {
          categoryId: generateId(),
          ...cat,
          createdAt: serverTimestamp(),
        })
      )
    );

    return { success: true, message: `${toAdd.length} categories created` };
  } catch (error) {
    console.error('Error initializing default categories:', error);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// initializeUserDefaults — called on first login / registration
// ─────────────────────────────────────────────────────────────────────────────
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

// ─── Reference helpers ────────────────────────────────────────────────────────
export const getDefaultAccounts    = () => DEFAULT_ACCOUNTS;
export const getDefaultCategories  = () => ALL_CATEGORIES;
export const getSystemCategories   = () => ALL_SYSTEM_CATEGORIES;