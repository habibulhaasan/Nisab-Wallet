// src/lib/notificationUtils.js
import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, serverTimestamp, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './firestoreCollections';

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN NOTIFICATION SYSTEM
// Writes ONLY to the global `adminNotifications` collection.
// The AdminNotificationBell listens to this collection directly — no fan-out
// to individual user paths (which would be blocked by Firestore rules).
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_NOTIFICATION_TYPES = {
  NEW_SUBSCRIPTION_PURCHASE : 'admin_new_subscription_purchase',
  TRIAL_STARTED             : 'admin_trial_started',
  TRIAL_EXPIRED             : 'admin_trial_expired',
  SUBSCRIPTION_EXPIRED      : 'admin_subscription_expired',
  NEW_FEEDBACK              : 'admin_new_feedback',
  PAYMENT_PENDING_APPROVAL  : 'admin_payment_pending_approval',
  USER_REGISTERED           : 'admin_user_registered',
  ACCOUNT_BLOCKED           : 'admin_account_blocked',
  ACCOUNT_UNBLOCKED         : 'admin_account_unblocked',
  FREE_ACCESS_GRANTED       : 'admin_free_access_granted',
  SUBSCRIPTION_REJECTED     : 'admin_subscription_rejected',
  SUBSCRIPTION_APPROVED     : 'admin_subscription_approved',
};

const getAdminNotificationContent = (type, data = {}) => {
  const name = data.userName || data.userEmail || 'A user';
  switch (type) {
    case ADMIN_NOTIFICATION_TYPES.NEW_SUBSCRIPTION_PURCHASE:
      return {
        title: '💳 New Purchase Submitted',
        message: `${name} submitted payment for ${data.planName || 'a plan'} (৳${data.amount ?? 0}) via ${data.paymentMethod || 'N/A'}. Awaiting approval.`,
        category: 'subscription', priority: 'high',
      };
    case ADMIN_NOTIFICATION_TYPES.SUBSCRIPTION_APPROVED:
      return {
        title: '✅ Subscription Approved',
        message: `${name}'s payment for ${data.planName || 'a plan'} was approved.`,
        category: 'subscription', priority: 'low',
      };
    case ADMIN_NOTIFICATION_TYPES.SUBSCRIPTION_REJECTED:
      return {
        title: '❌ Subscription Rejected',
        message: `${name}'s payment for ${data.planName || 'a plan'} was rejected. Reason: ${data.reason || 'Not specified'}.`,
        category: 'subscription', priority: 'medium',
      };
    case ADMIN_NOTIFICATION_TYPES.TRIAL_STARTED:
      return {
        title: '🆕 New Trial Started',
        message: `${name} started a free trial ending on ${data.trialEndDate || 'N/A'}.`,
        category: 'user', priority: 'low',
      };
    case ADMIN_NOTIFICATION_TYPES.TRIAL_EXPIRED:
      return {
        title: '⏰ Trial Expired',
        message: `${name}'s free trial has expired.`,
        category: 'subscription', priority: 'medium',
      };
    case ADMIN_NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
      return {
        title: '📅 Subscription Expired',
        message: `${name}'s ${data.planName || 'subscription'} expired on ${data.endDate || 'N/A'}.`,
        category: 'subscription', priority: 'medium',
      };
    case ADMIN_NOTIFICATION_TYPES.NEW_FEEDBACK:
      return {
        title: '💬 New User Feedback',
        message: `${name} submitted ${data.type || 'feedback'} with ${data.rating ?? '?'}★: "${data.preview || ''}"`,
        category: 'feedback', priority: 'medium',
      };
    case ADMIN_NOTIFICATION_TYPES.PAYMENT_PENDING_APPROVAL:
      return {
        title: '🔔 Payment Awaiting Approval',
        message: `${name} is waiting for approval (${data.planName || 'plan'}, ৳${data.amount ?? 0}, via ${data.paymentMethod || 'N/A'}).`,
        category: 'subscription', priority: 'high',
      };
    case ADMIN_NOTIFICATION_TYPES.USER_REGISTERED:
      return {
        title: '👤 New User Registered',
        message: `${name} created an account.`,
        category: 'user', priority: 'low',
      };
    case ADMIN_NOTIFICATION_TYPES.ACCOUNT_BLOCKED:
      return {
        title: '🚫 Account Blocked',
        message: `${name}'s account was blocked. Reason: ${data.reason || 'Not specified'}.`,
        category: 'user', priority: 'medium',
      };
    case ADMIN_NOTIFICATION_TYPES.ACCOUNT_UNBLOCKED:
      return {
        title: '✅ Account Unblocked',
        message: `${name}'s account has been restored.`,
        category: 'user', priority: 'low',
      };
    case ADMIN_NOTIFICATION_TYPES.FREE_ACCESS_GRANTED:
      return {
        title: '🎁 Free Access Granted',
        message: `${name} was granted free access${data.days ? ` for ${data.days} days` : ' (lifetime)'}.`,
        category: 'user', priority: 'low',
      };
    default:
      return { title: 'Admin Alert', message: 'A system event needs attention.', category: 'system', priority: 'low' };
  }
};

/**
 * Write an admin notification to the global `adminNotifications` collection.
 * The admin's NotificationBell listens to this collection directly via onSnapshot.
 * This avoids writing to other users' subcollections (blocked by Firestore rules).
 */
