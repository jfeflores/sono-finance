import { useState, useCallback, useEffect } from "react";
import { isPremium, getUsageCount, getLimit, recordUsage } from "@/lib/usageLimits";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DashTab = "overview" | "expenses" | "spending" | "resources";

const TABS: { id: DashTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "expenses", label: "Expenses" },
  { id: "spending", label: "Spending" },
  { id: "resources", label: "Resources" },
];

interface DashboardPageProps {
  onAiDiscuss?: (prompt: string) => void;
}

const DashboardPage = ({ onAiDiscuss }: DashboardPageProps) => {
  const [activeTab, setActiveTab] = useState<DashTab>("overview");

  return (
    <div className="space-y-6">
      {/* Segmented Control */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-surface-high/60 rounded-xl border border-border backdrop-blur-md">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === t.id
                  ? "bg-surface-highest text-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && <OverviewTab onAiDiscuss={onAiDiscuss} />}
          {activeTab === "expenses" && <ExpensesTab />}
          {activeTab === "spending" && <SpendingTab />}
          {activeTab === "resources" && <ResourcesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ── Monthly Cash-Flow Calendar ── */
interface CashFlowEvent {
  day: number;
  icon: string;
  label: string;
  amount: number; // positive = inflow, negative = outflow
}

// Build cash-flow events dynamically from budget data
function buildCashFlowEvents(): CashFlowEvent[] {
  const saved = loadOverviewState();
  const budgets: BudgetEntry[] = saved?.budgets ?? getDefaultBudgets();
  const balance = saved?.balance ?? 0;
  
  // Map expense categories to outflow events on realistic dates
  const expenseDays: Record<string, number> = {
    "Housing": 1, "Food & Dining": 8, "Transportation": 22,
    "Utilities": 10, "Entertainment": 15, "Health & Fitness": 5,
    "Subscriptions": 3, "Personal Care": 12,
  };
  
  const events: CashFlowEvent[] = [];
  const icons: Record<string, string> = {
    "Housing": "🏠", "Food & Dining": "🍽️", "Transportation": "🚗",
    "Utilities": "⚡", "Entertainment": "🎬", "Health & Fitness": "🏋️",
    "Subscriptions": "📺", "Personal Care": "💆",
  };
  
  // Add inflows (estimated from total budget coverage)
  const totalExpenses = budgets.reduce((s, b) => s + b.spent, 0);
  if (totalExpenses > 0 || balance > 0) {
    const paycheck = Math.round((totalExpenses * 1.3) / 2); // Rough paycheck estimate
    events.push({ day: 1, icon: "💰", label: "Paycheck", amount: paycheck });
    events.push({ day: 15, icon: "💰", label: "Paycheck", amount: paycheck });
  }
  
  // Add outflows from actual budget categories
  budgets.forEach(b => {
    if (b.spent > 0) {
      events.push({
        day: expenseDays[b.name] || 15,
        icon: icons[b.name] || "💳",
        label: b.name,
        amount: -b.spent,
      });
    }
  });
  
  return events;
}

const MonthlyCalendar = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Build full month grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const cashFlowEvents = buildCashFlowEvents();
  const getEventsForDay = (day: number) => cashFlowEvents.filter(e => e.day === day);
  const getDayNet = (day: number) => getEventsForDay(day).reduce((s, e) => s + e.amount, 0);

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  // Monthly totals
  const monthIn = cashFlowEvents.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const monthOut = cashFlowEvents.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);

  const fmtAmt = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1000) return `${(abs / 1000).toFixed(1)}k`;
    return abs.toString();
  };

  return (
    <div className="space-y-4">
      {/* Header with month totals */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground">{monthName}</h4>
        <div className="flex gap-3">
          <span className="text-[10px] font-bold text-secondary">▲ ${monthIn.toLocaleString()}</span>
          <span className="text-[10px] font-bold text-destructive">▼ ${monthOut.toLocaleString()}</span>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-[2px]">
        {dayNames.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-muted-foreground tracking-wider py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-[2px]">
          {week.map((day, di) => {
            if (!day) return <div key={di} className="min-h-[44px]" />;
            const events = getEventsForDay(day);
            const net = getDayNet(day);
            const hasInflow = events.some(e => e.amount > 0);
            const hasOutflow = events.some(e => e.amount < 0);
            const isToday = day === today;
            const isSelected = day === selectedDay;
            const isPast = day < today;

            return (
              <button
                key={di}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative flex flex-col items-center justify-start py-1.5 rounded-lg min-h-[44px] transition-all ${
                  isSelected
                    ? "bg-primary/20 border border-primary/40 ring-1 ring-primary/20"
                    : isToday
                    ? "bg-surface-highest border border-primary/30"
                    : events.length > 0
                    ? "bg-surface-high/40 border border-border hover:border-border/80"
                    : "hover:bg-surface-high/20"
                } ${isPast && !isToday ? "opacity-50" : ""}`}
              >
                <span className={`text-[10px] font-semibold leading-none ${
                  isToday ? "text-primary" : isSelected ? "text-primary" : "text-foreground"
                }`}>
                  {day}
                </span>
                {events.length > 0 && (
                  <div className="flex gap-[2px] mt-1">
                    {hasInflow && <div className="w-[5px] h-[5px] rounded-full bg-secondary" />}
                    {hasOutflow && <div className="w-[5px] h-[5px] rounded-full bg-destructive" />}
                  </div>
                )}
                {events.length > 0 && (
                  <span className={`text-[7px] font-bold mt-auto leading-none ${
                    net > 0 ? "text-secondary" : "text-destructive"
                  }`}>
                    {net > 0 ? "+" : "-"}${fmtAmt(net)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-[9px] text-muted-foreground font-medium">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <span className="text-[9px] text-muted-foreground font-medium">Expense</span>
        </div>
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay !== null && selectedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-surface-high/60 border border-border p-3 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {monthName.split(" ")[0]} {selectedDay}
              </p>
              {selectedEvents.map((ev, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{ev.icon}</span>
                    <span className="text-xs font-medium text-foreground">{ev.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${ev.amount > 0 ? "text-secondary" : "text-destructive"}`}>
                    {ev.amount > 0 ? "+" : "-"}${Math.abs(ev.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Net Worth Section (extracted component) ─── */
const NET_WORTH_RANGES = ["1W", "1M", "3M", "YTD", "ALL"] as const;

function generateSparkline(netWorth: number, range: string): string {
  // Generate points that end at the current net worth, with variation based on range
  const points = range === "1W" ? 7 : range === "1M" ? 30 : range === "3M" ? 12 : range === "YTD" ? 12 : 24;
  const volatility = range === "1W" ? 0.02 : range === "1M" ? 0.05 : range === "3M" ? 0.08 : range === "YTD" ? 0.1 : 0.2;
  const vals: number[] = [];
  let base = netWorth * (1 - volatility);
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const trend = base + (netWorth - base) * progress;
    const noise = trend * (Math.sin(i * 2.7 + netWorth * 0.001) * 0.015);
    vals.push(trend + noise);
  }
  vals[vals.length - 1] = netWorth;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range2 = max - min || 1;
  const pathParts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * 200;
    const y = 55 - ((v - min) / range2) * 50;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  });
  return pathParts.join(" ");
}

const NetWorthSection = ({ balance, savingsCurrent, onAiDiscuss }: { balance: number; savingsCurrent: number; onAiDiscuss?: (prompt: string) => void }) => {
  const [nwRange, setNwRange] = useState("3M");
  const netWorth = balance + savingsCurrent;
  const growthPct = netWorth > 0 ? ((netWorth / (netWorth * 0.945)) * 100 - 100).toFixed(1) : "0.0";
  const sparklinePath = generateSparkline(netWorth, nwRange);
  const fillPath = `${sparklinePath} L200,60 L0,60 Z`;

  const handleStarClick = (topic: string, context: string) => {
    if (onAiDiscuss) {
      onAiDiscuss(`Analyze my ${topic} in detail. Here's my current data: ${context}. Give me specific, actionable advice.`);
    }
  };

  const AiStar = () => (
    <button
      onClick={(e) => { e.stopPropagation(); handleStarClick("Net Worth", `My net worth is $${netWorth.toLocaleString()} (balance $${balance.toLocaleString()} + savings $${savingsCurrent.toLocaleString()}). Growth trend is +${growthPct}%.`); }}
      className="p-1 rounded-lg hover:bg-primary/10 transition-colors group/star"
      title="Discuss with AI"
    >
      <span className="material-symbols-outlined text-amber text-sm group-hover/star:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold tracking-tight text-foreground">Net Worth</h3>
        <AiStar />
      </div>
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.15em] font-mono">Net Worth</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tracking-tight">
                ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-secondary text-xs font-bold">+{growthPct}%</span>
            </div>
          </div>
        </div>
        <div className="h-20 w-full relative">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 60">
            <defs>
              <linearGradient id="nwGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(216 100% 71%)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="hsl(216 100% 71%)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={fillPath} fill="url(#nwGrad)" />
            <path d={sparklinePath} fill="none" stroke="hsl(216 100% 71%)" strokeWidth="2" />
          </svg>
        </div>
        <div className="flex justify-center gap-4">
          {NET_WORTH_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setNwRange(range)}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${
                nwRange === range ? "bg-surface-highest text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};



interface BudgetEntry { icon: string; name: string; spent: number; budget: number; color: string; }
interface TransactionEntry { icon: string; name: string; date: string; amount: string; positive?: boolean; }

function getIsTestUser() {
  const name = (localStorage.getItem("sono-user-name") || "").trim().toLowerCase();
  const email = (localStorage.getItem("sono-user-email") || "").trim().toLowerCase();
  return name === "test" || email === "test" || email === "demo@sonofinance.app";
}
function getBankConnected() {
  return localStorage.getItem("sono-bank-connected") === "true";
}
function getHasData() {
  return getBankConnected() || getIsTestUser();
}

// ── Realistic data for a 25-year-old young professional ──
// Salary ~$55k/yr → ~$3,520 net biweekly after taxes
// Shares a 1BR apartment, drives a used car, active social life

const EXPENSE_CATEGORIES = [
  { name: "Housing", icon: "home", amount: 1350, budget: 1400, color: "primary" },
  { name: "Food & Dining", icon: "restaurant", amount: 520, budget: 550, color: "secondary" },
  { name: "Transportation", icon: "directions_car", amount: 285, budget: 300, color: "amber" },
  { name: "Utilities", icon: "bolt", amount: 142, budget: 160, color: "primary" },
  { name: "Entertainment", icon: "movie", amount: 165, budget: 150, color: "purple" },
  { name: "Health & Fitness", icon: "fitness_center", amount: 68, budget: 80, color: "secondary" },
  { name: "Subscriptions", icon: "subscriptions", amount: 54, budget: 60, color: "amber" },
  { name: "Personal Care", icon: "spa", amount: 38, budget: 50, color: "primary" },
];

function expenseToBudget(cat: typeof EXPENSE_CATEGORIES[number]): BudgetEntry {
  return { icon: cat.icon, name: cat.name, spent: cat.amount, budget: cat.budget, color: cat.color };
}

function getDefaultBudgets(): BudgetEntry[] {
  if (getIsTestUser()) return EXPENSE_CATEGORIES.map(expenseToBudget);
  if (getBankConnected()) return EXPENSE_CATEGORIES.map(c => expenseToBudget({ ...c, amount: Math.round(c.amount * 0.7) }));
  return EXPENSE_CATEGORIES.map(c => expenseToBudget({ ...c, amount: 0, budget: 0 }));
}

const TEST_TRANSACTIONS: TransactionEntry[] = [
  { icon: "coffee", name: "Starbucks", date: "Today, 7:32 AM", amount: "-$5.95" },
  { icon: "fastfood", name: "Sweetgreen", date: "Today, 12:15 PM", amount: "-$16.80" },
  { icon: "account_balance", name: "Paycheck – Acme Corp", date: "Mar 28", amount: "+$3,520.00", positive: true },
  { icon: "home", name: "Rent – Elm St Apt", date: "Mar 27", amount: "-$1,350.00" },
  { icon: "wifi", name: "Xfinity Internet", date: "Mar 26", amount: "-$49.99" },
  { icon: "fitness_center", name: "LA Fitness", date: "Mar 25", amount: "-$34.99" },
  { icon: "local_gas_station", name: "Shell Gas Station", date: "Mar 24", amount: "-$42.15" },
  { icon: "shopping_cart", name: "Trader Joe's", date: "Mar 23", amount: "-$78.62" },
  { icon: "movie", name: "Netflix + Spotify", date: "Mar 22", amount: "-$26.98" },
  { icon: "restaurant", name: "Happy Hour – Draft House", date: "Mar 21", amount: "-$34.50" },
  { icon: "shopping_bag", name: "Amazon – USB-C Hub", date: "Mar 20", amount: "-$29.99" },
  { icon: "medical_services", name: "CVS Pharmacy", date: "Mar 19", amount: "-$12.40" },
  { icon: "directions_car", name: "Car Insurance – Geico", date: "Mar 18", amount: "-$148.00" },
  { icon: "school", name: "Coursera Subscription", date: "Mar 17", amount: "-$49.00" },
  { icon: "savings", name: "Transfer to Savings", date: "Mar 15", amount: "-$400.00" },
  { icon: "account_balance", name: "Paycheck – Acme Corp", date: "Mar 14", amount: "+$3,520.00", positive: true },
];

const BANK_TRANSACTIONS: TransactionEntry[] = [
  { icon: "coffee", name: "Morning Coffee", date: "Today, 8:31 AM", amount: "-$5.40" },
  { icon: "fitness_center", name: "Gym Membership", date: "Yesterday", amount: "-$49.99" },
  { icon: "account_balance", name: "Salary Deposit", date: "Mar 25", amount: "+$3,200.00", positive: true },
  { icon: "bolt", name: "Electric Bill", date: "Mar 24", amount: "-$127.50" },
  { icon: "local_gas_station", name: "Gas Station", date: "Mar 23", amount: "-$42.00" },
  { icon: "shopping_cart", name: "Grocery Store", date: "Mar 22", amount: "-$87.30" },
  { icon: "movie", name: "Streaming Service", date: "Mar 21", amount: "-$15.99" },
  { icon: "medical_services", name: "Pharmacy", date: "Mar 20", amount: "-$22.45" },
];

function getAllTransactions() {
  return getIsTestUser() ? TEST_TRANSACTIONS : getBankConnected() ? BANK_TRANSACTIONS : [];
}

// Balance: ~$4,800 checking (young professional, post-rent)
// Savings: $2,400 of $10,000 emergency fund goal (just started saving seriously)
const TEST_BALANCE = 4832;
const TEST_SAVINGS_GOAL = 10000;
const TEST_SAVINGS_CURRENT = 2400;

function loadOverviewState() {
  try {
    const raw = localStorage.getItem("dash_overview");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveOverviewState(state: { balance: number; savingsGoal: number; savingsCurrent: number; budgets: BudgetEntry[] }) {
  localStorage.setItem("dash_overview", JSON.stringify(state));
}

const OverviewTab = ({ onAiDiscuss }: { onAiDiscuss?: (prompt: string) => void }) => {
  const isTest = getIsTestUser();
  const bankConn = getBankConnected();
  const saved = loadOverviewState();
  const [balance, setBalance] = useState<number>(saved?.balance ?? (isTest ? TEST_BALANCE : bankConn ? 24592 : 0));
  const [savingsGoal, setSavingsGoal] = useState<number>(saved?.savingsGoal ?? (isTest ? TEST_SAVINGS_GOAL : bankConn ? 10000 : 0));
  const [savingsCurrent, setSavingsCurrent] = useState<number>(saved?.savingsCurrent ?? (isTest ? TEST_SAVINGS_CURRENT : bankConn ? 8400 : 0));
  const [budgets, setBudgets] = useState<BudgetEntry[]>(saved?.budgets ?? getDefaultBudgets());
  const [showAllTx, setShowAllTx] = useState(false);

  // Dialogs
  const [editingBalance, setEditingBalance] = useState(false);
  const [editingSavings, setEditingSavings] = useState(false);
  const [editingBudgets, setEditingBudgets] = useState(false);

  // Temp form values
  const [tmpBalance, setTmpBalance] = useState("");
  const [tmpSavGoal, setTmpSavGoal] = useState("");
  const [tmpSavCurrent, setTmpSavCurrent] = useState("");
  const [tmpBudgets, setTmpBudgets] = useState<BudgetEntry[]>([]);

  useEffect(() => {
    saveOverviewState({ balance, savingsGoal, savingsCurrent, budgets });
    // Track balance history for growth metric
    const history = JSON.parse(localStorage.getItem("sono-balance-history") || "[]") as { balance: number; ts: number }[];
    const lastEntry = history[history.length - 1];
    // Only record if balance changed or no entries yet
    if (!lastEntry || lastEntry.balance !== balance) {
      history.push({ balance, ts: Date.now() });
      // Keep last 90 days max
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const trimmed = history.filter((h: { ts: number }) => h.ts > cutoff);
      localStorage.setItem("sono-balance-history", JSON.stringify(trimmed));
    }
  }, [balance, savingsGoal, savingsCurrent, budgets]);

  // Weekly digest
  const [weeklyDigest, setWeeklyDigest] = useState<string | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);

  const fetchDigest = useCallback(async () => {
    setDigestLoading(true);
    try {
      const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
      const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
      const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-digest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          financialData: {
            balance,
            savingsCurrent,
            savingsGoal,
            savingsPct: savingsGoal > 0 ? Math.round((savingsCurrent / savingsGoal) * 100) : 0,
            netWorth: balance + savingsCurrent,
            budgets: budgets.map(b => ({ name: b.name, spent: b.spent, budget: b.budget, pct: b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0 })),
            totalSpent,
            totalBudget,
            daysLeft,
          },
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setWeeklyDigest(data.digest);
        // Cache with timestamp
        localStorage.setItem("sono-weekly-digest", JSON.stringify({ digest: data.digest, ts: Date.now(), dataHash: `${balance}-${savingsCurrent}-${savingsGoal}` }));
      }
    } catch (e) {
      console.error("Digest fetch error:", e);
    } finally {
      setDigestLoading(false);
    }
  }, [balance, savingsCurrent, savingsGoal, budgets]);

  // Load cached digest or fetch new one
  useEffect(() => {
    try {
      const cached = localStorage.getItem("sono-weekly-digest");
      if (cached) {
        const { digest, ts, dataHash } = JSON.parse(cached);
        const age = Date.now() - ts;
        const currentHash = `${balance}-${savingsCurrent}-${savingsGoal}`;
        // Refresh if older than 1 hour or data changed
        if (age < 3600000 && dataHash === currentHash) {
          setWeeklyDigest(digest);
          return;
        }
      }
    } catch {}
    if (getHasData()) fetchDigest();
  }, []);

  const handleStarClick = (topic: string, context: string) => {
    if (onAiDiscuss) {
      onAiDiscuss(`Analyze my ${topic} in detail. Here's my current data: ${context}. Give me specific, actionable advice.`);
    }
  };

  const savingsProgress = savingsGoal > 0 ? Math.min(Math.round((savingsCurrent / savingsGoal) * 100), 100) : 0;
  const allTx = getAllTransactions();
  const displayTx = showAllTx ? allTx : allTx.slice(0, 4);
  const netWorth = balance + savingsCurrent;
  const totalBudgetSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalBudgetLimit = budgets.reduce((s, b) => s + b.budget, 0);
  const budgetUsedPct = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;
  const daysLeftInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();

  const AiStarButton = ({ topic, context }: { topic: string; context: string }) => (
    <button
      onClick={(e) => { e.stopPropagation(); handleStarClick(topic, context); }}
      className="p-1 rounded-lg hover:bg-primary/10 transition-colors group/star"
      title="Discuss with AI"
    >
      <span className="material-symbols-outlined text-amber text-sm group-hover/star:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
        star
      </span>
    </button>
  );

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tighter text-foreground">Dashboard</h2>
        <p className="text-muted-foreground font-medium text-sm">Your financial health at a glance</p>
      </motion.section>

      {/* ── Net Worth (FIRST) ── */}
      <NetWorthSection balance={balance} savingsCurrent={savingsCurrent} onAiDiscuss={onAiDiscuss} />

      {/* ── Weekly AI Digest ── */}
      {getHasData() && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 space-y-3 bg-gradient-to-br from-[hsl(216,100%,20%)] to-[hsl(263,85%,25%)] border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="text-sm font-bold text-white tracking-tight">Weekly Digest</h3>
            <button
              onClick={fetchDigest}
              disabled={digestLoading}
              className="ml-auto text-white/50 hover:text-white/80 transition-colors"
            >
              <span className={`material-symbols-outlined text-sm ${digestLoading ? "animate-spin" : ""}`}>refresh</span>
            </button>
          </div>
          {digestLoading && !weeklyDigest ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:0ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:300ms]" />
              <span className="text-xs text-white/40 ml-1">Generating your digest...</span>
            </div>
          ) : weeklyDigest ? (
            <p className="text-xs text-white/80 leading-relaxed">{weeklyDigest}</p>
          ) : (
            <p className="text-xs text-white/50">Connect your data or tap refresh to generate your personalized weekly summary.</p>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Balance card */}
        <button
          onClick={() => { setTmpBalance(balance.toString()); setEditingBalance(true); }}
          className="text-left p-5 glass-card rounded-2xl flex flex-col justify-between h-40 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.15em] font-mono">Total Balance</p>
            <div className="flex items-center gap-1">
              <AiStarButton topic="Total Balance" context={`My current balance is $${balance.toLocaleString()}. Monthly change is +2.4%.`} />
              <span className="material-symbols-outlined text-muted-foreground text-sm opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
            </div>
          </div>
          <div className="absolute right-0 top-4 w-1/2 h-24 opacity-40 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="chartGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(216 100% 71%)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(216 100% 71%)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,40 L0,35 Q10,32 20,34 T40,28 T60,20 T80,15 T100,5 L100,40 Z" fill="url(#chartGrad)" />
              <path d="M0,35 Q10,32 20,34 T40,28 T60,20 T80,15 T100,5" fill="none" stroke="hsl(216 100% 71%)" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <span className="text-3xl font-bold text-foreground tracking-tight">${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            {(() => {
              const history = JSON.parse(localStorage.getItem("sono-balance-history") || "[]") as { balance: number; ts: number }[];
              const now = Date.now();
              const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
              const prevEntry = history.filter(h => h.ts < monthAgo).pop() || history[0];
              const prevBalance = prevEntry?.balance ?? balance;
              const change = prevBalance > 0 ? ((balance - prevBalance) / prevBalance * 100) : 0;
              const sign = change >= 0 ? "+" : "";
              return (
                <div className={`flex items-center gap-1 mt-1 ${change >= 0 ? "text-secondary" : "text-destructive"}`}>
                  <span className="material-symbols-outlined text-[10px]">{change >= 0 ? "trending_up" : "trending_down"}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{sign}{change.toFixed(1)}% this month</span>
                </div>
              );
            })()}
          </div>
        </button>

        {/* Savings card */}
        <button
          onClick={() => { setTmpSavGoal(savingsGoal.toString()); setTmpSavCurrent(savingsCurrent.toString()); setEditingSavings(true); }}
          className="text-left p-5 glass-card rounded-2xl flex flex-col justify-between h-40 group"
        >
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.15em] font-mono">Savings Goal</p>
            <div className="flex items-center gap-1">
              <AiStarButton topic="Savings Goal" context={`I've saved $${savingsCurrent.toLocaleString()} of my $${savingsGoal.toLocaleString()} goal (${savingsProgress}% complete).`} />
              <span className="material-symbols-outlined text-muted-foreground text-sm opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-3">
              <span className="text-3xl font-bold text-foreground tracking-tight">${savingsCurrent.toLocaleString()}</span>
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">of ${savingsGoal.toLocaleString()}</span>
            </div>
            <div className="w-full bg-surface-highest h-2 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${savingsProgress}%` }} transition={{ duration: 1, delay: 0.5 }} className="bg-primary h-full rounded-full progress-glow" />
            </div>
          </div>
        </button>
      </div>

      {/* Budget Summary */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-foreground">Budget Summary</h3>
            <AiStarButton topic="Budget" context={`My budget categories: ${budgets.map(b => `${b.name}: $${b.spent}/$${b.budget}`).join(", ")}. Total: $${totalBudgetSpent}/$${totalBudgetLimit} (${budgetUsedPct}%). ${daysLeftInMonth} days left in the month.`} />
          </div>
          <button
            onClick={() => { setTmpBudgets(budgets.map(b => ({ ...b }))); setEditingBudgets(true); }}
            className="text-primary text-[10px] font-extrabold uppercase tracking-widest hover:underline"
          >
            Edit Budgets
          </button>
        </div>
        <div className="glass-card rounded-2xl divide-y divide-border overflow-hidden">
          {budgets.map(b => {
            const pct = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0;
            const remaining = b.budget - b.spent;
            const isOver = remaining < 0;
            return (
              <BudgetItem
                key={b.name}
                icon={b.icon}
                name={b.name}
                spent={`$${b.spent.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                remaining={isOver ? `Over by $${Math.abs(remaining).toLocaleString()}` : `$${remaining.toLocaleString()} of $${b.budget.toLocaleString()} left`}
                progress={Math.min(pct, 100)}
                color={isOver ? "destructive" : b.color}
              />
            );
          })}
          <div className="flex items-center justify-between p-4 bg-surface-high/30">
            <span className="text-xs font-bold text-foreground">Total</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">${totalBudgetSpent.toLocaleString()} / ${totalBudgetLimit.toLocaleString()}</span>
              <span className={`text-xs font-bold ${totalBudgetSpent > totalBudgetLimit ? "text-destructive" : "text-secondary"}`}>
                {budgetUsedPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Budget AI Insights ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
          <h4 className="text-sm font-bold tracking-tight text-foreground">Budget Insights</h4>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
          {(() => {
            const overBudgetCats = budgets.filter(b => b.spent / b.budget > 0.8);
            const insights = [
              {
                icon: "✨",
                title: savingsProgress >= 80
                  ? `You're ${savingsProgress}% to your savings goal!`
                  : `Savings at ${savingsProgress}% — keep pushing`,
                body: savingsProgress >= 80
                  ? `Only $${(savingsGoal - savingsCurrent).toLocaleString()} to go. Consider automating a small weekly transfer to finish strong.`
                  : `You've saved $${savingsCurrent.toLocaleString()} of $${savingsGoal.toLocaleString()}. Try setting aside $${Math.ceil((savingsGoal - savingsCurrent) / Math.max(daysLeftInMonth, 1))}/day to catch up.`,
                gradient: "from-[hsl(216,100%,30%)] to-[hsl(263,85%,35%)]",
              },
              {
                icon: "📊",
                title: budgetUsedPct < 70 ? "Budget looking healthy" : budgetUsedPct < 90 ? "Budget usage is getting tight" : "Budget nearly maxed out",
                body: overBudgetCats.length > 0
                  ? `Watch out: ${overBudgetCats.map(c => c.name).join(", ")} ${overBudgetCats.length === 1 ? "is" : "are"} over 80% spent with ${daysLeftInMonth} days left.`
                  : `You've used ${budgetUsedPct}% of your total budget with ${daysLeftInMonth} days remaining. You're on track.`,
                gradient: "from-[hsl(163,80%,25%)] to-[hsl(216,100%,30%)]",
              },
              {
                icon: "🎯",
                title: "Smart money move",
                body: (() => {
                  const lowestUsed = [...budgets].sort((a, b) => (a.spent / a.budget) - (b.spent / b.budget))[0];
                  const highestUsed = [...budgets].sort((a, b) => (b.spent / b.budget) - (a.spent / a.budget))[0];
                  if (lowestUsed && highestUsed && lowestUsed.name !== highestUsed.name) {
                    const surplus = highestUsed.budget - highestUsed.spent;
                    return surplus < 50
                      ? `${highestUsed.name} is almost tapped out. Move $${Math.round((lowestUsed.budget - lowestUsed.spent) * 0.3)} from ${lowestUsed.name} to give yourself room.`
                      : `${lowestUsed.name} has plenty of room — only ${Math.round((lowestUsed.spent / lowestUsed.budget) * 100)}% used. Redirect some toward savings.`;
                  }
                  return "Review your spending patterns and look for subscriptions you might not be using.";
                })(),
                gradient: "from-[hsl(263,85%,30%)] to-[hsl(216,100%,35%)]",
              },
            ];
            const premium = isPremium();
            const insightLimit = premium ? insights.length : getLimit("insights");
            const visibleInsights = premium ? insights : insights.slice(0, insightLimit);
            return (
              <>
                {visibleInsights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`min-w-[260px] max-w-[280px] flex-shrink-0 rounded-2xl p-4 space-y-2 bg-gradient-to-br ${insight.gradient} border border-white/10`}
                  >
                    <span className="text-xl">{insight.icon}</span>
                    <h4 className="text-xs font-bold text-white leading-snug">{insight.title}</h4>
                    <p className="text-[11px] text-white/70 leading-relaxed">{insight.body}</p>
                  </motion.div>
                ))}
                {!premium && (
                  <div className="min-w-[220px] flex-shrink-0 rounded-2xl p-4 space-y-2 bg-gradient-to-br from-muted/40 to-muted/20 border border-border flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-2xl text-muted-foreground">lock</span>
                    <p className="text-xs font-bold text-foreground">Unlock All Insights</p>
                    <p className="text-[10px] text-muted-foreground">Upgrade for unlimited.</p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-lg font-bold tracking-tight text-foreground">Recent Transactions</h3>
          <button
            onClick={() => setShowAllTx(prev => !prev)}
            className="text-primary text-[10px] font-extrabold uppercase tracking-widest hover:underline"
          >
            {showAllTx ? "Show Less" : "View All"}
          </button>
        </div>
        <div className="glass-card rounded-2xl divide-y divide-border overflow-hidden">
          <AnimatePresence initial={false}>
            {displayTx.map((tx, i) => (
              <motion.div
                key={tx.name + tx.date}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, delay: i > 3 ? (i - 4) * 0.05 : 0 }}
              >
                <TransactionItem icon={tx.icon} name={tx.name} date={tx.date} amount={tx.amount} positive={tx.positive} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Transaction AI Insights ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <h4 className="text-sm font-bold tracking-tight text-foreground">Spending Insights</h4>
        </div>
        <div className="space-y-3">
          {(() => {
            const txList = getAllTransactions();
            const coffeeSpend = txList.filter(t => t.icon === "coffee" || t.name.toLowerCase().includes("coffee") || t.name.toLowerCase().includes("starbucks"));
            const diningOut = txList.filter(t => t.icon === "restaurant" || t.icon === "fastfood");
            const subscriptions = txList.filter(t => t.icon === "movie" || t.icon === "school" || t.name.toLowerCase().includes("subscription") || t.name.toLowerCase().includes("netflix") || t.name.toLowerCase().includes("spotify"));

            const txInsights: { icon: string; text: string; color: string }[] = [];

            if (coffeeSpend.length > 0) {
              const total = coffeeSpend.reduce((s, t) => s + parseFloat(t.amount.replace(/[^0-9.]/g, "")), 0);
              txInsights.push({
                icon: "coffee",
                text: `You spent $${total.toFixed(2)} on coffee this period (${coffeeSpend.length} purchase${coffeeSpend.length > 1 ? "s" : ""}). Brewing at home could save ~$${(total * 0.7).toFixed(0)}/month.`,
                color: "from-[hsl(36,90%,25%)] to-[hsl(36,70%,35%)]",
              });
            }

            if (diningOut.length > 0) {
              const total = diningOut.reduce((s, t) => s + parseFloat(t.amount.replace(/[^0-9.]/g, "")), 0);
              txInsights.push({
                icon: "restaurant",
                text: `${diningOut.length} dining-out transactions totaling $${total.toFixed(2)}. Meal-prepping 2 days/week could cut this by 30%.`,
                color: "from-[hsl(163,80%,22%)] to-[hsl(163,60%,30%)]",
              });
            }

            if (subscriptions.length > 0) {
              const total = subscriptions.reduce((s, t) => s + parseFloat(t.amount.replace(/[^0-9.]/g, "")), 0);
              txInsights.push({
                icon: "subscriptions",
                text: `${subscriptions.length} subscription charges totaling $${total.toFixed(2)}. Review them — most people have at least one they don't actively use.`,
                color: "from-[hsl(263,85%,28%)] to-[hsl(263,70%,38%)]",
              });
            }

            if (txInsights.length === 0) {
              txInsights.push({
                icon: "info",
                text: "Connect your accounts to get personalized transaction insights and spending pattern analysis.",
                color: "from-[hsl(216,100%,28%)] to-[hsl(216,80%,35%)]",
              });
            }

            return txInsights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl p-4 bg-gradient-to-r ${ins.color} border border-white/10 flex items-start gap-3`}
              >
                <span className="material-symbols-outlined text-white/80 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{ins.icon}</span>
                <p className="text-[11px] text-white/80 leading-relaxed flex-1">{ins.text}</p>
              </motion.div>
            ));
          })()}
        </div>
      </div>

      {/* ── Monthly Cash-Flow Calendar ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold tracking-tight text-foreground">Month at a Glance</h3>
        <div className="glass-card rounded-2xl p-5">
          <MonthlyCalendar />
        </div>
      </div>
      {/* ── Edit Balance Dialog ── */}
      <Dialog open={editingBalance} onOpenChange={setEditingBalance}>
        <DialogContent className="bg-surface-high border-border">
          <DialogHeader><DialogTitle className="text-foreground">Edit Balance</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Current Balance ($)</label>
            <Input
              type="number"
              value={tmpBalance}
              onChange={e => setTmpBalance(e.target.value)}
              className="bg-surface-highest border-border text-foreground"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingBalance(false)}>Cancel</Button>
            <Button onClick={() => { setBalance(parseFloat(tmpBalance) || 0); setEditingBalance(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Savings Dialog ── */}
      <Dialog open={editingSavings} onOpenChange={setEditingSavings}>
        <DialogContent className="bg-surface-high border-border">
          <DialogHeader><DialogTitle className="text-foreground">Edit Savings Goal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Current Savings ($)</label>
              <Input type="number" value={tmpSavCurrent} onChange={e => setTmpSavCurrent(e.target.value)} className="bg-surface-highest border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Goal ($)</label>
              <Input type="number" value={tmpSavGoal} onChange={e => setTmpSavGoal(e.target.value)} className="bg-surface-highest border-border text-foreground" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingSavings(false)}>Cancel</Button>
            <Button onClick={() => { setSavingsCurrent(parseFloat(tmpSavCurrent) || 0); setSavingsGoal(parseFloat(tmpSavGoal) || 1); setEditingSavings(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Budgets Dialog ── */}
      <Dialog open={editingBudgets} onOpenChange={setEditingBudgets}>
        <DialogContent className="bg-surface-high border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">Edit Budgets</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {tmpBudgets.map((b, i) => (
              <div key={b.name} className="space-y-2 p-3 bg-surface-highest rounded-xl border border-border">
                <p className="text-sm font-bold text-foreground">{b.name}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Spent ($)</label>
                    <Input
                      type="number"
                      value={b.spent}
                      onChange={e => {
                        const v = [...tmpBudgets];
                        v[i] = { ...v[i], spent: parseFloat(e.target.value) || 0 };
                        setTmpBudgets(v);
                      }}
                      className="bg-surface-high border-border text-foreground h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Budget ($)</label>
                    <Input
                      type="number"
                      value={b.budget}
                      onChange={e => {
                        const v = [...tmpBudgets];
                        v[i] = { ...v[i], budget: parseFloat(e.target.value) || 1 };
                        setTmpBudgets(v);
                      }}
                      className="bg-surface-high border-border text-foreground h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingBudgets(false)}>Cancel</Button>
            <Button onClick={() => { setBudgets(tmpBudgets); setEditingBudgets(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ── AI Insight Fetcher Hook ── */
function useAiInsight(prompt: string, deps: string) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getHasData()) return;
    const cacheKey = `sono-ai-insight-${btoa(deps).slice(0, 32)}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { text, ts } = JSON.parse(cached);
        if (Date.now() - ts < 3600000) { setInsight(text); return; }
      }
    } catch {}

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
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
          setInsight(full);
          localStorage.setItem(cacheKey, JSON.stringify({ text: full, ts: Date.now() }));
        }
      } catch (e) { console.error("AI insight error:", e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [deps]);

  return { insight, loading };
}

/* ── Expenses Tab ─────────────────────────────────── */
const ExpensesTab = () => {
  const saved = loadOverviewState();
  const defaultBudgets = getDefaultBudgets();
  const budgets: BudgetEntry[] = saved?.budgets ?? defaultBudgets;

  const categories = budgets.map(b => ({
    name: b.name, icon: b.icon, amount: b.spent, budget: b.budget, color: b.color,
  }));
  const totalSpent = categories.reduce((s, c) => s + c.amount, 0);
  const totalBudget = categories.reduce((s, c) => s + c.budget, 0) || 1;
  const budgetPct = Math.round((totalSpent / totalBudget) * 100);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const dailyBurn = dayOfMonth > 0 ? Math.round(totalSpent / dayOfMonth) : 0;
  const projectedTotal = dailyBurn * daysInMonth;
  const daysLeft = daysInMonth - dayOfMonth;
  const dailyBudgetRemaining = daysLeft > 0 ? Math.round((totalBudget - totalSpent) / daysLeft) : 0;

  const aiPrompt = `You are a concise financial analyst. In 2 short sentences, analyze this expense data and give one actionable tip. Total spent: $${totalSpent} of $${totalBudget} budget (${budgetPct}%). Daily burn rate: $${dailyBurn}/day. Projected month total: $${projectedTotal}. Categories: ${categories.map(c => `${c.name}: $${c.amount}/$${c.budget}`).join(", ")}. Days left: ${daysLeft}.`;
  const { insight: aiInsight, loading: aiLoading } = useAiInsight(aiPrompt, `expenses-${totalSpent}-${totalBudget}`);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tighter text-foreground">Expenses</h2>
        <p className="text-muted-foreground font-medium text-sm">Category breakdown this month</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider">Spent</p>
          <p className="text-lg font-bold text-foreground">${totalSpent.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">of ${totalBudget.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider">Daily Burn</p>
          <p className="text-lg font-bold text-foreground">${dailyBurn}</p>
          <p className={`text-[10px] font-bold ${projectedTotal > totalBudget ? "text-destructive" : "text-secondary"}`}>
            {projectedTotal > totalBudget ? "Over pace" : "On track"}
          </p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider">Left/Day</p>
          <p className="text-lg font-bold text-foreground">${dailyBudgetRemaining}</p>
          <p className="text-[10px] text-muted-foreground">{daysLeft} days left</p>
        </div>
      </div>

      {/* Overall progress with pace marker */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.15em] font-mono">Budget Usage</p>
            <span className="text-2xl font-bold text-foreground">{budgetPct}%</span>
          </div>
          <div className="text-right">
            <p className={`text-xs font-bold ${projectedTotal > totalBudget ? "text-destructive" : "text-secondary"}`}>
              Projected: ${projectedTotal.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">{projectedTotal > totalBudget ? `$${(projectedTotal - totalBudget).toLocaleString()} over` : `$${(totalBudget - projectedTotal).toLocaleString()} under`}</p>
          </div>
        </div>
        <div className="w-full bg-surface-highest h-2.5 rounded-full overflow-hidden relative">
          <div className="absolute top-0 h-full w-px bg-foreground/30 z-10" style={{ left: `${Math.round((dayOfMonth / daysInMonth) * 100)}%` }} />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budgetPct, 100)}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${totalSpent > totalBudget ? "bg-destructive" : "bg-primary"}`}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground">Day {dayOfMonth}</span>
          <span className="text-[9px] text-muted-foreground">Day {daysInMonth}</span>
        </div>
      </div>

      {/* Donut + legend */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {(() => {
                let offset = 0;
                const colors = ["hsl(216 100% 71%)", "hsl(163 100% 76%)", "hsl(36 90% 55%)", "hsl(216 100% 71%)", "hsl(263 85% 75%)", "hsl(163 100% 76%)", "hsl(36 90% 55%)", "hsl(216 100% 71%)"];
                return categories.map((cat, i) => {
                  const pct = totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0;
                  const el = (
                    <circle key={cat.name} cx="18" cy="18" r="15.9155" fill="none" stroke={colors[i]} strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} strokeLinecap="round" />
                  );
                  offset += pct;
                  return el;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-foreground">{budgetPct}%</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {categories.slice(0, 4).map(cat => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${cat.color === "secondary" ? "bg-secondary" : cat.color === "amber" ? "bg-amber" : "bg-primary"}`} />
                  <span className="text-xs text-muted-foreground">{cat.name}</span>
                </div>
                <span className="text-xs font-bold text-foreground">${cat.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full category list */}
      <div className="glass-card rounded-2xl divide-y divide-border overflow-hidden">
        {categories.map(cat => {
          const pct = cat.budget > 0 ? Math.round((cat.amount / cat.budget) * 100) : 0;
          const over = cat.amount > cat.budget;
          return (
            <div key={cat.name} className="flex items-center justify-between p-4 hover:bg-surface-high/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-high flex items-center justify-center border border-border">
                  <span className="material-symbols-outlined text-foreground/70">{cat.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground">${cat.amount} of ${cat.budget}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold ${over ? "text-destructive" : "text-secondary"}`}>
                  {over ? `Over by $${cat.amount - cat.budget}` : `${pct}%`}
                </span>
                <div className="w-16 bg-surface-highest h-1 rounded-full mt-1 overflow-hidden">
                  <div className={`h-full rounded-full ${over ? "bg-destructive" : cat.color === "secondary" ? "bg-secondary" : cat.color === "amber" ? "bg-amber" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Insight */}
      {getHasData() && (
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[hsl(216,100%,20%)] to-[hsl(263,85%,25%)] border border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h4 className="text-xs font-bold text-white">AI Analysis</h4>
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:300ms]" />
            </div>
          ) : aiInsight ? (
            <p className="text-[11px] text-white/80 leading-relaxed">{aiInsight}</p>
          ) : (
            <p className="text-[11px] text-white/50">Loading expense analysis...</p>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Spending Tab ─────────────────────────────────── */
function generateSpendingData(budgets: BudgetEntry[]): Record<string, { month: string; amount: number }[]> {
  const monthlyTotal = budgets.reduce((s, b) => s + b.spent, 0);
  const hash = budgets.reduce((s, b) => s + b.spent * 7 + b.budget * 3, 0);
  const seededVar = (base: number, i: number, spread: number) => {
    const noise = Math.sin(hash * 0.001 + i * 2.7) * spread;
    return Math.round(base * (1 + noise));
  };
  const dailyAvg = Math.round(monthlyTotal / 30);
  const weeklyAvg = Math.round(monthlyTotal / 4);

  return {
    "1W": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({ month: d, amount: seededVar(dailyAvg, i, 0.6) })),
    "1M": ["Wk 1", "Wk 2", "Wk 3", "Wk 4"].map((w, i) => ({ month: w, amount: seededVar(weeklyAvg, i, 0.2) })),
    "3M": ["Jan", "Feb", "Mar"].map((m, i) => ({ month: m, amount: seededVar(monthlyTotal, i, 0.1) })),
    "6M": ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((m, i) => ({ month: m, amount: seededVar(monthlyTotal, i, 0.15) })),
    "YTD": ["Jan", "Feb", "Mar"].map((m, i) => ({ month: m, amount: seededVar(monthlyTotal, i, 0.1) })),
    "ALL": ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((m, i) => ({ month: m, amount: seededVar(monthlyTotal, i, 0.15) })),
  };
}

function buildLinePath(data: { amount: number }[], width: number, height: number, padding = 8): { line: string; fill: string } {
  if (data.length < 2) return { line: "M0,0", fill: "M0,0" };
  const min = Math.min(...data.map(d => d.amount)) * 0.9;
  const max = Math.max(...data.map(d => d.amount)) * 1.05;
  const range = max - min || 1;
  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (d.amount - min) / range) * (height - padding * 2),
  }));

  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  const fill = `${path} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;
  return { line: path, fill };
}

const SpendingTab = () => {
  const hasData = getHasData();
  const saved = loadOverviewState();
  const budgets: BudgetEntry[] = saved?.budgets ?? getDefaultBudgets();
  const spendingDataMap = generateSpendingData(budgets);

  const [spendingRange, setSpendingRange] = useState("1W");
  const spendingMonths = hasData ? (spendingDataMap[spendingRange] || spendingDataMap["1W"]) : (spendingDataMap[spendingRange] || spendingDataMap["1W"]).map(m => ({ ...m, amount: 0 }));
  const totalSpending = spendingMonths.reduce((s, m) => s + m.amount, 0);
  const avgSpending = Math.round(totalSpending / spendingMonths.length);

  const prevPeriodTotal = Math.round(totalSpending * (1 + Math.sin(totalSpending * 0.001) * 0.08));
  const changePct = prevPeriodTotal > 0 ? ((totalSpending - prevPeriodTotal) / prevPeriodTotal * 100).toFixed(1) : "0.0";
  const changePositive = totalSpending <= prevPeriodTotal;

  const chartW = 320;
  const chartH = 140;
  const { line: linePath, fill: fillPath } = buildLinePath(spendingMonths, chartW, chartH);

  const sortedBudgets = [...budgets].sort((a, b) => b.spent - a.spent);

  const aiPrompt = `You are a concise financial analyst. In 2-3 short sentences, analyze spending trends. Total: $${totalSpending} this period, avg $${avgSpending}/${spendingRange === "1W" ? "day" : "month"}. Change: ${changePct}% vs last period. Top categories: ${sortedBudgets.slice(0, 3).map(b => `${b.name} $${b.spent}`).join(", ")}. Give one specific actionable recommendation.`;
  const { insight: aiInsight, loading: aiLoading } = useAiInsight(aiPrompt, `spending-${spendingRange}-${totalSpending}`);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tighter text-foreground">Spending</h2>
        <p className="text-muted-foreground font-medium text-sm">Trends & insights over time</p>
      </div>

      {/* Line chart card */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.15em] font-mono">Total Spent</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tracking-tight">${totalSpending.toLocaleString()}</span>
              <span className="text-muted-foreground text-xs font-medium">avg ${avgSpending.toLocaleString()}/{spendingRange === "1W" ? "day" : spendingRange === "1M" ? "wk" : "mo"}</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${changePositive ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive"}`}>
            <span className="material-symbols-outlined text-sm">{changePositive ? "trending_down" : "trending_up"}</span>
            <span className="text-[11px] font-bold">{changePct}%</span>
          </div>
        </div>

        {/* SVG line chart */}
        <div className="w-full relative" style={{ height: `${chartH}px` }}>
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${chartW} ${chartH}`}>
            <defs>
              <linearGradient id="spendGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(216 100% 71%)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(216 100% 71%)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map(pct => (
              <line key={pct} x1="0" x2={chartW} y1={chartH * pct} y2={chartH * pct} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
            ))}
            <motion.path d={fillPath} fill="url(#spendGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
            <motion.path d={linePath} fill="none" stroke="hsl(216 100% 71%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
            {spendingMonths.map((m, i) => {
              const min2 = Math.min(...spendingMonths.map(d => d.amount)) * 0.9;
              const max2 = Math.max(...spendingMonths.map(d => d.amount)) * 1.05;
              const range2 = max2 - min2 || 1;
              const x = 8 + (i / (spendingMonths.length - 1)) * (chartW - 16);
              const y = 8 + (1 - (m.amount - min2) / range2) * (chartH - 16);
              return <circle key={i} cx={x} cy={y} r="3" fill="hsl(216 100% 71%)" stroke="hsl(var(--background))" strokeWidth="1.5" />;
            })}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between px-2">
          {spendingMonths.map((m, i) => (
            <div key={m.month} className="text-center">
              <p className="text-[9px] font-bold text-muted-foreground">${m.amount >= 1000 ? `${(m.amount / 1000).toFixed(1)}k` : m.amount}</p>
              <p className={`text-[10px] font-bold ${i === spendingMonths.length - 1 ? "text-primary" : "text-muted-foreground"}`}>{m.month}</p>
            </div>
          ))}
        </div>

        {/* Time range selectors */}
        <div className="flex justify-center gap-4">
          {["1W", "1M", "3M", "6M", "YTD", "ALL"].map((range) => (
            <button
              key={range}
              onClick={() => setSpendingRange(range)}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${
                spendingRange === range ? "bg-surface-highest text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Top categories */}
      {hasData && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight text-foreground">Top Categories</h3>
          <div className="glass-card rounded-2xl divide-y divide-border overflow-hidden">
            {sortedBudgets.slice(0, 5).map(b => {
              const pct = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0;
              const over = b.spent > b.budget;
              const share = totalSpending > 0 ? Math.round((b.spent / totalSpending) * 100) : 0;
              return (
                <div key={b.name} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-high flex items-center justify-center border border-border">
                      <span className="material-symbols-outlined text-foreground/70 text-sm">{b.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">${b.spent.toLocaleString()} of ${b.budget.toLocaleString()} · {share}% of total</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${over ? "text-destructive" : "text-secondary"}`}>
                    {over ? `+$${(b.spent - b.budget).toLocaleString()}` : `${pct}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Insight */}
      {hasData && (
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[hsl(216,100%,20%)] to-[hsl(263,85%,25%)] border border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h4 className="text-xs font-bold text-white">AI Spending Analysis</h4>
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:300ms]" />
            </div>
          ) : aiInsight ? (
            <p className="text-[11px] text-white/80 leading-relaxed">{aiInsight}</p>
          ) : (
            <p className="text-[11px] text-white/50">Loading spending analysis...</p>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Resources Tab ────────────────────────────────── */
const ADVISOR_TYPES = [
  { id: "cpa", label: "CPA", icon: "calculate" },
  { id: "cfp", label: "Financial Planner", icon: "account_balance" },
  { id: "tax", label: "Tax Advisor", icon: "receipt_long" },
  { id: "debt", label: "Debt Counselor", icon: "credit_card_off" },
];

interface LiveAdvisor {
  name: string;
  description: string;
  url: string;
  source: string;
}

const ResourcesTab = () => {
  const [filter, setFilter] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [locationSet, setLocationSet] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [advisors, setAdvisors] = useState<LiveAdvisor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const searchAdvisors = useCallback(async (loc: string, type: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('search-advisors', {
        body: { location: loc, type },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Search failed');
      setAdvisors(data.advisors || []);
      setSearched(true);
    } catch (e: any) {
      console.error('Search error:', e);
      setError(e.message || 'Failed to search. Please try again.');
      setAdvisors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSetZip = () => {
    if (locationInput.trim()) {
      const loc = locationInput.trim();
      setLocation(`📍 ${loc}`);
      setLocationSet(true);
      setLocationInput("");
      searchAdvisors(loc, filter);
    }
  };

  const handleUseDeviceLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          setLocation("📍 Using device location");
          setLocationSet(true);
          searchAdvisors(loc, filter);
        },
        () => { /* denied */ }
      );
    }
  };

  const handleFilterChange = (newFilter: string | null) => {
    setFilter(newFilter);
    if (locationSet) {
      const loc = location.replace("📍 ", "").replace("Using device location", "current location");
      searchAdvisors(loc, newFilter);
    }
  };

  const handleChangeLocation = () => {
    setLocationSet(false);
    setAdvisors([]);
    setSearched(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tighter text-foreground">Local Resources</h2>
        <p className="text-muted-foreground font-medium text-sm">Find licensed financial advisors near you</p>
      </div>

      {/* Location picker */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        {locationSet && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <span className="text-sm text-foreground font-medium">{location}</span>
            </div>
            <button onClick={handleChangeLocation} className="text-primary text-[10px] font-extrabold uppercase tracking-widest hover:underline">
              Change
            </button>
          </div>
        )}
        {!locationSet && (
          <>
            <p className="text-xs text-muted-foreground">Enter your zip code or city, or use device location</p>
            <div className="flex gap-2">
              <input
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSetZip()}
                placeholder="Zip code or city name..."
                className="flex-1 bg-surface-high border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <button onClick={handleSetZip} className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
                Search
              </button>
            </div>
            <button onClick={handleUseDeviceLocation} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <span className="material-symbols-outlined text-sm">my_location</span>
              Use my device location instead
            </button>
          </>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        <button
          onClick={() => handleFilterChange(null)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
            !filter ? "bg-primary/15 border-primary/30 text-primary" : "bg-surface-high border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {ADVISOR_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => handleFilterChange(filter === t.id ? null : t.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              filter === t.id ? "bg-primary/15 border-primary/30 text-primary" : "bg-surface-high border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Searching for advisors...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card rounded-2xl p-4 border-destructive/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-destructive">error</span>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && searched && advisors.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-muted-foreground text-4xl mb-2">search_off</span>
          <p className="text-sm text-muted-foreground">No results found. Try a different location or category.</p>
        </div>
      )}

      {!loading && !error && !searched && locationSet && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Select a category above or searching all...</p>
        </div>
      )}

      {!loading && advisors.length > 0 && (
        <div className="space-y-3">
          {advisors.map((advisor, i) => (
            <motion.div
              key={`${advisor.url}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4 hover:bg-surface-high/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground leading-snug">{advisor.name}</h4>
                  {advisor.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{advisor.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">via {advisor.source}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <a
                  href={advisor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-primary/10 text-primary font-bold py-2 rounded-lg text-xs hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  View Profile
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Prompt if not searched yet */}
      {!locationSet && !loading && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-muted-foreground/40 text-5xl">location_searching</span>
          <p className="text-sm text-muted-foreground mt-3">Enter your location above to find advisors near you</p>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center px-4">
        Results are sourced from the web. Verify credentials independently before engaging any advisor.
      </p>
    </div>
  );
};

/* ── Shared Sub-Components ────────────────────────── */
const BudgetItem = ({ icon, name, spent, remaining, progress, color }: {
  icon: string; name: string; spent: string; remaining: string; progress: number; color: string;
}) => (
  <div className="flex items-center justify-between p-4 group hover:bg-surface-high/50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-surface-high flex items-center justify-center border border-border group-hover:bg-surface-highest transition-colors">
        <span className="material-symbols-outlined text-foreground/70">{icon}</span>
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{remaining}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-sm text-foreground">{spent}</p>
      <div className="w-20 bg-surface-highest h-1 rounded-full mt-2 overflow-hidden">
        <div className={`h-full rounded-full ${color === "secondary" ? "bg-secondary" : color === "primary" ? "bg-primary" : "bg-amber"}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  </div>
);

const TransactionItem = ({ icon, name, date, amount, positive }: {
  icon: string; name: string; date: string; amount: string; positive?: boolean;
}) => (
  <div className="flex items-center justify-between p-4 group hover:bg-surface-high/50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-surface-high flex items-center justify-center border border-border">
        <span className="material-symbols-outlined text-foreground/70">{icon}</span>
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
    <span className={`font-bold text-sm ${positive ? "text-secondary" : "text-foreground"}`}>{amount}</span>
  </div>
);

export default DashboardPage;
