"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deleteReservation, upsertReservation } from "@/app/lib/firebase/reservations";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  stock?: number;
};

export type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "pharmacy_cart_v1";

function clampQty(qty: number, stock?: number) {
  let q = Number.isFinite(qty) ? Math.floor(qty) : 1;
  q = Math.max(1, Math.min(99, q));
  if (typeof stock === "number") q = Math.min(q, stock);
  return q;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  function addItem(item: Omit<CartItem, "qty">) {
    setItems((prev) => {
      const existing = prev.find((x) => x.id === item.id);

      if (typeof item.stock === "number" && item.stock <= 0) return prev;

      if (existing) {
        const nextStock = typeof item.stock === "number" ? item.stock : existing.stock;
        const nextQty = clampQty(existing.qty + 1, nextStock);

        upsertReservation(item.id, nextQty).catch(() => {});

        return prev.map((x) =>
          x.id === item.id
            ? { ...x, price: item.price, name: item.name, stock: nextStock, qty: nextQty }
            : x
        );
      }

      const firstQty = clampQty(1, item.stock);
      upsertReservation(item.id, firstQty).catch(() => {});

      return [
        ...prev,
        {
          ...item,
          stock: item.stock,
          qty: firstQty,
        },
      ];
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
    deleteReservation(id).catch(() => {});
  }

  function setQty(id: string, qty: number) {
    setItems((prev) => {
      const next = prev.map((x) => {
        if (x.id !== id) return x;
        const newQty = clampQty(qty, x.stock);

        upsertReservation(id, newQty).catch(() => {});
        return { ...x, qty: newQty };
      });

      return next;
    });
  }

  function clear() {
    items.forEach((x) => deleteReservation(x.id).catch(() => {}));
    setItems([]);
  }

  const total = useMemo(
    () => items.reduce((sum, x) => sum + Number(x.price ?? 0) * Number(x.qty ?? 0), 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQty, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}