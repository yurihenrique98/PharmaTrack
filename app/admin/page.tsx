"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase/client";
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";

type Product = {
  id: string;
  name: string;
  price: number;
  category?: string;
  stock?: number;
  requiresPrescription?: boolean;
  active?: boolean; // controls if product is visible in the shop
};

type Order = {
  id: string;
  email: string | null;
  uid: string;
  total: number;
  status: string;
  createdAt?: any;
  items: { name: string; qty: number; price: number; lineTotal: number }[];
};

type AppUser = {
  id: string; // uid
  email?: string | null;
  displayName?: string;
  isAdmin?: boolean;
  createdAt?: any;
};

export default function AdminDashboard() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(
    null
  );

  // // Per-box messages
  const [boxMsg, setBoxMsg] = useState<
    Record<string, { text: string; type: "error" | "success" } | null>
  >({
    addProduct: null,
    manageProducts: null,
    orders: null,
    users: null,
  });

  function setBoxError(box: keyof typeof boxMsg, text: string) {
    setBoxMsg((p) => ({ ...p, [box]: { text, type: "error" } }));
  }
  function setBoxSuccess(box: keyof typeof boxMsg, text: string) {
    setBoxMsg((p) => ({ ...p, [box]: { text, type: "success" } }));
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Add product form
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pStock, setPStock] = useState("");
  const [pRx, setPRx] = useState(false);

  const canUseAdmin = useMemo(() => !checking && isAdmin, [checking, isAdmin]);

  async function loadProducts() {
    const qy = query(collection(db, "products"), orderBy("name", "asc"));
    const snap = await getDocs(qy);

    const list: Product[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name ?? "Unnamed",
        price: Number(data.price ?? 0),
        category: data.category ?? "",
        stock: typeof data.stock === "number" ? data.stock : Number(data.stock ?? 0),
        requiresPrescription: Boolean(data.requiresPrescription),
        active: data.active !== false, // // default active=true if missing
      };
    });

    setProducts(list);
  }

  async function loadOrders() {
    const qy = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(qy);

    const list: Order[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        email: data.email ?? null,
        uid: data.uid,
        total: Number(data.total ?? 0),
        status: data.status ?? "pending",
        createdAt: data.createdAt,
        items: Array.isArray(data.items) ? data.items : [],
      };
    });

    setOrders(list);
  }

  async function loadUsers() {
    const snap = await getDocs(collection(db, "users"));
    const list: AppUser[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        email: data.email ?? null,
        displayName: data.displayName ?? "",
        isAdmin: Boolean(data.isAdmin),
        createdAt: data.createdAt,
      };
    });

    list.sort((a, b) => String(a.email ?? "").localeCompare(String(b.email ?? "")));
    setUsers(list);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setMsg(null);
      setChecking(true);
      setIsAdmin(false);

      setProducts([]);
      setOrders([]);
      setUsers([]);

      setBoxMsg({
        addProduct: null,
        manageProducts: null,
        orders: null,
        users: null,
      });

      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const adminFlag = Boolean(
          snap.exists() && (snap.data() as any).isAdmin === true
        );
        setIsAdmin(adminFlag);

        if (adminFlag) {
          setDataLoading(true);
          await Promise.all([loadProducts(), loadOrders(), loadUsers()]);
        }
      } catch (e: any) {
        setMsg({ text: e?.message ?? "Failed to check admin role", type: "error" });
      } finally {
        setChecking(false);
        setDataLoading(false);
      }
    });

    return () => unsub();
  }, []);

  async function addProduct() {
    setBoxMsg((p) => ({ ...p, addProduct: null }));
    try {
      await addDoc(collection(db, "products"), {
        name: pName.trim(),
        price: Number(pPrice),
        category: pCategory.trim(),
        stock: Number(pStock),
        requiresPrescription: Boolean(pRx),
        active: true, 
        createdAt: serverTimestamp(),
      });

      setPName("");
      setPPrice("");
      setPCategory("");
      setPStock("");
      setPRx(false);

      await loadProducts();
      setBoxSuccess("addProduct", "Product added successfully.");
    } catch (e: any) {
      setBoxError("addProduct", e?.message ?? "Failed to add product");
    }
  }

  async function updateProduct(id: string, patch: Partial<Product>) {
    setBoxMsg((p) => ({ ...p, manageProducts: null }));
    try {
      await updateDoc(doc(db, "products", id), patch as any);
      await loadProducts();
      setBoxSuccess("manageProducts", "Product updated.");
    } catch (e: any) {
      setBoxError("manageProducts", e?.message ?? "Failed to update product");
    }
  }
  // disable product (active=false) and optionally set stock to 0.
  async function disableProduct(id: string) {
    setBoxMsg((p) => ({ ...p, manageProducts: null }));
    try {
      await updateDoc(doc(db, "products", id), {
        active: false,
        stock: 0,
      } as any);

      await loadProducts();
      setBoxSuccess("manageProducts", "Product disabled (not deleted).");
    } catch (e: any) {
      setBoxError("manageProducts", e?.message ?? "Failed to disable product");
    }
  }

  async function enableProduct(id: string) {
    setBoxMsg((p) => ({ ...p, manageProducts: null }));
    try {
      await updateDoc(doc(db, "products", id), { active: true } as any);
      await loadProducts();
      setBoxSuccess("manageProducts", "Product enabled.");
    } catch (e: any) {
      setBoxError("manageProducts", e?.message ?? "Failed to enable product");
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    setBoxMsg((p) => ({ ...p, orders: null }));
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      await loadOrders();
      setBoxSuccess("orders", "Order status updated.");
    } catch (e: any) {
      setBoxError("orders", e?.message ?? "Failed to update order status");
    }
  }

  async function saveUser(u: AppUser) {
    setBoxMsg((p) => ({ ...p, users: null }));
    try {
      await updateDoc(doc(db, "users", u.id), {
        displayName: (u.displayName ?? "").trim(),
      } as any);

      await loadUsers();
      setBoxSuccess("users", "User updated successfully.");
    } catch (e: any) {
      setBoxError("users", e?.message ?? "Failed to update user");
    }
  }

  async function sendReset(email?: string | null) {
    setBoxMsg((p) => ({ ...p, users: null }));
    try {
      if (!email) {
        setBoxError("users", "This user does not have an email saved.");
        return;
      }

      await sendPasswordResetEmail(auth, email);

      setBoxSuccess(
        "users",
        `Password reset email sent to ${email}. Check Spam/Junk if needed.`
      );
    } catch (e: any) {
      setBoxError("users", e?.message ?? "Failed to send password reset email");
    }
  }

  if (checking) return <p>Checking permissions…</p>;

  if (!canUseAdmin) {
    return (
      <div style={{ marginTop: 16 }}>
        <p style={{ color: "crimson", fontWeight: 800 }}>Access denied: Admins only.</p>
        <p style={{ opacity: 0.85 }}>Please log in with an admin account.</p>
        {msg?.type === "error" && <p style={{ color: "crimson" }}>{msg.text}</p>}
      </div>
    );
  }

  if (dataLoading) return <p>Loading admin data…</p>;

  const addDisabled =
    !pName.trim() || !pPrice.trim() || !pCategory.trim() || !pStock.trim();

  return (
    <section style={{ marginTop: 16, display: "grid", gap: 24 }}>
      {/* Add Product */}
      <div style={{ border: "1px solid #444", borderRadius: 12, padding: 14 }}>
        {/* message at top of this box */}
        {boxMsg.addProduct && (
          <p
            style={{
              margin: "0 0 10px 0",
              color: boxMsg.addProduct.type === "success" ? "limegreen" : "crimson",
              fontWeight: 800,
            }}
          >
            {boxMsg.addProduct.text}
          </p>
        )}

        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Add Product</h2>

        <div style={{ display: "grid", gap: 10, marginTop: 12, maxWidth: 520 }}>
          <input
            value={pName}
            onChange={(e) => setPName(e.target.value)}
            placeholder="Product name"
            style={{ padding: 10 }}
          />
          <input
            value={pPrice}
            onChange={(e) => setPPrice(e.target.value)}
            placeholder="Price (e.g., 2.99)"
            style={{ padding: 10 }}
          />
          <input
            value={pCategory}
            onChange={(e) => setPCategory(e.target.value)}
            placeholder="Category (e.g., Pain Relief)"
            style={{ padding: 10 }}
          />
          <input
            value={pStock}
            onChange={(e) => setPStock(e.target.value)}
            placeholder="Stock (e.g., 25)"
            style={{ padding: 10 }}
          />

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={pRx}
              onChange={(e) => setPRx(e.target.checked)}
            />
            Requires prescription
          </label>

          <button
            onClick={addProduct}
            disabled={addDisabled}
            style={{
              padding: 12,
              border: "1px solid #444",
              borderRadius: 10,
              cursor: addDisabled ? "not-allowed" : "pointer",
              background: "transparent",
              width: "fit-content",
              opacity: addDisabled ? 0.55 : 1,
              fontWeight: 800,
            }}
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Products */}
      <div style={{ border: "1px solid #444", borderRadius: 12, padding: 14 }}>
        {/* message at top of this box */}
        {boxMsg.manageProducts && (
          <p
            style={{
              margin: "0 0 10px 0",
              color:
                boxMsg.manageProducts.type === "success" ? "limegreen" : "crimson",
              fontWeight: 800,
            }}
          >
            {boxMsg.manageProducts.text}
          </p>
        )}

        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
          Manage Products
        </h2>

        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {products.map((p) => {
            const isActive = p.active !== false;

            return (
              <div
                key={p.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 12,
                  alignItems: "center",
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {p.name}{" "}
                    {!isActive ? (
                      <span style={{ opacity: 0.75, fontSize: 12 }}> (Disabled)</span>
                    ) : null}
                  </div>
                  <div style={{ opacity: 0.85 }}>
                    £{p.price.toFixed(2)} • {p.category ?? "General"} • Stock:{" "}
                    {typeof p.stock === "number" ? p.stock : "?"}{" "}
                    {p.requiresPrescription ? "• Prescription" : ""}
                  </div>
                </div>

                <button
                  onClick={() =>
                    updateProduct(p.id, { stock: Number((p.stock ?? 0) + 1) })
                  }
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #444",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: "transparent",
                    fontWeight: 800,
                  }}
                >
                  +1 Stock
                </button>

                {/* REPLACED: Delete -> Disable/Enable */}
                {isActive ? (
                  <button
                    onClick={() => disableProduct(p.id)}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #444",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: "transparent",
                      fontWeight: 800,
                    }}
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={() => enableProduct(p.id)}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #444",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: "transparent",
                      fontWeight: 800,
                    }}
                  >
                    Enable
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders */}
      <div style={{ border: "1px solid #444", borderRadius: 12, padding: 14 }}>
        {/* message at top of this box */}
        {boxMsg.orders && (
          <p
            style={{
              margin: "0 0 10px 0",
              color: boxMsg.orders.type === "success" ? "limegreen" : "crimson",
              fontWeight: 800,
            }}
          >
            {boxMsg.orders.text}
          </p>
        )}

        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Customer Orders</h2>

        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {orders.map((o) => (
            <div
              key={o.id}
              style={{ border: "1px solid #333", borderRadius: 12, padding: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {o.email ?? "Unknown email"} • £{o.total.toFixed(2)}
                  </div>
                  <div style={{ opacity: 0.85 }}>
                    Status: <b>{o.status}</b> • UID: {o.uid}
                  </div>
                </div>
                <div style={{ opacity: 0.85 }}>Order ID: {o.id}</div>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label style={{ opacity: 0.9 }}>
                  Update status:
                  <select
                    value={o.status}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    style={{
                      marginLeft: 8,
                      padding: 8,
                      borderRadius: 8,
                      background: "transparent",
                      border: "1px solid #444",
                    }}
                  >
                    <option value="pending">pending</option>
                    <option value="processing">processing</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </label>
              </div>

              <div style={{ marginTop: 10, opacity: 0.9 }}>
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
      </div>

      {/* Users */}
      <div style={{ border: "1px solid #444", borderRadius: 12, padding: 14 }}>
        {/* message at top of this box */}
        {boxMsg.users && (
          <p
            style={{
              margin: "0 0 10px 0",
              color: boxMsg.users.type === "success" ? "limegreen" : "crimson",
              fontWeight: 800,
            }}
          >
            {boxMsg.users.text}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Users</h2>

          <button
            onClick={loadUsers}
            style={{
              padding: "10px 12px",
              border: "1px solid #444",
              borderRadius: 10,
              cursor: "pointer",
              background: "transparent",
              fontWeight: 800,
            }}
          >
            Refresh Users
          </button>
        </div>

        <p style={{ marginTop: 10, opacity: 0.8 }}>
          Admin can edit user name and send a password reset email.
        </p>

        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                border: "1px solid #333",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  {u.email ?? "(no email)"}{" "}
                  {u.isAdmin ? <span style={{ color: "gold" }}> (Admin)</span> : null}
                </div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>UID: {u.id}</div>
              </div>

              <label style={{ display: "grid", gap: 6, maxWidth: 520 }}>
                <span style={{ opacity: 0.85 }}>Name</span>
                <input
                  value={u.displayName ?? ""}
                  onChange={(e) =>
                    setUsers((prev) =>
                      prev.map((x) =>
                        x.id === u.id ? { ...x, displayName: e.target.value } : x
                      )
                    )
                  }
                  placeholder="e.g. John Smith"
                  style={{ padding: 10 }}
                />
              </label>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => saveUser(u)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #444",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: "transparent",
                    fontWeight: 800,
                  }}
                >
                  Save Name
                </button>

                <button
                  onClick={() => sendReset(u.email ?? null)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #444",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: "transparent",
                    opacity: 0.9,
                    fontWeight: 800,
                  }}
                >
                  Send Password Reset Email
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}