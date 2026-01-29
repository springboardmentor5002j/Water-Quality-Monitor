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

import { fetchStationHistory } from "../api/reportApi.js";

// -------- Helpers --------
const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN"); // 20/1/2026
};

// Group same-date readings & calculate average
const groupByDateAverage = (rawData) => {
  const map = {};

  rawData.forEach((item) => {
    const date = formatDate(item.recorded_at);
    if (!map[date]) {
      map[date] = { sum: 0, count: 0 };
    }
    map[date].sum += item.value;
    map[date].count += 1;
  });

  return Object.keys(map).map((date) => ({
    date,
    value: +(map[date].sum / map[date].count).toFixed(2),
  }));
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border p-2 rounded shadow text-sm">
        <p className="font-semibold">📅 {label}</p>
        <p>
          💧 Avg Value: <strong>{payload[0].value}</strong>
        </p>
      </div>
    );
  }
  return null;
};

const HistoricalGraph = ({ stationId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stationId) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await fetchStationHistory(stationId);

        // ✅ FIX: merge duplicate dates
        const formatted = groupByDateAverage(res);

        setData(formatted);
      } catch (err) {
        console.error("History fetch failed", err);
      }
      setLoading(false);
    };

    loadHistory();
  }, [stationId]);

  if (loading) return <p className="text-center">Loading history...</p>;
  if (!data.length) return <p className="text-center">No data available</p>;

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-semibold mb-3 text-center">
        📈 Historical Water Quality Trends (Daily Average)
      </h3>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            label={{
              value: "Water Quality Value",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoricalGraph;
