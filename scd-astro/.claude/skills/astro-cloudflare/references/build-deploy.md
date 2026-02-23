# Build and Deployment

Wrangler workflow, CI/CD pipelines, package.json scripts, debugging tools, and VS Code configuration for Astro on Cloudflare Workers.

<quick_reference>
1. Use Workers with Static Assets as default deployment target -- Pages deprecated April 2025
2. Use `cloudflare/wrangler-action@v3` in CI -- not deprecated `pages-action`
3. Set `NODE_VERSION=22` in CI environment -- required for Astro 5.x ES2024 features
4. Run `astro check` before `astro build` in CI -- catches .astro template type errors that `tsc` misses
5. Run `astro sync` after schema changes -- regenerates `.astro/types.d.ts` for Content Collections, Actions, env
6. Enable `platformProxy: { enabled: true }` in adapter -- required for local dev with Cloudflare bindings
7. Use `imageService: 'compile'` in adapter -- Sharp is incompatible with Workers runtime
8. Use `wrangler pages dev ./dist` for production-like preview -- `astro preview` does NOT use Workers runtime
9. Create `.assetsignore` in `public/` with `_worker.js` and `_routes.json` -- prevents Workers Static Assets upload errors
10. Generate `ASTRO_KEY` with `astro create-key` for Server Islands in production -- required for rolling deploys
11. Never use `output: 'hybrid'` -- removed in Astro 5.0, use per-page `export const prerender = false` instead
12. Run `wrangler types` before `astro dev` -- generates Cloudflare binding type definitions for autocompletion
</quick_reference>
<output_mode_decision_matrix>
| Scenario | Config | Key Setting |
|----------|--------|-------------|
| Full static site, no SSR | `output: 'static'` (default), no adapter | Pure static build, deploy anywhere |
| Static-first with few SSR pages | `output: 'static'` + cloudflare adapter | `export const prerender = false` on SSR pages |
| Full SSR application | `output: 'server'` + cloudflare adapter | `export const prerender = true` on static pages |
| Server Islands required | `output: 'server'` + `ASTRO_KEY` env var | Server Islands require server mode + key for rolling deploys |
| API-only endpoints | `output: 'server'` + cloudflare adapter | API routes are SSR by default in server mode |
| Mixed content site | `output: 'static'` + cloudflare adapter | Blog pages static, dashboard pages `prerender = false` |

See rendering-modes.md for full rendering mode decision matrix and Server Islands architecture.
</output_mode_decision_matrix>
<deployment_target_decision_matrix>
| Situation | Target | Why |
|-----------|--------|-----|
| New project (2025+) | Workers with Static Assets | Cloudflare recommended path, unified platform |
| Existing Pages project | Keep Pages (`pages_build_output_dir`) | Migration not urgent, Pages still supported |
| Need PR preview URLs | Pages deploy with `--branch=` flag | Automatic `<branch>.<project>.pages.dev` URLs |
| Durable Objects / Queues | Workers only | Pages does not support advanced Workers features |

See cloudflare-platform.md for wrangler.jsonc template and Workers runtime constraints.
</deployment_target_decision_matrix>
<dev_preview_workflow_matrix>
| Command | Runtime | Use When |
|---------|---------|----------|
| `astro dev` | Node.js + Vite HMR | Daily frontend development, fast iteration |
| `astro dev` + `platformProxy: true` | Node.js + emulated bindings | Dev with KV/D1/R2 bindings (not full Workers runtime) |
| `wrangler pages dev ./dist` | workerd (production-like) | Testing SSR behavior before deploy, binding integration |
| `astro preview` | Node.js (no Workers) | Static-only sites without Cloudflare bindings |

**Critical distinction:** `astro preview` starts a Node.js server -- it does NOT simulate Cloudflare Workers. Code that passes in `astro preview` may fail at runtime on Workers (missing `node:fs`, Sharp errors, `process.env` undefined). Always validate SSR behavior with `wrangler pages dev ./dist`.
</dev_preview_workflow_matrix>
<package_json_scripts>
```json
// package.json -- complete script set for Astro/Cloudflare
{
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "wrangler types && astro check && tsc --noEmit && astro build",
    "preview": "astro build && wrangler pages dev dist",
    "typecheck": "astro sync && astro check && tsc --noEmit",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "deploy": "npm run build && wrangler pages deploy dist",
    "lint": "astro check && eslint .",
    "format": "prettier --write ."
  }
}
```

