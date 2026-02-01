import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Home, MapPin, Lock, Camera, Send, RotateCcw, RefreshCw, Coins, Zap, Check, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuestsByPillar, getQuestRewards } from './willQuests';
import { getTasksForBoard } from './easyTasks';

// --- Research Data ---
const QUESTIONS = [
  // V - Vitality (Physical Energy & Health)
  { id: 1, attr: 'V', text: "I consistently wake up feeling genuinely well-rested and energized." },
  { id: 2, attr: 'V', text: "I incorporate physical movement that leaves me feeling stronger." },
  { id: 3, attr: 'V', text: "My eating habits support sustained energy without crashes." },
  { id: 4, attr: 'V', text: "After my main meal, I feel energized, not heavy or sluggish." },
  { id: 14, attr: 'V', text: "I maintain consistent hydration throughout my day." },

  // R - Resilience (Emotional Regulation & Focus)
  { id: 5, attr: 'R', text: "I prioritize careful planning over jumping straight into action." },
  { id: 6, attr: 'R', text: "I recover emotional balance within an hour of a setback." },
  { id: 7, attr: 'R', text: "I proactively plan my schedule rather than reacting to demands." },
  { id: 8, attr: 'R', text: "I can enter deep concentration without seeking distraction." },
  { id: 15, attr: 'R', text: "I can remain calm and clear-headed under tight deadlines." },

  // C - Connection (Social & Boundaries)
  { id: 9, attr: 'C', text: "I have at least two people I can unconditionally rely on." },
  { id: 10, attr: 'C', text: "I am satisfied with the quality of my social interactions." },
  { id: 11, attr: 'C', text: "I find it easy to say 'no' to demands when I need space." },
  { id: 16, attr: 'C', text: "I regularly contribute to the well-being of others in my circle." },
  { id: 17, attr: 'C', text: "I feel understood and respected by the people I spend time with." },

  // M - Mastery (Competence & Finance)
  { id: 12, attr: 'M', text: "I am actively practicing skills to improve my career or goals." },
  { id: 13, attr: 'M', text: "I have a strong grasp and control over my financial situation." },
  { id: 18, attr: 'M', text: "I complete my most important tasks before moving to low-value work." },
  { id: 19, attr: 'M', text: "I have a clear 3-month goal that I am currently working toward." },
  { id: 20, attr: 'M', text: "I feel competent and capable in my primary field of work." }
];

const ARCHETYPES = {
  'HHHH': { name: 'The True Sovereign', desc: 'Perfect Balance. Tier 2 Master.' },
  'LLLL': { name: 'The Broken Vassal', desc: 'Critical deficit in all Pillars. Seek restoration.' },
  'LHLH': { name: 'The Ascetic Crafter', desc: 'High drive, but sacrificing recovery and social fuel.' },
  'HLLH': { name: 'The Unruly Freeblade', desc: 'High energy and skills, but lacking structure.' },
  'LHHL': { name: 'The Cloistered Oracle', desc: 'Disciplined and connected, but lacking physical fuel.' }
};

