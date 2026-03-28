import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getStoredAvatar, AvatarPreview } from "@/components/learn/AvatarCreator";
import { computeXp } from "@/components/learn/BadgeDisplay";
import { supabase } from "@/integrations/supabase/client";

function getDashboardData() {
  try {
    const raw = localStorage.getItem("dash_overview");
    if (raw) {
      const d = JSON.parse(raw);
      return {
        balance: d.balance ?? 0,
        savingsGoal: d.savingsGoal ?? 0,
        savingsCurrent: d.savingsCurrent ?? 0,
        budgets: (d.budgets ?? []) as { name: string; spent: number; budget: number; icon?: string; color?: string }[],
      };
    }
  } catch {}
  return null;
}

// Fake leaderboard users
const FAKE_USERS = [
  { name: "Alex M.", xp: 4200 },
  { name: "Sarah K.", xp: 3800 },
  { name: "Jordan T.", xp: 3100 },
  { name: "Maya R.", xp: 2900 },
  { name: "Chris L.", xp: 2400 },
];

function getCompletedLessons(): string[] {
  try {
    return JSON.parse(localStorage.getItem("sono-completed-lessons") || "[]");
  } catch { return []; }
}

/* ── Forecast helpers ── */
function buildForecastData(balance: number, savingsCurrent: number, totalSpent: number) {
  const netWorth = balance + savingsCurrent;
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const monthlyIncome = Math.round(totalSpent * 1.3); // estimated
  const monthlySavingsRate = monthlyIncome - totalSpent;

  // Project net worth forward
  const netWorthProjection = months.map((m, i) => {
    const growth = monthlySavingsRate * (i + 1);
    const noise = Math.sin((i + 1) * 1.8 + netWorth * 0.0001) * (netWorth * 0.02);
    return { month: m, value: Math.round(netWorth + growth + noise) };
  });

  // Project spending (slight trend based on current)
  const spendingProjection = months.map((m, i) => {
    const trend = totalSpent * (1 + (Math.sin(i * 1.2) * 0.05));
    return { month: m, value: Math.round(trend) };
  });

  return { netWorthProjection, spendingProjection, netWorth, monthlyIncome, totalSpent, monthlySavingsRate };
}

function buildSmoothPath(data: { value: number }[], width: number, height: number, pad = 8): string {
  if (data.length < 2) return "M0,0";
  const min = Math.min(...data.map(d => d.value)) * 0.95;
  const max = Math.max(...data.map(d => d.value)) * 1.05;
  const range = max - min || 1;
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (d.value - min) / range) * (height - pad * 2),
  }));
  let path = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    path += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return path;
}

