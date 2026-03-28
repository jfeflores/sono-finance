// ── Lesson content keyed by chapter IDs from LearnPage COURSES ──

export interface QuizContent {
  qnum: number;
  question: string;
  options: string[];
  correct: number;
  explanation: { correct: string; body: string; wrong: string };
}

export interface FillContent {
  sentence: string;
  blanks: Record<string, string>;
  wordBank: string[];
}

export interface StepDef {
  type: "story" | "concept" | "quiz" | "fill" | "explorer";
  id: string;
}

export interface LessonData {
  title: string;
  titleHighlight?: string;
  subtitle: string;
  storyAvatar: string;
  storyName: string;
  storyText: string;
  conceptTitle: string;
  concepts: { title: string; body: string; formula?: string }[];
  conceptFooter?: string;
  quizzes: Record<string, QuizContent>;
  fill?: FillContent;
  steps: StepDef[];
  completionUnlock?: string;
  completionMessage?: string;
}

// ── Helper to build standard steps ──
function stdSteps(quizCount: number, hasFill: boolean): StepDef[] {
  const s: StepDef[] = [
    { type: "story", id: "story1" },
    { type: "concept", id: "concept1" },
  ];
  for (let i = 1; i <= quizCount; i++) {
    s.push({ type: "quiz", id: `q${i}` });
    if (hasFill && i === Math.ceil(quizCount / 2)) {
      s.push({ type: "fill", id: "f1" });
    }
  }
  if (hasFill && quizCount <= 1) s.push({ type: "fill", id: "f1" });
  return s;
}

