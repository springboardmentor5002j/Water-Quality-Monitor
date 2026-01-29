import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NGODashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [role, setRole] = useState("");

  const BASE_URL = "http://127.0.0.1:8000";

  // 🔐 Check role + load reports
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    async function init() {
      const me = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await me.json();

      if (!["ngo", "admin", "authority"].includes(user.role)) {
        alert("Access denied");
        navigate("/dashboard");
        return;
      }

      setRole(user.role);
      fetchReports();
    }

    init();
  }, []);

  // 📥 Fetch all reports
  const fetchReports = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/reports/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setReports(data.data || []);
  };

  // ✅ Verify / Reject
  const updateStatus = async (id, status) => {
    const token = localStorage.getItem("token");
    await fetch(
      `${BASE_URL}/reports/${id}/status?status=${status}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    fetchReports();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-4">
        🏥 NGO Dashboard ({role})
      </h2>

      {reports.length === 0 && (
        <div className="p-4 bg-yellow-100 rounded">
          No reports available
        </div>
      )}

      <div className="grid gap-4">
        {reports.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded shadow">
            <div className="flex gap-4">
              <img
                src={r.photo_url}
                className="w-32 h-32 object-cover rounded"
                alt="report"
              />

              <div className="flex-1">
                <p><b>Location:</b> {r.location}</p>
                <p><b>Water Source:</b> {r.water_source}</p>
                <p><b>Description:</b> {r.description}</p>
                <p>
                  <b>Status:</b>{" "}
                  <span className={`px-2 py-1 rounded text-white ${
                    r.status === "verified"
                      ? "bg-green-600"
                      : r.status === "rejected"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                  }`}>
                    {r.status}
                  </span>
                </p>

                {r.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateStatus(r.id, "verified")}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "rejected")}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
