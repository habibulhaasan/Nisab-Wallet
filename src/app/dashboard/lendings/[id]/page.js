// src/app/dashboard/lendings/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAccounts } from '@/lib/firestoreCollections';
import { showToast } from '@/components/Toast';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Shield,
  Users,
  Clock,
  FileText,
  Send,
  AlertTriangle,
} from 'lucide-react';

export default function LendingDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lendingId = params.id;

  const [lending, setLending] = useState(null);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user && lendingId) loadData();
  }, [user, lendingId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadLending(), loadPayments(), loadReminders(), loadAccounts()]);
    setLoading(false);
  };

  const loadLending = async () => {
    try {
      const lendingDoc = await getDoc(doc(db, 'users', user.uid, 'lendings', lendingId));
      if (lendingDoc.exists()) {
        setLending({ id: lendingDoc.id, ...lendingDoc.data() });
      } else {
        showToast('Lending record not found', 'error');
        router.push('/dashboard/lendings');
      }
    } catch (error) {
      console.error('Error loading lending:', error);
      showToast('Error loading lending', 'error');
    }
  };

  const loadPayments = async () => {
    try {
      const paymentsRef = collection(db, 'users', user.uid, 'lendingPayments');
      const q = query(paymentsRef, where('lendingId', '==', lendingId), orderBy('paymentDate', 'desc'));
      const snapshot = await getDocs(q);
      const paymentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const loadReminders = async () => {
    try {
      const remindersRef = collection(db, 'users', user.uid, 'lendingReminders');
      const q = query(remindersRef, where('lendingId', '==', lendingId), orderBy('sentAt', 'desc'));
      const snapshot = await getDocs(q);
      const remindersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReminders(remindersData);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
    }
  };

  const handleDeleteLending = async () => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'lendings', lendingId));
      showToast('Lending record deleted', 'success');
      router.push('/dashboard/lendings');
    } catch (error) {
      console.error('Error deleting lending:', error);
      showToast('Error deleting lending', 'error');
    }
  };

  const exportPayments = () => {
    if (payments.length === 0) {
      return showToast('No payments to export', 'error');
    }

    const csv = [
      ['Date', 'Amount', 'Method', 'Installment', 'Notes'].join(','),
      ...payments.map((p) =>
        [
          p.paymentDate,
          p.amount,
          p.paymentMethod,
          p.installmentNumber || '-',
          p.notes || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lending.borrowerName}-payments.csv`;
    a.click();
    showToast('Payments exported', 'success');
  };

  const calculateStatus = () => {
    if (!lending) return {};

    const today = new Date();
    const dueDate = new Date(lending.dueDate);
    const nextPaymentDue = lending.nextPaymentDue ? new Date(lending.nextPaymentDue) : dueDate;

    const isOverdue = nextPaymentDue < today && lending.status === 'active';
    const remainingBalance = lending.principalAmount - (lending.totalRepaid || 0);
    const percentagePaid = ((lending.totalRepaid || 0) / lending.principalAmount) * 100;
    const daysOverdue = isOverdue ? Math.ceil((today - nextPaymentDue) / (1000 * 60 * 60 * 24)) : 0;

    const totalPayments = payments.length;
    const expectedPayments = lending.totalInstallments || 1;
    const paymentsOnTime = payments.filter((p) => {
      const payDate = new Date(p.paymentDate);
      return payDate <= new Date(lending.nextPaymentDue || lending.dueDate);
    }).length;

    return {
      isOverdue,
      remainingBalance,
      percentagePaid: percentagePaid.toFixed(1),
      daysOverdue,
      totalPayments,
      expectedPayments,
      paymentsOnTime,
      paymentRate: totalPayments > 0 ? ((paymentsOnTime / totalPayments) * 100).toFixed(0) : 0,
    };
  };

  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || 'Unknown';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full"></div>
      </div>
    );
  }

  if (!lending) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={64} className="mx-auto mb-4 text-gray-300" />
        <p className="text-lg text-gray-600">Lending record not found</p>
      </div>
    );
  }

  const status = calculateStatus();

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: back button + icon + name */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => router.push('/dashboard/lendings')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div
              className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0 ${
                lending.lendingType === 'qard-hasan' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
            >
              <Shield size={20} className="sm:hidden" />
              <Shield size={32} className="hidden sm:block" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{lending.borrowerName}</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {lending.lendingType === 'qard-hasan' ? 'Qard Hasan (Interest-Free)' : 'Conventional Lending'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          {/* Mobile: icon-only buttons */}
          <button
            onClick={exportPayments}
            className="p-2 sm:hidden border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Export"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => router.push(`/dashboard/lendings?edit=${lendingId}`)}
            className="p-2 sm:hidden border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 sm:hidden bg-red-600 text-white rounded-lg hover:bg-red-700"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>

          {/* Desktop: text buttons */}
          <button
            onClick={exportPayments}
            className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={() => router.push(`/dashboard/lendings?edit=${lendingId}`)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {status.isOverdue && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-3 sm:p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900 text-sm sm:text-base">Payment Overdue!</p>
            <p className="text-xs sm:text-sm text-red-700">
              This payment is {status.daysOverdue} days overdue. Consider sending a reminder.
            </p>
          </div>
        </div>
      )}

      {lending.status === 'completed' && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 sm:p-4 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-green-900 text-sm sm:text-base">Fully Repaid!</p>
            <p className="text-xs sm:text-sm text-green-700">
              This lending has been completely paid off. Great job!
            </p>
          </div>
        </div>
      )}

      {/* Progress Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Repayment Progress</h2>
          <span
            className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${
              lending.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : status.isOverdue
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {lending.status === 'completed' ? 'Completed' : status.isOverdue ? 'Overdue' : 'Active'}
          </span>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-gray-600">
              ৳{(lending.totalRepaid || 0).toLocaleString()} / ৳{lending.principalAmount.toLocaleString()}
            </span>
            <span className="font-bold text-gray-900">{status.percentagePaid}% Repaid</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
            <div
              className={`h-3 sm:h-4 rounded-full transition-all ${
                lending.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(status.percentagePaid, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <DollarSign size={20} className="mx-auto mb-1 sm:mb-2 text-blue-600" />
            <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Principal</p>
            <p className="text-sm sm:text-lg font-bold text-blue-600">৳{lending.principalAmount.toLocaleString()}</p>
          </div>

          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
            <CheckCircle2 size={20} className="mx-auto mb-1 sm:mb-2 text-green-600" />
            <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Repaid</p>
            <p className="text-sm sm:text-lg font-bold text-green-600">৳{(lending.totalRepaid || 0).toLocaleString()}</p>
          </div>

          <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
            <TrendingUp size={20} className="mx-auto mb-1 sm:mb-2 text-red-600" />
            <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Remaining</p>
            <p className="text-sm sm:text-lg font-bold text-red-600">৳{status.remainingBalance.toLocaleString()}</p>
          </div>

          <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
            <Clock size={20} className="mx-auto mb-1 sm:mb-2 text-purple-600" />
            <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Payments</p>
            <p className="text-sm sm:text-lg font-bold text-purple-600">
              {lending.paymentsReceived || 0}
              {lending.totalInstallments ? ` / ${lending.totalInstallments}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Borrower Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User size={18} />
            Borrower Information
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <User size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500">Full Name</p>
                <p className="text-sm font-medium text-gray-900">{lending.borrowerName}</p>
              </div>
            </div>

            {lending.borrowerContact?.phone && (
              <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                <Phone size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">{lending.borrowerContact.phone}</p>
                </div>
              </div>
            )}

            {lending.borrowerContact?.email && (
              <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                <Mail size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 break-all">{lending.borrowerContact.email}</p>
                </div>
              </div>
            )}

            {lending.borrowerContact?.address && (
              <div className="flex items-start gap-3 py-2">
                <MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">{lending.borrowerContact.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lending Details */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={18} />
            Lending Details
          </h3>
          <div className="space-y-1 sm:space-y-0">
            {[
              { label: 'Type', value: lending.lendingType === 'qard-hasan' ? 'Qard Hasan' : 'Conventional' },
              { label: 'Category', value: lending.category, capitalize: true },
              { label: 'Lending Date', value: new Date(lending.lendingDate).toLocaleDateString() },
              { label: 'Due Date', value: new Date(lending.dueDate).toLocaleDateString() },
              { label: 'Repayment Type', value: lending.repaymentType === 'installments' ? 'Installments' : 'Full Payment' },
              ...(lending.repaymentType === 'installments' ? [
                { label: 'Installment Amount', value: `৳${lending.installmentAmount?.toLocaleString()}` },
                { label: 'Frequency', value: lending.installmentFrequency, capitalize: true },
              ] : []),
              { label: 'Account', value: getAccountName(lending.accountId) },
              {
                label: 'Next Payment Due',
                value: lending.nextPaymentDue
                  ? new Date(lending.nextPaymentDue).toLocaleDateString()
                  : new Date(lending.dueDate).toLocaleDateString(),
                overdue: status.isOverdue,
              },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex justify-between items-start py-2 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">{row.label}</span>
                <span className={`text-xs sm:text-sm font-medium text-right ml-2 ${row.overdue ? 'text-red-600' : 'text-gray-900'} ${row.capitalize ? 'capitalize' : ''}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Witnesses */}
        {lending.witnesses && lending.witnesses.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={18} />
              Witnesses (Islamic Requirement)
            </h3>
            <div className="space-y-3">
              {lending.witnesses.map((witness, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{witness.name}</p>
                    {witness.contact && (
                      <p className="text-xs text-gray-600 mt-0.5">{witness.contact}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Statistics</h3>
          <div className="space-y-1 sm:space-y-0">
            {[
              { label: 'Total Payments Received', value: status.totalPayments, color: 'text-gray-900' },
              { label: 'Expected Payments', value: status.expectedPayments, color: 'text-gray-900' },
              { label: 'Payments On Time', value: status.paymentsOnTime, color: 'text-green-600' },
              { label: 'Payments Missed', value: lending.paymentsMissed || 0, color: 'text-red-600' },
              { label: 'On-Time Rate', value: `${status.paymentRate}%`, color: 'text-gray-900' },
              { label: 'Reminders Sent', value: reminders.length, color: 'text-gray-900' },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex justify-between py-2 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="text-xs sm:text-sm text-gray-600">{row.label}</span>
                <span className={`text-xs sm:text-sm font-medium ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={18} />
            Payment History
          </h3>
          {payments.length > 0 && (
            <button
              onClick={exportPayments}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Download size={14} />
              Export CSV
            </button>
          )}
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No payments received yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-start justify-between p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg gap-3"
              >
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Payment Received</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">
                      {new Date(payment.paymentDate).toLocaleDateString()} • {payment.paymentMethod}
                    </p>
                    {payment.installmentNumber && (
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                        Installment #{payment.installmentNumber}
                        {lending.totalInstallments && ` of ${lending.totalInstallments}`}
                      </p>
                    )}
                    {payment.notes && (
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{payment.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm sm:text-lg font-bold text-green-600 whitespace-nowrap">+৳{payment.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminders History */}
      {reminders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Send size={18} />
            Reminder History
          </h3>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <Send size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    Reminder sent to {reminder.borrowerContact}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                    {reminder.sentAt?.toDate?.().toLocaleString() || 'Date unknown'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-700 mt-2 bg-white p-2 rounded border border-blue-100">
                    {reminder.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {lending.notes && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Additional Notes</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{lending.notes}</p>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Delete Lending Record?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will permanently delete the lending record for "{lending.borrowerName}" and all payment
                history.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLending}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}