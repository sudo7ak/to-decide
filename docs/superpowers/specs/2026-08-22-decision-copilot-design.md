# Decision Copilot — Design Spec

Date: 2026-08-22

## Purpose

A local-first personal decision-support app. User writes a question or
doubt they're weighing. They pick a mental model (Eisenhower Matrix,
SWOT, BCG Box, Johari Window, etc.) from a growing library, and an LLM
generates a structured analysis of their question through that model's
lens, rendered as a chart.

The library of models spans four purposes: decision-making, knowing
oneself, knowing others, improving others. ~60 models are targeted
long-term, but the system must support adding models via data (DB
rows), not code, so the library can grow without redeploys.

## Non-goals (v1)

- Not a multi-user product — single owner, optional multi-device sync
  for that one person.
- Not real-time collaboration.
- Not building 60 bespoke chart components — models are grouped by a
  small set of reusable chart shapes.
- Not supporting analysis generation on devices with no network (all
  generation goes through the backend now — see Architecture Decision
  below).

## Architecture

```
SvelteKit app (Cloudflare Pages + Pages Functions)
│
├── Frontend (client, static-served)
│   ├── Dexie/IndexedDB — local-first store: questions, analyses,
│   │   cached copy of the model registry
│   ├── Supabase JS client — Google OAuth login (optional, opt-in),
│   │   triggers sync
│   └── D3.js chart components — a small set of generic renderers,
│       selected per model's output_schema_type
│
├── Backend (Cloudflare Pages Functions, SvelteKit +server.ts routes)
│   ├── POST /api/analyze — { questionText, modelId } → loads the
│   │   model's prompt_template + output_json_schema from Supabase →
│   │   calls the configured LLM provider → validates the response
│   │   against the schema → returns structured JSON
│   └── POST /api/sync — push/pull the user's questions + analyses
│       to/from Supabase, last-write-wins by updated_at
│
└── Supabase (Postgres + Auth)
    ├── models table — canonical model registry (admin-managed),
    │   pulled down to every client's Dexie cache
    ├── questions table — per-user rows, RLS-scoped to auth.uid()
    └── analyses table — per-user rows, RLS-scoped, FK to
        question_id + model_id
```

### Why backend-mediated LLM calls (not local Ollama)

Originally scoped as fully local (Ollama on localhost). Changed because:
1. Static hosts (GitHub Pages) can't run any server process — ruled out.
2. Cross-device sync (decided: full bidirectional, not backup-only)
   means analysis must be generatable from any device, not just the
   one running Ollama.
3. Backend-mediated calls also keep the LLM API key server-side,
   never exposed to the browser.

The app is still "local-first" in the sense that matters here: all
data lives in Dexie by default, works offline for everything except
generating a *new* analysis, and cloud sync is strictly opt-in.

### LLM provider

Pluggable behind a single backend interface (`src/lib/server/llm/`),
selected via environment variable. Ship with one provider implemented
first (Anthropic Claude recommended as the default), but the interface
must not assume any provider-specific request/response shape — model
prompt templates ask for structured JSON output, and the provider
adapter is responsible for getting that JSON back regardless of which
vendor API it's calling.

## Data Model

### `models` (Supabase, canonical; cached in Dexie for offline browsing)

| column | type | notes |
|---|---|---|
| id | uuid | pk |
| slug | text | unique, url-safe |
| name | text | display name |
| category | text | `decision-making` \| `know-self` \| `know-others` \| `improve-others` |
| description | text | shown on `/models/[slug]` |
| when_to_use | text | shown on `/models/[slug]` |
| prompt_template | text | `{{question}}` interpolated; instructs the LLM on exactly what JSON shape to return |
| output_schema_type | text | one of the renderer keys below |
| output_json_schema | jsonb | strict schema the LLM's response must satisfy |
| chart_component | text | which renderer component to mount |
| created_at / updated_at | timestamptz | |

### `questions` (per-user, RLS-scoped)

`id, user_id, text, created_at`

### `analyses` (per-user, RLS-scoped)

`id, question_id (fk), model_id (fk), result_json (jsonb), created_at, updated_at, synced_at`

Dexie mirrors all three tables locally with the same shape (`models` is
read-only cache; `questions`/`analyses` are read-write and are the
source of truth until synced).

## Chart Strategy

Not 60 bespoke D3 charts. ~7 generic renderers, each model maps to
exactly one via `output_schema_type`:

