// src/engine.js
// XP Engine: XPT = Base(1000) × Difficulty × FocusBonus
// Attribute Restoration: 1-100 score per attribute. Tasks add % boosts:
//   Micro: +1% to +2% (leak patching)
//   Standard: +3% to +5% (primary building blocks)
//   Challenge: +7% to +10% (Sovereign-level)

const BASE_XP = 1000;
export const DIFFICULTY = { micro: 0.5, standard: 1.0, challenge: 2.0 };

// Attribute XP boost by difficulty. 50 XP per level → ~6 micro tasks, ~3 standard, ~2 challenge per level.
const ATTR_BOOST = {
  micro: { min: 6, max: 10 },     // Quick tasks: ~6–10 attr XP (~5–8 tasks per level)
  standard: { min: 14, max: 20 }, // Standard quests: ~14–20 attr XP (~2–3 per level)
  challenge: { min: 28, max: 40 }, // Challenge quests: ~28–40 attr XP (~1–2 per level)
};

export function calcXP(difficulty, focusBonus = 1) {
  const mult = DIFFICULTY[difficulty] ?? DIFFICULTY.standard;
  return Math.round(BASE_XP * mult * focusBonus);
}

export function getAttrXPPerDifficulty(difficulty) {
  const r = ATTR_BOOST[difficulty] ?? ATTR_BOOST.micro;
  return Math.floor(r.min + Math.random() * (r.max - r.min + 1));
}

// Deterministic midpoint for quest attrXP (micro ~8, standard ~17, challenge ~34)
export function getAttrXPAmount(difficulty) {
  const r = ATTR_BOOST[difficulty] ?? ATTR_BOOST.micro;
  return Math.floor((r.min + r.max) / 2);
}

export function getTaskRewards(task, focusBonus = 1) {
  const diff = task.difficulty ?? 'micro';
  const xp = calcXP(diff, focusBonus);
  const coins = Math.max(10, Math.floor(xp / 2));
  return { xp, coins };
}

// Returns attrXP object for any task type. Use when task has no attrXP (e.g. generated API response)
// or to normalize rewards by difficulty. task: { difficulty?, attributes?, attrXP? (keys = target attrs) }
export function getTaskAttrXPReward(task) {
  const difficulty = task.difficulty ?? 'micro';
  const validAttrs = ['V', 'R', 'C', 'M'];
  const fromKeys = task.attrXP && typeof task.attrXP === 'object'
    ? Object.keys(task.attrXP).filter(k => validAttrs.includes(k))
    : [];
  const targetAttrs = (task.attributes && task.attributes.length > 0)
    ? task.attributes.filter(a => validAttrs.includes(a))
    : (fromKeys.length > 0 ? fromKeys : ['V']);
  const n = Math.max(1, targetAttrs.length);
  const total = getAttrXPAmount(difficulty);
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  const result = {};
  targetAttrs.forEach((a, i) => {
    result[a] = base + (i < remainder ? 1 : 0);
  });
  return result;
}

// Attribute leveling: 50 XP per level. Trial score 20 (all 5s) → level 10.
// Level 1: 0-49, Level 2: 50-99, ..., Level 10: 450-499 (trial max), no cap after creation.
export const ATTR_XP_PER_LEVEL = 50;
export const ATTR_MAX_LEVEL_TRIAL = 10;
// All attributes at this level or higher allow ascension to next tier (Broken Vassal II, III, ...)
export const ATTR_LEVEL_TO_ASCEND = 10;

export function getAttrLevel(attrXP) {
  const x = Math.max(0, attrXP ?? 0);
  return Math.max(1, 1 + Math.floor(x / ATTR_XP_PER_LEVEL));
}

export function getAttrXPForLevel(level) {
  if (level <= 1) return 0;
  return (level - 1) * ATTR_XP_PER_LEVEL;
}

export function getAttrXPInLevel(attrXP) {
  const level = getAttrLevel(attrXP);
  const xpForCurrentLevel = getAttrXPForLevel(level);
  const xpForNextLevel = getAttrXPForLevel(level + 1);
  const xpInLevel = (attrXP ?? 0) - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  return { current: xpInLevel, needed: xpNeededForNext };
}

// Total level = f(total XP). Total XP = sum of all attribute XP (combined, not level numbers).
// Trial max: 4 attrs × 450 = 1800 total XP → level 20.
const TOTAL_XP_PER_LEVEL = 1800 / 19; // ~94.74 so level 20 at 1800

export const TOTAL_MAX_LEVEL_TRIAL = 20;

export function getTotalLevel(totalXP) {
  const x = Math.max(0, totalXP ?? 0);
  return Math.max(1, 1 + Math.floor(x / TOTAL_XP_PER_LEVEL));
}

export function getTotalXPForLevel(level) {
  if (level <= 1) return 0;
  return Math.round((level - 1) * TOTAL_XP_PER_LEVEL);
}

export function getTotalXPInLevel(totalXP) {
  const level = getTotalLevel(totalXP);
  const xpForCurrentLevel = getTotalXPForLevel(level);
  const xpForNextLevel = getTotalXPForLevel(level + 1);
  const xpInLevel = (totalXP ?? 0) - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  return { current: xpInLevel, needed: xpNeededForNext };
}

// Trial: score 4–20 per attribute → attr XP so that 20 → level 10 (450 XP)
export function trialScoreToAttrXP(score) {
  return Math.round((score ?? 0) * (getAttrXPForLevel(ATTR_MAX_LEVEL_TRIAL) / 20));
}