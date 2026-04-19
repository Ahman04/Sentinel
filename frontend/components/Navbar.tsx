"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { removeToken } from "@/lib/auth";
import { getMe } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getMe(token).then((me) => setIsAdmin(me.is_admin)).catch(() => {});
  }, []);

  function handleLogout() {
    removeToken();
    document.cookie = "sentinel_token=; path=/; max-age=0";
    router.push("/login");
  }

  const linkClass = (href: string) =>
    `px-3 py-2 rounded text-sm font-medium transition-colors ${
      pathname === href || pathname.startsWith(href + "/")
        ? "bg-[#163020] text-white"
        : "text-[#C8DBBC] hover:bg-[#163020] hover:text-white"
    }`;

  return (
    <nav className="bg-[#1B3A28] shadow">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="text-white font-bold text-lg tracking-wide">HopeAccess</span>

        <div className="flex items-center gap-1">
          <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
          {isAdmin && (
            <Link href="/users" className={linkClass("/users")}>Users</Link>
          )}
          <Link href="/programs" className={linkClass("/programs")}>Programs</Link>
          {isAdmin && (
            <Link href="/donors" className={linkClass("/donors")}>Donors</Link>
          )}
          <Link href="/profile" className={linkClass("/profile")}>My Profile</Link>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm text-[#C8DBBC] hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
