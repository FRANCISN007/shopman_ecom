import React, { useState, useRef, useEffect } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./PriceUpdate.css";

const PriceUpdate = () => {
  const [show, setShow] = useState(true);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellingPrice, setSellingPrice] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  const searchTimeout = useRef(null);

  // In your system this would come from auth
  const isSuperAdmin = true;

  // --------------------------------
  // Fetch businesses for super admin
  // --------------------------------
  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchBusinesses = async () => {
      setLoadingBusinesses(true);

      try {
        const res = await axiosWithAuth().get("/business/simple");
        setBusinesses(res.data || []);
      } catch (err) {
        console.error("Failed to load businesses:", err);
      } finally {
        setLoadingBusinesses(false);
      }
    };

    fetchBusinesses();
  }, [isSuperAdmin]);

  // --------------------------------
  // Fetch products while typing
  // --------------------------------
  const fetchProducts = async (query) => {
    if (!query) {
      setProducts([]);
      return;
    }

    try {
      const params = { query };

      if (isSuperAdmin && selectedBusinessId) {
        params.business_id = selectedBusinessId;
      }

      const res = await axiosWithAuth().get("/stock/products/search", {
        params,
      });

      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearch(value);
    setSelectedProduct(null);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetchProducts(value);
    }, 300);
  };

  // --------------------------------
  // Handle business selection
  // --------------------------------
  const handleBusinessChange = (e) => {
    setSelectedBusinessId(e.target.value);
    setProducts([]);
    setSearch("");
    setSelectedProduct(null);
  };

  // --------------------------------
  // Submit price update
  // --------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProduct) {
      return setMessage("❌ Please select a product.");
    }

    if (!sellingPrice || Number(sellingPrice) < 0) {
      return setMessage("❌ Please enter a valid selling price.");
    }

    if (isSuperAdmin && !selectedBusinessId) {
      return setMessage("❌ Please select a business.");
    }

    setLoading(true);
    setMessage("");

    try {
      const params = {};

      if (isSuperAdmin) {
        params.business_id = selectedBusinessId;
      }

      await axiosWithAuth().put(
        `/stock/products/${selectedProduct.id}/price`,
        { selling_price: Number(sellingPrice) },
        { params }
      );

      setMessage(`✅ Price for "${selectedProduct.name}" updated successfully.`);

      setSellingPrice("");
      setSearch("");
      setSelectedProduct(null);
      setProducts([]);

    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.detail || "❌ Failed to update price."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="price-card">
        <button className="card-close" onClick={() => setShow(false)}>
          ×
        </button>

        <h2>Update Product Price</h2>

        <form className="form-group" onSubmit={handleSubmit}>

          {/* ---------------- BUSINESS SELECT ---------------- */}
          {isSuperAdmin && (
            <div className="form-group">
              <label>Select Business *</label>

              <select
                value={selectedBusinessId}
                onChange={handleBusinessChange}
                disabled={loadingBusinesses || loading}
                required
              >
                <option value="">-- Select Business --</option>

                {businesses.map((biz) => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ---------------- PRODUCT SEARCH ---------------- */}
          <label>Product</label>

          <input
            type="text"
            placeholder="Search product name..."
            value={search}
            onChange={handleSearchChange}
            disabled={isSuperAdmin && !selectedBusinessId}
          />

          {search && products.length > 0 && (
            <ul className="dropdown">
              {products.map((p) => (
                <li
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setSearch(p.name);
                    setProducts([]);
                  }}
                >
                  {p.name}
                </li>
              ))}
            </ul>
          )}

          {/* ---------------- PRICE ---------------- */}
          <label>New Selling Price</label>

          <input
            type="number"
            min="0"
            placeholder="Enter new price"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
          />

          {/* ---------------- SUBMIT ---------------- */}
          <button
            type="submit"
            disabled={
              loading ||
              (isSuperAdmin && !selectedBusinessId)
            }
          >
            {loading ? "Updating..." : "Update Price"}
          </button>
        </form>

        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
};

export default PriceUpdate;

