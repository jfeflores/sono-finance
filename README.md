# Sono Finance

A personal finance learning and budgeting prototype built in 24 hours for a hackathon, with AI assistance and [Lovable](https://lovable.dev).

Sono Finance brings finance lessons, budgeting tools, and an AI assistant into one mobile-focused interface. The idea is to help users learn a concept, practice a financial decision, and apply it to a budget in the same app.

[Open the demo](https://sonofinance.lovable.app)

## Project status

The original application was created for the hackathon. Ongoing maintenance is focused on security updates and API upgrades, with limited feature development.

This is an educational prototype. Several screens include illustrative data or unfinished integrations; the implementation boundaries are described below.

## Features

| Area | What is implemented |
| --- | --- |
| Onboarding | Theme and goal selection, a financial knowledge quiz, and placement into a Vibe Starter, Builder, or Strategist learning persona. |
| Home hub | Shortcuts to app sections, a budget snapshot, learning progress, and illustrative financial forecasts. |
| Dashboard | Editable balance, savings goal, and category budgets, plus expense views, spending visualizations, a cash-flow calendar, and an AI-generated financial digest. |
| Learning | Guided courses covering money basics, budgeting, banking, interest and loans, credit, investing, retirement, taxes, and housing. Lessons include quizzes and interactive exercises. |
| Practice and progress | AI-generated financial scenarios, the Finance Runner quiz game, customizable avatars, XP, badges, and league-style displays. |
| AI assistant | Streaming conversations using dashboard context, inline charts, expense projections, and tool calls that update an existing budget category in the browser. |
| Library and resources | Searchable finance reference content and a location-based advisor search backed by Firecrawl through Lovable's connector gateway. |
| Account and settings | Email/password sign-up and sign-in, password reset, profile editing, light/dark themes, and Google/Apple sign-in integrations through Lovable. |

## Prototype boundaries and data storage

- **Bank connections:** The onboarding bank button saves a local connection flag. Bank linking, transaction imports, and automatic expense tracking are not implemented.
- **Financial data:** Balances, savings, and budgets are entered manually and kept in account-scoped browser session storage. Chat history also uses session storage. These records do not sync to a server or across devices.
- **Learning state:** Persona, completed lessons, avatar choices, and some feature caches use account-scoped local storage. The account cleanup code clears the previous account's scoped data on sign-out or an account change, so this is not durable cloud progress storage.
- **Charts and social displays:** Some spending history, cash-flow dates, forecasts, leaderboard entries, and streak indicators are generated or hardcoded for demonstration. They do not represent bank history or a complete live social system.
- **Premium:** Subscription checks and usage controls exist, but the upgrade button is a placeholder. A payment checkout is not implemented.
- **AI and search:** These features require configured backend functions, provider credentials, and available provider credits. Dashboard context and prompts are sent to the configured services when used.

Supabase provides authentication and database tables for profiles, leaderboard records, subscriptions, and usage logs. The presence of a table does not mean every corresponding screen synchronizes its state to it. The browser theme preference is stored separately from account data.

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React 18, TypeScript, Vite with React SWC |
| Interface | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion, Lucide and Material Symbols |
| Charts and content | Recharts, React Markdown, DOMPurify |
| App infrastructure | React Router, TanStack Query |
| Backend | Supabase Auth, PostgreSQL migrations, Deno Edge Functions |
| AI and search | Lovable AI gateway and Firecrawl through Lovable's connector gateway |
| Development and tests | Bun, Node.js, ESLint, Vitest, Testing Library, jsdom |

## Local development

### Prerequisites

- Git
- Bun, using the committed `bun.lock` as the dependency source of truth
- Node.js 24, the development baseline documented for this project
- Access to a configured Supabase/Lovable backend, or a separate project configured as described in [Backend setup](#backend-setup)

The app requires authentication before showing the main interface. Installing frontend dependencies alone does not provide a working backend.

### 1. Clone and install

```sh
git clone https://github.com/jfeflores/sono-finance.git
cd sono-finance
bun install --frozen-lockfile --ignore-scripts
```

### 2. Configure the frontend

Create a local override from the placeholder template:

```sh
cp .env.example .env.local
```

Set these values in `.env.local` for your backend:

```dotenv
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-backend-host.example
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
```

The client reads the URL and publishable key; the project ID is included in the configuration template. Use a matching URL and public key from the same project. `.env.local` is ignored by Git.

Vite exposes `VITE_*` values to the browser. Keep provider API keys and privileged backend credentials in server-side secret storage.

### 3. Start the app

```sh
bun run dev
```

Open [http://localhost:8080](http://localhost:8080), or the URL Vite prints if that port is occupied. Restart the development server after changing environment variables.

Sign up or sign in, complete onboarding, and open the Dashboard to enter a balance, savings goal, and budgets. Lessons and the Library contain bundled content; AI coaching, digests, and advisor search need the services described below.

## Backend setup

For a separate deployment, configure your own backend before using the app:

1. **Database:** Apply the SQL files in [`supabase/migrations/`](supabase/migrations/) in timestamp order using the [Supabase migration workflow](https://supabase.com/docs/guides/deployment/database-migrations). They define the application's tables, policies, and usage functions. Apply `20261024155821_atomic_account_usage.sql` before deploying the current `chat` and `scenario-coach` handlers.
2. **Authentication:** Enable email/password authentication and configure the [allowed redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) for your frontend origin and `/reset-password` page. Google and Apple sign-in use the Lovable auth integration and require a compatible Lovable/provider configuration.
3. **Functions:** Deploy the four functions below using the [Supabase Edge Function deployment guide](https://supabase.com/docs/guides/functions/deploy). The committed `supabase/config.toml` contains the original project's ID; configure your deployment for your own project.
4. **Secrets and providers:** Configure the required [function environment variables](https://supabase.com/docs/guides/functions/secrets) in the backend. The handlers read `SUPABASE_URL` and `SUPABASE_ANON_KEY` for authenticated Supabase requests, plus the provider secrets listed below.

| Function | Purpose | Provider secrets |
| --- | --- | --- |
| `chat` | Streaming assistant responses, charts, budget tools, and dashboard/forecast insights | `LOVABLE_API_KEY` |
| `scenario-coach` | Financial practice questions and coaching feedback | `LOVABLE_API_KEY` |
| `weekly-digest` | Generate a financial summary from submitted dashboard data | `LOVABLE_API_KEY` |
| `search-advisors` | Search for financial professionals near a supplied location | `LOVABLE_API_KEY`, `FIRECRAWL_API_KEY` |

AI functions currently call Lovable's AI gateway with `google/gemini-3-flash-preview`. Advisor search calls Lovable's Firecrawl connector gateway. Using another provider or a standalone Firecrawl endpoint requires changes to those handlers.

The `chat` handler and scenario batch mode reserve daily usage through the `consume_daily_usage` database function before calling the provider. Other scenario modes and the digest/search handlers have different request paths; these controls should not be read as one uniform quota policy for every endpoint.

## Development commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the Vite development server |
| `bun run build` | Build the frontend into `dist/` |
| `bun run build:dev` | Build using Vite's development mode |
| `bun run preview` | Preview the built frontend locally |
| `bun run lint` | Run ESLint |
| `bun run test` | Run the Vitest suite once |
| `bun run test:watch` | Run Vitest in watch mode |

Run `bun run test` and `bun run build` before publishing changes.

The regression tests cover account-scoped caches, account/session lifetimes, delayed assistant requests, entitlement isolation, and quota-handler admission with mocked providers. They do not call paid services or establish that a deployed database, OAuth setup, or provider integration works end to end.

Node.js 26's native Web Storage can conflict with the jsdom test environment. The existing workaround is:

```sh
NODE_OPTIONS=--no-experimental-webstorage bun run test
```

Use Node.js 24 for the project's documented baseline.

## Repository layout

```text
src/
  pages/                  Main app sections, authentication, and password reset
  components/
    games/                Finance Runner and Scenario Coach
    learn/                Learning paths, avatars, badges, and leagues
    learning/             Lesson viewer and exercise components
    onboarding/           Persona quiz and first-run setup
    ui/                   Shared shadcn/ui components
  data/                   Bundled lesson content
  hooks/                  Shared hooks, including account lifetime handling
  integrations/           Supabase client and Lovable authentication
  lib/                    Account storage, request helpers, and usage controls
  test/                   Test setup and backend-handler regression tests
supabase/
  functions/              Deno Edge Functions and shared usage helper
  migrations/             Database schema and access/usage migrations
public/                   Static assets
```

## Deployment and maintenance

The frontend builds to `dist/` and can be served by a static host. Configure single-page application fallback to `index.html` so direct navigation to `/reset-password` works, and configure the frontend environment variables when building. Backend functions and database migrations are deployed separately.

The project can also be opened in its [Lovable editor](https://lovable.dev/projects/8d966267-eb2f-47bd-87d4-c237389430e8).

For changes, follow [`AGENTS.md`](AGENTS.md): use the Bun lockfile, keep private credentials server-side, and preserve account cleanup behavior. Keep contributions focused on the project's maintenance scope.

## License

Licensed under the [Apache License, Version 2.0](LICENSE). Third-party packages and externally sourced content retain their applicable terms.
