# Styling Astro 5.17+ sur Cloudflare Pages/Workers

**Tailwind v4 avec le plugin Vite remplace désormais l'intégration `@astrojs/tailwind`.** L'API expérimentale Fonts (stable en v6) permet le self-hosting automatique des polices. Les styles scopés utilisent par défaut des attributs `data-astro-cid-*` avec +1 de spécificité. Les CSS-in-JS runtime (styled-components, Emotion) sont incompatibles avec le streaming SSR sur Cloudflare Workers — privilégier les solutions zero-runtime comme Panda CSS ou Vanilla Extract.

Ce guide couvre les patterns de styling validés en production pour Astro 5.17+ déployé via `@astrojs/cloudflare`, incluant les conventions pour Server Islands, View Transitions, et modes de rendu hybrides.

---

## 1. Quick Reference pour SKILL.md

### Règles impératives — Styling Astro 5.17+ / Cloudflare

1. **Utiliser `@tailwindcss/vite` pour Tailwind v4** au lieu de `@astrojs/tailwind` (déprécié) — intégration native depuis Astro 5.2 [OFFICIEL]
    
2. **Ajouter `@reference` dans les `<style>` pour `@apply`** en Tailwind v4 — les blocs style n'ont plus accès aux variables du thème par défaut [OFFICIEL]
    
3. **Importer les global.css dans le Layout en premier** — garantit la plus basse précédence pour la cascade [OFFICIEL]
    
4. **Passer `class` ET `{...rest}` aux composants enfants** pour le styling parent→enfant avec `scopedStyleStrategy: 'attribute'` [OFFICIEL]
    
5. **Utiliser `:global()` plutôt que `is:global`** pour mixer styles scopés et globaux dans le même bloc [OFFICIEL]
    
6. **Éviter CSS-in-JS runtime pour SSR Cloudflare** — styled-components/Emotion causent FOUC et erreurs de build [COMMUNAUTAIRE]
    
7. **Configurer `/_astro/*` avec `Cache-Control: immutable`** dans `public/_headers` — assets fingerprinted par Astro [OFFICIEL]
    
8. **Renommer `--astro-code-color-text/background`** en `--astro-code-foreground/background` — breaking change Astro 5.0 [OFFICIEL]
    
9. **Préférer `experimental.fonts` avec `fontProviders.google()`** pour self-hosting automatique — conforme RGPD, optimisé CWV [OFFICIEL]
    
10. **Ne jamais placer les fonts dans `public/`** — stocker dans `src/assets/fonts/` pour éviter la duplication au build [OFFICIEL]
    
11. **Utiliser `build.inlineStylesheets: 'auto'`** (défaut) — inline <4kB, externe sinon — optimal pour Cloudflare [OFFICIEL]
    
12. **Installer le préprocesseur comme dépendance** (`npm install sass`) — support natif via Vite sans config [OFFICIEL]
    
13. **Exclure `/_astro/*` du routing Worker** via `routes.extend.exclude` — sert les assets depuis le CDN [OFFICIEL]
    
14. **Désactiver Auto Minify Cloudflare** dans le dashboard — peut causer des mismatches d'hydratation [OFFICIEL]
    
15. **Utiliser `scopedStyleStrategy: 'where'`** pour un contrôle total de la spécificité (0 ajouté) [OFFICIEL]
    

---

## 2. Decision Matrix

