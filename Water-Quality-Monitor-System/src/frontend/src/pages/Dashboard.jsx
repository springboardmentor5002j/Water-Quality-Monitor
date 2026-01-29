import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ---------------- LEAFLET ICON FIX ---------------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* ---------------- MAP UPDATER ---------------- */
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 12);
  }, [center, map]);
  return null;
}

/* ===================== DASHBOARD ===================== */
export default function Dashboard() {
  const navigate = useNavigate();

  const [center, setCenter] = useState(null);
  const [userLocation, setUserLocation] = useState("");
  const [stations, setStations] = useState([]);
  const [verifiedReports, setVerifiedReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [role, setRole] = useState("");
  const [showTable, setShowTable] = useState("stations");
  const [updatingIds, setUpdatingIds] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const BASE_URL = "http://127.0.0.1:8000";

  /* ---------------- USER DETAILS ---------------- */
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
        geocodePlace(data.location);
      }
    };

    fetchUser();
  }, []);

  /* ---------------- GEO CODE ---------------- */
  const geocodePlace = async (place) => {
    if (!place) return;

    const res = await fetch(
      `${BASE_URL}/geo/geocode?place=${encodeURIComponent(place)}`
    );
    const geo = await res.json();

    if (geo.lat && geo.lon) {
      setCenter([geo.lat, geo.lon]);
      fetchStationsWithReadings([geo.lat, geo.lon], place);
      fetchAlerts(place);
      setShowTable("stations");
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
    setAlerts(data.alerts || []);
  };

  /* ---------------- VERIFIED REPORTS ---------------- */
  const fetchVerifiedReports = async () => {
    const token = localStorage.getItem("token");
    if (!userLocation) return;

    setLoadingReports(true);
    const res = await fetch(
      `${BASE_URL}/stations/verified_reports_by_location?location=${encodeURIComponent(
        userLocation
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setVerifiedReports(data.verified_reports || []);
    setShowTable("reports");
    setLoadingReports(false);
  };

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-gray-100">
      {/* TOP NAV BAR */}
      <div className="bg-white shadow-md px-6 py-4 flex flex-wrap gap-3 justify-center sticky top-0 z-50">
        <span className="font-bold text-blue-700 text-lg mr-4">
          💧 Water Dashboard
        </span>

        <Link className="nav-btn bg-blue-600 text-white" to="/reports/create">
          Submit Report
        </Link>

        <Link className="nav-btn bg-slate-600 text-white" to="/reports/my">
          My Reports
        </Link>

        {["ngo", "admin", "authority"].includes(role) && (
          <Link
            className="nav-btn bg-purple-600 text-white"
            to="/ngo/dashboard"
          >
            NGO Dashboard
          </Link>
        )}

        <button
          onClick={() => setShowTable("stations")}
          className="nav-btn bg-indigo-500 text-white"
        >
          Stations
        </button>

        <button
          onClick={() => setShowTable("readings")}
          className="nav-btn bg-cyan-500 text-white"
        >
          Readings
        </button>

        <button
          onClick={fetchVerifiedReports}
          className="nav-btn bg-emerald-600 text-white"
        >
          Verified Reports
        </button>

        <Link className="nav-btn bg-red-600 text-white" to="/alerts">
          Alerts ({alerts.length})
        </Link>

        <Link className="nav-btn bg-green-600 text-white" to="/historical">
          📈 Historical
        </Link>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto bg-white p-6 mt-6 rounded-xl shadow-lg">
        <div className="flex gap-2 mb-4">
          <input
            value={userLocation}
            onChange={(e) => setUserLocation(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="Enter location"
          />
          <button
            onClick={() => geocodePlace(userLocation)}
            className="bg-blue-600 text-white px-5 rounded-lg font-semibold hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        <div className="h-[400px] mb-4 rounded-xl overflow-hidden shadow">
          <MapContainer center={center || [20, 77]} zoom={12} className="h-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapUpdater center={center} />

            {center && (
              <Marker position={center}>
                <Popup>{userLocation}</Popup>
              </Marker>
            )}

            {stations.map(
              (s) =>
                s.latitude &&
                s.longitude && (
                  <Marker key={s.id} position={[s.latitude, s.longitude]}>
                    <Popup>
                      <b>{s.name}</b>
                      <br />
                      {s.location}
                    </Popup>
                  </Marker>
                )
            )}
          </MapContainer>
        </div>

        {showTable === "stations" && <StationTable stations={stations} />}
        {showTable === "readings" && <ReadingTable stations={stations} />}
        {showTable === "reports" && (
          <VerifiedReportsTable reports={verifiedReports} />
        )}
      </div>
    </div>
  );
}

/* ================= TABLES ================= */
const StationTable = ({ stations }) => (
  <>
    <h3 className="font-bold text-blue-700 mb-3">Water Stations</h3>
    {stations.map((s) => (
      <div key={s.id} className="border p-3 mb-2 rounded-lg">
        <b>{s.name}</b>
        <p className="text-gray-600">{s.location}</p>
      </div>
    ))}
  </>
);

const ReadingTable = ({ stations }) => (
  <>
    <h3 className="font-bold text-blue-700 mb-3">Station Readings</h3>
    {stations.map((s) => (
      <div key={s.id} className="border p-3 mb-2 rounded-lg">
        <b>{s.name}</b>
        {s.latest_readings?.map((r, i) => (
          <div key={i}>
            {r.parameter}: {r.value}
          </div>
        ))}
      </div>
    ))}
  </>
);

const VerifiedReportsTable = ({ reports }) => (
  <>
    <h3 className="font-bold text-blue-700 mb-3">Verified Reports</h3>
    {reports.map((r) => (
      <div key={r.id} className="border p-3 mb-2 rounded-lg">
        <p>
          <b>Location:</b> {r.location}
        </p>
        <p>
          <b>Status:</b> {r.status}
        </p>
      </div>
    ))}
  </>
);

/* ================= BUTTON STYLE ================= */
const navBtn =
  "px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform";
