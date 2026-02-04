// src/app/dashboard/admin/users/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getAllUsers, 
  checkIsAdmin,
  approveSubscription,
  rejectSubscription,
  toggleBlockUser,
  grantFreeLifetimeAccess,
  addAdminNote
} from '@/lib/adminUtils';
import { getCurrentSubscription, getUserSubscriptionHistory } from '@/lib/subscriptionUtils';
import { 
  Users, Search, Filter, CheckCircle, XCircle, Lock, Unlock, 
  Clock, Star, Eye, MoreVertical, Gift, Mail, Phone, Hash, MessageSquare,
  AlertCircle, Calendar, ChevronDown, ChevronUp, CreditCard
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ToastContainer } from '@/components/ToastNotification';
import { useToast } from '@/hooks/useToast';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [inputValue, setInputValue] = useState('');
  const [freeAccessDays, setFreeAccessDays] = useState('');
  const [userNote, setUserNote] = useState('');
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const { toasts, addToast, removeToast } = useToast();

  // Format date as dd/mm/yyyy
  const formatDate = (date) => {
    if (!date) return 'Never';
    const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date and time
  const formatDateTime = (date) => {
    if (!date) return 'Never';
    const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Calculate final end date including all pending extensions
  const calculateFinalEndDate = (userId, currentEndDate, subscriptions) => {
    if (!subscriptions || subscriptions.length === 0) return currentEndDate;
    
    const pendingExtensions = subscriptions.filter(
      sub => sub.status === 'pending_approval' && sub.isExtension === true
    );

    if (pendingExtensions.length === 0) return currentEndDate;

    let totalExtensionDays = 0;
    pendingExtensions.forEach(ext => {
      totalExtensionDays += parseInt(ext.durationDays || 0);
    });

    const baseDate = new Date(currentEndDate);
    const finalDate = new Date(baseDate);
    finalDate.setDate(finalDate.getDate() + totalExtensionDays);

    return finalDate.toISOString().split('T')[0];
  };

  // Check if user has pending extensions
  const hasPendingExtensions = (subscriptions) => {
    if (!subscriptions || subscriptions.length === 0) return false;
    return subscriptions.some(
      sub => sub.status === 'pending_approval' && sub.isExtension === true
    );
  };

  useEffect(() => {
    if (user) {
      checkAdminAndLoad();
    }
  }, [user]);

  useEffect(() => {
    filterAndSearchUsers();
  }, [searchTerm, filterStatus, users]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionMenu) {
        setShowActionMenu(null);
      }
    };

    if (showActionMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showActionMenu]);

  const handleConfirm = async () => {
    const { actionType, userId, userName } = confirmDialog;

    if (actionType === 'grantFree') {
      const trimmedInput = (inputValue || '').trim();
      
      if (!trimmedInput) {
        addToast('Please enter a reason', 'error');
        return;
      }
      
      const days = freeAccessDays ? parseInt(freeAccessDays) : null;
      
      if (freeAccessDays && (!days || days <= 0)) {
        addToast('Please enter a valid number of days', 'error');
        return;
      }
      
      const result = await grantFreeLifetimeAccess(userId, user.uid, trimmedInput, days);
      
      setConfirmDialog({ isOpen: false });
      setInputValue('');
      setFreeAccessDays('');
      
      if (result.success) {
        const accessType = days ? `${days} days free access` : 'lifetime free access';
        addToast(`Successfully granted ${accessType}`, 'success');
        loadUsers();
      } else {
        addToast('Error: ' + result.error, 'error');
      }
      setShowActionMenu(null);
    } else if (actionType === 'addNote') {
      const trimmedNote = (userNote || '').trim();
      
      if (!trimmedNote) {
        addToast('Please enter a note', 'error');
        return;
      }
      
      const result = await addAdminNote(userId, {
        note: trimmedNote,
        adminId: user.uid,
        adminName: user.displayName || user.email
      });
      
      setConfirmDialog({ isOpen: false });
      setUserNote('');
      
      if (result.success) {
        addToast('Note saved successfully', 'success');
        loadUsers();
      } else {
        addToast('Error: ' + result.error, 'error');
      }
      setShowActionMenu(null);
    } else if (confirmDialog.onConfirm) {
      await confirmDialog.onConfirm();
    }
  };

  const checkAdminAndLoad = async () => {
    const adminStatus = await checkIsAdmin(user.uid);
    if (!adminStatus) {
      router.push('/dashboard');
      return;
    }
    setIsAdmin(true);
    loadUsers();
  };

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      const usersWithData = await Promise.all(
        result.users.map(async (u) => {
          const subResult = await getCurrentSubscription(u.id);
          const historyResult = await getUserSubscriptionHistory(u.id);
          
          return {
            ...u,
            currentSubscription: subResult.subscription,
            subscriptionHistory: historyResult.success ? historyResult.subscriptions : []
          };
        })
      );
      setUsers(usersWithData);
      setFilteredUsers(usersWithData);
    }
    setLoading(false);
  };

  const filterAndSearchUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.mobile?.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => {
        switch (filterStatus) {
          case 'trial':
            return u.currentSubscription?.status === 'trial';
          case 'active':
            return u.currentSubscription?.status === 'active';
          case 'pending':
            return u.currentSubscription?.status === 'pending_approval';
          case 'expired':
            return u.currentSubscription?.status === 'expired';
          case 'blocked':
            return u.isBlocked === true;
          case 'admin':
            return u.role === 'admin';
          case 'free':
            return u.subscriptionStatus === 'free_lifetime';
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  const toggleUserExpansion = (userId) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const handleApproveFromTable = async (userId, subscriptionId) => {
    if (!confirm('Approve this subscription?')) return;
    
    const result = await approveSubscription(userId, subscriptionId, user.uid);
    if (result.success) {
      addToast('Subscription approved successfully', 'success');
      loadUsers();
    } else {
      addToast('Error: ' + result.error, 'error');
    }
  };

  const handleRejectFromTable = async (userId, subscriptionId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || !reason.trim()) return;
    
    const result = await rejectSubscription(userId, subscriptionId, user.uid, reason);
    if (result.success) {
      addToast('Subscription rejected', 'success');
      loadUsers();
    } else {
      addToast('Error: ' + result.error, 'error');
    }
  };

  const handleApprove = (userId, subscriptionId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve Subscription',
      message: 'Are you sure you want to approve this subscription? The user will get immediate access.',
      type: 'success',
      confirmText: 'Approve',
      onConfirm: async () => {
        const result = await approveSubscription(userId, subscriptionId, user.uid);
        setConfirmDialog({ isOpen: false });
        if (result.success) {
          addToast('Subscription approved successfully', 'success');
          loadUsers();
        } else {
          addToast('Error: ' + result.error, 'error');
        }
        setShowActionMenu(null);
      }
    });
  };

  const handleReject = (userId, subscriptionId) => {
    setInputValue('');
    setConfirmDialog({
      isOpen: true,
      title: 'Reject Subscription',
      message: 'Please provide a reason for rejecting this subscription:',
      type: 'danger',
      confirmText: 'Reject',
      requireInput: true,
      inputPlaceholder: 'Enter rejection reason...',
      onConfirm: async () => {
        if (!inputValue.trim()) return;
        
        const result = await rejectSubscription(userId, subscriptionId, user.uid, inputValue);
        setConfirmDialog({ isOpen: false });
        setInputValue('');
        if (result.success) {
          addToast('Subscription rejected', 'success');
          loadUsers();
        } else {
          addToast('Error: ' + result.error, 'error');
        }
        setShowActionMenu(null);
      }
    });
  };

  const handleBlock = (userId, currentlyBlocked) => {
    if (!currentlyBlocked) {
      setInputValue('');
      setConfirmDialog({
        isOpen: true,
        title: 'Block User',
        message: 'Please provide a reason for blocking this user:',
        type: 'danger',
        confirmText: 'Block User',
        requireInput: true,
        inputPlaceholder: 'Enter block reason...',
        onConfirm: async () => {
          if (!inputValue.trim()) {
            addToast('Please enter a reason', 'error');
            return;
          }
          
          const result = await toggleBlockUser(userId, true, user.uid, inputValue);
          setConfirmDialog({ isOpen: false });
          setInputValue('');
          if (result.success) {
            addToast('User blocked successfully', 'success');
            loadUsers();
          } else {
            addToast('Error: ' + result.error, 'error');
          }
          setShowActionMenu(null);
        }
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: 'Unblock User',
        message: 'Are you sure you want to unblock this user? They will regain access to their account.',
        type: 'success',
        confirmText: 'Unblock',
        onConfirm: async () => {
          const result = await toggleBlockUser(userId, false, user.uid, '');
          setConfirmDialog({ isOpen: false });
          if (result.success) {
            addToast('User unblocked successfully', 'success');
            loadUsers();
          } else {
            addToast('Error: ' + result.error, 'error');
          }
          setShowActionMenu(null);
        }
      });
    }
  };

  const handleGrantFree = (userId) => {
    setInputValue('');
    setFreeAccessDays('');
    setConfirmDialog({
      isOpen: true,
      title: 'Grant Free Access',
      message: 'Choose access type and provide a reason:',
      type: 'success',
      confirmText: 'Grant Access',
      requireInput: true,
      requireDays: true,
      inputPlaceholder: 'Enter reason...',
      userId: userId,
      actionType: 'grantFree'
    });
  };

  const handleAddNote = async (userId, userName) => {
    const existingNotes = users.find(u => u.id === userId)?.adminNotes || [];
    const latestNote = existingNotes.length > 0 ? existingNotes[0].note : '';
    
    setUserNote(latestNote);
    setConfirmDialog({
      isOpen: true,
      title: `${latestNote ? 'Update' : 'Add'} Note for ${userName}`,
      message: latestNote 
        ? 'Edit the existing note or write a new one (visible only to admins):'
        : 'Enter a note about this user (visible only to admins):',
      type: 'info',
      confirmText: latestNote ? 'Update Note' : 'Save Note',
      requireInput: true,
      requireNote: true,
      inputPlaceholder: 'Enter your note...',
      userId: userId,
      userName: userName,
      actionType: 'addNote'
    });
  };

  const getStatusBadge = (u) => {
    const badges = [];
    
    if (u.role === 'admin') {
      badges.push(<span key="admin" className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Admin</span>);
    } else if (u.subscriptionStatus === 'free_lifetime') {
      badges.push(<span key="free" className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Free Access</span>);
    } else if (u.isBlocked) {
      badges.push(<span key="blocked" className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Blocked</span>);
    } else if (!u.currentSubscription) {
      badges.push(<span key="none" className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">No Subscription</span>);
    } else {
      const status = u.currentSubscription.status;
      const colors = {
        trial: 'bg-blue-100 text-blue-800',
        active: 'bg-green-100 text-green-800',
        pending_approval: 'bg-yellow-100 text-yellow-800',
        expired: 'bg-red-100 text-red-800',
        rejected: 'bg-red-100 text-red-800'
      };
      badges.push(
        <span key="status" className={`px-2 py-1 ${colors[status] || 'bg-gray-100 text-gray-800'} text-xs rounded-full capitalize`}>
          {status.replace('_', ' ')}
        </span>
      );
    }
    
    if (hasPendingExtensions(u.subscriptionHistory)) {
      badges.push(
        <span key="extension" className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
          Extension Pending
        </span>
      );
    }
    
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Users className="mr-2" size={28} />
          User Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage users, approve subscriptions, and control access
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Trial Users</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.currentSubscription?.status === 'trial').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">
            {users.filter(u => u.currentSubscription?.status === 'pending_approval').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.currentSubscription?.status === 'active').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Blocked</p>
          <p className="text-2xl font-bold text-red-600">
            {users.filter(u => u.isBlocked).length}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or mobile..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Users</option>
              <option value="pending">Pending Approval</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="blocked">Blocked</option>
              <option value="admin">Admins</option>
              <option value="free">Free Access</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status & Last Login</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes & Reasons</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <>
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Mail size={12} />
                          <span>{u.email}</span>
                        </div>
                        {u.mobile && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Phone size={12} />
                            <span>{u.mobile}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400 font-mono mt-0.5">
                          <Hash size={12} />
                          <span>{u.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        {getStatusBadge(u)}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} />
                          <span>{formatDateTime(u.lastLoginAt)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {u.currentSubscription ? (
                        <div>
                          <p className="text-gray-900">{u.currentSubscription.planName}</p>
                          <p className="text-xs text-gray-500">
                            Until {formatDate(
                              hasPendingExtensions(u.subscriptionHistory)
                                ? calculateFinalEndDate(u.id, u.currentSubscription.endDate, u.subscriptionHistory)
                                : u.currentSubscription.endDate
                            )}
                          </p>
                          {u.subscriptionHistory && u.subscriptionHistory.length > 0 && (
                            <button
                              onClick={() => toggleUserExpansion(u.id)}
                              className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <CreditCard size={12} />
                              {u.subscriptionHistory.filter(s => s.amount > 0 || s.status === 'trial').length} subscriptions
                              {expandedUsers.has(u.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs space-y-2 max-w-xs">
                        {u.adminNotes && u.adminNotes.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <div className="flex items-start gap-1">
                              <MessageSquare size={12} className="text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-blue-900">Latest Note:</p>
                                <p className="text-blue-700 mt-1">{u.adminNotes[0].note}</p>
                                <p className="text-blue-600 mt-1 text-[10px]">
                                  by {u.adminNotes[0].createdByName} - {formatDateTime(u.adminNotes[0].createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {u.isBlocked && u.blockReason && (
                          <div className="bg-red-50 border border-red-200 rounded p-2">
                            <div className="flex items-start gap-1">
                              <AlertCircle size={12} className="text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-red-900">Blocked:</p>
                                <p className="text-red-700 mt-1">{u.blockReason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {(u.subscriptionStatus === 'free_lifetime' || u.grantReason) && u.grantReason && (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <div className="flex items-start gap-1">
                              <Gift size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-green-900">Free Access:</p>
                                <p className="text-green-700 mt-1">{u.grantReason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!u.adminNotes?.length && !u.blockReason && !u.grantReason && (
                          <span className="text-gray-400">No notes</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActionMenu(showActionMenu === u.id ? null : u.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical size={18} className="text-gray-600" />
                        </button>

                        {showActionMenu === u.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                              <button
                                onClick={() => router.push(`/dashboard/admin/user/${u.id}`)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <Eye size={16} className="mr-2" />
                                View Details
                              </button>

                              <button
                                onClick={() => handleAddNote(u.id, u.name)}
                                className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center"
                              >
                                <MessageSquare size={16} className="mr-2" />
                                Add Note
                              </button>

                              {u.currentSubscription?.status === 'pending_approval' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(u.id, u.currentSubscription.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center"
                                  >
                                    <CheckCircle size={16} className="mr-2" />
                                    Approve Subscription
                                  </button>
                                  <button
                                    onClick={() => handleReject(u.id, u.currentSubscription.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                                  >
                                    <XCircle size={16} className="mr-2" />
                                    Reject Subscription
                                  </button>
                                </>
                              )}

                              {u.role !== 'admin' && (
                                <>
                                  <button
                                    onClick={() => handleBlock(u.id, u.isBlocked)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                                      u.isBlocked ? 'text-green-700' : 'text-red-700'
                                    }`}
                                  >
                                    {u.isBlocked ? <Unlock size={16} className="mr-2" /> : <Lock size={16} className="mr-2" />}
                                    {u.isBlocked ? 'Unblock User' : 'Block User'}
                                  </button>

                                  {u.subscriptionStatus !== 'free_lifetime' && (
                                    <button
                                      onClick={() => handleGrantFree(u.id)}
                                      className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 flex items-center"
                                    >
                                      <Gift size={16} className="mr-2" />
                                      Grant Free Access
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Accordion row for subscription history */}
                  {expandedUsers.has(u.id) && u.subscriptionHistory && (
                    <tr key={`${u.id}-accordion`}>
                      <td colSpan="5" className="px-4 py-0 bg-gray-50">
                        <div className="py-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Subscription History
                          </h4>
                          <div className="space-y-2">
                            {u.subscriptionHistory
                              .filter(sub => sub.amount > 0 || sub.status === 'trial')
                              .sort((a, b) => {
                                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                                return dateB - dateA;
                              })
                              .map((sub, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white border border-gray-200 rounded-lg p-3"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-gray-900">
                                          {sub.planName}
                                        </span>
                                        {sub.isExtension && (
                                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                                            Extension
                                          </span>
                                        )}
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                          sub.status === 'active' ? 'bg-green-100 text-green-800' :
                                          sub.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                          sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          sub.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {sub.status === 'active' ? 'Active' :
                                           sub.status === 'pending_approval' ? 'Pending' :
                                           sub.status === 'rejected' ? 'Rejected' :
                                           sub.status === 'trial' ? 'Trial' :
                                           sub.status}
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                        <div>
                                          <span className="text-gray-500">Amount:</span>
                                          <span className="ml-1 font-semibold">৳{sub.amount || 0}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Payment:</span>
                                          <span className="ml-1">{sub.paymentMethod || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Transaction ID:</span>
                                          <span className="ml-1 font-mono">{sub.transactionId || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Duration:</span>
                                          <span className="ml-1">{sub.durationDays || 0} days</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Start:</span>
                                          <span className="ml-1">{formatDate(sub.startDate)}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">End:</span>
                                          <span className="ml-1">{formatDate(sub.endDate)}</span>
                                        </div>
                                      </div>

                                      {sub.rejectionReason && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                          <span className="font-medium text-red-900">Rejection Reason: </span>
                                          <span className="text-red-700">{sub.rejectionReason}</span>
                                        </div>
                                      )}
                                    </div>

                                    {sub.status === 'pending_approval' && (
                                      <div className="flex items-center gap-2 ml-4">
                                        <button
                                          onClick={() => handleApproveFromTable(u.id, sub.id)}
                                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                          title="Approve"
                                        >
                                          <CheckCircle size={18} />
                                        </button>
                                        <button
                                          onClick={() => handleRejectFromTable(u.id, sub.id)}
                                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                          title="Reject"
                                        >
                                          <XCircle size={18} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => {
          setConfirmDialog({ isOpen: false });
          setInputValue('');
          setFreeAccessDays('');
          setUserNote('');
        }}
        onConfirm={handleConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        requireInput={confirmDialog.requireInput}
        requireDays={confirmDialog.requireDays}
        requireNote={confirmDialog.requireNote}
        inputPlaceholder={confirmDialog.inputPlaceholder}
        inputValue={inputValue}
        onInputChange={setInputValue}
        daysValue={freeAccessDays}
        onDaysChange={setFreeAccessDays}
        noteValue={userNote}
        onNoteChange={setUserNote}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} position="top" />
    </div>
  );
}