import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-2xl w-full text-center">
        
        <h2 className="text-4xl font-extrabold text-blue-700 mb-4">
          💧 Welcome to Water Quality App
        </h2>

        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          This is your main dashboard page.  
          Explore water quality stations, reports, and alerts to stay informed
          about water safety around you.
        </p>

        {/* Divider */}
        <div className="h-1 w-24 bg-blue-600 mx-auto rounded-full mb-8"></div>

        {/* Login & Register Buttons */}
        <div className="flex justify-center gap-6">
          <Link to="/login">
            <button className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
              Login
            </button>
          </Link>

          <Link to="/register">
            <button className="px-6 py-2 rounded-lg border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition">
              Register
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
