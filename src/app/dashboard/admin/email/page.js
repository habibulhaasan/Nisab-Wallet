// src/app/dashboard/admin/email/page.js
'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { checkIsAdmin } from '@/lib/adminUtils';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, where, writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ToastContainer } from '@/components/ToastNotification';
import { useToast } from '@/hooks/useToast';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  Mail, Users, Send, FileText, BarChart2, Plus, Search, X, Save,
  Trash2, Edit2, Download, Upload, RefreshCw, CheckCircle, XCircle,
  Clock, ChevronDown, Eye, Reply, AlertCircle, Tag, Filter,
  ArrowLeft, Copy, Star, Inbox, Calendar, TrendingUp, Zap,
  MoreVertical, Circle, Check, User, Building2, BookOpen,
  MessageSquare, PenLine, LayoutTemplate, ChevronRight, Hash,
  MailOpen, MailX, AtSign, Globe, Phone, Layers,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard',  icon: BarChart2    },
  { id: 'contacts',  label: 'Contacts',   icon: Users        },
  { id: 'campaigns', label: 'Campaigns',  icon: Send         },
  { id: 'templates', label: 'Templates',  icon: LayoutTemplate },
];

const CONTACT_STATUSES = ['active', 'unsubscribed', 'bounced', 'blocked'];
const STATUS_COLORS = {
  active:       'bg-emerald-100 text-emerald-700 border-emerald-200',
  unsubscribed: 'bg-orange-100  text-orange-700  border-orange-200',
  bounced:      'bg-red-100     text-red-700     border-red-200',
  blocked:      'bg-gray-100    text-gray-600    border-gray-200',
};
const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'sent'];
const CAMPAIGN_STATUS_COLORS = {
  draft:     'bg-gray-100   text-gray-600   border-gray-200',
  scheduled: 'bg-blue-100   text-blue-700   border-blue-200',
  sent:      'bg-emerald-100 text-emerald-700 border-emerald-200',
};
const RECIPIENT_STATUSES = ['pending', 'sent', 'opened', 'replied', 'bounced'];
const RECIPIENT_STATUS_COLORS = {
  pending: 'bg-gray-100   text-gray-500',
  sent:    'bg-blue-100   text-blue-700',
  opened:  'bg-emerald-100 text-emerald-700',
  replied: 'bg-violet-100 text-violet-700',
  bounced: 'bg-red-100    text-red-700',
};
const TEMPLATE_CATEGORIES = ['Onboarding', 'Renewal Reminder', 'Zakat Reminder', 'Promotional', 'Re-engagement', 'General'];
const DEFAULT_TAGS = ['trial-user', 'paid', 'expired', 'registered', 'lead', 'vip'];

