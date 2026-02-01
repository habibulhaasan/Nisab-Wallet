// src/app/dashboard/loans/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAccounts } from '@/lib/firestoreCollections';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingDown,
  Edit2,
  Trash2,
  Download,
  HandCoins,
  Building2,
  Percent,
  Clock,
  CheckCircle2,
  ArrowDownCircle,
} from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function LoanDetailsPage({ params }) {
  const { user } = useAuth();
  const router = useRouter();

  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !params?.id) {
      console.warn('Missing user or loan ID', { hasUser: !!user, id: params?.id });
      return;
    }

    const loadLoanDetails = async () => {
      console.log(`Loading loan details for ID: ${params.id}`);
      setLoading(true);

      try {
        // 1. Fetch the loan document
        const loanRef = doc(db, 'users', user.uid, 'loans', params.id);
        const loanSnap = await getDoc(loanRef);

        if (!loanSnap.exists()) {
          console.error('Loan document does not exist:', params.id);
          showToast('Loan not found', 'error');
          router.replace('/dashboard/loans');
          return;
        }

        const rawData = loanSnap.data();
        console.log('Raw loan data from Firestore:', rawData);

        // Safe defaults + Timestamp → Date conversion
        const safeLoan = {
          id: loanSnap.id,
          ...rawData,
          // Fallbacks for critical numeric fields
          principalAmount: rawData.principalAmount ?? 0,
          totalPaid: rawData.totalPaid ?? 0,
          remainingBalance: rawData.remainingBalance ?? (rawData.principalAmount ?? 0) - (rawData.totalPaid ?? 0),
          totalInterest: rawData.totalInterest ?? 0,
          totalRepayment: rawData.totalRepayment ?? (rawData.principalAmount ?? 0),
          monthlyPayment: rawData.monthlyPayment ?? null,
          interestRate: rawData.interestRate ?? 0,
          // Convert Firestore Timestamps to JS Dates where needed
          startDate: rawData.startDate?.toDate ? rawData.startDate.toDate() : rawData.startDate,
          endDate: rawData.endDate?.toDate ? rawData.endDate.toDate() : rawData.endDate,
          nextPaymentDue: rawData.nextPaymentDue?.toDate ? rawData.nextPaymentDue.toDate() : rawData.nextPaymentDue,
          lastPaymentDate: rawData.lastPaymentDate?.toDate ? rawData.lastPaymentDate.toDate() : rawData.lastPaymentDate,
          createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : rawData.createdAt,
          updatedAt: rawData.updatedAt?.toDate ? rawData.updatedAt.toDate() : rawData.updatedAt,
        };

        setLoan(safeLoan);

        // 2. Fetch payments
        const paymentsQuery = query(
          collection(db, 'users', user.uid, 'loanPayments'),
          where('loanId', '==', params.id),
          orderBy('paymentDate', 'desc')
        );
        const paymentsSnap = await getDocs(paymentsQuery);
        setPayments(
          paymentsSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              paymentDate: data.paymentDate?.toDate ? data.paymentDate.toDate() : data.paymentDate,
            };
          })
        );

        // 3. Fetch accounts
        const accResult = await getAccounts(user.uid);
        if (accResult.success) {
          setAccounts(accResult.accounts);
        }
      } catch (err) {
        console.error('Error loading loan details:', err);
        showToast('Failed to load loan details', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadLoanDetails();
  }, [user, params?.id, router]);

  // Robust date formatter that handles strings, Dates, and Timestamps
  const formatDate = (value) => {
    if (!value) return '—';

    let dateObj;
    if (value instanceof Date) {
      dateObj = value;
    } else if (typeof value === 'string') {
      dateObj = new Date(value);
    } else if (value?.toDate) {
      dateObj = value.toDate();
    } else {
      return 'Invalid date';
    }

    if (isNaN(dateObj.getTime())) return 'Invalid date';

    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getAccountName = (id) => {
    return accounts.find((a) => a.id === id)?.name || 'Unknown';
  };

  const isQardHasan = loan?.loanType === 'qard-hasan';
  const progress = loan ? ((loan.totalPaid / loan.principalAmount) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center py-20">
        <p className="text-xl text-gray-700">Loan not found or could not be loaded.</p>
        <button
          onClick={() => router.push('/dashboard/loans')}
          className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-lg"
        >
          Back to Loans
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Debug: show raw data (remove this block in production) */}
      <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-64 border border-gray-300">
        <strong>Raw loan data (debug):</strong>
        <pre>{JSON.stringify(loan, null, 2)}</pre>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/loans')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Loans</span>
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/dashboard/loans/edit/${loan.id}`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Edit2 size={16} />
            Edit Loan
          </button>
        </div>
      </div>

      {/* Loan Card */}
      <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
        isQardHasan ? 'border-green-500' : 'border-amber-500'
      }`}>
        <div className="flex items-start gap-5">
          <div className={`p-4 rounded-xl ${isQardHasan ? 'bg-green-50' : 'bg-amber-50'}`}>
            {isQardHasan ? (
              <HandCoins size={40} className="text-green-600" />
            ) : (
              <Building2 size={40} className="text-amber-600" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              {loan.lenderName}
            </h1>
            <p className="text-gray-600 mb-3">
              {isQardHasan
                ? 'Interest-free loan (Qard Hasan)'
                : `${loan.interestRate}% annual interest`}
            </p>
            {loan.status === 'paid-off' && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                <CheckCircle2 size={16} />
                Paid Off
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Loan Progress</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3.5">
            <div
              className={`h-3.5 rounded-full transition-all ${
                isQardHasan ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Paid: ৳{loan.totalPaid.toLocaleString()}</span>
            <span className="text-red-600">
              Remaining: ৳{loan.remainingBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={18} className="text-gray-500" />
            <p className="text-sm font-medium text-gray-600">Principal</p>
          </div>
          <p className="text-2xl font-bold">৳{loan.principalAmount.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <Percent size={18} className="text-gray-500" />
            <p className="text-sm font-medium text-gray-600">Interest Rate</p>
          </div>
          <p className="text-2xl font-bold">
            {isQardHasan ? '0%' : `${loan.interestRate}%`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {isQardHasan ? 'Qard Hasan' : 'Annual'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown size={18} className="text-gray-500" />
            <p className="text-sm font-medium text-gray-600">Total Paid</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ৳{loan.totalPaid.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={18} className="text-gray-500" />
            <p className="text-sm font-medium text-gray-600">Monthly</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {loan.monthlyPayment
              ? `৳${loan.monthlyPayment.toLocaleString()}`
              : 'Flexible'}
          </p>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-5">Loan Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Start Date</span>
            <span className="font-medium">{formatDate(loan.startDate)}</span>
          </div>

          {loan.endDate && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">End Date</span>
              <span className="font-medium">{formatDate(loan.endDate)}</span>
            </div>
          )}

          {loan.totalMonths > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{loan.totalMonths} months</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Remaining Balance</span>
            <span className="font-medium text-red-600">
              ৳{loan.remainingBalance.toLocaleString()}
            </span>
          </div>

          {!isQardHasan && (
            <>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Interest</span>
                <span className="font-medium text-amber-600">
                  ৳{loan.totalInterest.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Repayment</span>
                <span className="font-medium">
                  ৳{loan.totalRepayment.toLocaleString()}
                </span>
              </div>
            </>
          )}

          {loan.nextPaymentDue && loan.status === 'active' && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Next Payment Due</span>
              <span className="font-medium text-blue-600">
                {formatDate(loan.nextPaymentDue)}
              </span>
            </div>
          )}

          {loan.lastPaymentDate && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Last Payment</span>
              <span className="font-medium">{formatDate(loan.lastPaymentDate)}</span>
            </div>
          )}

          {loan.accountId && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Linked Account</span>
              <span className="font-medium">{getAccountName(loan.accountId)}</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Status</span>
            <span
              className={`font-medium ${
                loan.status === 'active' ? 'text-green-600' : 'text-blue-600'
              }`}
            >
              {loan.status === 'active' ? 'Active' : 'Paid Off'}
            </span>
          </div>
        </div>

        {loan.notes && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-600 mb-2">Notes</p>
            <p className="text-gray-800 whitespace-pre-line">{loan.notes}</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">
            Payment History ({payments.length})
          </h2>
          {payments.length > 0 && (
            <button
              onClick={() => {
                // You can implement CSV export here if needed
                showToast('Export coming soon', 'info');
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download size={16} />
              Export
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock size={40} className="mx-auto mb-3 opacity-40" />
            <p>No payments recorded yet for this loan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Principal</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Interest</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Account</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDate(payment.paymentDate)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ৳{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      ৳{(payment.principalPaid || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600">
                      ৳{(payment.interestPaid || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{getAccountName(payment.accountId)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {payment.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}