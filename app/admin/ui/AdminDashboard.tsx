// app/admin/page.tsx (or wherever your AdminDashboard component file is)

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  setDoc,
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
  disabled?: boolean; // added
  createdAt?: any;
};

type SectionMsg = { text: string; type: "error" | "success" } | null;

function normaliseCategory(raw: any) {
  const c = String(raw ?? "").trim();
  if (!c) return "General";
  const lower = c.toLowerCase();
  if (lower === "generall" || lower === "general ") return "General";
  return c;
}

export default function AdminDashboard() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Messages per section (shown INSIDE each box)
  const [addProductMsg, setAddProductMsg] = useState<SectionMsg>(null);
  const [manageProductsMsg, setManageProductsMsg] = useState<SectionMsg>(null);
  const [ordersMsg, setOrdersMsg] = useState<SectionMsg>(null);
  const [usersMsg, setUsersMsg] = useState<SectionMsg>(null);

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

  function setSectionError(
    section: "addProduct" | "manageProducts" | "orders" | "users",
    text: string
  ) {
    const msg = { text, type: "error" as const };
    if (section === "addProduct") setAddProductMsg(msg);
    if (section === "manageProducts") setManageProductsMsg(msg);
    if (section === "orders") setOrdersMsg(msg);
    if (section === "users") setUsersMsg(msg);
  }

  function setSectionSuccess(
    section: "addProduct" | "manageProducts" | "orders" | "users",
    text: string
  ) {
    const msg = { text, type: "success" as const };
    if (section === "addProduct") setAddProductMsg(msg);
    if (section === "manageProducts") setManageProductsMsg(msg);
    if (section === "orders") setOrdersMsg(msg);
    if (section === "users") setUsersMsg(msg);
  }

  function clearSectionMsg(section: "addProduct" | "manageProducts" | "orders" | "users") {
    if (section === "addProduct") setAddProductMsg(null);
    if (section === "manageProducts") setManageProductsMsg(null);
    if (section === "orders") setOrdersMsg(null);
    if (section === "users") setUsersMsg(null);
  }

  function UserLabel({ u }: { u: AppUser }) {
    // Show updated name if present, otherwise fallback to email prefix
    const email = u.email ?? "";
    const emailPrefix = email.includes("@") ? email.split("@")[0] : email;
    const label = (u.displayName ?? "").trim() || emailPrefix || "(no email)";
    return (
      <span style={{ fontWeight: 800 }}>
        {label}
        {u.isAdmin ? <span style={{ color: "gold" }}> • Admin</span> : null}
        {u.disabled ? <span style={{ color: "crimson" }}> • Disabled</span> : null}
      </span>
    );
  }

  async function loadProducts() {
    const q = query(collection(db, "products"), orderBy("name", "asc"));
    const snap = await getDocs(q);

    const list: Product[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name ?? "Unnamed",
        price: Number(data.price ?? 0),
        category: data.category,
        stock: typeof data.stock === "number" ? data.stock : undefined,
        requiresPrescription: Boolean(data.requiresPrescription),
      };
    });

    setProducts(list);
  }

  async function loadOrders() {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

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
        disabled: Boolean(data.disabled), // added
        createdAt: data.createdAt,
      };
    });

    list.sort((a, b) => String(a.email ?? "").localeCompare(String(b.email ?? "")));
    setUsers(list);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setChecking(true);
      setIsAdmin(false);

      // Clear everything
      setAddProductMsg(null);
      setManageProductsMsg(null);
      setOrdersMsg(null);
      setUsersMsg(null);

      setProducts([]);
      setOrders([]);
      setUsers([]);

      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const adminFlag = Boolean(snap.exists() && (snap.data() as any).isAdmin === true);
        setIsAdmin(adminFlag);

        if (adminFlag) {
          setDataLoading(true);
          await Promise.all([loadProducts(), loadOrders(), loadUsers()]);
        }
      } catch (e: any) {
        setSectionError("users", e?.message ?? "Failed to check admin role");
      } finally {
        setChecking(false);
        setDataLoading(false);
      }
    });

    return () => unsub();
  }, []);

  async function addProduct() {
    clearSectionMsg("addProduct");

    try {
      await addDoc(collection(db, "products"), {
        name: pName.trim(),
        price: Number(pPrice),
        category: pCategory.trim(),
        stock: Number(pStock),
        requiresPrescription: Boolean(pRx),
        createdAt: serverTimestamp(),
      });

      setPName("");
      setPPrice("");
      setPCategory("");
      setPStock("");
      setPRx(false);

      await loadProducts();
      setSectionSuccess("addProduct", "Product added successfully.");
      setManageProductsMsg(null);
    } catch (e: any) {
      setSectionError("addProduct", e?.message ?? "Failed to add product");
    }
  }

  async function updateProduct(id: string, patch: Partial<Product>) {
    clearSectionMsg("manageProducts");

    try {
      const safePatch: any = { ...patch };
      if ("category" in safePatch) safePatch.category = String(safePatch.category ?? "").trim();

      await updateDoc(doc(db, "products", id), safePatch);
      await loadProducts();
      setSectionSuccess("manageProducts", "Product updated.");
  
      setAddProductMsg(null);
    } catch (e: any) {
      setSectionError("manageProducts", e?.message ?? "Failed to update product");
    }
  }
  
  async function removeProduct(id: string) {
    clearSectionMsg("manageProducts");

    try {
      await deleteDoc(doc(db, "products", id));
      await loadProducts();
      setSectionSuccess("manageProducts", "Product deleted.");
      setAddProductMsg(null);
    } catch (e: any) {
      setSectionError("manageProducts", e?.message ?? "Failed to delete product");
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    clearSectionMsg("orders");

    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      await loadOrders();
      setSectionSuccess("orders", "Order status updated.");
    } catch (e: any) {
      setSectionError("orders", e?.message ?? "Failed to update order status");
    }
  }

  // Save user's displayName (this does NOT rename their Firebase Auth email)
  async function saveUser(u: AppUser) {
    clearSectionMsg("users");

    try {
      const name = String(u.displayName ?? "").trim();
      // setDoc + merge ensures it works even if the user document does not exist yet
      await setDoc(
        doc(db, "users", u.id),
        { displayName: name },
        { merge: true }
      );

      // Update UI immediately
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, displayName: name } : x))
      );

      setSectionSuccess("users", "User name updated successfully.");
    } catch (e: any) {
      setSectionError("users", e?.message ?? "Failed to update user");
    }
  }

  async function sendReset(email?: string | null) {
    clearSectionMsg("users");

    try {
      if (!email) {
        setSectionError("users", "This user does not have an email saved.");
        return;
      }

      await sendPasswordResetEmail(auth, email);

      setSectionSuccess(
        "users",
        `Password reset email sent to ${email}. If you don't see it, check your Spam or Junk folder.`
      );
    } catch (e: any) {
      setSectionError("users", e?.message ?? "Failed to send password reset email");
    }
  }

  // Soft-disable / enable user ( works with Firestore rules)
  async function setUserDisabled(uid: string, disabled: boolean) {
    clearSectionMsg("users");

    try {
      // setDoc+merge make it works even if doc doesn't exist
      await setDoc(doc(db, "users", uid), { disabled }, { merge: true });

      setUsers((prev) => prev.map((x) => (x.id === uid ? { ...x, disabled } : x)));
      setSectionSuccess("users", disabled ? "User disabled." : "User enabled.");
    } catch (e: any) {
      setSectionError("users", e?.message ?? "Failed to update user status");
    }
  }

  function MsgLine({ msg }: { msg: SectionMsg }) {
    if (!msg) return null;

    return (
      <p
        style={{
          margin: 0,
          marginTop: 10,
          color: msg.type === "success" ? "limegreen" : "crimson",
          fontWeight: 800,
        }}
      >
        {msg.text}
      </p>
    );
  }

  // 1) Loading
  if (checking) return <p>Checking permissions…</p>;

  // 2) Access denied (non-admins)
  if (!canUseAdmin) {
    return (
      <div style={{ marginTop: 16 }}>
        <p style={{ color: "crimson", fontWeight: 800 }}>Access denied: Admins only.</p>
        <p style={{ opacity: 0.85 }}>Please log in with an admin account.</p>
      </div>
    );
  }

  // 3) Admin loading data
  if (dataLoading) return <p>Loading admin data…</p>;

  const addDisabled =
    !pName.trim() || !pPrice.trim() || !pCategory.trim() || !pStock.trim();

  // 4) Admin view
  return (
    <section style={{ marginTop: 16, display: "grid", gap: 24 }}>
      {/* Add Product */}
      <div style={{ border: "1px solid #444", borderRadius: 12, padding: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Add Product</h2>
        <MsgLine msg={addProductMsg} />

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
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Manage Products</h2>
        <MsgLine msg={manageProductsMsg} />

        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {products.map((p) => (
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
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>{p.name}</div>
                <div style={{ opacity: 0.85 }}>
                  £{p.price.toFixed(2)} • {normaliseCategory(p.category)} • Stock:{" "}
                  {typeof p.stock === "number" ? p.stock : "?"}{" "}
                  {p.requiresPrescription ? "• Prescription" : ""}
                </div>
              </div>

              <button
                onClick={() => updateProduct(p.id, { stock: Number((p.stock ?? 0) + 1) })}
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

              <button
                onClick={() => removeProduct(p.id)}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #444",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: "transparent",
                  fontWeight: 800,
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div style={{ border: "1px solid #444", borderRadius: 12, padding: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Customer Orders</h2>
        <MsgLine msg={ordersMsg} />

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
            onClick={async () => {
              clearSectionMsg("users");
              try {
                await loadUsers();
                setSectionSuccess("users", "Users refreshed.");
              } catch (e: any) {
                setSectionError("users", e?.message ?? "Failed to refresh users.");
              }
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
            Refresh Users
          </button>
        </div>

        <p style={{ marginTop: 10, opacity: 0.8 }}>
          Admin can edit user name, send a password reset email, and disable/enable accounts.
        </p>

        <MsgLine msg={usersMsg} />

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
                <UserLabel u={u} />
                <div style={{ opacity: 0.7, fontSize: 12 }}>UID: {u.id}</div>
              </div>

              <div style={{ opacity: 0.85 }}>
                <b>Email:</b> {u.email ?? "(not set)"}
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
                  Reset Password by Email
                </button>

                <button
                  onClick={() => setUserDisabled(u.id, !Boolean(u.disabled))}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #444",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: "transparent",
                    fontWeight: 800,
                    color: u.disabled ? "limegreen" : "crimson",
                  }}
                >
                  {u.disabled ? "Enable User" : "Disable User"}
                </button>

                {/* NOTE:
                    True deletion of another user's AUTH account requires Firebase Admin SDK (server-side).
                    This button is intentionally replaced by disable/enable to avoid permission errors.
                */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}