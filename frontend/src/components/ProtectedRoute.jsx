import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Wraps a route so only authenticated users (optionally with a specific role)
 * can access it.  Unauthenticated users are redirected to /login.
 *
 * Usage:
 *   <ProtectedRoute role="restaurant"><RestaurantDashboard /></ProtectedRoute>
 *   <ProtectedRoute><AnyAuthenticatedPage /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/login" replace />;

  return children;
}
