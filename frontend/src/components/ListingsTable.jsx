import React, { useState, useEffect } from "react";

export default function ListingsTable() {
  const [listings, setListings] = useState([]); 
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:8000/restaurant/listings?restaurant_id=1"
        );
        const data = await res.json();

        const tableData = data.map((item) => ({
          id: item.id,
          food: item.food_name,
          qty: item.quantity,
          status: item.is_active ? "Available" : "Sold",
        }));

        setListings(tableData);
      } catch (err) {
        console.error("Error fetching listings:", err);
      }
    };

    fetchListings();
  }, []); 

  return (
    <div>
      <h3>Your Listings</h3>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Food</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((item) => (
            <tr key={item.id}>
              <td>{item.food}</td>
              <td>{item.qty}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}