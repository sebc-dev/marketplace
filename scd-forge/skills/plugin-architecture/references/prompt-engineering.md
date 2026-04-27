<xml_tag_patterns>
## XML Tags in Plugin Files

Claude is specifically trained to recognize XML tags as semantic markers. Use them in reference files for grep-friendly section access.

### Why XML in reference files

| Benefit | Explanation |
|---------|-------------|
| Selective loading | Claude can grep for `<section_name>` and read only that section |
| Clear boundaries | Tags create unambiguous section delimiters |
| Nesting support | 2-3 levels of nesting for structured content |
| Markdown mixing | XML structure + markdown formatting = best of both |

### Tag naming conventions

- Use `snake_case` for compound names: `<quick_reference>`, `<anti_patterns>`
- Use single words for common tags: `<examples>`, `<context>`
- Tag names should describe content, not structure: `<jit_loading>` not `<section_3>`
- Match concept names users would search for

### Nesting depth rules

- **1 level:** `<section>content</section>` — most reference file sections
- **2 levels:** `<section><subsection>content</subsection></section>` — complex topics
- **3 levels:** Maximum recommended. Beyond this, benefits diminish while complexity increases.

### Template for reference file sections

```xml
<concept_name>
## Concept Name

[2-3 sentence overview]

### Key rules
[Numbered list or table]

### Examples
[Concrete code/config examples]

### Anti-patterns
[What NOT to do, specific to this concept]
</concept_name>
```

### Anti-patterns

- **Over-tagging:** `<prompt><task><description><text>Write</text></description></task></prompt>` — use the minimal necessary structure
- **Inconsistent references:** Naming a section `<document>` then referring to it as `<contract>` in instructions
- **Empty tags:** `<examples></examples>` — either omit or state "None provided"
- **Deeply nested:** More than 3 levels dilutes attention without benefit
</xml_tag_patterns>

<description_templates>
## Skill Description Templates

The description field is the most important text in a skill. It determines when Claude activates the skill. The description is **activation conditions only — never a workflow summary**: if it summarizes the steps, Claude reads the summary and skips the SKILL.md.

### Template: TRIGGER / SKIP (recommended, all skill types)

This is the canonical pattern from Anthropic's own `claude-api` skill. It works because it's explicit about both when to activate and when not to.

```yaml
description: |
  [Domain] [scope]. [Capability 1], [Capability 2], [Capability 3].
  TRIGGER when: [concrete trigger 1 — file pattern / import / keyword];
  [trigger 2]; [trigger 3].
  SKIP: [near-miss boundary 1]; [near-miss boundary 2]; [complement: X].
```

Example (claude-api, verbatim from anthropics/skills):
```yaml
description: |
  Build, debug, and optimize Claude API / Anthropic SDK apps. Apps built with
  this skill should include prompt caching.
  TRIGGER when: code imports `anthropic`/`@anthropic-ai/sdk`; user asks for
  the Claude API or Anthropic SDK; questions about prompt caching / cache hit
  rate in an Anthropic SDK project.
  SKIP: file imports `openai`/other-provider SDK; filename like
  `*-openai.py`/`*-generic.py`; provider-neutral code; general programming/ML.
```

### Template: Domain expertise skill

```yaml
description: |
  [Domain] [version/scope]. [Capability 1] ([detail]), [Capability 2],
  [Capability 3]. [File patterns] ([.ext], [config-file]). Use when
  [trigger condition 1], [trigger condition 2], or [trigger condition 3].
  Complements [other-skill] for [their domain]. Do NOT use for [boundary].
```

Example (astro-cloudflare):
```yaml
description: |
  Astro 5.x on Cloudflare Workers/Pages. Rendering modes (SSG, SSR, hybrid,
  Server Islands), Content Layer, Cloudflare bindings (KV, D1, R2, Durable
  Objects), breaking-change prevention. Use when working with .astro files,
  astro.config.mjs, wrangler.jsonc, or Cloudflare Workers/Pages Astro projects.
  Complements mcp__astro_doc__search_astro_docs for official API reference.
```

### Template: Always-active skill

```yaml
description: |
  Always active. [Purpose] for [audience]. Defines [aspect 1], [aspect 2],
  [aspect 3], and [aspect 4]. Cardinal principle: [core rule].
```

