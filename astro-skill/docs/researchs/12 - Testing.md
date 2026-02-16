# Testing Astro 5.17+ sur Cloudflare : Guide pratique

**Bottom Line Up Front** : Le testing d'Astro 5.17+ sur Cloudflare repose sur trois piliers : **Vitest + Container API** pour les tests unitaires (expérimental mais fonctionnel), **@cloudflare/vitest-pool-workers** pour tester les bindings dans le runtime workerd, et **Playwright avec `wrangler pages dev ./dist`** pour les tests E2E en conditions réelles. La Container API reste expérimentale avec l'import `experimental_AstroContainer` — prévoir des adaptations à chaque mise à jour.

---

## 1. Quick Reference

|#|Règle impérative|Raison|Source|Confiance|
|---|---|---|---|---|
|1|**Utiliser `getViteConfig()` de `astro/config`** au lieu de `defineConfig()` de Vitest|Applique les transforms Astro nécessaires aux `.astro` files|[OFFICIEL]|Élevée|
|2|**Ajouter `/// <reference types="vitest/config" />`** en haut de `vitest.config.ts`|Corrige l'erreur TypeScript "'test' does not exist" avec Astro 5.x|[OFFICIEL]|Élevée|
|3|**Rester sur Vitest 3.x** — Vitest 4 n'est pas encore compatible avec Astro|Évite les erreurs `[object Object]` et problèmes de rendu|[COMMUNAUTAIRE]|Élevée|
|4|**Utiliser `experimental_AstroContainer`** et non `AstroContainer`|L'API reste expérimentale — l'alias garde la conscience du statut|[OFFICIEL]|Élevée|
|5|**Configurer `platformProxy: { enabled: true }`** dans l'adapter Cloudflare|Donne accès aux bindings KV/D1/R2 pendant `astro dev`|[OFFICIEL]|Élevée|
|6|**Utiliser `@cloudflare/vitest-pool-workers`** pour tester du code avec bindings|Tests s'exécutent dans workerd réel, pas Node.js émulé|[OFFICIEL]|Élevée|
|7|**Tester avec `wrangler pages dev ./dist`** avant déploiement|Seul moyen de valider le comportement production exact|[OFFICIEL]|Élevée|
|8|**Définir `environment: 'node'`** par défaut, overrider par fichier pour composants DOM|Évite les erreurs TextEncoder/DOM dans les tests serveur|[COMMUNAUTAIRE]|Moyenne|
|9|**Appliquer `wrangler types`** avant chaque build/test|Génère les types Cloudflare pour `Astro.locals.runtime.env`|[OFFICIEL]|Élevée|
|10|**Externaliser la logique métier des Actions** dans des fonctions pures testables|Les Actions ne sont pas directement testables unitairement|[INFÉRÉ]|Moyenne|
|11|**Utiliser `loadRenderers()` + `getContainerRenderer()`** pour tester composants React/Vue/Svelte|Sans ça, les framework components ne rendent pas|[OFFICIEL]|Élevée|
|12|**Configurer `animations: 'disabled'`** dans Playwright pour visual tests|Élimine le flakiness dû aux transitions CSS/View Transitions|[OFFICIEL]|Élevée|
|13|**Attendre `astro:page-load`** plutôt que `DOMContentLoaded` après View Transitions|L'événement standard ne se déclenche pas lors des navigations SPA|[OFFICIEL]|Élevée|
|14|**Ajouter `transition:persist`** aux composants dont l'état doit survivre aux navigations|L'hydration ne revalide pas le state après View Transition|[OFFICIEL]|Élevée|
|15|**Éviter les tests qui dépendent de la cohérence immédiate KV**|KV a une consistance éventuelle (~60s globalement)|[OFFICIEL]|Élevée|

---

## 2. Decision Matrix

