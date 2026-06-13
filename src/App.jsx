// Main Application Component with Routing
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SignupForm } from "./components/auth/SignupForm";
import { LoginForm } from "./components/auth/LoginForm";
import { StoreSelector } from "./components/shared/StoreSelector";
import { UnauthorizedScreen } from "./components/cashier/UnauthorizedScreen";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { CashierPOS } from "./components/cashier/CashierPOS";

export default function App() {
  return (
    // Wrapper para sa global auth state at active_store_id memory ng app
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/unauthorized" element={<UnauthorizedScreen />} />

          {/* Main Landing / Store Selection Route */}
          <Route path="/stores" element={<StoreSelector />} />

          {/* Role-Specific Protected Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/cashier/pos" element={<CashierPOS />} />

          {/* Default Route: Kapag walang match o hindi valid ang URL, ibabalik sa login sa pasimula */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
