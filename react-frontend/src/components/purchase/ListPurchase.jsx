import React, { useEffect, useState, useCallback } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./ListPurchase.css";

const ListPurchase = () => {
  /* ================= STATE ================= */
  const [purchases, setPurchases] = useState([]);
  const [grossTotal, setGrossTotal] = useState(0); // ✅ NEW


  const [vendors, setVendors] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [show, setShow] = useState(true);

  /* ================= FILTER STATES ================= */
  const [invoiceNo, setInvoiceNo] = useState("");
  const [productId, setProductId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d) => d.toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(formatDate(firstDay));
  const [endDate, setEndDate] = useState(formatDate(today));

  /* ================= EDIT MODAL ================= */
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    invoice_no: "",
    items: [], // now multiple items
    vendor_id: "",
    business_id: "",
  });

  /* ================= ROLE ================= */
  const roles = JSON.parse(localStorage.getItem("user_roles") || "[]");
  const isSuperAdmin = roles.includes("super_admin");

  

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const init = async () => {
      try {
        const res = await axiosWithAuth().get("/users/me");

        const userBusiness = res.data?.business;

        if (!isSuperAdmin && userBusiness) {
          setSelectedBusinessId(userBusiness.id);
          setBusinesses([userBusiness]);
          return;
        }

        const bizRes = await axiosWithAuth().get("/business/simple");
        const data = Array.isArray(bizRes.data) ? bizRes.data : [];

        setBusinesses(data);

        if (data.length > 0 && !selectedBusinessId) {
          setSelectedBusinessId(data[0].id);
        }
      } catch (err) {
        console.error("Init failed", err);
      }
    };

    init();
  }, []);



  const fetchVendors = async () => {
    try {
      const res = await axiosWithAuth().get("/vendor/simple", {
        params: {
          business_id: selectedBusinessId || undefined,
        },
      });

      setVendors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch vendors", err);
      setVendors([]);
    }
  };



  const fetchProductsSimple = async () => {
    try {
      const res = await axiosWithAuth().get("/stock/products/simple", {
        params: {
          business_id: selectedBusinessId || undefined,
        },
      });

      setAllProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch products", err);
      setAllProducts([]);
    }
  };


  const fetchPurchases = useCallback(async () => {
    try {
      const params = {};
      if (invoiceNo) params.invoice_no = invoiceNo;
      if (productId) params.product_id = productId;
      if (vendorId) params.vendor_id = vendorId;
      if (selectedBusinessId) {
          params.business_id = selectedBusinessId;
        }

      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await axiosWithAuth().get("/purchase/", { params });

      // ✅ New response structure
      setPurchases(res.data.purchases || []);
      setGrossTotal(res.data.gross_total || 0);

    } catch (err) {
      console.error("Failed to fetch purchases", err);
      setPurchases([]);
      setGrossTotal(0);
    }
  }, [
    invoiceNo,
    productId,
    vendorId,
    selectedBusinessId,
    startDate,
    endDate,
    isSuperAdmin
  ]);


  /* ================= LOAD ON BUSINESS CHANGE ================= */
  useEffect(() => {
    if (selectedBusinessId) {
      fetchProductsSimple();
      fetchVendors();
    }
  }, [selectedBusinessId]);



  useEffect(() => {
    fetchPurchases();
  }, [
    invoiceNo,
    productId,
    vendorId,
    selectedBusinessId,
    startDate,
    endDate,
    isSuperAdmin
  ]);

  /* ================= FILTER ACTIONS ================= */
  const applyFilters = () => fetchPurchases();
  const resetFilters = () => {
    setInvoiceNo("");
    setVendorId("");
    setProductId("");
    setSelectedBusinessId(isSuperAdmin ? "" : businesses[0]?.id || "");
    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(today));
    fetchPurchases();
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this purchase?")) return;
    try {
      await axiosWithAuth().delete(`/purchase/${id}`);
      fetchPurchases();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  /* ================= EDIT ================= */
  const handleEditOpen = (purchase) => {
    setEditData({
      id: purchase.id,
      invoice_no: purchase.invoice_no,
      vendor_id: purchase.vendor_id || "",
      business_id: purchase.business_id || "",
      items: purchase.items.map((item) => ({
        id: item.id,   // IMPORTANT
        barcode: item.barcode,
        product_id: item.product_id,
        quantity: item.quantity,
        cost_price: item.cost_price,
      })),
    });

    setShowEdit(true);
  };


  const handleEditChange = (e, index) => {
    const { name, value } = e.target;
    const newItems = [...editData.items];
    newItems[index] = {
      ...newItems[index],
      [name]: name === "quantity" || name === "cost_price" ? Number(value) : value,
    };
    setEditData({ ...editData, items: newItems });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare payload strictly matching backend schema
      const payload = {
        invoice_no: editData.invoice_no,
        vendor_id: editData.vendor_id ? Number(editData.vendor_id) : null,
        items: editData.items.map((item) => ({
          id: item.id, // must send existing id
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          cost_price: Number(item.cost_price),
        })),
      };


    await axiosWithAuth().put(`/purchase/${editData.id}`, payload);

    setShowEdit(false);
    fetchPurchases();
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.detail || "Update failed");
  }
};


  if (!show) return null;

  return (
    <div className="list-sales-container">
      <button className="close-btn" onClick={() => setShow(false)}>✖</button>
      <h2 className="outstanding-sales-title">📦 Purchase List</h2>

      {/* ================= FILTER BAR ================= */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Invoice No..."
          value={invoiceNo}
          onChange={(e) => setInvoiceNo(e.target.value)}
        />

        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">All Products</option>
          {allProducts.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.business_name}</option>
          ))}
        </select>

        <select value={selectedBusinessId} onChange={(e) => setSelectedBusinessId(e.target.value)}>
          <option value="">{isSuperAdmin ? "All Businesses" : "Select Business"}</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <button onClick={applyFilters}>Apply</button>
        <button onClick={resetFilters}>Reset</button>
      </div>

      {/* ================= TABLE ================= */}
      <table className="sales-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Invoice</th>
            <th>Date</th>
            <th>Barcode</th>
            <th>Product</th>
            <th>Vendor</th>
            <th>Qty</th>
            <th>Cost</th>
            <th>Total</th>
            <th>Stock</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {purchases.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ textAlign: "center" }}>
                No purchases found.
              </td>
            </tr>
          ) : (
            <>
              {purchases.map((purchase) =>
                purchase.items.map((item) => (
                  <tr key={item.id}>
                    <td>{purchase.id}</td>

                    <td>{purchase.invoice_no}</td>

                    <td>
                      {purchase.purchase_date
                        ? new Date(purchase.purchase_date).toLocaleDateString()
                        : ""}
                    </td>
                    <td>{item.barcode || "-"}</td>
                    <td>{item.product_name || "-"}</td>
                    
                    <td>{purchase.vendor_name || "-"}</td>

                    <td>{item.quantity}</td>

                    <td>
                      ₦{Number(item.cost_price || 0).toLocaleString("en-NG")}
                    </td>

                    <td>
                      ₦{Number(item.total_cost || 0).toLocaleString("en-NG")}
                    </td>

                    <td>{item.current_stock ?? 0}</td>

                    <td>
                      <button onClick={() => handleEditOpen(purchase)}>
                        ✏️
                      </button>

                      <button onClick={() => handleDelete(purchase.id)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {/* ===== GRAND TOTAL ROW ===== */}
              <tr className="purchase-grand-total-row">
                <td colSpan="8" style={{ textAlign: "right", fontWeight: "bold" }}>
                   GROSS TOTAL:
                </td>
                <td style={{ fontWeight: "bold" }}>
                  ₦{Number(grossTotal || 0).toLocaleString("en-NG")}
                </td>
                <td colSpan="2"></td>
              </tr>

            </>
          )}
        </tbody>
      </table>


      {/* ================= EDIT MODAL ================= */}
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Purchase</h3>
            <form onSubmit={handleEditSubmit} className="edit-purchase-form">

              {/* Invoice Number */}
              <label>
                Invoice Number
                <input
                  type="text"
                  name="invoice_no"
                  value={editData.invoice_no}
                  onChange={(e) =>
                    setEditData({ ...editData, invoice_no: e.target.value })
                  }
                  required
                />
              </label>

              {/* Items */}
              {editData.items.map((item, index) => (
                <div key={index} className="edit-item-grid">
                  {/* Barcode (readonly) */}
                  <label>
                    Barcode
                    <input
                      type="text"
                      name="barcode"
                      value={item.barcode || ""}
                      readOnly
                      className="readonly-input"
                    />
                  </label>

                  {/* Product */}
                  <label>
                    Product
                    <select
                      name="product_id"
                      value={item.product_id}
                      onChange={(e) => handleEditChange(e, index)}
                      required
                    >
                      <option value="">-- Select Product --</option>
                      {allProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Quantity */}
                  <label>
                    Quantity
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleEditChange(e, index)}
                      required
                    />
                  </label>

                  {/* Cost Price */}
                  <label>
                    Cost Price
                    <input
                      type="number"
                      name="cost_price"
                      value={item.cost_price}
                      onChange={(e) => handleEditChange(e, index)}
                      required
                    />
                  </label>
                </div>
              ))}

              {/* Vendor */}
              <label>
                Vendor
                <select
                  name="vendor_id"
                  value={editData.vendor_id}
                  onChange={(e) =>
                    setEditData({ ...editData, vendor_id: e.target.value })
                  }
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.business_name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Business */}
              <label>
                Business
                <select
                  name="business_id"
                  value={editData.business_id}
                  onChange={(e) =>
                    setEditData({ ...editData, business_id: e.target.value })
                  }
                >
                  <option value="">-- Select Business --</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Actions */}
              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  Update
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ListPurchase;
