// src/lib/zakatUtils.js
import HijriDate, { toHijri, toGregorian } from 'hijri-converter';

// ─── Hijri / Date helpers ──────────────────────────────────────────────────────

export const gregorianToHijri = (gregorianDate) => {
  const date  = new Date(gregorianDate);
  const hijri = toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { year: hijri.hy, month: hijri.hm, day: hijri.hd, formatted: `${hijri.hd}/${hijri.hm}/${hijri.hy}` };
};

export const hijriToGregorian = (hijriYear, hijriMonth, hijriDay) => {
  const g = toGregorian(hijriYear, hijriMonth, hijriDay);
  return new Date(g.gy, g.gm - 1, g.gd);
};

export const addOneHijriYear = (gregorianDate) => {
  const date  = new Date(gregorianDate);
  const hijri = toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return hijriToGregorian(hijri.hy + 1, hijri.hm, hijri.hd);
};

export const daysUntilHijriAnniversary = (startDate) => {
  const endDate = addOneHijriYear(startDate);
  const diff    = endDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const hasOneHijriYearPassed = (startDate) => {
  return new Date() >= addOneHijriYear(startDate);
};

export const calculateZakat = (totalWealth) => totalWealth * 0.025;

export const ZAKAT_STATUS = {
  NOT_MANDATORY: 'Not Mandatory',
  MONITORING:    'Monitoring',
  DUE:           'Zakat Due',
  PAID:          'Paid',
  EXEMPT:        'Exempt',
};

export const determineZakatStatus = (totalWealth, nisabThreshold, activeCycle) => {
  if (!nisabThreshold || totalWealth < nisabThreshold) return ZAKAT_STATUS.NOT_MANDATORY;
  if (!activeCycle)                                    return ZAKAT_STATUS.MONITORING;
  if (activeCycle.status === 'paid')                   return ZAKAT_STATUS.PAID;
  if (hasOneHijriYearPassed(activeCycle.startDate))
    return totalWealth >= nisabThreshold ? ZAKAT_STATUS.DUE : ZAKAT_STATUS.EXEMPT;
  return ZAKAT_STATUS.MONITORING;
};

export const getHijriMonthName = (n) => ([
  'Muharram','Safar','Rabi al-Awwal','Rabi al-Thani',
  "Jumada al-Awwal","Jumada al-Thani",'Rajab',"Sha'ban",
  'Ramadan','Shawwal',"Dhul-Qi'dah",'Dhul-Hijjah',
])[n - 1] || '';

export const formatHijriDate = (hijriDate) => {
  if (!hijriDate) return '';
  return `${hijriDate.day} ${getHijriMonthName(hijriDate.month)} ${hijriDate.year} AH`;
};

// ─── Installment schedule ────────────────────────────────────────────────────

export const generateInstallmentSchedule = (totalAmount, numberOfInstallments) => {
  const perInstallment = Math.round((totalAmount / numberOfInstallments) * 100) / 100;
  const schedule       = [];
  const today          = new Date();
  for (let i = 1; i <= numberOfInstallments; i++) {
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + i);
    schedule.push({
      installmentNumber: i,
      amount:            i === numberOfInstallments
        ? Math.round((totalAmount - perInstallment * (numberOfInstallments - 1)) * 100) / 100
        : perInstallment,
      dueDate:  dueDate.toISOString().split('T')[0],
      status:   'pending',
    });
  }
  return schedule;
};

// ─────────────────────────────────────────────────────────────────────────────
// ZAKATABLE WEALTH CALCULATION
// ─────────────────────────────────────────────────────────────────────────────
//
// ISLAMIC RULES APPLIED:
//
//  ACCOUNTS
//  ─────────
//  + All account balances                           ← INCLUDED
//  − Riba (interest) portion deducted per-account  ← EXCLUDED (impure, must be purified)
//    An account may carry `ribaBalance` (the accumulated interest portion).
//    Only the purified principal portion is Zakatable.
//
//  LENDINGS (money you gave to others)
//  ─────────────────────────────────────
//  Each lending has a `countForZakat` boolean (set by the user):
//    countForZakat = true  → amount IS in your ownership; INCLUDE in Zakatable wealth.
//    countForZakat = false → recovery uncertain / deferred; EXCLUDE (user's choice).
//  Default when not set: false (excluded — the safer, more conservative default).
//
//  LOANS (money you owe others)
//  ─────────────────────────────
//  − Outstanding loan amounts                       ← DEDUCTED (liability)
//
//  INVESTMENTS, GOALS, JEWELLERY
//  ──────────────────────────────
//  + Active investments (current value)             ← INCLUDED
//  + Savings goal amounts                           ← INCLUDED
//  + Jewellery zakatable value (after 15% deduction) ← INCLUDED
//
// ─────────────────────────────────────────────────────────────────────────────

