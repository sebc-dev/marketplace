# Gestion des données Astro 5.17+ sur Cloudflare Workers

Les Content Collections Astro 5.x ont migré vers le système **Content Layer** avec loaders obligatoires. Sur Cloudflare Workers, **toute donnée Content Collections est traitée au build-time uniquement** — le runtime Workers n'a pas d'accès filesystem. Cette contrainte fondamentale façonne l'architecture data de tout projet Astro/Cloudflare.

## 1. Quick Reference (règles impératives pour SKILL.md)

### Migration Content Collections v5

1. **Déplacer le fichier config** de `src/content/config.ts` vers `src/content.config.ts` — c'est la première cause d'erreur migration [OFFICIEL]
2. **Remplacer `type: 'content'`** par `loader: glob({ pattern: '**/*.md', base: './src/data/collection' })` — l'ancien système est déprécié [OFFICIEL]
3. **Changer `entry.slug`** en `entry.id` dans tous les templates et getStaticPaths() — breaking change v5 [OFFICIEL]
4. **Importer `render()` séparément** : `import { render } from 'astro:content'` puis `render(entry)` au lieu de `entry.render()` [OFFICIEL]
5. **Supprimer `image().refine()`** — non supporté v5, valider les dimensions au runtime si nécessaire [OFFICIEL]
6. **Utiliser `z` depuis `astro/zod`** et non depuis le package `zod` directement pour compatibilité types [OFFICIEL]

### Choix de loader

7. **Utiliser `glob()`** pour fichiers Markdown/MDX/JSON locaux multiples — supporte patterns globs et base directory [OFFICIEL]
8. **Utiliser `file()`** pour fichier JSON/YAML/CSV unique avec option `parser` pour formats custom [OFFICIEL]
9. **Préférer loader inline async** pour APIs externes simples retournant un tableau — syntaxe compacte et suffisante [OFFICIEL]
10. **Créer loader object** uniquement si besoin de meta (sync tokens), watcher, ou digest change detection [OFFICIEL]

### Data Fetching Cloudflare

11. **Toujours prerendre les pages Content Collections** avec `export const prerender = true` — Workers n'a pas d'accès filesystem SSR [OFFICIEL]
12. **Configurer `cf: { cacheTtl: 300 }`** sur fetch() SSR pour exploiter le cache edge Cloudflare [OFFICIEL]
13. **Utiliser KV pour cache applicatif** avec TTL — idéal données API rarement modifiées mais pas critiques [OFFICIEL]
14. **Implémenter AbortController timeout** sur tout fetch() SSR — Workers a 30s CPU max (paid) [OFFICIEL]
15. **Respecter limite 1000 subrequests** par invocation Workers paid (50 free) — inclut KV/D1/Cache/fetch [OFFICIEL]

### CMS et cache

16. **Choisir Keystatic** pour sites vitrine TPE <1500€ avec éditeur technique — zéro coût, Git-based [COMMUNAUTAIRE]
17. **Choisir Sanity free tier** pour projets avec éditeur non-technique — 10K docs, visual editing [OFFICIEL]
18. **Configurer deploy hooks Cloudflare** dans Dashboard > Settings > Builds > Deploy hooks puis connecter aux webhooks CMS [OFFICIEL]
19. **Éviter loaders communautaires non maintenus** — vérifier dernière activité GitHub <6 mois [COMMUNAUTAIRE]
20. **Attendre Astro 6 stable** pour Live Content Collections en production — actuellement beta janvier 2026 [EXPERIMENTAL]

---

## 2. Decision Matrices

### 2a. Choix du type de loader

|Situation|Loader recommandé|Raison|Confiance|
|---|---|---|---|
|Markdown/MDX locaux multiples|`glob({ pattern, base })`|Pattern matching, ID auto-généré, HMR dev|[OFFICIEL] ✅|
|Fichier JSON/YAML unique|`file("path/to/file.json")`|Simple, parsing auto|[OFFICIEL] ✅|
|CSV ou format custom|`file("path", { parser })`|Parser custom csv-parse/sync|[OFFICIEL] ✅|
|API REST externe simple|Loader inline `async () => fetch()`|Compact, suffisant 90% cas|[OFFICIEL] ✅|
|API avec pagination/sync token|Loader object avec `meta.get/set`|Persistance état entre builds|[OFFICIEL] ✅|
|Notion|`@chlorinec-pkgs/notion-astro-loader`|Fork maintenu, gère images|[COMMUNAUTAIRE] ⚠️|
|Storyblok|`@storyblok/astro` v6.0+ `storyblokLoader()`|Officiel, Content Layer intégré|[OFFICIEL] ✅|
|Airtable|`@ascorbic/airtable-loader`|Maintenu par core team Astro|[COMMUNAUTAIRE] ✅|
|RSS/Atom feeds|`@ascorbic/feed-loader`|Production-ready, 160 stars|[COMMUNAUTAIRE] ✅|
|Sanity|API direct GROQ|**Pas de loader officiel** — issue #289 ouverte|[OFFICIEL] ⚠️|

