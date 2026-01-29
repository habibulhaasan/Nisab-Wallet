// src/app/pending-approval/page.js
'use client';

import { useAuth } from '@/context/AuthContext';
import { Clock, Mail, AlertCircle } from 'lucide-react';

export default function PendingApprovalPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
            <Clock className="text-yellow-600" size={32} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Subscription Pending Approval
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Thank you for subscribing to Nisab Wallet! Your payment is currently being verified by our admin team.
          </p>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start">
              <AlertCircle className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Admin reviews your payment (24-48 hours)</li>
                  <li>You'll receive email notification</li>
                  <li>Access granted once approved</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Mail size={16} className="mr-2" />
              <span>Need help? Contact support@nisabwallet.com</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}