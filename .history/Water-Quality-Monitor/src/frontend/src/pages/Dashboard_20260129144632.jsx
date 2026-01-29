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
    } catch {
      setVerifiedReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

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

  const handleVerifyReject = async (reportId, action) => {
    setUpdatingIds((prev) => [...prev, reportId]);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${BASE_URL}/reports/${reportId}/status?status=${
          action === "verify" ? "verified" : "rejected"
        }`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Failed to update status");

      setVerifiedReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: action === "verify" ? "verified" : "rejected" }
            : r
        )
      );
    } catch {
      alert("Failed to update report status. Try again.");
    } finally {
      setUpdatingIds((prev) => prev.filter((id) => id !== reportId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4">
      
      {/* ---------------- TOP TOOLBAR ---------------- */}
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        <button
          onClick={() => setShowTable("stations")}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600 transition"
        >
          Water Stations
        </button>
        <button
          onClick={() => setShowTable("readings")}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600 transition"
        >
          Station Readings
        </button>
        <button
          onClick={fetchVerifiedReports}
          className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
        >
          Verified Reports
        </button>
        <Link
          to="/alerts"
          className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
        >
          Alerts ({alerts.length})
        </Link>
        <Link
          to="/historical"
          className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 transition"
        >
          📈 Historical Data
        </Link>
      </div>

      {/* ---------------- LOCATION SEARCH ---------------- */}
      <div className="flex gap-2 justify-center mb-4">
        <input
          value={userLocation}
          onChange={(e) => setUserLocation(e.target.value)}
          className="w-60 border rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="Enter location"
        />
        <button
          onClick={() => geocodePlace(userLocation)}
          className="bg-purple-600 text-white px-4 rounded-lg hover:bg-purple-700 transition"
        >
          Search
        </button>
      </div>

      {/* ---------------- ALERTS ---------------- */}
      {alerts.length > 0 && (
        <div className="max-w-6xl mx-auto mb-4 space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="border-l-4 border-red-600 bg-red-50 p-3 rounded shadow-sm"
            >
              <strong className="text-red-700">{a.type}</strong>
              <p className="text-red-600">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- MAP ---------------- */}
      <div className="h-[400px] max-w-6xl mx-auto mb-4 rounded-lg overflow-hidden shadow-md">
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

      {/* ---------------- TABLES ---------------- */}
      <div className="max-w-6xl mx-auto">
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
    <h3 className="font-bold mb-2 text-indigo-700 text-lg">Water Stations</h3>
    {stations.length === 0 ? (
      <p className="text-gray-500">No stations found.</p>
    ) : (
      stations.map((s) => (
        <div
          key={s.id}
          className="border p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition"
        >
          <p className="font-semibold text-gray-800">{s.name}</p>
          <p className="text-gray-600">{s.location}</p>
        </div>
      ))
    )}
  </>
);

const ReadingTable = ({ stations }) => (
  <>
    <h3 className="font-bold mb-2 text-indigo-700 text-lg">Station Readings</h3>
    {stations.map((s) => (
      <div
        key={s.id}
        className="border p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition"
      >
        <p className="font-semibold text-gray-800">{s.name}</p>
        {s.latest_readings?.map((r, i) => (
          <div key={i} className="text-gray-700">
            {r.parameter}: {r.value}
          </div>
        ))}
      </div>
    ))}
  </>
);

const VerifiedReportsTable = ({ reports, onAction, updatingIds, loading }) => (
  <>
    <h3 className="font-bold mb-2 text-indigo-700 text-lg">Verified Reports</h3>

    {loading && <p className="mb-2 text-blue-600">Loading verified reports...</p>}

    {reports.length === 0 && !loading ? (
      <p className="text-gray-500">No verified reports.</p>
    ) : (
      reports.map((r) => {
        let bgColor = "bg-gray-50";
        if (r.status === "pending") bgColor = "bg-yellow-50";
        else if (r.status === "verified") bgColor = "bg-green-50";
        else if (r.status === "rejected") bgColor = "bg-red-50";

        const isUpdating = updatingIds.includes(r.id);

        return (
          <div
            key={r.id}
            className={`border p-3 mb-2 rounded-lg shadow-sm transition ${bgColor}`}
          >
            <p className="font-semibold text-gray-800">
              <b>Location:</b> {r.location}
            </p>
            <p className="text-gray-700">
              <b>Water Source:</b> {r.water_source}
            </p>
            <p className="text-gray-700">
              <b>Description:</b> {r.description}
            </p>
            <p className="font-medium">
              <b>Status:</b> {r.status}
            </p>

            {r.status === "pending" && onAction && (
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => onAction(r.id, "verify")}
                  disabled={isUpdating}
                  className={`px-4 py-1 rounded-lg font-semibold text-white ${
                    isUpdating
                      ? "bg-green-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } transition`}
                >
                  {isUpdating ? "Updating..." : "Verify"}
                </button>

                <button
                  onClick={() => onAction(r.id, "reject")}
                  disabled={isUpdating}
                  className={`px-4 py-1 rounded-lg font-semibold text-white ${
                    isUpdating
                      ? "bg-red-300 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  } transition`}
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
