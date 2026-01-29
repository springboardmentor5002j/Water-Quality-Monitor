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
    location: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await register(form);
      console.log("REGISTER RESPONSE:", res);

      // ✅ Signup success (backend returns 201)
      setMsg("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1000);

    } catch (err) {
      console.error("REGISTER ERROR:", err);

      // 🔴 Duplicate email case
      if (err?.response?.status === 409) {
        setMsg("Email already registered");
      } 
      // 🔴 Validation / other backend errors
      else if (err?.response?.data?.detail) {
        setMsg(err.response.data.detail);
      } 
      // 🔴 Server / network error
      else {
        setMsg("Server error while registering");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white/70 backdrop-blur-md shadow-xl p-10 rounded-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Create Account
        </h2>

        {msg && (
          <p className="text-center text-sm mb-4 text-red-600">
            {msg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* NAME */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Your full name"
              className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          </div>

          {/* EMAIL */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />
          </div>

          {/* ROLE */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
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
            <label className="text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              placeholder="City or region"
              className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />
          </div>

          {/* REGISTER BUTTON */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-600 text-white text-lg font-medium hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>

        <p className="text-center text-sm mt-5">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 font-medium">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
