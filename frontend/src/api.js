import { supabase } from "./supabase";

const API = import.meta.env.VITE_API_URL;

async function call(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || `Request failed (${res.status})`);
  return body;
}

export const getProfile = () => call("/api/profile");
export const saveProfile = (profile) =>
  call("/api/profile", { method: "PUT", body: JSON.stringify(profile) });
export const getSuggestions = () => call("/api/suggestions");