### "Pushiness" calibration

Claude tends to under-trigger. If reliable activation matters, add explicit instructions inside the description.

Anti-example (under-triggers):
> "How to build a simple fast dashboard to display internal Anthropic data."

Pushy version:
> "How to build a simple fast dashboard to display internal Anthropic data. Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a 'dashboard.'"

### Description as activation, NOT as workflow summary

Bad — Claude reads the summary and skips the SKILL.md:
```yaml
description: |
  Use for TDD workflow: write the test first, watch it fail, write minimal
  code to pass, then refactor. Repeat for each behavior.
```

Good — describes when to activate, leaves the procedure inside the SKILL.md:
```yaml
description: |
  Test-driven development practitioner. Use when implementing any feature
  or bugfix, before writing implementation code. TRIGGER on requests like
  "add feature X", "fix bug Y", or any new function/method work.
  SKIP for read-only refactors and pure documentation.
```

### Keyword density checklist

- [ ] File extensions mentioned (`.astro`, `.md`, `plugin.json`)
- [ ] Config file names mentioned (`wrangler.jsonc`, `astro.config.mjs`)
- [ ] Import names mentioned where relevant (`anthropic`, `@anthropic-ai/sdk`)
- [ ] Action verbs included ("scaffold", "audit", "migrate", "debug")
- [ ] Concept names included (not just tool names)
- [ ] TRIGGER phrases present (concrete activation signals)
- [ ] SKIP / boundary markers present ("Do NOT use for...", "Complements X")
- [ ] Triggers front-loaded (resilient to truncation)
- [ ] Third-person, impératif (never "I will...")
- [ ] No multi-step workflow summary in description
</description_templates>

<claude_md_architecture>
## CLAUDE.md Architecture for Plugin Projects

### The WHAT / WHY / HOW framework

```markdown
# Project Name

## WHAT — Stack and structure
- Tech stack: [technologies]
- Architecture: [patterns]
- Key directories: [map]

## WHY — Purpose and decisions
- Project goal: [one sentence]
- Key architectural decisions: [brief list]

## HOW — Workflows
- Build: `command`
- Test: `command`
- Deploy: `command`
```

### Sizing rules

| Guideline | Rule |
|-----------|------|
| Total length | <100 lines ideal, <300 max |
| Universal applicability | Only instructions used by >30% of interactions |
| Content type | Rules and conventions, not documentation |
| Negative constraints | Always provide alternative: "Never X, prefer Y instead" |
| Emphasis | Use IMPORTANT, YOU MUST for critical rules only |

### What belongs in CLAUDE.md vs elsewhere

| Content | Location | Why |
|---------|----------|-----|
| Build/test/lint commands | CLAUDE.md | Used every session |
| Code conventions (non-lintable) | CLAUDE.md | Universal |
| Style guidelines (lintable) | Linter config | Deterministic, faster |
| Architectural decisions | CLAUDE.md (brief) | Context for all work |
| Detailed API docs | Reference files | On-demand loading |
| Task-specific instructions | Commands | Only when invoked |
| Guardrails ("NEVER modify X") | CLAUDE.md | Always-on protection |

### Progressive disclosure with @imports

```markdown
# CLAUDE.md (~80 lines)

## Architecture
Brief overview. For details: @docs/architecture.md

## Conventions
Brief rules. For language specifics: @docs/typescript-conventions.md
```

The `@path/to/file.md` syntax loads files dynamically — use sparingly and only for content that's genuinely needed across sessions.

### The forcing function principle

Keeping CLAUDE.md short forces you to simplify your tooling. If a command needs 5 lines of explanation, write a wrapper script with a simple API instead.
</claude_md_architecture>

<reference_formatting>
## Reference File Formatting

### Structure template

```xml
<section_name>
## Section Title

[Overview: 2-3 sentences maximum]

### Quick Reference
[Table or decision matrix for fast lookup]

### Details
[Expanded explanation with examples]

### Anti-patterns
[Common mistakes specific to this section]
</section_name>
```

### Formatting rules

| Rule | Rationale |
|------|-----------|
| XML tags wrap each major section | Grep-friendly selective loading |
| Markdown headings inside XML | Human readability |
| Tables for decision matrices | Compact, scannable |
| Code blocks for examples | Unambiguous syntax |
| One concept per section | Self-contained, independent loading |

