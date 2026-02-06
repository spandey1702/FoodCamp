import React from "react";

export default function ListingsTable() {
  // mock data
  const listings = [
    { id: 1, food: "Pending Detection", qty: 5, status: "Available" },
  ];

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
