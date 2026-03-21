# Build and Deployment

Wrangler workflow, CI/CD pipelines, package.json scripts, debugging tools, and VS Code configuration for Astro on Cloudflare Workers.

<quick_reference>
1. Use Workers with Static Assets as deployment target -- Pages is deprecated, Workers is the only supported path
2. Use `cloudflare/wrangler-action@v3` in CI -- not deprecated `pages-action`
3. Set `NODE_VERSION=22` in CI environment -- required for Astro 6.x ES2024 features
4. Run `astro check` before `astro build` in CI -- catches .astro template type errors that `tsc` misses
5. Run `astro sync` after schema changes -- regenerates `.astro/types.d.ts` for Content Collections, Actions, env
6. `astro dev` runs on workerd natively -- no `platformProxy` needed, Cloudflare bindings work out of the box
7. `astro preview` runs on workerd natively -- production-like Workers runtime, replaces `wrangler pages dev`
8. Use `imageService: 'cloudflare-binding'` in adapter -- uses Cloudflare Images binding for on-demand transforms
9. No `main` field needed in wrangler.jsonc -- adapter auto-configures the Worker entry point
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
| New project (2026+) | Workers with Static Assets | Only supported Cloudflare target, Pages is deprecated |
| Existing Pages project | Migrate to Workers | Pages deprecated April 2025 -- plan migration |
| Need PR preview URLs | Workers + `wrangler versions upload` | Use Workers versioned deploys for preview environments |
| Durable Objects / Queues | Workers | Advanced Workers features require Workers target |

See cloudflare-platform.md for wrangler.jsonc template and Workers runtime constraints.
</deployment_target_decision_matrix>
<dev_preview_workflow_matrix>
| Command | Runtime | Use When |
|---------|---------|----------|
| `astro dev` | workerd (native) + Vite HMR | Daily development -- full Cloudflare bindings available natively |
| `astro preview` | workerd (native) | Production-like testing after build -- validates Workers behavior |
| `wrangler tail` | production | Stream live production logs for debugging deployed Workers |

**Astro 6 change:** Both `astro dev` and `astro preview` run on workerd natively. No `platformProxy` configuration needed -- Cloudflare bindings (KV/D1/R2) are available out of the box in dev and preview. The `wrangler pages dev` command is no longer needed.
</dev_preview_workflow_matrix>
<package_json_scripts>
```json
// package.json -- complete script set for Astro 6 / Cloudflare Workers
{
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "wrangler types && astro check && tsc --noEmit && astro build",
    "preview": "wrangler types && astro build && astro preview",
    "typecheck": "wrangler types && astro sync && astro check && tsc --noEmit",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "deploy": "npm run build && wrangler deploy",
    "lint": "astro check && eslint .",
    "format": "prettier --write ."
  }
}
```

**Script pipeline order:**
- `dev`: Generate Cloudflare types first, then start Astro dev server (workerd + HMR)
- `build`: Generate types, type-check `.astro` files, type-check `.ts` files, then build
- `preview`: Generate types, build first (required), then serve with workerd runtime via `astro preview`
- `typecheck`: Generate Cloudflare types, sync Astro types, then check both `.astro` and `.ts` files
- `deploy`: Full build pipeline, then deploy to Cloudflare Workers
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

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

**Deploy behavior:** Uses `wrangler deploy` which reads the output directory from wrangler.jsonc. Set `ASTRO_KEY` secret in GitHub Actions for Server Islands. For preview environments, use `wrangler versions upload` with Workers versioned deploys.

> **Cloudflare MCP:** For full wrangler-action options, query `mcp__cloudflare__search_cloudflare_documentation` with `"Cloudflare wrangler-action GitHub Actions deploy"`.
</github_actions_ci_cd>
<adapter_options>
| Option | Default | Purpose |
|--------|---------|---------|
| `imageService` | `'cloudflare-binding'` | Image processing: `'cloudflare-binding'` (Images binding), `'compile'` (build-time), `'passthrough'` (none) |
| `configPath` | `undefined` | Path to wrangler config file (e.g., `'wrangler.jsonc'`) -- auto-detected if omitted |
| `persistState` | `true` | Persist local binding data (KV/D1/R2) between dev sessions |
| `prerenderEnvironment` | `'node'` | Environment for prerendering: `'node'` (default) or `'workerd'` |
| `sessionKVBindingName` | `'SESSION'` | KV binding name for Astro Sessions on Cloudflare |
| `imagesBindingName` | `'IMAGES'` | Workers Images binding name for `imageService: 'cloudflare-binding'` |
| `remoteBindings` | `undefined` | Use remote (production) bindings during local dev instead of local emulation |
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
| `astro preview` | `--inspect` | Enable Chrome DevTools debugging on workerd |
| `wrangler tail` | -- | Stream live production logs |
| `wrangler types` | -- | Generate Cloudflare binding types from wrangler config |

