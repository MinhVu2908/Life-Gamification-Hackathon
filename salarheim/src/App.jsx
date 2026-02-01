import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Home, MapPin, Lock, Camera, Send, RotateCcw, RefreshCw, Coins, Zap, Check, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuestsByPillar, getQuestRewards } from './willQuests';
import { getTasksForBoard, getTaskRewards } from './easyTasks';
import { getAttrLevel, ATTR_MAX } from './engine';

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
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questFlowStep, setQuestFlowStep] = useState(null); // 'confirm' | 'availability' | 'in-progress' | 'complete'
  const [questStepIndex, setQuestStepIndex] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState(() => JSON.parse(localStorage.getItem('sh_completed_tasks')) || []);
  const [completedQuestIds, setCompletedQuestIds] = useState(() => JSON.parse(localStorage.getItem('sh_completed_quests')) || []);
  const [taskBoardKey, setTaskBoardKey] = useState(0);
  const [mapQuestKey, setMapQuestKey] = useState(0); // reshuffle positions when entering map

  // Board tasks (4 random, excluding completed)
  const boardTasks = useMemo(
    () => getTasksForBoard(completedTaskIds, 4),
    [completedTaskIds, taskBoardKey]
  );

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
  }, [step, results, completedTaskIds, completedQuestIds]);

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

    // attrXP: 0–100 per attribute. Initial from trial (4–20) → *5 = 20–100
    const attrXP = {
      V: Math.min(ATTR_MAX, (scores.V ?? 0) * 5),
      R: Math.min(ATTR_MAX, (scores.R ?? 0) * 5),
      C: Math.min(ATTR_MAX, (scores.C ?? 0) * 5),
      M: Math.min(ATTR_MAX, (scores.M ?? 0) * 5),
    };
    const archetype = getArchetypeFromAttrXP(attrXP);
    const initialLevel = Math.max(1, Math.floor(totalRaw / 5));
    
    setResults({
      scores,
      attrXP,
      archetype,
      level: initialLevel,
      xp: initialLevel * 1000,
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
    localStorage.removeItem('sh_step');
    localStorage.removeItem('sh_results');
    localStorage.removeItem('sh_completed_tasks');
    localStorage.removeItem('sh_completed_quests');
  };

  const handleTaskComplete = (task) => {
    if (!results) return;
    const { xp, coins } = getTaskRewards(task);
    const attrBonus = task.attrXP ?? {};
    setResults((prev) => {
      const base = (v, s) => (v ?? (s ?? 0) * 5);
      const newAttrXP = {
        V: Math.min(ATTR_MAX, base(prev.attrXP?.V, prev.scores?.V) + (attrBonus.V ?? 0)),
        R: Math.min(ATTR_MAX, base(prev.attrXP?.R, prev.scores?.R) + (attrBonus.R ?? 0)),
        C: Math.min(ATTR_MAX, base(prev.attrXP?.C, prev.scores?.C) + (attrBonus.C ?? 0)),
        M: Math.min(ATTR_MAX, base(prev.attrXP?.M, prev.scores?.M) + (attrBonus.M ?? 0)),
      };
      return {
        ...prev,
        xp: (prev.xp ?? 0) + xp,
        coins: (prev.coins ?? 0) + coins,
        attrXP: newAttrXP,
        archetype: getArchetypeFromAttrXP(newAttrXP),
        primaryNeed: Object.keys(newAttrXP).reduce((a, b) => newAttrXP[a] < newAttrXP[b] ? a : b),
      };
    });
    setCompletedTaskIds((prev) => [...prev, task.id]);
    setTaskBoardKey((k) => k + 1);
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
          V: Math.min(ATTR_MAX, base(prev.attrXP?.V, prev.scores?.V) + (attrBonus?.V ?? 0)),
          R: Math.min(ATTR_MAX, base(prev.attrXP?.R, prev.scores?.R) + (attrBonus?.R ?? 0)),
          C: Math.min(ATTR_MAX, base(prev.attrXP?.C, prev.scores?.C) + (attrBonus?.C ?? 0)),
          M: Math.min(ATTR_MAX, base(prev.attrXP?.M, prev.scores?.M) + (attrBonus?.M ?? 0)),
        };
        return {
          ...prev,
          xp: (prev.xp ?? 0) + xp,
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

  return (
    <div className="min-h-screen bg-salar-dark text-slate-200 font-sans selection:bg-amber-500/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        
        {/* 1. Welcome / Story */}
        {step === 'onboarding' && (
          <motion.div key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <p className="font-serif text-sm text-amber-500/80 uppercase tracking-[0.3em] mb-4">Welcome</p>
            <h1 className="font-serif text-6xl text-amber-500 tracking-[0.2em] uppercase mb-6">Sálarheim</h1>
            <p className="font-serif italic text-xl text-slate-500 mb-4">"The Edict of the Fallen King"</p>
            <div className="max-w-xl text-slate-400 text-left space-y-4 mb-12">
              <p className="font-serif italic">In the ruins of a fallen kingdom, four pillars once held the realm: Vitality, Resilience, Connection, and Mastery. Shadow Blight consumed them—but the Edict remains.</p>
              <p className="font-serif italic">Your trial begins now. Touch each pillar to reveal your current state. The ancients will speak; you will answer.</p>
            </div>
            <button onClick={() => setStep('trial-attributes')} className="px-12 py-4 border border-amber-600/50 text-amber-500 font-serif tracking-widest hover:bg-amber-600/10 transition-all">
              BEGIN THE TRIAL
            </button>
          </motion.div>
        )}

        {/* 2. Four attribute circles */}
        {step === 'trial-attributes' && (
          <motion.div key="attr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative">
            <button onClick={() => setStep('onboarding')} className="absolute top-6 left-6 text-slate-500 hover:text-amber-500 flex items-center gap-2 text-sm z-10">
              <ChevronLeft size={18} /> Back to story
            </button>
            <p className="font-serif text-sm text-slate-500 uppercase tracking-widest mb-8">Choose a pillar to assess</p>
            <div className="grid grid-cols-2 gap-8 max-w-md mb-12">
              {['V', 'R', 'C', 'M'].map((attr) => {
                const done = hasAttrAnswers(attr);
                return (
                  <button
                    key={attr}
                    onClick={() => {
                      setTrialAttr(attr);
                      setCurrentQ(0);
                      setStep('trial-questions');
                    }}
                    className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all font-serif
                      ${done ? 'border-amber-500/60 bg-amber-500/20 text-amber-500' : 'border-white/20 bg-white/5 text-slate-400 hover:border-amber-500/40 hover:bg-amber-500/10'}
                    `}
                    title={ATTR_NAMES[attr]}
                  >
                    <span className="text-2xl font-bold">{attr}</span>
                    <span className="text-[10px] uppercase mt-0.5">{ATTR_NAMES[attr]}</span>
                    {done && <Check size={14} className="mt-1 text-amber-500" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep('trial-confirm')}
              disabled={!allAttrsAnswered}
              className={`px-8 py-3 border font-serif tracking-widest transition-all ${allAttrsAnswered ? 'border-amber-500/50 text-amber-500 hover:bg-amber-500/10' : 'border-white/10 text-slate-600 cursor-not-allowed'}`}
            >
              Confirm & Continue
            </button>
          </motion.div>
        )}

        {/* 3. Four questions for selected attribute */}
        {step === 'trial-questions' && trialAttr && (
          <motion.div key="qs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 relative">
            <button onClick={() => { setStep('trial-attributes'); setTrialAttr(null); setCurrentQ(0); }} className="absolute top-6 left-6 text-slate-500 hover:text-amber-500 flex items-center gap-2 text-sm z-10">
              <ChevronLeft size={18} /> Back
            </button>
            <div className="w-full max-w-2xl space-y-12">
              <div className="flex justify-between font-serif text-xs text-amber-500/50 uppercase tracking-widest">
                <span>{ATTR_NAMES[trialAttr]} — Question {currentQ + 1}/4</span>
              </div>
              <h2 className="font-serif text-3xl text-slate-200 leading-snug italic">"{getQuestionsByAttr(trialAttr)[currentQ].text}"</h2>
              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button key={val} onClick={() => handleAnswer(val)}
                    className="h-16 border border-white/5 bg-white/5 hover:border-amber-500/50 transition-all rounded-lg font-serif text-xl">
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. Confirm step */}
        {step === 'trial-confirm' && (
          <motion.div key="cf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <h2 className="font-serif text-2xl text-slate-200 mb-4">Is this what you want?</h2>
            <p className="text-slate-500 mb-8 max-w-md">You have assessed all four pillars. Your archetype awaits.</p>
            <div className="flex gap-4">
              <button onClick={() => setStep('trial-attributes')} className="px-6 py-3 border border-slate-600 text-slate-400 hover:border-slate-500 rounded-lg">
                Go back
              </button>
              <button onClick={handleTrialConfirm} className="px-8 py-3 bg-amber-500/20 border border-amber-500/50 text-amber-500 hover:bg-amber-500/30 rounded-lg font-medium">
                Yes, reveal my archetype
              </button>
            </div>
          </motion.div>
        )}

        {step === 'results' && results && (
          <motion.div key="res" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 space-y-12">
            <div className="text-center">
              <h3 className="font-serif text-5xl text-white tracking-wider mb-2">{results.archetype.name}</h3>
              <p className="text-slate-500 italic font-light">{results.archetype.desc}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
              {['V','R','C','M'].map((attr) => {
                const xp = results.attrXP?.[attr] ?? (results.scores?.[attr] ?? 0) * 5;
                const level = getAttrLevel(xp);
                return (
                  <div key={attr} className={`p-4 bg-white/5 border border-white/10 rounded-xl text-center ${results.primaryNeed === attr ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                    <div className="text-[10px] uppercase text-slate-500 mb-1">{attr}</div>
                    <div className="text-2xl font-serif">Lv{level}</div>
                    <div className="text-xs text-slate-500">{xp}/100</div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setStep('dashboard')} className="flex items-center gap-2 text-amber-500 uppercase tracking-widest text-xs font-bold hover:gap-4 transition-all">
              Claim the Crown <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {step === 'dashboard' && results && (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex flex-col pb-20">
            <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full relative">
              <button
                onClick={resetProfile}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors z-10"
                title="Reset profile"
              >
                <RotateCcw size={18} />
              </button>

              {/* Maps view: 4 attribute locations + quest circles */}
              {mapView ? (
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
              {/* Two-column layout: Left (profile, prompt, scan) | Right (welcome, task board) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column: Profile, AI prompt, Scan camera */}
                <div className="space-y-4">
                  {/* Profile - top left */}
                  <div className="p-4 bg-salar-card rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <span className="text-amber-500 font-serif text-xl">S</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-serif text-amber-500 uppercase tracking-wider text-sm">{results.archetype.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Level {results.level}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Exp: {results.xp}</div>
                      <div className="text-xs text-slate-400">Coins: {results.coins ?? 0}</div>
                      <div className="text-xs text-slate-400">
                      {['V','R','C','M'].map((a) => {
                        const xp = results.attrXP?.[a] ?? (results.scores?.[a] ?? 0) * 5;
                        return `${a}:Lv${getAttrLevel(xp)}(${xp})`;
                      }).join(' ')}
                    </div>
                    </div>
                  </div>

                  {/* AI prompt */}
                  <div className="p-3 bg-salar-card rounded-xl border border-white/5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write prompt..."
                        className="flex-1 bg-transparent border-none outline-none text-slate-300 placeholder:text-slate-600 text-sm"
                        readOnly
                      />
                      <button className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors shrink-0" disabled>
                        <Send size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Scan camera */}
                  <div className="aspect-[4/3] max-w-full bg-salar-card rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500">
                    <Camera size={40} className="mb-2 opacity-50" />
                    <span className="text-sm">Capture Picture</span>
                  </div>
                </div>

                {/* Right column: Welcome prompt, Task board */}
                <div className="space-y-4">
                  {/* Welcome prompt - top right */}
                  <div className="p-4 bg-salar-card rounded-2xl border border-white/5">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Welcome</div>
                    <p className="font-serif italic text-slate-300 text-sm">"{results.archetype.desc}"</p>
                  </div>

                  {/* Task board - below welcome */}
                  <div className="p-4 bg-salar-card rounded-2xl border border-white/5">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Dashboard — Quick Tasks</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {boardTasks.map((task) => {
                        const { xp, coins } = getTaskRewards(task);
                        return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-amber-500/20 transition-colors"
                        >
                          <button
                            onClick={() => handleTaskComplete(task)}
                            className="w-8 h-8 shrink-0 rounded-full border-2 border-amber-500/40 flex items-center justify-center text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all"
                            title={`Complete: +${xp} XP, +${coins} coins`}
                          >
                            <Check size={16} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-200">{task.text}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              +{xp} XP · +{coins} coins {Object.keys(task.attrXP || {}).length ? `· +${Object.entries(task.attrXP).map(([a,v]) => `${v}${a}`).join(' ')}` : ''}
                            </p>
                          </div>
                        </div>
                      );})}
                    </div>
                    {boardTasks.length === 0 && (
                      <p className="text-sm text-slate-500 italic">All tasks done for now. Great work!</p>
                    )}
                  </div>
                </div>
              </div>
                </>
              )}
            </div>

            {/* Bottom nav bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-salar-card border-t border-white/5 flex items-center justify-around px-4">
              <button className="p-2 rounded-lg text-slate-500 opacity-50 cursor-not-allowed" disabled title="Coming soon">
                <Lock size={22} />
              </button>
              <button
                onClick={() => { setMapView(true); setSelectedLocation(null); }}
                className={`p-2 rounded-lg transition-colors ${mapView ? 'text-amber-500 bg-amber-500/10' : 'text-amber-500/80 hover:text-amber-500 hover:bg-amber-500/10'}`}
                title="Maps"
              >
                <MapPin size={24} />
              </button>
              <button
                onClick={() => { setMapView(false); setSelectedLocation(null); }}
                className={`p-3 rounded-full transition-colors ${!mapView ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'text-slate-400 hover:text-amber-500 hover:bg-white/5 border border-white/5'}`}
                title="Home"
              >
                <Home size={24} />
              </button>
              <button className="p-2 rounded-lg text-slate-500 opacity-50 cursor-not-allowed" disabled title="Coming soon">
                <Lock size={22} />
              </button>
              <button className="p-2 rounded-lg text-slate-500 opacity-50 cursor-not-allowed" disabled title="Coming soon">
                <Lock size={22} />
              </button>
            </nav>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}