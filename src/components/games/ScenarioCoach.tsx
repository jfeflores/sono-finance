import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { canUseFeature, recordUsage, getRemainingUses, getLimit, isPremium } from "@/lib/usageLimits";
import { supabase } from "@/integrations/supabase/client";
import type { PersonaTier } from "@/components/onboarding/OnboardingQuiz";

interface Choice {
  id: string;
  text: string;
}

interface LessonRec {
  id: string;
  title: string;
  reason: string;
}

interface StoredQuestion {
  type: "question";
  scenario: string;
  choices: Choice[];
  topic: string;
  correctAnswer: string;
  explanation: string;
  lessonRecs: LessonRec[];
  answered?: boolean;
  chosenAnswer?: string;
  isGood?: boolean;
}

interface ScenarioCache {
  date: string; // YYYY-MM-DD
  questions: StoredQuestion[];
  currentIndex: number;
  score: number;
  totalAnswered: number;
}

const CACHE_KEY = "sono-scenario-cache";

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadCache(): ScenarioCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as ScenarioCache;
    if (cache.date !== getTodayStr()) return null; // expired
    return cache;
  } catch {
    return null;
  }
}

function saveCache(cache: ScenarioCache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

interface ScenarioCoachProps {
  persona: PersonaTier;
  completedLessons: string[];
  onGoToLesson: (lessonId: string) => void;
}

export default function ScenarioCoach({ persona, completedLessons, onGoToLesson }: ScenarioCoachProps) {
  const [cache, setCache] = useState<ScenarioCache | null>(loadCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentQuestion = cache?.questions[cache.currentIndex] ?? null;

  // If we remount and the current question was already answered, restore evaluation view
  const [showEvaluation, setShowEvaluation] = useState(() => !!currentQuestion?.answered);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(() => currentQuestion?.chosenAnswer ?? null);

  // Also handle cache changes at runtime (e.g. after fetching new batch resets index)
  useEffect(() => {
    const q = cache?.questions[cache?.currentIndex ?? 0] ?? null;
    if (q?.answered) {
      setShowEvaluation(true);
      setSelectedChoice(q.chosenAnswer ?? null);
    }
  }, [cache?.currentIndex]);
  const allAnswered = cache ? cache.questions.every(q => q.answered) : false;
  const score = cache?.score ?? 0;
  const totalAnswered = cache?.totalAnswered ?? 0;

  // Fetch a fresh batch of 5 questions
  const fetchBatch = useCallback(async () => {
    if (!canUseFeature("scenarios")) {
      setError(`You've used all ${getLimit("scenarios")} daily scenarios on the free plan. Upgrade to Premium for unlimited! 🚀`);
      return;
    }
    setLoading(true);
    setError(null);
    setShowEvaluation(false);
    setSelectedChoice(null);

    try {
      let retries = 0;
      let result: any = null;
      while (retries < 2) {
        const { data, error: fnError } = await supabase.functions.invoke("scenario-coach", {
          body: { persona, completedLessons, mode: "batch" },
        });
        if (fnError) {
          retries++;
          if (retries >= 2) throw new Error(fnError.message);
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        if (!data?.success) {
          retries++;
          if (retries >= 2) throw new Error(data?.error || "Failed to get scenarios");
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        result = data;
        break;
      }

      const questions: StoredQuestion[] = (result.data as any[]).map(q => ({
        ...q,
        answered: false,
      }));

      // Carry forward today's score if refreshing
      const prev = loadCache();
      const newCache: ScenarioCache = {
        date: getTodayStr(),
        questions,
        currentIndex: 0,
        score: prev?.date === getTodayStr() ? prev.score : 0,
        totalAnswered: prev?.date === getTodayStr() ? prev.totalAnswered : 0,
      };
      saveCache(newCache);
      setCache(newCache);
      recordUsage("scenarios");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [persona, completedLessons]);

  // Answer a question using the locally stored correct answer
  const submitAnswer = useCallback((choiceId: string) => {
    if (!cache || !currentQuestion) return;
    setSelectedChoice(choiceId);

    const isGood = choiceId === currentQuestion.correctAnswer;
    const updatedQuestions = [...cache.questions];
    updatedQuestions[cache.currentIndex] = {
      ...currentQuestion,
      answered: true,
      chosenAnswer: choiceId,
      isGood,
    };

    const newCache: ScenarioCache = {
      ...cache,
      questions: updatedQuestions,
      score: cache.score + (isGood ? 1 : 0),
      totalAnswered: cache.totalAnswered + 1,
    };
    saveCache(newCache);
    setCache(newCache);
    setShowEvaluation(true);
  }, [cache, currentQuestion]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    if (!cache) return;
    setShowEvaluation(false);
    setSelectedChoice(null);

    const nextIdx = cache.currentIndex + 1;
    if (nextIdx < cache.questions.length) {
      const newCache = { ...cache, currentIndex: nextIdx };
      saveCache(newCache);
      setCache(newCache);
    }
    // If all answered, the UI will show the "generate more" prompt
  }, [cache]);

  // Intro screen — no questions loaded yet
  if (!cache && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 text-center space-y-5"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-4xl mx-auto">
          🧠
        </div>
        <div>
          <h3 className="text-foreground font-extrabold text-xl">Scenario Coach</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            Face real-world financial scenarios tailored to your level. 5 fresh questions generated just for you!
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
            persona === "vibe-starter"
              ? "bg-secondary/15 text-secondary"
              : persona === "builder"
              ? "bg-amber/15 text-amber"
              : "bg-primary/15 text-primary"
          }`}>
            {persona === "vibe-starter" ? "🌱 Vibe Starter" : persona === "builder" ? "🔨 Builder" : "🧠 Strategist"}
          </span>
        </div>
        <button
          onClick={fetchBatch}
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          Generate Scenarios
        </button>
        {!isPremium() && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {getRemainingUses("scenarios")} / {getLimit("scenarios")} scenario batches remaining today
          </p>
        )}
      </motion.div>
    );
  }

  // All 5 answered — prompt for more
  if (cache && allAnswered && !loading && !showEvaluation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 text-center space-y-5"
      >
        <div className="text-5xl mb-2">🎉</div>
        <h3 className="text-foreground font-extrabold text-xl">All 5 Scenarios Complete!</h3>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary">{score}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Correct</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{totalAnswered}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Total</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0}%</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Accuracy</p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Ready for 5 more? Each batch covers different topics.</p>
        <button
          onClick={fetchBatch}
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          Generate 5 More →
        </button>
        {!isPremium() && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {getRemainingUses("scenarios")} / {getLimit("scenarios")} batches remaining today
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {cache && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-bold">
              Question {cache.currentIndex + 1} of {cache.questions.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-secondary">✅ {score}</span>
              <span className="text-xs font-bold text-muted-foreground">/ {totalAnswered}</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {cache.questions.map((q, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  q.answered
                    ? q.isGood
                      ? "bg-secondary"
                      : "bg-amber"
                    : i === cache.currentIndex
                    ? "bg-primary"
                    : "bg-surface-highest"
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Generating 5 scenarios for you...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card rounded-2xl p-4 border-destructive/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-destructive">error</span>
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <button onClick={fetchBatch} className="mt-3 text-xs text-primary font-bold hover:underline">
            Try Again
          </button>
        </div>
      )}

      {/* Question */}
      {!loading && currentQuestion && !showEvaluation && !currentQuestion.answered && (
        <motion.div
          key={cache?.currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">quiz</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{currentQuestion.topic}</span>
          </div>
          <div className="p-5">
            <p className="text-foreground text-sm leading-relaxed mb-5">{currentQuestion.scenario}</p>
            <div className="space-y-2">
              {currentQuestion.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => submitAnswer(choice.id)}
                  disabled={!!selectedChoice}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedChoice === choice.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40 hover:bg-surface-high/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selectedChoice === choice.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-high text-muted-foreground border border-border"
                    }`}>
                      {choice.id}
                    </span>
                    <span className="text-sm text-foreground">{choice.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Evaluation */}
      {!loading && showEvaluation && currentQuestion?.answered && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Result banner */}
          <div className={`glass-card rounded-2xl p-5 border ${currentQuestion.isGood ? "border-secondary/30" : "border-amber/30"}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                currentQuestion.isGood ? "bg-secondary/15" : "bg-amber/15"
              }`}>
                {currentQuestion.isGood ? "✅" : "💡"}
              </div>
              <div>
                <p className={`font-bold text-sm ${currentQuestion.isGood ? "text-secondary" : "text-amber"}`}>
                  {currentQuestion.isGood ? "Great thinking!" : "Room to grow!"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  You chose {currentQuestion.chosenAnswer} · Best answer: {currentQuestion.correctAnswer}
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{currentQuestion.explanation}</p>
          </div>

          {/* Lesson recommendations */}
          {currentQuestion.lessonRecs && currentQuestion.lessonRecs.length > 0 && (
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">school</span>
                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Recommended Lessons</h4>
              </div>
              {currentQuestion.lessonRecs.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => onGoToLesson(rec.id)}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-surface-high/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">play_arrow</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{rec.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{rec.reason}</p>
                    </div>
                    <span className="material-symbols-outlined text-primary text-sm">arrow_forward</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Next button */}
          <button
            onClick={nextQuestion}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            {cache && cache.currentIndex < cache.questions.length - 1 ? "Next Scenario →" : "See Results"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
