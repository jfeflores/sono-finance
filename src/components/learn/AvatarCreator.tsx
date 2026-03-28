import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SKIN_TONES = ["#FFDBB4", "#E8B98D", "#C68642", "#8D5524", "#4A2C0A", "#F5D6C3"];
const HAIR_COLORS = ["#2C1B18", "#4A2C0A", "#8B4513", "#D4A76A", "#E8C07A", "#C0392B", "#8E44AD", "#2980B9"];
const EXPRESSIONS = ["😊", "😎", "🤓", "😤", "🥳", "😏", "🧐", "💪"];
const ACCESSORIES = ["none", "glasses", "shades", "headband", "cap"];
const BG_COLORS = [
  "hsl(216 100% 71%)", // primary
  "hsl(163 100% 76%)", // secondary
  "hsl(36 90% 55%)",   // amber
  "hsl(263 85% 75%)",  // purple
  "hsl(3 93% 71%)",    // red
  "hsl(142 71% 58%)",  // green
];

export interface AvatarConfig {
  skinTone: string;
  hairColor: string;
  expression: string;
  accessory: string;
  bgColor: string;
}

const DEFAULT_AVATAR: AvatarConfig = {
  skinTone: SKIN_TONES[2],
  hairColor: HAIR_COLORS[0],
  expression: EXPRESSIONS[0],
  accessory: "none",
  bgColor: BG_COLORS[0],
};

