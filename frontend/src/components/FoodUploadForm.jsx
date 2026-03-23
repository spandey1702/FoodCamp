import React, { useState } from "react";

export default function FoodUploadForm() {
  const [image, setImage] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      setMessage("Please upload an image");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("quantity", quantity);

    try {
      const res = await fetch("http://127.0.0.1:8000/restaurant/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage("Food uploaded successfully");
        setImage(null);
        setQuantity("");
      } else {
        setMessage("Upload failed");
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Add Food Listing</h3>

      {message && <p style={styles.message}>{message}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Food Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={styles.input}
            placeholder="Enter quantity"
            required
          />
        </div>

        <button type="submit" style={styles.button}>
          Upload
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "20px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#f9f9f9",
  },
  heading: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#333",
  },
  message: {
    textAlign: "center",
    marginBottom: "15px",
    color: "green",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
};