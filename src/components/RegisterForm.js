// src/components/RegisterForm.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { getPaymentGatewaySettings, getTrialPeriodSettings } from '@/lib/paymentGatewayUtils';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function RegisterForm() {
  const [registrationType, setRegistrationType] = useState('trial'); // 'trial' or 'purchase'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
    confirmPassword: '',
    selectedPlan: null,
    paymentMethod: '',
    transactionId: ''
  });
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [trialDays, setTrialDays] = useState(5);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadPlansAndSettings();
  }, []);

  const loadPlansAndSettings = async () => {
    const plansResult = await getSubscriptionPlans(true);
    if (plansResult.success) {
      setSubscriptionPlans(plansResult.plans);
    }

    const paymentResult = await getPaymentGatewaySettings();
    if (paymentResult.success) {
      setPaymentSettings(paymentResult.settings);
    }

    const trialResult = await getTrialPeriodSettings();
    if (trialResult.success) {
      setTrialDays(trialResult.trialDays);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handlePlanSelect = (plan) => {
    setFormData({
      ...formData,
      selectedPlan: plan
    });
  };

  const validateBasicInfo = () => {
    if (!formData.name || !formData.email || !formData.mobile || !formData.address) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!formData.password || !formData.confirmPassword) {
      setError('Please enter password');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(formData.mobile.replace(/[^0-9]/g, ''))) {
      setError('Please enter a valid mobile number');
      return false;
    }

    return true;
  };

  const validatePurchaseInfo = () => {
    if (!formData.selectedPlan) {
      setError('Please select a subscription plan');
      return false;
    }

    if (!formData.paymentMethod) {
      setError('Please select a payment method');
      return false;
    }

    if (!formData.transactionId || formData.transactionId.trim() === '') {
      setError('Please enter transaction/reference ID');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateBasicInfo()) {
      return;
    }

    if (registrationType === 'purchase' && !validatePurchaseInfo()) {
      return;
    }

    setLoading(true);

    const result = await signup(
      formData.email, 
      formData.password, 
      {
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address,
        registrationType,
        selectedPlan: registrationType === 'purchase' ? formData.selectedPlan : null,
        paymentMethod: registrationType === 'purchase' ? formData.paymentMethod : '',
        transactionId: registrationType === 'purchase' ? formData.transactionId : '',
        trialDays
      }
    );

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-lg border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Create your Nisab Wallet account
          </h1>
          <p className="text-sm text-gray-500">
            Islamic Finance Tracker with Zakat Management
          </p>
        </div>

        {/* Registration Type Selection */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            {/* Free Trial Option */}
            <div
              onClick={() => setRegistrationType('trial')}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                registrationType === 'trial'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Sparkles className={registrationType === 'trial' ? 'text-blue-600' : 'text-gray-400'} size={24} />
                {registrationType === 'trial' && (
                  <CheckCircle2 className="text-blue-600" size={20} />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Free Trial</h3>
              <p className="text-sm text-gray-600 mb-2">
                Start with {trialDays} days free trial
              </p>
              <p className="text-xs text-gray-500">
                No payment required • Cancel anytime
              </p>
            </div>

            {/* Direct Purchase Option */}
            <div
              onClick={() => setRegistrationType('purchase')}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                registrationType === 'purchase'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className={registrationType === 'purchase' ? 'text-blue-600' : 'text-gray-400'} size={24} />
                {registrationType === 'purchase' && (
                  <CheckCircle2 className="text-blue-600" size={20} />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Buy Now</h3>
              <p className="text-sm text-gray-600 mb-2">
                Purchase subscription directly
              </p>
              <p className="text-xs text-gray-500">
                Immediate access after approval
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="text-red-600 mr-2 flex-shrink-0" size={20} />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="+880 1XXX XXXXXX"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="name@example.com"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your full address"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Min 6 characters"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {/* Subscription & Payment (Only for Purchase) */}
          {registrationType === 'purchase' && (
            <>
              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start mt-6">
                <Info className="text-blue-600 mr-3 flex-shrink-0" size={20} />
                <div className="text-sm">
                  <p className="text-blue-900 font-medium mb-1">
                    Payment Verification
                  </p>
                  <p className="text-blue-700">
                    Your subscription will be activated after admin approval. Payment verification may take 24-48 hours.
                  </p>
                </div>
              </div>

              {/* Subscription Plans */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Subscription Plan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subscriptionPlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        formData.selectedPlan?.id === plan.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                        {formData.selectedPlan?.id === plan.id && (
                          <CheckCircle2 className="text-blue-600" size={20} />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        ৳{plan.price}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">{plan.duration}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              {paymentSettings && paymentSettings.methods && paymentSettings.methods.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {paymentSettings.methods.map((method) => (
                      method.isActive && (
                        <div
                          key={method.id}
                          onClick={() => setFormData({ ...formData, paymentMethod: method.name })}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            formData.paymentMethod === method.name
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{method.name}</p>
                              {method.accountNumber && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Account: {method.accountNumber}
                                </p>
                              )}
                              {method.instructions && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {method.instructions}
                                </p>
                              )}
                            </div>
                            {formData.paymentMethod === method.name && (
                              <CheckCircle2 className="text-blue-600" size={20} />
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction ID */}
              <div>
                <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Transaction / Reference ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="transactionId"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter your transaction ID"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the transaction ID from your payment confirmation message
                </p>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Creating account...' : registrationType === 'trial' ? 'Start Free Trial' : 'Complete Purchase'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 font-medium hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}