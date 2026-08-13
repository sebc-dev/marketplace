# Reference: pinned SEO sources and their dates

**Load point.** Read this when a rule in `SKILL.md` is being contested, when a claim needs its source
quoted, or to check whether a page has moved since the campaign. The rules themselves are in
`SKILL.md` and are not repeated here; this file carries provenance only.

> **Perishable, and deliberately so.** The `Last updated` dates below were read **in the served page**
> on **2026-08-13**. They are the reference state: any future divergence reads against them. If
> `title-link` or `snippet` ever publishes a numeric threshold, the character rule moves from "tool
> measurement" to "primary source" and this file is wrong. Read the date at the foot of the page
> before quoting it.

- [Google Search Central, the six primary pages](#google-search-central-the-six-primary-pages)
- [Verbatim extracts](#verbatim-extracts)
- [Non-Google sources](#non-google-sources)
- [URLs that do not descend](#urls-that-do-not-descend)

## Google Search Central, the six primary pages

All opened, HTTP 200, path allowed by the host's `robots.txt` (`developers.google.com` blocks only
`/youtube/partner/`).

| Page | `Last updated` | What it carries |
|---|---|---|
| `https://developers.google.com/search/docs/appearance/title-link` | **2025-12-10** | no length limit, truncation to device width, keyword stuffing, same language as content |
| `https://developers.google.com/search/docs/appearance/snippet` | **2026-04-20** | no length limit on meta description, snippet drawn from page content first |
| `https://developers.google.com/search/docs/crawling-indexing/url-structure` | **2025-12-10** | hyphens over underscores, case sensitivity, percent-encoding of non-ASCII |
| `https://developers.google.com/search/docs/crawling-indexing/links-crawlable` | **2025-12-10** | descriptive anchors, crawlable `<a href>` |
| `https://developers.google.com/search/docs/essentials/spam-policies` | **2026-05-15** | keyword stuffing, scaled content abuse |
| `https://developers.google.com/search/docs/fundamentals/creating-helpful-content` | **2025-12-10** | people-first self-assessment |

Two blog posts, same host, on generated content:

- `https://developers.google.com/search/blog/2023/02/google-search-and-ai-content`, on automation
  including AI is not spam per se; using it to manipulate ranking is.
- `https://developers.google.com/search/blog/2024/03/core-update-spam-policies`, the announcement
  that introduced "scaled content abuse".

## Verbatim extracts

Kept so that nobody paraphrases them into a threshold. All collected 2026-08-13.

**No length limit: the two sentences that carry the whole rule.**

```
Also avoid unnecessarily long or verbose text in your <title> elements. While there's no limit
on how long a <title> element can be, the title link is truncated in Google Search results as
needed, typically to fit the device width.
```
*`appearance/title-link`, `Last updated 2025-12-10 UTC`.*

```
There's no limit on how long a meta description can be, but the snippet is truncated in Google
Search results as needed, typically to fit the device width.
```
*`appearance/snippet`, `Last updated 2026-04-20 UTC`.*

**URLs: the three primary rules, word for word.**

```
We recommend separating words in your URLs, when possible. Specifically, we recommend using
hyphens ( - ) instead of underscores ( _ ) to separate words in your URLs, as it helps users and
search engines better identify concepts in the URL.

Like any other HTTP client following IETF STD 66, Google Search's URL handling is case sensitive
(for example, Google treats both /APPLE and /apple as distinct URLs with their own content).

Additionally, characters in the non-ASCII range should be percent encoded.
```
*`crawling-indexing/url-structure`, `Last updated 2025-12-10 UTC`.*

**Keyword stuffing and scaled content abuse: the primary definitions.**

```
Keyword stuffing refers to the practice of filling a web page with keywords or numbers in an
attempt to manipulate rankings in Google Search results. Often these keywords appear in a list
or group, unnaturally, or out of context.

Scaled content abuse is when many pages are generated for the primary purpose of manipulating
search rankings and not helping users.
```
*`essentials/spam-policies`, `Last updated 2026-05-15 UTC`.*

## Non-Google sources

| Source | URL | What it carries | Class |
|---|---|---|---|
| Zyppy title study | `https://zyppy.com/seo/google-title-rewrite-study/` | *"On desktop search, Google typically limits titles to 600 pixels […] Titles longer than this are almost always truncated with ellipses (…)"*, over 80 959 titles across 2 370 sites, **early 2022** | tool measurement, not Google |
| W3C | `https://www.w3.org/International/articles/article-text-size.fr` | text lengthens from English into Romance languages (French version of the article) | primary, but on translation, not on SEO |
| Search Engine Roundtable | `https://www.seroundtable.com/google-search-optimal-keyword-density-34826.html` | Mueller's denial on keyword density | official but secondary: an office-hours statement, not written documentation |

Mueller's and Sullivan's statements are all in this last class: repeated, consistent, and never
archived in primary form by Google. Cite them as declarations, not as documentation.

## URLs that do not descend

| URL | Why |
|---|---|
| `https://1.fr/api` | `1.fr/robots.txt` carries `User-agent: * / Disallow: /`. The whole site is closed to robots; the page answers 200 but must not be fetched |
| `https://yourtext.guru/api/v2/documentation` | `Disallow: /api/`. Use `https://yourtext.guru/help/api`, which is allowed |
| `https://ans.wiki/3111` | serves *"Erreur 404 · Page non trouvée"* under HTTP 200. Sole source of the "4,8 caractères" figure, which has no consultable source and does not descend |
| `https://www.gofishdigital.com/blog/3-click-rule/` | 404. No replacement path found. The three-click rule descends neither as a rule nor as a cited heuristic |
| `.../word-count-not-a-quality-factor/384314/` | redirects to `.../397288/`, so the second identifier is the canonical one |
