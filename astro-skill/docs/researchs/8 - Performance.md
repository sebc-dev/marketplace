# Performance Astro 5.17+ / Cloudflare : Guide exhaustif pour Claude Code Skill

Astro domine les Core Web Vitals avec un taux de réussite de **60%+** (contre 40.5% moyenne) grâce à son architecture Islands et l'absence de JavaScript par défaut. Ce guide condense les patterns actionnables spécifiques à Astro 5.17+ déployé sur Cloudflare Workers/Pages, distinguant clairement les sources officielles, communautaires et déduites.

---

## 1. Quick Reference (pour SKILL.md)

### Images

1. **Utiliser `priority` sur l'image LCP unique de chaque page** — active `loading="eager"`, `decoding="sync"`, `fetchpriority="high"` automatiquement [OFFICIAL, Astro 5.10+]
2. **Choisir `layout="constrained"` par défaut** — shrink responsive sans upscale, génère srcset/sizes automatiquement [OFFICIAL]
3. **Configurer `imageService: 'compile'` pour Cloudflare** — Sharp au build uniquement, désactivé en SSR (Sharp incompatible Workers runtime) [OFFICIAL]
4. **Précharger manuellement les images LCP distantes** — `<link rel="preload" as="image" fetchpriority="high">` avec `getImage()` [COMMUNITY]

### Core Web Vitals

5. **Utiliser `client:visible` avec `rootMargin="200px"` pour composants below-fold** — hydratation anticipée, réduit CLS [OFFICIAL]
6. **Préférer `client:idle` à `client:load` pour widgets non-critiques** — libère le main thread au chargement [OFFICIAL]
7. **Implémenter Server Islands pour contenu personnalisé above-fold** — shell statique CDN-cacheable + îlots dynamiques [OFFICIAL, Astro 5.x]

### Caching

8. **Configurer `Cache-Control: max-age=31536000, immutable` pour `/_astro/*`** — assets hashés, jamais modifiés [OFFICIAL]
9. **Utiliser `stale-while-revalidate` pour images non-hashées** — balance fraîcheur/performance [INFERRED]
10. **Ne pas compter sur `_headers` pour SSR** — headers doivent être définis dans le code pour pages on-demand [OFFICIAL]

### Prefetch

11. **Configurer `defaultStrategy: 'hover'` (défaut recommandé)** — balance UX/bande passante [OFFICIAL]
12. **Utiliser `data-astro-prefetch="tap"` pour pages SSR lourdes** — évite invocations Workers inutiles [INFERRED]
13. **Désactiver prefetch sur endpoints API/génération** — `data-astro-prefetch="false"` [INFERRED]

### Configuration Cloudflare

14. **Toujours ajouter `nodejs_compat` aux compatibility_flags** — requis pour la plupart des packages npm [OFFICIAL]
15. **Créer `public/.assetsignore` avec `_worker.js` et `_routes.json`** — évite exposition code serveur [OFFICIAL]

---

## 2. Decision Matrices

### 2a. Choix du composant image

|Situation|Composant/API|Raison|Confiance|
|---|---|---|---|
|Image standard optimisée|`<Image />`|Transformation + CLS prevention auto, srcset généré|HIGH [OFFICIAL]|
|Formats multiples (avif+webp+fallback)|`<Picture />`|Génère `<source>` par format, browser sélectionne optimal|HIGH [OFFICIAL]|
|Image en CSS background|`getImage()`|Retourne URL pour usage hors HTML|HIGH [OFFICIAL]|
|RSS feed / API route|`getImage()`|Accès programmatique aux métadonnées|HIGH [OFFICIAL]|
|Image distante dimensions inconnues|`<Image inferSize />`|Fetch auto des dimensions (attention: pas de cache!)|MEDIUM [OFFICIAL]|
|Hero image LCP|`<Image priority layout="full-width" />`|Preload + eager + fetchpriority=high|HIGH [OFFICIAL]|
|Thumbnail avec focus visage|`<Image fit="cover" position="top" />`|Crop intelligent vers le haut|HIGH [OFFICIAL]|
|Logo/icône taille fixe|`<Image layout="fixed" />`|Pas de resize, srcset densité uniquement (1x, 2x)|HIGH [OFFICIAL]|

### 2b. Choix du service image

