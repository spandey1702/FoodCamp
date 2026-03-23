import React, { useEffect, useState } from "react";
import FoodUploadForm from "./FoodUploadForm";


export default function RestaurantDashboard() {
  const [foodListings, setFoodListings] = useState([]);
  const [message, setMessage] = useState("");
  const restaurantId = localStorage.getItem("restaurant_id")|| 1;
  console.log("Restaurant ID from localStorage:", restaurantId);
  useEffect(() => {
    const fetchFoodListings = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/restaurant/listings?restaurant_id=${restaurantId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, 
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setFoodListings(data.filter((item) => item.is_active));
          console.log(data);
          if (data.length === 0) {
            setMessage("No active food listings found.");
          }
        } else {
          setMessage("Failed to fetch food listings.");
        }
      } catch (err) {
        setMessage("Server error. Please try again later.");
      }
    };

    fetchFoodListings();
  }, [restaurantId]);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Restaurant Dashboard</h2>
      <FoodUploadForm />
      {message && <p style={styles.message}>{message}</p>}
      <div style={styles.listingsContainer}>
        {foodListings.length > 0 ? (
          foodListings.map((listing) => (
            <div key={listing.id} style={styles.listingCard}>
              <h3 style={styles.listingTitle}>{listing.food_name}</h3>
              <p>Quantity: {listing.quantity}</p>
              <p>Status: {listing.is_active ? "Available" : "Sold Out"}</p>
            </div>
          ))
        ) : (
          <p>No active food listings available.</p>
        )}
      </div>
    </div>
  );
}


const styles = {
  container: {
    maxWidth: "800px",
    margin: "50px auto",
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
    color: "red",
    textAlign: "center",
    marginBottom: "15px",
  },
  listingsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  listingCard: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "15px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  listingTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
};