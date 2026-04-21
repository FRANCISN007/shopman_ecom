import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ================= GUARDS =================
import RequireAuth from "./components/guards/RequireAuth";

// ================= PUBLIC =================
import HomePage from "./pages/HomePage";
import LoginPage from "./modules/auth/LoginPage";
import RegisterPage from "./modules/auth/RegisterPage";

// ================= CORE =================
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";

// ================= SALES =================
import ListSales from "./components/sales/ListSales";
import SalesItemSold from "./components/sales/SalesItemSold";
import SalesAnalysis from "./components/sales/SalesAnalysis";
import StaffSalesReport from "./components/sales/StaffSalesReport";
import DebtorSalesReport from "./components/sales/DebtorSalesReport";
import SalesByCustomer from "./components/sales/SalesByCustomer";
import AddPayment from "./components/sales/AddPayment";
import ListSalesPayment from "./components/sales/ListSalesPayment";
import PriceUpdate from "./components/sales/PriceUpdate";

// ================= STOCK =================
import CreateProduct from "./components/stock/CreateProduct";
import ListProduct from "./components/stock/ListProduct";
import ImportProduct from "./components/stock/ImportProduct";
import ListInventory from "./components/stock/ListInventory";
import StockAdjustment from "./components/stock/StockAdjustment";
import ListAdjustment from "./components/stock/ListAdjustment";

// ================= PURCHASE =================
import CreatePurchase from "./components/purchase/CreatePurchase";
import ListPurchase from "./components/purchase/ListPurchase";
import CreateVendor from "./components/purchase/CreateVendor";
import ListVendor from "./components/purchase/ListVendor";

// ================= ACCOUNTS =================
import CreateExpenses from "./components/accounts/CreateExpenses";
import ListExpenses from "./components/accounts/ListExpenses";
import RevenueItem from "./components/accounts/RevenueItem";
import ProfitLoss from "./components/accounts/ProfitLoss";
import CreateBank from "./components/accounts/CreateBank";
import Backup from "./components/accounts/Backup";

// ================= USERS / MAINTENANCE =================
import UserManagement from "./modules/users/UserManagement";

// ================= POS =================
import PosSales from "./components/pos/PosSales";
import POSCardPage from "./components/pos/POSCardPage";

const App = () => {
  return (
    <Router>
      <Routes>

        {/* 🌍 PUBLIC ROUTES - no license check anymore */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 🔐 AUTH PROTECTED ROUTES */}
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />}>

            {/* Dashboard default / home */}
            <Route index element={<UsersPage />} />

            {/* POS */}
            <Route path="pos" element={<PosSales />} />
            <Route path="pos-card" element={<POSCardPage />} />

            {/* SALES */}
            <Route path="sales">
              <Route path="list" element={<ListSales />} />
              <Route path="itemsold" element={<SalesItemSold />} />
              <Route path="analysis" element={<SalesAnalysis />} />
              <Route path="staff" element={<StaffSalesReport />} />
              <Route path="debtor" element={<DebtorSalesReport />} />
              <Route path="customer" element={<SalesByCustomer />} />
              <Route path="addpayment" element={<AddPayment />} />
              <Route path="listpayment" element={<ListSalesPayment />} />
              <Route path="priceupdate" element={<PriceUpdate />} />
            </Route>

            {/* STOCK */}
            <Route path="stock">
              <Route path="create" element={<CreateProduct />} />
              <Route path="list" element={<ListProduct />} />
              <Route path="import" element={<ImportProduct />} />
              <Route path="inventory" element={<ListInventory />} />
              <Route path="adjustment" element={<StockAdjustment />} />
              <Route path="adjustmentlist" element={<ListAdjustment />} />
            </Route>

            {/* PURCHASE */}
            <Route path="purchase">
              <Route path="create" element={<CreatePurchase />} />
              <Route path="list" element={<ListPurchase />} />
              <Route path="createvendor" element={<CreateVendor />} />
              <Route path="listvendor" element={<ListVendor />} />
            </Route>

            {/* ACCOUNTS */}
            <Route path="accounts">
              <Route path="expenses/create" element={<CreateExpenses />} />
              <Route path="expenses/list" element={<ListExpenses />} />
              <Route path="revenueitem" element={<RevenueItem />} />
              <Route path="profitloss" element={<ProfitLoss />} />
              <Route path="bankmanagement" element={<CreateBank />} />
              <Route path="backup" element={<Backup />} />
            </Route>

            {/* MAINTENANCE / USERS */}
            <Route path="users" element={<UserManagement />} />

            {/* ───────────────────────────────────────────────
                Future super-admin / maintenance-only routes
                We will add these later when we restructure
                Maintenance submenu for superadmin
            ─────────────────────────────────────────────── */}
            {/* 
            <Route path="maintenance">
              <Route path="license" element={<LicensePage />} />           ← planned
              <Route path="system-settings" element={<SystemSettings />} /> ← future
              <Route path="audit-logs" element={<AuditLogs />} />          ← future
            </Route>
            */}

          </Route>
        </Route>

        {/* 🚨 FALLBACK - redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
};

export default App;