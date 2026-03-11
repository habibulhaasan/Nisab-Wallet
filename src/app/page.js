// src/app/page.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  CheckCircle, ArrowRight, Menu, X, Wallet, TrendingUp, Shield,
  BarChart3, Star, Moon, Calendar, FileText, Sparkles, ChevronDown,
  Users, Zap, Mail, MapPin, Phone, Heart, Clock, ChevronRight,
  CreditCard, Target, Award, Globe, Landmark, Coins, BookOpen,
  BadgeCheck, Building2, PiggyBank, Repeat, ShoppingBag, Receipt,
  HandCoins, Sprout, AlignLeft, ArrowRightLeft, FolderOpen, Settings,
  TrendingDown, Lock, Bell, RefreshCw, Download, Calculator,
  Eye, Plus, Tag, Edit2, Trash2, Search,
} from 'lucide-react';

// ── Scroll animation hook ──────────────────────────────────────────────────
function useInView(opts = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.1, ...opts });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ── Animated number counter ────────────────────────────────────────────────
function Counter({ end, suffix = '', decimals = 0, duration = 2000 }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(+(eased * end).toFixed(decimals));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration, decimals]);
  return <span ref={ref}>{decimals > 0 ? val.toFixed(decimals) : val.toLocaleString()}{suffix}</span>;
}

// ── Stars ──────────────────────────────────────────────────────────────────
function Stars({ n = 5, size = 14 }) {
  return <span className="flex gap-0.5">{[1,2,3,4,5].map(i=>(
    <Star key={i} size={size} className={i<=n?'text-amber-400 fill-amber-400':'text-gray-300 fill-gray-300'} />
  ))}</span>;
}

