import React, { useEffect, useState, useCallback } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./ListExpenses.css";

/* =========================
   DEFAULT MONTH RANGE
   ========================= */
const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date();

  return {
    start_date: start.toISOString().split("T")[0],
    end_date: end.toISOString().split("T")[0],
  };
};

/* =========================
   ACCOUNT TYPE OPTIONS
   ========================= */
const ACCOUNT_TYPES = [
  "Rent",
  "Utility Bills",
  "Transportation/Haulage",
  "Staff Welfare",
  "Repairs & Maintenance",
  "Rates & Levies",
  "Vehicle Expenses",
  "Communication",
  "Printing & Stationeries",
  "Salary & Wages",
  "Gifts & Donations",
  "Security Expenses",
  "Office Expenses",
  "Fumigation Expenses",
  "Electrical Expenses",
  "Entertainment",
  "Cost of Sales",
  "General Expenses",
];

/* =========================
   PAYMENT METHOD OPTIONS
   ========================= */
const PAYMENT_METHODS = ["cash", "pos", "transfer"];

const ListExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [show, setShow] = useState(true);

  /* =========================
     FILTER STATE
     ========================= */
  const [filters, setFilters] = useState({
    ...getMonthRange(),
    account_type: "",
  });

  /* =========================
     BANK & VENDOR STATE
     ========================= */
  const [banks, setBanks] = useState([]);
  const [vendors, setVendors] = useState([]);

  const fetchBanks = async () => {
    try {
      const res = await axiosWithAuth().get("/bank/simple"); // expects [{id, name}]
      setBanks(res.data || []);
    } catch {
      console.error("Failed to load banks");
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await axiosWithAuth().get("/vendor/simple"); // expects [{id, business_name}]
      setVendors(res.data || []);
    } catch {
      console.error("Failed to load vendors");
    }
  };

  useEffect(() => {
    fetchBanks();
    fetchVendors();
  }, []);

  /* =========================
     EDIT MODAL STATE
     ========================= */
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    ref_no: "",
    vendor_id: "",
    account_type: "",
    description: "",
    amount: "",
    payment_method: "",
    bank_id: "",
    expense_date: "",
  });

  /* =========================
     FETCH EXPENSES
     ========================= */
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        start_date: filters.start_date,
        end_date: filters.end_date,
      };
      if (filters.account_type) params.account_type = filters.account_type;

      const res = await axiosWithAuth().get("/accounts/expenses/", { params });
      setExpenses(res.data?.expenses || []);
      setTotal(res.data?.total_expenses || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  /* =========================
     OPEN EDIT MODAL
     ========================= */
  const handleEditOpen = (exp) => {
    const accountType = ACCOUNT_TYPES.includes(exp.account_type?.trim())
      ? exp.account_type.trim()
      : "";
    const paymentMethod = PAYMENT_METHODS.includes(exp.payment_method?.trim())
      ? exp.payment_method.trim()
      : "";

    setEditData({
      id: exp.id,
      ref_no: exp.ref_no ?? "",
      vendor_id: exp.vendor_id ?? "",
      account_type: accountType,
      description: exp.description ?? "",
      amount: Number(exp.amount || 0),
      payment_method: paymentMethod,
      bank_id: exp.bank_id ?? "",
      expense_date: exp.expense_date ? exp.expense_date.split("T")[0] : "",
    });

    setShowEdit(true);
  };

  /* =========================
     DELETE EXPENSE
     ========================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await axiosWithAuth().delete(`/accounts/expenses/${id}`);
      fetchExpenses();
    } catch {
      alert("Failed to delete expense");
    }
  };

  const formatAmount = (amt) => Number(amt || 0).toLocaleString("en-NG");

  if (!show) return null;

  return (
    <div className="list-expenses-container">
      <button className="close-btn" onClick={() => setShow(false)}>
        ✖
      </button>
      <h2 className="list-expenses-title">📉 Expense Records</h2>

      {/* ================= FILTER BAR ================= */}
      <div className="expense-filters">
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) =>
              setFilters({ ...filters, start_date: e.target.value })
            }
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) =>
              setFilters({ ...filters, end_date: e.target.value })
            }
          />
        </div>

        <div className="filter-group">
          <label>Account Type</label>
          <select
            value={filters.account_type}
            onChange={(e) =>
              setFilters({ ...filters, account_type: e.target.value })
            }
          >
            <option value="">All</option>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <button className="filter-btn" onClick={fetchExpenses}>
          Apply
        </button>
        <button
          className="reset-btn"
          onClick={() =>
            setFilters({ ...getMonthRange(), account_type: "" })
          }
        >
          Reset
        </button>
      </div>

      {loading && <p className="status-text">Loading expenses...</p>}
      {error && !loading && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Ref No</th>
                <th>Vendor</th>
                <th>Account Type</th>
                <th>Description</th>
                <th>Bank</th>
                <th>Payment Mode</th>
                <th className="text-right">Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-row">
                    No expense records found
                  </td>
                </tr>
              ) : (
                expenses.map((exp, index) => (
                  <tr
                    key={exp.id}
                    className={index % 2 === 0 ? "even-row" : "odd-row"}
                  >
                    <td>{index + 1}</td>
                    <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                    <td>{exp.ref_no || "-"}</td>
                    <td>{exp.vendor_name || "-"}</td>
                    <td>{exp.account_type}</td>
                    <td className="truncate">{exp.description || "-"}</td>
                    <td>{exp.bank_name || "-"}</td>
                    <td>{exp.payment_method}</td>
                    <td className="text-right">{formatAmount(exp.amount)}</td>
                    <td>
                      <button onClick={() => handleEditOpen(exp)}>✏️</button>
                      <button onClick={() => handleDelete(exp.id)}>🗑</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {expenses.length > 0 && (
              <tfoot>
                <tr className="expenses-total-row">
                  <td colSpan="8">TOTAL</td>
                  <td className="text-right">{formatAmount(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Expense</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const payload = {
                  ref_no: editData.ref_no,
                  vendor_id: Number(editData.vendor_id),
                  account_type: editData.account_type,
                  description: editData.description,
                  amount: Number(editData.amount),
                  payment_method: editData.payment_method,
                  bank_id:
                    editData.payment_method === "cash"
                      ? null
                      : editData.bank_id || null,
                  expense_date: editData.expense_date,
                };

                try {
                  await axiosWithAuth().put(
                    `/accounts/expenses/${editData.id}`,
                    payload
                  );
                  setShowEdit(false);
                  fetchExpenses();
                } catch (err) {
                  alert(err.response?.data?.detail || "Update failed");
                }
              }}
            >
              <label>
                Ref No
                <input
                  value={editData.ref_no}
                  onChange={(e) =>
                    setEditData({ ...editData, ref_no: e.target.value })
                  }
                />
              </label>

              <label>
                Vendor
                <select
                  value={editData.vendor_id || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, vendor_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.business_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Account Type
                <select
                  value={editData.account_type}
                  onChange={(e) =>
                    setEditData({ ...editData, account_type: e.target.value })
                  }
                  required
                >
                  <option value="">Select</option>
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Description
                <input
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                />
              </label>

              <label>
                Amount
                <input
                  type="number"
                  value={editData.amount}
                  onChange={(e) =>
                    setEditData({ ...editData, amount: e.target.value })
                  }
                />
              </label>

              <label>
                Payment Method
                <select
                  value={editData.payment_method}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      payment_method: e.target.value,
                      bank_id:
                        e.target.value === "cash" ? null : editData.bank_id,
                    })
                  }
                >
                  <option value="">Select</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              {["pos", "transfer"].includes(editData.payment_method) && (
                <label>
                  Bank
                  <select
                    value={editData.bank_id || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, bank_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Bank</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Expense Date
                <input
                  type="date"
                  value={editData.expense_date}
                  onChange={(e) =>
                    setEditData({ ...editData, expense_date: e.target.value })
                  }
                />
              </label>

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  Update
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListExpenses;