|Situation|Type de test|Outil|Configuration clé|Confiance|
|---|---|---|---|---|
|Composant Astro statique (props/slots)|Unitaire|Vitest + Container API|`container.renderToString(Comp, {props, slots})`|Élevée|
|Composant avec React/Vue/Svelte|Unitaire|Vitest + Container API|`loadRenderers([getContainerRenderer()])`|Élevée|
|Composant avec scripts client (`client:load`)|Browser|vitest-browser-astro|`render()` + `waitForHydration()`|Moyenne|
|Astro Action (validation Zod)|Unitaire|Vitest|Tester le schéma Zod et handler extrait|Moyenne|
|Astro Action (full flow)|E2E|Playwright|Submit form, vérifier response|Élevée|
|API Endpoint GET/POST|Unitaire|Vitest + Container API|`container.renderToResponse(Endpoint, {routeType:'endpoint'})`|Élevée|
|Code utilisant Cloudflare KV/D1/R2|Unitaire|@cloudflare/vitest-pool-workers|`import { env } from 'cloudflare:test'`|Élevée|
|Middleware Astro|Unitaire|Vitest|Mock context/next, tester en isolation|Moyenne|
|Content Collection schema|Unitaire|Vitest|`schema.parse()` / `schema.safeParse()`|Élevée|
|Content Collection avec loader|Intégration|Vitest + dev server|`await dev({root: '.'})` puis fetch|Moyenne|
|View Transitions navigation|E2E|Playwright|Wait for `data-astro-transition` removal|Élevée|
|Server Islands (server:defer)|E2E|Playwright|Wait for fallback → content transition|Élevée|
|Sessions Astro avec Cloudflare KV|E2E|Playwright + wrangler|`wrangler pages dev ./dist` comme webServer|Élevée|
|Visual regression responsive|E2E|Playwright|`toHaveScreenshot()` avec viewports multiples|Élevée|
|Snapshot HTML|Unitaire|Vitest + Container API|`expect(result).toMatchSnapshot()`|Moyenne|
|SSG pages prerendered|E2E|Playwright|`astro preview` webServer|Élevée|
|SSR pages dynamiques|E2E|Playwright|`wrangler pages dev ./dist`|Élevée|
|Hybrid mode mixte|E2E|Playwright|Tests séparés par projet Playwright|Moyenne|

---

## 3. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|`import { defineConfig } from 'vitest/config'`|`import { getViteConfig } from 'astro/config'`|Fichiers `.astro` non transformés, erreurs de parsing|[OFFICIEL]|
|Tester l'hydration client avec Container API|Utiliser vitest-browser-astro ou Playwright|Container = server-side only, pas de JS client|[OFFICIEL]|
|`await page.waitForSelector('button')` après navigation View Transition|`await page.waitForFunction(() => !document.documentElement.hasAttribute('data-astro-transition'))`|Tests flaky, éléments visibles mais non interactifs|[COMMUNAUTAIRE]|
|Mocker manuellement KV/D1 avec des objets JS|Utiliser `@cloudflare/vitest-pool-workers` avec Miniflare|Comportement divergent du runtime workerd|[OFFICIEL]|
|`astro dev` pour tester les Sessions Cloudflare|`wrangler pages dev ./dist`|Sessions utilisent KV qui nécessite runtime workerd|[OFFICIEL]|
|Vitest 4.x avec Astro 5.x|Rester sur Vitest ~3.2.x|Erreurs `[object Object]`, rendering cassé|[COMMUNAUTAIRE]|
|Définir `AstroContainer` comme alias stable|Garder `experimental_AstroContainer`|API peut casser dans versions patch|[OFFICIEL]|
|Tester les Actions via import direct|Externaliser le handler ou tester via endpoint `/_actions/name`|Actions liées au contexte Astro non extractible|[DOC-GAPS]|
|Générer baselines visuelles sur OS différent du CI|Docker ou même OS pour baseline et CI|Screenshots différents entre Windows/Mac/Linux|[COMMUNAUTAIRE]|
|`happy-dom` pour tout|`environment: 'node'` défaut + override par fichier|happy-dom a des incompatibilités avec certains tests server|[COMMUNAUTAIRE]|
|`npm run dev` dans webServer Playwright|`npm run build && npm run preview` ou `wrangler pages dev ./dist`|Dev mode != production, masque des bugs|[OFFICIEL]|
|Ignorer `wrangler types` dans le workflow|Exécuter avant tests/build|Types `Env` désynchronisés des bindings réels|[OFFICIEL]|

---

