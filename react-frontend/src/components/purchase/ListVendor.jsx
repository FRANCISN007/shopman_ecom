// src/components/purchase/ListVendor.jsx
import React, { useEffect, useState } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./ListVendor.css";

const ListVendor = ({ onClose }) => {
  const [vendors, setVendors] = useState([]);
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
     FETCH VENDORS
  ========================= */
  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axiosWithAuth().get("/vendor/");
      setVendors(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          `Failed to load vendors (${err.response?.status || "Unknown"})`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchVendors();
  }, []);

  /* =========================
     EDIT VENDOR
  ========================= */
  const handleEdit = async (vendor) => {
    const business_name = prompt("Business Name:", vendor.business_name);
    if (business_name === null) return;

    const address = prompt("Address:", vendor.address);
    if (address === null) return;

    const phone_number = prompt("Phone Number:", vendor.phone_number);
    if (phone_number === null) return;

    try {
      await axiosWithAuth().put(`/vendor/${vendor.id}`, {
        business_name,
        address,
        phone_number,
      });
      fetchVendors();
    } catch (err) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  /* =========================
     DELETE VENDOR
  ========================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vendor?")) return;

    try {
      await axiosWithAuth().delete(`/vendor/${id}`);
      fetchVendors();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="list-vendor-container">
      <button className="close-btn" onClick={handleClose}>
        ✕
      </button>

      <h2 className="list-vendor-title">
        Manage Vendors
        {isSuperAdmin && (
          <span className="super-badge">Super Admin Mode</span>
        )}
      </h2>

      {/* ================= TABLE ================= */}
      <div className="table-wrapper">
        {loading && <p className="status-text">Loading...</p>}
        {error && <p className="error-text">{error}</p>}

        <table className="vendor-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Business Name</th>
              <th>Address</th>
              <th>Phone Number</th>
              {isSuperAdmin && <th>Business ID</th>}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {vendors.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={isSuperAdmin ? 6 : 5}
                  className="empty-row"
                >
                  No vendors found
                </td>
              </tr>
            ) : (
              vendors.map((vendor, index) => (
                <tr key={vendor.id}>
                  <td>{index + 1}</td>
                  <td>{vendor.business_name}</td>
                  <td>{vendor.address}</td>
                  <td>{vendor.phone_number}</td>

                  {isSuperAdmin && (
                    <td>{vendor.business_id || "—"}</td>
                  )}

                  <td className="action-cell">
                    {(isSuperAdmin || isManagerOrAdmin) && (
                      <>
                        <button
                          className="icon-btn edit-btn"
                          title="Edit"
                          onClick={() => handleEdit(vendor)}
                        >
                          ✏️
                        </button>

                        <button
                          className="icon-btn delete-btn"
                          title="Delete"
                          onClick={() => handleDelete(vendor.id)}
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

export default ListVendor;