> **Cloudflare MCP:** For complete wrangler CLI reference, query `mcp__cloudflare__search_cloudflare_documentation` with `"Wrangler CLI commands reference"`.
</cli_flags_reference>
<debugging_workflow>
```bash
# 1. Build without minification for debugging
VITE_MINIFY=false astro build

# 2. Start preview with Chrome DevTools inspector (workerd native)
astro preview --inspect

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
| `output: 'hybrid'` in config | `output: 'static'` + per-page `prerender = false` | CRITICAL |
| `cloudflare/pages-action` in CI | `cloudflare/wrangler-action@v3` with `wrangler deploy` | CRITICAL |
| Sharp or node-canvas in project | `imageService: 'cloudflare-binding'` or `'passthrough'` in adapter | CRITICAL |
| `process.env.VAR` for runtime secrets | `import { env } from 'cloudflare:workers'` then `env.VAR` | HIGH |
| `wrangler pages dev` to test Workers | `astro preview` after build -- runs workerd natively | HIGH |
| `platformProxy` in adapter config | Remove -- Astro 6 uses workerd natively, no proxy needed | HIGH |
| `/functions` directory in project | Astro API routes via `src/pages/api/` -- adapter disables functions dir | HIGH |
| Bundle > 10MB compressed (paid) / 3MB (free) | Audit deps, use `manualChunks`, run `npx vite-bundle-visualizer` | HIGH |
| Import `'buffer'` without `node:` prefix | Import `'node:buffer'` with prefix -- Workers requires `node:` prefix | HIGH |
| `main` field in wrangler.jsonc | Remove -- adapter auto-configures Worker entry point | MEDIUM |
| Skip `astro check` in CI pipeline | Add `astro check &&` before `astro build` in build script | MEDIUM |
| Manual `wrangler deploy` commands in CI | Use `wrangler-action@v3` for caching, secrets, consistent deploys | MEDIUM |
| `import.meta.env` for Cloudflare runtime vars | `import { env } from 'cloudflare:workers'` for SSR, `import.meta.env` for build-time only | MEDIUM |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Could not resolve "node:fs"` at runtime | Workers has no native fs module | Use Cloudflare storage APIs (KV/R2/D1), add `nodejs_compat` flag |
| `Could not load the "sharp" module` | Sharp incompatible with Workers | Set `imageService: 'cloudflare-binding'` or `'passthrough'` in adapter |
| `Script exceeded size limit` (bundle > 10MB) | Too many dependencies bundled | Run `npx vite-bundle-visualizer`, configure `manualChunks` in Vite config |
| `SyntaxError: Unexpected token 'with'` in CI | Node.js version < 22 | Set `NODE_VERSION=22` environment variable in CI |
| `astro check` errors in CI but `tsc` passes | `.astro` files ignored by `tsc` | Normal -- `astro check` is the correct tool, ensure `astro sync` runs first |
| Bindings (KV/D1/R2) undefined in dev | Wrangler config not found | Ensure `wrangler.jsonc` exists at project root or set `configPath` in adapter |
| `Hydration completed but contains mismatches` | Cloudflare Auto Minify strips HTML comments | Disable Auto Minify in Cloudflare Dashboard > Speed > Optimization |
| Deploy succeeds but pages return 404 | Wrong output directory or missing adapter | Verify `dist` directory and adapter in `astro.config.mjs` |
| `ASTRO_KEY` error for Server Islands | Missing encryption key for rolling deploys | Run `astro create-key`, add result to CI and Cloudflare env vars |
| Build passes but runtime errors in production | Not tested with workerd runtime | Use `astro preview` for production-like testing before deploy |
| ESLint errors on `.astro` files | Missing `eslint-plugin-astro` + parser config | Install plugin, use `eslintPluginAstro.configs['flat/recommended']` (ESLint v9) |
| `platformProxy` errors after Astro 6 upgrade | `platformProxy` option removed in adapter v13 | Remove `platformProxy` from adapter config -- workerd is native now |
</troubleshooting>
