// src/api/licenseApi.js
import axios from "axios";
import getBaseUrl from "./config";

// Determine backend URL
const BASE_URL = getBaseUrl();
console.log("🔗 License API Base URL:", BASE_URL);

// Create axios client
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ----------------------
// Verify License Key
// ----------------------
export const verifyLicense = async (licenseKey) => {
  try {
    const response = await apiClient.get(
      `/license/verify/${encodeURIComponent(licenseKey)}`
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      // Backend returned invalid license
      return { valid: false, message: error.response.data.detail || "Invalid license" };
    }
    console.error("❌ verifyLicense error:", error);
    throw { valid: false, message: "API request failed" };
  }
};


// ----------------------
// Generate License Key
// ----------------------
export const generateLicense = async (adminPassword, licenseKey) => {
  if (!adminPassword || !licenseKey) {
    throw new Error("Admin password and license key are required.");
  }

  try {
    const formData = new FormData();
    formData.append("license_password", adminPassword);
    formData.append("key", licenseKey);

    const response = await apiClient.post(`/license/generate`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    console.error("❌ generateLicense error:", error);
    throw error.response?.data || { message: "API request failed" };
  }
};

// ----------------------
// Check License Status
// ----------------------
export const checkLicenseStatus = async () => {
  try {
    const response = await apiClient.get(`/license/check`);
    return response.data;
  } catch (error) {
    console.error("❌ checkLicenseStatus error:", error);
    throw error.response?.data || { message: "License check failed" };
  }
};
