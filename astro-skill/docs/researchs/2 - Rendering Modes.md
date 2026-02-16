# Astro 5.17+ Rendering Modes sur Cloudflare : Guide Actionable

L'architecture de rendu d'Astro 5.x a fusionné le mode `hybrid` dans `static`, simplifiant drastiquement la configuration. **Le choix du mode par défaut dépend du ratio pages statiques/dynamiques** : `output: 'static'` avec opt-out SSR pour les sites majoritairement statiques, `output: 'server'` avec opt-in prerender pour les applications dynamiques. Les Server Islands (`server:defer`) permettent d'injecter du contenu personnalisé dans des pages statiques CDN-cached sans sacrifier le TTFB.

Ce guide condense les patterns validés pour implémenter correctement ces modes sur Cloudflare Workers, où le runtime `workerd` impose des contraintes spécifiques : **128 MB de mémoire**, CPU time limité (10ms free / 30s paid), et APIs Node.js partiellement émulées via `nodejs_compat`.

---

## 1. Quick Reference — Modes de rendu (pour SKILL.md)

**Configuration de base** [OFFICIEL]

1. **Utiliser `output: 'static'`** (défaut) pour sites majoritairement statiques — les pages dynamiques s'ajoutent via `export const prerender = false` par page, évitant le cold start Workers sur le contenu statique
2. **Utiliser `output: 'server'`** pour applications majoritairement dynamiques — les pages statiques s'ajoutent via `export const prerender = true`, garantissant le SSR par défaut
3. **Ne jamais utiliser `output: 'hybrid'`** — supprimé en Astro 5.0, remplacé par le comportement fusionné dans `static`

**Prerendering** [OFFICIEL] 4. **Exporter `prerender` uniquement avec valeurs statiques `true` ou `false`** — les valeurs dynamiques (`import.meta.env.VAR`) causent `InvalidPrerenderExport` en Astro 5.x 5. **Utiliser le hook `astro:route:setup`** pour contrôler le prerendering programmatiquement selon l'environnement ou le pattern de route 6. **Implémenter `getStaticPaths()`** pour toute route dynamique `[param].astro` en mode prerender — requis pour générer les chemins au build

**Server Islands** [OFFICIEL] 7. **Ajouter `server:defer`** aux composants Astro nécessitant données utilisateur/session sur pages statiques — le shell statique se charge immédiatement depuis le CDN 8. **Toujours fournir un `slot="fallback"`** avec dimensions fixes — évite le CLS (Cumulative Layout Shift) pendant le chargement du Server Island 9. **Limiter les props des Server Islands aux types sérialisables** — fonctions et références circulaires interdites ; props > 2048 bytes déclenchent POST (non cachable)

**Cloudflare-spécifique** [OFFICIEL + COMMUNAUTAIRE] 10. **Activer `nodejs_compat`** dans `wrangler.toml` avec `compatibility_date` récente — requis pour les imports `node:*` utilisés par certaines dépendances 11. **Désactiver Auto Minify** dans les paramètres Cloudflare si Server Islands utilisées — la minification supprime les commentaires `<!--server-island-start-->` cassant le rendu 12. **Accéder aux variables d'environnement via `Astro.locals.runtime.env`** — `process.env` ne fonctionne pas sur Workers 13. **Créer une page SSR factice** si utilisant uniquement Server Islands avec `output: 'static'` — contourne le bug #12744 où Astro ne détecte pas le mode hybride 14. **Ne pas prerendre la page 404** avec `output: 'server'` — cause l'erreur Cloudflare 1042/522 sur routes inexistantes

**Performance** [COMMUNAUTAIRE] 15. **Minimiser les appels KV** par requête — les lectures cold ajoutent **100-300ms** de latence, les écritures communiquent avec l'origine (non edge)

---

## 2. Decision Matrix — Choix du mode de rendu

