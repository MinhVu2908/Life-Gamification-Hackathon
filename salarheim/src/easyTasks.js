// src/easyTasks.js
// Easy, simple, fast micro-tasks for the daily task board
// Micro tasks give ~8 attr XP each (50 XP/level → ~6 tasks per level for visible progress)

import { getTaskRewards } from './engine';

const MICRO_ATTR_XP = 8;   // single-attribute micro task
const MICRO_MULTI_XP = 5;  // per attribute when task boosts 2 (total 10)

export const EASY_TASKS = [
  // V - Vitality (physical, movement, hydration) — all micro
  { id: 't1', text: 'Drink a glass of water.', difficulty: 'micro', attrXP: { V: MICRO_ATTR_XP } },
  { id: 't3', text: 'Stand up and stretch for 30 sec', difficulty: 'micro', attrXP: { V: MICRO_ATTR_XP } },
  { id: 't6', text: 'Step outside for 1 minute', difficulty: 'micro', attrXP: { V: MICRO_ATTR_XP } },
  { id: 't8', text: 'Do 10 squats', difficulty: 'micro', attrXP: { V: MICRO_ATTR_XP } },
  { id: 't12', text: 'Drink water', difficulty: 'micro', attrXP: { V: MICRO_ATTR_XP } },
  { id: 't15', text: 'Shoulder rolls × 5', difficulty: 'micro', attrXP: { V: MICRO_ATTR_XP } },
  // R - Resilience (focus, mindfulness, planning)
  { id: 't2', text: 'Take 3 deep breaths', difficulty: 'micro', attrXP: { R: MICRO_ATTR_XP } },
  { id: 't5', text: 'Put your phone away for 5 minutes', difficulty: 'micro', attrXP: { R: MICRO_ATTR_XP } },
  { id: 't9', text: 'Write your top 3 priorities for today', difficulty: 'micro', attrXP: { R: MICRO_ATTR_XP } },
  { id: 't11', text: 'Close your eyes and breathe for 1 min', difficulty: 'micro', attrXP: { R: MICRO_ATTR_XP } },
  { id: 't13', text: 'Look away from screen for 20 seconds', difficulty: 'micro', attrXP: { R: MICRO_ATTR_XP } },
  { id: 't14', text: 'Name 3 things you see around you', difficulty: 'micro', attrXP: { R: MICRO_ATTR_XP } },
  // C - Connection (social, gratitude)
  { id: 't4', text: 'Write one thing you\'re grateful for', difficulty: 'micro', attrXP: { C: MICRO_ATTR_XP } },
  { id: 't7', text: 'Text one person you care about', difficulty: 'micro', attrXP: { C: MICRO_ATTR_XP } },
  { id: 't16', text: 'Reply to one message you\'ve been avoiding', difficulty: 'micro', attrXP: { C: MICRO_ATTR_XP } },
  // M - Mastery (organization, competence)
  { id: 't10', text: 'Tidy one surface', difficulty: 'micro', attrXP: { M: MICRO_ATTR_XP } },
  // Multi-attr
  { id: 't17', text: '1 min stretch + 3 breaths', difficulty: 'micro', attrXP: { V: MICRO_MULTI_XP, R: MICRO_MULTI_XP } },
  { id: 't18', text: 'Text someone + write 1 gratitude', difficulty: 'micro', attrXP: { C: MICRO_MULTI_XP, R: MICRO_MULTI_XP } },
];

export { getTaskRewards };

// Pick 4 random tasks for display (excludes completed IDs)
export const getTasksForBoard = (excludeIds = [], count = 4) => {
  const available = EASY_TASKS.filter((t) => !excludeIds.includes(t.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
