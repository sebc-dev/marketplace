# Architecture Astro 5.17+ pour Cloudflare : guide définitif

**L'architecture projet Astro 5.17+ sur Cloudflare repose sur trois ruptures majeures** : le déplacement de `content.config.ts` à la racine de `src/`, l'API Content Layer avec loaders obligatoires, et l'intégration native des bindings Cloudflare via `platformProxy`. Ce rapport condense les patterns actionnables pour sites vitrine TPE/PME (800€-5000€+), basés exclusivement sur la documentation officielle et les retours de production.

---

## 1. Quick Reference (pour SKILL.md)

**Règles impératives pour Astro 5.17+ / Cloudflare** :

1. **Placer `content.config.ts` à `src/content.config.ts`** — breaking change Astro 5.x, l'ancien emplacement `src/content/config.ts` est déprécié [OFFICIEL]
    
2. **Ajouter `.astro/types.d.ts` au tsconfig.json** — `astro sync` ne génère plus `src/env.d.ts`, inclure `[".astro/types.d.ts", "**/*"]` [OFFICIEL]
    
3. **Utiliser `loader: glob()` dans les collections** — le `type: 'content'` est supprimé, remplacer par `loader: glob({ pattern: "**/*.md", base: "./src/content/blog" })` [OFFICIEL]
    
4. **Renommer `slug` en `id`** dans les références Content Layer — breaking change silencieux causant des erreurs runtime [OFFICIEL]
    
5. **Activer `platformProxy: { enabled: true }` dans astro.config** — accès aux bindings KV/D1/R2 en dev local (activé par défaut) [OFFICIEL]
    
6. **Préférer `wrangler.jsonc` à `wrangler.toml`** — recommandation Cloudflare depuis wrangler v3.91.0, avec `$schema` pour autocomplétion [OFFICIEL]
    
7. **Choisir `.dev.vars` OU `.env`, pas les deux** — si `.dev.vars` existe, `.env` est ignoré complètement [OFFICIEL]
    
8. **Utiliser `src/assets/` pour images optimisées, `public/` pour fichiers servis tels quels** — seuls les fichiers dans `src/` passent par le pipeline d'optimisation [OFFICIEL]
    
9. **Éviter les catch-all routes `[...path].astro` avec Server Islands** — cause boucle infinie sur Cloudflare, utiliser `[path].astro` [COMMUNAUTAIRE]
    
10. **Configurer `imageService: 'passthrough'` ou `'compile'`** — Sharp incompatible avec Workers, `'cloudflare'` nécessite Image Resizing payant [OFFICIEL]
    
11. **Exécuter `wrangler types` avant `astro dev`** — génère les types Runtime Cloudflare, ajouter au script dev [OFFICIEL]
    
12. **Préférer `client:visible` à `client:load`** pour composants sous le fold — réduit le bundle initial de 40-60% [COMMUNAUTAIRE]
    
13. **Créer `public/.assetsignore` avec `_worker.js` et `_routes.json`** — évite les conflits de routing Workers [OFFICIEL]
    
14. **Définir `export const server = {}` dans `src/actions/index.ts`** — structure obligatoire pour Astro Actions, pas de sous-dossiers autonomes [OFFICIEL]
    
15. **Désactiver Auto Minify dans Cloudflare dashboard** — cause hydration mismatches avec les frameworks JS [OFFICIEL]
    

---

## 2. Project Structure Template

### Site vitrine TPE/PME (SSG dominant)

```
mon-site/
├── src/
│   ├── pages/                    # [REQUIS] Routing file-based
│   │   ├── index.astro           # Page d'accueil
│   │   ├── a-propos.astro        # kebab-case pour les pages
│   │   ├── services/
│   │   │   ├── index.astro
│   │   │   └── [service].astro   # Route dynamique
│   │   └── contact.astro
│   │
│   ├── components/               # [CONVENTION] Composants réutilisables
│   │   ├── Header.astro          # PascalCase pour composants
│   │   ├── Footer.astro
│   │   ├── Card.astro
│   │   └── ContactForm.tsx       # Island React si interactivité
│   │
│   ├── layouts/                  # [CONVENTION] Layouts de page
│   │   ├── BaseLayout.astro      # Layout principal
│   │   └── ServiceLayout.astro
│   │
│   ├── content/                  # [CONVENTION] Données Content Layer
│   │   ├── services/             # Collection "services"
│   │   │   ├── service-a.md
│   │   │   └── service-b.md
│   │   └── temoignages/          # Collection "temoignages"
│   │       └── client-1.yaml
│   │
│   ├── assets/                   # [CONVENTION] Images optimisées
│   │   ├── hero.jpg              # Passent par le pipeline Astro
│   │   └── logo.svg
│   │
│   ├── styles/                   # [CONVENTION] CSS global
│   │   └── global.css
│   │
│   └── content.config.ts         # [ASTRO 5.x] Config Content Layer
│
├── public/                       # Assets statiques non traités
│   ├── favicon.ico
│   ├── robots.txt
│   ├── manifest.webmanifest
│   └── .assetsignore             # Exclure _worker.js, _routes.json
│
├── astro.config.mjs              # Configuration Astro
├── wrangler.jsonc                # Configuration Cloudflare
├── tsconfig.json                 # TypeScript config
├── .dev.vars                     # Variables env Cloudflare local
└── package.json
```