const LESSONS: Record<string, LessonData> = {
  // ══════════════════════════════════════════════════════════════
  // MONEY BASICS
  // ══════════════════════════════════════════════════════════════
  "what-is-money": {
    title: "What is",
    titleHighlight: "Money?",
    subtitle: "Chapter 1 · Lesson 1",
    storyAvatar: "🪙",
    storyName: "Alex, your Financial Guide",
    storyText: "Imagine a world where you had to trade chickens for shoes. Sounds inconvenient, right? That's exactly why <strong>money</strong> was invented — to make exchanging value easier. Let's explore how money works and why it matters to you every single day.",
    conceptTitle: "What money really is",
    concepts: [
      { title: "Medium of Exchange", body: "Money lets you trade without needing a 'double coincidence of wants.' Instead of finding someone who has shoes AND wants chickens, you just pay with money." },
      { title: "Store of Value", body: "Unlike perishable goods, money holds its value over time (though inflation can erode it). You can save it and spend it later." },
      { title: "Unit of Account", body: "Money gives us a common measure to compare prices. A $5 coffee vs a $50 shirt — money makes comparison easy." },
    ],
    conceptFooter: "Understanding these three roles helps you see why managing money well is so powerful.",
    quizzes: {
      q1: { qnum: 1, question: "Which of the following is NOT a primary function of money?", options: ["Medium of exchange", "Store of value", "Source of happiness", "Unit of account"], correct: 2, explanation: { correct: "🎯 Right!", body: "Money serves as a medium of exchange, store of value, and unit of account — but it's a tool, not a guarantee of happiness.", wrong: "Think about the three core functions of money." } },
      q2: { qnum: 2, question: "Before money existed, people traded goods directly. What is this system called?", options: ["Capitalism", "Bartering", "Credit", "Inflation"], correct: 1, explanation: { correct: "🎯 Correct!", body: "<strong>Bartering</strong> is the direct exchange of goods and services without money. It required both parties to want what the other had.", wrong: "This is the oldest form of trade — directly swapping goods." } },
    },
    fill: { sentence: "Money acts as a [blank1] of exchange, a store of [blank2], and a unit of account.", blanks: { blank1: "medium", blank2: "value" }, wordBank: ["medium", "value", "credit", "interest", "exchange"] },
    steps: stdSteps(2, true),
    completionUnlock: "Income vs Expenses",
    completionMessage: "You understand what money really is!",
  },

  "income-vs-expenses": {
    title: "Income vs",
    titleHighlight: "Expenses",
    subtitle: "Chapter 1 · Lesson 2",
    storyAvatar: "💵",
    storyName: "Alex, your Financial Guide",
    storyText: "You earn $3,000 this month. Rent is $1,200, groceries $400, subscriptions $80… where does the rest go? Understanding the flow of money in and out is the <strong>foundation</strong> of every financial decision you'll ever make.",
    conceptTitle: "Cash flow basics",
    concepts: [
      { title: "Income", body: "All money coming IN — your salary, side hustle, freelance gigs, interest from savings, gifts. This is your financial fuel." },
      { title: "Expenses", body: "All money going OUT — rent, food, transportation, entertainment, subscriptions. Fixed expenses stay the same; variable ones fluctuate." },
      { title: "Cash Flow", body: "Income minus expenses = cash flow. Positive cash flow means you have money left to save or invest. Negative means you're spending more than you earn." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "If you earn $3,000/month and spend $2,800, what is your monthly cash flow?", options: ["-$200", "$0", "$200", "$3,000"], correct: 2, explanation: { correct: "🎯 Exactly!", body: "$3,000 - $2,800 = <strong>$200</strong> positive cash flow. That's money you can save or invest!", wrong: "Subtract expenses from income to find cash flow." } },
      q2: { qnum: 2, question: "Which of these is a FIXED expense?", options: ["Groceries", "Concert tickets", "Monthly rent", "Gas for your car"], correct: 2, explanation: { correct: "🎯 Correct!", body: "<strong>Rent</strong> stays the same every month — that's what makes it a fixed expense. Groceries and gas vary.", wrong: "Fixed expenses are the same amount each month." } },
    },
    fill: { sentence: "When your [blank1] is greater than your expenses, you have positive [blank2] flow.", blanks: { blank1: "income", blank2: "cash" }, wordBank: ["income", "cash", "credit", "debt", "savings"] },
    steps: stdSteps(2, true),
    completionUnlock: "Needs vs Wants",
    completionMessage: "You've mastered the basics of cash flow!",
  },

  "needs-vs-wants": {
    title: "Needs vs",
    titleHighlight: "Wants",
    subtitle: "Chapter 1 · Lesson 3",
    storyAvatar: "🛒",
    storyName: "Alex, your Financial Guide",
    storyText: "New sneakers are calling your name — but your car insurance is due next week. How do you decide? Separating <strong>needs</strong> from <strong>wants</strong> is one of the most powerful money skills you can learn. Let's break it down.",
    conceptTitle: "Priorities in spending",
    concepts: [
      { title: "Needs", body: "Things required for survival and basic functioning: housing, food, utilities, healthcare, transportation to work. Without these, your life would be seriously impacted." },
      { title: "Wants", body: "Things that improve quality of life but aren't essential: dining out, streaming services, designer clothes, vacations. Nice to have, but you can live without them." },
      { title: "The Gray Area", body: "A phone is a need; the latest iPhone is a want. Food is a need; eating out every night is a want. Learning to spot the difference saves thousands per year." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Which of these is a WANT, not a need?", options: ["Groceries", "Health insurance", "A streaming subscription", "Electricity"], correct: 2, explanation: { correct: "🎯 Right!", body: "Streaming is entertainment — a want. You can live without it, even if it doesn't feel that way!", wrong: "Think about what you truly can't live without." } },
      q2: { qnum: 2, question: "You have $200 left after bills. Your friend invites you to a $150 concert, but your car needs an oil change ($60). What's the smartest move?", options: ["Skip both and save it all", "Go to the concert — YOLO", "Oil change first, then decide on the concert", "Put the concert on a credit card"], correct: 2, explanation: { correct: "🎯 Smart!", body: "Handle the need (car maintenance) first. With $140 left, you can decide if the concert fits your budget. Example: $60 oil change + $80 saved = responsible AND fun.", wrong: "Prioritize needs, then see what's left for wants." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Why save money?",
    completionMessage: "You can now tell needs from wants like a pro!",
  },

  "saving-basics": {
    title: "Why Save",
    titleHighlight: "Money?",
    subtitle: "Chapter 1 · Lesson 4",
    storyAvatar: "🐖",
    storyName: "Alex, your Financial Guide",
    storyText: "Your future self will either thank you or blame you for what you do with money today. Saving isn't about depriving yourself — it's about giving yourself <strong>options</strong>. A savings habit, even a small one, is life-changing.",
    conceptTitle: "The power of saving",
    concepts: [
      { title: "Peace of Mind", body: "Having savings means a flat tire or medical bill doesn't become a crisis. Example: A $500 emergency fund covers most unexpected expenses." },
      { title: "Opportunity", body: "Savings let you say YES to opportunities — a great deal on a car, a dream trip, or starting a business. No savings = no choices." },
      { title: "The Latte Factor", body: "Small daily expenses add up. $5/day on coffee = $1,825/year. You don't have to quit — just be aware. Even saving $2/day = $730/year." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "If you save $10 per week, how much will you have after one year?", options: ["$120", "$365", "$520", "$1,000"], correct: 2, explanation: { correct: "🎯 Exactly!", body: "$10 × 52 weeks = <strong>$520</strong>. That's over half an emergency fund just from $10/week!", wrong: "Multiply $10 by the number of weeks in a year (52)." } },
      q2: { qnum: 2, question: "What's the main benefit of an emergency fund?", options: ["Higher returns than stocks", "Tax deductions", "Financial security during unexpected events", "Free money from the government"], correct: 2, explanation: { correct: "🎯 Correct!", body: "An emergency fund is your safety net. Example: If you lose your job, 3 months of expenses saved gives you time to find a new one without going into debt.", wrong: "Think about why having cash set aside matters." } },
    },
    fill: { sentence: "Saving money provides peace of [blank1] and opens up [blank2] for your future.", blanks: { blank1: "mind", blank2: "opportunities" }, wordBank: ["mind", "opportunities", "debt", "stress", "taxes"] },
    steps: stdSteps(2, true),
    completionUnlock: "Setting financial goals",
    completionMessage: "You understand why saving changes everything!",
  },

  "financial-goals": {
    title: "Setting Financial",
    titleHighlight: "Goals",
    subtitle: "Chapter 1 · Lesson 5",
    storyAvatar: "🎯",
    storyName: "Alex, your Financial Guide",
    storyText: "\"I want to be rich\" is a dream. \"I want to save $5,000 for a car down payment in 12 months\" is a <strong>goal</strong>. The difference? Goals have a plan. Let's learn how to set financial goals that actually stick.",
    conceptTitle: "SMART financial goals",
    concepts: [
      { title: "Specific", body: "Not 'save more money' but 'save $3,000 for an emergency fund.' The clearer the target, the easier to hit it." },
      { title: "Measurable & Time-bound", body: "Attach numbers and deadlines. '$250/month for 12 months' is trackable. Example: Want a $6,000 vacation? That's $500/month for a year." },
      { title: "Short, Medium & Long-term", body: "Short: emergency fund (3-6 months). Medium: car down payment (1-3 years). Long: retirement (10+ years). Balance all three." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Which is a SMART financial goal?", options: ["Save more money this year", "Stop spending so much", "Save $200/month for 6 months to build a $1,200 emergency fund", "Try to invest someday"], correct: 2, explanation: { correct: "🎯 Perfect!", body: "It's specific ($200/month), measurable ($1,200 total), and time-bound (6 months). That's a real plan!", wrong: "SMART goals need specific amounts, timelines, and measurability." } },
      q2: { qnum: 2, question: "A 'long-term' financial goal typically covers what time frame?", options: ["1–3 months", "6–12 months", "1–3 years", "5+ years"], correct: 3, explanation: { correct: "🎯 Right!", body: "Long-term goals include retirement savings, buying a home, or building wealth — typically <strong>5+ years</strong> out.", wrong: "Long-term means thinking years ahead, not months." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "What is a budget?",
    completionMessage: "You now know how to set goals that stick!",
  },

  // ══════════════════════════════════════════════════════════════
  // BUDGETING
  // ══════════════════════════════════════════════════════════════
  "what-is-budget": {
    title: "What is a",
    titleHighlight: "Budget?",
    subtitle: "Chapter 2 · Lesson 1",
    storyAvatar: "📋",
    storyName: "Alex, your Financial Guide",
    storyText: "Think of a budget like a GPS for your money. Without one, you're driving blind and wondering why you ran out of gas. A budget tells every dollar where to go — so <strong>you</strong> stay in control, not your impulses.",
    conceptTitle: "Budgeting fundamentals",
    concepts: [
      { title: "It's a Plan, Not a Prison", body: "A budget doesn't mean you can't have fun. It means you PLAN for fun. Example: Budgeting $100/month for dining out means guilt-free meals." },
      { title: "Income – Expenses = Savings", body: "The basic budget equation. If income is $3,000 and expenses are $2,700, you save $300. A budget helps you find where those savings can grow." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What is the primary purpose of a budget?", options: ["To restrict all spending", "To plan how you'll use your money", "To eliminate fun from your life", "To impress your bank"], correct: 1, explanation: { correct: "🎯 Exactly!", body: "A budget is a <strong>spending plan</strong> — it helps you direct money toward what matters most to you.", wrong: "A budget is about planning, not restricting." } },
      q2: { qnum: 2, question: "If your monthly income is $4,000 and you budget $3,600 for expenses, how much goes to savings?", options: ["$36", "$400", "$3,600", "$4,000"], correct: 1, explanation: { correct: "🎯 Right!", body: "$4,000 - $3,600 = <strong>$400</strong> in savings each month. That's $4,800/year!", wrong: "Subtract your budgeted expenses from your income." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "The 50/30/20 Rule",
    completionMessage: "You understand what budgeting is all about!",
  },

  "50-30-20": {
    title: "The",
    titleHighlight: "50/30/20 Rule",
    subtitle: "Chapter 2 · Lesson 2",
    storyAvatar: "📊",
    storyName: "Alex, your Financial Guide",
    storyText: "Senator Elizabeth Warren popularized this simple framework: split your after-tax income into three buckets. It's not perfect for everyone, but it's a <strong>fantastic starting point</strong> if you've never budgeted before.",
    conceptTitle: "Three-bucket system",
    concepts: [
      { title: "50% → Needs", body: "Rent, groceries, utilities, insurance, minimum debt payments. Example: On $4,000/month, that's $2,000 for essentials." },
      { title: "30% → Wants", body: "Dining out, entertainment, shopping, hobbies. Example: $1,200/month for things that make life enjoyable." },
      { title: "20% → Savings & Debt", body: "Emergency fund, retirement contributions, extra debt payments. Example: $800/month building your future." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Using the 50/30/20 rule on a $5,000 monthly income, how much goes to wants?", options: ["$500", "$1,000", "$1,500", "$2,500"], correct: 2, explanation: { correct: "🎯 Perfect!", body: "30% of $5,000 = <strong>$1,500</strong> for wants. That's your guilt-free spending money!", wrong: "Wants get 30% of your income." } },
      q2: { qnum: 2, question: "Which expense falls into the 'Needs' category?", options: ["Netflix subscription", "New sneakers", "Monthly rent", "Concert tickets"], correct: 2, explanation: { correct: "🎯 Right!", body: "Rent is essential — you need shelter. Netflix and concerts are wants.", wrong: "Needs are things required for basic living." } },
    },
    fill: { sentence: "The 50/30/20 rule allocates 50% to [blank1], 30% to wants, and 20% to [blank2].", blanks: { blank1: "needs", blank2: "savings" }, wordBank: ["needs", "savings", "taxes", "wants", "debt"] },
    steps: stdSteps(2, true),
    completionUnlock: "Zero-Based Budgeting",
    completionMessage: "You've learned the 50/30/20 framework!",
  },

  "zero-based": {
    title: "Zero-Based",
    titleHighlight: "Budgeting",
    subtitle: "Chapter 2 · Lesson 3",
    storyAvatar: "🎯",
    storyName: "Alex, your Financial Guide",
    storyText: "In zero-based budgeting, every single dollar gets a job. Income minus ALL planned spending (including savings) equals <strong>exactly zero</strong>. Nothing is left unaccounted for — and that's the power of it.",
    conceptTitle: "Give every dollar a job",
    concepts: [
      { title: "How It Works", body: "List all income, then assign every dollar to a category until you reach $0. Example: $3,000 income → $1,200 rent + $400 food + $200 transport + $300 savings + $900 other = $0 remaining." },
      { title: "Savings ARE an Assignment", body: "Zero doesn't mean you spend everything. Savings, investments, and debt payments are all 'jobs' for your dollars." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "In zero-based budgeting, what should income minus expenses equal?", options: ["Your savings amount", "Zero", "Your rent amount", "Whatever is left over"], correct: 1, explanation: { correct: "🎯 Correct!", body: "Every dollar is assigned a purpose, so income - all assignments = <strong>$0</strong>. Nothing is unplanned.", wrong: "The 'zero' in zero-based means no unassigned money." } },
      q2: { qnum: 2, question: "If you have $500 unassigned in a zero-based budget, what should you do?", options: ["Celebrate — free money!", "Ignore it", "Assign it to a category (savings, debt, fun, etc.)", "Return it to your employer"], correct: 2, explanation: { correct: "🎯 Smart!", body: "Unassigned money defeats the purpose. Assign that $500 — maybe $300 to savings and $200 to your fun fund!", wrong: "In zero-based budgeting, every dollar needs a job." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Tracking expenses",
    completionMessage: "You've mastered zero-based budgeting!",
  },

  "tracking-expenses": {
    title: "Tracking",
    titleHighlight: "Expenses",
    subtitle: "Chapter 2 · Lesson 4",
    storyAvatar: "🔍",
    storyName: "Alex, your Financial Guide",
    storyText: "Most people are shocked when they see where their money actually goes. That $4 coffee, $12 lunch, $15 Uber — it adds up to hundreds per month. <strong>Tracking</strong> is how you take back control.",
    conceptTitle: "Know where every dollar goes",
    concepts: [
      { title: "The Awareness Effect", body: "Studies show people who track spending save 15-20% more. Just being aware changes behavior. Example: Tracking reveals you spend $300/month on food delivery — is that worth it to you?" },
      { title: "Methods", body: "Apps (Mint, YNAB), spreadsheets, or old-school pen & paper. The best method is whichever one you'll actually use consistently." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What's the biggest benefit of tracking your expenses?", options: ["You earn more money", "You become aware of spending patterns", "Your credit score improves", "Banks give you rewards"], correct: 1, explanation: { correct: "🎯 Exactly!", body: "Awareness is the first step to change. When you see that $200/month on subscriptions, you can decide which ones truly matter.", wrong: "Tracking is about awareness, not earning." } },
      q2: { qnum: 2, question: "You tracked your spending for a month and found $180 going to food delivery apps. What's a good next step?", options: ["Delete all food apps immediately", "Set a budget of $100/month for delivery and cook more", "Ignore it — food is a need", "Switch to a more expensive app"], correct: 1, explanation: { correct: "🎯 Smart approach!", body: "You don't have to go cold turkey. Setting a limit of $100 saves you $80/month = <strong>$960/year</strong> while still enjoying the convenience sometimes.", wrong: "The goal isn't elimination — it's intentional spending." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Adjusting your budget",
    completionMessage: "You're now tracking expenses like a pro!",
  },

  "budget-adjustments": {
    title: "Adjusting Your",
    titleHighlight: "Budget",
    subtitle: "Chapter 2 · Lesson 5",
    storyAvatar: "🔄",
    storyName: "Alex, your Financial Guide",
    storyText: "A budget isn't a set-it-and-forget-it thing. Life changes — you get a raise, move to a new city, or have an unexpected expense. The best budgeters <strong>review and adjust</strong> regularly.",
    conceptTitle: "Iterate and improve",
    concepts: [
      { title: "Monthly Reviews", body: "At month's end, compare planned vs actual spending. Where did you overspend? Underspend? Example: You budgeted $400 for groceries but spent $350 — move that $50 to savings!" },
      { title: "Life Events", body: "Got a raise? Don't inflate your lifestyle 100%. Follow the 50/50 rule: half to lifestyle, half to savings. A $500 raise = $250 more fun + $250 more savings." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "How often should you review your budget?", options: ["Once a year", "Every month", "Only when you're broke", "Never — set it and forget it"], correct: 1, explanation: { correct: "🎯 Right!", body: "Monthly reviews help you catch overspending early and celebrate wins. It takes 15 minutes and saves you thousands.", wrong: "Regular reviews are key to budget success." } },
      q2: { qnum: 2, question: "You get a $600/month raise. Following the 50/50 rule, how much should go to savings?", options: ["$0 — treat yourself!", "$150", "$300", "$600"], correct: 2, explanation: { correct: "🎯 Balanced!", body: "$300 to lifestyle improvements + $300 to savings. That's <strong>$3,600/year</strong> in extra savings without feeling deprived.", wrong: "The 50/50 rule splits raises between lifestyle and savings." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Checking vs Savings",
    completionMessage: "You know how to keep your budget fresh!",
  },

  // ══════════════════════════════════════════════════════════════
  // BANKING
  // ══════════════════════════════════════════════════════════════
  "checking-savings": {
    title: "Checking vs",
    titleHighlight: "Savings",
    subtitle: "Chapter 3 · Lesson 1",
    storyAvatar: "🏦",
    storyName: "Alex, your Financial Guide",
    storyText: "You walk into a bank and they ask: checking or savings? What's the difference, and why do you need both? Understanding these <strong>two foundational accounts</strong> is the first step to organized finances.",
    conceptTitle: "Two core accounts",
    concepts: [
      { title: "Checking Account", body: "Your everyday spending account. Unlimited transactions, debit card, direct deposit. Example: Rent, groceries, and bills come out of here. Typically earns 0.01% interest." },
      { title: "Savings Account", body: "Your money-growing account. Higher interest, but limited withdrawals (typically 6/month). Example: Emergency fund, vacation savings, house down payment fund." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Which account is best for everyday purchases?", options: ["Savings account", "Checking account", "Investment account", "Retirement account"], correct: 1, explanation: { correct: "🎯 Right!", body: "Checking accounts are designed for daily transactions — paying bills, buying groceries, using your debit card.", wrong: "Think about which account allows unlimited daily transactions." } },
      q2: { qnum: 2, question: "Why might a savings account limit you to 6 withdrawals per month?", options: ["Banks are mean", "Federal Regulation D (to encourage saving)", "They don't have enough cash", "It's a glitch"], correct: 1, explanation: { correct: "🎯 Correct!", body: "Regulation D historically limited savings withdrawals to encourage people to actually <strong>save</strong> rather than treat it like a checking account.", wrong: "There's a regulatory reason for the limit." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Avoiding bank fees",
    completionMessage: "You know your account types!",
  },

  "bank-fees": {
    title: "Avoiding",
    titleHighlight: "Bank Fees",
    subtitle: "Chapter 3 · Lesson 2",
    storyAvatar: "💸",
    storyName: "Alex, your Financial Guide",
    storyText: "Americans pay over <strong>$8 billion</strong> in overdraft fees alone each year. That's money going straight to banks instead of your pocket. Let's learn how to dodge these sneaky charges.",
    conceptTitle: "Common fees & how to avoid them",
    concepts: [
      { title: "Overdraft Fees ($35 average)", body: "Triggered when you spend more than your balance. Fix: Set up low-balance alerts, opt out of overdraft 'protection,' or keep a $200 buffer in checking." },
      { title: "Monthly Maintenance ($5-15)", body: "Many banks charge just to have an account. Fix: Use online banks (most are free) or meet minimum balance requirements." },
      { title: "ATM Fees ($2-5 per use)", body: "Using out-of-network ATMs costs you twice — your bank AND the ATM owner charge. Fix: Use in-network ATMs or get a bank that reimburses fees." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What's the average overdraft fee in the US?", options: ["$5", "$15", "$35", "$100"], correct: 2, explanation: { correct: "🎯 Unfortunately, yes!", body: "The average overdraft fee is about <strong>$35</strong> — and you can get multiple in one day. Some people pay $100+ in a single day from small purchases.", wrong: "It's higher than most people think!" } },
      q2: { qnum: 2, question: "What's the easiest way to avoid monthly maintenance fees?", options: ["Keep $1 million in the account", "Use an online bank with no fees", "Never use the account", "Call and complain every month"], correct: 1, explanation: { correct: "🎯 Smart!", body: "Online banks like Ally, Marcus, and Discover typically have <strong>zero monthly fees</strong> because they don't have physical branches to maintain.", wrong: "Look for banks with no-fee accounts." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "High-yield savings",
    completionMessage: "You'll never pay unnecessary bank fees again!",
  },

  "hysa": {
    title: "High-Yield",
    titleHighlight: "Savings",
    subtitle: "Chapter 3 · Lesson 3",
    storyAvatar: "📈",
    storyName: "Alex, your Financial Guide",
    storyText: "Your traditional bank pays 0.01% interest. A high-yield savings account (HYSA) pays 4-5%. On $10,000, that's the difference between <strong>$1/year and $500/year</strong>. Same effort, 500x the return.",
    conceptTitle: "Make your savings work harder",
    concepts: [
      { title: "What is a HYSA?", body: "An online savings account offering 10-50x higher interest rates than traditional banks. FDIC insured up to $250,000 — just as safe. Example: $10,000 at 5% = $500/year in free money." },
      { title: "Why Online Banks Pay More", body: "No physical branches = lower costs = higher rates for you. It's a win-win. Access your money via app and transfers." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "If you have $10,000 in a HYSA at 5% APY, approximately how much interest do you earn in one year?", options: ["$5", "$50", "$500", "$5,000"], correct: 2, explanation: { correct: "🎯 Exactly!", body: "$10,000 × 0.05 = <strong>$500</strong>. Compare that to $1 at a traditional bank's 0.01% rate!", wrong: "Multiply the balance by the interest rate." } },
      q2: { qnum: 2, question: "Are high-yield savings accounts safe?", options: ["No, they're risky like stocks", "Yes, if FDIC insured (up to $250,000)", "Only if you're rich", "They're safer than checking accounts"], correct: 1, explanation: { correct: "🎯 Correct!", body: "FDIC insurance covers up to <strong>$250,000</strong> per depositor, per bank. Your money is just as protected as at a big-name bank.", wrong: "Look for FDIC insurance — it's the key safety feature." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Online banking",
    completionMessage: "You know how to earn more on your savings!",
  },

  "online-banking": {
    title: "Online &",
    titleHighlight: "Mobile Banking",
    subtitle: "Chapter 3 · Lesson 4",
    storyAvatar: "📱",
    storyName: "Alex, your Financial Guide",
    storyText: "Your smartphone is now your bank branch. From mobile deposits to instant transfers, digital banking tools make managing money <strong>faster and easier</strong> than ever.",
    conceptTitle: "Digital tools for your money",
    concepts: [
      { title: "Mobile Check Deposit", body: "Snap a photo of a check and deposit it from your couch. Most banks offer this for free — no more driving to the bank." },
      { title: "Instant Transfers", body: "Apps like Zelle, Venmo, and bank-to-bank transfers move money in minutes. Example: Split dinner with friends instantly." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What's a key advantage of online banking?", options: ["Higher fees", "24/7 access to your accounts", "Slower transactions", "No customer support"], correct: 1, explanation: { correct: "🎯 Right!", body: "Online banking gives you <strong>24/7 access</strong> — check balances, pay bills, and transfer money anytime, anywhere.", wrong: "Think about convenience and accessibility." } },
      q2: { qnum: 2, question: "Which is a safe practice for mobile banking?", options: ["Use public WiFi for banking", "Share your password with friends", "Enable two-factor authentication", "Use '1234' as your PIN"], correct: 2, explanation: { correct: "🎯 Correct!", body: "<strong>Two-factor authentication</strong> adds a second verification step, making it much harder for hackers to access your accounts.", wrong: "Think about security best practices." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Emergency fund setup",
    completionMessage: "You're a digital banking pro!",
  },

  "emergency-fund": {
    title: "Emergency",
    titleHighlight: "Fund Setup",
    subtitle: "Chapter 3 · Lesson 5",
    storyAvatar: "🛡️",
    storyName: "Alex, your Financial Guide",
    storyText: "Life will throw curveballs — a job loss, car breakdown, medical bill. An emergency fund is your financial <strong>shock absorber</strong>. Without one, every unexpected expense becomes a crisis. Let's build yours.",
    conceptTitle: "Your financial safety net",
    concepts: [
      { title: "How Much?", body: "Start with $1,000 as a mini-fund, then build to 3-6 months of living expenses. Example: If your monthly expenses are $2,500, aim for $7,500-$15,000." },
      { title: "Where to Keep It", body: "In a high-yield savings account — accessible but separate from daily spending. Don't invest it — you need it liquid and stable." },
      { title: "How to Build It", body: "Start small. $25/week = $1,300/year. Automate transfers on payday. Sell unused items. Direct tax refunds straight to savings." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What's the recommended size of a full emergency fund?", options: ["$500", "1 month of expenses", "3-6 months of living expenses", "1 year of salary"], correct: 2, explanation: { correct: "🎯 Right!", body: "3-6 months of expenses protects you from most emergencies. Example: $3,000/month expenses → aim for $9,000-$18,000.", wrong: "Think about how long it takes to recover from a job loss." } },
      q2: { qnum: 2, question: "Where should you keep your emergency fund?", options: ["Under your mattress", "In stocks for higher returns", "In a high-yield savings account", "In cryptocurrency"], correct: 2, explanation: { correct: "🎯 Smart!", body: "A HYSA keeps your fund <strong>liquid, safe, and earning interest</strong>. You need quick access without risk of losing value.", wrong: "Emergency funds need to be safe and accessible." } },
    },
    fill: { sentence: "An emergency fund should cover [blank1] to six months of living [blank2].", blanks: { blank1: "three", blank2: "expenses" }, wordBank: ["three", "expenses", "income", "one", "savings"] },
    steps: stdSteps(2, true),
    completionUnlock: "Direct deposit & automation",
    completionMessage: "You're ready to build your safety net!",
  },

  "direct-deposit": {
    title: "Direct Deposit &",
    titleHighlight: "Automation",
    subtitle: "Chapter 3 · Lesson 6",
    storyAvatar: "⚡",
    storyName: "Alex, your Financial Guide",
    storyText: "The secret to saving consistently? <strong>Remove yourself from the equation.</strong> Automate your finances so saving happens before you can spend. It's the single most effective money hack.",
    conceptTitle: "Set it and forget it",
    concepts: [
      { title: "Split Direct Deposit", body: "Most employers let you split your paycheck into multiple accounts. Example: 80% to checking, 20% to savings — automatically every payday." },
      { title: "Automatic Bill Pay", body: "Set up autopay for recurring bills — rent, utilities, subscriptions. Never miss a payment or pay a late fee again." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What's the biggest advantage of automating your savings?", options: ["You earn more interest", "You don't have to think about it", "Banks pay you a bonus", "It increases your credit score"], correct: 1, explanation: { correct: "🎯 Exactly!", body: "Automation removes willpower from the equation. Money is saved <strong>before you can spend it</strong> — that's why it works so well.", wrong: "Think about the behavioral benefit." } },
      q2: { qnum: 2, question: "You want to save 20% of your $3,000 paycheck automatically. How much should you set up for auto-transfer to savings?", options: ["$200", "$400", "$600", "$900"], correct: 2, explanation: { correct: "🎯 Right!", body: "20% of $3,000 = <strong>$600</strong>. Set this as an automatic transfer on payday and you'll save $7,200/year without thinking about it!", wrong: "Calculate 20% of $3,000." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "What is interest?",
    completionMessage: "Your finances are now on autopilot!",
  },

  // ══════════════════════════════════════════════════════════════
  // INTEREST & LOANS
  // ══════════════════════════════════════════════════════════════
  "what-is-interest": {
    title: "What is",
    titleHighlight: "Interest?",
    subtitle: "Chapter 4 · Lesson 1",
    storyAvatar: "💰",
    storyName: "Alex, your Financial Guide",
    storyText: "Interest is the <strong>price of borrowing money</strong> — or the <strong>reward for saving it</strong>. It's the single most important concept in all of finance. Master it, and you'll understand how wealth is built (or destroyed).",
    conceptTitle: "The two sides of interest",
    concepts: [
      { title: "Interest You Earn", body: "When you save, the bank pays YOU interest for letting them use your money. Example: $5,000 at 5% = $250/year earned. Your money works for you." },
      { title: "Interest You Pay", body: "When you borrow, YOU pay the lender interest. Example: A $10,000 car loan at 7% costs you $700/year in interest. Your money works against you." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "If you have $2,000 in savings at 4% annual interest, how much do you earn in one year?", options: ["$8", "$40", "$80", "$400"], correct: 2, explanation: { correct: "🎯 Right!", body: "$2,000 × 0.04 = <strong>$80</strong>. That's free money just for keeping your savings in the right account!", wrong: "Multiply the balance by the interest rate (as a decimal)." } },
      q2: { qnum: 2, question: "When is interest BAD for you?", options: ["When you earn it on savings", "When you pay it on debt", "When inflation is low", "Interest is always good"], correct: 1, explanation: { correct: "🎯 Exactly!", body: "Interest on debt means you're paying <strong>extra</strong> for things. A $1,000 credit card balance at 20% APR costs you $200/year if unpaid.", wrong: "Think about when interest costs you money." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Simple vs Compound",
    completionMessage: "You understand the basics of interest!",
  },

  "simple-vs-compound": {
    title: "Simple vs.",
    titleHighlight: "Compound Interest",
    subtitle: "Chapter 4 · Lesson 2",
    storyAvatar: "🧑‍💼",
    storyName: "Alex, your Financial Guide",
    storyText: 'You just got your first paycheck — <strong>$1,000</strong>! You\'re deciding between two savings accounts. Bank A offers <strong>simple interest</strong>, and Bank B offers <strong>compound interest</strong>, both at 10% per year. Which do you choose? Let\'s find out why the answer matters enormously.',
    conceptTitle: "Two types of interest",
    concepts: [
      { title: "Simple Interest", body: "Calculated only on your original principal. Every year, you earn the same flat amount.", formula: "I = P × r × t" },
      { title: "Compound Interest", body: "Calculated on your principal plus the interest you've already earned. Your interest earns interest!", formula: "A = P(1 + r)ᵗ" },
    ],
    conceptFooter: "This difference sounds small — but over time, it's transformational.",
    quizzes: {
      q1: { qnum: 1, question: "You deposit $500 at 8% simple interest per year. How much interest do you earn after 3 years?", options: ["$24", "$120", "$158.69", "$500"], correct: 1, explanation: { correct: "🎯 Exactly right!", body: "Simple interest formula: I = P × r × t → I = 500 × 0.08 × 3 = <strong>$120</strong>. Every year you earn exactly $40.", wrong: "Not quite — remember simple interest: I = P × r × t" } },
      q2: { qnum: 2, question: "Same scenario, but now using compound interest (annual compounding). What is the total amount after 3 years?", options: ["$620.00", "$629.86", "$634.00", "$660.00"], correct: 1, explanation: { correct: "🎯 Perfect!", body: "A = 500 × (1.08)³ = 500 × 1.2597 = <strong>$629.86</strong>. That's $9.86 more than simple interest — and the gap keeps widening!", wrong: "Not quite. Use A = P(1 + r)ᵗ." } },
      q3: { qnum: 3, question: "The \"Rule of 72\" estimates how many years it takes to double your money. At 6% interest, approximately how long?", options: ["6 years", "10 years", "12 years", "18 years"], correct: 2, explanation: { correct: "🏆 Brilliant!", body: "Rule of 72: 72 ÷ 6 = <strong>12 years</strong> to double your money.", wrong: "Divide 72 by the interest rate." } },
    },
    fill: { sentence: "In compound interest, each period's interest is calculated on the [blank1] plus any [blank2] interest already earned.", blanks: { blank1: "principal", blank2: "accumulated" }, wordBank: ["principal", "accumulated", "simple", "future", "original"] },
    steps: [
      { type: "story", id: "story1" },
      { type: "concept", id: "concept1" },
      { type: "explorer", id: "explorer1" },
      { type: "quiz", id: "q1" },
      { type: "quiz", id: "q2" },
      { type: "fill", id: "f1" },
      { type: "quiz", id: "q3" },
    ],
    completionUnlock: "APR vs APY",
    completionMessage: "You've mastered simple vs. compound interest!",
  },

  "apr-vs-apy": {
    title: "APR vs",
    titleHighlight: "APY",
    subtitle: "Chapter 4 · Lesson 3",
    storyAvatar: "🔍",
    storyName: "Alex, your Financial Guide",
    storyText: "Banks love to confuse you. <strong>APR</strong> and <strong>APY</strong> sound similar but mean very different things. One understates your cost; the other inflates your return. Let's demystify both.",
    conceptTitle: "Two important rates",
    concepts: [
      { title: "APR (Annual Percentage Rate)", body: "The stated interest rate WITHOUT compounding. Used for loans and credit cards. Example: A credit card at 24% APR charges 2% per month on your balance." },
      { title: "APY (Annual Percentage Yield)", body: "The EFFECTIVE rate WITH compounding included. Used for savings. Example: 5% APY means you actually earn 5% over the year including compound effects." },
      { title: "Why It Matters", body: "When borrowing, compare APRs (lower is better). When saving, compare APYs (higher is better). A 5% APY savings beats a 5% APR savings." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "When comparing savings accounts, which rate should you look at?", options: ["APR", "APY", "They're the same thing", "Neither — look at the bank's brand"], correct: 1, explanation: { correct: "🎯 Right!", body: "APY includes compounding, giving you the <strong>true picture</strong> of what you'll earn. A 5% APY is always better than a 5% APR for savings.", wrong: "One of these rates accounts for compounding." } },
      q2: { qnum: 2, question: "A credit card has a 24% APR. What's the approximate monthly interest rate?", options: ["1%", "2%", "12%", "24%"], correct: 1, explanation: { correct: "🎯 Correct!", body: "24% ÷ 12 months = <strong>2% per month</strong>. On a $1,000 balance, that's $20/month in interest charges.", wrong: "Divide the annual rate by 12 months." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Credit card traps",
    completionMessage: "You'll never confuse APR and APY again!",
  },

  "credit-card-traps": {
    title: "Credit Card",
    titleHighlight: "Traps",
    subtitle: "Chapter 4 · Lesson 4",
    storyAvatar: "⚠️",
    storyName: "Alex, your Financial Guide",
    storyText: "Credit cards can be powerful tools OR financial traps. The difference? <strong>Knowledge.</strong> Credit card companies make billions from people who don't understand the fine print. Let's make sure you're not one of them.",
    conceptTitle: "Pitfalls to avoid",
    concepts: [
      { title: "Minimum Payment Trap", body: "Paying only the minimum ($25/month on a $5,000 balance at 20% APR) means it takes 30+ YEARS to pay off and you pay $8,000+ in interest. Always pay more than the minimum." },
      { title: "Grace Period", body: "You're only charged interest if you carry a balance. Pay your FULL statement balance by the due date = zero interest. Example: Buy $500 on March 1, pay $500 by March 25 = $0 interest." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "You have a $3,000 credit card balance at 20% APR. If you only pay the minimum, approximately how much total interest will you pay?", options: ["$300", "$600", "$3,000+", "$0"], correct: 2, explanation: { correct: "🎯 Shocking but true!", body: "Minimum payments on $3,000 at 20% APR can cost you <strong>over $3,000 in interest</strong> — doubling what you owe. Always pay more than the minimum!", wrong: "Minimum payments are designed to maximize interest paid." } },
      q2: { qnum: 2, question: "How do you avoid paying ANY interest on a credit card?", options: ["Only use cash", "Pay the full statement balance by the due date", "Never use the card", "Call and ask nicely"], correct: 1, explanation: { correct: "🎯 Exactly!", body: "Pay your full balance each month and you'll never pay a cent in interest. The <strong>grace period</strong> is your best friend.", wrong: "There's a simple rule about when you pay." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Types of loans",
    completionMessage: "You can now spot credit card traps!",
  },

  "loan-types": {
    title: "Types of",
    titleHighlight: "Loans",
    subtitle: "Chapter 4 · Lesson 5",
    storyAvatar: "📝",
    storyName: "Alex, your Financial Guide",
    storyText: "Not all debt is created equal. A mortgage at 6% that builds equity is very different from a payday loan at 400%. Understanding <strong>loan types</strong> helps you borrow smartly — or avoid borrowing altogether.",
    conceptTitle: "Secured vs unsecured",
    concepts: [
      { title: "Secured Loans", body: "Backed by collateral (an asset). Lower interest rates because the lender can take your asset if you don't pay. Examples: mortgages (house), auto loans (car)." },
      { title: "Unsecured Loans", body: "No collateral — based on your creditworthiness. Higher interest rates. Examples: credit cards, personal loans, student loans." },
      { title: "Predatory Lending", body: "Payday loans charge 300-400% APR. A $500 payday loan can cost $75+ in fees for just 2 weeks. Avoid at all costs — use an emergency fund instead." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Why do secured loans typically have lower interest rates?", options: ["Banks are more generous", "They're backed by collateral the lender can seize", "They're only for rich people", "The government subsidizes them"], correct: 1, explanation: { correct: "🎯 Right!", body: "Collateral reduces the lender's risk. If you stop paying your mortgage, they can take the house — so they charge you less interest.", wrong: "Think about what makes the lender feel more secure." } },
      q2: { qnum: 2, question: "A payday loan charges $15 per $100 borrowed for 2 weeks. What's the approximate APR?", options: ["15%", "30%", "150%", "Nearly 400%"], correct: 3, explanation: { correct: "🎯 Yikes!", body: "$15/$100 = 15% per 2 weeks × 26 two-week periods/year ≈ <strong>390% APR</strong>. This is why payday loans are considered predatory.", wrong: "Annualize the 2-week rate — it's much higher than you'd think." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Debt payoff strategies",
    completionMessage: "You can now evaluate any loan offer!",
  },

  "debt-payoff": {
    title: "Debt Payoff",
    titleHighlight: "Strategies",
    subtitle: "Chapter 4 · Lesson 6",
    storyAvatar: "⚔️",
    storyName: "Alex, your Financial Guide",
    storyText: "You've got debt — now let's crush it. There are two proven strategies, and the best one depends on <strong>your personality</strong>. Both work. The key is picking one and sticking with it.",
    conceptTitle: "Avalanche vs Snowball",
    concepts: [
      { title: "Avalanche Method", body: "Pay minimums on everything, then throw extra money at the HIGHEST interest debt first. Saves the most money. Example: Pay off 22% credit card before 5% student loan." },
      { title: "Snowball Method", body: "Pay minimums on everything, then throw extra money at the SMALLEST balance first. Gives quick wins for motivation. Example: Pay off $500 medical bill before $10,000 car loan." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Which debt payoff method saves you the most money in interest?", options: ["Snowball (smallest balance first)", "Avalanche (highest interest first)", "Paying minimums on everything", "Ignoring the debt"], correct: 1, explanation: { correct: "🎯 Correct!", body: "Attacking the highest interest rate first means less total interest paid. Mathematically, avalanche always wins — but snowball's quick wins keep many people motivated.", wrong: "Think about which approach reduces the most costly debt first." } },
      q2: { qnum: 2, question: "You have three debts: $2,000 at 5%, $500 at 18%, and $8,000 at 12%. Using the avalanche method, which do you pay first?", options: ["$2,000 at 5%", "$500 at 18%", "$8,000 at 12%", "Whichever has the largest balance"], correct: 1, explanation: { correct: "🎯 Smart!", body: "Avalanche targets the <strong>highest interest rate</strong> first. The $500 at 18% costs you the most per dollar, so eliminate it first.", wrong: "Avalanche focuses on interest rate, not balance size." } },
    },
    fill: { sentence: "The [blank1] method targets the highest interest rate first, while the [blank2] method targets the smallest balance.", blanks: { blank1: "avalanche", blank2: "snowball" }, wordBank: ["avalanche", "snowball", "compound", "simple", "budget"] },
    steps: stdSteps(2, true),
    completionUnlock: "Credit scores",
    completionMessage: "You have a plan to crush your debt!",
  },

  // ══════════════════════════════════════════════════════════════
  // CREDIT & SCORES
  // ══════════════════════════════════════════════════════════════
  "what-is-credit-score": {
    title: "What is a",
    titleHighlight: "Credit Score?",
    subtitle: "Chapter 5 · Lesson 1",
    storyAvatar: "💳",
    storyName: "Alex, your Financial Guide",
    storyText: "Your credit score is a three-digit number that can save — or cost — you <strong>hundreds of thousands of dollars</strong> over your lifetime. It affects your ability to rent apartments, get loans, and even land certain jobs.",
    conceptTitle: "Your financial reputation",
    concepts: [
      { title: "The Range", body: "FICO scores range from 300-850. 670+ is 'good,' 740+ is 'very good,' 800+ is 'exceptional.' Example: A 760 score gets you a 6.5% mortgage rate; a 620 score gets 8.5%." },
      { title: "Real-World Impact", body: "On a $300,000 30-year mortgage: 6.5% = $1,896/month. 8.5% = $2,306/month. That's $410/month more — or $147,600 over the life of the loan." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What credit score range is considered 'good'?", options: ["300-500", "500-600", "670-739", "850+"], correct: 2, explanation: { correct: "🎯 Right!", body: "670-739 is considered 'good.' Above 740 is 'very good' and 800+ is 'exceptional.' Most favorable rates start around 740.", wrong: "FICO scores range from 300-850." } },
      q2: { qnum: 2, question: "How much extra could a low credit score cost you on a $300,000 mortgage over 30 years?", options: ["A few hundred dollars", "A few thousand dollars", "Over $100,000", "Nothing — credit scores don't affect mortgages"], correct: 2, explanation: { correct: "🎯 Shocking, right?", body: "The difference between a great and poor credit score can cost <strong>$100,000+</strong> in extra interest over a 30-year mortgage. Your score is worth protecting!", wrong: "The difference in interest rates adds up enormously over decades." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "5 factors of your score",
    completionMessage: "You understand what credit scores are!",
  },

  "credit-factors": {
    title: "5 Factors of",
    titleHighlight: "Your Score",
    subtitle: "Chapter 5 · Lesson 2",
    storyAvatar: "📊",
    storyName: "Alex, your Financial Guide",
    storyText: "Your FICO score isn't random — it's calculated from five specific factors. Understanding them gives you the <strong>playbook</strong> to build excellent credit.",
    conceptTitle: "The FICO formula",
    concepts: [
      { title: "Payment History (35%)", body: "The biggest factor. One late payment can drop your score 50-100 points. Set up autopay for at least minimums on everything." },
      { title: "Amounts Owed (30%)", body: "How much of your available credit you're using. Keep credit card utilization below 30% — below 10% is ideal." },
      { title: "Length of History (15%)", body: "Older accounts help. Don't close your oldest credit card even if you don't use it much." },
      { title: "Credit Mix (10%) + New Credit (10%)", body: "Having different types (cards, loans, mortgage) helps slightly. Too many new applications in a short time hurts." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Which factor has the BIGGEST impact on your credit score?", options: ["Credit utilization", "Payment history", "Length of credit history", "Types of credit"], correct: 1, explanation: { correct: "🎯 Correct!", body: "<strong>Payment history is 35%</strong> of your score — the single largest factor. Never miss a payment, even if it's just the minimum.", wrong: "One factor is worth more than a third of your total score." } },
      q2: { qnum: 2, question: "Your credit limit is $5,000 and your balance is $2,500. What's your utilization rate?", options: ["25%", "50%", "75%", "100%"], correct: 1, explanation: { correct: "🎯 Right!", body: "$2,500 ÷ $5,000 = <strong>50%</strong>. That's above the recommended 30%. Try to pay it down to $1,500 or less.", wrong: "Divide your balance by your credit limit." } },
    },
    fill: { sentence: "[blank1] history makes up 35% of your FICO score, and credit [blank2] accounts for 30%.", blanks: { blank1: "Payment", blank2: "utilization" }, wordBank: ["Payment", "utilization", "Income", "savings", "length"] },
    steps: stdSteps(2, true),
    completionUnlock: "Credit utilisation",
    completionMessage: "You know the 5 factors that build your score!",
  },

  "credit-utilisation": {
    title: "Credit",
    titleHighlight: "Utilisation",
    subtitle: "Chapter 5 · Lesson 3",
    storyAvatar: "📏",
    storyName: "Alex, your Financial Guide",
    storyText: "Credit utilization is the second-biggest factor in your score at 30%. It's also the <strong>fastest way to improve your score</strong> — you can see changes in just one billing cycle.",
    conceptTitle: "The 30% rule and beyond",
    concepts: [
      { title: "What It Is", body: "The percentage of your available credit you're using. $1,000 balance on a $5,000 limit = 20% utilization." },
      { title: "Optimal Range", body: "Below 30% is good. Below 10% is excellent. 0% isn't ideal either — lenders want to see you using credit responsibly." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "You have two credit cards: Card A ($3,000 limit, $600 balance) and Card B ($7,000 limit, $700 balance). What's your overall utilization?", options: ["6%", "13%", "20%", "50%"], correct: 1, explanation: { correct: "🎯 Right!", body: "Total balance: $1,300. Total limit: $10,000. $1,300 ÷ $10,000 = <strong>13%</strong>. That's in the excellent range!", wrong: "Add all balances and divide by all limits." } },
      q2: { qnum: 2, question: "What's the fastest way to lower your credit utilization?", options: ["Open 10 new cards", "Pay down your existing balances", "Close unused cards", "Stop using credit entirely"], correct: 1, explanation: { correct: "🎯 Smart!", body: "Paying down balances immediately lowers your utilization. This can boost your score within <strong>one billing cycle</strong>.", wrong: "Think about what changes the balance-to-limit ratio." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Building credit from zero",
    completionMessage: "You've mastered credit utilization!",
  },

  "building-credit": {
    title: "Building Credit",
    titleHighlight: "From Zero",
    subtitle: "Chapter 5 · Lesson 4",
    storyAvatar: "🌱",
    storyName: "Alex, your Financial Guide",
    storyText: "No credit history? That's actually a common problem — you need credit to get credit. But there are <strong>proven strategies</strong> to build your score from scratch.",
    conceptTitle: "Starter strategies",
    concepts: [
      { title: "Secured Credit Card", body: "Put down a $200-500 deposit that becomes your credit limit. Use it for small purchases, pay in full monthly. After 6-12 months, you'll qualify for regular cards." },
      { title: "Authorized User", body: "Ask a family member with good credit to add you to their card. Their positive history helps build yours — without you even using the card." },
      { title: "Credit Builder Loans", body: "You 'borrow' $500-1000 that's held in a savings account. Make monthly payments, and when done, you get the money plus a credit history." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What is a secured credit card?", options: ["A card with extra security features", "A card that requires a deposit as collateral", "A card only for secure websites", "A card with a very high limit"], correct: 1, explanation: { correct: "🎯 Right!", body: "You put down a deposit (usually $200-500) that becomes your limit. It's the easiest way to get a credit card with no credit history.", wrong: "The 'secured' refers to a specific requirement to open the card." } },
      q2: { qnum: 2, question: "How can becoming an authorized user help your credit?", options: ["You get free money", "The primary cardholder's positive history appears on your report", "You automatically get a high credit score", "It doesn't help at all"], correct: 1, explanation: { correct: "🎯 Correct!", body: "The card's payment history and age appear on YOUR credit report, helping build your score. Just make sure the primary user has good habits!", wrong: "Think about what gets reported to credit bureaus." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Reading your credit report",
    completionMessage: "You have a plan to build credit!",
  },

  "credit-reports": {
    title: "Reading Your",
    titleHighlight: "Credit Report",
    subtitle: "Chapter 5 · Lesson 5",
    storyAvatar: "🔎",
    storyName: "Alex, your Financial Guide",
    storyText: "1 in 5 credit reports contains an error that could cost you money. You're entitled to a <strong>free report</strong> every year from each bureau. Let's learn how to read yours and spot mistakes.",
    conceptTitle: "Know your report",
    concepts: [
      { title: "Three Bureaus", body: "Equifax, Experian, and TransUnion. Get free reports at AnnualCreditReport.com — the only official free source." },
      { title: "What to Look For", body: "Check for: accounts you didn't open (identity theft), incorrect balances, wrong payment statuses, or accounts that should have fallen off (7+ years old)." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "How often can you get a free credit report from each bureau?", options: ["Never — you have to pay", "Once per year", "Once per month", "Only when you apply for credit"], correct: 1, explanation: { correct: "🎯 Right!", body: "You're entitled to one free report per bureau per year through <strong>AnnualCreditReport.com</strong>. That's 3 free reports total.", wrong: "Federal law guarantees free access at a certain frequency." } },
      q2: { qnum: 2, question: "You find an account on your report that you never opened. What should you do?", options: ["Ignore it — it'll go away", "File a dispute with the credit bureau immediately", "Close all your other accounts", "Pay off the unknown account"], correct: 1, explanation: { correct: "🎯 Important!", body: "An unknown account could be <strong>identity theft</strong>. File a dispute online with the bureau, place a fraud alert, and consider a credit freeze.", wrong: "Unknown accounts are a red flag that needs immediate action." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Why invest?",
    completionMessage: "You can now read and protect your credit!",
  },

  // ══════════════════════════════════════════════════════════════
  // INVESTING
  // ══════════════════════════════════════════════════════════════
  "why-invest": {
    title: "Why",
    titleHighlight: "Invest?",
    subtitle: "Chapter 6 · Lesson 1",
    storyAvatar: "📈",
    storyName: "Alex, your Financial Guide",
    storyText: "If you keep $10,000 in cash under your mattress for 30 years, inflation will erode its purchasing power to about $4,000. <strong>Investing</strong> is how you fight back and grow your wealth over time.",
    conceptTitle: "Beating inflation",
    concepts: [
      { title: "Inflation Eats Cash", body: "At 3% inflation, $100 today buys only $74 worth of stuff in 10 years. Savings accounts barely keep up. Investing historically returns 7-10% annually." },
      { title: "The S&P 500 Track Record", body: "The S&P 500 (top 500 US companies) has averaged about 10% annual return over the last 100 years. Example: $10,000 invested grows to $174,000 in 30 years at 10%." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What's the main reason to invest rather than just save?", options: ["Investing is risk-free", "To beat inflation and grow wealth", "Banks don't want your money", "Investing is required by law"], correct: 1, explanation: { correct: "🎯 Right!", body: "Savings accounts typically earn 4-5% at best. The stock market has historically returned <strong>~10% per year</strong>, significantly outpacing inflation.", wrong: "Think about what happens to cash over long periods." } },
      q2: { qnum: 2, question: "If $10,000 is invested at 10% average annual return for 30 years, approximately how much will it grow to?", options: ["$13,000", "$40,000", "$174,000", "$1,000,000"], correct: 2, explanation: { correct: "🎯 Amazing!", body: "$10,000 × (1.10)³⁰ = approximately <strong>$174,000</strong>. That's the power of compound growth over decades.", wrong: "Compound growth is more powerful than you might think." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Stocks vs Bonds",
    completionMessage: "You understand why investing matters!",
  },

  "stocks-bonds": {
    title: "Stocks vs",
    titleHighlight: "Bonds",
    subtitle: "Chapter 6 · Lesson 2",
    storyAvatar: "⚖️",
    storyName: "Alex, your Financial Guide",
    storyText: "Stocks and bonds are the two core building blocks of investing. Think of stocks as <strong>owning a piece of a company</strong> and bonds as <strong>lending money to a company or government</strong>.",
    conceptTitle: "Core asset classes",
    concepts: [
      { title: "Stocks (Equities)", body: "You own a share of a company. Higher risk, higher potential return. Example: Buying Apple stock means you own a tiny piece of Apple and benefit when it grows." },
      { title: "Bonds (Fixed Income)", body: "You loan money to an entity (government/corporation) and earn interest. Lower risk, lower return. Example: A US Treasury bond is considered one of the safest investments." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Which investment typically has higher long-term returns?", options: ["Bonds", "Stocks", "They're exactly the same", "Savings accounts"], correct: 1, explanation: { correct: "🎯 Correct!", body: "Stocks have historically returned ~10% annually vs ~5% for bonds. The tradeoff is more volatility (ups and downs) along the way.", wrong: "Higher risk generally comes with higher potential returns." } },
      q2: { qnum: 2, question: "When you buy a bond, you are essentially:", options: ["Buying ownership in a company", "Lending money in exchange for interest payments", "Gambling on stock prices", "Buying real estate"], correct: 1, explanation: { correct: "🎯 Right!", body: "A bond is a loan. You lend money, receive regular interest payments, and get your principal back at maturity.", wrong: "Bonds represent a different relationship than stocks." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Index Funds & ETFs",
    completionMessage: "You know the difference between stocks and bonds!",
  },

  "index-funds-etfs": {
    title: "Index Funds &",
    titleHighlight: "ETFs",
    subtitle: "Chapter 6 · Lesson 3",
    storyAvatar: "🧺",
    storyName: "Alex, your Financial Guide",
    storyText: "Trying to pick individual winning stocks is like finding a needle in a haystack. <strong>Index funds</strong> let you buy the entire haystack. They're the single best investment for most people.",
    conceptTitle: "Passive investing",
    concepts: [
      { title: "What Are Index Funds?", body: "Funds that track a market index (like S&P 500). When you buy one share of an S&P 500 index fund, you own a tiny piece of 500 companies at once." },
      { title: "Why They Win", body: "Over 15 years, 92% of actively managed funds UNDERPERFORM the S&P 500. Index funds have low fees (0.03-0.20%) vs active funds (0.50-1.50%)." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What percentage of active fund managers underperform the S&P 500 over 15 years?", options: ["25%", "50%", "75%", "Over 90%"], correct: 3, explanation: { correct: "🎯 Shocking!", body: "Over <strong>92%</strong> of professional fund managers can't beat a simple index fund over 15 years. This is why Warren Buffett recommends index funds for most investors.", wrong: "It's a surprisingly high number." } },
      q2: { qnum: 2, question: "Why do index funds typically have lower fees than actively managed funds?", options: ["They perform worse", "They require less management — just track an index", "They're riskier", "They're smaller"], correct: 1, explanation: { correct: "🎯 Right!", body: "No expensive fund manager needed — the fund simply mirrors an index. Example: A 0.03% fee on $10,000 = $3/year. An active fund at 1% = $100/year.", wrong: "Think about what makes them cheaper to run." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Diversification",
    completionMessage: "You understand index funds!",
  },

  "diversification": {
    title: "Diversification",
    titleHighlight: "",
    subtitle: "Chapter 6 · Lesson 4",
    storyAvatar: "🥚",
    storyName: "Alex, your Financial Guide",
    storyText: "\"Don't put all your eggs in one basket\" — that's diversification in a nutshell. Spreading your investments across different assets reduces risk without necessarily reducing returns.",
    conceptTitle: "Spread your risk",
    concepts: [
      { title: "Why Diversify?", body: "If you own only tech stocks and tech crashes 40%, your portfolio drops 40%. If tech is only 25% of your portfolio, the damage is just 10%." },
      { title: "How to Diversify", body: "Across asset classes (stocks, bonds, real estate), across sectors (tech, healthcare, finance), and across geographies (US, international). An index fund is instant diversification." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Which portfolio is MORE diversified?", options: ["100% in Apple stock", "50% Apple, 50% Microsoft", "An S&P 500 index fund (500 companies)", "50% Bitcoin, 50% Ethereum"], correct: 2, explanation: { correct: "🎯 Right!", body: "An S&P 500 fund spreads your money across <strong>500 different companies</strong> in various sectors. That's real diversification.", wrong: "More different companies/assets = more diversification." } },
      q2: { qnum: 2, question: "If your portfolio is 100% US stocks, what should you consider adding?", options: ["More US stocks", "International stocks and bonds", "Only cryptocurrency", "Nothing — US is enough"], correct: 1, explanation: { correct: "🎯 Smart!", body: "Adding international stocks and bonds gives you exposure to different economies. When the US market dips, international markets may hold steady.", wrong: "Think about geographic diversification." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Compound growth",
    completionMessage: "You understand diversification!",
  },

  "compound-growth": {
    title: "Compound",
    titleHighlight: "Growth",
    subtitle: "Chapter 6 · Lesson 5",
    storyAvatar: "🚀",
    storyName: "Alex, your Financial Guide",
    storyText: "Albert Einstein allegedly called compound interest the \"eighth wonder of the world.\" Whether he said it or not, the math is undeniable: <strong>time is your greatest asset</strong> when investing.",
    conceptTitle: "Time is everything",
    concepts: [
      { title: "The Power of Starting Early", body: "Investor A invests $200/month from age 25-35 (10 years, $24,000 total). Investor B invests $200/month from age 35-65 (30 years, $72,000 total). At 65, Investor A has MORE money despite investing 1/3 as much." },
      { title: "The Numbers", body: "Investor A: $24,000 invested → ~$540,000 at 65. Investor B: $72,000 invested → ~$450,000 at 65. Those 10 extra years of compounding are worth more than the extra $48,000 invested." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What's more important for compound growth — the amount you invest or the time you invest?", options: ["The amount — bigger is better", "The time — start as early as possible", "Neither — it's all about picking stocks", "They're equally important"], correct: 1, explanation: { correct: "🎯 Exactly!", body: "Time is the secret ingredient of compounding. Starting 10 years earlier can be worth more than tripling your monthly contribution.", wrong: "Think about what happens when interest earns interest for decades." } },
      q2: { qnum: 2, question: "Using the Rule of 72, approximately how long does it take to double your money at 8% annual return?", options: ["5 years", "8 years", "9 years", "12 years"], correct: 2, explanation: { correct: "🎯 Right!", body: "72 ÷ 8 = <strong>9 years</strong>. At 8%, your money doubles roughly every 9 years. After 36 years, it's doubled 4 times (16x your original amount)!", wrong: "Divide 72 by the interest rate." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Risk tolerance",
    completionMessage: "You understand the power of compound growth!",
  },

  "risk-tolerance": {
    title: "Risk",
    titleHighlight: "Tolerance",
    subtitle: "Chapter 6 · Lesson 6",
    storyAvatar: "🎢",
    storyName: "Alex, your Financial Guide",
    storyText: "How would you feel if your portfolio dropped 30% in a month? If the answer is \"I'd panic and sell everything\" — that's important information. Your <strong>risk tolerance</strong> should drive your investment strategy.",
    conceptTitle: "Know yourself",
    concepts: [
      { title: "Aggressive (High Risk)", body: "Mostly stocks (80-100%). Higher ups and downs, but historically higher returns. Best for young investors with 20+ years until they need the money." },
      { title: "Conservative (Low Risk)", body: "Mostly bonds and stable assets (60-80% bonds). Smoother ride but lower returns. Best for people near retirement or with low risk tolerance." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "A 25-year-old saving for retirement should generally have:", options: ["100% bonds", "Mostly stocks — they have decades to recover from dips", "All cash in savings", "50/50 stocks and cryptocurrency"], correct: 1, explanation: { correct: "🎯 Right!", body: "With 40+ years until retirement, a young investor can afford to ride out market drops. Time heals volatility.", wrong: "Think about how much time they have before needing the money." } },
      q2: { qnum: 2, question: "The stock market drops 20% in one week. What should most long-term investors do?", options: ["Sell everything immediately", "Nothing — stay the course", "Move everything to bonds", "Short the market"], correct: 1, explanation: { correct: "🎯 Exactly!", body: "Historically, the market has ALWAYS recovered from drops. Selling during a dip locks in losses. The best investors <strong>stay calm and stay invested</strong>.", wrong: "Think long-term — what's the market's track record after drops?" } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Opening a brokerage",
    completionMessage: "You know your risk tolerance!",
  },

  "brokerage-accounts": {
    title: "Opening a",
    titleHighlight: "Brokerage",
    subtitle: "Chapter 6 · Lesson 7",
    storyAvatar: "🏢",
    storyName: "Alex, your Financial Guide",
    storyText: "Ready to start investing? You'll need a <strong>brokerage account</strong> — it's like a bank account, but for investments. Most can be opened online in under 15 minutes.",
    conceptTitle: "Getting started",
    concepts: [
      { title: "What is a Brokerage?", body: "A platform where you buy and sell investments. Popular options: Fidelity, Vanguard, Charles Schwab, Robinhood. Most offer $0 commission trading." },
      { title: "Taxable vs Tax-Advantaged", body: "Brokerage accounts are taxable — you pay taxes on gains. For retirement, use tax-advantaged accounts (401k, IRA) first, then taxable brokerage for additional investing." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What's the recommended order for investing?", options: ["Taxable brokerage first, then 401k", "401k match first, then IRA, then taxable brokerage", "Cryptocurrency first", "All in one account"], correct: 1, explanation: { correct: "🎯 Smart!", body: "Get the free employer match → max out tax-advantaged accounts (IRA/401k) → then invest in taxable brokerage. Tax advantages save you thousands.", wrong: "Think about which accounts give you the most tax benefits." } },
      q2: { qnum: 2, question: "How much do most major brokerages charge in commission per stock trade?", options: ["$0", "$5-10", "$25-50", "1% of trade value"], correct: 0, explanation: { correct: "🎯 Right!", body: "Most major brokerages now offer <strong>$0 commission</strong> trades. Fidelity, Schwab, and Vanguard all eliminated trading fees.", wrong: "The industry has changed dramatically in recent years." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "401(k) basics",
    completionMessage: "You're ready to open a brokerage account!",
  },

  // ══════════════════════════════════════════════════════════════
  // RETIREMENT
  // ══════════════════════════════════════════════════════════════
  "401k-basics": {
    title: "401(k)",
    titleHighlight: "Basics",
    subtitle: "Chapter 7 · Lesson 1",
    storyAvatar: "🏖️",
    storyName: "Alex, your Financial Guide",
    storyText: "A 401(k) is your employer's gift to your future self. Contributions are <strong>pre-tax</strong> (reducing your tax bill today) and many employers <strong>match</strong> your contributions — that's literally free money.",
    conceptTitle: "Employer retirement plans",
    concepts: [
      { title: "How It Works", body: "Money is taken from your paycheck BEFORE taxes. $500/month contribution at 22% tax bracket? It only 'costs' you $390 in take-home pay because you save $110 in taxes." },
      { title: "Employer Match", body: "Many employers match 50-100% of your contributions up to a certain %. Example: 100% match up to 3% of salary. If you earn $50,000 and contribute $1,500, your employer adds $1,500. Don't leave this on the table!" },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Your employer matches 100% of 401(k) contributions up to 4% of your $60,000 salary. If you contribute 4%, how much FREE money do you get?", options: ["$600", "$1,200", "$2,400", "$6,000"], correct: 2, explanation: { correct: "🎯 Right!", body: "4% of $60,000 = $2,400. Your employer matches that 100% = <strong>$2,400 free</strong>. That's a 100% instant return!", wrong: "Calculate 4% of your salary — that's what the employer matches." } },
      q2: { qnum: 2, question: "Why are 401(k) contributions beneficial even before they grow?", options: ["They increase your salary", "They reduce your taxable income today", "They're insured by the government", "They count as an expense deduction"], correct: 1, explanation: { correct: "🎯 Correct!", body: "Pre-tax contributions lower your taxable income. Contributing $6,000/year saves you $1,320 in taxes (at 22% bracket) — money saved TODAY.", wrong: "Think about when taxes are applied." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Roth vs Traditional IRA",
    completionMessage: "You understand 401(k) basics!",
  },

  "roth-vs-traditional": {
    title: "Roth vs",
    titleHighlight: "Traditional IRA",
    subtitle: "Chapter 7 · Lesson 2",
    storyAvatar: "⚖️",
    storyName: "Alex, your Financial Guide",
    storyText: "Tax now or tax later? That's the fundamental question between Roth and Traditional IRAs. The answer depends on whether you think you'll be in a <strong>higher or lower tax bracket</strong> in retirement.",
    conceptTitle: "Two paths to retirement savings",
    concepts: [
      { title: "Traditional IRA", body: "Contribute pre-tax (tax deduction NOW). Pay taxes when you withdraw in retirement. Best if you expect to be in a lower tax bracket later." },
      { title: "Roth IRA", body: "Contribute after-tax (no deduction now). Withdrawals in retirement are TAX-FREE. Best if you expect to be in a higher bracket later — or if you're young and in a low bracket now." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "A 23-year-old in a low tax bracket should generally prefer:", options: ["Traditional IRA — they need the tax break now", "Roth IRA — pay low taxes now, withdraw tax-free later", "Neither — they're too young", "A regular savings account"], correct: 1, explanation: { correct: "🎯 Smart thinking!", body: "Young earners are often in low tax brackets. Pay those low taxes now, and decades of growth + withdrawals are <strong>completely tax-free</strong>.", wrong: "Consider: would you rather pay taxes at a low rate now, or possibly higher rate later?" } },
      q2: { qnum: 2, question: "What makes Roth IRA withdrawals special?", options: ["They're automatically reinvested", "They're tax-free in retirement", "They come with a government bonus", "They have no withdrawal limits"], correct: 1, explanation: { correct: "🎯 Correct!", body: "All qualified Roth withdrawals are <strong>tax-free</strong> — your contributions AND all the growth. That could save you tens of thousands in retirement taxes.", wrong: "Think about the tax treatment of withdrawals." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Employer match",
    completionMessage: "You can choose the right IRA for your situation!",
  },

  "employer-match": {
    title: "Employer Match =",
    titleHighlight: "Free Money",
    subtitle: "Chapter 7 · Lesson 3",
    storyAvatar: "🎁",
    storyName: "Alex, your Financial Guide",
    storyText: "Not contributing enough to get your full employer match is like turning down a raise. It's the <strong>best guaranteed return</strong> you'll ever find — 50-100% instant return on your money.",
    conceptTitle: "Never leave money on the table",
    concepts: [
      { title: "Match Formulas", body: "Common: 50% match up to 6% (you put in 6%, employer adds 3%). Or 100% match up to 3% (you put in 3%, employer doubles it). Always contribute at LEAST enough to max the match." },
      { title: "The Math", body: "On a $50,000 salary with 100% match up to 4%: You contribute $2,000/year, employer adds $2,000 = $4,000 total. Over 30 years at 8% = $453,000. Without the match? Only $226,000." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Your employer offers 50% match up to 6% of salary. You earn $40,000. What's the maximum free money you can get?", options: ["$400", "$1,200", "$2,400", "$4,000"], correct: 1, explanation: { correct: "🎯 Right!", body: "6% of $40,000 = $2,400 (your contribution). 50% match = <strong>$1,200 free</strong> from your employer per year!", wrong: "Calculate 6% of salary, then take 50% of that." } },
      q2: { qnum: 2, question: "What's the minimum you should contribute to your 401(k)?", options: ["Nothing — save on your own", "1% of your salary", "Enough to get the full employer match", "The maximum allowed by law"], correct: 2, explanation: { correct: "🎯 Exactly!", body: "At minimum, contribute enough to get every dollar of employer match. It's a <strong>100% instant return</strong> — better than any investment.", wrong: "Think about what gives you the biggest guaranteed return." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Target-date funds",
    completionMessage: "You'll never leave free money on the table!",
  },

  "target-date-funds": {
    title: "Target-Date",
    titleHighlight: "Funds",
    subtitle: "Chapter 7 · Lesson 4",
    storyAvatar: "📅",
    storyName: "Alex, your Financial Guide",
    storyText: "Don't know how to pick investments? A target-date fund does it for you. Pick the year closest to when you'll retire, invest, and the fund <strong>automatically adjusts</strong> over time.",
    conceptTitle: "Set it and forget it",
    concepts: [
      { title: "How They Work", body: "A 2060 target-date fund starts aggressive (mostly stocks) and gradually shifts to conservative (more bonds) as 2060 approaches. All automatic." },
      { title: "The Glide Path", body: "At age 25: maybe 90% stocks, 10% bonds. At age 55: maybe 60% stocks, 40% bonds. At age 65: maybe 40% stocks, 60% bonds. You don't have to do anything." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "A 30-year-old planning to retire at 65 should choose which target-date fund?", options: ["2030 fund", "2040 fund", "2055-2060 fund", "2080 fund"], correct: 2, explanation: { correct: "🎯 Right!", body: "A 30-year-old retiring at 65 retires around 2055-2060. The fund name matches your expected retirement year.", wrong: "Match the fund year to when you plan to retire." } },
      q2: { qnum: 2, question: "As a target-date fund approaches its target year, it:", options: ["Gets riskier with more stocks", "Stays the same forever", "Shifts to more bonds (less risky)", "Converts to cash"], correct: 2, explanation: { correct: "🎯 Correct!", body: "The fund gradually shifts from stocks to bonds — called the 'glide path.' This protects your money as you get closer to needing it.", wrong: "Think about what happens to risk as you approach retirement." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "The power of starting early",
    completionMessage: "You know the simplest way to invest for retirement!",
  },

  "early-start": {
    title: "The Power of",
    titleHighlight: "Starting Early",
    subtitle: "Chapter 7 · Lesson 5",
    storyAvatar: "⏰",
    storyName: "Alex, your Financial Guide",
    storyText: "This lesson will change how you think about time and money. Starting to invest at 25 vs 35 can mean the difference between <strong>retiring comfortably and struggling</strong>. The math is shocking.",
    conceptTitle: "Every year counts",
    concepts: [
      { title: "The $200/Month Experiment", body: "Start at 25, invest $200/month until 65 at 8% return = $702,000. Start at 35 with the same? $298,000. Starting 10 years earlier nets $404,000 more." },
      { title: "Why It Works", body: "The money invested earliest has the most time to compound. Your first $200 has 40 years to grow. At 8%, it becomes $4,344. The same $200 invested 10 years later? Only $2,012." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Starting to invest at 25 vs 35 (same monthly amount, same return), approximately how much more could you have at 65?", options: ["About 10% more", "About 50% more", "More than double", "No difference"], correct: 2, explanation: { correct: "🎯 Shocking!", body: "At $200/month and 8% return: Starting at 25 = $702,000. Starting at 35 = $298,000. That's <strong>more than double</strong> from just 10 extra years.", wrong: "Compound growth makes early years incredibly valuable." } },
      q2: { qnum: 2, question: "What's the single most important thing a 20-something can do for their financial future?", options: ["Pick the perfect stocks", "Wait until they earn more to start investing", "Start investing now, even small amounts", "Focus only on paying off student loans"], correct: 2, explanation: { correct: "🎯 Exactly!", body: "Even $50/month at 22 is more powerful than $500/month at 35 due to compounding. <strong>Start now. Start small. Just start.</strong>", wrong: "Think about what matters most with compound growth." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Tax brackets",
    completionMessage: "You'll never delay investing again!",
  },

  // ══════════════════════════════════════════════════════════════
  // TAXES
  // ══════════════════════════════════════════════════════════════
  "tax-brackets": {
    title: "Tax Brackets",
    titleHighlight: "Explained",
    subtitle: "Chapter 8 · Lesson 1",
    storyAvatar: "🧾",
    storyName: "Alex, your Financial Guide",
    storyText: "\"I don't want a raise because it'll put me in a higher tax bracket!\" — one of the biggest financial myths. Higher brackets only tax the income <strong>above the threshold</strong>, not all your income.",
    conceptTitle: "Progressive taxation",
    concepts: [
      { title: "How Brackets Work", body: "2024 example: First $11,600 taxed at 10%. $11,601-$47,150 taxed at 12%. $47,151-$100,525 at 22%. If you earn $50,000, only $2,850 is taxed at 22% — NOT all $50,000." },
      { title: "Marginal vs Effective Rate", body: "Your marginal rate is the bracket your last dollar falls in. Your effective rate is what you actually pay overall. Earning $50,000? Marginal rate: 22%. Effective rate: ~13%. You never pay 22% on everything." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "If you earn $50,000 and the 22% bracket starts at $47,151, how much of your income is taxed at 22%?", options: ["All $50,000", "$47,151", "$2,849", "$0"], correct: 2, explanation: { correct: "🎯 Exactly!", body: "Only $50,000 - $47,151 = <strong>$2,849</strong> is taxed at 22%. The rest is taxed at lower rates. You should ALWAYS take a raise!", wrong: "Only the income ABOVE the bracket threshold is taxed at the higher rate." } },
      q2: { qnum: 2, question: "A friend says 'I don't want a raise because I'll pay more in taxes.' Are they right?", options: ["Yes — a raise could make them lose money", "No — only the additional income is taxed at the higher rate", "It depends on the state", "Tax brackets don't apply to raises"], correct: 1, explanation: { correct: "🎯 Myth busted!", body: "A raise ALWAYS increases your take-home pay. If you go from $47,000 to $50,000, only the extra $3,000 sees the higher rate. You always end up with more money.", wrong: "Think about how progressive taxation works." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Deductions vs Credits",
    completionMessage: "You'll never fear tax brackets again!",
  },

  "deductions-credits": {
    title: "Deductions vs",
    titleHighlight: "Credits",
    subtitle: "Chapter 8 · Lesson 2",
    storyAvatar: "💰",
    storyName: "Alex, your Financial Guide",
    storyText: "Both reduce your taxes, but in very different ways. A <strong>deduction</strong> reduces your taxable income. A <strong>credit</strong> reduces your actual tax bill dollar-for-dollar. Credits are almost always more valuable.",
    conceptTitle: "Two ways to save on taxes",
    concepts: [
      { title: "Tax Deductions", body: "Reduce your TAXABLE INCOME. A $1,000 deduction at a 22% bracket saves you $220 in taxes. Examples: student loan interest, mortgage interest, charitable donations." },
      { title: "Tax Credits", body: "Reduce your TAX BILL directly. A $1,000 credit saves you exactly $1,000 in taxes regardless of bracket. Examples: education credits, child tax credit, EV credit." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "You're in the 22% tax bracket. Which saves you more: a $1,000 deduction or a $1,000 credit?", options: ["$1,000 deduction — saves $1,000", "$1,000 credit — saves $1,000", "They save the same amount", "Neither saves money"], correct: 1, explanation: { correct: "🎯 Right!", body: "The deduction saves 22% of $1,000 = $220. The credit saves the full <strong>$1,000</strong>. Credits are dollar-for-dollar savings!", wrong: "Think about how each one reduces your taxes." } },
      q2: { qnum: 2, question: "The standard deduction for a single filer in 2024 is $14,600. What does this mean?", options: ["You get $14,600 back from the IRS", "Your first $14,600 of income isn't taxed", "You owe $14,600 less in taxes", "You can earn $14,600 tax-free from investments"], correct: 1, explanation: { correct: "🎯 Correct!", body: "The standard deduction means your first $14,600 of income is <strong>not taxed</strong>. If you earn $50,000, you're only taxed on $35,400.", wrong: "A deduction reduces taxable income, not the tax itself." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Capital gains tax",
    completionMessage: "You know how to minimize your tax bill!",
  },

  "capital-gains": {
    title: "Capital",
    titleHighlight: "Gains Tax",
    subtitle: "Chapter 8 · Lesson 3",
    storyAvatar: "📊",
    storyName: "Alex, your Financial Guide",
    storyText: "Sold an investment for profit? Uncle Sam wants his cut. But <strong>how long you held it</strong> before selling makes a MASSIVE difference in how much tax you owe.",
    conceptTitle: "Short-term vs long-term",
    concepts: [
      { title: "Short-Term (< 1 year)", body: "Taxed as ordinary income (up to 37%). Example: Buy stock for $1,000 in January, sell for $1,500 in June = $500 gain taxed at your regular income rate." },
      { title: "Long-Term (> 1 year)", body: "Preferential rates: 0%, 15%, or 20% depending on income. Most people pay 15%. Example: Same $500 gain but held 13 months = only $75 in tax vs potentially $185." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "You bought stock for $2,000 and sold it for $3,000 after 14 months. How is the $1,000 gain taxed?", options: ["At your ordinary income rate", "At the long-term capital gains rate (likely 15%)", "It's tax-free after 1 year", "50% tax rate"], correct: 1, explanation: { correct: "🎯 Right!", body: "Held over 1 year = long-term capital gains. Most people pay <strong>15%</strong>, so $1,000 gain × 15% = $150 tax. If you'd sold at 11 months, you might pay $220+ at ordinary rates.", wrong: "The key threshold is whether you held it more or less than 1 year." } },
      q2: { qnum: 2, question: "What's the simplest way to reduce capital gains tax on investments?", options: ["Don't report them", "Hold investments for more than 1 year before selling", "Only invest in tax-free states", "Invest only in bonds"], correct: 1, explanation: { correct: "🎯 Exactly!", body: "Holding for >1 year qualifies for <strong>long-term rates (0-20%)</strong> instead of ordinary income rates (up to 37%). Patience literally saves you money.", wrong: "Think about what triggers the more favorable tax rate." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Tax-advantaged accounts",
    completionMessage: "You understand capital gains tax!",
  },

  "tax-advantaged": {
    title: "Tax-Advantaged",
    titleHighlight: "Accounts",
    subtitle: "Chapter 8 · Lesson 4",
    storyAvatar: "🛡️",
    storyName: "Alex, your Financial Guide",
    storyText: "The government actually WANTS you to save for retirement and healthcare. They offer special accounts with <strong>tax breaks</strong> to encourage it. Using these accounts is one of the most impactful financial moves you can make.",
    conceptTitle: "Accounts with tax superpowers",
    concepts: [
      { title: "401(k) & Traditional IRA", body: "Pre-tax contributions reduce your taxable income NOW. You pay taxes when you withdraw in retirement. 2024 limits: $23,000 (401k), $7,000 (IRA)." },
      { title: "Roth IRA & Roth 401(k)", body: "Contribute after-tax money, but ALL withdrawals (including growth) are tax-free in retirement." },
      { title: "HSA (Health Savings Account)", body: "Triple tax advantage: tax-deductible contributions + tax-free growth + tax-free withdrawals for medical expenses. After 65, it works like a traditional IRA for any expenses." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Which account has a 'triple tax advantage'?", options: ["401(k)", "Roth IRA", "HSA (Health Savings Account)", "Regular brokerage"], correct: 2, explanation: { correct: "🎯 Right!", body: "HSAs offer: 1) Tax deduction on contributions, 2) Tax-free growth, 3) Tax-free withdrawals for medical expenses. It's the most tax-efficient account available.", wrong: "Only one account type gets tax benefits on contributions, growth, AND withdrawals." } },
      q2: { qnum: 2, question: "What's the maximum you can contribute to a Roth IRA in 2024 (if under 50)?", options: ["$3,000", "$7,000", "$23,000", "Unlimited"], correct: 1, explanation: { correct: "🎯 Correct!", body: "The 2024 IRA limit is <strong>$7,000</strong> ($8,000 if over 50). That's $583/month to grow tax-free for decades!", wrong: "IRA limits are lower than 401(k) limits." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Filing your taxes",
    completionMessage: "You know which accounts save you the most on taxes!",
  },

  "filing-basics": {
    title: "Filing Your",
    titleHighlight: "Taxes",
    subtitle: "Chapter 8 · Lesson 5",
    storyAvatar: "📄",
    storyName: "Alex, your Financial Guide",
    storyText: "Tax season doesn't have to be scary. Most people's taxes are actually pretty straightforward. Understanding the basic <strong>forms and process</strong> removes the mystery and helps you avoid costly mistakes.",
    conceptTitle: "The basics of filing",
    concepts: [
      { title: "Key Forms", body: "W-2: Your employer sends this showing your earnings and taxes withheld. 1099: For freelance income, interest, dividends. You need these to file." },
      { title: "Standard vs Itemized Deductions", body: "Standard deduction ($14,600 for singles in 2024) is the easy choice for most people. Only itemize if your deductions (mortgage interest, charity, etc.) exceed the standard." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What does a W-2 form show?", options: ["Your investment gains", "Your earnings and taxes withheld from employment", "Your self-employment income", "Your student loan balance"], correct: 1, explanation: { correct: "🎯 Right!", body: "Your employer sends you a W-2 by January 31st each year showing total earnings, federal/state taxes withheld, and benefits deductions.", wrong: "The W-2 comes from your employer about your job income." } },
      q2: { qnum: 2, question: "When should you itemize deductions instead of taking the standard deduction?", options: ["Always — you save more", "Never — the standard is always better", "Only when your itemized deductions exceed the standard deduction", "Only if you're self-employed"], correct: 2, explanation: { correct: "🎯 Correct!", body: "If your mortgage interest + charity + state taxes + other deductions > $14,600, itemizing saves you more. Otherwise, take the standard deduction.", wrong: "Compare your total deductions to the standard amount." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Renting vs Buying",
    completionMessage: "Tax season is no longer scary!",
  },

  // ══════════════════════════════════════════════════════════════
  // MORTGAGES & HOUSING
  // ══════════════════════════════════════════════════════════════
  "renting-vs-buying": {
    title: "Renting vs",
    titleHighlight: "Buying",
    subtitle: "Chapter 9 · Lesson 1",
    storyAvatar: "🏠",
    storyName: "Alex, your Financial Guide",
    storyText: "\"Renting is throwing money away\" — you've probably heard this. But it's not always true. Sometimes renting is the <strong>smarter financial move</strong>. Let's break down when to rent and when to buy.",
    conceptTitle: "The big decision",
    concepts: [
      { title: "Renting Pros", body: "Flexibility to move, no maintenance costs, lower upfront costs, can invest the difference. Best when: you're not staying 5+ years, market is overpriced, or you value flexibility." },
      { title: "Buying Pros", body: "Building equity, stable housing costs, potential appreciation, tax benefits. Best when: you're staying 5+ years, prices are reasonable, and you have a solid down payment." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "You plan to move to a new city in 2 years. Should you buy or rent?", options: ["Buy — always build equity", "Rent — buying costs won't be recouped in 2 years", "It doesn't matter", "Buy and sell quickly for profit"], correct: 1, explanation: { correct: "🎯 Smart!", body: "Closing costs (3-6% of home price) plus selling costs make buying unprofitable for short stays. On a $300,000 home, that's $18,000+ in transaction costs.", wrong: "Think about the costs of buying and selling in a short timeframe." } },
      q2: { qnum: 2, question: "What does 'building equity' mean when you buy a home?", options: ["Getting cash back from the bank", "The portion of the home you actually own increases as you pay down the mortgage", "Making money from rent", "Tax deductions from homeownership"], correct: 1, explanation: { correct: "🎯 Right!", body: "Each mortgage payment increases your ownership stake. If your home is worth $300,000 and you owe $200,000, you have <strong>$100,000 in equity</strong>.", wrong: "Equity is the difference between what your home is worth and what you owe." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Types of mortgages",
    completionMessage: "You can make an informed rent vs buy decision!",
  },

  "mortgage-types": {
    title: "Types of",
    titleHighlight: "Mortgages",
    subtitle: "Chapter 9 · Lesson 2",
    storyAvatar: "🔑",
    storyName: "Alex, your Financial Guide",
    storyText: "Not all mortgages are created equal. The type you choose affects your monthly payment, total interest paid, and financial flexibility for <strong>decades</strong>.",
    conceptTitle: "Fixed vs adjustable",
    concepts: [
      { title: "Fixed-Rate Mortgage", body: "Interest rate stays the same for the entire loan (15 or 30 years). Your payment never changes. Example: 30-year fixed at 7% on $300,000 = $1,996/month forever." },
      { title: "Adjustable-Rate (ARM)", body: "Lower initial rate that adjusts after a fixed period (e.g., 5/1 ARM = fixed for 5 years, then adjusts yearly). Risky if rates rise. Example: Starts at 5.5%, could jump to 8%+." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Which mortgage type guarantees your monthly payment won't change?", options: ["5/1 ARM", "Fixed-rate mortgage", "Interest-only mortgage", "Variable-rate mortgage"], correct: 1, explanation: { correct: "🎯 Right!", body: "A fixed-rate mortgage locks in your interest rate for the entire loan term. Your principal + interest payment <strong>never changes</strong>.", wrong: "Think about which type has a constant, unchanging rate." } },
      q2: { qnum: 2, question: "Why might someone choose a 15-year mortgage over a 30-year?", options: ["Lower monthly payments", "Pays much less total interest and builds equity faster", "Easier to qualify for", "No down payment required"], correct: 1, explanation: { correct: "🎯 Correct!", body: "A 15-year mortgage at 6.5% on $300,000: total interest = $170,000. 30-year: total interest = $383,000. You save <strong>$213,000</strong> but payments are higher.", wrong: "Shorter term = higher payments but massive interest savings." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Down payments",
    completionMessage: "You understand mortgage types!",
  },

  "down-payments": {
    title: "Down",
    titleHighlight: "Payments",
    subtitle: "Chapter 9 · Lesson 3",
    storyAvatar: "💵",
    storyName: "Alex, your Financial Guide",
    storyText: "The traditional advice is 20% down — but that's $60,000 on a $300,000 home! The good news: you can buy with as little as 3% down. The bad news: there are <strong>tradeoffs</strong>.",
    conceptTitle: "20% and alternatives",
    concepts: [
      { title: "Why 20% Matters", body: "Putting 20% down avoids PMI (Private Mortgage Insurance) — an extra $100-300/month that protects the LENDER, not you. It also means a smaller loan and lower monthly payment." },
      { title: "Low Down Payment Options", body: "FHA loans: 3.5% down. Conventional: 3-5% down. VA loans: 0% down (veterans). Tradeoff: You pay PMI until you reach 20% equity, and your monthly payment is higher." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "What is PMI (Private Mortgage Insurance)?", options: ["Insurance that protects you if your home is damaged", "An extra cost when you put less than 20% down that protects the lender", "A type of homeowners insurance", "A government tax on mortgages"], correct: 1, explanation: { correct: "🎯 Right!", body: "PMI protects the LENDER if you default — it does nothing for you. It costs $100-300+/month and goes away once you have 20% equity.", wrong: "PMI benefits the lender, not the homeowner." } },
      q2: { qnum: 2, question: "On a $250,000 home, how much is a 20% down payment?", options: ["$12,500", "$25,000", "$50,000", "$75,000"], correct: 2, explanation: { correct: "🎯 Right!", body: "$250,000 × 0.20 = <strong>$50,000</strong>. It's a lot, but it avoids PMI and reduces your monthly payment significantly.", wrong: "Calculate 20% of the home price." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Closing costs",
    completionMessage: "You understand down payments!",
  },

  "closing-costs": {
    title: "Closing",
    titleHighlight: "Costs",
    subtitle: "Chapter 9 · Lesson 4",
    storyAvatar: "📋",
    storyName: "Alex, your Financial Guide",
    storyText: "Your down payment isn't the only cash you need at closing. <strong>Closing costs</strong> add another 2-5% of the purchase price. On a $300,000 home, that's $6,000-$15,000 in additional fees you need to plan for.",
    conceptTitle: "Hidden expenses of buying",
    concepts: [
      { title: "What's Included", body: "Loan origination fees, appraisal, title insurance, attorney fees, property taxes, homeowners insurance prepayment. These add up to 2-5% of the home price." },
      { title: "Who Pays What", body: "Buyers typically pay most closing costs, but you can negotiate for the seller to cover some. Some lenders offer 'no closing cost' mortgages — but they roll costs into a higher interest rate." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "Approximately how much should you budget for closing costs on a $300,000 home?", options: ["$500-1,000", "$3,000-6,000", "$6,000-15,000", "$30,000+"], correct: 2, explanation: { correct: "🎯 Right!", body: "2-5% of $300,000 = <strong>$6,000-$15,000</strong>. Always budget for these on top of your down payment!", wrong: "Closing costs are typically 2-5% of the purchase price." } },
      q2: { qnum: 2, question: "A 'no closing cost' mortgage means:", options: ["You truly pay nothing extra", "The costs are rolled into a higher interest rate", "The government pays them", "Closing costs have been eliminated"], correct: 1, explanation: { correct: "🎯 Smart!", body: "There's no free lunch. 'No closing cost' mortgages add the costs to your interest rate, meaning you pay <strong>more over the life of the loan</strong>.", wrong: "Think about where those costs actually go." } },
    },
    steps: stdSteps(2, false),
    completionUnlock: "Building home equity",
    completionMessage: "You know the true cost of buying a home!",
  },

  "home-equity": {
    title: "Building Home",
    titleHighlight: "Equity",
    subtitle: "Chapter 9 · Lesson 5",
    storyAvatar: "📈",
    storyName: "Alex, your Financial Guide",
    storyText: "For most Americans, their home is their single largest asset. Building <strong>equity</strong> — the portion of the home you actually own — is how homeownership builds wealth over time.",
    conceptTitle: "Wealth through ownership",
    concepts: [
      { title: "How Equity Builds", body: "Two ways: 1) Paying down your mortgage (forced savings), 2) Home appreciation (prices going up). Example: Buy at $300,000, pay down $50,000, home appreciates to $350,000 = $100,000 equity." },
      { title: "Using Equity", body: "Home equity loans, HELOCs, or selling to cash out. Equity can fund renovations, education, or retirement. But borrowing against equity means more debt — be cautious." },
    ],
    quizzes: {
      q1: { qnum: 1, question: "You bought a home for $250,000 with $50,000 down. After 5 years, you've paid $20,000 toward principal and the home is worth $280,000. What's your equity?", options: ["$20,000", "$50,000", "$70,000", "$100,000"], correct: 3, explanation: { correct: "🎯 Right!", body: "Down payment ($50,000) + principal paid ($20,000) + appreciation ($30,000) = <strong>$100,000 in equity</strong>. You own a third of the home's value!", wrong: "Add your down payment, principal payments, and any appreciation." } },
      q2: { qnum: 2, question: "What's a HELOC?", options: ["A type of mortgage", "A Home Equity Line of Credit — borrowing against your home equity", "A homeowner's insurance policy", "A government housing program"], correct: 1, explanation: { correct: "🎯 Correct!", body: "A HELOC lets you borrow against your equity like a credit card — useful for renovations or emergencies, but your home is the collateral.", wrong: "It involves accessing the equity in your home." } },
    },
    steps: stdSteps(2, false),
    completionMessage: "You understand how homeownership builds wealth!",
  },
};

// Fallback for unknown lesson IDs
const FALLBACK: LessonData = {
  title: "Financial",
  titleHighlight: "Literacy",
  subtitle: "Lesson",
  storyAvatar: "📚",
  storyName: "Alex, your Financial Guide",
  storyText: "Let's explore an important financial concept that will help you build a stronger financial future.",
  conceptTitle: "Key concepts",
  concepts: [
    { title: "Understanding the Basics", body: "Every financial concept builds on foundational knowledge. Master the basics and the advanced topics become much easier." },
  ],
  quizzes: {
    q1: { qnum: 1, question: "What is the most important financial habit?", options: ["Spending everything you earn", "Living below your means and saving consistently", "Only investing in cryptocurrency", "Avoiding all debt"], correct: 1, explanation: { correct: "🎯 Right!", body: "Consistently spending less than you earn and saving the difference is the foundation of all financial success.", wrong: "Think about what builds wealth over time." } },
  },
  steps: [{ type: "story", id: "story1" }, { type: "concept", id: "concept1" }, { type: "quiz", id: "q1" }],
  completionMessage: "Great job completing this lesson!",
};

export function getLessonData(lessonId: string): LessonData {
  return LESSONS[lessonId] || FALLBACK;
}
