import { beforeEach, describe, expect, it, vi } from "vitest";
import { prepareAccountData, createAccountWork } from "./privacy";
import { getAccountAccessToken, saveAccountProfile } from "./accountRequests";
import { checkPremium, clearPremiumCache, isPremium, recordUsage, getRemainingUses } from "./usageLimits";

const backend = vi.hoisted(() => ({ getUser: vi.fn(), getSession: vi.fn(), query: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getUser: backend.getUser, getSession: backend.getSession },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: backend.query }) }) }),
} }));

beforeEach(() => {
  prepareAccountData(null);
  localStorage.clear(); sessionStorage.clear(); clearPremiumCache();
  prepareAccountData("A");
  backend.getUser.mockReset().mockResolvedValue({ data: { user: { id: "A" } } });
  backend.getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: "A" }, access_token: "token-A" } } });
  backend.query.mockReset().mockResolvedValue({ data: { plan: "monthly", expires_at: null }, error: null });
});

describe("account-owned entitlement and requests", () => {
  it("does not reuse A premium status for B", async () => {
    expect(await checkPremium()).toBe(true);
    expect(isPremium()).toBe(true);
    prepareAccountData("B");
    expect(isPremium()).toBe(false);
  });
  it("rejects a delayed A subscription lookup after B signs in", async () => {
    let resolve!: (value: unknown) => void;
    backend.query.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const pending = checkPremium();
    await Promise.resolve();
    prepareAccountData("B");
    resolve({ data: { plan: "monthly", expires_at: null }, error: null });
    expect(await pending).toBe(false);
    expect(isPremium()).toBe(false);
  });
  it("preserves same-owner premium state on a normal refresh", async () => {
    expect(await checkPremium()).toBe(true);
    prepareAccountData("A");
    expect(isPremium()).toBe(true);
  });
  it("keeps local usage counts separate without changing limits", () => {
    recordUsage("chat");
    expect(getRemainingUses("chat")).toBe(4);
    prepareAccountData("B");
    expect(getRemainingUses("chat")).toBe(5);
  });
  it("rejects B authentication returned to an A request", async () => {
    backend.getSession.mockResolvedValue({ data: { session: { user: { id: "B" }, access_token: "token-B" } } });
    const task = createAccountWork();
    await expect(getAccountAccessToken(task)).rejects.toMatchObject({ name: "AbortError" });
    task.finish();
  });
  it("rejects an A session result after identity invalidation", async () => {
    const task = createAccountWork();
    const pending = getAccountAccessToken(task);
    prepareAccountData("B");
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    task.finish();
  });
  it("returns the same-owner token for a valid request", async () => {
    const task = createAccountWork();
    await expect(getAccountAccessToken(task)).resolves.toBe("token-A");
    task.finish();
  });
  it("does not request an email update after a pending profile save changes accounts", async () => {
    let release!: (response: Response) => void;
    const request = vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { release = resolve; }));
    vi.stubGlobal("fetch", request);
    const task = createAccountWork();
    const pending = saveAccountProfile(task, { name: "A", email: "new-a@example.invalid", currentEmail: "old-a@example.invalid" });
    await Promise.resolve(); await Promise.resolve();
    prepareAccountData("B");
    release(new Response(null, { status: 204 }));
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][1].headers.Authorization).toBe("Bearer token-A");
    task.finish(); vi.unstubAllGlobals();
  });
  it("uses the captured account token for a normal profile and email change", async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", request);
    const task = createAccountWork();
    await expect(saveAccountProfile(task, { name: "A", email: "new-a@example.invalid", currentEmail: "old-a@example.invalid" })).resolves.toBe(true);
    expect(request.mock.calls.map(call => call[1].method)).toEqual(["PATCH", "PUT"]);
    expect(request.mock.calls.every(call => call[1].headers.Authorization === "Bearer token-A")).toBe(true);
    task.finish(); vi.unstubAllGlobals();
  });
});
