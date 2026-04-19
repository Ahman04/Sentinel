"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getMe, getStats, User, Stats } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]   = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    Promise.all([getMe(token), getStats(token)])
      .then(([u, s]) => { setUser(u); setStats(s); })
      .catch(() => router.push("/login"));
  }, [router]);

  if (!user || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
    );
  }

  // Build stat cards based on role
  const cards: StatCard[] = stats.scope === "global"
    ? [
        { label: "Total Staff",          value: stats.total_users,         href: "/users" },
        { label: "Active Programs",       value: stats.active_programs,     sub: `of ${stats.total_programs} total`, href: "/programs" },
        { label: "Beneficiaries Served",  value: stats.total_beneficiaries  },
        {
          label: "Donations Received",
          value: stats.total_donations,
          sub: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(stats.donation_total_usd),
          href: "/donors",
        },
      ]
    : [
        { label: "My Programs",          value: stats.assigned_programs,   href: "/programs" },
        { label: "Active Programs",      value: stats.active_programs      },
        { label: "Beneficiaries Served", value: stats.total_beneficiaries  },
      ];

  const permissions = [
    { label: "Admin",         active: user.is_admin },
    { label: "Create users",  active: user.can_create_user },
    { label: "Update users",  active: user.can_update_user },
    { label: "Delete users",  active: user.can_delete_user },
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-[#7A9A80] mt-1">{user.email}</p>
        </div>

        {/* Stat cards */}
        <div className={`grid gap-4 ${cards.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
          {cards.map((c) => {
            const inner = (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-1 hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-[#7A9A80] uppercase tracking-wider">{c.label}</p>
                <p className="text-3xl font-bold text-[#1B3A28]">{c.value.toLocaleString()}</p>
                {c.sub && <p className="text-xs text-gray-400">{c.sub}</p>}
              </div>
            );
            return c.href ? (
              <Link key={c.label} href={c.href}>{inner}</Link>
            ) : (
              <div key={c.label}>{inner}</div>
            );
          })}
        </div>

        {/* Permissions + quick actions */}
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Permissions card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Permissions</h2>
            <div className="grid grid-cols-2 gap-3">
              {permissions.map(({ label, active }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium border ${
                    active
                      ? "bg-[#F0F7EC] border-[#C8DBBC] text-[#1B3A28]"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                >
                  <span className={active ? "text-[#2D5E3A]" : "text-gray-300"}>{active ? "✓" : "✗"}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-[#1B3A28] rounded-2xl p-6 text-white space-y-4">
            <h2 className="text-xs font-semibold text-[#C8DBBC] uppercase tracking-wider">Quick Actions</h2>
            <div className="space-y-2">
              {(user.is_admin || user.can_create_user) && (
                <Link href="/users/new" className="flex items-center justify-between bg-[#2D5E3A] hover:bg-[#3A7A4A] rounded-xl px-4 py-3 text-sm font-medium transition-colors">
                  <span>Add Staff Member</span>
                  <span className="text-[#C8DBBC]">→</span>
                </Link>
              )}
              {user.is_admin && (
                <Link href="/programs" className="flex items-center justify-between bg-[#2D5E3A] hover:bg-[#3A7A4A] rounded-xl px-4 py-3 text-sm font-medium transition-colors">
                  <span>Manage Programs</span>
                  <span className="text-[#C8DBBC]">→</span>
                </Link>
              )}
              {user.is_admin && (
                <Link href="/donors/new" className="flex items-center justify-between bg-[#2D5E3A] hover:bg-[#3A7A4A] rounded-xl px-4 py-3 text-sm font-medium transition-colors">
                  <span>Add Donor</span>
                  <span className="text-[#C8DBBC]">→</span>
                </Link>
              )}
              {!user.is_admin && (
                <Link href="/programs" className="flex items-center justify-between bg-[#2D5E3A] hover:bg-[#3A7A4A] rounded-xl px-4 py-3 text-sm font-medium transition-colors">
                  <span>View My Programs</span>
                  <span className="text-[#C8DBBC]">→</span>
                </Link>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
