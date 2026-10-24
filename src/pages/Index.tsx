import { accountLocalStorage } from "@/lib/privacy";
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
import type { Session } from "@supabase/supabase-js";
import { prepareAccountData } from "@/lib/privacy";
import { clearPremiumCache } from "@/lib/usageLimits";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | null>(null);
  const [persona, setPersona] = useState<PersonaTier | null>(() => {
    const saved = accountLocalStorage.getItem("sono-persona");
    return saved as PersonaTier | null;
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionGeneration, setSessionGeneration] = useState(0);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    let authEventSeen = false;
    let currentUserId: string | null = null;
    let disposed = false;
    const acceptSession = (sess: Session | null) => {
      if (disposed) return;
      const nextUserId = sess?.user.id ?? null;
      prepareAccountData(nextUserId);
      if (nextUserId !== currentUserId) {
        clearPremiumCache();
        currentUserId = nextUserId;
        setSessionGeneration(generation => generation + 1);
        setAiInitialPrompt(null);
        setActiveTab("home");
        setShowTour(false);
      }
      setSession(sess);
      setPersona(accountLocalStorage.getItem("sono-persona") as PersonaTier | null);
      setAuthChecked(true);
    };
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!authEventSeen) acceptSession(sess);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      authEventSeen = true;
      acceptSession(sess);
    });

    return () => { disposed = true; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const savedTheme = accountLocalStorage.getItem("sono-theme");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const handleOnboardingComplete = (tier: PersonaTier) => {
    accountLocalStorage.setItem("sono-persona", tier);
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
    return <OnboardingQuiz key={`${session.user.id}:${sessionGeneration}`} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div key={`${session.user.id}:${sessionGeneration}`} className="min-h-screen bg-surface-lowest">
      <TopBar streak={12} />

      <main className="pt-16 pb-24 px-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${session.user.id}-${activeTab}`}
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
                key={`${session.user.id}:${sessionGeneration}`}
                accountId={session.user.id}
                initialPrompt={aiInitialPrompt}
                onPromptConsumed={() => setAiInitialPrompt(current => current === aiInitialPrompt ? null : current)}
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
