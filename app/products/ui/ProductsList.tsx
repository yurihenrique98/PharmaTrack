"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { useCart } from "@/app/lib/cart/CartContext";

type Product = {
  id: string;
  name: string;
  price: number;
  category?: string;
  stock?: number;
  requiresPrescription?: boolean;
};

export default function ProductsList({
  pharmacyId,
}: {
  pharmacyId: string | null;
}) {
  const cart = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // Pharmacy filter
  const [pharmacyName, setPharmacyName] = useState<string>("");
  const [allowedProductIds, setAllowedProductIds] = useState<Set<string> | null>(
    null
  );

  // Load products
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setMsg("");

      try {
        const snap = await getDocs(collection(db, "products"));

        const list: Product[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name ?? "Unnamed",
            price: Number(data.price ?? 0),
            category: data.category ?? "",
            stock:
              typeof data.stock === "number"
                ? data.stock
                : Number(data.stock ?? 0),
            requiresPrescription:
              data.requiresPrescription === true ||
              String(data.requiresPrescription).toLowerCase() === "true",
          };
        });

        list.sort((a, b) => String(a.name).localeCompare(String(b.name)));

        if (!alive) return;
        setProducts(list);
      } catch (e: any) {
        if (!alive) return;
        setMsg(e?.message ?? "Failed to load products.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  // Load selected pharmacy -> allowed productIds
  useEffect(() => {
    let alive = true;

    async function loadPharmacyFilter() {
      setPharmacyName("");
      setAllowedProductIds(null);
      setMsg("");

      if (!pharmacyId) return;

      try {
        const snap = await getDoc(doc(db, "pharmacies", pharmacyId));
        if (!snap.exists()) {
          if (alive) setMsg("Selected pharmacy not found.");
          return;
        }

        const data = snap.data() as any;

        const ids =
          (Array.isArray(data.productsId) && data.productsId) ||
          (Array.isArray(data.productIds) && data.productIds) ||
          (Array.isArray(data.productsIds) && data.productsIds) ||
          (Array.isArray(data.productsID) && data.productsID) ||
          (Array.isArray(data.ProductsId) && data.ProductsId) ||
          [];

        if (!alive) return;
        setPharmacyName(String(data.name ?? "Selected Pharmacy"));
        setAllowedProductIds(new Set(ids.map((x: any) => String(x))));
      } catch (e: any) {
        if (!alive) return;
        setMsg(e?.message ?? "Failed to load pharmacy filter.");
      }
    }

    loadPharmacyFilter();
    return () => {
      alive = false;
    };
  }, [pharmacyId]);

  // Reserved - how many of that product are currently in cart 
  const reservedByProductId = useMemo(() => {
    const map = new Map<string, number>();
    const items = (cart as any).items || (cart as any).cartItems || [];
    for (const it of items) {
      const id = String(it?.id ?? "");
      const qty = Number(it?.qty ?? 0);
      if (!id || qty <= 0) continue;
      map.set(id, (map.get(id) ?? 0) + qty);
    }
    return map;
  }, [cart]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (allowedProductIds && !allowedProductIds.has(p.id)) return;
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products, allowedProductIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cat = category.trim().toLowerCase();

    return products
      .filter((p) => {
        if (allowedProductIds && !allowedProductIds.has(p.id)) return false;

        const nameMatch = !q || String(p.name).toLowerCase().includes(q);
        const catTextMatch =
          !q || String(p.category ?? "").toLowerCase().includes(q);

        const catExactMatch =
          !cat || String(p.category ?? "").toLowerCase() === cat;

        return (nameMatch || catTextMatch) && catExactMatch;
      })
      .map((p) => {
        const reserved = reservedByProductId.get(p.id) ?? 0;
        const stock = typeof p.stock === "number" ? p.stock : 0;
        const available = Math.max(0, stock - reserved);
        return { ...p, reserved, available };
      });
  }, [products, search, category, allowedProductIds, reservedByProductId]);

  if (loading) return <p>Loading products…</p>;

  const addFn =
    (cart as any).addItem || (cart as any).addToCart || (cart as any).add;

  return (
    <section style={{ marginTop: 16, display: "grid", gap: 14 }}>
      {msg && <p style={{ color: "crimson", fontWeight: 800 }}>{msg}</p>}

      {pharmacyId && (
        <div
          style={{
            border: "1px solid #333",
            borderRadius: 12,
            padding: 12,
            opacity: 0.9,
          }}
        >
          <b>Showing products for:</b>{" "}
          {pharmacyName ? pharmacyName : "Selected Pharmacy"}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name or category..."
          style={{
            padding: 10,
            border: "1px solid #444",
            borderRadius: 12,
            minWidth: 320,
            background: "transparent",
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: 10,
            border: "1px solid #444",
            borderRadius: 12,
            background: "transparent",
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {pharmacyId && (
          <a
            href="/products"
            style={{
              padding: "10px 14px",
              border: "1px solid #444",
              borderRadius: 12,
              fontWeight: 800,
              textDecoration: "none",
              background: "transparent",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Clear pharmacy filter
          </a>
        )}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((p: any) => {
          const out = p.available <= 0;

          return (
            <div
              key={p.id}
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
                <div style={{ fontWeight: 900 }}>{p.name}</div>
                <div style={{ opacity: 0.85 }}>
                  £{Number(p.price).toFixed(2)} • {p.category || "General"} •
                  Stock: {typeof p.stock === "number" ? p.stock : 0}
                  {p.reserved ? ` • In cart: ${p.reserved}` : ""}
                  {" • "}
                  <b style={{ color: out ? "crimson" : "limegreen" }}>
                    Available: {p.available}
                  </b>
                  {p.requiresPrescription ? " • Prescription" : ""}
                </div>
              </div>

              <button
                onClick={() => {
                  if (p.available <= 0) return;
                  if (!addFn) {
                    alert(
                      "Cart add function not found. Check CartContext.tsx (addItem/addToCart/add)."
                    );
                    return;
                  }
                  // Add 1 item to cart
                  addFn({ id: p.id, name: p.name, price: p.price }, 1);
                }}
                disabled={out}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #444",
                  borderRadius: 10,
                  cursor: out ? "not-allowed" : "pointer",
                  background: "transparent",
                  opacity: out ? 0.6 : 1,
                  fontWeight: 800,
                }}
              >
                Add to cart
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p style={{ opacity: 0.8 }}>No products match your filters.</p>
        )}
      </div>
    </section>
  );
}