|Situation Styling|Approche Astro 5.17+|Raison|Confiance|
|---|---|---|---|
|Style dynamique dans island React|CSS Modules (`.module.css`) ou classes Tailwind inline|Compatibilité SSR Cloudflare, pas de runtime JS|Élevé [OFFICIEL]|
|Tailwind avec `@apply` dans composant|`@reference "../styles/global.css"` en haut du `<style>`|v4 n'expose plus les variables dans les style blocks|Élevé [OFFICIEL]|
|Global styles (reset, typography)|Import dans Layout.astro avant autres imports|Garantit précédence minimale dans la cascade|Élevé [OFFICIEL]|
|Styling enfant depuis parent|Passer `class` prop + `{...rest}` pour data-astro-cid|Permet cascade scopée parent→enfant|Élevé [OFFICIEL]|
|Dark mode code blocks|`shikiConfig.themes: { light, dark }` + CSS media query|Support natif dual themes Shiki|Élevé [OFFICIEL]|
|Polices Google optimisées|`experimental.fonts` + `fontProviders.google()`|Self-hosting auto, preload granulaire, conforme RGPD|Moyen [OFFICIEL - Experimental]|
|CSS critique inline|`build.inlineStylesheets: 'always'`|Élimine requête bloquante pour FCP/LCP|Élevé [OFFICIEL]|
|Styling Server Islands|Styles scopés normaux dans le composant|Pas de FOUC — shell CSS chargé avant swap HTML|Moyen [INFÉRÉ]|
|Variables CSS dynamiques|`define:vars={{ color }}` + `var(--color)`|Passage frontmatter→CSS sans JS runtime|Élevé [OFFICIEL]|
|Préprocesseur Sass/SCSS|`<style lang="scss">` + `npm install sass`|Support natif Vite, aucune config requise|Élevé [OFFICIEL]|
|CSS-in-JS typesafe|Vanilla Extract + `@vanilla-extract/vite-plugin`|Zero-runtime, compatible SSR Cloudflare|Moyen [COMMUNAUTAIRE]|
|Caching fonts Cloudflare|`/_astro/fonts/*` + `max-age=31536000, immutable`|Assets fingerprinted, cache agressif safe|Élevé [OFFICIEL]|
|Tailwind v3 legacy project|`@astrojs/tailwind` avec `applyBaseStyles: false`|Toujours supporté pour migration progressive|Élevé [OFFICIEL]|
|Override global depuis composant|`scopedStyleStrategy: 'class'`|Augmente spécificité (+1) pour override fiable|Élevé [OFFICIEL]|
|Style composant framework Vue|`<style scoped lang="scss">` + `@reference` pour Tailwind|Scoping natif Vue + accès thème Tailwind v4|Moyen [COMMUNAUTAIRE]|

---

## 3. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|`styled-components` pour SSR Cloudflare|CSS Modules, Tailwind, Panda CSS|FOUC, erreurs build, incompatible streaming|[COMMUNAUTAIRE] GitHub #4432|
|Fonts dans `public/fonts/`|`src/assets/fonts/` + experimental.fonts|Duplication fichiers au build|[OFFICIEL] docs.astro.build|
|`@tailwindcss/tailwind` pour Tailwind v4|`@tailwindcss/vite` dans config Vite|Intégration dépréciée, manque features v4|[OFFICIEL] Astro 5.2 release|
|`@apply` sans `@reference` en v4|Ajouter `@reference "../../styles/global.css"`|Classes non résolues, styles manquants|[OFFICIEL] Tailwind upgrade guide|
|CSS Custom Rules sur Cloudflare Pages|Défauts + `_headers` file uniquement|Assets périmés après déploiement|[OFFICIEL] developers.cloudflare.com|
|`<link rel="stylesheet">` pour CSS local|Import frontmatter `import './style.css'`|Passe à côté du bundling/minification|[OFFICIEL] docs.astro.build|
|`--astro-code-color-text` (ancien nom)|`--astro-code-foreground`|Breaking change v5.0, styles ignorés|[OFFICIEL] Upgrade guide v5|
|Import CSS dans composant jamais utilisé|Garder imports dans les composants réellement rendus|CSS "leak" — styles appliqués même sans usage|[OFFICIEL] docs.astro.build|
|`is:global` pour un seul sélecteur|`:global(.selector)` dans style scopé|Précision chirurgicale vs pollution globale|[OFFICIEL] docs.astro.build|
|Préprocesseur + Tailwind v4|CSS natif avec Tailwind v4 (incompatible Sass)|Erreurs de build, syntaxe non supportée|[OFFICIEL] Tailwind v4 docs|
|Cache-Control custom pour `/_astro/*`|`immutable` + dépendance fingerprinting Astro|Hash change = nouvelle URL, invalidation auto|[OFFICIEL] Cloudflare docs|
|`client:only` composants avec Tailwind|Safelist classes OU dupliquer dans fichier non-client:only|Classes purgées du build production|[COMMUNAUTAIRE] GitHub #13139|
|PostCSS `postcss-import` avec Tailwind v4|Retirer — inclus automatiquement dans @tailwindcss/vite|Conflits, double processing|[OFFICIEL] Tailwind upgrade guide|
|`export const partial = true` + styles scopés|Styles inline ou retirer scoped (stripped en partial)|Styles complètement ignorés|[OFFICIEL] docs.astro.build|

