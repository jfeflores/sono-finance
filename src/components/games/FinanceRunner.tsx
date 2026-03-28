import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────
interface Obstacle {
  lane: number;
  x: number;
  y: number;
  isQ: boolean;
  hit: boolean;
  triggered: boolean;
  opacity: number;
  pulse: number;
}

interface Coin {
  x: number;
  y: number;
  done?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  col: string;
  r: number;
  life: number;
}

interface Question {
  topic: string;
  q: string;
  opts: string[];
  ans: number;
}

// ── Questions ──────────────────────────────────────────────────
const QUESTIONS: Question[] = [
  // Money Basics
  { topic: "Money Basics",     q: "The three main functions of money are:",          opts: ["Store, trade, invest", "Medium of exchange, unit of account, store of value", "Earn, spend, save", "Cash, credit, crypto"], ans: 1 },
  { topic: "Money Basics",     q: "Cash flow is the difference between:",            opts: ["Assets and liabilities", "Income and expenses", "Savings and debt", "Stocks and bonds"], ans: 1 },
  { topic: "Money Basics",     q: "Which is a 'need' vs a 'want'?",                 opts: ["Streaming service", "Rent payment", "New sneakers", "Concert tickets"], ans: 1 },
  { topic: "Money Basics",     q: "A SMART financial goal is:",                      opts: ["Simple, Monetary, Achievable, Real, Timely", "Specific, Measurable, Achievable, Relevant, Time-bound", "Save More And Reduce Taxes", "Standard Money Allocation Review Tool"], ans: 1 },
  { topic: "Money Basics",     q: "Paying yourself first means:",                   opts: ["Buying what you want before bills", "Saving before spending on anything else", "Getting paid early", "Lending money to yourself"], ans: 1 },

  // Budgeting
  { topic: "Budgeting",        q: "In the 50/30/20 rule, the 20% covers:",          opts: ["Food", "Entertainment", "Savings & debt", "Taxes"], ans: 2 },
  { topic: "Budgeting",        q: "A zero-based budget means income minus all categories equals:", opts: ["Savings", "Zero", "Net worth", "Tax"], ans: 1 },
  { topic: "Budgeting",        q: "The 50% in the 50/30/20 rule covers:",           opts: ["Wants", "Savings", "Needs", "Investments"], ans: 2 },
  { topic: "Budgeting",        q: "Which is NOT a common budgeting method?",         opts: ["Envelope system", "50/30/20", "Zero-based", "FIFO method"], ans: 3 },
  { topic: "Budgeting",        q: "How often should you review your budget?",        opts: ["Once a year", "Every 5 years", "Monthly", "Only when you get a raise"], ans: 2 },

  // Interest & Loans
  { topic: "Interest & Loans", q: "Simple interest is calculated on:",              opts: ["Principal + interest", "Only the principal", "Monthly balance", "Average balance"], ans: 1 },
  { topic: "Interest & Loans", q: "APR stands for:",                                opts: ["Annual Payment Rate", "Annual Percentage Rate", "Average Prime Rate", "Adjusted Principal Return"], ans: 1 },
  { topic: "Interest & Loans", q: "Compound interest earns interest on:",           opts: ["Only principal", "Principal + accumulated interest", "Only new deposits", "Government bonds"], ans: 1 },
  { topic: "Interest & Loans", q: "A secured loan requires:",                       opts: ["Good credit only", "Collateral", "A co-signer", "Cash deposit"], ans: 1 },
  { topic: "Interest & Loans", q: "The debt avalanche method targets:",             opts: ["Smallest balance first", "Highest interest rate first", "Oldest debt first", "Newest debt first"], ans: 1 },
  { topic: "Interest & Loans", q: "Minimum payments on credit cards mostly cover:", opts: ["Principal", "Interest charges", "Fees only", "Equal principal and interest"], ans: 1 },

  // Credit & Scores
  { topic: "Credit",           q: "Which factor makes up 35% of your FICO score?",  opts: ["Credit mix", "Utilisation", "Payment history", "New inquiries"], ans: 2 },
  { topic: "Credit",           q: "Healthy credit utilisation stays below:",         opts: ["50%", "30%", "75%", "10%"], ans: 1 },
  { topic: "Credit",           q: "FICO scores range from:",                         opts: ["0–100", "100–500", "300–850", "500–1000"], ans: 2 },
  { topic: "Credit",           q: "A hard inquiry on your credit stays for:",        opts: ["6 months", "1 year", "2 years", "5 years"], ans: 2 },
  { topic: "Credit",           q: "Which helps build credit from scratch?",          opts: ["Debit card usage", "Secured credit card", "Savings account", "Cash payments"], ans: 1 },
  { topic: "Credit",           q: "You can check your credit report for free at:",   opts: ["AnnualCreditReport.com", "Your bank only", "Credit card company", "IRS website"], ans: 0 },

  // Banking
  { topic: "Banking",          q: "A checking account is best for:",                opts: ["Long-term savings", "Daily transactions", "Investing", "Retirement"], ans: 1 },
  { topic: "Banking",          q: "FDIC insurance covers deposits up to:",           opts: ["$100,000", "$250,000", "$500,000", "$1,000,000"], ans: 1 },
  { topic: "Banking",          q: "High-yield savings accounts typically offer:",    opts: ["Lower rates than traditional banks", "10-20× higher rates than traditional banks", "No interest", "Variable stock returns"], ans: 1 },
  { topic: "Banking",          q: "An overdraft fee occurs when you:",               opts: ["Deposit too much", "Spend more than your balance", "Transfer between accounts", "Close your account"], ans: 1 },
  { topic: "Banking",          q: "An emergency fund should cover:",                 opts: ["1 month of expenses", "3–6 months of expenses", "1 year of salary", "Just rent"], ans: 1 },

  // Investing
  { topic: "Investing",        q: "ETF stands for:",                                opts: ["Equity Transfer Fund", "Exchange-Traded Fund", "Extended Term Finance", "Earnings Tax Form"], ans: 1 },
  { topic: "Investing",        q: "The Rule of 72 estimates years to:",             opts: ["Pay off debt", "File taxes", "Double your money", "Retire"], ans: 2 },
  { topic: "Investing",        q: "Index funds aim to:",                             opts: ["Beat the market", "Match a market index", "Guarantee returns", "Avoid risk"], ans: 1 },
  { topic: "Investing",        q: "Diversification means:",                          opts: ["Buying one stock", "Spreading investments across assets", "Only investing in bonds", "Timing the market"], ans: 1 },
  { topic: "Investing",        q: "A bear market means prices are:",                opts: ["Rising", "Stable", "Falling 20%+", "At all-time highs"], ans: 2 },
  { topic: "Investing",        q: "Dollar-cost averaging means:",                   opts: ["Buying all at once", "Investing fixed amounts at regular intervals", "Only buying dips", "Converting currency"], ans: 1 },
  { topic: "Investing",        q: "Stocks represent:",                               opts: ["A loan to a company", "Ownership in a company", "Government debt", "Bank deposits"], ans: 1 },

  // Retirement
  { topic: "Retirement",       q: "401(k) 2024 contribution limit:",                opts: ["$7,000", "$15,000", "$23,000", "$30,000"], ans: 2 },
  { topic: "Retirement",       q: "Roth accounts use:",                              opts: ["Pre-tax money", "After-tax money", "Employer funds", "Government grants"], ans: 1 },
  { topic: "Retirement",       q: "An employer 401(k) match is:",                   opts: ["A loan", "Free money for retirement", "A tax penalty", "Optional insurance"], ans: 1 },
  { topic: "Retirement",       q: "Traditional IRA contributions are:",              opts: ["Tax-free forever", "Tax-deductible now, taxed later", "Never deductible", "Only for employers"], ans: 1 },
  { topic: "Retirement",       q: "Target-date funds automatically:",                opts: ["Pick individual stocks", "Shift from aggressive to conservative over time", "Guarantee returns", "Avoid all risk"], ans: 1 },
  { topic: "Retirement",       q: "Early 401(k) withdrawal penalty is:",             opts: ["5%", "10%", "15%", "25%"], ans: 1 },

  // Taxes
  { topic: "Taxes",            q: "Long-term capital gains apply after holding:",    opts: ["90 days", "6 months", "1 year", "5 years"], ans: 2 },
  { topic: "Taxes",            q: "Moving to a higher tax bracket means:",           opts: ["All income at new rate", "Only income above threshold", "Full recalculation", "Different form"], ans: 1 },
  { topic: "Taxes",            q: "A tax deduction:",                                opts: ["Reduces your tax bill directly", "Reduces your taxable income", "Eliminates all taxes", "Only applies to businesses"], ans: 1 },
  { topic: "Taxes",            q: "A tax credit:",                                   opts: ["Reduces taxable income", "Reduces your tax bill dollar-for-dollar", "Only applies to property", "Increases your refund by 50%"], ans: 1 },
  { topic: "Taxes",            q: "W-2 forms are for:",                              opts: ["Self-employed workers", "Employees", "Investors only", "Retirees only"], ans: 1 },
  { topic: "Taxes",            q: "An HSA (Health Savings Account) is:",             opts: ["Taxable", "Triple tax-advantaged", "Only for retirees", "A type of insurance"], ans: 1 },

  // Mortgages & Housing
  { topic: "Mortgages",        q: "A typical recommended down payment is:",          opts: ["5%", "10%", "20%", "50%"], ans: 2 },
  { topic: "Mortgages",        q: "A fixed-rate mortgage means:",                    opts: ["Rate changes yearly", "Rate stays the same for the loan term", "Rate is always lowest", "No interest charged"], ans: 1 },
  { topic: "Mortgages",        q: "PMI (Private Mortgage Insurance) is required when:", opts: ["You have good credit", "Down payment is less than 20%", "You refinance", "You pay cash"], ans: 1 },
  { topic: "Mortgages",        q: "Closing costs typically range:",                  opts: ["0–1%", "2–5% of home price", "10–15%", "20%+"], ans: 1 },
  { topic: "Mortgages",        q: "Home equity is:",                                  opts: ["Your mortgage balance", "Home value minus mortgage owed", "Your down payment", "Monthly payment amount"], ans: 1 },
];

