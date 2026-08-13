# The measurements behind the guardrail

Loaded only when the author contests the redirect, or asks where the numbers come from.
Source: R2, `docs/rapports/2 - Longueur de génération et qualité des LLM.md`.

## Where single-prompt quality breaks down

| Study / benchmark | Degradation threshold | Evidence |
|----------------|----------------------|----------|
| WritingBench | ~3 000 tokens | Quality drops sharply beyond this point |
| LongWriter | ~2 000 words | Coherence and specificity degrade |
| Chroma | 2 500–5 000 words | Ceiling of single-generation quality |

## Iterative superiority: eight confirming studies

| Study | Year / venue | Improvement | Key finding |
|-------|-----------|-------------|-------------|
| Self-Refine | NeurIPS 2023 | ~20 % | Iterative self-feedback outperforms single-pass across tasks |
| CogWriter | ACL 2025 | 22 % | Structured decomposition beats single-prompt for long-form |
| PEARL | 2024 | 15–25 % | Plan-then-write improves coherence in long documents |
| Sparks (Microsoft) | 2023 | Qualitative | Multi-step prompting essential for complex reasoning |
| Constitutional AI | Anthropic 2023 | Variable | Iterative revision improves alignment and quality |
| Chain-of-Thought | Various 2023-24 | 10–40 % | Decomposition improves reasoning quality |
| DSPy | Stanford 2024 | 15–30 % | Modular decomposition outperforms monolithic prompts |
| RecurrentGPT | 2023 | Qualitative | Paragraph-by-paragraph generation maintains coherence |

The 15–57 % range quoted in the redirect is the span across these studies. The first revision pass
produces the biggest jump; past three, returns diminish and the text starts to over-smooth.
