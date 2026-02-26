// src/components/zakat/NisabSettingsModal.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, RefreshCw, Loader2, CheckCircle2, AlertCircle, Edit3,
  Wifi, WifiOff, Calculator, Info, ExternalLink, Clock,
  Coins, ArrowRight, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Percent, Star,
} from 'lucide-react';

const NISAB_SILVER_GRAMS = 612.36;
const NISAB_SILVER_VORI  = 52.5;
const GRAMS_PER_VORI     = 11.664;

const fmtBDT = (n) => {
  if (!n && n !== 0) return '—';
  return '৳' + Number(n).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })
    + ', ' + d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ──────────────────────────────────────────────────────────────────────────────
export default function NisabSettingsModal({
  initialSilverPerGram  = 0,
  initialSilverPerVori  = 0,
  initialGoldPerGram    = 0,
  initialGoldPerVori    = 0,
  initialPriceUnit      = 'gram',
  initialNisab          = 0,
  initialApplyDeduction = false,
  onSave,
  onClose,
}) {
  const [tab,           setTab]          = useState('auto');
  const [fetchState,    setFetchState]   = useState('idle');
  const [apiData,       setApiData]      = useState(null);
  const [fetchError,    setFetchError]   = useState('');
  const [lastFetched,   setLastFetched]  = useState(null);
  const [showAllKarats, setShowAllKarats] = useState(false);
  const [applyDeduction, setApplyDeduction] = useState(initialApplyDeduction);

  // Manual inputs
  const [priceUnit,     setPriceUnit]     = useState(initialPriceUnit);
  const [silverPerGram, setSilverPerGram] = useState(initialSilverPerGram || '');
  const [silverPerVori, setSilverPerVori] = useState(initialSilverPerVori || '');
  const [goldPerGram,   setGoldPerGram]   = useState(initialGoldPerGram   || '');
  const [goldPerVori,   setGoldPerVori]   = useState(initialGoldPerVori   || '');
  const [manualApplyDeduction, setManualApplyDeduction] = useState(initialApplyDeduction);
  const [saving, setSaving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    setFetchState('loading');
    setFetchError('');
    try {
      const res  = await fetch('/api/metal-prices');
      const data = await res.json();
      if (data.primarySilver?.perGram && data.primaryGold?.perGram) {
        setApiData(data);
        setLastFetched(data.fetchedAt);
        setFetchState('success');
      } else {
        throw new Error(data.error || 'Incomplete price data returned.');
      }
    } catch (err) {
      setFetchState('error');
      setFetchError(err.message || 'Network error. Check your connection.');
    }
  }, []);

  useEffect(() => {
    if (tab === 'auto' && fetchState === 'idle') fetchPrices();
  }, [tab, fetchState, fetchPrices]);

  // ── Auto derived values ────────────────────────────────────────────────────
  const autoSilverGram = apiData ? (applyDeduction ? apiData.primarySilver.perGramMinus15 : apiData.primarySilver.perGram) : null;
  const autoSilverVori = apiData ? (applyDeduction ? apiData.primarySilver.perVoriMinus15 : apiData.primarySilver.perVori) : null;
  const autoGoldGram   = apiData ? (applyDeduction ? apiData.primaryGold.perGramMinus15   : apiData.primaryGold.perGram)   : null;
  const autoGoldVori   = apiData ? (applyDeduction ? apiData.primaryGold.perVoriMinus15   : apiData.primaryGold.perVori)   : null;
  const autoNisab      = apiData ? (applyDeduction ? apiData.nisab.withMinus15 : apiData.nisab.full) : null;

  // ── Manual sync ────────────────────────────────────────────────────────────
  const handleSilverGram = (v) => { setSilverPerGram(v); const n = parseFloat(v)||0; setSilverPerVori(n ? (n * GRAMS_PER_VORI).toFixed(0) : ''); };
  const handleSilverVori = (v) => { setSilverPerVori(v); const n = parseFloat(v)||0; setSilverPerGram(n ? (n / GRAMS_PER_VORI).toFixed(2) : ''); };
  const handleGoldGram   = (v) => { setGoldPerGram(v);   const n = parseFloat(v)||0; setGoldPerVori(n ? (n * GRAMS_PER_VORI).toFixed(0) : ''); };
  const handleGoldVori   = (v) => { setGoldPerVori(v);   const n = parseFloat(v)||0; setGoldPerGram(n ? (n / GRAMS_PER_VORI).toFixed(2) : ''); };

  const manualSilverGram = parseFloat(silverPerGram) || 0;
  const manualSilverVori = parseFloat(silverPerVori) || 0;
  const rawManualNisab   = priceUnit === 'gram' ? manualSilverGram * NISAB_SILVER_GRAMS : manualSilverVori * NISAB_SILVER_VORI;
  const manualNisab      = manualApplyDeduction ? rawManualNisab * 0.85 : rawManualNisab;
  const manualIsValid    = manualNisab > 0;

  // ── Apply fetched → manual fields ─────────────────────────────────────────
  const applyFetchedToManual = () => {
    if (!apiData) return;
    setSilverPerGram(String(autoSilverGram));
    setSilverPerVori(String(autoSilverVori));
    setGoldPerGram(String(autoGoldGram));
    setGoldPerVori(String(autoGoldVori));
    setManualApplyDeduction(applyDeduction);
    setTab('manual');
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const doSave = async (payload) => {
    setSaving(true);
    await onSave(payload);
    setSaving(false);
  };

  const handleSaveAuto = () => doSave({
    silverPricePerGram: autoSilverGram,
    silverPricePerVori: autoSilverVori,
    goldPricePerGram:   autoGoldGram,
    goldPricePerVori:   autoGoldVori,
    nisabThreshold:     autoNisab,
    priceUnit:          'gram',
    priceSource:        'auto',
    applyDeduction,
    deductionPct:       applyDeduction ? 15 : 0,
    lastFetched:        apiData?.fetchedAt,
    usdToBdt:           apiData?.usdToBdt,
    dataSource:         apiData?.source,
  });

  const handleSaveManual = () => doSave({
    silverPricePerGram: manualSilverGram,
    silverPricePerVori: manualSilverVori || manualSilverGram * GRAMS_PER_VORI,
    goldPricePerGram:   parseFloat(goldPerGram) || 0,
    goldPricePerVori:   parseFloat(goldPerVori) || (parseFloat(goldPerGram)||0) * GRAMS_PER_VORI,
    nisabThreshold:     manualNisab,
    priceUnit,
    priceSource:        'manual',
    applyDeduction:     manualApplyDeduction,
    deductionPct:       manualApplyDeduction ? 15 : 0,
    lastFetched:        new Date().toISOString(),
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[94vh] flex flex-col">

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">Nisab Settings</h2>
                <p className="text-xs text-gray-500">Gold & Silver — BAJUS Official Rates</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <TabBtn active={tab === 'auto'}   onClick={() => setTab('auto')}>
              <Wifi className="w-3.5 h-3.5" /> Auto Fetch
            </TabBtn>
            <TabBtn active={tab === 'manual'} onClick={() => setTab('manual')}>
              <Edit3 className="w-3.5 h-3.5" /> Manual Input
            </TabBtn>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ═══ AUTO TAB ═══ */}
          {tab === 'auto' && (<>
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-800">Live BAJUS Rates — goldr.org</span>
              </div>
              <a href="https://www.goldr.org/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:underline">
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {fetchState === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="relative w-14 h-14">
                  <div className="w-14 h-14 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                  <Coins className="w-5 h-5 text-emerald-600 absolute inset-0 m-auto" />
                </div>
                <p className="text-gray-600 font-medium text-sm">Fetching today's BAJUS rates…</p>
                <p className="text-gray-400 text-xs">Connecting to goldr.org</p>
              </div>
            )}

            {fetchState === 'error' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <WifiOff className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800 text-sm mb-1">Could not fetch prices</p>
                    <p className="text-xs text-red-600 leading-relaxed">{fetchError}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchPrices} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors">
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                  <button onClick={() => setTab('manual')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors">
                    <Edit3 className="w-4 h-4" /> Enter Manually
                  </button>
                </div>
              </div>
            )}

            {fetchState === 'success' && apiData && (<>
              {/* Meta row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {fmtTime(lastFetched)}
                </div>
                <button onClick={fetchPrices} className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {/* Spot fallback warning */}
              {apiData.isSpotFallback && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700 leading-relaxed">
                    <strong>Using international spot prices</strong> — could not reach goldr.org.
                    These are not official BAJUS rates. Enter prices manually for accuracy.
                    {apiData.scrapeError && <span className="block text-amber-500 mt-0.5">{apiData.scrapeError}</span>}
                  </div>
                </div>
              )}

              {/* Exchange rate */}
              {apiData.usdToBdt && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Exchange rate (from goldr.org)</span>
                  <span className="font-semibold text-gray-700">1 USD = ৳{Number(apiData.usdToBdt).toFixed(2)}</span>
                </div>
              )}

              {/* 15% deduction toggle */}
              <DeductionToggle
                enabled={applyDeduction}
                onChange={setApplyDeduction}
                rawNisab={apiData.nisab.full}
                deductedNisab={apiData.nisab.withMinus15}
              />

              {/* Primary price cards */}
              <div className="grid grid-cols-2 gap-3">
                <PriceCard
                  label="Gold (22K)" color="amber"
                  perGram={autoGoldGram} perVori={autoGoldVori}
                  rawPerGram={apiData.primaryGold.perGram}
                  deducted={applyDeduction}
                />
                <PriceCard
                  label="Silver (Traditional)" color="slate"
                  perGram={autoSilverGram} perVori={autoSilverVori}
                  rawPerGram={apiData.primarySilver.perGram}
                  deducted={applyDeduction}
                  note="★ Used for Nisab calculation"
                />
              </div>

              {/* All karats expandable */}
              <button
                onClick={() => setShowAllKarats(!showAllKarats)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-600 font-medium transition-colors"
              >
                <span>Show all karat prices</span>
                {showAllKarats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAllKarats && <AllKaratsTable data={apiData} applyDeduction={applyDeduction} />}

              {/* Nisab result */}
              <NisabResultCard nisab={autoNisab} deducted={applyDeduction} />

              {/* Buttons */}
              <div className="space-y-2 pt-1">
                <button onClick={handleSaveAuto} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? 'Saving…' : `Save — Nisab ${fmtBDT(autoNisab)}`}
                </button>
                <button onClick={applyFetchedToManual}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit prices before saving
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
            </>)}
          </>)}

          {/* ═══ MANUAL TAB ═══ */}
          {tab === 'manual' && (<>
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Edit3 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Enter prices from{' '}
                <a href="https://www.bajus.org/gold-price" target="_blank" rel="noopener noreferrer" className="underline font-medium">bajus.org</a>
                {' '}or{' '}
                <a href="https://www.goldr.org/" target="_blank" rel="noopener noreferrer" className="underline font-medium">goldr.org</a>.
                Typing per gram auto-fills per vori and vice versa.
              </p>
            </div>

            {/* Unit toggle */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Display unit</label>
              <div className="grid grid-cols-2 gap-2">
                {[['gram', 'Per Gram (g)'], ['vori', 'Per Vori / Tola']].map(([v, l]) => (
                  <button key={v} onClick={() => setPriceUnit(v)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      priceUnit === v ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <MetalInputGroup metal="Silver" color="slate" priceUnit={priceUnit}
              perGram={silverPerGram} perVori={silverPerVori}
              onGramChange={handleSilverGram} onVoriChange={handleSilverVori} />

            <MetalInputGroup metal="Gold" color="amber" priceUnit={priceUnit}
              perGram={goldPerGram} perVori={goldPerVori}
              onGramChange={handleGoldGram} onVoriChange={handleGoldVori} />

            {manualIsValid && (
              <DeductionToggle
                enabled={manualApplyDeduction}
                onChange={setManualApplyDeduction}
                rawNisab={rawManualNisab}
                deductedNisab={rawManualNisab * 0.85}
              />
            )}

            {manualIsValid && <NisabResultCard nisab={manualNisab} deducted={manualApplyDeduction} />}

            {manualIsValid && (
              <div className="bg-gray-50 rounded-xl p-3.5 text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-700 mb-1.5">Calculation breakdown</p>
                {priceUnit === 'gram'
                  ? <p>{fmtBDT(manualSilverGram)}/g × 612.36 g = <strong className="text-gray-800">{fmtBDT(rawManualNisab)}</strong></p>
                  : <p>{fmtBDT(parseFloat(silverPerVori))}/vori × 52.5 = <strong className="text-gray-800">{fmtBDT(rawManualNisab)}</strong></p>
                }
                {manualApplyDeduction && (
                  <p>{fmtBDT(rawManualNisab)} − 15% = <strong className="text-emerald-700">{fmtBDT(manualNisab)}</strong></p>
                )}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button onClick={handleSaveManual} disabled={saving || !manualIsValid}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saving ? 'Saving…' : manualIsValid ? `Save — Nisab ${fmtBDT(manualNisab)}` : 'Enter silver price to continue'}
              </button>
              <button onClick={() => { setTab('auto'); if (fetchState !== 'success') setFetchState('idle'); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors">
                <Wifi className="w-3.5 h-3.5" /> Try auto-fetch instead
              </button>
            </div>
          </>)}

          {/* Current Nisab footer */}
          {initialNisab > 0 && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-gray-500">
              <span>Currently saved Nisab</span>
              <div className="text-right">
                <span className="font-semibold text-gray-700">{fmtBDT(initialNisab)}</span>
                {initialApplyDeduction && <span className="ml-1.5 text-gray-400">(−15% applied)</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DeductionToggle
// ─────────────────────────────────────────────────────────────────────────────
function DeductionToggle({ enabled, onChange, rawNisab, deductedNisab }) {
  return (
    <div onClick={() => onChange(!enabled)}
      className={`cursor-pointer rounded-xl border-2 p-4 transition-all select-none ${
        enabled ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {enabled
            ? <ToggleRight className="w-6 h-6 text-emerald-600" />
            : <ToggleLeft  className="w-6 h-6 text-gray-400" />
          }
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className={`text-sm font-bold ${enabled ? 'text-emerald-900' : 'text-gray-700'}`}>
              Apply 15% BAJUS Deduction
            </p>
            {enabled && (
              <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-0.5">
                <Percent className="w-2.5 h-2.5" /> ON
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            BAJUS allows a 15% reduction from the market price when calculating Zakat on
            old jewellery. Tap to toggle — use this if your scholar recommends the resale value.
          </p>
          {rawNisab > 0 && (
            <div className="flex items-center gap-2 mt-2.5 text-xs font-semibold flex-wrap">
              <span className={enabled ? 'text-gray-400 line-through' : 'text-emerald-700'}>
                {fmtBDT(rawNisab)}
              </span>
              {enabled && <>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span className="text-emerald-700">
                  {fmtBDT(deductedNisab)} <span className="font-normal text-gray-400">(after −15%)</span>
                </span>
              </>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NisabResultCard
// ─────────────────────────────────────────────────────────────────────────────
function NisabResultCard({ nisab, deducted }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 text-white">
      <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full transform translate-x-8 -translate-y-8" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full transform -translate-x-6 translate-y-6" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Star className="w-4 h-4 text-emerald-200" fill="currentColor" />
          <span className="text-emerald-100 text-xs font-bold uppercase tracking-wide">Nisab Threshold</span>
          {deducted && (
            <span className="ml-auto px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold text-emerald-100 flex items-center gap-1">
              <Percent className="w-3 h-3" /> −15% applied
            </span>
          )}
        </div>
        <p className="text-3xl font-bold tracking-tight">{fmtBDT(nisab)}</p>
        <p className="text-emerald-200 text-xs mt-1.5">
          52.5 Tola (612.36g) × Traditional silver{deducted ? ' × 0.85 (−15%)' : ''}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PriceCard
// ─────────────────────────────────────────────────────────────────────────────
function PriceCard({ label, color, perGram, perVori, rawPerGram, deducted, note }) {
  const s = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-400', text: 'text-amber-700' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-100', dot: 'bg-slate-400', text: 'text-slate-600' },
  }[color];
  return (
    <div className={`${s.bg} border ${s.border} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
        <span className={`text-xs font-bold ${s.text}`}>{label}</span>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Per gram</p>
          <p className="font-bold text-gray-900">{fmtBDT(perGram)}</p>
          {deducted && <p className="text-xs text-gray-400 line-through">{fmtBDT(rawPerGram)}</p>}
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Per vori</p>
          <p className="font-bold text-gray-900">{fmtBDT(perVori)}</p>
        </div>
        {note && <p className="text-xs text-emerald-600 font-medium pt-0.5">{note}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AllKaratsTable
// ─────────────────────────────────────────────────────────────────────────────
function AllKaratsTable({ data, applyDeduction }) {
  const adj = (n) => n ? (applyDeduction ? Math.round(n * 0.85) : n) : null;

  const goldRows   = [['22K', data.gold.karat22], ['21K', data.gold.karat21], ['18K', data.gold.karat18], ['Traditional', data.gold.traditional]];
  const silverRows = [['22K', data.silver.karat22], ['21K', data.silver.karat21], ['18K', data.silver.karat18], ['Traditional ★', data.silver.traditional]];

  return (
    <div className="space-y-3">
      {[
        { label: 'Gold', rows: goldRows, color: 'amber' },
        { label: 'Silver', rows: silverRows, color: 'slate' },
      ].map(({ label, rows, color }) => {
        const s = {
          amber: { bg: 'bg-amber-50', border: 'border-amber-100', head: 'text-amber-700', dot: 'bg-amber-400', sub: 'border-amber-100', row: 'border-amber-50' },
          slate: { bg: 'bg-slate-50', border: 'border-slate-100', head: 'text-slate-700', dot: 'bg-slate-400', sub: 'border-slate-100', row: 'border-slate-50' },
        }[color];
        return (
          <div key={label} className={`${s.bg} border ${s.border} rounded-xl overflow-hidden`}>
            <div className={`px-4 py-2.5 border-b ${s.sub} flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className={`text-xs font-bold ${s.head}`}>{label} (BAJUS official)</span>
              {applyDeduction && <span className={`ml-auto text-xs ${s.head} opacity-70 font-medium`}>−15% applied</span>}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${s.row}`}>
                  <th className={`text-left px-4 py-2 ${s.head} font-semibold`}>Karat</th>
                  <th className={`text-right px-4 py-2 ${s.head} font-semibold`}>Per Gram</th>
                  <th className={`text-right px-4 py-2 ${s.head} font-semibold`}>Per Vori</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([k, p]) => {
                  const isNisabRow = k === 'Traditional ★';
                  return (
                    <tr key={k} className={`border-b ${s.row} last:border-0 ${isNisabRow ? 'bg-emerald-50' : ''}`}>
                      <td className={`px-4 py-2.5 font-medium ${isNisabRow ? 'text-emerald-700' : 'text-gray-700'}`}>{k}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${isNisabRow ? 'text-emerald-800' : 'text-gray-800'}`}>{fmtBDT(adj(p?.perGram))}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${isNisabRow ? 'text-emerald-800' : 'text-gray-800'}`}>{fmtBDT(adj(p?.perVori))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MetalInputGroup
// ─────────────────────────────────────────────────────────────────────────────
function MetalInputGroup({ metal, color, priceUnit, perGram, perVori, onGramChange, onVoriChange }) {
  const dot = { amber: 'bg-amber-400', slate: 'bg-slate-400' }[color];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <label className="text-sm font-bold text-gray-800">{metal} Price (৳)</label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="Per Gram" value={perGram} onChange={onGramChange} />
        <NumberInput label="Per Vori (11.664g)" value={perVori} onChange={onVoriChange} />
      </div>
      {metal === 'Silver' && (perGram || perVori) && (
        <p className="text-xs text-gray-400 pl-1">
          Nisab (52.5 vori) = <span className="font-semibold text-emerald-700">
            {fmtBDT(Math.round((parseFloat(perGram) || 0) * 612.36))}
          </span>
        </p>
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1.5">{label}</label>
      <div className={`flex rounded-xl border-2 transition-colors focus-within:border-gray-900 bg-white ${value ? 'border-gray-300' : 'border-gray-200'}`}>
        <span className="flex items-center pl-3 text-gray-400 text-sm select-none">৳</span>
        <input type="number" min="0" step="1" value={value}
          onChange={(e) => onChange(e.target.value)} placeholder="0"
          className="flex-1 px-2 py-2.5 text-sm bg-transparent outline-none text-gray-900 rounded-r-xl" />
      </div>
    </div>
  );
}

function TabBtn({ children, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}>
      {children}
    </button>
  );
}
