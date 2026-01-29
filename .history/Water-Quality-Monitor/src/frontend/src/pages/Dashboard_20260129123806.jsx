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
  const BASE_URL = "http://127.0.0.1:8000";

  const [center, setCenter] = useState(null);
  const [userLocation, setUserLocation] = useState("");
  const [stations, setStations] = useState([]);
  const [verifiedReports, setVerifiedReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [role, setRole] = useState("");
  const [showTable, setShowTable] = useState("stations");
  const [updatingIds, setUpdatingIds] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  /* ---------------- USER ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setRole(data.role);
        if (data.location) {
          setUserLocation(data.location);
          geocodePlace(data.location);
        }
      });
  }, []);

  /* ---------------- GEO ---------------- */
  const geocodePlace = async (place) => {
    const res = await fetch(`${BASE_URL}/geo/geocode?place=${place}`);
    const geo = await res.json();
    if (geo.lat && geo.lon) {
      setCenter([geo.lat, geo.lon]);
      fetchStations(place, geo.lat, geo.lon);
      fetchAlerts(place);
    }
  };

  /* ---------------- STATIONS ---------------- */
  const fetchStations = async (location, lat, lon) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${BASE_URL}/stations/by_location_full?location=${location}&lat=${lat}&lon=${lon}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setStations(data.stations || []);
    setAlerts(data.alerts || []);
  };

  /* ---------------- VERIFIED REPORTS ---------------- */
  const fetchVerifiedReports = async () => {
    setLoadingReports(true);
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${BASE_URL}/stations/verified_reports_by_location?location=${userLocation}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setVerifiedReports(data.verified_reports || []);
    setShowTable("reports");
    setLoadingReports(false);
  };

  /* ---------------- ALERTS ---------------- */
  const fetchAlerts = async (location) => {
    const res = await fetch(
      `${BASE_URL}/alerts/by_location?location=${location}`
    );
    const data = await res.json();
    setAlerts(data || []);
  };

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto grid grid-cols-[240px_1fr] gap-6 p-6">

        {/* SIDEBAR */}
        <aside className="bg-white rounded-xl shadow p-4 space-y-3">
          <h2 className="font-bold text-lg">📊 Dashboard</h2>

          <Link className="sidebar-link" to="/reports/create">➕ Submit Report</Link>
          <Link className="sidebar-link" to="/reports/my">📄 My Reports</Link>

          <div className="text-sm text-gray-500">Role: {role}</div>

          <button onClick={() => setShowTable("stations")} className="sidebar-btn">
            💧 Water Stations
          </button>
          <button onClick={() => setShowTable("readings")} className="sidebar-btn">
            📊 Station Readings
          </button>
          <button onClick={fetchVerifiedReports} className="sidebar-btn">
            ✅ Verified Reports
          </button>

          <Link to="/alerts" className="alert-btn">
            🚨 Alerts ({alerts.length})
          </Link>
        </aside>

        {/* MAIN */}
        <main className="bg-white rounded-xl shadow p-6">

          {/* SEARCH */}
          <div className="flex gap-2 mb-4">
            <input
              className="border p-2 rounded w-full"
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              placeholder="Enter location"
            />
            <button
              onClick={() => geocodePlace(userLocation)}
              className="bg-blue-600 text-white px-5 rounded"
            >
              Search
            </button>
          </div>

          {/* ALERTS */}
          {alerts.length > 0 && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-4 rounded">
              <h3 className="font-bold text-red-700 mb-2">🚨 Active Alerts</h3>
              {alerts.map((a) => (
                <p key={a.id}>• {a.message}</p>
              ))}
            </div>
          )}

          {/* MAP */}
          <div className="h-[380px] rounded overflow-hidden shadow mb-6">
            <MapContainer center={center || [20, 77]} zoom={12} className="h-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater center={center} />
              {center && <Marker position={center}><Popup>{userLocation}</Popup></Marker>}
              {stations.map(
                (s) =>
                  s.latitude &&
                  s.longitude && (
                    <Marker key={s.id} position={[s.latitude, s.longitude]}>
                      <Popup>{s.name}</Popup>
                    </Marker>
                  )
              )}
            </MapContainer>
          </div>

          {/* TABLES */}
          {showTable === "stations" && <StationTable stations={stations} />}
          {showTable === "readings" && <ReadingTable stations={stations} />}
          {showTable === "reports" && (
            <VerifiedReportsTable
              reports={verifiedReports}
              loading={loadingReports}
              updatingIds={updatingIds}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------- TABLE COMPONENTS ---------------- */

const Card = ({ children }) => (
  <div className="bg-gray-50 p-4 rounded shadow mb-3">{children}</div>
);

const StationTable = ({ stations }) => (
  <>
    <h3 className="font-bold mb-3">💧 Water Stations</h3>
    {stations.map((s) => (
      <Card key={s.id}>
        <b>{s.name}</b>
        <p className="text-sm">{s.location}</p>
      </Card>
    ))}
  </>
);

const ReadingTable = ({ stations }) => (
  <>
    <h3 className="font-bold mb-3">📊 Station Readings</h3>
    {stations.map((s) => (
      <Card key={s.id}>
        <b>{s.name}</b>
        {s.latest_readings?.map((r, i) => (
          <p key={i}>{r.parameter}: {r.value}</p>
        ))}
      </Card>
    ))}
  </>
);

const VerifiedReportsTable = ({ reports, loading }) => (
  <>
    <h3 className="font-bold mb-3">✅ Verified Reports</h3>
    {loading ? <p>Loading...</p> : reports.map((r) => (
      <Card key={r.id}>
        <p><b>Location:</b> {r.location}</p>
        <p><b>Status:</b> {r.status}</p>
      </Card>
    ))}
  </>
);
