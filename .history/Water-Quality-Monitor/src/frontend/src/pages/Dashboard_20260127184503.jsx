import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
        localStorage.setItem("userLocation", data.location);
        geocodePlace(data.location);
        fetchAlerts(data.location);
      }
    };

    fetchUser();
  }, []);

  // ---------------- GEO ----------------
  const geocodePlace = async (place) => {
    if (!place) return;

    try {
      const res = await fetch(
        `${BASE_URL}/geo/geocode?place=${encodeURIComponent(place)}`
      );

      if (res.ok) {
        const geo = await res.json();
        if (geo.lat && geo.lon) {
          setCenter([geo.lat, geo.lon]);
          fetchStationsWithReadings([geo.lat, geo.lon], place);
          fetchAlerts(place);
          setShowTable("stations");
          return;
        }
      }

      fetchStationsByLocation(place);
    } catch {
      fetchStationsByLocation(place);
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

  const fetchStationsByLocation = async (location) => {
    const token = localStorage.getItem("token");
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
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto grid grid-cols-[240px_1fr] gap-6 p-6">
        {/* SIDEBAR */}
        <aside className="bg-slate-900 text-white p-5 rounded-xl shadow-lg space-y-4">
          <div className="text-lg font-bold tracking-wide">📍 Dashboard</div>

          <Link
            to="/reports/my"
            className="text-sm text-slate-300 hover:text-white"
          >
            My Reports
          </Link>

          <div className="text-xs bg-slate-800 px-2 py-1 rounded w-fit">
            Role: {role}
          </div>

          <div className="pt-3 space-y-3">
            <button
              onClick={() => setShowTable("stations")}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              Water Stations
            </button>

            <button
              onClick={() => setShowTable("readings")}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
            >
              Station Readings
            </button>

            <button
              onClick={fetchVerifiedReports}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
            >
              Verified Reports
            </button>

            <button
              onClick={() => setShowTable("history")}
              className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm"
            >
              Historical Graph
            </button>

            <Link
              to="/alerts"
              className="block text-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm"
            >
              Alerts {alerts.length > 0 && `(${alerts.length})`}
            </Link>
          </div>
        </aside>

        {/* MAIN */}
        <main className="bg-white p-6 rounded-xl shadow-md">
          {/* MAP */}
          <div className="h-[420px] mb-6 rounded-xl overflow-hidden border">
            <MapContainer center={center || [20, 77]} zoom={12} className="h-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater center={center} />

              {center && (
                <Marker position={center}>
                  <Popup>{userLocation}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* HISTORICAL GRAPH */}
          {showTable === "history" && stations.length > 0 && (
            <HistoricalGraph stationId={stations[0].id} />
          )}
        </main>
      </div>
    </div>
  );
}
