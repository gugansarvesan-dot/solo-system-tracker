// app/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { systemAudio } from "./system-fx";

type StatKey = "INT" | "CRAFT" | "DEX" | "STR" | "STA";
type TabKey = "STATUS" | "QUESTS" | "GRIMOIRE" | "SHADOWS";

interface Quest {
  id: string;
  title: string;
  tag: string;
  xp: number;
  stat: StatKey;
  statGain: number;
  completed: boolean;
}

interface SubTopic {
  id: string;
  title: string;
  done: boolean;
}

interface ResourceItem {
  id: string;
  label: string;
  urlOrNote: string;
  type: "LINK" | "NOTE";
}

interface SubjectFolder {
  id: string;
  name: string;
  category: string;
  topics: SubTopic[];
  resources: ResourceItem[];
}

interface ShadowSoldier {
  id: string;
  name: string;
  rank: string;
  role: string;
  requirement: string;
  unlockType: "LEVEL" | "STREAK" | "QUESTS";
  unlockValue: number;
  extracted: boolean;
}

interface RewardItem {
  id: string;
  title: string;
  rarity: "RARE" | "EPIC" | "LEGENDARY";
}

const DEFAULT_QUESTS: Quest[] = [
  {
    id: "q1",
    title: "2-Hr Part A PYQ / Mock Sprint (9 AM - 11 AM)",
    tag: "UCEED / NID",
    xp: 60,
    stat: "INT",
    statGain: 2,
    completed: false,
  },
  {
    id: "q2",
    title: "1-Hr Part B / NID Sketching & Storyboard Drill",
    tag: "DESIGN",
    xp: 60,
    stat: "CRAFT",
    statGain: 2,
    completed: false,
  },
  {
    id: "q3",
    title: "50 Freehand Perspective Lines + 10 Human Figures",
    tag: "SKILL",
    xp: 35,
    stat: "DEX",
    statGain: 1,
    completed: false,
  },
  {
    id: "q4",
    title: "Workout: 50 Pushups, 50 Squats, 50 Sit-ups & 2km Run",
    tag: "PHYSICAL",
    xp: 45,
    stat: "STR",
    statGain: 2,
    completed: false,
  },
  {
    id: "q5",
    title: "Error Log Audit + Zero Distraction Deep Work",
    tag: "DISCIPLINE",
    xp: 30,
    stat: "STA",
    statGain: 1,
    completed: false,
  },
];

const DEFAULT_GRIMOIRE: SubjectFolder[] = [
  {
    id: "sub-1",
    name: "UCEED Part A — Spatial & Visualization",
    category: "UCEED 2027",
    topics: [
      { id: "t1", title: "3D Cube Counting & Surface Folding", done: false },
      { id: "t2", title: "Mechanical Gears, Pulleys & Levers", done: false },
      { id: "t3", title: "2D-to-3D Orthographic Projections", done: false },
    ],
    resources: [
      {
        id: "r1",
        label: "Official UCEED Previous Year Papers",
        urlOrNote: "https://www.uceed.iitb.ac.in",
        type: "LINK",
      },
      {
        id: "r2",
        label: "NAT Rule Reminder",
        urlOrNote: "No negative marking on NATs—attempt every single NAT question!",
        type: "NOTE",
      },
    ],
  },
  {
    id: "sub-2",
    name: "NID DAT Prelims — Sketching & Storyboard",
    category: "NID PRELIMS",
    topics: [
      { id: "t4", title: "1-Point & 2-Point Street Perspective", done: false },
      { id: "t5", title: "4-Frame Sequential Storyboarding", done: false },
      { id: "t6", title: "Product Redesign & Ergonomics Ideation", done: false },
    ],
    resources: [
      {
        id: "r3",
        label: "Line Quality Drill",
        urlOrNote: "Use bold confident strokes; avoid hairy/feathered lines.",
        type: "NOTE",
      },
    ],
  },
];

const DEFAULT_SHADOWS: ShadowSoldier[] = [
  {
    id: "sh-igris",
    name: "IGRIS",
    rank: "KNIGHT GRADE",
    role: "Blood-Red Commander of Focus",
    requirement: "Reach Hunter Level 2",
    unlockType: "LEVEL",
    unlockValue: 2,
    extracted: false,
  },
  {
    id: "sh-tank",
    name: "TANK",
    rank: "ELITE GRADE",
    role: "Juggernaut of Endurance",
    requirement: "Complete 5 Total Quests",
    unlockType: "QUESTS",
    unlockValue: 5,
    extracted: false,
  },
  {
    id: "sh-iron",
    name: "IRON",
    rank: "ELITE KNIGHT",
    role: "Vanguard of Iron Discipline",
    requirement: "Hit a 3-Day Daily Streak",
    unlockType: "STREAK",
    unlockValue: 3,
    extracted: false,
  },
  {
    id: "sh-beru",
    name: "BERU",
    rank: "MARSHAL GRADE",
    role: "Apex Ant King of AIR < 100",
    requirement: "Reach Hunter Level 5",
    unlockType: "LEVEL",
    unlockValue: 5,
    extracted: false,
  },
];

const DEFAULT_REWARDS: RewardItem[] = [
  { id: "rw1", title: "1-Hour Guilt-Free Gaming / Anime Pass", rarity: "RARE" },
  { id: "rw2", title: "Favorite Cheat Snack / Cold Coffee", rarity: "RARE" },
  { id: "rw3", title: "30-Min Freestyle Art / Music Jam", rarity: "EPIC" },
  { id: "rw4", title: "Movie Night Ticket (Weekend)", rarity: "LEGENDARY" },
];

