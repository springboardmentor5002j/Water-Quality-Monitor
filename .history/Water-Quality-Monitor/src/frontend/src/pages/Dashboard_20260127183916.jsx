import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import HistoricalGraph from "../components/HistoricalGraph";

/* ---------- LEAFLET ICON FIX ---------- */
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* ---------- MAP CENTER CONTROLLER ---------- */
function CenterController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 12);
  }, [position, map]);
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const API = "http://127.0.0.1:8000";

  const [mapPoint, setMapPoint] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [stationsList, setStationsList] = useState([]);
  const [alertsList, setAlertsList] = useState([]);
  const [verifiedList, setVerifiedList] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [view, setView] = useState("stations");

  /* ---------- AUTH USER ---------- */
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem("token");
        return navigate("/login");
      }

      const user = await res.json();
      setUserRole(user.role || "");

      if (user.location) {
        setLocationName(user.location);
        locateUser(user.location);
        loadAlerts(user.location);
      }
    };

    loadUser();
  }, []);

  /* ---------- GEO LOCATION ---------- */
  const locateUser = async (place) => {
    try {
      const res = await fetch(
        `${API}/geo/geocode?place=${encodeURIComponent(place)}`
      );
      if (res.ok) {
        const geo = await res.json();
        if (geo.lat && geo.lon) {
          setMapPoint([geo.lat, geo.lon]);
          loadStations(geo.lat, geo.lon, place);
          return;
        }
      }
      loadStationsByName(place);
    } catch {
      loadStationsByName(place);
    }
  };

  /* ---------- STATIONS ---------- */
  const loadStations = async (lat, lon, place) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API}/stations/by_location_full?lat=${lat}&lon=${lon}&location=${encodeURIComponent(
        place
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setStationsList(data.stations || []);
    setView("stations");
  };

  const loadStationsByName = async (place) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API}/stations/by_location_full?location=${encodeURIComponent(place)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setStationsList(data.stations || []);
    setAlertsList(data.alerts || []);
    if (data.user_location) {
      setMapPoint([
        data.user_location.latitude,
        data.user_location.longitude,
      ]);
    }
    setView("stations");
  };

  /* ---------- VERIFIED REPORTS ---------- */
  const loadVerifiedReports = async () => {
    if (!locationName) return;
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API}/stations/verified_reports_by_location?location=${encodeURIComponent(
        locationName
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setVerifiedList(data.verified_reports || []);
    setView("reports");
  };

  /* ---------- ALERTS ---------- */
  const loadAlerts = async (place) => {
    const res = await fetch(
      `${API}/alerts/by_location?location=${encodeURIComponent(place)}`
    );
    const data = await res.json();
    setAlertsList(data.alerts || []);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-[230px_1fr] gap-6">
        {/* SIDEBAR */}
        <aside className="bg-white rounded shadow p-4 space-y-3">
          <h2 className="font-semibold">🗺 Dashboard</h2>
          <p className="text-sm text-blue-600">Role: {userRole}</p>

          <button onClick={() => setView("stations")} className="btn">
            Water Stations
          </button>

          <button onClick={() => setView("readings")} className="btn">
            Station Readings
          </button>

          <button onClick={loadVerifiedReports} className="btn">
            Verified Reports
          </button>

          <button
            onClick={() => setView("history")}
            className="btn bg-green-600 text-white"
          >
            Historical Graph
          </button>

          <Link
            to="/alerts"
            className="block text-center bg-red-100 p-2 rounded"
          >
            Alerts {alertsList.length > 0 && `(${alertsList.length})`}
          </Link>

          <Link to="/reports/my" className="block text-center text-sm">
            My Reports
          </Link>
        </aside>

        {/* MAIN */}
        <main className="bg-white rounded shadow p-6">
          {/* MAP */}
          <div className="h-[400px] mb-6">
            <MapContainer
              center={mapPoint || [20, 77]}
              zoom={12}
              className="h-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CenterController position={mapPoint} />
              {mapPoint && (
                <Marker position={mapPoint}>
                  <Popup>{locationName}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* GRAPH */}
          {view === "history" && stationsList.length > 0 && (
            <HistoricalGraph stationId={stationsList[0].id} />
          )}
        </main>
      </div>
    </div>
  );
}
