// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Star, ShieldCheck, Wallet, BarChart3, 
  LockKey, Smartphone, UsersThree, ArrowRight, Check, Sparkles, 
  Globe, Trophy, Heart, Menu, X 
} from 'lucide-react';
import Image from 'next/image';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Plans
      setLoadingPlans(true);
      const planResult = await getSubscriptionPlans(true);
      if (planResult.success) setPlans(planResult.plans);
      setLoadingPlans(false);

      // Testimonials (featured feedback)
      setLoadingTestimonials(true);
      try {
        let featured = [];
        const usersSnap = await getDocs(collection(db, 'users'));

        for (const userDoc of usersSnap.docs) {
          const feedbackRef = collection(db, 'users', userDoc.id, 'feedback');
          const q = query(feedbackRef, where('featured', '==', true), orderBy('featuredAt', 'desc'));
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
        setTestimonials(featured.slice(0, 6) || fallback);
      } catch (err) {
        console.error(err);
        setTestimonials(fallback);
      } finally {
        setLoadingTestimonials(false);
      }
    };

    fetchData();
  }, []);

  const fallback = [
    { id:1, rating:5, message:"Accurate zakat calculation and beautiful interface. Finally an app made for Muslims.", userName:"Sumaiya Akter", role:"Chartered Accountant" },
    { id:2, rating:5, message:"Helped me track nisab properly for the first time. Very clean and trustworthy.", userName:"Md. Arif Hossain", role:"Software Developer" },
    { id:3, rating:5, message:"Best financial companion — no riba, full transparency, excellent support.", userName:"Nusrat Jahan", role:"Entrepreneur" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-x-hidden">

      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white py-3 text-center text-sm md:text-base font-medium tracking-wide">
        <span className="inline-block animate-pulse">Limited Launch Offer:</span> 7 Days Free Trial + 35% Off First 3 Months
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-18">
            <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => router.push('/')}>
              <div className="relative w-11 h-11 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                <Image src="/nisab-logo.png" alt="Nisab Wallet" width={34} height={34} className="brightness-0 invert drop-shadow-md" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Nisab</span>
            </div>

            <div className="hidden md:flex items-center gap-9">
              <a href="#features" className="text-slate-700 hover:text-emerald-700 font-medium transition-colors duration-300">Features</a>
              <a href="#pricing"  className="text-slate-700 hover:text-emerald-700 font-medium transition-colors duration-300">Pricing</a>
              <a href="#reviews"  className="text-slate-700 hover:text-emerald-700 font-medium transition-colors duration-300">Reviews</a>
              <button onClick={() => router.push('/login')} className="text-slate-700 hover:text-emerald-700 font-medium transition-colors duration-300">Sign In</button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-7 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Free Trial
              </motion.button>
            </div>

            <button className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t overflow-hidden"
            >
              <div className="px-6 py-6 space-y-5">
                <a href="#features" className="block py-3 text-lg text-slate-700 hover:text-emerald-700">Features</a>
                <a href="#pricing"  className="block py-3 text-lg text-slate-700 hover:text-emerald-700">Pricing</a>
                <a href="#reviews"  className="block py-3 text-lg text-slate-700 hover:text-emerald-700">Reviews</a>
                <button onClick={() => router.push('/login')} className="block py-3 text-lg text-slate-700 hover:text-emerald-700 w-full text-left">Sign In</button>
                <button onClick={() => router.push('/register')} className="block w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-semibold text-lg mt-4">Start Free Trial</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-24 md:pt-28 md:pb-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-teal-50/30 to-cyan-50/20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center"
          >
            <motion.div variants={fadeInUp} className="space-y-9">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-sm border border-emerald-200 px-5 py-2 rounded-full text-sm font-semibold text-emerald-800 shadow-sm"
              >
                <Sparkles size={18} className="text-emerald-600" /> Trusted Halal Finance App — 12,000+ Users
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight text-slate-900">
                Wealth Management
                <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mt-2">Done the Right Way</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-700 leading-relaxed max-w-xl">
                Real-time nisab tracking • Accurate zakat calculation • Shariah-compliant budgeting • Bank-grade security — built exclusively for Muslims.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 pt-6">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 20px 40px -10px rgba(5, 150, 105, 0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/register')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3 group"
                >
                  Begin Free Trial
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" size={22} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  className="border-2 border-emerald-600/40 hover:border-emerald-600 text-emerald-700 px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300"
                >
                  Watch 60s Demo
                </motion.button>
              </div>

              <motion.div variants={fadeInUp} className="flex items-center gap-8 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {['+', '৳', '★', '৳'].map((s,i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-white flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {s}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-slate-900">12,000+ Muslims</div>
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Star size={16} fill="currentColor" /> 4.9 / 5.0
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero visual - desktop only */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.9 }}
              className="hidden lg:block relative"
            >
              <div className="relative bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-700 rounded-3xl p-9 shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-8 space-y-6 border border-white/20">
                  <div className="flex justify-between items-start">
                    <div className="text-white">
                      <div className="text-sm opacity-80 mb-1">Total Halal Wealth</div>
                      <div className="text-4xl font-extrabold">৳ 682,450</div>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="text-white" size={32} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="bg-white/10 rounded-xl p-5">
                      <div className="text-xs text-white/70 mb-1">Zakat Payable</div>
                      <div className="text-2xl font-bold text-white">৳ 17,061</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-5">
                      <div className="text-xs text-white/70 mb-1">Current Nisab</div>
                      <div className="text-2xl font-bold text-white">৳ 504,800</div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-5 text-white text-sm font-medium border-t border-white/10 pt-4">
                    Active Hawl Cycle • Ends in 87 days • Started 18 Jumada II 1447
                  </div>
                </div>
              </div>

              <motion.div 
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute -bottom-8 -right-8 bg-white rounded-2xl shadow-2xl p-6 border border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <LockKey className="text-emerald-700" size={24} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Security</div>
                    <div className="font-bold text-slate-900">End-to-End Encrypted</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section - placed high because it's sales focused */}
      <section id="pricing" className="py-24 md:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16 md:mb-20"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-5">
              Choose Your Perfect Plan
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600 max-w-3xl mx-auto">
              Start free for 7 days. Upgrade when ready. Cancel anytime — no questions asked.
            </motion.p>
          </motion.div>

          {loadingPlans ? (
            <div className="flex justify-center py-32">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto"
            >
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  variants={fadeInUp}
                  whileHover={{ y: -12, transition: { duration: 0.4 } }}
                  className={`relative rounded-3xl p-8 md:p-10 border-2 ${
                    plan.isPopular 
                      ? 'border-emerald-600 bg-gradient-to-b from-white to-emerald-50/60 shadow-2xl' 
                      : 'border-slate-200 bg-white shadow-xl'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-md animate-pulse">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-2xl md:text-3xl font-bold text-center mb-3">{plan.name}</h3>

                  <div className="text-center mb-8">
                    <span className="text-5xl md:text-6xl font-black text-slate-900">৳{plan.price}</span>
                    <span className="text-slate-500 text-xl"> / mo</span>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700">
                        <Check className="text-emerald-600 mt-1 flex-shrink-0" size={20} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/register')}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      plan.isPopular
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'
                        : 'bg-slate-800 text-white hover:bg-slate-900'
                    }`}
                  >
                    {plan.isPopular ? 'Start 7-Day Free Trial' : 'Get Started'}
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-12 text-slate-600 font-medium"
          >
            ✓ 7-day free trial • No credit card needed • Cancel anytime • 30-day money-back guarantee
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16 md:mb-20"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-5">
              Built for Muslims, by Muslims
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600 max-w-3xl mx-auto">
              Every feature designed with Shariah compliance, privacy, and ease of use in mind.
            </motion.p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
          >
            {[
              { icon: Wallet,         title: "Unified Wealth View", desc: "See all halal assets — cash, savings, gold, investments — in one secure place." },
              { icon: ShieldCheck,    title: "Precision Zakat Engine", desc: "Live nisab values, hijri hawl tracking, automatic 2.5% calculation." },
              { icon: BarChart3,      title: "Riba-Free Analytics", desc: "Beautiful visualizations, spending patterns, net worth trends — no interest metrics." },
              { icon: LockKey,        title: "Maximum Privacy", desc: "End-to-end encryption, zero data selling, local-first design philosophy." },
              { icon: Smartphone,     title: "Seamless Mobile", desc: "Fast, responsive experience — manage finances from anywhere." },
              { icon: UsersThree,     title: "Community Trusted", desc: "Thousands of Muslims already relying on Nisab Wallet daily." }
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.12)" }}
                className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-400 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-7 group-hover:scale-110 transition-transform duration-400">
                  <item.icon className="text-emerald-700" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-24 md:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16 md:mb-20"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-5">
              Loved by the Ummah
            </motion.h2>
          </motion.div>

          {loadingTestimonials ? (
            <div className="flex justify-center py-32">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8 lg:gap-10"
            >
              {testimonials.map((t) => (
                <motion.div
                  key={t.id}
                  variants={fadeInUp}
                  className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-400"
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
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 md:py-40 bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
        </div>

        <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 leading-tight"
          >
            Take Control of Your Halal Wealth — Today
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl md:text-2xl text-emerald-100 mb-12 max-w-3xl mx-auto"
          >
            Join thousands who already trust Nisab Wallet for accurate zakat, secure tracking, and peace of mind.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push('/register')}
              className="bg-white text-emerald-900 px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              Start 7-Day Free Trial
              <ArrowRight size={26} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              className="border-2 border-white/70 hover:bg-white/10 px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300"
              onClick={() => router.push('/login')}
            >
              Already have an account?
            </motion.button>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-10 text-emerald-100 text-lg"
          >
            No credit card required • Cancel anytime • Full money-back guarantee
          </motion.p>
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
                The modern, secure, and fully Shariah-compliant way to manage your finances. Built with love for the Ummah.
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
                <a href="#" className="hover:text-white block transition-colors">About Us</a>
                <a href="#" className="hover:text-white block transition-colors">Contact</a>
                <a href="#" className="hover:text-white block transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white block transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-10 text-center text-sm">
            © {new Date().getFullYear()} Nisab Wallet • Made with care in the spirit of service to the Ummah
          </div>
        </div>
      </footer>
    </div>
  );
}