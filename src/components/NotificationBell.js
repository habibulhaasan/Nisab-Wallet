// src/components/NotificationBell.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', notificationId), {
        read: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.read)
        .forEach((n) => {
          const notifRef = doc(db, 'users', user.uid, 'notifications', n.id);
          batch.update(notifRef, { read: true });
        });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        const notifRef = doc(db, 'users', user.uid, 'notifications', n.id);
        batch.delete(notifRef);
      });
      await batch.commit();
      setShowDropdown(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type, isAdmin) => {
    if (isAdmin) {
      if (type?.includes('feedback'))                                       return '💬';
      if (type?.includes('purchase') || type?.includes('pending'))         return '💳';
      if (type?.includes('approved'))                                       return '✅';
      if (type?.includes('rejected'))                                       return '❌';
      if (type?.includes('trial'))                                          return '⏰';
      if (type?.includes('expired'))                                        return '📅';
      if (type?.includes('blocked'))                                        return '🚫';
      if (type?.includes('unblocked'))                                      return '🔓';
      if (type?.includes('free') || type?.includes('registered'))          return '🎁';
      return '🔔';
    }
    switch (type) {
      case 'zakat_due':          return '🕌';
      case 'zakat_approaching':  return '⏰';
      case 'payment_reminder':   return '💰';
      case 'low_balance':        return '⚠️';
      default:                   return '📢';
    }
  };

  const getAdminLink = (type) => {
    if (type?.includes('feedback'))                              return '/dashboard/admin/feedbacks';
    if (type?.includes('purchase') || type?.includes('pending') || type?.includes('approved') || type?.includes('rejected')) return '/dashboard/admin/users';
    return '/dashboard/admin';
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel - IMPROVED POSITIONING */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="fixed right-4 lg:right-auto lg:left-auto mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col"
          style={{
            top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : '60px',
            left: window.innerWidth >= 1024 && buttonRef.current 
              ? buttonRef.current.getBoundingClientRect().left 
              : 'auto',
            zIndex: 999999,
            position: 'fixed'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                  {unreadCount}
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

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={12} />
                Clear all
              </button>
            </div>
          )}

          {/* Notifications List - SCROLLABLE */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Bell size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No notifications</p>
                <p className="text-xs text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      if (notification.isAdmin) {
                        window.location.href = getAdminLink(notification.type);
                      }
                    }}
                    className={`px-4 py-3 transition-colors ${notification.isAdmin ? 'cursor-pointer' : ''} ${
                      !notification.read
                        ? notification.isAdmin ? 'bg-blue-50 hover:bg-blue-100' : 'bg-blue-50/50 hover:bg-gray-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 text-xl mt-0.5">
                        {getNotificationIcon(notification.type, notification.isAdmin)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          {notification.isAdmin && (
                            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full uppercase tracking-wide flex-shrink-0">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} className="text-blue-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}