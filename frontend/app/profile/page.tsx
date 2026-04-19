// app/profile/page.tsx — My profile page.
// Shows the logged-in user's details and lets them update their own name.

"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getMe, updateUser, User } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    getMe(token)
      .then((u) => { setUser(u); setFullName(u.full_name); })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const token = getToken()!;
    try {
      const updated = await updateUser(token, user!.id, { full_name: fullName });
      setUser(updated);
      setSuccess("Profile updated.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

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
      <main className="max-w-xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>

        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Member since</dt>
              <dd className="text-gray-700">{new Date(user.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {/* Permissions card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Permissions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {permissions.map(({ label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
                  active ? "bg-indigo-50 border-indigo-200 text-indigo-800" : "bg-gray-50 border-gray-200 text-gray-400"
                }`}
              >
                <span className={active ? "text-indigo-500" : "text-gray-300"}>{active ? "✓" : "✗"}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Edit name form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Update Display Name</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