### Site complexe (SSG + SSR + Server Islands)

```
mon-site-complexe/
├── src/
│   ├── pages/
│   │   ├── index.astro                    # SSG (default)
│   │   ├── blog/
│   │   │   ├── index.astro                # SSG - liste articles
│   │   │   └── [slug].astro               # SSG - articles
│   │   ├── app/
│   │   │   ├── index.astro                # SSR - export const prerender = false
│   │   │   └── dashboard.astro            # SSR - zone authentifiée
│   │   └── api/
│   │       ├── contact.ts                 # API endpoint
│   │       └── webhook.ts
│   │
│   ├── components/
│   │   ├── ui/                            # Composants atomiques
│   │   │   ├── Button.astro
│   │   │   ├── Input.astro
│   │   │   └── Card.astro
│   │   ├── blocks/                        # Composants composites
│   │   │   ├── Hero.astro
│   │   │   ├── Features.astro
│   │   │   └── Pricing.astro
│   │   ├── islands/                       # Composants hydratés
│   │   │   ├── ContactForm.tsx            # client:load - critique
│   │   │   ├── Newsletter.tsx             # client:idle - non-critique
│   │   │   └── Testimonials.tsx           # client:visible - sous le fold
│   │   └── server/                        # Server Islands
│   │       ├── UserProfile.astro          # server:defer - personnalisé
│   │       └── CartSummary.astro          # server:defer - temps réel
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── AppLayout.astro                # Pour zone SSR
│   │   └── BlogLayout.astro
│   │
│   ├── actions/                           # Astro Actions
│   │   ├── index.ts                       # Export server = { ... }
│   │   ├── contact.ts                     # Module séparé
│   │   └── newsletter.ts
│   │
│   ├── lib/                               # Logique métier
│   │   ├── db.ts                          # Wrapper D1/KV
│   │   └── auth.ts                        # Logique auth
│   │
│   ├── utils/                             # Utilitaires purs
│   │   ├── formatDate.ts
│   │   └── validation.ts
│   │
│   ├── types/                             # Types partagés
│   │   └── index.ts
│   │
│   ├── middleware.ts                      # Middleware Astro
│   │
│   ├── content/
│   │   ├── blog/
│   │   └── pages/
│   │
│   ├── assets/
│   │
│   ├── content.config.ts
│   └── env.d.ts                           # Types Runtime Cloudflare
│
├── public/
│   └── .assetsignore
│
├── astro.config.mjs
├── wrangler.jsonc
├── tsconfig.json
├── .dev.vars
└── package.json
```

---

## 3. Configuration Defaults

### astro.config.mjs minimal viable pour Cloudflare

```javascript
// astro.config.mjs — Astro 5.17+ / Cloudflare
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Site URL pour génération sitemap et URLs absolues
  site: 'https://example.com',
  
  // 'server' pour SSR, 'static' pour SSG pur (avec prerender = false possible)
  output: 'server',
  
  // Adapter Cloudflare avec options recommandées
  adapter: cloudflare({
    // 'passthrough' = pas d'optimisation (simple)
    // 'compile' = optimisation au build pour pages SSG uniquement
    // 'cloudflare' = Image Resizing (payant)
    imageService: 'passthrough',
    
    // Accès aux bindings Cloudflare en dev local
    platformProxy: {
      enabled: true,
      // persist: true stocke dans .wrangler/state/v3/
    },
    
    // Pour sessions Astro (défaut: 'SESSION')
    // sessionKVBindingName: 'SESSION',
  }),
  
  // Vite config pour Cloudflare Workers
  vite: {
    ssr: {
      // Externaliser les modules Node.js
      external: ['node:buffer', 'node:crypto'],
    },
    build: {
      // Désactiver pour debug en dev
      // minify: false,
    },
  },
  
  // Sessions Astro 5.7+ (optionnel)
  // session: {
  //   driver: 'cloudflare-kv-binding', // Auto-configuré par adapter
  //   cookie: { name: 'session', sameSite: 'lax' },
  // },
});
```