|Situation projet|Mode recommandé|Configuration `astro.config.mjs`|Raison|Confiance|
|---|---|---|---|---|
|**Site vitrine pur** (pages fixes, pas d'interaction serveur)|SSG pur|`output: 'static'` (défaut, pas d'adapter)|Déploiement Cloudflare Pages statique, TTFB optimal ~30ms mondial|Élevé [OFFICIEL]|
|**Blog/docs avec commentaires**|Static + Server Islands|`output: 'static'` + adapter + `server:defer` sur composant commentaires|Shell statique CDN-cached, commentaires chargés après|Élevé [OFFICIEL]|
|**Site avec espace client/dashboard**|Server + prerender sélectif|`output: 'server'` + `prerender: true` sur pages marketing|Dashboard SSR sécurisé, pages publiques statiques|Élevé [OFFICIEL]|
|**E-commerce léger** (<1000 produits)|Static + opt-out SSR|`output: 'static'` + `prerender: false` sur panier/checkout|Fiches produits statiques (SEO), panier dynamique|Élevé [INFÉRÉ]|
|**E-commerce avec stock temps réel**|Server + prerender catégories|`output: 'server'` + `prerender: true` sur pages catégories|Stock affiché au rendu, catégories cachées|Moyen [INFÉRÉ]|
|**Dashboard SaaS**|Server pur|`output: 'server'` sans prerender|Tout le contenu dépend de l'utilisateur authentifié|Élevé [OFFICIEL]|
|**Site avec personnalisation partielle** (prix géolocalisés)|Static + Server Islands|`output: 'static'` + `server:defer` sur prix|95% du contenu statique, prix via `cf-ipcountry` header|Élevé [COMMUNAUTAIRE]|
|**Landing pages A/B testées**|Server Islands|`output: 'static'` + Server Island pour variantes|Shell commun CDN, variante injectée dynamiquement|Moyen [INFÉRÉ]|
|**API-first avec peu de pages**|Server|`output: 'server'`|Endpoints dominent, peu de contenu statique à optimiser|Élevé [OFFICIEL]|

---

## 3. Decision Matrix — Server Islands vs alternatives

|Besoin dynamique|Approche recommandée|Pourquoi pas les alternatives|Confiance|
|---|---|---|---|
|**Afficher avatar/nom utilisateur** sur header statique|Server Island (`server:defer`)|Client hydration : JS bundle + flash ; SSR complet : perd le cache CDN sur toute la page|Élevé [OFFICIEL]|
|**Compteur de panier** sur navigation|Server Island avec fallback "🛒 ..."|Partial : requiert HTMX ; Client : flash de contenu ; API JSON : double requête|Élevé [OFFICIEL]|
|**Formulaire de contact** soumission|Astro Action + `partial: true`|Server Island : overhead si pas de personnalisation ; SSR complet : inutile pour formulaire isolé|Moyen [INFÉRÉ]|
|**Recherche live** avec suggestions|Client-side (Alpine.js/HTMX)|Server Island : latence sur chaque frappe ; SSR : inapproprié pour interaction continue|Élevé [COMMUNAUTAIRE]|
|**Liste de produits filtrée**|SSR avec cache CDN|Server Island : plusieurs îlots = plusieurs requêtes ; Client : SEO compromis|Moyen [INFÉRÉ]|
|**Notifications temps réel**|Client-side WebSocket/SSE|Server Islands : polling inefficace ; SSR : pas de push|Élevé [INFÉRÉ]|
|**Commentaires avec pagination**|Server Island OU `partial: true` + HTMX|SSR complet : cache CDN perdu ; Client : SEO commentaires perdu|Moyen [COMMUNAUTAIRE]|
|**Contenu derrière auth** (extrait premium)|Server Island|SSR : expose toute la page dynamique ; Partial : architecture plus complexe|Élevé [OFFICIEL]|
|**Widget météo**|Server Island avec cache `max-age=3600`|Client fetch : requête API exposée ; SSR : pas de granularité cache|Moyen [INFÉRÉ]|
|**HTMX infinite scroll**|`export const partial = true`|Server Island : conçu pour injection unique ; SSR : overhead|Élevé [COMMUNAUTAIRE]|

---

## 4. Anti-patterns Table — Modes de rendu

