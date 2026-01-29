const API_URL = "http://localhost:8000";

// ---------------- REGISTER ----------------
export async function register(data) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return await res.json();
}

// ---------------- LOGIN ----------------
export async function loginUser(data) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (res.ok && json.access_token) {
    // ✅ store token
    localStorage.setItem("token", json.access_token);

    // ✅ immediately fetch /auth/me to get role
    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${json.access_token}`,
      },
    });

    const user = await meRes.json();

    // ✅ store user + role
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("role", user.role);
  }

  return json;
}

// ---------------- GET ME ----------------
export async function getMe() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await res.json();
}

// ---------------- GET ROLE (SYNC) ----------------
export function getUserRole() {
  return localStorage.getItem("role");
}
