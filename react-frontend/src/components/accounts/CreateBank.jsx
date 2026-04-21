import React, { useEffect, useState } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./CreateBank.css";

const CreateBank = ({ onClose }) => {
  const [banks, setBanks] = useState([]);
  const [name, setName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const isSuperAdmin = currentUser?.roles?.includes("super_admin");
  const isManagerOrAdmin =
    currentUser?.roles?.includes("admin") ||
    currentUser?.roles?.includes("manager");

  /* =========================
     CLOSE HANDLER
  ========================= */
  const handleClose = () => {
    if (onClose) onClose();
    else window.history.back();
  };

  /* =========================
     FETCH CURRENT USER
  ========================= */
  const fetchCurrentUser = async () => {
    try {
      const res = await axiosWithAuth().get("/users/me");
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Failed to fetch current user", err);
      setCurrentUser({ roles: [] });
    }
  };

  /* =========================
     FETCH BANKS
  ========================= */
  const fetchBanks = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axiosWithAuth().get("/bank/");
      setBanks(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          `Failed to load banks (${err.response?.status || "Unknown"})`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchBanks();
  }, []);

  /* =========================
     RESET FORM
  ========================= */
  const resetForm = () => {
    setName("");
    setBusinessId("");
    setEditingId(null);
  };

  /* =========================
     CREATE / UPDATE BANK
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Bank name is required");
      return;
    }

    if (isSuperAdmin && !editingId && !businessId) {
      alert("Super admin must provide a Business ID");
      return;
    }

    try {
      setLoading(true);

      const payload = { name: name.trim() };

      // Only super_admin sends business_id
      if (isSuperAdmin && !editingId) {
        payload.business_id = parseInt(businessId, 10);
      }

      if (editingId) {
        await axiosWithAuth().put(`/bank/${editingId}`, {
          name: payload.name,
        });
      } else {
        await axiosWithAuth().post("/bank/", payload);
      }

      resetForm();
      fetchBanks();
    } catch (err) {
      alert(err.response?.data?.detail || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     EDIT BANK
  ========================= */
  const handleEdit = (bank) => {
    setEditingId(bank.id);
    setName(bank.name);
    setBusinessId(bank.business_id || "");
  };

  /* =========================
     DELETE BANK
  ========================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bank?")) return;

    try {
      await axiosWithAuth().delete(`/bank/${id}`);
      fetchBanks();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="create-bank-container compact">
      <button className="close-btn" onClick={handleClose}>
        ✕
      </button>

      <h2 className="create-bank-title">
        Manage Banks
        {isSuperAdmin && (
          <span className="super-badge">Super Admin Mode</span>
        )}
      </h2>

      {/* ================= FORM ================= */}
      <form className="compact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Bank name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {isSuperAdmin && !editingId && (
          <input
            type="number"
            placeholder="Business ID"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="business-id-input"
          />
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update" : "Create"}
        </button>

        {editingId && (
          <button
            type="button"
            className="cancel-btn"
            onClick={resetForm}
          >
            Cancel
          </button>
        )}
      </form>

      {/* ================= TABLE ================= */}
      <div className="table-wrapper">
        {loading && <p className="status-text">Loading...</p>}
        {error && <p className="error-text">{error}</p>}

        <table className="bank-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Bank Name</th>
              {isSuperAdmin && <th>Business ID</th>}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {banks.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={isSuperAdmin ? 4 : 3}
                  className="empty-row"
                >
                  No banks found
                </td>
              </tr>
            ) : (
              banks.map((bank, index) => (
                <tr key={bank.id}>
                  <td>{index + 1}</td>
                  <td>{bank.name}</td>

                  {isSuperAdmin && (
                    <td className="business-id-cell">
                      {bank.business_id || "—"}
                    </td>
                  )}

                  <td className="action-cell">
                    {(isSuperAdmin || isManagerOrAdmin) && (
                      <>
                        <button
                          className="icon-btn edit-btn"
                          title="Edit"
                          onClick={() => handleEdit(bank)}
                        >
                          ✏️
                        </button>

                        <button
                          className="icon-btn delete-btn"
                          title="Delete"
                          onClick={() => handleDelete(bank.id)}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreateBank;
