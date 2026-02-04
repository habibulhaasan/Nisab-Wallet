// src/components/DashboardNav.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, CreditCard, Receipt, FolderOpen, Star, BarChart3, 
  LogOut, Menu, X, ArrowRightLeft, Settings, 
  Shield, Users, Package, DollarSign, Moon, Sun,
  HandCoins, MessageCircleQuestion, Goal, Blend, Globe, Home, User, MessageSquareMore
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { checkIsAdmin } from '@/lib/adminUtils';

export default function DashboardNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState('light');
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    const adminStatus = await checkIsAdmin(user.uid);
    setIsAdmin(adminStatus);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Main navigation items with sections
  const navigation = {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
    finance: [
      { name: 'Accounts', href: '/dashboard/accounts', icon: CreditCard },
      { name: 'Transactions', href: '/dashboard/transactions', icon: Receipt },
      { name: 'Transfer', href: '/dashboard/transfer', icon: ArrowRightLeft },
      { name: 'Categories', href: '/dashboard/categories', icon: FolderOpen },
    ],
    features: [
      { name: 'Loans', href: '/dashboard/loans', icon: HandCoins },
      { name: 'Lend', href: '/dashboard/lendings', icon: Blend },
      { name: 'Goals', href: '/dashboard/goals', icon: Goal },
      { name: 'Zakat', href: '/dashboard/zakat', icon: Star },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ],
    other: [
      { name: 'Feedback', href: '/dashboard/feedback', icon: MessageCircleQuestion },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]
  };

  const adminNavigation = [
    { name: 'Overview', href: '/dashboard/admin/', icon: Users },
    { name: 'Subscriptions', href: '/dashboard/admin/subscription-plans', icon: Package },
    { name: 'Payment Method', href: '/dashboard/admin/payment-methods', icon: CreditCard },
    { name: 'Landing Page', href: '/dashboard/admin/landing-settings', icon: Globe },
    { name: 'Finance', href: '/dashboard/admin/finance', icon: DollarSign },
    { name: 'Users Feedback', href: '/dashboard/admin/feedbacks', icon: MessageSquareMore },
  ];

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NW</span>
            </div>
            <span className="text-base font-semibold text-gray-900">Nisab Wallet</span>
          </div>
          
          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 text-gray-600 hover:text-gray-900">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-3 py-4 space-y-6">
              {/* Main */}
              <div>
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Menu
                </h3>
                {navigation.main.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        router.push(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                        isActive(item.href)
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Finance */}
              <div>
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Finance
                </h3>
                {navigation.finance.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        router.push(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                        isActive(item.href)
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Features */}
              <div>
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Features
                </h3>
                {navigation.features.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        router.push(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                        isActive(item.href)
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Admin Section */}
              {isAdmin && (
                <div>
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Administration
                  </h3>
                  {adminNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          router.push(item.href);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                          isActive(item.href)
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Other */}
              <div>
                {navigation.other.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        router.push(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                        isActive(item.href)
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar - Minimal Style */}
      <div className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">NW</span>
          </div>
          <span className="text-base font-semibold text-gray-900">NisabWallet</span>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-6">
          {/* MENU Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Menu
            </h3>
            <div className="space-y-1">
              {navigation.main.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Finance Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Finance
            </h3>
            <div className="space-y-1">
              {navigation.finance.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Features Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Features
            </h3>
            <div className="space-y-1">
              {navigation.features.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Administration
              </h3>
              <div className="space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                        active
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Items */}
          <div className="space-y-1">
            {navigation.other.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile - Bottom */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {isAdmin ? 'Administrator' : 'User'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}