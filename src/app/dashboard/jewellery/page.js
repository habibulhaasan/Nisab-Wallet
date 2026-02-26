// src/app/dashboard/jewellery/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getJewellery, addJewellery, updateJewellery, deleteJewellery,
  addPriceSnapshot, getPriceHistory,
  totalJewelleryZakatValue, fmtBDT, formatWeight, weightToGrams,
} from '@/lib/jewelleryCollections';
import { showToast } from '@/components/Toast';
import JewelleryModal from '@/components/jewellery/JewelleryModal';
import JewelleryPriceModal from '@/components/jewellery/JewelleryPriceModal';
import {
  Gem, Plus, TrendingUp, Scale, Trash2, Edit3, RefreshCw,
  History, Search, Filter, ChevronDown, Star, Loader2,
  AlertCircle, ArrowUpRight, Package, Coins,
} from 'lucide-react';

const METAL_COLORS = {
  Gold:   { bg: 'bg-amber-50',   border: 'border-amber-200', dot: 'bg-amber-400', text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-800'  },
  Silver: { bg: 'bg-slate-50',   border: 'border-slate-200', dot: 'bg-slate-400', text: 'text-slate-700',  badge: 'bg-slate-100 text-slate-800'  },
};

export default function JewelleryPage() {
  const { user } = useAuth();

  const [items,          setItems]          = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [filterMetal,    setFilterMetal]    = useState('all');
  const [filterKarat,    setFilterKarat]    = useState('all');
  const [sortBy,         setSortBy]         = useState('newest');

  // Modals
  const [showAddModal,    setShowAddModal]   = useState(false);
  const [editItem,        setEditItem]       = useState(null);
  const [priceItem,       setPriceItem]      = useState(null);
  const [priceHistory,    setPriceHistory]   = useState([]);
  const [loadingHistory,  setLoadingHistory] = useState(false);
  const [confirmDelete,   setConfirmDelete]  = useState(null);

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => { if (user) loadItems(); }, [user]);

  useEffect(() => {
    let list = [...items];
    if (searchQuery)        list = list.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.category?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterMetal !== 'all') list = list.filter(i => i.metal === filterMetal);
    if (filterKarat !== 'all') list = list.filter(i => i.karat === filterKarat);
    list.sort((a, b) => {
      if (sortBy === 'newest')   return (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0);
      if (sortBy === 'value')    return (b.currentZakatValue||0) - (a.currentZakatValue||0);
      if (sortBy === 'weight')   return (b.weightGrams||0) - (a.weightGrams||0);
      if (sortBy === 'name')     return a.name.localeCompare(b.name);
      return 0;
    });
    setFiltered(list);
  }, [items, searchQuery, filterMetal, filterKarat, sortBy]);

  const loadItems = async () => {
    setLoading(true);
    const result = await getJewellery(user.uid);
    if (result.success) setItems(result.items);
    else showToast('Failed to load jewellery', 'error');
    setLoading(false);
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleAdd = async (data) => {
    const result = await addJewellery(user.uid, data);
    if (result.success) { showToast('Jewellery added!', 'success'); setShowAddModal(false); loadItems(); }
    else showToast('Failed to add', 'error');
  };

  const handleEdit = async (data) => {
    const result = await updateJewellery(user.uid, editItem.id, data);
    if (result.success) { showToast('Updated!', 'success'); setEditItem(null); loadItems(); }
    else showToast('Failed to update', 'error');
  };

  const handleDelete = async (item) => {
    const result = await deleteJewellery(user.uid, item.id);
    if (result.success) { showToast('Deleted', 'success'); setConfirmDelete(null); loadItems(); }
    else showToast('Failed to delete', 'error');
  };

  // ── Price check & snapshot ────────────────────────────────────────────────
  const openPriceModal = async (item) => {
    setPriceItem(item);
    setLoadingHistory(true);
    const result = await getPriceHistory(user.uid, item.id);
    setPriceHistory(result.success ? result.history : []);
    setLoadingHistory(false);
  };

  const handleSaveSnapshot = async (snapshot) => {
    if (!priceItem) return;
    // Save snapshot to history
    await addPriceSnapshot(user.uid, priceItem.id, snapshot);
    // Update the piece's current value fields
    await updateJewellery(user.uid, priceItem.id, {
      currentMarketValue:    snapshot.marketValue,
      currentDeductedValue:  snapshot.deductedValue,
      currentZakatValue:     snapshot.deductedValue,
      currentPriceCheckedAt: new Date().toISOString(),
    });
    showToast('Price snapshot saved!', 'success');
    loadItems();
    // Reload history
    const result = await getPriceHistory(user.uid, priceItem.id);
    setPriceHistory(result.success ? result.history : []);
    // Update priceItem with latest data
    setPriceItem(prev => ({
      ...prev,
      currentMarketValue:   snapshot.marketValue,
      currentDeductedValue: snapshot.deductedValue,
      currentZakatValue:    snapshot.deductedValue,
    }));
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalZakat    = totalJewelleryZakatValue(items);
  const priced        = items.filter(i => i.currentZakatValue > 0);
  const totalGold     = items.filter(i => i.metal === 'Gold').reduce((s, i) => s + (i.weightGrams||0), 0);
  const totalSilver   = items.filter(i => i.metal === 'Silver').reduce((s, i) => s + (i.weightGrams||0), 0);

  const fmtGrams = (g) => g >= 11.664
    ? `${(g / 11.664).toFixed(2)} Vori (${g.toFixed(2)}g)`
    : `${g.toFixed(4)}g`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gem className="w-6 h-6 text-amber-500" /> Jewellery Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track gold & silver — monitor value for Zakat</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Jewellery
        </button>
      </div>

      {/* ── Summary cards ── */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            icon={<Star className="w-4 h-4 text-emerald-600" />}
            label="Total Zakat Value"
            value={fmtBDT(totalZakat)}
            sub={`${priced.length}/${items.length} priced`}
            accent="emerald"
          />
          <SummaryCard
            icon={<Package className="w-4 h-4 text-amber-600" />}
            label="Total Items"
            value={items.length}
            sub={`${items.filter(i=>i.metal==='Gold').length} gold, ${items.filter(i=>i.metal==='Silver').length} silver`}
            accent="amber"
          />
          {totalGold > 0 && (
            <SummaryCard
              icon={<Coins className="w-4 h-4 text-amber-600" />}
              label="Total Gold"
              value={fmtGrams(totalGold)}
              accent="amber"
            />
          )}
          {totalSilver > 0 && (
            <SummaryCard
              icon={<Coins className="w-4 h-4 text-slate-500" />}
              label="Total Silver"
              value={fmtGrams(totalSilver)}
              accent="slate"
            />
          )}
        </div>
      )}

      {/* ── Filters & search ── */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search jewellery…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 transition-colors" />
          </div>
          {/* Metal filter */}
          <FilterSelect value={filterMetal} onChange={setFilterMetal}
            options={[['all','All Metals'],['Gold','Gold'],['Silver','Silver']]} />
          {/* Sort */}
          <FilterSelect value={sortBy} onChange={setSortBy}
            options={[['newest','Newest'],['value','By Value'],['weight','By Weight'],['name','By Name']]} />
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-gray-500 text-sm">Loading your jewellery…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-4 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
            <Gem className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">No jewellery added yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">
              Add your gold and silver jewellery to track their value and calculate Zakat.
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add First Item
          </button>
        </div>
      )}

      {/* ── Jewellery list ── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(item => (
            <JewelleryCard
              key={item.id}
              item={item}
              onEdit={() => setEditItem(item)}
              onDelete={() => setConfirmDelete(item)}
              onCheckPrice={() => openPriceModal(item)}
            />
          ))}
        </div>
      )}

      {/* No results from filter */}
      {!loading && items.length > 0 && filtered.length === 0 && (
        <div className="text-center py-10 text-gray-500 text-sm">
          No items match your filters.
        </div>
      )}

      {/* ── Modals ── */}
      {showAddModal && (
        <JewelleryModal onSave={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
      {editItem && (
        <JewelleryModal item={editItem} onSave={handleEdit} onClose={() => setEditItem(null)} />
      )}
      {priceItem && (
        <JewelleryPriceModal
          item={priceItem}
          priceHistory={priceHistory}
          onSaveSnapshot={handleSaveSnapshot}
          onClose={() => { setPriceItem(null); setPriceHistory([]); }}
        />
      )}

      {/* ── Confirm delete ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-center text-lg mb-1">Delete Jewellery?</h3>
            <p className="text-gray-500 text-sm text-center mb-5">
              "<strong>{confirmDelete.name}</strong>" and all its price history will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── JewelleryCard ─────────────────────────────────────────────────────────
function JewelleryCard({ item, onEdit, onDelete, onCheckPrice }) {
  const c = METAL_COLORS[item.metal] || METAL_COLORS.Gold;
  const w = formatWeight(item.weightVori, item.weightAna, item.weightRoti, item.weightPoint);

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const hasValue    = item.currentZakatValue > 0;
  const hasHistory  = item.currentPriceCheckedAt;

  return (
    <div className={`bg-white border rounded-2xl p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        {/* Left — info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Metal dot */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg} border ${c.border}`}>
            <Gem className={`w-5 h-5 ${c.text}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.badge}`}>
                {item.karat} {item.metal}
              </span>
              {item.category && (
                <span className="px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-100">
                  {item.category}
                </span>
              )}
            </div>

            {/* Weight */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Scale className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 font-medium">{w || '—'}</span>
              <span className="text-xs text-gray-400">({(item.weightGrams||0).toFixed(4)}g)</span>
            </div>

            {/* Value */}
            {hasValue ? (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-sm font-bold text-emerald-700">{fmtBDT(item.currentZakatValue)}</span>
                <span className="text-xs text-gray-400">Zakat value (−15%)</span>
                {hasHistory && (
                  <span className="text-xs text-gray-400">· {fmtDate(item.currentPriceCheckedAt)}</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1.5 italic">Price not checked yet</p>
            )}

            {/* Purchase info */}
            {item.purchaseTotal > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Purchased: {fmtBDT(item.purchaseTotal)} · {fmtDate(item.purchaseDate)}
              </p>
            )}
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button onClick={onCheckPrice}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap">
            <TrendingUp className="w-3.5 h-3.5" />
            {hasValue ? 'Update Price' : 'Check Price'}
          </button>
          <div className="flex gap-1.5">
            <button onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
            <button onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-medium transition-colors">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Notes */}
      {item.notes && (
        <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 italic">{item.notes}</p>
      )}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, sub, accent }) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-100',
    amber:   'bg-amber-50 border-amber-100',
    slate:   'bg-slate-50 border-slate-100',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[accent]}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500 font-medium">{label}</span></div>
      <p className="font-bold text-gray-900 text-lg leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-gray-400 cursor-pointer">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