## 4. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|`'test' does not exist in type 'UserConfig'`|Types Vitest non référencés|Ajouter `/// <reference types="vitest/config" />` en L1|[OFFICIEL] GitHub #12723|
|`Failed to parse source for import analysis`|`defineConfig` au lieu de `getViteConfig`|Utiliser `getViteConfig()` de `astro/config`|[OFFICIEL]|
|`Unknown Error: [object Object]` dans Vitest|Incompatibilité Vitest 4.x|Downgrade vers Vitest ~3.2.x|[COMMUNAUTAIRE]|
|`NoClientEntrypoint: component has client:only directive`|Client renderer manquant|`container.addClientRenderer({name: '@astrojs/react', entrypoint: '@astrojs/react/client.js'})`|[OFFICIEL]|
|Container crash avec `Astro.rewrite()`|Non supporté avant Astro 5.3|Mettre à jour vers Astro ≥5.3|[OFFICIEL] #13358|
|Framework components (React/Vue) ne rendent pas|Renderers non chargés|`loadRenderers([getContainerRenderer()])` + passer à `create({renderers})`|[OFFICIEL]|
|`Invariant violation: "new TextEncoder().encode("")"`|Environnement jsdom cassé|Switch vers `// @vitest-environment node` ou `happy-dom`|[COMMUNAUTAIRE]|
|Content Collections API errors dans tests|Transforms Astro non appliqués|Utiliser `getViteConfig()` et non vitest seul|[OFFICIEL]|
|Bindings Cloudflare `undefined` dans tests|`platformProxy` non configuré|Ajouter `platformProxy: { enabled: true }` dans adapter config|[OFFICIEL]|
|KV write non visible immédiatement|Consistance éventuelle KV (~60s)|Tester en read-after-write local, ou ajouter délai|[OFFICIEL]|
|Click ne fonctionne pas après hydration visible|Hydration JavaScript non complète|`await page.waitForSelector('[data-hydrated="true"]')`|[COMMUNAUTAIRE]|
|State perdu après View Transition|Component re-mounted sans persistence|Ajouter `transition:persist` avec `transition:name` unique|[OFFICIEL]|
|Script ne s'exécute pas après navigation|Modules bundled exécutent une fois|Ajouter `data-astro-rerun` ou listener `astro:page-load`|[OFFICIEL]|
|Visual tests flaky entre runs|Animations, fonts, timing|`animations: 'disabled'`, `waitForLoadState('networkidle')`|[OFFICIEL]|
|`Could not resolve "node:stream"` build error|Node built-ins non disponibles Workers|Externaliser ou utiliser alternative Cloudflare-compatible|[OFFICIEL]|
|`Sharp is not compatible with @astrojs/cloudflare`|Sharp utilise native bindings|`imageService: 'compile'` ou Cloudflare Image Resizing|[OFFICIEL]|
|Durable Objects non accessibles avec `getPlatformProxy`|`script_name` requis|Ajouter `script_name` dans config DO|[OFFICIEL]|

---

## 5. Code Patterns

### vitest.config.ts optimal pour Astro 5.17+/Cloudflare

```typescript
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,astro}'],
      exclude: ['**/*.config.*', 'src/test/**'],
    },
  },
});
```

**[OFFICIEL]** - Astro Testing Docs, Vitest 3.x requis

---

### Test unitaire Container API avec props et slots

```typescript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Card from '../components/Card.astro';

test('Card renders with props and slots', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Card, {
    props: { title: 'Test Title' },
    slots: { default: 'Slot content here' },
  });
  expect(html).toContain('Test Title');
  expect(html).toContain('Slot content here');
});
```

**[OFFICIEL]** - Astro Container API Reference

---

### Test unitaire d'une Astro Action avec mock Cloudflare env

```typescript
import { describe, test, expect, vi } from 'vitest';
import { z } from 'astro/zod';

// Extraire le handler et schema de l'Action pour testing
const likeSchema = z.object({ postId: z.string() });
const likeHandler = async (input: z.infer<typeof likeSchema>, ctx: any) => {
  const count = await ctx.locals.runtime.env.KV.get(`likes:${input.postId}`);
  return { likes: Number(count || 0) + 1 };
};

test('like action validates and returns count', async () => {
  const mockCtx = {
    locals: { runtime: { env: { KV: { get: vi.fn().mockResolvedValue('5') } } } },
  };
  const result = await likeHandler({ postId: 'post-1' }, mockCtx);
  expect(result.likes).toBe(6);
});
```

**[INFÉRÉ]** - Pattern dérivé de la doc Actions + Cloudflare bindings

---

