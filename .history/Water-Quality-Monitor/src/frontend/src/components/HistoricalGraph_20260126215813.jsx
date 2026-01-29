import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const HistoricalGraph = ({ stationId }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/stations/${stationId}/history`)
      .then((res) => res.json())
      .then((data) => {
        const grouped = {};

        data.forEach((item) => {
          const date = item.recorded_at.split("T")[0];
          if (!grouped[date]) grouped[date] = { date };
          grouped[date][item.parameter] = item.value;
        });

        setChartData(Object.values(grouped));
      });
  }, [stationId]);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">
        Water Quality – Historical Trends
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line type="monotone" dataKey="pH" stroke="#2563eb" />
          <Line type="monotone" dataKey="turbidity" stroke="#dc2626" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoricalGraph;
