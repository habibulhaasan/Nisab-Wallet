// src/app/page.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Moon, Star, ArrowRight, ChevronDown, X, Menu, Check,
  Wallet, Building2, CreditCard, Coins, TrendingUp, TrendingDown,
  BarChart3, PiggyBank, Target, Repeat, HandCoins, FileText,
  ShoppingBag, Receipt, BookOpen, Zap, Users, BadgeCheck,
  Lock, Shield, Globe, Mail, Phone, MapPin, Clock, Heart,
  ArrowRightLeft, Eye, CheckCircle, Sparkles, Award,
  ChevronRight, Landmark,
} from 'lucide-react';

// ─── Tiny hooks ───────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect(); } }, { threshold });
    o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return [ref, vis];
}

function useCount(end, duration = 1600) {
  const [v, setV] = useState(0);
  const [ref, vis] = useInView(0.5);
  useEffect(() => {
    if (!vis) return;
    let s = null, id;
    const step = (t) => {
      if (!s) s = t;
      const p = Math.min((t - s) / duration, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [vis, end, duration]);
  return [ref, v];
}

// ─── Scroll-reveal wrapper ─────────────────────────────────────────────────────
function R({ children, className = '', delay = 0, from = 'bottom' }) {
  const [ref, vis] = useInView();
  const origins = { bottom: 'translate-y-8', left: '-translate-x-8', right: 'translate-x-8', none: '' };
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms`, transitionDuration: '600ms' }}
      className={`transition-all ease-out ${vis ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${origins[from]}`} ${className}`}>
      {children}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Moon,        title: 'Zakat Cycle Engine',       tag: 'Shariah Core',    desc: 'Automated Hawl tracking — Nisab detection, dual-calendar cycle start, 2.5% calculation and full payment history.',   color: '#10b981' },
  { icon: Coins,       title: 'Live Nisab Threshold',     tag: 'Live Prices',     desc: 'Silver price fetched automatically. Nisab recalculated in real time. Alerts the instant you cross the threshold.',     color: '#6366f1' },
  { icon: Building2,   title: 'Multi-Account Hub',        tag: 'Wealth Overview', desc: 'Cash, Bank, bKash, Nagad, Gold, Silver — unified total with immutable IDs so history never breaks.',                  color: '#0ea5e9' },
  { icon: BarChart3,   title: 'Smart Analytics',          tag: 'Insights',        desc: 'Weekly, monthly, yearly and custom ranges. Bar, pie and line charts. Category-by-category income vs expense.',         color: '#8b5cf6' },
  { icon: TrendingUp,  title: 'Investment Portfolio',     tag: 'Investments',     desc: 'Stocks, DPS, FDR, Savings Certs, Mutual Funds, Crypto, Real Estate — all with return % and dividend tracking.',       color: '#10b981' },
  { icon: PiggyBank,   title: 'Budget Management',        tag: 'Budgeting',       desc: 'Set monthly limits per category. Live progress bars warn at 80%, turn red when over. Always know what is left.',       color: '#f59e0b' },
  { icon: Target,      title: 'Financial Goals',          tag: 'Goals',           desc: 'Define targets with deadlines. Deposit and withdraw. Track progress visually. Celebrate when you hit every milestone.',  color: '#f97316' },
  { icon: Repeat,      title: 'Recurring Transactions',   tag: 'Automation',      desc: 'Automate salary, rent, bills and subscriptions. Pause, resume and edit anytime. Manual-confirm mode for variable costs.',color: '#06b6d4' },
  { icon: HandCoins,   title: 'Loans & Lending',          tag: 'Debt Tracking',   desc: 'Track borrowed and lent money separately. Due-date alerts, Qard Hasan labels, repayment history per person.',         color: '#f43f5e' },
  { icon: FileText,    title: 'Tax File Management',      tag: 'Tax',             desc: 'Bangladesh July–June fiscal year. Map categories to income heads. Countdown to the 30 Nov filing deadline.',           color: '#eab308' },
  { icon: ShoppingBag, title: 'Shopping Lists',           tag: 'Planning',        desc: 'Plan before you spend. Named carts, tick-off items, estimated vs actual totals. Stay aligned with your budget.',        color: '#ec4899' },
  { icon: Receipt,     title: 'Transaction Management',   tag: 'Transactions',    desc: 'Full CRUD on every entry. Filter by date, category, account. Transfers recorded as balanced paired entries.',           color: '#64748b' },
];

const STEPS = [
  { n: '01', title: 'Sign Up Free',         desc: 'Create your account in under a minute. Full access for 5 days — no card needed.' },
  { n: '02', title: 'Add Your Accounts',    desc: 'Cash, Bank, Mobile Banking, Gold, Silver. Starting balances entered immediately.' },
  { n: '03', title: 'Log Transactions',     desc: 'Income, expenses, transfers. Set up recurring entries once and forget about them.' },
  { n: '04', title: 'Zakat Runs Itself',    desc: 'The engine watches your wealth, starts the Hawl, and tells you exactly when and how much.' },
];

const FAQS = [
  { q: 'What is Nisab Wallet?',                        a: 'A complete Islamic personal finance platform — automated Zakat cycle tracking, multi-account wealth management, analytics, budgeting, investments, loans, recurring transactions, tax filing and more.' },
  { q: 'How accurate is the Zakat calculation?',       a: 'We follow the established fiqh methodology: wealth ≥ silver Nisab (52.5 Tola / 612.36g) for a full Hijri year (Hawl), then 2.5% of eligible assets. Always confirm your final obligation with a qualified scholar.' },
  { q: 'How does the 5-day free trial work?',          a: 'Every new account gets full platform access for 5 days, no credit card required. After the trial, pick any plan. Your data is kept even if you do not subscribe immediately.' },
  { q: 'Which account types are supported?',           a: 'Cash, Bank Account, Mobile Banking (bKash, Nagad, Rocket), Gold, and Silver. Each account has an immutable ID so renaming never breaks your historical analytics.' },
  { q: 'Can I track investments and loans?',           a: 'Yes. Stocks, Mutual Funds, DPS, FDR, Savings Certs, Bonds, PPF, Pension, Crypto, Real Estate. Loans tracks debt with due dates; Lendings tracks money you have given to others.' },
  { q: 'Is my data private and secure?',               a: 'All data is in Firebase with per-user Firestore security rules. We never sell or share your records. Export a full JSON backup from Settings at any time.' },
  { q: 'What payment methods do you accept?',          a: 'bKash, Nagad, Rocket, bank transfer and cash. Our team verifies manually within 24 hours. You get an in-app notification once approved.' },
];

const T_FALLBACK = [
  { id:1, name:'Ahmed Al-Rashid', role:'Business Owner, Dhaka',   rating:5, msg:'For the first time I\'m completely confident about my Zakat. The system started the cycle automatically when my wealth hit Nisab and reminded me exactly 354 days later.' },
  { id:2, name:'Fatima Begum',    role:'Teacher, Chittagong',      rating:5, msg:'I was nervous about finance apps — too complicated. This one is different. Large buttons, clear labels, everything explained. My elderly mother uses it too.' },
  { id:3, name:'Mohammad Hasan',  role:'IT Professional, Sylhet',  rating:5, msg:'The investment tracker is superb. I manage stocks, an FDR, and savings certificates all in one place. The PDF reports are professional enough to hand to my accountant.' },
  { id:4, name:'Nadia Rahman',    role:'Homemaker, Rajshahi',      rating:5, msg:'The live Nisab threshold update is what sold me. I don\'t have to look up silver prices anymore. The system knows and adjusts automatically.' },
  { id:5, name:'Karim Uddin',     role:'Pharmacist, Khulna',       rating:4, msg:'Budgets + recurring transactions is a killer combo. I set monthly limits, automate fixed costs, and the app tells me exactly what I have left to spend.' },
  { id:6, name:'Sarah Ahmed',     role:'Entrepreneur, Cumilla',    rating:5, msg:'Switched from a spreadsheet six months ago. The Zakat history alone — every cycle, payment, and amount over the years — is worth the subscription.' },
];

const FALLBACK_PLANS = [
  { id:'m1', name:'1 Month',  price:99,  duration:'1 Month',  isMostPopular:false, features:['Full Zakat Cycle Tracking','Multi-Account Management','Income & Expense Analytics','PDF Reports','Email Support'] },
  { id:'m3', name:'3 Months', price:249, duration:'3 Months', isMostPopular:true,  features:['Everything in 1-Month','Investment Portfolio Tracking','Loan & Lending Tracker','Priority Support','Data Export'] },
  { id:'y1', name:'1 Year',   price:799, duration:'1 Year',   isMostPopular:false, features:['Everything in 3-Months','Tax File Management','Recurring Automation','Annual Zakat History','Dedicated Support'] },
];

// ─── Mini dashboard mockup (inline, no external deps) ─────────────────────────
function DashMockup() {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{background:'#111118'}}>
      {/* Chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{background:'#0d0d14'}}>
        <span className="w-3 h-3 rounded-full bg-red-500/70"/><span className="w-3 h-3 rounded-full bg-yellow-500/70"/><span className="w-3 h-3 rounded-full bg-green-500/70"/>
        <span className="ml-3 text-[11px] text-white/30 font-mono tracking-wide">nisabwallet.com/dashboard</span>
      </div>
      <div className="p-4 space-y-3">
        {/* Zakat status */}
        <div className="rounded-xl p-4" style={{background:'linear-gradient(135deg,#064e3b,#065f46)'}}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Moon size={14} className="text-emerald-400"/><span className="text-[10px] font-bold text-emerald-300 tracking-widest uppercase">Zakat Status</span></div>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">Hawl Active</span>
          </div>
          <div className="text-2xl font-black text-white mb-1">৳ 8,42,500</div>
          <div className="text-[10px] text-emerald-300/60 mb-3">Total wealth · Nisab: ৳1,24,300</div>
          <div className="flex justify-between text-[9px] text-emerald-300/50 mb-1.5"><span>Hijri year progress</span><span className="font-bold text-emerald-300">218 / 354 days</span></div>
          <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{width:'61.6%'}}/></div>
        </div>
        {/* Account grid */}
        <div className="grid grid-cols-2 gap-2">
          {[{l:'Bank Account',v:'৳5,12,000',I:Building2,c:'#6366f1'},{l:'bKash',v:'৳84,500',I:CreditCard,c:'#ec4899'},{l:'Cash',v:'৳1,26,000',I:Wallet,c:'#10b981'},{l:'Gold',v:'৳1,20,000',I:Coins,c:'#f59e0b'}].map((a,i)=>(
            <div key={i} className="rounded-xl p-2.5 border border-white/5" style={{background:'#1a1a24'}}>
              <div className="w-6 h-6 rounded-lg mb-2 flex items-center justify-center" style={{background:a.c+'18'}}><a.I size={12} style={{color:a.c}}/></div>
              <div className="text-[9px] text-white/40 mb-0.5">{a.l}</div>
              <div className="text-xs font-bold text-white">{a.v}</div>
            </div>
          ))}
        </div>
        {/* Chart bar */}
        <div className="rounded-xl p-3 border border-white/5" style={{background:'#1a1a24'}}>
          <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold text-white/60">Monthly</span><span className="text-[9px] text-emerald-400">Mar 2026</span></div>
          <div className="flex items-end gap-0.5 h-8">
            {[30,52,38,70,44,60,82,50,65,78,42,100].map((h,i)=>(
              <div key={i} className="flex-1 rounded-t" style={{height:`${h}%`,background:i===11?'#10b981':i>8?'#10b98166':'#10b98122'}}/>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-emerald-400 font-semibold">↑ ৳95,000</span>
            <span className="text-[9px] text-red-400 font-semibold">↓ ৳42,300</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ f, i, onClick }) {
  const Icon = f.icon;
  return (
    <R delay={i * 40}>
      <button onClick={onClick}
        className="group w-full text-left p-5 rounded-2xl border border-white/5 transition-all duration-200 hover:border-white/15 relative overflow-hidden"
        style={{background:'#111118'}}>
        {/* Hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
          style={{background:`radial-gradient(circle at 30% 50%, ${f.color}0d, transparent 70%)`}}/>
        <div className="relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:f.color+'15'}}>
            <Icon size={18} style={{color:f.color}}/>
          </div>
          <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{color:f.color}}>{f.tag}</div>
          <div className="text-sm font-bold text-white mb-2">{f.title}</div>
          <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
          <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{color:f.color}}>
            <Eye size={10}/> Live preview
          </div>
        </div>
      </button>
    </R>
  );
}

// ─── Feature detail modal ─────────────────────────────────────────────────────
function FeatureModal({ f, onClose, onGuide, onTrial }) {
  if (!f) return null;
  const Icon = f.icon;
  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center sm:p-6 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl" style={{background:'#111118',maxHeight:'90vh'}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:f.color+'18'}}><Icon size={18} style={{color:f.color}}/></div>
          <div className="flex-1"><div className="text-[10px] font-bold tracking-widest uppercase" style={{color:f.color}}>{f.tag}</div><div className="text-sm font-bold text-white">{f.title}</div></div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><X size={15} className="text-white/60"/></button>
        </div>
        <div className="p-6 overflow-y-auto" style={{maxHeight:'55vh'}}>
          <p className="text-sm text-white/60 leading-relaxed mb-6">{f.desc}</p>
          {/* Capability list */}
          <div className="space-y-2.5">
            {(f.bullets || [
              'Full CRUD operations with instant balance updates',
              'Immutable IDs preserve all historical analytics',
              'Works across Cash, Bank, Mobile Banking, Gold & Silver',
              'Mobile-optimised with large touch targets for all ages',
              'Syncs securely with Firebase in real time',
            ]).map((b,i)=>(
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:f.color+'20'}}>
                  <Check size={10} style={{color:f.color}}/>
                </div>
                <span className="text-xs text-white/60 leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button onClick={onTrial} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black transition-colors" style={{background:f.color}}>Start Free Trial</button>
          <button onClick={onGuide} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white/60 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5"><BookOpen size={13}/>Guide</button>
        </div>
      </div>
    </div>
  );
}

// ─── Guide drawer ─────────────────────────────────────────────────────────────
function GuideDrawer({ open, onClose, onTrial }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  if (!open) return null;
  const f = FEATURES[activeIdx];
  const Icon = f.icon;
  return (
    <div className="fixed inset-0 z-[600] flex flex-col" style={{background:'#0a0a0f'}}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/5 flex-shrink-0" style={{background:'#0d0d14'}}>
        <div className="flex items-center gap-3">
          <Image src="/nisab-logo-white.png" alt="Nisab Wallet" width={28} height={28} className="rounded-lg"/>
          <div>
            <div className="text-sm font-bold text-white">Feature Guide</div>
            <div className="text-[10px] text-white/30 hidden sm:block">{FEATURES.length} modules · interactive previews</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onTrial} className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black transition-colors" style={{background:'#10b981'}}>Start Free Trial <ArrowRight size={12}/></button>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><X size={18} className="text-white/50"/></button>
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-52 border-r border-white/5 overflow-y-auto flex-shrink-0 py-2" style={{background:'#0d0d14'}}>
          {FEATURES.map((feat,i)=>{
            const FI = feat.icon; const isA = i===activeIdx;
            return(
              <button key={i} onClick={()=>setActiveIdx(i)} className={`flex items-center gap-3 px-4 py-2.5 transition-all text-left ${isA?'bg-white/5':'hover:bg-white/3'}`}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:feat.color+(isA?'25':'12')}}><FI size={12} style={{color:feat.color}}/></div>
                <div className="min-w-0"><div className={`text-xs font-semibold truncate ${isA?'text-white':'text-white/40'}`}>{feat.title}</div></div>
                {isA && <div className="w-1 h-4 rounded-full flex-shrink-0 ml-auto" style={{background:f.color}}/>}
              </button>
            );
          })}
        </aside>
        {/* Mobile TOC pill */}
        <div className="md:hidden absolute left-0 right-0 px-3 pt-2 z-10" style={{top:'57px'}}>
          <button onClick={()=>setTocOpen(o=>!o)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:f.color+'20'}}><Icon size={13} style={{color:f.color}}/></div>
            <div className="flex-1 min-w-0 text-left"><div className="text-[9px] font-bold uppercase tracking-widest text-white/30">Viewing</div><div className="text-sm font-bold text-white truncate">{f.title}</div></div>
            <ChevronDown size={14} className={`text-white/30 transition-transform ${tocOpen?'rotate-180':''}`}/>
          </button>
          {tocOpen && (
            <div className="mt-1 rounded-2xl border border-white/10 overflow-hidden shadow-xl max-h-64 overflow-y-auto" style={{background:'#111118'}}>
              {FEATURES.map((feat,i)=>{const FI=feat.icon;const isA=i===activeIdx;return(
                <button key={i} onClick={()=>{setActiveIdx(i);setTocOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 transition-colors ${isA?'bg-white/5':''}`}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:feat.color+'18'}}><FI size={11} style={{color:feat.color}}/></div>
                  <span className={`text-sm ${isA?'text-white font-semibold':'text-white/40'}`}>{feat.title}</span>
                  {isA&&<div className="w-1.5 h-1.5 rounded-full ml-auto" style={{background:feat.color}}/>}
                </button>
              );})}
            </div>
          )}
        </div>
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-8 mt-16 md:mt-0">
          <div className="max-w-xl mx-auto">
            <div className="flex items-start gap-4 mb-6 p-5 rounded-2xl border border-white/5" style={{background:'#111118'}}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:f.color+'18'}}><Icon size={22} style={{color:f.color}}/></div>
              <div><div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{color:f.color}}>{f.tag}</div><h2 className="text-xl font-black text-white mb-2">{f.title}</h2><p className="text-sm text-white/50 leading-relaxed">{f.desc}</p></div>
            </div>
            <div className="space-y-2.5 mb-8">
              {(f.bullets||['Full CRUD operations with instant balance updates','Immutable IDs preserve all historical analytics','Works across Cash, Bank, Mobile Banking, Gold & Silver','Mobile-optimised with large touch targets for all ages','Real-time Firebase sync with per-user security rules']).map((b,i)=>(
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5" style={{background:'#111118'}}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:f.color+'20'}}><Check size={10} style={{color:f.color}}/></div>
                  <span className="text-sm text-white/60 leading-relaxed">{b}</span>
                </div>
              ))}
            </div>
            {/* Prev/Next */}
            <div className="flex justify-between mb-8">
              {activeIdx>0?<button onClick={()=>setActiveIdx(i=>i-1)} className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/70 transition-colors"><ChevronRight size={14} className="rotate-180"/>{FEATURES[activeIdx-1].title}</button>:<div/>}
              {activeIdx<FEATURES.length-1?<button onClick={()=>setActiveIdx(i=>i+1)} className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/70 transition-colors">{FEATURES[activeIdx+1].title}<ChevronRight size={14}/></button>:<div/>}
            </div>
            {/* CTA */}
            <div className="rounded-2xl p-6 text-center border border-emerald-500/20" style={{background:'linear-gradient(135deg,#064e3b20,#065f4620)'}}>
              <div className="text-base font-black text-white mb-1">Ready to try it?</div>
              <div className="text-sm text-white/40 mb-4">5-day free trial · No card needed</div>
              <button onClick={onTrial} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-black" style={{background:'#10b981'}}>Create Free Account <ArrowRight size={14}/></button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [plans, setPlans]         = useState(FALLBACK_PLANS);
  const [testimonials, setT]      = useState(T_FALLBACK);
  const [openFaq, setOpenFaq]     = useState(null);
  const [infoModal, setInfoModal] = useState(null);
  const [featModal, setFeatModal] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  // Stat counters
  const [r1, users]  = useCount(1200);
  const [r2, txs]    = useCount(48);
  const [r3, cycles] = useCount(3200);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    // Load Firebase data lazily (non-blocking)
    const loadData = async () => {
      try {
        const snap = await getDocs(query(collection(db,'subscriptionPlans'), where('isActive','==',true), orderBy('price','asc')));
        const p = snap.docs.map(d=>({id:d.id,...d.data()}));
        if (p.length) setPlans(p.sort((a,b)=>(a.displayOrder||0)-(b.displayOrder||0)));
      } catch {}
      try {
        const uSnap = await getDocs(collection(db,'users'));
        const list = [];
        for (const u of uSnap.docs) {
          if (list.length >= 6) break;
          const fs = await getDocs(query(collection(db,'users',u.id,'feedback'), where('featured','==',true), limit(2)));
          fs.forEach(d=>{const data=d.data(); if(data.message&&list.length<6) list.push({id:d.id,name:data.userName||'User',role:data.userRole||'Nisab Wallet User',rating:data.rating||5,msg:data.message});});
        }
        if (list.length >= 3) setT(list);
      } catch {}
    };
    loadData();
  }, []);

  const go = (id) => { document.getElementById(id)?.scrollIntoView({behavior:'smooth'}); setMenuOpen(false); };
  const trial = () => router.push('/register');

  const NAV = [['features','Features'],['how-it-works','How It Works'],['pricing','Pricing'],['reviews','Reviews'],['faq','FAQ']];

  // ── Info modal (About / Contact / Privacy / Terms) ──────────────────────────
  const InfoModal = () => {
    if (!infoModal) return null;
    const content = {
      about: {
        title: 'About Nisab Wallet',
        body: <div className="space-y-4 text-sm text-white/60 leading-relaxed">
          <p>Nisab Wallet is a comprehensive Islamic personal finance platform built for Muslims who want to manage their wealth with clarity and fulfil Zakat obligations accurately.</p>
          <div><h3 className="font-bold text-white mb-2">Our Mission</h3><p>Make Islamic finance management accessible, accurate, and effortless — regardless of financial background or technical experience.</p></div>
          <div><h3 className="font-bold text-white mb-2">Our Values</h3><ul className="space-y-2">{[['Shariah Compliance','Every calculation follows established Islamic jurisprudence'],['Transparency','All Zakat calculations are fully visible and explainable'],['Security','Per-user Firestore rules with end-to-end encryption'],['Accessibility','Designed for users of all ages and technical levels']].map(([t,d])=><li key={t} className="flex gap-2"><Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0"/><span><strong className="text-white">{t}:</strong> {d}</span></li>)}</ul></div>
        </div>
      },
      contact: {
        title: 'Contact Us',
        body: <div className="space-y-3">
          {[{I:Mail,t:'Email Support',s:'Response within 24h',v:'nisabwallet@gmail.com',h:'mailto:nisabwallet@gmail.com'},{I:Phone,t:'Phone',s:'Mon–Fri 9AM–6PM GMT+6',v:'+880 1234-567890',h:'tel:+8801234567890'},{I:MapPin,t:'Office',s:'Dhaka, Bangladesh',v:'House #123, Road #4, Dhanmondi, Dhaka 1209'}].map(({I,t,s,v,h},i)=>(
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-white/5" style={{background:'#1a1a24'}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'#10b98118'}}><I size={16} className="text-emerald-400"/></div>
              <div><div className="text-sm font-bold text-white">{t}</div><div className="text-[10px] text-white/30 mb-1">{s}</div>{h?<a href={h} className="text-sm text-emerald-400 hover:underline">{v}</a>:<span className="text-sm text-white/50">{v}</span>}</div>
            </div>
          ))}
          <div className="p-4 rounded-xl border border-emerald-500/20 text-sm text-white/50" style={{background:'#064e3b18'}}>Already a user? Use the <strong className="text-white">Feedback</strong> section in your dashboard for fastest response.</div>
        </div>
      },
      privacy: {
        title: 'Privacy Policy',
        body: <div className="space-y-4 text-sm text-white/60 leading-relaxed">
          <p className="text-[11px] text-white/30">Last updated: {new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p>
          {[['1. Information We Collect','We collect your name, email, and financial data you input. We also collect anonymous usage data to improve the platform.'],['2. How We Use Your Data','To provide the service, calculate Zakat, send account notifications, and improve platform performance. We never use your data for advertising.'],['3. Data Security','All data is stored in Firebase with end-to-end encryption and strict per-user Firestore rules.'],['4. Data Sharing','We never sell or share your personal data.'],['5. Your Rights','Access, update, or delete your data anytime via Settings. Export a full JSON backup at any time.'],['6. Contact','nisabwallet@gmail.com']].map(([h,b])=><div key={h}><h3 className="font-bold text-white mb-1">{h}</h3><p>{b}</p></div>)}
        </div>
      },
      terms: {
        title: 'Terms of Service',
        body: <div className="space-y-4 text-sm text-white/60 leading-relaxed">
          <p className="text-[11px] text-white/30">Last updated: {new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p>
          {[['1. Acceptance','By using Nisab Wallet you agree to these Terms.'],['2. Use of Service','You agree to use the service lawfully and maintain your account security.'],['3. Subscription & Payments','5-day free trial included. Payments verified manually within 24 hours. Prices in BDT.'],['4. Zakat Calculations','We follow accepted fiqh methodology. Confirm your final obligation with a qualified scholar.'],['5. Limitation of Liability','Nisab Wallet is provided "as is". We are not liable for financial decisions based on platform data.'],['6. Contact','nisabwallet@gmail.com']].map(([h,b])=><div key={h}><h3 className="font-bold text-white mb-1">{h}</h3><p>{b}</p></div>)}
        </div>
      },
    }[infoModal];
    if (!content) return null;
    return (
      <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={()=>setInfoModal(null)}>
        <div className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col" style={{background:'#111118',maxHeight:'88vh'}} onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
            <h2 className="text-base font-bold text-white">{content.title}</h2>
            <button onClick={()=>setInfoModal(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><X size={15} className="text-white/50"/></button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">{content.body}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen antialiased" style={{background:'#0a0a0f',color:'#ffffff',fontFamily:"'Inter',-apple-system,system-ui,sans-serif"}}>
      <style>{`
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes pulse-em{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes mql{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes mqr{from{transform:translateX(-50%)}to{transform:translateX(0)}}
        .float{animation:float 5s ease-in-out infinite}
        .pulse-em{animation:pulse-em 3s ease-in-out infinite}
        .mql{animation:mql 36s linear infinite}
        .mqr{animation:mqr 40s linear infinite}
        .mql:hover,.mqr:hover{animation-play-state:paused}
        .faq-body{overflow:hidden;transition:max-height .28s ease,opacity .2s ease}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#ffffff18;border-radius:9px}
      `}</style>

      {/* ══════════════════════════════════════════ HEADER */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled?'border-b border-white/5':'border-b border-transparent'}`}
        style={{background:scrolled?'rgba(10,10,15,0.95)':undefined,backdropFilter:scrolled?'blur(16px)':undefined}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={()=>go('hero')} className="flex items-center gap-2.5">
            <Image src="/nisab-logo-white.png" alt="Nisab Wallet" width={32} height={32} className="rounded-xl"/>
            <span className="text-base font-black tracking-tight">Nisab<span style={{color:'#10b981'}}>Wallet</span></span>
          </button>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map(([id,label])=>(
              <button key={id} onClick={()=>go(id)} className="text-sm text-white/50 hover:text-white transition-colors">{label}</button>
            ))}
            <button onClick={()=>setGuideOpen(true)} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"><BookOpen size={13}/>Guide</button>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={()=>router.push('/login')} className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2">Sign In</button>
            <button onClick={trial} className="px-5 py-2 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90" style={{background:'#10b981'}}>Start Free →</button>
          </div>
          <button onClick={()=>setMenuOpen(v=>!v)} className="md:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all">
            {menuOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-4 space-y-1" style={{background:'#0d0d14'}}>
            {NAV.map(([id,label])=><button key={id} onClick={()=>go(id)} className="block w-full text-left px-3 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all">{label}</button>)}
            <button onClick={()=>{setMenuOpen(false);setGuideOpen(true);}} className="block w-full text-left px-3 py-2.5 text-sm text-emerald-400 hover:bg-emerald-400/5 rounded-xl transition-all flex items-center gap-2"><BookOpen size={13}/>Feature Guide</button>
            <div className="pt-3 border-t border-white/5 space-y-2">
              <button onClick={()=>router.push('/login')} className="w-full py-2.5 text-sm text-white/50 border border-white/10 rounded-xl hover:bg-white/5 transition-all">Sign In</button>
              <button onClick={trial} className="w-full py-2.5 text-sm font-bold text-black rounded-xl" style={{background:'#10b981'}}>Start 5-Day Free Trial</button>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════ HERO */}
      <section id="hero" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20" style={{background:'radial-gradient(ellipse,#10b98140,transparent 70%)'}}/>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pulse-em" style={{background:'radial-gradient(circle,#6366f160,transparent 70%)'}}/>
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage:'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="relative z-10">
              {/* Badge */}
              <R>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-8" style={{borderColor:'#10b98130',background:'#10b98110',color:'#10b981'}}>
                  <Moon size={11}/> Shariah-Compliant Islamic Finance
                </div>
              </R>
              <R delay={60}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.02] mb-6">
                  Manage<br/>Your Wealth.<br/>
                  <span style={{
                    background:'linear-gradient(135deg,#10b981,#34d399)',
                    WebkitBackgroundClip:'text',
                    WebkitTextFillColor:'transparent',
                    backgroundClip:'text',
                  }}>Fulfil Your Zakat.</span>
                </h1>
              </R>
              <R delay={120}>
                <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-lg">
                  The all-in-one Islamic finance platform — automated Zakat cycle tracking, multi-account wealth management, analytics, budgets, investments and 12+ powerful modules.
                </p>
              </R>
              <R delay={180}>
                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <button onClick={trial} className="group flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02]" style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
                    Start 5-Day Free Trial <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform"/>
                  </button>
                  <button onClick={()=>setGuideOpen(true)} className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold text-white/70 border border-white/10 hover:bg-white/5 hover:text-white transition-all">
                    <BookOpen size={16}/> View Feature Guide
                  </button>
                </div>
              </R>
              <R delay={220}>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/30">
                  {['No credit card required','5-day full access','Cancel anytime','End-to-end encrypted'].map(t=>(
                    <span key={t} className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400"/>{t}</span>
                  ))}
                </div>
              </R>
            </div>

            {/* Right — Dashboard preview */}
            <R delay={100} from="right" className="relative z-10 float">
              <DashMockup/>
              {/* Floating badges */}
              <div className="absolute -bottom-4 -left-4 flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 shadow-2xl" style={{background:'#111118'}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'#10b98118'}}><BadgeCheck size={18} className="text-emerald-400"/></div>
                <div><div className="text-xs font-bold text-white">Zakat Due: ৳21,063</div><div className="text-[10px] text-white/30">2.5% of ৳8,42,500</div></div>
              </div>
              <div className="absolute -top-4 -right-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-white/10 shadow-xl" style={{background:'#111118'}}>
                <Lock size={14} className="text-emerald-400 flex-shrink-0"/>
                <div><div className="text-[11px] font-bold text-white">Bank-Grade Security</div><div className="text-[9px] text-white/30">Firebase encrypted</div></div>
              </div>
            </R>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ STATS */}
      <div className="border-y border-white/5 py-12" style={{background:'#0d0d14'}}>
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[{ref:r1,v:users,s:'K+',div:1000,label:'Active Users'},{ref:r2,v:txs,s:'K+',label:'Transactions'},{ref:null,v:4.9,s:'★',label:'Avg Rating',raw:true},{ref:r3,v:cycles,s:'+',label:'Zakat Cycles'}].map((item,i)=>(
            <div key={i}>
              <div className="text-3xl font-black mb-1" style={{color:'#10b981'}}>
                {item.raw ? item.v : (item.div ? `${(item.v/1000).toFixed(1)}` : item.v)}{item.s}
              </div>
              <div className="text-sm text-white/30">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════ FEATURES */}
      <section id="features" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <R className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-widest uppercase" style={{borderColor:'#10b98130',background:'#10b98110',color:'#10b981'}}>
              <Zap size={10}/> Platform Modules
            </div>
          </R>
          <R delay={60} className="text-center mb-4">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">12+ Modules.<br className="sm:hidden"/><span className="text-white/30"> One Platform.</span></h2>
          </R>
          <R delay={100} className="text-center mb-16">
            <p className="text-lg text-white/40 max-w-xl mx-auto">
              Click any module to see a live UI preview. Built purpose-first for Islamic finance.
            </p>
          </R>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-10">
            {FEATURES.map((f,i)=><FeatureCard key={i} f={f} i={i} onClick={()=>setFeatModal(f)}/>)}
          </div>

          {/* Guide CTA strip */}
          <R>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-white/5" style={{background:'#111118'}}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:'#10b98118'}}><BookOpen size={22} className="text-emerald-400"/></div>
                <div>
                  <div className="text-base font-black text-white">Want step-by-step walkthroughs?</div>
                  <div className="text-sm text-white/40">The Feature Guide covers every module with live UI previews.</div>
                </div>
              </div>
              <button onClick={()=>setGuideOpen(true)} className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black" style={{background:'#10b981'}}>
                Open Guide <ArrowRight size={14}/>
              </button>
            </div>
          </R>
        </div>
      </section>

      {/* ══════════════════════════════════════════ HOW IT WORKS */}
      <section id="how-it-works" className="py-28 px-4 sm:px-6 lg:px-8 border-y border-white/5" style={{background:'#0d0d14'}}>
        <div className="max-w-5xl mx-auto">
          <R className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-widest uppercase mb-4" style={{borderColor:'#10b98130',background:'#10b98110',color:'#10b981'}}><BookOpen size={10}/>Getting Started</div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Up in 4 Steps</h2>
            <p className="text-white/40 text-lg">Simple for everyone. No finance degree required.</p>
          </R>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s,i)=>(
              <R key={i} delay={i*70}>
                <div className="relative p-6 rounded-2xl border border-white/5 h-full" style={{background:'#111118'}}>
                  <div className="text-5xl font-black mb-4 leading-none select-none" style={{color:'#10b98115'}}>{s.n}</div>
                  <div className="text-base font-bold text-white mb-2">{s.title}</div>
                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                  {i < STEPS.length-1 && (
                    <div className="hidden lg:flex absolute top-8 -right-2 w-4 h-4 rounded-full items-center justify-center z-10" style={{background:'#10b981'}}><ChevronRight size={10} className="text-black"/></div>
                  )}
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ ZAKAT */}
      <section className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <R className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-widest uppercase mb-4" style={{borderColor:'#10b98130',background:'#10b98110',color:'#10b981'}}><Moon size={10}/>Zakat Engine</div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">The Hawl Cycle,<br/><span className="text-white/30">Fully Automated.</span></h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">From Nisab detection to payment reminder — the system handles the entire Shariah methodology.</p>
          </R>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {[{n:'01',t:'Wealth Hits Nisab',d:'Automatically detected. Cycle recorded in both Hijri and Gregorian calendars.'},{n:'02',t:'Hawl Monitoring',d:'Your wealth is tracked for exactly one Hijri lunar year. Fluctuations are allowed.'},{n:'03',t:'Year-End Assessment',d:'If wealth ≥ Nisab after the full Hawl, 2.5% Zakat is calculated and you are notified.'},{n:'04',t:'Pay & Renew',d:'Record your payment. If wealth stays above Nisab, a new cycle begins automatically.'}].map((s,i)=>(
              <R key={i} delay={i*60}>
                <div className="relative p-5 rounded-2xl h-full border border-emerald-500/10" style={{background:'linear-gradient(135deg,#064e3b10,#065f4608)'}}>
                  <div className="text-4xl font-black leading-none mb-3 select-none" style={{color:'#10b98120'}}>{s.n}</div>
                  <div className="text-sm font-bold text-white mb-2">{s.t}</div>
                  <p className="text-xs text-white/40 leading-relaxed">{s.d}</p>
                  {i<3&&<div className="hidden lg:flex absolute top-6 -right-2 w-4 h-4 rounded-full items-center justify-center z-10" style={{background:'#10b981'}}><ChevronRight size={10} className="text-black"/></div>}
                </div>
              </R>
            ))}
          </div>

          {/* Nisab reference cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {[{t:'Silver Nisab',v:'52.5 Tola',s:'≈ 612.36 grams',n:'Recommended'},{t:'Gold Nisab',v:'7.5 Tola',s:'≈ 87.48 grams',n:'Alternative'},{t:'Zakat Rate',v:'2.5%',s:'Of total eligible wealth',n:'After 1 Hijri year'}].map((item,i)=>(
              <R key={i} delay={i*50}>
                <div className="p-5 rounded-2xl border border-white/5 flex items-center gap-4" style={{background:'#111118'}}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:'#10b98115'}}><Coins size={20} className="text-emerald-400"/></div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mb-1">{item.t}</div>
                    <div className="text-2xl font-black text-white">{item.v}</div>
                    <div className="text-xs text-white/30">{item.s}</div>
                    <div className="text-[10px] text-emerald-400/60 mt-1 font-semibold">{item.n}</div>
                  </div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ PRICING */}
      <section id="pricing" className="py-28 px-4 sm:px-6 lg:px-8 border-y border-white/5" style={{background:'#0d0d14'}}>
        <div className="max-w-5xl mx-auto">
          <R className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-widest uppercase mb-4" style={{borderColor:'#10b98130',background:'#10b98110',color:'#10b981'}}><CreditCard size={10}/>Pricing</div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Simple. Transparent.</h2>
            <p className="text-white/40 text-lg">All plans include a 5-day full trial. No credit card required.</p>
          </R>
          <div className={`grid gap-4 max-w-4xl mx-auto ${plans.length===2?'md:grid-cols-2':plans.length===1?'max-w-sm':'md:grid-cols-3'}`}>
            {plans.map((plan,i)=>{
              const pop = plan.isMostPopular;
              const feats = Array.isArray(plan.features)?plan.features:['Full Zakat Cycle Tracking','Multi-Account Management','Analytics & Reports','Priority Support'];
              return (
                <R key={plan.id||i} delay={i*70}>
                  <div className={`relative rounded-2xl overflow-hidden h-full flex flex-col border ${pop?'border-emerald-500/50':'border-white/5'}`} style={{background:pop?'linear-gradient(135deg,#064e3b18,#065f4610)':'#111118'}}>
                    {pop && <div className="text-[10px] font-black tracking-widest uppercase text-center py-2 text-black" style={{background:'#10b981'}}>✦ Most Popular</div>}
                    <div className="p-7 flex flex-col flex-1">
                      <h3 className="text-lg font-black text-white mb-1">{plan.name}</h3>
                      <p className="text-xs text-white/30 mb-5">{plan.duration||'Full access'}</p>
                      <div className="flex items-baseline gap-1 mb-7">
                        <span className="text-4xl font-black text-white">৳{plan.price?.toLocaleString()}</span>
                        <span className="text-white/30 text-sm">/{plan.duration||'period'}</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1">
                        {feats.map((f,fi)=>(
                          <li key={fi} className="flex items-start gap-2.5 text-sm text-white/60">
                            <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5"/>{f}
                          </li>
                        ))}
                      </ul>
                      <button onClick={()=>router.push(`/register?plan=${plan.id}`)} className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 ${pop?'text-black':'text-white border border-white/10 hover:bg-white/5'}`} style={pop?{background:'#10b981'}:{}}>
                        Get Started →
                      </button>
                    </div>
                  </div>
                </R>
              );
            })}
          </div>
          <R className="text-center mt-6 text-sm text-white/20">All prices in BDT. Renewed manually — you'll always receive a reminder before expiry.</R>
        </div>
      </section>

      {/* ══════════════════════════════════════════ REVIEWS */}
      <section id="reviews" className="py-28 overflow-hidden" style={{background:'#0a0a0f'}}>
        {/* Bg glow */}
        <div className="absolute left-1/4 w-96 h-72 rounded-full pointer-events-none opacity-10" style={{background:'radial-gradient(circle,#10b981,transparent 70%)'}}/>
        <R className="text-center mb-16 px-4">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/5 mb-6" style={{background:'#111118'}}>
            <div className="flex gap-0.5">{[0,1,2,3,4].map(i=><Star key={i} size={13} className="text-amber-400 fill-amber-400"/>)}</div>
            <span className="text-white font-bold text-sm">4.9</span>
            <div className="w-px h-4 bg-white/10"/>
            <span className="text-white/30 text-sm">1,200+ users</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Loved Across<br/><span className="text-white/30">Bangladesh.</span>
          </h2>
          <p className="text-white/40 text-lg">Real users. Real results. Real Zakat fulfilled.</p>
        </R>

        {/* Marquee row 1 */}
        <div className="relative mb-3">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{background:'linear-gradient(90deg,#0a0a0f,transparent)'}}/>
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{background:'linear-gradient(270deg,#0a0a0f,transparent)'}}/>
          <div className="overflow-hidden">
            <div className="flex gap-3 mql whitespace-nowrap">
              {[...testimonials,...testimonials].map((t,i)=>{
                const COLS=['#10b981','#6366f1','#0ea5e9','#f59e0b','#f43f5e','#8b5cf6'];
                const c = COLS[i%COLS.length];
                return (
                  <div key={i} className="inline-flex flex-col w-72 p-5 rounded-2xl border border-white/5 flex-shrink-0 whitespace-normal" style={{background:'#111118'}}>
                    <div className="flex gap-0.5 mb-3">{[0,1,2,3,4].map(s=><Star key={s} size={11} className={s<t.rating?'text-amber-400 fill-amber-400':'text-white/10 fill-white/10'}/>)}</div>
                    <p className="text-sm text-white/50 leading-relaxed mb-4 flex-1 line-clamp-4">"{t.msg}"</p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{background:c}}>{t.name.charAt(0)}</div>
                      <div><div className="text-xs font-bold text-white">{t.name}</div><div className="text-[10px] text-white/30">{t.role}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Marquee row 2 */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{background:'linear-gradient(90deg,#0a0a0f,transparent)'}}/>
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{background:'linear-gradient(270deg,#0a0a0f,transparent)'}}/>
          <div className="overflow-hidden">
            <div className="flex gap-3 mqr whitespace-nowrap">
              {[...[...testimonials].reverse(),...[...testimonials].reverse()].map((t,i)=>{
                const COLS2=['#f97316','#06b6d4','#ec4899','#10b981','#a855f7','#eab308'];
                const c = COLS2[i%COLS2.length];
                return (
                  <div key={i} className="inline-flex flex-col w-80 p-5 rounded-2xl border border-white/5 flex-shrink-0 whitespace-normal" style={{background:'#111118'}}>
                    <div className="flex gap-0.5 mb-3">{[0,1,2,3,4].map(s=><Star key={s} size={11} className={s<t.rating?'text-amber-400 fill-amber-400':'text-white/10 fill-white/10'}/>)}</div>
                    <p className="text-sm text-white/50 leading-relaxed mb-4 flex-1 line-clamp-4">"{t.msg}"</p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{background:c}}>{t.name.charAt(0)}</div>
                      <div><div className="text-xs font-bold text-white">{t.name}</div><div className="text-[10px] text-white/30">{t.role}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <R className="text-center mt-12 px-4">
          <button onClick={trial} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-black" style={{background:'#10b981'}}>Join Them Today <ArrowRight size={14}/></button>
        </R>
      </section>

      {/* ══════════════════════════════════════════ FAQ */}
      <section id="faq" className="py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5" style={{background:'#0d0d14'}}>
        <div className="max-w-2xl mx-auto">
          <R className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-widest uppercase mb-4" style={{borderColor:'#10b98130',background:'#10b98110',color:'#10b981'}}>FAQ</div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Got Questions?</h2>
            <p className="text-white/40">Everything you need before getting started.</p>
          </R>
          <div className="space-y-2">
            {FAQS.map((f,i)=>(
              <R key={i} delay={i*30}>
                <div className="rounded-2xl border border-white/5 overflow-hidden transition-colors" style={{background:openFaq===i?'#111118':'#0d0d14'}}>
                  <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between px-5 py-4 text-left gap-4">
                    <span className="text-sm font-semibold text-white leading-snug">{f.q}</span>
                    <ChevronDown size={16} className={`text-white/30 flex-shrink-0 transition-transform duration-200 ${openFaq===i?'rotate-180 text-emerald-400':''}`}/>
                  </button>
                  <div className={`faq-body px-5 ${openFaq===i?'max-h-48 opacity-100 pb-4':'max-h-0 opacity-0'}`}>
                    <p className="text-sm text-white/40 leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ CTA */}
      <section className="relative py-32 px-4 overflow-hidden" style={{background:'#0a0a0f'}}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-30" style={{background:'radial-gradient(ellipse at 50% 100%,#10b98140,transparent 60%)'}}/>
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)',backgroundSize:'50px 50px'}}/>
        </div>
        <R className="text-center relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-widest uppercase mb-8" style={{borderColor:'#10b98130',background:'#10b98110',color:'#10b981'}}>
            <Sparkles size={10}/> 5-Day Free Trial · No Card Required
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
            Your Wealth.<br/>Your Zakat.<br/>
            <span style={{background:'linear-gradient(135deg,#10b981,#34d399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              Your Confidence.
            </span>
          </h2>
          <p className="text-lg text-white/40 mb-10 max-w-xl mx-auto">Join thousands of Muslims across Bangladesh managing their finances and Zakat obligations with clarity on Nisab Wallet.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={trial} className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02]" style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
              Create Free Account <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform"/>
            </button>
            <button onClick={()=>setGuideOpen(true)} className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white/60 border border-white/10 hover:bg-white/5 hover:text-white transition-all">
              <BookOpen size={16}/> View Feature Guide
            </button>
          </div>
        </R>
      </section>

      {/* ══════════════════════════════════════════ FOOTER */}
      <footer className="border-t border-white/5 pt-16 pb-10 px-4 sm:px-6 lg:px-8" style={{background:'#0d0d14'}}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-10 pb-12 border-b border-white/5">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2.5 mb-5">
                <Image src="/nisab-logo-white.png" alt="Nisab Wallet" width={32} height={32} className="rounded-xl"/>
                <span className="text-base font-black">Nisab<span style={{color:'#10b981'}}>Wallet</span></span>
              </div>
              <p className="text-sm text-white/30 leading-relaxed mb-5 max-w-xs">A Shariah-compliant Islamic finance platform — wealth management, Zakat automation, analytics and more in one secure app.</p>
              <div className="flex gap-2">
                {[{I:Mail,h:'mailto:nisabwallet@gmail.com'},{I:Phone,h:'tel:+8801234567890'},{I:Globe,h:'#'}].map(({I,h},i)=>(
                  <a key={i} href={h} className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/5 text-white/30 hover:text-emerald-400 hover:border-emerald-400/30 transition-colors" style={{background:'#111118'}}><I size={14}/></a>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/30 mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                {[['features','Features'],['how-it-works','How It Works'],['pricing','Pricing'],['reviews','Reviews'],['faq','FAQ']].map(([id,l])=>(
                  <li key={id}><button onClick={()=>go(id)} className="hover:text-white transition-colors">{l}</button></li>
                ))}
                <li><button onClick={()=>setGuideOpen(true)} className="hover:text-white transition-colors flex items-center gap-1"><BookOpen size={11}/>Feature Guide</button></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/30 mb-4">Account</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                {[['Create Account','/register'],['Sign In','/login'],['Reset Password','/forgot-password']].map(([l,h])=>(
                  <li key={l}><button onClick={()=>router.push(h)} className="hover:text-white transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/30 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                {[['About Us','about'],['Contact','contact'],['Privacy Policy','privacy'],['Terms of Service','terms']].map(([l,m])=>(
                  <li key={l}><button onClick={()=>setInfoModal(m)} className="hover:text-white transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/30 mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-white/40">
                {[{I:Mail,t:'nisabwallet@gmail.com',h:'mailto:nisabwallet@gmail.com'},{I:Phone,t:'+880 1234-567890',h:'tel:+8801234567890'},{I:MapPin,t:'Dhaka, Bangladesh'},{I:Clock,t:'Mon–Fri 9AM–6PM GMT+6'}].map(({I,t,h},i)=>(
                  <li key={i} className="flex items-start gap-2"><I size={12} className="mt-0.5 flex-shrink-0 text-emerald-400/60"/>{h?<a href={h} className="hover:text-white transition-colors">{t}</a>:<span>{t}</span>}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/20">
            <span>© {new Date().getFullYear()} Nisab Wallet. All rights reserved.</span>
            <span className="flex items-center gap-1">Built with <Heart size={11} className="text-red-500 fill-red-500 mx-0.5"/> for the Muslim community · Bangladesh</span>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════ OVERLAYS */}
      {featModal && <FeatureModal f={featModal} onClose={()=>setFeatModal(null)} onGuide={()=>{setFeatModal(null);setGuideOpen(true);}} onTrial={trial}/>}
      <GuideDrawer open={guideOpen} onClose={()=>setGuideOpen(false)} onTrial={trial}/>
      <InfoModal/>
    </div>
  );
}