|❌ Ne pas faire|✅ Alternative Astro 5.17+/Cloudflare|Impact si ignoré|Source|
|---|---|---|---|
|`output: 'hybrid'` dans config|Supprimer la ligne ou utiliser `'static'` / `'server'`|Erreur de configuration au build|[OFFICIEL] docs.astro.build/upgrade-to/v5|
|`export const prerender = import.meta.env.VAR`|Hook `astro:route:setup` avec `loadEnv()`|`InvalidPrerenderExport` error|[OFFICIEL] docs.astro.build/upgrade-to/v5|
|Utiliser `process.env.VAR` dans composants|`Astro.locals.runtime.env.VAR`|`undefined` en production Cloudflare|[OFFICIEL] docs.astro.build/cloudflare|
|`getStaticPaths()` sur page avec `prerender: false`|Supprimer `getStaticPaths`, utiliser `Astro.params` directement|Warning ignoré, confusion logique|[OFFICIEL] docs.astro.build/routing|
|Server Island avec dépendance `fs`/`child_process`|Vérifier compatibilité `nodejs_compat`, utiliser alternatives|Runtime error sur Workers|[OFFICIEL] developers.cloudflare.com/workers|
|Server Island sans `slot="fallback"`|Ajouter fallback avec dimensions identiques au contenu final|CLS élevé, UX dégradée|[OFFICIEL] docs.astro.build/server-islands|
|Props fonction/classe vers Server Island|Passer ID + fetch côté island, ou sérialiser en JSON|Props silencieusement ignorées|[OFFICIEL] docs.astro.build/server-islands|
|`prerender: true` sur `404.astro` avec `output: 'server'`|`prerender: false` ou supprimer l'export|Erreur Cloudflare 1042/522 sur 404|[COMMUNAUTAIRE] GitHub #13932|
|Auto Minify Cloudflare activé + Server Islands|Désactiver Auto Minify dans dashboard Cloudflare|Boucle infinie, islands ne chargent pas|[COMMUNAUTAIRE] GitHub #11638|
|KV write haute fréquence (compteurs)|Durable Objects ou agrégation batch|Max 1 write/sec par clé, propagation 60s|[OFFICIEL] developers.cloudflare.com|
|`getStaticPaths()` appelant API externe indisponible au build|Utiliser `prerender: false` ou mock les données build-time|Build failure|[INFÉRÉ]|
|Générer >20,000 pages statiques|Pagination, génération à la demande, ou chunks de build|Limite Cloudflare Pages dépassée|[OFFICIEL] developers.cloudflare.com/pages/limits|
|Supposer `astro dev` = comportement prod|Tester avec `wrangler pages dev ./dist` avant déploiement|Bugs runtime-only découverts en prod|[OFFICIEL] docs.astro.build/cloudflare|

---

## 5. Troubleshooting Table

|Symptôme / Message d'erreur|Cause probable|Fix|Vérification|Source|
|---|---|---|---|---|
|`getStaticPaths() function is required`|Route dynamique `[param].astro` sans `getStaticPaths` en mode static|Ajouter `getStaticPaths()` OU `export const prerender = false`|Vérifier que la page a l'un des deux|[OFFICIEL]|
|`InvalidPrerenderExport`|Valeur dynamique pour `export const prerender`|Utiliser valeur statique `true`/`false` ou hook `astro:route:setup`|Grep `prerender =` dans le fichier|[OFFICIEL]|
|`Could not resolve "node:*"` ou `"fs"`|Import Node.js sans `nodejs_compat`|Ajouter `"nodejs_compat"` dans `compatibility_flags` de wrangler.toml|`wrangler deploy --dry-run`|[OFFICIEL]|
|Server Islands timeout / ne chargent pas|Auto Minify supprime markers HTML|Désactiver Auto Minify dans Cloudflare dashboard|Network tab : vérifier requête `/_server-islands/*`|[COMMUNAUTAIRE]|
|404 sur routes dynamiques SSR après déploiement|`_routes.json` mal généré ou route non incluse|Vérifier `dist/_routes.json`, ajouter pattern dans `routes.extend.include`|`cat dist/_routes.json`|[INFÉRÉ]|
|Erreur 1042 / 522 Cloudflare sur 404|Page 404 prerendered avec `output: 'server'`|Retirer `prerender: true` de 404.astro|Tester `/route-inexistante`|[COMMUNAUTAIRE]|
|HTML non-streamé malgré SSR|Adapter ou config désactive streaming|Vérifier options adapter ; Cloudflare streame par défaut|Response headers : `Transfer-Encoding: chunked`|[OFFICIEL]|
|`Astro.session` undefined|Page prerendered ou KV binding manquant|`prerender: false` + KV namespace configuré dans wrangler.toml|Vérifier binding `SESSION`|[OFFICIEL]|
|Cache stale après redéploiement|Cache CDN ou browser cache|Purger cache Cloudflare + vérifier headers `Cache-Control`|Dashboard Cloudflare > Caching > Purge|[INFÉRÉ]|
|`Astro.url` retourne `/_server-islands/Component`|Comportement normal dans Server Island|Utiliser `Astro.request.headers.get('Referer')` pour URL page parente|N/A|[OFFICIEL]|
|Cold start >500ms sur première requête|Script Worker volumineux ou dépendances lourdes|Réduire bundle size, lazy-load dépendances non critiques|Wrangler logs, mesurer TTFB|[COMMUNAUTAIRE]|
|`hydration mismatch` console errors|Auto Minify modifie le HTML|Désactiver Auto Minify|Console browser|[OFFICIEL]|
|Server Islands non détectées (adapter skip)|`output: 'static'` avec seulement des Server Islands|Créer page factice avec `prerender: false`|Vérifier génération `_worker.js`|[COMMUNAUTAIRE] GitHub #12744|

