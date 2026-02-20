// src/app/dashboard/tax/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getTaxYears,
  createTaxYear,
  getTaxMappings
} from '@/lib/taxCollections';
import {
  getCurrentIncomeYear,
  getDaysUntilDeadline,
  getFiscalYearDates,
  getTaxYear as getTaxYearFromIncome
} from '@/lib/taxCategories';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  FileText,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Wallet,
  Settings,
  FileSpreadsheet,
  Download,
  Eye,
  ChevronRight
} from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function TaxPreparationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [taxYears, setTaxYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [hasMappings, setHasMappings] = useState(false);
  const [userCategories, setUserCategories] = useState([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadTaxYears(),
      checkMappings(),
      loadCategories()
    ]);
    setLoading(false);
  };

  const loadTaxYears = async () => {
    const result = await getTaxYears(user.uid);
    if (result.success) {
      setTaxYears(result.taxYears);
    }
  };

  const checkMappings = async () => {
    const result = await getTaxMappings(user.uid);
    if (result.success) {
      setHasMappings(result.mappings.length > 0);
    }
  };

  const loadCategories = async () => {
    try {
      const ref = collection(db, 'users', user.uid, 'categories');
      const snap = await getDocs(ref);
      setUserCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCreateCurrentYear = async () => {
    if (creating) return;
    
    setCreating(true);
    const result = await createTaxYear(user.uid);
    
    if (result.success) {
      showToast(
        result.isNew ? 'Tax year created!' : 'Tax year already exists',
        'success'
      );
      await loadTaxYears();
      
      // If new and no mappings, show setup wizard
      if (result.isNew && !hasMappings) {
        router.push('/dashboard/tax/setup');
      } else {
        router.push(`/dashboard/tax/${result.taxYear.id}`);
      }
    } else {
      showToast('Failed to create tax year', 'error');
    }
    
    setCreating(false);
  };

  const handleSetupMappings = () => {
    router.push('/dashboard/tax/setup');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'filed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            Filed
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            <Clock className="w-3 h-3" />
            In Review
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
            <FileText className="w-3 h-3" />
            Draft
          </span>
        );
    }
  };

  const getDeadlineStatus = (deadline) => {
    const days = getDaysUntilDeadline(deadline);
    
    if (days < 0) {
      return { text: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (days === 0) {
      return { text: 'Due Today!', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (days <= 30) {
      return { text: `${days} days left`, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else {
      return { text: `${days} days left`, color: 'text-green-600', bgColor: 'bg-green-50' };
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const currentIncomeYear = getCurrentIncomeYear();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tax Preparation</h1>
            <p className="text-sm text-gray-500 mt-1">
              Prepare your NBR tax filing documents (IT-10BB & IT-10BB2)
            </p>
          </div>
          
          {hasMappings && (
            <button
              onClick={handleSetupMappings}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Category Mappings</span>
            </button>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium mb-1">
                Bangladesh Tax Year Information
              </p>
              <p className="text-xs text-blue-700">
                • Income Year: July 1 to June 30 (e.g., 2024-25)
                <br />
                • Tax Year: Following year (e.g., 2025)
                <br />
                • Filing Deadline: November 30 of tax year
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Warning (if no mappings) */}
      {!hasMappings && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">
                Setup Required
              </p>
              <p className="text-sm text-yellow-700 mb-3">
                Before creating tax files, you need to map your expense/income categories to NBR tax categories.
                This is a one-time setup that takes about 2 minutes.
              </p>
              <button
                onClick={handleSetupMappings}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                Start Setup Wizard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Year Quick Action */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5" />
                <h2 className="text-lg font-bold">Current Income Year: {currentIncomeYear}</h2>
              </div>
              <p className="text-sm text-gray-300">
                {(() => {
                  const { start, end } = getFiscalYearDates(currentIncomeYear);
                  return `${formatDate(start)} - ${formatDate(end)}`;
                })()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tax Year: {getTaxYearFromIncome(currentIncomeYear)} • Deadline: November 30
              </p>
            </div>
            
            <button
              onClick={handleCreateCurrentYear}
              disabled={creating || !hasMappings}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {taxYears.some(ty => ty.incomeYear === currentIncomeYear) 
                    ? 'View Current Year' 
                    : 'Create Tax File'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tax Years List */}
      {taxYears.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Your Tax Years ({taxYears.length})
          </h3>
          
          {taxYears.map((taxYear) => (
            <TaxYearCard
              key={taxYear.id}
              taxYear={taxYear}
              getStatusBadge={getStatusBadge}
              getDeadlineStatus={getDeadlineStatus}
              formatDate={formatDate}
              onClick={() => router.push(`/dashboard/tax/${taxYear.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Tax Files Yet
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            {!hasMappings 
              ? 'Complete the setup wizard to start preparing your tax files.'
              : 'Create your first tax file to start tracking income and expenses for NBR filing.'}
          </p>
          {hasMappings && (
            <button
              onClick={handleCreateCurrentYear}
              disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Tax File for {currentIncomeYear}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Tax Year Card Component
function TaxYearCard({ taxYear, getStatusBadge, getDeadlineStatus, formatDate, onClick }) {
  const deadlineInfo = getDeadlineStatus(taxYear.filingDeadline);
  
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900">
                  Income Year {taxYear.incomeYear}
                </h3>
                {getStatusBadge(taxYear.status)}
              </div>
              <p className="text-xs text-gray-500">
                Tax Year {taxYear.taxYear} • {formatDate(taxYear.fiscalYearStart)} - {formatDate(taxYear.fiscalYearEnd)}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500">Income</p>
              <p className="text-sm font-semibold text-green-600">
                ৳{(taxYear.totalIncome || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Expenses</p>
              <p className="text-sm font-semibold text-red-600">
                ৳{(taxYear.totalExpenses || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Assets</p>
              <p className="text-sm font-semibold text-gray-900">
                ৳{(taxYear.totalAssets || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Net Worth</p>
              <p className="text-sm font-semibold text-blue-600">
                ৳{(taxYear.netWorth || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Deadline */}
          {taxYear.status !== 'filed' && (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${deadlineInfo.bgColor}`}>
              <Clock className={`w-3 h-3 ${deadlineInfo.color}`} />
              <span className={deadlineInfo.color}>
                Filing: {deadlineInfo.text}
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
      </div>
    </div>
  );
}