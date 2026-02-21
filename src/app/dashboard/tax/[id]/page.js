// src/app/dashboard/tax/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  getTaxYear as getTaxYearDoc,
  updateTaxYear,
  deleteTaxYear,
  getTaxMappings,
  getTaxAssets,
  getTaxLiabilities,
  deleteTaxAsset,
  deleteTaxLiability
} from '@/lib/taxCollections';
import { getAccounts } from '@/lib/firestoreCollections';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTaxCategoryById, getSectionForTaxCategory } from '@/lib/taxCategories';
import {
  generateIT10BB,
  generateIT10BB2,
  downloadAsPDF,
  generateExcelData,
  downloadAsExcel
} from '@/lib/taxExporter';
import {
  ArrowLeft,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Download,
  Calendar,
  AlertCircle,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Plus,
  FileSpreadsheet,
  Building,
  CreditCard,
  Settings
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import AssetLiabilityModal from '@/components/AssetLiabilityModal';
import TaxProfileModal, { getTaxProfile } from '@/components/TaxProfileModal';
import { showToast } from '@/components/Toast';

export default function TaxYearDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taxYearDocId = params?.id;

  const [taxYear, setTaxYear] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [taxProfile, setTaxProfile] = useState({ taxpayerName: '', tin: '' });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editingLiability, setEditingLiability] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  useEffect(() => {
    if (user && taxYearDocId) {
      loadData();
    }
  }, [user, taxYearDocId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadTaxYear(),
      loadMappings(),
      loadTransactions(),
      loadCategories(),
      loadAccounts(),
      loadAssets(),
      loadLiabilities(),
      loadProfile()
    ]);
    setLoading(false);
  };

  const loadTaxYear = async () => {
    const result = await getTaxYearDoc(user.uid, taxYearDocId);
    if (result.success) {
      setTaxYear(result.taxYear);
    } else {
      showToast('Tax year not found', 'error');
      router.push('/dashboard/tax');
    }
  };

  const loadMappings = async () => {
    const result = await getTaxMappings(user.uid);
    if (result.success) {
      setMappings(result.mappings);
    }
  };

  const loadTransactions = async () => {
    try {
      const ref = collection(db, 'users', user.uid, 'transactions');
      const snap = await getDocs(ref);
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const ref = collection(db, 'users', user.uid, 'categories');
      const snap = await getDocs(ref);
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
    }
  };

  const loadAssets = async () => {
    const result = await getTaxAssets(user.uid, taxYearDocId);
    if (result.success) {
      setAssets(result.assets);
    }
  };

  const loadLiabilities = async () => {
    const result = await getTaxLiabilities(user.uid, taxYearDocId);
    if (result.success) {
      setLiabilities(result.liabilities);
    }
  };

  const loadProfile = async () => {
    const result = await getTaxProfile(user.uid);
    if (result.success && result.profile) {
      setTaxProfile(result.profile);
    }
  };

  const analyzeTransactions = () => {
    if (!taxYear) return { 
      income: {}, 
      expenses: {}, 
      personal: {},
      taxPaid: {},
      investments: {},
      loanRepayment: {},
      totalIncome: 0, 
      totalExpenses: 0 
    };

    console.log('=== ANALYZING TRANSACTIONS ===');
    console.log('Fiscal Year:', taxYear.fiscalYearStart, 'to', taxYear.fiscalYearEnd);
    console.log('Total transactions loaded:', transactions.length);
    console.log('Total mappings:', mappings.length);

    // First, filter for REAL taxable transactions only
    const taxableTransactions = transactions.filter(t => {
      // 1. EXCLUDE transfers (not real income/expense)
      if (t.isTransfer || t.collectionType === 'transfers') {
        console.log('❌ EXCLUDED (Transfer):', t.description || 'Transfer');
        return false;
      }

      // 2. EXCLUDE goal transactions (internal money movement)
      if (t.source === 'goal_deposit' || 
          t.source === 'goal_withdrawal' || 
          t.goalId) {
        console.log('❌ EXCLUDED (Goal transaction):', t.description || 'Goal movement');
        return false;
      }

      // 3. EXCLUDE lending transactions (asset, not expense/income)
      if (t.source === 'lending_given' || 
          t.source === 'lending_payment_received' || 
          t.lendingId) {
        console.log('❌ EXCLUDED (Lending transaction):', t.description || 'Lending');
        return false;
      }

      // 4. EXCLUDE loan taken (liability, not taxable income)
      if (t.source === 'loan_taken' || t.loanId) {
        // But allow loan interest payments through
        if (t.source === 'loan_payment' && t.isInterest) {
          console.log('✓ INCLUDED (Loan interest payment):', t.description);
          return true;
        }
        console.log('❌ EXCLUDED (Loan transaction):', t.description || 'Loan');
        return false;
      }

      // 5. EXCLUDE loan principal repayment (not expense, just reducing liability)
      if (t.source === 'loan_payment' && !t.isInterest) {
        console.log('❌ EXCLUDED (Loan principal):', t.description || 'Principal payment');
        return false;
      }

      return true;
    });

    console.log('After excluding transfers/goals/lending/loans:', taxableTransactions.length);

    // Filter transactions within fiscal year
    const fiscalTransactions = taxableTransactions.filter(t => {
      const inRange = t.date >= taxYear.fiscalYearStart && t.date <= taxYear.fiscalYearEnd;
      if (!inRange) {
        console.log('❌ EXCLUDED (Out of fiscal year):', t.date, t.description || t.categoryId);
      }
      return inRange;
    });

    console.log('Transactions in fiscal year:', fiscalTransactions.length);

    const incomeByTaxCategory = {};
    const expensesByTaxCategory = {};
    const personal = {};
    const taxPaid = {};
    const investments = {};
    const loanRepayment = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    fiscalTransactions.forEach(transaction => {
      const mapping = mappings.find(m => m.userCategoryId === transaction.categoryId);
      
      if (!mapping) {
        console.log('⚠️ NO MAPPING for category:', transaction.categoryId, '- Transaction will be skipped');
        return;
      }

      console.log('✓ Processing:', transaction.type, transaction.amount, 'Category:', mapping.userCategoryName, '→ Tax:', mapping.taxCategoryId);

      const taxCategoryId = mapping.taxCategoryId;
      const amount = transaction.amount;
      const section = getSectionForTaxCategory(taxCategoryId);

      if (transaction.type === 'income' || transaction.type === 'Income') {
        incomeByTaxCategory[taxCategoryId] = (incomeByTaxCategory[taxCategoryId] || 0) + amount;
        totalIncome += amount;
      } else if (transaction.type === 'expense' || transaction.type === 'Expense') {
        expensesByTaxCategory[taxCategoryId] = (expensesByTaxCategory[taxCategoryId] || 0) + amount;
        totalExpenses += amount;

        // Also categorize by section for IT-10BB
        if (section === 'personal_expenses') {
          personal[taxCategoryId] = (personal[taxCategoryId] || 0) + amount;
        } else if (section === 'tax_paid') {
          taxPaid[taxCategoryId] = (taxPaid[taxCategoryId] || 0) + amount;
        } else if (section === 'investments') {
          investments[taxCategoryId] = (investments[taxCategoryId] || 0) + amount;
        } else if (section === 'loan_repayment') {
          loanRepayment[taxCategoryId] = (loanRepayment[taxCategoryId] || 0) + amount;
        }
      }
    });

    console.log('=== ANALYSIS COMPLETE ===');
    console.log('Total Income:', totalIncome);
    console.log('Total Expenses:', totalExpenses);
    console.log('Income categories:', Object.keys(incomeByTaxCategory).length);
    console.log('Expense categories:', Object.keys(expensesByTaxCategory).length);

    return { 
      income: incomeByTaxCategory, 
      expenses: expensesByTaxCategory,
      personal,
      taxPaid,
      investments,
      loanRepayment,
      totalIncome, 
      totalExpenses 
    };
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    
    const analysis = analyzeTransactions();
    
    // Calculate asset & liability totals
    const totalManualAssets = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    const totalAccounts = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalAssets = totalManualAssets + totalAccounts;
    const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.principal || 0), 0);
    const netWorth = totalAssets - totalLiabilities;
    
    // Update tax year with totals
    await updateTaxYear(user.uid, taxYearDocId, {
      totalIncome: analysis.totalIncome,
      totalExpenses: analysis.totalExpenses,
      totalAssets: totalAssets,
      totalLiabilities: totalLiabilities,
      netWorth: netWorth
    });

    await loadTaxYear();
    showToast('Analysis complete!', 'success');
    setAnalyzing(false);
  };

  const handleGenerateIT10BB = () => {
    setExporting(true);
    
    const analysis = analyzeTransactions();
    const expenseAnalysis = {
      personal: analysis.personal,
      taxPaid: analysis.taxPaid,
      investments: analysis.investments,
      loanRepayment: analysis.loanRepayment,
      totalExpenses: analysis.totalExpenses
    };

    const html = generateIT10BB(taxYear, expenseAnalysis, taxProfile);
    downloadAsPDF(html, `IT-10BB_${taxYear.incomeYear}.html`);
    
    showToast('IT-10BB generated! Print dialog will open.', 'success');
    setExporting(false);
  };

  const handleGenerateIT10BB2 = () => {
    setExporting(true);
    
    const html = generateIT10BB2(taxYear, assets, liabilities, accounts, taxProfile);
    downloadAsPDF(html, `IT-10BB2_${taxYear.incomeYear}.html`);
    
    showToast('IT-10BB2 generated! Print dialog will open.', 'success');
    setExporting(false);
  };

  const handleExportExcel = () => {
    setExporting(true);
    
    const analysis = analyzeTransactions();
    const expenseAnalysis = {
      personal: analysis.personal,
      taxPaid: analysis.taxPaid,
      investments: analysis.investments,
      loanRepayment: analysis.loanRepayment,
      totalExpenses: analysis.totalExpenses
    };

    const incomeAnalysis = {
      income: analysis.income,
      totalIncome: analysis.totalIncome
    };

    const csvData = generateExcelData(taxYear, incomeAnalysis, expenseAnalysis, assets, liabilities, accounts);
    downloadAsExcel(csvData, `Tax_Report_${taxYear.incomeYear}.csv`);
    
    showToast('Excel file downloaded!', 'success');
    setExporting(false);
  };

  const handleDeleteAsset = (asset) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Asset?',
      message: `Are you sure you want to delete "${asset.description}"?`,
      type: 'danger',
      onConfirm: async () => {
        const result = await deleteTaxAsset(user.uid, asset.id);
        if (result.success) {
          showToast('Asset deleted', 'success');
          await loadAssets();
        } else {
          showToast('Failed to delete', 'error');
        }
      }
    });
  };

  const handleDeleteLiability = (liability) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Liability?',
      message: `Are you sure you want to delete "${liability.description}"?`,
      type: 'danger',
      onConfirm: async () => {
        const result = await deleteTaxLiability(user.uid, liability.id);
        if (result.success) {
          showToast('Liability deleted', 'success');
          await loadLiabilities();
        } else {
          showToast('Failed to delete', 'error');
        }
      }
    });
  };

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Tax Year?',
      message: `Are you sure you want to delete Income Year ${taxYear?.incomeYear}? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        const result = await deleteTaxYear(user.uid, taxYearDocId);
        if (result.success) {
          showToast('Tax year deleted', 'success');
          router.push('/dashboard/tax');
        } else {
          showToast('Failed to delete', 'error');
        }
      }
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'filed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
            <CheckCircle className="w-4 h-4" />
            Filed
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
            <Clock className="w-4 h-4" />
            In Review
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
            <FileText className="w-4 h-4" />
            Draft
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!taxYear) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Tax year not found</p>
      </div>
    );
  }

  const analysis = analyzeTransactions();

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/tax')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tax Preparation
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          {/* Title and Status */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Income Year {taxYear.incomeYear}
                </h1>
                {getStatusBadge(taxYear.status)}
              </div>
              <p className="text-sm text-gray-600">
                Tax Year {taxYear.taxYear} • {formatDate(taxYear.fiscalYearStart)} - {formatDate(taxYear.fiscalYearEnd)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Filing Deadline: {formatDate(taxYear.filingDeadline)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                title="Edit Tax Profile"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </button>

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
              
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Income</p>
              <p className="text-lg sm:text-xl font-bold text-green-600">
                ৳{(analysis.totalIncome || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
              <p className="text-lg sm:text-xl font-bold text-red-600">
                ৳{(analysis.totalExpenses || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Savings</p>
              <p className="text-lg sm:text-xl font-bold text-blue-600">
                ৳{(analysis.totalIncome - analysis.totalExpenses).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Savings Rate</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {analysis.totalIncome > 0 
                  ? Math.round(((analysis.totalIncome - analysis.totalExpenses) / analysis.totalIncome) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      {mappings.length === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-900 mb-1">
                No Category Mappings Found
              </p>
              <p className="text-sm text-yellow-700 mb-3">
                Please complete the tax category mapping setup to analyze your transactions.
              </p>
              <button
                onClick={() => router.push('/dashboard/tax/setup')}
                className="text-sm font-medium text-yellow-900 underline hover:no-underline"
              >
                Go to Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Income & Expense Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income Analysis */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Income Analysis</h2>
          </div>

          {Object.keys(analysis.income).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No income transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(analysis.income).map(([taxCategoryId, amount]) => {
                const taxCat = getTaxCategoryById(taxCategoryId);
                const percentage = analysis.totalIncome > 0 
                  ? ((amount / analysis.totalIncome) * 100).toFixed(1)
                  : 0;

                return (
                  <div key={taxCategoryId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {taxCat?.name || taxCategoryId}
                      </p>
                      <p className="text-xs text-gray-500">{taxCat?.nbrCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        ৳{amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{percentage}%</p>
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Total Income</p>
                <p className="text-lg font-bold text-green-600">
                  ৳{analysis.totalIncome.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Expense Analysis */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Expense Analysis</h2>
          </div>

          {Object.keys(analysis.expenses).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No expense transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(analysis.expenses)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([taxCategoryId, amount]) => {
                  const taxCat = getTaxCategoryById(taxCategoryId);
                  const percentage = analysis.totalExpenses > 0 
                    ? ((amount / analysis.totalExpenses) * 100).toFixed(1)
                    : 0;

                  return (
                    <div key={taxCategoryId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {taxCat?.name || taxCategoryId}
                        </p>
                        <p className="text-xs text-gray-500">{taxCat?.nbrCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">
                          ৳{amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}

              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Total Expenses</p>
                <p className="text-lg font-bold text-red-600">
                  ৳{analysis.totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assets & Liabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Assets */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Assets</h2>
            </div>
            <button
              onClick={() => {
                setEditingAsset(null);
                setShowAssetModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {assets.map((asset) => {
              const cat = getTaxCategoryById(asset.assetType);
              return (
                <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{asset.description}</p>
                    <p className="text-xs text-gray-500">{cat?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      ৳{(asset.currentValue || 0).toLocaleString()}
                    </p>
                    <button
                      onClick={() => {
                        setEditingAsset(asset);
                        setShowAssetModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAsset(asset)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {assets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No assets added</p>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Total Assets</p>
              <p className="text-lg font-bold text-blue-600">
                ৳{(taxYear.totalAssets || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Liabilities</h2>
            </div>
            <button
              onClick={() => {
                setEditingLiability(null);
                setShowLiabilityModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {liabilities.map((liability) => {
              const cat = getTaxCategoryById(liability.liabilityType);
              return (
                <div key={liability.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{liability.description}</p>
                    <p className="text-xs text-gray-500">{cat?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      ৳{(liability.principal || 0).toLocaleString()}
                    </p>
                    <button
                      onClick={() => {
                        setEditingLiability(liability);
                        setShowLiabilityModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLiability(liability)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {liabilities.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No liabilities added</p>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Total Liabilities</p>
              <p className="text-lg font-bold text-orange-600">
                ৳{(taxYear.totalLiabilities || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={handleGenerateIT10BB}
          disabled={exporting}
          className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left disabled:opacity-50"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Generate IT-10BB</p>
            <p className="text-xs text-gray-500">Expenditure statement (PDF)</p>
          </div>
        </button>

        <button
          onClick={handleGenerateIT10BB2}
          disabled={exporting}
          className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all text-left disabled:opacity-50"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Generate IT-10BB2</p>
            <p className="text-xs text-gray-500">Assets & liabilities (PDF)</p>
          </div>
        </button>

        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all text-left disabled:opacity-50"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Download Excel</p>
            <p className="text-xs text-gray-500">Complete tax report (CSV)</p>
          </div>
        </button>
      </div>

      {/* Modals */}
      <TaxProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSuccess={loadProfile}
        userId={user.uid}
      />

      <AssetLiabilityModal
        isOpen={showAssetModal}
        onClose={() => {
          setShowAssetModal(false);
          setEditingAsset(null);
        }}
        onSuccess={async () => {
          await loadAssets();
          await handleAnalyze();
        }}
        type="asset"
        editingItem={editingAsset}
        taxYearDocId={taxYearDocId}
        userId={user.uid}
      />

      <AssetLiabilityModal
        isOpen={showLiabilityModal}
        onClose={() => {
          setShowLiabilityModal(false);
          setEditingLiability(null);
        }}
        onSuccess={async () => {
          await loadLiabilities();
          await handleAnalyze();
        }}
        type="liability"
        editingItem={editingLiability}
        taxYearDocId={taxYearDocId}
        userId={user.uid}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
}