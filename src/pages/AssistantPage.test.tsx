import { clearAccountData, prepareAccountData } from "@/lib/privacy";
import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AssistantPage from "./AssistantPage";

const auth = vi.hoisted(() => ({
  listeners: new Set<(event: string, session: unknown) => void>(),
  getSession: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {
  getSession: auth.getSession,
  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    auth.listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => auth.listeners.delete(callback) } } };
  },
} } }));
vi.mock("@/lib/usageLimits", () => ({
  canUseFeature: () => true, recordUsage: vi.fn(), getRemainingUses: () => 5,
  getLimit: () => 5, isPremium: () => false,
}));

describe("assistant request lifetime", () => {
  let root: Root;
  let element: HTMLDivElement;
  let fetchMock: ReturnType<typeof vi.fn>;
  const session = (owner: string) => ({ data: { session: { user: { id: owner }, access_token: `token-${owner}` } } });
  const render = (prompt: string | null, onConsumed = vi.fn(), strict = false) => act(() => {
    const page = createElement(AssistantPage, { accountId: "A", initialPrompt: prompt, onPromptConsumed: onConsumed });
    root.render(strict ? createElement(StrictMode, null, page) : page);
  });
  const advance = () => act(async () => { await vi.advanceTimersByTimeAsync(300); });

  beforeEach(() => {
    clearAccountData();
    prepareAccountData("A");
    vi.useFakeTimers();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    auth.getSession.mockReset().mockResolvedValue(session("A"));
    fetchMock = vi.fn().mockImplementation(async () => new Response('data: [DONE]\n\n', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    element = document.createElement("div");
    document.body.append(element);
    root = createRoot(element);
  });
  afterEach(() => {
    act(() => root.unmount()); element.remove(); auth.listeners.clear();
    sessionStorage.clear(); vi.useRealTimers(); vi.unstubAllGlobals();
  });

  it("dispatches an initial prompt exactly once during StrictMode replay", async () => {
    const onConsumed = vi.fn();
    render("Summarize my budget", onConsumed, true);
    await advance();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onConsumed).toHaveBeenCalledTimes(1);
  });

  it("never dispatches a queued prompt after sign-out", async () => {
    const onConsumed = vi.fn();
    render("A private prompt", onConsumed);
    act(() => auth.listeners.forEach(callback => callback("SIGNED_OUT", null)));
    await advance();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onConsumed).not.toHaveBeenCalled();
  });

  it("does not send captured A context using a B token", async () => {
    auth.getSession.mockResolvedValue(session("B"));
    render("A private prompt");
    await advance();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps a new initial prompt pending while another request is active", async () => {
    let release!: (response: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise<Response>(resolve => { release = resolve; }));
    render(null);
    const button = Array.from(element.querySelectorAll("button")).find(node => node.textContent?.includes("Update my food budget"));
    expect(button).toBeDefined();
    await act(async () => { button!.click(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const onConsumed = vi.fn();
    render("A second prompt", onConsumed);
    await advance();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onConsumed).not.toHaveBeenCalled();
    await act(async () => { release(new Response('data: [DONE]\n\n')); });
    await advance();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onConsumed).toHaveBeenCalledTimes(1);
  });

  it("retains a normal request across same-owner token refresh", async () => {
    render("Normal prompt");
    act(() => auth.listeners.forEach(callback => callback("TOKEN_REFRESHED", { user: { id: "A" } })));
    await advance();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer token-A");
  });
});
