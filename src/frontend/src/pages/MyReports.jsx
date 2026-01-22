import React, { useEffect, useState } from "react";
import {
  getMyReports,
  getAllReports,
  updateReportStatus,
  deleteReport,
  assignStation,
} from "../api/reportApi";
import { useNavigate, Link } from "react-router-dom";

const API_URL = "http://localhost:8000";

function MyReports() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [role, setRole] = useState(null);
  const [reports, setReports] = useState([]);

  // Filters (Admin / Authority)
  const [filters, setFilters] = useState({
    username: "",
    location: "",
    water_source: "",
    status: "all",
    start_date: "",
    end_date: "",
  });

  /* ---------------- LOAD USER + REPORTS ---------------- */
  async function loadReports() {
    try {
      // Get current user info
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me = await meRes.json();
      setRole(me.role);

      let res;
      if (me.role === "admin" || me.role === "authority" || me.role === "ngo") {
        const query = new URLSearchParams(
          Object.fromEntries(
            Object.entries(filters).filter(
              ([_, v]) => v && v !== "all"
            )
          )
        ).toString();
        res = await getAllReports(token, query);
      } else {
        res = await getMyReports(token);
      }

      // ------------------- FIX BUG -------------------
      // Ensure reports is always an array
      setReports(Array.isArray(res.data) ? res.data : res.data?.data || []);

      // Optional: debug backend response
      console.log("Reports loaded:", res.data);
    } catch (err) {
      console.error(err);
      alert("Authentication failed");
      navigate("/login");
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadReports();
    // eslint-disable-next-line
  }, [token]);

  /* ---------------- ACTIONS ---------------- */
  async function changeStatus(id, status) {
    await updateReportStatus(id, status, token);
    loadReports();
  }

  async function removeReport(id) {
    if (!window.confirm("Delete this report?")) return;
    await deleteReport(id, token);
    loadReports();
  }

  async function handleAssignStation(id) {
    const stationId = prompt("Enter station ID");
    if (!stationId) return;
    await assignStation(id, stationId, token);
    alert("Station assigned");
  }

  if (!role) {
    return <p className="text-center mt-10">Loading user role…</p>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">
          {role === "citizen" && "My Reports"}
          {role === "ngo" && "NGO Reports"}
          {role === "authority" && "Authority Reports"}
          {role === "admin" && "All Reports (Admin)"}
        </h2>

        {/* ADMIN / AUTHORITY FILTERS */}
        {(role === "admin" || role === "authority") && (
          <div className="bg-white p-4 mb-6 rounded shadow grid grid-cols-2 md:grid-cols-3 gap-4">
            <input
              placeholder="Username"
              className="border p-2 rounded"
              onChange={(e) =>
                setFilters({ ...filters, username: e.target.value })
              }
            />
            <input
              placeholder="Location"
              className="border p-2 rounded"
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
            />
            <input
              placeholder="Water Source"
              className="border p-2 rounded"
              onChange={(e) =>
                setFilters({ ...filters, water_source: e.target.value })
              }
            />
            <select
              className="border p-2 rounded"
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <input
              type="date"
              className="border p-2 rounded"
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value })
              }
            />
            <input
              type="date"
              className="border p-2 rounded"
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value })
              }
            />
            <button
              onClick={loadReports}
              className="bg-blue-600 text-white rounded px-4 py-2 col-span-full"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* CREATE REPORT BUTTON (CITIZEN) */}
        {role === "citizen" && (
          <Link to="/reports/create">
            <button className="mb-6 px-5 py-2 bg-green-600 text-white rounded">
              + Create Report
            </button>
          </Link>
        )}

        {/* REPORT LIST */}
        {reports.length === 0 ? (
          <p>No reports found.</p>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="bg-white p-6 mb-4 rounded shadow flex gap-6">
              <img src={`${API_URL}${r.photo_url}`} className="w-32 h-32 rounded object-cover" alt="report" />
              <div className="flex-1">
                <h3 className="font-semibold">📍 {r.location}</h3>
                <p>💧 {r.water_source}</p>
                <p className="text-sm text-gray-600">
                  👤 {r.reported_by || "Unknown"}
                </p>
                <p className="text-sm text-gray-500">
                  🕒 {new Date(r.created_at).toLocaleString()}
                </p>

                <span className="inline-block mt-2 px-3 py-1 bg-gray-200 rounded">
                  {r.status.toUpperCase()}
                </span>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/reports/${r.id}`)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    View
                  </button>

                  {role === "ngo" && r.status === "pending" && (
                    <button
                      onClick={() => changeStatus(r.id, "verified")}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Verify
                    </button>
                  )}

                  {role === "authority" && (
                    <>
                      <button
                        onClick={() => changeStatus(r.id, "verified")}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => changeStatus(r.id, "rejected")}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAssignStation(r.id)}
                        className="bg-purple-600 text-white px-3 py-1 rounded"
                      >
                        Assign
                      </button>
                    </>
                  )}

                  {role === "admin" && (
                    <>
                      <button
                        onClick={() => changeStatus(r.id, "verified")}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => changeStatus(r.id, "rejected")}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => removeReport(r.id)}
                        className="bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyReports;