// src/willQuests.js
// The Architect's Echo — Will Quests for Sálarheim
// 3 quests per sub-location × 2 sub-locations × 4 pillars = 24 quests

export const WILL_QUESTS = [
  // ═══════════════════════════════════════════════════════════════
  // VITALITY — The Granite Altar
  // ═══════════════════════════════════════════════════════════════

  // Sub-Location 1: The Iron Pit (strength, lifting)
  {
    id: 'V-IRON-1',
    pillar: 'V',
    majorLocation: 'The Granite Altar',
    subLocation: 'The Iron Pit',
    title: 'The First Lift',
    narrativeIntro: 'You enter the Iron Pit where the ancient stones remember every warrior who ever strained against them. The air is thick with the scent of effort and possibility.',
    steps: [
      'Stand before your chosen weight—body tall, feet rooted.',
      'Your hands grasp the iron. Inhale. Brace your core as the old masters taught.',
      'Drive through your legs and hips. Lift. Hold at the apex for one breath.',
      'Lower with control. The stone bears witness.',
    ],
    signOfCompletion: 'Once the weight is stilled, the Altar glows—award yourself 50 XP.',
    unlocked: true,
  },
  {
    id: 'V-IRON-2',
    pillar: 'V',
    majorLocation: 'The Granite Altar',
    subLocation: 'The Iron Pit',
    title: 'The Circuit of Iron',
    narrativeIntro: 'The Pit demands repetition. Each round forges the vessel. You are not lifting stone—you are becoming stone.',
    steps: [
      'Choose three movements: one push, one pull, one leg. Set a timer for twelve minutes.',
      'Perform each movement in turn. No rest between movements; thirty breaths between rounds.',
      'Count your rounds. Let each rep be a bead on the string of your resolve.',
      'When the timer ends, kneel. Let the sweat fall. You have paid the toll.',
    ],
    signOfCompletion: 'The forge-fires flicker in recognition—award yourself 75 XP.',
    unlocked: false,
  },
  {
    id: 'V-IRON-3',
    pillar: 'V',
    majorLocation: 'The Granite Altar',
    subLocation: 'The Iron Pit',
    title: 'The Weight of the Crown',
    narrativeIntro: 'Today you test the limit. The Pit does not judge—it only answers. What can you bear?',
    steps: [
      'Warm the body for five minutes. The crown is heavy; the neck must be ready.',
      'Load a weight you have never held before. One rep is enough to claim it.',
      'Approach. Breathe. Lift. If you fail, you have learned the edge. If you succeed, you have moved the boundary.',
      'Record the outcome. The stone remembers.',
    ],
    signOfCompletion: 'The Granite Altar hums—award yourself 100 XP.',
    unlocked: false,
  },

  // Sub-Location 2: The Recovery Font (rest, stretching, nourishment)
  {
    id: 'V-FONT-1',
    pillar: 'V',
    majorLocation: 'The Granite Altar',
    subLocation: 'The Recovery Font',
    title: 'The Stilling of the Flesh',
    narrativeIntro: 'Beyond the Pit lies the Font—a chamber of steam and stillness. Here the body is not forged but restored. You enter as stone; you leave as water.',
    steps: [
      'Find a quiet space. Lie or sit. Close your eyes.',
      'Scan the body from crown to sole. Where does tension dwell? Name it.',
      'Breathe into each held place. Ten breaths per region. Let the Font\'s warmth soften the edges.',
      'Rise slowly. The stillness lingers.',
    ],
    signOfCompletion: 'The waters of the Font ripple in approval—award yourself 50 XP.',
    unlocked: true,
  },
  {
    id: 'V-FONT-2',
    pillar: 'V',
    majorLocation: 'The Granite Altar',
    subLocation: 'The Recovery Font',
    title: 'The Lengthening Rite',
    narrativeIntro: 'The Font holds the stretching stones—ancient postures that lengthen what the Pit has shortened. You are not weak for seeking this. You are wise.',
    steps: [
      'Begin with the hips. One minute per side in a low lunge or pigeon. Breathe.',
      'Move to the spine. Cat-cow for twenty breaths. Let the vertebrae speak.',
      'Open the shoulders. Thread the needle, each side. Hold for thirty seconds.',
      'Finish with hamstrings. Fold forward. Let the crown hang. Surrender.',
    ],
    signOfCompletion: 'The Font steams with your release—award yourself 75 XP.',
    unlocked: false,
  },
  {
    id: 'V-FONT-3',
    pillar: 'V',
    majorLocation: 'The Granite Altar',
    subLocation: 'The Recovery Font',
    title: 'The Feast of Renewal',
    narrativeIntro: 'The Font does not live on breath alone. The body is altar; the meal is offering. You prepare the vessel for what comes next.',
    steps: [
      'Choose one meal today. Make it worthy of the Font—whole, unprocessed, intentional.',
      'Eat without screens. Twenty chews per bite. Taste the offering.',
      'Notice the body after. Energy rises or settles? Record it.',
      'Drink water as if from the Font itself. Eight glasses before dusk.',
    ],
    signOfCompletion: 'The Altar glows from within—award yourself 75 XP.',
    unlocked: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // RESILIENCE — The Stone Sanctum
  // ═══════════════════════════════════════════════════════════════

  // Sub-Location 1: The Meditation Cairn
  {
    id: 'R-CAIRN-1',
    pillar: 'R',
    majorLocation: 'The Stone Sanctum',
    subLocation: 'The Meditation Cairn',
    title: 'The Five-Breath Anchor',
    narrativeIntro: 'You enter the Cairn where the stones are stacked in silence. No wind reaches here. Only the breath, and the choice to return to it.',
    steps: [
      'Sit or stand. Root your body. The Cairn holds you.',
      'Inhale for four counts. Hold for four. Exhale for six. Repeat five times.',
      'When the mind wanders—and it will—name it: "thinking." Return to the breath.',
      'Open your eyes. The Sanctum is still.',
    ],
    signOfCompletion: 'The Cairn stones settle—award yourself 50 XP.',
    unlocked: true,
  },
  {
    id: 'R-CAIRN-2',
    pillar: 'R',
    majorLocation: 'The Stone Sanctum',
    subLocation: 'The Meditation Cairn',
    title: 'The Witness Stance',
    narrativeIntro: 'The Cairn teaches observation. You are not your thoughts. You are the one who watches. The ancient builders knew this: the stone does not become the storm.',
    steps: [
      'Set a timer for ten minutes. Sit in stillness.',
      'As thoughts arise, label them: "planning," "worrying," "remembering." Do not follow. Let them pass.',
      'When emotion stirs, feel it in the body. Where does it live? Breathe into it.',
      'When the bell sounds, bow. You have witnessed.',
    ],
    signOfCompletion: 'The Cairn hums with your presence—award yourself 75 XP.',
    unlocked: false,
  },
  {
    id: 'R-CAIRN-3',
    pillar: 'R',
    majorLocation: 'The Stone Sanctum',
    subLocation: 'The Meditation Cairn',
    title: 'The Storm-Sitting',
    narrativeIntro: 'Today you practice in difficulty. The Cairn does not promise calm—it promises steadiness. When chaos comes, you will already know how to sit.',
    steps: [
      'Choose a moment of stress—a hard conversation, a deadline, a trigger. Do not avoid it.',
      'Before you react, take three breaths. Feel the body. Name the sensation.',
      'Respond from the breath, not the storm. One sentence. One action.',
      'Afterward, sit for five minutes. Let the storm pass through. You remained.',
    ],
    signOfCompletion: 'The Sanctum stands unshaken—award yourself 100 XP.',
    unlocked: false,
  },

  // Sub-Location 2: The Planning Labyrinth
  {
    id: 'R-LAB-1',
    pillar: 'R',
    majorLocation: 'The Stone Sanctum',
    subLocation: 'The Planning Labyrinth',
    title: 'The Morning Mandate',
    narrativeIntro: 'The Labyrinth has one entrance and one center. So does the day. You walk it with intention, or you wander.',
    steps: [
      'Before screens, before news: sit with pen and paper.',
      'Write the three stones that must not move today. One sentence each.',
      'For each stone, name the single next action. Small. Concrete.',
      'Fold the paper. Carry it. The Labyrinth is drawn.',
    ],
    signOfCompletion: 'The path is lit—award yourself 50 XP.',
    unlocked: true,
  },
  {
    id: 'R-LAB-2',
    pillar: 'R',
    majorLocation: 'The Stone Sanctum',
    subLocation: 'The Planning Labyrinth',
    title: 'The Weekly Cairn',
    narrativeIntro: 'The Labyrinth extends beyond a day. Each week, the builders add a stone. You are the builder now.',
    steps: [
      'Set aside thirty minutes. No interruptions. The Labyrinth demands focus.',
      'Review the past week. What was completed? What was abandoned? Write it down.',
      'Choose five priorities for the coming week. One per pillar if you can.',
      'Schedule one action for each priority. Not "someday"—a day, a time.',
    ],
    signOfCompletion: 'The cairn rises—award yourself 75 XP.',
    unlocked: false,
  },
  {
    id: 'R-LAB-3',
    pillar: 'R',
    majorLocation: 'The Stone Sanctum',
    subLocation: 'The Planning Labyrinth',
    title: 'The Boundary Stone',
    narrativeIntro: 'The Labyrinth has walls. Without them, there is no path—only noise. Today you set a stone that says: beyond here, I do not go.',
    steps: [
      'Name one boundary you have violated: working past a cutoff, saying yes when you meant no.',
      'Write the new rule. "I will not __ after __." Be specific.',
      'Tell one person. Accountability makes the stone real.',
      'When the boundary is tested today, hold. The Sanctum depends on it.',
    ],
    signOfCompletion: 'The wall holds—award yourself 100 XP.',
    unlocked: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // CONNECTION — The Hearth Hall
  // ═══════════════════════════════════════════════════════════════

  // Sub-Location 1: The Bonding Fire
  {
    id: 'C-FIRE-1',
    pillar: 'C',
    majorLocation: 'The Hearth Hall',
    subLocation: 'The Bonding Fire',
    title: 'The Ember Reach',
    narrativeIntro: 'The Bonding Fire flickers in the center of the Hall. It does not burn alone. Someone is waiting for your spark.',
    steps: [
      'Choose one person you have meant to reach—a friend, a family member, a neglected thread.',
      'Send a message that requires nothing in return. "I was thinking of you." "This reminded me of us."',
      'Do not expect a reply today. The offering is the act.',
      'If they respond, give them your full attention. Put the screen down. Listen.',
    ],
    signOfCompletion: 'The Fire brightens—award yourself 50 XP.',
    unlocked: true,
  },
  {
    id: 'C-FIRE-2',
    pillar: 'C',
    majorLocation: 'The Hearth Hall',
    subLocation: 'The Bonding Fire',
    title: 'The Shared Meal',
    narrativeIntro: 'The Hearth Hall was built for breaking bread. In the presence of food and face, bonds are reforged. You have forgotten this. Today you remember.',
    steps: [
      'Invite one person to share a meal—in person, if possible. Coffee counts.',
      'Choose a place without screens. The Hall has no televisions.',
      'Ask one question that invites story: "What has been alive in you lately?"',
      'Listen more than you speak. The fire warms both ways.',
    ],
    signOfCompletion: 'The Hearth crackles with warmth—award yourself 75 XP.',
    unlocked: false,
  },
  {
    id: 'C-FIRE-3',
    pillar: 'C',
    majorLocation: 'The Hearth Hall',
    subLocation: 'The Bonding Fire',
    title: 'The Gratitude Offering',
    narrativeIntro: 'The Bonding Fire is fed by thanks. Those who tended you—named or nameless—deserve a word. You speak it into the flames.',
    steps: [
      'Write the name of someone who has sustained you. Teacher, parent, friend, stranger.',
      'Compose a message of thanks. Specific. "Because you __, I was able to __."',
      'Send it. Call. Or, if they are gone, speak it aloud to the sky.',
      'Feel the warmth. You have fed the fire.',
    ],
    signOfCompletion: 'The Hall glows with your offering—award yourself 75 XP.',
    unlocked: false,
  },

  // Sub-Location 2: The Boundary Gate
  {
    id: 'C-GATE-1',
    pillar: 'C',
    majorLocation: 'The Hearth Hall',
    subLocation: 'The Boundary Gate',
    title: 'The Sacred No',
    narrativeIntro: 'The Boundary Gate stands at the edge of the Hall. Not everyone may enter. Not every request deserves a yes. The Gate protects the flame.',
    steps: [
      'Identify one request you will decline today—an invitation, a favor, a demand on your time.',
      'Before you respond, breathe. You are not cruel for guarding your energy.',
      'Say no. Clearly. "I cannot do that." "That doesn\'t work for me." No over-explaining.',
      'Notice the relief. The Gate holds.',
    ],
    signOfCompletion: 'The Gate swings shut with dignity—award yourself 50 XP.',
    unlocked: true,
  },
  {
    id: 'C-GATE-2',
    pillar: 'C',
    majorLocation: 'The Hearth Hall',
    subLocation: 'The Boundary Gate',
    title: 'The Unplugging Ritual',
    narrativeIntro: 'The Boundary Gate also guards against the endless scroll—the voices that are not your circle, the noise that drowns the Hearth.',
    steps: [
      'Choose a block of time today—two hours minimum. The Gate closes to screens.',
      'Silence notifications. Put the phone in another room. This is not punishment; it is protection.',
      'Use the time for one connection: a walk, a book, a conversation, or silence.',
      'When you return to the device, notice what you did not miss.',
    ],
    signOfCompletion: 'The Hall grows quiet and clear—award yourself 75 XP.',
    unlocked: false,
  },
  {
    id: 'C-GATE-3',
    pillar: 'C',
    majorLocation: 'The Hearth Hall',
    subLocation: 'The Boundary Gate',
    title: 'The Difficult Truth',
    narrativeIntro: 'Sometimes the Boundary Gate must speak. A relationship has crossed a line. A pattern must be named. The Hall cannot hold what does not honor it.',
    steps: [
      'Name one truth you have avoided saying. To a colleague, a friend, a family member.',
      'Choose your moment. Private. Calm. Not in anger.',
      'Use "I" language. "I feel __ when __." "I need __." Speak your piece.',
      'Let the other respond. You have held the Gate. The rest is not yours to control.',
    ],
    signOfCompletion: 'The Gate stands tall—award yourself 100 XP.',
    unlocked: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // MASTERY — The Forge of Acumen
  // ═══════════════════════════════════════════════════════════════

  // Sub-Location 1: The Apprentice's Bench
  {
    id: 'M-BENCH-1',
    pillar: 'M',
    majorLocation: 'The Forge of Acumen',
    subLocation: "The Apprentice's Bench",
    title: 'The Deliberate Hour',
    narrativeIntro: 'You approach the Apprentice\'s Bench where the masters began. Here, skill is not born—it is forged, one careful strike at a time.',
    steps: [
      'Choose one skill you are building. Write it down. "I am learning __."',
      'Set a timer for one hour. No distractions. The Bench demands focus.',
      'Practice at the edge of your ability—where you make mistakes. That is where growth lives.',
      'When the hour ends, note one thing you improved. The forge remembers.',
    ],
    signOfCompletion: 'The Bench gleams with your effort—award yourself 75 XP.',
    unlocked: true,
  },
  {
    id: 'M-BENCH-2',
    pillar: 'M',
    majorLocation: 'The Forge of Acumen',
    subLocation: "The Apprentice's Bench",
    title: 'The Feedback Seeking',
    narrativeIntro: 'The Apprentice does not work in secret. The masters watched; the masters corrected. Humility at the Bench is not weakness—it is fuel.',
    steps: [
      'Identify one piece of work—a project, a draft, a performance—that could be better.',
      'Find one person whose judgment you trust. Ask: "What would you change?"',
      'Listen without defending. Write down their words. The ego steps aside.',
      'Apply at least one piece of feedback. The skill deepens.',
    ],
    signOfCompletion: 'The forge-master nods—award yourself 75 XP.',
    unlocked: false,
  },
  {
    id: 'M-BENCH-3',
    pillar: 'M',
    majorLocation: 'The Forge of Acumen',
    subLocation: "The Apprentice's Bench",
    title: 'The Deep Work Block',
    narrativeIntro: 'The Bench holds its greatest power in the quiet hours. No meetings, no messages—only you and the craft. The Forge rewards those who enter fully.',
    steps: [
      'Block three hours on your calendar. Guard them as sacred. "Deep Work—Do Not Schedule."',
      'Choose one high-value task that requires concentration. Not admin. Not email. Creation or analysis.',
      'Work in ninety-minute sprints. Twenty-minute rest between. No switching.',
      'When you finish, record what you accomplished. The Bench has witnessed.',
    ],
    signOfCompletion: 'The Forge blazes with your focus—award yourself 100 XP.',
    unlocked: false,
  },

  // Sub-Location 2: The Ledger Vault
  {
    id: 'M-VAULT-1',
    pillar: 'M',
    majorLocation: 'The Forge of Acumen',
    subLocation: 'The Ledger Vault',
    title: 'The Balance Check',
    narrativeIntro: 'The Ledger Vault is where the kingdom counts its coins. You cannot build mastery on shifting sand. Today you look at the numbers.',
    steps: [
      'Open your accounts. All of them. Checking, savings, debt. One place, one view.',
      'Write down: What comes in? What goes out? What is the gap?',
      'Name one expense you can reduce or one income stream you can start. Be specific.',
      'Schedule the next balance check. The Vault demands regularity.',
    ],
    signOfCompletion: 'The Ledger glows with clarity—award yourself 75 XP.',
    unlocked: true,
  },
  {
    id: 'M-VAULT-2',
    pillar: 'M',
    majorLocation: 'The Forge of Acumen',
    subLocation: 'The Ledger Vault',
    title: 'The Automation Rune',
    narrativeIntro: 'The Vault\'s oldest magic: set it once, and the gold flows where it must. You remove the willpower from the equation. The system works while you sleep.',
    steps: [
      'Choose one financial action you forget or avoid: savings transfer, bill pay, investment.',
      'Set up automation. Direct deposit, auto-transfer, scheduled payment. One change.',
      'Verify it is set. Test it if you can. The rune must be drawn correctly.',
      'Mark the date. In one month, check that it ran. The Vault holds itself.',
    ],
    signOfCompletion: 'The Vault hums with order—award yourself 75 XP.',
    unlocked: false,
  },
  {
    id: 'M-VAULT-3',
    pillar: 'M',
    majorLocation: 'The Forge of Acumen',
    subLocation: 'The Ledger Vault',
    title: 'The Three-Moon Goal',
    narrativeIntro: 'The Ledger Vault does not live in the past alone. The masters looked ahead. In three moons, what will the numbers say? You write it now.',
    steps: [
      'Set one financial goal for ninety days. Specific. "I will have __ saved." "I will pay off __."',
      'Break it into monthly targets. What must happen each moon?',
      'Identify the first action. This week. One transfer, one call, one decision.',
      'Write the goal where you will see it. The Vault is built one stone at a time.',
    ],
    signOfCompletion: 'The Vault\'s door creaks open toward the future—award yourself 100 XP.',
    unlocked: false,
  },
];

// Helper: get quests by pillar
export const getQuestsByPillar = (pillar) =>
  WILL_QUESTS.filter((q) => q.pillar === pillar);

// Helper: get quests by sub-location
export const getQuestsBySubLocation = (pillar, subLocationKey) => {
  const subLocationNames = {
    V: { IRON: 'The Iron Pit', FONT: 'The Recovery Font' },
    R: { CAIRN: 'The Meditation Cairn', LAB: 'The Planning Labyrinth' },
    C: { FIRE: 'The Bonding Fire', GATE: 'The Boundary Gate' },
    M: { BENCH: "The Apprentice's Bench", VAULT: 'The Ledger Vault' },
  };
  const name = subLocationNames[pillar]?.[subLocationKey];
  return WILL_QUESTS.filter((q) => q.pillar === pillar && q.subLocation === name);
};

// Helper: extract XP and coins from quest (coins = XP / 2, min 10)
export const getQuestRewards = (quest) => {
  const match = quest?.signOfCompletion?.match(/(\d+)\s*XP/i);
  const xp = match ? parseInt(match[1], 10) : 50;
  const coins = Math.max(10, Math.floor(xp / 2));
  return { xp, coins };
};

// Helper: get quest by id
export const getQuestById = (id) => WILL_QUESTS.find((q) => q.id === id);
