"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/app/lib/firebase/client";

function friendlyAuthError(code?: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password. Please try again.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";
    default:
      return "Login failed. Please try again.";
  }
}

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [error, setError] = useState<string>("");
  const [resetMsg, setResetMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResetMsg("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);

      // Keep your existing cookie session flow
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

  async function sendReset() {
    setError("");
    setResetMsg("");

    const to = email.trim();
    if (!to) {
      setError("Please enter your email first.");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, to);
      setResetMsg(
        `Password reset email sent to ${to}. If you don't see it, check your Spam or Junk folder.`
      );
    } catch (err: any) {
      setError(friendlyAuthError(err?.code));
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        marginTop: 18,
        display: "grid",
        gap: 12,
        maxWidth: 420,
      }}
    >
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ opacity: 0.85 }}>Password</span>

          <button
            type="button"
            onClick={sendReset}
            disabled={resetLoading}
            style={{
              fontSize: 12,
              border: "none",
              background: "transparent",
              cursor: resetLoading ? "not-allowed" : "pointer",
              textDecoration: "underline",
              opacity: 0.7,
              padding: 0,
            }}
            title="Send a password reset email"
          >
            {resetLoading ? "Sending..." : "Forgot your password?"}
          </button>
        </div>

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
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

      {/* Buttons below password */}
      <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            border: "1px solid #444",
            borderRadius: 12,
            cursor: loading ? "not-allowed" : "pointer",
            background: "transparent",
            fontWeight: 900,
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <Link
          href="/register"
          style={{
            padding: 12,
            border: "1px solid #444",
            borderRadius: 12,
            textDecoration: "none",
            display: "block",
            textAlign: "center",
            opacity: 0.9,
            fontWeight: 800,
          }}
        >
          Create Account
        </Link>
      </div>

      {resetMsg && (
        <p style={{ margin: 0, color: "limegreen", fontWeight: 800 }}>
          {resetMsg}
        </p>
      )}

      {error && (
        <p style={{ margin: 0, color: "crimson", fontWeight: 700 }}>
          {error}
        </p>
      )}
    </form>
  );
}