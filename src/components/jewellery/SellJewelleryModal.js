// src/components/jewellery/SellJewelleryModal.js
'use client';

import { useState, useEffect } from 'react';
import {
  X, DollarSign, CheckCircle2, Loader2, AlertCircle,
  ArrowRight, Gem, Scale, TrendingUp, CreditCard,
} from 'lucide-react';
import { formatWeight, fmtBDT } from '@/lib/jewelleryCollections';

export default function SellJewelleryModal({ item, accounts = [], onSell, onClose }) {
  const [saleAmount,    setSaleAmount]    = useState(item.currentZakatValue ? String(item.currentZakatValue) : '');
  const [saleDate,      setSaleDate]      = useState(new Date().toISOString().split('T')[0]);
  const [accountId,     setAccountId]     = useState('');
  const [notes,         setNotes]         = useState('');
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});

  useEffect(() => {
    if (accounts.length > 0) setAccountId(accounts[0].id);
  }, [accounts]);

  const parsedAmount    = parseFloat(saleAmount) || 0;
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const validate = () => {
    const e = {};
    if (parsedAmount <= 0) e.amount  = 'Enter the sale amount';
    if (!accountId)        e.account = 'Select an account to receive the money';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSell = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSell({
      saleAmount:     parsedAmount,
      saleDate,
      accountId,
      accountBalance: selectedAccount?.balance || 0,
      accountName:    selectedAccount?.name    || '',
      notes,
      itemName:       item.name,
    });
    setSaving(false);
  };

  const w = formatWeight(item.weightVori, item.weightAna, item.weightRoti, item.weightPoint);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: 'min(95vh, 680px)' }}>

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">Sell Jewellery</h2>
                <p className="text-xs text-gray-500 truncate max-w-52">{item.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Item summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-amber-900 text-sm">{item.name}</span>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                {item.karat} {item.metal}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <Scale className="w-3 h-3" />
              <span>{w || '—'} ({(item.weightGrams || 0).toFixed(4)}g)</span>
              {item.currentZakatValue > 0 && (
                <span className="ml-auto text-emerald-700 font-semibold">
                  Last value: {fmtBDT(item.currentZakatValue)}
                </span>
              )}
            </div>
          </div>

          {/* Sale amount */}
          <div>
            <label className="label-sm">Sale Amount (৳) <span className="text-red-500">*</span></label>
            <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-gray-900 bg-white">
              <span className="flex items-center pl-3 text-gray-400 text-sm">৳</span>
              <input
                type="number" min="0" value={saleAmount}
                onChange={e => setSaleAmount(e.target.value)}
                placeholder="Enter actual sale price"
                className="flex-1 px-2 py-3 text-sm bg-transparent outline-none text-gray-900 font-semibold"
                autoFocus
              />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            {item.currentZakatValue > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Last recorded value: {fmtBDT(item.currentZakatValue)} — enter the actual price you sold for.
              </p>
            )}
          </div>

          {/* Sale date */}
          <div>
            <label className="label-sm">Sale Date</label>
            <input type="date" value={saleDate}
              onChange={e => setSaleDate(e.target.value)}
              className="input-field" />
          </div>

          {/* Account to credit */}
          <div>
            <label className="label-sm">Add money to account <span className="text-red-500">*</span></label>
            {accounts.length === 0 ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700">No accounts found. Add an account first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((acc) => (
                  <button key={acc.id} onClick={() => setAccountId(acc.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      accountId === acc.id
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <div className="flex items-center gap-2.5">
                      <CreditCard className={`w-4 h-4 ${accountId === acc.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{acc.name}</p>
                        <p className="text-xs text-gray-500">{acc.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700">{fmtBDT(acc.balance)}</p>
                      {accountId === acc.id && parsedAmount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold justify-end mt-0.5">
                          <ArrowRight className="w-3 h-3" />
                          {fmtBDT(acc.balance + parsedAmount)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {errors.account && <p className="text-xs text-red-500 mt-1">{errors.account}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="label-sm">Notes <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="e.g. Sold to X person, sold at X shop…"
              className="input-field resize-none"
            />
          </div>

          {/* Warning box */}
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-3">
            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-800 leading-relaxed">
              This will mark the jewellery as <strong>Sold</strong>, create an income transaction of{' '}
              <strong>{fmtBDT(parsedAmount)}</strong>, and add the amount to the selected account.
              The item will remain visible in history.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSell} disabled={saving || accounts.length === 0}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Processing…' : 'Confirm Sale'}
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