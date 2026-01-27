import axios from "axios";

const API = "http://localhost:8000";

// -------------------------
// Helper: Auth headers
// -------------------------
const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// -------------------------
// CREATE REPORT (Citizen + NGO)
// -------------------------
export async function createReport(formData, token) {
  return axios.post(`${API}/reports/`, formData, authHeaders(token));
}

// -------------------------
// GET MY REPORTS (Citizen / NGO / Admin / Authority)
// -------------------------
export async function getMyReports(token) {
  try {
    const res = await axios.get(`${API}/reports/my`, authHeaders(token));
    return res.data; // always return .data
  } catch (err) {
    console.error("Error fetching my reports:", err);
    return { data: [] }; // fallback for frontend
  }
}

// -------------------------
// GET ALL REPORTS WITH FILTERS (Admin / Authority / NGO)
// -------------------------
export async function getAllReports(token, query = "") {
  try {
    const url = query ? `${API}/reports/all?${query}` : `${API}/reports/all`;
    const res = await axios.get(url, authHeaders(token));
    return res.data;
  } catch (err) {
    console.error("Error fetching all reports:", err);
    return { data: [] };
  }
}

// -------------------------
// GET SINGLE REPORT
// -------------------------
export async function getReportById(id, token) {
  return axios.get(`${API}/reports/${id}`, authHeaders(token));
}

// -------------------------
// UPDATE REPORT STATUS (Verify / Reject)
// IMPORTANT: status is QUERY PARAM (FastAPI Enum)
// -------------------------
export async function updateReportStatus(id, status, token) {
  return axios.patch(
    `${API}/reports/${id}/status?status=${status}`,
    null,
    authHeaders(token)
  );
}

// -------------------------
// DELETE REPORT (Admin Only)
// -------------------------
export async function deleteReport(id, token) {
  return axios.delete(`${API}/reports/${id}`, authHeaders(token));
}

// -------------------------
// ASSIGN STATION (Authority Only)
// -------------------------
export async function assignStation(id, stationId, token) {
  const formData = new FormData();
  formData.append("station_id", stationId);

  return axios.patch(
    `${API}/reports/${id}/assign_station`,
    formData,
    authHeaders(token)
  );
}


