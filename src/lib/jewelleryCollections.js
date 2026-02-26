// src/lib/jewelleryCollections.js
// Firestore CRUD + weight calculation utilities for the Jewellery Tracker

import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, getDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateAccount } from '@/lib/firestoreCollections';

// ─── Weight system constants ───────────────────────────────────────────────
// Bangladesh / South-Asian gold weight standard:
// 1 Vori = 16 Ana
// 1 Ana  = 6  Roti
// 1 Roti = 6  Point
// 1 Vori = 96 Roti = 576 Point = 11.664 grams
export const WEIGHT = {
  GRAMS_PER_VORI:  11.664,
  ANA_PER_VORI:    16,
  ROTI_PER_ANA:    6,
  POINT_PER_ROTI:  6,
  ROTI_PER_VORI:   96,   // 16 × 6
  POINT_PER_VORI:  576,  // 16 × 6 × 6
};

// Karat → purity multiplier (relative to pure 24K)
export const KARAT_PURITY = {
  '24K': 1.0000,
  '22K': 0.9167,
  '21K': 0.8750,
  '18K': 0.7500,
  'Traditional': 0.7083, // ~17K, common sanaton standard in BD
};

export const KARAT_OPTIONS = ['22K', '21K', '18K', 'Traditional', '24K'];

// Metal types
export const METAL_OPTIONS = ['Gold', 'Silver'];

// Acquisition types
export const ACQUISITION_TYPES = {
  PURCHASED: 'purchased',
  GIFT:      'gift',
  INHERITED: 'inherited',
  OTHER:     'other',
};

export const ACQUISITION_LABELS = {
  purchased: 'Purchased',
  gift:      'Gift',
  inherited: 'Inherited',
  other:     'Other',
};

// ─── Weight conversion helpers ─────────────────────────────────────────────

export function weightToGrams(vori = 0, ana = 0, roti = 0, point = 0) {
  const totalPoints =
    (Number(vori)  || 0) * WEIGHT.POINT_PER_VORI +
    (Number(ana)   || 0) * WEIGHT.POINT_PER_ROTI * WEIGHT.ROTI_PER_ANA +
    (Number(roti)  || 0) * WEIGHT.POINT_PER_ROTI +
    (Number(point) || 0);
  return parseFloat((totalPoints / WEIGHT.POINT_PER_VORI * WEIGHT.GRAMS_PER_VORI).toFixed(4));
}

export function gramsToWeight(grams) {
  const totalPoints = Math.round((grams / WEIGHT.GRAMS_PER_VORI) * WEIGHT.POINT_PER_VORI);
  const vori  = Math.floor(totalPoints / WEIGHT.POINT_PER_VORI);
  const rem1  = totalPoints % WEIGHT.POINT_PER_VORI;
  const ana   = Math.floor(rem1 / (WEIGHT.POINT_PER_ROTI * WEIGHT.ROTI_PER_ANA));
  const rem2  = rem1 % (WEIGHT.POINT_PER_ROTI * WEIGHT.ROTI_PER_ANA);
  const roti  = Math.floor(rem2 / WEIGHT.POINT_PER_ROTI);
  const point = rem2 % WEIGHT.POINT_PER_ROTI;
  return { vori, ana, roti, point };
}

export function formatWeight(vori = 0, ana = 0, roti = 0, point = 0) {
  const parts = [];
  if (vori)  parts.push(`${vori} Vori`);
  if (ana)   parts.push(`${ana} Ana`);
  if (roti)  parts.push(`${roti} Roti`);
  if (point) parts.push(`${point} Point`);
  return parts.length ? parts.join(' ') : '0';
}

export function formatGrams(grams) {
  return `${grams.toFixed(4)}g`;
}

// ─── Price calculation ─────────────────────────────────────────────────────

export function calcMarketValue(grams, karat, metal, prices) {
  if (!grams || !prices) return 0;
  let pricePerGram = 0;

  if (metal === 'Gold') {
    const map = { '22K': prices.gold?.karat22, '21K': prices.gold?.karat21, '18K': prices.gold?.karat18, 'Traditional': prices.gold?.traditional, '24K': prices.gold?.karat22 };
    pricePerGram = map[karat]?.perGram || prices.gold?.karat22?.perGram || 0;
    if (karat === '24K' && prices.gold?.karat22?.perGram) {
      pricePerGram = Math.round(prices.gold.karat22.perGram / 0.9167);
    }
  } else {
    const map = { '22K': prices.silver?.karat22, '21K': prices.silver?.karat21, '18K': prices.silver?.karat18, 'Traditional': prices.silver?.traditional };
    pricePerGram = map[karat]?.perGram || prices.silver?.karat22?.perGram || 0;
  }

  return Math.round(pricePerGram * grams);
}

export function applyDeduction(value, pct = 15) {
  return Math.round(value * (1 - pct / 100));
}

