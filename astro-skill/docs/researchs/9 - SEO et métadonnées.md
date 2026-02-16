# SEO et métadonnées pour Astro 5.17+ sur Cloudflare

L'implémentation SEO dans Astro requiert une attention particulière à la configuration `site`, l'échappement JSON-LD via `set:html`, et les limitations du runtime Cloudflare Workers qui excluent `sharp` et `fs`. Les canonical URLs doivent toujours combiner `Astro.url.pathname` avec `Astro.site` pour éviter les références localhost en production. Les images OG dynamiques nécessitent soit un pre-rendering au build, soit le package `workers-og` conçu pour l'edge.

---

## 1. Quick Reference (pour SKILL.md)

```markdown
### SEO Astro 5.17+ / Cloudflare — Règles impératives

1. **Toujours définir `site` dans astro.config.mjs** — requis par sitemap, RSS, canonical URLs et OG images absolues [OFFICIEL]

2. **Utiliser `new URL(Astro.url.pathname, Astro.site)` pour les canonical URLs** — évite localhost en production et gère correctement SSG/SSR [OFFICIEL]

3. **Injecter JSON-LD avec `set:html={JSON.stringify(schema)}`** — Astro échappe le contenu des `<script>` par défaut, cassant le JSON [OFFICIEL]

4. **Configurer `trailingSlash: 'never'`** — cohérence canonicals/sitemap ; Cloudflare Pages préfère les URLs sans slash [COMMUNAUTAIRE]

5. **Pré-rendre les endpoints SEO (RSS, sitemap, OG images)** — `export const prerender = true` évite les timeouts Workers et garantit la compatibilité [OFFICIEL]

6. **Utiliser `workers-og` pour les images OG dynamiques en SSR** — seul package compatible Cloudflare Workers runtime (pas de sharp/fs) [COMMUNAUTAIRE]

7. **Créer un composant `<SEOHead />` unique dans le layout** — évite la duplication meta tags entre layout et pages [INFÉRÉ]

8. **Toujours utiliser des URLs absolues HTTPS pour og:image** — les crawlers sociaux ne résolvent pas les URLs relatives [OFFICIEL]

9. **Bloquer l'indexation des preview URLs via `_headers`** — Cloudflare Pages le fait automatiquement sur `*.pages.dev`, mais ajouter X-Robots-Tag explicitement pour les branches [COMMUNAUTAIRE]

10. **Utiliser le pattern `@graph` pour combiner plusieurs schemas JSON-LD** — un seul script, meilleure organisation, références croisées via `@id` [OFFICIEL Google]

11. **Valider JSON-LD avec Google Rich Results Test avant deploy** — les erreurs silencieuses sont fréquentes (propriétés manquantes, URLs relatives) [OFFICIEL]

12. **Désactiver Auto Minify dans Cloudflare Dashboard** — cause des erreurs d'hydratation en production [OFFICIEL]

13. **Préférer le fichier `public/robots.txt` manuel aux packages communautaires** — `astro-robots-txt` non testé pour Astro 5.x [INFÉRÉ]

14. **Pour @astrojs/sitemap en SSR : créer un endpoint custom** — le sitemap auto ne découvre pas les routes dynamiques SSR [OFFICIEL]

15. **Tester localement avec `wrangler pages dev ./dist`** — détecte les différences dev/prod avant deploy [COMMUNAUTAIRE]
```

---

## 2. Decision Matrix

