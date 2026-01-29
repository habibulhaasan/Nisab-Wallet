// src/lib/accessControl.js
import { checkUserAccess } from './subscriptionUtils';
import { updateLastLogin } from './adminUtils';

/**
 * Validate user access and return appropriate redirect/status
 */
export const validateAccess = async (userId) => {
  try {
    // Update last login
    await updateLastLogin(userId);

    // Check access
    const accessResult = await checkUserAccess(userId);

    return {
      hasAccess: accessResult.hasAccess,
      reason: accessResult.reason,
      subscription: accessResult.subscription,
      userData: accessResult.userData,
      redirectTo: getRedirectPath(accessResult)
    };
  } catch (error) {
    console.error('Access validation error:', error);
    return {
      hasAccess: false,
      reason: 'Error validating access',
      redirectTo: '/no-access'
    };
  }
};

/**
 * Determine redirect path based on access status
 */
const getRedirectPath = (accessResult) => {
  if (accessResult.hasAccess) {
    return null; // No redirect needed
  }

  const { reason, subscription, userData } = accessResult;

  // Blocked by admin
  if (userData?.isBlocked) {
    return '/blocked';
  }

  // Trial expired
  if (reason === 'Trial expired') {
    return '/trial-expired';
  }

  // Subscription expired
  if (reason === 'Subscription expired') {
    return '/subscription-expired';
  }

  // Pending admin approval
  if (reason === 'Pending admin approval') {
    return '/pending-approval';
  }

  // Subscription rejected
  if (reason === 'Subscription rejected') {
    return '/subscription-rejected';
  }

  // No subscription
  if (reason === 'No subscription found') {
    return '/no-subscription';
  }

  // Default
  return '/no-access';
};

/**
 * Get subscription status badge info
 */
export const getSubscriptionBadge = (subscription, userData) => {
  if (!subscription && !userData) {
    return null;
  }

  // Admin
  if (userData?.role === 'admin') {
    return {
      text: 'Admin',
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800'
    };
  }

  // Free lifetime
  if (userData?.subscriptionStatus === 'free_lifetime') {
    return {
      text: 'Free Access',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    };
  }

  if (!subscription) {
    return null;
  }

  // Trial
  if (subscription.status === 'trial') {
    const daysLeft = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return {
      text: `Trial (${daysLeft} days left)`,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      daysLeft
    };
  }

  // Active
  if (subscription.status === 'active') {
    const daysLeft = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return {
      text: daysLeft > 7 ? 'Active' : `${daysLeft} days left`,
      color: daysLeft > 7 ? 'green' : 'yellow',
      bgColor: daysLeft > 7 ? 'bg-green-100' : 'bg-yellow-100',
      textColor: daysLeft > 7 ? 'text-green-800' : 'text-yellow-800',
      daysLeft
    };
  }

  // Pending
  if (subscription.status === 'pending_approval') {
    return {
      text: 'Pending Approval',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    };
  }

  // Expired
  if (subscription.status === 'expired') {
    return {
      text: 'Expired',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    };
  }

  // Rejected
  if (subscription.status === 'rejected') {
    return {
      text: 'Rejected',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    };
  }

  return null;
};

/**
 * Calculate grace period (3 days after expiry)
 */
export const hasGracePeriod = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const gracePeriodEnd = new Date(end);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3 days grace

  return now <= gracePeriodEnd;
};