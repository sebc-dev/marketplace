# Astro 5.17+ Islands Architecture pour Cloudflare

L'architecture Islands d'Astro 5.17+ sur Cloudflare exige une approche stratégique de l'hydratation partielle. Contrairement aux SPAs traditionnels, chaque island est un îlot d'interactivité isolé dans du HTML statique, avec des implications critiques pour la performance et la communication inter-composants. Ce guide fournit des patterns actionnables pour le développement freelance TPE/PME, en évitant les anti-patterns documentés.

---

## 1. Quick Reference — Islands & Hydratation

**Granularité des islands:**

- **Créer une island par feature interactive**, jamais par page entière — réduire la surface JavaScript
- **Limiter à 5-7 islands par page** — au-delà, mesurer l'impact performance avec `rollup-plugin-visualizer`
- **Exclure le contenu statique** des islands — wrapper uniquement l'élément interactif, pas sa section parente
- **Combiner les interactions liées** en une seule island — éviter 10 boutons = 10 islands

**Choix de directive:**

- **Utiliser `client:visible` par défaut** pour tout contenu below-fold — économise le JavaScript initial
- **Utiliser `client:idle` avec timeout** pour les éléments above-fold non-critiques — `client:idle={{timeout: 500}}`
- **Réserver `client:load`** uniquement aux interactions immédiates critiques (checkout, auth)
- **Préférer `client:visible={{rootMargin: "200px"}}`** pour pré-hydrater avant l'entrée viewport

**Server Islands (Astro 5.17+):**

- **Utiliser `server:defer` pour le contenu personnalisé** — avatars, prix dynamiques, recommandations
- **Toujours fournir `slot="fallback"`** avec placeholder identique en dimensions pour éviter CLS
- **Minimiser les props Server Islands** — au-delà de 2KB, Astro bascule en POST (non-cacheable)
- **Accéder à l'URL parent via `Referer` header** — `Astro.url` retourne `/_server-islands/[component]`

**Communication inter-islands:**

- **Utiliser nanostores pour tout state cross-island** — seule solution viable avec partial hydration
- **Importer le même module store** dans toutes les islands — chemin identique garantit instance partagée
- **Ne jamais écrire dans un store depuis `.astro` frontmatter** — n'affecte pas les composants clients
- **Utiliser `$store.get()` dans les handlers**, `useStore()` uniquement pour le rendu

**Cloudflare-specific:**

- **Désactiver "Auto Minify" dans Cloudflare** — casse les Server Islands (supprime les commentaires HTML critiques)
- **Configurer `nodejs_compat`** dans wrangler.json pour les imports Node polyfillés
- **Pas de `localStorage` dans Workers** — utiliser Cloudflare KV pour la persistence côté serveur

---

## 2. Decision Matrix — Hydratation

|Situation|Directive|Raison|Confiance|
|---|---|---|---|
|Bouton achat/checkout visible immédiatement|`client:load`|Critique pour conversion, doit être interactif instantanément|[OFFICIEL]|
|Navigation mobile (burger menu)|`client:idle={{timeout: 1000}}`|Pas utilisé immédiatement, mais doit être prêt rapidement|[OFFICIEL]|
|Carousel produits below-fold|`client:visible={{rootMargin: "300px"}}`|Pré-hydratation évite le délai perceptible à l'entrée viewport|[OFFICIEL]|
|Widget chat support|`client:idle={{timeout: 2000}}`|Faible priorité, peut attendre que le main thread soit libre|[INFÉRÉ]|
|Sidebar responsive|`client:media="(max-width: 768px)"`|Inutile de charger le JS desktop si média query non-matchée|[OFFICIEL]|
|Composant utilisant API navigateur sans SSR viable|`client:only="vue"`|Skip SSR obligatoire pour `window`, `localStorage`|[OFFICIEL]|
|Section commentaires en fin de page|`client:visible`|Économie maximale — charge uniquement si scroll atteint|[COMMUNAUTAIRE]|
|Formulaire de contact dans footer|`client:visible={{rootMargin: "400px"}}`|Rootmargin élevé = temps de hydratation pendant scroll|[INFÉRÉ]|
|Analytics/tracking non-visible|`client:idle{{timeout: 500}}`|Timeout garantit l'hydratation même sans `requestIdleCallback`|[OFFICIEL]|

