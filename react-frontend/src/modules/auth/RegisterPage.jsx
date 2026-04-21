import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../api/authService";
import "./LogReg.css";

const roleOptions = ["user", "admin", "manager"]; // super_admin not allowed here

const RegisterPage = () => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    roles: ["user"],
    admin_password: "",
    business_id: "", // new field - string input, will be parsed to int or null
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    if (name === "roles") {
      setForm((prev) => {
        let newRoles = [...prev.roles];
        if (checked) {
          if (!newRoles.includes(value)) newRoles.push(value);
        } else {
          newRoles = newRoles.filter((r) => r !== value);
        }
        return { ...prev, roles: newRoles };
      });
    } else if (name === "business_id") {
      // Allow empty string or number input
      setForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!form.username.trim() || !form.password) {
      setError("Username and password are required.");
      setLoading(false);
      return;
    }

    if (!form.admin_password) {
      setError("Admin password (confirmation) is required.");
      setLoading(false);
      return;
    }

    // Business ID validation (required unless super_admin role - but super_admin not allowed here)
    const businessIdValue = form.business_id.trim();
    if (!businessIdValue) {
      setError("Business ID is required for new users.");
      setLoading(false);
      return;
    }

    const businessIdNum = parseInt(businessIdValue, 10);
    if (isNaN(businessIdNum) || businessIdNum <= 0) {
      setError("Please enter a valid positive Business ID.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        username: form.username.trim().toLowerCase(),
        password: form.password,
        roles: form.roles,
        admin_password: form.admin_password,
        business_id: businessIdNum, // send as integer
      };

      await registerUser(payload);
      alert("Registration successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.message ||
        "Registration failed. Please check your details.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* LEFT SIDE - DESCRIPTION */}
      <div className="auth-left-panel">
        <h1 className="app-title">PHONE SHOP APP</h1>

        <p className="app-description">
          The App is a complete Inventory management & Sales solution designed to
          simplify, automate, and centralize operations across:
        </p>

        <ul className="app-features">
          <li>POS Sales Point</li>
          <li>Purchases</li>
          <li>Payments & Receipts</li>
          <li>Secured Database Integration</li>
          <li>Stock & Inventory Control</li>
          <li>Profit & Loss Account</li>
        </ul>

        <p className="app-tagline">
          Fast • Reliable • All-in-One Inventory Management System
        </p>
      </div>

      {/* RIGHT SIDE - REGISTER FORM */}
      <div className="auth-container">
        <div className="auth-logo-text">
          Phone <span>Shop</span> App
        </div>

        <h2>Register New User</h2>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleRegister}>
          <input
            name="username"
            placeholder="Username (lowercase recommended)"
            value={form.username}
            onChange={handleChange}
            required
            autoComplete="off"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {/* Business ID - NEW FIELD */}
          <input
            name="business_id"
            type="number"
            placeholder="Business ID (required)"
            value={form.business_id}
            onChange={handleChange}
            required
            min="1"
            step="1"
          />

          {/* Roles Selection */}
          <div className="roles-selection">
            <p>Select role(s):</p>
            {roleOptions.map((role) => (
              <label key={role}>
                <input
                  type="checkbox"
                  name="roles"
                  value={role}
                  checked={form.roles.includes(role)}
                  onChange={handleChange}
                />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </label>
            ))}
          </div>

          {/* Admin Password Confirmation */}
          <input
            name="admin_password"
            type="password"
            placeholder="Admin Password (confirmation)"
            value={form.admin_password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;