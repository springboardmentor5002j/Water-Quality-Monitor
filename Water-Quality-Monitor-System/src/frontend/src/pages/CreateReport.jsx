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

        const formData = new FormData();
        formData.append("photo", photo);
        formData.append("location", location);
        formData.append("description", description);
        formData.append("water_source", waterSource);

        await createReport(formData, token);
        alert("Report submitted!");
        navigate("/my-reports");
    }

    return (
        <div className="report-container">
            <div className="report-card">

                {/* Header */}
                <h2 className="report-title">Create Water Quality Report</h2>

                <form onSubmit={submit} className="report-form">

                    <label>Upload Image</label>
                    <input
                        type="file"
                        onChange={(e) => setPhoto(e.target.files[0])}
                        className="input-file"
                    />

                    <label>Location</label>
                    <input
                        type="text"
                        placeholder="Enter location"
                        onChange={(e) => setLocation(e.target.value)}
                        className="input"
                    />

                    <label>Water Source</label>
                    <input
                        type="text"
                        placeholder="River, Lake, Tap, etc."
                        onChange={(e) => setWaterSource(e.target.value)}
                        className="input"
                    />

                    <label>Description</label>
                    <textarea
                        placeholder="Describe the issue..."
                        onChange={(e) => setDescription(e.target.value)}
                        className="textarea"
                    ></textarea>

<div className="flex gap-4 mt-6">
    <button
        type="button"
        onClick={() => navigate("/my-reports")}
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