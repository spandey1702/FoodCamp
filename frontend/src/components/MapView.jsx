import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Fix missing default marker icons in CRA builds ────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Green marker for restaurants with available food
const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Fit the map to all marker bounds whenever data changes
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [map, points]);
  return null;
}

/**
 * Props:
 *   restaurants  — array of RestaurantMapItem from GET /camp/map
 *   onClaim      — (listingId) => void
 */
export default function MapView({ restaurants = [], onClaim }) {
  const defaultCenter = [39.8283, -98.5795]; // geographic centre of the US

  return (
    <MapContainer
      center={defaultCenter}
      zoom={4}
      style={{ height: "520px", width: "100%", borderRadius: 10, zIndex: 0 }}
      scrollWheelZoom
    >
      {/* Free OpenStreetMap tiles — no API key needed */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-fit bounds when markers change */}
      <FitBounds points={restaurants} />

      {restaurants.map((r) => (
        <Marker key={r.restaurant_id} position={[r.latitude, r.longitude]} icon={greenIcon}>
          <Popup minWidth={220} maxWidth={280}>
            <div style={ps.popup}>
              {/* Restaurant header */}
              <p style={ps.restName}>{r.restaurant_name}</p>
              {r.address && <p style={ps.address}>📍 {r.address}</p>}

              <hr style={ps.divider} />

              {/* Listings */}
              {r.listings.map((l) => (
                <div key={l.id} style={ps.listing}>
                  {l.image_url && (
                    <img src={l.image_url} alt={l.food_name} style={ps.thumb} />
                  )}
                  <div style={ps.listingInfo}>
                    <span style={ps.foodName}>{l.food_name}</span>
                    <span style={ps.qty}>Qty: {l.quantity}</span>
                  </div>
                  <button
                    style={ps.claimBtn}
                    onClick={() => onClaim && onClaim(l.id)}
                  >
                    Claim
                  </button>
                </div>
              ))}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

const ps = {
  popup: { fontFamily: "system-ui, sans-serif", minWidth: 200 },
  restName: { margin: "0 0 2px", fontWeight: 700, fontSize: 15, color: "#1a202c" },
  address: { margin: "0 0 6px", fontSize: 12, color: "#718096" },
  divider: { border: "none", borderTop: "1px solid #e2e8f0", margin: "6px 0" },
  listing: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "6px 0", borderBottom: "1px solid #f0f0f0",
  },
  thumb: { width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 },
  listingInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  foodName: { fontWeight: 600, fontSize: 13, color: "#1a202c" },
  qty: { fontSize: 11, color: "#718096" },
  claimBtn: {
    padding: "4px 10px", background: "#38a169", color: "#fff",
    border: "none", borderRadius: 4, cursor: "pointer",
    fontWeight: 600, fontSize: 12, flexShrink: 0,
  },
};
