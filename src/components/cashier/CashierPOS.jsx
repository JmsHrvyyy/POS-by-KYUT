import { useState, useEffect } from "react";
import { Navbar } from "../shared/Navbar";
import { useAuth } from "../../context/AuthContext";
import { getProductsByStore, addProduct } from "../../services/productService";
import { placeOrder } from "../../services/orderService";

// Color gradients for different categories to make the grid pop visually
const categoryGradients = {
  Soda: "from-rose-400 to-rose-600 shadow-rose-100",
  Bakery: "from-amber-300 to-amber-500 shadow-amber-100",
  Chips: "from-orange-300 to-orange-500 shadow-orange-100",
  Noodles: "from-yellow-300 to-amber-500 shadow-yellow-100",
  Coffee: "from-amber-700 to-stone-700 shadow-stone-100",
  "Canned Goods": "from-slate-400 to-slate-600 shadow-slate-100"
};

// High-fidelity custom SVG icons for each category
const renderCategoryIcon = (category) => {
  switch (category) {
    case "Soda":
      return (
        <svg className="w-10 h-10 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <rect x="7" y="4" width="10" height="16" rx="2" fill="currentColor" fillOpacity="0.2" />
          <path d="M7 8h10M7 16h10M12 4V2m-2 0h4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="10" cy="13" r="1" fill="currentColor" />
          <circle cx="14" cy="11" r="1" fill="currentColor" />
        </svg>
      );
    case "Bakery":
      return (
        <svg className="w-10 h-10 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M5 11V8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="currentColor" fillOpacity="0.2" />
          <path d="M7 4.5V13M12 4V13M17 4.5V13M3 13h18c1.1 0 2 .9 2 2v2a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "Chips":
      return (
        <svg className="w-10 h-10 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M5 3l2 2h10l2-2v18l-2-2H7l-2 2V3z" fill="currentColor" fillOpacity="0.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 9h8M7 13l3-2 4 3 3-2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
        </svg>
      );
    case "Noodles":
      return (
        <svg className="w-10 h-10 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M3 10h18c0 4.5-3.5 8-8 8s-8-3.5-8-8z" fill="currentColor" fillOpacity="0.2" />
          <path d="M8 18c0 1.5 1.5 2 4 2s4-.5 4-2" strokeLinecap="round"/>
          <path d="M6 10c0-2 1-3 2-3s2 1 2 3M10 10c0-2 1-3 2-3s2 1 2 3M14 10c0-2 1-3 2-3s2 1 2 3" strokeLinecap="round"/>
          <path d="M19 4L9 11M21 4L11 12" strokeLinecap="round" />
        </svg>
      );
    case "Coffee":
      return (
        <svg className="w-10 h-10 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M5 8h12v7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8z" fill="currentColor" fillOpacity="0.2" />
          <path d="M17 10h2.5a2.5 2.5 0 0 1 0 5H17" strokeLinecap="round" />
          <path d="M8 5c0-1.5.8-2 1.5-2.5M12 5c0-1.5.8-2 1.5-2.5" strokeLinecap="round"/>
        </svg>
      );
    case "Canned Goods":
      return (
        <svg className="w-10 h-10 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <ellipse cx="12" cy="5" rx="6" ry="2" fill="currentColor" fillOpacity="0.3" />
          <path d="M6 5v12c0 1.1.9 2 6 2s6-.9 6-2V5" fill="currentColor" fillOpacity="0.1" />
          <ellipse cx="12" cy="17" rx="6" ry="2" />
          <path d="M6 5v12M18 5v12M6 9h12M6 13h12" strokeLinecap="round"/>
        </svg>
      );
    default:
      return (
        <svg className="w-10 h-10 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
  }
};

export const CashierPOS = () => {
  const { activeStoreId, currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Cart state & notification state
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0); // in percent
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    const timer = setTimeout(() => {
      setNotification(null);
    }, 3000);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      // Force asynchronous execution in the microtask queue to avoid synchronous setState inside useEffect
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

  const handleSeedProducts = async () => {
    if (!activeStoreId) return;
    try {
      setSeeding(true);
      setError("");
      
      const seedItems = [
        { name: "Coca-Cola 1.5L", price: 65, category: "Soda", stock: 12 },
        { name: "Gardenia Classic Bread", price: 78, category: "Bakery", stock: 8 },
        { name: "Piattos Cheese Big", price: 38, category: "Chips", stock: 25 },
        { name: "Lucky Me Pancit Canton", price: 16, category: "Noodles", stock: 45 },
        { name: "Kopiko Blanca Mix", price: 10, category: "Coffee", stock: 60 },
        { name: "Purefoods Corned Beef", price: 85, category: "Canned Goods", stock: 15 }
      ];

      for (const item of seedItems) {
        await addProduct(item, activeStoreId);
      }

      // Re-fetch products
      const data = await getProductsByStore(activeStoreId);
      setProducts(data);
      alert("Matagumpay na na-seed ang mga sample products!");
    } catch (err) {
      console.error("Error seeding products:", err);
      setError("Hindi ma-seed ang mga produkto. Subukan muli.");
    } finally {
      setSeeding(false);
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      showNotification(`Paumanhin, walang natitirang stock para sa ${product.name}.`, "error");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showNotification(`Limitadong stock: Hanggang ${product.stock} units lamang ng ${product.name} ang magagamit.`, "error");
          return prev;
        }
        showNotification(`Idinagdag ang ${product.name} sa cart.`, "success");
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      showNotification(`Idinagdag ang ${product.name} sa cart.`, "success");
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, amount) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + amount;
            if (nextQty > product.stock) {
              showNotification(`Limitadong stock: Hanggang ${product.stock} units lamang ng ${product.name} ang magagamit.`, "error");
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      showNotification("Linisin ang cart.", "success");
    }
  };

  // Subtotal and Total calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showNotification("Mangyaring magdagdag muna ng produkto sa cart.", "error");
      return;
    }

    try {
      setCheckoutLoading(true);

      const orderData = {
        store_id: activeStoreId,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category
        })),
        subtotal,
        discount,
        total,
        payment_method: "Cash",
        cashier_id: currentUser?.uid || "unknown",
        cashier_name: currentUser?.fullName || currentUser?.displayName || currentUser?.email || "Cashier"
      };

      const result = await placeOrder(orderData);

      // Re-fetch products from Firestore to get updated stock levels
      const data = await getProductsByStore(activeStoreId);
      setProducts(data);

      showNotification(`Matagumpay ang Checkout! Order ID: ${result.id}`, "success");
      setCart([]);
    } catch (err) {
      console.error("Checkout failed:", err);
      showNotification("Hindi ma-proseso ang checkout. Subukan muli.", "error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Category filtering options
  const categories = ["All", "Soda", "Bakery", "Chips", "Noodles", "Coffee", "Canned Goods"];

  // Filter and search logic
  const filteredCatalog = products.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch =
      (product.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Product Catalog */}
        <div className="flex-1 bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm flex flex-col">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#57534E]/10">
            <div>
              <h2 className="text-xl font-extrabold text-[#064E3B]">Katalogo ng Produkto</h2>
              <p className="text-xs text-[#57534E]">Pumili ng produkto para idagdag sa kasalukuyang cart</p>
            </div>
            {activeStoreId && (
              <span className="self-start sm:self-center text-[10px] font-bold text-[#57534E] uppercase tracking-wider bg-[#57534E]/10 px-2.5 py-1.5 rounded-xl">
                Store ID: {activeStoreId}
              </span>
            )}
          </div>

          {/* Search & Filtering Area */}
          <div className="space-y-4 mb-6">
            {/* Search Bar Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#57534E]/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-stone-200">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#064E3B] text-white shadow-md shadow-[#064E3B]/10 border border-transparent"
                      : "bg-[#FAFAF9] text-[#57534E] hover:bg-[#57534E]/10 border border-[#57534E]/15"
                  }`}
                >
                  {cat === "All" ? "Lahat ng Kategorya" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grid View */}
          <div className="flex-1 overflow-y-auto max-h-[550px] pr-1 scrollbar-thin flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <svg className="animate-spin h-8 w-8 text-[#064E3B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xs text-[#57534E] mt-3 font-semibold">Kinukuha ang mga produkto...</p>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m16 0h-16" />
                  </svg>
                </div>
                <h3 className="font-extrabold text-sm text-[#0C0A09]">Walang Produkto sa Tindahang Ito</h3>
                <p className="text-xs text-[#57534E] mt-1 max-w-[240px] leading-relaxed">
                  Wala pang paninda ang tindahang ito sa database.
                </p>
                <button
                  onClick={handleSeedProducts}
                  disabled={seeding}
                  className="mt-4 px-4 py-2.5 bg-[#064E3B] hover:bg-[#064E3B]/90 disabled:bg-[#064E3B]/70 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {seeding ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Nagsi-seed...</span>
                    </>
                  ) : (
                    <span>Mag-seed ng Sample Products</span>
                  )}
                </button>
              </div>
            ) : filteredCatalog.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filteredCatalog.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 10;
                  
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
                      {/* Product Visual Container (Image/Icon) */}
                      <div className={`aspect-video w-full rounded-xl flex items-center justify-center bg-gradient-to-br ${categoryGradients[product.category] || "from-rose-400 to-rose-600 shadow-rose-100"} p-4 mb-4 relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02] shadow-sm`}>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {renderCategoryIcon(product.category)}

                        {/* Category Tag overlay */}
                        <span className="absolute top-2 left-2 text-[9px] uppercase font-extrabold tracking-wider bg-white/90 text-[#0C0A09] px-2 py-0.5 rounded-lg shadow-sm">
                          {product.category}
                        </span>

                        {/* Out of Stock overlay text */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-xl shadow-md">
                              Walang Stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#0C0A09] group-hover:text-[#064E3B] transition-colors line-clamp-2 min-h-[40px]">
                            {product.name}
                          </h4>
                          
                          {/* Stock Count with Status Badge */}
                          <div className="mt-2 flex items-center">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                0 stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Mababa ({product.stock} left)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#064E3B] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B]" />
                                May stock ({product.stock})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Row: Price & Action */}
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#57534E]/60 uppercase font-bold leading-none">Presyo</span>
                            <span className="font-extrabold text-[#064E3B] text-base">₱{product.price.toFixed(2)}</span>
                          </div>
                          
                          {/* Add button indicator */}
                          {!isOutOfStock && (
                            <span className="w-8 h-8 rounded-xl bg-stone-100 text-[#57534E] group-hover:bg-[#064E3B] group-hover:text-white transition-all flex items-center justify-center shadow-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
                <svg className="w-12 h-12 text-[#57534E]/40 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm font-bold text-[#57534E]">Walang nahanap na produkto.</p>
                <p className="text-xs text-[#57534E]/70 mt-1">Subukang baguhin ang iyong keyword o filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: POS Checkout Cart */}
        <div className="w-full lg:w-96 bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#57534E]/10">
              <h3 className="text-lg font-bold text-[#064E3B] flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 100-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Kasalukuyang Cart
              </h3>
              {cart.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-xs text-[#F97316] font-bold hover:underline cursor-pointer"
                >
                  I-clear
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-[#FAFAF9] rounded-lg border border-[#57534E]/5">
                  <div className="max-w-[140px] truncate">
                    <span className="font-bold text-[#0C0A09] block">{item.name}</span>
                    <span className="text-[10px] text-[#57534E]">₱{item.price} bawat isa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-full bg-white border border-[#57534E]/20 text-[#57534E] hover:bg-[#57534E]/10 flex items-center justify-center font-bold transition cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-extrabold w-5 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-full bg-white border border-[#57534E]/20 text-[#57534E] hover:bg-[#57534E]/10 flex items-center justify-center font-bold transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold text-[#0C0A09] w-12 text-right">₱{item.price * item.quantity}</span>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="text-center py-12 text-[#57534E]/50">
                  <svg className="w-10 h-10 mx-auto text-[#57534E]/30 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5h6.75" />
                  </svg>
                  <p className="text-xs font-bold">Walang produkto sa cart.</p>
                  <p className="text-[10px] mt-0.5">Pumili ng mga item sa katalogo.</p>
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
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Pinoproseso ang Bayad...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Iproseso ang Bayad</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 border transition-all duration-300 scale-100 ${
          notification.type === "error" 
            ? "bg-rose-50 text-rose-800 border-rose-200 animate-in fade-in slide-in-from-bottom-5" 
            : "bg-emerald-50 text-emerald-800 border-emerald-200 animate-in fade-in slide-in-from-bottom-5"
        }`}>
          {notification.type === "error" ? (
            <div className="bg-rose-100 p-1 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="bg-emerald-100 p-1 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <span className="text-xs font-extrabold tracking-wide">{notification.message}</span>
        </div>
      )}

    </div>
  );
};
