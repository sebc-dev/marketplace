# Build et déploiement Astro 5.17+ sur Cloudflare : guide exhaustif

**L'écosystème Astro 5.17+ / Cloudflare Workers a subi des changements majeurs** : suppression du mode `output: 'hybrid'`, passage à Vite 6 avec son Environment API, et recommandation officielle de Cloudflare Workers Static Assets plutôt que Pages. Ce guide fournit les patterns actionnables, anti-patterns documentés et workflows éprouvés pour alimenter un Claude Code Skill.

La version stable actuelle de l'adapter est **@astrojs/cloudflare v12.6.12**, compatible Astro 5.x+. Vite 6 introduit des breaking changes critiques sur `resolve.conditions` et l'API SSR. Cloudflare recommande désormais **Workers avec Static Assets** plutôt que Pages pour les nouveaux projets.

---

## 1. Quick Reference (pour SKILL.md)

### Configuration Vite 6 essentielle

1. **Externaliser les modules Node.js avec préfixe** — Ajouter `vite.ssr.external: ['node:buffer', 'node:crypto', 'node:stream', 'node:path']` pour compatibilité Workers [OFFICIEL - Confiance élevée]
2. **Utiliser esbuild pour minification** — Garder `vite.build.minify: 'esbuild'` (défaut) pour builds rapides ; désactiver temporairement pour debugging Workers [OFFICIEL - Confiance élevée]
3. **Configurer resolve.conditions explicitement** — Vite 6 ne les ajoute plus automatiquement ; importer `defaultServerConditions` depuis 'vite' si problèmes SSR [OFFICIEL - Confiance élevée]

### Options build critiques

4. **Préférer build.format: 'directory'** — Crée `/about/index.html` compatible trailing slashes Cloudflare ; utiliser `'file'` seulement si URLs sans slash requises [OFFICIEL - Confiance élevée]
5. **Laisser compressHTML: true** — Cloudflare compresse automatiquement (Brotli/gzip) mais compressHTML réduit la taille pré-compression [INFÉRÉ - Confiance moyenne]
6. **Respecter la limite 10MB compressé** — Workers payants autorisent 10MB compressé ; configurer `vite.build.rollupOptions.output.manualChunks` pour chunking si nécessaire [OFFICIEL - Confiance élevée]

### Output mode

7. **Remplacer hybrid par static + prerender: false** — `output: 'hybrid'` supprimé dans Astro 5.x ; utiliser `output: 'static'` avec `export const prerender = false` par page [OFFICIEL - Confiance élevée]
8. **Utiliser output: 'server' pour sites majoritairement SSR** — Plus simple que static avec opt-out ; `export const prerender = true` pour pages statiques [OFFICIEL - Confiance élevée]

### @astrojs/cloudflare adapter

9. **Activer platformProxy pour dev local** — `platformProxy: { enabled: true, configPath: 'wrangler.jsonc' }` émule le runtime Cloudflare localement [OFFICIEL - Confiance élevée]
10. **Choisir imageService selon le contexte** — `'cloudflare'` pour Image Resizing actif, `'compile'` pour build-time uniquement, jamais Sharp [OFFICIEL - Confiance élevée]
11. **Configurer nodejs_compat dans wrangler.toml** — Requis pour tout import `node:*` ; ajouter `compatibility_flags = ["nodejs_compat"]` [OFFICIEL - Confiance élevée]

### Workflow build/deploy

12. **Utiliser wrangler-action@v3** — `cloudflare/pages-action` est déprécié ; command: `pages deploy dist --project-name=X` [OFFICIEL - Confiance élevée]
13. **Exécuter astro check avant build en CI** — Script recommandé : `"build": "astro check && astro build"` pour catch TypeScript errors [OFFICIEL - Confiance élevée]
14. **Définir NODE_VERSION=22** — Variable d'environnement CI/Cloudflare pour éviter erreurs syntaxe ES2024 [COMMUNAUTAIRE - Confiance élevée]
15. **Régénérer types après changements schema** — `astro sync` après modification Content Collections, env schema, ou Actions [OFFICIEL - Confiance élevée]

---

## 2. Decision Matrix

