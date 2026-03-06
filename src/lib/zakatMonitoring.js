// src/lib/zakatMonitoring.js
import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, where, orderBy, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateId, updateAccount } from './firestoreCollections';
import {
  gregorianToHijri,
  hasOneHijriYearPassed,
  generateInstallmentSchedule,
} from './zakatUtils';

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Get or auto-create the "Zakat Payment" expense category. Returns its doc ID. */
const getOrCreateZakatCategory = async (userId) => {
  try {
    const ref  = collection(db, 'users', userId, 'categories');
    const snap = await getDocs(query(ref, where('name', '==', 'Zakat Payment')));
    if (!snap.empty) return snap.docs[0].id;
    const d = await addDoc(ref, {
      name:       'Zakat Payment',
      type:       'Expense',
      color:      '#10B981',
      categoryId: generateId(),
      isSystem:   true,
      createdAt:  serverTimestamp(),
    });
    return d.id;
  } catch (err) {
    console.error('getOrCreateZakatCategory:', err);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-FETCH NISAB AT YEAR END
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempts to fetch the latest Nisab threshold automatically from the metal
 * prices API. Returns { nisab, silverPerGram, source, note } or null on failure.
 *
 * This is called at cycle completion so the Zakat amount is based on the
 * *current* silver price, not a stale saved value — making the calculation
 * fully transparent.
 */
const autoFetchNisabAtYearEnd = async () => {
  try {
    const res  = await fetch('/api/metal-prices');
    const data = await res.json();
    if (data?.nisab?.full && data.primarySilver?.perGram) {
      return {
        nisab:        data.nisab.full,
        silverPerGram: data.primarySilver.perGram,
        silverPerVori: data.primarySilver.perVori,
        source:       data.source || 'auto',
        isSpotFallback: !!data.isSpotFallback,
        fetchedAt:    data.fetchedAt || new Date().toISOString(),
        note: data.isSpotFallback
          ? 'Nisab auto-fetched at year end using international spot prices (BAJUS site unavailable). Verify manually for accuracy.'
          : 'Nisab auto-fetched at year end from BAJUS official rates.',
      };
    }
    return null;
  } catch (err) {
    console.error('autoFetchNisabAtYearEnd:', err);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CYCLE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start a new active Zakat cycle if none exists.
 * Silently skips if an active cycle already exists.
 */
export const checkAndStartZakatCycle = async (userId, totalWealth, nisabThreshold, checkDate) => {
  if (!nisabThreshold || totalWealth < nisabThreshold) return { cycleStarted: false };
  try {
    const cyclesRef = collection(db, 'users', userId, 'zakatCycles');
    const snap      = await getDocs(query(cyclesRef, where('status', '==', 'active')));
    if (!snap.empty) return { cycleStarted: false, reason: 'Active cycle exists' };

    const date      = checkDate || new Date().toISOString().split('T')[0];
    const hijri     = gregorianToHijri(date);
    const newCycle  = {
      cycleId:        generateId(),
      status:         'active',
      startDate:      date,
      startDateHijri: hijri,
      startWealth:    totalWealth,
      nisabAtStart:   nisabThreshold,
      paymentStatus:  'unpaid',
      payments:       [],
      totalPaid:      0,
      createdAt:      serverTimestamp(),
    };
    await addDoc(cyclesRef, newCycle);
    return { cycleStarted: true };
  } catch (err) {
    console.error('checkAndStartZakatCycle:', err);
    return { cycleStarted: false, error: err.message };
  }
};

/**
 * Called on page load / after each data refresh.
 * If an active cycle's Hijri year has passed:
 *
 *   1. Auto-fetches current Nisab from the API (transparent, auditable).
 *      Falls back to the saved Nisab if the API is unreachable.
 *   2. Saves the fetched Nisab + a transparency note onto the cycle document.
 *   3. Marks cycle as 'due' or 'exempt' based on current wealth vs fetched Nisab.
 *   4. Auto-starts a NEW active cycle if wealth ≥ Nisab.
 *
 * Returns { acted: true } if it made any change, { acted: false } otherwise.
 */
export const autoCompleteCycleIfYearPassed = async (
  userId, activeCycle, currentWealth, nisabThreshold, wealthBreakdown
) => {
  if (!activeCycle || activeCycle.status !== 'active') return { acted: false };
  if (!hasOneHijriYearPassed(activeCycle.startDate))   return { acted: false };

  try {
    const today  = new Date().toISOString().split('T')[0];
    const hijri  = gregorianToHijri(today);

    // ── 1. Try to get fresh Nisab at year end ──────────────────────────────
    const fetched = await autoFetchNisabAtYearEnd();

    // Effective Nisab: prefer fresh API value, fall back to last saved value
    const effectiveNisab = fetched?.nisab || nisabThreshold;
    const isDue          = currentWealth >= effectiveNisab;

    // Transparency note stored on the cycle document
    const nisabNote = fetched
      ? fetched.note
      : `Nisab auto-fetch failed at year end. Used last saved value (৳${nisabThreshold?.toLocaleString() || 0}). Please update Nisab settings manually.`;

    // ── 2. Close current cycle ─────────────────────────────────────────────
    await updateDoc(doc(db, 'users', userId, 'zakatCycles', activeCycle.id), {
      status:              isDue ? 'due' : 'exempt',
      endDate:             today,
      endDateHijri:        hijri,
      endWealth:           currentWealth,
      zakatDue:            isDue ? currentWealth * 0.025 : 0,
      // Nisab at year end (may differ from nisabAtStart if prices changed)
      nisabAtEnd:          effectiveNisab,
      nisabAtEndNote:      nisabNote,
      nisabAtEndFetched:   fetched ? true : false,
      nisabAtEndSource:    fetched?.source || 'saved',
      nisabAtEndFetchedAt: fetched?.fetchedAt || null,
      silverPerGramAtEnd:  fetched?.silverPerGram || null,
      yearCompletedAt:     serverTimestamp(),
    });

    // ── 3. Auto-start new cycle if wealth still ≥ Nisab ───────────────────
    if (isDue && effectiveNisab > 0) {
      await addDoc(collection(db, 'users', userId, 'zakatCycles'), {
        cycleId:        generateId(),
        status:         'active',
        startDate:      today,
        startDateHijri: hijri,
        startWealth:    currentWealth,
        startBreakdown: wealthBreakdown || null,
        nisabAtStart:   effectiveNisab,
        paymentStatus:  'unpaid',
        payments:       [],
        totalPaid:      0,
        createdAt:      serverTimestamp(),
      });
    }

    // ── 4. Persist fresh Nisab back to user settings so UI stays current ───
    if (fetched) {
      try {
        const settingsRef = collection(db, 'users', userId, 'settings');
        const settSnap    = await getDocs(settingsRef);
        const update = {
          nisabThreshold:     fetched.nisab,
          silverPricePerGram: fetched.silverPerGram,
          silverPricePerVori: fetched.silverPerVori || null,
          lastFetched:        fetched.fetchedAt,
          priceSource:        'auto',
          updatedAt:          serverTimestamp(),
          autoUpdatedAtYearEnd: true,
        };
        if (settSnap.empty) await addDoc(settingsRef, update);
        else await updateDoc(doc(db, 'users', userId, 'settings', settSnap.docs[0].id), update);
      } catch (e) {
        console.error('Failed to persist auto-fetched Nisab to settings:', e);
      }
    }

    return {
      acted:        true,
      isDue,
      zakatDue:     isDue ? currentWealth * 0.025 : 0,
      effectiveNisab,
      nisabFetched: !!fetched,
      nisabNote,
    };
  } catch (err) {
    console.error('autoCompleteCycleIfYearPassed:', err);
    return { acted: false, error: err.message };
  }
};

// Kept for legacy compatibility
export const completeCycleAndAutoStart = autoCompleteCycleIfYearPassed;
export const checkCycleCompletion = autoCompleteCycleIfYearPassed;

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT — FULL / PARTIAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record a Zakat payment (full or partial).
 *
 * Steps:
 *  1. Deduct amount from chosen account
 *  2. Create an Expense transaction under "Zakat Payment" category
 *  3. Append payment to cycle's payments[] array; mark cycle 'paid' if fully settled
 *  4. If fully paid AND wealth ≥ nisab → auto-start new cycle
 */
export const recordZakatPayment = async (userId, opts) => {
  const {
    cycleDocId,
    zakatDueTotal,
    paymentAmount,
    fromAccountId,
    fromAccountName   = '',
    fromAccountBalance,
    paymentDate       = new Date().toISOString().split('T')[0],
    recipient         = '',
    note              = '',
    nisabThreshold    = 0,
    currentWealth     = 0,
    wealthBreakdown   = null,
  } = opts;

  if (!fromAccountId)                       return { success: false, error: 'No account selected.'     };
  if (!paymentAmount || paymentAmount <= 0) return { success: false, error: 'Invalid amount.'          };
  if (paymentAmount > fromAccountBalance)   return { success: false, error: 'Insufficient balance.'    };

  try {
    // 1. Deduct from account
    await updateAccount(userId, fromAccountId, {
      balance: fromAccountBalance - paymentAmount,
    });

    // 2. Expense transaction
    const catId = await getOrCreateZakatCategory(userId);
    const desc  = ['Zakat payment',
      recipient ? `to ${recipient}` : '',
      note       ? `— ${note}`      : '',
    ].filter(Boolean).join(' ');

    await addDoc(collection(db, 'users', userId, 'transactions'), {
      type:           'Expense',
      amount:         paymentAmount,
      accountId:      fromAccountId,
      categoryId:     catId,
      description:    desc || 'Zakat payment',
      date:           paymentDate,
      isZakatPayment: true,
      zakatCycleId:   cycleDocId,
      createdAt:      serverTimestamp(),
    });

    // 3. Update cycle
    const cycleRef  = doc(db, 'users', userId, 'zakatCycles', cycleDocId);
    const cycleSnap = await getDoc(cycleRef);
    const cycleData = cycleSnap.exists() ? cycleSnap.data() : {};
    const prevPmts  = cycleData.payments || [];

    const newPmt = {
      paymentId:    generateId(),
      amount:       paymentAmount,
      accountId:    fromAccountId,
      accountName:  fromAccountName,
      date:         paymentDate,
      recipient,
      note,
      recordedAt:   new Date().toISOString(),
    };
    const allPmts      = [...prevPmts, newPmt];
    const totalPaidNow = allPmts.reduce((s, p) => s + (p.amount || 0), 0);
    const isFullyPaid  = zakatDueTotal > 0 && totalPaidNow >= zakatDueTotal;

    await updateDoc(cycleRef, {
      payments:        allPmts,
      totalPaid:       totalPaidNow,
      zakatPaid:       totalPaidNow,
      lastPaymentDate: paymentDate,
      ...(isFullyPaid ? {
        status:       'paid',
        endDate:      paymentDate,
        endDateHijri: gregorianToHijri(paymentDate),
        endWealth:    currentWealth,
        paidAt:       serverTimestamp(),
      } : {}),
    });

    // 4. If fully paid AND wealth ≥ nisab → auto-start new cycle
    if (isFullyPaid && currentWealth >= nisabThreshold && nisabThreshold > 0) {
      const today = new Date().toISOString().split('T')[0];
      const hijri = gregorianToHijri(today);
      await addDoc(collection(db, 'users', userId, 'zakatCycles'), {
        cycleId:        generateId(),
        status:         'active',
        startDate:      today,
        startDateHijri: hijri,
        startWealth:    currentWealth,
        startBreakdown: wealthBreakdown || null,
        nisabAtStart:   nisabThreshold,
        paymentStatus:  'unpaid',
        payments:       [],
        totalPaid:      0,
        createdAt:      serverTimestamp(),
      });
    }

    return { success: true, isFullyPaid, totalPaid: totalPaidNow };
  } catch (err) {
    console.error('recordZakatPayment:', err);
    return { success: false, error: err.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INSTALLMENT PLAN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an installment payment plan for a cycle.
 * No money is deducted yet — each installment is paid separately.
 */
export const setupZakatInstallments = async (userId, opts) => {
  const {
    cycleDocId,
    zakatAmount,
    fromAccountId,
    fromAccountName      = '',
    numberOfInstallments,
    paymentDate          = new Date().toISOString().split('T')[0],
    recipient            = '',
    note                 = '',
  } = opts;

  if (!fromAccountId)           return { success: false, error: 'No account selected.'      };
  if (numberOfInstallments < 1) return { success: false, error: 'Invalid installment count.' };

  try {
    const schedule = generateInstallmentSchedule(zakatAmount, numberOfInstallments);
    const per      = Math.round((zakatAmount / numberOfInstallments) * 100) / 100;

    const planDoc = {
      paymentId:            generateId(),
      cycleDocId,
      type:                 'installment',
      status:               'active',
      totalAmount:          zakatAmount,
      numberOfInstallments,
      perInstallmentAmount: per,
      paidAmount:           0,
      remainingAmount:      zakatAmount,
      fromAccountId,
      fromAccountName,
      recipient,
      note,
      startDate:            paymentDate,
      installments:         schedule,
      createdAt:            serverTimestamp(),
    };

    const ref = await addDoc(
      collection(db, 'users', userId, 'zakatPayments'), planDoc
    );

    await updateDoc(doc(db, 'users', userId, 'zakatCycles', cycleDocId), {
      paymentStatus: 'installment_plan',
      paymentPlanId: ref.id,
    });

    return { success: true, paymentDocId: ref.id };
  } catch (err) {
    console.error('setupZakatInstallments:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Pay toward an installment plan with a custom amount.
 *
 * Flexible rules:
 *  - User can pay any amount (more or less than one installment).
 *  - Installments are marked paid greedily from the first pending one.
 *  - If the payment covers multiple installments fully, all are marked paid.
 *  - If the payment partially covers an installment, it is marked
 *    'partial' with paidAmount tracked; the remainder stays pending.
 *  - If the total paid >= totalAmount, the plan is completed early.
 *  - The cycle is marked 'paid' when the plan completes.
 */
export const payZakatInstallment = async (userId, opts) => {
  const {
    paymentDocId,
    accountId,
    accountBalance,
    paymentAmount,   // custom amount the user chose to pay now
    paymentDate = new Date().toISOString().split('T')[0],
    note        = '',
  } = opts;

  if (!paymentAmount || paymentAmount <= 0)
    return { success: false, error: 'Enter a valid payment amount.' };

  try {
    const planRef  = doc(db, 'users', userId, 'zakatPayments', paymentDocId);
    const planSnap = await getDoc(planRef);
    if (!planSnap.exists()) return { success: false, error: 'Payment plan not found.' };

    const plan    = planSnap.data();
    const accId   = accountId || plan.fromAccountId;
    const accBal  = typeof accountBalance === 'number' ? accountBalance : 0;

    if (paymentAmount > accBal)
      return { success: false, error: 'Insufficient balance in selected account.' };

    const remaining = plan.remainingAmount ?? plan.totalAmount;
    if (remaining <= 0)
      return { success: false, error: 'This installment plan is already fully paid.' };

    // ── Greedy installment marking ───────────────────────────────────────────
    // Walk through pending installments and mark as many as fully covered by
    // paymentAmount. If a partial payment covers part of an installment,
    // record it as 'partial'. Never exceed the plan's remaining amount.

    const actualPayment  = Math.min(paymentAmount, remaining); // cap at remaining
    const installments   = plan.installments.map(i => ({ ...i })); // deep copy
    let   budget         = actualPayment;
    const markedNumbers  = [];

    for (let i = 0; i < installments.length; i++) {
      if (budget <= 0) break;
      const inst = installments[i];
      if (inst.status === 'paid') continue; // skip already paid

      const due = inst.amount - (inst.paidAmount || 0); // what's still owed on this slot

      if (budget >= due) {
        // Fully covers this installment
        installments[i] = {
          ...inst,
          status:     'paid',
          paidDate:   paymentDate,
          paidAmount: inst.amount,  // total paid for this slot = full amount
        };
        markedNumbers.push(inst.installmentNumber);
        budget -= due;
      } else {
        // Partial payment toward this installment
        installments[i] = {
          ...inst,
          status:     'partial',
          paidAmount: (inst.paidAmount || 0) + budget,
          lastPartialDate: paymentDate,
        };
        budget = 0;
      }
    }

    const newPaidTotal  = (plan.paidAmount || 0) + actualPayment;
    const newRemaining  = Math.max(0, plan.totalAmount - newPaidTotal);
    const planCompleted = newRemaining <= 0;

    // ── 1. Deduct from account ───────────────────────────────────────────────
    await updateAccount(userId, accId, { balance: accBal - actualPayment });

    // ── 2. Expense transaction ───────────────────────────────────────────────
    const catId     = await getOrCreateZakatCategory(userId);
    const instRange = markedNumbers.length > 0
      ? `Installment${markedNumbers.length > 1 ? 's' : ''} ${markedNumbers.join(', ')} of ${plan.numberOfInstallments}`
      : `Partial toward installment plan`;
    const txNote = [instRange, note, plan.note].filter(Boolean).join(' — ');

    await addDoc(collection(db, 'users', userId, 'transactions'), {
      type:           'Expense',
      amount:         actualPayment,
      accountId:      accId,
      categoryId:     catId,
      description:    `Zakat payment — ${txNote}`,
      date:           paymentDate,
      isZakatPayment: true,
      zakatCycleId:   plan.cycleDocId,
      zakatPaymentId: paymentDocId,
      createdAt:      serverTimestamp(),
    });

    // ── 3. Update plan doc ───────────────────────────────────────────────────
    await updateDoc(planRef, {
      installments,
      paidAmount:      newPaidTotal,
      remainingAmount: newRemaining,
      status:          planCompleted ? 'completed' : 'active',
      ...(planCompleted ? { completedDate: paymentDate } : {}),
    });

    // ── 4. Append to cycle payments[] and optionally mark cycle paid ─────────
    const cycleRef  = doc(db, 'users', userId, 'zakatCycles', plan.cycleDocId);
    const cycleSnap = await getDoc(cycleRef);
    const prevPmts  = cycleSnap.exists() ? (cycleSnap.data().payments || []) : [];
    const allPmts   = [
      ...prevPmts,
      {
        paymentId:        generateId(),
        amount:           actualPayment,
        accountId:        accId,
        accountName:      plan.fromAccountName,
        date:             paymentDate,
        note:             txNote,
        isInstallment:    true,
        installmentNums:  markedNumbers,
        installmentTotal: plan.numberOfInstallments,
        recordedAt:       new Date().toISOString(),
      },
    ];
    const cyclePaidTotal = allPmts.reduce((s, p) => s + (p.amount || 0), 0);

    await updateDoc(cycleRef, {
      payments:        allPmts,
      totalPaid:       cyclePaidTotal,
      zakatPaid:       cyclePaidTotal,
      lastPaymentDate: paymentDate,
      ...(planCompleted ? {
        status:    'paid',
        paidAt:    serverTimestamp(),
        endDate:   paymentDate,
      } : {}),
    });

    return {
      success:        true,
      allDone:        planCompleted,
      totalPaid:      cyclePaidTotal,
      actualPayment,
      newRemaining,
    };
  } catch (err) {
    console.error('payZakatInstallment:', err);
    return { success: false, error: err.message };
  }
};

/** Get the active installment plan for a cycle (or null). */
export const getActivePaymentPlan = async (userId, cycleDocId) => {
  try {
    // Single-field query only — avoids needing a Firestore composite index
    const snap = await getDocs(query(
      collection(db, 'users', userId, 'zakatPayments'),
      where('cycleDocId', '==', cycleDocId)
    ));
    if (snap.empty) return null;
    // Filter client-side for active installment plans
    const active = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .find(p => p.type === 'installment' && p.status === 'active');
    return active || null;
  } catch (err) {
    console.error('getActivePaymentPlan:', err);
    return null;
  }
};

/** Get all zakatPayments for this user (newest first). */
export const getZakatHistory = async (userId) => {
  try {
    const snap = await getDocs(query(
      collection(db, 'users', userId, 'zakatPayments'),
      orderBy('createdAt', 'desc')
    ));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('getZakatHistory:', err);
    return [];
  }
};

/** Fetch current account balances and sum them. */
export const fetchAndCalculateWealth = async (userId) => {
  try {
    const snap     = await getDocs(collection(db, 'users', userId, 'accounts'));
    const accounts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const total    = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
    return { totalWealth: total, accounts };
  } catch (err) {
    console.error('fetchAndCalculateWealth:', err);
    return { totalWealth: 0, accounts: [] };
  }
};

/** Legacy: same as autoCompleteCycleIfYearPassed. */
export const updateZakatStatusAfterTransaction = async (userId, _date, nisabThreshold) => {
  try {
    const { totalWealth } = await fetchAndCalculateWealth(userId);
    const snap = await getDocs(query(
      collection(db, 'users', userId, 'zakatCycles'),
      where('status', '==', 'active')
    ));
    if (!snap.empty) {
      const cycle = { id: snap.docs[0].id, ...snap.docs[0].data() };
      await autoCompleteCycleIfYearPassed(userId, cycle, totalWealth, nisabThreshold);
    } else {
      await checkAndStartZakatCycle(userId, totalWealth, nisabThreshold);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};