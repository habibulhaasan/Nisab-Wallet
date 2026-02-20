// src/app/dashboard/tax/setup/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TaxMappingWizard from '@/components/TaxMappingWizard';

export default function TaxSetupPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [userCategories, setUserCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      const ref = collection(db, 'users', user.uid, 'categories');
      const snap = await getDocs(ref);
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUserCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard/tax');
  };

  const handleClose = () => {
    router.push('/dashboard/tax');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <TaxMappingWizard
      isOpen={true}
      onClose={handleClose}
      onComplete={handleComplete}
      userCategories={userCategories}
      userId={user.uid}
    />
  );
}