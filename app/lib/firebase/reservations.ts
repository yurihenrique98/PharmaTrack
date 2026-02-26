"use client";

import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase/client";

export const HOLD_MINUTES = 15;

export function reservationDocId(uid: string, productId: string) {
  return `${uid}_${productId}`;
}

export function expiresInMinutes(minutes: number) {
  const ms = minutes * 60 * 1000;
  return Timestamp.fromMillis(Date.now() + ms);
}

export async function upsertReservation(productId: string, qty: number) {
  const user = auth.currentUser;
  if (!user) return;

  const id = reservationDocId(user.uid, productId);
  await setDoc(
    doc(db, "reservations", id),
    {
      uid: user.uid,
      productId,
      qty,
      expiresAt: expiresInMinutes(HOLD_MINUTES),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteReservation(productId: string) {
  const user = auth.currentUser;
  if (!user) return;

  const id = reservationDocId(user.uid, productId);
  await deleteDoc(doc(db, "reservations", id));
}

export function isActiveReservation(expiresAt: any) {
  try {
    const date =
      expiresAt?.toDate ? expiresAt.toDate() : expiresAt instanceof Date ? expiresAt : null;
    if (!date) return false;
    return date.getTime() > Date.now();
  } catch {
    return false;
  }
}