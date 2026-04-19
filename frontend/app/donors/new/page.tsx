// app/donors/new/page.tsx — Add a new donor. Admin-only.

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createDonor, getMe } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function NewDonorPage() {
  const router = useRouter();
 // Form state - could be optimized with useReducer or a form library, but this is straightforward enough for now
  const [fullName, setFullName]         = useState("");
  const [email, setEmail]               = useState("");
  const [phone, setPhone]               = useState("");
  const [organization, setOrganization] = useState("");
  const [notes, setNotes]               = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    getMe(token).then((me) => {
      if (!me.is_admin) router.push("/dashboard");
    }).catch(() => router.push("/login"));
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const token = getToken()!;
    try {
      await createDonor(token, {
        full_name: fullName,
        email: email || undefined,
        phone: phone || undefined,
        organization: organization || undefined,
        notes: notes || undefined,
      });
      router.push("/donors");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add donor");
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
          <Link href="/donors" className="hover:underline">Donors</Link>
          <span>/</span>
          <span className="text-gray-500">New</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Add Donor</h1>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">

          <div>
            <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Mohamed Ali"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Organisation</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Acme Foundation"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="donor@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1B3A28] mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any background information about this donor…"
              className={inputCls}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#1B3A28] hover:bg-[#163020] disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-full transition-colors"
            >
              {loading ? "Saving…" : "Add Donor"}
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
