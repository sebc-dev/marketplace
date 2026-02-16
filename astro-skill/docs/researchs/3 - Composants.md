# Composants Astro 5.17+ sur Cloudflare : Guide Expert

**L'essentiel** : Les composants Astro 5.17+ requièrent une maîtrise des patterns de composition avancés, du typage strict via `HTMLAttributes`/`Polymorphic`, et des contraintes spécifiques au runtime Cloudflare Workers. Ce guide condense les pratiques validées en production pour créer des composants robustes, typés et performants sur Cloudflare Pages.

---

## 1. Quick Reference — Composants Astro (pour SKILL.md)

### Structure et Frontmatter

1. **Importer les types avec `import type`** pour éviter les problèmes de bundling avec `verbatimModuleSyntax` [OFFICIEL]
2. **Éviter les APIs Node.js non supportées** dans le frontmatter (`child_process`, `worker_threads`, `dgram`) — utiliser le préfixe `node:` pour les APIs compatibles (`node:buffer`, `node:crypto`) [OFFICIEL]
3. **Limiter la logique lourde** dans le frontmatter — impacte le cold start Workers et le temps de build [INFÉRÉ]

### Props et Typage

4. **Toujours définir `interface Props`** avec types explicites — les erreurs silencieuses à runtime sont fréquentes sans typage [OFFICIEL]
5. **Étendre `HTMLAttributes<'element'>`** pour les composants wrapper acceptant des attributs natifs [OFFICIEL]
6. **Utiliser `Polymorphic<{ as: Tag }>`** pour les composants à tag dynamique type-safe (Astro 2.5.0+) [OFFICIEL]
7. **Destructurer `class` avant spread** : `const { class: className, ...rest } = Astro.props` — évite l'écrasement et permet `class:list` [COMMUNAUTAIRE]
8. **Passer `...rest` obligatoirement** avec `scopedStyleStrategy: 'attribute'` pour inclure `data-astro-cid-*` [OFFICIEL]

### Slots et Composition

9. **Utiliser `slot name="x" slot="x"`** pour transférer les named slots entre layouts imbriqués [OFFICIEL]
10. **Vérifier avec `Astro.slots.has('name')`** avant de rendre les wrappers conditionnels — évite le markup vide [OFFICIEL]
11. **Ne pas compter sur le fallback** si un slot vide est passé — fallback ≠ slot vide passé par le parent [OFFICIEL]

### Directives de Template

12. **Préférer data-attributes à `define:vars`** sur `<script>` — `define:vars` implique `is:inline` (pas de bundling, exécution multiple) [OFFICIEL]
13. **Échapper manuellement `set:html`** — aucun échappement automatique, risque XSS critique [OFFICIEL]
14. **Utiliser `is:raw`** pour le contenu avec syntaxe conflictuelle (KaTeX, templates littéraux) [OFFICIEL]

### Interop Framework Components

15. **Ne jamais mapper des islands hydratées** — un seul contrôleur `client:visible` pour N éléments statiques [COMMUNAUTAIRE]

---

## 2. Decision Matrix — Composants

