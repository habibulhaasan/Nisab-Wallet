// src/lib/zakatUtils.js
import { toHijri, toGregorian } from 'hijri-converter';

// Convert Gregorian date to Hijri
export const gregorianToHijri = (gregorianDate) => {
  const date = new Date(gregorianDate);
  const hijri = toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return {
    year: hijri.hy,
    month: hijri.hm,
    day: hijri.hd,
    formatted: `${hijri.hd}/${hijri.hm}/${hijri.hy}`
  };
};

// Convert Hijri date to Gregorian
export const hijriToGregorian = (hijriYear, hijriMonth, hijriDay) => {
  const gregorian = toGregorian(hijriYear, hijriMonth, hijriDay);
  return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
};

// Add one Hijri year to a date
export const addOneHijriYear = (gregorianDate) => {
  const date = new Date(gregorianDate);
  const hijri = toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const nextHijriYear = hijri.hy + 1;
  return hijriToGregorian(nextHijriYear, hijri.hm, hijri.hd);
};

// Calculate days remaining until Hijri anniversary
export const daysUntilHijriAnniversary = (startDate) => {
  const endDate = addOneHijriYear(startDate);
  const today = new Date();
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Check if one Hijri year has passed
export const hasOneHijriYearPassed = (startDate) => {
  const endDate = addOneHijriYear(startDate);
  const today = new Date();
  return today >= endDate;
};

// Calculate Zakat amount (2.5%)
export const calculateZakat = (totalWealth) => {
  return totalWealth * 0.025;
};

// Zakat status types
export const ZAKAT_STATUS = {
  NOT_MANDATORY: 'Not Mandatory',
  MONITORING: 'Monitoring',
  DUE: 'Zakat Due',
  PAID: 'Paid',
  EXEMPT: 'Exempt'
};

// Determine Zakat status based on wealth and nisab
export const determineZakatStatus = (totalWealth, nisabThreshold, activeCycle) => {
  if (nisabThreshold === 0) return ZAKAT_STATUS.NOT_MANDATORY;
  if (totalWealth < nisabThreshold) return ZAKAT_STATUS.NOT_MANDATORY;
  if (!activeCycle) return ZAKAT_STATUS.MONITORING;
  if (activeCycle.status === 'paid') return ZAKAT_STATUS.PAID;
  if (hasOneHijriYearPassed(activeCycle.startDate)) {
    return totalWealth >= nisabThreshold ? ZAKAT_STATUS.DUE : ZAKAT_STATUS.EXEMPT;
  }
  return ZAKAT_STATUS.MONITORING;
};

// Get Hijri month names
export const getHijriMonthName = (monthNumber) => {
  const months = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
    'Ramadan', 'Shawwal', "Dhul-Qi'dah", 'Dhul-Hijjah'
  ];
  return months[monthNumber - 1] || '';
};

// Format Hijri date for display
export const formatHijriDate = (hijriDate) => {
  if (!hijriDate) return '';
  return `${hijriDate.day} ${getHijriMonthName(hijriDate.month)} ${hijriDate.year} AH`;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATED: Comprehensive Zakatable Wealth Calculation
// Now includes: Accounts, Lendings (receivables), Investments, Goals
// Deducts: Loans (liabilities)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate total zakatable wealth from ALL sources.
 *
 * Zakatable sources (included):
 *   - Accounts: cash, bank, mobile_banking, gold, silver
 *   - Lendings: money the user lent to others (receivable = still owner's wealth)
 *   - Investments: current market value of active investments
 *   - Goals (financialGoals): savings earmarked for goals (user still owns it)
 *
 * Deducted (liabilities):
 *   - Loans: outstanding amounts the user owes to others
 *
 * @param {Object} params
 * @param {Array}  params.accounts     - from Firestore users/{uid}/accounts
 * @param {Array}  params.lendings     - from Firestore users/{uid}/lendings
 * @param {Array}  params.loans        - from Firestore users/{uid}/loans
 * @param {Array}  params.investments  - from Firestore users/{uid}/investments
 * @param {Array}  params.goals        - from Firestore users/{uid}/financialGoals
 * @returns {Object} wealth breakdown and net zakatable wealth
 */
export const calculateZakatableWealth = ({
  accounts = [],
  lendings = [],
  loans = [],
  investments = [],
  goals = [],
}) => {
  const breakdown = {
    accountsTotal: 0,      // sum of all account balances
    lendingsTotal: 0,      // money lent to others (receivable)
    investmentsTotal: 0,   // current value of active investments
    goalsTotal: 0,         // savings in active financial goals
    totalAssets: 0,
    loansTotal: 0,         // outstanding loans (liability — deducted)
    netZakatableWealth: 0,
    // Per-category breakdown for display
    accountBreakdown: {},
  };

  // ── Accounts ───────────────────────────────────────────────────────────
  accounts.forEach((acc) => {
    const bal = Number(acc.balance) || 0;
    if (bal <= 0) return;
    breakdown.accountsTotal += bal;
    const type = acc.type || 'other';
    breakdown.accountBreakdown[type] = (breakdown.accountBreakdown[type] || 0) + bal;
  });

  // ── Lendings (Receivables) ─────────────────────────────────────────────
  // Only count active lendings (money still outstanding/owed to user)
  // Field: remainingBalance (from lending page: principalAmount - totalRepaid)
  lendings.forEach((lending) => {
    if (lending.status !== 'active') return;
    const outstanding = Number(lending.remainingBalance) || Number(lending.principalAmount) || 0;
    breakdown.lendingsTotal += outstanding;
  });

  // ── Loans (Liabilities — to be deducted) ──────────────────────────────
  // Field: remainingBalance from loan page
  loans.forEach((loan) => {
    if (loan.status !== 'active') return;
    const outstanding = Number(loan.remainingBalance) || Number(loan.principalAmount) || 0;
    breakdown.loansTotal += outstanding;
  });

  // ── Investments ────────────────────────────────────────────────────────
  // Use currentValue * quantity if available, else purchasePrice * quantity
  // Matches investmentCollections.js calculateReturns logic
  investments.forEach((inv) => {
    if (inv.status !== 'active') return;
    const qty = Number(inv.quantity) || 1;
    const currentVal = Number(inv.currentValue) || Number(inv.purchasePrice) || 0;
    breakdown.investmentsTotal += currentVal * qty;
  });

  // ── Financial Goals ────────────────────────────────────────────────────
  // Collection: financialGoals — field: currentAmount
  // Only active goals (not completed/cancelled)
  goals.forEach((goal) => {
    if (goal.status !== 'active') return;
    const saved = Number(goal.currentAmount) || 0;
    breakdown.goalsTotal += saved;
  });

  // ── Totals ────────────────────────────────────────────────────────────
  breakdown.totalAssets =
    breakdown.accountsTotal +
    breakdown.lendingsTotal +
    breakdown.investmentsTotal +
    breakdown.goalsTotal;

  // Net = Assets − Liabilities (never negative for Zakat purposes)
  breakdown.netZakatableWealth = Math.max(
    0,
    breakdown.totalAssets - breakdown.loansTotal
  );

  return breakdown;
};

// Generate installment schedule
export const generateInstallmentSchedule = (totalZakat, numberOfInstallments, startDate = new Date()) => {
  const perInstallment = totalZakat / numberOfInstallments;
  return Array.from({ length: numberOfInstallments }, (_, i) => {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    return {
      installmentNumber: i + 1,
      amount: Math.round(perInstallment * 100) / 100,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'pending', // pending | paid
      paidDate: null,
      paidAmount: null,
    };
  });
};