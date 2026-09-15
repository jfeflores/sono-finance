# Connect Firecrawl + Upload Project to GitHub

Two separate connections, handled differently:

## 1. Firecrawl connection (powers the advisor search feature)

The `search-advisors` backend function needs a Firecrawl API key, which was not carried over when the project was remixed.

- Open a connect card for the Firecrawl connector so you can create a connection (managed or with your own Firecrawl API key).
- Once linked, the key becomes available to the backend function automatically.
- After linking, check the connection mode and adjust `supabase/functions/search-advisors/index.ts` if needed (new connections call through Lovable's secure relay; older ones call Firecrawl directly — the code must match).
- Redeploy the `search-advisors` function so it picks up the new key, then verify a search works.

## 2. Upload the project to your GitHub account (Git sync)

This step requires your GitHub login and must be done by you in the editor — I can't authorize your GitHub account on your behalf. It takes about a minute:

1. Open the **Plus (+) menu** in the chat input (bottom left) → **GitHub** → **Connect project**.
2. Authorize the Lovable GitHub App when GitHub prompts you.
3. Select the GitHub account or organization for the repository.
4. Click **Create Repository** — your full project code is pushed to a new repo.

After that, everything syncs both ways automatically: changes I make here appear on GitHub, and commits you push to GitHub appear here.

## What you'll end up with

- Advisor search working again (backend has its Firecrawl key).
- A GitHub repo under your account containing the full project, kept in sync.
