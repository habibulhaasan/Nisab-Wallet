// src/app/dashboard/jewellery/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getJewellery, addJewellery, updateJewellery, deleteJewellery,
  addPriceSnapshot, getPriceHistory, recordJewelleryPurchase, sellJewellery,
  totalJewelleryZakatValue, fmtBDT, formatWeight, weightToGrams,
  ACQUISITION_LABELS,
} from '@/lib/jewelleryCollections';
import { getAccounts } from '@/lib/firestoreCollections';
import { showToast } from '@/components/Toast';
import JewelleryModal from '@/components/jewellery/JewelleryModal';
import JewelleryPriceModal from '@/components/jewellery/JewelleryPriceModal';
import SellJewelleryModal from '@/components/jewellery/SellJewelleryModal';
import {
  Gem, Plus, TrendingUp, Scale, Trash2, Edit3,
  Search, ChevronDown, Star, Loader2,
  AlertCircle, Package, Coins, Tag, Gift,
  CheckCircle2, History, FileText, ShoppingBag,
  ArrowUpRight, DollarSign, RotateCcw,
} from 'lucide-react';

const METAL_COLORS = {
  Gold:   { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-800'  },
  Silver: { bg: 'bg-slate-50',  border: 'border-slate-200', text: 'text-slate-700',  badge: 'bg-slate-100 text-slate-800'  },
};

const ACQUISITION_ICONS = {
  purchased: ShoppingBag,
  gift:      Gift,
  inherited: FileText,
  other:     Tag,
};

export default function JewelleryPage() {
  const { user } = useAuth();

  const [items,          setItems]          = useState([]);
  const [accounts,       setAccounts]       = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [filterMetal,    setFilterMetal]    = useState('all');
  const [filterStatus,   setFilterStatus]   = useState('active');
  const [sortBy,         setSortBy]         = useState('newest');

  // Modals
  const [showAddModal,    setShowAddModal]   = useState(false);
  const [editItem,        setEditItem]       = useState(null);
  const [priceItem,       setPriceItem]      = useState(null);
  const [priceHistory,    setPriceHistory]   = useState([]);
  const [loadingHistory,  setLoadingHistory] = useState(false);
  const [sellItem,        setSellItem]       = useState(null);
  const [confirmDelete,   setConfirmDelete]  = useState(null);

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    setLoading(true);
    const [jewResult, accResult] = await Promise.all([
      getJewellery(user.uid),
      getAccounts(user.uid),
    ]);
    if (jewResult.success) setItems(jewResult.items);
    else showToast('Failed to load jewellery', 'error');
    if (accResult.success) setAccounts(accResult.accounts);
    setLoading(false);
  };

  // ── Filter & sort ─────────────────────────────────────────────────────────
  useEffect(() => {
    let list = [...items];

    if (filterStatus === 'active') list = list.filter(i => i.status !== 'sold');
    if (filterStatus === 'sold')   list = list.filter(i => i.status === 'sold');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q)
      );
    }

    if (filterMetal !== 'all') list = list.filter(i => i.metal === filterMetal);

    list.sort((a, b) => {
      if (sortBy === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === 'value')  return (b.currentZakatValue || 0) - (a.currentZakatValue || 0);
      if (sortBy === 'weight') return (b.weightGrams || 0) - (a.weightGrams || 0);
      if (sortBy === 'name')   return a.name.localeCompare(b.name);
      return 0;
    });

    setFiltered(list);
  }, [items, searchQuery, filterMetal, filterStatus, sortBy]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleAdd = async (data) => {
    const { _recordTransaction, _txAccountId, _txAccountBalance, _txAccountName, ...cleanData } = data;

    const result = await addJewellery(user.uid, { ...cleanData, status: 'active' });
    if (!result.success) { showToast('Failed to add jewellery', 'error'); return; }

    if (_recordTransaction && _txAccountId && cleanData.purchaseTotal) {
      const txResult = await recordJewelleryPurchase(user.uid, result.id, {
        amount:         cleanData.purchaseTotal,
        accountId:      _txAccountId,
        accountBalance: _txAccountBalance,
        accountName:    _txAccountName,
        date:           cleanData.purchaseDate,
        itemName:       cleanData.name,
      });
      showToast(txResult.success ? 'Jewellery added & expense recorded!' : 'Added, but failed to record transaction', txResult.success ? 'success' : 'error');
    } else {
      showToast('Jewellery added!', 'success');
    }

    setShowAddModal(false);
    loadAll();
  };

  const handleEdit = async (data) => {
    const { _recordTransaction, _txAccountId, _txAccountBalance, _txAccountName, ...cleanData } = data;
    const result = await updateJewellery(user.uid, editItem.id, cleanData);
    if (result.success) { showToast('Updated!', 'success'); setEditItem(null); loadAll(); }
    else showToast('Failed to update', 'error');
  };

  const handleDelete = async (item) => {
    const result = await deleteJewellery(user.uid, item.id);
    if (result.success) { showToast('Deleted', 'success'); setConfirmDelete(null); loadAll(); }
    else showToast('Failed to delete', 'error');
  };

  // ── Sell ──────────────────────────────────────────────────────────────────
  const handleSell = async (sellData) => {
    const result = await sellJewellery(user.uid, sellItem.id, sellData);
    if (result.success) {
      showToast(`${sellItem.name} sold! ${fmtBDT(sellData.saleAmount)} added to account.`, 'success');
      setSellItem(null);
      loadAll();
    } else {
      showToast('Failed to process sale', 'error');
    }
  };

  // ── Price snapshot ────────────────────────────────────────────────────────
  const openPriceModal = async (item) => {
    setPriceItem(item);
    setLoadingHistory(true);
    const result = await getPriceHistory(user.uid, item.id);
    setPriceHistory(result.success ? result.history : []);
    setLoadingHistory(false);
  };

  const handleSaveSnapshot = async (snapshot) => {
    if (!priceItem) return;
    await addPriceSnapshot(user.uid, priceItem.id, snapshot);
    await updateJewellery(user.uid, priceItem.id, {
      currentMarketValue:    snapshot.marketValue,
      currentDeductedValue:  snapshot.deductedValue,
      currentZakatValue:     snapshot.deductedValue,
      currentPriceCheckedAt: new Date().toISOString(),
    });
    showToast('Price snapshot saved!', 'success');
    loadAll();
    const result = await getPriceHistory(user.uid, priceItem.id);
    setPriceHistory(result.success ? result.history : []);
    setPriceItem(prev => ({
      ...prev,
      currentMarketValue:   snapshot.marketValue,
      currentDeductedValue: snapshot.deductedValue,
      currentZakatValue:    snapshot.deductedValue,
    }));
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const activeItems      = items.filter(i => i.status !== 'sold');
  const soldItems        = items.filter(i => i.status === 'sold');
  const totalZakat       = totalJewelleryZakatValue(activeItems);
  const priced           = activeItems.filter(i => i.currentZakatValue > 0);
  const totalGold        = activeItems.filter(i => i.metal === 'Gold').reduce((s, i) => s + (i.weightGrams || 0), 0);
  const totalSilver      = activeItems.filter(i => i.metal === 'Silver').reduce((s, i) => s + (i.weightGrams || 0), 0);
  const totalSoldRevenue = soldItems.reduce((s, i) => s + (i.soldPrice || 0), 0);

  // Format weight in Vori for summary cards
  const fmtVori = (g) => {
    if (!g) return '0g';
    const vori  = Math.floor(g / 11.664);
    const rem   = g - vori * 11.664;
    const ana   = Math.floor(rem / (11.664 / 16));
    const parts = [];
    if (vori) parts.push(`${vori}V`);
    if (ana)  parts.push(`${ana}A`);
    if (!parts.length) parts.push(`${g.toFixed(2)}g`);
    return parts.join(' ') + ` (${g.toFixed(2)}g)`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gem className="w-6 h-6 text-amber-500" /> Jewellery Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track gold &amp; silver — monitor value for Zakat</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
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
            sub={`${priced.length}/${activeItems.length} priced`}
            accent="emerald"
          />
          <SummaryCard
            icon={<Package className="w-4 h-4 text-amber-600" />}
            label="Active Items"
            value={activeItems.length}
            sub={soldItems.length > 0 ? `${soldItems.length} sold` : `${activeItems.filter(i => i.metal === 'Gold').length} gold · ${activeItems.filter(i => i.metal === 'Silver').length} silver`}
            accent="amber"
          />
          {totalGold > 0 && (
            <SummaryCard
              icon={<Coins className="w-4 h-4 text-amber-600" />}
              label="Total Gold"
              value={fmtVori(totalGold)}
              accent="amber"
            />
          )}
          {totalSilver > 0 && (
            <SummaryCard
              icon={<Coins className="w-4 h-4 text-slate-500" />}
              label="Total Silver"
              value={fmtVori(totalSilver)}
              accent="slate"
            />
          )}
          {soldItems.length > 0 && totalGold === 0 && totalSilver === 0 && (
            <SummaryCard
              icon={<DollarSign className="w-4 h-4 text-blue-500" />}
              label="Total Sold"
              value={fmtBDT(totalSoldRevenue)}
              sub={`${soldItems.length} item${soldItems.length > 1 ? 's' : ''}`}
              accent="blue"
            />
          )}
        </div>
      )}

      {/* ── Unpriced nudge ── */}
      {activeItems.length > 0 && priced.length < activeItems.length && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{activeItems.length - priced.length} item{activeItems.length - priced.length > 1 ? 's' : ''}</strong> not priced yet —
            tap <strong>Check Price</strong> to fetch BAJUS rates and include them in your Zakat total.
          </p>
        </div>
      )}

      {/* ── Filters ── */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search jewellery…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <FilterSelect value={filterStatus} onChange={setFilterStatus}
            options={[['active','Active'],['sold','Sold'],['all','All Items']]} />
          <FilterSelect value={filterMetal} onChange={setFilterMetal}
            options={[['all','All Metals'],['Gold','Gold'],['Silver','Silver']]} />
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
              Works for purchased, gifted, or inherited pieces.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Item
          </button>
        </div>
      )}

      {/* ── List ── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(item => (
            <JewelleryCard
              key={item.id}
              item={item}
              onEdit={() => setEditItem(item)}
              onDelete={() => setConfirmDelete(item)}
              onCheckPrice={() => openPriceModal(item)}
              onViewHistory={() => openPriceModal(item)}
              onSell={() => setSellItem(item)}
            />
          ))}
        </div>
      )}

      {!loading && items.length > 0 && filtered.length === 0 && (
        <div className="text-center py-10 text-gray-500 text-sm">
          {filterStatus === 'sold' ? 'No sold items yet.' : 'No items match your filters.'}
        </div>
      )}

      {/* ── Modals ── */}
      {showAddModal && (
        <JewelleryModal accounts={accounts} onSave={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
      {editItem && (
        <JewelleryModal item={editItem} accounts={accounts} onSave={handleEdit} onClose={() => setEditItem(null)} />
      )}
      {priceItem && (
        <JewelleryPriceModal
          item={priceItem}
          priceHistory={priceHistory}
          onSaveSnapshot={handleSaveSnapshot}
          onClose={() => { setPriceItem(null); setPriceHistory([]); }}
        />
      )}
      {sellItem && (
        <SellJewelleryModal
          item={sellItem}
          accounts={accounts}
          onSell={handleSell}
          onClose={() => setSellItem(null)}
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
              &ldquo;<strong>{confirmDelete.name}</strong>&rdquo; and all its price history will be permanently deleted.
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
function JewelleryCard({ item, onEdit, onDelete, onCheckPrice, onViewHistory, onSell }) {
  const c       = METAL_COLORS[item.metal] || METAL_COLORS.Gold;
  const isSold  = item.status === 'sold';
  const AcqIcon = ACQUISITION_ICONS[item.acquisitionType] || ShoppingBag;

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ── Primary weight display: Vori Ana Roti Point · Xg ──────────────────
  const wParts = [];
  if (item.weightVori)  wParts.push(`${item.weightVori} Vori`);
  if (item.weightAna)   wParts.push(`${item.weightAna} Ana`);
  if (item.weightRoti)  wParts.push(`${item.weightRoti} Roti`);
  if (item.weightPoint) wParts.push(`${item.weightPoint} Point`);
  const weightLabel  = wParts.length ? wParts.join(' ') : '—';
  const weightGrams  = (item.weightGrams || 0).toFixed(4);

  const hasValue   = (item.currentZakatValue || 0) > 0;
  const hasHistory = !!item.currentPriceCheckedAt;

  // Acquisition price line
  const hasPurchasePrice = (item.purchaseTotal || 0) > 0;
  const isPurchased      = item.acquisitionType === 'purchased' || !item.acquisitionType;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${
      isSold ? 'border-blue-100' : 'border-gray-200 hover:shadow-md'
    }`}>
      {/* Sold banner */}
      {isSold && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-bold text-blue-700">SOLD</span>
            <span className="text-xs text-blue-500">on {fmtDate(item.soldAt)}</span>
          </div>
          <span className="text-sm font-bold text-blue-700">{fmtBDT(item.soldPrice)}</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">

          {/* ── Left — info ── */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg} border ${c.border} ${isSold ? 'opacity-60' : ''}`}>
              <Gem className={`w-5 h-5 ${c.text}`} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-bold text-sm ${isSold ? 'text-gray-500' : 'text-gray-900'}`}>
                  {item.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.badge}`}>
                  {item.karat} {item.metal}
                </span>
                {item.category && (
                  <span className="px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-100">
                    {item.category}
                  </span>
                )}
                {item.acquisitionType && item.acquisitionType !== 'purchased' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-purple-700 bg-purple-50 border border-purple-100">
                    <AcqIcon className="w-2.5 h-2.5" />
                    {ACQUISITION_LABELS[item.acquisitionType] || item.acquisitionType}
                  </span>
                )}
              </div>

              {/* Weight — PRIMARY: Vori Ana Roti Point · grams */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <Scale className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-700">{weightLabel}</span>
                <span className="text-xs text-gray-400">·&nbsp;{weightGrams}g</span>
              </div>

              {/* ── Active item details ── */}
              {!isSold && (
                <div className="mt-2 space-y-1">
                  {/* Zakat value */}
                  {hasValue ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-emerald-700">{fmtBDT(item.currentZakatValue)}</span>
                      <span className="text-xs text-gray-400">Zakat value (−15%)</span>
                      {hasHistory && (
                        <span className="text-xs text-gray-400">· {fmtDate(item.currentPriceCheckedAt)}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-orange-400 font-medium">⚠ Price not checked yet — tap Check Price</p>
                  )}

                  {/* Acquisition / purchase price */}
                  {hasPurchasePrice && isPurchased && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Paid:</span>
                      <span className="text-xs font-semibold text-gray-700">{fmtBDT(item.purchaseTotal)}</span>
                      <span className="text-xs text-gray-400">on {fmtDate(item.purchaseDate)}</span>
                      {item.purchaseTransactionId && (
                        <span className="text-xs text-emerald-500">✓ expensed</span>
                      )}
                    </div>
                  )}
                  {!isPurchased && item.purchaseDate && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">
                        {ACQUISITION_LABELS[item.acquisitionType] || 'Acquired'}: {fmtDate(item.purchaseDate)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Sold item details ── */}
              {isSold && (
                <div className="mt-2 space-y-1">
                  {/* Original acquisition price */}
                  {hasPurchasePrice && isPurchased && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Bought for:</span>
                      <span className="text-xs font-semibold text-gray-600">{fmtBDT(item.purchaseTotal)}</span>
                      <span className="text-xs text-gray-400">on {fmtDate(item.purchaseDate)}</span>
                    </div>
                  )}
                  {/* Profit/loss if both known */}
                  {hasPurchasePrice && isPurchased && item.soldPrice && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">
                        {item.soldPrice >= item.purchaseTotal ? '📈 Profit:' : '📉 Loss:'}
                      </span>
                      <span className={`text-xs font-bold ${
                        item.soldPrice >= item.purchaseTotal ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {fmtBDT(Math.abs(item.soldPrice - item.purchaseTotal))}
                      </span>
                    </div>
                  )}
                  {/* Last known Zakat value */}
                  {hasValue && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Last Zakat value:</span>
                      <span className="text-xs text-gray-500 font-semibold">{fmtBDT(item.currentZakatValue)}</span>
                    </div>
                  )}
                  {/* Sold notes */}
                  {item.soldNotes && (
                    <p className="text-xs text-gray-400 italic">{item.soldNotes}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right — actions ── */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {isSold ? (
              <>
                {/* Price history — always visible for sold items */}
                <button
                  onClick={onViewHistory}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <History className="w-3.5 h-3.5" /> History
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Check / Update price */}
                <button
                  onClick={onCheckPrice}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {hasValue ? 'Update Price' : 'Check Price'}
                </button>
                {/* Sell */}
                <button
                  onClick={onSell}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Sell
                </button>
                {/* Edit + Delete */}
                <div className="flex gap-1.5">
                  <button
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {item.notes && (
          <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 italic">
            📝 {item.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, sub, accent }) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-100',
    amber:   'bg-amber-50 border-amber-100',
    slate:   'bg-slate-50 border-slate-100',
    blue:    'bg-blue-50 border-blue-100',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[accent] || colors.amber}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="font-bold text-gray-900 text-base leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-gray-400 cursor-pointer"
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}