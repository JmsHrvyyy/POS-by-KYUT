import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navbar } from "./Navbar";
import { createStore, getStoresByManager, getAssignedStoreIds } from "../../services/storeService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

// Hardcoded/Mock Data para sa mga tindahan ng Manager (Frontend Checklist #3)
const MOCK_STORES = [
  {
    id: "store_001",
    name: "KYUT Sari-Sari Store",
    industry_type: "Retail",
    address: "Meycauayan, Bulacan",
    isMock: true,
  },
  {
    id: "store_002",
    name: "KYUT Mini Cafe",
    industry_type: "Food",
    address: "Marilao, Bulacan",
    isMock: true,
  },
  {
    id: "store_003",
    name: "KYUT Tech Services",
    industry_type: "Services",
    address: "Valenzuela City",
    isMock: true,
  },
];

export const StoreSelector = () => {
  const { activeStoreId, setActiveStoreId, userRole, currentUser } = useAuth();
  const [stores, setStores] = useState([]);
  
  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStore, setNewStore] = useState({ name: "", industry: "Retail", address: "" });
  const [modalError, setModalError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load stores dynamically based on role
  useEffect(() => {
    if (!currentUser || !userRole) return;

    const fetchStores = async () => {
      try {
        setLoading(true);
        if (userRole === "manager") {
          const fetched = await getStoresByManager(currentUser.uid);
          // Ipakita ang Mock + Real Stores sa manager para sa testing at dashboard view
          setStores([...MOCK_STORES, ...fetched]);
        } else if (userRole === "staff") {
          // Cashier/Staff: Hihilahin lamang ang stores kung saan siya assigned (walang mocks)
          const assignedIds = await getAssignedStoreIds(currentUser.uid);
          if (assignedIds.length === 0) {
            setStores([]);
          } else {
            const fetchedStores = [];
            for (const id of assignedIds) {
              const storeDoc = await getDoc(doc(db, "stores", id));
              if (storeDoc.exists()) {
                fetchedStores.push({ id: storeDoc.id, ...storeDoc.data() });
              }
            }
            setStores(fetchedStores);
          }
        }
      } catch (err) {
        console.error("Error fetching stores:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, [currentUser, userRole]);

  const handleSelectStore = (id) => {
    setActiveStoreId(id); // Sine-save sa Global State (Frontend Checklist #4)
    alert(`Aktibong Tindahan: ${id}`);
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!newStore.name.trim()) {
      setModalError("Kinakailangan ang pangalan ng tindahan.");
      return;
    }
    if (!newStore.address.trim()) {
      setModalError("Kinakailangan ang lokasyon o address.");
      return;
    }

    try {
      setLoading(true);
      const created = await createStore(
        {
          name: newStore.name,
          industry_type: newStore.industry,
          address: newStore.address,
        },
        currentUser.uid
      );

      // Add to list and close modal
      setStores((prev) => [...prev, created]);
      setNewStore({ name: "", industry: "Retail", address: "" });
      setIsModalOpen(false);
      alert("Matagumpay na nailikha ang bagong tindahan!");
    } catch (err) {
      console.error("Create store failed:", err);
      setModalError(err.message || "May naganap na error habang gumagawa ng tindahan.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and Search logic
  const filteredStores = stores.filter((store) => {
    const matchesSearch = 
      (store.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (store.address || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "All" || 
      store.industry_type === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Industry Icon generator
  const getIndustryIcon = (type) => {
    switch (type) {
      case "Food":
        return (
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
        );
      case "Services":
        return (
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      case "Retail":
      default:
        return (
          <div className="p-3 bg-[#064E3B]/10 text-[#064E3B] rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#064E3B] tracking-tight">Pumili ng Tindahan</h1>
            <p className="text-sm text-[#57534E] mt-1">
              {userRole === "manager" 
                ? "Magbukas o gumawa ng business unit para pamahalaan ang mga benta at imbentaryo."
                : "Magbukas ng tindahan kung saan ka nakatalaga bilang cashier."
              }
            </p>
          </div>
          
          {/* Search Bar - hidden if staff has no stores */}
          {!(userRole === "staff" && stores.length === 0) && (
            <div className="relative w-full md:w-72">
              <input 
                type="text" 
                placeholder="Maghanap ng tindahan..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#57534E]/20 rounded-xl bg-white focus:outline-none focus:border-[#064E3B] text-sm shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#57534E]/50 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Category Filters - hidden if staff has no stores */}
        {!(userRole === "staff" && stores.length === 0) && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            {["All", "Retail", "Food", "Services"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                  selectedCategory === cat 
                    ? "bg-[#064E3B] text-white shadow" 
                    : "bg-white text-[#57534E] border border-[#57534E]/10 hover:border-[#57534E]/30"
                }`}
              >
                {cat === "All" ? "Lahat" : cat}
              </button>
            ))}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <svg className="animate-spin h-8 w-8 text-[#064E3B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {/* Cashier empty state (No manager/assigned stores) */}
        {userRole === "staff" && stores.length === 0 && !loading && (
          <div className="text-center py-16 bg-white border border-[#F97316]/25 rounded-2xl mt-6 max-w-2xl mx-auto shadow-sm">
            <div className="p-4 bg-[#F97316]/10 text-[#F97316] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-extrabold text-xl text-[#0C0A09]">Wala pang Nakatalagang Tindahan</h3>
            <p className="text-sm text-[#57534E] mt-2 max-w-md mx-auto px-4 leading-relaxed">
              Wala ka pang nakatalagang manager o tindahan sa iyong account. Mangyaring makipag-ugnayan sa iyong Manager upang maitalaga ang iyong email (<strong className="text-[#064E3B] font-semibold">{currentUser?.email}</strong>) sa kanilang tindahan.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[#57534E] hover:bg-[#57534E]/90 text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                I-refresh ang Pahina
              </button>
            </div>
          </div>
        )}

        {/* Stores Grid */}
        {!loading && !(userRole === "staff" && stores.length === 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Manager: Add New Store Card */}
            {userRole === "manager" && (
              <div 
                onClick={() => setIsModalOpen(true)}
                className="border-2 border-dashed border-[#57534E]/20 hover:border-[#064E3B]/60 p-6 rounded-2xl flex flex-col justify-center items-center text-center cursor-pointer transition duration-300 min-h-[190px] bg-white/50 hover:bg-[#064E3B]/5 hover:scale-[1.01]"
              >
                <div className="p-3 bg-[#064E3B]/10 text-[#064E3B] rounded-full mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="font-bold text-base text-[#064E3B]">Magdagdag ng Tindahan</h3>
                <p className="text-xs text-[#57534E] mt-1 max-w-[200px]">Magtala ng bagong branch para sa POS</p>
              </div>
            )}

            {/* Render stores */}
            {filteredStores.map((store) => {
              const isSelected = activeStoreId === store.id;
              return (
                <div
                  key={store.id}
                  className={`p-6 rounded-2xl bg-white border flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${
                    isSelected 
                      ? "border-[#064E3B] shadow-md ring-2 ring-[#064E3B]/10" 
                      : "border-[#57534E]/15 hover:border-[#57534E]/30 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      {getIndustryIcon(store.industry_type)}
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        store.isMock 
                          ? "bg-[#57534E]/10 text-[#57534E]"
                          : "bg-emerald-500/10 text-emerald-700"
                      }`}>
                        {store.isMock ? "Mock" : "Live"}
                      </span>
                    </div>
                    
                    <h3 className="font-extrabold text-lg text-[#0C0A09] leading-snug line-clamp-1">
                      {store.name}
                    </h3>
                    <p className="text-xs text-[#57534E] font-semibold mt-0.5 mb-3">{store.industry_type}</p>
                    
                    <p className="text-xs text-[#57534E]/80 flex items-center gap-1.5 mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#57534E]/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{store.address}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectStore(store.id)}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                      isSelected 
                        ? "bg-[#064E3B] text-white" 
                        : "bg-[#FAFAF9] text-[#57534E] border border-[#57534E]/25 hover:bg-[#57534E]/5"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        <span>✓ Aktibong Bukas</span>
                      </>
                    ) : (
                      <span>Buksan ang Tindahan</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty search state */}
        {!loading && filteredStores.length === 0 && !(userRole === "staff" && stores.length === 0) && (
          <div className="text-center py-16 bg-white border border-[#57534E]/10 rounded-2xl mt-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#57534E]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m16 0h-16" />
            </svg>
            <h3 className="font-bold text-base text-[#57534E]">Walang Tindahan na Nahanap</h3>
            <p className="text-xs text-[#57534E]/70 mt-1">Subukang baguhin ang iyong keyword o kategorya.</p>
          </div>
        )}

        {/* Footer Navigation Bar for Session Shortcut */}
        {activeStoreId && !(userRole === "staff" && stores.length === 0) && (
          <div className="mt-8 bg-white border border-[#064E3B]/10 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2 text-sm text-[#57534E]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Aktibong session: <strong className="text-[#064E3B] font-mono">{activeStoreId}</strong></span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {userRole === "manager" && (
                <a 
                  href="/admin/dashboard" 
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#064E3B]/20 text-[#064E3B] font-bold text-xs hover:bg-[#064E3B]/5 transition text-center"
                >
                  Admin View →
                </a>
              )}
              <a 
                href="/cashier/pos" 
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#064E3B] text-white font-bold text-xs hover:bg-[#064E3B]/90 transition text-center"
              >
                Buksan ang POS →
              </a>
            </div>
          </div>
        )}

      </div>

      {/* Modal: Create Store */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-[#57534E]/10 animate-scaleIn">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#064E3B]">Bagong Tindahan</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#57534E]/10 transition text-[#57534E]/70"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] p-3 rounded-xl text-xs mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">Pangalan ng Tindahan</label>
                <input 
                  type="text" 
                  required
                  placeholder="Hal. KYUT Bakery"
                  className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">Uri ng Industriya</label>
                <select 
                  className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl bg-white focus:outline-none focus:border-[#064E3B] text-sm"
                  value={newStore.industry}
                  onChange={(e) => setNewStore({ ...newStore, industry: e.target.value })}
                >
                  <option value="Retail">Retail</option>
                  <option value="Food">Food / Cafe</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-[#57534E]">Lokasyon / Address</label>
                <input 
                  type="text" 
                  required
                  placeholder="Hal. Meycauayan, Bulacan"
                  className="w-full px-4 py-2.5 border border-[#57534E]/25 rounded-xl focus:outline-none focus:border-[#064E3B] text-sm"
                  value={newStore.address}
                  onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#57534E]/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-[#57534E]/20 rounded-xl text-xs font-bold text-[#57534E] hover:bg-[#57534E]/5 transition"
                >
                  Banselahin
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white rounded-xl text-xs font-bold transition flex justify-center items-center gap-1.5 disabled:opacity-75"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Naililikha...</span>
                    </>
                  ) : (
                    <span>Likhain</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
