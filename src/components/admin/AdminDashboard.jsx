import { useState, useEffect } from "react";
import { Navbar } from "../shared/Navbar";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getProductsByStore, addProduct } from "../../services/productService";

const MOCK_STAFF = [
  { name: "Maria Clara",    role: "Head Cashier",   email: "maria@store.com",  status: "Active"   },
  { name: "Juan Dela Cruz", role: "Junior Cashier", email: "juan@store.com",   status: "On Break" },
  { name: "Leonor Rivera",  role: "Staff",          email: "leonor@store.com", status: "Inactive" },
];

const isMockStore = (id) => id?.startsWith("store_00");

export const AdminDashboard = () => {
  const { activeStoreId } = useAuth();

  // ── Tab ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("inventory");

  // ── Inventory ─────────────────────────────────────────────────
  const [products,      setProducts]      = useState([]);
  const [loadingProds,  setLoadingProds]  = useState(true);
  const [isAddProdOpen, setIsAddProdOpen] = useState(false);
  const [prodError,     setProdError]     = useState("");
  const [prodSuccess,   setProdSuccess]   = useState("");
  const [savingProd,    setSavingProd]    = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "Soda" });

  const categories = ["Soda", "Bakery", "Chips", "Noodles", "Coffee", "Canned Goods", "Others"];

  // ── Staff ─────────────────────────────────────────────────────
  const [staffList,      setStaffList]      = useState([]);
  const [loadingStaff,   setLoadingStaff]   = useState(true);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffEmail,     setStaffEmail]     = useState("");
  const [staffRole,      setStaffRole]      = useState("Cashier");
  const [savingStaff,    setSavingStaff]    = useState(false);
  const [staffError,     setStaffError]     = useState("");
  const [staffSuccess,   setStaffSuccess]   = useState("");

  // ── Toast ─────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─────────────────────────────────────────────────────────────
  // Fetch products
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!activeStoreId) { setProducts([]); setLoadingProds(false); return; }
      try {
        setLoadingProds(true);
        const data = await getProductsByStore(activeStoreId);
        setProducts(data);
      } catch (err) {
        console.error("fetchProducts:", err);
      } finally {
        setLoadingProds(false);
      }
    };
    load();
  }, [activeStoreId]);

  // ─────────────────────────────────────────────────────────────
  // Fetch staff
  // ─────────────────────────────────────────────────────────────
  const fetchStaff = async () => {
    if (!activeStoreId) { setStaffList([]); setLoadingStaff(false); return; }

    if (isMockStore(activeStoreId)) {
      setStaffList(MOCK_STAFF);
      setLoadingStaff(false);
      return;
    }

    try {
      setLoadingStaff(true);
      const snap = await getDocs(
        query(collection(db, "store_staff"), where("store_id", "==", activeStoreId))
      );
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setStaffList(list);
    } catch (err) {
      console.error("fetchStaff:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => { fetchStaff(); }, [activeStoreId]);

  // ─────────────────────────────────────────────────────────────
  // Add Product
  // ─────────────────────────────────────────────────────────────
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setProdError(""); setProdSuccess("");

    if (!newProduct.name.trim()) { setProdError("Kinakailangan ang pangalan ng produkto."); return; }
    const price = parseFloat(newProduct.price);
    if (isNaN(price) || price <= 0) { setProdError("Maglagay ng valid na presyo (> 0)."); return; }
    const stock = parseInt(newProduct.stock, 10);
    if (isNaN(stock) || stock < 0) { setProdError("Maglagay ng valid na stock (>= 0)."); return; }

    try {
      setSavingProd(true);
      const created = await addProduct(
        { name: newProduct.name, price, stock, category: newProduct.category },
        activeStoreId
      );
      setProducts((prev) => [...prev, created]);
      setProdSuccess("Matagumpay na naidagdag ang produkto!");
      setNewProduct({ name: "", price: "", stock: "", category: "Soda" });
      setTimeout(() => { setIsAddProdOpen(false); setProdSuccess(""); }, 1000);
    } catch (err) {
      console.error("addProduct:", err);
      setProdError(err.message || "May naganap na error.");
    } finally {
      setSavingProd(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Add Staff
  // ─────────────────────────────────────────────────────────────
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffError(""); setStaffSuccess("");

    if (!staffEmail.trim()) { setStaffError("Kinakailangan ang email ng staff."); return; }

    // Mock store – optimistic local append only
    if (isMockStore(activeStoreId)) {
      setStaffList((prev) => [
        ...prev,
        { name: staffEmail.split("@")[0].toUpperCase(), role: staffRole, email: staffEmail, status: "Active" },
      ]);
      showToast("Naidagdag ang staff (Mock Mode)!");
      setIsAddStaffOpen(false);
      setStaffEmail("");
      return;
    }

    try {
      setSavingStaff(true);

      // 1. Find the user by email in the `users` collection
      const userSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", staffEmail.trim()))
      );

      if (userSnap.empty) {
        setStaffError(
          "Hindi nahanap ang email na ito. Siguraduhing nakarehistro na sila bilang Staff sa signup."
        );
        return;
      }

      let foundUser = null;
      userSnap.forEach((d) => { foundUser = { uid: d.id, ...d.data() }; });

      if (foundUser.global_role !== "staff") {
        setStaffError(
          "Ang account na ito ay hindi Staff — baka Manager ang role nila. Hindi pwedeng idagdag bilang cashier."
        );
        return;
      }

      // 2. Check duplicate assignment
      const dupeSnap = await getDocs(
        query(
          collection(db, "store_staff"),
          where("store_id",   "==", activeStoreId),
          where("cashier_id", "==", foundUser.uid)
        )
      );
      if (!dupeSnap.empty) {
        setStaffError("Ang staff na ito ay nakatalaga na sa tindahang ito.");
        return;
      }

      // 3. Create store_staff document
      const docRef = await addDoc(collection(db, "store_staff"), {
        store_id:   activeStoreId,
        cashier_id: foundUser.uid,
        name:       foundUser.name  ?? staffEmail,
        email:      foundUser.email ?? staffEmail,
        role:       staffRole,
        status:     "Active",
        created_at: serverTimestamp(),
      });

      // Optimistic update
      setStaffList((prev) => [
        ...prev,
        { id: docRef.id, store_id: activeStoreId, cashier_id: foundUser.uid,
          name: foundUser.name ?? staffEmail, email: foundUser.email ?? staffEmail,
          role: staffRole, status: "Active" },
      ]);

      showToast(`Matagumpay na naidagdag si ${foundUser.name ?? staffEmail} bilang ${staffRole}!`);
      setIsAddStaffOpen(false);
      setStaffEmail("");
      setStaffRole("Cashier");
    } catch (err) {
      console.error("addStaff:", err);
      setStaffError("May naganap na error. Subukan muli.");
    } finally {
      setSavingStaff(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Quick stats derived from live data
  // ─────────────────────────────────────────────────────────────
  const lowStockCount   = products.filter((p) => p.stock <= 10).length;
  const activeStaffCount = staffList.filter((s) => s.status === "Active").length;

  const stats = [
    {
      name: "Mga Produkto",
      value: `${products.length} items`,
      sub: `${lowStockCount} kailangang i-restock`,
      colorClass: "text-[#F97316] bg-[#F97316]/10",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: "Staff sa Branch",
      value: `${staffList.length} katao`,
      sub: `${activeStaffCount} aktibo ngayon`,
      colorClass: "text-[#57534E] bg-[#57534E]/10",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      name: "Store ID",
      value: activeStoreId ? activeStoreId.slice(0, 12) + "…" : "—",
      sub: isMockStore(activeStoreId) ? "Demo / Mock store" : "Live Firestore store",
      colorClass: "text-[#064E3B] bg-[#064E3B]/10",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
  ];

  const tabs = [
    {
      key: "inventory",
      label: "Imbentaryo",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      key: "staff",
      label: "Staff",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#064E3B] tracking-tight">
              Admin &amp; Manager Operations
            </h1>
            <p className="text-sm text-[#57534E] mt-1">
              Pamahalaan ang inventory at cashier staff ng iyong aktibong tindahan.
            </p>
          </div>
          {activeStoreId && (
            <div className="flex items-center gap-2 bg-[#064E3B]/10 text-[#064E3B] border border-[#064E3B]/20 px-4 py-2.5 rounded-xl text-xs font-mono font-bold self-start shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] animate-ping" />
              {activeStoreId}
              {isMockStore(activeStoreId) && (
                <span className="ml-1 bg-[#57534E]/20 text-[#57534E] px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
                  Mock
                </span>
              )}
            </div>
          )}
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm hover:scale-[1.01] transition-transform duration-200">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${stat.colorClass}`}>
                {stat.icon}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#57534E]">{stat.name}</p>
              <h3 className="text-2xl font-extrabold text-[#0C0A09] mt-1 mb-1">{stat.value}</h3>
              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${stat.colorClass}`}>
                {stat.sub}
              </span>
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div className="bg-white rounded-2xl border border-[#57534E]/15 shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-[#57534E]/10 bg-[#FAFAF9]/60 px-4 pt-3 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                id={`admin-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all duration-200 cursor-pointer border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "border-[#064E3B] text-[#064E3B] bg-white"
                    : "border-transparent text-[#57534E]/70 hover:text-[#57534E] hover:bg-white/60"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.key === "staff" && staffList.length > 0 && (
                  <span className="ml-1 bg-[#064E3B] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                    {staffList.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── INVENTORY TAB ── */}
          {activeTab === "inventory" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#064E3B]">Pamamahala ng Imbentaryo</h3>
                  <p className="text-xs text-[#57534E] mt-0.5">Mga produkto ng iyong tindahan sa database</p>
                </div>
                {activeStoreId ? (
                  <button
                    id="admin-add-product-btn"
                    onClick={() => { setIsAddProdOpen(true); setProdError(""); setProdSuccess(""); }}
                    className="px-3.5 py-2 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Bagong Produkto
                  </button>
                ) : (
                  <span className="text-[10px] text-[#F97316] font-bold uppercase tracking-wider bg-[#F97316]/10 px-2 py-1 rounded-lg">
                    Pumili ng Tindahan
                  </span>
                )}
              </div>

              {loadingProds ? (
                <div className="flex justify-center items-center py-14">
                  <svg className="animate-spin h-7 w-7 text-[#064E3B]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 bg-[#FAFAF9] rounded-xl border border-dashed border-[#57534E]/20 text-[#57534E] text-xs font-semibold">
                  Walang produkto. Gamitin ang "Bagong Produkto" para magdagdag.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#57534E]/10 text-[#57534E] uppercase text-[10px] tracking-wider">
                        <th className="pb-3 font-bold">Pangalan</th>
                        <th className="pb-3 font-bold">Kategorya</th>
                        <th className="pb-3 font-bold">Presyo</th>
                        <th className="pb-3 font-bold text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#57534E]/5">
                      {products.map((p) => {
                        const isOut = p.stock <= 0;
                        const isLow = p.stock > 0 && p.stock <= 10;
                        return (
                          <tr key={p.id} className="hover:bg-[#FAFAF9]/50 transition-colors">
                            <td className="py-3.5 font-bold text-[#0C0A09]">{p.name}</td>
                            <td className="py-3.5 text-[#57534E] font-medium">{p.category}</td>
                            <td className="py-3.5 text-[#064E3B] font-extrabold font-mono">₱{p.price?.toFixed(2)}</td>
                            <td className="py-3.5 text-right">
                              {isOut ? (
                                <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-rose-500/10 text-rose-700">
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-500/10 text-amber-700">
                                  Mababa ({p.stock})
                                </span>
                              ) : (
                                <span className="text-[#57534E]">{p.stock} units</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── STAFF TAB ── */}
          {activeTab === "staff" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#064E3B]">Pamamahala ng mga Staff</h3>
                  <p className="text-xs text-[#57534E] mt-0.5">
                    Mga cashier na pinayagang mag-access sa branch na ito
                  </p>
                </div>
                <button
                  id="admin-add-staff-btn"
                  onClick={() => { setIsAddStaffOpen(true); setStaffError(""); setStaffSuccess(""); }}
                  className="px-3.5 py-2 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Bagong Staff
                </button>
              </div>

              {loadingStaff ? (
                <div className="flex justify-center items-center py-14">
                  <svg className="animate-spin h-7 w-7 text-[#064E3B]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : staffList.length === 0 ? (
                <div className="text-center py-16 bg-[#FAFAF9] rounded-xl border border-dashed border-[#57534E]/20 flex flex-col items-center gap-3 p-8">
                  <svg className="w-10 h-10 text-[#57534E]/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-xs font-bold text-[#57534E]">Walang nakatalagang staff.</p>
                  <p className="text-[11px] text-[#57534E]/60">I-click ang "Bagong Staff" para magdagdag ng cashier sa branch na ito.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#57534E]/10 text-[#57534E] uppercase text-[10px] tracking-wider">
                        <th className="pb-3 font-bold">Pangalan</th>
                        <th className="pb-3 font-bold">Role</th>
                        <th className="pb-3 font-bold">Email</th>
                        <th className="pb-3 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#57534E]/5">
                      {staffList.map((staff, i) => (
                        <tr key={staff.id ?? i} className="hover:bg-[#FAFAF9]/50 transition-colors">
                          <td className="py-3.5 font-bold text-[#0C0A09]">{staff.name}</td>
                          <td className="py-3.5 text-[#57534E] font-semibold">{staff.role}</td>
                          <td className="py-3.5 text-[#57534E] font-mono text-[11px]">{staff.email}</td>
                          <td className="py-3.5 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              staff.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : staff.status === "On Break"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-stone-50 text-stone-600 border border-stone-200"
                            }`}>
                              {staff.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Modal: Add Product ── */}
      {isAddProdOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-[#57534E]/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#064E3B]">Magdagdag ng Produkto</h2>
              <button onClick={() => setIsAddProdOpen(false)} className="p-1.5 rounded-lg hover:bg-[#57534E]/10 transition text-[#57534E]/70 cursor-pointer">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {prodError   && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs mb-4">{prodError}</div>}
            {prodSuccess && <div className="bg-emerald-50 border border-emerald-100 text-[#064E3B] p-3 rounded-xl text-xs mb-4">{prodSuccess}</div>}

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">Pangalan ng Produkto</label>
                <input type="text" required placeholder="Hal. Coca-Cola 1.5L"
                  className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm"
                  value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">Kategorya</label>
                <select className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl bg-white focus:outline-none focus:border-[#064E3B] text-sm"
                  value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">Presyo (₱)</label>
                  <input type="number" step="0.01" required placeholder="0.00"
                    className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm"
                    value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">Dami (Stock)</label>
                  <input type="number" required placeholder="0"
                    className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm"
                    value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#57534E]/10">
                <button type="button" onClick={() => setIsAddProdOpen(false)}
                  className="flex-1 py-3 border border-[#57534E]/20 rounded-xl text-xs font-bold text-[#57534E] hover:bg-[#57534E]/5 transition cursor-pointer">
                  Kanselahin
                </button>
                <button type="submit" disabled={savingProd}
                  className="flex-1 py-3 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white rounded-xl text-xs font-bold transition flex justify-center items-center gap-1.5 disabled:opacity-75 cursor-pointer">
                  {savingProd ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Naililikha...
                    </>
                  ) : "Likhain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Staff ── */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-[#57534E]/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#064E3B]">Magdagdag ng Staff / Cashier</h2>
              <button onClick={() => { setIsAddStaffOpen(false); setStaffEmail(""); setStaffError(""); }}
                className="p-1.5 rounded-lg hover:bg-[#57534E]/10 transition text-[#57534E]/70 cursor-pointer">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {staffError   && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs mb-4 leading-relaxed">{staffError}</div>}
            {staffSuccess && <div className="bg-emerald-50 border border-emerald-100 text-[#064E3B] p-3 rounded-xl text-xs mb-4">{staffSuccess}</div>}

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">
                  Email ng Staff
                </label>
                <input type="email" required placeholder="Hal. cashier@email.com"
                  className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm"
                  value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
                <p className="text-[10px] text-[#57534E]/60 mt-1.5 leading-relaxed">
                  Dapat nakarehistro na ang email bilang <strong>Cashier / Staff</strong> sa signup page.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">
                  Role sa Tindahan
                </label>
                <select className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl bg-white focus:outline-none focus:border-[#064E3B] text-sm"
                  value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                  <option value="Cashier">Cashier</option>
                  <option value="Head Cashier">Head Cashier</option>
                  <option value="Staff">General Staff</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#57534E]/10">
                <button type="button" onClick={() => { setIsAddStaffOpen(false); setStaffEmail(""); setStaffError(""); }}
                  className="flex-1 py-3 border border-[#57534E]/20 rounded-xl text-xs font-bold text-[#57534E] hover:bg-[#57534E]/5 transition cursor-pointer">
                  Kanselahin
                </button>
                <button type="submit" disabled={savingStaff}
                  className="flex-1 py-3 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white rounded-xl text-xs font-bold transition flex justify-center items-center gap-1.5 disabled:opacity-75 cursor-pointer">
                  {savingStaff ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Idinaragdag...
                    </>
                  ) : "Idagdag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 border max-w-sm ${
          toast.type === "error"
            ? "bg-rose-50 text-rose-800 border-rose-200"
            : "bg-emerald-50 text-emerald-800 border-emerald-200"
        }`}>
          {toast.type === "error" ? (
            <div className="bg-rose-100 p-1.5 rounded-lg flex-shrink-0">
              <svg className="h-4 w-4 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="bg-emerald-100 p-1.5 rounded-lg flex-shrink-0">
              <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
