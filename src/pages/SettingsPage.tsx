import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { checkPremium } from "@/lib/usageLimits";
import { supabase } from "@/integrations/supabase/client";
import AvatarCreator, { getStoredAvatar, AvatarPreview, type AvatarConfig } from "@/components/learn/AvatarCreator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import appLogo from "@/assets/app-logo.png";

const SettingsPage = () => {
  const [darkMode, setDarkMode] = useState(() => !document.documentElement.classList.contains("light"));
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [avatar, setAvatar] = useState<AvatarConfig>(getStoredAvatar);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [premium, setPremium] = useState(false);

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(localStorage.getItem("sono-user-name") || "");
  const [displayEmail, setDisplayEmail] = useState(localStorage.getItem("sono-user-email") || "");

  useEffect(() => {
    checkPremium().then(setPremium);
    // Load current values from auth + profile
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDisplayEmail(user.email || "");
        localStorage.setItem("sono-user-email", user.email || "");
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
        if (profile?.display_name) {
          setDisplayName(profile.display_name);
          localStorage.setItem("sono-user-name", profile.display_name);
        }
      }
    })();
  }, []);

  const handleThemeToggle = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    if (newDark) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("sono-theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("sono-theme", "light");
    }
  };

  const handleUpgrade = async () => {
    // Premium upgrades are handled server-side only (via payment processing).
    // This button is a placeholder for the upgrade flow.
    toast.info("Premium upgrades will be available soon! Contact support for early access.");
  };

  const openEditProfile = () => {
    setEditName(displayName);
    setEditEmail(displayEmail);
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    const name = editName.trim();
    const email = editEmail.trim().toLowerCase();
    if (!name) { toast.error("Name cannot be empty"); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Enter a valid email"); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update display name in profiles table
      const { error: profileErr } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
      if (profileErr) throw profileErr;

      // Update email via auth if changed
      if (email !== user.email) {
        const { error: emailErr } = await supabase.auth.updateUser({ email });
        if (emailErr) throw emailErr;
        toast.info("Check your new email for a confirmation link");
      }

      // Sync localStorage
      localStorage.setItem("sono-user-name", name);
      localStorage.setItem("sono-user-email", email);
      setDisplayName(name);
      setDisplayEmail(email);
      setEditOpen(false);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <motion.section
        data-tour="profile"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex flex-col items-center text-center"
      >
        <div className="relative mb-4">
          <AvatarPreview config={avatar} size={80} />
          <button
            onClick={() => setShowAvatarEditor(!showAvatarEditor)}
            className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 border-2 border-surface-lowest"
          >
            <span className="material-symbols-outlined text-xs block">edit</span>
          </button>
        </div>
        <h1 className="text-xl font-bold text-foreground">{displayName || "User"}</h1>
        <p className="text-muted-foreground text-sm mb-4">{displayEmail}</p>
        <button
          onClick={openEditProfile}
          className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-high/50 transition-all active:scale-[0.98]"
        >
          Edit Profile
        </button>
      </motion.section>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-surface-high border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Display Name</label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                maxLength={100}
                className="bg-surface-highest border-border text-foreground"
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Email</label>
              <Input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                maxLength={255}
                className="bg-surface-highest border-border text-foreground"
                placeholder="you@example.com"
              />
              <p className="text-[10px] text-muted-foreground">Changing email requires confirmation via a link sent to the new address.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Editor */}
      {showAvatarEditor && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="glass-card rounded-2xl p-6"
        >
          <AvatarCreator
            inline
            initial={avatar}
            onDone={(cfg) => {
              setAvatar(cfg);
              setShowAvatarEditor(false);
            }}
          />
        </motion.section>
      )}

      {/* Account Settings */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
          Account Settings
        </h2>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border">
          <SettingsRow icon="account_balance" iconColor="text-primary" title="Connected Banks" subtitle="Bank of America, Chase" />
          <SettingsRow icon="group" iconColor="text-secondary" title="Linked Users" subtitle="Sharing budget with JS, AL" />
        </div>
      </motion.section>

      {/* Preferences */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
          Preferences
        </h2>
        <div className="glass-card rounded-2xl p-4 space-y-5">
          <ToggleRow icon="dark_mode" title="Dark Mode" enabled={darkMode} onToggle={handleThemeToggle} />
          <ToggleRow icon="notifications" title="Notifications" enabled={notifications} onToggle={() => setNotifications(!notifications)} />
          <ToggleRow icon="fingerprint" title="Biometric Lock" enabled={biometrics} onToggle={() => setBiometrics(!biometrics)} />
        </div>
      </motion.section>

      {/* Security */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
          Security
        </h2>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border">
          <SettingsRow icon="lock" iconColor="text-primary" title="Change Password" subtitle="Last changed 30 days ago" />
          <SettingsRow icon="verified_user" iconColor="text-secondary" title="Two-Factor Auth" subtitle="Enabled via authenticator" />
          <SettingsRow icon="download" iconColor="text-muted-foreground" title="Export Data" subtitle="Download all your data" />
        </div>
      </motion.section>

      {/* ── Premium Upgrade (Brilliant-style comparison) ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="relative rounded-2xl overflow-hidden">
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-[hsl(280,60%,20%)] via-[hsl(300,50%,30%)] to-[hsl(35,80%,50%)] p-6 pb-10 text-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(35,80%,60%,0.3),transparent_70%)]" />
            <div className="relative z-10">
              <div className="mb-2">
                <img src={appLogo} alt="App Logo" className="h-10 w-auto mx-auto" />
              </div>
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Unlock the full<br />experience with
              </h2>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-[hsl(35,90%,60%)] via-[hsl(330,70%,60%)] to-[hsl(280,70%,65%)] bg-clip-text text-transparent">
                Premium
              </span>
            </div>
          </div>

          {/* Comparison table */}
          <div className="bg-surface-low p-5 -mt-4 rounded-t-2xl relative z-10">
            <div className="grid grid-cols-[1fr_70px_90px] gap-y-0 items-center">
              {/* Header row */}
              <div className="py-3">
                <span className="text-xs font-bold text-foreground">Benefits</span>
              </div>
              <div className="py-3 text-center">
                <span className="text-xs font-medium text-muted-foreground">Free</span>
              </div>
              <div className="py-3 text-center relative">
                <div className="absolute inset-x-0 -top-4 bottom-0 rounded-t-xl bg-gradient-to-b from-[hsl(280,60%,20%,0.3)] via-[hsl(35,80%,50%,0.1)] to-transparent border border-[hsl(35,80%,50%,0.2)] rounded-xl -mx-1" />
                <span className="text-xs font-bold text-foreground relative z-10">Premium</span>
              </div>

              {/* Feature rows */}
              {[
                { label: "Daily lessons", free: true, premium: true },
                { label: "Learning paths", free: true, premium: true },
                { label: "AI coaching", free: "5/day", premium: true },
                { label: "AI insights", free: "2/day", premium: true },
                { label: "Scenario practice", free: "3/day", premium: true },
                { label: "Leaderboards", free: true, premium: true },
                { label: "No restrictions", free: false, premium: true },
              ].map((row, i) => (
                <FeatureRow key={i} {...row} isLast={i === 6} />
              ))}
            </div>
          </div>
        </div>

        {/* CTA button */}
        {!premium ? (
          <button
            onClick={handleUpgrade}
            className="w-full py-3.5 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Subscribe now — $10/month
          </button>
        ) : (
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3 border-primary/20">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Premium Active</p>
              <p className="text-xs text-muted-foreground">Unlimited access to all features</p>
            </div>
          </div>
        )}
      </motion.section>

      {/* Logout */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pb-4"
      >
        <button
          onClick={async () => {
            // Clear all app state so next login feels fresh
            const keysToRemove = [
              "sono-persona", "sono-demo-seeded", "sono-tour-completed",
              "sono-user-name", "sono-user-email", "sono-bank-connected",
              "sono-avatar", "sono-completed-lessons", "sono-balance-history",
              "sono-ai-welcomed", "sono-chat-cache", "sono-weekly-digest",
              "dash_overview", "sono-theme",
            ];
            keysToRemove.forEach(k => localStorage.removeItem(k));
            await supabase.auth.signOut();
          }}
          className="w-full py-3 rounded-2xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-all active:scale-[0.98]"
        >
          Sign Out
        </button>
      </motion.section>
    </div>
  );
};

/* ── Feature Row for comparison table ── */
const FeatureRow = ({
  label,
  free,
  premium,
  isLast,
}: {
  label: string;
  free: boolean | string;
  premium: boolean;
  isLast: boolean;
}) => (
  <>
    <div className={`py-3.5 ${!isLast ? "border-b border-border" : ""}`}>
      <span className="text-sm text-foreground">{label}</span>
    </div>
    <div className={`py-3.5 flex justify-center ${!isLast ? "border-b border-border" : ""}`}>
      {typeof free === "string" ? (
        <span className="text-xs font-medium text-muted-foreground">{free}</span>
      ) : free ? (
        <CheckIcon active={false} />
      ) : (
        <XIcon />
      )}
    </div>
    <div className={`py-3.5 flex justify-center relative ${!isLast ? "border-b border-border" : ""}`}>
      <div className="absolute inset-x-0 inset-y-0 bg-gradient-to-b from-transparent via-[hsl(280,60%,20%,0.05)] to-transparent -mx-1" />
      <CheckIcon active />
    </div>
  </>
);

const CheckIcon = ({ active }: { active: boolean }) => (
  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
    active ? "bg-amber/20" : "bg-muted/50"
  }`}>
    <span className={`material-symbols-outlined text-sm ${active ? "text-amber" : "text-muted-foreground"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
      check_circle
    </span>
  </div>
);

const XIcon = () => (
  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-muted/30">
    <span className="material-symbols-outlined text-sm text-muted-foreground/50" style={{ fontVariationSettings: "'FILL' 1" }}>
      cancel
    </span>
  </div>
);

const SettingsRow = ({
  icon,
  iconColor,
  title,
  subtitle,
}: {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
}) => (
  <div className="flex items-center justify-between p-4 hover:bg-surface-high/50 transition-colors cursor-pointer group">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-high/50">
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    <span className="material-symbols-outlined text-muted-foreground group-hover:translate-x-0.5 transition-transform">
      chevron_right
    </span>
  </div>
);

const ToggleRow = ({
  icon,
  title,
  enabled,
  onToggle,
}: {
  icon: string;
  title: string;
  enabled: boolean;
  onToggle: () => void;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-high/50">
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
    </div>
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${
        enabled ? "bg-primary" : "bg-surface-highest"
      }`}
    >
      <motion.div
        className="w-4 h-4 bg-foreground rounded-full absolute top-1"
        animate={{ left: enabled ? 24 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  </div>
);

export default SettingsPage;
