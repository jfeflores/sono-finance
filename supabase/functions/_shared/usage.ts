export const DAILY_LIMITS = { chat: 5, scenarios: 1, insights: 2 } as const;
export type UsageFeature = keyof typeof DAILY_LIMITS;

export async function consumeUsage(client: { rpc: (name: string, args: Record<string, string>) => PromiseLike<{ data: unknown; error: unknown }> }, feature: UsageFeature) {
  const { data, error } = await client.rpc("consume_daily_usage", { _feature: feature });
  if (error) throw new Error("Usage verification unavailable");
  return data === true;
}