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
function validateFinancialData(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return "financialData must be an object";
  const d = data as any;
  if (typeof d.balance !== "number" || d.balance < -1e9 || d.balance > 1e12) return "invalid balance";
  if (typeof d.savingsCurrent !== "number" || d.savingsCurrent < 0) return "invalid savingsCurrent";
  if (typeof d.savingsGoal !== "number" || d.savingsGoal < 0) return "invalid savingsGoal";
  if (typeof d.netWorth !== "number") return "invalid netWorth";
  if (!Array.isArray(d.budgets)) return "budgets must be an array";
  if (d.budgets.length > 20) return "budgets cannot exceed 20 items";
  for (const b of d.budgets) {
    if (typeof b !== "object" || typeof b.name !== "string" || typeof b.spent !== "number" || typeof b.budget !== "number")
      return "each budget must have name (string), spent (number), budget (number)";
    if (b.name.length > 50) return "budget name too long";
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;

    let body: any;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validationError = validateFinancialData(body.financialData);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { financialData } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Based on this user's financial data, generate a concise weekly digest (3-4 sentences max). Be specific with numbers. Include one actionable tip.

Financial Data:
- Balance: $${financialData.balance}
- Savings: $${financialData.savingsCurrent} of $${financialData.savingsGoal} goal (${financialData.savingsPct ?? 0}%)
- Net Worth: $${financialData.netWorth}
- Budget categories: ${(financialData.budgets || []).map((b: any) => `${b.name}: $${b.spent}/$${b.budget} (${b.pct ?? 0}%)`).join(", ")}
- Total budget used: $${financialData.totalSpent ?? 0} of $${financialData.totalBudget ?? 0}
- Days left in month: ${financialData.daysLeft ?? 0}

Respond with ONLY the digest text. No headers, no markdown formatting, no bullet points. Just flowing sentences. Be warm but data-driven.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content: "You are Sono, a personal finance AI. Generate brief, insightful weekly financial digests. Be specific with the user's actual numbers. Keep it to 3-4 sentences maximum.",
            },
            { role: "user", content: prompt },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const digest = data.choices?.[0]?.message?.content || "No digest available.";

    return new Response(JSON.stringify({ digest }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("weekly-digest error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
