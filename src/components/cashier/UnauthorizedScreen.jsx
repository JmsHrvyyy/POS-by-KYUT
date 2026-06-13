import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const UnauthorizedScreen = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-center items-center px-4 font-sans text-[#0C0A09]">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-[#57534E]/10 text-center transition-transform duration-300 hover:scale-[1.01]">
        
        {/* Warning Icon Badge */}
        <div className="p-4 bg-[#F97316]/10 text-[#F97316] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-2xl font-extrabold text-[#0C0A09] tracking-tight">Access Pending</h2>
        <p className="text-sm text-[#F97316] font-bold mt-1">Nangangailangan ng Otorisasyon</p>
        
        <p className="text-sm text-[#57534E] mt-4 leading-relaxed">
          Ang iyong account (<strong className="text-[#064E3B]">{currentUser?.email}</strong>) ay hindi pa naidadagdag sa kahit anong aktibong tindahan.
        </p>

        <p className="text-xs text-[#57534E]/70 mt-3 bg-[#FAFAF9] p-3.5 rounded-xl border border-[#57534E]/10">
          Mangyaring makipag-ugnayan sa iyong Manager upang maitalaga ang iyong account bilang Cashier sa kanilang tindahan.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 py-3 border border-[#57534E]/20 rounded-xl text-xs font-bold text-[#57534E] hover:bg-[#57534E]/5 transition cursor-pointer"
          >
            I-refresh ang Page
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex-1 py-3 bg-[#57534E] hover:bg-[#57534E]/90 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Mag-logout
          </button>
        </div>

      </div>
    </div>
  );
};
