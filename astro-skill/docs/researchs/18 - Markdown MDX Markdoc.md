# Configuration Markdown/MDX/Markdoc optimale pour Astro 5.17+ sur Cloudflare

Le traitement Markdown/MDX dans Astro s'effectue **exclusivement au build-time**, ce qui garantit une compatibilité totale avec Cloudflare Workers. Les plugins remark/rehype ne s'exécutent jamais dans le runtime Workers, éliminant les problèmes de compatibilité Node.js à l'exécution.

---

## 1. Quick Reference (règles impératives pour SKILL.md)

|#|Règle|Source|Confiance|
|---|---|---|---|
|1|**Utiliser `syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'math'] }`** pour exclure les langages traités par des outils externes (Astro 5.5.0+)|[OFFICIEL]|Haute|
|2|**Configurer `shikiConfig.themes` avec `defaultColor: false`** pour le dark mode CSS-driven, puis cibler `.astro-code` (pas `.shiki`) dans le CSS|[OFFICIEL]|Haute|
|3|**Ne jamais dupliquer les plugins** entre `markdown.remarkPlugins` et `mdx({ remarkPlugins })` — configurer dans `markdown.*` uniquement, MDX hérite automatiquement|[OFFICIEL]|Haute|
|4|**Importer `rehypeHeadingIds` de `@astrojs/markdown-remark`** si un plugin rehype custom nécessite les IDs avant son exécution (sinon Astro les injecte après vos plugins)|[OFFICIEL]|Haute|
|5|**Activer `mdx({ optimize: true })`** uniquement pour les projets avec >50 fichiers MDX et vérifier que les composants interactifs fonctionnent encore|[OFFICIEL]|Moyenne|
|6|**Préférer Markdoc à MDX** pour le contenu auteur avec composants custom limités — meilleure sécurité par défaut et parsing plus prévisible|[OFFICIEL]|Haute|
|7|**Utiliser `export const prerender = true`** sur toutes les pages de contenu (blog, docs) avec Cloudflare — le SSR n'apporte rien pour du contenu statique|[OFFICIEL]|Haute|
|8|**Accéder au frontmatter dans les plugins remark** via `file.data.astro.frontmatter`, pas `file.data.matter`|[OFFICIEL]|Haute|
|9|**Utiliser le format nested array** `[plugin, { options }]` pour les options de plugins remark/rehype dans Astro config|[OFFICIEL]|Haute|
|10|**Éviter les commentaires HTML `<!-- -->`** dans les fichiers MDX — utiliser `{/* commentaire */}` (syntaxe JSX)|[OFFICIEL]|Haute|
|11|**Fermer les balises self-closing** avec `/>`dans MDX : `<br />`, `<img />`, `<hr />` (pas `<br>`)|[OFFICIEL]|Haute|
|12|**Supprimer `.astro/data-store.json`** après modification de `shikiConfig` pour forcer la régénération du cache Content Collections|[COMMUNAUTAIRE]|Haute|
|13|**Échapper les accolades** dans le Markdown standard avec `\{` ou convertir en `.mdx` si expressions JSX requises|[OFFICIEL]|Haute|
|14|**Exécuter `astro sync`** manuellement si les types Content Collections ne sont pas générés en dev (issue connue Astro 5.x)|[COMMUNAUTAIRE]|Moyenne|
|15|**Activer `nodejs_compat`** dans wrangler.jsonc avec `compatibility_date: "2024-09-23"+` pour les dépendances transitives utilisant Node.js APIs|[OFFICIEL]|Haute|

---

## 2. Decision Matrix

