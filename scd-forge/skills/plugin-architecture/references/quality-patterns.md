<skill_checklist>
## Skill Quality Checklist

### Critical (must fix before publishing)

- [ ] **Single-purpose skill.** Not a multi-step orchestrator — those are commands.
- [ ] **Description is activation conditions, NOT a workflow summary.** If the description reads "First X, then Y", convert to a command or rewrite the description.
- [ ] **Description has TRIGGER markers.** Concrete activation signals (file patterns, imports, keywords).
- [ ] **Description has SKIP / boundary markers.** "Do NOT use for X" and/or "Complements Y" prevents activation conflicts.
- [ ] **Description ≤ 1024 chars** (or ≤ 1536 chars when combined with `when_to_use` for Claude Code).
- [ ] **Description uses third-person, impératif.** Never "I will..." — POV inconsistency breaks discovery.
- [ ] **`name` field matches directory name.** `name: plugin-architecture` in `skills/plugin-architecture/SKILL.md`.
- [ ] **`name` is kebab-case, ≤ 64 chars.** Lowercase, hyphens only. Forbidden words: `anthropic`, `claude`.
- [ ] **No invented frontmatter fields.** No `version`, `author`, or `tags` — they're silently ignored.
- [ ] **SKILL.md starts with frontmatter.** No blank line before `---`. First three bytes must be `---`.
- [ ] **Body under 500 lines (hard max).** Target 200.
- [ ] **`references/`, `scripts/`, `assets/` live INSIDE the skill folder.** Never at the plugin root.

### Important (should fix)

- [ ] **Decision matrices in body.** Quick-reference tables that apply to most activations belong in SKILL.md, not references.
- [ ] **Reference file index present.** List each reference file with its XML sections so Claude knows what to load.
- [ ] **References one level deep.** SKILL.md -> reference. Never reference -> reference.
- [ ] **No MUST / ALWAYS empilés without justification.** Anthropic yellow flag — explain *why* a rule matters.
- [ ] **No time-sensitive information.** No versions, dates, or URLs that will become stale. Use `WebFetch` for fast-moving SDK docs instead of bundling.
- [ ] **Concrete examples provided.** At least one input/output or decision example per major concept.

### Nice to have

- [ ] **MCP integration documented.** If the skill domain has relevant MCP tools, document source routing.
- [ ] **Quick troubleshooting index.** Table mapping symptoms to reference file sections.
- [ ] **Complement declarations tested.** Verify that related skills don't conflict on activation.
- [ ] **Eval set committed alongside the skill.** 16-20 queries (8-10 should-trigger, 8-10 near-miss should-NOT-trigger).
</skill_checklist>

<spec_limits>
## Skill Spec — Hard Limits

| Field / artifact | Limit | Source |
|---|---|---|
| `name` | 64 chars, kebab-case | docs.claude.com — overview |
| `description` (API/spec) | 1024 chars | docs.claude.com — overview |
| `description` + `when_to_use` (Claude Code listing) | 1536 chars combined | code.claude.com docs |
| Total skills listing budget (Claude Code) | 1% of context window, 8000-char fallback | code.claude.com docs |
| Override env var | `SLASH_COMMAND_TOOL_CHAR_BUDGET` | code.claude.com docs |
| SKILL.md body recommended | < 500 lines, target 200 | skill-creator |
| Body tokens loaded | < 5k tokens | overview |
| Upload total (API) | 8 MB | API skills guide |
| Skills per request (API) | 8 | API skills guide |
| Skills per session (Managed Agents) | 20 | Managed Agents docs |

### Frontmatter fields — what's actually recognized

| Field | Required | Surfaces | Notes |
|---|---|---|---|
| `name` | Yes | All | Kebab-case, ≤ 64 chars |
| `description` | Yes | All | ≤ 1024 chars, third-person impératif |
| `license` | No | All | Convention only |
| `allowed-tools` | No | **Claude Code only** | Not honored by Agent SDK |
| `when_to_use` | No | **Claude Code only** | Concatenated with description, 1536-char combined cap |
| `disable-model-invocation` | No | **Claude Code only** | bool, default false |
| `user-invocable` | No | **Claude Code only** | bool, default true |
| `paths`, `model`, `effort`, `agent`, `hooks`, `argument-hint` | No | **Claude Code only** | — |

### Fields that are NOT in the spec

`version`, `author`, `tags`, `metadata` (the standard-open `metadata` field is marked experimental). Adding them silently fails — they don't break the skill but provide nothing. Versioning is external: Git tags for source repos, epoch timestamps for `/v1/skills` API uploads.
</spec_limits>

<command_checklist>
## Command Quality Checklist

### Critical

- [ ] **`description` in frontmatter.** Clear, one-line description of what the command does.
- [ ] **`argument-hint` if command takes input.** Shows usage format: `"[file or directory]"`, `"[topic]"`.
- [ ] **Human/AI ratio stated.** Explicitly state the ratio: "Ratio: 20% human / 80% AI."
- [ ] **Clear output format defined.** What does the command produce? Table, report, file, conversation?
- [ ] **No ambiguous scope.** Command does one thing clearly, not "help with everything."

