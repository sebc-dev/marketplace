# Astro Skill

## What This Is

Un Claude Code Skill pour le développement Astro 5.17+ sur Cloudflare Workers/Pages. Il fournit des best practices opinionated, des design patterns, des anti-patterns, des matrices de décision et des templates de code — le tout condensé depuis une recherche approfondie de 18 domaines. Le skill se couple aux serveurs MCP `search_astro_docs` et `search_cloudflare_documentation` qui fournissent la doc officielle brute, et apporte par-dessus le layer "savoir-faire" : quand utiliser quoi, quoi éviter, et pourquoi. Un routage three-way guide Claude vers la bonne source (Astro MCP, Cloudflare MCP, ou références du skill) selon le domaine de la question.

Destiné à un usage freelance personnel pour des projets de sites vitrine et applications TPE/PME sur Cloudflare.

## Core Value

Claude produit du code Astro/Cloudflare correct du premier coup — en appliquant automatiquement les bons patterns, en évitant les pièges connus, et en prenant les bonnes décisions d'architecture sans que l'utilisateur ait besoin de chercher dans la documentation.

## Requirements

### Validated

- SKILL.md principal (<500 lignes) avec frontmatter optimise pour auto-activation sur les projets Astro — v0.1
- Fichiers references/ couvrant les 18 domaines de recherche, condenses et organises par domaine orthogonal — v0.1
- Decision matrices : choix de rendering mode (SSG/SSR/Server Islands), directives d'hydratation, Actions vs API routes — v0.1
- Tables d'anti-patterns critiques avec alternatives correctes et niveaux de confiance — v0.1
- Troubleshooting tables : symptome → cause → fix pour les erreurs Cloudflare/Astro frequentes — v0.1
- Code patterns/templates : configs par defaut (astro.config, wrangler.jsonc, tsconfig, env.d.ts, content.config.ts) — v0.1
- Workflow de scaffolding : creation de nouveau projet Astro/Cloudflare avec structure et configs recommandees — v0.1
- Grep hints dans SKILL.md pour naviguer efficacement les fichiers references/ — v0.1
- Integration MCP : instructions pour utiliser `search_astro_docs` comme complement pour la doc officielle detaillee — v0.1
- Slash commands pour workflows specifiques (scaffolding projet, audit de config, debug) — v0.1
- Naming conventions, structure de projet, et organisation des fichiers documentees — v0.1
- Couverture Cloudflare-specifique : bindings (KV, D1, R2), platformProxy, nodejs_compat, .dev.vars vs .env — v0.1
- ✓ Integration MCP Cloudflare (`search_cloudflare_documentation`) avec routage three-way dans SKILL.md — v0.2
- ✓ Table de routage 8 lignes (Astro MCP / Cloudflare MCP / Skill references) avec criteres et fallback — v0.2
- ✓ Allowlist produits Cloudflare in-scope (Workers, KV, D1, R2) avec exclusions documentees — v0.2
- ✓ Dual-MCP coordination pour questions d'intersection Astro/Cloudflare — v0.2
- ✓ Query templates scopes pour recherches Cloudflare MCP (product + action) — v0.2
- ✓ 10 MCP callouts dans 4 reference files aux frontieres API Cloudflare — v0.2
- ✓ Debug command etendu avec routage dual-MCP et 5 symptomes Cloudflare — v0.2
- ✓ Validation complete : 5 scenarios routage PASS, 102/102 grep patterns, zero regressions — v0.2
- ✓ 11 reference files restructures avec conteneurs XML semantiques (snake_case) autour des sections fonctionnelles — v0.3
- ✓ Zero changement de contenu — meme information, structure differente — v0.3
- ✓ Grep patterns dans SKILL.md toujours fonctionnels apres restructuration (102/102) — v0.3
- ✓ Validation zero regression sur les 102 grep patterns existants — v0.3

### Active

(No active requirements — next milestone not yet defined)

### Out of Scope

- Couverture d'autres providers (Vercel, Netlify, Deno) — focus exclusif Cloudflare
- Tutoriels pour débutants Astro — le skill suppose une connaissance de base du framework
- Duplication de la doc officielle Astro — c'est le rôle du MCP `search_astro_docs`
- Support multi-framework islands (Vue, Svelte, Solid) au-delà de React — couverture React suffisante pour l'usage freelance
- Tests end-to-end du skill sur Haiku/Sonnet — usage personnel sur Opus principalement
- Couverture Zero Trust / Access / Tunnel — enterprise features, hors scope TPE/PME
- Couverture CDN / DNS / Argo — infrastructure-level, pas dev Astro/Workers
- Couverture AI / Vectorize / Browser Rendering — features specialisees, hors scope sites vitrine
- Attributs XML `name="..."` — headers Markdown differencient deja, overhead sans gain mesurable
- Nesting XML multi-niveaux — benefices diminuent au-dela de 1 niveau, complexite accrue

