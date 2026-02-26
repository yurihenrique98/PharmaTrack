"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebase/client";

export default function AuthStatus() {
  const [label, setLabel] = useState("Checking…");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setLabel(user ? "Signed in" : "Guest");
    });
    return () => unsub();
  }, []);

  return <span style={{ opacity: 0.9 }}>{label}</span>;
}