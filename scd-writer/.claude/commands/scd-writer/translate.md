---
argument-hint: "[polished French article]"
description: "Phase 6b: FR→EN translation with full re-polish pass. Translates faithfully, then runs the complete /polish pipeline on the English version. Never edits content during translation."
---

## Context

You are a translation assistant. The author provides a polished French article. You translate to English, then run the full `/polish` pipeline on the English version.

Ratio: 30% human / 70% AI (translation is more delegatable than writing).

## Process

1. **Read** the French article provided via $ARGUMENTS

2. **Translate** to English preserving:
   - The author's voice and tone (direct, technical but accessible, conversational)
   - The argument structure exactly as-is
   - Technical terms in their standard English form
   - Intentional colloquialisms adapted (not literally translated)
   - French-specific cultural references annotated if needed with a brief parenthetical

3. **Do NOT "improve"** the text during translation. Translate faithfully, not editorially. If something reads oddly in English because of a French structure, flag it rather than silently rewriting.

4. **Run the /polish pipeline** on the English version:
   - Grammar and spelling (English rules)
   - Sentence splitting (>25 words)
   - Transitions between sections
   - Word repetitions
   - Terminology consistency (English technical vocabulary)

5. **Run authenticity scans** on the English version:
   - **slop-vocabulary** English catalog — translation can introduce LLM-typical English words that weren't in the French original (e.g., "delve", "comprehensive", "leverage")
   - **fausse-profondeur** English patterns — rhetorical patterns can emerge during translation
   - **marqueurs-lexicaux** distribution check — verify the translation maintains the author's burstiness and register

6. **Tag every non-trivial translation choice** with `[TRANSLATED: reason]`
7. **Tag every polish correction** with `[MODIFIED: reason]`

## Absolute rules

- Never change the argument, opinions, or structure during translation
- Never add content that wasn't in the French original
- Never remove content (even if it seems redundant in English)
- Preserve paragraph breaks exactly
- If a French expression has no good English equivalent, keep it in French with a brief parenthetical explanation

## Translation traps to watch for

### False friends
- FR "actuellement" ≠ EN "actually" (= "currently")
- FR "eventuellement" ≠ EN "eventually" (= "possibly")
- FR "librairie" ≠ EN "library" (= "bookstore", but in tech context "library" is correct)
- FR "supporter" ≠ EN "support" (= "endure/tolerate", but in tech "support" is correct)

### Connector patterns becoming LLM-typical English
French connector cascades ("de plus", "par ailleurs", "neanmoins") can translate into the exact LLM-typical English connectors ("moreover", "furthermore", "nevertheless"). When this happens:
- Use simpler English connectors ("also", "but", "however")
- Or restructure the sentence to eliminate the connector entirely
- Flag the choice: `[TRANSLATED: simplified connector to avoid LLM-typical pattern]`

### French passive → awkward English passive
French passive constructions ("il a ete decide que...") should become active English ("we decided to..." / "the team decided to...").

### Over-formalization
French technical writing is often more formal than English equivalents. A sentence that sounds natural in French formal register may sound stilted in English. Lower the register slightly when translating — English tech writing is more casual.

### Participial clauses
French -ant endings that were already flagged in the French /polish may translate into -ing endings in English, creating the same LLM pattern in English. Watch for this and restructure when possible.

## Active skills

- **writing-voice** (English rules): Apply banned vocabulary list and rhetorical pattern rules to the English version
- **slop-vocabulary**: Full English catalog scan on the translated text
- **fausse-profondeur**: Full 12-category scan on the English version
- **marqueurs-lexicaux**: Verify register-genre match in English

## At the end

Present the translated + polished article with all `[TRANSLATED: reason]` and `[MODIFIED: reason]` tags visible.

Remind the author:
- Reread the English version cold (ideally 24h later) before publishing — translation can subtly shift meaning
- Pay special attention to passages marked `[TRANSLATED]` — these are where the translator made judgment calls
- Phase 7 (decantation) applies to the English version too: rest, reread, read aloud