|Situation|Approche Astro 5.17+|Raison|Confiance|
|---|---|---|---|
|Interactivité isolée dans page statique|Server Island `server:defer` + fallback|Chargement différé, page statique rapide, cache CDN|Élevé [OFFICIEL]|
|Composant réutilisable avec tag variable|`Polymorphic<{ as: Tag }>` + destructuration|Type-safety sur attributs selon le tag|Élevé [OFFICIEL]|
|Passage de classes au composant enfant|Destructurer `class`, merger via `class:list={[base, className]}`|Pas de merge automatique en Astro|Élevé [COMMUNAUTAIRE]|
|Données partagées entre composants de page|`Astro.locals` (middleware)|Request-scoped, pas de props drilling|Élevé [OFFICIEL]|
|État partagé entre islands de frameworks différents|Nanostores (`@nanostores/react`, `/vue`)|286 bytes, framework-agnostic|Élevé [COMMUNAUTAIRE]|
|Rendu HTML externe/CMS|`<Fragment set:html={content} />` + sanitization|Pas de wrapper div, échappement manuel requis|Moyen [OFFICIEL]|
|Contenu personnalisé dans page prérendue|Server Island + Sessions API|Session via KV Cloudflare, statique par défaut|Élevé [OFFICIEL]|
|Liste d'éléments avec tri/filtre|Items statiques + 1 contrôleur hydraté|Évite N frameworks runtime|Élevé [COMMUNAUTAIRE]|
|Layouts imbriqués avec named slots|`<slot name="x" slot="x" />` dans layout intermédiaire|Forwarding explicite requis|Élevé [OFFICIEL]|
|Composant récursif (tree, menu)|`<Astro.self items={children} />`|Auto-référence sans import circulaire|Élevé [OFFICIEL]|
|Props complexes vers Server Island|Garder props < 2KB, éviter fonctions|GET cached vs POST non-cached, fonctions non-sérialisables|Élevé [OFFICIEL]|
|Image optimisée en SSR Cloudflare|`imageService: 'cloudflare'` ou `'passthrough'`|Sharp incompatible avec Workers runtime|Élevé [OFFICIEL]|

---

## 3. Anti-patterns Table — Composants

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|Props sans `interface Props`|Toujours définir interface avec types explicites|Erreurs silencieuses, pas d'autocomplétion|[OFFICIEL]|
|`set:html` avec contenu non-fiable|Échapper avec DOMPurify ou équivalent avant|Vulnérabilité XSS critique|[OFFICIEL]|
|`define:vars` sur `<script>` pour data|Data-attributes + `JSON.parse(el.dataset.x)`|Script non-bundlé, exécuté N fois si N instances|[OFFICIEL]|
|Mapper `client:load` sur array|Items statiques + 1 contrôleur hydraté|N × taille framework au lieu de 1|[COMMUNAUTAIRE]|
|`client:load` par défaut|`client:visible` ou `client:idle` selon UX|KB cachés, travail main-thread initial|[COMMUNAUTAIRE]|
|Fetch ses propres endpoints au build|Module partagé importé directement|Ordre de build non-déterministe|[COMMUNAUTAIRE]|
|Passer fonctions à `server:defer`|Props primitives/objets sérialisables uniquement|Fonctions non-sérialisables, erreur silencieuse|[OFFICIEL]|
|Server Island dans named slot|Server Island en enfant direct|Bug connu #13969, ne fonctionne pas|[OFFICIEL]|
|`Astro.url` dans Server Island|`Astro.request.headers.get('Referer')`|URL = `/_server-islands/Name`, pas la page|[OFFICIEL]|
|Overwrite `context.locals = {}`|`Object.assign(context.locals, {...})`|Breaking change Astro 5.0, erreur dev|[OFFICIEL]|
|Sharp `<Image>` en SSR Cloudflare|`imageService: 'cloudflare'` ou `'passthrough'`|Sharp incompatible Workers runtime|[OFFICIEL]|
|Import sans préfixe `node:`|Toujours `import from 'node:buffer'` etc.|Packages legacy peuvent échouer sur Workers|[OFFICIEL]|
|Props > 2KB vers Server Island|Passer IDs, fetcher dans l'island|GET → POST, perte du cache navigateur|[OFFICIEL]|
|Slot nommé via élément imbriqué|Slot comme enfant direct du composant|Named slots doivent être enfants immédiats|[OFFICIEL]|
|`class:list` passé comme prop|Destructurer, normaliser manuellement|Retourne array/object, pas string|[COMMUNAUTAIRE]|
|Compter sur fallback avec slot vide|`Astro.slots.has()` pour logique conditionnelle|Slot vide ≠ slot absent|[OFFICIEL]|

---

