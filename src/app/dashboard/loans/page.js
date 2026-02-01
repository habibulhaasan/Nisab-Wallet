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
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAccounts, updateAccount } from '@/lib/firestoreCollections';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  DollarSign,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Loader2,
  HandCoins,
  Building2,
  Bell,
  BellOff,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Banknote,
} from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function LoansPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanToDelete, setLoanToDelete] = useState(null);

  const [filterStatus, setFilterStatus] = useState('active');
  const [filterType, setFilterType] = useState('all');

  const [loanFormData, setLoanFormData] = useState({
    lenderName: '',
    loanType: 'qard-hasan',
    principalAmount: '',
    interestRate: '0',
    monthlyPayment: '',
    totalMonths: '',
    startDate: new Date().toISOString().split('T')[0],
    accountId: '',
    notes: '',
    enableReminders: true,
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    accountId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadLoans(), loadAccounts()]);
    setLoading(false);
  };

  const loadLoans = async () => {
    try {
      const loansRef = collection(db, 'users', user.uid, 'loans');
      const q = query(loansRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const loansData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLoans(loansData);
    } catch (error) {
      console.error('Error loading loans:', error);
      showToast('Failed to load loans', 'error');
    }
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
      if (result.accounts.length > 0 && !loanFormData.accountId) {
        setLoanFormData((prev) => ({ ...prev, accountId: result.accounts[0].id }));
        setPaymentFormData((prev) => ({ ...prev, accountId: result.accounts[0].id }));
      }
    }
  };

  const calculateLoanDetails = (formData) => {
    const principal = parseFloat(formData.principalAmount) || 0;
    const annualRate = parseFloat(formData.interestRate) || 0;
    const months = parseInt(formData.totalMonths) || 0;
    const monthlyPaymentInput = parseFloat(formData.monthlyPayment) || 0;

    if (formData.loanType === 'qard-hasan') {
      // For Qard Hasan
      if (months > 0) {
        // If months provided, calculate monthly payment
        return {
          monthlyPayment: principal / months,
          totalMonths: months,
          totalInterest: 0,
          totalRepayment: principal,
        };
      } else if (monthlyPaymentInput > 0) {
        // If monthly payment provided, calculate months
        const calculatedMonths = Math.ceil(principal / monthlyPaymentInput);
        return {
          monthlyPayment: monthlyPaymentInput,
          totalMonths: calculatedMonths,
          totalInterest: 0,
          totalRepayment: principal,
        };
      }
      return {
        monthlyPayment: 0,
        totalMonths: 0,
        totalInterest: 0,
        totalRepayment: principal,
      };
    }

    // For Interest-based loans
    if (principal > 0 && annualRate > 0) {
      const monthlyRate = annualRate / 12 / 100;
      
      if (months > 0) {
        // Calculate monthly payment from months
        const monthlyPayment =
          (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);
        const totalRepayment = monthlyPayment * months;
        const totalInterest = totalRepayment - principal;

        return {
          monthlyPayment,
          totalMonths: months,
          totalInterest,
          totalRepayment,
        };
      } else if (monthlyPaymentInput > 0) {
        // Calculate months from monthly payment
        const calculatedMonths = Math.ceil(
          Math.log(monthlyPaymentInput / (monthlyPaymentInput - principal * monthlyRate)) /
          Math.log(1 + monthlyRate)
        );
        const totalRepayment = monthlyPaymentInput * calculatedMonths;
        const totalInterest = totalRepayment - principal;

        return {
          monthlyPayment: monthlyPaymentInput,
          totalMonths: calculatedMonths,
          totalInterest,
          totalRepayment,
        };
      }
    }

    return { monthlyPayment: 0, totalMonths: 0, totalInterest: 0, totalRepayment: principal };
  };

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!loanFormData.lenderName || !loanFormData.principalAmount || !loanFormData.startDate) {
      return showToast('Please fill in all required fields', 'error');
    }

    const principal = parseFloat(loanFormData.principalAmount);
    if (principal <= 0) {
      return showToast('Principal amount must be greater than 0', 'error');
    }

    if (loanFormData.loanType === 'interest' && !loanFormData.interestRate) {
      return showToast('Interest rate is required for interest-based loans', 'error');
    }

    if (loanFormData.loanType === 'interest' && !loanFormData.totalMonths && !loanFormData.monthlyPayment) {
      return showToast('Either duration or monthly payment is required', 'error');
    }

    setSubmitting(true);

    try {
      const calculations = calculateLoanDetails(loanFormData);
      const months = calculations.totalMonths;
      
      const startDate = new Date(loanFormData.startDate);
      const endDate = months > 0 
        ? new Date(startDate.getFullYear(), startDate.getMonth() + months, startDate.getDate())
        : null;

      const loanData = {
        lenderName: loanFormData.lenderName,
        loanType: loanFormData.loanType,
        principalAmount: principal,
        interestRate: parseFloat(loanFormData.interestRate) || 0,
        monthlyPayment: calculations.monthlyPayment,
        totalMonths: months,
        startDate: loanFormData.startDate,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null,
        totalPaid: 0,
        remainingBalance: principal,
        status: 'active',
        nextPaymentDue: months > 0 ? new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()).toISOString().split('T')[0] : null,
        lastPaymentDate: null,
        notes: loanFormData.notes || '',
        accountId: loanFormData.accountId,
        totalInterest: calculations.totalInterest,
        totalRepayment: calculations.totalRepayment,
        enableReminders: loanFormData.enableReminders,
      };

      if (editingLoan) {
        await updateDoc(doc(db, 'users', user.uid, 'loans', editingLoan.id), {
          ...loanData,
          updatedAt: Timestamp.now(),
        });
        showToast('Loan updated successfully', 'success');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'loans'), {
          ...loanData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        showToast('Loan added successfully', 'success');
      }

      await loadLoans();
      closeLoanModal();
    } catch (error) {
      console.error('Error saving loan:', error);
      showToast('Error saving loan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !selectedLoan) return;

    const amount = parseFloat(paymentFormData.amount);
    if (!amount || amount <= 0) {
      return showToast('Please enter a valid payment amount', 'error');
    }

    if (amount > selectedLoan.remainingBalance) {
      return showToast('Payment amount cannot exceed remaining balance', 'error');
    }

    const account = accounts.find((a) => a.id === paymentFormData.accountId);
    if (!account) {
      return showToast('Please select an account', 'error');
    }

    if (account.balance < amount) {
      return showToast(`Insufficient balance in ${account.name}`, 'error');
    }

    setSubmitting(true);

    try {
      let principalPaid = amount;
      let interestPaid = 0;

      if (selectedLoan.loanType === 'interest' && selectedLoan.remainingBalance > 0) {
        const monthlyRate = selectedLoan.interestRate / 12 / 100;
        interestPaid = selectedLoan.remainingBalance * monthlyRate;
        principalPaid = amount - interestPaid;

        if (principalPaid < 0) {
          principalPaid = 0;
          interestPaid = amount;
        }
      }

      await addDoc(collection(db, 'users', user.uid, 'loanPayments'), {
        loanId: selectedLoan.id,
        amount,
        paymentDate: paymentFormData.paymentDate,
        principalPaid,
        interestPaid,
        accountId: paymentFormData.accountId,
        notes: paymentFormData.notes || '',
        createdAt: Timestamp.now(),
      });

      const loanPaymentCategory = await ensureLoanPaymentCategory();
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type: 'Expense',
        amount,
        accountId: paymentFormData.accountId,
        categoryId: loanPaymentCategory.id,
        description: `Loan payment: ${selectedLoan.lenderName}`,
        date: paymentFormData.paymentDate,
        createdAt: Timestamp.now(),
      });

      await updateAccount(user.uid, account.id, {
        balance: account.balance - amount,
      });

      const newTotalPaid = selectedLoan.totalPaid + amount;
      const newRemainingBalance = selectedLoan.principalAmount - newTotalPaid;
      const newStatus = newRemainingBalance <= 0 ? 'paid-off' : 'active';

      let nextPaymentDue = selectedLoan.nextPaymentDue;
      if (selectedLoan.totalMonths > 0 && newStatus === 'active') {
        const currentDue = new Date(selectedLoan.nextPaymentDue || selectedLoan.startDate);
        nextPaymentDue = new Date(
          currentDue.getFullYear(),
          currentDue.getMonth() + 1,
          currentDue.getDate()
        ).toISOString().split('T')[0];
      }

      await updateDoc(doc(db, 'users', user.uid, 'loans', selectedLoan.id), {
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance > 0 ? newRemainingBalance : 0,
        status: newStatus,
        lastPaymentDate: paymentFormData.paymentDate,
        nextPaymentDue: newStatus === 'active' ? nextPaymentDue : null,
        updatedAt: Timestamp.now(),
      });

      const progress = ((newTotalPaid / selectedLoan.principalAmount) * 100);
      if (newStatus === 'paid-off') {
        showToast('🎉 Congratulations! Loan fully paid off!', 'success');
      } else if (progress >= 75 && ((selectedLoan.totalPaid / selectedLoan.principalAmount) * 100) < 75) {
        showToast('🎊 75% paid! Great progress!', 'success');
      } else if (progress >= 50 && ((selectedLoan.totalPaid / selectedLoan.principalAmount) * 100) < 50) {
        showToast('🌟 Halfway there! Keep it up!', 'success');
      } else if (progress >= 25 && ((selectedLoan.totalPaid / selectedLoan.principalAccount) * 100) < 25) {
        showToast('✨ 25% complete!', 'success');
      } else {
        showToast('Payment recorded successfully', 'success');
      }

      await loadData();
      closePaymentModal();
    } catch (error) {
      console.error('Error processing payment:', error);
      showToast('Error processing payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const ensureLoanPaymentCategory = async () => {
    try {
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      const q = query(categoriesRef, where('name', '==', 'Loan Payment'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }

      const newCategory = await addDoc(categoriesRef, {
        name: 'Loan Payment',
        type: 'Expense',
        color: '#F59E0B',
        createdAt: Timestamp.now(),
      });

      return { id: newCategory.id, name: 'Loan Payment', type: 'Expense', color: '#F59E0B' };
    } catch (error) {
      console.error('Error ensuring category:', error);
      throw error;
    }
  };

  const handleDeleteLoan = async () => {
    if (!loanToDelete) return;

    try {
      const paymentsRef = collection(db, 'users', user.uid, 'loanPayments');
      const q = query(paymentsRef, where('loanId', '==', loanToDelete.id));
      const paymentsSnapshot = await getDocs(q);

      if (!paymentsSnapshot.empty) {
        return showToast('Cannot delete loan with payment history', 'error');
      }

      await deleteDoc(doc(db, 'users', user.uid, 'loans', loanToDelete.id));
      showToast('Loan deleted successfully', 'success');
      await loadLoans();
    } catch (error) {
      console.error('Error deleting loan:', error);
      showToast('Error deleting loan', 'error');
    } finally {
      setShowDeleteModal(false);
      setLoanToDelete(null);
    }
  };

  const toggleReminders = async (loan) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'loans', loan.id), {
        enableReminders: !loan.enableReminders,
        updatedAt: Timestamp.now(),
      });
      showToast(
        loan.enableReminders ? 'Reminders disabled' : 'Reminders enabled',
        'success'
      );
      await loadLoans();
    } catch (error) {
      console.error('Error toggling reminders:', error);
      showToast('Error updating reminders', 'error');
    }
  };

  const handleEditLoan = (loan) => {
    setEditingLoan(loan);
    setLoanFormData({
      lenderName: loan.lenderName,
      loanType: loan.loanType,
      principalAmount: loan.principalAmount.toString(),
      interestRate: loan.interestRate.toString(),
      monthlyPayment: loan.monthlyPayment?.toString() || '',
      totalMonths: loan.totalMonths?.toString() || '',
      startDate: loan.startDate,
      accountId: loan.accountId || accounts[0]?.id || '',
      notes: loan.notes || '',
      enableReminders: loan.enableReminders !== false,
    });
    setShowLoanModal(true);
  };

  const handleMakePayment = (loan) => {
    setSelectedLoan(loan);
    setPaymentFormData({
      amount: loan.monthlyPayment?.toString() || '',
      accountId: loan.accountId || accounts[0]?.id || '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const closeLoanModal = () => {
    setShowLoanModal(false);
    setEditingLoan(null);
    setLoanFormData({
      lenderName: '',
      loanType: 'qard-hasan',
      principalAmount: '',
      interestRate: '0',
      monthlyPayment: '',
      totalMonths: '',
      startDate: new Date().toISOString().split('T')[0],
      accountId: accounts[0]?.id || '',
      notes: '',
      enableReminders: true,
    });
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedLoan(null);
    setPaymentFormData({
      amount: '',
      accountId: accounts[0]?.id || '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || 'Unknown';

  const calculations = calculateLoanDetails(loanFormData);

  const filteredLoans = loans.filter((loan) => {
    if (filterStatus !== 'all' && loan.status !== filterStatus) return false;
    if (filterType !== 'all' && loan.loanType !== filterType) return false;
    return true;
  });

  const activeLoans = loans.filter((l) => l.status === 'active');
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
  const totalMonthlyPayment = activeLoans.reduce((sum, l) => sum + (l.monthlyPayment || 0), 0);

  const upcomingPayments = activeLoans
    .filter((l) => l.nextPaymentDue)
    .map((l) => ({
      ...l,
      daysUntilDue: getDaysUntilDue(l.nextPaymentDue),
    }))
    .filter((l) => l.daysUntilDue !== null && l.daysUntilDue <= 7)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="text-sm text-gray-500 mt-1">Track your debts and repayments</p>
        </div>
        <button
          onClick={() => setShowLoanModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
        >
          <Plus size={16} />
          Add Loan
        </button>
      </div>

      {/* Upcoming Payments Alert */}
      {upcomingPayments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">Upcoming Payments</h3>
              <div className="space-y-2">
                {upcomingPayments.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between text-sm">
                    <span className="text-amber-800">
                      {loan.lenderName} - ৳{loan.monthlyPayment?.toLocaleString() || 'N/A'}
                    </span>
                    <span className={`font-medium ${
                      loan.daysUntilDue === 0 ? 'text-red-600' :
                      loan.daysUntilDue <= 3 ? 'text-amber-600' :
                      'text-amber-800'
                    }`}>
                      {loan.daysUntilDue === 0 ? 'Due today!' :
                       loan.daysUntilDue === 1 ? 'Due tomorrow' :
                       `Due in ${loan.daysUntilDue} days`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Active Loans</p>
            <DollarSign size={14} className="text-gray-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{activeLoans.length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Debt</p>
            <TrendingDown size={14} className="text-red-500" />
          </div>
          <p className="text-xl font-bold text-red-600">৳{totalDebt.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Monthly Payment</p>
            <Calendar size={14} className="text-blue-500" />
          </div>
          <p className="text-xl font-bold text-blue-600">৳{totalMonthlyPayment.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <div className="flex gap-1">
              {['all', 'active', 'paid-off'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex-1 py-1.5 text-xs rounded transition ${
                    filterStatus === status
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Paid Off'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-1">
              {['all', 'qard-hasan', 'interest'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 py-1.5 text-xs rounded transition ${
                    filterType === type
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'qard-hasan' ? 'Qard Hasan' : 'Interest'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loans List */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
          <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No loans found</p>
          <p className="text-sm mt-1">Add your first loan to start tracking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLoans.map((loan) => {
            const progress = ((loan.totalPaid / loan.principalAmount) * 100).toFixed(0);
            const isQardHasan = loan.loanType === 'qard-hasan';
            const daysUntilDue = getDaysUntilDue(loan.nextPaymentDue);

            return (
              <div
                key={loan.id}
                className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                  isQardHasan ? 'border-green-500' : 'border-amber-500'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isQardHasan ? (
                        <HandCoins size={18} className="text-green-600" />
                      ) : (
                        <Building2 size={18} className="text-amber-600" />
                      )}
                      <h3 className="text-base font-bold text-gray-900">{loan.lenderName}</h3>
                      {loan.status === 'paid-off' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Paid Off
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {isQardHasan ? 'Qard Hasan (Interest-free)' : `Interest: ${loan.interestRate}% annually`}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    {loan.status === 'active' && (
                      <>
                        <button
                          onClick={() => toggleReminders(loan)}
                          className={`p-1.5 rounded ${
                            loan.enableReminders !== false
                              ? 'hover:bg-blue-50 text-blue-600'
                              : 'hover:bg-gray-50 text-gray-400'
                          }`}
                          title={loan.enableReminders !== false ? 'Disable reminders' : 'Enable reminders'}
                        >
                          {loan.enableReminders !== false ? <Bell size={16} /> : <BellOff size={16} />}
                        </button>
                        <button
                          onClick={() => handleMakePayment(loan)}
                          className="p-1.5 hover:bg-green-50 rounded text-green-600"
                          title="Make Payment"
                        >
                          <Banknote size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title="View Details"
                    >
                      <Eye size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleEditLoan(loan)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit2 size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => {
                        setLoanToDelete(loan);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isQardHasan ? 'bg-green-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Principal</p>
                    <p className="font-semibold text-gray-900">৳{loan.principalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="font-semibold text-green-600">৳{loan.totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="font-semibold text-red-600">৳{loan.remainingBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly</p>
                    <p className="font-semibold text-blue-600">
                      ৳{loan.monthlyPayment ? loan.monthlyPayment.toLocaleString() : 'Flexible'}
                    </p>
                  </div>
                </div>

                {loan.nextPaymentDue && loan.status === 'active' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock size={12} />
                      Next payment: <span className="font-medium text-gray-900">{formatDate(loan.nextPaymentDue)}</span>
                    </p>
                    {daysUntilDue !== null && daysUntilDue <= 7 && (
                      <span className={`text-xs font-medium ${
                        daysUntilDue === 0 ? 'text-red-600' :
                        daysUntilDue <= 3 ? 'text-amber-600' :
                        'text-blue-600'
                      }`}>
                        {daysUntilDue === 0 ? 'Due today!' :
                         daysUntilDue === 1 ? 'Due tomorrow' :
                         `${daysUntilDue} days left`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Loan Modal - FULLY RESPONSIVE WITH SCROLLING */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl">
            {/* Fixed Header */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 rounded-t-lg flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900">
                  {editingLoan ? 'Edit Loan' : 'New Loan'}
                </h2>
                <button onClick={closeLoanModal} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              <form onSubmit={handleLoanSubmit} className="space-y-3">
                {/* Loan Type */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoanFormData((p) => ({ ...p, loanType: 'qard-hasan', interestRate: '0' }))}
                    className={`p-2 rounded-lg border-2 transition ${
                      loanFormData.loanType === 'qard-hasan'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <HandCoins size={16} className={`mx-auto mb-1 ${loanFormData.loanType === 'qard-hasan' ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-xs font-medium">Qard Hasan</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanFormData((p) => ({ ...p, loanType: 'interest', interestRate: '' }))}
                    className={`p-2 rounded-lg border-2 transition ${
                      loanFormData.loanType === 'interest'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 size={16} className={`mx-auto mb-1 ${loanFormData.loanType === 'interest' ? 'text-amber-600' : 'text-gray-400'}`} />
                    <p className="text-xs font-medium">Interest-based</p>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Row 1 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lender Name *</label>
                    <input
                      type="text"
                      value={loanFormData.lenderName}
                      onChange={(e) => setLoanFormData((p) => ({ ...p, lenderName: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      placeholder="Bank XYZ"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Principal Amount (৳) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={loanFormData.principalAmount}
                      onChange={(e) => setLoanFormData((p) => ({ ...p, principalAmount: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      placeholder="50000"
                      required
                      disabled={submitting}
                    />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Interest Rate (%) {loanFormData.loanType === 'interest' && '*'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={loanFormData.interestRate}
                      onChange={(e) => setLoanFormData((p) => ({ ...p, interestRate: e.target.value }))}
                      className={`w-full px-2 py-1.5 border rounded text-sm transition ${
                        loanFormData.loanType === 'qard-hasan'
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="12.5"
                      required={loanFormData.loanType === 'interest'}
                      disabled={submitting || loanFormData.loanType === 'qard-hasan'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={loanFormData.startDate}
                      onChange={(e) => setLoanFormData((p) => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      required
                      disabled={submitting}
                    />
                  </div>

                  {/* Row 3 - Monthly Payment OR Duration */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Monthly Payment (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={loanFormData.monthlyPayment}
                      onChange={(e) => setLoanFormData((p) => ({ ...p, monthlyPayment: e.target.value, totalMonths: '' }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      placeholder="Auto-calculated"
                      disabled={submitting || loanFormData.totalMonths}
                    />
                    {calculations.monthlyPayment > 0 && !loanFormData.monthlyPayment && (
                      <p className="text-xs text-green-600 mt-0.5">Auto: ৳{calculations.monthlyPayment.toFixed(2)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Duration (months)
                    </label>
                    <input
                      type="number"
                      value={loanFormData.totalMonths}
                      onChange={(e) => setLoanFormData((p) => ({ ...p, totalMonths: e.target.value, monthlyPayment: '' }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      placeholder="24"
                      disabled={submitting || loanFormData.monthlyPayment}
                    />
                    {calculations.totalMonths > 0 && !loanFormData.totalMonths && (
                      <p className="text-xs text-green-600 mt-0.5">Auto: {calculations.totalMonths} months</p>
                    )}
                  </div>

                  {/* Row 4 */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pay from Account</label>
                    <select
                      value={loanFormData.accountId}
                      onChange={(e) => setLoanFormData((p) => ({ ...p, accountId: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      disabled={submitting}
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (৳{a.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reminder & Notes */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="enableReminders"
                    checked={loanFormData.enableReminders}
                    onChange={(e) => setLoanFormData((p) => ({ ...p, enableReminders: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="enableReminders" className="text-xs text-gray-700">
                    Enable payment reminders
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={loanFormData.notes}
                    onChange={(e) => setLoanFormData((p) => ({ ...p, notes: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    rows="2"
                    placeholder="Additional details..."
                    disabled={submitting}
                  />
                </div>

                {/* Calculation Summary */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-gray-700 mb-1">Summary</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Monthly</p>
                      <p className="font-semibold text-gray-900">৳{calculations.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Interest</p>
                      <p className="font-semibold text-amber-600">৳{calculations.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-semibold text-gray-900">৳{calculations.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeLoanModal}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingLoan ? 'Update Loan' : 'Create Loan'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Make Loan Payment</h2>
              <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{selectedLoan.lenderName}</p>
              <p className="text-xs text-gray-600">
                Remaining: ৳{selectedLoan.remainingBalance.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Amount (৳) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder={selectedLoan.monthlyPayment?.toString() || '5000'}
                  required
                  disabled={submitting}
                />
                {paymentFormData.amount && (
                  <p className="text-xs text-gray-600 mt-1">
                    After payment: ৳{(selectedLoan.remainingBalance - parseFloat(paymentFormData.amount || 0)).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Pay from Account *
                </label>
                <select
                  value={paymentFormData.accountId}
                  onChange={(e) => setPaymentFormData((p) => ({ ...p, accountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
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
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Monthly installment..."
                  disabled={submitting}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>This will create an expense transaction and reduce your account balance</span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Pay Now</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <AlertTriangle size={36} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Delete this loan?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. Loans with payment history cannot be deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLoan}
                  className="flex-1 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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
