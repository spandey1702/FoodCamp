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
    <div style={{ maxWidth: "400px" }}>
      <h3>Add Food Listing</h3>

      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Food Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />
        </div>

        <div>
          <label>Quantity (servings)</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <button type="submit" style={{ marginTop: "10px" }}>
          Submit
        </button>
      </form>
    </div>
  );
}
