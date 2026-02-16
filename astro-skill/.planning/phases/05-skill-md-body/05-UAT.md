---
status: testing
phase: 05-skill-md-body
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md]
started: 2026-02-03T16:15:00Z
updated: 2026-02-03T16:15:00Z
---

## Current Test

number: 1
name: Critical Rules Present and Complete
expected: |
  SKILL.md contains 10 numbered rules in DO/NOT format covering all Astro 5.x breaking changes:
  content.config.ts path, entry.id vs slug, render() API, glob loader, ClientRouter, runtime.env,
  imageService compile, no hybrid output, decodeURIComponent, astro/zod import.
awaiting: user response

## Tests

### 1. Critical Rules Present and Complete
expected: SKILL.md contains 10 numbered rules in DO/NOT format covering Astro 5.x breaking changes (content.config.ts path, entry.id, render(), glob loader, ClientRouter, runtime.env, imageService, no hybrid, decodeURIComponent, astro/zod)
result: [pending]

### 2. Decision Matrices with Cloudflare Defaults
expected: 4 decision matrices (rendering mode, hydration directive, Actions vs API routes, Server Islands vs alternatives) each with a bold **Default:** line containing Cloudflare-appropriate recommendations and a link to the relevant reference file
result: [pending]

### 3. MCP Integration Boundary
expected: MCP section contains fully qualified tool name `mcp__astro_doc__search_astro_docs` with two clear lists: "Use MCP when" (API signatures, config options, migration guides, integration setup, changelogs) and "Use THIS SKILL when" (architecture decisions, anti-patterns, Cloudflare patterns, grep navigation, breaking changes)
result: [pending]

### 4. Grep Hints Cover All 11 Reference Files
expected: Reference Navigation section has 11 subsections (one per reference file) each with grep patterns. Running any grep pattern returns 1-5 lines from its target file (not 0 matches, not 50+)
result: [pending]

### 5. Troubleshooting Index Routes Symptoms
expected: Quick Troubleshooting Index table routes 10+ common error symptoms (process.env undefined, Sharp errors, hydration mismatch, 404 on dynamic routes, etc.) to the correct reference file(s)
result: [pending]

### 6. SKILL.md Body Under 500 Lines
expected: Total SKILL.md body (everything after 19-line frontmatter) is under 500 lines, with 5 H2 sections: Critical Rules, Decision Matrices, MCP Integration, Reference Navigation, Quick Troubleshooting Index
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0

## Gaps

[none yet]
