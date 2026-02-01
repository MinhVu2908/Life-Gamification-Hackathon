// src/engine.js
// XP Engine: XPT = Base(1000) × Difficulty × FocusBonus
// Attribute Restoration: 1-100 score per attribute. Tasks add % boosts:
//   Micro: +1% to +2% (leak patching)
//   Standard: +3% to +5% (primary building blocks)
//   Challenge: +7% to +10% (Sovereign-level)

const BASE_XP = 1000;
export const DIFFICULTY = { micro: 0.5, standard: 1.0, challenge: 2.0 };

// Attribute XP boost by difficulty (scaled for proper progression)
const ATTR_BOOST = {
  micro: { min: 2, max: 4 },      // Small tasks give 2-4 attribute XP
  standard: { min: 6, max: 10 },  // Standard tasks give 6-10 attribute XP
  challenge: { min: 15, max: 25 }, // Challenge tasks give 15-25 attribute XP
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

// Attribute leveling system with scaling XP requirements
// Level 1: 0-20 XP, Level 2: 21-50 XP, Level 3: 51-90 XP, etc.
// Formula: XP needed for level N = 20 * N * (N + 1) / 2 (triangular number scaling)
export function getAttrLevel(attrXP) {
  const x = attrXP ?? 0;
  if (x <= 0) return 1;
  
  // Solve for level: XP = 20 * level * (level + 1) / 2
  // XP = 10 * level * (level + 1)
  // level^2 + level - XP/10 = 0
  // level = (-1 + sqrt(1 + 4*XP/10)) / 2
  const level = Math.floor((-1 + Math.sqrt(1 + (4 * x) / 10)) / 2) + 1;
  return Math.max(1, level);
}

// Get XP required for a specific attribute level
export function getAttrXPForLevel(level) {
  if (level <= 1) return 0;
  // XP needed = 10 * (level - 1) * level
  return 10 * (level - 1) * level;
}

// Get XP within current level
export function getAttrXPInLevel(attrXP) {
  const level = getAttrLevel(attrXP);
  const xpForCurrentLevel = getAttrXPForLevel(level);
  const xpForNextLevel = getAttrXPForLevel(level + 1);
  const xpInLevel = (attrXP ?? 0) - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  return { current: xpInLevel, needed: xpNeededForNext };
}

// Total level XP scaling: exponential growth
// Level 1: 0-1000, Level 2: 1001-2500, Level 3: 2501-5000, etc.
export function getTotalLevel(totalXP) {
  if (totalXP <= 0) return 1;
  
  // XP formula: XP = 500 * level^2 + 500 * level
  // Solving: level = (-500 + sqrt(500^2 + 4*500*XP)) / (2*500)
  // Simplified: level = (-1 + sqrt(1 + 4*XP/500)) / 2
  const level = Math.floor((-1 + Math.sqrt(1 + (4 * totalXP) / 500)) / 2) + 1;
  return Math.max(1, level);
}

// Get XP required for a specific total level
export function getTotalXPForLevel(level) {
  if (level <= 1) return 0;
  // XP needed = 500 * (level - 1) * level
  return 500 * (level - 1) * level;
}

// Get XP within current total level
export function getTotalXPInLevel(totalXP) {
  const level = getTotalLevel(totalXP);
  const xpForCurrentLevel = getTotalXPForLevel(level);
  const xpForNextLevel = getTotalXPForLevel(level + 1);
  const xpInLevel = (totalXP ?? 0) - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  return { current: xpInLevel, needed: xpNeededForNext };
}