import React, { useState, useEffect } from 'react';
import { Shield, Zap, Heart, Compass, Trophy, ChevronRight, LayoutDashboard, Map as MapIcon, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Persistence Hook
  useEffect(() => {
    localStorage.setItem('sh_step', step);
    if (results) localStorage.setItem('sh_results', JSON.stringify(results));
  }, [step, results]);

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
      primaryNeed: Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b)
    });
    setStep('results');
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
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-12">
               <h2 className="font-serif text-2xl text-amber-500 tracking-tighter uppercase">Sovereign Realm</h2>
               <div className="text-right">
                  <div className="text-xs uppercase text-slate-500">Level {results.level}</div>
                  <div className="font-serif text-xl">{results.archetype.name}</div>
               </div>
            </header>
            
            {/* The Habit Engine Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 space-y-6">
                  <div className="p-8 bg-white/5 rounded-3xl border border-white/10 border-dashed flex flex-col items-center justify-center text-slate-500">
                    <p className="font-serif italic mb-4">No active Micro-Quests detected.</p>
                    <button className="px-6 py-2 border border-slate-700 hover:border-amber-500 hover:text-amber-500 transition-colors rounded-full text-xs font-bold uppercase tracking-widest">
                      Perform Architect's Scan
                    </button>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="p-6 bg-salar-card rounded-2xl border border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Trophy size={14}/> Primary Need</h4>
                    <div className="text-amber-400 font-serif text-lg">{results.primaryNeed === 'V' ? 'Vitality' : results.primaryNeed === 'R' ? 'Resilience' : results.primaryNeed === 'C' ? 'Connection' : 'Mastery'}</div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}