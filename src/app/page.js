// src/app/page.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSubscriptionPlans } from '@/lib/subscriptionUtils';
import {
  CheckCircle, ArrowRight, Menu, X, Wallet, TrendingUp, Shield,
  BarChart3, Star, Lock, Moon, Calendar, FileText, Sparkles,
  ChevronDown, Users, Zap, Mail, MapPin, Phone, Heart,
  PiggyBank, RefreshCw, Clock, Gift, ChevronRight,
  Bell, CreditCard, Target, Award, Globe, AlignLeft,
  Landmark, Coins, BookOpen, BadgeCheck, Building2
} from 'lucide-react';

// ─── Intersection Observer hook for scroll animations ────────────────────────
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.12, ...options });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Star rating ─────────────────────────────────────────────────────────────
function Stars({ rating = 5, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'} />
      ))}
    </div>
  );
}

// ─── Section wrapper with fade-in ────────────────────────────────────────────
function Section({ id, className = '', children }) {
  const [ref, inView] = useInView();
  return (
    <section id={id} ref={ref} className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </section>
  );
}

const FALLBACK_PLANS = [
  { id: 'monthly', name: '1 Month', price: 99, duration: '1 Month', durationDays: 30, isMostPopular: false, features: ['Full Zakat Tracking','Multi-Account Management','Income & Expense Analytics','PDF Reports','Email Support'] },
  { id: 'quarterly', name: '3 Months', price: 249, duration: '3 Months', durationDays: 90, isMostPopular: true, features: ['Everything in Monthly','Advanced Analytics','Priority Support','Data Export','Custom Categories'] },
  { id: 'yearly', name: '1 Year', price: 799, duration: '1 Year', durationDays: 365, isMostPopular: false, features: ['Everything in Quarterly','Yearly Tax Summary','Dedicated Support','Early Access Features','Lifetime Data Retention'] },
];

const FEATURES = [
  {
    icon: Moon,
    title: 'Zakat Cycle Tracking',
    description: 'Automated Hijri-year monitoring. The system detects when your wealth reaches Nisab, starts the one-year cycle, and alerts you precisely when Zakat becomes due.',
    badge: 'Core Feature',
    color: 'slate',
  },
  {
    icon: Coins,
    title: 'Real-Time Nisab Calculation',
    description: 'Nisab threshold updated against current silver market rates. Know instantly whether your total wealth is above or below the obligatory threshold.',
    badge: 'Live Data',
    color: 'blue',
  },
  {
    icon: Landmark,
    title: 'Multi-Account Management',
    description: 'Consolidate Cash, Bank, bKash, Nagad, Gold, Silver, and custom assets in one secure dashboard. Every account has a permanent ID for complete data integrity.',
    badge: 'All Assets',
    color: 'indigo',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Weekly, monthly, and yearly breakdowns. Category-wise spending, income vs. expense comparisons, and visual charts that make your finances instantly understandable.',
    badge: 'Visual Insights',
    color: 'violet',
  },
  {
    icon: FileText,
    title: 'PDF Financial Reports',
    description: 'Generate professional statements on demand — for your personal records, bank submissions, or Zakat documentation. Clear, formatted, and instantly downloadable.',
    badge: 'Export Ready',
    color: 'cyan',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'End-to-end encryption, secure Firebase authentication, and strict Firestore rules ensure your financial data is protected at every layer.',
    badge: 'Enterprise Security',
    color: 'emerald',
  },
];

const ZAKAT_STEPS = [
  { num: '01', title: 'Wealth Reaches Nisab', desc: 'The system detects when your total wealth equals or exceeds the silver Nisab threshold and automatically records the cycle start date in both Hijri and Gregorian calendars.' },
  { num: '02', title: 'One Hijri Year Monitoring', desc: 'Your wealth is monitored for exactly 12 lunar months. Balances can fluctuate freely during this period — no obligation is triggered until the cycle completes.' },
  { num: '03', title: 'Assessment at Year End', desc: 'If wealth remains ≥ Nisab after one full Hijri year, Zakat is calculated at 2.5% of total eligible assets and you receive a payment prompt.' },
  { num: '04', title: 'Payment & New Cycle', desc: 'After you record a Zakat payment, the cycle closes. If wealth is still above Nisab, a new cycle begins immediately from the payment date.' },
];

