// app/programs/[id]/beneficiaries/page.tsx — List beneficiaries for a program.
// Admins and assigned staff can view and add beneficiaries.
// Admins can also delete records.

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  getProgram,
  listBeneficiaries,
  deleteBeneficiary,
  getMe,
  Program,
  Beneficiary,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

export default function BeneficiariesPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [program, setProgram]           = useState<Program | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isAdmin, setIsAdmin]           = useState(false);
  const [search, setSearch]             = useState("");
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [error, setError]               = useState("");

  const load = useCallback((q: string) => {
    const token = getToken()!;
    listBeneficiaries(token, id, q || undefined)
      .then(setBeneficiaries)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    Promise.all([getProgram(token, id), getMe(token)])
      .then(([prog, me]) => {
        setProgram(prog);
        setIsAdmin(me.is_admin);
        load("");
      })
      .catch((e) => setError(e.message));
  }, [router, id, load]);

  // Debounce search so we don't fire on every keystroke
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  async function handleDelete(b: Beneficiary) {
    if (!confirm(`Remove "${b.full_name}" from this program? This cannot be undone.`)) return;
    const token = getToken()!;
    setDeletingId(b.id);
    try {
      await deleteBeneficiary(token, id, b.id);
      setBeneficiaries((prev) => prev.filter((x) => x.id !== b.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">

        {/* Breadcrumb */}
        <div className="text-xs text-[#7A9A80] flex items-center gap-1.5">
          <Link href="/programs" className="hover:underline">Programs</Link>
          <span>/</span>
          <Link href={`/programs/${id}`} className="hover:underline">{program.name}</Link>
          <span>/</span>
          <span className="text-gray-500">Beneficiaries</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Beneficiaries</h1>
            <p className="text-sm text-[#7A9A80] mt-0.5">{program.name}</p>
          </div>
          <Link
            href={`/programs/${id}/beneficiaries/new`}
            className="bg-[#1B3A28] hover:bg-[#163020] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Beneficiary
          </Link>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <input
          type="search"
          placeholder="Search by name or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-[#C8DBBC] bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A28]"
        />

        {/* Table / empty state */}
        {beneficiaries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-16 text-center text-gray-400 text-sm">
            No beneficiaries found.{" "}
            <Link href={`/programs/${id}/beneficiaries/new`} className="text-[#2D5E3A] hover:underline">
              Register the first one →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Age</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Registered</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {beneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{b.full_name}</td>
                    <td className="px-6 py-3 text-gray-500">{b.age ?? "—"}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {b.gender ? GENDER_LABELS[b.gender] ?? b.gender : "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{b.location ?? "—"}</td>
                    <td className="px-6 py-3 text-gray-500">{b.date_registered ?? "—"}</td>
                    <td className="px-6 py-3 text-right flex items-center justify-end gap-4">
                      <Link
                        href={`/programs/${id}/beneficiaries/${b.id}/edit`}
                        className="text-xs text-[#2D5E3A] hover:underline"
                      >
                        Edit
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(b)}
                          disabled={deletingId === b.id}
                          className="text-xs text-red-500 hover:underline disabled:opacity-40"
                        >
                          {deletingId === b.id ? "Removing…" : "Remove"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {beneficiaries.length > 0 && (
          <p className="text-xs text-[#7A9A80] text-right">{beneficiaries.length} beneficiar{beneficiaries.length !== 1 ? "ies" : "y"}</p>
        )}
      </main>
    </>
  );
}