---

## 4. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|Styles scopés n'affectent pas l'enfant|`data-astro-cid-*` non propagé|Passer `{...rest}` au composant enfant|[OFFICIEL] docs.astro.build|
|`@apply` ne résout pas les classes Tailwind v4|Style blocks isolés du thème|Ajouter `@reference "../global.css"`|[OFFICIEL] Tailwind docs|
|FOUC (Flash of Unstyled Content)|CSS-in-JS runtime en SSR|Migrer vers zero-runtime (Panda, Vanilla Extract)|[COMMUNAUTAIRE]|
|`styled.div is not a function`|styled-components incompatible SSR|`client:only="react"` ou migrer styling|[COMMUNAUTAIRE] GitHub|
|Grid/Flex enfants `astro-island` ne fonctionnent pas|`display: contents` sur les islands|`.Grid > astro-island > .Component`|[COMMUNAUTAIRE] zellwk.com|
|Styles globaux override les scopés|Spécificité insuffisante|`scopedStyleStrategy: 'class'` ou augmenter sélecteur|[OFFICIEL] config reference|
|CSS inline au lieu de fichier externe|Taille <4kB (défaut `auto`)|`build.inlineStylesheets: 'never'`|[OFFICIEL] docs.astro.build|
|Fonts non préchargées|Pas de directive preload|`<Font cssVariable="--font" preload />`|[OFFICIEL] experimental fonts|
|Code highlighting sans couleurs|Variables Shiki v4→v5 renommées|Renommer `--astro-code-color-*` → `--astro-code-*`|[OFFICIEL] Upgrade v5|
|CSS assets périmés après deploy|Cache Rules custom Cloudflare|Utiliser uniquement `_headers` file|[OFFICIEL] Cloudflare docs|
|Tailwind classes manquantes en prod|`client:only` purge les classes non détectées|Safelist ou utiliser classes ailleurs|[COMMUNAUTAIRE] GitHub #13139|
|Hydration mismatch erreurs|Auto Minify Cloudflare activé|Désactiver dans dashboard Cloudflare|[OFFICIEL] deploy guide|
|PostCSS plugins custom ignorés|Conflit avec @astrojs/tailwind|Retirer intégration, utiliser postcss.config.cjs|[COMMUNAUTAIRE] GitHub|
|Dark mode code blocks ne switchent pas|CSS selector incorrect pour dual themes|`.dark .astro-code span { color: var(--shiki-dark) }`|[OFFICIEL] Shiki docs|
|Préprocesseur non reconnu|Dépendance manquante|`npm install sass` / `less` / `stylus`|[OFFICIEL] docs.astro.build|

---

## 5. Code Patterns

### Pattern 1: Scoped style avec passage parent → enfant

```astro
---
// src/components/Button.astro
// Accepter class ET propager data-astro-cid-* pour styling parent
const { class: className, ...rest } = Astro.props;
---
<button class:list={["btn", className]} {...rest}>
  <slot />
</button>

<style>
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
  }
</style>
```

