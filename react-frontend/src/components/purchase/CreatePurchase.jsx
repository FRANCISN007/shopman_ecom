import React, { useEffect, useState, useMemo } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./CreatePurchase.css";

/* ========= Helpers ========= */
const formatNumber = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  return Number(value).toLocaleString("en-NG");
};

const stripCommas = (value) => value.replace(/,/g, "");

/* ========= Empty Row ========= */
const emptyRow = {
  barcode: "",
  productQuery: "",
  productId: "",
  products: [],
  quantity: "",
  unitPrice: "",
  total: 0,
};

const CreatePurchase = ({ onClose, currentUser }) => {
  const roles = currentUser?.roles || [];
  const isSuperAdmin = roles.includes("super_admin");

  const [vendors, setVendors] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [rows, setRows] = useState([{ ...emptyRow }]);

  const [vendorId, setVendorId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(true);

  const [activeSearchRow, setActiveSearchRow] = useState(null);


  // ✅ CACHE ALL PRODUCTS (KEY FIX)
  const [allProducts, setAllProducts] = useState([]);

  /* ===================== Fetch Data ===================== */
  useEffect(() => {
    fetchVendors();
    if (isSuperAdmin) fetchBusinesses();
    setPurchaseDate(new Date().toISOString().split("T")[0]);
  }, []);



  // reload products when business changes
  useEffect(() => {
    fetchProducts();
  }, [businessId]);

  const fetchVendors = async () => {
    try {
      const res = await axiosWithAuth().get("/vendor/simple");
      setVendors(Array.isArray(res.data) ? res.data : []);
    } catch {
      setVendors([]);
    }
  };


  useEffect(() => {
    const closeDropdown = () => setActiveSearchRow(null);
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);



  const fetchBusinesses = async () => {
    try {
      const res = await axiosWithAuth().get("/business/simple");
      setBusinesses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBusinesses([]);
    }
  };

  // 🔥 LOAD ALL PRODUCTS ONCE (FAST LIKE POS)
  const fetchProducts = async () => {
    try {
      const res = await axiosWithAuth().get("/stock/products/simple", {
        params: { business_id: businessId || undefined },
      });
      setAllProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAllProducts([]);
    }
  };

  /* ===================== FAST LOCAL SEARCH ===================== */
  const searchProducts = (index, query) => {
    const q = (query || "").toLowerCase();

    const filtered = allProducts
      .filter((p) =>
        !q ||   // 🔥 show ALL when empty (like POS)
        (p.name || "").toLowerCase().includes(q) ||
        (p.barcode || "").includes(q)
      )
      .slice(0, 10);

    const updated = [...rows];
    updated[index].products = filtered;
    setRows(updated);
  };



  /* ===================== Barcode Scan ===================== */
  const scanBarcode = async (index, barcode) => {
    if (!barcode) return;

    try {
      const res = await axiosWithAuth().get(
        `/stock/products/scan/${barcode}`,
        {
          params: { business_id: businessId || undefined },
        }
      );

      const product = res.data;

      const updated = [...rows];
      updated[index].productId = product.id;
      updated[index].productQuery = product.name;
      updated[index].barcode = product.barcode || barcode;
      updated[index].products = [];

      setRows(updated);
    } catch (err) {
      console.error("Barcode scan failed", err);

      const updated = [...rows];
      updated[index].productId = "";
      updated[index].productQuery = "";
      setRows(updated);
    }
  };

  /* ===================== Row Handlers ===================== */
  const handleRowChange = (index, field, value) => {
    const updated = [...rows];

    if (field === "unitPrice") value = stripCommas(value);

    updated[index][field] = value;

    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;

    updated[index].total = qty * price;

    setRows(updated);
  };

  const handleProductSelect = (index, product) => {
    const updated = [...rows];
    updated[index].productId = product.id;
    updated[index].productQuery = product.name;
    updated[index].barcode = product.barcode || "";
    updated[index].products = [];
    setRows(updated);
  };

  const addRow = () => setRows([...rows, { ...emptyRow }]);
  const removeRow = (index) =>
    setRows(rows.filter((_, i) => i !== index));

  /* ===================== Submit ===================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!invoiceNo) {
      setMessage("❌ Invoice number is required");
      return;
    }

    if (isSuperAdmin && !businessId) {
      setMessage("❌ Please select a business");
      return;
    }

    const items = rows
      .filter((r) => r.productId && r.quantity && r.unitPrice)
      .map((r) => ({
        product_id: Number(r.productId),
        barcode: r.barcode || null,
        quantity: Number(r.quantity),
        cost_price: Number(r.unitPrice),
      }));

    if (items.length === 0) {
      setMessage("❌ At least one valid item is required");
      return;
    }

    try {
      await axiosWithAuth().post("/purchase/", {
        invoice_no: invoiceNo,
        vendor_id: vendorId ? Number(vendorId) : null,
        business_id: businessId || undefined,
        purchase_date: purchaseDate,
        items,
      });

      setMessage("✅ Purchase saved successfully");

      setRows([{ ...emptyRow }]);
      setVendorId("");
      setInvoiceNo("");
      setBusinessId("");
      setPurchaseDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      setMessage(err.response?.data?.detail || "❌ Failed to save purchase");
    }
  };

  const invoiceTotal = rows.reduce(
    (sum, r) => sum + (parseFloat(r.total) || 0),
    0
  );

  if (!visible) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else setVisible(false);
  };

  /* ===================== RENDER ===================== */
  return (
    <div className="create-purchase-container">
      <button className="close-btn" onClick={handleClose}>
        ✖
      </button>

      <h2>Add New Purchase</h2>
      {message && <p className="message">{message}</p>}

      <form onSubmit={handleSubmit} className="purchase-form">
        <div className="top-row">
          {/* Vendor */}
          <div className="form-group">
            <label>Vendor</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
            >
              <option value="">Select Vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.business_name || v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="form-group">
            <label>Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>

          {/* Invoice */}
          <div className="form-group">
            <label>Invoice Number</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              required
            />
          </div>

          {/* Business */}
          {isSuperAdmin && (
            <div className="form-group">
              <label>Business</label>
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                required
              >
                <option value="">Select Business</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ITEMS */}
        <div className="purchase-items-table">
          <div className="table-header">
            <span>Barcode</span>
            <span>Product</span>
            <span>Qty</span>
            <span>Unit Cost</span>
            <span>Total</span>
            <span>Action</span>
          </div>

          {rows.map((row, index) => (
            <div className="table-row" key={index}>
              {/* Barcode */}
              <input
                type="text"
                value={row.barcode}
                placeholder="Scan or enter barcode"
                onChange={(e) => {
                  const value = e.target.value;

                  handleRowChange(index, "barcode", value);

                  if (value.length >= 8) {
                    scanBarcode(index, value);
                  }
                }}
                onBlur={(e) => scanBarcode(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    scanBarcode(index, row.barcode);
                  }
                }}
              />

              {/* Product Search (FAST LOCAL) */}
              <div
                className="product-search-wrapper"
                onClick={(e) => e.stopPropagation()}  // 🔥 VERY IMPORTANT
              >

                <input
                  type="text"
                  value={
                    activeSearchRow === index
                      ? row.productQuery
                      : row.productQuery
                  }
                  placeholder="Search product..."
                  onFocus={() => {
                    setActiveSearchRow(index);
                    searchProducts(index, row.productQuery);
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleRowChange(index, "productQuery", value);
                    searchProducts(index, value);
                  }}
                />


                {activeSearchRow === index && row.products.length > 0 && (

                  <div className="product-search-dropdown">
                    {row.products.slice(0, 50).map((p) => (
                      <div
                        key={p.id}
                        className="product-search-item"
                        onClick={() => handleProductSelect(index, p)}
                      >
                        {p.barcode ? `[${p.barcode}] ` : ""}
                        {p.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>


              <input
                type="number"
                value={row.quantity}
                onChange={(e) =>
                  handleRowChange(index, "quantity", e.target.value)
                }
                required
              />

              <input
                type="text"
                value={formatNumber(row.unitPrice)}
                onChange={(e) =>
                  handleRowChange(index, "unitPrice", e.target.value)
                }
                required
              />

              <input
                type="text"
                value={formatNumber(row.total)}
                readOnly
              />

              <button
                type="button"
                className="remove-btn"
                onClick={() => removeRow(index)}
              >
                ✖
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="add-row-btn"
          onClick={addRow}
        >
          + Add Item
        </button>

        <div className="invoice-total">
          <strong>Total:</strong> {formatNumber(invoiceTotal)}
        </div>

        <button type="submit" className="submit-button">
          Add Purchase
        </button>
      </form>
    </div>
  );
};

export default CreatePurchase;
