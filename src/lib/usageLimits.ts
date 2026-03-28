// Usage limit system for free-tier users
// Premium users (verified server-side via subscriptions table) bypass all limits

import { supabase } from "@/integrations/supabase/client";

const LIMITS = {
  chat: 5,
  scenarios: 1,
  insights: 2,
} as const;

type Feature = keyof typeof LIMITS;

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getStorageKey(feature: Feature): string {
  return `sono-usage-${feature}`;
}

interface UsageRecord {
  date: string;
  count: number;
}

// Cache premium status for 5 minutes to avoid excessive DB calls
let premiumCache: { value: boolean; expires: number } | null = null;

export async function checkPremium(): Promise<boolean> {
  if (premiumCache && Date.now() < premiumCache.expires) {
    return premiumCache.value;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      premiumCache = { value: false, expires: Date.now() + 60_000 };
      return false;
    }

    const { data } = await supabase
      .from("subscriptions")
      .select("plan, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const isPrem = !!data &&
      (data.plan === "trial" || data.plan === "monthly") &&
      (!data.expires_at || new Date(data.expires_at) > new Date());

    premiumCache = { value: isPrem, expires: Date.now() + 300_000 };
    return isPrem;
  } catch {
    return false;
  }
}

/** Synchronous check using cached value — call checkPremium() first to populate */
export function isPremium(): boolean {
  return premiumCache?.value ?? false;
}

/** Clear cache on login/logout */
export function clearPremiumCache(): void {
  premiumCache = null;
}

export function getUsageCount(feature: Feature): number {
  try {
    const raw = localStorage.getItem(getStorageKey(feature));
    if (!raw) return 0;
    const record: UsageRecord = JSON.parse(raw);
    if (record.date !== getDateKey()) return 0;
    return record.count;
  } catch {
    return 0;
  }
}

export function getRemainingUses(feature: Feature): number {
  if (isPremium()) return Infinity;
  return Math.max(0, LIMITS[feature] - getUsageCount(feature));
}

export function canUseFeature(feature: Feature): boolean {
  if (isPremium()) return true;
  return getUsageCount(feature) < LIMITS[feature];
}

export function recordUsage(feature: Feature): void {
  const today = getDateKey();
  const current = getUsageCount(feature);
  const record: UsageRecord = { date: today, count: current + 1 };
  localStorage.setItem(getStorageKey(feature), JSON.stringify(record));
}

export function getLimit(feature: Feature): number {
  return LIMITS[feature];
}
