import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAccountLifetime } from "./use-account-lifetime";

const auth = vi.hoisted(() => ({ listeners: new Set<(event: string, session: unknown) => void>() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    auth.listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => auth.listeners.delete(callback) } } };
  } } },
}));

describe("account work lifetime", () => {
  let root: Root;
  let element: HTMLDivElement;
  let lifetime: ReturnType<typeof useAccountLifetime>;
  function Probe({ owner = "A" }) {
    lifetime = useAccountLifetime(owner);
    return null;
  }
  const emit = (event: string, owner: string | null) => act(() => {
    auth.listeners.forEach(callback => callback(event, owner ? { user: { id: owner } } : null));
  });
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    element = document.createElement("div");
    document.body.append(element);
    root = createRoot(element);
    act(() => root.render(createElement(Probe)));
  });
  afterEach(() => { act(() => root.unmount()); element.remove(); auth.listeners.clear(); vi.unstubAllGlobals(); });

  it("keeps ordinary same-owner refresh work alive", () => {
    const task = lifetime.start();
    emit("TOKEN_REFRESHED", "A");
    expect(task.isCurrent()).toBe(true);
    expect(task.signal.aborted).toBe(false);
    task.finish();
    expect(lifetime.state.controllers.size).toBe(0);
  });
  it("aborts pending work on sign-out and rejects a later same-owner sign-in", () => {
    const task = lifetime.start();
    emit("SIGNED_OUT", null);
    emit("SIGNED_IN", "A");
    expect(task.signal.aborted).toBe(true);
    expect(() => task.assertCurrent()).toThrow("Account changed");
    expect(lifetime.start().isCurrent()).toBe(false);
  });
  it("rejects direct identity replacement before an old side effect", () => {
    const task = lifetime.start();
    emit("SIGNED_IN", "B");
    expect(task.isCurrent()).toBe(false);
    expect(lifetime.state.controllers.size).toBe(0);
  });
  it("invalidates work on unmount", () => {
    const task = lifetime.start();
    act(() => root.render(null));
    expect(task.signal.aborted).toBe(true);
  });
  it("creates an independent lifetime when the account prop changes", () => {
    const oldTask = lifetime.start();
    act(() => root.render(createElement(Probe, { owner: "B" })));
    expect(oldTask.isCurrent()).toBe(false);
    expect(lifetime.start().isCurrent()).toBe(true);
  });
  it("supports StrictMode effect cleanup and setup", () => {
    act(() => root.render(createElement(StrictMode, null, createElement(Probe))));
    expect(lifetime.start().isCurrent()).toBe(true);
    expect(auth.listeners.size).toBe(1);
  });
});