### 2b. Choix de la stratégie de données

|Besoin|Approche Astro 5.17+|Compatible Cloudflare Workers|Confiance|
|---|---|---|---|
|Contenu statique Markdown|`glob()` loader + prerender|✅ Build-time seulement|[OFFICIEL] ✅|
|Données JSON/YAML locales|`file()` loader + prerender|✅ Build-time seulement|[OFFICIEL] ✅|
|Données CMS au build|Loader custom ou inline fetch|✅ Build-time|[OFFICIEL] ✅|
|Données fraîches chaque requête|fetch() SSR + `cf: { cacheTtl }`|✅ Avec cache edge|[OFFICIEL] ✅|
|Preview drafts temps réel|Live Content Collections (v6)|✅ (v6 beta)|[EXPERIMENTAL] ⚠️|
|Cache applicatif persistant|KV bindings|✅ Éventuelle consistance 60s|[OFFICIEL] ✅|
|Données relationnelles SQL|D1 bindings|✅ Max 10GB, 1M rows/query|[OFFICIEL] ✅|
|Contenu utilisateur-spécifique|fetch() SSR sans cache ou D1|✅ SSR obligatoire|[OFFICIEL] ✅|

### 2c. Choix CMS pour TPE/PME

|Profil projet|CMS recommandé|Type intégration Astro|Coût tier gratuit|Confiance|
|---|---|---|---|---|
|Site vitrine 5-10 pages, dev technique|**Keystatic**|`@keystatic/astro` Git-based|100% gratuit local, Cloud 3 users|[OFFICIEL] ✅|
|Site vitrine, client non-technique|**Sanity**|SDK `@sanity/astro` + GROQ|3 users, 10K docs, 500K req/mois|[OFFICIEL] ✅|
|Blog/Portfolio, dev seul|**Front Matter CMS**|Extension VS Code, zéro dep|100% gratuit|[OFFICIEL] ✅|
|Multilingue, visual editing|**Storyblok**|`@storyblok/astro` officiel|1 user, 1 espace (limité)|[OFFICIEL] ✅|
|Catalogue produits structuré|**Contentful**|SDK `contentful.js`|5 users, 25K records, 2 locales|[OFFICIEL] ✅|
|Maximum de users gratuits|**Sanity** > Contentful > Keystatic Cloud|-|Sanity 3, Contentful 5, Keystatic 3|[OFFICIEL] ✅|

### 2d. Stratégie de cache data sur Cloudflare

|Scénario|Mécanisme Cloudflare|Configuration|Confiance|
|---|---|---|---|
|Réponses API identiques multiples visiteurs|`cf: { cacheTtl: 300, cacheEverything: true }`|Dans options fetch()|[OFFICIEL] ✅|
|Cache edge avec TTL par status|`cf: { cacheTtlByStatus: { "200-299": 86400, "404": 1, "500-599": 0 } }`|Granulaire par code HTTP|[OFFICIEL] ✅|
|Cache programmatique custom|Cache API `caches.default.match/put`|Nécessite domaine custom (pas *.workers.dev)|[OFFICIEL] ✅|
|Données clé-valeur persistantes|KV bindings|`env.MY_KV.get/put` — éventuelle consistance 60s|[OFFICIEL] ✅|
|Sessions utilisateur|KV via `sessionKVBindingName` adapter|Configurer dans adapter cloudflare()|[OFFICIEL] ✅|
|Données relationnelles cachées|D1 + cf cacheTtl sur queries|Pour read-heavy workloads|[OFFICIEL] ✅|
|Invalidation globale cache|Purge API Cloudflare|Pas via cache.delete (local DC seulement)|[OFFICIEL] ✅|

