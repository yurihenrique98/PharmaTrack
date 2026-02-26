"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase/client";
import { useCart } from "@/app/lib/cart/CartContext";

type Msg = { type: "error" | "success"; text: string } | null;

export default function CheckoutButton({ onMsg }: { onMsg?: (m: Msg) => void }) {
  const { items, clear, total } = useCart();
  const [loading, setLoading] = useState(false);

  async function checkout() {
    onMsg?.(null);

    if (!auth.currentUser) {
      onMsg?.({ type: "error", text: "You must be logged in to checkout." });
      return;
    }

    if (!items.length) {
      onMsg?.({ type: "error", text: "Your cart is empty." });
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;

      const safeItems = items.map((it) => {
        const price = Number(it.price ?? 0);
        const qty = Number(it.qty ?? 0);
        return {
          productId: it.id,
          name: String(it.name ?? "Item"),
          qty,
          price,
          lineTotal: price * qty,
        };
      });

      const safeTotal = Number(total ?? 0);

      await addDoc(collection(db, "orders"), {
        uid: user.uid,
        email: user.email ?? null,
        items: safeItems,
        total: safeTotal,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      clear();
      onMsg?.({ type: "success", text: "Order placed successfully." });
    } catch (e: any) {
      onMsg?.({ type: "error", text: e?.message ?? "Checkout failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={checkout}
      disabled={loading}
      style={{
        padding: "10px 12px",
        border: "1px solid #444",
        borderRadius: 10,
        cursor: loading ? "not-allowed" : "pointer",
        background: "transparent",
        fontWeight: 900,
        opacity: loading ? 0.65 : 1,
      }}
    >
      {loading ? "Processing..." : "Checkout"}
    </button>
  );
}