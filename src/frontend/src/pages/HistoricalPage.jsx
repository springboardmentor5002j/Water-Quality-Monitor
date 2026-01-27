import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HistoricalChart from "../components/HistoricalChart";

export default function HistoricalPage() {
  const navigate = useNavigate();

  const [location, setLocation] = useState("Hyderabad");
  const [parameter, setParameter] = useState("pH");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetch(
      `http://localhost:8000/readings/history/location?location=${location}&parameter=${parameter}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("No data");
        return res.json();
      })
      .then((data) => setChartData(data))
      .catch(() => setChartData([]));
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
        <button onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>

      {/* 🔽 Filters */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div>
          <label>Location</label><br />
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option>Hyderabad</option>
            <option>Bangalore</option>
            <option>Mumbai</option>
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

      {/* 📊 ONE CHART ONLY */}
      <HistoricalChart data={chartData} parameter={parameter} />
    </div>
  );
}
