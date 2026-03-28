import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LessonView from "@/components/learning/LessonView";
import { FinanceRunner } from "@/components/games/FinanceRunner";
import type { PersonaTier } from "@/components/onboarding/OnboardingQuiz";
import { getStoredAvatar, AvatarPreview, type AvatarConfig } from "@/components/learn/AvatarCreator";
import LeagueBanner from "@/components/learn/LeagueBanner";
import BadgeDisplay, { computeXp } from "@/components/learn/BadgeDisplay";

import LearningPath from "@/components/learn/LearningPath";

// Static course definitions (no status — derived at runtime)
interface ChapterDef {
  id: string;
  title: string;
  subtitle: string;
}
interface CourseDef {
  id: string;
  title: string;
  icon: string;
  chapters: ChapterDef[];
}

const COURSES: CourseDef[] = [
  {
    id: "money-basics",
    title: "Money Basics",
    icon: "💰",
    chapters: [
      { id: "what-is-money", title: "What is money?", subtitle: "History & purpose" },
      { id: "income-vs-expenses", title: "Income vs Expenses", subtitle: "Cash flow basics" },
      { id: "needs-vs-wants", title: "Needs vs Wants", subtitle: "Spending priorities" },
      { id: "saving-basics", title: "Why save money?", subtitle: "Building habits" },
      { id: "financial-goals", title: "Setting financial goals", subtitle: "SMART goals" },
    ],
  },
  {
    id: "budgeting",
    title: "Budgeting",
    icon: "📋",
    chapters: [
      { id: "what-is-budget", title: "What is a budget?", subtitle: "Planning basics" },
      { id: "50-30-20", title: "The 50/30/20 Rule", subtitle: "Framework" },
      { id: "zero-based", title: "Zero-Based Budgeting", subtitle: "Advanced method" },
      { id: "tracking-expenses", title: "Tracking expenses", subtitle: "Tools & habits" },
      { id: "budget-adjustments", title: "Adjusting your budget", subtitle: "Review & iterate" },
    ],
  },
  {
    id: "banking",
    title: "Banking",
    icon: "🏦",
    chapters: [
      { id: "checking-savings", title: "Checking vs Savings", subtitle: "Account types" },
      { id: "bank-fees", title: "Avoiding bank fees", subtitle: "Save money" },
      { id: "hysa", title: "High-yield savings accounts", subtitle: "Earn more" },
      { id: "online-banking", title: "Online & mobile banking", subtitle: "Digital tools" },
      { id: "emergency-fund", title: "Emergency fund setup", subtitle: "3–6 months rule" },
      { id: "direct-deposit", title: "Direct deposit & automation", subtitle: "Pay yourself first" },
    ],
  },
  {
    id: "interest-loans",
    title: "Interest & Loans",
    icon: "📈",
    chapters: [
      { id: "what-is-interest", title: "What is interest?", subtitle: "Intro" },
      { id: "simple-vs-compound", title: "Simple vs Compound", subtitle: "Interactive" },
      { id: "apr-vs-apy", title: "APR vs APY", subtitle: "Key differences" },
      { id: "credit-card-traps", title: "Credit card traps", subtitle: "Avoid pitfalls" },
      { id: "loan-types", title: "Types of loans", subtitle: "Secured vs unsecured" },
      { id: "debt-payoff", title: "Debt payoff strategies", subtitle: "Avalanche & snowball" },
    ],
  },
  {
    id: "credit-scores",
    title: "Credit & Scores",
    icon: "💳",
    chapters: [
      { id: "what-is-credit-score", title: "What is a credit score?", subtitle: "FICO basics" },
      { id: "credit-factors", title: "5 factors of your score", subtitle: "Deep dive" },
      { id: "credit-utilisation", title: "Credit utilisation", subtitle: "The 30% rule" },
      { id: "building-credit", title: "Building credit from zero", subtitle: "Starter strategies" },
      { id: "credit-reports", title: "Reading your credit report", subtitle: "Spot errors" },
    ],
  },
  {
    id: "investing",
    title: "Investing",
    icon: "📊",
    chapters: [
      { id: "why-invest", title: "Why invest?", subtitle: "Beat inflation" },
      { id: "stocks-bonds", title: "Stocks vs Bonds", subtitle: "Core assets" },
      { id: "index-funds-etfs", title: "Index Funds & ETFs", subtitle: "Passive investing" },
      { id: "diversification", title: "Diversification", subtitle: "Spread your risk" },
      { id: "compound-growth", title: "Compound growth", subtitle: "Time is your asset" },
      { id: "risk-tolerance", title: "Risk tolerance", subtitle: "Know yourself" },
      { id: "brokerage-accounts", title: "Opening a brokerage", subtitle: "Getting started" },
    ],
  },
  {
    id: "retirement",
    title: "Retirement",
    icon: "🏖️",
    chapters: [
      { id: "401k-basics", title: "401(k) basics", subtitle: "Employer plans" },
      { id: "roth-vs-traditional", title: "Roth vs Traditional IRA", subtitle: "Tax strategies" },
      { id: "employer-match", title: "Employer match = free money", subtitle: "Don't leave it" },
      { id: "target-date-funds", title: "Target-date funds", subtitle: "Set & forget" },
      { id: "early-start", title: "The power of starting early", subtitle: "Compounding time" },
    ],
  },
  {
    id: "taxes",
    title: "Taxes",
    icon: "🧾",
    chapters: [
      { id: "tax-brackets", title: "Tax brackets explained", subtitle: "Progressive system" },
      { id: "deductions-credits", title: "Deductions vs Credits", subtitle: "Save on taxes" },
      { id: "capital-gains", title: "Capital gains tax", subtitle: "Short vs long term" },
      { id: "tax-advantaged", title: "Tax-advantaged accounts", subtitle: "401k, IRA, HSA" },
      { id: "filing-basics", title: "Filing your taxes", subtitle: "W-2, 1099, forms" },
    ],
  },
  {
    id: "mortgages",
    title: "Mortgages & Housing",
    icon: "🏠",
    chapters: [
      { id: "renting-vs-buying", title: "Renting vs Buying", subtitle: "The big decision" },
      { id: "mortgage-types", title: "Types of mortgages", subtitle: "Fixed vs adjustable" },
      { id: "down-payments", title: "Down payments", subtitle: "20% and alternatives" },
      { id: "closing-costs", title: "Closing costs", subtitle: "Hidden expenses" },
      { id: "home-equity", title: "Building home equity", subtitle: "Wealth through ownership" },
    ],
  },
];

