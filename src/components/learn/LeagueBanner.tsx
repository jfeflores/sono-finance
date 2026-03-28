import { motion } from "framer-motion";
import { AvatarPreview, type AvatarConfig } from "./AvatarCreator";

// League tiers — dramatic styling
const LEAGUES = [
  { name: "Bronze", color: "hsl(30 60% 45%)", glow: "hsl(30 80% 40%)", icon: "🥉", min: 0, shadow: "0 0 30px hsl(30 60% 45% / 0.4)" },
  { name: "Silver", color: "hsl(0 0% 75%)", glow: "hsl(0 0% 80%)", icon: "🥈", min: 500, shadow: "0 0 30px hsl(0 0% 75% / 0.4)" },
  { name: "Gold", color: "hsl(45 90% 55%)", glow: "hsl(45 100% 60%)", icon: "🥇", min: 1500, shadow: "0 0 40px hsl(45 90% 55% / 0.5)" },
  { name: "Platinum", color: "hsl(216 100% 71%)", glow: "hsl(216 100% 80%)", icon: "💎", min: 3000, shadow: "0 0 40px hsl(216 100% 71% / 0.5)" },
  { name: "Diamond", color: "hsl(263 85% 75%)", glow: "hsl(263 90% 85%)", icon: "💠", min: 6000, shadow: "0 0 50px hsl(263 85% 75% / 0.6)" },
];

const FAKE_USERS = [
  { name: "Alex M.", xp: 4200, streak: 45 },
  { name: "Sarah K.", xp: 3800, streak: 32 },
  { name: "Jordan T.", xp: 3100, streak: 28 },
  { name: "Maya R.", xp: 2900, streak: 21 },
  { name: "Chris L.", xp: 2400, streak: 18 },
  { name: "Pat D.", xp: 1800, streak: 12 },
  { name: "Jamie W.", xp: 1200, streak: 8 },
];

function getLeague(xp: number) {
  return [...LEAGUES].reverse().find(l => xp >= l.min) || LEAGUES[0];
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase();
}

