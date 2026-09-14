#!/usr/bin/env node
// scd-review-page.mjs — rend la PAGE DE RELECTURE d'un ticket : le diff de chaque fichier, la
// narration composée en amont, les schémas LikeC4, et l'état de relecture (cases « vu », notes
// ancrées, verdict). Recette portée par le plugin scd-spec-dev, jouée par la conversation
// principale (`/scd-spec-dev:run` étape 6bis, `/scd-spec-dev:review-page`) qui publie ensuite le
// fragment par l'outil `Artifact`.
//
// La page MONTRE, elle ne juge pas : aucune sévérité n'est inventée ici, les annotations viennent
// du triage (`review.applied` / `review.rejected`) et la narration de `pr-describer`.
//
// Ce que le script fait
//   1. valide STRICTEMENT le manifeste (échec bruyant, jamais une page vide) ;
//   2. dresse la liste des fichiers du range `<base>..<head>` (ou de l'arbre de travail) par
//      `git diff -M --name-status -z` + `--numstat -z` ;
//   3. capture le diff de chaque fichier texte en CONTEXTE TOTAL (`-U1000000`) tant qu'il tient
//      sous 2 000 lignes et 200 Ko, sinon `-U3` (`fullAvailable: false`) ;
//   4. applique la politique de taille totale (cible 3 Mo, dur 6 Mo, dégradation ordonnée) ;
//   5. compose le graphe d'impact Mermaid depuis `model`, ancre les findings par `location` ;
//   6. écrit trois fichiers : `<préfixe>.html` (document complet, hors ligne),
//      `<préfixe>.artifact.html` (fragment, ce que l'outil `Artifact` enveloppe) et
//      `<préfixe>.state.json` (état initial, ou `--state` reporté avec les notes `stale`).
//
// Usage
//   node scd-review-page.mjs --manifest <json> --repo <dir> --base <sha> --head <ref|WORKTREE>
//                            -o <préfixe> [--pr <url>] [--state <json>] [--context 3]
//   Codes de sortie : 0 ok · 2 usage · 3 manifeste invalide (le champ fautif est nommé) ·
//   4 git en échec.
//
// Cinq choix d'implémentation, hors de ce que le plan fixe
//   - le diff est stocké en TEXTE BRUT (les hunks, `@@` compris) et non en tableau de lignes : un
//     tableau d'objets `{t,o,n,s}` pèse ~3× le texte en JSON, et le client sait recalculer les
//     numéros depuis l'en-tête `@@` ; le repli de contexte et le dépliage « fichier complet » sont
//     de toute façon côté client ;
//   - `mermaid` est épinglé en 11.12.0 sur cdnjs (URL vérifiée), chargé SEULEMENT si
//     `!window.claude` — dans le viewer, `<pre class="mermaid">` est rendu nativement ;
//   - aucune police distante : le document local doit tenir hors ligne, et le diff est du
//     monospace système ;
//   - le lien « fichier complet » d'un diff réduit à `-U3` pointe vers la forge, dérivé de
//     `--pr` (GitHub `/blob/<sha>/`, GitLab `/-/blob/<sha>/`) ; sans `--pr`, pas de lien ;
//   - le renderer est écrit comme une VRAIE fonction du script, sérialisée par `toString()` :
//     c'est ce qui permet d'y écrire des littéraux de gabarit sans échappement.
//
// Neuf limites déclarées — le script est AVEUGLE à :
//   - la coloration syntaxique (aucune en v1) et l'affichage côte à côte (diff unifié seulement) ;
//   - le contenu des binaires et des générés/verrous (`*.lock`, `package-lock.json`,
//     `pnpm-lock.yaml`, `*.min.*`, `dist/`, `build/`, `vendor/`) : stats seules ;
//   - les sous-modules (`--ignore-submodules`) ;
//   - l'index git : `--head WORKTREE` compare la BASE à l'arbre de travail et ajoute les non
//     suivis ; le script ne mute jamais l'index et ne voit pas les fichiers ignorés ;
//   - un conflit de fusion en cours (les marqueurs apparaissent comme des lignes ordinaires) ;
//   - le CommonMark complet : le convertisseur du renderer connaît titres, paragraphes, listes
//     (un niveau d'imbrication), citations, tables, blocs de code, `<details>`/`<summary>` en
//     passe-plat, gras/italique/code/liens — rien d'autre ;
//   - la véracité de la narration : `page.files[]` est recopié tel quel, jamais confronté au diff
//     (un fichier narré absent du diff est signalé, pas corrigé) ;
//   - la résolution d'un `location` de finding autrement que par `fichier:ligne` (chemin exact,
//     puis nom de base) ; ce qui ne s'ancre pas est listé en Synthèse ;
//   - le contenu de `state.json` une fois la page publiée : le script ne relit rien, c'est la
//     commande qui repasse l'ancien état par `--state`.
//
// Node ≥ 18, ESM, aucune dépendance npm.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const NAME = 'scd-review-page';
const MERMAID_URL = 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.12.0/mermaid.min.js';

const USAGE = [
  'usage : node scd-review-page.mjs --manifest <json> --repo <dir> --base <sha>',
  '                                 --head <ref|WORKTREE> -o <préfixe>',
  '                                 [--pr <url>] [--state <json>] [--context 3]',
  '',
  '  --manifest  le manifeste de page (schemaVersion 1) composé en amont',
  '  --repo      racine du dépôt git à lire',
  '  --base      sha de base (déjà le merge-base : le range est à DEUX points)',
  '  --head      ref de tête, ou le littéral WORKTREE pour l\'arbre de travail',
  '  -o          préfixe des trois sorties (.html, .artifact.html, .state.json)',
  '  --pr        URL de la PR : title/body lus par `gh pr view` (ou `glab`)',
  '  --state     état de relecture précédent, reporté (notes périmées marquées `stale`)',
  '  --context   lignes de contexte repliées autour d\'un changement (défaut : 3)',
  '',
  'codes de sortie : 0 ok · 2 usage · 3 manifeste invalide · 4 git en échec',
].join('\n');

function die(code, msg) {
  process.stderr.write(`${NAME} : ${msg}\n`);
  process.exit(code);
}

// ---------------------------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------------------------

function parseArgs(argv) {
  const o = {
    manifest: null, repo: '.', base: null, head: null, out: null,
    pr: null, state: null, context: 3,
  };
  const long = { '--manifest': 'manifest', '--repo': 'repo', '--base': 'base', '--head': 'head',
    '--out': 'out', '-o': 'out', '--pr': 'pr', '--state': 'state', '--context': 'context' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { process.stdout.write(USAGE + '\n'); process.exit(0); }
    if (a in long) {
      const v = argv[++i];
      if (v === undefined) die(2, `option ${a} sans valeur\n${USAGE}`);
      o[long[a]] = v;
    } else {
      die(2, `option inconnue : ${a}\n${USAGE}`);
    }
  }
  for (const req of ['manifest', 'base', 'head', 'out']) {
    if (!o[req]) die(2, `option --${req === 'out' ? 'o' : req} obligatoire\n${USAGE}`);
  }
  const ctx = Number.parseInt(String(o.context), 10);
  if (!Number.isFinite(ctx) || ctx < 0 || ctx > 100) die(2, `--context : entier entre 0 et 100 attendu, reçu « ${o.context} »`);
  o.context = ctx;
  return o;
}

// ---------------------------------------------------------------------------------------------
// Manifeste — validation stricte, le champ fautif est nommé (code 3)
// ---------------------------------------------------------------------------------------------

function bad(field, expected, got) {
  die(3, `manifeste invalide — champ \`${field}\` : ${expected} attendu, reçu ${describe(got)}`);
}
function describe(v) {
  if (v === undefined) return 'rien';
  if (v === null) return 'null';
  if (Array.isArray(v)) return `un tableau (${v.length})`;
  return `${typeof v} (${JSON.stringify(v).slice(0, 40)})`;
}
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string';

function optStr(o, field, name) {
  if (o[field] === undefined || o[field] === null) return null;
  if (!isStr(o[field])) bad(name, 'une chaîne', o[field]);
  return o[field];
}
function optStrArr(o, field, name) {
  if (o[field] === undefined || o[field] === null) return [];
  if (!Array.isArray(o[field])) bad(name, 'un tableau de chaînes', o[field]);
  o[field].forEach((v, i) => { if (!isStr(v)) bad(`${name}[${i}]`, 'une chaîne', v); });
  return o[field];
}

function loadManifest(file) {
  let raw;
  try { raw = readFileSync(file, 'utf8'); }
  catch (e) { die(3, `manifeste illisible (${file}) : ${e.message}`); }
  let m;
  try { m = JSON.parse(raw); }
  catch (e) { die(3, `manifeste : JSON invalide (${file}) — ${e.message}`); }
  if (!isObj(m)) bad('(racine)', 'un objet', m);
  if (m.schemaVersion !== 1) bad('schemaVersion', 'le nombre 1', m.schemaVersion);
  if (!isObj(m.meta)) bad('meta', 'un objet', m.meta);
  if (!isStr(m.meta.title) || m.meta.title.trim() === '') bad('meta.title', 'une chaîne non vide', m.meta.title);
  for (const f of ['ticket', 'changeDir', 'branch', 'base', 'verifMode', 'verdict']) optStr(m.meta, f, `meta.${f}`);
  optStr(m, 'body', 'body');

  if (m.page !== undefined && m.page !== null) {
    if (!isObj(m.page)) bad('page', 'un objet ou null', m.page);
    optStrArr(m.page, 'readingOrder', 'page.readingOrder');
    if (m.page.files !== undefined && m.page.files !== null) {
      if (!Array.isArray(m.page.files)) bad('page.files', 'un tableau', m.page.files);
      m.page.files.forEach((f, i) => {
        if (!isObj(f)) bad(`page.files[${i}]`, 'un objet', f);
        if (!isStr(f.path) || f.path === '') bad(`page.files[${i}].path`, 'une chaîne non vide', f.path);
        for (const k of ['kind', 'role', 'summary']) optStr(f, k, `page.files[${i}].${k}`);
        optStrArr(f, 'scrutinize', `page.files[${i}].scrutinize`);
        optStrArr(f, 'criteria', `page.files[${i}].criteria`);
      });
    }
    if (m.page.diagrams !== undefined && m.page.diagrams !== null) {
      if (!Array.isArray(m.page.diagrams)) bad('page.diagrams', 'un tableau', m.page.diagrams);
      m.page.diagrams.forEach((d, i) => {
        if (!isObj(d)) bad(`page.diagrams[${i}]`, 'un objet', d);
        if (!isStr(d.mermaid) || d.mermaid.trim() === '') bad(`page.diagrams[${i}].mermaid`, 'une chaîne non vide', d.mermaid);
        for (const k of ['id', 'title']) optStr(d, k, `page.diagrams[${i}].${k}`);
      });
    }
  }

  if (m.criteria !== undefined && m.criteria !== null) {
    if (!Array.isArray(m.criteria)) bad('criteria', 'un tableau', m.criteria);
    m.criteria.forEach((c, i) => {
      if (!isObj(c)) bad(`criteria[${i}]`, 'un objet', c);
      for (const k of ['id', 'text', 'test', 'status', 'proof']) optStr(c, k, `criteria[${i}].${k}`);
    });
  }

  if (m.model !== undefined && m.model !== null) {
    if (!isObj(m.model)) bad('model', 'un objet ou null', m.model);
    optStr(m.model, 'project', 'model.project');
    if (m.model.elements !== undefined && m.model.elements !== null) {
      if (!Array.isArray(m.model.elements)) bad('model.elements', 'un tableau', m.model.elements);
      m.model.elements.forEach((e, i) => {
        if (!isObj(e)) bad(`model.elements[${i}]`, 'un objet', e);
        if (!isStr(e.id) || e.id === '') bad(`model.elements[${i}].id`, 'une chaîne non vide', e.id);
        for (const k of ['kind', 'view', 'title']) optStr(e, k, `model.elements[${i}].${k}`);
        optStrArr(e, 'sourceDir', `model.elements[${i}].sourceDir`);
        optStrArr(e, 'files', `model.elements[${i}].files`);
      });
    }
    if (m.model.relations !== undefined && m.model.relations !== null) {
      if (!Array.isArray(m.model.relations)) bad('model.relations', 'un tableau', m.model.relations);
      m.model.relations.forEach((r, i) => {
        if (!isObj(r)) bad(`model.relations[${i}]`, 'un objet', r);
        for (const k of ['source', 'target']) {
          if (!isStr(r[k]) || r[k] === '') bad(`model.relations[${i}].${k}`, 'une chaîne non vide', r[k]);
        }
        if (r.kind !== undefined && r.kind !== null && r.kind !== 'sync' && r.kind !== 'async') {
          bad(`model.relations[${i}].kind`, '« sync » ou « async »', r.kind);
        }
        optStr(r, 'title', `model.relations[${i}].title`);
      });
    }
    optStrArr(m.model, 'unmapped', 'model.unmapped');
  }

  optStrArr(m, 'modelFilesInDiff', 'modelFilesInDiff');

  if (m.review !== undefined && m.review !== null) {
    if (!isObj(m.review)) bad('review', 'un objet', m.review);
    for (const bucket of ['applied', 'rejected']) {
      if (m.review[bucket] === undefined || m.review[bucket] === null) continue;
      if (!Array.isArray(m.review[bucket])) bad(`review.${bucket}`, 'un tableau', m.review[bucket]);
      m.review[bucket].forEach((f, i) => {
        if (!isObj(f)) bad(`review.${bucket}[${i}]`, 'un objet', f);
        for (const k of ['id', 'dimension', 'location', 'summary', 'reason', 'correction_prompt', 'severity']) {
          optStr(f, k, `review.${bucket}[${i}].${k}`);
        }
      });
    }
    optStrArr(m.review, 'humanChecks', 'review.humanChecks');
  }
  return m;
}

