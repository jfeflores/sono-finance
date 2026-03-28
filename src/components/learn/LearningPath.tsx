import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScenarioCoach from "@/components/games/ScenarioCoach";
import type { PersonaTier } from "@/components/onboarding/OnboardingQuiz";

interface ChapterWithStatus {
  id: string;
  title: string;
  subtitle: string;
  status: "done" | "active" | "locked";
}

interface CourseWithStatus {
  id: string;
  title: string;
  icon: string;
  lessons: number;
  status: "done" | "active" | "locked";
  progress: number;
  chapters: ChapterWithStatus[];
}

const COURSE_THEMES: Record<string, { accent: string; accentLight: string; accentGlow: string }> = {
  "money-basics": { accent: "hsl(163 80% 50%)", accentLight: "hsl(163 80% 70%)", accentGlow: "hsl(163 80% 50% / 0.3)" },
  "budgeting": { accent: "hsl(216 100% 65%)", accentLight: "hsl(216 100% 80%)", accentGlow: "hsl(216 100% 65% / 0.3)" },
  "banking": { accent: "hsl(45 90% 55%)", accentLight: "hsl(45 90% 75%)", accentGlow: "hsl(45 90% 55% / 0.3)" },
  "interest-loans": { accent: "hsl(0 80% 60%)", accentLight: "hsl(0 80% 75%)", accentGlow: "hsl(0 80% 60% / 0.3)" },
  "credit-scores": { accent: "hsl(263 85% 70%)", accentLight: "hsl(263 85% 85%)", accentGlow: "hsl(263 85% 70% / 0.3)" },
  "investing": { accent: "hsl(36 90% 55%)", accentLight: "hsl(36 90% 75%)", accentGlow: "hsl(36 90% 55% / 0.3)" },
  "retirement": { accent: "hsl(190 80% 55%)", accentLight: "hsl(190 80% 75%)", accentGlow: "hsl(190 80% 55% / 0.3)" },
  "taxes": { accent: "hsl(130 60% 50%)", accentLight: "hsl(130 60% 70%)", accentGlow: "hsl(130 60% 50% / 0.3)" },
  "mortgages": { accent: "hsl(320 70% 60%)", accentLight: "hsl(320 70% 80%)", accentGlow: "hsl(320 70% 60% / 0.3)" },
};

const DEFAULT_THEME = COURSE_THEMES["money-basics"];
function getTheme(courseId: string) {
  return COURSE_THEMES[courseId] || DEFAULT_THEME;
}

function getLevel(course: CourseWithStatus) {
  return course.chapters.filter(c => c.status === "done").length + 1;
}

interface LearningPathProps {
  courses: CourseWithStatus[];
  onStartLesson: (lessonId: string) => void;
  persona: string;
  completedLessons: string[];
  onGoToLesson: (lessonId: string) => void;
}

