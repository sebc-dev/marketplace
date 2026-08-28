# sebc.dev marketplace

Plugin marketplace for [Claude Code](https://claude.com/code) and [Claude Cowork](https://claude.com/cowork).

## Plugins

### [scd-astro](./scd-astro/) `v0.4.1`

Complete Astro 6.x on Cloudflare Workers skill. Rendering modes (SSG, SSR, hybrid, Server Islands), Content Layer, Live Collections, Cloudflare bindings via `cloudflare:workers` (KV, D1, R2, Durable Objects), Zod 4, the Fonts API, `workerd` dev, and breaking-change prevention. 3 slash commands (`/scd-astro:scaffold`, `/scd-astro:audit`, `/scd-astro:debug`).

### [scd-writer](./scd-writer/) `v0.4.0`

Human-first writing workflow in 8 phases, for developer-authors. The human writes and thinks, Claude questions, structures, reviews, and polishes, never generating content on the author's behalf, the human/AI ratio going from 100%/0% at capture to 40%/60% at review and never to 0%/100%. Articles are written in French first, then translated via `/translate`. **One absolute rule sits above every detector threshold: no `—` and no `–` between clauses**, in French or in English, with no sample, channel or genre able to reinstate them. It is a rule about how the character reads in 2026 rather than about whether it is correct, and it is the one marker `/polish` replaces instead of reporting. **15 skills, grouped by the job they do**: the editorial voice and the three axes that vary under it (who speaks, which channel, which article type); two guardrails that redirect a request to outsource the thinking rather than the typing; five AI-slop detectors, from "does the piece say anything at all" down to the words and the shape of the sentences; an arbiter every finding passes through before it is reported, because a detector firing on legitimate writing is the failure mode that matters; and three on-demand skills, French readability by pure counting, on-page editorial SEO, and whether a third-party writing skill can be trusted. 6 slash commands (`/braindump`, `/structure`, `/draft`, `/review`, `/polish`, `/translate`).

### [scd-svelte](./scd-svelte/) `v0.1.1`

Svelte 5 + SvelteKit 2 skill. Runes, components, routing, data loading, state management, hooks, TypeScript, testing, deployment, and ecosystem selection. Complements the Svelte MCP server with architecture decisions and anti-pattern prevention. 4 slash commands (`/scd-svelte:scaffold`, `/scd-svelte:audit`, `/scd-svelte:debug`, `/scd-svelte:migrate`).

### [scd-tauri](./scd-tauri/) `v0.1.1`

Tauri v2 desktop and mobile skill. Architecture, security model (capabilities, permissions, scopes, CSP), IPC bridge (commands, events, channels, state), plugin ecosystem (30+ official plugins), desktop patterns (multi-window, tray, menus, sidecars), mobile (Android, iOS), build pipeline, code signing, and updater. Uses WebFetch for official docs lookup. 3 slash commands (`/scd-tauri:scaffold`, `/scd-tauri:audit`, `/scd-tauri:debug`).

### [scd-flutter](./scd-flutter/) `v0.8.0`

Dart 3.x and Flutter 3.44+, in **seven skills with disjoint trigger scopes** — a question asked by a
developer should load exactly one. `dart-idioms` holds the language and the standard library, and
fires in *any* Dart project, CLI or server included. `flutter-architecture` holds the official guide:
where a file goes, which layer boundary it must not cross, which state mechanism for which scope,
plus desktop packaging. `flutter-runtime` holds what the framework rebuilds, reconciles, lays out
and replays, and what it costs: jank, leaks, `Key` and reconciliation, hot reload, isolates.
`flutter-testing` holds the proof: what to test at which layer, flaky tests, goldens, time control,
driving an interaction down to the pointer. `flutter-data` fills the Repository. `flutter-ui-interaction`
holds interaction and final presentation. `flutter-build-release` goes from source tree to a signed
Android or iOS artifact. Every claim carries its evidence level and confidence; areas without an
authoritative source are marked as such rather than filled in by inference.

### [scd-atlas](./scd-atlas/) `v0.2.0`

Deep-research campaigns on a named target: a techno plugin to author or update, or a **theme** — a
broad question worth several Claude Research sessions, optionally anchored in a repository whose
real state makes the subjects concrete. The pipeline: map the subjects → route each one to research
/ code / mixed → pre-collect canonical URLs, exact versions and whatever the anchor repository
holds → one Claude Research prompt per subject → **the human plays them in Desktop** and drops the
reports back → critical intake and filling of the blind spots Research cannot reach → for a plugin
only, distillation into a skill and its references, then trigger evals. A theme campaign stops
there: its deliverable is the corpus. The subject map carries the campaign's state and survives a
`/clear`. Two skills: `research-prompter` composes Research prompts for any subject, specialised by
domain packs; `campaign` orchestrates and composes nothing itself.
Human-in-the-loop by construction: no session can launch Research. 7 slash commands.

### [scd-sdd](./scd-sdd/) `v2.2.2`

Lean spec-driven cycle, from empty repo to reviewable PR — and the **guards** that stop the agent
from rewriting whatever verifies its own work.

> **`2.0.0` is breaking.** The `1.x` cycle — four foundation phases, `specify → clarify → plan →
> tasks → analyze`, two blocking gates, a journal, EARS notation — is *replaced*, not extended.
> An already-tracked project is taken over by `/scd-sdd:migrate`, and that is the only path: it
ARCHIVES the whole `1.x` tree into `docs/1.x/` — nothing is deleted — and the normal workflow then
rewrites from that archive.

The reason is not taste. **A gate costs at writing time, at review time and at convergence time —
and what it catches is text.** The defects that actually cost are defects in how the agent behaves
*while writing code*: silencing the type checker, neutralising a test, bypassing a hook. No
documentary check sees those, and none ever could. So `2.0.0` doesn't remove rigour — it **moves**
it, from gates to guards. 31 commands → **20**, 21 agents → **15**, 5 foundation documents → **3**,
2 blocking gates → **0**.

**Foundation**, once, in one short conversation: `docs/adr/` (immutable decisions), `docs/ci.md`
(what blocks a PR), `CLAUDE.md` (conventions, Definition of Done, domain glossary). `/scd-sdd:init`
does not interview — it *reads the repo* and asks only what the repo cannot answer. It is
replayable: on an existing `CLAUDE.md` it **revises** section by section and never re-assembles.

**Per feature**: `/scd-sdd:spec` writes a ~40-line spec by synthesising the conversation already
had; `/scd-sdd:tickets` cuts it into **vertical slices**, each carrying its observable criteria and
the tickets that block it. Zero gate, zero verdict, zero normed notation. Validation is two human
gestures and no third: read the spec, arbitrate ticket granularity. A wide refactor is the one
exception to vertical slicing and sequences as expand → migrate in batches → contract.

**Implementation**: `/scd-sdd:run` drives a dynamic workflow of dedicated subagents per ticket —
dedicated branch, `test` mode (red before green, proof is real `0 failed` output) or `observed`
mode (proof is a captured observation), fresh-context review, adversarial finding triage, one
ready-for-review PR per ticket — with stacked-PR anti-orphaning and real parallelism via git
worktrees.

**The guards** are what replaces the gates, and the field evidence is unambiguous: an agent bypassed
pre-commit hooks via `--no-verify`, `git stash` and silent flags across **six consecutive commits**,
despite explicit `CLAUDE.md` rules. Text the agent reads does not constrain it. So: a `PreToolUse`
hook blocks writes to protected **paths** (tests, CI workflows, tooling config); a second one
inspects the **content being written** and blocks the introduction of `@ts-ignore`, `as any`,
`eslint-disable`, `.skip(`, `# noqa`, `--no-verify`; a CI job catches what entered outside a
session. The second layer is the one that matters — it targets a file the agent is perfectly
entitled to edit, which makes it structurally invisible to the first.

**The trace is the deliverable; blocking is only its consequence.** Every attempt writes a line to
`.claude/guard-log.jsonl` — date, tool, file, rule, offending snippet. The question the mechanism
answers is not *was it stopped?* but **did it try?** The perimeter belongs to the project
(`.claude/guards.json`, which the plugin never guesses); the mechanism belongs to the plugin. Three
paths are hard-protected regardless: an agent must be able neither to edit its own leash nor to
erase the record of its attempts.

What the guards do **not** cover is written down rather than implied: a false oracle (no tool knows
intent), a bypass in a form no pattern recognises, and a missing `python3` — under which layers 1
and 2 simply do not run, *without a message*, since a hook that never starts cannot announce
itself. And the reservation that holds for every greppable guard: **suppressing a behaviour may
make it subtler rather than eliminate it.** The escape hatch stays a **human** door — a signed
commit, verified offline against a versioned key registry. The plugin runs no cryptography of its
own: it writes the workflow that verifies it.

State is always **derived** — no state file, no journal. Ticket checkboxes say what is done, the
forge says what is in review, `git log` says what was committed, the guard log says what was
attempted. Exactly one fact escapes all four: a `run` that **blocks** checks nothing and opens no
PR, so it opens a work-item card instead. Work cut mid-flight becomes a **chantier** whose state is
its directory. 20 slash commands, 15 subagents, 7 skills.

⚠️ Written and mechanically verified, **never played end to end**. The open question is the whole
refonte: does the lean cycle produce specs good enough for `/scd-sdd:run` to hold, without the gate
that used to guarantee it?

