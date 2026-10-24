import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import { consumeUsage } from "../../supabase/functions/_shared/usage";

type RpcResult = { data: unknown; error: unknown };
type Handler = (req: Request) => Promise<Response>;

// Execute the real Edge entry point; remote modules and the billable provider are stubbed.
function loadHandler(name: "chat" | "scenario-coach", result: RpcResult | Error, authenticated = true) {
  let handler: Handler;
  const rpc = vi.fn(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  const client = { auth: { getClaims: async () => ({
    data: authenticated ? { claims: { sub: "account-a" } } : null, error: null,
  }) }, rpc };
  const fetch = vi.fn(async () => name === "chat"
    ? new Response("data: [DONE]\n\n", { headers: { "Content-Type": "text/event-stream" } })
    : Response.json({ choices: [{ message: { content: JSON.stringify([{ type: "question" }]) } }] }));
  const source = readFileSync(resolve("supabase", "functions", name, "index.ts"), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, {
    exports: {}, Request, Response, fetch, console: { error: vi.fn() },
    Deno: { env: { get: (key: string) => key === "LOVABLE_API_KEY" ? "disposable-provider-stub" : "https://stub.invalid" } },
    require: (specifier: string) => {
      if (specifier === "https://deno.land/std@0.168.0/http/server.ts") return { serve: (value: Handler) => { handler = value; } };
      if (specifier === "https://esm.sh/@supabase/supabase-js@2") return { createClient: () => client };
      if (specifier === "../_shared/usage.ts") return { consumeUsage };
      throw new Error(`Unstubbed module: ${specifier}`);
    },
  });
  const invoke = (body: unknown, authorization: string | null = "Bearer account-a") => handler(new Request("https://stub.invalid", {
    method: "POST", headers: { "Content-Type": "application/json", ...(authorization ? { Authorization: authorization } : {}) },
    body: JSON.stringify(body),
  }));
  return { invoke, rpc, fetch };
}

describe.each(["chat", "scenario-coach"] as const)("%s paid request admission", (name) => {
  const body = name === "chat" ? { messages: [{ role: "user", content: "Hello" }] } : { persona: "builder", mode: "batch" };
  const feature = name === "chat" ? "chat" : "scenarios";

  it("uses one caller-bound RPC and preserves a successful response", async () => {
    const h = loadHandler(name, { data: true, error: null });
    const response = await h.invoke({ ...body, _user_id: "victim", _limit: 999999, feature: "insights" });
    expect(response.status).toBe(200);
    expect(h.rpc.mock.calls).toEqual([["consume_daily_usage", { _feature: feature }]]);
    expect(h.fetch).toHaveBeenCalledTimes(1);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    if (name === "chat") expect(await response.text()).toContain("[DONE]");
    else expect(await response.json()).toEqual({ success: true, data: [{ type: "question" }] });
  });

  it("returns the existing quota response without provider work", async () => {
    const h = loadHandler(name, { data: false, error: null });
    expect((await h.invoke(body)).status).toBe(429);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it.each([
    { data: true, error: { message: "database unavailable" } },
    { data: null, error: null },
    { data: "true", error: null },
    new Error("transport unavailable"),
  ])("fails closed before provider work on an unavailable or malformed result", async (result) => {
    const h = loadHandler(name, result);
    expect((await h.invoke(body)).status).toBe(500);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it("rejects missing credentials before quota/provider work", async () => {
    const h = loadHandler(name, { data: true, error: null });
    expect((await h.invoke(body, null)).status).toBe(401);
    expect(h.rpc).not.toHaveBeenCalled();
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it("rejects invalid claims before quota/provider work", async () => {
    const h = loadHandler(name, { data: true, error: null }, false);
    expect((await h.invoke(body)).status).toBe(401);
    expect(h.rpc).not.toHaveBeenCalled();
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it("validates input before consuming allowance", async () => {
    const h = loadHandler(name, { data: true, error: null });
    expect((await h.invoke(name === "chat" ? { messages: [] } : { persona: "invalid", mode: "batch" })).status).toBe(400);
    expect(h.rpc).not.toHaveBeenCalled();
    expect(h.fetch).not.toHaveBeenCalled();
  });
});

it.each(["single", undefined])("preserves the existing unmetered scenario evaluation mode %s", async (mode) => {
  const h = loadHandler("scenario-coach", new Error("quota must not be called"));
  expect((await h.invoke({ persona: "builder", mode })).status).toBe(200);
  expect(h.rpc).not.toHaveBeenCalled();
  expect(h.fetch).toHaveBeenCalledTimes(1);
});
