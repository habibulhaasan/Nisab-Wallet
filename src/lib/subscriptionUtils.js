// src/lib/subscriptionUtils.js
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './firestoreCollections';
import { createAdminNotification, ADMIN_NOTIFICATION_TYPES } from './notificationUtils';

// Subscription Status Types
export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  PENDING: 'pending_approval',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
  FREE: 'free_lifetime'
};

// Payment Method Types
export const PAYMENT_METHODS = {
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  ROCKET: 'Rocket',
  BANK: 'Bank Transfer',
  CASH: 'Cash'
};

/**
 * Create a subscription plan (Admin only)
 */
export const createSubscriptionPlan = async (planData) => {
  try {
    const planId = generateId();
    const plansRef = collection(db, 'subscriptionPlans');
    
    const docRef = await addDoc(plansRef, {
      planId,
      name: planData.name,
      duration: planData.duration, // 'monthly', 'quarterly', 'yearly'
      durationDays: planData.durationDays, // 30, 90, 365
      price: parseFloat(planData.price),
      currency: planData.currency || 'BDT',
      features: planData.features || [],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id, planId };
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all subscription plans
 */
export const getSubscriptionPlans = async (activeOnly = true) => {
  try {
    const plansRef = collection(db, 'subscriptionPlans');
    let q = query(plansRef, orderBy('price', 'asc'));
    
    if (activeOnly) {
      q = query(plansRef, where('isActive', '==', true), orderBy('price', 'asc'));
    }
    
    const querySnapshot = await getDocs(q);
    const plans = [];
    
    querySnapshot.forEach((doc) => {
      plans.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, plans };
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return { success: false, error: error.message, plans: [] };
  }
};

/**
 * Update subscription plan (Admin only)
 */
export const updateSubscriptionPlan = async (docId, planData) => {
  try {
    const planRef = doc(db, 'subscriptionPlans', docId);
    await updateDoc(planRef, {
      ...planData,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete subscription plan (Admin only)
 */
export const deleteSubscriptionPlan = async (docId) => {
  try {
    const planRef = doc(db, 'subscriptionPlans', docId);
    await deleteDoc(planRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create user subscription
 */
export const createUserSubscription = async (userId, subscriptionData) => {
  try {
    const subscriptionId = generateId();
    const subsRef = collection(db, 'users', userId, 'subscriptions');
    
    const docRef = await addDoc(subsRef, {
      subscriptionId,
      planId: subscriptionData.planId,
      planName: subscriptionData.planName,
      status: subscriptionData.status || SUBSCRIPTION_STATUS.TRIAL,
      startDate: subscriptionData.startDate,
      endDate: subscriptionData.endDate,
      paymentMethod: subscriptionData.paymentMethod || '',
      transactionId: subscriptionData.transactionId || '',
      amount: parseFloat(subscriptionData.amount || 0),
      isFirstSubscription: subscriptionData.isFirstSubscription || false,
      isExtension: subscriptionData.isExtension || false,
      durationDays: subscriptionData.durationDays || 0,
      approvedBy: subscriptionData.approvedBy || null,
      approvedAt: subscriptionData.approvedAt || null,
      createdAt: serverTimestamp()
    });

    // Fire admin notification (non-blocking)
    try {
      const userSnap = await getDoc(doc(db, 'users', userId));
      const ud = userSnap.exists() ? userSnap.data() : {};
      const userInfo = { userId, userEmail: ud.email || userId, userName: ud.displayName || ud.name || ud.email || userId };
      const status = subscriptionData.status || SUBSCRIPTION_STATUS.TRIAL;

      if (status === SUBSCRIPTION_STATUS.TRIAL) {
        createAdminNotification(ADMIN_NOTIFICATION_TYPES.TRIAL_STARTED, {
          ...userInfo, trialEndDate: subscriptionData.endDate,
        }).catch(() => {});
      } else if (status === SUBSCRIPTION_STATUS.PENDING) {
        createAdminNotification(ADMIN_NOTIFICATION_TYPES.PAYMENT_PENDING_APPROVAL, {
          ...userInfo,
          planName:      subscriptionData.planName,
          amount:        subscriptionData.amount,
          paymentMethod: subscriptionData.paymentMethod,
          transactionId: subscriptionData.transactionId,
        }).catch(() => {});
      }
    } catch { /* non-critical */ }

    return { success: true, id: docRef.id, subscriptionId };
  } catch (error) {
    console.error('Error creating user subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's current subscription (ACTIVE or TRIAL only, not PENDING)
 */
export const getCurrentSubscription = async (userId) => {
  try {
    const subsRef = collection(db, 'users', userId, 'subscriptions');
    // Get all subscriptions sorted by creation date
    const q = query(subsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    // Find the first active or trial subscription
    for (const doc of querySnapshot.docs) {
      const subData = doc.data();
      if (subData.status === SUBSCRIPTION_STATUS.ACTIVE || subData.status === SUBSCRIPTION_STATUS.TRIAL) {
        return { success: true, subscription: { id: doc.id, ...subData } };
      }
    }
    
    // If no active/trial found, return the most recent one (could be pending, expired, etc.)
    if (!querySnapshot.empty) {
      const latestSub = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      return { success: true, subscription: latestSub };
    }
    
    return { success: true, subscription: null };
  } catch (error) {
    console.error('Error getting current subscription:', error);
    return { success: false, error: error.message, subscription: null };
  }
};

/**
 * Get all user subscriptions (history)
 */
export const getUserSubscriptionHistory = async (userId) => {
  try {
    const subsRef = collection(db, 'users', userId, 'subscriptions');
    const q = query(subsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const subscriptions = [];
    querySnapshot.forEach((doc) => {
      subscriptions.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, subscriptions };
  } catch (error) {
    console.error('Error getting subscription history:', error);
    return { success: false, error: error.message, subscriptions: [] };
  }
};

/**
 * Update subscription status (Admin approval/rejection/extension)
 */
export const updateSubscriptionStatus = async (userId, subscriptionDocId, updateData) => {
  try {
    const subsRef = doc(db, 'users', userId, 'subscriptions', subscriptionDocId);
    await updateDoc(subsRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has valid access
 * ✅ FIXED: Now checks for ANY active or trial subscription, not just the latest one
 */
export const checkUserAccess = async (userId) => {
  try {
    // Get user profile
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { hasAccess: false, reason: 'User not found' };
    }
    
    const userData = userSnap.data();
    
    // Check if user is blocked
    if (userData.isBlocked) {
      return { hasAccess: false, reason: 'Account blocked', userData };
    }
    
    // Check if user is grandfathered (free lifetime)
    if (userData.subscriptionStatus === SUBSCRIPTION_STATUS.FREE) {
      return { hasAccess: true, reason: 'Free lifetime access', userData };
    }
    
    // Check if user is admin
    if (userData.role === 'admin') {
      return { hasAccess: true, reason: 'Admin access', userData };
    }
    
    // ✅ FIX: Get ALL subscriptions and find ANY active or trial
    const subsRef = collection(db, 'users', userId, 'subscriptions');
    const q = query(subsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { hasAccess: false, reason: 'No subscription found', userData };
    }
    
    const allSubscriptions = [];
    querySnapshot.forEach((doc) => {
      allSubscriptions.push({ id: doc.id, ...doc.data() });
    });
    
    // Find the first active or trial subscription
    const now = new Date();
    
    for (const subscription of allSubscriptions) {
      // Check trial status
      if (subscription.status === SUBSCRIPTION_STATUS.TRIAL) {
        const endDate = new Date(subscription.endDate);
        if (now <= endDate) {
          return { hasAccess: true, reason: 'Trial period active', subscription, userData };
        }
      }
      
      // Check active subscription
      if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
        const endDate = new Date(subscription.endDate);
        if (now <= endDate) {
          return { hasAccess: true, reason: 'Active subscription', subscription, userData };
        }
      }
    }
    
    // If we get here, user has subscriptions but none are active/trial or all are expired
    // Check what the latest subscription status is
    const latestSubscription = allSubscriptions[0];
    
    if (latestSubscription.status === SUBSCRIPTION_STATUS.TRIAL) {
      return { hasAccess: false, reason: 'Trial expired', subscription: latestSubscription, userData };
    }
    
    if (latestSubscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
      return { hasAccess: false, reason: 'Subscription expired', subscription: latestSubscription, userData };
    }
    
    if (latestSubscription.status === SUBSCRIPTION_STATUS.PENDING) {
      return { hasAccess: false, reason: 'Pending admin approval', subscription: latestSubscription, userData };
    }
    
    if (latestSubscription.status === SUBSCRIPTION_STATUS.REJECTED) {
      return { hasAccess: false, reason: 'Subscription rejected', subscription: latestSubscription, userData };
    }
    
    // Default: no access
    return { hasAccess: false, reason: 'Invalid subscription status', subscription: latestSubscription, userData };
    
  } catch (error) {
    console.error('Error checking user access:', error);
    return { hasAccess: false, reason: 'Error checking access', error: error.message };
  }
};

/**
 * Calculate trial end date (5 days from start)
 */
export const calculateTrialEndDate = (startDate, trialDays = 5) => {
  const start = new Date(startDate);
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + trialDays);
  return endDate.toISOString().split('T')[0];
};

/**
 * Calculate subscription end date based on plan
 */
export const calculateSubscriptionEndDate = (startDate, durationDays) => {
  const start = new Date(startDate);
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate.toISOString().split('T')[0];
};

/**
 * Get days until expiry
 */
export const getDaysUntilExpiry = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if user should receive expiry notification
 */
export const shouldSendExpiryNotification = (endDate, notificationDays = [7, 3, 1]) => {
  const daysLeft = getDaysUntilExpiry(endDate);
  return notificationDays.includes(daysLeft);
};