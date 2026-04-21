// src/components/stock/ImportProduct.jsx
import React, { useState, useEffect } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./ImportProduct.css";

const ImportProduct = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(true);

  // Super admin is always true
  const isSuperAdmin = true;

  // Fetch businesses for super admin
  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchBusinesses = async () => {
      setLoadingBusinesses(true);
      try {
        const res = await axiosWithAuth().get("/business/simple");
        setBusinesses(res.data || []);
      } catch (err) {
        console.error("Failed to fetch businesses:", err);
        setMessage("Could not load businesses. Please try again later.");
      } finally {
        setLoadingBusinesses(false);
      }
    };

    fetchBusinesses();
  }, [isSuperAdmin]);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setMessage("");
  };

  const handleBusinessChange = (e) => {
    setSelectedBusinessId(e.target.value);
    setMessage("");
  };

  const handleImport = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select an Excel file (.xlsx or .xls).");
      return;
    }

    if (isSuperAdmin && !selectedBusinessId) {
      setMessage("Please select a business.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (isSuperAdmin) {
        const bizIdInt = parseInt(selectedBusinessId, 10);
        if (!bizIdInt) {
          setMessage("Please select a valid business.");
          setLoading(false);
          return;
        }
        formData.append("business_id", bizIdInt);

        // Debug: log FormData content
        for (let pair of formData.entries()) {
          console.log("FormData:", pair[0], pair[1]);
        }
      }

      const res = await axiosWithAuth().post("/stock/products/import-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { imported, skipped, duplicates, invalid_rows, unknown_categories } = res.data;

      let successMsg = `Import successful!\n→ ${imported} new product${imported !== 1 ? "s" : ""} added`;
      if (skipped > 0) {
        successMsg += `\n→ ${skipped} skipped (${[
          duplicates && `${duplicates} already exist`,
          invalid_rows && `${invalid_rows} missing data`,
          unknown_categories && `${unknown_categories} unknown categories`,
        ].filter(Boolean).join(", ")})`;
      }

      setMessage(successMsg);
      setFile(null);
      setSelectedBusinessId("");
      if (onSuccess) onSuccess(res.data);
    } catch (error) {
      console.error("Full import error:", error);

      let errorMsg = "Something went wrong during import.";

      // Handle FastAPI error format
      if (error.detail) {
        errorMsg = typeof error.detail === "string" ? error.detail : JSON.stringify(error.detail);
      } else if (error.message) {
        errorMsg = error.message;
      }

      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="import-card">
        <button className="card-close" onClick={() => setVisible(false)}>
          ×
        </button>

        <h2>Import Products from Excel</h2>

        {message && (
          <div className={message.includes("successful") ? "success-message" : "error-message"}>
            {message.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        <form className="import-form" onSubmit={handleImport}>
          {isSuperAdmin && (
            <div className="form-group">
              <label>
                Select Business <span className="required">*</span>
              </label>
              <select
                value={selectedBusinessId}
                onChange={handleBusinessChange}
                disabled={loading || loadingBusinesses}
                required
              >
                <option value="">-- Select Business --</option>
                {businesses.map((biz) => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>
              Select Excel File <span className="required">*</span>
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || (isSuperAdmin && !selectedBusinessId) || !file}
            className="submit-btn"
          >
            {loading ? "Importing..." : "Import Products"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ImportProduct;
