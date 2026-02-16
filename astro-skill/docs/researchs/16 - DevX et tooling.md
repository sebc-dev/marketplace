# Developer Experience Astro 5.17+ sur Cloudflare : Guide Complet

L'écosystème Astro 5.17+ avec déploiement Cloudflare exige une configuration précise pour maximiser la productivité. **La parité dev/production reste le défi majeur** : `astro dev` tourne sur Node.js tandis que la production utilise l'environnement workerd de Cloudflare. Ce guide fournit les patterns éprouvés, les anti-patterns documentés et les workflows optimisés pour créer un skill Claude Code efficace.

---

## 1. Quick Reference (pour SKILL.md)

1. **Toujours exécuter `wrangler types && astro dev`** pour générer les types Cloudflare avant le développement — garantit l'autocomplétion de `Astro.locals.runtime.env` [OFFICIEL, Confiance: Élevée]
    
2. **Configurer `platformProxy.enabled: true`** dans l'adapter Cloudflare pour émuler les bindings (KV, D1, R2) en local — seule méthode pour tester les bindings sans `wrangler dev` [OFFICIEL, Confiance: Élevée]
    
3. **Accéder aux variables d'environnement via `Astro.locals.runtime.env`**, jamais `import.meta.env` pour les valeurs runtime Cloudflare — `import.meta.env` ne fonctionne qu'au build-time [OFFICIEL, Confiance: Élevée]
    
4. **Ajouter `nodejs_compat` dans `compatibility_flags`** du wrangler.json avec une `compatibility_date` récente (≥2024-09-23) — requis pour les APIs Node.js polyfillées [OFFICIEL, Confiance: Élevée]
    
5. **Extraire la logique complexe du frontmatter `.astro` vers des fichiers `.ts`** pour le debugging — les breakpoints VS Code ne fonctionnent pas dans le code frontmatter [COMMUNAUTAIRE, Confiance: Élevée]
    
6. **Configurer `editor.defaultFormatter: "astro-build.astro-vscode"`** pour les fichiers `.astro` — l'extension embarque Prettier, évite les conflits [OFFICIEL, Confiance: Élevée]
    
7. **Placer `prettier-plugin-tailwindcss` en dernier** dans l'array `plugins` de `.prettierrc` — l'ordre est critique pour le formatage correct [OFFICIEL, Confiance: Élevée]
    
8. **Exécuter `astro check` avant chaque commit** et dans la CI — seul moyen de type-checker les fichiers `.astro` (`tsc` les ignore) [OFFICIEL, Confiance: Élevée]
    
9. **Tester avec `astro build && wrangler dev`** avant déploiement — `astro preview` n'utilise pas le runtime Cloudflare [OFFICIEL, Confiance: Élevée]
    
10. **Garder les secrets dans `.dev.vars`** (gitignored), les variables non-sensibles dans `wrangler.toml [vars]` — séparation sécurité/configuration [OFFICIEL, Confiance: Élevée]
    
11. **Utiliser `vite.esbuild.drop: ['debugger']`** en config pour supprimer automatiquement les `debugger` statements en production [INFÉRÉ, Confiance: Moyenne]
    
12. **Créer `.assetsignore` dans `public/`** avec `_worker.js` et `_routes.json` — évite l'erreur d'upload Pages [COMMUNAUTAIRE, Confiance: Élevée]
    
13. **Garder l'accès à `context.locals.runtime?.env`** dans middleware avec optional chaining — évite les erreurs lors du prerendering [COMMUNAUTAIRE, Confiance: Élevée]
    
14. **Configurer `devToolbar.placement: 'bottom-left'`** si des widgets (chat, cookies) masquent la toolbar — nouvelle option Astro 5.17.0 [OFFICIEL, Confiance: Élevée]
    
15. **Utiliser ESLint v9 flat config** avec `eslintPluginAstro.configs['flat/recommended']` — syntaxe actuelle recommandée [OFFICIEL, Confiance: Élevée]
    

---

## 2. Decision Matrix

