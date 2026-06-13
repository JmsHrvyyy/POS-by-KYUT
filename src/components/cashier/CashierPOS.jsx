import { useState } from "react";
import { Navbar } from "../shared/Navbar";
import { useAuth } from "../../context/AuthContext";

export const CashierPOS = () => {
  const { activeStoreId } = useAuth();

  // Mock catalog of items
  const catalog = [
    { id: "item_001", name: "Coca-Cola 1.5L", price: 65, category: "Soda", stock: 12 },
    { id: "item_002", name: "Gardenia Classic Bread", price: 78, category: "Bakery", stock: 8 },
    { id: "item_003", name: "Piattos Cheese Big", price: 38, category: "Chips", stock: 25 },
    { id: "item_004", name: "Lucky Me Pancit Canton", price: 16, category: "Noodles", stock: 45 },
    { id: "item_005", name: " Kopiko Blanca Mix", price: 10, category: "Coffee", stock: 60 },
    { id: "item_006", name: "Purefoods Corned Beef", price: 85, category: "Canned Goods", stock: 15 }
  ];

  // Cart state
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0); // in percent

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, amount) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + amount;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  // Subtotal and Total calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Mangyaring magdagdag muna ng produkto sa cart.");
      return;
    }
    alert(`Checkout success! Kabuuang halaga: ₱${total.toFixed(2)}. Nalikha ang shift transaction.`);
    clearCart();
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Product Catalog */}
        <div className="flex-1 bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#57534E]/10">
            <div>
              <h2 className="text-xl font-bold text-[#064E3B]">Katalogo ng Produkto</h2>
              <p className="text-xs text-[#57534E]">I-click ang item para idagdag sa cart</p>
            </div>
            {activeStoreId && (
              <span className="text-[10px] font-bold text-[#57534E] uppercase tracking-wider bg-[#57534E]/10 px-2.5 py-1 rounded-lg">
                Store: {activeStoreId}
              </span>
            )}
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] pr-2">
            {catalog.map((product) => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 rounded-xl border border-[#57534E]/15 bg-[#FAFAF9] hover:bg-[#064E3B]/5 hover:border-[#064E3B]/45 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.01]"
              >
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#57534E]/60">{product.category}</span>
                  <h4 className="font-extrabold text-sm text-[#0C0A09] mt-0.5 line-clamp-2">{product.name}</h4>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-extrabold text-[#064E3B] text-base">₱{product.price}</span>
                  <span className="text-[10px] text-[#57534E]/70">Stock: {product.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: POS Checkout Cart */}
        <div className="w-full lg:w-96 bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm flex flex-col justify-between min-h-[450px]">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#57534E]/10">
              <h3 className="text-lg font-bold text-[#064E3B] flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 100-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Kasalukuyang Cart
              </h3>
              <button 
                onClick={clearCart}
                className="text-xs text-[#F97316] font-bold hover:underline cursor-pointer"
              >
                I-clear
              </button>
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
                <div className="text-center py-10 text-[#57534E]/50">
                  <p className="text-xs">Walang produkto sa cart.</p>
                  <p className="text-[10px] mt-0.5">Pumili ng mga item sa kaliwa.</p>
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
                className="bg-[#FAFAF9] border border-[#57534E]/20 rounded px-1.5 py-0.5 text-xs text-[#0C0A09]"
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
              className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-md cursor-pointer mt-4 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Iproseso ang Bayad
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
