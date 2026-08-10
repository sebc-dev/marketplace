# sebc.dev marketplace

Plugin marketplace for [Claude Code](https://claude.com/code) and [Claude Cowork](https://claude.com/cowork).

## Plugins

### [scd-astro](./scd-astro/) `v0.3.0`

Complete Astro 5.x on Cloudflare Workers/Pages skill. Rendering modes (SSG, SSR, hybrid, Server Islands), Content Layer, Cloudflare bindings (KV, D1, R2, Durable Objects), and Astro 5 breaking-change prevention. 10 critical rules encoded directly in the skill. 3 slash commands (`/scd-astro:scaffold`, `/scd-astro:audit`, `/scd-astro:debug`).

### [scd-writer](./scd-writer/) `v0.2.0`

Human-first writing workflow in 7 phases. The human writes and thinks, Claude questions, structures, reviews, and polishes. Never generates content on the author's behalf. Includes AI-detection skills (slop vocabulary, lexical markers, symmetric structure) and 6 slash commands (`/braindump`, `/structure`, `/draft`, `/review`, `/polish`, `/translate`).

### [scd-svelte](./scd-svelte/) `v0.1.0`

Svelte 5 + SvelteKit 2 skill. Runes, components, routing, data loading, state management, hooks, TypeScript, testing, deployment, and ecosystem selection. Complements the Svelte MCP server with architecture decisions and anti-pattern prevention. 4 slash commands (`/scd-svelte:scaffold`, `/scd-svelte:audit`, `/scd-svelte:debug`, `/scd-svelte:migrate`).

### [scd-tauri](./scd-tauri/) `v0.1.0`

Tauri v2 desktop and mobile skill. Architecture, security model (capabilities, permissions, scopes, CSP), IPC bridge (commands, events, channels, state), plugin ecosystem (30+ official plugins), desktop patterns (multi-window, tray, menus, sidecars), mobile (Android, iOS), build pipeline, code signing, and updater. Uses WebFetch for official docs lookup. 3 slash commands (`/scd-tauri:scaffold`, `/scd-tauri:audit`, `/scd-tauri:debug`).

### [scd-forge](./scd-forge/) `v0.1.0`

Architectural design patterns for Claude Code plugins. Component selection (skill vs command vs agent vs hook vs CLAUDE.md vs MCP), plugin sizing, context budget architecture, multi-component orchestration, and quality validation. 3 slash commands (`/scd-forge:design`, `/scd-forge:audit`, `/scd-forge:distill`).

### [scd-review](./scd-review/) `v0.7.0`

Interactive guided code review on the current branch. Reviews file by file in optimal order with dedicated background agents (code-reviewer + test-reviewer) for each file, JSON-based progress tracking, and blocking/suggestion classification. 5 slash commands (`/scd-review:review-init`, `/scd-review:code-review`, `/scd-review:review-followup`, `/scd-review:review-continue`, `/scd-review:review-post`). GitHub/GitLab PR posting integration.

### [scd-sdd](./scd-sdd/) `v1.11.0`

Complete spec-driven development cycle, from empty repo to reviewable PR — one plugin, three
chained levels. **Foundation** (once per project): brief → PRD → stack → architecture invariants →
foundational ADRs → CI → CLAUDE.md, by one-question-at-a-time interview, where the `ci` phase makes
deterministic and verifiable *outside the agent* what CLAUDE.md can only advise. **Specs** (once per
feature): specify → clarify → plan → tasks → analyze conformance gate (15 checks), with EARS acceptance
criteria, Kiro backrefs, and review lots (`Rn`) sized so a human can actually review each one.
**Implementation** (one lot at a time): a dynamic workflow orchestrating 20 dedicated subagents —
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
(`docs/journal/socle.md` or `NNN-slug.md`), the only place four facts live: the analyze verdict,
applied premortem remediations, a lot's outcome (including a blocked run), and the outcome of a
contract revision (including a pass that changes nothing). Work outside the
phases — or interrupted mid-flight by a `/clear` — becomes a **chantier**: a card under
`docs/chantiers/`, whose state *is* its directory.

Three capabilities are **transverse**, outside the phases and never reported as missing.
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

32 slash commands, including three dashboards — `/scd-sdd:status` (all three levels in one view,
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
/plugin install scd-forge@sebc-dev-marketplace
/plugin install scd-review@sebc-dev-marketplace
/plugin install scd-sdd@sebc-dev-marketplace
```

## License

MIT
