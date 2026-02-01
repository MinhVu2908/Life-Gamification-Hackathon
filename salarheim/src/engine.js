// src/engine.js
// XP Engine: XPT = Base(1000) × Difficulty × FocusBonus
// Attribute Restoration: 1-100 score per attribute. Tasks add % boosts:
//   Micro: +1% to +2% (leak patching)
//   Standard: +3% to +5% (primary building blocks)
//   Challenge: +7% to +10% (Sovereign-level)

const BASE_XP = 1000;
export const DIFFICULTY = { micro: 0.5, standard: 1.0, challenge: 2.0 };

// Attribute XP boost (points toward 1-100 score) by difficulty
const ATTR_BOOST = {
  micro: { min: 1, max: 2 },
  standard: { min: 3, max: 5 },
  challenge: { min: 7, max: 10 },
};

export function calcXP(difficulty, focusBonus = 1) {
  const mult = DIFFICULTY[difficulty] ?? DIFFICULTY.standard;
  return Math.round(BASE_XP * mult * focusBonus);
}

export function getAttrXPPerDifficulty(difficulty) {
  const r = ATTR_BOOST[difficulty] ?? ATTR_BOOST.micro;
  return Math.floor(r.min + Math.random() * (r.max - r.min + 1));
}

// Deterministic midpoint for quest/task attrXP (Micro 1–2→1, Standard 3–5→4, Challenge 7–10→8)
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

// attrXP: { V, R, C, M } — score per attribute (0–100, Immediate Attribute Restoration)
// attrLevel: derived from attrXP, e.g. level = 1 + floor(attrXP / 10), max level 10
export const ATTR_MAX = 100;
export const ATTR_XP_PER_LEVEL = 10;
export function getAttrLevel(attrXP) {
  const x = Math.min(ATTR_MAX, attrXP ?? 0);
  return Math.max(1, 1 + Math.floor(x / ATTR_XP_PER_LEVEL));
}