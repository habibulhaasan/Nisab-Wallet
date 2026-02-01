// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  CheckCircle, Star, TrendingUp, Shield, Wallet, BarChart3, 
  Smartphone, Lock, Users, ArrowRight, Menu, X, DollarSign,
  Zap, Clock, Award, Globe, Heart, RefreshCw, PieChart,
  Calculator, FileText, Bell, TrendingDown, CreditCard,
  Eye, CheckSquare, BookOpen, Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    loadPlans();
    loadFeaturedFeedback();
  }, []);

  useEffect(() => {
    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % Math.max(testimonials.length, 1));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);

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
              userName: data.userName || 'অজ্ঞাত ব্যবহারকারী',
              role: data.userRole || 'ব্যবহারকারী',
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
                userName: data.userName || 'অজ্ঞাত ব্যবহারকারী',
                role: data.userRole || 'ব্যবহারকারী',
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
        setTestimonials(allFeaturedFeedback);
      } else {
        setTestimonials([
          {
            id: 1,
            rating: 5,
            message: "এই অ্যাপটি আমার আর্থিক ব্যবস্থাপনায় বিপ্লব এনেছে। যাকাত হিসাব করার ফিচারটি অসাধারণ!",
            userName: "আহমেদ হাসান",
            role: "ব্যবসায়ী"
          },
          {
            id: 2,
            rating: 5,
            message: "সহজ, সুন্দর এবং ইসলামিক নীতিমালা অনুসরণ করে। প্রতিটি মুসলিমের জন্য অত্যন্ত প্রয়োজনীয়।",
            userName: "ফাতিমা রহমান",
            role: "শিক্ষিকা"
          },
          {
            id: 3,
            rating: 5,
            message: "বিশ্লেষণ ড্যাশবোর্ড থেকে আমার খরচের স্পষ্ট ধারণা পাই। একাধিক অ্যাকাউন্ট পরিচালনা এখন অনেক সহজ!",
            userName: "ইব্রাহিম আলী",
            role: "সফটওয়্যার ইঞ্জিনিয়ার"
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading featured feedback:', error);
      setTestimonials([
        {
          id: 1,
          rating: 5,
          message: "এই অ্যাপটি আমার আর্থিক ব্যবস্থাপনায় বিপ্লব এনেছে। যাকাত হিসাব করার ফিচারটি অসাধারণ!",
          userName: "আহমেদ হাসান",
          role: "ব্যবসায়ী"
        },
        {
          id: 2,
          rating: 5,
          message: "সহজ, সুন্দর এবং ইসলামিক নীতিমালা অনুসরণ করে। প্রতিটি মুসলিমের জন্য অত্যন্ত প্রয়োজনীয়।",
          userName: "ফাতিমা রহমান",
          role: "শিক্ষিকা"
        },
        {
          id: 3,
          rating: 5,
          message: "বিশ্লেষণ ড্যাশবোর্ড থেকে আমার খরচের স্পষ্ট ধারণা পাই। একাধিক অ্যাকাউন্ট পরিচালনা এখন অনেক সহজ!",
          userName: "ইব্রাহিম আলী",
          role: "সফটওয়্যার ইঞ্জিনিয়ার"
        }
      ]);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  const features = [
    {
      icon: <Wallet />,
      title: 'একাধিক অ্যাকাউন্ট',
      description: 'ক্যাশ, বিকাশ, নগদ, ব্যাংক - সব একসাথে',
      gradient: 'from-emerald-400 to-teal-500'
    },
    {
      icon: <Calculator />,
      title: 'স্বয়ংক্রিয় যাকাত হিসাব',
      description: 'ইসলামিক নীতিমালা অনুযায়ী সঠিক যাকাত',
      gradient: 'from-violet-400 to-purple-500'
    },
    {
      icon: <PieChart />,
      title: 'আয়-ব্যয়ের হিসাব',
      description: 'প্রতিটি লেনদেনের সম্পূর্ণ রেকর্ড',
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      icon: <BarChart3 />,
      title: 'বিশদ রিপোর্ট',
      description: 'গ্রাফ ও চার্টসহ আর্থিক বিশ্লেষণ',
      gradient: 'from-orange-400 to-red-500'
    },
    {
      icon: <Shield />,
      title: 'নিরাপদ ও সুরক্ষিত',
      description: 'আপনার তথ্য সম্পূর্ণ এনক্রিপ্টেড',
      gradient: 'from-rose-400 to-pink-500'
    },
    {
      icon: <Smartphone />,
      title: 'যেকোনো ডিভাইসে',
      description: 'মোবাইল, ট্যাবলেট, কম্পিউটার সর্বত্র',
      gradient: 'from-indigo-400 to-blue-500'
    }
  ];

  const highlights = [
    { icon: <CheckSquare />, text: 'কোনো ক্রেডিট কার্ড প্রয়োজন নেই' },
    { icon: <Clock />, text: '৫ দিনের ফ্রি ট্রায়াল' },
    { icon: <RefreshCw />, text: 'যেকোনো সময় বাতিল করুন' },
    { icon: <Shield />, text: '১০০% নিরাপদ ও সুরক্ষিত' }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Custom Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Hind Siliguri', sans-serif;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(139, 92, 246, 0.3); }
          50% { border-color: rgba(139, 92, 246, 0.8); }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-slideDown {
          animation: slideDown 0.6s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }
        
        .animate-scaleUp {
          animation: scaleUp 0.6s ease-out forwards;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
        
        .gradient-animate {
          background-size: 200% 200%;
          animation: gradient-shift 5s ease infinite;
        }
        
        .text-shadow-lg {
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }
      `}</style>

      {/* Top Bar */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white py-2 px-4 text-center text-sm font-medium">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>বিশেষ অফার: প্রথম মাস ৫০% ছাড়! সীমিত সময়ের জন্য</span>
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-30"></div>
                <div className="relative bg-gradient-to-br from-violet-500 to-fuchsia-600 p-2.5 rounded-2xl shadow-lg">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  নিসাব ওয়ালেট
                </h1>
                <p className="text-xs text-gray-500 font-medium -mt-1">ইসলামিক ফাইন্যান্স ম্যানেজার</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-violet-600 font-medium transition-colors">ফিচার</a>
              <a href="#pricing" className="text-gray-700 hover:text-violet-600 font-medium transition-colors">প্রাইসিং</a>
              <a href="#testimonials" className="text-gray-700 hover:text-violet-600 font-medium transition-colors">রিভিউ</a>
              <button
                onClick={() => router.push('/login')}
                className="text-gray-700 hover:text-violet-600 font-medium transition-colors"
              >
                লগইন
              </button>
              <button
                onClick={() => router.push('/register')}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                শুরু করুন
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-6 space-y-4 animate-slideDown">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 hover:text-violet-600 font-medium">ফিচার</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 hover:text-violet-600 font-medium">প্রাইসিং</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 hover:text-violet-600 font-medium">রিভিউ</a>
              <button onClick={() => { setMobileMenuOpen(false); router.push('/login'); }} className="block w-full text-left py-2 text-gray-700 hover:text-violet-600 font-medium">লগইন</button>
              <button onClick={() => { setMobileMenuOpen(false); router.push('/register'); }} className="block w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold shadow-lg">শুরু করুন</button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-violet-50 via-fuchsia-50 to-purple-50">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left animate-slideUp">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md mb-6 border border-violet-100">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700">১০০০+ সন্তুষ্ট ব্যবহারকারী</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight text-shadow-lg">
                আপনার সম্পদ পরিচালনা করুন
                <span className="block mt-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                  ইসলামিক পদ্ধতিতে
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                আয়-ব্যয়ের হিসাব, স্বয়ংক্রিয় যাকাত গণনা এবং সম্পূর্ণ আর্থিক বিশ্লেষণ—সবকিছু ইসলামিক নীতিমালা অনুসরণ করে।
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => router.push('/register')}
                  className="group px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>৫ দিন ফ্রি ট্রায়াল শুরু করুন</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white text-violet-600 border-2 border-violet-600 rounded-xl font-bold text-lg hover:bg-violet-50 transition-all"
                >
                  আরো জানুন
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {highlights.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Stats Card */}
            <div className="relative animate-slideUp" style={{animationDelay: '200ms'}}>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg animate-float">
                  <div className="text-center">
                    <div className="text-2xl font-bold">৯৯.৯%</div>
                    <div className="text-xs">আপটাইম</div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-6">আমাদের পরিসংখ্যান</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center text-white">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">১০০০+</div>
                        <div className="text-sm text-gray-600">সক্রিয় ব্যবহারকারী</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">৫০,০০০+</div>
                        <div className="text-sm text-gray-600">লেনদেন ট্র্যাক করা হয়েছে</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white">
                        <Star className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">৪.৯/৫</div>
                        <div className="text-sm text-gray-600">গড় রেটিং</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-5 py-2 bg-violet-100 text-violet-700 rounded-full font-semibold mb-4 text-sm">
              ✨ শক্তিশালী ফিচার
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              সবকিছু এক জায়গায়
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              ইসলামিক আর্থিক ব্যবস্থাপনার জন্য প্রয়োজনীয় সকল সুবিধা
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100 hover:border-violet-300 card-hover"
                style={{
                  animation: 'slideUp 0.8s ease-out forwards',
                  animationDelay: `${index * 100}ms`,
                  opacity: 0
                }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-5 py-2 bg-fuchsia-100 text-fuchsia-700 rounded-full font-semibold mb-4 text-sm">
              💎 সহজ মূল্য
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              আপনার জন্য উপযুক্ত প্ল্যান বেছে নিন
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              স্বচ্ছ মূল্য নির্ধারণ। সব প্ল্যানে সব ফিচার অন্তর্ভুক্ত।
            </p>
          </div>

          {subscriptionPlans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subscriptionPlans.map((plan, index) => (
                <div 
                  key={plan.id}
                  className="relative bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-200 hover:border-violet-400 card-hover overflow-hidden"
                  style={{
                    animation: 'scaleUp 0.6s ease-out forwards',
                    animationDelay: `${index * 100}ms`,
                    opacity: 0
                  }}
                >
                  {index === 1 && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-1 rounded-bl-2xl text-sm font-bold">
                      জনপ্রিয়
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-extrabold text-gray-900">৳{plan.price}</span>
                      <span className="text-gray-600">/{plan.duration}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{plan.durationDays} দিনের সম্পূর্ণ এক্সেস</p>
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => router.push('/register')}
                    className={`w-full py-4 rounded-xl font-bold transition-all hover:scale-105 ${
                      index === 1
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    শুরু করুন
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                <p className="text-gray-600 font-medium">প্ল্যান লোড হচ্ছে...</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-5 py-2 bg-orange-100 text-orange-700 rounded-full font-semibold mb-4 text-sm">
              ⭐ ব্যবহারকারীদের মতামত
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              ব্যবহারকারীরা যা বলছেন
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              হাজারো সন্তুষ্ট ব্যবহারকারীদের মতামত
            </p>
          </div>

          {loadingTestimonials ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                <p className="text-gray-600 font-medium">মতামত লোড হচ্ছে...</p>
              </div>
            </div>
          ) : testimonials.length > 0 ? (
            <>
              {/* Featured Testimonial */}
              <div className="max-w-4xl mx-auto mb-12">
                <div className="relative bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -ml-32 -mb-32"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    <p className="text-2xl md:text-3xl font-medium mb-8 leading-relaxed">
                      "{testimonials[currentTestimonial]?.message}"
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-violet-600 font-bold text-2xl shadow-lg">
                        {testimonials[currentTestimonial]?.userName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xl">{testimonials[currentTestimonial]?.userName}</div>
                        <div className="text-violet-200">{testimonials[currentTestimonial]?.role}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonial Dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        currentTestimonial === index 
                          ? 'bg-violet-600 w-8' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* All Testimonials Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {testimonials.slice(0, 6).map((testimonial, index) => (
                  <div 
                    key={testimonial.id}
                    className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-violet-300 card-hover"
                    style={{
                      animation: 'slideUp 0.8s ease-out forwards',
                      animationDelay: `${index * 100}ms`,
                      opacity: 0
                    }}
                  >
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    
                    <p className="text-gray-700 mb-6 text-sm leading-relaxed italic">
                      "{testimonial.message}"
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {testimonial.userName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{testimonial.userName}</div>
                        <div className="text-xs text-gray-500">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-600"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
            আজই শুরু করুন আপনার
            <br />
            আর্থিক যাত্রা
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-violet-100">
            হাজারো মুসলিম ব্যবহারকারী ইতিমধ্যে তাদের সম্পদ পরিচালনা করছেন ইসলামিক পদ্ধতিতে
          </p>
          
          <button
            onClick={() => router.push('/register')}
            className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-violet-600 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
          >
            <span>৫ দিনের ফ্রি ট্রায়াল শুরু করুন</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>

          <p className="text-violet-100 mt-6 text-lg">
            কোনো ক্রেডিট কার্ড প্রয়োজন নেই • সম্পূর্ণ এক্সেস • যেকোনো সময় বাতিল করুন
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-2.5 rounded-2xl">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">নিসাব ওয়ালেট</h3>
                  <p className="text-sm text-gray-400">ইসলামিক ফাইন্যান্স ম্যানেজার</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                ইসলামিক আর্থিক ব্যবস্থাপনার সবচেয়ে সম্পূর্ণ প্ল্যাটফর্ম। আয়-ব্যয় ট্র্যাক করুন, যাকাত হিসাব করুন এবং আপনার আর্থিক স্বাস্থ্যের সম্পূর্ণ অন্তর্দৃষ্টি পান।
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">দ্রুত লিংক</h4>
              <div className="space-y-3">
                <a href="#features" className="block text-gray-400 hover:text-white transition-colors">ফিচার</a>
                <a href="#pricing" className="block text-gray-400 hover:text-white transition-colors">প্রাইসিং</a>
                <a href="#testimonials" className="block text-gray-400 hover:text-white transition-colors">রিভিউ</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">আইনি</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">গোপনীয়তা নীতি</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">সেবার শর্তাবলী</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">যোগাযোগ</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} নিসাব ওয়ালেট। সর্বস্বত্ব সংরক্ষিত।
            </p>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              মুসলিম উম্মাহর জন্য <Heart className="w-4 h-4 text-red-500" /> দিয়ে তৈরি
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}