// SVG League Badge — big, dramatic, with glow
function LeagueBadge({ league, size = 100 }: { league: typeof LEAGUES[0]; size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle, ${league.glow}33, transparent 70%)`,
          filter: "blur(12px)",
          transform: "scale(1.6)",
        }}
      />
      {/* Shield shape */}
      <svg viewBox="0 0 100 100" className="absolute inset-0" style={{ width: size, height: size }}>
        <defs>
          <linearGradient id={`badge-grad-${league.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={league.glow} stopOpacity="0.9" />
            <stop offset="50%" stopColor={league.color} stopOpacity="1" />
            <stop offset="100%" stopColor={league.glow} stopOpacity="0.7" />
          </linearGradient>
          <filter id={`badge-glow-${league.name}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Wings */}
        <path
          d="M12 55 Q5 40 15 30 Q20 25 25 35 L30 45 Z"
          fill={league.color}
          opacity="0.6"
        />
        <path
          d="M88 55 Q95 40 85 30 Q80 25 75 35 L70 45 Z"
          fill={league.color}
          opacity="0.6"
        />
        {/* Shield */}
        <path
          d="M50 12 L75 25 L75 55 Q75 78 50 90 Q25 78 25 55 L25 25 Z"
          fill={`url(#badge-grad-${league.name})`}
          stroke={league.glow}
          strokeWidth="1.5"
          filter={`url(#badge-glow-${league.name})`}
        />
        {/* Inner diamond */}
        <path
          d="M50 30 L62 50 L50 70 L38 50 Z"
          fill="white"
          opacity="0.2"
        />
        <path
          d="M50 35 L58 50 L50 65 L42 50 Z"
          fill="white"
          opacity="0.15"
        />
      </svg>
      {/* Center icon */}
      <span className="relative z-10" style={{ fontSize: size * 0.32 }}>
        {league.icon}
      </span>
    </div>
  );
}

interface LeagueBannerProps {
  avatar: AvatarConfig;
  userXp: number;
  userName: string;
  onEditAvatar?: () => void;
}

export default function LeagueBanner({ avatar, userXp, userName, onEditAvatar }: LeagueBannerProps) {
  const league = getLeague(userXp);
  const nextLeague = LEAGUES[LEAGUES.indexOf(league) + 1];
  const progress = nextLeague
    ? Math.round(((userXp - league.min) / (nextLeague.min - league.min)) * 100)
    : 100;

  const allUsers = [...FAKE_USERS, { name: userName, xp: userXp, streak: 12, isUser: true }]
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-4">
      {/* Hero Banner — Avatar + League Badge */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden relative"
      >
        {/* Starfield background */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, ${league.color}15 0%, transparent 50%),
              radial-gradient(circle at 80% 60%, ${league.glow}10 0%, transparent 40%),
              radial-gradient(circle at 50% 80%, ${league.color}08 0%, transparent 60%)
            `,
          }}
        />
        {/* Decorative sparkles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: league.glow,
              left: `${10 + (i * 12) % 80}%`,
              top: `${15 + (i * 17) % 60}%`,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}

        <div className="relative z-10 p-6 flex items-center gap-5">
          {/* Avatar */}
          <button onClick={onEditAvatar} className="relative group flex-shrink-0" disabled={!onEditAvatar}>
            <div
              className="rounded-full border-2"
              style={{ borderColor: league.color, padding: 2 }}
            >
              <AvatarPreview config={avatar} size={80} />
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">edit</span>
            </div>
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-extrabold text-lg">You</p>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: league.color }}>
              {league.name} League
            </p>
            {nextLeague && (
              <div className="mt-2">
                <div className="w-full bg-surface-highest h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${league.color}, ${league.glow})` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {userXp} / {nextLeague.min} XP to {nextLeague.name}
                </p>
              </div>
            )}
          </div>

          {/* League Badge */}
          <LeagueBadge league={league} size={90} />
        </div>
      </motion.section>

      {/* Rank Ladder - horizontal scroll */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4"
      >
        <h3 className="text-foreground font-bold text-sm mb-3">Rank Ladder</h3>
        <div className="flex items-center justify-between gap-1">
          {LEAGUES.map((l, i) => {
            const isActive = league.name === l.name;
            const isUnlocked = userXp >= l.min;
            return (
              <div key={l.name} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`relative transition-all ${isActive ? "scale-125" : isUnlocked ? "scale-100" : "scale-90 opacity-40 grayscale"}`}>
                  <LeagueBadge league={l} size={isActive ? 52 : 40} />
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-foreground"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
                <span className={`text-[9px] font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {l.name}
                </span>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Rank Standings */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-foreground font-bold text-sm">Rank Standings</h3>
          <span className="text-[10px] text-muted-foreground font-bold">This Week</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-surface-high rounded-xl p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Global</p>
            <p className="text-foreground font-bold">#1,284</p>
            <p className="text-[10px] text-secondary font-bold">Top 5.2%</p>
          </div>
          <div className="bg-surface-high rounded-xl p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Regional</p>
            <p className="text-foreground font-bold">#342</p>
            <p className="text-[10px] text-primary font-bold">Top 12%</p>
          </div>
        </div>
      </motion.section>

      {/* Leaderboard */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-foreground font-bold text-sm">Leaderboard</h3>
        </div>
        {allUsers.slice(0, 8).map((user, i) => {
          const isUser = "isUser" in user;
          return (
            <div
              key={user.name}
              className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 ${
                isUser ? "bg-primary/5" : ""
              }`}
            >
              <div className={`w-7 text-center font-bold text-sm ${
                i === 0 ? "text-amber" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-amber/60" : "text-muted-foreground"
              }`}>
                {i === 0 ? "🏆" : i + 1}
              </div>

              {isUser ? (
                <AvatarPreview config={avatar} size={40} />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: `hsl(${(i * 60) % 360} 50% 30%)`,
                    color: `hsl(${(i * 60) % 360} 50% 80%)`,
                  }}
                >
                  {getInitials(user.name)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isUser ? "text-primary" : "text-foreground"}`}>
                  {isUser ? "You" : user.name}
                </p>
                {user.streak > 20 && (
                  <p className="text-[10px] text-amber">🔥 {user.streak} day streak</p>
                )}
              </div>

              <span className={`text-sm font-mono font-bold ${isUser ? "text-primary" : "text-muted-foreground"}`}>
                {user.xp.toLocaleString()} XP
              </span>
            </div>
          );
        })}
      </motion.section>
    </div>
  );
}