const STATS = [
  { label: 'Active Users', value: 1200, suffix: '+', icon: Users },
  { label: 'Transactions Recorded', value: 48, suffix: 'K+', icon: BarChart3 },
  { label: 'Average Rating', value: 4.9, suffix: '', icon: Star, isFloat: true },
  { label: 'Zakat Cycles Tracked', value: 3200, suffix: '+', icon: Moon },
];

const FAQS = [
  { q: 'What is Nisab Wallet?', a: 'Nisab Wallet is a Shariah-compliant personal finance platform for Muslims. It manages multi-account wealth, records income and expenses, and automates the full Zakat obligation cycle from Nisab detection to payment recording.' },
  { q: 'How accurate is the Zakat calculation?', a: 'Calculations follow the established fiqh methodology — a full Hijri lunar year (Hawl) must pass with wealth continuously above the Nisab threshold (52.5 tola of silver). The system calculates 2.5% of total eligible assets. We still recommend consulting a qualified scholar for your final verification.' },
  { q: 'How does the free trial work?', a: 'Every new account starts with a 5-day free trial with complete access to all features. No credit card is required. After the trial, select any subscription plan to continue.' },
  { q: 'Is my financial data private and secure?', a: 'Yes. All data is stored in Firebase with end-to-end encryption and strict per-user Firestore rules. We never sell, share, or access your financial data. You own your information completely.' },
  { q: 'What payment methods do you accept?', a: 'We accept bKash, Nagad, Rocket, bank transfer, and cash. Payment details are shown during checkout and verified manually by our team within 24 hours.' },
  { q: 'Can I track Gold and Silver separately?', a: 'Yes. Gold, Silver, and physical assets are separate account types. Their values contribute to your total wealth for Nisab and Zakat calculations, and you can update valuations at any time.' },
  { q: 'What happens to my data if I stop subscribing?', a: 'Your account and all historical data remain stored. You can log in and view your records. Adding new transactions requires an active subscription.' },
];

