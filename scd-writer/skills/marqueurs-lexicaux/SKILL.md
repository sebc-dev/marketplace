---
name: marqueurs-lexicaux
description: |
  Active during /review and /polish. Analyzes the statistical signature of text to detect
  LLM origin — beyond individual words (slop-vocabulary) into distribution patterns, lexical
  diversity metrics, n-gram analysis, burstiness, and register leveling. Provides concrete
  checklist for /review. Source: R3 (Les empreintes invisibles des LLM).
---

## Scope: what vs how

This skill is clearly separated from slop-vocabulary:
- **slop-vocabulary** = *what* to detect (specific words and expressions with excess ratios)
- **marqueurs-lexicaux** = *how* to detect (statistical methods that reveal AI origin even when individual words seem normal)

Even when an LLM avoids every word on the banned list, its text still carries a statistical fingerprint — a biased token probability distribution that creates involuntary watermarking.

## Key metrics

### Type-Token Ratio (TTR) and MTLD

TTR = unique words / total words. Lower TTR = more repetitive vocabulary. LLM text tends toward lower diversity — a smaller vocabulary recycled more often.

**MTLD (Measure of Textual Lexical Diversity):** Sequential TTR with threshold 0.72. The most important feature in XGBoost classifiers, achieving **F1 = 94%** for AI detection (DivEye framework, Basani & Chen, 2025). MTLD outperforms perplexity as a detection feature.

**What to look for:** Does the text reuse the same vocabulary patterns across paragraphs? Human writers naturally introduce new vocabulary as they develop ideas. LLMs tend to establish a vocabulary in the first paragraph and recycle it.

### Shannon entropy

Entropy measures unpredictability. LLM text has lower entropy — each next word is more "expected" than in human text. The probabilistic nature of generation biases toward high-probability tokens.

**What to look for:** Does every word feel inevitable? If you could predict the next word with high confidence at most points in the text, the entropy is suspiciously low.

### N-gram order analysis

From DNA-GPT (Yang et al., ICLR 2024): detection improves dramatically with n-gram order.
- Unigrams: AUROC ~58% (barely better than chance)
- Bigrams: ~72%
- Trigrams: ~83%
- 4-grams: ~90%
- **6-grams: ~97%** (near-perfect discrimination)

**Implication:** Word-level analysis (slop-vocabulary) catches the obvious cases. But high-order co-occurrence patterns — how sequences of 4-6 words chain together — are the most powerful discriminating signal. This is why LLM text "sounds right" word by word but feels mechanical at the paragraph level.

### Burstiness

Variation of perplexity (or surprisal) scores sentence by sentence across a document. Human text is "bursty" — alternating between predictable passages and surprising ones. LLM text has flat surprisal distribution.

**Measurement:** Coefficient of variation of per-sentence perplexity.
- AI text: low CV, symmetric distribution, low skewness
- Human text: high CV, positive skewness, high kurtosis (rare but extreme surprisal spikes)

**What to look for:** Does the text maintain the same "energy level" throughout? Does every sentence feel equally smooth? Human writing has peaks and valleys — a technical sentence followed by a conversational aside, a complex argument followed by a short punch.

**Caveat:** Burstiness is biased against non-native speakers. Liang et al. (Stanford) found 61.22% false positive rate on TOEFL essays. Do not use burstiness alone as an AI signal for FR authors writing in EN.

### Register leveling

From Reinhart et al. (PNAS 2025): instruction-tuned models produce an "informationally dense noun-heavy style regardless of genre." This is the most operationally useful metric for blog writing.

**Key data:**
- Content/function word ratio: humans average 0.98, AI averages **1.37**
- Nominalizations: AI uses ~2x more than humans
- Present participial clauses: AI uses **5.3x** more than humans
- Agentive passive voice: AI uses ~0.5x less than humans (AI avoids it)
- Modal verbs, epistemic markers: AI uses significantly fewer

**What to look for:** Does a blog post read like an academic paper? Does an opinion piece sound like a technical report? If the register doesn't match the genre, the text may be AI-influenced. Human writers naturally adjust formality to context — LLMs converge to a single register.

## GLTR visualization concept

GLTR (Gehrmann et al., ACL 2019) buckets tokens by their rank in the model's prediction:
- **Top-10 predictions (green):** Expected words
- **Top-100 (yellow):** Somewhat expected
- **Top-1000 (red):** Unusual choices
- **Beyond 1000 (purple):** Highly unexpected

AI text is "mostly green and yellow." Human text has more red and purple tokens — unexpected word choices, register breaks, creative vocabulary.

**Practical application:** When reviewing text, ask: how many words in this paragraph would surprise a predictive model? If the answer is "almost none," it's suspiciously smooth.

## Calibration by article type

| Article type | Key metric to watch | Sensitivity |
|-------------|-------------------|-------------|
| Opinion/reflection | Register leveling — biggest risk. Should sound personal, not academic. | High |
| Experience report (REX) | Burstiness — lived stories are naturally bursty. Flat = suspect. | High |
| Technical/dev | N-gram patterns — technical jargon creates legitimate repetition. Raise thresholds. | Medium |
| Tutorial/guide | Low burstiness is somewhat natural for step-by-step. Focus on MTLD and register instead. | Medium-low |

## Concrete /review checklist

When reviewing an article, evaluate these 6 dimensions:

### 1. Sentence length variance
Measure or estimate the coefficient of variation of sentence lengths.
- CV < 0.15: Almost certainly AI-influenced (flag as Critical)
- CV 0.15-0.30: Suspect (flag as Major)
- CV > 0.40: Normal human range
- CV > 0.70: Highly bursty, characteristic of experienced writers

### 2. SVO monotony
Does every sentence follow Subject-Verb-Object order? Human writing naturally varies: questions, inversions, fragments, sentences starting with subordinate clauses, one-word sentences for emphasis.

### 3. Collocation density
Beyond individual markers (slop-vocabulary), look for chains of "safe" word combinations. Three consecutive sentences using common collocations is a stronger signal than any single unusual word.

### 4. Register-genre match
Does the writing register match what you'd expect for this genre?
- Blog post reading like an academic paper: flag
- Opinion piece with no first person: flag
- Tutorial with literary flourishes: flag
- REX with zero hedging or self-doubt: flag

### 5. Absence of imperfections
Human text contains: sentence fragments, informal connectors ("And", "But", "So"), self-corrections, parenthetical asides, register breaks, humor, one-sentence paragraphs. Total absence of all these is itself a signal.

### 6. Vocabulary recycling
Does the text reuse the same descriptors across sections? Does every technology get called "powerful" or "flexible"? Does every benefit get introduced with "importantly"? Vocabulary recycling across paragraphs is a sign of limited token diversity.

## Relationship with other skills

- **slop-vocabulary**: This skill provides the *what*, marqueurs-lexicaux provides the *how*. Use both together.
- **structure-symetrique**: Handles structural patterns (section lengths, templates). This skill handles within-paragraph textual patterns.
- **fausse-profondeur**: Handles rhetorical figures. This skill handles statistical distribution.
- **writing-voice**: Consumes findings from this skill — burstiness and register variation are core to "what makes human writing recognizable."
