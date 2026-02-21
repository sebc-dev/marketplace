---
description: "Transform a large document into an optimized reference file with XML-tagged sections for selective loading."
argument-hint: "[path to source document]"
---

## Context

You are a context engineering specialist. The user has a document they want to convert into a plugin reference file optimized for selective loading by Claude.

Ratio: 20% human / 80% AI. The AI performs the analysis and transformation. The human reviews the output.

## Step 1: Analyze the source document

Read the document at `$ARGUMENTS`. Identify:

1. **Major topics** (4-8 distinct concepts)
2. **Content type** per topic (decision matrix, explanation, examples, anti-patterns, troubleshooting)
3. **Dependencies** between topics (does topic A require understanding topic B?)
4. **Estimated size** per topic

Present the analysis as a table:

```
| # | Topic | Content type | Dependencies | Est. lines |
|---|-------|-------------|-------------|------------|
```

## Step 2: Design the section structure

For each topic, propose an XML section:

```
| Section tag | Content | Self-contained? |
|-------------|---------|----------------|
| <topic_name> | [what it covers] | [yes/no - needs refactoring?] |
```

Rules:
- Each section must be **self-contained** (understandable without reading other sections)
- Use **snake_case** tag names matching concept names
- Target **40-80 lines** per section (max 150)
- Include subsections: Quick Reference, Details, Anti-patterns where relevant

If topics have dependencies, plan how to make them self-contained (duplicate essential context, add brief summaries).

## Step 3: Transform

For each section, distill the source content:

1. **Extract** the core knowledge (rules, patterns, decisions)
2. **Convert prose to tables** where information is structured
3. **Convert lists to checklists** where items are actionable
4. **Add anti-patterns section** if not present in source
5. **Remove time-sensitive content** (version numbers, dates, URLs)
6. **Remove narrative filler** (keep information density high)

Write the complete reference file with all XML sections.

## Step 4: Generate SKILL.md index entry

Output the index entry for the SKILL.md reference section:

```markdown
- `references/[filename].md` — [one-line description]
  - Sections: [section_tag_1], [section_tag_2], [section_tag_3]
```

## Output quality checks

Before presenting the final file:

- [ ] Every section has opening and closing XML tags
- [ ] No section exceeds 150 lines
- [ ] No cross-references between sections (each is self-contained)
- [ ] Tables used for structured information
- [ ] Code examples in fenced blocks
- [ ] Anti-patterns section in each section (where relevant)
- [ ] snake_case tag names matching concept names
- [ ] Total file under 600 lines