|Situation|Approche Astro 5.17+|Raison|Confiance|
|---|---|---|---|
|**Composant SEO** : `astro-seo` vs manuel|**Manuel recommandé** — composant `<SEOHead />` custom|`astro-seo` (v0.8.4) non mis à jour depuis 2 ans ; le pattern manuel avec TypeScript Props offre le même niveau de type-safety sans dépendance|Haute [INFÉRÉ]|
|**Sitemap** : @astrojs/sitemap config|**Utiliser avec `filter` + `serialize`** pour SSG/hybrid ; **endpoint custom** pour full SSR|L'intégration officielle ne découvre pas les routes SSR dynamiques automatiquement|Haute [OFFICIEL]|
|**robots.txt** : manuel vs intégration|**`public/robots.txt` manuel** ou **endpoint SSR**|`astro-robots-txt` (v1.0.0) non mis à jour depuis 2 ans, pas testé Astro 5.x|Haute [INFÉRÉ]|
|**JSON-LD** : manuel vs `astro-seo-schema`|**Les deux valides** — `astro-seo-schema` (v5.1.0) activement maintenu|`astro-seo-schema` apporte auto-escaping et types `schema-dts` ; manuel avec `set:html={JSON.stringify()}` équivalent|Moyenne [COMMUNAUTAIRE]|
|**Images OG statiques** : build-time|**`astro-og-canvas`** (v0.7.2) ou sharp + prerender|Génération au build, compatible SSG, images pré-optimisées|Haute [COMMUNAUTAIRE]|
|**Images OG dynamiques** : SSR runtime|**`workers-og`** (Cloudflare Workers)|Seul package compatible workerd runtime ; `@vercel/og` et `sharp` incompatibles|Haute [COMMUNAUTAIRE]|
|**RSS** : `pagesGlobToRssItems()` vs Content Collections|**Content Collections avec `getCollection()`**|API moderne Astro 5.x, type-safety, filtrage drafts intégré|Haute [OFFICIEL]|
|**Canonical URL construction**|**`new URL(Astro.url.pathname, Astro.site)`**|Combine le path de la requête avec le domaine de production configuré|Haute [OFFICIEL]|
|**Rendering mode pour endpoints SEO**|**`export const prerender = true`**|RSS/sitemap/OG images servis comme fichiers statiques, évite timeouts Workers (10-50ms CPU)|Haute [OFFICIEL]|

---

## 3. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|Omettre `site` dans `astro.config.mjs`|Toujours définir `site: 'https://domaine.com'`|Sitemap 404, canonical URLs cassées, `Astro.site` undefined|[OFFICIEL]|
|Utiliser `Astro.url.href` directement pour canonical|`new URL(Astro.url.pathname, Astro.site)`|URLs localhost en dev/build SSG, domaines incorrects|[OFFICIEL]|
|Injecter JSON-LD avec `{JSON.stringify(schema)}` dans `<script>`|`<script type="application/ld+json" set:html={JSON.stringify(schema)} />`|JSON échappé, structured data invalide, pas de rich results|[OFFICIEL]|
|Mélanger `trailingSlash: 'ignore'` avec canonicals|Choisir `'never'` ou `'always'` et rester cohérent|Contenu dupliqué, canonical mismatch, pénalité SEO potentielle|[COMMUNAUTAIRE]|
|Dupliquer `<title>` et `<meta description>` dans layout ET page|Composant `<SEOHead />` unique avec props passées du page au layout|Méta dupliquées, comportement imprévisible des crawlers|[INFÉRÉ]|
|URLs relatives pour `og:image` (`/og.png`)|`new URL('/og.png', Astro.site).href` pour URL absolue HTTPS|Images non chargées sur Facebook/LinkedIn/Twitter|[OFFICIEL OGP]|
|Utiliser `sharp` ou `@resvg/resvg-js` en SSR Cloudflare|`workers-og` pour runtime, ou prerender au build|Crash Workers, erreur "module not found"|[COMMUNAUTAIRE]|
|Endpoint RSS/sitemap sans `export const prerender = true`|Ajouter `export const prerender = true` aux endpoints|404 sur Cloudflare si routing SSR mal configuré, timeouts potentiels|[OFFICIEL]|
|Laisser Auto Minify activé dans Cloudflare|Désactiver dans Dashboard → Speed → Optimization|Erreurs d'hydratation, JavaScript cassé en production|[OFFICIEL]|
|Faire confiance au cache Cloudflare après update meta tags|Purger le cache Cloudflare, utiliser query strings versionnés, ou `Cache-Control: no-cache` pour HTML|Meta tags obsolètes servis aux crawlers pendant des heures|[COMMUNAUTAIRE]|

---

