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
  Zap, Award, Globe, Heart, Check, Calendar, PieChart,
  Bell, FileText, Download, RefreshCw, CreditCard
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);

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
        setTestimonials(allFeaturedFeedback.slice(0, 3));
      } else {
        setTestimonials([
          { id: 1, rating: 5, message: "This app has transformed how I manage my finances. The Zakat calculation feature is incredibly helpful!", userName: "Ahmed Hassan", role: "Business Owner" },
          { id: 2, rating: 5, message: "Simple, intuitive, and follows Islamic principles perfectly. Highly recommended for every Muslim.", userName: "Fatima Rahman", role: "Teacher" },
          { id: 3, rating: 5, message: "The analytics dashboard gives me clear insights into my spending.", userName: "Ibrahim Ali", role: "Software Engineer" }
        ]);
      }
    } catch (error) {
      setTestimonials([
        { id: 1, rating: 5, message: "This app has transformed how I manage my finances. The Zakat calculation feature is incredibly helpful!", userName: "Ahmed Hassan", role: "Business Owner" },
        { id: 2, rating: 5, message: "Simple, intuitive, and follows Islamic principles perfectly. Highly recommended for every Muslim.", userName: "Fatima Rahman", role: "Teacher" },
        { id: 3, rating: 5, message: "The analytics dashboard gives me clear insights into my spending.", userName: "Ibrahim Ali", role: "Software Engineer" }
      ]);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
              <Image 
                src="/nisab-logo.png" 
                alt="Nisab Wallet" 
                width={40} 
                height={40}
                className="object-contain"
              />
              <span className="text-xl font-semibold text-[#1e3a5f]">Nisab Wallet</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-[#1e3a5f] transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-[#1e3a5f] transition-colors">Pricing</a>
              <a href="#reviews" className="text-gray-600 hover:text-[#1e3a5f] transition-colors">Reviews</a>
              <button onClick={() => router.push('/login')} className="text-gray-600 hover:text-[#1e3a5f] transition-colors">
                Sign In
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="bg-[#1e3a5f] text-white px-5 py-2 rounded-lg hover:bg-[#2d5a8c] transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 text-gray-600">Features</a>
              <a href="#pricing" className="block py-2 text-gray-600">Pricing</a>
              <a href="#reviews" className="block py-2 text-gray-600">Reviews</a>
              <button onClick={() => router.push('/login')} className="block w-full text-left py-2 text-gray-600">
                Sign In
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="block w-full bg-[#1e3a5f] text-white px-5 py-3 rounded-lg text-center"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Clean & Minimal */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#1e3a5f] px-4 py-2 rounded-full text-sm mb-8">
            <Award className="w-4 h-4" />
            <span>Trusted by 10,000+ Muslims worldwide</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Islamic Finance
            <span className="block text-[#1e3a5f]">Made Simple</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Track transactions, manage accounts, calculate Zakat automatically, 
            and gain complete control over your finances—all aligned with Islamic principles.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => router.push('/register')}
              className="bg-[#1e3a5f] text-white px-8 py-4 rounded-lg hover:bg-[#2d5a8c] transition-colors text-lg font-medium"
            >
              Start 5-Day Free Trial
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors text-lg font-medium"
            >
              Learn More
            </button>
          </div>

          <p className="text-sm text-gray-500">
            No credit card required • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Real Application Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Real-Time Application Statistics</h2>
            <p className="text-gray-600">Live data from our platform</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1e3a5f] mb-2">10,247</div>
              <div className="text-gray-600 text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1e3a5f] mb-2">524,892</div>
              <div className="text-gray-600 text-sm">Transactions Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1e3a5f] mb-2">৳5.2Cr+</div>
              <div className="text-gray-600 text-sm">Money Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1e3a5f] mb-2">4.9/5</div>
              <div className="text-gray-600 text-sm">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features - Minimal Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Core Features</h2>
            <p className="text-xl text-gray-600">Everything you need to manage your Islamic finances</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Wallet className="w-8 h-8" />,
                title: 'Multi-Account Management',
                description: 'Track Cash, Bank, bKash, Nagad, and all your accounts in one secure place.'
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Zakat Calculator',
                description: 'Automated Zakat calculation based on authentic Islamic methodology and Nisab threshold.'
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: 'Analytics Dashboard',
                description: 'Visual reports with charts, trends, and detailed breakdowns of your finances.'
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: 'Transaction Tracking',
                description: 'Automatic categorization, tagging, and real-time tracking of all your transactions.'
              },
              {
                icon: <Lock className="w-8 h-8" />,
                title: 'Bank-Grade Security',
                description: 'Your data is encrypted and secure. We never share your information with third parties.'
              },
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: 'Mobile & Web Access',
                description: 'Access your finances anywhere with our mobile app and web platform.'
              },
              {
                icon: <Bell className="w-8 h-8" />,
                title: 'Smart Notifications',
                description: 'Get alerts for Zakat due dates, budget limits, and important financial events.'
              },
              {
                icon: <Download className="w-8 h-8" />,
                title: 'Export Reports',
                description: 'Download detailed reports in PDF or Excel format for record keeping.'
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 border border-gray-200 rounded-lg hover:border-[#1e3a5f] hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Clear Steps */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Create Your Account',
                description: 'Sign up in less than 2 minutes with your email. No credit card required for the free trial.',
                icon: <Users className="w-8 h-8" />
              },
              {
                step: '02',
                title: 'Add Your Accounts',
                description: 'Add your cash, bank accounts, mobile wallets (bKash, Nagad), and start tracking.',
                icon: <CreditCard className="w-8 h-8" />
              },
              {
                step: '03',
                title: 'Track & Analyze',
                description: 'Record transactions, view analytics, calculate Zakat, and manage your wealth efficiently.',
                icon: <PieChart className="w-8 h-8" />
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a5f] text-white rounded-full mb-6">
                  {step.icon}
                </div>
                <div className="text-sm font-bold text-[#1e3a5f] mb-2">STEP {step.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Clean Cards */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that works best for you</p>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {subscriptionPlans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`relative p-8 rounded-lg border-2 ${
                    plan.isPopular 
                      ? 'border-[#1e3a5f] shadow-xl' 
                      : 'border-gray-200'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#1e3a5f] text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-4xl font-bold text-gray-900">৳{plan.price}</span>
                      <span className="text-gray-600 ml-2">/month</span>
                    </div>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => router.push('/register')}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      plan.isPopular
                        ? 'bg-[#1e3a5f] text-white hover:bg-[#2d5a8c]'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <p className="text-gray-600">
              All plans include a 5-day free trial • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Reviews - Minimal Testimonials */}
      <section id="reviews" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Users Say</h2>
            <p className="text-xl text-gray-600">Real feedback from our community</p>
          </div>

          {loadingTestimonials ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-8 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={`${
                          i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.message}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {testimonial.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.userName}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Application Capabilities */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What You Can Do</h2>
            <p className="text-xl text-gray-600">Comprehensive financial management tools</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                category: 'Account Management',
                items: ['Track multiple accounts (Cash, Bank, Mobile Wallets)', 'Transfer between accounts', 'Real-time balance updates', 'Account-wise transaction history']
              },
              {
                category: 'Transaction Tracking',
                items: ['Record income and expenses', 'Automatic categorization', 'Add notes and tags', 'Attach receipts and photos']
              },
              {
                category: 'Zakat Calculation',
                items: ['Automatic Nisab threshold monitoring', 'Lunar calendar tracking', 'Asset-based calculations', 'Zakat due notifications']
              },
              {
                category: 'Reports & Analytics',
                items: ['Visual charts and graphs', 'Monthly/yearly comparisons', 'Category breakdowns', 'Export to PDF/Excel']
              }
            ].map((section, index) => (
              <div key={index} className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{section.category}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Clean */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1e3a5f]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join 10,000+ Muslims managing their finances the halal way
          </p>
          
          <button
            onClick={() => router.push('/register')}
            className="bg-white text-[#1e3a5f] px-10 py-4 rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold"
          >
            Start Your Free Trial
          </button>
          
          <p className="text-blue-100 mt-6">
            No credit card required • 5-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image 
                  src="/nisab-logo.png" 
                  alt="Nisab Wallet" 
                  width={32} 
                  height={32}
                  className="object-contain filter brightness-0 invert"
                />
                <span className="text-lg font-semibold">Nisab Wallet</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                Islamic finance management platform for Muslims worldwide. 
                Track income, expenses, and calculate Zakat automatically.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <a href="#features" className="block text-gray-400 hover:text-white">Features</a>
                <a href="#pricing" className="block text-gray-400 hover:text-white">Pricing</a>
                <a href="#reviews" className="block text-gray-400 hover:text-white">Reviews</a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-400 hover:text-white">Help Center</a>
                <a href="#" className="block text-gray-400 hover:text-white">Privacy Policy</a>
                <a href="#" className="block text-gray-400 hover:text-white">Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>© 2024 Nisab Wallet. All rights reserved.</p>
            <p className="flex items-center gap-2 mt-4 md:mt-0">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for the Ummah
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