|Situation|Service|Raison|Confiance|
|---|---|---|---|
|**Site hybride/statique sur Cloudflare**|`compile` (défaut)|Sharp au build, désactivé SSR — meilleur compromis|HIGH [OFFICIAL]|
|**SSR avec optimisation runtime (plan payant)**|`cloudflare`|Cloudflare Image Resizing, 5K transforms/mois gratuits puis $0.50/1K|HIGH [OFFICIAL]|
|**Pas d'optimisation nécessaire**|`passthrough`|CLS prevention conservé, pas de transformation|HIGH [OFFICIAL]|
|**Sharp fonctionne?** Workers runtime|❌ NON|Requires native bindings (`libvips`), `child_process` — incompatible workerd|HIGH [OFFICIAL]|
|**Dev local vs Production**|Sharp local, compile/cloudflare prod|Dev node.js ≠ Workers runtime|HIGH [OFFICIAL]|

### 2c. Choix de stratégie d'hydratation (impact INP)

|Type de composant|Directive client:|Impact CWV|Confiance|
|---|---|---|---|
|**Critique above-fold interactif**|`client:load`|INP ↓ (bloque main thread) — utiliser avec parcimonie|HIGH [OFFICIAL]|
|**Widget non-critique (search, chat)**|`client:idle`|INP ↑ (attend idle time)|HIGH [OFFICIAL]|
|**Composant below-fold**|`client:visible`|INP ↑↑ (lazy hydration) — **défaut recommandé**|HIGH [OFFICIAL]|
|**Sidebar mobile uniquement**|`client:media="(max-width: 768px)"`|INP ↑ (conditionnel device)|HIGH [OFFICIAL]|
|**Composant browser-only (maps, editors)**|`client:only="react"`|INP ↓ (pas de SSR HTML)|HIGH [OFFICIAL]|
|**Composant below-fold avec CLS risk**|`client:visible={{rootMargin: "200px"}}`|CLS ↓ (hydrate 200px avant visible)|HIGH [OFFICIAL]|
|**Widget avec timeout max**|`client:idle={{timeout: 500}}`|INP garanti <500ms|MEDIUM [OFFICIAL, 4.15+]|

### 2d. Choix de stratégie prefetch

|Type de page/lien|Stratégie|Raison|Confiance|
|---|---|---|---|
|**Navigation principale**|`hover` (défaut)|Balance réactivité/bande passante|HIGH [OFFICIAL]|
|**Pages statiques fréquemment visitées**|`viewport`|Prefetch dès visible, UX fluide|HIGH [OFFICIAL]|
|**Pages SSR lourdes**|`tap`|Évite invocations Workers inutiles|MEDIUM [INFERRED]|
|**Endpoints API / génération PDF**|`false`|Ne jamais prefetch actions serveur|HIGH [INFERRED]|
|**Site avec View Transitions (ClientRouter)**|Override `prefetchAll: false`|Par défaut true avec ClientRouter, peut surcharger|HIGH [OFFICIAL]|
|**Utilisateurs data saver / connexion lente**|Auto-fallback `tap`|Astro détecte automatiquement|HIGH [OFFICIAL]|

---

## 3. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact performance|Source|
|---|---|---|---|
|`client:load` sur tous les composants|Défaut statique, `client:visible` ou `client:idle` selon besoin|INP +25% (framework devient SSR classique)|[COMMUNITY]|
|Sharp en SSR Cloudflare (`image.service: sharpImageService()`)|`imageService: 'compile'` ou `'cloudflare'` dans adapter|Build fail ou erreur runtime|[OFFICIAL]|
|`process.env.API_KEY` en SSR|`Astro.locals.runtime.env.API_KEY`|Undefined en Workers|[OFFICIAL]|
|Images sans `priority` pour LCP|`<Image priority />` sur hero unique|LCP +200-500ms|[OFFICIAL]|
|Images distantes sans `width`/`height` ni `inferSize`|`inferSize` ou dimensions explicites|CLS layout shift|[OFFICIAL]|
|`prefetchAll: true` + `defaultStrategy: 'load'`|`prefetchAll: false`, `hover` par défaut|Bande passante ×10, quotas Workers|[INFERRED]|
|Prefetch pages SSR lourdes|`data-astro-prefetch="tap"` ou `"false"`|Invocations Workers inutiles, coût|[INFERRED]|
|`node_compat = true` (legacy wrangler.toml)|`compatibility_flags = ["nodejs_compat"]`|Conflits de flags|[OFFICIAL]|
|Import `'fs'` (sans préfixe node:)|Import `'node:fs'`|Fail en Workers même avec nodejs_compat|[OFFICIAL]|
|Import `cloudflare:workers` en dev|`Astro.locals.runtime` (fonctionne dev+prod)|Erreur module not found en dev|[OFFICIAL]|
|Pas de `.assetsignore`|Créer `public/.assetsignore` avec `_worker.js`, `_routes.json`|Security warning, _worker.js exposé|[OFFICIAL]|
|Fonts sans fallback metrics|Fontaine/Capsize pour ajuster fallback font|CLS +0.1-0.25 pendant chargement font|[COMMUNITY]|
|Images non-hashées avec `immutable`|`stale-while-revalidate=604800` pour `/images/*`|Cache stale après modification|[INFERRED]|
|KV pour sessions temps-réel|Durable Objects pour strong consistency|KV writes eventually consistent (60s)|[COMMUNITY]|

