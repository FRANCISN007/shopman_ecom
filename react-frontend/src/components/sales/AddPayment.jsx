import React, { useEffect, useState, useCallback } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./AddPayment.css";

const AddPayment = () => {
  /* ===============================
     VISIBILITY (LIKE OUTSTANDING SALES)
  =============================== */
  const [show, setShow] = useState(true);

  /* ===============================
     DEFAULT DATE: CURRENT MONTH
  =============================== */
  const now = new Date();

  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toLocaleDateString("en-CA");

  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).toLocaleDateString("en-CA");

  /* ===============================
     STATE
  =============================== */
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    sales_sum: 0,
    paid_sum: 0,
    balance_sum: 0,
  });

  const [banks, setBanks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [bankId, setBankId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");


  const [filterStartDate, setFilterStartDate] = useState(startDate);
  const [filterEndDate, setFilterEndDate] = useState(endDate);
  const [filterCustomer, setFilterCustomer] = useState("");


  /* ===============================
     FETCH OUTSTANDING SALES
  =============================== */
  const fetchOutstandingSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axiosWithAuth().get("/sales/outstanding", {
        params: {
          start_date: filterStartDate,
          end_date: filterEndDate,
          customer_name: filterCustomer || undefined,
        },

      });

      setSales(res.data?.sales ?? []);
      setSummary(
        res.data?.summary ?? {
          sales_sum: 0,
          paid_sum: 0,
          balance_sum: 0,
        }
      );
    } catch (err) {
      console.error("Failed to load outstanding sales", err);
      setError("Failed to load outstanding sales");
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterCustomer]);


  /* ===============================
     FETCH BANKS
  =============================== */
  const fetchBanks = useCallback(async () => {
    try {
      const res = await axiosWithAuth().get("/bank/simple");
      setBanks(res.data || []);
    } catch (err) {
      console.error("Failed to load banks", err);
    }
  }, []);

  /* ===============================
     EFFECTS
  =============================== */
  useEffect(() => {
    fetchOutstandingSales();
    fetchBanks();
  }, [fetchOutstandingSales, fetchBanks]);

  /* ===============================
     MODAL HANDLERS
  =============================== */
  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setAmountPaid(sale.balance_due);
    setPaymentMethod("cash");
    setBankId("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  /* ===============================
     SUBMIT PAYMENT
  =============================== */
  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    try {
      await axiosWithAuth().post(
        `/payments/${selectedSale.invoice_no}/payments`,
        {
          amount_paid: Number(amountPaid),
          payment_method: paymentMethod,
          bank_id: paymentMethod === "cash" ? null : bankId,
          payment_date: paymentDate,
        }
      );

      closeModal();
      fetchOutstandingSales();
    } catch (err) {
      alert(err.response?.data?.detail || "Payment failed");
    }
  };

  /* ===============================
     SAFE EARLY RETURN (AFTER HOOKS)
  =============================== */
  if (!show) return null;

  return (
    <div className="outstanding-sales-container">
      {/* PAGE CLOSE */}
      <button className="close-btn" onClick={() => setShow(false)}>
        ✖
      </button>

      <h2 className="outstanding-sales__title">Outstanding Sales For Payment</h2>

      {loading && (
        <div className="outstanding-sales__status">Loading...</div>
      )}
      {error && (
        <div className="outstanding-sales__error">{error}</div>
      )}


      <div className="outstanding-sales__filters">
        <input
          type="date"
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
        />

        <input
          type="date"
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
        />

        <input
          type="text"
          placeholder="Search customer..."
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
        />

        <button className="filter-btn" onClick={fetchOutstandingSales}>
          Filter
        </button>
      </div>


      <div className="outstanding-sales__table1-wrapper">
        <table className="outstanding-sales__table1">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="outstanding-sales__empty">
                  No outstanding sales
                </td>
              </tr>
            )}

            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.invoice_no}</td>
                <td>{sale.invoice_date}</td>
                <td>{sale.customer_name || "Walk-in"}</td>
                <td>₦{Number(sale.total_amount).toLocaleString()}</td>
                <td>₦{Number(sale.total_paid).toLocaleString()}</td>
                <td className="outstanding-sales__balance">
                  ₦{Number(sale.balance_due).toLocaleString()}
                </td>
                <td>
                  <button
                    className="filter-btn"
                    onClick={() => openPaymentModal(sale)}
                  >
                    Pay →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

          {sales.length > 0 && (
            <tfoot>
              <tr className="outstanding-sales__total">
                <td colSpan="3">TOTAL</td>
                <td>₦{Number(summary.sales_sum).toLocaleString()}</td>
                <td>₦{Number(summary.paid_sum).toLocaleString()}</td>
                <td colSpan="2" className="balance-cell">
                  ₦{Number(summary.balance_sum).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* PAYMENT MODAL */}
      {showModal && selectedSale && (
        <div className="add-payment__modal-overlay">
          <div className="add-payment__modal">
            <button className="close-btn" onClick={closeModal}>
              ✖
            </button>

            <h3>Make Payment</h3>

            <p>
              <strong>Invoice:</strong> {selectedSale.invoice_no}
            </p>
            <p>
              <strong>Balance Due:</strong> ₦
              {Number(selectedSale.balance_due).toLocaleString()}
            </p>

            <form onSubmit={handleSubmitPayment}>
              <label>Amount Paid</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                required
              />

              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
              </select>

              {paymentMethod !== "cash" && (
                <>
                  <label>Bank</label>
                  <select
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Bank --</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label>Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />

              <button type="submit" className="filter-btn">
                Submit Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPayment;
