import PharmacyMapClient from "./ui/PharmacyMap.client";
import PharmacyMap from "./ui/PharmacyMap.client";

export default function PharmaciesPage() {
  return (
    <main style={{ maxWidth: 1100, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Pharmacies Map</h1>
      <p style={{ opacity: 0.85 }}>
        Click a marker to view pharmacy details and order available products.
      </p>

      <PharmacyMapClient />
    </main>
  );
}