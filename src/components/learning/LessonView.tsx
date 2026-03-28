import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import { getLessonData, type QuizContent, type FillContent } from "@/data/lessonContent";

const sanitize = (html: string) => DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'span', 'u', 'sub', 'sup'], ALLOWED_ATTR: ['class'] });

interface LessonViewProps {
  lessonId: string;
  onBack: () => void;
  onComplete?: () => void;
}

const LessonView = ({ lessonId, onBack, onComplete }: LessonViewProps) => {
  const lesson = useMemo(() => getLessonData(lessonId), [lessonId]);
  const steps = lesson.steps;

  const [currentStep, setCurrentStep] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [xp, setXp] = useState(350);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showXpToast, setShowXpToast] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);

  const gainXP = useCallback((amount: number) => {
    setXp((prev) => prev + amount);
    setXpAmount(amount);
    setShowXpToast(true);
    setTimeout(() => setShowXpToast(false), 1800);
  }, []);

  const advance = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setShowCompletion(true);
      gainXP(50);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, steps.length, gainXP]);

  const restart = () => {
    setCurrentStep(0);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setShowCompletion(false);
    setHearts(5);
  };

  const step = steps[currentStep];
  const totalQ = Object.keys(lesson.quizzes).length + (lesson.fill ? 1 : 0);

  return (
    <div className="relative">
      {/* XP Toast */}
      <AnimatePresence>
        {showXpToast && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-20 right-4 z-50 xp-toast text-sm font-mono"
          >
            +{xpAmount} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-muted-foreground text-xs font-medium mb-2 hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
          <div className="text-primary text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
            ⚡ {lesson.subtitle}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tighter text-foreground leading-tight">
            {lesson.title}{" "}
            {lesson.titleHighlight && <span className="text-primary">{lesson.titleHighlight}</span>}
          </h1>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-high border border-border text-muted-foreground">
              ⏱ ~8 min
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-high border border-border text-muted-foreground">
              ⭐ 100 XP
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>❤️</span>
            <span className="font-bold text-foreground">{hearts}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Step <span className="font-bold text-foreground">{showCompletion ? steps.length : currentStep + 1}</span> of {steps.length}
          </div>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < currentStep || showCompletion
                    ? "bg-secondary scale-100"
                    : i === currentStep && !showCompletion
                    ? "bg-primary scale-125"
                    : "bg-surface-highest border border-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {showCompletion ? (
          <CompletionScreen
            key="completion"
            correctAnswers={correctAnswers}
            totalQuestions={totalQuestions}
            unlockLabel={lesson.completionUnlock}
            message={lesson.completionMessage}
            onRestart={restart}
            onBack={onComplete || onBack}
          />
        ) : step.type === "story" ? (
          <StoryStep key={step.id} avatar={lesson.storyAvatar} name={lesson.storyName} text={lesson.storyText} onContinue={advance} />
        ) : step.type === "concept" ? (
          <ConceptStep key={step.id} title={lesson.conceptTitle} concepts={lesson.concepts} footer={lesson.conceptFooter} onContinue={advance} />
        ) : step.type === "explorer" ? (
          <ExplorerStep key={step.id} onContinue={advance} />
        ) : step.type === "quiz" ? (
          <QuizStep
            key={step.id}
            quiz={lesson.quizzes[step.id]}
            totalQ={totalQ}
            onCorrect={() => { setCorrectAnswers((p) => p + 1); setTotalQuestions((p) => p + 1); gainXP(25); }}
            onWrong={() => { setTotalQuestions((p) => p + 1); setHearts((p) => Math.max(0, p - 1)); }}
            onContinue={advance}
          />
        ) : step.type === "fill" && lesson.fill ? (
          <FillStep
            key={step.id}
            content={lesson.fill}
            qnum={Object.keys(lesson.quizzes).length + 1}
            totalQ={totalQ}
            onCorrect={() => { setCorrectAnswers((p) => p + 1); setTotalQuestions((p) => p + 1); gainXP(25); }}
            onWrong={() => { setTotalQuestions((p) => p + 1); setHearts((p) => Math.max(0, p - 1)); }}
            onContinue={advance}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

// ─── Story Step ────────────────────────────────────────────
const StoryStep = ({ avatar, name, text, onContinue }: { avatar: string; name: string; text: string; onContinue: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
    <div className="flex gap-3 glass-card rounded-2xl p-4 mb-4">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-xl shrink-0">{avatar}</div>
      <div className="flex-1">
        <div className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">{name}</div>
        <p className="text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitize(text) }} />
      </div>
    </div>
    <button onClick={onContinue} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98]">Let's Go →</button>
  </motion.div>
);

// ─── Concept Step ──────────────────────────────────────────
const ConceptStep = ({ title, concepts, footer, onContinue }: { title: string; concepts: { title: string; body: string; formula?: string }[]; footer?: string; onContinue: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
    <div className="glass-card rounded-2xl p-5 mb-4 border-primary/20 bg-primary/[0.03]">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
        <div className="w-0.5 h-3 rounded bg-primary" />
        Core Concept
      </div>
      <div className="space-y-3">
        {concepts.map((c, i) => (
          <div key={i} className="glass-card rounded-xl p-4">
            <h4 className="text-sm font-bold text-foreground mb-1">{c.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitize(c.body) }} />
            {c.formula && (
              <div className="mt-2 inline-block font-mono text-xs bg-surface-highest border border-border rounded-md px-2 py-0.5 text-primary">{c.formula}</div>
            )}
          </div>
        ))}
        {footer && <p className="text-xs text-muted-foreground text-center pt-1" dangerouslySetInnerHTML={{ __html: sanitize(footer) }} />}
      </div>
    </div>
    <button onClick={onContinue} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98]">Got it →</button>
  </motion.div>
);

// ─── Explorer Step ─────────────────────────────────────────
const ExplorerStep = ({ onContinue }: { onContinue: () => void }) => {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(20);

  const results = useMemo(() => {
    const r = rate / 100;
    const compoundTotal = principal * Math.pow(1 + r, years);
    const simpleTotal = principal * (1 + r * years);
    return { compound: compoundTotal, simple: simpleTotal, diff: compoundTotal - simpleTotal };
  }, [principal, rate, years]);

  const maxVal = Math.max(results.compound, results.simple);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
      <div className="glass-card rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-sm">📊</span>
          <h3 className="font-bold text-foreground text-sm">Compound vs Simple Growth</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple/15 text-purple">Interactive</span>
        </div>
        <div className="space-y-4 mb-5">
          <SliderRow label="💰 Principal" value={principal} min={100} max={10000} step={100} display={`$${principal.toLocaleString()}`} onChange={setPrincipal} />
          <SliderRow label="📈 Interest Rate" value={rate} min={1} max={20} step={0.5} display={`${rate}%`} onChange={setRate} />
          <SliderRow label="⏳ Years" value={years} min={1} max={40} step={1} display={`${years} yrs`} onChange={setYears} />
        </div>
        <div className="space-y-3 mb-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-primary font-medium">Compound</span>
              <span className="font-mono font-bold text-primary">${results.compound.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="w-full bg-surface-highest h-3 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary" animate={{ width: `${(results.compound / maxVal) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-secondary font-medium">Simple</span>
              <span className="font-mono font-bold text-secondary">${results.simple.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="w-full bg-surface-highest h-3 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-secondary/80 to-secondary" animate={{ width: `${(results.simple / maxVal) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 bg-surface-high/50 rounded-xl p-4 border border-border">
          <div className="text-center">
            <div className="font-bold text-lg text-foreground tracking-tight">${principal.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Initial</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-primary tracking-tight">${results.compound.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Compound</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-secondary tracking-tight">+${results.diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">You gain</div>
          </div>
        </div>
      </div>
      <button onClick={onContinue} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98]">Continue →</button>
    </motion.div>
  );
};

const SliderRow = ({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-muted-foreground font-medium w-28 shrink-0">{label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 h-1 bg-surface-highest rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface-lowest [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_hsl(var(--primary))]" />
    <span className="font-mono text-xs font-medium text-primary w-16 text-right">{display}</span>
  </div>
);

// ─── Quiz Step ─────────────────────────────────────────────
const QuizStep = ({ quiz, totalQ, onCorrect, onWrong, onContinue }: { quiz: QuizContent; totalQ: number; onCorrect: () => void; onWrong: () => void; onContinue: () => void }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const letters = ["A", "B", "C", "D"];

  const check = () => { if (selected === null) return; setAnswered(true); if (selected === quiz.correct) onCorrect(); else onWrong(); };
  const isCorrect = selected === quiz.correct;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
      <div className="glass-card rounded-2xl p-5 mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
          <span>🎯 Question {quiz.qnum} of {totalQ}</span>
          <span className="text-muted-foreground">+25 XP for correct</span>
        </div>
        <p className="text-sm font-bold text-foreground leading-relaxed mb-4">{quiz.question}</p>
        <div className="space-y-2">
          {quiz.options.map((opt, i) => {
            let style = "bg-surface-high/50 border-border hover:border-foreground/20 hover:bg-surface-highest/50";
            if (answered) {
              if (i === quiz.correct) style = "bg-green/15 border-green/40 text-green";
              else if (i === selected) style = "bg-red/15 border-red/40 text-red";
              else style = "bg-surface-high/30 border-border opacity-50";
            } else if (i === selected) {
              style = "bg-primary/10 border-primary/40";
            }
            let letterStyle = "bg-surface-highest border-border text-muted-foreground";
            if (answered) {
              if (i === quiz.correct) letterStyle = "bg-green border-green text-surface-lowest";
              else if (i === selected) letterStyle = "bg-red border-red text-foreground";
            } else if (i === selected) {
              letterStyle = "bg-primary border-primary text-primary-foreground";
            }
            return (
              <button key={i} disabled={answered} onClick={() => setSelected(i)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left text-sm ${style}`}>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono border shrink-0 transition-all ${letterStyle}`}>{letters[i]}</span>
                <span className={answered && i !== quiz.correct && i !== selected ? "text-muted-foreground" : "text-foreground"}>{opt}</span>
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {answered && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`mt-4 p-4 rounded-xl text-sm ${isCorrect ? "bg-green/10 border border-green/25" : "bg-red/10 border border-red/25"}`}>
              <div className={`font-bold mb-1 ${isCorrect ? "text-green" : "text-red"}`}>{isCorrect ? quiz.explanation.correct : quiz.explanation.wrong}</div>
              <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitize(quiz.explanation.body) }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button onClick={answered ? onContinue : check} disabled={selected === null && !answered} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-all active:scale-[0.98]">{answered ? "Continue →" : "Check →"}</button>
    </motion.div>
  );
};

// ─── Fill Step ─────────────────────────────────────────────
const FillStep = ({ content, qnum, totalQ, onCorrect, onWrong, onContinue }: { content: FillContent; qnum: number; totalQ: number; onCorrect: () => void; onWrong: () => void; onContinue: () => void }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState(false);
  const blankIds = Object.keys(content.blanks);
  const shuffledBank = useMemo(() => [...content.wordBank].sort(() => Math.random() - 0.5), []);

  const usedWords = Object.values(answers);
  const allFilled = blankIds.every((b) => answers[b]);
  const isCorrect = blankIds.every((b) => answers[b] === content.blanks[b]);

  const placeWord = (word: string) => { const emptyBlank = blankIds.find((b) => !answers[b]); if (!emptyBlank) return; setAnswers((prev) => ({ ...prev, [emptyBlank]: word })); };
  const clearBlank = (blankId: string) => { if (answered) return; setAnswers((prev) => { const next = { ...prev }; delete next[blankId]; return next; }); };
  const check = () => { setAnswered(true); if (isCorrect) onCorrect(); else onWrong(); };

  const parts = content.sentence.split(/\[(blank\d+)\]/);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
      <div className="glass-card rounded-2xl p-5 mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
          <span>🧩 Question {qnum} of {totalQ} — Fill in the blanks</span>
          <span>+25 XP</span>
        </div>
        <p className="text-sm leading-[2.2] text-foreground mb-4">
          {parts.map((part, i) => {
            if (blankIds.includes(part)) {
              const word = answers[part];
              const blankCorrect = answered && word === content.blanks[part];
              const blankWrong = answered && word && word !== content.blanks[part];
              return (
                <button key={i} onClick={() => clearBlank(part)} className={`inline-block min-w-[80px] mx-1 px-2 py-0.5 rounded-t border-b-2 font-mono text-xs font-medium text-center transition-all ${blankCorrect ? "bg-green/15 border-green text-green" : blankWrong ? "bg-red/15 border-red text-red" : word ? "bg-primary/10 border-primary text-primary" : "bg-surface-high border-muted-foreground/30 text-muted-foreground"}`}>
                  {word || "\u00A0\u00A0\u00A0\u00A0\u00A0"}
                </button>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {shuffledBank.map((word) => {
            const isUsed = usedWords.includes(word);
            return (
              <button key={word} disabled={isUsed || answered} onClick={() => placeWord(word)} className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${isUsed ? "opacity-30 cursor-default border-border bg-surface-high" : "border-border bg-surface-high hover:border-primary/40 hover:text-primary hover:bg-primary/5 text-foreground cursor-pointer"}`}>
                {word}
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {answered && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-4 rounded-xl text-sm ${isCorrect ? "bg-green/10 border border-green/25" : "bg-red/10 border border-red/25"}`}>
              <div className={`font-bold mb-1 ${isCorrect ? "text-green" : "text-red"}`}>{isCorrect ? "🎯 Spot on!" : "Not quite — review the blanks"}</div>
              <p className="text-xs text-muted-foreground">
                The correct answers are: {blankIds.map(b => <strong key={b} className="text-foreground">{content.blanks[b]}</strong>).reduce((a, b) => <>{a}, {b}</>)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button onClick={answered ? onContinue : check} disabled={!allFilled && !answered} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-all active:scale-[0.98]">{answered ? "Continue →" : "Check →"}</button>
    </motion.div>
  );
};

// ─── Completion Screen ─────────────────────────────────────
const CompletionScreen = ({ correctAnswers, totalQuestions, unlockLabel, message, onRestart, onBack }: { correctAnswers: number; totalQuestions: number; unlockLabel?: string; message?: string; onRestart: () => void; onBack: () => void }) => {
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 100;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center py-8">
      <motion.div className="text-6xl mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}>🏆</motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        {unlockLabel && (
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5 text-xs font-bold text-primary mb-4">
            🔓 Unlocked: {unlockLabel}
          </div>
        )}
        <h2 className="text-2xl font-extrabold tracking-tighter text-foreground mb-1">Lesson <span className="text-primary">Complete!</span></h2>
        <p className="text-muted-foreground text-sm mb-6">{message || "Great job! Keep the streak alive!"}</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6">
        <div className="glass-card rounded-xl p-4">
          <div className="text-2xl font-extrabold text-primary font-mono">100</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">XP Earned</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-2xl font-extrabold text-primary font-mono">{accuracy}%</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Accuracy</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-2xl font-extrabold text-primary font-mono">🔥</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Streak</div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex gap-3">
        <button onClick={onRestart} className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-surface-high/50 transition-all active:scale-[0.98]">↩ Restart</button>
        <button onClick={onBack} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98]">Next Lesson →</button>
      </motion.div>
    </motion.div>
  );
};

export default LessonView;
