import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import React from "react";

export default function Register() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    location: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await register(form);

      console.log("REGISTER RESPONSE:", res);

      if (res && (res.id || res.email)) {
        setMsg("Registration successful!");
        setTimeout(() => navigate("/login"), 800);
      } else {
        setMsg("Registration failed");
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setMsg("Server error while registering");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl p-10 rounded-2xl w-full max-w-md">

        {/* Header */}
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Create Account ✨
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Join us and start contributing
        </p>

        {msg && (
          <p className="text-center text-red-600 font-medium mb-4">{msg}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* NAME */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* EMAIL */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Create a password"
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {/* ROLE DROPDOWN */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
              <option value="">Select Role</option>
              <option value="citizen">Citizen</option>
              <option value="ngo">NGO</option>
              <option value="authority">Authority</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* LOCATION */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              placeholder="City or region"
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          {/* REGISTER BUTTON */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-purple-600 text-white text-lg font-semibold hover:bg-purple-700 transition duration-300 shadow-md"
          >
            Register
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm mt-6 text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-purple-600 font-semibold hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
