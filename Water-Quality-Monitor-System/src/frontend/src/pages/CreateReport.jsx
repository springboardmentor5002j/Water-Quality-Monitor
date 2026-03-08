import React, { useState } from "react";
import { createReport } from "../api/reportApi";
import { useNavigate } from "react-router-dom";
import "../Report.css";

function CreateReport() {
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [waterSource, setWaterSource] = useState("");

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    async function submit(e) {
        e.preventDefault();

        if (!photo) {
            alert("Please upload an image.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("photo", photo);
            formData.append("location", location);
            formData.append("description", description);
            formData.append("water_source", waterSource);

            await createReport(formData, token);

            alert("Report submitted successfully!");
            navigate("/reports/my");   // ✅ redirect after submit

        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to submit report.");
        }
    }

    return (
        <div className="report-container">
            <div className="report-card">

                {/* Header with Back to Dashboard */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="report-title">
                        Create Water Quality Report
                    </h2>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-blue-600 hover:underline font-semibold"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                <form onSubmit={submit} className="report-form">

                    {/* Upload Image */}
                    <label>Upload Image</label>
                    <input
                        type="file"
                        onChange={(e) => setPhoto(e.target.files[0])}
                        className="input-file"
                        required
                    />

                    {/* Location */}
                    <label>Location</label>
                    <input
                        type="text"
                        placeholder="Enter location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="input"
                        required
                    />

                    {/* Water Source */}
                    <label>Water Source</label>
                    <input
                        type="text"
                        placeholder="River, Lake, Tap, etc."
                        value={waterSource}
                        onChange={(e) => setWaterSource(e.target.value)}
                        className="input"
                        required
                    />

                    {/* Description */}
                    <label>Description</label>
                    <textarea
                        placeholder="Describe the issue..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="textarea"
                        required
                    ></textarea>

                    {/* Buttons */}
                    <div className="flex gap-4 mt-6">
                        <button
                            type="button"
                            onClick={() => navigate("/reports/my")}
                            className="
                                flex-1
                                px-6 py-3
                                rounded-xl
                                font-semibold
                                text-white
                                bg-blue-600
                                shadow-lg
                                hover:bg-blue-700
                                hover:shadow-xl
                                active:scale-95
                                transition-all
                                duration-200
                            "
                        >
                            View Reports
                        </button>

                        <button
                            type="submit"
                            className="
                                flex-1
                                px-6 py-3
                                rounded-xl
                                font-semibold
                                text-white
                                bg-green-600
                                shadow-lg
                                hover:bg-green-700
                                hover:shadow-xl
                                active:scale-95
                                transition-all
                                duration-200
                            "
                        >
                            Submit Report
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default CreateReport;