|Situation|Approche Astro 5.17+|Raison|Confiance|
|---|---|---|---|
|**Site 100% statique sans SSR**|`output: 'static'` (défaut) sans adapter|Pas besoin de Workers, déploiement static pur|Élevée [OFFICIEL]|
|**Site statique avec quelques pages SSR**|`output: 'static'` + adapter cloudflare + `prerender: false` par page|Remplace l'ancien `hybrid` ; SSR sélectif|Élevée [OFFICIEL]|
|**Site majoritairement SSR**|`output: 'server'` + adapter cloudflare + `prerender: true` pour statiques|Plus simple, pages statiques opt-in|Élevée [OFFICIEL]|
|**Server Islands requis**|`output: 'server'` + `ASTRO_KEY` en env var|Server Islands nécessitent mode server + clé pour rolling deploys|Élevée [OFFICIEL]|
|**Sessions Astro**|Configurer `sessionKVBindingName` + binding KV dans wrangler.toml|KV requis pour session storage sur Cloudflare|Élevée [OFFICIEL]|
|**URLs avec trailing slash**|`build.format: 'directory'` + `trailingSlash: 'always'`|Crée `/about/index.html`, compatible Cloudflare routing|Élevée [OFFICIEL]|
|**URLs sans trailing slash**|`build.format: 'file'` + `trailingSlash: 'never'`|Crée `/about.html`, pas de redirect automatique|Moyenne [INFÉRÉ]|
|**Dépendances Node.js simples** (buffer, path, crypto)|`nodejs_compat` flag seul|APIs natives supportées par Workers|Élevée [OFFICIEL]|
|**Dépendances Node.js complexes** (polyfills requis)|`nodejs_compat` + `compatibility_date >= 2024-09-23` (active v2 auto)|v2 ajoute polyfills unenv automatiquement|Élevée [OFFICIEL]|
|**Bundle size critique**|`nodejs_compat` + `no_nodejs_compat_v2` flag|Désactive polyfills v2, réduit taille|Moyenne [OFFICIEL]|
|**Dev local avec bindings**|`wrangler pages dev ./dist` ou `platformProxy: { enabled: true }`|Émule KV/D1/R2 localement|Élevée [OFFICIEL]|
|**Preview site build**|`astro preview` pour static, `wrangler pages dev ./dist` pour SSR|`astro preview` ne supporte pas Workers runtime|Élevée [OFFICIEL]|
|**Nouveau projet 2025+**|Workers Static Assets (`main` + `assets.directory`)|Cloudflare recommande Workers > Pages pour nouveaux projets|Élevée [OFFICIEL]|
|**Projet existant Pages**|Garder `pages_build_output_dir` dans wrangler config|Migration non urgente, Pages reste supporté|Moyenne [INFÉRÉ]|
|**CI/CD avec PR previews**|`wrangler pages deploy --branch=${{ github.head_ref }}`|URLs automatiques `<branch>.<project>.pages.dev`|Élevée [OFFICIEL]|

---

## 3. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|`output: 'hybrid'`|`output: 'static'` + `prerender: false` par page|**Build error** — option supprimée dans Astro 5.x|[OFFICIEL] docs.astro.build/upgrade-to/v5|
|Importer `'buffer'` sans préfixe|Importer `'node:buffer'` avec préfixe|**Runtime error** — Workers requiert préfixe `node:*`|[OFFICIEL] developers.cloudflare.com|
|`imageService: 'sharp'` ou défaut|`imageService: 'cloudflare'` ou `'compile'`|**Build error** — Sharp incompatible Workers|[OFFICIEL] docs.astro.build/cloudflare|
|Accéder env vars via `import.meta.env` en SSR runtime|Accéder via `Astro.locals.runtime.env.VAR`|**undefined** — Cloudflare env vars non dans import.meta.env au runtime|[OFFICIEL] docs.astro.build/cloudflare|
|Oublier `nodejs_compat` flag|Ajouter `compatibility_flags = ["nodejs_compat"]` dans wrangler.toml|**Module not found** — Node APIs non disponibles|[OFFICIEL] developers.cloudflare.com|
|`cloudflare/pages-action`|`cloudflare/wrangler-action@v3` avec `pages deploy`|**Deprecated** — action plus maintenue|[OFFICIEL] github.com/cloudflare|
|Build sans `NODE_VERSION=22` en CI|Définir `NODE_VERSION=22` env var|**Syntax errors** — Node 18 ne supporte pas ES2024|[COMMUNAUTAIRE] GitHub issues|
|Bundle > 10MB compressé (paid) / 3MB (free)|Configurer `manualChunks`, tree-shaking, analyser deps|**Deploy fail** — Worker size limit exceeded|[OFFICIEL] workers limits|
|`compressHTML: false` systématiquement|Garder `compressHTML: true` (défaut)|**Performance** — HTML plus volumineux inutilement|[INFÉRÉ]|
|Hardcoder paths dans config|Utiliser `import.meta.env.BASE_URL`, configurer `site`/`base`|**Broken links** — paths incorrects en preview/prod|[OFFICIEL] docs.astro.build|
|Ignorer `astro check` en CI|Ajouter `astro check &&` avant `astro build`|**Runtime errors** — TypeScript errors non détectées|[COMMUNAUTAIRE]|
|`process.env` pour runtime vars Cloudflare|`Astro.locals.runtime.env` pour SSR|**undefined** — process.env limité au build-time|[OFFICIEL] docs.astro.build/cloudflare|
|`wrangler dev` pour projet Astro SSR|`wrangler pages dev ./dist` après `astro build`|**Routing broken** — wrangler dev pour Workers purs|[INFÉRÉ]|
|Créer `/functions` directory avec adapter|Utiliser Astro API routes (`src/pages/api/`)|**Conflits** — adapter désactive functions directory|[OFFICIEL] docs.astro.build/cloudflare|

