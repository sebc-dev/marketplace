# Routing Astro 5.17+ sur Cloudflare : Guide Opérationnel

Les breaking changes d'Astro 5.x transforment fondamentalement la gestion du routing, notamment la **suppression de l'auto-décodage des params** et l'**inclusion automatique du `base` dans paginate()**. Sur Cloudflare, ces changements interagissent avec les spécificités du runtime Workers et les limites de `_routes.json`. Ce guide fournit les patterns actionnables pour un déploiement hybride optimal.

---

## 1. Quick Reference

**Règles impératives Astro 5.17+ / Cloudflare** :

1. **Décoder manuellement tous les params** avec `decodeURIComponent(Astro.params.slug)` — l'auto-décodage v4 est supprimé [OFFICIEL]
2. **Supprimer la concaténation manuelle de `base`** dans les liens paginate() — `page.url.next` inclut déjà base [OFFICIEL]
3. **Utiliser `output: 'static'`** par défaut et opt-in SSR avec `export const prerender = false` par page — `hybrid` est supprimé [OFFICIEL]
4. **Accéder aux env via `Astro.locals.runtime.env`** et jamais `process.env` ou `import.meta.env` côté SSR [CLOUDFLARE]
5. **Limiter `_routes.json` à 100 règles max** avec wildcards (`/_astro/*`) — éviter les exclusions individuelles [CLOUDFLARE]
6. **Ne jamais prérendre 404.astro avec Server Islands** — cause 404 sur `/_server-islands/` requests [COMMUNAUTAIRE]
7. **Exclure `/_server-islands/*`** des catch-all `[...slug].astro` — sinon boucle infinie [COMMUNAUTAIRE]
8. **Éviter `trailingSlash: 'always'`** avec des API endpoints — conflits de routing sur Cloudflare Pages [CLOUDFLARE]
9. **Déplacer les opérations async hors du scope global** des endpoints — interdit par Workers runtime [CLOUDFLARE]
10. **Utiliser `routes.extend.exclude`** pour forcer le serving statique de routes spécifiques [OFFICIEL]
11. **Préférer Astro config `redirects`** à `_redirects` fichier — les redirects fichier sont ignorés par Functions [CLOUDFLARE]
12. **Activer `nodejs_compat`** dans wrangler.toml si utilisation de Buffer, crypto natif, etc. [CLOUDFLARE]
13. **Créer `.dev.vars`** pour les variables d'env en dev local avec wrangler [CLOUDFLARE]
14. **Ne jamais exposer `error.stack`** dans 500.astro — fuite de structure de code en production [OFFICIEL]
15. **Tester avec `wrangler pages dev ./dist`** après build — comportements différents de `astro dev` [CLOUDFLARE]

---

## 2. Decision Matrix

|Situation|Approche Astro 5.17+|Raison|Confiance|
|---|---|---|---|
|Page statique simple (about, contact)|`export const prerender = true` implicite|Aucune invocation Worker, latence minimale|[OFFICIEL] HIGH|
|Blog avec 100+ posts|`getStaticPaths()` + Content Layer, prerender|Build time acceptable, zero cold start|[OFFICIEL] HIGH|
|Dashboard utilisateur|`export const prerender = false` + middleware auth|Données personnalisées, session requise|[OFFICIEL] HIGH|
|API endpoint REST|`.ts` endpoint avec `prerender = false`|Accès runtime.env, bindings D1/KV/R2|[OFFICIEL] HIGH|
|Contenu personnalisé sur page statique|Server Islands `server:defer`|Page statique + îlots dynamiques, meilleur TTFB|[OFFICIEL] HIGH|
|Redirect permanent /old → /new|`redirects` dans astro.config.mjs|Généré dans Worker, bypass _redirects limitations|[CLOUDFLARE] HIGH|
|Redirect externe|`redirects: { '/ext': 'https://...' }` (v5.2+)|Support natif, évite meta refresh|[OFFICIEL] HIGH|
|Rewrite interne (même contenu, URLs différentes)|`Astro.rewrite('/target')` en page|Préserve URL browser, SEO-friendly|[OFFICIEL] HIGH|
|Rewrite conditionnel dans middleware|`context.rewrite(new Request('/login'))`|Permet headers custom, re-exécute middleware|[OFFICIEL] MEDIUM|
|Pagination avec base path|`paginate()` sans concaténation manuelle|Base auto-inclus depuis v5.0|[OFFICIEL] HIGH|
|Route multi-params `/[lang]-[version]/`|Syntax `[a]-[b]` avec tous params dans getStaticPaths|Pattern supporté, attention au dash separator|[OFFICIEL] HIGH|
|Catch-all endpoint méthodes HTTP|Export `ALL: APIRoute`|Fallback pour méthodes non-définies explicitement|[OFFICIEL] HIGH|
|Pages prérenderées + route dynamique SSR même chemin|`routes.extend.exclude` pour forcer static|Bug connu priorité routes Cloudflare adapter|[COMMUNAUTAIRE] MEDIUM|

