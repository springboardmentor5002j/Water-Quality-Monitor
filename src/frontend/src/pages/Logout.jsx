import React from "react";
export default function Logout() {
    return (
      <div className="text-center mt-32">
        <h2 className="text-3xl font-bold mb-4">You are logged out</h2>
        <a className="text-blue-600 font-semibold" href="/login">Login Again</a>
      </div>
    );
  }