// Build initial completed set based on persona tier
function getInitialCompleted(persona: PersonaTier): Set<string> {
  const completed = new Set<string>();
  // Course order: money-basics, budgeting, banking, interest-loans, credit-scores, investing, retirement, taxes, mortgages
  const courseOrder = COURSES.map(c => c.chapters.map(ch => ch.id));

  if (persona === "vibe-starter") {
    // Start from the very beginning — nothing completed
    return completed;
  }

  if (persona === "builder") {
    // Complete Money Basics + Budgeting (courses 0-1), start at Banking (course 2)
    for (let c = 0; c < 2; c++) {
      courseOrder[c].forEach(id => completed.add(id));
    }
    return completed;
  }

  if (persona === "strategist") {
    // Complete everything before Investing (courses 0-5: money-basics, budgeting, banking, interest-loans, credit-scores)
    const investingIndex = COURSES.findIndex(c => c.id === "investing");
    for (let c = 0; c < investingIndex; c++) {
      courseOrder[c].forEach(id => completed.add(id));
    }
    return completed;
  }

  return completed;
}

type ChapterStatus = "done" | "active" | "locked";
type CourseStatus = "done" | "active" | "locked";

function deriveStatuses(completed: Set<string>) {
  let foundActive = false;
  return COURSES.map(course => {
    const chapterStatuses: ChapterStatus[] = [];
    let allDone = true;
    let firstIncomplete = -1;

    course.chapters.forEach((ch, i) => {
      if (completed.has(ch.id)) {
        chapterStatuses.push("done");
      } else {
        allDone = false;
        if (firstIncomplete === -1) firstIncomplete = i;
        chapterStatuses.push("locked"); // placeholder
      }
    });

    let courseStatus: CourseStatus;
    if (allDone) {
      courseStatus = "done";
    } else if (!foundActive) {
      courseStatus = "active";
      foundActive = true;
      // Mark the first incomplete chapter as active
      if (firstIncomplete !== -1) {
        chapterStatuses[firstIncomplete] = "active";
      }
    } else {
      courseStatus = "locked";
    }

    const doneCount = chapterStatuses.filter(s => s === "done").length;
    const progress = Math.round((doneCount / course.chapters.length) * 100);

    return {
      ...course,
      lessons: course.chapters.length,
      status: courseStatus,
      progress,
      chapters: course.chapters.map((ch, i) => ({
        ...ch,
        status: chapterStatuses[i],
      })),
    };
  });
}

