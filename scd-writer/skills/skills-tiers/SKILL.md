---
name: skills-tiers
description: |
  Before installing, forking, copying or trusting a third-party writing skill (humanizer,
  content-creation, doc-coauthoring, an SEO pack, a marketplace plugin, a SKILL.md copied from a
  listing), read this first: the rules that silently degrade French, the rule that now agrees
  with this plugin for the wrong reason, the licence each one really
  carries, and the MCP servers a plugin starts on your behalf.
---

## Three invariants, before anything is installed

**A skill that rewrites the author's text is rejected**, whatever its quality, its licence or its
security record. It violates the cardinal principle (`writing-voice`), and that test is applied first
because it is the cheapest: it settles most candidates before a single file is read.

**A skill is third-party code running with the agent's full rights.** Read the `SKILL.md` and every
script before installing. That is not a posture: a `SKILL.md` can carry a prompt injection in plain
prose, with no code vulnerability for a scanner to find, and the publication bar on open
marketplaces is *a Markdown file and a week-old account*, with no signing, no review, no sandbox.

**Pin what you install.** A commit SHA, or the `metadata.version` the skill declares in its
frontmatter. Prefer sources you can read line by line, and prefer Anthropic's curated and screened
marketplaces to open ones.

## The trap that costs the most here: English writing skills degrade French

This is the whole reason this skill exists. A skill written to clean up AI-sounding English will
break French typography while reporting success.

**`humanizer` (`blader/humanizer`, MIT, v2.9.1, 412 lines, 33 numbered patterns).** Two of its
rules are hostile to French:

| Pattern | What it does | In French |
|---|---|---|
| **§17 Title Case in headings** | flags capitalised main words in headings | **Not applicable.** French does not title-case headings; there is nothing to fix |
| **§19 Curly quotation marks** | treats `"…"` as a ChatGPT tell and wants straight quotes | **Backwards.** French uses `« … »`. Straightening quotes in a French piece is a typographic regression |

**§17 and §19 must be removed**, or the skill's output must be re-checked against French typography
afterwards. Neither has an escape hatch.

**And §14 is the interesting one, because it agrees with this plugin and its escape hatch is the
hazard.** §14 reads *"The em dash is one of the most reliable AI tells, so treat this as a hard
constraint"*, and it scans the final rewrite for `—` and `–`, any hit meaning not done. That is the
same outcome **writing-voice** requires, arrived at from a different premise: `humanizer` believes
the character is wrong, this plugin holds that it is correct and unusable anyway. Agreement on the
verdict, not on the reasoning, and the reasoning is what breaks next.

Because the file declares at the top: *"A sample outranks this skill's style rules, including the em
dash rule in §14: if the sample uses em dashes, keep them at roughly the sample's frequency."*
**Supplying a French writing sample therefore switches §14 off by design**, and a sample is exactly
what this plugin asks the author for. Under this plugin's rule the ban is unconditional and no sample
reaches it (`faux-positifs`, *the one signal this page may not kill*). So §14 needs the same
treatment as §17 and §19 for the opposite reason: not because it is wrong, but because its exemption
is, and a rule that switches itself off on the author's own corpus is worse than no rule.

**Two claims about `humanizer` that its own file refutes.** Its frontmatter carries **no
`allowed-tools` key** and **no `compatibility` key** in v2.9.1. Any advice of the form "limit its
permissions via `allowed-tools`, as humanizer does" rests on nothing in the current file. Check the
frontmatter yourself rather than trusting a description of it.

**What does transpose without translation.** `article-writing` (`affaan-m/ECC`) bans seven patterns,
and three of them are structural rather than lexical: fake vulnerability arcs, a closing question
added only to juice engagement, biography padding that does not move the argument. Those are the same
failures in any language. The other four are English phrases and need rewriting, not translating.

**And a contradiction between two skills the ecosystem recommends together.** `content-creation`
writes `Do not keyword-stuff [em dash] write for humans first`, dash and all, in the very file that
`humanizer` would flag as one of the most reliable AI tells. Neither of them settles it, and neither
of them gets to: here it is settled upstream of both, by the author's voice rule in
**writing-voice**. The dash goes. Note what does *not* decide it, since this is where the earlier
version of this file went wrong: not French typography, which favours keeping it, and not
`humanizer`, which would drop it for a reason this plugin does not hold.

## Licences: what you find when you open the file

The ecosystem's summaries of these are wrong often enough that the file has to be opened. All read at
source on 2026-08-13.

| Artefact | Licence actually found |
|---|---|
| `anthropics/skills` (repository root) | **none.** There is no `LICENSE` at the root; licence is carried **per skill** |
| `doc-coauthoring` | **none at all.** No own `LICENSE.txt`, no repository licence. `THIRD_PARTY_NOTICES.md` covers embedded dependencies only, and the README says *"**Many** skills in this repo are open source (Apache 2.0)"*, which is a statement and not a grant, and "many" is not "all" |
| `brand-guidelines`, `internal-comms` | Apache-2.0, read in each skill's own `LICENSE.txt` |
| `docx`, `pdf`, `pptx`, `xlsx` | proprietary, source-available: *"Use of these materials […] is governed by your agreement with Anthropic"* |
| `anthropics/knowledge-work-plugins` | **Apache-2.0**, not MIT |
| `blader/humanizer` | MIT, declared in the frontmatter |
| `matsuikentaro1/humanizer_academic` | **NOASSERTION.** The claimed MIT filiation from `blader` is not attested at repository level |
| `brand-voice` | MIT, **© Tribe AI**, hosted by Anthropic and owned by a partner. "Official" here means hosted, not authored |

