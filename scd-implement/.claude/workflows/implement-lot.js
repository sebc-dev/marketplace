export const meta = {
  name: 'implement-lot',
  description: 'Implémente un lot de review Rn selon son mode de vérification (TDD par défaut, ou test-after / check / inhérent) : prépare → vérifie (segment variable) → review → triage → apply → record → describe → PR. Un lancement = un lot.',
  whenToUse: "Après une gate analyze au vert de scd-feature-specs, pour implémenter un lot Rn de specs/NNN-feature/tasks.md.",
  phases: [
    { title: 'Branch', detail: 'branch-setup : crée impl/<slug>-<lot> depuis la base à jour — défaut, ou branche du lot dépendant en stacking (arbre propre exigé ; en mode worktree:true → git worktree add dédié, arbre principal libre)' },
    { title: 'Rebase', detail: 'rebaser : (préventif, idempotent) repose la branche sur la base à jour ; no-op sur une branche fraîche' },
    { title: 'Prepare', detail: 'lot-briefer : parse le lot + son mode de vérif, pull les SHALL, détecte le test runner' },
    { title: 'Red', detail: 'test-writer : (modes TDD/test-after) écrit les tests ; TDD confirme le rouge, test-after écrit après l\'impl et confirme le vert' },
    { title: 'Validate', detail: 'test-validator : (modes TDD/test-after) 1 SHALL = 1 test, cas limites, conventions' },
    { title: 'Green', detail: 'implementer : implémente ; en TDD/test-after jusqu\'au vert tests intacts, en check/inhérent selon le critère d\'acceptation' },
    { title: 'Verify', detail: 'verifier : (modes check/inhérent) vérif observable en contexte frais — capture la preuve ou remonte un humanCheckRequired' },
    { title: 'Review', detail: 'code-reviewer : 6 dimensions (tous modes)' },
    { title: 'Triage', detail: 'review-validator : triage sceptique adversarial' },
    { title: 'Apply', detail: 'fix-applier : applique les findings retenus, re-vérifie selon le mode' },
    { title: 'Record', detail: 'progress-recorder : coche tasks.md, commit sur la branche dédiée' },
    { title: 'Describe', detail: 'pr-describer : compose la description de review (fonctionnel + code) depuis le contrat, le triage et les stats de diff réelles' },
    { title: 'PR', detail: 'pr-author : pousse la branche, ouvre la PR ready en publiant la description' },
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
  required: ['lot', 'featureDir', 'verifMode', 'testCommand', 'shalls', 'files', 'tasks'],
  properties: {
    lot: { type: 'string' },
    featureDir: { type: 'string' },
    verifMode: { type: 'string', description: 'Mode de vérif du lot : TDD (défaut) | test-after | check | inhérent' },
    verifJustification: { type: 'string', description: 'Justification d\'une ligne si mode ≠ TDD ; pour check/inhérent, décrit la preuve observable (commande/observation)' },
    testCommand: { type: 'string', description: 'Commande projet pour exécuter les tests (modes TDD/test-after) ou la vérif observable (check/inhérent), si applicable' },
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
    // Contexte de REVIEW (optionnel, rétro-compatible) : ce qu'un humain doit savoir pour juger
    // le lot, extrait du contrat par le seul agent qui lit déjà spec/plan/tasks. Consommé par
    // pr-describer ; son absence ne casse aucun agent existant.
    context: {
      type: 'object',
      description: 'Matériau de la description de PR — le « pourquoi » fonctionnel et les frontières du lot',
      properties: {
        capability: { type: 'string', description: 'Titre du lot : la capability en une phrase' },
        lotIndex: { type: 'integer', description: 'Rang du lot dans tasks.md (1-based)' },
        lotCount: { type: 'integer', description: 'Nombre total de lots de la feature' },
        dependsOn: { type: 'array', items: { type: 'string' }, description: 'Lots dont celui-ci dépend (dépend de : Rn)' },
        budgetEstimate: { type: 'integer', description: 'Budget estimé du lot en lignes (_~N lignes est._)' },
        why: { type: 'string', description: 'La valeur côté utilisateur : Résumé / user story de spec.md, en 2-4 phrases' },
        prdRefs: { type: 'array', items: { type: 'string' }, description: 'FR/SC du PRD dont descendent les FR du lot' },
        approach: { type: 'string', description: 'plan.md ## Approche, en 1-2 phrases' },
        adrs: { type: 'array', items: { type: 'string' }, description: 'ADR contraignants cités par le plan' },
        contracts: { type: 'string', description: 'Contrats d\'interface du lot (signatures, endpoints, codes d\'erreur)' },
        outOfScope: { type: 'array', items: { type: 'string' }, description: 'spec.md ## NON inclus — ce que le reviewer ne doit PAS réclamer' },
        nextLots: {
          type: 'array',
          description: 'Lots suivants et ce qu\'ils livreront (le reste du hors-périmètre)',
          items: { type: 'object', properties: { lot: { type: 'string' }, title: { type: 'string' } } },
        },
      },
    },
  },
}

const TESTS = {
  type: 'object',
  required: ['files', 'red'],
  properties: {
    files: { type: 'array', items: { type: 'string' }, description: 'Fichiers de test créés/modifiés' },
    red: { type: 'boolean', description: 'Mode TDD : true si les tests échouent pour la bonne raison (pas erreur triviale). Mode test-after : false (les tests visent le vert, cf. green)' },
    green: { type: 'boolean', description: 'Mode test-after uniquement : true si les tests écrits après l\'impl passent au vert (0 failed)' },
    output: { type: 'string', description: 'Extrait de la sortie prouvant l\'état attendu (rouge en TDD, vert en test-after)' },
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

const VERIFY = {
  type: 'object',
  required: ['verified', 'mode'],
  properties: {
    verified: { type: 'boolean', description: 'true si une preuve observable a été obtenue OU s\'il ne reste qu\'une vérif humaine documentée (humanCheckRequired non vide)' },
    mode: { type: 'string', description: 'check | inhérent' },
    method: { type: 'string', description: 'Commande/observation utilisée pour prouver (ré-exécutable par fix-applier après un correctif)' },
    observableProof: { type: 'string', description: 'Sortie/observation capturée qui prouve le critère (l\'équivalent du 0 failed pour un test)' },
    humanCheckRequired: {
      type: 'array',
      items: { type: 'string' },
      description: 'Items qu\'un agent ne peut pas constater (mise en page visuelle, effet externe) — remontés en checklist dans la PR pour le reviewer humain',
    },
    note: { type: 'string' },
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

const PR_BODY = {
  type: 'object',
  required: ['title', 'body'],
  properties: {
    title: { type: 'string', description: 'Titre de la PR : feat(<slug>): <lot> — <capability>' },
    body: { type: 'string', description: 'Corps Markdown complet, SANS le bloc d\'avertissement « PR EMPILÉE » (posé par pr-author)' },
    summary: { type: 'string', description: 'Une phrase : la valeur du lot (pour les logs)' },
    diffStats: {
      type: 'object',
      description: 'Mesures git diff --numstat sur merge-base(base, HEAD)..HEAD',
      properties: {
        files: { type: 'integer' },
        insertions: { type: 'integer' },
        deletions: { type: 'integer' },
      },
    },
    oversized: { type: 'boolean', description: 'true si le diff dépasse le seuil de review en une passe (~400 lignes, ou 2× le budget estimé du lot)' },
    note: { type: 'string', description: 'Mesure impossible, contexte manquant' },
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
    stacked: { type: 'boolean', description: 'true si base ≠ branche par défaut (PR empilée → ouverte en draft, labels stacked/needs-sync, bloc d\'avertissement)' },
    state: { type: 'string', description: 'draft (PR empilée, anti-orphelinage) | ready (PR non empilée)' },
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
  `Détecte le mode de vérification (_vérif :_), la commande de test et les conventions du projet. ` +
  `Remplis aussi \`context\` (le matériau de la future description de PR : capability, rang du lot, dépendances, budget estimé, ` +
  `valeur côté utilisateur, backref PRD, approche du plan, ADR contraignants, contrats, scope EXCLU, lots suivants) — ` +
  `tu es le seul agent qui lit les trois documents, l'extraction est quasi gratuite ici. Retourne le brief structuré.` + iso,
  { agentType: 'scd-implement:lot-briefer', schema: BRIEF, model: 'sonnet' },
)
if (!brief) throw new Error('lot-briefer : brief indisponible (agent skipped/failed)')
const mode = brief.verifMode || 'TDD'
log(`Lot ${lot} : ${brief.shalls.length} SHALL · ${brief.files.length} fichiers · mode ${mode}${brief.testCommand ? ` · test: ${brief.testCommand}` : ''}`)
if (mode !== 'TDD') log(`Mode ≠ TDD — justification du contrat : ${brief.verifJustification || '(non fournie)'}`)

// -------------------------------------------------------------------------
// Segment de vérification — VARIABLE selon le mode du lot (brief.verifMode).
// Familles :
//   TDD (défaut)   : Red(test-writer, rouge) → Validate → Green(implementer, tests intacts). Preuve = 0 failed.
//   test-after     : Green(impl d'abord) → Tests(test-writer, vert) → Validate → Green(gate). Preuve = 0 failed.
//   check|inhérent : Green(impl) → Verify(verifier, contexte frais). Preuve = observableProof / humanCheckRequired.
// À la sortie de ce segment : `green` est set (impl prouvée), `tests` = {files,mapping} (vide en check/inhérent),
// `verify` = VERIFY (check/inhérent) ou null. Le reste du workflow (Review→PR) est invariant.
// -------------------------------------------------------------------------
const usesTests = (mode === 'TDD' || mode === 'test-after')
let tests = { files: [], mapping: [] }
let green = null
let verify = null

if (mode === 'test-after') {
  // Impl d'abord : les tests n'existent pas encore. Best effort — prouve que le code s'intègre.
  phase('Green')
  green = await agent(
    `Mode TEST-AFTER. Implémente le code de production du lot ${lot} d'après ses tâches Tn et les contrats du plan — ` +
    `AUCUN test n'existe encore, n'en écris pas. Prouve que le code s'intègre (build/typecheck/lint/smoke selon ce qui existe ; ` +
    `passing=true si aucune erreur d'intégration). Reste dans les fichiers du lot.\n` +
    `Brief:\n${JSON.stringify(brief)}` + iso,
    { agentType: 'scd-implement:implementer', schema: GREEN, model: 'sonnet' },
  )
  if (!green || !green.passing) {
    return { lot, featureDir, status: 'blocked-impl', mode, green, worktreeDir: wtDir }
  }
}

if (usesTests) {
  const expectRed = (mode === 'TDD')
  phase('Red')
  tests = await agent(
    (expectRed
      ? `Mode TDD. Écris les tests du lot ${lot} — un test nommé par SHALL — puis exécute \`${brief.testCommand}\` ` +
        `et CONFIRME le ROUGE (échec pour la bonne raison, pas une erreur de compilation triviale). red=true.`
      : `Mode TEST-AFTER. L'impl existe déjà. Écris les tests du lot ${lot} — un test nommé par SHALL — contre l'impl EXISTANTE, ` +
        `puis exécute \`${brief.testCommand}\` et CONFIRME le VERT (0 failed) : red=false, green=true. ` +
        `Si un test échoue légitimement, c'est un écart de l'impl à combler ensuite — reporte-le dans output (green=false).`) +
    `\nBrief:\n${JSON.stringify(brief)}` + iso,
    { agentType: 'scd-implement:test-writer', schema: TESTS, model: 'sonnet' },
  )
  if (!tests) throw new Error('test-writer : aucun test produit')

  phase('Validate')
  let verdict
  let tries = 0
  do {
    verdict = await agent(
      `Valide ces tests contre le brief et le rubric (1 SHALL = 1 test nommé ; cas limites If…then…shall… présents ; ` +
      `FIRST/AAA/nommage comportemental ; anti-patterns tautologie/sur-mock/couplage à l'implémentation ; ` +
      `état d'exécution attendu selon le mode : ${expectRed ? 'ROUGE (rien d\'implémenté encore)' : 'VERT (tests écrits après l\'impl)'}).\n` +
      `Brief:\n${JSON.stringify(brief)}\nTests:\n${JSON.stringify(tests)}` + iso,
      { agentType: 'scd-implement:test-validator', schema: TEST_VERDICT, model: 'opus' },
    )
    if (!verdict || verdict.ok) break
    log(`Tests à corriger (${verdict.gaps.length} gap(s)) — itération ${tries + 1}`)
    tests = await agent(
      `Corrige les tests du lot ${lot} selon ces gaps, ré-exécute \`${brief.testCommand}\`, ` +
      `reconfirme l'état attendu (${expectRed ? 'rouge' : 'vert'}).\n` +
      `Gaps:\n${JSON.stringify(verdict.gaps)}\nTests actuels:\n${JSON.stringify(tests)}\nBrief:\n${JSON.stringify(brief)}` + iso,
      { agentType: 'scd-implement:test-writer', schema: TESTS, model: 'sonnet' },
    )
    if (!tests) throw new Error('test-writer : correction des tests échouée')
  } while (++tries < 2 && budget.remaining() > 40_000)

  if (verdict && !verdict.ok) {
    log(`Tests non validés après ${tries} itération(s) — gaps restants remontés, on poursuit vers le vert avec réserve.`)
  }

  // Porte verte : TDD implémente jusqu'au vert ; test-after ferme les écarts éventuels révélés par les tests.
  // Dans les deux cas, à l'arrivée : 0 failed ET tests intacts.
  phase('Green')
  let gtry = 0
  do {
    green = await agent(
      `Implémente/complète le code de production du lot ${lot} jusqu'à ce que \`${brief.testCommand}\` montre 0 failed. ` +
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
    return { lot, featureDir, status: 'blocked-red', mode, green, tests, worktreeDir: wtDir }
  }
  if (!green.testsUntouched) {
    return { lot, featureDir, status: 'blocked-tests-modified', mode, green, tests, worktreeDir: wtDir }
  }
} else {
  // Modes check / inhérent : pas de test automatisé. Impl d'abord, puis vérif observable en CONTEXTE FRAIS
  // (producteur ≠ vérificateur : le verifier n'a pas écrit ce code).
  phase('Green')
  green = await agent(
    `Mode ${mode.toUpperCase()} (pas de test automatisé). Implémente le lot ${lot} d'après ses tâches Tn et les contrats du plan, ` +
    `de façon à satisfaire le critère d'acceptation observable du brief ` +
    (mode === 'inhérent'
      ? `(le critère d'acceptation de la tâche d'impl EST la preuve — ex. le pipeline CI passe au vert, \`terraform apply\` converge). `
      : `(une vérification observable dédiée constatera le résultat — ex. revue visuelle, constat d'un one-shot). `) +
    `Prouve que le code s'intègre (build/typecheck/lint/run selon ce qui existe) ; passing=true si aucune erreur d'intégration. ` +
    `Reste dans les fichiers du lot. Aucun fichier de test à produire.\n` +
    `Brief:\n${JSON.stringify(brief)}` + iso,
    { agentType: 'scd-implement:implementer', schema: GREEN, model: 'sonnet' },
  )
  if (!green || !green.passing) {
    return { lot, featureDir, status: 'blocked-impl', mode, green, worktreeDir: wtDir }
  }

  phase('Verify')
  verify = await agent(
    `Mode ${mode.toUpperCase()}. Vérifie le lot ${lot} en CONTEXTE FRAIS (tu n'as pas écrit ce code). ` +
    `Objectif : obtenir une PREUVE OBSERVABLE que chaque SHALL/critère du brief est satisfait, SANS test unitaire. ` +
    (mode === 'inhérent'
      ? `Le critère d'acceptation de l'impl EST la preuve : ré-exécute-le (build/lint CI en local, \`terraform plan\`/\`apply\`, le script one-shot) et capture sa sortie dans observableProof. `
      : `Exécute la vérification observable décrite (lancer le service et constater, requêter l'état après une migration one-shot…) et capture-la dans observableProof. `) +
    `Ce que tu ne PEUX PAS constater par exécution (mise en page visuelle, effet externe) → liste-le dans humanCheckRequired (ne prétends JAMAIS l'avoir vérifié). ` +
    `verified=true si tu as une preuve observable OU s'il ne reste que des humanCheckRequired documentés. method = la commande/observation utilisée (ré-exécutable après un correctif).\n` +
    `Preuve attendue (du contrat) : ${brief.verifJustification || '(voir le critère d\'acceptation des tâches du lot)'}\n` +
    `Fichiers d'impl : ${JSON.stringify(green.diffFiles)}\nBrief:\n${JSON.stringify(brief)}` + iso,
    { agentType: 'scd-implement:verifier', schema: VERIFY, model: 'opus' },
  )
  if (!verify || !verify.verified) {
    return { lot, featureDir, status: 'blocked-verify', mode, verify, green, worktreeDir: wtDir }
  }
  const hc = (verify.humanCheckRequired || []).filter(Boolean)
  log(`Vérif ${mode} : ${verify.observableProof ? 'preuve observable capturée' : 'aucune preuve auto'}${hc.length ? ` · ${hc.length} point(s) à vérifier par un humain` : ''}`)
}

phase('Review')
const review = await agent(
  `Review l'implémentation du lot ${lot} (contexte frais, tu n'as pas écrit ce code). ` +
  `Diff sur ${JSON.stringify(green.diffFiles)} (récupère-le via \`${gitPrefix} diff …\`). Six dimensions : architecture, propreté, conventions, ` +
  `couverture, sécurité, gestion d'erreur. Mode de vérif du lot : ${mode}` +
  (usesTests ? `` : ` — PAS de test automatisé attendu (c'est le contrat) : ne remonte jamais « absence de test » sur ce lot, juge la couverture par la vérif observable.`) +
  `. Classe bloquant/suggestion, propose un correction_prompt autonome.\n` +
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
  const applied = usesTests
    ? await agent(
        `Applique EXACTEMENT ces corrections validées (rien d'autre), sans toucher aux fichiers de test ` +
        `${JSON.stringify(tests.files)}, puis ré-exécute \`${brief.testCommand}\` et confirme le vert ` +
        `(\`${gitPrefix} diff -- ${tests.files.join(' ')}\` doit rester vide).\n` +
        `Corrections:\n${JSON.stringify(triaged.apply)}` + iso,
        { agentType: 'scd-implement:fix-applier', schema: GREEN, model: 'sonnet' },
      )
    : await agent(
        // check/inhérent : pas de test à re-jouer ; re-prouve la vérif observable après le correctif.
        `Mode ${mode.toUpperCase()} : applique EXACTEMENT ces corrections validées (rien d'autre) au lot ${lot}, ` +
        `puis PROUVE que la vérif observable tient toujours en ré-exécutant \`${verify.method || 'la vérification observable du lot (voir brief)'}\` ` +
        `et capture sa sortie. passing=true si l'intégration ET la preuve tiennent.\n` +
        `Corrections:\n${JSON.stringify(triaged.apply)}\nMéthode de vérif:\n${JSON.stringify(verify.method || '')}` + iso,
        { agentType: 'scd-implement:fix-applier', schema: GREEN, model: 'sonnet' },
      )
  if (applied && applied.passing && (!usesTests || applied.testsUntouched)) {
    finalGreen = applied
  } else {
    return { lot, featureDir, status: 'blocked-after-fix', mode, applied, triaged, green, verify, worktreeDir: wtDir }
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

// La description est un ARTEFACT DE REVIEW : elle doit permettre de juger le fonctionnel ET le code
// sans rouvrir les specs. Elle est composée par un agent dédié (contexte frais, opus), pas par le
// publieur — pr-author reste mécanique. Non bloquant : si le describer est sauté (budget) ou échoue,
// pr-author compose son corps de repli et la PR s'ouvre quand même.
phase('Describe')
const canDescribe = !budget.total || budget.remaining() > 40_000
const desc = canDescribe
  ? await agent(
      `Compose la description de la PR du lot ${lot} de ${featureDir}, pour un REVIEWER HUMAIN : ` +
      `le fonctionnel (capability, valeur, backref PRD, hors-périmètre) ET le code (stats de diff réelles, ordre de lecture, ` +
      `points à scruter, findings appliqués ET rejetés avec leur motif, preuve d'exécution). ` +
      `Mesure le diff toi-même : \`${gitPrefix} merge-base ${base || branchInfo.base} HEAD\` (préfère \`origin/${base || branchInfo.base}\` s'il existe) ` +
      `puis \`${gitPrefix} diff --numstat <mb> HEAD\` et \`${gitPrefix} log --oneline --no-decorate <mb>..HEAD\` — aucun chiffre estimé. ` +
      `Corps en couches : lisible en 30 s, blocs volumineux dans des <details>. ` +
      `N'écris PAS le bloc « PR EMPILÉE » (c'est pr-author). Lecture seule : aucun push, aucune PR, aucune écriture.\n` +
      `Résumé:\n${JSON.stringify({
        lot,
        featureDir,
        branch: (record && record.branch) || branchInfo.branch,
        base: base || branchInfo.base,
        worktreeDir: wtDir || undefined,
        context: brief.context || undefined,
        verifMode: mode,
        verifJustification: brief.verifJustification || undefined,
        shalls: brief.shalls,
        mapping: tests.mapping,
        tests: tests.files,
        proof: usesTests ? finalGreen.output : (verify && verify.observableProof),
        verifyMethod: verify ? verify.method : brief.testCommand,
        humanCheckRequired: verify ? (verify.humanCheckRequired || []) : [],
        testsUntouched: finalGreen.testsUntouched,
        testCommand: brief.testCommand,
        testFramework: brief.testFramework,
        conventions: brief.conventions,
        gherkin: brief.gherkin,
        plannedFiles: brief.files,
        files: finalGreen.diffFiles,
        findings,
        applied: triaged.apply,
        skipped: triaged.skipped,
        tasks: brief.tasks,
        checked: record ? record.checked : [],
        commits: record ? record.commits : [],
      })}` + iso,
      { agentType: 'scd-implement:pr-describer', schema: PR_BODY, model: 'opus' },
    )
  : null
// Un corps vide vaut un corps absent : on bascule alors sur le repli de pr-author plutôt que
// de publier une description creuse. `described` est la seule source de vérité en aval.
const described = desc && typeof desc.body === 'string' && desc.body.trim() ? desc : null
if (!canDescribe) {
  log('Description riche sautée (budget) — pr-author composera le corps de repli.')
} else if (described) {
  const d = (described.diffStats || {})
  log(`Description : ${d.files ?? finalGreen.diffFiles.length} fichier(s)` +
      (d.insertions != null ? `, +${d.insertions}/-${d.deletions ?? 0}` : ``) +
      (described.oversized ? ' ⚠ au-delà du budget de review en une passe' : ''))
} else {
  log('Description non produite (pr-describer indisponible ou corps vide) — corps de repli.')
}

phase('PR')
const pr = await agent(
  `Publie une PR "ready for review" pour le lot ${lot} de ${featureDir}. Détecte la plateforme (gh/glab), ` +
  `pousse la branche \`${(record && record.branch) || branchInfo.branch}\` (${gitPrefix} push -u origin <branch>, jamais --force), et crée la PR vers ` +
  (base ? `la base \`${base}\`` : `la branche de base par défaut du repo`) +
  (described
    ? ` en PUBLIANT TEL QUEL le titre et le corps fournis ci-dessous (\`title\`/\`body\`) : tu es le publieur, pas l'auteur — ` +
      `ne réécris ni ne résume ce corps, la seule addition permise est le bloc « PR EMPILÉE » en tête s'il y a lieu. ` +
      `Écris-le dans un fichier via un heredoc QUOTÉ (\`cat <<'PRBODY' > …\`) et passe-le en --body-file/--description. `
    : ` avec un titre et le corps de REPLI minimal de ton §4 (aucune description ne t'a été fournie — signale-le dans note). `) +
  `AVANT de pousser, applique le garde-fou anti-chevauchement : si ta tête descend d'une PR déjà ` +
  `ouverte visant la même base, n'ouvre pas de PR (created:false, note explicite) — n'empile jamais un doublon. ` +
  `ANTI-ORPHELINAGE : si la base (\`${base || branchInfo.base}\`) ≠ la branche par défaut du repo, cette PR est EMPILÉE — ` +
  `ouvre-la en DRAFT, pose les labels \`stacked\`+\`needs-sync\` (best-effort), et préfixe la description du bloc d'avertissement « ne pas merger directement » ` +
  `(retourne stacked:true, state:draft). Sinon (base = défaut) : PR ready (stacked:false, state:ready).` +
  (wtDir
    ? `\n\nMode WORKTREE : la branche du lot est checkoutée dans \`${wtDir}\`. Fais TOUT git local via \`git -C "${wtDir}" …\` ` +
      `(rev-parse HEAD, merge-base, push) ; le head étant poussé sur origin, gh/glab crée la PR par nom de branche depuis le repo principal (même remote). ` +
      `NETTOYAGE — si ET SEULEMENT SI la PR est créée (created:true, donc branche poussée) : supprime le worktree DEPUIS LE REPO PRINCIPAL ` +
      `(hors du worktree) — \`git worktree remove --force "${wtDir}"\` puis \`git worktree prune\` — et retourne worktreeRemoved:true. ` +
      `Si la suppression échoue (fichiers verrouillés sous Windows), tente \`git worktree prune\` et note-le. ` +
      `Si la PR N'est PAS créée (push/CLI absent, garde-fou), CONSERVE le worktree (worktreeRemoved:false) pour inspection humaine.`
    : ``) +
  `\nRésumé:\n${JSON.stringify({
    // À publier tel quel (absents si le describer a été sauté → corps de repli).
    title: described ? described.title : undefined,
    body: described ? described.body : undefined,
    // Mécanique de publication.
    lot,
    featureDir,
    branch: (record && record.branch) || branchInfo.branch,
    base: base || branchInfo.base,
    worktreeDir: wtDir || undefined,
    // Matériau du corps de REPLI uniquement (ignoré si `body` est fourni).
    verifMode: mode,
    verifJustification: brief.verifJustification || undefined,
    capability: (brief.context && brief.context.capability) || undefined,
    shalls: described ? undefined : brief.shalls,
    files: described ? undefined : finalGreen.diffFiles,
    tests: described ? undefined : tests.files,
    mapping: described ? undefined : tests.mapping,
    // Preuve : sortie 0 failed (modes-test) OU preuve observable du verifier (check/inhérent).
    proof: described ? undefined : (usesTests ? finalGreen.output : (verify && verify.observableProof)),
    testCommand: described ? undefined : brief.testCommand,
    verifyMethod: described ? undefined : (verify ? verify.method : undefined),
    humanCheckRequired: described ? undefined : (verify ? (verify.humanCheckRequired || []) : []),
    appliedCount: triaged.apply.length,
    skippedCount: triaged.skipped.length,
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
  mode,
  passing: finalGreen.passing,
  filesChanged: finalGreen.diffFiles,
  applied: triaged.apply.length,
  skipped: triaged.skipped.length,
  diffStats: described ? described.diffStats : null,
  oversized: described ? !!described.oversized : false,
  humanCheckRequired: verify ? (verify.humanCheckRequired || []) : [],
  checked: record ? record.checked : [],
  committed: record ? record.committed : false,
  branch: (record && record.branch) || branchInfo.branch,
  base: base || branchInfo.base,
  worktree: useWorktree,
  worktreeDir: worktreeKept, // null si supprimé après succès ; chemin conservé sinon
  pr: pr && pr.created ? { url: pr.url, number: pr.number, state: pr.state, stacked: pr.stacked, base: pr.base || base || branchInfo.base } : null,
}
