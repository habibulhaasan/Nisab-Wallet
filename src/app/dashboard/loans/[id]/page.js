//src/app/dashboard/loans/[id]/page.js

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
  const [showAmortization, setShowAmortization] = useState(false);

  useEffect(() => {
    if (user && params.id) {
      loadLoanDetails();
    }
  }, [user, params.id]);

  const loadLoanDetails = async () => {
    setLoading(true);
    try {
      // Load loan
      const loanDoc = await getDoc(doc(db, 'users', user.uid, 'loans', params.id));
      if (!loanDoc.exists()) {
        showToast('Loan not found', 'error');
        router.push('/dashboard/loans');
        return;
      }
      setLoan({ id: loanDoc.id, ...loanDoc.data() });

      // Load payments
      const paymentsRef = collection(db, 'users', user.uid, 'loanPayments');
      const q = query(
        paymentsRef,
        where('loanId', '==', params.id),
        orderBy('paymentDate', 'desc')
      );
      const paymentsSnapshot = await getDocs(q);
      const paymentsData = paymentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPayments(paymentsData);

      // Load accounts
      const result = await getAccounts(user.uid);
      if (result.success) {
        setAccounts(result.accounts);
      }
    } catch (error) {
      console.error('Error loading loan details:', error);
      showToast('Failed to load loan details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateAmortizationSchedule = () => {
    if (!loan || loan.loanType === 'qard-hasan') return [];

    const schedule = [];
    let balance = loan.principalAmount;
    const monthlyRate = loan.interestRate / 12 / 100;
    const monthlyPayment = loan.monthlyPayment;
    const totalMonths = loan.totalMonths || 0;

    for (let month = 1; month <= totalMonths; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: balance > 0 ? balance : 0,
      });

      if (balance <= 0) break;
    }

    return schedule;
  };

  const calculateEarlyPayoff = (extraPayment) => {
    if (!loan || loan.loanType === 'qard-hasan') return null;

    let balance = loan.remainingBalance;
    const monthlyRate = loan.interestRate / 12 / 100;
    const regularPayment = loan.monthlyPayment;
    const totalPayment = regularPayment + extraPayment;
    let months = 0;
    let totalInterest = 0;

    while (balance > 0 && months < 1000) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = totalPayment - interestPayment;
      totalInterest += interestPayment;
      balance -= principalPayment;
      months++;

      if (balance <= 0) break;
    }

    return {
      monthsRemaining: months,
      totalInterest,
      savedInterest: loan.totalInterest - (loan.totalPaid - loan.principalAmount + loan.remainingBalance) - totalInterest,
    };
  };

  const exportToPDF = () => {
    showToast('PDF export feature coming soon!', 'info');
  };

  const exportToCSV = () => {
    if (payments.length === 0) {
      return showToast('No payment history to export', 'error');
    }

    const headers = ['Date', 'Amount', 'Principal', 'Interest', 'Account', 'Notes'];
    const rows = payments.map((p) => [
      formatDate(p.paymentDate),
      p.amount.toFixed(2),
      p.principalPaid.toFixed(2),
      p.interestPaid.toFixed(2),
      getAccountName(p.accountId),
      p.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${loan.lenderName}_payments.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Payment history exported', 'success');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  };

  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || 'Unknown';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!loan) {
    return null;
  }

  const isQardHasan = loan.loanType === 'qard-hasan';
  const progress = ((loan.totalPaid / loan.principalAmount) * 100).toFixed(1);
  const amortizationSchedule = generateAmortizationSchedule();
  const earlyPayoff500 = calculateEarlyPayoff(500);
  const earlyPayoff1000 = calculateEarlyPayoff(1000);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/loans')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Loans</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/dashboard/loans/edit/${loan.id}`)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Edit2 size={16} />
            Edit
          </button>
        </div>
      </div>

      {/* Loan Header */}
      <div className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
        isQardHasan ? 'border-green-500' : 'border-amber-500'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${isQardHasan ? 'bg-green-100' : 'bg-amber-100'}`}>
            {isQardHasan ? (
              <HandCoins size={32} className="text-green-600" />
            ) : (
              <Building2 size={32} className="text-amber-600" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{loan.lenderName}</h1>
            <p className="text-sm text-gray-600">
              {isQardHasan ? 'Interest-free loan (Qard Hasan)' : `${loan.interestRate}% Annual Interest`}
            </p>
            {loan.status === 'paid-off' && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  <CheckCircle2 size={14} />
                  Paid Off
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Loan Progress</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Progress</span>
            <span className="font-semibold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                isQardHasan ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Paid: ৳{loan.totalPaid.toLocaleString()}</span>
            <span>Remaining: ৳{loan.remainingBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-gray-500" />
            <p className="text-xs font-medium text-gray-600">Principal Amount</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">৳{loan.principalAmount.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent size={16} className="text-gray-500" />
            <p className="text-xs font-medium text-gray-600">Interest Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {isQardHasan ? '0%' : `${loan.interestRate}%`}
          </p>
          <p className="text-xs text-gray-500 mt-1">{isQardHasan ? 'Qard Hasan' : 'Annual'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-gray-500" />
            <p className="text-xs font-medium text-gray-600">Total Paid</p>
          </div>
          <p className="text-2xl font-bold text-green-600">৳{loan.totalPaid.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-gray-500" />
            <p className="text-xs font-medium text-gray-600">Monthly Payment</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            ৳{loan.monthlyPayment ? loan.monthlyPayment.toLocaleString() : 'Flexible'}
          </p>
        </div>
      </div>

      {/* Loan Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Loan Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Start Date</span>
            <span className="text-sm font-medium text-gray-900">{formatDate(loan.startDate)}</span>
          </div>
          {loan.endDate && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">End Date</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(loan.endDate)}</span>
            </div>
          )}
          {loan.totalMonths > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Duration</span>
              <span className="text-sm font-medium text-gray-900">{loan.totalMonths} months</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Remaining Balance</span>
            <span className="text-sm font-medium text-red-600">৳{loan.remainingBalance.toLocaleString()}</span>
          </div>
          {!isQardHasan && (
            <>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Interest</span>
                <span className="text-sm font-medium text-amber-600">৳{loan.totalInterest?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Repayment</span>
                <span className="text-sm font-medium text-gray-900">৳{loan.totalRepayment?.toLocaleString() || 0}</span>
              </div>
            </>
          )}
          {loan.nextPaymentDue && loan.status === 'active' && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Next Payment Due</span>
              <span className="text-sm font-medium text-blue-600">{formatDate(loan.nextPaymentDue)}</span>
            </div>
          )}
          {loan.lastPaymentDate && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Last Payment</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(loan.lastPaymentDate)}</span>
            </div>
          )}
          {loan.accountId && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Payment Account</span>
              <span className="text-sm font-medium text-gray-900">{getAccountName(loan.accountId)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Status</span>
            <span className={`text-sm font-medium ${loan.status === 'active' ? 'text-green-600' : 'text-blue-600'}`}>
              {loan.status === 'active' ? 'Active' : 'Paid Off'}
            </span>
          </div>
        </div>
        {loan.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-1">Notes</p>
            <p className="text-sm text-gray-900">{loan.notes}</p>
          </div>
        )}
      </div>

      {/* Early Payoff Calculator */}
      {!isQardHasan && loan.status === 'active' && earlyPayoff500 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Early Payoff Calculator</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              See how extra payments can save you money and time:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-900 mb-2">Extra ৳500/month</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Months remaining:</span>
                    <span className="font-semibold text-blue-900">{earlyPayoff500.monthsRemaining}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Interest saved:</span>
                    <span className="font-semibold text-blue-900">৳{earlyPayoff500.savedInterest.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {earlyPayoff1000 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-green-900 mb-2">Extra ৳1,000/month</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Months remaining:</span>
                      <span className="font-semibold text-green-900">{earlyPayoff1000.monthsRemaining}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Interest saved:</span>
                      <span className="font-semibold text-green-900">৳{earlyPayoff1000.savedInterest.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Amortization Schedule */}
      {!isQardHasan && amortizationSchedule.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Amortization Schedule</h2>
            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAmortization ? 'Hide' : 'Show'} Schedule
            </button>
          </div>
          {showAmortization && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Month</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Payment</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Principal</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Interest</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {amortizationSchedule.map((row) => (
                    <tr key={row.month} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{row.month}</td>
                      <td className="px-4 py-2 text-right">৳{row.payment.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-green-600">৳{row.principal.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-amber-600">৳{row.interest.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium">৳{row.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Payment History ({payments.length} payments)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Principal</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Interest</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Account</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDate(payment.paymentDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold">৳{payment.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-600">৳{payment.principalPaid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-amber-600">৳{payment.interestPaid.toLocaleString()}</td>
                    <td className="px-4 py-3">{getAccountName(payment.accountId)}</td>
                    <td className="px-4 py-3 text-gray-600">{payment.notes || '-'}</td>
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
