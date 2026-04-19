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
        ? "bg-indigo-700 text-white"
        : "text-indigo-100 hover:bg-indigo-700 hover:text-white"
    }`;

  return (
    <nav className="bg-indigo-800 shadow">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <span className="text-white font-bold text-lg tracking-wide">
          Sentinel
        </span>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>
          <Link href="/users" className={linkClass("/users")}>
            Users
          </Link>
          <Link href="/profile" className={linkClass("/profile")}>
            My Profile
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-sm text-indigo-200 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
