'use client';

import Link from 'next/link';
import Image from 'next/image'; // Use Next.js Image component for optimized images
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * Header component with dynamic links based on user login state.
 * Matches the Apple-inspired design (#007AFF, rounded-xl, Inter font, clean shadows).
 */
export default function Header() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white bg-opacity-90 backdrop-blur-md shadow-md">
      <nav className="max-w-[1600px] mx-auto flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/public/images/logoAV.png" 
            alt="AdVision Logo"
            width={120} // Adjust width as needed
            height={40} // Adjust height as needed
            className="hover:opacity-80 transition-opacity duration-300"
            priority // Preload the logo for better performance
          />
        </Link>

        {/* Hamburger Button (Mobile) */}
        <div className="flex items-center sm:hidden">
          <button
            onClick={toggleMenu}
            aria-label="Toggle menu"
            className="text-gray-900 hover:text-[#007AFF] p-2 transition-colors duration-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
              />
            </svg>
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-4 sm:gap-6">
          <ul className="flex items-center gap-4 sm:gap-6">
            <li>
              <Link
                href="/"
                className="text-base text-gray-600 hover:text-[#007AFF] transition-colors duration-300 py-2"
              >
                Home
              </Link>
            </li>
            {user ? (
              <li>
                <Link
                  href="/dashboard"
                  className="text-base text-gray-600 hover:text-[#007AFF] transition-colors duration-300 py-2"
                >
                  Dashboard
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="text-base text-gray-600 hover:text-[#007AFF] transition-colors duration-300 py-2"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-[#007AFF] text-white text-base font-medium rounded-xl hover:bg-blue-700 shadow-md transition-all duration-300"
                  >
                    Signup
                  </Link>
                </li>
              </>
            )}
          </ul>
          {user && (
            <button
              onClick={handleSignOut}
              className="text-base text-gray-600 hover:text-[#007AFF] transition-colors duration-300 py-2 px-4 rounded-xl hover:bg-gray-100"
            >
              Sign Out
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Slide-Out Menu */}
      <div
        className={`fixed top-0 right-0 h-screen w-64 bg-white sm:hidden transform transition-transform duration-300 ease-in-out z-50 shadow-lg ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleMenu}
            aria-label="Close menu"
            className="text-gray-900 hover:text-[#007AFF] p-2 transition-colors duration-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col items-center justify-center h-full space-y-6 overflow-y-auto">
          <li>
            <Link
              href="/"
              onClick={toggleMenu}
              className="text-lg text-gray-600 hover:text-[#007AFF] transition-colors duration-300 fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              Home
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link
                  href="/dashboard"
                  onClick={toggleMenu}
                  className="text-lg text-gray-600 hover:text-[#007AFF] transition-colors duration-300 fade-in"
                  style={{ animationDelay: '0.2s' }}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <button
                  onClick={handleSignOut}
                  className="text-lg text-gray-600 hover:text-[#007AFF] transition-colors duration-300 fade-in"
                  style={{ animationDelay: '0.3s' }}
                >
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  href="/login"
                  onClick={toggleMenu}
                  className="text-lg text-gray-600 hover:text-[#007AFF] transition-colors duration-300 fade-in"
                  style={{ animationDelay: '0.2s' }}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  onClick={toggleMenu}
                  className="px-6 py-3 bg-[#007AFF] text-white text-base font-medium rounded-xl hover:bg-blue-700 shadow-md transition-all duration-300 fade-in"
                  style={{ animationDelay: '0.3s' }}
                >
                  Signup
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
}