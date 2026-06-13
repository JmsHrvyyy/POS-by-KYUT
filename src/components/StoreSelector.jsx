// src/components/StoreSelector.jsx
import { useAuth } from "../context/AuthContext";
import { Navbar } from "./Navbar";

// Hardcoded/Mock Data para sa mga tindahan (Frontend Checklist #3)
const MOCK_STORES = [
  {
    store_id: "store_001",
    store_name: "KYUT Sari-Sari Store",
    industry_type: "Retail",
    address: "Meycauayan, Bulacan",
  },
  {
    store_id: "store_002",
    store_name: "KYUT Mini Cafe",
    industry_type: "Food",
    address: "Marilao, Bulacan",
  },
  {
    store_id: "store_003",
    store_name: "KYUT Tech Services",
    industry_type: "Services",
    address: "Valenzuela City",
  },
];

export const StoreSelector = () => {
  const { activeStoreId, setActiveStoreId, userRole } = useAuth();

  const handleSelectStore = (id) => {
    setActiveStoreId(id); // Sine-save sa Global State (Frontend Checklist #4)
    alert(`Aktibong Tindahan: ${id}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-[#064E3B]">
            Pumili ng Tindahan
          </h1>
          <p className="text-sm text-[#57534E]">
            Pumili sa mga nakatalagang business units sa ibaba upang buksan ang
            operasyon.
          </p>
        </header>

        {/* Responsive Grid System: 1 Column sa Mobile, 2 sa Tablet, 3 sa Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_STORES.map((store) => {
            const isSelected = activeStoreId === store.store_id;
            return (
              <div
                key={store.store_id}
                className={`p-5 rounded-xl bg-white border shadow-sm flex flex-col justify-between transition-all duration-200 ${
                  isSelected
                    ? "border-[#064E3B] ring-2 ring-[#064E3B]/20"
                    : "border-[#57534E]/10 hover:border-[#57534E]/40"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base text-[#0C0A09] line-clamp-1">
                      {store.store_name}
                    </h3>
                    <span className="bg-[#064E3B]/10 text-[#064E3B] text-xs px-2 py-0.5 rounded-full font-medium">
                      {store.industry_type}
                    </span>
                  </div>
                  <p className="text-xs text-[#57534E] mb-4 flex items-center">
                    <svg
                      className="w-3.5 h-3.5 mr-1 text-[#57534E]/70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {store.address}
                  </p>
                </div>

                <button
                  onClick={() => handleSelectStore(store.store_id)}
                  className={`w-full py-2 rounded-lg text-xs font-semibold tracking-wide transition duration-150 ${
                    isSelected
                      ? "bg-[#064E3B] text-white cursor-default"
                      : "bg-[#FAFAF9] text-[#57534E] hover:bg-[#57534E]/10 border border-[#57534E]/20"
                  }`}
                >
                  {isSelected ? "✓ Aktibong Bukas" : "Buksan ang Tindahan"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Conditional Indicator / Helper Badge */}
        {activeStoreId && (
          <div className="mt-6 bg-[#FAFAF9] border border-[#064E3B]/20 p-4 rounded-xl flex items-center justify-between">
            <span className="text-xs text-[#57534E]">
              May active store session:{" "}
              <strong className="text-[#064E3B] font-mono">
                {activeStoreId}
              </strong>
            </span>
            <div className="flex space-x-2">
              {userRole === "manager" && (
                <a
                  href="/admin/dashboard"
                  className="text-xs font-bold text-[#064E3B] hover:underline"
                >
                  Pumunta sa Admin →
                </a>
              )}
              <a
                href="/cashier/pos"
                className="text-xs font-bold text-[#064E3B] hover:underline ml-3"
              >
                Buksan ang POS →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
