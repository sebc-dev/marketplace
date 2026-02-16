# TypeScript Best Practices pour Astro 5.17+ sur Cloudflare

Le typage dans Astro 5.17+ a subi des **changements structurels majeurs** par rapport à la version 4.x. La génération de types migre vers `.astro/types.d.ts`, le Content Layer API remplace l'ancien système de collections, et le module `astro:env` offre enfin un typage fort des variables d'environnement. Ce guide couvre les configurations, patterns et workflows éprouvés pour un développement TypeScript robuste ciblant Cloudflare Workers.

---

## 1. Quick Reference — Règles impératives

1. **Inclure `.astro/types.d.ts`** dans le tableau `include` du tsconfig — sinon aucun type généré ne sera reconnu [BREAKING Astro 5.0]
2. **Exécuter `astro sync`** avant `tsc --noEmit` — génère les types nécessaires pour content collections, actions, env
3. **Utiliser `moduleResolution: "Bundler"`** — requis par Astro/Vite, incompatible avec `"node"` ou `"node16"`
4. **Déclarer `App.Locals`** dans `env.d.ts` pour typer `context.locals` — évite les `as any` dans middleware/endpoints
5. **Activer `strictNullChecks: true`** — obligatoire pour le fonctionnement des Content Collections avec Zod
6. **Lancer `astro check && tsc --noEmit`** dans cet ordre en CI — `astro check` ne vérifie que les `.astro`, pas les `.ts`
7. **Utiliser `satisfies APIRoute`** pour les endpoints — meilleure inférence que l'annotation de type directe
8. **Importer `Runtime<Env>`** depuis `@astrojs/cloudflare` — pattern officiel pour typer le runtime Cloudflare
9. **Exécuter `wrangler types`** avant le build — génère les types Env depuis `wrangler.toml` automatiquement
10. **Éviter les APIs Node.js non-supportées** (`child_process`, `cluster`, `dgram`) — stubs non-fonctionnels sur Workers
11. **Utiliser `import type`** explicitement — requis par `verbatimModuleSyntax: true` (défaut Astro)
12. **Configurer `env.schema`** dans `astro.config.mjs` — remplace l'augmentation manuelle de `ImportMetaEnv` [Astro 5.0]
13. **Préfixer les paramètres inutilisés avec `_`** — permet la migration vers `strictest` sans erreurs
14. **Déplacer le config vers `src/content.config.ts`** — nouvelle localisation obligatoire des Content Collections [BREAKING Astro 5.0]

---

## 2. Decision Matrix — Choix de configuration TypeScript

|Situation|Configuration recommandée|Raison|Confiance|
|---|---|---|---|
|Nouveau projet Astro 5.17+|`extends: "astro/tsconfigs/strict"`|Défaut CLI, équilibre sécurité/pragmatisme|[OFFICIEL] ★★★|
|Projet existant migré de 4.x|`strict` + migration progressive vers `strictest`|Évite trop d'erreurs d'un coup|[COMMUNAUTAIRE] ★★★|
|Prototype/POC rapide|`extends: "astro/tsconfigs/base"` + `strictNullChecks: true`|Minimum pour Content Collections|[OFFICIEL] ★★★|
|Projet production critique|`extends: "astro/tsconfigs/strictest"`|Maximum de sécurité de types|[OFFICIEL] ★★★|
|Cloudflare Workers target|Ajouter `types: ["@cloudflare/workers-types"]`|Runtime types spécifiques|[OFFICIEL] ★★★|
|Utilisation de D1/KV/R2 bindings|`wrangler types` + `Runtime<Env>` pattern|Auto-génération types bindings|[OFFICIEL] ★★★|
|Path aliases (@components, etc.)|`baseUrl: "."` + `paths` dans tsconfig|Intégré automatiquement par Vite|[OFFICIEL] ★★★|
|Content Collections avec images|`image()` helper de `astro:content`|Validation et transformation automatiques|[OFFICIEL] ★★★|
|Variables d'environnement typées|`env.schema` avec `envField` dans config|Remplace `ImportMetaEnv` manuel|[OFFICIEL] ★★★|
|Sessions API (Astro 5.5+)|Déclarer `App.SessionData` dans `env.d.ts`|Typage fort des clés de session|[OFFICIEL] ★★☆|

---

## 3. Anti-patterns Table

