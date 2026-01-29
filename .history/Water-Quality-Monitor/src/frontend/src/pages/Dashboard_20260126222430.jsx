import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ ADD THIS IMPORT
import HistoricalGraph from "../components/HistoricalGraph";

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
        setCenter(null);
        localStorage.setItem("userLocation", data.location);
        geocodePlace(data.location, true);
        fetchAlerts(data.location);
      }
    };

    fetchUser();
  }, []);

  // ---------------- GEO ----------------
  const geocodePlace = async (place, forceMapCenter = false) => {
    if (!place) return;
    localStorage.setItem("userLocation", place);
    try {
      const res = await fetch(
        `${BASE_URL}/geo/geocode?place=${encodeURIComponent(place)}`
      );

      if (res.ok) {
        const geo = await res.json();
        if (typeof geo.lat === "number" && typeof geo.lon === "number") {
          setCenter([geo.lat, geo.lon]);
          fetchStationsWithReadings([geo.lat, geo.lon], place);
          fetchAlerts(place);
          setVerifiedReports([]);
          setShowTable("stations");
          return;
        }
      }

      fetchStationsByLocation(place, forceMapCenter);
    } catch (err) {
      fetchStationsByLocation(place, forceMapCenter);
    }
  };

  // ---------------- STATIONS ----------------
  const fetchStationsWithReadings = async ([lat, lon], location) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${BASE_URL}/stations/by_location_full?lat=${lat}&lon=${lon}&location=${encodeURIComponent(
          location
        )}`,
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
        `${BASE_URL}/stations/by_location_full?location=${encodeURIComponent(
          location
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setStations(data.stations || []);
      setAlerts(data.alerts || []);

      if (data.user_location) {
        setCenter([
          data.user_location.latitude,
          data.user_location.longitude,
        ]);
      }
      setShowTable("stations");
    } catch {
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
    const res = await fetch(
      `${BASE_URL}/alerts/by_location?location=${encodeURIComponent(location)}`
    );
    const data = await res.json();
    setAlerts(data.alerts || []);
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
              className={`w-full p-2 rounded ${
                showTable === "stations"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              WaterStations
            </button>

            <button
              onClick={() => setShowTable("readings")}
              className={`w-full p-2 rounded ${
                showTable === "readings"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              StationReadings
            </button>

            <button
              onClick={fetchVerifiedReports}
              className={`w-full p-2 rounded ${
                showTable === "reports"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              Verified Reports
            </button>

            <Link
              to="/alerts"
              className="block w-full text-center p-2 rounded bg-red-100 text-red-700"
            >
              Alerts {alerts.length > 0 && `(${alerts.length})`}
            </Link>
          </div>
        </aside>

        {/* MAIN */}
        <main className="bg-white p-6 rounded shadow">
          {/* 🔥 ADD THIS SECTION (Historical Graph) */}
          {stations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">
                📈 Historical Water Quality Trends
              </h3>
              <HistoricalGraph stationId={stations[0].id} />
            </div>
          )}

          {/* REST OF YOUR EXISTING DASHBOARD CONTENT CONTINUES BELOW */}
          {/* (Map, tables, alerts — unchanged) */}
        </main>
      </div>
    </div>
  );
}