### playwright.config.ts avec webServer wrangler

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: 'http://localhost:4321', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && wrangler pages dev ./dist --port 4321',
    url: 'http://localhost:4321',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

**[OFFICIEL]** - Playwright webServer + Cloudflare wrangler docs

---

### Test E2E View Transitions

```typescript
import { test, expect } from '@playwright/test';

test('navigation avec View Transitions', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/about"]');
  
  // Attendre fin de la transition
  await page.waitForFunction(() => 
    !document.documentElement.hasAttribute('data-astro-transition')
  );
  
  await expect(page).toHaveURL('/about');
  await expect(page.locator('h1')).toContainText('About');
});
```

**[COMMUNAUTAIRE]** - Pattern validé, basé sur View Transitions impl

---

### Mock Cloudflare bindings pour tests d'intégration

```typescript
// vitest.config.ts pour tests avec bindings réels
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.json' },
        miniflare: {
          kvNamespaces: ['SESSION'],
          d1Databases: ['DB'],
        },
      },
    },
  },
});
```

```typescript
// test.ts
import { env } from 'cloudflare:test';
import { test, expect } from 'vitest';

test('KV binding works', async () => {
  await env.SESSION.put('user:1', JSON.stringify({ name: 'Test' }));
  const data = await env.SESSION.get('user:1', 'json');
  expect(data.name).toBe('Test');
});
```

**[OFFICIEL]** - Cloudflare Vitest Integration docs

---

### GitHub Actions workflow test pipeline

```yaml
name: Test & Deploy
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run test:unit
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci && npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy ./dist --project-name=${{ github.event.repository.name }}
```

**[OFFICIEL]** - GitHub Actions + Cloudflare wrangler-action docs

---

## 6. Références pour references/

### Matrice de compatibilité Container API

|Feature|Status Astro 5.17+|Notes|
|---|---|---|
|`renderToString()`|✅ Stable pattern|Fonctionne avec Astro components|
|`renderToResponse()`|✅ Stable pattern|Pour endpoints avec `routeType: 'endpoint'`|
|Props/Slots|✅ Stable|Named slots via `slots: { header: '...' }`|
|Request/Params/Locals|✅ Stable|Injection context via options|
|Framework renderers|✅ Stable|Requiert `loadRenderers()`|
|`Astro.rewrite()`|✅ Fixed Astro 5.3+|Crash avant cette version|
|Server Islands|⚠️ Limité|Rendu initial seulement, pas de defer|
|Client scripts|❌ Non supporté|Utiliser E2E ou vitest-browser-astro|
|View Transitions|❌ Non supporté|E2E requis|
|Sessions|⚠️ Limité|Nécessite mock `Astro.locals`|

**[OFFICIEL]** - Container API Reference

---

### Node.js APIs non disponibles dans Workers runtime

|API|Status|Alternative|
|---|---|---|
|`fs` (sync)|❌|Utiliser KV/R2|
|`child_process`|❌|Workers AI ou external service|
|`cluster`|❌|N/A (Workers scale automatiquement)|
|`dgram` (UDP)|❌|N/A|
|`http.createServer()`|⚠️ Requiert flag|Utiliser `export default { fetch }`|
|`net.createServer()`|⚠️ Limité|Connect() seulement avec flag|
|`process.cwd()`|❌|N/A|
|`process.exit()`|❌|N/A|
|`require()`|❌|ESM imports only|
|Native C++ addons|❌|WASM alternatives|

**Config requise** : `compatibility_flags = ["nodejs_compat"]` dans wrangler.toml

**[OFFICIEL]** - Cloudflare Workers Node.js Compatibility

---

### Configuration Miniflare/getPlatformProxy par binding

```typescript
// Pour tests avec getPlatformProxy
import { getPlatformProxy } from 'wrangler';

const { env, dispose } = await getPlatformProxy({
  configPath: './wrangler.json',
  persist: { path: './.wrangler/state/v3' }, // Partager avec wrangler dev
});

// env.MY_KV, env.MY_D1, env.MY_R2 disponibles
```

|Binding|getPlatformProxy|@cloudflare/vitest-pool-workers|
|---|---|---|
|KV|✅ Full|✅ Full|
|D1|✅ Full|✅ Full + migrations|
|R2|✅ Full|✅ Full|
|Durable Objects|⚠️ Requiert script_name|✅ Full|
|Queues|✅ Full|✅ Full|
|Workers AI|✅ (charges usage)|✅ (charges usage)|
|Hyperdrive|⚠️ Passthrough|⚠️ Passthrough|
|Service Bindings|✅ Full|✅ Full|

