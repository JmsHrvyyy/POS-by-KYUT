// Main Application Component with Routing
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SignupForm } from "./components/SignupForm";

// 1. I-import ang mga bagong likhang UI components (Frontend Checklist #1, #2, #3)
import { LoginForm } from "./components/LoginForm";
import { StoreSelector } from "./components/StoreSelector";

// Mock components para sa mga natitirang protektadong screens ng Sprint 1
const UnauthorizedScreen = () => (
  <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6 text-center font-sans">
    <div className="bg-white p-6 rounded-xl shadow-md border border-[#57534E]/10 max-w-sm">
      <h2 className="text-xl font-bold text-[#F97316] mb-2">Access Pending</h2>
      <p className="text-sm text-[#57534E]">
        Account Pending: Awaiting Invitation or Access Restriction. Mangyaring
        mag-antay ng imbitasyon mula sa iyong Manager.
      </p>
    </div>
  </div>
);

const AdminDashboard = () => (
  <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09]">
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#064E3B] mb-2">
        Admin/Manager Operations Dashboard
      </h1>
      <p className="text-sm text-[#57534E]">
        Dito ilalagay ang Inventory CRUD at Analytics sa mga susunod na Sprint.
      </p>
    </div>
  </div>
);

const CashierPOS = () => (
  <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09]">
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#064E3B] mb-2">
        Cashier POS Operations Screen
      </h1>
      <p className="text-sm text-[#57534E]">
        Dito ilalagay ang Cart Processing at Camera Barcode Scanning sa susunod
        na hakbang.
      </p>
    </div>
  </div>
);

export default function App() {
  return (
    // Wrapper para sa global auth state at active_store_id memory ng app
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes - Pinalitan natin ang mga luma mong Placeholder ng Actual Forms */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/unauthorized" element={<UnauthorizedScreen />} />

          {/* Main Landing / Store Selection Route - Ipinasok ang ating Responsive Selector View */}
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
