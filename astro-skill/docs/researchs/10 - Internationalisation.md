# Internationalisation Astro 5.17+ sur Cloudflare : guide complet

**Conclusion principale : Astro 5.17+ offre un système i18n mature via `i18n.routing`, mais son déploiement sur Cloudflare requiert des précautions spécifiques autour du caching et de la détection de langue.** La combinaison `prefixDefaultLocale: true` + `redirectToDefaultLocale: false` constitue la configuration la plus stable. Pour les traductions, **Paraglide (Inlang) est la seule solution explicitement compatible Cloudflare Workers** avec tree-shaking optimal.

Ce rapport couvre les patterns actionnables, anti-patterns documentés, et solutions de troubleshooting pour sites multilingues FR/EN déployés sur Cloudflare Pages/Workers.

---

## 1. Quick Reference (règles pour SKILL.md)

|#|Règle impérative|Raison|
|---|---|---|
|1|**Utiliser `prefixDefaultLocale: true`** avec toutes les locales|Évite les ambiguïtés de routing et simplifie le caching CDN [OFFICIEL]|
|2|**Définir `redirectToDefaultLocale: false`**|Prévient les boucles de redirection infinies (défaut changé en v6) [COMMUNAUTAIRE #14406]|
|3|**Implémenter la détection de langue en middleware SSR**, pas via `_redirects`|Cloudflare Pages `_redirects` ne supporte pas les conditions Accept-Language [OFFICIEL]|
|4|**Ne jamais cacher sur `Vary: Accept-Language`** avec Cloudflare CDN|Cloudflare ignore ce header pour les décisions de cache [OFFICIEL]|
|5|**Préférer Paraglide** pour les traductions Cloudflare Workers|Seule solution avec `disableAsyncLocalStorage` explicitement supporté [OFFICIEL Inlang]|
|6|**Créer des pages 404 par locale** (`/[locale]/404.astro`)|La 404 racine ne se déclenche pas correctement avec i18n activé [COMMUNAUTAIRE #12750]|
|7|**Toujours inclure `hreflang="x-default"`** manuellement|Aucune solution Astro ne l'ajoute automatiquement [DOC-GAP]|
|8|**Utiliser les CSS logical properties** pour RTL|`margin-inline-start` s'adapte automatiquement à `dir` sans duplication CSS|
|9|**Éviter `routing: "manual"` sauf besoin complexe**|Désactive tous les helpers automatiques et requiert une implémentation complète [OFFICIEL]|
|10|**Configurer `i18n.locales` dans @astrojs/sitemap**|Génère automatiquement les `xhtml:link` alternates dans le sitemap [OFFICIEL]|
|11|**Vérifier la compatibilité Node.js des libs i18n**|astro-i18next utilise `fs-backend` incompatible Workers [COMMUNAUTAIRE]|
|12|**Utiliser `Astro.currentLocale`** (pas `preferredLocale`) pour les pages statiques|`preferredLocale` est SSR-only et retourne `undefined` en SSG [OFFICIEL]|
|13|**Tester avec `wrangler pages dev`** avant déploiement|Le comportement middleware diffère entre `astro dev` et production [COMMUNAUTAIRE #12315]|
|14|**Éviter la combinaison i18n.domains + Cloudflare**|Marqué `experimental` et requiert des headers spécifiques non garantis [OFFICIEL]|
|15|**Typer les traductions avec `as const`**|Permet l'autocomplétion TypeScript sans dépendance externe|

---

## 2. Decision Matrix — Architecture i18n

|Situation|Approche recommandée|Configuration|Confiance|
|---|---|---|---|
|**Site vitrine 2-5 langues, contenu statique**|SSG + prefix toutes locales|`prefixDefaultLocale: true`, `output: 'static'`|✅ Haute [OFFICIEL]|
|**Détection langue automatique au premier accès**|SSR middleware + redirect|`output: 'server'`, middleware custom|✅ Haute [COMMUNAUTAIRE]|
|**Domaines par langue** (fr.site.com, es.site.com)|Éviter sur Cloudflare|`i18n.domains` est `experimental`|⚠️ Faible [OFFICIEL]|
|**Page d'accueil multilingue sans préfixe** (/)|Manual routing|`routing: "manual"` + middleware|⚠️ Moyenne [OFFICIEL]|
|**Contenu mixte statique/dynamique**|Hybrid + prerender selective|`output: 'server'`, `export const prerender = true` par page|✅ Haute [OFFICIEL]|
|**Fallback vers langue par défaut si traduction absente**|Fallback avec rewrite|`fallback: { fr: "en" }`, `fallbackType: "rewrite"`|✅ Haute [OFFICIEL]|
|**Persistance choix utilisateur**|Sessions Astro 5.7+ ou cookie|`Astro.session.set('locale', ...)`|⚠️ Moyenne [DOC-GAP interaction]|

---

## 3. Decision Matrix — Solutions de traduction

|Critère|JSON manuel|Paraglide (Inlang)|astro-i18n|astro-i18next|
|---|---|---|---|---|
|**Version actuelle**|N/A|2.9.0 (js), 0.4.1 (astro)|2.2.4|1.0.0-beta.21|
|**Dernière mise à jour**|N/A|4 jours|2 ans|3 ans|
|**Compatibilité Astro 5.x**|✅ Oui|✅ Oui [OFFICIEL]|⚠️ [INCERTAIN]|❌ Non [COMMUNAUTAIRE]|
|**Cloudflare Workers**|✅ Oui|✅ Explicite (`disableAsyncLocalStorage`)|⚠️ Mode serverless|❌ fs-backend|
|**Tree-shaking**|✅ Manuel|✅ Excellent (-70% bundle)|❌ Tout chargé|❌ Runtime|
|**TypeScript**|⚠️ Manuel|✅ Fonctions typées|✅ Généré|⚠️ Basique|
|**Pluralisation**|⚠️ À implémenter|✅ Intl.PluralRules|✅ Variants|✅ i18next|
|**Interpolation**|⚠️ À implémenter|✅ `{name}`|✅ `{# var #}`|✅ i18next|
|**Maintenance**|N/A|✅ Active|⚠️ Stale|❌ Abandonné|
|**Recommandation TPE/PME**|🥈 Simple|🥇 **Optimal**|🥉 Risqué|❌ Éviter|

---

## 4. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|`redirectToDefaultLocale: true` avec `prefixDefaultLocale: true`|`redirectToDefaultLocale: false`|Boucles infinies `/en/en/en/...`|[COMMUNAUTAIRE] #13638, #14406|
|Utiliser `_redirects` pour détecter Accept-Language|Middleware SSR avec parsing header|Redirections non fonctionnelles|[OFFICIEL] Cloudflare docs|
|Cacher sur `Vary: Accept-Language`|URLs distinctes par locale (`/en/`, `/fr/`)|Mauvaise langue servie|[OFFICIEL] Cloudflare cache docs|
|`Astro.preferredLocale` sur page prerendered|`Astro.currentLocale` ou middleware|`undefined` retourné|[OFFICIEL] Astro docs|
|Import `astro:i18n` en mode hybrid avec prerender|Utiliser helpers uniquement en SSR|preferredLocale undefined|[COMMUNAUTAIRE] #10620|
|404.astro unique à la racine avec i18n|`/[locale]/404.astro` par locale|404 non affichée|[COMMUNAUTAIRE] #12750, #12175|
|`routing: "manual"` + attente fallback automatique|Implémenter fallback dans middleware|Options fallback ignorées|[COMMUNAUTAIRE] #12431|
|astro-i18next avec Astro 5.x|Paraglide ou JSON manuel|Erreurs d'installation|[COMMUNAUTAIRE] #199|
|Canonical cross-locale (`/fr/about` → `/en/about`)|Self-referencing canonical par page|Pénalité SEO duplicate content|[INFÉRÉ] Google guidelines|
|`margin-left`/`margin-right` pour RTL|`margin-inline-start`/`margin-inline-end`|Layout cassé en RTL|[INFÉRÉ] CSS best practices|

---

## 5. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|**404 non affichée** avec i18n SSR|Bug routing i18n|Créer `/pages/[locale]/404.astro` explicitement|[COMMUNAUTAIRE] #12509, #12750|
|**Boucle de redirection** `/en` → `/en/en`|`redirectToDefaultLocale: true`|Mettre `redirectToDefaultLocale: false`|[COMMUNAUTAIRE] #13638|
|**`Astro.preferredLocale` undefined** en hybrid|Import `astro:i18n` + prerender|Utiliser `Astro.currentLocale` ou désactiver prerender|[COMMUNAUTAIRE] #10620|
|**Mauvaise langue servie** sur Cloudflare|Cache CDN ignorant Accept-Language|Utiliser URLs préfixées, pas de contenu dynamique au même chemin|[OFFICIEL] Cloudflare|
|**Build échoue** avec `context.locals.runtime.env`|Accès env au build-time|Wrapper dans condition `import.meta.env.PROD`|[COMMUNAUTAIRE] adapters#337|
|**Différence dev/prod** redirections middleware|Comportement Wrangler différent|Tester avec `wrangler pages dev` avant déploiement|[COMMUNAUTAIRE] #12953|
|**Sitemap sans alternates** i18n|Config `i18n` manquante dans sitemap|Ajouter `i18n: { defaultLocale, locales }` dans sitemap()|[OFFICIEL] @astrojs/sitemap|
|**Double-prefix** `/es/es/page` avec fallback|Bug corrigé dans Astro 5.x|Mettre à jour vers Astro 5.17+|[OFFICIEL] Changelog|
|**`_routes.json` overlapping rules** sur Cloudflare|Adapter 9.x.x bug|Utiliser adapter version 8.1.0|[COMMUNAUTAIRE] adapters#202|
|**Server Islands sans locale**|Context non propagé|Accéder `Astro.currentLocale` dans le composant island|[DOC-GAP]|

---

## 6. Code Patterns

### 6.1 Configuration `astro.config.mjs` complète annotée

```javascript
// astro.config.mjs — Configuration i18n optimale Cloudflare
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://example.com", // REQUIS pour hreflang absolus et sitemap
  output: "server", // SSR pour détection langue dynamique
  adapter: cloudflare({
    platformProxy: { enabled: true }, // Accès à cf.* en dev
  }),
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en"],
    routing: {
      prefixDefaultLocale: true, // /fr/about et /en/about — uniformité
      redirectToDefaultLocale: false, // ÉVITE boucles infinies
      fallbackType: "rewrite", // Contenu fallback sans redirect visible
    },
    fallback: {
      en: "fr", // Pages EN manquantes → contenu FR
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "fr",
        locales: { fr: "fr-FR", en: "en-US" }, // BCP-47 pour sitemap
      },
    }),
  ],
});
```

### 6.2 Middleware détection langue compatible Cloudflare Workers

```typescript
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";

const SUPPORTED_LOCALES = ["fr", "en"] as const;
const DEFAULT_LOCALE = "fr";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const pathLocale = pathname.split("/")[1];
  
  // Route déjà préfixée → continuer
  if (SUPPORTED_LOCALES.includes(pathLocale as any)) {
    return next();
  }
  
  // Racine "/" → détecter et rediriger
  if (pathname === "/" || pathname === "") {
    const acceptLang = context.request.headers.get("accept-language") || "";
    // Parse simplifié : premier code 2 lettres
    const browserLang = acceptLang.slice(0, 2).toLowerCase();
    const targetLocale = SUPPORTED_LOCALES.includes(browserLang as any) 
      ? browserLang 
      : DEFAULT_LOCALE;
    
    return context.redirect(`/${targetLocale}/`, 302);
  }
  
  // Autres chemins non préfixés → rediriger vers défaut
  return context.redirect(`/${DEFAULT_LOCALE}${pathname}`, 301);
});
```

### 6.3 Layout multilingue avec lang/dir dynamiques

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
const locale = Astro.currentLocale || "fr";

// Configuration RTL par locale
const RTL_LOCALES = ["ar", "he", "fa"];
const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

// Mapping locale → BCP-47 complet
const LANG_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-SA",
};
const lang = LANG_MAP[locale] || locale;
---
<!DOCTYPE html>
<html lang={lang} dir={dir}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### 6.4 Composant hreflang automatique

```astro
---
// src/components/HrefLangs.astro
// Génère tous les hreflang + x-default
const LOCALES = ["fr", "en"];
const DEFAULT_LOCALE = "fr";
const siteUrl = Astro.site?.toString().replace(/\/$/, "") || "";
const currentPath = Astro.url.pathname;

function getCanonicalPath(path: string): string {
  // Retire le préfixe locale existant
  return path.replace(/^\/(fr|en)\//, "/").replace(/^\/(fr|en)$/, "/");
}

function buildLocalizedUrl(path: string, locale: string): string {
  const cleanPath = getCanonicalPath(path);
  return `${siteUrl}/${locale}${cleanPath === "/" ? "" : cleanPath}`;
}

const canonicalUrl = `${siteUrl}${currentPath}`;
---
<!-- Self-referencing canonical -->
<link rel="canonical" href={canonicalUrl} />

<!-- hreflang pour chaque locale -->
{LOCALES.map((locale) => (
  <link 
    rel="alternate" 
    hreflang={locale} 
    href={buildLocalizedUrl(currentPath, locale)} 
  />
))}

<!-- x-default vers langue par défaut -->
<link 
  rel="alternate" 
  hreflang="x-default" 
  href={buildLocalizedUrl(currentPath, DEFAULT_LOCALE)} 
/>
```

### 6.5 Pattern traductions typées (TypeScript)

```typescript
// src/i18n/translations.ts
export const translations = {
  fr: {
    "nav.home": "Accueil",
    "nav.about": "À propos",
    "nav.contact": "Contact",
    "cta.learnMore": "En savoir plus",
    "errors.notFound": "Page non trouvée",
  },
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.contact": "Contact",
    "cta.learnMore": "Learn more",
    "errors.notFound": "Page not found",
  },
} as const;

// Types inférés automatiquement
type Locale = keyof typeof translations;
type TranslationKey = keyof typeof translations["fr"];

export function useTranslations(locale: Locale) {
  return function t(key: TranslationKey): string {
    return translations[locale]?.[key] ?? translations.fr[key] ?? key;
  };
}

// Usage dans un composant .astro :
// const t = useTranslations(Astro.currentLocale as Locale);
// <h1>{t("nav.home")}</h1>
```

### 6.6 Content Collection multilingue

```typescript
// src/content.config.ts — Astro 5.x Content Layer
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    locale: z.enum(["fr", "en"]), // Locale explicite dans frontmatter
  }),
});

export const collections = { blog };
```

```astro
---
// src/pages/[locale]/blog/[slug].astro
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => {
    const [locale, ...slugParts] = post.id.split("/");
    return {
      params: { locale, slug: slugParts.join("/").replace(".md", "") },
      props: { post },
    };
  });
}

const { post } = Astro.props;
const { Content } = await post.render();
---
<Content />
```

**Structure fichiers :**

```
src/content/blog/
├── fr/
│   ├── premier-article.md
│   └── deuxieme-article.md
└── en/
    ├── first-post.md
    └── second-post.md
```

---

## 7. Références détaillées

### 7.1 Configuration `_headers` Cloudflare pour i18n

```
# public/_headers
# Pages localisées — cache CDN distinct par URL
/fr/*
  Cache-Control: public, max-age=86400
  X-Content-Language: fr

/en/*
  Cache-Control: public, max-age=86400
  X-Content-Language: en

# Racine avec détection dynamique — NE PAS CACHER
/
  Cache-Control: no-store, must-revalidate

# Assets statiques — cache long
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

### 7.2 Cloudflare cf.* properties disponibles (Free plan)

|Propriété|Description|Exemple|
|---|---|---|
|`request.cf.country`|Code pays ISO 2 lettres|`"FR"`, `"US"`|
|`request.cf.colo`|Code aéroport datacenter|`"CDG"`, `"ORD"`|
|`request.cf.asn`|Numéro AS du visiteur|`12345`|

**Note :** `city`, `region`, `timezone` requièrent plan Business+.

### 7.3 Accès runtime Cloudflare dans middleware Astro

```typescript
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  // Accès aux bindings Cloudflare (KV, D1, etc.)
  const { env } = context.locals.runtime;
  
  // Accès propriétés cf (pays, etc.)
  const country = context.request.cf?.country; // "FR", "US"...
  
  // Possibilité de rediriger par géolocalisation
  if (country === "FR" && !context.url.pathname.startsWith("/fr")) {
    return context.redirect("/fr" + context.url.pathname);
  }
  
  return next();
});
```

### 7.4 Options `i18n.routing` complètes (Astro 5.17+)

|Option|Type|Défaut|Description|
|---|---|---|---|
|`prefixDefaultLocale`|`boolean`|`false`|Ajoute préfixe à la locale par défaut|
|`redirectToDefaultLocale`|`boolean`|`true`*|Redirige `/` vers `/{defaultLocale}`|
|`fallbackType`|`"redirect" \| "rewrite"`|`"redirect"`|Comportement fallback|
|`"manual"`|`string`|—|Désactive routing automatique entièrement|

*Défaut changera à `false` dans Astro 6 suite au PR #14406.

### 7.5 Helpers `astro:i18n` complets

|Fonction|Paramètres|Retour|Usage|
|---|---|---|---|
|`getRelativeLocaleUrl`|`(locale, path?, options?)`|`string`|URL relative locale|
|`getAbsoluteLocaleUrl`|`(locale, path?, options?)`|`string`|URL absolue (requiert `site`)|
|`getRelativeLocaleUrlList`|`(path?, options?)`|`string[]`|Toutes URLs locales|
|`getAbsoluteLocaleUrlList`|`(path?, options?)`|`string[]`|Toutes URLs absolues|
|`getPathByLocale`|`(locale)`|`string`|Path custom pour locale|
|`getLocaleByPath`|`(path)`|`string`|Locale depuis path|
|`pathHasLocale`|`(path)`|`boolean`|Vérifie préfixe locale|

**Manual routing only :**

- `redirectToDefaultLocale(context, status?)`
- `redirectToFallback(context, response)`
- `notFound(context)`
- `middleware(options)`
- `requestHasLocale(context)`

---

## 8. Sources consultées

|Source|Type|Confiance|Version vérifiée|
|---|---|---|---|
|docs.astro.build/en/guides/internationalization/|[OFFICIEL]|✅ Haute|Astro 5.17+|
|docs.astro.build/en/reference/modules/astro-i18n/|[OFFICIEL]|✅ Haute|Astro 5.17+|
|docs.astro.build/en/guides/integrations-guide/cloudflare/|[OFFICIEL]|✅ Haute|Adapter 12.x|
|developers.cloudflare.com/pages/configuration/|[OFFICIEL]|✅ Haute|Jan 2025|
|developers.cloudflare.com/cache/how-to/cache-keys/|[OFFICIEL]|✅ Haute|Jan 2025|
|inlang.com/m/gerre34r/library-inlang-paraglideJs|[OFFICIEL]|✅ Haute|Paraglide 2.9.0|
|github.com/withastro/astro/issues (i18n label)|[COMMUNAUTAIRE]|⚠️ Moyenne|Fév 2025|
|github.com/withastro/adapters/issues|[COMMUNAUTAIRE]|⚠️ Moyenne|Fév 2025|
|npmjs.com/package/astro-i18n|[OFFICIEL]|⚠️ Stale|v2.2.4 (2 ans)|
|npmjs.com/package/astro-i18next|[OFFICIEL]|❌ Obsolète|v1.0.0-beta.21 (3 ans)|

---

## Conclusion

L'internationalisation Astro 5.17+ sur Cloudflare est **production-ready** avec les précautions suivantes :

1. **Configuration stable** : `prefixDefaultLocale: true` + `redirectToDefaultLocale: false` évite 90% des bugs documentés
2. **Traductions** : Paraglide est le choix optimal pour Cloudflare Workers ; JSON manuel reste viable pour 2 langues
3. **Cache CDN** : S'appuyer exclusivement sur les URLs préfixées, jamais sur `Vary: Accept-Language`
4. **SEO** : Implémenter manuellement les hreflang et x-default — aucune solution ne le fait complètement
5. **RTL** : CSS logical properties couvrent 95% des besoins sans configuration complexe

Les **DOC-GAPs** majeurs identifiés concernent l'interaction Sessions/Server Islands avec i18n, les patterns JSON-LD multilingues, et le troubleshooting Cloudflare spécifique.