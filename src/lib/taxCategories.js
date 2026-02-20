// src/lib/taxCategories.js

/**
 * NBR (National Board of Revenue) Bangladesh Tax Categories
 * For IT-10BB (Expenditure Statement) and IT-10BB2 (Assets & Liabilities)
 */

// Personal & Family Expenses (IT-10BB Schedule A)
export const PERSONAL_EXPENSES = [
  {
    id: 'food_groceries',
    name: 'Food & Groceries',
    nbrCode: 'A.1',
    description: 'Household food items, groceries, dining',
    suggestedKeywords: ['food', 'grocery', 'groceries', 'mart', 'market', 'restaurant', 'dining', 'meal']
  },
  {
    id: 'clothing',
    name: 'Clothing & Footwear',
    nbrCode: 'A.2',
    description: 'Clothes, shoes, fashion accessories',
    suggestedKeywords: ['cloth', 'clothing', 'fashion', 'dress', 'shirt', 'pant', 'shoe', 'footwear']
  },
  {
    id: 'house_rent',
    name: 'House Rent',
    nbrCode: 'A.3',
    description: 'Residential rent paid',
    suggestedKeywords: ['rent', 'house rent', 'flat rent', 'apartment']
  },
  {
    id: 'utilities',
    name: 'Utilities',
    nbrCode: 'A.4',
    description: 'Electricity, gas, water, internet, phone bills',
    suggestedKeywords: ['electric', 'electricity', 'gas', 'water', 'internet', 'wifi', 'phone', 'mobile', 'bill', 'utility']
  },
  {
    id: 'transport',
    name: 'Transport & Fuel',
    nbrCode: 'A.5',
    description: 'Public transport, fuel, vehicle maintenance, parking',
    suggestedKeywords: ['transport', 'transportation', 'fuel', 'petrol', 'diesel', 'cng', 'taxi', 'uber', 'pathao', 'rickshaw', 'bus', 'train', 'parking']
  },
  {
    id: 'medical',
    name: 'Medical & Healthcare',
    nbrCode: 'A.6',
    description: 'Doctor fees, medicine, hospital, health insurance',
    suggestedKeywords: ['health', 'healthcare', 'medical', 'doctor', 'medicine', 'hospital', 'clinic', 'pharmacy', 'treatment']
  },
  {
    id: 'education',
    name: 'Education',
    nbrCode: 'A.7',
    description: 'School/university fees, books, courses, training',
    suggestedKeywords: ['education', 'school', 'university', 'college', 'tuition', 'course', 'training', 'book', 'study']
  },
  {
    id: 'entertainment',
    name: 'Entertainment & Recreation',
    nbrCode: 'A.8',
    description: 'Movies, sports, hobbies, vacation, subscriptions',
    suggestedKeywords: ['entertainment', 'movie', 'cinema', 'sport', 'game', 'gaming', 'hobby', 'vacation', 'travel', 'tour', 'netflix', 'spotify', 'subscription']
  },
  {
    id: 'household',
    name: 'Household Items',
    nbrCode: 'A.9',
    description: 'Furniture, appliances, home maintenance',
    suggestedKeywords: ['furniture', 'appliance', 'household', 'home', 'repair', 'maintenance']
  },
  {
    id: 'personal_care',
    name: 'Personal Care',
    nbrCode: 'A.10',
    description: 'Salon, cosmetics, toiletries',
    suggestedKeywords: ['salon', 'barber', 'cosmetic', 'beauty', 'toiletries', 'personal care']
  },
  {
    id: 'donation',
    name: 'Donations & Charity',
    nbrCode: 'A.11',
    description: 'Charitable donations, zakat',
    suggestedKeywords: ['donation', 'charity', 'zakat', 'sadaqah', 'donate']
  },
  {
    id: 'insurance',
    name: 'Insurance Premium',
    nbrCode: 'A.12',
    description: 'Life, health, vehicle insurance premiums',
    suggestedKeywords: ['insurance', 'premium', 'policy']
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous Personal Expenses',
    nbrCode: 'A.13',
    description: 'Other personal and family expenses',
    suggestedKeywords: ['misc', 'miscellaneous', 'other', 'others']
  }
];

// Tax Paid (IT-10BB Schedule B)
export const TAX_PAID = [
  {
    id: 'income_tax',
    name: 'Income Tax Paid',
    nbrCode: 'B.1',
    description: 'Tax deducted at source (TDS), advance tax payment',
    suggestedKeywords: ['tax', 'income tax', 'tds', 'advance tax', 'tax payment']
  },
  {
    id: 'vat_tax',
    name: 'VAT/Other Tax Paid',
    nbrCode: 'B.2',
    description: 'VAT, customs duty, other taxes',
    suggestedKeywords: ['vat', 'value added tax']
  }
];

