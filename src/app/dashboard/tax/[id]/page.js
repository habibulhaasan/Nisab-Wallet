// src/app/dashboard/tax/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  getTaxYear as getTaxYearDoc,
  updateTaxYear,
  deleteTaxYear,
  getTaxMappings
} from '@/lib/taxCollections';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTaxCategoryById } from '@/lib/taxCategories';
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
  Clock
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
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
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

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
      loadAccounts()
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
    try {
      const ref = collection(db, 'users', user.uid, 'accounts');
      const snap = await getDocs(ref);
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const analyzeTransactions = () => {
    if (!taxYear) return { income: {}, expenses: {}, totalIncome: 0, totalExpenses: 0 };

    // Filter transactions within fiscal year
    const fiscalTransactions = transactions.filter(t => 
      t.date >= taxYear.fiscalYearStart && t.date <= taxYear.fiscalYearEnd
    );

    const incomeByTaxCategory = {};
    const expensesByTaxCategory = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    fiscalTransactions.forEach(transaction => {
      // Find mapping for this transaction's category
      const mapping = mappings.find(m => m.userCategoryId === transaction.categoryId);
      
      if (mapping) {
        const taxCategoryId = mapping.taxCategoryId;
        const amount = transaction.amount;

        if (transaction.type === 'income') {
          incomeByTaxCategory[taxCategoryId] = (incomeByTaxCategory[taxCategoryId] || 0) + amount;
          totalIncome += amount;
        } else if (transaction.type === 'expense') {
          expensesByTaxCategory[taxCategoryId] = (expensesByTaxCategory[taxCategoryId] || 0) + amount;
          totalExpenses += amount;
        }
      }
    });

    return { 
      income: incomeByTaxCategory, 
      expenses: expensesByTaxCategory, 
      totalIncome, 
      totalExpenses 
    };
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    
    const analysis = analyzeTransactions();
    
    // Update tax year with totals
    await updateTaxYear(user.uid, taxYearDocId, {
      totalIncome: analysis.totalIncome,
      totalExpenses: analysis.totalExpenses,
      // Assets and liabilities would be calculated separately
    });

    await loadTaxYear();
    showToast('Analysis complete!', 'success');
    setAnalyzing(false);
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

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                .sort((a, b) => b[1] - a[1]) // Sort by amount descending
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

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <button
          onClick={() => showToast('Export feature coming soon!', 'info')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Generate IT-10BB</p>
            <p className="text-xs text-gray-500">Expenditure statement</p>
          </div>
        </button>

        <button
          onClick={() => showToast('Export feature coming soon!', 'info')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Generate IT-10BB2</p>
            <p className="text-xs text-gray-500">Assets & liabilities</p>
          </div>
        </button>
      </div>

      {/* Confirmation Dialog */}
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