|Ne pas faire|Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|`moduleResolution: "node"`|`moduleResolution: "Bundler"`|Erreurs d'import `astro:*` modules|[OFFICIEL]|
|Omettre `.astro/types.d.ts` dans include|`include: [".astro/types.d.ts", "**/*"]`|Aucun type généré reconnu|[BREAKING]|
|`context.locals as any`|Déclarer `App.Locals` interface|Perte totale de type safety middleware|[OFFICIEL]|
|`src/content/config.ts` (ancien path)|`src/content.config.ts` (racine src)|Collections non détectées|[BREAKING]|
|`post.slug` pour Content Collections|`post.id`|Propriété renommée en 5.0|[BREAKING]|
|`post.render()` méthode|`import { render } from 'astro:content'`|API modifiée, render est maintenant une fonction|[BREAKING]|
|`Buffer`, `fs`, `path` en SSR Cloudflare|APIs Web standards ou `node:*` prefix|Crash runtime Workers|[OFFICIEL]|
|Ignorer `astro check` avant build|`astro check && tsc --noEmit && astro build`|Erreurs types non détectées|[COMMUNAUTAIRE]|
|`type: 'content'` dans collections|`loader: glob({...})`|Ancienne API dépréciée|[BREAKING]|
|`Astro.glob()`|`import.meta.glob()`|Déprécié depuis Astro 5.0|[BREAKING]|
|`ctx.locals = { newObj }`|`Object.assign(ctx.locals, { newObj })`|Override complet interdit|[BREAKING]|
|`export const prerender = undefined`|`export const prerender = false` explicite|`runtime.env` undefined en prerender|[COMMUNAUTAIRE]|
|Types `@cloudflare/workers-types` seuls|`wrangler types` + package|Types potentiellement désynchronisés|[OFFICIEL]|

---

## 4. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|`Cannot find module 'astro:content'`|`.astro/types.d.ts` non inclus dans tsconfig|Ajouter à `include` + `astro sync`|[OFFICIEL]|
|`Property 'runtime' does not exist on type 'Locals'`|`App.Locals` non déclaré avec `Runtime<Env>`|Étendre `App.Locals extends Runtime`|[OFFICIEL]|
|Types Content Collections stale|Cache `.astro/` obsolète|Supprimer `.astro/` + `astro sync`|[COMMUNAUTAIRE]|
|`context.locals.runtime.env` undefined|Page prerendered au build|Ajouter `export const prerender = false`|[COMMUNAUTAIRE]|
|Erreurs VS Code mais `astro check` passe|Extension désynchronisée|Restart Extension Host + `astro sync`|[COMMUNAUTAIRE]|
|`Import declaration conflicts with local declaration`|`verbatimModuleSyntax` violation|Utiliser `import type { X }`|[OFFICIEL]|
|`tsc --noEmit` échoue, `astro check` passe|`astro check` ne vérifie pas les `.ts`|Les deux commandes sont nécessaires|[OFFICIEL]|
|`'KVNamespace' is not defined`|`@cloudflare/workers-types` non installé|`npm i -D @cloudflare/workers-types`|[OFFICIEL]|
|`Cannot use 'const enum'` avec Cloudflare|`isolatedModules: true` requis|Utiliser `enum` ou `as const`|[OFFICIEL]|
|`Astro.props` a type `any`|Interface `Props` non définie|Définir `interface Props {}` dans frontmatter|[OFFICIEL]|
|Bindings KV/D1 non typés|Env interface manquante|`wrangler types` ou déclaration manuelle|[OFFICIEL]|
|`strictNullChecks` erreurs partout|Option activée sans migration|Activer progressivement avec `strict` preset|[COMMUNAUTAIRE]|
|Build CI échoue sur Linux, passe en local|Case sensitivity fichiers/imports|Vérifier casing exact des imports|[COMMUNAUTAIRE]|

---

## 5. Code Patterns

### Pattern 1: tsconfig.json optimal Astro 5.17+ / Cloudflare

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@lib/*": ["./src/lib/*"]
    },
    "types": ["@cloudflare/workers-types"]
  },
  "include": [".astro/types.d.ts", "src/**/*", "src/env.d.ts"],
  "exclude": ["dist", "node_modules", ".wrangler"]
}
```

### Pattern 2: Interface Props canonique avec HTMLAttributes et slots

```astro
---
import type { HTMLAttributes } from 'astro/types';

interface Props extends HTMLAttributes<'button'> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

const { 
  variant = 'primary', 
  loading = false, 
  class: className,
  ...attrs 
} = Astro.props;
---

<button 
  class:list={[variant, className, { loading }]} 
  disabled={loading}
  {...attrs}
>
  <slot name="icon" />
  <slot>Default text</slot>
</button>
```

### Pattern 3: env.d.ts complet (App.Locals + Cloudflare Runtime + ImportMetaEnv)

```typescript
/// <reference path="../.astro/types.d.ts" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  KV_CACHE: KVNamespace;
  ASSETS_BUCKET: R2Bucket;
  API_SECRET: string;
}

declare namespace App {
  interface Locals extends Runtime {
    user: { id: string; email: string } | null;
    requestId: string;
  }
  interface SessionData {
    userId: string;
    cart: string[];
  }
}
```

### Pattern 4: Endpoint typé avec APIRoute + Cloudflare bindings

```typescript
// src/pages/api/users/[id].ts
import type { APIRoute } from 'astro';

