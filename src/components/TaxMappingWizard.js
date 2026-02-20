// src/components/TaxMappingWizard.js
'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  ALL_EXPENSE_TAX_CATEGORIES,
  INCOME_TAX_CATEGORIES,
  PERSONAL_EXPENSES,
  TAX_PAID,
  INVESTMENTS,
  LOAN_REPAYMENT
} from '@/lib/taxCategories';
import {
  createDefaultMappings,
  getConfidenceDescription,
  getConfidenceColor,
  validateMapping
} from '@/lib/taxCategoryMapper';
import { saveTaxMappings } from '@/lib/taxCollections';
import { showToast } from '@/components/Toast';

export default function TaxMappingWizard({
  isOpen,
  onClose,
  onComplete,
  userCategories = [],
  userId
}) {
  const [step, setStep] = useState(1); // 1=intro, 2=expense, 3=income, 4=review
  const [mappings, setMappings] = useState([]);
  const [saving, setSaving] = useState(false);

  // Separate categories by type
  const expenseCategories = userCategories.filter(c => c.type === 'Expense');
  const incomeCategories = userCategories.filter(c => c.type === 'Income');

  useEffect(() => {
    if (userCategories.length > 0) {
      // Generate default mappings
      const defaultMappings = createDefaultMappings(userCategories);
      setMappings(defaultMappings);
    }
  }, [userCategories]);

  const handleMappingChange = (userCategoryId, newTaxCategoryId) => {
    setMappings(prev => prev.map(m => {
      if (m.userCategoryId === userCategoryId) {
        const userCat = userCategories.find(c => c.id === userCategoryId);
        const validation = validateMapping(userCat.type, newTaxCategoryId);
        
        if (!validation.valid) {
          showToast(validation.error, 'error');
          return m;
        }

        return {
          ...m,
          taxCategoryId: newTaxCategoryId,
          confidence: 'very_high',
          reason: 'User customized',
          needsReview: false
        };
      }
      return m;
    }));
  };

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    const result = await saveTaxMappings(userId, mappings);

    if (result.success) {
      showToast('Tax category mappings saved!', 'success');
      onComplete();
      onClose();
    } else {
      showToast('Failed to save mappings', 'error');
    }

    setSaving(false);
  };

  const getMappingsForType = (type) => {
    return mappings.filter(m => m.userCategoryType === type);
  };

  const needsReviewCount = mappings.filter(m => m.needsReview).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-gray-900 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg sm:text-xl font-bold">Tax Category Mapping</h2>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-300">
            Map your categories to NBR tax categories for accurate filing
          </p>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    s < step
                      ? 'bg-green-500 text-white'
                      : s === step
                      ? 'bg-white text-gray-900'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-8 sm:w-12 h-0.5 ${
                      s < step ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 1 && <IntroStep />}
          {step === 2 && (
            <MappingStep
              title="Expense Categories"
              categories={expenseCategories}
              mappings={getMappingsForType('Expense')}
              taxCategories={ALL_EXPENSE_TAX_CATEGORIES}
              taxSections={[
                { title: 'Personal & Family', categories: PERSONAL_EXPENSES },
                { title: 'Tax Paid', categories: TAX_PAID },
                { title: 'Investments', categories: INVESTMENTS },
                { title: 'Loan Repayment', categories: LOAN_REPAYMENT }
              ]}
              onMappingChange={handleMappingChange}
            />
          )}
          {step === 3 && (
            <MappingStep
              title="Income Categories"
              categories={incomeCategories}
              mappings={getMappingsForType('Income')}
              taxCategories={INCOME_TAX_CATEGORIES}
              onMappingChange={handleMappingChange}
            />
          )}
          {step === 4 && (
            <ReviewStep
              mappings={mappings}
              userCategories={userCategories}
              needsReviewCount={needsReviewCount}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 flex items-center justify-between gap-3 bg-gray-50">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="text-xs text-gray-500">
            Step {step} of 4
          </div>

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save & Complete
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Intro Step
function IntroStep() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to Tax Preparation Setup</h3>
        <p className="text-sm text-gray-600">
          This quick setup will map your transaction categories to NBR tax categories
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">What is this?</h4>
        <p className="text-sm text-blue-700 mb-3">
          To prepare your IT-10BB (Expenditure Statement) and IT-10BB2 (Assets & Liabilities), 
          we need to categorize your transactions according to NBR (National Board of Revenue) standards.
        </p>
        <p className="text-sm text-blue-700">
          We've automatically suggested mappings based on your category names, but you can customize them.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 font-bold">1</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Map Expense Categories</p>
            <p className="text-xs text-gray-500">
              Link your expense categories to NBR tax categories (Food, Rent, Transport, etc.)
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 font-bold">2</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Map Income Categories</p>
            <p className="text-xs text-gray-500">
              Link your income categories to tax income types (Salary, Business, etc.)
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 font-bold">3</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Review & Save</p>
            <p className="text-xs text-gray-500">
              Check all mappings and save your configuration
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> This is a one-time setup. You can always modify these mappings later from Settings.
        </p>
      </div>
    </div>
  );
}

