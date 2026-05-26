import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "./MapView";
import ClaimModal from "./ClaimModal";

const API = "http://127.0.0.1:8000";

// ── Status badge ──────────────────────────────────────────────────────────────
const CLAIM_STATUS = {
  claimed:   { label: "Claimed",   bg: "#eff6ff", color: "#1e40af", border: "#93c5fd" },
  picked_up: { label: "Picked Up", bg: "#f0fff4", color: "#166534", border: "#86efac" },
  released:  { label: "Released",  bg: "#fff5f5", color: "#c53030", border: "#feb2b2" },
};

const LISTING_STATUS = {
  pending:       { label: "Available",    bg: "#f0fff4", color: "#166534", border: "#86efac" },
  fully_claimed: { label: "Fully Claimed",bg: "#eff6ff", color: "#1e40af", border: "#93c5fd" },
  completed:     { label: "Completed",    bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db" },
};

function Badge({ map, value }) {
  const m = (map[value]) || { label: value, bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      border: `1px solid ${m.border}`, background: m.bg, color: m.color,
      textTransform: "uppercase", letterSpacing: 0.4,
    }}>
      {m.label}
    </span>
  );
}

// ── Available listing card ─────────────────────────────────────────────────────
function AvailableCard({ listing, onClaimClick }) {
  const isFull = listing.remaining_quantity === 0;
  return (
    <div style={s.card}>
      {listing.image_url
        ? <img src={listing.image_url} alt={listing.food_name} style={s.thumb} />
        : <div style={s.thumbPlaceholder}>🍽️</div>
      }
      <div style={s.cardBody}>
        <div style={s.cardTop}>
          <span style={s.foodName}>{listing.food_name}</span>
          <Badge map={LISTING_STATUS} value={listing.status} />
        </div>
        <p style={s.meta}>
          <span style={{ color: isFull ? "#c53030" : "#38a169", fontWeight: 600 }}>
            {listing.remaining_quantity}
          </span>
          <span style={{ color: "#718096" }}> / {listing.quantity} portions left</span>
        </p>
        {!isFull && (
          <button style={s.btnClaim} onClick={() => onClaimClick(listing)}>
            Claim
          </button>
        )}
      </div>
    </div>
  );
}

