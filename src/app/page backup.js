'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { 
  CheckCircle, 
  ArrowRight, 
  Menu, 
  X, 
  Wallet,
  TrendingUp,
  Shield,
  BarChart3,
  Users,
  Activity,
  Star,
  Smartphone,
  Globe,
  Lock,
  Zap,
  Award,
  MessageCircle
} from 'lucide-react';

// Default data that shows immediately
const DEFAULT_STATS = { users: 1250, transactions: 52000, satisfaction: 4.9 };
const DEFAULT_FEATURES = [
  {
    icon: 'Wallet',
    title: 'Multi-Account Management',
    description: 'Track Cash, Bank, Mobile Wallets, and Digital accounts in one place',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: 'TrendingUp',
    title: 'Smart Transaction Tracking',
    description: 'Automatic categorization and intelligent insights for every transaction',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: 'Shield',
    title: 'Automated Zakat Calculator',
    description: 'Accurate Zakat calculation based on Hijri calendar and Islamic principles',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: 'BarChart3',
    title: 'Advanced Analytics',
    description: 'Beautiful charts, reports, and spending insights at your fingertips',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: 'Lock',
    title: 'Bank-Grade Security',
    description: 'Military-grade encryption and secure data storage',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    icon: 'Smartphone',
    title: 'Works Everywhere',
    description: 'Responsive design for desktop, tablet, and mobile devices',
    gradient: 'from-pink-500 to-rose-500'
  }
];

const DEFAULT_TESTIMONIALS = [
  {
    id: '1',
    name: 'Ahmed Rahman',
    role: 'Business Owner',
    message: 'Nisab Wallet has completely transformed how I manage my finances. The Zakat calculator is incredibly accurate and saves me so much time!',
    rating: 5
  },
  {
    id: '2',
    name: 'Fatima Khan',
    role: 'Freelancer',
    message: 'As a freelancer, tracking multiple income sources was always challenging. This app makes it effortless. Highly recommended!',
    rating: 5
  },
  {
    id: '3',
    name: 'Yusuf Ali',
    role: 'Student',
    message: 'The interface is so user-friendly! Even my elderly parents can use it without any issues. Great work!',
    rating: 5
  }
];

