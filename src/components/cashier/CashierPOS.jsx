import { useState, useEffect } from "react";
import { Navbar } from "../shared/Navbar";
import { useAuth } from "../../context/AuthContext";
import { getProductsByStore, addProduct } from "../../services/productService";
import { placeOrder } from "../../services/orderService";
import { Html5Qrcode } from "html5-qrcode";

// Color gradients for different categories to make the grid pop visually
const categoryGradients = {
  Soda: "from-rose-400 to-rose-600 shadow-rose-100",
  Bakery: "from-amber-300 to-amber-500 shadow-amber-100",
  Chips: "from-orange-300 to-orange-500 shadow-orange-100",
  Noodles: "from-yellow-300 to-amber-500 shadow-yellow-100",
  Coffee: "from-amber-700 to-stone-700 shadow-stone-100",
  "Canned Goods": "from-slate-400 to-slate-600 shadow-slate-100",
};

// High-fidelity custom SVG icons for each category
const renderCategoryIcon = (category) => {
  switch (category) {
    case "Soda":
      return (
        <svg
          className="w-10 h-10 text-white drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <rect
            x="7"
            y="4"
            width="10"
            height="16"
            rx="2"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path
            d="M7 8h10M7 16h10M12 4V2m-2 0h4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="10" cy="13" r="1" fill="currentColor" />
          <circle cx="14" cy="11" r="1" fill="currentColor" />
        </svg>
      );
    case "Bakery":
      return (
        <svg
          className="w-10 h-10 text-white drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 11V8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path
            d="M7 4.5V13M12 4V13M17 4.5V13M3 13h18c1.1 0 2 .9 2 2v2a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "Chips":
      return (
        <svg
          className="w-10 h-10 text-white drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 3l2 2h10l2-2v18l-2-2H7l-2 2V3z"
            fill="currentColor"
            fillOpacity="0.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 9h8M7 13l3-2 4 3 3-2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
        </svg>
      );
    case "Noodles":
      return (
        <svg
          className="w-10 h-10 text-white drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            d="M3 10h18c0 4.5-3.5 8-8 8s-8-3.5-8-8z"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path d="M8 18c0 1.5 1.5 2 4 2s4-.5 4-2" strokeLinecap="round" />
          <path
            d="M6 10c0-2 1-3 2-3s2 1 2 3M10 10c0-2 1-3 2-3s2 1 2 3M14 10c0-2 1-3 2-3s2 1 2 3"
            strokeLinecap="round"
          />
          <path d="M19 4L9 11M21 4L11 12" strokeLinecap="round" />
        </svg>
      );
    case "Coffee":
      return (
        <svg
          className="w-10 h-10 text-white drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 8h12v7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8z"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path d="M17 10h2.5a2.5 2.5 0 0 1 0 5H17" strokeLinecap="round" />
          <path
            d="M8 5c0-1.5.8-2 1.5-2.5M12 5c0-1.5.8-2 1.5-2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "Canned Goods":
      return (
        <svg
          className="w-10 h-10 text-white drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <ellipse
            cx="12"
            cy="5"
            rx="6"
            ry="2"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path
            d="M6 5v12c0 1.1.9 2 6 2s6-.9 6-2V5"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <ellipse cx="12" cy="17" rx="6" ry="2" />
          <path d="M6 5v12M18 5v12M6 9h12M6 13h12" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg
          className="w-10 h-10 text-white drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      );
  }
};

export const CashierPOS = ({ embedded = false }) => {
  const { activeStoreId, currentUser, userRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [latestOrder, setLatestOrder] = useState(null);

  // States for adding a new product dynamically in POS
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "Soda",
  });
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  // Cart state & notification state
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0); // in percent
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [notification, setNotification] = useState(null);

  // Scanner states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [continuousScan, setContinuousScan] = useState(true);

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    const timer = setTimeout(() => {
      setNotification(null);
    }, 3000);
    return () => clearTimeout(timer);
  };

  const playBeep = () => {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch beep
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (err) {
      console.error("Audio beep failed:", err);
    }
  };



  useEffect(() => {
    const fetchProducts = async () => {
      await Promise.resolve();

      if (!activeStoreId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await getProductsByStore(activeStoreId);
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Hindi ma-load ang mga produkto. Subukan muli.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeStoreId]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");

    if (userRole === "staff") {
      setAddError("Hindi pinapayagan ang mga staff na magdagdag ng produkto.");
      return;
    }

    if (!newProduct.name.trim()) {
      setAddError("Kinakailangan ang pangalan ng produkto.");
      return;
    }
    const priceNum = parseFloat(newProduct.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setAddError("Maglagay ng valid na presyo (dapat mas mataas sa 0).");
      return;
    }
    const stockNum = parseInt(newProduct.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setAddError(
        "Maglagay ng valid na dami ng stock (dapat hindi bababa sa 0).",
      );
      return;
    }

    try {
      setAddingProduct(true);
      const created = await addProduct(
        {
          name: newProduct.name,
          selling_price: priceNum, // Ginawang selling_price para tugma sa admin model ninyo
          stock_quantity: stockNum, // Ginawang stock_quantity para magkasundo sa admin model
          category: newProduct.category,
        },
        activeStoreId,
      );

      setProducts((prev) => [...prev, created]);
      setAddSuccess("Matagumpay na naidagdag ang produkto!");
      setNewProduct({ name: "", price: "", stock: "", category: "Soda" });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess("");
      }, 1000);
    } catch (err) {
      console.error("Save product failed:", err);
      setAddError(
        err.message || "May naganap na error habang sine-save ang produkto.",
      );
    } finally {
      setAddingProduct(false);
    }
  };

  const addToCart = (product) => {
    // Kinukuha ang stock na may dynamic fallback para sa admin keys
    const currentStock =
      product.stock_quantity !== undefined
        ? product.stock_quantity
        : product.stock || 0;
    const itemPrice =
      product.selling_price !== undefined
        ? product.selling_price
        : product.price || 0;

    if (currentStock <= 0) {
      showNotification(
        `Paumanhin, walang natitirang stock para sa ${product.name}.`,
        "error",
      );
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= currentStock) {
          showNotification(
            `Limitadong stock: Hanggang ${currentStock} units lamang ng ${product.name} ang magagamit.`,
            "error",
          );
          return prev;
        }
        showNotification(`Idinagdag ang ${product.name} sa cart.`, "success");
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      showNotification(`Idinagdag ang ${product.name} sa cart.`, "success");
      return [
        ...prev,
        { ...product, price: itemPrice, stock: currentStock, quantity: 1 },
      ];
    });
  };

  const updateQuantity = (id, amount) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const currentStock =
      product.stock_quantity !== undefined
        ? product.stock_quantity
        : product.stock || 0;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + amount;
            if (nextQty > currentStock) {
              showNotification(
                `Limitadong stock: Hanggang ${currentStock} units lamang ng ${product.name} ang magagamit.`,
                "error",
              );
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      showNotification("Linisin ang cart.", "success");
    }
  };

  // Subtotal and Total calculations na may ligtas na fallback
  const subtotal = cart.reduce((acc, item) => {
    const price =
      item.selling_price !== undefined ? item.selling_price : item.price || 0;
    return acc + price * item.quantity;
  }, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  // Real-time synchronization to Customer Display (2nd Screen)
  useEffect(() => {
    try {
      const cartPayload = { items: cart, subtotal, discount, total };
      localStorage.setItem("customer_cart", JSON.stringify(cartPayload));

      const bc = new BroadcastChannel("customer_display");
      bc.postMessage({ type: "UPDATE_CART", ...cartPayload });
      bc.close();
    } catch (err) {
      console.error("Failed to broadcast cart update:", err);
    }
  }, [cart, subtotal, discount, total]);

  const handlePrint = (order) => {
    const orderDate = order.created_at?.toDate
      ? order.created_at
          .toDate()
          .toLocaleString("fil-PH", { dateStyle: "medium", timeStyle: "short" })
      : new Date().toLocaleString("fil-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        });

    const receiptUrl = `${window.location.origin}/receipt/${order.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(receiptUrl)}`;

    const itemsHtml =
      order.items
        ?.map((item) => {
          const price =
            item.selling_price !== undefined
              ? item.selling_price
              : item.price || 0;
          return `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div style="flex:1;padding-right:12px;">
            <span style="font-weight:700;color:#0C0A09;display:block;">${item.name}</span>
            <span style="font-size:10px;color:#57534E;">${item.quantity} x \u20B1${price.toFixed(2)}</span>
          </div>
          <span style="font-weight:700;color:#0C0A09;">\u20B1${(item.quantity * price).toFixed(2)}</span>
        </div>
      `;
        })
        .join("") || "";

    const discountHtml =
      order.discount > 0
        ? `
      <div style="display:flex;justify-content:space-between;color:#F97316;">
        <span>Discount (${order.discount}%):</span>
        <span style="font-weight:700;">-\u20B1${((order.subtotal * order.discount) / 100).toFixed(2)}</span>
      </div>
    `
        : "";

    const printHtml = `
      <!DOCTYPE html>
      <html lang="tl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Resibo - ${order.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', Courier, monospace; background: white; color: #000; }
          .receipt { width: 80mm; margin: 0 auto; padding: 16px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div style="text-align:center;padding-bottom:12px;border-bottom:1px dashed #aaa;margin-bottom:12px;">
            <div style="font-size:20px;font-weight:900;color:#064E3B;letter-spacing:-0.5px;">POS-by-KYUT</div>
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
              <span style="font-weight:700;color:#0C0A09;">\u20B1${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            ${discountHtml}
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:900;color:#0C0A09;padding-top:8px;border-top:1px dashed #ccc;margin-top:6px;">
              <span>KABUUAN:</span>
              <span style="color:#064E3B;">\u20B1${(order.total || 0).toFixed(2)}</span>
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
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showNotification(
        "Mangyaring magdagdag muna ng produkto sa cart.",
        "error",
      );
      return;
    }

    try {
      setCheckoutLoading(true);

      const orderData = {
        store_id: activeStoreId,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price:
            item.selling_price !== undefined
              ? item.selling_price
              : item.price || 0,
          quantity: item.quantity,
          category: item.category,
        })),
        subtotal,
        discount,
        total,
        payment_method: "Cash",
        cashier_id: currentUser?.uid || "unknown",
        cashier_name:
          currentUser?.fullName ||
          currentUser?.displayName ||
          currentUser?.email ||
          "Cashier",
      };

      const result = await placeOrder(orderData);

      const data = await getProductsByStore(activeStoreId);
      setProducts(data);

      setLatestOrder(result);
      setShowReceipt(true);
      showNotification(
        `Matagumpay ang Checkout! Order ID: ${result.id}`,
        "success",
      );
      setCart([]);
    } catch (err) {
      console.error("Checkout failed:", err);
      showNotification("Hindi ma-proseso ang checkout. Subukan muli.", "error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const categories = [
    "All",
    "Soda",
    "Bakery",
    "Chips",
    "Noodles",
    "Coffee",
    "Canned Goods",
  ];

  const filteredCatalog = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch =
      (product.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const posBody = (
    <>
      {/* Left Side: Product Catalog */}
      <div className="flex-1 bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#57534E]/10">
          <div>
            <h2 className="text-xl font-extrabold text-[#064E3B]">
              Katalogo ng Produkto
            </h2>
            <p className="text-xs text-[#57534E]">
              Pumili ng produkto para idagdag sa kasalukuyang cart
            </p>
          </div>
          <div className="flex items-center gap-3.5 self-start sm:self-center">
            {activeStoreId && (
              <>
                <span className="text-[10px] font-bold text-[#57534E] uppercase tracking-wider bg-[#57534E]/10 px-2.5 py-1.5 rounded-xl">
                  Store ID: {activeStoreId}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Search & Filtering Area */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#57534E]/50">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Maghanap ng produkto ayon sa pangalan o kategorya..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#FAFAF9] border border-[#57534E]/20 rounded-xl text-sm text-[#0C0A09] placeholder-[#57534E]/50 focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#57534E]/60 hover:text-[#0C0A09] cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-4.5 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white rounded-xl flex items-center justify-center transition shadow-sm cursor-pointer border border-[#064E3B]/10 active:scale-[0.98]"
              title="I-scan ang Barcode ng Produkto"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5H5V19H3V5ZM7 5H8V19H7V5ZM10 5H12V19H10V5ZM14 5H15V19H15V5ZM17 5H18V19H17V5ZM20 5H21V19H20V5Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2 12H22"
                  stroke="#F97316"
                  strokeWidth="2.5"
                  className="animate-pulse"
                />
              </svg>
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#064E3B] text-white shadow-md border border-transparent"
                    : "bg-[#FAFAF9] text-[#57534E] hover:bg-[#57534E]/10 border border-[#57534E]/15"
                }`}
              >
                {cat === "All" ? "Lahat ng Kategorya" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto max-h-[550px] pr-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <svg
                className="animate-spin h-8 w-8 text-[#064E3B]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-xs text-[#57534E] mt-3 font-semibold">
                Kinukuha ang mga produkto...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-[#F97316]">
              <p className="text-sm font-bold">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-[#57534E] hover:bg-[#57534E]/90 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                I-refresh
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-[#57534E]/10 rounded-2xl p-6 bg-[#FAFAF9]">
              <div className="p-3.5 bg-[#57534E]/5 text-[#57534E]/60 rounded-full mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m16 0h-16"
                  />
                </svg>
              </div>
              <h3 className="font-extrabold text-sm text-[#0C0A09]">
                Walang Produkto sa Tindahang Ito
              </h3>
              <p className="text-xs text-[#57534E] mt-1 max-w-[240px] leading-relaxed">
                Wala pang paninda ang tindahang ito sa database. Pumunta sa Admin Dashboard upang magdagdag ng produkto.
              </p>
            </div>
          ) : filteredCatalog.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredCatalog.map((product) => {
                // Pag-handle sa parehong field names (admin vs POS original fields) upang ligtas basahin
                const itemPrice =
                  product.selling_price !== undefined
                    ? product.selling_price
                    : product.price || 0;
                const currentStock =
                  product.stock_quantity !== undefined
                    ? product.stock_quantity
                    : product.stock || 0;

                const isOutOfStock = currentStock <= 0;
                const isLowStock = currentStock > 0 && currentStock <= 10;
                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`group relative p-4 rounded-2xl border border-[#57534E]/15 bg-white transition-all duration-300 flex flex-col justify-between ${
                      isOutOfStock
                        ? "opacity-60 cursor-not-allowed bg-stone-50"
                        : "cursor-pointer hover:shadow-lg hover:border-[#064E3B]/40 hover:-translate-y-1 active:scale-[0.98]"
                    }`}
                  >
                    <div
                      className={`aspect-video w-full rounded-xl flex items-center justify-center bg-gradient-to-br ${categoryGradients[product.category] || "from-rose-400 to-rose-600 shadow-rose-100"} p-4 mb-4 relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02] shadow-sm`}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {renderCategoryIcon(product.category)}
                      <span className="absolute top-2 left-2 text-[9px] uppercase font-extrabold tracking-wider bg-white/90 text-[#0C0A09] px-2 py-0.5 rounded-lg shadow-sm">
                        {product.category}
                      </span>
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-xl shadow-md">
                            Walang Stock
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#0C0A09] group-hover:text-[#064E3B] transition-colors line-clamp-2 min-h-[40px]">
                          {product.name}
                        </h4>
                        <div className="mt-2 flex items-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              0 stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Mababa ({currentStock} left)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#064E3B] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B]" />
                              May stock ({currentStock})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#57534E]/60 uppercase font-bold leading-none">
                            Presyo
                          </span>
                          {/* LIGTAS NA PUSH: Dito naayos ang toFixed crash gamit ang fallback local variable key */}
                          <span className="font-extrabold text-[#064E3B] text-base">
                            ₱{itemPrice.toFixed(2)}
                          </span>
                        </div>
                        {!isOutOfStock && (
                          <span className="w-8 h-8 rounded-xl bg-stone-100 text-[#57534E] group-hover:bg-[#064E3B] group-hover:text-white transition-all flex items-center justify-center shadow-sm">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#FAFAF9] rounded-2xl border border-dashed border-[#57534E]/20 flex flex-col justify-center items-center">
              <svg
                className="w-12 h-12 text-[#57534E]/40 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-sm font-bold text-[#57534E]">
                Walang nahanap na produkto.
              </p>
              <p className="text-xs text-[#57534E]/70 mt-1">
                Subukang baguhin ang iyong keyword o filter.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: POS Checkout Cart */}
      <div className="w-full lg:w-96 bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm flex flex-col justify-between min-h-[500px]">
        <div>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#57534E]/10">
            <h3 className="text-lg font-bold text-[#064E3B] flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 100-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              Kasalukuyang Cart
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.open("/pos/customer-display", "CustomerDisplay", "width=1000,height=700")}
                className="text-[10px] uppercase font-bold text-[#064E3B] hover:text-[#064E3B]/80 flex items-center gap-1.5 bg-[#064E3B]/10 hover:bg-[#064E3B]/15 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                title="Buksan ang Display sa Customer Monitor"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Customer Display
              </button>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-[#F97316] font-bold hover:underline cursor-pointer"
                >
                  I-clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {cart.map((item) => {
              const price =
                item.selling_price !== undefined
                  ? item.selling_price
                  : item.price || 0;
              return (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-xs p-2 bg-[#FAFAF9] rounded-lg border border-[#57534E]/5"
                >
                  <div className="max-w-[140px] truncate">
                    <span className="font-bold text-[#0C0A09] block">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-[#57534E]">
                      ₱{price} bawat isa
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-full bg-white border border-[#57534E]/20 text-[#57534E] hover:bg-[#57534E]/10 flex items-center justify-center font-bold transition cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-extrabold w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-full bg-white border border-[#57534E]/20 text-[#57534E] hover:bg-[#57534E]/10 flex items-center justify-center font-bold transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold text-[#0C0A09] w-12 text-right">
                    ₱{(price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
            {cart.length === 0 && (
              <div className="text-center py-12 text-[#57534E]/50">
                <svg
                  className="w-10 h-10 mx-auto text-[#57534E]/30 mb-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5h6.75"
                  />
                </svg>
                <p className="text-xs font-bold">Walang produkto sa cart.</p>
                <p className="text-[10px] mt-0.5">
                  Pumili ng mga item sa katalogo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Calculations & Checkout */}
        <div className="pt-4 border-t border-[#57534E]/10 mt-6 space-y-3">
          <div className="flex justify-between text-xs text-[#57534E] font-medium">
            <span>Subtotal:</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-[#57534E] font-medium items-center">
            <span>Discount (%):</span>
            <select
              className="bg-[#FAFAF9] border border-[#57534E]/20 rounded px-1.5 py-0.5 text-xs text-[#0C0A09] focus:outline-none focus:border-[#064E3B]"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            >
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={10}>10%</option>
              <option value={20}>20%</option>
            </select>
          </div>
          <div className="flex justify-between text-sm font-extrabold text-[#0C0A09] pt-2 border-t border-dashed border-[#57534E]/10">
            <span>Kabuuang Halaga:</span>
            <span className="text-lg text-[#064E3B]">₱{total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-md cursor-pointer mt-4 flex items-center justify-center gap-2 hover:shadow-lg active:scale-[0.99]"
          >
            {checkoutLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Pinoproseso ang Bayad...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Iproseso ang Bayad</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 border transition-all duration-300 ${
            notification.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {notification.type === "error" ? (
            <div className="bg-rose-100 p-1 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-rose-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ) : (
            <div className="bg-emerald-100 p-1 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-emerald-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <span className="text-xs font-extrabold tracking-wide">
            {notification.message}
          </span>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && latestOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#57534E]/10 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4 pb-2 border-b border-[#57534E]/10">
              <h3 className="font-bold text-[#064E3B] text-base flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/xl"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Matagumpay na Bayad!
              </h3>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setLatestOrder(null);
                }}
                className="text-xs text-[#57534E] font-bold hover:underline cursor-pointer"
              >
                Isara
              </button>
            </div>
            <div
              id="printable-receipt"
              className="w-full bg-white p-4 border border-dashed border-[#57534E]/30 rounded-xl flex flex-col text-xs font-sans text-black"
            >
              <div className="text-center pb-3 border-b border-dashed border-[#57534E]/20">
                <span className="text-[#064E3B] font-extrabold text-xl tracking-tight block">
                  POS-by-KYUT
                </span>
                <p className="text-[9px] font-bold text-[#57534E] uppercase tracking-wider mt-0.5">
                  Store Receipt
                </p>
                <div className="text-[9px] text-[#57534E]/80 mt-1.5 font-mono space-y-0.5 text-left">
                  <div>STORE ID: {latestOrder.store_id}</div>
                  <div>TXID: {latestOrder.id}</div>
                  <div>
                    DATE:{" "}
                    {latestOrder.created_at?.toDate
                      ? latestOrder.created_at
                          .toDate()
                          .toLocaleString("fil-PH", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                      : new Date().toLocaleString("fil-PH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                  </div>
                </div>
              </div>
              <div className="py-3 border-b border-dashed border-[#57534E]/20">
                <div className="font-bold text-[9px] uppercase text-[#57534E] tracking-wider mb-1.5 flex justify-between">
                  <span>Produkto</span>
                  <span>Halaga</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {latestOrder.items?.map((item, idx) => {
                    const price =
                      item.selling_price !== undefined
                        ? item.selling_price
                        : item.price || 0;
                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-start"
                      >
                        <div className="flex-1 pr-3">
                          <span className="font-bold text-black">
                            {item.name}
                          </span>
                          <span className="text-[9px] text-[#57534E] block">
                            {item.quantity} x ₱{price.toFixed(2)}
                          </span>
                        </div>
                        <span className="font-bold text-black">
                          ₱{(item.quantity * price).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="py-3 border-b border-dashed border-[#57534E]/20 space-y-1 font-mono text-[11px] text-[#57534E]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-black">
                    ₱{(latestOrder.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                {latestOrder.discount > 0 && (
                  <div className="flex justify-between text-[#F97316]">
                    <span>Discount ({latestOrder.discount}%):</span>
                    <span className="font-bold">
                      -₱
                      {(
                        (latestOrder.subtotal * latestOrder.discount) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[12px] font-extrabold text-black pt-1.5 border-t border-dashed border-[#57534E]/10">
                  <span>KABUUAN:</span>
                  <span className="text-sm text-[#064E3B]">
                    ₱{(latestOrder.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="py-3 text-center text-[9px] text-[#57534E]/80 border-b border-dashed border-[#57534E]/10">
                <div>
                  Cashier:{" "}
                  <strong className="font-bold">
                    {latestOrder.cashier_name}
                  </strong>
                </div>
                <div className="mt-1.5 text-[#064E3B] font-bold">
                  Maraming salamat po!
                </div>
              </div>
              <div className="pt-4 flex flex-col items-center justify-center text-center">
                <div className="p-1.5 bg-white border border-[#57534E]/15 rounded-lg shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(`${window.location.origin}/receipt/${latestOrder.id}`)}`}
                    alt="Receipt QR"
                    className="w-24 h-24 select-none"
                  />
                </div>
                <span className="text-[8px] uppercase font-bold text-[#57534E]/50 tracking-wider mt-2">
                  Scan QR to view online receipt
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2 w-full">
              <button
                onClick={() => handlePrint(latestOrder)}
                className="flex-1 py-2.5 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setLatestOrder(null);
                }}
                className="flex-1 py-2.5 bg-white hover:bg-[#FAFAF9] text-[#57534E] font-bold rounded-xl text-xs transition border border-[#57534E]/25 text-center flex items-center justify-center cursor-pointer"
              >
                Bagong Order
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Modal: Barcode Scanner */}
      {isScannerOpen && (
        <BarcodeScannerModal
          products={products}
          addToCart={addToCart}
          playBeep={playBeep}
          showNotification={showNotification}
          continuousScan={continuousScan}
          setContinuousScan={setContinuousScan}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </>
  );

  if (embedded) {
    return <div className="font-sans text-[#0C0A09]">{posBody}</div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {posBody}
      </div>
    </div>
  );
};

const BarcodeScannerModal = ({
  products,
  addToCart,
  playBeep,
  showNotification,
  continuousScan,
  setContinuousScan,
  onClose,
}) => {
  const [scannerError, setScannerError] = useState("");
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isHttpsOrLocalhost, setIsHttpsOrLocalhost] = useState(true);

  useEffect(() => {
    // Check HTTPS or localhost
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    setIsHttpsOrLocalhost(isSecure);

    const html5QrCode = new Html5Qrcode("barcode-scanner-viewport");
    let isMounted = true;

    const startScanner = async () => {
      try {
        setScannerError("");

        // Wait for element to render in DOM
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!isMounted) return;

        await html5QrCode.start(
          { facingMode: "environment" }, // back camera on mobile
          {
            fps: 15,
            qrbox: (width, height) => {
              // Rectangle box layout optimized for linear barcodes
              const boxWidth = Math.min(width * 0.85, 280);
              const boxHeight = Math.min(height * 0.35, 100);
              return {
                x: (width - boxWidth) / 2,
                y: (height - boxHeight) / 2,
                width: boxWidth,
                height: boxHeight,
              };
            },
            aspectRatio: 1.333333,
          },
          (decodedText) => {
            // Handle Success
            playBeep();

            // Look up product
            const matched = products.find(
              (p) =>
                p.barcode_sku?.trim().toLowerCase() ===
                decodedText.trim().toLowerCase(),
            );

            if (matched) {
              addToCart(matched);
              showNotification(
                `Nahanap at naidagdag sa cart: ${matched.name}`,
                "success",
              );
              if (!continuousScan) {
                onClose();
              }
            } else {
              showNotification(
                `Walang produkto para sa barcode: "${decodedText}"`,
                "error",
              );
            }
          },
          (errorMessage) => {
            // Frame analysis fail (silent)
          },
        );
      } catch (err) {
        console.error("Camera scan start error:", err);
        if (
          err.name === "NotAllowedError" ||
          err.message?.includes("Permission")
        ) {
          setHasCameraPermission(false);
        } else {
          setScannerError(
            err.message ||
              "Hindi masimulan ang camera. Pakisuri kung may iba pang gumagamit nito.",
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .catch((err) => console.error("Scanner clean stop error:", err));
      }
    };
  }, [products, continuousScan]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="font-extrabold text-[#064E3B] text-sm uppercase tracking-wider">
              Barcode Camera Scanner
            </h3>
            <p className="text-[10px] text-stone-500 mt-0.5">
              Itapat ang pulang linya sa barcode ng produkto
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition p-1 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black aspect-square w-full flex items-center justify-center overflow-hidden">
          {/* html5-qrcode target viewport */}
          <div id="barcode-scanner-viewport" className="w-full h-full"></div>

          {/* Scanner boundary overlay helper (CSS Target Box) */}
          {hasCameraPermission && isHttpsOrLocalhost && !scannerError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Outer darkened overlay */}
              <div className="absolute inset-0 bg-black/40"></div>

              {/* Clear target viewport window */}
              <div className="relative w-[280px] h-[100px] border-2 border-dashed border-[#064E3B] bg-transparent rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex items-center justify-center">
                {/* Glowing red scanner beam line */}
                <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-bounce"></div>

                {/* Corner styling to highlight viewport boundaries */}
                <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-4 border-l-4 border-emerald-500 rounded-tl-sm"></div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-4 border-r-4 border-emerald-500 rounded-tr-sm"></div>
                <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-4 border-l-4 border-emerald-500 rounded-bl-sm"></div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-4 border-r-4 border-emerald-500 rounded-br-sm"></div>
              </div>
            </div>
          )}

          {/* Error Message overlays */}
          {!isHttpsOrLocalhost && (
            <div className="absolute inset-0 bg-stone-900/95 p-6 flex flex-col items-center justify-center text-center text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-amber-500 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m0-8v6m0 5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Secure Origin Required
              </h4>
              <p className="text-[11px] text-stone-300 mt-2 max-w-[240px] leading-relaxed">
                Ang camera access sa mobile ay pinapayagan lamang sa secure
                connections (**HTTPS**).
              </p>
              <p className="text-[10px] text-stone-400 mt-3.5 bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                Pansamantalang gamitin ang input search o ilipat ang site sa
                isang HTTPS tunnel (tulad ng ngrok) para gumana sa mobile.
              </p>
            </div>
          )}

          {isHttpsOrLocalhost && !hasCameraPermission && (
            <div className="absolute inset-0 bg-stone-900/95 p-6 flex flex-col items-center justify-center text-center text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-rose-500 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Blocked Camera
              </h4>
              <p className="text-[11px] text-stone-300 mt-2 max-w-[240px] leading-relaxed">
                Tinanggihan ang pahintulot sa camera. Mangyaring bigyan ang
                browser ng access sa camera sa inyong settings.
              </p>
            </div>
          )}

          {isHttpsOrLocalhost && hasCameraPermission && scannerError && (
            <div className="absolute inset-0 bg-stone-900/95 p-6 flex flex-col items-center justify-center text-center text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-amber-500 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Scanner Error
              </h4>
              <p className="text-[11px] text-stone-300 mt-2 leading-relaxed">
                {scannerError}
              </p>
            </div>
          )}
        </div>

        {/* Controls / Options footer */}
        <div className="p-5 bg-stone-50 border-t border-stone-100 flex flex-col gap-3">
          <label className="flex items-center justify-between cursor-pointer py-1.5 px-3 bg-white rounded-xl border border-stone-200 shadow-sm active:scale-[0.99] transition">
            <span className="text-xs font-bold text-stone-600">
              Continuous Mode (Multi-scan)
            </span>
            <input
              type="checkbox"
              checked={continuousScan}
              onChange={(e) => setContinuousScan(e.target.checked)}
              className="w-4 h-4 rounded text-[#064E3B] focus:ring-[#064E3B]/20 cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer text-center"
          >
            Isara
          </button>
        </div>
      </div>
    </div>
  );
};