// ─── Reusable UI ──────────────────────────────────────────────────────────────
function StatusBadge({ label, color = 'gray' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${color}`}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const colors = {
    blue:    'bg-blue-50   border-blue-200   text-blue-700',
    green:   'bg-emerald-50 border-emerald-200 text-emerald-700',
    orange:  'bg-orange-50  border-orange-200  text-orange-700',
    violet:  'bg-violet-50  border-violet-200  text-violet-700',
    red:     'bg-red-50     border-red-200     text-red-700',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 font-medium mb-0.5">{label}</div>
        <div className="text-2xl font-extrabold text-gray-900">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
        {trend !== undefined && (
          <div className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <div className="text-base font-bold text-gray-700 mb-1">{title}</div>
      <div className="text-sm text-gray-500 mb-5 max-w-xs">{desc}</div>
      {action}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

// ─── Tag pill ─────────────────────────────────────────────────────────────────
function TagPill({ tag, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
      {tag}
      {onRemove && (
        <button onClick={() => onRemove(tag)} className="hover:text-blue-900">
          <X size={10} />
        </button>
      )}
    </span>
  );
}

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');
  const add = (val) => {
    const t = val.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(t => <TagPill key={t} tag={t} onRemove={tag => onChange(tags.filter(x => x !== tag))} />)}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }}}
          placeholder="Type tag and press Enter…"
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={() => add(input)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {DEFAULT_TAGS.filter(t => !tags.includes(t)).map(t => (
          <button key={t} onClick={() => onChange([...tags, t])}
            className="px-2 py-0.5 border border-dashed border-gray-300 text-gray-500 rounded-full text-[10px] hover:border-blue-400 hover:text-blue-600 transition-colors">
            + {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function DashboardTab({ contacts, campaigns, recipients }) {
  const totalContacts   = contacts.length;
  const activeContacts  = contacts.filter(c => c.status === 'active').length;
  const totalCampaigns  = campaigns.length;
  const sentCampaigns   = campaigns.filter(c => c.status === 'sent').length;

  const allRecipients   = Object.values(recipients).flat();
  const totalSent       = allRecipients.filter(r => ['sent','opened','replied'].includes(r.status)).length;
  const totalOpened     = allRecipients.filter(r => r.status === 'opened').length;
  const totalReplied    = allRecipients.filter(r => r.status === 'replied').length;
  const totalBounced    = allRecipients.filter(r => r.status === 'bounced').length;

  const openRate   = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const replyRate  = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;
  const bounceRate = totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0;

  // Tag distribution
  const tagMap = {};
  contacts.forEach(c => (c.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; }));
  const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Recent campaigns
  const recentCampaigns = [...campaigns]
    .sort((a, b) => (b.sentAt?.toDate?.() || b.createdAt?.toDate?.() || 0) - (a.sentAt?.toDate?.() || a.createdAt?.toDate?.() || 0))
    .slice(0, 5);

  const fmt = (ts) => ts?.toDate ? ts.toDate().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—';

  return (
    <div className="space-y-7">
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Total Contacts"  value={totalContacts.toLocaleString()}  sub={`${activeContacts} active`}            color="blue"   />
        <StatCard icon={Send}       label="Campaigns Sent"  value={sentCampaigns}                   sub={`${totalCampaigns} total`}             color="green"  />
        <StatCard icon={MailOpen}   label="Open Rate"       value={`${openRate}%`}                  sub={`${totalOpened} opens`}                color="violet" />
        <StatCard icon={Reply}      label="Reply Rate"      value={`${replyRate}%`}                 sub={`${totalReplied} replies`}             color="orange" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Email funnel */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-5 flex items-center gap-2">
            <TrendingUp size={15} className="text-blue-600" /> Email Funnel
          </h3>
          {[
            { label: 'Emails Sent',   val: totalSent,    color: 'bg-blue-500',    pct: 100 },
            { label: 'Opened',        val: totalOpened,  color: 'bg-violet-500',  pct: totalSent > 0 ? Math.round(totalOpened/totalSent*100) : 0 },
            { label: 'Replied',       val: totalReplied, color: 'bg-emerald-500', pct: totalSent > 0 ? Math.round(totalReplied/totalSent*100) : 0 },
            { label: 'Bounced',       val: totalBounced, color: 'bg-red-400',     pct: totalSent > 0 ? Math.round(totalBounced/totalSent*100) : 0 },
          ].map(row => (
            <div key={row.label} className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">{row.label}</span>
                <span className="text-xs font-bold text-gray-900">{row.val} <span className="text-gray-400 font-normal">({row.pct}%)</span></span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${row.color} transition-all duration-700`} style={{ width: `${row.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent campaigns */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Clock size={15} className="text-blue-600" /> Recent Campaigns
          </h3>
          {recentCampaigns.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8">No campaigns yet</div>
          ) : (
            <div className="space-y-2">
              {recentCampaigns.map(c => {
                const recs = recipients[c.id] || [];
                const sent = recs.filter(r => ['sent','opened','replied'].includes(r.status)).length;
                const opened = recs.filter(r => r.status === 'opened').length;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'sent' ? 'bg-emerald-500' : c.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 truncate">{c.subject}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <StatusBadge label={c.status} color={CAMPAIGN_STATUS_COLORS[c.status]} />
                      {c.status === 'sent' && (
                        <div className="text-[10px] text-gray-400 mt-0.5">{sent} sent · {opened} opened</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0 w-20 text-right">{fmt(c.sentAt || c.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tag distribution */}
      {topTags.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Tag size={15} className="text-blue-600" /> Contact Segments
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topTags.map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <div className="text-xs font-bold text-blue-800 capitalize">{tag}</div>
                  <div className="text-[10px] text-blue-500">{count} contact{count !== 1 ? 's' : ''}</div>
                </div>
                <div className="text-xl font-black text-blue-200">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — CONTACTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Status cycle order for one-click toggle ───────────────────────────────────
const STATUS_CYCLE = { active: 'unsubscribed', unsubscribed: 'active', bounced: 'blocked', blocked: 'active' };

const STATUS_META = {
  active:       { icon: CheckCircle, bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500', label: 'Active'       },
  unsubscribed: { icon: XCircle,     bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-300',  dot: 'bg-orange-500',  label: 'Unsubscribed' },
  bounced:      { icon: AlertCircle, bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-300',     dot: 'bg-red-500',     label: 'Bounced'      },
  blocked:      { icon: XCircle,     bg: 'bg-gray-100',    text: 'text-gray-600',    border: 'border-gray-300',    dot: 'bg-gray-400',    label: 'Blocked'      },
};

const GRAD = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-blue-500',
];

// ── Contact Detail Modal ──────────────────────────────────────────────────────
function ContactDetailModal({ contact, campaigns, recipients, onClose, onEdit, onDelete, onStatusChange }) {
  const sm = STATUS_META[contact.status] || STATUS_META.active;
  const StatusIcon = sm.icon;
  const gradIdx = contact.name?.charCodeAt(0) % GRAD.length || 0;

  // Campaign history for this contact
  const history = campaigns.map(c => {
    const rec = (recipients[c.id] || []).find(r => r.contactId === contact.id);
    return rec ? { campaign: c, rec } : null;
  }).filter(Boolean);

  const fmt = (ts) => ts?.toDate ? ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const nextStatus = STATUS_CYCLE[contact.status] || 'active';
  const nextMeta = STATUS_META[nextStatus];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`relative px-6 pt-6 pb-5 bg-gradient-to-br ${GRAD[gradIdx]} rounded-t-2xl`}>
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors">
            <X size={16}/>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
              {contact.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">{contact.name}</h2>
              <div className="text-white/80 text-sm flex items-center gap-1.5 mt-0.5">
                <AtSign size={12}/>{contact.email}
              </div>
              {contact.company && (
                <div className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                  <Building2 size={11}/>{contact.company}
                </div>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30`}>
              <StatusIcon size={11}/> {sm.label}
            </span>
            {(contact.tags || []).map(t => (
              <span key={t} className="px-2 py-0.5 bg-white/15 text-white/90 rounded-full text-[10px] font-semibold border border-white/20">{t}</span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => onStatusChange(contact, nextStatus)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 ${nextMeta.border} ${nextMeta.bg} ${nextMeta.text} hover:opacity-80 transition-opacity`}>
              <nextMeta.icon size={16}/>
              <span className="text-[10px] font-bold">→ {nextMeta.label}</span>
            </button>
            <button onClick={() => onEdit(contact)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 hover:opacity-80 transition-opacity">
              <Edit2 size={16}/>
              <span className="text-[10px] font-bold">Edit</span>
            </button>
            <button onClick={() => { onDelete(contact); onClose(); }}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 hover:opacity-80 transition-opacity">
              <Trash2 size={16}/>
              <span className="text-[10px] font-bold">Delete</span>
            </button>
          </div>

          {/* Contact details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Contact Info</h4>
            {[
              { icon: Mail,     label: 'Email',   val: contact.email,   href: `mailto:${contact.email}` },
              { icon: Phone,    label: 'Phone',   val: contact.phone    || '—', href: contact.phone ? `tel:${contact.phone}` : null },
              { icon: Building2,label: 'Company', val: contact.company  || '—', href: null },
              { icon: Globe,    label: 'Source',  val: contact.source   || 'manual', href: null },
              { icon: Calendar, label: 'Added',   val: fmt(contact.createdAt), href: null },
            ].map(({ icon: Icon, label, val, href }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-6 flex-shrink-0 flex justify-center"><Icon size={13} className="text-gray-400"/></div>
                <span className="text-xs text-gray-500 w-14 flex-shrink-0">{label}</span>
                {href
                  ? <a href={href} className="text-xs text-blue-600 hover:underline font-medium truncate">{val}</a>
                  : <span className="text-xs text-gray-800 font-medium truncate">{val}</span>
                }
              </div>
            ))}
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1.5"><MessageSquare size={11}/>Notes</h4>
              <p className="text-xs text-amber-900 leading-relaxed">{contact.notes}</p>
            </div>
          )}

          {/* Campaign history */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Send size={11}/> Campaign History ({history.length})
            </h4>
            {history.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">
                Not included in any campaign yet
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(({ campaign: c, rec }) => {
                  const rm = RECIPIENT_STATUS_COLORS[rec.status] || '';
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">{c.name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{c.subject}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rm}`}>{rec.status}</span>
                      <span className="text-[10px] text-gray-400">{fmt(rec.updatedAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Contact Card ──────────────────────────────────────────────────────────────
function ContactCard({ contact, onStatusChange, onClick }) {
  const sm = STATUS_META[contact.status] || STATUS_META.active;
  const StatusIcon = sm.icon;
  const gradIdx = contact.name?.charCodeAt(0) % GRAD.length || 0;
  const nextStatus = STATUS_CYCLE[contact.status] || 'active';
  const nextMeta   = STATUS_META[nextStatus];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">

      {/* Top row */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${GRAD[gradIdx]} flex items-center justify-center text-white font-black text-lg flex-shrink-0`}>
          {contact.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{contact.name}</div>
          <div className="text-xs text-gray-500 truncate">{contact.email}</div>
          {contact.company && <div className="text-[10px] text-gray-400 truncate">{contact.company}</div>}
        </div>
        {/* Current status */}
        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sm.bg} ${sm.text} ${sm.border}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${sm.dot}`}/>
          {sm.label}
        </span>
      </div>

      {/* Tags */}
      {(contact.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(contact.tags || []).slice(0, 3).map(t => (
            <span key={t} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-semibold border border-blue-100">{t}</span>
          ))}
          {(contact.tags || []).length > 3 && (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[9px]">+{contact.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* One-click status toggle */}
      <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
        <button
          onClick={e => { e.stopPropagation(); onStatusChange(contact, nextStatus); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold border-2 ${nextMeta.border} ${nextMeta.bg} ${nextMeta.text} hover:opacity-80 transition-all`}>
          <nextMeta.icon size={11}/>
          → {nextMeta.label}
        </button>
        <div className="text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0">
          <ChevronRight size={10}/> Details
        </div>
      </div>
    </div>
  );
}

function ContactForm({ initial, onSave, onClose, registeredUsers }) {
  const [form, setForm] = useState({
    name:    initial?.name    || '',
    email:   initial?.email   || '',
    phone:   initial?.phone   || '',
    company: initial?.company || '',
    status:  initial?.status  || 'active',
    tags:    initial?.tags    || [],
    notes:   initial?.notes   || '',
    source:  initial?.source  || 'manual',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [importFromUser, setImportFromUser] = useState(false);

  const handleUserSelect = (uid) => {
    const u = registeredUsers.find(u => u.id === uid);
    if (u) {
      set('name', u.displayName || u.name || '');
      set('email', u.email || '');
      set('source', 'registered');
      if (!form.tags.includes('registered')) set('tags', [...form.tags, 'registered']);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <User size={16} className="text-blue-600"/>
            {initial ? 'Edit Contact' : 'Add Contact'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          {!initial && registeredUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <button onClick={() => setImportFromUser(!importFromUser)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-700 w-full">
                <Users size={14}/> Import from Registered User
                <ChevronDown size={13} className={`ml-auto transition-transform ${importFromUser ? 'rotate-180' : ''}`}/>
              </button>
              {importFromUser && (
                <select onChange={e => handleUserSelect(e.target.value)} defaultValue=""
                  className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="" disabled>— Select a user —</option>
                  {registeredUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.displayName || u.name || u.email} ({u.email})</option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ahmed Al-Rashid"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Email *</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+880 1XXX-XXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Company / Org</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CONTACT_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['manual','registered','csv-import','landing-page','referral'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Tags / Segments</label>
            <TagInput tags={form.tags} onChange={v => set('tags', v)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              placeholder="Internal notes about this contact…"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.email.trim()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            <Save size={14}/> {initial ? 'Update' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactsTab({ contacts, campaigns, recipients, loading, onAdd, onStatusChange, onDelete, onBulkDelete, onImportCSV, onExportCSV, registeredUsers }) {
  const [search, setSearch]           = useState('');
  const [filterTag, setFilterTag]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected]       = useState(new Set());
  const [showForm, setShowForm]       = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [detailItem, setDetailItem]   = useState(null);
  const fileRef = useRef();

  const allTags = useMemo(() => {
    const s = new Set();
    contacts.forEach(c => (c.tags || []).forEach(t => s.add(t)));
    return ['all', ...Array.from(s).sort()];
  }, [contacts]);

  const filtered = useMemo(() => contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q);
    const matchTag    = filterTag === 'all' || (c.tags || []).includes(filterTag);
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchTag && matchStatus;
  }), [contacts, search, filterTag, filterStatus]);

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {allTags.map(t => <option key={t} value={t}>{t === 'all' ? 'All Tags' : t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          {CONTACT_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
            <Download size={14}/> Export
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
            <Upload size={14}/> CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => { onImportCSV(e.target.files[0]); e.target.value = ''; }}/>
          <button onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            <Plus size={14}/> Add
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', ...CONTACT_STATUSES].map(s => {
          const count = s === 'all' ? contacts.length : contacts.filter(c => c.status === s).length;
          const meta  = s === 'all' ? null : STATUS_META[s];
          return (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filterStatus === s
                  ? (meta ? `${meta.bg} ${meta.text} ${meta.border}` : 'bg-gray-900 text-white border-gray-900')
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>
              {meta && <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}/>}
              <span className="capitalize">{s === 'all' ? 'All' : s}</span>
              <span className={`text-[10px] ${filterStatus === s ? 'opacity-70' : 'text-gray-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl mb-4">
          <span className="text-sm font-semibold text-blue-800">{selected.size} selected</span>
          <button onClick={() => onBulkDelete([...selected], () => setSelected(new Set()))}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">
            <Trash2 size={12}/> Delete Selected
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-blue-600 hover:text-blue-800">Clear</button>
        </div>
      )}

      {/* Cards grid */}
      {loading ? <Spinner/> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No contacts found"
          desc="Add contacts manually, import a CSV, or pull from registered users."
          action={
            <button onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
              <Plus size={14}/> Add First Contact
            </button>
          }
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="relative">
                {/* Select checkbox */}
                <div className="absolute top-3 left-3 z-10" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}
                    className="w-3.5 h-3.5 rounded accent-blue-600"/>
                </div>
                <ContactCard
                  contact={c}
                  onStatusChange={onStatusChange}
                  onClick={() => setDetailItem(c)}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-400 text-center">
            Showing {filtered.length} of {contacts.length} contacts
          </div>
        </>
      )}

      {/* Detail modal */}
      {detailItem && (
        <ContactDetailModal
          contact={contacts.find(c => c.id === detailItem.id) || detailItem}
          campaigns={campaigns}
          recipients={recipients}
          onClose={() => setDetailItem(null)}
          onEdit={(c) => { setDetailItem(null); setEditItem(c); setShowForm(true); }}
          onDelete={(c) => { setDetailItem(null); onDelete(c); }}
          onStatusChange={(c, st) => { onStatusChange(c, st); setDetailItem(prev => prev?.id === c.id ? {...prev, status: st} : prev); }}
        />
      )}

      {/* Add / Edit form */}
      {showForm && (
        <ContactForm
          initial={editItem}
          registeredUsers={registeredUsers}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={form => { onAdd(form, editItem?.id); setShowForm(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — CAMPAIGNS
// ══════════════════════════════════════════════════════════════════════════════
function CampaignForm({ initial, contacts, templates, onSave, onClose }) {
  const [form, setForm] = useState({
    name:       initial?.name       || '',
    subject:    initial?.subject    || '',
    body:       initial?.body       || '',
    segment:    initial?.segment    || 'all',
    status:     initial?.status     || 'draft',
    scheduledAt: initial?.scheduledAt || '',
    notes:      initial?.notes      || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const allTags = useMemo(() => {
    const s = new Set();
    contacts.forEach(c => (c.tags || []).forEach(t => s.add(t)));
    return ['all', ...Array.from(s).sort()];
  }, [contacts]);

  const recipientCount = useMemo(() => {
    if (form.segment === 'all') return contacts.filter(c => c.status === 'active').length;
    return contacts.filter(c => c.status === 'active' && (c.tags || []).includes(form.segment)).length;
  }, [contacts, form.segment]);

  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Send size={16} className="text-blue-600" />
            {initial ? 'Edit Campaign' : 'New Campaign'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Load template */}
          {templates.length > 0 && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
              <button onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 text-sm font-semibold text-violet-700 w-full">
                <LayoutTemplate size={14} /> Load from Template
                <ChevronDown size={13} className={`ml-auto transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </button>
              {showTemplates && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {templates.map(t => (
                    <button key={t.id} onClick={() => { set('subject', t.subject); set('body', t.body); setShowTemplates(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-violet-100 transition-colors">
                      <div className="text-xs font-bold text-violet-900">{t.name}</div>
                      <div className="text-[11px] text-violet-600 truncate">{t.subject}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Campaign Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. March Renewal Reminder"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email Subject *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)}
              placeholder="e.g. Your Nisab Wallet subscription is expiring soon"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email Body / Notes</label>
            <textarea value={form.body} onChange={e => set('body', e.target.value)}
              rows={6} placeholder="Write your email content here. You can paste the final email body or keep brief notes."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Target Segment</label>
              <select value={form.segment} onChange={e => set('segment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {allTags.map(t => <option key={t} value={t}>{t === 'all' ? 'All Active Contacts' : t}</option>)}
              </select>
              <div className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                <Users size={10} /> {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} will be targeted
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CAMPAIGN_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>

          {form.status === 'scheduled' && (
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Scheduled Date</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Internal Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Private notes (not sent to recipients)"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => onSave({ ...form, recipientCount })}
            disabled={!form.name.trim() || !form.subject.trim()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            <Save size={14} /> {initial ? 'Update Campaign' : 'Save Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignDetail({ campaign, contacts, recipients, onClose, onUpdateRecipient, onMarkSent }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const recs = recipients[campaign.id] || [];
  const filtered = recs.filter(r => {
    const c = contacts.find(x => x.id === r.contactId);
    const q = search.toLowerCase();
    const matchSearch = !q || c?.name?.toLowerCase().includes(q) || c?.email?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:   recs.length,
    sent:    recs.filter(r => ['sent','opened','replied'].includes(r.status)).length,
    opened:  recs.filter(r => r.status === 'opened').length,
    replied: recs.filter(r => r.status === 'replied').length,
    bounced: recs.filter(r => r.status === 'bounced').length,
  };

  const fmt = (ts) => ts?.toDate ? ts.toDate().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Send size={16} className="text-blue-600" /> {campaign.name}
            </h3>
            <div className="text-xs text-gray-500 mt-0.5">{campaign.subject}</div>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status !== 'sent' && (
              <button onClick={() => onMarkSent(campaign)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700">
                <CheckCircle size={12} /> Mark as Sent
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={18} /></button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          {[
            { label: 'Recipients', val: stats.total,   color: 'text-gray-800' },
            { label: 'Sent',       val: stats.sent,    color: 'text-blue-700' },
            { label: 'Opened',     val: stats.opened,  color: 'text-emerald-700' },
            { label: 'Replied',    val: stats.replied, color: 'text-violet-700' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recipients…"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="all">All Status</option>
            {RECIPIENT_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>

        {/* Recipients table */}
        <div className="overflow-y-auto flex-1 px-6 py-3">
          {recs.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-10">
              No recipients yet. Recipients are auto-created when you mark the campaign as Sent.
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-10">No results for this filter.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(r => {
                const c = contacts.find(x => x.id === r.contactId);
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {(c?.name || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{c?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{c?.email}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {RECIPIENT_STATUSES.filter(s => s !== 'pending').map(s => (
                        <button key={s} onClick={() => onUpdateRecipient(campaign.id, r.id, s)}
                          title={`Mark as ${s}`}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            r.status === s
                              ? RECIPIENT_STATUS_COLORS[s] + ' border-current shadow-sm'
                              : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] text-gray-400 flex-shrink-0 w-16 text-right">{fmt(r.updatedAt)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignsTab({ campaigns, contacts, recipients, loading, onAdd, onEdit, onDelete, onMarkSent, onUpdateRecipient, templates }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = campaigns.filter(c => filterStatus === 'all' || c.status === filterStatus);
  const fmt = (ts) => ts?.toDate ? ts.toDate().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
          {['all', ...CAMPAIGN_STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {s === 'all' ? 'All' : s}
              <span className="ml-1 text-[10px] text-gray-400">
                ({s === 'all' ? campaigns.length : campaigns.filter(c => c.status === s).length})
              </span>
            </button>
          ))}
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="ml-auto flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon={Send} title="No campaigns yet"
          desc="Create your first email campaign to get started."
          action={<button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2"><Plus size={14}/>Create Campaign</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const recs = recipients[c.id] || [];
            const sent    = recs.filter(r => ['sent','opened','replied'].includes(r.status)).length;
            const opened  = recs.filter(r => r.status === 'opened').length;
            const openRate = sent > 0 ? Math.round(opened / sent * 100) : 0;
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    c.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                    c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {c.status === 'sent' ? <CheckCircle size={18}/> : c.status === 'scheduled' ? <Clock size={18}/> : <PenLine size={18}/>}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetailItem(c)}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900">{c.name}</span>
                      <StatusBadge label={c.status} color={CAMPAIGN_STATUS_COLORS[c.status]} />
                      {c.segment && c.segment !== 'all' && <TagPill tag={c.segment} />}
                    </div>
                    <div className="text-sm text-gray-600 mb-2 truncate">📧 {c.subject}</div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users size={11}/> {c.recipientCount || 0} recipients</span>
                      {c.status === 'sent' && <>
                        <span className="flex items-center gap-1 text-blue-600"><Send size={11}/> {sent} sent</span>
                        <span className="flex items-center gap-1 text-emerald-600"><MailOpen size={11}/> {opened} opened ({openRate}%)</span>
                      </>}
                      {c.sentAt && <span className="flex items-center gap-1"><Calendar size={11}/> Sent {fmt(c.sentAt)}</span>}
                      {c.scheduledAt && c.status === 'scheduled' && <span className="flex items-center gap-1 text-blue-600"><Calendar size={11}/> Scheduled {c.scheduledAt}</span>}
                      <span className="flex items-center gap-1"><Clock size={11}/> Created {fmt(c.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {c.status !== 'sent' && (
                      <button onClick={() => onMarkSent(c)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100">
                        <CheckCircle size={11}/> Mark Sent
                      </button>
                    )}
                    <button onClick={() => { setEditItem(c); setShowForm(true); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={13}/>
                    </button>
                    <button onClick={() => onDelete(c)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <CampaignForm
          initial={editItem}
          contacts={contacts}
          templates={templates}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={form => { onAdd(form, editItem?.id); setShowForm(false); setEditItem(null); }}
        />
      )}
      {detailItem && (
        <CampaignDetail
          campaign={detailItem}
          contacts={contacts}
          recipients={recipients}
          onClose={() => setDetailItem(null)}
          onMarkSent={onMarkSent}
          onUpdateRecipient={onUpdateRecipient}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════
function TemplateForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name:     initial?.name     || '',
    category: initial?.category || 'General',
    subject:  initial?.subject  || '',
    body:     initial?.body     || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <LayoutTemplate size={16} className="text-violet-600" />
            {initial ? 'Edit Template' : 'New Template'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Template Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Renewal Reminder v1"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                {TEMPLATE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Subject Line *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)}
              placeholder="e.g. Your Nisab Wallet trial is ending — here's what to do next"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email Body *</label>
            <textarea value={form.body} onChange={e => set('body', e.target.value)}
              rows={12} placeholder="Write your full email template here. Use {name}, {email} as placeholders."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono" />
            <div className="text-[11px] text-gray-400 mt-1">
              Tip: Use placeholders like <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{email}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{plan}}'}</code>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(form)}
            disabled={!form.name.trim() || !form.subject.trim() || !form.body.trim()}
            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            <Save size={14} /> {initial ? 'Update Template' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatesTab({ templates, loading, onAdd, onEdit, onDelete, onCopy }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [preview, setPreview] = useState(null);
  const [filterCat, setFilterCat] = useState('all');

  const cats = ['all', ...TEMPLATE_CATEGORIES];
  const filtered = templates.filter(t => filterCat === 'all' || t.category === filterCat);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterCat === c ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{c}</button>
          ))}
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="ml-auto flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700">
          <Plus size={14} /> New Template
        </button>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="No templates yet"
          desc="Save reusable email templates to speed up campaign creation."
          action={<button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 flex items-center gap-2"><Plus size={14}/>Create Template</button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-sm transition-all flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-gray-900">{t.name}</div>
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200 mt-1 inline-block">{t.category}</span>
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-700 mb-1 truncate">📧 {t.subject}</div>
              <div className="text-xs text-gray-500 line-clamp-3 flex-1 mb-4 leading-relaxed whitespace-pre-line">{t.body}</div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => setPreview(t)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50">
                  <Eye size={12}/> Preview
                </button>
                <button onClick={() => onCopy(t)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-violet-200 text-violet-700 rounded-lg text-xs font-medium hover:bg-violet-50">
                  <Copy size={12}/> Copy
                </button>
                <button onClick={() => { setEditItem(t); setShowForm(true); }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 size={13}/>
                </button>
                <button onClick={() => onDelete(t)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
              <div>
                <div className="text-xs text-gray-500 font-semibold mb-0.5">TEMPLATE PREVIEW</div>
                <div className="font-bold text-gray-900">{preview.name}</div>
              </div>
              <button onClick={() => setPreview(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"><X size={18}/></button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                <span className="text-xs text-gray-500 font-semibold">Subject: </span>
                <span className="text-sm font-semibold text-gray-900">{preview.subject}</span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white border border-gray-200 rounded-xl p-4 font-mono">
                {preview.body}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { onCopy(preview); setPreview(null); }}
                className="flex-1 py-2.5 border border-violet-200 text-violet-700 rounded-xl text-sm font-bold hover:bg-violet-50 flex items-center justify-center gap-2">
                <Copy size={14}/> Copy Body
              </button>
              <button onClick={() => setPreview(null)}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <TemplateForm
          initial={editItem}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={form => { onAdd(form, editItem?.id); setShowForm(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminEmailPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [tab, setTab]               = useState('dashboard');
  const [contacts, setContacts]     = useState([]);
  const [campaigns, setCampaigns]   = useState([]);
  const [templates, setTemplates]   = useState([]);
  const [recipients, setRecipients] = useState({}); // { [campaignId]: [recipient] }
  const [regUsers, setRegUsers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    checkIsAdmin(user.uid).then(ok => {
      if (!ok) { addToast('Access denied.', 'error'); router.push('/dashboard'); }
      else loadAll();
    });
  }, [user]);

  // ── Load all data ──────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [contactsSnap, campaignsSnap, templatesSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'emailContacts'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'emailCampaigns'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'emailTemplates'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'users')),
      ]);

      setContacts(contactsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const cams = campaignsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCampaigns(cams);
      setTemplates(templatesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setRegUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Load recipients for all campaigns
      const recMap = {};
      await Promise.all(cams.map(async c => {
        const snap = await getDocs(collection(db, 'emailCampaigns', c.id, 'recipients'));
        recMap[c.id] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }));
      setRecipients(recMap);
    } catch (err) {
      addToast('Error loading data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── CONTACTS CRUD ──────────────────────────────────────────────────────────
  const saveContact = async (form, existingId) => {
    try {
      const data = { ...form, updatedAt: serverTimestamp() };
      if (existingId) {
        await updateDoc(doc(db, 'emailContacts', existingId), data);
        setContacts(cs => cs.map(c => c.id === existingId ? { ...c, ...data } : c));
        addToast('Contact updated', 'success');
      } else {
        data.createdAt = serverTimestamp();
        const ref = await addDoc(collection(db, 'emailContacts'), data);
        setContacts(cs => [{ id: ref.id, ...data }, ...cs]);
        addToast('Contact added', 'success');
      }
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  const deleteContact = (c) => {
    setConfirmDialog({
      isOpen: true, type: 'danger',
      title: 'Delete Contact',
      message: `Delete ${c.name} (${c.email})? This cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await deleteDoc(doc(db, 'emailContacts', c.id));
        setContacts(cs => cs.filter(x => x.id !== c.id));
        addToast('Contact deleted', 'success');
      },
    });
  };

  const bulkDeleteContacts = (ids, onDone) => {
    setConfirmDialog({
      isOpen: true, type: 'danger',
      title: `Delete ${ids.length} Contacts`,
      message: 'This will permanently delete all selected contacts.',
      confirmText: 'Delete All',
      onConfirm: async () => {
        const batch = writeBatch(db);
        ids.forEach(id => batch.delete(doc(db, 'emailContacts', id)));
        await batch.commit();
        setContacts(cs => cs.filter(c => !ids.includes(c.id)));
        addToast(`${ids.length} contacts deleted`, 'success');
        onDone();
      },
    });
  };

  // ── Quick status change ───────────────────────────────────────────────────
  const changeContactStatus = async (contact, newStatus) => {
    try {
      await updateDoc(doc(db, 'emailContacts', contact.id), { status: newStatus, updatedAt: serverTimestamp() });
      setContacts(cs => cs.map(c => c.id === contact.id ? { ...c, status: newStatus } : c));
      addToast(`${contact.name} → ${newStatus}`, 'success');
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  // ── CSV Import ─────────────────────────────────────────────────────────────
  const importCSV = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        let added = 0;
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
          const email = row.email || row['e-mail'] || row['email address'] || '';
          if (!email || !email.includes('@')) continue;
          const data = {
            name:      row.name || row['full name'] || row['first name'] || email.split('@')[0],
            email:     email.toLowerCase(),
            phone:     row.phone || row['phone number'] || '',
            company:   row.company || row.organisation || row.organization || '',
            tags:      row.tags ? row.tags.split(';').map(t => t.trim().toLowerCase()) : [],
            status:    'active',
            source:    'csv-import',
            notes:     row.notes || '',
            createdAt: serverTimestamp(),
          };
          const ref = await addDoc(collection(db, 'emailContacts'), data);
          setContacts(cs => [...cs, { id: ref.id, ...data }]);
          added++;
        }
        addToast(`Imported ${added} contacts from CSV`, 'success');
      } catch (err) { addToast('CSV import failed: ' + err.message, 'error'); }
    };
    reader.readAsText(file);
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Tags', 'Source', 'Notes'];
    const rows = contacts.map(c => [
      c.name || '', c.email || '', c.phone || '', c.company || '',
      c.status || '', (c.tags || []).join(';'), c.source || '', c.notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nisab-wallet-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    addToast(`Exported ${contacts.length} contacts`, 'success');
  };

  // ── CAMPAIGNS CRUD ─────────────────────────────────────────────────────────
  const saveCampaign = async (form, existingId) => {
    try {
      const data = { ...form, updatedAt: serverTimestamp() };
      if (existingId) {
        await updateDoc(doc(db, 'emailCampaigns', existingId), data);
        setCampaigns(cs => cs.map(c => c.id === existingId ? { ...c, ...data } : c));
        addToast('Campaign updated', 'success');
      } else {
        data.createdAt = serverTimestamp();
        const ref = await addDoc(collection(db, 'emailCampaigns'), data);
        setCampaigns(cs => [{ id: ref.id, ...data }, ...cs]);
        setRecipients(r => ({ ...r, [ref.id]: [] }));
        addToast('Campaign created', 'success');
      }
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  const deleteCampaign = (c) => {
    setConfirmDialog({
      isOpen: true, type: 'danger',
      title: 'Delete Campaign',
      message: `Delete campaign "${c.name}"? All recipient data will also be removed.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        // Delete recipients subcollection
        const rSnap = await getDocs(collection(db, 'emailCampaigns', c.id, 'recipients'));
        const batch = writeBatch(db);
        rSnap.docs.forEach(d => batch.delete(d.ref));
        batch.delete(doc(db, 'emailCampaigns', c.id));
        await batch.commit();
        setCampaigns(cs => cs.filter(x => x.id !== c.id));
        setRecipients(r => { const n = { ...r }; delete n[c.id]; return n; });
        addToast('Campaign deleted', 'success');
      },
    });
  };

  // Mark campaign as sent — auto-create recipient entries for targeted contacts
  const markCampaignSent = async (campaign) => {
    try {
      const targetContacts = contacts.filter(c =>
        c.status === 'active' &&
        (campaign.segment === 'all' || (c.tags || []).includes(campaign.segment))
      );
      const batch = writeBatch(db);
      const now = serverTimestamp();
      // Update campaign
      batch.update(doc(db, 'emailCampaigns', campaign.id), { status: 'sent', sentAt: now });
      // Create recipient docs
      const newRecs = [];
      targetContacts.forEach(c => {
        const rRef = doc(collection(db, 'emailCampaigns', campaign.id, 'recipients'));
        batch.set(rRef, { contactId: c.id, status: 'sent', createdAt: now, updatedAt: now });
        newRecs.push({ id: rRef.id, contactId: c.id, status: 'sent' });
      });
      await batch.commit();
      setCampaigns(cs => cs.map(c => c.id === campaign.id ? { ...c, status: 'sent' } : c));
      setRecipients(r => ({ ...r, [campaign.id]: [...(r[campaign.id] || []), ...newRecs] }));
      addToast(`Campaign marked as sent to ${targetContacts.length} contacts`, 'success');
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  // Update individual recipient status
  const updateRecipientStatus = async (campaignId, recipientId, status) => {
    try {
      await updateDoc(doc(db, 'emailCampaigns', campaignId, 'recipients', recipientId), { status, updatedAt: serverTimestamp() });
      setRecipients(r => ({
        ...r,
        [campaignId]: (r[campaignId] || []).map(x => x.id === recipientId ? { ...x, status } : x),
      }));
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  // ── TEMPLATES CRUD ─────────────────────────────────────────────────────────
  const saveTemplate = async (form, existingId) => {
    try {
      const data = { ...form, updatedAt: serverTimestamp() };
      if (existingId) {
        await updateDoc(doc(db, 'emailTemplates', existingId), data);
        setTemplates(ts => ts.map(t => t.id === existingId ? { ...t, ...data } : t));
        addToast('Template updated', 'success');
      } else {
        data.createdAt = serverTimestamp();
        const ref = await addDoc(collection(db, 'emailTemplates'), data);
        setTemplates(ts => [{ id: ref.id, ...data }, ...ts]);
        addToast('Template saved', 'success');
      }
    } catch (err) { addToast('Error: ' + err.message, 'error'); }
  };

  const deleteTemplate = (t) => {
    setConfirmDialog({
      isOpen: true, type: 'danger',
      title: 'Delete Template',
      message: `Delete template "${t.name}"?`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await deleteDoc(doc(db, 'emailTemplates', t.id));
        setTemplates(ts => ts.filter(x => x.id !== t.id));
        addToast('Template deleted', 'success');
      },
    });
  };

  const copyTemplate = (t) => {
    navigator.clipboard?.writeText(t.body).then(() => addToast('Template body copied to clipboard', 'success'));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 py-4">
            <button onClick={() => router.push('/dashboard/admin')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-gray-900 leading-tight">Email Marketing</h1>
                <p className="text-xs text-gray-500">Manage contacts, campaigns & templates</p>
              </div>
            </div>
            <button onClick={loadAll}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    tab === t.id
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}>
                  <Icon size={14} /> {t.label}
                  {t.id === 'contacts'  && <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{contacts.length}</span>}
                  {t.id === 'campaigns' && <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{campaigns.length}</span>}
                  {t.id === 'templates' && <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{templates.length}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
        {tab === 'dashboard' && (
          <DashboardTab contacts={contacts} campaigns={campaigns} recipients={recipients} />
        )}
        {tab === 'contacts' && (
          <ContactsTab
            contacts={contacts}
            campaigns={campaigns}
            recipients={recipients}
            loading={loading}
            registeredUsers={regUsers}
            onAdd={saveContact}
            onStatusChange={changeContactStatus}
            onDelete={deleteContact}
            onBulkDelete={bulkDeleteContacts}
            onImportCSV={importCSV}
            onExportCSV={exportCSV}
          />
        )}
        {tab === 'campaigns' && (
          <CampaignsTab
            campaigns={campaigns}
            contacts={contacts}
            recipients={recipients}
            templates={templates}
            loading={loading}
            onAdd={saveCampaign}
            onEdit={saveCampaign}
            onDelete={deleteCampaign}
            onMarkSent={markCampaignSent}
            onUpdateRecipient={updateRecipientStatus}
          />
        )}
        {tab === 'templates' && (
          <TemplatesTab
            templates={templates}
            loading={loading}
            onAdd={saveTemplate}
            onEdit={saveTemplate}
            onDelete={deleteTemplate}
            onCopy={copyTemplate}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}