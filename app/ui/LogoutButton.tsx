"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      // 1) Firebase sign out
      await signOut(auth);

      // 2) Clear cookie session on server
      await fetch("/api/logout", { method: "POST" });

      // 3) Go to login and refresh UI
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: "8px 14px",
        border: "1px solid #444",
        borderRadius: 10,
        cursor: loading ? "not-allowed" : "pointer",
        background: "transparent",
      }}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}