## 4. Troubleshooting Table — Composants

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|`Hydration completed but contains mismatches`|Auto Minify Cloudflare activé|Désactiver dans Cloudflare Dashboard > Speed > Optimization|[OFFICIEL]|
|Slot content non rendu|Named slot pas enfant direct|Restructurer : slot doit être enfant immédiat du composant|[OFFICIEL]|
|Styles scoped non appliqués|`...rest` non passé ou `data-astro-cid-*` manquant|Toujours spreader `{...rest}` sur l'élément racine|[OFFICIEL]|
|Props undefined dans composant|Interface Props sans export/définition|Définir `interface Props {}` dans le frontmatter|[OFFICIEL]|
|`Cannot find module '@components/X'`|Paths tsconfig incorrects|Vérifier `paths` dans `tsconfig.json`, run `astro sync`|[OFFICIEL]|
|`Property 'render' does not exist on type 'never'`|Types content collection désynchronisés|Exécuter `npx astro sync`|[OFFICIEL]|
|Server Island retourne mauvaise URL|`Astro.url` dans island = endpoint interne|Utiliser `Astro.request.headers.get('Referer')`|[OFFICIEL]|
|Script conditionnel ne fonctionne pas|Changement Astro 5.0 — scripts non hoistés|Ajouter `is:inline` pour préserver comportement v4|[OFFICIEL]|
|Actions perdent résultat après refresh|Comportement POST normal|Implémenter Sessions API pour persister|[OFFICIEL]|
|`compiledContent()` retourne Promise|API async depuis Astro 5.0|Ajouter `await` devant l'appel|[OFFICIEL]|
|`astro:content` erreur côté client|Import interdit côté client|Passer data via props au composant client|[OFFICIEL]|
|Image optimization échoue en SSR|Sharp incompatible Cloudflare|Configurer `imageService: 'cloudflare'`|[OFFICIEL]|
|Dynamic tag ignore `client:*`|Limitation Astro — hydration directives non supportées|Importer et utiliser composant directement|[OFFICIEL]|
|`Astro.props` typé `any` avec Polymorphic|Bug connu #10347|Type assertion ou interface non-générique|[COMMUNAUTAIRE]|
|Variable sessions `undefined`|Page prérendue (`prerender = true`)|Ajouter `export const prerender = false`|[OFFICIEL]|
|Erreur stack minifiée en prod|Vite minification|`vite: { build: { minify: false } }` pour debug|[OFFICIEL]|

---

## 5. Code Patterns (exemples minimaux)

### Pattern 1 : Composant polymorphe avec props typées

```astro
---
// Button.astro — Polymorphic button/link component
import type { HTMLTag, Polymorphic } from "astro/types";

type Props<Tag extends HTMLTag> = Polymorphic<{ as: Tag }> & {
  variant?: "primary" | "secondary";
};

const { 
  as: Tag = "button",  // Défaut: button, permet <a>, <div>, etc.
  variant = "primary",
  class: className,    // Destructurer class (mot réservé)
  ...rest              // Inclut data-astro-cid-* pour styles scoped
} = Astro.props;
---
<Tag 
  class:list={["btn", `btn--${variant}`, className]} 
  {...rest}
>
  <slot />
</Tag>
```

**[OFFICIEL]** Usage : `<Button as="a" href="/about" variant="secondary">Link</Button>`

### Pattern 2 : Slots avancés avec vérification conditionnelle

```astro
---
// Card.astro — Named slots with conditional wrappers
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<article class="card">
  <header>
    <h2>{title}</h2>
    {Astro.slots.has("badge") && (
      <span class="card__badge">
        <slot name="badge" />
      </span>
    )}
  </header>
  
  <div class="card__body">
    <slot />  {/* Default slot */}
  </div>
  
  {Astro.slots.has("footer") && (
    <footer class="card__footer">
      <slot name="footer" />
    </footer>
  )}
</article>
```

**[OFFICIEL]** Le wrapper `<footer>` n'est rendu que si le slot est fourni.

