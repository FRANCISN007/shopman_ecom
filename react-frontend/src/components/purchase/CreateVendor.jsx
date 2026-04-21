// src/components/purchase/CreateVendor.jsx
import React, { useState, useEffect } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./CreateVendor.css";

const CreateVendor = ({ onClose, onSuccess }) => {
  const [vendor, setVendor] = useState({
    business_name: "",
    address: "",
    phone_number: "",
    business_id: "",
  });
  const [businesses, setBusinesses] = useState([]);
  const [businessSearch, setBusinessSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [show, setShow] = useState(true); // ✅ new internal state for modal

  const api = axiosWithAuth();
  const isSuperAdmin = currentUser?.roles?.includes("super_admin") || false;

  // ================= FETCH CURRENT USER =================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me");
        setCurrentUser(res.data);

        if (res.data.roles.includes("admin")) {
          setVendor((prev) => ({
            ...prev,
            business_id: res.data.business_id,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch current user", err);
        setErrorMsg("Unable to verify current user.");
      }
    };
    fetchUser();
  }, []);

  // ================= SEARCH BUSINESSES =================
  useEffect(() => {
    if (!isSuperAdmin) return;

    const delayDebounce = setTimeout(() => {
      if (businessSearch.trim() === "") {
        setBusinesses([]);
        return;
      }

      const fetchBusinesses = async () => {
        try {
          setSearching(true);
          const res = await api.get(`/business/simple?search=${businessSearch}`);
          setBusinesses(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          console.error("Business search failed:", err);
          setBusinesses([]);
        } finally {
          setSearching(false);
        }
      };

      fetchBusinesses();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [businessSearch, isSuperAdmin]);

  // ================= HANDLERS =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vendor.business_name || !vendor.address || !vendor.phone_number) {
      setErrorMsg("Business name, address and phone are required.");
      return;
    }

    if (isSuperAdmin && !vendor.business_id) {
      setErrorMsg("Please select a business.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = { ...vendor };
      if (!isSuperAdmin) delete payload.business_id;

      const res = await api.post("/vendor/", payload);

      setSuccessMsg(`Vendor "${res.data.business_name}" created successfully!`);

      setVendor({
        business_name: "",
        address: "",
        phone_number: "",
        business_id: currentUser?.business_id || "",
      });

      setBusinessSearch("");
      setBusinesses([]);

      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to create vendor.");
    } finally {
      setLoading(false);
    }
  };

  // ================= CLOSE =================
  const handleClose = () => {
    setShow(false); // ✅ hide modal like ListVendor
    if (typeof onClose === "function") onClose();
  };

  if (!show) return null; // ✅ hide modal

  return (
    <div className="create-vendor-container">
      <button type="button" className="close-btn" onClick={handleClose}>
        ✖
      </button>

      <h2>Create New Vendor</h2>

      {errorMsg && <div className="error-message">{errorMsg}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}

      <form className="vendor-form" onSubmit={handleSubmit}>
        <label>
          Business Name *
          <input
            type="text"
            name="business_name"
            value={vendor.business_name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Address *
          <input
            type="text"
            name="address"
            value={vendor.address}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Phone Number *
          <input
            type="text"
            name="phone_number"
            value={vendor.phone_number}
            onChange={handleChange}
            required
          />
        </label>

        {currentUser?.roles?.includes("admin") && (
          <label>
            Business ID
            <input
              type="text"
              value={vendor.business_id}
              readOnly
              className="readonly-input"
            />
          </label>
        )}

        {isSuperAdmin && (
          <>
            <label>
              Search Business *
              <input
                type="text"
                placeholder="Type business name..."
                value={businessSearch}
                onChange={(e) => setBusinessSearch(e.target.value)}
              />
            </label>

            {searching && <div>Searching...</div>}

            {businesses.length > 0 && (
              <label>
                Select Business *
                <select
                  name="business_id"
                  value={vendor.business_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Choose Business --</option>
                  {businesses.map((biz) => (
                    <option key={biz.id} value={biz.id}>
                      {biz.name} (ID: {biz.id})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Creating Vendor..." : "Create Vendor"}
        </button>
      </form>
    </div>
  );
};

export default CreateVendor;
