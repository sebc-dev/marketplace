# Security and Advanced Patterns

CSP, auth middleware, Actions security, secrets management, and MDX/Markdoc advanced setup (remark/rehype plugins, custom components, Markdoc tags, Shiki dual themes) on Cloudflare Workers.

<quick_reference>
1. Add security headers via middleware for SSR routes -- `_headers` file is ignored for dynamic Worker responses
2. Never use `set:html` on user-provided content -- bypasses all escaping, use `xss` library to sanitize first
3. Access secrets via `locals.runtime.env.SECRET` on Workers -- `import.meta.env.SECRET` is undefined at SSR runtime
4. Use `xss` (js-xss) library for HTML sanitization on Workers -- DOMPurify requires jsdom, incompatible with workerd
5. `checkOrigin: true` is default in Astro 5 but does NOT protect JSON API endpoints -- only form submissions
6. `experimental.csp` config is incompatible with ClientRouter (View Transitions) -- use middleware CSP instead
7. `frame-ancestors` directive only works via HTTP header, not `<meta>` CSP tag -- set in middleware
8. Guard `runtime.env` access in middleware: `if (!locals.runtime?.env) return next()` -- undefined during prerender
9. Configure remark/rehype plugins in `markdown.*` only -- MDX inherits automatically, do NOT duplicate in `mdx()` config
10. Place `rehypeHeadingIds` before `rehypeAutolinkHeadings` in plugin array -- IDs must exist before autolink runs
11. Set `defaultColor: false` in shikiConfig for CSS-driven dual theme switching -- not `'dark'` or `'light'`
12. Target `.astro-code` not `.shiki` for Shiki code block CSS styling in Astro 5
13. Use `file.data.astro.frontmatter` in remark plugins to access/modify frontmatter -- not `file.data.matter`
14. Use `{/* JSX comment */}` in MDX files -- HTML comments `<!-- -->` cause parsing errors
</quick_reference>
<security_decision_matrix>
| Deployment Mode | CSP | CSRF | Headers | Secrets |
|-----------------|-----|------|---------|---------|
| SSG (pure static) | `experimental.csp` + `_headers` for `frame-ancestors` | N/A (no mutations) | `_headers` file | Build-time `import.meta.env` |
| Static default + SSR opt-out | `experimental.csp` + middleware for SSR pages | `checkOrigin` (default) | `_headers` static + middleware SSR | `astro:env` + `locals.runtime.env` |
| Full SSR | Middleware header or `experimental.csp` | `checkOrigin` + session auth for Actions | Middleware exclusively | `locals.runtime.env` |
</security_decision_matrix>
<security_headers_middleware>
```typescript
// src/middleware.ts -- security headers + CORS for SSR routes
import { defineMiddleware, sequence } from 'astro:middleware';

const securityHeaders = defineMiddleware(async (context, next) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'https://yoursite.com',
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
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');

  return new Response(response.body, { status: response.status, headers });
});
```
</security_headers_middleware>
<auth_middleware_pattern>
```typescript
// src/middleware.ts -- cookie-based session auth (extends routing-navigation.md stub)
const auth = defineMiddleware(async ({ locals, cookies, url, redirect }, next) => {
  if (!locals.runtime?.env) return next(); // Prerender guard

  const token = cookies.get('session')?.value;
  if (token) {
    locals.user = await verifySession(token, locals.runtime.env.SESSION);
  } else {
    locals.user = null;
  }

  if (url.pathname.startsWith('/app/') && !locals.user) {
    return redirect('/login', 302);
  }

  return next();
});

export const onRequest = sequence(securityHeaders, auth);
```
</auth_middleware_pattern>
<actions_security_pattern>
```typescript
// src/actions/index.ts -- Zod validation + xss sanitization for Workers
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import xss from 'xss';

const sanitize = (str: string) => xss(str, { whiteList: {}, stripIgnoreTag: true });

export const server = {
  submitContact: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email(),
      message: z.string().min(10).max(1000).transform(sanitize),
    }),
    handler: async (input, ctx) => {
      const db = ctx.locals.runtime.env.DB;
      // input.message is validated AND sanitized
      return { success: true };
    },
  }),
};

// Note: checkOrigin validates form submissions only.
// For JSON API endpoints, add manual CSRF token verification.
```
</actions_security_pattern>
<secrets_management>
```javascript
// astro.config.mjs -- astro:env schema for typed secrets
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  env: {
    validateSecrets: true,
    schema: {
      STRIPE_SECRET: envField.string({ context: 'server', access: 'secret' }),
      PUBLIC_API_URL: envField.string({ context: 'client', access: 'public' }),
    },
  },
});
```

```typescript
// src/pages/api/charge.ts -- accessing secrets on Workers
import type { APIContext } from 'astro';
export const prerender = false;

export async function POST({ locals }: APIContext) {
  // Use locals.runtime.env for Cloudflare secrets, not import.meta.env
  const stripeKey = locals.runtime.env.STRIPE_SECRET;
  // .dev.vars for local dev, wrangler secret put for production
  // See cloudflare-platform.md for .dev.vars setup
  return Response.json({ ok: true });
}
```

