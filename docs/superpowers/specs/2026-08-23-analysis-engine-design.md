# Analysis Engine — Design Spec (Plan 2)

Date: 2026-08-23

## Purpose

Plan 1 (`docs/superpowers/plans/2026-08-22-core-scaffold-local-data.md`)
shipped the local-first scaffold: Dexie schema, 52 seeded models across
6 chart shapes, question capture, and model/question browsing pages.
Every chart component already exists and renders a static worked
example on `/models/[slug]`.

This plan wires up the missing piece: turning a user's question +
chosen model into a **real** LLM-generated analysis, rendered through
the same chart the model already uses for its example.

## Relationship to the original app-wide spec

`docs/superpowers/specs/2026-08-22-decision-copilot-design.md` assumed
Supabase existed from day one (`/api/analyze` loads `prompt_template` +
`output_json_schema` **from Supabase** by `modelId`, provider
recommended Anthropic Claude). Plan 1 shipped local-first only —
models live in the client's Dexie cache, seeded from a static JSON
file; there is no Supabase yet (that's plan 3). This plan adapts to
that reality with two deliberate deviations, both compatible with
plan 3 landing later without rework:

1. **`/api/analyze` is stateless.** It does zero DB lookups. The
   client (which already has the model + question in memory) sends
   the fully-interpolated prompt and the target JSON schema; the route
   just calls the LLM and validates. When Supabase lands in plan 3,
   the route can stay exactly as-is — nothing here depends on where
   the model registry lives.
2. **Provider is Google Gemini Flash, not Anthropic Claude.** Explicit
   user decision for this project. The provider interface stays
   vendor-agnostic per the original spec's intent — swapping providers
   later means writing one new class, not touching the route.

## Out of scope (unchanged from plan 1's "What's Next")

Auth, Supabase, cross-device sync, `/settings` — all plan 3. No
multi-provider config/registry — single `GeminiProvider` behind a
one-method interface.

## Architecture

```
Client (question page, browser)
  │  user expands a model card, clicks "Analyze"
  │  interpolates model.promptTemplate ({{question}} → question.text)
  ▼
POST /api/analyze  { promptTemplate, outputJsonSchema }
  │
  ▼
SvelteKit +server.ts (Cloudflare Pages Function) — stateless
  │  calls GeminiProvider.generateJson(promptTemplate, outputJsonSchema)
  │  validates response against outputJsonSchema with ajv
  │  on validation failure: retry once, then 502
  ▼
200 { resultJson }  →  client calls createAnalysis(questionId, modelId, resultJson)
  →  Dexie `analyses` table  →  chart re-renders with real data
```

Server never touches Dexie and never sees `Question`/`Analysis`
types — it's a pure `(prompt, schema) -> validated json` function
wrapped in an HTTP route. This makes it trivially unit-testable
without mocking IndexedDB.

## Backend

### Provider interface — `src/lib/server/llm/provider.ts`

```ts
export interface LlmProvider {
	generateJson(prompt: string, schema: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

`GeminiProvider` (`src/lib/server/llm/gemini.ts`) implements it:
POSTs to
`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`
with `X-goog-api-key` header, body:

```json
{
	"contents": [{ "parts": [{ "text": "<prompt>" }] }],
	"generationConfig": {
		"responseMimeType": "application/json",
		"responseSchema": "<the model's outputJsonSchema, passed through as-is>"
	}
}
```

All 52 current seed schemas use only `type`, `properties`, `items`,
`required`, `enum`, `minItems`/`maxItems`, `minimum`/`maximum` — all
within Gemini's supported schema subset, so the schema is forwarded
unmodified (no stripping/translation layer). Response JSON comes back
in `candidates[0].content.parts[0].text`; provider `JSON.parse`s it and
returns the object (parse errors count as a failed attempt, same as a
validation failure — see retry below).

### Route — `src/routes/api/analyze/+server.ts`

- `POST`, body `{ promptTemplate: string, outputJsonSchema: Record<string, unknown> }`.
- Calls `provider.generateJson(...)`.
- Validates result against `outputJsonSchema` with `ajv`.
- On failure (parse error or schema violation): retry once (fresh
  call, same prompt). Second failure → `502 { error: "validation_failed" }`.
- Provider network/timeout error → `502 { error: "provider_unavailable" }`.
- Success → `200 { resultJson }`.
- API key read from `platform.env.GEMINI_API_KEY` (Cloudflare
  binding). `@sveltejs/adapter-cloudflare` ships an `emulate()` hook
  that calls wrangler's `getPlatformProxy()` under plain `vite dev` —
  no `wrangler` CLI invocation needed locally. That proxy reads a
  gitignored `.dev.vars` file in the project root for env vars, so
  local dev is just `npm run dev` plus a `.dev.vars` holding the key.
  `App.Platform.env` needs a type declaration in `src/app.d.ts` (the
  adapter deliberately omits typing `env` itself, to avoid overriding
  a user-supplied type).

## Frontend

### Chart registry — `src/lib/charts/registry.ts`

Extracts the `chartComponent` string → component map that currently
lives inline in `src/routes/models/[slug]/+page.svelte` into a shared
module. Both the model page and the question page import it, so the
6-entry map exists exactly once.

### Analyses store — `src/lib/stores/analyses.ts`

Same shape as the existing `models.ts`/`questions.ts` stores:

```ts
createAnalysis(questionId: string, modelId: string, resultJson: Record<string, unknown>): Promise<Analysis>
listAnalysesForQuestionAndModel(questionId: string, modelId: string): Promise<Analysis[]>  // newest first
```

Queried lazily — only when a model card is expanded on the question
page, not eagerly for the whole page.

### Question page — `src/routes/question/[id]/+page.svelte`

Each model card becomes click-to-expand (accordion; one open at a
time). Expanded panel state machine:

- **No analyses yet:** "Analyze" button.
- **Loading:** button shows spinner/disabled; rest of panel unchanged.
- **Has analyses:** newest result's chart rendered by default, a
  small timestamped list above it (e.g. "Aug 23, 2:14pm") to switch
  between past runs, plus a "Re-analyze" button that runs a fresh
  request and prepends it to the list. Every run is kept — no
  overwrite (confirmed by user).
- **Error** (after the server's own single auto-retry): inline error
  text + "Try again" button — manual, no client-side retry loop.

Request flow on "Analyze"/"Re-analyze": interpolate
`model.promptTemplate` client-side (`{{question}}` → `question.text`)
→ `POST /api/analyze` → on `200`, `createAnalysis` + select the new
result as active; on non-200, show the error state.

## Testing

Matches existing repo conventions (vitest, `fake-indexeddb` for Dexie
stores):

- `gemini.test.ts` — `GeminiProvider` with mocked `fetch` (success
  parse, malformed JSON, non-200 response).
- `analyze.test.ts` (route) — mocked `LlmProvider`, covers: valid
  first try, invalid-then-valid (retry path), invalid-twice (502),
  provider throws (502).
- `validation.test.ts` — `ajv` against a handful of the real 52
  `outputJsonSchema`s (one per chart shape) with valid and invalid
  fixtures.
- `analyses.test.ts` (store) — same `fake-indexeddb` pattern as
  `db.test.ts`/`questions.test.ts`.
- `page.test.ts` additions on the question page — mocked `fetch` for
  the analyze click, expand/collapse, history switching, error +
  retry.
- No real Gemini calls in any automated test — no API spend in CI,
  matching the original app-wide spec's testing principle.

## Self-review

- **Placeholder scan:** none — every interface, route contract, and
  file path above is concrete.
- **Internal consistency:** stateless-route decision is stated once
  in "Relationship to the original spec" and never contradicted later;
  "keep history" (user-confirmed) is applied consistently in both the
  data model (`listAnalysesForQuestionAndModel` returns an array, no
  overwrite) and the UI (history list + re-analyze, not replace).
- **Scope check:** single implementation plan's worth of work — one
  new route, one provider, one store, one page's UI, one shared
  registry extraction. Not decomposing further.
- **Ambiguity check:** "keep history" resolved to *unbounded* history
  (no cap/pruning) — acceptable for a single-user local-first app;
  flagged here explicitly rather than left implicit.
