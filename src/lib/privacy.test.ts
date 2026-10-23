import { beforeEach, describe, expect, it } from "vitest";
import { clearAccountData, prepareAccountData, publicShareUrl, safeExternalUrl } from "./privacy";

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
describe("account privacy", () => {
  it("clears all account caches on sign-out without deleting auth storage or theme", () => {
    for (const storage of [localStorage, sessionStorage]) {
      storage.setItem("sono-chat-cache", "private conversation");
      storage.setItem("sono-forecast-ai", "private forecast");
      storage.setItem("dash_overview", "private balance");
      storage.setItem("sono-theme", "light");
      storage.setItem("sb-auth-token", "session");
    }
    clearAccountData();
    for (const storage of [localStorage, sessionStorage]) {
      expect(storage.getItem("sono-chat-cache")).toBeNull();
      expect(storage.getItem("sono-forecast-ai")).toBeNull();
      expect(storage.getItem("dash_overview")).toBeNull();
      expect(storage.getItem("sono-theme")).toBe("light");
      expect(storage.getItem("sb-auth-token")).toBe("session");
    }
  });
  it("retains same-account tab data but clears it when another account signs in", () => {
    prepareAccountData("account-a");
    sessionStorage.setItem("dash_overview", "1234");
    prepareAccountData("account-a");
    expect(sessionStorage.getItem("dash_overview")).toBe("1234");
    prepareAccountData("account-b");
    expect(sessionStorage.getItem("dash_overview")).toBeNull();
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