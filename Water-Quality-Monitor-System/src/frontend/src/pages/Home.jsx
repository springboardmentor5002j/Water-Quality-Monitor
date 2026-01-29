import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage: `url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80")`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl p-12 max-w-3xl w-full text-center z-10">
        
        {/* Title */}
        <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 mb-6">
          💧 Water Quality Monitor
        </h2>

        {/* Description */}
        <p className="text-gray-100 text-lg leading-relaxed mb-10">
          Monitor water quality in real time.  
          View nearby stations, submit reports, and receive alerts to ensure
          safe and clean water around you.
        </p>

        {/* Divider */}
        <div className="h-[3px] w-28 bg-gradient-to-r from-blue-400 to-green-400 mx-auto rounded-full mb-10"></div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          
          {/* LOGIN */}
          <Link to="/login">
            <button className="w-full sm:w-auto px-8 py-3 rounded-xl 
              bg-gradient-to-r from-cyan-500 to-blue-600 
              text-white font-semibold text-lg shadow-xl 
              hover:from-cyan-600 hover:to-blue-700 
              hover:scale-105 transition-all">
              Login
            </button>
          </Link>

          {/* REGISTER */}
          <Link to="/register">
            <button className="w-full sm:w-auto px-8 py-3 rounded-xl 
              bg-gradient-to-r from-green-500 to-emerald-600 
              text-white font-semibold text-lg shadow-xl 
              hover:from-green-600 hover:to-emerald-700 
              hover:scale-105 transition-all">
              Register
            </button>
          </Link>

        </div>
      </div>
    </div>
  );
}
