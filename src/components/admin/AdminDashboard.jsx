import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../shared/Navbar";
import { useAuth } from "../../context/AuthContext";
import { getProductsByStore, addProduct } from "../../services/productService";
import { getOrdersByStore } from "../../services/orderService";
import { CashierPOS } from "../cashier/CashierPOS";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("fil-PH", { dateStyle: "medium", timeStyle: "short" });
};
const formatDateShort = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fil-PH", { month: "short", day: "numeric", year: "numeric" });
};
const formatTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("fil-PH", { timeStyle: "short" });
};

export const AdminDashboard = () => {
  const { activeStoreId } = useAuth();

  // ── Active tab state ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("inventory"); // inventory | staff | transactions

  // ── Inventory states ───────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingSave, setLoadingSave] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "Soda" });

  // ── Transactions states ────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [txSearch, setTxSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const categories = ["Soda", "Bakery", "Chips", "Noodles", "Coffee", "Canned Goods", "Others"];

  // ── Fetch products ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      await Promise.resolve();
      if (!activeStoreId) { setProducts([]); setLoadingProducts(false); return; }
      try {
        setLoadingProducts(true);
        const data = await getProductsByStore(activeStoreId);
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetch();
  }, [activeStoreId]);

  // ── Fetch orders when Transactions tab is active ───────────────────────────
  useEffect(() => {
    if (activeTab !== "transactions" || !activeStoreId) return;
    const fetch = async () => {
      try {
        setLoadingOrders(true);
        setOrdersError("");
        const data = await getOrdersByStore(activeStoreId);
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrdersError("Hindi ma-load ang mga transaksyon. Subukan muli.");
      } finally {
        setLoadingOrders(false);
      }
    };
    fetch();
  }, [activeTab, activeStoreId]);

  // ── Add Product ────────────────────────────────────────────────────────────
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!newProduct.name.trim()) { setError("Kinakailangan ang pangalan ng produkto."); return; }
    const priceNum = parseFloat(newProduct.price);
    if (isNaN(priceNum) || priceNum <= 0) { setError("Maglagay ng valid na presyo (dapat mas mataas sa 0)."); return; }
    const stockNum = parseInt(newProduct.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) { setError("Maglagay ng valid na dami ng stock (dapat hindi bababa sa 0)."); return; }
    try {
      setLoadingSave(true);
      const created = await addProduct({ name: newProduct.name, price: priceNum, stock: stockNum, category: newProduct.category }, activeStoreId);
      setProducts((prev) => [...prev, created]);
      setSuccess("Matagumpay na naidagdag ang produkto!");
      setNewProduct({ name: "", price: "", stock: "", category: "Soda" });
      setTimeout(() => { setIsModalOpen(false); setSuccess(""); }, 1000);
    } catch (err) {
      console.error("Save product failed:", err);
      setError(err.message || "May naganap na error habang sine-save ang produkto.");
    } finally {
      setLoadingSave(false);
    }
  };

  // ── Print receipt helper ───────────────────────────────────────────────────
  const handlePrint = (order) => {
    const orderDate = formatDate(order.created_at);
    const receiptUrl = `${window.location.origin}/receipt/${order.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(receiptUrl)}`;
    const itemsHtml = order.items?.map((item) => `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <div style="flex:1;padding-right:12px;">
          <span style="font-weight:700;display:block;">${item.name}</span>
          <span style="font-size:10px;color:#57534E;">${item.quantity} x \u20B1${item.price.toFixed(2)}</span>
        </div>
        <span style="font-weight:700;">\u20B1${(item.quantity * item.price).toFixed(2)}</span>
      </div>`).join("") || "";
    const discountHtml = order.discount > 0 ? `
      <div style="display:flex;justify-content:space-between;color:#F97316;">
        <span>Discount (${order.discount}%):</span>
        <span>-\u20B1${((order.subtotal * order.discount) / 100).toFixed(2)}</span>
      </div>` : "";
    const html = `<!DOCTYPE html><html lang="tl"><head><meta charset="UTF-8"/><title>Resibo - ${order.id}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;background:white;}.receipt{width:80mm;margin:0 auto;padding:16px;}</style>
      </head><body><div class="receipt">
      <div style="text-align:center;padding-bottom:12px;border-bottom:1px dashed #aaa;margin-bottom:12px;">
        <div style="font-size:20px;font-weight:900;color:#064E3B;">POS-by-KYUT</div>
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#57534E;margin-top:4px;">Store Receipt</div>
        <div style="font-size:9px;color:#57534E;margin-top:8px;text-align:left;">
          <div>STORE ID: ${order.store_id}</div><div>TXID: ${order.id}</div><div>DATE: ${orderDate}</div>
        </div>
      </div>
      <div style="padding-bottom:12px;border-bottom:1px dashed #aaa;margin-bottom:12px;font-size:11px;">${itemsHtml}</div>
      <div style="padding-bottom:12px;border-bottom:1px dashed #aaa;margin-bottom:12px;font-size:11px;color:#57534E;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>Subtotal:</span><span style="font-weight:700;">\u20B1${order.subtotal?.toFixed(2)}</span></div>
        ${discountHtml}
        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:900;padding-top:8px;border-top:1px dashed #ccc;margin-top:6px;"><span>KABUUAN:</span><span style="color:#064E3B;">\u20B1${order.total?.toFixed(2)}</span></div>
      </div>
      <div style="text-align:center;font-size:9px;color:#57534E;padding-bottom:12px;border-bottom:1px dashed #aaa;margin-bottom:12px;">
        <div>Cashier: <strong>${order.cashier_name}</strong></div>
        <div style="margin-top:6px;font-weight:700;color:#064E3B;">Maraming salamat po!</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;padding-top:8px;">
        <img src="${qrUrl}" style="width:110px;height:110px;" alt="QR"/>
        <div style="font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#aaa;margin-top:6px;">I-scan para sa digital receipt</div>
      </div>
      </div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</scr` + `ipt></body></html>`;
    const w = window.open("", "_blank", "width=400,height=600");
    if (w) { w.document.write(html); w.document.close(); }
  };

  // ── Transaction filtering ─────────────────────────────────────────────────
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filteredOrders = orders.filter((order) => {
    const lc = txSearch.toLowerCase();
    const matchesSearch = !txSearch || order.id.toLowerCase().includes(lc) ||
      (order.cashier_name || "").toLowerCase().includes(lc) ||
      order.items?.some((i) => i.name.toLowerCase().includes(lc));
    let matchesDate = true;
    if (dateFilter !== "all" && order.created_at?.toDate) {
      const d = order.created_at.toDate();
      if (dateFilter === "today") matchesDate = d >= startOfToday;
      else if (dateFilter === "week") matchesDate = d >= startOfWeek;
      else if (dateFilter === "month") matchesDate = d >= startOfMonth;
    }
    return matchesSearch && matchesDate;
  });

  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
  const avgOrder = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  // ── Mock / computed stats ──────────────────────────────────────────────────
  const stats = [
    { name: "Kabuuang Kita (Buwan)", value: `₱${totalRevenue.toFixed(2)}`, change: `${orders.length} transaksyon`, colorClass: "text-[#064E3B] bg-[#064E3B]/10" },
    { name: "Mga Produkto", value: `${products.length} items`, change: `${products.filter(p => p.stock <= 10).length} kailangang i-restock`, colorClass: "text-[#F97316] bg-[#F97316]/10" },
    { name: "Average Order", value: orders.length > 0 ? `₱${avgOrder.toFixed(2)}` : "—", change: "per transaction", colorClass: "text-[#57534E] bg-[#57534E]/10" },
  ];

  const mockStaff = [
    { name: "Maria Clara", role: "Head Cashier", email: "maria@store.com", status: "Active" },
    { name: "Juan Dela Cruz", role: "Junior Cashier", email: "juan@store.com", status: "On Break" },
    { name: "Leonor Rivera", role: "Staff", email: "leonor@store.com", status: "Inactive" },
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
    {
      key: "transactions",
      label: "Transaksyon",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      key: "pos",
      label: "POS Screen",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 100-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#064E3B] tracking-tight">Admin & Manager Operations</h1>
            <p className="text-sm text-[#57534E] mt-1">Pamahalaan ang inventory, sales tracking, at cashier shifts ng iyong tindahan.</p>
          </div>
          {activeStoreId && (
            <div className="bg-[#064E3B]/10 text-[#064E3B] border border-[#064E3B]/20 px-4 py-2 rounded-xl text-xs font-mono font-bold self-start">
              Active Store Session: {activeStoreId}
            </div>
          )}
        </header>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm transition-transform duration-200 hover:scale-[1.01]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#57534E]">{stat.name}</p>
              <h3 className="text-3xl font-extrabold text-[#0C0A09] mt-2 mb-1">{stat.value}</h3>
              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${stat.colorClass}`}>{stat.change}</span>
            </div>
          ))}
        </div>

        {/* ── Main Panel with Tabs ── */}
        <div className="bg-white rounded-2xl border border-[#57534E]/15 shadow-sm overflow-hidden">

          {/* Tab Bar */}
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
                {tab.key === "transactions" && orders.length > 0 && (
                  <span className="ml-1 bg-[#064E3B] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                    {orders.length}
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
                    onClick={() => setIsModalOpen(true)}
                    className="px-3.5 py-1.5 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    + Bagong Produkto
                  </button>
                ) : (
                  <span className="text-[10px] text-[#F97316] font-bold uppercase tracking-wider bg-[#F97316]/10 px-2 py-1 rounded-lg">Pumili ng Tindahan</span>
                )}
              </div>

              {loadingProducts ? (
                <div className="flex justify-center items-center py-14">
                  <svg className="animate-spin h-6 w-6 text-[#064E3B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-14 bg-[#FAFAF9] rounded-xl border border-dashed border-[#57534E]/20 text-[#57534E] text-xs">
                  Walang nakitang mga produkto. Magdagdag sa pamamagitan ng pag-click sa button sa itaas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#57534E]/10 text-[#57534E]">
                        <th className="pb-3 font-semibold">Pangalan</th>
                        <th className="pb-3 font-semibold">Kategorya</th>
                        <th className="pb-3 font-semibold">Presyo</th>
                        <th className="pb-3 font-semibold text-right">Dami (Stock)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#57534E]/5">
                      {products.map((product) => {
                        const isOut = product.stock <= 0;
                        const isLow = product.stock > 0 && product.stock <= 10;
                        return (
                          <tr key={product.id} className="hover:bg-[#FAFAF9]/50 transition-colors">
                            <td className="py-3.5 font-bold text-[#0C0A09]">{product.name}</td>
                            <td className="py-3.5 text-[#57534E] font-medium">{product.category}</td>
                            <td className="py-3.5 text-[#064E3B] font-extrabold font-mono">₱{product.price?.toFixed(2)}</td>
                            <td className="py-3.5 text-right font-bold">
                              {isOut ? (
                                <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-rose-500/10 text-rose-700 animate-pulse">Out of Stock</span>
                              ) : isLow ? (
                                <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-500/10 text-amber-700">Mababa ({product.stock})</span>
                              ) : (
                                <span className="text-[#57534E]">{product.stock} units</span>
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
                <h3 className="text-lg font-bold text-[#064E3B]">Pamamahala ng mga Staff</h3>
                <button className="px-3.5 py-1.5 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-lg text-xs transition cursor-pointer">
                  + Bagong Staff
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#57534E]/10 text-[#57534E]">
                      <th className="pb-3 font-semibold">Pangalan</th>
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#57534E]/5">
                    {mockStaff.map((staff, i) => (
                      <tr key={i} className="hover:bg-[#FAFAF9]/50 transition-colors">
                        <td className="py-3.5 font-bold text-[#0C0A09]">{staff.name}</td>
                        <td className="py-3.5 text-[#57534E] font-medium">{staff.role}</td>
                        <td className="py-3.5 text-[#57534E] font-mono">{staff.email}</td>
                        <td className="py-3.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            staff.status === "Active" ? "bg-emerald-500/10 text-emerald-700"
                            : staff.status === "On Break" ? "bg-amber-500/10 text-amber-700"
                            : "bg-[#57534E]/10 text-[#57534E]"
                          }`}>
                            {staff.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TRANSACTIONS TAB ── */}
          {activeTab === "transactions" && (
            <div className="p-6">
              {/* Transactions header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[#064E3B]">Kasaysayan ng mga Transaksyon</h3>
                  <p className="text-xs text-[#57534E] mt-0.5">
                    {filteredOrders.length} transaksyon · Kabuuan: <strong>₱{totalRevenue.toFixed(2)}</strong>
                  </p>
                </div>
                <Link
                  to="/cashier/transactions"
                  className="text-xs font-bold text-[#064E3B] underline underline-offset-2 hover:opacity-75 transition self-start"
                >
                  Buksan sa buong pahina ↗
                </Link>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#57534E]/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Maghanap ng order ID, cashier, o produkto..."
                    className="w-full pl-8 pr-3 py-2 border border-[#57534E]/20 rounded-xl bg-[#FAFAF9] text-xs focus:outline-none focus:border-[#064E3B] text-[#0C0A09]"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-1 bg-[#FAFAF9] border border-[#57534E]/15 rounded-xl p-1">
                  {[{ key: "all", label: "Lahat" }, { key: "today", label: "Ngayon" }, { key: "week", label: "Linggo" }, { key: "month", label: "Buwan" }].map((f) => (
                    <button key={f.key} onClick={() => setDateFilter(f.key)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${dateFilter === f.key ? "bg-[#064E3B] text-white shadow-sm" : "text-[#57534E] hover:bg-white"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading */}
              {loadingOrders && (
                <div className="flex justify-center items-center py-14">
                  <svg className="animate-spin h-6 w-6 text-[#064E3B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}

              {/* Error */}
              {ordersError && !loadingOrders && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold">{ordersError}</div>
              )}

              {/* No store */}
              {!activeStoreId && !loadingOrders && (
                <div className="text-center py-12 text-[#57534E] text-xs">
                  Pumili muna ng aktibong tindahan para makita ang mga transaksyon.
                </div>
              )}

              {/* Empty */}
              {!loadingOrders && !ordersError && activeStoreId && filteredOrders.length === 0 && (
                <div className="text-center py-12 bg-[#FAFAF9] rounded-xl border border-dashed border-[#57534E]/20 text-[#57534E] text-xs">
                  {txSearch || dateFilter !== "all" ? "Walang nahanap. Subukan ng ibang filter." : "Wala pang transaksyon para sa tindahang ito."}
                </div>
              )}

              {/* Orders list */}
              {!loadingOrders && !ordersError && filteredOrders.length > 0 && (
                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {filteredOrders.map((order) => {
                    const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                    const isExpanded = selectedOrder?.id === order.id;
                    return (
                      <div key={order.id} className="border border-[#57534E]/10 rounded-xl overflow-hidden hover:border-[#57534E]/20 transition-all">
                        {/* Row */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-white">
                          {/* Date dot */}
                          <div className="shrink-0 flex flex-col items-center gap-0.5 min-w-[46px]">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200"></div>
                            <span className="text-[9px] font-bold text-[#57534E]/50 uppercase text-center leading-tight">
                              {formatDateShort(order.created_at)}
                            </span>
                            <span className="text-[9px] text-[#57534E]/40 font-mono">{formatTime(order.created_at)}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-[#0C0A09]">₱{order.total?.toFixed(2)}</span>
                              {order.discount > 0 && (
                                <span className="text-[9px] bg-[#F97316]/10 text-[#F97316] font-bold px-1.5 py-0.5 rounded-md">-{order.discount}% OFF</span>
                              )}
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md border border-emerald-100">{order.payment_method || "Cash"}</span>
                            </div>
                            <div className="text-[10px] text-[#57534E]/60 font-mono truncate mt-0.5">{order.id}</div>
                            <div className="text-[10px] text-[#57534E] mt-0.5">
                              Cashier: <strong>{order.cashier_name || "—"}</strong>
                              <span className="text-[#57534E]/40 mx-1">·</span>
                              {itemCount} item{itemCount !== 1 ? "s" : ""}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => setSelectedOrder(isExpanded ? null : order)}
                              className="p-1.5 rounded-lg border border-[#57534E]/15 text-[#57534E] hover:bg-[#57534E]/5 transition cursor-pointer" title="Tingnan">
                              <svg className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button onClick={() => handlePrint(order)}
                              className="p-1.5 rounded-lg border border-[#57534E]/15 text-[#57534E] hover:bg-[#064E3B] hover:text-white hover:border-[#064E3B] transition cursor-pointer" title="I-print">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                            </button>
                            <Link to={`/receipt/${order.id}`} target="_blank"
                              className="p-1.5 rounded-lg border border-[#57534E]/15 text-[#57534E] hover:bg-[#57534E]/5 transition" title="Buksan ang digital receipt">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Link>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="border-t border-dashed border-[#57534E]/15 bg-[#FAFAF9] px-4 py-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#57534E]/50 mb-2">Mga Biniling Produkto</div>
                                <div className="space-y-1.5">
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <div className="flex-1 pr-3">
                                        <span className="font-bold text-[#0C0A09] block">{item.name}</span>
                                        <span className="text-[#57534E]/60">{item.quantity} x ₱{item.price?.toFixed(2)}</span>
                                      </div>
                                      <span className="font-bold text-[#0C0A09]">₱{(item.quantity * item.price).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#57534E]/50 mb-2">Buod ng Order</div>
                                <div className="flex justify-between text-[#57534E]"><span>Subtotal:</span><span className="font-bold text-[#0C0A09]">₱{order.subtotal?.toFixed(2)}</span></div>
                                {order.discount > 0 && (
                                  <div className="flex justify-between text-[#F97316]"><span>Discount ({order.discount}%):</span><span className="font-bold">-₱{((order.subtotal * order.discount) / 100).toFixed(2)}</span></div>
                                )}
                                <div className="flex justify-between font-extrabold text-[#0C0A09] pt-1.5 border-t border-dashed border-[#57534E]/20">
                                  <span>KABUUAN:</span><span className="text-[#064E3B]">₱{order.total?.toFixed(2)}</span>
                                </div>
                                <div className="text-[#57534E]/70 space-y-1 pt-1.5 border-t border-[#57534E]/10">
                                  <div className="flex justify-between"><span>Paraan ng Bayad:</span><span className="font-bold text-[#0C0A09]">{order.payment_method || "Cash"}</span></div>
                                  <div className="flex justify-between"><span>Petsa:</span><span className="font-bold text-[#0C0A09]">{formatDate(order.created_at)}</span></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── POS TAB ── */}
          {activeTab === "pos" && (
            <div className="p-6">
              <CashierPOS embedded={true} />
            </div>
          )}

        </div>

        {/* ── Store Settings (always visible below tabs) ── */}
        <div className="mt-8 bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm max-w-sm">
          <h3 className="text-lg font-bold text-[#064E3B] mb-4">Mga Setting ng Tindahan</h3>
          <p className="text-xs text-[#57534E] leading-relaxed mb-6">
            Ibahagi o i-edit ang impormasyon ng iyong business unit.
          </p>
          <div className="space-y-4 text-xs mb-6">
            <div>
              <label className="block font-bold text-[#57534E] uppercase mb-1">Pangalan ng Branch</label>
              <input type="text" disabled className="w-full px-3 py-2 border border-[#57534E]/20 bg-[#FAFAF9] rounded-lg text-[#57534E]" defaultValue="KYUT Sari-Sari Store" />
            </div>
            <div>
              <label className="block font-bold text-[#57534E] uppercase mb-1">Uri ng Negosyo</label>
              <input type="text" disabled className="w-full px-3 py-2 border border-[#57534E]/20 bg-[#FAFAF9] rounded-lg text-[#57534E]" defaultValue="Retail / Convenience" />
            </div>
          </div>
          <button className="w-full py-3 border border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B]/5 font-bold rounded-xl text-xs transition cursor-pointer">
            I-update ang Impormasyon
          </button>
        </div>

      </div>

      {/* ── Modal: Add Product ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-[#57534E]/10 animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#064E3B]">Magdagdag ng Produkto</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-[#57534E]/10 transition text-[#57534E]/70 cursor-pointer">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && <div className="bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] p-3 rounded-xl text-xs mb-4">{error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-100 text-[#064E3B] p-3 rounded-xl text-xs mb-4">{success}</div>}

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
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
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
              <div className="flex gap-3 pt-4 border-t border-[#57534E]/10 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-[#57534E]/20 rounded-xl text-xs font-bold text-[#57534E] hover:bg-[#57534E]/5 transition cursor-pointer">
                  Banselahin
                </button>
                <button type="submit" disabled={loadingSave}
                  className="flex-1 py-3 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white rounded-xl text-xs font-bold transition flex justify-center items-center gap-1.5 disabled:opacity-75 cursor-pointer">
                  {loadingSave ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Naililikha...</span>
                    </>
                  ) : <span>Likhain</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