### wrangler.jsonc minimal viable

```jsonc
{
  // Schema pour autocomplétion IDE
  "$schema": "./node_modules/wrangler/config-schema.json",
  
  // Nom du projet (utilisé pour le subdomain workers.dev)
  "name": "mon-site",
  
  // Date de compatibilité — utiliser une date récente
  // nodejs_compat activé automatiquement après 2024-09-23
  "compatibility_date": "2025-01-15",
  
  // Flags de compatibilité
  "compatibility_flags": ["nodejs_compat"],
  
  // Pour Cloudflare Pages (recommandé pour sites simples)
  "pages_build_output_dir": "./dist",
  
  // OU pour Cloudflare Workers (recommandé pour apps complexes)
  // "main": "dist/_worker.js/index.js",
  // "assets": { "binding": "ASSETS", "directory": "./dist" },
  
  // Bindings (exemples)
  "kv_namespaces": [
    // { "binding": "SESSION", "id": "<KV_NAMESPACE_ID>" }
  ],
  
  // Variables d'environnement publiques
  "vars": {
    // "PUBLIC_API_URL": "https://api.example.com"
  }
}
```

### tsconfig.json recommandé

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strictNullChecks": true,
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@lib/*": ["src/lib/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": [
    ".astro/types.d.ts",
    "**/*"
  ],
  "exclude": [
    "dist",
    "node_modules"
  ]
}
```

### env.d.ts avec types Cloudflare Runtime

```typescript
/// <reference path="../.astro/types.d.ts" />

// Types générés par `wrangler types` (exécuter après modif wrangler.jsonc)
// import type { Env } from './.wrangler/types/worker-configuration';

// Définition manuelle des bindings Cloudflare
interface CloudflareEnv {
  // KV Namespaces
  SESSION: KVNamespace;
  CACHE: KVNamespace;
  
  // D1 Database
  DB: D1Database;
  
  // R2 Bucket
  ASSETS_BUCKET: R2Bucket;
  
  // Variables d'environnement
  PUBLIC_API_URL: string;
  API_SECRET: string;
}

// Type Runtime Cloudflare pour Astro
type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

// Extension de App.Locals pour accès au runtime
declare namespace App {
  interface Locals extends Runtime {
    // Ajouter vos propres locals ici
    user?: {
      id: string;
      email: string;
    };
  }
  
