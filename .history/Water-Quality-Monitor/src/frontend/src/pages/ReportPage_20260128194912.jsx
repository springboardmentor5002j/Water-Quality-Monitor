import { useState } from "react";
import axios from "axios";

export default function ReportPage({ token }) {
  const [location, setLocation] = useState("");
  const [waterSource, setWaterSource] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) return setMessage("Please upload a photo");

    const formData = new FormData();
    formData.append("location", location);
    formData.append("water_source", waterSource);
    formData.append("description", description);
    formData.append("photo", photo);

    try {
      const res = await axios.post(
        "http://localhost:8000/reports/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      setMessage(res.data.message);
      setLocation(""); setWaterSource(""); setDescription(""); setPhoto(null);
    } catch (err) {
      console.error(err);
      setMessage("Error submitting report");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Submit Water Quality Report</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
        <input type="text" placeholder="Water Source" value={waterSource} onChange={(e) => setWaterSource(e.target.value)} required />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} required />
        <button type="submit">Submit Report</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
