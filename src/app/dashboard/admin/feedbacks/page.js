// src/app/dashboard/admin/feedbacks/page.js
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      const snap = await getDocs(collection(db, 'feedbacks'));
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchFeedbacks();
  }, []);

  const toggleApprove = async (id, approved) => {
    await updateDoc(doc(db, 'feedbacks', id), { approved: !approved });
    setFeedbacks(f =>
      f.map(x => x.id === id ? { ...x, approved: !approved } : x)
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">User Feedbacks</h1>

      <div className="space-y-3">
        {feedbacks.map(f => (
          <div key={f.id} className="border rounded p-4">
            <p className="font-medium">{f.name}</p>
            <p className="text-sm text-gray-600">{f.message}</p>

            <div className="mt-2 flex gap-3">
              <button
                onClick={() => toggleApprove(f.id, f.approved)}
                className="text-sm text-blue-600"
              >
                {f.approved ? 'Unapprove' : 'Approve'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