---

## 3. Anti-patterns Table

|Ne pas faire|Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|Concaténer `base` manuellement avec `page.url.next`|Utiliser `page.url.next` directement|Double base path `/docs/docs/page/2`|[OFFICIEL]|
|Utiliser `params.slug` sans décoder|`decodeURIComponent(params.slug)` pour caractères spéciaux|Params encodés `%E4%B8%AD` au lieu de `中`|[OFFICIEL]|
|`output: 'hybrid'` dans config|`output: 'static'` + `prerender: false` par page|Erreur config, option supprimée v5.0|[OFFICIEL]|
|`process.env.API_KEY` côté SSR|`Astro.locals.runtime.env.API_KEY`|undefined en production Cloudflare|[CLOUDFLARE]|
|`import.meta.env.SECRET` côté SSR|`locals.runtime.env.SECRET` + `.dev.vars` en dev|Variables non disponibles runtime|[CLOUDFLARE]|
|`export const prerender = true` dans 404.astro avec Server Islands|Retirer le prerender ou utiliser `false`|404 sur toutes requêtes `/_server-islands/`|[COMMUNAUTAIRE]|
|Catch-all `[...slug].astro` sans exclure server islands|Guard `if (slug?.startsWith('_server-islands'))`|Boucle infinie, crash Worker|[COMMUNAUTAIRE]|
|`_redirects` fichier pour routes gérées par Worker|`redirects` config ou `Astro.redirect()` en code|Redirect ignoré, Worker répond|[CLOUDFLARE]|
|Plus de 100 règles individuelles `_routes.json`|Wildcards `{ pattern: '/_astro/*' }`|Erreur 8000057 déploiement|[CLOUDFLARE]|
|`await getData()` au scope global d'endpoint|Déplacer dans handler `export const GET`|Erreur runtime Workers "Disallowed operation"|[CLOUDFLARE]|
|`import fs from 'fs'` dans endpoint SSR|Web APIs ou `node:buffer` avec `nodejs_compat`|Build failure, no filesystem Workers|[CLOUDFLARE]|
|`trailingSlash: 'always'` avec API endpoints|`trailingSlash: 'ignore'` ou `'never'`|404 sur `/api/users` vs `/api/users/`|[CLOUDFLARE]|
|`error.stack` affiché dans 500.astro|`error.message` seulement, ou message générique|Fuite structure code en production|[OFFICIEL]|
|getStaticPaths() retournant 10000+ entrées|Paginer, lazy load, ou passer en SSR|Build time explosif, memory issues|[COMMUNAUTAIRE]|
|Custom `_routes.json` dans public/ sans wildcards|Laisser adapter générer ou utiliser `routes.extend`|Override optimization, billing excessif|[CLOUDFLARE]|

---