**Valeurs `rootMargin` recommandées:** `"200px"` standard, `"400px"` pour contenu lourd ou connexions lentes.  
**Valeurs `timeout` recommandées:** `500ms` pour éléments critiques, `2000ms` pour éléments secondaires.

---

## 3. Decision Matrix — Communication inter-islands

|Situation|Approche|Raison|Confiance|
|---|---|---|---|
|State partagé entre 2+ islands (cart, auth)|**Nanostores atom/map**|Framework-agnostic, ~1KB, conçu pour partial hydration|[OFFICIEL]|
|State Vue complexe interne à une island|**Pinia** (via appEntrypoint)|Fonctionne dans une app Vue isolée, pas cross-island|[COMMUNAUTAIRE]|
|Data parent → child dans même framework|**Props**|Direct, aucun overhead, pas de subscription|[OFFICIEL]|
|One-shot event entre islands|**CustomEvent + window.dispatchEvent**|Découplage total, pas de state à maintenir|[COMMUNAUTAIRE]|
|Persistence utilisateur (préférences, drafts)|**@nanostores/persistent** (client) + **Cloudflare KV** (serveur)|Pas de localStorage dans Workers|[OFFICIEL]|
|URL state (filtres, pagination)|**URLSearchParams + history.replaceState**|Shareable, bookmarkable, SEO-friendly|[COMMUNAUTAIRE]|
|Server Island → Client Island|**Props sérialisés** + **slot="fallback"**|Server Islands ne partagent pas nanostores avec client|[INFÉRÉ]|
|Formulaire multi-étapes cross-page|**URL state** ou **Astro Sessions (KV)**|Nanostores reset au changement de page SSR|[INFÉRÉ]|

**Limitations clés nanostores:**

- `.astro` frontmatter: lecture possible, écriture n'affecte PAS les clients
- Pas de passage de store en prop
- Pas de subscription depuis `.astro` (pas de re-render)

---

## 4. Decision Matrix — Island vs Static vs Server Island

|Situation|Approche Astro 5.17+|Raison|Confiance|
|---|---|---|---|
|Navigation avec liens, sans dropdown interactif|**Composant .astro statique**|Zero JS, rendu HTML pur|[OFFICIEL]|
|Menu dropdown au hover/click|**Island client:idle**|Nécessite event listeners JavaScript|[OFFICIEL]|
|Prix dynamique selon session utilisateur|**Server Island server:defer**|Personnalisé mais pas interactif|[OFFICIEL]|
|Bouton "Ajouter au panier"|**Island client:load**|Interactivité critique immédiate|[OFFICIEL]|
|Avatar utilisateur connecté|**Server Island server:defer**|Contenu dynamique, fallback generic avatar|[OFFICIEL]|
|Liste de produits avec filtre|**Island client:visible**|Filtre = interactivité, visible = économie|[COMMUNAUTAIRE]|
|Contenu éditorial avec images|**Composant .astro + Astro Image**|Optimisation images, zero JS|[OFFICIEL]|
|Widget météo temps réel|**Island client:only="vue"**|API navigateur geolocation, pas de SSR viable|[INFÉRÉ]|
|Avis clients (fetch externe)|**Server Island** si < 2KB props, sinon **Island client:visible**|Server Islands cachent mal les grosses props|[OFFICIEL]|
|Bandeau promo personnalisé|**Server Island server:defer**|A/B testing server-side, pas d'interactivité|[INFÉRÉ]|

**Critère décisif:** Interactivité JavaScript requise → Island. Contenu dynamique sans interactivité → Server Island. Sinon → Composant .astro statique.

---

