import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return { userId: data.claims.sub as string, supabase };
}

// --- Input validation ---
function validateMessages(messages: unknown): string | null {
  if (!Array.isArray(messages)) return "messages must be an array";
  if (messages.length === 0) return "messages cannot be empty";
  if (messages.length > 50) return "messages cannot exceed 50 items";
  for (const m of messages) {
    if (typeof m !== "object" || m === null) return "each message must be an object";
    if (typeof (m as any).role !== "string" || !["user", "assistant", "system"].includes((m as any).role))
      return "each message must have a valid role (user, assistant, system)";
    if (typeof (m as any).content !== "string") return "each message must have string content";
    if ((m as any).content.length > 10000) return "message content cannot exceed 10000 characters";
  }
  return null;
}

// --- Usage limits ---
const LIMITS: Record<string, number> = { chat: 5 };

async function checkAndRecordUsage(supabase: any, userId: string, feature: string): Promise<boolean> {
  // Check premium
  const { data: isPrem } = await supabase.rpc("is_premium", { _user_id: userId });
  if (isPrem) return true;

  // Check usage count
  const { data: count } = await supabase.rpc("check_daily_usage", { _user_id: userId, _feature: feature });
  if ((count ?? 0) >= (LIMITS[feature] ?? 5)) return false;

  // Record usage
  await supabase.rpc("record_usage", { _user_id: userId, _feature: feature });
  return true;
}

const APP_GUIDE = `
## App Navigation Guide
- **Home Hub**: Quick-action cards, budget snapshot, leaderboard
- **Lessons**: Learning paths on Budgeting, Banking, Credit, Investing, Taxes
- **Dashboard**: Balance, savings, budget categories, transactions, calendar
- **Library**: Reference articles on financial topics
- **Settings**: Profile, theme, premium upgrade

## Your Capabilities (Tools)
You have access to these tools — use them proactively when relevant:
1. **update_budget** — Modify a user's budget category (change limit or reset spent amount)
2. **render_chart** — Show an inline chart (bar, pie, or line) with spending/budget data
3. **project_expenses** — Generate a forward-looking projection of monthly expenses and savings

When users ask you to change their budget, show a chart, analyze trends, or project future costs, USE the appropriate tool. Don't just describe — take action.
`;

const tools = [
  {
    type: "function",
    function: {
      name: "update_budget",
      description: "Update a user's budget category. Can change the budget limit or reset the spent amount.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Budget category name, e.g. 'Food & Dining'" },
          newBudget: { type: "number", description: "New budget limit. Omit to keep current." },
          newSpent: { type: "number", description: "New spent amount. Omit to keep current." },
        },
        required: ["category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "render_chart",
      description: "Render an inline chart for the user showing financial data visually.",
      parameters: {
        type: "object",
        properties: {
          chartType: { type: "string", enum: ["bar", "pie", "line"], description: "Type of chart" },
          title: { type: "string", description: "Chart title" },
          labels: { type: "array", items: { type: "string" }, description: "Data labels" },
          values: { type: "array", items: { type: "number" }, description: "Data values" },
          colors: { type: "array", items: { type: "string" }, description: "Colors for each data point" },
        },
        required: ["chartType", "title", "labels", "values"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "project_expenses",
      description: "Generate a projection of the user's expenses and savings over a number of months.",
      parameters: {
        type: "object",
        properties: {
          months: { type: "number", description: "Number of months to project (1-24)" },
          monthlyIncome: { type: "number", description: "Estimated monthly income" },
          monthlyExpenses: { type: "number", description: "Estimated monthly expenses" },
          currentSavings: { type: "number", description: "Current savings balance" },
          savingsGoal: { type: "number", description: "Savings goal target" },
        },
        required: ["months", "monthlyIncome", "monthlyExpenses", "currentSavings"],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;
    const { userId, supabase } = auth;

    // Parse and validate input
    let body: any;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const msgError = validateMessages(body.messages);
    if (msgError) {
      return new Response(JSON.stringify({ error: msgError }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side usage check
    const allowed = await checkAndRecordUsage(supabase, userId, "chat");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Daily limit reached. Upgrade to Premium for unlimited access." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, dashboardContext } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let contextBlock = "";
    if (dashboardContext && typeof dashboardContext === "object") {
      contextBlock = `\n\nUser's current financial data:\n- Balance: ${dashboardContext.totalBalance}\n- Savings: ${dashboardContext.savingsGoal} of ${dashboardContext.savingsTarget} (${dashboardContext.savingsPercent}%)\n- Net Worth: ${dashboardContext.netWorth}\n- Budgets:\n${(dashboardContext.budgets || []).map((b: any) => `  • ${b.name}: spent ${b.spent} of ${b.total} (${b.percent}% used)`).join("\n")}\n\nUse this data to give personalized, specific insights. Proactively use your tools when discussing budgets or spending.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a semi-agentic personal finance AI assistant. You don't just talk — you take action. You can modify budgets, render charts, and project future expenses using your tools. Be concise, warm, and data-driven. Use markdown formatting. When a user asks about spending or budgets, proactively render a chart. When they ask to change budgets, use update_budget. When they ask about projections or "what if" scenarios, use project_expenses.\n\n${APP_GUIDE}${contextBlock}`,
          },
          ...messages,
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
