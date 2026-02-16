# Phase 8: MCP Tool Verification - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Empirically confirm the exact MCP tool name, parameters, and return behavior for the Cloudflare documentation search tool. All subsequent phases (9-11) depend on verified tool specifications — no content is written until tool names and query patterns are confirmed.

</domain>

<decisions>
## Implementation Decisions

### Stratégie de test
- 5-6 requêtes de test minimum pour considérer le tool vérifié
- Mix de requêtes variées : spécifiques, génériques, et ambiguës pour caractériser le comportement du tool
- Couvrir les bindings API ET la config/déploiement Workers
- Scope limité aux produits skill : pas de requêtes hors scope (WAF, DNS, etc.)

### Format de documentation
- Synthèse structurée du format de retour + 1 exemple brut représentatif en annexe
- Livrable stocké dans `.planning/phases/08-mcp-tool-verification/`
- Inclure des query templates prêts à copier pour Phase 9 (queries efficaces intégrables dans SKILL.md)
- Documenter TOUS les tools du serveur Cloudflare MCP avec classement clair (pertinent pour skill vs autres)

### Critères de succès/échec
- Classement progressif de chaque résultat : exact / partiel / hors sujet — pour établir un profil de précision du tool
- Si tool name diffère de l'attendu : Claude évalue si la différence est significative ou mineure (discrétion)
- Si tool MCP non disponible : documenter l'absence + instructions de configuration, puis passer à Phase 9 avec noms assumés
- Inclure des recommandations de formulation de queries basées sur le profil de précision (queries larges vs ciblées, patterns qui marchent le mieux)

### Scope des produits Cloudflare
- Produits testés : Workers, KV, D1, R2
- Workers : focus sur runtime et API (pas config/déploiement en priorité)
- 1 requête dédiée par binding (KV, D1, R2 chacun séparément)
- nodejs_compat / compatibility flags couvert via la requête Workers runtime générale (pas de requête dédiée)

### Claude's Discretion
- Formulation exacte des requêtes de test
- Ordre d'exécution des tests
- Structure interne du document de vérification
- Gestion des cas où le tool name diffère légèrement

</decisions>

<specifics>
## Specific Ideas

- Le doc de vérification doit être directement exploitable par Phase 9 — pas juste un rapport, mais un input actionnable
- Le classement des tools CF (pertinent vs autres) aide à savoir quels tools mentionner/exclure dans SKILL.md
- Les recommandations de formulation doivent être concrètes : "préférer X à Y car résultats plus précis"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-mcp-tool-verification*
*Context gathered: 2026-02-04*
