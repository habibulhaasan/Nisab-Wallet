// src/app/subscription-rejected/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getCurrentSubscription } from '@/lib/subscriptionUtils';
import { XCircle, Mail, RefreshCw } from 'lucide-react';

export default function SubscriptionRejectedPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (user) {
      loadRejectionInfo();
    }
  }, [user]);

  const loadRejectionInfo = async () => {
    const result = await getCurrentSubscription(user.uid);
    if (result.success && result.subscription?.rejectionReason) {
      setRejectionReason(result.subscription.rejectionReason);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <XCircle className="text-red-600" size={32} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Subscription Rejected
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Unfortunately, your subscription payment could not be verified.
          </p>

          {/* Rejection Reason */}
          {rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-red-900 mb-1">Reason:</p>
              <p className="text-sm text-red-800">{rejectionReason}</p>
            </div>
          )}

          {/* Common Reasons */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-900 mb-2">Common reasons for rejection:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Incorrect transaction ID</li>
              <li>Payment not received</li>
              <li>Insufficient payment amount</li>
              <li>Invalid payment method</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/trial-expired')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <RefreshCw size={18} className="mr-2" />
              Try Again with Correct Info
            </button>

            <button
              onClick={() => logout()}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Contact */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Mail size={16} className="mr-2" />
              <span>Questions? Email support@nisabwallet.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}