|Situation|Approche Astro 5.17+|Raison|Confiance|
|---|---|---|---|
|Syntax highlighting|**Shiki** (défaut)|Zero JS client, précision VS Code-level, themes duaux natifs|Haute [OFFICIEL]|
|Shiki vs Prism|Shiki sauf projet legacy avec thèmes Prism custom|Prism déprécié dans Astro, Shiki est le défaut depuis v3|Haute [OFFICIEL]|
|`syntaxHighlight: false`|Activer quand mermaid/math rendering externe ou highlighting custom|`excludeLangs` préféré pour cas partiels (Astro 5.5+)|Haute [OFFICIEL]|
|MDX vs Markdoc|**MDX** pour interactivité JSX native, **Markdoc** pour contenu auteur sécurisé|Markdoc bloque HTML/JS par défaut, MDX permet imports directs|Haute [OFFICIEL]|
|MDX vs Markdown pur|MDX si composants custom, sinon `.md` suffit|Les fichiers `.md` supportent `<Component />` mais pas les imports|Moyenne [OFFICIEL]|
|`<Code />` vs code fences|**Code fences** pour contenu statique, **`<Code />`** pour code dynamique (props, API)|`<Code />` n'hérite pas de `shikiConfig`, requiert config explicite|Haute [OFFICIEL]|
|`optimize: true` MDX|Activer pour projets avec nombreux fichiers MDX et builds lents|Risque de HTML non-échappé, tester les composants interactifs|Moyenne [OFFICIEL]|
|`optimize.ignoreElementNames`|Utiliser quand composants custom passés dynamiquement à `<Content components={} />`|L'optimiseur détecte auto les exports `components` dans MDX|Basse [OFFICIEL]|
|Plugin remark custom vs existant|**Existant** si maintenu (>1K DL/semaine) et sans Node.js APIs bloquantes|Plugins custom = maintenance additionnelle|Moyenne [INFÉRÉ]|
|SSG vs SSR pour contenu|**SSG** (prerender) pour tout contenu Markdown/MDX sur Cloudflare|Remark/rehype s'exécutent au build, aucun bénéfice SSR|Haute [OFFICIEL]|
|Hybrid mode|`output: 'hybrid'` avec `prerender: true` sur pages contenu|APIs dynamiques + contenu statique optimisé|Haute [OFFICIEL]|
|Content Layer loader|`glob()` pour fichiers locaux, `file()` pour JSON/YAML|`glob({ pattern: "**/*.{md,mdx}", base: "./src/content" })`|Haute [OFFICIEL]|

---

## 3. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|`syntaxHighlight: 'shiki'` comme string simple quand `excludeLangs` nécessaire|`syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] }`|Mermaid code blocks cassés par Shiki|[OFFICIEL] Astro 5.5+|
|Configurer `remarkPlugins` dans markdown ET mdx|Configurer uniquement dans `markdown.*`, MDX hérite avec `extendMarkdownConfig: true`|Plugins exécutés 2x, performances dégradées|[OFFICIEL]|
|`extendMarkdownConfig: true` avec plugins différents pour MDX|`extendMarkdownConfig: false` + config MDX complète explicite|Comportement merge imprévisible (MDX remplace, ne fusionne pas)|[OFFICIEL]|
|Commentaires HTML `<!-- -->` dans MDX|`{/* commentaire JSX */}`|Erreur parsing : "Unexpected character !"|[OFFICIEL]|
|Balises HTML non-fermées dans MDX `<br>`, `<img src="">`|`<br />`, `<img src="" />`|Erreur : "Expected a closing tag"|[OFFICIEL]|
|Accolades non-échappées dans `.md` `prix: {variable}`|Échapper `\{variable\}` ou convertir en `.mdx`|Erreur : "NoMatchingRenderer"|[OFFICIEL]|
|`rehypeAutolinkHeadings` sans `rehypeHeadingIds` avant|Importer et placer `rehypeHeadingIds` en premier dans le tableau|Links non générés (IDs injectés après par défaut)|[OFFICIEL]|
|Utiliser `file.data.matter` dans plugin remark|`file.data.astro.frontmatter`|Frontmatter non accessible, undefined errors|[OFFICIEL]|
|Modifier `shikiConfig.theme` sans clear cache|Supprimer `.astro/data-store.json` après modification|Thème inchangé en dev (cache Content Collections)|[COMMUNAUTAIRE] #12700|
|CSS ciblant `.shiki` pour styling code|Cibler `.astro-code` (classe Astro spécifique)|Styles non appliqués|[OFFICIEL]|
|`<Code />` attendant héritage de `shikiConfig`|Passer `theme`/`themes`/`transformers` explicitement à `<Code />`|Highlighting avec mauvais thème|[OFFICIEL]|
|Plugin remark utilisant `fs.readFileSync` en SSR Cloudflare|Déplacer la logique FS au build-time ou utiliser fetch|Erreur runtime Workers (fs non dispo)|[OFFICIEL] CF|
|`entry.slug` dans Astro 5.x|`entry.id` (renommé dans Content Layer API)|Erreur TypeScript, undefined|[OFFICIEL] Breaking Change|
|`entry.render()` dans Astro 5.x|`import { render } from 'astro:content'; render(entry)`|Méthode non existante sur entry|[OFFICIEL] Breaking Change|
|`compiledContent()` synchrone|`await entry.compiledContent()` (async depuis Astro 5.0)|Promise non résolue|[OFFICIEL] Breaking Change|

