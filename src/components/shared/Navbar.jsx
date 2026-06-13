import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, userRole, activeStoreId, currentUser } = useAuth();
  const navigate = useNavigate();

  // Helper para malaman ang active route
  const currentPath = window.location.pathname;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navLinks = [
    {
      name: "Mga Tindahan",
      path: "/stores",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
      visible: true
    },
    {
      name: "Admin View",
      path: "/admin/dashboard",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h25a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 00.293.707l2.5 2.5a1 1 0 001.414-1.414L14 10.586V7z" clipRule="evenodd" />
        </svg>
      ),
      visible: userRole === "manager"
    },
    {
      name: "POS Screen",
      path: "/cashier/pos",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H5zm0 2h10v2H5V4zm0 4h10v10H5V8zm2 2a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      ),
      visible: !!activeStoreId
    }
  ];

  return (
    <>
      {/* Top Header/Navigation Bar */}
      <nav className="bg-[#064E3B] backdrop-blur-md bg-opacity-95 text-white font-sans shadow-md w-full sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Branding Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/stores")}>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#FAFAF9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight">KYUT POS</span>
                {activeStoreId && (
                  <span className="text-[10px] text-white/70 font-mono -mt-1">Active: {activeStoreId}</span>
                )}
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              {navLinks.map((link) => {
                if (!link.visible) return null;
                const isActive = currentPath === link.path;
                return (
                  <a
                    key={link.path}
                    href={link.path}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? "bg-white/10 text-white shadow-sm border border-white/10" 
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </a>
                );
              })}
            </div>

            {/* Profile Dropdown / User Details & Burger Menu Button */}
            <div className="flex items-center space-x-4">
              
              {/* User badge on Desktop */}
              {currentUser && (
                <div className="hidden md:flex items-center space-x-2.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs">
                  <div className="w-6 h-6 rounded-full bg-[#57534E]/60 border border-white/20 flex items-center justify-center font-bold uppercase">
                    {currentUser.email ? currentUser.email.charAt(0) : "U"}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold max-w-[120px] truncate">{currentUser.email}</span>
                    <span className="text-[9px] text-[#F97316] uppercase font-bold tracking-wider">{userRole}</span>
                  </div>
                </div>
              )}

              {/* Logout Button on Desktop */}
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-1 bg-[#57534E] hover:bg-[#57534E]/90 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition duration-200 border border-[#57534E]/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>

              {/* Burger/Drawer Trigger on Mobile */}
              <button
                onClick={() => setIsOpen(true)}
                className="md:hidden inline-flex items-center justify-center p-2.5 rounded-xl hover:bg-white/10 focus:outline-none transition border border-transparent hover:border-white/10"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Slide-out Drawer */}
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sliding menu panel */}
      <div
        className={`fixed inset-y-0 right-0 max-w-xs w-full bg-[#064E3B] text-white shadow-2xl z-50 flex flex-col justify-between transition-transform duration-300 ease-out transform md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight">KYUT POS</span>
              <span className="bg-[#57534E] text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider">{userRole}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 transition"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {activeStoreId && (
            <div className="mt-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono">
              Active Store: {activeStoreId}
            </div>
          )}
        </div>

        {/* Drawer Links */}
        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
            if (!link.visible) return null;
            const isActive = currentPath === link.path;
            return (
              <a
                key={link.path}
                href={link.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-white/10 text-white shadow border border-white/10" 
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
              </a>
            );
          })}
        </div>

        {/* Drawer Footer / Profile & Logout */}
        <div className="p-6 border-t border-white/10 space-y-4">
          {currentUser && (
            <div className="flex items-center space-x-3 bg-white/5 border border-white/10 p-3.5 rounded-xl text-xs">
              <div className="w-8 h-8 rounded-full bg-[#57534E]/60 border border-white/20 flex items-center justify-center font-bold uppercase text-sm">
                {currentUser.email ? currentUser.email.charAt(0) : "U"}
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="font-bold truncate">{currentUser.email}</span>
                <span className="text-[9px] text-[#F97316] uppercase font-bold tracking-wider">{userRole}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#57534E] hover:bg-[#57534E]/90 text-white py-3 rounded-xl text-sm font-bold shadow-md transition duration-200 border border-[#57534E]/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </>
  );
};