interface LearnPageProps {
  persona: PersonaTier;
}

type LearnTab = "path" | "leaderboard" | "runner";

const LearnPage = ({ persona }: LearnPageProps) => {
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [showRunner, setShowRunner] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
    // Merge persona-initial completions with localStorage completions
    const initial = getInitialCompleted(persona);
    try {
      const stored: string[] = JSON.parse(localStorage.getItem("sono-completed-lessons") || "[]");
      stored.forEach(id => initial.add(id));
    } catch {}
    // Persist the merged set so TopBar/HubPage see the same XP
    localStorage.setItem("sono-completed-lessons", JSON.stringify([...initial]));
    return initial;
  });
  
  const [avatar, setAvatar] = useState<AvatarConfig>(getStoredAvatar);
  
  const [learnTab, setLearnTab] = useState<LearnTab>("path");

  const courses = useMemo(() => deriveStatuses(completedLessons), [completedLessons]);
  const userXp = computeXp(completedLessons.size);

  const handleLessonComplete = useCallback((lessonId: string) => {
    setCompletedLessons(prev => {
      const next = new Set(prev);
      next.add(lessonId);
      // Sync to localStorage so XP is consistent across all pages
      localStorage.setItem("sono-completed-lessons", JSON.stringify([...next]));
      return next;
    });
  }, []);

  if (showRunner) {
    return <FinanceRunner onClose={() => setShowRunner(false)} />;
  }
  if (activeLesson) {
    return (
      <LessonView
        lessonId={activeLesson}
        onBack={() => setActiveLesson(null)}
        onComplete={() => {
          handleLessonComplete(activeLesson);
          setActiveLesson(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Segmented Control */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-surface-high/60 rounded-xl border border-border backdrop-blur-md">
          {([
            { id: "path" as LearnTab, label: "Learning Path" },
            { id: "runner" as LearnTab, label: "Runner" },
            { id: "leaderboard" as LearnTab, label: "Leaderboard" },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setLearnTab(t.id)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                learnTab === t.id ? "bg-surface-highest text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={learnTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {learnTab === "runner" ? (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6 text-center space-y-5"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-4xl mx-auto">
                  🏃
                </div>
                <div>
                  <h3 className="text-foreground font-extrabold text-xl">Finance Runner</h3>
                  <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                    Dodge obstacles and answer financial quiz questions to earn points!
                  </p>
                </div>
                <button
                  onClick={() => setShowRunner(true)}
                  className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
                >
                  Start Playing
                </button>
              </motion.div>
            </div>
          ) : learnTab === "leaderboard" ? (
            <>
              <LeagueBanner
                avatar={avatar}
                userXp={userXp}
                userName="You"
              />
              <BadgeDisplay completedCount={completedLessons.size} />
            </>
          ) : (
            <>
              <LearningPath
                courses={courses}
                onStartLesson={(id) => setActiveLesson(id)}
                persona={persona}
                completedLessons={Array.from(completedLessons)}
                onGoToLesson={(id) => setActiveLesson(id)}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LearnPage;