## 5. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|`client:load` sur tous les composants|Défaut `client:visible`, `client:idle` pour above-fold|Bundle JS x2-5, TTI dégradé|[OFFICIEL]|
|Island englobant une section entière|Wrapper uniquement l'élément interactif|Framework runtime chargé pour contenu statique|[COMMUNAUTAIRE]|
|Nesting islands (island dans island)|Composition interne: un seul island avec composants enfants|Race conditions hydratation, state perdu|[COMMUNAUTAIRE] #6301|
|Passer des objets complexes imbriqués en props|Aplatir les données, passer des IDs|Serialisation exponentielle (bloat HTML)|[COMMUNAUTAIRE] #7978|
|Fonctions en props d'island|Définir handlers dans le composant client|Non-sérialisable, erreur silencieuse|[OFFICIEL]|
|`client:only` sans `slot="fallback"`|Toujours fournir fallback HTML|SEO nul, accessibilité réduite, flash of content|[OFFICIEL]|
|DOM manipulation directe entre islands|Nanostores ou CustomEvent|Sélecteurs fragiles (`astro-island` wrapper)|[COMMUNAUTAIRE]|
|Mélanger 3+ frameworks dans un projet|Un framework principal + vanilla JS pour le reste|100KB+ runtime additionnel par framework|[COMMUNAUTAIRE]|
|Importer Vue entier pour un toggle|Script vanilla dans `<script>` tag Astro|~35KB économisés pour interaction triviale|[INFÉRÉ]|
|`@nanostores/persistent` sur Cloudflare SSR|KV binding pour persistence serveur, persistent côté client uniquement|Workers n'ont pas localStorage|[OFFICIEL]|
|Écrire dans nanostore depuis .astro frontmatter|Initialiser uniquement côté client ou via define:vars|N'affecte pas les composants hydratés|[OFFICIEL]|
|CSS `> .child` direct avec islands|`> astro-island > .child` ou wrapper div|Sélecteur cassé par `<astro-island>` wrapper|[COMMUNAUTAIRE]|

---

## 6. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|"Hydration mismatch" en console|Contenu différent server/client (dates, random, window)|Guard `import.meta.env.SSR`, initialiser à `null` puis `onMounted`|[OFFICIEL]|
|Island ne s'hydrate pas (pas d'erreur)|Directive `client:*` manquante ou import incorrect|Vérifier directive présente, path d'import correct|[COMMUNAUTAIRE]|
|`client:visible` ne déclenche jamais|Élément `display:none` ou sans dimension|Utiliser `client:media` ou `client:idle`, ajouter dimensions|[COMMUNAUTAIRE] #4103|
|Nanostores ne sync pas entre islands|Imports de chemins différents (alias vs relatif)|Unifier tous les imports au même chemin exact|[COMMUNAUTAIRE]|
|Server Islands retournent 404|`src/pages/404.astro` avec `prerender = true`|Garder 404 en SSR ou tester déploiement|[OFFICIEL]|
|Server Islands cassés en production CF|"Auto Minify" activé supprime commentaires HTML|Désactiver Auto Minify dans dashboard Cloudflare|[OFFICIEL]|
|Vue slots vides dans Astro|Noms de slots en camelCase|Utiliser kebab-case: `slot="social-links"`|[OFFICIEL]|
|`Cannot bundle node:stream` (Vue SSR CF)|Vue SSR utilise Node APIs|Ajouter à `vite.ssr.external`, activer `nodejs_compat`|[COMMUNAUTAIRE] #470|
|`__VUE_PROD_DEVTOOLS__ is not defined`|Build CF manque les defines Vue|Ajouter `define: {'__VUE_PROD_DEVTOOLS__': false}` dans vite config|[COMMUNAUTAIRE] #10339|
|Hydration race condition Safari|Bug corrigé Astro < 2.6|Mettre à jour vers Astro 2.6+|[OFFICIEL] #7197|
|Props island exponentiellement larges|Nested JSON escaping|Aplatir structure, passer IDs plutôt qu'objets|[COMMUNAUTAIRE] #7978|
|Vue `<Transition appear>` mismatch|Classe SSR = `[object Set]`|Éviter `appear` sur composants hydratés|[COMMUNAUTAIRE] #9636|
|Island dans slot ne charge pas scripts|Bug connu avec passed props slots|Ajouter instance du même composant hors du slot|[COMMUNAUTAIRE] #8212|

