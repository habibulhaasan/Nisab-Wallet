// src/lib/zakatMonitoring.js
// Updated to use calculateZakatableWealth for comprehensive wealth calculation
import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, where, orderBy, serverTimestamp, writeBatch, getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './firestoreCollections';
import {
  gregorianToHijri, hasOneHijriYearPassed, addOneHijriYear,
  calculateZakatableWealth
} from './zakatUtils';

/**
 * Fetch all wealth data for a user and compute zakatable wealth.
 * Used both for cycle management and for display.
 */
export const fetchAndCalculateWealth = async (userId) => {
  try {
    const [accountsSnap, lendingsSnap, loansSnap, investmentsSnap, goalsSnap] =
      await Promise.all([
        getDocs(collection(db, 'users', userId, 'accounts')),
        getDocs(collection(db, 'users', userId, 'lendings')),
        getDocs(collection(db, 'users', userId, 'loans')),
        getDocs(collection(db, 'users', userId, 'investments')),
        getDocs(collection(db, 'users', userId, 'financialGoals')),
      ]);

    const accounts    = accountsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const lendings    = lendingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const loans       = loansSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const investments = investmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const goals       = goalsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const breakdown = calculateZakatableWealth({ accounts, lendings, loans, investments, goals });

    return { success: true, breakdown, accounts, lendings, loans, investments, goals };
  } catch (error) {
    console.error('Error fetching wealth data:', error);
    return { success: false, breakdown: null, error: error.message };
  }
};

/**
 * Check if we should start a new Zakat cycle.
 * Now uses comprehensive zakatable wealth (not just account balances).
 */
export const checkAndStartZakatCycle = async (userId, nisabThreshold, checkDate) => {
  if (!nisabThreshold || nisabThreshold === 0) return { cycleStarted: false };

  try {
    // Check if active cycle exists
    const cyclesRef = collection(db, 'users', userId, 'zakatCycles');
    const activeSnap = await getDocs(query(cyclesRef, where('status', '==', 'active')));
    if (!activeSnap.empty) return { cycleStarted: false, reason: 'Active cycle exists' };

    // Calculate comprehensive wealth
    const { breakdown } = await fetchAndCalculateWealth(userId);
    if (!breakdown || breakdown.netZakatableWealth < nisabThreshold) {
      return { cycleStarted: false, reason: 'Wealth below Nisab' };
    }

    // Start new cycle
    const dateToCheck = checkDate || new Date().toISOString().split('T')[0];
    const hijriDate   = gregorianToHijri(dateToCheck);
    const cycleId     = generateId();

    const newCycle = {
      cycleId,
      status:          'active',
      startDate:       dateToCheck,
      startDateHijri:  hijriDate,
      startWealth:     breakdown.netZakatableWealth,
      startBreakdown:  breakdown,
      nisabAtStart:    nisabThreshold,
      createdAt:       serverTimestamp(),
    };

    await addDoc(cyclesRef, newCycle);
    return { cycleStarted: true, cycle: newCycle, wealth: breakdown.netZakatableWealth };
  } catch (error) {
    console.error('Error starting cycle:', error);
    return { cycleStarted: false, error: error.message };
  }
};

/**
 * Check if active cycle should be completed (Hijri year ended).
 */
export const checkCycleCompletion = async (userId, activeCycle, nisabThreshold) => {
  if (!activeCycle || activeCycle.status !== 'active') return { completed: false };
  if (!hasOneHijriYearPassed(activeCycle.startDate)) return { completed: false };

  try {
    const { breakdown } = await fetchAndCalculateWealth(userId);
    const currentWealth = breakdown?.netZakatableWealth || 0;
    const isDue         = currentWealth >= nisabThreshold;
    const newStatus     = isDue ? 'due' : 'exempt';
    const dateToCheck   = new Date().toISOString().split('T')[0];
    const hijriDate     = gregorianToHijri(dateToCheck);

    await updateDoc(doc(db, 'users', userId, 'zakatCycles', activeCycle.id), {
      status:            newStatus,
      endDate:           dateToCheck,
      endDateHijri:      hijriDate,
      endWealth:         currentWealth,
      endBreakdown:      breakdown,
      zakatDue:          isDue ? currentWealth * 0.025 : 0,
      yearCompletedAt:   serverTimestamp(),
    });

    return {
      completed:   true,
      status:      newStatus,
      isDue,
      zakatAmount: isDue ? currentWealth * 0.025 : 0,
    };
  } catch (error) {
    console.error('Error completing cycle:', error);
    return { completed: false, error: error.message };
  }
};

