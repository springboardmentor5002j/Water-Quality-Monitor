import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ✅ Correct import
import { fetchStationHistory } from "../api/reportApi.js";

const dummyData = [
  { recorded_at: "2026-01-20", value: 3 },
  { recorded_at: "2026-01-21", value: 6 },
];

const HistoricalGraph = ({ stationId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stationId) {
      setData(dummyData); // fallback
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await fetchStationHistory(stationId);

        // ✅ If backend returns empty → show dummy graph
        if (Array.isArray(res) && res.length > 0) {
          setData(res);
        } else {
          setData(dummyData);
        }
      } catch (err) {
        console.error("History fetch failed", err);
        setData(dummyData); // fallback on error
      }
      setLoading(false);
    };

    loadHistory();
  }, [stationId]);

  if (loading) {
    return <p className="text-center">Loading history...</p>;
  }

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">
        📈 Historical Water Quality Trends
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="recorded_at" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoricalGraph;
