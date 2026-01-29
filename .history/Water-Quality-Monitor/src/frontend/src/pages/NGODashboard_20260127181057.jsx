import React, { useState, useEffect } from "react";

export default function NGODashboard() {
  const [collaborations, setCollaborations] = useState([]);
  const [project, setProject] = useState({ ngo_name: "", project_name: "", contact_email: "" });

  const fetchCollaborations = async () => {
    const res = await fetch("http://127.0.0.1:8000/collaborations/");
    const data = await res.json();
    setCollaborations(data);
  };

  const addCollaboration = async () => {
    await fetch("http://127.0.0.1:8000/collaborations/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    setProject({ ngo_name: "", project_name: "", contact_email: "" });
    fetchCollaborations();
  };

  useEffect(() => {
    fetchCollaborations();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">NGO Dashboard</h2>

      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h3 className="font-semibold mb-2">Add Collaboration</h3>
        <input
          placeholder="NGO Name"
          value={project.ngo_name}
          onChange={(e) => setProject({ ...project, ngo_name: e.target.value })}
          className="border p-1 mr-2"
        />
        <input
          placeholder="Project Name"
          value={project.project_name}
          onChange={(e) => setProject({ ...project, project_name: e.target.value })}
          className="border p-1 mr-2"
        />
        <input
          placeholder="Contact Email"
          value={project.contact_email}
          onChange={(e) => setProject({ ...project, contact_email: e.target.value })}
          className="border p-1 mr-2"
        />
        <button onClick={addCollaboration} className="bg-blue-500 text-white px-3 rounded">
          Add
        </button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Existing Collaborations</h3>
        {collaborations.map((c) => (
          <div key={c.id} className="p-2 border rounded mb-2 bg-gray-100">
            <p>
              <strong>{c.project_name}</strong> by {c.ngo_name} ({c.contact_email})
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
