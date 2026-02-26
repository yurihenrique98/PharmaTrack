import MyOrders from "./ui/MyOrders";

export default function OrdersPage() {
  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>My Orders</h1>
      <p style={{ opacity: 0.8 }}>
        View your previous orders and current status.
      </p>

      <MyOrders />
    </main>
  );
}