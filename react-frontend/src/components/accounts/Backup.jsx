import React, { useState } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./Backup.css";

const Backup = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleBackup = async () => {
    const confirmBackup = window.confirm(
      "Do you want to proceed with the database backup?\n\nThis may take a few seconds."
    );

    if (!confirmBackup) return;

    setLoading(true);
    setMessage("");

    try {
      const axios = axiosWithAuth(); // IMPORTANT: create once per request

      const res = await axios.get("/backup/db", {
        responseType: "blob",
      });

      // -----------------------------
      // Extract filename safely
      // -----------------------------
      const contentDisposition = res.headers?.["content-disposition"];
      let filename = "database_backup.backup";

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // -----------------------------
      // Create download safely
      // -----------------------------
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage("✅ Backup completed successfully.");
    } catch (error) {
      console.error("BACKUP ERROR:", error);

      // -----------------------------
      // SMART ERROR HANDLING
      // -----------------------------
      let errorMessage = "Backup failed. Please try again.";

      if (!error?.response) {
        errorMessage =
          "Network/CORS error: backend not reachable or blocked by browser.";
      } else if (error.response?.status === 403) {
        errorMessage = "Permission denied: super admin required.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error during backup.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backup-container">
      <div className="backup-wrapper">
        <div className="backup-card">

          <button
            className="backup-close"
            onClick={() => setVisible(false)}
            title="Close"
          >
            ×
          </button>

          <h2>Database Backup</h2>

          <p className="backup-info">
            This will generate and download the latest database backup file.
          </p>

          <button
            className="backup-btn"
            onClick={handleBackup}
            disabled={loading}
          >
            {loading ? "Backing up..." : "Start Backup"}
          </button>

          {message && <p className="backup-message">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default Backup;
