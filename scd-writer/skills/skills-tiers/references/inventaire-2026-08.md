# Reference: third-party writing skills, snapshot of August 2026

**Load point.** Read this before forking a third-party skill, before citing any figure about a
repository, or when a summary of the ecosystem needs checking against what the repositories say. The
rules for deciding are in `SKILL.md` and are not repeated here; this file carries figures and
provenance only.

> **Snapshot, not state.** Everything below was read on **2026-08-13**, repository metadata by
> `gh api repos/{owner}/{repo}`, file contents by `gh api …/contents/…` in raw media type. Star
> counts moved by tens of percent in the two months before this reading; **licences change too**, and
> a licence is the one field that must be re-read at the moment of forking rather than trusted here.
> The "version" of a skill is its commit SHA plus whatever `metadata.version` its frontmatter
> declares. Read both.

- [Repositories](#repositories)
- [What the reading corrected](#what-the-reading-corrected)
- [Licence extracts, verbatim](#licence-extracts-verbatim)
- [`brand-voice` and the embedded MCP servers](#brand-voice-and-the-embedded-mcp-servers)
- [Frontmatters worth having read](#frontmatters-worth-having-read)
- [What was not read](#what-was-not-read)

## Repositories

`Licence` is `license.spdx_id` **declared at repository level**; `none` means none is declared *there*,
not that none exists anywhere.

| Repository | ★ | forks | Licence (repo) | Last push | Created |
|---|---|---|---|---|---|
| `anthropics/skills` | 168 593 | 20 085 | **none** | 2026-08-07 | 2025-09-22 |
| `anthropics/knowledge-work-plugins` | 23 453 | 2 830 | **Apache-2.0** | 2026-08-13 | 2026-01-23 |
| `anthropics/claude-plugins-official` | 33 467 | 3 779 | Apache-2.0 | 2026-08-13 | 2025-11-20 |
| `anthropics/claude-plugins-community` | 345 | 90 | Apache-2.0 | 2026-08-12 | 2026-03-20 |
| `ComposioHQ/awesome-claude-skills` | 72 392 | 8 247 | none | 2026-08-10 | 2025-10-17 |
| `VoltAgent/awesome-agent-skills` | 30 158 | 3 240 | MIT | 2026-08-12 | 2025-10-28 |
| `blader/humanizer` | 35 342 | 3 160 | MIT | 2026-07-22 | 2026-01-18 |
| `jooray/humanizer` | 37 | 1 | MIT | 2026-07-22 | 2026-03-17 |
| `matsuikentaro1/humanizer_academic` | 163 | 26 | **NOASSERTION** | 2026-08-11 | 2026-02-04 |
| `affaan-m/ECC` | 239 791 | 36 397 | MIT | 2026-08-12 | 2026-01-18 |
| `Yaroslavle/seo-content-writer-claude-skill` | 27 | 4 | none | 2026-03-28 | 2026-03-28 |
| `nadiem99/claude-writing-skills` | **1** | 0 | MIT | 2026-07-02 | 2026-04-30 |
| `xiaomoBoy/claude-writing-skills` | 29 | 3 | MIT | 2026-05-25 | 2026-05-25 |
| `AgriciDaniel/claude-seo` | 14 045 | 2 039 | MIT | 2026-07-27 | 2026-02-07 |
| `seranking/seo-skills` | 117 | 28 | MIT | 2026-06-25 | 2026-04-24 |
| `IrtezaAsadRizvi/article-writing-skills` | 14 | 1 | MIT | 2026-04-19 | 2026-04-19 |

Two spellings to get right: the owner is **`AgriciDaniel`** with a lowercase i, and GitHub's
case-insensitive routing hides the difference until something needs the canonical form. And
`nadiem99/claude-writing-skills` has **one star**, which is worth knowing before treating it as an
active project.

## What the reading corrected

Written down because these are the kind of facts a summary gets wrong in the same direction twice.

| Claim in circulation | What the source says |
|---|---|
| `knowledge-work-plugins` is MIT | **Apache-2.0**, in the SPDX field *and* in the body of `LICENSE` |
| `anthropics/skills` is "mostly Apache 2.0" | no repository licence at all; it is per skill, and not all skills have one |
| `doc-coauthoring` is Apache 2.0 | it has **no licence**; see extracts below |
| `humanizer` is "≈622 lines, 33-34 patterns, v2.8.x–2.9.x" | 412 lines, 29 632 bytes, **exactly 33** patterns numbered 1 to 33, `metadata.version: "2.9.1"` |
| `humanizer` restricts itself via `allowed-tools` | **no `allowed-tools` key** in the v2.9.1 frontmatter, and no `compatibility` key either |
| `brand-voice` is a skill, pure Markdown, no API | a full plugin with agents, commands, settings, **three** skills, and a `.mcp.json` for five remote servers |
| `brand-voice` is MIT under Anthropic | MIT **© Tribe AI** |
| `humanizer_academic` is MIT, derived from blader | **NOASSERTION** at repository level |
| `AgriciDaniel/claude-seo` gates behind a paid MCP | **no `.mcp.json` at the root**; one skill among 20+ names a vendor |
| `content-research-writer` is language-agnostic | **verified**: 538 lines, zero occurrences of `language`, `locale`, `english`, `french`, no scripts |
| French writing skills are not consultable anywhere | `prompt-engine.fr/claude-skills` serves 29, seven in Writing, `SKILL.md` readable on the page |

## Licence extracts, verbatim

**`anthropics/skills` root, complete listing:** `.claude-plugin`, `.gitignore`, `README.md`,
`THIRD_PARTY_NOTICES.md`, `skills`, `spec`, `template`. **No `LICENSE`.**

**The README clause that grants nothing**, line 20:

```
Many skills in this repo are open source (Apache 2.0). We've also included the document creation
& editing skills that power Claude's document capabilities under the hood in the skills/docx,
skills/pdf, skills/pptx, and skills/xlsx subfolders. These are source-available, not open source
```

"Many", not "all". And `THIRD_PARTY_NOTICES.md` attributes **embedded third-party dependencies**
(imageio, imageio-ffmpeg, BSD 2-Clause). It concedes rights to third parties over their own code,
never to anyone over the skills.

**`doc-coauthoring/` contains `SKILL.md` and nothing else.** No `LICENSE.txt`. Combined with the two
facts above: **no licence, from any direction.**

**`skills/docx/LICENSE.txt`**, the proprietary status of the document skills:

```
© 2025 Anthropic, PBC. All rights reserved.
LICENSE: Use of these materials (including all code, prompts, assets, files,
and other components of this Skill) is governed by your agreement with
Anthropic regarding use of Anthropic's services.
```

**`skills/brand-guidelines/LICENSE.txt`** and **`skills/internal-comms/LICENSE.txt`** both open with
`Apache License / Version 2.0, January 2004`. So does `knowledge-work-plugins/LICENSE`.

**`partner-built/brand-voice/LICENSE`:**

```
MIT License

Copyright (c) 2025 Tribe AI
```

## `brand-voice` and the embedded MCP servers

Directory contents: `.claude-plugin`, `.mcp.json`, `LICENSE`, `README.md`, `agents`, `commands`,
`settings`, `skills`. The three skills are `brand-voice-enforcement`, `discover-brand`,
`guideline-generation`.

```json
{ "mcpServers": {
    "notion":    { "type": "http", "url": "https://mcp.notion.com/mcp" },
    "atlassian": { "type": "http", "url": "https://mcp.atlassian.com/v1/mcp" },
    "box":       { "type": "http", "url": "https://mcp.box.com" },
    "figma":     { "type": "http", "url": "https://mcp.figma.com/mcp" },
    "gong":      { … } } }
```

And `seranking/seo-skills`, at its root:

```json
{ "mcpServers": { "se-ranking": { "url": "https://api.seranking.com/mcp" } } }
```

## Frontmatters worth having read

**`content-creation`.** Note the second sentence of the description, which is the trigger clause,
and the `user-invocable` key:

```yaml
name: content-creation
description: Draft marketing content across channels: blog posts, social media, email newsletters, landing pages, press releases, and case studies. Use when writing any marketing content, when you need channel-specific formatting, SEO-optimized copy, headline options, or calls to action.
user-invocable: false
```

**`doc-coauthoring`.** Minimal: no `license`, no `allowed-tools`, no `metadata`. Its shape, by line
number: `When to Offer This Workflow` (10), `Stage 1: Context Gathering` (28), `Stage 2: Refinement &
Structure` (104), `Stage 3: Reader Testing` (242), `Final Review` (333), `Tips` (350). No scripts, no
banned-word list, no readability formula, no mention of language.

**`humanizer` v2.9.1.** Six sections: `CONTENT PATTERNS` (1-6), `LANGUAGE AND GRAMMAR PATTERNS`
(7-13), `STYLE PATTERNS` (14-19), `COMMUNICATION PATTERNS` (20-22), `FILLER AND HEDGING` (23-33),
then `DETECTION GUIDANCE` and `Invocation Modes`; preceded by `Your Task`, `Voice Calibration`,
`PERSONALITY AND SOUL`.

**`article-writing`'s banned patterns**, complete:

```markdown
- "In today's rapidly evolving landscape"
- "game-changer", "cutting-edge", "revolutionary"
- "here's why this matters" as a standalone bridge
- fake vulnerability arcs
- a closing question added only to juice engagement
- biography padding that does not move the argument
- generic AI throat-clearing that delays the point
```

## What was not read

Named so that nobody treats absence as a verdict.

- **The bodies of `seranking/seo-skills` and `AgriciDaniel/claude-seo`.** The MCP dependency of the
  first is established by its configuration file, not by its skills; the second's governance signals
  are file listings, not content. Neither suite has been assessed on what it actually teaches.
- **Per-file commit history.** Reachable by `gh api …/commits?path=…`, not collected.
- **`brand-guidelines` as a template.** 73 lines, and it is Anthropic's own colours and typography,
  duplicating it is trivial, but there is no parameterisation mechanism to inherit.

## Pinned URLs

| URL | What it carries |
|---|---|
| `https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/` | the ToxicSkills audit, source of the 36,82 % / 534 / 76 figures |
| `https://snyk.io/articles/skill-md-shell-access/` | the "SKILL.md → shell" threat model |
| `https://www.koi.ai/blog/clawhavoc-341-malicious-clawedbot-skills-found-by-the-bot-they-were-targeting` | ClawHavoc, primary source of the 341 |
| `https://thenewstack.io/ai-agent-skills-security/` | the Mobb.ai audit of 22 511 skills |
| `https://github.com/anthropics/skills` | the reference repository |
| `https://github.com/blader/humanizer` | `humanizer` |
| `https://prompt-engine.fr/claude-skills` | the 29 French skills, `SKILL.md` readable on the page |

`https://snyk.io/blog/toxicskills-claude-skills-security-research/` is the form one guesses. It
**404s**; only the URL above answers.

**A GitHub-specific mechanic worth keeping.** GitHub's `robots.txt` disallows `/*/tree/`, `/*/raw/`,
`/*/blame/`, `/*/*/commits/`, `/*/*/compare`, `/*/*/forks`, `/*/*/tags`, `/*/*/stargazers`, but
**not `/blob/`**. A `…/blob/<ref>/path/SKILL.md` URL and a repository root are both fetchable; a
`…/tree/…` URL is not. When a source needs to be readable by a fetching agent, give the `/blob/`
form.
