// app/page.tsx
/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "./system-fx";
import {
  CharacterVisual,
  CHARACTER_ASSETS,
  ENTRY_WALLPAPER_ASSET,
  IGRIS_WALLPAPER_ASSETS,
  CrimsonPushupVisual,
  IgrisMockSwordVisual,
} from "./components/CharacterVisual";
import { MonarchCardHub, HubModuleKey } from "./components/MonarchCardHub";

type TimerMode = "UCEED_STUDY" | "BODY_BUILD";

interface BossRaid {
  id: string;
  name: string;
  image: string;
  maxHp: number;
  hp: number;
  xpReward: number;
  cleared: boolean;
}

interface StudyCard {
  id: string;
  front: string;
  back: string;
  tag: string;
}

const INITIAL_BOSSES: BossRaid[] = [
  {
    id: "boss-1",
    name: "SPATIAL & NAT WARDEN",
    image: CHARACTER_ASSETS[6],
    maxHp: 100,
    hp: 100,
    xpReward: 120,
    cleared: false,
  },
  {
    id: "boss-2",
    name: "PERSPECTIVE & SKETCH SOVEREIGN",
    image: CHARACTER_ASSETS[5],
    maxHp: 100,
    hp: 100,
    xpReward: 140,
    cleared: false,
  },
  {
    id: "boss-3",
    name: "FULL MOCK OVERLORD",
    image: CHARACTER_ASSETS[4],
    maxHp: 150,
    hp: 150,
    xpReward: 200,
    cleared: false,
  },
];

const INITIAL_CARDS: StudyCard[] = [
  {
    id: "c-1",
    front: "UCEED Part A — NAT Precision",
    back: "Zero negative marking on NAT questions; calculate carefully and enter a clean value.",
    tag: "UCEED",
  },
  {
    id: "c-2",
    front: "2-Point Perspective Horizon",
    back: "Keep vertical lines vertical and converge left/right planes to two horizon vanishing points.",
    tag: "SKETCH",
  },
  {
    id: "c-3",
    front: "Body-Build Set Cadence",
    back: "Controlled reps with steady breathing and crisp rest intervals between sets.",
    tag: "WORKOUT",
  },
];

function getDaysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function UceedShadowMonarchV4() {
  // Entry live wallpaper + pointer parallax
  const [entered, setEntered] = useState(false);
  const [entryImgOk, setEntryImgOk] = useState(true);
  const [igrisBgOk, setIgrisBgOk] = useState(true);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Shadow-vortex transition state when entering/switching modules
  const [vortexActive, setVortexActive] = useState(false);
  const [activeModule, setActiveModule] = useState<HubModuleKey>("POMODORO");
  const [muted, setMuted] = useState(false);

  // XP & Sessions
  const [xp, setXp] = useState(0);
  const [completedBlocks, setCompletedBlocks] = useState(0);

  // Drift-free timestamp Pomodoro (UCEED Study + Body-Build)
  const [timerMode, setTimerMode] = useState<TimerMode>("UCEED_STUDY");
  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [customWork, setCustomWork] = useState(40);
  const [customBreak, setCustomBreak] = useState(8);
  const [isBreak, setIsBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const endTimeRef = useRef<number | null>(null);

  // Mock Hunting Boss Battles
  const [bosses, setBosses] = useState<BossRaid[]>(INITIAL_BOSSES);
  const [selectedBossId, setSelectedBossId] = useState("boss-1");
  const [damageValue, setDamageValue] = useState(25);
  const [swordSlashing, setSwordSlashing] = useState(false);

  // Flashcards (create, upload JSON/CSV, flip, delete)
  const [cards, setCards] = useState<StudyCard[]>(INITIAL_CARDS);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [frontInput, setFrontInput] = useState("");
  const [backInput, setBackInput] = useState("");
  const [tagInput, setTagInput] = useState("UCEED");
  const [uploadNotice, setUploadNotice] = useState("");

  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("uceed_monarch_v4") ||
        localStorage.getItem("uceed_monarch_system_v2") ||
        localStorage.getItem("uceed_shadow_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.xp === "number") setXp(parsed.xp);
        if (typeof parsed.completedBlocks === "number") {
          setCompletedBlocks(parsed.completedBlocks);
        } else if (typeof parsed.sessionsCompleted === "number") {
          setCompletedBlocks(parsed.sessionsCompleted);
        }
        if (Array.isArray(parsed.bosses) && parsed.bosses.length > 0) {
          setBosses(parsed.bosses);
        }
        if (Array.isArray(parsed.cards)) {
          setCards(parsed.cards);
        }
      }
    } catch {}
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(
        "uceed_monarch_v4",
        JSON.stringify({ xp, completedBlocks, bosses, cards })
      );
    } catch {}
  }, [xp, completedBlocks, bosses, cards]);

  // Timestamp-accurate timer loop
  useEffect(() => {
    if (!running) {
      endTimeRef.current = null;
      return;
    }
    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + secondsLeft * 1000;
    }

    const id = setInterval(() => {
      if (!endTimeRef.current) return;
      const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setSecondsLeft(rem);

      if (rem <= 0) {
        soundEngine.playSuccess();
        soundEngine.playBassHit("HEAVY");
        if (!isBreak) {
          setCompletedBlocks((c) => c + 1);
          setXp((x) => x + (timerMode === "UCEED_STUDY" ? 55 : 45));
          const nextSec = breakMins * 60;
          setIsBreak(true);
          setSecondsLeft(nextSec);
          endTimeRef.current = Date.now() + nextSec * 1000;
        } else {
          const nextSec = focusMins * 60;
          setIsBreak(false);
          setSecondsLeft(nextSec);
          endTimeRef.current = Date.now() + nextSec * 1000;
        }
      }
    }, 250);

    return () => clearInterval(id);
  }, [running, isBreak, focusMins, breakMins, timerMode]);

  const triggerModuleEnter = (nextModule: HubModuleKey) => {
    setActiveModule(nextModule);
    setVortexActive(true);
    setTimeout(() => {
      setVortexActive(false);
    }, 460);
  };

  const switchTimerMode = (mode: TimerMode) => {
    setRunning(false);
    setIsBreak(false);
    setTimerMode(mode);
    const w = mode === "UCEED_STUDY" ? 25 : 15;
    const b = mode === "UCEED_STUDY" ? 5 : 2;
    setFocusMins(w);
    setBreakMins(b);
    setSecondsLeft(w * 60);
  };

  const setTimerLengths = (w: number, b: number) => {
    const safeW = Math.max(1, Math.min(180, w));
    const safeB = Math.max(1, Math.min(60, b));
    setRunning(false);
    setIsBreak(false);
    setFocusMins(safeW);
    setBreakMins(safeB);
    setSecondsLeft(safeW * 1000 / 1000);
    setSecondsLeft(safeW * 60);
  };

  const hitBoss = (bossId: string, dmg: number) => {
    setSwordSlashing(true);
    setTimeout(() => setSwordSlashing(false), 280);
    soundEngine.playBassHit("HEAVY");

    setBosses((prev) =>
      prev.map((boss) => {
        if (boss.id !== bossId || boss.cleared) return boss;
        const nextHp = Math.max(0, boss.hp - dmg);
        const nowCleared = nextHp === 0;
        if (nowCleared) {
          setXp((x) => x + boss.xpReward);
          soundEngine.playSuccess();
        }
        return { ...boss, hp: nextHp, cleared: nowCleared };
      })
    );
  };

  const resetBoss = (bossId: string) => {
    setBosses((prev) =>
      prev.map((boss) =>
        boss.id === bossId ? { ...boss, hp: boss.maxHp, cleared: false } : boss
      )
    );
  };

  const addCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontInput.trim() || !backInput.trim()) return;
    const created: StudyCard = {
      id: `card-${Date.now()}`,
      front: frontInput.trim(),
      back: backInput.trim(),
      tag: tagInput.trim() || "UCEED",
    };
    setCards((prev) => {
      const next = [...prev, created];
      setCardIdx(next.length - 1);
      return next;
    });
    setFlipped(false);
    setFrontInput("");
    setBackInput("");
    soundEngine.playSuccess();
  };

  const deleteCard = (id: string) => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setCardIdx((idx) => Math.max(0, Math.min(idx, next.length - 1)));
      return next;
    });
    setFlipped(false);
  };

  const uploadCardsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsedCards: StudyCard[] = [];

      if (file.name.toLowerCase().endsWith(".json")) {
        const json = JSON.parse(text);
        const arr = Array.isArray(json) ? json : json?.cards;
        if (Array.isArray(arr)) {
          arr.forEach((item, idx) => {
            if (item && item.front && item.back) {
              parsedCards.push({
                id: `ujson-${Date.now()}-${idx}`,
                front: String(item.front).trim(),
                back: String(item.back).trim(),
                tag: String(item.tag || "UPLOAD").trim(),
              });
            }
          });
        }
      } else {
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        lines.forEach((line, idx) => {
          const cols = line.includes("|") ? line.split("|") : line.split(",");
          if (cols.length >= 2) {
            const front = cols[0].trim().replace(/^"|"$/g, "");
            const back = cols[1].trim().replace(/^"|"$/g, "");
            const tag = (cols[2] || "UPLOAD").trim().replace(/^"|"$/g, "");
            if (front && back && front.toLowerCase() !== "front") {
              parsedCards.push({
                id: `ucsv-${Date.now()}-${idx}`,
                front,
                back,
                tag,
              });
            }
          }
        });
      }

      if (parsedCards.length === 0) {
        setUploadNotice("No cards found. Use JSON [{front,back,tag}] or CSV front,back,tag.");
      } else {
        setCards((prev) => [...prev, ...parsedCards]);
        setUploadNotice(`Uploaded ${parsedCards.length} card(s).`);
        soundEngine.playSuccess();
      }
    } catch {
      setUploadNotice("Invalid file format. Please select a .json or .csv file.");
    }
    e.target.value = "";
  };

  const level = Math.floor(xp / 150) + 1;
  const uceedDays = getDaysUntil("2027-01-18T09:00:00");
  const nidDays = getDaysUntil("2026-12-20T09:00:00");
  const currentBoss = bosses.find((b) => b.id === selectedBossId) || bosses[0];
  const currentCard = cards[cardIdx] || null;
  const timerFormatted = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  // =========================================================================
  // 1. MULTI-LAYER LIVE WALLPAPER ENTRY SCREEN (165954.jpg)
  // =========================================================================
  if (!entered) {
    return (
      <div
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
          const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
          setParallax({ x: nx, y: ny });
        }}
        className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#03050c] p-5 text-slate-100 select-none sm:p-8"
      >
        {/* Layer 0: Deep ambient aura */}
        {entryImgOk && (
          <img
            src={ENTRY_WALLPAPER_ASSET}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
          />
        )}

        {/* Layer 1: Full character, hair & electric-blue aura with parallax & float */}
        {entryImgOk && (
          <div
            style={{
              transform: `translate3d(${parallax.x.toFixed(1)}px, ${parallax.y.toFixed(1)}px, 0)`,
            }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out"
          >
            <img
              src={ENTRY_WALLPAPER_ASSET}
              alt="Shadow Monarch Live Wallpaper"
              onError={() => setEntryImgOk(false)}
              className="h-full w-full object-contain object-center sm:object-cover sm:object-top animate-[wallpaperFloat_11s_ease-in-out_infinite]"
            />
          </div>
        )}

        {/* Layer 2: Electric-blue aura glow & rising energy motes */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#03050c]/60 via-transparent to-[#03050c]/95" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_32%,rgba(56,189,248,0.28),transparent_62%)] animate-[auraGlow_4.5s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute top-1/3 left-1/4 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9] animate-[emberRise_6s_ease-in-out_infinite]" />
          <span className="absolute top-1/2 right-1/3 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_14px_#60a5fa] animate-[emberRise_7.5s_ease-in-out_infinite_1s]" />
          <span className="absolute bottom-1/3 left-1/2 h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_12px_#c4b5fd] animate-[emberRise_6.8s_ease-in-out_infinite_2s]" />
        </div>

        {/* Layer 3: Top countdowns + skip & bottom entry glass bar */}
        <div className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
            <span className="rounded-full border border-cyan-400/30 bg-[#070c1a]/80 px-3.5 py-1 text-cyan-200 backdrop-blur-xl">
              UCEED {uceedDays}D
            </span>
            <span className="rounded-full border border-violet-400/30 bg-[#070c1a]/80 px-3.5 py-1 text-violet-200 backdrop-blur-xl">
              NID {nidDays}D
            </span>
          </div>

          <button
            onClick={() => {
              soundEngine.playTap();
              setEntered(true);
            }}
            className="rounded-full border border-white/15 bg-slate-950/75 px-4 py-1 font-mono text-xs text-slate-200 backdrop-blur-xl hover:border-cyan-300/50"
          >
            SKIP
          </button>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md rounded-3xl border border-cyan-400/25 bg-[#070c1a]/80 p-6 text-center shadow-[0_0_48px_rgba(56,189,248,0.22)] backdrop-blur-2xl">
          <h1 className="font-mono text-2xl font-bold tracking-[0.18em] text-white sm:text-3xl">
            UCEED 2027 FORGE
          </h1>
          <button
            onClick={() => {
              soundEngine.playBassHit("HEAVY");
              soundEngine.playSuccess();
              setEntered(true);
            }}
            className="mt-5 w-full rounded-2xl border border-cyan-300/60 bg-gradient-to-r from-cyan-500/25 via-blue-600/25 to-violet-600/30 px-6 py-3.5 font-mono text-xs font-bold tracking-[0.26em] text-white shadow-[0_0_28px_rgba(56,189,248,0.35)] active:scale-95"
          >
            ARISE
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. MAIN WORKSPACE (REVOLVING AURA HUB + SHADOW VORTEX + IGRIS FLASHCARDS)
  // =========================================================================
  return (
    <div className="relative min-h-screen bg-[#03050c] pb-24 text-slate-100">
      {/* Flashcard Igris Live Wallpaper Layer when Flashcards module is active */}
      {activeModule === "FLASHCARDS" && igrisBgOk && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <img
            src={IGRIS_WALLPAPER_ASSETS[0]}
            alt="Igris Live Wallpaper"
            onError={() => setIgrisBgOk(false)}
            className="h-full w-full object-cover object-top opacity-35 animate-[wallpaperFloat_13s_ease-in-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#03050c]/75 via-[#070516]/65 to-[#03050c]/95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_28%,rgba(168,85,247,0.25),rgba(225,29,72,0.12),transparent_65%)]" />
        </div>
      )}

      {/* Ambient background for Pomodoro & Bosses */}
      {activeModule !== "FLASHCARDS" && (
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_12%,rgba(56,189,248,0.11),transparent_42%),radial-gradient(circle_at_85%_85%,rgba(139,92,246,0.13),transparent_48%)]" />
      )}

      {/* Shadow-Vortex Entry Transition Overlay */}
      {vortexActive && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#03050c]/60 backdrop-blur-sm animate-[vortexFade_0.46s_ease-out_forwards]">
          <div className="h-40 w-40 rounded-full border-2 border-cyan-300/70 bg-gradient-to-tr from-cyan-400/25 via-violet-600/35 to-transparent shadow-[0_0_80px_rgba(139,92,246,0.7)] animate-[vortexExpand_0.46s_cubic-bezier(0.16,1,0.3,1)_forwards]" />
        </div>
      )}

      {/* Top Glass Header */}
      <header className="sticky top-0 z-30 border-b border-cyan-400/20 bg-[#050916]/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CharacterVisual src={CHARACTER_ASSETS[0]} alt="Hunter" className="h-11 w-11" />
            <div className="font-mono text-xs tabular-nums">
              <div className="font-bold tracking-[0.2em] text-cyan-300">
                LV.{level} • {xp} XP
              </div>
              <div className="text-slate-300">
                UCEED {uceedDays}D • BLOCKS {completedBlocks}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEngine.playTap();
                setEntered(false);
              }}
              className="rounded-xl border border-cyan-400/25 bg-slate-950/75 px-3 py-1.5 font-mono text-xs text-cyan-200 hover:border-cyan-300/60"
            >
              WALLPAPER
            </button>
            <button
              onClick={() => {
                const next = !muted;
                setMuted(next);
                soundEngine.muted = next;
              }}
              aria-label="Toggle sound"
              className="rounded-xl border border-violet-400/30 bg-slate-950/75 px-3 py-1.5 text-xs text-violet-200"
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl space-y-5 px-4 pt-4">
        {/* Revolving Aura Card Hub */}
        <MonarchCardHub
          activeModule={activeModule}
          onSelectModule={triggerModuleEnter}
          timerFormatted={timerFormatted}
          timerModeLabel={timerMode === "UCEED_STUDY" ? "UCEED" : "BODY"}
          bossHpText={`${currentBoss.hp}/${currentBoss.maxHp}`}
          cardCount={cards.length}
        />

        {/* =============================================================== */}
        {/* MODULE 1: RUNNING POMODORO (UCEED STUDY + BODY-BUILD)           */}
        {/* =============================================================== */}
        {activeModule === "POMODORO" && (
          <section className="rounded-3xl border border-cyan-400/25 bg-[#070c1a]/80 p-5 backdrop-blur-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-mono text-xs tracking-[0.24em] text-cyan-300 uppercase">
                  {timerMode === "UCEED_STUDY" ? "UCEED STUDY" : "BODY-BUILD"} •{" "}
                  {isBreak ? "REST" : "ACTIVE"}
                </div>
                <div className="mt-2 font-mono text-5xl font-bold tracking-widest text-white tabular-nums sm:text-6xl">
                  {timerFormatted}
                </div>
                <div className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
                  {focusMins}M / {breakMins}M
                </div>
              </div>

              {timerMode === "BODY_BUILD" ? (
                <CrimsonPushupVisual className="h-24 w-40 rounded-2xl" />
              ) : (
                <CharacterVisual
                  src={CHARACTER_ASSETS[2]}
                  alt="Study Focus"
                  className="h-24 w-24 rounded-2xl"
                />
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  soundEngine.playTap();
                  switchTimerMode("UCEED_STUDY");
                }}
                className={`rounded-xl border py-2.5 font-mono text-xs font-bold tracking-wider ${
                  timerMode === "UCEED_STUDY"
                    ? "border-cyan-300/60 bg-cyan-500/20 text-white"
                    : "border-white/10 bg-slate-950/65 text-slate-400"
                }`}
              >
                UCEED STUDY
              </button>
              <button
                onClick={() => {
                  soundEngine.playTap();
                  switchTimerMode("BODY_BUILD");
                }}
                className={`rounded-xl border py-2.5 font-mono text-xs font-bold tracking-wider ${
                  timerMode === "BODY_BUILD"
                    ? "border-rose-400/60 bg-rose-500/20 text-white"
                    : "border-white/10 bg-slate-950/65 text-slate-400"
                }`}
              >
                BODY-BUILD
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {timerMode === "UCEED_STUDY" ? (
                <>
                  <button
                    onClick={() => {
                      soundEngine.playTap();
                      setTimerLengths(25, 5);
                    }}
                    className="rounded-lg border border-cyan-400/25 bg-slate-950/75 px-3 py-1.5 font-mono text-xs text-cyan-200 tabular-nums"
                  >
                    25/5
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playTap();
                      setTimerLengths(50, 10);
                    }}
                    className="rounded-lg border border-cyan-400/25 bg-slate-950/75 px-3 py-1.5 font-mono text-xs text-cyan-200 tabular-nums"
                  >
                    50/10
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      soundEngine.playTap();
                      setTimerLengths(15, 2);
                    }}
                    className="rounded-lg border border-rose-400/25 bg-slate-950/75 px-3 py-1.5 font-mono text-xs text-rose-200 tabular-nums"
                  >
                    15/2
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playTap();
                      setTimerLengths(30, 3);
                    }}
                    className="rounded-lg border border-rose-400/25 bg-slate-950/75 px-3 py-1.5 font-mono text-xs text-rose-200 tabular-nums"
                  >
                    30/3
                  </button>
                </>
              )}

              <div className="ml-auto flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customWork}
                  onChange={(e) => setCustomWork(Number(e.target.value) || 25)}
                  aria-label="Custom focus minutes"
                  className="w-14 rounded-lg border border-white/15 bg-slate-950/85 px-2 py-1 text-center font-mono text-xs text-white tabular-nums"
                />
                <span className="font-mono text-xs text-slate-400">/</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={customBreak}
                  onChange={(e) => setCustomBreak(Number(e.target.value) || 5)}
                  aria-label="Custom break minutes"
                  className="w-12 rounded-lg border border-white/15 bg-slate-950/85 px-2 py-1 text-center font-mono text-xs text-white tabular-nums"
                />
                <button
                  onClick={() => {
                    soundEngine.playTap();
                    setTimerLengths(customWork, customBreak);
                  }}
                  className="rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-200"
                >
                  SET
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  soundEngine.playBassHit("LIGHT");
                  setRunning((r) => !r);
                }}
                className="flex-1 rounded-xl border border-cyan-300/60 bg-gradient-to-r from-cyan-500/25 to-violet-500/25 py-3 font-mono text-xs font-bold tracking-[0.22em] text-white"
              >
                {running ? "PAUSE" : "START"}
              </button>
              <button
                onClick={() => {
                  soundEngine.playTap();
                  setRunning(false);
                  setIsBreak(false);
                  setSecondsLeft(focusMins * 60);
                }}
                className="rounded-xl border border-white/15 bg-slate-950/75 px-5 py-3 font-mono text-xs text-slate-300"
              >
                RESET
              </button>
            </div>
          </section>
        )}

        {/* =============================================================== */}
        {/* MODULE 2: MOCK HUNTING BOSS BATTLES (IGRIS "MOCK" SWORD)        */}
        {/* =============================================================== */}
        {activeModule === "BOSSES" && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {bosses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    soundEngine.playTap();
                    setSelectedBossId(b.id);
                  }}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left backdrop-blur-xl transition ${
                    selectedBossId === b.id
                      ? "border-cyan-300/65 bg-[#0b132b]/85"
                      : "border-white/10 bg-[#070c1a]/75"
                  }`}
                >
                  <CharacterVisual src={b.image} alt={b.name} className="h-14 w-14" />
                  <div className="min-w-0 font-mono">
                    <div className="truncate text-xs font-bold text-white">{b.name}</div>
                    <div className="text-xs text-cyan-300 tabular-nums">
                      {b.cleared ? "CLEARED" : `${b.hp}/${b.maxHp} HP`}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {currentBoss && (
              <div className="rounded-3xl border border-violet-400/30 bg-[#070c1a]/82 p-5 backdrop-blur-2xl sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-mono text-xs tracking-[0.22em] text-violet-300 tabular-nums">
                      +{currentBoss.xpReward} XP
                    </div>
                    <h2 className="mt-1 font-mono text-xl font-bold text-white">
                      {currentBoss.name}
                    </h2>
                  </div>

                  <IgrisMockSwordVisual
                    slashing={swordSlashing}
                    className="h-24 w-44 rounded-2xl"
                  />
                </div>

                <div className="mt-5">
                  <div className="flex justify-between font-mono text-xs text-cyan-200 tabular-nums">
                    <span>HP</span>
                    <span>
                      {currentBoss.hp} / {currentBoss.maxHp}
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full border border-cyan-400/20 bg-slate-950/90">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all duration-300"
                      style={{
                        width: `${Math.round((currentBoss.hp / currentBoss.maxHp) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <input
                    type="number"
                    min={5}
                    max={250}
                    value={damageValue}
                    onChange={(e) => setDamageValue(Math.max(5, Number(e.target.value) || 25))}
                    aria-label="Mock strike damage"
                    className="w-24 rounded-xl border border-white/15 bg-slate-950/85 px-3 py-2.5 font-mono text-xs text-white tabular-nums"
                  />
                  <button
                    onClick={() => hitBoss(currentBoss.id, damageValue)}
                    disabled={currentBoss.cleared}
                    className="flex-1 rounded-xl border border-cyan-300/60 bg-gradient-to-r from-cyan-500/25 to-violet-500/25 py-2.5 font-mono text-xs font-bold tracking-[0.2em] text-white disabled:opacity-40"
                  >
                    {currentBoss.cleared ? "CLEARED" : `STRIKE ${damageValue}`}
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playTap();
                      resetBoss(currentBoss.id);
                    }}
                    className="rounded-xl border border-white/15 bg-slate-950/75 px-4 py-2.5 font-mono text-xs text-slate-300"
                  >
                    RESET
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* =============================================================== */}
        {/* MODULE 3: FLASHCARDS (IGRIS LIVE WALLPAPER + ADD/UPLOAD/DELETE) */}
        {/* =============================================================== */}
        {activeModule === "FLASHCARDS" && (
          <section className="space-y-4">
            {currentCard ? (
              <div
                onClick={() => {
                  soundEngine.playTap();
                  setFlipped((f) => !f);
                }}
                className="cursor-pointer rounded-3xl border border-violet-300/35 bg-[#070c1a]/75 p-6 text-center backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between font-mono text-xs text-cyan-200 tabular-nums">
                  <span>{currentCard.tag}</span>
                  <span>
                    {cardIdx + 1}/{cards.length}
                  </span>
                </div>

                <div className="my-6 flex flex-col items-center gap-4">
                  <CharacterVisual
                    src={CHARACTER_ASSETS[cardIdx % CHARACTER_ASSETS.length]}
                    alt="Card Visual"
                    className="h-20 w-20 rounded-2xl"
                  />
                  <div className="max-w-xl text-lg font-semibold text-white sm:text-xl">
                    {flipped ? currentCard.back : currentCard.front}
                  </div>
                </div>

                <div className="flex justify-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      soundEngine.playTap();
                      setFlipped(false);
                      setCardIdx((i) => (i - 1 + cards.length) % cards.length);
                    }}
                    className="rounded-xl border border-white/15 bg-slate-950/75 px-4 py-2 font-mono text-xs text-slate-200"
                  >
                    PREV
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playTap();
                      setFlipped(false);
                      setCardIdx((i) => (i + 1) % cards.length);
                    }}
                    className="rounded-xl border border-cyan-300/45 bg-cyan-500/20 px-4 py-2 font-mono text-xs text-cyan-100"
                  >
                    NEXT
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playTap();
                      deleteCard(currentCard.id);
                    }}
                    className="rounded-xl border border-rose-400/45 bg-rose-500/15 px-4 py-2 font-mono text-xs text-rose-200"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/15 bg-[#070c1a]/80 p-6 text-center font-mono text-xs text-slate-300 backdrop-blur-xl">
                EMPTY DECK
              </div>
            )}

            <div className="rounded-3xl border border-cyan-400/25 bg-[#070c1a]/80 p-5 backdrop-blur-2xl">
              <form onSubmit={addCard} className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <input
                  type="text"
                  value={frontInput}
                  onChange={(e) => setFrontInput(e.target.value)}
                  placeholder="Front..."
                  className="rounded-xl border border-white/15 bg-slate-950/85 px-3 py-2 text-xs text-white placeholder-slate-500"
                />
                <input
                  type="text"
                  value={backInput}
                  onChange={(e) => setBackInput(e.target.value)}
                  placeholder="Back..."
                  className="rounded-xl border border-white/15 bg-slate-950/85 px-3 py-2 text-xs text-white placeholder-slate-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Tag"
                    className="w-24 rounded-xl border border-white/15 bg-slate-950/85 px-2.5 py-2 font-mono text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="flex-1 rounded-xl border border-cyan-300/50 bg-cyan-500/25 px-3 py-2 font-mono text-xs font-bold text-white"
                  >
                    + ADD
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3.5">
                <label className="cursor-pointer rounded-xl border border-violet-300/45 bg-violet-500/20 px-4 py-2 font-mono text-xs text-violet-100">
                  UPLOAD .JSON / .CSV
                  <input
                    type="file"
                    accept=".json,.csv,.txt"
                    onChange={uploadCardsFile}
                    className="hidden"
                  />
                </label>
                {uploadNotice && (
                  <span className="font-mono text-xs text-cyan-200">{uploadNotice}</span>
                )}
              </div>

              {cards.length > 0 && (
                <div className="mt-3.5 max-h-40 space-y-1.5 overflow-y-auto border-t border-white/10 pt-3">
                  {cards.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs"
                    >
                      <button
                        onClick={() => {
                          soundEngine.playTap();
                          setCardIdx(i);
                          setFlipped(false);
                        }}
                        className="truncate pr-3 text-left text-slate-200"
                      >
                        <span className="font-mono text-cyan-300">[{c.tag}]</span> {c.front}
                      </button>
                      <button
                        onClick={() => {
                          soundEngine.playTap();
                          deleteCard(c.id);
                        }}
                        className="shrink-0 font-mono text-xs text-rose-300"
                      >
                        DELETE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-30 border-t border-cyan-400/20 bg-[#050916]/90 px-3 py-2 backdrop-blur-xl">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-2">
          {(
            [
              { key: "POMODORO", label: "POMODORO" },
              { key: "BOSSES", label: "BOSS HUNT" },
              { key: "FLASHCARDS", label: "FLASHCARDS" },
            ] as { key: HubModuleKey; label: string }[]
          ).map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => {
                soundEngine.playTap();
                triggerModuleEnter(tabItem.key);
              }}
              className={`rounded-xl border py-2.5 font-mono text-xs font-semibold tracking-wider ${
                activeModule === tabItem.key
                  ? "border-cyan-300/60 bg-cyan-500/20 text-white"
                  : "border-white/10 bg-slate-950/65 text-slate-400"
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      </nav>

      <style jsx global>{`
        @property --aura-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes revolveAura {
          0% {
            --aura-angle: 0deg;
          }
          100% {
            --aura-angle: 360deg;
          }
        }
        @keyframes concentricRing {
          0% {
            transform: scale(0.35);
            opacity: 0.95;
          }
          100% {
            transform: scale(4.2);
            opacity: 0;
          }
        }
        @keyframes vortexExpand {
          0% {
            transform: scale(0.2);
            opacity: 0.95;
          }
          100% {
            transform: scale(4.8);
            opacity: 0;
          }
        }
        @keyframes vortexFade {
          0% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes wallpaperFloat {
          0%,
          100% {
            transform: scale(1.02) translate(0px, 0px);
          }
          50% {
            transform: scale(1.06) translate(-6px, -5px);
          }
        }
        @keyframes portraitFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes auraGlow {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.08);
          }
        }
        @keyframes emberRise {
          0%,
          100% {
            transform: translateY(0px) scale(0.9);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-28px) scale(1.2);
            opacity: 0.95;
          }
        }
        @keyframes crimsonAuraPulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(0.96);
          }
          50% {
            opacity: 1;
            transform: scale(1.06);
          }
        }
        @keyframes pushupBody {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(11px);
          }
        }
        @keyframes pushupShadow {
          0%,
          100% {
            transform: scaleX(0.9);
            opacity: 0.25;
          }
          50% {
            transform: scaleX(1.12);
            opacity: 0.45;
          }
        }
      `}</style>
    </div>
  );
}