---

## 7. Code Patterns

### Pattern: Island Vue avec hydratation optimale

```vue
<!-- src/components/AddToCart.vue -->
<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { $cart, addToCart } from '@/stores/cart'

const props = defineProps<{ productId: string; price: number }>()
const cart = useStore($cart)

// Handler: .get() pas useStore (pas de re-render nécessaire)
const handleAdd = () => addToCart(props.productId, props.price)
</script>

<template>
  <button @click="handleAdd" class="btn-primary">
    Ajouter ({{ cart[productId]?.qty ?? 0 }})
  </button>
</template>
```

```astro
---
// Usage dans .astro - client:visible avec rootMargin pour pré-hydratation
import AddToCart from '@/components/AddToCart.vue'
---
<AddToCart 
  client:visible={{rootMargin: "200px"}} 
  productId="SKU-123" 
  price={29.99} 
/>
```

### Pattern: Communication cross-island via nanostores

```typescript
// src/stores/cart.ts — source unique de vérité
import { atom, map } from 'nanostores'

export const $isCartOpen = atom(false)
export const $cart = map<Record<string, { qty: number; price: number }>>({})

export function addToCart(id: string, price: number) {
  const current = $cart.get()[id]
  $cart.setKey(id, { 
    qty: (current?.qty ?? 0) + 1, 
    price 
  })
}

export function toggleCart() {
  $isCartOpen.set(!$isCartOpen.get())
}
```

```vue
<!-- CartFlyout.vue (autre island, même store) -->
<script setup>
import { useStore } from '@nanostores/vue'
import { $isCartOpen, $cart } from '@/stores/cart'

const isOpen = useStore($isCartOpen)
const cart = useStore($cart)
const total = computed(() => 
  Object.values(cart.value).reduce((sum, i) => sum + i.qty * i.price, 0)
)
</script>

<template>
  <aside v-if="isOpen" class="cart-flyout">
    <p>Total: {{ total.toFixed(2) }}€</p>
  </aside>
</template>
```

### Pattern: Directive personnalisée client:click

```javascript
// astro-click-directive/register.js
export default () => ({
  name: 'client:click',
  hooks: {
    'astro:config:setup': ({ addClientDirective }) => {
      addClientDirective({
        name: 'click',
        entrypoint: './astro-click-directive/click.js'
      })
    }
  }
})

// astro-click-directive/click.js
/** @type {import('astro').ClientDirective} */
export default (load, _opts, el) => {
  // Hydrate uniquement au premier click sur l'élément
  el.addEventListener('click', async () => {
    const hydrate = await load()
    await hydrate()
  }, { once: true })
}
```

```javascript
// astro.config.mjs
import clickDirective from './astro-click-directive/register.js'
export default defineConfig({
  integrations: [clickDirective(), vue()]
})
```

### Pattern: Vue slots dans Astro

```astro
---
import Card from '@/components/Card.vue'
---
<!-- IMPORTANT: kebab-case pour les noms de slots -->
<Card client:visible>
  <h2 slot="header">Titre de la carte</h2>
  <p>Contenu par défaut (default slot)</p>
  <a slot="footer" href="/more">En savoir plus</a>
</Card>
```

```vue
<!-- Card.vue -->
<template>
  <article class="card">
    <header><slot name="header" /></header>
    <main><slot /></main>
    <footer><slot name="footer" /></footer>
  </article>
</template>
```

### Pattern: Server Island + Client Island interaction

```astro
---
// src/components/UserSection.astro (Server Island)
const session = Astro.cookies.get('session')?.value
const user = session ? await getUser(session) : null
---
<section class="user-section">
  {user ? (
    <img src={user.avatar} alt={user.name} />
    <span>{user.name}</span>
  ) : (
    <span>Invité</span>
  )}
</section>
```

