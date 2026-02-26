"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";

import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";

type Pharmacy = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;

  productIds: string[];
};

type Product = {
  id: string;
  name: string;
  price: number;
  category?: string;
  stock?: number;
  requiresPrescription?: boolean;
};

function makeDotIcon(color = "#22c55e") {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

function PopupContent({ pharmacy }: { pharmacy: Pharmacy }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setErr("");
      setLoading(true);

      try {
        const ids = Array.isArray(pharmacy.productIds) ? pharmacy.productIds : [];

        // If no IDs are linked, DO NOT fallback to "all products"
        if (ids.length === 0) {
          if (active) setProducts([]);
          return;
        }

        const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, "products", id))));

        const list: Product[] = snaps
          .filter((s) => s.exists())
          .map((s) => {
            const d = s.data() as any;
            return {
              id: s.id,
              name: d.name ?? "Unnamed",
              price: Number(d.price ?? 0),
              category: d.category ?? "",
              stock: typeof d.stock === "number" ? d.stock : Number(d.stock ?? 0),
              requiresPrescription: Boolean(d.requiresPrescription),
            };
          });

        list.sort((a, b) => String(a.name).localeCompare(String(b.name)));

        if (active) setProducts(list);
      } catch (e: any) {
        if (active) setErr(e?.message ?? "Failed to load pharmacy products.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [pharmacy.id, pharmacy.productIds]);

  return (
    <div
      style={{
        width: 320,
        maxWidth: 320,
        color: "#111",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 18 }}>{pharmacy.name}</div>

      <div style={{ opacity: 0.85, marginTop: 6, fontSize: 13 }}>
        {pharmacy.address}
      </div>

      <div style={{ marginTop: 6, opacity: 0.65, fontSize: 12 }}>
        Linked products: {Array.isArray(pharmacy.productIds) ? pharmacy.productIds.length : 0}
      </div>

      <hr style={{ margin: "10px 0", opacity: 0.25 }} />

      <div style={{ fontWeight: 800, marginBottom: 8 }}>Available products</div>

      {loading && <div style={{ opacity: 0.8 }}>Loading…</div>}
      {err && <div style={{ color: "crimson", fontWeight: 700 }}>{err}</div>}

      {!loading && !err && products.length === 0 && (
        <div style={{ opacity: 0.8 }}>No products linked to this pharmacy.</div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {products.slice(0, 6).map((p) => {
          const out = typeof p.stock === "number" && p.stock <= 0;

          return (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 10,
                display: "grid",
                gap: 4,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>

              <div style={{ opacity: 0.85, fontSize: 13 }}>
                £{Number(p.price).toFixed(2)} • {p.category || "General"}
                {" • "}Stock: {typeof p.stock === "number" ? p.stock : 0}
                {out ? " • Out of stock" : ""}
                {p.requiresPrescription ? " • Prescription" : ""}
              </div>
            </div>
          );
        })}
      </div>

      <a
        href={`/products?pharmacyId=${encodeURIComponent(pharmacy.id)}`}
        style={{
          display: "block",
          marginTop: 10,
          textAlign: "center",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid #222",
          textDecoration: "none",
          fontWeight: 900,
          background: "#111",
          color: "white",
        }}
      >
        Order Now
      </a>

      <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
        Tip: products page will be filtered to this pharmacy.
      </div>
    </div>
  );
}

export default function PharmacyMap() {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const layerRef = useRef<L.LayerGroup | null>(null);
  const destroyedRef = useRef(false);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const center = useMemo(() => ({ lat: 51.5072, lng: -0.1276 }), []);

  // Load pharmacies
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const snap = await getDocs(collection(db, "pharmacies"));

        const list: Pharmacy[] = snap.docs
          .map((d) => {
            const data = d.data() as any;

            const rawLat =
              data.lat ??
              data.latitude ??
              data.Latitude ??
              data.LATITUDE ??
              null;

            const rawLng =
              data.lng ??
              data.longitude ??
              data.Longitude ??
              data.LONGITUDE ??
              null;

            const ids =
              (Array.isArray(data.productIds) && data.productIds) ||
              (Array.isArray(data.productsId) && data.productsId) ||
              (Array.isArray(data.productsIds) && data.productsIds) ||
              (Array.isArray(data.ProductsId) && data.ProductsId) ||
              [];

            return {
              id: d.id,
              name: data.name ?? "Pharmacy",
              address: data.address ?? "",
              lat: rawLat !== null ? Number(rawLat) : NaN,
              lng: rawLng !== null ? Number(rawLng) : NaN,
              productIds: ids,
            };
          })
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

        if (alive) setPharmacies(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to load pharmacies.");
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  // Create map 
  useEffect(() => {
    destroyedRef.current = false;

    if (!mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, {
      // These reduce crashes in React/Next dev environments:
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView([center.lat, center.lng], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      destroyedRef.current = true;

      try {
        // Close popups & remove layers first
        map.closePopup();
        if (layerRef.current) {
          layerRef.current.remove();
          layerRef.current = null;
        }
      } catch {}

      try {
        map.remove();
      } catch {}

      mapRef.current = null;
    };
  }, [center.lat, center.lng]);

  // Render markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old layer group
    if (layerRef.current) {
      try {
        layerRef.current.remove();
      } catch {}
      layerRef.current = null;
    }

    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    pharmacies.forEach((ph) => {
      const marker = L.marker([ph.lat, ph.lng], { icon: makeDotIcon() }).addTo(layer);

      const popupId = `popup-${ph.id}`;
      let root: Root | null = null;

      marker.bindPopup(`<div id="${popupId}"></div>`, {
        maxWidth: 360,
        minWidth: 320,
      });

      marker.on("popupopen", () => {
        if (destroyedRef.current) return;

        const el = document.getElementById(popupId);
        if (!el) return;

        root = createRoot(el);
        root.render(<PopupContent pharmacy={ph} />);
      });

      marker.on("popupclose", () => {
        if (!root) return;

        // Unmount safely on next tick
        setTimeout(() => {
          try {
            root?.unmount();
          } catch {}
          root = null;
        }, 0);
      });

      marker.bindTooltip(ph.name, {
        permanent: true,
        direction: "top",
        offset: [0, -12],
        opacity: 0.85,
      });
    });

    // Fit bounds safely
    if (pharmacies.length && !destroyedRef.current) {
      try {
        const bounds = L.latLngBounds(
          pharmacies.map((p) => [p.lat, p.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40], animate: false });
      } catch {}
    }

    return () => {
      try {
        layer.remove();
      } catch {}
    };
  }, [pharmacies]);

async function searchAddress() {
  setSearchError("");
  if (!searchText.trim()) return;

  setSearchLoading(true);

  try {
    const q = searchText.trim().toLowerCase();

    // Local search: pharmacy name / address
    const matchPharmacy = pharmacies.find((p) => {
      const name = String(p.name ?? "").toLowerCase();
      const addr = String(p.address ?? "").toLowerCase();
      return name.includes(q) || addr.includes(q);
    });

    if (matchPharmacy) {
      if (!destroyedRef.current) {
        mapRef.current?.setView([matchPharmacy.lat, matchPharmacy.lng], 14, {
          animate: false,
        });
      }
      return;
    }

    // 2) Local search: product name / category inside linked products
    // We only search products that are linked to each pharmacy (ph.productIds)
    for (const ph of pharmacies) {
      const ids = Array.isArray(ph.productIds) ? ph.productIds : [];
      if (ids.length === 0) continue;

      try {
        const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, "products", id))));

        const found = snaps.find((s) => {
          if (!s.exists()) return false;
          const d = s.data() as any;

          const pname = String(d.name ?? "").toLowerCase();
          const pcat = String(d.category ?? "").toLowerCase();

          return pname.includes(q) || pcat.includes(q);
        });

        if (found) {
          if (!destroyedRef.current) {
            mapRef.current?.setView([ph.lat, ph.lng], 14, { animate: false });
          }
          return;
        }
      } catch {
      }
    }
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&q=" +
      encodeURIComponent(searchText) +
      "&limit=1";

    const res = await fetch(url);
    if (!res.ok) throw new Error("Search failed");

    const data = await res.json();
    if (!data.length) {
      setSearchError("No results found.");
      return;
    }

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);

    if (!destroyedRef.current) {
      mapRef.current?.setView([lat, lng], 13, { animate: false });
    }
  } catch (e: any) {
    setSearchError(e?.message ?? "Search error");
  } finally {
    setSearchLoading(false);
  }
}

  return (
    <section style={{ marginTop: 16 }}>
      {error && <p style={{ color: "crimson", fontWeight: 800 }}>{error}</p>}

      <p style={{ opacity: 0.8, marginBottom: 10 }}>
        Loaded pharmacies: <b>{pharmacies.length}</b>
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search address or postcode..."
          style={{
            padding: 10,
            border: "1px solid #444",
            borderRadius: 12,
            minWidth: 300,
            background: "transparent",
          }}
        />

        <button
          type="button"
          onClick={searchAddress}
          disabled={searchLoading || !searchText.trim()}
          style={{
            padding: "10px 14px",
            border: "1px solid #444",
            borderRadius: 12,
            fontWeight: 800,
            background: "transparent",
            cursor: searchLoading ? "not-allowed" : "pointer",
            opacity: searchLoading ? 0.7 : 1,
          }}
        >
          {searchLoading ? "Searching..." : "Search"}
        </button>

        {searchError && (
          <span style={{ color: "crimson", fontWeight: 700 }}>{searchError}</span>
        )}
      </div>

      <div
        ref={mapEl}
        style={{
          height: 520,
          border: "1px solid #333",
          borderRadius: 16,
          overflow: "hidden",
        }}
      />
    </section>
  );
}