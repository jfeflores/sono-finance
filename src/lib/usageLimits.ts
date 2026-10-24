import { captureAccountScope, createAccountWork } from "@/lib/privacy";
import { accountLocalStorage } from "@/lib/privacy";
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
let premiumCache: { value: boolean; expires: number; scope: ReturnType<typeof captureAccountScope> } | null = null;
let premiumRevision = 0;

export async function checkPremium(): Promise<boolean> {
  if (premiumCache?.scope.isCurrent() && Date.now() < premiumCache.expires) {
    return premiumCache.value;
  }

  const work = createAccountWork();
  const revision = premiumRevision;
  const scope = captureAccountScope();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!work.isCurrent() || user?.id !== work.userId) return false;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !work.isCurrent() || revision !== premiumRevision) return false;
    const isPrem = !!data &&
      (data.plan === "trial" || data.plan === "monthly") &&
      (!data.expires_at || new Date(data.expires_at) > new Date());

    premiumCache = { value: isPrem, expires: Date.now() + 300_000, scope };
    return isPrem;
  } catch {
    return false;
  } finally {
    work.finish();
  }
}

/** Synchronous check using cached value — call checkPremium() first to populate */
export function isPremium(): boolean {
  return !!premiumCache?.scope.isCurrent() && Date.now() < premiumCache.expires && premiumCache.value;
}

/** Clear cache on login/logout */
export function clearPremiumCache(): void {
  premiumRevision++;
  premiumCache = null;
}

export function getUsageCount(feature: Feature): number {
  try {
    const raw = accountLocalStorage.getItem(getStorageKey(feature));
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
  accountLocalStorage.setItem(getStorageKey(feature), JSON.stringify(record));
}

export function getLimit(feature: Feature): number {
  return LIMITS[feature];
}
