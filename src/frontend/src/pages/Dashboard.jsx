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
        geocodePlace(data.location, true);
      }
    };

    fetchUser();
  }, []);

  // ---------------- GEO ----------------
  // forceMapCenter = true: always set center even if geocode fails
  const geocodePlace = async (place, forceMapCenter = false) => {
    if (!place) return;

    try {
      const res = await fetch(
        `${BASE_URL}/geo/geocode?place=${encodeURIComponent(place)}`
      );

      if (res.ok) {
        const geo = await res.json();
        if (geo.lat && geo.lon) {
          setCenter([geo.lat, geo.lon]);
          fetchStationsWithReadings([geo.lat, geo.lon]);
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
  const fetchStationsWithReadings = async ([lat, lon]) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${BASE_URL}/stations/by_location_full?lat=${lat}&lon=${lon}&radius_km=1000`,
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
    try {
      const res = await fetch(
        `${BASE_URL}/stations/by_location_full?location=${encodeURIComponent(
          location
        )}&radius_km=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setStations(data.stations || []);

      if (data.user_location) {
        setCenter([data.user_location.latitude, data.user_location.longitude]);
      } else if (forceMapCenter) {
        // fallback: use last typed location on map even if backend fails
        setCenter([20, 77]); // default if no backend info
      }

      setVerifiedReports([]);
      setShowTable("stations");
    } catch {
      setStations([]);
      if (forceMapCenter) setCenter([20, 77]); // always show map
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
