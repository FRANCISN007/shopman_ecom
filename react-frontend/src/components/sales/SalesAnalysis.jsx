import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./SalesAnalysis.css";

const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const SalesAnalysis = () => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);

  const [summary, setSummary] = useState({
    total_sales: 0,
    total_discount: 0,
    total_cost_of_sales: 0,   // ✅ ADD
    total_margin: 0,
  });

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [productId, setProductId] = useState("");

  // 🔎 searchable dropdown state
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [show, setShow] = useState(true);

  const formatAmount = (value) =>
    value === "-" || value === null || value === undefined
      ? "-"
      : Number(value).toLocaleString();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/stock/products/simple`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      const data = res.data;

      if (Array.isArray(data)) setProducts(data);
      else if (Array.isArray(data?.items)) setProducts(data.items);
      else if (Array.isArray(data?.results)) setProducts(data.results);
      else setProducts([]);
    } catch (err) {
      console.error("Failed to load products", err);
      setProducts([]);
    }
  }, []);

  const fetchSalesAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${BASE_URL}/sales/report/analysis`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          ...(productId && { product_id: productId }),
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      const {
        items = [],
        total_sales = 0,
        total_discount = 0,
        total_cost_of_sales = 0,   // ✅ IMPORTANT
        total_margin = 0,
      } = res.data || {};

      setItems(items);

      setSummary({
        total_sales,
        total_discount,
        total_cost_of_sales,   // ✅ IMPORTANT
        total_margin,
      });

    } catch (err) {
      console.error("Sales analysis fetch failed:", err);
      setError("Failed to load sales analysis");

      setItems([]);

      // ✅ reset safely with zeros
      setSummary({
        total_sales: 0,
        total_discount: 0,
        total_cost_of_sales: 0,
        total_margin: 0,
      });

    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, productId]);


  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchSalesAnalysis();
  }, [fetchSalesAnalysis]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectProduct = (p) => {
    setProductId(p.id);
    setSearchTerm(p.name);
    setShowDropdown(false);
  };

  if (!show) return null;

  return (
    <div className="sales-analysis-container">
      <button className="close-btn" onClick={() => setShow(false)}>✖</button>

      <h2>📊 Sales Analysis Report</h2>

      <div className="filter-section">
        <label>
          Start Date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>

        <label>
          End Date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>

        {/* 🔎 SEARCHABLE PRODUCT DROPDOWN */}
        <div className="product-search">
          <label>Product</label>
          <input
            type="text"
            placeholder="Search product..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
              setProductId("");
            }}
            onFocus={() => setShowDropdown(true)}
          />

          {showDropdown && (
            <div className="dropdown">
              <div className="dropdown-item" onClick={() => { setProductId(""); setSearchTerm(""); setShowDropdown(false); }}>
                All Products
              </div>

              {filteredProducts.slice(0, 10).map((p) => (
                <div key={p.id} className="dropdown-item" onClick={() => selectProduct(p)}>
                  {p.name}
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="dropdown-empty">No product found</div>
              )}
            </div>
          )}
        </div>

        <button onClick={fetchSalesAnalysis}>Filter</button>
      </div>

      {loading && <p className="status-text">Loading report...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="sales-analysis-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty Sold</th>
                <th>Cost Price</th>
                <th>Avg Selling</th>
                <th className="text-right">Gross Sales</th>
                <th className="text-right">Discount</th>
                <th className="text-right">Net Sales</th>
                <th className="text-right">Cost Of Sales</th>
                <th className="text-right">Margin</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr className="empty-row"><td colSpan={8}>No data available</td></tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.product_id} className={index % 2 === 0 ? "even" : "odd"}>
                    <td>{item.product_name}</td>
                    <td>{item.quantity_sold}</td>
                    <td>{formatAmount(item.cost_price)}</td>
                    <td>{formatAmount(item.selling_price)}</td>
                    <td className="text-right">{formatAmount(item.gross_sales)}</td>
                    <td className="text-right discount">{formatAmount(item.discount)}</td>
                    <td className="text-right">{formatAmount(item.net_sales)}</td>
                    <td className="text-right">{formatAmount(item.cost_of_sales)}</td>
                    <td className="text-right margin">{formatAmount(item.margin)}</td>
                  </tr>
                ))
              )}
            </tbody>

            {items.length > 0 && (
              <tfoot>
                <tr className="sales-total-row">
                  <td colSpan={4}>TOTAL</td>
                  <td className="text-right">
                    {formatAmount(items.reduce((sum, i) => sum + Number(i.gross_sales || 0), 0))}
                  </td>
                  <td className="text-right">{formatAmount(summary.total_discount)}</td>
                  <td className="text-right">{formatAmount(summary.total_sales)}</td>
                  <td className="text-right">{formatAmount(summary.total_cost_of_sales)}</td>
                  <td className="text-right">{formatAmount(summary.total_margin)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default SalesAnalysis;