/* ── Forecast Section Component ── */
const ForecastSection = ({ balance, savingsCurrent, totalSpent }: { balance: number; savingsCurrent: number; totalSpent: number }) => {
  const [aiRec, setAiRec] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const forecast = buildForecastData(balance, savingsCurrent, totalSpent);
  const netWorthTrend = forecast.netWorthProjection[forecast.netWorthProjection.length - 1].value > forecast.netWorth;
  const spendingTrend = forecast.spendingProjection[forecast.spendingProjection.length - 1].value > forecast.totalSpent;

  const chartW = 280;
  const chartH = 100;
  const nwPath = buildSmoothPath(forecast.netWorthProjection, chartW, chartH);
  const nwFill = `${nwPath} L${chartW - 8},${chartH} L8,${chartH} Z`;
  const spPath = buildSmoothPath(forecast.spendingProjection, chartW, chartH);

  useEffect(() => {
    if (totalSpent === 0) return;
    const cacheKey = "sono-forecast-ai";
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { text, ts, hash } = JSON.parse(cached);
        if (Date.now() - ts < 3600000 && hash === `${balance}-${savingsCurrent}-${totalSpent}`) {
          setAiRec(text);
          return;
        }
      }
    } catch {}

    let cancelled = false;
    (async () => {
      setAiLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const prompt = `You are a concise financial advisor. Based on this data, give exactly 2 short, specific recommendations (each 1 sentence). Net worth: $${forecast.netWorth.toLocaleString()}, monthly income ~$${forecast.monthlyIncome.toLocaleString()}, monthly spending: $${forecast.totalSpent.toLocaleString()}, monthly savings rate: $${forecast.monthlySavingsRate.toLocaleString()}, savings: $${savingsCurrent.toLocaleString()}. Net worth trend: ${netWorthTrend ? "growing" : "declining"}. Spending trend: ${spendingTrend ? "increasing" : "stable/decreasing"}. Format as two bullet points starting with emoji.`;

        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        });
        if (!resp.ok || !resp.body) return;
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const c = JSON.parse(json).choices?.[0]?.delta?.content;
              if (c) full += c;
            } catch {}
          }
        }
        if (!cancelled && full) {
          setAiRec(full);
          localStorage.setItem(cacheKey, JSON.stringify({ text: full, ts: Date.now(), hash: `${balance}-${savingsCurrent}-${totalSpent}` }));
        }
      } catch (e) { console.error("Forecast AI error:", e); }
      finally { if (!cancelled) setAiLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [balance, savingsCurrent, totalSpent]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
        <h3 className="text-sm font-bold text-foreground">6-Month Forecast</h3>
        <div className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${netWorthTrend ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive"}`}>
          <span className="material-symbols-outlined text-[12px]">{netWorthTrend ? "trending_up" : "trending_down"}</span>
          {netWorthTrend ? "Growing" : "Declining"}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Net Worth Projection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net Worth Projection</p>
            <p className="text-[10px] font-bold text-foreground">
              ${forecast.netWorth.toLocaleString()} → ${forecast.netWorthProjection[forecast.netWorthProjection.length - 1].value.toLocaleString()}
            </p>
          </div>
          <div className="w-full" style={{ height: `${chartH}px` }}>
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${chartW} ${chartH}`}>
              <defs>
                <linearGradient id="fcastNwGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(163 100% 76%)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="hsl(163 100% 76%)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.33, 0.66].map(p => (
                <line key={p} x1="0" x2={chartW} y1={chartH * p} y2={chartH * p} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
              ))}
              <motion.path d={nwFill} fill="url(#fcastNwGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
              <motion.path d={nwPath} fill="none" stroke="hsl(163 100% 76%)" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
            </svg>
          </div>
          <div className="flex justify-between">
            {forecast.netWorthProjection.map(d => (
              <span key={d.month} className="text-[9px] text-muted-foreground font-bold">{d.month}</span>
            ))}
          </div>
        </div>

        {/* Spending Projection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Spending Projection</p>
            <div className={`flex items-center gap-1 text-[10px] font-bold ${spendingTrend ? "text-destructive" : "text-secondary"}`}>
              <span className="material-symbols-outlined text-[12px]">{spendingTrend ? "trending_up" : "trending_down"}</span>
              {spendingTrend ? "Increasing" : "Stable"}
            </div>
          </div>
          <div className="w-full" style={{ height: `${chartH}px` }}>
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${chartW} ${chartH}`}>
              {[0.33, 0.66].map(p => (
                <line key={p} x1="0" x2={chartW} y1={chartH * p} y2={chartH * p} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
              ))}
              <motion.path d={spPath} fill="none" stroke="hsl(36 90% 55%)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
            </svg>
          </div>
          <div className="flex justify-between">
            {forecast.spendingProjection.map(d => (
              <span key={d.month} className="text-[9px] text-muted-foreground font-bold">{d.month}</span>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="rounded-xl p-3 bg-gradient-to-br from-[hsl(216,100%,20%)] to-[hsl(263,85%,25%)] border border-white/10 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-amber text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <p className="text-[10px] font-bold text-white uppercase tracking-wider">AI Recommendations</p>
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:300ms]" />
            </div>
          ) : aiRec ? (
            <p className="text-[11px] text-white/80 leading-relaxed whitespace-pre-line">{aiRec}</p>
          ) : (
            <p className="text-[11px] text-white/50">Add financial data to get personalized recommendations.</p>
          )}
        </div>
      </div>
    </motion.section>
  );
};

