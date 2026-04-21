import React, { useEffect, useState, useCallback } from "react";
import axiosWithAuth from "../../utils/axiosWithAuth";
import "./ListInventory.css";

const ListInventory = ({ onClose }) => {
  const [inventory, setInventory] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchName, setSearchName] = useState(""); // search input
  const [visible, setVisible] = useState(true); // visibility fallback

  

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axiosWithAuth().get("/stock/inventory/", {
        params: {
          skip: 0,
          limit: 100,
          product_name: searchName.trim() || undefined,
        },
      });

      // Expecting response: { inventory: [...], grand_total: number }
      const data = res.data.inventory || [];
      setInventory(data);

      // set grand total from backend or calculate manually
      setGrandTotal(res.data.grand_total || data.reduce((sum, item) => sum + (item.inventory_value || 0), 0));

    } catch (err) {
      console.error(err);
      setError("Failed to load inventory list");
    } finally {
      setLoading(false);
    }
  }, [searchName]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleClose = () => {
    if (onClose) onClose();
    else setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="inventory-container">
      <button className="close-btn" onClick={handleClose}>✖</button>
      <h2 className="inventory-title">Inventory Valuation Report</h2>

      {loading && <div className="status-text">Loading inventory...</div>}
      {error && <div className="error-text">{error}</div>}

      <div className="inventory-filters">
        <label htmlFor="searchName">Search Product:</label>
        <input
          id="searchName"
          type="text"
          value={searchName}
          placeholder="Enter product name..."
          onChange={(e) => setSearchName(e.target.value)}
        />
        <button onClick={fetchInventory}>Search</button>
      </div>

      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Quantity Received</th>
              <th>Quantity Sold</th>
              <th>Adjustments</th>
              <th>Current Stock</th>
              <th>Latest Cost</th>
              <th>Inventory Value</th>
              <th>Created At</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 && !loading ? (
              <tr>
                <td colSpan="10" className="empty-row">No inventory records found</td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.product_name}</td>
                  <td>{item.quantity_in}</td>
                  <td>{item.quantity_out}</td>
                  <td>{item.adjustment_total}</td>
                  <td className={item.current_stock < 0 ? "negative-stock" : ""}>{item.current_stock}</td>
                  <td>
                    {Number(item.latest_cost).toLocaleString("en-NG", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>

                  <td>
                    {Number(item.inventory_value).toLocaleString("en-NG", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>

                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>{new Date(item.updated_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="grand-total-row">
              <td colSpan="7"><strong>Grand Total:</strong></td>
              <td colSpan="3">
                {Number(grandTotal).toLocaleString("en-NG", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </td>

            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ListInventory;
