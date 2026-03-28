import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import HubPage from "@/pages/HubPage";
import DashboardPage from "@/pages/DashboardPage";
import LearnPage from "@/pages/LearnPage";
import LibraryPage from "@/pages/LibraryPage";
import AssistantPage from "@/pages/AssistantPage";
import SettingsPage from "@/pages/SettingsPage";
import AuthPage from "@/pages/AuthPage";
import { OnboardingQuiz, type PersonaTier } from "@/components/onboarding/OnboardingQuiz";
import GuidedTour, { shouldShowTour } from "@/components/GuidedTour";
import { supabase } from "@/integrations/supabase/client";

/** Pre-seed localStorage for the demo account so Dashboard & Hub show realistic data.
 *  We re-seed every login (no "already seeded" guard) so the demo always starts fresh. */
function seedDemoIfNeeded(sess: any) {
  const email = sess?.user?.email?.toLowerCase();
  if (email !== "demo@sonofinance.app") return;

  localStorage.setItem("sono-user-name", "Jordan");
  localStorage.setItem("sono-user-email", "demo@sonofinance.app");
  // Clear persona so onboarding quiz runs, but keep financial data pre-loaded
  localStorage.removeItem("sono-persona");
  localStorage.setItem("sono-bank-connected", "true");

  const demoBudgets = [
    { icon: "home", name: "Housing", spent: 1350, budget: 1400, color: "primary" },
    { icon: "restaurant", name: "Food & Dining", spent: 520, budget: 550, color: "secondary" },
    { icon: "directions_car", name: "Transportation", spent: 285, budget: 300, color: "amber" },
    { icon: "bolt", name: "Utilities", spent: 142, budget: 160, color: "primary" },
    { icon: "movie", name: "Entertainment", spent: 165, budget: 150, color: "purple" },
    { icon: "fitness_center", name: "Health & Fitness", spent: 68, budget: 80, color: "secondary" },
    { icon: "subscriptions", name: "Subscriptions", spent: 54, budget: 60, color: "amber" },
    { icon: "spa", name: "Personal Care", spent: 38, budget: 50, color: "primary" },
  ];
  localStorage.setItem("dash_overview", JSON.stringify({
    balance: 4832, savingsGoal: 10000, savingsCurrent: 2400, budgets: demoBudgets,
  }));

  const history: { balance: number; ts: number }[] = [];
  const now = Date.now();
  for (let i = 90; i >= 0; i--) {
    history.push({ balance: Math.round(3200 + (90 - i) * 18 + Math.sin(i * 0.5) * 200), ts: now - i * 86400000 });
  }
  localStorage.setItem("sono-balance-history", JSON.stringify(history));

  localStorage.setItem("sono-completed-lessons", JSON.stringify([
    "budgeting-1", "budgeting-2", "budgeting-3", "banking-1", "banking-2",
    "credit-1", "credit-2", "credit-3", "investing-1", "investing-2", "taxes-1", "taxes-2",
  ]));

  localStorage.setItem("sono-avatar", JSON.stringify({
    skin: "#C68642", hair: "short", hairColor: "#1A1A2E", eyes: "confident",
    mouth: "smile", accessory: "none", bg: "#6366F1",
  }));

  // Ensure tour will show again for demo
  localStorage.removeItem("sono-tour-completed");
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | null>(null);
  const [persona, setPersona] = useState<PersonaTier | null>(() => {
    const saved = localStorage.getItem("sono-persona");
    return saved as PersonaTier | null;
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess) {
        seedDemoIfNeeded(sess);
        // Sync persona state after potential demo seed clearing
        setPersona(localStorage.getItem("sono-persona") as PersonaTier | null);
      }
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) {
        seedDemoIfNeeded(sess);
        setPersona(localStorage.getItem("sono-persona") as PersonaTier | null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("sono-theme");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const handleOnboardingComplete = (tier: PersonaTier) => {
    localStorage.setItem("sono-persona", tier);
    setPersona(tier);
  };

  // Trigger tour after onboarding completes for first-time users
  useEffect(() => {
    if (persona && session && shouldShowTour()) {
      const t = setTimeout(() => setShowTour(true), 800);
      return () => clearTimeout(t);
    }
  }, [persona, session]);

  const handleAiDiscuss = (prompt: string) => {
    setAiInitialPrompt(prompt);
    setActiveTab("assistant");
  };

  if (!authChecked) return null;

  if (!session) {
    return <AuthPage onAuth={() => {}} />;
  }

  if (!persona) {
    return <OnboardingQuiz onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-surface-lowest">
      <TopBar streak={12} />

      <main className="pt-16 pb-24 px-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="py-2"
          >
            {activeTab === "home" && (
              <HubPage
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === "dashboard" && <DashboardPage onAiDiscuss={handleAiDiscuss} />}
            {activeTab === "learn" && <LearnPage persona={persona} />}
            {activeTab === "library" && <LibraryPage />}
            {activeTab === "settings" && <SettingsPage />}
            {activeTab === "assistant" && (
              <AssistantPage
                initialPrompt={aiInitialPrompt}
                onPromptConsumed={() => setAiInitialPrompt(null)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Guided Tour Overlay */}
      {showTour && <GuidedTour onComplete={() => setShowTour(false)} onTabChange={setActiveTab} />}
    </div>
  );
};

export default Index;
