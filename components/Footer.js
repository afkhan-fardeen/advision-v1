'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

/**
 * Footer component with About, Contact, and Dashboard links.
 * Matches the Apple-inspired design (#007AFF, rounded-xl, Inter font, clean shadows).
 */
export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="bg-gray-200 py-6 mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link
            href="/about"
            className="text-sm text-gray-600 hover:text-[#007AFF] transition-colors duration-300"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm text-gray-600 hover:text-[#007AFF] transition-colors duration-300"
          >
            Contact
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-[#007AFF] transition-colors duration-300"
            >
              Dashboard
            </Link>
          )}
        </div>
        <p className="text-sm text-gray-600 text-center mt-4">
          AdVision | April 24, 2025 | v1.0
        </p>
      </div>
    </footer>
  );
}