---

## 4. Caching Strategy Table (Cloudflare-specific)

|Type d'asset|Cache-Control recommandé|Où configurer|Raison|
|---|---|---|---|
|**JS/CSS hashés** (`/_astro/*`)|`public, max-age=31536000, immutable`|`public/_headers`|Hash dans filename = content-addressed|
|**Pages HTML**|`public, max-age=0, must-revalidate`|`public/_headers`|Peut changer à chaque deploy|
|**Images hashées** (`/_astro/*.webp`)|`public, max-age=31536000, immutable`|`public/_headers`|Même logique que JS/CSS|
|**Images non-hashées** (`/images/*`)|`public, max-age=86400, stale-while-revalidate=604800`|`public/_headers`|Balance fraîcheur (1j) + fallback (7j)|
|**Fonts** (`/fonts/*`)|`public, max-age=31536000, immutable`|`public/_headers`|Rarement modifiés|
|**API SSR responses**|`private, max-age=X` ou `no-store`|Code (headers dans Response)|`_headers` ignoré pour SSR|
|**Server Islands**|Via Cache API ou `fetch()` cf options|Code (`caches.default.put()`)|Contrôle fin invalidation|

### Fichier `_headers` optimal

```
# public/_headers

# Assets Astro hashés - cache agressif
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# Pages HTML - toujours revalider
/*.html
  Cache-Control: public, max-age=0, must-revalidate

/
  Cache-Control: public, max-age=0, must-revalidate

# Fonts - cache long
/fonts/*
  Cache-Control: public, max-age=31536000, immutable

# Images non-hashées - cache modéré avec fallback
/images/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

# Security headers globaux
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

**[OFFICIAL] Limites:** Max 100 règles, 2000 caractères/ligne. `_headers` ne s'applique PAS aux réponses SSR.

---

## 5. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|`/_image` retourne 404 sur Workers|Config `imageService` incorrecte ou routing assets|Utiliser `imageService: 'compile'`, vérifier `.assetsignore`|[OFFICIAL] GitHub #13825|
|Warning Sharp incompatible Cloudflare|Informatif — Sharp au build, pas runtime|Normal avec `compile`, ignorer ou utiliser `cloudflare`|[OFFICIAL] GitHub #191|
|`[object Object]` au lieu de HTML|Conflit `enable_nodejs_process_v2` flag|Wrangler ≥4.42.0 ou ajouter `disable_nodejs_process_v2`|[OFFICIAL] GitHub #14511|
|`MessageChannel is not defined` (React)|APIs Node.js manquantes en Workers|Ajouter `nodejs_compat` flag, `compatibility_date` récent|[COMMUNITY]|
|`Cannot find module 'cloudflare:workers'` en dev|Module Workers-only, pas Node.js|Utiliser `Astro.locals.runtime` (fonctionne partout)|[OFFICIAL]|
|`No such module "node:path"`|Flag compat manquant|`compatibility_flags = ["nodejs_compat"]` dans wrangler.jsonc|[OFFICIAL]|
|Build échoue avec erreur `base` path|Conflit placement fichiers adapter|Éviter base path ou placement manuel `_headers`/`_routes.json`|[OFFICIAL] GitHub #13162|
|Images OK en dev, pas en prod|Sharp fonctionne en Node.js dev, pas Workers|Comportement attendu avec `compile` — vérifier prerendering|[OFFICIAL]|
|Cache `_headers` ignoré pour SSR|`_headers` = assets statiques uniquement|Définir headers dans code Response pour SSR|[OFFICIAL]|
|`inferSize` dimensions incorrectes|Bug JPEG metadata (rare)|Spécifier dimensions explicitement|[OFFICIAL] GitHub #12530|
|KV writes lents globalement|KV writes go to origin|Design pour eventual consistency ou Durable Objects|[COMMUNITY]|
|Bundle > 3MB (free tier)|Trop de dépendances ou assets|`wrangler deploy --dry-run` pour check, split avec `manualChunks`|[OFFICIAL]|

---

## 6. Code Patterns

### Pattern 1: Configuration image service optimale Cloudflare

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'hybrid', // Statique par défaut, SSR explicite
  adapter: cloudflare({
    // Sharp au build pour pages prerendered, désactivé en SSR
    imageService: 'compile',
    // Émulation bindings en dev
    platformProxy: { enabled: true },
  }),
  image: {
    // Responsive images (stable depuis 5.10)
    layout: 'constrained',
    // Styles CSS auto pour responsive
    responsiveStyles: true,
  },
});
```

