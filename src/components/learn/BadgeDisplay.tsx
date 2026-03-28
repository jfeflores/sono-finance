import { motion } from "framer-motion";

export interface Badge {
  id: string;
  title: string;
  icon: string;
  description: string;
  earned: boolean;
}

// Badges are earned based on completed lesson count
export function computeBadges(completedCount: number): Badge[] {
  return [
    { id: "first-step", title: "First Step", icon: "🌱", description: "Complete your first lesson", earned: completedCount >= 1 },
    { id: "high-five", title: "High Five", icon: "🖐️", description: "Complete 5 lessons", earned: completedCount >= 5 },
    { id: "ten-strong", title: "Ten Strong", icon: "💪", description: "Complete 10 lessons", earned: completedCount >= 10 },
    { id: "scholar", title: "Scholar", icon: "📚", description: "Complete 20 lessons", earned: completedCount >= 20 },
    { id: "expert", title: "Expert", icon: "🎓", description: "Complete 30 lessons", earned: completedCount >= 30 },
    { id: "master", title: "Master", icon: "👑", description: "Complete all 44 lessons", earned: completedCount >= 44 },
  ];
}

// XP: 50 per lesson
export function computeXp(completedCount: number): number {
  return completedCount * 50;
}

interface BadgeDisplayProps {
  completedCount: number;
}

export default function BadgeDisplay({ completedCount }: BadgeDisplayProps) {
  const badges = computeBadges(completedCount);
  const earned = badges.filter(b => b.earned);
  const next = badges.find(b => !b.earned);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-foreground font-bold text-sm">Badges</h3>
        <span className="text-[10px] text-muted-foreground font-bold">
          {earned.length}/{badges.length} earned
        </span>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              badge.earned
                ? "bg-amber/10 border border-amber/20"
                : "bg-surface-high border border-border opacity-40 grayscale"
            }`}
            title={`${badge.title}: ${badge.description}`}
          >
            <span className="text-xl">{badge.icon}</span>
            <span className="text-[8px] font-bold text-center leading-tight text-foreground">
              {badge.title}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Next badge progress */}
      {next && (
        <div className="bg-surface-high rounded-lg p-3 flex items-center gap-3">
          <span className="text-2xl opacity-50 grayscale">{next.icon}</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">Next: {next.title}</p>
            <p className="text-[10px] text-muted-foreground">{next.description}</p>
          </div>
          <span className="material-symbols-outlined text-muted-foreground text-sm">arrow_forward</span>
        </div>
      )}
    </motion.section>
  );
}
