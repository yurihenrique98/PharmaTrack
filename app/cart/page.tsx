import CartView from "./ui/CartView";

export default function CartPage() {
  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Cart</h1>
      <CartView />
    </main>
  );
}