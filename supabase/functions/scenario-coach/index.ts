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
const VALID_PERSONAS = new Set(["vibe-starter", "builder", "strategist"]);
const VALID_MODES = new Set(["batch", "single"]);

function validateInput(body: any): string | null {
  if (typeof body !== "object" || body === null) return "Invalid request body";
  if (typeof body.persona !== "string" || !VALID_PERSONAS.has(body.persona))
    return "persona must be one of: vibe-starter, builder, strategist";
  if (body.mode !== undefined && !VALID_MODES.has(body.mode))
    return "mode must be 'batch' or 'single'";
  if (body.completedLessons !== undefined) {
    if (!Array.isArray(body.completedLessons)) return "completedLessons must be an array";
    if (body.completedLessons.length > 100) return "completedLessons cannot exceed 100 items";
    if (!body.completedLessons.every((l: any) => typeof l === "string" && l.length <= 50))
      return "each completedLesson must be a string (max 50 chars)";
  }
  if (body.history !== undefined) {
    if (!Array.isArray(body.history)) return "history must be an array";
    if (body.history.length > 20) return "history cannot exceed 20 items";
  }
  return null;
}

// --- Usage limits ---
const LIMITS: Record<string, number> = { scenarios: 1 };

async function checkAndRecordUsage(supabase: any, userId: string, feature: string): Promise<boolean> {
  const { data: isPrem } = await supabase.rpc("is_premium", { _user_id: userId });
  if (isPrem) return true;
  const { data: count } = await supabase.rpc("check_daily_usage", { _user_id: userId, _feature: feature });
  if ((count ?? 0) >= (LIMITS[feature] ?? 1)) return false;
  await supabase.rpc("record_usage", { _user_id: userId, _feature: feature });
  return true;
}

const LESSON_MAP = `
Available lessons the user can take (use these exact IDs when recommending):
MONEY BASICS: what-is-money, income-vs-expenses, needs-vs-wants, saving-basics, financial-goals
BUDGETING: what-is-budget, 50-30-20, zero-based, tracking-expenses, budget-adjustments
BANKING: checking-savings, bank-fees, hysa, online-banking, emergency-fund, direct-deposit
INTEREST & LOANS: what-is-interest, simple-vs-compound, apr-vs-apy, credit-card-traps, loan-types, debt-payoff
CREDIT & SCORES: what-is-credit-score, credit-factors, credit-utilisation, building-credit, credit-reports
INVESTING: why-invest, stocks-bonds, index-funds-etfs, diversification, compound-growth, risk-tolerance, brokerage-accounts
RETIREMENT: 401k-basics, roth-vs-traditional, employer-match, target-date-funds, early-start
TAXES: tax-brackets, deductions-credits, capital-gains, tax-advantaged, filing-taxes
`;

function getPersonaDesc(persona: string) {
  return persona === "vibe-starter"
    ? "a complete beginner (Vibe Starter) who is just starting their financial literacy journey"
    : persona === "builder"
    ? "an intermediate learner (Builder) who knows banking basics but needs to grow in budgeting, credit, and investing"
    : "an advanced learner (Strategist) who understands most concepts but wants to master investing, retirement, and tax optimization";
}

function parseJson(content: string, arrayMode: boolean) {
  let cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = arrayMode ? cleaned.indexOf("[") : cleaned.search(/[\{\[]/);
  const endChar = arrayMode ? "]" : (start !== -1 && cleaned[start] === "[" ? "]" : "}");
  const end = cleaned.lastIndexOf(endChar);
  if (start === -1 || end === -1) throw new Error("No JSON found");
  cleaned = cleaned.substring(start, end + 1);
  cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (c) => c === "\n" || c === "\t" ? c : "");
  return JSON.parse(cleaned);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;
    const { userId, supabase } = auth;

    let body: any;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validationError = validateInput(body);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { persona, history, completedLessons, mode } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const personaDesc = getPersonaDesc(persona);
    const completedStr = completedLessons?.length
      ? `\nLessons they've already completed: ${completedLessons.join(", ")}`
      : "\nThey haven't completed any lessons yet.";

    // ── BATCH MODE ──
    if (mode === "batch") {
      // Server-side usage check
      const allowed = await checkAndRecordUsage(supabase, userId, "scenarios");
      if (!allowed) {
        return new Response(JSON.stringify({ error: "Daily scenario limit reached. Upgrade to Premium for unlimited access." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const batchPrompt = `You are the Scenario Coach — a fun, engaging financial literacy game host. The user is ${personaDesc}.${completedStr}

${LESSON_MAP}

Generate exactly 5 different financial scenario questions. Each should:
- Cover a DIFFERENT topic area (e.g. budgeting, credit, investing, banking, taxes — mix them up)
- Be realistic, conversational, and relatable for 18-30 year olds
- Test practical financial decision-making appropriate to their persona level
- Have 3 answer choices (A, B, C) with one clearly best answer
- Include the correct answer ID and a brief explanation
- Recommend 1-2 specific lessons by exact ID

Return ONLY valid JSON array with this exact structure:
[
  {
    "type": "question",
    "scenario": "The scenario description",
    "choices": [
      {"id": "A", "text": "Choice A"},
      {"id": "B", "text": "Choice B"},
      {"id": "C", "text": "Choice C"}
    ],
    "topic": "Short topic label",
    "correctAnswer": "A",
    "explanation": "Why this is the best choice",
    "lessonRecs": [
      {"id": "lesson-id", "title": "Lesson Title", "reason": "Why this lesson helps"}
    ]
  }
]

IMPORTANT: Return ONLY the JSON array, no markdown code fences, no extra text. Exactly 5 items.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: batchPrompt },
            { role: "user", content: "Generate 5 varied financial scenario questions for me." },
          ],
          max_tokens: 8192,
          temperature: 0.85,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI error:", response.status, t);
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      let parsed;
      try {
        parsed = parseJson(content, true);
      } catch {
        console.error("Failed to parse batch response:", content);
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return new Response(JSON.stringify({ error: "AI returned invalid batch format" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, data: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SINGLE MODE (evaluate an answer) ──
    const systemPrompt = `You are the Scenario Coach — a fun, engaging financial literacy game host. The user is ${personaDesc}.${completedStr}

${LESSON_MAP}

The user has answered a scenario question. Evaluate their answer.

Return ONLY valid JSON with this structure:
{
  "type": "evaluation",
  "correct": "A",
  "chosen": "B",
  "isGood": false,
  "explanation": "Explanation of the answer",
  "lessonRecs": [
    {"id": "lesson-id", "title": "Lesson Title", "reason": "Why this lesson helps"}
  ],
  "encouragement": "A short encouraging message"
}

IMPORTANT: Return ONLY valid JSON, no markdown code fences, no extra text.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 8192,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "AI returned empty response. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed;
    try {
      parsed = parseJson(content, false);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scenario-coach error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
