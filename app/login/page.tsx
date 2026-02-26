import LoginForm from "./ui/LoginForm";

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 520, margin: "48px auto", padding: 16 }}>
      <div
        style={{
          border: "1px solid #2f2f2f",
          borderRadius: 16,
          padding: 18,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h1
          style={{
            fontSize: 34,
            fontWeight: 900,
            margin: 0,
            letterSpacing: 0.2,
          }}
        >
          Pharmacy Login
        </h1>

        <LoginForm />
      </div>
    </main>
  );
}