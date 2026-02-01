import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Home, MapPin, Lock, Send, RefreshCw, Coins, Zap, Check, CheckCircle2, User, Edit2, LogOut, Save, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuestsByPillar, getQuestRewards } from './willQuests';
import { getTasksForBoard, getTaskRewards, EASY_TASKS } from './easyTasks';
import { getAttrLevel, getAttrXPInLevel, getTotalLevel, getTotalXPInLevel } from './engine';

// --- Research Data --- (4 questions per attribute, 16 total)
const QUESTIONS = [
  // V - Vitality (Physical Energy & Health)
  { id: 1, attr: 'V', text: "I consistently wake up feeling genuinely well-rested and energized." },
  { id: 2, attr: 'V', text: "I incorporate physical movement that leaves me feeling stronger." },
  { id: 3, attr: 'V', text: "My eating habits support sustained energy without crashes." },
  { id: 4, attr: 'V', text: "After my main meal, I feel energized, not heavy or sluggish." },

  // R - Resilience (Emotional Regulation & Focus)
  { id: 5, attr: 'R', text: "I prioritize careful planning over jumping straight into action." },
  { id: 6, attr: 'R', text: "I recover emotional balance within an hour of a setback." },
  { id: 7, attr: 'R', text: "I proactively plan my schedule rather than reacting to demands." },
  { id: 8, attr: 'R', text: "I can enter deep concentration without seeking distraction." },

  // C - Connection (Social & Boundaries)
  { id: 9, attr: 'C', text: "I have at least two people I can unconditionally rely on." },
  { id: 10, attr: 'C', text: "I am satisfied with the quality of my social interactions." },
  { id: 11, attr: 'C', text: "I find it easy to say 'no' to demands when I need space." },
  { id: 12, attr: 'C', text: "I regularly contribute to the well-being of others in my circle." },

  // M - Mastery (Competence & Finance)
  { id: 13, attr: 'M', text: "I am actively practicing skills to improve my career or goals." },
  { id: 14, attr: 'M', text: "I have a strong grasp and control over my financial situation." },
  { id: 15, attr: 'M', text: "I complete my most important tasks before moving to low-value work." },
  { id: 16, attr: 'M', text: "I have a clear 3-month goal that I am currently working toward." }
];

// 16 Archetypes: score < 10 = L, else H (order: V, R, C, M)
const ARCHETYPES = {
  'HHHH': { name: 'The True Sovereign', desc: 'Perfect Balance. Tier 2 Master.' },
  'LLLL': { name: 'The Broken Vassal', desc: 'Critical deficit in all Pillars. Seek restoration.' },
  'LHHH': { name: 'The Frail Archon', desc: 'Strong mental/social/skills, but lacks physical fuel.' },
  'HLHH': { name: 'The Resilient Sage', desc: 'Strong vitality, mind, connection; may lack practical mastery.' },
  'HHLL': { name: 'The Vigorous Wanderer', desc: 'High energy and resilience; lacking connection and mastery.' },
  'HHLH': { name: 'The Vigilant Bastion', desc: 'High self-sufficiency, but isolated and lacking connection.' },
  'HHHL': { name: 'The Charismatic Forge', desc: 'Strong vitality, resilience, connection; lacks practical mastery.' },
  'LHHL': { name: 'The Cloistered Oracle', desc: 'Disciplined and connected, but lacking physical fuel.' },
  'LHLH': { name: 'The Ascetic Crafter', desc: 'High drive/skill, sacrifices recovery/social life.' },
  'HLLH': { name: 'The Unruly Freeblade', desc: 'High energy and skills, but lacking structure.' },
  'LHLL': { name: 'The Stark Monk', desc: 'Only possesses mental discipline; deficits elsewhere.' },
  'LLHL': { name: 'The Grieving Shepherd', desc: 'Only possesses social grace; deficits in foundational pillars.' },
  'LLLH': { name: 'The Forsaken Scribe', desc: 'Only possesses skills; critical deficits in body/mind/social.' },
  'HLLL': { name: 'The Wild Huntsman', desc: 'Only possesses physical vitality; deficits in control and structure.' },
  'HLHL': { name: 'The Wandering Troubadour', desc: 'High energy/social, but lacks focus and practical skills.' },
  'LLHH': { name: 'The Cerebral Anchor', desc: 'Strong mind and connection; lacks physical and practical base.' }
};

function getArchetypeFromAttrXP(attrXP) {
  const code = ['V', 'R', 'C', 'M'].map(attr => ((attrXP ?? {})[attr] ?? 0) < 50 ? 'L' : 'H').join('');
  return ARCHETYPES[code] || { name: 'The Wayward Alchemist', desc: 'Your path is unique and unwritten.' };
}

const ATTR_NAMES = { V: 'Vitality', R: 'Resilience', C: 'Connection', M: 'Mastery' };
const getQuestionsByAttr = (attr) => QUESTIONS.filter((q) => q.attr === attr);

// Helper function to calculate enemy positions in a circle/spread pattern
const getEnemyPosition = (index, total) => {
  if (total === 0) return { x: 50, y: 50 };
  
  // Spread enemies in a semi-circle pattern
  const angle = (index / total) * Math.PI * 1.5 + Math.PI * 0.25; // Start from top-left, go clockwise
  const radius = 35; // Distance from center
  const centerX = 70;
  const centerY = 40;
  
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
};

