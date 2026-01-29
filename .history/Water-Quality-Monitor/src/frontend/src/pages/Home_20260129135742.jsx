import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 px-4">
      <div className="bg-white/90 backdrop-blur shadow-2xl rounded-3xl p-12 max-w-3xl w-full text-center">
        
        {/* Title */}
        <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 mb-6">
          💧 Water Quality Monitor
        </h2>

        {/* Description */}
        <p className="text-gray-700 text-lg leading-relaxed mb-10">
          Monitor water quality in real time.  
          View nearby stations, submit reports, and receive alerts to ensure
          safe and clean water around you.
        </p>

        {/* Divider */}
        <div className="h-[3px] w-28 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full mb-10"></div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          
          <Link to="/login">
            <button className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-transform">
              Login
            </button>
          </Link>

          <Link to="/register">
            <button className="w-full sm:w-auto px-8 py-3 rounded-xl border-2 border-green-500 text-green-600 font-semibold text-lg hover:bg-green-50 hover:scale-105 transition-transform">
              Register
            </button>
          </Link>

        </div>

      </div>
    </div>
  );
}
