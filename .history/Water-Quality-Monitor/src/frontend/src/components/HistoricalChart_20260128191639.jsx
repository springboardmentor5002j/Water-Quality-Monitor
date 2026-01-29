import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function HistoricalChart({ data = [], parameter }) {
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

  // ✅ Sort + normalize data
  const chartData = [...data]
    .map((d) => ({
      ...d,
      value: Number(d.value),
      recorded_at: new Date(d.recorded_at).toISOString(),
    }))
    .sort(
      (a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)
    );

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
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="recorded_at"
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString()
            }
            minTickGap={30}
          />

          <YAxis
            allowDecimals
            domain={["auto", "auto"]}
          />

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
            activeDot={{ r: 6 }}
            name={`${parameter} History`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
