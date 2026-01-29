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
import { fetchStationHistory } from "../api";

const HistoricalGraph = ({ stationId }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchStationHistory(stationId)
      .then((res) => {
        const grouped = {};

        res.data.forEach((item) => {
          const date = item.recorded_at.split("T")[0];
          if (!grouped[date]) grouped[date] = { date };
          grouped[date][item.parameter] = item.value;
        });

        setChartData(Object.values(grouped));
      })
      .catch((err) => console.error(err));
  }, [stationId]);

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Historical Water Quality Trends
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
