import React, { useEffect, useState, useCallback } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth"; // function that returns axios instance
import "./ListSales.css";

const ListSales = () => {
  const today = new Date().toISOString().split("T")[0];

  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    total_sales: 0,
    total_paid: 0,
    total_balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [show, setShow] = useState(true); // NEW: controls visibility

  const getSaleDiscountTotal = (items = []) =>
  items.reduce((sum, item) => sum + Number(item.discount || 0), 0);

  const getSaleGrossTotal = (items = []) =>
  items.reduce((sum, item) => sum + Number(item.gross_amount || 0), 0);



  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const axiosInstance = axiosWithAuth(); // 🔹 call the function
      const params = { start_date: startDate, end_date: endDate };

      const response = await axiosInstance.get("/sales/", { params }); // ✅ now works

      console.log("Sales API response:", response.data);

      if (Array.isArray(response.data?.sales)) {
        setSales(response.data.sales);
        setSummary(
          response.data.summary ?? {
            total_sales: 0,
            total_paid: 0,
            total_balance: 0,
          }
        );
      } else {
        console.error("Unexpected response shape:", response.data);
        setSales([]);
        setSummary({ total_sales: 0, total_paid: 0, total_balance: 0 });
        setError("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Fetch sales error:", err);
      setError("Failed to load sales records.");
      setSales([]);
      setSummary({ total_sales: 0, total_paid: 0, total_balance: 0 });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);




  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-US");

  if (!show) return null; // hide the component when closed

  return (
    <div className="list-sales-container">

      {/* Close button */}
      <button
        className="close-btn"
        onClick={() => setShow(false)} // hides the page
      >
        ✖
      </button>

      <h2 className="list-sales-title">📄 Sales List Records</h2>

      {/* Filters */}
      <div className="sales-filters">
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button onClick={fetchSales}>Filter</button>
      </div>

      {loading && <p className="status-text">Loading sales...</p>}
      {error && !loading && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="sales-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Phone No</th>
                <th>Reference No</th>
                <th>Product Name</th>
                <th className="text-right">Gross Amount</th>
                <th className="text-right">Discount</th> {/* ✅ NEW */}
                <th className="text-right">Total Amount</th>
                <th className="text-right">Total Paid</th>
                <th className="text-right">Balance Due</th>
                <th>Status</th>
                <th>Sold At</th>
              </tr>
            </thead>

            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="11" className="empty-row">
                    No sales records found
                  </td>
                </tr>
              ) : (
                sales.map((sale, index) => (
                  <tr key={sale.id ?? index}>
                    <td>{index + 1}</td>
                    <td>{sale.invoice_no ?? "-"}</td>
                    <td>{sale.customer_name || "Walk-in"}</td>
                    <td>{sale.customer_phone || "-"}</td>
                    <td>{sale.ref_no || "-"}</td>
                    <td>
                      {sale.items && sale.items.length > 0
                        ? sale.items.map((item) => item.product_name).join(", ")
                        : "-"}
                    </td>

                    <td className="text-right">
                      {formatAmount(getSaleGrossTotal(sale.items))}
                    </td>

                    
                    <td className="text-right">
                      {formatAmount(getSaleDiscountTotal(sale.items))}
                    </td>
                    <td className="text-right">{formatAmount(sale.total_amount)}</td>
                    <td className="text-right">{formatAmount(sale.total_paid)}</td>
                    <td className="text-right">{formatAmount(sale.balance_due)}</td>
                    <td>{sale.payment_status || "-"}</td>
                    <td>
                      {sale.sold_at
                        ? new Date(sale.sold_at).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Totals Row */}
            {sales.length > 0 && (
              <tfoot>
              <tr className="sales-total-row">
                <td colSpan="6">TOTAL</td>

                {/* Gross Amount TOTAL */}
                <td className="text-right">
                  {formatAmount(
                    sales.reduce(
                      (sum, sale) => sum + getSaleGrossTotal(sale.items),
                      0
                    )
                  )}
                </td>

                {/* Discount TOTAL */}
                <td className="text-right">
                  {formatAmount(
                    sales.reduce(
                      (sum, sale) => sum + getSaleDiscountTotal(sale.items),
                      0
                    )
                  )}
                </td>

                {/* Net / Total Amount */}
                <td className="text-right">
                  {formatAmount(summary.total_sales)}
                </td>

                <td className="text-right">
                  {formatAmount(summary.total_paid)}
                </td>

                <td className="text-right">
                  {formatAmount(summary.total_balance)}
                </td>

                <td colSpan="2"></td>
              </tr>
            </tfoot>


            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default ListSales;