---

## 6. Code Patterns

### Configuration `astro.config.mjs` — Mode Static avec opt-out SSR

```javascript
// Pour sites majoritairement statiques avec quelques pages dynamiques
// [OFFICIEL] Astro 5.0+ — adapté Cloudflare
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // 'static' est le défaut — explicite pour clarté
  output: 'static',
  adapter: cloudflare({
    platformProxy: { enabled: true }, // Émule Workers en dev
    imageService: 'compile', // Sharp au build, désactivé SSR
  }),
});
```

### Configuration `astro.config.mjs` — Mode Server avec opt-in prerender

```javascript
// Pour applications dynamiques avec pages statiques sélectives
// [OFFICIEL] Astro 5.0+ — adapté Cloudflare
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server', // SSR par défaut
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'cloudflare', // Utilise Cloudflare Image Resizing
    routes: {
      extend: {
        exclude: [{ pattern: '/api/*' }], // Force SSR même si prerender détecté
      },
    },
  }),
});
```

### Configuration `wrangler.toml` complète

```toml
# [OFFICIEL] Configuration minimale production-ready
name = "mon-site-astro"
compatibility_date = "2025-01-15"
compatibility_flags = ["nodejs_compat"]

# Assets statiques
[assets]
directory = "./dist"
binding = "ASSETS"

# Sessions (si utilisées)
[[kv_namespaces]]
binding = "SESSION"
id = "<ID_DEPUIS_wrangler_kv_namespace_create>"

# Variables d'environnement (non-secrets)
[vars]
PUBLIC_API_URL = "https://api.example.com"
```

### Pattern `getStaticPaths()` + `paginate()` canonique

```astro
---
// src/pages/blog/[...page].astro
// [OFFICIEL] Pattern pagination compatible Cloudflare Pages limits
import { getCollection } from 'astro:content';

export async function getStaticPaths({ paginate }) {
  const posts = await getCollection('blog');
  // Tri par date décroissante
  const sorted = posts.sort((a, b) => 
    b.data.date.valueOf() - a.data.date.valueOf()
  );
  // pageSize: 20 = 50 pages max pour 1000 posts (sous limite 20k fichiers)
  return paginate(sorted, { pageSize: 20 });
}

const { page } = Astro.props;
---
<ul>
  {page.data.map(post => <li>{post.data.title}</li>)}
</ul>
<nav>
  {page.url.prev && <a href={page.url.prev}>← Précédent</a>}
  <span>Page {page.currentPage} / {page.lastPage}</span>
  {page.url.next && <a href={page.url.next}>Suivant →</a>}
</nav>
```

### Server Island avec `server:defer` + fallback optimal

