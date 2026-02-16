# Sécurité Web Astro 5.17+ sur Cloudflare : Guide Impératif

La sécurité d'un site Astro déployé sur Cloudflare repose sur **7 piliers** : CSP, CSRF, XSS, secrets, sanitization, CORS et headers. Ce guide condense les patterns actionnables validés pour les sites vitrine TPE/PME avec stack Astro 5.17+ et @astrojs/cloudflare.

**Constat clé** : Le fichier `_headers` de Cloudflare **ne s'applique PAS aux routes SSR** — seuls les assets statiques en bénéficient. Pour le SSR/hybrid, tout passe par le middleware Astro.

---

## Quick Reference Sécurité (20 règles)

### CSP — Content Security Policy

🔴 **CRITIQUE** — `experimental.csp` ne fonctionne PAS en mode dev ; testez exclusivement avec `astro build && astro preview` [EXPERIMENTAL] (Astro 5.9+, High)

🔴 **CRITIQUE** — Les directives `frame-ancestors`, `report-uri` et `sandbox` sont IGNORÉES dans le `<meta>` CSP ; utilisez le middleware pour les injecter en header [OFFICIEL] (All modes, High)

🟡 **IMPORTANT** — Désactivez Cloudflare Auto Minify quand CSP hash-based est actif (Dashboard → Speed → Optimization) ; la minification modifie les hashes [COMMUNAUTAIRE] (All, Medium)

🟢 **RECOMMANDÉ** — Utilisez `Astro.csp.insertScriptResource()` dans les composants pour whitelister des CDN tiers par page plutôt que globalement [OFFICIEL] (SSR/Hybrid, High)

### CSRF — Cross-Site Request Forgery

🔴 **CRITIQUE** — `security.checkOrigin: true` est le défaut en Astro 5+ mais ne protège PAS les requêtes JSON (`application/json`) utilisées par les Actions RPC ; implémentez une vérification session custom pour les Actions [DOC-GAP] (SSR, Medium)

🔴 **CRITIQUE** — Mettez à jour vers Astro ≥4.16.17 pour corriger CVE-2024-56140 (bypass CSRF via Content-Type avec paramètres) [OFFICIEL] (All, High)

🟡 **IMPORTANT** — Les routes prerendered (SSG/hybrid statique) ne sont PAS protégées par `checkOrigin` — utilisez SSR pour les formulaires sensibles [OFFICIEL] (Hybrid, High)

🟡 **IMPORTANT** — Cloudflare préserve le header Origin mais peut le supprimer si un Worker intermédiaire est mal configuré ; vérifiez avec `request.headers.get('Origin')` [INFÉRÉ] (SSR, Medium)

### XSS — Cross-Site Scripting

🔴 **CRITIQUE** — Les attributs `href`/`src` avec données utilisateur permettent l'injection `javascript:` ; validez toujours avec `z.url({ protocol: /^https?$/ })` [OWASP] (All, High)

🔴 **CRITIQUE** — `set:html` bypass l'escaping ; utilisez ESLint rule `astro/no-set-html-directive` pour forcer la review ou sanitizez avec `xss` library côté serveur [OFFICIEL] (All, High)

🟡 **IMPORTANT** — Les CVE Server Islands (SNYK-JS-ASTRO-7547139, SNYK-JS-ASTRO-14059122) sont corrigées en Astro ≥4.12.2 et ≥5.15.8 ; mettez à jour [OFFICIEL] (SSR, High)

🟢 **RECOMMANDÉ** — Pour sanitization côté Workers, utilisez `xss` (js-xss) — DOMPurify et sanitize-html nécessitent jsdom, incompatible Cloudflare Workers [COMMUNAUTAIRE] (SSR, High)

### Secrets & Variables d'environnement

🔴 **CRITIQUE** — En SSR Cloudflare, accédez aux secrets via `Astro.locals.runtime.env.SECRET` et NON `import.meta.env.SECRET` (undefined en runtime) [OFFICIEL] (SSR, High)

🔴 **CRITIQUE** — N'accédez JAMAIS aux variables d'environnement après la fence `---` ; elles apparaîtraient dans le HTML généré [COMMUNAUTAIRE] (All, High)

🟡 **IMPORTANT** — `envField({ access: 'secret' })` exclut la valeur du bundle mais requiert validation build-time ; utilisez `validateSecrets: false` ou dummy values en CI [OFFICIEL] (All, High)

🟢 **RECOMMANDÉ** — Générez les types avec `wrangler types && astro sync` dans vos scripts npm pour typage cohérent [OFFICIEL] (All, Medium)

### Headers de sécurité

🔴 **CRITIQUE** — Pour SSR/hybrid, implémentez TOUS les headers via middleware Astro ; `_headers` Cloudflare est ignoré pour les réponses dynamiques [OFFICIEL] (SSR/Hybrid, High)

🟡 **IMPORTANT** — Désactivez `X-XSS-Protection` avec valeur `0` (OWASP recommande — peut causer des vulnérabilités) [OWASP] (All, High)

