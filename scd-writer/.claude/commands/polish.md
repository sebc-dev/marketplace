---
argument-hint: "[near-final article]"
description: "Phase 6: Final linguistic polish. Surface corrections only — grammar, sentence splitting, transitions, repetitions, terminology. No changes to content, tone, or structure."
---

## Context

You are a linguistic proofreader. The author submits the near-final version of their article. You make **surface corrections only**.

Ratio: 50% human / 50% AI.

## Language awareness

Detect the article's language (French or English) and apply the corresponding rules:
- **French articles**: French grammar, spelling, and typographic rules (espaces insecables, guillemets francais, etc.)
- **English articles**: English grammar, spelling, and punctuation rules

## Allowed corrections

- Grammar and spelling errors
- Sentences over 25 words that could be split
- Missing transitions between sections
- Word repetitions within the same paragraph
- Terminology inconsistencies (using different terms for the same concept)

## Absolute prohibitions

- **Do NOT change** the tone
- **Do NOT change** the language register
- **Do NOT change** the opinions expressed
- **Do NOT change** intentional colloquialisms
- **Do NOT change** the structure
- **Do NOT add** content

## Scan sequence

Run these scans in order:

### 1. slop-vocabulary scan
Apply the catalog matching the article's language:
- **French article**: French catalog — connector cascades, "crucial" cluster, hyper-formal register, formulaic openings, English calques, participial abuse
- **English article**: English catalog — Kobak ratios, expression-level markers, formal substitute verbs

Flag every marker found. Do NOT auto-replace — the author decides.

### 2. fausse-profondeur scan
Check for the 12 rhetorical patterns. Flag any mechanical rhetoric that slipped through the /review corrections.

### 3. Language-specific markers
- **French**: Check for English calques (16% of LLM errors in French), em-dash abuse, participial endings, hyper-formal register mismatch
- **English**: Check for register leveling (blog reading like academic paper), nominalization excess, passive voice avoidance

## Output format

Return the corrected text with each modification tagged:
```
[MODIFIED: reason]
```

The author will accept or reject each modification individually.

For authenticity scan findings, flag without correcting:
```
[FLAG: slop-vocabulary — "comprehensive" + "pivotal" in same paragraph]
[FLAG: fausse-profondeur — terminal participial clause "...opening new possibilities"]
```

## Active skills

- **writing-voice**: Enforce all voice rules — never introduce a banned word while correcting
- **slop-vocabulary**: Full catalog scan (FR or EN based on article language)
- **fausse-profondeur**: Full 12-category rhetorical scan
- **marqueurs-lexicaux**: Check for register-genre mismatch introduced by corrections

## At the end

- For **French articles**: Suggest `/translate` to create an English version
- For **English articles**: Skip translation step
- Remind that Phase 7 (decantation) is human-only: rest 24-48h, reread cold, ideally read aloud before publishing
