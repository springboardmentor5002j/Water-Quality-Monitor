import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getReportById,
  updateReportStatus,
  deleteReport,
  assignStation,
} from "../api/reportApi";
import { getUserRole } from "../utils/auth";

function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = getUserRole();
  const token = localStorage.getItem("token");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getReportById(id, token);
        setReport(res.data);
      } catch {
        alert("Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, token]);

  async function changeStatus(status) {
    try {
      await updateReportStatus(id, status, token);
      setReport((prev) => ({ ...prev, status }));
    } catch {
      alert("Action not allowed");
    }
  }

  async function removeReport() {
    if (!window.confirm("Delete this report?")) return;
    try {
      await deleteReport(id, token);
      navigate("/my-reports");
    } catch {
      alert("Delete not allowed");
    }
  }

  async function handleAssignStation() {
    const stationId = prompt("Enter Station ID to assign:");
    if (!stationId) return;
    try {
      await assignStation(id, stationId, token);
      alert("Station assigned successfully");
    } catch {
      alert("Assign Station not allowed");
    }
  }

  if (loading) return <p className="p-6">Loading report...</p>;
  if (!report)
    return <p className="p-6 text-red-500">Report not found</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-8">
        <img
          src={report.photo_url || "/placeholder-water.jpg"}
          onError={(e) => (e.target.src = "/placeholder-water.jpg")}
          alt="Water Report"
          className="w-full h-80 object-cover rounded-xl mb-6"
        />

        <h2 className="text-2xl font-bold mb-4">
          Water Quality Report
        </h2>

        <div className="space-y-3 text-lg">
          <p>
            <strong>📍 Location:</strong> {report.location}
          </p>
          <p>
            <strong>💧 Water Source:</strong> {report.water_source}
          </p>

          <strong>👤 Reported By:</strong> {report.reported_by || "Unknown"}
          <p>
            <strong>🕒 Created At:</strong>{" "}
            {new Date(report.created_at).toLocaleString()}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`font-semibold ${
                report.status === "verified"
                  ? "text-green-600"
                  : report.status === "rejected"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {report.status.toUpperCase()}
            </span>
          </p>
          <p className="pt-4">
            <strong>Description:</strong>
            <br />
            {report.description}
          </p>
        </div>

        {/* Role-Based Actions */}
        <div className="flex flex-wrap gap-4 mt-8">
          {(role === "citizen" || role === "ngo") &&
            report.status === "pending" && (
              <Link to={`/reports/edit/${report.id}`}>
                <button className="px-5 py-2 bg-gray-600 text-white rounded-lg">
                  Edit
                </button>
              </Link>
            )}

          {role === "ngo" && report.status === "pending" && (
            <button
              onClick={() => changeStatus("verified")}
              className="px-5 py-2 bg-green-600 text-white rounded-lg"
            >
              Verify
            </button>
          )}

          {role === "authority" && report.status === "pending" && (
            <>
              <button
                onClick={() => changeStatus("verified")}
                className="px-5 py-2 bg-green-600 text-white rounded-lg"
              >
                Verify
              </button>
              <button
                onClick={() => changeStatus("rejected")}
                className="px-5 py-2 bg-red-600 text-white rounded-lg"
              >
                Reject
              </button>
              <button
                onClick={handleAssignStation}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg"
              >
                Assign Station
              </button>
            </>
          )}

          {role === "admin" && (
            <>
              {report.status === "pending" && (
                <>
                  <button
                    onClick={() => changeStatus("verified")}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => changeStatus("rejected")}
                    className="px-5 py-2 bg-red-600 text-white rounded-lg"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={removeReport}
                className="px-5 py-2 bg-red-800 text-white rounded-lg"
              >
                Delete
              </button>
            </>
          )}

          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-gray-200 rounded-lg"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportDetails;