export function getStoredAvatar(): AvatarConfig {
  try {
    const saved = localStorage.getItem("sono-avatar");
    return saved ? JSON.parse(saved) : DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

function saveAvatar(config: AvatarConfig) {
  localStorage.setItem("sono-avatar", JSON.stringify(config));
}

interface AvatarCreatorProps {
  onDone: (config: AvatarConfig) => void;
  initial?: AvatarConfig;
  inline?: boolean;
}

function AvatarPreview({ config, size = 80 }: { config: AvatarConfig; size?: number }) {
  const accessoryEmoji = config.accessory === "glasses" ? "🤓" : config.accessory === "shades" ? "😎" : config.accessory === "headband" ? "🎀" : config.accessory === "cap" ? "🧢" : "";

  return (
    <div
      className="rounded-full flex items-center justify-center relative overflow-hidden"
      style={{
        width: size,
        height: size,
        background: config.bgColor,
      }}
    >
      {/* Face base */}
      <div
        className="rounded-full absolute"
        style={{
          width: size * 0.65,
          height: size * 0.65,
          background: config.skinTone,
          top: "22%",
        }}
      />
      {/* Hair */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.7,
          height: size * 0.35,
          background: config.hairColor,
          top: "10%",
          borderRadius: "50% 50% 30% 30%",
        }}
      />
      {/* Expression */}
      <span className="absolute" style={{ fontSize: size * 0.35, top: "32%" }}>
        {config.expression}
      </span>
      {/* Accessory badge */}
      {accessoryEmoji && (
        <span className="absolute" style={{ fontSize: size * 0.2, top: "8%", right: "15%" }}>
          {accessoryEmoji}
        </span>
      )}
    </div>
  );
}

export { AvatarPreview };

type TabId = "skin" | "hair" | "face" | "accessory" | "bg";

export default function AvatarCreator({ onDone, initial, inline }: AvatarCreatorProps) {
  const [config, setConfig] = useState<AvatarConfig>(initial || getStoredAvatar());
  const [tab, setTab] = useState<TabId>("skin");

  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: "skin", icon: "palette", label: "Skin" },
    { id: "hair", icon: "face_4", label: "Hair" },
    { id: "face", icon: "mood", label: "Face" },
    { id: "accessory", icon: "checkroom", label: "Gear" },
    { id: "bg", icon: "circle", label: "Color" },
  ];

  const handleDone = () => {
    saveAvatar(config);
    onDone(config);
  };

  if (inline) {
    return (
      <div className="flex flex-col items-center">
        <div className="mb-6">
          <AvatarPreview config={config} size={120} />
        </div>
        <div className="flex gap-1 bg-surface-high rounded-xl p-1 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs transition-all ${tab === t.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <span className="material-symbols-outlined text-lg">{t.icon}</span>
              <span className="text-[9px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-4 gap-3 w-full max-w-sm mb-6">
            {tab === "skin" && SKIN_TONES.map(c => <button key={c} onClick={() => setConfig(p => ({ ...p, skinTone: c }))} className={`w-14 h-14 rounded-xl border-2 transition-all mx-auto ${config.skinTone === c ? "border-primary scale-110" : "border-transparent"}`} style={{ background: c }} />)}
            {tab === "hair" && HAIR_COLORS.map(c => <button key={c} onClick={() => setConfig(p => ({ ...p, hairColor: c }))} className={`w-14 h-14 rounded-xl border-2 transition-all mx-auto ${config.hairColor === c ? "border-primary scale-110" : "border-transparent"}`} style={{ background: c }} />)}
            {tab === "face" && EXPRESSIONS.map(e => <button key={e} onClick={() => setConfig(p => ({ ...p, expression: e }))} className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl transition-all mx-auto ${config.expression === e ? "border-primary bg-primary/10 scale-110" : "border-border bg-surface-high"}`}>{e}</button>)}
            {tab === "accessory" && ACCESSORIES.map(a => <button key={a} onClick={() => setConfig(p => ({ ...p, accessory: a }))} className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xs font-bold capitalize transition-all mx-auto ${config.accessory === a ? "border-primary bg-primary/10 text-primary scale-110" : "border-border bg-surface-high text-muted-foreground"}`}>{a === "none" ? "✕" : a === "glasses" ? "🤓" : a === "shades" ? "😎" : a === "headband" ? "🎀" : "🧢"}</button>)}
            {tab === "bg" && BG_COLORS.map(c => <button key={c} onClick={() => setConfig(p => ({ ...p, bgColor: c }))} className={`w-14 h-14 rounded-full border-2 transition-all mx-auto ${config.bgColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ background: c }} />)}
          </motion.div>
        </AnimatePresence>
        <button onClick={handleDone} className="w-full max-w-sm bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
          Save Avatar
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[60] bg-surface-lowest/95 backdrop-blur-xl flex flex-col items-center pt-12 px-4"
    >
      <div className="flex items-center justify-between w-full max-w-sm mb-6">
        <span className="text-muted-foreground text-sm">Create Avatar</span>
        <button onClick={handleDone} className="text-primary font-bold text-sm">DONE</button>
      </div>

      {/* Preview */}
      <div className="mb-8">
        <AvatarPreview config={config} size={120} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-high rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs transition-all ${
              tab === t.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            <span className="text-[9px] font-bold">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Options grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="grid grid-cols-4 gap-3 w-full max-w-sm"
        >
          {tab === "skin" && SKIN_TONES.map(c => (
            <button
              key={c}
              onClick={() => setConfig(p => ({ ...p, skinTone: c }))}
              className={`w-14 h-14 rounded-xl border-2 transition-all mx-auto ${
                config.skinTone === c ? "border-primary scale-110" : "border-transparent"
              }`}
              style={{ background: c }}
            />
          ))}
          {tab === "hair" && HAIR_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setConfig(p => ({ ...p, hairColor: c }))}
              className={`w-14 h-14 rounded-xl border-2 transition-all mx-auto ${
                config.hairColor === c ? "border-primary scale-110" : "border-transparent"
              }`}
              style={{ background: c }}
            />
          ))}
          {tab === "face" && EXPRESSIONS.map(e => (
            <button
              key={e}
              onClick={() => setConfig(p => ({ ...p, expression: e }))}
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl transition-all mx-auto ${
                config.expression === e ? "border-primary bg-primary/10 scale-110" : "border-border bg-surface-high"
              }`}
            >
              {e}
            </button>
          ))}
          {tab === "accessory" && ACCESSORIES.map(a => (
            <button
              key={a}
              onClick={() => setConfig(p => ({ ...p, accessory: a }))}
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xs font-bold capitalize transition-all mx-auto ${
                config.accessory === a ? "border-primary bg-primary/10 text-primary scale-110" : "border-border bg-surface-high text-muted-foreground"
              }`}
            >
              {a === "none" ? "✕" : a === "glasses" ? "🤓" : a === "shades" ? "😎" : a === "headband" ? "🎀" : "🧢"}
            </button>
          ))}
          {tab === "bg" && BG_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setConfig(p => ({ ...p, bgColor: c }))}
              className={`w-14 h-14 rounded-full border-2 transition-all mx-auto ${
                config.bgColor === c ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ background: c }}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
