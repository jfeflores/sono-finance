import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreakModalProps {
  open: boolean;
  onClose: () => void;
  streak: number;
}

/* ── Currency helpers ── */
function getSononite(): number {
  return parseInt(localStorage.getItem("sono-sononite") || "0", 10);
}
function setSononite(val: number) {
  localStorage.setItem("sono-sononite", val.toString());
}
function getInventory(): { freezes: number; hearts: number } {
  try {
    return JSON.parse(localStorage.getItem("sono-inventory") || '{"freezes":0,"hearts":0}');
  } catch { return { freezes: 0, hearts: 0 }; }
}
function setInventory(inv: { freezes: number; hearts: number }) {
  localStorage.setItem("sono-inventory", JSON.stringify(inv));
}

// Compute sononite from completed paths (each path = a set of completed lessons in a topic)
function computeEarnedSononite(): number {
  try {
    const completed: string[] = JSON.parse(localStorage.getItem("sono-completed-lessons") || "[]");
    const paths: Record<string, number> = {};
    completed.forEach(id => {
      const topic = id.replace(/-\d+$/, "");
      paths[topic] = (paths[topic] || 0) + 1;
    });
    // A "completed path" = 3+ lessons in a topic
    const completedPaths = Object.values(paths).filter(c => c >= 3).length;
    return completedPaths * 100;
  } catch { return 0; }
}

type TabId = "streak" | "shop" | "friends";

