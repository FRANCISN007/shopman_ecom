import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import "./DashboardPage.css";

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSubMenu, setActiveSubMenu] = useState(null); 

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};

  let roles = [];

  if (Array.isArray(storedUser.roles)) {
    roles = storedUser.roles;
  } else if (typeof storedUser.roles === "string") {
    roles = [storedUser.roles];
  } else if (typeof storedUser.role === "string") {
    roles = [storedUser.role];
  }

  roles = roles.map(r => r.toLowerCase());

  const isAdmin = roles.includes("admin");
  const isSuperAdmin = roles.includes("super_admin");

  // ✅ MATCH BACKEND
  const canImport = isAdmin || isSuperAdmin;


  /* ===============================
     MAIN MENU
  ================================ */
  const mainMenu = useMemo(
    () => [
      { label: "POS", icon: "🛒", path: "/dashboard/pos" },
      { label: "POS-Card", icon: "🛒", path: "/dashboard/pos-card" }, // <-- open full screen
      { label: "Sales", icon: "💰", submenu: true },
      { label: "Stock", icon: "📦", submenu: true },
      { label: "Purchase", icon: "🧾", submenu: true },
      { label: "Accounts", icon: "📈", submenu: true },
      { label: "Maintenance", icon: "🛠", action: "maintenance" },

      { label: "Export", icon: "📤", action: "export" },
      { label: "Print", icon: "🖨️", action: "print" },
      { label: "Exit", icon: "⎋", path: "/exit", danger: true },
    ],
    []
  );

  /* ===============================
     SUBMENUS
  ================================ */
  const salesSubMenu = [
    { label: "Sales Ledger", action: "listSales", icon: "📄" },
    { label: "Item Sold/Edit Sales", action: "itemsold", icon: "🧾" },
    { label: "Sales Analysis Report", action: "analysis", icon: "📊" },
    { label: "Staff Sales Report", action: "staff", icon: "👨‍💼" },
    { label: "Debtors Report", action: "debtor", icon: "⚠️" },
    { label: "Sales by Customer", action: "customer", icon: "👤" },
    { label: "Add Payment to Sales", action: "addpayment", icon: "💰" },
    { label: "List Sales Payment", action: "listpayment", icon: "🧾" },
    { label: "Price Update", action: "priceupdate", icon: "💲✏️" },
  ];

  const stockSubMenu = [
    { label: "Create Product", action: "create", icon: "➕" },
    { label: "List Product", action: "list", icon: "📋" },
    { label: "Import Product", action: "import", icon: "📥" },
    { label: "Stock Valuation", action: "inventory", icon: "📦" },
    { label: "Stock Adjustment", action: "adjustment", icon: "⚖️" },
    { label: "List Adjustment", action: "adjustmentlist", icon: "🧾" },
  ];

  const purchaseSubMenu = [
    { label: "Create Purchase", action: "create", icon: "➕" },
    { label: "List Purchase", action: "list", icon: "📋" },
    { label: "Create Vendor", action: "createvendor", icon: "➕" },
    { label: "List Vendor", action: "listvendor", icon: "🧾" },
  ];


  const accountsSubMenu = [
    { label: "Create Expenses", action: "create", icon: "➕" },
    { label: "List Expenses", action: "list", icon: "📋" },
    { label: "Create Revenue Item", action: "revenueitem", icon: "➕" },
    { label: "Profit and Loss", action: "profitloss", icon: "🧾" },
    { label: "Create Bank", action: "bankmanagement", icon: "🏦" },
    { label: "Backup", action: "backup", icon: "💾" },

  ];


  

  /* ===============================
     EXPORT TO EXCEL
  ================================ */
  const exportToExcel = useCallback(async () => {
    const table = document.querySelector(".content-area table");
    if (!table) return alert("No table found to export.");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");

    const headers = Array.from(table.querySelectorAll("thead th")).map(th =>
      th.innerText.trim()
    );
    sheet.addRow(headers).font = { bold: true };

    Array.from(table.querySelectorAll("tbody tr")).forEach(tr => {
      const row = Array.from(tr.querySelectorAll("td")).map(td => td.innerText.trim());
      sheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "export.xlsx");
  }, []);

  /* ===============================
     PRINT CONTENT
  ================================ */
  const printContent = useCallback(() => {
    const content = document.querySelector(".content-area");
    if (!content) return;

    const win = window.open("", "_blank");
    win.document.write("<html><head><title>Print</title></head><body>");
    win.document.write(content.innerHTML);
    win.document.write("</body></html>");
    win.document.close();
    win.print();
  }, []);

  /* ===============================
     MENU ACTION HANDLER
  ================================ */
  const handleMenuAction = useCallback(
    item => {
      // ALWAYS close any open submenu
      setActiveSubMenu(null);

      // Special actions
      if (item.action === "export") {
        exportToExcel();
        return;
      }

      if (item.action === "print") {
        printContent();
        return;
      }

      if (item.action === "maintenance") {
        navigate("/dashboard/users");
        return;
      }

      // Open POS in full screen
      if (item.label === "POS") {
        window.open(
          `${window.location.origin}/dashboard/pos`,
          "_blank",
          "noopener,noreferrer"
        );
        return;
      }

      if (item.label === "POS-Card") {
        window.open(
          `${window.location.origin}/dashboard/pos-card`,
          "_blank",
          "noopener,noreferrer"
        );
        return;
      }

      // Submenus
      if (item.submenu) {
        setActiveSubMenu(item.label);
        return;
      }

      // Normal navigation
      if (item.path) {
        navigate(item.path);
      }
    },
    [navigate, exportToExcel, printContent]
  );




  /* ===============================
     SUBMENU ACTIONS
  ================================ */


  


  const handleSalesAction = action => {
    switch (action) {
      case "listSales":
        navigate("/dashboard/sales/list");
        break;
      case "itemsold":
        navigate("/dashboard/sales/itemsold");
        break;
      case "analysis":
        navigate("/dashboard/sales/analysis");
        break;
      case "staff":
        navigate("/dashboard/sales/staff");
        break;
      case "debtor":
        navigate("/dashboard/sales/debtor");
        break;
      case "customer":
        navigate("/dashboard/sales/customer");
        break;
      case "addpayment":
        navigate("/dashboard/sales/addpayment");
        break;
      case "listpayment":
        navigate("/dashboard/sales/listpayment");
        break;
      case "priceupdate":
        navigate("/dashboard/sales/priceupdate");
        break;
      default:
        break;
    }
    setActiveSubMenu(null);
  };

  const handleStockAction = action => {
    if (action === "import" && !canImport) {

      alert("Access denied. Admin only.");
      return;
    }

    switch (action) {
      case "create":
        navigate("/dashboard/stock/create");
        break;
      case "list":
        navigate("/dashboard/stock/list");
        break;
      case "import":
        navigate("/dashboard/stock/import");
        break;
      case "inventory":
        navigate("/dashboard/stock/inventory");
        break;
      case "adjustment":
        navigate("/dashboard/stock/adjustment");
        break;
      case "adjustmentlist":
        navigate("/dashboard/stock/adjustmentlist");
        break;
      default:
        break;
    }
    setActiveSubMenu(null);
  };

  const handlePurchaseAction = action => {
    switch (action) {
      case "create":
        navigate("/dashboard/purchase/create");
        break;
      case "list":
        navigate("/dashboard/purchase/list");
        break;
      case "createvendor":
        navigate("/dashboard/purchase/createvendor");
        break;
      case "listvendor":
        navigate("/dashboard/purchase/listvendor");
        break;
      default:
        break;
    }
    setActiveSubMenu(null);
  };


const handleAccountsAction = action => {
    switch (action) {
      case "create":
        navigate("/dashboard/accounts/expenses/create");
        break;
      case "list":
        navigate("/dashboard/accounts/expenses/list");
        break;
      case "revenueitem":
        navigate("/dashboard/accounts/revenueitem");
        break;
      case "profitloss":
        navigate("/dashboard/accounts/profitloss");
        break;
      case "bankmanagement":
        navigate("/dashboard/accounts/bankmanagement");
        break;

      case "backup":
        navigate("/dashboard/accounts/backup");
        break;

      default:
        break;
    }
    setActiveSubMenu(null);
  };



  /* ===============================
     KEYBOARD NAVIGATION
  ================================ */
  useEffect(() => {
    const cols = 6;
    const handleKeyDown = e => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      if (location.pathname.startsWith("/dashboard/pos")) return;

      if (e.key === "ArrowRight") setActiveIndex(i => (i + 1) % mainMenu.length);
      else if (e.key === "ArrowLeft") setActiveIndex(i => (i === 0 ? mainMenu.length - 1 : i - 1));
      else if (e.key === "ArrowDown") setActiveIndex(i => Math.min(i + cols, mainMenu.length - 1));
      else if (e.key === "ArrowUp") setActiveIndex(i => Math.max(i - cols, 0));
      else if (e.key === "Enter") handleMenuAction(mainMenu[activeIndex]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, mainMenu, handleMenuAction, location.pathname]);

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="dashboard-container">
      {/* TOP MENU */}
      <div className="top-menu">
        {mainMenu.map((item, index) => (
          <div
            key={item.label}
            className={`menu-card ${index === activeIndex ? "active" : ""} ${item.danger ? "danger" : ""}`}
            onClick={() => handleMenuAction(item)}
          >
            <div className={`menu-icon ${item.label === "Exit" ? "exit-icon" : ""}`}>{item.icon}</div>
            <div className="menu-label">{item.label}</div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <section className="content-area">
          {activeSubMenu === "Sales" ? (
            <div className="submenu-frame center-frame sales-frame">
              <div className="submenu-header">
                <h2 className="submenu-heading">Sales Menu</h2>
                <button className="close-btn" onClick={() => setActiveSubMenu(null)}>✖</button>
              </div>
              <div className="sales-submenu grid-3x3">
                {salesSubMenu.map((sub, idx) => (
                  <div key={sub.label} className={`submenu-card card-${idx + 1}`} onClick={() => handleSalesAction(sub.action)}>
                    <div className="submenu-icon">{sub.icon}</div>
                    <div className="submenu-label">{sub.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeSubMenu === "Stock" ? (
            <div className="submenu-frame center-frame">
              <div className="submenu-header">
                <h2 className="submenu-heading">Stock Menu</h2>
                <button className="close-btn" onClick={() => setActiveSubMenu(null)}>✖</button>
              </div>
              <div className="sales-submenu grid-3x3">
                {stockSubMenu.map((sub, idx) => (
                  <div
                    key={sub.label}
                    className={`submenu-card card-${idx + 1} ${sub.action === "import" && !canImport ? "disabled-card" : ""}`}
                    onClick={() =>
                      !(sub.action === "import" && !canImport) &&
                      handleStockAction(sub.action)
                    }

                  >
                    <div className="submenu-icon">{sub.icon}</div>
                    <div className="submenu-label">{sub.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeSubMenu === "Purchase" ? (
              <div className="submenu-frame center-frame purchase-frame">
                <div className="submenu-header">
                  <h2 className="submenu-heading">Purchase Menu</h2>
                  <button className="close-btn" onClick={() => setActiveSubMenu(null)}>✖</button>
                </div>
                <div className="sales-submenu grid-2x2">
                  {purchaseSubMenu.map((sub, idx) => (
                    <div
                      key={sub.label}
                      className={`submenu-card card-${idx + 1}`}
                      onClick={() => handlePurchaseAction(sub.action)}
                    >
                      <div className="submenu-icon">{sub.icon}</div>
                      <div className="submenu-label">{sub.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeSubMenu === "Accounts" ? (
              <div className="submenu-frame center-frame accounts-frame">
                <div className="submenu-header">
                  <h2 className="submenu-heading">Accounts Menu</h2>
                  <button className="close-btn" onClick={() => setActiveSubMenu(null)}>✖</button>
                </div>
                <div className="sales-submenu gridA-2x3">
                  {accountsSubMenu.map((sub, idx) => (
                    <div
                      key={sub.label}
                      className={`submenu-card card-${idx + 1}`}
                      onClick={() => handleAccountsAction(sub.action)}
                    >
                      <div className="submenu-icon">{sub.icon}</div>
                      <div className="submenu-label">{sub.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )

            

            : (
            <Outlet />
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
