// src/lib/translations.js

export const translations = {
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
    welcomeBack: 'Welcome back',
    overviewFinances: 'Overview of your finances',
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
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    loading: 'Loading...',
    noData: 'No data',
    success: 'Success',
    error: 'Error',
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
    welcomeBack: 'স্বাগতম',
    overviewFinances: 'আপনার আর্থিক সংক্ষিপ্ত বিবরণ',
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
    
    // Common
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    add: 'যোগ করুন',
    loading: 'লোড হচ্ছে...',
    noData: 'কোন তথ্য নেই',
    success: 'সফল',
    error: 'ত্রুটি',
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
    logout: 'تسجيل الخروج',
    
    // Dashboard
    welcomeBack: 'مرحباً بعودتك',
    overviewFinances: 'نظرة عامة على مالياتك',
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
    
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    success: 'نجاح',
    error: 'خطأ',
  },
};

export const t = (key, language = 'en') => {
  return translations[language]?.[key] || translations.en[key] || key;
};