### Important

- [ ] **Context section present.** Brief explanation of the command's role and when to use it.
- [ ] **Active skills referenced.** If the command relies on specific skills, name them.
- [ ] **Phases structured.** Multi-step commands should have numbered phases with clear transitions.
- [ ] **$ARGUMENTS used for input.** Use `$ARGUMENTS` or `$1`, `$2` for user-provided parameters.

### Nice to have

- [ ] **Command-scoped hooks.** If the workflow needs temporary validation, define hooks in frontmatter.
- [ ] **Suggested next command.** At the end: "After corrections, move to `/next-command`."
- [ ] **allowed-tools restriction.** Commands that should only read (audits) can restrict tools.
</command_checklist>

<validation_workflow>
## Plugin Validation Workflow

### Step 1: Structural validation

```bash
claude plugin validate ~/path/to/plugin
```

This checks:
- `plugin.json` exists and is valid JSON
- Referenced directories (commands/, skills/) exist
- Skill directories have SKILL.md files
- Frontmatter is valid YAML

### Step 2: Context budget estimation

Manually estimate the token cost:
1. Count description length (target: 200-400 chars, max: 1024)
2. Count SKILL.md body lines (target: <200, max: 500)
3. Count total reference files and their sizes
4. Verify inactive cost: only metadata loaded when skill doesn't match

Quick formula for inactive cost:
```
Inactive tokens ≈ (description chars / 4) + 20 (for name + YAML overhead)
```

For a 400-char description: ~120 tokens inactive. Well under the 300 token target.

### Step 3: Activation testing

Test that the skill activates correctly:
1. **Positive test:** Ask a question the skill should handle -> should activate
2. **Negative test:** Ask a question outside the skill's domain -> should NOT activate
3. **Boundary test:** Ask a question in the complement's domain -> should route to complement

### Step 4: Command testing

For each command:
1. Invoke with typical arguments -> should produce expected output format
2. Invoke without arguments (if optional) -> should handle gracefully
3. Check that human/AI ratio feels right -> appropriate level of user interaction

### Step 5: Cross-reference validation

1. Every reference file listed in SKILL.md index exists
2. Every XML section listed in the index exists in the file
3. No broken relative links between SKILL.md and references
</validation_workflow>

<testing_strategies>
## Testing Strategies for Plugins

### Evaluation-driven development

1. Run Claude on representative tasks WITHOUT the plugin installed
2. Identify gaps and failures in Claude's responses
3. Create the plugin content to fill those specific gaps
4. Re-run the same tasks WITH the plugin
5. Compare: did the plugin improve the response?

### Canonical eval methodology (skill-creator)

Anthropic's `skill-creator` encodes a rigorous activation-reliability protocol. Apply it whenever description tweaks matter (skills shipped to teams, plugins published).

1. **Build a 20-query eval set.**
   - 8-10 *should-trigger* queries (positive cases).
   - 8-10 *should-not-trigger* queries — these MUST be **near-misses** ("genuinely tricky"), not trivially unrelated. A PDF skill tested against "write a fibonacci function" is non-discriminant.
2. **Use realistic query format.** File paths, personal context, column names, URLs, inconsistent casing, abbreviations, typos, spoken language.
3. **3 runs per query.** Reduces variance, gives a real activation rate.
4. **60/40 train/test split.** Iterate on description using the train set, but **score and select the version on the test set** — prevents overfit.
5. **Cap iteration at 5 rounds.** Diminishing returns beyond that.
6. **Test on the production model ID.** Activation behavior varies by model — testing on a different one gives misleading results.
7. **Capture metrics at completion.** `total_tokens` and `duration_ms` from subagent notifications are not persisted afterward.

### Lightweight pre-flight test

Before running the full eval, paste the frontmatter into a fresh Claude conversation and ask: *"Generate 3 prompts that should trigger this skill, and 3 that should not."* If Claude struggles or generates obvious near-misses, the description needs work before formal eval.

### Activation reliability testing

Skills auto-activate in ~50-80% of expected cases. Improve reliability:

- **Add more keywords:** Users say things differently than you expect
- **Test across models:** Haiku, Sonnet, Opus may activate differently
- **Check false positives:** Does the skill activate for unrelated queries?
- **Check trivial-query under-trigger.** From `skill-creator`: "Claude only consults skills for tasks it can't easily handle on its own — simple, one-step queries like 'read this PDF' may not trigger a skill even if the description matches perfectly." Trivial queries are bad eval cases.

### Multi-model testing

| Model | Characteristic | Testing focus |
|-------|---------------|---------------|
| Haiku | Fast, less capable | Does the skill give enough guidance for Haiku to succeed? |
| Sonnet | Balanced | Primary testing target |
| Opus | Most capable | Does the skill avoid over-constraining Opus? |