export default function StreakModal({ open, onClose, streak }: StreakModalProps) {
  const [tab, setTab] = useState<TabId>("streak");
  const [sononite, setSononiteState] = useState(0);
  const [inventory, setInventoryState] = useState({ freezes: 0, hearts: 0 });
  const [referralLink, setReferralLink] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync sononite on open
  useEffect(() => {
    if (!open) return;
    const earned = computeEarnedSononite();
    const spent = parseInt(localStorage.getItem("sono-sononite-spent") || "0", 10);
    const balance = Math.max(earned - spent, 0);
    setSononite(balance);
    setSononiteState(balance);
    setInventoryState(getInventory());

    // Generate referral link
    const userId = localStorage.getItem("sono-user-email") || "user";
    const code = btoa(userId).replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
    setReferralLink(`https://sonofinance.lovable.app/?ref=${code}`);
  }, [open]);

  const handleBuy = useCallback((item: "freeze" | "heart") => {
    const cost = item === "freeze" ? 50 : 25;
    if (sononite < cost) {
      toast.error("Not enough Sononite!", { description: `You need ${cost} but have ${sononite}.` });
      return;
    }
    const spent = parseInt(localStorage.getItem("sono-sononite-spent") || "0", 10);
    localStorage.setItem("sono-sononite-spent", (spent + cost).toString());
    const newBalance = sononite - cost;
    setSononite(newBalance);
    setSononiteState(newBalance);

    const inv = getInventory();
    if (item === "freeze") inv.freezes++;
    else inv.hearts++;
    setInventory(inv);
    setInventoryState(inv);
    toast.success(`Purchased ${item === "freeze" ? "Streak Freeze" : "Extra Heart"}!`, {
      description: `${cost} Sononite spent. Balance: ${newBalance}`,
    });
  }, [sononite]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralLink]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const monthName = now.toLocaleString("default", { month: "long" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const practicedDays = new Set<number>();
  for (let d = Math.max(1, today - streak + 1); d <= today; d++) practicedDays.add(d);

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "streak", label: "Streak", icon: "local_fire_department" },
    { id: "shop", label: "Shop", icon: "storefront" },
    { id: "friends", label: "Friends", icon: "group" },
  ];

  const shopItems = [
    {
      id: "freeze" as const,
      name: "Streak Freeze",
      desc: "Protect your streak for 1 missed day",
      icon: "ac_unit",
      cost: 50,
      owned: inventory.freezes,
      gradient: "from-[hsl(200,90%,30%)] to-[hsl(216,100%,40%)]",
      iconColor: "text-[hsl(200,90%,70%)]",
    },
    {
      id: "heart" as const,
      name: "Extra Heart",
      desc: "Get an extra life in lessons & quizzes",
      icon: "favorite",
      cost: 25,
      owned: inventory.hearts,
      gradient: "from-[hsl(340,80%,35%)] to-[hsl(360,80%,45%)]",
      iconColor: "text-[hsl(340,80%,70%)]",
    },
  ];

  // Simple QR via a public API (no dependency needed)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(referralLink)}&bgcolor=0d0d12&color=6b8afd&format=svg`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 50 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed inset-x-3 top-[6vh] sm:inset-auto sm:top-[6vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-[70] rounded-3xl border border-border/60 bg-surface-low shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
          >
            {/* Header with Sononite balance */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
              <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-surface-high flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-muted-foreground text-lg">close</span>
              </button>
              <div className="flex items-center gap-1.5 bg-amber/10 px-3 py-1 rounded-full border border-amber/20">
                <span className="text-sm">💎</span>
                <span className="text-xs font-bold text-amber">{sononite}</span>
                <span className="text-[9px] text-amber/60 font-bold">Sononite</span>
              </div>
              <div className="w-8" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/50 px-2">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors relative ${
                    tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: tab === t.id ? "'FILL' 1" : "" }}>{t.icon}</span>
                  {t.label}
                  {tab === t.id && (
                    <motion.div layoutId="streak-tab-v2" className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="p-5 space-y-5"
                >
                  {/* ─── STREAK TAB ─── */}
                  {tab === "streak" && (
                    <>
                      {/* Hero */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-foreground tracking-tighter">{streak}</span>
                            <span className="text-xl font-bold text-muted-foreground">days</span>
                          </div>
                          <p className="text-muted-foreground text-xs font-medium mt-1">
                            {streak >= 7 ? "You're on fire! Keep going 🔥" : "Build your streak to unlock rewards"}
                          </p>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="text-6xl"
                        >
                          🔥
                        </motion.div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-surface-high/60 p-3 text-center border border-border/50">
                          <p className="text-lg font-bold text-foreground">{practicedDays.size}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase">Practiced</p>
                        </div>
                        <div className="rounded-xl bg-surface-high/60 p-3 text-center border border-border/50">
                          <p className="text-lg font-bold text-foreground">{inventory.freezes}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase">Freezes</p>
                        </div>
                        <div className="rounded-xl bg-surface-high/60 p-3 text-center border border-border/50">
                          <p className="text-lg font-bold text-foreground">{inventory.hearts}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase">Hearts</p>
                        </div>
                      </div>

                      {/* Calendar */}
                      <div className="rounded-xl bg-surface-high/40 p-4 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-foreground">{monthName} {year}</h4>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-1.5">
                          {dayNames.map(d => (
                            <div key={d} className="text-center text-[9px] font-bold text-muted-foreground/60">{d}</div>
                          ))}
                        </div>
                        {weeks.map((week, wi) => (
                          <div key={wi} className="grid grid-cols-7 gap-1">
                            {week.map((day, di) => {
                              const isToday = day === today;
                              const practiced = day ? practicedDays.has(day) : false;
                              const isFuture = day ? day > today : false;
                              return (
                                <div
                                  key={di}
                                  className={`flex items-center justify-center h-8 rounded-lg text-[11px] font-semibold transition-all ${
                                    !day ? "" :
                                    isToday ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" :
                                    practiced ? "bg-primary/15 text-primary" :
                                    isFuture ? "text-muted-foreground/30" :
                                    "text-muted-foreground/60"
                                  }`}
                                >
                                  {day || ""}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>

                      {/* Streak milestones */}
                      <div className="space-y-2">
                        {[
                          { days: 7, reward: "🛡️ Streak Society", unlocked: streak >= 7 },
                          { days: 30, reward: "⭐ Gold Badge", unlocked: streak >= 30 },
                          { days: 100, reward: "💎 500 Sononite", unlocked: streak >= 100 },
                        ].map(m => (
                          <div key={m.days} className={`flex items-center gap-3 rounded-xl p-3 border transition-colors ${m.unlocked ? "bg-primary/10 border-primary/20" : "bg-surface-high/30 border-border/50"}`}>
                            <span className={`text-lg ${m.unlocked ? "" : "opacity-30 grayscale"}`}>{m.unlocked ? "✅" : "🔒"}</span>
                            <div className="flex-1">
                              <p className={`text-xs font-bold ${m.unlocked ? "text-primary" : "text-muted-foreground"}`}>{m.reward}</p>
                              <p className="text-[10px] text-muted-foreground">{m.days}-day streak</p>
                            </div>
                            {m.unlocked && <span className="text-[10px] text-primary font-bold">Unlocked!</span>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ─── SHOP TAB ─── */}
                  {tab === "shop" && (
                    <>
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-bold text-foreground">Sononite Shop</h3>
                        <p className="text-xs text-muted-foreground">Earn 100 💎 per completed Active Path</p>
                      </div>

                      {/* Balance card */}
                      <div className="rounded-2xl p-4 bg-gradient-to-br from-amber/15 to-amber/5 border border-amber/20 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-amber/70 font-bold uppercase tracking-wider">Your Balance</p>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-3xl font-black text-amber">{sononite}</span>
                            <span className="text-sm text-amber/60 font-bold">💎</span>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          className="text-4xl"
                        >
                          💎
                        </motion.div>
                      </div>

                      {/* Shop items */}
                      <div className="space-y-3">
                        {shopItems.map(item => (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className={`rounded-2xl p-4 bg-gradient-to-br ${item.gradient} border border-white/10 space-y-3`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <span className={`material-symbols-outlined text-2xl ${item.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-white">{item.name}</h4>
                                  <span className="text-[10px] text-white/50 font-bold">Owned: {item.owned}</span>
                                </div>
                                <p className="text-[11px] text-white/60 mt-0.5">{item.desc}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleBuy(item.id)}
                              disabled={sononite < item.cost}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                sononite >= item.cost
                                  ? "bg-white/20 text-white hover:bg-white/30 active:scale-[0.97]"
                                  : "bg-white/5 text-white/30 cursor-not-allowed"
                              }`}
                            >
                              <span className="text-sm">💎</span>
                              {item.cost} Sononite
                            </button>
                          </motion.div>
                        ))}
                      </div>

                      {/* How to earn */}
                      <div className="rounded-xl bg-surface-high/40 p-4 border border-border/50 space-y-2">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">info</span>
                          How to Earn
                        </h4>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">📚</span>
                            <p className="text-[11px] text-muted-foreground">Complete an Active Path → <span className="text-amber font-bold">+100 💎</span></p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">👥</span>
                            <p className="text-[11px] text-muted-foreground">Refer a friend who signs up → <span className="text-amber font-bold">+100 💎</span></p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">🔥</span>
                            <p className="text-[11px] text-muted-foreground">100-day streak milestone → <span className="text-amber font-bold">+500 💎</span></p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ─── FRIENDS TAB ─── */}
                  {tab === "friends" && (
                    <>
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-bold text-foreground">Invite Friends</h3>
                        <p className="text-xs text-muted-foreground">Earn <span className="text-amber font-bold">100 💎</span> for each friend who signs up</p>
                      </div>

                      {/* Referral card */}
                      <div className="rounded-2xl p-5 bg-gradient-to-br from-[hsl(263,85%,30%)] to-[hsl(216,100%,30%)] border border-white/10 space-y-4">
                        <div className="text-center space-y-2">
                          <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-4xl"
                          >
                            🎁
                          </motion.div>
                          <p className="text-sm font-bold text-white">Share your invite link</p>
                          <p className="text-[11px] text-white/60">Friends get the full Sono experience, you get 100 Sononite each!</p>
                        </div>

                        {/* Link display */}
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5">
                          <p className="flex-1 text-[11px] text-white/80 font-mono truncate">{referralLink}</p>
                          <button
                            onClick={handleCopyLink}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition-colors active:scale-95"
                          >
                            {copied ? "Copied!" : "Copy"}
                          </button>
                        </div>

                        {/* QR Toggle */}
                        <button
                          onClick={() => setShowQr(!showQr)}
                          className="w-full py-2 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/15 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">qr_code_2</span>
                          {showQr ? "Hide QR Code" : "Show QR Code"}
                        </button>

                        <AnimatePresence>
                          {showQr && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden flex justify-center"
                            >
                              <div className="bg-white rounded-2xl p-3">
                                <img src={qrUrl} alt="Referral QR Code" className="w-40 h-40" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Share buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            window.open(`https://wa.me/?text=${encodeURIComponent(`Join me on Sono Finance! ${referralLink}`)}`, "_blank");
                          }}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 text-[#25D366] text-xs font-bold border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            window.open(`mailto:?subject=Join Sono Finance&body=${encodeURIComponent(`Check out Sono Finance! ${referralLink}`)}`, "_blank");
                          }}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                          Email
                        </button>
                      </div>

                      {/* Referral stats */}
                      <div className="rounded-xl bg-surface-high/40 p-4 border border-border/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-foreground">Referral Stats</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Friends joined via your link</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">0</p>
                            <p className="text-[10px] text-amber font-bold">0 💎 earned</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}