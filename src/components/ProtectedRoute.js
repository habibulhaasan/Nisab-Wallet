// src/components/ProtectedRoute.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { checkUserAccess } from '@/lib/subscriptionUtils';
import { AlertCircle, Clock, XCircle, Lock, Mail } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [accessStatus, setAccessStatus] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      checkAccess();
    }
  }, [user, loading, router]);

  const checkAccess = async () => {
    setCheckingAccess(true);
    const result = await checkUserAccess(user.uid);
    setAccessStatus(result);
    setCheckingAccess(false);
  };

  // Show loading spinner while checking authentication
  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show nothing (will redirect)
  if (!user) {
    return null;
  }

  // ✅ FIXED: Check if user has ANY active access (active, trial, or free)
  const hasActiveAccess = 
    accessStatus?.userData?.subscriptionStatus === 'free_lifetime' ||
    accessStatus?.userData?.role === 'admin' ||
    accessStatus?.subscription?.status === 'active' ||
    accessStatus?.subscription?.status === 'trial';

  // Only show no access screen if user has NO active access
  if (accessStatus && !hasActiveAccess && !accessStatus.hasAccess) {
    return <NoAccessScreen reason={accessStatus.reason} userData={accessStatus.userData} subscription={accessStatus.subscription} />;
  }

  // If has access, show the protected content
  return children;
}

// No Access Screen Component
function NoAccessScreen({ reason, userData, subscription }) {
  const router = useRouter();

  const getScreenContent = () => {
    switch (reason) {
      case 'Trial expired':
        return {
          icon: <Clock className="text-yellow-600" size={64} />,
          title: 'Your Trial Has Ended',
          message: 'Thank you for trying Nisab Wallet! Your 5-day trial period has ended.',
          action: 'Subscribe Now',
          actionLink: '/dashboard/subscription',
          color: 'yellow'
        };

      case 'Subscription expired':
        return {
          icon: <Clock className="text-orange-600" size={64} />,
          title: 'Subscription Expired',
          message: 'Your subscription has ended. Please renew to continue using Nisab Wallet.',
          action: 'Renew Subscription',
          actionLink: '/dashboard/subscription',
          color: 'orange'
        };

      case 'Pending admin approval':
        return {
          icon: <Mail className="text-blue-600" size={64} />,
          title: 'Payment Under Review',
          message: 'Thank you for your purchase! Your payment is being verified by our admin team. This usually takes 24-48 hours.',
          subMessage: subscription?.transactionId ? `Transaction ID: ${subscription.transactionId}` : null,
          action: 'Contact Support',
          actionLink: 'mailto:support@nisabwallet.com',
          color: 'blue'
        };

      case 'Subscription rejected':
        return {
          icon: <XCircle className="text-red-600" size={64} />,
          title: 'Payment Not Verified',
          message: 'We were unable to verify your payment. Please try again with correct payment information.',
          action: 'Retry Payment',
          actionLink: '/dashboard/subscription',
          color: 'red'
        };

      case 'Account blocked':
        return {
          icon: <Lock className="text-red-600" size={64} />,
          title: 'Account Suspended',
          message: 'Your account has been temporarily suspended. Please contact support for assistance.',
          subMessage: userData?.blockReason || null,
          action: 'Contact Support',
          actionLink: 'mailto:support@nisabwallet.com',
          color: 'red'
        };

      case 'No subscription found':
        return {
          icon: <AlertCircle className="text-gray-600" size={64} />,
          title: 'No Active Subscription',
          message: 'You need an active subscription to access Nisab Wallet.',
          action: 'Subscribe Now',
          actionLink: '/dashboard/subscription',
          color: 'gray'
        };

      default:
        return {
          icon: <AlertCircle className="text-gray-600" size={64} />,
          title: 'Access Restricted',
          message: 'You currently do not have access to this application.',
          action: 'Go to Home',
          actionLink: '/',
          color: 'gray'
        };
    }
  };

  const content = getScreenContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {content.icon}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">
          {content.title}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-4">
          {content.message}
        </p>

        {/* Sub Message */}
        {content.subMessage && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-700">{content.subMessage}</p>
          </div>
        )}

        {/* Subscription Info (if available) */}
        {subscription && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Subscription Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">{subscription.planName}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-medium capitalize ${
                  subscription.status === 'expired' ? 'text-red-600' : 
                  subscription.status === 'pending_approval' ? 'text-blue-600' : 
                  'text-gray-900'
                }`}>
                  {subscription.status.replace('_', ' ')}
                </span>
              </div>
              {subscription.endDate && (
                <div className="flex justify-between">
                  <span>Ended:</span>
                  <span className="font-medium">{new Date(subscription.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {content.action && content.actionLink && (
          <a
            href={content.actionLink}
            className={`inline-block w-full px-6 py-3 rounded-lg text-white font-medium transition-colors ${
              content.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
              content.color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' :
              content.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
              content.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
              'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {content.action}
          </a>
        )}

        {/* Logout Link */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}