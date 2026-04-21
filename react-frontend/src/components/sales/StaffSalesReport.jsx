import React, { useEffect, useState } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./StaffSalesReport.css";

const StaffSalesReport = () => {
  const today = new Date().toISOString().split("T")[0];

  const [sales, setSales] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(true);

  /* ================= FETCH REPORT ================= */
  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (staffId) params.staff_id = staffId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await axiosWithAuth().get("/sales/report/staff", { params });
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load staff sales report");
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH STAFF ================= */
  const fetchStaffList = async () => {
    try {
      const res = await axiosWithAuth().get("/users/");
      setStaffList(Array.isArray(res.data) ? res.data : res.data.users || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load staff list");
    }
  };

  /* ================= FORMATTERS ================= */
  const formatAmount = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

  /* ================= EFFECT ================= */
  useEffect(() => {
    fetchStaffList();
    fetchReport();
    // eslint-disable-next-line
  }, []);

  /* ================= TOTAL NET SALES ================= */
  const totalNetSales = sales.reduce((sum, sale) => {
    return (
      sum +
      (sale.items || []).reduce(
        (itemSum, item) => itemSum + Number(item.net_amount || 0),
        0
      )
    );
  }, 0);

  if (!show) return null;

  /* ================= RENDER ================= */
  return (
    <div className="list-sales-container">
      <button className="close-btn" onClick={() => setShow(false)}>✖</button>

      <h2 className="list-sales-title">👤 Staff Sales Report</h2>

      {/* ================= FILTERS ================= */}
      <div className="sales-filters">
        <label>
          Staff:
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">All Staff</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.username}
              </option>
            ))}
          </select>
        </label>

        <label>
          Start Date:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>

        <label>
          End Date:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>

        <button onClick={fetchReport}>Filter</button>
      </div>

      {loading && <p className="status-text">Loading report...</p>}
      {error && <p className="error-text">{error}</p>}

      {/* ================= TABLE ================= */}
      {!loading && !error && (
        <div className="table-wrapper">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Staff</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Ref</th>
                <th>Product</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Discount</th>
                <th className="text-right">Net</th>
              </tr>
            </thead>

            <tbody>
              {sales.length === 0 && (
                <tr>
                  <td colSpan="12" className="empty-row">No sales found</td>
                </tr>
              )}

              {sales.map((sale) =>
                (sale.items || []).map((item, index) => (
                  <tr key={`${sale.id}-${item.id}`}>
                    {index === 0 && (
                      <>
                        <td rowSpan={sale.items.length}>
                          {new Date(sale.sold_at).toLocaleString()}
                        </td>
                        <td rowSpan={sale.items.length}>{sale.invoice_no}</td>
                        <td rowSpan={sale.items.length}>{sale.staff_name || "-"}</td>
                        <td rowSpan={sale.items.length}>{sale.customer_name || "-"}</td>
                        <td rowSpan={sale.items.length}>{sale.customer_phone || "-"}</td>
                        <td rowSpan={sale.items.length}>{sale.ref_no || "-"}</td>
                      </>
                    )}

                    <td>{item.product_name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{formatAmount(item.selling_price)}</td>
                    <td className="text-right">{formatAmount(item.gross_amount)}</td>
                    <td className="text-right">{formatAmount(item.discount)}</td>
                    <td className="text-right">{formatAmount(item.net_amount)}</td>
                  </tr>
                ))
              )}

              {sales.length > 0 && (
                <tr className="sales-total-row">
                  <td colSpan="11">TOTAL NET SALES</td>
                  <td className="text-right">{formatAmount(totalNetSales)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffSalesReport;
