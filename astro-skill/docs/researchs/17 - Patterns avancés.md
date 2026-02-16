# Astro 5.17+ sur Cloudflare — Guide de référence avancé

Ce guide fournit les patterns de production, anti-patterns, et migrations critiques pour Astro 5.17+ déployé sur Cloudflare Workers/Pages. Conçu pour alimenter un Claude Code Skill avec des références précises et niveaux de confiance.

---

## Section 1: Quick Reference — Règles impératives

### View Transitions / ClientRouter

|#|Règle|Source|Confiance|
|---|---|---|---|
|1|**Remplacer `<ViewTransitions />` par `<ClientRouter />`** — composant renommé en v5.0, suppression prévue v6.0|[OFFICIEL]|Élevé|
|2|Toujours ajouter `transition:name` unique avec `transition:persist` pour éviter les conflits|[OFFICIEL]|Élevé|
|3|Remplacer `DOMContentLoaded` par `astro:page-load` pour scripts post-navigation|[OFFICIEL]|Élevé|
|4|Utiliser `astro:after-swap` pour appliquer le dark mode avant rendu (évite flash)|[OFFICIEL]|Élevé|
|5|Ajouter `data-astro-rerun` aux scripts devant se ré-exécuter après navigation|[OFFICIEL]|Élevé|

### Astro Actions

|#|Règle|Source|Confiance|
|---|---|---|---|
|6|Ne jamais nommer une action `apply`, `call`, ou `bind` (mots réservés JS)|[OFFICIEL]|Élevé|
|7|Retourner uniquement des données sérialisables (pas de Response, pas de fonctions)|[OFFICIEL]|Élevé|
|8|Utiliser `isInputError()` et `isActionError()` pour typage des erreurs côté client|[OFFICIEL]|Élevé|
|9|Ajouter `enctype="multipart/form-data"` pour upload fichiers via Actions|[OFFICIEL]|Élevé|
|10|Utiliser `getActionPath()` (v5.1+) pour webhooks et intégrations externes|[OFFICIEL]|Élevé|

### Middleware & Sessions

|#|Règle|Source|Confiance|
|---|---|---|---|
|11|Accéder aux bindings Cloudflare via `context.locals.runtime.env`, jamais `process.env`|[OFFICIEL]|Élevé|
|12|**Sessions non supportées dans edge middleware** — limitation documentée|[OFFICIEL]|Élevé|
|13|KV est **eventually consistent** (~60s propagation globale) — prévoir latence cross-région|[OFFICIEL]|Élevé|
|14|Limiter données session à <1MB, KV max 25MB par valeur|[OFFICIEL]|Élevé|
|15|Utiliser `sequence()` pour chaîner middleware, ordre = ordre d'appel|[OFFICIEL]|Élevé|

### Configuration Cloudflare

|#|Règle|Source|Confiance|
|---|---|---|---|
|16|Ajouter `nodejs_compat` dans `compatibility_flags` pour APIs Node.js|[OFFICIEL]|Élevé|
|17|Créer `.assetsignore` avec `_worker.js` et `_routes.json` pour Workers|[OFFICIEL]|Élevé|
|18|Désactiver Auto Minify JS dans Cloudflare Dashboard (évite hydration mismatch)|[OFFICIEL]|Élevé|
|19|Tester avec `wrangler pages dev ./dist`, pas seulement `astro dev`|[OFFICIEL]|Élevé|
|20|Pour `compatibility_date >= 2025-09-15`, ajouter flag `disable_nodejs_process_v2`|[OFFICIEL]|Élevé|

---

## Section 2: Decision Matrices

### View Transitions — Choix d'implémentation

|Critère|CSS-only `@view-transition`|`<ClientRouter />`|
|---|---|---|
|**Support navigateur**|Chrome/Edge 126+ uniquement|Tous (avec fallback)|
|**JavaScript requis**|Non|Oui (~5-10KB)|
|**`transition:persist`**|❌ Non disponible|✅ Supporté|
|**Events lifecycle**|❌ Non|✅ Complet|
|**`navigate()` API**|❌ Non|✅ Disponible|
|**Animations custom**|CSS natif|Configuration Astro|
|**Recommandé pour**|Sites statiques simples, Chrome-only|Applications interactives, cross-browser|

