// src/components/LoginForm.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Input Validation (Frontend Checklist #1)
    if (!email || !password) {
      setError("Mangyaring punan ang lahat ng field.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      alert("Maligayang pagbabalik!");
    } catch (err) {
      setError("Maling email o password. Subukan muli.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-center items-center px-4 font-sans text-[#0C0A09]">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md border border-[#57534E]/10">
        <h2 className="text-2xl font-bold text-[#064E3B] text-center mb-2">
          POS System
        </h2>
        <p className="text-sm text-[#57534E] text-center mb-6">
          Mag-login sa iyong account
        </p>

        {error && (
          <div className="bg-[#F97316]/10 text-[#F97316] p-3 rounded-lg text-sm mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              required
              placeholder="cashier@store.com"
              className="w-full px-4 py-2 border border-[#57534E]/30 rounded-lg focus:outline-none focus:border-[#064E3B] text-sm"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-[#57534E]/30 rounded-lg focus:outline-none focus:border-[#064E3B] text-sm"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-semibold py-2.5 rounded-lg transition duration-200 text-sm mt-2 disabled:opacity-50"
          >
            {loading ? "Nagbe-verify..." : "Pumasok sa System"}
          </button>
        </form>

        <div className="text-center mt-4 text-xs text-[#57534E]">
          Walang account?{" "}
          <a
            href="/signup"
            className="text-[#064E3B] font-semibold hover:underline"
          >
            Mag-signup dito
          </a>
        </div>
      </div>
    </div>
  );
};