---

## 4. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|`Could not resolve "node:fs"` ou `"node:buffer"`|`nodejs_compat` flag manquant|Ajouter `compatibility_flags = ["nodejs_compat"]` dans wrangler.toml|[OFFICIEL]|
|`SyntaxError: Unexpected token 'with'`|Node.js version < 22 en CI/Cloudflare|Définir `NODE_VERSION=22` en variable d'environnement|[COMMUNAUTAIRE]|
|Build OK local, fail sur Cloudflare|Différence case-sensitivity filesystem|Utiliser `git mv` pour renommer fichiers avec casse correcte|[COMMUNAUTAIRE]|
|`Could not load the "sharp" module`|Sharp incompatible Workers|Configurer `imageService: 'cloudflare'` ou `'compile'` dans adapter|[OFFICIEL]|
|`[ERROR] No account id found`|Account ID manquant dans wrangler-action|Ajouter `accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}`|[OFFICIEL]|
|`Script exceeded size limit`|Bundle > 10MB (paid) / 3MB (free)|Analyser avec `npx vite-bundle-visualizer`, configurer `manualChunks`|[OFFICIEL]|
|Bindings (KV/D1) undefined en dev|`platformProxy` non configuré|Ajouter `platformProxy: { enabled: true, configPath: 'wrangler.jsonc' }`|[OFFICIEL]|
|Types incorrects après mise à jour|`.astro/types.d.ts` obsolète|Exécuter `astro sync` pour régénérer|[OFFICIEL]|
|`Hydration completed but contains mismatches`|Cloudflare Auto Minify HTML activé|Désactiver Auto Minify dans Cloudflare Dashboard > Speed > Optimization|[COMMUNAUTAIRE]|
|Assets 404 après deploy Workers|`.assetsignore` manquant|Créer `public/.assetsignore` avec `_worker.js` et `_routes.json`|[OFFICIEL]|
|`Cannot find module 'cloudflare:workers'` en dev|Import Cloudflare-specific en mode dev|Utiliser `platformProxy` ou conditionner import avec `import.meta.env.PROD`|[COMMUNAUTAIRE]|
|Timeout pendant build CI|Mémoire insuffisante pour gros sites|Ajouter `NODE_OPTIONS="--max-old-space-size=4096"`|[COMMUNAUTAIRE]|
|Session data perdue entre requêtes|KV namespace non configuré|Ajouter binding KV `SESSION` dans wrangler.toml et Dashboard|[OFFICIEL]|
|`ERR_REQUIRE_ESM`|Conflit ESM/CJS dans dépendances|Utiliser Node 22+, vérifier `type: "module"` dans package.json|[COMMUNAUTAIRE]|
|Server Islands cassés en production|`ASTRO_KEY` manquant|Générer avec `astro create-key`, définir en env var CI/Cloudflare|[OFFICIEL]|
|Preview URL affiche ancienne version|Cache Cloudflare|Cache auto-invalidé au deploy ; vérifier deployment ID correct|[INFÉRÉ]|

---

## 5. Code Patterns

### astro.config.mjs optimisé Cloudflare (< 25 lignes)

```javascript
// astro.config.mjs — Astro 5.17+ / Cloudflare Workers
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server', // SSR par défaut ; 'static' si majorité statique
  site: 'https://example.com', // Requis pour sitemap, canonical URLs
  adapter: cloudflare({
    imageService: 'cloudflare', // Ou 'compile' si Image Resizing non disponible
    platformProxy: { enabled: true, configPath: 'wrangler.jsonc' }, // Dev local avec bindings
  }),
  build: {
    format: 'directory', // /about/index.html — compatible trailing slashes
  },
  vite: {
    ssr: { external: ['node:buffer', 'node:crypto', 'node:path'] }, // Workers compat
    build: { minify: 'esbuild' }, // Fast ; false pour debug
  },
});
```

