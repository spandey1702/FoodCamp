import React from "react";
import FoodUploadForm from "./FoodUploadForm";
import ListingsTable from "./ListingsTable";

export default function RestaurantDashboard() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Restaurant Dashboard</h1>

      <FoodUploadForm />

      <hr style={{ margin: "40px 0" }} />

      <ListingsTable />
    </div>
  );
}