---

## 3. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+ / Cloudflare|Impact|Source|
|---|---|---|---|
|Garder `type: 'content'` sans flag legacy|Migrer vers `loader: glob()` ou activer `legacy: { collections: true }`|Build échoue silencieusement ou types incorrects|[OFFICIEL]|
|Utiliser `entry.slug` après migration v5|Remplacer par `entry.id` partout|404 sur toutes pages collection|[OFFICIEL]|
|Appeler `entry.render()` directement|`import { render } from 'astro:content'` puis `render(entry)`|TypeError at runtime|[OFFICIEL]|
|`import { z } from 'zod'`|`import { z } from 'astro/zod'`|Types générés incompatibles|[OFFICIEL]|
|Lecture filesystem en SSR Cloudflare|Prerendre avec `export const prerender = true` ou fetch API externe|`ENOENT` ou silence — pas de fs runtime|[OFFICIEL]|
|fetch() SSR sans timeout|Implémenter AbortController avec setTimeout 5-10s|CPU timeout Workers 30s, request bloquée|[OFFICIEL]|
|fetch() SSR sans try/catch|Wrapper avec gestion erreur + fallback|500 non informatif, pas de graceful degradation|[COMMUNAUTAIRE]|
|Cache API sur *.workers.dev|Utiliser domaine custom ou `cf: { cacheTtl }`|Cache ignoré silencieusement|[OFFICIEL]|
|KV writes haute fréquence même clé|Utiliser Durable Objects ou D1|429 errors (max 1 write/sec/key)|[OFFICIEL]|
|Loaders communautaires >1 an sans update|Vérifier fork actif ou implémenter inline loader|Breaking changes Astro non gérés|[COMMUNAUTAIRE]|
|Schéma Zod trop permissif (`z.any()`)|Typer explicitement avec fallbacks `.default()`|Données corrompues passent silencieusement|[COMMUNAUTAIRE]|
|Live Collections en prod Astro 5.x|Attendre Astro 6 stable ou utiliser fetch SSR classique|API expérimentale, breaking changes possibles|[EXPERIMENTAL]|
|`image().refine()` pour validation dimensions|Valider au runtime dans composant|Non supporté v5, erreur build|[OFFICIEL]|
|Sharp image service sur Cloudflare|`imageService: 'compile'` ou `'passthrough'` dans adapter|Build fail ou runtime errors|[COMMUNAUTAIRE]|

---

## 4. Migration Checklist (ancien → nouveau Content Collections)

|Étape|Ancien système (v2-v4)|Nouveau système Astro 5.17+|Notes|
|---|---|---|---|
|1. Fichier config|`src/content/config.ts`|`src/content.config.ts`|À la racine de `src/`|
|2. Import Zod|`import { z } from 'zod'` ou inline|`import { z } from 'astro/zod'`|Compatibilité types générés|
|3. Type collection Markdown|`type: 'content'`|`loader: glob({ pattern: '**/*.md', base: './src/data/blog' })`|`base` relatif à racine projet|
|4. Type collection data|`type: 'data'`|`loader: file('src/data/authors.json')`|Chemin relatif racine|
|5. Identifiant entrée|`entry.slug`|`entry.id`|Mettre à jour getStaticPaths et liens|
|6. Rendu contenu|`const { Content } = await entry.render()`|`import { render } from 'astro:content'; const { Content } = await render(entry)`|Fonction importée|
|7. Schéma image|`image().refine(...)`|`image()` sans refine — valider runtime|Breaking change strict|
|8. Emplacement contenu|Obligatoirement `src/content/`|N'importe où (ex: `src/data/`)|Flexibilité accrue|
|9. Export|`export const collections = { blog }`|Identique|Pas de changement|
|10. Sync types|`astro sync` ou auto dev|`npx astro sync` après chaque changement schéma|Générer `.astro/types.d.ts`|
|11. Flag legacy (optionnel)|N/A|`legacy: { collections: true }` dans astro.config|Pour migration progressive|
|12. tsconfig|Include `src/content/config.ts`|Include `.astro/types.d.ts`, `**/*`|Vérifier exclude `dist`|

---

