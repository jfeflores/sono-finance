import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Section {
  title: string;
  content: string;
  example?: string;
  tip?: string;
}

interface Topic {
  id: string;
  icon: string;
  title: string;
  category: string;
  description: string;
  sections: Section[];
}

const CATEGORIES = ["All", "Basics", "Growth", "Planning"] as const;
type Category = (typeof CATEGORIES)[number];

const TOPICS: Topic[] = [
  {
    id: "budgeting", icon: "account_balance_wallet", title: "Budgeting", category: "Basics",
    description: "Learn how to plan and manage your money effectively.",
    sections: [
      { title: "What is a budget?", content: "A budget is a plan for how you'll spend your money each month. It helps you make sure you have enough for essentials while setting aside money for savings and things you enjoy.", example: "If you earn $3,000/month, a budget might allocate $1,500 to needs, $900 to wants, and $600 to savings.", tip: "Start simple — even tracking spending for one week reveals surprising patterns." },
      { title: "The 50/30/20 Rule", content: "A popular guideline: 50% of income goes to needs (rent, food, bills), 30% to wants (entertainment, dining out), and 20% to savings and debt repayment.", example: "On a $4,000 salary: $2,000 for rent/groceries/utilities, $1,200 for fun/shopping, $800 for savings and paying off loans.", tip: "If your needs exceed 50%, focus on reducing the biggest expense first — usually housing." },
      { title: "Zero-Based Budgeting", content: "Every dollar of income is assigned a purpose so that income minus expenses equals zero. This doesn't mean you spend everything — savings and investments count as assignments.", example: "$3,000 income: $1,200 rent + $400 food + $200 transport + $100 subscriptions + $500 savings + $600 other = $0 left unassigned.", tip: "Use an app like YNAB (You Need A Budget) which is built entirely around this method." },
      { title: "Tracking Expenses", content: "Record every purchase for at least one month to understand your spending patterns. Use apps, spreadsheets, or pen and paper — the best method is the one you'll stick with.", example: "After tracking for a month, you might discover you spend $280 on food delivery — more than double what you'd guessed.", tip: "Set a weekly 10-minute 'money date' to review your spending. Consistency beats perfection." },
      { title: "Adjusting Your Budget", content: "A budget isn't set in stone. Review monthly, compare planned vs. actual spending, and adjust for life changes like raises, moves, or new expenses.", example: "You budgeted $300 for groceries but spent $380. Next month, either increase the category to $380 or meal-plan to hit $300.", tip: "When you get a raise, use the 50/50 rule: half to lifestyle, half to savings." },
    ],
  },
  {
    id: "saving", icon: "savings", title: "Saving & Emergency Funds", category: "Basics",
    description: "Build a financial safety net and grow your wealth.",
    sections: [
      { title: "Pay Yourself First", content: "Treat savings like a bill — set aside a fixed amount each payday before spending on anything else. Automating transfers makes this effortless.", example: "Set up an automatic transfer of $200 every payday to your savings account. You'll save $5,200/year without thinking about it.", tip: "Start with just 1% of your income if money is tight — the habit matters more than the amount." },
      { title: "Emergency Fund Basics", content: "Aim for 3–6 months of living expenses in a liquid, easily accessible account. This protects you from unexpected costs like medical bills or job loss.", example: "If your monthly expenses are $2,500, target $7,500–$15,000. Start with a mini goal of $1,000 — that covers most common emergencies like car repairs.", tip: "Keep your emergency fund in a separate bank to reduce the temptation to spend it." },
      { title: "High-Yield Savings Accounts", content: "Online banks often offer interest rates 10–20× higher than traditional banks. Your emergency fund should sit in one of these to earn while it waits.", example: "$10,000 in a traditional bank at 0.01% earns $1/year. In a HYSA at 5% APY, the same $10,000 earns $500/year — that's 500× more.", tip: "Popular HYSAs include Ally, Marcus by Goldman Sachs, and Discover. All are FDIC insured." },
      { title: "Sinking Funds", content: "Set aside small amounts each month for predictable large expenses — car maintenance, holiday gifts, annual subscriptions — so they don't derail your budget.", example: "Christmas costs you $600/year. A sinking fund of $50/month means December doesn't blow up your budget.", tip: "Create separate sinking funds for 3-5 major annual expenses." },
      { title: "The Latte Factor", content: "Small daily expenses add up dramatically over time. Being aware of these micro-expenses helps you make intentional choices about your spending.", example: "$5/day on coffee = $1,825/year. $12/day on lunch = $4,380/year. Combined, that's $6,205 — enough for a nice vacation or a serious investment.", tip: "You don't have to cut everything — just choose which daily luxuries truly bring you joy and cut the rest." },
    ],
  },
  {
    id: "credit", icon: "credit_score", title: "Credit & Debt", category: "Growth",
    description: "Understand credit scores, cards, and managing debt.",
    sections: [
      { title: "How Credit Scores Work", content: "Your FICO score (300–850) is based on payment history (35%), amounts owed (30%), length of history (15%), new credit (10%), and credit mix (10%).", example: "A 760 score gets you a 6.5% mortgage rate. A 620 score gets 8.5%. On a $300,000 loan, that's $410/month more — or $147,600 over 30 years.", tip: "The single most impactful thing you can do: never miss a payment. Set up autopay for at least minimums." },
      { title: "Credit Utilisation", content: "Keep your credit card balances below 30% of your total credit limit. Lower utilisation signals responsible use and boosts your score.", example: "If your credit limit is $10,000, keep your balance under $3,000. Under $1,000 (10%) is even better for your score.", tip: "Pay your balance twice a month to keep utilization low, even if you spend a lot on the card." },
      { title: "Good Debt vs Bad Debt", content: "Good debt (mortgages, student loans) can build wealth or earning power. Bad debt (high-interest credit cards, payday loans) drains your finances with little return.", example: "A $30,000 student loan for a nursing degree (average salary $80,000) is an investment. A $5,000 credit card balance from impulse shopping at 22% APR is wealth destruction.", tip: "If the debt helps you earn more money or build an asset, it's likely 'good' debt." },
      { title: "Debt Payoff Strategies", content: "Avalanche method: pay off highest-interest debt first to save the most money. Snowball method: pay off smallest balances first for quick motivational wins.", example: "Avalanche: You have debts at 22%, 12%, and 5%. Attack the 22% first. Snowball: You have balances of $500, $3,000, and $10,000. Pay off the $500 first for a quick win.", tip: "Both methods work — pick the one that matches your personality." },
      { title: "Credit Card Grace Period", content: "If you pay your full statement balance by the due date, you pay zero interest. The grace period is typically 21-25 days after your statement closes.", example: "Buy $500 on March 1. Statement closes March 15. Due date April 5. Pay $500 by April 5 = $0 interest.", tip: "Treat your credit card like a debit card — only charge what you can pay in full each month." },
    ],
  },
  {
    id: "investing", icon: "trending_up", title: "Investing", category: "Growth",
    description: "Grow your money over time with smart investments.",
    sections: [
      { title: "Why Invest?", content: "Inflation erodes cash value over time. Investing in stocks, bonds, and other assets historically outpaces inflation, growing your purchasing power.", example: "$10,000 in cash loses ~$300/year to 3% inflation. The same $10,000 in an S&P 500 index fund has historically grown ~10%/year.", tip: "You don't need to be rich to start investing. Many brokerages allow you to begin with as little as $1." },
      { title: "Index Funds & ETFs", content: "These funds track a market index (like the S&P 500), offering broad diversification at low cost. They're ideal for beginners and long-term investors.", example: "One share of an S&P 500 ETF (like VOO) gives you ownership in 500 companies including Apple, Microsoft, Amazon, and Google.", tip: "Warren Buffett recommends index funds for most investors. Over 92% of professional fund managers can't beat them over 15 years." },
      { title: "Compound Interest", content: "Earnings on your investments generate their own earnings. Starting early matters more than investing large amounts — time is your greatest asset.", example: "Invest $200/month starting at age 25 at 8% return: $702,000 by age 65. Start at 35 instead: only $298,000.", tip: "The Rule of 72: divide 72 by your return rate to estimate how long it takes to double your money." },
      { title: "Risk & Diversification", content: "Don't put all your eggs in one basket. Spread investments across asset classes, sectors, and geographies to reduce risk.", example: "A diversified portfolio might be: 60% US stocks, 20% international stocks, 15% bonds, 5% REITs.", tip: "Target-date retirement funds offer instant diversification — pick the fund matching your retirement year." },
      { title: "Dollar-Cost Averaging", content: "Invest a fixed amount at regular intervals regardless of market conditions. This reduces the impact of volatility and removes emotion from investing.", example: "Investing $500/month: some months you buy at $50/share (10 shares), some at $40/share (12.5 shares). Over time, your average cost smooths out.", tip: "Set up automatic investments on payday. You'll never try to 'time the market' — which even professionals fail at." },
      { title: "Common Mistakes", content: "Trying to time the market, panic selling during downturns, chasing hot stocks, and paying high fees are the most common investing mistakes.", example: "Missing just the 10 best market days over 20 years cuts your returns in HALF.", tip: "The best investment strategy is one you can stick with. Boring, consistent investing beats exciting, sporadic trading." },
    ],
  },
  {
    id: "retirement", icon: "beach_access", title: "Retirement Planning", category: "Planning",
    description: "Plan ahead so future-you can relax.",
    sections: [
      { title: "401(k) Basics", content: "An employer-sponsored retirement account. Contributions are pre-tax, reducing your taxable income. Many employers match contributions — that's free money.", example: "You earn $60,000 and contribute 4%. Your employer matches 100%. That's $2,400 from you + $2,400 free = $4,800/year.", tip: "Always contribute at least enough to get the full employer match." },
      { title: "Roth vs Traditional IRA", content: "Traditional: tax deduction now, taxed on withdrawal. Roth: no deduction now, but withdrawals in retirement are tax-free.", example: "At 25 earning $40,000 (low bracket), choose Roth — pay small taxes now, withdraw tax-free later.", tip: "Young professionals in low tax brackets almost always benefit more from Roth accounts." },
      { title: "The Power of Starting Early", content: "Someone who invests $200/month from age 25–35 can end up with more at 65 than someone who invests $200/month from 35–65.", example: "Investor A: $24,000 invested over 10 years → ~$540,000 at 65. Investor B: $72,000 invested over 30 years → ~$450,000 at 65.", tip: "If you can only invest $50/month at 22, do it. That $50/month at 22 is worth more than $200/month at 35." },
      { title: "Target-Date Funds", content: "These funds automatically shift from aggressive (stocks) to conservative (bonds) as you approach your target retirement year.", example: "A 2060 Target-Date Fund starts at ~90% stocks/10% bonds and gradually shifts to ~40% stocks/60% bonds by 2060.", tip: "If your 401(k) has a target-date fund, it's often the best single-fund choice for most people." },
      { title: "How Much Do You Need?", content: "A common rule of thumb is 25× your annual expenses. If you spend $40,000/year, you need about $1,000,000 to retire safely (the 4% rule).", example: "The 4% rule: withdraw 4% of your portfolio in year one, then adjust for inflation. $1,000,000 × 4% = $40,000/year.", tip: "Use online retirement calculators to get a personalized number." },
    ],
  },
  {
    id: "taxes", icon: "receipt_long", title: "Taxes", category: "Planning",
    description: "Navigate tax basics and keep more of your earnings.",
    sections: [
      { title: "Tax Brackets Explained", content: "The U.S. uses progressive tax brackets. Moving into a higher bracket only taxes the income above that threshold at the new rate.", example: "If you earn $50,000: First $11,600 taxed at 10%, Next $35,550 at 12%, Last $2,850 at 22%. Effective rate ~12%.", tip: "NEVER turn down a raise because of tax brackets — you always take home more." },
      { title: "Deductions vs Credits", content: "Deductions reduce your taxable income. Credits reduce your actual tax bill dollar-for-dollar. Credits are generally more valuable.", example: "At 22% bracket: A $1,000 deduction saves you $220. A $1,000 credit saves you $1,000.", tip: "Common credits: Earned Income Tax Credit, Child Tax Credit, Education Credits, EV Tax Credit." },
      { title: "Capital Gains Tax", content: "Short-term gains (held < 1 year) are taxed as ordinary income. Long-term gains (held > 1 year) get preferential lower rates.", example: "You buy stock for $5,000 and sell for $8,000. Held 11 months: taxed up to 37%. Held 13 months: taxed at only 15%.", tip: "Before selling an investment, check if waiting a few more weeks would qualify for long-term rates." },
      { title: "Tax-Advantaged Accounts", content: "401(k)s, IRAs, HSAs, and 529 plans offer tax benefits. Maximising contributions to these accounts is one of the most effective tax strategies.", example: "Contributing $23,000 to a 401(k) at a 22% bracket saves you $5,060 in taxes THIS YEAR.", tip: "Max your employer 401(k) match → fund Roth IRA → max HSA → max 401(k). Optimal order for most people." },
      { title: "Filing Basics", content: "Most employees receive a W-2 showing earnings and taxes withheld. Choose the standard deduction ($14,600 for singles in 2024) unless your itemized deductions exceed it.", example: "Your W-2 shows $50,000 earned and $6,000 withheld. After standard deduction, taxable income is $35,400.", tip: "A large refund means you're giving the government a free loan. Adjust your W-4." },
    ],
  },
  {
    id: "banking", icon: "account_balance", title: "Banking & Accounts", category: "Basics",
    description: "Understand bank accounts, fees, and digital tools.",
    sections: [
      { title: "Checking vs Savings", content: "Checking accounts are for everyday spending with unlimited transactions. Savings accounts earn interest but may limit withdrawals.", example: "Use checking for: rent, groceries, bills. Use savings for: emergency fund, vacation fund, down payment savings.", tip: "Keep 1-2 months of expenses in checking as a buffer." },
      { title: "Avoiding Bank Fees", content: "Americans pay $8+ billion in overdraft fees annually. Common fees include overdraft ($35), monthly maintenance ($5-15), and ATM fees ($2-5).", example: "Using an out-of-network ATM twice a week at $3 each = $312/year wasted.", tip: "Set up low-balance alerts, use online banks with no fees, and opt OUT of overdraft 'protection'." },
      { title: "Direct Deposit & Automation", content: "Split your paycheck into multiple accounts automatically. Pay yourself first by routing savings before you can spend.", example: "Set direct deposit to send 80% to checking and 20% to savings. On a $3,000 paycheck, $600 is saved automatically.", tip: "Also automate bill payments to avoid late fees." },
    ],
  },
  {
    id: "housing", icon: "home", title: "Housing & Mortgages", category: "Planning",
    description: "Navigate renting, buying, and homeownership.",
    sections: [
      { title: "Renting vs Buying", content: "Renting offers flexibility and lower upfront costs. Buying builds equity but requires significant capital and commitment.", example: "Staying less than 5 years? Rent — closing costs (3-6%) make buying unprofitable short-term.", tip: "Use the price-to-rent ratio: if home price ÷ annual rent > 20, renting may be smarter." },
      { title: "Down Payments", content: "20% down avoids PMI (Private Mortgage Insurance), but programs exist for as little as 3% down.", example: "On a $300,000 home: 20% down = $60,000 (no PMI). 5% down = $15,000 + ~$200/month PMI.", tip: "FHA loans require only 3.5% down. VA loans (veterans) require 0%." },
      { title: "Fixed vs Adjustable Rates", content: "Fixed-rate mortgages keep the same rate for 15 or 30 years. Adjustable-rate mortgages (ARMs) start lower but can increase.", example: "30-year fixed at 7% on $300,000 = $1,996/month. A 5/1 ARM might start at 5.5% ($1,703/month) but could jump to 8%+.", tip: "If you plan to stay in the home 7+ years, a fixed rate usually wins." },
      { title: "Building Home Equity", content: "Equity is the portion of your home you actually own. It builds through mortgage payments and home appreciation.", example: "Buy for $300,000 with $60,000 down. After 5 years: $30,000 principal paid + $40,000 appreciation = $130,000 equity.", tip: "Extra mortgage payments go directly to principal. Even $100/month extra can save you 5+ years." },
    ],
  },
  {
    id: "generational-wealth", icon: "family_restroom", title: "Generational Wealth", category: "Growth",
    description: "Build lasting wealth that spans generations through trusts, insurance, and tax-advantaged plans.",
    sections: [
      { title: "What is Generational Wealth?", content: "Generational wealth refers to assets passed down from one generation to the next — including money, property, investments, and businesses. Building it requires intentional planning, legal structures, and financial education for your heirs.", example: "A family buys a rental property for $200,000 today. In 30 years it's worth $600,000 and generates $2,000/month in rent — income that can support children and grandchildren.", tip: "The #1 destroyer of generational wealth is lack of financial literacy in the next generation. Teach your kids about money early." },
      { title: "Trusts: Protecting & Transferring Assets", content: "A trust is a legal arrangement where a trustee holds and manages assets for beneficiaries. Unlike a will, trusts avoid probate (court process), offer privacy, and give you control over how and when assets are distributed.", example: "A revocable living trust lets you maintain control of your assets while alive. Upon death, they pass directly to beneficiaries — no court delays, no public record, and often no estate tax complications.", tip: "A basic revocable trust costs $1,000–$3,000 to set up but can save your family tens of thousands in probate costs and months of legal delays." },
      { title: "Life Insurance as a Wealth Tool", content: "Term life insurance provides affordable coverage for a set period (10–30 years), protecting your family during wealth-building years. Whole life insurance builds cash value over time and provides a guaranteed death benefit — functioning as both protection and a savings vehicle.", example: "A 30-year-old buys a $500,000 term policy for ~$30/month. If they pass during the term, the family receives $500,000 tax-free — enough to pay off a mortgage and fund college for two kids.", tip: "Buy term insurance when young (it's cheapest) and invest the savings vs. whole life premiums. But if estate planning is your goal, whole life has unique tax advantages worth exploring with an advisor." },
      { title: "529 Plans: Tax-Free Education Savings", content: "A 529 plan is a state-sponsored investment account designed for education expenses. Contributions grow tax-free, and withdrawals are tax-free when used for qualified education costs (tuition, books, room & board). Since 2024, unused funds can be rolled into a Roth IRA for the beneficiary.", example: "Investing $200/month in a 529 plan from birth at 7% growth = ~$96,000 by age 18. That covers 4 years of in-state tuition at many public universities — and your child graduates debt-free.", tip: "Many states offer tax deductions for 529 contributions. Check your state's plan first, but you can invest in any state's plan. The new Roth IRA rollover rule (up to $35,000) means unused 529 money isn't wasted." },
      { title: "Annuities: Guaranteed Income Streams", content: "An annuity is a contract with an insurance company that provides guaranteed income payments — either immediately or starting at a future date. Fixed annuities offer predictable returns, while variable annuities are tied to market performance.", example: "At age 60, you invest $200,000 in a fixed annuity. Starting at 65, you receive ~$1,200/month for life — guaranteed income that supplements Social Security and ensures you never outlive your money.", tip: "Annuities have high fees and surrender charges. They're best for people who've already maxed out 401(k)s, IRAs, and other tax-advantaged accounts. Never put more than 25-30% of your retirement savings in annuities." },
      { title: "Building a Wealth Transfer Plan", content: "A comprehensive plan combines multiple tools: trusts for asset protection, life insurance for immediate liquidity, 529s for education funding, and annuities for guaranteed income. The key is starting early and reviewing your plan every 3–5 years.", example: "A family wealth plan: Term life insurance ($500K) protects the family now. 529 plans fund education. A revocable trust holds the home and investments. By 50, the couple adds an annuity for retirement income. Total cost to build this structure: ~$5,000 upfront + $300/month in premiums and contributions.", tip: "Meet with a fee-only financial advisor (not commission-based) to build your plan. Look for the CFP® designation. One planning session can save your family hundreds of thousands in taxes and legal fees." },
    ],
  },
];

