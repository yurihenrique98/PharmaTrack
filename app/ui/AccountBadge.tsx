"use client";

import { useUserProfile } from "@/app/lib/user/useUserProfile";

export default function AccountBadge() {
  const { loading, profile } = useUserProfile();

  if (loading) return <span style={{ opacity: 0.8 }}>Loading…</span>;
  if (!profile) return <span style={{ opacity: 0.8 }}>Guest</span>;

  return (
    <span
      style={{
        fontWeight: 900,
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span>{profile.displayName}</span>

      {profile.isAdmin ? (
        <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 700 }}>
          (Admin)
        </span>
      ) : null}
    </span>
  );
}