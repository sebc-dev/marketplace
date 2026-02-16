# Phase 14: Batch Complex - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply XML semantic containers to the 5 remaining complex reference files (build-deploy.md, routing-navigation.md, data-content.md, styling-performance.md, security-advanced.md), completing all 11 files. Pure structural reformatting using the validated pattern from Phases 12-13. Zero content changes.

</domain>

<decisions>
## Implementation Decisions

### Granularity des tags
- Chaque section ## obtient systématiquement son tag — Claude a la discrétion sur les micro-sections (ex: .assetsignore ~5 lignes) mais la règle par défaut est de tout tagger
- Les ### subsections obtiennent un tag SEULEMENT si elles sont **indépendamment queryables** (test strict : chercherait-on cette info seule, sans le contexte parent ?)
- Les blocs de code ne sont JAMAIS isolés dans leur propre tag — ils restent dans le tag de la section parent ##
- security-advanced.md (15 sections ##) : vérifier si certaines sections proches méritent d'être fusionnées. Si les 15 sont des unités sémantiques distinctes, 15 tags est légitime. Le seuil de 5% d'overhead tranche automatiquement.

### Nommage des tags
- Conversion directe du header ## en snake_case — pas de raccourcis ni de simplification
- Headers avec "Decision Matrix", "Selection", "Pattern" : garder le suffixe complet (ex: `output_mode_decision_matrix`, `auth_middleware_pattern`)
- Headers avec caractères spéciaux (`.assetsignore`, `_headers`) : conversion brute mot pour mot (ex: `assetsignore_for_workers_static_assets`, `headers_file_pattern`)
- Slashes dans les headers (`MDX / Markdoc`, `Remark/Rehype`) : remplacer par underscore (ex: `mdx_markdoc_decision`, `remark_rehype_plugin_config`)

### Fichiers à double domaine
- Traitement uniforme pour styling-performance.md et security-advanced.md — 1 tag par ## section, pas de regroupement par sous-domaine
- Pas de tags parents <styling>/<performance> ni <security>/<advanced_content>
- Le mélange sémantique (ex: `shiki_dual_theme_css` à côté de `csp_config`) est acceptable — les tags reflètent la réalité du fichier

### Ordre de traitement
- 5 plans, 1 par fichier (comme Phase 13)
- Ordre par complexité croissante :
  1. build-deploy.md (262 lignes, 13 sections)
  2. routing-navigation.md (273 lignes, 12 sections)
  3. data-content.md (290 lignes, 13 sections)
  4. styling-performance.md (296 lignes, 12 sections)
  5. security-advanced.md (343 lignes, 15 sections)

### Validation
- Par fichier uniquement (comme Phase 13) — la validation croisée complète est réservée à Phase 15
- Checklist par fichier : grep patterns, git diff, overhead, tag count

### Claude's Discretion
- Seuil d'overhead : suivre XML-CONVENTIONS.md (5% pass, 5-6% review, >6% reduce)
- Micro-sections : juger si une section de 3-5 lignes mérite son tag (règle par défaut : oui)
- Fusion de sections proches dans security-advanced.md si sémantiquement justifié

</decisions>

<specifics>
## Specific Ideas

- "15 sections dans security-advanced.md — vérifier si certaines ne sont pas trop proches pour être fusionnées. Si les 15 sont réellement des unités sémantiques distinctes, 15 tags c'est légitime mais c'est aussi un signal que le fichier est peut-être trop gros."
- Le seuil de 5% d'overhead est le garde-fou automatique pour les fichiers avec beaucoup de tags.

</specifics>

<deferred>
## Deferred Ideas

- Splitter security-advanced.md en 2 fichiers (security + advanced content) — considérer pour un futur milestone si le fichier s'avère trop gros après tagging.

</deferred>

---

*Phase: 14-batch-complex*
*Context gathered: 2026-02-04*
