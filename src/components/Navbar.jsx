// src/components/Navbar.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, userRole, activeStoreId } = useAuth();

  return (
    <nav className="bg-[#064E3B] text-white font-sans shadow-md w-full sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo at Status Badges */}
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-wide">KYUT POS</span>
            {userRole && (
              <span className="bg-[#57534E] text-xs uppercase px-2 py-0.5 rounded font-semibold tracking-wider">
                {userRole}
              </span>
            )}
          </div>

          {/* Desktop Menu Links (Nakatago sa mobile) */}
          <div className="hidden md:flex items-center space-x-4 text-sm font-medium">
            <a
              href="/stores"
              className="hover:bg-[#57534E] px-3 py-2 rounded-md transition"
            >
              Mga Tindahan
            </a>
            {userRole === "manager" && (
              <a
                href="/admin/dashboard"
                className="hover:bg-[#57534E] px-3 py-2 rounded-md transition"
              >
                Admin View
              </a>
            )}
            {activeStoreId && (
              <a
                href="/cashier/pos"
                className="hover:bg-[#57534E] px-3 py-2 rounded-md transition"
              >
                POS Screen
              </a>
            )}
            <button
              onClick={logout}
              className="bg-[#57534E] hover:bg-[#57534E]/80 px-3 py-2 rounded-md transition"
            >
              Logout
            </button>
          </div>

          {/* Burger Button para sa Cellphone (Mobile View Trigger) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-[#57534E] focus:outline-none"
            >
              {isOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel Drawer (Lalabas lang pag clinick ang burger menu) */}
      <div
        className={`${isOpen ? "block" : "hidden"} md:hidden bg-[#064E3B] border-t border-[#57534E]/30 px-4 pt-2 pb-4 space-y-1 text-sm`}
      >
        <a
          href="/stores"
          className="block hover:bg-[#57534E] px-3 py-2 rounded-md"
        >
          Mga Tindahan
        </a>
        {userRole === "manager" && (
          <a
            href="/admin/dashboard"
            className="block hover:bg-[#57534E] px-3 py-2 rounded-md"
          >
            Admin View
          </a>
        )}
        {activeStoreId && (
          <a
            href="/cashier/pos"
            className="block hover:bg-[#57534E] px-3 py-2 rounded-md"
          >
            POS Screen
          </a>
        )}
        <button
          onClick={logout}
          className="w-full text-left bg-[#57534E] hover:bg-[#57534E]/80 px-3 py-2 rounded-md mt-2"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
