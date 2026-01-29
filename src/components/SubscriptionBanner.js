// src/components/SubscriptionBanner.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCurrentSubscription } from '@/lib/subscriptionUtils';
import { getSubscriptionBadge } from '@/lib/accessControl';
import { AlertCircle, Clock, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubscriptionBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscriptionInfo();
    }
  }, [user]);

  const loadSubscriptionInfo = async () => {
    try {
      const result = await getCurrentSubscription(user.uid);
      if (result.success) {
        setSubscription(result.subscription);
      }
      
      // Get user data for admin/free status
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const badge = getSubscriptionBadge(subscription, userData);
  
  // Don't show banner for admins or free lifetime users
  if (userData?.role === 'admin' || userData?.subscriptionStatus === 'free_lifetime') {
    return null;
  }

  // Don't show if no subscription
  if (!subscription || !badge) return null;

  // Warning banner for expiring soon (less than 7 days)
  if (subscription.status === 'active' && badge.daysLeft <= 7) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex items-start">
          <Clock className="text-yellow-600 mr-3 flex-shrink-0" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-900">
              Subscription Expiring Soon
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your subscription will expire in {badge.daysLeft} day{badge.daysLeft !== 1 ? 's' : ''}. 
              Renew now to avoid service interruption.
            </p>
            <button
              onClick={() => router.push('/trial-expired')}
              className="mt-2 text-sm font-medium text-yellow-900 hover:text-yellow-800 underline"
            >
              Renew Subscription →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trial active banner
  if (subscription.status === 'trial' && badge.daysLeft > 0) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex items-start">
          <Sparkles className="text-blue-600 mr-3 flex-shrink-0" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              Free Trial Active
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              You have {badge.daysLeft} day{badge.daysLeft !== 1 ? 's' : ''} remaining in your free trial. 
              Subscribe now to continue enjoying Nisab Wallet.
            </p>
            <button
              onClick={() => router.push('/trial-expired')}
              className="mt-2 text-sm font-medium text-blue-900 hover:text-blue-800 underline"
            >
              View Subscription Plans →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pending approval banner
  if (subscription.status === 'pending_approval') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex items-start">
          <Clock className="text-yellow-600 mr-3 flex-shrink-0" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-900">
              Payment Under Review
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your payment is being verified. This usually takes 24-48 hours. 
              You'll be notified once your subscription is activated.
            </p>
            {subscription.transactionId && (
              <p className="text-xs text-yellow-600 mt-2">
                Transaction ID: {subscription.transactionId}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active subscription - show subtle indicator
  if (subscription.status === 'active' && badge.daysLeft > 7) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-6">
        <div className="flex items-center">
          <CheckCircle className="text-green-600 mr-2" size={18} />
          <p className="text-sm text-green-800">
            <span className="font-medium">Active Subscription</span> • 
            Expires on {new Date(subscription.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  return null;
}