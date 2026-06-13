import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../shared/Navbar";
import { useAuth } from "../../context/AuthContext";
import { getOrdersByStore } from "../../services/orderService";

const formatDate = (timestamp) => {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("fil-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatDateShort = (timestamp) => {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("fil-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString("fil-PH", { timeStyle: "short" });
};

export const TransactionHistory = () => {
  const { activeStoreId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all | today | week | month

  useEffect(() => {
    const fetchOrders = async () => {
      await Promise.resolve();
      if (!activeStoreId) {
        setOrders([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const data = await getOrdersByStore(activeStoreId);
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Hindi ma-load ang mga transaksyon. Subukan muli.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [activeStoreId]);

  // ── Filtering logic ──────────────────────────────────────────────────────────
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filteredOrders = orders.filter((order) => {
    const lc = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      order.id.toLowerCase().includes(lc) ||
      (order.cashier_name || "").toLowerCase().includes(lc) ||
      order.items?.some((item) => item.name.toLowerCase().includes(lc));

    let matchesDate = true;
    if (dateFilter !== "all" && order.created_at?.toDate) {
      const d = order.created_at.toDate();
      if (dateFilter === "today") matchesDate = d >= startOfToday;
      else if (dateFilter === "week") matchesDate = d >= startOfWeek;
      else if (dateFilter === "month") matchesDate = d >= startOfMonth;
    }

    return matchesSearch && matchesDate;
  });

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalTransactions = filteredOrders.length;
  const totalItems = filteredOrders.reduce(
    (sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0),
    0
  );
  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // ── Handle print single order ─────────────────────────────────────────────────
  const handlePrint = (order) => {
    const orderDate = formatDate(order.created_at);
    const receiptUrl = `${window.location.origin}/receipt/${order.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(receiptUrl)}`;

    const itemsHtml = order.items?.map((item) => `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div style="flex:1;padding-right:12px;">
          <span style="font-weight:700;color:#0C0A09;display:block;">${item.name}</span>
          <span style="font-size:10px;color:#57534E;">${item.quantity} x \u20B1${item.price.toFixed(2)}</span>
        </div>
        <span style="font-weight:700;color:#0C0A09;">\u20B1${(item.quantity * item.price).toFixed(2)}</span>
      </div>
    `).join("") || "";

    const discountHtml = order.discount > 0 ? `
      <div style="display:flex;justify-content:space-between;color:#F97316;">
        <span>Discount (${order.discount}%):</span>
        <span style="font-weight:700;">-\u20B1${((order.subtotal * order.discount) / 100).toFixed(2)}</span>
      </div>
    ` : "";

    const printHtml = `
      <!DOCTYPE html>
      <html lang="tl">
      <head>
        <meta charset="UTF-8" />
        <title>Resibo - ${order.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', Courier, monospace; background: white; color: #000; }
          .receipt { width: 80mm; margin: 0 auto; padding: 16px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div style="text-align:center;padding-bottom:12px;border-bottom:1px dashed #aaa;margin-bottom:12px;">
            <div style="font-size:20px;font-weight:900;color:#064E3B;">POS-by-KYUT</div>
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#57534E;margin-top:4px;">Store Receipt</div>
            <div style="font-size:9px;color:#57534E;margin-top:8px;text-align:left;">
              <div>STORE ID: ${order.store_id}</div>
              <div>TXID: ${order.id}</div>
              <div>DATE: ${orderDate}</div>
            </div>
          </div>
          <div style="padding-bottom:12px;border-bottom:1px dashed #aaa;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#57534E;margin-bottom:8px;">
              <span>Produkto</span><span>Halaga</span>
            </div>
            <div style="font-size:11px;">${itemsHtml}</div>
          </div>
          <div style="padding-bottom:12px;border-bottom:1px dashed #aaa;margin-bottom:12px;font-size:11px;color:#57534E;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>Subtotal:</span>
              <span style="font-weight:700;color:#0C0A09;">\u20B1${order.subtotal?.toFixed(2)}</span>
            </div>
            ${discountHtml}
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:900;color:#0C0A09;padding-top:8px;border-top:1px dashed #ccc;margin-top:6px;">
              <span>KABUUAN:</span>
              <span style="color:#064E3B;">\u20B1${order.total?.toFixed(2)}</span>
            </div>
          </div>
          <div style="text-align:center;font-size:9px;color:#57534E;padding-bottom:12px;border-bottom:1px dashed #aaa;margin-bottom:12px;">
            <div>Cashier: <strong>${order.cashier_name}</strong></div>
            <div style="margin-top:6px;font-weight:700;color:#064E3B;">Maraming salamat po!</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;padding-top:8px;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width:110px;height:110px;" />
            <div style="font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#aaa;margin-top:6px;text-align:center;">I-scan para sa digital receipt</div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
        </scr` + `ipt>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09] flex flex-col">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#064E3B] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Kasaysayan ng mga Transaksyon
              </h1>
              <p className="text-white/60 text-sm mt-1 font-medium">
                {activeStoreId ? `Store: ${activeStoreId}` : "Walang napiling tindahan"}
              </p>
            </div>

            {/* Summary badges */}
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center min-w-[90px]">
                <div className="text-xl font-extrabold">{totalTransactions}</div>
                <div className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Transaksyon</div>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center min-w-[110px]">
                <div className="text-xl font-extrabold">₱{totalRevenue.toFixed(2)}</div>
                <div className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Kabuuang Kita</div>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center min-w-[90px]">
                <div className="text-xl font-extrabold">{totalItems}</div>
                <div className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Mga Item</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#57534E]/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="tx-search"
              type="text"
              placeholder="Maghanap ng order ID, cashier, o produkto..."
              className="w-full pl-9 pr-4 py-2.5 border border-[#57534E]/20 rounded-xl bg-white text-sm focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]/20 text-[#0C0A09]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date filter tabs */}
          <div className="flex gap-1 bg-white border border-[#57534E]/15 rounded-xl p-1 shadow-sm">
            {[
              { key: "all", label: "Lahat" },
              { key: "today", label: "Ngayon" },
              { key: "week", label: "Lingguhan" },
              { key: "month", label: "Buwanan" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDateFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  dateFilter === tab.key
                    ? "bg-[#064E3B] text-white shadow-sm"
                    : "text-[#57534E] hover:bg-[#57534E]/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* No store selected */}
        {!activeStoreId && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-[#064E3B]/5 p-5 rounded-2xl mb-4">
              <svg className="w-12 h-12 text-[#064E3B]/40 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 2.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#0C0A09]">Pumili Muna ng Tindahan</h3>
            <p className="text-sm text-[#57534E]/70 mt-1 max-w-xs">Kailangan munang pumili ng aktibong tindahan para makita ang mga transaksyon.</p>
            <Link to="/stores" className="mt-4 px-5 py-2.5 bg-[#064E3B] text-white text-xs font-bold rounded-xl hover:bg-[#064E3B]/90 transition shadow-sm">
              Pumunta sa Mga Tindahan
            </Link>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-[#064E3B] mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-[#57534E] font-semibold">Kinukuha ang mga transaksyon...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-xl text-sm font-semibold flex items-center gap-2 mb-6">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && activeStoreId && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-[#57534E]/5 p-5 rounded-2xl mb-4">
              <svg className="w-12 h-12 text-[#57534E]/30 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#0C0A09]">
              {searchQuery || dateFilter !== "all" ? "Walang Nahanap" : "Wala Pang Transaksyon"}
            </h3>
            <p className="text-sm text-[#57534E]/70 mt-1 max-w-xs">
              {searchQuery || dateFilter !== "all"
                ? "Subukan ng ibang search o palitan ang date filter."
                : "Mag-proseso ng bayad sa POS para lumabas ang mga transaksyon dito."}
            </p>
            {(searchQuery || dateFilter !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setDateFilter("all"); }}
                className="mt-4 px-4 py-2 border border-[#57534E]/20 text-[#57534E] text-xs font-bold rounded-xl hover:bg-[#57534E]/5 transition cursor-pointer"
              >
                I-clear ang Filters
              </button>
            )}
          </div>
        )}

        {/* Transaction list */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="space-y-3">
            {/* Average order info */}
            <div className="text-xs text-[#57534E]/60 font-semibold mb-2 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {filteredOrders.length} resulta · Average order: ₱{avgOrderValue.toFixed(2)}
            </div>

            {filteredOrders.map((order) => {
              const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#57534E]/10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                >
                  {/* Main row */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Left: colored accent dot + date */}
                    <div className="shrink-0 flex flex-col items-center gap-1 min-w-[52px]">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200"></div>
                      <span className="text-[9px] font-bold text-[#57534E]/50 uppercase tracking-wider text-center leading-tight">
                        {formatDateShort(order.created_at)}
                      </span>
                      <span className="text-[9px] text-[#57534E]/40 font-mono">
                        {formatTime(order.created_at)}
                      </span>
                    </div>

                    {/* Middle: order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-[#0C0A09]">
                          ₱{order.total?.toFixed(2)}
                        </span>
                        {order.discount > 0 && (
                          <span className="text-[10px] bg-[#F97316]/10 text-[#F97316] font-bold px-1.5 py-0.5 rounded-md">
                            -{order.discount}% OFF
                          </span>
                        )}
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md border border-emerald-100">
                          {order.payment_method || "Cash"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-[#57534E]/70 font-mono truncate">
                        {order.id}
                      </div>
                      <div className="mt-1 text-[11px] text-[#57534E] font-medium">
                        <span className="text-[#57534E]/50">Cashier:</span>{" "}
                        <span className="font-bold">{order.cashier_name || "—"}</span>
                        <span className="text-[#57534E]/40 mx-1.5">·</span>
                        <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="p-2 rounded-xl border border-[#57534E]/15 text-[#57534E] hover:bg-[#57534E]/5 hover:border-[#57534E]/30 transition cursor-pointer"
                        title="Tingnan ang detalye"
                      >
                        <svg className={`h-4 w-4 transition-transform duration-200 ${selectedOrder?.id === order.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePrint(order)}
                        className="p-2 rounded-xl border border-[#57534E]/15 text-[#57534E] hover:bg-[#064E3B] hover:text-white hover:border-[#064E3B] transition cursor-pointer"
                        title="I-print ang resibo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                      <Link
                        to={`/receipt/${order.id}`}
                        target="_blank"
                        className="p-2 rounded-xl border border-[#57534E]/15 text-[#57534E] hover:bg-[#57534E]/5 hover:border-[#57534E]/30 transition"
                        title="Buksan ang digital receipt"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* Expanded detail row */}
                  {selectedOrder?.id === order.id && (
                    <div className="border-t border-dashed border-[#57534E]/15 bg-[#FAFAF9] px-5 py-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Items list */}
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#57534E]/60 mb-2">
                            Mga Biniling Produkto
                          </div>
                          <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start text-xs">
                                <div className="flex-1 pr-3">
                                  <span className="font-bold text-[#0C0A09] block">{item.name}</span>
                                  <span className="text-[#57534E]/60">{item.quantity} x ₱{item.price?.toFixed(2)}</span>
                                </div>
                                <span className="font-bold text-[#0C0A09]">
                                  ₱{(item.quantity * item.price).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order summary */}
                        <div className="space-y-2 text-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#57534E]/60 mb-2">
                            Buod ng Order
                          </div>
                          <div className="flex justify-between text-[#57534E]">
                            <span>Subtotal:</span>
                            <span className="font-bold text-[#0C0A09]">₱{order.subtotal?.toFixed(2)}</span>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex justify-between text-[#F97316]">
                              <span>Discount ({order.discount}%):</span>
                              <span className="font-bold">-₱{((order.subtotal * order.discount) / 100).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-extrabold text-[#0C0A09] pt-1.5 border-t border-dashed border-[#57534E]/20">
                            <span>KABUUAN:</span>
                            <span className="text-[#064E3B]">₱{order.total?.toFixed(2)}</span>
                          </div>
                          <div className="pt-2 mt-1 border-t border-[#57534E]/10 space-y-1 text-[#57534E]/70">
                            <div className="flex justify-between">
                              <span>Paraan ng Bayad:</span>
                              <span className="font-bold text-[#0C0A09]">{order.payment_method || "Cash"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cashier ID:</span>
                              <span className="font-mono text-[10px] text-[#57534E]/60 truncate max-w-[140px]">{order.cashier_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Petsa:</span>
                              <span className="font-bold text-[#0C0A09]">{formatDate(order.created_at)}</span>
                            </div>
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
    </div>
  );
};
