export const meta = {
  name: 'implement-lot',
  description: 'Implémente un lot de review Rn en TDD : rouge → valide → vert → review → triage → apply → record. Un lancement = un lot.',
  whenToUse: "Après une gate analyze au vert de scd-feature-specs, pour implémenter un lot Rn de specs/NNN-feature/tasks.md.",
  phases: [
    { title: 'Branch', detail: 'branch-setup : crée impl/<slug>-<lot> depuis la base à jour — défaut, ou branche du lot dépendant en stacking (arbre propre exigé ; en mode worktree:true → git worktree add dédié, arbre principal libre)' },
    { title: 'Rebase', detail: 'rebaser : (préventif, idempotent) repose la branche sur la base à jour ; no-op sur une branche fraîche' },
    { title: 'Prepare', detail: 'lot-briefer : parse le lot, pull les SHALL, détecte le test runner' },
    { title: 'Red', detail: 'test-writer : écrit les tests, confirme le rouge' },
    { title: 'Validate', detail: 'test-validator : 1 SHALL = 1 test, cas limites, conventions' },
    { title: 'Green', detail: 'implementer : implémente jusqu au vert, tests intacts' },
    { title: 'Review', detail: 'code-reviewer : 6 dimensions' },
    { title: 'Triage', detail: 'review-validator : triage sceptique adversarial' },
    { title: 'Apply', detail: 'fix-applier : applique les findings retenus, re-vérifie le vert' },
    { title: 'Record', detail: 'progress-recorder : coche tasks.md, commit sur la branche dédiée' },
    { title: 'PR', detail: 'pr-author : pousse la branche, ouvre la PR ready avec description' },
  ],
}

// ---------------------------------------------------------------------------
// Schémas de handoff (JSON Schema). Chaque étape aval consomme un objet validé.
// ---------------------------------------------------------------------------

const BRANCH = {
  type: 'object',
  required: ['created', 'branch'],
  properties: {
    created: { type: 'boolean', description: 'true si on est sur la branche dédiée (créée ou rejointe / worktree posé)' },
    branch: { type: 'string', description: 'impl/<slug>-<lot>' },
    base: { type: 'string', description: 'Base retenue (ex. main)' },
    baseUpToDate: { type: 'boolean', description: 'true si la base a été rafraîchie depuis le remote (git fetch)' },
    worktree: { type: 'boolean', description: 'true si la branche vit dans un worktree dédié (mode isolé/parallèle)' },
    worktreeDir: { type: 'string', description: 'Chemin ABSOLU du worktree du lot (mode worktree uniquement)' },
    status: { type: 'string', description: 'ready | dirty-tree | error' },
    note: { type: 'string' },
  },
}

const REBASE = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', description: 'up-to-date | rebased | blocked-conflict | blocked-dirty | blocked-push | error' },
    lotBranch: { type: 'string' },
    base: { type: 'string' },
    oldBase: { type: 'string' },
    pushed: { type: 'boolean' },
    note: { type: 'string' },
  },
}

const BRIEF = {
  type: 'object',
  required: ['lot', 'featureDir', 'testCommand', 'shalls', 'files', 'tasks'],
  properties: {
    lot: { type: 'string' },
    featureDir: { type: 'string' },
    testCommand: { type: 'string', description: 'Commande projet pour exécuter les tests du lot' },
    testFramework: { type: 'string' },
    conventions: { type: 'string', description: 'Conventions de test/code détectées (CLAUDE.md, patrons existants)' },
    shalls: {
      type: 'array',
      items: {
        type: 'object',
        required: ['fr', 'text'],
        properties: {
          fr: { type: 'string', description: 'ID FR-xxx / SC-xxx' },
          text: { type: 'string', description: 'Le critère EARS (When… shall…)' },
          kind: { type: 'string', description: 'happy | boundary | error | edge' },
        },
      },
    },
    files: { type: 'array', items: { type: 'string' }, description: 'Fichiers touchés du lot (plan.md)' },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'kind'],
        properties: {
          id: { type: 'string', description: 'Tn' },
          kind: { type: 'string', description: 'test | impl' },
          requirements: { type: 'array', items: { type: 'string' } },
          text: { type: 'string' },
        },
      },
    },
    gherkin: { type: 'array', items: { type: 'string' }, description: 'Chemins des .feature du lot, si présents' },
  },
}

