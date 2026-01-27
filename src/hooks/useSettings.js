// src/hooks/useSettings.js
import { useState, useEffect } from 'react';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    currency: 'BDT',
    dateFormat: 'DD/MM/YYYY',
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedCurrency = localStorage.getItem('currency') || 'BDT';
    const savedDateFormat = localStorage.getItem('dateFormat') || 'DD/MM/YYYY';

    setSettings({
      theme: savedTheme,
      language: savedLanguage,
      currency: savedCurrency,
      dateFormat: savedDateFormat,
    });

    // Apply theme
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return settings;
};

// Currency symbols
export const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'BDT': '৳',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'SAR': 'SR',
    'AED': 'د.إ',
  };
  return symbols[currencyCode] || currencyCode;
};

// Format amount with currency
export const formatAmount = (amount, currencyCode = 'BDT') => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString()}`;
};

// Format date based on preference
export const formatDate = (dateString, format = 'DD/MM/YYYY') => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
};

// Translation function
export const translate = (key, language = 'en') => {
  const translations = {
    en: {
      // Navigation
      dashboard: 'Dashboard',
      accounts: 'Accounts',
      transactions: 'Transactions',
      transfer: 'Transfer',
      categories: 'Categories',
      zakat: 'Zakat',
      analytics: 'Analytics',
      settings: 'Settings',
      logout: 'Logout',
      
      // Dashboard
      totalBalance: 'Total Balance',
      income: 'Income',
      expenses: 'Expenses',
      thisMonth: 'This month',
      zakatStatus: 'Zakat Status',
      quickActions: 'Quick Actions',
      recentTransactions: 'Recent Transactions',
      addAccount: 'Add Account',
      addTransaction: 'Add Transaction',
      reports: 'Reports',
      allAccounts: 'Across all accounts',
      
      // Accounts
      accountsTitle: 'Accounts',
      manageAccounts: 'Manage your financial accounts',
      noAccountsYet: 'No accounts yet',
      createFirstAccount: 'Create your first account to start tracking your finances',
      
      // Common
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
    },
    
    bn: {
      // Navigation
      dashboard: 'ড্যাশবোর্ড',
      accounts: 'হিসাব',
      transactions: 'লেনদেন',
      transfer: 'স্থানান্তর',
      categories: 'বিভাগ',
      zakat: 'যাকাত',
      analytics: 'বিশ্লেষণ',
      settings: 'সেটিংস',
      logout: 'লগআউট',
      
      // Dashboard
      totalBalance: 'মোট ব্যালেন্স',
      income: 'আয়',
      expenses: 'ব্যয়',
      thisMonth: 'এই মাসে',
      zakatStatus: 'যাকাত স্ট্যাটাস',
      quickActions: 'দ্রুত কাজ',
      recentTransactions: 'সাম্প্রতিক লেনদেন',
      addAccount: 'হিসাব যোগ করুন',
      addTransaction: 'লেনদেন যোগ করুন',
      reports: 'রিপোর্ট',
      allAccounts: 'সব হিসাব জুড়ে',
      
      // Accounts
      accountsTitle: 'হিসাবসমূহ',
      manageAccounts: 'আপনার আর্থিক হিসাব পরিচালনা করুন',
      noAccountsYet: 'এখনো কোন হিসাব নেই',
      createFirstAccount: 'আপনার অর্থ ট্র্যাক করা শুরু করতে প্রথম হিসাব তৈরি করুন',
      
      // Common
      save: 'সংরক্ষণ',
      cancel: 'বাতিল',
      delete: 'মুছুন',
      edit: 'সম্পাদনা',
      add: 'যোগ করুন',
    },
    
    ar: {
      // Navigation
      dashboard: 'لوحة التحكم',
      accounts: 'الحسابات',
      transactions: 'المعاملات',
      transfer: 'تحويل',
      categories: 'الفئات',
      zakat: 'الزكاة',
      analytics: 'التحليلات',
      settings: 'الإعدادات',
      logout: 'تسجيل خروج',
      
      // Dashboard
      totalBalance: 'الرصيد الإجمالي',
      income: 'الدخل',
      expenses: 'المصروفات',
      thisMonth: 'هذا الشهر',
      zakatStatus: 'حالة الزكاة',
      quickActions: 'إجراءات سريعة',
      recentTransactions: 'المعاملات الأخيرة',
      addAccount: 'إضافة حساب',
      addTransaction: 'إضافة معاملة',
      reports: 'التقارير',
      allAccounts: 'عبر جميع الحسابات',
      
      // Accounts
      accountsTitle: 'الحسابات',
      manageAccounts: 'إدارة حساباتك المالية',
      noAccountsYet: 'لا توجد حسابات بعد',
      createFirstAccount: 'أنشئ حسابك الأول لبدء تتبع مالياتك',
      
      // Common
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
    },
  };

  return translations[language]?.[key] || translations.en[key] || key;
};