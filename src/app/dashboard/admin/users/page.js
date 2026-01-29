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
  grantFreeLifetimeAccess
} from '@/lib/adminUtils';
import { getCurrentSubscription } from '@/lib/subscriptionUtils';
import { 
  Users, Search, Filter, CheckCircle, XCircle, Lock, Unlock, 
  Clock, Star, Eye, MoreVertical, Gift
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
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (user) {
      checkAdminAndLoad();
    }
  }, [user]);

  useEffect(() => {
    filterAndSearchUsers();
  }, [searchTerm, filterStatus, users]);

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
      // Load subscription info for each user
      const usersWithSubs = await Promise.all(
        result.users.map(async (u) => {
          const subResult = await getCurrentSubscription(u.id);
          return {
            ...u,
            currentSubscription: subResult.subscription
          };
        })
      );
      setUsers(usersWithSubs);
      setFilteredUsers(usersWithSubs);
    }
    setLoading(false);
  };

  const filterAndSearchUsers = () => {
    let filtered = users;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.mobile?.includes(searchTerm)
      );
    }

    // Apply status filter
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

  const handleBlock = (userId, isBlocked) => {
    if (isBlocked) {
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
          if (!inputValue.trim()) return;
          
          const result = await toggleBlockUser(userId, isBlocked, user.uid, inputValue);
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
          const result = await toggleBlockUser(userId, isBlocked, user.uid, '');
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
    setConfirmDialog({
      isOpen: true,
      title: 'Grant Free Lifetime Access',
      message: 'Please provide a reason for granting free lifetime access:',
      type: 'success',
      confirmText: 'Grant Access',
      requireInput: true,
      inputPlaceholder: 'Enter reason...',
      onConfirm: async () => {
        if (!inputValue.trim()) return;
        
        const result = await grantFreeLifetimeAccess(userId, user.uid, inputValue);
        setConfirmDialog({ isOpen: false });
        setInputValue('');
        if (result.success) {
          addToast('Free lifetime access granted', 'success');
          loadUsers();
        } else {
          addToast('Error: ' + result.error, 'error');
        }
        setShowActionMenu(null);
      }
    });
  };

  const getStatusBadge = (u) => {
    if (u.role === 'admin') {
      return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Admin</span>;
    }
    if (u.subscriptionStatus === 'free_lifetime') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Free Access</span>;
    }
    if (u.isBlocked) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Blocked</span>;
    }
    if (!u.currentSubscription) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">No Subscription</span>;
    }

    const status = u.currentSubscription.status;
    const colors = {
      trial: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 ${colors[status] || 'bg-gray-100 text-gray-800'} text-xs rounded-full capitalize`}>
        {status.replace('_', ' ')}
      </span>
    );
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Users className="mr-2" size={28} />
          User Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage users, approve subscriptions, and control access
        </p>
      </div>

      {/* Stats Cards */}
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

      {/* Search and Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
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

          {/* Filter */}
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

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono text-gray-600">{u.id.substring(0, 8)}...</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {u.mobile}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(u)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.currentSubscription ? (
                      <div>
                        <p className="text-gray-900">{u.currentSubscription.planName}</p>
                        <p className="text-xs text-gray-500">
                          Until {new Date(u.currentSubscription.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {u.lastLoginAt ? new Date(u.lastLoginAt.toDate()).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === u.id ? null : u.id)}
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
                                  onClick={() => handleBlock(u.id, !u.isBlocked)}
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => {
          setConfirmDialog({ isOpen: false });
          setInputValue('');
        }}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        requireInput={confirmDialog.requireInput}
        inputPlaceholder={confirmDialog.inputPlaceholder}
        inputValue={inputValue}
        onInputChange={setInputValue}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}