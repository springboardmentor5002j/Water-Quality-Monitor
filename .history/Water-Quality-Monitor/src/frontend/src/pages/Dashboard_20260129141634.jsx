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
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto grid grid-cols-[250px_1fr] gap-6 p-6">

        {/* ================= SIDEBAR ================= */}
        <aside className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <h2 className="text-xl font-bold text-teal-700">💧 Dashboard</h2>
          <p className="text-sm text-gray-500">Role: {role}</p>

          <nav className="space-y-2">
            <button
              onClick={() => setShowTable("stations")}
              className="sidebar-btn"
            >
              🚰 Water Stations
            </button>

            <button
              onClick={() => setShowTable("readings")}
              className="sidebar-btn"
            >
              📊 Station Readings
            </button>

            <button
              onClick={fetchVerifiedReports}
              className="sidebar-btn"
            >
              ✅ Verified Reports
            </button>

            <Link to="/reports/create" className="sidebar-btn">
              📝 Submit Report
            </Link>

            <Link to="/reports/my" className="sidebar-btn">
              📂 My Reports
            </Link>

            <Link
              to="/alerts"
              className="sidebar-btn bg-red-50 text-red-700"
            >
              🚨 Alerts ({alerts.length})
            </Link>

            <Link
              to="/historical"
              className="sidebar-btn bg-emerald-50 text-emerald-700"
            >
              📈 Historical Data
            </Link>
          </nav>
        </aside>

        {/* ================= MAIN ================= */}
        <main className="bg-white rounded-xl shadow-md p-6">

          {/* Search */}
          <div className="flex items-center gap-3 mb-6">
            <input
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              className="flex-1 border rounded-lg px-4 py-2"
              placeholder="Enter location"
            />
            <button
              onClick={() => geocodePlace(userLocation)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg"
            >
              Search
            </button>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-red-600 font-semibold mb-2">
                🚨 Active Alerts
              </h3>
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-2"
                >
                  <b>{a.type}</b>
                  <p>{a.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Map */}
          <div className="h-[420px] rounded-xl overflow-hidden mb-6">
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
            <VerifiedReportsTable
              reports={verifiedReports}
              loading={loadingReports}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ================= TABLES ================= */

const StationTable = ({ stations }) => (
  <>
    <h3 className="table-title">🚰 Water Stations</h3>
    {stations.map((s) => (
      <div key={s.id} className="card">
        <b>{s.name}</b>
        <p className="text-gray-500">{s.location}</p>
      </div>
    ))}
  </>
);

const ReadingTable = ({ stations }) => (
  <>
    <h3 className="table-title">📊 Station Readings</h3>
    {stations.map((s) => (
      <div key={s.id} className="card">
        <b>{s.name}</b>
        {s.latest_readings?.map((r, i) => (
          <p key={i}>{r.parameter}: {r.value}</p>
        ))}
      </div>
    ))}
  </>
);

const VerifiedReportsTable = ({ reports, loading }) => (
  <>
    <h3 className="table-title">✅ Verified Reports</h3>
    {loading && <p className="text-blue-600">Loading...</p>}
    {reports.map((r) => (
      <div key={r.id} className="card">
        <p><b>Location:</b> {r.location}</p>
        <p><b>Status:</b> {r.status}</p>
      </div>
    ))}
  </>
);

/* ================= EXTRA TAILWIND HELPERS ================= */
/*
Add to global CSS if needed:

.sidebar-btn {
  @apply block w-full px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-left;
}

.card {
  @apply border rounded-lg p-4 mb-3 bg-slate-50;
}

.table-title {
  @apply font-semibold text-lg mb-3 text-slate-700;
}
*/
