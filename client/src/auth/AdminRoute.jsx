import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

function AdminRoute() {
  const { user } = useAuth();

  return user && user.role?.toLowerCase() === "admin" ? <Outlet /> : <Navigate to="/" replace />;
}

export default AdminRoute; 