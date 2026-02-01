// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  CheckCircle2, Star, ShieldCheck, Wallet, BarChart3, 
  LockKey, Smartphone, UsersThree, ArrowRight, Check, Sparkles, 
  Globe, Trophy, Heart, Menu, X 
} from 'lucide-react';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Subscription Plans
      setLoadingPlans(true);
      const planResult = await getSubscriptionPlans(true);
      if (planResult.success) setPlans(planResult.plans);
      setLoadingPlans(false);

      // Featured Testimonials / Feedback
      setLoadingTestimonials(true);
      try {
        let featured = [];
        const usersSnap = await getDocs(collection(db, 'users'));

        for (const userDoc of usersSnap.docs) {
          const feedbackRef = collection(db, 'users', userDoc.id, 'feedback');
          const q = query(
            feedbackRef, 
            where('featured', '==', true),
            orderBy('featuredAt', 'desc')
          );
          const snap = await getDocs(q);
          snap.forEach(doc => {
            const data = doc.data();
            featured.push({
              id: `\( {userDoc.id}- \){doc.id}`,
              rating: data.rating || 5,
              message: data.message || '',
              userName: data.userName || 'Anonymous',
              role: data.userRole || 'User'
            });
          });
        }

        featured.sort((a,b) => (b.featuredAt?.toDate?.() || new Date(0)) - (a.featuredAt?.toDate?.() || new Date(0)));
        setTestimonials(featured.slice(0, 6) || fallbackTestimonials);
      } catch (err) {
        console.error('Failed to load testimonials:', err);
        setTestimonials(fallbackTestimonials);
      } finally {
        setLoadingTestimonials(false);
      }
    };

    fetchData();
  }, []);

  const fallbackTestimonials = [
    { id:1, rating:5, message:"Accurate zakat calculation saved me from mistakes last Ramadan. Clean and trustworthy.", userName:"Sumaiya Akter", role:"Chartered Accountant" },
    { id:2, rating:5, message:"Finally an app that respects Islamic finance completely. Highly recommend.", userName:"Md. Arif Hossain", role:"Software Engineer" },
    { id:3, rating:5, message:"Beautiful design, real-time nisab tracking, and full privacy — 10/10.", userName:"Nusrat Jahan", role:"Business Owner" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans">

      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white py-3 text-center text-sm md:text-base font-medium tracking-wide animate-pulse-slow">
        Launch Special — 7 Days Free Trial + 35% Off First 3 Months • Limited Time Only
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-18">
            <div 
              className="flex items-center gap-3.5 cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => router.push('/')}
            >
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-md">
                <Image 
                  src="/nisab-logo.png" 
                  alt="Nisab Wallet" 
                  width={34} 
                  height={34} 
                  className="brightness-0 invert drop-shadow" 
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                Nisab Wallet
              </span>
            </div>

            <div className="hidden md:flex items-center gap-9">
              <a href="#features" className="text-slate-700 hover:text-emerald-700 font-medium transition-colors duration-300">Features</a>
              <a href="#pricing" className="text-slate-700 hover:text-emerald-700 font-medium transition-colors duration-300">Pricing</a>
              <a href="#reviews" className="text-slate-700 hover:text-emerald-700 font-medium transition-colors duration-300">Reviews</a>
              <button 
                onClick={() => router.push('/login')} 
                className="text-slate-700 hover:text-emerald-700 font-medium transition-colors duration-300"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-7 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Start Free Trial
              </button>
            </div>

            <button 
              className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t px-6 py-6 space-y-5 animate-fade-in">
            <a href="#features" className="block py-3 text-lg text-slate-700 hover:text-emerald-700 transition-colors">Features</a>
            <a href="#pricing" className="block py-3 text-lg text-slate-700 hover:text-emerald-700 transition-colors">Pricing</a>
            <a href="#reviews" className="block py-3 text-lg text-slate-700 hover:text-emerald-700 transition-colors">Reviews</a>
            <button onClick={() => router.push('/login')} className="block py-3 text-lg text-slate-700 hover:text-emerald-700 w-full text-left transition-colors">Sign In</button>
            <button 
              onClick={() => router.push('/register')} 
              className="block w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-semibold text-lg mt-3 hover:shadow-lg transition-all"
            >
              Start Free Trial
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-24 md:pt-28 md:pb-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.08)_0%,transparent_50%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <div className="space-y-9">
              <div className="inline-flex items-center gap-2.5 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 px-5 py-2 rounded-full text-sm font-semibold text-emerald-800 shadow-sm animate-pulse-slow">
                <Sparkles size={18} className="text-emerald-600" /> Halal • Secure • 12,000+ Users
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight text-slate-900">
                Islamic Finance
                <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mt-3">
                  Made Simple & Secure
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-700 leading-relaxed max-w-xl">
                Track every transaction • Monitor nisab in real time • Calculate zakat accurately • Stay 100% Shariah-compliant — with peace of mind.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 pt-6">
                <button 
                  onClick={() => router.push('/register')}
                  className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
                >
                  Start 7-Day Free Trial
                  <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={22} />
                </button>

                <button className="border-2 border-emerald-600/50 hover:border-emerald-600 hover:bg-emerald-50 text-emerald-700 px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-md">
                  See How It Works →
                </button>
              </div>

              <div className="flex items-center gap-8 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {['৳','★','৳','+'].map((s,i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-white flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {s}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-slate-900">12,000+ Muslims worldwide</div>
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Star size={16} fill="currentColor" /> 4.9 / 5.0 rating
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual - Desktop */}
            <div className="hidden lg:block relative">
              <div className="relative bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-700 rounded-3xl p-10 shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-9 space-y-7 border border-white/20">
                  <div className="flex justify-between items-start">
                    <div className="text-white">
                      <div className="text-sm opacity-80 mb-1">Total Halal Wealth</div>
                      <div className="text-4xl font-extrabold">৳ 682,450</div>
                    </div>
                    <div className="w-14 h-14 bg-white/25 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="text-white" size={32} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/12 rounded-xl p-6">
                      <div className="text-xs text-white/70 mb-1">Zakat Due</div>
                      <div className="text-2xl font-bold text-white">৳ 17,061</div>
                    </div>
                    <div className="bg-white/12 rounded-xl p-6">
                      <div className="text-xs text-white/70 mb-1">Nisab Threshold</div>
                      <div className="text-2xl font-bold text-white">৳ 504,800</div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-5 text-white text-sm font-medium border-t border-white/10 pt-4">
                    Hawl Cycle Active • 87 days remaining • Started 18 Jumada II 1447
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-float">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <LockKey className="text-emerald-700" size={24} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Security</div>
                    <div className="font-bold text-slate-900">Bank-Grade Encryption</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="py-16 bg-slate-100 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '12,000+', label: 'Active Users' },
              { num: '4.9/5',   label: 'User Rating' },
              { num: '18+',     label: 'Countries' },
              { num: '100%',    label: 'Shariah Compliant' }
            ].map((item, i) => (
              <div key={i} className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-4xl font-extrabold text-slate-900 mb-2">{item.num}</div>
                <div className="text-slate-600 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-5">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              7-day free trial • No credit card required • Cancel anytime
            </p>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center py-32">
              <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-8 md:p-10 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 ${
                    plan.isPopular 
                      ? 'border-emerald-600 bg-gradient-to-b from-white to-emerald-50/50 shadow-2xl scale-[1.04]' 
                      : 'border-slate-200 bg-white shadow-xl'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-md animate-pulse">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-2xl md:text-3xl font-bold text-center mb-4">{plan.name}</h3>

                  <div className="text-center mb-8">
                    <span className="text-5xl md:text-6xl font-black text-slate-900">৳{plan.price}</span>
                    <span className="text-slate-500 text-xl"> / month</span>
                  </div>

                  <ul className="space-y-4 mb-10 text-slate-700">
                    {plan.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="text-emerald-600 mt-1 flex-shrink-0" size={20} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => router.push('/register')}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      plan.isPopular
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl'
                        : 'bg-slate-800 text-white hover:bg-slate-900'
                    }`}
                  >
                    {plan.isPopular ? 'Start Free Trial' : 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12 text-slate-600 font-medium">
            ✓ 7 days free • No card needed • Cancel anytime • 30-day money-back guarantee
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-5">
              Built for the Ummah
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Tools that respect Islamic principles while making finance effortless and secure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {[
              { icon: Wallet,         title: "Complete Wealth Overview", desc: "All halal assets in one unified, real-time view." },
              { icon: ShieldCheck,    title: "Accurate Zakat Calculation", desc: "Live nisab values + hijri hawl tracking + auto 2.5%." },
              { icon: BarChart3,      title: "Riba-Free Insights", desc: "Clear charts, trends, and reports — no interest metrics." },
              { icon: LockKey,        title: "Bank-Level Security", desc: "End-to-end encryption & privacy-first architecture." },
              { icon: Smartphone,     title: "Mobile-First Design", desc: "Fast, beautiful experience on any device." },
              { icon: UsersThree,     title: "Trusted by Thousands", desc: "Thousands of Muslims already using Nisab daily." }
            ].map((item, i) => (
              <div 
                key={i}
                className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-7 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="text-emerald-700" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-5">
              What Muslims Are Saying
            </h2>
          </div>

          {loadingTestimonials ? (
            <div className="flex justify-center py-32">
              <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
              {testimonials.map((t) => (
                <div 
                  key={t.id}
                  className="bg-slate-50 rounded-3xl p-8 lg:p-10 border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="flex gap-1 mb-6">
                    {Array(5).fill().map((_,i) => (
                      <Star 
                        key={i} 
                        size={22} 
                        className={i < t.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} 
                      />
                    ))}
                  </div>
                  <p className="text-slate-700 text-lg leading-relaxed mb-8">"{t.message}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {t.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{t.userName}</div>
                      <div className="text-slate-500 text-sm">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 md:py-40 bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_30%_70%,white_0%,transparent_60%)]" />

        <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 leading-tight">
            Start Managing Your Wealth the Halal Way
          </h2>

          <p className="text-xl md:text-2xl text-emerald-100 mb-12 max-w-3xl mx-auto">
            Join thousands of Muslims who trust Nisab Wallet for accurate zakat, secure tracking, and complete peace of mind.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => router.push('/register')}
              className="group bg-white text-emerald-900 px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl hover:bg-emerald-50 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
            >
              Begin 7-Day Free Trial
              <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={26} />
            </button>

            <button 
              onClick={() => router.push('/login')}
              className="border-2 border-white/70 hover:bg-white/10 px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300"
            >
              Already have an account?
            </button>
          </div>

          <p className="mt-10 text-emerald-100 text-lg">
            No credit card required • Cancel anytime • Full money-back guarantee
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Image src="/nisab-logo.png" alt="" width={36} height={36} className="brightness-0 invert" />
                </div>
                <span className="text-3xl font-bold text-white">Nisab Wallet</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-8">
                Modern Islamic finance companion — accurate, secure, and built with care for the Ummah.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold text-lg mb-6">Product</h4>
              <div className="space-y-4 text-sm">
                <a href="#features" className="hover:text-white block transition-colors">Features</a>
                <a href="#pricing" className="hover:text-white block transition-colors">Pricing</a>
                <a href="#reviews" className="hover:text-white block transition-colors">Reviews</a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold text-lg mb-6">Company</h4>
              <div className="space-y-4 text-sm">
                <a href="#" className="hover:text-white block transition-colors">About</a>
                <a href="#" className="hover:text-white block transition-colors">Contact</a>
                <a href="#" className="hover:text-white block transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white block transition-colors">Terms</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-10 text-center text-sm">
            © {new Date().getFullYear()} Nisab Wallet • Serving the Ummah with integrity
          </div>
        </div>
      </footer>
    </div>
  );
}
