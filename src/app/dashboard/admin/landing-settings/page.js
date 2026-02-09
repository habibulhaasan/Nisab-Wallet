// src/app/dashboard/admin/landing-settings/page.js
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LandingSettings() {
  const [settings, setSettings] = useState({ showStats: true, showFeedbacks: true });

  useEffect(() => {
    getDoc(doc(db, 'landing_settings', 'main')).then(snap => {
      if (snap.exists()) setSettings(snap.data());
    });
  }, []);

  const toggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await updateDoc(doc(db, 'landing_settings', 'main'), updated);
  };

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold mb-4">Landing Page Controls</h1>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={settings.showStats} onChange={() => toggle('showStats')} />
        Show Statistics Section
      </label>

      <label className="flex items-center gap-2 mt-3">
        <input type="checkbox" checked={settings.showFeedbacks} onChange={() => toggle('showFeedbacks')} />
        Show Feedback Section
      </label>
    </div>
  );
}
