import { beforeEach, describe, expect, it } from "vitest";
import { accountLocalStorage, accountSessionStorage, createAccountWork, clearAccountData, prepareAccountData, publicShareUrl, safeExternalUrl } from "./privacy";

beforeEach(() => { prepareAccountData(null); localStorage.clear(); sessionStorage.clear(); });
describe("account privacy", () => {
  it("clears owned caches without deleting legacy bytes, auth storage or theme", () => {
    prepareAccountData("account-a");
    for (const storage of [localStorage, sessionStorage]) {
      storage.setItem("sono-chat-cache", "private conversation");
      storage.setItem("sono-forecast-ai", "private forecast");
      storage.setItem("dash_overview", "private balance");
      storage.setItem("sono-theme", "light");
      storage.setItem("sb-auth-token", "session");
    }
    accountLocalStorage.setItem("sono-chat-cache", "owned private conversation");
    accountSessionStorage.setItem("dash_overview", "owned private balance");
    clearAccountData();
    expect(accountLocalStorage.getItem("sono-chat-cache")).toBeNull();
    expect(accountSessionStorage.getItem("dash_overview")).toBeNull();
    for (const storage of [localStorage, sessionStorage]) {
      expect(storage.getItem("sono-chat-cache")).toBe("private conversation");
      expect(storage.getItem("sono-forecast-ai")).toBe("private forecast");
      expect(storage.getItem("dash_overview")).toBe("private balance");
      expect(storage.getItem("sono-theme")).toBe("light");
      expect(storage.getItem("sb-auth-token")).toBe("session");
    }
  });
  it("retains same-account tab data but clears it when another account signs in", () => {
    prepareAccountData("account-a");
    accountSessionStorage.setItem("dash_overview", "1234");
    prepareAccountData("account-a");
    expect(accountSessionStorage.getItem("dash_overview")).toBe("1234");
    prepareAccountData("account-b");
    expect(accountSessionStorage.getItem("dash_overview")).toBeNull();
  });
  it("never adopts unowned data into a signed-in account", () => {
    localStorage.setItem("sono-scenario-cache", "legacy A answers");
    sessionStorage.setItem("dash_overview", "legacy A budget");
    prepareAccountData("account-b");
    expect(accountLocalStorage.getItem("sono-scenario-cache")).toBeNull();
    expect(accountSessionStorage.getItem("dash_overview")).toBeNull();
    expect(localStorage.getItem("sono-scenario-cache")).toBe("legacy A answers");
    prepareAccountData(null);
    accountLocalStorage.setItem("sono-persona", "ignored");
    expect(accountLocalStorage.getItem("sono-persona")).toBeNull();
  });
  it("invalidates delayed work even across A to B to A", () => {
    prepareAccountData("account-a");
    const old = createAccountWork();
    prepareAccountData("account-b");
    prepareAccountData("account-a");
    expect(old.signal.aborted).toBe(true);
    expect(old.isCurrent()).toBe(false);
    expect(() => old.assertCurrent()).toThrow("Account changed");
    expect(createAccountWork().isCurrent()).toBe(true);
  });
  it("preserves active requests on same-account refresh and aborts explicit cleanup", () => {
    prepareAccountData("account-a");
    const work = createAccountWork();
    prepareAccountData("account-a");
    expect(work.isCurrent()).toBe(true);
    clearAccountData();
    expect(work.isCurrent()).toBe(false);
    expect(work.signal.aborted).toBe(true);
  });
  it("does not share user identity or query parameters", () => {
    expect(publicShareUrl("https://finance.example")).toBe("https://finance.example/");
  });
  it("rejects executable and credential-bearing external links", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("https://user:pass@example.com")).toBeNull();
    expect(safeExternalUrl("https://example.com/advisor")).toBe("https://example.com/advisor");
  });
});