  // Types pour Sessions Astro 5.7+
  interface SessionData {
    userId?: string;
    cart?: string[];
    preferences?: Record<string, unknown>;
  }
}
```

---

## 4. Decision Matrix

|Situation|Approche Astro 5.17+|Raison|Confiance|
|---|---|---|---|
|**Site vitrine 5-10 pages**|`output: 'static'`, pas d'adapter|Performance maximale, coût zéro, CDN edge global|[OFFICIEL] Haute|
|**Site avec formulaire contact**|`output: 'static'` + Actions avec `prerender = false` sur l'action|Garde SSG pour pages, SSR minimal pour l'action|[OFFICIEL] Haute|
|**Site avec zone membre**|`output: 'server'`, adapter Cloudflare, Sessions API|SSR nécessaire pour auth, KV pour sessions|[OFFICIEL] Haute|
|**Composant avec état JS**|Island avec `client:visible` ou `client:idle`|Hydrate uniquement si visible/idle, réduit bundle|[OFFICIEL] Haute|
|**Composant navigation**|Island avec `client:load`|Critique UX, doit être interactif immédiatement|[COMMUNAUTAIRE] Haute|
|**Composant personnalisé (nom user)**|Server Island `server:defer`|Contenu dynamique sans bloquer le render initial|[OFFICIEL] Moyenne|
|**Image héro optimisée**|`src/assets/` + composant `<Image>`|Pipeline d'optimisation Astro, formats modernes|[OFFICIEL] Haute|
|**PDF téléchargeable**|`public/`|Pas d'optimisation nécessaire, servi tel quel|[OFFICIEL] Haute|
|**Favicon, robots.txt**|`public/`|Fichiers statiques attendus à la racine|[OFFICIEL] Haute|
|**< 30 composants**|Organisation par type (`components/`, `layouts/`)|Simple, conventions Astro standard|[COMMUNAUTAIRE] Haute|
|**> 50 composants**|Organisation par feature (`features/blog/`, `features/shop/`)|Colocation, maintenabilité|[COMMUNAUTAIRE] Moyenne|
|**Multi-projets freelance**|Dossiers séparés avec `package.json` commun templates|Monorepo complexe rarement justifié pour TPE|[INFÉRÉ] Moyenne|
|**Tests composants**|Co-location `Button.test.ts` à côté de `Button.astro`|Découverte facile, Vitest + Container API|[COMMUNAUTAIRE] Moyenne|
|**Layout vs Composant**|Layout = structure page (`<html>`, `<head>`, `<slot>`), Composant = UI réutilisable|Séparation des responsabilités|[OFFICIEL] Haute|
|**Astro Actions vs API Route**|Actions pour mutations (forms), API routes pour GET/webhooks|Actions typées, validation Zod intégrée|[OFFICIEL] Haute|

---

## 5. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|Placer `content.config.ts` dans `src/content/`|`src/content.config.ts` (racine de src)|Build échoue ou collections non détectées|[OFFICIEL]|
|Utiliser `type: 'content'` dans defineCollection|`loader: glob({ pattern: "**/*.md", base: "./src/content/blog" })`|Déprécié, types incorrects|[OFFICIEL]|
|Référencer `entry.slug` dans Content Layer|Utiliser `entry.id`|`slug` supprimé, undefined runtime|[OFFICIEL]|
|Appeler `entry.render()`|`import { render } from 'astro:content'; await render(entry)`|Méthode supprimée de l'objet entry|[OFFICIEL]|
|Utiliser `.dev.vars` ET `.env` ensemble|Choisir un seul fichier|`.dev.vars` ignore complètement `.env`|[OFFICIEL]|
|`[...path].astro` avec Server Islands|`[path].astro` (paramètre simple)|Boucle infinie, crash navigateur|[COMMUNAUTAIRE]|
|`export const prerender = true` sur 404.astro avec Server Islands|`prerender = false` pour 404|Server Islands retournent 404|[COMMUNAUTAIRE]|
|`import { Buffer } from 'buffer'`|`import { Buffer } from 'node:buffer'`|Module non résolu sur Workers|[OFFICIEL]|
|Sharp comme image service|`imageService: 'passthrough'` ou `'compile'`|Sharp incompatible Workers runtime|[OFFICIEL]|
|Auto Minify activé dans Cloudflare|Désactiver dans dashboard CF|Hydration mismatches|[OFFICIEL]|
|`client:load` sur tous les composants|`client:visible` pour sous le fold, `client:idle` pour non-critique|Bundle JS x3-5, TTI dégradé|[COMMUNAUTAIRE]|
|Layout entier comme Island React|Composants atomiques hydratés, layout Astro statique|Ship le framework entier, perf catastrophique|[COMMUNAUTAIRE]|
|Fetch ses propres endpoints au build|Import direct du module partagé|Build fail, complexité inutile|[COMMUNAUTAIRE]|
|Nommer une action `apply` ou `call`|Éviter les noms réservés JS|Erreur runtime obscure|[COMMUNAUTAIRE]|
|Inclure `src/env.d.ts` dans tsconfig|Inclure `.astro/types.d.ts`|`env.d.ts` plus généré par Astro 5|[OFFICIEL]|
|Modifier `wrangler.jsonc` sans `wrangler types`|Exécuter `wrangler types && astro dev`|Types Runtime Cloudflare désynchronisés|[OFFICIEL]|

---

## 6. Naming Conventions Table

|Élément|Convention|Exemple|Source|
|---|---|---|---|
|Composant Astro|PascalCase|`HeaderNav.astro`, `ServiceCard.astro`|[OFFICIEL]|
|Page Astro|kebab-case|`a-propos.astro`, `nos-services.astro`|[COMMUNAUTAIRE]|
|Layout|PascalCase|`BaseLayout.astro`, `BlogPostLayout.astro`|[OFFICIEL]|
|Route dynamique|[param]|`[slug].astro`, `[id].astro`|[OFFICIEL]|
|Route rest|[...param]|`[...path].astro` (⚠️ éviter avec Server Islands)|[OFFICIEL]|
|Collection content|kebab-case singulier ou pluriel cohérent|`blog/`, `services/`, `testimonial/`|[COMMUNAUTAIRE]|
|Fichier content|kebab-case|`mon-article.md`, `service-web.yaml`|[COMMUNAUTAIRE]|
|Fichier config content|Exact|`src/content.config.ts`|[OFFICIEL]|
|Action Astro|camelCase|`submitContact`, `subscribeNewsletter`|[OFFICIEL]|
|Fichier actions|kebab-case|`src/actions/index.ts`, `src/actions/contact.ts`|[OFFICIEL]|
|Middleware|Exact|`src/middleware.ts` ou `src/middleware/index.ts`|[OFFICIEL]|
|API route|kebab-case|`src/pages/api/send-email.ts`|[COMMUNAUTAIRE]|
|Utilitaire|camelCase|`formatDate.ts`, `validateEmail.ts`|[COMMUNAUTAIRE]|
|Type partagé|PascalCase|`types/BlogPost.ts`, `types/index.ts`|[COMMUNAUTAIRE]|
|Test unitaire|.test.ts|`Button.test.ts`, `formatDate.test.ts`|[COMMUNAUTAIRE]|
|Test E2E|.spec.ts|`contact-form.spec.ts`|[COMMUNAUTAIRE]|
|Déclaration types|.d.ts|`env.d.ts`, `global.d.ts`|[OFFICIEL]|
|Attributs HTML en Astro|kebab-case|`data-value`, `aria-label` (PAS camelCase)|[OFFICIEL]|
|Props composant|camelCase|`<Card isHighlighted={true} itemCount={5} />`|[OFFICIEL]|

---

## 7. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|`Cannot find module 'astro:content'`|`content.config.ts` mal placé|Déplacer vers `src/content.config.ts`|[OFFICIEL]|
|`entry.slug is undefined`|Content Layer utilise `id`|Remplacer `slug` par `id` dans le code|[OFFICIEL]|
|`entry.render is not a function`|API render() changée|`import { render } from 'astro:content'; await render(entry)`|[OFFICIEL]|
|Types `astro:content` disparaissent après save|Bug connu astro config|Redémarrer dev server|[COMMUNAUTAIRE]|
|`Cannot find module 'astro:env/server'`|Types non générés|Exécuter `astro build` une fois, puis dev|[COMMUNAUTAIRE]|
|`Could not resolve "events"` / `"os"`|Package Node.js incompatible|Ajouter `compatibility_flags: ["nodejs_compat"]`|[OFFICIEL]|
|`Cannot bundle Node.js built-in "node:stream"`|Vue + Cloudflare SSR|Bug ouvert, éviter Vue SSR ou downgrade adapter|[COMMUNAUTAIRE]|
|`Workers runtime failed to start`|workerd crash local|Downgrade adapter v10, fonctionne en prod|[COMMUNAUTAIRE]|
|`Hydration completed but contains mismatches`|Cloudflare Auto Minify|Désactiver Auto Minify dans dashboard CF|[OFFICIEL]|
|Server Island boucle infinie|Catch-all route `[...path].astro`|Renommer en `[path].astro`|[COMMUNAUTAIRE]|
|Server Island retourne 404|404.astro avec `prerender = true`|Mettre `prerender = false` sur 404|[COMMUNAUTAIRE]|
|`context.locals.runtime.env` undefined|Server Island au build time|Normal pour prerendering, vérifier `Astro.request`|[COMMUNAUTAIRE]|
|`.env` ignoré en local|`.dev.vars` existe|Supprimer `.dev.vars` OU migrer vars dedans|[OFFICIEL]|
|Types KV/D1 incorrects|Types non régénérés|Exécuter `wrangler types` après modif config|[OFFICIEL]|
|`Image service "Sharp" not compatible`|Adapter Cloudflare|Utiliser `imageService: 'passthrough'` ou `'compile'`|[OFFICIEL]|
|Build OK, runtime crash Workers|API Node.js non supportée|Vérifier imports avec `node:` prefix|[OFFICIEL]|
|Actions typées comme `any`|`moduleResolution: "NodeNext"`|Changer en `"bundler"` ou éditer `.astro/actions.d.ts`|[COMMUNAUTAIRE]|
|Trailing slash inconsistant|Config `trailingSlash`|Définir `trailingSlash: 'never'` ou `'always'` explicitement|[OFFICIEL]|

---

## 8. Code Patterns (exemples minimaux)

### astro.config.mjs complet annoté pour Cloudflare

```javascript
// astro.config.mjs — Production Astro 5.17+ / Cloudflare
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react'; // Optionnel: pour islands React

