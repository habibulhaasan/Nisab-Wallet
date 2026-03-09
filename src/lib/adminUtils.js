// src/lib/adminUtils.js
import { collection, getDocs, getDoc, doc, updateDoc, setDoc, query, orderBy, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SUBSCRIPTION_STATUS } from './subscriptionUtils';
import { createAdminNotification, ADMIN_NOTIFICATION_TYPES } from './notificationUtils';

const _ui = async (userId) => {
  try {
    const d = (await getDoc(doc(db, 'users', userId))).data() || {};
    return { userId, userEmail: d.email || userId, userName: d.displayName || d.name || d.email || userId };
  } catch { return { userId, userEmail: userId, userName: userId }; }
};

/**
 * Check if user is admin
 */
export const checkIsAdmin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.role === 'admin';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, users };
  } catch (error) {
    console.error('Error getting all users:', error);
    return { success: false, error: error.message, users: [] };
  }
};

/**
 * Get user details with subscription info (Admin only)
 */
export const getUserDetails = async (userId) => {
  try {
    // Get user profile
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = { id: userSnap.id, ...userSnap.data() };
    
    // Get subscription history
    const subsRef = collection(db, 'users', userId, 'subscriptions');
    const subsQuery = query(subsRef, orderBy('createdAt', 'desc'));
    const subsSnapshot = await getDocs(subsQuery);
    
    const subscriptions = [];
    subsSnapshot.forEach((doc) => {
      subscriptions.push({ id: doc.id, ...doc.data() });
    });
    
    // Get admin notes
    const notesRef = collection(db, 'users', userId, 'adminNotes');
    const notesQuery = query(notesRef, orderBy('createdAt', 'desc'));
    const notesSnapshot = await getDocs(notesQuery);
    
    const notes = [];
    notesSnapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      success: true,
      user: userData,
      subscriptions,
      notes
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user subscription status (Admin only)
 * ✅ FIXED: Now correctly calculates start date as current_end + 1 day
 */
export const approveSubscription = async (userId, subscriptionId, adminId) => {
  try {
    const subsRef = doc(db, 'users', userId, 'subscriptions', subscriptionId);
    const subsSnap = await getDoc(subsRef);
    
    if (!subsSnap.exists()) {
      return { success: false, error: 'Subscription not found' };
    }
    
    const subData = subsSnap.data();
    
    // Check if this is an extension request
    const isExtension = subData.isExtension === true;
    
    let finalStartDate = subData.startDate;
    let finalEndDate = subData.endDate;
    
    if (isExtension) {
      // Get all active subscriptions to find the current end date
      const subsCollectionRef = collection(db, 'users', userId, 'subscriptions');
      const activeSubsQuery = query(
        subsCollectionRef, 
        where('status', '==', SUBSCRIPTION_STATUS.ACTIVE),
        orderBy('endDate', 'desc')
      );
      const activeSubsSnapshot = await getDocs(activeSubsQuery);
      
      let latestEndDate = new Date();
      
      activeSubsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== subscriptionId) { // Exclude current extension request
          const endDate = new Date(data.endDate);
          if (endDate > latestEndDate) {
            latestEndDate = endDate;
          }
        }
      });
      
      // ✅ FIX: Calculate new START date: current end date + 1 DAY
      const newStartDate = new Date(latestEndDate);
      newStartDate.setDate(newStartDate.getDate() + 1); // ADD 1 DAY!
      
      // Calculate new end date: new start date + extension days
      const extensionDays = parseInt(subData.durationDays || 0);
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + extensionDays);
      
      finalStartDate = newStartDate.toISOString().split('T')[0];
      finalEndDate = newEndDate.toISOString().split('T')[0];
      
      // Update subscription with correct dates
      await updateDoc(subsRef, {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: finalStartDate,
        endDate: finalEndDate,
        approvedBy: adminId,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Regular approval (not an extension)
      await updateDoc(subsRef, {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        approvedBy: adminId,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Update user profile subscription status
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
      updatedAt: serverTimestamp()
    });
    
    // Create notification
    try {
      const { createNotification, NOTIFICATION_TYPES } = await import('./notificationUtils');
      await createNotification(userId, NOTIFICATION_TYPES.PAYMENT_APPROVED, {
        planName: subData.planName,
        amount: subData.amount
      });
    } catch (notifError) {
      console.log('Notification error (non-critical):', notifError);
    }

    // Notify all admins
    _ui(userId).then(ui => createAdminNotification(ADMIN_NOTIFICATION_TYPES.SUBSCRIPTION_APPROVED, {
      ...ui, planName: subData.planName, amount: subData.amount,
    })).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error('Error approving subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject subscription (Admin only)
 */
export const rejectSubscription = async (userId, subscriptionId, adminId, reason = '') => {
  try {
    const subsRef  = doc(db, 'users', userId, 'subscriptions', subscriptionId);
    const subsSnap = await getDoc(subsRef);
    const subData  = subsSnap.exists() ? subsSnap.data() : {};

    await updateDoc(subsRef, {
      status: SUBSCRIPTION_STATUS.REJECTED,
      rejectedBy: adminId,
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
      updatedAt: serverTimestamp()
    });
    
    // Update user profile subscription status
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscriptionStatus: SUBSCRIPTION_STATUS.REJECTED,
      updatedAt: serverTimestamp()
    });
    
    // Create notification
    try {
      const { createNotification, NOTIFICATION_TYPES } = await import('./notificationUtils');
      await createNotification(userId, NOTIFICATION_TYPES.PAYMENT_REJECTED, {
        reason: reason
      });
    } catch (notifError) {
      console.log('Notification error (non-critical):', notifError);
    }

    // Notify all admins
    _ui(userId).then(ui => createAdminNotification(ADMIN_NOTIFICATION_TYPES.SUBSCRIPTION_REJECTED, {
      ...ui, planName: subData.planName, reason,
    })).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error('Error rejecting subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Block/Unblock user (Admin only)
 */
export const toggleBlockUser = async (userId, isBlocked, adminId, reason = '') => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      isBlocked,
      blockedBy:   isBlocked ? adminId : null,
      blockedAt:   isBlocked ? serverTimestamp() : null,
      blockReason: reason,
      updatedAt:   serverTimestamp()
    });

    // Notify all admins
    _ui(userId).then(ui => createAdminNotification(
      isBlocked ? ADMIN_NOTIFICATION_TYPES.ACCOUNT_BLOCKED : ADMIN_NOTIFICATION_TYPES.ACCOUNT_UNBLOCKED,
      { ...ui, reason }
    )).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error('Error toggling block user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Extend user subscription manually (Admin only)
 */
export const extendSubscription = async (userId, extensionData) => {
  try {
    const subsRef = collection(db, 'users', userId, 'subscriptions');
    
    await addDoc(subsRef, {
      subscriptionId: `ext-${Date.now()}`,
      planId: extensionData.planId || 'admin_extension',
      planName: extensionData.planName || 'Admin Extension',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      startDate: extensionData.startDate,
      endDate: extensionData.endDate,
      amount: parseFloat(extensionData.amount || 0),
      paymentMethod: 'Admin Extension',
      transactionId: extensionData.transactionId || 'N/A',
      extendedBy: extensionData.adminId,
      extensionReason: extensionData.reason || '',
      isManualExtension: true,
      createdAt: serverTimestamp()
    });
    
    // Update user profile subscription status
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error extending subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Grant free access (Admin only) - supports both lifetime and time-limited
 */
export const grantFreeLifetimeAccess = async (userId, adminId, reason = '', days = null) => {
  try {
    const userRef = doc(db, 'users', userId);
    const subsRef = collection(db, 'users', userId, 'subscriptions');
    
    if (days && days > 0) {
      // Grant time-limited free access by creating a subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(days));
      
      // Create free subscription
      await addDoc(subsRef, {
        subscriptionId: `free-${Date.now()}`,
        planId: 'free_access',
        planName: `Free Access (${days} days)`,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        amount: 0,
        paymentMethod: 'Free Access (Admin)',
        transactionId: 'FREE-ADMIN',
        grantedBy: adminId,
        grantReason: reason,
        isFreeAccess: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update user profile
      await updateDoc(userRef, {
        subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
        updatedAt: serverTimestamp()
      });
      
      // Create notification
      try {
        const { createNotification, NOTIFICATION_TYPES } = await import('./notificationUtils');
        await createNotification(userId, NOTIFICATION_TYPES.PAYMENT_APPROVED, {
          planName: `Free Access (${days} days)`,
          amount: 0
        });
      } catch (notifError) {
        console.log('Notification error (non-critical):', notifError);
      }
    } else {
      // Grant lifetime free access
      await updateDoc(userRef, {
        subscriptionStatus: SUBSCRIPTION_STATUS.FREE,
        grantedBy: adminId,
        grantedAt: serverTimestamp(),
        grantReason: reason,
        updatedAt: serverTimestamp()
      });
    }

    // Notify all admins about free access grant
    _ui(userId).then(ui => createAdminNotification(ADMIN_NOTIFICATION_TYPES.FREE_ACCESS_GRANTED, {
      ...ui, days, reason,
    })).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error('Error granting free access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add admin note for user (Admin only)
 */
export const addAdminNote = async (userId, noteData) => {
  try {
    const notesRef = collection(db, 'users', userId, 'adminNotes');
    
    await addDoc(notesRef, {
      note: noteData.note,
      createdBy: noteData.adminId,
      createdByName: noteData.adminName,
      createdAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding admin note:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get revenue statistics (Admin only)
 */
export const getRevenueStatistics = async (startDate = null, endDate = null) => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let totalRevenue = 0;
    let paidSubscriptions = 0;
    let freeUsers = 0;
    let trialUsers = 0;
    let activeUsers = 0;
    let expiredUsers = 0;
    
    const revenueByDate = {};
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Count user types
      if (userData.subscriptionStatus === SUBSCRIPTION_STATUS.FREE) {
        freeUsers++;
      }
      
      // Get subscriptions
      const subsRef = collection(db, 'users', userId, 'subscriptions');
      const subsSnapshot = await getDocs(subsRef);
      
      subsSnapshot.forEach((subsDoc) => {
        const sub = subsDoc.data();
        
        // Count subscription types
        if (sub.status === SUBSCRIPTION_STATUS.TRIAL) {
          trialUsers++;
        } else if (sub.status === SUBSCRIPTION_STATUS.ACTIVE) {
          activeUsers++;
        } else if (sub.status === SUBSCRIPTION_STATUS.EXPIRED) {
          expiredUsers++;
        }
        
        // Calculate revenue
        if (sub.status === SUBSCRIPTION_STATUS.ACTIVE && sub.amount > 0) {
          paidSubscriptions++;
          totalRevenue += sub.amount;
          
          // Group by date
          const createdDate = sub.createdAt?.toDate().toISOString().split('T')[0];
          if (createdDate) {
            revenueByDate[createdDate] = (revenueByDate[createdDate] || 0) + sub.amount;
          }
        }
      });
    }
    
    return {
      success: true,
      statistics: {
        totalRevenue,
        paidSubscriptions,
        freeUsers,
        trialUsers,
        activeUsers,
        expiredUsers,
        revenueByDate
      }
    };
  } catch (error) {
    console.error('Error getting revenue statistics:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user last login time
 */
export const updateLastLogin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      lastLoginAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating last login:', error);
    return { success: false, error: error.message };
  }
};