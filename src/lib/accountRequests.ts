import { supabase } from "@/integrations/supabase/client";
import type { createAccountWork } from "./privacy";

export async function getAccountAccessToken(work: ReturnType<typeof createAccountWork>) {
  work.assertCurrent();
  const { data: { session } } = await supabase.auth.getSession();
  work.assertCurrent();
  if (!session?.access_token || session.user.id !== work.userId) {
    throw new DOMException("Account changed", "AbortError");
  }
  return session.access_token;
}

/** Pin both mutations to the initiating JWT, never the client's later active session. */
export async function saveAccountProfile(
  work: ReturnType<typeof createAccountWork>,
  profile: { name: string; email: string; currentEmail: string },
) {
  const token = await getAccountAccessToken(work);
  const headers = {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(work.userId!)}`, {
    method: "PATCH", headers, body: JSON.stringify({ display_name: profile.name }), signal: work.signal,
  });
  work.assertCurrent();
  if (!response.ok) throw new Error("Failed to update profile");
  const emailChanged = profile.email !== profile.currentEmail;
  if (emailChanged) {
    const result = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`, {
      method: "PUT", headers, body: JSON.stringify({ email: profile.email }), signal: work.signal,
    });
    work.assertCurrent();
    if (!result.ok) throw new Error("Failed to request email change");
  }
  return emailChanged;
}
