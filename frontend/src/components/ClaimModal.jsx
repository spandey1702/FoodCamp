import React, { useState } from "react";

/**
 * Modal shown when a camp clicks "Claim" on a listing.
 *
 * Props:
 *   listing   — FoodListingResponse (needs food_name, remaining_quantity, image_url)
 *   onConfirm — (quantity, pickupEta) => Promise<void>
 *   onClose   — () => void
 */
export default function ClaimModal({ listing, onConfirm, onClose }) {
  const [quantity, setQuantity]   = useState(listing.remaining_quantity);
  const [pickupEta, setPickupEta] = useState("");
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (quantity < 1 || quantity > listing.remaining_quantity) {
      setError(`Enter a number between 1 and ${listing.remaining_quantity}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onConfirm(quantity, pickupEta || null);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  // Minimum datetime-local value = now (can't pick up in the past)
  const minEta = new Date(Date.now() + 5 * 60_000)   // 5 min from now
    .toISOString().slice(0, 16);

  return (
    /* Backdrop */
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <h3 style={s.title}>Claim Food</h3>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Listing preview */}
        <div style={s.listingRow}>
          {listing.image_url
            ? <img src={listing.image_url} alt={listing.food_name} style={s.thumb} />
            : <div style={s.thumbPlaceholder}>🍽️</div>
          }
          <div>
            <p style={s.foodName}>{listing.food_name}</p>
            <p style={s.available}>
              {listing.remaining_quantity} portion{listing.remaining_quantity !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {error && <p style={s.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* Quantity */}
          <div style={s.group}>
            <label style={s.label}>
              How many portions do you need?
            </label>
            <div style={s.qtyRow}>
              <button type="button" style={s.qtyBtn}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <input
                type="number"
                min={1}
                max={listing.remaining_quantity}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={s.qtyInput}
              />
              <button type="button" style={s.qtyBtn}
                onClick={() => setQuantity((q) => Math.min(listing.remaining_quantity, q + 1))}>+</button>
            </div>
            <p style={s.hint}>max {listing.remaining_quantity}</p>
          </div>

          {/* Pickup ETA */}
          <div style={s.group}>
            <label style={s.label}>
              Estimated pickup time <span style={s.optional}>(optional but helpful)</span>
            </label>
            <input
              type="datetime-local"
              min={minEta}
              value={pickupEta}
              onChange={(e) => setPickupEta(e.target.value)}
              style={s.input}
            />
          </div>

          {/* Auto-release note */}
          <p style={s.autoReleaseNote}>
            ⏱ Your claim is held for <strong>4 hours</strong>. If not picked up by then it's
            automatically released so other camps can claim it.
          </p>

          {/* Actions */}
          <div style={s.btnRow}>
            <button type="button" onClick={onClose} style={s.btnCancel} disabled={busy}>
              Cancel
            </button>
            <button type="submit" style={s.btnConfirm} disabled={busy}>
              {busy ? "Claiming…" : `Claim ${quantity} portion${quantity !== 1 ? "s" : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff", borderRadius: 12, padding: 24, width: "100%",
    maxWidth: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    maxHeight: "90vh", overflowY: "auto",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#1a202c" },
  closeBtn: {
    background: "none", border: "none", fontSize: 18,
    cursor: "pointer", color: "#718096", padding: "2px 6px",
  },
  listingRow: {
    display: "flex", gap: 12, alignItems: "center",
    background: "#f7fafc", borderRadius: 8, padding: "10px 12px", marginBottom: 16,
  },
  thumb: { width: 52, height: 52, borderRadius: 6, objectFit: "cover", flexShrink: 0 },
  thumbPlaceholder: {
    width: 52, height: 52, borderRadius: 6, background: "#e2e8f0",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
  },
  foodName: { margin: 0, fontWeight: 700, fontSize: 15, color: "#1a202c" },
  available: { margin: "3px 0 0", fontSize: 12, color: "#38a169", fontWeight: 600 },
  group: { marginBottom: 16 },
  label: { display: "block", marginBottom: 6, fontWeight: 600, color: "#4a5568", fontSize: 13 },
  optional: { fontWeight: 400, color: "#a0aec0", fontSize: 12 },
  qtyRow: { display: "flex", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 36, height: 36, border: "1px solid #cbd5e0", borderRadius: 6,
    background: "#edf2f7", fontSize: 18, cursor: "pointer", fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  qtyInput: {
    width: 64, textAlign: "center", padding: "7px 4px", border: "1px solid #cbd5e0",
    borderRadius: 6, fontSize: 18, fontWeight: 700,
  },
  hint: { margin: "4px 0 0", fontSize: 11, color: "#a0aec0" },
  input: {
    width: "100%", padding: "9px 12px", border: "1px solid #cbd5e0",
    borderRadius: 6, fontSize: 14, boxSizing: "border-box",
  },
  autoReleaseNote: {
    background: "#fffbeb", border: "1px solid #f6e05e", borderRadius: 6,
    padding: "8px 12px", fontSize: 12, color: "#744210", marginBottom: 16,
  },
  btnRow: { display: "flex", gap: 10 },
  btnCancel: {
    flex: 1, padding: "10px", background: "#edf2f7", color: "#4a5568",
    border: "1px solid #cbd5e0", borderRadius: 6, cursor: "pointer", fontWeight: 600,
  },
  btnConfirm: {
    flex: 2, padding: "10px", background: "#38a169", color: "#fff",
    border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 14,
  },
  error: {
    color: "#c53030", background: "#fff5f5", border: "1px solid #feb2b2",
    borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontSize: 13,
  },
};