|Situation|Approche Astro 5.17+ / Cloudflare|Raison|Confiance|
|---|---|---|---|
|Développement quotidien frontend|`wrangler types && astro dev` avec `platformProxy: true`|HMR rapide + émulation bindings|[OFFICIEL] Élevée|
|Test d'intégration Cloudflare|`astro build && wrangler dev`|Runtime workerd réel, parité production|[OFFICIEL] Élevée|
|Debugging SSR server-side|VS Code Debug Terminal + `debugger` statements|Breakpoints .astro non supportés|[COMMUNAUTAIRE] Élevée|
|Debugging client-side|Chrome DevTools + extensions framework (React/Vue DevTools)|Source maps générées automatiquement|[OFFICIEL] Élevée|
|Debugging CSS en live|`experimental.chromeDevtoolsWorkspace: true` + Chrome Workspaces|Sauvegarde directe vers fichiers sources|[OFFICIEL] Moyenne|
|Type-checking pré-commit|`astro check` (pas `tsc`)|Seul outil qui parse les fichiers .astro|[OFFICIEL] Élevée|
|Formatting `.astro`|Extension VS Code Astro (Prettier intégré)|Évite conflits, config centralisée|[OFFICIEL] Élevée|
|Formatting CLI/CI|`prettier` + `prettier-plugin-astro` installés séparément|L'extension ne tourne pas en headless|[OFFICIEL] Élevée|
|Preview avant déploiement|`wrangler pages dev ./dist` (Pages) ou `wrangler dev` (Workers)|`astro preview` = Node.js, pas workerd|[OFFICIEL] Élevée|
|Variables d'env secrets locaux|Fichier `.dev.vars`|Gitignored par défaut, pattern Cloudflare standard|[OFFICIEL] Élevée|
|Variables d'env non-secrets|`wrangler.toml` section `[vars]`|Versionnable, visible en config|[OFFICIEL] Élevée|
|Diagnostic islands/hydratation|Dev Toolbar → Inspect App|Visualise directives `client:*` et props|[OFFICIEL] Élevée|
|HMR lent sur gros projet|`vite.optimizeDeps.include` pour forcer pre-bundling|Évite re-bundling à chaque reload|[INFÉRÉ] Moyenne|
|Images Sharp incompatibles|`imageService: 'cloudflare'` ou `'compile'` dans adapter|Sharp non supporté sur Workers|[OFFICIEL] Élevée|

---

## 3. Anti-patterns Table

|❌ Ne pas faire|✅ Alternative Astro 5.17+|Impact|Source|
|---|---|---|---|
|Utiliser `import.meta.env.SECRET` pour runtime Cloudflare|`Astro.locals.runtime.env.SECRET`|Variables undefined en production|[OFFICIEL]|
|Mettre des breakpoints dans le frontmatter `.astro`|Extraire en `.ts` ou utiliser `debugger`|Breakpoints ignorés, debugging impossible|[COMMUNAUTAIRE]|
|Tester avec `astro preview` pour Cloudflare|`astro build && wrangler dev`|Bugs runtime non détectés (Node.js ≠ workerd)|[OFFICIEL]|
|Importer `cloudflare:workers` en dev|Accéder via `Astro.locals.runtime`|Erreur d'import en mode dev|[COMMUNAUTAIRE]|
|Utiliser `prettier/prettier` ESLint rule sur scripts `.astro`|Désactiver pour `**/*.astro/*.js`|Double formatting, conflits|[OFFICIEL]|
|Configurer ESLint avec namespace `javascript` pour inlay hints|Utiliser namespace `typescript`|Astro est TypeScript-only côté tooling|[OFFICIEL]|
|Laisser `output: 'hybrid'` dans config|Supprimer, utiliser `prerender = false` par page|Déprécié Astro 5.0|[OFFICIEL]|
|Utiliser `entry.render()` pour Content Collections|`import { render } from 'astro:content'; render(entry)`|API changée Astro 5.0|[OFFICIEL]|
|Utiliser `slug` dans Content Collections|Utiliser `id`|Propriété renommée Astro 5.0|[OFFICIEL]|
|Accéder `context.locals.runtime.env` sans guard en middleware|`context.locals.runtime?.env` avec optional chaining|Crash lors du prerendering|[COMMUNAUTAIRE]|
|Utiliser Sharp image service|`imageService: 'cloudflare'` ou `'compile'`|Incompatible avec Workers runtime|[OFFICIEL]|
|Ignorer `wrangler types` avant dev|Script `"dev": "wrangler types && astro dev"`|Pas d'autocomplétion pour `env` bindings|[OFFICIEL]|
|Barrel exports pour composants fréquemment modifiés|Imports directs `from './Component.astro'`|HMR cassé, full reload systématique|[COMMUNAUTAIRE]|
|`<ViewTransitions />` dans Astro 5.x|`<ClientRouter />`|Composant renommé|[OFFICIEL]|

