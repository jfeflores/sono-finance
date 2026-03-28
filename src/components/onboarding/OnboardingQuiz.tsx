import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type PersonaTier = "vibe-starter" | "builder" | "strategist";

interface PersonaResult {
  tier: PersonaTier;
  label: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

const PERSONA_MAP: Record<PersonaTier, PersonaResult> = {
  "vibe-starter": {
    tier: "vibe-starter",
    label: "The Vibe Starter",
    description: "You're just getting started on your financial journey — and that's awesome. We'll walk you through everything from the ground up.",
    icon: "🌱",
    color: "hsl(163 80% 50%)",
    gradient: "from-[hsl(163,80%,30%)] via-[hsl(190,70%,25%)] to-[hsl(216,100%,30%)]",
  },
  builder: {
    tier: "builder",
    label: "The Builder",
    description: "You've got the basics down and you're ready to level up. We'll start you at Banking with full access to earlier lessons.",
    icon: "🔨",
    color: "hsl(216 100% 65%)",
    gradient: "from-[hsl(216,100%,30%)] via-[hsl(240,70%,30%)] to-[hsl(263,85%,35%)]",
  },
  strategist: {
    tier: "strategist",
    label: "The Strategist",
    description: "You know your stuff. We're dropping you into Investing — but every lesson is unlocked if you want a refresher.",
    icon: "🧠",
    color: "hsl(263 85% 70%)",
    gradient: "from-[hsl(263,85%,30%)] via-[hsl(300,70%,25%)] to-[hsl(36,90%,30%)]",
  },
};

interface Question {
  id: string;
  question: string;
  options: { label: string; points: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    question: "When payday hits, what's your first move?",
    options: [
      { label: "Treat myself — I earned it! 🎉", points: 0 },
      { label: "Pay some bills, wing the rest", points: 1 },
      { label: "Move money into savings first, then spend", points: 2 },
      { label: "Everything's already auto-split into accounts", points: 3 },
    ],
  },
  {
    id: "q2",
    question: "Be honest — do you know how much you spent last month?",
    options: [
      { label: "Nope, and I'm a little scared to check 😅", points: 0 },
      { label: "Roughly, but I couldn't tell you the exact number", points: 1 },
      { label: "Yeah, I check my spending pretty regularly", points: 2 },
      { label: "Down to the cent — I've got a system", points: 3 },
    ],
  },
  {
    id: "q3",
    question: "If your car broke down tomorrow, how would you handle it?",
    options: [
      { label: "Panic. Probably put it on a credit card", points: 0 },
      { label: "I'd scrape together some cash but it'd hurt", points: 1 },
      { label: "I've got an emergency fund for this", points: 2 },
      { label: "Covered — and I know exactly which account to pull from", points: 3 },
    ],
  },
  {
    id: "q4",
    question: "What does \"APR\" mean to you?",
    options: [
      { label: "Honestly? No idea 🤷", points: 0 },
      { label: "Something about interest… I think?", points: 1 },
      { label: "Annual Percentage Rate — I compare them when borrowing", points: 2 },
      { label: "I factor APR vs APY into every financial decision", points: 3 },
    ],
  },
  {
    id: "q5",
    question: "Have you ever opened your credit report?",
    options: [
      { label: "Wait, you can do that?", points: 0 },
      { label: "I've seen my score on an app but not the full report", points: 1 },
      { label: "Yeah, I check it once or twice a year", points: 2 },
      { label: "Regularly — I've disputed errors before too", points: 3 },
    ],
  },
  {
    id: "q6",
    question: "How do you feel about investing?",
    options: [
      { label: "Sounds intimidating — isn't that for rich people?", points: 0 },
      { label: "Curious but haven't taken the leap yet", points: 1 },
      { label: "I've got a retirement account going", points: 2 },
      { label: "I actively manage a portfolio and love it", points: 3 },
    ],
  },
  {
    id: "q7",
    question: "A friend asks you to explain taxes. What do you say?",
    options: [
      { label: "\"I just let TurboTax handle it\" 😂", points: 0 },
      { label: "I know the basics — brackets, deductions, that stuff", points: 1 },
      { label: "I could explain the difference between deductions and credits", points: 2 },
      { label: "I optimize my tax strategy across multiple account types", points: 3 },
    ],
  },
  {
    id: "q8",
    question: "When you hear \"compound interest,\" you think…",
    options: [
      { label: "Sounds like a math problem I'd skip", points: 0 },
      { label: "I know it's important but couldn't explain it", points: 1 },
      { label: "It's why I started saving early!", points: 2 },
      { label: "I calculate it when comparing savings accounts and investments", points: 3 },
    ],
  },
];

function getTier(score: number): PersonaTier {
  if (score <= 8) return "vibe-starter";
  if (score <= 16) return "builder";
  return "strategist";
}

type OnboardingStep = "theme" | "goals" | "quiz" | "result" | "bank";

const GOAL_OPTIONS = [
  { label: "Build an emergency fund 🛡️", value: "emergency-fund" },
  { label: "Pay off debt 💳", value: "pay-off-debt" },
  { label: "Save for a home 🏠", value: "save-home" },
  { label: "Start investing 📈", value: "start-investing" },
  { label: "Build generational wealth 🌳", value: "generational-wealth" },
  { label: "Retire early ☀️", value: "retire-early" },
  { label: "Start a business 🚀", value: "start-business" },
  { label: "Save for education 📚", value: "education" },
];

interface Props {
  onComplete: (tier: PersonaTier) => void;
}

export function OnboardingQuiz({ onComplete }: Props) {
  const [step, setStep] = useState<OnboardingStep>("theme");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [resultTier, setResultTier] = useState<PersonaTier | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showRevealPhase, setShowRevealPhase] = useState(0); // 0=analyzing, 1=reveal, 2=details

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const applyTheme = (t: "dark" | "light") => {
    setTheme(t);
    if (t === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("sono-theme", t);
  };

  const handleAnswer = (points: number) => {
    const newAnswers = [...answers, points];
    setAnswers(newAnswers);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const total = newAnswers.reduce((a, b) => a + b, 0);
      const tier = getTier(total);
      setResultTier(tier);
      setShowRevealPhase(0);
      setStep("result");
      // Animate reveal phases
      setTimeout(() => setShowRevealPhase(1), 2000);
      setTimeout(() => setShowRevealPhase(2), 3500);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-500">
      <AnimatePresence mode="wait">

        {/* ── STEP 1: THEME SELECTION ── */}
        {step === "theme" && (
          <motion.div
            key="theme"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full text-center space-y-8"
          >
            <div className="space-y-2">
              <h1 className={`text-3xl font-extrabold text-foreground tracking-tight`}>
                Choose your vibe
              </h1>
              <p className={`text-sm text-muted-foreground`}>
                Pick a theme that feels right. You can change it later.
              </p>
            </div>

            <div className="flex justify-center gap-8">
              <button onClick={() => applyTheme("light")} className="flex flex-col items-center gap-3 group">
                <div className={`w-28 h-28 rounded-2xl border-[3px] transition-all duration-300 shadow-lg bg-white
                  ${theme === "light" ? "border-primary scale-105 shadow-[0_0_20px_hsl(var(--primary)/0.3)]" : "border-border group-hover:border-muted-foreground/30"}
                `} />
                <span className={`text-sm font-semibold ${theme === "light" ? "text-primary" : "text-foreground"}`}>Light mode</span>
              </button>
              <button onClick={() => applyTheme("dark")} className="flex flex-col items-center gap-3 group">
                <div className={`w-28 h-28 rounded-2xl border-[3px] transition-all duration-300 shadow-lg bg-surface
                  ${theme === "dark" ? "border-primary scale-105 shadow-[0_0_20px_hsl(var(--primary)/0.3)]" : "border-border group-hover:border-muted-foreground/30"}
                `} />
                <span className={`text-sm font-semibold ${theme === "dark" ? "text-primary" : "text-foreground"}`}>Dark mode</span>
              </button>
            </div>

            <button
              onClick={() => setStep("goals")}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* ── BANK CONNECTION ── */}
        {step === "bank" && (
          <motion.div
            key="bank"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full text-center space-y-6"
          >
            <div className="text-5xl mb-2">🏦</div>
            <h1 className={`text-3xl font-extrabold text-foreground tracking-tight`}>One more thing…</h1>
            <p className={`text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto`}>
              Connecting your bank unlocks <span className="font-semibold text-primary">the full experience</span> — real-time AI insights, automatic expense tracking, and personalized guidance.
            </p>

            <div className={`glass-card border rounded-2xl p-5 text-left space-y-3`}>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">🔒</span>
                <div>
                  <p className={`text-sm font-semibold text-foreground`}>Bank-grade security</p>
                  <p className={`text-xs text-muted-foreground`}>Your data is encrypted and never shared</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">🤖</span>
                <div>
                  <p className={`text-sm font-semibold text-foreground`}>Smarter AI insights</p>
                  <p className={`text-xs text-muted-foreground`}>Get personalized advice based on real spending</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">📊</span>
                <div>
                  <p className={`text-sm font-semibold text-foreground`}>Automatic tracking</p>
                  <p className={`text-xs text-muted-foreground`}>No more manual entry — it all syncs</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { localStorage.setItem("sono-bank-connected", "true"); if (resultTier) onComplete(resultTier); }}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]"
              >
                Connect Bank Account
              </button>
              <button
                onClick={() => { localStorage.setItem("sono-bank-connected", "false"); if (resultTier) onComplete(resultTier); }}
                className={`w-full max-w-[280px] mx-auto text-muted-foreground font-medium py-3 text-sm hover:opacity-80 transition-all`}
              >
                Skip for now — I'll explore first
              </button>
            </div>
          </motion.div>
        )}


        {/* ── GOALS STEP ── */}
        {step === "goals" && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className={`text-3xl font-extrabold text-foreground tracking-tight`}>
                What are your goals?
              </h1>
              <p className={`text-sm text-muted-foreground`}>
                Select all that apply — this helps us personalize your experience.
              </p>
            </div>

            <div className="space-y-2.5">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.value);
                return (
                  <button
                    key={goal.value}
                    onClick={() => {
                      setSelectedGoals(prev =>
                        isSelected ? prev.filter(g => g !== goal.value) : [...prev, goal.value]
                      );
                    }}
                    className={`w-full text-left rounded-xl p-4 border transition-all active:scale-[0.98] ${
                      isSelected
                        ? "bg-primary/15 border-primary"
                        : "glass-card"
                    } hover:opacity-80`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm text-foreground`}>{goal.label}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                localStorage.setItem("sono-goals", JSON.stringify(selectedGoals));
                setStep("quiz");
              }}
              disabled={selectedGoals.length === 0}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* ── QUIZ ── */}
        {step === "quiz" && (
          <motion.div
            key={`q-${currentQ}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="max-w-md w-full space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-surface-high rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }}
                  animate={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className={`text-xs text-muted-foreground font-mono`}>
                {currentQ + 1}/{QUESTIONS.length}
              </span>
            </div>

            <h2 className={`text-xl font-bold text-foreground leading-snug`}>
              {QUESTIONS[currentQ].question}
            </h2>

            <div className="space-y-2.5">
              {QUESTIONS[currentQ].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt.points)}
                  className={`w-full text-left rounded-xl p-4 border transition-all active:scale-[0.98] glass-card hover:opacity-80`}
                >
                  <span className={`text-sm text-foreground`}>{opt.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── FLASHY RESULT REVEAL ── */}
        {step === "result" && resultTier && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md w-full text-center relative overflow-hidden"
          >
            {/* Background gradient burst */}
            <motion.div
              className={`absolute inset-0 -m-20 bg-gradient-to-br ${PERSONA_MAP[resultTier].gradient} rounded-full blur-3xl`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2.5, opacity: 0.3 }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
            
            {/* Particle sparkles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: PERSONA_MAP[resultTier].color,
                  left: `${15 + (i * 7) % 70}%`,
                  top: `${10 + (i * 11) % 60}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.5, 0],
                  opacity: [0, 0.8, 0],
                }}
                transition={{ 
                  duration: 2,
                  delay: 0.5 + i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
            ))}

            <div className="relative z-10 space-y-6 py-8">
              {/* Phase 0: Analyzing */}
              <AnimatePresence mode="wait">
                {showRevealPhase === 0 && (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="space-y-6"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 mx-auto rounded-full border-4 border-transparent border-t-primary"
                    />
                    <p className={`text-lg font-bold text-foreground`}>Analyzing your profile...</p>
                    <div className="flex justify-center gap-1">
                      {["💰", "📊", "🎯", "🧠"].map((e, i) => (
                        <motion.span
                          key={i}
                          className="text-2xl"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.3 }}
                        >
                          {e}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Phase 1: Big reveal */}
                {showRevealPhase === 1 && (
                  <motion.div
                    key="reveal"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="space-y-4"
                  >
                    <motion.div
                      className="text-8xl"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    >
                      {PERSONA_MAP[resultTier].icon}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-primary text-[10px] font-bold tracking-[0.3em] uppercase">
                        Your Persona
                      </span>
                      <h2 className={`text-4xl font-extrabold text-foreground mt-2 tracking-tight`}>
                        {PERSONA_MAP[resultTier].label}
                      </h2>
                    </motion.div>
                  </motion.div>
                )}

                {/* Phase 2: Full details */}
                {showRevealPhase >= 2 && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-7xl"
                    >
                      {PERSONA_MAP[resultTier].icon}
                    </motion.div>
                    
                    <div>
                      <span className="text-primary text-[10px] font-bold tracking-[0.3em] uppercase">
                        Your Persona
                      </span>
                      <h2 className={`text-3xl font-extrabold text-foreground mt-1 tracking-tight`}>
                        {PERSONA_MAP[resultTier].label}
                      </h2>
                    </div>

                    <p className={`text-sm leading-relaxed text-muted-foreground max-w-xs mx-auto`}>
                      {PERSONA_MAP[resultTier].description}
                    </p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className={`glass-card border rounded-2xl p-5 text-left space-y-3 mx-auto max-w-sm`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                        <p className={`text-xs font-bold text-muted-foreground uppercase tracking-wider`}>Your starting point</p>
                      </div>
                      <p className={`text-sm text-foreground font-medium`}>
                        {resultTier === "vibe-starter" && "Money Basics — Chapter 1"}
                        {resultTier === "builder" && "Banking — with earlier lessons unlocked"}
                        {resultTier === "strategist" && "Investing — all previous lessons open"}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {resultTier === "vibe-starter" && ["Budgeting 101", "Saving habits", "Cash flow"].map(t => (
                          <span key={t} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">{t}</span>
                        ))}
                        {resultTier === "builder" && ["Banking", "Credit scores", "Debt strategy"].map(t => (
                          <span key={t} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">{t}</span>
                        ))}
                        {resultTier === "strategist" && ["Investing", "Tax strategy", "Retirement"].map(t => (
                          <span key={t} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">{t}</span>
                        ))}
                      </div>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      onClick={() => setStep("bank")}
                      className={`w-full max-w-[280px] mx-auto bg-gradient-to-r ${PERSONA_MAP[resultTier].gradient} text-white font-bold py-4 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98] shadow-lg`}
                    >
                      Let's Go! 🚀
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
