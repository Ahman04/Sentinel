// app/programs/[id]/page.tsx — Program detail page showing info + members.

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getProgram, listProgramMembers, removeProgramMember, addProgramMember, listUsers, getMe, Program, ProgramMember, User } from "@/lib/api";
import { getToken } from "@/lib/auth";

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  paused:    "bg-yellow-100 text-yellow-700",
};

export default function ProgramDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [program, setProgram]   = useState<Program | null>(null);
  const [members, setMembers]   = useState<ProgramMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [error, setError]       = useState("");

  // Add member form state
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [adding, setAdding]             = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    Promise.all([getProgram(token, id), listProgramMembers(token, id), getMe(token)])
      .then(([prog, mems, me]) => {
        setProgram(prog);
        setMembers(mems);
        setIsAdmin(me.is_admin);
        if (me.is_admin) listUsers(token).then(setAllUsers);
      })
      .catch((e) => setError(e.message));
  }, [router, id]);

  async function handleAddMember() {
    if (!selectedUser) return;
    setAdding(true);
    const token = getToken()!;
    try {
      await addProgramMember(token, id, selectedUser, selectedRole);
      const updated = await listProgramMembers(token, id);
      setMembers(updated);
      setSelectedUser("");
      setSelectedRole("member");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add member");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this member?")) return;
    const token = getToken()!;
    try {
      await removeProgramMember(token, id, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove member");
    }
  }

  const unassigned = allUsers.filter((u) => !members.find((m) => m.user_id === u.id));

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
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Program header */}
        <div className="bg-[#1B3A28] rounded-2xl p-6 text-white space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{program.name}</h1>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[program.status]}`}>
              {program.status}
            </span>
          </div>
          {program.description && <p className="text-[#C8DBBC] text-sm leading-relaxed">{program.description}</p>}
          <div className="flex gap-6 text-xs text-[#7A9A80]">
            <span>{program.member_count} member{program.member_count !== 1 ? "s" : ""}</span>
            {program.start_date && <span>Started {program.start_date}</span>}
            <span>Created {new Date(program.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            <Link href={`/programs/${id}/beneficiaries`} className="text-xs text-[#C8DBBC] border border-[#C8DBBC]/40 px-3 py-1 rounded-full hover:bg-[#2D5E3A] transition-colors">
              Beneficiaries
            </Link>
            {isAdmin && (
              <Link href={`/programs/${id}/edit`} className="text-xs text-[#C8DBBC] border border-[#C8DBBC]/40 px-3 py-1 rounded-full hover:bg-[#2D5E3A] transition-colors">
                Edit Program
              </Link>
            )}
          </div>
        </div>

        {/* Members list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Team Members</h2>
            <span className="text-xs text-[#7A9A80]">{members.length} total</span>
          </div>

          {members.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No members assigned yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  {isAdmin && <th className="px-6 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((m) => (
                  <tr key={m.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{m.full_name}</td>
                    <td className="px-6 py-3 text-gray-500">{m.email}</td>
                    <td className="px-6 py-3">
                      <span className="bg-[#C8DBBC] text-[#1B3A28] text-xs font-medium px-2 py-0.5 rounded-full capitalize">
                        {m.role}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => handleRemove(m.user_id)} className="text-xs text-red-500 hover:underline">
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add member — admin only */}
        {isAdmin && unassigned.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Add Member</h2>
            <div className="flex gap-3 flex-wrap">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="flex-1 rounded-xl border border-[#C8DBBC] bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A28]"
              >
                <option value="">Select a user…</option>
                {unassigned.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>
                ))}
              </select>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-xl border border-[#C8DBBC] bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B3A28]"
              >
                <option value="member">Member</option>
                <option value="coordinator">Coordinator</option>
                <option value="field_staff">Field Staff</option>
                <option value="volunteer">Volunteer</option>
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedUser || adding}
                className="bg-[#1B3A28] hover:bg-[#163020] disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
              >
                {adding ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
