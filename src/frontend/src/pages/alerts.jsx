import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BASE_URL = "http://localhost:8000";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");

  const storedLocation = localStorage.getItem("userLocation") || "";

  useEffect(() => {
    // FIX: Use storedLocation here. 
    // If filter is 'local' AND we have a location, use the filtered endpoint.
    const endpoint = (filter === "local" && storedLocation)
      ? `${BASE_URL}/alerts/by_location?location=${encodeURIComponent(storedLocation)}`
      : `${BASE_URL}/alerts/all`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        // Handle both object responses {alerts: []} and direct array responses []
        const alertList = Array.isArray(data) ? data : (data.alerts || []);
        setAlerts(alertList);
      })
      .catch((err) => console.error("Error fetching alerts:", err));
  }, [filter, storedLocation]); // Effect runs when filter or location changes

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Water Quality Alerts</h1>
            <p className="text-gray-600">Real-time safety notifications across monitoring stations</p>
          </div>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === "all" ? "bg-red-600 text-white" : "bg-white border text-gray-600"
            }`}
          >
            All India
          </button>
          <button
            onClick={() => setFilter("local")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === "local" ? "bg-red-600 text-white" : "bg-white border text-gray-600"
            }`}
          >
            {/* Show specific location name if available */}
            Near {storedLocation || "My Location"}
          </button>
        </div>

        {/* Alert List */}
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-lg border border-dashed">
              <p className="text-gray-500">No active alerts found {filter === 'local' ? `for ${storedLocation}` : 'nationwide'}.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white border-l-4 shadow-sm p-5 rounded-r-lg transition-transform hover:scale-[1.01] ${
                  alert.type === "contamination" ? "border-red-600" : "border-yellow-500"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    alert.type === "contamination" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {alert.type.replace("_", " ")}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(alert.issued_at).toLocaleString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {alert.location} Station Alert
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {alert.message}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">📍 {alert.location}</span>
                  {alert.type === "boil_notice" && (
                    <span className="text-orange-600">⚠️ Recommendation: Boil water before use</span>
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