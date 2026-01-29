// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { 
  Wallet, TrendingUp, Shield, Smartphone, BarChart3, 
  Clock, CheckCircle, ArrowRight, Menu, X, Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const result = await getSubscriptionPlans(true);
    if (result.success) {
      setPlans(result.plans);
    }
  };

  const features = [
    {
      icon: <Wallet className="text-blue-600" size={32} />,
      title: 'Multi-Account Management',
      description: 'Manage multiple accounts including Cash, Bank, bKash, and more in one place.'
    },
    {
      icon: <TrendingUp className="text-green-600" size={32} />,
      title: 'Transaction Tracking',
      description: 'Track income, expenses, and transfers with detailed categorization.'
    },
    {
      icon: <BarChart3 className="text-purple-600" size={32} />,
      title: 'Financial Analytics',
      description: 'Visualize your financial data with charts and comprehensive reports.'
    },
    {
      icon: <Sparkles className="text-yellow-600" size={32} />,
      title: 'Zakat Calculation',
      description: 'Automatically calculate Zakat based on Islamic principles and Nisab values.'
    },
    {
      icon: <Shield className="text-red-600" size={32} />,
      title: 'Secure & Private',
      description: 'Your financial data is encrypted and stored securely with complete privacy.'
    },
    {
      icon: <Smartphone className="text-indigo-600" size={32} />,
      title: 'Mobile Responsive',
      description: 'Access your finances anywhere, anytime on any device.'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Sign Up',
      description: 'Create your account and start with a 5-day free trial.'
    },
    {
      number: '2',
      title: 'Setup Accounts',
      description: 'Add your accounts and categories to get started.'
    },
    {
      number: '3',
      title: 'Track & Manage',
      description: 'Start tracking your finances and calculating Zakat.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Wallet className="text-blue-600 mr-2" size={28} />
              <span className="text-xl font-bold text-gray-900">Nisab Wallet</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a>
              <button
                onClick={() => router.push('/login')}
                className="text-gray-600 hover:text-gray-900"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Free Trial
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-gray-900 py-2">Features</a>
              <a href="#pricing" className="block text-gray-600 hover:text-gray-900 py-2">Pricing</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-gray-900 py-2">How It Works</a>
              <button
                onClick={() => router.push('/login')}
                className="block w-full text-left text-gray-600 hover:text-gray-900 py-2"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Islamic Finance Tracker
              <br />
              <span className="text-blue-600">with Zakat Management</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Track your finances according to Islamic principles. Manage accounts, 
              track transactions, calculate Zakat, and maintain financial clarity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/register')}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium flex items-center justify-center"
              >
                Start 5-Day Free Trial
                <ArrowRight className="ml-2" size={20} />
              </button>
              <button
                onClick={() => router.push('/register')}
                className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors text-lg font-medium"
              >
                View Demo
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • 5-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Finances
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for Islamic finance management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-600 hover:shadow-xl transition-all"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">৳{plan.price}</span>
                  <span className="text-gray-500 ml-1">/{plan.duration}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {plan.durationDays} days access
                </p>
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="text-green-600 mr-2 flex-shrink-0" size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => router.push('/register')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600 mt-8">
            Start with a 5-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users managing their finances the Islamic way
          </p>
          <button
            onClick={() => router.push('/register')}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium inline-flex items-center"
          >
            Start Your Free Trial Today
            <ArrowRight className="ml-2" size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center mb-4">
                <Wallet className="text-blue-400 mr-2" size={24} />
                <span className="text-lg font-bold">Nisab Wallet</span>
              </div>
              <p className="text-gray-400 text-sm">
                Islamic Finance Tracker with Zakat Management
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 Nisab Wallet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}