## 5. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|`Cannot find module 'astro:content'`|Fichier config mal nommé ou mal placé|Renommer en `src/content.config.ts` + `npx astro sync`|[OFFICIEL]|
|Collection vide sans erreur|`base` invalide dans glob() ou pattern ne matche rien|Vérifier chemin relatif à racine projet, tester pattern|[COMMUNAUTAIRE] Issue #12795|
|`entry.slug is undefined`|Migration v5 incomplète|Remplacer `entry.slug` par `entry.id`|[OFFICIEL]|
|`entry.render is not a function`|Ancien appel non migré|Importer `render` depuis `astro:content`|[OFFICIEL]|
|`reference()` fields cassés aléatoirement (dev)|Bug connu Content Layer|Commenter champ, dev, stop, décommenter, dev|[COMMUNAUTAIRE] Issue #12680|
|Collection vide Windows dev mode|Bug file watcher Windows|Utiliser `astro build && astro preview`|[COMMUNAUTAIRE] Issue #12866|
|`ENOENT` ou fichier non trouvé SSR Cloudflare|Tentative lecture filesystem runtime|Ajouter `export const prerender = true`|[OFFICIEL]|
|fetch() timeout ou "Script never generates response"|CPU time exceeded ou pas de error handling|Implémenter AbortController + try/catch|[OFFICIEL]|
|KV returns null immédiatement après put|Éventuelle consistance KV|Attendre 60s ou lire depuis même DC|[OFFICIEL]|
|Cache API ignoré|Domaine *.workers.dev ou Response avec Set-Cookie|Utiliser domaine custom, retirer Set-Cookie|[OFFICIEL]|
|Image optimization échoue Cloudflare|Sharp non supporté Workers|`imageService: 'compile'` dans adapter config|[COMMUNAUTAIRE] Issue #191|
|Webhook CMS ne déclenche pas rebuild|Deploy hook mal configuré ou URL incorrecte|Vérifier Dashboard CF > Settings > Builds > Deploy hooks|[OFFICIEL]|
|Schéma Zod validation error build|Donnée frontmatter ne match pas schéma|Utiliser `.optional()`, `.default()`, ou corriger frontmatter|[OFFICIEL]|
|Loader communautaire crash post-update Astro|Breaking change API loader (settings→config)|Vérifier fork maintenu ou migrer vers loader inline|[COMMUNAUTAIRE]|
|Types incohérents après modification schéma|Cache types obsolète|`npx astro sync` + restart TS server|[OFFICIEL]|
|Live Collections échoue|Feature expérimentale non activée (v5.x)|Ajouter `experimental: { liveContentCollections: true }`|[EXPERIMENTAL]|

---

## 6. Code Patterns (exemples minimaux)

### content.config.ts avec glob() loader (migration depuis type: 'content')

```typescript
// src/content.config.ts — NOUVEAU emplacement v5+
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod'; // IMPORTANT: depuis astro/zod

const blog = defineCollection({
  // NOUVEAU: loader remplace type: 'content'
  loader: glob({ 
    pattern: '**/*.{md,mdx}',      // Supporte arrays: ['**/*.md', '!drafts/**']
    base: './src/data/blog'        // Relatif à racine projet
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),      // String ISO → Date automatique
    updatedDate: z.coerce.date().optional(),
    cover: image(),                // Helper image Astro (destructuré du context)
    author: reference('authors'),  // Relation inter-collection
    tags: z.array(z.string()).default([]),
  }),
});

// OBLIGATOIRE: export nommé 'collections'
export const collections = { blog };
```

### content.config.ts avec file() loader + parser CSV

```typescript
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse as parseCsv } from 'csv-parse/sync';

const products = defineCollection({
  loader: file('src/data/products.csv', {
    // Parser custom pour CSV
    parser: (text) => parseCsv(text, { 
      columns: true,        // Première ligne = headers
      skip_empty_lines: true,
      cast: true            // Auto-cast numbers
    })
  }),
  schema: z.object({
    id: z.string(),         // REQUIS: identifiant unique
    name: z.string(),
    price: z.number(),
    category: z.string(),
  }),
});

export const collections = { products };
```

### Loader inline async pour API externe

```typescript
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const countries = defineCollection({
  // Loader inline: fonction async retournant array avec id
  loader: async () => {
    const response = await fetch('https://restcountries.com/v3.1/all');
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    
    // OBLIGATOIRE: chaque item doit avoir propriété 'id'
    return data.map((country: any) => ({
      id: country.cca3,  // Code ISO 3 lettres comme ID
      name: country.name.common,
      capital: country.capital?.[0] ?? null,
      population: country.population,
    }));
  },
  schema: z.object({
    name: z.string(),
    capital: z.string().nullable(),
    population: z.number(),
  }),
});

export const collections = { countries };
```

