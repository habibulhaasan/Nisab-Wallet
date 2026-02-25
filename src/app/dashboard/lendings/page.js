//src/app/dashboard/lendings/page.js

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAccounts } from '@/lib/firestoreCollections';
import { showToast } from '@/components/Toast';
import {
  Plus,
  User,
  DollarSign,
  Calendar,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  FileText,
  Send,
  BanknoteArrowDown,
  Eye,
  TrendingUp,
  Shield,
  Users,
  AlertTriangle,
  MessageCircle,
  Download,
  Upload,
  Bell,
} from 'lucide-react';

export default function LendingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [lendings, setLendings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showLendingModal, setShowLendingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const [editingLending, setEditingLending] = useState(null);
  const [selectedLending, setSelectedLending] = useState(null);
  const [lendingToDelete, setLendingToDelete] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');

  const [lendingFormData, setLendingFormData] = useState({
    borrowerName: '',
    borrowerPhone: '',
    borrowerEmail: '',
    borrowerAddress: '',
    lendingType: 'qard-hasan',
    principalAmount: '',
    lendingDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    repaymentType: 'full-payment',
    installmentAmount: '',
    installmentFrequency: 'monthly',
    totalInstallments: '',
    accountId: '',
    notes: '',
    category: 'personal',
    witness1Name: '',
    witness1Contact: '',
    witness2Name: '',
    witness2Contact: '',
    enableReminders: true,
    reminderDaysBefore: '3',
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank-transfer',
    notes: '',
  });

  const [reminderMessage, setReminderMessage] = useState('');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadLendings(), loadAccounts()]);
    setLoading(false);
  };

  const loadLendings = async () => {
    try {
      const lendingsRef = collection(db, 'users', user.uid, 'lendings');
      const q = query(lendingsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const lendingsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLendings(lendingsData);
    } catch (error) {
      console.error('Error loading lendings:', error);
      showToast('Failed to load lendings', 'error');
    }
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
      if (result.accounts.length > 0 && !lendingFormData.accountId) {
        setLendingFormData((prev) => ({ ...prev, accountId: result.accounts[0].id }));
      }
    }
  };

  const calculateLendingStatus = (lending) => {
    const today = new Date();
    const dueDate = new Date(lending.dueDate);
    const nextPaymentDue = lending.nextPaymentDue ? new Date(lending.nextPaymentDue) : dueDate;

    const isOverdue = nextPaymentDue < today && lending.status === 'active';
    const remainingBalance = lending.principalAmount - (lending.totalRepaid || 0);
    const percentagePaid = ((lending.totalRepaid || 0) / lending.principalAmount) * 100;

    return {
      isOverdue,
      remainingBalance,
      percentagePaid: percentagePaid.toFixed(1),
      daysOverdue: isOverdue ? Math.ceil((today - nextPaymentDue) / (1000 * 60 * 60 * 24)) : 0,
    };
  };

  const handleLendingSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!lendingFormData.borrowerName || !lendingFormData.principalAmount || !lendingFormData.dueDate) {
      return showToast('Please fill in required fields', 'error');
    }

    setSubmitting(true);

    try {
      const principalAmount = parseFloat(lendingFormData.principalAmount);

      const lendingData = {
        borrowerName: lendingFormData.borrowerName,
        borrowerContact: {
          phone: lendingFormData.borrowerPhone || '',
          email: lendingFormData.borrowerEmail || '',
          address: lendingFormData.borrowerAddress || '',
        },
        lendingType: lendingFormData.lendingType,
        principalAmount,
        interestRate: lendingFormData.lendingType === 'qard-hasan' ? 0 : 0,
        lendingDate: lendingFormData.lendingDate,
        dueDate: lendingFormData.dueDate,
        repaymentType: lendingFormData.repaymentType,
        accountId: lendingFormData.accountId,
        notes: lendingFormData.notes || '',
        category: lendingFormData.category,
        status: 'active',
        totalRepaid: 0,
        remainingBalance: principalAmount,
        paymentsReceived: 0,
        paymentsMissed: 0,
        enableReminders: lendingFormData.enableReminders,
        reminderDaysBefore: parseInt(lendingFormData.reminderDaysBefore) || 3,
        reminderMethods: ['whatsapp', 'sms'],
      };

      if (lendingFormData.repaymentType === 'installments') {
        const installmentAmount = parseFloat(lendingFormData.installmentAmount);
        const totalInstallments = parseInt(lendingFormData.totalInstallments);

        lendingData.installmentAmount = installmentAmount;
        lendingData.installmentFrequency = lendingFormData.installmentFrequency;
        lendingData.totalInstallments = totalInstallments;
        lendingData.nextPaymentDue = calculateNextPaymentDate(
          lendingFormData.lendingDate,
          lendingFormData.installmentFrequency
        );
      } else {
        lendingData.nextPaymentDue = lendingFormData.dueDate;
      }

      if (lendingFormData.witness1Name) {
        lendingData.witnesses = [
          {
            name: lendingFormData.witness1Name,
            contact: lendingFormData.witness1Contact || '',
          },
        ];
        if (lendingFormData.witness2Name) {
          lendingData.witnesses.push({
            name: lendingFormData.witness2Name,
            contact: lendingFormData.witness2Contact || '',
          });
        }
      }

      if (editingLending) {
        await updateDoc(doc(db, 'users', user.uid, 'lendings', editingLending.id), {
          ...lendingData,
          updatedAt: Timestamp.now(),
        });
        showToast('Lending record updated', 'success');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'lendings'), {
          ...lendingData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        showToast('Lending record created', 'success');
      }

      await loadLendings();
      closeLendingModal();
    } catch (error) {
      console.error('Error saving lending:', error);
      showToast('Error saving lending record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !selectedLending) return;

    const amount = parseFloat(paymentFormData.amount);
    if (!amount || amount <= 0) {
      return showToast('Please enter a valid amount', 'error');
    }

    if (amount > selectedLending.remainingBalance) {
      return showToast('Amount exceeds remaining balance', 'error');
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'users', user.uid, 'lendingPayments'), {
        lendingId: selectedLending.id,
        amount,
        paymentDate: paymentFormData.paymentDate,
        paymentMethod: paymentFormData.paymentMethod,
        notes: paymentFormData.notes || '',
        principalPortion: amount,
        interestPortion: 0,
        installmentNumber: (selectedLending.paymentsReceived || 0) + 1,
        createdAt: Timestamp.now(),
      });

      const newTotalRepaid = (selectedLending.totalRepaid || 0) + amount;
      const newRemainingBalance = selectedLending.principalAmount - newTotalRepaid;
      const newStatus = newRemainingBalance <= 0 ? 'completed' : 'active';

      const updateData = {
        totalRepaid: newTotalRepaid,
        remainingBalance: newRemainingBalance,
        status: newStatus,
        paymentsReceived: (selectedLending.paymentsReceived || 0) + 1,
        lastPaymentDate: paymentFormData.paymentDate,
        updatedAt: Timestamp.now(),
      };

      if (selectedLending.repaymentType === 'installments' && newStatus === 'active') {
        updateData.nextPaymentDue = calculateNextPaymentDate(
          paymentFormData.paymentDate,
          selectedLending.installmentFrequency
        );
      }

      await updateDoc(doc(db, 'users', user.uid, 'lendings', selectedLending.id), updateData);

      if (newStatus === 'completed') {
        showToast('🎉 Lending fully repaid!', 'success');
      } else {
        showToast('Payment recorded successfully', 'success');
      }

      await loadLendings();
      closePaymentModal();
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast('Error recording payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLending = async () => {
    if (!lendingToDelete) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'lendings', lendingToDelete.id));
      showToast('Lending record deleted', 'success');
      await loadLendings();
    } catch (error) {
      console.error('Error deleting lending:', error);
      showToast('Error deleting lending record', 'error');
    } finally {
      setShowDeleteModal(false);
      setLendingToDelete(null);
    }
  };

  const sendReminder = async () => {
    if (!selectedLending || !reminderMessage.trim()) {
      return showToast('Please enter a message', 'error');
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'lendingReminders'), {
        lendingId: selectedLending.id,
        borrowerName: selectedLending.borrowerName,
        borrowerContact: selectedLending.borrowerContact.phone,
        message: reminderMessage,
        sentAt: Timestamp.now(),
      });

      await updateDoc(doc(db, 'users', user.uid, 'lendings', selectedLending.id), {
        lastReminderSent: new Date().toISOString().split('T')[0],
      });

      showToast('Reminder sent successfully', 'success');
      setShowReminderModal(false);
      setReminderMessage('');
      await loadLendings();
    } catch (error) {
      console.error('Error sending reminder:', error);
      showToast('Error sending reminder', 'error');
    }
  };

  const calculateNextPaymentDate = (startDate, frequency) => {
    const date = new Date(startDate);
    if (frequency === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (frequency === 'weekly') {
      date.setDate(date.getDate() + 7);
    }
    return date.toISOString().split('T')[0];
  };

  const openLendingModal = (lending = null) => {
    if (lending) {
      setEditingLending(lending);
      setLendingFormData({
        borrowerName: lending.borrowerName,
        borrowerPhone: lending.borrowerContact?.phone || '',
        borrowerEmail: lending.borrowerContact?.email || '',
        borrowerAddress: lending.borrowerContact?.address || '',
        lendingType: lending.lendingType,
        principalAmount: lending.principalAmount.toString(),
        lendingDate: lending.lendingDate,
        dueDate: lending.dueDate,
        repaymentType: lending.repaymentType,
        installmentAmount: lending.installmentAmount?.toString() || '',
        installmentFrequency: lending.installmentFrequency || 'monthly',
        totalInstallments: lending.totalInstallments?.toString() || '',
        accountId: lending.accountId || accounts[0]?.id || '',
        notes: lending.notes || '',
        category: lending.category || 'personal',
        witness1Name: lending.witnesses?.[0]?.name || '',
        witness1Contact: lending.witnesses?.[0]?.contact || '',
        witness2Name: lending.witnesses?.[1]?.name || '',
        witness2Contact: lending.witnesses?.[1]?.contact || '',
        enableReminders: lending.enableReminders !== false,
        reminderDaysBefore: lending.reminderDaysBefore?.toString() || '3',
      });
    } else {
      setEditingLending(null);
      setLendingFormData({
        borrowerName: '',
        borrowerPhone: '',
        borrowerEmail: '',
        borrowerAddress: '',
        lendingType: 'qard-hasan',
        principalAmount: '',
        lendingDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        repaymentType: 'full-payment',
        installmentAmount: '',
        installmentFrequency: 'monthly',
        totalInstallments: '',
        accountId: accounts[0]?.id || '',
        notes: '',
        category: 'personal',
        witness1Name: '',
        witness1Contact: '',
        witness2Name: '',
        witness2Contact: '',
        enableReminders: true,
        reminderDaysBefore: '3',
      });
    }
    setShowLendingModal(true);
  };

  const closeLendingModal = () => {
    setShowLendingModal(false);
    setEditingLending(null);
  };

  const openPaymentModal = (lending) => {
    setSelectedLending(lending);
    setPaymentFormData({
      amount: lending.installmentAmount?.toString() || '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank-transfer',
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedLending(null);
  };

  const openReminderModal = (lending) => {
    setSelectedLending(lending);
    const amount = lending.installmentAmount || lending.remainingBalance;
    const dueDate = lending.nextPaymentDue || lending.dueDate;
    setReminderMessage(
      `Assalamu Alaikum ${lending.borrowerName}, this is a friendly reminder that your payment of ৳${amount.toLocaleString()} is due on ${new Date(
        dueDate
      ).toLocaleDateString()}. JazakAllah Khair!`
    );
    setShowReminderModal(true);
  };

  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || 'Unknown';

  const filteredLendings = lendings.filter((lending) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'overdue') {
      const status = calculateLendingStatus(lending);
      return status.isOverdue;
    }
    return lending.status === filterStatus;
  });

  const totalLent = lendings.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalRepaid = lendings.reduce((sum, l) => sum + (l.totalRepaid || 0), 0);
  const totalOutstanding = totalLent - totalRepaid;
  const activeLendings = lendings.filter((l) => l.status === 'active').length;
  const completedLendings = lendings.filter((l) => l.status === 'completed').length;
  const overdueLendings = lendings.filter((l) => calculateLendingStatus(l).isOverdue).length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lending Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track money lent to others (Qard Hasan & Conventional)</p>
        </div>
        <button
          onClick={() => openLendingModal()}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
        >
          <Plus size={15} />
          <span className="hidden xs:inline">New </span>Lending
        </button>
      </div>

      {/* Summary Cards — 3 cols on mobile, 6 on md */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase leading-tight">Total Lent</p>
            <TrendingUp size={12} className="text-blue-600 flex-shrink-0" />
          </div>
          <p className="text-sm sm:text-xl font-bold text-blue-600 truncate">৳{totalLent.toLocaleString()}</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase leading-tight">Repaid</p>
            <CheckCircle2 size={12} className="text-green-600 flex-shrink-0" />
          </div>
          <p className="text-sm sm:text-xl font-bold text-green-600 truncate">৳{totalRepaid.toLocaleString()}</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase leading-tight">Outstanding</p>
            <DollarSign size={12} className="text-red-600 flex-shrink-0" />
          </div>
          <p className="text-sm sm:text-xl font-bold text-red-600 truncate">৳{totalOutstanding.toLocaleString()}</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase leading-tight">Active</p>
            <Clock size={12} className="text-orange-600 flex-shrink-0" />
          </div>
          <p className="text-sm sm:text-xl font-bold text-orange-600">{activeLendings}</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase leading-tight">Completed</p>
            <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0" />
          </div>
          <p className="text-sm sm:text-xl font-bold text-emerald-600">{completedLendings}</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase leading-tight">Overdue</p>
            <AlertTriangle size={12} className="text-red-600 flex-shrink-0" />
          </div>
          <p className="text-sm sm:text-xl font-bold text-red-600">{overdueLendings}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200">
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {['all', 'active', 'completed', 'overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                filterStatus === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lendings List */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
        </div>
      ) : filteredLendings.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900">No lending records</p>
          <p className="text-sm text-gray-500 mt-1">Create a record when you lend money</p>
          <button
            onClick={() => openLendingModal()}
            className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
          >
            Create Lending Record
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLendings.map((lending) => {
            const lendingStatus = calculateLendingStatus(lending);

            return (
              <div
                key={lending.id}
                className={`bg-white rounded-lg shadow-sm p-4 sm:p-5 border-l-4 hover:shadow-md transition-all ${
                  lendingStatus.isOverdue
                    ? 'border-red-500 bg-red-50'
                    : lending.status === 'completed'
                    ? 'border-green-500'
                    : 'border-blue-500'
                }`}
              >
                {/* Card Top: icon + name/contact + action buttons */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0 ${
                      lending.lendingType === 'qard-hasan' ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                  >
                    <Shield size={20} className="sm:hidden" />
                    <Shield size={24} className="hidden sm:block" />
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{lending.borrowerName}</h3>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                          lending.lendingType === 'qard-hasan'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {lending.lendingType === 'qard-hasan' ? 'Qard Hasan' : 'Conventional'}
                      </span>
                      {lending.status === 'completed' && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-0.5 flex-shrink-0">
                          <CheckCircle2 size={10} /> Paid Off
                        </span>
                      )}
                      {lendingStatus.isOverdue && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-0.5 animate-pulse flex-shrink-0">
                          <AlertTriangle size={10} /> {lendingStatus.daysOverdue}d Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-600">
                      {lending.borrowerContact?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {lending.borrowerContact.phone}
                        </span>
                      )}
                      {lending.borrowerContact?.email && (
                        <span className="flex items-center gap-1 truncate max-w-[160px]">
                          <Mail size={12} />
                          {lending.borrowerContact.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons — compact on mobile */}
                  <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                    {lending.status === 'active' && (
                      <>
                        <button
                          onClick={() => openPaymentModal(lending)}
                          className="p-1.5 sm:p-2 hover:bg-green-50 rounded-lg"
                          title="Record Payment"
                        >
                          <BanknoteArrowDown size={16} className="text-green-600" />
                        </button>
                        <button
                          onClick={() => openReminderModal(lending)}
                          className="p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg"
                          title="Send Reminder"
                        >
                          <Send size={16} className="text-blue-600" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/lendings/${lending.id}`)}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
                      title="View Details"
                    >
                      <Eye size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => openLendingModal(lending)}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        setLendingToDelete(lending);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">
                      ৳{(lending.totalRepaid || 0).toLocaleString()} / ৳{lending.principalAmount.toLocaleString()}
                    </span>
                    <span className="font-medium text-gray-900">{lendingStatus.percentagePaid}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                    <div
                      className={`h-2.5 sm:h-3 rounded-full transition-all ${
                        lending.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(lendingStatus.percentagePaid, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details Grid — 2 cols on mobile, 5 on md */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Principal</p>
                    <p className="font-semibold text-gray-900">৳{lending.principalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Remaining</p>
                    <p className="font-semibold text-red-600">৳{lendingStatus.remainingBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Payments</p>
                    <p className="font-semibold text-gray-900">
                      {lending.paymentsReceived || 0}
                      {lending.totalInstallments ? ` / ${lending.totalInstallments}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Next Due</p>
                    <p className="font-semibold text-gray-900">
                      {lending.nextPaymentDue
                        ? new Date(lending.nextPaymentDue).toLocaleDateString()
                        : new Date(lending.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[10px] sm:text-xs text-gray-500">Repayment</p>
                    <p className="font-semibold text-gray-900 truncate">
                      {lending.repaymentType === 'installments'
                        ? `৳${lending.installmentAmount?.toLocaleString()}/${lending.installmentFrequency}`
                        : 'Full Payment'}
                    </p>
                  </div>
                </div>

                {/* Witnesses */}
                {lending.witnesses && lending.witnesses.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Witnesses:</p>
                    <div className="flex flex-wrap gap-3">
                      {lending.witnesses.map((witness, idx) => (
                        <span key={idx} className="text-xs text-gray-700 flex items-center gap-1">
                          <Users size={12} />
                          {witness.name}
                          {witness.contact && ` (${witness.contact})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Lending Modal */}
      {showLendingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-3xl my-4 sm:my-8 shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 z-10 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {editingLending ? 'Edit Lending Record' : 'New Lending Record'}
                </h2>
                <button onClick={closeLendingModal} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleLendingSubmit} className="p-4 sm:p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Borrower Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={16} />
                  Borrower Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={lendingFormData.borrowerName}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, borrowerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Ahmed Hassan"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={lendingFormData.borrowerPhone}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, borrowerPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="+880 1712-345678"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={lendingFormData.borrowerEmail}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, borrowerEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="ahmed@example.com"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={lendingFormData.borrowerAddress}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, borrowerAddress: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Dhaka, Bangladesh"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Lending Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign size={16} />
                  Lending Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lending Type *</label>
                    <select
                      value={lendingFormData.lendingType}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, lendingType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                      disabled={submitting}
                    >
                      <option value="qard-hasan">Qard Hasan (Interest-Free)</option>
                      <option value="conventional">Conventional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={lendingFormData.category}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={submitting}
                    >
                      <option value="personal">Personal</option>
                      <option value="business">Business</option>
                      <option value="emergency">Emergency</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (৳) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={lendingFormData.principalAmount}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, principalAmount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="50000"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
                    <select
                      value={lendingFormData.accountId}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, accountId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={submitting}
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (৳{a.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lending Date *</label>
                    <input
                      type="date"
                      value={lendingFormData.lendingDate}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, lendingDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      value={lendingFormData.dueDate}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Repayment Settings */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={16} />
                  Repayment Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repayment Type *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setLendingFormData((p) => ({ ...p, repaymentType: 'full-payment' }))}
                        className={`p-2.5 sm:p-3 rounded-lg border-2 transition text-xs sm:text-sm ${
                          lendingFormData.repaymentType === 'full-payment'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        Full Payment (One-time)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLendingFormData((p) => ({ ...p, repaymentType: 'installments' }))}
                        className={`p-2.5 sm:p-3 rounded-lg border-2 transition text-xs sm:text-sm ${
                          lendingFormData.repaymentType === 'installments'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        Installments
                      </button>
                    </div>
                  </div>

                  {lendingFormData.repaymentType === 'installments' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Installment Amount (৳)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={lendingFormData.installmentAmount}
                          onChange={(e) => setLendingFormData((p) => ({ ...p, installmentAmount: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="5000"
                          disabled={submitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                        <select
                          value={lendingFormData.installmentFrequency}
                          onChange={(e) => setLendingFormData((p) => ({ ...p, installmentFrequency: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          disabled={submitting}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Installments</label>
                        <input
                          type="number"
                          value={lendingFormData.totalInstallments}
                          onChange={(e) => setLendingFormData((p) => ({ ...p, totalInstallments: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="10"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Witnesses */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={16} />
                  Witnesses (Islamic Requirement)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Witness 1 Name</label>
                    <input
                      type="text"
                      value={lendingFormData.witness1Name}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, witness1Name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Ibrahim Ali"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Witness 1 Contact</label>
                    <input
                      type="text"
                      value={lendingFormData.witness1Contact}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, witness1Contact: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="+880 1798-765432"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Witness 2 Name</label>
                    <input
                      type="text"
                      value={lendingFormData.witness2Name}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, witness2Name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Fatima Khan"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Witness 2 Contact</label>
                    <input
                      type="text"
                      value={lendingFormData.witness2Contact}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, witness2Contact: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="+880 1687-654321"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Reminders */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Bell size={16} />
                  Reminders
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableReminders"
                      checked={lendingFormData.enableReminders}
                      onChange={(e) => setLendingFormData((p) => ({ ...p, enableReminders: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="enableReminders" className="text-sm text-gray-700">
                      Enable payment reminders
                    </label>
                  </div>

                  {lendingFormData.enableReminders && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Remind before (days)</label>
                        <input
                          type="number"
                          value={lendingFormData.reminderDaysBefore}
                          onChange={(e) => setLendingFormData((p) => ({ ...p, reminderDaysBefore: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="3"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={lendingFormData.notes}
                  onChange={(e) => setLendingFormData((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows="2"
                  placeholder="Purpose of lending, special terms, etc..."
                  disabled={submitting}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  onClick={closeLendingModal}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingLending ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedLending && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg w-full sm:max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Record Payment</h2>
              <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{selectedLending.borrowerName}</p>
              <p className="text-xs text-gray-600">
                Remaining: ৳{selectedLending.remainingBalance.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder={selectedLending.installmentAmount?.toString() || '5000'}
                  required
                  disabled={submitting}
                  max={selectedLending.remainingBalance}
                />
                {paymentFormData.amount && (
                  <p className="text-xs text-gray-600 mt-1">
                    Remaining after: ৳
                    {(selectedLending.remainingBalance - parseFloat(paymentFormData.amount || 0)).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={paymentFormData.paymentDate}
                  onChange={(e) => setPaymentFormData((p) => ({ ...p, paymentDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={paymentFormData.paymentMethod}
                  onChange={(e) => setPaymentFormData((p) => ({ ...p, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                  disabled={submitting}
                >
                  <option value="cash">Cash</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="mobile-wallet">Mobile Wallet</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Payment note..."
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && selectedLending && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg w-full sm:max-w-lg p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Send Payment Reminder</h2>
              <button onClick={() => setShowReminderModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-900">
                To: {selectedLending.borrowerName}
              </p>
              <p className="text-xs text-blue-700">{selectedLending.borrowerContact?.phone}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows="4"
                placeholder="Enter your message..."
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> This will create a record of the reminder. For actual WhatsApp/SMS sending,
                integrate with messaging API.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReminderModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendReminder}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <AlertCircle size={36} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Delete Lending Record?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will permanently delete this lending record and all payment history.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 border rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLending}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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