// ── Fade-in wrapper ────────────────────────────────────────────────────────
function Fade({ children, className = '', delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
}

// ── Feature data ───────────────────────────────────────────────────────────
const CORE_FEATURES = [
  { icon: Moon,          title: 'Zakat Cycle Engine',        desc: 'Full Hawl tracking from Nisab detection to payment. Dual-calendar recording (Hijri + Gregorian), 2.5% auto-calculation, cycle history.',             tag: 'Islamic Finance',  color: 'blue'    },
  { icon: Coins,         title: 'Real-Time Nisab Threshold', desc: 'Nisab calculated against live silver prices (per gram or per Vori/Tola). Instant notification when your wealth crosses the threshold.',         tag: 'Live Calculation', color: 'indigo'  },
  { icon: Landmark,      title: 'Multi-Account Wealth Hub',  desc: 'Cash, Bank, bKash, Nagad, Gold, Silver — all consolidated. Every account has a permanent immutable ID preserving historical accuracy.',          tag: 'Asset Management', color: 'slate'   },
  { icon: BarChart3,     title: 'Smart Analytics',           desc: 'Weekly, monthly, yearly and custom-range reports. Bar, pie, and line charts. Category-wise income vs. expense breakdown at a glance.',           tag: 'Insights',         color: 'violet'  },
  { icon: TrendingUp,    title: 'Investment Portfolio',       desc: 'Track Stocks, Mutual Funds, DPS, FDR, Savings Certificates, Bonds, PPF, Pension Funds, Crypto, and Real Estate with returns tracking.',          tag: 'Investments',      color: 'emerald' },
  { icon: PiggyBank,     title: 'Budget Management',         desc: 'Set monthly category budgets. Real-time tracking shows how close you are to each limit with visual progress indicators.',                          tag: 'Budgeting',        color: 'teal'    },
  { icon: Target,        title: 'Financial Goals',           desc: 'Define savings targets, allocate funds from accounts, and track milestone progress toward every goal you set.',                                     tag: 'Goal Tracking',    color: 'orange'  },
  { icon: Repeat,        title: 'Recurring Transactions',    desc: 'Automate salary, rent, subscriptions, and any fixed income/expense. Pause, resume, or edit schedules any time.',                                   tag: 'Automation',       color: 'cyan'    },
  { icon: HandCoins,     title: 'Loans & Lending',           desc: 'Track money you owe and money owed to you. Due-date reminders, payment history, and complete lender/borrower contact info.',                       tag: 'Debt Tracking',    color: 'rose'    },
  { icon: FileText,      title: 'Tax File Management',       desc: 'Organise income sources by fiscal year for annual tax filing. Map categories to tax heads and generate a structured summary report.',             tag: 'Tax',              color: 'amber'   },
  { icon: ShoppingBag,   title: 'Shopping List',             desc: 'Plan purchases before spending. Create named lists, tick off items, and keep your shopping aligned with your budget.',                             tag: 'Planning',         color: 'pink'    },
  { icon: Receipt,       title: 'Transaction Management',    desc: 'Full CRUD on every income and expense entry. Categorised, timestamped, and filterable. Transfers between accounts preserved as paired entries.',  tag: 'Transactions',     color: 'slate'   },
];

const HOW_STEPS = [
  { n:'01', icon: Users,        title: 'Create Your Account',       desc: 'Sign up with your email in under a minute. Start with a 5-day free trial — no credit card required.'                                 },
  { n:'02', icon: Landmark,     title: 'Add Your Accounts',         desc: 'Set up Cash, Bank, bKash, Nagad, Gold, or Silver accounts. Starting balances can be entered immediately.'                              },
  { n:'03', icon: Receipt,      title: 'Record Transactions',       desc: 'Log income and expenses, set up recurring entries, and categorise every transaction for clean analytics.'                               },
  { n:'04', icon: Moon,         title: 'Let Zakat Run Itself',      desc: 'The system monitors your wealth against Nisab, starts the Hijri-year cycle automatically, and alerts you when Zakat becomes due.'     },
];

const ZAKAT_STEPS = [
  { n:'01', title: 'Wealth Reaches Nisab',       desc: 'Detected automatically. Cycle start date recorded in both Hijri and Gregorian calendars.'                                                  },
  { n:'02', title: 'One Hijri Year Monitoring',  desc: 'Wealth tracked for exactly 12 lunar months. Fluctuations allowed — no obligation triggered during monitoring.'                              },
  { n:'03', title: 'Assessment at Year End',     desc: 'If wealth ≥ Nisab after one full Hawl, Zakat is calculated at 2.5% of eligible assets and you are notified.'                               },
  { n:'04', title: 'Payment & Cycle Renewal',    desc: 'Record your payment. If wealth is still above Nisab, a new cycle begins immediately. Full history preserved.'                               },
];

const ACCOUNT_TYPES = ['Cash','Bank Account','bKash / Nagad','Gold','Silver','Investments'];

const FALLBACK_PLANS = [
  { id:'m1', name:'1 Month',  price:99,  duration:'1 Month',  durationDays:30,  isMostPopular:false, features:['Full Zakat Cycle Tracking','Multi-Account Management','Income & Expense Analytics','PDF Reports','Email Support'] },
  { id:'m3', name:'3 Months', price:249, duration:'3 Months', durationDays:90,  isMostPopular:true,  features:['Everything in 1-Month','Investment Portfolio Tracking','Loan & Lending Tracker','Priority Support','Data Export (PDF/CSV)'] },
  { id:'y1', name:'1 Year',   price:799, duration:'1 Year',   durationDays:365, isMostPopular:false, features:['Everything in 3-Months','Tax File Management','Recurring Automation','Annual Zakat History','Dedicated Support'] },
];

const FAQS = [
  { q:'What exactly is Nisab Wallet?',                       a:"Nisab Wallet is a complete Islamic personal finance platform. It manages multi-account wealth tracking, automates the full Zakat obligation cycle, and provides analytics, budgeting, investment tracking, loans, recurring transactions, tax filing assistance, and more — all in one app." },
  { q:'How accurate is the Zakat calculation?',             a:"We follow the established fiqh methodology: your total wealth must be above the silver Nisab threshold (52.5 Tola / 612.36g) for a full Hijri lunar year (Hawl). Zakat is then 2.5% of eligible assets. We recommend consulting a qualified Islamic scholar for final confirmation." },
  { q:'How does the 5-day free trial work?',                a:"Every new account gets full platform access for 5 days. No credit card is required. After the trial, select any plan to continue. If you don't subscribe, your data is retained so you can pick up where you left off." },
  { q:'Which account types are supported?',                 a:"Cash, Bank Account, Mobile Banking (bKash, Nagad, Rocket), Gold, and Silver. Each account has an immutable ID so renaming or restructuring never breaks your historical analytics." },
  { q:'Can I track investments and loans?',                 a:"Yes. Investments supports Stocks, Mutual Funds, DPS, FDR, Savings Certificates, Bonds, PPF, Pension Funds, Cryptocurrency, and Real Estate. The Loans module tracks borrowed money with due dates, and Lendings tracks money you've given to others." },
  { q:'Is my financial data private and secure?',           a:"All data is stored in Firebase with end-to-end encryption and per-user Firestore security rules. We never sell, share, or access your financial records. You can export a full backup of all your data at any time from Settings." },
  { q:'What payment methods do you accept for subscription?', a:"bKash, Nagad, Rocket, bank transfer, and cash. After submitting payment details, our team verifies manually within 24 hours. You receive an in-app notification once approved." },
];

const TESTIMONIALS_FALLBACK = [
  { id:1, name:'Ahmed Al-Rashid',  role:'Business Owner, Dhaka',     rating:5, msg:"For the first time I'm completely confident about my Zakat. The system started the cycle automatically when my wealth hit Nisab and reminded me exactly 354 days later. Nothing else does this." },
  { id:2, name:'Fatima Begum',     role:'Teacher, Chittagong',        rating:5, msg:"I was nervous about finance apps — too complicated. This one is different. Large buttons, clear labels, everything explained. My elderly mother can use it too." },
  { id:3, name:'Mohammad Hasan',   role:'IT Professional, Sylhet',    rating:5, msg:"The investment tracker is superb. I manage stocks, an FDR, and savings certificates all in one place. The PDF reports are professional enough to hand to my accountant." },
  { id:4, name:'Nadia Rahman',     role:'Homemaker, Rajshahi',        rating:5, msg:"The live Nisab threshold update is what sold me. I don't have to look up silver prices manually anymore. The system just knows and adjusts the calculation." },
  { id:5, name:'Karim Uddin',      role:'Pharmacist, Khulna',         rating:4, msg:"Budgets + recurring transactions is a killer combo. I set my monthly limits, automate salary and fixed costs, and the app tells me exactly what I have left to spend." },
  { id:6, name:'Sarah Ahmed',      role:'Entrepreneur, Cumilla',      rating:5, msg:"Switched from a spreadsheet six months ago. The Zakat history alone — being able to see every cycle, payment, and amount over the years — is worth the subscription." },
];

const COLOR = {
  blue:    { bg:'bg-blue-50',    border:'border-blue-200',    icon:'bg-blue-100 text-blue-700',    tag:'bg-blue-100 text-blue-700'    },
  indigo:  { bg:'bg-indigo-50',  border:'border-indigo-200',  icon:'bg-indigo-100 text-indigo-700',tag:'bg-indigo-100 text-indigo-700' },
  slate:   { bg:'bg-slate-50',   border:'border-slate-200',   icon:'bg-slate-100 text-slate-700',  tag:'bg-slate-100 text-slate-600'  },
  violet:  { bg:'bg-violet-50',  border:'border-violet-200',  icon:'bg-violet-100 text-violet-700',tag:'bg-violet-100 text-violet-700' },
  emerald: { bg:'bg-emerald-50', border:'border-emerald-200', icon:'bg-emerald-100 text-emerald-700',tag:'bg-emerald-100 text-emerald-700'},
  teal:    { bg:'bg-teal-50',    border:'border-teal-200',    icon:'bg-teal-100 text-teal-700',    tag:'bg-teal-100 text-teal-700'    },
  orange:  { bg:'bg-orange-50',  border:'border-orange-200',  icon:'bg-orange-100 text-orange-700',tag:'bg-orange-100 text-orange-700' },
  cyan:    { bg:'bg-cyan-50',    border:'border-cyan-200',    icon:'bg-cyan-100 text-cyan-700',    tag:'bg-cyan-100 text-cyan-700'    },
  rose:    { bg:'bg-rose-50',    border:'border-rose-200',    icon:'bg-rose-100 text-rose-700',    tag:'bg-rose-100 text-rose-700'    },
  amber:   { bg:'bg-amber-50',   border:'border-amber-200',   icon:'bg-amber-100 text-amber-700',  tag:'bg-amber-100 text-amber-700'  },
  pink:    { bg:'bg-pink-50',    border:'border-pink-200',    icon:'bg-pink-100 text-pink-700',    tag:'bg-pink-100 text-pink-700'    },
};

// ─── Mockup helper (shared with guide) ──────────────────────────────────────

// ─── Additional icons needed by mockups ──────────────────────────────────────
// (already imported from lucide-react above — these are used in mockups)

// ─── Mockup browser frame ─────────────────────────────────────────────────────
function MockupFrame({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gray-100 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400"/>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/>
          <div className="w-2.5 h-2.5 rounded-full bg-green-400"/>
        </div>
        <span className="text-[10px] text-gray-500 font-medium mx-auto pr-8 truncate">{title}</span>
      </div>
      <div className="p-3 bg-gray-50">{children}</div>
    </div>
  );
}

// ─── Dashboard Overview mockup (used in Hero + App Preview) ──────────────────
function DashboardMockup() {
  return (
    <MockupFrame title="nisabwallet.com/dashboard">
      {/* Zakat status card */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-3.5 mb-3 text-white shadow-lg">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Moon size={13} className="opacity-80"/>
            <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Zakat Status</span>
          </div>
          <span className="text-[9px] bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">Active Hawl</span>
        </div>
        <div className="text-xl font-extrabold mb-0.5">৳ 8,42,500</div>
        <div className="text-[10px] opacity-60 mb-2.5">Total Wealth · Nisab: ৳ 1,24,300</div>
        <div className="flex justify-between text-[9px] mb-1 opacity-80">
          <span>Hijri Year Progress</span>
          <span className="font-bold">218 / 354 days</span>
        </div>
        <div className="bg-white/15 rounded-full h-1.5">
          <div className="bg-white rounded-full h-1.5" style={{width:'61.6%'}}/>
        </div>
      </div>
      {/* Account grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          {l:'Bank Account',v:'৳5,12,000',I:Building2,c:'blue'},
          {l:'bKash',v:'৳84,500',I:CreditCard,c:'violet'},
          {l:'Cash in Hand',v:'৳1,26,000',I:Wallet,c:'emerald'},
          {l:'Gold (22g)',v:'৳1,20,000',I:Coins,c:'amber'},
        ].map((a,i)=>(
          <div key={i} className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm">
            <div className={`w-6 h-6 rounded-lg mb-1.5 flex items-center justify-center bg-${a.c}-50`}>
              <a.I size={12} className={`text-${a.c}-600`}/>
            </div>
            <div className="text-[9px] text-gray-500 mb-0.5">{a.l}</div>
            <div className="text-[11px] font-extrabold text-gray-900">{a.v}</div>
          </div>
        ))}
      </div>
      {/* Mini chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-800">Monthly Overview</span>
          <span className="text-[9px] text-blue-600 font-semibold">Mar 2026</span>
        </div>
        <div className="flex items-end gap-0.5 h-8">
          {[35,58,42,75,50,66,88,55,70,82,45,100].map((h,i)=>(
            <div key={i} className="flex-1 rounded-t" style={{height:`${h}%`,background:i===11?'#1d4ed8':i>7?'#93c5fd':'#dbeafe'}}/>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[8px] text-emerald-600 font-semibold">↑ ৳95,000</span>
          <span className="text-[8px] text-red-500 font-semibold">↓ ৳42,300</span>
        </div>
      </div>
    </MockupFrame>
  );
}

// ─── Feature mockups (one per CORE_FEATURES entry) ────────────────────────────
function ZakatFeatureMockup() {
  return (
    <MockupFrame title="Zakat — /dashboard/zakat">
      <div className="space-y-2">
        <div className="bg-gray-900 text-white rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2"><Moon size={14} className="text-blue-300"/><div><div className="text-[9px] text-gray-400 uppercase font-bold">Status</div><div className="text-sm font-bold">Not Mandatory</div></div></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 rounded-lg p-2"><div className="text-[9px] text-gray-400 mb-0.5">Total Wealth</div><div className="text-sm font-bold">৳95,000</div></div>
            <div className="bg-white/10 rounded-lg p-2"><div className="text-[9px] text-gray-400 mb-0.5">Nisab Threshold</div><div className="text-sm font-bold">৳1,20,000</div></div>
          </div>
          <div className="mt-2 text-[10px] text-gray-400">৳25,000 below Nisab. No action needed.</div>
        </div>
        <div className="bg-blue-600 text-white rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2"><Clock size={14} className="text-blue-200"/><div><div className="text-[9px] text-blue-200 uppercase font-bold">Status</div><div className="text-sm font-bold">Monitoring Cycle Active</div></div></div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-white/15 rounded-lg p-1.5"><div className="text-[9px] text-blue-200 mb-0.5">Total Wealth</div><div className="text-xs font-bold">৳1,45,000</div></div>
            <div className="bg-white/15 rounded-lg p-1.5"><div className="text-[9px] text-blue-200 mb-0.5">Days Left</div><div className="text-xs font-bold">287 days</div></div>
            <div className="bg-white/15 rounded-lg p-1.5"><div className="text-[9px] text-blue-200 mb-0.5">Cycle Start</div><div className="text-xs font-bold">12 Sha'ban</div></div>
          </div>
        </div>
        <div className="bg-red-600 text-white rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2"><Star size={14} className="text-yellow-300"/><div><div className="text-[9px] text-red-200 uppercase font-bold">Status</div><div className="text-sm font-bold">Zakat Due</div></div></div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-white/15 rounded-lg p-2"><div className="text-[9px] text-red-200 mb-0.5">Total Wealth</div><div className="text-sm font-bold">৳1,60,000</div></div>
            <div className="bg-white/15 rounded-lg p-2"><div className="text-[9px] text-red-200 mb-0.5">Zakat (2.5%)</div><div className="text-sm font-bold text-yellow-300">৳4,000</div></div>
          </div>
          <div className="w-full py-1.5 bg-white text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><Calculator size={10}/>Record Payment</div>
        </div>
      </div>
    </MockupFrame>
  );
}

function NisabMockup() {
  return (
    <MockupFrame title="Zakat Settings — Nisab Threshold">
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="text-[10px] font-bold text-blue-800 mb-2 flex items-center gap-1.5"><Coins size={11}/>Silver Nisab (52.5 Tola)</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-white border border-blue-100 rounded-lg p-2"><div className="text-[9px] text-gray-500">Price/gram (৳)</div><div className="text-base font-bold text-blue-700">198.50</div></div>
            <div className="bg-white border border-blue-100 rounded-lg p-2"><div className="text-[9px] text-gray-500">Nisab Value</div><div className="text-base font-bold text-gray-900">৳1,21,494</div></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[9px] text-gray-500">Last updated: 10 Mar 2026</div>
            <div className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-bold flex items-center gap-1"><RefreshCw size={8}/>Refresh Price</div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="text-[10px] font-bold text-amber-800 mb-2 flex items-center gap-1.5"><Coins size={11}/>Gold Nisab (7.5 Tola)</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-amber-100 rounded-lg p-2"><div className="text-[9px] text-gray-500">Price/gram (৳)</div><div className="text-base font-bold text-amber-700">9,240</div></div>
            <div className="bg-white border border-amber-100 rounded-lg p-2"><div className="text-[9px] text-gray-500">Nisab Value</div><div className="text-base font-bold text-gray-900">৳8,08,416</div></div>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-bold text-emerald-800">Your Total Wealth</div><div className="text-xl font-bold text-emerald-700">৳8,42,500</div></div>
            <div className="px-2 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-bold">ABOVE NISAB ✓</div>
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}

function AccountsFeatureMockup() {
  return (
    <MockupFrame title="Accounts — /dashboard/accounts">
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-3 text-white mb-3">
        <div className="text-[10px] text-gray-300 mb-0.5">Total Balance</div>
        <div className="text-xl font-bold">৳1,25,000</div>
        <div className="text-[10px] text-gray-300 mt-0.5">Across 4 accounts</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          {name:'Cash',type:'Cash',bal:'25,000',I:Wallet},
          {name:'DBBL Savings',type:'Bank',bal:'80,000',I:Building2},
          {name:'bKash',type:'Mobile Banking',bal:'5,000',I:CreditCard},
          {name:'Gold',type:'Gold',bal:'15,000',I:Coins},
        ].map((acc,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center"><acc.I size={13} className="text-gray-700"/></div>
              <div><div className="text-[10px] font-semibold text-gray-900 truncate">{acc.name}</div><div className="text-[8px] text-gray-500">{acc.type}</div></div>
            </div>
            <div className="text-base font-bold text-gray-900">৳{acc.bal}</div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function AnalyticsFeatureMockup() {
  const bars=[{m:'Oct',i:60,e:45},{m:'Nov',i:72,e:55},{m:'Dec',i:58,e:70},{m:'Jan',i:80,e:48},{m:'Feb',i:65,e:52},{m:'Mar',i:90,e:40}];
  const pie=[{name:'Foods',pct:35,color:'#EC4899'},{name:'Transport',pct:22,color:'#EF4444'},{name:'Shopping',pct:18,color:'#8B5CF6'},{name:'Healthcare',pct:15,color:'#06B6D4'},{name:'Other',pct:10,color:'#F59E0B'}];
  return (
    <MockupFrame title="Analytics — /dashboard/analytics">
      <div className="flex gap-1.5 mb-3">{['Week','Month','Year','Custom'].map((r,i)=><div key={i} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border ${i===2?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-600 border-gray-200'}`}>{r}</div>)}</div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">{[{l:'Income',v:'৳5,40,000',c:'text-green-600'},{l:'Expense',v:'৳3,10,000',c:'text-red-600'},{l:'Net',v:'৳2,30,000',c:'text-green-600'}].map((s,i)=><div key={i} className="bg-white rounded-lg border border-gray-200 p-2"><div className="text-[9px] text-gray-500 mb-0.5">{s.l}</div><div className={`text-sm font-bold ${s.c}`}>{s.v}</div></div>)}</div>
      <div className="bg-white rounded-lg border border-gray-200 p-2.5 mb-2">
        <div className="text-[10px] font-semibold text-gray-700 mb-2">Income vs Expense</div>
        <div className="flex items-end gap-2 h-12">{bars.map((b,i)=><div key={i} className="flex-1 flex flex-col items-center gap-0.5"><div className="w-full flex gap-0.5 items-end"><div className="flex-1 bg-emerald-400 rounded-sm" style={{height:`${b.i*0.5}px`}}/><div className="flex-1 bg-red-400 rounded-sm" style={{height:`${b.e*0.5}px`}}/></div><div className="text-[7px] text-gray-400">{b.m}</div></div>)}</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-2.5">
        <div className="text-[10px] font-semibold text-gray-700 mb-2">By Category</div>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full flex-shrink-0" style={{background:'conic-gradient(#EC4899 0% 35%, #EF4444 35% 57%, #8B5CF6 57% 75%, #06B6D4 75% 90%, #F59E0B 90% 100%)'}}><div className="w-full h-full rounded-full" style={{margin:'4px',width:'calc(100% - 8px)',height:'calc(100% - 8px)',background:'#f9fafb',borderRadius:'50%'}}/></div>
          <div className="space-y-0.5 flex-1">{pie.map((p,i)=><div key={i} className="flex items-center justify-between"><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor:p.color}}/><span className="text-[9px] text-gray-700">{p.name}</span></div><span className="text-[9px] font-semibold">{p.pct}%</span></div>)}</div>
        </div>
      </div>
    </MockupFrame>
  );
}

function InvestmentsFeatureMockup() {
  const allocation=[{type:'DPS',pct:35,color:'#3B82F6'},{type:'Stocks',pct:28,color:'#10B981'},{type:'FDR',pct:22,color:'#F59E0B'},{type:'Sanchayapatra',pct:15,color:'#8B5CF6'}];
  return (
    <MockupFrame title="Investments — /dashboard/investments">
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {[{l:'Invested',v:'৳5,00,000',c:'text-gray-900'},{l:'Current Value',v:'৳5,85,000',c:'text-gray-900'},{l:'Returns',v:'+৳85,000',c:'text-green-600'},{l:'+17%',v:'Gain',c:'text-green-600'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2"><div className="text-[9px] text-gray-500 mb-0.5">{s.l}</div><div className={`text-sm font-bold ${s.c}`}>{s.v}</div></div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-2.5 mb-2">
        <div className="text-[10px] font-semibold text-gray-700 mb-2">Portfolio Allocation</div>
        <div className="grid grid-cols-2 gap-1.5">
          {allocation.map((a,i)=>(
            <div key={i} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor:a.color}}/>
              <div><div className="text-[9px] text-gray-500">{a.type}</div><div className="text-[10px] font-bold">{a.pct}%</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        {[{name:'Square Pharma',type:'Stock',ret:'+18.75%'},{name:'DBBL DPS',type:'DPS',ret:'+10%'}].map((inv,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2 flex items-center justify-between">
            <div><div className="text-[10px] font-bold text-gray-900">{inv.name}</div><span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[8px]">{inv.type}</span></div>
            <div className="text-[11px] font-bold text-green-600">{inv.ret}</div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function BudgetsFeatureMockup() {
  const budgets=[{cat:'Foods',color:'#EC4899',spent:8500,limit:10000},{cat:'Transport',color:'#EF4444',spent:4800,limit:5000},{cat:'Shopping',color:'#8B5CF6',spent:12000,limit:8000},{cat:'Healthcare',color:'#06B6D4',spent:2000,limit:6000}];
  return (
    <MockupFrame title="Budgets — /dashboard/budgets">
      <div className="flex justify-between items-center mb-3">
        <div><div className="text-sm font-semibold text-gray-900">Monthly Budgets</div><div className="text-[10px] text-gray-500">March 2026</div></div>
      </div>
      <div className="space-y-2">
        {budgets.map((b,i)=>{const pct=Math.min(100,(b.spent/b.limit)*100);const over=b.spent>b.limit;const warn=pct>=80&&!over;const barC=over?'#EF4444':warn?'#F59E0B':'#10B981';return(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:b.color}}/><span className="text-[11px] font-semibold text-gray-900">{b.cat}</span>{over&&<span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-bold">OVER</span>}</div>
              <span className={`text-[11px] font-bold ${over?'text-red-600':'text-gray-900'}`}>৳{b.spent.toLocaleString()} / ৳{b.limit.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${Math.min(100,pct)}%`,backgroundColor:barC}}/></div>
          </div>
        );})}
      </div>
    </MockupFrame>
  );
}

function GoalsFeatureMockup() {
  return (
    <MockupFrame title="Goals — /dashboard/goals">
      <div className="space-y-2">
        {[{name:'Emergency Fund',target:100000,current:65000,date:'Dec 2026',color:'#EF4444',done:false},{name:'New Laptop',target:80000,current:80000,date:'Mar 2026',color:'#3B82F6',done:true},{name:'Eid Shopping',target:20000,current:8000,date:'Apr 2026',color:'#10B981',done:false}].map((g,i)=>{
          const pct=Math.min(100,(g.current/g.target)*100);
          return(<div key={i} className={`bg-white rounded-lg border p-2.5 ${g.done?'border-emerald-200 bg-emerald-50/30':'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-1.5">
              <div><div className="flex items-center gap-1.5"><span className="text-[11px] font-bold text-gray-900">{g.name}</span>{g.done&&<CheckCircle size={10} className="text-emerald-500"/>}</div><div className="text-[9px] text-gray-500">Target: {g.date}</div></div>
              <div className="text-right"><div className="text-sm font-bold text-gray-900">৳{g.current.toLocaleString()}</div><div className="text-[9px] text-gray-400">of ৳{g.target.toLocaleString()}</div></div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1"><div className="h-full rounded-full" style={{width:`${pct}%`,backgroundColor:g.done?'#10B981':g.color}}/></div>
            <div className="flex justify-between items-center"><span className="text-[9px] text-gray-500">{pct.toFixed(0)}% reached</span>{g.done&&<span className="text-[9px] font-semibold text-emerald-600">Goal Achieved! 🎉</span>}</div>
          </div>);
        })}
      </div>
    </MockupFrame>
  );
}

function RecurringFeatureMockup() {
  return (
    <MockupFrame title="Recurring — /dashboard/recurring">
      <div className="space-y-2">
        {[{name:'Monthly Rent',type:'Expense',freq:'Monthly · 1st',amt:'৳15,000',status:'active',next:'1 Apr'},{name:'Salary Credit',type:'Income',freq:'Monthly · 5th',amt:'৳45,000',status:'active',next:'5 Apr'},{name:'Electricity Bill',type:'Expense',freq:'Monthly · 25th',amt:'৳~800',status:'active',mode:'Manual',next:'25 Mar'},{name:'Netflix',type:'Expense',freq:'Monthly · 15th',amt:'৳400',status:'paused',next:'Paused'}].map((r,i)=>(
          <div key={i} className={`bg-white rounded-lg border p-2.5 ${r.status==='paused'?'border-gray-100 opacity-60':'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.type==='Income'?'bg-green-100':'bg-red-100'}`}>
                  {r.type==='Income'?<TrendingUp size={13} className="text-green-600"/>:<TrendingDown size={13} className="text-red-600"/>}
                </div>
                <div><div className="text-[11px] font-semibold text-gray-900">{r.name}</div><div className="text-[9px] text-gray-500">{r.freq}</div></div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${r.type==='Income'?'text-green-600':'text-red-600'}`}>{r.amt}</div>
                {r.status==='paused'&&<span className="px-1 py-0.5 bg-gray-100 text-gray-500 rounded text-[7px] font-bold">PAUSED</span>}
              </div>
            </div>
            <div className="mt-1.5 text-[9px] text-gray-400">Next: {r.next}</div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function LoansLendingsFeatureMockup() {
  return (
    <MockupFrame title="Loans & Lendings — /dashboard/loans">
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[{l:'Borrowed',v:'৳2,00,000',c:'text-red-600'},{l:'Outstanding',v:'৳1,50,000',c:'text-red-500'},{l:'Repaid',v:'৳50,000',c:'text-green-600'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2"><div className="text-[9px] text-gray-500 mb-0.5">{s.l}</div><div className={`text-xs font-bold ${s.c}`}>{s.v}</div></div>
        ))}
      </div>
      <div className="space-y-2">
        {[{lender:'Dutch-Bangla Bank',type:'Conventional',outstanding:'৳1,20,000',overdue:false},{lender:'Uncle Karim',type:'Qard Hasan',outstanding:'৳30,000',overdue:true}].map((loan,i)=>(
          <div key={i} className={`bg-white rounded-lg border p-2.5 ${loan.overdue?'border-red-200 bg-red-50/20':'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div><div className="flex items-center gap-1.5"><span className="text-[11px] font-bold text-gray-900">{loan.lender}</span>{loan.overdue&&<span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-bold">OVERDUE</span>}</div><span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${loan.type==='Qard Hasan'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{loan.type}</span></div>
              <div className="text-sm font-bold text-red-600">{loan.outstanding}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-[10px] font-bold text-gray-700 mb-2">Lent to Others</div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center justify-between">
          <div><div className="text-[10px] font-bold text-gray-900">Arif Hossain</div><div className="text-[9px] text-gray-500">Due: 15 Apr 2026</div></div>
          <div><div className="text-[11px] font-bold text-blue-700">৳50,000</div><div className="text-[8px] text-gray-400">Outstanding: ৳30k</div></div>
        </div>
      </div>
    </MockupFrame>
  );
}

function TaxFeatureMockup() {
  return (
    <MockupFrame title="Tax File — /dashboard/tax">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4 text-white mb-3">
        <h2 className="text-sm font-bold mb-0.5">Current Year: 2025–2026</h2>
        <p className="text-[10px] text-gray-300">Jul 2025 – Jun 2026 · Filing: 30 Nov 2026</p>
        <p className="text-[9px] text-gray-400 mt-1">266 days until deadline</p>
      </div>
      <div className="space-y-2">
        {[{year:'2025–2026',status:'In Progress',statusC:'bg-blue-100 text-blue-700',income:'৳3,60,000',heads:['Salaries: ৳3,20,000','Freelance: ৳40,000']},{year:'2024–2025',status:'Filed',statusC:'bg-green-100 text-green-700',income:'৳3,10,000',heads:['Salaries: ৳3,10,000']}].map((ty,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div><div className="flex items-center gap-2 mb-1"><span className="text-[11px] font-bold text-gray-900">Income Year {ty.year}</span><span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${ty.statusC}`}>{ty.status}</span></div><div className="text-[10px] font-semibold text-gray-900">Total: {ty.income}</div>{ty.heads.map((h,hi)=><div key={hi} className="text-[9px] text-gray-500">· {h}</div>)}</div>
              <FileText size={14} className="text-gray-400 flex-shrink-0"/>
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function ShoppingFeatureMockup() {
  return (
    <MockupFrame title="Shopping Lists — /dashboard/shopping">
      <div className="grid grid-cols-3 gap-2">
        {[{name:'Weekly Groceries',items:12,confirmed:8,est:'৳3,200',status:'Partial',statusC:'bg-blue-100 text-blue-700'},{name:'Eid Shopping',items:6,confirmed:6,est:'৳18,000',status:'Completed',statusC:'bg-green-100 text-green-700'},{name:'Home Supplies',items:5,confirmed:0,est:'৳1,800',status:'Draft',statusC:'bg-yellow-100 text-yellow-700'}].map((cart,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5">
            <div className="flex items-start justify-between mb-2">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center"><ShoppingBag size={13} className="text-gray-600"/></div>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${cart.statusC}`}>{cart.status}</span>
            </div>
            <div className="text-[10px] font-bold text-gray-900 mb-1">{cart.name}</div>
            <div className="text-[9px] text-gray-500">{cart.confirmed}/{cart.items} bought</div>
            <div className="text-[9px] text-gray-700 font-medium mt-0.5">{cart.est}</div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function TransactionsFeatureMockup() {
  return (
    <MockupFrame title="Transactions — /dashboard/transactions">
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[{l:'Income',v:'+৳45,000',c:'text-green-600'},{l:'Expense',v:'-৳18,500',c:'text-red-600'},{l:'Net',v:'+৳26,500',c:'text-green-600'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2"><div className="text-[9px] text-gray-500 mb-0.5">{s.l}</div><div className={`text-sm font-bold ${s.c}`}>{s.v}</div></div>
        ))}
      </div>
      <div className="bg-gray-100 rounded px-2 py-1.5 flex justify-between items-center mb-1.5 border border-gray-200">
        <span className="text-[10px] font-semibold text-gray-700">Today, 10 Mar 2026</span>
      </div>
      {[{cat:'Salary',acc:'DBBL Savings',amt:'+৳45,000',bg:'bg-green-50',dot:'#10B981',I:TrendingUp,ic:'text-green-600',ac:'text-green-600'},{cat:'Foods',acc:'Cash',amt:'-৳1,200',bg:'bg-red-50',dot:'#EC4899',I:TrendingDown,ic:'text-red-600',ac:'text-red-600'},{cat:'bKash → Cash',acc:'Transfer',amt:'৳3,000',bg:'bg-blue-50',dot:'#3B82F6',I:ArrowRightLeft,ic:'text-blue-500',ac:'text-blue-600'}].map((tx,i)=>(
        <div key={i} className={`flex items-center gap-2 px-2 py-2 rounded-lg ${tx.bg} mb-1`}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm flex-shrink-0"><tx.I size={11} className={tx.ic}/></div>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor:tx.dot}}/>
          <div className="flex-1 min-w-0"><div className="text-[10px] font-semibold text-gray-900">{tx.cat}</div><div className="text-[8px] text-gray-500">{tx.acc}</div></div>
          <div className={`text-xs font-bold ${tx.ac}`}>{tx.amt}</div>
        </div>
      ))}
    </MockupFrame>
  );
}

// ─── Map each CORE_FEATURES entry to its mockup component + detail bullets ────
const FEATURE_DETAILS = {
  'Zakat Cycle Engine': {
    mockup: <ZakatFeatureMockup/>,
    highlights: ['Detects when total wealth crosses Nisab threshold','Records cycle start in both Hijri & Gregorian calendar','Tracks Hawl for exactly 354 lunar days','Calculates 2.5% obligation automatically when due','Complete history of all past Zakat cycles & payments'],
  },
  'Real-Time Nisab Threshold': {
    mockup: <NisabMockup/>,
    highlights: ['Fetches live silver price per gram','Calculates 52.5 Tola silver threshold automatically','Also tracks gold Nisab (7.5 Tola)','Manual override option for custom price entry','Wealth vs Nisab status visible at a glance'],
  },
  'Multi-Account Wealth Hub': {
    mockup: <AccountsFeatureMockup/>,
    highlights: ['Cash, Bank, Mobile Banking, Gold, Silver and more','Each account has a permanent immutable ID','Total wealth consolidated in real-time','Transfer between accounts with full history','Supports DBBL, IBBL, bKash, Nagad, Rocket and all others'],
  },
  'Smart Analytics': {
    mockup: <AnalyticsFeatureMockup/>,
    highlights: ['Weekly, monthly, yearly and custom date range views','Bar charts, pie charts and line graphs','Category-wise income vs expense breakdown','Compare any two time periods side-by-side','Export as PDF or CSV'],
  },
  'Investment Portfolio': {
    mockup: <InvestmentsFeatureMockup/>,
    highlights: ['Stocks, Mutual Funds, DPS, FDR, Savings Certificates','Bonds, PPF, Pension Funds, Crypto, Real Estate','Tracks invested amount vs current value','Returns percentage and dividend tracking','Portfolio allocation donut chart'],
  },
  'Budget Management': {
    mockup: <BudgetsFeatureMockup/>,
    highlights: ['Set monthly limits per category','Real-time progress bars show remaining budget','Visual warning at 80%, red alert when over budget','Compare budgeted vs actual spending','Covers all income and expense categories'],
  },
  'Financial Goals': {
    mockup: <GoalsFeatureMockup/>,
    highlights: ['Define custom savings targets with deadlines','Allocate funds directly from your accounts','Visual progress toward each goal','Deposit or withdraw from goals anytime','Celebrates goal achievement 🎉'],
  },
  'Recurring Transactions': {
    mockup: <RecurringFeatureMockup/>,
    highlights: ['Automate salary, rent, bills, subscriptions','Set daily, weekly, monthly or custom frequency','Manual confirmation mode for variable amounts','Pause and resume schedules at any time','Upcoming due dates clearly displayed'],
  },
  'Loans & Lending': {
    mockup: <LoansLendingsFeatureMockup/>,
    highlights: ['Track money you owe with due dates & lender info','Track money owed to you with borrower contact','Payment history for every loan & lending','Overdue alerts with red visual indicator','Supports conventional, Qard Hasan loan types'],
  },
  'Tax File Management': {
    mockup: <TaxFeatureMockup/>,
    highlights: ['Bangladesh fiscal year July–June structure','Map categories to income tax heads','Deadline countdown for annual filing','Supports multiple income sources per year','Filed / In Progress / Draft status tracking'],
  },
  'Shopping List': {
    mockup: <ShoppingFeatureMockup/>,
    highlights: ['Create named shopping carts before spending','Tick off items as you purchase them','Track estimated vs actual cost','Draft, Partial, and Completed cart statuses','Keeps spending aligned with your budget'],
  },
  'Transaction Management': {
    mockup: <TransactionsFeatureMockup/>,
    highlights: ['Full CRUD on every income and expense entry','Categorised, timestamped, and filterable','Account-to-account transfers with paired entries','Search and filter by date, category, account','Balance updates instantly on every entry'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [liveStats, setLiveStats] = useState({ users:1200, tx:48000, rating:4.9, cycles:3200 });
  const [openFaq, setOpenFaq] = useState(null);
  const [modal, setModal] = useState(null);        // 'about' | 'contact' | 'privacy' | 'terms'
  const [featModal, setFeatModal] = useState(null); // feature title string
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { loadPlans(); loadTestimonials(); loadStats(); }, []);

  const loadStats = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      let tx = 0, cyc = 0;
      for (const u of snap.docs) {
        const [t, c] = await Promise.all([
          getDocs(collection(db,'users',u.id,'transactions')),
          getDocs(collection(db,'users',u.id,'zakatCycles')),
        ]);
        tx += t.size; cyc += c.size;
      }
      setLiveStats({ users: Math.max(snap.size,1200), tx: Math.max(tx,48000), rating: 4.9, cycles: Math.max(cyc,3200) });
    } catch {}
  };

  const loadPlans = async () => {
    setPlansLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'subscriptionPlans'), where('isActive', '==', true), orderBy('price', 'asc')));
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPlans(fetched.length > 0 ? fetched.sort((a,b) => (a.displayOrder||0) - (b.displayOrder||0)) : FALLBACK_PLANS);
    } catch { setPlans(FALLBACK_PLANS); }
    finally { setPlansLoading(false); }
  };

  const loadTestimonials = async () => {
    try {
      const snap = await getDocs(collection(db,'users'));
      const list = [];
      for (const u of snap.docs) {
        if (list.length >= 6) break;
        const fs = await getDocs(query(collection(db,'users',u.id,'feedback'), where('featured','==',true), limit(2)));
        fs.forEach(d => { const data = d.data(); if (data.message && list.length < 6) list.push({ id:d.id, name:data.userName||'User', role:data.userRole||'Nisab Wallet User', rating:data.rating||5, msg:data.message }); });
      }
      if (list.length >= 3) setTestimonials(list);
    } catch {}
  };

  const go = (id) => { document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}); setMenuOpen(false); };
  const displayT = testimonials.length >= 3 ? testimonials : TESTIMONIALS_FALLBACK;

  // ── Generic info modal ────────────────────────────────────────────────────
  const Modal = ({ title, children }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={()=>setModal(null)}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={()=>setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={18}/></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  // ── Feature detail modal ──────────────────────────────────────────────────
  const FeatModal = () => {
    const feat = CORE_FEATURES.find(f => f.title === featModal);
    if (!feat) return null;
    const Icon = feat.icon;
    const c = COLOR[feat.color] || COLOR.slate;
    const details = FEATURE_DETAILS[feat.title];
    return (
      <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm" onClick={()=>setFeatModal(null)}>
        <div className="bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] flex flex-col shadow-2xl sm:shadow-2xl rounded-t-2xl" onClick={e=>e.stopPropagation()}>
          {/* Handle bar for mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full"/></div>
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0 ${c.bg}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}><Icon size={20}/></div>
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${c.icon.split(' ')[1]}`}>{feat.tag}</div>
                <h2 className="text-base font-extrabold text-gray-900">{feat.title}</h2>
              </div>
            </div>
            <button onClick={()=>setFeatModal(null)} className="p-2 hover:bg-white/60 rounded-lg transition-colors flex-shrink-0"><X size={18}/></button>
          </div>
          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            <div className="p-5">
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{feat.desc}</p>
              {/* Live mockup */}
              {details?.mockup && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Live UI Preview</span>
                    <div className="flex-1 h-px bg-gray-100"/>
                  </div>
                  {details.mockup}
                </div>
              )}
              {/* Key highlights */}
              {details?.highlights && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">What You Can Do</span>
                    <div className="flex-1 h-px bg-gray-100"/>
                  </div>
                  <ul className="space-y-2">
                    {details.highlights.map((h,i)=>(
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5"/>
                        <span className="text-sm text-gray-700">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {/* Footer CTA */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/80 flex gap-3 flex-shrink-0">
            <button onClick={()=>router.push('/register')} className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors">
              Start Free Trial →
            </button>
            <button onClick={()=>{setFeatModal(null); setGuideOpen(true);}} className="px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <BookOpen size={14}/>View Guide
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── App Guide drawer (public read-only version) ───────────────────────────
  const GuideDrawer = () => {
    const [activeGuideId, setActiveGuideId] = useState('zakat');
    const [tocOpen, setTocOpen] = useState(false);
    const GUIDE_ITEMS = CORE_FEATURES.map(f => ({
      id: f.title.toLowerCase().replace(/[^a-z0-9]/g,'-'),
      title: f.title,
      subtitle: f.tag,
      icon: f.icon,
      color: f.color,
      desc: f.desc,
      mockup: FEATURE_DETAILS[f.title]?.mockup,
      highlights: FEATURE_DETAILS[f.title]?.highlights,
    }));
    const active = GUIDE_ITEMS.find(g => g.id === activeGuideId) || GUIDE_ITEMS[0];
    const ActiveIcon = active.icon;
    const ac = COLOR[active.color] || COLOR.slate;

    return (
      <div className="fixed inset-0 z-[400] flex flex-col bg-white" onClick={e=>e.stopPropagation()}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center"><BookOpen size={15} className="text-white"/></div>
            <div>
              <div className="text-base font-extrabold text-gray-900 leading-tight">Feature Guide</div>
              <div className="text-[10px] text-gray-500 hidden sm:block">Interactive preview of all {GUIDE_ITEMS.length} modules</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>router.push('/register')} className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors">
              Start Free Trial <ArrowRight size={13}/>
            </button>
            <button onClick={()=>setGuideOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={20} className="text-gray-600"/>
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Desktop sidebar */}
          <aside className="hidden md:flex flex-col w-56 border-r border-gray-100 bg-gray-50/50 overflow-y-auto flex-shrink-0">
            <nav className="p-2 space-y-0.5">
              {GUIDE_ITEMS.map(g => {
                const GIcon = g.icon;
                const gc = COLOR[g.color] || COLOR.slate;
                const isA = g.id === activeGuideId;
                return (
                  <button key={g.id} onClick={()=>setActiveGuideId(g.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${isA?`${gc.active} shadow-sm`:'hover:bg-white text-gray-700'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isA?'bg-white/25':gc.icon}`}><GIcon size={14}/></div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-semibold truncate ${isA?'':'text-gray-900'}`}>{g.title}</div>
                      <div className={`text-[9px] truncate ${isA?'opacity-70':'text-gray-400'}`}>{g.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile accordion TOC */}
          <div className="md:hidden absolute left-0 right-0 z-10 px-3 pt-2" style={{top:'57px'}}>
            <button onClick={()=>setTocOpen(o=>!o)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${ac.border} ${ac.bg} shadow-sm`}>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${ac.icon}`}><ActiveIcon size={14}/></div>
              <div className="flex-1 min-w-0 text-left"><div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-0.5">{tocOpen?'Select a feature':'Now viewing'}</div><div className="text-sm font-bold text-gray-900 truncate">{active.title}</div></div>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-white/60 border border-gray-200 transition-transform ${tocOpen?'rotate-180':''}`}><ChevronDown size={13} className="text-gray-600"/></div>
            </button>
            {tocOpen && (
              <div className="mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                {GUIDE_ITEMS.map(g=>{
                  const GIcon=g.icon;const gc=COLOR[g.color]||COLOR.slate;const isA=g.id===activeGuideId;
                  return(<button key={g.id} onClick={()=>{setActiveGuideId(g.id);setTocOpen(false);}}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0 transition-colors ${isA?gc.active:'hover:bg-gray-50'}`}>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${isA?'bg-white/25':gc.icon}`}><GIcon size={13}/></div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-gray-900 truncate">{g.title}</div><div className="text-[9px] text-gray-400">{g.subtitle}</div></div>
                    {isA&&<CheckCircle size={13} className="flex-shrink-0 opacity-70"/>}
                  </button>);
                })}
              </div>
            )}
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16 md:mt-0">
            {/* Feature header */}
            <div className={`rounded-2xl border-2 ${ac.border} ${ac.bg} p-4 mb-4 flex items-start gap-3`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ac.icon}`}><ActiveIcon size={20}/></div>
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{active.subtitle}</div>
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">{active.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{active.desc}</p>
              </div>
            </div>
            {/* Mockup */}
            {active.mockup && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/><span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Live UI Preview</span><div className="flex-1 h-px bg-gray-100"/></div>
                {active.mockup}
              </div>
            )}
            {/* Highlights */}
            {active.highlights && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/><span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Key Capabilities</span><div className="flex-1 h-px bg-gray-100"/></div>
                <ul className="space-y-2">
                  {active.highlights.map((h,i)=>(
                    <li key={i} className="flex items-start gap-2.5 p-3 bg-white border border-gray-100 rounded-xl">
                      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5"/>
                      <span className="text-sm text-gray-700">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Prev / Next */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {(() => {
                const idx = GUIDE_ITEMS.findIndex(g=>g.id===activeGuideId);
                const prev = GUIDE_ITEMS[idx-1]; const next = GUIDE_ITEMS[idx+1];
                return (<>
                  {prev?<button onClick={()=>setActiveGuideId(prev.id)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"><ChevronRight size={14} className="rotate-180 flex-shrink-0"/><span className="truncate max-w-[140px]">{prev.title}</span></button>:<div/>}
                  {next?<button onClick={()=>setActiveGuideId(next.id)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"><span className="truncate max-w-[140px]">{next.title}</span><ChevronRight size={14} className="flex-shrink-0"/></button>:<div/>}
                </>);
              })()}
            </div>
            {/* CTA at bottom */}
            <div className="mt-8 p-5 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl text-white text-center">
              <div className="text-base font-extrabold mb-1">Ready to get started?</div>
              <div className="text-sm text-blue-200 mb-4">5-day free trial · No credit card required</div>
              <button onClick={()=>router.push('/register')} className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-blue-800 rounded-xl text-sm font-extrabold hover:bg-blue-50 transition-colors">
                Create Free Account <ArrowRight size={15}/>
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <style>{`
        html{scroll-behavior:smooth}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{opacity:.5}50%{opacity:.9}}
        @keyframes pulse-ring{0%{transform:scale(.95);opacity:.7}70%{transform:scale(1.1);opacity:0}100%{opacity:0}}
        .h1{animation:fadeUp .65s ease both}
        .h2{animation:fadeUp .65s .12s ease both}
        .h3{animation:fadeUp .65s .24s ease both}
        .h4{animation:fadeUp .65s .36s ease both}
        .h5{animation:fadeUp .65s .48s ease both}
        .glow{animation:glow 3s ease-in-out infinite}
        .ring{animation:pulse-ring 2s ease-out infinite}
        .nav-ul{list-style:none}
        .nl::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:#1d4ed8;transition:width .2s}
        .nl:hover::after{width:100%}
        .card-hover{transition:transform .2s,box-shadow .2s}
        .card-hover:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.1)}
        .feat-card{cursor:pointer;transition:transform .18s,box-shadow .18s,border-color .18s}
        .feat-card:hover{transform:translateY(-5px);box-shadow:0 16px 40px rgba(0,0,0,.12)}
        .faq-body{overflow:hidden;transition:max-height .32s ease,opacity .22s ease}
        .sl{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
        .badge{display:inline-flex;align-items:center;gap:.35rem;padding:.28rem .75rem;background:#eff6ff;color:#1d4ed8;border-radius:99px}
      `}</style>

      {/* ═══════════════════════════════════════════════ HEADER */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled?'bg-white/97 backdrop-blur-md shadow-sm border-b border-gray-100':''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={()=>go('hero')} className="flex items-center gap-2.5 group">
            <Image src="/nisab-logo.png" alt="Nisab Wallet" width={36} height={36} className="rounded-xl group-hover:scale-105 transition-transform"/>
            <span className="text-lg font-extrabold tracking-tight text-gray-900">Nisab<span className="text-blue-700">Wallet</span></span>
          </button>
          <nav className="hidden md:flex items-center gap-7">
            {[['features','Features'],['app-preview','App Preview'],['how-it-works','How It Works'],['pricing','Pricing'],['reviews','Reviews'],['faq','FAQ']].map(([id,label])=>(
              <button key={id} onClick={()=>go(id)} className="nl relative text-sm font-medium text-gray-600 hover:text-gray-900 pb-0.5 transition-colors">{label}</button>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={()=>setGuideOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all">
              <BookOpen size={14} className="text-blue-600"/> View Guide
            </button>
            <button onClick={()=>router.push('/login')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors">Sign In</button>
            <button onClick={()=>router.push('/register')} className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-bold hover:bg-blue-800 transition-colors shadow-md shadow-blue-700/20">
              Start Free Trial
            </button>
          </div>
          <button onClick={()=>setMenuOpen(v=>!v)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-4 py-4 space-y-1">
              {[['features','Features'],['app-preview','App Preview'],['how-it-works','How It Works'],['pricing','Pricing'],['reviews','Reviews'],['faq','FAQ']].map(([id,label])=>(
                <button key={id} onClick={()=>go(id)} className="block w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">{label}</button>
              ))}
              <button onClick={()=>{setMenuOpen(false);setGuideOpen(true);}} className="block w-full text-left px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2"><BookOpen size={14}/>View Feature Guide</button>
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                <button onClick={()=>router.push('/login')} className="w-full py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Sign In</button>
                <button onClick={()=>router.push('/register')} className="w-full py-2.5 text-sm font-bold text-white bg-blue-700 rounded-lg hover:bg-blue-800">Start 5-Day Free Trial</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════ HERO */}
      <section id="hero" className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="absolute inset-0 pointer-events-none opacity-[0.4]" style={{backgroundImage:'linear-gradient(rgba(59,130,246,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.08) 1px,transparent 1px)',backgroundSize:'52px 52px'}}/>
        <div className="absolute top-20 right-0 w-[700px] h-[700px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none glow"/>
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none"/>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="h1 badge mb-6 sl"><Moon size={13}/> Shariah-Compliant Islamic Finance</div>
              <h1 className="h2 text-5xl lg:text-[3.6rem] font-extrabold text-gray-900 leading-[1.07] tracking-tight mb-5">
                Manage Your Wealth.<br/><span className="text-blue-700">Fulfil Your Zakat.</span><br/>With Total Confidence.
              </h1>
              <p className="h3 text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                The all-in-one platform for Muslim personal finance — automated Zakat cycle tracking, multi-account wealth management, investment portfolio, budgets, loans, and 12+ powerful modules.
              </p>
              <div className="h4 flex flex-col sm:flex-row gap-3 mb-9">
                <button onClick={()=>router.push('/register')} className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-700 text-white rounded-xl font-bold text-base hover:bg-blue-800 transition-all shadow-xl shadow-blue-700/25 hover:shadow-blue-700/40 hover:scale-[1.02]">
                  Start 5-Day Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                </button>
                <button onClick={()=>setGuideOpen(true)} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-gray-800 border border-gray-300 rounded-xl font-semibold hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                  <BookOpen size={16} className="text-blue-600"/> View Feature Guide
                </button>
              </div>
              <div className="h5 flex flex-wrap gap-5 text-sm text-gray-500">
                {['No credit card required','5-day full access','Cancel anytime','Data encrypted & private'].map(t=>(
                  <span key={t} className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500"/>{t}</span>
                ))}
              </div>
            </div>
            {/* RIGHT — real dashboard preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-slate-200 overflow-hidden">
                <div className="bg-gray-900 px-5 py-2.5 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-400"/><div className="w-3 h-3 rounded-full bg-green-400"/>
                  <span className="ml-3 text-xs text-gray-500 font-mono tracking-wide">nisabwallet.com/dashboard</span>
                </div>
                <div className="p-5 bg-slate-50/70">
                  <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-4 mb-4 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-1.5"><Moon size={14} className="opacity-80"/><span className="text-xs font-semibold opacity-80 sl">Zakat Status</span></div><span className="text-[11px] bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">Active Cycle</span></div>
                    <div className="text-2xl font-extrabold mb-0.5">৳ 8,42,500</div>
                    <div className="text-xs opacity-70 mb-3">Total Wealth · Nisab Threshold: ৳ 1,24,300</div>
                    <div className="flex justify-between text-xs mb-1 opacity-80"><span>Hijri Year Progress (Hawl)</span><span className="font-bold">218 / 354 days</span></div>
                    <div className="bg-white/15 rounded-full h-2"><div className="bg-white rounded-full h-2 transition-all" style={{width:'61.6%'}}/></div>
                    <div className="mt-2 text-[11px] opacity-60">136 days until Zakat assessment · Started 15 Rajab 1446</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {[{label:'Bank Account',val:'৳ 5,12,000',I:Building2,c:'blue'},{label:'bKash',val:'৳ 84,500',I:CreditCard,c:'violet'},{label:'Cash in Hand',val:'৳ 1,26,000',I:Wallet,c:'emerald'},{label:'Gold (22g)',val:'৳ 1,20,000',I:Coins,c:'amber'}].map(a=>(
                      <div key={a.label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                        <div className={`w-7 h-7 rounded-lg mb-2 flex items-center justify-center bg-${a.c}-50 border border-${a.c}-100`}><a.I size={14} className={`text-${a.c}-600`}/></div>
                        <div className="text-[11px] text-gray-500 mb-0.5">{a.label}</div>
                        <div className="text-sm font-extrabold text-gray-900">{a.val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2.5"><span className="text-xs font-bold text-gray-800">Monthly Overview</span><span className="text-[11px] text-blue-600 font-semibold">Mar 2026</span></div>
                    <div className="flex items-end gap-1 h-12">{[35,58,42,75,50,66,88,55,70,82,45,100].map((h,i)=><div key={i} className="flex-1 rounded-t transition-all" style={{height:`${h}%`,background:i===11?'#1d4ed8':i>7?'#93c5fd':'#dbeafe'}}/>)}</div>
                    <div className="flex justify-between mt-1.5"><span className="text-[10px] text-emerald-600 font-semibold">↑ Income ৳ 95,000</span><span className="text-[10px] text-red-500 font-semibold">↓ Expense ৳ 42,300</span></div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 bg-white border border-gray-200 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 ring ring-emerald-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0"><BadgeCheck size={20} className="text-emerald-600"/></div>
                <div><div className="text-xs font-extrabold text-gray-900">Zakat Due: ৳ 21,063</div><div className="text-[10px] text-gray-500">2.5% of ৳ 8,42,500 · Pay now</div></div>
              </div>
              <div className="absolute -top-5 -right-3 bg-white border border-gray-200 rounded-2xl shadow-xl px-3.5 py-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Lock size={15} className="text-blue-700"/></div>
                <div><div className="text-[11px] font-bold text-gray-900">Bank-Grade Security</div><div className="text-[10px] text-gray-500">End-to-end encrypted</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ STATS BAR */}
      <div className="border-y border-gray-100 bg-white py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[{label:'Active Users',v:liveStats.users,suf:'+',Icon:Users,dec:0},{label:'Transactions Logged',v:liveStats.tx,suf:'+',Icon:Receipt,dec:0,div:1000,dsuf:'K+'},{label:'Average Rating',v:liveStats.rating,suf:'★',Icon:Star,dec:1,color:'text-amber-500'},{label:'Zakat Cycles Tracked',v:liveStats.cycles,suf:'+',Icon:Moon,dec:0}].map((s,i)=>{
            const Icon=s.Icon;
            return(<div key={i} className="text-center"><div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Icon size={18} className={s.color||'text-blue-700'}/></div><div className={`text-3xl font-extrabold mb-1 ${s.color||'text-gray-900'}`}><Counter end={s.div?s.v/1000:s.v} suffix={s.div?s.dsuf:s.suf} decimals={s.dec||0}/></div><div className="text-sm text-gray-500">{s.label}</div></div>);
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ FEATURES */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <Fade className="text-center mb-14">
            <div className="badge sl mb-4"><Zap size={12}/>Platform Features</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">12+ Modules Built for Muslim Finance</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From Zakat automation to investment tracking, every feature is purpose-built. <span className="text-blue-700 font-semibold">Click any card</span> to see a live UI preview.
            </p>
          </Fade>

          {/* All 12 features — no pagination */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {CORE_FEATURES.map((f, i) => {
              const Icon = f.icon;
              const c = COLOR[f.color] || COLOR.slate;
              const hasDetail = !!FEATURE_DETAILS[f.title];
              return (
                <Fade key={f.title} delay={i * 50}>
                  <button
                    onClick={() => hasDetail && setFeatModal(f.title)}
                    className={`feat-card text-left w-full h-full p-6 rounded-2xl border-2 ${c.border} ${c.bg} ${hasDetail?'hover:border-opacity-80':''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
                        <Icon size={20}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`sl text-[10px] px-2 py-0.5 rounded-full ${c.tag}`}>{f.tag}</span>
                          {hasDetail && <span className="text-[9px] text-gray-400 font-medium flex items-center gap-0.5"><Eye size={9}/>Preview</span>}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1.5">{f.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  </button>
                </Fade>
              );
            })}
          </div>

          {/* View guide CTA strip */}
          <Fade>
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0"><BookOpen size={22} className="text-white"/></div>
                <div>
                  <div className="font-extrabold text-gray-900 text-lg">Want step-by-step walkthroughs?</div>
                  <div className="text-sm text-gray-600 mt-0.5">The Feature Guide covers every module with live UI previews and detailed how-to instructions.</div>
                </div>
              </div>
              <button onClick={()=>setGuideOpen(true)} className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-all shadow-lg shadow-blue-700/20 hover:shadow-blue-700/30">
                Open Feature Guide <ArrowRight size={16}/>
              </button>
            </div>
          </Fade>

          {/* Account types row */}
          <Fade className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-semibold text-gray-700 mr-2">Supported Account Types:</span>
              {ACCOUNT_TYPES.map(t=>(
                <span key={t} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">{t}</span>
              ))}
            </div>
          </Fade>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ APP PREVIEW */}
      <section id="app-preview" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-950 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <Fade className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 border border-blue-800/50 text-blue-300 rounded-full text-[11px] font-bold mb-4 tracking-widest uppercase">
              <Sparkles size={12}/>Real Dashboard Interface
            </div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">This Is Your Dashboard</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Every screen you see below is the actual interface — built for clarity, speed, and ease of use across all ages.
            </p>
          </Fade>

          {/* 3-column mockup grid */}
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            <Fade delay={0}>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Zakat Tracker</div>
                <ZakatFeatureMockup/>
              </div>
            </Fade>
            <Fade delay={80}>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Analytics</div>
                <AnalyticsFeatureMockup/>
              </div>
            </Fade>
            <Fade delay={160}>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Budget Management</div>
                <BudgetsFeatureMockup/>
              </div>
            </Fade>
            <Fade delay={240}>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Financial Goals</div>
                <GoalsFeatureMockup/>
              </div>
            </Fade>
            <Fade delay={320}>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Investment Portfolio</div>
                <InvestmentsFeatureMockup/>
              </div>
            </Fade>
            <Fade delay={400}>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Transactions</div>
                <TransactionsFeatureMockup/>
              </div>
            </Fade>
          </div>

          <Fade className="text-center">
            <button onClick={()=>setGuideOpen(true)} className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-lg">
              <BookOpen size={16} className="text-blue-700"/> Explore All 12 Features →
            </button>
          </Fade>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <Fade className="text-center mb-14">
            <div className="badge sl mb-4"><BookOpen size={12}/>Getting Started</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Up and Running in 4 Steps</h2>
            <p className="text-lg text-gray-600">Simple enough for first-time users, powerful enough for seasoned finance professionals.</p>
          </Fade>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((s,i)=>{const Icon=s.icon;return(
              <Fade key={i} delay={i*80}>
                <div className="card-hover relative bg-white border border-gray-200 rounded-2xl p-6 h-full">
                  <div className="text-6xl font-black text-gray-100 leading-none mb-4 select-none">{s.n}</div>
                  <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-4"><Icon size={20} className="text-blue-700"/></div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  {i<HOW_STEPS.length-1&&<div className="hidden lg:flex absolute top-8 -right-3 z-10 w-6 h-6 bg-blue-600 rounded-full items-center justify-center shadow-md"><ChevronRight size={14} className="text-white"/></div>}
                </div>
              </Fade>
            );})}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ ZAKAT GUIDE */}
      <section id="zakat-guide" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-950 text-white scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <Fade className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 border border-blue-800/50 text-blue-300 rounded-full text-[11px] font-bold mb-4 tracking-widest uppercase"><Moon size={12}/>Hawl & Nisab</div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">The Zakat Cycle, Fully Automated</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">Nisab Wallet implements the complete Shariah methodology — detecting your Nisab crossing, tracking your Hawl, and calculating your obligation automatically.</p>
          </Fade>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {ZAKAT_STEPS.map((s,i)=>(
              <Fade key={i} delay={i*70}>
                <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors h-full">
                  <div className="text-5xl font-black text-white/[.07] leading-none mb-3">{s.n}</div>
                  <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                  {i<ZAKAT_STEPS.length-1&&<div className="hidden lg:flex absolute top-6 -right-3 z-10 w-6 h-6 bg-blue-700 rounded-full items-center justify-center"><ChevronRight size={13} className="text-white"/></div>}
                </div>
              </Fade>
            ))}
          </div>
          <Fade>
            <div className="grid md:grid-cols-3 gap-4">
              {[{Icon:Coins,title:'Silver Nisab',val:'52.5 Tola',sub:'≈ 612.36 grams of silver',note:'Recommended standard'},{Icon:Award,title:'Gold Nisab',val:'7.5 Tola',sub:'≈ 87.48 grams of gold',note:'Alternative standard'},{Icon:Target,title:'Zakat Rate',val:'2.5%',sub:'Of total eligible wealth',note:'After full Hijri year'}].map(({Icon,title,val,sub,note},i)=>(
                <div key={i} className="bg-blue-900/30 border border-blue-800/40 rounded-xl px-5 py-4 flex items-center gap-4">
                  <div className="w-11 h-11 bg-blue-700/40 rounded-xl flex items-center justify-center flex-shrink-0"><Icon size={20} className="text-blue-300"/></div>
                  <div><div className="text-[11px] text-blue-400 font-bold mb-0.5 sl">{title}</div><div className="text-xl font-extrabold text-white">{val}</div><div className="text-xs text-gray-500">{sub}</div><div className="text-[10px] text-blue-600 mt-0.5 font-semibold">{note}</div></div>
                </div>
              ))}
            </div>
          </Fade>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ PRICING */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <Fade className="text-center mb-14">
            <div className="badge sl mb-4"><CreditCard size={12}/>Transparent Pricing</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Simple Plans. No Hidden Fees.</h2>
            <p className="text-lg text-gray-600">All plans include a 5-day free trial with full access. No credit card required.</p>
          </Fade>
          {plansLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-500"><div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"/>Loading plans…</div>
          ) : (
            <div className={`grid gap-6 max-w-5xl mx-auto ${plans.length===1?'max-w-sm':plans.length===2?'md:grid-cols-2 max-w-2xl':'md:grid-cols-3'}`}>
              {plans.map((plan,idx)=>{
                const pop=plan.isMostPopular;
                const feats=Array.isArray(plan.features)?plan.features:['Full Zakat Cycle Tracking','Multi-Account Management','Income & Expense Analytics','PDF Reports','Priority Support'];
                return(
                  <Fade key={plan.id||idx} delay={idx*80}>
                    <div className={`card-hover relative rounded-2xl border-2 overflow-hidden h-full flex flex-col ${pop?'border-blue-600 shadow-2xl shadow-blue-100':'border-gray-200 bg-white'}`}>
                      {pop&&<div className="bg-blue-700 text-white text-xs font-extrabold tracking-widest uppercase text-center py-2">✦ Most Popular</div>}
                      <div className="p-7 flex flex-col flex-1">
                        <div>
                          <h3 className="text-xl font-extrabold text-gray-900 mb-1">{plan.name}</h3>
                          <div className="text-xs text-gray-500 mb-5">{plan.duration||`${plan.durationDays} days access`}</div>
                          <div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-extrabold text-gray-900">৳{plan.price?.toLocaleString()}</span><span className="text-gray-500 text-sm font-medium">/ {plan.duration||'period'}</span></div>
                          <ul className="space-y-3 mb-8">{feats.map((f,fi)=><li key={fi} className="flex items-start gap-2.5 text-sm text-gray-700"><CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5"/>{f}</li>)}</ul>
                        </div>
                        <button onClick={()=>router.push(`/register?plan=${plan.id}`)} className={`mt-auto w-full py-3.5 rounded-xl text-sm font-extrabold transition-all ${pop?'bg-blue-700 text-white hover:bg-blue-800 shadow-lg':'bg-gray-900 text-white hover:bg-gray-800'}`}>Get Started →</button>
                      </div>
                    </div>
                  </Fade>
                );
              })}
            </div>
          )}
          <Fade className="text-center mt-8 text-sm text-gray-500">All prices in BDT (Bangladeshi Taka). Subscriptions are renewed manually — you'll always get a reminder before expiry.</Fade>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ TESTIMONIALS */}
      <section id="reviews" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <Fade className="text-center mb-14">
            <div className="badge sl mb-4"><Star size={12}/>User Reviews</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Trusted Across Bangladesh</h2>
            <p className="text-lg text-gray-600">Real feedback from Muslims who use Nisab Wallet every day.</p>
          </Fade>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayT.slice(0,6).map((t,i)=>(
              <Fade key={t.id||i} delay={i*60}>
                <div className="card-hover bg-white border border-gray-200 rounded-2xl p-6 h-full flex flex-col">
                  <Stars n={t.rating}/>
                  <p className="text-sm text-gray-700 mt-4 mb-5 leading-relaxed flex-1">"{t.msg}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">{t.name.charAt(0)}</div>
                    <div><div className="text-sm font-bold text-gray-900">{t.name}</div><div className="text-xs text-gray-500">{t.role}</div></div>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <Fade className="text-center mb-14">
            <div className="badge sl mb-4"><AlignLeft size={12}/>FAQ</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything you need to know before getting started.</p>
          </Fade>
          <div className="space-y-3">
            {FAQS.map((f,i)=>(
              <Fade key={i} delay={i*40}>
                <div className={`bg-white border rounded-xl overflow-hidden transition-all ${openFaq===i?'border-blue-300 shadow-sm':'border-gray-200 hover:border-gray-300'}`}>
                  <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between px-5 py-4 text-left gap-4">
                    <span className="font-semibold text-gray-900 text-sm leading-snug">{f.q}</span>
                    <ChevronDown size={17} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq===i?'rotate-180 text-blue-600':''}`}/>
                  </button>
                  <div className={`faq-body px-5 ${openFaq===i?'max-h-60 opacity-100 pb-4':'max-h-0 opacity-0'}`}>
                    <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ CTA */}
      <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'radial-gradient(circle at 70% 50%,rgba(99,102,241,.4) 0%,transparent 55%),radial-gradient(circle at 20% 80%,rgba(59,130,246,.3) 0%,transparent 45%)'}}/>
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{backgroundImage:'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Fade>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 border border-white/20 text-blue-100 rounded-full text-[11px] font-bold mb-6 tracking-widest uppercase"><Sparkles size={12}/>5-Day Free Trial · No Card Required</div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">Your Zakat. Your Wealth.<br className="hidden sm:block"/> Your Peace of Mind.</h2>
            <p className="text-lg text-blue-200 mb-8 max-w-xl mx-auto">Join thousands of Muslims across Bangladesh managing their finances and Zakat obligations with confidence on Nisab Wallet.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={()=>router.push('/register')} className="group inline-flex items-center gap-2.5 px-8 py-4 bg-white text-blue-800 rounded-xl font-extrabold text-base hover:bg-blue-50 transition-all shadow-2xl hover:scale-105">
                Create Your Free Account <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
              </button>
              <button onClick={()=>setGuideOpen(true)} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white/15 border border-white/30 text-white rounded-xl font-bold text-base hover:bg-white/25 transition-all">
                <BookOpen size={18}/> View Feature Guide
              </button>
            </div>
          </Fade>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ FOOTER */}
      <footer className="bg-gray-950 text-gray-400 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-10 pb-12 border-b border-white/5">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2.5 mb-4"><Image src="/nisab-logo.png" alt="Nisab Wallet" width={36} height={36} className="rounded-xl"/><span className="text-lg font-extrabold text-white">Nisab<span className="text-blue-400">Wallet</span></span></div>
              <p className="text-sm leading-relaxed text-gray-500 mb-5 max-w-sm">A Shariah-compliant personal finance platform designed to help Muslims manage their wealth, track spending, grow their investments, and fulfil their Zakat obligations — all in one secure place.</p>
              <div className="flex gap-2">
                {[{Icon:Mail,href:'mailto:support@nisabwallet.com',tip:'Email'},{Icon:Phone,href:'tel:+8801234567890',tip:'Phone'},{Icon:Globe,href:'#',tip:'Website'}].map(({Icon,href,tip})=>(
                  <a key={tip} href={href} title={tip} className="w-9 h-9 bg-white/5 hover:bg-blue-700 border border-white/10 rounded-lg flex items-center justify-center transition-colors"><Icon size={15}/></a>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                {[['features','Features'],['app-preview','App Preview'],['how-it-works','How It Works'],['pricing','Pricing'],['reviews','Reviews'],['faq','FAQ']].map(([id,l])=>(
                  <li key={id}><button onClick={()=>go(id)} className="hover:text-white transition-colors">{l}</button></li>
                ))}
                <li><button onClick={()=>setGuideOpen(true)} className="hover:text-white transition-colors flex items-center gap-1"><BookOpen size={11}/>Feature Guide</button></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-sm mb-4">Account</h4>
              <ul className="space-y-2.5 text-sm">
                {[['Create Account','/register'],['Sign In','/login'],['Reset Password','/forgot-password']].map(([l,h])=>(
                  <li key={l}><button onClick={()=>router.push(h)} className="hover:text-white transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                {[['About Us','about'],['Contact','contact'],['Privacy Policy','privacy'],['Terms of Service','terms']].map(([l,m])=>(
                  <li key={l}><button onClick={()=>setModal(m)} className="hover:text-white transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-sm mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                {[{Icon:Mail,t:'support@nisabwallet.com',h:'mailto:support@nisabwallet.com'},{Icon:Phone,t:'+880 1234-567890',h:'tel:+8801234567890'},{Icon:MapPin,t:'Dhaka, Bangladesh',h:null},{Icon:Clock,t:'Mon–Fri 9AM–6PM (GMT+6)',h:null}].map(({Icon,t,h},i)=>(
                  <li key={i} className="flex items-start gap-2"><Icon size={13} className="mt-0.5 flex-shrink-0 text-blue-500"/>{h?<a href={h} className="hover:text-white transition-colors">{t}</a>:<span>{t}</span>}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <span>© {new Date().getFullYear()} Nisab Wallet. All rights reserved.</span>
            <span className="flex items-center gap-1">Built with <Heart size={12} className="text-red-500 fill-red-500 mx-1"/> for the Muslim community · Bangladesh</span>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════ MODALS */}
      {modal==='about' && (
        <Modal title="About Nisab Wallet">
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>Nisab Wallet is a comprehensive Islamic personal finance platform built for Muslims who want to manage their wealth with clarity and fulfil their Zakat obligations accurately.</p>
            <div><h3 className="font-bold text-gray-900 mb-2">Our Mission</h3><p>To make Islamic finance management accessible, accurate, and effortless — regardless of a user's financial background or technical experience.</p></div>
            <div><h3 className="font-bold text-gray-900 mb-2">Our Values</h3><ul className="space-y-2">{[['Shariah Compliance','Every calculation follows established Islamic jurisprudence'],['Transparency','All Zakat calculations are fully visible and explainable'],['Security','Bank-grade encryption and strict per-user data access controls'],['Accessibility','Designed for users of all ages and technical levels']].map(([t,d])=><li key={t} className="flex items-start gap-2"><CheckCircle size={15} className="text-emerald-500 mt-0.5 flex-shrink-0"/><span><strong>{t}:</strong> {d}</span></li>)}</ul></div>
          </div>
        </Modal>
      )}
      {modal==='contact' && (
        <Modal title="Contact Us">
          <div className="space-y-4">
            {[{Icon:Mail,title:'Email Support',sub:'Response within 24 hours',val:'support@nisabwallet.com',href:'mailto:support@nisabwallet.com'},{Icon:Phone,title:'Phone Support',sub:'Mon–Fri, 9AM–6PM (GMT+6)',val:'+880 1234-567890',href:'tel:+8801234567890'},{Icon:MapPin,title:'Office',sub:'Dhaka, Bangladesh',val:'House #123, Road #4, Dhanmondi, Dhaka 1209',href:null}].map(({Icon,title,sub,val,href})=>(
              <div key={title} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-blue-700"/></div><div><div className="font-semibold text-gray-900 text-sm mb-0.5">{title}</div><div className="text-xs text-gray-500 mb-1">{sub}</div>{href?<a href={href} className="text-sm text-blue-600 hover:underline">{val}</a>:<span className="text-sm text-gray-700">{val}</span>}</div></div>
            ))}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900"><strong>Already a user?</strong> Use the Feedback section in your dashboard for the fastest response.</div>
          </div>
        </Modal>
      )}
      {modal==='privacy' && (
        <Modal title="Privacy Policy">
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p>
            {[['1. Information We Collect','We collect your name, email, and financial data you input. We also collect anonymous usage data to improve the platform.'],['2. How We Use Your Data','To provide the service, calculate Zakat, send account notifications, and improve platform performance. We never use your data for advertising.'],['3. Data Security','All data is stored in Firebase with end-to-end encryption and strict per-user Firestore rules. Data is encrypted in transit and at rest.'],['4. Data Sharing','We never sell or share your personal data. Only essential service providers are used, all bound by strict confidentiality agreements.'],['5. Your Rights','Access, update, or delete your data anytime via Settings. Export a full backup of all financial records as JSON from the Settings page.'],['6. Contact','privacy@nisabwallet.com']].map(([h,b])=><div key={h}><h3 className="font-bold text-gray-900 mb-1">{h}</h3><p>{b}</p></div>)}
          </div>
        </Modal>
      )}
      {modal==='terms' && (
        <Modal title="Terms of Service">
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p>
            {[['1. Acceptance','By using Nisab Wallet you agree to these Terms. Please do not use the platform if you disagree.'],['2. Use of Service','You agree to use the service lawfully. You are responsible for maintaining account security and confidentiality.'],['3. Subscription & Payments','All plans include a 5-day free trial. Payments are verified manually within 24 hours. Prices are in BDT and subject to 30-days notice for changes.'],['4. Zakat Calculations','We follow accepted fiqh methodology and aim for full accuracy. However, we recommend consulting a qualified Islamic scholar for your final obligation.'],['5. Limitation of Liability','Nisab Wallet is provided "as is". We are not liable for financial decisions made based on platform data.'],['6. Termination','We may terminate access for violations of these Terms.'],['7. Contact','legal@nisabwallet.com']].map(([h,b])=><div key={h}><h3 className="font-bold text-gray-900 mb-1">{h}</h3><p>{b}</p></div>)}
          </div>
        </Modal>
      )}

      {/* ── Feature detail modal ── */}
      {featModal && <FeatModal/>}

      {/* ── Full-screen guide drawer ── */}
      {guideOpen && <GuideDrawer/>}
    </div>
  );
}