### Schéma Zod avancé (image, reference, transform)

```typescript
// src/content.config.ts
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const authors = defineCollection({
  loader: file('src/data/authors.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    bio: z.string().max(500),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/blog' }),
  schema: ({ image }) => z.object({
    title: z.string().min(5).max(100),
    
    // Transform: normaliser slug
    slug: z.string().transform(val => 
      val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    ),
    
    // Coerce: string date → Date object
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    
    // Image avec alt obligatoire (valider alt séparément, pas refine())
    cover: image(),
    coverAlt: z.string().min(10, 'Alt text minimum 10 caractères'),
    
    // Reference vers autre collection
    author: reference('authors'),
    
    // Array de references
    relatedPosts: z.array(reference('blog')).max(3).default([]),
    
    // Enum typé
    status: z.enum(['draft', 'review', 'published']).default('draft'),
    
    // Objet imbriqué
    seo: z.object({
      metaTitle: z.string().max(60).optional(),
      metaDescription: z.string().max(160).optional(),
    }).optional(),
  }),
});

export const collections = { authors, blog };
```

### Data fetching SSR avec cache Cloudflare

```typescript
// src/pages/api/products.ts
import type { APIContext } from 'astro';

export async function GET({ locals }: APIContext) {
  const { env } = locals.runtime;
  
  // 1. Vérifier cache KV d'abord (optionnel, pour cache applicatif)
  const cached = await env.CACHE_KV?.get('products', { type: 'json' });
  if (cached) {
    return Response.json(cached, {
      headers: { 'X-Cache': 'HIT' }
    });
  }
  
  // 2. Fetch avec cache edge Cloudflare + timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetch('https://api.example.com/products', {
      signal: controller.signal,
      cf: {
        cacheTtl: 300,           // Cache edge 5 min
        cacheEverything: true,   // Cache même sans Cache-Control
        cacheTtlByStatus: {
          '200-299': 300,        // Succès: 5 min
          '404': 60,             // Not found: 1 min
          '500-599': 0           // Erreurs: pas de cache
        }
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return new Response(`API Error: ${response.status}`, { status: 502 });
    }
    
    const data = await response.json();
    
    // 3. Stocker en KV pour cache applicatif (optionnel)
    await env.CACHE_KV?.put('products', JSON.stringify(data), {
      expirationTtl: 3600  // 1 heure
    });
    
    return Response.json(data, {
      headers: { 'X-Cache': 'MISS' }
    });
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return new Response('Request timeout', { status: 504 });
    }
    return new Response('Service unavailable', { status: 503 });
  }
}
```

### Webhook handler avec astro:server:setup

```typescript
// src/integrations/cms-webhook.ts
import type { AstroIntegration } from 'astro';

export function cmsWebhook(): AstroIntegration {
  return {
    name: 'cms-webhook',
    hooks: {
      'astro:server:setup': ({ server, refreshContent }) => {
        // Route webhook pour invalidation content
        server.middlewares.use('/api/webhook/cms', async (req, res) => {
          // Vérifier méthode
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method not allowed');
            return;
          }
          
          // Vérifier secret (header custom CMS)
          const secret = req.headers['x-webhook-secret'];
          if (secret !== process.env.CMS_WEBHOOK_SECRET) {
            res.statusCode = 401;
            res.end('Unauthorized');
            return;
          }
          
          // Parser body pour identifier collection
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body);
              
              // refreshContent() recharge loaders spécifiés
              await refreshContent({
                loaders: ['cms-loader'],  // Nom du loader à rafraîchir
                context: { 
                  webhookPayload: payload,
                  triggeredAt: new Date().toISOString()
                }
              });
              
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.statusCode = 400;
              res.end('Invalid JSON');
            }
          });
        });
      }
    }
  };
}

// Usage dans astro.config.mjs:
// integrations: [cmsWebhook()]
```

---

## 7. Loaders communautaires — État des lieux