export default function LearningPath({ courses, onStartLesson, persona, completedLessons, onGoToLesson }: LearningPathProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  if (selectedCourse) {
    return (
      <CoursePathway
        course={selectedCourse}
        onBack={() => setSelectedCourseId(null)}
        onStartLesson={onStartLesson}
      />
    );
  }

  // Find the first non-locked course for initial slide
  const activeCourses = courses.filter(c => c.status !== "locked");
  const lockedCourses = courses.filter(c => c.status === "locked");

  return (
    <div className="space-y-5">
      <ScenarioCoach
        persona={persona as PersonaTier}
        completedLessons={completedLessons}
        onGoToLesson={onGoToLesson}
      />

      {/* Overall progression */}
      {(() => {
        const totalCourses = courses.length;
        const doneCourses = courses.filter(c => c.status === "done").length;
        const activeCourse = courses.find(c => c.status === "active");
        const activeProgress = activeCourse ? activeCourse.progress / 100 : 0;
        const overallPct = totalCourses > 0 ? ((doneCourses + activeProgress) / totalCourses) * 100 : 0;
        const activeTheme = activeCourse ? getTheme(activeCourse.id) : getTheme(courses[0]?.id || "money-basics");

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Active Paths</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Thick progression bar */}
            <div className="relative">
              {/* Track — transparent/dim */}
              <div
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ background: "hsl(220 14% 10%)", border: "1px solid hsl(220 12% 16%)" }}
              >
                {/* Segmented background ticks */}
                <div className="absolute inset-0 flex">
                  {courses.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex-1 border-r last:border-r-0"
                      style={{ borderColor: "hsl(220 12% 14%)" }}
                    />
                  ))}
                </div>

                {/* Filled portion with glow */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full relative"
                  style={{
                    background: `linear-gradient(90deg, ${activeTheme.accent}90, ${activeTheme.accentLight})`,
                    boxShadow: `0 0 16px ${activeTheme.accentGlow}, 0 0 6px ${activeTheme.accent}60`,
                  }}
                >
                  {/* Shimmer highlight */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                    }}
                  />
                </motion.div>
              </div>

              {/* Labels */}
              <div className="flex justify-between mt-1.5 px-0.5">
                <span className="text-[10px] font-bold text-muted-foreground">
                  {doneCourses}/{totalCourses} paths
                </span>
                <span className="text-[10px] font-bold" style={{ color: activeTheme.accent }}>
                  {Math.round(overallPct)}%
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Horizontal swipeable course cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory no-scrollbar"
        onScroll={() => {
          const el = scrollRef.current;
          if (el) {
            const idx = Math.round(el.scrollLeft / el.clientWidth);
            setActiveSlide(Math.min(idx, courses.length - 1));
          }
        }}
      >
        {courses.map((course, i) => {
          const theme = getTheme(course.id);
          const level = getLevel(course);
          const isLocked = course.status === "locked";
          const isDone = course.status === "done";

          return (
            <motion.button
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => !isLocked && setSelectedCourseId(course.id)}
              disabled={isLocked}
              className={`flex-shrink-0 snap-center w-full rounded-2xl text-center transition-all active:scale-[0.97] ${
                isLocked ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
              }`}
              style={{ minWidth: "100%" }}
            >
              <div className="flex flex-col items-center py-8 px-6">
                {/* Large icon */}
                <div
                  className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl mb-6 relative"
                  style={{
                    background: isDone
                      ? `linear-gradient(145deg, ${theme.accent}25, ${theme.accent}08)`
                      : isLocked
                      ? "hsl(220 15% 12%)"
                      : `linear-gradient(145deg, ${theme.accent}20, ${theme.accent}05)`,
                    border: `2px solid ${isLocked ? "hsl(220 10% 20%)" : theme.accent}30`,
                    boxShadow: !isLocked ? `0 8px 40px ${theme.accentGlow}` : "none",
                  }}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-5xl" style={{ color: theme.accent, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ) : isLocked ? (
                    <span className="material-symbols-outlined text-4xl" style={{ color: "hsl(220 10% 25%)" }}>lock</span>
                  ) : (
                    <span>{course.icon}</span>
                  )}

                  {/* Glow */}
                  {!isLocked && (
                    <div
                      className="absolute inset-0 rounded-3xl pointer-events-none"
                      style={{ boxShadow: `inset 0 0 30px ${theme.accentGlow}` }}
                    />
                  )}
                </div>

                {/* Title */}
                <h3 className={`font-extrabold text-xl tracking-tight mb-1.5 ${isLocked ? "text-muted-foreground/40" : "text-foreground"}`}>
                  {course.title}
                </h3>

                {/* Level badge */}
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: isLocked ? "hsl(220 10% 25%)" : theme.accent }}>
                  {isDone ? "COMPLETED" : isLocked ? "LOCKED" : `LEVEL ${level}`}
                </p>

                {/* Progress for active */}
                {!isLocked && !isDone && (
                  <div className="w-full max-w-[200px] mt-4">
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: `${theme.accent}15` }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentLight})` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-1.5">
        {courses.map((c, i) => {
          const theme = getTheme(c.id);
          const isActive = i === activeSlide;
          return (
            <button
              key={c.id}
              onClick={() => {
                const el = scrollRef.current;
                if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              }}
              className="rounded-full transition-all"
              style={{
                width: isActive ? 20 : 6,
                height: 6,
                background: isActive ? theme.accent : "hsl(220 12% 20%)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Course Pathway (Duolingo-style full screen) ── */

function CoursePathway({
  course,
  onBack,
  onStartLesson,
}: {
  course: CourseWithStatus;
  onBack: () => void;
  onStartLesson: (id: string) => void;
}) {
  const theme = getTheme(course.id);
  const level = getLevel(course);

  // Serpentine node positions
  const getXPercent = (i: number): number => {
    const pattern = [50, 28, 50, 72];
    return pattern[i % pattern.length];
  };

  const NODE_SPACING = 150;
  const NODE_SIZE_DONE = 64;
  const NODE_SIZE_ACTIVE = 76;
  const NODE_SIZE_LOCKED = 56;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0 -mx-4">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 mb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-surface-high/80 border border-border flex items-center justify-center hover:bg-surface-highest transition-colors active:scale-95">
          <span className="material-symbols-outlined text-foreground text-base">arrow_back</span>
        </button>
        <div className="flex-1 text-center">
          <h3 className="text-foreground font-extrabold text-lg leading-tight">{course.title}</h3>
          <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: theme.accent }}>
            Level {level}
          </p>
        </div>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Scrollable pathway */}
      <div className="relative px-4" style={{ minHeight: course.chapters.length * NODE_SPACING + 60 }}>
        {/* SVG curved paths */}
        <svg
          className="absolute inset-0 w-full pointer-events-none"
          style={{ height: course.chapters.length * NODE_SPACING + 60, zIndex: 0 }}
        >
          <defs>
            <filter id="trail-glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {course.chapters.map((ch, i) => {
            if (i === course.chapters.length - 1) return null;
            const x1 = getXPercent(i);
            const x2 = getXPercent(i + 1);
            const y1 = 50 + i * NODE_SPACING;
            const y2 = 50 + (i + 1) * NODE_SPACING;
            const midY = (y1 + y2) / 2;
            const isDone = ch.status === "done";
            const isActiveSeg = ch.status === "done" && course.chapters[i + 1]?.status === "active";
            const isLit = isDone || isActiveSeg;
            const pathD = `M ${x1}% ${y1} C ${x1}% ${midY}, ${x2}% ${midY}, ${x2}% ${y2}`;

            return (
              <g key={i}>
                {/* Glow layer behind active/done segments */}
                {isLit && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth={18}
                    strokeLinecap="round"
                    opacity={0.12}
                    filter="url(#trail-glow)"
                  />
                )}
                {/* Background track — always visible dotted trail */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="hsl(220 12% 18%)"
                  strokeWidth={8}
                  strokeDasharray="6 12"
                  strokeLinecap="round"
                  opacity={0.5}
                />
                {/* Filled overlay for completed segments */}
                {isLit && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth={8}
                    strokeDasharray="6 12"
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {course.chapters.map((ch, i) => {
          const isDone = ch.status === "done";
          const isActive = ch.status === "active";
          const isLocked = ch.status === "locked";
          const xPct = getXPercent(i);
          const nodeSize = isActive ? NODE_SIZE_ACTIVE : isDone ? NODE_SIZE_DONE : NODE_SIZE_LOCKED;
          const labelRight = xPct <= 50;

          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 220, damping: 18 }}
              className="absolute"
              style={{
                top: 50 + i * NODE_SPACING - nodeSize / 2,
                left: `${xPct}%`,
                transform: "translateX(-50%)",
                zIndex: 2,
              }}
            >
              <div className="flex flex-col items-center relative">
                {/* Outer progress ring for active */}
                {isActive && (
                  <svg
                    className="absolute pointer-events-none"
                    width={nodeSize + 18}
                    height={nodeSize + 18}
                    style={{ top: -9, left: "50%", transform: "translateX(-50%)" }}
                  >
                    <circle
                      cx={(nodeSize + 18) / 2}
                      cy={(nodeSize + 18) / 2}
                      r={(nodeSize + 8) / 2}
                      fill="none"
                      stroke="hsl(220 12% 14%)"
                      strokeWidth="4"
                    />
                    <motion.circle
                      cx={(nodeSize + 18) / 2}
                      cy={(nodeSize + 18) / 2}
                      r={(nodeSize + 8) / 2}
                      fill="none"
                      stroke={theme.accent}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={Math.PI * (nodeSize + 8)}
                      initial={{ strokeDashoffset: Math.PI * (nodeSize + 8) }}
                      animate={{ strokeDashoffset: Math.PI * (nodeSize + 8) * 0.6 }}
                      transition={{ duration: 1, delay: 0.3 }}
                      transform={`rotate(-90 ${(nodeSize + 18) / 2} ${(nodeSize + 18) / 2})`}
                    />
                  </svg>
                )}

                {/* Concentric rings for done */}
                {isDone && (
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: nodeSize + 14,
                      height: nodeSize + 14,
                      top: -7,
                      left: "50%",
                      transform: "translateX(-50%)",
                      border: `2.5px solid ${theme.accent}25`,
                    }}
                  />
                )}

                {/* Main circle */}
                <button
                  onClick={() => !isLocked && onStartLesson(ch.id)}
                  disabled={isLocked}
                  className={`relative flex items-center justify-center transition-all ${
                    isLocked ? "cursor-not-allowed" : "cursor-pointer active:scale-90"
                  }`}
                  style={{
                    width: nodeSize,
                    height: nodeSize,
                    borderRadius: "50%",
                    background: isDone
                      ? `linear-gradient(145deg, ${theme.accent}, ${theme.accentLight})`
                      : isActive
                      ? `radial-gradient(circle at 35% 35%, ${theme.accent}40, ${theme.accent}12 70%)`
                      : "linear-gradient(145deg, hsl(220 14% 14%), hsl(220 14% 10%))",
                    border: `3px solid ${isDone ? theme.accent : isActive ? theme.accent : "hsl(220 10% 18%)"}`,
                    boxShadow: isActive
                      ? `0 0 28px ${theme.accentGlow}, 0 4px 16px rgba(0,0,0,0.4)`
                      : isDone
                      ? `0 0 18px ${theme.accentGlow}`
                      : "0 4px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-2xl" style={{ color: "hsl(0 0% 5%)", fontVariationSettings: "'FILL' 1" }}>check</span>
                  ) : isActive ? (
                    <span className="material-symbols-outlined text-3xl" style={{ color: theme.accent, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg" style={{ color: "hsl(220 10% 28%)", fontVariationSettings: "'FILL' 1" }}>lock</span>
                  )}

                  {/* Highlight sheen */}
                  {(isDone || isActive) && (
                    <div
                      className="absolute pointer-events-none rounded-full"
                      style={{
                        width: "50%",
                        height: "30%",
                        top: "12%",
                        left: "20%",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </button>

                {/* Pedestal shadow */}
                <div
                  className="pointer-events-none mt-1"
                  style={{
                    width: nodeSize * 0.7,
                    height: 8,
                    borderRadius: "50%",
                    background: isDone || isActive
                      ? `radial-gradient(ellipse, ${theme.accent}18 0%, transparent 70%)`
                      : "radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)",
                  }}
                />

                {/* Label */}
                <div
                  className="absolute whitespace-nowrap"
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    ...(labelRight
                      ? { left: `calc(50% + ${nodeSize / 2 + 14}px)` }
                      : { right: `calc(50% + ${nodeSize / 2 + 14}px)`, textAlign: "right" as const }),
                  }}
                >
                  <p className="text-[12px] font-bold leading-tight" style={{
                    color: isLocked ? "hsl(220 10% 25%)" : "hsl(var(--foreground))",
                  }}>
                    {ch.title}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
