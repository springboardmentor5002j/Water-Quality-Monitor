import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import React from "react";

// ------------------------
// API FUNCTION
// ------------------------
export async function loginUser(form) {
  try {
    const data = new URLSearchParams();
    data.append("username", form.email); // username is email for OAuth2PasswordRequestForm
    data.append("password", form.password);

    const res = await fetch("http://localhost:8000/auth/token", {  // <- changed
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data.toString(),
    });

    const result = await res.json();
    return result;
  } catch (err) {
    return { error: "Login failed" };
  }
}

// ------------------------
// LOGIN COMPONENT
// ------------------------
export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await loginUser(form);

    if (res.access_token) {
      localStorage.setItem("token", res.access_token);
      navigate("/dashboard");
    } else {
      setMsg(res.error || "Invalid email or password");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url("/path-to-your-background-image.jpg")`, // replace with your image
      }}
    >
      <div className="bg-white/70 backdrop-blur-md shadow-xl p-10 rounded-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Welcome back
        </h2>

        {msg && (
          <p className="text-red-600 font-medium mb-3 text-center">{msg}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-blue-600" />
              Remember for 30 days
            </label>

            <Link
              to="/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium text-lg hover:bg-blue-700 transition duration-300"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-sm mt-5">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-600 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
