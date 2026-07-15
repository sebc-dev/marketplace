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
```

## License

MIT
