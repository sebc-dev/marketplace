<astro_skill_anatomy>
## Case Study: astro-skill

A standard-size plugin providing domain expertise for Astro 5.x on Cloudflare.

### Architecture overview

```
astro-skill/
  .claude-plugin/plugin.json
  .claude/
    skills/astro-cloudflare/
      SKILL.md                    # ~220 lines
      references/                 # 11 reference files
        project-structure.md
        rendering-modes.md
        cloudflare-platform.md
        components-islands.md
        routing-navigation.md
        data-content.md
        styling-performance.md
        seo-i18n.md
        typescript-testing.md
        build-deploy.md
        security-advanced.md
    commands/astro/
      audit.md
      debug.md
      scaffold.md
```

### Component count: 1 skill, 11 references, 3 commands

### Design decisions

**1. Single skill with extensive references**
One skill covers the entire Astro-on-Cloudflare domain. The body contains decision matrices and critical rules (the content needed for every query). Deep explanations live in 11 reference files.

Why it works: Astro + Cloudflare is one coherent domain. Splitting into multiple skills (astro-rendering, astro-content, astro-cloudflare) would create activation confusion.

**2. Critical Rules as #1 content**
The first section in SKILL.md is "Critical Rules" — 10 breaking changes that cause the most common code generation errors. This is the highest-value content, loaded every time the skill activates.

Why it works: Preventing errors is more valuable than explaining features. The rules are short (one line each) and universally applicable.

**3. Decision matrices over prose**
The body uses tables for rendering mode selection, hydration directives, Actions vs API routes, and Server Islands vs alternatives. Each table includes a "Default" recommendation.

Why it works: Tables are scannable. Claude can find the right row quickly without reading paragraphs.

**4. MCP source routing table**
The skill documents which MCP tool to use for which question domain (Astro MCP vs Cloudflare MCP vs skill references).

Why it works: Prevents Claude from querying the wrong MCP or duplicating information already in references.

**5. Quick Troubleshooting Index**
A symptom-to-reference-file routing table at the bottom of SKILL.md.

Why it works: When users describe symptoms, Claude can jump directly to the right reference file section.

### Context budget analysis

```
Inactive: ~150 tokens (metadata only — long description)
Active, simple query: ~800 tokens (metadata + body with matrices)
Active, deep query: ~3000 tokens (metadata + body + 1-2 reference sections)
```

### Reference file pattern

Each reference file follows a consistent structure:
- XML-tagged sections (e.g., `<quick_reference>`, `<anti_patterns>`, `<troubleshooting>`)
- Decision matrices as tables
- Code examples in fenced blocks
- Anti-patterns section at the end of each file

### Lessons learned

1. **Keyword-rich description pays off.** Listing specific file extensions (`.astro`, `wrangler.jsonc`) and concepts ("Server Islands", "Content Layer") ensures reliable activation.
2. **Reference file index is critical.** Without the section listing in SKILL.md, Claude would need to open each reference file to discover what's available.
3. **11 reference files is manageable** because the SKILL.md index guides Claude to the right one.
4. **"Default" recommendations reduce decision fatigue.** Each matrix includes what to use when unsure.
</astro_skill_anatomy>

<article_writing_anatomy>
## Case Study: article-writing

A workflow-size plugin implementing a multi-phase writing process with detection skills.

### Architecture overview

```
article-writing/
  .claude-plugin/plugin.json
  skills/
    writing-voice/SKILL.md           # Always active. Editorial identity.
    slop-vocabulary/SKILL.md         # LLM marker vocabulary (EN + FR)
    fausse-profondeur/SKILL.md       # Mechanical rhetorical patterns
    marqueurs-lexicaux/SKILL.md      # Statistical signature analysis
    structure-symetrique/SKILL.md    # Document-level structural patterns
    slop-poli/SKILL.md              # Polite but empty content detection
    article-types/SKILL.md           # Genre-specific calibration
    cognitive-outsourcing/SKILL.md   # Delegation detection
    delegation-totale/SKILL.md       # Full delegation prevention
  commands/
    braindump.md                     # Phase 1: Capture ideas
    structure.md                     # Phase 2: Organize
    draft.md                         # Phase 3: Write
    review.md                        # Phase 5: Multi-axis review
    polish.md                        # Phase 6: Surface cleanup
    translate.md                     # Phase 7: FR -> EN translation
```

### Component count: 9 skills, 0 references, 6 commands

### Design decisions

**1. Multiple detector skills instead of one monolithic skill**
Each skill detects a specific aspect of writing quality: vocabulary, structure, rhetorical patterns, statistical markers. They operate independently and combine during `/review`.

Why it works: Each detector has a clear, focused domain. They can activate individually for specific questions or combine for comprehensive review.

**2. Always-active base skill (writing-voice)**
The `writing-voice` skill declares "Always active" in its description. It defines the editorial identity that applies to every interaction.

Why it works: Voice and identity rules apply universally. Other detectors activate contextually.

