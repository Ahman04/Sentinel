// app/page.tsx — Public landing page for HopeAccess.
// Visible to everyone before login. All CTAs lead to /login.

import Link from "next/link";

const playfair = { fontFamily: "'Playfair Display', serif" };
const inter    = { fontFamily: "'Inter', sans-serif" };

export default function LandingPage() {
  return (
    <main className="bg-[#F5F3EE] text-[#1B3A28]" style={inter}>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#F5F3EE]/80 border-b border-[#C8DBBC]/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-[#1B3A28]" style={playfair}>
            <span className="text-[#2D5E3A]">●</span> HopeAccess
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#4A6B52]">
            <a href="#features" className="hover:text-[#1B3A28] transition-colors">Features</a>
            <a href="#how" className="hover:text-[#1B3A28] transition-colors">How it works</a>
            <a href="#about" className="hover:text-[#1B3A28] transition-colors">About</a>
          </div>
          <Link
            href="/login"
            className="bg-[#1B3A28] text-[#F5F3EE] text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#163020] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="space-y-6">
          <span className="inline-block bg-[#C8DBBC] text-[#1B3A28] text-xs font-semibold px-4 py-1.5 rounded-full">
            Built for NGOs &amp; Charities
          </span>
          <h1 className="text-5xl font-bold leading-tight" style={playfair}>
            Manage Your Team.<br />
            <span className="italic font-normal text-[#4A6B52]">Protect Your Mission.</span>
          </h1>
          <p className="text-[#4A6B52] text-lg leading-relaxed max-w-md">
            HopeAccess gives NGOs a simple way to manage staff, volunteers, and donors — with full control over who sees what. Revoke access instantly when someone leaves.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="bg-[#1B3A28] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#163020] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150 text-sm"
            >
              Get Started — It&apos;s Free →
            </Link>
            <a href="#how" className="text-sm text-[#4A6B52] hover:text-[#1B3A28] transition-colors">
              See how it works
            </a>
          </div>
          <p className="text-xs text-[#7A9A80]">
            No credit card &nbsp;·&nbsp; 5-minute setup &nbsp;·&nbsp; Free for small teams
          </p>
        </div>

        {/* Right — dashboard mockup */}
        <div className="bg-[#1B3A28] rounded-[28px] p-6 space-y-4 shadow-2xl">
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm" style={playfair}>Dashboard</span>
            <span className="text-[#7A9A80] text-xs">April 2025</span>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: "128", label: "Staff & Volunteers" },
              { n: "12",  label: "Active Programs" },
              { n: "3",   label: "Pending Invites" },
            ].map(({ n, label }, i) => (
              <div key={label} className={`rounded-xl p-3 ${i === 2 ? "bg-[#2D5E3A]" : "bg-[#F5F3EE]/10"}`}>
                <p className="text-white text-xl font-bold">{n}</p>
                <p className="text-[#7A9A80] text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {/* User rows */}
          <p className="text-[#7A9A80] text-xs font-medium uppercase tracking-wider">Recent Team Members</p>
          {[
            { initials: "AH", name: "Amina Hassan",  role: "Field Staff", status: "Active",  sc: "bg-[#C8DBBC] text-[#1B3A28]" },
            { initials: "JO", name: "James Osei",    role: "Admin",       status: "Active",  sc: "bg-[#2D5E3A] text-white" },
            { initials: "FN", name: "Fatima Ndiaye", role: "Volunteer",   status: "Pending", sc: "bg-yellow-100 text-yellow-800" },
          ].map(({ initials, name, role, status, sc }) => (
            <div key={name} className="flex items-center justify-between bg-[#F5F3EE]/10 rounded-xl px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#C8DBBC] flex items-center justify-center text-[#1B3A28] text-xs font-bold">
                  {initials}
                </div>
                <div>
                  <p className="text-white text-xs font-medium">{name}</p>
                  <p className="text-[#7A9A80] text-[10px]">{role}</p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc}`}>{status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-[#1B3A28] rounded-[28px] px-10 py-16 text-center space-y-4">
          <p className="text-[#7A9A80] text-xs font-semibold uppercase tracking-widest">The Problem</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white max-w-2xl mx-auto leading-snug" style={playfair}>
            "NGOs lose sensitive data every time a staff member walks out the door."
          </h2>
          <p className="text-[#7A9A80] max-w-xl mx-auto text-base leading-relaxed">
            Shared spreadsheets. WhatsApp groups. No access logs. When a volunteer leaves, do you know what they still have access to?
          </p>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-24 space-y-10">
        <div>
          <p className="text-xs font-semibold text-[#7A9A80] uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl font-bold" style={playfair}>
            Everything your team needs.<br />
            <span className="italic font-normal text-[#4A6B52]">Nothing they shouldn&apos;t have.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: "👥", title: "Staff & Volunteer Management", body: "Onboard staff and volunteers in minutes. Set exactly what each person can see and do. Remove access instantly when they leave.", dark: true },
            { icon: "📋", title: "Program Tracking",             body: "Create programs, assign staff, and track beneficiaries per initiative. Keep each program's data separate and secure.", dark: false },
            { icon: "🔐", title: "Donor Access Control",         body: "Donor records are visible only to finance and leadership. Field staff never see sensitive donor information.", dark: false },
            { icon: "⚡", title: "Instant Access Revocation",    body: "One click removes a user's access to everything. No shared passwords to change, no spreadsheets to update.", dark: true },
          ].map(({ icon, title, body, dark }) => (
            <div
              key={title}
              className={`rounded-[20px] p-8 space-y-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-default ${
                dark ? "bg-[#1B3A28]" : "bg-[#C8DBBC]"
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${dark ? "bg-[#2D5E3A]" : "bg-[#1B3A28]/10"}`}>
                {icon}
              </div>
              <h3 className={`text-xl font-bold ${dark ? "text-white" : "text-[#1B3A28]"}`} style={playfair}>
                {title}
              </h3>
              <p className={`text-sm leading-relaxed ${dark ? "text-[#7A9A80]" : "text-[#4A6B52]"}`}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how" className="max-w-6xl mx-auto px-6 pb-24 space-y-10">
        <div className="text-center">
          <p className="text-xs font-semibold text-[#7A9A80] uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-4xl font-bold" style={playfair}>Up and running in minutes.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "1", title: "Create your account",  body: "Sign up and your admin account is ready instantly. No setup fees, no waiting." },
            { n: "2", title: "Add your team",         body: "Invite staff and volunteers, assign their roles and set exactly what each person can access." },
            { n: "3", title: "Stay in control",       body: "Update permissions anytime. When someone leaves, remove their access in one click." },
          ].map(({ n, title, body }) => (
            <div key={n} className="bg-[#C8DBBC] rounded-[20px] p-8 space-y-3 relative overflow-hidden">
              <p
                className="absolute -top-4 -right-2 text-[7rem] font-bold text-[#1B3A28]/10 leading-none select-none"
                style={playfair}
              >
                {n}
              </p>
              <div className="w-9 h-9 rounded-full bg-[#1B3A28] flex items-center justify-center text-white text-sm font-bold relative z-10">
                {n}
              </div>
              <h3 className="text-lg font-bold text-[#1B3A28] relative z-10" style={playfair}>{title}</h3>
              <p className="text-sm text-[#4A6B52] leading-relaxed relative z-10">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-[#1B3A28] rounded-[28px] px-10 py-16 text-center space-y-6">
          <h2 className="text-4xl font-bold text-white" style={playfair}>
            Ready to protect your mission?
          </h2>
          <p className="text-[#7A9A80] max-w-sm mx-auto text-sm leading-relaxed">
            Join NGOs already using HopeAccess to manage their teams securely.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#C8DBBC] text-[#1B3A28] font-bold px-8 py-3 rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150 text-sm"
          >
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer id="about" className="bg-[#1B3A28]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between text-xs text-[#4A6B52]">
          <span>© 2025 HopeAccess. Built for good.</span>
          <span className="flex gap-6">
            <a href="#" className="hover:text-[#C8DBBC] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#C8DBBC] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#C8DBBC] transition-colors">Contact</a>
          </span>
        </div>
      </footer>

    </main>
  );
}
