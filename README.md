# sebc.dev marketplace

Plugin marketplace for [Claude Code](https://claude.com/code) and [Claude Cowork](https://claude.com/cowork).

## Plugins

### [astro-skill](./astro-skill/) `v0.3.0`

Complete Astro 5.x on Cloudflare Workers/Pages skill. Rendering modes (SSG, SSR, hybrid, Server Islands), Content Layer, Cloudflare bindings (KV, D1, R2, Durable Objects), and Astro 5 breaking-change prevention. 10 critical rules encoded directly in the skill. 3 slash commands (`/scd:astro-scaffold`, `/scd:astro-audit`, `/scd:astro-debug`).

### [article-writer](./article-writing/) `v0.2.0`

Human-first writing workflow in 7 phases. The human writes and thinks, Claude questions, structures, reviews, and polishes. Never generates content on the author's behalf. Includes AI-detection skills (slop vocabulary, lexical markers, symmetric structure) and 6 slash commands (`/braindump`, `/structure`, `/draft`, `/review`, `/polish`, `/translate`).

### [svelte-skill](./svelte-skill/) `v0.1.0`

Svelte 5 + SvelteKit 2 skill. Runes, components, routing, data loading, state management, hooks, TypeScript, testing, deployment, and ecosystem selection. Complements the Svelte MCP server with architecture decisions and anti-pattern prevention. 4 slash commands (`/scd:svelte-scaffold`, `/scd:svelte-audit`, `/scd:svelte-debug`, `/scd:migrate`).

### [tauri-skill](./tauri-skill/) `v0.1.0`

Tauri v2 desktop and mobile skill. Architecture, security model (capabilities, permissions, scopes, CSP), IPC bridge (commands, events, channels, state), plugin ecosystem (30+ official plugins), desktop patterns (multi-window, tray, menus, sidecars), mobile (Android, iOS), build pipeline, code signing, and updater. Uses WebFetch for official docs lookup. 3 slash commands (`/scd:tauri-scaffold`, `/scd:tauri-audit`, `/scd:tauri-debug`).

### [plugin-forge](./plugin-forge/) `v0.1.0`

Architectural design patterns for Claude Code plugins. Component selection (skill vs command vs agent vs hook vs CLAUDE.md vs MCP), plugin sizing, context budget architecture, multi-component orchestration, and quality validation. 3 slash commands (`/scd:design`, `/scd:forge-audit`, `/scd:distill`).

## Installation

```bash
# Add the marketplace
/plugin marketplace add sebc-dev/marketplace

# Install a plugin
/plugin install astro-skill@sebc-dev-marketplace
/plugin install article-writer@sebc-dev-marketplace
/plugin install svelte-skill@sebc-dev-marketplace
/plugin install tauri-skill@sebc-dev-marketplace
/plugin install plugin-forge@sebc-dev-marketplace
```

## License

MIT
