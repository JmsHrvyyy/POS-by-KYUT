import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

export const DigitalReceipt = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        setError("");
        const orderDocRef = doc(db, "orders", orderId);
        const orderSnapshot = await getDoc(orderDocRef);
        
        if (orderSnapshot.exists()) {
          setOrder({ id: orderSnapshot.id, ...orderSnapshot.data() });
        } else {
          setError("Hindi nahanap ang order na ito sa aming database.");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("May naganap na error habang kinukuha ang order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-4 text-[#0C0A09]">
        <svg className="animate-spin h-8 w-8 text-[#064E3B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xs text-[#57534E] mt-3 font-semibold">Kinukuha ang resibo...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-4 text-center text-[#0C0A09]">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-full mb-4 border border-rose-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#0C0A09]">Error sa Resibo</h2>
        <p className="text-sm text-[#57534E] mt-2 max-w-sm">{error || "Hindi nahanap ang order."}</p>
        <Link to="/stores" className="mt-6 px-5 py-2.5 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-xl text-xs transition shadow-sm">
          Bumalik sa Dashboard
        </Link>
      </div>
    );
  }

  // Format date from timestamp
  const orderDate = order.created_at?.toDate 
    ? order.created_at.toDate().toLocaleString("fil-PH", { dateStyle: "medium", timeStyle: "short" }) 
    : new Date().toLocaleString("fil-PH", { dateStyle: "medium", timeStyle: "short" });

  const receiptUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(receiptUrl)}`;

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-4 sm:p-6 text-[#0C0A09]">
      
      {/* Receipt Thermal Card Wrapper */}
      <div 
        id="printable-receipt" 
        className="w-full max-w-sm bg-white p-6 sm:p-8 rounded-2xl border border-[#57534E]/15 shadow-md flex flex-col text-sm relative bg-white"
      >
        {/* Decorative Top Serrated edge */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FAFAF9] border-b border-dashed border-[#57534E]/20" />

        {/* Header */}
        <div className="text-center pb-4 border-b border-dashed border-[#57534E]/30 mt-2">
          <span className="text-[#064E3B] font-extrabold text-2xl tracking-tight block">
            POS-by-KYUT
          </span>
          <p className="text-[11px] font-semibold text-[#57534E] uppercase tracking-wider mt-1">Digital Store Receipt</p>
          <div className="text-[10px] text-[#57534E]/70 mt-2 font-mono space-y-0.5">
            <div>STORE ID: {order.store_id}</div>
            <div>TXID: {order.id}</div>
            <div>DATE: {orderDate}</div>
          </div>
        </div>

        {/* Items List */}
        <div className="py-4 border-b border-dashed border-[#57534E]/30">
          <div className="font-bold text-[10px] uppercase text-[#57534E] tracking-wider mb-2 flex justify-between">
            <span>Mga Produkto</span>
            <span>Halaga</span>
          </div>
          <div className="space-y-2.5 font-mono text-xs">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <span className="font-bold text-[#0C0A09]">{item.name}</span>
                  <span className="text-[10px] text-[#57534E]/80 block">
                    {item.quantity} x ₱{item.price.toFixed(2)}
                  </span>
                </div>
                <span className="font-bold text-[#0C0A09] self-center">
                  ₱{(item.quantity * item.price).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="py-4 border-b border-dashed border-[#57534E]/30 space-y-1.5 font-mono text-xs text-[#57534E]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-bold text-[#0C0A09]">₱{order.subtotal?.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[#F97316]">
              <span>Discount ({order.discount}%):</span>
              <span className="font-bold">-₱{((order.subtotal * order.discount) / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-extrabold text-[#0C0A09] pt-2 border-t border-dashed border-[#57534E]/20">
            <span>KABUUANG HALAGA:</span>
            <span className="text-base text-[#064E3B]">₱{order.total?.toFixed(2)}</span>
          </div>
        </div>

        {/* Cashier Metadata */}
        <div className="py-4 text-center text-[10px] text-[#57534E]/80 border-b border-dashed border-[#57534E]/20">
          <div>Cashier: <strong className="font-bold">{order.cashier_name}</strong></div>
          <div className="font-mono mt-0.5">ID: {order.cashier_id}</div>
          <div className="mt-2 text-[#064E3B] font-bold">Maraming salamat sa inyong pagtangkilik!</div>
        </div>

        {/* QR Code section */}
        <div className="pt-6 flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-white border border-[#57534E]/20 rounded-xl shadow-sm inline-block">
            <img 
              src={qrCodeUrl} 
              alt="Receipt QR Code" 
              className="w-32 h-32 select-none"
            />
          </div>
          <span className="text-[9px] uppercase font-bold text-[#57534E]/60 tracking-wider mt-3 max-w-[200px]">
            I-scan ang QR code para buksan ang digital copy online
          </span>
        </div>

      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="mt-6 flex gap-3 w-full max-w-sm no-print">
        <button 
          onClick={handlePrint}
          className="flex-1 py-3 px-4 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-xl text-xs transition duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          I-print ang Resibo
        </button>
        <Link 
          to="/stores"
          className="flex-1 py-3 px-4 bg-white hover:bg-[#FAFAF9] text-[#57534E] font-bold rounded-xl text-xs transition duration-200 border border-[#57534E]/25 text-center flex items-center justify-center"
        >
          Pumunta sa Dashboard
        </Link>
      </div>

    </div>
  );
};