**[OFFICIEL]** - Cloudflare Wrangler API + Vitest Integration docs

---

### Patterns de test par rendering mode

**SSG (prerendered)**

```typescript
// playwright.config.ts
webServer: { command: 'npm run build && npm run preview' }

// test: Vérifier cache headers, contenu statique
test('SSG page has content', async ({ page }) => {
  const response = await page.goto('/static-page');
  expect(response?.headers()['cache-control']).toContain('max-age');
});
```

**SSR (on-demand)**

```typescript
// playwright.config.ts  
webServer: { command: 'npm run build && wrangler pages dev ./dist' }

// test: Vérifier données dynamiques
test('SSR page renders dynamic data', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('[data-user]')).toBeVisible();
});
```

**Hybrid (mixte)**

```typescript
// Séparer les tests par projet Playwright
projects: [
  { name: 'static', testMatch: /static\.spec\.ts/, use: { /* ... */ } },
  { name: 'dynamic', testMatch: /dynamic\.spec\.ts/, use: { /* ... */ } },
]
```

**Server Islands**

```typescript
test('Server Island loads after fallback', async ({ page }) => {
  await page.goto('/with-island');
  await expect(page.locator('.fallback')).toBeVisible();
  await expect(page.locator('[data-island-loaded]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.fallback')).not.toBeVisible();
});
```

**[COMMUNAUTAIRE]** - Patterns consolidés de la communauté Astro

---

## 7. Sources consultées

|Source|Type|URL|Confiance|
|---|---|---|---|
|Astro Testing Guide|[OFFICIEL]|docs.astro.build/en/guides/testing/|Élevée|
|Astro Container API Reference|[OFFICIEL]|docs.astro.build/en/reference/container-reference/|Élevée|
|Cloudflare Workers Testing|[OFFICIEL]|developers.cloudflare.com/workers/testing/|Élevée|
|Cloudflare Vitest Integration|[OFFICIEL]|developers.cloudflare.com/workers/testing/vitest-integration/|Élevée|
|Cloudflare Wrangler API|[OFFICIEL]|developers.cloudflare.com/workers/wrangler/api/|Élevée|
|Astro Cloudflare Adapter|[OFFICIEL]|docs.astro.build/en/guides/integrations-guide/cloudflare/|Élevée|
|Playwright webServer|[OFFICIEL]|playwright.dev/docs/test-webserver|Élevée|
|Playwright Visual Testing|[OFFICIEL]|playwright.dev/docs/test-snapshots|Élevée|
|vitest-browser-astro|[COMMUNAUTAIRE]|github.com/ascorbic/vitest-browser-astro|Moyenne|
|GitHub withastro/astro issues|[COMMUNAUTAIRE]|github.com/withastro/astro/issues|Moyenne|
|Astro 5.6 Blog (Sessions)|[OFFICIEL]|astro.build/blog/astro-560/|Élevée|
|Cloudflare Workers Node.js Compat|[OFFICIEL]|developers.cloudflare.com/workers/runtime-apis/nodejs/|Élevée|

**Versions confirmées** :

- Astro : 5.17.x (Container API experimental depuis 4.9.0)
- Vitest : 3.2.x (Vitest 4 non compatible)
- @cloudflare/vitest-pool-workers : compatible Vitest ~3.2.0
- Playwright : latest stable
- Wrangler : 3.x
- @astrojs/cloudflare adapter : 11.x+

---

## Zones DOC-GAPS identifiées

1. **Unit testing Astro Actions** : Aucun pattern officiel pour tester les Actions en isolation — seul le test via endpoint `/_actions/name` est documenté
2. **Container API + Server Islands** : Pas de documentation sur comment tester le comportement `server:defer`
3. **Sessions + Container API** : Pattern de mock `Astro.session` non documenté
4. **Cloudflare D1 migrations en test** : Workflow `applyD1Migrations` peu documenté pour Astro
5. **Content Layer custom loaders testing** : Aucun guide officiel pour mocker les loaders
6. **vitest-browser-astro** : Package communautaire, pas de mention dans docs officielles Astro