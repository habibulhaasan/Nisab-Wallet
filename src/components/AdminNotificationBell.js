// src/components/AdminNotificationBell.js
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, writeBatch, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const CATEGORY_LINKS = {
  feedback:     '/dashboard/admin/feedbacks',
  subscription: '/dashboard/admin/users',
  user:         '/dashboard/admin/users',
  system:       '/dashboard/admin',
};

const formatTimestamp = (ts) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const priorityDot = (priority) => {
  if (priority === 'high')   return 'bg-red-500';
  if (priority === 'medium') return 'bg-yellow-500';
  return 'bg-gray-400';
};

export default function AdminNotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [dropdownPos, setDropdownPos]     = useState({ top: 0, left: 0 });
  const [mounted, setMounted]             = useState(false);
  const buttonRef   = useRef(null);
  const dropdownRef = useRef(null);

  // Wait for client mount before using portals
  useEffect(() => { setMounted(true); }, []);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, 'adminNotifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err)  => console.error('[AdminBell] onSnapshot error:', err.code, err.message)
    );
    return () => unsub();
  }, []);

  // Calculate dropdown position from bell button's screen coords
  const openDropdown = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const DROPDOWN_WIDTH = 384; // w-96
    const viewportWidth  = window.innerWidth;

    // Place below the button; align left edge with button,
    // but clamp so it never overflows the right edge of viewport
    let left = rect.left;
    if (left + DROPDOWN_WIDTH > viewportWidth - 16) {
      left = viewportWidth - DROPDOWN_WIDTH - 16;
    }

    setDropdownPos({ top: rect.bottom + 8, left: Math.max(8, left) });
    setShowDropdown(true);
  }, []);

  // Close on outside click only
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        buttonRef.current   && !buttonRef.current.contains(e.target)
      ) setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id) => {
    try { await updateDoc(doc(db, 'adminNotifications', id), { read: true }); }
    catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n =>
        batch.update(doc(db, 'adminNotifications', n.id), { read: true })
      );
      await batch.commit();
    } catch (e) { console.error(e); }
  };

  const deleteOne = async (id) => {
    try { await deleteDoc(doc(db, 'adminNotifications', id)); }
    catch (e) { console.error(e); }
  };

  const clearAll = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => batch.delete(doc(db, 'adminNotifications', n.id)));
      await batch.commit();
      setShowDropdown(false);
    } catch (e) { console.error(e); }
  };

  const handleClick = (notif) => {
    if (!notif.read) markRead(notif.id);
    router.push(CATEGORY_LINKS[notif.category] || '/dashboard/admin');
    setShowDropdown(false);
  };

  // ── Dropdown content (rendered via portal) ──────────────────────────────────
  const dropdown = (
    <div
      ref={dropdownRef}
      style={{
        position:  'fixed',
        top:       dropdownPos.top,
        left:      dropdownPos.left,
        width:     '384px',
        maxWidth:  'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 120px)',
        zIndex:    99999,
      }}
      className="bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Admin Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={() => setShowDropdown(false)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Bulk actions */}
      {notifications.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50 flex-shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Check size={12} /> Mark all read
            </button>
          )}
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={12} /> Clear all
          </button>
        </div>
      )}

      {/* Notification list */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Bell size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  !n.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Priority dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    <span className={`block w-2 h-2 rounded-full ${priorityDot(n.priority)}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-400">{formatTimestamp(n.createdAt)}</span>
                      {n.category && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">
                          {n.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row actions */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    {!n.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        className="p-1 hover:bg-blue-200 rounded transition-colors"
                        title="Mark as read"
                      >
                        <Check size={13} className="text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => showDropdown ? setShowDropdown(false) : openDropdown()}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Admin Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Portal: renders outside sidebar so nothing clips/overlaps it */}
      {mounted && showDropdown && createPortal(dropdown, document.body)}
    </div>
  );
}