// ── My-claim card ─────────────────────────────────────────────────────────────
function ClaimCard({ claim, onPickup }) {
  const [busy, setBusy] = useState(false);
  const eta = claim.pickup_eta
    ? new Date(claim.pickup_eta).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;
  const release = claim.auto_release_at
    ? new Date(claim.auto_release_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div style={s.card}>
      {claim.image_url
        ? <img src={claim.image_url} alt={claim.food_name} style={s.thumb} />
        : <div style={s.thumbPlaceholder}>🍽️</div>
      }
      <div style={s.cardBody}>
        <div style={s.cardTop}>
          <span style={s.foodName}>{claim.food_name || "Food"}</span>
          <Badge map={CLAIM_STATUS} value={claim.status} />
        </div>
        {claim.restaurant_name && <p style={s.meta}>🏠 {claim.restaurant_name}</p>}
        <p style={s.meta}>Qty claimed: <strong>{claim.quantity}</strong></p>
        {eta    && <p style={s.meta}>🕐 Pickup: {eta}</p>}
        {release && claim.status === "claimed" && (
          <p style={{ ...s.meta, color: "#c05621" }}>⏱ Auto-releases at {release}</p>
        )}
        {claim.status === "claimed" && (
          <button
            style={s.btnPickup} disabled={busy}
            onClick={async () => { setBusy(true); await onPickup(claim.id); setBusy(false); }}
          >
            {busy ? "…" : "Mark Picked Up"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function CampDashboard() {
  const navigate = useNavigate();
  const [tab, setTab]           = useState("map");
  const [available, setAvailable] = useState([]);
  const [myClaims, setMyClaims]   = useState([]);
  const [mapData, setMapData]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [claimTarget, setClaimTarget] = useState(null); // listing being claimed

  const token = localStorage.getItem("token");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [avRes, myRes, mapRes] = await Promise.all([
        fetch(`${API}/camp/listings/available`, { headers: h }),
        fetch(`${API}/camp/claims/mine`,        { headers: h }),
        fetch(`${API}/camp/map`,                { headers: h }),
      ]);
      if ([avRes, myRes, mapRes].some((r) => r.status === 401)) { navigate("/login"); return; }
      setAvailable(await avRes.json());
      setMyClaims(await myRes.json());
      setMapData(await mapRes.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => { load(); }, [load]);

  // Called from ClaimModal confirm
  async function handleClaim(listing, quantity, pickupEta) {
    const res = await fetch(`${API}/camp/listings/${listing.id}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantity, pickup_eta: pickupEta || null }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Claim failed.");
    setClaimTarget(null);
    load();
  }

  // Called from map popup (no modal — claims 1 portion with no ETA)
  async function handleQuickClaim(listingId) {
    const res = await fetch(`${API}/camp/listings/${listingId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantity: 1, pickup_eta: null }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.detail || "Claim failed."); return; }
    load();
  }

  async function handlePickup(claimId) {
    const res = await fetch(`${API}/camp/claims/${claimId}/pickup`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) { setError(data.detail || "Could not mark picked up."); return; }
    load();
  }

  const TABS = [
    { key: "map",       label: "🗺️ Map" },
    { key: "available", label: `Available (${available.length})` },
    { key: "my-claims", label: `My Claims (${myClaims.filter(c => c.status === "claimed").length})` },
  ];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h2 style={s.title}>⛺ Camp Dashboard</h2>
        <button onClick={() => { localStorage.clear(); navigate("/login"); }} style={s.logoutBtn}>
          Log out
        </button>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map((t) => (
          <button key={t.key}
            style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p style={s.error}>{error}</p>}

      {loading ? <p style={s.hint}>Loading…</p> : (
        <>
          {tab === "map" && (
            mapData.length === 0
              ? <div style={s.emptyMap}>
                  <p style={{ fontSize: 40, margin: 0 }}>🗺️</p>
                  <p style={{ color: "#718096", marginTop: 8 }}>No restaurants on the map yet.</p>
                </div>
              : <>
                  <p style={s.mapCaption}>
                    🟢 {mapData.length} restaurant{mapData.length !== 1 ? "s" : ""} with food available
                  </p>
                  <MapView restaurants={mapData} onClaim={handleQuickClaim} />
                </>
          )}

          {tab === "available" && (
            available.length === 0
              ? <p style={s.hint}>No food available right now — check the map!</p>
              : <div style={s.grid}>
                  {available.map((l) => (
                    <AvailableCard key={l.id} listing={l} onClaimClick={setClaimTarget} />
                  ))}
                </div>
          )}

          {tab === "my-claims" && (
            myClaims.length === 0
              ? <p style={s.hint}>You haven't claimed anything yet.</p>
              : <div style={s.grid}>
                  {myClaims.map((c) => (
                    <ClaimCard key={c.id} claim={c} onPickup={handlePickup} />
                  ))}
                </div>
          )}
        </>
      )}

      {/* Claim modal */}
      {claimTarget && (
        <ClaimModal
          listing={claimTarget}
          onConfirm={(qty, eta) => handleClaim(claimTarget, qty, eta)}
          onClose={() => setClaimTarget(null)}
        />
      )}
    </div>
  );
}

const s = {
  page: { maxWidth: 900, margin: "40px auto", padding: "0 16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { margin: 0, fontSize: 24, color: "#1a202c" },
  logoutBtn: {
    padding: "7px 16px", background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 6, cursor: "pointer", color: "#4a5568", fontSize: 13, fontWeight: 600,
  },
  tabs: { display: "flex", gap: 4, borderBottom: "2px solid #e2e8f0", marginBottom: 20 },
  tab: {
    padding: "9px 20px", border: "none", background: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 600, color: "#718096",
    borderBottom: "2px solid transparent", marginBottom: -2,
  },
  tabActive: { color: "#38a169", borderBottomColor: "#38a169" },
  mapCaption: { fontSize: 13, color: "#4a5568", marginBottom: 12, fontWeight: 500 },
  emptyMap: {
    textAlign: "center", padding: "60px 20px",
    background: "#f7fafc", borderRadius: 10, border: "1px solid #e2e8f0",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  card: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
    overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  thumb: { width: "100%", height: 130, objectFit: "cover", display: "block" },
  thumbPlaceholder: {
    width: "100%", height: 130, display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 40, background: "#f7fafc",
  },
  cardBody: { padding: "12px 14px" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  foodName: { fontWeight: 700, fontSize: 15, color: "#1a202c" },
  meta: { margin: "3px 0", fontSize: 12, color: "#718096" },
  btnClaim: {
    width: "100%", marginTop: 10, padding: "8px", background: "#38a169", color: "#fff",
    border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13,
  },
  btnPickup: {
    width: "100%", marginTop: 10, padding: "8px", background: "#3182ce", color: "#fff",
    border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13,
  },
  error: {
    color: "#c53030", background: "#fff5f5", border: "1px solid #feb2b2",
    borderRadius: 6, padding: "10px 14px", marginBottom: 16,
  },
  hint: { color: "#a0aec0", textAlign: "center", padding: "32px 0", fontSize: 14 },
};
