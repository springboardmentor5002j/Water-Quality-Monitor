import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BASE_URL = "http://localhost:8000";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");
  const storedLocation = localStorage.getItem("userLocation") || "";

  useEffect(() => {
    // Determine which endpoint to call based on the button clicked
    const endpoint = (filter === "local" && storedLocation)
      ? `${BASE_URL}/alerts/by_location?location=${encodeURIComponent(storedLocation)}`
      : `${BASE_URL}/alerts/all`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        // Correctly handle the JSON structure from alerts.py
        const alertList = Array.isArray(data) ? data : (data.alerts || []);
        setAlerts(alertList);
      })
      .catch((err) => console.error("Error fetching alerts:", err));
  }, [filter, storedLocation]); // Re-runs when you toggle the filter

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Water Quality Alerts</h1>
            <p className="text-gray-600">Real-time safety notifications across monitoring stations</p>
          </div>
          <Link to="/dashboard" className="text-blue-600 hover:underline font-medium">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
              filter === "all" ? "bg-red-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            All India
          </button>
          <button
            onClick={() => setFilter("local")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
              filter === "local" ? "bg-red-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            Near {storedLocation || "My Location"}
          </button>
        </div>

        {/* Alert List */}
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-lg">No active alerts {filter === 'local' ? `for ${storedLocation}` : 'nationwide'}.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white border-l-8 shadow-md p-6 rounded-r-xl transition-all hover:shadow-lg ${
                  alert.type === "contamination" ? "border-red-600" : "border-yellow-500"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                      alert.type === "contamination" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {alert.type.replace("_", " ")}
                    </span>
                    
                    {/* Highlight if it matches the user's location even in 'All India' view */}
                    {alert.location.toLowerCase().includes(storedLocation.toLowerCase()) && (
                      <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">
                        Your Area
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-gray-400">
                    {new Date(alert.issued_at).toLocaleString()}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {alert.location} Station
                </h3>
                <p className="text-gray-700 leading-relaxed italic">
                  "{alert.message}"
                </p>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                     <span>📍</span> {alert.location}, India
                   </div>
                   {alert.type === "boil_notice" && (
                    <span className="text-red-600 font-bold text-xs animate-pulse">
                      ⚠️ BOIL WATER BEFORE USE
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Alerts;

