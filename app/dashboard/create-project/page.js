'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { ArrowRightOnRectangleIcon, UserCircleIcon, Bars3Icon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

// CreateProject component for adding new projects
export default function CreateProject() {
  const { user, loading } = useAuth();
  const [name, setName] = useState('');
  const [productService, setProductService] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productFeatures, setProductFeatures] = useState('');
  const [profileError, setProfileError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("Create Project");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Set isMounted to true after the component mounts on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ensure user profile exists in Supabase
  const ensureProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile check error:', error.message);
        setProfileError('Failed to verify profile.');
        return false;
      }

      if (!data) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, email: user.email });

        if (insertError) {
          console.error('Profile creation error:', insertError.message);
          setProfileError('Failed to create profile.');
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Unexpected profile error:', err.message);
      setProfileError('Unexpected error verifying profile.');
      return false;
    }
  }, [user]);

  // Redirect unauthenticated users and ensure profile on mount
  useEffect(() => {
    if (!loading && !user) {
      toast.error('You must be logged in to create a project.');
      router.push('/login');
    } else if (user && isMounted) {
      ensureProfile();
    }
  }, [user, loading, router, ensureProfile, isMounted]);

  // Handle project form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        toast.error('You must be logged in to create a project.');
        router.push('/login');
        return;
      }

      if (profileError || isSubmitting) {
        if (profileError) toast.error('Cannot create project due to profile issue.');
        return;
      }

      setIsSubmitting(true);
      console.log('Submitting project:', {
        name,
        productService,
        targetPlatform,
        primaryGoal,
        productDescription,
        productFeatures,
      });

      try {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name,
            product_service: productService,
            target_platform: targetPlatform,
            primary_goal: primaryGoal,
            product_description: productDescription,
            product_features: productFeatures || null,
          })
          .select()
          .single();

        if (error) {
          console.error('Project creation error:', error.message);
          toast.error(error.message || 'Failed to create project.');
        } else {
          console.log('Project created:', data);
          toast.success('Project created successfully!');
          setName('');
          setProductService('');
          setTargetPlatform('');
          setPrimaryGoal('');
          setProductDescription('');
          setProductFeatures('');
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Unexpected project error:', err.message);
        toast.error('Unexpected error creating project.');
      } finally {
        setTimeout(() => setIsSubmitting(false), 1000);
      }
    },
    [
      user,
      profileError,
      isSubmitting,
      name,
      productService,
      targetPlatform,
      primaryGoal,
      productDescription,
      productFeatures,
      router,
    ]
  );

  // Handle user sign-out
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Failed to sign out.");
        console.error("Sign out error:", error.message);
      } else {
        toast.success("Signed out successfully!");
        router.push("/login");
      }
    } catch (err) {
      toast.error("Unexpected error signing out.");
      console.error("Unexpected sign out error:", err.message);
    }
  };

  const tabs = ["Dashboard", "Create Project", "Ai Design Suggestions", "Profile"];

  // Show a loading state during SSR or initial render
  if (loading || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F1EFEC]">
        <p className="text-base text-[#030303] font-extralight">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EFEC] font-inter flex flex-col">
      {/* Header Section */}
      <header className="bg-[#123458] text-[#F1EFEC] py-3 px-4 sticky top-0 z-50">
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
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <div className="relative group">
                <button
                  onClick={() => {
                    setActiveTab("Profile");
                  }}
                  className="text-[#F1EFEC] hover:text-[#FDFAF6] transition-colors"
                  aria-label="Your Profile"
                >
                  <UserCircleIcon className="w-5 h-5" />
                </button>
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#030303] text-[#F1EFEC] text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-200 pointer-events-none whitespace-nowrap text-center min-w-max font-extralight">
                  Your Profile
                </span>
              </div>
              <div className="relative group">
                <button
                  onClick={handleSignOut}
                  className="text-[#F1EFEC] hover:text-[#FDFAF6] transition-colors"
                  aria-label="Sign Out"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#030303] text-[#F1EFEC] text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-200 pointer-events-none whitespace-nowrap text-center min-w-max font-extralight">
                  Sign Out
                </span>
              </div>
            </div>
            <button
              className="md:hidden p-2 rounded-full hover:bg-[#1E4A7A]"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open actions menu"
            >
              <Bars3Icon className="w-6 h-6 text-[#F1EFEC]" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-[#FDFAF6] shadow-sm py-3 px-4 sticky top-[56px] z-40">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Tabs */}
          <div className="hidden md:flex space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "Dashboard") router.push("/dashboard");
                  else if (tab === "Ai Design Suggestions") router.push("/dashboard/ai-design-suggestions");
                  else if (tab === "Profile") setActiveTab("Profile");
                }}
                className={`relative text-sm pb-2 transition-colors duration-300 ${
                  activeTab === tab
                    ? "text-[#123458] font-medium border-b-2 border-[#123458]"
                    : "text-[#030303] font-extralight hover:text-[#1E4A7A]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Mobile Active Tab Display */}
          <div className="md:hidden">
            <span className="text-sm text-[#123458] font-medium">
              {activeTab}
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          <div className="fixed top-16 left-4 right-4 bg-[#FDFAF6] rounded-xl shadow-md p-6 z-50 md:hidden animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-[#123458]">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full hover:bg-[#F1EFEC]"
                aria-label="Close actions menu"
              >
                <XMarkIcon className="w-6 h-6 text-[#030303]" />
              </button>
            </div>
            <div className="space-y-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setIsMenuOpen(false);
                    if (tab === "Dashboard") router.push("/dashboard");
                    else if (tab === "Ai Design Suggestions") router.push("/dashboard/ai-design-suggestions");
                    else if (tab === "Profile") setActiveTab("Profile");
                  }}
                  className={`block text-sm text-[#123458] hover:text-[#1E4A7A] transition-colors font-extralight ${
                    activeTab === tab ? "font-medium" : ""
                  }`}
                >
                  {tab}
                </button>
              ))}
              <button
                onClick={async () => {
                  await handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 text-sm text-[#123458] hover:text-[#1E4A7A] transition-colors font-extralight"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Back to Dashboard Link */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-sm text-[#123458] hover:text-[#1E4A7A] transition-colors flex items-center gap-1 font-extralight"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-[#FDFAF6] bg-opacity-80 backdrop-blur-md rounded-xl p-8 shadow-md animate-fade-in">
            <h1 className="text-3xl font-medium text-[#123458] mb-6 text-center">
              Create New Project
            </h1>
            {profileError && (
              <p className="text-[#FF3B30] text-sm mb-6 text-center font-extralight">
                {profileError}
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Project Name + Product/Service */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-extralight text-[#030303] mb-2"
                  >
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm disabled:opacity-50 font-extralight text-[#030303]"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label
                    htmlFor="productService"
                    className="block text-sm font-extralight text-[#030303] mb-2"
                  >
                    Product/Service Name *
                  </label>
                  <input
                    type="text"
                    id="productService"
                    value={productService}
                    onChange={(e) => setProductService(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm disabled:opacity-50 font-extralight text-[#030303]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Row 2: Product Description + Product Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="productDescription"
                    className="block text-sm font-extralight text-[#030303] mb-2"
                  >
                    Product Description *
                  </label>
                  <textarea
                    id="productDescription"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm min-h-[150px] disabled:opacity-50 font-extralight text-[#030303]"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label
                    htmlFor="productFeatures"
                    className="block text-sm font-extralight text-[#030303] mb-2"
                  >
                    Product Features (Optional)
                  </label>
                  <textarea
                    id="productFeatures"
                    value={productFeatures}
                    onChange={(e) => setProductFeatures(e.target.value)}
                    className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm min-h-[150px] disabled:opacity-50 font-extralight text-[#030303]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Row 3: Target Platform + Primary Goal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="targetPlatform"
                    className="block text-sm font-extralight text-[#030303] mb-2"
                  >
                    Target Platform *
                  </label>
                  <select
                    id="targetPlatform"
                    value={targetPlatform}
                    onChange={(e) => setTargetPlatform(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm disabled:opacity-50 font-extralight text-[#030303]"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a platform</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Twitter">Twitter</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="primaryGoal"
                    className="block text-sm font-extralight text-[#030303] mb-2"
                  >
                    Primary Goal *
                  </label>
                  <select
                    id="primaryGoal"
                    value={primaryGoal}
                    onChange={(e) => setPrimaryGoal(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-[#123458] rounded-xl focus:ring-2 focus:ring-[#123458] focus:border-transparent text-sm disabled:opacity-50 font-extralight text-[#030303]"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a goal</option>
                    <option value="Brand Awareness">Brand Awareness</option>
                    <option value="Conversions">Conversions</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Lead Generation">Lead Generation</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#34C759] text-[#F1EFEC] text-sm font-medium rounded-xl px-4 py-3 hover:bg-[#2EB648] hover:scale-105 transition-all duration-300 disabled:opacity-50"
                disabled={profileError || isSubmitting}
              >
                Create Project
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="bg-[#123458] text-[#F1EFEC] py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-extralight">AdVision | April 27, 2025 | v1.0</p>
        </div>
      </footer>
    </div>
  );
}