```astro
---
// src/pages/dashboard.astro
import UserSection from '@/components/UserSection.astro'
import UserMenu from '@/components/UserMenu.vue'
---
<header>
  <!-- Server Island: contenu personnalisé sans JS -->
  <UserSection server:defer>
    <div slot="fallback" class="skeleton-avatar" />
  </UserSection>
  
  <!-- Client Island: interactivité menu dropdown -->
  <UserMenu client:idle={{timeout: 1000}} />
</header>
```

```vue
<!-- UserMenu.vue - interactif, utilise même nanostore que d'autres islands -->
<script setup>
import { useStore } from '@nanostores/vue'
import { $user } from '@/stores/auth' // synced séparément via autre mécanisme

const isOpen = ref(false)
</script>

<template>
  <div class="user-menu">
    <button @click="isOpen = !isOpen">Menu</button>
    <nav v-if="isOpen">
      <a href="/settings">Paramètres</a>
      <a href="/logout">Déconnexion</a>
    </nav>
  </div>
</template>
```

---

## 8. @astrojs/vue Configuration Reference

```javascript
// astro.config.mjs — Configuration complète Vue + Cloudflare
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import vue from '@astrojs/vue'

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'cloudflare',
    sessionKVBindingName: 'SESSION' // Pour Astro Sessions
  }),
  
  integrations: [
    vue({
      // Enregistrement plugins Vue globaux (Pinia, i18n)
      appEntrypoint: '/src/pages/_app',
      
      // Activer JSX si utilisation de .tsx dans Vue
      jsx: false, // true si besoin, ajoute @vitejs/plugin-vue-jsx
      
      // DevTools uniquement en dev
      devtools: import.meta.env.DEV,
      
      // Options compilateur Vue
      template: {
        compilerOptions: {
          // Custom elements (Web Components)
          isCustomElement: (tag) => tag.includes('-')
        }
      }
    })
  ],
  
  vite: {
    // CRITIQUE pour Cloudflare Workers
    define: {
      '__VUE_PROD_DEVTOOLS__': false,
      '__VUE_OPTIONS_API__': true,
      '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': false
    },
    ssr: {
      external: [
        'node:buffer',
        'node:crypto', 
        'node:stream',
        'node:util'
      ]
    }
  }
})
```

```typescript
// src/pages/_app.ts — Point d'entrée Vue (si appEntrypoint configuré)
import type { App } from 'vue'
import { createPinia } from 'pinia' // Optionnel: Pinia pour state interne islands

export default (app: App) => {
  // Pinia fonctionne UNIQUEMENT au sein d'une même island Vue
  // Pour cross-island, utiliser nanostores
  app.use(createPinia())
}
```

```jsonc
// wrangler.jsonc — Configuration Cloudflare requise
{
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./dist/_worker.js/index.js",
  "assets": { "directory": "./dist" },
  "kv_namespaces": [
    { "binding": "SESSION", "id": "<VOTRE_KV_ID>" }
  ]
}
```

**Pièges configuration Cloudflare:**

|Piège|Symptôme|Solution|
|---|---|---|
|`nodejs_compat` manquant|`Cannot resolve node:*`|Ajouter flag dans wrangler.json|
|`__VUE_PROD_DEVTOOLS__` non défini|Worker crash build|Ajouter dans vite.define|
|Auto Minify activé|Server Islands 404/broken|Désactiver dans CF Dashboard|
|KV namespace non créé|Sessions échouent|`wrangler kv namespace create SESSION`|
|`vite.ssr.external` incomplet|Build errors Node imports|Ajouter tous les node:* utilisés par deps|

---

## 9. Références pour references/

### Islands Architecture — Concepts avancés

- **Granularité optimale**: Benchmarks suggèrent 5-7 islands/page max avant overhead mesurable
- **Hydration waterfall**: Islands chargent en parallèle mais hydratent séquentiellement sur main thread
- **Framework runtime sharing**: Un seul runtime Vue chargé même avec 10 islands Vue
- `grep: "island granularity" "hydration waterfall" "framework runtime"`

