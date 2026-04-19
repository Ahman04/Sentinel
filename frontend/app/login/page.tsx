// app/login/page.tsx — Split-screen login page.
// Left: brand panel with quote and trust badges.
// Right: form with inline validation, show/hide password, error states.

"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { saveToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [pwErr, setPwErr]       = useState("");
  const [formErr, setFormErr]   = useState("");
  const [loading, setLoading]   = useState(false);

  // Clear field-level errors as user corrects input
  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (emailErr) setEmailErr("");
    if (formErr)  setFormErr("");
  }

  function handlePwChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    if (pwErr)   setPwErr("");
    if (formErr) setFormErr("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormErr("");

    // Client-side validation
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) { setEmailErr("Enter a valid email address."); return; }
    if (!password)   { setPwErr("Password is required.");           return; }

    setLoading(true);
    try {
      const data = await login(email, password);
      saveToken(data.access_token);
      document.cookie = `sentinel_token=${data.access_token}; path=/; max-age=86400`;
      router.push("/dashboard");
    } catch (err: unknown) {
      setFormErr(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full bg-white px-4 py-3 text-sm text-gray-900 rounded-xl border-[1.5px] transition focus:outline-none focus:ring-[3px]";
  const inputOk  = `${inputBase} border-[#C8DBBC] focus:border-[#1B3A28] focus:ring-[#1B3A28]/20`;
  const inputErr = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-400/20`;

  return (
    <main className="min-h-screen grid lg:grid-cols-[45fr_55fr]">

      {/* ── Left panel ───────────────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-between bg-[#1B3A28] p-12 overflow-hidden">

        {/* Decorative concentric rings (bottom-right) */}
        <div className="pointer-events-none absolute -bottom-24 -right-24 opacity-[0.06]">
          {[320, 240, 160, 80].map((s) => (
            <span
              key={s}
              className="absolute rounded-full border border-white"
              style={{ width: s, height: s, top: (320 - s) / 2, left: (320 - s) / 2 }}
            />
          ))}
        </div>

        {/* Logo */}
        <span
          className="text-white text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          HopeAccess
        </span>

        {/* Quote */}
        <div className="space-y-3 z-10">
          <p
            className="text-white text-[1.75rem] leading-snug italic"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            "Your mission is too important to leave access unmanaged."
          </p>
          <p className="text-[#7A9A80] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            Trusted by NGOs protecting communities worldwide
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-3 z-10">
          {[
            { icon: "🔒", label: "Secure Access" },
            { icon: "⚡", label: "Instant Revocation" },
            { icon: "👥", label: "Team Management" },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-[#C8DBBC] border border-[#C8DBBC]/30"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {icon} {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center bg-[#F5F3EE] px-8 py-16">

        <div className="w-full max-w-[380px] space-y-6">

          {/* Mobile logo */}
          <p
            className="lg:hidden text-[#1B3A28] text-xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            HopeAccess
          </p>

          {/* Heading */}
          <div>
            <h1
              className="text-[2.1rem] font-bold text-[#1B3A28] leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome back
            </h1>
            <p className="text-[#7A9A80] text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              Sign in to your HopeAccess account
            </p>
          </div>

          {/* Global error */}
          {formErr && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formErr}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">
                Email address
              </label>
              <input
                type="text"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@organisation.org"
                className={emailErr ? inputErr : inputOk}
                autoComplete="email"
              />
              {emailErr && <p className="mt-1 text-xs text-red-500">{emailErr}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={handlePwChange}
                  className={(pwErr ? inputErr : inputOk) + " pr-16"}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#7A9A80] hover:text-[#1B3A28] transition-colors"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              {pwErr && <p className="mt-1 text-xs text-red-500">{pwErr}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B3A28] hover:bg-[#163020] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 text-white font-semibold py-3 rounded-full text-sm transition-all duration-150"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Forgot */}
          <p className="text-center text-sm text-[#7A9A80]" style={{ fontFamily: "'Inter', sans-serif" }}>
            Forgot your password?{" "}
            <span className="text-[#2D5E3A] font-medium cursor-pointer hover:underline">
              Contact your administrator
            </span>
          </p>
        </div>

        {/* Footer note pinned to bottom */}
        <p
          className="absolute bottom-6 text-center text-xs text-[#7A9A80] w-full px-8"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Don&apos;t have an account? Contact your administrator.
        </p>
      </div>
    </main>
  );
}
