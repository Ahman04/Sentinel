// app/users/[id]/page.tsx — Edit user page.
// Loads the user by ID from GET /users/{id} and submits changes via PUT.
// Permission checkboxes are shown only to admins (non-admins cannot
// escalate permissions — the backend enforces this too).

"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getUser, updateUser, getMe, User } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [me, setMe] = useState<User | null>(null);

  // Form state seeded from the fetched user
  const [fullName, setFullName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    Promise.all([getMe(token), getUser(token, userId)])
      .then(([meData, userData]) => {
        setMe(meData);
        setFullName(userData.full_name);
        setIsActive(userData.is_active);
        setIsAdmin(userData.is_admin);
        setCanCreate(userData.can_create_user);
        setCanUpdate(userData.can_update_user);
        setCanDelete(userData.can_delete_user);
      })
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, [router, userId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const token = getToken()!;
    try {
      await updateUser(token, userId, {
        full_name: fullName,
        is_active: isActive,
        ...(me?.is_admin && {
          is_admin: isAdmin,
          can_create_user: canCreate,
          can_update_user: canUpdate,
          can_delete_user: canDelete,
        }),
      });
      router.push("/users");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Edit User</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A28]"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-[#1B3A28]"
              />
              Active account
            </label>
          </div>

          {/* Permission toggles — admins only */}
          {me?.is_admin && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Permissions</p>
              <div className="space-y-2">
                {[
                  { label: "Admin", value: isAdmin, setter: setIsAdmin },
                  { label: "Can create users", value: canCreate, setter: setCanCreate },
                  { label: "Can update users", value: canUpdate, setter: setCanUpdate },
                  { label: "Can delete users", value: canDelete, setter: setCanDelete },
                ].map(({ label, value, setter }) => (
                  <label key={label} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setter(e.target.checked)}
                      className="accent-[#1B3A28]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#1B3A28] hover:bg-[#163020] disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