export const GET = (async ({ params, locals }) => {
  const { env } = locals.runtime;
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(params.id).first();
  
  if (!user) {
    return new Response(null, { status: 404 });
  }
  return Response.json(user);
}) satisfies APIRoute;

export const DELETE = (async ({ params, locals }) => {
  const { env, ctx } = locals.runtime;
  ctx.waitUntil(env.KV_CACHE.delete(`user:${params.id}`));
  await env.DB.prepare('DELETE FROM users WHERE id = ?')
    .bind(params.id).run();
  return new Response(null, { status: 204 });
}) satisfies APIRoute;
```

### Pattern 5: Middleware typé avec App.Locals et sequence()

```typescript
// src/middleware.ts
import { defineMiddleware, sequence } from 'astro:middleware';

const auth = defineMiddleware(async ({ locals, cookies }, next) => {
  const token = cookies.get('session')?.value;
  if (token) {
    const user = await verifyToken(token, locals.runtime.env);
    locals.user = user;
  } else {
    locals.user = null;
  }
  return next();
});

const requestId = defineMiddleware(async ({ locals }, next) => {
  locals.requestId = crypto.randomUUID();
  return next();
});

export const onRequest = sequence(requestId, auth);
```

### Pattern 6: Content Collection avec schema Zod et types inférés

```typescript
// src/content.config.ts
import { defineCollection, z, reference } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/blog' }),
  schema: ({ image }) => z.object({
    title: z.string().max(100),
    pubDate: z.coerce.date(),
    cover: image().optional(),
    author: reference('authors'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/authors' }),
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().url(),
  }),
});

export const collections = { blog, authors };
```

### Pattern 7: Script CI/CD pour vérification de types complète

```yaml
# .github/workflows/ci.yml
name: TypeCheck & Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      
      # Générer types Cloudflare depuis wrangler.toml
      - run: npx wrangler types
      
      # Générer types Astro (content, actions, env)
      - run: npx astro sync
      
      # Vérifier fichiers .astro
      - run: npx astro check
      
      # Vérifier fichiers .ts/.tsx
      - run: npx tsc --noEmit
      
      # Build final
      - run: npm run build
      
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

**package.json scripts correspondants:**

```json
{
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "wrangler types && astro check && tsc --noEmit && astro build",
    "typecheck": "astro sync && astro check && tsc --noEmit",
    "preview": "wrangler pages dev dist"
  }
}
```

---

## 6. Références détaillées

### Types exportés par le package `astro`

|Import depuis|Type|Usage|
|---|---|---|
|`astro`|`APIRoute`|Signature handler endpoint|
|`astro`|`APIContext`|Contexte passé aux endpoints|
|`astro`|`MiddlewareHandler`|Signature fonction middleware|
|`astro`|`GetStaticPaths`|Type pour `getStaticPaths()`|
|`astro`|`InferGetStaticParamsType<T>`|Inférer params depuis getStaticPaths|
|`astro`|`InferGetStaticPropsType<T>`|Inférer props depuis getStaticPaths|
|`astro`|`IntegrationRouteData`|Données route pour integrations [NEW 5.0]|
|`astro/types`|`HTMLAttributes<T>`|Attributs HTML natifs|
|`astro/types`|`ComponentProps<T>`|Props d'un autre composant|
|`astro/types`|`Polymorphic<T>`|Composants polymorphiques (`as` prop)|
|`astro/types`|`HTMLTag`|Union des noms de tags HTML valides|
|`astro:content`|`CollectionEntry<T>`|Entrée typée d'une collection|
|`astro:content`|`CollectionKey`|Union des noms de collections|
|`astro:content`|`render`|Fonction render (anciennement méthode)|
|`astro:content`|`reference`|Référence inter-collections|
|`astro:actions`|`defineAction`|Définition d'action typée|
|`astro:actions`|`ActionError`|Classe d'erreur actions|
|`astro:actions`|`isInputError`|Type guard erreur validation|
|`astro:middleware`|`defineMiddleware`|Helper middleware typé|
|`astro:middleware`|`sequence`|Chaînage middleware|
|`astro/loaders`|`glob`, `file`|Loaders built-in Content Layer|
|`astro/config`|`envField`|Définition champs env typés|

### Mapping APIs Node.js vs Cloudflare Workers

