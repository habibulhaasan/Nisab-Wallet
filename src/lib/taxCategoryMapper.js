// src/lib/taxCategoryMapper.js

import {
  ALL_EXPENSE_TAX_CATEGORIES,
  INCOME_TAX_CATEGORIES,
  getTaxCategoryById,
  getSectionForTaxCategory
} from './taxCategories';

/**
 * Analyze user category name and suggest appropriate tax category
 * Returns: { taxCategoryId, confidence, reason, section }
 */
export const suggestTaxCategory = (userCategoryName, userCategoryType) => {
  const name = userCategoryName.toLowerCase().trim();
  
  // Determine which set of tax categories to search
  const taxCategories = userCategoryType === 'Income' 
    ? INCOME_TAX_CATEGORIES 
    : ALL_EXPENSE_TAX_CATEGORIES;
  
  // Check for keyword matches
  for (const taxCat of taxCategories) {
    // Check if any keyword is in the user category name
    for (const keyword of taxCat.suggestedKeywords) {
      if (name.includes(keyword.toLowerCase())) {
        return {
          taxCategoryId: taxCat.id,
          confidence: 'high',
          reason: `Matched keyword: "${keyword}"`,
          section: getSectionForTaxCategory(taxCat.id)
        };
      }
    }
    
    // Check if category name exactly matches tax category name
    if (name === taxCat.name.toLowerCase()) {
      return {
        taxCategoryId: taxCat.id,
        confidence: 'very_high',
        reason: 'Exact name match',
        section: getSectionForTaxCategory(taxCat.id)
      };
    }
  }
  
  // Fuzzy matching for common variations
  const fuzzyMatches = getFuzzyMatches(name, userCategoryType);
  if (fuzzyMatches) {
    return fuzzyMatches;
  }
  
  // Default fallback
  if (userCategoryType === 'Income') {
    return {
      taxCategoryId: 'other_income',
      confidence: 'low',
      reason: 'No match found, defaulting to Other Income',
      section: 'income',
      needsReview: true
    };
  } else {
    return {
      taxCategoryId: 'miscellaneous',
      confidence: 'low',
      reason: 'No match found, defaulting to Miscellaneous',
      section: 'personal_expenses',
      needsReview: true
    };
  }
};

/**
 * Fuzzy matching for common category name variations
 */
const getFuzzyMatches = (name, type) => {
  if (type === 'Expense') {
    // Common variations for expense categories
    if (name.includes('shop') && !name.includes('grocery')) {
      return {
        taxCategoryId: 'clothing',
        confidence: 'medium',
        reason: 'Shopping typically refers to clothing',
        section: 'personal_expenses',
        needsReview: true
      };
    }
    
    if (name.includes('bill') && !name.includes('food')) {
      return {
        taxCategoryId: 'utilities',
        confidence: 'medium',
        reason: 'Bills typically refer to utilities',
        section: 'personal_expenses',
        needsReview: true
      };
    }
    
    if (name.includes('loan') || name.includes('emi')) {
      return {
        taxCategoryId: 'loan_principal',
        confidence: 'high',
        reason: 'Loan/EMI payment detected',
        section: 'loan_repayment'
      };
    }
  }
  
  if (type === 'Income') {
    // Special handling for "Loan" as income (borrowed money)
    if (name === 'loan') {
      return {
        taxCategoryId: 'other_income',
        confidence: 'medium',
        reason: 'Loan received (not taxable income)',
        section: 'income',
        needsReview: true,
        warningMessage: 'Note: Borrowed money is not taxable income'
      };
    }
  }
  
  return null;
};

/**
 * Create default mappings for all user categories
 * Input: Array of user categories from Firestore
 * Output: Array of suggested mappings
 */
export const createDefaultMappings = (userCategories) => {
  return userCategories.map(userCat => {
    const suggestion = suggestTaxCategory(userCat.name, userCat.type);
    
    return {
      userCategoryId: userCat.id,
      userCategoryName: userCat.name,
      userCategoryType: userCat.type,
      taxCategoryId: suggestion.taxCategoryId,
      taxSection: suggestion.section,
      confidence: suggestion.confidence,
      reason: suggestion.reason,
      needsReview: suggestion.needsReview || false,
      warningMessage: suggestion.warningMessage || null,
      isDefault: userCat.isDefault || false
    };
  });
};

/**
 * Validate mapping
 * Checks if the mapping makes sense
 */
export const validateMapping = (userCategoryType, taxCategoryId) => {
  const taxCat = getTaxCategoryById(taxCategoryId);
  
  if (!taxCat) {
    return {
      valid: false,
      error: 'Invalid tax category'
    };
  }
  
  // Check type compatibility
  if (userCategoryType === 'Income') {
    const section = getSectionForTaxCategory(taxCategoryId);
    if (section !== 'income') {
      return {
        valid: false,
        error: 'Income categories can only map to income tax categories'
      };
    }
  } else if (userCategoryType === 'Expense') {
    const section = getSectionForTaxCategory(taxCategoryId);
    if (section === 'income') {
      return {
        valid: false,
        error: 'Expense categories cannot map to income tax categories'
      };
    }
  }
  
  return { valid: true };
};

/**
 * Get mapping confidence level description
 */
export const getConfidenceDescription = (confidence) => {
  switch (confidence) {
    case 'very_high':
      return 'Exact match';
    case 'high':
      return 'Strong match';
    case 'medium':
      return 'Possible match - please review';
    case 'low':
      return 'Default assignment - please review';
    default:
      return 'Unknown';
  }
};

/**
 * Get color for confidence level
 */
export const getConfidenceColor = (confidence) => {
  switch (confidence) {
    case 'very_high':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'high':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'medium':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

/**
 * Bulk update mappings
 * Allows updating multiple mappings at once
 */
export const bulkUpdateMappings = (existingMappings, updates) => {
  const mappingMap = new Map(existingMappings.map(m => [m.userCategoryId, m]));
  
  updates.forEach(update => {
    if (mappingMap.has(update.userCategoryId)) {
      mappingMap.set(update.userCategoryId, {
        ...mappingMap.get(update.userCategoryId),
        ...update,
        confidence: 'very_high', // User manually set it
        reason: 'User customized',
        needsReview: false
      });
    }
  });
  
  return Array.from(mappingMap.values());
};

/**
 * Detect unmapped categories
 * Find user categories that don't have tax mappings
 */
export const detectUnmappedCategories = (userCategories, existingMappings) => {
  const mappedCategoryIds = new Set(existingMappings.map(m => m.userCategoryId));
  
  return userCategories.filter(cat => !mappedCategoryIds.has(cat.id));
};

/**
 * Get mapping statistics
 */
export const getMappingStats = (mappings) => {
  const total = mappings.length;
  const needsReview = mappings.filter(m => m.needsReview).length;
  const highConfidence = mappings.filter(m => 
    m.confidence === 'high' || m.confidence === 'very_high'
  ).length;
  const lowConfidence = mappings.filter(m => 
    m.confidence === 'low' || m.confidence === 'medium'
  ).length;
  
  return {
    total,
    needsReview,
    highConfidence,
    lowConfidence,
    completionRate: total > 0 ? Math.round((highConfidence / total) * 100) : 0
  };
};