export const createAdminNotification = async (type, data = {}) => {
  try {
    const content = getAdminNotificationContent(type, data);
    await addDoc(collection(db, 'adminNotifications'), {
      notificationId: generateId(),
      type,
      title:    content.title,
      message:  content.message,
      category: content.category,
      priority: content.priority,
      data,
      read:      false,
      createdAt: serverTimestamp(),   // fresh call — not reused
    });
    return { success: true };
  } catch (error) {
    console.error('[AdminNotif] Failed to write:', error.code, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get all admin notifications (for initial load)
 */
export const getAdminNotifications = async (unreadOnly = false) => {
  try {
    const ref = collection(db, 'adminNotifications');
    const q = unreadOnly
      ? query(ref, where('read', '==', false), orderBy('createdAt', 'desc'))
      : query(ref, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[AdminNotif] getAdminNotifications error:', error);
    return [];
  }
};

/**
 * Mark a single admin notification as read
 */
export const markAdminNotificationRead = async (notifId) => {
  try {
    await updateDoc(doc(db, 'adminNotifications', notifId), { read: true });
  } catch (error) {
    console.error('[AdminNotif] markRead error:', error);
  }
};

/**
 * Mark ALL admin notifications as read
 */
export const markAllAdminNotificationsRead = async () => {
  try {
    const snap = await getDocs(
      query(collection(db, 'adminNotifications'), where('read', '==', false))
    );
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (error) {
    console.error('[AdminNotif] markAllRead error:', error);
  }
};

/**
 * Delete a single admin notification
 */
export const deleteAdminNotification = async (notifId) => {
  try {
    await deleteDoc(doc(db, 'adminNotifications', notifId));
  } catch (error) {
    console.error('[AdminNotif] delete error:', error);
  }
};

/**
 * Clear all admin notifications
 */
export const clearAllAdminNotifications = async () => {
  try {
    const snap = await getDocs(collection(db, 'adminNotifications'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    console.error('[AdminNotif] clearAll error:', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER NOTIFICATION SYSTEM (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

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
      read: false,
      isRead: false,
      createdAt: serverTimestamp()
    });
    return { success: true, notificationId };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

const getNotificationContent = (type, data) => {
  switch (type) {
    case NOTIFICATION_TYPES.TRIAL_EXPIRY_3DAYS:
      return { title: 'Trial Ending Soon', message: 'Your free trial will expire in 3 days. Subscribe now to continue using Nisab Wallet.' };
    case NOTIFICATION_TYPES.TRIAL_EXPIRY_1DAY:
      return { title: 'Trial Expires Tomorrow', message: 'Your free trial expires tomorrow. Subscribe now to avoid losing access.' };
    case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRY_7DAYS:
      return { title: 'Subscription Expiring Soon', message: `Your ${data.planName || 'subscription'} will expire in 7 days. Renew to continue your service.` };
    case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRY_3DAYS:
      return { title: 'Subscription Expiring Soon', message: `Your ${data.planName || 'subscription'} will expire in 3 days. Renew now to avoid interruption.` };
    case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRY_1DAY:
      return { title: 'Subscription Expires Tomorrow', message: `Your ${data.planName || 'subscription'} expires tomorrow. Renew now to keep your access.` };
    case NOTIFICATION_TYPES.PAYMENT_APPROVED:
      return { title: 'Payment Approved', message: `Your payment for ${data.planName || 'subscription'} has been approved. Welcome to Nisab Wallet!` };
    case NOTIFICATION_TYPES.PAYMENT_REJECTED:
      return { title: 'Payment Not Verified', message: `Your payment could not be verified. ${data.reason || 'Please try again with correct information.'}` };
    case NOTIFICATION_TYPES.ACCOUNT_BLOCKED:
      return { title: 'Account Suspended', message: `Your account has been temporarily suspended. ${data.reason || 'Please contact support for assistance.'}` };
    case NOTIFICATION_TYPES.ACCOUNT_UNBLOCKED:
      return { title: 'Account Restored', message: 'Your account has been restored. You can now access Nisab Wallet.' };
    case NOTIFICATION_TYPES.FREE_ACCESS_GRANTED:
      return { title: 'Free Lifetime Access Granted', message: 'Congratulations! You have been granted free lifetime access to Nisab Wallet.' };
    case NOTIFICATION_TYPES.SUBSCRIPTION_EXTENDED:
      return { title: 'Subscription Extended', message: `Your subscription has been extended until ${data.endDate || 'the new date'}. Enjoy Nisab Wallet!` };
    default:
      return { title: 'Notification', message: 'You have a new notification from Nisab Wallet.' };
  }
};

export const getUserNotifications = async (userId, unreadOnly = false) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    let q = unreadOnly
      ? query(notificationsRef, where('read', '==', false), orderBy('createdAt', 'desc'))
      : query(notificationsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, notifications };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return { success: false, error: error.message, notifications: [] };
  }
};

export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
      read: true, isRead: true, readAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, { read: true, isRead: true, readAt: serverTimestamp() });
    });
    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteNotification = async (userId, notificationId) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'notifications', notificationId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUnreadCount = async (userId) => {
  try {
    const q = query(collection(db, 'users', userId, 'notifications'), where('read', '==', false));
    const snap = await getDocs(q);
    return { success: true, count: snap.size };
  } catch (error) {
    return { success: false, error: error.message, count: 0 };
  }
};

export const notificationExists = async (userId, type, dateKey) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('type', '==', type),
      where('data.dateKey', '==', dateKey)
    );
    const snap = await getDocs(q);
    return snap.size > 0;
  } catch (error) {
    return false;
  }
};