const CATEGORY_ICONS: Record<Category, string> = {
  All: "apps",
  Basics: "foundation",
  Growth: "trending_up",
  Planning: "calendar_month",
};

const LibraryPage = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return TOPICS.filter(t => {
      const matchCat = category === "All" || t.category === category;
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.sections.some(s => s.title.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [category, search]);

  const openTopic = TOPICS.find(t => t.id === expandedTopic);

  // Topic detail view
  if (openTopic) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setExpandedTopic(null); setExpandedSection(null); }}
            className="w-10 h-10 rounded-xl bg-surface-high border border-border flex items-center justify-center hover:bg-surface-highest transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-foreground text-lg">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-foreground font-extrabold text-lg">{openTopic.title}</h2>
            <p className="text-muted-foreground text-[11px]">{openTopic.sections.length} concepts</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{openTopic.icon}</span>
          </div>
        </div>

        {/* Sections as accordion cards */}
        <div className="space-y-2">
          {openTopic.sections.map((section, j) => {
            const isOpen = expandedSection === j;
            return (
              <motion.div
                key={j}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: j * 0.04 }}
              >
                <button
                  onClick={() => setExpandedSection(isOpen ? null : j)}
                  className={`w-full text-left glass-card rounded-xl p-4 transition-all active:scale-[0.99] ${
                    isOpen ? "border-primary/30 shadow-[0_0_16px_hsl(var(--primary)/0.06)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isOpen ? "bg-primary/15 text-primary" : "bg-surface-high text-muted-foreground"
                    }`}>
                      {j + 1}
                    </div>
                    <h4 className="text-foreground font-bold text-sm flex-1">{section.title}</h4>
                    <span className={`material-symbols-outlined text-muted-foreground text-base transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 space-y-3">
                        <p className="text-muted-foreground text-xs leading-relaxed">{section.content}</p>
                        {section.example && (
                          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">lightbulb</span> Example
                            </div>
                            <p className="text-foreground text-xs leading-relaxed">{section.example}</p>
                          </div>
                        )}
                        {section.tip && (
                          <div className="bg-secondary/5 border border-secondary/10 rounded-xl p-3">
                            <div className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">tips_and_updates</span> Pro Tip
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">{section.tip}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tighter">Financial Library</h2>
        <p className="text-sm text-muted-foreground font-medium mt-0.5">Explore key concepts with real-world examples</p>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">search</span>
        <input
          type="text"
          placeholder="Search topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-surface-high/60 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 ${
              category === cat
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-surface-high/60 text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: category === cat ? "'FILL' 1" : "'FILL' 0" }}>
              {CATEGORY_ICONS[cat]}
            </span>
            {cat}
          </button>
        ))}
      </div>

      {/* Topics grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((topic, i) => (
          <motion.button
            key={topic.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setExpandedTopic(topic.id)}
            className="glass-card rounded-2xl p-4 text-left transition-all active:scale-[0.97] glass-card-hover group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                {topic.icon}
              </span>
            </div>
            <h3 className="text-foreground font-bold text-[13px] leading-tight">{topic.title}</h3>
            <p className="text-muted-foreground text-[10px] mt-1 leading-snug line-clamp-2">{topic.description}</p>
            <div className="flex items-center gap-1 mt-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary">{topic.sections.length} concepts</span>
              <span className="material-symbols-outlined text-primary text-xs">chevron_right</span>
            </div>
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-muted-foreground/30 mb-2">search_off</span>
          <p className="text-muted-foreground text-sm">No topics found</p>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
