// src/lib/paymentGatewayUtils.js
import { collection, addDoc, getDocs, updateDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './firestoreCollections';

/**
 * Create or update payment gateway settings (Admin only)
 */
export const savePaymentGatewaySettings = async (settingsData) => {
  try {
    const settingsRef = collection(db, 'appSettings');
    const q = query(settingsRef, where('type', '==', 'paymentGateway'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing settings
      const docId = querySnapshot.docs[0].id;
      const docRef = doc(db, 'appSettings', docId);
      await updateDoc(docRef, {
        ...settingsData,
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docId };
    } else {
      // Create new settings
      const docRef = await addDoc(settingsRef, {
        type: 'paymentGateway',
        ...settingsData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    }
  } catch (error) {
    console.error('Error saving payment gateway settings:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get payment gateway settings
 */
export const getPaymentGatewaySettings = async () => {
  try {
    const settingsRef = collection(db, 'appSettings');
    const q = query(settingsRef, where('type', '==', 'paymentGateway'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const settings = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      return { success: true, settings };
    }
    
    // Return default settings if none exist
    return {
      success: true,
      settings: {
        mode: 'single', // 'single' or 'multiple'
        methods: [],
        instructions: ''
      }
    };
  } catch (error) {
    console.error('Error getting payment gateway settings:', error);
    return { success: false, error: error.message, settings: null };
  }
};

/**
 * Create or update trial period settings (Admin only)
 */
export const saveTrialPeriodSettings = async (trialDays) => {
  try {
    const settingsRef = collection(db, 'appSettings');
    const q = query(settingsRef, where('type', '==', 'trialPeriod'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing settings
      const docId = querySnapshot.docs[0].id;
      const docRef = doc(db, 'appSettings', docId);
      await updateDoc(docRef, {
        trialDays: parseInt(trialDays),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docId };
    } else {
      // Create new settings
      const docRef = await addDoc(settingsRef, {
        type: 'trialPeriod',
        trialDays: parseInt(trialDays),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    }
  } catch (error) {
    console.error('Error saving trial period settings:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get trial period settings
 */
export const getTrialPeriodSettings = async () => {
  try {
    const settingsRef = collection(db, 'appSettings');
    const q = query(settingsRef, where('type', '==', 'trialPeriod'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const settings = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      return { success: true, trialDays: settings.trialDays };
    }
    
    // Return default 5 days if not configured
    return { success: true, trialDays: 5 };
  } catch (error) {
    console.error('Error getting trial period settings:', error);
    return { success: false, error: error.message, trialDays: 5 };
  }
};

/**
 * Add payment method to settings
 */
export const addPaymentMethod = async (method) => {
  try {
    const { settings } = await getPaymentGatewaySettings();
    
    const updatedMethods = [...(settings.methods || []), {
      id: generateId(),
      name: method.name,
      type: method.type, // 'bKash', 'Nagad', 'Bank', etc.
      accountNumber: method.accountNumber || '',
      accountName: method.accountName || '',
      instructions: method.instructions || '',
      isActive: true
    }];
    
    return await savePaymentGatewaySettings({
      ...settings,
      methods: updatedMethods
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update payment method
 */
export const updatePaymentMethod = async (methodId, updatedData) => {
  try {
    const { settings } = await getPaymentGatewaySettings();
    
    const updatedMethods = settings.methods.map(method => 
      method.id === methodId ? { ...method, ...updatedData } : method
    );
    
    return await savePaymentGatewaySettings({
      ...settings,
      methods: updatedMethods
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove payment method
 */
export const removePaymentMethod = async (methodId) => {
  try {
    const { settings } = await getPaymentGatewaySettings();
    
    const updatedMethods = settings.methods.filter(method => method.id !== methodId);
    
    return await savePaymentGatewaySettings({
      ...settings,
      methods: updatedMethods
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return { success: false, error: error.message };
  }
};