## 4. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|**Sitemap 404 après deploy**|`site` manquant dans `astro.config.mjs`|Ajouter `site: 'https://votredomaine.com'`|[OFFICIEL]|
|**Canonical URLs pointent vers localhost**|`Astro.url` utilisé seul en SSG ; `site` non défini|Utiliser `new URL(Astro.url.pathname, Astro.site)` + configurer `site`|[OFFICIEL]|
|**RSS feed erreur validation (XML malformé)**|Content-Type manquant ou caractères non échappés|Ajouter `headers: { 'Content-Type': 'application/xml' }` ; sanitizer le contenu HTML|[INFÉRÉ]|
|**JSON-LD non détecté par Google Rich Results Test**|Contenu échappé par Astro, JSON invalide|Utiliser `set:html={JSON.stringify(schema)}` ; valider JSON localement|[OFFICIEL]|
|**Différence rendu SEO entre `astro dev` et production**|Dev = Node.js, prod = workerd runtime Cloudflare|Activer `platformProxy: { enabled: true }` dans adapter config pour simuler|[OFFICIEL]|
|**og:image différente affichée sur réseaux sociaux**|Cache des crawlers sociaux (7 jours par défaut)|Utiliser Facebook Debugger / LinkedIn Post Inspector pour purger cache|[OFFICIEL]|
|**Erreur 1042 sur page 404 custom (Workers)**|Workers ne peuvent pas fetch entre workers du même compte|Prerender 404 avec `export const prerender = true`, ou utiliser 404.html statique|[COMMUNAUTAIRE] GitHub #13932|
|**Trailing slash redirects causent 404**|Cloudflare adapter strip les trailing slashes de `_redirects`|Bug connu (#13165) — gérer dans middleware ou accepter comportement|[COMMUNAUTAIRE]|
|**Images `<Image>` retournent 404 sur Workers**|Endpoint `_image` mal routé vers assets statiques|Utiliser `passthroughImageService()` avec `imageService: 'passthrough'`|[COMMUNAUTAIRE]|
|**Meta tags non mis à jour après deploy**|Edge cache Cloudflare sert HTML obsolète|Purger cache Cloudflare, ajouter `Cache-Control` headers appropriés|[COMMUNAUTAIRE]|

---

## 5. Code Patterns

### 5.1 Composant `<SEOHead />` réutilisable (~25 lignes)

```astro
---
// src/components/SEOHead.astro
interface Props {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const { title, description, image = '/og-default.png', type = 'website', noindex = false } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const imageURL = new URL(image, Astro.site);
---
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />
{noindex && <meta name="robots" content="noindex, nofollow" />}
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={imageURL} />
<meta name="twitter:card" content="summary_large_image" />
```

### 5.2 Configuration sitemap production-ready

```javascript
// astro.config.mjs
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/drafts/'),
      serialize(item) {
        if (item.url === 'https://example.com/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        } else if (item.url.includes('/blog/')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],
});
```

### 5.3 Endpoint RSS avec Content Collections

```typescript
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export const prerender = true; // Important pour Cloudflare

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return rss({
    title: 'Mon Blog',
    description: 'Articles récents',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

### 5.4 Composant JSON-LD typé

```astro
---
// src/components/JsonLd.astro
import type { Thing, WithContext } from 'schema-dts';

interface Props {
  schema: WithContext<Thing> | WithContext<Thing>[];
}

const { schema } = Astro.props;
const jsonLd = Array.isArray(schema) 
  ? { "@context": "https://schema.org", "@graph": schema.map(s => { const { "@context": _, ...rest } = s as any; return rest; }) }
  : schema;
---
<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

**Usage LocalBusiness:**

```astro
<JsonLd schema={{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Mon Entreprise",
  "address": { "@type": "PostalAddress", "streetAddress": "123 Rue", "addressLocality": "Paris" },
  "telephone": "+33123456789",
  "url": Astro.site?.toString()
}} />
```

### 5.5 Image OG dynamique (Cloudflare Workers compatible)

```typescript
// src/pages/og/[slug].png.ts
// Requiert: npm install workers-og
import { ImageResponse } from 'workers-og';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;
  const html = `
    <div style="display:flex;width:1200px;height:630px;background:#1a1a2e;padding:60px;align-items:center;justify-content:center;">
      <h1 style="font-size:64px;color:#fff;text-align:center;">${slug?.replace(/-/g, ' ')}</h1>
    </div>
  `;
  return new ImageResponse(html, { width: 1200, height: 630 });
};

// Pour SSG (plus fiable): export const prerender = true + getStaticPaths()
```

### 5.6 robots.txt dynamique (environnement-aware)

```typescript
// src/pages/robots.txt.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ url, site }) => {
  const isProduction = !url.hostname.includes('pages.dev') && !url.hostname.includes('localhost');
  const sitemapUrl = new URL('sitemap-index.xml', site);
  
  const content = isProduction
    ? `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}`
    : `User-agent: *\nDisallow: /`;

  return new Response(content, { headers: { 'Content-Type': 'text/plain' } });
};
```

