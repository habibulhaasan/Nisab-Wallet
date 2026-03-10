// src/app/dashboard/guide/page.js
'use client';

import { useState } from 'react';
import {
  BookOpen, CreditCard, Receipt, ArrowRightLeft, FolderOpen,
  Target, PiggyBank, HandCoins, Sprout, Star, BarChart3,
  Repeat, FileText, ShoppingBag, ChevronDown, ChevronRight,
  CheckCircle2, AlertCircle, Info, Lightbulb, Wallet, Building2,
  Smartphone, Coins, TrendingUp, TrendingDown, Moon, Shield,
  Clock, Calendar, Search, Filter, Edit2, Trash2, Zap, RefreshCw,
  Blend, Plus, X, ArrowUpCircle, ArrowDownCircle, Settings,
  History, Calculator, Tag, Download, Sparkles, Bell,
} from 'lucide-react';

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'bg-blue-100 text-blue-700',     active: 'bg-blue-700 text-white'    },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  icon: 'bg-violet-100 text-violet-700', active: 'bg-violet-700 text-white'  },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700',active:'bg-emerald-700 text-white' },
  cyan:    { bg: 'bg-cyan-50',    border: 'border-cyan-200',    icon: 'bg-cyan-100 text-cyan-700',     active: 'bg-cyan-700 text-white'    },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    icon: 'bg-teal-100 text-teal-700',     active: 'bg-teal-700 text-white'    },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  icon: 'bg-orange-100 text-orange-700', active: 'bg-orange-600 text-white'  },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    icon: 'bg-rose-100 text-rose-700',     active: 'bg-rose-700 text-white'    },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'bg-amber-100 text-amber-700',   active: 'bg-amber-600 text-white'   },
  green:   { bg: 'bg-green-50',   border: 'border-green-200',   icon: 'bg-green-100 text-green-700',   active: 'bg-green-700 text-white'   },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: 'bg-indigo-100 text-indigo-700', active: 'bg-indigo-700 text-white'  },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-200',    icon: 'bg-pink-100 text-pink-700',     active: 'bg-pink-700 text-white'    },
  slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',   icon: 'bg-slate-100 text-slate-700',   active: 'bg-slate-700 text-white'   },
};

// ─── Shared mockup browser chrome wrapper ─────────────────────────────────────
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

