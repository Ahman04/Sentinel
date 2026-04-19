// components/Navbar.tsx — Top navigation bar shown on all authenticated pages.
// Displays the app name, navigation links, and a logout button.
// Logout clears the token cookie and localStorage, then redirects to /login.

"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { removeToken } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    // Clear token from localStorage and cookie, then send to login.
    removeToken();
    document.cookie = "sentinel_token=; path=/; max-age=0";
    router.push("/login");
  }

  const linkClass = (href: string) =>
    `px-3 py-2 rounded text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-[#1B3A28] text-white"
        : "text-[#C8DBBC] hover:bg-[#1B3A28] hover:text-white"
    }`;

  return (
    <nav className="bg-[#1B3A28] shadow">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <span className="text-white font-bold text-lg tracking-wide">
          HopeAccess
        </span>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>
          <Link href="/users" className={linkClass("/users")}>
            Users
          </Link>
          <Link href="/programs" className={linkClass("/programs")}>
            Programs
          </Link>
          <Link href="/profile" className={linkClass("/profile")}>
            My Profile
          </Link>
        </div>

        {/* Logout */}
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
