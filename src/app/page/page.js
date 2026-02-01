// src/app/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { 
  CheckCircle2, Star, ShieldCheck, Wallet, BarChart3, 
  Smartphone, LockKey, UsersThree, ArrowRight, 
  Check, Sparkles, Globe, Trophy, Heart 
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  useEffect(() => {
    loadPlans();
    loadFeaturedTestimonials();
  }, []);

  const loadPlans = async () => {
    setLoadingPlans(true);
    const result = await getSubscriptionPlans(true);
    if (result.success) setSubscriptionPlans(result.plans);
    setLoadingPlans(false);
  };

  const loadFeaturedTestimonials = async () => {
    setLoadingTestimonials(true);
    try {
      let allFeatured = [];
      const usersSnap = await getDocs(collection(db, 'users'));

      for (const userDoc of usersSnap.docs) {
        const feedbackRef = collection(db, 'users', userDoc.id, 'feedback');
        const q = query(feedbackRef, where('featured', '==', true), orderBy('featuredAt', 'desc'));
        const snap = await getDocs(q);
        snap.forEach(doc => {
          const data = doc.data();
          allFeatured.push({
            id: `\( {userDoc.id}- \){doc.id}`,
            rating: data.rating || 5,
            message: data.message || '',
            userName: data.userName || 'Anonymous',
            role: data.userRole || 'User'
          });
        });
      }

      allFeatured.sort((a,b) => (b.featuredAt?.toDate?.() || new Date(0)) - (a.featuredAt?.toDate?.() || new Date(0)));
      setTestimonials(allFeatured.slice(0, 6) || fallbackTestimonials);
    } catch (err) {
      console.error(err);
      setTestimonials(fallbackTestimonials);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  const fallbackTestimonials = [
    { id:1, rating:5, message:"Finally an app that respects Islamic finance rules. Zakat calculation is accurate and easy.", userName:"Rahim Khan", role:"Entrepreneur" },
    { id:2, rating:5, message:"Best financial tracker I've used as a Muslim. Clean, secure, and halal-focused.", userName:"Ayesha Siddiqua", role:"Doctor" },
    { id:3, rating:5, message:"The nisab tracking saved me from miscalculating zakat last year. Highly recommend.", userName:"Omar Faruq", role:"Banker" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Announcement Bar */}
      <div className="bg-emerald-700 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        Launch Offer — 5 Days Free + First Month 40% Off • Limited Spots
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <Image src="/nisab-logo.png" alt="Nisab" width={28} height={28} className="brightness-0 invert" />
              </div>
              <span className="text-xl font-semibold text-slate-900">Nisab Wallet</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-700 hover:text-emerald-700 font-medium transition-colors">Features</a>
              <a href="#pricing"  className="text-slate-700 hover:text-emerald-700 font-medium transition-colors">Pricing</a>
              <a href="#reviews"  className="text-slate-700 hover:text-emerald-700 font-medium transition-colors">Reviews</a>
              <button onClick={() => router.push('/login')} className="text-slate-700 hover:text-emerald-700 font-medium">Sign in</button>
              <button 
                onClick={() => router.push('/register')} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors shadow-sm"
              >
                Get Started
              </button>
            </div>

            <button 
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t px-5 py-5 space-y-4">
            <a href="#features" className="block py-2.5 text-slate-700 hover:text-emerald-700">Features</a>
            <a href="#pricing"  className="block py-2.5 text-slate-700 hover:text-emerald-700">Pricing</a>
            <a href="#reviews"  className="block py-2.5 text-slate-700 hover:text-emerald-700">Reviews</a>
            <button onClick={() => router.push('/login')} className="block py-2.5 text-slate-700 hover:text-emerald-700 w-full text-left">Sign in</button>
            <button onClick={() => router.push('/register')} className="block w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold">Get Started</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                <Sparkles size={16} /> Halal • Secure • Used by 10,000+
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                Modern Islamic
                <span className="block text-emerald-600">Wealth Management</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl">
                Track your finances, monitor nisab in real-time, calculate zakat accurately, and stay Shariah-compliant — all in one secure place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => router.push('/register')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  Start Free Trial
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border-2 border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all">
                  See how it works →
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['A','B','C','D'].map(l => (
                      <div key={l} className="w-9 h-9 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                        {l}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="font-semibold">10,000+ Muslims</div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" /> 4.9 rating
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero mockup - simplified & cleaner */}
            <div className="relative hidden lg:block">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-7 space-y-5">
                  <div className="flex justify-between items-center">
                    <div className="text-white">
                      <div className="text-sm opacity-80">Net Worth</div>
                      <div className="text-3xl font-bold">৳ 487,200</div>
                    </div>
                    <ShieldCheck className="text-white" size={40} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/15 rounded-xl p-4">
                      <div className="text-xs text-white/80">Zakat Due</div>
                      <div className="text-xl font-bold text-white">৳ 12,180</div>
                    </div>
                    <div className="bg-white/15 rounded-xl p-4">
                      <div className="text-xs text-white/80">Nisab (Silver)</div>
                      <div className="text-xl font-bold text-white">৳ 504,000</div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4 text-white text-sm">
                    Monitoring since: 14 Rajab 1447 • 108 days remaining
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <LockKey className="text-emerald-700" size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Protected by</div>
                    <div className="font-semibold">Bank-grade encryption</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-12 bg-slate-100 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '10,000+', label: 'Active Users' },
              { num: '4.9/5',   label: 'Average Rating' },
              { num: '15+',     label: 'Countries' },
              { num: '100%',    label: 'Shariah Compliant' }
            ].map(item => (
              <div key={item.label}>
                <div className="text-3xl font-bold text-slate-900">{item.num}</div>
                <div className="text-sm text-slate-600 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - moved up because you're selling subscriptions */}
      <section id="pricing" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900">Simple, Fair Pricing</h2>
            <p className="text-xl text-slate-600 mt-4">Start free. Upgrade when you're ready. Cancel anytime.</p>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center py-20"><div className="animate-spin h-12 w-12 border-4 border-emerald-600 rounded-full border-t-transparent"></div></div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {subscriptionPlans.map(plan => (
                <div 
                  key={plan.id}
                  className={`relative rounded-2xl p-8 border ${
                    plan.isPopular 
                      ? 'border-emerald-600 shadow-2xl scale-105 bg-gradient-to-b from-white to-emerald-50/40' 
                      : 'border-slate-200 bg-white shadow-lg'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-5 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
                  <div className="text-center mb-6">
                    <span className="text-5xl font-black text-slate-900">৳{plan.price}</span>
                    <span className="text-slate-500"> / month</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features?.map((f,i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="text-emerald-600 mt-1 flex-shrink-0" size={18} />
                        <span className="text-slate-700">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => router.push('/register')}
                    className={`w-full py-4 rounded-xl font-semibold transition-colors ${
                      plan.isPopular 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-slate-800 text-white hover:bg-slate-900'
                    }`}
                  >
                    {plan.isPopular ? 'Start Free Trial' : 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12 text-slate-600">
            ✓ 5-day free trial • No card required • Cancel anytime • 30-day money-back guarantee
          </div>
        </div>
      </section>

      {/* Features - condensed */}
      <section id="features" className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900">Everything You Need for Halal Finance</h2>
            <p className="text-xl text-slate-600 mt-4 max-w-3xl mx-auto">Purpose-built tools that respect Islamic principles and make wealth management effortless.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Wallet,         title: "Complete Wealth Overview", desc: "All accounts, assets and liabilities — one unified halal view." },
              { icon: ShieldCheck,    title: "Accurate Zakat Engine",   desc: "Real-time nisab tracking, hijri hawl monitoring, automatic 2.5% calculation." },
              { icon: BarChart3,      title: "Clear Financial Insights", desc: "Beautiful charts, category analysis, trend reports — riba-free." },
              { icon: LockKey,        title: "Bank-Grade Security",     desc: "End-to-end encryption, secure auth, privacy-first architecture." },
              { icon: Smartphone,     title: "Mobile First Experience", desc: "Fast, responsive design — manage finances anywhere." },
              { icon: UsersThree,     title: "Trusted by Thousands",    desc: "10,000+ Muslims worldwide already managing wealth the right way." }
            ].map((item,i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                  <item.icon className="text-emerald-700" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900">Real Stories from Real Users</h2>
          </div>

          {loadingTestimonials ? (
            <div className="flex justify-center py-20"><div className="animate-spin h-12 w-12 border-4 border-emerald-600 rounded-full border-t-transparent"></div></div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map(t => (
                <div key={t.id} className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                  <div className="flex gap-1 mb-5">
                    {Array(5).fill().map((_,i) => (
                      <Star key={i} size={20} className={i < t.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-6">"{t.message}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {t.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{t.userName}</div>
                      <div className="text-sm text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Take Control of Your Halal Wealth Today</h2>
          <p className="text-xl text-emerald-100 mb-10">Start your 5-day free trial. No credit card needed. Cancel anytime.</p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <button 
              onClick={() => router.push('/register')}
              className="bg-white text-emerald-800 px-10 py-5 rounded-xl font-bold text-xl shadow-2xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-3"
            >
              Begin Free Trial
              <ArrowRight size={24} />
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="border-2 border-white/70 hover:bg-white/10 px-10 py-5 rounded-xl font-bold text-xl transition-all"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
                  <Image src="/nisab-logo.png" alt="" width={28} height={28} className="brightness-0 invert" />
                </div>
                <span className="text-2xl font-bold text-white">Nisab Wallet</span>
              </div>
              <p className="text-slate-400 mb-6">Purpose-built Islamic finance companion — helping Muslims manage wealth with clarity, confidence and compliance.</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-3 text-sm">
                <a href="#features" className="hover:text-white block">Features</a>
                <a href="#pricing" className="hover:text-white block">Pricing</a>
                <a href="#reviews" className="hover:text-white block">Testimonials</a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <div className="space-y-3 text-sm">
                <a href="#" className="hover:text-white block">About</a>
                <a href="#" className="hover:text-white block">Contact</a>
                <a href="#" className="hover:text-white block">Privacy Policy</a>
                <a href="#" className="hover:text-white block">Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-16 pt-10 text-center text-sm">
            © {new Date().getFullYear()} Nisab Wallet. Built with care for the Ummah.
          </div>
        </div>
      </footer>
    </div>
  );
}