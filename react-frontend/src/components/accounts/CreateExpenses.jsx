import React, { useEffect, useState, useRef } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./CreateExpenses.css";




const ACCOUNT_TYPES = [
  "Transport/Haulage",
  "Communication",
  "Salary & Wages",
  "Staff Welfare",
  "Repairs & Maintenance",
  "Printing & Stationeries",
  "Utility Bills",
  "Gifts & Donations",
  "Rates & Levies",
  "Rent",
  "Generator Maintenance",
  "Fuel/Diesel",
  "Vehicle Expenses",
  "Security Expenses",
  "Office Expenses",
  "Fumigation Expenses",
  "Waste Disposal",
  "Electrical Expenses",
  "Entertainment",
  "General Expenses",
  "Cost of Sales",
];

const CreateExpenses = ({ onClose, onSuccess }) => {
  const [vendors, setVendors] = useState([]);
  const [banks, setBanks] = useState([]);
  const [visible, setVisible] = useState(true);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refInput = useRef(null);


  const [formData, setFormData] = useState({
    ref_no: "",
    vendor_id: "",
    account_type: "",
    description: "",
    amount: "",
    payment_method: "",
    bank_id: "",
    expense_date: new Date().toISOString().slice(0, 16),
  });

  // ==============================
  // Fetch vendors & banks
  // ==============================
  useEffect(() => {
    fetchVendors();
    fetchBanks();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await axiosWithAuth().get("/vendor/simple");
      setVendors(Array.isArray(res.data) ? res.data : []);
    } catch {
      setVendors([]);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await axiosWithAuth().get("/bank/");
      setBanks(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBanks([]);
    }
  };

  // ==============================
  // Handle input
  // ==============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "payment_method" && value === "cash"
        ? { bank_id: "" }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.ref_no.trim()) {
      setError("Reference number is required");
      refInput.current?.focus();
      return;
    }

    if (!formData.payment_method) {
      setError("Please select a payment method");
      return;
    }

    if (["transfer", "pos"].includes(formData.payment_method) && !formData.bank_id) {
      setError("Bank is required for Transfer or POS payments");
      return;
    }

    const payload = {
      ...formData,
      vendor_id: Number(formData.vendor_id),
      bank_id: formData.bank_id ? Number(formData.bank_id) : null,
      amount: Number(formData.amount),
      expense_date: new Date(formData.expense_date).toISOString(),
    };

    try {
      setLoading(true);

      await axiosWithAuth().post("/accounts/expenses/", payload);

      setSuccess("Expense created successfully!");

      setFormData({
        ref_no: "",
        vendor_id: "",
        account_type: "",
        description: "",
        amount: "",
        payment_method: "",
        bank_id: "",
        expense_date: new Date().toISOString().slice(0, 16),
      });

      if (onSuccess) onSuccess();

      setTimeout(() => setSuccess(""), 2000);

    } catch (err) {

      let message = "Reference No already exists for this business";

      if (err.response) {
        const data = err.response.data;

        if (typeof data.detail === "string") {
          message = data.detail;

        } else if (Array.isArray(data.detail)) {
          message = data.detail.map((e) => e.msg).join(", ");

        } else if (data.message) {
          message = data.message;
        }
      }

      setError(message);

      if (message.toLowerCase().includes("reference number")) {
        refInput.current?.focus();
      }

    } finally {
      setLoading(false);
    }
  };


  // ==============================
  // Close form
  // ==============================
  const handleClose = () => {
    if (onClose) onClose();
    else setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="expense-overlay">
      <div className="expense-container">
        <button className="close-btn" onClick={handleClose}>✖</button>

        <h2>Create Expense</h2>

        {error && <p className="message error">{error}</p>}
        {success && <p className="message success">{success}</p>}

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-grid">

            {/* Reference Number */}
            <div className="form-group">
              <label>Reference No</label>
              <input
                type="text"
                name="ref_no"
                ref={refInput}
                value={formData.ref_no}
                onChange={handleChange}
                placeholder="PCV-001"
                required
              />

            </div>

            {/* Vendor */}
            <div className="form-group">
              <label>Vendor</label>
              <select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.business_name || v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Type */}
            <div className="form-group">
              <label>Account Type</label>
              <select
                name="account_type"
                value={formData.account_type}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Account Type --</option>
                {ACCOUNT_TYPES.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Method --</option>
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
              </select>
            </div>

            {/* Bank */}
            <div className="form-group">
              <label>Bank</label>
              <select
                name="bank_id"
                value={formData.bank_id}
                onChange={handleChange}
                disabled={formData.payment_method === "cash"}
              >
                <option value="">-- Select Bank --</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Expense Date */}
            <div className="form-group">
              <label>Expense Date</label>
              <input
                type="datetime-local"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional details..."
                style={{ fontSize: "14px" }}
              />
            </div>

          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Expense"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateExpenses;
