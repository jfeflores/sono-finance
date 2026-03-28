import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  icon: string;
  tab?: string; // which tab to navigate to before highlighting
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "profile",
    title: "Your Profile",
    description: "Your avatar, persona, and XP are always visible here. Tap edit to customise your profile.",
    icon: "person",
    tab: "settings",
  },
  {
    target: "lessons",
    title: "Lessons",
    description: "Start your personalized learning path with bite-sized financial courses.",
    icon: "menu_book",
    tab: "home",
  },
  {
    target: "dashboard",
    title: "Dashboard",
    description: "Set up your balance, budget, and track spending trends over time.",
    icon: "bar_chart",
    tab: "home",
  },
  {
    target: "library",
    title: "Library",
    description: "Deep-dive reference guides on investing, credit, taxes, and more.",
    icon: "local_library",
    tab: "home",
  },
  {
    target: "scenario",
    title: "Scenario Coach",
    description: "Practice real-world money decisions with AI-powered challenges.",
    icon: "psychology",
    tab: "home",
  },
  {
    target: "ai-chat",
    title: "AI Assistant",
    description: "Ask me anything — I can give personalized advice based on your financial data.",
    icon: "auto_awesome",
    tab: "home",
  },
];

const STORAGE_KEY = "sono-tour-completed";

export function shouldShowTour(): boolean {
  return !localStorage.getItem(STORAGE_KEY);
}

export function markTourComplete(): void {
  localStorage.setItem(STORAGE_KEY, "1");
}

interface GuidedTourProps {
  onComplete: () => void;
  onTabChange?: (tab: string) => void;
}

const GuidedTour = ({ onComplete, onTabChange }: GuidedTourProps) => {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [navigating, setNavigating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  // Navigate to the correct tab when step changes
  useEffect(() => {
    if (current.tab && onTabChange) {
      setNavigating(true);
      onTabChange(current.tab);
      // Wait for tab content to render before looking for the target
      const timer = setTimeout(() => {
        setNavigating(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [step, current.tab, onTabChange]);

  // Find and highlight the target element
  useEffect(() => {
    if (navigating) return;

    const findTarget = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          setTargetRect(el.getBoundingClientRect());
        }, 350);
      } else {
        setTargetRect(null);
      }
    };

    // Small delay to ensure DOM is ready after tab switch
    const timer = setTimeout(findTarget, 100);
    return () => clearTimeout(timer);
  }, [step, current.target, navigating]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [current.target]);

  const handleNext = () => {
    if (isLast) {
      markTourComplete();
      // Navigate back to home when tour ends
      onTabChange?.("home");
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    markTourComplete();
    onTabChange?.("home");
    onComplete();
  };

  // Tooltip positioning
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const pad = 12;
    const tooltipWidth = 280;
    const viewportHeight = window.innerHeight;

    let top = targetRect.bottom + pad;
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

    if (top + 160 > viewportHeight) {
      top = targetRect.top - pad - 160;
    }

    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    return { top, left, width: tooltipWidth };
  };

  const spotlightPad = 8;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[9999]">
      {/* Backdrop with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - spotlightPad}
                y={targetRect.top - spotlightPad}
                width={targetRect.width + spotlightPad * 2}
                height={targetRect.height + spotlightPad * 2}
                rx={16}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#tour-mask)"
          style={{ pointerEvents: "all" }}
          onClick={handleNext}
        />
      </svg>

      {/* Spotlight glow ring */}
      {targetRect && (
        <div
          className="absolute rounded-2xl border-2 border-primary/60 shadow-[0_0_20px_hsl(var(--primary)/0.3)] pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - spotlightPad,
            left: targetRect.left - spotlightPad,
            width: targetRect.width + spotlightPad * 2,
            height: targetRect.height + spotlightPad * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="absolute z-10 rounded-2xl bg-surface-low border border-border p-4 shadow-2xl"
          style={getTooltipStyle()}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                {current.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground">{current.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{current.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-surface-highest"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkip}
                className="text-[10px] text-muted-foreground font-medium hover:text-foreground transition-colors px-2 py-1"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="text-[10px] font-bold text-primary-foreground bg-primary px-3 py-1.5 rounded-lg hover:opacity-90 transition-all active:scale-95"
              >
                {isLast ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GuidedTour;
