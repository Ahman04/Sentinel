// app/dashboard/page.tsx — Dashboard landing page shown after login.
// Fetches the current user's profile and displays a welcome card with
// their role and permissions summary.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getMe, User } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    getMe(token).catch(() => router.push("/login")).then((u) => {
      if (u) setUser(u);
    });
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  const permissions = [
    { label: "Admin", active: user.is_admin },
    { label: "Create users", active: user.can_create_user },
    { label: "Update users", active: user.can_update_user },
    { label: "Delete users", active: user.can_delete_user },
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Welcome card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {user.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 mb-6">{user.email}</p>

          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Your permissions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {permissions.map(({ label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium border ${
                  active
                    ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                    : "bg-gray-50 border-gray-200 text-gray-400"
                }`}
              >
                <span className={active ? "text-indigo-500" : "text-gray-300"}>
                  {active ? "✓" : "✗"}
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Quick action links shown only to users who can manage others */}
        {(user.is_admin || user.can_create_user) && (
          <div className="mt-6 flex gap-3">
            <a
              href="/users"
              className="flex-1 text-center bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-medium py-3 rounded-xl transition-colors"
            >
              Manage Users
            </a>
            <a
              href="/users/new"
              className="flex-1 text-center bg-white border border-indigo-300 hover:border-indigo-500 text-indigo-700 text-sm font-medium py-3 rounded-xl transition-colors"
            >
              Create User
            </a>
          </div>
        )}
      </main>
    </>
  );
}
