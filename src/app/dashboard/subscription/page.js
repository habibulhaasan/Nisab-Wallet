// src/app/dashboard/subscription/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans, createUserSubscription, calculateTrialEndDate, getCurrentSubscription } from '@/lib/subscriptionUtils';
import { getPaymentGatewaySettings } from '@/lib/paymentGatewayUtils';
import { CheckCircle2, AlertCircle, CreditCard, Calendar, DollarSign } from 'lucide-react';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    // Load subscription plans
    const plansResult = await getSubscriptionPlans(true);
    if (plansResult.success) {
      setPlans(plansResult.plans);
    }

    // Load payment settings
    const paymentResult = await getPaymentGatewaySettings();
    if (paymentResult.success) {
      setPaymentSettings(paymentResult.settings);
    }

    // Load current subscription
    const subResult = await getCurrentSubscription(user.uid);
    if (subResult.success) {
      setCurrentSubscription(subResult.subscription);
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

      // Check if user has active subscription (extension)
    const isExtension = currentSubscription && 
      (currentSubscription.status === 'active' || currentSubscription.status === 'trial');

    await createUserSubscription(user.uid, {
      planId: selectedPlan.planId,
      planName: selectedPlan.name,
      status: 'pending_approval',
      startDate: today,
      endDate: endDate,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      amount: selectedPlan.price,
      isFirstSubscription: false,
      isExtension: isExtension,  // ← ADD THIS
      durationDays: selectedPlan.durationDays  // ← MAKE SURE THIS EXISTS
    });

      router.push('/pending-approval');
    } catch (err) {
      setError('Failed to submit subscription. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentSubscription ? 'Extend Your Subscription' : 'Choose Your Plan'}
        </h1>
        <p className="text-gray-600">
          {currentSubscription 
            ? 'Select a plan to continue using Nisab Wallet' 
            : 'Get started with Nisab Wallet today'}
        </p>
      </div>

      {/* Current Subscription Info (if exists) */}
      {currentSubscription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <AlertCircle className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm">
              <p className="text-blue-900 font-medium mb-1">Current Plan: {currentSubscription.planName}</p>
              <p className="text-blue-700">
                {currentSubscription.status === 'trial' 
                  ? `Your trial ends on ${new Date(currentSubscription.endDate).toLocaleDateString()}`
                  : `Your subscription expires on ${new Date(currentSubscription.endDate).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="text-red-600 mr-3 flex-shrink-0" size={20} />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose a Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedPlan?.id === plan.id
                  ? 'border-blue-600 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Calendar className={selectedPlan?.id === plan.id ? 'text-blue-600' : 'text-gray-400'} size={32} />
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{plan.name}</h3>
                
                <div className="mb-4">
                  <p className="text-4xl font-bold text-gray-900">৳{plan.price}</p>
                  <p className="text-sm text-gray-500 capitalize">{plan.duration}</p>
                </div>

                <div className="text-xs text-gray-600 mb-4">
                  <p>{plan.durationDays} days access</p>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <ul className="text-xs text-gray-600 text-left space-y-1 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle2 size={14} className="mr-1 flex-shrink-0 text-green-600 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {selectedPlan?.id === plan.id && (
                  <div className="mt-4">
                    <CheckCircle2 className="text-blue-600 mx-auto" size={24} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Section */}
      {selectedPlan && paymentSettings && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="mr-2" size={24} />
            Payment Information
          </h2>

          {/* Payment Methods */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
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
          </div>

          {/* Transaction ID */}
          <div>
            <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-2">
              Transaction / Reference ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your transaction ID"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the transaction ID from your payment confirmation message
            </p>
          </div>
        </div>
      )}

      {/* Summary & Submit */}
      {selectedPlan && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium text-gray-900">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium text-gray-900 capitalize">{selectedPlan.duration} ({selectedPlan.durationDays} days)</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
              <span className="text-gray-900">Total:</span>
              <span className="text-blue-600">৳{selectedPlan.price}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800">
              💡 Your subscription will be activated after admin verification (usually within 24-48 hours)
            </p>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading || !selectedPlan || !paymentMethod || !transactionId.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Processing...' : 'Submit Payment & Continue'}
          </button>
        </div>
      )}
    </div>
  );
}