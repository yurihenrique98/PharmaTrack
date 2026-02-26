"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase/client";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";

function friendlyAuthError(code?: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Registration failed. Please try again.";
  }
}

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Create minimal user profile doc
      const userRef = doc(db, "users", cred.user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          email: cred.user.email ?? email.trim(),
          displayName: name.trim(),
          isAdmin: false,
          createdAt: serverTimestamp(),
        });
      }

      // Keep your existing cookie approach consistent with login
      await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session: "logged-in" }),
      });

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(friendlyAuthError(err?.code));
    } finally {
      setLoading(false);
    }
  }

  const disabled = !name.trim() || !email.trim() || !password.trim();

  return (
    <form
      onSubmit={onSubmit}
      style={{ marginTop: 18, display: "grid", gap: 12 }}
    >
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ opacity: 0.85 }}>Full name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John Smith"
          required
          style={{
            padding: 12,
            border: "1px solid #444",
            borderRadius: 12,
            background: "transparent",
          }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ opacity: 0.85 }}>Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. user@pharm.com"
          type="email"
          required
          style={{
            padding: 12,
            border: "1px solid #444",
            borderRadius: 12,
            background: "transparent",
          }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ opacity: 0.85 }}>Password</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          type="password"
          required
          style={{
            padding: 12,
            border: "1px solid #444",
            borderRadius: 12,
            background: "transparent",
          }}
        />
      </label>

      <button
        type="submit"
        disabled={loading || disabled}
        style={{
          padding: 12,
          border: "1px solid #444",
          borderRadius: 12,
          cursor: loading || disabled ? "not-allowed" : "pointer",
          background: "transparent",
          fontWeight: 900,
          opacity: loading || disabled ? 0.6 : 1,
        }}
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>

      {error && (
        <p style={{ margin: 0, color: "crimson", fontWeight: 700 }}>
          {error}
        </p>
      )}
    </form>
  );
}