// app/programs/page.tsx — Programs list page.
// Admins see all programs. Others see only programs they are assigned to.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { listPrograms, deleteProgram, Program, getMe } from "@/lib/api";
import { getToken } from "@/lib/auth";

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  paused:    "bg-yellow-100 text-yellow-700",
};

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [error, setError]       = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    Promise.all([listPrograms(token), getMe(token)])
      .then(([progs, me]) => { setPrograms(progs); setIsAdmin(me.is_admin); })
      .catch((e) => setError(e.message));
  }, [router]);

  async function handleDelete(p: Program) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const token = getToken()!;
    setDeletingId(p.id);
    try {
      await deleteProgram(token, p.id);
      setPrograms((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Programs</h1>
            <p className="text-sm text-[#7A9A80] mt-0.5">NGO initiatives and projects</p>
          </div>
          {isAdmin && (
            <Link
              href="/programs/new"
              className="bg-[#1B3A28] hover:bg-[#163020] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + New Program
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {programs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-16 text-center text-gray-400 text-sm">
            No programs yet.{isAdmin && <span> <Link href="/programs/new" className="text-[#2D5E3A] hover:underline">Create the first one →</Link></span>}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <h2 className="font-semibold text-gray-900 text-sm leading-snug">{p.name}</h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {p.status}
                  </span>
                </div>

                {p.description && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{p.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-[#7A9A80]">
                  <span>👥 {p.member_count} member{p.member_count !== 1 ? "s" : ""}</span>
                  {p.start_date && <span>📅 {p.start_date}</span>}
                </div>

                <div className="flex gap-3 pt-1 border-t border-gray-100">
                  <Link href={`/programs/${p.id}`} className="text-xs text-[#2D5E3A] hover:underline font-medium">
                    View
                  </Link>
                  {isAdmin && (
                    <>
                      <Link href={`/programs/${p.id}/edit`} className="text-xs text-[#2D5E3A] hover:underline">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                        className="text-xs text-red-500 hover:underline disabled:opacity-40 ml-auto"
                      >
                        {deletingId === p.id ? "Deleting…" : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
