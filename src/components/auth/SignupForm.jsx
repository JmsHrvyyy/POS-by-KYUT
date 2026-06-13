import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export const SignupForm = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", role: "manager" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Live password strength calculations done directly during render (resolves lint hook warning)
  const pwd = formData.password;
  const hasMinLength = pwd.length >= 6;
  const hasNumber = /[0-9]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLowerOrSpecial = /[a-z!@#$%^&*(),.?":{}|<>]/.test(pwd);

  // Calculate score
  let score = 0;
  if (pwd.length > 0) {
    if (hasMinLength) score++;
    if (hasNumber) score++;
    if (hasUpper) score++;
    if (hasLowerOrSpecial) score++;
  }

  // Set label and color based on score
  let label = "Napakababa";
  let colorClass = "bg-red-500 w-1/4";
  if (score === 2) {
    label = "Mababa";
    colorClass = "bg-orange-500 w-2/4";
  } else if (score === 3) {
    label = "Katamtaman";
    colorClass = "bg-yellow-500 w-3/4";
  } else if (score === 4) {
    label = "Malakas";
    colorClass = "bg-emerald-600 w-full";
  }

  // Email format validation helper
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Input Validation
    if (!formData.fullName.trim()) {
      setError("Kinakailangan ang buong pangalan.");
      return;
    }
    if (!formData.email) {
      setError("Kinakailangan ang email address.");
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError("Mangyaring maglagay ng valid na email address.");
      return;
    }
    if (!formData.password) {
      setError("Kinakailangan ang password.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Ang password ay dapat hindi bababa sa 6 characters.");
      return;
    }
    if (score < 3) {
      setError("Mangyaring lakasan ang iyong password (dapat may numero at uppercase letter).");
      return;
    }

    try {
      setLoading(true);
      await signup(formData.email, formData.password, formData.fullName, formData.role);
      setSuccess("Matagumpay na nagawa ang account!");
      
      // I-redirect base sa piniling role
      setTimeout(() => {
        if (formData.role === "manager") {
          navigate("/stores");
        } else {
          navigate("/unauthorized");
        }
      }, 1500);

    } catch (err) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Ang email na ito ay ginagamit na ng ibang account.");
      } else if (err.code === "auth/invalid-email") {
        setError("Hindi valid ang email address format.");
      } else if (err.code === "auth/weak-password") {
        setError("Masyadong mahina ang password.");
      } else {
        setError(err.message || "May naganap na error habang nagpaparehistro.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-center items-center px-4 py-8 font-sans text-[#0C0A09]">
      {/* Responsive Card Container */}
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-[#57534E]/10 transition-transform duration-300 hover:scale-[1.01]">
        
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-[#064E3B] font-extrabold text-3xl tracking-tight block mb-2">
            POS-by-KYUT
          </span>
          <h2 className="text-xl font-bold text-[#57534E]">Mag-register ng Account</h2>
          <p className="text-sm text-[#57534E]/70 mt-1">Umpisahan ang pamamahala sa iyong POS system</p>
        </div>
        
        {/* Notifications */}
        {error && (
          <div className="bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] p-4 rounded-xl text-sm mb-5 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-[#064E3B] p-4 rounded-xl text-sm mb-5 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#0C0A09]">Buong Pangalan <span className="text-[#F97316]">*</span></label>
            <input 
              type="text" 
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border border-[#57534E]/30 rounded-xl focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition duration-200 disabled:bg-[#FAFAF9]"
              placeholder="Juan Dela Cruz"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#0C0A09]">Email Address <span className="text-[#F97316]">*</span></label>
            <input 
              type="email" 
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border border-[#57534E]/30 rounded-xl focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition duration-200 disabled:bg-[#FAFAF9]"
              placeholder="halimbawa@email.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#0C0A09]">Password <span className="text-[#F97316]">*</span></label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                disabled={loading}
                className="w-full pl-4 pr-12 py-2.5 border border-[#57534E]/30 rounded-xl focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition duration-200 disabled:bg-[#FAFAF9]"
                placeholder="******"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
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

            {/* Realtime Password Strength Bar & Indicators */}
            {formData.password.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#57534E]">Lakas ng password:</span>
                  <span className="font-semibold text-[#0C0A09]">{label}</span>
                </div>
                {/* Visual strength bar meter */}
                <div className="w-full h-1.5 bg-[#57534E]/10 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${colorClass}`}></div>
                </div>
                
                {/* Checklist criteria */}
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[9px] ${hasMinLength ? "bg-emerald-600" : "bg-[#57534E]/30"}`}>
                      ✓
                    </span>
                    <span className={hasMinLength ? "text-emerald-700 font-medium" : "text-[#57534E]/70"}>6+ characters</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[9px] ${hasNumber ? "bg-emerald-600" : "bg-[#57534E]/30"}`}>
                      ✓
                    </span>
                    <span className={hasNumber ? "text-emerald-700 font-medium" : "text-[#57534E]/70"}>May numero</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[9px] ${hasUpper ? "bg-emerald-600" : "bg-[#57534E]/30"}`}>
                      ✓
                    </span>
                    <span className={hasUpper ? "text-emerald-700 font-medium" : "text-[#57534E]/70"}>Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[9px] ${hasLowerOrSpecial ? "bg-emerald-600" : "bg-[#57534E]/30"}`}>
                      ✓
                    </span>
                    <span className={hasLowerOrSpecial ? "text-emerald-700 font-medium" : "text-[#57534E]/70"}>Lowercase/Simbolo</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[#0C0A09]">Ano ang iyong Role? <span className="text-[#F97316]">*</span></label>
            <select 
              disabled={loading}
              className="w-full px-4 py-2.5 border border-[#57534E]/30 rounded-xl bg-white focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/10 transition duration-200 disabled:bg-[#FAFAF9]"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="manager">Manager / Owner</option>
              <option value="staff">Cashier / Staff</option>
            </select>
            <p className="text-[11px] text-[#57534E]/60 mt-1">
              {formData.role === "manager" 
                ? "Maaaring gumawa at mamahala ng iyong sariling mga tindahan."
                : "Awtomatikong maghihintay ng imbitasyon bago maka-access sa POS."
              }
            </p>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold py-3.5 rounded-xl transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#064E3B]/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-5 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Nagrerehistro...</span>
              </>
            ) : (
              <span>Mag-register</span>
            )}
          </button>
        </form>

        {/* Redirect Link */}
        <div className="text-center mt-6 pt-6 border-t border-[#57534E]/10">
          <p className="text-sm text-[#57534E]">
            Mayroon nang account?{" "}
            <Link to="/login" className="text-[#064E3B] font-bold hover:underline">
              Mag-login dito
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
