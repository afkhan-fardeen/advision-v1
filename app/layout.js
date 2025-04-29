import { Inter } from "next/font/google";
import "../app/globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "400", "500", "700"], // Include weights used: 200 (extralight), 400 (regular), 500 (medium), 700 (bold)
});

// Global metadata for SEO
export const metadata = {
  title: "AdVision - Create and Optimize Ad Campaigns",
  description: "AdVision helps you create, manage, and optimize ad campaigns effortlessly.",
  keywords: "ad campaign, ad creation, marketing tools, ad management, AdVision",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ClientLayout>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: "12px",
                  background: "#fff",
                  color: "#1D1D1F",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                },
                success: {
                  style: {
                    border: "1px solid #34C759",
                  },
                },
                error: {
                  style: {
                    border: "1px solid #FF3B30",
                  },
                },
              }}
            />
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}