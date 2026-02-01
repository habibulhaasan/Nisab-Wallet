// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  CheckCircle, Star, TrendingUp, Shield, Wallet, BarChart3, 
  Smartphone, Lock, Users, ArrowRight, Menu, X, DollarSign,
  Zap, Clock, Award, Globe, Heart, RefreshCw
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    loadPlans();
    loadFeaturedFeedback();
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);
    
    return () => clearInterval(interval);
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
              userId: userDoc.id,
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

      allFeaturedFeedback.sort((a, b) => {
        const dateA = a.featuredAt?.toDate?.() || new Date(0);
        const dateB = b.featuredAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      if (allFeaturedFeedback.length > 0) {
        setTestimonials(allFeaturedFeedback.slice(0, 6));
      } else {
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
      icon: <Wallet className="w-8 h-8" />,
      title: 'Multi-Account Management',
      description: 'Manage Cash, Bank, bKash, and mobile wallets seamlessly',
      color: 'from-blue-500 to-cyan-500',
      delay: '0ms'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Smart Transaction Tracking',
      description: 'Categorize and analyze every income and expense',
      color: 'from-green-500 to-emerald-500',
      delay: '100ms'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Automated Zakat Calculation',
      description: 'Calculate Zakat accurately based on Islamic principles',
      color: 'from-purple-500 to-pink-500',
      delay: '200ms'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Advanced Analytics',
      description: 'Visual insights and comprehensive financial reports',
      color: 'from-orange-500 to-red-500',
      delay: '300ms'
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Bank-Grade Security',
      description: 'Military-grade encryption keeps your data safe',
      color: 'from-red-500 to-rose-500',
      delay: '400ms'
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Works Everywhere',
      description: 'Responsive design for desktop, tablet, and mobile',
      color: 'from-indigo-500 to-blue-500',
      delay: '500ms'
    }
  ];

  const benefits = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Optimized performance for instant access'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Save Time',
      description: 'Automate your financial tracking'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Award Winning',
      description: 'Trusted by thousands of users'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Cloud Synced',
      description: 'Access from anywhere, anytime'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
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
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.8s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.6s ease-out forwards;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .shimmer-effect {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .feature-card-active {
          transform: scale(1.05);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 w-full glass-effect z-50 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3 animate-slideInLeft">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Nisab Wallet
                </h1>
                <p className="text-xs text-gray-500 font-medium">Islamic Finance Simplified</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8 animate-slideInRight">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-all font-medium hover:scale-105 transform">
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-all font-medium hover:scale-105 transform">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-all font-medium hover:scale-105 transform">
                Reviews
              </a>
              <button
                onClick={() => router.push('/login')}
                className="text-gray-700 hover:text-blue-600 transition-all font-medium hover:scale-105 transform"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/register')}
                className="relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover:-translate-y-0.5 overflow-hidden group"
              >
                <span className="relative z-10">Start Free Trial</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-6 space-y-4 animate-fadeInUp">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              >
                Pricing
              </a>
              <a 
                href="#testimonials" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              >
                Reviews
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/login');
                }}
                className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/register');
                }}
                className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                Start Free Trial
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="mb-8 animate-fadeInUp">
              <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 rounded-full text-sm font-semibold shadow-sm">
                <Heart className="w-4 h-4" />
                Trusted by 1000+ Muslim Users
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 leading-tight animate-fadeInUp" style={{animationDelay: '100ms'}}>
              Manage Your Wealth
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                The Islamic Way
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fadeInUp" style={{animationDelay: '200ms'}}>
              Complete financial management platform with automated Zakat calculation, multi-account tracking, and powerful analytics—all aligned with Islamic principles.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fadeInUp" style={{animationDelay: '300ms'}}>
              <button
                onClick={() => router.push('/register')}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Start 5-Day Free Trial
                  <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={22} />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              <button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-2xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 hover:shadow-lg transition-all transform hover:scale-105"
              >
                See How It Works
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-gray-600 animate-fadeInUp" style={{animationDelay: '400ms'}}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">5-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Cancel Anytime</span>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-fadeInUp" style={{animationDelay: '500ms'}}>
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover:-translate-y-1 border border-gray-100"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-3 text-blue-600">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              ⚡ Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Everything You Need to
              <br />
              <span className="gradient-text">Master Your Finances</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for Islamic financial management with cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`group relative bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden ${
                  activeFeature === index ? 'feature-card-active' : ''
                }`}
                style={{
                  animation: `fadeInUp 0.8s ease-out forwards`,
                  animationDelay: feature.delay,
                  opacity: 0
                }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Bottom Accent */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        {/* Animated Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '1000+', label: 'Active Users', icon: <Users className="w-8 h-8" /> },
              { value: '50K+', label: 'Transactions', icon: <RefreshCw className="w-8 h-8" /> },
              { value: '99.9%', label: 'Uptime', icon: <Zap className="w-8 h-8" /> },
              { value: '4.9/5', label: 'User Rating', icon: <Star className="w-8 h-8" /> }
            ].map((stat, index) => (
              <div 
                key={index}
                className="text-white animate-scaleIn"
                style={{animationDelay: `${index * 100}ms`, opacity: 0}}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 animate-float" style={{animationDelay: `${index * 0.5}s`}}>
                  {stat.icon}
                </div>
                <div className="text-5xl font-extrabold mb-2 bg-white bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-blue-100 font-medium text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              💎 Simple Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Choose Your Perfect Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transparent pricing with all features included. Start with a 5-day free trial.
            </p>
          </div>

          {subscriptionPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {subscriptionPlans.map((plan, index) => (
                <div 
                  key={plan.id}
                  className="group relative bg-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-gray-200 hover:border-blue-500 overflow-hidden"
                  style={{
                    animation: `scaleIn 0.6s ease-out forwards`,
                    animationDelay: `${index * 100}ms`,
                    opacity: 0
                  }}
                >
                  {/* Popular Badge */}
                  {index === 1 && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-bl-2xl text-sm font-bold">
                      Most Popular
                    </div>
                  )}

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-extrabold text-gray-900">৳{plan.price}</span>
                      <span className="text-gray-600 ml-2">/{plan.duration}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{plan.durationDays} days full access</p>
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={() => router.push('/register')}
                    className={`w-full px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 ${
                      index === 1
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Get Started
                  </button>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 -top-full group-hover:top-full transition-all duration-1000 bg-gradient-to-b from-white/0 via-white/30 to-white/0 pointer-events-none"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 font-medium">Loading pricing plans...</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
              ⭐ User Reviews
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Loved by Thousands
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our users have to say about managing their finances the Islamic way
            </p>
          </div>

          {loadingTestimonials ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 font-medium">Loading testimonials...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id}
                  className="group bg-gradient-to-br from-white to-slate-50 border-2 border-gray-200 rounded-3xl p-8 hover:shadow-2xl hover:border-blue-300 transition-all duration-500 transform hover:-translate-y-2"
                  style={{
                    animation: `fadeInUp 0.8s ease-out forwards`,
                    animationDelay: `${index * 100}ms`,
                    opacity: 0
                  }}
                >
                  {/* Stars */}
                  <div className="flex items-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${
                          i < testimonial.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        } transition-all group-hover:scale-110`}
                        style={{transitionDelay: `${i * 50}ms`}}
                      />
                    ))}
                  </div>

                  {/* Message */}
                  <p className="text-gray-700 mb-8 italic leading-relaxed text-lg">
                    "{testimonial.message}"
                  </p>

                  {/* User Info */}
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg group-hover:scale-110 transition-transform">
                      {testimonial.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{testimonial.userName}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>

                  {/* Quote Icon */}
                  <div className="absolute top-6 right-6 text-blue-100 opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="absolute top-0 left-0 w-full h-full animate-float opacity-30">
            <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-full h-full animate-float opacity-30" style={{animationDelay: '1s'}}>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="animate-fadeInUp">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Ready to Transform Your
              <br />
              Financial Journey?
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed">
              Join thousands of users managing their wealth according to Islamic principles
            </p>
            
            <button
              onClick={() => router.push('/register')}
              className="group relative inline-flex items-center px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Start Your 5-Day Free Trial
                <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" size={24} />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <p className="text-blue-100 mt-6 text-lg">
              No credit card required • Full access • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Nisab Wallet</h3>
                  <p className="text-sm text-gray-400">Islamic Finance Simplified</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                The most comprehensive Islamic finance management platform. Track income, expenses, calculate Zakat, and gain complete insights into your financial health.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all transform hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-400 rounded-lg flex items-center justify-center transition-all transform hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <div className="space-y-3">
                <a href="#features" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform">Features</a>
                <a href="#pricing" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform">Pricing</a>
                <a href="#testimonials" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform">Testimonials</a>
                <a href="/register" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform">Get Started</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform">Privacy Policy</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform">Terms of Service</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform">Contact Us</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform">Support</a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Nisab Wallet. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              Built with <Heart className="w-4 h-4 text-red-500" /> for the Muslim Ummah
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
