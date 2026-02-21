# svelte-skill

Svelte 5 and SvelteKit 2 skill for Claude Code. Architecture decisions, anti-pattern prevention, ecosystem selection, and troubleshooting. Complements the [Svelte MCP server](https://github.com/nicholasxuu/svelte-mcp-server) for official API reference.

## What this skill covers

- **Runes & reactivity** -- $state, $derived, $effect selection, reactive classes, .svelte.ts modules
- **Components & templates** -- $props(), snippets, event handling, class styling, spread patterns
- **Routing & navigation** -- Route types, layouts, preloading, page options, invalidation
- **Data loading** -- Load functions, streaming, form actions, API routes
- **State management** -- Context API, module state, SSR safety, stores interop
- **TypeScript** -- Props typing, app.d.ts, generics, $env, load function types
- **Hooks & errors** -- Server hooks, auth patterns, error boundaries, svelte:boundary
- **Testing & deployment** -- Vitest, Playwright, adapters, Docker, prerender, SPA mode
- **Ecosystem** -- shadcn-svelte, Superforms, Better Auth, Drizzle, Paraglide, TanStack Query

## What the MCP server covers

The Svelte MCP server handles official API reference: exact signatures, config options, directive syntax, and code validation via `svelte-autofixer`. This skill handles the "what to do and why" that the MCP doesn't provide.

## Commands

| Command | Description |
|---------|-------------|
| `/svelte:audit` | Audit a project against best practices and anti-patterns |
| `/svelte:debug` | Diagnose errors using troubleshooting tables |
| `/svelte:migrate` | Generate a Svelte 4 to 5 migration plan |
| `/svelte:scaffold` | Create a new SvelteKit 2 project with correct defaults |

## Install

```bash
/plugin install svelte-skill@sebc-dev-marketplace
```

## Requirements

- Svelte MCP server configured (recommended for full API reference)
- Svelte 5.x / SvelteKit 2.x project

## License

MIT
