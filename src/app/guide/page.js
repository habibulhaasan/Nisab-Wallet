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
  Blend, Plus, ArrowUpCircle, ArrowDownCircle, Settings,
  History, Calculator, Tag, Download, Sparkles, Bell,
  Gem, Scale, Gift, Heart, AlertTriangle, Package, DollarSign,
  ArrowUpRight, RotateCcw, User, Eye,
} from 'lucide-react';

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  blue:    { bg:'bg-blue-50',    border:'border-blue-200',    icon:'bg-blue-100 text-blue-700',     active:'bg-blue-700 text-white'    },
  violet:  { bg:'bg-violet-50',  border:'border-violet-200',  icon:'bg-violet-100 text-violet-700', active:'bg-violet-700 text-white'  },
  emerald: { bg:'bg-emerald-50', border:'border-emerald-200', icon:'bg-emerald-100 text-emerald-700',active:'bg-emerald-700 text-white'},
  cyan:    { bg:'bg-cyan-50',    border:'border-cyan-200',    icon:'bg-cyan-100 text-cyan-700',     active:'bg-cyan-700 text-white'    },
  teal:    { bg:'bg-teal-50',    border:'border-teal-200',    icon:'bg-teal-100 text-teal-700',     active:'bg-teal-700 text-white'    },
  orange:  { bg:'bg-orange-50',  border:'border-orange-200',  icon:'bg-orange-100 text-orange-700', active:'bg-orange-600 text-white'  },
  rose:    { bg:'bg-rose-50',    border:'border-rose-200',    icon:'bg-rose-100 text-rose-700',     active:'bg-rose-700 text-white'    },
  amber:   { bg:'bg-amber-50',   border:'border-amber-200',   icon:'bg-amber-100 text-amber-700',   active:'bg-amber-600 text-white'   },
  green:   { bg:'bg-green-50',   border:'border-green-200',   icon:'bg-green-100 text-green-700',   active:'bg-green-700 text-white'   },
  indigo:  { bg:'bg-indigo-50',  border:'border-indigo-200',  icon:'bg-indigo-100 text-indigo-700', active:'bg-indigo-700 text-white'  },
  pink:    { bg:'bg-pink-50',    border:'border-pink-200',    icon:'bg-pink-100 text-pink-700',     active:'bg-pink-700 text-white'    },
  slate:   { bg:'bg-slate-50',   border:'border-slate-200',   icon:'bg-slate-100 text-slate-700',   active:'bg-slate-700 text-white'   },
  yellow:  { bg:'bg-yellow-50',  border:'border-yellow-200',  icon:'bg-yellow-100 text-yellow-700', active:'bg-yellow-600 text-white'  },
  red:     { bg:'bg-red-50',     border:'border-red-200',     icon:'bg-red-100 text-red-700',       active:'bg-red-700 text-white'     },
};

// ─── Browser chrome wrapper ───────────────────────────────────────────────────
function MockupFrame({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gray-100 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/>
        </div>
        <span className="text-[10px] text-gray-500 font-medium mx-auto pr-8 truncate">{title}</span>
      </div>
      <div className="p-3 bg-gray-50">{children}</div>
    </div>
  );
}

