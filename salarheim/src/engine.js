// src/engine.js

export const QUESTIONS = [
  { id: 1, attr: 'V', text: "I consistently wake up feeling genuinely well-rested." },
  { id: 5, attr: 'R', text: "I prioritize careful planning over jumping straight into action." },
  { id: 9, attr: 'C', text: "I have at least two people I can unconditionally rely on." },
  { id: 12, attr: 'M', text: "I am actively learning skills that improve my career goals." },
  // ... Note: In a full build, you'd add all 13 questions here.
];

export const getArchetype = (stats) => {
  // Logic: H if score >= 3, L if score < 3
  const code = Object.values(stats).map(val => val >= 12 ? 'H' : 'L').join('');
  
  const matrix = {
    'HHHH': 'The True Sovereign',
    'LLLL': 'The Broken Vassal',
    'LHHH': 'The Frail Archon',
    'LHLH': 'The Ascetic Crafter',
    'HLLH': 'The Unruly Freeblade',
    // Default fallback
  };
  
  return matrix[code] || "The Wanderer";
};