const TESTS = {
  type: 'object',
  required: ['files', 'red'],
  properties: {
    files: { type: 'array', items: { type: 'string' }, description: 'Fichiers de test créés/modifiés' },
    red: { type: 'boolean', description: 'true si les tests échouent pour la bonne raison (pas erreur de compilation triviale)' },
    output: { type: 'string', description: 'Extrait de la sortie prouvant le rouge' },
    mapping: {
      type: 'array',
      description: 'Un test nommé par SHALL',
      items: {
        type: 'object',
        required: ['fr', 'test'],
        properties: { fr: { type: 'string' }, test: { type: 'string' } },
      },
    },
  },
}

const TEST_VERDICT = {
  type: 'object',
  required: ['ok', 'gaps'],
  properties: {
    ok: { type: 'boolean', description: 'true si aucun gap bloquant' },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['kind', 'detail'],
        properties: {
          kind: { type: 'string', description: 'missing-shall | missing-edge | convention | anti-pattern | not-red' },
          detail: { type: 'string' },
          fr: { type: 'string' },
        },
      },
    },
  },
}

const GREEN = {
  type: 'object',
  required: ['passing', 'testsUntouched'],
  properties: {
    passing: { type: 'boolean', description: 'true SEULEMENT si la sortie montre 0 failed' },
    testsUntouched: { type: 'boolean', description: 'true si git diff sur les fichiers de test est vide' },
    output: { type: 'string', description: 'Sortie réelle de la commande de test (preuve)' },
    diffFiles: { type: 'array', items: { type: 'string' }, description: "Fichiers d'implémentation modifiés" },
  },
}

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'dimension', 'severity', 'file', 'text'],
        properties: {
          id: { type: 'string' },
          dimension: { type: 'string', description: 'architecture | proprete | conventions | couverture | securite | error-handling' },
          severity: { type: 'string', description: 'bloquant | suggestion' },
          file: { type: 'string' },
          line: { type: 'integer' },
          text: { type: 'string' },
          detail: { type: 'string' },
          correction_prompt: { type: 'string' },
        },
      },
    },
  },
}

const TRIAGE = {
  type: 'object',
  required: ['apply', 'skipped'],
  properties: {
    apply: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'file', 'correction_prompt'],
        properties: {
          id: { type: 'string' },
          file: { type: 'string' },
          correction_prompt: { type: 'string' },
          confidence: { type: 'number' },
        },
      },
    },
    skipped: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'reason'],
        properties: { id: { type: 'string' }, reason: { type: 'string' } },
      },
    },
  },
}

const RECORD = {
  type: 'object',
  required: ['checked', 'committed', 'branch'],
  properties: {
    checked: { type: 'array', items: { type: 'string' }, description: 'IDs Tn/Rn cochés' },
    committed: { type: 'boolean' },
    commits: { type: 'array', items: { type: 'string' } },
    branch: { type: 'string', description: 'Branche portant les commits du lot' },
    note: { type: 'string' },
  },
}

const PR_RESULT = {
  type: 'object',
  required: ['created'],
  properties: {
    created: { type: 'boolean' },
    platform: { type: 'string', description: 'github | gitlab | none' },
    url: { type: 'string' },
    number: { type: 'string' },
    branch: { type: 'string' },
    base: { type: 'string' },
    state: { type: 'string', description: 'ready | draft' },
    title: { type: 'string' },
    worktreeRemoved: { type: 'boolean', description: 'true si le worktree du lot a été supprimé après création de la PR (mode worktree, succès uniquement)' },
    note: { type: 'string' },
  },
}