const LANE_PCT = [0.25, 0.5, 0.75];

// ── Props ──────────────────────────────────────────────────────
interface FinanceRunnerProps {
  onClose: () => void;
  onXP?: (amount: number) => void;
  topicFilter?: string | null;
}

export function FinanceRunner({ onClose, onXP, topicFilter }: FinanceRunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  const G = useRef({
    state: "idle" as "idle" | "running" | "question" | "dead",
    lane: 1, px: 0, ptx: 0,
    score: 0, lives: 3, streak: 0, bestStreak: 0, correct: 0,
    speed: 4, frame: 0, tileOff: 0,
    obs: [] as Obstacle[], coins: [] as Coin[], parts: [] as Particle[],
    lastObs: 0, lastQ: 0,
    curQ: null as Question | null,
    qUsed: new Set<number>(),
    timerHandle: 0 as ReturnType<typeof setTimeout> | 0,
    deadlineHandle: 0 as ReturnType<typeof setTimeout> | 0,
    flashHandle: 0 as ReturnType<typeof setTimeout> | 0,
    af: 0,
    touchX: 0,
    W: 0, H: 0,
  });

  const [screen, setScreen]     = useState<"start" | "playing" | "over">("start");
  const [lives, setLives]       = useState(3);
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [flash, setFlash]       = useState<{ text: string; ok: boolean } | null>(null);
  const [question, setQuestion] = useState<{ q: Question; timeLeft: number } | null>(null);
  const [optResult, setOptResult] = useState<Record<number, "ok" | "ng">>({});
  const [endStats, setEndStats] = useState<{ score: number; correct: number; best: number } | null>(null);

  const timerRef = useRef(100);

  const laneX = useCallback((l: number) => G.current.W * LANE_PCT[l], []);

  const syncHUD = useCallback(() => {
    const g = G.current;
    setLives(g.lives);
    setScore(Math.floor(g.score));
    setStreak(g.streak);
  }, []);

  const burst = useCallback((x: number, y: number, col: string, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 / n) * i;
      G.current.parts.push({ x, y, vx: Math.cos(a) * (2 + Math.random() * 2), vy: Math.sin(a) * (2 + Math.random() * 2) - 1, col, r: 4 + Math.random() * 2, life: 40 });
    }
  }, []);

  const showFlash = useCallback((text: string, ok: boolean) => {
    setFlash({ text, ok });
    clearTimeout(G.current.flashHandle as number);
    G.current.flashHandle = setTimeout(() => setFlash(null), 750) as unknown as ReturnType<typeof setTimeout>;
  }, []);

  const endGame = useCallback(() => {
    const g = G.current;
    g.state = "dead";
    cancelAnimationFrame(g.af);
    setQuestion(null);
    setEndStats({ score: Math.floor(g.score), correct: g.correct, best: g.bestStreak });
    setScreen("over");
    onXP?.(Math.floor(g.score / 10));
  }, [onXP]);

  const answer = useCallback((i: number) => {
    const g = G.current;
    if (!g.curQ) return;
    clearTimeout(g.timerHandle as number);
    clearTimeout(g.deadlineHandle as number);
    const ok = i === g.curQ.ans;
    const res: Record<number, "ok" | "ng"> = {};
    g.curQ.opts.forEach((_, j) => { if (j === g.curQ!.ans) res[j] = "ok"; else if (j === i) res[j] = "ng"; });
    setOptResult(res);

    if (ok) {
      g.streak++; g.bestStreak = Math.max(g.bestStreak, g.streak);
      g.correct++; g.score += 50 + g.streak * 10;
      burst(g.px, g.H - 110, "#22c98a", 12);
      showFlash("CORRECT!", true);
      onXP?.(20 + g.streak * 5);
    } else {
      g.lives = Math.max(0, g.lives - 1);
      g.streak = 0;
      burst(g.px, g.H - 110, "#ff4f6a", 8);
      showFlash(i === -1 ? "TOO SLOW!" : "WRONG!", false);
      if (g.lives <= 0) {
        syncHUD();
        setTimeout(() => { setQuestion(null); endGame(); }, 900);
        return;
      }
    }
    syncHUD();
    setTimeout(() => { setQuestion(null); setOptResult({}); g.state = "running"; }, 950);
  }, [burst, showFlash, endGame, syncHUD, onXP]);

  const triggerQ = useCallback(() => {
    const g = G.current;
    g.state = "question";
    cancelAnimationFrame(g.af);

    let pool = QUESTIONS.filter((_, i) => !g.qUsed.has(i));
    if (topicFilter) pool = pool.filter(q => q.topic.toLowerCase().replace(/\s/g, "") === topicFilter.toLowerCase().replace(/\s/g, ""));
    if (!pool.length) { g.qUsed.clear(); pool = topicFilter ? QUESTIONS.filter(q => q.topic.toLowerCase().replace(/\s/g, "") === topicFilter.toLowerCase().replace(/\s/g, "")) : QUESTIONS; }

    const q = pool[Math.floor(Math.random() * pool.length)];
    g.qUsed.add(QUESTIONS.indexOf(q));
    g.curQ = q;
    timerRef.current = 100;
    setQuestion({ q, timeLeft: 100 });
    setOptResult({});

    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / 12000) * 100);
      timerRef.current = pct;
      setQuestion(prev => prev ? { ...prev, timeLeft: pct } : null);
      if (pct > 0 && g.state === "question") g.timerHandle = setTimeout(tick, 50) as unknown as ReturnType<typeof setTimeout>;
    };
    g.timerHandle = setTimeout(tick, 50) as unknown as ReturnType<typeof setTimeout>;
    g.deadlineHandle = setTimeout(() => { if (g.state === "question") answer(-1); }, 12000) as unknown as ReturnType<typeof setTimeout>;

    const loop = () => { if (g.state !== "dead") { draw(); g.af = requestAnimationFrame(loop); } };
    g.af = requestAnimationFrame(loop);
  }, [topicFilter, answer]);

  // rounded rect helper
  function rr(cx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    cx.beginPath(); cx.moveTo(x + r, y);
    cx.lineTo(x + w - r, y); cx.quadraticCurveTo(x + w, y, x + w, y + r);
    cx.lineTo(x + w, y + h - r); cx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    cx.lineTo(x + r, y + h); cx.quadraticCurveTo(x, y + h, x, y + h - r);
    cx.lineTo(x, y + r); cx.quadraticCurveTo(x, y, x + r, y);
    cx.closePath(); cx.fill();
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.getContext("2d")!;
    const { W, H, tileOff, frame, px, obs, coins, parts } = G.current;

    cx.clearRect(0, 0, W, H);
    cx.fillStyle = "#09090f"; cx.fillRect(0, 0, W, H);

    const tL = W * 0.12, tR = W * 0.88;
    cx.fillStyle = "#0d0d18"; cx.fillRect(tL, 0, tR - tL, H);

    cx.strokeStyle = "rgba(255,255,255,0.03)"; cx.lineWidth = 1;
    [tL + (tR - tL) / 3, tL + (tR - tL) * 2 / 3].forEach(x => { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); });
    cx.strokeStyle = "rgba(74,158,255,0.06)";
    for (let y = (tileOff % 110) - 110; y < H; y += 110) { cx.beginPath(); cx.moveTo(tL, y); cx.lineTo(tR, y); cx.stroke(); }

    cx.strokeStyle = "rgba(74,158,255,0.18)"; cx.lineWidth = 1.5;
    [tL, tR].forEach(x => { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); });

    cx.fillStyle = "rgba(74,158,255,0.03)"; cx.fillRect(tL, H - 80, tR - tL, 80);
    cx.strokeStyle = "rgba(74,158,255,0.22)"; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(tL, H - 80); cx.lineTo(tR, H - 80); cx.stroke();

    cx.fillStyle = "#09090f"; cx.fillRect(0, 0, tL, H); cx.fillRect(tR, 0, W - tR, H);

    coins.forEach(c => {
      cx.fillStyle = "rgba(74,158,255,0.12)"; cx.beginPath(); cx.arc(c.x, c.y, 11, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = "#4a9eff"; cx.beginPath(); cx.arc(c.x, c.y, 8, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = "#fff"; cx.font = "bold 9px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText("$", c.x, c.y + 0.5);
    });

    obs.forEach(o => {
      cx.globalAlpha = o.opacity;
      if (o.isQ) {
        const g2 = Math.sin(o.pulse) * 0.15 + 0.85;
        cx.fillStyle = `rgba(155,127,244,${g2 * 0.22})`; rr(cx, o.x - 38, o.y - 28, 76, 56, 8);
        cx.fillStyle = "#9b7ff4"; rr(cx, o.x - 32, o.y - 24, 64, 48, 6);
        cx.fillStyle = "#fff"; cx.font = `bold ${Math.round(W * 0.055)}px sans-serif`; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText("?", o.x, o.y - 2);
        cx.font = `${Math.round(W * 0.02)}px sans-serif`; cx.fillStyle = "rgba(255,255,255,0.6)"; cx.fillText("QUIZ", o.x, o.y + 17);
      } else {
        cx.fillStyle = "rgba(255,79,106,0.14)"; rr(cx, o.x - 34, o.y - 26, 68, 52, 6);
        cx.fillStyle = "#ff4f6a"; rr(cx, o.x - 30, o.y - 22, 60, 44, 5);
        cx.strokeStyle = "rgba(255,255,255,0.65)"; cx.lineWidth = 2.5; cx.lineCap = "round";
        cx.beginPath(); cx.moveTo(o.x - 9, o.y - 9); cx.lineTo(o.x + 9, o.y + 9); cx.stroke();
        cx.beginPath(); cx.moveTo(o.x + 9, o.y - 9); cx.lineTo(o.x - 9, o.y + 9); cx.stroke();
      }
      cx.globalAlpha = 1;
    });

    const pY = H - 110, pf = frame * 0.25;
    cx.fillStyle = "rgba(0,0,0,0.18)"; cx.beginPath(); cx.ellipse(px, pY + 38, 16, 5, 0, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = "#4a9eff"; rr(cx, px - 10, pY - 26, 20, 30, 4);
    cx.fillStyle = "#cce4ff"; cx.beginPath(); cx.arc(px, pY - 36, 11, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = "#2d7dd2"; rr(cx, px - 9, pY + 4 + Math.sin(pf) * 5, 8, 18, 3); rr(cx, px + 1, pY + 4 + Math.sin(pf + Math.PI) * 5, 8, 18, 3);
    cx.strokeStyle = "#4a9eff"; cx.lineWidth = 4; cx.lineCap = "round";
    cx.beginPath(); cx.moveTo(px - 10, pY - 16); cx.lineTo(px - 22, pY - 5 + Math.sin(pf) * 6); cx.stroke();
    cx.beginPath(); cx.moveTo(px + 10, pY - 16); cx.lineTo(px + 22, pY - 5 + Math.sin(pf + Math.PI) * 6); cx.stroke();

    parts.forEach(p => { cx.globalAlpha = p.life / 40; cx.fillStyle = p.col; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); cx.fill(); });
    cx.globalAlpha = 1;
  }, []);

  const update = useCallback(() => {
    const g = G.current;
    g.frame++; g.speed = Math.min(11, 4 + Math.floor(g.frame / 300) * 0.4);
    g.score += g.speed * 0.13; g.tileOff = (g.tileOff + g.speed) % 110;
    g.px += (g.ptx - g.px) * 0.2;

    if (g.frame - g.lastObs > Math.max(70, 145 - Math.floor(g.frame / 250) * 7)) { spawnObs(); g.lastObs = g.frame; }
    if (g.frame - g.lastQ > 180 + Math.random() * 80) { spawnQ(); g.lastQ = g.frame; }
    if (Math.random() < 0.024) g.coins.push({ x: laneX(Math.floor(Math.random() * 3)), y: -20 });

    g.obs.forEach(o => { o.y += g.speed; o.opacity = Math.min(1, (g.H - o.y) / 200); if (o.isQ) o.pulse += 0.09; });
    g.coins.forEach(c => (c.y += g.speed * 0.88));
    g.parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.life -= 2.5; p.r = Math.max(0, p.r - 0.08); });

    const pY = g.H - 110, h0 = pY - 30, h1 = pY + 30;
    g.obs.filter(o => !o.isQ && !o.hit).forEach(o => {
      if (o.y > h0 && o.y < h1 && o.lane === g.lane) {
        o.hit = true; g.lives = Math.max(0, g.lives - 1); g.streak = 0;
        burst(o.x, pY, "#ff4f6a", 10); showFlash("CRASH!", false); syncHUD();
        if (g.lives <= 0) setTimeout(() => endGame(), 400);
      }
    });
    g.obs.filter(o => o.isQ && !o.triggered).forEach(o => {
      if (o.y > h0 && o.y < h1 && o.lane === g.lane) { o.triggered = true; triggerQ(); }
    });
    g.coins.forEach(c => {
      if (c.y > h0 && c.y < h1 && Math.abs(c.x - g.px) < 28) { g.score += 8; c.done = true; burst(c.x, pY, "#4a9eff", 5); }
    });
    g.obs = g.obs.filter(o => o.y < g.H + 80);
    g.coins = g.coins.filter(c => !c.done && c.y < g.H + 60);
    g.parts = g.parts.filter(p => p.life > 0);
    syncHUD();
  }, [burst, showFlash, endGame, triggerQ, syncHUD, laneX]);

  function spawnObs() {
    const g = G.current, l = Math.floor(Math.random() * 3);
    const lanes = Math.random() < 0.22 && g.frame > 300 ? [l, (l + 1) % 3] : [l];
    lanes.forEach(ll => g.obs.push({ lane: ll, x: laneX(ll), y: -70, isQ: false, hit: false, triggered: false, opacity: 0, pulse: 0 }));
  }
  function spawnQ() {
    const g = G.current, l = Math.floor(Math.random() * 3);
    g.obs.push({ lane: l, x: laneX(l), y: -70, isQ: true, hit: false, triggered: false, opacity: 0, pulse: 0 });
  }

  const startGame = useCallback(() => {
    const g = G.current;
    const wrap = wrapRef.current;
    if (!wrap) return;
    g.W = wrap.clientWidth; g.H = wrap.clientHeight;
    const canvas = canvasRef.current!;
    canvas.width = g.W; canvas.height = g.H;
    g.obs = []; g.coins = []; g.parts = [];
    g.lane = 1; g.px = laneX(1); g.ptx = laneX(1);
    g.score = 0; g.lives = 3; g.streak = 0; g.bestStreak = 0; g.correct = 0;
    g.speed = 4; g.frame = 0; g.tileOff = 0; g.lastObs = 0; g.lastQ = 0; g.qUsed = new Set();
    g.state = "running";
    setScreen("playing"); setLives(3); setScore(0); setStreak(0); setQuestion(null); setFlash(null); setEndStats(null);

    cancelAnimationFrame(g.af);
    const loop = () => {
      if (g.state === "running") { update(); draw(); }
      else if (g.state === "question") { draw(); }
      if (g.state !== "dead") g.af = requestAnimationFrame(loop);
    };
    g.af = requestAnimationFrame(loop);
  }, [laneX, update, draw]);

  const moveLane = useCallback((dir: number) => {
    const g = G.current;
    if (g.state !== "running") return;
    g.lane = Math.max(0, Math.min(2, g.lane + dir));
    g.ptx = laneX(g.lane);
  }, [laneX]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLane(-1);
      if (e.key === "ArrowRight") moveLane(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [moveLane]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ts = (e: TouchEvent) => { G.current.touchX = e.touches[0].clientX; };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - G.current.touchX;
      if (Math.abs(dx) < 20) return;
      moveLane(dx < 0 ? -1 : 1);
    };
    canvas.addEventListener("touchstart", ts, { passive: true });
    canvas.addEventListener("touchend", te, { passive: true });
    return () => { canvas.removeEventListener("touchstart", ts); canvas.removeEventListener("touchend", te); };
  }, [moveLane]);

  useEffect(() => {
    return () => { cancelAnimationFrame(G.current.af); clearTimeout(G.current.timerHandle as number); };
  }, []);

  const badge = endStats
    ? endStats.best >= 5 ? "Finance Genius 🏆" : endStats.best >= 3 ? "Money Smart 📈" : endStats.correct > 0 ? "Keep studying 📚" : "Hit the books 💪"
    : "";

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-50 bg-[#09090f] flex flex-col select-none"
      style={{ touchAction: "none" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {screen === "playing" && (
        <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4 pointer-events-none z-10">
          <div>
            <div className="text-[9px] tracking-[2px] uppercase text-white/40 mb-0.5">Distance</div>
            <div className="font-bold text-2xl text-white leading-none">{score}m</div>
          </div>
          <div className="flex gap-1.5 pt-3.5">
            {[0,1,2].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < lives ? "bg-blue-400" : "bg-white/10"}`} />
            ))}
          </div>
          <div className="text-right">
            <div className="text-[9px] tracking-[2px] uppercase text-white/40 mb-0.5">Streak</div>
            <div className="font-bold text-2xl text-[#00d4aa] leading-none">×{streak}</div>
          </div>
        </div>
      )}

      {screen === "playing" && !question && (
        <div className="absolute bottom-0 left-[12%] right-[12%] flex" style={{ height: "55%" }}>
          {[0,1,2].map(l => (
            <div key={l} className="flex-1 cursor-pointer" onClick={() => {
              const g = G.current; if (g.state !== "running") return;
              g.lane = l; g.ptx = laneX(l);
            }} />
          ))}
        </div>
      )}

      {flash && (
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-extrabold tracking-widest pointer-events-none z-20 animate-bounce"
          style={{ color: flash.ok ? "#22c98a" : "#ff4f6a" }}
        >
          {flash.text}
        </div>
      )}

      {question && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-[#09090f]/85">
          <div className="p-5 pb-8 bg-gradient-to-t from-[#09090f] via-[#09090f] to-[#09090f]/90 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[2px] text-red-400 uppercase font-bold">Answer!</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full transition-none" style={{ width: `${question.timeLeft}%` }} />
              </div>
              <span className="text-[10px] text-white/40 font-mono">{Math.ceil(question.timeLeft / 100 * 12)}s</span>
            </div>
            <div className="text-[10px] tracking-[2px] text-blue-400 uppercase font-bold">{question.q.topic ?? ""}</div>
            <div className="text-base font-semibold text-white leading-snug">{question.q.q}</div>
            <div className="grid grid-cols-1 gap-2 pt-1">
              {question.q.opts.map((opt, i) => (
                <button
                  key={i}
                  disabled={Object.keys(optResult).length > 0}
                  onClick={() => answer(i)}
                  className={`text-left px-4 py-3 rounded-xl text-sm leading-snug border transition-colors text-white
                    ${optResult[i] === "ok" ? "bg-green-900/30 border-green-400 text-green-200"
                    : optResult[i] === "ng" ? "bg-red-900/20 border-red-400 text-red-200"
                    : "bg-white/5 border-white/10 hover:bg-blue-900/20 hover:border-blue-400"}`}
                >
                  <span className="text-white/40 font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {screen === "start" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-[#09090f]/93 px-6">
          <div className="text-4xl font-extrabold tracking-widest text-blue-400">
            Finance Runner
          </div>
          <p className="text-sm text-white/50 text-center leading-relaxed max-w-[280px]">
            Use ← → arrows or tap lanes to dodge obstacles.<br />
            Hit <span className="text-purple-400 font-semibold">? blocks</span> to answer financial quiz questions!
          </p>
          <button
            onClick={startGame}
            className="w-full max-w-[240px] bg-blue-500 hover:bg-blue-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Run!
          </button>
          <button
            onClick={onClose}
            className="w-full max-w-[240px] border border-blue-500 text-blue-400 hover:bg-blue-500/10 font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            ← Back
          </button>
        </div>
      )}

      {screen === "over" && endStats && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-[#09090f]/93 px-6">
          <div className="text-4xl font-extrabold tracking-widest text-red-400">
            Wiped Out
          </div>
          <div className="flex gap-6">
            {[
              { v: endStats.score + "m", l: "Distance" },
              { v: endStats.correct,     l: "Correct"  },
              { v: endStats.best,        l: "Streak"   },
            ].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-3xl font-bold text-blue-400">{s.v}</div>
                <div className="text-[9px] uppercase tracking-widest text-white/40 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="text-blue-400 text-sm">{badge}</div>
          <button
            onClick={startGame}
            className="w-full max-w-[240px] bg-blue-500 hover:bg-blue-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Run Again
          </button>
          <button
            onClick={onClose}
            className="w-full max-w-[240px] border border-blue-500 text-blue-400 hover:bg-blue-500/10 font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            ← Hub
          </button>
        </div>
      )}
    </div>
  );
}