| renderer | shape | example models |
|---|---|---|
| `quadrant2x2` | two axes, four boxes | Eisenhower, BCG Box, Political Compass, Johari Window, Rumsfeld Matrix |
| `radar` | multi-factor scored | SWOT strength scoring, Energy Model |
| `matrix_table` | 2x2 or NxM text grid | SWOT, Feedback Box, Morphological Box |
| `ranked_list` | ordered items w/ weight | Pareto Principle, Long Tail, Choice Overload |
| `flow_diagram` | sequential steps/stages | GROW/Whitmore, Double Loop Learning, Flow Model, Drexler-Sibbet |
| `freeform_narrative` | qualitative text + light viz | Unconscious Thinking, Gap in the Market |
| *(room for one more if a model genuinely doesn't fit)* | | |

Each renderer is a Svelte component wrapping a D3 chart, taking
`result_json` (validated against the model's `output_json_schema`) as
its only input — no per-model branching inside renderers.

## Data Flow

1. User types a question → saved to Dexie immediately (offline-safe).
2. User browses the model list (from Dexie cache; refreshed from
   Supabase `models` table on load when online).
3. User picks a model on that question → `POST /api/analyze`.
4. Backend loads the model's `prompt_template` + `output_json_schema`,
   calls the configured LLM provider, validates the JSON response
   against the schema.
   - Malformed JSON → one retry with a stricter instruction → still
     fails → return an error; frontend shows "analysis failed, retry"
     and never persists invalid data.
   - Provider timeout/down → backend returns 502; frontend offers
     retry; the question itself remains saved regardless.
5. Valid result saved to Dexie, rendered via the matching D3 renderer.
6. If logged in and sync is enabled: background push of the new/changed
   rows to Supabase; pull remote rows newer than local by
   `updated_at`; last-write-wins on conflict.
7. Offline: everything works except step 3 (new analysis) and sync;
   those fail gracefully and are retryable once back online.

## Auth & Sync

- Login is fully optional. The app is complete and useful with no
  account at all — local-only, Dexie-backed.
- Google OAuth via Supabase Auth (not a hand-rolled OAuth flow).
- Sync is an explicit opt-in toggle in `/settings`, off by default.
- Postgres Row Level Security scopes `questions`/`analyses` to
  `auth.uid()`. `models` table is public-read.
- Conflict resolution: last-write-wins by `updated_at`. No CRDT/merge
  logic — acceptable because this is a single-owner, low-concurrency
  workload (one person, a couple of devices), not multi-user collab.

## Pages

- `/` — question composer + list of past questions
- `/question/[id]` — question detail; model picker (cards grouped by
  category); "analyze with this model" per card; past analyses for
  this question with their charts
- `/models` — browse all models, fetched from `models` table/cache
- `/models/[slug]` — generic model explainer page (description,
  when-to-use, example chart), entirely DB-driven — new models appear
  automatically with no code changes
- `/login` — optional Google OAuth via Supabase
- `/settings` — sync toggle, LLM provider/status, data export

## Visual Design

Editorial/journal feel — this is a personal reflection tool, not a
dashboard. Generous whitespace, one accent color per category, charts
as the visual centerpiece rather than chrome. Tailwind CSS +
shadcn-svelte (or Skeleton UI) for base components; D3.js for every
chart (no Chart.js or similar — D3 is a hard requirement).

## Testing

- Unit: LLM-output → `output_json_schema` validation; sync merge logic
  (LWW conflict cases).
- Component: one test per renderer (~7), driven by fixture JSON, no
  real LLM calls.
- E2E (Playwright): ask a question → pick a model → mocked LLM
  response → chart renders.
- LLM calls are mocked in all automated tests — no API spend in CI.

## V1 Seed Scope

Ship with 8 models, one per renderer, spanning all four categories —
proves the DB-driven pattern end to end before investing in the full
60-model library:

1. Eisenhower Matrix — decision-making — `quadrant2x2`
2. SWOT — decision-making — `matrix_table`
3. BCG Box — decision-making — `quadrant2x2`
4. Johari Window — know-self — `quadrant2x2` (or `radar`)
5. GROW / Whitmore — improve-others — `flow_diagram`
6. Pareto Principle — decision-making — `ranked_list`
7. Cognitive Dissonance — know-self — `freeform_narrative`
8. SCAMPER — decision-making — `ranked_list` or `flow_diagram`

Remaining ~52 models from the original list are added later purely by
inserting `models` rows (prompt template + schema + renderer choice) —
no application code changes required. That data-driven extensibility
is the core design goal of the `models` table.