// ---------------------------------------------------------------------------
// Orchestration. args = { featureDir: "specs/003-auth", lot: "R2", worktree?: true }.
// Tout accès disque/git se fait DANS les agents (l'orchestrateur n'a pas d'I/O).
//
// Deux modes d'exécution :
//  - séquentiel (worktree absent/false) : comportement 0.4.0 inchangé (git switch -c
//    dans le checkout de session, arbre propre exigé) ;
//  - worktree (worktree:true) : chaque lot vit dans un worktree git dédié (git worktree
//    add), dont le chemin absolu est propagé à chaque agent aval — qui roote alors TOUTES
//    ses opérations dessus (git -C <wt>, chemins absolus, cwd de test = worktree). C'est
//    ce qui rend le parallélisme réel possible : plusieurs lots n'entrent plus en collision
//    sur le HEAD/arbre unique du checkout de session (couche 1 — collision d'exécution).
//    La couche 2 — conflit de contenu (fichiers non disjoints) — se règle par
//    sérialisation/empilement en amont (voir implement-parallel.js), pas ici.
// ---------------------------------------------------------------------------

const featureDir = args && args.featureDir
const lot = args && args.lot
if (!featureDir || !lot) {
  throw new Error('args requis : { featureDir: "specs/NNN-slug", lot: "Rn" }')
}
const base = args && args.base ? args.base : null
const oldBase = args && args.oldBase ? args.oldBase : null
const useWorktree = !!(args && args.worktree)
const prefetched = !!(args && args.prefetched) // le remote a été fetché avant le fan-out (évite les fetch concurrents)

phase('Branch')
const branchInfo = await agent(
  useWorktree
    ? (
      `Mode WORKTREE (exécution isolée pour le parallélisme). Crée la branche dédiée du lot ${lot} de ${featureDir} ` +
      `DANS UN WORKTREE git dédié, à partir de ` + (base ? `la base \`${base}\`` : `la branche par défaut du repo`) + ` mise à jour. ` +
      `N'EXIGE PAS un arbre principal propre (git worktree add n'y touche pas — c'est le bénéfice du mode). ` +
      `Purge d'abord les worktrees fantômes : \`git worktree prune\`. ` +
      `Ancre le worktree HORS de l'arbre suivi : \`WT_ROOT="$(git rev-parse --path-format=absolute --git-common-dir)/scd-worktrees"\`, ` +
      `\`wtdir="$WT_ROOT/<slug>-${lot}"\` (slug = suffixe de ${featureDir} après NNN-). ` +
      (prefetched
        ? `Le remote vient d'être fetché AVANT le fan-out : réutilise \`origin/<base>\` SANS re-fetch (évite les fetch concurrents) ; ne fetch que si \`origin/<base>\` est absent. `
        : `Fetch la base : \`git fetch origin <base>\`. `) +
      `Crée branche + worktree en un geste : \`git worktree add -b impl/<slug>-${lot} "$wtdir" origin/<base>\` ` +
      `(fallback base locale \`<base>\` si \`origin/<base>\` absent). Si le worktree/la branche existe déjà (relance), ` +
      `réutilise proprement selon ton protocole. Retourne \`worktree:true\` et \`worktreeDir\` (chemin ABSOLU, en /). ` +
      `Aucun commit, aucun push, aucune écriture de code.`
    )
    : (
      `Crée TOUJOURS la branche dédiée du lot ${lot} de ${featureDir}, À PARTIR de ` +
      (base ? `la base \`${base}\`` : `la branche par défaut du repo`) +
      ` mise À JOUR (git fetch), AVANT tout autre travail. ` +
      `Exige un arbre de travail propre : si \`git status --porcelain\` n'est pas vide, STOP et retourne status='dirty-tree' sans rien faire. ` +
      `Sinon crée \`impl/<slug>-${lot}\` (slug = suffixe de ${featureDir} après NNN-) depuis la base à jour (origin/<base>), ` +
      `ou rejoins-la si elle existe déjà. Aucun commit, aucun push, aucune écriture de code.`
    ),
  { agentType: 'scd-implement:branch-setup', schema: BRANCH, model: 'haiku' },
)
if (!branchInfo || branchInfo.status === 'dirty-tree') {
  return { lot, featureDir, status: 'blocked-dirty-tree', branchInfo }
}
if (!branchInfo.created) {
  return { lot, featureDir, status: 'blocked-branch', branchInfo, worktreeDir: branchInfo && branchInfo.worktreeDir }
}

