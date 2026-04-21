import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axiosWithAuth from "../../utils/axiosWithAuth";

const POSReceipt = () => {
  const { invoice_no } = useParams();
  const location = useLocation();
  const isReprint = location.state?.reprint;

  const [sale, setSale] = useState(null);

  useEffect(() => {
    axiosWithAuth()
      .get(`/sales/receipt/${invoice_no}`)
      .then(res => setSale(res.data))
      .catch(err => {
        console.error(err);
        alert("Failed to load receipt");
      });
  }, [invoice_no]);

  useEffect(() => {
    if (sale && isReprint) {
      setTimeout(() => window.print(), 500);
    }
  }, [sale, isReprint]);

  if (!sale) return <p>Loading receipt...</p>;

  return (
    <div className="receipt-container">
      <h2>Sales Receipt</h2>

      <p><strong>Invoice No:</strong> {sale.invoice_no}</p>
      <p><strong>Date:</strong> {sale.invoice_date?.slice(0, 10)}</p>
      <p><strong>Customer:</strong> {sale.customer_name}</p>

      <hr />

      {sale.items.map(item => (
        <div key={item.id} className="receipt-item">
          <span>{item.product_id}</span>
          <span>{item.quantity} x {item.selling_price}</span>
          <span>{item.total_amount}</span>
        </div>
      ))}

      <hr />

      <p><strong>Total:</strong> {sale.total_amount}</p>
      <p><strong>Paid:</strong> {sale.total_paid}</p>
      <p><strong>Balance:</strong> {sale.balance_due}</p>
      <p><strong>Status:</strong> {sale.payment_status}</p>
    </div>
  );
};

export default POSReceipt;