### Pattern 3 : Slot forwarding entre layouts imbriqués

```astro
---
// BaseLayout.astro
---
<html>
  <head>
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

```astro
---
// BlogLayout.astro — Forward slots to parent
import BaseLayout from "./BaseLayout.astro";
const { title } = Astro.props;
---
<BaseLayout>
  {/* Clé: attributs name ET slot pour transférer */}
  <slot name="head" slot="head" />
  <article>
    <h1>{title}</h1>
    <slot />
  </article>
</BaseLayout>
```

```astro
---
// Page usage
import BlogLayout from "../layouts/BlogLayout.astro";
---
<BlogLayout title="Mon Article">
  <meta name="description" content="..." slot="head" />
  <p>Contenu de l'article...</p>
</BlogLayout>
```

**[OFFICIEL]** Syntaxe `<slot name="x" slot="x" />` obligatoire pour forwarding.

### Pattern 4 : `define:vars` pour styles + data-attributes pour scripts

```astro
---
// ColorBox.astro — Server data to client safely
interface Props {
  color: string;
  itemId: string;
}
const { color, itemId } = Astro.props;
---
{/* define:vars OK pour styles (pas is:inline implicite) */}
<style define:vars={{ themeColor: color }}>
  .box {
    background: var(--themeColor);
  }
</style>

{/* Data-attributes pour scripts (évite is:inline) */}
<div 
  class="box" 
  data-item-id={itemId}
  data-config={JSON.stringify({ color, timestamp: Date.now() })}
>
  <slot />
</div>

<script>
  // Script bundlé, exécuté 1 fois, accès via DOM
  document.querySelectorAll('.box').forEach(el => {
    const config = JSON.parse(el.dataset.config);
    console.log('Item:', el.dataset.itemId, config);
  });
</script>
```

**[OFFICIEL]** `define:vars` sur `<script>` implique `is:inline` — éviter pour le bundling.

### Pattern 5 : Wrapper component avec HTMLAttributes complet

```astro
---
// Link.astro — Full HTML attribute forwarding
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"a"> {
  external?: boolean;
}

const { 
  external = false, 
  class: className,
  ...attrs  // href, target, rel, aria-*, data-*, etc.
} = Astro.props;

// Compute external link attributes
const externalAttrs = external 
  ? { target: "_blank", rel: "noopener noreferrer" } 
  : {};
---
<a 
  class:list={["link", { "link--external": external }, className]}
  {...externalAttrs}
  {...attrs}
>
  <slot />
  {external && <span class="sr-only">(nouvelle fenêtre)</span>}
</a>
```

**[OFFICIEL]** `HTMLAttributes<"a">` inclut tous les attributs valides pour `<a>`.

### Pattern 6 : Server Island avec fallback et session

```astro
---
// CartIcon.astro — Server Island for personalized content
// Fichier doit être dans src/components/, pas pages/
export const prerender = false;  // Requis pour sessions

const cart = await Astro.session?.get("cart") || [];
const itemCount = cart.length;
---
<a href="/cart" class="cart-icon">
  🛒 
  {itemCount > 0 && <span class="badge">{itemCount}</span>}
</a>
```

```astro
---
// Page.astro — Usage avec fallback
import CartIcon from "../components/CartIcon.astro";
---
<CartIcon server:defer>
  {/* Fallback affiché pendant chargement */}
  <span slot="fallback" class="cart-icon">🛒</span>
</CartIcon>
```

**[OFFICIEL]** Props passées doivent être sérialisables, < 2KB pour cache GET.

---

## 6. Références pour references/

### Props avancées et generics TypeScript

**Types utilitaires Astro** (`astro/types`) :

- `HTMLAttributes<'element'>` — Tous les attributs HTML natifs pour un élément
- `HTMLTag` — Union de tous les tags HTML valides
- `Polymorphic<{ as: Tag }>` — Type helper pour composants à tag dynamique
- `ComponentProps<typeof Component>` — Extraire les props d'un composant Astro

**Patterns de typage avancés** :

```typescript
// Intersection type pour props custom + attributs natifs
type Props = HTMLAttributes<"div"> & {
  variant: "primary" | "secondary";
};

