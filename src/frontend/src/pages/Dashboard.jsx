import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 12);
  }, [center, map]);
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [center, setCenter] = useState(null);
  const [userLocation, setUserLocation] = useState("");
  const [stations, setStations] = useState([]);
  const [verifiedReports, setVerifiedReports] = useState([]);
  const [role, setRole] = useState("");
  const [showTable, setShowTable] = useState("stations");
  const [alerts, setAlerts] = useState([]);

  const BASE_URL = "http://127.0.0.1:8000";

  // ---------------- USER ----------------
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await res.json();
      setRole(data.role || "");

      if (data.location) {
        setUserLocation(data.location);
        // always set center to user's location first
        setCenter(null); // will be updated by geocode/fallback
        localStorage.setItem("userLocation", data.location);
        geocodePlace(data.location, true);
        fetchAlerts(data.location);
      }
    };

    fetchUser();
  }, []);

  // ---------------- GEO ----------------
  // forceMapCenter = true: always set center even if geocode fails
  const geocodePlace = async (place, forceMapCenter = false) => {
    if (!place) return;
    localStorage.setItem("userLocation", place);
    try {
      const res = await fetch(
        `${BASE_URL}/geo/geocode?place=${encodeURIComponent(place)}`
      );

      if (res.ok) {
        const geo = await res.json();
        if (typeof geo.lat === "number" && typeof geo.lon === "number"){
          setCenter([geo.lat, geo.lon]);
          fetchStationsWithReadings([geo.lat, geo.lon], place);
          fetchAlerts(place); 
          setVerifiedReports([]);
          setShowTable("stations");
          return;
        }
      }

      // if geocode fails, fallback to backend
      fetchStationsByLocation(place, forceMapCenter);
    } catch (err) {
      console.warn("Geocoding failed, using backend fallback");
      fetchStationsByLocation(place, forceMapCenter);
    }
  };

  // ---------------- STATIONS ----------------
  const fetchStationsWithReadings = async ([lat, lon], location) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${BASE_URL}/stations/by_location_full?lat=${lat}&lon=${lon}&location=${encodeURIComponent(location)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setStations(data.stations || []);
    } catch {
      setStations([]);
    }
  };

  const fetchStationsByLocation = async (location, forceMapCenter = false) => {
  const token = localStorage.getItem("token");
  localStorage.setItem("userLocation", location);
  try {
    const res = await fetch(
      `${BASE_URL}/stations/by_location_full?location=${encodeURIComponent(location)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    setStations(data.stations || []);
    
    // 🔥 FIX: Set alerts directly from the response
    setAlerts(data.alerts || []); 

    if (data.user_location) {
      setCenter([data.user_location.latitude, data.user_location.longitude]);
    }
    setShowTable("stations");
  } catch (err) {
    console.error("Fetch error", err);
    setStations([]);
  }
};

  // ---------------- VERIFIED REPORTS ----------------
  const fetchVerifiedReports = async () => {
    const token = localStorage.getItem("token");
    if (!userLocation) return;

    try {
      const res = await fetch(
        `${BASE_URL}/stations/verified_reports_by_location?location=${encodeURIComponent(
          userLocation
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setVerifiedReports(data.verified_reports || []);
      setShowTable("reports");
    } catch {
      setVerifiedReports([]);
    }
  };
const fetchAlerts = async (location) => {
  try {
    const res = await fetch(
      `${BASE_URL}/alerts/by_location?location=${encodeURIComponent(location)}`
    );
    const data = await res.json();
    if (Array.isArray(data)) {
      setAlerts(data);
    } else if (data.alerts) {
      setAlerts(data.alerts);
    } else {
      setAlerts([]);
    }
  } catch (err) {
    console.error("Alert fetch failed:", err);
    setAlerts([]);
  }
};

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto grid grid-cols-[220px_1fr] gap-6 p-6">
        {/* SIDEBAR */}
        <aside className="bg-white p-4 rounded shadow space-y-3">
          <div className="font-semibold">📍 Map View</div>
          <Link to="/reports/my">My Reports</Link>
          <div>Stations</div>
          <div className="text-blue-600">Role: {role}</div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => setShowTable("stations")}
              className={`w-full p-2 rounded transition-all ${
                showTable === "stations"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-blue-100"
              }`}
            >
              WaterStations
            </button>

            <button
              onClick={() => setShowTable("readings")}
              className={`w-full p-2 rounded transition-all ${
                showTable === "readings"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-blue-100"
              }`}
            >
              StationReadings
            </button>

            <button
              onClick={fetchVerifiedReports}
              className={`w-full p-2 rounded transition-all ${
                showTable === "reports"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-blue-100"
              }`}
            >
              Verified Reports
            </button>
            <Link
                to="/alerts"
                className="block w-full text-center p-2 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-all"
              >
                 Alerts {alerts.length > 0 && `(${alerts.length})`}
            </Link>
            <Link
  to="/historical"
  className="block w-full text-center p-2 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-all"
>
  📈 Historical Data
</Link>

          </div>
        </aside>
        
        {/* MAIN */}
        <main className="bg-white p-6 rounded shadow">
          <div className="flex gap-2 mb-4">
            <input
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              placeholder="Enter location"
              className="flex-1 border p-2 rounded"
            />
            <button
              onClick={() => geocodePlace(userLocation, true)}
              className="bg-blue-500 text-white px-4 rounded"
            >
              Search
            </button>
          </div>

         {/* ALERTS SECTION */}
{alerts.length > 0 && (
  <div className="mb-6">
    <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
      🚨 Active Alerts for {userLocation}
    </h3>
    <div className="grid gap-3">
      {alerts.slice(0, 5).map((a) => (
        <div 
          key={a.id} 
          className={`border-l-4 p-4 rounded shadow-sm ${
            a.type === 'contamination' 
              ? 'bg-red-50 border-red-600 text-red-900' 
              : 'bg-orange-50 border-orange-500 text-orange-900'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="font-bold uppercase text-xs tracking-wider">
              {a.type.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm mt-1 font-medium">{a.message}</p>
        </div>
      ))}
    </div>
    <Link to="/alerts" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
      View full alert history for India →
    </Link>
  </div>
)}

          {/* MAP – always visible */}
          <div className="h-[400px] mb-6">
            <MapContainer
              center={center || [20, 77]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater center={center || [20, 77]} />

              {/* Marker at typed location */}
              {center && (
                <Marker position={center}>
                  <Popup>{userLocation || "Selected Location"}</Popup>
                </Marker>
              )}

              {/* Markers for stations */}
              {stations.map(
                (s) =>
                  s.latitude &&
                  s.longitude && (
                    <Marker key={s.id} position={[s.latitude, s.longitude]}>
                      <Popup>
                        <strong>{s.name}</strong>
                        <br />
                        {s.location}
                      </Popup>
                    </Marker>
                  )
              )}
            </MapContainer>
          </div>

          {/* TABLES */}
          {showTable === "stations" && (
            <>
              <h3 className="text-lg font-semibold mb-3">
                Nearby Water Stations (within 1000 km)
              </h3>
              {stations.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-800">
                  No water stations available for this location.
                </div>
              )}
              {stations.map((s) => (
                <div key={s.id} className="border p-4 rounded mb-3 bg-gray-50">
                  <p><strong>ID:</strong> {s.id}</p>
                  <p><strong>Name:</strong> {s.name}</p>
                  <p><strong>Location:</strong> {s.location}</p>
                  <p><strong>Latitude:</strong> {s.latitude}</p>
                  <p><strong>Longitude:</strong> {s.longitude}</p>
                  <p><strong>Managed By:</strong> {s.managed_by}</p>
                  <p>
                    <strong>Created At:</strong>{" "}
                    {new Date(s.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </>
          )}

          {showTable === "readings" && (
            <>
              <h3 className="text-lg font-semibold mb-3">
                Nearby Station Readings (within 1000 km)
              </h3>
              {stations.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-800">
                  No station readings available for this location.
                </div>
              )}
              {stations.map((s) => (
                <div key={s.id} className="border p-4 rounded mb-4 bg-gray-50">
                  <p className="font-semibold">
                    Station: {s.name} ({s.location})
                  </p>

                  {Array.isArray(s.latest_readings) &&
                  s.latest_readings.length > 0 ? (
                    <table className="w-full mt-2 border text-sm">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="border p-1">Parameter</th>
                          <th className="border p-1">Value</th>
                          <th className="border p-1">Recorded At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.latest_readings.map((r, idx) => (
                          <tr key={idx}>
                            <td className="border p-1">{r.parameter}</td>
                            <td className="border p-1">{r.value}</td>
                            <td className="border p-1">
                              {new Date(r.recorded_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm mt-2">
                      No readings available for this station.
                    </p>
                  )}
                </div>
              ))}
            </>
          )}

          {showTable === "reports" && (
            <>
              <h3 className="text-lg font-semibold mb-2">
                Verified Reports – {userLocation}
              </h3>
              {verifiedReports.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-800">
                  No verified reports available for this location.
                </div>
              )}
              {verifiedReports.map((r) => (
                <div key={r.id} className="border p-3 mb-2 rounded">
                  {r.description}
                  <br />
                  <small>
                    {r.water_source} • {r.reported_by}
                  </small>
                </div>
              ))}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
