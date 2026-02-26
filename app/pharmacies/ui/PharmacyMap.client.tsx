"use client";

import dynamic from "next/dynamic";

const PharmacyMap = dynamic(() => import("./PharmacyMap"), { ssr: false });

export default function PharmacyMapClient() {
  return <PharmacyMap />;
}