import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FoodUploadForm from "./FoodUploadForm";

const API = "http://127.0.0.1:8000";

const STATUS_META = {
  pending:   { label: "Pending",   bg: "#fffbeb", color: "#92400e", border: "#f6d860" },
  claimed:   { label: "Claimed",   bg: "#eff6ff", color: "#1e40af", border: "#93c5fd" },
  picked_up: { label: "Picked Up", bg: "#f0fff4", color: "#166534", border: "#86efac" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 8px",
      borderRadius: 20, border: `1px solid ${m.border}`,
      background: m.bg, color: m.color, textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {m.label}
    </span>
  );
}

function ListingCard({ listing }) {
  return (
    <div style={s.card}>
      {listing.image_url && (
        <img src={listing.image_url} alt={listing.food_name} style={s.thumb} />
      )}
      {!listing.image_url && <div style={s.thumbPlaceholder}>🍽️</div>}
      <div style={s.cardBody}>
        <div style={s.cardTop}>
          <span style={s.foodName}>{listing.food_name}</span>
          <StatusBadge status={listing.status} />
        </div>
        <p style={s.meta}>Qty: <strong>{listing.quantity}</strong></p>
        <p style={s.meta}>
          {new Date(listing.created_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          })}
        </p>
        {listing.claimed_by_camp_id && (
          <p style={s.meta}>Camp #{listing.claimed_by_camp_id}</p>
        )}
      </div>
    </div>
  );
}

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [tab, setTab] = useState("active"); // "active" | "past"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const restaurantId = localStorage.getItem("restaurant_id");
  const token = localStorage.getItem("token");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/restaurant/listings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) { navigate("/login"); return; }
      if (!res.ok) throw new Error("Failed to load listings.");
      setListings(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, token, navigate]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Active = pending or claimed (still in-flight); Past = picked_up or inactive
  const activeListings = listings.filter(
    (l) => l.is_active && (l.status === "pending" || l.status === "claimed")
  );
  const pastListings = listings.filter(
    (l) => !l.is_active || l.status === "picked_up"
  );
  const shown = tab === "active" ? activeListings : pastListings;

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h2 style={s.title}>🍴 Restaurant Dashboard</h2>
        <button onClick={handleLogout} style={s.logoutBtn}>Log out</button>
      </div>

      {/* Upload form */}
      <FoodUploadForm onListingCreated={fetchListings} />

      {/* Tabs */}
      <div style={s.tabs}>
        <button
          style={{ ...s.tab, ...(tab === "active" ? s.tabActive : {}) }}
          onClick={() => setTab("active")}
        >
          Active ({activeListings.length})
        </button>
        <button
          style={{ ...s.tab, ...(tab === "past" ? s.tabActive : {}) }}
          onClick={() => setTab("past")}
        >
          Past ({pastListings.length})
        </button>
      </div>

      {/* Listings */}
      {error && <p style={s.error}>{error}</p>}
      {loading ? (
        <p style={s.hint}>Loading…</p>
      ) : shown.length === 0 ? (
        <p style={s.hint}>
          {tab === "active"
            ? "No active listings. Add one above!"
            : "No past listings yet."}
        </p>
      ) : (
        <div style={s.grid}>
          {shown.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { maxWidth: 860, margin: "40px auto", padding: "0 16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { margin: 0, fontSize: 24, color: "#1a202c" },
  logoutBtn: {
    padding: "7px 16px", background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 6, cursor: "pointer", color: "#4a5568", fontSize: 13, fontWeight: 600,
  },
  tabs: { display: "flex", gap: 4, borderBottom: "2px solid #e2e8f0", marginBottom: 20 },
  tab: {
    padding: "9px 20px", border: "none", background: "none",
    cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#718096",
    borderBottom: "2px solid transparent", marginBottom: -2,
  },
  tabActive: { color: "#3182ce", borderBottomColor: "#3182ce" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  card: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
    overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  thumb: { width: "100%", height: 130, objectFit: "cover", display: "block" },
  thumbPlaceholder: {
    width: "100%", height: 130, display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 40, background: "#f7fafc",
  },
  cardBody: { padding: "12px 14px" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  foodName: { fontWeight: 700, fontSize: 15, color: "#1a202c" },
  meta: { margin: "3px 0", fontSize: 12, color: "#718096" },
  error: { color: "#c53030", background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: 6, padding: "10px 14px" },
  hint: { color: "#a0aec0", textAlign: "center", padding: "32px 0", fontSize: 14 },
};