|Loader|Maintenu|Dernière version|Compatible CF Workers|Cas d'usage|Confiance|
|---|---|---|---|---|---|
|**@ascorbic/feed-loader**|✅ Oui (core team)|Jul 2025|✅ Build-time|RSS/Atom feeds agrégation|✅ Production-ready|
|**@ascorbic/airtable-loader**|✅ Oui (core team)|~1 an|✅ Build-time|Airtable comme CMS|✅ Production-ready|
|**@ascorbic/csv-loader**|✅ Oui (core team)|~1 an|✅ Build-time|Données CSV|✅ Production-ready|
|**@storyblok/astro** v6.0+|✅ Officiel|Mar 2025|✅ Build-time|Storyblok CMS|✅ Officiel|
|**@chlorinec-pkgs/notion-astro-loader**|✅ Fork actif|~8 mois|✅ Build-time|Notion comme CMS|⚠️ Fork recommandé|
|**astro-loader-hashnode**|✅ Oui|Récent|✅ Build-time|Blog Hashnode|✅ Production-ready|
|**notion-astro-loader** (original)|❌ Cassé Astro 5|~1 an+|⚠️ Images cassées|❌ Ne pas utiliser|❌ Obsolète|
|**@sanity/astro**|✅ Officiel|Actif|⚠️ Pas de Content Layer|SDK direct, pas loader|⚠️ Pas de loader dédié|
|**strapi-community-astro-loader**|⚠️ Communauté|Récent|✅ Build-time|Strapi CMS|⚠️ Vérifier activité|

**Notes importantes** :

