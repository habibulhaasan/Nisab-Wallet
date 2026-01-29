// src/lib/notificationUtils.js
import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './firestoreCollections';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  TRIAL_EXPIRY_3DAYS: 'trial_expiry_3days',
  TRIAL_EXPIRY_1DAY: 'trial_expiry_1day',
  SUBSCRIPTION_EXPIRY_7DAYS: 'subscription_expiry_7days',
  SUBSCRIPTION_EXPIRY_3DAYS: 'subscription_expiry_3days',
  SUBSCRIPTION_EXPIRY_1DAY: 'subscription_expiry_1day',
  PAYMENT_APPROVED: 'payment_approved',
  PAYMENT_REJECTED: 'payment_rejected',
  ACCOUNT_BLOCKED: 'account_blocked',
  ACCOUNT_UNBLOCKED: 'account_unblocked',
  FREE_ACCESS_GRANTED: 'free_access_granted',
  SUBSCRIPTION_EXTENDED: 'subscription_extended'
};

/**
 * Create a notification for a user
 */
export const createNotification = async (userId, notificationType, data = {}) => {
  try {
    const notificationId = generateId();
    const notificationsRef = collection(db, 'users', userId, 'notifications');

    const notificationContent = getNotificationContent(notificationType, data);

    await addDoc(notificationsRef, {
      notificationId,
      type: notificationType,
      title: notificationContent.title,
      message: notificationContent.message,
      data: data,
      isRead: false,
      createdAt: serverTimestamp()
    });

    return { success: true, notificationId };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notification content based on type
 */
const getNotificationContent = (type, data) => {
  switch (type) {
    case NOTIFICATION_TYPES.TRIAL_EXPIRY_3DAYS:
      return {
        title: 'Trial Ending Soon',
        message: 'Your free trial will expire in 3 days. Subscribe now to continue using Nisab Wallet.'
      };

    case NOTIFICATION_TYPES.TRIAL_EXPIRY_1DAY:
      return {
        title: 'Trial Expires Tomorrow',
        message: 'Your free trial expires tomorrow. Subscribe now to avoid losing access.'
      };

    case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRY_7DAYS:
      return {
        title: 'Subscription Expiring Soon',
        message: `Your ${data.planName || 'subscription'} will expire in 7 days. Renew to continue your service.`
      };

    case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRY_3DAYS:
      return {
        title: 'Subscription Expiring Soon',
        message: `Your ${data.planName || 'subscription'} will expire in 3 days. Renew now to avoid interruption.`
      };

    case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRY_1DAY:
      return {
        title: 'Subscription Expires Tomorrow',
        message: `Your ${data.planName || 'subscription'} expires tomorrow. Renew now to keep your access.`
      };

    case NOTIFICATION_TYPES.PAYMENT_APPROVED:
      return {
        title: 'Payment Approved',
        message: `Your payment for ${data.planName || 'subscription'} has been approved. Welcome to Nisab Wallet!`
      };

    case NOTIFICATION_TYPES.PAYMENT_REJECTED:
      return {
        title: 'Payment Not Verified',
        message: `Your payment could not be verified. ${data.reason || 'Please try again with correct information.'}`
      };

    case NOTIFICATION_TYPES.ACCOUNT_BLOCKED:
      return {
        title: 'Account Suspended',
        message: `Your account has been temporarily suspended. ${data.reason || 'Please contact support for assistance.'}`
      };

    case NOTIFICATION_TYPES.ACCOUNT_UNBLOCKED:
      return {
        title: 'Account Restored',
        message: 'Your account has been restored. You can now access Nisab Wallet.'
      };

    case NOTIFICATION_TYPES.FREE_ACCESS_GRANTED:
      return {
        title: 'Free Lifetime Access Granted',
        message: 'Congratulations! You have been granted free lifetime access to Nisab Wallet.'
      };

    case NOTIFICATION_TYPES.SUBSCRIPTION_EXTENDED:
      return {
        title: 'Subscription Extended',
        message: `Your subscription has been extended until ${data.endDate || 'the new date'}. Enjoy Nisab Wallet!`
      };

    default:
      return {
        title: 'Notification',
        message: 'You have a new notification from Nisab Wallet.'
      };
  }
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId, unreadOnly = false) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    let q = query(notificationsRef, orderBy('createdAt', 'desc'));

    if (unreadOnly) {
      q = query(notificationsRef, where('isRead', '==', false), orderBy('createdAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    const notifications = [];

    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, notifications };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return { success: false, error: error.message, notifications: [] };
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('isRead', '==', false));
    const querySnapshot = await getDocs(q);

    const updatePromises = [];
    querySnapshot.forEach((docSnap) => {
      const notificationRef = doc(db, 'users', userId, 'notifications', docSnap.id);
      updatePromises.push(updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      }));
    });

    await Promise.all(updatePromises);

    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(notificationRef);

    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('isRead', '==', false));
    const querySnapshot = await getDocs(q);

    return { success: true, count: querySnapshot.size };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, error: error.message, count: 0 };
  }
};

/**
 * Check if notification already exists (prevent duplicates)
 */
export const notificationExists = async (userId, type, dateKey) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(
      notificationsRef,
      where('type', '==', type),
      where('data.dateKey', '==', dateKey)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.size > 0;
  } catch (error) {
    console.error('Error checking notification existence:', error);
    return false;
  }
};