> **Cloudflare MCP:** For secrets CLI and API details, query `mcp__cloudflare__search_cloudflare_documentation` with `"Cloudflare Workers secrets wrangler secret put"`.
</secrets_management>
<csp_config>
```javascript
// astro.config.mjs -- experimental CSP (Astro 5.9+)
export default defineConfig({
  experimental: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "connect-src 'self'",
      ],
      scriptDirective: {
        resources: ["'self'"],
        strictDynamic: false,
      },
    },
  },
});

// INCOMPATIBLE with ClientRouter (View Transitions).
// If using ClientRouter, set CSP via middleware headers instead.
// frame-ancestors only works via HTTP header, not <meta> CSP tag.
```
</csp_config>
<remark_rehype_plugin_config>
```javascript
// astro.config.mjs -- markdown.* config with correct plugin ordering
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs';

export default defineConfig({
  integrations: [mdx()], // Inherits from markdown.*, no plugins here
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false, // CSS-driven theme switching
    },
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      rehypeHeadingIds,          // MUST be before autolink -- IDs injected after user plugins by default
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
});
```
</remark_rehype_plugin_config>
<custom_component_mapping>
```astro
---
// src/pages/blog/[id].astro -- MDX component overrides
import { getCollection, render } from 'astro:content';
import Heading from '../../components/Heading.astro';
import Blockquote from '../../components/Blockquote.astro';

export const prerender = true;

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map(post => ({ params: { id: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content, headings, remarkPluginFrontmatter } = await render(post);
---
<p>{remarkPluginFrontmatter.minutesRead}</p>
<Content components={{ h2: Heading, blockquote: Blockquote }} />
```

Components passed via `components={{}}` override native HTML elements rendered from Markdown. Each component receives the element's attributes as props and children via `<slot />`.
</custom_component_mapping>
<markdoc_custom_tags>
```javascript
// markdoc.config.mjs -- custom tag definitions with component() helper
import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  tags: {
    callout: {
      render: component('./src/components/Callout.astro'),
      attributes: {
        type: { type: String, default: 'note' },
        title: { type: String },
      },
    },
  },
  nodes: {
    blockquote: {
      render: component('./src/components/Blockquote.astro'),
    },
  },
});

// Usage in .mdoc file:
// {% callout type="warning" title="Important" %}
// Content here
// {% /callout %}
```
</markdoc_custom_tags>
<shiki_dual_theme_css>
```css
/* src/styles/code.css -- target .astro-code not .shiki */
.astro-code {
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

@media (prefers-color-scheme: dark) {
  .astro-code,
  .astro-code span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
  }
}

/* Or via class toggle for manual theme switching */
html.dark .astro-code,
html.dark .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```
Requires `defaultColor: false` in shikiConfig. Without it, Shiki applies the light theme inline and CSS variables are not generated.
</shiki_dual_theme_css>
<custom_remark_plugin>
```javascript
// src/plugins/remark-reading-time.mjs -- frontmatter access pattern
import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
  return function (tree, file) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    // Use file.data.astro.frontmatter -- not file.data.matter
    file.data.astro.frontmatter.minutesRead = readingTime.text;
  };
}

// Access in template:
// const { remarkPluginFrontmatter } = await render(entry);
// remarkPluginFrontmatter.minutesRead -> "3 min read"
```
</custom_remark_plugin>
<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| `import.meta.env.SECRET` on Workers SSR | `locals.runtime.env.SECRET` | CRITICAL |
| `set:html` on user-provided content | Sanitize with `xss` library first | CRITICAL |
| `unsafe-inline` in CSP script-src | Use `experimental.csp` for automatic hashes | CRITICAL |
| `_headers` for SSR security headers | Middleware -- `_headers` ignored for Worker responses | HIGH |
| DOMPurify or sanitize-html on Workers | `xss` (js-xss) -- no jsdom dependency | HIGH |
| Duplicate remarkPlugins in `markdown.*` AND `mdx()` | Configure in `markdown.*` only -- MDX inherits | HIGH |
| HTML comments `<!-- -->` in MDX files | `{/* JSX comment */}` -- avoids parsing errors | HIGH |
| `.shiki` CSS class target | `.astro-code` class in Astro 5 | HIGH |
| `CORS: *` with `credentials: 'include'` | Specific origin in `Access-Control-Allow-Origin` | MEDIUM |
| Sourcemaps enabled in production | `sourcemap: false` (default) -- exposes source code | MEDIUM |
| `defaultColor: 'dark'` for Shiki dual themes | `defaultColor: false` for CSS variable switching | MEDIUM |
| `file.data.matter` in remark plugins | `file.data.astro.frontmatter` in Astro | MEDIUM |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| CSP blocks inline scripts in production | Cloudflare Auto Minify modifies script hashes | Disable Auto Minify in dashboard (Speed > Optimization) |
| `_headers` rules not applied to SSR route | Expected: `_headers` only applies to static assets | Add headers via middleware for Worker responses |
| CORS preflight returns 404 | Missing OPTIONS handler in middleware | Add explicit `request.method === 'OPTIONS'` check |
| Shiki theme unchanged after config edit | Content Collections cache stale | Delete `.astro/data-store.json` and restart dev |
| MDX parsing error on `<Component />` | Missing import or HTML comment syntax `<!-- -->` | Add import statement or use `{/* comment */}` |
| Markdoc `{% tag %}` not rendering | Tag not defined in markdoc.config.mjs | Add tag definition with `component()` helper |
| Heading autolinks broken | `rehypeHeadingIds` not before `rehypeAutolinkHeadings` | Reorder: `rehypeHeadingIds` first in rehypePlugins array |
| `import.meta.env.SECRET` is undefined | On Workers SSR, secrets not in `import.meta.env` | Use `locals.runtime.env.SECRET` instead |
| `xss is not a function` | Wrong import syntax | Use `import xss from 'xss'` (default export) |
| `checkOrigin` error on JSON POST from another origin | `checkOrigin` only validates form submissions | Add manual CSRF token verification for JSON endpoints |
</troubleshooting>
