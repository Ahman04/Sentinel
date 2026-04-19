// app/programs/[id]/beneficiaries/new/page.tsx — Register a new beneficiary.
// Any staff member assigned to the program can add beneficiaries.

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createBeneficiary, getProgram, Program } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function NewBeneficiaryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [program, setProgram]             = useState<Program | null>(null);
  const [fullName, setFullName]           = useState("");
  const [age, setAge]                     = useState("");
  const [gender, setGender]               = useState("");
  const [location, setLocation]           = useState("");
  const [notes, setNotes]                 = useState("");
  const [dateRegistered, setDateReg]      = useState("");
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    getProgram(token, id)
      .then(setProgram)
      .catch((e) => setError(e.message));
  }, [router, id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const token = getToken()!;
    try {
      await createBeneficiary(token, id, {
        full_name: fullName,
        age: age || undefined,
        gender: gender || undefined,
        location: location || undefined,
        notes: notes || undefined,
        date_registered: dateRegistered || undefined,
      });
      router.push(`/programs/${id}/beneficiaries`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register beneficiary");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-[#C8DBBC] bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A28] focus:border-transparent transition";

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <div className="text-xs text-[#7A9A80] flex items-center gap-1.5 mb-6">
          <Link href="/programs" className="hover:underline">Programs</Link>
          <span>/</span>
          <Link href={`/programs/${id}`} className="hover:underline">{program?.name ?? "…"}</Link>
          <span>/</span>
          <Link href={`/programs/${id}/beneficiaries`} className="hover:underline">Beneficiaries</Link>
          <span>/</span>
          <span className="text-gray-500">New</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Register Beneficiary</h1>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Amina Hassan"
              className={inputCls}
            />
          </div>

          {/* Age + Gender row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Age</label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 34 or 18-25"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Location + Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Nairobi, Kenya"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Date Registered</label>
              <input
                type="date"
                value={dateRegistered}
                onChange={(e) => setDateReg(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional information…"
              className={inputCls}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#1B3A28] hover:bg-[#163020] disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-full transition-colors"
            >
              {loading ? "Saving…" : "Register Beneficiary"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium py-3 rounded-full transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
