import Link from "next/link";
import RegisterForm from "./ui/RegisterForm";

export default function RegisterPage() {
  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Create Account</h1>
      <p style={{ marginTop: 8, opacity: 0.85 }}>
        Register with your email and password to place orders and view your order history.
      </p>

      <RegisterForm />

      <p style={{ marginTop: 14, opacity: 0.8 }}>
        Already have an account?{" "}
        <Link href="/login" style={{ textDecoration: "underline" }}>
          Login
        </Link>
      </p>
    </main>
  );
}