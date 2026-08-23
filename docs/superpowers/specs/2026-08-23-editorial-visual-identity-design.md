# Editorial Visual Identity — Design Spec

Date: 2026-08-23

## Purpose

The app works (plan 1 + plan 2 shipped: local-first data layer, 52
models, Gemini-backed analysis, recommendations). The UI is default
Tailwind — white background, slate grays, no typographic identity, no
color beyond two recently-added badge colors. This app is meant to be
an open-source project's front door (README hero, screenshots,
first-impression for visitors) and currently reads as unfinished
rather than considered.

This is a pure visual restyle: no new pages, no new routes, no
behavior changes. Every existing flow, test, and piece of business
logic is untouched — only the CSS/markup that renders them.

## Direction: "Editorial / Field Notes"

Warm, human, considered — the opposite of the default dark-mode
dev-tool look most AI-adjacent OSS projects reach for. Reads as a
publication for thinking clearly, not a technical console. Chosen over
a "Console/Signal" dark-technical alternative specifically to
differentiate from that crowded aesthetic and to match the app's
actual domain (mental models, decision-making — a humanist, editorial
subject, not a systems-engineering one).

## Design Tokens

Defined via Tailwind v4's CSS-first `@theme` block in `src/app.css`
(the project's only global stylesheet, currently just
`@import 'tailwindcss';`) so every page can use plain utility classes
(`bg-bg`, `text-ink`, `border-border`, `text-accent`, etc.) with no
per-component custom CSS.

| Token | Value | Used for |
|---|---|---|
| `--color-bg` | `#FAF6EF` (cream) | page background |
| `--color-surface` | `#FFFFFF` | card backgrounds |
| `--color-ink` | `#1A1815` | primary text (replaces `slate-900`) |
| `--color-ink-muted` | `#6B6459` | secondary text (replaces `slate-400`/`slate-500`) |
| `--color-border` | `#E5DFD3` | hairline borders (replaces `slate-200`/`slate-100`) |
| `--color-accent` | `#C4622D` (rust) | primary buttons, links, active states, "Recommended" badge |
| `--color-accent-moss` | `#5B6E4F` | "Analyzed" badge only — kept a separate hue so the two badges stay visually distinct without one warm/one cool clash |
| `--color-error` | `#A23E2E` (warm red) | error text/buttons — replaces default `red-600`, which reads too cool/generic against the rust accent |

**Type:** Google Fonts `Fraunces` (variable serif) for all headings and
display text; `Inter` for body/UI text. Loaded via `@import url(...)`
in `app.css` (no `app.html` change needed). Fraunces gets real room to
be expressive on the home hero (`text-5xl`+); everywhere else stays
restrained — this is the one place the "bold" in "bold new identity"
shows up structurally, the rest of the app stays quiet.

**Components:**
- Cards: `bg-surface`, `border-border`, `shadow-sm`, `hover:-translate-y-0.5 hover:shadow-md`, `transition duration-200`.
- Buttons: primary = solid `bg-accent text-white`; secondary = `border-border text-ink` outline, both same transition/hover treatment as cards.
- Nav: full-width `border-b border-border` hairline (unchanged structurally, only color/weight changes) instead of today's `border-slate-100`.

**Explicitly unchanged:** all 6 D3 chart components (`src/lib/charts/*.svelte`) — they already went through dedicated design work in a prior pass; re-skinning their internal SVG output is a separate, larger effort than this restyle and isn't needed for them to sit correctly on the new cream/surface background. No dark mode. No new components beyond the token/font setup in `app.css`.

## Page-by-Page Application

- **Home (`/`, `src/routes/+page.svelte`):** hero copy "Think it
  through. Properly." in Fraunces display size + a one-line subhead;
  question input restyled with an accent focus ring; "Ask" button
  becomes solid accent; question list below gets `divide-y
  divide-border` instead of the current plain `border-t`.
- **Model Library (`/models`):** grid cards get the shared card
  treatment (hover lift); category headers restyled (still small-caps
  label, just on the new ink-muted/border tokens rather than slate).
- **Model detail (`/models/[slug]`):** worked-example chart wrapped in
  a `bg-surface border-border` card; "Origin"/"How to apply"/etc.
  section headers get the Fraunces subhead treatment; pros/cons
  two-column layout structure is unchanged.
- **Question list (`/question/[id]`):** card restyle per the token
  table; "Recommended" badge → `text-accent`, "Analyzed" badge →
  `text-accent-moss` (both currently `text-indigo-600`/`text-emerald-600`).
  Grouping/links/data-testids unchanged.
- **Question detail (`/question/[id]/[slug]`):** Analyze/Re-analyze
  button becomes solid accent (currently `bg-slate-900`); history
  timestamp pills get `text-accent` when active instead of
  `text-slate-900`; error banner uses `--color-error` instead of
  `text-red-600`/`border-red-600` so it doesn't visually compete with
  the rust accent used everywhere else.

## Testing

No behavior changes, so no new test cases. Every existing test queries
by visible text or ARIA role (`getByText`, `getByRole`), never by CSS
class — confirmed by reading the current test suite (`page.test.ts`
files across `question/[id]`, `question/[id]/[slug]`, `models/[slug]`,
`models`). Expectation: the full suite (126 tests) stays green
throughout with zero test-file edits. Each page's restyle gets a
`npm run test` + `npm run check` pass before moving to the next; a
red test on a purely-styling change would mean a test is
class-coupled, and that gets fixed as it's found rather than assumed
away.

## Self-review

- **Placeholder scan:** none — every token has a concrete hex value
  and a named usage; every page has concrete before/after class
  changes described.
- **Internal consistency:** the two badge colors (accent vs
  accent-moss) are chosen specifically to not collide, stated once
  here and applied identically on the one page that renders both
  (question list). Error color is chosen specifically not to clash
  with the primary accent, stated once, applied on the one page that
  has an error state (question detail).
- **Scope check:** single implementation plan's worth of work — one
  token/font setup step + five page restyles, no new subsystems, no
  interface changes. Not decomposing further.
- **Ambiguity check:** "chart internals unchanged" resolved explicitly
  (charts keep their own internal colors, only the card they sit in
  changes) rather than left implicit — this was the one place scope
  could quietly creep into a much bigger reskin.