```astro
---
// src/pages/produit/[id].astro (page statique)
// [OFFICIEL] Pattern Server Island avec fallback anti-CLS
import ProductPrice from '../components/ProductPrice.astro';
import { getEntry } from 'astro:content';

export async function getStaticPaths() { /* ... */ }
const product = await getEntry('products', Astro.params.id);
---
<h1>{product.data.name}</h1>
<p>{product.data.description}</p>

<!-- Server Island pour prix personnalisé/géolocalisé -->
<ProductPrice server:defer productId={product.id}>
  <!-- Fallback avec mêmes dimensions que le rendu final -->
  <div slot="fallback" class="price-skeleton" style="height: 48px; width: 120px;">
    <span class="animate-pulse bg-gray-200 rounded">Chargement...</span>
  </div>
</ProductPrice>
```

```astro
---
// src/components/ProductPrice.astro (Server Island)
// [OFFICIEL] Composant Server Island avec cache
interface Props { productId: string; }
const { productId } = Astro.props;

// Accès headers Cloudflare pour géolocalisation
const country = Astro.request.headers.get('cf-ipcountry') || 'FR';
const price = await getPriceForCountry(productId, country);

// Cache 1h pour ce prix régional
Astro.response.headers.set('Cache-Control', 'public, max-age=3600');
---
<div class="price" style="height: 48px; width: 120px;">
  <span class="text-2xl font-bold">{price.formatted}</span>
</div>
```

### Route hybride avec toggle `prerender`

```astro
---
// src/pages/compte/profil.astro
// [OFFICIEL] Opt-out SSR sur page spécifique en mode static
export const prerender = false; // Cette page = SSR

// Session disponible car SSR
const user = await Astro.session?.get('user');
if (!user) return Astro.redirect('/login');
---
<h1>Bonjour {user.name}</h1>
```

```astro
---
// src/pages/a-propos.astro (en mode output: 'server')
// [OFFICIEL] Opt-in prerender sur page spécifique
export const prerender = true; // Cette page = statique

// Pas d'accès session/cookies ici — build time uniquement
---
<h1>À propos de nous</h1>
```

### Pattern Partial response (`partial = true`) + HTMX

```astro
---
// src/pages/partials/cart-count.astro
// [OFFICIEL] Fragment HTML pour HTMX/fetch
export const partial = true;
export const prerender = false; // SSR requis pour session

const cart = await Astro.session?.get('cart') || [];
---
<!-- Pas de DOCTYPE/html/head — fragment pur -->
<span id="cart-count" class="badge">{cart.length}</span>
```

```astro
---
// src/pages/index.astro — consommation du partial
---
<button 
  hx-get="/partials/cart-count" 
  hx-trigger="click" 
  hx-swap="innerHTML"
  hx-target="#cart-badge"
>
  Rafraîchir panier
</button>
<span id="cart-badge">0</span>
```

### Hook `astro:route:setup` pour prerendering programmatique

```javascript
// astro.config.mjs
// [OFFICIEL] Contrôle prerender par environnement/pattern
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [{
    name: 'dynamic-prerender',
    hooks: {
      'astro:route:setup': ({ route }) => {
        const env = loadEnv(process.env.NODE_ENV, process.cwd(), '');
        
        // Toutes les pages /blog/* prerendered en prod
        if (route.pattern.startsWith('/blog/') && env.NODE_ENV === 'production') {
          route.prerender = true;
        }
        
        // API jamais prerendered
        if (route.pattern.startsWith('/api/')) {
          route.prerender = false;
        }
      },
    },
  }],
});
```

### Cache headers pattern pour SSR Cloudflare

```astro
---
// src/pages/produits/[category].astro
// [INFÉRÉ] Pattern cache SSR avec stale-while-revalidate
export const prerender = false;

const { category } = Astro.params;
const products = await fetchProducts(category);

// Cache CDN 5min, stale acceptable 1h pendant revalidation
Astro.response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
// Cache CDN Cloudflare spécifique (prioritaire sur Cache-Control)
Astro.response.headers.set('CDN-Cache-Control', 'max-age=86400');
---
<h1>Produits : {category}</h1>
```

---

## 7. Matrice de compatibilité Features × Modes de rendu