**The consequence that matters: installing and forking are different acts.** `doc-coauthoring` is the
most reusable official skill for long-form work: pure process, no scripts, no hard-coded style
rules, no mention of language or locale, which is what makes it usable in French. It is also the one
most often recommended *to fork*, and **a fork of it has no explicit legal basis**. Install it,
depend on it, point at it. Do not copy it into this plugin without settling that first.

## A plugin can start MCP servers on your behalf

They start automatically for every user of the plugin, the moment it is activated.

- **`brand-voice` is not a skill, it is a full plugin**, with agents, commands, settings, and **three**
  skills (`brand-voice-enforcement`, `discover-brand`, `guideline-generation`). It ships a
  `.mcp.json` declaring five **remote** servers: Notion, Atlassian, Box, Figma, Gong. Any inventory
  that calls it "pure Markdown, no API" is wrong about it.
- **`seranking/seo-skills`** declares one server at the repository root, its own publisher's
  (`api.seranking.com/mcp`). Gating behind a paid API is real for this one.
- **`AgriciDaniel/claude-seo` has no `.mcp.json` at its root**, contrary to what is often assumed. It
  is a suite of 20+ skills, only one of which names a vendor (`seo-dataforseo`), and it ships
  `AGENTS.md`, `CLAUDE.md`, `SECURITY.md`, `PRIVACY.md`, `CITATION.cff`, better governance signals
  than its reputation suggests. Its skill bodies have not been read here, so this is a correction to
  the reputation, not an endorsement.

**The rule this plugin holds itself to: it embeds no `.mcp.json`.** A server published by the
technology's own vendor could be embedded; a third-party server is documented, with the install command
written out, never run. Every semantic-SEO server encountered in this domain (SE Ranking,
YourTextGuru, and the five in `brand-voice`) is third-party by that test.

## The supply chain, measured and dated

| Audit | Scope | Findings |
|---|---|---|
| **Snyk "ToxicSkills"**, 2026-02-05 | 3 984 skills (ClawHub + skills.sh) | 36,82 % (1 467) with at least one flaw, 13,4 % (534) critical, **76 confirmed malicious payloads**; hard-coded secrets in 10,9 % of all skills and 32 % of confirmed-malicious samples; 91 % of malicious ones combined prompt injection with a shell payload |
| **Koi "ClawHavoc"**, early 2026 | 2 857 ClawHub skills | 341 malicious, of which 335 belong to one coordinated operation distributing Atomic macOS Stealer through fake "Prerequisites" sections |
| **Mobb.ai** | 22 511 public skills | 140 963 issues |

**A scope correction that changes how all of this reads: ClawHub is OpenClaw's skill marketplace, not
Claude's.** OpenClaw is a self-hosted assistant, formerly Clawdbot then Moltbot. These figures
describe open, unaudited marketplaces and **overstate the risk of Anthropic's official sources**,
which are curated or automatically screened and pinned to a commit SHA.

> **Open disagreement, not settled here.** On the same ClawHavoc episode, several publications report
> **1 184** malicious skills where Koi counts **341**. Both figures circulated in August 2026. Cite
> Koi, which is the primary source of the audit, and say that higher counts exist. Do not average
> them and do not pick one silently.

## French writing skills exist, and are still not dependencies

`prompt-engine.fr` serves 29 installable skills in French, seven of them in a Writing category:
"Rédacteur Français Pro", "Correcteur Français", "SEO Writer" among them, with the `SKILL.md`
readable directly on the page. So "nothing French is consultable" is false, and any claim resting on
that premise needs restating.

The conclusion survives for a different reason, and it is the one to give: **no repository, no
outbound link, no licence, no version number, no history**, install by manual copy-paste into
`~/.claude/skills/`. Nothing there can be pinned, audited or updated. Two of them sit exactly on the
gaps this plugin fills, so the case for building rather than adopting is now about governance, not
about absence.

## One more thing a fork inherits

`content-creation` declares `user-invocable: false`. It never fires as a command, only by
description-matching. A fork keeps that unless the fork changes it, which is a silent way for a
forked skill to appear broken.

## Inventory

The dated repository table (stars, forks, declared licence, last push) and the verbatim licence
extracts are in **`references/inventaire-2026-08.md`**. Load it before forking or citing any figure
about a repository. It is a snapshot and says so at the top.

## Handoffs

This file decides whether a third-party skill comes in at all. Once one is already running and firing
on legitimate French, `faux-positifs` decides what to do about each hit. And the one
`content-creation` contradiction that changes a draft, the 60/160 character limits, is settled in
`seo-editorial`, not here.