export default defineConfig({
  site: 'https://mon-site.fr',
  output: 'server', // SSR activé, pages SSG via prerender = true
  
  adapter: cloudflare({
    imageService: 'compile', // Optimise au build pour pages SSG
    platformProxy: { enabled: true },
  }),
  
  integrations: [
    react(), // Islands React (optionnel)
  ],
  
  vite: {
    ssr: { external: ['node:buffer', 'node:crypto'] },
  },
  
  // Comportement routing
  trailingSlash: 'never',
  compressHTML: true,
  
  // Chemins (défauts, rarement modifiés)
  // srcDir: './src',
  // publicDir: './public',
  // outDir: './dist',
});
```

### wrangler.jsonc complet annoté

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "mon-site-tpe",
  "compatibility_date": "2025-01-15",
  "compatibility_flags": ["nodejs_compat"],
  
  // Cloudflare Pages (simple, recommandé pour sites vitrine)
  "pages_build_output_dir": "./dist",
  
  // KV pour sessions (créer avec: wrangler kv namespace create SESSION)
  "kv_namespaces": [
    { "binding": "SESSION", "id": "<REMPLACER_PAR_ID>" }
  ],
  
  // Variables publiques (accessibles côté client si préfixées PUBLIC_)
  "vars": {
    "PUBLIC_SITE_NAME": "Mon Site TPE"
  }
}
```