🟢 **RECOMMANDÉ** — Ajoutez `X-Robots-Tag: noindex` pour `*.pages.dev` dans `_headers` pour éviter l'indexation du domaine preview [COMMUNAUTAIRE] (All, Medium)

### CORS

🟡 **IMPORTANT** — Cloudflare Pages ne gère PAS automatiquement OPTIONS preflight ; implémentez le handler explicitement dans le middleware [OFFICIEL] (SSR, High)

🟡 **IMPORTANT** — N'utilisez JAMAIS `Access-Control-Allow-Origin: *` avec `credentials: 'include'` ; spécifiez l'origine exacte [OWASP] (SSR, High)

---

## Matrice de décision sécurité

|Type projet|CSP|CSRF|Headers|Secrets|CORS|
|---|---|---|---|---|---|
|**SSG pur**|`experimental.csp: true` + `_headers` pour frame-ancestors|N/A (pas de mutation)|`_headers` file|Build-time `.env`|`_headers` pour assets|
|**Hybrid**|`experimental.csp` + middleware pour SSR pages|`checkOrigin` (défaut)|`_headers` statique + middleware SSR|`astro:env` + `runtime.env`|Middleware global|
|**Full SSR**|Middleware header ou `experimental.csp` (header auto)|`checkOrigin` (défaut) + session Actions|Middleware exclusivement|`Astro.locals.runtime.env`|Middleware + handlers|

### Flux décisionnel CSP

```
Site utilise View Transitions ?
  └─ OUI → CSP expérimentale incompatible, utilisez _headers ou middleware manuel
  └─ NON → experimental.csp: true activable
        └─ Scripts tiers (analytics, widgets) ?
              └─ OUI → Ajoutez à scriptDirective.resources
              └─ NON → Configuration minimale suffit
```

---

## Anti-patterns critiques

|❌ Anti-pattern|✅ Alternative sécurisée|Risque|Source|
|---|---|---|---|
|`<a href={userInput}>` sans validation|`z.url({ protocol: /^https?$/ }).safeParse(userInput)`|XSS via javascript:|[OWASP]|
|`set:html={userContent}`|`set:text` ou `xss(userContent, { whiteList: {} })`|XSS injection|[OFFICIEL]|
|`import.meta.env.SECRET` en SSR CF|`Astro.locals.runtime.env.SECRET`|Secret undefined|[OFFICIEL]|
|CSP `'unsafe-inline'` pour scripts|`experimental.csp` avec hashes auto|XSS bypass CSP|[OWASP]|
|`sourcemap: true` en production|`sourcemap: false` (défaut)|Code source exposé (CVE-2024)|[GHSA-49w6]|
|`CORS: *` sur endpoint authentifié|Origins explicites dans allowlist|CSRF via CORS|[OWASP]|
|Accès env après fence `---`|Tout accès env DANS la fence uniquement|Leak secrets HTML|[COMMUNAUTAIRE]|
|Dev server `--host 0.0.0.0` public|Dev local uniquement, staging séparé|XSS pages erreur dev|[GHSA-w2vj]|
|Trust `x-forwarded-host` sans validation|Configure `security.allowedDomains`|Host header injection|[CVE-2025-61925]|

---

## Troubleshooting rapide

|Symptôme|Cause|Fix|Vérification|
|---|---|---|---|
|CSP bloque scripts légitimes|Hashes modifiés par minification CF|Désactiver Auto Minify Dashboard|`astro build && preview`, check console|
|"Cross-site POST forbidden"|`checkOrigin` bloque requête sans Origin|Vérifier Origin header, config `allowedDomains`|DevTools Network → Request Headers|
|`env.SECRET` undefined en prod|Mauvaise méthode accès CF runtime|Utiliser `Astro.locals.runtime.env`|`console.log(Astro.locals.runtime)`|
|`_headers` ignoré sur route dynamique|Normal : `_headers` = statique seulement|Middleware pour SSR|`curl -I` sur route SSR|
|CORS preflight 404/405|OPTIONS non géré|Ajouter handler `OPTIONS` explicit|`curl -X OPTIONS -v url`|
|Actions CSRF bypass possible|JSON Content-Type non vérifié par checkOrigin|Session auth custom dans middleware|Test avec fetch JSON cross-origin|
|CSP meta ignorée `frame-ancestors`|Limitation navigateur|Middleware header CSP complet|securityheaders.com|

---

## Code Patterns Essentiels

