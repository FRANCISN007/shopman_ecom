import React, { useEffect, useState, useCallback } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./ProfitLoss.css";

const ProfitLoss = ({ currentUser }) => {
  /* ================= ROLE ================= */
  const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const isSuperAdmin = roles.includes("super_admin");

  /* ================= SAFE EMPTY REPORT ================= */
  const emptyReport = {
    revenue: {},
    total_revenue: 0,
    cost_of_sales: 0,
    stock_adjustment_loss: 0,   // 🔥 ADD THIS
    gross_profit: 0,
    expenses: {},
    total_expenses: 0,
    net_profit: 0,
  };

  /* ================= STATE ================= */
  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [businesses, setBusinesses] = useState([]);
  const [businessId, setBusinessId] = useState("");

  /* ================= DATES ================= */
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  /* ================= FETCH BUSINESSES ================= */
  useEffect(() => {
    // Fetch businesses if user is super admin
    axiosWithAuth()
      .get("/business/simple")
      .then((res) => setBusinesses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBusinesses([]));
  }, []);

  /* ================= FETCH REPORT ================= */
  const fetchProfitLoss = useCallback(async () => {
    try {
      setLoading(true);

      const params = { start_date: startDate, end_date: endDate };
      if (businessId) params.business_id = Number(businessId);

      const res = await axiosWithAuth().get(
        "/accounts/profit_loss/profit-loss",
        { params }
      );

      setReport({
        ...emptyReport,
        ...res.data,
        revenue: res.data?.revenue || {},
        expenses: res.data?.expenses || {},
      });

      setError("");
    } catch (err) {
      setReport(emptyReport);
      setError(err.response?.data?.detail || "Failed to load Profit & Loss report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, businessId]);

  useEffect(() => {
    fetchProfitLoss();
  }, [fetchProfitLoss]);

  /* ================= FORMAT ================= */
  const formatAmount = (value) =>
    Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const revenue = report.revenue || {};
  const expenses = report.expenses || {};

  /* ================= UI ================= */
  return (
    <div className="profit-loss-container">
      <h2 className="profit-loss-title">Profit & Loss Statement</h2>

      {/* ================= FILTERS ================= */}
      <div className="pl-filters">
        <label>
          Start Date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>

        <label>
          End Date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>

        {/* Business selector always visible and open */}
        <label>
          Business
          <select value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
            <option value="">All Businesses</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <button onClick={fetchProfitLoss}>Generate</button>
      </div>

      {loading && <p className="status-text">Loading report...</p>}
      {error && <p className="error-text">{error}</p>}

      {/* ================= TABLE ================= */}
      <div className="table-wrapper">
        <table className="pl-table">
          <thead>
            <tr className="pl-head">
              <th>Description</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* REVENUE */}
            <tr className="section-header">
              <td colSpan="2">Revenue</td>
            </tr>
            {Object.keys(revenue).length === 0 ? (
              <tr>
                <td className="indent">No revenue</td>
                <td className="amount">0.00</td>
              </tr>
            ) : (
              Object.entries(revenue).map(([category, amount]) => (
                <tr key={category}>
                  <td className="indent">{category}</td>
                  <td className="amount">{formatAmount(amount)}</td>
                </tr>
              ))
            )}
            <tr className="total-row">
              <td>Total Revenue</td>
              <td className="amount">{formatAmount(report.total_revenue)}</td>
            </tr>

            {/* COST OF SALES */}
            
            {/* COST OF SALES */}
            <tr className="section-header">
              <td colSpan="2">Cost of Sales</td>
            </tr>

            <tr>
              <td className="indent">Cost of Sales (Sales)</td>
              <td className="amount">
                ({formatAmount(report.cost_of_sales)})
              </td>
            </tr>

            <tr>
              <td className="indent">Stock Adjustment (Loss)</td>
              <td className="amount">
                ({formatAmount(report.stock_adjustment_loss)})
              </td>
            </tr>


            <tr className="total-row">
              <td>Total Cost of Sales</td>
              <td className="amount">
                (
                {formatAmount(
                  (report.cost_of_sales || 0) +
                  (report.stock_adjustment_loss || 0)
                )}
                )
              </td>
            </tr>



            {/* GROSS PROFIT */}
            <tr className="highlight-row">
              <td>Gross Profit</td>
              <td className="amount">{formatAmount(report.gross_profit)}</td>
            </tr>

            {/* EXPENSES */}
            <tr className="section-header">
              <td colSpan="2">Expenses</td>
            </tr>
            {Object.keys(expenses).length === 0 ? (
              <tr>
                <td className="indent">No expenses</td>
                <td className="amount">0.00</td>
              </tr>
            ) : (
              Object.entries(expenses).map(([type, amount]) => (
                <tr key={type}>
                  <td className="indent">{type}</td>
                  <td className="amount">({formatAmount(amount)})</td>
                </tr>
              ))
            )}
            <tr className="total-row">
              <td>Total Expenses</td>
              <td className="amount">({formatAmount(report.total_expenses)})</td>
            </tr>

            {/* NET PROFIT */}
            <tr className="net-profit-row">
              <td>Net Profit</td>
              <td className="amount">{formatAmount(report.net_profit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLoss;