// ── Accounts ──────────────────────────────────────────────────────────────────
function AccountsMockup() {
  return (
    <MockupFrame title="Accounts — /dashboard/accounts">
      <div className="flex items-center justify-between mb-3">
        <div><div className="text-sm font-semibold text-gray-900">Accounts</div><div className="text-[10px] text-gray-500">Manage your financial accounts</div></div>
        <div className="flex gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-medium"><Download size={10}/> Load Defaults</div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium"><Plus size={10}/> Add Account</div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-3 text-white mb-3">
        <div className="text-[10px] text-gray-300 mb-0.5">Total Balance</div>
        <div className="text-xl font-bold">৳1,25,000</div>
        <div className="text-[10px] text-gray-300 mt-0.5">Across 4 accounts</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { name:'Cash', type:'Cash', bal:'25,000', Icon:Wallet, goal:false },
          { name:'DBBL Savings', type:'Bank', bal:'80,000', Icon:Building2, goal:false },
          { name:'bKash', type:'Mobile Banking', bal:'5,000', Icon:Smartphone, goal:true },
          { name:'Gold', type:'Gold', bal:'15,000', Icon:Coins, goal:false },
        ].map((acc,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><acc.Icon size={13} className="text-gray-700"/></div>
              <div className="flex-1 min-w-0"><div className="text-[11px] font-semibold text-gray-900 truncate">{acc.name}</div><div className="text-[9px] text-gray-500">{acc.type}</div></div>
              <div className="flex gap-0.5"><Edit2 size={9} className="text-gray-400"/><Trash2 size={9} className="text-gray-400"/></div>
            </div>
            <div className="text-base font-bold text-gray-900">৳{acc.bal}</div>
            {acc.goal && <div className="mt-1.5 pt-1.5 border-t border-gray-100">
              <div className="flex justify-between text-[9px] mb-0.5"><span className="text-green-600 font-medium">Available</span><span className="font-bold">৳2,000</span></div>
              <div className="flex justify-between text-[9px]"><span className="text-orange-500 font-medium">Goal Reserved</span><span className="font-bold">৳3,000</span></div>
            </div>}
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

// ── Categories ────────────────────────────────────────────────────────────────
function CategoriesMockup() {
  const inc=[{name:'Salary',color:'#10B981'},{name:'Bonus',color:'#3B82F6'},{name:'Freelance',color:'#8B5CF6'}];
  const exp=[{name:'Foods',color:'#EC4899'},{name:'Transport',color:'#EF4444'},{name:'Shopping',color:'#8B5CF6'},{name:'Healthcare',color:'#06B6D4'}];
  return (
    <MockupFrame title="Categories — /dashboard/categories">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-semibold text-gray-900">Categories</div>
        <div className="flex gap-1.5">
          <div className="px-2 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Download size={9}/>Defaults</div>
          <div className="px-2 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>Add</div>
        </div>
      </div>
      {[{label:'Income',cats:inc,color:'text-green-600'},{label:'Expense',cats:exp,color:'text-red-600'}].map((sec,si)=>(
        <div key={si} className="bg-white rounded-lg border border-gray-200 p-2.5 mb-2">
          <div className={`flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-gray-900`}><Tag size={11} className={sec.color}/>{sec.label} Categories ({sec.cats.length})</div>
          <div className={`grid gap-1.5 ${sec.cats.length<=3?'grid-cols-3':'grid-cols-2'}`}>
            {sec.cats.map((cat,i)=>(
              <div key={i} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{backgroundColor:cat.color+'20'}}><div className="w-2 h-2 rounded-full" style={{backgroundColor:cat.color}}/></div>
                  <span className="text-[10px] font-medium text-gray-900">{cat.name}</span>
                </div>
                <div className="flex gap-0.5"><Edit2 size={9} className="text-gray-400"/><Trash2 size={9} className="text-gray-400"/></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </MockupFrame>
  );
}

// ── Transactions list ─────────────────────────────────────────────────────────
function TransactionsMockup() {
  return (
    <MockupFrame title="Transactions — /dashboard/transactions">
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[{l:'Total Balance',v:'৳1,25,000',c:'text-gray-900',I:Wallet},{l:'Income',v:'+৳45,000',c:'text-green-600',I:ArrowUpCircle},{l:'Expense',v:'-৳18,500',c:'text-red-600',I:ArrowDownCircle},{l:'Net',v:'+৳26,500',c:'text-green-600',I:TrendingUp}].map((s,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="flex items-center gap-1 mb-1"><div className="text-[9px] font-medium text-gray-500 uppercase">{s.l}</div><s.I size={9} className={s.c}/></div>
            <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {['All','Income','Expense'].map((f,i)=><div key={i} className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${i===0?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-600 border-gray-200'}`}>{f}</div>)}
        <div className="px-2 py-1 rounded-lg text-[10px] border border-gray-200 bg-white text-gray-600">This Month ▾</div>
        <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-gray-200 bg-white text-gray-400"><Search size={8}/>Search...</div>
      </div>
      <div className="bg-gray-100 rounded px-2 py-1.5 flex justify-between items-center mb-1.5 border border-gray-200">
        <span className="text-[10px] font-semibold text-gray-700">Today, 10 Mar 2026</span>
        <div className="flex gap-2 text-[9px]"><span className="text-green-600 font-medium">+৳45,000</span><span className="text-red-600 font-medium">-৳1,200</span></div>
      </div>
      {[
        {cat:'Salary',acc:'DBBL Savings',amt:'+৳45,000',bg:'bg-green-50',dot:'#10B981',I:ArrowUpCircle,ic:'text-green-600',ac:'text-green-600',isT:false},
        {cat:'Foods',acc:'Cash',amt:'-৳1,200',bg:'bg-red-50',dot:'#EC4899',I:ArrowDownCircle,ic:'text-red-600',ac:'text-red-600',isT:false},
        {cat:'bKash → Cash',acc:'Transfer',amt:'৳3,000',bg:'bg-blue-50',dot:'#3B82F6',I:ArrowRightLeft,ic:'text-blue-500',ac:'text-blue-600',isT:true},
      ].map((tx,i)=>(
        <div key={i} className={`flex items-center gap-2 px-2 py-2 rounded-lg ${tx.bg} mb-1`}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm flex-shrink-0"><tx.I size={12} className={tx.ic}/></div>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor:tx.dot}}/>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-gray-900 flex items-center gap-1">{tx.cat}{tx.isT&&<ArrowRightLeft size={9} className="text-blue-400"/>}</div>
            <div className="text-[9px] text-gray-500">{tx.acc}</div>
          </div>
          <div className={`text-xs font-bold ${tx.ac}`}>{tx.amt}</div>
          <div className="flex gap-0.5"><Edit2 size={9} className="text-gray-300"/><Trash2 size={9} className="text-gray-300"/></div>
        </div>
      ))}
    </MockupFrame>
  );
}

// ── Transaction modal ─────────────────────────────────────────────────────────
function TransactionModalMockup({ tab='expense' }) {
  const cfg={income:{bg:'bg-green-50',border:'border-green-100',text:'text-green-600',btn:'bg-green-600',tabBg:'bg-green-600 text-white'},expense:{bg:'bg-red-50',border:'border-red-100',text:'text-red-600',btn:'bg-red-600',tabBg:'bg-red-600 text-white'},transfer:{bg:'bg-blue-50',border:'border-blue-100',text:'text-blue-600',btn:'bg-blue-600',tabBg:'bg-blue-600 text-white'}};
  const c=cfg[tab]; const isT=tab==='transfer';
  return (
    <MockupFrame title={`Add Transaction — ${tab} tab`}>
      <div className="bg-white rounded-xl border border-gray-200 max-w-xs mx-auto p-3">
        <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-lg p-0.5 mb-3">
          {['income','expense','transfer'].map(t=>(
            <button key={t} className={`py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center justify-center gap-0.5 ${tab===t?c.tabBg:'text-gray-500'}`}>
              {t==='income'&&<TrendingUp size={9}/>}{t==='expense'&&<TrendingDown size={9}/>}{t==='transfer'&&<ArrowRightLeft size={9}/>}{t}
            </button>
          ))}
        </div>
        {isT?(
          <>
            <div className={`text-[10px] font-bold uppercase ${c.text} mb-1`}>Amount (৳)</div>
            <div className={`w-full rounded-lg p-2.5 text-xl font-bold text-center ${c.bg} ${c.text} border-2 ${c.border} mb-3`}>3,000</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>From</div><div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] font-bold ${c.text}`}>bKash (৳5,000)</div></div>
              <div><div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>To</div><div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] font-bold ${c.text}`}>Cash (৳25k)</div></div>
            </div>
            <div className="mb-3"><div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>Date</div><div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] ${c.text}`}>10 Mar 2026</div></div>
          </>
        ):(
          <>
            <div className={`text-[10px] font-bold uppercase ${c.text} mb-1`}>Amount (৳)</div>
            <div className={`w-full rounded-lg p-2.5 text-xl font-bold text-center ${c.bg} ${c.text} border-2 ${c.border} mb-3`}>{tab==='income'?'45,000':'1,200'}</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>Account</div><div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] font-bold ${c.text}`}>{tab==='income'?'DBBL Savings':'Cash (Avail: ৳22k)'}</div></div>
              <div><div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>Category</div><div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] font-bold ${c.text}`}>{tab==='income'?'Salary':'Foods'}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div><div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>Date</div><div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] ${c.text}`}>10 Mar 2026</div></div>
              <div><div className={`text-[9px] font-bold uppercase ${c.text} mb-1`}>Note</div><div className={`${c.bg} border ${c.border} rounded-lg p-2 text-[10px] text-gray-400`}>Optional...</div></div>
            </div>
          </>
        )}
        <button className={`w-full py-2.5 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider ${c.btn} flex items-center justify-center gap-1.5`}>
          {isT?<ArrowRightLeft size={11}/>:tab==='income'?<TrendingUp size={11}/>:<TrendingDown size={11}/>}Confirm {isT?'Transfer':tab==='income'?'Income':'Expense'}
        </button>
      </div>
    </MockupFrame>
  );
}

// ── Transfer ──────────────────────────────────────────────────────────────────
function TransferMockup() {
  return (
    <MockupFrame title="Transfer — /dashboard/transfer">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-[11px] font-semibold text-gray-900 mb-3">New Transfer</div>
          {[{l:'From Account',v:'bKash (৳5,000)'},{l:'To Account',v:'Cash (৳25,000)'},{l:'Amount (৳)',v:'3,000',note:'Available: ৳5,000'},{l:'Date',v:'10 Mar 2026'}].map((f,i)=>(
            <div key={i} className="mb-2">
              <div className="text-[9px] font-medium text-gray-600 mb-1">{f.l}</div>
              {i===1&&<div className="flex justify-center mb-2"><div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"><ArrowRightLeft size={12} className="text-gray-600"/></div></div>}
              <div className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-700">{f.v}</div>
              {f.note&&<div className="text-[8px] text-gray-400 mt-0.5">{f.note}</div>}
            </div>
          ))}
          <button className="w-full py-2 bg-gray-900 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 mt-1"><ArrowRightLeft size={10}/>Transfer Money</button>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-3"><div className="text-[11px] font-semibold text-gray-900">Recent Transfers</div><Clock size={11} className="text-gray-400"/></div>
          <div className="space-y-2">
            {[{from:'bKash',to:'Cash',amt:'৳3,000',date:'10 Mar'},{from:'DBBL',to:'bKash',amt:'৳10,000',date:'5 Mar'},{from:'Cash',to:'DBBL',amt:'৳5,000',date:'28 Feb'}].map((t,i)=>(
              <div key={i} className="border border-gray-100 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5"><div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center"><ArrowRightLeft size={10} className="text-blue-600"/></div><div className="flex items-center gap-1 text-[10px] font-medium text-gray-900">{t.from}<ChevronRight size={8} className="text-gray-400"/>{t.to}</div></div>
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

// ── Budgets ───────────────────────────────────────────────────────────────────
function BudgetsMockup() {
  const budgets=[{cat:'Foods',color:'#EC4899',spent:8500,limit:10000},{cat:'Transport',color:'#EF4444',spent:4800,limit:5000},{cat:'Shopping',color:'#8B5CF6',spent:12000,limit:8000},{cat:'Healthcare',color:'#06B6D4',spent:2000,limit:6000}];
  return (
    <MockupFrame title="Budgets — /dashboard/budgets">
      <div className="flex justify-between items-center mb-3">
        <div><div className="text-sm font-semibold text-gray-900">Monthly Budgets</div><div className="text-[10px] text-gray-500">March 2026</div></div>
        <div className="px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><CheckCircle2 size={9}/>Save All</div>
      </div>
      <div className="space-y-2">
        {budgets.map((b,i)=>{const pct=Math.min(100,(b.spent/b.limit)*100);const over=b.spent>b.limit;const warn=pct>=80&&!over;const barC=over?'#EF4444':warn?'#F59E0B':'#10B981';return(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:b.color}}/><span className="text-[11px] font-semibold text-gray-900">{b.cat}</span>{over&&<span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-bold">OVER</span>}{warn&&<span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[8px] font-bold">WARNING</span>}</div>
              <div><span className={`text-[11px] font-bold ${over?'text-red-600':'text-gray-900'}`}>৳{b.spent.toLocaleString()}</span><span className="text-[9px] text-gray-400"> / ৳{b.limit.toLocaleString()}</span></div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${Math.min(100,pct)}%`,backgroundColor:barC}}/></div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-gray-400">{pct.toFixed(0)}% used</span>
              {over?<span className="text-[8px] text-red-500 font-medium">৳{(b.spent-b.limit).toLocaleString()} over</span>:<span className="text-[8px] text-gray-400">৳{(b.limit-b.spent).toLocaleString()} left</span>}
            </div>
          </div>
        );})}
      </div>
    </MockupFrame>
  );
}

// ── Goals ─────────────────────────────────────────────────────────────────────
function GoalsMockup() {
  return (
    <MockupFrame title="Goals — /dashboard/goals">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-semibold text-gray-900">Financial Goals</div>
        <div className="px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>Add Goal</div>
      </div>
      <div className="space-y-2">
        {[{name:'Emergency Fund',target:100000,current:65000,date:'Dec 2026',color:'#EF4444',done:false},{name:'New Laptop',target:80000,current:80000,date:'Mar 2026',color:'#3B82F6',done:true},{name:'Eid Shopping',target:20000,current:8000,date:'Apr 2026',color:'#10B981',done:false}].map((g,i)=>{
          const pct=Math.min(100,(g.current/g.target)*100);
          return(<div key={i} className={`bg-white rounded-lg border p-2.5 ${g.done?'border-emerald-200 bg-emerald-50/30':'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-1.5">
              <div><div className="flex items-center gap-1.5"><span className="text-[11px] font-bold text-gray-900">{g.name}</span>{g.done&&<CheckCircle2 size={11} className="text-emerald-500"/>}</div><div className="text-[9px] text-gray-500 mt-0.5">Target: {g.date}</div></div>
              <div className="text-right"><div className="text-sm font-bold text-gray-900">৳{g.current.toLocaleString()}</div><div className="text-[9px] text-gray-400">of ৳{g.target.toLocaleString()}</div></div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5"><div className="h-full rounded-full" style={{width:`${pct}%`,backgroundColor:g.done?'#10B981':g.color}}/></div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-gray-500">{pct.toFixed(0)}% reached</span>
              {!g.done?<div className="flex gap-1"><button className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[8px] font-medium">+ Deposit</button><button className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[8px] font-medium">Withdraw</button></div>:<span className="text-[9px] font-semibold text-emerald-600">Goal Achieved! 🎉</span>}
            </div>
          </div>);
        })}
      </div>
    </MockupFrame>
  );
}

// ── Loans ─────────────────────────────────────────────────────────────────────
function LoansMockup() {
  return (
    <MockupFrame title="Loans — /dashboard/loans">
      <div className="flex justify-between items-center mb-2"><div className="text-sm font-semibold text-gray-900">Loans</div><div className="px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>Add Loan</div></div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">{[{l:'Total Borrowed',v:'৳2,00,000',c:'text-gray-900'},{l:'Outstanding',v:'৳1,50,000',c:'text-red-600'},{l:'Repaid',v:'৳50,000',c:'text-green-600'}].map((s,i)=><div key={i} className="bg-white rounded-lg border border-gray-200 p-2"><div className="text-[9px] text-gray-500 mb-0.5">{s.l}</div><div className={`text-xs font-bold ${s.c}`}>{s.v}</div></div>)}</div>
      <div className="space-y-2">{[{lender:'Dutch-Bangla Bank',type:'Conventional',principal:150000,outstanding:120000,overdue:false},{lender:'Uncle Karim',type:'Qard Hasan',principal:50000,outstanding:30000,overdue:true}].map((loan,i)=>{const paid=((loan.principal-loan.outstanding)/loan.principal)*100;return(
        <div key={i} className={`bg-white rounded-lg border p-2.5 ${loan.overdue?'border-red-200 bg-red-50/20':'border-gray-200'}`}>
          <div className="flex items-start justify-between mb-1.5">
            <div><div className="flex items-center gap-1.5 flex-wrap"><span className="text-[11px] font-bold text-gray-900">{loan.lender}</span>{loan.overdue&&<span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-bold">OVERDUE</span>}<span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${loan.type==='Qard Hasan'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{loan.type}</span></div><div className="text-[9px] text-gray-500 mt-0.5">Principal: ৳{loan.principal.toLocaleString()}</div></div>
            <div className="text-right"><div className="text-sm font-bold text-red-600">৳{loan.outstanding.toLocaleString()}</div><div className="text-[9px] text-gray-400">outstanding</div></div>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5"><div className="h-full bg-green-400 rounded-full" style={{width:`${paid}%`}}/></div>
          <div className="flex items-center justify-between"><span className="text-[9px] text-gray-500">{paid.toFixed(0)}% repaid</span><button className="px-2 py-0.5 bg-gray-900 text-white rounded text-[9px] font-medium">Pay</button></div>
        </div>
      );})}
      </div>
    </MockupFrame>
  );
}

// ── Lendings ──────────────────────────────────────────────────────────────────
function LendingsMockup() {
  return (
    <MockupFrame title="Lend — /dashboard/lendings">
      <div className="flex items-center justify-between mb-2">
        <div><h1 className="text-sm font-bold text-gray-900">Lending Management</h1><p className="text-[10px] text-gray-500">Track money lent to others</p></div>
        <div className="px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>Add Lending</div>
      </div>
      {/* 6-stat row */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[{l:'Total Lent',v:'৳1,20,000',c:'text-blue-600'},{l:'Repaid',v:'৳40,000',c:'text-green-600'},{l:'Outstanding',v:'৳80,000',c:'text-red-600'},{l:'Active',v:'3',c:'text-orange-600'},{l:'Completed',v:'2',c:'text-emerald-600'},{l:'Overdue',v:'1',c:'text-red-600'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="text-[9px] text-gray-500 uppercase mb-0.5">{s.l}</div>
            <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>
      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-3">
        {['all','active','completed','overdue'].map((s,i)=>(
          <div key={i} className={`px-2 py-1 rounded-lg text-[9px] font-medium border ${i===0?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-600 border-gray-200'} capitalize`}>{s}</div>
        ))}
      </div>
      {/* Lending cards with left colored border */}
      <div className="space-y-2">
        {[
          {name:'Arif Hossain',phone:'01712-345678',amt:'৳50,000',outstanding:'৳30,000',date:'15 Apr 2026',status:'active',type:'Qard Hasan',overdue:false},
          {name:'Farida Begum',phone:'01812-678901',amt:'৳30,000',outstanding:'৳30,000',date:'1 Mar 2026',status:'active',type:'Conventional',overdue:true},
        ].map((l,i)=>(
          <div key={i} className={`bg-white rounded-lg shadow-sm p-3 border-l-4 ${l.overdue?'border-red-500 bg-red-50/30':'border-blue-500'} border border-gray-200`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${l.overdue?'bg-red-100':'bg-blue-100'}`}><User size={14} className={l.overdue?'text-red-600':'text-blue-600'}/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="text-[11px] font-bold text-gray-900">{l.name}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${l.type==='Qard Hasan'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{l.type}</span>
                  {l.overdue&&<span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-bold">OVERDUE</span>}
                </div>
                <div className="text-[9px] text-gray-500">{l.phone} · Due: {l.date}</div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div><div className="text-[8px] text-gray-400">Lent</div><div className="text-xs font-bold text-gray-900">{l.amt}</div></div>
                  <div><div className="text-[8px] text-gray-400">Outstanding</div><div className={`text-xs font-bold ${l.overdue?'text-red-600':'text-gray-900'}`}>{l.outstanding}</div></div>
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button className="px-2 py-1 bg-green-600 text-white rounded text-[9px] font-bold">Repayment</button>
                <div className="flex gap-1">
                  <button className="p-1 bg-gray-100 rounded"><Eye size={9} className="text-gray-600"/></button>
                  <button className="p-1 bg-gray-100 rounded"><Edit2 size={9} className="text-gray-600"/></button>
                  <button className="p-1 bg-red-50 rounded"><Trash2 size={9} className="text-red-400"/></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

// ── Investments ───────────────────────────────────────────────────────────────
function InvestmentsMockup() {
  const allocation=[{type:'DPS',pct:35,color:'#3B82F6'},{type:'Stocks',pct:28,color:'#10B981'},{type:'FDR',pct:22,color:'#F59E0B'},{type:'Savings Cert.',pct:15,color:'#8B5CF6'}];
  return (
    <MockupFrame title="Investments — /dashboard/investments">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-gray-900 flex items-center gap-1"><Sprout size={14} className="text-green-600"/>Investments</div>
        <div className="px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>Add Investment</div>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[{l:'Total Invested',v:'৳5,00,000',c:'text-gray-900'},{l:'Current Value',v:'৳5,85,000',c:'text-gray-900'},{l:'Total Returns',v:'+৳85,000',sub:'+17%',c:'text-green-600'},{l:'Dividends',v:'৳12,000',c:'text-blue-600'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="text-[9px] text-gray-500 mb-0.5">{s.l}</div>
            <div className={`text-xs font-bold ${s.c}`}>{s.v}</div>
            {s.sub&&<div className="text-[9px] text-green-600 font-medium">{s.sub}</div>}
          </div>
        ))}
      </div>
      {/* Allocation chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-2.5 mb-3">
        <div className="text-[10px] font-semibold text-gray-700 mb-2">Portfolio Allocation</div>
        <div className="grid grid-cols-2 gap-2">
          {allocation.map((a,i)=>(
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor:a.color}}/>
              <div><div className="text-[9px] text-gray-500">{a.type}</div><div className="text-[11px] font-bold text-gray-900">{a.pct}%</div></div>
            </div>
          ))}
        </div>
      </div>
      {/* Investment list */}
      <div className="flex gap-1.5 mb-2">
        {['All','Active','Matured','Sold'].map((s,i)=><div key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${i===1?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-500 border-gray-200'}`}>{s}</div>)}
      </div>
      <div className="space-y-1.5">
        {[
          {name:'Square Pharmaceuticals',type:'Stock',invested:'৳80,000',current:'৳95,000',ret:'+18.75%',status:'Active',color:'text-green-600'},
          {name:'DBBL DPS',type:'DPS',invested:'৳1,20,000',current:'৳1,32,000',ret:'+10%',status:'Active',color:'text-green-600'},
          {name:'3 Year Sanchayapatra',type:'Savings Cert.',invested:'৳1,00,000',current:'৳1,00,000',ret:'11.28% p.a.',status:'Active',color:'text-blue-600'},
        ].map((inv,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5"><span className="text-[11px] font-bold text-gray-900">{inv.name}</span><span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[8px] font-medium">{inv.type}</span><span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[8px] font-medium">{inv.status}</span></div>
              <div className="text-[9px] text-gray-500 mt-0.5">Invested: {inv.invested} · Current: {inv.current}</div>
            </div>
            <div className={`text-[11px] font-bold ${inv.color}`}>{inv.ret}</div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

// ── Shopping ──────────────────────────────────────────────────────────────────
function ShoppingMockup() {
  return (
    <MockupFrame title="Shopping Lists — /dashboard/shopping">
      <div className="flex items-center justify-between mb-3">
        <div><div className="text-sm font-bold text-gray-900">Shopping Lists</div><div className="text-[10px] text-gray-500">Create carts and track purchases</div></div>
        <div className="px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>New Cart</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          {name:'Weekly Groceries',desc:'Superstore run',items:12,confirmed:8,est:'৳3,200',actual:'৳2,950',status:'Partial',statusC:'bg-blue-100 text-blue-700'},
          {name:'Eid Shopping 2026',desc:'Clothes & gifts',items:6,confirmed:6,est:'৳18,000',actual:'৳17,500',status:'Completed',statusC:'bg-green-100 text-green-700'},
          {name:'Home Supplies',desc:'Monthly restock',items:5,confirmed:0,est:'৳1,800',actual:'—',status:'Draft',statusC:'bg-yellow-100 text-yellow-700'},
        ].map((cart,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><ShoppingBag size={14} className="text-gray-600"/></div>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${cart.statusC}`}>{cart.status}</span>
            </div>
            <div className="text-[11px] font-bold text-gray-900 mb-0.5">{cart.name}</div>
            <div className="text-[9px] text-gray-400 mb-2">{cart.desc}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px]"><span className="text-gray-500">Items</span><span className="font-medium text-gray-900">{cart.confirmed}/{cart.items} bought</span></div>
              <div className="flex justify-between text-[9px]"><span className="text-gray-500">Estimated</span><span className="font-medium text-gray-900">{cart.est}</span></div>
              <div className="flex justify-between text-[9px]"><span className="text-gray-500">Actual</span><span className={`font-medium ${cart.actual!=='—'?'text-green-600':'text-gray-400'}`}>{cart.actual}</span></div>
            </div>
            <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100">
              <button className="flex-1 py-1 bg-gray-900 text-white rounded text-[9px] font-bold flex items-center justify-center gap-0.5"><Eye size={9}/>Open</button>
              <button className="p-1 bg-gray-100 rounded"><Edit2 size={9} className="text-gray-600"/></button>
              <button className="p-1 bg-red-50 rounded"><Trash2 size={9} className="text-red-400"/></button>
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

// ── Jewellery ─────────────────────────────────────────────────────────────────
function JewelleryMockup() {
  return (
    <MockupFrame title="Jewellery Tracker — /dashboard/jewellery">
      <div className="flex items-center justify-between mb-3">
        <div><h1 className="text-sm font-bold text-gray-900 flex items-center gap-1"><Gem size={13} className="text-amber-500"/>Jewellery Tracker</h1><p className="text-[10px] text-gray-500">Track gold & silver — monitor value for Zakat</p></div>
        <div className="px-2.5 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1"><Plus size={9}/>Add Jewellery</div>
      </div>
      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[{l:'Total Zakat Value',v:'৳1,85,000',sub:'4/5 priced',bg:'bg-emerald-50 border-emerald-100',ic:<Star size={10} className="text-emerald-600"/>},{l:'Active Items',v:'5',sub:'3 gold · 2 silver',bg:'bg-amber-50 border-amber-100',ic:<Package size={10} className="text-amber-600"/>},{l:'Total Gold',v:'2V 4A (28.7g)',sub:'',bg:'bg-amber-50 border-amber-100',ic:<Coins size={10} className="text-amber-600"/>},{l:'Total Silver',v:'1V 8A (22.1g)',sub:'',bg:'bg-slate-50 border-slate-100',ic:<Coins size={10} className="text-slate-500"/>}].map((s,i)=>(
          <div key={i} className={`rounded-xl border p-3 ${s.bg}`}><div className="flex items-center gap-1.5 mb-1">{s.ic}<span className="text-[9px] text-gray-500 font-medium">{s.l}</span></div><p className="font-bold text-gray-900 text-xs leading-tight">{s.v}</p>{s.sub&&<p className="text-[9px] text-gray-400 mt-0.5">{s.sub}</p>}</div>
        ))}
      </div>
      {/* Unpriced nudge */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
        <AlertCircle size={12} className="text-amber-600 flex-shrink-0"/>
        <p className="text-[10px] text-amber-800"><strong>1 item</strong> not priced yet — tap <strong>Check Price</strong> to include in Zakat total.</p>
      </div>
      {/* Filter row */}
      <div className="flex gap-1.5 mb-3">
        <div className="relative flex-1"><Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/><div className="w-full pl-6 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-[10px] text-gray-400">Search jewellery…</div></div>
        {['Active ▾','All Metals ▾','Newest ▾'].map((f,i)=><div key={i} className="px-2 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-medium text-gray-700">{f}</div>)}
      </div>
      {/* Jewellery cards */}
      <div className="space-y-2">
        {[
          {name:'Gold Necklace Set',karat:'22K Gold',cat:'Necklace',weight:'1 Vori 4 Ana (16.18g)',zakatVal:'৳1,05,000',paid:'৳1,20,000',acqType:'purchased',metal:'Gold',priced:true},
          {name:'Silver Bangles (2 pcs)',karat:'Sterling Silver',cat:'Bangle',weight:'8 Ana (5.83g)',zakatVal:null,paid:null,acqType:'gift',metal:'Silver',priced:false},
        ].map((item,i)=>(
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-3 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.metal==='Gold'?'bg-amber-50 border border-amber-200':'bg-slate-50 border border-slate-200'}`}>
                  <Gem size={16} className={item.metal==='Gold'?'text-amber-600':'text-slate-600'}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[11px] font-bold text-gray-900">{item.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${item.metal==='Gold'?'bg-amber-100 text-amber-800':'bg-slate-100 text-slate-800'}`}>{item.karat}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[8px] text-gray-500 bg-gray-100">{item.cat}</span>
                    {item.acqType==='gift'&&<span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] text-purple-700 bg-purple-50 border border-purple-100"><Gift size={8}/>Gift</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1"><Scale size={9} className="text-gray-400"/><span className="text-[10px] font-semibold text-gray-700">{item.weight}</span></div>
                  {item.priced?(
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-emerald-700">{item.zakatVal}</span>
                      <span className="text-[9px] text-gray-400">Zakat value (−15%)</span>
                    </div>
                  ):<p className="text-[10px] text-orange-400 font-medium">⚠ Price not checked yet — tap Check Price</p>}
                  {item.paid&&<div className="flex items-center gap-1 mt-0.5"><span className="text-[9px] text-gray-500">Paid:</span><span className="text-[9px] font-semibold text-gray-700">{item.paid}</span><span className="text-[9px] text-emerald-500">✓ expensed</span></div>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 text-white rounded-xl text-[9px] font-bold whitespace-nowrap"><TrendingUp size={10}/>{item.priced?'Update Price':'Check Price'}</button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white rounded-xl text-[9px] font-bold whitespace-nowrap"><ArrowUpRight size={10}/>Sell</button>
                <div className="flex gap-1">
                  <button className="flex-1 flex items-center justify-center gap-0.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px]"><Edit2 size={8}/>Edit</button>
                  <button className="flex-1 flex items-center justify-center py-1 bg-red-50 text-red-400 rounded-lg"><Trash2 size={8}/></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

// ── Riba Tracker ──────────────────────────────────────────────────────────────
function RibaMockup() {
  return (
    <MockupFrame title="Riba Tracker — /dashboard/riba">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div><h1 className="text-sm font-bold text-gray-900 flex items-center gap-1"><AlertTriangle size={13} className="text-amber-500"/>Riba Tracker</h1><p className="text-[10px] text-gray-500">Track interest income and purify via Sadaqah</p></div>
      </div>
      {/* Islamic context banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
        <div className="flex items-start gap-2">
          <BookOpen size={13} className="text-amber-600 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-[10px] font-semibold text-amber-900 mb-0.5">Understanding Riba in Modern Finance</p>
            <p className="text-[9px] text-amber-800 leading-relaxed">Interest from bank accounts, FDR, bonds is Riba. Do not use it for personal benefit — donate as Sadaqah to purify your wealth, <em>without expecting Sawab</em>.</p>
          </div>
        </div>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          {l:'Total Riba Received',v:'৳4,250',sub:'5 transactions',bg:'bg-white border-amber-200',vc:'text-amber-700',I:AlertTriangle,ic:'text-amber-500'},
          {l:'Unpurified (Pending)',v:'৳1,750',sub:'2 items need Sadaqah',bg:'bg-white border-red-200',vc:'text-red-600',I:TrendingDown,ic:'text-red-500'},
          {l:'Donated as Sadaqah',v:'৳2,500',sub:'3 items purified',bg:'bg-white border-emerald-200',vc:'text-emerald-700',I:CheckCircle2,ic:'text-emerald-500'},
        ].map((s,i)=>(
          <div key={i} className={`border rounded-xl p-3 ${s.bg}`}>
            <div className="flex items-center gap-1.5 mb-1.5"><s.I size={11} className={s.ic}/><span className="text-[9px] text-gray-500 font-medium">{s.l}</span></div>
            <p className={`text-base font-bold ${s.vc}`}>{s.v}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
      {/* Warning */}
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
        <AlertCircle size={11} className="text-red-500 flex-shrink-0"/>
        <p className="text-[10px] text-red-800">You have <strong>৳1,750</strong> in unpurified Riba. Please donate as Sadaqah.</p>
      </div>
      {/* Transaction list */}
      <div className="space-y-2">
        <div className="text-[9px] font-bold text-red-600 uppercase tracking-wider px-1">Pending Purification (2)</div>
        {[
          {desc:'Bank Interest — DBBL Savings',acc:'DBBL Savings',date:'5 Mar 2026',amt:'+৳1,200',purified:false},
          {desc:'FDR Interest — Q1 2026',acc:'DBBL Savings',date:'1 Jan 2026',amt:'+৳550',purified:false},
        ].map((t,i)=>(
          <div key={i} className="bg-white rounded-xl border border-amber-200 p-3 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><AlertTriangle size={14} className="text-amber-500"/></div>
              <div>
                <div className="flex items-center gap-1.5"><span className="text-[11px] font-bold text-gray-900">{t.desc}</span><span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">RIBA</span></div>
                <p className="text-[9px] text-gray-500 mt-0.5">{t.acc} · {t.date}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <p className="text-sm font-bold text-amber-700">{t.amt}</p>
              <button className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 text-white rounded-xl text-[9px] font-bold whitespace-nowrap"><Heart size={9}/>Give Sadaqah</button>
            </div>
          </div>
        ))}
        <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider px-1 pt-1">Purified ✓ (3)</div>
        <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-100 px-3 py-1.5 flex items-center gap-2">
            <CheckCircle2 size={10} className="text-emerald-500"/><span className="text-[9px] font-bold text-emerald-700">Purified via Sadaqah</span><span className="text-[9px] text-emerald-500 ml-auto">12 Feb 2026 · ৳800</span>
          </div>
          <div className="p-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center"><CheckCircle2 size={13} className="text-emerald-500"/></div><div><div className="text-[11px] font-bold text-gray-900">Bank Interest — DBBL</div><p className="text-[9px] text-gray-500">DBBL Savings · 1 Feb 2026</p></div></div>
            <p className="text-sm font-bold text-amber-700">+৳800</p>
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}

// ── Zakat ─────────────────────────────────────────────────────────────────────
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
          <div className="flex items-center gap-2 mb-2"><AlertCircle size={16} className="text-gray-400"/><div><div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Status</div><div className="text-sm font-bold">Not Mandatory</div></div></div>
          <div className="grid grid-cols-2 gap-2"><div className="bg-white/10 rounded-lg p-2"><div className="text-[9px] text-gray-400 mb-0.5">Total Wealth</div><div className="text-sm font-bold">৳95,000</div></div><div className="bg-white/10 rounded-lg p-2"><div className="text-[9px] text-gray-400 mb-0.5">Nisab Threshold</div><div className="text-sm font-bold">৳1,20,000</div></div></div>
          <div className="mt-2 text-[10px] text-gray-400">৳25,000 below Nisab. No action needed.</div>
        </div>
        <div className="bg-blue-600 text-white rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-blue-200"/><div><div className="text-[9px] text-blue-200 uppercase font-bold tracking-widest">Status</div><div className="text-sm font-bold">Monitoring Cycle Active</div></div></div>
          <div className="grid grid-cols-3 gap-1.5"><div className="bg-white/15 rounded-lg p-1.5"><div className="text-[9px] text-blue-200 mb-0.5">Total Wealth</div><div className="text-xs font-bold">৳1,45,000</div></div><div className="bg-white/15 rounded-lg p-1.5"><div className="text-[9px] text-blue-200 mb-0.5">Days Remaining</div><div className="text-xs font-bold">287 days</div></div><div className="bg-white/15 rounded-lg p-1.5"><div className="text-[9px] text-blue-200 mb-0.5">Cycle Start</div><div className="text-xs font-bold">12 Sha'ban</div></div></div>
        </div>
        <div className="bg-red-600 text-white rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2"><Star size={16} className="text-yellow-300"/><div><div className="text-[9px] text-red-200 uppercase font-bold tracking-widest">Status</div><div className="text-sm font-bold">Zakat Due</div></div></div>
          <div className="grid grid-cols-2 gap-2 mb-2"><div className="bg-white/15 rounded-lg p-2"><div className="text-[9px] text-red-200 mb-0.5">Total Wealth</div><div className="text-sm font-bold">৳1,60,000</div></div><div className="bg-white/15 rounded-lg p-2"><div className="text-[9px] text-red-200 mb-0.5">Zakat Due (2.5%)</div><div className="text-sm font-bold text-yellow-300">৳4,000</div></div></div>
          <button className="w-full py-1.5 bg-white text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><Calculator size={10}/>Record Payment</button>
        </div>
      </div>
    </MockupFrame>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function AnalyticsMockup() {
  const bars=[{m:'Oct',i:60,e:45},{m:'Nov',i:72,e:55},{m:'Dec',i:58,e:70},{m:'Jan',i:80,e:48},{m:'Feb',i:65,e:52},{m:'Mar',i:90,e:40}];
  const pie=[{name:'Foods',pct:35,color:'#EC4899'},{name:'Transport',pct:22,color:'#EF4444'},{name:'Shopping',pct:18,color:'#8B5CF6'},{name:'Healthcare',pct:15,color:'#06B6D4'},{name:'Other',pct:10,color:'#F59E0B'}];
  return (
    <MockupFrame title="Analytics — /dashboard/analytics">
      <div className="flex gap-1.5 mb-3">{['Week','Month','Year','Custom'].map((r,i)=><div key={i} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border ${i===2?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-600 border-gray-200'}`}>{r}</div>)}</div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">{[{l:'Total Income',v:'৳5,40,000',c:'text-green-600'},{l:'Total Expense',v:'৳3,10,000',c:'text-red-600'},{l:'Net Savings',v:'৳2,30,000',c:'text-green-600'}].map((s,i)=><div key={i} className="bg-white rounded-lg border border-gray-200 p-2"><div className="text-[9px] text-gray-500 mb-0.5">{s.l}</div><div className={`text-sm font-bold ${s.c}`}>{s.v}</div></div>)}</div>
      <div className="bg-white rounded-lg border border-gray-200 p-2.5 mb-2">
        <div className="text-[10px] font-semibold text-gray-700 mb-2 flex items-center gap-1"><BarChart3 size={10}/>Income vs Expense (6 months)</div>
        <div className="flex items-end gap-2 h-16">{bars.map((b,i)=><div key={i} className="flex-1 flex flex-col items-center gap-0.5"><div className="w-full flex gap-0.5 items-end"><div className="flex-1 bg-emerald-400 rounded-sm" style={{height:`${b.i*0.6}px`}}/><div className="flex-1 bg-red-400 rounded-sm" style={{height:`${b.e*0.6}px`}}/></div><div className="text-[7px] text-gray-400">{b.m}</div></div>)}</div>
        <div className="flex gap-3 mt-1"><div className="flex items-center gap-1 text-[9px] text-gray-600"><div className="w-2 h-2 rounded-sm bg-emerald-400"/>Income</div><div className="flex items-center gap-1 text-[9px] text-gray-600"><div className="w-2 h-2 rounded-sm bg-red-400"/>Expense</div></div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-2.5">
        <div className="text-[10px] font-semibold text-gray-700 mb-2">Expense by Category</div>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full flex-shrink-0 relative" style={{background:'conic-gradient(#EC4899 0% 35%, #EF4444 35% 57%, #8B5CF6 57% 75%, #06B6D4 75% 90%, #F59E0B 90% 100%)'}}><div className="absolute inset-2 bg-white rounded-full"/></div>
          <div className="space-y-0.5 flex-1">{pie.map((p,i)=><div key={i} className="flex items-center justify-between"><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor:p.color}}/><span className="text-[9px] text-gray-700">{p.name}</span></div><span className="text-[9px] font-semibold">{p.pct}%</span></div>)}</div>
        </div>
      </div>
    </MockupFrame>
  );
}

// ── Recurring ─────────────────────────────────────────────────────────────────
function RecurringMockup() {
  return (
    <MockupFrame title="Recurring — /dashboard/recurring">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-semibold text-gray-900">Recurring Transactions</div>
        <div className="flex gap-1.5"><div className="px-2 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-medium flex items-center gap-1"><Bell size={9}/>2 Pending</div><div className="px-2 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-medium flex items-center gap-1"><Plus size={9}/>Add</div></div>
      </div>
      <div className="flex gap-1.5 mb-3">{['All','Active','Paused','Completed'].map((s,i)=><div key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${i===1?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-500 border-gray-200'}`}>{s}</div>)}</div>
      <div className="space-y-2">
        {[{name:'Monthly Rent',type:'Expense',freq:'Monthly · 1st',amt:'৳15,000',status:'active',mode:'Auto',next:'1 Apr'},{name:'Salary Credit',type:'Income',freq:'Monthly · 5th',amt:'৳45,000',status:'active',mode:'Auto',next:'5 Apr'},{name:'Electricity Bill',type:'Expense',freq:'Monthly · 25th',amt:'৳~800',status:'active',mode:'Manual',next:'25 Mar'},{name:'Netflix',type:'Expense',freq:'Monthly · 15th',amt:'৳400',status:'paused',mode:'Auto',next:'Paused'}].map((r,i)=>(
          <div key={i} className={`bg-white rounded-lg border p-2.5 ${r.status==='paused'?'border-gray-100 opacity-60':'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2"><div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.type==='Income'?'bg-green-100':'bg-red-100'}`}>{r.type==='Income'?<TrendingUp size={13} className="text-green-600"/>:<TrendingDown size={13} className="text-red-600"/>}</div><div><div className="text-[11px] font-semibold text-gray-900">{r.name}</div><div className="text-[9px] text-gray-500">{r.freq}</div></div></div>
              <div className="text-right"><div className={`text-sm font-bold ${r.type==='Income'?'text-green-600':'text-red-600'}`}>{r.amt}</div><div className="flex gap-0.5 justify-end mt-0.5">{r.mode==='Manual'&&<span className="px-1 py-0.5 bg-amber-100 text-amber-700 rounded text-[7px] font-bold">MANUAL</span>}{r.status==='paused'&&<span className="px-1 py-0.5 bg-gray-100 text-gray-500 rounded text-[7px] font-bold">PAUSED</span>}</div></div>
            </div>
            <div className="flex items-center justify-between mt-1.5"><span className="text-[9px] text-gray-400">Next: {r.next}</span><div className="flex gap-1"><button className={`p-1 rounded ${r.status==='active'?'bg-amber-50':'bg-green-50'}`}>{r.status==='active'?<Clock size={9} className="text-amber-500"/>:<TrendingUp size={9} className="text-green-500"/>}</button><button className="p-1 bg-gray-50 rounded"><Edit2 size={9} className="text-gray-400"/></button><button className="p-1 bg-red-50 rounded"><Trash2 size={9} className="text-red-400"/></button></div></div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

// ── Tax ───────────────────────────────────────────────────────────────────────
function TaxMockup() {
  return (
    <MockupFrame title="Tax File — /dashboard/tax">
      <div className="flex items-center justify-between mb-3">
        <div><div className="text-sm font-bold text-gray-900">Tax Preparation</div><div className="text-[10px] text-gray-500">Bangladesh income tax — July to June fiscal year</div></div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg text-[10px] font-medium"><Tag size={9}/>Category Mappings</div>
      </div>
      {/* Current year card */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4 text-white mb-3">
        <div className="flex items-center justify-between gap-3">
          <div><div className="flex items-center gap-2 mb-1"><h2 className="text-sm font-bold">Current Income Year: 2025–2026</h2></div><p className="text-[10px] text-gray-300">Jul 2025 – Jun 2026 · Filing deadline: 30 Nov 2026</p><p className="text-[9px] text-gray-400 mt-1">266 days until deadline</p></div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-900 rounded-lg font-medium text-[10px] whitespace-nowrap"><Plus size={10}/>Create Tax Year</button>
        </div>
      </div>
      {/* Tax year records */}
      <div className="space-y-2">
        {[
          {year:'2025–2026',status:'In Progress',statusC:'bg-blue-100 text-blue-700',income:'৳3,60,000',heads:['Salaries: ৳3,20,000','Freelance: ৳40,000'],deadline:'30 Nov 2026',days:'266 days left',dC:'text-green-600',dBg:'bg-green-50'},
          {year:'2024–2025',status:'Filed',statusC:'bg-green-100 text-green-700',income:'৳3,10,000',heads:['Salaries: ৳3,10,000'],deadline:'30 Nov 2025',days:'Filed',dC:'text-green-600',dBg:'bg-green-50'},
        ].map((ty,i)=>(
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><FileText size={14} className="text-gray-600"/></div>
                  <div><div className="flex items-center gap-2"><span className="text-[11px] font-bold text-gray-900">Income Year {ty.year}</span><span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${ty.statusC}`}>{ty.status}</span></div><p className="text-[9px] text-gray-500">Filing deadline: {ty.deadline}</p></div>
                </div>
                <div className="ml-10 space-y-0.5">
                  <div className="text-[10px] font-semibold text-gray-900">Total Income: {ty.income}</div>
                  {ty.heads.map((h,hi)=><div key={hi} className="text-[9px] text-gray-500">· {h}</div>)}
                </div>
              </div>
              <div className={`px-2 py-1 rounded-lg text-[9px] font-medium ${ty.dBg} ${ty.dC} whitespace-nowrap`}>{ty.days}</div>
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────
function SectionText({ content }) { return <p className="text-sm text-gray-700 leading-relaxed">{content}</p>; }
function SectionList({ items }) {
  return <div className="space-y-2">{items.map((item,i)=>{const Icon=item.icon;return(<div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">{Icon&&<div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"><Icon size={14} className="text-gray-600"/></div>}<div><div className="text-sm font-semibold text-gray-900">{item.label}</div>{item.desc&&<p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>}</div></div>);})}</div>;
}
function SectionSteps({ items }) {
  return <ol className="space-y-3">{items.map((step,i)=><li key={i} className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full text-xs font-bold flex items-center justify-center mt-0.5">{i+1}</span><p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p></li>)}</ol>;
}
function SectionFlow({ items }) {
  return <div>{items.map((item,i)=><div key={i} className="flex items-start gap-3"><div className="flex flex-col items-center self-stretch"><div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1.5 ring-2 ring-blue-100"/>{i<items.length-1&&<div className="w-0.5 bg-blue-200 flex-1 mt-1" style={{minHeight:24}}/>}</div><div className="pb-4"><div className="text-sm font-semibold text-gray-900">{item.label}</div><p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p></div></div>)}</div>;
}
function SectionCallout({ content, variant }) {
  const s={info:{bg:'bg-blue-50',border:'border-blue-200',icon:<Info size={15} className="text-blue-600 flex-shrink-0 mt-0.5"/>,text:'text-blue-900'},warning:{bg:'bg-amber-50',border:'border-amber-200',icon:<AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5"/>,text:'text-amber-900'},success:{bg:'bg-emerald-50',border:'border-emerald-200',icon:<CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5"/>,text:'text-emerald-900'}}[variant]||{bg:'bg-blue-50',border:'border-blue-200',icon:<Info size={15} className="text-blue-600 flex-shrink-0 mt-0.5"/>,text:'text-blue-900'};
  return <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border ${s.bg} ${s.border}`}>{s.icon}<p className={`text-sm leading-relaxed ${s.text}`}>{content}</p></div>;
}
function SectionTips({ items }) {
  return <ul className="space-y-2.5">{items.map((tip,i)=><li key={i} className="flex items-start gap-2.5"><Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5"/><p className="text-sm text-gray-700 leading-relaxed">{tip}</p></li>)}</ul>;
}
function SectionMockupTabs({ mockups }) {
  const [active, setActive] = useState(mockups[0]?.tab||0);
  const cur=mockups.find(m=>m.tab===active)||mockups[0];
  return(<div><div className="flex gap-1.5 mb-3">{mockups.map(m=><button key={m.tab} onClick={()=>setActive(m.tab)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${active===m.tab?'bg-gray-900 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{m.tab}</button>)}</div><div className="rounded-xl overflow-hidden">{cur?.node}</div>{cur?.caption&&<p className="text-[11px] text-gray-400 mt-2 text-center italic leading-relaxed">{cur.caption}</p>}</div>);
}

function GuideSection({ section }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/80 hover:bg-gray-100 transition-colors text-left gap-2">
        <span className="text-sm font-semibold text-gray-800">{section.heading}</span>
        {open?<ChevronDown size={15} className="text-gray-400 flex-shrink-0"/>:<ChevronRight size={15} className="text-gray-400 flex-shrink-0"/>}
      </button>
      {open&&<div className="px-4 py-4 bg-white">
        {section.type==='text'&&<SectionText content={section.content}/>}
        {section.type==='list'&&<SectionList items={section.items}/>}
        {section.type==='steps'&&<SectionSteps items={section.items}/>}
        {section.type==='flow'&&<SectionFlow items={section.items}/>}
        {section.type==='callout'&&<SectionCallout content={section.content} variant={section.variant}/>}
        {section.type==='tips'&&<SectionTips items={section.items}/>}
        {section.type==='mockupTabs'&&<SectionMockupTabs mockups={section.mockups}/>}
      </div>}
    </div>
  );
}

// ─── All 15 guides ────────────────────────────────────────────────────────────
const GUIDES = [
  { id:'accounts', icon:CreditCard, color:'blue', title:'Accounts', subtitle:'Your financial containers',
    summary:'Accounts are the foundation of Nisab Wallet. Every transaction, transfer, goal, and Zakat calculation ties back to an account balance.',
    mockup:<AccountsMockup/>, mockupCaption:'The Accounts page — dark gradient Total Balance card, then individual account cards in a 2-column grid. The bKash card shows goal allocation breakdown (Available vs Goal Reserved).',
    sections:[
      {heading:'What is an Account?',type:'text',content:'An account represents any place you hold money — your wallet, a bank, a mobile wallet, gold, or silver. Nisab Wallet consolidates all of them so you always know your true total wealth.'},
      {heading:'Account Types',type:'list',items:[{icon:Wallet,label:'Cash',desc:'Physical money in your wallet or home safe'},{icon:Building2,label:'Bank Account',desc:'Savings or current accounts at any bank'},{icon:Smartphone,label:'Mobile Banking',desc:'bKash, Nagad, Rocket, or any MFS wallet'},{icon:Coins,label:'Gold',desc:'Enter current market value in Taka — update when prices change'},{icon:Coins,label:'Silver',desc:'Enter current market value — feeds Nisab threshold calculation'}]},
      {heading:'Getting Started',type:'steps',items:['Click "Load Defaults" to instantly create Cash, Bank 1, bKash, and Bank 2 with ৳0','Or click "Add Account", choose a type, name it descriptively, and enter current balance','Balances update automatically with each transaction — or edit directly any time','Delete an account only when it has no linked transactions, goals, or loans']},
      {heading:'Goal Allocation on Cards',type:'callout',variant:'info',content:'When goals are linked to an account, the card shows Total Balance and Available to Spend. Available = Total minus goal-reserved funds. Expenses that would dip into goal money are blocked automatically.'},
      {heading:'How Accounts Connect to Everything',type:'flow',items:[{label:'Transactions',desc:'Every income/expense instantly credits or debits the chosen account balance'},{label:'Transfers',desc:'Move money between accounts — both balances update simultaneously'},{label:'Goals',desc:'Reserved funds reduce Available to Spend on that account'},{label:'Loans & Lendings',desc:'Borrowed/lent amounts are drawn from or added to a selected account'},{label:'Zakat',desc:'Sum of ALL account balances = your total wealth vs Nisab threshold'}]},
      {heading:'Pro Tips',type:'tips',items:['Name accounts specifically — "DBBL Savings" is clearer than just "Bank"','Update Gold and Silver values monthly when you check market prices','You need at least 1 account before any transaction, at least 2 for transfers']},
    ]},

  { id:'categories', icon:FolderOpen, color:'violet', title:'Categories', subtitle:'Label every transaction',
    summary:'Categories organise your money flow into named groups. Required for every transaction — they power Analytics charts, Budget limits, and Tax file sections.',
    mockup:<CategoriesMockup/>, mockupCaption:'The Categories page — Income (green tag) and Expense (red tag) categories each in their own card, displayed as colour-dot pills with edit/delete icons.',
    sections:[
      {heading:'Why Categories Are Required',type:'text',content:'Every income or expense must belong to a category. Without categories, there are no charts, no budget tracking, and no tax file grouping. Good categories = meaningful analytics.'},
      {heading:'Income vs. Expense',type:'list',items:[{icon:TrendingUp,label:'Income Categories',desc:'Money coming in: Salary, Bonus, Freelance, Rental, Business Revenue'},{icon:TrendingDown,label:'Expense Categories',desc:'Money going out: Food, Transport, Healthcare, Shopping, Utility Bills'}]},
      {heading:'Load Defaults',type:'callout',variant:'info',content:'Click "Load Defaults" to add: Income — Salary, Bonus, Loan. Expense — Transportation, Shopping, Foods, Healthcare, Loan Payment. Ready in seconds.'},
      {heading:'Creating a Custom Category',type:'steps',items:['Click "Add Category" and type a name','Choose type: Income or Expense','Pick a colour from 10 preset swatches','Save — instantly available in all transaction forms']},
      {heading:'Renaming is Safe',type:'callout',variant:'success',content:'Each category has a permanent internal ID. Renaming "Foods" to "Groceries & Dining" never breaks historical transactions, analytics, or budget history.'},
      {heading:'Pro Tips',type:'tips',items:['Create categories before recording transactions — they are required','Consistent colour themes make charts readable at a glance','Categories used in Budgets automatically show actual vs. budgeted spending']},
    ]},

  { id:'transactions', icon:Receipt, color:'emerald', title:'Transactions', subtitle:'Record every money movement',
    summary:'Transactions are the engine of Nisab Wallet. Every income or expense instantly updates account balances, analytics, budgets, and Zakat wealth.',
    mockup:<TransactionsMockup/>, mockupCaption:'The Transactions page — 4 summary cards, filter bar, date-grouped list with green income rows, red expense rows, and blue ⇄ transfer rows.',
    sections:[
      {heading:'Three Transaction Types',type:'list',items:[{icon:TrendingUp,label:'Income',desc:'Money from outside — salary, freelance, gift. Increases account balance.'},{icon:TrendingDown,label:'Expense',desc:'Money going out — food, transport, bills. Decreases account balance.'},{icon:ArrowRightLeft,label:'Transfer',desc:'Between your own accounts. No wealth change. Both balances update.'}]},
      {heading:'The Add Transaction Modal — Three Tabs',type:'mockupTabs',mockups:[
        {tab:'income',node:<TransactionModalMockup tab="income"/>,caption:'Income tab (green) — large amount field, account + category selectors, date, and optional note.'},
        {tab:'expense',node:<TransactionModalMockup tab="expense"/>,caption:'Expense tab (red) — same layout but blocked if amount exceeds Available balance (after goal allocations).'},
        {tab:'transfer',node:<TransactionModalMockup tab="transfer"/>,caption:'Transfer tab (blue) — From and To account selectors. Requires at least 2 accounts.'},
      ]},
      {heading:'Recording a Transaction',type:'steps',items:['Click "Add Transaction" — requires at least 1 account AND 1 category','Choose tab: Income, Expense, or Transfer','Enter the amount','Select Account — shows Available balance for each','Select Category matching the type','Set Date (defaults today) and optional Note','Click Confirm — balance updates immediately']},
      {heading:'Balance Protection',type:'callout',variant:'warning',content:'For Expense transactions, the system checks Available balance (total minus goal allocations). If the amount would dip into goal-reserved money, the transaction is blocked with a breakdown showing total, reserved, and available.'},
      {heading:'Filters and Search',type:'list',items:[{icon:Filter,label:'Type Filter',desc:'All, Income only, or Expense only'},{icon:Wallet,label:'Account Filter',desc:'Transactions for one specific account'},{icon:Clock,label:'Period Filter',desc:'Today, Week (Sat–Fri), Month, Year, All Time, or Custom Range'},{icon:Search,label:'Search',desc:'Matches description, amount, category, account — live as you type'}]},
      {heading:'Transfers in the List',type:'callout',variant:'info',content:'Each transfer appears as two linked rows — Expense on source and Income on destination — both marked with a blue ⇄ icon. Editing or deleting one side updates both together.'},
      {heading:'Pro Tips',type:'tips',items:['Record transactions the same day for accurate period summaries','Summary cards exclude transfers — only real income/expense totals shown','The week resets on Saturday — standard Bangladesh work week']},
    ]},

  { id:'transfer', icon:ArrowRightLeft, color:'cyan', title:'Transfer', subtitle:'Move money between accounts',
    summary:'Transfer moves funds from one of your own accounts to another without counting it as income or expense — keeping your total wealth accurate.',
    mockup:<TransferMockup/>, mockupCaption:'The Transfer page — form on the left with From→arrow→To selectors, Recent Transfers history panel on the right.',
    sections:[
      {heading:'When to Use Transfer',type:'text',content:'Use Transfer any time you move money between your own accounts — bank withdrawal to top up bKash, salary to savings, or between two banks. Recording as Expense + Income would double-count and corrupt analytics.'},
      {heading:'How to Transfer',type:'steps',items:['Go to Transfer from the sidebar — or use the Transfer tab inside Add Transaction','Select "From" account (shows current balance)','Select "To" account (cannot be the same)','Enter the amount — checked against Available balance','Set date and optional description','Click "Transfer Money" — both balances update instantly']},
      {heading:'What Happens',type:'flow',items:[{label:'From Account',desc:'Balance decreases by transfer amount'},{label:'To Account',desc:'Balance increases by transfer amount'},{label:'Transfer Record',desc:'Saved with both account names, amount, date, and note'},{label:'Transaction List',desc:'Appears as two linked rows marked with ⇄'},{label:'Analytics',desc:'Excluded from income/expense charts — total wealth unchanged'}]},
      {heading:'Pro Tips',type:'tips',items:['Always use Transfer (not Expense + Income) for your own accounts','Can be backdated using the date field','Requires at least 2 accounts to be enabled']},
    ]},

  { id:'shopping', icon:ShoppingBag, color:'pink', title:'Shopping List', subtitle:'Plan before you spend',
    summary:'Create smart shopping carts with item prices before going to the market. Tick items off as you buy them and compare estimated vs. actual costs live.',
    mockup:<ShoppingMockup/>, mockupCaption:'The Shopping Lists page — 3 cart cards in a grid showing status badges (Draft / Partial / Completed), item progress, estimated vs actual totals, and Open/Edit/Delete actions.',
    sections:[
      {heading:'How Shopping Lists Work',type:'text',content:'Create a Cart (e.g., "Weekly Groceries"), add items with quantities and estimated prices, then tick items off at the market. The cart shows estimated total vs. purchased total live — a budget tracker in your pocket.'},
      {heading:'Cart Status Badges',type:'list',items:[{icon:Package,label:'Empty',desc:'Cart created but no items added yet'},{icon:Clock,label:'Draft',desc:'Items added but shopping not started'},{icon:Clock,label:'Partial',desc:'Some items ticked off — shopping in progress'},{icon:CheckCircle2,label:'Completed',desc:'All items purchased'}]},
      {heading:'Creating and Using a Cart',type:'steps',items:['Click "New Cart", give it a name and optional description','Click Open to enter the cart and add items with name, quantity, and estimated price','The cart shows a running estimated total','At the market, tick items off as you buy them — purchased subtotal updates live','After shopping, use the final total to record an Expense transaction']},
      {heading:'Pro Tips',type:'tips',items:['Create separate carts for different trips — weekly groceries, Eid shopping, household supplies','Add prices before leaving home to check if total fits your budget','Compare estimated vs. actual to improve future budgeting','Keep a "Next Month" cart and add items throughout the month as you remember them']},
    ]},

  { id:'budgets', icon:PiggyBank, color:'teal', title:'Budgets', subtitle:'Monthly spending limits',
    summary:'Set a maximum monthly spend per expense category. The system reads your actual transactions in real time and shows colour-coded progress bars.',
    mockup:<BudgetsMockup/>, mockupCaption:'The Budgets page — 4 category cards with progress bars: green (on track), amber (warning at 96%), red (over budget), green (well within limit).',
    sections:[
      {heading:'How Budgets Work',type:'text',content:'Each month you define a spending limit per expense category. The system reads actual expense transactions for that calendar month and shows how much of each limit you have used with a colour-coded bar.'},
      {heading:'Setting Budgets',type:'steps',items:['Go to Budgets — all Expense categories listed automatically','Enter a Taka limit next to each category to control','Leave blank for no limit — spending still displays','Click "Save All Budgets" — applies to the current month immediately','Next month: set new limits or use Copy from Previous Month']},
      {heading:'Colour Code Guide',type:'list',items:[{icon:CheckCircle2,label:'Green — On Track',desc:'Spent less than 80% of limit'},{icon:AlertCircle,label:'Amber — Warning',desc:'Spent 80–99% of limit — consider slowing down'},{icon:AlertCircle,label:'Red — Over Budget',desc:'Exceeded the limit'},{icon:Info,label:'No Limit Set',desc:'Category has spending but no budget — shown for awareness'}]},
      {heading:'Copy from Previous Month',type:'callout',variant:'info',content:'At the start of a new month, a "Copy from Previous Month" button appears — saves re-entering every limit. Adjust individual categories before saving.'},
      {heading:'Pro Tips',type:'tips',items:['Budgets are awareness tools — they do not block transactions','Click any card to open the transaction list filtered to that category','Review Analytics → Category Pie Chart first to understand which categories need limits']},
    ]},

  { id:'loans', icon:HandCoins, color:'rose', title:'Loans', subtitle:'Track money you borrowed',
    summary:'Track every loan — banks, institutions, or individuals — with repayment schedules, interest calculations, and payment history.',
    mockup:<LoansMockup/>, mockupCaption:'The Loans page — summary stats (Total Borrowed / Outstanding / Repaid), then loan cards with type badges, repayment progress bars, overdue warning, and Pay button.',
    sections:[
      {heading:'Loan Types',type:'list',items:[{icon:Shield,label:'Qard Hasan (0%)',desc:'Islamic lending — zero interest, repay exactly what was borrowed'},{icon:TrendingUp,label:'Conventional',desc:'Bank loans with interest — enter rate and schedule, system calculates monthly payment'}]},
      {heading:'Adding a Loan',type:'steps',items:['Click "Add Loan" and enter lender name','Choose type: Qard Hasan or Conventional','Enter principal — for conventional also enter interest rate and schedule','Select which account receives the money — balance increases immediately','Enable reminders for due date alerts']},
      {heading:'Recording a Repayment',type:'steps',items:['Click "Pay" on the loan card','Enter amount and choose source account — that balance decreases','When fully repaid, status becomes "Paid" automatically','Full payment history accessible via the eye icon']},
      {heading:'Pro Tips',type:'tips',items:['Enable reminders — in-app notification before payment due','Filter by Active / Paid / Overdue using status tabs','Loan amounts credited to accounts count toward Zakat wealth']},
    ]},

  { id:'lendings', icon:Blend, color:'amber', title:'Lend', subtitle:'Track money others owe you',
    summary:'Lend tracks money you have given to others — borrower details, repayment status, overdue alerts, and full payment history.',
    mockup:<LendingsMockup/>, mockupCaption:'The Lending Management page — 6 summary stats in a grid, filter tabs (All / Active / Completed / Overdue), then lending cards with left colour border, borrower info, outstanding amounts, and Repayment button.',
    sections:[
      {heading:'Loans vs. Lend',type:'callout',variant:'info',content:'Loans = money you borrowed (you owe someone). Lend = money you gave out (someone owes you). Opposite effects on account balances — completely separate modules.'},
      {heading:'Adding a Lending Record',type:'steps',items:['Click "Add Lending" — enter borrower name, phone, email, address','Enter amount lent, lending date, and due date','Choose: Full Payment or Installments','Select which account the money comes from — balance decreases immediately','Add notes for collateral or conditions']},
      {heading:'Repayment Types',type:'list',items:[{icon:CheckCircle2,label:'Full Payment',desc:'Borrower repays in one lump sum — outstanding clears to zero'},{icon:Calculator,label:'Installments',desc:'Partial repayments tracked separately — each reduces outstanding balance'}]},
      {heading:'Recording a Repayment',type:'steps',items:['Click "Repayment" on the lending record','Enter amount received and destination account','Outstanding balance decreases — when zero, status becomes "Settled"']},
      {heading:'Pro Tips',type:'tips',items:['Always record borrower contact details for follow-up','Use Reminders for near-due-date notifications','Overdue lendings highlighted in red automatically','Left border colour: blue = active, green = completed, red = overdue']},
    ]},

  { id:'goals', icon:Target, color:'orange', title:'Financial Goals', subtitle:'Ring-fence money for a purpose',
    summary:'Goals reserve a portion of an account balance for a specific purpose. Reserved money is protected from accidental spending by the transaction system.',
    mockup:<GoalsMockup/>, mockupCaption:'The Goals page — three goal cards with coloured progress bars. Completed "New Laptop" shows green checkmark. Each card has Deposit and Withdraw buttons.',
    sections:[
      {heading:'What a Goal Does',type:'text',content:'A goal marks a slice of an account balance as "reserved". The account total does not change, but Available to Spend drops by the reserved amount. Expenses dipping into goal money are blocked automatically.'},
      {heading:'Creating a Goal',type:'steps',items:['Click "Add Goal", enter a name (e.g., "Emergency Fund")','Set Target Amount and Target Date','Choose the Linked Account for reserved funds','Set Priority: Low, Medium, or High','Enable notifications for milestone alerts (25%, 50%, 75%, 100%)','Save — linked account Available balance updates immediately']},
      {heading:'Deposit & Withdraw',type:'list',items:[{icon:TrendingUp,label:'Deposit',desc:'Reserve more from the linked account — Available decreases'},{icon:TrendingDown,label:'Withdraw',desc:'Release funds — Available increases (for planned spending from goal)'}]},
      {heading:'Balance Protection Example',type:'callout',variant:'warning',content:'Bank Account has ৳50,000 total with ৳20,000 reserved for "New Laptop". Available = ৳30,000. A ৳35,000 expense from that account is blocked even though raw balance shows ৳50,000.'},
      {heading:'Pro Tips',type:'tips',items:['Each card shows a monthly savings target — how much to deposit per month to reach goal on time','Multiple goals can share one account — each reserves its own slice','When a goal is complete, withdraw or delete to release Available balance']},
    ]},

  { id:'investments', icon:Sprout, color:'green', title:'Investments', subtitle:'Track portfolio returns',
    summary:'Track all long-term assets — stocks, FDR, DPS, savings certificates, real estate, crypto — with automatic return calculations and portfolio analytics.',
    mockup:<InvestmentsMockup/>, mockupCaption:'The Investments page — 4 summary cards (Invested / Value / Returns / Dividends), a Portfolio Allocation grid, filter tabs, and individual investment rows showing type badges, amounts, and return percentages.',
    sections:[
      {heading:'Investment Types Supported',type:'list',items:[{icon:TrendingUp,label:'Stocks & Mutual Funds',desc:'Purchase price vs. current price for capital gain/loss'},{icon:Coins,label:'DPS & FDR',desc:'Deposit schemes — enter maturity value for automatic return calculation'},{icon:FileText,label:'Savings Certificate (Sanchayapatra)',desc:'Government bonds with face value and maturity date'},{icon:Shield,label:'PPF & Pension Fund',desc:'Long-term government schemes'},{icon:Zap,label:'Cryptocurrency',desc:'Purchase vs. current market value'},{icon:Building2,label:'Real Estate',desc:'Purchase price vs. current estimated value'},{icon:Coins,label:'Bond',desc:'Fixed income instruments with maturity value'}]},
      {heading:'Adding an Investment',type:'steps',items:['Click "Add Investment" and select the type','Enter name, amount invested, and purchase/start date','Enter current value or expected return — gain/loss calculated automatically','Set maturity date if applicable (FDR, DPS, Bonds)','Save — appears in portfolio summary immediately']},
      {heading:'Portfolio Summary Cards',type:'list',items:[{icon:DollarSign,label:'Total Invested',desc:'Sum of all capital deployed'},{icon:TrendingUp,label:'Current Value',desc:'Total current market or maturity value'},{icon:TrendingUp,label:'Total Returns',desc:'Gain/loss in Taka and percentage'},{icon:Coins,label:'Total Dividends',desc:'Income received from investments (if recorded)'}]},
      {heading:'Important Note',type:'callout',variant:'warning',content:'Investment values do NOT automatically update account balances. When you receive dividends or withdraw returns, record an Income transaction manually. Investment values are also NOT included in Zakat wealth — only account balances count.'},
      {heading:'Pro Tips',type:'tips',items:['Update Stocks and Crypto values regularly — prices change daily','Filter by Active to find upcoming FDR/DPS maturity dates','Sort by % Return to see your best and worst performers']},
    ]},

  { id:'zakat', icon:Star, color:'indigo', title:'Zakat', subtitle:'Automated Islamic obligation tracking',
    summary:'Fully automates the Hawl cycle — detecting when wealth crosses Nisab, tracking the full Hijri lunar year, calculating 2.5%, and storing complete payment history.',
    mockup:<ZakatMockup/>, mockupCaption:'The three Zakat status states: dark card (Not Mandatory), blue card (Monitoring Active with days remaining), red card (Zakat Due with 2.5% calculated and Record Payment button).',
    sections:[
      {heading:'Key Islamic Concepts',type:'list',items:[{icon:Coins,label:'Nisab',desc:'Minimum wealth threshold — 52.5 Tola (612.36g) of silver. Wealth must stay at or above this for one full Hijri year.'},{icon:Moon,label:'Hawl',desc:'One complete Hijri lunar year (~354 days) of continuous ownership above Nisab.'},{icon:Star,label:'Zakat Rate',desc:'2.5% of total eligible wealth, paid once per completed Hawl when both conditions are met.'}]},
      {heading:'Step 1 — Set Nisab Threshold',type:'steps',items:['Click "Settings" on the Zakat page','Choose price unit: per Gram or per Vori/Tola','Enter current market price of silver in Taka','Nisab is auto-calculated: price × 612.36g','Update whenever you check silver prices']},
      {heading:'The Automatic Hawl Cycle',type:'flow',items:[{label:'Nisab Crossed → Cycle Starts',desc:'System detects Total Wealth ≥ Nisab. Cycle start date recorded in both Hijri and Gregorian calendars.'},{label:'Monitoring Period (354 days)',desc:'Wealth can fluctuate freely — no Zakat is triggered mid-cycle regardless of temporary dips.'},{label:'Hawl Assessment at Year End',desc:'After exactly one Hijri year: wealth ≥ Nisab → Zakat Due (2.5%). Wealth below → cycle ends, no obligation.'},{label:'Payment and Auto-Renewal',desc:'Record payment (full or instalments). New cycle starts automatically if wealth still above Nisab.'}]},
      {heading:'The Three Status Cards',type:'callout',variant:'info',content:'Dark = Not Mandatory (below Nisab). Blue = Monitoring Active (shows days remaining and cycle start). Red = Zakat Due (shows 2.5% amount and Record Payment button). Status updates automatically.'},
      {heading:'Recording Payment',type:'steps',items:['When "Zakat Due", click "Record Payment"','Enter amount paid and date','Partial payments supported — each reduces outstanding amount','When fully paid, cycle closes — new one starts if still above Nisab','All cycles and payments stored in Cycle History permanently']},
      {heading:'Pro Tips',type:'tips',items:['Update silver price monthly for accurate Nisab','Total Zakat wealth = ALL account balances (Cash + Bank + bKash + Gold + Silver)','Consult a scholar about which assets are zakatable in your situation']},
    ]},

  { id:'jewellery', icon:Gem, color:'amber', title:'Jewellery Tracker', subtitle:'Gold & silver — Zakat value monitoring',
    summary:'Track every gold and silver jewellery piece — weight in Vori/Ana/Roti/Point, acquisition type (purchased/gifted/inherited), BAJUS market price snapshots, and automatic 15% deduction for Zakat valuation.',
    mockup:<JewelleryMockup/>, mockupCaption:'The Jewellery Tracker — amber "Add Jewellery" button, 4 summary cards (Zakat Value / Active Items / Gold weight / Silver weight), unpriced nudge banner, filter bar, then jewellery cards with karat badges, weight display, Zakat value, and Check Price / Sell / Edit / Delete actions.',
    sections:[
      {heading:'What the Jewellery Tracker Does',type:'text',content:'A dedicated module for tracking physical gold and silver jewellery. Unlike accounts (which hold Taka values), jewellery is tracked by weight — then market price snapshots calculate current value with automatic 15% deduction for making charges, giving you an accurate Zakat-eligible value.'},
      {heading:'Acquisition Types',type:'list',items:[{icon:ShoppingBag,label:'Purchased',desc:'You bought it — record the purchase price and the expense is automatically deducted from a chosen account'},{icon:Gift,label:'Gift',desc:'Received as a gift — track weight and value without any expense transaction'},{icon:FileText,label:'Inherited',desc:'Family inheritance — track weight for Zakat calculation'},{icon:Tag,label:'Other',desc:'Any other acquisition method'}]},
      {heading:'Weight System',type:'callout',variant:'info',content:'Weights are entered in the traditional Bangladeshi system: Vori · Ana · Roti · Point. The app automatically converts to grams (1 Vori = 11.664g) for calculations. Both are displayed on every card — e.g., "1 Vori 4 Ana · 16.18g".'},
      {heading:'Adding a Jewellery Item',type:'steps',items:['Click "Add Jewellery" and enter the item name (e.g., "Gold Necklace Set")','Select metal: Gold or Silver, then karat/purity (22K, 24K, 18K, Sterling, etc.)','Enter weight in Vori, Ana, Roti, and Point (fill in what applies)','Set acquisition type and date','For purchased items: enter purchase price and tick "Record as Expense" to deduct from an account','Optionally enter category (Necklace, Ring, Bangle, etc.) and notes','Save — item appears in the list, marked as "price not checked yet"']},
      {heading:'Checking & Updating Price (BAJUS Rate)',type:'steps',items:['Click "Check Price" (or "Update Price") on any item','The modal shows current market value per gram at different karats','Enter today\'s market rate — the system calculates full market value','A 15% deduction is automatically applied for making charges to get the Zakat-eligible value','Save the snapshot — price history is preserved; you can view all past snapshots','The Zakat Value on the card updates immediately']},
      {heading:'Selling Jewellery',type:'steps',items:['Click "Sell" on an active item','Enter the sale amount, which account receives the money, sale date, and notes','The account balance increases by the sale amount','If purchase price was recorded, the profit/loss is shown automatically','Item status changes to "Sold" and moves to the sold items view']},
      {heading:'Zakat Calculation',type:'callout',variant:'info',content:'The Jewellery page contributes to Zakat through the Zakat Tracker page. Total Jewellery Zakat Value (market value × 85%) is shown in the summary cards. This feeds into your overall wealth calculation — make sure to check prices regularly before Hawl assessment.'},
      {heading:'Pro Tips',type:'tips',items:['Check prices at least once before your Hawl year-end to get an accurate Zakat calculation','The "unpriced" nudge banner shows how many items still need a price check','Filter by Gold or Silver to see weights and values separately','Sold items are kept in history — filter by "Sold" to view them','Items with no price checked are excluded from Zakat total — keep prices updated']},
    ]},

  { id:'riba', icon:AlertTriangle, color:'yellow', title:'Riba Tracker', subtitle:'Track & purify interest income',
    summary:'The Riba Tracker automatically collects all interest income transactions and guides you to donate the equivalent as Sadaqah — purifying your wealth from what is impermissible in Islam.',
    mockup:<RibaMockup/>, mockupCaption:'The Riba Tracker page — amber Islamic context banner, 3 summary cards (Total Riba / Unpurified / Donated), red warning for pending purification, then transaction list split into "Pending Purification" (amber cards with Give Sadaqah button) and "Purified ✓" (green border with purification details).',
    sections:[
      {heading:'What is Riba?',type:'text',content:'Interest (Riba) is prohibited in Islam but embedded in the modern financial system — bank savings accounts, fixed deposits, bonds, and government schemes all generate it. When you receive Riba, the Islamic ruling is to not use it for personal benefit. Instead, donate it as Sadaqah to purify your wealth — not expecting any reward (Sawab) from Allah, purely to rid yourself of what is impermissible.'},
      {heading:'How Transactions Appear Here',type:'callout',variant:'info',content:'The Riba Tracker automatically finds two types of transactions: (1) any transaction flagged with "isRiba = true", and (2) any Income transaction recorded under a category whose name contains "Riba" or "Interest". Both types are pulled together into this page for tracking.'},
      {heading:'Recording Interest Income',type:'steps',items:['Go to Transactions → Add Transaction → Income tab','Set Category to "Interest / Riba" (or any category with "Riba" or "Interest" in the name)','Enter the amount received and the account it went into','Save — the transaction immediately appears in the Riba Tracker']},
      {heading:'Giving Sadaqah (Purification)',type:'steps',items:['Click "Give Sadaqah" on any unpurified Riba transaction','The Sadaqah modal shows the Riba source and amount','Enter how much you want to donate (defaults to full Riba amount — you may donate more or less)','Select the account to pay from','Set the donation date and an optional note (e.g., "Donated to masjid")','Click "Record Sadaqah" — an Expense transaction under "Sadaqah / Charity" category is created, the account deducts, and the Riba transaction is marked as purified']},
      {heading:'The Sadaqah Intention',type:'callout',variant:'warning',content:'Islamic scholars note: the intention when giving this Sadaqah is NOT to earn reward (Sawab) — it is purely to rid yourself of impermissible wealth. The app shows this reminder in the Sadaqah modal. You may donate it to any permissible cause — mosque, poor, charity.'},
      {heading:'Summary Cards Explained',type:'list',items:[{icon:AlertTriangle,label:'Total Riba Received',desc:'Lifetime sum of all interest transactions found — amber, for awareness'},{icon:TrendingDown,label:'Unpurified (Pending)',desc:'Amount still in your possession not yet donated — red, needs action'},{icon:CheckCircle2,label:'Donated as Sadaqah',desc:'Total purified through Sadaqah donations — green, completed'}]},
      {heading:'Pro Tips',type:'tips',items:['Purify Riba promptly — do not delay once you become aware of it','You can donate a different amount than the exact Riba received','The "Sadaqah / Charity" expense category is auto-created if it does not exist','All purified items are kept in history — scroll down to see them','Keep your Interest/Riba categories clearly named for automatic detection']},
    ]},

  { id:'analytics', icon:BarChart3, color:'blue', title:'Analytics', subtitle:'Visual financial insights',
    summary:'Transforms raw transactions into charts — income vs. expense comparisons, category breakdowns, and net saving trends over any time period.',
    mockup:<AnalyticsMockup/>, mockupCaption:'The Analytics page — time range tabs (Year selected), 3 summary cards, Income vs Expense bar chart for 6 months, and Category expense donut chart with legend.',
    sections:[
      {heading:'Time Range Options',type:'list',items:[{icon:Clock,label:'Week',desc:'Current week (Sat–Fri) — daily bar chart'},{icon:Calendar,label:'Month',desc:'Current calendar month'},{icon:TrendingUp,label:'Year',desc:'12 months side by side'},{icon:Filter,label:'Custom Range',desc:'Any start/end date — compare Ramadan vs. regular months etc.'}]},
      {heading:'Charts Available',type:'list',items:[{icon:BarChart3,label:'Income vs. Expense Bar Chart',desc:'Side-by-side green/red bars per period — shows which months you saved vs. overspent'},{icon:TrendingUp,label:'Net Savings Line',desc:'Income minus expenses over time — upward = saving'},{icon:Target,label:'Category Expense Pie',desc:'Percentage of total spending per category — find your biggest cost drivers'}]},
      {heading:'Using Analytics Effectively',type:'steps',items:['Start with Yearly view — are you net positive across the year?','Zoom into any month where you overspent','Open Category Pie — identify your largest expense category','Use insights to set realistic Budget limits']},
      {heading:'Transfers Always Excluded',type:'callout',variant:'info',content:'Transfers between your own accounts never appear in income or expense figures. Only real income (from outside) and real expenses (permanently leaving your control) are charted — keeping numbers truthful.'},
      {heading:'Pro Tips',type:'tips',items:['Analytics quality depends on consistent recording — log every transaction','Specific categories produce more actionable pie charts','Share the Yearly summary as a personal year-end financial review']},
    ]},

  { id:'recurring', icon:Repeat, color:'cyan', title:'Recurring Transactions', subtitle:'Automate fixed payments',
    summary:'Recurring auto-generates any fixed repeating payment — salary, rent, subscriptions, utility bills — so you never forget to record them.',
    mockup:<RecurringMockup/>, mockupCaption:'The Recurring page — status filter tabs, 4 entries with type icons, amounts coloured by type, MANUAL/PAUSED badges, next execution date, and pause/edit/delete buttons.',
    sections:[
      {heading:'Frequency Options',type:'list',items:[{icon:Calendar,label:'Daily',desc:'Every day — daily transport allowance'},{icon:Calendar,label:'Weekly',desc:'Chosen day — weekly pocket money'},{icon:Calendar,label:'Monthly',desc:'Chosen date — rent, salary, EMI'},{icon:Calendar,label:'Yearly',desc:'Annual — insurance, memberships'}]},
      {heading:'Creating a Recurring Transaction',type:'steps',items:['Click "Add Recurring" and name it clearly (e.g., "Monthly House Rent")','Choose type: Income or Expense, amount, account, category','Set frequency and specific day/date','Set start date — first execution shown immediately','Optionally set an end date for fixed-term EMIs','Choose: Auto (fires silently) or Manual Approval (you confirm each time)','Save — active from next due date']},
      {heading:'Auto vs. Manual Approval',type:'callout',variant:'info',content:'Auto executes silently on due date — ideal for fixed amounts like rent. Manual Approval creates a Pending entry you must approve or skip — ideal for variable bills like electricity.'},
      {heading:'Managing Entries',type:'list',items:[{icon:Clock,label:'Pause',desc:'Suspend without deleting — resumes from next due date'},{icon:RefreshCw,label:'Resume',desc:'Reactivate — next due date recalculates from today'},{icon:Edit2,label:'Edit',desc:'Change amount, account, category, or schedule'},{icon:Trash2,label:'Delete',desc:'Remove permanently — past transactions remain in history'}]},
      {heading:'Pro Tips',type:'tips',items:['Open the Recurring page weekly — it processes overdue entries on load','Pending count shows as a badge on the Recurring menu item','Set an end date for EMI recurrings so they stop automatically']},
    ]},

  { id:'tax', icon:FileText, color:'slate', title:'Tax File', subtitle:'Organise income for annual returns',
    summary:'Organises your income transactions by fiscal year, maps them to official tax heads, and gives you a structured summary ready for your annual income tax return.',
    mockup:<TaxMockup/>, mockupCaption:'The Tax Preparation page — dark gradient Current Income Year card with Create Tax Year button, then tax year cards showing status badge (Filed / In Progress), income head breakdown, and deadline countdown.',
    sections:[
      {heading:'Step 1 — Map Categories to Tax Heads',type:'steps',items:['Go to Tax → "Category Mappings"','Your Income categories appear — map each to an official tax head','Example: "Salary" → Salaries; "Freelance" → Business Income; "Rental" → House Property','Save — applies to all future tax year calculations']},
      {heading:'Step 2 — Create a Tax Year',type:'steps',items:['Click "Create Tax Year" — current fiscal year (July–June) pre-selected','System pulls all income transactions for mapped categories','Income grouped by tax head with totals','Countdown to November 30 filing deadline shown']},
      {heading:'Tax Year Statuses',type:'list',items:[{icon:Clock,label:'In Progress',desc:'Current fiscal year — income accumulating until June 30'},{icon:AlertCircle,label:'Due Soon',desc:'Less than 30 days to November 30 deadline'},{icon:CheckCircle2,label:'Filed',desc:'Marked as submitted — permanent historical record'},{icon:FileText,label:'Draft',desc:'Year created but not yet filed — data still accumulating'}]},
      {heading:'Bangladesh Fiscal Year',type:'callout',variant:'info',content:'Bangladesh income tax fiscal year runs July 1 to June 30. Filing deadline is November 30 of the same year. The app uses these dates automatically — no configuration needed.'},
      {heading:'Pro Tips',type:'tips',items:['Set up category mappings at the start of July — tracks automatically from that point','Only Income-type transactions feed Tax File — Expenses excluded','Unmapped income categories will not appear in totals — check mappings if figures seem low','Keep "Filed" years for reference — they are stored permanently']},
    ]},
];

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Mobile Accordion TOC ─────────────────────────────────────────────────────
function MobileTOC({ guides, activeId, search, setSearch, onSelect }) {
  const [open, setOpen] = useState(false);
  const activeGuide = guides.find(g => g.id === activeId);
  const ActiveIcon  = activeGuide?.icon || BookOpen;
  const ac          = C[activeGuide?.color] || C.blue;

  const filtered = search.trim()
    ? guides.filter(g =>
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.subtitle.toLowerCase().includes(search.toLowerCase()))
    : guides;

  const handleSelect = (id) => { onSelect(id); setOpen(false); };

  return (
    <div className="lg:hidden mb-4">
      {/* Trigger pill — shows active guide, tap to open */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 ${ac.border} ${ac.bg} shadow-sm transition-all active:scale-[0.99]`}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${ac.icon}`}>
          <ActiveIcon size={16} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-0.5">
            {open ? 'Select a guide' : 'Currently reading'}
          </div>
          <div className="text-sm font-bold text-gray-900 truncate">{activeGuide?.title}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-gray-400 hidden sm:inline">
            {guides.findIndex(g => g.id === activeId) + 1} / {guides.length}
          </span>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-white/60 border border-gray-200 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} className="text-gray-600" />
          </div>
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search guides…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50"
              />
            </div>
          </div>

          {/* Scrollable guide list */}
          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No guides match</p>
            )}
            {filtered.map(guide => {
              const Icon     = guide.icon;
              const gc       = C[guide.color] || C.blue;
              const isActive = guide.id === activeId && !search.trim();
              return (
                <button
                  key={guide.id}
                  onClick={() => handleSelect(guide.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0 transition-colors ${
                    isActive ? gc.active : 'hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/25' : gc.icon}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${isActive ? '' : 'text-gray-900'}`}>{guide.title}</div>
                    <div className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'opacity-75' : 'text-gray-400'}`}>{guide.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {guide.mockup && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/70' : 'bg-emerald-400'}`} />
                    )}
                    {isActive && <CheckCircle2 size={13} className="opacity-80" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-gray-400">green dot = live UI preview</span>
            </div>
            <span className="text-[10px] text-gray-400">{guides.length} guides</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Desktop sidebar (unchanged, hidden on mobile) ────────────────────────────
function DesktopSidebar({ guides, activeId, search, setSearch, onSelect }) {
  const filtered = search.trim()
    ? guides.filter(g =>
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        g.summary.toLowerCase().includes(search.toLowerCase()))
    : guides;

  return (
    <aside className="hidden lg:block lg:w-64 flex-shrink-0">
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search guides…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
        />
      </div>
      <nav className="space-y-0.5">
        {filtered.map(guide => {
          const Icon     = guide.icon;
          const gc       = C[guide.color] || C.blue;
          const isActive = activeId === guide.id && !search;
          return (
            <button
              key={guide.id}
              onClick={() => onSelect(guide.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                isActive ? `${gc.active} shadow-sm` : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/25' : gc.icon}`}>
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-semibold truncate ${isActive ? '' : 'text-gray-900'}`}>{guide.title}</div>
                <div className={`text-[10px] truncate leading-tight ${isActive ? 'opacity-75' : 'text-gray-400'}`}>{guide.subtitle}</div>
              </div>
              {guide.mockup && (
                <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/60' : 'bg-emerald-400'}`} />
              )}
            </button>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No guides match</p>}
      </nav>
      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-semibold text-gray-600">UI Preview Available</span>
        </div>
        <p className="text-[9px] text-gray-400 leading-relaxed">Guides with a green dot include a pixel-accurate mockup built from the real source code.</p>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-[10px] font-semibold text-gray-600 mb-1">{guides.length} total guides</p>
          <p className="text-[9px] text-gray-400">{guides.filter(g => g.mockup).length} with UI preview · {guides.length - guides.filter(g => g.mockup).length} text-only</p>
        </div>
      </div>
    </aside>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserGuidePage() {
  const [activeId, setActiveId] = useState('accounts');
  const [search,   setSearch]   = useState('');

  const activeGuide = GUIDES.find(g => g.id === activeId);
  const c = C[activeGuide?.color] || C.blue;

  const desktopFiltered = search.trim()
    ? GUIDES.filter(g =>
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        g.summary.toLowerCase().includes(search.toLowerCase()))
    : GUIDES;

  const selectGuide = (id) => {
    setActiveId(id);
    setSearch('');
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-10">

      {/* ── Page header ── */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight">User Guide</h1>
            <p className="text-xs lg:text-sm text-gray-500">
              Step-by-step workflows with live UI previews for all {GUIDES.length} features
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile accordion TOC (hidden on lg+) ── */}
      <MobileTOC
        guides={GUIDES}
        activeId={activeId}
        search={search}
        setSearch={setSearch}
        onSelect={selectGuide}
      />

      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Desktop sidebar (hidden on mobile) ── */}
        <DesktopSidebar
          guides={GUIDES}
          activeId={activeId}
          search={search}
          setSearch={setSearch}
          onSelect={selectGuide}
        />

        {/* ── Main content area ── */}
        <main className="flex-1 min-w-0">

          {/* Search results view */}
          {search.trim() ? (
            <div className="space-y-2.5">
              <p className="text-xs text-gray-400 mb-3">
                {desktopFiltered.length} guide{desktopFiltered.length !== 1 ? 's' : ''} found
              </p>
              {desktopFiltered.map(guide => {
                const Icon = guide.icon;
                const gc   = C[guide.color] || C.blue;
                return (
                  <button
                    key={guide.id}
                    onClick={() => selectGuide(guide.id)}
                    className={`w-full text-left p-4 rounded-xl border ${gc.border} ${gc.bg} hover:shadow-sm transition-all flex items-start gap-3`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${gc.icon}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{guide.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{guide.subtitle}</div>
                      <div className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">{guide.summary}</div>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 flex-shrink-0 mt-1" />
                  </button>
                );
              })}
            </div>

          ) : activeGuide ? (
            <div>

              {/* Guide header card */}
              <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-4 lg:p-5 mb-4`}>
                <div className="flex items-start gap-3 lg:gap-4">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
                    <activeGuide.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Feature Guide</div>
                    <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-0.5">{activeGuide.title}</h2>
                    <p className="text-sm text-gray-500 mb-2">{activeGuide.subtitle}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{activeGuide.summary}</p>
                  </div>
                </div>
              </div>

              {/* Live page preview mockup */}
              {activeGuide.mockup && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Page Preview</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  {activeGuide.mockup}
                  {activeGuide.mockupCaption && (
                    <p className="text-[11px] text-gray-400 mt-2 text-center italic leading-relaxed px-4">
                      {activeGuide.mockupCaption}
                    </p>
                  )}
                </div>
              )}

              {/* Collapsible sections */}
              <div className="space-y-2">
                {activeGuide.sections.map((section, i) => <GuideSection key={i} section={section} />)}
              </div>

              {/* Prev / Next navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                {(() => {
                  const idx  = GUIDES.findIndex(g => g.id === activeId);
                  const prev = GUIDES[idx - 1];
                  const next = GUIDES[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button
                          onClick={() => selectGuide(prev.id)}
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors min-w-0 max-w-[45%]"
                        >
                          <ChevronRight size={14} className="rotate-180 flex-shrink-0" />
                          <span className="truncate">{prev.title}</span>
                        </button>
                      ) : <div />}
                      {next ? (
                        <button
                          onClick={() => selectGuide(next.id)}
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors min-w-0 max-w-[45%]"
                        >
                          <span className="truncate">{next.title}</span>
                          <ChevronRight size={14} className="flex-shrink-0" />
                        </button>
                      ) : <div />}
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