### Actions vs Endpoints API

|Critère|Astro Actions|API Endpoints (`/api/*`)|
|---|---|---|
|**Validation intégrée**|✅ Zod natif|❌ Manuelle|
|**Typage E2E**|✅ Automatique|❌ Manuel|
|**Progressive enhancement**|✅ Forms HTML natifs|❌ JS requis|
|**Retour Response brute**|❌ Non supporté|✅ Supporté|
|**Webhooks externes**|Via `getActionPath()`|✅ Direct|
|**Streaming**|❌ Non|✅ Supporté|
|**Recommandé pour**|Forms, mutations typées|APIs REST, streaming, réponses custom|

### Middleware patterns

|Pattern|`context.redirect()`|`context.rewrite()`|
|---|---|---|
|**URL navigateur**|Change|Inchangée|
|**SEO**|✅ Passes equity (301)|Neutre (même URL)|
|**Méthode HTTP**|Peut changer (302)|Préservée|
|**Re-exécution middleware**|Non|✅ Oui (full cycle)|
|**Cas d'usage**|Auth redirect, PRG|Fallback localization, auth guard sans URL leak|

### Sessions storage — Options Cloudflare

|Storage|Latence lecture|Consistance|Limite taille|Cas d'usage|
|---|---|---|---|---|
|**KV**|500µs-10ms (hot)|Eventually (~60s)|25MB/value|Sessions standard, préférences|
|**D1**|~1-5ms|Strong|10GB/DB|Données relationnelles, historique|
|**Durable Objects**|~20-50ms|Strong|128KB/alarm|Real-time, WebSockets, état partagé|
|**R2**|~50-100ms|Strong|5TB/object|Fichiers, médias, large blobs|

### Error handling strategy

|Contexte|Approche|Fallback|
|---|---|---|
|**Composant Astro (SSR)**|try/catch frontmatter|UI fallback ou `500.astro`|
|**Composant Astro (SSG)**|try/catch frontmatter|Erreur build (pas de 500.astro)|
|**Server Islands**|try/catch + `slot="fallback"`|Contenu fallback slot|
|**Actions**|`ActionError` avec code|`isActionError()` côté client|
|**Middleware**|try/catch + throw|Propagation vers 500.astro|
|**Cloudflare timeout**|Streaming, chunked processing|Erreur 524|

---

## Section 3: Anti-patterns Table

|#|Anti-pattern|Problème|Alternative correcte|Source|
|---|---|---|---|---|
|1|`import.meta.env.SECRET` runtime sur CF|Variables undefined en production|`Astro.locals.runtime.env.SECRET`|[OFFICIEL]|
|2|`DOMContentLoaded` avec View Transitions|Event ne fire pas après navigation client|`astro:page-load` event|[OFFICIEL]|
|3|Async I/O au niveau module|"Disallowed operation in global scope"|Déplacer dans handlers/fonctions|[OFFICIEL]|
|4|Sharp image service sur CF|Bindings natifs Node requis|`imageService: "cloudflare"` ou `"compile"`|[OFFICIEL]|
|5|Action nommée `apply`/`call`/`bind`|Conflit mots réservés JS|Renommer l'action|[OFFICIEL]|
|6|Retourner `Response` depuis Action|Actions requièrent données sérialisables|Utiliser endpoints pour Response|[OFFICIEL]|
|7|`compatibility_date: 2025-09-15` sans flag|Breaking change `nodejs_process_v2`|Ajouter `disable_nodejs_process_v2`|[OFFICIEL]|
|8|`transition:persist` sans `transition:name`|Conflits entre composants identiques|Toujours ajouter `transition:name` unique|[OFFICIEL]|
|9|`window`/`document` dans middleware|Non disponibles dans Workers runtime|Utiliser Request/Response APIs|[OFFICIEL]|
|10|`import { env } from 'cloudflare:workers'` top-level|Module resolution échoue en dev|`context.locals.runtime` pattern|[OFFICIEL]|
|11|Route catch-all `[...path].astro` + Server Islands|Boucle infinie sur Cloudflare|Routes dynamiques standards|[COMMUNAUTAIRE]|
|12|`getRuntime()` (déprécié)|Supprimé versions récentes|`Astro.locals.runtime`|[OFFICIEL]|
|13|`_routes.json` custom sans comprendre|Override optimisation auto, coûts accrus|Laisser adapter générer|[OFFICIEL]|
|14|Test uniquement `astro dev`|Dev = Node.js, pas Workers runtime|Tester avec `wrangler pages dev ./dist`|[OFFICIEL]|
|15|Wrangler 4.40.3-4.41.x + nodejs_compat|Polyfill `node:process` cassé|Mettre à jour vers Wrangler ≥4.42.0|[OFFICIEL]|
|16|State partagé modifié avant hydratation|Hydration mismatches|State immutable jusqu'après hydratation|[COMMUNAUTAIRE]|
|17|`astro:db` avec libSQL sur CF|Erreurs 500 en production|Utiliser D1 ou DB compatible CF|[COMMUNAUTAIRE]|
|18|Theme inline script sans `astro:after-swap`|Flicker theme à chaque navigation|Ajouter listener `astro:after-swap`|[OFFICIEL]|