### Pattern 2: Image LCP optimisée avec priority + layout

```astro
---
// Hero component - page d'accueil
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---

<!-- Image LCP unique de la page -->
<Image 
  src={heroImage}
  alt="Description accessible"
  priority
  layout="full-width"
  fit="cover"
  position="center"
/>

<!-- Alternative pour image distante avec preload manuel -->
---
import { getImage } from 'astro:assets';
const hero = await getImage({ 
  src: 'https://cdn.example.com/hero.jpg',
  width: 1200,
  height: 630,
  format: 'webp'
});
---

<head>
  <link rel="preload" as="image" href={hero.src} fetchpriority="high" />
</head>
<img src={hero.src} {...hero.attributes} alt="Hero" loading="eager" />
```

### Pattern 3: Fichier `_headers` optimisé Astro

```
# public/_headers

# Astro hashed assets - never change
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# HTML - always revalidate on deploy
/*.html
  Cache-Control: public, max-age=0, must-revalidate

/
  Cache-Control: public, max-age=0, must-revalidate

# Static images - 1 day + 7 day stale fallback
/images/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

# Fonts - immutable (version in filename)
/fonts/*
  Cache-Control: public, max-age=31536000, immutable

# Security headers (all routes)
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
```

### Pattern 4: Dynamic import conditionnel pour Islands lourds

```astro
---
// Composant parent
const isChartNeeded = Astro.url.searchParams.has('stats');
---

{isChartNeeded && (
  <!-- Hydrate seulement quand visible + chargement différé -->
  <HeavyChart client:visible data={chartData} />
)}

<!-- OU import dynamique dans script -->
<div id="chart-container"></div>
<script>
  // Import dynamique crée chunk séparé
  const container = document.getElementById('chart-container');
  if (container && container.dataset.showChart) {
    const { Chart } = await import('./HeavyChart.js');
    new Chart(container, JSON.parse(container.dataset.config));
  }
</script>
```

### Pattern 5: Configuration prefetch optimale

```javascript
// astro.config.mjs
export default defineConfig({
  prefetch: {
    prefetchAll: false, // Explicite, pas tout par défaut
    defaultStrategy: 'hover', // Balance UX/bande passante
  },
});
```

```astro
<!-- Navigation principale - hover (défaut) -->
<a href="/about" data-astro-prefetch>À propos</a>

<!-- Pages statiques fréquentes - viewport -->
<a href="/products" data-astro-prefetch="viewport">Produits</a>

<!-- Page SSR lourde - tap seulement -->
<a href="/dashboard" data-astro-prefetch="tap">Dashboard</a>

<!-- Action serveur - jamais prefetch -->
<a href="/api/generate-report" data-astro-prefetch="false">Générer rapport</a>
```

### Pattern 6: Configuration wrangler.jsonc complète

```jsonc
// wrangler.jsonc
{
  "name": "my-astro-site",
  "main": "dist/_worker.js/index.js",
  "compatibility_date": "2025-01-15",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  },
  "observability": {
    "enabled": true
  },
  // Sessions avec KV (optionnel)
  "kv_namespaces": [
    { "binding": "SESSION", "id": "<KV_ID>" }
  ]
}
```

```
# public/.assetsignore (OBLIGATOIRE)
_worker.js
_routes.json
```

---

## 7. References pour /references/

### references/images-advanced.md

- Configuration détaillée `image.breakpoints` pour srcset custom
- `inferRemoteSize()` function API complète
- Patterns Content Collections avec images
- CVE-2025-55303 remote patterns bypass (fixed 5.13.2+)

### references/caching-advanced.md