---

## 4. Troubleshooting Table

|Symptôme|Cause probable|Fix|Source|
|---|---|---|---|
|`Could not resolve "node:*"` au build|`nodejs_compat` absent ou `compatibility_date` trop ancienne|Ajouter `"compatibility_flags": ["nodejs_compat"]` avec date ≥2024-09-23|[OFFICIEL]|
|`Uploading _worker.js as asset` error|Fichiers _worker.js exposés en assets|Créer `public/.assetsignore` avec `_worker.js` et `_routes.json`|[COMMUNAUTAIRE]|
|`MessageChannel is not defined` (React 19)|React 19 SSR incompatible edge|`vite.resolve.alias: { 'react-dom/server': 'react-dom/server.edge' }` en prod|[COMMUNAUTAIRE]|
|`Cannot read 'env' of undefined` en middleware|Accès à runtime.env pendant prerender|Guard avec `if (!context.isPrerendered && context.locals.runtime?.env)`|[COMMUNAUTAIRE]|
|IntelliSense perdu après création fichier `.ts`|Bug extension VS Code Astro|Recharger la fenêtre VS Code (Cmd/Ctrl+Shift+P → Reload Window)|[COMMUNAUTAIRE]|
|Dev Toolbar invisible|Désactivée ou pas en mode dev|Vérifier `devToolbar.enabled: true` + hover bas de page + pas en preview|[OFFICIEL]|
|HMR déclenche full reload sur CSS|Bug connu Astro 5.x (issue #14196)|Pas de fix, en investigation|[COMMUNAUTAIRE]|
|ESLint erreur `@typescript-eslint/no-unsafe-return` sur JSX|Types JSX manquants|Créer `jsx.d.ts` avec `declare global { namespace JSX { type Element = HTMLElement }}`|[OFFICIEL]|
|Formatting ne fonctionne pas en monorepo|Config Prettier non trouvée|S'assurer que le dossier racine contient `.prettierrc` et ouvrir ce dossier dans VS Code|[COMMUNAUTAIRE]|
|`astro check` rapporte erreurs TypeScript mais `tsc` non|Fichiers `.astro` ignorés par `tsc`|Normal — `astro check` est l'outil correct|[OFFICIEL]|
|Tailwind IntelliSense absent dans `.astro`|Extension pas configurée pour Astro|Ajouter `"tailwindCSS.includeLanguages": { "astro": "html" }`|[OFFICIEL]|
|Variables Cloudflare undefined en dev|`platformProxy` désactivé|Configurer `platformProxy: { enabled: true }` dans adapter|[OFFICIEL]|
|Changements Content Collections pas détectés|Watcher pas configuré pour nouveaux fichiers|Plugin Vite custom pour `server.watcher.add()` sur `src/content/`|[COMMUNAUTAIRE]|
|Extension Astro crashe TypeScript server|Bug extension (issues #850, #861)|Mettre à jour extension, désactiver/réactiver si persiste|[COMMUNAUTAIRE]|
|`workerEntryPoint` ne fonctionne pas en dev|Limitation connue, ne marche qu'en production|Utiliser `wrangler dev` pour tester Durable Objects/Queues|[COMMUNAUTAIRE]|

---

## 5. Code Patterns

### VS Code settings.json recommandé

```jsonc
{
  // Formatter par défaut pour fichiers Astro
  "[astro]": {
    "editor.defaultFormatter": "astro-build.astro-vscode"
  },
  // ESLint pour validation Astro
  "eslint.validate": ["javascript", "typescript", "astro"],
  // Tailwind IntelliSense dans Astro
  "tailwindCSS.includeLanguages": { "astro": "html" },
  "tailwindCSS.classAttributes": ["class", "className", "class:list"],
  // TypeScript inlay hints (optionnel)
  "typescript.inlayHints.parameterNames.enabled": "literals",
  // Auto-attach debugger
  "debug.javascript.autoAttachFilter": "smart"
}
```

### launch.json pour debugging SSR Astro

```jsonc
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Astro: Dev Server",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Astro: Full Stack (Server + Chrome)",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "localhost:([0-9]+)",
        "uriFormat": "http://localhost:%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### eslint.config.mjs (ESLint v9 flat config)

```javascript
import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";

export default tsEslint.config(
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...eslintPluginAstro.configs["flat/recommended"],
  {
    rules: {
      "no-debugger": "error", // Bloque debugger statements
    },
  }
);
```

### .prettierrc avec Astro + Tailwind

```json
{
  "plugins": ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }],
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2
}
```

### astro.config.mjs (devToolbar + server + Cloudflare)

```javascript
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  adapter: cloudflare({
    platformProxy: { enabled: true }, // Émule bindings en dev
    imageService: "cloudflare",
  }),
  devToolbar: { placement: "bottom-left" }, // Évite overlap widgets
  server: { port: 4321, open: true },
  vite: {
    esbuild: { drop: ["debugger"] }, // Supprime debugger en prod
  },
});
```

### package.json scripts DX complet

```json
{
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "wrangler types && astro check && astro build",
    "preview": "astro build && wrangler dev",
    "check": "astro check",
    "check:watch": "astro check --watch",
    "lint": "astro check && eslint .",
    "format": "prettier --write ."
  }
}
```

### src/env.d.ts pour types Cloudflare

```typescript
/// <reference path="../.astro/types.d.ts" />
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    // Ajouter locals custom ici
  }
}
```

### tsconfig.json strict recommandé

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["@cloudflare/workers-types"]
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

---

## 6. Références pour references/

### Liste complète des settings VS Code pour Astro

|Setting|Type|Défaut|Description|
|---|---|---|---|
|`astro.typescript.diagnostics.enabled`|boolean|true|Active/désactive les diagnostics TypeScript|
|`typescript.inlayHints.parameterNames.enabled`|string|"none"|"all", "literals", "none" — hints de paramètres|
|`typescript.inlayHints.functionLikeReturnTypes.enabled`|boolean|false|Affiche types de retour|
|`eslint.validate`|array|[...]|Doit inclure "astro" pour validation|
|`tailwindCSS.includeLanguages`|object|{}|Ajouter `{ "astro": "html" }`|
|`tailwindCSS.classAttributes`|array|[...]|Ajouter "class:list" pour directive Astro|
|`editor.formatOnSave`|boolean|false|Recommandé true pour Astro|
|`files.associations`|object|{}|`{ "*.astro": "astro" }` si non détecté|

### Guide Dev Toolbar App API pour extensions custom Cloudflare

**Structure minimale d'une toolbar app:**

```javascript
// cloudflare-debug-integration.js
export default () => ({
  name: "cloudflare-debug",
  hooks: {
    "astro:config:setup": ({ addDevToolbarApp }) => {
      addDevToolbarApp({
        id: "cloudflare-debug",
        name: "CF Debug",
        icon: '<svg>...</svg>',
        entrypoint: new URL("./toolbar-app.js", import.meta.url),
      });
    },
    "astro:server:setup": ({ toolbar }) => {
      // Communication serveur → client
      toolbar.on("cf-debug:request", async (data) => {
        const status = await checkCloudflareStatus();
        toolbar.send("cf-debug:response", { status });
      });
    },
  },
});