export const calculateZakatableWealth = ({
  accounts         = [],
  lendings         = [],
  loans            = [],
  investments      = [],
  goals            = [],
  jewellery        = [],
  ribaTransactions = [],   // transactions with isRiba:true — their amounts are excluded
}) => {

  // ── 1. Riba total from transactions ─────────────────────────────────────────
  // Sum all income transactions marked isRiba:true.
  // These represent interest credited to accounts — impure wealth that must be
  // excluded from Zakatable assets and given to charity.
  const ribaTotal = ribaTransactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // ── 2. Account breakdown ────────────────────────────────────────────────────
  const accountBreakdown = { cash: 0, bank: 0, mobile_banking: 0, gold: 0, silver: 0, other: 0 };
  let   accountsTotal    = 0;

  const normalizeType = (raw) => {
    if (!raw) return 'other';
    const t = raw.trim();
    if (['Mobile Banking', 'mobile_banking', 'mobile banking'].includes(t)) return 'mobile_banking';
    return t.toLowerCase().replace(/\s+/g, '_');
  };

  for (const acc of accounts) {
    const bal = Number(acc.balance) || 0;
    accountsTotal += bal;

    const key = normalizeType(acc.type);
    if      (key === 'cash')           accountBreakdown.cash           += bal;
    else if (key === 'bank')           accountBreakdown.bank           += bal;
    else if (key === 'mobile_banking') accountBreakdown.mobile_banking += bal;
    else if (key === 'gold')           accountBreakdown.gold           += bal;
    else if (key === 'silver')         accountBreakdown.silver         += bal;
    else                               accountBreakdown.other          += bal;
  }

  // ── 2. Lendings ─────────────────────────────────────────────────────────────
  // Split by user's per-lending Zakat decision.
  let   lendingsIncludedTotal = 0;   // counted by user → added to Zakatable wealth
  let   lendingsExcludedTotal = 0;   // deferred by user → excluded
  const activeLendings        = lendings.filter(l => l.status === 'active');

  for (const l of activeLendings) {
    const amt = Number(l.remainingBalance ?? l.principalAmount ?? 0);
    if (l.countForZakat === true) {
      lendingsIncludedTotal += amt;
    } else {
      lendingsExcludedTotal += amt;
    }
  }

  // ── 3. Loans (liabilities) ───────────────────────────────────────────────────
  const loansTotal = loans.reduce((s, l) => {
    const outstanding = Number(l.remainingBalance ?? l.principalAmount ?? 0);
    return s + outstanding;
  }, 0);

  // ── 4. Investments ───────────────────────────────────────────────────────────
  const activeInvestments  = investments.filter(i => i.status === 'active');
  const investmentsTotal   = activeInvestments.reduce((s, inv) => {
    const qty = Number(inv.quantity) || 1;
    return s + (Number(inv.currentValue) || Number(inv.purchasePrice) || 0) * qty;
  }, 0);

  // ── 5. Goals ─────────────────────────────────────────────────────────────────
  const activeGoals  = goals.filter(g => g.status === 'active' && Number(g.currentAmount) > 0);
  const goalsTotal   = activeGoals.reduce((s, g) => s + (Number(g.currentAmount) || 0), 0);

  // ── 6. Jewellery ─────────────────────────────────────────────────────────────
  const pricedJewellery  = jewellery.filter(j => j.currentZakatValue > 0);
  const jewelleryTotal   = pricedJewellery.reduce((s, j) => s + (Number(j.currentZakatValue) || 0), 0);
  const jewelleryCount   = pricedJewellery.length;

  // ── 7. Net Zakatable Wealth ──────────────────────────────────────────────────
  // = account balances
  //   + lendingsIncluded (user opted in)
  //   + investments + goals + jewellery
  //   − loans (liability)
  //   − ribaTotal (impure interest from isRiba transactions — must be purified)

  const totalAssets        = accountsTotal + lendingsIncludedTotal + investmentsTotal + goalsTotal + jewelleryTotal;
  const netZakatableWealth = Math.max(0, totalAssets - loansTotal - ribaTotal);

  return {
    // Account-level
    accountBreakdown,
    accountsTotal,
    ribaTotal,               // how much interest was excluded (from isRiba transactions)
    ribaExcluded: ribaTotal, // alias for UI clarity

    // Lendings
    lendingsTotal:         lendingsIncludedTotal + lendingsExcludedTotal,
    lendingsIncludedTotal,
    lendingsExcludedTotal,

    // Other assets
    investmentsTotal,
    goalsTotal,
    jewelleryTotal,
    jewelleryCount,

    // Liabilities
    loansTotal,

    // Totals
    totalAssets,
    netZakatableWealth,
  };
};