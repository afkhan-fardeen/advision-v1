"use client";

import { useState, useEffect } from "react"; // Added useEffect import
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";



export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); // Added state to manage redirect
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setIsRedirecting(true);
      router.push("/dashboard");
    }
  }, [user, router]);

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F1EFEC]">
        <p className="text-base text-[#030303] font-extralight">Redirecting...</p>
      </div>
    );
  }

  const handleSignup = async (e) => {
    e.preventDefault();

    const signupPromise = async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      // Manually create profile as backup
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({ id: data.user.id, email });
        if (profileError) {
          console.error("Profile creation error:", profileError.message);
        }
      }

      return data;
    };

    toast.promise(signupPromise(), {
      loading: "Signing up...",
      success: "Signed up successfully! Welcome!",
      error: (err) => err.message || "Failed to sign up.",
    });

    try {
      await signupPromise();
      router.push("/dashboard");
    } catch (err) {
      console.error("Unexpected signup error:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1EFEC] font-inter flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#123458] text-[#F1EFEC] py-3 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="text-xl font-medium text-[#F1EFEC] hover:text-[#FDFAF6] relative group"
          >
            AdVision
            <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[#FDFAF6] transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-grow flex flex-col lg:flex-row pt-4">
        {/* Left Side - Text Branding */}
        <div className="lg:w-1/2 flex items-center justify-center bg-[#123458] py-12 lg:py-0">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-md">
            <h1 className="text-2xl sm:text-3xl font-medium text-[#F1EFEC] mb-4 animate-fade-in">
              Join AdVision
            </h1>
            <p
              className="text-sm sm:text-base font-extralight text-[#F1EFEC] mb-4 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              AI-Powered Tools for Smarter Projects
            </p>
            <p
              className="text-sm font-extralight text-[#F1EFEC] animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              Sign up to unlock powerful AI tools, create professional ad designs, and streamline your project management.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:w-1/2 flex items-center justify-center py-12 lg:py-0 px-4 sm:px-6 lg:px-8">
          <div className="max-w-sm w-full bg-[#FDFAF6] rounded-xl p-6 shadow-md animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <h2 className="text-xl sm:text-2xl font-medium text-[#123458] tracking-tight mb-4 text-center">
              Sign Up
            </h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-extralight text-[#030303] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#123458] rounded-xl text-sm text-[#030303] font-extralight focus:outline-none focus:ring-2 focus:ring-[#123458] focus:border-transparent transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-extralight text-[#030303] mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#123458] rounded-xl text-sm text-[#030303] font-extralight focus:outline-none focus:ring-2 focus:ring-[#123458] focus:border-transparent transition-all duration-300"
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center text-sm font-extralight text-[#030303]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-[#123458] border-[#123458] rounded focus:ring-[#123458]"
                  />
                  <span className="ml-2">Remember me</span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full px-6 py-2 bg-[#123458] text-[#F1EFEC] text-sm font-medium rounded-xl shadow-md hover:bg-[#1E4A7A] hover:scale-105 transition-all duration-300"
              >
                Sign Up
              </button>
            </form>
            <p className="text-sm font-extralight text-[#030303] mt-4 text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#123458] hover:underline transition-colors duration-300 relative group"
              >
                Log In
                <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[#123458] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#123458] text-[#F1EFEC] py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-extralight">AdVision | April 27, 2025 | v1.0</p>
        </div>
      </footer>
    </div>
  );
}