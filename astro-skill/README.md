# astro-skill

Claude Code skill for **Astro 5.x on Cloudflare Workers/Pages**.

## What's included

### Skill

The main `astro-cloudflare` skill with 11 reference files covering:

- Rendering modes (SSG, SSR, hybrid, Server Islands, `server:defer`)
- Components and islands architecture (hydration directives)
- Content Layer with loaders, `content.config.ts`, Content Collections
- Routing, dynamic routes, `getStaticPaths`, ClientRouter
- Cloudflare bindings (KV, D1, R2, Durable Objects), `platformProxy`
- Build, deploy, wrangler config, `nodejs_compat`
- TypeScript, `env.d.ts`, testing patterns
- Styling, Tailwind CSS, scoped styles, performance
- SEO, sitemap, OpenGraph, i18n
- Security, CSP headers, auth patterns

### 10 critical Astro 5.x breaking-change rules

Encoded directly in the skill to prevent the most common code generation errors — `content.config.ts` path, `entry.id` vs `entry.slug`, `render()` import, `ClientRouter`, Cloudflare env access, and more.

### Commands

| Command | Description |
|---------|-------------|
| `/astro:scaffold` | Project scaffolding |
| `/astro:audit` | Config audit workflow |
| `/astro:debug` | Dual-MCP debug with Cloudflare routing |

### GSD framework (Get-Shit-Done)

Bundled project management framework:

- **44 slash commands** — project lifecycle from `/gsd:new-project` to `/gsd:complete-milestone`
- **11 agents** — codebase mapper, debugger, executor, planner, verifier, and more
- **Workflows** — phase execution, diagnostics, codebase mapping
- **Templates** — project, milestone, phase, research, verification

## Installation

```bash
/plugin install astro-skill@sebc-dev-marketplace
```