## 4. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|404 en prod, fonctionne en dev|`_routes.json` mal généré, route exclue du Worker|Vérifier `dist/_routes.json`, ajouter `routes.extend.include`|[CLOUDFLARE]|
|Params `%20` au lieu d'espaces|Breaking change v5.0, auto-decode supprimé|`decodeURIComponent(Astro.params.param)`|[OFFICIEL]|
|Pagination URLs `/docs/docs/page/2`|paginate() inclut base, double concaténation|Supprimer `${base}` manuel avant `page.url.next`|[OFFICIEL]|
|Error 1042 ou 522 pour 404 custom|404.astro prérendu + Server Islands activé|Retirer `export const prerender = true` de 404.astro|[COMMUNAUTAIRE]|
|Boucle infinie Server Islands|Catch-all route matche `/_server-islands/*`|Guard dans catch-all ou `routes.extend.include` pour path|[COMMUNAUTAIRE]|
|`runtime.env` undefined en dev|platformProxy non activé ou `.dev.vars` manquant|`platformProxy: { enabled: true }` + créer `.dev.vars`|[CLOUDFLARE]|
|`runtime.env` undefined pendant build|Accès env dans middleware pour route prérendue|Guard `if (context.locals.runtime)` avant accès|[COMMUNAUTAIRE]|
|Error 8000057 overlapping rules|Routes dupliquées `/path/` et `/path/*`|Utiliser uniquement wildcards cohérents|[CLOUDFLARE]|
|Error 8000057 over 100 rules|Trop de fichiers statiques exclus individuellement|Wildcards `/_astro/*`, `/fonts/*` etc.|[CLOUDFLARE]|
|`Cannot resolve "fs"` build error|Import Node.js API incompatible Workers|`nodejs_compat` flag ou polyfill Web API|[CLOUDFLARE]|
|"Disallowed operation in global scope"|Async au scope module (top-level await)|Déplacer async dans handler function|[CLOUDFLARE]|
|Redirect ne fonctionne pas (route SSR)|`_redirects` ignoré par Functions|Implémenter redirect dans code ou config Astro|[CLOUDFLARE]|
|Route SSR override route statique plus spécifique|Bug priorité adapter Cloudflare|`routes.extend.exclude` pour forcer static|[COMMUNAUTAIRE]|
|`MessageChannel is not defined` (React 19)|API manquante Workers runtime|Alias vite `'react-dom/server': 'react-dom/server.edge'`|[COMMUNAUTAIRE]|
|Cold start 500ms+ premier request|Worker évicté après ~50s inactivité|Préférer prerender, ou warm-up requests schedulés|[CLOUDFLARE]|

---

## 5. Code Patterns

### 5.1 Migration décodage params (Breaking Change v5.0)

```typescript
// src/pages/blog/[slug].astro
---
// ⚠️ ASTRO 5.x : params ne sont plus auto-décodés
const rawSlug = Astro.params.slug;
// Décoder pour caractères spéciaux (espaces, unicode, etc.)
const slug = decodeURIComponent(rawSlug);
// Utiliser slug décodé pour queries, affichage
const post = await getPostBySlug(slug);
---
```

### 5.2 Pagination sans double base (Breaking Change v5.0)

```astro
---
// page.url.next inclut déjà base depuis v5.0
// ❌ AVANT: <a href={`${import.meta.env.BASE_URL}${page.url.next}`}>
// ✅ APRÈS:
---
{page.url.prev && <a href={page.url.prev}>Précédent</a>}
{page.url.next && <a href={page.url.next}>Suivant</a>}
```

### 5.3 Endpoint REST compatible Cloudflare Workers

```typescript
// src/pages/api/items/[id].ts
import type { APIRoute } from 'astro';
export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const id = decodeURIComponent(params.id!);
  const db = locals.runtime.env.DB; // D1 binding
  const item = await db.prepare('SELECT * FROM items WHERE id = ?')
    .bind(id).first();
  if (!item) return new Response(null, { status: 404 });
  return Response.json(item);
};

export const ALL: APIRoute = ({ request }) => {
  return Response.json({ error: `${request.method} not allowed` }, { status: 405 });
};
```

### 5.4 Middleware avec guard runtime.env

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // Guard pour routes prérendues (runtime undefined pendant build)
  if (context.locals.runtime?.env) {
    const apiKey = context.locals.runtime.env.API_KEY;
    context.locals.apiKey = apiKey;
  }
  return next();
});
```

### 5.5 Server Island avec fallback

```astro
<!-- src/pages/product.astro (prerender: true par défaut) -->
---
import DynamicPrice from '../components/DynamicPrice.astro';
---
<h1>Produit</h1>
<!-- Îlot serveur : rendu dynamique sur page statique -->
<DynamicPrice server:defer productId="123">
  <span slot="fallback">Chargement prix...</span>
</DynamicPrice>
```

### 5.6 Catch-all avec exclusion Server Islands

```astro
// src/pages/[...slug].astro
---
export const prerender = false;
const { slug } = Astro.params;