### Regression testing

After modifying a skill:
1. Re-run the positive activation tests
2. Re-run the boundary tests (complement routing)
3. Verify that reference file sections still load correctly
4. Check that context budget hasn't grown unexpectedly
</testing_strategies>

<common_pitfalls>
## Common Plugin Pitfalls

### 1. The skill-as-workflow
**Symptom:** Description summarizes "First X, then Y, then Z." Claude reads the summary, never opens SKILL.md, and the body sits unused.
**Fix:** Skills hold expertise that activates contextually. Multi-step orchestrated workflows belong in commands. If the skill genuinely encodes a procedure, rewrite the description as activation conditions only and put the procedure in the body.

### 2. `references/` at the plugin root
**Symptom:** Files live at `<plugin>/references/...` instead of `<plugin>/skills/<skill>/references/...`. Claude can't load them through the SKILL.md index.
**Fix:** Move `references/`, `scripts/`, and `assets/` INSIDE the skill folder. Each skill owns its own bundled resources.

### 3. Description too vague -> poor activation
**Symptom:** Skill doesn't activate when expected.
**Fix:** Add specific keywords, file patterns, import names, and trigger conditions. Test with the eval methodology (16-20 queries, 3 runs each).

### 4. Body too long -> slow loading, high token cost
**Symptom:** Simple questions consume too many tokens.
**Fix:** Move detailed content to reference files. Keep body under 200 lines with decision matrices and rules. Hard max 500.

### 5. References too deep -> Claude can't find content
**Symptom:** Claude re-reads multiple files before finding the answer.
**Fix:** Keep references one level from SKILL.md. Use XML tags for sections. Add index in SKILL.md.

### 6. Missing boundary markers -> activation conflicts
**Symptom:** Two skills compete to handle the same query.
**Fix:** Add "Complements X" and "SKIP / Do NOT use for Y" to both descriptions.

### 7. Invented frontmatter fields
**Symptom:** Author adds `version: 1.2.0` or `tags: [astro, cloudflare]` to skill frontmatter.
**Fix:** Remove them — they're silently ignored. Versioning is external (Git tags or epoch timestamps from `/v1/skills`).

### 8. `allowed-tools` in non-Claude-Code skill
**Symptom:** Skill expected to restrict tools but works fine on Agent SDK / API.
**Fix:** `allowed-tools` is honored ONLY by Claude Code. For SDK/API, restriction must happen at the agent or system-prompt level.

### 9. Bundled large SDK docs
**Symptom:** Skill ships with a 5000-line copy of an SDK README that goes stale within weeks.
**Fix:** Use `WebFetch` to live README in the SKILL.md instead of bundling. Anthropic's own `mcp-builder` and `claude-api` use this pattern.

### 10. MUST / ALWAYS empilés
**Symptom:** SKILL.md filled with capitalized rules without explanation. Claude follows blindly and breaks on edge cases.
**Fix:** Reframe as "explain the reasoning" — Anthropic's `skill-creator` calls this a yellow flag.

### 11. Commands without output format -> inconsistent results
**Symptom:** Same command produces different formats each time.
**Fix:** Define explicit output format in the command body. Include an example.

### 12. Duplicated content across components -> wasted tokens
**Symptom:** Same table appears in SKILL.md, a reference file, and a command.
**Fix:** Put information in one place. Reference it from others.

### 13. Hooks blocking writes -> confused agent
**Symptom:** Claude keeps retrying writes that get blocked.
**Fix:** Block at commit, not at write. Let the agent work, validate the output.

### 14. Plugin.json listing unused components
**Symptom:** Validation warns about missing directories.
**Fix:** Only include component types you actually use. No `agents` or `hooks` if you have none.
</common_pitfalls>

<publishing_checklist>
## Publishing Checklist

### Before publishing

- [ ] `claude plugin validate` passes with no errors
- [ ] All skills have descriptions with keywords and boundaries
- [ ] All commands have `description` and `argument-hint` in frontmatter
- [ ] SKILL.md body under 200 lines (ideally)
- [ ] Reference files use XML tags for sections
- [ ] Reference file index in SKILL.md is complete and accurate
- [ ] README.md describes what the plugin does, boundary with related plugins, and installation
- [ ] plugin.json has accurate name, version, description, and keywords
- [ ] plugin.json only lists component types that exist (no empty `agents:` or `hooks:`)
- [ ] No time-sensitive content (URLs, version numbers that will change)
- [ ] No sensitive information (API keys, internal paths)

### Marketplace-specific (sebc.dev)

- [ ] Entry added to `.claude-plugin/marketplace.json` with name, source, description, version, keywords
- [ ] Entry added to `publish.json` with file allowlist
- [ ] Transforms defined in `publish.json` if any private content needs stripping
- [ ] `/publish` command run to sync to public repo
</publishing_checklist>
