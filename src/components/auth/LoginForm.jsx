import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";

export const LoginForm = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  // Login Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password state toggles
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Email format validation helper
  const isValidEmail = (emailVal) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailVal);
  };

  const handleLoginSubmit = async (e) => {
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
          navigate("/stores");
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

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetEmail.trim()) {
      setResetError("Kinakailangan ang email address.");
      return;
    }
    if (!isValidEmail(resetEmail)) {
      setResetError("Mangyaring maglagay ng valid na email address.");
      return;
    }

    try {
      setResetLoading(true);
      await resetPassword(resetEmail);
      setResetSuccess("Naipadala na ang password reset link sa iyong email! Pakisuri ang iyong inbox o spam folder.");
      setResetEmail("");
    } catch (err) {
      console.error("Reset password error:", err);
      if (err.code === "auth/user-not-found") {
        setResetError("Walang account na nakarehistro sa email na ito.");
      } else if (err.code === "auth/invalid-email") {
        setResetError("Hindi valid ang email address format.");
      } else {
        setResetError("May naganap na error. Subukan muli.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-center items-center px-4 font-sans text-[#0C0A09]">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-[#57534E]/10 transition-transform duration-300 hover:scale-[1.01]">
        
        {/* CONDITIONAL RENDER: forgot password card view versus login card view */}
        {!isForgotPassword ? (
          <>
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
            <form onSubmit={handleLoginSubmit} className="space-y-5">
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-[#0C0A09]">
                    Password <span className="text-[#F97316]">*</span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setResetError("");
                      setResetSuccess("");
                    }}
                    className="text-xs text-[#064E3B] font-bold hover:underline cursor-pointer"
                  >
                    Nakalimutan ang Password?
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    disabled={loading}
                    className="w-full pl-10 pr-12 py-3 border border-[#57534E]/30 rounded-xl focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition duration-200 disabled:bg-[#FAFAF9]"
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {/* Lock icon */}
                  <span className="absolute left-3 top-3.5 text-[#57534E]/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {/* Eye/Eye-off toggle */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#57534E]/50 hover:text-[#064E3B] transition focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold py-3.5 rounded-xl transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#064E3B]/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-sm cursor-pointer"
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
          </>
        ) : (
          <>
            {/* BRANDING & RESET HEADER */}
            <div className="text-center mb-8">
              <span className="text-[#064E3B] font-extrabold text-3xl tracking-tight block mb-2">
                POS-by-KYUT
              </span>
              <h2 className="text-xl font-bold text-[#57534E]">Reset ng Password</h2>
              <p className="text-sm text-[#57534E]/70 mt-1">Ipadala ang password reset link sa iyong email</p>
            </div>

            {/* Notifications */}
            {resetError && (
              <div className="bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] p-4 rounded-xl text-sm mb-5 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{resetError}</span>
              </div>
            )}
            {resetSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-[#064E3B] p-4 rounded-xl text-sm mb-5 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* Forgot Password Form */}
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-[#0C0A09]">
                  Email Address <span className="text-[#F97316]">*</span>
                </label>
                <input 
                  type="email" 
                  required
                  disabled={resetLoading}
                  className="w-full px-4 py-3 border border-[#57534E]/30 rounded-xl focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition duration-200 disabled:bg-[#FAFAF9]"
                  placeholder="halimbawa@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={resetLoading}
                className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold py-3.5 rounded-xl transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#064E3B]/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-sm cursor-pointer"
              >
                {resetLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Ipinapadala...</span>
                  </>
                ) : (
                  <span>Ipadala ang Link</span>
                )}
              </button>
            </form>

            {/* Back to login option */}
            <div className="text-center mt-6 pt-6 border-t border-[#57534E]/10">
              <button 
                onClick={() => setIsForgotPassword(false)}
                className="text-sm text-[#064E3B] font-bold hover:underline cursor-pointer"
              >
                ← Bumalik sa Login
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
