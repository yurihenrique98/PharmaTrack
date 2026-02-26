"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase/client";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

type OrderItem = {
  name: string;
  qty: number;
  price: number;
  lineTotal: number;
};

type Order = {
  id: string;
  total: number;
  status: string;
  createdAt?: any;
  items: OrderItem[];
};

function formatDate(createdAt: any) {
  try {
    if (createdAt?.toDate) return createdAt.toDate().toLocaleString();
    return "";
  } catch {
    return "";
  }
}

function statusBadge(status: string) {
  const s = (status || "").toLowerCase();

  let label = status || "pending";
  let border = "#444";
  let color = "#ddd";

  if (s === "pending") {
    border = "#aa6";
    color = "gold";
  } else if (s === "processing") {
    border = "#6af";
    color = "#9cf";
  } else if (s === "completed") {
    border = "#6a6";
    color = "limegreen";
  } else if (s === "cancelled") {
    border = "#a66";
    color = "crimson";
  }

  return (
    <span
      style={{
        fontSize: 12,
        padding: "2px 10px",
        border: `1px solid ${border}`,
        borderRadius: 999,
        color,
        fontWeight: 700,
        textTransform: "lowercase",
      }}
    >
      {label}
    </span>
  );
}

export default function MyOrders() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let unsubscribeOrders: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setErr("");
      setLoading(true);

      // stop previous listener if any
      if (unsubscribeOrders) {
        unsubscribeOrders();
        unsubscribeOrders = null;
      }

      if (!user) {
        setUid(null);
        setOrders([]);
        setLoading(false);
        return;
      }

      setUid(user.uid);

      try {
        const q = query(
          collection(db, "orders"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        unsubscribeOrders = onSnapshot(
          q,
          (snap) => {
            const list: Order[] = snap.docs.map((d) => {
              const data = d.data() as any;
              return {
                id: d.id,
                total: Number(data.total ?? 0),
                status: data.status ?? "pending",
                createdAt: data.createdAt,
                items: Array.isArray(data.items) ? data.items : [],
              };
            });

            setOrders(list);
            setLoading(false);
          },
          (e: any) => {
            setErr(e?.message ?? "Failed to load orders");
            setLoading(false);
          }
        );
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load orders");
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      unsubscribeAuth();
    };
  }, []);

  if (loading) return <p>Loading your orders…</p>;

  if (!uid) {
    return (
      <p style={{ color: "crimson" }}>
        You must be logged in to view your orders.
      </p>
    );
  }

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;

  if (!orders.length) return <p>You don’t have any orders yet.</p>;

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
      {orders.map((o) => (
        <div
          key={o.id}
          style={{
            border: "1px solid #444",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "baseline",
            }}
          >
            <div>
              <div style={{ fontWeight: 800, display: "flex", gap: 10, alignItems: "center" }}>
                <span>Order • £{o.total.toFixed(2)}</span>
                {statusBadge(o.status)}
              </div>

              <div style={{ opacity: 0.85 }}>
                {o.createdAt ? formatDate(o.createdAt) : ""}
              </div>
            </div>

            <div style={{ opacity: 0.8, fontSize: 13 }}>
              ID: {o.id}
            </div>
          </div>

          <div style={{ marginTop: 10, opacity: 0.95 }}>
            <b>Items:</b>
            <ul style={{ marginTop: 6 }}>
              {o.items.map((it, idx) => (
                <li key={idx}>
                  {it.name} — qty {it.qty} — £{Number(it.lineTotal).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}