**Script pipeline order:**
- `dev`: Generate Cloudflare types first, then start Astro dev server with HMR
- `build`: Generate types, type-check `.astro` files, type-check `.ts` files, then build
- `preview`: Build first (required), then serve with Workers runtime
- `typecheck`: Sync types first, then check both `.astro` and `.ts` files
- `deploy`: Full build pipeline, then deploy to Cloudflare
</package_json_scripts>
<github_actions_ci_cd>
```yaml
# .github/workflows/deploy.yml -- CI/CD with wrangler-action@v3
name: Deploy
on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Cache Astro artifacts
        uses: actions/cache@v4
        with:
          path: node_modules/.astro
          key: astro-${{ hashFiles('src/**') }}

      - run: npm ci
      - run: npm run build
        env:
          NODE_OPTIONS: "--max-old-space-size=4096"

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=my-site --branch=${{ github.head_ref || 'main' }}
```

**Branch preview behavior:** The `--branch=` flag creates preview URLs automatically. Push to `main` deploys to production. Pull request branches get `<branch>.<project>.pages.dev` URLs. Set `ASTRO_KEY` secret in GitHub Actions for Server Islands.

> **Cloudflare MCP:** For full wrangler-action options, query `mcp__cloudflare__search_cloudflare_documentation` with `"Cloudflare wrangler-action GitHub Actions deploy"`.
</github_actions_ci_cd>
<assetsignore_for_workers_static_assets>
```
# public/.assetsignore -- exclude Workers internals from static asset upload
_worker.js
_routes.json
```

Place this file in the `public/` directory. Without it, Workers Static Assets may try to serve `_worker.js` as a static file instead of executing it as the Worker entry point.
</assetsignore_for_workers_static_assets>

<adapter_options>
| Option | Default | Purpose |
|--------|---------|---------|
| `imageService` | `'compile'` | Image processing: `'compile'` (build-time), `'cloudflare'` (Image Resizing), `'passthrough'` (none) |
| `platformProxy.enabled` | `true` | Emulate Cloudflare bindings (KV/D1/R2) during `astro dev` |
| `platformProxy.configPath` | `undefined` | Path to wrangler config file (e.g., `'wrangler.jsonc'`) |
| `platformProxy.persist` | `true` | Persist local binding data between dev sessions |
| `cloudflareModules` | `true` | Enable `.wasm`, `.bin`, `.txt` imports |
| `routes.extend.include` | `[]` | Additional patterns for SSR routing (Pages only) |
| `routes.extend.exclude` | `[]` | Patterns to exclude from SSR routing |
| `sessionKVBindingName` | `'SESSION'` | KV binding name for Astro Sessions on Cloudflare |
</adapter_options>

<cli_flags_reference>
| Command | Flag | Purpose |
|---------|------|---------|
| `astro build` | `--verbose` | Detailed build logging |
| `astro build` | `--devOutput` | Build in dev mode for debugging |
| `astro dev` | `--host` | Expose on network for mobile testing |
| `astro dev` | `--port <n>` | Custom port (default: 4321) |
| `astro dev` | `--force` | Force rebuild Content Layer cache |
| `astro check` | `--watch` | Continuous type-checking mode |
| `astro sync` | -- | Regenerate `.astro/types.d.ts` |
| `astro create-key` | -- | Generate `ASTRO_KEY` for Server Islands |
| `wrangler pages dev ./dist` | `--inspect` | Enable Chrome DevTools debugging |
| `wrangler tail` | -- | Stream live production logs |
| `wrangler types` | -- | Generate Cloudflare binding types from wrangler config |

> **Cloudflare MCP:** For complete wrangler CLI reference, query `mcp__cloudflare__search_cloudflare_documentation` with `"Wrangler CLI commands reference"`.
</cli_flags_reference>
<debugging_workflow>
```bash
# 1. Build without minification for debugging
VITE_MINIFY=false astro build

# 2. Start wrangler with Chrome DevTools inspector
wrangler pages dev ./dist --inspect

# 3. Connect Chrome DevTools
# Navigate to chrome://inspect in Chrome
# Click "inspect" on the worker target

# 4. Stream live production logs (real-time)
wrangler tail

# 5. Query local D1 database
wrangler d1 execute DB --local --command "SELECT * FROM users"

# 6. List local KV keys
wrangler kv:key list --binding KV --local
```

**Debugging config in astro.config.mjs:**

```javascript
// astro.config.mjs -- conditional debugging settings
export default defineConfig({
  vite: {
    build: {
      minify: process.env.DEBUG === 'true' ? false : 'esbuild',
      sourcemap: true,
    },
  },
});
```

