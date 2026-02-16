# Phase 12: Pilot - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the XML container pattern on `cloudflare-platform.md` as the single pilot file. Every functional section gets a descriptive XML wrapper. Zero content changes — only XML tag lines are added. The result serves as the validated template for phases 13-14. A standalone XML conventions document is produced BEFORE applying the pattern.

</domain>

<decisions>
## Implementation Decisions

### Tag naming conventions
- **snake_case** strict for all tag names (ex: `<quick_reference>`, `<platform_proxy>`, `<binding_types>`)
- **Tags universels** (présents si le contenu existe, jamais forcés sur du vide) :
  - `<quick_reference>` — matrice/cheatsheet
  - `<anti_patterns>` — erreurs courantes avec corrections
  - `<troubleshooting>` — diagnostic
- **Tags domain-specific** : nommés selon le contenu de chaque fichier (ex: `<platform_proxy>`, `<wrangler_config>` pour cloudflare-platform.md)
- **Duplication avec headers OK** : un tag peut reprendre le concept du header Markdown si c'est descriptif (header "## Platform Proxy" → tag `<platform_proxy>`)

### Tag placement
- **Le tag englobe le header** : `<tag>\n## Header\n...contenu...\n</tag>` — le header fait partie du bloc sémantique
- **Pas de ligne vide** entre tag d'ouverture/fermeture et contenu — format compact
- **MCP callouts restent dans leur parent** : les blockquotes MCP ne reçoivent pas de tag dédié, ils restent à l'intérieur du tag de section parente

### Tag granularity and nesting
- **Niveau section (##) par défaut**, mais un ### peut recevoir son propre tag si c'est une unité sémantique indépendante (ex: une binding spécifique KV, D1)
- **1 niveau de nesting max** : un tag parent peut contenir des tags enfants, mais pas plus profond (ex: `<bindings>` peut contenir `<kv_binding>` et `<d1_binding>`)

### Conventions document
- **Document séparé** : `XML-CONVENTIONS.md` dans `.planning/` — référençable par les phases 13-14
- **Créé AVANT le pilot** : les conventions sont définies d'abord, puis appliquées au pilot pour les valider
- **Contenu** :
  - Règles de nommage + exemples concrets
  - Before/after d'une section (visuel)
  - Checklist de validation par fichier
- **Vocabulaire hybride** : tags universels fixés + règles de dérivation pour les tags domain-specific (Claude les détermine fichier par fichier)

### Validation criteria
- **Grep patterns** : script automatisé qui extrait les patterns de SKILL.md et les exécute contre le fichier modifié — pass/fail automatique
- **Token overhead** : approximation par caractères (taille avant/après) — suffisant pour un seuil de 5%
- **Diff check** : script automatisé qui filtre le git diff pour isoler les lignes modifiées non-XML — doit être vide
- **Seuil dépassé** : le seuil de 5% ne bouge pas — si dépassé, challenger les tags :
  - 5.0–6.0% → revoir les tags sous-section (test "interrogeable indépendamment")
  - 6.0–8.0% → signal d'over-tagging structurel, réduire les tags
  - >8.0% → problème de design, trop de nesting ou tags sur sections trop petites

### Claude's Discretion
- Choix exact des tags domain-specific pour cloudflare-platform.md (en suivant les conventions)
- Structure interne du document XML-CONVENTIONS.md
- Ordre des sections dans le fichier pilote restructuré

</decisions>

<specifics>
## Specific Ideas

- Le guide XML du projet documente 5-10% d'overhead tokens pour les balises, rentabilisé au-delà de 500 tokens de contenu — utiliser ce principe pour challenger les tags trop granulaires
- "Tag names should describe their contents clearly" — principe directeur du guide XML
- Le test pour un tag sous-section : "est-ce interrogeable indépendamment ?" — si non, pas de tag dédié
- Les conventions doivent être assez claires pour que les phases batch (13-14) n'aient pas besoin de re-discuter

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-pilot*
*Context gathered: 2026-02-04*
