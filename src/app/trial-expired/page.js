// src/app/trial-expired/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { getPaymentGatewaySettings } from '@/lib/paymentGatewayUtils';
import { createUserSubscription, calculateTrialEndDate } from '@/lib/subscriptionUtils';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TrialExpiredPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlansAndSettings();
  }, []);

  const loadPlansAndSettings = async () => {
    const plansResult = await getSubscriptionPlans(true);
    if (plansResult.success) {
      setPlans(plansResult.plans);
    }

    const paymentResult = await getPaymentGatewaySettings();
    if (paymentResult.success) {
      setPaymentSettings(paymentResult.settings);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!transactionId.trim()) {
      setError('Please enter transaction ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = calculateTrialEndDate(today, selectedPlan.durationDays);

      await createUserSubscription(user.uid, {
        planId: selectedPlan.planId,
        planName: selectedPlan.name,
        status: 'pending_approval',
        startDate: today,
        endDate: endDate,
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        amount: selectedPlan.price,
        isFirstSubscription: false
      });

      router.push('/pending-approval');
    } catch (err) {
      setError('Failed to submit subscription. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Clock className="text-yellow-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trial Period Expired</h1>
          <p className="text-gray-600">
            Your free trial has ended. Subscribe now to continue using Nisab Wallet.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="text-red-600 mr-3 flex-shrink-0" size={20} />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan?.id === plan.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  {selectedPlan?.id === plan.id && (
                    <CheckCircle2 className="text-blue-600" size={20} />
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">৳{plan.price}</p>
                <p className="text-sm text-gray-500 capitalize mb-4">{plan.duration}</p>
                {plan.features && plan.features.length > 0 && (
                  <ul className="text-xs text-gray-600 space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        {selectedPlan && paymentSettings && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-3 mb-4">
              {paymentSettings.methods?.map((method) => (
                method.isActive && (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.name)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === method.name
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{method.name}</p>
                        {method.accountNumber && (
                          <p className="text-sm text-gray-600 mt-1">Account: {method.accountNumber}</p>
                        )}
                        {method.instructions && (
                          <p className="text-sm text-gray-500 mt-1">{method.instructions}</p>
                        )}
                      </div>
                      {paymentMethod === method.name && (
                        <CheckCircle2 className="text-blue-600" size={20} />
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction ID
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your transaction ID"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => logout()}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
          <button
            onClick={handleSubscribe}
            disabled={loading || !selectedPlan}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    </div>
  );
}