interface HubPageProps {
  onTabChange: (tab: string) => void;
}

const HubPage = ({ onTabChange }: HubPageProps) => {
  const [budgetExpanded, setBudgetExpanded] = useState(false);

  const completedLessons = getCompletedLessons();
  const userXp = computeXp(completedLessons.length);
  const avatar = getStoredAvatar();
  const userName = localStorage.getItem("sono-user-name") || "You";
  const dashData = getDashboardData();

  // Leaderboard
  const allUsers = [...FAKE_USERS, { name: userName, xp: userXp, isUser: true }]
    .sort((a, b) => b.xp - a.xp);

  // Budget data
  const balance = dashData?.balance ?? 0;
  const savingsCurrent = dashData?.savingsCurrent ?? 0;
  const savingsGoal = dashData?.savingsGoal ?? 0;
  const budgets = dashData?.budgets ?? [];
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const savingsProgress = savingsGoal > 0 ? Math.min((savingsCurrent / savingsGoal) * 100, 100) : 0;

  return (
    <div className="space-y-4">

      {/* ── Quick Actions Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-2"
      >
        <button
          data-tour="lessons"
          onClick={() => onTabChange("learn")}
          className="rounded-2xl p-3 text-center space-y-1.5 transition-all active:scale-[0.97] group bg-primary/[0.08] hover:bg-primary/15"
        >
          <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          <p className="text-[10px] font-bold text-primary">Lessons</p>
        </button>

        <button
          data-tour="dashboard"
          onClick={() => onTabChange("dashboard")}
          className="rounded-2xl p-3 text-center space-y-1.5 transition-all active:scale-[0.97] group bg-secondary/[0.08] hover:bg-secondary/15"
        >
          <span className="material-symbols-outlined text-xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
          <p className="text-[10px] font-bold text-secondary">Dashboard</p>
        </button>

        <button
          data-tour="library"
          onClick={() => onTabChange("library")}
          className="rounded-2xl p-3 text-center space-y-1.5 transition-all active:scale-[0.97] group bg-amber/[0.08] hover:bg-amber/15"
        >
          <span className="material-symbols-outlined text-xl text-amber" style={{ fontVariationSettings: "'FILL' 1" }}>local_library</span>
          <p className="text-[10px] font-bold text-amber">Library</p>
        </button>
      </motion.div>

      {/* ── AI Assistant Quick Access ── */}
      <motion.section
        data-tour="ai-chat"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
      >
        <button
          onClick={() => onTabChange("assistant")}
          className="w-full relative rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98] group overflow-hidden bg-primary/[0.06] hover:bg-primary/[0.12]"
        >
          <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[72px] text-primary/[0.05] rotate-12 pointer-events-none select-none" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div className="flex-1 text-left z-10">
            <p className="text-xs font-bold text-foreground">AI Assistant</p>
            <p className="text-[10px] text-foreground/60">Chat, adjust budgets, analyze spending & get projections</p>
          </div>
          <span className="material-symbols-outlined text-primary/40 text-sm group-hover:text-primary group-hover:translate-x-0.5 transition-all z-10">arrow_forward</span>
        </button>
      </motion.section>

      {/* ── Scenario Coach Quick Access ── */}
      <motion.section
        data-tour="scenario"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <button
          onClick={() => onTabChange("learn")}
          className="w-full relative rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98] group overflow-hidden bg-amber/[0.06] hover:bg-amber/[0.12]"
        >
          <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[72px] text-amber/[0.05] rotate-12 pointer-events-none select-none" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          <div className="w-11 h-11 rounded-xl bg-amber/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-amber text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div className="flex-1 text-left z-10">
            <p className="text-xs font-bold text-foreground">Scenario Coach</p>
            <p className="text-[10px] text-foreground/60">Test your money decisions with real-world scenarios</p>
          </div>
          <span className="material-symbols-outlined text-amber/40 text-sm group-hover:text-amber group-hover:translate-x-0.5 transition-all z-10">arrow_forward</span>
        </button>
      </motion.section>

      {/* ── Collapsible Budget Snapshot ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden relative bg-primary/[0.05]"
      >
        <span className="material-symbols-outlined absolute -right-3 -top-3 text-[80px] text-primary/[0.04] -rotate-12 pointer-events-none select-none" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
        <button
          onClick={() => setBudgetExpanded(!budgetExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-high/30 transition-colors relative z-10"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-foreground">Budget Snapshot</h3>
              <p className="text-[10px] text-muted-foreground">
                Balance: <span className="text-foreground font-semibold">${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>
          <span className={`material-symbols-outlined text-muted-foreground text-sm transition-transform ${budgetExpanded ? "rotate-180" : ""}`}>
            expand_more
          </span>
        </button>

        <AnimatePresence>
          {budgetExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-surface-high/50 p-3">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Balance</p>
                    <p className="text-base font-bold text-foreground mt-0.5">${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="rounded-xl bg-surface-high/50 p-3">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Net Worth</p>
                    <p className="text-base font-bold text-foreground mt-0.5">${(balance + savingsCurrent).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {savingsGoal > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-foreground">Savings Goal</p>
                      <p className="text-[10px] text-muted-foreground font-mono">${savingsCurrent.toLocaleString()} / ${savingsGoal.toLocaleString()}</p>
                    </div>
                    <div className="w-full bg-surface-highest h-2 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${savingsProgress}%` }} transition={{ duration: 0.6 }} className="h-full bg-secondary rounded-full" />
                    </div>
                    <p className="text-[9px] text-muted-foreground text-right">{savingsProgress.toFixed(0)}% complete</p>
                  </div>
                )}

                {budgets.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-foreground">Monthly Spending</p>
                      <p className="text-[10px] text-muted-foreground font-mono">${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}</p>
                    </div>
                    {budgets.slice(0, 4).map((b) => {
                      const pct = b.budget > 0 ? Math.min((b.spent / b.budget) * 100, 100) : 0;
                      const over = b.spent > b.budget;
                      return (
                        <div key={b.name} className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-foreground font-medium">{b.name}</span>
                            <span className={`text-[10px] font-mono font-bold ${over ? "text-destructive" : "text-muted-foreground"}`}>${b.spent} / ${b.budget}</span>
                          </div>
                          <div className="w-full bg-surface-highest h-1 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${over ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => onTabChange("assistant")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    AI Insight
                  </button>
                  <button
                    onClick={() => onTabChange("dashboard")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface-high/50 text-foreground text-[10px] font-bold hover:bg-surface-highest/50 transition-colors border border-border"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Full Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ── Condensed Leaderboard ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <h3 className="text-sm font-bold text-foreground">Leaderboard</h3>
          </div>
          <button onClick={() => onTabChange("learn")} className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline">View All</button>
        </div>
        {allUsers.slice(0, 5).map((user, i) => {
          const isUser = "isUser" in user;
          return (
            <div key={user.name} className={`flex items-center gap-3 px-4 py-2.5 border-b border-border/30 last:border-0 ${isUser ? "bg-primary/5" : ""}`}>
              <span className={`w-5 text-center font-bold text-xs ${i === 0 ? "text-amber" : "text-muted-foreground"}`}>{i === 0 ? "🏆" : i + 1}</span>
              {isUser ? (
                <AvatarPreview config={avatar} size={28} />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `hsl(${(i * 60) % 360} 50% 30%)`, color: `hsl(${(i * 60) % 360} 50% 80%)` }}>
                  {user.name.split(" ").map(w => w[0]).join("")}
                </div>
              )}
              <span className={`flex-1 text-xs font-semibold truncate ${isUser ? "text-primary" : "text-foreground"}`}>{isUser ? "You" : user.name}</span>
              <span className={`text-xs font-mono font-bold ${isUser ? "text-primary" : "text-muted-foreground"}`}>{user.xp.toLocaleString()} XP</span>
            </div>
          );
        })}
      </motion.section>

      {/* ── 6-Month Financial Forecast ── */}
      {totalSpent > 0 && (
        <ForecastSection balance={balance} savingsCurrent={savingsCurrent} totalSpent={totalSpent} />
      )}
    </div>
  );
};

export default HubPage;
