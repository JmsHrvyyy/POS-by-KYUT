import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";

export const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Email format validation helper
  const isValidEmail = (emailVal) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Input Validation (Frontend Checklist #1)
    if (!email.trim() || !password.trim()) {
      setError("Mangyaring punan ang lahat ng field.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Mangyaring maglagay ng valid na email address.");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await login(email, password);
      const user = userCredential.user;

      // Kukunin ang global role ng user mula sa Firestore para sa tamang redirect
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().global_role;
        if (role === "manager") {
          navigate("/stores");
        } else if (role === "staff") {
          navigate("/cashier/pos");
        } else {
          navigate("/unauthorized");
        }
      } else {
        navigate("/unauthorized");
      }
    } catch (err) {
      console.error("Login error:", err);
      // User-friendly error mapping sa Tagalog
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Maling email o password. Pakisuri at subukan muli.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Masyadong maraming maling pagtatangka. Subukan muli mamaya.");
      } else {
        setError(err.message || "May naganap na error habang naglo-login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-center items-center px-4 font-sans text-[#0C0A09]">
      {/* Container Card with subtle shadow and border */}
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-[#57534E]/10 transition-transform duration-300 hover:scale-[1.01]">
        
        {/* Branding & Header */}
        <div className="text-center mb-8">
          <span className="text-[#064E3B] font-extrabold text-3xl tracking-tight block mb-2">
            POS-by-KYUT
          </span>
          <h2 className="text-xl font-bold text-[#57534E]">Mag-login sa iyong Account</h2>
          <p className="text-sm text-[#57534E]/70 mt-1">Suriin ang mga transaksyon at benta ng tindahan</p>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input field */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#0C0A09]">
              Email Address <span className="text-[#F97316]">*</span>
            </label>
            <div className="relative">
              <input 
                type="email" 
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-[#57534E]/30 rounded-xl focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition duration-200 disabled:bg-[#FAFAF9]"
                placeholder="halimbawa@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="absolute left-3 top-3.5 text-[#57534E]/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Password input field */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#0C0A09]">
              Password <span className="text-[#F97316]">*</span>
            </label>
            <div className="relative">
              <input 
                type="password" 
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-[#57534E]/30 rounded-xl focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition duration-200 disabled:bg-[#FAFAF9]"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="absolute left-3 top-3.5 text-[#57534E]/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold py-3.5 rounded-xl transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#064E3B]/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Nagla-login...</span>
              </>
            ) : (
              <span>Mag-login</span>
            )}
          </button>
        </form>

        {/* Signup redirection link */}
        <div className="text-center mt-6 pt-6 border-t border-[#57534E]/10">
          <p className="text-sm text-[#57534E]">
            Walang account?{" "}
            <Link to="/signup" className="text-[#064E3B] font-bold hover:underline">
              Mag-register dito
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
