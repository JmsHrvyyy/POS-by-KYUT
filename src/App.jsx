// Main Application Component with Routing
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SignupForm } from "./components/SignupForm";

// Mock components para hindi mag-error ang router habang dine-develop ang mga screens
const LoginPlaceholder = () => (
  <div className="p-6 text-center font-sans text-[#0C0A09]">
    Login Screen Placeholder
  </div>
);
const UnauthorizedScreen = () => (
  <div className="p-6 text-center font-sans text-[#F97316] font-bold">
    Account Pending: Awaiting Invitation or Access Restriction
  </div>
);
const StoreSelectorGrid = () => (
  <div className="p-6 text-center font-sans text-[#064E3B] font-bold">
    Store Selector Grid (Mock Data)
  </div>
);
const AdminDashboard = () => (
  <div className="p-6 text-center font-sans text-[#064E3B]">
    Admin/Manager Operations Dashboard
  </div>
);
const CashierPOS = () => (
  <div className="p-6 text-center font-sans text-[#064E3B]">
    Cashier POS Operations Screen
  </div>
);

export default function App() {
  return (
    // Wrapper para sa global auth state ng app
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPlaceholder />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/unauthorized" element={<UnauthorizedScreen />} />

          {/* Main Landing / Store Selection Route */}
          <Route path="/stores" element={<StoreSelectorGrid />} />

          {/* Role-Specific Protected Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/cashier/pos" element={<CashierPOS />} />

          {/* Default Route: Kapag walang match, ibabalik sa login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
