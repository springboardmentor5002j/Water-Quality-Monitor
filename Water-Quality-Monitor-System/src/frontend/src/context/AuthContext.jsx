import React, { createContext, useContext, useState, useEffect } from "react";

// Create Context
export const AuthContext = createContext();

// Provider Component (wraps entire app)
export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // Login function → save token
  const login = (jwt) => {
    localStorage.setItem("token", jwt);
    setToken(jwt);
  };

  // Logout function → remove token
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  // ⭐ ADD THIS
  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider value={{ token, login, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

// ⭐ Custom Hook — use this anywhere
export function useAuth() {
  return useContext(AuthContext);
}