/**
 * Record a Zakat payment (instant) and create a transaction record.
 * Updates cycle status to 'paid'.
 */
export const recordZakatPayment = async (userId, {
  cycleId, cycleDocId, zakatAmount, fromAccountId, fromAccountName,
  fromAccountBalance, paymentMethod, recipient, note,
}) => {
  try {
    const batch   = writeBatch(db);
    const today   = new Date().toISOString().split('T')[0];
    const hijriDate = gregorianToHijri(today);

    // 1. Record Zakat payment document
    const paymentRef = doc(collection(db, 'users', userId, 'zakatPayments'));
    batch.set(paymentRef, {
      cycleId,
      type:            'instant',
      totalAmount:     zakatAmount,
      paidAmount:      zakatAmount,
      remainingAmount: 0,
      fromAccountId,
      fromAccountName,
      paymentMethod:   paymentMethod || 'cash',
      recipient:       recipient || '',
      note:            note || '',
      status:          'completed',
      paymentDate:     today,
      paymentDateHijri: hijriDate,
      createdAt:       serverTimestamp(),
    });

    // 2. Create expense transaction so it appears in financial history
    const txRef = doc(collection(db, 'users', userId, 'transactions'));
    batch.set(txRef, {
      type:           'Expense',
      categoryName:   'Zakat',
      categoryId:     'zakat-system',
      accountId:      fromAccountId,
      accountName:    fromAccountName,
      amount:         zakatAmount,
      note:           note || `Zakat payment — ${hijriDate.day}/${hijriDate.month}/${hijriDate.year} AH`,
      date:           today,
      isZakatPayment: true,
      zakatPaymentId: paymentRef.id,
      createdAt:      serverTimestamp(),
    });

    // 3. Deduct from account balance
    const accRef  = doc(db, 'users', userId, 'accounts', fromAccountId);
    batch.update(accRef, {
      balance:   Math.max(0, fromAccountBalance - zakatAmount),
      updatedAt: serverTimestamp(),
    });

    // 4. Update cycle status to 'paid'
    const cycleRef = doc(db, 'users', userId, 'zakatCycles', cycleDocId);
    batch.update(cycleRef, {
      status:        'paid',
      paymentStatus: 'paid',
      endDate:       today,
      endDateHijri:  hijriDate,
      zakatPaid:     zakatAmount,
      paymentId:     paymentRef.id,
      paidAt:        serverTimestamp(),
    });

    await batch.commit();
    return { success: true, paymentId: paymentRef.id, transactionId: txRef.id };
  } catch (error) {
    console.error('Error recording Zakat payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set up an installment plan for Zakat payment.
 * Creates a zakatPayments doc with the schedule; each installment paid separately.
 */
export const setupZakatInstallments = async (userId, {
  cycleId, cycleDocId, zakatAmount, fromAccountId, fromAccountName,
  numberOfInstallments, paymentMethod, recipient, note,
}) => {
  try {
    const today    = new Date().toISOString().split('T')[0];
    const schedule = [];
    const baseAmount = Math.round((zakatAmount / numberOfInstallments) * 100) / 100;

    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      schedule.push({
        installmentNumber: i + 1,
        amount:   i === numberOfInstallments - 1
          ? Math.round((zakatAmount - baseAmount * (numberOfInstallments - 1)) * 100) / 100
          : baseAmount,
        dueDate:    dueDate.toISOString().split('T')[0],
        status:    'pending',
        paidDate:  null,
        paidAmount: null,
      });
    }

    const paymentRef = await addDoc(
      collection(db, 'users', userId, 'zakatPayments'),
      {
        cycleId,
        type:                 'installment',
        totalAmount:          zakatAmount,
        paidAmount:           0,
        remainingAmount:      zakatAmount,
        fromAccountId,
        fromAccountName,
        paymentMethod:        paymentMethod || 'cash',
        recipient:            recipient || '',
        note:                 note || '',
        numberOfInstallments,
        status:               'active',
        installments:         schedule,
        createdAt:            serverTimestamp(),
        updatedAt:            serverTimestamp(),
      }
    );

    // Update cycle to show installment plan started
    await updateDoc(doc(db, 'users', userId, 'zakatCycles', cycleDocId), {
      paymentStatus: 'installment-active',
      paymentId:     paymentRef.id,
      updatedAt:     serverTimestamp(),
    });

    return { success: true, paymentId: paymentRef.id, schedule };
  } catch (error) {
    console.error('Error setting up installments:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Pay a single installment.
 * Deducts from account, records transaction, updates installment status.
 */
export const payZakatInstallment = async (userId, {
  paymentDocId, installmentIndex, accountBalance,
}) => {
  try {
    const payRef  = doc(db, 'users', userId, 'zakatPayments', paymentDocId);
    const paySnap = await getDoc(payRef);
    if (!paySnap.exists()) throw new Error('Payment record not found');

    const payment      = paySnap.data();
    const installments = [...payment.installments];
    const inst         = installments[installmentIndex];
    if (!inst || inst.status === 'paid') throw new Error('Installment already paid or not found');

    const today     = new Date().toISOString().split('T')[0];
    const hijriDate = gregorianToHijri(today);

    installments[installmentIndex] = {
      ...inst,
      status:    'paid',
      paidDate:  today,
      paidAmount: inst.amount,
    };

    const totalPaid      = installments.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const remaining      = Math.max(0, payment.totalAmount - totalPaid);
    const isFullyPaid    = remaining <= 0;

    const batch = writeBatch(db);

    // Update payment doc
    batch.update(payRef, {
      installments,
      paidAmount:      totalPaid,
      remainingAmount: remaining,
      status:          isFullyPaid ? 'completed' : 'active',
      updatedAt:       serverTimestamp(),
    });

    // Create transaction for this installment
    const txRef = doc(collection(db, 'users', userId, 'transactions'));
    batch.set(txRef, {
      type:           'Expense',
      categoryName:   'Zakat',
      categoryId:     'zakat-system',
      accountId:      payment.fromAccountId,
      accountName:    payment.fromAccountName,
      amount:         inst.amount,
      note:           `Zakat installment ${inst.installmentNumber} of ${payment.numberOfInstallments} — ${hijriDate.day}/${hijriDate.month}/${hijriDate.year} AH`,
      date:           today,
      isZakatPayment: true,
      zakatPaymentId: paymentDocId,
      installmentNumber: inst.installmentNumber,
      createdAt:      serverTimestamp(),
    });

    // Deduct from account
    const accRef = doc(db, 'users', userId, 'accounts', payment.fromAccountId);
    batch.update(accRef, {
      balance:   Math.max(0, accountBalance - inst.amount),
      updatedAt: serverTimestamp(),
    });

    // If fully paid, mark cycle as paid
    if (isFullyPaid) {
      const cycleRef = doc(db, 'users', userId, 'zakatCycles', payment.cycleId);
      batch.update(cycleRef, {
        status:        'paid',
        paymentStatus: 'paid',
        zakatPaid:     payment.totalAmount,
        paidAt:        serverTimestamp(),
      });
    }

    await batch.commit();
    return { success: true, isFullyPaid, totalPaid, remaining };
  } catch (error) {
    console.error('Error paying installment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active Zakat payment plan (installments) for a cycle.
 */
export const getActivePaymentPlan = async (userId, cycleId) => {
  try {
    const q    = query(
      collection(db, 'users', userId, 'zakatPayments'),
      where('cycleId', '==', cycleId),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  } catch (error) {
    console.error('Error fetching payment plan:', error);
    return null;
  }
};

/**
 * Get full Zakat history (all cycles).
 */
export const getZakatHistory = async (userId) => {
  try {
    const q    = query(
      collection(db, 'users', userId, 'zakatCycles'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching Zakat history:', error);
    return [];
  }
};

/**
 * Legacy: Main function called after transactions (kept for compatibility).
 */
export const updateZakatStatusAfterTransaction = async (userId, transactionDate, nisabThreshold) => {
  try {
    // Get active cycle
    const activeSnap = await getDocs(
      query(collection(db, 'users', userId, 'zakatCycles'), where('status', '==', 'active'))
    );
    let activeCycle = null;
    if (!activeSnap.empty) {
      const d    = activeSnap.docs[0];
      activeCycle = { id: d.id, ...d.data() };
    }

    if (activeCycle) {
      await checkCycleCompletion(userId, activeCycle, nisabThreshold);
    } else {
      await checkAndStartZakatCycle(userId, nisabThreshold);
    }
    return { success: true };
  } catch (error) {
    console.error('Error updating Zakat status:', error);
    return { success: false, error: error.message };
  }
};