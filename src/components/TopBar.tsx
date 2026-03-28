import { useState } from "react";
import NotificationPanel from "@/components/NotificationPanel";
import StreakModal from "@/components/StreakModal";
import { AvatarPreview, getStoredAvatar } from "@/components/learn/AvatarCreator";
import { computeXp } from "@/components/learn/BadgeDisplay";
import appLogo from "@/assets/app-logo.png";

interface TopBarProps {
  streak: number;
}

const personaLabels: Record<string, string> = {
  beginner: "🌱 Beginner",
  intermediate: "📈 Intermediate",
  advanced: "🏆 Advanced",
  Starter: "🌱 Starter",
};

function getCompletedLessons(): string[] {
  try { return JSON.parse(localStorage.getItem("sono-completed-lessons") || "[]"); } catch { return []; }
}

const TopBar = ({ streak }: TopBarProps) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const avatar = getStoredAvatar();
  const userName = localStorage.getItem("sono-user-name") || "You";
  const persona = localStorage.getItem("sono-persona") || "Starter";
  const userXp = computeXp(getCompletedLessons().length);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-surface-lowest/92 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4 h-14">
          {/* Profile cluster */}
          <div className="flex items-center gap-2.5 min-w-0">
            <AvatarPreview config={avatar} size={32} />
            <div className="min-w-0 hidden xs:block">
              <p className="text-xs font-bold text-foreground truncate leading-tight">{userName}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] px-1.5 py-[1px] rounded-full bg-primary/15 text-primary font-bold leading-tight">
                  {personaLabels[persona] || `🌱 ${persona}`}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono font-bold">{userXp} XP</span>
              </div>
            </div>
          </div>

          <img src={appLogo} alt="App Logo" className="h-8 w-auto absolute left-1/2 -translate-x-1/2" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStreakOpen(true)}
              className="flex items-center gap-1.5 bg-surface-high px-2.5 py-1 rounded-full border border-border hover:border-amber/40 transition-colors active:scale-95"
            >
              <span className="text-amber text-xs">🔥</span>
              <span className="text-[11px] font-extrabold text-foreground">
                {streak}
              </span>
            </button>
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-1.5 rounded-full hover:bg-surface-high transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-foreground text-xl">
                notifications
              </span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-surface-lowest" />
            </button>
          </div>
        </div>
      </header>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <StreakModal open={streakOpen} onClose={() => setStreakOpen(false)} streak={streak} />
    </>
  );
};

export default TopBar;
