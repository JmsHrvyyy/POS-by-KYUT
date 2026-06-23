import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useLanguage } from "../../context/LanguageContext";

export const ProfileWidget = ({ onClose }) => {
  const { currentUser, userRole } = useAuth();
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Theme states
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app_theme") || "light";
  });

  // 1. Fetch user profile from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          const data = docSnap.data();
          setName(data.name || "");
          setContact(data.contact || "");
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // 2. Apply theme locally and save
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("app_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 3. Save profile details to Firestore
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    try {
      setSaving(true);
      setSuccessMsg("");
      setErrorMsg("");

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          name: name.trim(),
          contact: contact.trim(),
        },
        { merge: true }
      );

      setSuccessMsg(language === "en" ? "Profile successfully updated!" : "Matagumpay na na-update ang profile!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error saving user profile:", err);
      setErrorMsg(language === "en" ? "Failed to save profile changes." : "Hindi ma-save ang pagbabago sa profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute right-4 top-18 w-80 bg-white dark:bg-[#1C1917] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-5 z-50 animate-fadeIn text-stone-900 dark:text-stone-100">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
        <div>
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-[#064E3B] dark:text-emerald-400">
            {language === "en" ? "My Profile" : "Aking Profile"}
          </h4>
          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono capitalize">
            Role: <strong className="font-bold text-[#F97316]">{userRole || "Staff"}</strong>
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-2">
          <svg className="animate-spin h-5 w-5 text-[#064E3B] dark:text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs text-stone-500 dark:text-stone-400">Loading...</span>
        </div>
      ) : (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Email Display */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 mb-1">
              Email Address
            </label>
            <input
              type="text"
              disabled
              value={currentUser?.email || ""}
              className="w-full px-3.5 py-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#0C0A09]/50 rounded-xl text-xs text-stone-500 dark:text-stone-400 cursor-not-allowed outline-none"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 mb-1">
              {language === "en" ? "Full Name" : "Buong Pangalan"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mina"
              className="w-full px-3.5 py-2 border border-stone-200 dark:border-stone-800 rounded-xl text-xs bg-white dark:bg-[#0C0A09] focus:outline-none focus:border-[#064E3B] dark:focus:border-emerald-500 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Contact Details */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 mb-1">
              {language === "en" ? "Contact Details" : "Impormasyon sa Contact"}
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. +63 912 345 6789"
              className="w-full px-3.5 py-2 border border-stone-200 dark:border-stone-800 rounded-xl text-xs bg-white dark:bg-[#0C0A09] focus:outline-none focus:border-[#064E3B] dark:focus:border-emerald-500 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Theme Selector Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-stone-100 dark:border-stone-800 mt-2">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              {language === "en" ? "UI Theme" : "Tema ng UI"}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {theme === "light" ? (
                <>
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 text-[#10B981] dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-center font-bold">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30 text-center font-bold">
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 bg-[#064E3B] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{language === "en" ? "Save Changes" : "I-save ang Pagbabago"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
