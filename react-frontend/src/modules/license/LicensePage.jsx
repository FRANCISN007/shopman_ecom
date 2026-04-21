import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyLicense, generateLicense } from "../../api/licenseApi";
import "./LicensePage.css";

const LicensePage = () => {
  const [licenseKey, setLicenseKey] = useState("");
  const [password, setPassword] = useState(""); // For admin
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLicenseVerified, setIsLicenseVerified] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verified = localStorage.getItem("license_verified");
    if (verified === "true") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);


  // Reset state on location change
  useEffect(() => {
    if (location.pathname === "/license") {
      setLicenseKey("");
      setPassword("");
      setMessage("");
      setError("");
      setIsLicenseVerified(false);
    }
  }, [location]);

  // Redirect user after successful license verification
  useEffect(() => {
    if (isLicenseVerified) {
      const timer = setTimeout(() => navigate("/login"), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLicenseVerified, navigate]);

  // -----------------------
  // User: Verify License
  // -----------------------
  const handleVerify = async () => {
    setMessage("");
    setError("");

    if (!licenseKey.trim()) {
      setError("Please enter a license key.");
      return;
    }

    try {
      const data = await verifyLicense(licenseKey);

      if (data.valid) {
        let expiryMsg = "";
        if (data.expires_on) {
          const expiryDate = new Date(data.expires_on);
          expiryMsg = ` (valid until ${expiryDate.toLocaleDateString()})`;
          localStorage.setItem("license_valid_until", data.expires_on);
        }

        setMessage(`License verified successfully${expiryMsg}.`);
        localStorage.setItem("license_verified", "true");
        setIsLicenseVerified(true);
        setLicenseKey(""); // clear input
      } else {
        setError(data.message || "Verification failed.");
      }
    } catch (err) {
      setError(err?.detail || err?.message || "Verification failed.");
    }
  };

  // -----------------------
  // Admin: Generate License
  // -----------------------
  const handleGenerate = async () => {
    setMessage("");
    setError("");

    if (!licenseKey.trim() || !password.trim()) {
      setError("Please enter both admin password and license key.");
      return;
    }

    try {
      const data = await generateLicense(password, licenseKey);

      setMessage(
        data.key ? `License generated: ${data.key}` : "License generated."
      );

      setLicenseKey("");
      setPassword("");
    } catch (err) {
      const detail =
        err?.detail || err?.message || err?.response?.data?.detail || "License generation failed.";
      if (detail.toLowerCase().includes("already exists")) {
        setError("This license key is already in use.");
      } else if (detail.toLowerCase().includes("invalid")) {
        setError("Invalid admin password.");
      } else {
        setError(detail);
      }
    }
  };

  return (
    <div className="license-page">
      <div className="hems-logo">SH&nbsp;op&nbsp;M&nbsp;an</div>
      <div className="hems-subtitle">Phone Shop App</div>

      <div className="license-container">
        <h2 className="license-title">License Management</h2>

        {/* License Key Input */}
        <div className="license-form-group">
          <label className="license-label">License Key:</label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="Enter license key"
            className="license-input"
          />
        </div>

        {/* Admin Password Input */}
        <div className="license-form-group">
          <label className="license-label">Admin Password (for generation):</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="license-input"
          />
        </div>

        {/* Buttons */}
        <div className="license-button-group">
          <button className="license-button" onClick={handleVerify}>
            Verify License
          </button>

          <button className="license-button" onClick={handleGenerate}>
            Generate License
          </button>
        </div>

        {/* Messages */}
        {message && <p className="license-message success">{message}</p>}
        {error && <p className="license-message error">{error}</p>}

        {isLicenseVerified && (
          <p className="license-message success">✅ License is verified and active.</p>
        )}
      </div>
    </div>
  );
};

export default LicensePage;