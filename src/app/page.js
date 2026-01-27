// src/app/page.js
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { Wallet, Star, BarChart3, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <h1 className="text-lg font-semibold text-gray-900">H Wallet</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-semibold text-gray-900 mb-6 leading-tight">
            Personal finance with built-in Zakat tracking
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Track your wealth across multiple accounts and never miss your Zakat obligations. 
            Simple, accurate, and built for Muslims.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <span>Start tracking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-3 gap-12">
          {/* Feature 1 */}
          <div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Multi-account tracking
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Manage cash, bank accounts, mobile banking, gold, and silver holdings in one place.
            </p>
          </div>

          {/* Feature 2 */}
          <div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Automated Zakat cycles
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Automatic monitoring with Hijri calendar support. Know exactly when Zakat is due.
            </p>
          </div>

          {/* Feature 3 */}
          <div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Detailed analytics
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Weekly, monthly, and yearly reports to understand your financial patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500">
            © 2025 H Wallet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}