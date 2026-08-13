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

### [scd-atlas](./scd-atlas/) `v0.1.0`

Authoring and updating techno plugins through deep-research campaigns. The pipeline: map the
subjects → route each one to research / code / mixed → pre-collect canonical URLs and exact
versions → one Claude Research prompt per subject → **the human plays them in Desktop** and drops
the reports back → critical intake and filling of the blind spots Research cannot reach →
distillation into a skill and its references → trigger evals. The subject map carries the campaign's
state and survives a `/clear`. Two skills: `research-prompter` composes Research prompts for any
subject, specialised by domain packs; `campaign` orchestrates and composes nothing itself.
Human-in-the-loop by construction: no session can launch Research. 7 slash commands.

### [scd-sdd](./scd-sdd/) `v1.17.0`

Complete spec-driven development cycle, from empty repo to reviewable PR — one plugin, three
chained levels. **Foundation** (once per project): brief → PRD → stack → architecture invariants →
foundational ADRs → CI → CLAUDE.md, by one-question-at-a-time interview, where the `ci` phase makes
deterministic and verifiable *outside the agent* what CLAUDE.md can only advise. **Specs** (once per
feature): specify → clarify → plan → tasks → analyze conformance gate (16 checks), with EARS acceptance
criteria, Kiro backrefs, and review lots (`Rn`) sized so a human can actually review each one.
**Implementation** (one lot at a time): a dynamic workflow orchestrating 21 dedicated subagents —
dedicated branch, verification per the lot's declared mode (TDD by default, else test-after /
check / inherent), fresh-context code review, adversarial finding triage, PR description as a
review artifact, one ready-for-review PR per lot — with stacked-PR anti-orphaning and real
parallelism via git worktrees.

The `ci` phase derives its checks from a grid of five failure modes rather than a list of tools:
eleven blocking jobs, six of them aimed at the agent rather than at the code it writes — including
a guard against silencing the type checker, the linter or the SAST line by line, whose only escape
hatch is a commit signature verified offline against a key registry versioned in the repo. The
plugin runs no cryptography of its own: it writes the workflow that verifies it, and renders the
branch-protection recipe without executing it.

