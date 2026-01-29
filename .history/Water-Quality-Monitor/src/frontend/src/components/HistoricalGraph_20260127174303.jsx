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

const HistoricalGraph = ({ stationId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stationId) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await fetchStationHistory(stationId);
        setData(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("History fetch failed", err);
        setData([]);
      }
      setLoading(false);
    };

    loadHistory();
  }, [stationId]);

  if (loading) return <p className="text-center">Loading history...</p>;
  if (!data.length) return <p className="text-center">No data available</p>;

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">
        📈 Historical Water Quality Trends
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="recorded_at"
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString()
            }
          />

          <YAxis />
          <Tooltip />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoricalGraph;
