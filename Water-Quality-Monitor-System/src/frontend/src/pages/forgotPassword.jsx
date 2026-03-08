import React, { useState } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:8000";
const API = `${BASE_URL}/auth/reset-password`;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage("");
    setResetLink("");
    setMessageType("");

    try {
      const res = await axios.post(API, { email });

      if (res.data?.reset_link) {
        setResetLink(res.data.reset_link);
        setMessage("Password reset link generated successfully.");
        setMessageType("success");
      } else {
        setMessage("If this email exists, a reset link has been sent.");
        setMessageType("success");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setMessage("Email does not exist.");
      } else {
        setMessage("Something went wrong. Please try again.");
      }
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url("/water.jpg")`
      }}
    >
      <div className="bg-white/70 backdrop-blur-md shadow-xl p-10 rounded-2xl w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Forgot Password
        </h1>

        <form onSubmit={submit} className="w-full">

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 p-3 w-full rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {message && (
            <div
              className={`p-3 rounded-lg text-sm font-semibold mb-4 ${
                messageType === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          {resetLink && (
            <div className="bg-gray-100 p-3 rounded-lg text-sm break-all mb-4">
              <p className="font-semibold mb-1">Reset Link (Dev Mode):</p>
              <a href={resetLink} className="text-blue-600 underline">
                {resetLink}
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 rounded-lg text-white font-semibold shadow-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition duration-300"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

        </form>
      </div>
    </div>
  );
}