// src/app/blocked/page.js
'use client';

import { useAuth } from '@/context/AuthContext';
import { Shield, Mail } from 'lucide-react';

export default function BlockedPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <Shield className="text-red-600" size={32} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Account Blocked
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Your account has been temporarily blocked by the administrator.
          </p>

          {/* Info Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-red-900">
              This may be due to a violation of our terms of service or suspicious activity on your account.
            </p>
          </div>

          {/* Contact Support */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-2">
              To resolve this issue:
            </p>
            <p className="text-sm text-blue-800">
              Please contact our support team for assistance. They will review your account and help restore access if eligible.
            </p>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center">
                <Mail size={16} className="mr-2" />
                <span>nisabwallet@gmail.com</span>
              </div>
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