// Investments/Savings (IT-10BB Schedule C)
export const INVESTMENTS = [
  {
    id: 'life_insurance',
    name: 'Life Insurance Premium',
    nbrCode: 'C.1',
    description: 'Life insurance premium eligible for tax rebate',
    suggestedKeywords: ['life insurance', 'lic', 'insurance premium']
  },
  {
    id: 'dps',
    name: 'DPS/Fixed Deposit',
    nbrCode: 'C.2',
    description: 'Bank DPS, FDR, term deposits',
    suggestedKeywords: ['dps', 'fixed deposit', 'fdr', 'fd', 'term deposit']
  },
  {
    id: 'savings_cert',
    name: 'Savings Certificates',
    nbrCode: 'C.3',
    description: 'Sanchayapatra, government bonds',
    suggestedKeywords: ['sanchaya', 'sanchayapatra', 'savings certificate', 'bond']
  },
  {
    id: 'stock_market',
    name: 'Stock Market Investment',
    nbrCode: 'C.4',
    description: 'Shares, mutual funds, securities',
    suggestedKeywords: ['stock', 'share', 'mutual fund', 'securities', 'equity']
  },
  {
    id: 'provident_fund',
    name: 'Provident Fund',
    nbrCode: 'C.5',
    description: 'Contribution to provident fund',
    suggestedKeywords: ['provident fund', 'pf', 'gpf', 'cpf']
  },
  {
    id: 'other_investment',
    name: 'Other Approved Investments',
    nbrCode: 'C.6',
    description: 'Other government-approved investments',
    suggestedKeywords: ['investment', 'saving']
  }
];

// Loan Repayment (IT-10BB Schedule D)
export const LOAN_REPAYMENT = [
  {
    id: 'loan_principal',
    name: 'Loan Principal Repayment',
    nbrCode: 'D.1',
    description: 'Principal amount repayment (excluding interest)',
    suggestedKeywords: ['loan', 'loan repay', 'emi', 'installment', 'repayment']
  },
  {
    id: 'loan_interest',
    name: 'Loan Interest Payment',
    nbrCode: 'D.2',
    description: 'Interest portion of loan payment',
    suggestedKeywords: ['interest', 'loan interest']
  }
];

// All Expense Tax Categories Combined
export const ALL_EXPENSE_TAX_CATEGORIES = [
  ...PERSONAL_EXPENSES,
  ...TAX_PAID,
  ...INVESTMENTS,
  ...LOAN_REPAYMENT
];

// Income Categories for Tax (for reference, not IT-10BB)
export const INCOME_TAX_CATEGORIES = [
  {
    id: 'salary',
    name: 'Salary/Wages',
    nbrCode: 'INC-1',
    description: 'Employment income, basic salary',
    suggestedKeywords: ['salary', 'wage', 'pay', 'payroll']
  },
  {
    id: 'bonus',
    name: 'Bonus/Allowance',
    nbrCode: 'INC-2',
    description: 'Festival bonus, performance bonus, allowances',
    suggestedKeywords: ['bonus', 'allowance', 'incentive']
  },
  {
    id: 'business',
    name: 'Business/Professional Income',
    nbrCode: 'INC-3',
    description: 'Self-employment, business income, professional fees',
    suggestedKeywords: ['business', 'sales', 'revenue', 'professional', 'freelance']
  },
  {
    id: 'investment_income',
    name: 'Investment Income',
    nbrCode: 'INC-4',
    description: 'Dividends, interest, capital gains',
    suggestedKeywords: ['dividend', 'interest', 'profit', 'capital gain']
  },
  {
    id: 'rental_income',
    name: 'Rental Income',
    nbrCode: 'INC-5',
    description: 'Income from property rent',
    suggestedKeywords: ['rent income', 'rental income', 'property income']
  },
  {
    id: 'other_income',
    name: 'Other Income',
    nbrCode: 'INC-6',
    description: 'Any other taxable income',
    suggestedKeywords: ['other income', 'miscellaneous income']
  }
];

// Asset Categories (for IT-10BB2)
export const ASSET_CATEGORIES = [
  {
    id: 'cash_bank',
    name: 'Cash & Bank Balance',
    nbrCode: 'AST-1',
    description: 'Cash in hand, bank accounts, digital wallets',
    depreciable: false
  },
  {
    id: 'investments',
    name: 'Investments & Securities',
    nbrCode: 'AST-2',
    description: 'Shares, bonds, mutual funds, FDR, DPS',
    depreciable: false
  },
  {
    id: 'motor_vehicle',
    name: 'Motor Vehicles',
    nbrCode: 'AST-3',
    description: 'Cars, motorcycles, other vehicles',
    depreciable: true,
    depreciationRate: 20 // 20% per year
  },
  {
    id: 'jewelry',
    name: 'Jewelry & Gold',
    nbrCode: 'AST-4',
    description: 'Gold, silver, precious stones',
    depreciable: false
  },
  {
    id: 'property',
    name: 'Property/Real Estate',
    nbrCode: 'AST-5',
    description: 'Land, buildings, apartments',
    depreciable: false // Land doesn't depreciate
  },
  {
    id: 'electronics',
    name: 'Electronics & Appliances',
    nbrCode: 'AST-6',
    description: 'Computers, phones, TVs, appliances',
    depreciable: true,
    depreciationRate: 25
  },
  {
    id: 'furniture',
    name: 'Furniture & Fixtures',
    nbrCode: 'AST-7',
    description: 'Furniture, fittings',
    depreciable: true,
    depreciationRate: 10
  },
  {
    id: 'business_asset',
    name: 'Business Assets',
    nbrCode: 'AST-8',
    description: 'Business equipment, inventory',
    depreciable: true,
    depreciationRate: 15
  },
  {
    id: 'other_asset',
    name: 'Other Assets',
    nbrCode: 'AST-9',
    description: 'Any other valuable assets',
    depreciable: false
  }
];