## Context

- v0.1 shipped: 11 reference files, SKILL.md hub (237 lines), 3 slash commands, 102 grep patterns, 10 critical rules
- v0.2 shipped: Dual-MCP routing (Astro + Cloudflare), 10 reference callouts, SKILL.md body 266 lines, debug dual-MCP fallback
- v0.3 shipped: 117 XML semantic containers across 11 reference files, 4.00% aggregate overhead, 102/102 grep patterns intact
- Tech stack: Claude Code Skill (Markdown), MCP server integration (search_astro_docs, search_cloudflare_documentation)
- 18 fichiers de recherche source dans `docs/researchs/` condenses en 11 reference files par domaine orthogonal
- Cible: sites vitrine TPE/PME (800-5000+EUR) sur Cloudflare Workers
- Tech debt: session resilience test non execute formellement (valide via usage reel), slash commands non listes dans SKILL.md

## Constraints

- **Structure skill**: SKILL.md < 500 lignes (actuellement 266 body), références à un seul niveau de profondeur depuis SKILL.md
- **Frontmatter**: name max 64 chars (minuscules+tirets), description max 1024 chars (996 actuellement)
- **Progressive disclosure**: metadata ~100 tokens au startup, instructions <5k tokens au déclenchement, références à la demande
- **Couplage MCP**: Le skill ne duplique pas la doc officielle — il renvoie aux MCP (Astro + Cloudflare) pour les détails d'API et de configuration
- **Version cible**: Astro 5.17+ exclusivement, pas de rétrocompatibilité avec Astro 4.x ou versions antérieures
- **Platform cible**: Cloudflare Workers/Pages exclusivement

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Couplage MCP plutot qu'autonome | Evite la duplication de la doc officielle, reduit la maintenance, skill plus leger et focalise sur la valeur ajoutee | ✓ Good — boundary claire, MCP pour API reference, skill pour decisions |
| Auto-activation + slash commands | Auto pour le guidage contextuel permanent, commandes pour les workflows explicites (scaffolding, audit) | ✓ Good — 6/6 activation tests positifs, 4/4 negatifs |
| Focus Astro + Cloudflare exclusif | Correspond a l'usage freelance reel, evite la dilution du contenu | ✓ Good — contenu dense et pertinent sans dilution |
| Condensation des 18 recherches en references/ | Tout est utile mais doit etre organise en domaines orthogonaux pour le lazy loading | ✓ Good — 11 fichiers, 102 grep patterns pour navigation |
| Workers comme plateforme par defaut | Pages deprecated avril 2025, tous les templates ciblent Workers | ✓ Good — aligne avec direction Cloudflare |
| 10 Critical Rules pour breaking changes Astro 5.x | Prevention automatique des erreurs les plus frequentes lors de migration/developpement | ✓ Good — regles verifiees dans tous les reference files |
| Session resilience via usage reel | Protocole formel concu mais validation via usage reel approuvee | ⚠️ Revisit — a confirmer apres usage prolonge |
| Three-way routing (Astro MCP / Cloudflare MCP / Skill refs) | Chaque source a un domaine distinct, evite les conflits et guide Claude efficacement | ✓ Good — 5/5 scenarios PASS, zero ambiguite |
| 2 query templates KV + D1 (pas R2) | KV et D1 HIGH precision, R2 MEDIUM — garder les meilleurs exemples seulement | ✓ Good — economise le line budget |
| Callouts apres section content (pas dans Quick Reference) | Quick Reference est pour le scan rapide, callouts sont supplementaires | ✓ Good — format coherent sur 10 callouts |
| Debug dual-MCP routing par domaine d'erreur | Plus precis qu'un fallback unique, erreurs Cloudflare → docs Cloudflare | ✓ Good — 5 symptomes CF bien routes |

| XML semantique pour references | Ameliore la precision d'attention de Claude sur les sections fonctionnelles, overhead token 4.00% agrege | ✓ Good — 117 tags, 102/102 grep patterns, zero regressions |
| Pilot-then-batch approach | Valider le pattern sur 1 fichier avant application batch | ✓ Good — pilot a 3.49% a predit 4.00% agrege avec precision |
| Flat XML structure (1 level max) | Complexite minimale, subsections gerees par headers Markdown | ✓ Good — aucun besoin de nesting identifie |
| Per-file overhead variation acceptable | 3 fichiers >5% individuellement mais agrege 4.00% sous le seuil | ✓ Good — variation naturelle selon nombre de sections |

---
*Last updated: 2026-02-04 after v0.3 milestone complete*