export function calcPriceBreakdown(grams, karat, metal, prices, deductionPct = 15) {
  const marketValue   = calcMarketValue(grams, karat, metal, prices);
  const deductedValue = applyDeduction(marketValue, deductionPct);
  return { marketValue, deductedValue, zakatValue: deductedValue, deductionPct };
}

// ─── Firestore refs ────────────────────────────────────────────────────────

const jewelleryRef = (uid)     => collection(db, 'users', uid, 'jewellery');
const pieceRef     = (uid, id) => doc(db, 'users', uid, 'jewellery', id);
const historyRef   = (uid, id) => collection(db, 'users', uid, 'jewellery', id, 'priceHistory');

// ─── CRUD ──────────────────────────────────────────────────────────────────

export async function getJewellery(uid) {
  try {
    const q     = query(jewelleryRef(uid), orderBy('createdAt', 'desc'));
    const snap  = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, items };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addJewellery(uid, data) {
  try {
    const ref = await addDoc(jewelleryRef(uid), {
      ...data,
      status:    data.status    || 'active', // 'active' | 'sold'
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateJewellery(uid, id, data) {
  try {
    await updateDoc(pieceRef(uid, id), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteJewellery(uid, id) {
  try {
    const hSnap = await getDocs(historyRef(uid, id));
    await Promise.all(hSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(pieceRef(uid, id));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Sell jewellery ────────────────────────────────────────────────────────
/**
 * Mark a jewellery piece as sold, create an Income transaction, and
 * credit the chosen account balance — all in one call.
 *
 * @param {string} uid
 * @param {string} jewelleryId   - Firestore doc ID of the piece
 * @param {object} sellData      - { saleAmount, saleDate, accountId, accountBalance, accountName, notes }
 */
export async function sellJewellery(uid, jewelleryId, sellData) {
  try {
    const { saleAmount, saleDate, accountId, accountBalance, accountName, notes, itemName } = sellData;

    // 1. Mark piece as sold
    await updateDoc(pieceRef(uid, jewelleryId), {
      status:    'sold',
      soldAt:    saleDate,
      soldPrice: saleAmount,
      soldNotes: notes || '',
      soldToAccountId:   accountId   || null,
      soldToAccountName: accountName || null,
      updatedAt: serverTimestamp(),
    });

    // 2. Record income transaction (same schema as transactions page)
    if (accountId && saleAmount > 0) {
      await addDoc(collection(db, 'users', uid, 'transactions'), {
        type:        'Income',
        amount:      parseFloat(saleAmount),
        accountId,
        categoryId:  '',
        description: `Sold jewellery: ${itemName || 'Item'}`,
        date:        saleDate,
        source:      'jewellery_sale',
        jewelleryId,
        createdAt:   Timestamp.now(),
      });

      // 3. Credit account balance
      const newBalance = (Number(accountBalance) || 0) + parseFloat(saleAmount);
      await updateAccount(uid, accountId, { balance: newBalance });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Record purchase as transaction ───────────────────────────────────────
/**
 * After adding a jewellery piece, optionally record it as an Expense
 * transaction and deduct the amount from the chosen account.
 *
 * @param {string} uid
 * @param {object} txData - { amount, accountId, accountBalance, accountName, date, itemName }
 */
export async function recordJewelleryPurchase(uid, jewelleryId, txData) {
  try {
    const { amount, accountId, accountBalance, accountName, date, itemName } = txData;

    if (!accountId || !amount || amount <= 0) return { success: true }; // nothing to do

    // Create expense transaction
    await addDoc(collection(db, 'users', uid, 'transactions'), {
      type:        'Expense',
      amount:      parseFloat(amount),
      accountId,
      categoryId:  '',
      description: `Purchased jewellery: ${itemName || 'Item'}`,
      date:        date || new Date().toISOString().split('T')[0],
      source:      'jewellery_purchase',
      jewelleryId,
      createdAt:   Timestamp.now(),
    });

    // Deduct from account
    const newBalance = (Number(accountBalance) || 0) - parseFloat(amount);
    await updateAccount(uid, accountId, { balance: newBalance });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Price history ─────────────────────────────────────────────────────────

export async function addPriceSnapshot(uid, jewelleryId, snapshot) {
  try {
    await addDoc(historyRef(uid, jewelleryId), {
      ...snapshot,
      recordedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getPriceHistory(uid, jewelleryId) {
  try {
    const q       = query(historyRef(uid, jewelleryId), orderBy('recordedAt', 'desc'));
    const snap    = await getDocs(q);
    const history = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, history };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Aggregation helpers ───────────────────────────────────────────────────

/** Sum total Zakat value — only active (unsold) pieces */
export function totalJewelleryZakatValue(items) {
  return items
    .filter((i) => i.status !== 'sold')
    .reduce((sum, item) => sum + (item.currentZakatValue || 0), 0);
}

export function fmtBDT(n) {
  if (!n && n !== 0) return '—';
  return '৳' + Number(n).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}