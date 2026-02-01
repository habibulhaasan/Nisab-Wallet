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
  Download,
  HandCoins,
  Building2,
  Percent,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function LoanDetailsPage({ params }) {
  const { user, loading: authLoading } = useAuth(); // ← assumes your AuthContext exposes 'loading'
  const router = useRouter();

  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [pageReady, setPageReady] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Step 1: Wait for auth + params
  useEffect(() => {
    console.log('Render check →', {
      authLoading,
      userExists: !!user,
      userUid: user?.uid || '—',
      paramsId: params?.id || 'MISSING',
    });

    if (authLoading) return; // wait for Firebase auth check

    if (!user) {
      console.log('No user → redirect to login/home');
      router.replace('/'); // or '/login' — adjust as needed
      return;
    }

    if (!params?.id) {
      console.log('No loan ID in URL → redirecting');
      router.replace('/dashboard/loans');
      return;
    }

    setPageReady(true);
  }, [authLoading, user, params?.id, router]);

  // Step 2: Only fetch when page is truly ready
  useEffect(() => {
    if (!pageReady || !user || !params?.id) return;

    const loadLoanDetails = async () => {
      console.log(`→ Fetching loan ID: ${params.id} for user ${user.uid}`);

      try {
        // Loan document
        const loanRef = doc(db, 'users', user.uid, 'loans', params.id);
        const loanSnap = await getDoc(loanRef);

        if (!loanSnap.exists()) {
          console.warn('Loan document missing');
          showToast('Loan not found', 'error');
          router.replace('/dashboard/loans');
          return;
        }

        const raw = loanSnap.data();
        console.log('Loan raw data:', raw);

        setLoan({
          id: loanSnap.id,
          ...raw,
          remainingBalance: raw.remainingBalance ?? raw.principalAmount - (raw.totalPaid ?? 0),
          totalPaid: raw.totalPaid ?? 0,
          // Add more fallbacks if needed
        });

        // Payments
        const paymentsQ = query(
          collection(db, 'users', user.uid, 'loanPayments'),
          where('loanId', '==', params.id),
          orderBy('paymentDate', 'desc')
        );
        const paymentsSnap = await getDocs(paymentsQ);
        setPayments(
          paymentsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            paymentDate: d.data().paymentDate?.toDate?.() ?? d.data().paymentDate,
          }))
        );

        // Accounts (for names)
        const accRes = await getAccounts(user.uid);
        if (accRes.success) setAccounts(accRes.accounts);
      } catch (err) {
        console.error('Details fetch failed:', err);
        setFetchError('Could not load loan details. Please try again.');
        showToast('Load error', 'error');
      }
    };

    loadLoanDetails();
  }, [pageReady, user, params?.id, router]);

  // ────────────────────────────────────────────────
  // Rendering logic
  if (authLoading || !pageReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
        <p className="ml-4 text-gray-600">Preparing page...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="text-red-600 mb-4">× {fetchError}</div>
        <button
          onClick={() => router.push('/dashboard/loans')}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
        >
          Back to Loans
        </button>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-xl text-gray-700">Loading loan details...</p>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // Normal content (your existing UI)
  const isQardHasan = loan.loanType === 'qard-hasan';
  const progress = ((loan.totalPaid / loan.principalAmount) * 100).toFixed(1);

  const formatDate = (val) => {
    if (!val) return '—';
    const d = val?.toDate ? val.toDate() : new Date(val);
    return isNaN(d) ? '—' : d.toLocaleDateString('en-GB');
  };

  const getAccountName = (id) => accounts.find(a => a.id === id)?.name || '—';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Debug raw data – keep for now, remove later */}
      <div className="bg-gray-50 p-4 rounded border text-xs font-mono overflow-auto max-h-48">
        <strong>Debug – Loan data:</strong><br />
        <pre>{JSON.stringify(loan, null, 2)}</pre>
      </div>

      {/* Your existing header, progress, summary cards, details, payment history... */}
      {/* Paste the rest of your UI code here (from previous versions) */}
      {/* For example: */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/dashboard/loans')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back to Loans
        </button>
        {/* Edit button etc. */}
      </div>

      {/* ... rest of your UI ... */}

      {/* Example placeholder – replace with your full content */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold">{loan.lenderName}</h2>
        <p>Remaining: ৳{(loan.remainingBalance || 0).toLocaleString()}</p>
        <p>Progress: {progress}%</p>
      </div>
    </div>
  );
}