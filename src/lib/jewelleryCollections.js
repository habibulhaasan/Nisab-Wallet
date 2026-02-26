// src/lib/jewelleryCollections.js
// Firestore CRUD + weight calculation utilities for the Jewellery Tracker

import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

// ─── Weight conversion helpers ─────────────────────────────────────────────

/**
 * Convert Vori/Ana/Roti/Point → total grams
 * @param {number} vori
 * @param {number} ana
 * @param {number} roti
 * @param {number} point
 * @returns {number} grams (rounded to 4 decimal places)
 */
export function weightToGrams(vori = 0, ana = 0, roti = 0, point = 0) {
  const totalPoints =
    (Number(vori)  || 0) * WEIGHT.POINT_PER_VORI +
    (Number(ana)   || 0) * WEIGHT.POINT_PER_ROTI * WEIGHT.ROTI_PER_ANA +
    (Number(roti)  || 0) * WEIGHT.POINT_PER_ROTI +
    (Number(point) || 0);
  return parseFloat((totalPoints / WEIGHT.POINT_PER_VORI * WEIGHT.GRAMS_PER_VORI).toFixed(4));
}

/**
 * Convert total grams → { vori, ana, roti, point }
 */
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

/**
 * Format weight as human-readable string e.g. "2 Vori 4 Ana 2 Roti 3 Point"
 */
export function formatWeight(vori = 0, ana = 0, roti = 0, point = 0) {
  const parts = [];
  if (vori)  parts.push(`${vori} Vori`);
  if (ana)   parts.push(`${ana} Ana`);
  if (roti)  parts.push(`${roti} Roti`);
  if (point) parts.push(`${point} Point`);
  return parts.length ? parts.join(' ') : '0';
}

/**
 * Format total grams → "X.XXXX g (Y Vori Z Ana ...)"
 */
export function formatGrams(grams) {
  const w = gramsToWeight(grams);
  return `${grams.toFixed(4)}g`;
}

// ─── Price calculation ─────────────────────────────────────────────────────

/**
 * Calculate raw market value of a jewellery piece from current metal prices.
 * Uses purity-adjusted price per gram × actual weight in grams.
 *
 * @param {number} grams       - total weight in grams
 * @param {string} karat       - e.g. '22K'
 * @param {string} metal       - 'Gold' | 'Silver'
 * @param {object} prices      - { gold: { karat22: { perGram }, ... }, silver: { ... } }
 * @returns {number} market value in BDT (before deductions)
 */
export function calcMarketValue(grams, karat, metal, prices) {
  if (!grams || !prices) return 0;
  let pricePerGram = 0;

  if (metal === 'Gold') {
    const map = { '22K': prices.gold?.karat22, '21K': prices.gold?.karat21, '18K': prices.gold?.karat18, 'Traditional': prices.gold?.traditional, '24K': prices.gold?.karat22 };
    pricePerGram = map[karat]?.perGram || prices.gold?.karat22?.perGram || 0;
    // For 24K, extrapolate from 22K
    if (karat === '24K' && prices.gold?.karat22?.perGram) {
      pricePerGram = Math.round(prices.gold.karat22.perGram / 0.9167);
    }
  } else {
    const map = { '22K': prices.silver?.karat22, '21K': prices.silver?.karat21, '18K': prices.silver?.karat18, 'Traditional': prices.silver?.traditional };
    pricePerGram = map[karat]?.perGram || prices.silver?.karat22?.perGram || 0;
  }

  return Math.round(pricePerGram * grams);
}

/**
 * Apply BAJUS deduction (default 15% per Ulama; 17% official BAJUS)
 * Returns the resale / sell value after deduction.
 */
export function applyDeduction(value, pct = 15) {
  return Math.round(value * (1 - pct / 100));
}

/**
 * Calculate full price breakdown for a jewellery piece.
 * @returns {{
 *   marketValue: number,        raw market value
 *   deductedValue: number,      after BAJUS resale deduction
 *   zakatValue: number,         value used for Zakat (deductedValue by default)
 *   deductionPct: number,
 * }}
 */
export function calcPriceBreakdown(grams, karat, metal, prices, deductionPct = 15) {
  const marketValue   = calcMarketValue(grams, karat, metal, prices);
  const deductedValue = applyDeduction(marketValue, deductionPct);
  return {
    marketValue,
    deductedValue,
    zakatValue: deductedValue,
    deductionPct,
  };
}

// ─── Firestore CRUD ────────────────────────────────────────────────────────

const jewelleryRef = (uid) => collection(db, 'users', uid, 'jewellery');
const pieceRef     = (uid, id) => doc(db, 'users', uid, 'jewellery', id);
const historyRef   = (uid, id) => collection(db, 'users', uid, 'jewellery', id, 'priceHistory');

/**
 * Load all jewellery pieces for a user.
 */
export async function getJewellery(uid) {
  try {
    const q    = query(jewelleryRef(uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, items };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Add a new jewellery piece.
 * @param {string} uid
 * @param {object} data - see schema below
 */
export async function addJewellery(uid, data) {
  try {
    const ref = await addDoc(jewelleryRef(uid), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Update a jewellery piece.
 */
export async function updateJewellery(uid, id, data) {
  try {
    await updateDoc(pieceRef(uid, id), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete a jewellery piece (and its price history subcollection).
 */
export async function deleteJewellery(uid, id) {
  try {
    // Delete history subcollection first
    const hSnap = await getDocs(historyRef(uid, id));
    await Promise.all(hSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(pieceRef(uid, id));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Price history subcollection ───────────────────────────────────────────

/**
 * Add a price snapshot to a jewellery piece's history.
 * @param {object} snapshot - { marketValue, deductedValue, deductionPct, priceSource, goldPricePerGram, ... }
 */
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

/**
 * Load price history for a jewellery piece (newest first).
 */
export async function getPriceHistory(uid, jewelleryId) {
  try {
    const q    = query(historyRef(uid, jewelleryId), orderBy('recordedAt', 'desc'));
    const snap = await getDocs(q);
    const history = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, history };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Aggregation helpers ───────────────────────────────────────────────────

/**
 * Sum total Zakat value across all active jewellery pieces.
 * @param {Array} items  - jewellery items each with { currentZakatValue }
 */
export function totalJewelleryZakatValue(items) {
  return items.reduce((sum, item) => sum + (item.currentZakatValue || 0), 0);
}

/**
 * Format BDT currency
 */
export function fmtBDT(n) {
  if (!n && n !== 0) return '—';
  return '৳' + Number(n).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}