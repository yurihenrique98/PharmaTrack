import Link from "next/link";
import AccountBadge from "./ui/AccountBadge";
import AuthStatus from "./ui/AuthStatus";

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 950,
        margin: "48px auto",
        padding: 16,
      }}
    >
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, margin: 0 }}>
          Community Pharmacy Ordering
        </h1>

        <p style={{ marginTop: 10, opacity: 0.85, fontSize: 16 }}>
          A secure ordering platform for customers and pharmacy staff.
        </p>
      </header>

      <section
        style={{
          border: "1px solid #2f2f2f",
          borderRadius: 16,
          padding: 18,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
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
              <div style={{ fontSize: 14, opacity: 0.75 }}>Account</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                <AccountBadge />
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, opacity: 0.75 }}>Status</div>
              <AuthStatus />
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.08)",
              margin: "8px 0",
            }}
          />

          {/* Buttons always visible; Navbar controls login/logout */}
          <div style={{ display: "grid", gap: 10, maxWidth: 360 }}>
            
            {/* NEW BUTTON ADDED HERE */}
            <Link
              href="/pharmacies"
              style={{
                padding: "12px 14px",
                border: "1px solid #444",
                borderRadius: 12,
                textDecoration: "none",
                display: "block",
              }}
            >
              Pharmacies
            </Link>

            <Link
              href="/products"
              style={{
                padding: "12px 14px",
                border: "1px solid #444",
                borderRadius: 12,
                textDecoration: "none",
                display: "block",
              }}
            >
              View Products
            </Link>

            <Link
              href="/cart"
              style={{
                padding: "12px 14px",
                border: "1px solid #444",
                borderRadius: 12,
                textDecoration: "none",
                display: "block",
              }}
            >
              Cart
            </Link>

            <Link
              href="/orders"
              style={{
                padding: "12px 14px",
                border: "1px solid #444",
                borderRadius: 12,
                textDecoration: "none",
                display: "block",
              }}
            >
              My Orders
            </Link>

            <Link
              href="/admin"
              style={{
                padding: "12px 14px",
                border: "1px solid #444",
                borderRadius: 12,
                textDecoration: "none",
                display: "block",
              }}
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}