### 1. Configuration CSP expérimentale (`astro.config.mjs`)

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  experimental: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://static.cloudflareinsights.com",
      ],
      scriptDirective: {
        resources: ["'self'"],
        strictDynamic: false,
      },
    },
  },
});
```

### 2. Middleware headers sécurité (`src/middleware.ts`)

```typescript
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'https://votresite.com',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = await next();
  const headers = new Headers(response.headers);

  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '0');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');

  return new Response(response.body, { status: response.status, headers });
});
```

### 3. Fichier `_headers` Cloudflare (`public/_headers`)

```
/*
  X-Content-Type-Options: nosniff

/assets/*
  Cache-Control: public, max-age=31536000, immutable

https://:project.pages.dev/*
  X-Robots-Tag: noindex
```

### 4. Action Zod + sanitization (`src/actions/contact.ts`)

```typescript
import { defineAction, z } from 'astro:actions';
import xss from 'xss';

const sanitize = (str: string) => xss(str, { whiteList: {}, stripIgnoreTag: true });

export const server = {
  submitContact: defineAction({
    accept: 'form',
    input: z.object({
      email: z.email(),
      website: z.url({ protocol: /^https?$/ }).optional(),
      message: z.string().min(10).max(1000).transform(sanitize),
    }),
    handler: async ({ email, website, message }) => {
      // message est validé ET sanitizé
      return { success: true };
    },
  }),
};
```

### 5. Schema secrets astro:env (`astro.config.mjs`)

```javascript
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  env: {
    validateSecrets: true,
    schema: {
      STRIPE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
      PUBLIC_API_URL: envField.string({ context: 'client', access: 'public' }),
      LOG_LEVEL: envField.enum({
        context: 'server',
        access: 'public',
        values: ['debug', 'info', 'warn', 'error'],
        default: 'info',
      }),
    },
  },
});
```

### 6. Accès secrets Cloudflare SSR

```astro
---
// DANS la fence uniquement
import { STRIPE_SECRET_KEY } from 'astro:env/server';
// OU accès runtime direct
const { env } = Astro.locals.runtime;
const stripeKey = env.STRIPE_SECRET_KEY;
---
<!-- Ne jamais accéder aux secrets ici -->
```

---

## Checklist pré-production

### Vérifications obligatoires

- [ ] **Version Astro ≥5.15.8** — corrige CVEs Server Islands et XSS
- [ ] **`security.checkOrigin`** — non désactivé (défaut activé)
- [ ] **Middleware headers** — implémenté pour SSR/hybrid
- [ ] **`_headers`** — présent dans `public/` avec `noindex` pour pages.dev
- [ ] **Secrets** — accédés via `Astro.locals.runtime.env` ou `astro:env/server`
- [ ] **`.dev.vars`** — dans `.gitignore`
- [ ] **Sourcemaps** — désactivés en production
- [ ] **Auto Minify** — désactivé si CSP hash-based actif

### Commandes diagnostic

```bash
# Vérifier headers en production
curl -I https://votresite.com | grep -E "(X-Frame|X-Content|Strict-Transport|CSP)"

# Tester CORS preflight
curl -X OPTIONS -H "Origin: https://autre.com" -v https://votresite.com/api/endpoint

# Vérifier build output secrets (ne doit rien trouver)
grep -r "sk_live" dist/ || echo "OK: pas de secrets exposés"

# Générer types wrangler
npx wrangler types && npx astro sync
```

### Outils de test externes

|Outil|URL|Usage|
|---|---|---|
|Security Headers|securityheaders.com|Grade A-F headers|
|Mozilla Observatory|observatory.mozilla.org|Audit complet|
|CSP Evaluator|csp-evaluator.withgoogle.com|Validation CSP|

---

## Références pour approfondir

|Domaine|Source officielle|
|---|---|
|CSP expérimentale|docs.astro.build/en/reference/experimental-flags/csp/|
|Variables environnement|docs.astro.build/en/guides/environment-variables/|
|Adapter Cloudflare|docs.astro.build/en/guides/integrations-guide/cloudflare/|
|Cloudflare _headers|developers.cloudflare.com/pages/configuration/headers/|
|Security Advisories|github.com/withastro/astro/security|
|OWASP XSS Prevention|cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html|

---

## Sources et niveaux de confiance

|Source|Tag|Confiance|
|---|---|---|
|Astro Docs (docs.astro.build)|[OFFICIEL]|High|
|Cloudflare Docs (developers.cloudflare.com)|[OFFICIEL]|High|
|GitHub Security Advisories withastro/astro|[OFFICIEL]|High|
|Snyk CVE Database|[OFFICIEL]|High|
|OWASP Cheat Sheets|[OWASP]|High|
|GitHub Issues withastro/astro|[COMMUNAUTAIRE]|Medium|
|Cloudflare Community Forums|[COMMUNAUTAIRE]|Medium|
|Astro-Shield (@kindspells)|[COMMUNAUTAIRE]|Medium|
|eslint-plugin-astro|[COMMUNAUTAIRE]|Medium|
|Comportements inférés/testés|[INFÉRÉ]|Low-Medium|
|Lacunes documentation identifiées|[DOC-GAP]|Variable|

---

**Versions minimales requises** : Astro 5.9.0+ (CSP expérimentale), Astro 5.15.8+ (CVE fixes), Astro 6.0 (CSP stable). Les patterns documentés ici ciblent Astro 5.17+ avec @astrojs/cloudflare.