// src/lib/zakatUtils.js
import HijriDate, { toHijri, toGregorian } from 'hijri-converter';

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
  
  // Add 1 to Hijri year
  const nextHijriYear = hijri.hy + 1;
  
  // Convert back to Gregorian
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
  if (nisabThreshold === 0) {
    return ZAKAT_STATUS.NOT_MANDATORY;
  }

  if (totalWealth < nisabThreshold) {
    return ZAKAT_STATUS.NOT_MANDATORY;
  }

  if (!activeCycle) {
    return ZAKAT_STATUS.MONITORING; // Should start a cycle
  }

  if (activeCycle.status === 'paid') {
    return ZAKAT_STATUS.PAID;
  }

  if (hasOneHijriYearPassed(activeCycle.startDate)) {
    if (totalWealth >= nisabThreshold) {
      return ZAKAT_STATUS.DUE;
    } else {
      return ZAKAT_STATUS.EXEMPT;
    }
  }

  return ZAKAT_STATUS.MONITORING;
};

// Get Hijri month names
export const getHijriMonthName = (monthNumber) => {
  const months = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhul-Qi\'dah', 'Dhul-Hijjah'
  ];
  return months[monthNumber - 1] || '';
};

// Format Hijri date for display
export const formatHijriDate = (hijriDate) => {
  if (!hijriDate) return '';
  return `${hijriDate.day} ${getHijriMonthName(hijriDate.month)} ${hijriDate.year} AH`;
};