// ---------------------------------------------------------------------------------------------
// git — jamais d'écriture, jamais de mutation de l'index
// ---------------------------------------------------------------------------------------------

const DIFF_FLAGS = ['--no-color', '--no-ext-diff', '--no-textconv', '--ignore-submodules'];

function makeGit(repo) {
  const pre = ['-C', repo, '-c', 'core.quotepath=false', '-c', 'diff.noprefix=false',
    '-c', 'diff.mnemonicPrefix=false'];
  return function git(args, opts = {}) {
    try {
      return execFileSync('git', pre.concat(args), {
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e) {
      // `diff --no-index` sort 1 quand il y a des différences : ce n'est pas un échec.
      if (opts.allowExit && typeof e.status === 'number' && opts.allowExit.includes(e.status)) {
        return typeof e.stdout === 'string' ? e.stdout : '';
      }
      if (opts.soft) return null;
      const err = (e.stderr || e.message || '').toString().trim();
      die(4, `git a échoué — \`git ${args.join(' ')}\`\n  ${err.split('\n').slice(0, 4).join('\n  ')}`);
    }
  };
}

const GENERATED_RE = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|npm-shrinkwrap\.json|yarn\.lock|composer\.lock|Cargo\.lock|poetry\.lock|Gemfile\.lock|go\.sum|pubspec\.lock|uv\.lock)$|\.lock$|\.min\.(js|css|mjs)$|(^|\/)(dist|build|out|vendor|node_modules|\.next|coverage)\//;
const isGenerated = (p) => GENERATED_RE.test(p);

function splitZ(out) {
  if (!out) return [];
  const parts = out.split('\0');
  if (parts.length && parts[parts.length - 1] === '') parts.pop();
  return parts;
}

function listFiles(git, base, head) {
  const worktree = head === 'WORKTREE';
  const range = worktree ? [base] : [`${base}..${head}`];
  const nameStatus = splitZ(git(['diff', '-M', '--name-status', '-z'].concat(DIFF_FLAGS, range)));
  const files = [];
  for (let i = 0; i < nameStatus.length;) {
    const st = nameStatus[i++];
    if (!/^[A-Z]\d*$/.test(st)) continue;
    const letter = st[0];
    if (letter === 'R' || letter === 'C') {
      const oldPath = nameStatus[i++];
      const newPath = nameStatus[i++];
      files.push({ path: newPath, oldPath, status: letter, score: Number(st.slice(1)) || null });
    } else {
      files.push({ path: nameStatus[i++], oldPath: null, status: letter, score: null });
    }
  }
  // stats
  const numstat = splitZ(git(['diff', '-M', '--numstat', '-z'].concat(DIFF_FLAGS, range)));
  const stats = new Map();
  for (let i = 0; i < numstat.length;) {
    const tok = numstat[i++];
    const m = /^(\d+|-)\t(\d+|-)\t([\s\S]*)$/.exec(tok);
    if (!m) continue;
    let p = m[3];
    // Sur un renommage, `-z` émet « add\tdel\t » puis DEUX jetons : l'ancien puis le nouveau nom.
    if (p === '') { i++; p = numstat[i++]; }
    stats.set(p, { add: m[1] === '-' ? null : Number(m[1]), del: m[2] === '-' ? null : Number(m[2]) });
  }
  for (const f of files) {
    const s = stats.get(f.path) || { add: null, del: null };
    f.add = s.add; f.del = s.del;
    f.binary = s.add === null && s.del === null;
    f.untracked = false;
  }
  if (worktree) {
    const others = splitZ(git(['ls-files', '--others', '--exclude-standard', '-z']));
    for (const p of others) {
      if (!p) continue;
      files.push({ path: p, oldPath: null, status: 'A', score: null, add: null, del: null,
        binary: false, untracked: true });
    }
  }
  return files;
}

const FULL_CTX = '-U1000000';
const MAX_FULL_LINES = 2000;
const MAX_FULL_BYTES = 200 * 1024;

function rawDiff(git, base, head, f, ctxFlag) {
  const worktree = head === 'WORKTREE';
  if (f.untracked) {
    return git(['diff', '--no-index', ctxFlag, '--no-color', '--', '/dev/null', f.path],
      { allowExit: [1] }) || '';
  }
  const range = worktree ? [base] : [`${base}..${head}`];
  const paths = f.oldPath ? ['--', f.oldPath, f.path] : ['--', f.path];
  const args = ['diff', '-M', ctxFlag].concat(DIFF_FLAGS, range, paths);
  return git(args) || '';
}

// Ne garde que les hunks : l'en-tête (`diff --git`, `index`, `---`, `+++`, modes) est lu à part.
function splitDiff(text) {
  const lines = text.split('\n');
  const head = [];
  let i = 0;
  for (; i < lines.length; i++) {
    if (lines[i].startsWith('@@')) break;
    head.push(lines[i]);
  }
  const body = lines.slice(i);
  while (body.length && body[body.length - 1] === '') body.pop();
  return { head, body };
}

function analyseBody(body) {
  let crlf = false, noNewline = false, changed = 0;
  const out = [];
  for (const raw of body) {
    if (raw.startsWith('\\')) { noNewline = true; continue; }
    let s = raw;
    if (s.endsWith('\r')) { crlf = true; s = s.slice(0, -1); }
    if (s[0] === '+' || s[0] === '-') changed++;
    out.push(s);
  }
  return { text: out.join('\n'), crlf, noNewline, changed };
}

function collect(git, opts, manifest) {
  const files = listFiles(git, opts.base, opts.head);
  const out = [];
  for (const f of files) {
    const e = {
      path: f.path, oldPath: f.oldPath, status: f.status, score: f.score,
      add: f.add, del: f.del, binary: !!f.binary, untracked: !!f.untracked,
      content: null, contextLevel: null, fullAvailable: false,
      omitted: null, note: null, crlf: false, noNewline: false,
    };
    if (e.binary) { e.omitted = 'binary'; e.note = 'fichier binaire — contenu non affiché'; out.push(e); continue; }
    if (isGenerated(f.path)) { e.omitted = 'generated'; e.note = 'fichier généré ou verrou — stats seules'; out.push(e); continue; }
    let raw = rawDiff(git, opts.base, opts.head, f, FULL_CTX);
    let { head: hdr, body } = splitDiff(raw);
    if (body.length === 0) {
      const modeLine = hdr.find((l) => /^(old|new) mode /.test(l));
      const typeLine = hdr.find((l) => /^(deleted|new) file mode 120000/.test(l));
      e.omitted = 'mode-only';
      e.note = typeLine ? 'lien symbolique — métadonnées seules'
        : modeLine ? `changement de mode seul (${hdr.filter((l) => /^(old|new) mode /.test(l)).join(', ')})`
          : (f.oldPath ? 'renommage sans modification de contenu'
            : 'aucun contenu textuel dans le diff');
      out.push(e); continue;
    }
    let a = analyseBody(body);
    const tooBig = a.text.length > MAX_FULL_BYTES || body.length > MAX_FULL_LINES;
    if (tooBig) {
      raw = rawDiff(git, opts.base, opts.head, f, '-U3');
      const s = splitDiff(raw);
      a = analyseBody(s.body);
      e.contextLevel = '3';
      e.fullAvailable = false;
    } else {
      e.contextLevel = 'full';
      e.fullAvailable = true;
    }
    e.content = a.text;
    e.crlf = a.crlf;
    e.noNewline = a.noNewline;
    if (e.add === null && e.del === null && e.untracked) {
      let add = 0;
      for (const l of a.text.split('\n')) if (l[0] === '+') add++;
      e.add = add; e.del = 0;
    }
    out.push(e);
  }
  // ordre : readingOrder du manifeste d'abord, puis le reste par chemin
  const order = (manifest.page && Array.isArray(manifest.page.readingOrder)) ? manifest.page.readingOrder : [];
  const rank = new Map(order.map((p, i) => [p, i]));
  out.sort((x, y) => {
    const rx = rank.has(x.path) ? rank.get(x.path) : 1e6;
    const ry = rank.has(y.path) ? rank.get(y.path) : 1e6;
    return rx !== ry ? rx - ry : x.path.localeCompare(y.path);
  });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Politique de taille totale — cible 3 Mo, dur 6 Mo, dégradation ORDONNÉE
// ---------------------------------------------------------------------------------------------

const TARGET_BYTES = 3 * 1024 * 1024;
const HARD_BYTES = 6 * 1024 * 1024;

function jsonBytes(v) { return Buffer.byteLength(JSON.stringify(v), 'utf8'); }

function applySizePolicy(git, opts, files) {
  const log = [];
  let truncated = false;
  const size = () => jsonBytes(files);
  if (size() > TARGET_BYTES) {
    // 1. les plus gros fichiers repassent en -U3
    const bySize = files.filter((f) => f.content && f.contextLevel === 'full')
      .sort((a, b) => b.content.length - a.content.length);
    for (const f of bySize) {
      if (size() <= TARGET_BYTES) break;
      const s = splitDiff(rawDiff(git, opts.base, opts.head, f, '-U3'));
      const a = analyseBody(s.body);
      f.content = a.text; f.contextLevel = '3'; f.fullAvailable = false;
      truncated = true;
      log.push(`${f.path} : contexte réduit à 3 lignes (taille)`);
    }
  }
  if (size() > HARD_BYTES) {
    // 2. au-delà du plafond dur : stats et narration seules
    const bySize = files.filter((f) => f.content)
      .sort((a, b) => b.content.length - a.content.length);
    for (const f of bySize) {
      if (size() <= HARD_BYTES) break;
      f.content = null; f.omitted = 'size'; f.contextLevel = null; f.fullAvailable = false;
      f.note = 'diff omis — la page dépassait le plafond de 6 Mo';
      truncated = true;
      log.push(`${f.path} : diff omis (plafond dur)`);
    }
  }
  return { truncated, log, bytes: size() };
}

// ---------------------------------------------------------------------------------------------
// Corps de PR — `--pr` l'emporte sur `manifest.body`
// ---------------------------------------------------------------------------------------------

function readPr(url) {
  const tools = [
    ['gh', ['pr', 'view', url, '--json', 'title,body,url']],
    ['glab', ['mr', 'view', url, '--output', 'json']],
  ];
  for (const [bin, args] of tools) {
    try {
      const out = execFileSync(bin, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'] });
      const j = JSON.parse(out);
      const body = isStr(j.body) ? j.body : (isStr(j.description) ? j.description : null);
      return { title: isStr(j.title) ? j.title : null, body, url, tool: bin };
    } catch { /* l'outil suivant, puis le manifeste */ }
  }
  process.stderr.write(`${NAME} : avertissement — le corps de la PR n'a pas pu être lu (${url}) ; repli sur \`body\` du manifeste\n`);
  return null;
}

// ---------------------------------------------------------------------------------------------
// Graphe d'impact — Mermaid, depuis `model` seulement
// ---------------------------------------------------------------------------------------------

function mmdId(id) {
  const s = String(id).replace(/[^A-Za-z0-9_]/g, '_');
  return /^[A-Za-z_]/.test(s) ? s : `n_${s}`;
}
function mmdLabel(s) {
  return String(s).replace(/"/g, "'").replace(/[\r\n]+/g, ' ').slice(0, 80);
}

function impactGraph(model) {
  if (!model) return null;
  const elements = Array.isArray(model.elements) ? model.elements : [];
  const relations = Array.isArray(model.relations) ? model.relations : [];
  if (elements.length === 0 && relations.length === 0) return null;
  const touched = new Map();
  for (const e of elements) touched.set(e.id, e);
  const seen = new Set();
  const lines = ['graph LR'];
  const node = (id) => {
    const key = mmdId(id);
    if (seen.has(key)) return key;
    seen.add(key);
    const e = touched.get(id);
    if (e) {
      const n = Array.isArray(e.files) ? e.files.length : 0;
      const label = mmdLabel(e.title || e.id) + (n ? ` (${n} fichier${n > 1 ? 's' : ''})` : '');
      lines.push(`  ${key}["${label}"]:::touched`);
    } else {
      lines.push(`  ${key}["${mmdLabel(id)}"]`);
    }
    return key;
  };
  for (const e of elements) node(e.id);
  for (const r of relations) {
    const a = node(r.source), b = node(r.target);
    const arrow = r.kind === 'async' ? '-.->' : '-->';
    const title = r.title ? `|"${mmdLabel(r.title)}"|` : '';
    lines.push(`  ${a} ${arrow}${title} ${b}`);
  }
  lines.push('  classDef touched stroke-width:3px,font-weight:bold');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------------------------
// Annotations — `location` = « fichier:ligne », tolérant
// ---------------------------------------------------------------------------------------------

function anchorFindings(review, files) {
  const byPath = new Map(files.map((f) => [f.path, f.path]));
  const byBase = new Map();
  for (const f of files) {
    const b = f.path.split('/').pop();
    if (!byBase.has(b)) byBase.set(b, f.path); else byBase.set(b, null); // ambigu → non ancré
  }
  const anchored = {};
  const unanchored = [];
  const push = (state, f, i) => {
    const entry = {
      id: f.id || `${state[0]}${i + 1}`,
      dimension: f.dimension || null,
      severity: f.severity || null,
      state,
      summary: f.summary || null,
      reason: f.reason || null,
      location: f.location || null,
      path: null, line: null,
    };
    const loc = isStr(f.location) ? f.location.trim() : '';
    const m = /^(.+?):(\d+)(?::\d+)?$/.exec(loc);
    if (m) {
      const raw = m[1].replace(/^\.\//, '');
      const p = byPath.get(raw) || byBase.get(raw.split('/').pop()) || null;
      if (p) {
        entry.path = p;
        entry.line = Number(m[2]);
        (anchored[p] = anchored[p] || []).push(entry);
        return;
      }
    }
    unanchored.push(entry);
  };
  const applied = (review && Array.isArray(review.applied)) ? review.applied : [];
  const rejected = (review && Array.isArray(review.rejected)) ? review.rejected : [];
  applied.forEach((f, i) => push('applied', f, i));
  rejected.forEach((f, i) => push('rejected', f, i));
  for (const p of Object.keys(anchored)) anchored[p].sort((a, b) => a.line - b.line);
  return { anchored, unanchored };
}

// ---------------------------------------------------------------------------------------------
// État de relecture
// ---------------------------------------------------------------------------------------------

// Les numéros de ligne visibles par côté, pour marquer `stale` une note dont la ligne a disparu.
function visibleLines(file) {
  const res = { old: new Set(), new: new Set() };
  if (!file.content) return res;
  let o = 0, n = 0;
  for (const l of file.content.split('\n')) {
    const m = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
    if (m) { o = Number(m[1]); n = Number(m[2]); continue; }
    const c = l[0];
    if (c === '+') { res.new.add(n++); }
    else if (c === '-') { res.old.add(o++); }
    else if (c === ' ' || l === '') { res.old.add(o++); res.new.add(n++); }
  }
  return res;
}

function buildState(opts, manifest, files, headSha) {
  const pageId = manifest.meta.branch || manifest.meta.ticket
    || path.basename(opts.out).replace(/\.[^.]*$/, '');
  const base = {
    schemaVersion: 1,
    pageId,
    head: headSha,
    verdict: null,
    general: '',
    viewed: {},
    notes: [],
    updatedAt: new Date().toISOString(),
  };
  if (!opts.state) return base;
  let prev;
  try { prev = JSON.parse(readFileSync(opts.state, 'utf8')); }
  catch (e) {
    process.stderr.write(`${NAME} : avertissement — --state illisible (${opts.state}) : ${e.message} ; état neuf\n`);
    return base;
  }
  if (!isObj(prev)) {
    process.stderr.write(`${NAME} : avertissement — --state n'est pas un objet ; état neuf\n`);
    return base;
  }
  const lines = new Map(files.map((f) => [f.path, visibleLines(f)]));
  base.verdict = prev.verdict === undefined ? null : prev.verdict;
  base.general = isStr(prev.general) ? prev.general : '';
  if (isObj(prev.viewed)) {
    for (const [p, v] of Object.entries(prev.viewed)) if (lines.has(p) && v) base.viewed[p] = true;
  }
  if (Array.isArray(prev.notes)) {
    base.notes = prev.notes.filter(isObj).map((n, i) => {
      const side = n.side === 'old' ? 'old' : 'new';
      const set = lines.get(n.path);
      const stale = !set || !Number.isFinite(Number(n.line)) || !set[side].has(Number(n.line));
      return {
        id: isStr(n.id) ? n.id : `n${i + 1}`,
        path: isStr(n.path) ? n.path : '',
        line: Number.isFinite(Number(n.line)) ? Number(n.line) : null,
        side,
        type: n.type === 'question' ? 'question' : 'changement',
        text: isStr(n.text) ? n.text : '',
        at: isStr(n.at) ? n.at : new Date().toISOString(),
        stale,
      };
    });
  }
  return base;
}

// ---------------------------------------------------------------------------------------------
// URL de forge — pour le lien « fichier complet » d'un diff réduit
// ---------------------------------------------------------------------------------------------

function forgeBase(prUrl, headSha) {
  if (!prUrl || !headSha || headSha === 'WORKTREE') return null;
  let m = /^(https?:\/\/[^/]+\/[^/]+\/[^/]+)\/pull\/\d+/.exec(prUrl);
  if (m) return `${m[1]}/blob/${headSha}/`;
  m = /^(https?:\/\/[^/]+\/.+?)\/-\/merge_requests\/\d+/.exec(prUrl);
  if (m) return `${m[1]}/-/blob/${headSha}/`;
  return null;
}

// ---------------------------------------------------------------------------------------------
// Le gabarit — feuille de style
// ---------------------------------------------------------------------------------------------
// Tokens complets sur `:root` (clair) ; le bloc `prefers-color-scheme` est gardé par
// `:root:not([data-theme="light"])` ; `:root[data-theme="dark"]` les redéfinit une troisième fois
// pour que le choix explicite l'emporte dans les deux sens. `body` peint un fond de token : le
// viewer composite la page sur SON fond, un body transparent emprunterait le thème de l'hôte.
// Aucune police distante — le document local doit tenir hors ligne.

const CSS = `
:root{
  --paper:#f6f6fa; --surface:#ffffff; --surface-2:#eeeef5;
  --ink:#15151f; --ink-2:#54556b; --ink-3:#82839b;
  --line:#e2e2ec; --line-2:#cdcddc;
  --accent:#4a43c4; --accent-ink:#ffffff; --accent-soft:#eceafb;
  --add:#0d6b45; --add-bg:#e8f5ef; --add-gut:#bfe3d2;
  --del:#a81f18; --del-bg:#fdeceb; --del-gut:#f3c8c4;
  --warn:#7a5800; --warn-bg:#faf0d9;
  --shadow:0 1px 2px rgba(18,18,40,.07), 0 10px 28px rgba(18,18,40,.07);
  --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono","JetBrains Mono",Menlo,Consolas,"Liberation Mono",monospace;
  color-scheme:light;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --paper:#121218; --surface:#1a1a22; --surface-2:#23232e;
    --ink:#e9e9f2; --ink-2:#a4a5bb; --ink-3:#7d7e96;
    --line:#2b2b38; --line-2:#3b3b4d;
    --accent:#aaa3ff; --accent-ink:#15151f; --accent-soft:#262148;
    --add:#63d39c; --add-bg:#11261f; --add-gut:#1f4a38;
    --del:#ff9b91; --del-bg:#2b1512; --del-gut:#552723;
    --warn:#e2b45c; --warn-bg:#2b2313;
    --shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 28px rgba(0,0,0,.35);
    color-scheme:dark;
  }
}
:root[data-theme="dark"]{
  --paper:#121218; --surface:#1a1a22; --surface-2:#23232e;
  --ink:#e9e9f2; --ink-2:#a4a5bb; --ink-3:#7d7e96;
  --line:#2b2b38; --line-2:#3b3b4d;
  --accent:#aaa3ff; --accent-ink:#15151f; --accent-soft:#262148;
  --add:#63d39c; --add-bg:#11261f; --add-gut:#1f4a38;
  --del:#ff9b91; --del-bg:#2b1512; --del-gut:#552723;
  --warn:#e2b45c; --warn-bg:#2b2313;
  --shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 28px rgba(0,0,0,.35);
  color-scheme:dark;
}

*,*::before,*::after{box-sizing:border-box}
/* le document complet n'a pas le reset que l'outil Artifact pose autour du fragment */
[hidden]{display:none!important}
html,body{height:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);
  font-size:15px;line-height:1.55;-webkit-text-size-adjust:100%}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

/* ---- coque ---- */
.shell{display:flex;flex-direction:column;height:100dvh;min-height:100dvh}
.topbar{order:0;flex:0 0 auto;background:var(--surface);border-bottom:1px solid var(--line);
  padding:10px 16px 8px}
.pane{order:2;flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain;
  padding:16px 16px calc(96px + env(safe-area-inset-bottom))}
.tabbar{order:3;flex:0 0 auto;display:grid;grid-template-columns:repeat(4,1fr);
  background:var(--surface);border-top:1px solid var(--line);
  padding-bottom:env(safe-area-inset-bottom)}
.tab{appearance:none;border:0;background:none;color:var(--ink-3);font:inherit;font-size:11px;
  font-weight:600;letter-spacing:.04em;text-transform:uppercase;min-height:52px;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  border-top:2px solid transparent;margin-top:-1px}
.tab .cnt{font-size:15px;font-weight:700;letter-spacing:0;font-variant-numeric:tabular-nums;
  text-transform:none;color:var(--ink-2)}
.tab[aria-selected="true"]{color:var(--accent);border-top-color:var(--accent)}
.tab[aria-selected="true"] .cnt{color:var(--accent)}
@media (min-width:640px){
  .tabbar{order:1;border-top:0;border-bottom:1px solid var(--line);
    grid-template-columns:repeat(4,minmax(0,160px));justify-content:start;padding:0 8px}
  .tab{min-height:44px;flex-direction:row;gap:8px;border-top:0;border-bottom:2px solid transparent}
  .tab[aria-selected="true"]{border-bottom-color:var(--accent)}
  .pane{padding:20px 24px 64px}
}

/* ---- barre haute ---- */
.ttl{margin:0;font-size:17px;line-height:1.25;font-weight:700;letter-spacing:-.01em;
  text-wrap:balance;overflow-wrap:anywhere}
.sub{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-top:5px;
  font-size:11.5px;color:var(--ink-2)}
.sub code{font-family:var(--mono);font-size:11px;color:var(--ink-2)}
.stat{font-variant-numeric:tabular-nums;font-weight:600}
.stat .p{color:var(--add)} .stat .m{color:var(--del)}

/* ---- blocs ---- */
.eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink-3);margin:0 0 8px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.stack{display:flex;flex-direction:column;gap:16px}
.wrapmax{max-width:70ch}
.banner{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-radius:8px;
  background:var(--warn-bg);color:var(--warn);font-size:13px;border:1px solid transparent}
.banner b{color:inherit}
.muted{color:var(--ink-2)}
.empty{color:var(--ink-3);font-style:italic;font-size:13.5px}

/* ---- prose (Markdown rendu) ---- */
.prose{overflow-wrap:anywhere}
.prose>*:first-child{margin-top:0}
.prose>*:last-child{margin-bottom:0}
.prose h1,.prose h2,.prose h3,.prose h4{line-height:1.25;text-wrap:balance;margin:1.3em 0 .5em;
  font-weight:700;letter-spacing:-.01em}
.prose h1{font-size:19px} .prose h2{font-size:17px} .prose h3{font-size:15px}
.prose h4{font-size:13.5px;color:var(--ink-2);text-transform:uppercase;letter-spacing:.06em}
.prose p{margin:0 0 .8em}
.prose ul,.prose ol{margin:0 0 .8em;padding-left:1.35em}
.prose li{margin:.2em 0}
.prose blockquote{margin:0 0 .8em;padding:2px 0 2px 12px;border-left:3px solid var(--line-2);
  color:var(--ink-2)}
.prose code{font-family:var(--mono);font-size:.875em;background:var(--surface-2);
  padding:.1em .35em;border-radius:4px}
.prose pre{margin:0 0 .9em;background:var(--surface-2);border:1px solid var(--line);
  border-radius:8px;padding:10px 12px;overflow-x:auto}
.prose pre code{background:none;padding:0;font-size:12.5px;line-height:1.5}
.prose a{color:var(--accent);text-underline-offset:2px}
.prose details{margin:0 0 .8em;border:1px solid var(--line);border-radius:8px;padding:8px 12px;
  background:var(--surface)}
.prose summary{cursor:pointer;font-weight:600;min-height:28px;display:flex;align-items:center}
.prose hr{border:0;border-top:1px solid var(--line);margin:1.2em 0}
.scroll-x{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 .9em}
.prose table{border-collapse:collapse;font-size:13px;min-width:100%}
.prose th,.prose td{border:1px solid var(--line);padding:6px 9px;text-align:left;vertical-align:top}
.prose th{background:var(--surface-2);font-weight:700;white-space:nowrap}
.prose td code{white-space:nowrap}
pre.mermaid{background:var(--surface);border:1px solid var(--line);border-radius:8px;
  padding:12px;overflow-x:auto;text-align:center;font-family:var(--mono);font-size:12px;
  color:var(--ink-2);margin:0 0 .9em}
pre.mermaid svg{max-width:100%;height:auto}

/* ---- liste de fichiers ---- */
.filelist{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:10px;
  overflow:hidden;background:var(--surface)}
.fi{display:flex;align-items:center;gap:10px;padding:0 12px 0 0;border-bottom:1px solid var(--line);
  min-height:46px}
.fi:last-child{border-bottom:0}
.fi>a{flex:1 1 auto;display:flex;align-items:center;gap:8px;min-width:0;padding:11px 0 11px 12px;
  color:inherit;text-decoration:none;font-size:13px}
.fi .path{flex:1 1 auto;min-width:0;direction:rtl;text-align:left;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;font-family:var(--mono);font-size:12px}
.fi .path bdi{direction:ltr}
.fi.done .path{color:var(--ink-3)}
.st{flex:0 0 auto;width:20px;height:20px;border-radius:5px;font-size:10.5px;font-weight:700;
  display:grid;place-items:center;background:var(--surface-2);color:var(--ink-2)}
.st.A{background:var(--add-bg);color:var(--add)} .st.D{background:var(--del-bg);color:var(--del)}
.st.R{background:var(--accent-soft);color:var(--accent)}
.nums{flex:0 0 auto;font-family:var(--mono);font-size:11px;font-variant-numeric:tabular-nums;
  white-space:nowrap;color:var(--ink-3)}
.nums .p{color:var(--add)} .nums .m{color:var(--del)}

/* ---- case « vu » ---- */
.seen{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-width:44px;min-height:44px;cursor:pointer;color:var(--ink-3);font-size:11px;font-weight:600}
.seen input{width:20px;height:20px;accent-color:var(--accent);margin:0}
.seen.on{color:var(--accent)}

/* ---- section par fichier ---- */
.fsec{margin:0 -16px 18px;background:var(--surface);border-top:1px solid var(--line);
  border-bottom:1px solid var(--line)}
@media (min-width:640px){.fsec{margin:0 0 18px;border:1px solid var(--line);border-radius:10px;
  overflow:hidden}}
.fhead{position:sticky;top:0;z-index:5;background:var(--surface);border-bottom:1px solid var(--line);
  padding:8px 12px;display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}
.fhead .path{flex:1 1 180px;min-width:0;font-family:var(--mono);font-size:12px;font-weight:600;
  overflow-wrap:anywhere}
.fhead .path .dir{color:var(--ink-3);font-weight:400}
.fnarr{padding:10px 14px 12px;border-bottom:1px solid var(--line);font-size:13.5px}
.fnarr .role{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--accent)}
.scrut{margin:8px 0 0;padding:8px 12px;border-radius:8px;background:var(--warn-bg);color:var(--warn);
  font-size:12.5px}
.scrut ul{margin:4px 0 0;padding-left:1.2em}
.crits{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.pill{font-family:var(--mono);font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:999px;
  background:var(--accent-soft);color:var(--accent);white-space:nowrap}
.pill.k{background:var(--surface-2);color:var(--ink-2)}

/* ---- diff ---- */
.diff{font-family:var(--mono);font-size:12.5px;line-height:1.5;overflow-x:auto;
  -webkit-overflow-scrolling:touch}
.dl{display:flex;width:max-content;min-width:100%;align-items:flex-start;cursor:pointer}
.dl:hover{background:var(--surface-2)}
.dl .g{flex:0 0 auto;width:44px;padding:0 6px;text-align:right;color:var(--ink-3);
  font-size:11px;font-variant-numeric:tabular-nums;user-select:none;
  border-right:1px solid var(--line);background:var(--surface)}
.dl .g.o{width:42px}
.dl .tx{flex:1 1 auto;white-space:pre;padding:0 10px 0 8px}
.diff[data-wrap="1"] .dl{width:auto}
.diff[data-wrap="1"] .tx{white-space:pre-wrap;overflow-wrap:anywhere}
.dl.add{background:var(--add-bg)} .dl.add .g{background:var(--add-gut);color:var(--add)}
.dl.del{background:var(--del-bg)} .dl.del .g{background:var(--del-gut);color:var(--del)}
.dl.hh{background:var(--surface-2);color:var(--ink-3);font-size:11.5px}
.dl.hh .g{background:var(--surface-2);color:var(--ink-3)}
.dl.noted{box-shadow:inset 3px 0 0 var(--accent)}
/* sous 480 px, seul le numéro « nouveau » reste : la place manque pour deux gouttières */
@media (max-width:479px){.dl .g.o{display:none}}
.fold{display:block;width:100%;text-align:left;appearance:none;border:0;border-top:1px solid var(--line);
  border-bottom:1px solid var(--line);background:var(--surface-2);color:var(--ink-2);
  font-family:var(--mono);font-size:11.5px;padding:7px 12px;cursor:pointer;min-height:34px}
.fold:hover{color:var(--accent)}
.dot{display:inline-block;margin-left:6px;font-size:10px;font-weight:700;padding:1px 6px;
  border-radius:999px;vertical-align:1px;background:var(--accent-soft);color:var(--accent);
  font-family:var(--sans)}
.dot.rejected{background:var(--surface-2);color:var(--ink-3);text-decoration:line-through}
.fnote{padding:10px 14px;font-size:12.5px;color:var(--ink-2)}

/* ---- boutons ---- */
.btn{appearance:none;font:inherit;font-size:12.5px;font-weight:600;min-height:36px;padding:0 12px;
  border-radius:8px;border:1px solid var(--line-2);background:var(--surface);color:var(--ink);
  cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.btn:hover{border-color:var(--accent);color:var(--accent)}
.btn.on{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}
.btn.pri{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);min-height:44px;
  padding:0 18px;font-size:14px}
.btn.pri:hover{color:var(--accent-ink);opacity:.92}
.btn.big{min-height:44px;font-size:14px}
.btn.danger{color:var(--del);border-color:var(--del)}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}

/* ---- boutons flottants ---- */
.fabs{position:fixed;right:12px;bottom:calc(66px + env(safe-area-inset-bottom));z-index:20;
  display:flex;flex-direction:column;gap:8px;align-items:flex-end}
@media (min-width:640px){.fabs{bottom:20px}}
.fab{appearance:none;border:1px solid var(--line-2);background:var(--surface);color:var(--ink);
  box-shadow:var(--shadow);border-radius:999px;min-height:44px;padding:0 16px;font:inherit;
  font-size:12.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px}
.fab:hover{color:var(--accent);border-color:var(--accent)}
.fab[hidden]{display:none!important}

/* ---- feuille basse ---- */
.backdrop{position:fixed;inset:0;z-index:40;background:rgba(10,10,24,.45)}
.sheet{position:fixed;left:0;right:0;bottom:0;z-index:41;background:var(--surface);
  border-top:1px solid var(--line);border-radius:14px 14px 0 0;box-shadow:var(--shadow);
  padding:14px 16px calc(16px + env(safe-area-inset-bottom));max-height:85dvh;overflow-y:auto}
@media (min-width:640px){.sheet{left:50%;right:auto;bottom:24px;transform:translateX(-50%);
  width:min(560px,92vw);border-radius:14px;border:1px solid var(--line)}}
.sheet .grip{width:38px;height:4px;border-radius:2px;background:var(--line-2);margin:0 auto 12px}
.sheet .loc{font-family:var(--mono);font-size:11.5px;color:var(--ink-2);overflow-wrap:anywhere;
  margin-bottom:8px}
.sheet .src{font-family:var(--mono);font-size:12px;background:var(--surface-2);border-radius:6px;
  padding:6px 8px;margin-bottom:12px;overflow-x:auto;white-space:pre}
.seg{display:flex;gap:8px;margin-bottom:10px}
.seg .btn{flex:1 1 0;justify-content:center;min-height:44px}
textarea,input[type="text"]{width:100%;font:inherit;font-size:16px;color:var(--ink);
  background:var(--paper);border:1px solid var(--line-2);border-radius:8px;padding:10px;
  resize:vertical}
textarea{min-height:96px}

/* ---- relecture ---- */
.note{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--surface)}
.note .top{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-bottom:6px}
.note a.loc{font-family:var(--mono);font-size:11.5px;color:var(--accent);overflow-wrap:anywhere}
.note .txt{font-size:13.5px;white-space:pre-wrap;overflow-wrap:anywhere}
.tag{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  padding:2px 7px;border-radius:999px;background:var(--surface-2);color:var(--ink-2)}
.tag.changement{background:var(--accent-soft);color:var(--accent)}
.tag.stale{background:var(--warn-bg);color:var(--warn)}
.saveline{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--ink-3)}
.dotm{width:8px;height:8px;border-radius:50%;background:var(--ink-3);flex:0 0 auto}
.dotm.dirty{background:var(--warn)} .dotm.ok{background:var(--add)} .dotm.err{background:var(--del)}
.grid2{display:grid;grid-template-columns:1fr;gap:10px}
@media (min-width:560px){.grid2{grid-template-columns:repeat(3,1fr)}}
.kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13px}
.kv dt{color:var(--ink-3)} .kv dd{margin:0;font-weight:600;overflow-wrap:anywhere}
`;

// ---------------------------------------------------------------------------------------------
// Le gabarit — le renderer
// ---------------------------------------------------------------------------------------------
// Écrit comme une VRAIE fonction du script puis sérialisé par `toString()` : c'est ce qui permet
// d'y écrire des littéraux de gabarit sans échappement. La fonction est CLOSE — elle ne capture
// rien du module ; tout ce dont elle a besoin est dans `scd-data`.
// Tout le DOM vient de `scd-data`, jamais l'inverse : le document local et l'artefact rendent le
// même écran. Le texte des diffs n'entre dans le DOM que par `textContent` ; le Markdown est
// échappé AVANT conversion.

function rendererMain() {
  'use strict';

  var DATA;
  try {
    DATA = JSON.parse(document.getElementById('scd-data').textContent);
  } catch (err) {
    document.getElementById('app').textContent = 'Données de page illisibles : ' + err.message;
    return;
  }

  var FILES = DATA.files || [];
  var BYPATH = {};
  FILES.forEach(function (f, i) { f._i = i; BYPATH[f.path] = f; });
  var CTX = DATA.context == null ? 3 : DATA.context;
  var STATE = clone(DATA.state);
  var LOCAL_KEY = 'scd-review:' + STATE.pageId;
  var artifactApi = null, localMode = false, saveTimer = null;
  var saveStatus = 'idle', saveMsg = 'enregistrement automatique';
  var wrap = false, sheetCtx = null, currentTab = 'synth';

  // ---- utilitaires -------------------------------------------------------------------------
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs[k] == null || attrs[k] === false) continue;
        if (k === 'text') n.textContent = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else if (k === 'on') { for (var ev in attrs[k]) n.addEventListener(ev, attrs[k][ev]); }
        else if (k === 'cls') n.className = attrs[k];
        else n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
      }
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function $(id) { return document.getElementById(id); }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
  function splitPath(p) {
    var i = String(p).lastIndexOf('/');
    return { dir: i < 0 ? '' : p.slice(0, i + 1), base: i < 0 ? p : p.slice(i + 1) };
  }

  // ---- Markdown minimal ----------------------------------------------------------------------
  var PASS = /^<\/?(details|summary|br|hr|div|p|table|thead|tbody|tr|td|th|img|blockquote|span|em|strong|ul|ol|li|h[1-6])\b/i;
  var SENT = '';

  function inline(raw) {
    var s = esc(raw);
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (m, c) { codes.push(c); return SENT + (codes.length - 1) + SENT; });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
      if (!/^(https?:|#|\.|\/|mailto:)/.test(u)) return t;
      return '<a href="' + u + '" rel="noopener noreferrer" target="_blank">' + t + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(new RegExp(SENT + '(\\d+)' + SENT, 'g'), function (m, i) {
      return '<code>' + codes[+i] + '</code>';
    });
    return s;
  }

  function md(src) {
    if (!src) return '';
    var lines = String(src).replace(/\r\n?/g, '\n').split('\n');
    var out = [], i = 0, para = [];
    function flush() {
      if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    }
    while (i < lines.length) {
      var l = lines[i];
      var fence = /^\s*```(\S*)\s*$/.exec(l);
      if (fence) {
        flush();
        var lang = fence[1], buf = [];
        i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        if (lang === 'mermaid') out.push('<pre class="mermaid">' + esc(buf.join('\n')) + '</pre>');
        else out.push('<pre class="code"><code>' + esc(buf.join('\n')) + '</code></pre>');
        continue;
      }
      if (PASS.test(l.trim())) { flush(); out.push(l); i++; continue; }
      if (/^\s*$/.test(l)) { flush(); i++; continue; }
      var h = /^(#{1,6})\s+(.*)$/.exec(l);
      if (h) {
        flush();
        var lv = Math.min(h[1].length + 1, 6);
        out.push('<h' + lv + '>' + inline(h[2]) + '</h' + lv + '>');
        i++; continue;
      }
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { flush(); out.push('<hr>'); i++; continue; }
      if (/^\s*>\s?/.test(l)) {
        flush();
        var q = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push('<blockquote>' + md(q.join('\n')) + '</blockquote>');
        continue;
      }
      if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        flush();
        var cells = function (row) {
          return row.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
        };
        var head = cells(l);
        i += 2;
        var rows = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
        var t = '<div class="scroll-x"><table><thead><tr>';
        head.forEach(function (c) { t += '<th>' + inline(c) + '</th>'; });
        t += '</tr></thead><tbody>';
        rows.forEach(function (r) {
          t += '<tr>';
          for (var c = 0; c < head.length; c++) t += '<td>' + inline(r[c] == null ? '' : r[c]) + '</td>';
          t += '</tr>';
        });
        out.push(t + '</tbody></table></div>');
        continue;
      }
      var li = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(l);
      if (li) {
        flush();
        var ordered = /\d/.test(li[2]);
        var items = [], cur = null;
        while (i < lines.length) {
          var m2 = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
          if (!m2) {
            if (/^\s{2,}\S/.test(lines[i]) && cur) { cur.text += ' ' + lines[i].trim(); i++; continue; }
            break;
          }
          if (m2[1].length >= 2 && cur) {
            if (!cur.sub) cur.sub = [];
            cur.sub.push(m2[3]);
          } else {
            cur = { text: m2[3], sub: null };
            items.push(cur);
          }
          i++;
        }
        var tag = ordered ? 'ol' : 'ul';
        var acc = '<' + tag + '>';
        items.forEach(function (it) {
          acc += '<li>' + inline(it.text);
          if (it.sub) {
            acc += '<ul>';
            it.sub.forEach(function (s) { acc += '<li>' + inline(s) + '</li>'; });
            acc += '</ul>';
          }
          acc += '</li>';
        });
        out.push(acc + '</' + tag + '>');
        continue;
      }
      para.push(l.trim());
      i++;
    }
    flush();
    return out.join('\n');
  }

  function prose(src) {
    var d = el('div', { cls: 'prose' });
    d.innerHTML = md(src);
    return d;
  }

  // ---- diff : parsing --------------------------------------------------------------------------
  var parsedCache = {};
  function parseDiff(f) {
    if (parsedCache[f.path]) return parsedCache[f.path];
    var res = [], o = 0, n = 0;
    var lines = (f.content || '').split('\n');
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      var m = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/.exec(l);
      if (m) { o = +m[1]; n = +m[2]; res.push({ t: '@', o: null, nn: null, s: l }); continue; }
      var c = l.charAt(0);
      if (c === '+') res.push({ t: '+', o: null, nn: n++, s: l.slice(1) });
      else if (c === '-') res.push({ t: '-', o: o++, nn: null, s: l.slice(1) });
      else res.push({ t: ' ', o: o++, nn: n++, s: l.slice(1) });
    }
    parsedCache[f.path] = res;
    return res;
  }
  function lineExists(path, side, line) {
    var f = BYPATH[path];
    if (!f || !f.content) return false;
    var rows = parseDiff(f);
    for (var i = 0; i < rows.length; i++) {
      if (side === 'new' && rows[i].nn === line) return true;
      if (side === 'old' && rows[i].o === line) return true;
    }
    return false;
  }

  // ---- état -------------------------------------------------------------------------------------
  function refreshStale() {
    (STATE.notes || []).forEach(function (nt) { nt.stale = !lineExists(nt.path, nt.side, nt.line); });
  }
  function readLocal() {
    try { var raw = localStorage.getItem(LOCAL_KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function writeLocal() {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(STATE)); } catch (e) { /* quota, navigation privée */ }
  }
  function adopt(cand) {
    if (!cand || typeof cand !== 'object' || cand.schemaVersion !== 1) return false;
    if (String(cand.updatedAt || '') <= String(STATE.updatedAt || '')) return false;
    STATE = clone(cand);
    if (!STATE.viewed) STATE.viewed = {};
    if (!STATE.notes) STATE.notes = [];
    refreshStale();
    return true;
  }
  function loadState() {
    if (adopt(readLocal())) syncAll();
    try {
      fetch('state.json', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (adopt(j)) syncAll(); })
        .catch(function () { /* document local : aucun state.json à côté */ });
    } catch (e) { /* file:// sans fetch */ }
  }
  function touch() {
    STATE.updatedAt = new Date().toISOString();
    writeLocal();
    setSave('dirty', 'modifications non enregistrées');
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 3000);
  }
  function setSave(status, msg) {
    saveStatus = status; saveMsg = msg;
    var n = $('saveline');
    if (n) renderSaveLine(n);
  }
  function goLocal() {
    localMode = true;
    setSave('local', 'relecture locale, non partagée');
    var b = $('localbanner');
    if (b) b.hidden = false;
  }
  function save() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    writeLocal();
    if (!artifactApi || localMode) { setSave('local', 'relecture locale, non partagée'); return; }
    setSave('saving', 'enregistrement…');
    artifactApi.publish({ 'state.json': JSON.stringify(STATE, null, 2) }).then(function () {
      setSave('ok', 'enregistré à ' + new Date().toLocaleTimeString('fr-FR'));
    }).catch(function (e) {
      var code = (e && e.code) || 'upstream_error';
      if (code === 'conflict') {
        setSave('err', 'une version plus récente a été publiée — relecture de l’état');
        try {
          fetch('state.json', { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (j) { if (adopt(j)) syncAll(); })
            .catch(function () {});
        } catch (e2) { /* rien */ }
        return;
      }
      if (code === 'not_writer' || code === 'not_granted' || code === 'capability_disabled'
        || code === 'capability_removed' || code === 'not_declared' || code === 'consent_required') {
        goLocal();
        return;
      }
      setSave('err', 'enregistrement impossible (' + code + ') — la relecture reste dans ce navigateur');
    });
  }
  function initArtifact() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') { goLocal(); return; }
      window.claude.use('artifact').then(function (api) {
        if (!api || typeof api.publish !== 'function') { goLocal(); return; }
        artifactApi = api;
        if (saveStatus !== 'dirty') setSave('idle', 'enregistrement automatique');
      }).catch(function () { goLocal(); });
    } catch (e) { goLocal(); }
  }

  // ---- mermaid ---------------------------------------------------------------------------------
  var mermaidLoading = null;
  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }
  function runMermaid(root) {
    var nodes = [].slice.call(root.querySelectorAll('pre.mermaid:not([data-mmd])'));
    if (!nodes.length) return;
    nodes.forEach(function (n) { n.setAttribute('data-mmd', '1'); });
    // Dans le viewer d'artefact, <pre class="mermaid"> est rendu nativement : ne rien charger.
    if (window.claude) return;
    if (!DATA.mermaidUrl) return;
    if (!mermaidLoading) {
      mermaidLoading = new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = DATA.mermaidUrl;
        s.onload = function () {
          try {
            window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict',
              theme: isDark() ? 'dark' : 'default' });
            res(window.mermaid);
          } catch (e) { rej(e); }
        };
        s.onerror = function () { rej(new Error('mermaid indisponible')); };
        document.head.appendChild(s);
      });
    }
    mermaidLoading.then(function (m) { return m.run({ nodes: nodes }); })
      .catch(function () {
        nodes.forEach(function (n) {
          if (!n.querySelector('svg')) n.setAttribute('data-fallback', 'source du diagramme');
        });
      });
  }

  // ---- coque -----------------------------------------------------------------------------------
  var TABS = [
    { id: 'synth', label: 'Synthèse' },
    { id: 'files', label: 'Fichiers' },
    { id: 'archi', label: 'Architecture' },
    { id: 'review', label: 'Relecture' },
  ];

  function stats() {
    var add = 0, del = 0;
    FILES.forEach(function (f) { add += f.add || 0; del += f.del || 0; });
    return { add: add, del: del, files: FILES.length };
  }
  function viewedCount() {
    var n = 0;
    FILES.forEach(function (f) { if (STATE.viewed[f.path]) n++; });
    return n;
  }

  function buildShell() {
    var app = clear($('app'));
    var m = DATA.meta || {};
    var s = stats();

    var sub = el('div', { cls: 'sub' });
    if (m.ticket) sub.appendChild(el('span', { cls: 'pill', text: m.ticket }));
    if (m.verifMode) sub.appendChild(el('span', { cls: 'pill k', text: 'vérif : ' + m.verifMode }));
    if (m.branch) {
      sub.appendChild(el('code', { text: m.branch + ' → ' + (m.base || DATA.baseShort || '?') }));
    }
    var st = el('span', { cls: 'stat' });
    st.appendChild(el('span', { cls: 'p', text: '+' + s.add }));
    st.appendChild(document.createTextNode(' '));
    st.appendChild(el('span', { cls: 'm', text: '−' + s.del }));
    st.appendChild(document.createTextNode(' · ' + s.files + (s.files > 1 ? ' fichiers' : ' fichier')));
    sub.appendChild(st);
    if (DATA.pr && DATA.pr.url) {
      sub.appendChild(el('a', { href: DATA.pr.url, target: '_blank', rel: 'noopener noreferrer',
        text: 'PR ↗', style: 'color:var(--accent)' }));
    }

    var topbar = el('header', { cls: 'topbar' }, [
      el('h1', { cls: 'ttl', text: m.title }),
      sub,
    ]);

    var pane = el('main', { cls: 'pane', id: 'pane' });
    var tabbar = el('nav', { cls: 'tabbar', role: 'tablist', id: 'tabbar' });
    TABS.forEach(function (t) {
      var b = el('button', {
        cls: 'tab', id: 'tab-' + t.id, type: 'button', role: 'tab',
        'aria-selected': t.id === currentTab ? 'true' : 'false',
        on: { click: function () { showTab(t.id); } },
      }, [
        el('span', { cls: 'cnt', id: 'cnt-' + t.id, text: tabCount(t.id) }),
        el('span', { text: t.label }),
      ]);
      tabbar.appendChild(b);
    });

    var fabs = el('div', { cls: 'fabs', id: 'fabs', hidden: true }, [
      el('button', { cls: 'fab', type: 'button', id: 'fab-hunk', text: '↓ bloc suivant',
        on: { click: nextHunk } }),
      el('button', { cls: 'fab', type: 'button', id: 'fab-file', text: '→ fichier non vu',
        on: { click: nextUnseen } }),
    ]);

    app.appendChild(el('div', { cls: 'shell' }, [topbar, pane, tabbar]));
    app.appendChild(fabs);
    app.appendChild(el('div', { id: 'sheetroot' }));
    showTab(currentTab);
  }

  function tabCount(id) {
    if (id === 'files') return viewedCount() + '/' + FILES.length;
    if (id === 'review') return String((STATE.notes || []).length);
    if (id === 'archi') return String(((DATA.diagrams || []).length) + (DATA.impact ? 1 : 0));
    var n = (DATA.criteria || []).length;
    return n ? String(n) : '·';
  }
  function syncCounts() {
    TABS.forEach(function (t) { var n = $('cnt-' + t.id); if (n) n.textContent = tabCount(t.id); });
  }

  var scrollMem = {};
  function showTab(id) {
    var pane = $('pane');
    if (pane && currentTab) scrollMem[currentTab] = pane.scrollTop;
    currentTab = id;
    TABS.forEach(function (t) {
      var b = $('tab-' + t.id);
      if (b) b.setAttribute('aria-selected', t.id === id ? 'true' : 'false');
    });
    clear(pane);
    if (id === 'synth') pane.appendChild(paneSynth());
    else if (id === 'files') pane.appendChild(paneFiles());
    else if (id === 'archi') pane.appendChild(paneArchi());
    else pane.appendChild(paneReview());
    $('fabs').hidden = id !== 'files';
    pane.scrollTop = scrollMem[id] || 0;
    runMermaid(pane);
  }

  // ---- onglet Synthèse -------------------------------------------------------------------------
  function paneSynth() {
    var wrapEl = el('div', { cls: 'stack wrapmax' });

    var banner = el('div', { cls: 'banner', id: 'localbanner', hidden: true }, [
      el('div', { html: '<b>Relecture locale.</b> Les cases et les notes restent dans ce navigateur : '
        + 'elles ne sont pas partagées. Le bouton <b>Copier le compte-rendu</b> (onglet Relecture) est '
        + 'le moyen de les sortir d’ici.' }),
    ]);
    wrapEl.appendChild(banner);

    if (DATA.truncated) {
      wrapEl.appendChild(el('div', { cls: 'banner' }, [
        el('div', { html: '<b>Page tronquée.</b> '
          + esc((DATA.truncatedLog || []).join(' · ') || 'le diff dépassait la taille tenable ; les '
          + 'fichiers concernés sont réduits ou sans contenu.') }),
      ]));
    }
    if (!DATA.hasNarration) {
      wrapEl.appendChild(el('div', { cls: 'banner' }, [
        el('div', { html: '<b>Narration absente.</b> Le manifeste ne porte pas de <code>page</code> : '
          + 'les diffs sont là, la lecture guidée non.' }),
      ]));
    }

    if (DATA.body) wrapEl.appendChild(el('section', { cls: 'card' }, [prose(DATA.body)]));
    else wrapEl.appendChild(el('section', { cls: 'card' }, [
      el('p', { cls: 'empty', text: 'Aucun corps de PR fourni.' })]));

    var crit = DATA.criteria || [];
    if (crit.length) {
      var tb = el('tbody');
      crit.forEach(function (c) {
        tb.appendChild(el('tr', null, [
          el('td', null, [el('code', { text: c.id || '–' })]),
          el('td', { text: c.text || '' }),
          el('td', null, [el('code', { text: c.test || '–' })]),
          el('td', { text: c.status || '' }),
        ]));
      });
      var table = el('table', null, [
        el('thead', null, [el('tr', null, [
          el('th', { text: 'Critère' }), el('th', { text: 'Ce qu’il exige' }),
          el('th', { text: 'Test' }), el('th', { text: 'Statut' })])]),
        tb,
      ]);
      var sec = el('section', { cls: 'card' }, [
        el('p', { cls: 'eyebrow', text: 'Critère → test → statut' }),
        el('div', { cls: 'scroll-x prose' }, [table]),
      ]);
      wrapEl.appendChild(sec);
    }

    var un = DATA.findings && DATA.findings.unanchored ? DATA.findings.unanchored : [];
    if (un.length) {
      var list = el('div', { cls: 'stack' });
      un.forEach(function (f) { list.appendChild(findingCard(f)); });
      wrapEl.appendChild(el('section', { cls: 'card' }, [
        el('p', { cls: 'eyebrow', text: 'Findings sans ligne' }),
        list,
      ]));
    }

    var hc = (DATA.review && DATA.review.humanChecks) || [];
    if (hc.length) {
      var ul = el('ul');
      hc.forEach(function (t) { ul.appendChild(el('li', { text: t })); });
      wrapEl.appendChild(el('section', { cls: 'card prose' }, [
        el('p', { cls: 'eyebrow', text: 'À constater par un humain' }), ul]));
    }

    if (DATA.narrationMissing && DATA.narrationMissing.length) {
      wrapEl.appendChild(el('div', { cls: 'banner' }, [
        el('div', { text: 'Fichiers du diff sans narration : ' + DATA.narrationMissing.join(', ') }),
      ]));
    }
    if (DATA.narrationExtra && DATA.narrationExtra.length) {
      wrapEl.appendChild(el('div', { cls: 'banner' }, [
        el('div', { text: 'Narration portant sur des fichiers absents du diff : ' + DATA.narrationExtra.join(', ') }),
      ]));
    }
    return wrapEl;
  }

  function findingCard(f) {
    var top = el('div', { cls: 'top' }, [
      el('span', { cls: 'tag ' + (f.state === 'applied' ? 'changement' : ''),
        text: f.state === 'applied' ? 'appliqué' : 'rejeté' }),
      f.dimension ? el('span', { cls: 'pill k', text: f.dimension }) : null,
      f.id ? el('code', { text: f.id, style: 'font-size:11px;color:var(--ink-3)' }) : null,
    ]);
    var box = el('div', { cls: 'note' }, [top]);
    if (f.summary) box.appendChild(el('div', { cls: 'txt', text: f.summary }));
    if (f.reason) box.appendChild(el('div', { cls: 'txt muted', text: 'Motif : ' + f.reason }));
    if (f.location) box.appendChild(el('div', { cls: 'loc muted', text: f.location,
      style: 'font-family:var(--mono);font-size:11.5px' }));
    return box;
  }

  // ---- onglet Fichiers -------------------------------------------------------------------------
  function paneFiles() {
    var root = el('div');
    var head = el('div', { cls: 'row', style: 'margin-bottom:12px' }, [
      el('button', {
        cls: 'btn' + (wrap ? ' on' : ''), type: 'button', id: 'wrapbtn',
        text: 'Retour à la ligne',
        on: { click: function () {
          wrap = !wrap;
          $('wrapbtn').className = 'btn' + (wrap ? ' on' : '');
          [].slice.call(document.querySelectorAll('.diff')).forEach(function (d) {
            d.setAttribute('data-wrap', wrap ? '1' : '0');
          });
        } },
      }),
      el('span', { cls: 'muted', style: 'font-size:12px',
        text: viewedCount() + ' / ' + FILES.length + ' vus', id: 'seencount' }),
    ]);
    root.appendChild(head);

    var list = el('div', { cls: 'filelist', style: 'margin-bottom:20px' });
    FILES.forEach(function (f) { list.appendChild(fileRow(f)); });
    root.appendChild(list);

    var sections = el('div', { id: 'sections' });
    FILES.forEach(function (f) { sections.appendChild(fileSection(f)); });
    root.appendChild(sections);
    setTimeout(function () { renderQueue(0); }, 60);
    return root;
  }

  function fileRow(f) {
    var row = el('div', { cls: 'fi' + (STATE.viewed[f.path] ? ' done' : ''), id: 'row-' + f._i });
    var link = el('a', { href: '#f-' + f._i, on: { click: function (ev) {
      ev.preventDefault(); goToFile(f._i);
    } } }, [
      el('span', { cls: 'st ' + f.status, text: f.status }),
      el('span', { cls: 'path' }, [el('bdi', { text: f.path })]),
      el('span', { cls: 'nums' }, [
        el('span', { cls: 'p', text: '+' + (f.add == null ? '?' : f.add) }),
        document.createTextNode(' '),
        el('span', { cls: 'm', text: '−' + (f.del == null ? '?' : f.del) }),
      ]),
    ]);
    row.appendChild(link);
    row.appendChild(seenBox(f, 'rowseen-' + f._i));
    return row;
  }

  function seenBox(f, id) {
    var input = el('input', { type: 'checkbox', id: id, checked: !!STATE.viewed[f.path],
      'aria-label': 'marquer ' + f.path + ' comme vu',
      on: { change: function (ev) { setViewed(f.path, ev.target.checked); } } });
    var lab = el('label', { cls: 'seen' + (STATE.viewed[f.path] ? ' on' : ''), for: id,
      'data-path': f.path }, [input, el('span', { text: 'vu' })]);
    return lab;
  }

  function setViewed(path, on) {
    if (on) STATE.viewed[path] = true; else delete STATE.viewed[path];
    touch();
    syncViewed();
  }
  function syncViewed() {
    FILES.forEach(function (f) {
      var on = !!STATE.viewed[f.path];
      ['rowseen-' + f._i, 'secseen-' + f._i].forEach(function (id) {
        var i = $(id);
        if (!i) return;
        i.checked = on;
        if (i.parentNode) i.parentNode.className = 'seen' + (on ? ' on' : '');
      });
      var r = $('row-' + f._i);
      if (r) r.className = 'fi' + (on ? ' done' : '');
      var s = $('f-' + f._i);
      if (s) s.setAttribute('data-seen', on ? '1' : '0');
    });
    var c = $('seencount');
    if (c) c.textContent = viewedCount() + ' / ' + FILES.length + ' vus';
    syncCounts();
  }

  function fileSection(f) {
    var sp = splitPath(f.path);
    var narr = (DATA.narration || {})[f.path] || null;

    var headRow = el('div', { cls: 'fhead' }, [
      el('div', { cls: 'path' }, [
        el('span', { cls: 'dir', text: sp.dir }), el('span', { text: sp.base }),
      ]),
      el('span', { cls: 'st ' + f.status, text: f.status }),
      el('span', { cls: 'nums' }, [
        el('span', { cls: 'p', text: '+' + (f.add == null ? '?' : f.add) }),
        document.createTextNode(' '),
        el('span', { cls: 'm', text: '−' + (f.del == null ? '?' : f.del) }),
      ]),
      seenBox(f, 'secseen-' + f._i),
    ]);

    var sec = el('section', { cls: 'fsec', id: 'f-' + f._i, 'data-path': f.path,
      'data-seen': STATE.viewed[f.path] ? '1' : '0' }, [headRow]);

    if (f.oldPath) {
      sec.appendChild(el('div', { cls: 'fnote', text: 'renommé depuis ' + f.oldPath
        + (f.score ? ' (' + f.score + '% de similarité)' : '') }));
    }
    if (f.crlf) sec.appendChild(el('div', { cls: 'fnote', text: 'fins de ligne CRLF — le \\r est retiré à l’affichage' }));
    if (f.noNewline) sec.appendChild(el('div', { cls: 'fnote', text: 'pas de saut de ligne en fin de fichier' }));

    if (narr) {
      var box = el('div', { cls: 'fnarr' });
      var line = el('div', { cls: 'row', style: 'gap:8px;margin-bottom:4px' });
      if (narr.role) line.appendChild(el('span', { cls: 'role', text: narr.role }));
      if (narr.kind) line.appendChild(el('span', { cls: 'pill k', text: narr.kind }));
      box.appendChild(line);
      if (narr.summary) box.appendChild(prose(narr.summary));
      if (narr.scrutinize && narr.scrutinize.length) {
        var ul = el('ul');
        narr.scrutinize.forEach(function (s) { ul.appendChild(el('li', { text: s })); });
        box.appendChild(el('div', { cls: 'scrut' }, [
          el('b', { text: 'À scruter' }), ul]));
      }
      if (narr.criteria && narr.criteria.length) {
        var pills = el('div', { cls: 'crits' });
        narr.criteria.forEach(function (c) { pills.appendChild(el('span', { cls: 'pill', text: c })); });
        box.appendChild(pills);
      }
      sec.appendChild(box);
    }

    var body = el('div', { id: 'body-' + f._i });
    sec.appendChild(body);
    return sec;
  }

  function renderQueue(i) {
    if (i >= FILES.length) return;
    ensureBody(FILES[i]);
    setTimeout(function () { renderQueue(i + 1); }, 0);
  }
  function ensureBody(f) {
    var host = $('body-' + f._i);
    if (!host || host.getAttribute('data-done') === '1') return host;
    host.setAttribute('data-done', '1');
    clear(host);
    if (!f.content) {
      var msg = f.note || 'contenu non affiché';
      host.appendChild(el('div', { cls: 'fnote', text: msg }));
      if (f.forgeUrl) {
        host.appendChild(el('div', { cls: 'fnote' }, [
          el('a', { href: f.forgeUrl, target: '_blank', rel: 'noopener noreferrer',
            text: 'ouvrir le fichier sur la forge ↗', style: 'color:var(--accent)' })]));
      }
      return host;
    }
    var bar = el('div', { cls: 'row', style: 'padding:8px 12px;border-bottom:1px solid var(--line)' });
    if (f.fullAvailable) {
      bar.appendChild(el('button', {
        cls: 'btn', type: 'button', id: 'full-' + f._i, text: 'Fichier complet',
        on: { click: function () {
          f._full = !f._full;
          $('full-' + f._i).className = 'btn' + (f._full ? ' on' : '');
          host.setAttribute('data-done', '0');
          ensureBody(f);
        } },
      }));
      if (f._full) bar.lastChild.className = 'btn on';
    } else {
      bar.appendChild(el('span', { cls: 'muted', style: 'font-size:12px',
        text: 'contexte réduit à 3 lignes (fichier volumineux)' }));
      if (f.forgeUrl) {
        bar.appendChild(el('a', { cls: 'btn', href: f.forgeUrl, target: '_blank',
          rel: 'noopener noreferrer', text: 'Fichier complet ↗' }));
      }
    }
    host.appendChild(bar);
    host.appendChild(diffDom(f));
    return host;
  }

  function notesFor(path) {
    return (STATE.notes || []).filter(function (n) { return n.path === path; });
  }

  function diffDom(f) {
    var rows = parseDiff(f);
    var keep = new Array(rows.length);
    if (f._full) {
      for (var k = 0; k < rows.length; k++) keep[k] = true;
    } else {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].t === '@') { keep[i] = true; continue; }
        if (rows[i].t === '+' || rows[i].t === '-') {
          for (var j = Math.max(0, i - CTX); j <= Math.min(rows.length - 1, i + CTX); j++) keep[j] = true;
        }
      }
      var marks = (DATA.findings && DATA.findings.anchored && DATA.findings.anchored[f.path]) || [];
      marks.concat(notesFor(f.path)).forEach(function (a) {
        for (var i2 = 0; i2 < rows.length; i2++) {
          if (rows[i2].nn === a.line || rows[i2].o === a.line) {
            for (var j2 = Math.max(0, i2 - 2); j2 <= Math.min(rows.length - 1, i2 + 2); j2++) keep[j2] = true;
          }
        }
      });
    }
    var box = el('div', { cls: 'diff', 'data-wrap': wrap ? '1' : '0' });
    var i3 = 0, last = null;
    while (i3 < rows.length) {
      if (keep[i3]) {
        var r = rows[i3];
        var chg = (r.t === '+' || r.t === '-') && last !== '+' && last !== '-';
        box.appendChild(diffLine(f, r, chg));
        last = r.t;
        i3++;
      } else {
        var start = i3;
        while (i3 < rows.length && !keep[i3]) i3++;
        box.appendChild(foldButton(f, box, start, i3, rows));
        last = null;
      }
    }
    return box;
  }

  function foldButton(f, box, start, end, rows) {
    var n = end - start;
    var b = el('button', { cls: 'fold', type: 'button',
      text: '⋯ ' + n + (n > 1 ? ' lignes inchangées' : ' ligne inchangée') });
    b.addEventListener('click', function () {
      var frag = document.createDocumentFragment();
      for (var i = start; i < end; i++) frag.appendChild(diffLine(f, rows[i], false));
      box.replaceChild(frag, b);
    });
    return b;
  }

  function diffLine(f, r, chgStart) {
    var cls = 'dl';
    if (r.t === '+') cls += ' add';
    else if (r.t === '-') cls += ' del';
    else if (r.t === '@') cls += ' hh';
    if (chgStart && (r.t === '+' || r.t === '-')) cls += ' chg';
    var side = r.t === '-' ? 'old' : 'new';
    var num = r.t === '-' ? r.o : r.nn;
    var node = el('div', {
      cls: cls, 'data-path': f.path, 'data-side': side,
      'data-line': num == null ? '' : String(num),
    }, [
      el('span', { cls: 'g o', text: r.o == null ? '' : String(r.o) }),
      el('span', { cls: 'g n', text: r.nn == null ? '' : String(r.nn) }),
    ]);
    var tx = el('span', { cls: 'tx' });
    var sign = r.t === '@' ? '' : (r.t === ' ' ? ' ' : r.t);
    tx.textContent = sign + (r.t === '@' ? r.s : r.s);
    node.appendChild(tx);

    if (r.t !== '@' && num != null) {
      var marks = (DATA.findings && DATA.findings.anchored && DATA.findings.anchored[f.path]) || [];
      marks.forEach(function (a) {
        if (a.line !== num || side !== 'new') return;
        tx.appendChild(el('span', {
          cls: 'dot' + (a.state === 'rejected' ? ' rejected' : ''),
          title: (a.dimension || '') + ' — ' + (a.summary || a.reason || ''),
          text: (a.dimension || 'finding').slice(0, 3),
        }));
      });
      if (notesFor(f.path).some(function (n2) { return n2.line === num && n2.side === side; })) {
        node.className += ' noted';
      }
      node.addEventListener('click', function (ev) {
        if (window.getSelection && String(window.getSelection()).length > 2) return;
        openSheet(f, side, num, r.s);
      });
    }
    return node;
  }

  function goToFile(i) {
    var f = FILES[i];
    if (currentTab !== 'files') showTab('files');
    ensureBody(f);
    var sec = $('f-' + i);
    if (sec) sec.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function nextUnseen() {
    var pane = $('pane');
    for (var i = 0; i < FILES.length; i++) {
      if (STATE.viewed[FILES[i].path]) continue;
      var sec = $('f-' + i);
      if (!sec) continue;
      if (sec.getBoundingClientRect().top > 60) { goToFile(i); return; }
    }
    for (var j = 0; j < FILES.length; j++) {
      if (!STATE.viewed[FILES[j].path]) { goToFile(j); return; }
    }
    pane.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function nextHunk() {
    var all = [].slice.call(document.querySelectorAll('#sections .dl.chg'));
    for (var i = 0; i < all.length; i++) {
      var top = all[i].getBoundingClientRect().top;
      if (top > 120) { all[i].scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    }
    if (all.length) all[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // ---- feuille basse de note -------------------------------------------------------------------
  function openSheet(f, side, line, src) {
    closeSheet();
    var existing = (STATE.notes || []).filter(function (n) {
      return n.path === f.path && n.line === line && n.side === side;
    })[0] || null;
    var type = existing ? existing.type : 'question';

    var ta = el('textarea', { id: 'notetext', placeholder: 'Ce qui vous arrête sur cette ligne…' });
    ta.value = existing ? existing.text : '';

    function segBtn(val, label) {
      return el('button', {
        cls: 'btn' + (type === val ? ' on' : ''), type: 'button', 'data-val': val,
        text: label,
        on: { click: function () {
          type = val;
          [].slice.call(document.querySelectorAll('#sheet .seg .btn')).forEach(function (b) {
            b.className = 'btn' + (b.getAttribute('data-val') === type ? ' on' : '');
          });
        } },
      });
    }

    var sheet = el('div', { cls: 'sheet', id: 'sheet', role: 'dialog', 'aria-modal': 'true' }, [
      el('div', { cls: 'grip' }),
      el('div', { cls: 'loc', text: f.path + ':' + line + (side === 'old' ? ' (ancienne)' : '') }),
      el('div', { cls: 'src', text: (src || '').slice(0, 400) }),
      el('div', { cls: 'seg' }, [segBtn('question', 'Question'), segBtn('changement', 'Changement')]),
      ta,
      el('div', { cls: 'row', style: 'margin-top:12px' }, [
        el('button', { cls: 'btn pri', type: 'button', text: 'Enregistrer la note',
          on: { click: function () {
            var txt = ta.value.trim();
            if (!txt) { if (existing) removeNote(existing.id); closeSheet(); return; }
            if (existing) {
              existing.text = txt; existing.type = type; existing.at = new Date().toISOString();
              existing.stale = false;
            } else {
              STATE.notes.push({
                id: 'n' + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100),
                path: f.path, line: line, side: side, type: type, text: txt,
                at: new Date().toISOString(), stale: false,
              });
            }
            touch(); closeSheet(); markNoted(f.path, line, side); syncCounts();
          } } }),
        existing ? el('button', { cls: 'btn danger big', type: 'button', text: 'Supprimer',
          on: { click: function () { removeNote(existing.id); closeSheet(); } } }) : null,
        el('button', { cls: 'btn big', type: 'button', text: 'Annuler', on: { click: closeSheet } }),
      ]),
    ]);
    var root = $('sheetroot');
    root.appendChild(el('div', { cls: 'backdrop', id: 'backdrop', on: { click: closeSheet } }));
    root.appendChild(sheet);
    ta.focus();
  }
  function closeSheet() { clear($('sheetroot')); }
  function removeNote(id) {
    STATE.notes = (STATE.notes || []).filter(function (n) { return n.id !== id; });
    touch(); syncCounts();
    [].slice.call(document.querySelectorAll('.dl.noted')).forEach(function (n) {
      var p = n.getAttribute('data-path'), l = Number(n.getAttribute('data-line')),
        s = n.getAttribute('data-side');
      if (!(STATE.notes || []).some(function (x) { return x.path === p && x.line === l && x.side === s; })) {
        n.className = n.className.replace(' noted', '');
      }
    });
  }
  function markNoted(path, line, side) {
    [].slice.call(document.querySelectorAll('.dl')).forEach(function (n) {
      if (n.getAttribute('data-path') === path && Number(n.getAttribute('data-line')) === line
        && n.getAttribute('data-side') === side && n.className.indexOf('noted') < 0) {
        n.className += ' noted';
      }
    });
  }

  // ---- onglet Architecture ---------------------------------------------------------------------
  function paneArchi() {
    var root = el('div', { cls: 'stack wrapmax' });
    var diags = DATA.diagrams || [];
    if (!diags.length && !DATA.impact) {
      root.appendChild(el('p', { cls: 'empty',
        text: 'Aucun schéma : le manifeste ne porte ni diagramme ni modèle.' }));
      return root;
    }
    diags.forEach(function (d) {
      var sec = el('section', { cls: 'card' }, [
        el('p', { cls: 'eyebrow', text: d.title || d.id || 'vue' }),
      ]);
      sec.appendChild(el('pre', { cls: 'mermaid', text: d.mermaid }));
      root.appendChild(sec);
    });
    if (DATA.impact) {
      var sec2 = el('section', { cls: 'card' }, [
        el('p', { cls: 'eyebrow', text: 'Graphe d’impact' }),
        el('p', { cls: 'muted', style: 'font-size:12.5px;margin:0 0 10px',
          text: 'Les éléments touchés par ce diff sont en trait épais ; une flèche pointillée est une relation asynchrone.' }),
      ]);
      sec2.appendChild(el('pre', { cls: 'mermaid', text: DATA.impact }));
      if (DATA.model && DATA.model.unmapped && DATA.model.unmapped.length) {
        var ul = el('ul');
        DATA.model.unmapped.forEach(function (u) { ul.appendChild(el('li', null, [el('code', { text: u })])); });
        sec2.appendChild(el('div', { cls: 'prose' }, [
          el('h4', { text: 'Hors modèle' }),
          el('p', { cls: 'muted', text: 'Fichiers du diff qu’aucun sourceDir ne couvre.' }),
          ul,
        ]));
      }
      root.appendChild(sec2);
    }
    if (DATA.modelFilesInDiff && DATA.modelFilesInDiff.length) {
      root.appendChild(el('div', { cls: 'banner' }, [
        el('div', { text: 'Le modèle lui-même est modifié par ce diff : '
          + DATA.modelFilesInDiff.join(', ') })]));
    }
    return root;
  }

  // ---- onglet Relecture ------------------------------------------------------------------------
  var VERDICTS = [
    { id: 'approve', label: 'Approuvé' },
    { id: 'request_changes', label: 'Changements demandés' },
    { id: 'comment', label: 'Commentaire' },
  ];

  function paneReview() {
    var root = el('div', { cls: 'stack wrapmax' });

    var vrow = el('div', { cls: 'grid2' });
    VERDICTS.forEach(function (v) {
      vrow.appendChild(el('button', {
        cls: 'btn big' + (STATE.verdict === v.id ? ' on' : ''), type: 'button',
        'data-verdict': v.id, text: v.label,
        on: { click: function () {
          STATE.verdict = STATE.verdict === v.id ? null : v.id;
          touch();
          [].slice.call(document.querySelectorAll('[data-verdict]')).forEach(function (b) {
            b.className = 'btn big' + (b.getAttribute('data-verdict') === STATE.verdict ? ' on' : '');
          });
        } },
      }));
    });
    root.appendChild(el('section', { cls: 'card' }, [
      el('p', { cls: 'eyebrow', text: 'Verdict' }), vrow]));

    var gen = el('textarea', { id: 'general', placeholder: 'Ce que vous diriez en ouvrant la revue…' });
    gen.value = STATE.general || '';
    gen.addEventListener('input', function () { STATE.general = gen.value; touch(); });
    root.appendChild(el('section', { cls: 'card' }, [
      el('p', { cls: 'eyebrow', text: 'Note générale' }), gen]));

    var notes = (STATE.notes || []).slice().sort(function (a, b) {
      return a.path === b.path ? (a.line || 0) - (b.line || 0) : a.path.localeCompare(b.path);
    });
    var nsec = el('section', { cls: 'stack' }, [
      el('p', { cls: 'eyebrow', text: 'Notes ancrées (' + notes.length + ')' }),
    ]);
    if (!notes.length) {
      nsec.appendChild(el('p', { cls: 'empty', text: 'Aucune note. Touchez une ligne d’un diff pour en poser une.' }));
    }
    notes.forEach(function (n) {
      var loc = el('a', { cls: 'loc', href: '#', text: n.path + ':' + n.line,
        on: { click: function (ev) {
          ev.preventDefault();
          var f = BYPATH[n.path];
          if (f) goToFile(f._i);
        } } });
      var top = el('div', { cls: 'top' }, [
        el('span', { cls: 'tag ' + n.type, text: n.type }),
        loc,
        n.stale ? el('span', { cls: 'tag stale', text: 'périmée' }) : null,
      ]);
      nsec.appendChild(el('div', { cls: 'note' }, [
        top,
        el('div', { cls: 'txt', text: n.text }),
        el('div', { cls: 'row', style: 'margin-top:8px' }, [
          el('button', { cls: 'btn', type: 'button', text: 'Supprimer',
            on: { click: function () { removeNote(n.id); showTab('review'); } } }),
        ]),
      ]));
    });
    root.appendChild(nsec);

    var sl = el('div', { cls: 'saveline', id: 'saveline', style: 'margin-top:10px' });
    root.appendChild(el('section', { cls: 'card' }, [
      el('div', { cls: 'row' }, [
        el('button', { cls: 'btn pri', type: 'button', text: 'Copier le compte-rendu',
          on: { click: copyReport } }),
        el('button', { cls: 'btn big', type: 'button', text: 'Enregistrer', on: { click: save } }),
      ]),
      sl,
    ]));
    renderSaveLine(sl);
    return root;
  }

  function renderSaveLine(node) {
    clear(node);
    var map = { idle: '', dirty: 'dirty', saving: 'dirty', ok: 'ok', err: 'err', local: 'dirty' };
    node.appendChild(el('span', { cls: 'dotm ' + (map[saveStatus] || '') }));
    node.appendChild(el('span', { text: saveMsg }));
    var n = (STATE.notes || []).length;
    node.appendChild(el('span', { text: '· ' + n + (n > 1 ? ' notes' : ' note')
      + ' · ' + viewedCount() + '/' + FILES.length + ' fichiers vus' }));
  }

  function reportMarkdown() {
    var m = DATA.meta || {};
    var v = VERDICTS.filter(function (x) { return x.id === STATE.verdict; })[0];
    var out = [];
    out.push('## Relecture — ' + (m.ticket ? m.ticket + ' · ' : '') + m.title);
    out.push('');
    out.push('**Verdict :** ' + (v ? v.label : 'non rendu')
      + ' · ' + viewedCount() + '/' + FILES.length + ' fichiers vus');
    if (STATE.general && STATE.general.trim()) { out.push(''); out.push(STATE.general.trim()); }
    var notes = (STATE.notes || []).slice().sort(function (a, b) {
      return a.path === b.path ? (a.line || 0) - (b.line || 0) : a.path.localeCompare(b.path);
    });
    if (notes.length) {
      out.push('');
      out.push('### Notes');
      var cur = null;
      notes.forEach(function (n) {
        if (n.path !== cur) { cur = n.path; out.push(''); out.push('**`' + n.path + '`**'); }
        out.push('- `:' + n.line + '` **' + n.type + '** — ' + n.text.replace(/\n+/g, ' ')
          + (n.stale ? ' _(ligne disparue du diff)_' : ''));
      });
    }
    out.push('');
    out.push('_Relu depuis la page de relecture scd-spec-dev._');
    return out.join('\n');
  }

  function copyReport() {
    var txt = reportMarkdown();
    function done(ok) { setSave(ok ? 'ok' : 'err', ok ? 'compte-rendu copié' : 'copie refusée — sélectionnez le texte'); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { fallback(); });
        return;
      }
    } catch (e) { /* repli */ }
    fallback();
    function fallback() {
      var ta = el('textarea', { style: 'position:fixed;left:-9999px;top:0' });
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
  }

  // ---- synchronisation globale -----------------------------------------------------------------
  function syncAll() {
    if (currentTab === 'files') syncViewed();
    else showTab(currentTab);
    syncCounts();
  }

  // ---- démarrage -------------------------------------------------------------------------------
  refreshStale();
  buildShell();
  loadState();
  initArtifact();
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  window.addEventListener('beforeunload', function () { if (saveTimer) save(); });
}

// ---------------------------------------------------------------------------------------------
// Assemblage des deux sorties
// ---------------------------------------------------------------------------------------------

const RENDERER_JS = `(${rendererMain.toString()})();`;

// `<` devient `<` : un diff de HTML ou de JS contient `</script>`, et le parseur HTML
// terminerait le bloc de données au premier.
function embedJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function pageTitle(meta) {
  const t = meta.title.length > 60 ? `${meta.title.slice(0, 57)}…` : meta.title;
  return meta.ticket ? `Relecture ${meta.ticket} — ${t}` : `Relecture — ${t}`;
}

function fragment(title, data) {
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<style>${CSS}</style>`,
    `<script id="scd-data" type="application/json">${embedJson(data)}</script>`,
    '<div id="app"></div>',
    `<script id="scd-renderer">${RENDERER_JS}</script>`,
    '',
  ].join('\n');
}

function fullDocument(title, data) {
  return [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${CSS}</style>`,
    '</head>',
    '<body>',
    `<script id="scd-data" type="application/json">${embedJson(data)}</script>`,
    '<div id="app"></div>',
    `<script id="scd-renderer">${RENDERER_JS}</script>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------

const MAX_NARRATION = 40;

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const manifest = loadManifest(opts.manifest);
  const git = makeGit(opts.repo);
  git(['rev-parse', '--git-dir']); // le dépôt existe, ou code 4

  const baseSha = (git(['rev-parse', opts.base]) || '').trim();
  const headSha = opts.head === 'WORKTREE' ? 'WORKTREE' : (git(['rev-parse', opts.head]) || '').trim();

  const files = collect(git, opts, manifest);
  const policy = applySizePolicy(git, opts, files);

  const warnings = [];
  if (files.length === 0) {
    warnings.push(`aucun fichier dans ${opts.base}..${opts.head} — la page sera vide`);
    process.stderr.write(`${NAME} : avertissement — ${warnings[warnings.length - 1]}\n`);
  }

  // corps : `--pr` l'emporte sur `manifest.body`
  let pr = null;
  if (opts.pr) pr = readPr(opts.pr);
  const body = (pr && pr.body) ? pr.body : (manifest.body || null);
  if (!body) warnings.push('aucun corps de PR (ni --pr exploitable, ni `body` au manifeste)');

  // narration
  const page = manifest.page || null;
  const narrList = (page && Array.isArray(page.files)) ? page.files : [];
  const capped = narrList.slice(0, MAX_NARRATION);
  if (narrList.length > MAX_NARRATION) {
    warnings.push(`page.files plafonné à ${MAX_NARRATION} entrées (${narrList.length} fournies)`);
  }
  const narration = {};
  for (const n of capped) {
    narration[n.path] = {
      kind: n.kind || null, role: n.role || null, summary: n.summary || null,
      scrutinize: Array.isArray(n.scrutinize) ? n.scrutinize : [],
      criteria: Array.isArray(n.criteria) ? n.criteria : [],
    };
  }
  const diffPaths = new Set(files.map((f) => f.path));
  const narrationMissing = files.filter((f) => !narration[f.path]).map((f) => f.path);
  const narrationExtra = Object.keys(narration).filter((p) => !diffPaths.has(p));

  // lien de forge pour les diffs réduits
  const fbase = forgeBase(pr ? pr.url : opts.pr, headSha);
  if (fbase) {
    for (const f of files) {
      if (!f.fullAvailable && f.status !== 'D') f.forgeUrl = fbase + f.path;
    }
  }

  const findings = anchorFindings(manifest.review, files);
  const state = buildState(opts, manifest, files, headSha);

  const data = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    meta: Object.assign({}, manifest.meta, {
      base: manifest.meta.base || (baseSha ? baseSha.slice(0, 8) : opts.base),
    }),
    baseShort: baseSha ? baseSha.slice(0, 8) : opts.base,
    headShort: headSha === 'WORKTREE' ? 'arbre de travail' : headSha.slice(0, 8),
    context: opts.context,
    mermaidUrl: MERMAID_URL,
    pr: pr ? { url: pr.url, title: pr.title } : (opts.pr ? { url: opts.pr, title: null } : null),
    body,
    hasNarration: capped.length > 0,
    narration,
    narrationMissing,
    narrationExtra,
    diagrams: (page && Array.isArray(page.diagrams)) ? page.diagrams : [],
    criteria: Array.isArray(manifest.criteria) ? manifest.criteria : [],
    model: manifest.model || null,
    modelFilesInDiff: Array.isArray(manifest.modelFilesInDiff) ? manifest.modelFilesInDiff : [],
    impact: impactGraph(manifest.model),
    review: manifest.review || null,
    findings,
    files,
    truncated: policy.truncated,
    truncatedLog: policy.log,
    warnings,
    state,
  };

  const title = pageTitle(manifest.meta);
  const outDir = path.dirname(path.resolve(opts.out));
  try { mkdirSync(outDir, { recursive: true }); }
  catch (e) { die(2, `répertoire de sortie impossible (${outDir}) : ${e.message}`); }

  const htmlPath = `${opts.out}.html`;
  const artifactPath = `${opts.out}.artifact.html`;
  const statePath = `${opts.out}.state.json`;
  const doc = fullDocument(title, data);
  const frag = fragment(title, data);
  try {
    writeFileSync(htmlPath, doc, 'utf8');
    writeFileSync(artifactPath, frag, 'utf8');
    writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  } catch (e) {
    die(2, `écriture impossible : ${e.message}`);
  }

  process.stdout.write(`${JSON.stringify({
    html: htmlPath,
    artifactHtml: artifactPath,
    state: statePath,
    title,
    pageId: state.pageId,
    files: files.length,
    dataBytes: policy.bytes,
    htmlBytes: Buffer.byteLength(doc, 'utf8'),
    artifactBytes: Buffer.byteLength(frag, 'utf8'),
    truncated: policy.truncated,
    notesCarried: state.notes.length,
    notesStale: state.notes.filter((n) => n.stale).length,
    warnings,
  }, null, 2)}\n`);
}

main();