**3. Commands map to workflow phases**
Each command corresponds to a specific phase in the writing process. The human/AI ratio varies per phase: 100/0 for braindump, 40/60 for review.

Why it works: Clear workflow progression. The user knows which command to use next.

**4. /review orchestrates all detectors**
The review command explicitly lists which skills to activate and what scan to run with each one. It's the aggregation point.

Why it works: The command defines the analysis protocol. Each detector knows its role in the review.

**5. No reference files — knowledge embedded in skills**
Unlike astro-skill, article-writing keeps all knowledge in the skill bodies themselves. Each detector skill is essentially a reference on its topic.

Why it works: The detectors are small enough (<130 lines each) that reference file overhead isn't justified. The content is always needed when the skill activates.

### Context budget analysis

```
Inactive: ~800 tokens (9 skill metadata entries — higher than standard)
Active, single skill: ~1200 tokens (metadata + one detector body)
Active, /review: ~6000 tokens (metadata + review command + all detectors)
```

The higher inactive cost (800 tokens for 9 skills) is the trade-off for the multi-detector architecture. It's acceptable because the detectors serve distinct, non-overlapping purposes.

### Lessons learned

1. **Multi-skill is justified when detectors are independent.** Each skill can answer questions alone. They're not fragments of a single skill.
2. **"Always active" should be used sparingly.** Only writing-voice uses it. Making all detectors always-active would waste tokens.
3. **Commands as workflow orchestrators** work well when phases are sequential and the user controls progression.
4. **Human/AI ratio in frontmatter** sets clear expectations. The author knows they're driving in braindump but reviewing in review.
5. **9 skills is at the upper limit.** The 800-token inactive cost is noticeable. More detectors should be consolidated or moved to reference sections.
</article_writing_anatomy>

<design_lessons>
## Cross-Plugin Design Lessons

### When to use single-skill vs multi-skill

| Signal | Architecture | Rationale |
|--------|-------------|-----------|
| One coherent domain | Single skill + references | Astro-on-Cloudflare is one domain |
| Multiple independent detectors | Multi-skill | Each article detector stands alone |
| Domain subdivisions that always co-occur | Single skill + sections | Don't split what's always needed together |
| Domain subdivisions with different activation triggers | Multi-skill | Different keywords activate different detectors |

### The reference files vs skill bodies trade-off

| Content type | Where to put it | Why |
|-------------|-----------------|-----|
| Needed every activation | SKILL.md body | Avoid extra file reads |
| Needed for specific sub-queries | Reference file section | Selective loading |
| Small enough (<150 lines) and standalone | Skill body | Overhead of references not justified |
| Large (>200 lines) or shared across topics | Reference file | Keep body lean |

### Command design patterns

1. **Phase commands** (article-writing): `/braindump` -> `/structure` -> `/draft`. Sequential, user-driven progression.
2. **Action commands** (astro-skill): `/scd:astro-audit`, `/scd:astro-scaffold`. Independent, each does one thing.
3. **Workshop commands** (plugin-forge): `/scd:design`. Interactive, multi-step conversation.

### The inactive cost principle

Every installed plugin has an inactive cost (metadata loaded at session start). Design with the ecosystem in mind:
- A user with 5 plugins should spend <1000 tokens on metadata
- Target: <200 tokens per plugin inactive cost
- Exception: workflow plugins with many skills (like article-writing at ~800 tokens) should document this trade-off
</design_lessons>

<migration_patterns>
## Migration Patterns

### From CLAUDE.md rules to a skill

**When:** Rules in CLAUDE.md grow beyond 10-15 lines on one topic.

1. Create a skill directory with SKILL.md
2. Move the detailed rules into the skill body
3. Replace the CLAUDE.md content with a one-line pointer: "For [topic], the [skill-name] skill handles this"
4. Test activation: ask about the topic, verify the skill loads

### From a large skill to skill + references

**When:** SKILL.md exceeds 200 lines.

1. Identify sections needed every activation (keep in body)
2. Identify sections needed for specific queries (move to references)
3. Create reference files with XML-tagged sections
4. Add reference file index to SKILL.md body
5. Test: verify Claude can still find information that moved to references

### From multiple commands to a plugin

**When:** You have 3+ commands in `.claude/commands/` on the same topic.

1. Create a plugin directory with `.claude-plugin/plugin.json`
2. Move commands to `plugin/commands/`
3. Extract shared knowledge into a skill
4. Add reference files for detailed documentation
5. Write README.md
6. Test: install the plugin, verify commands and skill work

### From documentation to a reference file

**When:** You have a large doc that would be useful as a plugin reference.

1. Identify the 4-8 major topics in the document
2. Create XML-tagged sections, one per topic
3. Make each section self-contained (no cross-references within the file)
4. Write a SKILL.md body that indexes the sections
5. Test: ask about each topic, verify Claude loads the right section

Use `/scd:distill` for guided assistance with this migration.
</migration_patterns>
