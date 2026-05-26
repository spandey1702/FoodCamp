import React, { useState, useRef } from "react";

const API = "http://127.0.0.1:8000";
const STEP = { SELECT: "select", SCANNING: "scanning", CONFIRM: "confirm", SAVING: "saving", DONE: "done" };

export default function FoodUploadForm({ onListingCreated }) {
  const [step, setStep] = useState(STEP.SELECT);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null); // { food_name, confidence }
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef();

  const token = localStorage.getItem("token");

  // ── Pick image ────────────────────────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setPrediction(null);
    setError("");
    setStep(STEP.SELECT);
  }

  // ── Step 1: scan ──────────────────────────────────────────────────────────
  async function handleScan() {
    if (!imageFile) { setError("Please select an image first."); return; }
    setStep(STEP.SCANNING);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", imageFile);
      const res = await fetch(`${API}/restaurant/scan-food`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Scan failed");
      setPrediction(data);           // { food_name, confidence }
      setStep(STEP.CONFIRM);
    } catch (err) {
      setError(err.message);
      setStep(STEP.SELECT);
    }
  }

  // ── Step 2: confirm quantity + save ───────────────────────────────────────
  async function handleConfirm(e) {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) { setError("Enter a valid quantity."); return; }
    setStep(STEP.SAVING);
    setError("");
    try {
      const fd = new FormData();
      fd.append("food_name", prediction.food_name); // from AI — not typed by user
      fd.append("quantity", quantity);
      fd.append("file", imageFile);
      const res = await fetch(`${API}/restaurant/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setStep(STEP.DONE);
      onListingCreated && onListingCreated(data);
      setTimeout(reset, 2000);
    } catch (err) {
      setError(err.message);
      setStep(STEP.CONFIRM);
    }
  }

  function reset() {
    setStep(STEP.SELECT); setImageFile(null); setPreview(null);
    setPrediction(null); setQuantity(""); setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={s.card}>
      <h3 style={s.heading}>➕ Add Food Listing</h3>
      {error && <p style={s.error}>{error}</p>}

      {/* Always show image picker unless done */}
      {step !== STEP.DONE && (
        <div style={s.group}>
          <label style={s.label}>Food Photo</label>
          <input ref={fileRef} type="file" accept="image/*"
            onChange={handleFileChange} style={s.input} />
        </div>
      )}

      {/* Image preview */}
      {preview && step !== STEP.DONE && (
        <div style={s.previewWrap}>
          <img src={preview} alt="preview" style={s.previewImg} />
        </div>
      )}

      {/* SELECT — scan button */}
      {step === STEP.SELECT && imageFile && (
        <button onClick={handleScan} style={s.btnPrimary}>
          🔍 Detect Food
        </button>
      )}

      {/* SCANNING */}
      {step === STEP.SCANNING && <p style={s.info}>⏳ Identifying food…</p>}

      {/* CONFIRM — AI result + quantity only */}
      {step === STEP.CONFIRM && prediction && (
        <form onSubmit={handleConfirm}>
          {/* AI detection result — read-only */}
          <div style={s.aiResult}>
            <div style={s.aiHeader}>
              <span style={s.aiChip}>🤖 AI Detected</span>
              <span style={s.aiConf}>{prediction.confidence}% confidence</span>
            </div>
            <p style={s.aiName}>{prediction.food_name}</p>
          </div>

          {/* Quantity — the only thing the user fills in */}
          <div style={s.group}>
            <label style={s.label}>How many servings / portions?</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ ...s.input, fontSize: 18, fontWeight: 700 }}
              placeholder="e.g. 20"
              autoFocus
              required
            />
          </div>

          <div style={s.btnRow}>
            <button type="button" onClick={reset} style={s.btnSecondary}>
              ↩ Re-scan
            </button>
            <button type="submit" style={s.btnPrimary}>
              ✅ Confirm &amp; List
            </button>
          </div>
        </form>
      )}

      {/* SAVING */}
      {step === STEP.SAVING && <p style={s.info}>⏳ Saving listing…</p>}

      {/* DONE */}
      {step === STEP.DONE && (
        <p style={s.success}>🎉 Listing created! Refreshing…</p>
      )}
    </div>
  );
}

const s = {
  card: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  heading: { margin: "0 0 16px", color: "#1a202c", fontSize: 18 },
  group: { marginBottom: 14 },
  label: { display: "block", marginBottom: 4, fontWeight: 600, color: "#4a5568", fontSize: 13 },
  input: {
    width: "100%", padding: "9px 12px", border: "1px solid #cbd5e0",
    borderRadius: 6, fontSize: 14, boxSizing: "border-box",
  },
  previewWrap: { textAlign: "center", margin: "12px 0" },
  previewImg: {
    maxHeight: 180, maxWidth: "100%", borderRadius: 8,
    objectFit: "cover", border: "1px solid #e2e8f0",
  },
  aiResult: {
    background: "#f0fff4", border: "1px solid #9ae6b4",
    borderRadius: 10, padding: "14px 16px", marginBottom: 16,
  },
  aiHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  aiChip: {
    fontSize: 11, fontWeight: 700, background: "#38a169", color: "#fff",
    padding: "2px 8px", borderRadius: 20, letterSpacing: 0.4,
  },
  aiConf: { fontSize: 12, color: "#276749" },
  aiName: { margin: 0, fontSize: 22, fontWeight: 800, color: "#1a202c" },
  btnRow: { display: "flex", gap: 10, marginTop: 8 },
  btnPrimary: {
    flex: 1, padding: "10px 16px", background: "#3182ce", color: "#fff",
    border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  btnSecondary: {
    flex: 1, padding: "10px 16px", background: "#edf2f7", color: "#4a5568",
    border: "1px solid #cbd5e0", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  error: {
    color: "#c53030", background: "#fff5f5", border: "1px solid #feb2b2",
    borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontSize: 13,
  },
  success: {
    color: "#276749", background: "#f0fff4", border: "1px solid #9ae6b4",
    borderRadius: 6, padding: "10px 14px", fontWeight: 600,
  },
  info: {
    color: "#744210", background: "#fffbeb", border: "1px solid #f6e05e",
    borderRadius: 6, padding: "10px 14px", fontSize: 14,
  },
};