function getRankTitle(level: number): { rank: string; title: string; monarch: boolean } {
  if (level >= 15) return { rank: "S-RANK", title: "Shadow Monarch", monarch: true };
  if (level >= 10) return { rank: "A-RANK", title: "National Level Aspirant", monarch: true };
  if (level >= 7) return { rank: "B-RANK", title: "High-Rank Designer", monarch: false };
  if (level >= 4) return { rank: "C-RANK", title: "Awakened Tactician", monarch: false };
  if (level >= 2) return { rank: "D-RANK", title: "Iron-Will Hunter", monarch: false };
  return { rank: "E-RANK", title: "Initiate Hunter", monarch: false };
}

function getDaysUntil(targetDateStr: string): number {
  const now = new Date();
  const target = new Date(targetDateStr);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Stylized 3D-layered Shadow Monarch (Jinwoo) SVG Art
function ShadowMonarchArt({ activeArise = false }: { activeArise?: boolean }) {
  return (
    <div className="relative flex items-center justify-center select-none">
      <div
        className={`absolute h-56 w-56 rounded-full border border-purple-500/30 transition-all duration-700 ${
          activeArise ? "scale-125 animate-ping bg-purple-600/20" : "animate-pulse bg-purple-950/20"
        }`}
      />
      <div className="absolute h-44 w-44 rounded-full border border-cyan-400/30 shadow-[0_0_50px_rgba(168,85,247,0.55)]" />

      <svg
        viewBox="0 0 240 240"
        className={`relative z-10 h-52 w-52 drop-shadow-[0_0_24px_rgba(168,85,247,0.85)] transition-transform duration-500 ${
          activeArise ? "scale-110" : "hover:scale-105"
        }`}
      >
        <defs>
          <radialGradient id="monarchAura" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#9333ea" stopOpacity="0.65" />
            <stop offset="55%" stopColor="#1e1b4b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#040812" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cloakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="120" cy="120" r="110" fill="url(#monarchAura)" />

        <path d="M45 210 Q30 140 65 95 Q55 145 75 210 Z" fill="#581c87" opacity="0.45" />
        <path d="M195 210 Q210 140 175 95 Q185 145 165 210 Z" fill="#581c87" opacity="0.45" />
        <path d="M70 220 Q60 120 90 70 Q82 140 98 220 Z" fill="#7e22ce" opacity="0.35" />
        <path d="M170 220 Q180 120 150 70 Q158 140 142 220 Z" fill="#7e22ce" opacity="0.35" />

        <path
          d="M48 225 L66 142 L95 128 L120 152 L145 128 L174 142 L192 225 Z"
          fill="url(#cloakGrad)"
          stroke="#7c3aed"
          strokeWidth="1.5"
        />
        <path d="M76 146 L86 112 L104 134 Z" fill="#090d1a" stroke="#a855f7" strokeWidth="1.2" />
        <path d="M164 146 L154 112 L136 134 Z" fill="#090d1a" stroke="#a855f7" strokeWidth="1.2" />

        <path d="M107 118 L109 144 L120 152 L131 144 L133 118 Z" fill="#0f172a" />
        <path
          d="M93 78 L96 106 L120 124 L144 106 L147 78 Z"
          fill="#0b1120"
          stroke="#38bdf8"
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />

        <path
          d="M84 86 Q82 48 118 42 Q156 44 156 86 L149 74 L142 88 L131 68 L120 86 L109 67 L98 87 L91 73 Z"
          fill="#030712"
          stroke="#6366f1"
          strokeWidth="1"
        />

        <g filter="url(#eyeGlow)">
          <polygon points="100,88 113,92 102,94" fill="#e879f9" />
          <polygon points="140,88 127,92 138,94" fill="#e879f9" />
          <line x1="78" y1="84" x2="112" y2="92" stroke="#c084fc" strokeWidth="1.3" opacity="0.85" />
          <line x1="162" y1="84" x2="128" y2="92" stroke="#c084fc" strokeWidth="1.3" opacity="0.85" />
        </g>
      </svg>
    </div>
  );
}

export default function SoloSystemApp() {
  const [showBootIntro, setShowBootIntro] = useState(true);
  const [ariseTriggered, setAriseTriggered] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>("STATUS");
  const [muted, setMuted] = useState(false);

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalCompletedCount, setTotalCompletedCount] = useState(0);
  const [unassignedPoints, setUnassignedPoints] = useState(0);
  const [stats, setStats] = useState<Record<StatKey, number>>({
    INT: 10,
    CRAFT: 10,
    DEX: 10,
    STR: 10,
    STA: 10,
  });

  const [quests, setQuests] = useState<Quest[]>(DEFAULT_QUESTS);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestStat, setNewQuestStat] = useState<StatKey>("INT");

  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [selectedPresetMins, setSelectedPresetMins] = useState(25);

  const [grimoire, setGrimoire] = useState<SubjectFolder[]>(DEFAULT_GRIMOIRE);
  const [activeFolderId, setActiveFolderId] = useState<string>("sub-1");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderCat, setNewFolderCat] = useState("UCEED 2027");
  const [newTopicText, setNewTopicText] = useState("");
  const [newResLabel, setNewResLabel] = useState("");
  const [newResValue, setNewResValue] = useState("");
  const [newResType, setNewResType] = useState<"LINK" | "NOTE">("LINK");

  const [shadows, setShadows] = useState<ShadowSoldier[]>(DEFAULT_SHADOWS);
  const [chestsAvailable, setChestsAvailable] = useState(1);
  const [rewards, setRewards] = useState<RewardItem[]>(DEFAULT_REWARDS);
  const [newRewardTitle, setNewRewardTitle] = useState("");

  const [levelUpModal, setLevelUpModal] = useState<{ level: number; rank: string } | null>(null);
  const [ariseCutscene, setAriseCutscene] = useState<ShadowSoldier | null>(null);
  const [lootModal, setLootModal] = useState<RewardItem | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [midnightClock, setMidnightClock] = useState("00:00:00");

  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("solo_system_v2_state");
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.level === "number") setLevel(data.level);
        if (typeof data.xp === "number") setXp(data.xp);
        if (typeof data.streak === "number") setStreak(data.streak);
        if (typeof data.totalCompletedCount === "number") setTotalCompletedCount(data.totalCompletedCount);
        if (typeof data.unassignedPoints === "number") setUnassignedPoints(data.unassignedPoints);
        if (data.stats) setStats(data.stats);
        if (Array.isArray(data.quests)) setQuests(data.quests);
        if (Array.isArray(data.grimoire) && data.grimoire.length > 0) {
          setGrimoire(data.grimoire);
          setActiveFolderId(data.grimoire[0].id);
        }
        if (Array.isArray(data.shadows)) setShadows(data.shadows);
        if (typeof data.chestsAvailable === "number") setChestsAvailable(data.chestsAvailable);
        if (Array.isArray(data.rewards)) setRewards(data.rewards);
      }
    } catch {
      // Ignore parse error
    }
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(
        "solo_system_v2_state",
        JSON.stringify({
          level,
          xp,
          streak,
          totalCompletedCount,
          unassignedPoints,
          stats,
          quests,
          grimoire,
          shadows,
          chestsAvailable,
          rewards,
        })
      );
    } catch {
      // Ignore storage error
    }
  }, [level, xp, streak, totalCompletedCount, unassignedPoints, stats, quests, grimoire, shadows, chestsAvailable, rewards]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(diff / 3600)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      setMidnightClock(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          grantXp(selectedPresetMins >= 60 ? 65 : 35, "STA", 1);
          return selectedPresetMins * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  });

  const xpNeeded = level * 100;
  const rankInfo = getRankTitle(level);
  const nidDaysLeft = getDaysUntil("2026-12-20T09:00:00");
  const uceedDaysLeft = getDaysUntil("2027-01-18T09:00:00");

  const handleAwakenArise = () => {
    setAriseTriggered(true);
    setScreenShake(true);
    systemAudio.playArise();
    setTimeout(() => setScreenShake(false), 650);
    setTimeout(() => {
      setShowBootIntro(false);
      setAriseTriggered(false);
    }, 1750);
  };

  const grantXp = (amount: number, statKey?: StatKey, statAmount = 0) => {
    if (statKey && statAmount > 0) {
      setStats((prev) => ({ ...prev, [statKey]: prev[statKey] + statAmount }));
    }

    setXp((prevXp) => {
      let currentXp = prevXp + amount;
      let currentLevel = level;
      let levelsGained = 0;

      while (currentXp >= currentLevel * 100) {
        currentXp -= currentLevel * 100;
        currentLevel += 1;
        levelsGained += 1;
      }

      if (levelsGained > 0) {
        setLevel(currentLevel);
        setUnassignedPoints((pts) => pts + levelsGained * 3);
        const newRank = getRankTitle(currentLevel).rank;
        setLevelUpModal({ level: currentLevel, rank: newRank });
        systemAudio.playLevelUp();
      } else {
        systemAudio.playQuestComplete();
      }

      return currentXp;
    });
  };

  const toggleQuest = (id: string) => {
    setQuests((prev) => {
      const updated = prev.map((q) => {
        if (q.id !== id) return q;
        const nextDone = !q.completed;
        if (nextDone) {
          grantXp(q.xp, q.stat, q.statGain);
          setTotalCompletedCount((c) => c + 1);
        }
        return { ...q, completed: nextDone };
      });

      const allDoneNow = updated.length > 0 && updated.every((q) => q.completed);
      const wasAllDoneBefore = prev.length > 0 && prev.every((q) => q.completed);
      if (allDoneNow && !wasAllDoneBefore) {
        setStreak((s) => s + 1);
        setChestsAvailable((c) => c + 1);
      }
      return updated;
    });
  };

  const handleAddQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestTitle.trim()) return;
    systemAudio.playClick();
    setQuests((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        title: newQuestTitle.trim(),
        tag: "CUSTOM",
        xp: 40,
        stat: newQuestStat,
        statGain: 1,
        completed: false,
      },
    ]);
    setNewQuestTitle("");
  };

  const allocateStatPoint = (stat: StatKey) => {
    if (unassignedPoints <= 0) return;
    systemAudio.playClick();
    setUnassignedPoints((p) => p - 1);
    setStats((prev) => ({ ...prev, [stat]: prev[stat] + 1 }));
  };

  const addFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    systemAudio.playClick();
    const id = `sub-${Date.now()}`;
    setGrimoire((prev) => [
      ...prev,
      { id, name: newFolderName.trim(), category: newFolderCat, topics: [], resources: [] },
    ]);
    setActiveFolderId(id);
    setNewFolderName("");
  };

  const addTopicToActiveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicText.trim()) return;
    systemAudio.playClick();
    setGrimoire((prev) =>
      prev.map((f) =>
        f.id === activeFolderId
          ? {
              ...f,
              topics: [...f.topics, { id: `top-${Date.now()}`, title: newTopicText.trim(), done: false }],
            }
          : f
      )
    );
    setNewTopicText("");
  };

  const toggleSubTopic = (folderId: string, topicId: string) => {
    setGrimoire((prev) =>
      prev.map((f) => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          topics: f.topics.map((t) => {
            if (t.id !== topicId) return t;
            if (!t.done) grantXp(25, "INT", 1);
            return { ...t, done: !t.done };
          }),
        };
      })
    );
  };

  const addResourceToActiveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResLabel.trim() || !newResValue.trim()) return;
    systemAudio.playClick();
    setGrimoire((prev) =>
      prev.map((f) =>
        f.id === activeFolderId
          ? {
              ...f,
              resources: [
                ...f.resources,
                {
                  id: `res-${Date.now()}`,
                  label: newResLabel.trim(),
                  urlOrNote: newResValue.trim(),
                  type: newResType,
                },
              ],
            }
          : f
      )
    );
    setNewResLabel("");
    setNewResValue("");
  };

  const extractShadow = (soldier: ShadowSoldier) => {
    setScreenShake(true);
    systemAudio.playArise();
    setAriseCutscene(soldier);
    setShadows((prev) => prev.map((s) => (s.id === soldier.id ? { ...s, extracted: true } : s)));
    setTimeout(() => setScreenShake(false), 700);
  };

  const openRewardChest = () => {
    if (chestsAvailable <= 0 || rewards.length === 0) return;
    setChestsAvailable((c) => c - 1);
    systemAudio.playLootOpen();
    const pick = rewards[Math.floor(Math.random() * rewards.length)];
    setLootModal(pick);
  };

  const statKeys: StatKey[] = ["INT", "CRAFT", "DEX", "STR", "STA"];
  const maxRadarVal = Math.max(25, ...Object.values(stats));
  const radarPoints = statKeys
    .map((key, idx) => {
      const angle = (Math.PI * 2 * idx) / 5 - Math.PI / 2;
      const ratio = Math.min(1, stats[key] / maxRadarVal);
      const r = 18 + ratio * 52;
      const x = 90 + r * Math.cos(angle);
      const y = 90 + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  const activeFolder = grimoire.find((f) => f.id === activeFolderId) || grimoire[0];
  const completedToday = quests.filter((q) => q.completed).length;

  if (showBootIntro) {
    return (
      <div
        className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#03050c] px-6 text-white select-none ${
          screenShake ? "animate-bounce" : ""
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(139,92,246,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.2) 1px, transparent 1px)",
            backgroundSize: "38px 38px",
            transform: "perspective(500px) rotateX(45deg) scale(1.4)",
            transformOrigin: "bottom",
          }}
        />
        <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-purple-700/25 blur-3xl" />

        <div className="z-10 mb-3 border border-purple-500/40 bg-purple-950/40 px-4 py-1 text-[11px] font-bold tracking-[0.28em] text-purple-300 uppercase shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          [ SYSTEM // SHADOW MONARCH PROTOCOL ]
        </div>

        <ShadowMonarchArt activeArise={ariseTriggered} />

        <div className="z-10 mt-4 text-center">
          <h1
            className={`font-black tracking-[0.22em] transition-all duration-300 ${
              ariseTriggered
                ? "scale-125 text-5xl text-purple-300 drop-shadow-[0_0_35px_rgba(192,132,252,1)]"
                : "text-4xl text-white drop-shadow-[0_0_18px_rgba(56,189,248,0.8)]"
            }`}
          >
            {ariseTriggered ? "“ARISE.”" : "WELCOME, PLAYER"}
          </h1>
          <p className="mt-2 text-xs tracking-widest text-slate-400 uppercase">
            NID Prelims: <span className="font-bold text-cyan-300">{nidDaysLeft}D</span> • UCEED 2027:{" "}
            <span className="font-bold text-purple-300">{uceedDaysLeft}D</span>
          </p>
        </div>

        <button
          onClick={handleAwakenArise}
          disabled={ariseTriggered}
          className="group relative z-10 mt-8 overflow-hidden border-2 border-purple-400 bg-gradient-to-r from-purple-900/70 via-indigo-900/70 to-cyan-900/70 px-10 py-4 text-sm font-black tracking-[0.3em] text-white uppercase shadow-[0_0_35px_rgba(168,85,247,0.65)] transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative z-10">
            {ariseTriggered ? "EXTRACTING SHADOWS..." : "⚡ COMMAND: ARISE"}
          </span>
        </button>

        <button
          onClick={() => {
            systemAudio.playClick();
            setShowBootIntro(false);
          }}
          className="z-10 mt-4 text-[11px] tracking-widest text-slate-500 uppercase hover:text-slate-300"
        >
          [ Skip Intro ]
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#040711] pb-24 text-slate-100 font-mono selection:bg-purple-500/30 ${
        screenShake ? "animate-bounce" : ""
      }`}
    >
      <header className="sticky top-0 z-30 border-b border-cyan-500/25 bg-[#050917]/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2.5 w-2.5 animate-ping rounded-full bg-purple-400" />
            <div>
              <div className="text-[10px] tracking-[0.25em] text-cyan-400">SYSTEM // v2.0 MONARCH</div>
              <div className="text-xs font-bold tracking-wider text-white">
                LV.{level} • <span className="text-purple-400">{rankInfo.rank}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowBootIntro(true);
                setTimeout(() => handleAwakenArise(), 120);
              }}
              className="border border-purple-500/50 bg-purple-950/50 px-2.5 py-1 text-[10px] font-bold tracking-widest text-purple-300 hover:bg-purple-800/50"
            >
              ⚡ ARISE
            </button>
            <button
              onClick={() => {
                const next = !muted;
                setMuted(next);
                systemAudio.muted = next;
              }}
              className="border border-cyan-500/40 bg-slate-900/80 px-2.5 py-1 text-[10px] text-cyan-300"
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-cyan-500/35 bg-gradient-to-br from-[#071326] to-[#040812] p-3 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
            <div className="text-[10px] tracking-widest text-cyan-400">BOSS GATE I: NID PRELIMS</div>
            <div className="mt-1 text-xl font-black text-white">{nidDaysLeft} DAYS LEFT</div>
            <div className="text-[10px] text-slate-400">Dec 20, 2026 • Top 1,300</div>
          </div>
          <div className="border border-purple-500/40 bg-gradient-to-br from-[#160b2e] to-[#040812] p-3 shadow-[0_0_20px_rgba(168,85,247,0.16)]">
            <div className="text-[10px] tracking-widest text-purple-300">BOSS GATE II: UCEED 2027</div>
            <div className="mt-1 text-xl font-black text-white">{uceedDaysLeft} DAYS LEFT</div>
            <div className="text-[10px] text-slate-400">Jan 2027 • IIT AIR &lt; 100</div>
          </div>
        </div>

        {activeTab === "STATUS" && (
          <div className="space-y-4">
            <div className="relative overflow-hidden border border-purple-500/40 bg-gradient-to-b from-[#0b1026] to-[#050814] p-5 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div>
                  <div className="inline-block border border-purple-400/50 bg-purple-950/60 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-purple-300">
                    {rankInfo.rank} // STREAK: {streak} DAYS
                  </div>
                  <h2 className="mt-2 text-3xl font-black tracking-wider text-white">
                    LEVEL {level}
                  </h2>
                  <p className="text-xs tracking-widest text-cyan-300 uppercase">
                    CLASS: {rankInfo.title}
                  </p>

                  <div className="mt-4 w-64 max-w-full">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>EXPERIENCE (XP)</span>
                      <span>
                        {xp} / {xpNeeded} XP
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden border border-cyan-500/40 bg-slate-950">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((xp / xpNeeded) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="scale-75 sm:scale-90">
                  <ShadowMonarchArt />
                </div>
              </div>
            </div>

            {unassignedPoints > 0 && (
              <div className="animate-pulse border border-amber-400/70 bg-amber-950/30 p-3 text-center">
                <div className="text-xs font-black tracking-widest text-amber-300">
                  ★ {unassignedPoints} UNASSIGNED STAT POINT{unassignedPoints > 1 ? "S" : ""} AVAILABLE ★
                </div>
                <div className="text-[11px] text-amber-200/80">
                  Tap <span className="font-bold">[ + ]</span> below to upgrade your Hunter attributes!
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 border border-cyan-500/30 bg-[#060c1d] p-4 sm:grid-cols-2">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-1 text-[10px] tracking-widest text-cyan-400">
                  ATTRIBUTE RADAR MATRIX
                </div>
                <svg viewBox="0 0 180 180" className="h-48 w-48">
                  {[0.35, 0.65, 1].map((scale, idx) => {
                    const ringPts = statKeys
                      .map((_, i) => {
                        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                        const r = 70 * scale;
                        return `${90 + r * Math.cos(a)},${90 + r * Math.sin(a)}`;
                      })
                      .join(" ");
                    return (
                      <polygon
                        key={idx}
                        points={ringPts}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="1"
                      />
                    );
                  })}
                  <polygon
                    points={radarPoints}
                    fill="rgba(168, 85, 247, 0.32)"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  {statKeys.map((key, i) => {
                    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const lx = 90 + 81 * Math.cos(a);
                    const ly = 90 + 81 * Math.sin(a);
                    return (
                      <text
                        key={key}
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#bae6fd"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {key}
                      </text>
                    );
                  })}
                </svg>
              </div>

              <div className="flex flex-col justify-center space-y-2.5">
                {(
                  [
                    { key: "INT", desc: "Logic / PYQ Accuracy" },
                    { key: "CRAFT", desc: "Sketching / Storyboard" },
                    { key: "DEX", desc: "Perspective / 3D Lines" },
                    { key: "STR", desc: "Physical Conditioning" },
                    { key: "STA", desc: "Deep Focus Stamina" },
                  ] as { key: StatKey; desc: string }[]
                ).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between border border-slate-800 bg-slate-950/70 px-3 py-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-cyan-300">
                        {item.key}: <span className="text-base text-white">{stats[item.key]}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                    {unassignedPoints > 0 && (
                      <button
                        onClick={() => allocateStatPoint(item.key)}
                        className="border border-amber-400 bg-amber-500/20 px-2.5 py-1 text-xs font-black text-amber-300 hover:bg-amber-500/40"
                      >
                        +1
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "QUESTS" && (
          <div className="space-y-4">
            <div className="border border-cyan-500/35 bg-[#060d20] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] tracking-widest text-cyan-400">
                    DUNGEON SPRINT TIMER
                  </div>
                  <div className="mt-1 text-3xl font-black tracking-wider text-white">
                    {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:
                    {String(timerSeconds % 60).padStart(2, "0")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[25, 60, 120].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        systemAudio.playClick();
                        setTimerRunning(false);
                        setSelectedPresetMins(mins);
                        setTimerSeconds(mins * 60);
                      }}
                      className={`border px-2.5 py-1 text-[10px] font-bold ${
                        selectedPresetMins === mins
                          ? "border-purple-400 bg-purple-600/30 text-purple-200"
                          : "border-slate-700 text-slate-400"
                      }`}
                    >
                      {mins}M
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      systemAudio.playClick();
                      setTimerRunning((r) => !r);
                    }}
                    className="border border-cyan-400 bg-cyan-500/20 px-3 py-1 text-xs font-black text-cyan-200"
                  >
                    {timerRunning ? "PAUSE" : "START"}
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-cyan-500/35 bg-[#060d20] p-4">
              <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <div className="text-xs font-bold tracking-widest text-cyan-300">
                    DAILY QUEST: PREPARATION
                  </div>
                  <div className="text-[11px] text-slate-400">
                    COMPLETED: {completedToday} / {quests.length} (Clear all for +1 Reward Chest)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-400">RESET IN</div>
                  <div className="text-xs font-bold text-rose-400">{midnightClock}</div>
                </div>
              </div>

              <div className="space-y-2.5">
                {quests.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => toggleQuest(q.id)}
                    className={`flex cursor-pointer items-center justify-between border p-3 transition-all ${
                      q.completed
                        ? "border-emerald-500/40 bg-emerald-950/20 opacity-70"
                        : "border-cyan-500/30 bg-[#081229] hover:border-purple-400"
                    }`}
                  >
                    <div className="pr-3">
                      <div className="text-[10px] font-bold tracking-wider text-cyan-400">
                        [{q.tag}] +{q.xp} XP • +{q.statGain} {q.stat}
                      </div>
                      <div
                        className={`mt-0.5 text-xs font-semibold ${
                          q.completed ? "line-through text-slate-400" : "text-white"
                        }`}
                      >
                        {q.title}
                      </div>
                    </div>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center border ${
                        q.completed
                          ? "border-emerald-400 bg-emerald-500/30 text-emerald-200"
                          : "border-cyan-400/60"
                      }`}
                    >
                      {q.completed ? "✓" : ""}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddQuest} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newQuestTitle}
                  onChange={(e) => setNewQuestTitle(e.target.value)}
                  placeholder="Add custom quest..."
                  className="flex-1 border border-cyan-500/40 bg-[#040812] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
                />
                <select
                  value={newQuestStat}
                  onChange={(e) => setNewQuestStat(e.target.value as StatKey)}
                  className="border border-cyan-500/40 bg-[#040812] px-2 py-2 text-xs text-cyan-300"
                >
                  {statKeys.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="border border-cyan-400 bg-cyan-500/20 px-3 py-2 text-xs font-bold text-cyan-200"
                >
                  + ADD
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "GRIMOIRE" && (
          <div className="space-y-4">
            <div className="border border-purple-500/35 bg-[#070c1f] p-4">
              <div className="text-[10px] tracking-widest text-purple-300">
                CUSTOM SYLLABUS & RESOURCE GRIMOIRE
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {grimoire.map((folder) => {
                  const doneCount = folder.topics.filter((t) => t.done).length;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => {
                        systemAudio.playClick();
                        setActiveFolderId(folder.id);
                      }}
                      className={`border px-3 py-1.5 text-left text-xs transition-all ${
                        activeFolder?.id === folder.id
                          ? "border-purple-400 bg-purple-600/30 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                          : "border-slate-700 bg-slate-950/70 text-slate-400"
                      }`}
                    >
                      <div className="font-bold">{folder.name}</div>
                      <div className="text-[10px] text-cyan-300">
                        {folder.category} • {doneCount}/{folder.topics.length} Topics
                      </div>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={addFolder} className="mt-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="New Subject / Error Log Folder..."
                  className="flex-1 border border-slate-700 bg-[#040812] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
                />
                <select
                  value={newFolderCat}
                  onChange={(e) => setNewFolderCat(e.target.value)}
                  className="border border-slate-700 bg-[#040812] px-2 py-1.5 text-xs text-purple-300"
                >
                  <option value="UCEED 2027">UCEED 2027</option>
                  <option value="NID PRELIMS">NID PRELIMS</option>
                  <option value="ERROR LOG">ERROR LOG</option>
                </select>
                <button
                  type="submit"
                  className="border border-purple-400 bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-200"
                >
                  + FOLDER
                </button>
              </form>
            </div>

            {activeFolder && (
              <div className="space-y-4 border border-cyan-500/30 bg-[#060c1d] p-4">
                <div>
                  <div className="text-xs font-black tracking-wider text-white">
                    {activeFolder.name}
                  </div>
                  <div className="text-[10px] text-cyan-400">
                    Check off mastered topics (+25 XP & +1 INT each)
                  </div>
                </div>

                <div className="space-y-2">
                  {activeFolder.topics.length === 0 && (
                    <div className="text-xs text-slate-500">No topics yet—add your first topic below!</div>
                  )}
                  {activeFolder.topics.map((top) => (
                    <div
                      key={top.id}
                      onClick={() => toggleSubTopic(activeFolder.id, top.id)}
                      className={`flex cursor-pointer items-center justify-between border px-3 py-2 text-xs ${
                        top.done
                          ? "border-emerald-500/40 bg-emerald-950/20 text-slate-400 line-through"
                          : "border-slate-800 bg-slate-950/70 text-white hover:border-cyan-400"
                      }`}
                    >
                      <span>{top.title}</span>
                      <span className="text-cyan-300">{top.done ? "✓" : "○"}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={addTopicToActiveFolder} className="flex gap-2">
                  <input
                    type="text"
                    value={newTopicText}
                    onChange={(e) => setNewTopicText(e.target.value)}
                    placeholder="Add subtopic (e.g., Isometric Views)..."
                    className="flex-1 border border-slate-700 bg-[#040812] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="border border-cyan-400 bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-200"
                  >
                    + TOPIC
                  </button>
                </form>

                <div className="border-t border-slate-800 pt-3">
                  <div className="mb-2 text-[10px] font-bold tracking-widest text-purple-300">
                    ATTACHED FILES, DRIVE PDFs & ERROR NOTES
                  </div>
                  <div className="space-y-2">
                    {activeFolder.resources.map((res) => (
                      <div
                        key={res.id}
                        className="border border-purple-500/30 bg-[#090f24] p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-200">
                            {res.type === "LINK" ? "🔗 " : "📝 "}
                            {res.label}
                          </span>
                          <span className="text-[9px] text-slate-400">{res.type}</span>
                        </div>
                        {res.type === "LINK" ? (
                          <a
                            href={res.urlOrNote.startsWith("http") ? res.urlOrNote : `https://${res.urlOrNote}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate text-[11px] text-cyan-400 underline"
                          >
                            {res.urlOrNote}
                          </a>
                        ) : (
                          <p className="mt-1 text-[11px] text-slate-300">{res.urlOrNote}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={addResourceToActiveFolder} className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={newResType}
                        onChange={(e) => setNewResType(e.target.value as "LINK" | "NOTE")}
                        className="border border-slate-700 bg-[#040812] px-2 py-1.5 text-xs text-purple-300"
                      >
                        <option value="LINK">FILE / DRIVE LINK</option>
                        <option value="NOTE">ERROR / QUICK NOTE</option>
                      </select>
                      <input
                        type="text"
                        value={newResLabel}
                        onChange={(e) => setNewResLabel(e.target.value)}
                        placeholder="Title (e.g., UCEED 2023 Q14 Mistake)..."
                        className="flex-1 border border-slate-700 bg-[#040812] px-3 py-1.5 text-xs text-white placeholder-slate-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newResValue}
                        onChange={(e) => setNewResValue(e.target.value)}
                        placeholder={
                          newResType === "LINK"
                            ? "Paste Google Drive / PDF / YouTube URL..."
                            : "Write mistake & rule to remember..."
                        }
                        className="flex-1 border border-slate-700 bg-[#040812] px-3 py-1.5 text-xs text-white placeholder-slate-500"
                      />
                      <button
                        type="submit"
                        className="border border-purple-400 bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-200"
                      >
                        SAVE
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "SHADOWS" && (
          <div className="space-y-4">
            <div className="border border-amber-400/50 bg-gradient-to-br from-[#1f1506] to-[#050812] p-4 shadow-[0_0_25px_rgba(245,158,11,0.18)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-amber-300">
                    SYSTEM BLESSED LOOT BOXES
                  </div>
                  <div className="mt-1 text-xl font-black text-white">
                    {chestsAvailable} CHEST{chestsAvailable === 1 ? "" : "S"} READY
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Clear all Daily Quests to earn new Reward Chests
                  </div>
                </div>
                <button
                  onClick={openRewardChest}
                  disabled={chestsAvailable <= 0}
                  className={`border-2 px-4 py-2.5 text-xs font-black tracking-widest uppercase transition-all ${
                    chestsAvailable > 0
                      ? "animate-pulse border-amber-300 bg-amber-500/25 text-amber-200 hover:scale-105"
                      : "border-slate-700 bg-slate-900 text-slate-600"
                  }`}
                >
                  🎁 OPEN CHEST
                </button>
              </div>

              <div className="mt-4 border-t border-amber-500/20 pt-3">
                <div className="mb-2 text-[10px] tracking-widest text-amber-200/80">
                  YOUR CUSTOM REWARD POOL:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rewards.map((r) => (
                    <span
                      key={r.id}
                      className="border border-amber-500/30 bg-black/50 px-2 py-1 text-[10px] text-amber-100"
                    >
                      {r.title}
                    </span>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newRewardTitle.trim()) return;
                    systemAudio.playClick();
                    setRewards((prev) => [
                      ...prev,
                      { id: `rw-${Date.now()}`, title: newRewardTitle.trim(), rarity: "EPIC" },
                    ]);
                    setNewRewardTitle("");
                  }}
                  className="mt-2.5 flex gap-2"
                >
                  <input
                    type="text"
                    value={newRewardTitle}
                    onChange={(e) => setNewRewardTitle(e.target.value)}
                    placeholder="Add custom guilt-free reward..."
                    className="flex-1 border border-amber-500/30 bg-[#040812] px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    className="border border-amber-400 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-200"
                  >
                    + REWARD
                  </button>
                </form>
              </div>
            </div>

            <div className="border border-purple-500/40 bg-[#070a1a] p-4">
              <div className="mb-3">
                <div className="text-xs font-black tracking-widest text-purple-300">
                  SHADOW ARMY EXTRACTION
                </div>
                <div className="text-[11px] text-slate-400">
                  Meet milestone requirements and command <span className="text-purple-300">“ARISE”</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {shadows.map((s) => {
                  const unlocked =
                    (s.unlockType === "LEVEL" && level >= s.unlockValue) ||
                    (s.unlockType === "STREAK" && streak >= s.unlockValue) ||
                    (s.unlockType === "QUESTS" && totalCompletedCount >= s.unlockValue);

                  return (
                    <div
                      key={s.id}
                      className={`border p-3.5 transition-all ${
                        s.extracted
                          ? "border-purple-400 bg-gradient-to-br from-purple-950/60 to-[#050814] shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                          : unlocked
                          ? "border-cyan-400 bg-cyan-950/20"
                          : "border-slate-800 bg-slate-950/60 opacity-65"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black tracking-widest text-white">{s.name}</span>
                        <span className="border border-purple-500/40 px-1.5 py-0.5 text-[9px] text-purple-300">
                          {s.rank}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-300">{s.role}</div>
                      <div className="mt-2 text-[10px] text-cyan-300">Req: {s.requirement}</div>

                      <div className="mt-3">
                        {s.extracted ? (
                          <div className="text-[10px] font-bold tracking-widest text-purple-300">
                            ★ SHADOW EXTRACTED & ACTIVE
                          </div>
                        ) : unlocked ? (
                          <button
                            onClick={() => extractShadow(s)}
                            className="w-full animate-pulse border border-purple-400 bg-purple-600/40 py-1.5 text-xs font-black tracking-[0.25em] text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                          >
                            ⚡ ARISE
                          </button>
                        ) : (
                          <div className="text-[10px] tracking-widest text-slate-500">
                            [ SEALED SOUL ]
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-cyan-500/30 bg-[#040814]/95 px-2 py-2 backdrop-blur-md">
        <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1.5">
          {(
            [
              { key: "STATUS", icon: "◈", label: "STATUS" },
              { key: "QUESTS", icon: "⚔", label: "QUESTS" },
              { key: "GRIMOIRE", icon: "❖", label: "TOPICS" },
              { key: "SHADOWS", icon: "♛", label: "ARISE" },
            ] as { key: TabKey; icon: string; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                systemAudio.playClick();
                setActiveTab(tab.key);
              }}
              className={`flex flex-col items-center justify-center border py-1.5 text-[10px] font-bold tracking-widest transition-all ${
                activeTab === tab.key
                  ? "border-purple-400 bg-purple-950/60 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "border-transparent text-slate-400 hover:text-cyan-300"
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {levelUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm border-2 border-cyan-400 bg-[#050c1f] p-6 text-center shadow-[0_0_50px_rgba(56,189,248,0.65)]">
            <div className="text-xs font-bold tracking-[0.3em] text-cyan-300">
              [ SYSTEM NOTIFICATION ]
            </div>
            <h2 className="mt-3 text-4xl font-black tracking-widest text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.9)]">
              LEVEL UP!
            </h2>
            <p className="mt-2 text-sm text-purple-300">
              You reached <span className="font-black text-white">LEVEL {levelUpModal.level}</span> (
              {levelUpModal.rank})
            </p>
            <p className="mt-1 text-xs text-amber-300">+3 Unassigned Stat Points Awarded!</p>
            <button
              onClick={() => {
                systemAudio.playClick();
                setLevelUpModal(null);
                setActiveTab("STATUS");
              }}
              className="mt-6 w-full border border-cyan-400 bg-cyan-500/25 py-2.5 text-xs font-black tracking-widest text-white"
            >
              ALLOCATE STATS
            </button>
          </div>
        </div>
      )}

      {ariseCutscene && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-6 backdrop-blur-md">
          <div className="w-full max-w-sm border-2 border-purple-500 bg-[#090518] p-6 text-center shadow-[0_0_60px_rgba(168,85,247,0.85)]">
            <ShadowMonarchArt activeArise />
            <div className="mt-2 text-3xl font-black tracking-[0.28em] text-purple-300 drop-shadow-[0_0_25px_rgba(192,132,252,1)]">
              “ARISE!”
            </div>
            <p className="mt-2 text-sm font-bold text-white">
              Shadow Soldier <span className="text-purple-400">{ariseCutscene.name}</span> Joined Your
              Army!
            </p>
            <p className="mt-1 text-xs text-slate-400">{ariseCutscene.role}</p>
            <button
              onClick={() => {
                systemAudio.playClick();
                setAriseCutscene(null);
              }}
              className="mt-5 w-full border border-purple-400 bg-purple-600/35 py-2.5 text-xs font-black tracking-widest text-white"
            >
              COMMAND ARMY
            </button>
          </div>
        </div>
      )}

      {lootModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm border-2 border-amber-400 bg-[#140d04] p-6 text-center shadow-[0_0_50px_rgba(251,191,36,0.65)]">
            <div className="text-xs font-bold tracking-[0.28em] text-amber-300">
              [ BLESSED BOX OPENED ]
            </div>
            <div className="my-4 text-5xl">🎁</div>
            <div className="text-[10px] font-bold tracking-widest text-amber-400">
              {lootModal.rarity} REWARD ACQUIRED
            </div>
            <h3 className="mt-1 text-lg font-black text-white">{lootModal.title}</h3>
            <button
              onClick={() => {
                systemAudio.playClick();
                setLootModal(null);
              }}
              className="mt-6 w-full border border-amber-400 bg-amber-500/25 py-2.5 text-xs font-black tracking-widest text-amber-100"
            >
              CLAIM REWARD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