- **@ascorbic/** loaders maintenus par Matt Kane (core team Astro) — très fiables
- **Storyblok** a migré vers Content Layer officiel dans v6.0.2+
- **Sanity** n'a **pas** de loader Content Layer (issue #289 ouverte depuis fév 2025) — utiliser GROQ direct
- **Notion** : le loader original casse sur Astro 5 (problème images), utiliser le fork `@chlorinec-pkgs`
- Tous fonctionnent sur Cloudflare car ils s'exécutent au **build-time** uniquement

---

## 8. Références pour references/

### Guide migration Content Collections v4 → v5

- **URL officielle** : https://docs.astro.build/en/guides/upgrade-to/v5/
- **Breaking changes** : slug→id, render(), config location, image().refine() supprimé
- **grep hint** : `entry.slug`, `entry.render()`, `type: 'content'`, `type: 'data'`

### LoaderContext API complète

- **URL officielle** : https://docs.astro.build/en/reference/content-loader-reference/
- **Propriétés clés** : `store`, `meta`, `parseData()`, `generateDigest()`, `watcher`, `refreshContextData`
- **grep hint** : `LoaderContext`, `meta.get`, `meta.set`, `store.set`, `generateDigest`

### DataStore patterns avancés

- **Méthodes** : `get(id)`, `set({id, data, digest})`, `entries()`, `keys()`, `values()`, `delete(id)`, `clear()`, `has(id)`
- **Usage digest** : Retourner `false` de `set()` si digest inchangé (skip update)
- **grep hint** : `store.clear()`, `store.set({`, `DataEntry`

### Stratégies cache Cloudflare détaillées

- **Cache API** : https://developers.cloudflare.com/workers/runtime-apis/cache/
- **KV** : https://developers.cloudflare.com/kv/
- **D1** : https://developers.cloudflare.com/d1/
- **cf fetch options** : `cacheTtl`, `cacheEverything`, `cacheTtlByStatus`
- **grep hint** : `cf: {`, `caches.default`, `env.MY_KV`, `env.DB.prepare`

### Intégrations CMS pas-à-pas

- **Index CMS Astro** : https://docs.astro.build/en/guides/cms/
- **Contentful** : https://docs.astro.build/en/guides/cms/contentful/
- **Sanity** : https://docs.astro.build/en/guides/cms/sanity/
- **Storyblok** : https://docs.astro.build/en/guides/cms/storyblok/
- **Keystatic** : https://docs.astro.build/en/guides/cms/keystatic/
- **Decap CMS** : https://docs.astro.build/en/guides/cms/decap-cms/
- **grep hint** : `@sanity/astro`, `@storyblok/astro`, `@keystatic/astro`, `contentful.js`

### Live Content Collections deep dive

- **RFC** : https://github.com/withastro/roadmap/blob/feat/live-loaders/proposals/0055-live-content-loaders.md
- **Config** : `src/live.config.ts` avec `defineLiveCollection()`
- **Query** : `getLiveCollection()`, `getLiveEntry()` — retournent `{ entries, error, cacheHint }`
- **Status** : [EXPERIMENTAL] Astro 5.x avec flag, [STABLE] Astro 6.0 beta
- **grep hint** : `defineLiveCollection`, `getLiveCollection`, `liveContentCollections`

### Cloudflare Workers runtime

- **Limites** : https://developers.cloudflare.com/workers/platform/limits/
- **CPU** : 10ms free, 30s paid (configurable 5min)
- **Subrequests** : 50 free, 1000 paid
- **Mémoire** : 128MB par isolate
- **grep hint** : `cpu_ms`, `[limits]`, `compatibility_flags`

---

## 9. Sources consultées

### Documentation officielle Astro [OFFICIEL]

|URL|Contenu|Confiance|
|---|---|---|
|https://docs.astro.build/en/guides/content-collections/|Content Collections guide v5+|✅ Haute|
|https://docs.astro.build/en/reference/content-loader-reference/|LoaderContext, DataStore API|✅ Haute|
|https://docs.astro.build/en/guides/upgrade-to/v5/|Migration v4→v5 breaking changes|✅ Haute|
|https://docs.astro.build/en/reference/legacy-flags/|legacy.collections flag|✅ Haute|
|https://docs.astro.build/en/guides/cms/|Index intégrations CMS|✅ Haute|
|https://astro.build/blog/content-layer-deep-dive/|Content Layer architecture|✅ Haute|
|https://astro.build/blog/astro-6-beta/|Astro 6 beta, Live Collections stable, Cloudflare support|✅ Haute|

### Documentation officielle Cloudflare [OFFICIEL]

|URL|Contenu|Confiance|
|---|---|---|
|https://developers.cloudflare.com/workers/runtime-apis/|Workers runtime APIs|✅ Haute|
|https://developers.cloudflare.com/workers/runtime-apis/cache/|Cache API|✅ Haute|
|https://developers.cloudflare.com/kv/|KV bindings|✅ Haute|
|https://developers.cloudflare.com/d1/|D1 database|✅ Haute|
|https://developers.cloudflare.com/pages/functions/bindings/|Pages bindings|✅ Haute|
|https://developers.cloudflare.com/workers/platform/limits/|Runtime limits|✅ Haute|

### GitHub Issues [COMMUNAUTAIRE]

|URL|Sujet|Status|
|---|---|---|
|github.com/withastro/astro/issues/12680|reference() fields break randomly|Open|
|github.com/withastro/astro/issues/12866|Empty collections Windows dev|Open P4|
|github.com/withastro/astro/issues/12795|glob() weak validation|Open P2|
|github.com/withastro/adapters/issues/191|Sharp incompatible Cloudflare|Workaround|
|github.com/withastro/roadmap/pull/1164|Live Collections RFC|Accepted Apr 2025|

### Loaders communautaires [COMMUNAUTAIRE]

|Repository|Stars|Dernière activité|
|---|---|---|
|github.com/ascorbic/astro-loaders|160|Jul 2025|
|github.com/storyblok/storyblok-astro|N/A|Mar 2025|
|github.com/astro-notion/notion-astro-loader|N/A|~8 mois|

**Versions confirmées** :

- Astro 5.16.11 (stable actuel)
- Astro 6.0 beta (janvier 13, 2026)
- @astrojs/cloudflare adapter compatible 5.x+
- @storyblok/astro v6.0.2+ avec Content Layer

**Date recherche** : Février 2026

---

## Points clés pour le SKILL.md

**Architecture fondamentale** : Content Collections Astro 5.x = build-time seulement sur Cloudflare. Le runtime Workers n'a pas d'accès filesystem. Toute stratégie data doit partir de cette contrainte.

**Migration critique** : `entry.slug` → `entry.id`, `entry.render()` → `render(entry)` importé, fichier config déplacé. Ces 3 changements causent 90% des erreurs migration.

**Cloudflare cache** : Utiliser `cf: { cacheTtl }` sur fetch() pour cache edge gratuit. KV pour cache applicatif avec TTL. Cache API nécessite domaine custom (pas *.workers.dev).

**CMS TPE/PME** : Keystatic (gratuit, Git) pour dev technique, Sanity free tier (10K docs) pour client non-technique, Storyblok pour visual editing premium.

**Live Collections** : Attendre Astro 6 stable pour production. Actuellement beta avec excellent support Cloudflare Workers natif.