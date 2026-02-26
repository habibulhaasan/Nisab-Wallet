// src/components/DashboardNav.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { 
  LayoutDashboard, CreditCard, Receipt, FolderOpen, Star, BarChart3, 
  LogOut, Menu, X, ArrowRightLeft, Settings, 
  Users, Package, DollarSign, Globe, Sprout,
  HandCoins, MessageCircleQuestion, Goal, Blend, MessageSquareMore,
  Home, Repeat ,FileText, ShoppingBag, PiggyBank, AlertTriangle
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { checkIsAdmin } from '@/lib/adminUtils';

export default function DashboardNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
      { name: 'Shopping List', href: '/dashboard/shopping', icon: ShoppingBag },
      { name: 'Budgets', href: '/dashboard/budgets', icon: PiggyBank, description: 'Monthly budgets'},
      { name: 'Loans', href: '/dashboard/loans', icon: HandCoins },
      { name: 'Lend', href: '/dashboard/lendings', icon: Blend },
      { name: 'Goals', href: '/dashboard/goals', icon: Goal },
      { name: 'Investments', href: '/dashboard/investments', icon: Sprout },
      { name: 'Zakat', href: '/dashboard/zakat', icon: Star },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Recurring', href: '/dashboard/recurring', icon: Repeat},
      { name: 'Tax File', href: '/dashboard/tax', icon: FileText},
      { name: 'Riba Tracker', href: '/dashboard/riba', icon: AlertTriangle },

    ],
    other: [
      { name: 'Feedback', href: '/dashboard/feedback', icon: MessageCircleQuestion },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]
  };

  const adminNavigation = [
    { name: 'Overview', href: '/dashboard/admin/', icon: Home },
    { name: 'Users', href: '/dashboard/admin/users', icon: Users },
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
      <div className="lg:hidden bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image 
              src="/nisab-logo.png" 
              alt="Nisab Wallet Logo" 
              width={36} 
              height={36}
              className="object-contain"
            />
            <span className="text-base font-bold text-gray-900">NisabWallet</span>
          </div>
          
          {/* Right Side */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Slide-in Menu */}
            <div className="fixed inset-y-0 right-0 w-[280px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="flex items-center justify-between px-4 h-16 border-b">
                  <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Menu Content */}
                <div className="flex-1 overflow-y-auto py-4 px-3">
                  <div className="space-y-6">
                    {/* Main */}
                    <div>
                      <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Main
                      </h3>
                      <div className="space-y-1">
                        {navigation.main.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.name}
                              onClick={() => {
                                router.push(item.href);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${
                                isActive(item.href)
                                  ? 'bg-gray-900 text-white shadow-md'
                                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                              }`}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              <span className="font-medium">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Finance */}
                    <div>
                      <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Finance
                      </h3>
                      <div className="space-y-1">
                        {navigation.finance.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.name}
                              onClick={() => {
                                router.push(item.href);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${
                                isActive(item.href)
                                  ? 'bg-gray-900 text-white shadow-md'
                                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                              }`}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              <span className="font-medium">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Features
                      </h3>
                      <div className="space-y-1">
                        {navigation.features.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.name}
                              onClick={() => {
                                router.push(item.href);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${
                                isActive(item.href)
                                  ? 'bg-gray-900 text-white shadow-md'
                                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                              }`}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              <span className="font-medium">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Admin Section */}
                    {isAdmin && (
                      <div>
                        <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Administration
                        </h3>
                        <div className="space-y-1">
                          {adminNavigation.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.name}
                                onClick={() => {
                                  router.push(item.href);
                                  setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${
                                  isActive(item.href)
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                                }`}
                              >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">{item.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Other */}
                    <div>
                      <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Other
                      </h3>
                      <div className="space-y-1">
                        {navigation.other.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.name}
                              onClick={() => {
                                router.push(item.href);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${
                                isActive(item.href)
                                  ? 'bg-gray-900 text-white shadow-md'
                                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                              }`}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              <span className="font-medium">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Profile at Bottom */}
                <div className="border-t bg-gray-50 p-4">
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
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Desktop Sidebar - Minimal Style */}
      <div className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        {/* Logo & Notification */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Image 
              src="/nisab-logo.png" 
              alt="Nisab Wallet Logo" 
              width={32} 
              height={32}
              className="object-contain flex-shrink-0"
            />
            <span className="text-lg font-bold text-gray-900">NisabWallet</span>
          </div>
          <NotificationBell />
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-6">
          {/* MENU Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Main
            </h3>
            <div className="space-y-1">
              {navigation.main.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                      active
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                      active
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                      active
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                        active
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Items */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Other
            </h3>
            <div className="space-y-1">
              {navigation.other.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                      active
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}