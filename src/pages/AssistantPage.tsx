import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { canUseFeature, recordUsage, getRemainingUses, getLimit, isPremium } from "@/lib/usageLimits";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface ToolCall {
  name: string;
  arguments: any;
}

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  time: string;
  toolCalls?: ToolCall[];
}

function getLiveDashboardContext() {
  try {
    const raw = localStorage.getItem("dash_overview");
    if (raw) {
      const d = JSON.parse(raw);
      const balance = d.balance ?? 0;
      const savingsGoal = d.savingsGoal ?? 0;
      const savingsCurrent = d.savingsCurrent ?? 0;
      const budgets = (d.budgets ?? []).map((b: any) => ({
        name: b.name,
        spent: `$${b.spent?.toLocaleString()}`,
        total: `$${b.budget?.toLocaleString()}`,
        percent: b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0,
      }));
      const savingsPct = savingsGoal > 0 ? Math.round((savingsCurrent / savingsGoal) * 100) : 0;
      return { totalBalance: `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, savingsGoal: `$${savingsCurrent.toLocaleString()}`, savingsTarget: `$${savingsGoal.toLocaleString()}`, savingsPercent: savingsPct, netWorth: `$${(balance + savingsCurrent).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, budgets };
    }
  } catch {}
  return null;
}

const quickPrompts = [
  "Show my spending breakdown",
  "Update my food budget to $600",
  "Project my savings for 6 months",
  "Analyze my expenses",
];

interface AssistantPageProps {
  initialPrompt?: string | null;
  onPromptConsumed?: () => void;
}

const CACHE_KEY = "sono-chat-cache";
const MAX_CACHED = 50;

function loadCachedMessages(): Message[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveCachedMessages(msgs: Message[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(msgs.slice(-MAX_CACHED))); } catch {}
}

/* ── Tool execution ── */
function executeToolCall(call: ToolCall): string {
  const args = call.arguments;
  if (call.name === "update_budget") {
    try {
      const raw = localStorage.getItem("dash_overview");
      if (!raw) return "No dashboard data found.";
      const d = JSON.parse(raw);
      const budgets = d.budgets ?? [];
      const idx = budgets.findIndex((b: any) => b.name.toLowerCase() === args.category.toLowerCase());
      if (idx === -1) return `Category "${args.category}" not found.`;
      if (args.newBudget !== undefined) budgets[idx].budget = args.newBudget;
      if (args.newSpent !== undefined) budgets[idx].spent = args.newSpent;
      d.budgets = budgets;
      localStorage.setItem("dash_overview", JSON.stringify(d));
      return `Updated ${args.category}: budget=$${budgets[idx].budget}, spent=$${budgets[idx].spent}`;
    } catch { return "Failed to update budget."; }
  }
  // render_chart and project_expenses are handled client-side via toolCalls rendering
  return "OK";
}

const DEFAULT_COLORS = ["hsl(216,100%,60%)", "hsl(163,80%,45%)", "hsl(36,90%,55%)", "hsl(263,85%,60%)", "hsl(3,93%,55%)", "hsl(190,70%,50%)", "hsl(330,70%,55%)", "hsl(100,50%,50%)"];

/* ── Inline Chart Renderer ── */
const InlineChart = ({ call }: { call: ToolCall }) => {
  const { chartType, title, labels, values, colors } = call.arguments;
  const palette = colors?.length ? colors : DEFAULT_COLORS;
  const data = labels.map((label: string, i: number) => ({ name: label, value: values[i] }));

  return (
    <div className="my-3 rounded-xl bg-surface-high/40 border border-border p-4 space-y-2">
      <p className="text-xs font-bold text-foreground">{title}</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "pie" ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {data.map((_: any, i: number) => <Cell key={i} fill={palette[i % palette.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ background: "hsl(var(--surface-high))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          ) : chartType === "line" ? (
            <LineChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ background: "hsl(var(--surface-high))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="value" stroke={palette[0]} strokeWidth={2} dot={{ r: 3, fill: palette[0] }} />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ background: "hsl(var(--surface-high))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_: any, i: number) => <Cell key={i} fill={palette[i % palette.length]} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ── Projection Renderer ── */
const ProjectionView = ({ call }: { call: ToolCall }) => {
  const { months, monthlyIncome, monthlyExpenses, currentSavings, savingsGoal } = call.arguments;
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const data = [];
  for (let i = 0; i <= months; i++) {
    data.push({ name: i === 0 ? "Now" : `M${i}`, savings: Math.round(currentSavings + monthlySurplus * i) });
  }
  const finalSavings = data[data.length - 1].savings;
  const goalMet = savingsGoal && finalSavings >= savingsGoal;
  const monthsToGoal = savingsGoal && monthlySurplus > 0 ? Math.ceil((savingsGoal - currentSavings) / monthlySurplus) : null;

  return (
    <div className="my-3 rounded-xl bg-surface-high/40 border border-border p-4 space-y-3">
      <p className="text-xs font-bold text-foreground">
        {months}-Month Savings Projection
      </p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ background: "hsl(var(--surface-high))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
            <Line type="monotone" dataKey="savings" stroke="hsl(163,80%,45%)" strokeWidth={2} dot={{ r: 3 }} />
            {savingsGoal && (
              <Line type="monotone" dataKey={() => savingsGoal} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeWidth={1} dot={false} name="Goal" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 text-[10px]">
        <div className="rounded-lg bg-secondary/10 px-2.5 py-1.5">
          <span className="text-muted-foreground">Monthly surplus: </span>
          <span className={`font-bold ${monthlySurplus >= 0 ? "text-secondary" : "text-destructive"}`}>${monthlySurplus.toLocaleString()}</span>
        </div>
        <div className="rounded-lg bg-primary/10 px-2.5 py-1.5">
          <span className="text-muted-foreground">In {months}mo: </span>
          <span className="font-bold text-foreground">${finalSavings.toLocaleString()}</span>
        </div>
        {monthsToGoal !== null && (
          <div className="rounded-lg bg-amber/10 px-2.5 py-1.5">
            <span className="text-muted-foreground">Goal in: </span>
            <span className="font-bold text-amber">{goalMet ? "✓ Done" : `${monthsToGoal}mo`}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Budget Update Confirmation ── */
const BudgetUpdateView = ({ call }: { call: ToolCall }) => {
  const { category, newBudget, newSpent } = call.arguments;
  return (
    <div className="my-2 rounded-xl bg-secondary/10 border border-secondary/20 p-3 flex items-center gap-3">
      <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      <div className="text-xs">
        <span className="font-bold text-foreground">{category}</span>
        <span className="text-muted-foreground"> updated — </span>
        {newBudget !== undefined && <span className="text-foreground">budget: <span className="font-bold">${newBudget.toLocaleString()}</span></span>}
        {newBudget !== undefined && newSpent !== undefined && <span className="text-muted-foreground">, </span>}
        {newSpent !== undefined && <span className="text-foreground">spent: <span className="font-bold">${newSpent.toLocaleString()}</span></span>}
      </div>
    </div>
  );
};

const AssistantPage = ({ initialPrompt, onPromptConsumed }: AssistantPageProps) => {
  const [messages, setMessages] = useState<Message[]>(loadCachedMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasConsumedPrompt = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    saveCachedMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (initialPrompt && !hasConsumedPrompt.current) {
      hasConsumedPrompt.current = true;
      setTimeout(() => { sendMessage(initialPrompt); onPromptConsumed?.(); }, 300);
    }
    if (!initialPrompt) hasConsumedPrompt.current = false;
  }, [initialPrompt]);

  const streamChat = useCallback(async (allMessages: { role: string; content: string }[]) => {
    const dashboardContext = getLiveDashboardContext();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Please sign in to use the AI assistant");
    }
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ messages: allMessages, dashboardContext }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      if (resp.status === 429) toast.error("Rate limited — please wait a moment");
      if (resp.status === 402) toast.error("AI credits exhausted — add funds in workspace settings");
      throw new Error(err.error || `Error ${resp.status}`);
    }
    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";
    const assistantId = crypto.randomUUID();
    const collectedToolCalls: Record<number, { name: string; arguments: string }> = {};

    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);

    let streamDone = false;
    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const choice = parsed.choices?.[0];
          const delta = choice?.delta;
          if (delta?.content) {
            assistantContent += delta.content;
            const snapshot = assistantContent;
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: snapshot } : m));
          }
          // Collect tool calls
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!collectedToolCalls[idx]) collectedToolCalls[idx] = { name: "", arguments: "" };
              if (tc.function?.name) collectedToolCalls[idx].name = tc.function.name;
              if (tc.function?.arguments) collectedToolCalls[idx].arguments += tc.function.arguments;
            }
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Process collected tool calls
    const toolCalls: ToolCall[] = [];
    for (const tc of Object.values(collectedToolCalls)) {
      if (!tc.name) continue;
      try {
        const args = JSON.parse(tc.arguments);
        const call = { name: tc.name, arguments: args };
        toolCalls.push(call);
        // Execute side-effect tools
        if (tc.name === "update_budget") {
          const result = executeToolCall(call);
          toast.success(result);
        }
      } catch (e) {
        console.error("Failed to parse tool call:", e);
      }
    }

    if (toolCalls.length > 0) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, toolCalls } : m));
    }
  }, []);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;
    if (!canUseFeature("chat")) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `You've reached your daily limit of ${getLimit("chat")} messages. Upgrade to **Premium** for unlimited! 🚀`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      return;
    }
    recordUsage("chat");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: messageText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    const history = [...messages.map(m => ({ role: m.role, content: m.content })), { role: "user" as const, content: messageText }];
    try {
      await streamChat(history);
    } catch (e) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `Sorry, something went wrong: ${e instanceof Error ? e.message : "Unknown error"}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(CACHE_KEY);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between my-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold uppercase tracking-wider">Live</span>
          {messages.length > 0 && (
            <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-surface-high/50 transition-colors" title="Clear chat">
              <span className="material-symbols-outlined text-muted-foreground text-sm">delete_sweep</span>
            </button>
          )}
        </div>
      </div>

      {/* Capabilities row */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2">
        {[
          { icon: "edit_note", label: "Modify Budgets", color: "text-secondary" },
          { icon: "bar_chart", label: "Charts & Analytics", color: "text-primary" },
          { icon: "trending_up", label: "Projections", color: "text-amber" },
        ].map(cap => (
          <div key={cap.label} className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-high/50 border border-border">
            <span className={`material-symbols-outlined text-xs ${cap.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cap.icon}</span>
            <span className="text-[10px] font-medium text-muted-foreground">{cap.label}</span>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 pb-4 overflow-y-auto">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-56 text-center px-6">
            <span className="material-symbols-outlined text-4xl text-primary mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="text-lg font-semibold text-foreground mb-1">Your Finance AI</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
              I can analyze your spending, update your budgets, show charts, and project your savings. Try one of the suggestions below!
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${msg.role === "user" ? "bg-foreground/10 border border-foreground/15 rounded-tr-none text-foreground" : "glass-card rounded-tl-none text-foreground/90"}`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-invert prose-xs max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-primary [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs">
                    <ReactMarkdown>{msg.content || (msg.toolCalls?.length ? "" : "...")}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                {/* Render tool call results inline */}
                {msg.toolCalls?.map((tc, i) => (
                  <div key={i}>
                    {tc.name === "render_chart" && <InlineChart call={tc} />}
                    {tc.name === "project_expenses" && <ProjectionView call={tc} />}
                    {tc.name === "update_budget" && <BudgetUpdateView call={tc} />}
                  </div>
                ))}
              </div>
              <span className="text-[9px] text-muted-foreground font-medium px-1 uppercase tracking-widest">
                {msg.time} • {msg.role === "assistant" ? "AI" : "You"}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start">
            <div className="glass-card rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {quickPrompts.map(prompt => (
          <button key={prompt} onClick={() => sendMessage(prompt)} disabled={isLoading}
            className="shrink-0 px-3 py-1.5 text-[11px] font-medium rounded-full border border-border bg-surface-high/50 text-foreground/70 hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-40">
            {prompt}
          </button>
        ))}
      </div>

      {/* Usage */}
      {!isPremium() && (
        <div className="flex justify-center">
          <span className="text-[10px] text-muted-foreground font-medium">{getRemainingUses("chat")} / {getLimit("chat")} messages remaining today</span>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 mt-2 mb-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={canUseFeature("chat") ? "Ask me to update budgets, show charts, project savings..." : "Daily limit reached — upgrade for unlimited"}
          disabled={isLoading || !canUseFeature("chat")}
          className="flex-1 bg-surface-high border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-60" />
        <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading || !canUseFeature("chat")}
          className="p-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all active:scale-95">
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </div>
    </div>
  );
};

export default AssistantPage;