- Cache API Workers patterns pour SSR (`caches.default.put/match`)
- Différence Cache API vs `fetch()` cf options (tiered cache)
- Invalidation API Cloudflare (`/purge_cache` endpoint)
- Cache-Tag patterns (Enterprise)

### references/cwv-benchmarks.md

- HTTP Archive data 2023: Astro 60%+ CWV pass rate
- INP pass rate: Astro 68.8% vs industrie 60.9%
- Comparatif frameworks: SvelteKit ~50%, Next.js ~25%, Nuxt ~20%
- **[DOC-GAP]** Pas de benchmarks officiels par directive client:

### references/bundle-analysis.md

- Configuration `rollup-plugin-visualizer` détaillée
- Intégration Sonda pour analyse bundle Astro
- Stratégies `manualChunks` pour vendor splitting
- Limites Workers: 3MB free, 10MB paid (compressé)

### references/cloudflare-runtime.md

- Node.js APIs supportées/non-supportées détail
- WebAssembly alternatives (`@cf-wasm/photon`)
- Limites mémoire (128MB), CPU (50ms free, illimité paid)
- Astro 6 beta: workerd-in-dev mode

### Grep hints

```bash
# Trouver images sans priority (LCP potentiel)
grep -r "<Image" --include="*.astro" | grep -v "priority"

# Trouver client:load (à auditer)
grep -r "client:load" --include="*.astro"

# Vérifier assets non-hashés
find dist -name "*.js" -o -name "*.css" | grep -v "_astro"
```

---

## 8. Sources consultées

### Documentation officielle [HIGH CONFIDENCE]

|Source|Version vérifiée|Date|
|---|---|---|
|https://docs.astro.build/en/guides/images/|Astro 5.17+|Feb 2026|
|https://docs.astro.build/en/reference/modules/astro-assets/|Astro 5.10+|Feb 2026|
|https://docs.astro.build/en/guides/integrations-guide/cloudflare/|@astrojs/cloudflare 12.x|Feb 2026|
|https://docs.astro.build/en/guides/prefetch/|Astro 5.x|Feb 2026|
|https://docs.astro.build/en/reference/directives-reference/|Astro 5.x|Feb 2026|
|https://developers.cloudflare.com/workers/platform/limits/|Current|Feb 2026|
|https://developers.cloudflare.com/pages/configuration/headers/|Current|Feb 2026|
|https://developers.cloudflare.com/workers/runtime-apis/cache/|Current|Feb 2026|
|https://developers.cloudflare.com/images/transform-images/|Current|Feb 2026|

### Blog officiel Astro [HIGH CONFIDENCE]

|Source|Contenu|
|---|---|
|https://astro.build/blog/astro-5100/|Responsive images stable, priority attribute|
|https://astro.build/blog/2023-web-framework-performance-report/|CWV benchmarks officiels|

### GitHub Issues [MEDIUM-HIGH CONFIDENCE]

|Issue|Sujet|Status|
|---|---|---|
|withastro/astro#13825|`/_image` 404 on Workers|Open (P2)|
|withastro/adapters#191|Sharp warning cosmetic|Closed|
|withastro/astro#14511|`[object Object]` response|Resolved|
|withastro/astro#13523|`cloudflare:workers` import|Closed|
|withastro/astro#5302|No native priority prop|Resolved (5.10)|

### Sources communautaires [MEDIUM CONFIDENCE]

|Source|Contenu|Validé par|
|---|---|---|
|https://dev.to/dagnelies/cloudflare-workers-performance|Latency benchmarks KV/Workers|Independent testing|
|https://alexnguyen.co.nz/blog/preloading-images-with-astro/|Manual preload pattern|Working code|
|https://eatmon.co/blog/using-fontaine-with-astro|Font CLS mitigation|Tested integration|

---

## DOC-GAPS identifiés

|Gap|Domaine|Workaround documenté|
|---|---|---|
|Pas de documentation CWV dédiée dans Astro docs|CWV|Utiliser web.dev + patterns communautaires|
|`compile` service mal documenté|Images/Cloudflare|Expliqué dans ce guide|
|Benchmarks INP par directive absents|Hydration|[NO-BENCHMARK] — tester avec Lighthouse|
|Patterns Cache API pour Server Islands absents|Caching|Code patterns dans ce guide|
|Aspect-ratio best practices Astro absents|CLS|Utiliser width/height ou CSS aspect-ratio|

---

**Version:** Astro 5.17+ / @astrojs/cloudflare 12.x  
**Dernière vérification:** Février 2026  
**Compatibilité:** Cloudflare Workers & Pages