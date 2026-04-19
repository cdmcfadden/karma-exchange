# Karma

A reciprocal peer-matching web app. Every user is simultaneously a teacher (in their strength) and a student (in their weakness). AI matches across domains. No money changes hands — the currency is **karma points** (transactional, decaying) plus **karma rank** (cumulative reputation).

**v1 goals**: launch to 100 seed users, prove reciprocity feels real, prove the karma economy stabilizes.

---

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn-style primitives
- **Backend**: Next.js API Routes (Node runtime)
- **Database + auth + realtime**: Supabase (Postgres + pgvector + Auth + RLS + Realtime)
- **Auth**: Phone / SMS via Supabase + Twilio
- **AI**: Claude Sonnet 4.6 (complex reasoning), Claude Haiku 4.5 (fast re-rank & hints), OpenAI `text-embedding-3-small` (matching)
- **Hosting**: Vercel

---

## Setup

### 1. Clone + install

```bash
cd karma-app
pnpm install   # or npm / yarn
```

### 2. Create a Supabase project

1. Sign up at https://supabase.com, create a new project.
2. In the SQL Editor, run each migration in order:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_match_candidates_fn.sql`
   - `supabase/migrations/0003_karma_helpers_and_decay.sql`
   - `supabase/migrations/0004_rls_policies.sql`
3. In **Authentication → Providers**, enable **Phone**. Configure Twilio (see next step).
4. In **Database → Extensions**, ensure `vector` and `pg_cron` are enabled (migrations enable them but double-check).
5. In **Database → Cron (pg_cron)**, create:
   - `karma-monthly-decay`: `0 0 1 * *` → `SELECT public.apply_monthly_decay();`
   - `karma-reciprocity-recalc`: `0 3 * * *` → `SELECT public.recalc_reciprocity_status();`

### 3. Configure Twilio for SMS

1. Create a Twilio account, verify your sender phone, create a Messaging Service.
2. In Supabase dashboard → Authentication → Providers → Phone, enter your Twilio Account SID, Auth Token, and Messaging Service SID.
3. Set OTP length to 6 digits, expiry 60 seconds.
4. Cost estimate: ~$0.008/SMS in the US. Budget ~$50/mo for the 100-user beta.

### 4. Get API keys

- **Supabase**: Project Settings → API → URL + anon key + service_role key
- **Anthropic**: https://console.anthropic.com → API Keys
- **OpenAI**: https://platform.openai.com → API Keys (for embeddings only)

### 5. Environment variables

```bash
cp .env.example .env.local
# Fill in all keys
```

Required keys:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
```

### 6. Run locally

```bash
pnpm dev
# Open http://localhost:3000
```

Sign up with your real phone, complete the Wheelhouse, and you should land in the main app. Create a second account (different phone) to test matching.

---

## Deploying to Vercel

1. Push to a GitHub repo.
2. Import the repo in Vercel.
3. Add all env vars from `.env.local` to Vercel → Project Settings → Environment Variables.
4. Deploy. Set a custom domain (e.g., `karma.app`).
5. Add the production URL to Supabase → Authentication → URL Configuration → Site URL + Redirect URLs.

---

## Key flows

### New user onboarding

1. `/` — phone entry
2. `/onboarding/phone?phone=...` — OTP entry
3. `/onboarding/profile` — display name
4. `/onboarding/wheelhouse` — Claude-assisted skills builder with live preview
5. Land in `/app`

### Main app (`/app`)

Three-pane layout on desktop:
- **Left sidebar**: live recommended matches (debounced 600ms, SSE-free fetch after typing pause)
- **Center**: Claude chat that helps the user articulate their request
- **Right sidebar**: contextual next-step hints (integrations to connect, details to add)

Click a match → request session → session appears in helper's queue → helper accepts → messaging begins → receiver rates on completion → karma transfers.

### Karma economy

- Welcome grant: **500 karma**
- Standard session: **200 karma**
- Express (15 min): **75 karma**
- Deep (90 min): **350 karma**
- 5-star rating bonus: **+50 karma** to helper
- Decay: **2%/mo on balances above 1,000**
- Reciprocity status:
  - **Green** — balanced or giving more than receiving
  - **Amber** — received > given by 3–7 (matching score -30%)
  - **Red** — received > given by 8+ (cannot request new sessions until giving)
  - 14-day grace period before amber/red applies

---

## Architecture notes

