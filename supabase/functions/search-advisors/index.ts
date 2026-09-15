import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function authenticateRequest(req: Request): Promise<{ userId: string } | Response> {
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
  return { userId: data.claims.sub as string };
}

// Input validation helpers
function sanitizeString(input: unknown, maxLength: number): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().slice(0, maxLength);
  return trimmed.replace(/[^\w\s,.\-]/g, '');
}

const VALID_TYPES = new Set(['cpa', 'cfp', 'tax', 'debt']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    const location = sanitizeString(body.location, 100);
    if (!location || location.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'A valid location is required (2-100 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const type = typeof body.type === 'string' && VALID_TYPES.has(body.type) ? body.type : null;

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey || !lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typeLabels: Record<string, string> = {
      cpa: 'CPA accountant',
      cfp: 'certified financial planner CFP',
      tax: 'tax advisor tax preparer',
      debt: 'debt counselor credit counseling',
    };
    const typeQuery = type && typeLabels[type] ? typeLabels[type] : 'CPA financial advisor financial planner';
    const query = `${typeQuery} near ${location} reviews phone number`;

    console.log('Searching for advisors:', query);

    const response = await fetch('https://connector-gateway.lovable.dev/firecrawl/v2/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 10,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl search error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Search failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const advisors = (data.data || [])
      .filter((r: any) => r.title && r.url)
      .map((result: any, i: number) => ({
        name: result.title?.replace(/ - .*$/, '').replace(/\|.*$/, '').trim().slice(0, 60) || `Result ${i + 1}`,
        description: result.description || result.markdown?.slice(0, 200) || '',
        url: result.url,
        source: new URL(result.url).hostname.replace('www.', ''),
      }));

    console.log(`Found ${advisors.length} results`);

    return new Response(
      JSON.stringify({ success: true, advisors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching advisors:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to search';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
