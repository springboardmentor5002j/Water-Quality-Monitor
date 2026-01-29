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
  const [updatingIds, setUpdatingIds] = useState([]); // track updating reports
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
          localStorage.setItem("userLocation", data.location);
          geocodePlace(data.location);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
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
    try {
      const res = await fetch(
        `${BASE_URL}/stations/by_location_full?lat=${lat}&lon=${lon}&location=${encodeURIComponent(
          location
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setStations(data.stations || []);
      setAlerts(data.alerts || []);
    } catch {
      setStations([]);
      setAlerts([]);
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
        setCenter([data.user_location.latitude, data.user_location.longitude]);
      }
    } catch {
      setStations([]);
      setAlerts([]);
    }
  };

  /* ---------------- VERIFIED REPORTS ---------------- */
  const fetchVerifiedReports = async () => {
    const token = localStorage.getItem("token");
    if (!userLocation) return;

    setLoadingReports(true);
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
    } catch (err) {
      console.error("Error fetching verified reports:", err);
      setVerifiedReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  /* ---------------- ALERTS ---------------- */
  const fetchAlerts = async (location) => {
    try {
      const res = await fetch(
        `${BASE_URL}/alerts/by_location?location=${encodeURIComponent(location)}`
      );
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : data.alerts || []);
    } catch {
      setAlerts([]);
    }
  };

  /* ---------------- VERIFY / REJECT ---------------- */
  const handleVerifyReject = async (reportId, action) => {
    setUpdatingIds((prev) => [...prev, reportId]);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${BASE_URL}/reports/${reportId}/status?status=${
          action === "verify" ? "verified" : "rejected"
        }`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to update status");

      setVerifiedReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: action === "verify" ? "verified" : "rejected" }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update report status. Try again.");
    } finally {
      setUpdatingIds((prev) => prev.filter((id) => id !== reportId));
    }
  };

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto grid grid-cols-[220px_1fr] gap-6 p-6">

        {/* ================= SIDEBAR ================= */}
        <aside className="bg-white p-4 rounded shadow space-y-3">
          <div className="font-semibold">📍 Dashboard</div>

          <Link to="/reports/create" className="block text-blue-600">
            Submit Report
          </Link>

          <Link to="/reports/my" className="block text-blue-600">
            My Reports
          </Link>

          <div className="text-sm text-gray-600">Role: {role}</div>

          {/* NGO DASHBOARD LINK */}
          {["ngo", "admin", "authority"].includes(role) && (
            <Link
              to="/ngo/dashboard"
              className="block text-center p-2 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
            >
              🏥 NGO Dashboard
            </Link>
          )}

          <button
            onClick={() => setShowTable("stations")}
            className="w-full p-2 bg-gray-200 rounded"
          >
            Water Stations
          </button>

          <button
            onClick={() => setShowTable("readings")}
            className="w-full p-2 bg-gray-200 rounded"
          >
            Station Readings
          </button>

          <button
            onClick={fetchVerifiedReports}
            className="w-full p-2 bg-gray-200 rounded"
          >
            Verified Reports
          </button>

          <Link
            to="/alerts"
            className="block text-center p-2 bg-red-100 rounded text-red-700"
          >
            Alerts ({alerts.length})
          </Link>

          <Link
            to="/historical"
            className="block text-center p-2 bg-green-100 rounded text-green-700"
          >
            📈 Historical Data
          </Link>
        </aside>

        {/* ================= MAIN ================= */}
        <main className="bg-white p-6 rounded shadow">

          {/* Location search */}
          <div className="flex gap-2 mb-4">
            <input
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              className="flex-1 border p-2 rounded"
              placeholder="Enter location"
            />
            <button
              onClick={() => geocodePlace(userLocation)}
              className="bg-blue-500 text-white px-4 rounded"
            >
              Search
            </button>
          </div>

          {/* ALERTS */}
          {alerts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-red-600 font-bold mb-2">🚨 Active Alerts</h3>
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="border-l-4 border-red-600 bg-red-50 p-3 mb-2"
                >
                  <strong>{a.type}</strong>
                  <p>{a.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* MAP */}
          <div className="h-[400px] mb-4">
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
        </main>
      </div>
    </div>
  );
}

/* ================= TABLE COMPONENTS ================= */

const StationTable = ({ stations }) => (
  <>
    <h3 className="font-semibold mb-2">Water Stations</h3>
    {stations.length === 0 ? (
      <p>No stations found.</p>
    ) : (
      stations.map((s) => (
        <div key={s.id} className="border p-3 mb-2">
          <p><b>{s.name}</b></p>
          <p>{s.location}</p>
        </div>
      ))
    )}
  </>
);

const ReadingTable = ({ stations }) => (
  <>
    <h3 className="font-semibold mb-2">Station Readings</h3>
    {stations.map((s) => (
      <div key={s.id} className="border p-3 mb-2">
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

const VerifiedReportsTable = ({ reports, onAction, updatingIds, loading }) => (
  <>
    <h3 className="font-semibold mb-2">Verified Reports</h3>

    {loading && <p className="mb-2 text-blue-600">Loading verified reports...</p>}

    {reports.length === 0 && !loading ? (
      <p>No verified reports.</p>
    ) : (
      reports.map((r) => {
        let bgColor = "bg-gray-100";
        if (r.status === "pending") bgColor = "bg-yellow-100";
        else if (r.status === "verified") bgColor = "bg-green-100";
        else if (r.status === "rejected") bgColor = "bg-red-100";

        const isUpdating = updatingIds.includes(r.id);

        return (
          <div key={r.id} className={`border p-3 mb-2 rounded ${bgColor}`}>
            <p><b>Location:</b> {r.location}</p>
            <p><b>Water Source:</b> {r.water_source}</p>
            <p><b>Description:</b> {r.description}</p>
            <p><b>Status:</b> {r.status}</p>

            {/* Verify / Reject buttons */}
            {r.status === "pending" && onAction && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => onAction(r.id, "verify")}
                  disabled={isUpdating}
                  className={`px-3 py-1 rounded text-white ${
                    isUpdating ? "bg-green-300 cursor-not-allowed" : "bg-green-500"
                  }`}
                >
                  {isUpdating ? "Updating..." : "Verify"}
                </button>

                <button
                  onClick={() => onAction(r.id, "reject")}
                  disabled={isUpdating}
                  className={`px-3 py-1 rounded text-white ${
                    isUpdating ? "bg-red-300 cursor-not-allowed" : "bg-red-500"
                  }`}
                >
                  {isUpdating ? "Updating..." : "Reject"}
                </button>
              </div>
            )}
          </div>
        );
      })
    )}
  </>
);
