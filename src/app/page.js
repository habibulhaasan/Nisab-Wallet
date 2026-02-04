'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  Users,
  Activity,
  Star,
  PlayCircle,
  Smartphone,
  Lock,
  Zap,
  Award,
  Moon,
  Bell,
  Calendar,
  Target,
  CreditCard,
  PiggyBank,
  ShoppingCart,
  RefreshCw,
  TrendingDown,
  FileText,
  DollarSign,
  Heart,
  Sparkles,
  Layers,
  History,
  Gift,
  Repeat,
  Receipt
} from 'lucide-react';

export default function UltimateLandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ users: 0, transactions: 0, satisfaction: 0 });
  const [plans, setPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    loadAllData();
    
    // Auto-rotate featured features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % allFeatures.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

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

  const coreFeatures = [
    {
      icon: <Moon className="w-8 h-8" />,
      title: 'Hijri Year (Hawl) Monitoring',
      description: 'Track your wealth for exactly 12 lunar months with automatic Zakat assessment',
      gradient: 'from-emerald-500 to-teal-500',
      tag: 'Lunar Logic'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Real-time Nisab Assessment',
      description: 'Market-synced Nisab calculation based on current silver rates',
      gradient: 'from-blue-500 to-cyan-500',
      tag: 'Market Sync'
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: 'Multi-Account Wealth Hub',
      description: 'Consolidate Cash, Bank, bKash, and Gold in one secure terminal',
      gradient: 'from-purple-500 to-pink-500',
      tag: 'Wealth View'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Automated Zakat Calculator',
      description: 'Shariah-compliant calculation with complete transparency',
      gradient: 'from-green-500 to-emerald-500',
      tag: 'Shariah-First'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Advanced Analytics',
      description: 'Visual insights and comprehensive financial reports',
      gradient: 'from-orange-500 to-red-500',
      tag: 'Data Driven'
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Bank-Grade Security',
      description: 'Military-grade encryption keeps your data protected',
      gradient: 'from-indigo-500 to-purple-500',
      tag: 'Secure'
    }
  ];

  const allFeatures = [
    {
      icon: <Receipt className="w-6 h-6" />,
      title: 'Tax File Preparation',
      description: 'Export transaction reports formatted for tax filing',
      status: 'Coming Soon',
      color: 'emerald'
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Loan Tracker',
      description: 'Monitor loans with Qard Hasan (interest-free) and conventional tracking',
      status: 'Active',
      color: 'blue'
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: 'Shopping List',
      description: 'Plan purchases and track spending against budget',
      status: 'Coming Soon',
      color: 'purple'
    },
    {
      icon: <Repeat className="w-6 h-6" />,
      title: 'Recurring Transactions',
      description: 'Automate monthly bills, subscriptions, and regular expenses',
      status: 'Coming Soon',
      color: 'orange'
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Budget Tracking',
      description: 'Set category budgets and monitor spending in real-time',
      status: 'Coming Soon',
      color: 'pink'
    },
    {
      icon: <PiggyBank className="w-6 h-6" />,
      title: 'Financial Goals',
      description: 'Save for Hajj, Umrah, marriage, or any halal goal',
      status: 'Coming Soon',
      color: 'teal'
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Smart Notifications',
      description: 'Payment reminders, Zakat alerts, and budget warnings',
      status: 'Active',
      color: 'yellow'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Investment Tracker',
      description: 'Monitor halal investments and Shariah-compliant portfolios',
      status: 'Coming Soon',
      color: 'indigo'
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Charity Tracker',
      description: 'Record Sadaqah, donations, and charitable contributions',
      status: 'Coming Soon',
      color: 'red'
    }
  ];

  const securityFeatures = [
    { icon: <Layers />, title: 'End-to-End Encryption' },
    { icon: <Bell />, title: 'Smart Alerts' },
    { icon: <History />, title: 'Auto Backups' },
    { icon: <Lock />, title: 'Secure Access' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <div className="relative w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="text-emerald-400" size={24} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-xl font-black italic tracking-tighter uppercase text-gray-900">Nisab Wallet</h1>
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Digital Nisab Monitor</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-emerald-600 transition-colors">Features</a>
              <a href="#pricing" className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-emerald-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-emerald-600 transition-colors">Reviews</a>
              <button
                onClick={() => router.push('/login?action=demo')}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <PlayCircle size={16} /> Live Demo
              </button>
              <button
                onClick={() => router.push('/login')}
                className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg"
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
                <button onClick={() => { setMobileMenuOpen(false); router.push('/login?action=demo'); }} className="text-left text-sm font-medium text-emerald-600">Live Demo</button>
                <button onClick={() => { setMobileMenuOpen(false); router.push('/login'); }} className="text-left text-sm font-medium text-gray-700">Login</button>
                <button
                  onClick={() => { setMobileMenuOpen(false); router.push('/register'); }}
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full mb-6 border border-emerald-200">
                <Shield size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Shariah-Compliant Wealth Tracking</span>
              </div>

              <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] mb-8 text-gray-900">
                The Digital
                <br />
                <span className="text-emerald-600">Nisab</span> Monitor.
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Engineered for the modern Muslim. Track 12-month Zakat cycles, monitor live Nisab, 
                and command your financial future with Shariah-first precision.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => router.push('/login?action=demo')}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase text-xs tracking-wider shadow-xl hover:bg-emerald-500 hover:shadow-2xl transition-all"
                >
                  Try Live Demo
                  <PlayCircle className="group-hover:scale-110 transition-transform" size={18} />
                </button>
                <button
                  onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-2xl font-bold uppercase text-xs tracking-wider hover:border-gray-300 hover:shadow-lg transition-all"
                >
                  View Plans
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>5-Day Free Trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>No Credit Card</span>
                </div>
              </div>
            </div>

            {/* Right Content - App Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full" />
              <div className="relative bg-gray-900 rounded-[3.5rem] p-3 shadow-2xl border border-gray-800">
                <div className="bg-white rounded-[2.8rem] overflow-hidden border border-gray-100 shadow-inner">
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Financial Terminal</p>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                    </div>
                    <div className="h-32 w-full bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg">
                      <p className="text-xs font-bold opacity-90 uppercase tracking-wider">Total Net Wealth</p>
                      <p className="text-3xl font-black italic uppercase tracking-tighter">৳4,85,250</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nisab Threshold</p>
                        <p className="text-lg font-black italic text-gray-900">৳68,420</p>
                      </div>
                      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 space-y-1">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Days in Hawl</p>
                        <p className="text-lg font-black italic text-emerald-700">184 Days</p>
                      </div>
                    </div>
                  </div>
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
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm mb-4 border border-gray-100">
                  <stat.icon className="w-6 h-6 text-gray-900" />
                </div>
                <p className="text-3xl font-black italic text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features - Shariah-First Engineering */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-gray-900">
              Shariah-First Engineering
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Built for Accountability</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, i) => (
              <div key={i} className="group bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-2xl hover:border-emerald-200 transition-all">
                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 text-white group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.icon}
                </div>
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-full mb-3 tracking-wider">
                  {feature.tag}
                </span>
                <h3 className="text-xl font-black italic uppercase tracking-tight text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Features - Interactive Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-gray-900">
              Complete Financial Command
            </h2>
            <p className="text-lg text-gray-600">Everything you need to manage wealth the Islamic way</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allFeatures.map((feature, i) => (
              <div
                key={i}
                className={`group relative bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer ${
                  activeFeature === i
                    ? 'border-emerald-500 shadow-xl scale-105'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'
                }`}
                onMouseEnter={() => setActiveFeature(i)}
              >
                {feature.status === 'Coming Soon' && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-gray-100 text-gray-600 text-[9px] font-bold uppercase rounded-full">
                    Soon
                  </div>
                )}
                {feature.status === 'Active' && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase rounded-full flex items-center gap-1">
                    <Sparkles size={10} /> Active
                  </div>
                )}
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${feature.color}-100 text-${feature.color}-600 rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Mobile App Teaser */}
          <div className="mt-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-center text-white">
            <Smartphone className="w-16 h-16 mx-auto mb-6 text-emerald-400" />
            <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4">Coming to Mobile</h3>
            <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
              Native iOS and Android apps launching soon. Manage your wealth on-the-go with full offline support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold text-sm opacity-50 cursor-not-allowed">
                Download iOS App (Soon)
              </button>
              <button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold text-sm opacity-50 cursor-not-allowed">
                Download Android App (Soon)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Infrastructure */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-12 text-gray-900">
            Security Infrastructure
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {securityFeatures.map((feature, i) => (
              <div key={i} className="p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all group">
                <div className="text-emerald-600 mb-4 mx-auto w-10 h-10 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-600">{feature.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-gray-900">
              Subscription Plans
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Choose Your Access Duration</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-emerald-600 rounded-full mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, idx) => (
                <div
                  key={plan.id || idx}
                  className={`relative p-10 rounded-[3rem] border-2 transition-all ${
                    idx === 1
                      ? 'border-emerald-500 shadow-2xl bg-gray-900 text-white scale-105 z-10'
                      : 'border-gray-200 bg-white hover:border-gray-300 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {idx === 1 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                      Recommended
                    </div>
                  )}
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                    idx === 1 ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    {plan.name || 'System Package'}
                  </p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl font-black italic tracking-tighter uppercase">৳{plan.price}</span>
                    <span className="text-xs font-bold uppercase opacity-60">/ {plan.months}m</span>
                  </div>
                  <ul className="space-y-4 mb-10 text-sm">
                    <li className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                      <span className="font-medium">Full Zakat Cycle Tracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                      <span className="font-medium">Market Nisab Monitoring</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                      <span className="font-medium">Secure PDF Statements</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                      <span className="font-medium">Advanced Analytics</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => router.push(`/register?package=${plan.id}`)}
                    className={`w-full py-4 rounded-2xl text-center font-bold uppercase text-xs tracking-wider transition-all shadow-lg ${
                      idx === 1
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                        : 'bg-gray-900 text-white hover:bg-emerald-600'
                    }`}
                  >
                    Open Account
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-gray-900">
              Trusted by Muslims Worldwide
            </h2>
            <p className="text-lg text-gray-600">Real feedback from real users</p>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.message}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-6 leading-tight">
            Ready to Master Your Wealth?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands managing their finances according to Islamic principles
          </p>
          <button
            onClick={() => router.push('/register')}
            className="inline-flex items-center gap-3 px-10 py-5 bg-emerald-500 text-white rounded-2xl font-bold uppercase text-sm tracking-wider hover:bg-emerald-400 transition-all shadow-2xl group"
          >
            Start Your 5-Day Free Trial
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </button>
          <p className="text-gray-400 mt-6">No credit card required • Full access • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Zap className="text-emerald-600" size={24} fill="currentColor" />
                <span className="text-xl font-black italic uppercase tracking-tighter">Nisab Wallet</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Engineered for the Modern Muslim
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-wider text-gray-600 justify-center">
              <button onClick={() => router.push('/login?action=demo')} className="hover:text-emerald-600 transition-colors">
                Live Demo
              </button>
              <button onClick={() => router.push('/privacy')} className="hover:text-emerald-600 transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => router.push('/terms')} className="hover:text-emerald-600 transition-colors">
                Terms of Service
              </button>
              <button onClick={() => router.push('/contact')} className="hover:text-emerald-600 transition-colors">
                Contact
              </button>
            </div>
          </div>
          <div className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 border-t border-gray-200 pt-8">
            © {new Date().getFullYear()} Nisab Wallet Financial. Shariah Optimized.
          </div>
        </div>
      </footer>
    </div>
  );
}