// Exclure routes réservées Astro
if (slug?.startsWith('_server-islands') || 
    slug?.startsWith('_astro') || 
    slug?.startsWith('_actions')) {
  return new Response(null, { status: 404 });
}
const decodedSlug = slug ? decodeURIComponent(slug) : '';
---
```

### 5.7 Config optimale Cloudflare hybrid

```javascript
// astro.config.mjs
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static', // Défaut static, opt-in SSR par page
  trailingSlash: 'ignore', // Évite conflits CF Pages
  build: { format: 'directory' },
  adapter: cloudflare({
    platformProxy: { enabled: true }, // Dev local avec bindings
    routes: {
      extend: {
        include: [{ pattern: '/api/*' }], // Force SSR
        exclude: [{ pattern: '/_astro/*' }] // Force static
      }
    }
  }),
  redirects: {
    '/old': '/new',
    '/external': 'https://example.com/page' // v5.2+
  }
});
```

### 5.8 Error page 500.astro sécurisée

```astro
// src/pages/500.astro
---
interface Props { error: unknown }
const { error } = Astro.props;
const message = error instanceof Error ? error.message : 'Erreur inconnue';
// ⚠️ Ne JAMAIS exposer error.stack en production
const isDev = import.meta.env.DEV;
---
<h1>Erreur serveur</h1>
<p>{message}</p>
{isDev && error instanceof Error && <pre>{error.stack}</pre>}
```

---

## 6. Références Détaillées

### 6.1 Priorité des routes (ordre décroissant)

1. **Routes réservées Astro** : `_astro/`, `_server_islands/`, `_actions/`
2. **Nombre de segments** : `/a/b/c` > `/a/b` > `/a`
3. **Routes statiques** : `/posts/create` > `/posts/[id]`
4. **Params nommés** : `/posts/[id]` > `/posts/[...slug]`
5. **Routes prérendues** : `prerender: true` > `prerender: false`
6. **Endpoints** : `.ts/.js` > `.astro` pages
7. **Fichiers** : routes fichier > `redirects` config
8. **Alphabétique** : fallback final selon locale Node

### 6.2 Routes réservées (ne jamais créer ces chemins)

|Route|Usage|Conflit si créé|
|---|---|---|
|`/_astro/`|Assets statiques (CSS, JS, images optimisées)|Assets inaccessibles|
|`/_server-islands/`|Rendu différé Server Islands|Islands cassés|
|`/_actions/`|Astro Actions endpoints|Actions non fonctionnelles|

### 6.3 Mapping config → comportement Cloudflare

|Config Astro|Fichier généré|Comportement CF|
|---|---|---|
|`redirects: {...}`|Intégré au Worker|Worker gère redirect|
|`build.format: 'directory'`|`/about/index.html`|URL `/about/`|
|`build.format: 'file'`|`/about.html`|URL `/about` (redirect auto)|
|`trailingSlash: 'always'`|N/A|301 redirect si manquant|
|`trailingSlash: 'never'`|N/A|301 redirect si présent|
|`routes.extend.include`|`_routes.json` include|Force Worker invocation|
|`routes.extend.exclude`|`_routes.json` exclude|Bypass Worker, static|

### 6.4 Fichiers Cloudflare et interaction Astro

|Fichier|Généré par|Priorité|Notes|
|---|---|---|---|
|`_routes.json`|Adapter auto|Détermine Worker vs Static|Max 100 règles|
|`_redirects`|Manuel ou adapter|Avant Worker SI route exclue|Ignoré pour routes Worker|
|`_headers`|Manuel|Appliqué aux réponses statiques|Non appliqué aux Workers|
|`.dev.vars`|Manuel|Dev local seulement|Équivalent secrets dashboard|

### 6.5 Limites Cloudflare à connaître

|Limite|Valeur|Impact routing|
|---|---|---|
|Règles `_routes.json`|100 max (include + exclude)|Utiliser wildcards|
|Redirects statiques|2000|Overflow → Bulk Redirects dashboard|
|Redirects dynamiques|100|Pattern matching `/blog/*`|
|Caractères par règle|100|URLs longues problématiques|
|Worker script size|10 MB|Apps très larges|
|Startup CPU time|400 ms|Cold start budget|
|Request timeout|30s (free) / illimité (paid)|Long-running SSR|

### 6.6 Guide migration rapide v4 → v5

```diff
// 1. Décodage params
- const slug = Astro.params.slug;
+ const slug = decodeURIComponent(Astro.params.slug);

// 2. Pagination base
- <a href={`${import.meta.env.BASE_URL}${page.url.next}`}>
+ <a href={page.url.next}>

// 3. Config output
- output: 'hybrid',
+ output: 'static', // + prerender: false par page SSR

// 4. Experimental flag
- experimental: { globalRoutePriority: true }
+ // Supprimé, comportement par défaut

// 5. Hook routes
- 'astro:build:done': ({ routes }) => {...}
+ 'astro:routes:resolved': ({ routes }) => {...}
```

---

## 7. Sources Consultées

### Documentation Officielle [HIGH CONFIDENCE]

- **Astro Routing Guide** — docs.astro.build/en/guides/routing/ [OFFICIEL]
- **Astro Endpoints Guide** — docs.astro.build/en/guides/endpoints/ [OFFICIEL]
- **Astro v5 Upgrade Guide** — docs.astro.build/en/guides/upgrade-to/v5/ [OFFICIEL]
- **Astro Cloudflare Integration** — docs.astro.build/en/guides/integrations-guide/cloudflare/ [OFFICIEL]
- **Astro Configuration Reference** — docs.astro.build/en/reference/configuration-reference/ [OFFICIEL]

### Documentation Cloudflare [HIGH CONFIDENCE]

- **Pages Routing** — developers.cloudflare.com/pages/configuration/routing/ [CLOUDFLARE]
- **Pages Redirects** — developers.cloudflare.com/pages/configuration/redirects/ [CLOUDFLARE]
- **Workers Framework Guides: Astro** — developers.cloudflare.com/workers/framework-guides/web-apps/astro/ [CLOUDFLARE]

### GitHub Issues & PRs [MEDIUM-HIGH CONFIDENCE]

- **#12079** — Params auto-decode removal PR [OFFICIEL]
- **#11253** — paginate() base inclusion PR [OFFICIEL]
- **#14067** — Route specificity bug Cloudflare adapter [COMMUNAUTAIRE]
- **#13932** — 404 page issues with SSR [COMMUNAUTAIRE]
- **#12771** — Server Islands + prerendered 404 [COMMUNAUTAIRE]
- **#11597** — Server Islands infinite loop catch-all [COMMUNAUTAIRE]
- **withastro/adapters#135** — _routes.json overlapping rules [COMMUNAUTAIRE]
- **withastro/adapters#146** — 100 rule limit issues [COMMUNAUTAIRE]
- **withastro/adapters#337** — runtime.env undefined during build [COMMUNAUTAIRE]

### Retours Communautaires [MEDIUM CONFIDENCE]

- **heckmann.app** — Astro Cloudflare Deep Dive (2025) [COMMUNAUTAIRE]
- **Cloudflare Community Forums** — Trailing slash issues, deployment errors [COMMUNAUTAIRE]
- **LaunchFast Blog** — ISR pattern with KV [COMMUNAUTAIRE]

### Informations Inférées [LOW-MEDIUM CONFIDENCE]

- Interactions `trailingSlash` + `build.format` spécifiques à CF Pages [INFÉRÉ basé sur docs + issues]
- Cold start mitigation strategies [INFÉRÉ basé sur Workers docs généraux]
- React 19 MessageChannel fix scope [INFÉRÉ basé sur un post communautaire unique]

---

## Conclusion

Le routing Astro 5.17+ sur Cloudflare requiert une attention particulière aux **deux breaking changes majeurs** (décodage params, paginate base) et aux **contraintes spécifiques Workers** (100 règles _routes.json, pas de fs/path, env via runtime.locals).

Les patterns hybrides fonctionnent bien en utilisant `output: 'static'` par défaut avec opt-in SSR granulaire, mais le **bug de priorité routes** avec l'adapter Cloudflare (issue #14067) peut nécessiter des workarounds via `routes.extend`.

Pour Server Islands, la règle critique est de **ne jamais prérendre 404.astro** et d'**exclure explicitement `/_server-islands/`** des catch-all routes. Le middleware doit toujours **guard l'accès à `runtime.env`** pour éviter les erreurs pendant le build des pages prérendues.