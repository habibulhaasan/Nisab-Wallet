// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { 
  CheckCircle, Star, TrendingUp, Shield, Wallet, BarChart3, 
  Smartphone, Lock, Users, ArrowRight, Menu, X 
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredFeedback, setFeaturedFeedback] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);

  useEffect(() => {
    loadFeaturedFeedback();
    loadPlans();
  }, []);

  const loadFeaturedFeedback = async () => {
    try {
      const allFeaturedFeedback = [];
      
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // For each user, get their featured feedback
      for (const userDoc of usersSnapshot.docs) {
        const feedbackRef = collection(db, 'users', userDoc.id, 'feedback');
        const featuredQuery = query(
          feedbackRef, 
          where('featured', '==', true),
          orderBy('featuredAt', 'desc'),
          limit(3)
        );
        const feedbackSnapshot = await getDocs(featuredQuery);
        
        feedbackSnapshot.forEach(feedbackDoc => {
          allFeaturedFeedback.push({
            id: feedbackDoc.id,
            ...feedbackDoc.data()
          });
        });
      }
      
      // Take only the 3 most recent featured feedback
      setFeaturedFeedback(allFeaturedFeedback.slice(0, 3));
    } catch (error) {
      console.error('Error loading featured feedback:', error);
    }
  };

  const loadPlans = async () => {
    const result = await getSubscriptionPlans(true);
    if (result.success) {
      setSubscriptionPlans(result.plans);
    }
  };

  const features = [
    {
      icon: <Wallet className="w-6 h-6 text-blue-600" />,
      title: 'Multiple Account Management',
      description: 'Manage Cash, Bank, bKash, and other accounts all in one place'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      title: 'Transaction Tracking',
      description: 'Track income, expenses, and transfers with detailed categorization'
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-600" />,
      title: 'Zakat Calculation',
      description: 'Automated Zakat calculation based on Islamic principles'
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
      title: 'Financial Analytics',
      description: 'Comprehensive reports and insights on your financial health'
    },
    {
      icon: <Lock className="w-6 h-6 text-red-600" />,
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored securely with Firebase'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-indigo-600" />,
      title: 'Mobile Responsive',
      description: 'Access your finances anywhere on any device'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Nisab Wallet</h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
              <button
                onClick={() => router.push('/login')}
                className="text-gray-600 hover:text-gray-900"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-4">
              <a href="#features" className="block text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="block text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#testimonials" className="block text-gray-600 hover:text-gray-900">Testimonials</a>
              <button
                onClick={() => router.push('/login')}
                className="block w-full text-left text-gray-600 hover:text-gray-900"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="block w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Islamic Finance Tracker<br />
            <span className="text-blue-600">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Manage your finances according to Islamic principles. Track income, expenses, calculate Zakat, and gain insights into your financial health.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2" size={20} />
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-lg font-semibold"
            >
              View Demo
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            5-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Finances
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for Islamic financial management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for you. All plans include full features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-600 transition-colors">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">৳{plan.price}</span>
                  <span className="text-gray-600">/{plan.duration}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.durationDays} days access</p>
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => router.push('/register')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Choose Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {featuredFeedback.length > 0 && (
        <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Our Users Say
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Real feedback from our valued users
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredFeedback.map((feedback) => (
                <div key={feedback.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${
                          i < (feedback.rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{feedback.message}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {feedback.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{feedback.userName || 'User'}</p>
                      <p className="text-sm text-gray-500">Nisab Wallet User</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users managing their finances the Islamic way
          </p>
          <button
            onClick={() => router.push('/register')}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-lg font-semibold"
          >
            Start Your Free Trial Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Nisab Wallet</h3>
          <p className="text-gray-400 mb-6">
            Islamic Finance Management Made Simple
          </p>
          <div className="flex justify-center space-x-6 mb-6">
            <a href="#features" className="text-gray-400 hover:text-white">Features</a>
            <a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a>
            <a href="#testimonials" className="text-gray-400 hover:text-white">Testimonials</a>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Nisab Wallet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}