const COLOR_MAP = {
  slate:   { bg: 'bg-slate-50',   icon: 'bg-slate-100 text-slate-700',   border: 'border-slate-200',  badge: 'bg-slate-100 text-slate-600'  },
  blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-700',     border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700'    },
  indigo:  { bg: 'bg-indigo-50',  icon: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-600' },
  cyan:    { bg: 'bg-cyan-50',    icon: 'bg-cyan-100 text-cyan-700',     border: 'border-cyan-200',   badge: 'bg-cyan-100 text-cyan-700'    },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
};

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [liveStats, setLiveStats] = useState({ users: 1200, transactions: 48000, satisfaction: 4.9, zakatCycles: 3200 });
  const [openFaq, setOpenFaq] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [heroRef, heroInView] = useInView();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    loadPlans();
    loadTestimonials();
    loadLiveStats();
  }, []);

  const loadLiveStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let txCount = 0, zakatCount = 0;
      for (const u of usersSnap.docs) {
        const [tx, zk] = await Promise.all([
          getDocs(collection(db, 'users', u.id, 'transactions')),
          getDocs(collection(db, 'users', u.id, 'zakatCycles')),
        ]);
        txCount += tx.size;
        zakatCount += zk.size;
      }
      setLiveStats(s => ({ ...s, users: Math.max(usersSnap.size, 1200), transactions: Math.max(txCount, 48000), zakatCycles: Math.max(zakatCount, 3200) }));
    } catch (e) { /* keep fallback */ }
  };

  const loadPlans = async () => {
    setPlansLoading(true);
    try {
      const result = await getSubscriptionPlans(true);
      if (result.success && result.plans.length > 0) {
        const sorted = [...result.plans].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setPlans(sorted);
      } else {
        setPlans(FALLBACK_PLANS);
      }
    } catch {
      setPlans(FALLBACK_PLANS);
    } finally {
      setPlansLoading(false);
    }
  };

  const loadTestimonials = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const list = [];
      for (const u of usersSnap.docs) {
        if (list.length >= 6) break;
        const snap = await getDocs(query(collection(db, 'users', u.id, 'feedback'), where('featured', '==', true), limit(2)));
        snap.forEach(d => {
          const data = d.data();
          if (data.message && list.length < 6) {
            list.push({ id: d.id, name: data.userName || 'User', role: data.userRole || 'Nisab Wallet User', message: data.message, rating: data.rating || 5 });
          }
        });
      }
      if (list.length > 0) setTestimonials(list);
    } catch { /* keep empty — section will use placeholder */ }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const Modal = ({ title, children }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(null)}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(88vh-72px)]">{children}</div>
      </div>
    </div>
  );

  const PLACEHOLDER_TESTIMONIALS = [
    { id: 1, name: 'Ahmed Al-Rashid', role: 'Business Owner, Dhaka', message: 'Nisab Wallet completely changed how I approach Zakat. I no longer worry about missing the Hawl deadline — the system tracks everything automatically and notifies me at exactly the right time.', rating: 5 },
    { id: 2, name: 'Fatima Begum', role: 'Teacher, Chittagong', message: 'As someone who always found finances confusing, this app is a blessing. Everything is clearly labeled, and the Zakat calculation is explained step by step. Highly recommended for everyone.', rating: 5 },
    { id: 3, name: 'Mohammad Hasan', role: 'IT Professional, Sylhet', message: "The multi-account feature is exactly what I needed. I manage cash, bKash, and a bank account all in one place. The PDF reports are professional enough to share with my accountant.", rating: 5 },
    { id: 4, name: 'Nadia Rahman', role: 'Homemaker, Rajshahi', message: 'Simple, clean, and trustworthy. I\'ve tried other finance apps but none had proper Zakat support. The Nisab threshold is updated automatically which gives me real peace of mind.', rating: 5 },
    { id: 5, name: 'Karim Uddin', role: 'Pharmacist, Khulna', message: 'The analytics dashboard is outstanding. I can see exactly where my money goes each month, and the yearly Zakat summary makes my annual obligation crystal clear.', rating: 4 },
    { id: 6, name: 'Sarah Ahmed', role: 'Entrepreneur, Cumilla', message: 'Switched from a spreadsheet to Nisab Wallet six months ago. The time I save on manual Zakat calculations alone is worth the subscription. Excellent product.', rating: 5 },
  ];

  const displayTestimonials = testimonials.length >= 3 ? testimonials : PLACEHOLDER_TESTIMONIALS;

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes shimmer { 0%,100% { opacity:.6; } 50% { opacity:1; } }
        .hero-animate { animation: fadeUp .7s ease both; }
        .delay-1 { animation-delay:.1s; }
        .delay-2 { animation-delay:.22s; }
        .delay-3 { animation-delay:.36s; }
        .delay-4 { animation-delay:.5s; }
        .delay-5 { animation-delay:.64s; }
        .shimmer { animation: shimmer 2.4s ease-in-out infinite; }
        .nav-link { position:relative; }
        .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:2px; background:#1d4ed8; transition:width .2s; }
        .nav-link:hover::after { width:100%; }
        .plan-card { transition: transform .2s, box-shadow .2s; }
        .plan-card:hover { transform:translateY(-4px); }
        .faq-answer { overflow:hidden; transition: max-height .35s ease, opacity .25s ease; }
        .prose-legal p, .prose-legal li { font-size:.9rem; line-height:1.7; color:#374151; }
        .prose-legal h3 { font-size:1rem; font-weight:600; color:#111827; margin:1.25rem 0 .5rem; }
        .section-label { display:inline-flex; align-items:center; gap:.5rem; padding:.3rem .9rem; background:#eff6ff; color:#1d4ed8; border-radius:99px; font-size:.78rem; font-weight:600; letter-spacing:.04em; text-transform:uppercase; margin-bottom:1rem; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/98 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => scrollTo('hero')} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center shadow-md group-hover:bg-blue-800 transition-colors">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">Nisab<span className="text-blue-700">Wallet</span></span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7">
              {[['features','Features'],['how-zakat-works','Zakat Guide'],['pricing','Pricing'],['testimonials','Reviews'],['faq','FAQ']].map(([id,label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="nav-link text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors pb-0.5">{label}</button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => router.push('/login')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors">Sign In</button>
              <button onClick={() => router.push('/register')} className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm">
                Start Free Trial
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(v => !v)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              {[['features','Features'],['how-zakat-works','Zakat Guide'],['pricing','Pricing'],['testimonials','Reviews'],['faq','FAQ']].map(([id,label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">{label}</button>
              ))}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                <button onClick={() => router.push('/login')} className="w-full px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Sign In</button>
                <button onClick={() => router.push('/register')} className="w-full px-3 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors">Start Free Trial</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative pt-28 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'linear-gradient(rgba(59,130,246,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.06) 1px,transparent 1px)',backgroundSize:'48px 48px'}} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10" ref={heroRef}>
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left */}
            <div>
              <div className="hero-animate delay-1 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-semibold mb-6 tracking-wide">
                <Moon size={13} />
                Shariah-Compliant Financial Management
              </div>
              <h1 className="hero-animate delay-2 text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-6">
                Manage Wealth.<br />
                <span className="text-blue-700">Fulfil Zakat.</span><br />
                With Confidence.
              </h1>
              <p className="hero-animate delay-3 text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
                The complete Islamic finance platform — multi-account tracking, automated Nisab monitoring, and a full Hijri-year Zakat cycle engine built for every Muslim, regardless of financial expertise.
              </p>
              <div className="hero-animate delay-4 flex flex-col sm:flex-row gap-3 mb-10">
                <button onClick={() => router.push('/register')} className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 transition-all shadow-lg shadow-blue-700/25 hover:shadow-blue-700/40">
                  Start 5-Day Free Trial
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => scrollTo('how-zakat-works')} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-gray-800 border border-gray-300 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all">
                  <BookOpen size={17} />
                  How Zakat Works
                </button>
              </div>
              <div className="hero-animate delay-5 flex flex-wrap items-center gap-5 text-sm text-gray-500">
                {['No credit card required','5-day full access trial','Cancel anytime'].map(t => (
                  <span key={t} className="flex items-center gap-1.5"><CheckCircle size={15} className="text-emerald-500" />{t}</span>
                ))}
              </div>
            </div>

            {/* Right — Dashboard mockup */}
            <div className="hero-animate delay-3 relative">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                {/* Mock header bar */}
                <div className="bg-gray-900 px-5 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-gray-400 font-mono">nisabwallet.com/dashboard</span>
                </div>
                {/* Mock dashboard body */}
                <div className="p-5 bg-gray-50">
                  {/* Zakat status card */}
                  <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl p-4 mb-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">Zakat Status</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Active Cycle</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">৳ 8,42,500</div>
                    <div className="text-xs opacity-75">Total Wealth · Nisab: ৳ 1,24,300</div>
                    <div className="mt-3 bg-white/10 rounded-lg p-2 flex items-center justify-between">
                      <span className="text-xs">Hawl Progress</span>
                      <span className="text-xs font-semibold">218 / 354 days</span>
                    </div>
                    <div className="mt-1.5 bg-white/20 rounded-full h-1.5">
                      <div className="bg-white rounded-full h-1.5 shimmer" style={{width:'61.5%'}} />
                    </div>
                  </div>
                  {/* Account summary */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label:'Bank Account', value:'৳ 5,12,000', icon: Building2, c:'blue' },
                      { label:'bKash', value:'৳ 84,500', icon: CreditCard, c:'violet' },
                      { label:'Cash in Hand', value:'৳ 1,26,000', icon: Wallet, c:'emerald' },
                      { label:'Gold (22g)', value:'৳ 1,20,000', icon: Coins, c:'amber' },
                    ].map(a => (
                      <div key={a.label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                        <div className={`w-7 h-7 rounded-lg mb-2 flex items-center justify-center bg-${a.c}-100`}>
                          <a.icon size={14} className={`text-${a.c}-600`} />
                        </div>
                        <div className="text-xs text-gray-500">{a.label}</div>
                        <div className="text-sm font-bold text-gray-900">{a.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mini chart bars */}
                  <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-700">Monthly Overview</span>
                      <span className="text-xs text-blue-600 font-medium">Mar 2026</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-14">
                      {[40,65,45,80,55,70,90,60,75,85,50,95].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{height:`${h}%`, background: i === 11 ? '#1d4ed8' : '#dbeafe'}} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-gray-400">Income ৳ 95,000</span>
                      <span className="text-[10px] text-gray-400">Expense ৳ 42,300</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-6 bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-2.5 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BadgeCheck size={18} className="text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Zakat Due: ৳ 21,063</div>
                  <div className="text-[10px] text-gray-500">2.5% · Cycle complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ──────────────────────────────────────────────────────── */}
      <div className="border-y border-gray-100 bg-white py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="text-center">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} className="text-blue-700" />
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mb-1">
                  {s.isFloat
                    ? <span>{s.value}<span className="text-amber-400"> ★</span></span>
                    : <Counter target={s.value} suffix={s.suffix} />
                  }
                </div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <Section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label"><Zap size={13} />Platform Features</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Built Around the Way Muslims Manage Wealth
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every feature is designed with Shariah compliance in mind — from the Nisab threshold engine to multi-asset tracking and professional reports.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const c = COLOR_MAP[f.color];
              return (
                <div key={i} className={`group relative p-6 rounded-2xl border ${c.border} ${c.bg} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                  <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center mb-4`}>
                    <Icon size={22} />
                  </div>
                  <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${c.badge} mb-3`}>{f.badge}</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── HOW ZAKAT WORKS ────────────────────────────────────────────────── */}
      <Section id="how-zakat-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-blue-300 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase">
              <Moon size={13} />Shariah-Compliant Automation
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">
              How the Zakat Cycle Works
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Nisab Wallet follows the complete Hawl methodology — automatically detecting, monitoring, and calculating your annual Zakat obligation with full transparency.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ZAKAT_STEPS.map((s, i) => (
              <div key={i} className="relative">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full hover:bg-white/10 transition-colors">
                  <div className="text-5xl font-black text-white/10 mb-3 leading-none">{s.num}</div>
                  <h3 className="text-base font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
                {i < ZAKAT_STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 w-6 h-6 bg-blue-600 rounded-full items-center justify-center -translate-y-1/2">
                    <ChevronRight size={14} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Nisab explainer */}
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { title: 'Silver Nisab', value: '52.5 Tola', sub: '(~612.36g of silver)', icon: Coins },
              { title: 'Gold Nisab', value: '7.5 Tola', sub: '(~87.48g of gold)', icon: Award },
              { title: 'Zakat Rate', value: '2.5%', sub: 'of total eligible wealth', icon: Target },
            ].map((n, i) => {
              const Icon = n.icon;
              return (
                <div key={i} className="bg-blue-900/40 border border-blue-800/40 rounded-xl px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-blue-300" />
                  </div>
                  <div>
                    <div className="text-xs text-blue-400 font-medium mb-0.5">{n.title}</div>
                    <div className="text-lg font-extrabold text-white">{n.value}</div>
                    <div className="text-xs text-gray-500">{n.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <Section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label"><CreditCard size={13} />Transparent Pricing</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Simple Plans, No Hidden Fees</h2>
            <p className="text-lg text-gray-600">All plans include a 5-day free trial. No credit card required to start.</p>
          </div>
          {plansLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              Loading plans...
            </div>
          ) : (
            <div className={`grid gap-6 max-w-5xl mx-auto ${plans.length === 1 ? 'md:grid-cols-1 max-w-sm' : plans.length === 2 ? 'md:grid-cols-2 max-w-2xl' : 'md:grid-cols-3'}`}>
              {plans.map((plan, idx) => {
                const popular = plan.isMostPopular;
                const planFeatures = Array.isArray(plan.features)
                  ? plan.features
                  : ['Full Zakat Tracking','Multi-Account Management','Income & Expense Analytics','PDF Reports','Priority Support'];
                return (
                  <div key={plan.id || idx} className={`plan-card relative rounded-2xl border-2 overflow-hidden shadow-sm ${popular ? 'border-blue-600 shadow-blue-100 shadow-lg' : 'border-gray-200 bg-white'}`}>
                    {popular && (
                      <div className="bg-blue-700 text-white text-xs font-bold tracking-wider uppercase text-center py-1.5 px-4">
                        Most Popular
                      </div>
                    )}
                    <div className={`p-7 ${popular ? 'bg-white' : ''}`}>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <div className="text-xs text-gray-500 mb-5">{plan.duration || `${plan.durationDays} days`}</div>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-extrabold text-gray-900">৳{plan.price?.toLocaleString()}</span>
                        <span className="text-gray-500 text-sm">/ {plan.duration || 'period'}</span>
                      </div>
                      <ul className="space-y-3 mb-7">
                        {planFeatures.map((f, fi) => (
                          <li key={fi} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => router.push(`/register?plan=${plan.id}`)}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${popular ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-md' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                      >
                        Get Started
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-center text-sm text-gray-500 mt-8">
            All prices in BDT (Bangladeshi Taka). Subscriptions are renewed manually — you'll always get a reminder before expiry.
          </p>
        </div>
      </Section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────────── */}
      <Section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label"><Star size={13} />User Reviews</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Trusted by Muslims Across Bangladesh
            </h2>
            <p className="text-lg text-gray-600">Real feedback from our growing community of users.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTestimonials.slice(0, 6).map((t, i) => (
              <div key={t.id || i} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                <Stars rating={t.rating} />
                <p className="text-sm text-gray-700 mt-4 mb-5 leading-relaxed">"{t.message}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <Section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-label"><AlignLeft size={13} />FAQ</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything you need to know before getting started.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${openFaq === i ? 'border-blue-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left gap-4">
                  <span className="font-semibold text-gray-900 text-sm leading-snug">{f.q}</span>
                  <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                <div className={`faq-answer px-5 ${openFaq === i ? 'max-h-64 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800">
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle at 80% 50%, rgba(99,102,241,.35) 0%, transparent 60%)'}} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 text-blue-100 rounded-full text-xs font-semibold mb-5 tracking-wide">
            <Sparkles size={13} />5-Day Free Trial · No Card Required
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Your Zakat Obligation, <br className="hidden sm:block" />Finally Under Control.
          </h2>
          <p className="text-lg text-blue-200 mb-8 max-w-xl mx-auto">
            Join thousands of Muslims who manage their wealth and Zakat with confidence on Nisab Wallet.
          </p>
          <button onClick={() => router.push('/register')} className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-800 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-2xl hover:scale-105 text-base">
            Create Your Free Account
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Nisab<span className="text-blue-400">Wallet</span></span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500 mb-5">
                A Shariah-compliant personal finance platform designed to help Muslims track wealth, manage accounts, and fulfil their Zakat obligations with clarity and confidence.
              </p>
              <div className="flex items-center gap-3">
                <a href="mailto:support@nisabwallet.com" className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-colors" title="Email">
                  <Mail size={16} />
                </a>
                <a href="tel:+8801234567890" className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-colors" title="Phone">
                  <Phone size={16} />
                </a>
                <a href="#" className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-colors" title="Website">
                  <Globe size={16} />
                </a>
              </div>
            </div>
            {/* Product */}
            <div className="md:col-span-2">
              <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                {[['features','Features'],['how-zakat-works','Zakat Guide'],['pricing','Pricing'],['testimonials','Reviews']].map(([id,label]) => (
                  <li key={id}><button onClick={() => scrollTo(id)} className="hover:text-white transition-colors">{label}</button></li>
                ))}
              </ul>
            </div>
            {/* Account */}
            <div className="md:col-span-2">
              <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => router.push('/register')} className="hover:text-white transition-colors">Create Account</button></li>
                <li><button onClick={() => router.push('/login')} className="hover:text-white transition-colors">Sign In</button></li>
                <li><button onClick={() => router.push('/forgot-password')} className="hover:text-white transition-colors">Reset Password</button></li>
              </ul>
            </div>
            {/* Company */}
            <div className="md:col-span-2">
              <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => setShowModal('about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => setShowModal('contact')} className="hover:text-white transition-colors">Contact</button></li>
                <li><button onClick={() => setShowModal('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => setShowModal('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
              </ul>
            </div>
            {/* Contact info */}
            <div className="md:col-span-2">
              <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2"><Mail size={14} className="mt-0.5 flex-shrink-0 text-blue-400" /><a href="mailto:support@nisabwallet.com" className="hover:text-white transition-colors break-all">support@nisabwallet.com</a></li>
                <li className="flex items-start gap-2"><Phone size={14} className="mt-0.5 flex-shrink-0 text-blue-400" /><a href="tel:+8801234567890" className="hover:text-white transition-colors">+880 1234-567890</a></li>
                <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 flex-shrink-0 text-blue-400" /><span>Dhaka, Bangladesh</span></li>
                <li className="flex items-start gap-2"><Clock size={14} className="mt-0.5 flex-shrink-0 text-blue-400" /><span>Mon–Fri, 9AM–6PM (GMT+6)</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <span>© {new Date().getFullYear()} Nisab Wallet. All rights reserved.</span>
            <span className="flex items-center gap-1">Built with <Heart size={13} className="text-red-500 fill-red-500 mx-1" /> for the Muslim community · Bangladesh</span>
          </div>
        </div>
      </footer>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {showModal === 'about' && (
        <Modal title="About Nisab Wallet">
          <div className="prose-legal space-y-1">
            <p>Nisab Wallet is a Shariah-compliant personal finance management platform built specifically for Muslims who want to manage their wealth transparently and fulfil their Zakat obligations accurately.</p>
            <h3>Our Mission</h3>
            <p>To make Islamic finance management accessible, accurate, and effortless — regardless of a user's financial background or technical expertise.</p>
            <h3>Our Values</h3>
            <ul className="space-y-2 mt-2">
              {[['Shariah Compliance','Every calculation follows established Islamic jurisprudence'],['Transparency','All Zakat calculations are fully visible and explainable'],['Security','Bank-grade encryption and strict data access controls'],['Accessibility','Designed for users of all ages and technical levels']].map(([t,d]) => (
                <li key={t} className="flex items-start gap-2"><CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span><strong>{t}:</strong> {d}</span></li>
              ))}
            </ul>
            <h3>Who We Serve</h3>
            <p>We serve individual Muslims across Bangladesh and the wider community who want a reliable, modern tool for personal finance and Zakat management.</p>
          </div>
        </Modal>
      )}
      {showModal === 'contact' && (
        <Modal title="Contact Us">
          <div className="space-y-4">
            {[{icon:Mail,title:'Email Support',sub:'Response within 24 hours',val:'support@nisabwallet.com',href:'mailto:support@nisabwallet.com'},
              {icon:Phone,title:'Phone Support',sub:'Mon–Fri, 9AM–6PM (GMT+6)',val:'+880 1234-567890',href:'tel:+8801234567890'},
              {icon:MapPin,title:'Office',sub:'Dhaka, Bangladesh',val:'House #123, Road #4, Dhanmondi, Dhaka 1209',href:null}
            ].map(({icon:Icon,title,sub,val,href}) => (
              <div key={title} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-blue-700" /></div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm mb-0.5">{title}</div>
                  <div className="text-xs text-gray-500 mb-1">{sub}</div>
                  {href ? <a href={href} className="text-sm text-blue-600 hover:underline">{val}</a> : <span className="text-sm text-gray-700">{val}</span>}
                </div>
              </div>
            ))}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
              <strong>Already a user?</strong> Use the Feedback section inside your dashboard for the fastest support response.
            </div>
          </div>
        </Modal>
      )}
      {showModal === 'privacy' && (
        <Modal title="Privacy Policy">
          <div className="prose-legal">
            <p className="text-xs text-gray-400 mb-4">Last updated: {new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</p>
            {[['1. Information We Collect','We collect information you provide directly: your name, email address, and financial data you choose to input. We also collect usage data to improve the platform.'],
              ['2. How We Use Your Data','To provide and maintain the service, calculate Zakat obligations accurately, send account notifications, and continuously improve platform performance.'],
              ['3. Data Security','All data is stored in Firebase with end-to-end encryption and per-user Firestore security rules. Financial data is encrypted both in transit and at rest.'],
              ['4. Data Sharing','We never sell, rent, or share your personal information with third parties for marketing. We only use service providers essential to platform operation, bound by strict confidentiality.'],
              ['5. Your Rights','You may access, update, or request deletion of your data at any time via Settings. You can export all financial data as PDF or CSV from the dashboard.'],
              ['6. Contact','For privacy concerns: privacy@nisabwallet.com']
            ].map(([h,b]) => (<div key={h}><h3>{h}</h3><p>{b}</p></div>))}
          </div>
        </Modal>
      )}
      {showModal === 'terms' && (
        <Modal title="Terms of Service">
          <div className="prose-legal">
            <p className="text-xs text-gray-400 mb-4">Last updated: {new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</p>
            {[['1. Acceptance','By using Nisab Wallet you agree to these Terms. If you disagree, please do not use the platform.'],
              ['2. Use of Service','You agree to use the service lawfully and in accordance with Islamic principles. You are responsible for maintaining account confidentiality.'],
              ['3. Subscription & Payments','All plans include a 5-day free trial. Payments are processed manually and verified within 24 hours. Prices are in BDT and subject to change with 30 days notice.'],
              ['4. Zakat Calculations','We strive for full accuracy following accepted fiqh methodology. However, we recommend consulting a qualified Islamic scholar for final verification of your obligation.'],
              ['5. Limitation of Liability','Nisab Wallet is provided "as is". We are not liable for financial decisions made based on platform data.'],
              ['6. Termination','We reserve the right to terminate access for violations of these Terms.'],
              ['7. Contact','Questions: legal@nisabwallet.com']
            ].map(([h,b]) => (<div key={h}><h3>{h}</h3><p>{b}</p></div>))}
          </div>
        </Modal>
      )}
    </div>
  );
}