// Generic contraint pour tags spécifiques
type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
interface Props extends HTMLAttributes<"h1"> {
  as: HeadingTag;
}

// Inférence depuis getStaticPaths
type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
```

**Limitations connues** [DOC-GAP] :

- Generics explicites non supportés (`<Component<string>>` impossible)
- `Polymorphic` peut causer `Astro.props: any` dans cas complexes (#10347)
- `slot` prop conflict avec `HTMLAttributes` (#11072)

**Grep hints** : `interface Props`, `HTMLAttributes`, `Polymorphic`, `ComponentProps`, `InferGetStaticPropsType`

---

### Catalogue complet des directives avec edge cases

|Directive|Cible|Comportement|Edge cases|
|---|---|---|---|
|`define:vars={{ x }}`|`<style>`, `<script>`|Injecte variables CSS/JS|Sur `<script>` → implique `is:inline`|
|`is:global`|`<style>`|Désactive scoping CSS|Peut combiner avec `<style>` scoped|
|`is:inline`|`<script>`, `<style>`|Pas de bundling/processing|Imports relatifs non résolus|
|`is:raw`|Composants|Ignore syntaxe Astro dans children|Pour KaTeX, templates littéraux|
|`set:html`|Éléments|innerHTML non-échappé|**XSS si non sanitisé**, accepte Promise|
|`set:text`|Éléments|innerText échappé|Rarement nécessaire vs `{text}`|
|`class:list`|Éléments|Array/Object → string classes|clsx-powered, falsy ignoré|
|`server:defer`|Composants Astro|Server Island|Props < 2KB, pas de fonctions, pas dans named slots|

**`is:inline` implicite** : Tout attribut non-`src` sur `<script>`/`<style>` (sauf `define:vars` sur `<style>`)

**`define:vars` sur `<script>` — Conséquences** :

- Script inliné dans chaque instance du composant
- Pas de tree-shaking ni minification
- Exécuté N fois si N instances sur la page
- **Alternative** : `data-*` attributes + script global

---

### Patterns de composition multi-niveaux

**Architecture recommandée layouts → pages → composants** :

```
src/
├── layouts/
│   ├── BaseLayout.astro      # HTML shell, <head>, <body>
│   ├── PageLayout.astro      # Extends Base, adds header/footer
│   └── BlogLayout.astro      # Extends Page, adds article wrapper
├── components/
│   ├── ui/                   # Primitifs réutilisables
│   │   ├── Button.astro
│   │   └── Card.astro
│   ├── blocks/               # Sections composites
│   │   └── Hero.astro
│   └── islands/              # Composants hydratés
│       └── SearchModal.tsx
└── pages/
    └── blog/[slug].astro
```

**Slot forwarding chain** :

```
Page → BlogLayout → PageLayout → BaseLayout
       (forward)    (forward)    (define slots)
```

**Grep hints** : `slot=`, `name=`, `Astro.slots.has`, `Astro.slots.render`

---

### Interop détaillée avec frameworks

|Framework|Slot syntax|Children prop|Gotchas|
|---|---|---|---|
|React|`<Component><div slot="x"/></Component>`|`children` prop normal|`client:only` ignore children (#2265)|
|Vue|Idem|`<slot>` Vue interne OK|HMR cause hydration mismatch (#3559)|
|Svelte|Idem|`<slot>` Svelte interne OK|—|
|Solid|Idem|`props.children`|—|
|Preact|Idem|`children`|Nécessite `jsxImportSource` pragma|

**Pattern : Passer slots Astro vers framework**

```astro
<ReactComponent client:load>
  <div slot="header">Rendu par Astro, passé à React</div>
  <p>Contenu default slot → children</p>
