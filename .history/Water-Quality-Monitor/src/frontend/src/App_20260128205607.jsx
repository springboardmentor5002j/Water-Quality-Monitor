import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import Dashboard from "./pages/Dashboard";
import MyReports from "./pages/MyReports";
import CreateReport from "./pages/CreateReport";
import ReportDetails from "./pages/ReportDetails";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/resetPassword";
import Alerts from "./pages/alerts";
import HistoricalPage from "./pages/HistoricalPage";
import "leaflet/dist/leaflet.css";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/water.jpg)" }}
    >
      <Navbar />

      <div className="pt-24">
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* PROTECTED ROUTES */}
          <Route
            path="/dashboard"
            element={token ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/alerts"
            element={token ? <Alerts /> : <Navigate to="/login" />}
          />
          <Route
            path="/historical"
            element={token ? <HistoricalPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/logout"
            element={token ? <Logout /> : <Navigate to="/login" />}
          />

          {/* REPORT ROUTES */}
          <Route
            path="/reports/create"
            element={token ? <CreateReport /> : <Navigate to="/login" />}
          />
          <Route
            path="/reports/my"
            element={token ? <MyReports /> : <Navigate to="/login" />}
          />
          <Route
            path="/reports/:id"
            element={token ? <ReportDetails /> : <Navigate to="/login" />}
          />

          {/* Default report route redirect */}
          <Route
            path="/reports"
            element={<Navigate to="/reports/my" />}
          />

          {/* FALLBACK ROUTE */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}