---

## 4. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|`Expected ";" but found ":"` dans fichier MDX|`@astrojs/mdx` non installé/configuré|`npx astro add mdx` + vérifier `integrations: [mdx()]`|[OFFICIEL] #5658|
|`Unexpected character ! (U+0021) before name`|Commentaire HTML `<!--` dans MDX|Remplacer par `{/* */}`|[OFFICIEL] #11707|
|`Expected a closing tag for <br>`|Balise self-closing sans `/`|Utiliser `<br />`, `<img />`, `<hr />`|[OFFICIEL] #3458|
|`NoMatchingRenderer: Unable to render 'Content'`|Accolades `{}` dans fichier `.md` interprétées comme JSX|Échapper `\{` ou renommer en `.mdx`|[OFFICIEL] #6226|
|Thème Shiki non appliqué|Config imbriquée incorrectement ou cache|Vérifier structure `shikiConfig.theme`, supprimer `.astro/data-store.json`|[COMMUNAUTAIRE] #12700|
|Dual theme ne switch pas|`defaultColor` non défini à `false`|Ajouter `defaultColor: false` + CSS media query|[OFFICIEL] #11406|
|Langage code non reconnu|Langage non bundlé par Shiki|Ajouter à `shikiConfig.langs` ou utiliser `langAlias`|[OFFICIEL]|
|Plugin remark reading-time retourne valeur gonflée|Shiki préprocesse avant les plugins (Astro 2.0+)|Désactiver `syntaxHighlight` ou ignorer, corrigé en Astro 4.x|[COMMUNAUTAIRE] #6079|
|Frontmatter properties manquantes dans entry.data|Astro 5.x filtre les champs non déclarés dans schema|Ajouter au schema ou utiliser `z.passthrough()`|[OFFICIEL] #12404|
|Types Content Collections `unknown[]`|Dossier collection vide ou inexistant|Créer au moins un fichier valide dans le dossier|[COMMUNAUTAIRE] #8999|
|`Cannot find module 'astro:content'`|Types non générés|Exécuter `npx astro sync`|[OFFICIEL] #9197|
|Erreur YAML `end of the stream expected`|Syntaxe YAML invalide dans frontmatter|Vérifier colons non-quotés, caractères spéciaux|[OFFICIEL] #9197|
|`draft: true` non respecté|Pas de filtrage automatique dans Astro 5.x|Filtrer manuellement : `getCollection("posts", ({data}) => !data.draft)`|[COMMUNAUTAIRE] #6400|
|`Could not resolve "node:fs/promises"` (CF build)|Package avec dépendance Node.js sans `nodejs_compat`|Activer `nodejs_compat` dans wrangler.jsonc|[OFFICIEL] #6535|
|`z.default()` non appliqué dans frontmatter MDX|Bug connu Astro 5.x|Gérer les defaults dans le template, pas le schema|[COMMUNAUTAIRE] #12057|
|Composant `<Code />` échoue en dev avec CF adapter|Issue debug package + CF adapter|Fonctionne en production, ignorer en dev|[COMMUNAUTAIRE] #15284|

