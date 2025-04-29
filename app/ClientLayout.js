'use client';

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ClientLayout component to conditionally render Header and Footer
export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true after the component mounts on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Exclude Header/Footer for specific routes
  const isExcludedRoute =
    pathname === "/dashboard" ||
    pathname.match(/^\/dashboard\/projects\/[^/]+$/) ||
    pathname === "/dashboard/create-project" ||
    pathname === "/dashboard/designer" ||
    pathname === "/dashboard/ai-design-suggestions" || // Added this route
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/"; // Exclude Header/Footer for Homepage

  // Avoid rendering until mounted to prevent hydration mismatches
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {!isExcludedRoute && <Header />}
      {children}
      {!isExcludedRoute && <Footer />}
    </>
  );
}