// toolbar-app.js
import { defineToolbarApp } from "astro/toolbar";

export default defineToolbarApp({
  init(canvas, app, server) {
    const btn = document.createElement("button");
    btn.textContent = "Check CF Status";
    btn.onclick = () => server.send("cf-debug:request", {});
    
    server.on("cf-debug:response", ({ status }) => {
      btn.textContent = `Status: ${status}`;
    });
    
    canvas.appendChild(btn);
  },
});
```

### Matrice compatibilité ESLint v8/v9 avec plugins Astro

|Plugin|ESLint v8 (.eslintrc)|ESLint v9 (flat config)|Notes|
|---|---|---|---|
|eslint-plugin-astro|`extends: ["plugin:astro/recommended"]`|`...eslintPluginAstro.configs["flat/recommended"]`|Syntaxe différente|
|@typescript-eslint|`extends: ["plugin:@typescript-eslint/recommended"]`|`...tsEslint.configs.recommended`|Via typescript-eslint package|
|eslint-plugin-jsx-a11y|Via astro plugin|`...eslintPluginAstro.configs["flat/jsx-a11y-recommended"]`|Bundled avec astro plugin|
|prettier|`extends: ["prettier"]`|`import eslintConfigPrettier from "eslint-config-prettier"`|Désactive règles conflictuelles|

**Migration v8 → v9:**

- Renommer `.eslintrc.js` → `eslint.config.mjs`
- Remplacer `extends` par spread d'arrays
- Remplacer `plugins` par imports directs
- Utiliser `tsEslint.config()` pour TypeScript

### Guide debugging avancé Cloudflare Workers avec wrangler

**Workflow complet:**

```bash
# 1. Build optimisé pour debug (pas de minification)
VITE_MINIFY=false astro build

