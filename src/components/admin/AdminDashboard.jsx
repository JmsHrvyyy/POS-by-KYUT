import { Navbar } from "../shared/Navbar";
import { useAuth } from "../../context/AuthContext";

export const AdminDashboard = () => {
  const { activeStoreId } = useAuth();

  // Mock data for display
  const stats = [
    { name: "Kabuuang Benta ngayon", value: "₱12,450.00", change: "+15.2% kumpara kahapon", colorClass: "text-[#064E3B] bg-[#064E3B]/10" },
    { name: "Mga Cashier na Aktibo", value: "3", change: "2 naka-break", colorClass: "text-[#57534E] bg-[#57534E]/10" },
    { name: "Imbentaryo (Items)", value: "142 items", change: "12 kailangang i-restock", colorClass: "text-[#F97316] bg-[#F97316]/10" }
  ];

  const mockStaff = [
    { name: "Maria Clara", role: "Head Cashier", email: "maria@store.com", status: "Active" },
    { name: "Juan Dela Cruz", role: "Junior Cashier", email: "juan@store.com", status: "On Break" },
    { name: "Leonor Rivera", role: "Staff", email: "leonor@store.com", status: "Inactive" }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#0C0A09]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#064E3B] tracking-tight">Admin & Manager Operations</h1>
            <p className="text-sm text-[#57534E] mt-1">
              Pamahalaan ang inventory, sales tracking, at cashier shifts ng iyong tindahan.
            </p>
          </div>
          {activeStoreId && (
            <div className="bg-[#064E3B]/10 text-[#064E3B] border border-[#064E3B]/20 px-4 py-2 rounded-xl text-xs font-mono font-bold self-start">
              Active Store Session: {activeStoreId}
            </div>
          )}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm transition-transform duration-200 hover:scale-[1.01]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#57534E]">{stat.name}</p>
              <h3 className="text-3xl font-extrabold text-[#0C0A09] mt-2 mb-1">{stat.value}</h3>
              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${stat.colorClass}`}>
                {stat.change}
              </span>
            </div>
          ))}
        </div>

        {/* Double Column Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns - Staff/Cashier list */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#064E3B]">Pamamahala ng mga Staff</h3>
              <button className="px-3.5 py-1.5 bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold rounded-lg text-xs transition cursor-pointer">
                + Bagong Staff
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#57534E]/10 text-[#57534E]">
                    <th className="pb-3 font-semibold">Pangalan</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#57534E]/5">
                  {mockStaff.map((staff, i) => (
                    <tr key={i} className="hover:bg-[#FAFAF9]/50 transition-colors">
                      <td className="py-3.5 font-bold text-[#0C0A09]">{staff.name}</td>
                      <td className="py-3.5 text-[#57534E] font-medium">{staff.role}</td>
                      <td className="py-3.5 text-[#57534E] font-mono">{staff.email}</td>
                      <td className="py-3.5 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          staff.status === "Active" 
                            ? "bg-emerald-500/10 text-emerald-700" 
                            : staff.status === "On Break" 
                            ? "bg-amber-500/10 text-amber-700" 
                            : "bg-[#57534E]/10 text-[#57534E]"
                        }`}>
                          {staff.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column - Store Information Settings */}
          <div className="bg-white p-6 rounded-2xl border border-[#57534E]/15 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#064E3B] mb-4">Mga Setting ng Tindahan</h3>
              <p className="text-xs text-[#57534E] leading-relaxed mb-6">
                Ibahagi o i-edit ang impormasyon ng iyong business unit. Ang mga pagbabago dito ay direktang makikita ng iyong cashiers sa POS.
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#57534E] uppercase mb-1">Pangalan ng Branch</label>
                  <input type="text" disabled className="w-full px-3 py-2 border border-[#57534E]/20 bg-[#FAFAF9] rounded-lg text-[#57534E]" value="KYUT Sari-Sari Store" />
                </div>
                <div>
                  <label className="block font-bold text-[#57534E] uppercase mb-1">Uri ng Negosyo</label>
                  <input type="text" disabled className="w-full px-3 py-2 border border-[#57534E]/20 bg-[#FAFAF9] rounded-lg text-[#57534E]" value="Retail / Convenience" />
                </div>
              </div>
            </div>

            <button className="w-full py-3 border border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B]/5 font-bold rounded-xl text-xs transition mt-6 cursor-pointer">
              I-update ang Impormasyon
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
