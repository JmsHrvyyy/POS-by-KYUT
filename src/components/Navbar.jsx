// Mobile-First Responsive Sidebar/Navbar Component
import React, { useState } from "react";

export const Navbar = () => {
  // State para sa pag-open at pag-close ng menu sa mobile view
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-[#064E3B] text-white font-sans shadow-md w-full">
      {/* Container: Flex layout para sa alignment ng items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* App Branding/Title */}
          <div className="flex-shrink-0 flex items-center">
            <span className="font-bold text-lg tracking-wide">POS-by-KYUT</span>
          </div>

          {/* Desktop Menu Options (Hidden sa small screens / phones) */}
          <div className="hidden md:flex space-x-4">
            <a
              href="/stores"
              className="hover:bg-[#57534E] px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Tindahan
            </a>
            <a
              href="/login"
              className="bg-[#57534E] hover:bg-[#57534E]/80 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Logout
            </a>
          </div>

          {/* Burger Menu Button (Visible LANG sa mobile/small screens) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)} // Toggle operation para sa menu panel
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-[#57534E] focus:outline-none"
            >
              {/* SVG Icon: Nagbabago ang hitsura (X o Burger) base sa value ng isOpen */}
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

      {/* Mobile Drawer Panel: Lalabas lang kapag true ang isOpen value */}
      <div
        className={`${isOpen ? "block" : "hidden"} md:hidden bg-[#064E3B] border-t border-[#57534E]/30 px-2 pt-2 pb-3 space-y-1`}
      >
        <a
          href="/stores"
          className="block hover:bg-[#57534E] px-3 py-2 rounded-md text-base font-medium"
        >
          Tindahan
        </a>
        <a
          href="/login"
          className="block bg-[#57534E] px-3 py-2 rounded-md text-base font-medium text-center"
        >
          Logout
        </a>
      </div>
    </nav>
  );
};
