// src/lib/jewelleryCollections.js
// Firestore CRUD + weight calculation utilities for the Jewellery Tracker

import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, where, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateAccount } from '@/lib/firestoreCollections';

// ─── Weight system constants ───────────────────────────────────────────────
// 1 Vori = 16 Ana = 96 Roti = 576 Point = 11.664 grams
export const WEIGHT = {
  GRAMS_PER_VORI:  11.664,
  ANA_PER_VORI:    16,
  ROTI_PER_ANA:    6,
  POINT_PER_ROTI:  6,
  ROTI_PER_VORI:   96,
  POINT_PER_VORI:  576,
};

export const KARAT_PURITY = {
  '24K':         1.0000,
  '22K':         0.9167,
  '21K':         0.8750,
  '18K':         0.7500,
  'Traditional': 0.7083,
};

export const KARAT_OPTIONS = ['22K', '21K', '18K', 'Traditional', '24K'];
export const METAL_OPTIONS = ['Gold', 'Silver'];

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

// ─── Weight helpers ────────────────────────────────────────────────────────

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

/** "2 Vori 4 Ana 3 Roti 2 Point" */
export function formatWeight(vori = 0, ana = 0, roti = 0, point = 0) {
  const parts = [];
  if (vori)  parts.push(`${vori} Vori`);
  if (ana)   parts.push(`${ana} Ana`);
  if (roti)  parts.push(`${roti} Roti`);
  if (point) parts.push(`${point} Point`);
  return parts.length ? parts.join(' ') : '0';
}

export function formatGrams(grams) {
  return `${Number(grams).toFixed(4)}g`;
}

// ─── Price calculation ─────────────────────────────────────────────────────

export function calcMarketValue(grams, karat, metal, prices) {
  if (!grams || !prices) return 0;
  let pricePerGram = 0;
  if (metal === 'Gold') {
    const map = {
      '22K':         prices.gold?.karat22,
      '21K':         prices.gold?.karat21,
      '18K':         prices.gold?.karat18,
      'Traditional': prices.gold?.traditional,
      '24K':         prices.gold?.karat22,
    };
    pricePerGram = map[karat]?.perGram || prices.gold?.karat22?.perGram || 0;
    if (karat === '24K' && prices.gold?.karat22?.perGram) {
      pricePerGram = Math.round(prices.gold.karat22.perGram / 0.9167);
    }
  } else {
    const map = {
      '22K':         prices.silver?.karat22,
      '21K':         prices.silver?.karat21,
      '18K':         prices.silver?.karat18,
      'Traditional': prices.silver?.traditional,
    };
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

const jewelleryRef  = (uid)     => collection(db, 'users', uid, 'jewellery');
const pieceRef      = (uid, id) => doc(db, 'users', uid, 'jewellery', id);
const historyRef    = (uid, id) => collection(db, 'users', uid, 'jewellery', id, 'priceHistory');
const categoriesRef = (uid)     => collection(db, 'users', uid, 'categories');

// ─── Redemption category ───────────────────────────────────────────────────
/**
 * Find (or create) the "Jewellery Redemption" category for this user.
 * Returns the Firestore doc ID — used as categoryId on jewellery transactions
 * so they show up properly in the transactions page with a named category.
 */
export async function getOrCreateRedemptionCategory(uid) {
  try {
    const q    = query(categoriesRef(uid), where('name', '==', 'Jewellery Redemption'));
    const snap = await getDocs(q);

    if (!snap.empty) return snap.docs[0].id;

    // Create it
    const ref = await addDoc(categoriesRef(uid), {
      name:      'Jewellery Redemption',
      type:      'Both',           // applies to income (sale) and expense (purchase)
      color:     '#F59E0B',        // amber
      icon:      'gem',
      createdAt: serverTimestamp(),
    });
    // Write back its own ID (matches existing categoryId field pattern)
    await updateDoc(ref, { categoryId: ref.id });
    return ref.id;
  } catch {
    return '';
  }
}

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
      status:    data.status || 'active',
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
 * Mark jewellery as sold, create Income transaction (Jewellery Redemption
 * category), credit account. Stores saleTransactionId on the piece so
 * the sale can be fully undone if that transaction is deleted.
 */
export async function sellJewellery(uid, jewelleryId, sellData) {
  try {
    const { saleAmount, saleDate, accountId, accountBalance, accountName, notes, itemName } = sellData;

    // Get/create category
    const categoryId = await getOrCreateRedemptionCategory(uid);

    // Create income transaction
    let saleTransactionId = null;
    if (accountId && saleAmount > 0) {
      const txRef = await addDoc(collection(db, 'users', uid, 'transactions'), {
        type:        'Income',
        amount:      parseFloat(saleAmount),
        accountId,
        categoryId,
        description: `Jewellery sold: ${itemName || 'Item'}`,
        date:        saleDate,
        source:      'jewellery_sale',  // sentinel for undo detection
        jewelleryId,                    // back-reference for undo
        createdAt:   Timestamp.now(),
      });
      saleTransactionId = txRef.id;

      // Credit account
      const newBalance = (Number(accountBalance) || 0) + parseFloat(saleAmount);
      await updateAccount(uid, accountId, { balance: newBalance });
    }

    // Mark piece sold — keep saleTransactionId for undo
    await updateDoc(pieceRef(uid, jewelleryId), {
      status:            'sold',
      soldAt:            saleDate,
      soldPrice:         parseFloat(saleAmount),
      soldNotes:         notes || '',
      soldToAccountId:   accountId   || null,
      soldToAccountName: accountName || null,
      saleTransactionId,             // used by unmarkSold
      updatedAt:         serverTimestamp(),
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Undo sale ────────────────────────────────────────────────────────────
/**
 * Revert a jewellery piece back to "active".
 * Called by the transactions page when a jewellery_sale transaction is deleted.
 */
export async function unmarkSold(uid, jewelleryId) {
  try {
    await updateDoc(pieceRef(uid, jewelleryId), {
      status:            'active',
      soldAt:            null,
      soldPrice:         null,
      soldNotes:         null,
      soldToAccountId:   null,
      soldToAccountName: null,
      saleTransactionId: null,
      updatedAt:         serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Record purchase as expense transaction ────────────────────────────────
/**
 * Optionally called after addJewellery when user wants to record the cost.
 * Uses "Jewellery Redemption" category and debits chosen account.
 */
export async function recordJewelleryPurchase(uid, jewelleryId, txData) {
  try {
    const { amount, accountId, accountBalance, date, itemName } = txData;
    if (!accountId || !amount || amount <= 0) return { success: true };

    const categoryId = await getOrCreateRedemptionCategory(uid);

    const txRef = await addDoc(collection(db, 'users', uid, 'transactions'), {
      type:        'Expense',
      amount:      parseFloat(amount),
      accountId,
      categoryId,
      description: `Jewellery purchased: ${itemName || 'Item'}`,
      date:        date || new Date().toISOString().split('T')[0],
      source:      'jewellery_purchase',
      jewelleryId,
      createdAt:   Timestamp.now(),
    });

    // Store reference on the piece
    await updateDoc(pieceRef(uid, jewelleryId), {
      purchaseTransactionId: txRef.id,
      updatedAt: serverTimestamp(),
    });

    // Debit account
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

// ─── Aggregation ───────────────────────────────────────────────────────────

export function totalJewelleryZakatValue(items) {
  return items
    .filter((i) => i.status !== 'sold')
    .reduce((sum, item) => sum + (item.currentZakatValue || 0), 0);
}

export function fmtBDT(n) {
  if (!n && n !== 0) return '—';
  return '৳' + Number(n).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}