import { useState, useEffect } from "react";
import { Navbar } from "../shared/Navbar";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

// Mock fallback data para sa Mock Stores
const MOCK_STORES_DATA = [
  { id: "store_001", name: "KYUT Sari-Sari Store", industry_type: "Retail",    address: "Meycauayan, Bulacan" },
  { id: "store_002", name: "KYUT Mini Cafe",        industry_type: "Food",      address: "Marilao, Bulacan"   },
  { id: "store_003", name: "KYUT Tech Services",    industry_type: "Services",  address: "Valenzuela City"    },
];

const MOCK_STAFF = [
  { name: "Maria Clara",    role: "Head Cashier",    email: "maria@store.com",  status: "Active"   },
  { name: "Juan Dela Cruz", role: "Junior Cashier",  email: "juan@store.com",   status: "On Break" },
  { name: "Leonor Rivera",  role: "Staff",           email: "leonor@store.com", status: "Inactive" },
];

export const AdminDashboard = () => {
  const { activeStoreId } = useAuth();

  // ── Loading / Error ───────────────────────────────────────────
  const [loading,       setLoading]       = useState(true);
  const [updatingStore, setUpdatingStore] = useState(false);
  const [addingStaff,   setAddingStaff]   = useState(false);

  // ── Notification Toast ────────────────────────────────────────
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Dashboard data ────────────────────────────────────────────
  const [stats,     setStats]     = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isMock,    setIsMock]    = useState(false);

  // ── Store settings form ───────────────────────────────────────
  const [editName,     setEditName]     = useState("");
  const [editIndustry, setEditIndustry] = useState("Retail");
  const [editAddress,  setEditAddress]  = useState("");

  // ── Add-staff modal ───────────────────────────────────────────
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffEmail,       setStaffEmail]       = useState("");
  const [staffRole,        setStaffRole]        = useState("Cashier");

  // ─────────────────────────────────────────────────────────────
  // fetchDashboardData — called on mount and after mutations
  // ─────────────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    if (!activeStoreId) { setLoading(false); return; }
    setLoading(true);

    try {
      const mock = activeStoreId.startsWith("store_00");
      setIsMock(mock);

      // ── 1. Store info ────────────────────────────────────────
      if (mock) {
        const m = MOCK_STORES_DATA.find(s => s.id === activeStoreId) ?? MOCK_STORES_DATA[0];
        setEditName(m.name);
        setEditIndustry(m.industry_type);
        setEditAddress(m.address);
      } else {
        const snap = await getDoc(doc(db, "stores", activeStoreId));
        if (snap.exists()) {
          const d = snap.data();
          setEditName(d.name ?? "");
          setEditIndustry(d.industry_type ?? "Retail");
          setEditAddress(d.address ?? "");
        }
      }

      // ── 2. Sales (orders) ────────────────────────────────────
      let salesToday = 0, salesYesterday = 0, txToday = 0;

      if (mock) {
        salesToday     = 12_450;
        salesYesterday = 10_800;
        txToday        = 15;
      } else {
        const todayStart     = new Date(); todayStart.setHours(0,0,0,0);
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        const snap = await getDocs(
          query(collection(db, "orders"), where("store_id", "==", activeStoreId))
        );
        snap.forEach(d => {
          const o  = d.data();
          const ts = o.created_at?.toDate?.() ?? null;
          if (!ts) return;
          if (ts >= todayStart)     { salesToday     += o.total ?? 0; txToday++; }
          else if (ts >= yesterdayStart) { salesYesterday += o.total ?? 0; }
        });
      }

      const growthText = salesYesterday === 0
        ? (txToday > 0 ? "+100% kumpara kahapon" : "Walang benta kahapon")
        : (() => {
            const g = ((salesToday - salesYesterday) / salesYesterday) * 100;
            return `${g >= 0 ? "+" : ""}${g.toFixed(1)}% kumpara kahapon`;
          })();

      // ── 3. Staff ─────────────────────────────────────────────
      let fetchedStaff = [];
      let activeCount  = 0, breakCount = 0;

      if (mock) {
        fetchedStaff = [...MOCK_STAFF];
        activeCount  = 1; breakCount = 1;
      } else {
        const snap = await getDocs(
          query(collection(db, "store_staff"), where("store_id", "==", activeStoreId))
        );
        snap.forEach(d => {
          const s = { id: d.id, ...d.data() };
          fetchedStaff.push(s);
          if (s.status === "Active")   activeCount++;
          if (s.status === "On Break") breakCount++;
        });
      }
      setStaffList(fetchedStaff);

      // ── 4. Inventory (products) ──────────────────────────────
      let productCount = 0, lowStockCount = 0;

      if (mock) {
        productCount  = 142;
        lowStockCount = 12;
      } else {
        const snap = await getDocs(
          query(collection(db, "products"), where("store_id", "==", activeStoreId))
        );
        snap.forEach(d => {
          productCount++;
          if ((d.data().stock ?? 0) <= 10) lowStockCount++;
        });
      }

      // ── 5. Assemble stats ────────────────────────────────────
      setStats([
        {
          name: "Kabuuang Benta ngayon",
          value: `₱${salesToday.toLocaleString("fil-PH", { minimumFractionDigits: 2 })}`,
          change: growthText,
          colorClass: "text-[#064E3B] bg-[#064E3B]/10",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          name: "Mga Cashier na Aktibo",
          value: `${activeCount}`,
          change: `${breakCount} naka-break`,
          colorClass: "text-[#57534E] bg-[#57534E]/10",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          name: "Imbentaryo (Items)",
          value: `${productCount} items`,
          change: `${lowStockCount} kailangang i-restock`,
          colorClass: "text-[#F97316] bg-[#F97316]/10",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
      ]);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      showNotification("Hindi ma-load ang dashboard data. Subukan muli.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [activeStoreId]);

  // ─────────────────────────────────────────────────────────────
  // Add Staff handler
  // ─────────────────────────────────────────────────────────────
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!staffEmail.trim()) {
      showNotification("Mangyaring ilagay ang email ng staff.", "error");
      return;
    }

    // Mock store: optimistic local append
    if (isMock) {
      setStaffList(prev => [...prev, {
        name:   staffEmail.split("@")[0].toUpperCase(),
        role:   staffRole,
        email:  staffEmail,
        status: "Active",
      }]);
      setIsStaffModalOpen(false);
      setStaffEmail("");
      showNotification("Naidagdag ang staff (Mock Store Mode)!", "success");
      return;
    }

    try {
      setAddingStaff(true);

      // 1. Look up the user by email
      const userSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", staffEmail.trim()))
      );
      if (userSnap.empty) {
        showNotification(
          "Hindi nahanap ang email na ito. Siguraduhing nakarehistro na sila bilang Staff sa signup.",
          "error"
        );
        return;
      }

      let foundUser = null;
      userSnap.forEach(d => { foundUser = { uid: d.id, ...d.data() }; });

      if (foundUser.global_role !== "staff") {
        showNotification(
          "Ang account na ito ay may role na Manager. Hindi pwedeng idagdag bilang Staff.",
          "error"
        );
        return;
      }

      // 2. Check for duplicate assignment
      const dupeSnap = await getDocs(
        query(
          collection(db, "store_staff"),
          where("store_id",   "==", activeStoreId),
          where("cashier_id", "==", foundUser.uid)
        )
      );
      if (!dupeSnap.empty) {
        showNotification("Ang staff na ito ay nakatalaga na sa tindahang ito.", "error");
        return;
      }

      // 3. Create the store_staff document
      await addDoc(collection(db, "store_staff"), {
        store_id:   activeStoreId,
        cashier_id: foundUser.uid,
        name:       foundUser.name  ?? staffEmail,
        email:      foundUser.email ?? staffEmail,
        role:       staffRole,
        status:     "Active",
        created_at: serverTimestamp(),
      });

      showNotification(`Matagumpay na naidagdag si ${foundUser.name ?? staffEmail} bilang ${staffRole}!`, "success");
      setIsStaffModalOpen(false);
      setStaffEmail("");
      await fetchDashboardData();
    } catch (err) {
      console.error("Add staff error:", err);
      showNotification("May naganap na error habang nagdaragdag ng staff.", "error");
    } finally {
      setAddingStaff(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Update Store Settings handler
  // ─────────────────────────────────────────────────────────────
  const handleUpdateStore = async (e) => {
    e.preventDefault();
    if (!editName.trim())    { showNotification("Kinakailangan ang pangalan ng branch.", "error"); return; }
    if (!editAddress.trim()) { showNotification("Kinakailangan ang lokasyon/address.", "error"); return; }

    if (isMock) {
      showNotification("Na-update ang tindahan (Mock Store Mode)!", "success");
      return;
    }

    try {
      setUpdatingStore(true);
      await updateDoc(doc(db, "stores", activeStoreId), {
        name:          editName,
        industry_type: editIndustry,
        address:       editAddress,
        updated_at:    serverTimestamp(),
      });
      showNotification("Matagumpay na na-update ang impormasyon ng tindahan!", "success");
    } catch (err) {
      console.error("Update store error:", err);
      showNotification("Hindi ma-update ang impormasyon. Subukan muli.", "error");
    } finally {
      setUpdatingStore(false);
    }
  };

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
              Pamahalaan ang inventory, sales tracking, at cashier shifts ng iyong tindahan.
            </p>
          </div>
          {activeStoreId && (
            <div className="flex items-center gap-2 bg-[#064E3B]/10 text-[#064E3B] border border-[#064E3B]/20 px-4 py-2.5 rounded-xl text-xs font-mono font-bold self-start shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] animate-ping" />
              Store ID: {activeStoreId}
              {isMock && (
                <span className="ml-2 bg-[#57534E]/20 text-[#57534E] px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
                  Mock
                </span>
              )}
            </div>
          )}
        </header>

        {/* ── Loading spinner ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 bg-white rounded-2xl border border-[#57534E]/15 shadow-sm">
            <svg className="animate-spin h-10 w-10 text-[#064E3B]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-[#57534E] mt-4 font-semibold">Kinukuha ang mga dashboard data...</p>
          </div>

        /* ── No active store ── */
        ) : !activeStoreId ? (
          <div className="text-center py-20 bg-white border border-[#F97316]/25 rounded-2xl max-w-2xl mx-auto shadow-sm p-8">
            <div className="p-4 bg-[#F97316]/10 text-[#F97316] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-extrabold text-xl text-[#0C0A09]">Walang Aktibong Tindahan</h3>
            <p className="text-sm text-[#57534E] mt-2 max-w-md mx-auto leading-relaxed">
              Pumili muna ng aktibong tindahan sa <strong>Mga Tindahan</strong> tab.
            </p>
            <a href="/stores" className="mt-6 inline-block px-5 py-3 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-xl text-xs transition shadow-md">
              Pumili ng Tindahan
            </a>
          </div>

        /* ── Main dashboard ── */
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm hover:scale-[1.01] transition-transform duration-200">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${stat.colorClass}`}>
                    {stat.icon}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#57534E]">{stat.name}</p>
                  <h3 className="text-3xl font-extrabold text-[#0C0A09] mt-1 mb-2">{stat.value}</h3>
                  <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${stat.colorClass}`}>
                    {stat.change}
                  </span>
                </div>
              ))}
            </div>

            {/* Staff table + Store settings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* ── Staff table (2/3 width) ── */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#064E3B]">Pamamahala ng mga Staff</h3>
                    <p className="text-xs text-[#57534E] mt-0.5">
                      Mga cashier na pinayagang mag-access sa branch na ito
                    </p>
                  </div>
                  <button
                    onClick={() => setIsStaffModalOpen(true)}
                    className="px-4 py-2.5 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Bagong Staff
                  </button>
                </div>

                {staffList.length > 0 ? (
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
                          <tr key={i} className="hover:bg-[#FAFAF9]/50 transition-colors">
                            <td className="py-3.5 font-bold text-[#0C0A09]">{staff.name}</td>
                            <td className="py-3.5 text-[#57534E] font-semibold">{staff.role}</td>
                            <td className="py-3.5 text-[#57534E] font-mono text-[11px]">{staff.email}</td>
                            <td className="py-3.5 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-lg font-bold text-[10px] uppercase ${
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
                ) : (
                  <div className="text-center py-12 bg-[#FAFAF9] rounded-2xl border border-dashed border-[#57534E]/20 p-6">
                    <svg className="w-10 h-10 text-[#57534E]/30 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-xs font-bold text-[#57534E]">Walang nakatalagang staff sa branch na ito.</p>
                    <p className="text-[10px] text-[#57534E]/70 mt-1">I-click ang "Bagong Staff" para magdagdag ng cashier.</p>
                  </div>
                )}
              </div>

              {/* ── Store settings (1/3 width) ── */}
              <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-[#064E3B] mb-1">Setting ng Tindahan</h3>
                <p className="text-xs text-[#57534E] leading-relaxed mb-5">
                  I-edit ang impormasyon ng business unit. Ang mga pagbabago ay makikita sa listahan ng tindahan.
                </p>

                <form onSubmit={handleUpdateStore} className="flex flex-col flex-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#57534E] uppercase tracking-wider mb-1.5">
                      Pangalan ng Branch
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#57534E]/20 rounded-xl text-sm text-[#0C0A09] focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#57534E] uppercase tracking-wider mb-1.5">
                      Uri ng Industriya
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-[#57534E]/20 rounded-xl text-sm text-[#0C0A09] bg-white focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition"
                      value={editIndustry}
                      onChange={e => setEditIndustry(e.target.value)}
                    >
                      <option value="Retail">Retail</option>
                      <option value="Food">Food / Cafe</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#57534E] uppercase tracking-wider mb-1.5">
                      Lokasyon / Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#57534E]/20 rounded-xl text-sm text-[#0C0A09] focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition"
                      value={editAddress}
                      onChange={e => setEditAddress(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStore}
                    className="mt-auto w-full py-3.5 border border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B]/5 disabled:opacity-60 disabled:cursor-not-allowed font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {updatingStore ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Ina-update...
                      </>
                    ) : (
                      "I-update ang Impormasyon"
                    )}
                  </button>
                </form>
              </div>

            </div>
          </>
        )}
      </div>

      {/* ── Modal: Add Staff ── */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-[#57534E]/10">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#064E3B]">Magdagdag ng Staff / Cashier</h2>
              <button
                onClick={() => { setIsStaffModalOpen(false); setStaffEmail(""); }}
                className="p-1.5 rounded-lg hover:bg-[#57534E]/10 transition text-[#57534E]/70 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">
                  Email ng Staff
                </label>
                <input
                  type="email"
                  required
                  placeholder="Hal. cashier@email.com"
                  className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm"
                  value={staffEmail}
                  onChange={e => setStaffEmail(e.target.value)}
                />
                <p className="text-[10px] text-[#57534E]/60 mt-1.5 leading-relaxed">
                  Dapat nakarehistro na ang email na ito bilang &ldquo;Cashier / Staff&rdquo; sa signup page.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">
                  Role sa Tindahan
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl bg-white focus:outline-none focus:border-[#064E3B] text-sm"
                  value={staffRole}
                  onChange={e => setStaffRole(e.target.value)}
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Head Cashier">Head Cashier</option>
                  <option value="Staff">General Staff</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#57534E]/10">
                <button
                  type="button"
                  onClick={() => { setIsStaffModalOpen(false); setStaffEmail(""); }}
                  className="flex-1 py-3 border border-[#57534E]/20 rounded-xl text-xs font-bold text-[#57534E] hover:bg-[#57534E]/5 transition cursor-pointer"
                >
                  Kanselahin
                </button>
                <button
                  type="submit"
                  disabled={addingStaff}
                  className="flex-1 py-3 bg-[#064E3B] hover:bg-[#064E3B]/90 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {addingStaff ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Idinaragdag...
                    </>
                  ) : (
                    "Idagdag"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating Toast Notification ── */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 border max-w-sm ${
          notification.type === "error"
            ? "bg-rose-50 text-rose-800 border-rose-200"
            : "bg-emerald-50 text-emerald-800 border-emerald-200"
        }`}>
          {notification.type === "error" ? (
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
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

    </div>
  );
};