---

## Section 4: Breaking Changes Migration Table (Astro 4.x → 5.17+)

|Changement|Avant (4.x)|Après (5.x+)|Version min|Notes|
|---|---|---|---|---|
|**ClientRouter rename** [BREAKING]|`import { ViewTransitions }`|`import { ClientRouter }`|5.0|Suppression prévue v6.0|
|**Astro.glob() déprécié** [BREAKING]|`await Astro.glob('./posts/*.md')`|`Object.values(import.meta.glob('./posts/*.md', { eager: true }))`|5.0|Suppression v6.0|
|**compiledContent() async** [BREAKING]|`myPost.compiledContent()`|`await myPost.compiledContent()`|5.0|Retourne Promise|
|**Content config location** [BREAKING]|`src/content/config.ts`|`src/content.config.ts`|5.0|Racine du projet|
|**Collection entry slug → id** [BREAKING]|`entry.slug`|`entry.id`|5.0|Propriété renommée|
|**render() function** [BREAKING]|`entry.render()`|`import { render } from 'astro:content'; render(entry)`|5.0|Import explicite|
|**Collection type → loader** [BREAKING]|`type: 'content'`|`loader: glob({...})`|5.0|Content Layer API|
|**Hybrid mode supprimé** [BREAKING]|`output: 'hybrid'`|`output: 'static'` + `prerender: false`|5.0|Static par défaut|
|**astro:routes:resolved** [BREAKING]|`routes` dans `astro:build:done`|Hook dédié `astro:routes:resolved`|5.0|Nouveau hook|
|**IntegrationRouteData** [BREAKING]|`IntegrationRouteData` type|`IntegrationResolvedRoute`|5.0|Type renommé|
|**Route component → entrypoint** [BREAKING]|`route.component`|`route.entrypoint`|5.0|Propriété renommée|
|**Route prerender → isPrerendered** [BREAKING]|`route.prerender`|`route.isPrerendered`|5.0|Propriété renommée|
|**params auto-decoded** [BREAKING]|Params décodés automatiquement|Décoder manuellement si nécessaire|5.0|`decodeURI()`|
|**TypeScript config** [BREAKING]|`src/env.d.ts` requis|Types dans `.astro/types.d.ts`|5.0|Auto-généré|
|**getActionPath()** [NOUVEAU]|N/A|`import { getActionPath } from 'astro:actions'`|5.1|Pour webhooks|
|**ActionInputSchema** [NOUVEAU]|N/A|`import { ActionInputSchema } from 'astro:actions'`|5.16|Typage schemas|

### Migration Astro.glob() — Exemple complet

