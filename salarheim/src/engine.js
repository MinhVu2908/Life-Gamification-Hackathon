// src/engine.js
// XP Engine: XPT = Base(1000) × Difficulty × FocusBonus

const BASE_XP = 1000;
export const DIFFICULTY = { micro: 0.5, standard: 1.0, challenge: 2.0 };

export function calcXP(difficulty, focusBonus = 1) {
  const mult = DIFFICULTY[difficulty] ?? DIFFICULTY.standard;
  return Math.round(BASE_XP * mult * focusBonus);
}

export function getTaskRewards(task, focusBonus = 1) {
  const diff = task.difficulty ?? 'micro';
  const xp = calcXP(diff, focusBonus);
  const coins = Math.max(10, Math.floor(xp / 2));
  return { xp, coins };
}