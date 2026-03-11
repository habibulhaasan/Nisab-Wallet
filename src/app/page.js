// src/app/page.js  –  Nisab Wallet v3  –  Warm Editorial Design
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Moon, Star, ArrowRight, ChevronDown, X, Menu, Check,
  Wallet, Building2, CreditCard, Coins, TrendingUp,
  BarChart3, PiggyBank, Target, Repeat, HandCoins, FileText,
  ShoppingBag, Receipt, BookOpen, Zap, Users, BadgeCheck,
  Lock, Mail, Phone, MapPin, Clock, Heart,
  CheckCircle, Sparkles, ChevronRight, Landmark, Globe,
} from 'lucide-react';

/* ─── Intersection observer hook ─────────────────────────────────────────── */
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); o.disconnect(); } }, { threshold });
    o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return [ref, on];
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, on] = useReveal();
  return (
    <div ref={ref}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: '550ms' }}
      className={`transition-all ease-out ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Data ──────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Moon,        title: 'Zakat Cycle Engine',      tag: 'Shariah Core',    hex: '#2d6a4f', desc: 'Automated Hawl tracking — Nisab detection, dual-calendar cycle start (Hijri + Gregorian), 2.5% calculation, full payment history.' },
  { icon: Coins,       title: 'Live Nisab Threshold',    tag: 'Real-Time',       hex: '#1b4332', desc: 'Silver price fetched automatically. Nisab recalculated live. Instant alert the moment your wealth crosses the threshold.' },
  { icon: Building2,   title: 'Multi-Account Hub',       tag: 'Wealth',          hex: '#40916c', desc: 'Cash, Bank, bKash, Nagad, Gold, Silver — unified balance with immutable IDs so history never breaks.' },
  { icon: BarChart3,   title: 'Smart Analytics',         tag: 'Insights',        hex: '#52b788', desc: 'Weekly, monthly, yearly and custom-range reports. Bar, pie and line charts with category-by-category breakdown.' },
  { icon: TrendingUp,  title: 'Investment Portfolio',    tag: 'Investments',     hex: '#2d6a4f', desc: 'Stocks, DPS, FDR, Savings Certs, Mutual Funds, Crypto, Real Estate — all with return % and dividend tracking.' },
  { icon: PiggyBank,   title: 'Budget Management',       tag: 'Budgeting',       hex: '#d4a373', desc: 'Monthly limits per category. Live progress bars warn at 80% and turn red when exceeded.' },
  { icon: Target,      title: 'Financial Goals',         tag: 'Goals',           hex: '#9c6644', desc: 'Define targets with deadlines. Deposit, withdraw, and track progress visually toward every milestone.' },
  { icon: Repeat,      title: 'Recurring Transactions',  tag: 'Automation',      hex: '#1b4332', desc: 'Automate salary, rent, bills. Pause, resume and edit anytime. Manual-confirm mode for variable costs.' },
  { icon: HandCoins,   title: 'Loans & Lending',         tag: 'Debt',            hex: '#40916c', desc: 'Track borrowed and lent money separately. Due-date alerts, Qard Hasan labels, repayment history per person.' },
  { icon: FileText,    title: 'Tax File Management',     tag: 'Tax',             hex: '#d4a373', desc: 'Bangladesh July–June fiscal year. Map categories to income heads. Countdown to the 30 Nov filing deadline.' },
  { icon: ShoppingBag, title: 'Shopping Lists',          tag: 'Planning',        hex: '#9c6644', desc: 'Plan before spending. Named carts, tick-off items, estimated vs actual totals aligned with your budget.' },
  { icon: Receipt,     title: 'Transaction Management',  tag: 'Records',         hex: '#52b788', desc: 'Full CRUD on every entry. Filter by date, category, account. Transfers as balanced paired entries.' },
];

const PLANS = [
  { id: 'm1', name: '1 Month',  price: 99,  duration: '1 Month',  pop: false, features: ['Full Zakat Cycle Tracking', 'Multi-Account Management', 'Analytics & PDF Reports', 'Email Support'] },
  { id: 'm3', name: '3 Months', price: 249, duration: '3 Months', pop: true,  features: ['Everything in 1-Month', 'Investment Portfolio Tracking', 'Loan & Lending Tracker', 'Data Export (PDF/CSV)', 'Priority Support'] },
  { id: 'y1', name: '1 Year',   price: 799, duration: '1 Year',   pop: false, features: ['Everything in 3-Months', 'Tax File Management', 'Recurring Automation', 'Annual Zakat History', 'Dedicated Support'] },
];

const FAQS = [
  { q: 'What is Nisab Wallet?',                      a: 'A complete Islamic personal finance platform — automated Zakat cycle tracking, multi-account wealth management, analytics, budgeting, investments, loans, recurring transactions, tax filing and more.' },
  { q: 'How accurate is the Zakat calculation?',     a: 'We follow the established fiqh methodology: wealth ≥ silver Nisab (52.5 Tola / 612.36g) for a full Hijri year (Hawl), then 2.5% of eligible assets. Always confirm with a qualified scholar.' },
  { q: 'How does the 5-day free trial work?',        a: 'Every new account gets full platform access for 5 days — no credit card required. After the trial, pick any plan. Your data is kept even if you do not subscribe right away.' },
  { q: 'Which account types are supported?',         a: 'Cash, Bank Account, Mobile Banking (bKash, Nagad, Rocket), Gold, and Silver. Each has an immutable ID so renaming never breaks historical analytics.' },
  { q: 'Can I track investments and loans?',         a: 'Yes. Stocks, Mutual Funds, DPS, FDR, Savings Certs, Bonds, PPF, Pension, Crypto, Real Estate. Loans tracks debt with due dates; Lendings tracks money you have given to others.' },
  { q: 'Is my data secure?',                        a: 'All data is in Firebase with per-user Firestore security rules. We never sell or share your records. Export a full JSON backup from Settings at any time.' },
];

const T_FALLBACK = [
  { id:1, name:'Ahmed Al-Rashid', role:'Business Owner · Bangladesh 🇧🇩',   rating:5, msg:'For the first time I\'m completely confident about my Zakat. The system started the cycle automatically when my wealth hit Nisab and reminded me exactly 354 days later.' },
  { id:2, name:'Fatima Begum',    role:'Teacher · Bangladesh 🇧🇩',            rating:5, msg:'I was nervous about finance apps — too complicated. This one is different. Large buttons, clear labels, everything explained. My elderly mother uses it too.' },
  { id:3, name:'Mohammad Hasan',  role:'IT Professional · Bangladesh 🇧🇩',    rating:5, msg:'The investment tracker is superb. I manage stocks, an FDR, and savings certificates all in one place. Reports are professional enough to hand to my accountant.' },
  { id:4, name:'Nadia Rahman',    role:'Homemaker · Bangladesh 🇧🇩',          rating:5, msg:'The live Nisab threshold update is what sold me. I don\'t have to look up silver prices anymore. The system knows and adjusts automatically.' },
  { id:5, name:'Karim Uddin',     role:'Pharmacist · Bangladesh 🇧🇩',         rating:4, msg:'Budgets + recurring transactions is a killer combo. I set monthly limits, automate fixed costs, and the app tells me exactly what I have left to spend.' },
  { id:6, name:'Sarah Ahmed',     role:'Entrepreneur · Bangladesh 🇧🇩',       rating:5, msg:'Switched from a spreadsheet six months ago. Zakat history alone — every cycle, payment, amount over the years — is worth the subscription.' },
];

/* ─── Inline dashboard mockup ───────────────────────────────────────────── */
function DashMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0 select-none" aria-hidden="true">
      {/* Decorative geometric ring behind */}
      <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border-[20px] opacity-10 pointer-events-none" style={{borderColor:'#2d6a4f'}}/>
      <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full border-[14px] opacity-10 pointer-events-none" style={{borderColor:'#d4a373'}}/>

      <div className="rounded-2xl overflow-hidden shadow-2xl border border-black/10" style={{background:'#1b1f1a'}}>
        {/* Chrome bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5" style={{background:'#141714'}}>
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/70"/>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70"/>
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/70"/>
          <span className="ml-3 text-[10px] font-mono" style={{color:'#52b78860'}}>nisabwallet.com/dashboard</span>
        </div>

        <div className="p-4 space-y-3">
          {/* Zakat card */}
          <div className="rounded-xl p-4" style={{background:'linear-gradient(135deg,#1b4332,#2d6a4f)'}}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Moon size={13} style={{color:'#95d5b2'}}/>
                <span className="text-[9px] font-bold tracking-widest uppercase" style={{color:'#95d5b2'}}>Zakat Status</span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background:'#52b78830',color:'#95d5b2',border:'1px solid #52b78850'}}>Hawl Active</span>
            </div>
            <div className="text-xl font-black text-white mb-1">৳ 8,42,500</div>
            <div className="text-[9px] mb-3" style={{color:'#95d5b260'}}>Total Wealth · Nisab: ৳ 1,24,300</div>
            <div className="flex justify-between text-[9px] mb-1" style={{color:'#95d5b2aa'}}>
              <span>Hijri Year Progress</span><span className="font-bold" style={{color:'#95d5b2'}}>218 / 354 days</span>
            </div>
            <div className="h-1.5 rounded-full" style={{background:'#ffffff15'}}>
              <div className="h-full rounded-full" style={{width:'61.6%',background:'#52b788'}}/>
            </div>
          </div>

          {/* Account cards */}
          <div className="grid grid-cols-2 gap-2">
            {[{l:'Bank',v:'৳5,12,000',c:'#40916c'},{l:'bKash',v:'৳84,500',c:'#d4a373'},{l:'Cash',v:'৳1,26,000',c:'#52b788'},{l:'Gold',v:'৳1,20,000',c:'#f4a261'}].map((a,i) => (
              <div key={i} className="rounded-xl p-3" style={{background:'#242920'}}>
                <div className="text-[9px] mb-0.5" style={{color:'#ffffff40'}}>{a.l}</div>
                <div className="text-xs font-bold text-white">{a.v}</div>
                <div className="mt-1.5 h-0.5 rounded-full" style={{background:a.c+'40'}}>
                  <div className="h-full rounded-full" style={{width:`${[72,31,48,58][i]}%`,background:a.c}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="rounded-xl p-3" style={{background:'#242920'}}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold" style={{color:'#ffffff70'}}>Monthly</span>
              <span className="text-[9px] font-semibold" style={{color:'#52b788'}}>Mar 2026</span>
            </div>
            <div className="flex items-end gap-px h-10">
              {[28,45,32,60,38,52,74,44,58,68,36,100].map((h,i) => (
                <div key={i} className="flex-1 rounded-sm" style={{height:`${h}%`,background:i===11?'#52b788':i>=9?'#52b78860':'#52b78825'}}/>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] font-semibold" style={{color:'#52b788'}}>↑ ৳95,000</span>
              <span className="text-[9px] font-semibold" style={{color:'#f4a261'}}>↓ ৳42,300</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature detail modal ──────────────────────────────────────────────── */
function FeatModal({ f, onClose, onTrial, onGuide }) {
  if (!f) return null;
  const Icon = f.icon;
  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center sm:p-6" style={{background:'rgba(0,0,0,0.7)'}} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-black/10" style={{background:'#fefaef',maxHeight:'88vh'}} onClick={e=>e.stopPropagation()}>
        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{background:'#2d6a4f40'}}/></div>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:'#2d6a4f20'}}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:f.hex+'20'}}><Icon size={18} style={{color:f.hex}}/></div>
            <div>
              <div className="text-[9px] font-bold tracking-widest uppercase" style={{color:f.hex}}>{f.tag}</div>
              <div className="text-sm font-black" style={{color:'#1a2e1a'}}>{f.title}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors" style={{background:'#2d6a4f10'}}><X size={15} style={{color:'#2d6a4f80'}}/></button>
        </div>
        <div className="p-5 overflow-y-auto" style={{maxHeight:'52vh'}}>
          <p className="text-sm leading-relaxed mb-5" style={{color:'#3a4a3a'}}>{f.desc}</p>
          <div className="space-y-2.5">
            {['Full CRUD operations with real-time balance sync', 'Immutable IDs preserve all historical analytics safely', 'Designed for all age groups with large touch targets', 'Works across Cash, Bank, Mobile Banking, Gold & Silver', 'Secure per-user Firebase rules with end-to-end encryption'].map((b,i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:f.hex+'18'}}>
                  <Check size={10} style={{color:f.hex}}/>
                </div>
                <span className="text-sm" style={{color:'#3a4a3a'}}>{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-4 flex gap-3 border-t" style={{borderColor:'#2d6a4f15',background:'#f9f5e7'}}>
          <button onClick={onTrial} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{background:f.hex}}>Start Free Trial →</button>
          <button onClick={onGuide} className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors" style={{background:'#2d6a4f15',color:'#2d6a4f'}}><BookOpen size={13}/>Guide</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Guide drawer ──────────────────────────────────────────────────────── */
function GuideDrawer({ open, onClose, onTrial }) {
  const [idx, setIdx] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  if (!open) return null;
  const f = FEATURES[idx];
  const Icon = f.icon;
  return (
    <div className="fixed inset-0 z-[600] flex flex-col" style={{background:'#fefaef'}}>
      {/* Top */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b flex-shrink-0" style={{borderColor:'#2d6a4f20',background:'#f9f5e7'}}>
        <div className="flex items-center gap-3">
          <Image src="/nisab-logo.png" alt="Nisab Wallet" width={30} height={30} className="rounded-xl"/>
          <div>
            <div className="text-sm font-black" style={{color:'#1a2e1a'}}>Feature Guide</div>
            <div className="text-[10px] hidden sm:block" style={{color:'#2d6a4f80'}}>{FEATURES.length} modules · live previews</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onTrial} className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{background:'#2d6a4f'}}>Start Free Trial <ArrowRight size={12}/></button>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{background:'#2d6a4f10'}}><X size={18} style={{color:'#2d6a4f80'}}/></button>
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex flex-col w-52 border-r overflow-y-auto flex-shrink-0 py-2" style={{borderColor:'#2d6a4f15',background:'#f4f0e0'}}>
          {FEATURES.map((feat, i) => {
            const FI = feat.icon; const isA = i === idx;
            return (
              <button key={i} onClick={() => setIdx(i)} className="flex items-center gap-3 px-4 py-2.5 text-left transition-all" style={{background: isA ? '#2d6a4f18' : undefined}}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: feat.hex + (isA ? '25' : '12')}}><FI size={12} style={{color:feat.hex}}/></div>
                <span className="text-xs font-semibold truncate" style={{color: isA ? '#1a2e1a' : '#3a4a3a99'}}>{feat.title}</span>
                {isA && <div className="w-1 h-4 rounded-full ml-auto flex-shrink-0" style={{background:f.hex}}/>}
              </button>
            );
          })}
        </aside>
        {/* Mobile TOC */}
        <div className="md:hidden absolute left-0 right-0 px-3 pt-2 z-10" style={{top:'57px'}}>
          <button onClick={() => setTocOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border" style={{background:'#f4f0e0',borderColor:'#2d6a4f25'}}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:f.hex+'20'}}><Icon size={13} style={{color:f.hex}}/></div>
            <div className="flex-1 text-left"><div className="text-[9px] font-bold uppercase tracking-widest" style={{color:'#2d6a4f80'}}>Viewing</div><div className="text-sm font-black truncate" style={{color:'#1a2e1a'}}>{f.title}</div></div>
            <ChevronDown size={14} style={{color:'#2d6a4f60'}} className={`transition-transform ${tocOpen ? 'rotate-180' : ''}`}/>
          </button>
          {tocOpen && (
            <div className="mt-1 rounded-2xl border overflow-hidden shadow-xl max-h-64 overflow-y-auto" style={{background:'#fefaef',borderColor:'#2d6a4f20'}}>
              {FEATURES.map((feat, i) => { const FI = feat.icon; const isA = i === idx; return (
                <button key={i} onClick={() => { setIdx(i); setTocOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 border-b last:border-0 text-left" style={{background: isA ? '#2d6a4f12' : undefined, borderColor:'#2d6a4f10'}}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:feat.hex+'18'}}><FI size={11} style={{color:feat.hex}}/></div>
                  <span className="text-sm" style={{color: isA ? '#1a2e1a' : '#3a4a3a',fontWeight: isA ? 700 : 400}}>{feat.title}</span>
                  {isA && <div className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0" style={{background:feat.hex}}/>}
                </button>
              ); })}
            </div>
          )}
        </div>
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-8 mt-16 md:mt-0">
          <div className="max-w-xl mx-auto">
            <div className="flex items-start gap-4 mb-6 p-5 rounded-2xl border" style={{background:'#f4f0e0',borderColor:'#2d6a4f15'}}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:f.hex+'18'}}><Icon size={22} style={{color:f.hex}}/></div>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{color:f.hex}}>{f.tag}</div>
                <h2 className="text-xl font-black mb-2" style={{color:'#1a2e1a'}}>{f.title}</h2>
                <p className="text-sm leading-relaxed" style={{color:'#3a4a3a'}}>{f.desc}</p>
              </div>
            </div>
            <div className="space-y-2.5 mb-8">
              {['Full CRUD operations with real-time balance updates','Immutable IDs preserve all historical analytics','Mobile-optimised with large touch targets for all ages','Works across Cash, Bank, Mobile Banking, Gold & Silver','Real-time Firebase sync with per-user security rules'].map((b,i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border" style={{background:'#fefaef',borderColor:'#2d6a4f12'}}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:f.hex+'18'}}><Check size={10} style={{color:f.hex}}/></div>
                  <span className="text-sm" style={{color:'#3a4a3a'}}>{b}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mb-8">
              {idx > 0 ? <button onClick={() => setIdx(i => i-1)} className="flex items-center gap-1.5 text-sm transition-colors" style={{color:'#2d6a4f80'}}><ChevronRight size={14} className="rotate-180"/>{FEATURES[idx-1].title}</button> : <div/>}
              {idx < FEATURES.length-1 ? <button onClick={() => setIdx(i => i+1)} className="flex items-center gap-1.5 text-sm transition-colors" style={{color:'#2d6a4f80'}}>{FEATURES[idx+1].title}<ChevronRight size={14}/></button> : <div/>}
            </div>
            <div className="rounded-2xl p-6 text-center border" style={{background:'linear-gradient(135deg,#2d6a4f18,#52b78812)',borderColor:'#2d6a4f25'}}>
              <div className="text-base font-black mb-1" style={{color:'#1a2e1a'}}>Ready to try it?</div>
              <div className="text-sm mb-4" style={{color:'#3a4a3a'}}>5-day free trial · No card needed</div>
              <button onClick={onTrial} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{background:'#2d6a4f'}}>Create Free Account <ArrowRight size={14}/></button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Info modal ─────────────────────────────────────────────────────────── */
function InfoModal({ type, onClose, router }) {
  if (!type) return null;
  const NOW = new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'});
  const bodies = {
    about: { title: 'About Nisab Wallet', content: <div className="space-y-4 text-sm leading-relaxed" style={{color:'#3a4a3a'}}><p>Nisab Wallet is a comprehensive Islamic personal finance platform built for Muslims who want to manage wealth with clarity and fulfil Zakat obligations accurately.</p><div><h3 className="font-black mb-2" style={{color:'#1a2e1a'}}>Our Mission</h3><p>Make Islamic finance management accessible, accurate and effortless — regardless of technical experience.</p></div><ul className="space-y-2">{[['Shariah Compliance','Every calculation follows established jurisprudence'],['Transparency','All Zakat calculations visible and explainable'],['Security','Per-user Firestore rules with end-to-end encryption'],['Accessibility','Designed for users of all ages and skill levels']].map(([t,d])=><li key={t} className="flex gap-2"><Check size={13} style={{color:'#2d6a4f',marginTop:2,flexShrink:0}}/><span><strong style={{color:'#1a2e1a'}}>{t}:</strong> {d}</span></li>)}</ul></div> },
    contact: { title: 'Contact Us', content: <div className="space-y-3">{[{I:Mail,t:'Email',s:'Response within 24h',v:'nisabwallet@gmail.com',h:'mailto:nisabwallet@gmail.com'},{I:Phone,t:'WhatsApp',s:'Service coming soon',v:'WhatsApp support launching shortly',h:null},{I:MapPin,t:'Office',s:'Dhaka, Bangladesh',v:'Bangladesh 🇧🇩'}].map(({I,t,s,v,h},i)=><div key={i} className="flex gap-4 p-4 rounded-xl border" style={{background:'#f4f0e0',borderColor:'#2d6a4f15'}}><div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'#2d6a4f18'}}><I size={16} style={{color:'#2d6a4f'}}/></div><div><div className="font-bold text-sm" style={{color:'#1a2e1a'}}>{t}</div><div className="text-[10px] mb-1" style={{color:'#3a4a3a80'}}>{s}</div>{h?<a href={h} className="text-sm" style={{color:'#2d6a4f'}}>{v}</a>:<span className="text-sm" style={{color:'#3a4a3a'}}>{v}</span>}</div></div>)}</div> },
    privacy: { title: 'Privacy Policy', content: <div className="space-y-4 text-sm leading-relaxed" style={{color:'#3a4a3a'}}><p className="text-xs" style={{color:'#3a4a3a60'}}>Last updated: {NOW}</p>{[['1. Information We Collect','We collect your name, email, and financial data you input. Anonymous usage data is also collected to improve the platform.'],['2. How We Use Your Data','To provide the service, calculate Zakat, send notifications, and improve performance. Never used for advertising.'],['3. Data Security','All data stored in Firebase with end-to-end encryption and strict per-user Firestore rules.'],['4. Data Sharing','We never sell or share your personal data.'],['5. Your Rights','Access, update or delete your data via Settings. Export a full JSON backup anytime.'],['6. Contact','nisabwallet@gmail.com']].map(([h,b])=><div key={h}><h3 className="font-black mb-1" style={{color:'#1a2e1a'}}>{h}</h3><p>{b}</p></div>)}</div> },
    terms:   { title: 'Terms of Service', content: <div className="space-y-4 text-sm leading-relaxed" style={{color:'#3a4a3a'}}><p className="text-xs" style={{color:'#3a4a3a60'}}>Last updated: {NOW}</p>{[['1. Acceptance','By using Nisab Wallet you agree to these Terms.'],['2. Use of Service','You agree to use the service lawfully and maintain your account security.'],['3. Subscription & Payments','5-day free trial included. Payments verified manually within 24h. Prices in BDT.'],['4. Zakat Calculations','We follow accepted fiqh methodology. Confirm final obligation with a qualified scholar.'],['5. Limitation of Liability','Nisab Wallet is provided "as is". We are not liable for financial decisions based on platform data.'],['6. Contact','nisabwallet@gmail.com']].map(([h,b])=><div key={h}><h3 className="font-black mb-1" style={{color:'#1a2e1a'}}>{h}</h3><p>{b}</p></div>)}</div> },
  };
  const { title, content } = bodies[type] || {};
  if (!title) return null;
  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.6)'}} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden border shadow-2xl flex flex-col" style={{background:'#fefaef',borderColor:'#2d6a4f20',maxHeight:'88vh'}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{borderColor:'#2d6a4f20',background:'#f4f0e0'}}>
          <h2 className="text-base font-black" style={{color:'#1a2e1a'}}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl" style={{background:'#2d6a4f10'}}><X size={15} style={{color:'#2d6a4f80'}}/></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{content}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const router   = useRouter();
  const [menu, setMenu]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans]       = useState(PLANS);
  const [testi, setTesti]       = useState(T_FALLBACK);
  const [faq, setFaq]           = useState(null);
  const [infoModal, setInfo]    = useState(null);   // 'about'|'contact'|'privacy'|'terms'
  const [featModal, setFeat]    = useState(null);   // feature object
  const [guide, setGuide]       = useState(false);

  /* scroll listener */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* Firebase data — non-blocking */
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db,'subscriptionPlans'), where('isActive','==',true), orderBy('price','asc')));
        const p = snap.docs.map(d => ({ id:d.id, ...d.data(), pop: d.data().isMostPopular }));
        if (p.length) setPlans(p.sort((a,b) => (a.displayOrder||0)-(b.displayOrder||0)));
      } catch {}
      try {
        const snap = await getDocs(collection(db,'users'));
        const list = [];
        for (const u of snap.docs) {
          if (list.length >= 6) break;
          const fs = await getDocs(query(collection(db,'users',u.id,'feedback'), where('featured','==',true), limit(2)));
          fs.forEach(d => { const data = d.data(); if (data.message && list.length < 6) { const desig = data.userDesignation || data.userRole || 'Nisab Wallet User'; const roleStr = desig.includes('Bangladesh') ? desig : desig + ' · Bangladesh 🇧🇩'; list.push({ id:d.id, name:data.userName||'User', role:roleStr, rating:data.rating||5, msg:data.message }); } });
        }
        if (list.length >= 3) setTesti(list);
      } catch {}
    })();
  }, []);

  const go    = (id) => { document.getElementById(id)?.scrollIntoView({ behavior:'smooth' }); setMenu(false); };
  const trial = ()  => router.push('/register');
  const NAV   = [['features','Features'],['how-it-works','How It Works'],['pricing','Pricing'],['reviews','Reviews'],['faq','FAQ']];
  const displayT = testi.length >= 3 ? testi : T_FALLBACK;

  return (
    <div className="min-h-screen antialiased" style={{background:'#fefaef',color:'#1a2e1a',fontFamily:"'Georgia','Times New Roman',serif"}}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Georgia','Times New Roman',serif; }

        /* Fast CSS-only animations – no JS overhead */
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes mql      { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes mqr      { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes fadeSlide{ from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin-slow{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .float-anim    { animation: float 6s ease-in-out infinite; }
        .mql           { animation: mql 40s linear infinite; }
        .mqr           { animation: mqr 46s linear infinite; }
        .mql:hover,.mqr:hover { animation-play-state: paused; }
        .hero-text     { animation: fadeSlide .6s ease both; }
        .hero-text-2   { animation: fadeSlide .6s .1s ease both; }
        .hero-text-3   { animation: fadeSlide .6s .2s ease both; }
        .hero-text-4   { animation: fadeSlide .6s .3s ease both; }
        .spin-slow      { animation: spin-slow 30s linear infinite; }

        /* Geometric Islamic pattern overlay - CSS only, zero performance cost */
        .geo-bg::before {
          content:'';
          position:absolute; inset:0;
          background-image:
            repeating-linear-gradient(45deg, #2d6a4f08 0, #2d6a4f08 1px, transparent 0, transparent 50%),
            repeating-linear-gradient(-45deg, #2d6a4f08 0, #2d6a4f08 1px, transparent 0, transparent 50%);
          background-size: 30px 30px;
          pointer-events:none;
        }

        /* Typography utility */
        .serif    { font-family: 'Georgia','Times New Roman',serif; }
        .sans     { font-family: -apple-system,'Helvetica Neue',Arial,sans-serif; }

        /* FAQ accordion */
        .faq-body { overflow:hidden; transition:max-height .3s ease, opacity .2s ease; }

        /* Feature card hover */
        .f-card { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; cursor:pointer; }
        .f-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(45,106,79,0.15); }

        /* Scrollbar */
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#2d6a4f40; border-radius:9px; }

        /* Nav underline */
        .nav-link { position:relative; padding-bottom:2px; }
        .nav-link::after { content:''; position:absolute; bottom:0; left:0; width:0; height:2px; background:#2d6a4f; border-radius:2px; transition:width .2s ease; }
        .nav-link:hover::after { width:100%; }
      `}</style>

      {/* ══════════════════════════════════ HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(254,250,239,0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : undefined,
          borderBottom: scrolled ? '1px solid rgba(45,106,79,0.12)' : '1px solid transparent',
          boxShadow: scrolled ? '0 2px 20px rgba(45,106,79,0.06)' : undefined,
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={() => go('hero')} className="flex items-center gap-2.5">
            <Image src="/nisab-logo.png" alt="Nisab Wallet" width={34} height={34} className="rounded-xl"/>
            <span className="text-lg font-black tracking-tight" style={{fontFamily:'Georgia,serif',color:'#1a2e1a'}}>Nisab<span style={{color:'#2d6a4f'}}>Wallet</span></span>
          </button>

          <nav className="hidden md:flex items-center gap-7">
            {NAV.map(([id,label]) => (
              <button key={id} onClick={() => go(id)} className="nav-link sans text-sm font-medium transition-colors" style={{color:'#2d3a2d'}}>
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setGuide(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium sans transition-colors" style={{color:'#2d6a4f',border:'1px solid #2d6a4f30'}}>
              <BookOpen size={13}/> Guide
            </button>
            <button onClick={() => router.push('/login')} className="px-4 py-2 text-sm sans font-medium transition-colors" style={{color:'#2d3a2d'}}>
              Sign In
            </button>
            <button onClick={trial} className="px-5 py-2 rounded-xl text-sm font-bold text-white sans transition-opacity hover:opacity-90" style={{background:'#2d6a4f'}}>
              Start Free →
            </button>
          </div>

          <button onClick={() => setMenu(v=>!v)} className="md:hidden p-2 rounded-lg transition-colors" style={{color:'#2d6a4f'}}>
            {menu ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>

        {menu && (
          <div className="md:hidden border-t px-4 py-4 space-y-1" style={{background:'#fefaef',borderColor:'#2d6a4f15'}}>
            {NAV.map(([id,label]) => (
              <button key={id} onClick={() => go(id)} className="block w-full text-left px-3 py-2.5 rounded-lg sans text-sm font-medium transition-colors" style={{color:'#2d3a2d'}}>
                {label}
              </button>
            ))}
            <button onClick={() => { setMenu(false); setGuide(true); }} className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg sans text-sm font-semibold" style={{color:'#2d6a4f'}}>
              <BookOpen size={13}/> Feature Guide
            </button>
            <div className="pt-3 border-t space-y-2" style={{borderColor:'#2d6a4f15'}}>
              <button onClick={() => router.push('/login')} className="w-full py-2.5 text-sm sans rounded-xl border font-medium" style={{color:'#2d3a2d',borderColor:'#2d6a4f25'}}>Sign In</button>
              <button onClick={trial} className="w-full py-2.5 text-sm sans font-bold rounded-xl text-white" style={{background:'#2d6a4f'}}>Start 5-Day Free Trial</button>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════ HERO */}
      <section id="hero" className="relative min-h-screen flex items-center pt-16 overflow-hidden geo-bg">
        {/* Big decorative circle */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none opacity-5 spin-slow border-[60px]" style={{borderColor:'#2d6a4f'}}/>
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none opacity-[0.04]" style={{background:'#d4a373'}}/>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">

            {/* Copy */}
            <div>
              {/* Eyebrow */}
              <div className="hero-text inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8 sans text-xs font-bold" style={{borderColor:'#2d6a4f30',background:'#2d6a4f0c',color:'#2d6a4f'}}>
                <Moon size={11}/> Shariah-Compliant Islamic Finance
              </div>

              <h1 className="hero-text-2 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.03] mb-7" style={{fontFamily:'Georgia,serif',color:'#1a2e1a'}}>
                Wealth<br/>managed.<br/>
                <span style={{color:'#2d6a4f'}}>Zakat</span><br/>
                <span style={{color:'#2d6a4f'}}>fulfilled.</span>
              </h1>

              <p className="hero-text-3 text-lg leading-relaxed mb-10 max-w-lg sans" style={{color:'#3a4a3a'}}>
                The all-in-one Islamic finance platform — automated Zakat cycle tracking, multi-account wealth management, analytics, budgets, investments and 12 powerful modules in one.
              </p>

              <div className="hero-text-4 flex flex-col sm:flex-row gap-3 mb-10">
                <button onClick={trial} className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white sans transition-opacity hover:opacity-90 shadow-lg" style={{background:'#2d6a4f',boxShadow:'0 8px 30px rgba(45,106,79,0.35)'}}>
                  Start 5-Day Free Trial
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform"/>
                </button>
                <button onClick={() => setGuide(true)} className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold sans transition-all border" style={{color:'#2d6a4f',borderColor:'#2d6a4f30',background:'transparent'}}>
                  <BookOpen size={16}/> View Feature Guide
                </button>
              </div>

              <div className="hero-text-4 flex flex-wrap gap-x-5 gap-y-1.5 sans text-sm" style={{color:'#3a4a3a80'}}>
                {['No credit card required','5-day full access','Cancel anytime','End-to-end encrypted'].map(t => (
                  <span key={t} className="flex items-center gap-1.5"><Check size={12} style={{color:'#2d6a4f'}}/>{t}</span>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div className="relative float-anim">
              <DashMockup/>
              {/* Floating badge 1 */}
              <Reveal delay={400} className="absolute -bottom-4 -left-2 sm:-left-6">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl" style={{background:'#fefaef',borderColor:'#2d6a4f20',boxShadow:'0 8px 30px rgba(45,106,79,0.12)'}}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'#2d6a4f18'}}><BadgeCheck size={18} style={{color:'#2d6a4f'}}/></div>
                  <div><div className="text-xs font-black sans" style={{color:'#1a2e1a'}}>Zakat Due: ৳21,063</div><div className="text-[10px] sans" style={{color:'#3a4a3a80'}}>2.5% of ৳8,42,500</div></div>
                </div>
              </Reveal>
              {/* Floating badge 2 */}
              <Reveal delay={500} className="absolute -top-4 -right-2 sm:-right-6">
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl" style={{background:'#fefaef',borderColor:'#2d6a4f20',boxShadow:'0 8px 30px rgba(45,106,79,0.12)'}}>
                  <Lock size={14} style={{color:'#2d6a4f'}}/>
                  <div><div className="text-[11px] font-bold sans" style={{color:'#1a2e1a'}}>Bank-Grade Security</div><div className="text-[9px] sans" style={{color:'#3a4a3a60'}}>Firebase encrypted</div></div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* Divider wave */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{background:'linear-gradient(to bottom,transparent,#f4f0e0)'}}/>
      </section>

      {/* ══════════════════════════════════ STATS STRIP */}
      <div className="border-y py-10" style={{background:'#f4f0e0',borderColor:'#2d6a4f15'}}>
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['1,200+','Active Users'],['48,000+','Transactions Logged'],['4.9 ★','Average Rating'],['3,200+','Zakat Cycles']].map(([v,l],i) => (
            <Reveal key={i} delay={i*60}>
              <div className="text-3xl font-black serif mb-1" style={{color:'#2d6a4f'}}>{v}</div>
              <div className="text-sm sans" style={{color:'#3a4a3a80'}}>{l}</div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════ FEATURES */}
      <section id="features" className="py-28 px-4 sm:px-6 lg:px-8" style={{background:'#fefaef'}}>
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-4">
            <span className="sans text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border" style={{color:'#2d6a4f',borderColor:'#2d6a4f30',background:'#2d6a4f0c'}}>Platform Modules</span>
          </Reveal>
          <Reveal delay={60} className="text-center mb-4">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight serif" style={{color:'#1a2e1a'}}>12 Modules. <span style={{color:'#3a4a3a40'}}>One Platform.</span></h2>
          </Reveal>
          <Reveal delay={100} className="text-center mb-16">
            <p className="text-lg sans max-w-lg mx-auto" style={{color:'#3a4a3a80'}}>Click any module to explore it. Purpose-built for Islamic finance.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-10">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={i} delay={i*30}>
                  <button onClick={() => setFeat(f)} className="f-card w-full text-left p-5 rounded-2xl border h-full flex flex-col" style={{background:'#fefaef',borderColor:'#2d6a4f12'}}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 flex-shrink-0" style={{background:f.hex+'18'}}>
                      <Icon size={18} style={{color:f.hex}}/>
                    </div>
                    <div className="sans text-[10px] font-bold tracking-widest uppercase mb-2" style={{color:f.hex}}>{f.tag}</div>
                    <div className="font-black text-sm serif mb-2" style={{color:'#1a2e1a'}}>{f.title}</div>
                    <p className="sans text-xs leading-relaxed flex-1" style={{color:'#3a4a3a80'}}>{f.desc}</p>
                    <div className="mt-3 flex items-center gap-1 sans text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{color:f.hex}}>
                      Preview →
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>

          {/* Guide strip */}
          <Reveal>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border" style={{background:'#f4f0e0',borderColor:'#2d6a4f15'}}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:'#2d6a4f18'}}><BookOpen size={20} style={{color:'#2d6a4f'}}/></div>
                <div>
                  <div className="font-black serif text-base" style={{color:'#1a2e1a'}}>Want step-by-step walkthroughs?</div>
                  <div className="sans text-sm" style={{color:'#3a4a3a80'}}>The Feature Guide covers every module with live previews.</div>
                </div>
              </div>
              <button onClick={() => setGuide(true)} className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white sans" style={{background:'#2d6a4f'}}>
                Open Guide <ArrowRight size={14}/>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════ HOW IT WORKS */}
      <section id="how-it-works" className="py-28 px-4 sm:px-6 lg:px-8 border-y" style={{background:'#f4f0e0',borderColor:'#2d6a4f15'}}>
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="sans text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border mb-5 inline-block" style={{color:'#2d6a4f',borderColor:'#2d6a4f30',background:'#2d6a4f0c'}}>Getting Started</span>
            <h2 className="text-4xl sm:text-5xl font-black serif tracking-tight mb-4" style={{color:'#1a2e1a'}}>Up in 4 Steps</h2>
            <p className="sans text-lg" style={{color:'#3a4a3a80'}}>Simple for everyone — no finance degree required.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {n:'01',t:'Sign Up Free',d:'Create your account in under a minute. Full access for 5 days — no card needed.'},
              {n:'02',t:'Add Accounts',d:'Cash, Bank, Mobile Banking, Gold, Silver. Starting balances entered immediately.'},
              {n:'03',t:'Log Transactions',d:'Income, expenses, transfers. Set recurring entries once and forget about them.'},
              {n:'04',t:'Zakat Runs Itself',d:'The engine watches your wealth, starts the Hawl, and alerts you when and how much.'},
            ].map((s, i) => (
              <Reveal key={i} delay={i*70}>
                <div className="relative p-6 rounded-2xl h-full border" style={{background:'#fefaef',borderColor:'#2d6a4f12'}}>
                  <div className="text-5xl font-black serif leading-none mb-4 select-none" style={{color:'#2d6a4f12'}}>{s.n}</div>
                  <div className="font-black serif text-base mb-2" style={{color:'#1a2e1a'}}>{s.t}</div>
                  <p className="sans text-sm leading-relaxed" style={{color:'#3a4a3a80'}}>{s.d}</p>
                  {i < 3 && (
                    <div className="hidden lg:flex absolute top-8 -right-2 w-4 h-4 rounded-full items-center justify-center z-10" style={{background:'#2d6a4f'}}>
                      <ChevronRight size={10} className="text-white"/>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ ZAKAT ENGINE */}
      <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden geo-bg" style={{background:'#fefaef'}}>
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="sans text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border mb-5 inline-block" style={{color:'#2d6a4f',borderColor:'#2d6a4f30',background:'#2d6a4f0c'}}>
              <Moon size={10} style={{display:'inline',verticalAlign:'middle',marginRight:5}}/> Zakat Engine
            </span>
            <h2 className="text-4xl sm:text-5xl font-black serif tracking-tight mb-4" style={{color:'#1a2e1a'}}>The Hawl Cycle,<br/><span style={{color:'#2d6a4f40'}}>Fully Automated.</span></h2>
            <p className="sans text-lg max-w-xl mx-auto" style={{color:'#3a4a3a80'}}>From Nisab detection to payment reminder — every step handled by Shariah methodology.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {[
              {n:'01',t:'Wealth Hits Nisab',d:'Automatically detected. Cycle recorded in both Hijri and Gregorian calendars.'},
              {n:'02',t:'Hawl Monitoring',d:'Wealth tracked for exactly one Hijri lunar year. Fluctuations allowed.'},
              {n:'03',t:'Year-End Assessment',d:'If wealth ≥ Nisab after the full Hawl, 2.5% Zakat is calculated and you are notified.'},
              {n:'04',t:'Pay & Renew',d:'Record payment. If wealth stays above Nisab, a new cycle begins automatically.'},
            ].map((s, i) => (
              <Reveal key={i} delay={i*60}>
                <div className="relative p-5 rounded-2xl h-full border" style={{background:'#f4f0e0',borderColor:'#2d6a4f20'}}>
                  <div className="text-4xl font-black serif leading-none mb-3 select-none" style={{color:'#2d6a4f18'}}>{s.n}</div>
                  <div className="font-black serif text-sm mb-2" style={{color:'#1a2e1a'}}>{s.t}</div>
                  <p className="sans text-xs leading-relaxed" style={{color:'#3a4a3a80'}}>{s.d}</p>
                  {i < 3 && <div className="hidden lg:flex absolute top-6 -right-2 w-4 h-4 rounded-full items-center justify-center z-10" style={{background:'#2d6a4f'}}><ChevronRight size={10} className="text-white"/></div>}
                </div>
              </Reveal>
            ))}
          </div>

          {/* Nisab reference */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {t:'Silver Nisab',v:'52.5 Tola',s:'≈ 612.36 grams',n:'Recommended',hex:'#2d6a4f'},
              {t:'Gold Nisab',v:'7.5 Tola',s:'≈ 87.48 grams',n:'Alternative',hex:'#9c6644'},
              {t:'Zakat Rate',v:'2.5%',s:'Of total eligible wealth',n:'After 1 Hijri year',hex:'#40916c'},
            ].map((item, i) => (
              <Reveal key={i} delay={i*50}>
                <div className="p-5 rounded-2xl border flex items-center gap-4" style={{background:'#f4f0e0',borderColor:'#2d6a4f15'}}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:item.hex+'15'}}>
                    <Coins size={20} style={{color:item.hex}}/>
                  </div>
                  <div>
                    <div className="sans text-[10px] font-bold tracking-widest uppercase mb-1" style={{color:item.hex}}>{item.t}</div>
                    <div className="text-2xl font-black serif" style={{color:'#1a2e1a'}}>{item.v}</div>
                    <div className="sans text-xs" style={{color:'#3a4a3a80'}}>{item.s}</div>
                    <div className="sans text-[10px] font-semibold mt-0.5" style={{color:item.hex+'99'}}>{item.n}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ PRICING */}
      <section id="pricing" className="py-28 px-4 sm:px-6 lg:px-8 border-y" style={{background:'#f4f0e0',borderColor:'#2d6a4f15'}}>
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="sans text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border mb-5 inline-block" style={{color:'#2d6a4f',borderColor:'#2d6a4f30',background:'#2d6a4f0c'}}>Pricing</span>
            <h2 className="text-4xl sm:text-5xl font-black serif tracking-tight mb-4" style={{color:'#1a2e1a'}}>Simple. Transparent.</h2>
            <p className="sans text-lg" style={{color:'#3a4a3a80'}}>All plans include a 5-day full trial. No credit card required.</p>
          </Reveal>

          <div className={`grid gap-4 max-w-4xl mx-auto ${plans.length===1?'max-w-sm':plans.length===2?'md:grid-cols-2':'md:grid-cols-3'}`}>
            {plans.map((plan, i) => {
              const pop = plan.pop || plan.isMostPopular;
              const feats = Array.isArray(plan.features) ? plan.features : ['Full Zakat Cycle Tracking','Multi-Account Management','Analytics & Reports','Priority Support'];
              return (
                <Reveal key={plan.id||i} delay={i*70}>
                  <div className="relative rounded-2xl overflow-hidden h-full flex flex-col border" style={{background:pop?'#1b4332':'#fefaef',borderColor:pop?'#2d6a4f':'#2d6a4f15'}}>
                    {pop && <div className="text-[10px] font-black sans tracking-widest uppercase text-center py-2" style={{background:'#2d6a4f',color:'#fefaef'}}>✦ Most Popular</div>}
                    <div className="p-7 flex flex-col flex-1">
                      <h3 className="text-lg font-black serif mb-1" style={{color:pop?'#d4edda':'#1a2e1a'}}>{plan.name}</h3>
                      <p className="sans text-xs mb-5" style={{color:pop?'#95d5b260':'#3a4a3a80'}}>{plan.duration||'Full access'}</p>
                      <div className="flex items-baseline gap-1 mb-7">
                        <span className="text-4xl font-black serif" style={{color:pop?'#95d5b2':'#1a2e1a'}}>৳{(plan.price||0).toLocaleString()}</span>
                        <span className="sans text-sm" style={{color:pop?'#95d5b260':'#3a4a3a60'}}>/{plan.duration||'period'}</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1">
                        {feats.map((f,fi) => (
                          <li key={fi} className="flex items-start gap-2.5 sans text-sm" style={{color:pop?'#95d5b2aa':'#3a4a3a'}}>
                            <Check size={14} style={{color:pop?'#52b788':'#2d6a4f',flexShrink:0,marginTop:2}}/>{f}
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => router.push(`/register?plan=${plan.id}`)}
                        className="w-full py-3.5 rounded-xl text-sm font-bold sans transition-opacity hover:opacity-90"
                        style={{background:pop?'#52b788':'#2d6a4f',color:pop?'#1a2e1a':'#fefaef'}}>
                        Get Started →
                      </button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal className="text-center mt-6 sans text-sm" style={{color:'#3a4a3a60'}}>All prices in BDT. Renewed manually — you'll always receive a reminder before expiry.</Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════ REVIEWS  */}
      <section id="reviews" className="py-28 overflow-hidden relative" style={{background:'#1b4332'}}>
        {/* Geometric ring deco */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[40px] opacity-5 pointer-events-none" style={{borderColor:'#95d5b2'}}/>

        <Reveal className="text-center mb-16 px-4">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border mb-6" style={{background:'#ffffff0a',borderColor:'#ffffff15'}}>
            <div className="flex gap-0.5">{[0,1,2,3,4].map(i=><Star key={i} size={13} className="text-amber-400 fill-amber-400"/>)}</div>
            <span className="font-bold sans text-sm" style={{color:'#d4edda'}}>4.9</span>
            <div className="w-px h-4" style={{background:'#ffffff20'}}/>
            <span className="sans text-sm" style={{color:'#95d5b260'}}>1,200+ users</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black serif tracking-tight mb-4" style={{color:'#d4edda'}}>
            Loved Across<br/><span style={{color:'#52b78860'}}>Bangladesh.</span>
          </h2>
          <p className="sans text-lg" style={{color:'#95d5b260'}}>Real users. Real results. Real Zakat fulfilled.</p>
        </Reveal>

        {/* Row 1 → left */}
        <div className="relative mb-3">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{background:'linear-gradient(90deg,#1b4332,transparent)'}}/>
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{background:'linear-gradient(270deg,#1b4332,transparent)'}}/>
          <div className="overflow-hidden">
            <div className="flex gap-3 mql whitespace-nowrap">
              {[...displayT, ...displayT].map((t, i) => {
                const COLS = ['#2d6a4f','#40916c','#1b4332','#52b788','#9c6644','#d4a373'];
                return (
                  <div key={i} className="inline-flex flex-col w-72 p-5 rounded-2xl border flex-shrink-0 whitespace-normal" style={{background:'#1f5c3a',borderColor:'#52b78815'}}>
                    <div className="flex gap-0.5 mb-3">{[0,1,2,3,4].map(s=><Star key={s} size={11} className={s<t.rating?'text-amber-400 fill-amber-400':'fill-white/10 text-white/10'}/>)}</div>
                    <p className="sans text-sm leading-relaxed mb-4 flex-1 line-clamp-4" style={{color:'#95d5b2aa'}}>"{t.msg}"</p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 serif" style={{background:COLS[i%COLS.length]}}>{t.name.charAt(0)}</div>
                      <div><div className="sans text-xs font-bold" style={{color:'#d4edda'}}>{t.name}</div><div className="sans text-[10px]" style={{color:'#52b78860'}}>{t.role}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2 → right */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{background:'linear-gradient(90deg,#1b4332,transparent)'}}/>
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{background:'linear-gradient(270deg,#1b4332,transparent)'}}/>
          <div className="overflow-hidden">
            <div className="flex gap-3 mqr whitespace-nowrap">
              {[...[...displayT].reverse(), ...[...displayT].reverse()].map((t, i) => {
                const COLS2 = ['#52b788','#9c6644','#2d6a4f','#d4a373','#40916c','#1b4332'];
                return (
                  <div key={i} className="inline-flex flex-col w-80 p-5 rounded-2xl border flex-shrink-0 whitespace-normal" style={{background:'#1f5c3a',borderColor:'#52b78815'}}>
                    <div className="flex gap-0.5 mb-3">{[0,1,2,3,4].map(s=><Star key={s} size={11} className={s<t.rating?'text-amber-400 fill-amber-400':'fill-white/10 text-white/10'}/>)}</div>
                    <p className="sans text-sm leading-relaxed mb-4 flex-1 line-clamp-4" style={{color:'#95d5b2aa'}}>"{t.msg}"</p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 serif" style={{background:COLS2[i%COLS2.length]}}>{t.name.charAt(0)}</div>
                      <div><div className="sans text-xs font-bold" style={{color:'#d4edda'}}>{t.name}</div><div className="sans text-[10px]" style={{color:'#52b78860'}}>{t.role}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Reveal className="text-center mt-12 px-4">
          <button onClick={trial} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl sans text-sm font-bold transition-opacity hover:opacity-90" style={{background:'#52b788',color:'#1b4332'}}>
            Join Them Today <ArrowRight size={14}/>
          </button>
        </Reveal>
      </section>

      {/* ══════════════════════════════════ FAQ */}
      <section id="faq" className="py-28 px-4 sm:px-6 lg:px-8 border-t" style={{background:'#fefaef',borderColor:'#2d6a4f15'}}>
        <div className="max-w-2xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="sans text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border mb-5 inline-block" style={{color:'#2d6a4f',borderColor:'#2d6a4f30',background:'#2d6a4f0c'}}>FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-black serif tracking-tight mb-4" style={{color:'#1a2e1a'}}>Got Questions?</h2>
            <p className="sans text-lg" style={{color:'#3a4a3a80'}}>Everything you need before getting started.</p>
          </Reveal>
          <div className="space-y-2">
            {FAQS.map((f, i) => (
              <Reveal key={i} delay={i*30}>
                <div className="rounded-2xl border overflow-hidden" style={{background:faq===i?'#f4f0e0':'#fefaef',borderColor:'#2d6a4f15'}}>
                  <button onClick={() => setFaq(faq===i?null:i)} className="w-full flex items-center justify-between px-5 py-4 text-left gap-4">
                    <span className="sans text-sm font-semibold" style={{color:'#1a2e1a'}}>{f.q}</span>
                    <ChevronDown size={16} style={{color:'#2d6a4f60',flexShrink:0}} className={`transition-transform duration-200 ${faq===i?'rotate-180':''}`}/>
                  </button>
                  <div className={`faq-body px-5 ${faq===i?'max-h-40 opacity-100 pb-4':'max-h-0 opacity-0'}`}>
                    <p className="sans text-sm leading-relaxed" style={{color:'#3a4a3a'}}>{f.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ FINAL CTA */}
      <section className="relative py-32 px-4 overflow-hidden" style={{background:'#1b4332'}}>
        {/* Decorative rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border-[60px] opacity-[0.04] pointer-events-none" style={{borderColor:'#95d5b2'}}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-[40px] opacity-[0.05] pointer-events-none" style={{borderColor:'#52b788'}}/>

        <Reveal className="text-center relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold sans tracking-widest uppercase mb-8" style={{borderColor:'#52b78830',background:'#52b78812',color:'#95d5b2'}}>
            <Sparkles size={10}/> 5-Day Free Trial · No Card Required
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black serif tracking-tight mb-6 leading-tight" style={{color:'#d4edda'}}>
            Your Wealth.<br/>Your Zakat.<br/>
            <span style={{color:'#52b788'}}>Your Confidence.</span>
          </h2>
          <p className="sans text-lg mb-10 max-w-xl mx-auto" style={{color:'#95d5b260'}}>
            Join thousands of Muslims across Bangladesh managing their finances and Zakat obligations with clarity on Nisab Wallet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={trial} className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold sans transition-opacity hover:opacity-90" style={{background:'#52b788',color:'#1b4332'}}>
              Create Free Account <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform"/>
            </button>
            <button onClick={() => setGuide(true)} className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold sans border transition-all" style={{color:'#95d5b2',borderColor:'#52b78840'}}>
              <BookOpen size={16}/> View Feature Guide
            </button>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════ FOOTER */}
      <footer className="border-t pt-16 pb-10 px-4 sm:px-6 lg:px-8" style={{background:'#141f15',borderColor:'#2d6a4f25'}}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-10 pb-12 border-b" style={{borderColor:'#2d6a4f20'}}>
            {/* Brand */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-2.5 mb-5">
                <Image src="/nisab-logo-white.png" alt="Nisab Wallet" width={32} height={32} className="rounded-xl"/>
                <span className="text-base font-black serif" style={{color:'#d4edda'}}>Nisab<span style={{color:'#52b788'}}>Wallet</span></span>
              </div>
              <p className="sans text-sm leading-relaxed mb-5 max-w-xs" style={{color:'#52b78860'}}>
                A Shariah-compliant Islamic finance platform — wealth management, Zakat automation, analytics and more.
              </p>
              <div className="flex gap-2">
                {[{I:Mail,h:'mailto:nisabwallet@gmail.com'},{I:Phone,h:null},{I:Globe,h:'#'}].map(({I,h},i) => (
                  <a key={i} href={h} className="w-9 h-9 rounded-xl flex items-center justify-center border transition-colors" style={{background:'#1f2e20',borderColor:'#2d6a4f30',color:'#52b78870'}}><I size={14}/></a>
                ))}
              </div>
            </div>
            {/* Links */}
            <div className="md:col-span-2">
              <h4 className="sans text-xs font-bold tracking-widest uppercase mb-4" style={{color:'#52b78870'}}>Product</h4>
              <ul className="space-y-2.5 sans text-sm" style={{color:'#52b78860'}}>
                {[['features','Features'],['how-it-works','How It Works'],['pricing','Pricing'],['reviews','Reviews'],['faq','FAQ']].map(([id,l]) => (
                  <li key={id}><button onClick={() => go(id)} className="hover:text-emerald-300 transition-colors">{l}</button></li>
                ))}
                <li><button onClick={() => setGuide(true)} className="hover:text-emerald-300 transition-colors flex items-center gap-1"><BookOpen size={11}/> Feature Guide</button></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="sans text-xs font-bold tracking-widest uppercase mb-4" style={{color:'#52b78870'}}>Account</h4>
              <ul className="space-y-2.5 sans text-sm" style={{color:'#52b78860'}}>
                {[['Create Account','/register'],['Sign In','/login'],['Reset Password','/forgot-password']].map(([l,h]) => (
                  <li key={l}><button onClick={() => router.push(h)} className="hover:text-emerald-300 transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="sans text-xs font-bold tracking-widest uppercase mb-4" style={{color:'#52b78870'}}>Company</h4>
              <ul className="space-y-2.5 sans text-sm" style={{color:'#52b78860'}}>
                {[['About Us','about'],['Contact','contact'],['Privacy Policy','privacy'],['Terms of Service','terms']].map(([l,m]) => (
                  <li key={l}><button onClick={() => setInfo(m)} className="hover:text-emerald-300 transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="sans text-xs font-bold tracking-widest uppercase mb-4" style={{color:'#52b78870'}}>Contact</h4>
              <ul className="space-y-3 sans text-sm" style={{color:'#52b78860'}}>
                {[{I:Mail,t:'nisabwallet@gmail.com',h:'mailto:nisabwallet@gmail.com'},{I:Phone,t:'WhatsApp: Coming Soon',h:null},{I:MapPin,t:'Bangladesh 🇧🇩'},{I:Clock,t:'Mon–Fri 9AM–6PM GMT+6'}].map(({I,t,h},i) => (
                  <li key={i} className="flex items-start gap-2"><I size={12} style={{color:'#52b788',marginTop:2,flexShrink:0}}/>{h?<a href={h} className="hover:text-emerald-300 transition-colors">{t}</a>:<span>{t}</span>}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 sans text-xs" style={{color:'#2d6a4f80'}}>
            <span>© {new Date().getFullYear()} Nisab Wallet. All rights reserved.</span>
            <span className="flex items-center gap-1">Built with <Heart size={11} style={{color:'#f87171',fill:'#f87171',margin:'0 2px'}}/> for the Muslim community · Bangladesh</span>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════ OVERLAYS */}
      {featModal && <FeatModal f={featModal} onClose={() => setFeat(null)} onTrial={() => { setFeat(null); trial(); }} onGuide={() => { setFeat(null); setGuide(true); }}/>}
      {guide && <GuideDrawer open={guide} onClose={() => setGuide(false)} onTrial={trial}/>}
      {infoModal && <InfoModal type={infoModal} onClose={() => setInfo(null)} router={router}/>}
    </div>
  );
}