> **Cloudflare MCP:** For Chrome DevTools integration details, query `mcp__cloudflare__search_cloudflare_documentation` with `"Wrangler dev inspect debugging Workers"`.
</debugging_workflow>
<vs_code_configuration>
```jsonc
// .vscode/settings.json -- recommended for Astro development
{
  "[astro]": {
    "editor.defaultFormatter": "astro-build.astro-vscode"
  },
  "eslint.validate": ["javascript", "typescript", "astro"],
  "tailwindCSS.includeLanguages": { "astro": "html" },
  "tailwindCSS.classAttributes": ["class", "className", "class:list"],
  "typescript.inlayHints.parameterNames.enabled": "literals",
  "debug.javascript.autoAttachFilter": "smart"
}
```

**Required VS Code extensions:**
- `astro-build.astro-vscode` -- Astro language support, embedded Prettier for `.astro` files
- `dbaeumer.vscode-eslint` -- ESLint validation including `.astro` files
- `bradlc.vscode-tailwindcss` -- Tailwind IntelliSense (requires `includeLanguages` config above)

**Debugging tip:** Extract complex logic from `.astro` frontmatter into `.ts` files -- VS Code breakpoints do not work in `.astro` frontmatter sections. Use `debugger` statements as alternative.
</vs_code_configuration>
<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| `output: 'hybrid'` in Astro 5 config | `output: 'static'` + per-page `prerender = false` | CRITICAL |
| `cloudflare/pages-action` in CI | `cloudflare/wrangler-action@v3` with `pages deploy` | CRITICAL |
| Sharp or node-canvas in project | `imageService: 'compile'` or `'passthrough'` in adapter | CRITICAL |
| `process.env.VAR` for runtime secrets | `locals.runtime.env.VAR` on Cloudflare Workers | HIGH |
| `astro preview` to test Workers behavior | `wrangler pages dev ./dist` after build | HIGH |
| `/functions` directory in project | Astro API routes via `src/pages/api/` -- adapter disables functions dir | HIGH |
| Bundle > 10MB compressed (paid) / 3MB (free) | Audit deps, use `manualChunks`, run `npx vite-bundle-visualizer` | HIGH |
| Import `'buffer'` without `node:` prefix | Import `'node:buffer'` with prefix -- Workers requires `node:` prefix | HIGH |
| Skip `astro check` in CI pipeline | Add `astro check &&` before `astro build` in build script | MEDIUM |
| Manual `wrangler deploy` commands in CI | Use `wrangler-action@v3` for caching, secrets, consistent deploys | MEDIUM |
| `import.meta.env` for Cloudflare runtime vars | `Astro.locals.runtime.env` for SSR, `import.meta.env` for build-time only | MEDIUM |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Could not resolve "node:fs"` at runtime | Workers has no native fs module | Use Cloudflare storage APIs (KV/R2/D1), add `nodejs_compat` flag |
| `Could not load the "sharp" module` | Sharp incompatible with Workers | Set `imageService: 'compile'` or `'passthrough'` in adapter |
| `Script exceeded size limit` (bundle > 10MB) | Too many dependencies bundled | Run `npx vite-bundle-visualizer`, configure `manualChunks` in Vite config |
| `SyntaxError: Unexpected token 'with'` in CI | Node.js version < 22 | Set `NODE_VERSION=22` environment variable in CI |
| `astro check` errors in CI but `tsc` passes | `.astro` files ignored by `tsc` | Normal -- `astro check` is the correct tool, ensure `astro sync` runs first |
| Bindings (KV/D1/R2) undefined in dev | `platformProxy` not configured | Add `platformProxy: { enabled: true }` in adapter config |
| `Hydration completed but contains mismatches` | Cloudflare Auto Minify strips HTML comments | Disable Auto Minify in Cloudflare Dashboard > Speed > Optimization |
| Deploy succeeds but pages return 404 | Wrong output directory or missing adapter | Verify `dist` directory and adapter in `astro.config.mjs` |
| `ASTRO_KEY` error for Server Islands | Missing encryption key for rolling deploys | Run `astro create-key`, add result to CI and Cloudflare env vars |
| Build passes but runtime errors in production | Tested with `astro preview` (Node.js), not Workers | Use `wrangler pages dev ./dist` for production-like testing |
| ESLint errors on `.astro` files | Missing `eslint-plugin-astro` + parser config | Install plugin, use `eslintPluginAstro.configs['flat/recommended']` (ESLint v9) |
| `Uploading _worker.js as asset` error | Workers internals exposed as static files | Create `public/.assetsignore` with `_worker.js` and `_routes.json` |
</troubleshooting>
