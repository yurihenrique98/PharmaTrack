"use client";

import { useSearchParams } from "next/navigation";
import ProductsList from "./ui/ProductsList";

export default function ProductsPage() {
  const params = useSearchParams();
  const pharmacyId = params.get("pharmacyId");
  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Products</h1>

      <ProductsList pharmacyId={pharmacyId} />
    </main>
  );
}