// ─── Accounts page mockup ─────────────────────────────────────────────────────
function AccountsMockup() {
  return (
    <MockupFrame title="Accounts — /dashboard/accounts">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Accounts</div>
          <div className="text-[10px] text-gray-500">Manage your financial accounts</div>
        </div>
        <div className="flex gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-medium">
            <Download size={10}/> Load Defaults
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium">
            <Plus size={10}/> Add Account
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-3 text-white mb-3">
        <div className="text-[10px] text-gray-300 mb-0.5">Total Balance</div>
        <div className="text-xl font-bold">৳1,25,000</div>
        <div className="text-[10px] text-gray-300 mt-0.5">Across 4 accounts</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: 'Cash', type: 'Cash', bal: '25,000', Icon: Wallet, hasGoal: false },
          { name: 'DBBL Savings', type: 'Bank', bal: '80,000', Icon: Building2, hasGoal: false },
          { name: 'bKash', type: 'Mobile Banking', bal: '5,000', Icon: Smartphone, hasGoal: true },
          { name: 'Gold', type: 'Gold', bal: '15,000', Icon: Coins, hasGoal: false },
        ].map((acc, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5 relative">
            {i === 1 && (
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[8px] font-medium flex items-center gap-0.5">
                <Sparkles size={7}/> Default
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <acc.Icon size={13} className="text-gray-700"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-gray-900 truncate">{acc.name}</div>
                <div className="text-[9px] text-gray-500">{acc.type}</div>
              </div>
              <div className="flex gap-0.5">
                <div className="p-1 rounded"><Edit2 size={9} className="text-gray-400"/></div>
                <div className="p-1 rounded"><Trash2 size={9} className="text-gray-400"/></div>
              </div>
            </div>
            <div className="text-base font-bold text-gray-900">৳{acc.bal}</div>
            {acc.hasGoal && (
              <div className="mt-1.5 pt-1.5 border-t border-gray-100">
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-green-600 font-medium">Available to Spend</span>
                  <span className="font-bold">৳2,000</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-orange-500 font-medium">Allocated to Goals</span>
                  <span className="font-bold">৳3,000</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

// ─── Transactions list mockup ─────────────────────────────────────────────────
function TransactionsMockup() {
  return (
    <MockupFrame title="Transactions — /dashboard/transactions">
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[
          { label: 'Total Balance', val: '৳1,25,000', color: 'text-gray-900', Icon: Wallet },
          { label: 'Income', val: '+৳45,000', color: 'text-green-600', Icon: ArrowUpCircle },
          { label: 'Expense', val: '-৳18,500', color: 'text-red-600', Icon: ArrowDownCircle },
          { label: 'Net', val: '+৳26,500', color: 'text-green-600', Icon: TrendingUp },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="flex items-center gap-1 mb-1">
              <div className="text-[9px] font-medium text-gray-500 uppercase">{s.label}</div>
              <s.Icon size={9} className={s.color}/>
            </div>
            <div className={`text-sm font-bold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {['All', 'Income', 'Expense'].map((f, i) => (
          <div key={i} className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${i===0?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-600 border-gray-200'}`}>{f}</div>
        ))}
        <div className="px-2 py-1 rounded-lg text-[10px] border border-gray-200 bg-white text-gray-600">This Month ▾</div>
        <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-gray-200 bg-white text-gray-400">
          <Search size={8}/> Search...
        </div>
      </div>
      <div className="bg-gray-100 rounded px-2 py-1.5 flex justify-between items-center mb-1.5 border border-gray-200">
        <span className="text-[10px] font-semibold text-gray-700">Today, 10 Mar 2026</span>
        <div className="flex gap-2 text-[9px]">
          <span className="text-green-600 font-medium">+৳45,000</span>
          <span className="text-red-600 font-medium">-৳1,200</span>
        </div>
      </div>
      {[
        { cat: 'Salary', acc: 'DBBL Savings', amt: '+৳45,000', bg: 'bg-green-50', dot: '#10B981', Icon: ArrowUpCircle, ic: 'text-green-600', ac: 'text-green-600', isT: false },
        { cat: 'Foods', acc: 'Cash', amt: '-৳1,200', bg: 'bg-red-50', dot: '#EC4899', Icon: ArrowDownCircle, ic: 'text-red-600', ac: 'text-red-600', isT: false },
        { cat: 'bKash → Cash', acc: 'Transfer', amt: '৳3,000', bg: 'bg-blue-50', dot: '#3B82F6', Icon: ArrowRightLeft, ic: 'text-blue-500', ac: 'text-blue-600', isT: true },
      ].map((tx, i) => (
        <div key={i} className={`flex items-center gap-2 px-2 py-2 rounded-lg ${tx.bg} mb-1`}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm flex-shrink-0">
            <tx.Icon size={12} className={tx.ic}/>
          </div>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tx.dot }}/>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-gray-900 flex items-center gap-1">
              {tx.cat}
              {tx.isT && <ArrowRightLeft size={9} className="text-blue-400"/>}
            </div>
            <div className="text-[9px] text-gray-500">{tx.acc}</div>
          </div>
          <div className={`text-xs font-bold ${tx.ac}`}>{tx.amt}</div>
          <div className="flex gap-0.5">
            <div className="p-0.5"><Edit2 size={9} className="text-gray-300"/></div>
            <div className="p-0.5"><Trash2 size={9} className="text-gray-300"/></div>
          </div>
        </div>
      ))}
    </MockupFrame>
  );
}

// ─── Transaction modal mockup (tabbed) ───────────────────────────────────────
function TransactionModalMockup({ tab = 'expense' }) {
  const cfg = {
    income:   { bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-600',  btn: 'bg-green-600',  tabBg: 'bg-green-600 text-white'  },
    expense:  { bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-600',    btn: 'bg-red-600',    tabBg: 'bg-red-600 text-white'    },
    transfer: { bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-600',   btn: 'bg-blue-600',   tabBg: 'bg-blue-600 text-white'   },
  };
  const c = cfg[tab];
  const isT = tab === 'transfer';
  return (
    <MockupFrame title={`Add Transaction Modal — ${tab} tab`}>
      <div className="bg-white rounded-xl border border-gray-200 max-w-xs mx-auto p-3">
        <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-lg p-0.5 mb-3">
          {['income','expense','transfer'].map(t => (
            <button key={t} className={`py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center justify-center gap-0.5 ${tab===t ? c.tabBg : 'text-gray-500'}`}>
              {t==='income' && <TrendingUp size={9}/>}
              {t==='expense' && <TrendingDown size={9}/>}
              {t==='transfer' && <ArrowRightLeft size={9}/>}
              {t}
            </button>
          ))}
        </div>
        {isT ? (
          <>
            <div className={`text-[10px] font-bold uppercase ${c.text} mb-1`}>Amount (৳)</div>
            <div className={`w-full rounded-lg p-2.5 text-xl font-bold text-center ${c.bg} ${c.text} border-2 ${c.border} mb-3`}>3,000</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>From Account</div>
                <div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] font-bold ${c.text}`}>bKash (৳5,000)</div>
              </div>
              <div>
                <div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>To Account</div>
                <div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] font-bold ${c.text}`}>Cash (৳25,000)</div>
              </div>
            </div>
            <div className="mb-3">
              <div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>Date</div>
              <div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] ${c.text}`}>10 Mar 2026</div>
            </div>
          </>
        ) : (
          <>
            <div className={`text-[10px] font-bold uppercase ${c.text} mb-1`}>Amount (৳)</div>
            <div className={`w-full rounded-lg p-2.5 text-xl font-bold text-center ${c.bg} ${c.text} border-2 ${c.border} mb-3`}>
              {tab==='income' ? '45,000' : '1,200'}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>Account</div>
                <div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] font-bold ${c.text}`}>
                  {tab==='income' ? 'DBBL Savings' : 'Cash (Avail: ৳22k)'}
                </div>
              </div>
              <div>
                <div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>Category</div>
                <div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] font-bold ${c.text}`}>
                  {tab==='income' ? 'Salary' : 'Foods'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>Date</div>
                <div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] ${c.text}`}>10 Mar 2026</div>
              </div>
              <div>
                <div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>Note</div>
                <div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] text-gray-400`}>Optional...</div>
              </div>
            </div>
          </>
        )}
        <button className={`w-full py-2.5 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider ${c.btn} flex items-center justify-center gap-1.5`}>
          {isT ? <ArrowRightLeft size={11}/> : tab==='income' ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
          Confirm {isT ? 'Transfer' : tab==='income' ? 'Income' : 'Expense'}
        </button>
      </div>
    </MockupFrame>
  );
}

// ─── Categories mockup ────────────────────────────────────────────────────────
function CategoriesMockup() {
  const income = [{ name: 'Salary', color: '#10B981' }, { name: 'Bonus', color: '#3B82F6' }, { name: 'Freelance', color: '#8B5CF6' }];
  const expense = [{ name: 'Foods', color: '#EC4899' }, { name: 'Transport', color: '#EF4444' }, { name: 'Shopping', color: '#8B5CF6' }, { name: 'Healthcare', color: '#06B6D4' }];
  return (
    <MockupFrame title="Categories — /dashboard/categories">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-semibold text-gray-900">Categories</div>
        <div className="flex gap-1.5">
          <div className="px-2 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Download size={9}/>Load Defaults</div>
          <div className="px-2 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>Add Category</div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-2.5 mb-2">
        <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-gray-900"><Tag size={11} className="text-green-600"/> Income Categories ({income.length})</div>
        <div className="grid grid-cols-3 gap-1.5">
          {income.map((cat, i) => (
            <div key={i} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: cat.color+'20' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}/>
                </div>
                <span className="text-[10px] font-medium text-gray-900">{cat.name}</span>
              </div>
              <div className="flex gap-0.5"><Edit2 size={9} className="text-gray-400"/><Trash2 size={9} className="text-gray-400"/></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-2.5">
        <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-gray-900"><Tag size={11} className="text-red-600"/> Expense Categories ({expense.length})</div>
        <div className="grid grid-cols-2 gap-1.5">
          {expense.map((cat, i) => (
            <div key={i} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: cat.color+'20' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}/>
                </div>
                <span className="text-[10px] font-medium text-gray-900">{cat.name}</span>
              </div>
              <div className="flex gap-0.5"><Edit2 size={9} className="text-gray-400"/><Trash2 size={9} className="text-gray-400"/></div>
            </div>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}

// ─── Zakat mockup ─────────────────────────────────────────────────────────────
function ZakatMockup() {
  return (
    <MockupFrame title="Zakat — /dashboard/zakat">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-semibold text-gray-900">Zakat Tracker</div>
        <div className="flex gap-1.5">
          <div className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-medium flex items-center gap-1"><History size={9}/>History</div>
          <div className="px-2 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Settings size={9}/>Settings</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="bg-gray-900 text-white rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-gray-400"/>
            <div>
              <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Status</div>
              <div className="text-sm font-bold">Not Mandatory</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 rounded-lg p-2"><div className="text-[9px] text-gray-400 mb-0.5">Total Wealth</div><div className="text-sm font-bold">৳95,000</div></div>
            <div className="bg-white/10 rounded-lg p-2"><div className="text-[9px] text-gray-400 mb-0.5">Nisab Threshold</div><div className="text-sm font-bold">৳1,20,000</div></div>
          </div>
          <div className="mt-2 text-[10px] text-gray-400">Wealth is ৳25,000 below Nisab. No action needed.</div>
        </div>
        <div className="bg-blue-600 text-white rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-200"/>
            <div>
              <div className="text-[9px] text-blue-200 uppercase font-bold tracking-widest">Status</div>
              <div className="text-sm font-bold">Monitoring Cycle Active</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-white/15 rounded-lg p-1.5"><div className="text-[9px] text-blue-200 mb-0.5">Total Wealth</div><div className="text-xs font-bold">৳1,45,000</div></div>
            <div className="bg-white/15 rounded-lg p-1.5"><div className="text-[9px] text-blue-200 mb-0.5">Days Remaining</div><div className="text-xs font-bold">287 days</div></div>
            <div className="bg-white/15 rounded-lg p-1.5"><div className="text-[9px] text-blue-200 mb-0.5">Cycle Start</div><div className="text-xs font-bold">12 Sha'ban</div></div>
          </div>
          <div className="mt-2 text-[10px] text-blue-200">Hawl year-end: 12 Sha'ban 1447 (Mar 2026)</div>
        </div>
        <div className="bg-red-600 text-white rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-yellow-300"/>
            <div>
              <div className="text-[9px] text-red-200 uppercase font-bold tracking-widest">Status</div>
              <div className="text-sm font-bold">Zakat Due</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-white/15 rounded-lg p-2"><div className="text-[9px] text-red-200 mb-0.5">Total Wealth</div><div className="text-sm font-bold">৳1,60,000</div></div>
            <div className="bg-white/15 rounded-lg p-2"><div className="text-[9px] text-red-200 mb-0.5">Zakat Due (2.5%)</div><div className="text-sm font-bold text-yellow-300">৳4,000</div></div>
          </div>
          <button className="w-full py-1.5 bg-white text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
            <Calculator size={10}/> Record Payment
          </button>
        </div>
      </div>
    </MockupFrame>
  );
}

// ─── Analytics mockup ─────────────────────────────────────────────────────────
function AnalyticsMockup() {
  const bars = [
    { m: 'Oct', i: 60, e: 45 }, { m: 'Nov', i: 72, e: 55 },
    { m: 'Dec', i: 58, e: 70 }, { m: 'Jan', i: 80, e: 48 },
    { m: 'Feb', i: 65, e: 52 }, { m: 'Mar', i: 90, e: 40 },
  ];
  const pie = [
    { name: 'Foods', pct: 35, color: '#EC4899' }, { name: 'Transport', pct: 22, color: '#EF4444' },
    { name: 'Shopping', pct: 18, color: '#8B5CF6' }, { name: 'Healthcare', pct: 15, color: '#06B6D4' },
    { name: 'Other', pct: 10, color: '#F59E0B' },
  ];
  return (
    <MockupFrame title="Analytics — /dashboard/analytics">
      <div className="flex gap-1.5 mb-3">
        {['Week','Month','Year','Custom'].map((r,i) => (
          <div key={i} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border ${i===2?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-600 border-gray-200'}`}>{r}</div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[{ l:'Total Income',v:'৳5,40,000',c:'text-green-600'},{ l:'Total Expense',v:'৳3,10,000',c:'text-red-600'},{ l:'Net Savings',v:'৳2,30,000',c:'text-green-600'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2"><div className="text-[9px] text-gray-500 mb-0.5">{s.l}</div><div className={`text-sm font-bold ${s.c}`}>{s.v}</div></div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-2.5 mb-2">
        <div className="text-[10px] font-semibold text-gray-700 mb-2 flex items-center gap-1"><BarChart3 size={10}/>Income vs Expense (6 months)</div>
        <div className="flex items-end gap-2 h-16">
          {bars.map((b,i)=>(
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-0.5 items-end">
                <div className="flex-1 bg-emerald-400 rounded-sm" style={{height:`${b.i*0.6}px`}}/>
                <div className="flex-1 bg-red-400 rounded-sm" style={{height:`${b.e*0.6}px`}}/>
              </div>
              <div className="text-[7px] text-gray-400">{b.m}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-1">
          <div className="flex items-center gap-1 text-[9px] text-gray-600"><div className="w-2 h-2 rounded-sm bg-emerald-400"/>Income</div>
          <div className="flex items-center gap-1 text-[9px] text-gray-600"><div className="w-2 h-2 rounded-sm bg-red-400"/>Expense</div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-2.5">
        <div className="text-[10px] font-semibold text-gray-700 mb-2">Expense by Category (This Year)</div>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full flex-shrink-0 relative" style={{background:'conic-gradient(#EC4899 0% 35%, #EF4444 35% 57%, #8B5CF6 57% 75%, #06B6D4 75% 90%, #F59E0B 90% 100%)'}}>
            <div className="absolute inset-2 bg-white rounded-full"/>
          </div>
          <div className="space-y-0.5 flex-1">
            {pie.map((p,i)=>(
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor:p.color}}/><span className="text-[9px] text-gray-700">{p.name}</span></div>
                <span className="text-[9px] font-semibold">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}

// ─── Budgets mockup ───────────────────────────────────────────────────────────
function BudgetsMockup() {
  const budgets = [
    { cat: 'Foods', color: '#EC4899', spent: 8500, limit: 10000 },
    { cat: 'Transport', color: '#EF4444', spent: 4800, limit: 5000 },
    { cat: 'Shopping', color: '#8B5CF6', spent: 12000, limit: 8000 },
    { cat: 'Healthcare', color: '#06B6D4', spent: 2000, limit: 6000 },
  ];
  return (
    <MockupFrame title="Budgets — /dashboard/budgets">
      <div className="flex justify-between items-center mb-3">
        <div><div className="text-sm font-semibold text-gray-900">Monthly Budgets</div><div className="text-[10px] text-gray-500">March 2026</div></div>
        <div className="px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><CheckCircle2 size={9}/>Save All Budgets</div>
      </div>
      <div className="space-y-2">
        {budgets.map((b, i) => {
          const pct = Math.min(100, (b.spent / b.limit) * 100);
          const over = b.spent > b.limit;
          const warn = pct >= 80 && !over;
          const barC = over ? '#EF4444' : warn ? '#F59E0B' : '#10B981';
          return (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:b.color}}/>
                  <span className="text-[11px] font-semibold text-gray-900">{b.cat}</span>
                  {over && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-bold">OVER</span>}
                  {warn && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[8px] font-bold">WARNING</span>}
                </div>
                <div className="text-right">
                  <span className={`text-[11px] font-bold ${over?'text-red-600':'text-gray-900'}`}>৳{b.spent.toLocaleString()}</span>
                  <span className="text-[9px] text-gray-400"> / ৳{b.limit.toLocaleString()}</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{width:`${Math.min(100,pct)}%`,backgroundColor:barC}}/>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-gray-400">{pct.toFixed(0)}% used</span>
                {over ? <span className="text-[8px] text-red-500 font-medium">৳{(b.spent-b.limit).toLocaleString()} over</span>
                      : <span className="text-[8px] text-gray-400">৳{(b.limit-b.spent).toLocaleString()} left</span>}
              </div>
            </div>
          );
        })}
      </div>
    </MockupFrame>
  );
}

// ─── Goals mockup ─────────────────────────────────────────────────────────────
function GoalsMockup() {
  return (
    <MockupFrame title="Goals — /dashboard/goals">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-semibold text-gray-900">Financial Goals</div>
        <div className="px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>Add Goal</div>
      </div>
      <div className="space-y-2">
        {[
          { name:'Emergency Fund', target:100000, current:65000, date:'Dec 2026', color:'#EF4444', done:false },
          { name:'New Laptop', target:80000, current:80000, date:'Mar 2026', color:'#3B82F6', done:true },
          { name:'Eid Shopping', target:20000, current:8000, date:'Apr 2026', color:'#10B981', done:false },
        ].map((g,i)=>{
          const pct=Math.min(100,(g.current/g.target)*100);
          return (
            <div key={i} className={`bg-white rounded-lg border p-2.5 ${g.done?'border-emerald-200 bg-emerald-50/30':'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-gray-900">{g.name}</span>
                    {g.done && <CheckCircle2 size={11} className="text-emerald-500"/>}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Target: {g.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">৳{g.current.toLocaleString()}</div>
                  <div className="text-[9px] text-gray-400">of ৳{g.target.toLocaleString()}</div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className="h-full rounded-full" style={{width:`${pct}%`,backgroundColor:g.done?'#10B981':g.color}}/>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500">{pct.toFixed(0)}% reached</span>
                {!g.done ? (
                  <div className="flex gap-1">
                    <button className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[8px] font-medium">+ Deposit</button>
                    <button className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[8px] font-medium">Withdraw</button>
                  </div>
                ) : <span className="text-[9px] font-semibold text-emerald-600">Goal Achieved! 🎉</span>}
              </div>
            </div>
          );
        })}
      </div>
    </MockupFrame>
  );
}

// ─── Transfer mockup ──────────────────────────────────────────────────────────
function TransferMockup() {
  return (
    <MockupFrame title="Transfer — /dashboard/transfer">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-[11px] font-semibold text-gray-900 mb-3">New Transfer</div>
          {[{ l:'From Account', v:'bKash (৳5,000)' }, { l:'To Account', v:'Cash (৳25,000)' }, { l:'Amount (৳)', v:'3,000' }, { l:'Date', v:'10 Mar 2026' }].map((f,i)=>(
            <div key={i} className="mb-2">
              <div className="text-[9px] font-medium text-gray-600 mb-1">{f.l}</div>
              {i===2 ? (
                <>
                  <div className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-700">{f.v}</div>
                  <div className="text-[8px] text-gray-400 mt-0.5">Available: ৳5,000</div>
                </>
              ) : (
                <>
                  {i===1 && (
                    <div className="flex justify-center mb-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <ArrowRightLeft size={12} className="text-gray-600"/>
                      </div>
                    </div>
                  )}
                  <div className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-700">{f.v}</div>
                </>
              )}
            </div>
          ))}
          <button className="w-full py-2 bg-gray-900 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 mt-1">
            <ArrowRightLeft size={10}/>Transfer Money
          </button>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-semibold text-gray-900">Recent Transfers</div>
            <Clock size={11} className="text-gray-400"/>
          </div>
          <div className="space-y-2">
            {[{ from:'bKash',to:'Cash',amt:'৳3,000',date:'10 Mar'},{ from:'DBBL',to:'bKash',amt:'৳10,000',date:'5 Mar'},{ from:'Cash',to:'DBBL',amt:'৳5,000',date:'28 Feb'}].map((t,i)=>(
              <div key={i} className="border border-gray-100 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ArrowRightLeft size={10} className="text-blue-600"/>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-gray-900">
                      {t.from}<ChevronRight size={8} className="text-gray-400"/>{t.to}
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-gray-900">{t.amt}</div>
                </div>
                <div className="text-[8px] text-gray-400 mt-0.5 ml-7">{t.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}

// ─── Loans mockup ─────────────────────────────────────────────────────────────
function LoansMockup() {
  return (
    <MockupFrame title="Loans — /dashboard/loans">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-semibold text-gray-900">Loans</div>
        <div className="px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>Add Loan</div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[{ l:'Total Borrowed',v:'৳2,00,000',c:'text-gray-900'},{ l:'Outstanding',v:'৳1,50,000',c:'text-red-600'},{ l:'Repaid',v:'৳50,000',c:'text-green-600'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2"><div className="text-[9px] text-gray-500 mb-0.5">{s.l}</div><div className={`text-xs font-bold ${s.c}`}>{s.v}</div></div>
        ))}
      </div>
      <div className="space-y-2">
        {[
          { lender:'Dutch-Bangla Bank', type:'Conventional', principal:150000, outstanding:120000, overdue:false },
          { lender:'Uncle Karim', type:'Qard Hasan', principal:50000, outstanding:30000, overdue:true },
        ].map((loan,i)=>{
          const paid=((loan.principal-loan.outstanding)/loan.principal)*100;
          return (
            <div key={i} className={`bg-white rounded-lg border p-2.5 ${loan.overdue?'border-red-200 bg-red-50/20':'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-900">{loan.lender}</span>
                    {loan.overdue && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-bold">OVERDUE</span>}
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${loan.type==='Qard Hasan'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{loan.type}</span>
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Principal: ৳{loan.principal.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-600">৳{loan.outstanding.toLocaleString()}</div>
                  <div className="text-[9px] text-gray-400">outstanding</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-green-400 rounded-full" style={{width:`${paid}%`}}/>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-gray-500">{paid.toFixed(0)}% repaid</span>
                <button className="px-2 py-0.5 bg-gray-900 text-white rounded text-[9px] font-medium">Pay</button>
              </div>
            </div>
          );
        })}
      </div>
    </MockupFrame>
  );
}

// ─── Recurring mockup ─────────────────────────────────────────────────────────
function RecurringMockup() {
  return (
    <MockupFrame title="Recurring — /dashboard/recurring">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-semibold text-gray-900">Recurring Transactions</div>
        <div className="flex gap-1.5">
          <div className="px-2 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-medium flex items-center gap-1"><Bell size={9}/> 2 Pending</div>
          <div className="px-2 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>Add</div>
        </div>
      </div>
      <div className="flex gap-1.5 mb-3">
        {['All','Active','Paused','Completed'].map((s,i)=>(
          <div key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${i===1?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-500 border-gray-200'}`}>{s}</div>
        ))}
      </div>
      <div className="space-y-2">
        {[
          { name:'Monthly Rent', type:'Expense', freq:'Monthly · 1st', amt:'৳15,000', status:'active', mode:'Auto', next:'1 Apr' },
          { name:'Salary Credit', type:'Income', freq:'Monthly · 5th', amt:'৳45,000', status:'active', mode:'Auto', next:'5 Apr' },
          { name:'Electricity Bill', type:'Expense', freq:'Monthly · 25th', amt:'৳~800', status:'active', mode:'Manual', next:'25 Mar' },
          { name:'Netflix', type:'Expense', freq:'Monthly · 15th', amt:'৳400', status:'paused', mode:'Auto', next:'Paused' },
        ].map((r,i)=>(
          <div key={i} className={`bg-white rounded-lg border p-2.5 ${r.status==='paused'?'border-gray-100 opacity-60':'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.type==='Income'?'bg-green-100':'bg-red-100'}`}>
                  {r.type==='Income'?<TrendingUp size={13} className="text-green-600"/>:<TrendingDown size={13} className="text-red-600"/>}
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-900">{r.name}</div>
                  <div className="text-[9px] text-gray-500">{r.freq}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${r.type==='Income'?'text-green-600':'text-red-600'}`}>{r.amt}</div>
                <div className="flex gap-0.5 justify-end mt-0.5">
                  {r.mode==='Manual' && <span className="px-1 py-0.5 bg-amber-100 text-amber-700 rounded text-[7px] font-bold">MANUAL</span>}
                  {r.status==='paused' && <span className="px-1 py-0.5 bg-gray-100 text-gray-500 rounded text-[7px] font-bold">PAUSED</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] text-gray-400">Next: {r.next}</span>
              <div className="flex gap-1">
                <button className={`p-1 rounded ${r.status==='active'?'bg-amber-50':'bg-green-50'}`}>
                  {r.status==='active'?<Clock size={9} className="text-amber-500"/>:<TrendingUp size={9} className="text-green-500"/>}
                </button>
                <button className="p-1 bg-gray-50 rounded"><Edit2 size={9} className="text-gray-400"/></button>
                <button className="p-1 bg-red-50 rounded"><Trash2 size={9} className="text-red-400"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────
function SectionText({ content }) {
  return <p className="text-sm text-gray-700 leading-relaxed">{content}</p>;
}
function SectionList({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            {Icon && <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"><Icon size={14} className="text-gray-600"/></div>}
            <div><div className="text-sm font-semibold text-gray-900">{item.label}</div>{item.desc && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>}</div>
          </div>
        );
      })}
    </div>
  );
}
function SectionSteps({ items }) {
  return (
    <ol className="space-y-3">
      {items.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full text-xs font-bold flex items-center justify-center mt-0.5">{i+1}</span>
          <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p>
        </li>
      ))}
    </ol>
  );
}
function SectionFlow({ items }) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center self-stretch">
            <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1.5 ring-2 ring-blue-100"/>
            {i < items.length-1 && <div className="w-0.5 bg-blue-200 flex-1 mt-1" style={{minHeight:24}}/>}
          </div>
          <div className="pb-4">
            <div className="text-sm font-semibold text-gray-900">{item.label}</div>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
function SectionCallout({ content, variant }) {
  const s = {
    info:    { bg:'bg-blue-50',    border:'border-blue-200',    icon:<Info size={15} className="text-blue-600 flex-shrink-0 mt-0.5"/>,          text:'text-blue-900'    },
    warning: { bg:'bg-amber-50',   border:'border-amber-200',   icon:<AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5"/>,   text:'text-amber-900'   },
    success: { bg:'bg-emerald-50', border:'border-emerald-200', icon:<CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5"/>, text:'text-emerald-900' },
  }[variant] || { bg:'bg-blue-50', border:'border-blue-200', icon:<Info size={15} className="text-blue-600 flex-shrink-0 mt-0.5"/>, text:'text-blue-900' };
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border ${s.bg} ${s.border}`}>
      {s.icon}<p className={`text-sm leading-relaxed ${s.text}`}>{content}</p>
    </div>
  );
}
function SectionTips({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((tip, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5"/>
          <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
        </li>
      ))}
    </ul>
  );
}
function SectionMockupTabs({ mockups }) {
  const [active, setActive] = useState(mockups[0]?.tab || 0);
  const cur = mockups.find(m => m.tab === active) || mockups[0];
  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        {mockups.map(m => (
          <button key={m.tab} onClick={() => setActive(m.tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${active===m.tab?'bg-gray-900 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {m.tab}
          </button>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden">{cur?.node}</div>
      {cur?.caption && <p className="text-[11px] text-gray-400 mt-2 text-center italic leading-relaxed">{cur.caption}</p>}
    </div>
  );
}

function GuideSection({ section }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/80 hover:bg-gray-100 transition-colors text-left gap-2">
        <span className="text-sm font-semibold text-gray-800">{section.heading}</span>
        {open ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0"/> : <ChevronRight size={15} className="text-gray-400 flex-shrink-0"/>}
      </button>
      {open && (
        <div className="px-4 py-4 bg-white">
          {section.type === 'text'       && <SectionText content={section.content}/>}
          {section.type === 'list'       && <SectionList items={section.items}/>}
          {section.type === 'steps'      && <SectionSteps items={section.items}/>}
          {section.type === 'flow'       && <SectionFlow items={section.items}/>}
          {section.type === 'callout'    && <SectionCallout content={section.content} variant={section.variant}/>}
          {section.type === 'tips'       && <SectionTips items={section.items}/>}
          {section.type === 'mockupTabs' && <SectionMockupTabs mockups={section.mockups}/>}
        </div>
      )}
    </div>
  );
}

// ─── All guide data ───────────────────────────────────────────────────────────
const GUIDES = [
  {
    id:'accounts', icon:CreditCard, color:'blue', title:'Accounts', subtitle:'Your financial containers',
    summary:'Accounts are the foundation of everything in Nisab Wallet. Every transaction, transfer, goal, and Zakat calculation is tied to an account balance.',
    mockup:<AccountsMockup/>,
    mockupCaption:'The Accounts page — dark gradient Total Balance card, then individual account cards in a grid. The bKash card shows goal allocation (Available vs. Goal Reserved breakdown).',
    sections:[
      { heading:'What is an Account?', type:'text', content:'An account represents any place you hold money — your wallet, a bank account, mobile banking app, gold, or silver. Nisab Wallet consolidates all of them into one view.' },
      { heading:'Account Types', type:'list', items:[
        { icon:Wallet,     label:'Cash',           desc:'Physical money in your pocket or home safe' },
        { icon:Building2,  label:'Bank Account',   desc:'Savings or current accounts at any bank (DBBL, Islami Bank, etc.)' },
        { icon:Smartphone, label:'Mobile Banking', desc:'bKash, Nagad, Rocket, or any MFS wallet' },
        { icon:Coins,      label:'Gold',           desc:'Enter current market value in Taka — update when prices change' },
        { icon:Coins,      label:'Silver',         desc:'Enter current market value in Taka — also used for Nisab threshold calculation' },
      ]},
      { heading:'Getting Started', type:'steps', items:[
        'Click "Load Defaults" to instantly create Cash, Bank 1, bKash, and Bank 2 accounts with ৳0 balance',
        'Or click "Add Account", pick a type, give it a descriptive name, and enter your current balance',
        'Balances update automatically with every transaction — or edit them directly any time',
        'Delete an account only when it has no linked transactions, goals, or loans',
      ]},
      { heading:'Goal Allocation Breakdown on Account Cards', type:'callout', variant:'info', content:'When Financial Goals are linked to an account, the card shows two figures: Total Balance and Available to Spend. Available = Total minus goal-reserved funds. Expense transactions cannot use goal-reserved money — blocked automatically.' },
      { heading:'How Accounts Connect to Everything', type:'flow', items:[
        { label:'Transactions', desc:'Every income/expense instantly credits or debits a chosen account balance' },
        { label:'Transfers', desc:'Move money between accounts — both balances update simultaneously' },
        { label:'Goals', desc:'Funds reserved for goals reduce Available to Spend balance on that account' },
        { label:'Loans & Lendings', desc:'Borrowed/lent amounts are drawn from or added to a selected account' },
        { label:'Zakat', desc:'Sum of ALL account balances = your total wealth compared against Nisab' },
      ]},
      { heading:'Pro Tips', type:'tips', items:[
        'Name accounts specifically — "DBBL Savings" is much clearer than "Bank" in transaction history',
        'Update Gold and Silver values monthly when you check market prices',
        'You need at least 1 account before any transaction — and at least 2 for transfers',
      ]},
    ],
  },

  {
    id:'categories', icon:FolderOpen, color:'violet', title:'Categories', subtitle:'Label every transaction',
    summary:'Categories organise your money flow into named groups. Required for every transaction — they power Analytics charts, Budget limits, and Tax file sections.',
    mockup:<CategoriesMockup/>,
    mockupCaption:'The Categories page — Income categories (green tag icon) and Expense categories (red tag icon) each in their own card with a grid of colour-coded category pills.',
    sections:[
      { heading:'Why Categories Are Required', type:'text', content:'Every transaction must belong to a category. Without categories, there are no charts, no budget tracking, and no tax file grouping. Good categories = meaningful analytics.' },
      { heading:'Income vs. Expense Categories', type:'list', items:[
        { icon:TrendingUp,   label:'Income Categories',  desc:'For money coming in: Salary, Bonus, Freelance, Rental, Business Revenue' },
        { icon:TrendingDown, label:'Expense Categories', desc:'For money going out: Food, Transport, Healthcare, Shopping, Utility Bills' },
      ]},
      { heading:'Load Defaults for Instant Setup', type:'callout', variant:'info', content:'Click "Load Defaults" to add: Income — Salary, Bonus, Loan. Expense — Transportation, Shopping, Foods, Healthcare, Loan Payment. These cover the most common flows and get you recording transactions within seconds.' },
      { heading:'Creating a Custom Category', type:'steps', items:[
        'Click "Add Category" and type the name (e.g., "Groceries" or "Freelance Income")',
        'Choose type: Income or Expense',
        'Pick a colour from 10 preset swatches — appears as a coloured dot in the transaction list and in chart slices',
        'Click "Add" — immediately available in all transaction forms',
      ]},
      { heading:'Renaming is Always Safe', type:'callout', variant:'success', content:'Each category has a permanent internal ID. Renaming "Foods" to "Groceries & Dining" never breaks historical transactions, analytics, or budget history.' },
      { heading:'Pro Tips', type:'tips', items:[
        'Create categories before recording transactions — they are required for every entry',
        'Keep names specific enough to be informative but broad enough to reuse daily',
        'Consistent colour themes make charts instantly readable',
        'Categories used in Budgets automatically show actual vs. budgeted spending',
      ]},
    ],
  },

  {
    id:'transactions', icon:Receipt, color:'emerald', title:'Transactions', subtitle:'Record every money movement',
    summary:'Transactions are the engine of Nisab Wallet. Every income or expense you record instantly updates account balances, analytics, budgets, and Zakat wealth.',
    mockup:<TransactionsMockup/>,
    mockupCaption:'The Transactions page — four summary cards at top, filter bar below, then date-grouped transaction list with colour-coded income (green) and expense (red) rows. Transfer rows show a blue ⇄ icon.',
    sections:[
      { heading:'Three Transaction Types', type:'list', items:[
        { icon:TrendingUp,     label:'Income',   desc:'Money from outside — salary, freelance, gift. Increases account balance.' },
        { icon:TrendingDown,   label:'Expense',  desc:'Money going out — food, transport, bills. Decreases account balance.' },
        { icon:ArrowRightLeft, label:'Transfer', desc:'Money between your own accounts. No net wealth change. Both balances update.' },
      ]},
      { heading:'The "Add Transaction" Modal — Three Tabs', type:'mockupTabs', mockups:[
        { tab:'income',   node:<TransactionModalMockup tab="income"/>,   caption:'Income tab (green): large amount field, account and category selectors, date, and optional note. Click Confirm Income to save.' },
        { tab:'expense',  node:<TransactionModalMockup tab="expense"/>,  caption:'Expense tab (red): identical layout. Blocked if amount exceeds Available balance (total minus goal allocations).' },
        { tab:'transfer', node:<TransactionModalMockup tab="transfer"/>, caption:'Transfer tab (blue): From and To account selectors with a visual arrow. Requires at least 2 accounts to be enabled.' },
      ]},
      { heading:'Recording a Transaction — Step by Step', type:'steps', items:[
        'Click "Add Transaction" — disabled until you have at least 1 account AND 1 category',
        'Choose the tab: Income (green), Expense (red), or Transfer (blue)',
        'Enter the amount in the large central field',
        'Select Account — shows each account with its Available balance',
        'Select Category — only shows categories matching the transaction type',
        'Set the Date — defaults to today, can be any past date',
        'Add an optional Note (e.g., "Rent – March 2026")',
        'Click Confirm — account balance updates immediately',
      ]},
      { heading:'Balance Protection (Goal-Aware)', type:'callout', variant:'warning', content:'When recording an Expense, the system checks Available balance (total minus goal allocations). If the expense would exceed available funds — even if the raw balance looks sufficient — the transaction is blocked with a detailed breakdown showing total, reserved, and available amounts.' },
      { heading:'Filters and Search', type:'list', items:[
        { icon:Filter, label:'Type Filter',   desc:'Show All, Income only, or Expense only' },
        { icon:Wallet, label:'Account Filter',desc:'View transactions for one specific account' },
        { icon:Clock,  label:'Period Filter', desc:'Today, This Week (Sat–Fri), Month, Year, All Time, or Custom Date Range' },
        { icon:Search, label:'Search',        desc:'Matches description, amount, category name, or account name — live as you type' },
      ]},
      { heading:'How Transfers Appear in the List', type:'callout', variant:'info', content:'Each transfer shows as TWO linked rows — an Expense on the source and an Income on the destination — both marked with a blue ⇄ icon. Editing or deleting one side updates both together.' },
      { heading:'Pro Tips', type:'tips', items:[
        'Record transactions the same day for accurate period summaries',
        'Use Notes for context: "Eid shopping – Bashundhara" is far more useful than just "Shopping"',
        'Summary cards exclude transfers — only real income/expense totals are shown',
        'The week resets on Saturday — standard Bangladesh work week',
      ]},
    ],
  },

  {
    id:'transfer', icon:ArrowRightLeft, color:'cyan', title:'Transfer', subtitle:'Move money between accounts',
    summary:'Transfer moves funds from one of your accounts to another without counting it as income or expense — keeping your total wealth accurate.',
    mockup:<TransferMockup/>,
    mockupCaption:'The Transfer page — form on the left with From/To selectors and a visual arrow between them, Recent Transfers history panel on the right.',
    sections:[
      { heading:'When to Use Transfer', type:'text', content:'Use Transfer any time you move money between your own accounts: bank withdrawal to top up bKash, salary to savings, or between two bank accounts. Recording this as Expense + Income would double-count and corrupt your analytics.' },
      { heading:'How to Transfer', type:'steps', items:[
        'Go to Transfer from the sidebar — or use the Transfer tab inside Add Transaction',
        'Select "From" account — dropdown shows its current balance',
        'Select "To" account — cannot be the same as From',
        'Enter the amount — checked against Available balance (after goal allocations)',
        'Set a date and optional note',
        'Click "Transfer Money" — both balances update instantly',
      ]},
      { heading:'What Happens Behind the Scenes', type:'flow', items:[
        { label:'From Account', desc:'Balance decreases by the transfer amount' },
        { label:'To Account', desc:'Balance increases by the transfer amount' },
        { label:'Transfer Record', desc:'Saved with both account names, amount, date, and note' },
        { label:'Transaction List', desc:'Appears as two linked rows (Expense + Income) marked with ⇄' },
        { label:'Analytics', desc:'Excluded from income/expense charts — total wealth unchanged' },
      ]},
      { heading:'Pro Tips', type:'tips', items:[
        'Always use Transfer (not Expense + Income) when moving between your own accounts',
        'Can be backdated using the date field',
        'Requires at least 2 accounts — add more in the Accounts section first',
        'Edit or delete a transfer from the Transaction list — both sides update together',
      ]},
    ],
  },

  {
    id:'budgets', icon:PiggyBank, color:'teal', title:'Budgets', subtitle:'Monthly spending limits',
    summary:'Set a maximum monthly spend per expense category. The system reads actual transactions in real time and shows colour-coded progress bars so you always know where you stand.',
    mockup:<BudgetsMockup/>,
    mockupCaption:'The Budgets page with four category cards — green (on track), amber (warning at 96%), red (over budget by ৳4,000), and green (well within limit). Each card shows a progress bar and remaining/over amount.',
    sections:[
      { heading:'How Budgets Work', type:'text', content:'Each calendar month you define a spending limit per expense category. The system reads your actual expense transactions and shows how much of each limit you have used with a colour-coded progress bar.' },
      { heading:'Setting Monthly Budgets', type:'steps', items:[
        'Go to Budgets — all Expense categories appear automatically',
        'Enter a limit in Taka next to each category to control',
        'Leave blank for no limit — actual spend still displays',
        'Click "Save All Budgets" — applies to the current calendar month immediately',
        'At month-end, set new limits for the next month (or copy from previous)',
      ]},
      { heading:'Reading the Colour Codes', type:'list', items:[
        { icon:CheckCircle2, label:'Green — On Track', desc:'Spent less than 80% of the limit' },
        { icon:AlertCircle,  label:'Amber — Warning',  desc:'Spent 80–99% of limit — consider slowing down' },
        { icon:AlertCircle,  label:'Red — Over Budget',desc:'Exceeded the limit' },
        { icon:Info,         label:'No Limit Set',     desc:'Category has transactions but no budget — shown for awareness' },
      ]},
      { heading:'Copy from Previous Month', type:'callout', variant:'info', content:'If you set budgets last month, a "Copy from Previous Month" option appears at the start of the new month — saving you from re-entering every limit.' },
      { heading:'Pro Tips', type:'tips', items:[
        'Budgets are awareness tools — they do not block transactions',
        'Click any budget card to open the transaction list filtered to that category',
        'Review Analytics → Category Pie Chart first to find which categories need limits',
      ]},
    ],
  },

  {
    id:'goals', icon:Target, color:'orange', title:'Financial Goals', subtitle:'Ring-fence money for a purpose',
    summary:'Goals reserve a portion of an account balance for a specific purpose. Reserved money is protected from accidental spending by the transaction system.',
    mockup:<GoalsMockup/>,
    mockupCaption:'The Goals page — three goal cards with coloured progress bars. The completed "New Laptop" goal shows a green checkmark and "Goal Achieved!" message. Each card has Deposit and Withdraw action buttons.',
    sections:[
      { heading:'What a Goal Does', type:'text', content:'A goal marks a slice of an account balance as "reserved". Account total does not change, but Available to Spend drops by the reserved amount. Expenses that would dip into goal money are automatically blocked.' },
      { heading:'Creating a Goal', type:'steps', items:[
        'Click "Add Goal", enter a name (e.g., "Emergency Fund")',
        'Set the Target Amount and Target Date',
        'Choose the Linked Account where reserved funds will sit',
        'Set Priority: Low, Medium, or High',
        'Toggle notifications for milestone alerts (25%, 50%, 75%, 100%)',
        'Save — the linked account card immediately shows updated Available balance',
      ]},
      { heading:'Depositing and Withdrawing', type:'list', items:[
        { icon:TrendingUp,   label:'Deposit',  desc:'Allocate more from the linked account — Available balance decreases' },
        { icon:TrendingDown, label:'Withdraw', desc:'Release funds back — Available balance increases' },
      ]},
      { heading:'Balance Protection in Practice', type:'callout', variant:'warning', content:'Bank Account has ৳50,000 total with ৳20,000 reserved for "New Laptop". Available = ৳30,000. A ৳35,000 expense from that account is blocked — even though the raw balance shows ৳50,000.' },
      { heading:'Pro Tips', type:'tips', items:[
        'Each card shows a monthly savings target — how much to deposit per month to reach the goal on time',
        'Multiple goals can share the same account — each reserves its own slice',
        'When a goal is complete, withdraw or delete it to release the Available balance',
      ]},
    ],
  },

  {
    id:'loans', icon:HandCoins, color:'rose', title:'Loans', subtitle:'Track money you borrowed',
    summary:'Track every loan — from banks, institutions, or individuals — with repayment schedules, interest calculations, and complete payment history.',
    mockup:<LoansMockup/>,
    mockupCaption:'The Loans page — summary stats at top (Total Borrowed, Outstanding, Repaid), then loan cards with type badges, repayment progress bars, and Pay buttons. Overdue loans show a red OVERDUE badge.',
    sections:[
      { heading:'Loan Types Supported', type:'list', items:[
        { icon:Shield,     label:'Qard Hasan (Interest-Free)', desc:'Islamic lending — zero interest, repay exactly what was borrowed. For family, friends, or Islamic banks.' },
        { icon:TrendingUp, label:'Conventional (With Interest)', desc:'Formal bank loans — enter rate and either monthly payment or total months. System auto-calculates the other.' },
      ]},
      { heading:'Adding a Loan', type:'steps', items:[
        'Click "Add Loan" and enter lender name (person or bank)',
        'Choose type: Qard Hasan or Conventional',
        'Enter the principal amount — for conventional, also enter interest rate and schedule',
        'Select which account receives the borrowed amount — that account balance increases immediately',
        'Enable reminders for payment due date alerts',
      ]},
      { heading:'Recording a Repayment', type:'steps', items:[
        'Click "Pay" on any active loan card',
        'Enter the repayment amount and choose the source account',
        'That account balance decreases — loan outstanding reduces',
        'When fully repaid, status changes to "Paid" automatically',
      ]},
      { heading:'Pro Tips', type:'tips', items:[
        'Enable reminders when creating a loan — in-app notification before payment is due',
        'Filter by Active, Paid, or Overdue using the status tabs',
        'Loan amounts credited to accounts count toward Zakat wealth calculation',
      ]},
    ],
  },

  {
    id:'lendings', icon:Blend, color:'amber', title:'Lend', subtitle:'Track money others owe you',
    summary:'Lend tracks money you have given to others — monitoring borrower details, repayment status, and full payment history.',
    sections:[
      { heading:'Loans vs. Lend — Key Difference', type:'callout', variant:'info', content:'Loans = money you borrowed (you owe someone). Lend = money you gave out (someone owes you). Completely separate modules with opposite effects on account balances.' },
      { heading:'Adding a Lending Record', type:'steps', items:[
        'Click "Add Lending" — enter borrower name, phone, email, and address',
        'Enter amount lent, lending date, and due date for repayment',
        'Choose repayment type: Full Payment or Installments',
        'Select which account the money leaves from — balance decreases immediately',
        'Add notes for collateral or agreed conditions',
      ]},
      { heading:'Recording a Repayment', type:'steps', items:[
        'Click "Repayment" on the lending record',
        'Enter the amount received and choose destination account',
        'Outstanding balance decreases — when zero, status becomes "Settled"',
      ]},
      { heading:'Pro Tips', type:'tips', items:[
        'Always record borrower contact details — essential for follow-up',
        'Use Reminders to schedule a notification near the due date',
        'Overdue lendings are highlighted in red automatically',
      ]},
    ],
  },

  {
    id:'investments', icon:Sprout, color:'green', title:'Investments', subtitle:'Track portfolio returns',
    summary:'Track all long-term assets — stocks, FDR, DPS, savings certificates, real estate, crypto — with automatic return calculations and portfolio analytics.',
    sections:[
      { heading:'Supported Investment Types', type:'list', items:[
        { icon:TrendingUp, label:'Stocks & Mutual Funds',           desc:'Purchase price vs. current NAV/market price for capital gain/loss' },
        { icon:Coins,      label:'DPS & FDR',                       desc:'Deposit schemes — enter maturity value for automatic return calculation' },
        { icon:FileText,   label:'Savings Certificate (Sanchayapatra)', desc:'Government-backed bonds with face value and maturity date' },
        { icon:Zap,        label:'Cryptocurrency',                  desc:'Digital assets — track purchase price vs. current market value' },
        { icon:Building2,  label:'Real Estate',                     desc:'Property — track purchase price and current estimated value' },
      ]},
      { heading:'Adding an Investment', type:'steps', items:[
        'Click "Add Investment" and select the type',
        'Enter name, amount invested, and purchase/start date',
        'Enter current value or expected return — system calculates gain/loss and percentage',
        'Set maturity date if applicable (FDR, DPS, Bonds)',
        'Save — appears in portfolio summary immediately',
      ]},
      { heading:'Portfolio Summary Cards', type:'list', items:[
        { icon:TrendingUp, label:'Total Invested',  desc:'Sum of all capital deployed' },
        { icon:Coins,      label:'Current Value',   desc:'Total current market/maturity value' },
        { icon:TrendingUp, label:'Total Return',    desc:'Overall gain/loss in Taka and percentage' },
        { icon:BarChart3,  label:'Allocation Chart',desc:'Portfolio breakdown by investment type' },
      ]},
      { heading:'Pro Tips', type:'tips', items:[
        'Update Stocks and Crypto values regularly — prices change daily',
        'Investment values do NOT auto-feed account balances — record a transaction when you withdraw returns',
        'Investment values are not included in Zakat wealth automatically — only account balances count',
      ]},
    ],
  },

  {
    id:'zakat', icon:Star, color:'indigo', title:'Zakat', subtitle:'Automated Islamic obligation tracking',
    summary:'Fully automates the Hawl cycle — detecting when wealth crosses Nisab, tracking the full Hijri lunar year, calculating 2.5%, and storing complete payment history.',
    mockup:<ZakatMockup/>,
    mockupCaption:'The three Zakat status states: dark card (Not Mandatory — below Nisab), blue card (Monitoring Active — shows days remaining in Hawl cycle), red card (Zakat Due — shows 2.5% amount and Record Payment button).',
    sections:[
      { heading:'Key Islamic Concepts', type:'list', items:[
        { icon:Coins, label:'Nisab',      desc:'Minimum wealth threshold — 52.5 Tola (612.36g) of silver. Must stay at or above this for one full Hijri year.' },
        { icon:Moon,  label:'Hawl',       desc:'One complete Hijri lunar year (~354 days) of continuous ownership above Nisab. Must complete before Zakat is obligatory.' },
        { icon:Star,  label:'Zakat Rate', desc:'2.5% of total eligible wealth, paid once per completed Hawl.' },
      ]},
      { heading:'Step 1 — Set Your Nisab Threshold', type:'steps', items:[
        'Click "Settings" on the Zakat page',
        'Choose price unit: per Gram or per Vori/Tola',
        'Enter the current market price of silver in Taka',
        'Nisab is auto-calculated: price × 612.36g (or × 52.5 Vori)',
        'Save — update this whenever you check silver prices',
      ]},
      { heading:'The Automatic Hawl Cycle', type:'flow', items:[
        { label:'Nisab Crossed → Cycle Starts', desc:'System detects Total Wealth ≥ Nisab. Cycle start date recorded in both Hijri and Gregorian calendars automatically.' },
        { label:'Monitoring Period (354 days)', desc:'Wealth can fluctuate freely — no Zakat is triggered mid-cycle regardless of temporary dips below Nisab.' },
        { label:'Hawl Assessment at Year End', desc:'After exactly one Hijri year: if wealth ≥ Nisab → Zakat Due (2.5% calculated). If below Nisab → cycle ends, no obligation.' },
        { label:'Payment and Auto-Renewal', desc:'Record payment (full or instalments). If wealth still above Nisab after full payment, a new cycle begins immediately.' },
      ]},
      { heading:'The Three Status Cards Explained', type:'callout', variant:'info', content:'Dark card = Not Mandatory (below Nisab). Blue card = Monitoring Active (shows days remaining and Hijri cycle start date). Red card = Zakat Due (shows 2.5% calculated amount and Record Payment button). Status updates automatically as wealth and time change.' },
      { heading:'Recording Payment', type:'steps', items:[
        'When status shows "Zakat Due", click "Record Payment"',
        'Enter how much you paid and the payment date',
        'Partial payments are supported — each reduces the outstanding Zakat amount',
        'When fully paid, the cycle closes — a new one begins if wealth is still above Nisab',
        'All cycles and payments stored permanently in Cycle History',
      ]},
      { heading:'Pro Tips', type:'tips', items:[
        'Update silver price monthly for an accurate Nisab figure',
        'Total Zakat wealth = ALL account balances (Cash + Bank + bKash + Gold + Silver)',
        'Consult a scholar about which assets are zakatable in your specific situation',
        'Hijri calendar used internally — Gregorian equivalents always displayed alongside',
      ]},
    ],
  },

  {
    id:'analytics', icon:BarChart3, color:'blue', title:'Analytics', subtitle:'Visual financial insights',
    summary:'Transforms raw transactions into charts — income vs. expense comparisons, category breakdowns, and net saving trends over any time period.',
    mockup:<AnalyticsMockup/>,
    mockupCaption:'The Analytics page — time range tabs (Year selected), three summary cards (Income/Expense/Net), Income vs Expense bar chart for 6 months with green/red bars, and a Category expense donut chart with legend.',
    sections:[
      { heading:'Time Range Options', type:'list', items:[
        { icon:Clock,      label:'Week',         desc:'Current week (Sat–Fri) — daily bar chart per day' },
        { icon:Calendar,   label:'Month',        desc:'Current calendar month — income vs. expense pattern' },
        { icon:TrendingUp, label:'Year',         desc:'12 months of the current year compared side by side' },
        { icon:Filter,     label:'Custom Range', desc:'Any start/end date — compare Ramadan vs. regular months etc.' },
      ]},
      { heading:'Charts Available', type:'list', items:[
        { icon:BarChart3,  label:'Income vs. Expense Bar Chart', desc:'Side-by-side green/red bars per period — instantly shows which months you saved vs. overspent' },
        { icon:TrendingUp, label:'Net Savings Line',             desc:'Income minus expenses over time — upward = saving, downward = deficit' },
        { icon:Target,     label:'Category Expense Pie',         desc:'Percentage of total spending per expense category — find your biggest cost drivers' },
      ]},
      { heading:'How to Use Analytics Effectively', type:'steps', items:[
        'Start with Yearly view — understand your overall saving or deficit pattern',
        'Zoom into any month where you overspent — find which week caused it',
        'Open the Category Pie Chart — identify your largest expense category',
        'Use insights from Analytics to set realistic Budget limits in the Budgets section',
      ]},
      { heading:'Transfers Are Always Excluded', type:'callout', variant:'info', content:'Transfers between your own accounts never appear in Analytics income or expense figures. Only real income (from outside) and real expenses (permanently leaving your control) are charted — keeping figures accurate.' },
      { heading:'Pro Tips', type:'tips', items:[
        'Analytics quality depends on consistent transaction recording — record every expense',
        'More specific categories produce more actionable pie charts',
        'Share the Yearly summary with yourself at year-end as a personal financial review',
      ]},
    ],
  },

  {
    id:'recurring', icon:Repeat, color:'cyan', title:'Recurring Transactions', subtitle:'Automate fixed payments',
    summary:'Recurring Transactions auto-generates any fixed, repeating payment — salary, rent, subscriptions, utility bills — so you never forget to record them manually.',
    mockup:<RecurringMockup/>,
    mockupCaption:'The Recurring page — status filter tabs, then four entries: Monthly Rent (auto), Salary (auto), Electricity Bill (manual approval mode), Netflix (paused). Each shows next execution date and pause/edit/delete buttons.',
    sections:[
      { heading:'Frequency Options', type:'list', items:[
        { icon:Calendar, label:'Daily',   desc:'Every day — daily transport allowance, daily savings deposit' },
        { icon:Calendar, label:'Weekly',  desc:'Chosen day each week — weekly pocket money' },
        { icon:Calendar, label:'Monthly', desc:'Chosen date each month — rent, salary, EMI payments' },
        { icon:Calendar, label:'Yearly',  desc:'Annual — insurance premiums, memberships, renewals' },
      ]},
      { heading:'Creating a Recurring Transaction', type:'steps', items:[
        'Click "Add Recurring" and give it a clear name (e.g., "Monthly House Rent")',
        'Choose type: Income or Expense, enter amount, account, category',
        'Set frequency and specific day/date',
        'Set start date — first execution date is shown immediately',
        'Optionally set an end date (e.g., EMI ending in 18 months)',
        'Choose: Auto (fires silently) or Manual Approval (you confirm each time)',
        'Save — active from the next due date',
      ]},
      { heading:'Auto vs. Manual Approval', type:'callout', variant:'info', content:'Auto mode executes silently on due date — ideal for truly fixed amounts like rent. Manual Approval creates a Pending entry you must approve or skip — ideal for utility bills that vary month to month.' },
      { heading:'Managing Entries', type:'list', items:[
        { icon:Clock,     label:'Pause',  desc:'Suspend without deleting — preserves the rule, resumes from next due date when reactivated' },
        { icon:RefreshCw, label:'Resume', desc:'Reactivate — next due date recalculates from today forward' },
        { icon:Edit2,     label:'Edit',   desc:'Change amount, account, category, or schedule any time' },
        { icon:Trash2,    label:'Delete', desc:'Remove the rule permanently — past transactions it created remain in history' },
      ]},
      { heading:'Pro Tips', type:'tips', items:[
        'Open the Recurring page at least weekly — it processes overdue entries on page load',
        'Pending approval count shows as a badge on the Recurring menu item',
        'Set an end date for EMI recurrings so they stop automatically — no manual deletion needed',
      ]},
    ],
  },

  {
    id:'shopping', icon:ShoppingBag, color:'pink', title:'Shopping List', subtitle:'Plan before you spend',
    summary:'Create smart shopping lists with item prices before going to the market. Track purchases in real time and compare estimated vs. actual costs.',
    sections:[
      { heading:'How Shopping Lists Work', type:'text', content:'Create a Cart (e.g., "Weekly Groceries"), add items with quantities and estimated prices, then tick them off as you shop. Shows estimated total vs. purchased total live — a budget tracker in your pocket at the market.' },
      { heading:'Creating and Using a Cart', type:'steps', items:[
        'Click "New List", give it a name and optional description',
        'Open the cart and add items with name, quantity, and estimated price',
        'The cart shows a running estimated total',
        'At the market, tick items off as you buy them — purchased subtotal updates live',
        'After shopping, use the final total to record an Expense transaction',
      ]},
      { heading:'Pro Tips', type:'tips', items:[
        'Create separate carts for different trip types — weekly groceries, Eid shopping, household supplies',
        'Add estimated prices before leaving home to check if the total fits your budget',
        'Compare estimated vs. actual receipt total to improve future budgeting accuracy',
      ]},
    ],
  },

  {
    id:'tax', icon:FileText, color:'slate', title:'Tax File', subtitle:'Organise income for annual returns',
    summary:'Organises your income transactions by fiscal year and maps them to official tax heads — a structured summary ready for your annual income tax return.',
    sections:[
      { heading:'Step 1 — Map Categories to Tax Heads', type:'steps', items:[
        'Go to Tax → "Setup Categories" or "Category Mapping"',
        'Your Income categories appear — map each to an official tax head',
        'Example: "Salary" → Salaries; "Freelance" → Business Income; "Rental" → House Property',
        'Save — mappings apply to all future tax year calculations',
      ]},
      { heading:'Step 2 — Create a Tax Year', type:'steps', items:[
        'Click "Create Tax Year" — current fiscal year (July–June) is pre-selected',
        'System pulls all income transactions for mapped categories',
        'Income grouped by tax head with totals',
        'Countdown shows days until November 30 filing deadline',
      ]},
      { heading:'Tax Year Status', type:'list', items:[
        { icon:Clock,        label:'In Progress', desc:'Current fiscal year — income accumulating until June 30' },
        { icon:AlertCircle,  label:'Due Soon',    desc:'Less than 30 days to November 30 filing deadline' },
        { icon:CheckCircle2, label:'Filed',       desc:'Marked as submitted — permanent historical record' },
      ]},
      { heading:'Pro Tips', type:'tips', items:[
        'Set up category mappings at the start of July — system tracks automatically from that point',
        'Only Income-type transactions feed Tax File — Expenses are excluded',
        'Bangladesh fiscal year is July 1 to June 30 — used automatically',
        'Unmapped income categories will not appear in Tax File totals — check mappings if figures look incomplete',
      ]},
    ],
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserGuidePage() {
  const [activeId, setActiveId] = useState('accounts');
  const [search, setSearch]     = useState('');

  const activeGuide = GUIDES.find(g => g.id === activeId);
  const c = C[activeGuide?.color] || C.blue;

  const filtered = search.trim()
    ? GUIDES.filter(g =>
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        g.summary.toLowerCase().includes(search.toLowerCase())
      )
    : GUIDES;

  const selectGuide = (id) => { setActiveId(id); setSearch(''); };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen size={17} className="text-white"/>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">User Guide</h1>
            <p className="text-sm text-gray-500">Step-by-step workflows with live UI previews for every feature</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar navigation */}
        <aside className="lg:w-60 flex-shrink-0">
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="Search guides…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"/>
          </div>

          <nav className="space-y-0.5">
            {filtered.map(guide => {
              const Icon = guide.icon;
              const gc = C[guide.color] || C.blue;
              const isActive = activeId === guide.id && !search;
              return (
                <button key={guide.id} onClick={() => selectGuide(guide.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? `${gc.active} shadow-sm` : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/25' : gc.icon}`}>
                    <Icon size={14}/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold truncate ${isActive ? '' : 'text-gray-900'}`}>{guide.title}</div>
                    <div className={`text-[10px] truncate leading-tight ${isActive ? 'opacity-75' : 'text-gray-400'}`}>{guide.subtitle}</div>
                  </div>
                  {guide.mockup && (
                    <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/60' : 'bg-emerald-400'}`} title="UI preview available"/>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No guides match</p>}
          </nav>

          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
              <span className="text-[10px] font-semibold text-gray-600">UI Preview Available</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-relaxed">Guides with a green dot include a live mockup of the real page built from the actual source code.</p>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0">
          {search.trim() ? (
            /* Search results */
            <div className="space-y-2.5">
              <p className="text-xs text-gray-400 mb-3">{filtered.length} guide{filtered.length !== 1 ? 's' : ''} found</p>
              {filtered.map(guide => {
                const Icon = guide.icon;
                const gc = C[guide.color] || C.blue;
                return (
                  <button key={guide.id} onClick={() => selectGuide(guide.id)}
                    className={`w-full text-left p-4 rounded-xl border ${gc.border} ${gc.bg} hover:shadow-sm transition-all flex items-start gap-3`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${gc.icon}`}><Icon size={18}/></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{guide.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{guide.subtitle}</div>
                      <div className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">{guide.summary}</div>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 flex-shrink-0 mt-1"/>
                  </button>
                );
              })}
            </div>
          ) : activeGuide ? (
            /* Guide detail */
            <div>
              {/* Guide header card */}
              <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-5 mb-4`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
                    <activeGuide.icon size={22}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Feature Guide</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-0.5">{activeGuide.title}</h2>
                    <p className="text-sm text-gray-500 mb-2">{activeGuide.subtitle}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{activeGuide.summary}</p>
                  </div>
                </div>
              </div>

              {/* Top-level mockup (page preview) */}
              {activeGuide.mockup && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Page Preview</span>
                    <div className="flex-1 h-px bg-gray-100"/>
                  </div>
                  {activeGuide.mockup}
                  {activeGuide.mockupCaption && (
                    <p className="text-[11px] text-gray-400 mt-2 text-center italic leading-relaxed px-4">{activeGuide.mockupCaption}</p>
                  )}
                </div>
              )}

              {/* Section accordion */}
              <div className="space-y-2">
                {activeGuide.sections.map((section, i) => (
                  <GuideSection key={i} section={section}/>
                ))}
              </div>

              {/* Prev / Next navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                {(() => {
                  const idx = GUIDES.findIndex(g => g.id === activeId);
                  const prev = GUIDES[idx - 1];
                  const next = GUIDES[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button onClick={() => selectGuide(prev.id)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                          <ChevronRight size={14} className="rotate-180"/><span>{prev.title}</span>
                        </button>
                      ) : <div/>}
                      {next ? (
                        <button onClick={() => selectGuide(next.id)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                          <span>{next.title}</span><ChevronRight size={14}/>
                        </button>
                      ) : <div/>}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}