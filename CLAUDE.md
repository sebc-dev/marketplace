# sebc.dev marketplace

Plugin marketplace for Claude Code and Claude Cowork.

## Structure

```
.claude-plugin/marketplace.json    # Marketplace manifest
astro-skill/                       # Astro 5.x + Cloudflare plugin
article-writing/                   # Human-first writing workflow plugin
svelte-skill/                      # Svelte 5 + SvelteKit 2 plugin
plugin-forge/                      # Plugin architecture design patterns
```

## Conventions

### Plugins
Each plugin is a root-level directory containing:
- `.claude-plugin/plugin.json` — plugin manifest
- `skills/<name>/SKILL.md` — skills following the Agent Skills spec
- `commands/<name>.md` — slash commands
- `README.md` — plugin documentation

### Skills
- YAML frontmatter required with `name` and `description`
- `name` in kebab-case, must match directory name
- `description` specifies when to activate the skill (conditions, commands)
- Concise content: target < 200 lines, max 500 lines
- Concrete examples required (no abstract principles alone)

### Commands
- YAML frontmatter with `description` and `argument-hint` (optional)
- Clear instructions on what Claude does and does not do
- Explicit human/AI ratio

### Marketplace
- `marketplace.json` at root in `.claude-plugin/`
- Each plugin listed in `plugins[]` with `name`, `source`, `description`
- Relative paths for local plugin sources

## Useful commands

```bash
# Add this marketplace
/plugin marketplace add sebc-dev/marketplace

# Install a plugin
/plugin install astro-skill@sebc-dev-marketplace
/plugin install article-writer@sebc-dev-marketplace
/plugin install svelte-skill@sebc-dev-marketplace
/plugin install plugin-forge@sebc-dev-marketplace
```
