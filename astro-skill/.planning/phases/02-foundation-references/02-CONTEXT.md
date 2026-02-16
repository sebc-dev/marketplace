# Phase 2: Foundation References - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Platform-level reference files for Astro 5.17+ on Cloudflare: project structure conventions, rendering mode decisions (SSG/SSR/hybrid/Server Islands), Cloudflare runtime constraints (bindings, limits, compatibility), and default config templates. These files become Claude's knowledge base for generating correct code on the first try.

Three files: `project-structure.md`, `rendering-modes.md`, `cloudflare-platform.md`.

</domain>

<decisions>
## Implementation Decisions

### Profondeur du contenu
- Ton prescriptif : "Utilise X", "Evite Y" — pas encyclopedique
- Couverture strategique : ce que le MCP/docs officielles ne disent PAS bien (pieges Cloudflare, combos Astro 5, decisions architecturales). ~150-250 lignes/fichier
- Separation implicite skill/MCP : pas de references croisees vers `search_astro_docs` dans les fichiers de reference (reserve a SKILL.md body en Phase 5)
- Versions precises uniquement pour les breaking changes (ex: "Depuis Astro 5.7: content.config.ts a la racine"). Generique "Astro 5.x" sinon

### Structure des references
- Format principal : tables + blocs de code. Dense, scannable
- Hierarchie par concept (File Organization > Naming > Config Files), pas par action
- Quick Reference systematique en tete de chaque fichier : 5-10 lignes avec les regles critiques du domaine. Claude peut s'arreter la pour les cas simples
- Code snippets : templates copy-pasteables pour les configs (astro.config.mjs, wrangler.jsonc, etc.), illustratifs pour les patterns de code

### Config templates
- Plusieurs variantes par fichier de config (SSG, SSR, hybrid pour astro.config.mjs)
- Couverture ecosysteme complet : astro.config.mjs, wrangler.jsonc, tsconfig.json, env.d.ts, .dev.vars, content.config.ts, package.json scripts, .gitignore
- Placement distribue par domaine : wrangler.jsonc dans cloudflare-platform.md, astro.config dans project-structure.md, etc.
- Pas de versions de packages dans les templates (evite l'obsolescence). Claude utilise le MCP pour les versions actuelles

### Anti-patterns & troubleshooting
- Anti-patterns dans une section dediee en fin de fichier ("## Anti-patterns"), pas inline
- Pas de confidence tags — tous les anti-patterns sont presentes comme des regles absolues
- Troubleshooting en table symptome/cause/fix avec contrainte critique :
  - **Le fix doit tenir en une ligne** (limitation Markdown des cellules de table)
  - Symptom : message d'erreur exact ou comportement observable (citation verbatim)
  - Cause : explication en une phrase (~15 mots)
  - Fix : commande ou instruction unique (une ligne de code inline)
  - Si le fix necessite du code multi-lignes, la table pointe vers la section Patterns ou Config Templates
- Sources : partir des 18 fichiers de recherche existants, valider/consolider/ameliorer avec documentation officielle Astro/Cloudflare et recherches web

### Claude's Discretion
- Ordre des sections internes dans chaque fichier de reference
- Nombre exact de lignes par fichier (dans la fourchette 150-250)
- Quels anti-patterns inclure vs omettre (basé sur la frequence et la severite)

</decisions>

<specifics>
## Specific Ideas

- La regle de design "fix en une ligne" dans les tables de troubleshooting est une contrainte technique (Markdown ne supporte pas les blocs de code multi-lignes dans les cellules) transformee en regle de design saine : si le fix est complexe, il appartient aux sections detaillees
- Les fichiers de recherche existants (18 fichiers) sont le point de depart, pas une source finale — ils doivent etre valides contre l'etat actuel d'Astro 5.17+

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-foundation-references*
*Context gathered: 2026-02-03*