---

## 6. Références pour references/

### 6.1 Schemas JSON-LD exhaustifs par type de page TPE/PME

```markdown
<!-- grep: json-ld-schemas, structured-data-reference -->

### Page Accueil
- WebSite (avec SearchAction si recherche interne)
- Organization ou LocalBusiness
- BreadcrumbList

### Page Services/Prestations
- Service (schema.org/Service)
- BreadcrumbList
- Organization (référence @id)

### Page Contact
- LocalBusiness (avec geo, openingHours, telephone, email)
- BreadcrumbList

### Article/Blog
- Article ou BlogPosting
- BreadcrumbList
- Author (Person ou Organization)

### Page Produit
- Product (avec Offer, price, availability)
- BreadcrumbList
- AggregateRating si avis

### FAQ
- FAQPage (Note: rich results limités aux sites gouvernementaux/santé depuis 2023)
- BreadcrumbList

### Propriétés obligatoires Google par schema:
| Schema | Obligatoires | Recommandées |
|--------|-------------|--------------|
| LocalBusiness | @type, name, address | image, telephone, url, openingHours, geo, priceRange |
| Article | (aucune obligatoire) | headline, image, datePublished, author |
| Product | name, image, offers.price, offers.priceCurrency | sku, brand, review |
| BreadcrumbList | itemListElement | - |
```

### 6.2 Checklist SEO pré-déploiement Cloudflare

```markdown
<!-- grep: seo-checklist, pre-deploy-seo -->

## Configuration Astro
- [ ] `site` défini dans astro.config.mjs (URL production HTTPS)
- [ ] `trailingSlash` configuré ('never' recommandé)
- [ ] @astrojs/sitemap installé et configuré
- [ ] @astrojs/rss configuré si blog/actualités

## Meta Tags (vérifier sur chaque page type)
- [ ] `<title>` unique et < 60 caractères
- [ ] `<meta description>` unique et < 160 caractères
- [ ] `<link rel="canonical">` avec URL absolue
- [ ] `<meta name="robots">` approprié (noindex sur admin/drafts)

## Open Graph
- [ ] og:title, og:type, og:image, og:url présents
- [ ] og:image URL absolue HTTPS, 1200×630px
- [ ] Testé avec Facebook Sharing Debugger

## Twitter Cards
- [ ] twitter:card défini (summary_large_image)
- [ ] Testé avec Twitter Card Validator

## JSON-LD
- [ ] Utilise `set:html={JSON.stringify()}`
- [ ] @context et @type présents
- [ ] URLs absolues dans le schema
- [ ] Validé avec Google Rich Results Test
- [ ] Pas de propriétés requises manquantes

## Cloudflare Spécifique
- [ ] Auto Minify désactivé (Dashboard → Speed)
- [ ] _headers configuré pour *.pages.dev noindex
- [ ] Cache-Control approprié pour sitemap/robots.txt
- [ ] Testé avec `wrangler pages dev ./dist`

## Post-déploiement
- [ ] Sitemap accessible à /sitemap-index.xml
- [ ] robots.txt accessible et correct
- [ ] RSS feed valide (W3C Feed Validator)
- [ ] Google Search Console configuré
- [ ] Demander indexation des pages clés
```

