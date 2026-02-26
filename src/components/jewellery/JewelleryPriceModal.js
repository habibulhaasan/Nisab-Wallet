// src/components/jewellery/JewelleryPriceModal.js
// Shows current BAJUS market price for a jewellery piece,
// applies 15% deduction (Ulama standard), lets user save the snapshot.

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, RefreshCw, Loader2, CheckCircle2, AlertCircle,
  TrendingUp, TrendingDown, History, Wifi, WifiOff,
  ToggleLeft, ToggleRight, Percent, ExternalLink, Clock,
  ArrowRight, Scale, Gem,
} from 'lucide-react';
import {
  calcMarketValue, applyDeduction, formatWeight, fmtBDT,
  WEIGHT,
} from '@/lib/jewelleryCollections';

const DEFAULT_DEDUCTION = 15; // Ulama recommendation

export default function JewelleryPriceModal({ item, priceHistory = [], onSaveSnapshot, onClose }) {
  const [fetchState,    setFetchState]    = useState('idle');
  const [prices,        setPrices]        = useState(null);
  const [fetchError,    setFetchError]    = useState('');
  const [lastFetched,   setLastFetched]   = useState(null);

  const [deductionPct,  setDeductionPct]  = useState(DEFAULT_DEDUCTION);
  const [useCustomPct,  setUseCustomPct]  = useState(false);
  const [customPct,     setCustomPct]     = useState('');
  const [manualValue,   setManualValue]   = useState('');
  const [useManual,     setUseManual]     = useState(false);

  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);

  // ── Fetch BAJUS prices ────────────────────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    setFetchState('loading');
    setFetchError('');
    setSaved(false);
    try {
      const res  = await fetch('/api/metal-prices');
      const data = await res.json();
      if (data.gold?.karat22?.perGram || data.silver?.karat22?.perGram) {
        setPrices(data);
        setLastFetched(data.fetchedAt);
        setFetchState('success');
      } else {
        throw new Error(data.error || 'Could not parse price data.');
      }
    } catch (err) {
      setFetchState('error');
      setFetchError(err.message || 'Network error.');
    }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  // ── Derived values ────────────────────────────────────────────────────────
  const grams       = item.weightGrams || 0;
  const effectivePct = useCustomPct ? (parseFloat(customPct) || 0) : deductionPct;

  const marketValue  = prices ? calcMarketValue(grams, item.karat, item.metal, prices) : 0;
  const deductedValue = useManual
    ? (parseFloat(manualValue) || 0)
    : applyDeduction(marketValue, effectivePct);
  const deductionAmount = marketValue - applyDeduction(marketValue, effectivePct);

  const previousValue = priceHistory[0]?.deductedValue ?? null;
  const valueChange   = previousValue !== null ? deductedValue - previousValue : null;
  const changeSign    = valueChange > 0 ? '+' : '';

  // Price per gram used
  const pricePerGram = prices
    ? (item.metal === 'Gold'
        ? (() => {
            const map = { '22K': prices.gold?.karat22, '21K': prices.gold?.karat21, '18K': prices.gold?.karat18, 'Traditional': prices.gold?.traditional };
            return map[item.karat]?.perGram || prices.gold?.karat22?.perGram || 0;
          })()
        : (() => {
            const map = { '22K': prices.silver?.karat22, '21K': prices.silver?.karat21, '18K': prices.silver?.karat18, 'Traditional': prices.silver?.traditional };
            return map[item.karat]?.perGram || prices.silver?.karat22?.perGram || 0;
          })()
      )
    : 0;

  // ── Save snapshot ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    const snapshot = {
      marketValue,
      deductedValue,
      zakatValue: deductedValue,
      deductionPct:   useManual ? null : effectivePct,
      isManualValue:  useManual,
      manualValue:    useManual ? parseFloat(manualValue) : null,
      pricePerGram,
      metal:          item.metal,
      karat:          item.karat,
      weightGrams:    grams,
      priceSource:    prices?.source || 'manual',
      isSpotFallback: prices?.isSpotFallback || false,
    };
    await onSaveSnapshot(snapshot);
    setSaving(false);
    setSaved(true);
  };

  const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })
      + ', ' + d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: 'min(95vh, 740px)' }}>

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">Check Current Price</h2>
                <p className="text-xs text-gray-500 truncate max-w-48">{item.name} · {item.karat} {item.metal}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Item summary */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">
                {formatWeight(item.weightVori, item.weightAna, item.weightRoti, item.weightPoint)}
              </span>
              <span className="text-xs text-amber-600">({grams.toFixed(4)}g)</span>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
              {item.karat} {item.metal}
            </span>
          </div>

          {/* Loading */}
          {fetchState === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="relative w-12 h-12">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                <Gem className="w-4 h-4 text-emerald-600 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm text-gray-600 font-medium">Fetching BAJUS live prices…</p>
            </div>
          )}

          {/* Error */}
          {fetchState === 'error' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                <WifiOff className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800 text-sm">Could not fetch prices</p>
                  <p className="text-xs text-red-600 mt-0.5">{fetchError}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={fetchPrices}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
                <button onClick={() => { setUseManual(true); setFetchState('success'); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold">
                  Enter Manually
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {fetchState === 'success' && (<>

            {/* Fetch meta */}
            {!useManual && (
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {fmtTime(lastFetched)}
                  {prices?.isSpotFallback && (
                    <span className="ml-2 text-amber-500 font-medium">(international spot)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a href="https://www.bajus.org/gold-price" target="_blank" rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline flex items-center gap-0.5">
                    BAJUS <ExternalLink className="w-3 h-3" />
                  </a>
                  <button onClick={fetchPrices} className="text-emerald-600 flex items-center gap-0.5">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>
              </div>
            )}

            {/* Spot fallback warning */}
            {prices?.isSpotFallback && !useManual && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  Showing <strong>international spot prices</strong> — not official BAJUS rates.
                  Use manual input for exact value.
                </p>
              </div>
            )}

            {/* Price per gram info */}
            {!useManual && pricePerGram > 0 && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 flex justify-between items-center text-xs">
                <span className="text-gray-500">{item.karat} {item.metal} price/gram (BAJUS)</span>
                <span className="font-bold text-gray-800">{fmtBDT(pricePerGram)}</span>
              </div>
            )}

            {/* Manual entry mode */}
            <div className="flex gap-2">
              <ModeBtn active={!useManual} onClick={() => setUseManual(false)}>
                <Wifi className="w-3.5 h-3.5" /> Live Price
              </ModeBtn>
              <ModeBtn active={useManual} onClick={() => setUseManual(true)}>
                Edit Manually
              </ModeBtn>
            </div>

            {useManual && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  Enter current value of this jewellery (৳)
                </label>
                <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-gray-900 bg-white">
                  <span className="flex items-center pl-3 text-gray-400 text-sm">৳</span>
                  <input type="number" min="0" value={manualValue}
                    onChange={e => setManualValue(e.target.value)}
                    placeholder="0"
                    className="flex-1 px-2 py-2.5 text-sm bg-transparent outline-none text-gray-900" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enter the resale/sell value after any deductions you choose.
                </p>
              </div>
            )}

            {/* Deduction toggle — only when using live price */}
            {!useManual && (
              <div
                onClick={() => {
                  if (deductionPct === 0) setDeductionPct(DEFAULT_DEDUCTION);
                  else setDeductionPct(0);
                }}
                className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all select-none ${
                  deductionPct > 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {deductionPct > 0
                      ? <ToggleRight className="w-5 h-5 text-amber-600" />
                      : <ToggleLeft  className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-bold ${deductionPct > 0 ? 'text-amber-900' : 'text-gray-700'}`}>
                        Apply {DEFAULT_DEDUCTION}% BAJUS Deduction
                      </p>
                      {deductionPct > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-xs font-bold rounded-full">ON</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      BAJUS officially deducts 17% for old gold resale; Bangladeshi Ulama recommend 15%.
                      15% is applied here by default.
                    </p>
                    {deductionPct > 0 && marketValue > 0 && (
                      <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold">
                        <span className="text-gray-400 line-through">{fmtBDT(marketValue)}</span>
                        <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        <span className="text-amber-700">{fmtBDT(applyDeduction(marketValue, DEFAULT_DEDUCTION))} (−{DEFAULT_DEDUCTION}%)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Result card */}
            {(marketValue > 0 || useManual) && (
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-4 text-white">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full transform translate-x-6 -translate-y-6" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-emerald-200 font-semibold uppercase tracking-wide">
                      {useManual ? 'Manual Value' : deductionPct > 0 ? `Resale Value (−${deductionPct}%)` : 'Full Market Value'}
                    </p>
                    {valueChange !== null && (
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        valueChange >= 0 ? 'bg-emerald-500/40 text-emerald-100' : 'bg-red-500/40 text-red-200'
                      }`}>
                        {valueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {changeSign}{fmtBDT(Math.abs(valueChange))}
                      </div>
                    )}
                  </div>
                  <p className="text-3xl font-bold">{fmtBDT(deductedValue)}</p>
                  {!useManual && deductionPct > 0 && (
                    <p className="text-xs text-emerald-200 mt-1">
                      Full market: {fmtBDT(marketValue)} · Deducted: {fmtBDT(deductionAmount)}
                    </p>
                  )}
                  {!useManual && (
                    <p className="text-xs text-emerald-200 mt-0.5">
                      {fmtBDT(pricePerGram)}/g × {grams.toFixed(4)}g = {fmtBDT(marketValue)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Save button */}
            {(marketValue > 0 || (useManual && parseFloat(manualValue) > 0)) && (
              <button onClick={handleSave} disabled={saving || saved}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors ${
                  saved
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                } disabled:opacity-70`}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saved ? 'Snapshot Saved!' : 'Save This Value as Asset Snapshot'}
              </button>
            )}
            {saved && (
              <p className="text-xs text-center text-gray-400">
                This value is now stored in the price history of this jewellery item.
              </p>
            )}
          </>)}

          {/* ── Price history ── */}
          {priceHistory.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-700">Price History</h3>
              </div>
              <div className="space-y-2">
                {priceHistory.slice(0, 8).map((snap, i) => {
                  const prev = priceHistory[i + 1];
                  const chg  = prev ? snap.deductedValue - prev.deductedValue : null;
                  return (
                    <div key={snap.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                        i === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-white'
                      }`}>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{fmtDate(snap.recordedAt)}</p>
                        <p className="text-xs text-gray-400">
                          {snap.isManualValue ? 'Manual entry' : `−${snap.deductionPct ?? 15}% deduction`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${i === 0 ? 'text-emerald-700' : 'text-gray-800'}`}>
                          {fmtBDT(snap.deductedValue)}
                        </p>
                        {chg !== null && (
                          <p className={`text-xs font-semibold ${chg >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {chg >= 0 ? '+' : ''}{fmtBDT(chg)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
        active ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
      }`}>
      {children}
    </button>
  );
}
