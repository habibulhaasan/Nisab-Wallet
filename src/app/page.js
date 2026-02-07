// src/app/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  CheckCircle, 
  ArrowRight, 
  Menu, 
  X,
  Wallet,
  TrendingUp,
  Shield,
  BarChart3,
  Star,
  Lock,
  Award,
  Moon,
  Calendar,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
  Mail,
  MapPin,
  Phone,
  Globe,
  Heart,
  Target,
  TrendingDown,
  PiggyBank,
  RefreshCw,
  Eye,
  Clock,
  Gift,
  Layers
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ users: 0, transactions: 0, satisfaction: 0 });
  const [plans, setPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    loadAllData();
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadStatistics(),
      loadPlans(),
      loadTestimonials()
    ]);
    setLoading(false);
  };

  const loadStatistics = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userCount = usersSnapshot.size;

      let transactionCount = 0;
      for (const userDoc of usersSnapshot.docs) {
        const transactionsSnapshot = await getDocs(
          collection(db, 'users', userDoc.id, 'transactions')
        );
        transactionCount += transactionsSnapshot.size;
      }

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
    try {
      const snap = await getDoc(doc(db, 'system', 'config'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.packages && Array.isArray(data.packages)) {
          setPlans(data.packages);
        }
      }
    } catch (error) {
      console.error('Error loading plans:', error);
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

  const features = [
    {
      icon: <Moon className="w-6 h-6" />,
      title: 'Hijri Year Tracking',
      description: 'Monitor your wealth for exactly 12 lunar months with automatic Zakat assessment',
      color: 'blue'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Real-time Nisab',
      description: 'Market-synced Nisab calculation based on current silver rates',
      color: 'green'
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: 'Multi-Account Hub',
      description: 'Consolidate Cash, Bank, bKash, and Gold in one secure platform',
      color: 'purple'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Automated Zakat',
      description: 'Shariah-compliant calculation with complete transparency',
      color: 'emerald'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Smart Analytics',
      description: 'Visual insights and comprehensive financial reports',
      color: 'indigo'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'PDF Reports',
      description: 'Generate professional financial statements instantly',
      color: 'orange'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Create Your Account',
      description: 'Sign up in seconds with just your email. Start with a 5-day free trial.',
      icon: <Users className="w-8 h-8" />
    },
    {
      step: 2,
      title: 'Add Your Accounts',
      description: 'Connect your cash, bank accounts, mobile banking, and gold holdings.',
      icon: <Wallet className="w-8 h-8" />
    },
    {
      step: 3,
      title: 'Track Transactions',
      description: 'Record income and expenses easily. Get real-time insights into your wealth.',
      icon: <TrendingUp className="w-8 h-8" />
    },
    {
      step: 4,
      title: 'Calculate Zakat',
      description: 'Let our automated system calculate your Zakat with Shariah compliance.',
      icon: <Calendar className="w-8 h-8" />
    }
  ];

  const faqs = [
    {
      question: 'What is Nisab Wallet?',
      answer: 'Nisab Wallet is a comprehensive Islamic finance management platform that helps Muslims track their wealth, manage Zakat obligations, and maintain financial transparency according to Shariah principles.'
    },
    {
      question: 'How does the free trial work?',
      answer: 'You get 5 days of full access to all features. No credit card required. After the trial, choose a plan that fits your needs or continue with limited free features.'
    },
    {
      question: 'Is my financial data secure?',
      answer: 'Absolutely. We use bank-level encryption, secure cloud storage, and never share your data with third parties. Your privacy and security are our top priorities.'
    },
    {
      question: 'How is Zakat calculated?',
      answer: 'Our system follows Shariah-compliant methods, tracking your wealth for a full lunar year (Hawl) and calculating 2.5% of eligible assets when they exceed the Nisab threshold.'
    },
    {
      question: 'Can I export my financial data?',
      answer: 'Yes! You can export your data as PDF reports or CSV files at any time. You maintain full control and ownership of your information.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept bKash, Nagad, Rocket, bank transfers, and cash payments. All payment options are displayed during checkout.'
    }
  ];

  const additionalFeatures = [
    { icon: <Eye className="w-5 h-5" />, text: 'Real-time Dashboard' },
    { icon: <Lock className="w-5 h-5" />, text: 'Bank-Level Security' },
    { icon: <RefreshCw className="w-5 h-5" />, text: 'Auto-Sync Data' },
    { icon: <Clock className="w-5 h-5" />, text: '24/7 Access' },
    { icon: <Gift className="w-5 h-5" />, text: 'Free Updates' },
    { icon: <Layers className="w-5 h-5" />, text: 'Multi-Platform' }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100'
  };

  // Modal Component
  const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} className="text-gray-600" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Add smooth scroll CSS */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => scrollToSection('hero')} className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Nisab Wallet</span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">How It Works</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Pricing</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Reviews</button>
              <button
                onClick={() => router.push('/login')}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all hover:shadow-lg"
              >
                Get Started
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white shadow-lg animate-slideUp">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-sm font-medium text-gray-600 hover:text-blue-600">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left py-2 text-sm font-medium text-gray-600 hover:text-blue-600">How It Works</button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left py-2 text-sm font-medium text-gray-600 hover:text-blue-600">Pricing</button>
              <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left py-2 text-sm font-medium text-gray-600 hover:text-blue-600">Reviews</button>
              <button
                onClick={() => router.push('/login')}
                className="block w-full text-left py-2 text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 text-center"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6 animate-pulse">
                <Sparkles size={16} />
                <span>Trusted by {stats.users.toLocaleString()}+ Muslims</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Wealth,
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Perfected by Faith</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Simplify Zakat, amplify Barakah. The smartest way to manage Islamic finance with complete Shariah compliance and modern technology.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => router.push('/register')}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:scale-105"
                >
                  Begin Your Journey
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-200">
                {additionalFeatures.slice(0, 3).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      {feature.icon}
                    </div>
                    <span className="font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Interactive Stats Card */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative z-10">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center transform hover:scale-110 transition-transform cursor-pointer">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{stats.users.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </div>
                  <div className="text-center transform hover:scale-110 transition-transform cursor-pointer">
                    <div className="text-3xl font-bold text-green-600 mb-1">{(stats.transactions / 1000).toFixed(0)}K+</div>
                    <div className="text-sm text-gray-600">Transactions</div>
                  </div>
                  <div className="text-center transform hover:scale-110 transition-transform cursor-pointer">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-3xl font-bold text-gray-900">{stats.satisfaction}</span>
                    </div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                </div>
                
                {/* Rotating Feature */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 min-h-[140px]">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-lg ${colorClasses[features[activeFeature].color]} flex items-center justify-center flex-shrink-0`}>
                      {features[activeFeature].icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-2">{features[activeFeature].title}</div>
                      <p className="text-sm text-gray-700 leading-relaxed">{features[activeFeature].description}</p>
                    </div>
                  </div>
                  
                  {/* Feature Dots */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {features.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveFeature(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === activeFeature ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-indigo-200 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Islamic Finance
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make Zakat calculation and wealth management effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-lg ${colorClasses[feature.color]} flex items-center justify-center mb-4 transition-all group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Additional Features */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {additionalFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="text-blue-600">{feature.icon}</div>
                <span className="text-sm font-medium text-gray-700">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all h-full transform hover:-translate-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      {step.icon}
                    </div>
                    <div className="text-5xl font-bold text-gray-100">{step.step}</div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-300 to-transparent">
                    <ArrowRight className="absolute -top-2 -right-1 text-blue-300" size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for you
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin h-12 w-12 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading pricing...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, idx) => (
                <div
                  key={plan.id || idx}
                  className={`relative p-8 rounded-2xl border-2 transition-all transform hover:-translate-y-2 ${
                    idx === 1
                      ? 'border-blue-600 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50 scale-105'
                      : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-xl'
                  }`}
                >
                  {idx === 1 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name || 'Package'}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">৳{plan.price}</span>
                      <span className="text-gray-600">/ {plan.months}m</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle size={20} className="text-green-600 shrink-0" />
                      <span>Full Zakat Cycle Tracking</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle size={20} className="text-green-600 shrink-0" />
                      <span>Market Nisab Monitoring</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle size={20} className="text-green-600 shrink-0" />
                      <span>Secure PDF Statements</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle size={20} className="text-green-600 shrink-0" />
                      <span>Advanced Analytics</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle size={20} className="text-green-600 shrink-0" />
                      <span>Priority Support</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => router.push(`/register?package=${plan.id}`)}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      idx === 1
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 text-white hover:bg-blue-600'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Muslims Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our users have to say
            </p>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all transform hover:-translate-y-2">
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
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
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

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 transition-all">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <div className={`transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                    <ChevronDown className="text-gray-600 shrink-0" size={20} />
                  </div>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 animate-slideUp">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Transform Your Financial Journey Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of Muslims managing their finances according to Islamic principles
          </p>
          <button
            onClick={() => router.push('/register')}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
          >
            Unlock Your Financial Clarity
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-blue-200 mt-6 flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-2">
              <CheckCircle size={16} />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle size={16} />
              5-day free trial
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle size={16} />
              Cancel anytime
            </span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Nisab Wallet</span>
              </div>
              <p className="text-sm leading-relaxed">
                Modern Islamic finance management for the connected Muslim.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="hover:text-white transition-colors">Reviews</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setShowModal('about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => setShowModal('contact')} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setShowModal('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => setShowModal('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-center md:text-left">
              © {new Date().getFullYear()} Nisab Wallet. All rights reserved. Built with <Heart className="inline w-4 h-4 text-red-500 fill-red-500" /> for the Muslim community.
            </p>
            <div className="flex items-center gap-6">
              <a href="mailto:support@nisabwallet.com" className="hover:text-white transition-colors">
                <Mail size={20} />
              </a>
              <a href="tel:+8801234567890" className="hover:text-white transition-colors">
                <Phone size={20} />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showModal === 'about' && (
        <Modal title="About Nisab Wallet" onClose={() => setShowModal(null)}>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              Nisab Wallet is a comprehensive Islamic finance management platform designed specifically for Muslims who want to manage their wealth according to Shariah principles.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Mission</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To simplify Islamic finance management and make Zakat calculation accessible, accurate, and effortless for every Muslim, regardless of their financial expertise.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Values</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <span><strong>Shariah Compliance:</strong> Every feature follows Islamic principles</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <span><strong>Transparency:</strong> Clear calculations and complete data ownership</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <span><strong>Security:</strong> Bank-level encryption and data protection</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                <span><strong>Innovation:</strong> Modern technology meeting traditional values</span>
              </li>
            </ul>
          </div>
        </Modal>
      )}

      {showModal === 'contact' && (
        <Modal title="Contact Us" onClose={() => setShowModal(null)}>
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Email Support</h4>
                <p className="text-gray-600 mb-2">Get help via email within 24 hours</p>
                <a href="mailto:support@nisabwallet.com" className="text-blue-600 hover:underline">
                  support@nisabwallet.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Phone Support</h4>
                <p className="text-gray-600 mb-2">Mon-Fri, 9AM-6PM (GMT+6)</p>
                <a href="tel:+8801234567890" className="text-blue-600 hover:underline">
                  +880 1234-567890
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Office Address</h4>
                <p className="text-gray-600">
                  House #123, Road #4<br />
                  Dhanmondi, Dhaka 1209<br />
                  Bangladesh
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Need immediate assistance?</strong> Use the live chat feature in your dashboard after logging in.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {showModal === 'privacy' && (
        <Modal title="Privacy Policy" onClose={() => setShowModal(null)}>
          <div className="prose max-w-none">
            <p className="text-sm text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h3>
            <p className="text-gray-700 mb-4">
              We collect information you provide directly to us, including your name, email address, and financial data you choose to input into our platform.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h3>
            <ul className="space-y-2 text-gray-700 mb-4">
              <li>• Provide and maintain our services</li>
              <li>• Calculate your Zakat obligations accurately</li>
              <li>• Send important account updates and notifications</li>
              <li>• Improve and optimize our platform</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Data Security</h3>
            <p className="text-gray-700 mb-4">
              We use industry-standard encryption and security measures to protect your data. Your financial information is encrypted both in transit and at rest.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Data Sharing</h3>
            <p className="text-gray-700 mb-4">
              We never sell your personal information. We only share data with service providers necessary to operate our platform, and they are bound by strict confidentiality agreements.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Your Rights</h3>
            <p className="text-gray-700 mb-4">
              You have the right to access, update, or delete your personal information at any time. You can export all your data from the dashboard settings.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700">
                For any privacy concerns, contact us at <a href="mailto:privacy@nisabwallet.com" className="text-blue-600 hover:underline">privacy@nisabwallet.com</a>
              </p>
            </div>
          </div>
        </Modal>
      )}

      {showModal === 'terms' && (
        <Modal title="Terms of Service" onClose={() => setShowModal(null)}>
          <div className="prose max-w-none">
            <p className="text-sm text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h3>
            <p className="text-gray-700 mb-4">
              By accessing and using Nisab Wallet, you accept and agree to be bound by these Terms of Service.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Use of Service</h3>
            <p className="text-gray-700 mb-4">
              You agree to use our service only for lawful purposes and in accordance with Islamic principles. You are responsible for maintaining the confidentiality of your account.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Subscription and Payments</h3>
            <ul className="space-y-2 text-gray-700 mb-4">
              <li>• All subscriptions start with a 5-day free trial</li>
              <li>• You can cancel anytime during the trial period</li>
              <li>• Refunds are processed according to our refund policy</li>
              <li>• Prices are subject to change with 30 days notice</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Zakat Calculations</h3>
            <p className="text-gray-700 mb-4">
              While we strive for accuracy in all Zakat calculations, you should consult with a qualified Islamic scholar for final verification of your obligations.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              Nisab Wallet is provided "as is" without warranties. We are not liable for any financial decisions you make based on the information provided by our platform.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Termination</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to terminate or suspend access to our service for violations of these terms.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700">
                Questions about our terms? Contact <a href="mailto:legal@nisabwallet.com" className="text-blue-600 hover:underline">legal@nisabwallet.com</a>
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}