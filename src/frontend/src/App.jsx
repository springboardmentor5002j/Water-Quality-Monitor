import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import Dashboard from "./pages/Dashboard";
import MyReports from "./pages/MyReports";
import CreateReport from "./pages/CreateReport";
import "leaflet/dist/leaflet.css";
import React from "react";
import ReportDetails from "./pages/ReportDetails";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/resetPassword";
import Alerts from "./pages/alerts";
export default function App() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/water.jpg)" }}
    >
      <Navbar />

      <div className="pt-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* FIXED REPORT ROUTES */}
          <Route path="/reports/:id" element={<ReportDetails />} />
          <Route path="/reports" element={<MyReports />} />      {/* ✔ ADDED */}
          <Route path="/reports/my" element={<MyReports />} />
          <Route path="/reports/create" element={<CreateReport />} />
        </Routes>
      </div>
    </div>
  );
}