```astro
---
// src/pages/index.astro — Parent peut styler l'enfant
import Button from '../components/Button.astro';
---
<Button class="primary">Click me</Button>

<style>
  /* Fonctionne car data-astro-cid propagé via ...rest */
  .primary {
    background: var(--color-brand);
    color: white;
  }
</style>
```

### Pattern 2: Tailwind v4 config optimale Astro/Cloudflare

```javascript
// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "hybrid",
  adapter: cloudflare({
    routes: {
      extend: { exclude: [{ pattern: "/_astro/*" }] }
    }
  }),
  vite: {
    plugins: [tailwindcss()]
  },
  build: {
    inlineStylesheets: "auto" // <4kB inline, sinon externe
  }
});
```

```css
/* src/styles/global.css — Tailwind v4 CSS-first config */
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.72 0.12 260);
  --font-sans: "Inter", system-ui, sans-serif;
}

/* Plugins (optionnel) */
@plugin "@tailwindcss/typography";
```

```astro
---
// src/components/Card.astro — @apply avec @reference
---
<div class="card"><slot /></div>

<style>
  @reference "../../styles/global.css";
  
  .card {
    @apply p-4 rounded-lg bg-white shadow-md;
  }
</style>
```

### Pattern 3: Font loading self-hosted avec preload

```javascript
// astro.config.mjs
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  experimental: {
    fonts: [{
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-inter",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      display: "swap",
      fallbacks: ["system-ui", "sans-serif"],
      optimizedFallbacks: true // Réduit CLS
    }]
  }
});
```

```astro
---
// src/layouts/Layout.astro
import { Font } from "astro:assets";
import "../styles/global.css";
---
<html>
<head>
  <!-- Preload granulaire: seulement le weight critique -->
  <Font 
    cssVariable="--font-inter" 
    preload={[{ weight: 400, subset: "latin" }]} 
  />
</head>
<body style="font-family: var(--font-inter)">
  <slot />
</body>
</html>
```

### Pattern 4: Shiki custom theme avec css-variables

```javascript
// astro.config.mjs
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "css-variables",
      // OU dual themes:
      // themes: { light: "github-light", dark: "github-dark" }
    }
  }
});
```

```css
/* src/styles/global.css — Variables Shiki Astro 5.0+ */
:root {
  --astro-code-foreground: #24292e;
  --astro-code-background: #f6f8fa;
  --astro-code-token-constant: #005cc5;
  --astro-code-token-string: #032f62;
  --astro-code-token-comment: #6a737d;
  --astro-code-token-keyword: #d73a49;
  --astro-code-token-function: #6f42c1;
  --astro-code-token-parameter: #e36209;
  --astro-code-token-punctuation: #24292e;
}

/* Dark mode switch */
[data-theme="dark"], .dark {
  --astro-code-foreground: #e1e4e8;
  --astro-code-background: #24292e;
  --astro-code-token-constant: #79b8ff;
  --astro-code-token-string: #9ecbff;
  --astro-code-token-comment: #959da5;
  --astro-code-token-keyword: #f97583;
  --astro-code-token-function: #b392f0;
}
```

### Pattern 5: Global styles organization

```
src/
├── styles/
│   ├── global.css      # @import "tailwindcss" + @theme
│   ├── reset.css       # CSS reset si non-Tailwind
│   └── components/     # Styles partagés optionnels
├── assets/
│   └── fonts/          # Fichiers .woff2 locaux
└── layouts/
    └── Layout.astro    # Import global.css ICI
```

```astro
---
// src/layouts/Layout.astro
// ORDRE CRITIQUE: global CSS en PREMIER pour précédence minimale
import "../styles/global.css";
import Header from "../components/Header.astro";
---
```

### Pattern 6: CSS Modules dans island React

