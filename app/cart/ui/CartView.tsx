"use client";

import { useMemo, useState } from "react";
import CheckoutButton from "./CheckoutButton";
import { useCart } from "@/app/lib/cart/CartContext";

type Msg = { type: "error" | "success"; text: string } | null;

export default function CartView() {
  const { items, removeItem, setQty, clear, total } = useCart();
  const [msg, setMsg] = useState<Msg>(null);
  const safeItems = useMemo(() => {
    return (items ?? []).map((it) => ({
      ...it,
      name: String(it.name ?? "Item"),
      price: Number(it.price ?? 0),
      qty: Number(it.qty ?? 1),
      stock: typeof it.stock === "number" ? it.stock : undefined,
    }));
  }, [items]);

  const safeTotal = Number(total ?? 0);

  return (
    <section style={{ marginTop: 16, display: "grid", gap: 14 }}>

      {msg && (
        <p style={{ margin: 0, color: msg.type === "success" ? "limegreen" : "crimson", fontWeight: 800 }}>
          {msg.text}
        </p>
      )}

      {safeItems.length === 0 ? (
        <p style={{ opacity: 0.85 }}>Your cart is empty.</p>
      ) : (
        <>
          <div style={{ display: "grid", gap: 10 }}>
            {safeItems.map((it) => {
              const lineTotal = Number(it.price ?? 0) * Number(it.qty ?? 0);
              const maxQty = typeof it.stock === "number" ? Math.max(1, it.stock) : 99;

              return (
                <div
                  key={it.id}
                  style={{
                    border: "1px solid #333",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{it.name}</div>
                    <div style={{ opacity: 0.85 }}>
                      £{Number(it.price).toFixed(2)} • Line: £{Number(lineTotal).toFixed(2)}
                      {typeof it.stock === "number" ? ` • Stock: ${it.stock}` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ opacity: 0.85 }}>Qty</span>
                      <input
                        type="number"
                        min={1}
                        max={maxQty}
                        value={it.qty}
                        onChange={(e) => {
                          const next = Number(e.target.value);
                          if (!Number.isFinite(next)) return;
                          setQty(it.id, next);
                        }}
                        style={{
                          width: 72,
                          padding: 8,
                          border: "1px solid #444",
                          borderRadius: 10,
                          background: "transparent",
                        }}
                      />
                    </label>

                    <button
                      onClick={() => removeItem(it.id)}
                      style={{
                        padding: "10px 12px",
                        border: "1px solid #444",
                        borderRadius: 10,
                        cursor: "pointer",
                        background: "transparent",
                        fontWeight: 800,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              border: "1px solid #333",
              borderRadius: 12,
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              Total: £{safeTotal.toFixed(2)}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  clear();
                  setMsg({ type: "success", text: "Cart cleared." });
                }}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #444",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: "transparent",
                  fontWeight: 800,
                }}
              >
                Clear cart
              </button>

              <CheckoutButton onMsg={setMsg} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}