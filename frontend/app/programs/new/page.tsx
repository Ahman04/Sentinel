// app/programs/new/page.tsx — Create program form.

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createProgram } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function NewProgramPage() {
  const router = useRouter();
  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [status, setStatus]       = useState("active");
  const [startDate, setStartDate] = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const token = getToken()!;
    try {
      await createProgram(token, {
        name,
        description: description || undefined,
        status,
        start_date: startDate || undefined,
      });
      router.push("/programs");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create program");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-[#C8DBBC] bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A28] focus:border-transparent transition";

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Create Program</h1>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Program Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Food Aid 2025" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="What is this program about?"
            />
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
              {loading ? "Creating…" : "Create Program"}
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
