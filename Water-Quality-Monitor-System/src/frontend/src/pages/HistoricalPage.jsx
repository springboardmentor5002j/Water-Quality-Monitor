import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HistoricalChart from "../components/HistoricalChart";
import axios from "axios";

export default function HistoricalPage() {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]); // all locations from backend
  const [location, setLocation] = useState(""); // selected location
  const [parameter, setParameter] = useState("pH");
  const [chartData, setChartData] = useState([]);

  // ✅ Fetch all locations from backend
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await axios.get("http://localhost:8000/stations/locations");
        setLocations(res.data);
        if (res.data.length > 0) setLocation(res.data[0]); // default first location
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    }
    fetchLocations();
  }, []);

  // ✅ Fetch historical data whenever location or parameter changes
  useEffect(() => {
    if (!location) return;

    async function fetchHistory() {
      try {
        const res = await axios.get(
          `http://localhost:8000/readings/history/location?location=${location}&parameter=${parameter}`
        );
        setChartData(res.data);
      } catch (err) {
        console.error("Error fetching history:", err);
        setChartData([]);
      }
    }
    fetchHistory();
  }, [location, parameter]);

  return (
    <div style={{ padding: 20, background: "#f9fafb", minHeight: "100vh" }}>
      
      {/* 🔝 Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2>📈 Historical Water Quality Data</h2>
        <button onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
      </div>

      {/* 🔽 Filters */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div>
          <label>Location</label><br />
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Parameter</label><br />
          <select value={parameter} onChange={(e) => setParameter(e.target.value)}>
            <option>pH</option>
            <option>turbidity</option>
            <option>arsenic</option>
            <option>lead</option>
            <option>DO</option>
          </select>
        </div>
      </div>

      {/* 📊 Historical Chart */}
      <HistoricalChart data={chartData} parameter={parameter} />
    </div>
  );
}
