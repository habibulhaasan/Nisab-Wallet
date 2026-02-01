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
  PlayCircle,
  Smartphone,
  Globe,
  Lock,
  Zap,
  Award,
  MessageCircle
} from 'lucide-react';

export default function NewLandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ users: 0, transactions: 0, satisfaction: 0 });
  const [plans, setPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadStatistics(),
      loadPlans(),
      loadTestimonials(),
      loadFeatures()
    ]);
    setLoading(false);
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

      // Load satisfaction rating from featured feedback
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

      const avgRating = feedbackCount > 0 ? (totalRating / feedbackCount).toFixed(1) : 4.9;

      setStats({
        users: userCount,
        transactions: transactionCount,
        satisfaction: avgRating
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      setStats({ users: 1250, transactions: 52000, satisfaction: 4.9 });
    }
  };

  const loadPlans = async () => {
    const result = await getSubscriptionPlans(true);
    if (result.success) {
      setPlans(result.plans);
    }
  };

  const loadTestimonials = async () => {
    try {
      const testimonials = [];
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
          testimonials.push({
            id: doc.id,
            name: data.userName || 'User',
            role: data.userRole || 'Customer',
            message: data.message,
            rating: data.rating || 5
          });
        });
      }

      setTestimonials(testimonials.slice(0, 6));
    } catch (error) {
      console.error('Error loading testimonials:', error);
    }
  };

  const loadFeatures = async () => {
    try {
      const docRef = doc(db, 'admin', 'landingPageContent');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFeatures(data.features || defaultFeatures);
      } else {
        setFeatures(defaultFeatures);
      }
    } catch (error) {
      console.error('Error loading features:', error);
      setFeatures(defaultFeatures);
    }
  };

  const defaultFeatures = [
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

  return (
    <div className="min-h-screen bg-white">
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
                <p className="text-xs text-gray-500">Track Grow Purify</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-gray-700 hover:text-gray-900">Reviews</a>
              <button
                onClick={() => router.push('/login')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
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
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-700">Features</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-700">Pricing</a>
                <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-700">Reviews</a>
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

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Complete financial management with automated Zakat calculation, 
                multi-account tracking, and powerful analytics—all aligned with Islamic principles.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => router.push('/register')}
                  className="px-8 py-4 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group"
                >
                  Start 5-Day Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 border-2 border-gray-200 rounded-full font-semibold hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Watch Demo
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
              { icon: Activity, value: `${(stats.transactions / 1000).toFixed(0)}K+`, label: 'Transactions' },
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
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
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
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start with a 5-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, i) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl p-8 border-2 hover:shadow-xl transition-all ${
                  i === 1 ? 'border-gray-900 ring-4 ring-gray-100' : 'border-gray-200'
                }`}
              >
                {i === 1 && (
                  <div className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-semibold inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">৳{plan.price}</span>
                  <span className="text-gray-600">/{plan.duration}</span>
                </div>
                {plan.features && (
                  <ul className="space-y-3 mb-8">
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
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    i === 1
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
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
                <p className="text-xs text-gray-500">Islamic Finance Made Simple</p>
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