// src/lib/adminUtils.js
import { collection, getDocs, getDoc, doc, updateDoc, query, orderBy, where, serverTimestamp, addDoc, limit, deleteField } from 'firebase/firestore';
import { db } from './firebase';
import { SUBSCRIPTION_STATUS } from './subscriptionUtils';

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
 * Get all users (Admin only) - with admin notes
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    
    // Fetch each user with their latest admin note
    for (const userDoc of querySnapshot.docs) {
      const userData = { id: userDoc.id, ...userDoc.data() };
      
      // Get the latest admin note for this user
      try {
        const notesRef = collection(db, 'users', userDoc.id, 'adminNotes');
        const notesQuery = query(notesRef, orderBy('createdAt', 'desc'), limit(1));
        const notesSnapshot = await getDocs(notesQuery);
        
        const notes = [];
        notesSnapshot.forEach((noteDoc) => {
          notes.push({ id: noteDoc.id, ...noteDoc.data() });
        });
        
        userData.adminNotes = notes;
      } catch (noteError) {
        console.error(`Error fetching notes for user ${userDoc.id}:`, noteError);
        userData.adminNotes = [];
      }
      
      users.push(userData);
    }
    
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
 */
export const approveSubscription = async (userId, subscriptionId, adminId) => {
  try {
    const subsRef = doc(db, 'users', userId, 'subscriptions', subscriptionId);
    const subsSnap = await getDoc(subsRef);
    
    if (!subsSnap.exists()) {
      return { success: false, error: 'Subscription not found' };
    }
    
    const subData = subsSnap.data();
    
    await updateDoc(subsRef, {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      approvedBy: adminId,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update user profile subscription status
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
      updatedAt: serverTimestamp()
    });
    
    // Create notification
    const { createNotification, NOTIFICATION_TYPES } = await import('./notificationUtils');
    await createNotification(userId, NOTIFICATION_TYPES.PAYMENT_APPROVED, {
      planName: subData.planName,
      amount: subData.amount
    });
    
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
    const subsRef = doc(db, 'users', userId, 'subscriptions', subscriptionId);
    
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
    const { createNotification, NOTIFICATION_TYPES } = await import('./notificationUtils');
    await createNotification(userId, NOTIFICATION_TYPES.PAYMENT_REJECTED, {
      reason: reason
    });
    
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
    
    if (isBlocked) {
      // Blocking the user
      await updateDoc(userRef, {
        isBlocked: true,
        blockedBy: adminId,
        blockedAt: serverTimestamp(),
        blockReason: reason,
        updatedAt: serverTimestamp()
      });
    } else {
      // Unblocking the user - use deleteField for proper cleanup
      await updateDoc(userRef, {
        isBlocked: false,
        blockedBy: deleteField(),
        blockedAt: deleteField(),
        blockReason: deleteField(),
        updatedAt: serverTimestamp()
      });
    }
    
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
        grantReason: reason,
        updatedAt: serverTimestamp()
      });
      
      // Create notification
      const { createNotification, NOTIFICATION_TYPES } = await import('./notificationUtils');
      await createNotification(userId, NOTIFICATION_TYPES.PAYMENT_APPROVED, {
        planName: `Free Access (${days} days)`,
        amount: 0
      });
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
    
    const newNote = {
      note: noteData.note,
      createdBy: noteData.adminId,
      createdByName: noteData.adminName,
      createdAt: serverTimestamp()
    };
    
    await addDoc(notesRef, newNote);
    
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
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating last login:', error);
    return { success: false, error: error.message };
  }
};