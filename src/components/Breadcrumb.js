// src/components/Breadcrumb.js
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    
    const breadcrumbs = paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      
      // Format the label (capitalize and replace hyphens)
      let label = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Custom labels for specific paths
      const customLabels = {
        'dashboard': 'Dashboard',
        'accounts': 'Accounts',
        'transactions': 'Transactions',
        'categories': 'Categories',
        'zakat': 'Zakat',
        'analytics': 'Analytics',
        'settings': 'Settings',
        'transfer': 'Transfer',
        'loans': 'Loans',
        'lendings': 'Lend',
        'goals': 'Goals',
        'feedback': 'Feedback',
        'admin': 'Admin',
        'users': 'Users',
        'roles': 'Roles',
        'privileges': 'Privileges',
        'subscription-plans': 'Subscription Plans',
        'payment-methods': 'Payment Methods',
        'finance': 'Finance',
        'landing-manager': 'Landing Page',
        'profile': 'My Profile',
      };
      
      if (customLabels[path]) {
        label = customLabels[path];
      }
      
      return {
        label,
        href,
        isLast: index === paths.length - 1
      };
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on homepage or just /dashboard
  if (pathname === '/' || pathname === '/dashboard') {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
      <nav className="flex items-center space-x-2 text-sm">
        <Link 
          href="/dashboard" 
          className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
        </Link>
        
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {crumb.isLast ? (
              <span className="font-medium text-gray-900">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}