### Custom Client Directives — Implémentations avancées

- **client:hover**: Hydrate au survol (delay 100ms pour éviter false positives)
- **client:scroll**: Hydrate après X pixels de scroll
- **client:timeout**: Hydrate après délai fixe (backup pour client:idle)
- `grep: "addClientDirective" "ClientDirective type" "custom directive"`

### Nanostores — Patterns avancés

- **Computed stores**: `computed($baseStore, transform)` pour state dérivé
- **Batched stores**: `batched([$a, $b], (a, b) => ...)` pour éviter recalculs multiples
- **Lazy loading**: `onMount($store, () => fetch(...))` pour chargement différé
- **Request isolation SSR**: `@inox-tools/request-nanostores` pour éviter leaks entre requêtes
- `grep: "computed store" "batched" "onMount nanostore" "request-nanostores"`

### Vue SSR Cloudflare — Debugging avancé

- **renderToString vs pipeToWebWritable**: String pour petit contenu, stream pour grand
- **Vue 3.5 ESM build**: Résout la majorité des issues Workers
- **Polyfills nécessaires**: `stream-browserify` si deps legacy
- `grep: "pipeToWebWritable" "vue cloudflare stream" "renderToString"`

### Performance Measurement

- **rollup-plugin-visualizer**: `npm install -D rollup-plugin-visualizer`
- **Lighthouse CI**: Automated audits sur chaque deploy
- **Web Vitals**: Focus LCP, FID (hydration), CLS (Server Islands fallbacks)
- `grep: "bundle analysis" "rollup-plugin-visualizer" "lighthouse astro"`

---

## 10. Sources consultées

|Source|Type|Confiance|Version vérifiée|
|---|---|---|---|
|docs.astro.build/en/reference/directives-reference/|[OFFICIEL]|Haute|Astro 5.x|
|docs.astro.build/en/guides/server-islands/|[OFFICIEL]|Haute|Astro 5.x|
|docs.astro.build/en/guides/framework-components/|[OFFICIEL]|Haute|Astro 5.x|
|docs.astro.build/en/recipes/sharing-state-islands/|[OFFICIEL]|Haute|Astro 5.x|
|docs.astro.build/en/reference/integrations-reference/|[OFFICIEL]|Haute|Astro 5.x|
|docs.astro.build/en/guides/integrations-guide/vue/|[OFFICIEL]|Haute|@astrojs/vue 5.x|
|docs.astro.build/en/guides/integrations-guide/cloudflare/|[OFFICIEL]|Haute|@astrojs/cloudflare 12.x|
|github.com/nanostores/nanostores|[OFFICIEL]|Haute|v1.1.0|
|github.com/nanostores/vue|[OFFICIEL]|Haute|v1.0.1|
|github.com/nanostores/persistent|[OFFICIEL]|Haute|v1.2.0|
|developers.cloudflare.com/workers/runtime-apis/|[OFFICIEL]|Haute|2025|
|github.com/withastro/astro/issues|[COMMUNAUTAIRE]|Moyenne|Issues #4103, #6301, #7197, #7978, #8212, #9636|
|github.com/withastro/adapters/issues|[COMMUNAUTAIRE]|Moyenne|Issue #470|
|vuejs.org/guide/scaling-up/ssr.html|[OFFICIEL]|Haute|Vue 3.x|

**Versions confirmées compatibles:**

- Astro 5.17+
- @astrojs/vue 5.1.3+
- @astrojs/cloudflare 12.6.12+
- Vue 3.4+ (3.5 recommandé pour Workers)
- nanostores 0.9+ / 1.1.0
- Cloudflare Workers avec `compatibility_date >= 2024-09-23`

**[INCERTAIN]:** Les valeurs exactes de rootMargin et timeout sont des recommandations communautaires consolidées, pas des prescriptions officielles Astro. Tester selon le contexte projet.