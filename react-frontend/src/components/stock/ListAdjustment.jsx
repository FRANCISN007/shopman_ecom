import React, { useEffect, useState } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./ListAdjustment.css";

const ListAdjustment = ({ onClose }) => {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Internal visibility fallback
  const [visible, setVisible] = useState(true);

  // ==================== Date Filters ====================
  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const [{ startDate, endDate }, setDateRange] = useState(
    getCurrentMonthRange()
  );

  // ==================== Fetch adjustments ====================
  const fetchAdjustments = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axiosWithAuth().get(
        "/stock/inventory/adjustments/",
        {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        }
      );

      setAdjustments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching adjustments:", err);
      setError("Failed to load stock adjustments");
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load current month on mount
  useEffect(() => {
    fetchAdjustments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== Delete adjustment ====================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this adjustment?"))
      return;

    try {
      await axiosWithAuth().delete(
        `/stock/inventory/adjustments/${id}`
      );
      setAdjustments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting adjustment:", err);
      alert("Failed to delete adjustment");
    }
  };

  // ==================== Close modal ====================
  const handleClose = () => {
    if (onClose) onClose();
    else setVisible(false);
  };

  if (!visible) return null;

  // ==================== Render ====================
  return (
    <div className="list-adjustment-container">
      {/* Close X */}
      <button className="close-btn" onClick={handleClose}>
        ×
      </button>

      <h2 className="list-adjustment-title">
        Stock Adjustments Report
      </h2>

      {/* ==================== Filters ==================== */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                startDate: e.target.value,
              }))
            }
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                endDate: e.target.value,
              }))
            }
          />
        </div>

        <button className="filter-btn" onClick={fetchAdjustments}>
          Apply Filter
        </button>
      </div>

      {loading && <p className="status-text">Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="table-wrapper">
        <table className="adjustment-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Reason</th>
              <th>Adjusted By</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {adjustments.length > 0 ? (
              adjustments.map((adj) => (
                <tr key={adj.id}>
                  <td>{adj.id}</td>
                  <td>{adj.product_name ?? adj.product_id}</td>
                  <td>{adj.quantity}</td>
                  <td>{adj.reason}</td>
                  <td>{adj.adjusted_by_name ?? "-"}</td>
                  <td>
                    {new Date(adj.adjusted_at).toLocaleString()}
                  </td>
                  <td className="action-cell">
                    <button
                      className="delete-btn"
                      title="Delete Adjustment"
                      onClick={() => handleDelete(adj.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-row">
                  No stock adjustments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListAdjustment;