---

## 5. Code Patterns

### astro.config.mjs — Configuration complète recommandée

```javascript
// astro.config.mjs — Astro 5.17+ / Cloudflare Pages
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs';

export default defineConfig({
  output: 'hybrid', // SSG par défaut, SSR opt-in
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [mdx()], // Hérite de markdown.*, pas de config ici

  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'], // Pas de highlighting pour mermaid
    },
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false, // CSS-driven switching
      wrap: true,
      transformers: [], // Ajouter @shikijs/transformers si besoin
    },
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      rehypeHeadingIds, // Avant autolink pour garantir les IDs
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
});
```

### Plugin remark custom — Reading time

```javascript
// src/plugins/remark-reading-time.mjs
import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
  return function (tree, file) {
    // Accès frontmatter via file.data.astro.frontmatter (API Astro)
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    file.data.astro.frontmatter.minutesRead = readingTime.text;
  };
}
// Accès: const { remarkPluginFrontmatter } = await render(entry);
// Usage: remarkPluginFrontmatter.minutesRead → "3 min read"
```

### MDX custom component mapping

```astro
---
// src/pages/blog/[...slug].astro
import { getEntry, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Heading from '../../components/Heading.astro';
import Blockquote from '../../components/Blockquote.astro';
import Image from '../../components/Image.astro';
import Link from '../../components/Link.astro';

export const prerender = true; // SSG pour Cloudflare

const { slug } = Astro.params;
const entry = await getEntry('blog', slug);
if (!entry) return Astro.redirect('/404');

const { Content, headings, remarkPluginFrontmatter } = await render(entry);
---
<BaseLayout title={entry.data.title}>
  <article>
    <Content components={{
      h2: Heading,        // Override H2 natifs
      blockquote: Blockquote,
      img: Image,         // Optimisation images custom
      a: Link,            // External link handling
    }} />
  </article>
</BaseLayout>
```

### Composant Astro pour override (exemple Blockquote)

```astro
---
// src/components/Blockquote.astro
interface Props {
  class?: string;
}
const { class: className, ...rest } = Astro.props;
---
<blockquote 
  class:list={["border-l-4 border-blue-500 pl-4 my-4 italic", className]} 
  {...rest}
>
  <slot /> <!-- REQUIS pour injecter le contenu enfant -->
</blockquote>
```

### CSS Shiki dual theme switching

```css
/* src/styles/code.css — Cibler .astro-code, pas .shiki */

/* Theme switching via prefers-color-scheme */
@media (prefers-color-scheme: dark) {
  .astro-code,
  .astro-code span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
  }
}

/* OU via classe sur html (si toggle manuel) */
html.dark .astro-code,
html.dark .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}

/* Style de base */
.astro-code {
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}
```

### Content Collection schema pour MDX typé

```typescript
// src/content.config.ts — Astro 5.x Content Layer API
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string().max(60),
    description: z.string().max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Admin'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    cover: image().optional(), // Validation image locale
  }),
});

export const collections = { blog };
```

### Composant `<Code />` vs code fence

```astro
---
// Quand utiliser <Code /> vs ```code fence```
import { Code } from 'astro:components';

// Cas 1: Code dynamique (props, API, computed)
const dynamicCode = await fetchCodeSnippet();

// Cas 2: Code fence dans Markdown/MDX — préférer pour contenu statique
// ```javascript
// const foo = 'bar';
// ```
---

