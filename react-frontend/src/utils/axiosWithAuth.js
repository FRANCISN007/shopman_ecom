import axios from "axios";

/**
 * Creates an axios instance with authorization and optional license key headers.
 * Automatically uses REACT_APP_API_BASE_URL for backend URL.
 */
const axiosWithAuth = () => {
  // Get token and license key from localStorage
  const token = localStorage.getItem("token");
  const licenseKey = localStorage.getItem("license_key"); // optional

  // Create axios instance
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8000",
    //baseURL: process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000",

    
    

    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      ...(licenseKey ? { "X-License-Key": licenseKey } : {}),
    },
  });

  // Interceptor: set Content-Type only for non-FormData
  instance.interceptors.request.use((config) => {
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    } else {
      delete config.headers["Content-Type"];
    }
    return config;
  });

  // Response interceptor for unified error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!error.response) {
        console.error("❌ Network or backend not reachable", error);
        return Promise.reject({ message: "Network or backend not reachable" });
      }
      return Promise.reject(error.response.data || { message: "API request failed" });
    }
  );

  return instance;
};

export default axiosWithAuth;
