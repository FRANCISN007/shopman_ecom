import React, { useEffect, useState, useCallback } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./DebtorSalesReport.css";

const OutstandingSales = () => {
  // =========================
  // DEFAULT MONTH RANGE
  // =========================
  const now = new Date();

  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toLocaleDateString("en-CA");

  const lastDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).toLocaleDateString("en-CA");

  // =========================
  // STATE
  // =========================
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);
  const [customerName, setCustomerName] = useState("");
  const [show, setShow] = useState(true);

  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    sales_sum: 0,
    discount_sum: 0,
    paid_sum: 0,
    balance_sum: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // =========================
  // HELPERS
  // =========================
  const getInvoiceDiscount = (items = []) =>
    items.reduce((sum, i) => sum + (i.discount || 0), 0);

  const getDebtAgeDays = (invoiceDate) => {
    if (!invoiceDate) return 0;

    const today = new Date();
    const invoice = new Date(invoiceDate);

    today.setHours(0, 0, 0, 0);
    invoice.setHours(0, 0, 0, 0);

    const diffTime = today - invoice;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const money = (v) =>
    Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const formatDate = (dt) => (dt ? dt.substring(0, 10) : "-");

  // =========================
  // FETCH DATA
  // =========================
  const fetchOutstandingSales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axiosWithAuth().get("/sales/outstanding", {
        params: {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          customer_name: customerName || undefined,
        },
      });

      const salesData = res.data?.sales ?? [];
      setSales(salesData);

      const discount_sum = salesData.reduce(
        (sum, sale) => sum + getInvoiceDiscount(sale.items),
        0
      );

      setSummary({
        sales_sum: res.data?.summary?.sales_sum ?? 0,
        discount_sum,
        paid_sum: res.data?.summary?.paid_sum ?? 0,
        balance_sum: res.data?.summary?.balance_sum ?? 0,
      });
    } catch (err) {
      console.error("Outstanding sales fetch error:", err);
      setError("Failed to load outstanding sales");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, customerName]);

  useEffect(() => {
    fetchOutstandingSales();
  }, [fetchOutstandingSales]);

  if (!show) return null;

  // =========================
  // RENDER
  // =========================
  return (
    <div className="outstanding-sales-container">
      <button className="close-btn" onClick={() => setShow(false)}>
        ✖
      </button>

      <h2 className="outstanding-sales-title">Debtors Sales Report</h2>

      {/* ========================= FILTERS ========================= */}
      <div className="outstanding-sales-filters1">
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Customer Name</label>
          <input
            type="text"
            placeholder="Search customer..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <button className="filter-btn" onClick={fetchOutstandingSales}>
          Filter
        </button>
      </div>

      {/* ========================= STATUS ========================= */}
      {loading && <div className="status-text">Loading...</div>}
      {error && <div className="error-text">{error}</div>}

      {/* ========================= TABLE ========================= */}
      <div className="table-wrapper">
        <table className="sales-table1">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Debt Age (Days)</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Invoice Total</th>
              <th>Total Paid</th>
              <th>Balance Due</th>
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 && !loading && (
              <tr>
                <td colSpan="12" className="empty-row">
                  No outstanding sales found
                </td>
              </tr>
            )}

            {sales.map((sale, index) => (
              <React.Fragment key={sale.id}>
                {sale.items.map((item, itemIndex) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{sale.invoice_no}</td>
                    <td>{formatDate(sale.invoice_date)}</td>

                    {itemIndex === 0 && (
                     <td
                        rowSpan={sale.items.length}
                        className={
                          getDebtAgeDays(sale.invoice_date) > 7
                            ? "debt-age overdue"
                            : "debt-age"
                        }
                      >
                        {getDebtAgeDays(sale.invoice_date)}{" "}
                        {getDebtAgeDays(sale.invoice_date) === 1 ? "day" : "days"}
                      </td>

                    )}

                    <td>
                      <strong>
                        {sale.customer_name?.trim() || "Walk-in"}
                      </strong>
                      <div className="sub-text">
                        {sale.customer_phone || "-"}
                      </div>
                    </td>

                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>{money(item.selling_price)}</td>

                    {itemIndex === 0 && (
                      <>
                        <td rowSpan={sale.items.length}>
                          {money(getInvoiceDiscount(sale.items))}
                        </td>
                        <td rowSpan={sale.items.length}>
                          {money(sale.total_amount)}
                        </td>
                        <td rowSpan={sale.items.length}>
                          {money(sale.total_paid)}
                        </td>
                        <td
                          rowSpan={sale.items.length}
                          className="balance-cell"
                        >
                          {money(sale.balance_due)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* ========================= GRAND TOTAL ========================= */}
            {sales.length > 0 && (
              <tr className="sales-total-row">
                <td colSpan="8">GRAND TOTAL</td>
                <td>{money(summary.discount_sum)}</td>
                <td>{money(summary.sales_sum)}</td>
                <td>{money(summary.paid_sum)}</td>
                <td>{money(summary.balance_sum)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutstandingSales;