### wrangler.jsonc minimal Astro Pages

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-astro-app",
  "main": "./dist/_worker.js/index.js", // Entry point généré par adapter
  "compatibility_date": "2025-01-15", // Date récente pour features modernes
  "compatibility_flags": ["nodejs_compat"], // Requis pour node:* imports
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist" // Dossier build Astro
  },
  // Bindings optionnels
  "kv_namespaces": [
    { "binding": "SESSION", "id": "<KV_NAMESPACE_ID>" }
  ]
}
```

### GitHub Actions workflow complet

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22' # Requis pour ES2024 features
          cache: 'npm'
      
      - name: Cache Astro artifacts
        uses: actions/cache@v4
        with:
          path: node_modules/.astro
          key: astro-${{ hashFiles('src/**') }}
      
      - run: npm ci
      - run: npm run build # Inclut "astro check && astro build"
        env:
          NODE_OPTIONS: "--max-old-space-size=4096"
      
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=my-astro-site --branch=${{ github.head_ref || 'main' }}
```

### Accès bindings Cloudflare dans Astro Action

```typescript
// src/actions/index.ts — Astro 5.x Actions avec Cloudflare bindings
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  saveData: defineAction({
    input: z.object({ key: z.string(), value: z.string() }),
    handler: async ({ key, value }, context) => {
      // Accès bindings via context.locals.runtime.env
      const { env } = context.locals.runtime;
      
      // KV
      await env.MY_KV.put(key, value);
      
      // D1
      await env.MY_DB.prepare('INSERT INTO data (key, value) VALUES (?, ?)')
        .bind(key, value)
        .run();
      
      return { success: true };
    },
  }),
};
```

### Configuration Vite 6 avec polyfills Node

```javascript
// astro.config.mjs — Configuration Vite 6 avancée
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare(),
  vite: {
    ssr: {
      // Modules à externaliser (supportés par Workers avec nodejs_compat)
      external: ['node:buffer', 'node:crypto', 'node:stream', 'node:path', 'node:url'],
      // Modules à bundler (adapter ou deps sans node:* support)
      noExternal: ['@astrojs/cloudflare'],
    },
    resolve: {
      alias: {
        '@': '/src', // Alias projet standard
      },
    },
    build: {
      minify: 'esbuild',
      rollupOptions: {
        output: {
          // Chunking pour respecter limite 10MB
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              return 'vendor';
            }
          },
        },
      },
    },
    // Vite 6: JSON stringify auto pour gros fichiers
    json: { stringify: 'auto' },
  },
});
```

### .assetsignore requis pour Workers

```
# public/.assetsignore — Exclure fichiers Workers du serving static
_worker.js
_routes.json
```

---

## 6. Références pour references/

### Options @astrojs/cloudflare adapter (v12.6.x)

|Option|Type|Défaut|Description|
|---|---|---|---|
|`cloudflareModules`|`boolean`|`true`|Active imports `.wasm`, `.bin`, `.txt`|
|`imageService`|`'passthrough' \| 'cloudflare' \| 'compile' \| 'custom'`|`'compile'`|Service de traitement images|
|`platformProxy.enabled`|`boolean`|`true`|Émulation runtime CF en dev|
|`platformProxy.configPath`|`string`|`undefined`|Chemin vers wrangler config|
|`platformProxy.persist`|`boolean \| { path: string }`|`true`|Persistance données locales bindings|
|`routes.extend.include`|`{ pattern: string }[]`|`[]`|Routes SSR additionnelles (Pages only)|
|`routes.extend.exclude`|`{ pattern: string }[]`|`[]`|Routes à exclure du SSR|
|`sessionKVBindingName`|`string`|`'SESSION'`|Nom binding KV pour sessions|
|`workerEntryPoint.path`|`string`|`'@astrojs/cloudflare/entrypoints/server.js'`|Entry point Worker custom|
|`workerEntryPoint.namedExports`|`string[]`|`[]`|Exports nommés (Durable Objects)|

**Grep hint**: `adapter.*cloudflare\(|cloudflareModules|imageService|platformProxy|sessionKV`

### CLI flags utiles par commande

