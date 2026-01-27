// src/lib/firestoreCollections.js
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ACCOUNTS CRUD Operations
export const accountsCollection = (userId) => collection(db, 'users', userId, 'accounts');

export const addAccount = async (userId, accountData) => {
  try {
    const accountId = generateId();
    const docRef = await addDoc(accountsCollection(userId), {
      ...accountData,
      accountId,
      balance: parseFloat(accountData.balance) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id, accountId };
  } catch (error) {
    console.error('Error adding account:', error);
    return { success: false, error: error.message };
  }
};

export const getAccounts = async (userId) => {
  try {
    const q = query(accountsCollection(userId));
    const querySnapshot = await getDocs(q);
    const accounts = [];
    querySnapshot.forEach((doc) => {
      accounts.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, accounts };
  } catch (error) {
    console.error('Error getting accounts:', error);
    return { success: false, error: error.message, accounts: [] };
  }
};

export const updateAccount = async (userId, docId, accountData) => {
  try {
    const accountRef = doc(db, 'users', userId, 'accounts', docId);
    await updateDoc(accountRef, {
      ...accountData,
      balance: parseFloat(accountData.balance) || 0,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating account:', error);
    return { success: false, error: error.message };
  }
};

export const deleteAccount = async (userId, docId) => {
  try {
    const accountRef = doc(db, 'users', userId, 'accounts', docId);
    await deleteDoc(accountRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: error.message };
  }
};

// TRANSACTIONS CRUD Operations
export const transactionsCollection = (userId) => collection(db, 'users', userId, 'transactions');

export const addTransaction = async (userId, transactionData) => {
  try {
    const transactionId = generateId();
    const docRef = await addDoc(transactionsCollection(userId), {
      ...transactionData,
      transactionId,
      amount: parseFloat(transactionData.amount) || 0,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id, transactionId };
  } catch (error) {
    console.error('Error adding transaction:', error);
    return { success: false, error: error.message };
  }
};

// CATEGORIES CRUD Operations
export const categoriesCollection = (userId) => collection(db, 'users', userId, 'categories');

export const addCategory = async (userId, categoryData) => {
  try {
    const categoryId = generateId();
    const docRef = await addDoc(categoriesCollection(userId), {
      ...categoryData,
      categoryId,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id, categoryId };
  } catch (error) {
    console.error('Error adding category:', error);
    return { success: false, error: error.message };
  }
};