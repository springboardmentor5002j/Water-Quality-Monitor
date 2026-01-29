import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function HistoricalChart({ data, parameter }) {
  // 🛑 Safety check
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div
        style={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed #ccc",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <p>No historical data available</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 8,
        border: "1px solid #e5e7eb",
      }}
    >
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          
          <XAxis
            dataKey="recorded_at"
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString()
            }
          />

          <YAxis />

          <Tooltip
            labelFormatter={(value) =>
              new Date(value).toLocaleString()
            }
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4 }}
            name={`${parameter} History`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}