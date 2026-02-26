"use client";

import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { useEffect, useState } from "react";
import { auth } from "@/app/lib/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import { usePathname } from "next/navigation";

function emailToName(email?: string | null) {
  if (!email) return "";

  let name = email.split("@")[0] || "";

  name = name.replace(/[._-]/g, " ");

  name = name
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");

  return name;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  const displayName = emailToName(user?.email);

  // Hide auth buttons on login/register pages
  const hideAuthControls =
    pathname === "/login" || pathname === "/register";

  return (
    <nav
      style={{
        borderBottom: "1px solid #333",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(0,0,0,0.25)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* LEFT SIDE */}
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <Link href="/" style={{ fontWeight: 800, textDecoration: "none" }}>
          Pharmacy
        </Link>
        <Link href="/pharmacies" style={{ textDecoration: "none" }}>
          Pharmacies
        </Link>

        <Link href="/products" style={{ textDecoration: "none" }}>
          Products
        </Link>

        <Link href="/cart" style={{ textDecoration: "none" }}>
          Cart
        </Link>

        <Link href="/orders" style={{ textDecoration: "none" }}>
          My Orders
        </Link>

        <Link href="/admin" style={{ textDecoration: "none" }}>
          Admin
        </Link>
      </div>

      {/* RIGHT SIDE */}
      {!hideAuthControls && (
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {user ? (
            <>
              <span style={{ fontWeight: 700, opacity: 0.9 }}>
                👤 {displayName}
              </span>

              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  padding: "8px 14px",
                  border: "1px solid #444",
                  borderRadius: 10,
                  textDecoration: "none",
                }}
              >
                Login
              </Link>

              <Link
                href="/register"
                style={{
                  padding: "8px 14px",
                  border: "1px solid #444",
                  borderRadius: 10,
                  textDecoration: "none",
                  opacity: 0.9,
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}