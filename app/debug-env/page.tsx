export default function DebugEnvPage() {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  return (
    <main style={{ padding: 20 }}>
      <p>Loaded: {key ? "YES" : "NO"}</p>
      <p>Starts with: {key ? key.slice(0, 6) : "(missing)"}</p>
    </main>
  );
}