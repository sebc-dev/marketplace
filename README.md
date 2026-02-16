# sebc.dev marketplace

Plugin marketplace for [Claude Code](https://claude.com/code) and [Claude Cowork](https://claude.com/cowork).

## Plugins

### [astro-skill](./astro-skill/) `v0.3.0`

Complete Astro 5.x on Cloudflare Workers/Pages skill. Covers rendering modes (SSG, SSR, hybrid, Server Islands), Content Layer, Cloudflare bindings (KV, D1, R2, Durable Objects), and Astro 5 breaking-change prevention. Bundled with the GSD (Get-Shit-Done) project management framework — agents, workflows, and slash commands for structured development.

### [article-writer](./article-writing/) `v0.1.0`

7-phase writing workflow for developer-authors. The human writes and thinks, Claude questions, structures, and polishes. Never generates content on the author's behalf. Includes 9 skills for AI-pattern detection (slop vocabulary, false depth, symmetric structure) and 5 slash commands that enforce a human-first writing process.

## Installation

```bash
# Add the marketplace
/plugin marketplace add sebc-dev/marketplace

# Install a plugin
/plugin install astro-skill@sebc-dev-marketplace
/plugin install article-writer@sebc-dev-marketplace
```

## License

MIT
