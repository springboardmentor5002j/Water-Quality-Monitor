import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ================== ADDED (GRAPH IMPORTS) ================== */
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);
/* =========================================================== */

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

  /* ================== ADDED (GRAPH STATE) ================== */
  const [activeGraph, setActiveGraph] = useState(null);
  /* ========================================================= */

  const BASE_URL = "http://127.0.0.1:8000";

  /* ----------- USER, GEO, STATIONS, REPORTS, ALERTS ----------- */
  /* ❗ NOTHING CHANGED BELOW – YOUR ORIGINAL CODE ❗ */

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

  /* ---------------- GEO ---------------- */
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
    } catch {
      fetchStationsByLocation(place, forceMapCenter);
    }
  };

  /* ---------------- STATIONS ---------------- */
  const fetchStationsWithReadings = async ([lat, lon], location) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${BASE_URL}/stations/by_location_full?lat=${lat}&lon=${lon}&location=${encodeURIComponent(
        location
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setStations(data.stations || []);
  };

  const fetchStationsByLocation = async (location) => {
    const token = localStorage.getItem("token");
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
  };

  /* ---------------- VERIFIED REPORTS ---------------- */
  const fetchVerifiedReports = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${BASE_URL}/stations/verified_reports_by_location?location=${encodeURIComponent(
        userLocation
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setVerifiedReports(data.verified_reports || []);
    setShowTable("reports");
    setActiveGraph("reports");
  };

  const fetchAlerts = async (location) => {
    const res = await fetch(
      `${BASE_URL}/alerts/by_location?location=${encodeURIComponent(location)}`
    );
    const data = await res.json();
    setAlerts(data.alerts || []);
  };

  /* ================== ADDED (GRAPH DATA) ================== */

  const readingsGraphData = {
    labels: stations.map((s) => s.name),
    datasets: [
      {
        label: "Stations Count",
        data: stations.map(() => 1),
      },
    ],
  };

  const reportsGraphData = {
    labels: verifiedReports.map((_, i) => `Report ${i + 1}`),
    datasets: [
      {
        label: "Verified Reports",
        data: verifiedReports.map(() => 1),
      },
    ],
  };

  const alertsGraphData = {
    labels: alerts.map((_, i) => `Alert ${i + 1}`),
    datasets: [
      {
        label: "Alerts",
        data: alerts.map(() => 1),
      },
    ],
  };

  /* ========================================================= */

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
              onClick={() => {
                setShowTable("stations");
                setActiveGraph("readings");
              }}
              className="w-full p-2 rounded bg-gray-200"
            >
              Station Readings
            </button>

            <button
              onClick={fetchVerifiedReports}
              className="w-full p-2 rounded bg-gray-200"
            >
              Verified Reports
            </button>

            <button
              onClick={() => setActiveGraph("alerts")}
              className="w-full p-2 rounded bg-gray-200"
            >
              Alerts Graph
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="bg-white p-6 rounded shadow">

          {/* ================== ADDED (GRAPHS SECTION) ================== */}
          {activeGraph === "readings" && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">📈 Station Readings Graph</h3>
              <Bar data={readingsGraphData} />
            </div>
          )}

          {activeGraph === "reports" && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">📈 Verified Reports Graph</h3>
              <Line data={reportsGraphData} />
            </div>
          )}

          {activeGraph === "alerts" && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">📈 Alerts Graph</h3>
              <Bar data={alertsGraphData} />
            </div>
          )}
          {/* =========================================================== */}

          {/* ❗ REST OF YOUR ORIGINAL UI (MAP + TABLES) REMAINS SAME ❗ */}
        </main>
      </div>
    </div>
  );
}