# 2. Lancer wrangler avec inspector
wrangler dev --inspect

# 3. Ouvrir Chrome DevTools
# Naviguer vers chrome://inspect
# Cliquer "inspect" sur le worker

# 4. Pour Pages spécifiquement
wrangler pages dev ./dist --inspect

# 5. Debug D1/KV local
wrangler d1 execute DB --local --command "SELECT * FROM users"
wrangler kv:key list --binding KV --local

# 6. Logs en temps réel (production)
wrangler tail
```

**Configuration astro.config.mjs pour debugging:**

```javascript
export default defineConfig({
  vite: {
    build: {
      minify: process.env.DEBUG === 'true' ? false : 'esbuild',
      sourcemap: true,
    },
  },
});
```

---

## 7. Sources consultées

### Documentation officielle (Confiance: Élevée)

- https://docs.astro.build/en/editor-setup/ — Configuration éditeur Astro
- https://docs.astro.build/en/guides/typescript/ — TypeScript dans Astro
- https://docs.astro.build/en/guides/dev-toolbar/ — Dev Toolbar guide
- https://docs.astro.build/en/reference/dev-toolbar-app-reference/ — API référence toolbar
- https://docs.astro.build/en/reference/configuration-reference/ — Configuration complète
- https://docs.astro.build/en/guides/integrations-guide/cloudflare/ — Adapter Cloudflare
- https://docs.astro.build/en/guides/troubleshooting/ — Debugging officiel
- https://docs.astro.build/en/guides/upgrade-to/v5/ — Migration vers Astro 5
- https://developers.cloudflare.com/workers/runtime-apis/nodejs/ — Node.js APIs Workers

### Blog officiel Astro (Confiance: Élevée)

- https://astro.build/blog/astro-5/ — Annonce Astro 5.0 (décembre 2024)
- https://astro.build/blog/astro-510/ — Astro 5.1 features
- https://astro.build/blog/astro-5140/ — Astro 5.14 features
- https://astro.build/blog/astro-5160/ — Astro 5.16 features

### GitHub (Confiance: Moyenne-Élevée)

- https://github.com/withastro/astro/releases — Changelogs officiels
- https://github.com/withastro/language-tools — Extension VS Code issues
- https://github.com/ota-meshi/eslint-plugin-astro — Plugin ESLint
- https://github.com/withastro/astro/issues/14196 — Bug HMR CSS
- https://github.com/withastro/astro/issues/14251 — Breakpoints .astro

### Communauté technique (Confiance: Moyenne)

- https://ota-meshi.github.io/eslint-plugin-astro/user-guide/ — Guide ESLint Astro
- VS Code Marketplace — Extension Astro documentation

**Versions confirmées:**

- Astro: 5.17.x (février 2026)
- @astrojs/cloudflare: 12.6.x
- eslint-plugin-astro: compatible ESLint v7-v9
- prettier-plugin-astro: compatible Prettier v3
- VS Code Extension: basée sur Volar

---

_Ce guide a été compilé pour alimenter un Claude Code Skill (<500 lignes). Les recommandations sont priorisées par impact DX et validées contre la documentation officielle Astro 5.17+ et Cloudflare à la date du 3 février 2026._