export default function NewLandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [plans, setPlans] = useState([]); // Start empty, load from Firestore only
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    // Load in background without blocking UI
    await Promise.all([
      loadStatistics(),
      loadPlans(),
      loadTestimonials(),
      loadFeatures()
    ]);
  };

  const loadStatistics = async () => {
    try {
      // Load real statistics from Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userCount = usersSnapshot.size;

      let transactionCount = 0;
      for (const userDoc of usersSnapshot.docs) {
        const transactionsSnapshot = await getDocs(
          collection(db, 'users', userDoc.id, 'transactions')
        );
        transactionCount += transactionsSnapshot.size;
      }

      // Load satisfaction rating from admin settings or featured feedback
      const adminDoc = await getDoc(doc(db, 'admin', 'landingPageContent'));
      let avgRating = 4.9;
      
      if (adminDoc.exists() && adminDoc.data().satisfactionRating) {
        avgRating = adminDoc.data().satisfactionRating;
      } else {
        // Calculate from feedback if not set
        let totalRating = 0;
        let feedbackCount = 0;
        
        for (const userDoc of usersSnapshot.docs) {
          const feedbackSnapshot = await getDocs(
            query(
              collection(db, 'users', userDoc.id, 'feedback'),
              where('featured', '==', true),
              limit(20)
            )
          );
          feedbackSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.rating) {
              totalRating += data.rating;
              feedbackCount++;
            }
          });
        }

        avgRating = feedbackCount > 0 ? parseFloat((totalRating / feedbackCount).toFixed(1)) : 4.9;
      }

      // Only update if we have real data
      if (userCount > 0 || transactionCount > 0) {
        setStats({
          users: userCount,
          transactions: transactionCount,
          satisfaction: avgRating
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Keep default stats on error
    }
  };

  const loadPlans = async () => {
    try {
      const result = await getSubscriptionPlans(true);
      if (result.success) {
        // Sort by displayOrder and filter active plans
        const sortedPlans = result.plans
          .filter(p => p.isActive)
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setPlans(sortedPlans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans([]); // Set empty if error
    }
  };

  const loadTestimonials = async () => {
    try {
      const loadedTestimonials = [];
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      for (const userDoc of usersSnapshot.docs) {
        const feedbackSnapshot = await getDocs(
          query(
            collection(db, 'users', userDoc.id, 'feedback'),
            where('featured', '==', true),
            limit(6)
          )
        );
        
        feedbackSnapshot.forEach(doc => {
          const data = doc.data();
          loadedTestimonials.push({
            id: doc.id,
            name: data.userName || 'User',
            role: data.userRole || 'Customer',
            message: data.message,
            rating: data.rating || 5
          });
        });
      }

      if (loadedTestimonials.length > 0) {
        setTestimonials(loadedTestimonials.slice(0, 6));
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
      // Keep default testimonials on error
    }
  };

  const loadFeatures = async () => {
    try {
      const docRef = doc(db, 'admin', 'landingPageContent');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.features && data.features.length > 0) {
          setFeatures(data.features);
        }
      }
    } catch (error) {
      console.error('Error loading features:', error);
      // Keep default features on error
    }
  };

  const defaultFeatures = DEFAULT_FEATURES;

  const smoothScroll = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  const getDurationInMonths = (duration) => {
    const monthMap = {
      'monthly': 1,
      'quarterly': 3,
      'half-yearly': 6,
      'yearly': 12
    };
    return monthMap[duration] || 1;
  };

  const formatTransactionCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M+';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K+';
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes pulse-border {
          0%, 100% {
            border-color: rgb(59 130 246);
            box-shadow: 0 10px 15px -3px rgb(59 130 246 / 0.1), 0 4px 6px -4px rgb(59 130 246 / 0.1);
          }
          50% {
            border-color: rgb(147 51 234);
            box-shadow: 0 20px 25px -5px rgb(147 51 234 / 0.2), 0 8px 10px -6px rgb(147 51 234 / 0.2);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0) translateX(-50%);
          }
          50% {
            transform: translateY(-5px) translateX(-50%);
          }
        }

        .animate-pulse-border {
          animation: pulse-border 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/nisab-logo.png"
                  alt="Nisab Wallet"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nisab Wallet</h1>
                <p className="text-xs text-gray-500">Track • Grow • Purify</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a 
                href="#features" 
                onClick={(e) => smoothScroll(e, 'features')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => smoothScroll(e, 'pricing')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Pricing
              </a>
              <a 
                href="#testimonials" 
                onClick={(e) => smoothScroll(e, 'testimonials')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Reviews
              </a>
              <button
                onClick={() => router.push('/login')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/register')}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-4">
                <a 
                  href="#features" 
                  onClick={(e) => smoothScroll(e, 'features')} 
                  className="text-sm font-medium text-gray-700"
                >
                  Features
                </a>
                <a 
                  href="#pricing" 
                  onClick={(e) => smoothScroll(e, 'pricing')} 
                  className="text-sm font-medium text-gray-700"
                >
                  Pricing
                </a>
                <a 
                  href="#testimonials" 
                  onClick={(e) => smoothScroll(e, 'testimonials')} 
                  className="text-sm font-medium text-gray-700"
                >
                  Reviews
                </a>
                <button onClick={() => router.push('/login')} className="text-left text-sm font-medium text-gray-700">Sign In</button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold text-center"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-6">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-gray-900">Trusted by {stats.users}+ Users</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Manage Your Wealth,
                <br />
                <span className="text-gray-600">The Islamic Way</span>
              </h1>

              <p className="text-xl text-gray-600 mb-4 leading-relaxed">
                Complete financial management with automated Zakat calculation, 
                multi-account tracking, and powerful analytics—all aligned with Islamic principles.
              </p>
              
              <p className="text-lg text-gray-500 italic mb-8">
                Islamic Finance Made Simple
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => router.push('/register')}
                  className="px-8 py-4 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group"
                >
                  Start 5-Day Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right Content - App Preview */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Balance</p>
                      <p className="text-2xl font-bold text-gray-900">৳125,000</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {[
                      { name: 'Cash', amount: '৳45,000', color: 'bg-blue-500' },
                      { name: 'Bank Account', amount: '৳65,000', color: 'bg-green-500' },
                      { name: 'bKash', amount: '৳15,000', color: 'bg-pink-500' }
                    ].map((account, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 ${account.color} rounded-full`}></div>
                          <span className="text-sm font-medium text-gray-900">{account.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{account.amount}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-emerald-900">Zakat Status</span>
                      <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs text-emerald-700">Monitoring Active • 45 days remaining</p>
                  </div>
                </div>

                {/* Floating Stats */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-gray-600">This Month</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">+৳15,000</p>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-gray-600">Transactions</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{stats.transactions.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: `${stats.users}+`, label: 'Active Users' },
              { icon: Activity, value: formatTransactionCount(stats.transactions), label: 'Transactions' },
              { icon: Star, value: stats.satisfaction, label: 'User Rating' },
              { icon: Award, value: '99.9%', label: 'Uptime' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm mb-4">
                  <stat.icon className="w-6 h-6 text-gray-900" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for Islamic financial management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const IconComponent = {
                Wallet, TrendingUp, Shield, BarChart3, Lock, Smartphone
              }[feature.icon] || Wallet;

              return (
                <div key={i} className="group bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all">
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Start with a 5-day free trial. No credit card required.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-full">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-base font-semibold text-gray-900">
                All Features Included • Every Plan • No Limits
              </span>
            </div>
          </div>

          {plans.length > 0 ? (
            <div className="flex justify-center w-full">
              <div className="inline-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {plans.map((plan, i) => {
                  const months = getDurationInMonths(plan.duration);
                  const pricePerMonth = (plan.price / months).toFixed(0);
                  
                  return (
                    <div
                      key={plan.id}
                      className={`bg-white rounded-2xl p-8 border-2 hover:shadow-xl transition-all flex flex-col relative w-full max-w-sm ${
                        plan.isMostPopular 
                          ? 'border-blue-500 shadow-lg animate-pulse-border' 
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Most Popular Badge */}
                      {plan.isMostPopular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 animate-bounce-slow">
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                            <Star size={12} className="fill-white" />
                            Most Popular
                          </div>
                        </div>
                      )}
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-2">{plan.name}</h3>
                      <div className="mb-6">
                        <div className="mb-3">
                          <span className="text-4xl font-bold text-gray-900">৳{pricePerMonth}</span>
                          <span className="text-gray-600">/month</span>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                          plan.isMostPopular 
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <span className="text-sm font-semibold text-gray-900">
                            ৳{plan.price}
                          </span>
                          <span className="text-sm text-gray-500">
                            / {months} month{months > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      {plan.features && plan.features.length > 0 && (
                        <ul className="space-y-3 mb-8 flex-grow">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        onClick={() => router.push('/register')}
                        className={`w-full py-3 rounded-xl font-semibold transition-all mt-auto ${
                          plan.isMostPopular
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        Get Started
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading subscription plans...</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Loved by Users
            </h2>
            <p className="text-xl text-gray-600">
              See what our community has to say
            </p>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.message}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">Loading testimonials...</div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands managing their wealth according to Islamic principles
          </p>
          <button
            onClick={() => router.push('/register')}
            className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-all inline-flex items-center gap-2 group"
          >
            Start Your 5-Day Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-gray-400 mt-4">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/nisab-logo.png" alt="Nisab Wallet" fill className="object-contain" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Nisab Wallet</p>
                <p className="text-xs text-gray-500">Track • Grow • Purify</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900">Privacy</a>
              <a href="#" className="hover:text-gray-900">Terms</a>
              <a href="#" className="hover:text-gray-900">Support</a>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 mt-8">
            © {new Date().getFullYear()} Nisab Wallet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}