# sebc.dev marketplace

Plugin marketplace for Claude Code and Claude Cowork.

## Structure

```
.claude-plugin/marketplace.json    # Marketplace manifest
astro-skill/                       # Astro 5.x + Cloudflare + GSD plugin
article-writing/                   # 7-phase writing workflow plugin
docs/                              # Reference documentation (skill guides)
```

## Conventions

### Plugins
Each plugin is a root-level directory containing:
- `.claude-plugin/plugin.json` — plugin manifest
- `skills/<name>/SKILL.md` — skills following the Agent Skills spec
- `commands/<name>.md` — slash commands
- `agents/<name>.md` — subagent definitions (optional)
- `hooks/hooks.json` — hook configuration (optional)
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
# Validate the marketplace
claude plugin validate /path/to/marketplace

# Add this marketplace
/plugin marketplace add sebc-dev/marketplace

# Install a plugin
/plugin install astro-skill@sebc-dev-marketplace
/plugin install article-writer@sebc-dev-marketplace
```