|API Node.js|Support Workers|Alternative|
|---|---|---|
|`fs`|⚠️ Partiel (virtuel)|R2/KV bindings|
|`crypto`|✅ `node:crypto`|Web Crypto API natif|
|`path`|✅ `node:path`|String manipulation|
|`buffer`|✅ `node:buffer`|`Uint8Array`|
|`stream`|✅ `node:stream`|Web Streams API|
|`http`/`https`|✅ `node:http`|`fetch()` natif|
|`child_process`|❌ Stub non-fonctionnel|N/A|
|`cluster`|❌ Stub non-fonctionnel|N/A|
|`dgram` (UDP)|❌ Stub non-fonctionnel|N/A|
|`worker_threads`|❌ Non supporté|Durable Objects|
|`net.Socket`|⚠️ Limité|`connect()` API|

**Prérequis:** `compatibility_flags = ["nodejs_compat"]` dans `wrangler.toml`

### Migration TypeScript Astro 4.x → 5.x [BREAKING]

|Changement|Astro 4.x|Astro 5.x|Action requise|
|---|---|---|---|
|Fichier types|`src/env.d.ts` principal|`.astro/types.d.ts` généré|Ajouter au `include` tsconfig|
|Config collections|`src/content/config.ts`|`src/content.config.ts`|Déplacer fichier|
|Définition collection|`type: 'content'`|`loader: glob({...})`|Migrer syntaxe|
|Accès slug|`entry.slug`|`entry.id`|Renommer propriété|
|Render content|`entry.render()`|`render(entry)`|Import fonction|
|Variables env|`ImportMetaEnv` augmentation|`env.schema` config|Migrer vers astro:env|
|Glob import|`Astro.glob()`|`import.meta.glob()`|Remplacer appels|
|Locals override|`ctx.locals = {...}`|`Object.assign(ctx.locals, {...})`|Modifier assignations|
|Route types|`RouteData`|`IntegrationRouteData`|Renommer import (integrations)|
|distURL type|`URL \| undefined`|`URL[] \| undefined`|Itérer sur array|

### Options tsconfig expliquées avec impact Astro

|Option|Valeur recommandée|Impact spécifique Astro|
|---|---|---|
|`moduleResolution`|`"Bundler"`|**Obligatoire** - permet imports `astro:*`|
|`verbatimModuleSyntax`|`true`|Force `import type` explicites|
|`isolatedModules`|`true`|Requis par esbuild/Cloudflare|
|`strictNullChecks`|`true`|**Obligatoire** pour Content Collections|
|`skipLibCheck`|`true`|Performance, défaut Astro|
|`allowImportingTsExtensions`|`true`|Permet imports `.ts` directs|
|`noEmit`|`true`|Astro/Vite gèrent la transpilation|
|`jsx`|`"react-jsx"`|Configuration JSX Astro|
|`jsxImportSource`|`"astro"`|Runtime JSX Astro|

---

## 7. Sources consultées

|Source|Type|Confiance|Versions confirmées|
|---|---|---|---|
|docs.astro.build/guides/typescript|[OFFICIEL]|★★★|Astro 5.x|
|docs.astro.build/guides/upgrade-to/v5|[OFFICIEL]|★★★|Astro 5.0|
|docs.astro.build/guides/content-collections|[OFFICIEL]|★★★|Astro 5.x Content Layer|
|docs.astro.build/guides/actions|[OFFICIEL]|★★★|Astro 4.15+|
|docs.astro.build/guides/integrations-guide/cloudflare|[OFFICIEL]|★★★|@astrojs/cloudflare v12.x|
|developers.cloudflare.com/workers/languages/typescript|[OFFICIEL]|★★★|Workers Types v4.x|
|developers.cloudflare.com/workers/runtime-apis/nodejs|[OFFICIEL]|★★★|Wrangler 4.x|
|github.com/withastro/astro/tree/main/packages/astro/tsconfigs|[OFFICIEL]|★★★|Astro 5.x|
|GitHub Issues withastro/astro (labels: typescript, types)|[COMMUNAUTAIRE]|★★☆|Divers|

**Notes de version:**

- Astro: 5.17+ confirmé
- @astrojs/cloudflare: v12.x (maintenu dans monorepo principal depuis février 2025)
- TypeScript: 5.x recommandé
- @cloudflare/workers-types: v4.x
- Wrangler: v4.x

---

## Points d'attention pour le Skill Claude Code

Cette recherche identifie plusieurs **zones à fort risque d'erreur** que le skill devrait surveiller activement:

1. **Absence de `.astro/types.d.ts` dans include** — erreur silencieuse très commune après upgrade
2. **`post.slug` au lieu de `post.id`** — breaking change subtil des Content Collections
3. **APIs Node.js incompatibles** utilisées dans du code SSR ciblant Workers
4. **`astro check` considéré comme suffisant** alors qu'il ignore les `.ts`
5. **Variables d'environnement non typées** via l'ancien pattern `ImportMetaEnv`
6. **`context.locals.runtime.env` undefined** en mode prerender

Le skill devrait générer des **warnings proactifs** quand ces patterns sont détectés dans le code.