// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  CheckCircle, Star, TrendingUp, Shield, Wallet, BarChart3, 
  Smartphone, Lock, Users, ArrowRight, Menu, X, DollarSign 
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  useEffect(() => {
    loadPlans();
    loadFeaturedFeedback();
  }, []);

  const loadPlans = async () => {
    const result = await getSubscriptionPlans(true);
    if (result.success) {
      setSubscriptionPlans(result.plans);
    }
  };

  const loadFeaturedFeedback = async () => {
    setLoadingTestimonials(true);
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
          orderBy('featuredAt', 'desc')
        );
        
        try {
          const feedbackSnapshot = await getDocs(featuredQuery);
          feedbackSnapshot.forEach(feedbackDoc => {
            const data = feedbackDoc.data();
            allFeaturedFeedback.push({
              id: `${userDoc.id}-${feedbackDoc.id}`,
              userId: userDoc.id,
              rating: data.rating || 5,
              message: data.message || '',
              userName: data.userName || 'Anonymous User',
              role: data.userRole || 'User',
              featuredAt: data.featuredAt
            });
          });
        } catch (error) {
          // If query fails (e.g., missing index), try without orderBy
          console.warn('Featured query failed for user, trying fallback:', error);
          try {
            const fallbackQuery = query(feedbackRef, where('featured', '==', true));
            const feedbackSnapshot = await getDocs(fallbackQuery);
            feedbackSnapshot.forEach(feedbackDoc => {
              const data = feedbackDoc.data();
              allFeaturedFeedback.push({
                id: `${userDoc.id}-${feedbackDoc.id}`,
                userId: userDoc.id,
                rating: data.rating || 5,
                message: data.message || '',
                userName: data.userName || 'Anonymous User',
                role: data.userRole || 'User',
                featuredAt: data.featuredAt
              });
            });
          } catch (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
          }
        }
      }

      // Sort by featured date (newest first)
      allFeaturedFeedback.sort((a, b) => {
        const dateA = a.featuredAt?.toDate?.() || new Date(0);
        const dateB = b.featuredAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      // If we have featured feedback, use it; otherwise fall back to static testimonials
      if (allFeaturedFeedback.length > 0) {
        setTestimonials(allFeaturedFeedback.slice(0, 6)); // Show max 6 testimonials
      } else {
        // Fallback to static testimonials
        setTestimonials([
          {
            id: 1,
            rating: 5,
            message: "This app has transformed how I manage my finances. The Zakat calculation feature is incredibly helpful!",
            userName: "Ahmed Hassan",
            role: "Business Owner"
          },
          {
            id: 2,
            rating: 5,
            message: "Simple, intuitive, and follows Islamic principles perfectly. Highly recommended for every Muslim.",
            userName: "Fatima Rahman",
            role: "Teacher"
          },
          {
            id: 3,
            rating: 5,
            message: "The analytics dashboard gives me clear insights into my spending. Managing multiple accounts has never been easier!",
            userName: "Ibrahim Ali",
            role: "Software Engineer"
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading featured feedback:', error);
      // Fallback to static testimonials on error
      setTestimonials([
        {
          id: 1,
          rating: 5,
          message: "This app has transformed how I manage my finances. The Zakat calculation feature is incredibly helpful!",
          userName: "Ahmed Hassan",
          role: "Business Owner"
        },
        {
          id: 2,
          rating: 5,
          message: "Simple, intuitive, and follows Islamic principles perfectly. Highly recommended for every Muslim.",
          userName: "Fatima Rahman",
          role: "Teacher"
        },
        {
          id: 3,
          rating: 5,
          message: "The analytics dashboard gives me clear insights into my spending. Managing multiple accounts has never been easier!",
          userName: "Ibrahim Ali",
          role: "Software Engineer"
        }
      ]);
    } finally {
      setLoadingTestimonials(false);
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
      <nav className="border-b border-gray-200 sticky top-0 bg-white z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Nisab Wallet
              </h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <button
                onClick={() => router.push('/login')}
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm hover:shadow-md"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-4 bg-white">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-600 hover:text-gray-900 transition-colors"
              >
                Pricing
              </a>
              <a 
                href="#testimonials" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-600 hover:text-gray-900 transition-colors"
              >
                Testimonials
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/login');
                }}
                className="block w-full text-left text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/register');
                }}
                className="block w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              ✨ Islamic Finance Made Simple
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Manage Your Finances<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              The Islamic Way
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Track income, expenses, calculate Zakat automatically, and gain complete insights into your financial health—all according to Islamic principles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/register')}
              className="group px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-lg font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-lg font-semibold shadow-sm"
            >
              View Demo
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6 flex items-center justify-center space-x-2 flex-wrap">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>5-day free trial</span>
            <span className="text-gray-300">•</span>
            <span>No credit card required</span>
            <span className="text-gray-300">•</span>
            <span>Cancel anytime</span>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
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
              <div 
                key={index} 
                className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Transactions Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9/5</div>
              <div className="text-blue-100">User Rating</div>
            </div>
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

          {subscriptionPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {subscriptionPlans.map((plan) => (
                <div 
                  key={plan.id} 
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">৳{plan.price}</span>
                    <span className="text-gray-600">/{plan.duration}</span>
                  </div>
                  <p className="text-gray-600 mb-6 text-sm">
                    {plan.durationDays} days full access
                  </p>
                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm hover:shadow-md"
                  >
                    Choose Plan
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading pricing plans...</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied users managing their finances the Islamic way
            </p>
          </div>

          {loadingTestimonials ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading testimonials...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id} 
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${
                          i < testimonial.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">
                    "{testimonial.message}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-3 shadow-md">
                      {testimonial.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.userName}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users managing their finances the Islamic way
          </p>
          <button
            onClick={() => router.push('/register')}
            className="group px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 inline-flex items-center"
          >
            Start Your Free Trial Today
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </button>
          <p className="text-sm text-blue-100 mt-4">
            No credit card required • Start in 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold">Nisab Wallet</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Islamic Finance Management Made Simple. Track your income, expenses, and calculate Zakat with ease.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="block text-gray-400 hover:text-white transition-colors">Pricing</a>
                <a href="#testimonials" className="block text-gray-400 hover:text-white transition-colors">Testimonials</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Contact Us</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Nisab Wallet. All rights reserved. Built with ❤️ for the Muslim community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}