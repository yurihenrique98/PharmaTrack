"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase/client";

type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  isAdmin: boolean;
};

function emailPrefix(email: string | null) {
  if (!email) return "User";
  return email.includes("@") ? email.split("@")[0] : email;
}

export function useUserProfile() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const userRef = doc(db, "users", u.uid);

      try {
        await setDoc(
          userRef,
          {
            email: u.email ?? null,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
      }

      unsubDoc = onSnapshot(
        userRef,
        (snap) => {
          const data = snap.exists() ? (snap.data() as any) : {};
          const displayName = String(data.displayName ?? "").trim();

          setProfile({
            uid: u.uid,
            email: u.email ?? null,
            displayName: displayName || emailPrefix(u.email ?? null),
            isAdmin: Boolean(data.isAdmin),
          });

          setLoading(false);
        },
        () => {
          setProfile({
            uid: u.uid,
            email: u.email ?? null,
            displayName: emailPrefix(u.email ?? null),
            isAdmin: false,
          });
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubDoc) unsubDoc();
      unsubAuth();
    };
  }, []);

  return { loading, user, profile };
}