<skill_checklist>
## Skill Quality Checklist

### Critical (must fix before publishing)

- [ ] **Description has activation keywords.** Include domain terms, file patterns, action verbs, and technology names that users will mention.
- [ ] **Description has boundary markers.** "Do NOT use for X" and/or "Complements Y for Z" prevents activation conflicts.
- [ ] **name field matches directory name.** `name: plugin-architecture` in `skills/plugin-architecture/SKILL.md`.
- [ ] **name is kebab-case.** Lowercase, hyphens only. Max 64 characters.
- [ ] **SKILL.md starts with frontmatter.** No blank line before `---`. First three bytes must be `---`.
- [ ] **Body under 500 lines.** Target 200. Move detailed content to reference files.

### Important (should fix)

- [ ] **Decision matrices in body.** Quick-reference tables that apply to most activations belong in SKILL.md, not references.
- [ ] **Reference file index present.** List each reference file with its XML sections so Claude knows what to load.
- [ ] **References one level deep.** SKILL.md -> reference. Never reference -> reference.
- [ ] **No time-sensitive information.** No versions, dates, or URLs that will become stale.
- [ ] **Concrete examples provided.** At least one input/output or decision example per major concept.

### Nice to have

- [ ] **MCP integration documented.** If the skill domain has relevant MCP tools, document source routing.
- [ ] **Quick troubleshooting index.** Table mapping symptoms to reference file sections.
- [ ] **Complement declarations tested.** Verify that related skills don't conflict on activation.
</skill_checklist>

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

### Activation reliability testing

Skills auto-activate in ~50-80% of expected cases. Improve reliability:

- **Add more keywords:** Users say things differently than you expect
- **Test across models:** Haiku, Sonnet, Opus may activate differently
- **Check false positives:** Does the skill activate for unrelated queries?

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

### 1. Description too vague -> poor activation
**Symptom:** Skill doesn't activate when expected.
**Fix:** Add specific keywords, file patterns, and trigger conditions. Test with actual user queries.

### 2. Body too long -> slow loading, high token cost
**Symptom:** Simple questions consume too many tokens.
**Fix:** Move detailed content to reference files. Keep body under 200 lines with decision matrices and rules.

### 3. References too deep -> Claude can't find content
**Symptom:** Claude re-reads multiple files before finding the answer.
**Fix:** Keep references one level from SKILL.md. Use XML tags for sections. Add index in SKILL.md.

### 4. Missing boundary markers -> activation conflicts
**Symptom:** Two skills compete to handle the same query.
**Fix:** Add "Complements X" and "Do NOT use for Y" to both descriptions.

### 5. Commands without output format -> inconsistent results
**Symptom:** Same command produces different formats each time.
**Fix:** Define explicit output format in the command body. Include an example.

### 6. Duplicated content across components -> wasted tokens
**Symptom:** Same table appears in SKILL.md, a reference file, and a command.
**Fix:** Put information in one place. Reference it from others.

### 7. Hooks blocking writes -> confused agent
**Symptom:** Claude keeps retrying writes that get blocked.
**Fix:** Block at commit, not at write. Let the agent work, validate the output.

### 8. Plugin.json listing unused components
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
