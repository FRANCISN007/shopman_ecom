import React, { useEffect, useState, useCallback } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./StockAdjustment.css";

const StockAdjustment = ({ onClose }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔑 SAME PATTERN AS CREATE PRODUCT
  const [visible, setVisible] = useState(true);
  

  const fetchProducts = useCallback(async () => {

    
    try {
      const res = await axiosWithAuth().get("/stock/products/simple");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load products");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts =
    !selectedProduct && search
      ? products.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase())
        )
      : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedProduct || !quantity || !reason) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await axiosWithAuth().post("/stock/inventory/adjustments/", {
        product_id: selectedProduct.id,
        quantity: parseFloat(quantity),
        reason,
      });

      setSuccess("Stock adjusted successfully");
      setSearch("");
      setSelectedProduct(null);
      setQuantity("");
      setReason("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  };

  // 🔑 SAME CLOSE LOGIC AS CREATE PRODUCT
  const handleCloseForm = () => {
    if (onClose) {
      onClose();        // notify parent
    } else {
      setVisible(false); // fallback close
    }
  };

  if (!visible) return null;

  return (
    <div className="stock-page">
      <div className="stock-card">
        {/* CLOSE X */}
        <button className="card-close" onClick={handleCloseForm}>
          ✖
        </button>

        <h2>Stock Adjustment</h2>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}
        {loading && <div className="alert info">Processing...</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product</label>
            <input
              type="text"
              placeholder="Search product name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedProduct(null);
              }}
            />

            {filteredProducts.length > 0 && (
              <div className="product-dropdown">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="product-option"
                    onClick={() => {
                      setSelectedProduct(p);
                      setSearch(p.name);
                    }}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Quantity (+ / -)</label>
            <input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Adjust Stock"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustment;