export default function App() {
  // Load saved state if it exists
  const [step, setStep] = useState(() => localStorage.getItem('sh_step') || 'onboarding');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(() => JSON.parse(localStorage.getItem('sh_results')) || null);
  const [mapView, setMapView] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questFlowStep, setQuestFlowStep] = useState(null); // 'confirm' | 'availability' | 'in-progress' | 'complete'
  const [questStepIndex, setQuestStepIndex] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState(() => JSON.parse(localStorage.getItem('sh_completed_tasks')) || []);
  const [taskBoardKey, setTaskBoardKey] = useState(0); // force re-fetch when completing a task

  // Board tasks (4 random, excluding completed)
  const boardTasks = useMemo(
    () => getTasksForBoard(completedTaskIds, 4),
    [completedTaskIds, taskBoardKey]
  );

  // Persistence Hook
  useEffect(() => {
    localStorage.setItem('sh_step', step);
    if (results) localStorage.setItem('sh_results', JSON.stringify(results));
    localStorage.setItem('sh_completed_tasks', JSON.stringify(completedTaskIds));
  }, [step, results, completedTaskIds]);

  const handleAnswer = (val) => {
    const newAnswers = { ...answers, [QUESTIONS[currentQ].id]: val };
    setAnswers(newAnswers);
    if (currentQ < QUESTIONS.length - 1) setCurrentQ(currentQ + 1);
    else calculateResults(newAnswers);
  };

  const calculateResults = (finalAnswers) => {
    const scores = { V: 0, R: 0, C: 0, M: 0 };
    let totalRaw = 0;
    QUESTIONS.forEach(q => {
      scores[q.attr] += finalAnswers[q.id];
      totalRaw += finalAnswers[q.id];
    });

    const code = ['V', 'R', 'C', 'M'].map(attr => {
      const qCount = QUESTIONS.filter(q => q.attr === attr).length;
      return (scores[attr] / qCount) >= 3 ? 'H' : 'L';
    }).join('');

    const initialLevel = Math.floor((totalRaw / 65) * 25);
    
    setResults({
      scores,
      archetype: ARCHETYPES[code] || { name: 'The Wayward Alchemist', desc: 'Your path is unique and unwritten.' },
      level: initialLevel,
      xp: initialLevel * 1000, // Total XP based on curve TXR = 1000 * L^2
      coins: results?.coins ?? 0,
      primaryNeed: Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b)
    });
    setStep('results');
  };

  const resetProfile = () => {
    setStep('onboarding');
    setCurrentQ(0);
    setAnswers({});
    setResults(null);
    setSelectedQuest(null);
    setQuestFlowStep(null);
    setCompletedTaskIds([]);
    localStorage.removeItem('sh_step');
    localStorage.removeItem('sh_results');
    localStorage.removeItem('sh_completed_tasks');
  };

  const handleTaskComplete = (task) => {
    if (!results) return;
    const attrBonus = task.attr || {};
    setResults((prev) => ({
      ...prev,
      xp: (prev.xp ?? 0) + (task.xp ?? 0),
      coins: (prev.coins ?? 0) + (task.coins ?? 0),
      scores: {
        V: (prev.scores?.V ?? 0) + (attrBonus.V ?? 0),
        R: (prev.scores?.R ?? 0) + (attrBonus.R ?? 0),
        C: (prev.scores?.C ?? 0) + (attrBonus.C ?? 0),
        M: (prev.scores?.M ?? 0) + (attrBonus.M ?? 0),
      },
    }));
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
    const quests = getQuestsByPillar(selectedQuest.pillar).filter((q) => q.unlocked && q.id !== selectedQuest.id);
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
      const { xp, coins } = getQuestRewards(selectedQuest);
      setResults((prev) => ({
        ...prev,
        xp: (prev.xp ?? 0) + xp,
        coins: (prev.coins ?? 0) + coins,
      }));
    }
  };

  const handleQuestComplete = () => {
    setSelectedQuest(null);
    setQuestFlowStep(null);
    setQuestStepIndex(0);
  };

  const exitQuestFlow = () => {
    setSelectedQuest(null);
    setQuestFlowStep(null);
    setQuestStepIndex(0);
  };

  return (
    <div className="min-h-screen bg-salar-dark text-slate-200 font-sans selection:bg-amber-500/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        
        {step === 'onboarding' && (
          <motion.div key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-8">
            <h1 className="font-serif text-6xl text-amber-500 tracking-[0.2em] uppercase">Sálarheim</h1>
            <p className="font-serif italic text-xl text-slate-500">"The Edict of the Fallen King"</p>
            <button onClick={() => setStep('trial')} className="px-12 py-4 border border-amber-600/50 text-amber-500 font-serif tracking-widest hover:bg-amber-600/10 transition-all">
              BEGIN THE TRIAL
            </button>
          </motion.div>
        )}

        {step === 'trial' && (
          <motion.div key="tr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-screen flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-12">
              <div className="flex justify-between font-serif text-xs text-amber-500/50 uppercase tracking-widest">
                <span>Entry {currentQ + 1}/13</span>
                <span>{QUESTIONS[currentQ].attr}</span>
              </div>
              <h2 className="font-serif text-3xl text-slate-200 leading-snug italic">"{QUESTIONS[currentQ].text}"</h2>
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

        {step === 'results' && results && (
          <motion.div key="res" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 space-y-12">
            <div className="text-center">
              <h3 className="font-serif text-5xl text-white tracking-wider mb-2">{results.archetype.name}</h3>
              <p className="text-slate-500 italic font-light">{results.archetype.desc}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
              {Object.entries(results.scores).map(([attr, score]) => (
                <div key={attr} className={`p-4 bg-white/5 border border-white/10 rounded-xl text-center ${results.primaryNeed === attr ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                  <div className="text-[10px] uppercase text-slate-500 mb-1">{attr}</div>
                  <div className="text-2xl font-serif">{score}</div>
                </div>
              ))}
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
                        {getQuestsByPillar(selectedLocation).map((quest, i) => {
                          const isLocked = quest.unlocked !== true;
                          const positions = [
                            { top: '8%', left: '12%' },
                            { top: '28%', left: '68%' },
                            { top: '58%', left: '15%' },
                            { top: '18%', left: '38%' },
                            { top: '62%', left: '58%' },
                            { top: '38%', left: '82%' },
                          ];
                          const pos = positions[i % positions.length];
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

                            {questFlowStep === 'complete' && (
                              <>
                                <div className="text-center">
                                  <h3 className="font-serif text-2xl text-amber-500 mb-2">Quest Complete</h3>
                                  <p className="text-slate-400 italic mb-4">{selectedQuest.signOfCompletion}</p>
                                  <div className="flex gap-6 justify-center">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-lg">
                                      <Zap size={20} className="text-amber-500" />
                                      <span className="text-amber-500 font-bold">+{getQuestRewards(selectedQuest).xp} XP</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-lg">
                                      <Coins size={20} className="text-amber-500" />
                                      <span className="text-amber-500 font-bold">+{getQuestRewards(selectedQuest).coins} Coins</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={handleQuestComplete}
                                  className="w-full py-3 bg-amber-500/20 border border-amber-500/50 text-amber-500 hover:bg-amber-500/30 rounded-lg font-medium"
                                >
                                  Return to Map
                                </button>
                              </>
                            )}
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
                      <div className="text-xs text-slate-400">V:{results.scores.V} R:{results.scores.R} C:{results.scores.C} M:{results.scores.M}</div>
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
                      {boardTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-amber-500/20 transition-colors"
                        >
                          <button
                            onClick={() => handleTaskComplete(task)}
                            className="w-8 h-8 shrink-0 rounded-full border-2 border-amber-500/40 flex items-center justify-center text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all"
                            title={`Complete: +${task.xp} XP, +${task.coins} coins`}
                          >
                            <Check size={16} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-200">{task.text}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              +{task.xp} XP · +{task.coins} coins {Object.keys(task.attr || {}).length ? `· +1 ${Object.keys(task.attr).join(',')}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
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