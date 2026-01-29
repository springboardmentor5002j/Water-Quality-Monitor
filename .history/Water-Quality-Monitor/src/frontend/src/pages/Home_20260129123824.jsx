import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-2xl w-full text-center">
        
        <h2 className="text-4xl font-extrabold text-blue-700 mb-4">
          💧 Welcome to Water Quality App
        </h2>

        <p className="text-gray-600 text-lg leading-relaxed">
          This is your main dashboard page.  
          Explore water quality stations, reports, and alerts to stay informed
          about water safety around you.
        </p>

        <div className="mt-6 h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>

      </div>
    </div>
  );
}