// Racine d'isolation : en mode worktree, chaque agent aval doit rooter git ET fichiers ET
// commande de test sur ce chemin. `gitPrefix` et `iso` sont injectés dans les prompts aval.
const wtDir = useWorktree ? branchInfo.worktreeDir : null
if (useWorktree && !wtDir) {
  return { lot, featureDir, status: 'blocked-branch', branchInfo, note: 'mode worktree demandé mais worktreeDir absent du retour branch-setup' }
}
const gitPrefix = wtDir ? `git -C "${wtDir}"` : `git`
const iso = wtDir
  ? `\n\n⚠ ISOLATION WORKTREE — opère EXCLUSIVEMENT dans le worktree du lot : \`${wtDir}\`. ` +
    `TOUT git via \`git -C "${wtDir}" …\` (jamais un git implicite sur le cwd de session, partagé avec d'autres lots). ` +
    `Chemins de fichiers (lecture/écriture) : ABSOLUS, sous \`${wtDir}\`. ` +
    `Commande de test : exécutée avec le worktree comme cwd (\`cd "${wtDir}" && <cmd>\`, ou l'option répertoire du gestionnaire de paquets — \`pnpm -C "${wtDir}" …\`, \`npm --prefix "${wtDir}" …\`, \`cargo …\` avec \`--manifest-path\`). ` +
    `Ne touche JAMAIS au checkout principal ni au worktree d'un autre lot.`
  : ``
log(`Branche ${branchInfo.branch} depuis ${branchInfo.base || 'défaut'}${branchInfo.baseUpToDate === false ? ' (base locale, remote absent)' : ' (à jour)'}${wtDir ? ` · worktree ${wtDir}` : ''}`)

// Préventif : sur une branche fraîche c'est un no-op (idempotent), mais sur une REPRISE
// de run où la base a bougé entre-temps, on repose la branche sur la base à jour AVANT
// d'écrire. `push: auto` = ne pousse que si la branche est déjà publiée (sinon pr-author publiera).
// En mode worktree, la branche est déjà checkoutée dans le worktree → rebaser opère avec git -C
// et NE fait aucun git switch (qui échouerait, la branche étant liée au worktree).
phase('Rebase')
const rebased = await agent(
  `Rebase la branche du lot sur sa base à jour, de façon idempotente, AVANT toute écriture de code.\n` +
  `lotBranch: \`${branchInfo.branch}\`\nbase: \`${base || branchInfo.base}\`\n` +
  (oldBase ? `oldBase: \`${oldBase}\` (mode --onto : transplante les seuls commits du lot)\n` : ``) +
  (wtDir ? `worktreeDir: \`${wtDir}\` (opère avec \`git -C "${wtDir}"\` ; la branche y est DÉJÀ checkoutée — ne fais AUCUN git switch/checkout de branche)\n` : ``) +
  `push: auto. Conflit → git rebase --abort et statut blocked-conflict (ne résous jamais un conflit).`,
  { agentType: 'scd-implement:rebaser', schema: REBASE, model: 'haiku' },
)
if (rebased && (rebased.status === 'blocked-conflict' || rebased.status === 'blocked-dirty' || rebased.status === 'blocked-push')) {
  return { lot, featureDir, status: 'blocked-rebase', rebase: rebased, branchInfo, worktreeDir: wtDir }
}
if (rebased && rebased.status === 'rebased') {
  log(`Branche re-rebasée sur ${rebased.base}${rebased.pushed ? ' (poussée --force-with-lease)' : ''}`)
}