|Commande|Flag|Description|
|---|---|---|
|`astro build`|`--verbose`|Logging détaillé|
|`astro build`|`--devOutput`|Build mode dev (debugging)|
|`astro build`|`--outDir <path>`|Override dossier output|
|`astro dev`|`--host`|Expose sur réseau (test mobile)|
|`astro dev`|`--port <n>`|Port custom|
|`astro dev`|`--force`|Rebuild Content Layer cache|
|`astro check`|`--watch`|Mode watch continu|
|`astro check`|`--noSync`|Skip sync avant check|
|`astro sync`|—|Régénère `.astro/types.d.ts`|
|`astro info`|`--copy`|Copie info dans clipboard|
|`astro preferences`|`disable devToolbar`|Désactive toolbar dev|
|`astro create-key`|—|Génère ASTRO_KEY pour Server Islands|

**Grep hint**: `astro (build|dev|check|sync|info|preferences|create-key)`

### Limites Cloudflare Workers vs options Astro

|Ressource|Free|Paid|Option Astro liée|
|---|---|---|---|
|Taille bundle (compressé)|3 MB|10 MB|`vite.build.rollupOptions.output.manualChunks`|
|CPU time/request|10 ms|30s (défaut), 5 min max|N/A (optimiser code serveur)|
|Mémoire/isolate|128 MB|128 MB|N/A|
|Subrequests/request|50|1,000|N/A (limiter fetch en SSR)|
|Fichiers statiques/version|20,000|100,000|N/A|
|Taille fichier individuel|25 MiB|25 MiB|N/A|
|Variables environnement|64|128|`env.schema` dans astro.config|
|Workers par compte|100|500|N/A|

**Grep hint**: `workers.*limit|bundle.*size|cpu.*time|subrequest`

### Compatibilité Node.js APIs dans Cloudflare Workers

|Module|Status|Notes|
|---|---|---|
|`node:buffer`|✅ Supporté|Requis préfixe `node:`|
|`node:crypto`|✅ Partiel|SubtleCrypto complet, autres limités|
|`node:stream`|✅ Supporté|Web Streams API|
|`node:path`|✅ Supporté|Complet|
|`node:url`|✅ Supporté|Complet|
|`node:util`|✅ Supporté|Complet|
|`node:events`|✅ Supporté|EventEmitter|
|`node:async_hooks`|✅ Supporté|AsyncLocalStorage|
|`node:fs`|⚠️ Partiel|Limité, utiliser KV/R2|
|`node:child_process`|❌ Non supporté|Impossible dans Workers|
|`node:net`|❌ Non supporté|Utiliser connect() API|

**Grep hint**: `node:.*import|nodejs_compat|compatibility_flags`

---

## 7. Sources consultées

### Documentation officielle (Confiance élevée)

|Source|URL|Version/Date|
|---|---|---|
|Astro Configuration Reference|https://docs.astro.build/en/reference/configuration-reference/|Astro 5.x|
|Astro CLI Reference|https://docs.astro.build/en/reference/cli-reference/|Astro 5.x|
|Astro Upgrade to v5 Guide|https://docs.astro.build/en/guides/upgrade-to/v5/|Astro 5.0|
|Astro Cloudflare Adapter|https://docs.astro.build/en/guides/integrations-guide/cloudflare/|@astrojs/cloudflare 12.x|
|Astro Deploy to Cloudflare|https://docs.astro.build/en/guides/deploy/cloudflare/|Astro 5.x|
|Vite 6 Migration Guide|https://v6.vite.dev/guide/migration|Vite 6.0|
|Vite Environment API|https://vite.dev/guide/api-environment|Vite 6.0|
|Cloudflare Workers Limits|https://developers.cloudflare.com/workers/platform/limits/|Nov 2025|
|Cloudflare Workers Astro Guide|https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/|2025|
|Cloudflare Pages Wrangler Config|https://developers.cloudflare.com/pages/functions/wrangler-configuration/|2025|
|Cloudflare Vite Plugin|https://developers.cloudflare.com/workers/vite-plugin/|GA Avril 2025|
|wrangler-action GitHub|https://github.com/cloudflare/wrangler-action|v3.14.x|

### Versions confirmées

|Package|Version|Notes|
|---|---|---|
|Astro|5.17+|Stable, Sessions GA|
|@astrojs/cloudflare|12.6.12|Stable, compatible 5.x|
|Vite|6.x|Bundled avec Astro 5.x|
|Wrangler|3.91+|JSON config support|
|Node.js (CI)|22.x|Recommandé pour ES2024|

### Informations inférées (Confiance moyenne)

- Interaction `compressHTML` + compression Cloudflare : pas de documentation explicite sur redondance, mais les deux optimisent différemment
- Préférence `wrangler pages dev` vs `astro preview` pour SSR : inféré du fait que preview ne simule pas Workers runtime
- Stratégie chunking pour limites bundle : basé sur documentation Vite + limites Workers, pas de guide Astro-specific