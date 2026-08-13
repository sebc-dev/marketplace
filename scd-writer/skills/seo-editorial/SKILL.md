---
name: seo-editorial
description: |
  On-page editorial SEO for a French piece: title tag, meta description, slug, headings,
  keyword placement. Reach it before optimising one or correcting a claim about one: Google
  publishes no character limit, and the 60/160 figures that circulate are English rendering
  heuristics.
---

## The invariant: Google publishes no character threshold

Both primary pages say so in one sentence each, and both were read in the served page.

> *"While there's no limit on how long a `<title>` element can be, the title link is truncated in
> Google Search results as needed, typically to fit the device width."*
> Source: `developers.google.com/search/docs/appearance/title-link`, `Last updated 2025-12-10 UTC`

> *"There's no limit on how long a meta description can be, but the snippet is truncated in Google
> Search results as needed, typically to fit the device width."*
> Source: `developers.google.com/search/docs/appearance/snippet`, `Last updated 2026-04-20 UTC`

**So never write "under 60 characters" as a rule.** The constraint is truncation to the device width,
which is a pixel budget, not a character count.

## The disagreement you will walk into

Anthropic's official `content-creation` skill (`anthropics/knowledge-work-plugins`, marketing plugin)
prescribes, verbatim in its on-page SEO checklist:

```
Title tag: under 60 characters, includes primary keyword
Meta description: under 160 characters, includes primary keyword, compels click
H1: one per page, matches or closely reflects the title tag
```

Google's primary documentation contradicts all three: no limit on either element, and John Mueller
has said repeatedly that *"our systems don't have a problem when it comes to multiple H1 headings on
a page"*.

**Both are first-hand sources, and they are not talking about the same object.** One is a drafting
skill, the other is the search engine. This is not resolved by picking a winner:

- Treat 60 and 160 as **rendering heuristics derived from an English pixel budget**, which is what
  they are. They are reasonable defaults for an English title.
- **Never attribute them to Google.** If the author says "Google wants 60 characters", that is the
  correction to make.
- In French they are the wrong instrument twice over: wrong unit, and calibrated on shorter words.

## What replaces the character count

**The pixel budget.** Roughly **600 px on desktop**, per the Zyppy study of 80 959 title tags across
2 370 sites, early 2022: *"On desktop search, Google typically limits titles to 600 pixels […] Titles
longer than this are almost always truncated with ellipses (…)."* This is a **tool measurement**, not
a Google figure. Google only ever says "device width".

**And in French, leave margin.** The W3C documents that text lengthens when translated from English
into Romance languages. At an equal pixel budget, a French title therefore fits fewer words. The
operational rule is one thing only: **front-load the distinctive information**, so that what survives
truncation is what identifies the page.

> **No average French word length descends here.** The single source behind the "4,8 caractères"
> figure serves a *"Erreur 404 · Page non trouvée"* page under an HTTP 200, which is a false success. The
> competing "~6 signes" never had a source either. The margin rule stands on the W3C alone, and it
> stands without a number.

There is **no character threshold calibrated for French**, from Google or from any published study.
That gap is real and is not filled by inference.

## The rules that are actually documented

Each of these has a primary Google source. They are the whole encodable base.

| Object | Rule | Source page |
|---|---|---|
| `<title>` | Unique per page, descriptive and concise; distinctive information first; no repeated keywords; same language and writing system as the content | `appearance/title-link` |
| Meta description | Unique per page, written as sentences, not a keyword string; expect Google to rewrite it, since the snippet is drawn from the page content first | `appearance/snippet` |
| Headings | Structure the content logically. Heading **count and order are not ranking factors**. "One H1 per page" is an accessibility rule, keep it for that reason and not this one | Mueller, official but secondary |
| Anchors | Descriptive text that says what the target page is about, inside a real crawlable `<a href>`; never "cliquez ici" | `crawling-indexing/links-crawlable` |
| URL | Hyphens `-`, not underscores; **case-sensitive** (`/APPLE` and `/apple` are distinct URLs); non-ASCII characters *"should be percent encoded"* | `crawling-indexing/url-structure` |
| Accents | Always correct diacritics in the visible content and in the title. Google normalises accented and unaccented forms according to the user's interface language, so correct accents cost nothing and preserve meaning. In the slug, percent-encode or strip them, and keep them in the prose | `url-structure` + normalisation |
| Content | People-first: original information, demonstrated expertise, first-hand experience. Not written for the engine first | `fundamentals/creating-helpful-content` |
| Volume | No keyword stuffing, no scaled content abuse: *"many pages generated for the primary purpose of manipulating search rankings and not helping users"* | `essentials/spam-policies` |

## The folklore, with who denied it

Encoding any of these is worse than encoding nothing: it changes the draft for no reason.

| Belief | Status |
|---|---|
| Keyword density of 1-2 % | Mueller: *"Google does not have a notion of optimal keyword density."* Invented by the tools |
| An ideal word count (1 500 words…) | Mueller: *"Word count is not a ranking factor."* Sullivan: *"not a thing! It doesn't exist."* The Backlinko study that started it reports a 1 447-word average **and states it found no direct relationship with rankings** |
| One H1 per page as a ranking factor | Contradicted by Mueller. Accessibility rule only |
| Strict H1 > H2 > H3 order as a weight | Mueller: *"isn't really that relevant"* |
| The exact keyword must appear in the title / H1 / URL | No primary source; Google recommends natural writing |
| Removing stop words to densify | Contradicted: readability comes first |
| LSI keywords | Mueller: *"There is no such thing as LSI keywords"* |

## Semantic tools: indicators, never measures

**YourTextGuru's SOSEO and DSEO are proprietary indicators.** The publisher documents the bounds
(SOSEO 0-300 %, DSEO 0-200 %) and the claimed principle ("context vectors", "differential corpus"),
and **never the formula, never the weighting, never how many SERP results are analysed**. TF-IDF does
not appear in its documentation. This is not a research gap. The publisher has not settled it
publicly. Consequence: a SOSEO score can be reported as a vendor's indicator; it can never be
reported as a measurement, and no piece is ever "wrong" because of one.

**`1.fr` cannot be verified by any automatic channel.** Its `robots.txt` carries
`User-agent: * / Disallow: /`, so the entire site is closed to robots. Its API doctrine and its prices
are therefore out of reach of every channel this plugin has; the figures that circulate come from
converging third parties and will stay that way. Only a commercial contact would close it.

**No MCP server is embedded for any of these.** A third-party server is documented, never started on
the author's behalf. The reasoning, and what other writing plugins do instead, is in `skills-tiers`.

## Sources

The pinned URLs, the date each page was last updated, and the verbatim extracts are in
**`references/sources-google.md`**. Load it when a rule is being contested, when a claim needs its
source, or to check whether a page has moved since the campaign. It is a dated snapshot and says so
at the top.

## Where this skill loses

**`writing-voice` wins every conflict.** A title that ranks and does not sound like the author is a
bad title. SEO here is a constraint on form, never a licence to change voice.

**`slop-poli` owns the substance verdict.** "People-first content" is Google's name for what it
already measures: run one of the two, report once.

**Only the blog surface has titles, slugs and meta descriptions.** On LinkedIn this skill has nothing
to say and stays quiet (`canaux`).

**Readability is not an SEO signal.** Google publishes no threshold there either (`lisibilite-fr`).

Whether `content-creation` should be a dependency at all is `skills-tiers`; this file owns only the
one contradiction that changes a draft.
