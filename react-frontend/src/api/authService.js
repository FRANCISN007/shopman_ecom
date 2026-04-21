// src/api/authService.js
import axios from "axios";
import getBaseUrl from "./config";

// ----------------------
// BASE URL & Health Check
// ----------------------
let BASE_URL = getBaseUrl();

const testBackend = async (url) => {
  try {
    const response = await fetch(`${url}/health`, { method: "GET", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
};



// Immediately check if backend is reachable; fallback to localhost if needed
(async () => {
  const reachable = await testBackend(BASE_URL);
  if (!reachable && !BASE_URL.includes("localhost")) {
    console.warn(`⚠️ Backend not reachable at ${BASE_URL}, switching to localhost.`);
    BASE_URL = `${window.location.protocol}//localhost:8000`;
  }
  console.log("✅ Using API Base URL:", BASE_URL);
})();

// ----------------------
// Axios Client
// ----------------------
const authClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ----------------------
// Login User
// ----------------------
export const loginUser = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username); // STRICT: do not change case
  formData.append("password", password);

  // Let Axios throw errors; frontend handles them
  const response = await authClient.post("/users/token", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const user = response.data;

  // Save token & user
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", user.access_token);

  return user;
};

// ----------------------
// Register User
// ----------------------
export const registerUser = async ({ username, password, roles, admin_password }) => {
  const response = await authClient.post("/users/register/", {
    username,
    password,
    roles, // array of roles
    admin_password,
  });

  return response.data;
};

// ----------------------
// Get Current User
// ----------------------
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// ----------------------
// Logout
// ----------------------
export const logoutUser = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};