### env.d.ts complet avec Runtime Cloudflare et Sessions

```typescript
/// <reference path="../.astro/types.d.ts" />

// Bindings Cloudflare (doit correspondre à wrangler.jsonc)
interface CloudflareEnv {
  // Sessions KV (nom = sessionKVBindingName dans adapter, défaut: SESSION)
  SESSION: KVNamespace;
  
  // Variables d'environnement
  PUBLIC_SITE_NAME: string;
  
  // Secrets (définis dans .dev.vars localement, CF dashboard en prod)
  // API_SECRET: string;
  
  // Autres bindings (D1, R2, Durable Objects...)
  // DB: D1Database;
  // BUCKET: R2Bucket;
}

// Runtime type pour accès dans Astro
type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
  // Étend Astro.locals avec le runtime Cloudflare
  interface Locals extends Runtime {
    // Vos propres données locals (ajoutées par middleware)
    user?: { id: string; email: string };
  }
  
  // Types pour Sessions Astro 5.7+ (Astro.session)
  interface SessionData {
    userId?: string;
    cartItems?: Array<{ productId: string; quantity: number }>;
    lastVisit?: string;
  }
}

// Pour modules CSS/assets (optionnel)
declare module '*.css' {
  const content: string;
  export default content;
}
```

### content.config.ts pour site vitrine

```typescript
// src/content.config.ts — Astro 5.x Content Layer API
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// Collection blog (fichiers Markdown)
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160), // SEO meta
    pubDate: z.coerce.date(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// Collection services (fichiers YAML)
const services = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    price: z.string(), // "À partir de 800€"
    icon: z.string(),
    features: z.array(z.string()),
  }),
});

// Collection témoignages (fichier JSON unique)
const testimonials = defineCollection({
  loader: file('./src/data/testimonials.json'),
  schema: z.object({
    name: z.string(),
    company: z.string(),
    quote: z.string(),
    rating: z.number().min(1).max(5),
  }),
});

export const collections = { blog, services, testimonials };
```

### Structure package.json scripts recommandée

```json
{
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "wrangler types && astro check && astro build",
    "preview": "wrangler pages dev ./dist",
    "deploy": "npm run build && wrangler pages deploy ./dist",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

---

## Sources de vérité utilisées

**[OFFICIEL] Documentation Astro 5.x :**

- https://docs.astro.build/en/basics/project-structure/
- https://docs.astro.build/en/guides/content-collections/
- https://docs.astro.build/en/guides/server-islands/
- https://docs.astro.build/en/guides/actions/
- https://docs.astro.build/en/guides/sessions/
- https://docs.astro.build/en/reference/configuration-reference/
- https://docs.astro.build/en/guides/integrations-guide/cloudflare/

**[OFFICIEL] Documentation Cloudflare :**

- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/configuration/environment-variables/
- https://developers.cloudflare.com/workers/runtime-apis/nodejs/

**[COMMUNAUTAIRE] Issues GitHub pertinentes :**

- withastro/astro #12475 (content.config.ts location)
- withastro/astro #12050 (Server Islands + catch-all routes)
- withastro/astro #12771 (prerendered 404 + Server Islands)
- withastro/adapters #470 (Vue + Cloudflare build)
- withastro/adapters #191 (Sharp incompatibility)