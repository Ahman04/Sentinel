// app/programs/[id]/edit/page.tsx — Edit program form.

"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getProgram, updateProgram } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function EditProgramPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [status, setStatus]       = useState("active");
  const [startDate, setStartDate] = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    getProgram(token, id)
      .then((p) => {
        setName(p.name);
        setDesc(p.description ?? "");
        setStatus(p.status);
        setStartDate(p.start_date ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, [router, id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const token = getToken()!;
    try {
      await updateProgram(token, id, {
        name,
        description: description || undefined,
        status,
        start_date: startDate || undefined,
      });
      router.push(`/programs/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-[#C8DBBC] bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A28] focus:border-transparent transition";

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Program</h1>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Program Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={3} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 bg-[#1B3A28] hover:bg-[#163020] disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-full transition-colors">
              {loading ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" onClick={() => router.back()} className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium py-3 rounded-full transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
