'use client';

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { ArrowRightIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useEffect, useState } from "react";

// HomePage component for the AdVision landing page
export default function HomePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isMounted, setIsMounted] = useState(false); // Track client-side mounting
  const isSignedIn = !!user;

  // Set isMounted to true after the component mounts on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  // Show a loading state while checking the session or during SSR
  if (loading || !isMounted) {
    return (
      <div className="bg-[#F1EFEC] font-inter min-h-screen flex items-center justify-center">
        <p className="text-[#030303] font-extralight text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F1EFEC] font-inter min-h-screen">
      {/* Header Section */}
      <header className="bg-[#123458] text-[#F1EFEC] py-3 px-4 sm:px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <Image
              src="/images/logoAV.png"
              alt="AdVision Logo"
              width={120}
              height={40}
              className="hover:opacity-80 transition-opacity duration-300"
              priority
            />
          </Link>
          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-[#F1EFEC] hover:text-[#FDFAF6] font-extralight text-sm relative group"
            >
              Home
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[#FDFAF6] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="#features"
              className="text-[#F1EFEC] hover:text-[#FDFAF6] font-extralight text-sm relative group"
            >
              Features
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[#FDFAF6] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            {isSignedIn ? (
              <>
                <a
                  href="/dashboard"
                  className="text-[#F1EFEC] hover:text-[#FDFAF6] font-extralight text-sm relative group"
                >
                  Dashboard
                  <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[#FDFAF6] transition-all duration-300 group-hover:w-full"></span>
                </a>
                <button onClick={handleLogout} aria-label="Logout">
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 text-[#F1EFEC] hover:text-[#FDFAF6] transition" />
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/signup")}
                className="bg-[#FDFAF6] text-[#123458] font-medium text-sm py-1.5 px-3 rounded-lg hover:bg-[#F1EFEC] hover:scale-105 transition duration-300"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#123458] text-[#F1EFEC] py-8 px-4 sm:px-6 w-full h-auto md:h-[80vh] flex items-center">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 w-full">
          <div className="md:w-1/2 mb-6 md:mb-0 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-medium tracking-tight mb-3">
              Launch Impactful Ads with AdVision’s AI Power
            </h1>
            <p className="text-sm sm:text-base md:text-lg font-extralight mb-4 max-w-md mx-auto md:mx-0">
              Effortlessly craft, target, and optimize ads that captivate and convert your audience.
            </p>
            <button
              onClick={() => router.push("/signup")}
              className="bg-[#FDFAF6] text-[#123458] font-medium text-sm py-2 px-4 rounded-lg hover:bg-[#F1EFEC] hover:scale-105 transition duration-300 flex items-center mx-auto md:mx-0"
            >
              Get Started Now <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="md:w-1/2 w-full">
            <div className="relative w-full h-64 sm:h-72 md:h-96 rounded-lg overflow-hidden">
              <Image
                src="/images/marketing.png"
                alt="AdVision campaign creation interface"
                fill
                className="object-cover absolute"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-[#123458] text-center mb-8">
            Why Choose AdVision?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-[#FDFAF6] p-4 rounded-xl shadow-lg">
              <div className="relative h-24 sm:h-32 w-full bg-[#F1EFEC] rounded-lg mb-3 flex items-center justify-center">
                <Image
                  src="/images/ad-copy.png"
                  alt="Ad Copy Icon"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-[#030303] mb-1">Create Compelling Ad Copies</h3>
              <p className="text-[#030303] font-extralight text-xs sm:text-sm">
                Craft ad copies that resonate with your audience using our intuitive tools.
              </p>
            </div>
            <div className="bg-[#FDFAF6] p-4 rounded-xl shadow-lg">
              <div className="relative h-24 sm:h-32 w-full bg-[#F1EFEC] rounded-lg mb-3 flex items-center justify-center">
                <Image
                  src="/images/audience.png"
                  alt="Audience Icon"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-[#030303] mb-1">Target the Right Audience</h3>
              <p className="text-[#030303] font-extralight text-xs sm:text-sm">
                Define and reach your ideal audience with precision targeting.
              </p>
            </div>
            <div className="bg-[#FDFAF6] p-4 rounded-xl shadow-lg">
              <div className="relative h-24 sm:h-32 w-full bg-[#F1EFEC] rounded-lg mb-3 flex items-center justify-center">
                <Image
                  src="/images/analytics.png"
                  alt="Analytics Icon"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-[#030303] mb-1">Optimize with Insights</h3>
              <p className="text-[#030303] font-extralight text-xs sm:text-sm">
                Use data-driven insights to improve your campaign performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section id="get-started" className="bg-[#FDFAF6] py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-[#123458] mb-3">
            Ready to Elevate Your Ad Campaigns?
          </h2>
          <p className="text-xs sm:text-sm md:text-base font-extralight text-[#030303] mb-6">
            Join AdVision today and start creating impactful ads that drive results.
          </p>
          <button
            onClick={() => router.push("/ui-test")}
            className="bg-[#123458] text-[#F1EFEC] font-medium text-sm py-2 px-4 rounded-lg hover:bg-[#1E4A7A] hover:scale-105 transition duration-300 flex items-center mx-auto"
          >
            Start Your First Project <ArrowRightIcon className="h-4 w-4 ml-1" />
          </button>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-[#123458] text-[#F1EFEC] py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h3 className="text-base sm:text-lg font-medium">AdVision</h3>
            <p className="text-xs font-extralight">© 2025 AdVision. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap justify-center space-x-4">
            <a
              href="#features"
              className="text-[#F1EFEC] hover:text-[#FDFAF6] font-extralight text-sm relative group"
            >
              Features
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[#FDFAF6] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#get-started"
              className="text-[#F1EFEC] hover:text-[#FDFAF6] font-extralight text-sm relative group"
            >
              Get Started
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[#FDFAF6] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="/ui-test"
              className="text-[#F1EFEC] hover:text-[#FDFAF6] font-extralight text-sm relative group"
            >
              Dashboard
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[#FDFAF6] transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}