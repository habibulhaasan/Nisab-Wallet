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
    <div className="max-w-6xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/lendings')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                lending.lendingType === 'qard-hasan' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
            >
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lending.borrowerName}</h1>
              <p className="text-sm text-gray-500">
                {lending.lendingType === 'qard-hasan' ? 'Qard Hasan (Interest-Free)' : 'Conventional Lending'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportPayments}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={() => router.push(`/dashboard/lendings?edit=${lendingId}`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {status.isOverdue && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={24} className="text-red-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-900">Payment Overdue!</p>
            <p className="text-sm text-red-700">
              This payment is {status.daysOverdue} days overdue. Consider sending a reminder.
            </p>
          </div>
        </div>
      )}

      {lending.status === 'completed' && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 size={24} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-900">Fully Repaid!</p>
            <p className="text-sm text-green-700">
              This lending has been completely paid off. Great job!
            </p>
          </div>
        </div>
      )}

      {/* Progress Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Repayment Progress</h2>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
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

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">
              ৳{(lending.totalRepaid || 0).toLocaleString()} / ৳{lending.principalAmount.toLocaleString()}
            </span>
            <span className="font-bold text-gray-900">{status.percentagePaid}% Repaid</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                lending.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(status.percentagePaid, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <DollarSign size={24} className="mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-gray-500 mb-1">Principal</p>
            <p className="text-lg font-bold text-blue-600">৳{lending.principalAmount.toLocaleString()}</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle2 size={24} className="mx-auto mb-2 text-green-600" />
            <p className="text-xs text-gray-500 mb-1">Repaid</p>
            <p className="text-lg font-bold text-green-600">৳{(lending.totalRepaid || 0).toLocaleString()}</p>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg">
            <TrendingUp size={24} className="mx-auto mb-2 text-red-600" />
            <p className="text-xs text-gray-500 mb-1">Remaining</p>
            <p className="text-lg font-bold text-red-600">৳{status.remainingBalance.toLocaleString()}</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Clock size={24} className="mx-auto mb-2 text-purple-600" />
            <p className="text-xs text-gray-500 mb-1">Payments</p>
            <p className="text-lg font-bold text-purple-600">
              {lending.paymentsReceived || 0}
              {lending.totalInstallments ? ` / ${lending.totalInstallments}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Borrower Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            Borrower Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <User size={16} className="text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="text-sm font-medium text-gray-900">{lending.borrowerName}</p>
              </div>
            </div>

            {lending.borrowerContact?.phone && (
              <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                <Phone size={16} className="text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">{lending.borrowerContact.phone}</p>
                </div>
              </div>
            )}

            {lending.borrowerContact?.email && (
              <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                <Mail size={16} className="text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{lending.borrowerContact.email}</p>
                </div>
              </div>
            )}

            {lending.borrowerContact?.address && (
              <div className="flex items-start gap-3 py-2">
                <MapPin size={16} className="text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">{lending.borrowerContact.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lending Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} />
            Lending Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Type</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {lending.lendingType === 'qard-hasan' ? 'Qard Hasan' : 'Conventional'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Category</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{lending.category}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Lending Date</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(lending.lendingDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Due Date</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(lending.dueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Repayment Type</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {lending.repaymentType === 'installments' ? 'Installments' : 'Full Payment'}
              </span>
            </div>
            {lending.repaymentType === 'installments' && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Installment Amount</span>
                  <span className="text-sm font-medium text-gray-900">
                    ৳{lending.installmentAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Frequency</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {lending.installmentFrequency}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Account</span>
              <span className="text-sm font-medium text-gray-900">{getAccountName(lending.accountId)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Next Payment Due</span>
              <span className={`text-sm font-medium ${status.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {lending.nextPaymentDue
                  ? new Date(lending.nextPaymentDue).toLocaleDateString()
                  : new Date(lending.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Witnesses */}
        {lending.witnesses && lending.witnesses.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} />
              Witnesses (Islamic Requirement)
            </h3>
            <div className="space-y-3">
              {lending.witnesses.map((witness, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{witness.name}</p>
                    {witness.contact && (
                      <p className="text-xs text-gray-600 mt-1">{witness.contact}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Payments Received</span>
              <span className="text-sm font-medium text-gray-900">{status.totalPayments}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Expected Payments</span>
              <span className="text-sm font-medium text-gray-900">{status.expectedPayments}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Payments On Time</span>
              <span className="text-sm font-medium text-green-600">{status.paymentsOnTime}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Payments Missed</span>
              <span className="text-sm font-medium text-red-600">{lending.paymentsMissed || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">On-Time Rate</span>
              <span className="text-sm font-medium text-gray-900">{status.paymentRate}%</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Reminders Sent</span>
              <span className="text-sm font-medium text-gray-900">{reminders.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar size={20} />
            Payment History
          </span>
          {payments.length > 0 && (
            <button
              onClick={exportPayments}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Download size={14} />
              Export CSV
            </button>
          )}
        </h3>
        {payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No payments received yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment Received</p>
                    <p className="text-xs text-gray-600">
                      {new Date(payment.paymentDate).toLocaleDateString()} • {payment.paymentMethod}
                    </p>
                    {payment.installmentNumber && (
                      <p className="text-xs text-gray-600 mt-1">
                        Installment #{payment.installmentNumber}
                        {lending.totalInstallments && ` of ${lending.totalInstallments}`}
                      </p>
                    )}
                    {payment.notes && (
                      <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">+৳{payment.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminders History */}
      {reminders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Send size={20} />
            Reminder History
          </h3>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <Send size={16} className="text-blue-600 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Reminder sent to {reminder.borrowerContact}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {reminder.sentAt?.toDate?.().toLocaleString() || 'Date unknown'}
                  </p>
                  <p className="text-xs text-gray-700 mt-2 bg-white p-2 rounded border border-blue-100">
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
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Notes</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{lending.notes}</p>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Delete Lending Record?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will permanently delete the lending record for "{lending.borrowerName}" and all payment
                history.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLending}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
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