<!-- <Code /> pour code dynamique uniquement -->
<Code 
  code={dynamicCode}
  lang="typescript"
  theme="github-dark"
  wrap
/>

<!-- <Code /> inline (v4.14+) -->
<p>
  La variable <Code code="const x = 42" lang="js" inline /> est définie.
</p>

<!-- NOTE: <Code /> N'HÉRITE PAS de shikiConfig !
     Passer theme/themes explicitement -->
```

### Configuration Markdoc — Custom tags

```javascript
// markdoc.config.mjs — Alternative à MDX
import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  tags: {
    callout: {
      render: component('./src/components/Callout.astro'),
      attributes: {
        type: { type: String, default: 'note' }, // 'note' | 'warning' | 'tip'
        title: { type: String },
      },
    },
    youtube: {
      render: component('./src/components/YouTube.astro'),
      attributes: {
        id: { type: String, required: true },
      },
    },
  },
  nodes: {
    // Override blockquote natif
    blockquote: {
      render: component('./src/components/Blockquote.astro'),
    },
  },
});

// Usage dans fichier .mdoc:
// {% callout type="warning" title="Attention" %}
// Contenu du callout
// {% /callout %}
```

### wrangler.jsonc — Configuration Cloudflare

```jsonc
// wrangler.jsonc — Cloudflare Workers/Pages
{
  "name": "mon-site-astro",
  "main": "dist/_worker.js/index.js",
  "compatibility_date": "2025-01-15",
  "compatibility_flags": ["nodejs_compat"], // Requis si deps avec Node.js APIs
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  }
}
```

---

## 6. Références pour references/

### Plugins remark recommandés

|Plugin|Usage|Étoiles|Cloudflare Safe|
|---|---|---|---|
|`remark-gfm`|Tables, strikethrough, tasklists (inclus par défaut Astro)|~1K|✅ Build-time|
|`remark-smartypants`|Typographie intelligente (inclus par défaut Astro)|~50|✅ Build-time|
|`remark-toc`|Génération TOC automatique depuis heading `## Contents`|~476|✅ Build-time|
|`remark-directive`|Syntaxe `:directive[content]{attrs}` pour composants|~200|✅ Build-time|
|`remark-unwrap-images`|Retire les `<p>` autour des images|~50|✅ Build-time|
|`remark-oembed`|Embeds automatiques (YouTube, Twitter)|~100|⚠️ Fetch au build|

### Plugins rehype recommandés

|Plugin|Usage|Étoiles|Cloudflare Safe|
|---|---|---|---|
|`@astrojs/markdown-remark` → `rehypeHeadingIds`|IDs sur headings (intégré Astro)|—|✅ Build-time|
|`rehype-slug`|Alternative à rehypeHeadingIds (github-slugger)|~400|✅ Build-time|
|`rehype-autolink-headings`|Liens ancres sur headings|~216|✅ Build-time|
|`rehype-external-links`|`rel="noopener"` + `target="_blank"` sur liens externes|~120|✅ Build-time|
|`rehype-pretty-code`|Alternative Shiki avec plus de features|~500|✅ Build-time|
|`rehype-accessible-emojis`|ARIA labels sur emojis|~50|✅ Build-time|

### Transformers Shiki (@shikijs/transformers)

```javascript
// Installation: npm i -D @shikijs/transformers
import {
  transformerNotationDiff,       // // [!code ++] / [!code --]
  transformerNotationHighlight,  // // [!code highlight]
  transformerNotationFocus,      // // [!code focus]
  transformerNotationErrorLevel, // // [!code error] / [!code warning]
  transformerMetaHighlight,      // ```js {1,3-4}
} from '@shikijs/transformers';

// CSS requis pour les classes générées:
// .line.diff.add { background: rgba(0,255,0,0.1); }
// .line.diff.remove { background: rgba(255,0,0,0.1); }
// .line.highlighted { background: rgba(255,255,0,0.2); }
// pre.has-focused .line:not(.focused) { opacity: 0.4; filter: blur(1px); }
```

### grep hints pour recherche dans la codebase

```bash
# Trouver config shiki
grep -r "shikiConfig" astro.config.*