- **Matching**: embed request with OpenAI, pgvector `<=>` cosine search over `wheelhouse_skills`, stored procedure `match_candidates` applies reciprocity bonus + rank boost + reciprocity-status penalty. Top 10 sent to Claude Haiku for re-rank with "why this match" blurb. Return top 5.
- **Wheelhouse builder**: Claude Sonnet with tool calling (`extract_skill`, `extract_seek`). Tool calls persisted to DB; Supabase Realtime pushes live updates to the right-side preview.
- **Streaming**: Vercel AI SDK streaming pattern for Claude chats. Plain SSE format in our own `ReadableStream` so we can mix tool call notifications with text chunks.
- **Security**: RLS enforces data access at the DB layer. Service role used only in server-side karma transactions and matching stored procs. Anthropic/OpenAI keys server-side only.

---

## Beta launch checklist

- [ ] Supabase + migrations applied + RLS verified
- [ ] Twilio configured, test SMS received
- [ ] Anthropic + OpenAI keys set; test Claude + embedding calls
- [ ] Cron jobs scheduled (monthly decay, daily reciprocity recalc)
- [ ] Custom domain + HTTPS
- [ ] Sentry or equivalent error tracking wired up
- [ ] Seed 10 internal test users with diverse wheelhouses for cold-start match quality
- [ ] Admin dashboard showing: total karma supply, median balance, velocity, reciprocity distribution (build as a `/admin` route protected by email allowlist or Supabase role)
- [ ] iOS Safari + Android Chrome manual QA
- [ ] Beta invite codes or phone-number allowlist for controlled rollout
- [ ] Brief user-facing FAQ page explaining karma, decay, reciprocity

---

## What's stubbed / known limitations in v1

- Mobile drawer for matches/hints sidebars is responsive-hidden rather than swipeable. Add a `Sheet` from shadcn if you want true drawers on mobile.
- In-app session messaging is API-only (no UI page for `/app/session/[id]`). Quick to add: list `session_messages` with Supabase Realtime subscription.
- No explicit integration OAuth flows — right-sidebar hints link to forms where users paste URLs rather than OAuth. Add Strava/LinkedIn OAuth when needed.
- No rate limiting. Add Upstash Redis + `@upstash/ratelimit` before scaling past 100 users.
- Claude model IDs (`claude-sonnet-4-6`, `claude-haiku-4-5-20251001`) may change; adjust `lib/claude.ts` if so.

---

## Costs at 100 users (rough estimates)

| Item | Monthly cost |
|------|--------------|
| Supabase Pro (if exceeded free tier) | $0–$25 |
| Vercel Hobby (free) or Pro | $0–$20 |
| Twilio SMS (100 signups × 2 OTP) | ~$2 |
| Anthropic (Claude Sonnet + Haiku, ~5k requests) | ~$30–$80 |
| OpenAI embeddings (~50k calls) | ~$2 |
| **Total** | **~$35–$130/mo** |

---

## Project structure

```
karma-app/
├── app/
│   ├── page.tsx                          # Landing (phone entry)
│   ├── onboarding/
│   │   ├── phone/page.tsx                # OTP verification
│   │   ├── profile/page.tsx              # Display name
│   │   └── wheelhouse/page.tsx           # Wheelhouse builder (three-pane)
│   ├── app/
│   │   ├── layout.tsx                    # Profile bar wrapper
│   │   ├── page.tsx                      # Main three-pane dashboard
│   │   └── karma/page.tsx                # Balance + transaction history
│   └── api/
│       ├── karma/welcome-grant/route.ts
│       ├── wheelhouse/
│       │   ├── chat/route.ts             # Streaming Claude + skill extraction
│       │   └── complete/route.ts
│       ├── request/chat/route.ts         # Streaming Claude + request finalization
│       ├── match/route.ts                # Hybrid matching (embed + Claude rerank)
│       ├── hints/route.ts                # Next-step suggestions
│       └── session/
│           ├── create/route.ts
│           ├── accept/route.ts
│           ├── cancel/route.ts
│           ├── complete/route.ts
│           └── message/route.ts
├── components/
│   ├── ui/                               # button, input, textarea primitives
│   ├── ProfileBar.tsx
│   ├── MatchSidebar.tsx
│   ├── HintsSidebar.tsx
│   ├── RequestChat.tsx                   # Main-app center chat
│   ├── WheelhouseChat.tsx                # Onboarding center chat
│   └── WheelhousePreview.tsx             # Live skills sidebar (Realtime)
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   ├── claude.ts
│   ├── embeddings.ts
│   ├── karma.ts                          # Config + transaction helper
│   ├── matching.ts                       # findMatches orchestration
│   ├── utils.ts
│   └── prompts/
│       ├── wheelhouse-builder.ts
│       ├── request-coach.ts
│       ├── match-rerank.ts
│       └── hints-generator.ts
├── supabase/
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       ├── 0002_match_candidates_fn.sql
│       ├── 0003_karma_helpers_and_decay.sql
│       └── 0004_rls_policies.sql
├── middleware.ts                         # Auth middleware
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
