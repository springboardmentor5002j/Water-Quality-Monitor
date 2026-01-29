import React, { useEffect, useState } from "react";
import {
  getMyReports,
  getAllReports,
  updateReportStatus,
  deleteReport,
  assignStation,
  getVerifiedReportsByLocation,
} from "../api/reportApi";
import { useNavigate, Link } from "react-router-dom";

const API_URL = "http://localhost:8000";

function MyReports() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [role, setRole] = useState(null);
  const [reports, setReports] = useState([]);
  const [ngoLocation, setNgoLocation] = useState("");

  const [filters, setFilters] = useState({
    username: "",
    location: "",
    water_source: "",
    status: "all",
    start_date: "",
    end_date: "",
  });

  // ---------------- STATUS COLOR ----------------
  const getStatusStyle = (status) => {
    if (status === "pending") return "bg-yellow-200 text-yellow-800";
    if (status === "verified") return "bg-green-200 text-green-800";
    if (status === "rejected") return "bg-red-200 text-red-800";
    return "bg-gray-200";
  };

  // ---------------- LOAD REPORTS ----------------
  async function loadReports() {
    try {
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me = await meRes.json();
      setRole(me.role);

      let res;
      if (me.role === "admin" || me.role === "authority") {
        const query = new URLSearchParams(
          Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v && v !== "all")
          )
        ).toString();
        res = await getAllReports(token, query);
        setReports(res.data || []);
      } else if (me.role === "ngo") {
        res = await getMyReports(token);
        setReports(res.data || []);
      } else {
        res = await getMyReports(token);
        setReports(res.data || []);
      }
    } catch (err) {
      console.error(err);
      navigate("/login");
    }
  }

  useEffect(() => {
    if (!token) navigate("/login");
    loadReports();
    // eslint-disable-next-line
  }, []);

  // ---------------- NGO VERIFIED FILTER ----------------
  async function loadVerifiedByLocation() {
    if (!ngoLocation) return alert("Enter location");
    const data = await getVerifiedReportsByLocation(ngoLocation);
    setReports(data);
  }

  // ---------------- ACTIONS ----------------
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

  if (!role) return <p>Loading...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">

        <h2 className="text-2xl font-bold mb-4">
          {role.toUpperCase()} REPORTS
        </h2>

        {/* NGO VERIFIED FILTER */}
        {role === "ngo" && (
          <div className="bg-white p-4 mb-6 rounded shadow flex gap-3">
            <input
              placeholder="Enter location"
              className="border p-2 rounded flex-1"
              value={ngoLocation}
              onChange={(e) => setNgoLocation(e.target.value)}
            />
            <button
              onClick={loadVerifiedByLocation}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Show Verified
            </button>
          </div>
        )}

        {/* CREATE REPORT */}
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
              <img
                src={`${API_URL}${r.photo_url}`}
                className="w-32 h-32 rounded object-cover"
                alt="report"
              />
              <div className="flex-1">
                <h3 className="font-semibold">📍 {r.location}</h3>
                <p>💧 {r.water_source}</p>
                <p className="text-sm text-gray-500">
                  🕒 {new Date(r.created_at).toLocaleString()}
                </p>

                <span
                  className={`inline-block mt-2 px-3 py-1 rounded ${getStatusStyle(
                    r.status
                  )}`}
                >
                  {r.status.toUpperCase()}
                </span>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/reports/${r.id}`)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    View
                  </button>

                  {(role === "ngo" || role === "authority" || role === "admin") &&
                    r.status === "pending" && (
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
                      </>
                    )}

                  {role === "authority" && (
                    <button
                      onClick={() => handleAssignStation(r.id)}
                      className="bg-purple-600 text-white px-3 py-1 rounded"
                    >
                      Assign
                    </button>
                  )}

                  {role === "admin" && (
                    <button
                      onClick={() => removeReport(r.id)}
                      className="bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
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