phase('Prepare')
const brief = await agent(
  `Prépare l'implémentation du lot ${lot} de ${featureDir}.\n` +
  `Lis ${featureDir}/tasks.md (isole le lot ${lot} : ses tâches Tn, backrefs _Requirements:_, ligne Fichiers:), ` +
  `${featureDir}/spec.md (extrais chaque SHALL EARS des FR/SC livrés par le lot), ${featureDir}/plan.md ` +
  `(contrats + étape de vérif), et tout ${featureDir}/acceptance/*.feature du lot. ` +
  `Détecte la commande de test et les conventions du projet. Retourne le brief structuré.` + iso,
  { agentType: 'scd-implement:lot-briefer', schema: BRIEF, model: 'sonnet' },
)
if (!brief) throw new Error('lot-briefer : brief indisponible (agent skipped/failed)')
log(`Lot ${lot} : ${brief.shalls.length} SHALL · ${brief.files.length} fichiers · test: ${brief.testCommand}`)

phase('Red')
let tests = await agent(
  `Écris les tests du lot ${lot} — un test nommé par SHALL — puis exécute \`${brief.testCommand}\` ` +
  `et CONFIRME le rouge (échec pour la bonne raison, pas une erreur de compilation triviale).\n` +
  `Brief:\n${JSON.stringify(brief)}` + iso,
  { agentType: 'scd-implement:test-writer', schema: TESTS, model: 'sonnet' },
)
if (!tests) throw new Error('test-writer : aucun test produit')

phase('Validate')
let verdict
let tries = 0
do {
  verdict = await agent(
    `Valide ces tests contre le brief et le rubric (1 SHALL = 1 test nommé ; cas limites If…then…shall… présents ; ` +
    `FIRST/AAA/nommage comportemental ; anti-patterns tautologie/sur-mock/couplage à l'implémentation ; rouge effectif).\n` +
    `Brief:\n${JSON.stringify(brief)}\nTests:\n${JSON.stringify(tests)}` + iso,
    { agentType: 'scd-implement:test-validator', schema: TEST_VERDICT, model: 'opus' },
  )
  if (!verdict || verdict.ok) break
  log(`Tests à corriger (${verdict.gaps.length} gap(s)) — itération ${tries + 1}`)
  tests = await agent(
    `Corrige les tests du lot ${lot} selon ces gaps, ré-exécute \`${brief.testCommand}\`, reconfirme le rouge.\n` +
    `Gaps:\n${JSON.stringify(verdict.gaps)}\nTests actuels:\n${JSON.stringify(tests)}\nBrief:\n${JSON.stringify(brief)}` + iso,
    { agentType: 'scd-implement:test-writer', schema: TESTS, model: 'sonnet' },
  )
  if (!tests) throw new Error('test-writer : correction des tests échouée')
} while (++tries < 2 && budget.remaining() > 40_000)

if (verdict && !verdict.ok) {
  log(`Tests non validés après ${tries} itération(s) — gaps restants remontés, on poursuit vers le vert avec réserve.`)
}

phase('Green')
let green
let gtry = 0
do {
  green = await agent(
    `Implémente le code de production du lot ${lot} jusqu'à ce que \`${brief.testCommand}\` montre 0 failed. ` +
    `INTERDICTION d'éditer les fichiers de test ${JSON.stringify(tests.files)} — à la fin, exécute ` +
    `\`${gitPrefix} diff -- ${tests.files.join(' ')}\` : il DOIT être vide, sinon annule tes changements sur ces fichiers. ` +
    `Montre la sortie réelle de la commande (passing=true uniquement si 0 failed).\n` +
    `Brief:\n${JSON.stringify(brief)}` + iso,
    { agentType: 'scd-implement:implementer', schema: GREEN, model: 'sonnet' },
  )
  if (green && green.passing && green.testsUntouched) break
  if (green) log(`Vert non atteint (passing=${green.passing}, testsUntouched=${green.testsUntouched}) — retry ${gtry + 1}`)
} while (++gtry < 3 && budget.remaining() > 40_000)

