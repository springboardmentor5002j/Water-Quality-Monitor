import { Link } from "react-router-dom";
import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { logout } = useAuth();

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        <h1 className="text-2xl font-bold text-blue-600">
          Water Quality Monitor
        </h1>

        <div className="flex items-center space-x-8 text-gray-700 font-medium text-lg">

          <Link to="/" className="hover:text-blue-600 transition">
            Home
          </Link>

          <Link to="/login" className="hover:text-blue-600 transition">
            Login
          </Link>

          <Link to="/register" className="hover:text-blue-600 transition">
            Register
          </Link>

          <Link
            to="/login"
            onClick={logout}
            className="hover:text-blue-600 transition"
          >
            Logout
          </Link>

        </div>

      </div>
    </nav>
  );
}