```css
/* src/components/Counter.module.css */
.counter {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.button:hover {
  opacity: 0.9;
}
```

```tsx
// src/components/Counter.tsx
import styles from './Counter.module.css';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className={styles.counter}>
      <button className={styles.button} onClick={() => setCount(c => c - 1)}>
        -
      </button>
      <span>{count}</span>
      <button className={styles.button} onClick={() => setCount(c => c + 1)}>
        +
      </button>
    </div>
  );
}
```

```astro
---
// Usage dans Astro
import Counter from '../components/Counter';
---
<Counter client:visible />
```

### Pattern 7: Headers Cloudflare pour caching optimal

```
# public/_headers — Copié automatiquement au build
# Assets fingerprinted par Astro (CSS, JS, fonts, images)
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# Fonts spécifiquement
/_astro/fonts/*
  Cache-Control: public, max-age=31536000, immutable

# HTML pages (pas de cache agressif)
/*
  Cache-Control: public, max-age=0, must-revalidate
  X-Content-Type-Options: nosniff
```

---

## 6. Références détaillées

### Catalogue complet variables CSS Shiki (Astro 5.0+)

|Variable|Usage|
|---|---|
|`--astro-code-foreground`|Texte par défaut (ex: `#c9d1d9`)|
|`--astro-code-background`|Fond du bloc code (ex: `#0d1117`)|
|`--astro-code-token-constant`|Constantes, nombres|
|`--astro-code-token-string`|Chaînes de caractères|
|`--astro-code-token-comment`|Commentaires|
|`--astro-code-token-keyword`|`if`, `else`, `return`, `const`|
|`--astro-code-token-parameter`|Paramètres de fonction|
|`--astro-code-token-function`|Noms de fonctions|
|`--astro-code-token-string-expression`|Template literals|
|`--astro-code-token-punctuation`|`{}`, `[]`, `;`|
|`--astro-code-token-link`|URLs dans le code|

**Variables ANSI** (pour `lang="ansi"`): `--astro-code-ansi-{black,red,green,yellow,blue,magenta,cyan,white}[-dim]`

### Matrice compatibilité CSS-in-JS × Rendering × Cloudflare

|Solution|SSG|SSR|Hybrid|Server Islands|Streaming|Cloudflare Workers|
|---|---|---|---|---|---|---|
|Astro Scoped|✅|✅|✅|✅|✅|✅|
|Tailwind v4|✅|✅|✅|✅|✅|✅|
|CSS Modules|✅|✅|✅|✅|✅|✅|
|Panda CSS|✅|✅|✅|✅|✅|✅|
|Vanilla Extract|✅|✅|✅|✅|✅|✅|
|styled-components|✅|⚠️ FOUC|⚠️|❌|❌|⚠️ client:only|
|Emotion|✅|⚠️ FOUC|⚠️|❌|❌|⚠️ client:only|
|styled-jsx|❌|❌|❌|❌|❌|❌|

### Checklist performance CSS (Core Web Vitals)

**LCP (Largest Contentful Paint)**

- [ ] Preload fonts critiques (1-2 max) via `<Font preload />`
- [ ] Self-host fonts (experimental.fonts ou manuel)
- [ ] `font-display: swap` configuré (défaut Astro)
- [ ] CSS critique inline (`inlineStylesheets: 'always'` si petit site)
- [ ] Éviter CSS-in-JS runtime sur critical path

**CLS (Cumulative Layout Shift)**

- [ ] `optimizedFallbacks: true` dans experimental.fonts
- [ ] `width`/`height` sur images (auto avec `<Image />`)
- [ ] Fallback content pour Server Islands
- [ ] Éviter injection CSS dynamique post-load

**FCP (First Contentful Paint)**

- [ ] CSS bundlé et minifié (automatique Astro)
- [ ] Pas de CSS render-blocking externe
- [ ] LightningCSS pour builds plus rapides (optionnel)

