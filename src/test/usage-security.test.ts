import { describe, expect, it } from "vitest";
import { consumeUsage, DAILY_LIMITS } from "../../supabase/functions/_shared/usage";

describe("server usage checks", () => {
  it("enforces five chats per day", () => { expect(DAILY_LIMITS.chat).toBe(5); });
  it("enforces one scenario batch per day", () => { expect(DAILY_LIMITS.scenarios).toBe(1); });
  it("fails closed when the database fails", async () => {
    await expect(consumeUsage({ rpc: async () => ({ data: true, error: new Error("unavailable") }) }, "chat")).rejects.toThrow("Usage verification unavailable");
  });
  it("rejects malformed allowance responses as unavailable", async () => {
    for (const data of [null, undefined, 1, "true", {}, []]) {
      await expect(consumeUsage({ rpc: async () => ({ data, error: null }) }, "chat")).rejects.toThrow("Usage verification unavailable");
    }
  });
  it("rejects exhausted allowance", async () => {
    expect(await consumeUsage({ rpc: async () => ({ data: false, error: null }) }, "chat")).toBe(false);
  });
  it("uses one atomic request with no caller-supplied identity or limit", async () => {
    const calls: unknown[] = [];
    expect(await consumeUsage({ rpc: async (name, args) => { calls.push([name, args]); return { data: true, error: null }; } }, "chat")).toBe(true);
    expect(calls).toEqual([["consume_daily_usage", { _feature: "chat" }]]);
  });
});
