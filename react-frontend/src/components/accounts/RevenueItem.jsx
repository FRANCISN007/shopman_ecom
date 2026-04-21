import React, { useEffect, useState } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./RevenueItem.css";

const RevenueItem = ({ onClose, userRole, userBusinessId, businesses }) => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    userRole === "super_admin" ? "" : userBusinessId
  );

  /* ================= SAFE CLOSE HANDLER ================= */
  const handleClose = () => {
    if (onClose) onClose();
    else window.history.back();
  };

  /* ================= FETCH CATEGORIES ================= */
  const fetchCategories = async () => {
    if (userRole === "super_admin" && !selectedBusinessId) {
      // Super admin must select a business first
      setCategories([]);
      return;
    }

    try {
      setLoading(true);
      const params = {};
      if (userRole === "super_admin") params.business_id = selectedBusinessId;
      else params.business_id = userBusinessId;

      const res = await axiosWithAuth().get("/stock/category/", { params });
      setCategories(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  /* ================= INITIAL / DEPENDENCY EFFECT ================= */
  useEffect(() => {
    fetchCategories();
  }, [selectedBusinessId, userBusinessId]);

  /* ================= CREATE / UPDATE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Category name is required");
      return;
    }

    if (userRole === "super_admin" && !selectedBusinessId) {
      alert("Please select a business first");
      return;
    }

    try {
      const payload = { name, description };
      if (userRole === "super_admin") payload.business_id = selectedBusinessId;
      else payload.business_id = userBusinessId;

      if (editingId) {
        await axiosWithAuth().put(`/stock/category/${editingId}`, payload);
      } else {
        await axiosWithAuth().post("/stock/category/", payload);
      }

      setName("");
      setDescription("");
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.detail || "Operation failed");
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      await axiosWithAuth().delete(`/stock/category/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="revenue-item-container compact">
      <button className="close-btn" onClick={handleClose}>✕</button>
      <h2 className="revenue-item-title">Revenue Items</h2>

      {/* ================= SUPER ADMIN BUSINESS FILTER ================= */}
      {userRole === "super_admin" && businesses?.length > 0 && (
        <div className="business-filter">
          <label>Select Business: </label>
          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
          >
            <option value="">--Select a Business--</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ================= CREATE / EDIT FORM ================= */}
      <form className="revenue-form compact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">{editingId ? "Update" : "Create"}</button>

        {editingId && (
          <button
            type="button"
            className="cancel-btn"
            onClick={() => {
              setEditingId(null);
              setName("");
              setDescription("");
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* ================= TABLE ================= */}
      <div className="table-wrapper">
        {loading && <p className="status-text">Loading...</p>}
        {error && <p className="error-text">{error}</p>}

        {userRole === "super_admin" && !selectedBusinessId ? (
          <p className="status-text">Please select a business to view categories</p>
        ) : (
          <table className="revenue-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Description</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No categories found
                  </td>
                </tr>
              ) : (
                categories.map((cat, index) => (
                  <tr key={cat.id}>
                    <td>{index + 1}</td>
                    <td>{cat.name}</td>
                    <td>{cat.description || "-"}</td>
                    <td>{new Date(cat.created_at).toLocaleDateString()}</td>
                    <td className="action-cell">
                      <button
                        className="icon-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEdit(cat)}
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDelete(cat.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RevenueItem;
