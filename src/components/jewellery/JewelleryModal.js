// src/components/jewellery/JewelleryModal.js
'use client';

import { useState, useEffect } from 'react';
import {
  X, Gem, Scale, DollarSign, Info, ChevronDown,
  CheckCircle2, Loader2, Tag, Gift, ShoppingBag,
  CreditCard, FileText, AlertCircle, ArrowRight,
} from 'lucide-react';
import {
  WEIGHT, KARAT_OPTIONS, METAL_OPTIONS, ACQUISITION_TYPES, ACQUISITION_LABELS,
  weightToGrams, formatWeight, fmtBDT,
} from '@/lib/jewelleryCollections';

const CATEGORIES = [
  'Necklace', 'Ring', 'Earring', 'Bracelet', 'Bangle',
  'Anklet', 'Nose Ring', 'Pendant', 'Chain', 'Other',
];

export default function JewelleryModal({ item, accounts = [], onSave, onClose }) {
  const isEdit = !!item;

  // ── Basic info ────────────────────────────────────────────────────────────
  const [name,        setName]        = useState(item?.name        || '');
  const [category,    setCategory]    = useState(item?.category    || 'Ring');
  const [metal,       setMetal]       = useState(item?.metal       || 'Gold');
  const [karat,       setKarat]       = useState(item?.karat       || '22K');
  const [notes,       setNotes]       = useState(item?.notes       || '');

  // ── Acquisition ───────────────────────────────────────────────────────────
  const [acquisitionType, setAcquisitionType] = useState(item?.acquisitionType || ACQUISITION_TYPES.PURCHASED);

  // ── Weight ────────────────────────────────────────────────────────────────
  const [wVori,  setWVori]  = useState(item?.weightVori  ?? '');
  const [wAna,   setWAna]   = useState(item?.weightAna   ?? '');
  const [wRoti,  setWRoti]  = useState(item?.weightRoti  ?? '');
  const [wPoint, setWPoint] = useState(item?.weightPoint ?? '');

  // ── Purchase price ────────────────────────────────────────────────────────
  const [purchaseGoldPrice, setPurchaseGoldPrice] = useState(item?.purchaseGoldPrice ?? '');
  const [purchaseVat,       setPurchaseVat]       = useState(item?.purchaseVat       ?? '5');
  const [purchaseMaking,    setPurchaseMaking]    = useState(item?.purchaseMaking    ?? '6');
  const [purchaseOther,     setPurchaseOther]     = useState(item?.purchaseOther     ?? '');
  const [purchaseTotal,     setPurchaseTotal]     = useState(item?.purchaseTotal     ?? '');
  const [usePurchaseManual, setUsePurchaseManual] = useState(item?.usePurchaseManual ?? false);
  const [purchaseDate,      setPurchaseDate]      = useState(
    item?.purchaseDate || new Date().toISOString().split('T')[0]
  );

  // ── Record as transaction (only for "purchased" type, only on Add) ────────
  const [recordTransaction, setRecordTransaction] = useState(false);
  const [txAccountId,       setTxAccountId]       = useState('');
  const [insufficientFunds, setInsufficientFunds] = useState(false);

  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  // ── Derived ───────────────────────────────────────────────────────────────
  const grams         = weightToGrams(wVori, wAna, wRoti, wPoint);
  const weightDisplay = formatWeight(Number(wVori)||0, Number(wAna)||0, Number(wRoti)||0, Number(wPoint)||0);

  const goldPriceAtPurchase = parseFloat(purchaseGoldPrice) || 0;
  const vatPct              = parseFloat(purchaseVat)    || 0;
  const makingPct           = parseFloat(purchaseMaking) || 0;
  const otherFlat           = parseFloat(purchaseOther)  || 0;
  const baseValue           = goldPriceAtPurchase * grams;
  const vatAmount           = Math.round(baseValue * vatPct / 100);
  const makingAmount        = Math.round(baseValue * makingPct / 100);
  const estimatedTotal      = Math.round(baseValue + vatAmount + makingAmount + otherFlat);

  const displayPurchaseTotal = usePurchaseManual
    ? (parseFloat(purchaseTotal) || 0)
    : estimatedTotal;

  // Is "purchased" & not edit (we only show record-transaction option on Add)
  const isPurchased    = acquisitionType === ACQUISITION_TYPES.PURCHASED;
  const canRecordTx    = isPurchased && !isEdit;

  // Selected account object
  const selectedAccount = accounts.find((a) => a.id === txAccountId);

  // Check balance whenever account or amount changes
  useEffect(() => {
    if (!recordTransaction || !selectedAccount || !displayPurchaseTotal) {
      setInsufficientFunds(false);
      return;
    }
    setInsufficientFunds(selectedAccount.balance < displayPurchaseTotal);
  }, [txAccountId, displayPurchaseTotal, recordTransaction, selectedAccount]);

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !txAccountId) setTxAccountId(accounts[0].id);
  }, [accounts]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name   = 'Name is required';
    if (grams <= 0)   e.weight = 'Enter at least one weight unit';
    if (recordTransaction && !txAccountId) e.account = 'Select an account';
    if (recordTransaction && insufficientFunds) e.funds = 'Insufficient balance in selected account';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      name:         name.trim(),
      category,
      metal,
      karat,
      notes:        notes.trim(),
      acquisitionType,
      // Weight
      weightVori:   Number(wVori)  || 0,
      weightAna:    Number(wAna)   || 0,
      weightRoti:   Number(wRoti)  || 0,
      weightPoint:  Number(wPoint) || 0,
      weightGrams:  grams,
      // Purchase info
      purchaseDate,
      purchaseGoldPrice: isPurchased ? (goldPriceAtPurchase || null) : null,
      purchaseVat:       isPurchased ? vatPct      : null,
      purchaseMaking:    isPurchased ? makingPct   : null,
      purchaseOther:     isPurchased ? (otherFlat || null) : null,
      purchaseTotal:     isPurchased ? (displayPurchaseTotal || null) : null,
      usePurchaseManual: isPurchased ? usePurchaseManual : false,
      // Transaction recording intent — page.js handles the actual write
      _recordTransaction: canRecordTx && recordTransaction && displayPurchaseTotal > 0,
      _txAccountId:       canRecordTx && recordTransaction ? txAccountId : null,
      _txAccountBalance:  canRecordTx && recordTransaction && selectedAccount ? selectedAccount.balance : null,
      _txAccountName:     canRecordTx && recordTransaction && selectedAccount ? selectedAccount.name : null,
      // Zakat value — starts null, set when user first checks price
      currentMarketValue:    item?.currentMarketValue    ?? null,
      currentDeductedValue:  item?.currentDeductedValue  ?? null,
      currentZakatValue:     item?.currentZakatValue     ?? null,
      currentPriceCheckedAt: item?.currentPriceCheckedAt ?? null,
    };

    await onSave(payload);
    setSaving(false);
  };

  const clamp = (val, max) => { const n = parseInt(val) || 0; return n < 0 ? 0 : n > max ? max : n; };

  const silverKarats = ['22K', '21K', '18K', 'Traditional'];
  const goldKarats   = ['22K', '21K', '18K', 'Traditional', '24K'];
  const karatList    = metal === 'Silver' ? silverKarats : goldKarats;
  useEffect(() => {
    if (metal === 'Silver' && !silverKarats.includes(karat)) setKarat('22K');
  }, [metal]);

  // ── Acquisition type icons/labels ─────────────────────────────────────────
  const ACQN_OPTIONS = [
    { value: ACQUISITION_TYPES.PURCHASED, label: 'Purchased',  icon: ShoppingBag },
    { value: ACQUISITION_TYPES.GIFT,      label: 'Gift',        icon: Gift        },
    { value: ACQUISITION_TYPES.INHERITED, label: 'Inherited',  icon: FileText    },
    { value: ACQUISITION_TYPES.OTHER,     label: 'Other',       icon: Info        },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: 'min(96vh, 760px)' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                <Gem className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">
                  {isEdit ? 'Edit Jewellery' : 'Add Jewellery'}
                </h2>
                <p className="text-xs text-gray-500">Track your gold &amp; silver</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Basic info ── */}
          <Section icon={<Tag className="w-4 h-4 text-amber-600" />} title="Basic Info">
            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="label-sm">Item Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Wedding Ring, Necklace…"
                  className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Category + Metal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-sm">Category</label>
                  <SelectField value={category} onChange={setCategory} options={CATEGORIES} />
                </div>
                <div>
                  <label className="label-sm">Metal</label>
                  <SelectField value={metal} onChange={setMetal} options={METAL_OPTIONS} />
                </div>
              </div>

              {/* Karat */}
              <div>
                <label className="label-sm">Karat / Purity</label>
                <div className="flex gap-2 flex-wrap">
                  {karatList.map(k => (
                    <button key={k} onClick={() => setKarat(k)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                        karat === k
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-amber-300 bg-white'
                      }`}>{k}</button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label-sm">Notes <span className="text-gray-400">(optional)</span></label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  rows={2} placeholder="e.g. Bought from X shop, gift from father, hallmark no…"
                  className="input-field resize-none"
                />
              </div>
            </div>
          </Section>

          {/* ── How did you acquire it? ── */}
          <Section icon={<Gift className="w-4 h-4 text-purple-500" />} title="How Was It Acquired?">
            <div className="grid grid-cols-4 gap-2">
              {ACQN_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => setAcquisitionType(value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    acquisitionType === value
                      ? 'border-purple-400 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Context hint */}
            <div className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-500 leading-relaxed">
              {acquisitionType === ACQUISITION_TYPES.PURCHASED && (
                <>📦 <strong>Purchased</strong> — you paid for this. Optionally record cost below and deduct from account.</>
              )}
              {acquisitionType === ACQUISITION_TYPES.GIFT && (
                <>🎁 <strong>Gift</strong> — received as a gift. No purchase cost recorded. Current market price used for Zakat.</>
              )}
              {acquisitionType === ACQUISITION_TYPES.INHERITED && (
                <>📜 <strong>Inherited</strong> — received through inheritance. No purchase cost. Current price used for Zakat.</>
              )}
              {acquisitionType === ACQUISITION_TYPES.OTHER && (
                <>ℹ️ <strong>Other</strong> — acquired in another way. Current market price used for Zakat.</>
              )}
            </div>
          </Section>

          {/* ── Weight ── */}
          <Section icon={<Scale className="w-4 h-4 text-blue-600" />} title="Weight">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Weight system:</strong> 1 Vori = 16 Ana = 96 Roti = 576 Point = 11.664g.
                Enter what you know — leave others at 0.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Vori', val: wVori, set: setWVori, max: 999 },
                { label: 'Ana',  val: wAna,  set: setWAna,  max: 15  },
                { label: 'Roti', val: wRoti, set: setWRoti, max: 5   },
                { label: 'Point',val: wPoint,set: setWPoint,max: 5   },
              ].map(({ label, val, set, max }) => (
                <div key={label}>
                  <label className="label-sm text-center block">{label}</label>
                  <input type="number" min="0" max={max} value={val}
                    onChange={e => set(clamp(e.target.value, max))}
                    placeholder="0"
                    className="input-field text-center text-base font-bold" />
                  <p className="text-xs text-gray-400 text-center mt-1">max {max}</p>
                </div>
              ))}
            </div>
            {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight}</p>}
            {grams > 0 && (
              <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Total weight</span>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">{weightDisplay || '—'}</p>
                  <p className="text-xs text-gray-400">{grams.toFixed(4)} grams</p>
                </div>
              </div>
            )}
          </Section>

          {/* ── Purchase price (only for "purchased") ── */}
          {isPurchased && (
            <Section icon={<DollarSign className="w-4 h-4 text-emerald-600" />} title="Purchase Price (optional)">

              <div className="mb-3">
                <label className="label-sm">Purchase Date</label>
                <input type="date" value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                  className="input-field" />
              </div>

              <div className="flex gap-2 mb-4">
                <ModeBtn active={!usePurchaseManual} onClick={() => setUsePurchaseManual(false)}>
                  Auto Calculate
                </ModeBtn>
                <ModeBtn active={usePurchaseManual} onClick={() => setUsePurchaseManual(true)}>
                  Enter Total Directly
                </ModeBtn>
              </div>

              {!usePurchaseManual ? (
                <div className="space-y-3">
                  <div>
                    <label className="label-sm">Gold/Silver Price Per Gram at Purchase (৳)</label>
                    <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-gray-900 bg-white">
                      <span className="flex items-center pl-3 text-gray-400 text-sm">৳</span>
                      <input type="number" min="0" value={purchaseGoldPrice}
                        onChange={e => setPurchaseGoldPrice(e.target.value)}
                        placeholder="0"
                        className="flex-1 px-2 py-2.5 text-sm bg-transparent outline-none text-gray-900" />
                      <span className="flex items-center pr-3 text-gray-400 text-xs">/gram</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <PctInput label="VAT (%)" value={purchaseVat} onChange={setPurchaseVat} />
                    <PctInput label="Making (%)" value={purchaseMaking} onChange={setPurchaseMaking} />
                    <div>
                      <label className="label-sm">Other (৳)</label>
                      <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-gray-900 bg-white">
                        <span className="flex items-center pl-2 text-gray-400 text-xs">৳</span>
                        <input type="number" min="0" value={purchaseOther}
                          onChange={e => setPurchaseOther(e.target.value)} placeholder="0"
                          className="flex-1 px-1.5 py-2.5 text-sm bg-transparent outline-none text-gray-900" />
                      </div>
                    </div>
                  </div>
                  {grams > 0 && goldPriceAtPurchase > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs space-y-1.5">
                      <p className="font-semibold text-emerald-800 mb-2">Estimated Purchase Cost</p>
                      <Row label="Base value"             val={fmtBDT(baseValue)} />
                      <Row label={`VAT (${vatPct}%)`}     val={fmtBDT(vatAmount)} />
                      <Row label={`Making (${makingPct}%)`} val={fmtBDT(makingAmount)} />
                      {otherFlat > 0 && <Row label="Other charges" val={fmtBDT(otherFlat)} />}
                      <div className="border-t border-emerald-200 pt-1.5 mt-1">
                        <Row label="Total paid" val={fmtBDT(estimatedTotal)} bold />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="label-sm">Total Amount Paid (৳)</label>
                  <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-gray-900 bg-white">
                    <span className="flex items-center pl-3 text-gray-400 text-sm">৳</span>
                    <input type="number" min="0" value={purchaseTotal}
                      onChange={e => setPurchaseTotal(e.target.value)} placeholder="0"
                      className="flex-1 px-2 py-2.5 text-sm bg-transparent outline-none text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Enter the full amount including all charges.</p>
                </div>
              )}

              {/* ── Record as transaction toggle ── */}
              {canRecordTx && displayPurchaseTotal > 0 && accounts.length > 0 && (
                <div className="mt-4">
                  {/* Toggle */}
                  <button
                    onClick={() => setRecordTransaction(!recordTransaction)}
                    className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      recordTransaction
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <div className="flex items-center gap-2.5">
                      <CreditCard className={`w-4 h-4 ${recordTransaction ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className={`text-sm font-bold ${recordTransaction ? 'text-emerald-800' : 'text-gray-700'}`}>
                          Deduct from account &amp; record as expense
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Creates an expense transaction of {fmtBDT(displayPurchaseTotal)} and deducts from selected account
                        </p>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full flex items-center transition-all flex-shrink-0 ${
                      recordTransaction ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                    }`}>
                      <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow-sm" />
                    </div>
                  </button>

                  {/* Account selector */}
                  {recordTransaction && (
                    <div className="mt-3 space-y-2">
                      <label className="label-sm">Deduct from account</label>
                      <div className="space-y-2">
                        {accounts.map((acc) => {
                          const hasEnough = acc.balance >= displayPurchaseTotal;
                          return (
                            <button key={acc.id} onClick={() => setTxAccountId(acc.id)}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                txAccountId === acc.id
                                  ? hasEnough
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-red-300 bg-red-50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{acc.name}</p>
                                <p className="text-xs text-gray-500">{acc.type}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-bold ${hasEnough ? 'text-gray-800' : 'text-red-500'}`}>
                                  {fmtBDT(acc.balance)}
                                </p>
                                {!hasEnough && (
                                  <p className="text-xs text-red-500">Insufficient</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {errors.account && <p className="text-xs text-red-500">{errors.account}</p>}
                      {insufficientFunds && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <p className="text-xs text-red-700">
                            Selected account doesn&apos;t have enough balance ({fmtBDT(displayPurchaseTotal)} needed).
                            You can still save the jewellery without recording a transaction.
                          </p>
                        </div>
                      )}
                      {/* Summary */}
                      {selectedAccount && !insufficientFunds && (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs flex items-center justify-between">
                          <span className="text-gray-500">Balance after purchase</span>
                          <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                            <span className="text-gray-400 line-through">{fmtBDT(selectedAccount.balance)}</span>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <span className="text-emerald-700">{fmtBDT(selectedAccount.balance - displayPurchaseTotal)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* No accounts warning */}
              {canRecordTx && displayPurchaseTotal > 0 && accounts.length === 0 && (
                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">Add an account first to record the purchase as a transaction.</p>
                </div>
              )}

              {/* Previously purchased note */}
              {!canRecordTx && isEdit && (
                <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                  <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Transaction was recorded when this item was added. Editing purchase cost here only updates the record — it does not affect account balances.
                  </p>
                </div>
              )}
            </Section>
          )}

          {/* For gift/inherited — acquisition date */}
          {!isPurchased && (
            <Section icon={<DollarSign className="w-4 h-4 text-gray-400" />} title="Date Acquired (optional)">
              <input type="date" value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="input-field" />
              <p className="text-xs text-gray-400 mt-1">
                No purchase cost recorded. Current market price will be used for Zakat calculation.
              </p>
            </Section>
          )}

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || (recordTransaction && insufficientFunds)}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Jewellery'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .label-sm { display: block; font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .input-field {
          width: 100%; padding: 10px 14px; border-radius: 12px;
          border: 2px solid #e5e7eb; background: white;
          font-size: 0.875rem; outline: none; transition: border-color 0.15s;
        }
        .input-field:focus { border-color: #111827; }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-800 outline-none focus:border-gray-900 transition-colors">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
        active ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
      }`}>
      {children}
    </button>
  );
}

function PctInput({ label, value, onChange }) {
  return (
    <div>
      <label className="label-sm">{label}</label>
      <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-gray-900 bg-white">
        <input type="number" min="0" max="100" step="0.5" value={value}
          onChange={e => onChange(e.target.value)} placeholder="0"
          className="flex-1 px-2 py-2.5 text-sm bg-transparent outline-none text-gray-900 min-w-0" />
        <span className="flex items-center pr-2 text-gray-400 text-xs">%</span>
      </div>
    </div>
  );
}

function Row({ label, val, bold }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-bold text-emerald-900' : 'text-gray-600'}>{label}</span>
      <span className={bold ? 'font-bold text-emerald-900' : 'text-gray-800'}>{val}</span>
    </div>
  );
}