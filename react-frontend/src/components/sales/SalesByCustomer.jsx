import React, { useState, useCallback } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./SalesByCustomer.css";

const SalesByCustomer = () => {
  const today = new Date().toISOString().split("T")[0];

  const [customerName, setCustomerName] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    total_amount: 0,
    total_discount: 0,
    total_paid: 0,
    total_balance: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [show, setShow] = useState(true);

  // Helpers
  const money = (v) =>
    Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const formatDate = (dt) => (dt ? dt.substring(0, 10) : "-");

  const getInvoiceDiscount = (items = []) =>
    items.reduce((sum, i) => sum + (i.discount || 0), 0);

  const fetchSales = useCallback(async () => {
    if (!customerName.trim()) {
      setError("Please enter a customer name");
      setSales([]);
      setSummary({ total_amount: 0, total_discount: 0, total_paid: 0, total_balance: 0 });
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await axiosWithAuth().get("/sales/by-customer", {
        params: {
          customer_name: customerName.trim(),
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });

      const data = res.data || [];
      setSales(data);

      const total_amount = data.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const total_discount = data.reduce((sum, s) => sum + getInvoiceDiscount(s.items), 0);
      const total_paid = data.reduce((sum, s) => sum + (s.total_paid || 0), 0);
      const total_balance = data.reduce((sum, s) => sum + (s.balance_due || 0), 0);

      setSummary({ total_amount, total_discount, total_paid, total_balance });
    } catch (err) {
      console.error("Sales by customer error:", err.response || err);
      setError("Failed to load sales");
      setSales([]);
      setSummary({ total_amount: 0, total_discount: 0, total_paid: 0, total_balance: 0 });
    } finally {
      setLoading(false);
    }
  }, [customerName, startDate, endDate]);

  if (!show) return null;

  return (
    <div className="sales-by-customer-container">
      <button className="close-btn" onClick={() => setShow(false)}>✖</button>

      <h2 className="sales-title">Sales By Customer</h2>

      {/* Filters */}
      <div className="sales-filters">
        <div className="filter-group">
          <label>Customer Name *</label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <button className="filter-btn" onClick={fetchSales}>Search</button>
      </div>

      {loading && <div className="status-text">Loading...</div>}
      {error && <div className="error-text">{error}</div>}

      {/* Table */}
      <div className="table-wrapper">
        <table className="sales-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Invoice Total</th>
              <th>Discount</th>
              <th>Total Paid</th>
              <th>Balance Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {searched && sales.length === 0 && !loading && (
              <tr>
                <td colSpan="12" className="empty-row">No sales found for this customer</td>
              </tr>
            )}

            {sales.map((sale, index) => (
              <React.Fragment key={`sale-${sale.id}`}>
                {sale.items.map((item, itemIndex) => (
                  <tr key={`${sale.id}-${item.id}`}>
                    <td>{index + 1}</td>
                    <td>{sale.invoice_no}</td>
                    <td>{formatDate(sale.invoice_date)}</td>
                    <td>
                      <strong>{sale.customer_name}</strong>
                      <div className="sub-text">{sale.customer_phone}</div>
                    </td>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>{money(item.selling_price)}</td>

                    {itemIndex === 0 && (
                      <>
                        <td rowSpan={sale.items.length}>{money(sale.total_amount)}</td>
                        <td rowSpan={sale.items.length}>{money(getInvoiceDiscount(sale.items))}</td>
                        <td rowSpan={sale.items.length}>{money(sale.total_paid)}</td>
                        <td rowSpan={sale.items.length}>{money(sale.balance_due)}</td>
                        <td rowSpan={sale.items.length}>{sale.payment_status}</td>
                      </>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* GRAND TOTAL */}
            {sales.length > 0 && (
              <tr className="sales-total-row">
                <td colSpan="7">GRAND TOTAL</td>
                <td>{money(summary.total_amount)}</td>
                <td>{money(summary.total_discount)}</td>
                <td>{money(summary.total_paid)}</td>
                <td>{money(summary.total_balance)}</td>
                <td>-</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesByCustomer;