</ReactComponent>
```

**Limitations cross-framework** :

- Pas de composant Astro dans composant framework
- `client:only` skip SSR → children Astro non rendus
- Nanostores pour état partagé entre frameworks différents

---

### Cloudflare Workers runtime checklist

**APIs Node.js compatibles** (avec `nodejs_compat` flag) :

- ✅ `node:buffer`, `node:crypto`, `node:path`, `node:url`, `node:util`
- ✅ `node:stream`, `node:events`, `node:timers`, `node:assert`
- ✅ `node:fs` (virtuel), `node:http`, `node:https`, `node:zlib`
- ✅ `AsyncLocalStorage`
- ❌ `child_process`, `cluster`, `dgram`, `http2`, `vm`, `repl`

**Configuration wrangler.jsonc requise** :

```jsonc
{
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true }
}
```

**Différences dev/prod à surveiller** :

- KV : consistance immédiate (dev) vs éventuelle ~60s (prod)
- Bindings : émulés (dev) vs réels (prod)
- Variables env : `.dev.vars` (dev) vs Dashboard secrets (prod)

---

## 7. Sources consultées

### Documentation officielle Astro [OFFICIEL]

|URL|Contenu|Version confirmée|
|---|---|---|
|docs.astro.build/en/basics/astro-components/|Props, slots, composition|Astro 5.x|
|docs.astro.build/en/reference/directives-reference/|Toutes directives template|Astro 5.x|
|docs.astro.build/en/guides/typescript/|Types, HTMLAttributes, Polymorphic|Astro 5.x|
|docs.astro.build/en/reference/api-reference/|Astro.slots, Astro.props, Astro.self|Astro 5.x|
|docs.astro.build/en/guides/server-islands/|server:defer, props, fallback|Astro 5.0+|
|docs.astro.build/en/guides/actions/|Astro.callAction, form handling|Astro 4.15+ stable 5.0|
|docs.astro.build/en/guides/integrations-guide/cloudflare/|Adapter config, limitations|@astrojs/cloudflare 12.x|
|astro.build/blog/|Release notes Astro 5.x|2024-2025|

### Documentation Cloudflare [OFFICIEL]

|URL|Contenu|
|---|---|
|developers.cloudflare.com/workers/runtime-apis/nodejs/|APIs Node.js supportées|
|developers.cloudflare.com/pages/framework-guides/astro/|Guide déploiement Astro|

### GitHub Issues pertinentes [COMMUNAUTAIRE]

|Issue|Sujet|Statut|
|---|---|---|
|#13969|Server Islands dans named slots|Bug confirmé|
|#10347|Polymorphic + generics → Astro.props: any|Discussion ouverte|
|#11920|Props spread order override|Comportement documenté|
|#11072|slot prop conflict HTMLAttributes|Workaround disponible|
|#7747, #7942|class:list composition issues|Partiellement résolu 3.0+|

### Ressources communautaires [COMMUNAUTAIRE]

|Source|Contenu|Fiabilité|
|---|---|---|
|CSS-Tricks|Polymorphic components TypeScript|Haute|
|eslint-plugin-astro|Règle `no-set-html-directive`|Haute|
|@nanostores|State management cross-framework|Haute (286 bytes)|
|GitHub Security Advisories|CVE-2024-47885 ViewTransitions|Critique|

### Versions confirmées

- **Astro** : 5.0 → 5.17+ (patterns validés)
- **@astrojs/cloudflare** : 12.x
- **TypeScript** : 5.x avec `strict: true` recommandé
- **Wrangler** : 3.x avec `nodejs_compat` flag

---

**Marqueurs de confiance utilisés** :

- **[OFFICIEL]** : Documentation Astro/Cloudflare, code source vérifié
- **[COMMUNAUTAIRE]** : Retours validés GitHub issues, blogs techniques réputés
- **[INFÉRÉ]** : Synthèse logique sans source directe explicite
- **[DOC-GAP]** : Fonctionnalité existante, documentation insuffisante