```astro
---
// ❌ AVANT (Astro 4.x) — DÉPRÉCIÉ
const posts = await Astro.glob('../posts/*.md');
const sorted = posts.sort((a, b) => 
  new Date(b.frontmatter.date) - new Date(a.frontmatter.date)
);

// ✅ APRÈS (Astro 5.x+) — import.meta.glob
const postModules = import.meta.glob('../posts/*.md', { eager: true });
const posts = Object.values(postModules);
const sorted = posts.sort((a, b) => 
  new Date(b.frontmatter.date) - new Date(a.frontmatter.date)
);

// ✅ APRÈS (Astro 5.x+) — Content Collections (recommandé)
import { getCollection } from 'astro:content';
const posts = await getCollection('posts');
const sorted = posts.sort((a, b) => 
  new Date(b.data.date) - new Date(a.data.date)
); // Note: frontmatter → data
---
```

---

## Section 5: Troubleshooting Table

|#|Symptôme|Cause|Solution|Réf.|
|---|---|---|---|---|
|1|Flash dark mode à chaque navigation|HTML reset avant script|`astro:after-swap` listener pour theme|[#7765]|
|2|State perdu entre pages|`transition:persist` sans `transition:name`|Ajouter `transition:name` unique|[#7765]|
|3|Scripts ne s'exécutent pas après navigation|`DOMContentLoaded` ne fire pas|Utiliser `astro:page-load`|[#7773]|
|4|404 custom casse navigation|Scripts client échouent|Ajouter `data-astro-reload` aux liens|[#9570]|
|5|`[object Object]` retourné par middleware|`enable_nodejs_process_v2` flag|Wrangler ≥4.42.0 ou `disable_nodejs_process_v2`|[#14511]|
|6|`Cannot find module 'cloudflare:workers'`|Import global scope non supporté dev|`context.locals.runtime.env`|[#13523]|
|7|POST endpoint retourne 301 redirect|Conflit trailing slash config|Vérifier `trailingSlash` et `_routes.json`|[#13758]|
|8|KV binding not found|Namespace non configuré|`wrangler kv namespace create` + wrangler.json|[DOCS]|
|9|Session data manquante en dev|Dev utilise fs fallback|Tester avec `wrangler pages dev ./dist`|[#13831]|
|10|`Disallowed operation in global scope`|Async I/O niveau module|Déplacer dans handlers|[CF DOCS]|
|11|Hydration mismatch warnings|CF Auto Minify interfère|Désactiver Auto Minify JS dashboard|[DOCS]|
|12|Image 404 en Workers mode|`_image` endpoint mal configuré|`imageService: "passthrough"`|[#13825]|
|13|Bundle size exceeds 25MB|Trop de dépendances|Tree-shake, split Workers, analyser bundle|[CF DOCS]|
|14|`env.VAR` undefined production|Mauvais pattern accès|`Astro.locals.runtime.env.VAR`|[#6130]|
|15|Action "apply" fails|Mot réservé JS|Renommer action|[#13528]|
|16|Cold start lent|Worker initialization|Prerender pages statiques, minimiser deps SSR|[CF DOCS]|
|17|Session latence cross-région|KV eventually consistent|Attendu ~60s propagation globale|[DOCS]|
|18|Middleware redirect ne fonctionne pas CF|Routes statiques bypass worker|`prerender = false` ou `_redirects`|[#12315]|

---

## Section 6: Code Patterns

### Pattern 1: ClientRouter avec dark mode persistant

```astro
---
import { ClientRouter } from 'astro:transitions';
---
<html>
<head>
  <ClientRouter fallback="animate" />
  <script is:inline>
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  </script>
</head>
<body>
  <slot />
  <script>
    document.addEventListener('astro:after-swap', () => {
      if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
      }
    });
  </script>
</body>
</html>
```

### Pattern 2: Composant avec transition:persist

```astro
---
import AudioPlayer from '../components/AudioPlayer.svelte';
---
<AudioPlayer 
  client:load 
  transition:persist 
  transition:name="main-player"
  transition:persist-props
/>
```

### Pattern 3: Action avec validation Zod avancée

```typescript
// src/actions/index.ts
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
  createPost: defineAction({
    accept: 'form',
    input: z.object({
      title: z.string().min(3).max(100),
      content: z.string().min(10),
      tags: z.array(z.string()).optional(),
      publishAt: z.string().transform(s => new Date(s)),
    }),
    handler: async (input, ctx) => {
      if (!ctx.locals.user) {
        throw new ActionError({ code: 'UNAUTHORIZED' });
      }
      const { env } = ctx.locals.runtime;
      // ... save to D1/KV
      return { id: 'post-123', ...input };
    }
  })
};
```

### Pattern 4: Progressive enhancement form

```astro
---
import { actions, isInputError } from 'astro:actions';
const result = Astro.getActionResult(actions.subscribe);
const errors = isInputError(result?.error) ? result.error.fields : {};
---
<form method="POST" action={actions.subscribe}>
  <input name="email" type="email" aria-invalid={!!errors.email} />
  {errors.email && <span class="error">{errors.email[0]}</span>}
  <button>Subscribe</button>
</form>
<script>
  import { actions } from 'astro:actions';
  document.querySelector('form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { error } = await actions.subscribe(new FormData(e.target));
    if (!error) location.href = '/success';
  });
</script>
```

### Pattern 5: Middleware auth avec sessions

```typescript
// src/middleware.ts
import { defineMiddleware, sequence } from 'astro:middleware';

const auth = defineMiddleware(async (ctx, next) => {
  const user = await ctx.session?.get('user');
  ctx.locals.user = user || null;
  return next();
});

const guard = defineMiddleware((ctx, next) => {
  if (!ctx.locals.user && ctx.url.pathname.startsWith('/admin')) {
    return ctx.redirect('/login');
  }
  return next();
});

export const onRequest = sequence(auth, guard);
```

### Pattern 6: Accès bindings Cloudflare

```typescript
// Dans Action ou endpoint
handler: async (input, ctx) => {
  const { env } = ctx.locals.runtime;
  
  // KV
  await env.MY_KV.put('key', JSON.stringify(data));
  const cached = await env.MY_KV.get('key', 'json');
  
  // D1
  const { results } = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(input.userId).all();
  
  // R2
  await env.BUCKET.put('file.pdf', fileBuffer);
  
  return results;
}
```

### Pattern 7: Error handling centralisé

```typescript
// src/middleware.ts
export const onRequest = defineMiddleware(async (ctx, next) => {
  const start = Date.now();
  try {
    const response = await next();
    console.log(JSON.stringify({
      type: 'request',
      path: ctx.url.pathname,
      status: response.status,
      duration: Date.now() - start
    }));
    return response;
  } catch (e) {
    console.error(JSON.stringify({
      type: 'error',
      path: ctx.url.pathname,
      error: e instanceof Error ? e.message : 'Unknown'
    }));
    throw e; // Propagate to 500.astro
  }
});
```

### Pattern 8: Server Island avec fallback

```astro
---
import UserStats from '../components/UserStats.astro';
---
<UserStats server:defer userId={user.id}>
  <div slot="fallback" class="skeleton">
    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
    <div class="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
  </div>
</UserStats>
```

### Pattern 9: navigate() programmatique sécurisé

```typescript
import { navigate } from 'astro:transitions/client';

const ALLOWED_PATHS = ['/dashboard', '/profile', '/settings'];

function safeNavigate(path: string) {
  if (ALLOWED_PATHS.some(p => path.startsWith(p))) {
    navigate(path, { history: 'push' });
  } else {
    console.warn('Navigation blocked:', path);
  }
}
```

### Pattern 10: Custom integration lightweight

```typescript
// my-analytics.ts
import type { AstroIntegration } from 'astro';

export default function analytics(id: string): AstroIntegration {
  return {
    name: 'my-analytics',
    hooks: {
      'astro:config:setup': ({ injectScript }) => {
        injectScript('head-inline', `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `);
      }
    }
  };
}
```

---

## Section 7: Event Lifecycle Diagrams

### View Transitions Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    NAVIGATION LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User clicks <a> or navigate()                                 │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────────────────┐                               │
│   │ 1. astro:before-preparation │ ← Modify loader, show spinner │
│   └──────────────┬──────────────┘                               │
│                  │ (fetch new page)                              │
│                  ▼                                               │
│   ┌─────────────────────────────┐                               │
│   │ 2. astro:after-preparation  │ ← Hide spinner (sync only)    │
│   └──────────────┬──────────────┘                               │
│                  │                                               │
│   ════════════ VIEW TRANSITION START ════════════               │
│                  │                                               │
│                  ▼                                               │
│   ┌─────────────────────────────┐                               │
│   │ 3. astro:before-swap        │ ← Modify newDocument,         │
│   └──────────────┬──────────────┘   set theme, custom swap      │
│                  │ (DOM swap)                                    │
│                  ▼                                               │
│   ┌─────────────────────────────┐                               │
│   │ 4. astro:after-swap         │ ← Scroll restore, DOM adjust  │
│   └──────────────┬──────────────┘                               │
│                  │                                               │
│   ════════════ VIEW TRANSITION END ════════════                 │
│                  │                                               │
│                  ▼                                               │
│   ┌─────────────────────────────┐                               │
│   │ 5. astro:page-load          │ ← Re-init scripts, analytics  │
│   └─────────────────────────────┘   (replaces DOMContentLoaded) │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Hooks Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRATION HOOKS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │ astro:config:setup   │ → updateConfig, injectRoute,          │
│  └──────────┬───────────┘   addMiddleware, injectScript         │
│             │                                                    │
│             ▼                                                    │
│  ┌──────────────────────┐                                       │
│  │ astro:route:setup    │ → Per-route prerender options         │
│  └──────────┬───────────┘                                       │
│             │                                                    │
│             ▼                                                    │
│  ┌──────────────────────┐                                       │
│  │ astro:routes:resolved│ → Access all routes metadata [v5.0]   │
│  └──────────┬───────────┘                                       │
│             │                                                    │
│             ▼                                                    │
│  ┌──────────────────────┐                                       │
│  │ astro:config:done    │ → Final config, set adapter           │
│  └──────────┬───────────┘                                       │
│             │                                                    │
│    ┌────────┴────────┐                                          │
│    │                 │                                          │
│    ▼                 ▼                                          │
│  DEV MODE         BUILD MODE                                    │
│  ────────         ──────────                                    │
│  server:setup     build:start                                   │
│  server:start     build:setup                                   │
│  server:done      build:ssr (SSR only)                          │
│                   build:generated (static)                      │
│                   build:done                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Middleware Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│          MIDDLEWARE CHAIN: sequence(A, B, C)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request ──►  A.before  ──►  B.before  ──►  C.before            │
│                                                 │                │
│                                                 ▼                │
│                                           Route Handler          │
│                                                 │                │
│  Response ◄──  A.after  ◄──  B.after  ◄──  C.after              │
│                                                                  │
│  Console output:                                                │
│    "A request"                                                  │
│    "B request"                                                  │
│    "C request"                                                  │
│    "C response"                                                 │
│    "B response"                                                 │
│    "A response"                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Section 8: Configuration Reference

### astro.config.mjs — Template production Cloudflare

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server', // ou 'static' avec prerender: false individuel
  
  adapter: cloudflare({
    // Modules .wasm, .bin, .txt (défaut: true)
    cloudflareModules: true,
    
    // Service image: 'compile' | 'cloudflare' | 'passthrough'
    imageService: 'compile',
    
    // Proxy local pour bindings en dev
    platformProxy: {
      enabled: true,
      configPath: 'wrangler.jsonc',
      persist: { path: './.cache/wrangler/v3' }
    },
    
    // Routes custom (Pages only)
    routes: {
      extend: {
        include: [{ pattern: '/api/*' }],
        exclude: [{ pattern: '/static/*' }]
      }
    },
    
    // Binding KV sessions (défaut: 'SESSION')
    sessionKVBindingName: 'SESSION',
  }),
  
  // Config Vite pour Node.js compat
  vite: {
    ssr: {
      external: ['node:buffer', 'node:crypto']
    },
    build: {
      minify: false // Debug: meilleurs messages d'erreur
    }
  }
});
```

### wrangler.jsonc — Template production complet

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-astro-app",
  "main": "dist/_worker.js/index.js",
  "compatibility_date": "2025-03-25",
  "compatibility_flags": ["nodejs_compat"],
  
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  },
  
  "kv_namespaces": [
    { "binding": "SESSION", "id": "<SESSION_KV_ID>" },
    { "binding": "CACHE", "id": "<CACHE_KV_ID>" }
  ],
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database",
      "database_id": "<DATABASE_ID>"
    }
  ],
  
  "r2_buckets": [
    { "binding": "STORAGE", "bucket_name": "my-bucket" }
  ],
  
  "vars": {
    "ENVIRONMENT": "production"
  },
  
  "observability": { "enabled": true },
  
  "env": {
    "preview": {
      "vars": { "ENVIRONMENT": "preview" },
      "kv_namespaces": [
        { "binding": "SESSION", "id": "<PREVIEW_KV_ID>" }
      ]
    }
  }
}
```

### public/.assetsignore (requis Workers)

```
_worker.js
_routes.json
```

### Différences environnements

|Aspect|`astro dev`|`wrangler pages dev`|Production|
|---|---|---|---|
|Runtime|Node.js|workerd (local)|CF Workers|
|Bindings|Via platformProxy|Natif émulé|Natif|
|KV|Local filesystem|Local émulé|Eventually consistent|
|Env vars|`.env`|`.dev.vars`|Dashboard/wrangler|
|Hot reload|✅ Complet|⚠️ Limité|N/A|
|Debug|Full Node.js|Limité|Logs/observability|

### TypeScript env.d.ts — Cloudflare bindings

```typescript
// src/env.d.ts
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  SESSION: KVNamespace;
  DB: D1Database;
  STORAGE: R2Bucket;
  AI: Ai;
  ENVIRONMENT: string;
}

declare namespace App {
  interface Locals extends Runtime {
    user: { id: string; name: string } | null;
  }
}
```

---

## Section 9: References

### Documentation officielle Astro

- [View Transitions Guide](https://docs.astro.build/en/guides/view-transitions/)
- [Actions Guide](https://docs.astro.build/en/guides/actions/)
- [Middleware Guide](https://docs.astro.build/en/guides/middleware/)
- [Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Upgrade to v5](https://docs.astro.build/en/guides/upgrade-to/v5/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Integrations API](https://docs.astro.build/en/reference/integrations-reference/)

### Documentation Cloudflare

- [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [KV Documentation](https://developers.cloudflare.com/kv/)
- [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Wrangler Configuration](https://developers.cloudflare.com/pages/configuration/wrangler-configuration/)

### GitHub Issues clés

- [#14369](https://github.com/withastro/astro/issues/14369) — ViewTransitions → ClientRouter deprecation
- [#14511](https://github.com/withastro/astro/issues/14511) — [object Object] middleware issue
- [#13523](https://github.com/withastro/astro/issues/13523) — cloudflare:workers import dev mode
- [#7765](https://github.com/withastro/astro/issues/7765) — Dark mode flash fix

---

## Section 10: Sources consultées

|Source|Type|Confiance|Notes|
|---|---|---|---|
|docs.astro.build|Officielle|⭐⭐⭐ Élevé|Documentation principale Astro|
|developers.cloudflare.com|Officielle|⭐⭐⭐ Élevé|Workers, KV, Pages Functions|
|github.com/withastro/astro|Officielle|⭐⭐⭐ Élevé|Issues, PRs, Changelog|
|github.com/withastro/adapters|Officielle|⭐⭐⭐ Élevé|Cloudflare adapter issues|
|astro.build/blog|Officielle|⭐⭐⭐ Élevé|Annonces features|
|community.cloudflare.com|Communautaire|⭐⭐ Moyen|Workarounds, edge cases|
|Discord Astro #support|Communautaire|⭐⭐ Moyen|Solutions rapides|

### Légende niveaux de confiance

- **[OFFICIEL]** — Documenté officiellement, testé, supporté
- **[COMMUNAUTAIRE]** — Validé par la communauté, non officiel
- **[INFÉRÉ]** — Déduit de la documentation, à vérifier
- **[BREAKING]** — Changement cassant, migration requise
- **[À VÉRIFIER]** — Information incertaine, tester avant production

---

_Document généré le 3 février 2026. Basé sur Astro 5.16.11+ et @astrojs/cloudflare 12.6.x. Vérifier les changelogs pour mises à jour post-publication._