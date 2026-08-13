# Reference: French readability and correction tooling

**Load point.** Read this when an actual computed score or an offline grammar pass is wanted. That
is, before installing or running anything. The rules that decide *whether* to compute a score are in
`SKILL.md` and are not repeated here. This file carries versions, licences and install paths only;
it says nothing about how to interpret a score.

> **Perishable.** Every version, licence and date below was read at a registry or in the repository
> on **2026-08-12** or **2026-08-13** and is stamped as such. Versions move in weeks. Re-read before
> quoting one, and read what is *actually installed* rather than what is written here:
> `pip show textstat pyphen language-tool-python`, or the project's `requirements.txt` /
> `pyproject.toml`. A version in a document is a claim about the past.

- [What runs offline, at a glance](#what-runs-offline-at-a-glance)
- [Scores](#scores)
- [Correction](#correction)
- [Grammalecte and the reserves that travel with the fact](#grammalecte-and-the-reserves-that-travel-with-the-fact)
- [What is not usable](#what-is-not-usable)
- [Pinned URLs](#pinned-urls)

## What runs offline, at a glance

| Need | Tool | Dependency cost |
|---|---|---|
| LIX, ARI, words/sentence, % long words | none, pure counting, standard library | zero |
| Flesch / Kandel-Moles FR | `textstat` + `pyphen` | pip, a few Mo, Hunspell dictionaries |
| Grammar, spelling, typography FR | LanguageTool local server via `language-tool-python` | JRE + ~156-240 Mo, a persistent service |
| Same, lighter | Grammalecte CLI `--json` | light, but see the reserves below |

The first row is the default and needs nothing from this file. The rest is opt-in.

## Scores

| Package | Version | Published | Licence | Read at |
|---|---|---|---|---|
| `textstat` | **0.7.13** | 2026-02-18 | MIT | PyPI, 2026-08-12 |
| `pyphen` | **0.17.2** | 2025-01-20 | **GPL 2.0+ / LGPL 2.1+ / MPL 1.1** tri-licence | `LICENSE` du dépôt `Kozea/Pyphen`, 2026-08-13 |

Two points that neither PyPI nor GitHub gives you:

- **`pyphen`'s licence is in its `LICENSE` file, nowhere else.** PyPI's `license` field is empty and
  GitHub classifies the repository `NOASSERTION`. The file says: *"Pyphen is released under the GPL
  2.0+/LGPL 2.1+/MPL 1.1 tri-license."*
- **The hyphenation dictionaries carry a licence distinct from the code.** Same file: *"Many
  dictionaries are included in pyphen, they come from the LibreOffice git repository and are
  distributed under GPL, LGPL and/or MPL."* Shipping the dictionaries is not the same act as
  depending on the code.

`requires_python`: `textstat` ≥ 3.6, `pyphen` ≥ 3.9. A pre-release `1.0.0a1` of `textstat` exists
(2025-11-03); the stable line stayed on 0.7.x.

## Correction

| Tool | Version | Licence | Read at |
|---|---|---|---|
| LanguageTool (server) | tag **v6.8** | **LGPL-2.1** | API GitHub, 2026-08-12 |
| `language-tool-python` (wrapper) | **3.4.0** (2026-05-14) | **GPL-3.0-only** | PyPI, 2026-08-12 |
| `pygrammalecte` (third-party binding) | 1.5.0 (2024-12-13) | BSD-3-Clause | PyPI, 2026-08-12 |

**The wrapper is GPL-3.0-only while the server is LGPL-2.1.** That asymmetry is the licence fact that
matters: calling the server over HTTP and importing the Python wrapper are not the same commitment.

**French rule count: 7 016 at tag v6.8.** That is 5 336 in `grammar.xml` plus 1 680 in `style.xml`, counted
by `grep -c -E '<rule[ >]'` on the two files fetched at that tag. This figure is cited *because it is
reproducible*: the tag and the method are both given.

> A second figure, **6 984 XML + 22 Java**, appears on `dev.languagetool.org/languages`, dated
> 2025-03-27 for LT 6.6. **Cite one or the other, never both.** They differ by version *and* by
> counting method (a `<rulegroup>` contains several `<rule>`), so adding or averaging them means
> nothing.

Running it: `java -cp languagetool-server.jar org.languagetool.server.HTTPServer --port 8081`, then
`curl -d "language=fr" -d "text=un simple test" http://localhost:8081/v2/check`. The official
documentation is explicit that this is a degraded mode: *"This will give you a basic LanguageTool
server without AI-based rules. The AI-based rules are only available in the cloud."* Since March 2025
the release model is daily snapshots rather than versioned ZIPs.

## Grammalecte and the reserves that travel with the fact

**Version 2.3, project handed over to Algoo (Échirolles) in January 2026.** The source is the
`grammalecte.net` home page, read on 2026-08-13, which says verbatim: *"le flambeau a été transmis en
janvier 2026 à Algoo […] Une dernière version de Grammalecte, la 2.3, a été publiée par Olivier"*.
The founder announced on LinuxFr that 2.3 would in all likelihood be the last version he published.

Two reserves that do not detach from that fact:

- The form **"2.3.0"** and the date **"15 décembre 2025"** are not on that page. Cite "la 2.3" and
  "janvier 2026"; the exact publication date of 2.3 is not established by this channel.
- **No versioned artefact of 2.3 was located.** The `algoo/grammalecte` repository stops at tag v2.2,
  last push 2025-08-18, so it is not the canonical source of the release. Recommending Grammalecte as
  an install fallback presupposes knowing *where* to install it from, which the campaign does not
  say. Find that before recommending it.

`git.grammalecte.net` no longer answers at all (connection failure, 2026-08-12). Do not cite it.

## What is not usable

- **Antidote.** No headless Linux command-line API exists in documented form. Integration goes
  through a JavaScript SDK (web) or a COM server (Windows); Antidote 12 runs offline but on 64-bit
  Windows/macOS only, with Linux served by Antidote Web (cloud). Out of scope for an agent.
- **The French-specific formulas.** Henry (1975), Richaudeau (1979), Mesnager (1989) are documented
  academically and implemented in no verifiable Python library. Only the Kandel-Moles adaptation of
  Flesch is available off the shelf.
- **Gunning Fog in French.** `textstat` ships no `fr` variant, and no French calibration of the
  "3 syllables" threshold has a primary academic source.

## Pinned URLs

No agent goes looking for an index nobody named. These were opened and verified on 2026-08-12.

| URL | What it carries |
|---|---|
| `https://github.com/textstat/textstat` | `textstat`, source of the French coefficients |
| `https://pyphen.org/` | Pyphen documentation |
| `https://github.com/languagetool-org/languagetool` | LanguageTool server |
| `https://language-tool-python.readthedocs.io/en/latest/` | the Python binding |
| `https://www.grammalecte.net/` | Grammalecte, the canonical page for version and handover |
| `https://github.com/algoo/grammalecte` | the Algoo repository (stops at v2.2) |