**Cloudflare-specific**

- [ ] `/_astro/*` avec `Cache-Control: immutable`
- [ ] Auto Minify désactivé dans dashboard
- [ ] Pas de Cache Rules custom sur assets fingerprinted
- [ ] `routes.extend.exclude: [/_astro/*]` pour servir depuis CDN

### Configuration PostCSS recommandée

```javascript
// postcss.config.cjs — Pour Tailwind v3 ou projets sans Tailwind
module.exports = {
  plugins: [
    // Ordre important: nesting AVANT tailwind
    require('postcss-import'),
    require('postcss-nesting'), // ou tailwindcss/nesting
    require('tailwindcss'),     // si Tailwind v3
    require('autoprefixer'),
    // Production only:
    process.env.NODE_ENV === 'production' && require('cssnano')
  ].filter(Boolean)
};
```

**Note Tailwind v4**: Aucun `postcss.config` nécessaire — `@tailwindcss/vite` gère tout automatiquement.

---

## 7. Sources consultées

### Sources officielles [OFFICIEL]

|URL|Contenu|Confiance|
|---|---|---|
|docs.astro.build/en/guides/styling/|Scoped CSS, global, cascade, preprocessors|Élevé|
|docs.astro.build/en/reference/configuration-reference/|scopedStyleStrategy, inlineStylesheets|Élevé|
|docs.astro.build/en/reference/experimental-flags/fonts/|API Fonts experimental|Élevé|
|docs.astro.build/en/guides/syntax-highlighting/|Shiki config, CSS variables|Élevé|
|docs.astro.build/en/guides/upgrade-to/v5/|Breaking changes CSS/Shiki|Élevé|
|docs.astro.build/en/guides/deploy/cloudflare/|Adapter config, Auto Minify|Élevé|
|tailwindcss.com/docs/installation/framework-guides/astro|Tailwind v4 + Astro setup|Élevé|
|tailwindcss.com/docs/upgrade-guide|v3→v4 migration, @reference|Élevé|
|developers.cloudflare.com/pages/configuration/headers/|_headers file, caching|Élevé|
|developers.cloudflare.com/pages/configuration/serving-pages/|Cache behavior, ETags|Élevé|

### Sources communautaires [COMMUNAUTAIRE]

|URL|Contenu|Confiance|
|---|---|---|
|github.com/withastro/astro/issues/4432|CSS-in-JS compatibility tracker|Moyen|
|github.com/withastro/astro/issues/13139|client:only Tailwind purge bug|Moyen|
|github.com/withastro/roadmap/discussions/778|CSS-in-JS streaming limitations|Moyen|
|panda-css.com/docs/installation/astro|Panda CSS + Astro setup|Moyen|
|shiki.style/guide/theme-colors|Shiki CSS variables reference|Moyen|

### Versions confirmées

|Package|Version|Date|
|---|---|---|
|Astro|5.17.x|Février 2026|
|@astrojs/cloudflare|Latest|Février 2026|
|Tailwind CSS|4.x|2025|
|@tailwindcss/vite|4.x|2025|
|@astrojs/tailwind|6.0.2 (déprécié pour v4)|2025|
|Shiki|v3 (bundled in Astro 5.12+)|2025|

---

## Notes de confiance

- **[OFFICIEL]** — Documentation officielle Astro ou Cloudflare, blog posts officiels, changelogs
- **[COMMUNAUTAIRE]** — Issues GitHub, discussions, articles techniques avec code testé
- **[INFÉRÉ]** — Synthèse logique basée sur comportements documentés, non vérifié directement

**Limitations connues de cette recherche:**

- L'API `experimental.fonts` peut évoluer avant stabilisation en v6
- Tailwind v4 est relativement récent — certains edge cases peuvent ne pas être documentés
- Les comportements spécifiques Server Islands + styling sont partiellement inférés du fonctionnement général