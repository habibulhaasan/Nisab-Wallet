// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { 
  CheckCircle, Star, TrendingUp, Shield, Wallet, BarChart3, 
  Smartphone, Lock, Users, ArrowRight, Menu, X, DollarSign,
  Zap, Clock, Award, Globe, Heart, RefreshCw, ChevronRight,
  Sparkles, Check, Eye, Target, Layers, Database, Bell,
  PieChart, CreditCard, FileText, Settings, TrendingDown,
  Calendar, Filter, Download, Search
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    loadPlans();
    loadFeaturedFeedback();
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const loadPlans = async () => {
    setLoadingPlans(true);
    const result = await getSubscriptionPlans(true);
    if (result.success) {
      setSubscriptionPlans(result.plans);
    }
    setLoadingPlans(false);
  };

  const loadFeaturedFeedback = async () => {
    setLoadingTestimonials(true);
    try {
      const allFeaturedFeedback = [];
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
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
              rating: data.rating || 5,
              message: data.message || '',
              userName: data.userName || 'Anonymous User',
              role: data.userRole || 'User',
              featuredAt: data.featuredAt
            });
          });
        } catch (error) {
          try {
            const fallbackQuery = query(feedbackRef, where('featured', '==', true));
            const feedbackSnapshot = await getDocs(fallbackQuery);
            feedbackSnapshot.forEach(feedbackDoc => {
              const data = feedbackDoc.data();
              allFeaturedFeedback.push({
                id: `${userDoc.id}-${feedbackDoc.id}`,
                rating: data.rating || 5,
                message: data.message || '',
                userName: data.userName || 'Anonymous User',
                role: data.userRole || 'User',
                featuredAt: data.featuredAt
              });
            });
          } catch (fallbackError) {
            console.error('Fallback query failed:', fallbackError);
          }
        }
      }

      allFeaturedFeedback.sort((a, b) => {
        const dateA = a.featuredAt?.toDate?.() || new Date(0);
        const dateB = b.featuredAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      if (allFeaturedFeedback.length > 0) {
        setTestimonials(allFeaturedFeedback.slice(0, 6));
      } else {
        setTestimonials([
          { id: 1, rating: 5, message: "This app has transformed how I manage my finances. The Zakat calculation feature is incredibly helpful!", userName: "Ahmed Hassan", role: "Business Owner" },
          { id: 2, rating: 5, message: "Simple, intuitive, and follows Islamic principles perfectly. Highly recommended for every Muslim.", userName: "Fatima Rahman", role: "Teacher" },
          { id: 3, rating: 5, message: "The analytics dashboard gives me clear insights into my spending. Managing multiple accounts has never been easier!", userName: "Ibrahim Ali", role: "Software Engineer" }
        ]);
      }
    } catch (error) {
      console.error('Error loading featured feedback:', error);
      setTestimonials([
        { id: 1, rating: 5, message: "This app has transformed how I manage my finances. The Zakat calculation feature is incredibly helpful!", userName: "Ahmed Hassan", role: "Business Owner" },
        { id: 2, rating: 5, message: "Simple, intuitive, and follows Islamic principles perfectly. Highly recommended for every Muslim.", userName: "Fatima Rahman", role: "Teacher" },
        { id: 3, rating: 5, message: "The analytics dashboard gives me clear insights into my spending. Managing multiple accounts has never been easier!", userName: "Ibrahim Ali", role: "Software Engineer" }
      ]);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  const features = [
    {
      icon: <Wallet className="w-8 h-8" />,
      title: 'Smart Account Management',
      description: 'Manage all your accounts in one secure place. Track cash, bank accounts, bKash, Nagad, and more with real-time balance updates.',
      color: 'from-[#1e3a5f] to-[#2d5a8c]',
      benefits: ['Unlimited accounts', 'Real-time sync', 'Easy transfers', 'Multi-currency support']
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Automated Zakat Calculator',
      description: 'Never miss your Zakat obligations. Our smart calculator tracks your wealth and alerts you when Zakat is due based on authentic Islamic methodology.',
      color: 'from-[#2d5a8c] to-[#1e3a5f]',
      benefits: ['Nisab monitoring', 'Lunar calendar', 'Asset tracking', 'Custom notifications']
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Intelligent Transaction Tracking',
      description: 'Every transaction is automatically categorized and analyzed. Get instant insights into your spending patterns and make smarter financial decisions.',
      color: 'from-[#1e3a5f] to-[#3d6fa8]',
      benefits: ['Auto-categorization', 'Smart tags', 'Receipt capture', 'Budget alerts']
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Powerful Analytics Dashboard',
      description: 'Visualize your financial health with beautiful interactive charts. Track trends, compare periods, and export detailed reports.',
      color: 'from-[#3d6fa8] to-[#1e3a5f]',
      benefits: ['Visual reports', 'Trend analysis', 'Export options', 'Custom filters']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Animated Header Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1e3a5f] via-[#2d5a8c] to-[#1e3a5f] text-white py-3">
        <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm md:text-base font-semibold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Limited Time: Start your 5-day FREE trial today - No credit card required!</span>
            <Sparkles className="w-4 h-4 animate-pulse" />
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrollY > 50 
          ? 'bg-white/95 backdrop-blur-lg shadow-lg' 
          : 'bg-white shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push('/')}>
              <div className="relative w-12 h-12 transition-transform group-hover:scale-110 duration-300">
                <Image 
                  src="/nisab-logo.png" 
                  alt="Nisab Wallet" 
                  width={48} 
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1e3a5f]">Nisab Wallet</h1>
                <p className="text-xs text-gray-500 font-medium">Islamic Finance Simplified</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-[#1e3a5f] font-semibold transition-colors relative group">
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#1e3a5f] group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-[#1e3a5f] font-semibold transition-colors relative group">
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#1e3a5f] group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-[#1e3a5f] font-semibold transition-colors relative group">
                Reviews
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#1e3a5f] group-hover:w-full transition-all duration-300"></span>
              </a>
              <button
                onClick={() => router.push('/login')}
                className="text-gray-700 hover:text-[#1e3a5f] font-semibold transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/register')}
                className="relative overflow-hidden bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#2d5a8c] to-[#1e3a5f] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} className="text-[#1e3a5f]" /> : <Menu size={24} className="text-[#1e3a5f]" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg animate-slideDown">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-700 hover:text-[#1e3a5f] font-semibold py-3 border-b border-gray-100">
                Features
              </a>
              <a href="#pricing" className="block text-gray-700 hover:text-[#1e3a5f] font-semibold py-3 border-b border-gray-100">
                Pricing
              </a>
              <a href="#testimonials" className="block text-gray-700 hover:text-[#1e3a5f] font-semibold py-3 border-b border-gray-100">
                Reviews
              </a>
              <button
                onClick={() => router.push('/login')}
                className="block w-full text-left text-gray-700 hover:text-[#1e3a5f] font-semibold py-3 border-b border-gray-100"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/register')}
                className="block w-full bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] text-white px-6 py-4 rounded-xl font-bold shadow-lg"
              >
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 overflow-hidden pt-20 pb-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#1e3a5f]/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#2d5a8c]/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#1e3a5f]/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fadeInLeft">
              <div className="inline-flex items-center space-x-2 bg-white border-2 border-[#1e3a5f]/20 text-[#1e3a5f] px-5 py-2.5 rounded-full shadow-lg animate-bounce-slow">
                <Award className="w-5 h-5" />
                <span className="font-bold text-sm">🏆 Trusted by 10,000+ Muslims Worldwide</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black leading-tight text-gray-900">
                Your Money,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] animate-gradient">
                  Your Way
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
                The most comprehensive Islamic finance platform. Track transactions, manage accounts, 
                calculate Zakat automatically, and make informed financial decisions—all while staying 
                true to Islamic principles.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => router.push('/register')}
                  className="group relative overflow-hidden bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  <span className="relative z-10 flex items-center">
                    Start Your Free Trial
                    <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={24} />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2d5a8c] to-[#1e3a5f] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                <button
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  className="group px-10 py-5 rounded-2xl font-bold text-lg border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 flex items-center justify-center"
                >
                  <Eye className="mr-3 group-hover:scale-110 transition-transform duration-300" size={24} />
                  See How It Works
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-8 pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700 font-semibold">No Credit Card Required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700 font-semibold">5-Day Free Trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700 font-semibold">Cancel Anytime</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex -space-x-3">
                  {['A', 'M', 'F', 'S', 'K'].map((letter, i) => (
                    <div 
                      key={i} 
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8c] border-3 border-white flex items-center justify-center text-white font-bold shadow-lg transform hover:scale-110 transition-transform duration-300"
                      style={{animationDelay: `${i * 0.1}s`}}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-900">4.9/5</span> from 2,500+ reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Dashboard Mockup */}
            <div className="relative animate-fadeInRight">
              <div className="relative bg-white rounded-3xl shadow-2xl border-4 border-gray-100 overflow-hidden transform hover:scale-105 transition-transform duration-500">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80 font-medium">Total Balance</p>
                      <h3 className="text-4xl font-black text-white mt-1">৳ 45,280.50</h3>
                      <p className="text-sm text-emerald-300 font-semibold mt-1 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +12.5% this month
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-600">Income</p>
                    <p className="text-lg font-bold text-gray-900">৳ 52K</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-xs text-gray-600">Expenses</p>
                    <p className="text-lg font-bold text-gray-900">৳ 18K</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-xs text-gray-600">Zakat</p>
                    <p className="text-lg font-bold text-gray-900">৳ 1.1K</p>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="p-6 space-y-3">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-[#1e3a5f]" />
                    Recent Transactions
                  </h4>
                  
                  {[
                    { name: 'Monthly Salary', amount: '+৳ 50,000', type: 'income', icon: '💼', time: 'Today, 9:00 AM' },
                    { name: 'Grocery Shopping', amount: '-৳ 3,250', type: 'expense', icon: '🛒', time: 'Today, 2:30 PM' },
                    { name: 'Electricity Bill', amount: '-৳ 2,100', type: 'expense', icon: '⚡', time: 'Yesterday' },
                    { name: 'Freelance Work', amount: '+৳ 8,500', type: 'income', icon: '💻', time: '2 days ago' }
                  ].map((txn, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-102 cursor-pointer group"
                      style={{animation: `slideUp 0.5s ease-out ${i * 0.1}s both`}}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                          {txn.icon}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{txn.name}</p>
                          <p className="text-xs text-gray-500">{txn.time}</p>
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.amount}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Zakat Progress */}
                <div className="px-6 pb-6">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-purple-600 mr-2" />
                        <span className="font-bold text-gray-900">Zakat Due</span>
                      </div>
                      <span className="text-lg font-black text-purple-600">৳ 1,132</span>
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full animate-progress" style={{width: '68%'}}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">68% of lunar year completed</p>
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-2xl p-4 border-2 border-green-200 animate-bounce-slow" style={{animationDelay: '0.5s'}}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Halal Certified</p>
                    <p className="text-lg font-black text-green-600">100%</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-4 border-2 border-[#1e3a5f]/20 animate-bounce-slow" style={{animationDelay: '1.5s'}}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Lock className="w-7 h-7 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Bank-Grade</p>
                    <p className="text-lg font-black text-[#1e3a5f]">Security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-16 bg-gradient-to-r from-[#1e3a5f] via-[#2d5a8c] to-[#1e3a5f] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Users className="w-10 h-10" />, number: '10,000+', label: 'Active Users', prefix: '' },
              { icon: <Database className="w-10 h-10" />, number: '500K+', label: 'Transactions Tracked', prefix: '' },
              { icon: <Globe className="w-10 h-10" />, number: '₹5Cr+', label: 'Money Managed', prefix: '' },
              { icon: <Star className="w-10 h-10 fill-yellow-400" />, number: '4.9', label: 'Average Rating', prefix: '★ ' }
            ].map((stat, i) => (
              <div key={i} className="text-center animate-fadeInUp" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 text-white transform hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.prefix}{stat.number}</div>
                <div className="text-sm md:text-base text-blue-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fadeInUp">
            <div className="inline-flex items-center space-x-2 bg-[#1e3a5f]/10 text-[#1e3a5f] px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="font-bold text-sm">POWERFUL FEATURES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Everything You Need,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c]">
                Nothing You Don't
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed specifically for Muslims who want to manage their wealth according to Islamic principles
            </p>
          </div>

          {/* Feature Showcase */}
          <div className="mb-16">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-3xl p-8 md:p-12 border-2 border-gray-200">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${features[activeFeature].color} rounded-2xl mb-6 text-white shadow-xl`}>
                    {features[activeFeature].icon}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                    {features[activeFeature].title}
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    {features[activeFeature].description}
                  </p>
                  <ul className="space-y-4">
                    {features[activeFeature].benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center animate-slideInLeft" style={{animationDelay: `${i * 0.1}s`}}>
                        <div className="w-7 h-7 bg-[#1e3a5f] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-700 font-semibold text-lg">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-1 lg:order-2 relative">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-200 transform hover:scale-105 transition-transform duration-500">
                    <div className="aspect-square bg-gradient-to-br from-[#1e3a5f]/10 to-[#2d5a8c]/10 rounded-xl flex items-center justify-center">
                      <div className={`w-32 h-32 bg-gradient-to-r ${features[activeFeature].color} rounded-full flex items-center justify-center text-white shadow-2xl animate-pulse-slow`}>
                        {features[activeFeature].icon}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Navigation Dots */}
              <div className="flex items-center justify-center gap-3 mt-12">
                {features.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFeature(i)}
                    className={`transition-all duration-300 rounded-full ${
                      activeFeature === i 
                        ? 'w-12 h-3 bg-[#1e3a5f]' 
                        : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Additional Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Smartphone className="w-6 h-6" />, title: 'Mobile & Web', desc: 'Access anywhere, anytime' },
              { icon: <Lock className="w-6 h-6" />, title: 'Secure & Private', desc: 'Bank-grade encryption' },
              { icon: <Zap className="w-6 h-6" />, title: 'Lightning Fast', desc: 'Real-time updates' },
              { icon: <RefreshCw className="w-6 h-6" />, title: 'Auto Sync', desc: 'All devices in sync' }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-[#1e3a5f] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-fadeInUp"
                style={{animationDelay: `${i * 0.1}s`}}
              >
                <div className="w-14 h-14 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  {feature.icon}
                </div>
                <h4 className="font-black text-gray-900 mb-2 text-lg">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-20 bg-gradient-to-r from-[#1e3a5f] via-[#2d5a8c] to-[#1e3a5f] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-5 py-2.5 rounded-full mb-8 animate-bounce-slow">
            <Zap className="w-5 h-5" />
            <span className="font-bold">Limited Time Offer</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Start Your Financial Journey Today
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join 10,000+ Muslims managing their finances the halal way
          </p>
          
          <button
            onClick={() => router.push('/register')}
            className="group bg-white text-[#1e3a5f] px-12 py-6 rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 inline-flex items-center"
          >
            Get Started Free - No Credit Card
            <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={24} />
          </button>
          
          <p className="text-blue-100 mt-6 flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> 5-day free trial</span>
            <span className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> No credit card</span>
            <span className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Cancel anytime</span>
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fadeInUp">
            <div className="inline-flex items-center space-x-2 bg-[#1e3a5f]/10 text-[#1e3a5f] px-4 py-2 rounded-full mb-6">
              <DollarSign className="w-4 h-4" />
              <span className="font-bold text-sm">SIMPLE PRICING</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Choose Your Perfect Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transparent pricing with no hidden fees. All plans include a 5-day free trial.
            </p>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-[#1e3a5f]/20"></div>
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-[#1e3a5f] border-t-transparent absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
              {subscriptionPlans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-8 transform transition-all duration-500 hover:scale-105 animate-fadeInUp ${
                    plan.isPopular 
                      ? 'bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8c] text-white shadow-2xl scale-105' 
                      : 'bg-white border-2 border-gray-200 hover:border-[#1e3a5f] hover:shadow-xl'
                  }`}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-2 rounded-full text-sm font-black shadow-lg flex items-center animate-bounce-slow">
                        <Award className="w-4 h-4 mr-2" />
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className={`text-2xl font-black mb-4 ${plan.isPopular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center mb-4">
                      <span className={`text-6xl font-black ${plan.isPopular ? 'text-white' : 'text-[#1e3a5f]'}`}>
                        ৳{plan.price}
                      </span>
                      <span className={`ml-2 text-lg ${plan.isPopular ? 'text-blue-100' : 'text-gray-600'}`}>
                        /month
                      </span>
                    </div>
                    <p className={`text-sm ${plan.isPopular ? 'text-blue-100' : 'text-gray-600'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className={`w-6 h-6 mr-3 flex-shrink-0 mt-0.5 ${plan.isPopular ? 'text-green-300' : 'text-green-600'}`} />
                        <span className={`font-medium ${plan.isPopular ? 'text-white' : 'text-gray-700'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => router.push('/register')}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                      plan.isPopular
                        ? 'bg-white text-[#1e3a5f] hover:bg-gray-100 shadow-lg'
                        : 'bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] text-white hover:shadow-xl'
                    }`}
                  >
                    Start Free Trial
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-8 flex-wrap text-gray-600">
              <span className="flex items-center font-semibold">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                5-day free trial on all plans
              </span>
              <span className="flex items-center font-semibold">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                No credit card required
              </span>
              <span className="flex items-center font-semibold">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                Cancel anytime
              </span>
            </div>
            
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 text-green-700 px-6 py-3 rounded-full">
              <Award className="w-5 h-5" />
              <span className="font-black">30-Day Money-Back Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fadeInUp">
            <div className="inline-flex items-center space-x-2 bg-[#1e3a5f]/10 text-[#1e3a5f] px-4 py-2 rounded-full mb-6">
              <Heart className="w-4 h-4" />
              <span className="font-bold text-sm">USER TESTIMONIALS</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Loved by Muslims Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. See what our users have to say about Nisab Wallet.
            </p>
          </div>

          {loadingTestimonials ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-[#1e3a5f]/20"></div>
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-[#1e3a5f] border-t-transparent absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#1e3a5f] hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fadeInUp"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  {/* Rating Stars */}
                  <div className="flex items-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${
                          i < testimonial.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        } transition-all duration-300 group-hover:scale-110`}
                        style={{transitionDelay: `${i * 50}ms`}}
                      />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-gray-700 mb-8 leading-relaxed text-lg italic">
                    "{testimonial.message}"
                  </p>

                  {/* User Info */}
                  <div className="flex items-center pt-6 border-t-2 border-gray-100">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8c] rounded-2xl flex items-center justify-center text-white font-black text-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {testimonial.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-lg">{testimonial.userName}</p>
                      <p className="text-sm text-gray-600 font-semibold">{testimonial.role}</p>
                    </div>
                  </div>

                  {/* Quote Icon */}
                  <div className="absolute top-6 right-6 text-[#1e3a5f]/10 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8c] to-[#1e3a5f] overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fadeInUp">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-5 py-2.5 rounded-full mb-8">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="font-bold">Ready to Get Started?</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
              Transform Your Financial Life Today
            </h2>
            <p className="text-2xl text-blue-100 mb-12 leading-relaxed max-w-3xl mx-auto">
              Join 10,000+ Muslims who are managing their finances the halal way with Nisab Wallet
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <button
                onClick={() => router.push('/register')}
                className="group bg-white text-[#1e3a5f] px-12 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 inline-flex items-center justify-center"
              >
                <span className="flex items-center">
                  Start Your Free Trial
                  <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={28} />
                </span>
              </button>
              
              <button
                onClick={() => router.push('/login')}
                className="px-12 py-6 rounded-2xl font-black text-2xl border-3 border-white text-white hover:bg-white hover:text-[#1e3a5f] transition-all duration-300"
              >
                Sign In
              </button>
            </div>

            <div className="flex items-center justify-center gap-8 flex-wrap text-blue-100 text-lg">
              <span className="flex items-center font-semibold">
                <CheckCircle className="w-6 h-6 mr-2" />
                No credit card required
              </span>
              <span className="flex items-center font-semibold">
                <CheckCircle className="w-6 h-6 mr-2" />
                5-day free trial
              </span>
              <span className="flex items-center font-semibold">
                <CheckCircle className="w-6 h-6 mr-2" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative w-12 h-12">
                  <Image 
                    src="/nisab-logo.png" 
                    alt="Nisab Wallet" 
                    width={48} 
                    height={48}
                    className="object-contain filter brightness-0 invert"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Nisab Wallet</h3>
                  <p className="text-sm text-gray-400">Islamic Finance Simplified</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                The most comprehensive Islamic finance management platform. Track income, 
                expenses, calculate Zakat, and gain complete insights into your financial health.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-11 h-11 bg-gray-800 hover:bg-[#1e3a5f] rounded-xl flex items-center justify-center transition-all transform hover:scale-110 duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-11 h-11 bg-gray-800 hover:bg-[#1e3a5f] rounded-xl flex items-center justify-center transition-all transform hover:scale-110 duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="w-11 h-11 bg-gray-800 hover:bg-[#1e3a5f] rounded-xl flex items-center justify-center transition-all transform hover:scale-110 duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-black text-lg mb-4">Product</h4>
              <div className="space-y-3">
                <a href="#features" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform duration-300">Features</a>
                <a href="#pricing" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform duration-300">Pricing</a>
                <a href="#testimonials" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform duration-300">Testimonials</a>
                <a href="/register" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform duration-300">Get Started</a>
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-black text-lg mb-4">Support</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform duration-300">Help Center</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform duration-300">Privacy Policy</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform duration-300">Terms of Service</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform duration-300">Contact Us</a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Nisab Wallet. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              Built with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> for the Muslim Ummah
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(-10px) translateX(-10px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes progress {
          from { width: 0%; }
          to { width: 68%; }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out both;
        }
        
        .animate-fadeInLeft {
          animation: fadeInLeft 0.8s ease-out both;
        }
        
        .animate-fadeInRight {
          animation: fadeInRight 0.8s ease-out both;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out both;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out both;
        }
        
        .animate-progress {
          animation: progress 2s ease-out both;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
