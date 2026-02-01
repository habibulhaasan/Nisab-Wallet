// src/components/DashboardNav.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, CreditCard, Receipt, FolderOpen, Star, BarChart3, 
  LogOut, Menu, X, ArrowRightLeft, Settings, MessageSquare, 
  Shield, Users, Package, DollarSign, ChevronDown, ChevronRight,
  // → New icons added
  HandCoins, MessageCircleQuestion   // or use MessageSquare if you prefer
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { checkIsAdmin } from '@/lib/adminUtils';

export default function DashboardNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (pathname?.startsWith('/dashboard/admin')) {
      setAdminMenuOpen(true);
    }
  }, [pathname]);

  const checkAdminStatus = async () => {
    const adminStatus = await checkIsAdmin(user.uid);
    setIsAdmin(adminStatus);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard',    href: '/dashboard',               icon: LayoutDashboard },
    { name: 'Accounts',     href: '/dashboard/accounts',      icon: CreditCard },
    { name: 'Transactions', href: '/dashboard/transactions',  icon: Receipt },
    { name: 'Transfer',     href: '/dashboard/transfer',      icon: ArrowRightLeft },
    // → Added here
    { name: 'Loans',        href: '/dashboard/loans',         icon: HandCoins },
    { name: 'Categories',   href: '/dashboard/categories',    icon: FolderOpen },
    { name: 'Zakat',        href: '/dashboard/zakat',         icon: Star },
    { name: 'Analytics',    href: '/dashboard/analytics',     icon: BarChart3 },
    // → Added here (you can move it higher if preferred)
    { name: 'Feedback',     href: '/dashboard/feedback',      icon: MessageCircleQuestion },
    { name: 'Settings',     href: '/dashboard/settings',      icon: Settings },
  ];

  const adminNavigation = [
    { name: 'Admin Overview',       href: '/dashboard/admin',                    icon: Shield },
    { name: 'User Management',      href: '/dashboard/admin/users',              icon: Users },
    { name: 'Subscription Plans',   href: '/dashboard/admin/subscription-plans', icon: Package },
    { name: 'Payment Methods',      href: '/dashboard/admin/payment-methods',    icon: CreditCard },
    { name: 'Finance Dashboard',    href: '/dashboard/admin/finance',            icon: DollarSign },
  ];

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* Top Header - Mobile */}
      <div className="lg:hidden bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-semibold text-gray-900">Nisab Wallet</h1>
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t bg-white">
            <div className="px-2 py-2 space-y-0.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}

              {isAdmin && (
                <div className="pt-2 mt-2 border-t">
                  <button
                    onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">Admin</span>
                    </div>
                    {adminMenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {adminMenuOpen && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {adminNavigation.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              router.push(item.href);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded transition-colors ${
                              isActive(item.href)
                                ? 'bg-purple-600 text-white font-medium'
                                : 'text-gray-600 hover:bg-purple-50'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r">
        <div className="flex items-center justify-between h-14 px-6 border-b">
          <h1 className="text-lg font-semibold text-gray-900">Nisab Wallet</h1>
          <NotificationBell />
        </div>

        <div className="px-4 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-sm">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              {isAdmin && (
                <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded mt-1">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            {isAdmin && (
              <div className="pt-2 mt-2 border-t">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded text-gray-700 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">Admin</span>
                  </div>
                  {adminMenuOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {adminMenuOpen && (
                  <div className="mt-1 space-y-0.5">
                    {adminNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name}
                          onClick={() => router.push(item.href)}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded transition-colors pl-10 ${
                            isActive(item.href)
                              ? 'bg-purple-600 text-white font-medium'
                              : 'text-gray-600 hover:bg-purple-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="px-3 py-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}