import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import RestaurantDashboard from "./components/Restaraunt_Dashboard";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
