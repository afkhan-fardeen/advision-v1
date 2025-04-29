"use client";

import { AuthProvider } from "../context/AuthContext";

export default function ClientWrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}