// Mapping Step
function MappingStep({ title, categories, mappings, taxCategories, taxSections, onMappingChange }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No {title.toLowerCase()} found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const mapping = mappings.find(m => m.userCategoryId === category.id);
            if (!mapping) return null;

            return (
              <CategoryMappingRow
                key={category.id}
                category={category}
                mapping={mapping}
                taxCategories={taxCategories}
                taxSections={taxSections}
                onChange={(newTaxCategoryId) => onMappingChange(category.id, newTaxCategoryId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// Category Mapping Row
function CategoryMappingRow({ category, mapping, taxCategories, taxSections, onChange }) {
  const confidenceColorClass = getConfidenceColor(mapping.confidence);
  const currentTaxCat = taxCategories.find(tc => tc.id === mapping.taxCategoryId);

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* User Category */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            ></span>
            <p className="text-sm font-semibold text-gray-900">{category.name}</p>
          </div>
          <p className="text-xs text-gray-500">Your category</p>
        </div>

        {/* Arrow */}
        <ArrowRight className="hidden sm:block w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="sm:hidden w-full h-px bg-gray-200"></div>

        {/* Tax Category Selector */}
        <div className="flex-1">
          <select
            value={mapping.taxCategoryId}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            {taxSections ? (
              // Grouped options
              taxSections.map((section) => (
                <optgroup key={section.title} label={section.title}>
                  {section.categories.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.name} ({tc.nbrCode})
                    </option>
                  ))}
                </optgroup>
              ))
            ) : (
              // Flat options
              taxCategories.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.nbrCode})
                </option>
              ))
            )}
          </select>
          
          {currentTaxCat && (
            <p className="text-xs text-gray-500 mt-1">{currentTaxCat.description}</p>
          )}
        </div>
      </div>

      {/* Confidence Badge */}
      <div className="mt-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${confidenceColorClass}`}>
          {mapping.confidence === 'very_high' || mapping.confidence === 'high' ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          {getConfidenceDescription(mapping.confidence)}
        </span>
        {mapping.warningMessage && (
          <p className="text-xs text-yellow-700 mt-2">{mapping.warningMessage}</p>
        )}
      </div>
    </div>
  );
}

// Review Step
function ReviewStep({ mappings, userCategories, needsReviewCount }) {
  const expenseMappings = mappings.filter(m => m.userCategoryType === 'Expense');
  const incomeMappings = mappings.filter(m => m.userCategoryType === 'Income');

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Review Your Mappings</h3>
      <p className="text-sm text-gray-600 mb-6">
        Please review your category mappings before saving
      </p>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600">Total Categories</p>
          <p className="text-2xl font-bold text-blue-900">{mappings.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600">Expense</p>
          <p className="text-2xl font-bold text-green-900">{expenseMappings.length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600">Income</p>
          <p className="text-2xl font-bold text-purple-900">{incomeMappings.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <p className="text-xs text-yellow-600">Needs Review</p>
          <p className="text-2xl font-bold text-yellow-900">{needsReviewCount}</p>
        </div>
      </div>

      {needsReviewCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium mb-1">{needsReviewCount} mapping(s) need review</p>
              <p>These are low-confidence suggestions. You can go back and adjust them if needed.</p>
            </div>
          </div>
        </div>
      )}

      {/* Expense Mappings */}
      {expenseMappings.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Expense Categories</h4>
          <div className="space-y-2">
            {expenseMappings.map((mapping) => (
              <MappingReviewRow key={mapping.userCategoryId} mapping={mapping} userCategories={userCategories} />
            ))}
          </div>
        </div>
      )}

      {/* Income Mappings */}
      {incomeMappings.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Income Categories</h4>
          <div className="space-y-2">
            {incomeMappings.map((mapping) => (
              <MappingReviewRow key={mapping.userCategoryId} mapping={mapping} userCategories={userCategories} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mapping Review Row
function MappingReviewRow({ mapping, userCategories }) {
  const userCat = userCategories.find(c => c.id === mapping.userCategoryId);
  const confidenceColorClass = getConfidenceColor(mapping.confidence);

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        {userCat && (
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: userCat.color }}
          ></span>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{mapping.userCategoryName}</p>
          <p className="text-xs text-gray-500">{mapping.taxCategoryId.replace(/_/g, ' ')}</p>
        </div>
      </div>
      <span className={`px-2 py-0.5 rounded text-xs border ${confidenceColorClass}`}>
        {mapping.confidence === 'very_high' || mapping.confidence === 'high' ? (
          <CheckCircle className="w-3 h-3 inline" />
        ) : (
          <AlertCircle className="w-3 h-3 inline" />
        )}
      </span>
    </div>
  );
}