### File sizing guidelines

| Element | Target | Maximum |
|---------|--------|---------|
| Sections per file | 4-8 | 12 |
| Lines per section | 40-80 | 150 |
| Total file length | 200-400 lines | 600 |
| Nesting depth | 1 level (XML > markdown) | 2 levels |

### Index pattern in SKILL.md

List each reference file with its XML sections so Claude knows what's available:

```markdown
## Reference Files

- `references/context-engineering.md` — Context optimization
  - Sections: jit_loading, progressive_disclosure, context_budget_rules

- `references/component-orchestration.md` — Component interactions
  - Sections: interaction_matrix, skill_plus_commands, agent_delegation
```

This lets Claude load the right section without reading every reference file.
</reference_formatting>

<naming_conventions>
## Naming Conventions for Plugin Components

### Directory and file names

| Component | Convention | Example |
|-----------|-----------|---------|
| Plugin directory | `kebab-case` | `scd-forge/` |
| Skill directory | `kebab-case` matching name field | `plugin-architecture/` |
| Reference files | `kebab-case.md` | `context-engineering.md` |
| Command files | `kebab-case.md` | `design.md` |
| Command directories (grouped) | `kebab-case/` | `forge/` |
| Agent files | `kebab-case.md` | `code-reviewer.md` |

### YAML name fields

| Component | Convention | Max length | Example |
|-----------|-----------|------------|---------|
| Skill name | `kebab-case` | 64 chars | `plugin-architecture` |
| Plugin name | `kebab-case` | — | `scd-forge` |

### Command namespacing

Group commands under a directory to create namespaced invocations:

```
commands/
  forge/
    design.md     -> /scd-forge:design
    audit.md      -> /scd-forge:audit
    distill.md    -> /scd-forge:distill
```

The directory name becomes the namespace prefix with `:` separator.

### XML tag names in references

- Use `snake_case`: `<jit_loading>`, `<anti_patterns>`, `<quick_reference>`
- Match the concept name users would search for
- Keep names short but descriptive (2-3 words max)
</naming_conventions>

<anti_patterns>
## Prompt Engineering Anti-Patterns

### 1. The vague description
"Helps with plugins" — too vague for reliable activation. Include specific keywords, file patterns, and trigger conditions.

### 2. The novel-length description
Using all 1024 characters with prose. Descriptions should be keyword-dense, not narrative. Every word should either be a keyword or structural connective.

### 3. The missing boundary
No "Do NOT use for" or "Complements X" declaration. Without boundaries, skills activate for tangentially related queries, causing context waste.

### 4. The workflow-summary description
Description that summarizes the steps the skill performs ("First do X, then Y, then Z"). Claude reads the summary and skips the SKILL.md body, defeating progressive disclosure. Description = activation conditions only. Workflows belong in commands or in the SKILL.md body.

### 5. The first-person voice
"I will help you with…" — Anthropic best-practices state inconsistent point-of-view causes discovery problems. Always third-person, impératif.

### 6. MUST / ALWAYS empilés
Stacking ALL-CAPS rules without justification. Anthropic flags this as a yellow flag in `skill-creator`: *"reframe and explain the reasoning so that the model understands why the thing you're asking for is important."*

### 7. The style guide in CLAUDE.md
Documenting code style rules that a linter handles deterministically. LLMs are expensive and slow for style enforcement — use real linters.

### 8. The @-mention bombardment
Referencing many files in CLAUDE.md with @-imports. Each one loads its full content every session. Use "when working on X, read Y" pointers instead.

### 9. The negative-only constraint
"Never use flag --foo" without "prefer --bar instead." Claude gets stuck when it thinks it needs the forbidden option. Always provide the alternative.

### 10. The auto-generated CLAUDE.md
Running `/init` and keeping the generic output. Auto-generated content wastes context with generic boilerplate. Start from scratch or heavily curate.

### 11. Inventing frontmatter fields
Adding `version`, `author`, or `tags` to skill frontmatter. These are not in the spec and are silently ignored. Versioning is external (Git tags or `/v1/skills` epoch timestamps).
</anti_patterns>
