// src/components/zakat/NisabSettingsModal.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, RefreshCw, Loader2, CheckCircle2, AlertCircle, Edit3,
  Wifi, WifiOff, Calculator, ExternalLink, Clock,
  Coins, ArrowRight, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Percent, Star, Info,
} from 'lucide-react';

const NISAB_SILVER_GRAMS = 612.36;  // 52.5 Tola × 11.664 g
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

// ─────────────────────────────────────────────────────────────────────────────
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
  const [tab,            setTab]           = useState('auto');
  const [fetchState,     setFetchState]    = useState('idle'); // idle|loading|success|error
  const [apiData,        setApiData]       = useState(null);
  const [fetchError,     setFetchError]    = useState('');
  const [lastFetched,    setLastFetched]   = useState(null);
  const [showAllKarats,  setShowAllKarats] = useState(false);

  // 15% deduction — only applies to GOLD standard Nisab, never silver
  const [applyDeduction,       setApplyDeduction]       = useState(initialApplyDeduction);
  const [manualApplyDeduction, setManualApplyDeduction] = useState(initialApplyDeduction);

  // Manual input state
  const [priceUnit,     setPriceUnit]     = useState(initialPriceUnit);
  const [silverPerGram, setSilverPerGram] = useState(initialSilverPerGram || '');
  const [silverPerVori, setSilverPerVori] = useState(initialSilverPerVori || '');
  const [goldPerGram,   setGoldPerGram]   = useState(initialGoldPerGram   || '');
  const [goldPerVori,   setGoldPerVori]   = useState(initialGoldPerVori   || '');
  const [saving,        setSaving]        = useState(false);

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

  // ── Auto derived values ─────────────────────────────────────────────────────
  // Silver: NEVER deducted — Traditional silver price is always used as-is for Nisab
  const autoSilverGram = apiData?.primarySilver?.perGram  ?? null;
  const autoSilverVori = apiData?.primarySilver?.perVori  ?? null;
  // Gold: deduction applies only when user opts in (gold standard Nisab)
  const autoGoldGram   = apiData ? (applyDeduction ? apiData.primaryGold.perGramMinus15 : apiData.primaryGold.perGram) : null;
  const autoGoldVori   = apiData ? (applyDeduction ? apiData.primaryGold.perVoriMinus15 : apiData.primaryGold.perVori) : null;
  // Nisab is always from Traditional silver — no deduction
  const autoNisab      = apiData?.nisab?.full ?? null;

  // ── Manual sync ─────────────────────────────────────────────────────────────
  const handleSilverGram = (v) => { setSilverPerGram(v); const n = parseFloat(v)||0; setSilverPerVori(n ? (n * GRAMS_PER_VORI).toFixed(0) : ''); };
  const handleSilverVori = (v) => { setSilverPerVori(v); const n = parseFloat(v)||0; setSilverPerGram(n ? (n / GRAMS_PER_VORI).toFixed(2) : ''); };
  const handleGoldGram   = (v) => { setGoldPerGram(v);   const n = parseFloat(v)||0; setGoldPerVori(n ? (n * GRAMS_PER_VORI).toFixed(0) : ''); };
  const handleGoldVori   = (v) => { setGoldPerVori(v);   const n = parseFloat(v)||0; setGoldPerGram(n ? (n / GRAMS_PER_VORI).toFixed(2) : ''); };

  const manualSilverGram = parseFloat(silverPerGram) || 0;
  const manualSilverVori = parseFloat(silverPerVori) || 0;
  // Manual Nisab: always raw silver price — no deduction
  const rawManualNisab   = priceUnit === 'gram'
    ? manualSilverGram * NISAB_SILVER_GRAMS
    : manualSilverVori * NISAB_SILVER_VORI;
  const manualIsValid = rawManualNisab > 0;

  // ── Apply fetched prices → manual fields ────────────────────────────────────
  const applyFetchedToManual = () => {
    if (!apiData) return;
    // Silver: raw price (no deduction)
    setSilverPerGram(String(autoSilverGram));
    setSilverPerVori(String(autoSilverVori));
    // Gold: apply deduction if enabled
    setGoldPerGram(String(autoGoldGram));
    setGoldPerVori(String(autoGoldVori));
    setManualApplyDeduction(applyDeduction);
    setTab('manual');
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
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
    nisabThreshold:     autoNisab,       // always Traditional silver, no deduction
    priceUnit:          'gram',
    priceSource:        'auto',
    applyDeduction,                       // stored to remember gold deduction pref
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
    nisabThreshold:     rawManualNisab,  // always raw silver, no deduction
    priceUnit,
    priceSource:        'manual',
    applyDeduction:     manualApplyDeduction,
    deductionPct:       manualApplyDeduction ? 15 : 0,
    lastFetched:        new Date().toISOString(),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — full-height sheet on mobile, centered card on desktop */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: 'min(94vh, 700px)' }}>

        {/* ── Sticky header ── */}
        <div className="flex-shrink-0 border-b border-gray-100 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calculator className="w-4.5 h-4.5 text-emerald-700" style={{width:'18px',height:'18px'}} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base leading-tight">Nisab Settings</h2>
                <p className="text-xs text-gray-500">Gold & Silver — BAJUS Official Rates</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <TabBtn active={tab === 'auto'}   onClick={() => setTab('auto')}>
              <Wifi className="w-3.5 h-3.5" /> Auto Fetch
            </TabBtn>
            <TabBtn active={tab === 'manual'} onClick={() => setTab('manual')}>
              <Edit3 className="w-3.5 h-3.5" /> Manual Input
            </TabBtn>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">

          {/* ════════════════════════════════════════
              AUTO FETCH TAB
          ════════════════════════════════════════ */}
          {tab === 'auto' && (<>

            {/* Source badge — BAJUS official link */}
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="text-sm font-semibold text-emerald-800">Live BAJUS Official Rates</span>
              </div>
              <a href="https://www.bajus.org/gold-price" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:underline flex-shrink-0">
                bajus.org <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Loading */}
            {fetchState === 'loading' && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="relative w-12 h-12">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                  <Coins className="w-4 h-4 text-emerald-600 absolute inset-0 m-auto" />
                </div>
                <p className="text-gray-600 font-medium text-sm">Fetching today's BAJUS rates…</p>
              </div>
            )}

            {/* Error */}
            {fetchState === 'error' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                  <WifiOff className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800 text-sm mb-0.5">Could not fetch prices</p>
                    <p className="text-xs text-red-600 leading-relaxed">{fetchError}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchPrices}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                  <button onClick={() => setTab('manual')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors">
                    <Edit3 className="w-3.5 h-3.5" /> Enter Manually
                  </button>
                </div>
              </div>
            )}

            {/* Success */}
            {fetchState === 'success' && apiData && (<>

              {/* Fetch meta row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {fmtTime(lastFetched)}
                </div>
                <button onClick={fetchPrices}
                  className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {/* Spot fallback warning */}
              {apiData.isSpotFallback && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700 leading-relaxed">
                    <strong>Using international spot prices</strong> — could not reach the price source.
                    Enter prices manually from{' '}
                    <a href="https://www.bajus.org/gold-price" target="_blank" rel="noopener noreferrer"
                      className="underline font-medium">bajus.org</a> for accuracy.
                    {apiData.scrapeError && <span className="block text-amber-500 mt-0.5 text-xs">{apiData.scrapeError}</span>}
                  </div>
                </div>
              )}

              {/* Exchange rate */}
              {apiData.usdToBdt && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Exchange rate</span>
                  <span className="font-semibold text-gray-700">1 USD = ৳{Number(apiData.usdToBdt).toFixed(2)}</span>
                </div>
              )}

              {/* Price cards — Gold (with deduction toggle) + Silver (no deduction) */}
              <div className="grid grid-cols-2 gap-2">
                <PriceCard
                  label="Gold (22K)" color="amber"
                  perGram={autoGoldGram} perVori={autoGoldVori}
                  rawPerGram={apiData.primaryGold.perGram}
                  deducted={applyDeduction}
                />
                <PriceCard
                  label="Silver (Traditional)" color="slate"
                  perGram={autoSilverGram} perVori={autoSilverVori}
                  rawPerGram={null}
                  deducted={false}
                  note="★ Nisab basis"
                />
              </div>

              {/* Gold 15% deduction toggle — gold only, clearly labeled */}
              <GoldDeductionToggle
                enabled={applyDeduction}
                onChange={setApplyDeduction}
                rawGoldGram={apiData.primaryGold.perGram}
                deductedGoldGram={apiData.primaryGold.perGramMinus15}
              />

              {/* All karats expandable */}
              <button onClick={() => setShowAllKarats(!showAllKarats)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-600 font-medium transition-colors">
                <span>Show all karat prices</span>
                {showAllKarats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAllKarats && <AllKaratsTable data={apiData} applyGoldDeduction={applyDeduction} />}

              {/* Nisab result — always Traditional silver, no deduction */}
              <NisabResultCard nisab={autoNisab} />

              {/* Action buttons */}
              <div className="space-y-2 pt-1 pb-1">
                <button onClick={handleSaveAuto} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-colors">
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

          {/* ════════════════════════════════════════
              MANUAL INPUT TAB
          ════════════════════════════════════════ */}
          {tab === 'manual' && (<>

            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Enter today's prices from the official{' '}
                <a href="https://www.bajus.org/gold-price" target="_blank" rel="noopener noreferrer"
                  className="underline font-medium">BAJUS website</a>.
                Type in either gram or vori — the other fills automatically.
              </p>
            </div>

            {/* Unit toggle */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Display unit</label>
              <div className="grid grid-cols-2 gap-2">
                {[['gram', 'Per Gram (g)'], ['vori', 'Per Vori / Tola']].map(([v, l]) => (
                  <button key={v} onClick={() => setPriceUnit(v)}
                    className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      priceUnit === v
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Silver input */}
            <MetalInputGroup metal="Silver" color="slate" priceUnit={priceUnit}
              perGram={silverPerGram} perVori={silverPerVori}
              onGramChange={handleSilverGram} onVoriChange={handleSilverVori}
              note="Enter Traditional (Sanaton) silver price for accurate Nisab" />

            {/* Gold input */}
            <MetalInputGroup metal="Gold" color="amber" priceUnit={priceUnit}
              perGram={goldPerGram} perVori={goldPerVori}
              onGramChange={handleGoldGram} onVoriChange={handleGoldVori} />

            {/* Gold 15% deduction toggle — only for gold, manual tab */}
            {(parseFloat(goldPerGram) > 0 || parseFloat(goldPerVori) > 0) && (
              <GoldDeductionToggle
                enabled={manualApplyDeduction}
                onChange={setManualApplyDeduction}
                rawGoldGram={parseFloat(goldPerGram) || 0}
                deductedGoldGram={Math.round((parseFloat(goldPerGram) || 0) * 0.85)}
              />
            )}

            {/* Nisab preview — always raw Traditional silver */}
            {manualIsValid && <NisabResultCard nisab={rawManualNisab} />}

            {/* Calculation breakdown */}
            {manualIsValid && (
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-600 mb-1">Calculation breakdown</p>
                {priceUnit === 'gram'
                  ? <p>{fmtBDT(manualSilverGram)}/g × 612.36 g = <strong className="text-gray-800">{fmtBDT(rawManualNisab)}</strong></p>
                  : <p>{fmtBDT(parseFloat(silverPerVori))}/vori × 52.5 = <strong className="text-gray-800">{fmtBDT(rawManualNisab)}</strong></p>
                }
                <p className="text-gray-400 italic">No deduction applied — silver Nisab uses full market price.</p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2 pb-1">
              <button onClick={handleSaveManual} disabled={saving || !manualIsValid}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saving ? 'Saving…' : manualIsValid ? `Save — Nisab ${fmtBDT(rawManualNisab)}` : 'Enter silver price to continue'}
              </button>
              <button onClick={() => { setTab('auto'); if (fetchState !== 'success') setFetchState('idle'); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors">
                <Wifi className="w-3.5 h-3.5" /> Try auto-fetch instead
              </button>
            </div>
          </>)}

          {/* Currently saved Nisab footer */}
          {initialNisab > 0 && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-500">
              <span>Currently saved Nisab</span>
              <span className="font-semibold text-gray-700">{fmtBDT(initialNisab)}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GoldDeductionToggle  (gold standard Nisab only — silver is never deducted)
// ─────────────────────────────────────────────────────────────────────────────
function GoldDeductionToggle({ enabled, onChange, rawGoldGram, deductedGoldGram }) {
  return (
    <div onClick={() => onChange(!enabled)}
      className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all select-none ${
        enabled ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {enabled
            ? <ToggleRight className="w-5 h-5 text-amber-600" />
            : <ToggleLeft  className="w-5 h-5 text-gray-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className={`text-sm font-bold ${enabled ? 'text-amber-900' : 'text-gray-700'}`}>
              Apply 15% Deduction on Gold
            </p>
            {enabled && (
              <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-xs font-bold rounded-full flex items-center gap-0.5">
                <Percent className="w-2.5 h-2.5" /> ON
              </span>
            )}
          </div>
          {/* Updated description text as per user request */}
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-medium text-gray-600">For gold standard Nisab only.</span>{' '}
            BAJUS officially deducts 17% for old gold, but Bangladeshi Ulama recommend
            15% — so 15% is used here. Not applicable for silver-based Nisab.
          </p>
          {rawGoldGram > 0 && (
            <div className="flex items-center gap-2 mt-2 text-xs font-semibold flex-wrap">
              <span className={enabled ? 'text-gray-400 line-through' : 'text-amber-700'}>
                {fmtBDT(rawGoldGram)}/g
              </span>
              {enabled && <>
                <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-amber-700">
                  {fmtBDT(deductedGoldGram)}/g{' '}
                  <span className="font-normal text-gray-400">(after −15%)</span>
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
// NisabResultCard  (always Traditional silver, no deduction badge needed)
// ─────────────────────────────────────────────────────────────────────────────
function NisabResultCard({ nisab }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-4 text-white">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full transform translate-x-6 -translate-y-6" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full transform -translate-x-4 translate-y-4" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1.5">
          <Star className="w-3.5 h-3.5 text-emerald-200" fill="currentColor" />
          <span className="text-emerald-100 text-xs font-bold uppercase tracking-wide">Nisab Threshold</span>
        </div>
        <p className="text-3xl font-bold tracking-tight">{fmtBDT(nisab)}</p>
        <p className="text-emerald-200 text-xs mt-1">
          52.5 Tola (612.36 g) × Traditional silver price
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
    <div className={`${s.bg} border ${s.border} rounded-xl p-3`}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
        <span className={`text-xs font-bold ${s.text} leading-tight`}>{label}</span>
      </div>
      <div className="space-y-1.5">
        <div>
          <p className="text-xs text-gray-400">Per gram</p>
          <p className="font-bold text-gray-900 text-sm">{fmtBDT(perGram)}</p>
          {deducted && rawPerGram && (
            <p className="text-xs text-gray-400 line-through">{fmtBDT(rawPerGram)}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-400">Per vori</p>
          <p className="font-bold text-gray-900 text-sm">{fmtBDT(perVori)}</p>
        </div>
        {note && (
          <p className="text-xs text-emerald-600 font-semibold pt-0.5">{note}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AllKaratsTable  (gold deduction applies to gold only)
// ─────────────────────────────────────────────────────────────────────────────
function AllKaratsTable({ data, applyGoldDeduction }) {
  // Gold: apply deduction if toggled
  const adjGold   = (n) => n ? (applyGoldDeduction ? Math.round(n * 0.85) : n) : null;
  // Silver: NEVER deducted
  const adjSilver = (n) => n ?? null;

  const goldRows = [
    ['22K',         data.gold.karat22],
    ['21K',         data.gold.karat21],
    ['18K',         data.gold.karat18],
    ['Traditional', data.gold.traditional],
  ];
  const silverRows = [
    ['22K',            data.silver.karat22],
    ['21K',            data.silver.karat21],
    ['18K',            data.silver.karat18],
    ['Traditional ★',  data.silver.traditional],  // ★ = Nisab basis
  ];

  return (
    <div className="space-y-2">
      {/* Gold table */}
      <KaratTable
        label="Gold" color="amber" rows={goldRows}
        adjFn={adjGold}
        deducted={applyGoldDeduction}
        headerNote={applyGoldDeduction ? '−15% applied' : null}
      />
      {/* Silver table — no deduction, Traditional row highlighted */}
      <KaratTable
        label="Silver" color="slate" rows={silverRows}
        adjFn={adjSilver}
        deducted={false}
        headerNote="No deduction (silver standard)"
        nisabRow="Traditional ★"
      />
    </div>
  );
}

function KaratTable({ label, color, rows, adjFn, deducted, headerNote, nisabRow }) {
  const s = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', head: 'text-amber-700', dot: 'bg-amber-400', rowBorder: 'border-amber-50' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-100', head: 'text-slate-700', dot: 'bg-slate-400', rowBorder: 'border-slate-50' },
  }[color];
  return (
    <div className={`${s.bg} border ${s.border} rounded-xl overflow-hidden`}>
      <div className={`px-3 py-2 border-b ${s.border} flex items-center gap-2`}>
        <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
        <span className={`text-xs font-bold ${s.head}`}>{label} (BAJUS)</span>
        {headerNote && (
          <span className={`ml-auto text-xs font-medium ${deducted ? s.head + ' opacity-70' : 'text-gray-400'}`}>
            {headerNote}
          </span>
        )}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className={`border-b ${s.rowBorder}`}>
            <th className={`text-left px-3 py-2 ${s.head} font-semibold`}>Karat</th>
            <th className={`text-right px-3 py-2 ${s.head} font-semibold`}>Per Gram</th>
            <th className={`text-right px-3 py-2 ${s.head} font-semibold`}>Per Vori</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, p]) => {
            const isNisab = k === nisabRow;
            return (
              <tr key={k} className={`border-b ${s.rowBorder} last:border-0 ${isNisab ? 'bg-emerald-50' : ''}`}>
                <td className={`px-3 py-2 font-medium ${isNisab ? 'text-emerald-700' : 'text-gray-700'}`}>{k}</td>
                <td className={`px-3 py-2 text-right font-semibold ${isNisab ? 'text-emerald-800' : 'text-gray-800'}`}>
                  {fmtBDT(adjFn(p?.perGram))}
                </td>
                <td className={`px-3 py-2 text-right font-semibold ${isNisab ? 'text-emerald-800' : 'text-gray-800'}`}>
                  {fmtBDT(adjFn(p?.perVori))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MetalInputGroup
// ─────────────────────────────────────────────────────────────────────────────
function MetalInputGroup({ metal, color, priceUnit, perGram, perVori, onGramChange, onVoriChange, note }) {
  const dot = { amber: 'bg-amber-400', slate: 'bg-slate-400' }[color];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dot} flex-shrink-0`} />
        <label className="text-sm font-bold text-gray-800">{metal} Price (৳)</label>
      </div>
      {note && <p className="text-xs text-gray-400 -mt-1 pl-4">{note}</p>}
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Per Gram" value={perGram} onChange={onGramChange} />
        <NumberInput label="Per Vori" value={perVori} onChange={onVoriChange} />
      </div>
      {metal === 'Silver' && (perGram || perVori) && (
        <p className="text-xs text-gray-400 pl-1">
          Nisab = <span className="font-semibold text-emerald-700">
            {fmtBDT(Math.round((parseFloat(perGram) || 0) * 612.36))}
          </span>
          {' '}(612.36 g × price/gram)
        </p>
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <div className={`flex rounded-xl border-2 transition-colors focus-within:border-gray-900 bg-white ${value ? 'border-gray-300' : 'border-gray-200'}`}>
        <span className="flex items-center pl-2.5 text-gray-400 text-sm select-none">৳</span>
        <input type="number" min="0" step="1" value={value}
          onChange={(e) => onChange(e.target.value)} placeholder="0"
          className="flex-1 px-2 py-2 text-sm bg-transparent outline-none text-gray-900 rounded-r-xl min-w-0" />
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
