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

      try {
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
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  /* ---------------- GEO CODE ---------------- */
  const geocodePlace = async (place) => {
    if (!place) return;
    try {
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
    } catch {
      fetchStationsByLocation(place);
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

  /* ---------------- ALERTS ---------------- */
  const fetchAlerts = async (location) => {
    const res = await fetch(
      `${BASE_URL}/alerts/by_location?location=${encodeURIComponent(location)}`
    );
    const data = await res.json();
    setAlerts(Array.isArray(data) ? data : data.alerts || []);
  };

  /* ---------------- VERIFY / REJECT ---------------- */
  const handleVerifyReject = async (reportId, action) => {
    setUpdatingIds((p) => [...p, reportId]);
    const token = localStorage.getItem("token");

    await fetch(
      `${BASE_URL}/reports/${reportId}/status?status=${
        action === "verify" ? "verified" : "rejected"
      }`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
    );

    setVerifiedReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: action === "verify" ? "verified" : "rejected" }
          : r
      )
    );

    setUpdatingIds((p) => p.filter((id) => id !== reportId));
  };

  /* ===================== UI ===================== */
  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1501594907352-04cda38ebc29')",
      }}
    >
      {/* TOP NAV BAR */}
      <div className="bg-white/90 backdrop-blur shadow-md px-6 py-3 flex flex-wrap gap-3 justify-center items-center sticky top-0 z-50">
        <span className="font-bold text-purple-700 text-lg mr-4">
          💧 Water Dashboard
        </span>

        <Link to="/reports/create" className="nav-btn">Submit Report</Link>
        <Link to="/reports/my" className="nav-btn">My Reports</Link>

        {["ngo", "admin", "authority"].includes(role) && (
          <Link to="/ngo/dashboard" className="nav-btn bg-purple-200">
            NGO Dashboard
          </Link>
        )}

        <button onClick={() => setShowTable("stations")} className="nav-btn">
          Stations
        </button>
        <button onClick={() => setShowTable("readings")} className="nav-btn">
          Readings
        </button>
        <button onClick={fetchVerifiedReports} className="nav-btn">
          Verified Reports
        </button>

        <Link to="/alerts" className="nav-btn bg-red-200">
          Alerts ({alerts.length})
        </Link>

        <Link to="/historical" className="nav-btn bg-green-200">
          📈 Historical
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur p-6 mt-6 rounded-2xl shadow-xl">
        {/* Search */}
        <div className="flex gap-2 mb-4">
          <input
            value={userLocation}
            onChange={(e) => setUserLocation(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="Enter location"
          />
          <button
            onClick={() => geocodePlace(userLocation)}
            className="bg-purple-600 text-white px-4 rounded-lg"
          >
            Search
          </button>
        </div>

        {/* MAP */}
        <div className="h-[400px] mb-4 rounded-xl overflow-hidden shadow">
          <MapContainer center={center || [20, 77]} zoom={12} className="h-full w-full">
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
                      <strong>{s.name}</strong>
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
            onAction={handleVerifyReject}
            updatingIds={updatingIds}
            loading={loadingReports}
          />
        )}
      </div>
    </div>
  );
}

/* ================= TABLE COMPONENTS ================= */
const StationTable = ({ stations }) => (
  <>
    <h3 className="font-bold text-indigo-700 mb-2">Water Stations</h3>
    {stations.map((s) => (
      <div key={s.id} className="border p-3 mb-2 rounded-lg">
        <p className="font-semibold">{s.name}</p>
        <p className="text-gray-600">{s.location}</p>
      </div>
    ))}
  </>
);

const ReadingTable = ({ stations }) => (
  <>
    <h3 className="font-bold text-indigo-700 mb-2">Station Readings</h3>
    {stations.map((s) => (
      <div key={s.id} className="border p-3 mb-2 rounded-lg">
        <p className="font-semibold">{s.name}</p>
        {s.latest_readings?.map((r, i) => (
          <div key={i}>{r.parameter}: {r.value}</div>
        ))}
      </div>
    ))}
  </>
);

const VerifiedReportsTable = ({ reports, onAction, updatingIds, loading }) => (
  <>
    <h3 className="font-bold text-indigo-700 mb-2">Verified Reports</h3>
    {loading && <p>Loading...</p>}
    {reports.map((r) => {
      const isUpdating = updatingIds.includes(r.id);
      return (
        <div key={r.id} className="border p-3 mb-2 rounded-lg">
          <p><b>Location:</b> {r.location}</p>
          <p><b>Status:</b> {r.status}</p>

          {r.status === "pending" && (
            <div className="mt-2 flex gap-3 justify-end">
              <button
                onClick={() => onAction(r.id, "verify")}
                disabled={isUpdating}
                className="px-4 py-1 rounded-full bg-green-600 text-white"
              >
                Verify
              </button>
              <button
                onClick={() => onAction(r.id, "reject")}
                disabled={isUpdating}
                className="px-4 py-1 rounded-full bg-red-600 text-white"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      );
    })}
  </>
);