|Feature|SSG (`output: 'static'`)|SSR (`output: 'server'`)|Server Islands|Partials|Notes Cloudflare|
|---|---|---|---|---|---|
|**Sessions** (`Astro.session`)|❌ Non|✅ Oui|✅ Oui|✅ Si `prerender: false`|KV binding requis ; propagation 60s|
|**Actions** (`astro:actions`)|✅ Endpoints uniquement|✅ Full support|✅ Appelables|✅ Appelables|—|
|**Content Layer**|✅ Build-time|✅ Build + runtime|✅ Oui|✅ Oui|`getCollection` serveur-only Astro 5|
|**View Transitions**|✅ Oui|✅ Oui|✅ Oui|⚠️ Manuel|—|
|**i18n routing**|✅ Oui|✅ Oui|✅ Oui|✅ Oui|—|
|**Middleware**|✅ Oui|✅ Oui|✅ Oui|✅ Oui|`context.isPrerendered` disponible|
|**`Astro.cookies`**|❌ Build-time|✅ Oui|✅ Oui|✅ Si SSR|—|
|**`Astro.request`**|⚠️ Limité|✅ Full|✅ Full|✅ Si SSR|Headers CF (`cf-ipcountry`, etc.)|
|**Image optimization**|✅ `sharp` build|⚠️ `compile` mode|⚠️ `compile` mode|⚠️ Selon page|`imageService: 'cloudflare'` pour SSR|
|**Redirects dynamiques**|❌ Meta refresh|✅ Status codes|✅ Oui|✅ Oui|—|
|**HTML Streaming**|❌ N/A|✅ Par défaut|✅ Oui|N/A|Activé automatiquement Workers|
|**Cache CDN**|✅ Automatique|⚠️ Headers manuels|✅ Cacheable GET|⚠️ Manuel|`_headers` ne s'applique pas aux Functions|
|**Dev/Prod parity**|✅ Bonne|⚠️ Tester wrangler|⚠️ Tester wrangler|⚠️ Tester wrangler|`platformProxy` améliore parité|

---

## 8. Références pour `references/`

### Migration `output: 'hybrid'` → nouveau modèle

**Changement clé** : Astro 5.0 a fusionné `hybrid` et `static`. Le nouveau `static` fonctionne exactement comme l'ancien `hybrid` — pages statiques par défaut avec opt-out SSR possible.

**Migration** :

```diff
// astro.config.mjs
export default defineConfig({
-  output: 'hybrid',
+  // Supprimer la ligne — 'static' est le défaut
   adapter: cloudflare(),
});
```

Aucun changement requis dans les composants : `export const prerender = false` continue de fonctionner identiquement. [OFFICIEL]

**grep hints** : `output.*hybrid`, `output: 'hybrid'`, `output: "hybrid"`

---

### Limites Workers runtime pertinentes pour le rendu

