export const printA4Receipt = ({
  RECEIPT_NAME,
  BUSINESS_ADDRESS = "",
  BUSINESS_PHONE = "",
  BUSINESS_LOGO = "",

  invoice = "-",
  invoiceDate = "-",
  customerName = "-",
  customerPhone = "-",
  refNo = "-",
  paymentMethod = "-",
  amountPaid = 0,

  grossTotal = 0,
  totalDiscount = 0,
  netTotal = 0,
  balance = 0,
  items = [],
  amountInWords = "",
}) => {
  if (!RECEIPT_NAME) {
    alert("Business name missing. Cannot print receipt.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=900,height=700");

  const formatNumber = (num) =>
    `₦${Number(num || 0).toLocaleString("en-NG")}`;

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td>${item.product_name || ""}</td>
        <td style="text-align:center;">${item.quantity || 0}</td>
        <td style="text-align:right;">${formatNumber(item.selling_price)}</td>
        <td style="text-align:right;">${formatNumber(item.gross_amount)}</td>
        <td style="text-align:right;">${formatNumber(item.discount || 0)}</td>
        <td style="text-align:right;">${formatNumber(item.net_amount)}</td>
      </tr>
    `
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Sales Receipt</title>
        <style>
          @media print {
            body { margin: 0; }
          }

          body {
            font-family: Arial, sans-serif;
            font-size: 13px;
            padding: 20px;
            color: #000;
          }

          .header {
            text-align: center;
            margin-bottom: 10px;
          }

          .header h2 {
            margin: 0;
            text-transform: uppercase;
          }

          .logo img {
            max-width: 120px;
            max-height: 120px;
            margin-bottom: 5px;
          }

          hr {
            border: none;
            border-top: 1px solid #000;
            margin: 10px 0;
          }

          .info div {
            margin: 2px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th {
            border-bottom: 1px solid #000;
            padding: 6px 4px;
            text-align: left;
            font-size: 12px;
          }

          td {
            padding: 6px 4px;
            font-size: 12px;
          }

          .totals {
            margin-top: 10px;
            width: 300px;
            float: right;
          }

          .totals div {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }

          .bold {
            font-weight: bold;
          }

          .clear {
            clear: both;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
          }
        </style>
      </head>

      <body>

        <div class="header">
          ${
            BUSINESS_LOGO
              ? `<div class="logo"><img src="${BUSINESS_LOGO}" /></div>`
              : ""
          }
          <h2>${RECEIPT_NAME}</h2>
          ${BUSINESS_ADDRESS ? `<div>${BUSINESS_ADDRESS}</div>` : ""}
          ${BUSINESS_PHONE ? `<div>${BUSINESS_PHONE}</div>` : ""}
          <div><strong>SALES RECEIPT</strong></div>
        </div>

        <hr />

        <div class="info">
          <div><strong>Invoice:</strong> ${invoice}</div>
          <div><strong>Date:</strong> ${invoiceDate}</div>
          <div><strong>Customer:</strong> ${customerName}</div>
          <div><strong>Phone:</strong> ${customerPhone}</div>
          <div><strong>Ref No:</strong> ${refNo}</div>
          <div><strong>Payment:</strong> ${
            amountPaid > 0 && paymentMethod
              ? paymentMethod.toUpperCase()
              : "NOT PAID"
          }</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Gross</th>
              <th>Discount</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div><span>Gross Total:</span><span>${formatNumber(grossTotal)}</span></div>
          <div><span>Total Discount:</span><span>- ${formatNumber(totalDiscount)}</span></div>
          <div class="bold"><span>Net Total:</span><span>${formatNumber(netTotal)}</span></div>
          <div><span>Paid:</span><span>${formatNumber(amountPaid)}</span></div>
          <div class="bold"><span>Balance:</span><span>${formatNumber(balance)}</span></div>
        </div>

        <div class="clear"></div>

        <hr />

        <div>
          <strong>Amount in Words:</strong><br/>
          ${amountInWords}
        </div>

        <div class="footer">
          Thank you for your patronage
        </div>

      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};
