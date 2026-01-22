import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

const API = "http://localhost:8000/auth/reset-password/confirm";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*]/.test(password)) strength += 1;
    return strength;
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 4:
        return "text-green-700";
      case 3:
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(null);

    if (!token) {
      setMessage("Invalid or missing reset token");
      setIsSuccess(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Password reset successful! Redirecting to login...");
        setIsSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage(data.detail || "Reset failed");
        setIsSuccess(false);
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error. Please try again.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const strength = checkPasswordStrength(newPassword);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url("/path-to-your-background-image.jpg")`,
      }}
    >
      <div className="bg-white/70 backdrop-blur-md shadow-xl p-10 rounded-2xl w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Reset Password
        </h1>

        <p className="text-sm text-gray-500 mb-6 text-center">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            autoFocus
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="border border-gray-300 p-3 w-full rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
          />
          {newPassword && (
            <p className={`text-sm mb-4 font-semibold ${getStrengthColor(strength)}`}>
              Password strength: {["Weak", "Fair", "Good", "Strong"][strength - 1] || "Very Weak"}
            </p>
          )}

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="border border-gray-300 p-3 w-full rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
          />

          {message && (
            <div
              className={`p-3 rounded-lg text-sm font-semibold mb-4 ${
                isSuccess ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full py-3 rounded-lg text-white font-semibold shadow-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition duration-300"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <Link
          to="/login"
          className="text-sm mt-4 text-gray-500 hover:text-blue-600 transition duration-150"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
