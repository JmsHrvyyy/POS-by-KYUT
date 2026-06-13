import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const SignupForm = () => {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'manager' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Simpleng password strength validation (Frontend Checklist #3)
    if (formData.password.length < 6) {
      setError('Ang password ay dapat hindi bababa sa 6 characters.');
      return;
    }

    try {
      await signup(formData.email, formData.password, formData.fullName, formData.role);
      setSuccess('Account created successfully!');
    } catch (err) {
      setError(err.message || 'May naganap na error habang nagpaparehistro.');
    }
  };

  return (
    // Ginagamit ang font-sans (Plus Jakarta Sans) at background: Stone 50
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-center items-center px-4 font-sans text-[#0C0A09]">
      {/* Card Wrapper - Responsive Grid/Flex structure */}
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md border border-[#57534E]/10">
        <h2 className="text-2xl font-bold text-[#064E3B] text-center mb-6">Gumawa ng Account</h2>
        
        {error && <div className="bg-[#F97316]/10 text-[#F97316] p-3 rounded-lg text-sm mb-4">{error}</div>}
        {success && <div className="bg-emerald-100 text-[#064E3B] p-3 rounded-lg text-sm mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Buong Pangalan</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 border border-[#57534E]/30 rounded-lg focus:outline-none focus:border-[#064E3B]"
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 border border-[#57534E]/30 rounded-lg focus:outline-none focus:border-[#064E3B]"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2 border border-[#57534E]/30 rounded-lg focus:outline-none focus:border-[#064E3B]"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {/* Global Role Selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Ano ang iyong Role?</label>
            <select 
              className="w-full px-4 py-2 border border-[#57534E]/30 rounded-lg bg-white focus:outline-none focus:border-[#064E3B]"
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="manager">Manager / Owner</option>
              <option value="staff">Cashier / Staff</option>
            </select>
          </div>

          {/* Submit Button gamit ang Primary Theme Color: Emerald 900 */}
          <button 
            type="submit" 
            className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-semibold py-2.5 rounded-lg transition duration-200 mt-2"
          >
            Mag-register
          </button>
        </form>
      </div>
    </div>
  );
};