### 6.3 Configuration _headers Cloudflare pour SEO

```plaintext
<!-- grep: cloudflare-headers, seo-headers -->

# /public/_headers

# Bloquer indexation preview deployments
https://:project.pages.dev/*
  X-Robots-Tag: noindex

https://*.:project.pages.dev/*
  X-Robots-Tag: noindex

# Assets hashés - cache agressif
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# Sitemap - refresh régulier
/sitemap*.xml
  Cache-Control: public, max-age=3600

# robots.txt - cache modéré
/robots.txt
  Cache-Control: public, max-age=86400

# RSS feed - refresh fréquent
/rss.xml
  Cache-Control: public, max-age=1800
  Content-Type: application/xml

# Security headers
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
```

---

## 7. Sources consultées

### Documentation Officielle [OFFICIEL]

|Source|Contenu|Confiance|
|---|---|---|
|docs.astro.build/en/reference/directives-reference/#sethtml|Pattern `set:html` pour JSON-LD|Haute|
|docs.astro.build/en/guides/integrations-guide/sitemap/|Configuration @astrojs/sitemap|Haute|
|docs.astro.build/en/recipes/rss/|Endpoint RSS avec Content Collections|Haute|
|docs.astro.build/en/guides/integrations-guide/cloudflare/|Adapter Cloudflare, platformProxy|Haute|
|docs.astro.build/en/reference/configuration-reference/|`site`, `trailingSlash`, `base`|Haute|
|developers.google.com/search/docs/appearance/structured-data|Schemas JSON-LD requis/recommandés|Haute|
|schema.org|Définitions schemas|Haute|
|ogp.me|Spécification Open Graph Protocol|Haute|
|developer.x.com/en/docs/twitter-for-websites/cards|Twitter Cards reference|Haute|

### GitHub Issues/PRs [COMMUNAUTAIRE - Vérifiés]

|Issue|Sujet|Statut|
|---|---|---|
|withastro/astro #9870|Astro.url trailing slash en build|RÉSOLU (PR #9878)|
|withastro/astro #13165|Trailing slash stripped dans _redirects Cloudflare|OUVERT|
|withastro/astro #13932|Prerendered 404 error 1042 sur Workers|OUVERT|
|withastro/astro #3544|JSON-LD escaping dans scripts|RÉSOLU|
|withastro/astro #10778|Sitemap exclut pages "404"/"500" pattern|RÉSOLU|

### Packages Communautaires [COMMUNAUTAIRE]

|Package|Version|Astro 5.x|Maintenance|Downloads/semaine|
|---|---|---|---|---|
|@astrojs/sitemap|3.7.0|✅ Officiel|Active|~1.4M|
|@astrojs/rss|latest|✅ Officiel|Active|~500K|
|astro-seo|0.8.4|⚠️ Non testé|Inactive (2 ans)|~136K|
|astro-seo-schema|5.1.0|✅ Compatible|Active|~7.5K|
|workers-og|latest|✅ Compatible CF|Active|N/A|
|astro-og-canvas|0.7.2|✅ Compatible|Active|N/A|
|astro-robots-txt|1.0.0|⚠️ Non testé|Inactive (2 ans)|~12K|
|schema-dts|latest|✅|Google maintained|N/A|

### [DOC-GAPS] Identifiés

|Gap|Statut|Workaround|
|---|---|---|
|Guide JSON-LD officiel absent docs Astro|**Non résolu**|Utiliser `set:html` + docs Google|
|Images OG dynamiques non documentées|**Non résolu**|Community packages (workers-og, astro-og-canvas)|
|Comportement Astro.url Cloudflare non clair|**Partiellement**|GitHub issues + community blogs|
|@astrojs/sitemap limites SSR|**Documenté**|Endpoint custom pour full SSR|

---

**Versions vérifiées:**

- Astro: 5.17+ (documentation février 2025)
- @astrojs/cloudflare: 12.x
- @astrojs/sitemap: 3.7.0
- @astrojs/rss: latest compatible
- astro-seo-schema: 5.1.0
- workers-og: latest (Cloudflare Workers compatible)