if (!green || !green.passing) {
  return { lot, featureDir, status: 'blocked-red', green, tests, verdict, worktreeDir: wtDir }
}
if (!green.testsUntouched) {
  return { lot, featureDir, status: 'blocked-tests-modified', green, tests, worktreeDir: wtDir }
}

phase('Review')
const review = await agent(
  `Review l'implémentation du lot ${lot} (contexte frais, tu n'as pas écrit ce code). ` +
  `Diff sur ${JSON.stringify(green.diffFiles)} (récupère-le via \`${gitPrefix} diff …\`). Six dimensions : architecture, propreté, conventions, ` +
  `couverture, sécurité, gestion d'erreur. Classe bloquant/suggestion, propose un correction_prompt autonome.\n` +
  `Brief:\n${JSON.stringify(brief)}` + iso,
  { agentType: 'scd-implement:code-reviewer', schema: FINDINGS, model: 'opus' },
)
const findings = (review && review.findings ? review.findings : []).filter(Boolean)
log(`Review : ${findings.length} finding(s)`)

let triaged = { apply: [], skipped: [] }
if (findings.length) {
  phase('Triage')
  const t = await agent(
    `Triage sceptique et adversarial de ces findings. Pour chacun : reproduis-le dans le code, ` +
    `garde-le UNIQUEMENT s'il touche la correction ou une exigence (FR/SC du brief) ; rejette style, ` +
    `spéculation, sur-engineering, hors-scope. En cas de doute → skip.\n` +
    `Findings:\n${JSON.stringify(findings)}\nBrief:\n${JSON.stringify(brief)}\nFichiers d'impl:\n${JSON.stringify(green.diffFiles)}` + iso,
    { agentType: 'scd-implement:review-validator', schema: TRIAGE, model: 'opus' },
  )
  if (t) triaged = t
  log(`Triage : ${triaged.apply.length} à appliquer · ${triaged.skipped.length} rejetés`)
}

let finalGreen = green
if (triaged.apply.length) {
  phase('Apply')
  const applied = await agent(
    `Applique EXACTEMENT ces corrections validées (rien d'autre), sans toucher aux fichiers de test ` +
    `${JSON.stringify(tests.files)}, puis ré-exécute \`${brief.testCommand}\` et confirme le vert ` +
    `(\`${gitPrefix} diff -- ${tests.files.join(' ')}\` doit rester vide).\n` +
    `Corrections:\n${JSON.stringify(triaged.apply)}` + iso,
    { agentType: 'scd-implement:fix-applier', schema: GREEN, model: 'sonnet' },
  )
  if (applied && applied.passing && applied.testsUntouched) {
    finalGreen = applied
  } else {
    return { lot, featureDir, status: 'blocked-after-fix', applied, triaged, green, worktreeDir: wtDir }
  }
}

phase('Record')
const record = await agent(
  `Enregistre la progression du lot ${lot} de ${featureDir}. Tu es DÉJÀ sur la branche dédiée ` +
  `\`${branchInfo.branch}\` (créée en phase Branch` + (wtDir ? `, checkoutée dans le worktree` : ``) + `) — n'en crée aucune autre, ne change pas de branche. ` +
  `Coche les cases des tâches Tn implémentées et le lot dans ` + (wtDir ? `\`${wtDir}/${featureDir}/tasks.md\`` : `${featureDir}/tasks.md`) + ` ([ ] → [x]), ` +
  `sans modifier autre chose, crée les commits (un par tâche observable si possible), et retourne la branche courante ` +
  `(\`${gitPrefix} rev-parse --abbrev-ref HEAD\`).\n` +
  `Tâches du lot:\n${JSON.stringify(brief.tasks)}` + iso,
  { agentType: 'scd-implement:progress-recorder', schema: RECORD, model: 'haiku' },
)

