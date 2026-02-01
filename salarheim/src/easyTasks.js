// src/easyTasks.js
// Easy, simple, fast micro-tasks for the daily task board
// Each task: xp, coins, and attribute bonuses (V, R, C, M) — +1 level per completion

export const EASY_TASKS = [
  // V - Vitality (physical, movement, hydration)
  { id: 't1', text: 'Drink a glass of water', xp: 5, coins: 2, attr: { V: 1 } },
  { id: 't3', text: 'Stand up and stretch for 30 sec', xp: 5, coins: 2, attr: { V: 1 } },
  { id: 't6', text: 'Step outside for 1 minute', xp: 5, coins: 2, attr: { V: 1 } },
  { id: 't8', text: 'Do 10 squats', xp: 8, coins: 3, attr: { V: 1 } },
  { id: 't12', text: 'Drink water', xp: 3, coins: 1, attr: { V: 1 } },
  { id: 't15', text: 'Shoulder rolls × 5', xp: 5, coins: 2, attr: { V: 1 } },
  // R - Resilience (focus, mindfulness, planning)
  { id: 't2', text: 'Take 3 deep breaths', xp: 5, coins: 2, attr: { R: 1 } },
  { id: 't5', text: 'Put your phone away for 5 minutes', xp: 8, coins: 3, attr: { R: 1 } },
  { id: 't9', text: 'Write your top 3 priorities for today', xp: 5, coins: 2, attr: { R: 1 } },
  { id: 't11', text: 'Close your eyes and breathe for 1 min', xp: 5, coins: 2, attr: { R: 1 } },
  { id: 't13', text: 'Look away from screen for 20 seconds', xp: 3, coins: 1, attr: { R: 1 } },
  { id: 't14', text: 'Name 3 things you see around you', xp: 3, coins: 1, attr: { R: 1 } },
  // C - Connection (social, gratitude)
  { id: 't4', text: 'Write one thing you\'re grateful for', xp: 5, coins: 2, attr: { C: 1 } },
  { id: 't7', text: 'Text one person you care about', xp: 8, coins: 3, attr: { C: 1 } },
  { id: 't16', text: 'Reply to one message you\'ve been avoiding', xp: 8, coins: 3, attr: { C: 1 } },
  // M - Mastery (organization, competence)
  { id: 't10', text: 'Tidy one surface', xp: 5, coins: 2, attr: { M: 1 } },
];

// Pick 4 random tasks for display (excludes completed IDs)
export const getTasksForBoard = (excludeIds = [], count = 4) => {
  const available = EASY_TASKS.filter((t) => !excludeIds.includes(t.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