|Limite|Free|Paid|Impact rendu|
|---|---|---|---|
|**CPU time/requête**|10ms|30s (jusqu'à 5min)|SSR complexe peut timeout sur free|
|**Mémoire/isolate**|128 MB|128 MB|Limite data manipulation|
|**Taille script**|1 MB|10 MB|Bundle Astro + deps doit tenir|
|**Subrequests/requête**|50|1,000|Limite fetch() dans SSR|
|**Startup CPU**|400ms|400ms|Cold start incompressible|
|**Fichiers/déploiement Pages**|20,000|20,000|Limite pages statiques générées|
|**Taille fichier max**|25 MiB|25 MiB|Assets volumineux → R2|

**grep hints** : `CPU time`, `memory limit`, `subrequest`, `script size`

---

### Configuration avancée cache Cloudflare pour architectures hybrides

**Pattern ISR-like avec KV** [COMMUNAUTAIRE — launchfa.st] :

- Middleware vérifie cache KV avant rendu
- Si cache valide → retourne HTML stocké
- Si cache stale → retourne stale + `waitUntil()` pour régénération background
- Endpoint `/api/revalidate` pour purge on-demand

**Headers recommandés par type** [INFÉRÉ] :

|Type route|`Cache-Control`|`CDN-Cache-Control`|
|---|---|---|
|Page statique|Automatique (Astro)|—|
|SSR publique|`public, max-age=60, s-maxage=3600`|`max-age=86400`|
|SSR privée (auth)|`private, no-store`|—|
|Server Island|`public, max-age=300` (si GET)|—|
|API endpoint|`no-store` ou selon data|—|

**Note** : `_headers` file ne s'applique PAS aux Pages Functions — headers doivent être set dans le code. [OFFICIEL]

**grep hints** : `Cache-Control`, `CDN-Cache-Control`, `stale-while-revalidate`, `waitUntil`

---

### Benchmarks latence Cloudflare Workers (données sourced)

**Source** : dev.to/dagnelies — janvier 2025 — méthodologie : openstatus.dev multi-région

|Opération|Europe|US|Asie-Pacifique|
|---|---|---|---|
|Assets statiques|30-54ms|26-50ms|28-436ms|
|Function stateless|32-97ms|22-108ms|25-540ms|
|KV read (hot)|34-168ms|25-122ms|64-856ms|
|KV read (cold)|105-145ms|197-300ms|288-964ms|
|KV write|128-240ms|212-438ms|409-2266ms|

**Insight clé** : Les writes KV vont à l'origine (pas edge) — latence proportionnelle à distance. Minimiser writes critiques pour UX.

**grep hints** : `TTFB`, `cold start`, `KV latency`, `benchmark`

---

### [DOC-GAPS] identifiés

1. **Build incrémental** : Aucune documentation officielle Astro sur le build incrémental. Astro 5.17+ ne supporte pas nativement l'ISR — nécessite implémentation custom avec KV/cache. [NON DOCUMENTÉ]
    
2. **Partials + cache** : Comportement cache des partials non documenté. `export const partial = true` génère des fichiers `.html` en static, comportement cache en SSR non spécifié. [DOC-GAP]
    
3. **Server Islands + rate limiting** : Pas de documentation sur la protection des endpoints `/_server-islands/*` contre l'abus. Recommandation : rate limiting via Cloudflare WAF rules. [INFÉRÉ]
    
4. **Multi-région KV sessions** : Propagation 60s documentée mais stratégies de gestion des sessions cross-région non détaillées pour Astro. [DOC-GAP]
    
5. **Streaming + middleware** : Interaction entre HTML streaming et transformations middleware non documentée explicitement. [DOC-GAP]
    

---

## 9. Sources consultées

### Documentation officielle — Confiance Élevée

|URL|Contenu|Version confirmée|
|---|---|---|
|docs.astro.build/en/guides/upgrade-to/v5/|Migration v4→v5, breaking changes|Astro 5.0|
|docs.astro.build/en/basics/rendering-modes/|Modes static/server|Astro 5.x|
|docs.astro.build/en/guides/server-islands/|Server Islands guide complet|Astro 5.0+|
|docs.astro.build/en/guides/integrations-guide/cloudflare/|Adapter config, sessions, bindings|Adapter v12+|
|docs.astro.build/en/reference/routing-reference/|getStaticPaths, paginate, partials|Astro 5.x|
|docs.astro.build/en/guides/on-demand-rendering/|SSR, streaming|Astro 5.x|
|developers.cloudflare.com/workers/runtime-apis/nodejs/|Node.js compat, APIs supportées|2025|
|developers.cloudflare.com/pages/platform/limits/|Limites build/deploy|2025|
|developers.cloudflare.com/workers/platform/limits/|Runtime limits Workers|2025|

### GitHub Issues — Confiance Moyenne à Élevée

|Issue|Statut|Sujet|
|---|---|---|
|#12744|Open|Server Islands non détectées mode static-only|
|#13932|Open|404 prerendered + server = erreur 1042|
|#12771|Open|404 prerendered casse Server Islands|
|#11638|Resolved|Auto Minify casse Server Islands|

### Sources communautaires — Confiance Moyenne

|Source|Date|Sujet|
|---|---|---|
|dev.to/dagnelies|Jan 2025|Benchmarks latence KV Workers|
|launchfa.st/blog|Dec 2025|Pattern ISR avec KV|
|blog.cloudflare.com|Jan 2026|Acquisition Astro, Astro 6 workerd|
|ahastack.dev|2024-2025|Patterns HTMX + Alpine + Astro|

### Non vérifié / À confirmer

- Benchmarks TTFB Server Islands spécifiques Cloudflare : [INCERTAIN — données communautaires uniquement]
- Build incrémental Astro 5.17+ : [NON DOCUMENTÉ — feature non existante nativement]
- Performance comparée Workers vs Durable Objects pour sessions : [INCERTAIN]