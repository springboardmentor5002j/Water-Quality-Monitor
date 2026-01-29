import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NGODashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [role, setRole] = useState("");
  const [updatingIds, setUpdatingIds] = useState([]); // track reports being updated
  const [loading, setLoading] = useState(false); // loading state

  const BASE_URL = "http://127.0.0.1:8000";

  /* ---------------- CHECK ROLE + LOAD REPORTS ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    async function init() {
      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await res.json();

        if (!["ngo", "admin", "authority"].includes(user.role)) {
          alert("Access denied");
          navigate("/dashboard");
          return;
        }

        setRole(user.role);
        fetchReports();
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    }

    init();
  }, []);

  /* ---------------- FETCH REPORTS ---------------- */
  const fetchReports = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${BASE_URL}/reports/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReports(data.data || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VERIFY / REJECT REPORT ---------------- */
  const updateStatus = async (id, status) => {
    setUpdatingIds((prev) => [...prev, id]);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${BASE_URL}/reports/${id}/status?status=${status}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to update status");

      // Update UI immediately without refetch
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update report status. Try again.");
    } finally {
      setUpdatingIds((prev) => prev.filter((i) => i !== id));
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-4">🏥 NGO Dashboard ({role})</h2>

      {loading && (
        <div className="p-4 bg-blue-100 rounded mb-4">Loading reports...</div>
      )}

      {!loading && reports.length === 0 && (
        <div className="p-4 bg-yellow-100 rounded">No reports available</div>
      )}

      <div className="grid gap-4">
        {reports.map((r) => {
          const isUpdating = updatingIds.includes(r.id);

          return (
            <div
              key={r.id}
              className="bg-white p-4 rounded shadow flex gap-4"
            >
              {/* REPORT IMAGE */}
              <img
                src={r.photo_url}
                className="w-32 h-32 object-cover rounded"
                alt="report"
              />

              {/* REPORT DETAILS */}
              <div className="flex-1">
                <p><b>Location:</b> {r.location}</p>
                <p><b>Water Source:</b> {r.water_source}</p>
                <p><b>Description:</b> {r.description}</p>
                <p>
                  <b>Status:</b>{" "}
                  <span
                    className={`px-2 py-1 rounded text-white ${
                      r.status === "verified"
                        ? "bg-green-600"
                        : r.status === "rejected"
                        ? "bg-red-600"
                        : "bg-yellow-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </p>

                {/* VERIFY / REJECT BUTTONS */}
                {r.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateStatus(r.id, "verified")}
                      disabled={isUpdating}
                      className={`px-3 py-1 rounded text-white ${
                        isUpdating ? "bg-green-300 cursor-not-allowed" : "bg-green-600"
                      }`}
                    >
                      {isUpdating ? "Updating..." : "Verify"}
                    </button>

                    <button
                      onClick={() => updateStatus(r.id, "rejected")}
                      disabled={isUpdating}
                      className={`px-3 py-1 rounded text-white ${
                        isUpdating ? "bg-red-300 cursor-not-allowed" : "bg-red-600"
                      }`}
                    >
                      {isUpdating ? "Updating..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
