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
  Smartphone, Lock, Users, ArrowRight, Menu, X,
  Zap, Award, Globe, Heart, Check, Eye, Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadPlans();
    loadFeaturedFeedback();
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

  const featureTabs = [
    { id: 'tracking', name: 'Transaction Tracking', icon: <TrendingUp className="w-5 h-5" />, title: 'Track Every Penny', description: 'Never lose sight of your money. Our intelligent tracking system automatically categorizes your transactions and gives you real-time insights into your spending patterns.', features: ['Automatic categorization', 'Real-time updates', 'Custom tags and notes', 'Recurring transaction detection'], image: '💰' },
    { id: 'zakat', name: 'Zakat Calculator', icon: <Shield className="w-5 h-5" />, title: 'Zakat Made Simple', description: 'Calculate your Zakat obligations accurately based on authentic Islamic methodology. Our system tracks your assets throughout the year and notifies you when Zakat is due.', features: ['Nisab threshold monitoring', 'Lunar year tracking', 'Multiple asset types support', 'Automatic calculations'], image: '🕌' },
    { id: 'analytics', name: 'Analytics Dashboard', icon: <BarChart3 className="w-5 h-5" />, title: 'Insights That Matter', description: 'Visualize your financial health with beautiful charts and detailed reports. Understand where your money goes and make informed decisions.', features: ['Interactive charts', 'Monthly/yearly comparisons', 'Category breakdowns', 'Export to PDF/Excel'], image: '📊' },
    { id: 'accounts', name: 'Multi-Account', icon: <Wallet className="w-5 h-5" />, title: 'All Accounts, One Place', description: 'Manage cash, bank accounts, mobile wallets, and credit cards seamlessly. Transfer between accounts and see your complete financial picture.', features: ['Unlimited accounts', 'Inter-account transfers', 'Balance synchronization', 'Account-wise analytics'], image: '👛' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-2 px-4 text-center text-sm font-medium">
        🎉 Limited Time Offer: Get 5 Days Free Trial - No Credit Card Required
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-1.5">
                <Image src="/nisab-logo.png" alt="Nisab Wallet" width={32} height={32} className="object-contain filter brightness-0 invert" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Nisab Wallet</h1>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-slate-700 hover:text-emerald-600 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-slate-700 hover:text-emerald-600 font-medium transition-colors">Pricing</a>
              <a href="#reviews" className="text-slate-700 hover:text-emerald-600 font-medium transition-colors">Reviews</a>
              <button onClick={() => router.push('/login')} className="text-slate-700 hover:text-emerald-600 font-medium transition-colors">Login</button>
              <button onClick={() => router.push('/register')} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2 rounded-lg font-semibold hover:shadow-lg transition-all">Get Started Free</button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-slate-700 hover:text-emerald-600 font-medium py-2">Features</a>
              <a href="#pricing" className="block text-slate-700 hover:text-emerald-600 font-medium py-2">Pricing</a>
              <a href="#reviews" className="block text-slate-700 hover:text-emerald-600 font-medium py-2">Reviews</a>
              <button onClick={() => router.push('/login')} className="block w-full text-left text-slate-700 hover:text-emerald-600 font-medium py-2">Login</button>
              <button onClick={() => router.push('/register')} className="block w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 rounded-lg font-semibold">Get Started Free</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Halal • Secure • Trusted by 10,000+ Users</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-black leading-tight text-slate-900">
                Islamic Finance
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
                  Simplified & Secure
                </span>
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed">
                Track income, manage expenses, calculate Zakat automatically, and gain complete 
                control over your finances—all in accordance with Islamic principles.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => router.push('/register')} className="group bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center">
                  Start Free Trial
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-lg font-bold text-lg border-2 border-slate-300 text-slate-700 hover:border-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center">
                  <Eye className="mr-2" size={20} />
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-white flex items-center justify-center text-white font-bold text-sm">
                        {String.fromCharCode(65 + i - 1)}
                      </div>
                    ))}
                  </div>
                  <div className="ml-3 text-sm text-slate-600">
                    <div className="font-bold text-slate-900">10,000+ Users</div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                      <span className="font-semibold">4.9/5</span> Rating
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-white">
                      <div className="text-sm opacity-80">Total Balance</div>
                      <div className="text-3xl font-bold">৳ 45,280</div>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: 'Salary Received', amount: '+৳ 50,000', icon: '💼', color: 'emerald' },
                      { name: 'Grocery Shopping', amount: '-৳ 2,450', icon: '🛒', color: 'red' },
                      { name: 'Utility Bills', amount: '-৳ 1,820', icon: '⚡', color: 'orange' }
                    ].map((txn, i) => (
                      <div key={i} className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center text-xl">{txn.icon}</div>
                          <div className="text-white">
                            <div className="font-semibold text-sm">{txn.name}</div>
                            <div className="text-xs opacity-80">Today, 10:30 AM</div>
                          </div>
                        </div>
                        <div className={`font-bold ${txn.amount.startsWith('+') ? 'text-emerald-300' : 'text-red-300'}`}>{txn.amount}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white text-sm font-semibold flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Zakat Due
                      </div>
                      <div className="text-white font-bold">৳ 1,132</div>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-yellow-300 h-2 rounded-full" style={{width: '68%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 animate-bounce">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Halal Certified</div>
                    <div className="text-sm font-bold text-slate-900">100%</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4" style={{animation: 'bounce 2s infinite', animationDelay: '0.5s'}}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Bank-Level</div>
                    <div className="text-sm font-bold text-slate-900">Security</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Users className="w-8 h-8" />, stat: '10,000+', label: 'Happy Users' },
              { icon: <BarChart3 className="w-8 h-8" />, stat: '500K+', label: 'Transactions' },
              { icon: <Globe className="w-8 h-8" />, stat: '15+', label: 'Countries' },
              { icon: <Award className="w-8 h-8" />, stat: '4.9★', label: 'User Rating' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white mb-3">{item.icon}</div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{item.stat}</div>
                <div className="text-sm text-slate-600">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Powerful Features for Modern Muslims</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Everything you need to manage your finances the halal way</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {featureTabs.map((tab, index) => (
              <button key={tab.id} onClick={() => setActiveTab(index)} className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === index ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-7xl mb-6">{featureTabs[activeTab].image}</div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">{featureTabs[activeTab].title}</h3>
                <p className="text-lg text-slate-700 mb-8">{featureTabs[activeTab].description}</p>
                <ul className="space-y-4">
                  {featureTabs[activeTab].features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-slate-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 border-4 border-slate-200">
                  <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-6xl">{featureTabs[activeTab].image}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Why Muslims Choose Nisab Wallet</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">Built specifically for the Muslim community with features that matter</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Shield className="w-12 h-12" />, title: 'Shariah Compliant', description: 'Every feature is designed to align with Islamic financial principles. No interest, no haram transactions.', gradient: 'from-emerald-500 to-teal-600' },
              { icon: <Lock className="w-12 h-12" />, title: 'Privacy First', description: 'Your financial data is encrypted and secure. We never share or sell your information to third parties.', gradient: 'from-blue-500 to-cyan-600' },
              { icon: <Zap className="w-12 h-12" />, title: 'Easy to Use', description: 'Intuitive interface designed for everyone. Start tracking your finances in under 2 minutes.', gradient: 'from-purple-500 to-pink-600' }
            ].map((item, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-8 hover:bg-slate-700 transition-all">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-2xl mb-6`}>{item.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Choose Your Plan</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Flexible pricing that grows with you. Try free for 5 days.</p>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className={`relative rounded-3xl p-8 ${plan.isPopular ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-2xl transform scale-105' : 'bg-white border-2 border-slate-200'}`}>
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">⭐ POPULAR</span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className={`text-2xl font-bold mb-2 ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                    <div className="flex items-baseline justify-center mb-4">
                      <span className={`text-5xl font-black ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>৳{plan.price}</span>
                      <span className={`ml-2 ${plan.isPopular ? 'text-emerald-100' : 'text-slate-600'}`}>/month</span>
                    </div>
                    <p className={plan.isPopular ? 'text-emerald-100' : 'text-slate-600'}>{plan.description}</p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${plan.isPopular ? 'text-emerald-200' : 'text-emerald-600'}`} />
                        <span className={plan.isPopular ? 'text-white' : 'text-slate-700'}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => router.push('/register')} className={`w-full py-4 rounded-xl font-bold transition-all ${plan.isPopular ? 'bg-white text-emerald-600 hover:bg-emerald-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12 space-y-4">
            <p className="text-slate-600 font-medium">✓ 5-day free trial on all plans • ✓ No credit card required • ✓ Cancel anytime</p>
            <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-3 rounded-full">
              <Award className="w-5 h-5" />
              <span className="font-semibold">30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-slate-600">Join thousands of satisfied users worldwide</p>
          </div>

          {loadingTestimonials ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-slate-100">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={20} className={`${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                    ))}
                  </div>

                  <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.message}"</p>

                  <div className="flex items-center border-t border-slate-100 pt-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {testimonial.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{testimonial.userName}</div>
                      <div className="text-sm text-slate-600">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Start Managing Your Finances Today</h2>
          <p className="text-xl text-emerald-100 mb-10">Join 10,000+ Muslims who trust Nisab Wallet for their financial management</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push('/register')} className="group bg-white text-emerald-600 px-10 py-5 rounded-xl font-bold text-xl shadow-2xl hover:bg-emerald-50 transition-all inline-flex items-center justify-center">
              Start Your Free Trial
              <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" />
            </button>
            <button onClick={() => router.push('/login')} className="border-2 border-white text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-white/10 transition-all">Sign In</button>
          </div>

          <p className="text-emerald-100 mt-8 text-lg">No credit card required • 5-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-1.5">
                  <Image src="/nisab-logo.png" alt="Nisab Wallet" width={32} height={32} className="object-contain filter brightness-0 invert" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Nisab Wallet</h3>
                  <p className="text-sm text-slate-400">Islamic Finance Simplified</p>
                </div>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed">The most trusted Islamic finance management platform for Muslims worldwide. Manage your wealth the halal way.</p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Product</h4>
              <div className="space-y-3">
                <a href="#features" className="block text-slate-400 hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="block text-slate-400 hover:text-white transition-colors">Pricing</a>
                <a href="#reviews" className="block text-slate-400 hover:text-white transition-colors">Reviews</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Support</h4>
              <div className="space-y-3">
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">Help Center</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">Contact Us</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">© {new Date().getFullYear()} Nisab Wallet. All rights reserved.</p>
            <p className="text-sm text-slate-400 flex items-center gap-2">Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for the Ummah</p>
          </div>
        </div>
      </footer>
    </div>
  );
}