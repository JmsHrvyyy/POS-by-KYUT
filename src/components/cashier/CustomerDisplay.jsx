import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

export const CustomerDisplay = () => {
  const { t, language } = useLanguage();
  const [cartData, setCartData] = useState(() => {
    try {
      const saved = localStorage.getItem("customer_cart");
      return saved ? JSON.parse(saved) : { items: [], subtotal: 0, discount: 0, total: 0 };
    } catch (err) {
      console.error("Error loading customer cart on mount:", err);
      return { items: [], subtotal: 0, discount: 0, total: 0 };
    }
  });

  const [time, setTime] = useState(new Date());

  // 1. Digital Clock effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. BroadcastChannel setup
  useEffect(() => {
    // Subscribe to BroadcastChannel
    const channel = new BroadcastChannel("customer_display");
    channel.onmessage = (event) => {
      if (event.data && event.data.type === "UPDATE_CART") {
        setCartData({
          items: event.data.items || [],
          subtotal: event.data.subtotal || 0,
          discount: event.data.discount || 0,
          total: event.data.total || 0,
        });
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const { items, subtotal, discount, total } = cartData;
  const formattedTime = time.toLocaleTimeString(language === "fil" ? "fil-PH" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formattedDate = time.toLocaleDateString(language === "fil" ? "fil-PH" : "en-US", { dateStyle: "long" });

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09] flex flex-col md:flex-row overflow-hidden select-none">
      {/* LEFT PANEL: Store Welcome & Clock */}
      <div className="w-full md:w-[45%] bg-[#064E3B] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative subtle abstract backgrounds */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Branding header */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-extrabold text-2xl tracking-tight uppercase">
            POS-by-KYUT
          </span>
        </div>

        {/* Welcome greeting / Animations */}
        <div className="relative z-10 my-auto py-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {t("welcomeGreeting")}
          </h1>
          <p className="text-lg text-emerald-100/90 mt-4 leading-relaxed max-w-sm">
            {t("supportMessage")}
          </p>
          <div className="mt-8 flex gap-2">
            <span className="h-1.5 w-12 rounded-full bg-emerald-400"></span>
            <span className="h-1.5 w-3 rounded-full bg-emerald-400/50"></span>
            <span className="h-1.5 w-3 rounded-full bg-emerald-400/30"></span>
          </div>
        </div>

        {/* Real-time Clock display */}
        <div className="relative z-10 border-t border-emerald-500/20 pt-6">
          <div className="text-3xl font-mono font-extrabold tracking-widest text-emerald-300">
            {formattedTime}
          </div>
          <div className="text-xs text-emerald-100/70 font-semibold mt-1 uppercase tracking-wider">
            {formattedDate}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live Cart view */}
      <div className="flex-1 p-8 sm:p-12 flex flex-col justify-between bg-white shadow-inner">
        {items.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col justify-center items-center text-center p-6 animate-fadeIn">
            <div className="p-6 bg-emerald-50 text-[#064E3B] rounded-full mb-6 relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute top-4 right-4 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0C0A09] tracking-tight">
              {t("welcomeCustomer")}
            </h2>
            <p className="text-sm text-[#57534E] mt-2 max-w-[280px] leading-relaxed">
              {t("readyToProcess")}
            </p>
          </div>
        ) : (
          /* ACTIVE CART ITEMS DISPLAY */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Header indicator */}
            <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#064E3B] uppercase tracking-wider">
                  {t("purchaseDetails")}
                </h2>
                <p className="text-xs text-stone-500">{t("cartListDesc")}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 border border-emerald-200 text-[#064E3B] px-3 py-1 rounded-xl">
                {items.length} {t("itemsCount")}
              </span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto pr-2 divide-y divide-stone-100 max-h-[50vh] min-h-[200px] scrollbar-thin">
              {items.map((item) => (
                <div key={item.id} className="py-4.5 flex justify-between items-start animate-fadeIn">
                  <div className="max-w-[70%]">
                    <span className="font-extrabold text-stone-900 block text-base leading-snug">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-stone-500 font-semibold mt-1 inline-flex items-center gap-1.5 uppercase bg-stone-100 px-2.5 py-0.5 rounded-lg">
                      Qty: <strong className="text-stone-950 font-bold">{item.quantity}</strong> 
                      <span className="text-stone-300">|</span> 
                      ₱{(item.price || 0).toFixed(2)} {t("eachPrice")}
                    </span>
                  </div>
                  <span className="font-extrabold text-stone-950 text-base font-mono">
                    ₱{(item.quantity * (item.price || 0)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Pricing panel */}
            <div className="border-t border-stone-200 pt-6 mt-6 bg-stone-50/50 p-6 rounded-2xl border border-stone-100 shadow-sm">
              <div className="space-y-2.5 text-xs text-stone-600">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="font-bold text-stone-900 font-mono">₱{(subtotal || 0).toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-orange-600">
                    <span className="font-semibold">Discount ({discount}%):</span>
                    <span className="font-bold font-mono">-₱{((subtotal * discount) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-stone-200 mt-2">
                  <span className="text-sm font-extrabold text-stone-900 uppercase">{t("totalAmountLabel")}</span>
                  <span className="text-2xl font-black text-[#064E3B] font-mono leading-none">
                    ₱{(total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
