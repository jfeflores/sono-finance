import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Home", icon: "home" },
  { id: "dashboard", label: "Budget", icon: "bar_chart" },
  { id: "learn", label: "Learn", icon: "school" },
  { id: "library", label: "Library", icon: "menu_book" },
  { id: "settings", label: "More", icon: "menu" },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center max-w-2xl mx-auto px-3 py-2 gap-2">
        {/* Main nav pill */}
        <div className="flex-1 flex items-center justify-around bg-surface/90 backdrop-blur-xl rounded-2xl border border-border h-14 px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[48px]"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-surface-highest/80 border border-border"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={`material-symbols-outlined text-[20px] relative z-10 transition-colors duration-200 ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                  style={{
                    fontVariationSettings: isActive
                      ? "'FILL' 1, 'wght' 500"
                      : "'FILL' 0, 'wght' 300",
                  }}
                >
                  {tab.icon}
                </span>
                <span
                  className={`text-[9px] font-semibold relative z-10 transition-colors duration-200 mt-0.5 ${
                    isActive ? "text-foreground" : "text-muted-foreground/70"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* AI Star button - opens full-page assistant */}
        <button
          onClick={() => onTabChange("assistant")}
          className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-200 active:scale-95 ${
            activeTab === "assistant"
              ? "bg-primary/20 border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              : "bg-surface/90 backdrop-blur-xl border-border hover:border-primary/30"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] transition-colors duration-200 ${
              activeTab === "assistant" ? "text-primary" : "text-muted-foreground"
            }`}
            style={{
              fontVariationSettings: activeTab === "assistant"
                ? "'FILL' 1, 'wght' 500"
                : "'FILL' 0, 'wght' 300",
            }}
          >
            auto_awesome
          </span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
