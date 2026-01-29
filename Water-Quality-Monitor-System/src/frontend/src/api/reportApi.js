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
// CREATE REPORT
// -------------------------
export async function createReport(formData, token) {
  return axios.post(`${API}/reports/`, formData, authHeaders(token));
}

// -------------------------
// GET MY REPORTS
// -------------------------
export async function getMyReports(token) {
  try {
    const res = await axios.get(`${API}/reports/my`, authHeaders(token));
    return res.data;
  } catch (err) {
    console.error("Error fetching my reports:", err);
    return { data: [] };
  }
}

// -------------------------
// GET ALL REPORTS (Admin / Authority / NGO)
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
// ✅ VERIFIED REPORTS BY LOCATION (NEW)
// -------------------------
export async function getVerifiedReportsByLocation(location) {
  try {
    const res = await axios.get(
      `${API}/stations/verified_reports_by_location`,
      {
        params: { location },
      }
    );
    return res.data;
  } catch (err) {
    console.error("Error fetching verified reports:", err);
    return [];
  }
}

// -------------------------
// GET SINGLE REPORT
// -------------------------
export async function getReportById(id, token) {
  return axios.get(`${API}/reports/${id}`, authHeaders(token));
}

// -------------------------
// UPDATE REPORT STATUS
// -------------------------
export async function updateReportStatus(id, status, token) {
  return axios.patch(
    `${API}/reports/${id}/status?status=${status}`,
    null,
    authHeaders(token)
  );
}

// -------------------------
// DELETE REPORT
// -------------------------
export async function deleteReport(id, token) {
  return axios.delete(`${API}/reports/${id}`, authHeaders(token));
}

// -------------------------
// ASSIGN STATION
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

// -------------------------
// Historical Readings
// -------------------------
export async function fetchHistoricalReadings(location, parameter) {
  try {
    const res = await axios.get(`${API}/readings/history/location`, {
      params: { location, parameter },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching historical readings:", err);
    return [];
  }
}