# Trouver plugins remark/rehype
grep -r "remarkPlugins\|rehypePlugins" astro.config.*

# Trouver composants MDX custom
grep -r "components={{" src/

# Trouver imports MDX dans pages
grep -r "from 'astro:content'" src/pages/

# Trouver frontmatter access dans plugins
grep -r "file.data.astro.frontmatter" src/plugins/

# Trouver prerender exports
grep -r "export const prerender" src/
```

---

## 7. Sources consultées

### Documentation officielle [Haute confiance]

|Source|URL|Vérifié|
|---|---|---|
|Astro Configuration Reference|docs.astro.build/en/reference/configuration-reference/|Fév 2026|
|Astro Markdown & MDX Guide|docs.astro.build/en/guides/markdown-content/|Fév 2026|
|Astro Content Collections|docs.astro.build/en/guides/content-collections/|Fév 2026|
|@astrojs/mdx Integration|docs.astro.build/en/guides/integrations-guide/mdx/|Fév 2026|
|@astrojs/markdoc Integration|docs.astro.build/en/guides/integrations-guide/markdoc/|Fév 2026|
|@astrojs/cloudflare Adapter|docs.astro.build/en/guides/integrations-guide/cloudflare/|Fév 2026|
|Astro v5 Upgrade Guide|docs.astro.build/en/guides/upgrade-to/v5/|Fév 2026|
|Shiki Documentation|shiki.style|Fév 2026|
|Cloudflare Workers Node.js Compat|developers.cloudflare.com/workers/runtime-apis/nodejs/|Fév 2026|

### GitHub Issues référencées [Moyenne confiance]

|Issue|Sujet|Status|
|---|---|---|
|#5658|MDX parsing sans integration|Closed|
|#6079|Plugin order avec Shiki|Closed|
|#6535|Cloudflare + MDX Node.js errors|Closed|
|#11406|Dual theme switching|Open|
|#12404|Schema filtre frontmatter Astro 5|Design|
|#12700|shikiConfig cache Content Collections|Open|
|#14238|Types non générés en dev|Open|
|#15284|`<Code />` + CF adapter dev|Open|

### Versions confirmées compatibles

|Package|Version testée|Notes|
|---|---|---|
|`astro`|5.17.x|Content Layer API stable|
|`@astrojs/mdx`|4.3.x|JSX handling depuis 4.0.0|
|`@astrojs/markdoc`|0.15.x|Stable|
|`@astrojs/cloudflare`|12.x|Workers runtime par défaut|
|`shiki`|1.x|Bundled avec Astro|
|`@shikijs/transformers`|1.x|Compatible Astro 5.x|

---

## Points clés pour le SKILL.md final

1. **Build-time only** : Tout le traitement Markdown/MDX est au build, jamais dans Workers runtime
2. **Astro 5.x breaking changes** : `entry.id` (pas `slug`), `render(entry)` (pas `entry.render()`), `await compiledContent()`
3. **MDX hérite de markdown.*** : Configurer plugins dans `markdown.remarkPlugins` uniquement
4. **`extendMarkdownConfig` piège** : MDX remplace les plugins, ne les fusionne pas
5. **Shiki `defaultColor: false`** : Requis pour CSS-driven dark mode
6. **`.astro-code`** : Classe CSS Astro (pas `.shiki`)
7. **`rehypeHeadingIds`** : Importer explicitement si plugin dépendant avant
8. **Cloudflare prerender** : Toujours `export const prerender = true` pour contenu
9. **Cache invalidation** : Supprimer `.astro/data-store.json` après config Shiki changes
10. **`nodejs_compat`** : Activer dans wrangler.jsonc si dépendances transitives Node.js