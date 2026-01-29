import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function MyReportsPage({ token }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyReports() {
      try {
        const res = await axios.get("http://localhost:8000/reports/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(res.data.data);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMyReports();
  }, [token]);

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>My Reports</h2>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>📋 My Reports</h2>
        <button onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
      </div>

      {reports.length === 0 ? (
        <p>No reports submitted yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 20 }}>
          {reports.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#fff",
                padding: 15,
                borderRadius: 8,
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={r.photo_url}
                alt={`Report ${r.id}`}
                style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 6, marginBottom: 10 }}
              />
              <p><strong>Location:</strong> {r.location}</p>
              <p><strong>Source:</strong> {r.water_source}</p>
              <p><strong>Description:</strong> {r.description}</p>
              <p><strong>Status:</strong> {r.status}</p>
              <p><strong>Reported by:</strong> {r.reported_by}</p>
              <p><strong>Date:</strong> {new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
