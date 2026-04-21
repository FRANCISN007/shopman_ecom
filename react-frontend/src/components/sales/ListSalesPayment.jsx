import React, { useEffect, useState, useCallback, useMemo } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./ListSalesPayment.css";

const ListSalesPayment = () => {
  const today = new Date().toISOString().split("T")[0];

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [status, setStatus] = useState("");
  const [bankId, setBankId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  const [banks, setBanks] = useState([]);
  const [show, setShow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("");


  // ----- Edit Modal State -----
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [editForm, setEditForm] = useState({
    amount_paid: "",
    //discount_allowed: "",
    payment_method: "",
    bank_id: "",
    payment_date: "",
  });

  /* ================= Fetch Banks ================= */
  const fetchBanks = useCallback(async () => {
    try {
      const res = await axiosWithAuth().get("/bank/simple");
      setBanks(res.data || []);
    } catch (err) {
      console.error("Failed to fetch banks", err);
    }
  }, []);

  /* ================= Fetch Payments ================= */
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (status) params.status = status;
      if (bankId) params.bank_id = bankId;
      if (invoiceNo) params.invoice_no = invoiceNo;
      if (paymentMethod) params.payment_method = paymentMethod;   // ✅ NEW

      const res = await axiosWithAuth().get("/payments/", { params });
      setPayments(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, status, bankId, invoiceNo, paymentMethod]);


  useEffect(() => {
    fetchBanks();
    fetchPayments();
  }, [fetchBanks, fetchPayments]);

  /* ================= Delete Payment ================= */
  const handleDeletePayment = async (paymentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this payment?"
    );
    if (!confirmDelete) return;

    try {
      await axiosWithAuth().delete(`/payments/${paymentId}`);
      fetchPayments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to delete payment");
    }
  };

  /* ================= Open Edit Modal ================= */
  const openEditModal = (payment) => {
    setCurrentPayment(payment);
    setEditForm({
      amount_paid: payment.amount_paid,
      //discount_allowed: payment.discount_allowed || 0,
      payment_method: payment.payment_method,
      bank_id: payment.bank_id || "",
      payment_date: payment.payment_date.split("T")[0], // date only
    });
    setEditModalVisible(true);
  };

  /* ================= Handle Edit Form Changes ================= */
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= Submit Edit ================= */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentPayment) return;

    try {
      await axiosWithAuth().put(`/payments/${currentPayment.id}`, {
        amount_paid: parseFloat(editForm.amount_paid),
        discount_allowed: parseFloat(editForm.discount_allowed),
        payment_method: editForm.payment_method,
        bank_id: editForm.bank_id || null,
        payment_date: editForm.payment_date,
      });

      setEditModalVisible(false);
      setCurrentPayment(null);
      fetchPayments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update payment");
    }
  };

  /* ================= Totals ================= */
  const totals = useMemo(() => {
    const invoiceMap = new Map();
    let totalPaid = 0;

    payments.forEach((p) => {
      const invoiceNo = p.invoice_no ?? p.sale_invoice_no;
      totalPaid += p.amount_paid || 0;

      if (!invoiceMap.has(invoiceNo)) {
        invoiceMap.set(invoiceNo, {
          total_amount: p.total_amount || 0,
          balance_due: p.balance_due || 0,
        });
      }
    });

    let totalSales = 0;
    let totalBalance = 0;

    invoiceMap.forEach((inv) => {
      totalSales += inv.total_amount;
      totalBalance += inv.balance_due;
    });

    return {
      total_sales: totalSales,
      amount_paid: totalPaid,
      balance_due: totalBalance,
    };
  }, [payments]);

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-US");

  if (!show) return null;

  return (
    <div className="sales-payment-container">
      <button className="close-btn" onClick={() => setShow(false)}>
        ✖
      </button>

      <h2 className="sales-payment-title">📄 Sales Payments Report</h2>

      {/* ================= Filters ================= */}
      <div className="sales-payment-filters">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <input
          type="text"
          placeholder="Invoice No"
          value={invoiceNo}
          onChange={(e) => setInvoiceNo(e.target.value)}
          style={{ padding: "5px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Payment Status</option>
          <option value="completed">Completed</option>
          <option value="part_paid">Part Paid</option>
          <option value="pending">Pending</option>
        </select>

        <select value={bankId} onChange={(e) => setBankId(e.target.value)}>
          <option value="">All Banks</option>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="pos">POS</option>
          <option value="transfer">Transfer</option>
        </select>


        <button onClick={fetchPayments}>Filter</button>
      </div>

      {/* ================= Status ================= */}
      {loading && (
        <div className="sales-payment-status-text">
          Loading payments...
        </div>
      )}
      {error && <div className="sales-payment-error-text">{error}</div>}

      {/* ================= Table ================= */}
      {!loading && (
        <table className="sales-payment-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Invoice</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Method</th>
              <th>BANK</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="10" className="sales-payment-empty-row">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>{p.customer_name}</td>
                  <td>{p.invoice_no ?? p.sale_invoice_no}</td>
                  <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td>{formatAmount(p.total_amount)}</td>
                  <td>{formatAmount(p.amount_paid)}</td>
                  <td>{formatAmount(p.balance_due)}</td>
                  <td>{p.payment_method}</td>
                  <td>{p.bank_name}</td>
                  <td>{p.status}</td>
                  <td>
                    <button
                      className="edit-icon-btn"
                      title="Edit Payment"
                      onClick={() => openEditModal(p)}
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-icon-btn"
                      title="Delete Payment"
                      onClick={() => handleDeletePayment(p.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {payments.length > 0 && (
            <tfoot>
              <tr className="sales-total-row">
                <td colSpan="4">TOTAL</td>
                <td style={{ fontWeight: "bold", fontSize: "1rem" }}>
                  {formatAmount(totals.total_sales)}
                </td>
                <td style={{ fontWeight: "bold", fontSize: "1rem" }}>
                  {formatAmount(totals.amount_paid)}
                </td>
                <td style={{ fontWeight: "bold", fontSize: "1rem" }}>
                  {formatAmount(totals.balance_due)}
                </td>
                <td colSpan="4"></td>
              </tr>
            </tfoot>
          )}
        </table>
      )}

      {/* ================= Edit Modal ================= */}
      {editModalVisible && currentPayment && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Payment</h3>
            <form onSubmit={handleEditSubmit} className="edit-form">
              <label>
                Amount Paid
                <input
                  type="number"
                  step="0.01"
                  name="amount_paid"
                  value={editForm.amount_paid}
                  onChange={handleEditChange}
                  required
                />
              </label>

              

              <label>
                Payment Method
                <select
                  name="payment_method"
                  value={editForm.payment_method}
                  onChange={handleEditChange}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="pos">POS</option>
                  <option value="transfer">Transfer</option>
                </select>
              </label>

              <label>
                Bank
                <select
                  name="bank_id"
                  value={editForm.bank_id || ""}
                  onChange={handleEditChange}
                >
                  <option value="">Select Bank</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Payment Date
                <input
                  type="date"
                  name="payment_date"
                  value={editForm.payment_date}
                  onChange={handleEditChange}
                  required
                />
              </label>

              <div className="modal-actions">
                <button type="submit">Save</button>
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setEditModalVisible(false)}
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

export default ListSalesPayment;