The `archi` phase gives that machinery its source. It produces `docs/archi.md` in three steps —
observe what the stack already imposes (no ADR: you don't decide what is already decided), weigh
options on the two open axes (macro decomposition, micro organisation), then compile **falsifiable
invariants**: a rule only enters if it leaves an *observable trace in the tree or in the imports*.
Never a design — the end criterion is that every invariant has its trace and its candidate ADR.
Each one becomes an ADR, then an `arch-invariants` check; `plan` confronts every lot with them and
`analyze` checks it, as its 15th control.

State is always derived from files, never from a state file: `/clear` wipes the context, not the
progress. No shared file grows. Each phase appends a dated line to its own target's journal
(`docs/journal/socle.md` or `NNN-slug.md`), the only place five facts live: the analyze verdict,
applied premortem remediations, a lot's outcome (including a blocked run), and the outcome of a
contract revision (including a pass that changes nothing), and an audit verdict — the judged
document comes out byte-for-byte identical, so nothing else carries it. Work outside the
phases — or interrupted mid-flight by a `/clear` — becomes a **chantier**: a card under
`docs/chantiers/`, whose state *is* its directory.

Four capabilities are **transverse**, outside the phases and never reported as missing.
**Research**: `/scd-sdd:lookup` answers in-session and writes nothing, `/scd-sdd:research`
composes a Claude Research prompt then files and critically re-reads the report — a report never
descends into the foundation on its own. **Premortem**: `/scd-sdd:premortem` assumes failure and
traces back to what the documents left out, on the **foundation**, a **feature** or a
**chantier** — every retained risk closes with a document change drawn from its target's legal
forms, approved by the human before anything is written; whatever no text can close becomes a
chantier instead.

`CLAUDE.md` is no longer written once and never read again. Its "Commands" section is a
character-for-character copy of the `docs/ci.md` table, and nothing replayed that copy when the
`ci` phase was replayed — while three consumers kept reading it. `/scd-sdd:revise-contract`
reviews the contract against a two-part checklist (mechanical: command drift, size, dangling
pointers — judgement: the deletion test, reinstalled procedures, guardrails written as prose),
reports, **waits for the human**, then applies surgical edits. It never re-assembles from the
template: a line the template doesn't know is presumed legitimate. Three writers, three disjoint
roles — `contract` assembles once and refuses to overwrite, `revise-contract` maintains,
`premortem` hardens.

The third is the **Linear mirror**, and it is **opt-in**. It pushes what the repo already knows —
features become projects, `Rn`
review lots become issues (`Tn` tasks as a checklist, dependencies as relations), chantier cards
become labelled issues — to the workspace where the team does its prioritisation. Those
prioritisation facts are derivable from no file in the repo, and writing them there would recreate
the state file the plugin refuses everywhere else. The mirror is **strictly one-way**, and that is
not a promise in prose: `/scd-sdd:linear` has no `Write`, no `Edit` and no git command at all — its
`allowed-tools` *is* the proof. The opt-in is a file: without `docs/linear.md`, written once by
`/scd-sdd:linear-setup`, a project sees strictly no change. No Linear id or URL ever enters the
repo; the file key lives in the Linear title, never the other way round. An optional **initiative**
groups a product's projects — configured once, never derived. `/scd-sdd:linear-review` steers in
**read-only**: the 250-issue Free-plan wall, four backlog hygiene checks, a Now/Next/Later view —
rendered in session, persisted nowhere, on either side. And when the mirror is on, a lot's PR
carries the Linear magic word in its **body** (`Fixes` on the default branch, `Part of` when
stacked) so the native GitHub integration transitions the issue — best-effort, never blocking,
never in the title or the branch name. Linear's official MCP server is documented as *your IDE's*
equipment; no command ever calls it.

The fourth is the **audit**. Foundation documents were written by interview and then consumed
as-is: the specs level has `analyze`, the foundation had nothing, and the three dashboards only
test that a document *exists*. `/scd-sdd:audit` judges **one** of them — `brief`, `prd`, `stack`,
`archi`, `adr`, `ci` or `CLAUDE.md` — against a conformance grid: completeness against its
template, leftover markers, every ID and cross-reference resolving upstream, coherence, form. A
read-only explorer **collects evidence without judging** (verbatim quotes, line numbers), the
session judges, the human arbitrates the Majors, and only then does the command write — **exactly
two things**: the verdict as a dated journal line (`CONFORME` only on zero Critical), and the
work list as an ordinary chantier card, grouped by correction route. The judged document is never
one of them: it comes out byte-for-byte identical, `CLAUDE.md` findings are routed to
`/scd-sdd:revise-contract` rather than edited, and an accepted ADR can only be superseded. It is
a capability with **dimensions**, not a one-off audit — a future dimension is one more block in
the dimensions reference, not a new command.

Throughout, the plugin **explains its own vocabulary once**. Its terms — review lot `Rn`, gate,
EARS, invariant, ADR — stay precise and greppable; what changed is that they are now defined where
you meet them: a `## Légende` in five produced-document templates (including *why* EARS criteria
stay in normed English), a glossed term in every command description and report, and — in the 23
commands that hold a dialogue — **the problem stated before the options**, each option carrying its
consequence in project terms rather than jargon. Work-in-progress management is part of that:
`/scd-sdd:resume` no longer just lists four possible follow-ups, it says what each one does — and
above all that putting a chantier on hold is reversible, while closing or abandoning it is not.
So is the Linear mirror, where the stakes are higher because the answer is written into someone
else's workspace: `/scd-sdd:linear` no longer asks "is this the issue?" with two bare IDs — it
shows the repo object next to the Linear candidate and states what the wrong answer costs, namely
**two issues for the same lot, which the mirror will never remove**.
A gloss is one line, appears once, and stops entirely as soon as you use the term yourself.

Those rules govern the *sentence*. When you actually have to **decide**, ten commands — `stack`,
`archi`, `adr`, `ci`, `research`, `resume`, `premortem`, `audit`, `revise-contract`, `migrate` —
also load a dedicated skill that governs the *exposition*: the object before the problem, the
mechanism explained whenever the choice depends on one of its properties (a one-line gloss names a
term, it does not make you understand a property), reasoning told as a scene rather than stated as
an abstraction, figures given in the unit the decision is made in, an identifier carrying what its
decision actually did, and length set by what is at stake rather than by a ceiling — a text too
short costs a full round trip. It has **two regimes**: presenting competing options uses order to
*explain* one subject; walking you through a list — the `premortem` and `audit` gates, the
`revise-contract` edits, the `migrate` writes — uses order to *sort*, setting the scene once up
front and giving each entry only what is specific to it, plus what happens if you do not approve
it. It is not a template, and not blanket popularisation: what the choice depends on gets
explained, the rest gets named.

33 slash commands, including three dashboards — `/scd-sdd:status` (all three levels in one view,
plus the next command to run), `/scd-sdd:status-specs`, `/scd-sdd:status-impl` (merge-safety of
every lot PR) — and `/scd-sdd:migrate` to pick up a project coming from the three former plugins.
Replaces `scd-project-docs`, `scd-feature-specs` and `scd-implement`.

## Installation

```bash
# Add the marketplace
/plugin marketplace add sebc-dev/marketplace

# Install a plugin
/plugin install scd-astro@sebc-dev-marketplace
/plugin install scd-writer@sebc-dev-marketplace
/plugin install scd-svelte@sebc-dev-marketplace
/plugin install scd-tauri@sebc-dev-marketplace
/plugin install scd-flutter@sebc-dev-marketplace
/plugin install scd-sdd@sebc-dev-marketplace
/plugin install scd-atlas@sebc-dev-marketplace
```

## License

MIT
