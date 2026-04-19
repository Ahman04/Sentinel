// app/donors/[id]/page.tsx — Donor detail with donation history. Admin-only.
// Shows donor profile, all recorded donations, and a form to add a new donation.

"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  getDonor,
  listDonations,
  createDonation,
  deleteDonation,
  listPrograms,
  getMe,
  Donor,
  Donation,
  Program,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function DonorDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [donor, setDonor]         = useState<Donor | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [programs, setPrograms]   = useState<Program[]>([]);
  const [error, setError]         = useState("");

  // Add donation form state
  const [amount, setAmount]         = useState("");
  const [currency, setCurrency]     = useState("USD");
  const [date, setDate]             = useState("");
  const [programId, setProgramId]   = useState("");
  const [donationNotes, setDonNotes] = useState("");
  const [adding, setAdding]         = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    getMe(token).then((me) => {
      if (!me.is_admin) { router.push("/dashboard"); return; }
      Promise.all([getDonor(token, id), listDonations(token, id), listPrograms(token)])
        .then(([d, dons, progs]) => {
          setDonor(d);
          setDonations(dons);
          setPrograms(progs);
        })
        .catch((e) => setError(e.message));
    }).catch(() => router.push("/login"));
  }, [router, id]);

  async function handleAddDonation(e: FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setAdding(true);
    const token = getToken()!;
    try {
      const donation = await createDonation(token, id, {
        amount,
        currency,
        date: date || undefined,
        program_id: programId || undefined,
        notes: donationNotes || undefined,
      });
      setDonations((prev) => [donation, ...prev]);
      setDonor((prev) => prev ? { ...prev, donation_count: prev.donation_count + 1 } : prev);
      // Reset form
      setAmount(""); setCurrency("USD"); setDate(""); setProgramId(""); setDonNotes("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to record donation");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteDonation(donationId: string) {
    if (!confirm("Remove this donation record?")) return;
    const token = getToken()!;
    setDeletingId(donationId);
    try {
      await deleteDonation(token, id, donationId);
      setDonations((prev) => prev.filter((d) => d.id !== donationId));
      setDonor((prev) => prev ? { ...prev, donation_count: Math.max(0, prev.donation_count - 1) } : prev);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove donation");
    } finally {
      setDeletingId(null);
    }
  }

  // Sum all donations for this donor
  const totalDonated = donations.reduce((sum, d) => sum + parseFloat(d.amount || "0"), 0);

  const inputCls = "rounded-xl border border-[#C8DBBC] bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A28]";

  if (!donor) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Breadcrumb */}
        <div className="text-xs text-[#7A9A80] flex items-center gap-1.5">
          <Link href="/donors" className="hover:underline">Donors</Link>
          <span>/</span>
          <span className="text-gray-500">{donor.full_name}</span>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Donor profile card */}
        <div className="bg-[#1B3A28] rounded-2xl p-6 text-white space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">{donor.full_name}</h1>
              {donor.organization && <p className="text-[#C8DBBC] text-sm mt-0.5">{donor.organization}</p>}
            </div>
            <Link
              href={`/donors/${id}/edit`}
              className="text-xs text-[#C8DBBC] border border-[#C8DBBC]/40 px-3 py-1 rounded-full hover:bg-[#2D5E3A] transition-colors"
            >
              Edit
            </Link>
          </div>

          <div className="flex gap-6 text-xs text-[#7A9A80] flex-wrap">
            {donor.email && <span>{donor.email}</span>}
            {donor.phone && <span>{donor.phone}</span>}
            <span>{donor.donation_count} donation{donor.donation_count !== 1 ? "s" : ""}</span>
          </div>

          {/* Total donated summary */}
          {donations.length > 0 && (
            <div className="mt-2 bg-[#2D5E3A] rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-[#C8DBBC]">Total donated</span>
              <span className="text-white font-bold text-lg">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: donations[0]?.currency ?? "USD" }).format(totalDonated)}
              </span>
            </div>
          )}

          {donor.notes && <p className="text-[#C8DBBC] text-sm leading-relaxed">{donor.notes}</p>}
        </div>

        {/* Donation history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Donation History</h2>
            <span className="text-xs text-[#7A9A80]">{donations.length} record{donations.length !== 1 ? "s" : ""}</span>
          </div>

          {donations.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No donations recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Program</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Notes</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((d) => {
                  const prog = programs.find((p) => p.id === d.program_id);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-[#1B3A28]">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: d.currency }).format(parseFloat(d.amount))}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{prog ? prog.name : "Unrestricted"}</td>
                      <td className="px-6 py-3 text-gray-500">{d.date ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-400 text-xs max-w-[160px] truncate">{d.notes ?? "—"}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleDeleteDonation(d.id)}
                          disabled={deletingId === d.id}
                          className="text-xs text-red-500 hover:underline disabled:opacity-40"
                        >
                          {deletingId === d.id ? "Removing…" : "Remove"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Add donation form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Record a Donation</h2>
          <form onSubmit={handleAddDonation} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-[#1B3A28] mb-1">Amount <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000.00"
                  className={`w-full ${inputCls}`}
                />
              </div>
              {/* Currency */}
              <div>
                <label className="block text-xs font-medium text-[#1B3A28] mb-1">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`w-full ${inputCls}`}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="KES">KES</option>
                  <option value="SOS">SOS</option>
                  <option value="ETB">ETB</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-[#1B3A28] mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full ${inputCls}`}
                />
              </div>
              {/* Program */}
              <div>
                <label className="block text-xs font-medium text-[#1B3A28] mb-1">Program (optional)</label>
                <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={`w-full ${inputCls}`}>
                  <option value="">Unrestricted</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-[#1B3A28] mb-1">Notes</label>
              <input
                type="text"
                value={donationNotes}
                onChange={(e) => setDonNotes(e.target.value)}
                placeholder="e.g. Annual pledge, wire transfer"
                className={`w-full ${inputCls}`}
              />
            </div>

            <button
              type="submit"
              disabled={adding || !amount}
              className="bg-[#1B3A28] hover:bg-[#163020] disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
            >
              {adding ? "Recording…" : "Record Donation"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
