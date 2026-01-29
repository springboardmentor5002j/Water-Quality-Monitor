import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SubmitReportPage() {
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:8000";

  // ---------------- STATES ----------------
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [waterSource, setWaterSource] = useState("");
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ---------------- FETCH LOCATIONS ----------------
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/stations/locations`);
        setLocations(res.data);
        if (res.data.length > 0) setLocation(res.data[0]); // default
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    };
    fetchLocations();
  }, []);

  // ---------------- SUBMIT FORM ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      setMessage("Please select a photo.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("location", location);
      formData.append("description", description);
      formData.append("water_source", waterSource);

      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("You must be logged in to submit a report.");
        setLoading(false);
        return;
      }

      const res = await axios.post(`${BASE_URL}/reports/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("Report submitted successfully!");
      setPhoto(null);
      setDescription("");
      setWaterSource("");
    } catch (err) {
      console.error("Report submission failed:", err);
      setMessage("Failed to submit report. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Submit Water Quality Report</h2>

        {message && (
          <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border p-2 rounded w-full"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Water Source</label>
            <input
              type="text"
              value={waterSource}
              onChange={(e) => setWaterSource(e.target.value)}
              placeholder="E.g., River, Tap, Well"
              className="border p-2 rounded w-full"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              className="border p-2 rounded w-full"
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 rounded text-white font-semibold ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
