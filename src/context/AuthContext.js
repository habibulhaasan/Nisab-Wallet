// src/context/AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createUserSubscription, calculateTrialEndDate, SUBSCRIPTION_STATUS } from '@/lib/subscriptionUtils';
import { updateLastLogin } from '@/lib/adminUtils';
import { generateId } from '@/lib/firestoreCollections';

// Default data constants
const DEFAULT_ACCOUNTS = [
  { name: 'Cash', type: 'Cash', balance: 0, isDefault: true },
  { name: 'Bank 1', type: 'Bank', balance: 0, isDefault: true },
  { name: 'bKash', type: 'Mobile Banking', balance: 0, isDefault: true },
  { name: 'Bank 2', type: 'Bank', balance: 0, isDefault: true }
];

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'Income', color: '#10B981', isDefault: true },
  { name: 'Bonus', type: 'Income', color: '#3B82F6', isDefault: true },
  { name: 'Loan', type: 'Income', color: '#F59E0B', isDefault: true },
  { name: 'Transportation', type: 'Expense', color: '#EF4444', isDefault: true },
  { name: 'Shopping', type: 'Expense', color: '#8B5CF6', isDefault: true },
  { name: 'Foods', type: 'Expense', color: '#EC4899', isDefault: true },
  { name: 'Healthcare', type: 'Expense', color: '#06B6D4', isDefault: true },
  { name: 'Loan Repay', type: 'Expense', color: '#F97316', isDefault: true }
];

// Helper function to create default data
const createDefaultAccountsAndCategories = async (userId) => {
  try {
    // Create default accounts
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const accountPromises = DEFAULT_ACCOUNTS.map(account => 
      addDoc(accountsRef, {
        accountId: generateId(),
        ...account,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );

    // Create default categories
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const categoryPromises = DEFAULT_CATEGORIES.map(category => 
      addDoc(categoriesRef, {
        categoryId: generateId(),
        ...category,
        createdAt: serverTimestamp()
      })
    );

    await Promise.all([...accountPromises, ...categoryPromises]);
  } catch (error) {
    console.error('Error creating default data:', error);
  }
};

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Update last login timestamp
        updateLastLogin(user.uid).catch(console.error);
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Register new user with subscription
  const signup = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });

      const today = new Date().toISOString().split('T')[0];

      // FIRST: Create user profile in Firestore (MUST BE FIRST)
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        name: userData.name,
        email: email,
        mobile: userData.mobile || '',
        address: userData.address || '',
        role: 'user',
        subscriptionStatus: SUBSCRIPTION_STATUS.TRIAL,
        isBlocked: false,
        registrationType: userData.registrationType || 'trial',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      // THEN: Create default accounts and categories
      await createDefaultAccountsAndCategories(userId);

      // FINALLY: Create subscriptions
      // Handle Trial-Only Registration
      if (userData.registrationType === 'trial') {
        const trialEndDate = calculateTrialEndDate(today, userData.trialDays || 5);
        
        await createUserSubscription(userId, {
          planId: 'trial',
          planName: 'Free Trial',
          status: SUBSCRIPTION_STATUS.TRIAL,
          startDate: today,
          endDate: trialEndDate,
          paymentMethod: '',
          transactionId: '',
          amount: 0,
          isFirstSubscription: true
        });
      }
      
      // Handle Direct Purchase Registration
      else if (userData.registrationType === 'purchase' && userData.selectedPlan) {
        const trialEndDate = calculateTrialEndDate(today, userData.trialDays || 5);
        
        // Create trial subscription
        await createUserSubscription(userId, {
          planId: 'trial',
          planName: 'Free Trial',
          status: SUBSCRIPTION_STATUS.TRIAL,
          startDate: today,
          endDate: trialEndDate,
          paymentMethod: '',
          transactionId: '',
          amount: 0,
          isFirstSubscription: true
        });

        // Create pending subscription for admin approval
        const subscriptionStartDate = trialEndDate; // Subscription starts after trial
        const subscriptionEndDate = calculateTrialEndDate(
          subscriptionStartDate, 
          userData.selectedPlan.durationDays
        );

        await createUserSubscription(userId, {
          planId: userData.selectedPlan.planId,
          planName: userData.selectedPlan.name,
          status: SUBSCRIPTION_STATUS.PENDING,
          startDate: subscriptionStartDate,
          endDate: subscriptionEndDate,
          paymentMethod: userData.paymentMethod,
          transactionId: userData.transactionId,
          amount: userData.selectedPlan.price,
          isFirstSubscription: true
        });
      }

      setUser({ ...userCredential.user, displayName: userData.name });
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  // Helper function to create default accounts and categories
  const createDefaultAccountsAndCategories = async (userId) => {
    try {
      const { addAccount } = await import('@/lib/firestoreCollections');
      const { addCategory } = await import('@/lib/firestoreCollections');

      // Default Accounts
      const defaultAccounts = [
        { name: 'Cash', type: 'Cash', balance: 0 },
        { name: 'Bank 1', type: 'Bank', balance: 0 },
        { name: 'bKash', type: 'Mobile Banking', balance: 0 },
        { name: 'Bank 2', type: 'Bank', balance: 0 }
      ];

      // Default Income Categories
      const defaultIncomeCategories = [
        { name: 'Salary', type: 'Income', color: '#10B981', icon: '💰' },
        { name: 'Bonus', type: 'Income', color: '#3B82F6', icon: '🎁' },
        { name: 'Loan', type: 'Income', color: '#8B5CF6', icon: '🏦' }
      ];

      // Default Expense Categories
      const defaultExpenseCategories = [
        { name: 'Transportation', type: 'Expense', color: '#EF4444', icon: '🚗' },
        { name: 'Shopping', type: 'Expense', color: '#F59E0B', icon: '🛍️' },
        { name: 'Foods', type: 'Expense', color: '#EC4899', icon: '🍔' },
        { name: 'Healthcare', type: 'Expense', color: '#06B6D4', icon: '⚕️' },
        { name: 'Loan Repay', type: 'Expense', color: '#6366F1', icon: '💳' }
      ];

      // Create accounts
      for (const account of defaultAccounts) {
        await addAccount(userId, account);
      }

      // Create categories
      const allCategories = [...defaultIncomeCategories, ...defaultExpenseCategories];
      for (const category of allCategories) {
        await addCategory(userId, category);
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating default data:', error);
      return { success: false, error: error.message };
    }
  };

  // Login existing user
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Update last login will happen in useEffect
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};