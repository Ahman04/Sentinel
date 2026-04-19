// lib/api.ts — Centralised API client for all backend requests.
// All functions read NEXT_PUBLIC_API_URL from the environment so the
// base URL stays in one place and is easy to swap for staging/prod.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_active: boolean;
  can_create_user: boolean;
  can_update_user: boolean;
  can_delete_user: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CreateUserPayload {
  email: string;
  full_name: string;
  password: string;
  is_admin?: boolean;
  can_create_user?: boolean;
  can_update_user?: boolean;
  can_delete_user?: boolean;
}

export interface UpdateUserPayload {
  full_name?: string;
  is_active?: boolean;
  is_admin?: boolean;
  can_create_user?: boolean;
  can_update_user?: boolean;
  can_delete_user?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Build standard JSON headers, optionally attaching a bearer token.
function headers(token?: string): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// Throw a descriptive error if the response status is not OK.
async function checkResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || `Request failed: ${res.status}`);
  }
  return res;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  await checkResponse(res);
  return res.json();
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/me`, { headers: headers(token) });
  await checkResponse(res);
  return res.json();
}

export async function listUsers(token: string): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/users`, { headers: headers(token) });
  await checkResponse(res);
  return res.json();
}

export async function getUser(token: string, id: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/${id}`, { headers: headers(token) });
  await checkResponse(res);
  return res.json();
}

export async function createUser(token: string, payload: CreateUserPayload): Promise<User> {
  const res = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  await checkResponse(res);
  return res.json();
}

export async function updateUser(token: string, id: string, payload: UpdateUserPayload): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  await checkResponse(res);
  return res.json();
}

export async function deleteUser(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  await checkResponse(res);
}

// ── Programs ───────────────────────────────────────────────────────────────

export interface Program {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "completed" | "paused";
  start_date: string | null;
  created_at: string;
  member_count: number;
}

export interface ProgramMember {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface CreateProgramPayload {
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
}

export interface UpdateProgramPayload {
  name?: string;
  description?: string;
  status?: string;
  start_date?: string;
}

export async function listPrograms(token: string): Promise<Program[]> {
  const res = await fetch(`${BASE_URL}/programs`, { headers: headers(token) });
  await checkResponse(res);
  return res.json();
}

export async function getProgram(token: string, id: string): Promise<Program> {
  const res = await fetch(`${BASE_URL}/programs/${id}`, { headers: headers(token) });
  await checkResponse(res);
  return res.json();
}

export async function createProgram(token: string, payload: CreateProgramPayload): Promise<Program> {
  const res = await fetch(`${BASE_URL}/programs`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  await checkResponse(res);
  return res.json();
}

export async function updateProgram(token: string, id: string, payload: UpdateProgramPayload): Promise<Program> {
  const res = await fetch(`${BASE_URL}/programs/${id}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  await checkResponse(res);
  return res.json();
}

export async function deleteProgram(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/programs/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  await checkResponse(res);
}

export async function listProgramMembers(token: string, programId: string): Promise<ProgramMember[]> {
  const res = await fetch(`${BASE_URL}/programs/${programId}/members`, { headers: headers(token) });
  await checkResponse(res);
  return res.json();
}

export async function addProgramMember(token: string, programId: string, userId: string, role: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/programs/${programId}/members`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ user_id: userId, role }),
  });
  await checkResponse(res);
}

export async function removeProgramMember(token: string, programId: string, userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/programs/${programId}/members/${userId}`, {
    method: "DELETE",
    headers: headers(token),
  });
  await checkResponse(res);
}

// ── Beneficiaries ──────────────────────────────────────────────────────────

export interface Beneficiary {
  id: string;
  program_id: string;
  full_name: string;
  age: string | null;
  gender: string | null;
  location: string | null;
  notes: string | null;
  date_registered: string | null;
  created_at: string;
}

export interface CreateBeneficiaryPayload {
  full_name: string;
  age?: string;
  gender?: string;
  location?: string;
  notes?: string;
  date_registered?: string;
}

export interface UpdateBeneficiaryPayload {
  full_name?: string;
  age?: string;
  gender?: string;
  location?: string;
  notes?: string;
  date_registered?: string;
}

export async function listBeneficiaries(token: string, programId: string, search?: string): Promise<Beneficiary[]> {
  const url = new URL(`${BASE_URL}/programs/${programId}/beneficiaries`);
  if (search) url.searchParams.set("search", search);
  const res = await fetch(url.toString(), { headers: headers(token) });
  await checkResponse(res);
  return res.json();
}

export async function getBeneficiary(token: string, programId: string, id: string): Promise<Beneficiary> {
  const res = await fetch(`${BASE_URL}/programs/${programId}/beneficiaries/${id}`, { headers: headers(token) });
  await checkResponse(res);
  return res.json();
}

export async function createBeneficiary(token: string, programId: string, payload: CreateBeneficiaryPayload): Promise<Beneficiary> {
  const res = await fetch(`${BASE_URL}/programs/${programId}/beneficiaries`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  await checkResponse(res);
  return res.json();
}

export async function updateBeneficiary(token: string, programId: string, id: string, payload: UpdateBeneficiaryPayload): Promise<Beneficiary> {
  const res = await fetch(`${BASE_URL}/programs/${programId}/beneficiaries/${id}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  await checkResponse(res);
  return res.json();
}

export async function deleteBeneficiary(token: string, programId: string, id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/programs/${programId}/beneficiaries/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  await checkResponse(res);
}
