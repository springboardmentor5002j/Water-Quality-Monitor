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
          <div className="text-blue-600">Role: {role}</div>

          <div className="mt-4 space-y-2">
            <button onClick={() => setShowTable("stations")} className="btn">
              WaterStations
            </button>
            <button onClick={() => setShowTable("readings")} className="btn">
              StationReadings
            </button>
            <button onClick={fetchVerifiedReports} className="btn">
              Verified Reports
            </button>
            <button
              onClick={() => setShowTable("history")}
              className="btn bg-green-600 text-white"
            >
              Historical Graph
            </button>

            <Link to="/alerts" className="block text-center bg-red-100 p-2 rounded">
              Alerts {alerts.length > 0 && `(${alerts.length})`}
            </Link>
          </div>
        </aside>

        {/* MAIN */}
        <main className="bg-white p-6 rounded shadow">
          {/* MAP */}
          <div className="h-[400px] mb-6">
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

          {/* WATER STATIONS */}
          {showTable === "stations" && (
            <>
              <h3 className="text-lg font-semibold mb-3">
                Nearby Water Stations
              </h3>
              {stations.length === 0 && <p>No stations found</p>}
              {stations.map((s) => (
                <div key={s.id} className="border p-3 mb-2 rounded">
                  <p><b>{s.name}</b></p>
                  <p>{s.location}</p>
                </div>
              ))}
            </>
          )}

          {/* STATION READINGS */}
          {showTable === "readings" && (
            <>
              <h3 className="text-lg font-semibold mb-3">
                Station Readings
              </h3>
              {stations.map((s) => (
                <div key={s.id} className="border p-3 mb-3 rounded">
                  <b>{s.name}</b>
                  {Array.isArray(s.latest_readings) &&
                  s.latest_readings.length > 0 ? (
                    s.latest_readings.map((r, i) => (
                      <p key={i}>
                        {r.parameter}: {r.value}
                      </p>
                    ))
                  ) : (
                    <p>No readings</p>
                  )}
                </div>
              ))}
            </>
          )}

          {/* VERIFIED REPORTS */}
          {showTable === "reports" && (
            <>
              <h3 className="text-lg font-semibold mb-3">
                Verified Reports
              </h3>
              {verifiedReports.length === 0 && <p>No verified reports</p>}
              {verifiedReports.map((r) => (
                <div key={r.id} className="border p-3 mb-2 rounded">
                  {r.description}
                </div>
              ))}
            </>
          )}

          {/* HISTORICAL GRAPH */}
          {showTable === "history" && stations.length > 0 && (
            <HistoricalGraph stationId={stations[0].id} />
          )}
        </main>
      </div>
    </div>
  );
}
