import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Backend API URL
const API_URL = "http://localhost:8000";

export default function ReportPage() {
  const navigate = useNavigate();

  // Form state
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState("");
  const [waterSource, setWaterSource] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo || !location || !waterSource || !description) {
      setMessage("All fields are required!");
      return;
    }

    const formData = new FormData();
    formData.append("photo", photo);
    formData.append("location", location);
    formData.append("water_source", waterSource);
    formData.append("description", description);

    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // JWT stored in localStorage
      const res = await axios.post(`${API_URL}/reports/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("Report submitted successfully!");
      setLoading(false);
      // Optionally redirect to dashboard or my-reports page
      navigate("/my-reports");
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit report. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h2>📝 Submit Water Quality Report</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        
        <div>
          <label>Photo:</label><br />
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
        </div>

        <div>
          <label>Location:</label><br />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location (e.g., Hyderabad)"
          />
        </div>

        <div>
          <label>Water Source:</label><br />
          <input
            type="text"
            value={waterSource}
            onChange={(e) => setWaterSource(e.target.value)}
            placeholder="e.g., Borewell, River"
          />
        </div>

        <div>
          <label>Description:</label><br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the water quality issue"
            rows={4}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: "10px 20px" }}>
          {loading ? "Submitting..." : "Submit Report"}
        </button>

        {message && <p style={{ marginTop: 10 }}>{message}</p>}
      </form>
    </div>
  );
}
