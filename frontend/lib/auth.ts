// lib/auth.ts — Token helpers for storing/reading the JWT in localStorage.
// Components call these instead of touching localStorage directly so the
// key name stays in one place.

const TOKEN_KEY = "sentinel_token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}