// Liability Categories (for IT-10BB2)
export const LIABILITY_CATEGORIES = [
  {
    id: 'bank_loan',
    name: 'Bank Loan',
    nbrCode: 'LIB-1',
    description: 'Home loan, car loan, personal loan from banks'
  },
  {
    id: 'credit_card',
    name: 'Credit Card Debt',
    nbrCode: 'LIB-2',
    description: 'Outstanding credit card balance'
  },
  {
    id: 'personal_loan',
    name: 'Personal Loan',
    nbrCode: 'LIB-3',
    description: 'Loans from individuals, family, friends'
  },
  {
    id: 'mortgage',
    name: 'Mortgage',
    nbrCode: 'LIB-4',
    description: 'Property mortgage'
  },
  {
    id: 'business_liability',
    name: 'Business Liabilities',
    nbrCode: 'LIB-5',
    description: 'Business loans, payables'
  },
  {
    id: 'other_liability',
    name: 'Other Liabilities',
    nbrCode: 'LIB-6',
    description: 'Any other outstanding debt'
  }
];

/**
 * Get all tax categories by section
 */
export const getTaxCategoriesBySection = (section) => {
  switch (section) {
    case 'personal_expenses':
      return PERSONAL_EXPENSES;
    case 'tax_paid':
      return TAX_PAID;
    case 'investments':
      return INVESTMENTS;
    case 'loan_repayment':
      return LOAN_REPAYMENT;
    case 'income':
      return INCOME_TAX_CATEGORIES;
    case 'assets':
      return ASSET_CATEGORIES;
    case 'liabilities':
      return LIABILITY_CATEGORIES;
    default:
      return [];
  }
};

/**
 * Get tax category by ID
 */
export const getTaxCategoryById = (categoryId) => {
  const allCategories = [
    ...ALL_EXPENSE_TAX_CATEGORIES,
    ...INCOME_TAX_CATEGORIES,
    ...ASSET_CATEGORIES,
    ...LIABILITY_CATEGORIES
  ];
  
  return allCategories.find(cat => cat.id === categoryId);
};

/**
 * Get section name for tax category
 */
export const getSectionForTaxCategory = (categoryId) => {
  if (PERSONAL_EXPENSES.find(c => c.id === categoryId)) return 'personal_expenses';
  if (TAX_PAID.find(c => c.id === categoryId)) return 'tax_paid';
  if (INVESTMENTS.find(c => c.id === categoryId)) return 'investments';
  if (LOAN_REPAYMENT.find(c => c.id === categoryId)) return 'loan_repayment';
  if (INCOME_TAX_CATEGORIES.find(c => c.id === categoryId)) return 'income';
  if (ASSET_CATEGORIES.find(c => c.id === categoryId)) return 'assets';
  if (LIABILITY_CATEGORIES.find(c => c.id === categoryId)) return 'liabilities';
  return null;
};

/**
 * Tax Year Helper Functions
 */

/**
 * Get current income year (July to June)
 * Returns: "2024-25" if current date is between July 2024 - June 2025
 */
export const getCurrentIncomeYear = () => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();
  
  // If month is July (6) or later, income year starts this year
  // If month is before July, income year started last year
  if (currentMonth >= 6) { // July = 6, August = 7, etc.
    return `${currentYear}-${String(currentYear + 1).slice(2)}`;
  } else {
    return `${currentYear - 1}-${String(currentYear).slice(2)}`;
  }
};

/**
 * Get fiscal year start and end dates for an income year
 * Input: "2024-25"
 * Returns: { start: "2024-07-01", end: "2025-06-30" }
 */
export const getFiscalYearDates = (incomeYear) => {
  const [startYear] = incomeYear.split('-');
  const endYear = parseInt(startYear) + 1;
  
  return {
    start: `${startYear}-07-01`,
    end: `${endYear}-06-30`
  };
};

/**
 * Get tax year from income year
 * Input: "2024-25" → Returns: "2025"
 */
export const getTaxYear = (incomeYear) => {
  const [startYear] = incomeYear.split('-');
  return String(parseInt(startYear) + 1);
};

/**
 * Get filing deadline for tax year
 * Input: "2025" → Returns: "2025-11-30"
 */
export const getFilingDeadline = (taxYear) => {
  return `${taxYear}-11-30`;
};

/**
 * Get days remaining until filing deadline
 */
export const getDaysUntilDeadline = (deadline) => {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if a date falls within a fiscal year
 */
export const isDateInFiscalYear = (date, incomeYear) => {
  const { start, end } = getFiscalYearDates(incomeYear);
  return date >= start && date <= end;
};