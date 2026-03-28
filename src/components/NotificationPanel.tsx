import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "info" | "alert" | "success" | "promo";
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", icon: "trending_up", title: "Market Update", body: "S&P 500 is up 1.2% today. Your portfolio benefits from this trend.", time: "2m ago", read: false, type: "info" },
  { id: "2", icon: "savings", title: "Savings Milestone!", body: "You've reached 84% of your savings goal. Keep it up!", time: "1h ago", read: false, type: "success" },
  { id: "3", icon: "warning", title: "Budget Alert", body: "Shopping category is at 85% — $60 remaining this month.", time: "3h ago", read: false, type: "alert" },
  { id: "4", icon: "local_fire_department", title: "Streak Reminder", body: "Complete a lesson today to keep your 12-day streak alive!", time: "5h ago", read: true, type: "info" },
  { id: "5", icon: "workspace_premium", title: "Unlock Pro", body: "Get unlimited AI insights, scenarios & coaching for $10/mo.", time: "1d ago", read: true, type: "promo" },
  { id: "6", icon: "receipt_long", title: "Bill Due Soon", body: "Electric bill of $127.50 is due in 3 days.", time: "1d ago", read: true, type: "alert" },
];

const typeColors: Record<string, string> = {
  info: "text-primary",
  alert: "text-amber",
  success: "text-secondary",
  promo: "text-purple",
};

const typeBg: Record<string, string> = {
  info: "bg-primary/10",
  alert: "bg-amber/10",
  success: "bg-secondary/10",
  promo: "bg-purple/10",
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-14 right-2 left-2 sm:left-auto sm:right-4 sm:w-[380px] z-[70] max-h-[75vh] flex flex-col rounded-2xl border border-border bg-surface-low shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
              >
                Mark all read
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {notifications.map((n, i) => (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-5 py-4 flex gap-3 transition-colors hover:bg-surface-high/50 ${
                    !n.read ? "bg-surface-high/30" : ""
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeBg[n.type]}`}>
                    <span className={`material-symbols-outlined text-lg ${typeColors[n.type]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {n.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{n.time}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
