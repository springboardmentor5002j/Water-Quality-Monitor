import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:8000/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLocation(response.data.location || "No location provided");
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLocation("No location provided");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-lg font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">User Live Location</h2>

      <div className="flex justify-between items-center mb-4">
        <p className="text-lg">
          <strong>Place:</strong> {location}
        </p>

        <button
          onClick={fetchUser}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {/* If no place, show message */}
      {location === "No location provided" && (
        <div className="border p-6 rounded-lg bg-red-50 text-center">
          <p className="text-red-600 font-semibold mb-2">Location not found</p>
          <p className="text-gray-600 mb-4">
            Please update your profile with a valid place name.
          </p>

          <button
            onClick={() => navigate("/update-profile")}
            className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