export default function App() {
  // Load saved state if it exists
  const [step, setStep] = useState(() => {
    const s = localStorage.getItem('sh_step') || 'onboarding';
    const hasResults = !!localStorage.getItem('sh_results');
    if (s === 'trial') return 'trial-attributes'; // migrate old step
    // Always show welcome first if user hasn't completed trial
    if (!hasResults && s !== 'onboarding') return 'onboarding';
    return s;
  });
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [trialAttr, setTrialAttr] = useState(null); // V|R|C|M when in trial-questions
  const [results, setResults] = useState(() => JSON.parse(localStorage.getItem('sh_results')) || null);
  const [mapView, setMapView] = useState(false);
  const [profileView, setProfileView] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questFlowStep, setQuestFlowStep] = useState(null); // 'confirm' | 'availability' | 'in-progress' | 'complete'
  const [questStepIndex, setQuestStepIndex] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState(() => JSON.parse(localStorage.getItem('sh_completed_tasks')) || []);
  const [completedQuestIds, setCompletedQuestIds] = useState(() => JSON.parse(localStorage.getItem('sh_completed_quests')) || []);
  const [taskBoardKey, setTaskBoardKey] = useState(0);
  const [mapQuestKey, setMapQuestKey] = useState(0); // reshuffle positions when entering map
  const [userName, setUserName] = useState(() => localStorage.getItem('sh_user_name') || '');
  const [userDescription, setUserDescription] = useState(() => localStorage.getItem('sh_user_description') || '');
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [defeatedEnemies, setDefeatedEnemies] = useState(() => JSON.parse(localStorage.getItem('sh_defeated_enemies')) || []);
  const [attackingEnemy, setAttackingEnemy] = useState(null);
  const [userPosition, setUserPosition] = useState({ x: 20, y: 70 }); // Starting position in percentage (bottom left)
  const [generatedTasks, setGeneratedTasks] = useState(() => {
    const saved = localStorage.getItem('sh_generated_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [selectedGeneratedTask, setSelectedGeneratedTask] = useState(null);

  // Board tasks - fixed set that doesn't regenerate after completion
  const [fixedBoardTasks, setFixedBoardTasks] = useState(() => {
    const saved = localStorage.getItem('sh_fixed_board_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Invalid JSON, will generate new
      }
    }
    return [];
  });

  // Initialize fixed board tasks on first load if not set
  useEffect(() => {
    if (fixedBoardTasks.length === 0 && results) {
      const initialCompleted = JSON.parse(localStorage.getItem('sh_completed_tasks')) || [];
      const initialTasks = getTasksForBoard(initialCompleted, 5);
      if (initialTasks.length > 0) {
        setFixedBoardTasks(initialTasks);
        localStorage.setItem('sh_fixed_board_tasks', JSON.stringify(initialTasks));
      }
    }
  }, [results]);

  // Save generated tasks to localStorage
  useEffect(() => {
    if (generatedTasks.length > 0) {
      localStorage.setItem('sh_generated_tasks', JSON.stringify(generatedTasks));
    }
  }, [generatedTasks]);

  // Save generated tasks to localStorage
  useEffect(() => {
    if (generatedTasks.length > 0) {
      localStorage.setItem('sh_generated_tasks', JSON.stringify(generatedTasks));
    }
  }, [generatedTasks]);

  // Save fixed board tasks to localStorage
  useEffect(() => {
    if (fixedBoardTasks.length > 0) {
      localStorage.setItem('sh_fixed_board_tasks', JSON.stringify(fixedBoardTasks));
    }
  }, [fixedBoardTasks]);

  const boardTasks = fixedBoardTasks;

  // Non-overlapping positions for quest circles (shuffled when entering map or completing quest)
  const QUEST_SLOTS = [
    { top: '8%', left: '12%' }, { top: '28%', left: '68%' }, { top: '58%', left: '15%' },
    { top: '18%', left: '38%' }, { top: '62%', left: '58%' }, { top: '38%', left: '82%' },
    { top: '15%', left: '45%' }, { top: '45%', left: '25%' }, { top: '72%', left: '35%' },
    { top: '35%', left: '55%' }, { top: '55%', left: '75%' }, { top: '22%', left: '18%' },
  ];
  const shuffledSlots = useMemo(
    () => [...QUEST_SLOTS].sort(() => Math.random() - 0.5),
    [selectedLocation, mapQuestKey]
  );

  // Persistence Hook
  useEffect(() => {
    localStorage.setItem('sh_step', step);
    if (results) localStorage.setItem('sh_results', JSON.stringify(results));
    localStorage.setItem('sh_completed_tasks', JSON.stringify(completedTaskIds));
    localStorage.setItem('sh_completed_quests', JSON.stringify(completedQuestIds));
    localStorage.setItem('sh_user_name', userName);
    localStorage.setItem('sh_user_description', userDescription);
    localStorage.setItem('sh_defeated_enemies', JSON.stringify(defeatedEnemies));
  }, [step, results, completedTaskIds, completedQuestIds, userName, userDescription, defeatedEnemies]);

  // Sync defeated enemies with completed tasks when board tasks change
  useEffect(() => {
    if (boardTasks.length > 0) {
      const currentDefeated = defeatedEnemies.filter(idx => idx < boardTasks.length);
      if (currentDefeated.length !== defeatedEnemies.length) {
        setDefeatedEnemies(currentDefeated);
      }
    }
  }, [boardTasks.length]);

  const handleAnswer = (val) => {
    const qs = getQuestionsByAttr(trialAttr);
    const q = qs[currentQ];
    const newAnswers = { ...answers, [q.id]: val };
    setAnswers(newAnswers);
    if (currentQ < qs.length - 1) setCurrentQ(currentQ + 1);
    else {
      setStep('trial-attributes');
      setTrialAttr(null);
      setCurrentQ(0);
    }
  };

  const handleTrialConfirm = () => {
    calculateResults(answers);
    setStep('results');
    setTrialAttr(null);
    setCurrentQ(0);
  };

  const calculateResults = (finalAnswers) => {
    const scores = { V: 0, R: 0, C: 0, M: 0 };
    let totalRaw = 0;
    QUESTIONS.forEach(q => {
      scores[q.attr] += finalAnswers[q.id] ?? 0;
      totalRaw += finalAnswers[q.id] ?? 0;
    });

    // attrXP: unlimited per attribute. Initial from trial (4–20) → *5 = 20–100
    const attrXP = {
      V: (scores.V ?? 0) * 5,
      R: (scores.R ?? 0) * 5,
      C: (scores.C ?? 0) * 5,
      M: (scores.M ?? 0) * 5,
    };
    const archetype = getArchetypeFromAttrXP(attrXP);
    // Calculate initial total XP based on trial scores (4-20 per attribute, 16-80 total)
    // Convert to a reasonable starting XP (e.g., 100 XP per point)
    const initialTotalXP = totalRaw * 100;
    const initialLevel = getTotalLevel(initialTotalXP);
    
    setResults({
      scores,
      attrXP,
      archetype,
      level: initialLevel,
      xp: initialTotalXP,
      coins: results?.coins ?? 0,
      primaryNeed: Object.keys(attrXP).reduce((a, b) => attrXP[a] < attrXP[b] ? a : b)
    });
  };

  const hasAttrAnswers = (attr) => getQuestionsByAttr(attr).every((q) => answers[q.id] !== undefined);
  const allAttrsAnswered = ['V', 'R', 'C', 'M'].every(hasAttrAnswers);

  const resetProfile = () => {
    setStep('onboarding');
    setCurrentQ(0);
    setAnswers({});
    setTrialAttr(null);
    setResults(null);
    setSelectedQuest(null);
    setQuestFlowStep(null);
    setCompletedTaskIds([]);
    setCompletedQuestIds([]);
    setUserName('');
    setUserDescription('');
    setDefeatedEnemies([]);
    setAttackingEnemy(null);
    setUserPosition({ x: 20, y: 70 });
    setFixedBoardTasks([]);
    setGeneratedTasks([]);
    setProfileView(false);
    setMapView(false);
    localStorage.removeItem('sh_step');
    localStorage.removeItem('sh_results');
    localStorage.removeItem('sh_completed_tasks');
    localStorage.removeItem('sh_completed_quests');
    localStorage.removeItem('sh_user_name');
    localStorage.removeItem('sh_user_description');
    localStorage.removeItem('sh_defeated_enemies');
    localStorage.removeItem('sh_fixed_board_tasks');
    localStorage.removeItem('sh_generated_tasks');
  };

  const handleEditName = () => {
    setTempName(userName);
    setEditingName(true);
  };

  const handleSaveName = () => {
    setUserName(tempName);
    setEditingName(false);
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setTempName('');
  };

  const handleEditDescription = () => {
    setTempDescription(userDescription);
    setEditingDescription(true);
  };

  const handleSaveDescription = () => {
    setUserDescription(tempDescription);
    setEditingDescription(false);
  };

  const handleCancelEditDescription = () => {
    setEditingDescription(false);
    setTempDescription('');
  };

  const handleTaskComplete = (task, isQuickTask = false) => {
    if (!results) return;
    
    // Check if task is already completed
    if (completedTaskIds.includes(task.id)) return;
    
    // Find the task index to determine which enemy to attack (only for main board tasks)
    const taskIndex = boardTasks.findIndex(t => t.id === task.id);
    const isMainBoardTask = taskIndex !== -1;
    
    // Only trigger attack animation for main board tasks
    if (isMainBoardTask && !isQuickTask) {
      setAttackingEnemy(taskIndex);
    }
    
    // Function to update rewards and state
    const updateTaskCompletion = () => {
      const { xp, coins } = getTaskRewards(task);
      const attrBonus = task.attrXP ?? {};
      setResults((prev) => {
        const base = (v, s) => (v ?? (s ?? 0) * 5);
        const newAttrXP = {
          V: base(prev.attrXP?.V, prev.scores?.V) + (attrBonus.V ?? 0),
          R: base(prev.attrXP?.R, prev.scores?.R) + (attrBonus.R ?? 0),
          C: base(prev.attrXP?.C, prev.scores?.C) + (attrBonus.C ?? 0),
          M: base(prev.attrXP?.M, prev.scores?.M) + (attrBonus.M ?? 0),
        };
        const newTotalXP = (prev.xp ?? 0) + xp;
        const newTotalLevel = getTotalLevel(newTotalXP);
        return {
          ...prev,
          xp: newTotalXP,
          level: newTotalLevel,
          coins: (prev.coins ?? 0) + coins,
          attrXP: newAttrXP,
          archetype: getArchetypeFromAttrXP(newAttrXP),
          primaryNeed: Object.keys(newAttrXP).reduce((a, b) => newAttrXP[a] < newAttrXP[b] ? a : b),
        };
      });
      setCompletedTaskIds((prev) => [...prev, task.id]);
      if (isMainBoardTask && !isQuickTask) {
        setDefeatedEnemies((prev) => [...prev, taskIndex]);
      }
      if (isMainBoardTask && !isQuickTask) {
        setAttackingEnemy(null);
      }
    };
    
    // For main board tasks, wait for animation. For quick tasks, complete immediately
    if (isMainBoardTask && !isQuickTask) {
      setTimeout(updateTaskCompletion, 1500); // Animation duration
    } else {
      updateTaskCompletion();
    }
  };

  const handleQuestClick = (quest) => {
    if (quest.unlocked !== true) return;
    setSelectedQuest(quest);
    setQuestFlowStep('confirm');
    setQuestStepIndex(0);
  };

  const handleQuestProceed = () => {
    setQuestFlowStep('availability');
  };

  const handleQuestRegenerate = () => {
    const quests = getQuestsByPillar(selectedQuest.pillar).filter(
      (q) => q.unlocked && q.id !== selectedQuest.id && !completedQuestIds.includes(q.id)
    );
    if (quests.length > 0) {
      const randomQuest = quests[Math.floor(Math.random() * quests.length)];
      setSelectedQuest(randomQuest);
      setQuestFlowStep('confirm');
    } else {
      setSelectedQuest(null);
      setQuestFlowStep(null);
    }
  };

  const handleQuestAvailable = () => {
    setQuestFlowStep('in-progress');
    setQuestStepIndex(0);
  };

  const handleQuestStepNext = () => {
    const steps = selectedQuest?.steps ?? [];
    if (questStepIndex < steps.length - 1) {
      setQuestStepIndex(questStepIndex + 1);
    } else {
      setQuestFlowStep('complete');
      const { xp, coins, attrXP: attrBonus } = getQuestRewards(selectedQuest);
      setResults((prev) => {
        const base = (v, s) => (v ?? (s ?? 0) * 5);
        const newAttrXP = {
          V: base(prev.attrXP?.V, prev.scores?.V) + (attrBonus?.V ?? 0),
          R: base(prev.attrXP?.R, prev.scores?.R) + (attrBonus?.R ?? 0),
          C: base(prev.attrXP?.C, prev.scores?.C) + (attrBonus?.C ?? 0),
          M: base(prev.attrXP?.M, prev.scores?.M) + (attrBonus?.M ?? 0),
        };
        const newTotalXP = (prev.xp ?? 0) + xp;
        const newTotalLevel = getTotalLevel(newTotalXP);
        return {
          ...prev,
          xp: newTotalXP,
          level: newTotalLevel,
          coins: (prev.coins ?? 0) + coins,
          attrXP: newAttrXP,
          archetype: getArchetypeFromAttrXP(newAttrXP),
          primaryNeed: Object.keys(newAttrXP).reduce((a, b) => newAttrXP[a] < newAttrXP[b] ? a : b),
        };
      });
    }
  };

  const handleQuestComplete = () => {
    if (selectedQuest?.id) setCompletedQuestIds((prev) => [...prev, selectedQuest.id]);
    setSelectedQuest(null);
    setQuestFlowStep(null);
    setQuestStepIndex(0);
    setMapQuestKey((k) => k + 1); // reshuffle positions
  };

  const exitQuestFlow = () => {
    setSelectedQuest(null);
    setQuestFlowStep(null);
    setQuestStepIndex(0);
  };

  // Generate tasks using Gemini API
  const handleGenerateTasks = async () => {
    if (!results) return;
    
    setIsGeneratingTasks(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert('API key not configured. Please set VITE_GEMINI_API_KEY in your environment variables.');
        setIsGeneratingTasks(false);
        return;
      }

      // Build prompt with user info and stats
      const userStats = {
        level: results.level,
        xp: results.xp,
        attributes: {
          V: getAttrLevel(results.attrXP?.V ?? (results.scores?.V ?? 0) * 5),
          R: getAttrLevel(results.attrXP?.R ?? (results.scores?.R ?? 0) * 5),
          C: getAttrLevel(results.attrXP?.C ?? (results.scores?.C ?? 0) * 5),
          M: getAttrLevel(results.attrXP?.M ?? (results.scores?.M ?? 0) * 5),
        },
        archetype: results.archetype.name,
        description: userDescription || 'No description provided'
      };

      const prompt = `Generate 3 personalized daily tasks for a user in a gamification app. 

User Information:
- Name: ${userName || 'User'}
- Description: ${userStats.description}
- Archetype: ${userStats.archetype}
- Level: ${userStats.level}
- Attributes: Physical Lv${userStats.attributes.V}, Mental Lv${userStats.attributes.R}, Social Lv${userStats.attributes.C}, Intelligent Lv${userStats.attributes.M}

Generate 3 tasks that are:
1. Personalized based on the user's description and archetype
2. Appropriate for their current attribute levels
3. Actionable and specific
4. Varied in difficulty (mix of micro, standard, and challenge tasks)

Return ONLY a JSON array of objects with this exact format:
[
  {
    "title": "Short task title (max 50 characters)",
    "description": "Detailed task description with steps and instructions",
    "difficulty": "micro|standard|challenge",
    "attrXP": {"V": 1} or {"R": 1} or {"C": 1} or {"M": 1} or combination of attributes
  },
  ...
]

Important:
- "title" should be a concise, catchy title (max 50 chars) that summarizes the task
- "description" should be the full detailed explanation with steps, context, and instructions
- "difficulty" must be one of: "micro", "standard", or "challenge"
- "attrXP" should be an object with attribute keys (V, R, C, M) and numeric values (1-5 for micro, 3-10 for standard, 8-25 for challenge)

Do not include any other text, only the JSON array.`;

      // Use the correct Gemini API endpoint
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Unexpected API response:', data);
        throw new Error('Invalid response format from API');
      }
      
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response (handle markdown code blocks if present)
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      const tasks = JSON.parse(jsonText);
      
      // Add unique IDs and ensure proper format
      const formattedTasks = tasks.map((task, index) => ({
        id: `generated-${Date.now()}-${index}`,
        title: task.title || task.text?.substring(0, 50) || `Task ${index + 1}`,
        text: task.description || task.text || task.title || `Task ${index + 1}`,
        description: task.description || task.text || task.title || `Task ${index + 1}`,
        difficulty: task.difficulty || 'standard',
        attrXP: task.attrXP || { V: 1 }
      }));

      setGeneratedTasks(formattedTasks);
    } catch (error) {
      console.error('Error generating tasks:', error);
      alert('Failed to generate tasks. Please try again.');
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 text-slate-800 font-sans selection:bg-amber-500/30 overflow-x-hidden" style={{ imageRendering: 'pixelated' }}>
      <AnimatePresence mode="wait">
        
        {/* 1. Welcome / Story */}
        {step === 'onboarding' && (
          <motion.div key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative" style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 66%, #228B22 66%, #228B22 100%)' }}>
            {/* Hexagonal clouds */}
            <div className="absolute top-10 left-10 w-16 h-16 bg-white/80" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)', imageRendering: 'pixelated' }}></div>
            <div className="absolute top-20 right-20 w-12 h-12 bg-white/80" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)', imageRendering: 'pixelated' }}></div>
            <div className="absolute top-16 right-32 w-14 h-14 bg-white/80" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)', imageRendering: 'pixelated' }}></div>
            
            {/* Main Dialogue Box */}
            <div className="w-full max-w-2xl bg-amber-50 border-4 border-amber-900 p-6 relative z-10" style={{ imageRendering: 'pixelated' }}>
              {/* Banner */}
              <div className="bg-amber-900 border-2 border-amber-950 p-2 mb-4 text-center" style={{ imageRendering: 'pixelated' }}>
                <h2 className="text-white font-mono text-xs font-bold uppercase">THE ORACLE'S REALM</h2>
              </div>
              
              {/* Title */}
              <h1 className="font-mono text-2xl font-bold text-black mb-4 text-center uppercase">Welcome, Traveler</h1>
              
              {/* Text Content */}
              <div className="space-y-3 text-left mb-6">
                <p className="font-mono text-xs text-black leading-relaxed">
                  You stand before the ancient Oracle, a mystical entity that has guided countless souls on their journey of self-discovery. The air shimmers with ethereal energy as the Oracle's voice echoes in your mind...
                </p>
                <p className="font-mono text-xs text-black leading-relaxed">
                  "Four pillars hold the foundation of every being: <span className="text-red-600 font-bold">PHYSICAL</span> strength, <span className="text-red-600 font-bold">MENTAL</span> fortitude, <span className="text-red-600 font-bold">SOCIAL</span> grace, and <span className="text-red-600 font-bold">INTELLIGENT</span> wisdom."
                </p>
                <p className="font-mono text-xs text-black leading-relaxed">
                  "Each path holds questions that will reveal your true nature. Answer honestly, for the Oracle sees all truths. Your journey begins with a choice..."
                </p>
                <p className="font-mono text-sm text-blue-600 font-bold text-center mt-4">
                  Which aspect of yourself will you explore first?
                </p>
              </div>
              
              {/* Button */}
              <div className="flex justify-center">
                <button 
                  onClick={() => setStep('trial-attributes')} 
                  className="px-8 py-3 bg-green-500 border-4 border-green-700 text-white font-mono text-xs font-bold uppercase hover:bg-green-600"
                  style={{ imageRendering: 'pixelated', transition: 'none', boxShadow: '4px 4px 0px 0px #1a5a1a' }}
                >
                  BEGIN JOURNEY
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. Four attribute panels */}
        {step === 'trial-attributes' && (
          <motion.div key="attr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative" style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 66%, #228B22 66%, #228B22 100%)' }}>
            {/* Hexagonal clouds */}
            <div className="absolute top-10 left-10 w-16 h-16 bg-white/80" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)', imageRendering: 'pixelated' }}></div>
            <div className="absolute top-20 right-20 w-12 h-12 bg-white/80" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)', imageRendering: 'pixelated' }}></div>
            
            {/* Back button */}
            <button 
              onClick={() => setStep('onboarding')} 
              className="absolute top-6 left-6 bg-amber-50 border-2 border-amber-900 text-amber-900 font-mono text-xs px-3 py-1 hover:bg-amber-100 z-10"
              style={{ imageRendering: 'pixelated', transition: 'none' }}
            >
              ← BACK
            </button>
            
            {/* Instruction Banner */}
            <div className="w-full max-w-3xl bg-amber-50 border-4 border-amber-900 p-4 mb-8 text-center" style={{ imageRendering: 'pixelated' }}>
              <h2 className="font-mono text-lg font-bold text-amber-900 mb-2 uppercase">Choose Your Path</h2>
              <p className="font-mono text-xs text-amber-900">Select each circle to answer 5 questions</p>
            </div>
            
            {/* Four Path Panels */}
            <div className="grid grid-cols-4 gap-4 max-w-4xl mb-8">
              {[
                { attr: 'V', name: 'PHYSICAL', color: 'bg-red-500', icon: '💪' },
                { attr: 'R', name: 'MENTAL', color: 'bg-sky-300', icon: '🧠' },
                { attr: 'C', name: 'SOCIAL', color: 'bg-pink-500', icon: '👥' },
                { attr: 'M', name: 'INTELLIGENT', color: 'bg-green-400', icon: '📚' }
              ].map(({ attr, name, color, icon }) => {
                const done = hasAttrAnswers(attr);
                return (
                  <div key={attr} className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        setTrialAttr(attr);
                        setCurrentQ(0);
                        setStep('trial-questions');
                      }}
                      className={`w-24 h-24 ${color} border-4 border-amber-900 flex items-center justify-center relative hover:opacity-90`}
                      style={{ imageRendering: 'pixelated', transition: 'none' }}
                    >
                      <span className="text-4xl">{icon}</span>
                      {done && (
                        <div className="absolute top-0 right-0 w-6 h-6 bg-green-500 border-2 border-amber-900 flex items-center justify-center" style={{ imageRendering: 'pixelated' }}>
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                    <div className="w-full mt-2 bg-amber-900 border-2 border-amber-950 p-2 text-center" style={{ imageRendering: 'pixelated' }}>
                      <span className="text-white font-mono text-xs font-bold uppercase">{name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* View Results Button */}
            <button
              onClick={() => setStep('trial-confirm')}
              disabled={!allAttrsAnswered}
              className={`px-8 py-3 border-4 font-mono text-xs font-bold uppercase ${
                allAttrsAnswered 
                  ? 'bg-yellow-400 border-amber-900 text-amber-900 hover:bg-yellow-500' 
                  : 'bg-gray-300 border-gray-500 text-gray-600 cursor-not-allowed'
              }`}
              style={{ imageRendering: 'pixelated', transition: 'none', boxShadow: allAttrsAnswered ? '4px 4px 0px 0px #8B4513' : 'none' }}
            >
              VIEW RESULTS
            </button>
          </motion.div>
        )}

        {/* 3. Four questions for selected attribute */}
        {step === 'trial-questions' && trialAttr && (
          <motion.div key="qs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative" style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 66%, #228B22 66%, #228B22 100%)' }}>
            {/* Back button */}
            <button 
              onClick={() => { setStep('trial-attributes'); setTrialAttr(null); setCurrentQ(0); }} 
              className="absolute top-6 left-6 bg-amber-50 border-2 border-amber-900 text-amber-900 font-mono text-xs px-3 py-1 hover:bg-amber-100 z-10"
              style={{ imageRendering: 'pixelated', transition: 'none' }}
            >
              ← BACK
            </button>
            
            {/* Main Quest Box */}
            <div className="w-full max-w-2xl bg-amber-50 border-4 border-amber-900 p-6 relative" style={{ imageRendering: 'pixelated', boxShadow: '8px 8px 0px 0px #8B4513' }}>
              {/* Title and Progress */}
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-mono text-sm font-bold text-amber-900 uppercase">
                  {trialAttr === 'V' ? 'PHYSICAL' : trialAttr === 'R' ? 'MENTAL' : trialAttr === 'C' ? 'SOCIAL' : 'INTELLIGENT'} QUEST
                </h2>
                <span className="font-mono text-xs text-amber-900">{currentQ + 1}/4</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-4 bg-amber-900 border-2 border-amber-950 mb-4" style={{ imageRendering: 'pixelated' }}>
                <div 
                  className="h-full bg-green-500"
                  style={{ 
                    width: `${((currentQ + 1) / 4) * 100}%`,
                    imageRendering: 'pixelated'
                  }}
                ></div>
              </div>
              
              {/* Question Box */}
              <div className="bg-yellow-200 border-2 border-amber-900 p-4 mb-4" style={{ imageRendering: 'pixelated' }}>
                <p className="font-mono text-xs text-amber-900 leading-relaxed">
                  {getQuestionsByAttr(trialAttr)[currentQ].text}
                </p>
              </div>
              
              {/* Answer Options - 5 point scale */}
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((val) => {
                  const labels = [
                    "Strongly Disagree",
                    "Disagree",
                    "Neutral",
                    "Agree",
                    "Strongly Agree"
                  ];
                  return (
                    <button
                      key={val}
                      onClick={() => handleAnswer(val)}
                      className="w-full bg-blue-50 border-2 border-amber-900 p-3 text-left hover:bg-blue-100 font-mono text-xs text-amber-900"
                      style={{ imageRendering: 'pixelated', transition: 'none' }}
                    >
                      {val}. {labels[val - 1]}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. Confirm step */}
        {step === 'trial-confirm' && (
          <motion.div key="cf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 66%, #228B22 66%, #228B22 100%)' }}>
            <div className="w-full max-w-xl bg-amber-50 border-4 border-amber-900 p-6" style={{ imageRendering: 'pixelated', boxShadow: '8px 8px 0px 0px #8B4513' }}>
              <h2 className="font-mono text-lg font-bold text-amber-900 mb-4 uppercase">Is this what you want?</h2>
              <p className="font-mono text-xs text-amber-900 mb-8">You have assessed all four pillars. Your archetype awaits.</p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setStep('trial-attributes')} 
                  className="px-6 py-3 border-4 border-amber-900 bg-gray-300 text-amber-900 font-mono text-xs font-bold uppercase hover:bg-gray-400"
                  style={{ imageRendering: 'pixelated', transition: 'none' }}
                >
                  Go back
                </button>
                <button 
                  onClick={handleTrialConfirm} 
                  className="px-8 py-3 border-4 border-amber-900 bg-orange-400 text-amber-900 font-mono text-xs font-bold uppercase hover:bg-orange-500"
                  style={{ imageRendering: 'pixelated', transition: 'none', boxShadow: '4px 4px 0px 0px #8B4513' }}
                >
                  Yes, reveal my archetype
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'results' && results && (
          <motion.div key="res" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8" style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 66%, #228B22 66%, #228B22 100%)' }}>
            {/* Main Results Box */}
            <div className="w-full max-w-2xl bg-yellow-50 border-4 border-amber-900 p-6" style={{ imageRendering: 'pixelated', boxShadow: '8px 8px 0px 0px #8B4513' }}>
              {/* Character Portrait Placeholder */}
              <div className="w-24 h-24 bg-blue-200 border-4 border-amber-900 mx-auto mb-4 flex items-center justify-center" style={{ imageRendering: 'pixelated' }}>
                <div className="w-16 h-16 bg-amber-300 border-2 border-amber-900 flex items-center justify-center" style={{ imageRendering: 'pixelated' }}>
                  <span className="text-amber-900 font-mono text-2xl font-bold">
                    {results.archetype.name.charAt(0)}
                  </span>
                </div>
              </div>
              
              {/* Archetype Name */}
              <h3 className="font-mono text-xl font-bold text-amber-900 text-center mb-2 uppercase">{results.archetype.name}</h3>
              <p className="font-mono text-xs text-amber-900 text-center mb-6">"{results.archetype.desc}"</p>
              
              {/* Stats Header */}
              <div className="bg-amber-900 border-2 border-amber-950 p-2 mb-4 text-center" style={{ imageRendering: 'pixelated' }}>
                <h4 className="text-amber-50 font-mono text-xs font-bold uppercase">YOUR STATS</h4>
              </div>
              
              {/* Stats Bars */}
              <div className="space-y-3">
                {[
                  { attr: 'V', name: 'Physical', icon: '💪', color: 'bg-red-500' },
                  { attr: 'R', name: 'Mental', icon: '🧠', color: 'bg-blue-500' },
                  { attr: 'C', name: 'Social', icon: '👥', color: 'bg-pink-500' },
                  { attr: 'M', name: 'Intelligent', icon: '📚', color: 'bg-green-500' }
                ].map(({ attr, name, icon, color }) => {
                  const score = results.scores?.[attr] ?? 0;
                  const maxScore = 20; // 4 questions * 5 max points
                  const percentage = (score / maxScore) * 100;
                  return (
                    <div key={attr} className="bg-yellow-50 border-2 border-amber-900 p-3" style={{ imageRendering: 'pixelated' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{icon}</span>
                          <span className="font-mono text-xs font-bold text-amber-900 uppercase">{name}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-900">{score}</span>
                      </div>
                      <div className="w-full h-4 bg-amber-900 border border-amber-950" style={{ imageRendering: 'pixelated' }}>
                        <div 
                          className={`h-full ${color}`}
                          style={{ 
                            width: `${percentage}%`,
                            imageRendering: 'pixelated'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button 
                  onClick={() => setStep('dashboard')} 
                  className="flex-1 py-3 bg-green-500 border-4 border-green-700 text-white font-mono text-xs font-bold uppercase hover:bg-green-600"
                  style={{ imageRendering: 'pixelated', transition: 'none', boxShadow: '4px 4px 0px 0px #1a5a1a' }}
                >
                  ENTER REALM
                </button>
                <button 
                  className="flex-1 py-3 bg-purple-500 border-4 border-purple-700 text-white font-mono text-xs font-bold uppercase hover:bg-purple-600"
                  style={{ imageRendering: 'pixelated', transition: 'none', boxShadow: '4px 4px 0px 0px #4a1a5a' }}
                >
                  VIEW INVENTORY
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'dashboard' && results && (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex flex-col pb-20">
            <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full relative">
              {/* Profile view */}
              {profileView ? (
                <div className="min-h-[60vh] space-y-6 pb-6">
                  {/* Header */}
                  <div className="relative -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-4 pt-4 md:px-6 md:pt-6 pb-8 bg-purple-200 border-b-4 border-purple-900" style={{ imageRendering: 'pixelated' }}>
                    <div className="relative flex items-center justify-between mb-6">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <Zap size={20} className="text-amber-900" style={{ imageRendering: 'pixelated' }} />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-mono text-amber-900 mb-1 uppercase">Profile</div>
                        <div className="flex justify-center gap-1">
                          <div className="w-2 h-2 bg-amber-900"></div>
                          <div className="w-2 h-2 bg-amber-700"></div>
                          <div className="w-2 h-2 bg-amber-700"></div>
                        </div>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center">
                      </div>
                    </div>
                    
                    {/* Profile Picture and Info */}
                    <div className="relative flex flex-col items-center">
                      <div className="w-24 h-24 bg-blue-200 border-4 border-amber-900 mb-3 flex items-center justify-center" style={{ imageRendering: 'pixelated' }}>
                        <div className="w-16 h-16 bg-amber-300 border-2 border-amber-900 flex items-center justify-center" style={{ imageRendering: 'pixelated' }}>
                          <span className="text-amber-900 font-mono text-2xl font-bold">
                            {userName ? userName.charAt(0).toUpperCase() : (results.archetype.name.charAt(4) || 'S')}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        {editingName ? (
                          <div className="flex items-center gap-2 justify-center mb-1">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="bg-slate-100 border-2 border-amber-900 px-3 py-1 text-amber-900 font-mono text-sm text-center focus:outline-none"
                              placeholder="Enter your name"
                              autoFocus
                              style={{ imageRendering: 'pixelated' }}
                            />
                            <button
                              onClick={handleSaveName}
                              className="p-1.5 bg-orange-400 border-2 border-amber-900 text-amber-900 hover:bg-orange-500"
                              style={{ imageRendering: 'pixelated', transition: 'none' }}
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={handleCancelEditName}
                              className="p-1.5 bg-slate-300 border-2 border-amber-900 text-amber-900 hover:bg-slate-400"
                              style={{ imageRendering: 'pixelated', transition: 'none' }}
                            >
                              <ChevronLeft size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-center mb-1">
                            <h2 className="font-mono text-xl font-bold text-amber-900 uppercase">
                              {userName || 'TestUser'}
                            </h2>
                            <button
                              onClick={handleEditName}
                              className="p-1 bg-amber-100 border-2 border-amber-900 text-amber-900 hover:bg-orange-200"
                              style={{ imageRendering: 'pixelated', transition: 'none' }}
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="p-4 bg-amber-50 border-4 border-amber-900" style={{ imageRendering: 'pixelated' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-mono text-sm font-bold text-amber-900 uppercase">About Me</h3>
                      {!editingDescription && (
                        <button
                          onClick={handleEditDescription}
                          className="p-1.5 bg-amber-100 border-2 border-amber-900 text-amber-900 hover:bg-orange-200"
                          style={{ imageRendering: 'pixelated', transition: 'none' }}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                    {editingDescription ? (
                      <div className="space-y-3">
                        <textarea
                          value={tempDescription}
                          onChange={(e) => setTempDescription(e.target.value)}
                          className="w-full bg-slate-100 border-2 border-amber-900 px-3 py-2 text-amber-900 font-mono text-xs focus:outline-none resize-none"
                          placeholder="Write a description about yourself... (This will be used for generating personalized tasks)"
                          rows={4}
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleCancelEditDescription}
                            className="px-3 py-1.5 bg-slate-300 border-2 border-amber-900 text-amber-900 hover:bg-slate-400 font-mono text-xs"
                            style={{ imageRendering: 'pixelated', transition: 'none' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveDescription}
                            className="px-3 py-1.5 bg-orange-400 border-2 border-amber-900 text-amber-900 hover:bg-orange-500 font-mono text-xs flex items-center gap-1"
                            style={{ imageRendering: 'pixelated', transition: 'none' }}
                          >
                            <Save size={14} /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-amber-900 leading-relaxed">
                        {userDescription || 'No description yet. Click the edit button to add one.'}
                      </p>
                    )}
                  </div>

                  {/* Logout Button */}
                  <div className="pt-4">
                    <button
                      onClick={resetProfile}
                      className="w-full py-3 px-4 border-4 border-red-900 bg-red-400 text-red-900 hover:bg-red-500 font-mono text-xs font-bold uppercase flex items-center justify-center gap-2"
                      style={{ imageRendering: 'pixelated', transition: 'none' }}
                    >
                      <LogOut size={18} style={{ imageRendering: 'pixelated' }} />
                      Log Out (Reset for Demo)
                    </button>
                  </div>
                </div>
              ) : mapView ? (
                <div className="min-h-[60vh]">
                  {selectedLocation ? (
                    <>
                      <button
                        onClick={() => setSelectedLocation(null)}
                        className="flex items-center gap-2 text-slate-500 hover:text-amber-500 text-sm mb-4"
                      >
                        <ChevronLeft size={18} /> Back
                      </button>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
                        {selectedLocation === 'V' ? 'Vitality' : selectedLocation === 'R' ? 'Resilience' : selectedLocation === 'C' ? 'Connection' : 'Mastery'} — Will Quests
                      </div>
                      <div className="relative w-full aspect-[4/3] max-w-2xl min-h-[280px] bg-salar-card rounded-2xl border border-white/5">
                        {getQuestsByPillar(selectedLocation)
                          .filter((q) => !completedQuestIds.includes(q.id))
                          .map((quest, i) => {
                          const isLocked = quest.unlocked !== true;
                          const pos = shuffledSlots[i % shuffledSlots.length];
                          return (
                            <div
                              key={quest.id}
                              className="absolute w-12 h-12 rounded-full flex items-center justify-center transition-all"
                              style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                              title={isLocked ? `${quest.title || 'Quest'} (Locked)` : quest.title}
                              aria-label={quest.title}
                            >
                              {isLocked ? (
                                <div className="w-full h-full rounded-full bg-slate-800/80 border-2 border-slate-600 flex items-center justify-center opacity-60">
                                  <Lock size={18} className="text-slate-500" />
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleQuestClick(quest)}
                                  className="w-full h-full rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center hover:scale-110 hover:bg-amber-500/30 hover:border-amber-500/60 transition-transform cursor-pointer"
                                  aria-label={quest.title}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Quest flow overlay */}
                      {selectedQuest && questFlowStep && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-50 bg-salar-dark/95 flex flex-col items-center justify-center p-6"
                        >
                          <div className="w-full max-w-lg space-y-6">
                            {questFlowStep === 'confirm' && (
                              <>
                                <h3 className="font-serif text-2xl text-amber-500 text-center">{selectedQuest.title}</h3>
                                <p className="text-slate-400 text-center text-sm">
                                  {selectedQuest.subLocation} — {selectedQuest.majorLocation}
                                </p>
                                <p className="text-slate-300 text-center">Do you want to proceed with this quest?</p>
                                <div className="flex gap-4 justify-center">
                                  <button onClick={exitQuestFlow} className="px-6 py-3 border border-slate-600 text-slate-400 hover:border-slate-500 rounded-lg">
                                    Cancel
                                  </button>
                                  <button onClick={handleQuestProceed} className="px-6 py-3 bg-amber-500/20 border border-amber-500/50 text-amber-500 hover:bg-amber-500/30 rounded-lg">
                                    Proceed
                                  </button>
                                </div>
                              </>
                            )}

                            {questFlowStep === 'availability' && (
                              <>
                                <h3 className="font-serif text-2xl text-amber-500 text-center">{selectedQuest.title}</h3>
                                <p className="text-slate-300 text-center">Are you available to do this quest now?</p>
                                <div className="flex flex-col gap-3">
                                  <button onClick={handleQuestAvailable} className="w-full py-3 bg-amber-500/20 border border-amber-500/50 text-amber-500 hover:bg-amber-500/30 rounded-lg font-medium">
                                    Yes, I'm ready
                                  </button>
                                  <button onClick={handleQuestRegenerate} className="w-full py-3 border border-slate-600 text-slate-400 hover:border-slate-500 rounded-lg flex items-center justify-center gap-2">
                                    <RefreshCw size={18} /> Regenerate quest
                                  </button>
                                  <button onClick={exitQuestFlow} className="text-slate-500 text-sm hover:text-slate-400">
                                    Cancel
                                  </button>
                                </div>
                              </>
                            )}

                            {questFlowStep === 'in-progress' && (
                              <>
                                <div className="flex justify-between items-center">
                                  <button onClick={exitQuestFlow} className="text-slate-500 text-sm hover:text-slate-400 flex items-center gap-1">
                                    <ChevronLeft size={16} /> Exit
                                  </button>
                                  <span className="text-xs text-slate-500">
                                    Step {questStepIndex + 1} of {selectedQuest.steps?.length ?? 0}
                                  </span>
                                </div>
                                <h3 className="font-serif text-xl text-amber-500">{selectedQuest.title}</h3>
                                <p className="text-slate-400 italic text-sm">{selectedQuest.narrativeIntro}</p>
                                <div className="p-4 bg-salar-card rounded-xl border border-white/5">
                                  <p className="text-slate-200 leading-relaxed">
                                    {selectedQuest.steps?.[questStepIndex]}
                                  </p>
                                </div>
                                <button
                                  onClick={handleQuestStepNext}
                                  className="w-full py-3 bg-amber-500/20 border border-amber-500/50 text-amber-500 hover:bg-amber-500/30 rounded-lg font-medium flex items-center justify-center gap-2"
                                >
                                  {questStepIndex < (selectedQuest.steps?.length ?? 1) - 1 ? 'Next step' : 'Complete'} <ChevronRight size={18} />
                                </button>
                              </>
                            )}

                            {questFlowStep === 'complete' && (() => {
                                const rewards = getQuestRewards(selectedQuest);
                                return (
                                <>
                                <div className="text-center">
                                  <h3 className="font-serif text-2xl text-amber-500 mb-2">Quest Complete</h3>
                                  <p className="text-slate-400 italic mb-4">{selectedQuest.signOfCompletion}</p>
                                  <div className="flex flex-wrap gap-4 justify-center mb-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-lg">
                                      <Zap size={20} className="text-amber-500" />
                                      <span className="text-amber-500 font-bold">+{rewards.xp} XP</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-lg">
                                      <Coins size={20} className="text-amber-500" />
                                      <span className="text-amber-500 font-bold">+{rewards.coins} Coins</span>
                                    </div>
                                    {rewards.attrXP && Object.keys(rewards.attrXP).length > 0 && (
                                      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-lg">
                                        <span className="text-amber-500 font-bold">
                                          {Object.entries(rewards.attrXP).map(([a,v]) => `+${v}% ${a}`).join(' ')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={handleQuestComplete}
                                  className="w-full py-3 bg-amber-500/20 border border-amber-500/50 text-amber-500 hover:bg-amber-500/30 rounded-lg font-medium"
                                >
                                  Return to Map
                                </button>
                              </>
                            );
                            })()}
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="relative w-full aspect-[4/3] max-w-xl mx-auto bg-salar-card rounded-2xl border border-white/5 overflow-hidden">
                      {/* 4 attribute location circles at different spots */}
                      <button
                        onClick={() => setSelectedLocation('V')}
                        className="absolute top-[12%] left-[18%] w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center font-serif font-bold text-amber-500 text-lg hover:scale-110 hover:bg-amber-500/30 transition-transform"
                        title="Vitality"
                      >
                        V
                      </button>
                      <button
                        onClick={() => setSelectedLocation('R')}
                        className="absolute top-[15%] right-[22%] w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center font-serif font-bold text-amber-500 text-lg hover:scale-110 hover:bg-amber-500/30 transition-transform"
                        title="Resilience"
                      >
                        R
                      </button>
                      <button
                        onClick={() => setSelectedLocation('C')}
                        className="absolute bottom-[18%] left-[25%] w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center font-serif font-bold text-amber-500 text-lg hover:scale-110 hover:bg-amber-500/30 transition-transform"
                        title="Connection"
                      >
                        C
                      </button>
                      <button
                        onClick={() => setSelectedLocation('M')}
                        className="absolute bottom-[12%] right-[20%] w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center font-serif font-bold text-amber-500 text-lg hover:scale-110 hover:bg-amber-500/30 transition-transform"
                        title="Mastery"
                      >
                        M
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
              {/* Pixel-art style dashboard */}
              <div className="space-y-4">
                {/* Main Profile and Stats Section */}
                <div className="p-4 bg-amber-50 border-4 border-amber-900" style={{ imageRendering: 'pixelated' }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Character Avatar (Left) */}
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-blue-200 border-4 border-amber-900 mb-2 flex items-center justify-center" style={{ imageRendering: 'pixelated' }}>
                        <div className="w-16 h-16 bg-amber-300 border-2 border-amber-900 flex items-center justify-center" style={{ imageRendering: 'pixelated' }}>
                          <span className="text-amber-900 font-mono text-2xl font-bold">
                            {userName ? userName.charAt(0).toUpperCase() : (results.archetype.name.charAt(4) || 'S')}
                          </span>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-orange-500 border-2 border-amber-900 text-black font-mono text-xs font-bold uppercase mb-2 hover:bg-orange-400" style={{ imageRendering: 'pixelated', transition: 'none' }}>
                        CLICK ME
                      </button>
                      <div className="w-full py-2 bg-orange-200 border-2 border-amber-900 text-amber-900 font-mono text-xs font-bold uppercase" style={{ imageRendering: 'pixelated' }}>
                        {results.archetype.name.toUpperCase()}
                      </div>
                    </div>

                    {/* Game Statistics (Right) */}
                    <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {/* LEVEL */}
                      <div className="bg-slate-100 border-2 border-amber-900 p-3" style={{ imageRendering: 'pixelated' }}>
                        <div className="text-xs font-mono font-bold text-amber-900 mb-1 uppercase">LEVEL</div>
                        <div className="text-2xl font-mono font-bold text-amber-900">{results.level}</div>
                      </div>

                      {/* GOLD */}
                      <div className="bg-slate-100 border-2 border-amber-900 p-3" style={{ imageRendering: 'pixelated' }}>
                        <div className="text-xs font-mono font-bold text-amber-900 mb-1 uppercase">GOLD</div>
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-mono font-bold text-amber-900">{results.coins ?? 0}</span>
                          <Coins size={16} className="text-amber-900" style={{ imageRendering: 'pixelated' }} />
                        </div>
                      </div>

                      {/* EXPERIENCE */}
                      <div className="bg-slate-100 border-2 border-amber-900 p-3 md:col-span-1 col-span-2" style={{ imageRendering: 'pixelated' }}>
                        <div className="text-xs font-mono font-bold text-amber-900 mb-1 uppercase">EXPERIENCE</div>
                        <div className="text-sm font-mono text-amber-900 mb-1">{results.xp} XP</div>
                        {(() => {
                          const xpInfo = getTotalXPInLevel(results.xp);
                          const progressPercent = (xpInfo.current / xpInfo.needed) * 100;
                          return (
                            <>
                              <div className="w-full h-4 bg-amber-900 border-2 border-amber-950 mb-1" style={{ imageRendering: 'pixelated' }}>
                                <div 
                                  className="h-full bg-amber-600"
                                  style={{ 
                                    width: `${Math.min(100, progressPercent)}%`,
                                    imageRendering: 'pixelated'
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs font-mono text-amber-900">{xpInfo.needed - xpInfo.current} XP to next level</div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Attributes */}
                      {['V', 'R', 'C', 'M'].map((attr, idx) => {
                        const xp = results.attrXP?.[attr] ?? (results.scores?.[attr] ?? 0) * 5;
                        const level = getAttrLevel(xp);
                        const xpInfo = getAttrXPInLevel(xp);
                        const icons = [
                          <Zap key="v" size={14} className="text-yellow-600" style={{ imageRendering: 'pixelated' }} />,
                          <Sparkles key="r" size={14} className="text-pink-600" style={{ imageRendering: 'pixelated' }} />,
                          <User key="c" size={14} className="text-blue-600" style={{ imageRendering: 'pixelated' }} />,
                          <Zap key="m" size={14} className="text-green-600" style={{ imageRendering: 'pixelated' }} />
                        ];
                        const names = ['Physical', 'Mental', 'Social', 'Intelligent'];
                        return (
                          <div key={attr} className="bg-slate-100 border-2 border-amber-900 p-2" style={{ imageRendering: 'pixelated' }}>
                            <div className="flex items-center gap-1 mb-1">
                              {icons[idx]}
                              <span className="text-xs font-mono font-bold text-amber-900 uppercase">{names[idx]}</span>
                            </div>
                            <div className="text-lg font-mono font-bold text-amber-900">{level}</div>
                            <div className="text-xs font-mono text-amber-700">{xpInfo.current}/{xpInfo.needed} XP</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Daily Wisdom Section */}
                <div className="p-4 bg-purple-200 border-4 border-purple-900" style={{ imageRendering: 'pixelated' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-yellow-600" style={{ imageRendering: 'pixelated' }} />
                    <h3 className="text-sm font-mono font-bold text-purple-900 uppercase">Daily Wisdom</h3>
                  </div>
                  <p className="text-slate-800 font-mono text-xs">"{results.archetype.desc}"</p>
                </div>

                {/* Generate Tasks and Quick Tasks Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Generate Tasks Section */}
                  <div className="p-4 bg-amber-50 border-4 border-amber-900" style={{ imageRendering: 'pixelated' }}>
                    <div className="bg-blue-600 border-2 border-blue-900 p-3 mb-3" style={{ imageRendering: 'pixelated' }}>
                      <h3 className="text-sm font-mono font-bold text-white uppercase">Daily Quests</h3>
                    </div>
                    <div className="p-4 bg-slate-100 border-2 border-amber-900 flex flex-col items-center justify-center min-h-[120px]" style={{ imageRendering: 'pixelated' }}>
                      <div className="text-center">
                        <Zap size={32} className="text-amber-700 mx-auto mb-2" style={{ imageRendering: 'pixelated' }} />
                        <p className="text-xs font-mono text-amber-900 mb-3">
                          {isGeneratingTasks ? 'Generating tasks...' : 'Generate personalized tasks'}
                        </p>
                        <button 
                          onClick={handleGenerateTasks}
                          className="px-6 py-2 bg-orange-500 border-2 border-amber-900 text-black font-mono text-xs font-bold uppercase hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ imageRendering: 'pixelated', transition: 'none' }}
                          disabled={isGeneratingTasks || !results}
                        >
                          {isGeneratingTasks ? 'GENERATING...' : 'GENERATE'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Tasks Dashboard */}
                  <div className="p-4 bg-amber-50 border-4 border-amber-900" style={{ imageRendering: 'pixelated' }}>
                    <div className="bg-orange-600 border-2 border-orange-900 p-3 mb-3" style={{ imageRendering: 'pixelated' }}>
                      <h3 className="text-sm font-mono font-bold text-white uppercase">Quick Tasks</h3>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {(() => {
                        // Get all available quick micro tasks that aren't in the main board and aren't completed
                        const quickTasks = EASY_TASKS
                          .filter(task => !fixedBoardTasks.some(bt => bt.id === task.id))
                          .filter(task => !completedTaskIds.includes(task.id));
                        
                        return quickTasks.length > 0 ? (
                          quickTasks.map((task) => {
                            const { xp, coins } = getTaskRewards(task);
                            const isCompleted = completedTaskIds.includes(task.id);
                            const attrIcons = {
                              'V': <Zap size={12} className="text-yellow-600" style={{ imageRendering: 'pixelated' }} />,
                              'R': <Sparkles size={12} className="text-pink-600" style={{ imageRendering: 'pixelated' }} />,
                              'C': <User size={12} className="text-blue-600" style={{ imageRendering: 'pixelated' }} />,
                              'M': <Zap size={12} className="text-green-600" style={{ imageRendering: 'pixelated' }} />
                            };
                            const taskAttr = Object.keys(task.attrXP || {})[0];
                            return (
                              <div
                                key={task.id}
                                className={`bg-slate-100 border-2 p-2 flex items-center justify-between ${
                                  isCompleted 
                                    ? 'border-gray-500 opacity-50' 
                                    : 'border-amber-900 hover:bg-amber-100'
                                }`}
                                style={{ imageRendering: 'pixelated', transition: 'none' }}
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {taskAttr && attrIcons[taskAttr]}
                                  <span className={`text-xs font-mono truncate ${isCompleted ? 'text-gray-600 line-through' : 'text-amber-900'}`}>
                                    {task.text}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-[10px] font-mono font-bold ${isCompleted ? 'text-gray-600' : 'text-amber-900'}`}>
                                    {isCompleted ? '✓' : `+${xp}`}
                                  </span>
                                  {!isCompleted && (
                                    <button
                                      onClick={() => handleTaskComplete(task, true)}
                                      className="w-5 h-5 border-2 border-amber-900 bg-orange-300 flex items-center justify-center hover:bg-orange-400"
                                      title={`Complete: +${xp} XP, +${coins} coins`}
                                      style={{ imageRendering: 'pixelated', transition: 'none' }}
                                    >
                                      <Check size={10} className="text-amber-900" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3 bg-slate-100 border-2 border-amber-900 text-center" style={{ imageRendering: 'pixelated' }}>
                            <p className="text-xs font-mono text-amber-900">No quick tasks available</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Customized Generated Tasks Section */}
                {generatedTasks.length > 0 && (
                  <div className="p-4 bg-amber-50 border-4 border-amber-900" style={{ imageRendering: 'pixelated' }}>
                    <div className="bg-purple-600 border-2 border-purple-900 p-3 mb-3" style={{ imageRendering: 'pixelated' }}>
                      <h3 className="text-sm font-mono font-bold text-white uppercase">Customized Tasks</h3>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {generatedTasks.map((task) => {
                        const { xp, coins } = getTaskRewards(task);
                        const isCompleted = completedTaskIds.includes(task.id);
                        const attrIcons = {
                          'V': <Zap size={12} className="text-yellow-600" style={{ imageRendering: 'pixelated' }} />,
                          'R': <Sparkles size={12} className="text-pink-600" style={{ imageRendering: 'pixelated' }} />,
                          'C': <User size={12} className="text-blue-600" style={{ imageRendering: 'pixelated' }} />,
                          'M': <Zap size={12} className="text-green-600" style={{ imageRendering: 'pixelated' }} />
                        };
                        const taskAttr = Object.keys(task.attrXP || {})[0];
                        return (
                          <div
                            key={task.id}
                            className={`bg-slate-100 border-2 p-2 ${
                              isCompleted 
                                ? 'border-gray-500 opacity-50' 
                                : 'border-amber-900 hover:bg-amber-100'
                            }`}
                            style={{ imageRendering: 'pixelated', transition: 'none' }}
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              {taskAttr && attrIcons[taskAttr]}
                              <button
                                onClick={() => setSelectedGeneratedTask(task)}
                                className={`text-left flex-1 min-w-0 text-xs font-mono font-bold truncate ${isCompleted ? 'text-gray-600 line-through' : 'text-amber-900'} hover:underline cursor-pointer`}
                              >
                                {task.title || task.text?.substring(0, 50) || 'Task'}
                              </button>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-[10px] font-mono font-bold ${isCompleted ? 'text-gray-600' : 'text-amber-900'}`}>
                                  {isCompleted ? '✓' : `+${xp}`}
                                </span>
                                {!isCompleted && (
                                  <button
                                    onClick={() => handleTaskComplete(task, true)}
                                    className="w-5 h-5 border-2 border-amber-900 bg-orange-300 flex items-center justify-center hover:bg-orange-400"
                                    title={`Complete: +${xp} XP, +${coins} coins`}
                                    style={{ imageRendering: 'pixelated', transition: 'none' }}
                                  >
                                    <Check size={10} className="text-amber-900" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customized Task Detail Popup */}
                {selectedGeneratedTask && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-blue-100/95 flex flex-col items-center justify-center p-6"
                    style={{ imageRendering: 'pixelated' }}
                    onClick={() => setSelectedGeneratedTask(null)}
                  >
                    <div 
                      className="w-full max-w-lg bg-amber-50 border-4 border-amber-900 p-6 relative" 
                      style={{ imageRendering: 'pixelated', boxShadow: '8px 8px 0px 0px #8B4513' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Close button */}
                      <button
                        onClick={() => setSelectedGeneratedTask(null)}
                        className="absolute top-2 right-2 w-6 h-6 border-2 border-amber-900 bg-red-400 text-amber-900 font-mono text-xs font-bold hover:bg-red-500 flex items-center justify-center"
                        style={{ imageRendering: 'pixelated', transition: 'none' }}
                      >
                        ×
                      </button>
                      
                      {/* Task Header */}
                      <div className="mb-4">
                        <div className="bg-amber-900 border-2 border-amber-950 p-2 mb-3" style={{ imageRendering: 'pixelated' }}>
                          <h3 className="text-white font-mono text-sm font-bold uppercase">Task Details</h3>
                        </div>
                        {(() => {
                          const taskAttr = Object.keys(selectedGeneratedTask.attrXP || {})[0];
                          const attrIcons = {
                            'V': <Zap size={16} className="text-yellow-600" style={{ imageRendering: 'pixelated' }} />,
                            'R': <Sparkles size={16} className="text-pink-600" style={{ imageRendering: 'pixelated' }} />,
                            'C': <User size={16} className="text-blue-600" style={{ imageRendering: 'pixelated' }} />,
                            'M': <Zap size={16} className="text-green-600" style={{ imageRendering: 'pixelated' }} />
                          };
                          const { xp, coins } = getTaskRewards(selectedGeneratedTask);
                          return (
                            <div className="flex items-center gap-2 mb-2">
                              {taskAttr && attrIcons[taskAttr]}
                              <span className="font-mono text-xs text-amber-900">
                                Difficulty: {selectedGeneratedTask.difficulty || 'standard'} | 
                                Reward: +{xp} XP, +{coins} coins
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Task Title */}
                      <div className="mb-3">
                        <h4 className="font-mono text-sm font-bold text-amber-900 uppercase mb-2">
                          {selectedGeneratedTask.title || selectedGeneratedTask.text?.substring(0, 50)}
                        </h4>
                      </div>
                      
                      {/* Task Description */}
                      <div className="bg-yellow-200 border-2 border-amber-900 p-4 mb-4" style={{ imageRendering: 'pixelated' }}>
                        <p className="font-mono text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">
                          {selectedGeneratedTask.description || selectedGeneratedTask.text}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      {!completedTaskIds.includes(selectedGeneratedTask.id) && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              handleTaskComplete(selectedGeneratedTask, true);
                              setSelectedGeneratedTask(null);
                            }}
                            className="flex-1 py-3 border-4 border-amber-900 bg-green-500 text-white font-mono text-xs font-bold uppercase hover:bg-green-600"
                            style={{ imageRendering: 'pixelated', transition: 'none', boxShadow: '4px 4px 0px 0px #1a5a1a' }}
                          >
                            Complete Task
                          </button>
                          <button
                            onClick={() => setSelectedGeneratedTask(null)}
                            className="px-6 py-3 border-4 border-amber-900 bg-gray-300 text-amber-900 font-mono text-xs font-bold uppercase hover:bg-gray-400"
                            style={{ imageRendering: 'pixelated', transition: 'none' }}
                          >
                            Close
                          </button>
                        </div>
                      )}
                      {completedTaskIds.includes(selectedGeneratedTask.id) && (
                        <button
                          onClick={() => setSelectedGeneratedTask(null)}
                          className="w-full py-3 border-4 border-amber-900 bg-gray-300 text-amber-900 font-mono text-xs font-bold uppercase hover:bg-gray-400"
                          style={{ imageRendering: 'pixelated', transition: 'none' }}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Game Screen - Battle Area */}
                <div className="p-4 bg-green-200 border-4 border-green-900 relative overflow-hidden" style={{ imageRendering: 'pixelated', minHeight: '300px' }}>
                  <div className="relative w-full h-full" style={{ minHeight: '250px' }}>
                    {/* User Character */}
                    {(() => {
                      const displayedTasksCount = Math.min(5, boardTasks.length);
                      const enemyPos = attackingEnemy !== null 
                        ? getEnemyPosition(attackingEnemy, displayedTasksCount)
                        : null;
                      
                      return (
                        <motion.div
                          className="absolute w-12 h-12 bg-blue-500 border-4 border-blue-900 flex items-center justify-center z-0"
                          style={{ 
                            imageRendering: 'pixelated',
                            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                          }}
                          animate={
                            attackingEnemy !== null && enemyPos
                              ? {
                                  left: [`${userPosition.x}%`, `${enemyPos.x}%`, `${enemyPos.x}%`, `${userPosition.x}%`],
                                  top: [`${userPosition.y}%`, `${enemyPos.y}%`, `${enemyPos.y}%`, `${userPosition.y}%`],
                                  scale: [1, 1.2, 1.2, 1],
                                  x: ['-50%', '-50%', '-50%', '-50%'],
                                  y: ['-50%', '-50%', '-50%', '-50%']
                                }
                              : {
                                  left: `${userPosition.x}%`,
                                  top: `${userPosition.y}%`,
                                  x: '-50%',
                                  y: '-50%',
                                  scale: 1
                                }
                          }
                          transition={{
                            duration: 1.5,
                            times: [0, 0.4, 0.6, 1],
                            ease: "easeInOut"
                          }}
                        >
                          <span className="text-white font-mono font-bold text-xs">YOU</span>
                        </motion.div>
                      );
                    })()}

                    {/* Enemies */}
                    {boardTasks.slice(0, 5).map((task, index) => {
                      const displayedTasksCount = Math.min(5, boardTasks.length);
                      const enemyPos = getEnemyPosition(index, displayedTasksCount);
                      const isDefeated = defeatedEnemies.includes(index);
                      const isBeingAttacked = attackingEnemy === index;
                      
                      // Don't render defeated enemies
                      if (isDefeated && !isBeingAttacked) {
                        return null;
                      }
                      
                      return (
                        <motion.div
                          key={task.id}
                          className="absolute w-10 h-10 bg-red-500 border-4 border-red-900 flex items-center justify-center z-0"
                          style={{
                            left: `${enemyPos.x}%`,
                            top: `${enemyPos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            imageRendering: 'pixelated',
                            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                          }}
                          animate={
                            isBeingAttacked
                              ? {
                                  scale: [1, 1.3, 0],
                                  opacity: [1, 1, 0]
                                }
                              : {}
                          }
                          transition={{
                            duration: 1.5,
                            times: [0, 0.5, 1],
                            ease: "easeInOut"
                          }}
                        >
                          <span className="text-white font-mono font-bold text-[8px]">EN</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Quests Section */}
                <div className="p-4 bg-amber-50 border-4 border-amber-900" style={{ imageRendering: 'pixelated' }}>
                  <div className="bg-blue-600 border-2 border-blue-900 p-2 mb-3" style={{ imageRendering: 'pixelated' }}>
                    <h3 className="text-sm font-mono font-bold text-white uppercase">Daily Quests</h3>
                  </div>
                  <div className="space-y-2">
                    {boardTasks.slice(0, 5).map((task) => {
                      const { xp, coins } = getTaskRewards(task);
                      const isCompleted = completedTaskIds.includes(task.id);
                      const attrIcons = {
                        'V': <Zap size={14} className="text-yellow-600" style={{ imageRendering: 'pixelated' }} />,
                        'R': <Sparkles size={14} className="text-pink-600" style={{ imageRendering: 'pixelated' }} />,
                        'C': <User size={14} className="text-blue-600" style={{ imageRendering: 'pixelated' }} />,
                        'M': <Zap size={14} className="text-green-600" style={{ imageRendering: 'pixelated' }} />
                      };
                      const taskAttr = Object.keys(task.attrXP || {})[0];
                      return (
                        <div
                          key={task.id}
                          className={`bg-slate-100 border-2 p-2 flex items-center justify-between ${
                            isCompleted 
                              ? 'border-gray-500 opacity-50' 
                              : 'border-amber-900 hover:bg-amber-100'
                          }`}
                          style={{ imageRendering: 'pixelated', transition: 'none' }}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {taskAttr && attrIcons[taskAttr]}
                            <span className={`text-xs font-mono flex-1 ${isCompleted ? 'text-gray-600 line-through' : 'text-amber-900'}`}>
                              {task.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold ${isCompleted ? 'text-gray-600' : 'text-amber-900'}`}>
                              {isCompleted ? '✓' : `+${xp}`}
                            </span>
                            {!isCompleted && (
                              <button
                                onClick={() => handleTaskComplete(task)}
                                className="w-6 h-6 border-2 border-amber-900 bg-orange-300 flex items-center justify-center hover:bg-orange-400"
                                title={`Complete: +${xp} XP, +${coins} coins`}
                                style={{ imageRendering: 'pixelated', transition: 'none' }}
                              >
                                <Check size={12} className="text-amber-900" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {boardTasks.length === 0 && (
                      <p className="text-xs font-mono text-amber-900 text-center py-2">All quests completed! Great work!</p>
                    )}
                  </div>
                </div>
              </div>
                </>
              )}
            </div>

            {/* Bottom nav bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-amber-50 border-t-4 border-amber-900 flex items-center justify-around px-4 z-50" style={{ imageRendering: 'pixelated' }}>
              <button
                onClick={() => { setProfileView(true); setMapView(false); setSelectedLocation(null); }}
                className={`p-2 border-2 border-amber-900 ${profileView ? 'bg-orange-400 text-amber-900' : 'bg-amber-100 text-amber-900 hover:bg-orange-200'}`}
                title="Profile"
                style={{ imageRendering: 'pixelated', transition: 'none' }}
              >
                <User size={20} style={{ imageRendering: 'pixelated' }} />
              </button>
              <button
                onClick={() => { setMapView(true); setProfileView(false); setSelectedLocation(null); }}
                className={`p-2 border-2 border-amber-900 ${mapView ? 'bg-orange-400 text-amber-900' : 'bg-amber-100 text-amber-900 hover:bg-orange-200'}`}
                title="Maps"
                style={{ imageRendering: 'pixelated', transition: 'none' }}
              >
                <MapPin size={20} style={{ imageRendering: 'pixelated' }} />
              </button>
              <button
                onClick={() => { setMapView(false); setProfileView(false); setSelectedLocation(null); }}
                className={`p-3 border-2 border-amber-900 ${!mapView && !profileView ? 'bg-orange-500 text-amber-900' : 'bg-amber-100 text-amber-900 hover:bg-orange-200'}`}
                title="Home"
                style={{ imageRendering: 'pixelated', transition: 'none' }}
              >
                <Home size={20} style={{ imageRendering: 'pixelated' }} />
              </button>
              <button className="p-2 border-2 border-amber-900 bg-amber-100 text-amber-700 opacity-50 cursor-not-allowed" disabled title="Coming soon" style={{ imageRendering: 'pixelated' }}>
                <Lock size={18} style={{ imageRendering: 'pixelated' }} />
              </button>
              <button className="p-2 border-2 border-amber-900 bg-amber-100 text-amber-700 opacity-50 cursor-not-allowed" disabled title="Coming soon" style={{ imageRendering: 'pixelated' }}>
                <Lock size={18} style={{ imageRendering: 'pixelated' }} />
              </button>
            </nav>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}