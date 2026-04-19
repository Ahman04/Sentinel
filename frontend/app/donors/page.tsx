// app/donors/page.tsx — Donors list page. Admin-only.
// Shows all registered donors with donation counts and quick actions.

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { listDonors, deleteDonor, getMe, Donor } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function DonorsPage() {
  const router = useRouter();
  const [donors, setDonors]       = useState<Donor[]>([]);
  const [search, setSearch]       = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]         = useState("");

  const load = useCallback((q: string) => {
    const token = getToken()!;
    listDonors(token, q || undefined)
      .then(setDonors)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    // Redirect non-admins — donors are sensitive financial data
    getMe(token).then((me) => {
      if (!me.is_admin) { router.push("/dashboard"); return; }
      load("");
    }).catch(() => router.push("/login"));
  }, [router, load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  async function handleDelete(d: Donor) {
    if (!confirm(`Delete donor "${d.full_name}"? All their donation records will also be removed.`)) return;
    const token = getToken()!;
    setDeletingId(d.id);
    try {
      await deleteDonor(token, d.id);
      setDonors((prev) => prev.filter((x) => x.id !== d.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Donors</h1>
            <p className="text-sm text-[#7A9A80] mt-0.5">Individuals and organisations supporting HopeAccess</p>
          </div>
          <Link
            href="/donors/new"
            className="bg-[#1B3A28] hover:bg-[#163020] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Donor
          </Link>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Search */}
        <input
          type="search"
          placeholder="Search by name or organisation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-[#C8DBBC] bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A28]"
        />

        {/* Donor cards */}
        {donors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-16 text-center text-gray-400 text-sm">
            No donors yet.{" "}
            <Link href="/donors/new" className="text-[#2D5E3A] hover:underline">Add the first donor →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {donors.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">

                {/* Name + org */}
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">{d.full_name}</h2>
                  {d.organization && (
                    <p className="text-xs text-[#7A9A80] mt-0.5">{d.organization}</p>
                  )}
                </div>

                {/* Contact */}
                <div className="space-y-0.5 text-xs text-gray-500">
                  {d.email && <p>✉ {d.email}</p>}
                  {d.phone && <p>📞 {d.phone}</p>}
                </div>

                {/* Donation count badge */}
                <div className="flex items-center gap-2">
                  <span className="bg-[#C8DBBC] text-[#1B3A28] text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {d.donation_count} donation{d.donation_count !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1 border-t border-gray-100">
                  <Link href={`/donors/${d.id}`} className="text-xs text-[#2D5E3A] hover:underline font-medium">
                    View
                  </Link>
                  <Link href={`/donors/${d.id}/edit`} className="text-xs text-[#2D5E3A] hover:underline">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(d)}
                    disabled={deletingId === d.id}
                    className="text-xs text-red-500 hover:underline disabled:opacity-40 ml-auto"
                  >
                    {deletingId === d.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {donors.length > 0 && (
          <p className="text-xs text-[#7A9A80] text-right">{donors.length} donor{donors.length !== 1 ? "s" : ""} total</p>
        )}
      </main>
    </>
  );
}