// Filet déterministe : la branche portant les commits DOIT être celle posée par branch-setup.
// Si progress-recorder a dérivé (switch/branche involontaire), on refuse d'ouvrir une PR sur
// la mauvaise tête — échec bruyant plutôt que PR silencieusement cassée.
if (record && record.branch && record.branch !== branchInfo.branch) {
  return {
    lot,
    featureDir,
    status: 'blocked-branch-drift',
    expectedBranch: branchInfo.branch,
    recordedBranch: record.branch,
    note: `progress-recorder a commité sur ${record.branch} au lieu de ${branchInfo.branch} — PR non ouverte.`,
    record,
    worktreeDir: wtDir,
  }
}

phase('PR')
const pr = await agent(
  `Publie une PR "ready for review" pour le lot ${lot} de ${featureDir}. Détecte la plateforme (gh/glab), ` +
  `pousse la branche \`${(record && record.branch) || branchInfo.branch}\` (${gitPrefix} push -u origin <branch>, jamais --force), et crée la PR vers ` +
  (base ? `la base \`${base}\`` : `la branche de base par défaut du repo`) +
  ` avec un titre et une description structurée de l'implémentation. ` +
  `AVANT de pousser, applique le garde-fou anti-chevauchement : si ta tête descend d'une PR déjà ` +
  `ouverte visant la même base, n'ouvre pas de PR (created:false, note explicite) — n'empile jamais un doublon.` +
  (wtDir
    ? `\n\nMode WORKTREE : la branche du lot est checkoutée dans \`${wtDir}\`. Fais TOUT git local via \`git -C "${wtDir}" …\` ` +
      `(rev-parse HEAD, merge-base, push) ; le head étant poussé sur origin, gh/glab crée la PR par nom de branche depuis le repo principal (même remote). ` +
      `NETTOYAGE — si ET SEULEMENT SI la PR est créée (created:true, donc branche poussée) : supprime le worktree DEPUIS LE REPO PRINCIPAL ` +
      `(hors du worktree) — \`git worktree remove --force "${wtDir}"\` puis \`git worktree prune\` — et retourne worktreeRemoved:true. ` +
      `Si la suppression échoue (fichiers verrouillés sous Windows), tente \`git worktree prune\` et note-le. ` +
      `Si la PR N'est PAS créée (push/CLI absent, garde-fou), CONSERVE le worktree (worktreeRemoved:false) pour inspection humaine.`
    : ``) +
  `\nRésumé:\n${JSON.stringify({
    lot,
    featureDir,
    branch: (record && record.branch) || branchInfo.branch,
    base: base || branchInfo.base,
    worktreeDir: wtDir || undefined,
    shalls: brief.shalls,
    files: finalGreen.diffFiles,
    tests: tests.files,
    mapping: tests.mapping,
    green: finalGreen.output,
    applied: triaged.apply,
    skipped: triaged.skipped,
    commits: record ? record.commits : [],
  })}`,
  { agentType: 'scd-implement:pr-author', schema: PR_RESULT, model: 'sonnet' },
)

// Nettoyage du worktree : en succès (PR créée), pr-author l'a supprimé. Sinon on le CONSERVE
// et on retourne son chemin pour inspection humaine (le travail du lot n'existe que là si le
// push n'a pas pu se faire).
const worktreeKept = wtDir && !(pr && pr.created && pr.worktreeRemoved) ? wtDir : null

return {
  lot,
  featureDir,
  status: 'done',
  passing: finalGreen.passing,
  filesChanged: finalGreen.diffFiles,
  applied: triaged.apply.length,
  skipped: triaged.skipped.length,
  checked: record ? record.checked : [],
  committed: record ? record.committed : false,
  branch: (record && record.branch) || branchInfo.branch,
  base: base || branchInfo.base,
  worktree: useWorktree,
  worktreeDir: worktreeKept, // null si supprimé après succès ; chemin conservé sinon
  pr: pr && pr.created ? { url: pr.url, number: pr.number, state: pr.state } : null,
}
