export const meta = {
  name: 'implement-ticket',
  description: 'Implémente un ticket NN selon son mode de vérification (test par défaut, sinon observé) : prépare → vérifie (segment variable) → review → triage → apply → record → describe → PR. Un lancement = un ticket.',
  whenToUse: "Pour implémenter un ticket NN de specs/NNN-slug/, une fois ses bloqueurs faits et l'arbre propre.",
  phases: [
    { title: 'Branch', detail: 'branch-setup : crée impl/<slug>-<ticket> depuis la base à jour — défaut, ou branche du ticket dépendant en stacking (arbre propre exigé ; en mode worktree:true → git worktree add dédié, arbre principal libre)' },
    { title: 'Rebase', detail: 'rebaser : (préventif, idempotent) repose la branche sur la base à jour ; no-op sur une branche fraîche' },
    { title: 'Prepare', detail: 'ticket-briefer : parse le ticket + son mode de vérif, pull les critère, détecte le test runner' },
    { title: 'Red', detail: 'test-writer : (mode test) écrit un test nommé par critère et confirme le ROUGE' },
    { title: 'Validate', detail: 'test-validator : (mode test) 1 critère = 1 test, cas limites, conventions' },
    { title: 'Green', detail: 'implementer : implémente ; en mode test jusqu\'au vert tests intacts, en observé jusqu\'à la preuve' },
    { title: 'Verify', detail: 'verifier : (mode observé) vérif observable en contexte frais — capture la preuve ou remonte un humanCheckRequired' },
    { title: 'Context', detail: 'review-context : dossier de contexte (invariants ADR, décisions/hors-périmètre de spec) résolu une fois pour les six reviewers (contexte frais)' },
    { title: 'Review', detail: 'six reviewers en parallèle, un par dimension : architecture, propreté, conventions, couverture, sécurité, error-handling (contexte frais, tous modes)' },
    { title: 'Triage', detail: 'review-validator : triage sceptique adversarial' },
    { title: 'Apply', detail: 'fix-applier : applique les findings retenus, re-vérifie selon le mode' },
    { title: 'Record', detail: 'progress-recorder : coche les critères du ticket, commit sur la branche dédiée' },
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
    branch: { type: 'string', description: 'impl/<slug>-<ticket>' },
    base: { type: 'string', description: 'Base retenue (ex. main)' },
    baseUpToDate: { type: 'boolean', description: 'true si la base a été rafraîchie depuis le remote (git fetch)' },
    worktree: { type: 'boolean', description: 'true si la branche vit dans un worktree dédié (mode isolé/parallèle)' },
    worktreeDir: { type: 'string', description: 'Chemin ABSOLU du worktree du ticket (mode worktree uniquement)' },
    status: { type: 'string', description: 'ready | dirty-tree | error' },
    note: { type: 'string' },
  },
}

const REBASE = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', description: 'up-to-date | rebased | blocked-conflict | blocked-dirty | blocked-push | error' },
    ticketBranch: { type: 'string' },
    base: { type: 'string' },
    oldBase: { type: 'string' },
    pushed: { type: 'boolean' },
    note: { type: 'string' },
  },
}

const BRIEF = {
  type: 'object',
  required: ['ticket', 'featureDir', 'verifMode', 'testCommand', 'criteres', 'files', 'tasks'],
  properties: {
    ticket: { type: 'string' },
    featureDir: { type: 'string' },
    verifMode: { type: 'string', description: 'Mode de vérif du ticket : test (défaut) | observé' },
    verifJustification: { type: 'string', description: 'En mode observé : le motif, et ce qui constitue la preuve (commande à lancer, observation à faire)' },
    testCommand: { type: 'string', description: 'Commande projet pour exécuter les tests (mode test) ou la vérif observable (mode observé), si applicable' },
    testFramework: { type: 'string' },
    conventions: { type: 'string', description: 'Conventions de test/code détectées (CLAUDE.md, patrons existants)' },
    criteres: {
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
    files: { type: 'array', items: { type: 'string' }, description: 'Fichiers touchés du ticket (ligne **Fichiers :**)' },
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
    gherkin: { type: 'array', items: { type: 'string' }, description: 'Chemins des .feature du ticket, si présents' },
    // Contexte de REVIEW (optionnel, rétro-compatible) : ce qu'un humain doit savoir pour juger
    // le ticket, extrait du contrat par le seul agent qui lit déjà spec/plan/tasks. Consommé par
    // pr-describer ; son absence ne casse aucun agent existant.
    context: {
      type: 'object',
      description: 'Matériau de la description de PR — le « pourquoi » fonctionnel et les frontières du ticket',
      properties: {
        capability: { type: 'string', description: 'Titre du ticket : la capability en une phrase' },
        ticketIndex: { type: 'integer', description: 'Rang du ticket dans la feature (1-based)' },
        ticketCount: { type: 'integer', description: 'Nombre total de tickets de la feature' },
        dependsOn: { type: 'array', items: { type: 'string' }, description: 'Lots dont celui-ci dépend (dépend de : NN)' },
        budgetEstimate: { type: 'integer', description: 'Budget estimé du ticket en lignes (_~N lignes est._)' },
        why: { type: 'string', description: 'La valeur côté utilisateur : Résumé / user story de spec.md, en 2-4 phrases' },
        prdRefs: { type: 'array', items: { type: 'string' }, description: 'FR/SC du PRD dont descendent les FR du ticket' },
        decisions: { type: 'array', items: { type: 'string' }, description: 'SPEC.md ## Décisions d\'implémentation qui contraignent ce ticket' },
        adrs: { type: 'array', items: { type: 'string' }, description: 'ADR contraignants cités par le plan' },
        contracts: { type: 'string', description: 'Contrats d\'interface du ticket (signatures, endpoints, codes d\'erreur)' },
        outOfScope: { type: 'array', items: { type: 'string' }, description: 'spec.md ## NON inclus — ce que le reviewer ne doit PAS réclamer' },
        nextTickets: {
          type: 'array',
          description: 'Lots suivants et ce qu\'ils livreront (le reste du hors-périmètre)',
          items: { type: 'object', properties: { ticket: { type: 'string' }, title: { type: 'string' } } },
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
    red: { type: 'boolean', description: 'true si les tests échouent pour la bonne raison (pas une erreur triviale)' },
    green: { type: 'boolean', description: 'true si les tests passent au vert (0 failed) — renseigné à la porte verte' },
    output: { type: 'string', description: 'Extrait de la sortie réelle prouvant l\'état attendu (le ROUGE)' },
    mapping: {
      type: 'array',
      description: 'Un test nommé par critère',
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
    mode: { type: 'string', description: 'observé' },
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

// Dossier de contexte résolu UNE fois par review-context et servi aux six reviewers.
// Aucune I/O de review dans l'orchestrateur : l'agent lit docs/adr/ et SPEC.md.
const REVIEW_CONTEXT = {
  type: 'object',
  properties: {
    invariants: {
      type: 'array',
      description: 'Table des invariants de docs/adr/ — référent de la dimension architecture ; vide si la table est absente',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ex. I3' },
          rule: { type: 'string' },
          source: { type: 'string', description: 'fichier ADR qui porte l\'invariant' },
        },
      },
    },
    adrs: {
      type: 'array',
      description: 'ADR contraignant ce ticket, résumés (jamais recopiés en entier)',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          decision: { type: 'string' },
          consequences: { type: 'string' },
        },
      },
    },
    decisions: { type: 'array', items: { type: 'string' }, description: 'SPEC.md ## Décisions qui contraignent le diff' },
    outOfScope: { type: 'array', items: { type: 'string' }, description: 'SPEC.md ## Hors-périmètre pertinent — ce qu\'aucun reviewer ne doit réclamer' },
    contracts: { type: 'string', description: 'Contrats d\'interface du ticket (signatures, endpoints, codes d\'erreur), si écrits' },
    note: { type: 'string', description: 'Ce qui n\'a pas pu être résolu (socle absent, ADR illisible)' },
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
    checked: { type: 'array', items: { type: 'string' }, description: 'IDs Tn/NN cochés' },
    committed: { type: 'boolean' },
    commits: { type: 'array', items: { type: 'string' } },
    branch: { type: 'string', description: 'Branche portant les commits du ticket' },
    note: { type: 'string' },
  },
}

const PR_BODY = {
  type: 'object',
  required: ['title', 'body'],
  properties: {
    title: { type: 'string', description: 'Titre de la PR : feat(<slug>): <ticket> — <capability>' },
    body: { type: 'string', description: 'Corps Markdown complet, SANS le bloc d\'avertissement « PR EMPILÉE » (posé par pr-author)' },
    summary: { type: 'string', description: 'Une phrase : la valeur du ticket (pour les logs)' },
    diffStats: {
      type: 'object',
      description: 'Mesures git diff --numstat sur merge-base(base, HEAD)..HEAD',
      properties: {
        files: { type: 'integer' },
        insertions: { type: 'integer' },
        deletions: { type: 'integer' },
      },
    },
    oversized: { type: 'boolean', description: 'true si le diff dépasse le seuil de review en une passe (~400 lignes, ou 2× le budget estimé du ticket)' },
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
    worktreeRemoved: { type: 'boolean', description: 'true si le worktree du ticket a été supprimé après création de la PR (mode worktree, succès uniquement)' },
    note: { type: 'string' },
  },
}

// ---------------------------------------------------------------------------
// Orchestration. args = { featureDir: "specs/003-auth", ticket: "R2", worktree?: true }.
// Tout accès disque/git se fait DANS les agents (l'orchestrateur n'a pas d'I/O).
//
// Deux modes d'exécution :
//  - séquentiel (worktree absent/false) : comportement 0.4.0 inchangé (git switch -c
//    dans le checkout de session, arbre propre exigé) ;
//  - worktree (worktree:true) : chaque ticket vit dans un worktree git dédié (git worktree
//    add), dont le chemin absolu est propagé à chaque agent aval — qui roote alors TOUTES
//    ses opérations dessus (git -C <wt>, chemins absolus, cwd de test = worktree). C'est
//    ce qui rend le parallélisme réel possible : plusieurs tickets n'entrent plus en collision
//    sur le HEAD/arbre unique du checkout de session (couche 1 — collision d'exécution).
//    La couche 2 — conflit de contenu (fichiers non disjoints) — se règle par
//    sérialisation/empilement en amont (voir implement-parallel.js), pas ici.
// ---------------------------------------------------------------------------

const featureDir = args && args.featureDir
const ticket = args && args.ticket
if (!featureDir || !ticket) {
  throw new Error('args requis : { featureDir: "specs/NNN-slug", ticket: "NN" }')
}
const base = args && args.base ? args.base : null
const oldBase = args && args.oldBase ? args.oldBase : null
const useWorktree = !!(args && args.worktree)
const prefetched = !!(args && args.prefetched) // le remote a été fetché avant le fan-out (évite les fetch concurrents)

phase('Branch')
const branchInfo = await agent(
  useWorktree
    ? (
      `Mode WORKTREE (exécution isolée pour le parallélisme). Crée la branche dédiée du ticket ${ticket} de ${featureDir} ` +
      `DANS UN WORKTREE git dédié, à partir de ` + (base ? `la base \`${base}\`` : `la branche par défaut du repo`) + ` mise à jour. ` +
      `N'EXIGE PAS un arbre principal propre (git worktree add n'y touche pas — c'est le bénéfice du mode). ` +
      `Purge d'abord les worktrees fantômes : \`git worktree prune\`. ` +
      `Ancre le worktree HORS de l'arbre suivi : \`WT_ROOT="$(git rev-parse --path-format=absolute --git-common-dir)/scd-worktrees"\`, ` +
      `\`wtdir="$WT_ROOT/<slug>-${ticket}"\` (slug = suffixe de ${featureDir} après NNN-). ` +
      (prefetched
        ? `Le remote vient d'être fetché AVANT le fan-out : réutilise \`origin/<base>\` SANS re-fetch (évite les fetch concurrents) ; ne fetch que si \`origin/<base>\` est absent. `
        : `Fetch la base : \`git fetch origin <base>\`. `) +
      `Crée branche + worktree en un geste : \`git worktree add -b impl/<slug>-${ticket} "$wtdir" origin/<base>\` ` +
      `(fallback base locale \`<base>\` si \`origin/<base>\` absent). Si le worktree/la branche existe déjà (relance), ` +
      `réutilise proprement selon ton protocole. Retourne \`worktree:true\` et \`worktreeDir\` (chemin ABSOLU, en /). ` +
      `Aucun commit, aucun push, aucune écriture de code.`
    )
    : (
      `Crée TOUJOURS la branche dédiée du ticket ${ticket} de ${featureDir}, À PARTIR de ` +
      (base ? `la base \`${base}\`` : `la branche par défaut du repo`) +
      ` mise À JOUR (git fetch), AVANT tout autre travail. ` +
      `Exige un arbre de travail propre : si \`git status --porcelain\` n'est pas vide, STOP et retourne status='dirty-tree' sans rien faire. ` +
      `Sinon crée \`impl/<slug>-${ticket}\` (slug = suffixe de ${featureDir} après NNN-) depuis la base à jour (origin/<base>), ` +
      `ou rejoins-la si elle existe déjà. Aucun commit, aucun push, aucune écriture de code.`
    ),
  { agentType: 'scd-sdd:branch-setup', schema: BRANCH, model: 'haiku' },
)
if (!branchInfo || branchInfo.status === 'dirty-tree') {
  return { ticket, featureDir, status: 'blocked-dirty-tree', branchInfo }
}
if (!branchInfo.created) {
  return { ticket, featureDir, status: 'blocked-branch', branchInfo, worktreeDir: branchInfo && branchInfo.worktreeDir }
}

// Racine d'isolation : en mode worktree, chaque agent aval doit rooter git ET fichiers ET
// commande de test sur ce chemin. `gitPrefix` et `iso` sont injectés dans les prompts aval.
const wtDir = useWorktree ? branchInfo.worktreeDir : null
if (useWorktree && !wtDir) {
  return { ticket, featureDir, status: 'blocked-branch', branchInfo, note: 'mode worktree demandé mais worktreeDir absent du retour branch-setup' }
}
const gitPrefix = wtDir ? `git -C "${wtDir}"` : `git`
const iso = wtDir
  ? `\n\n⚠ ISOLATION WORKTREE — opère EXCLUSIVEMENT dans le worktree du ticket : \`${wtDir}\`. ` +
    `TOUT git via \`git -C "${wtDir}" …\` (jamais un git implicite sur le cwd de session, partagé avec d'autres tickets). ` +
    `Chemins de fichiers (lecture/écriture) : ABSOLUS, sous \`${wtDir}\`. ` +
    `Commande de test : exécutée avec le worktree comme cwd (\`cd "${wtDir}" && <cmd>\`, ou l'option répertoire du gestionnaire de paquets — \`pnpm -C "${wtDir}" …\`, \`npm --prefix "${wtDir}" …\`, \`cargo …\` avec \`--manifest-path\`). ` +
    `Ne touche JAMAIS au checkout principal ni au worktree d'un autre ticket.`
  : ``
// Chemin ABSOLU des références du skill `implement`, injecté dans les prompts des agents qui les
// chargent (test-writer, test-validator, review-context, les six reviewers, review-validator).
// SANS lui, un agent instruit de charger `references/testing-rubric.md` ou `review-dimensions.md`
// n'a AUCUNE base pour résoudre le relatif : il tente un `find /` (scan disque complet) → prompt de
// permission → refus → agent interrompu → run bloqué (retour de terrain uphony, phase Validate).
// Le répertoire est résolu par la commande (`/scd-sdd:run` connaît le chemin du script, dont
// `references/` est un frère déterministe) et passé en `args.refsDir` ; repli sur
// `CLAUDE_PLUGIN_ROOT` si l'env l'expose ; sinon vide (les agents gardent leur instruction relative,
// comportement d'avant le correctif). On NE code EN DUR aucun chemin : il dépend de l'utilisateur et
// de la version installée.
const refsDir = (args && args.refsDir)
  ? String(args.refsDir).replace(/\/+$/, '')
  : (process.env.CLAUDE_PLUGIN_ROOT ? `${process.env.CLAUDE_PLUGIN_ROOT}/.claude/skills/implement/references` : null)
const refs = refsDir
  ? `\n\nRÉFÉRENCES (chemins ABSOLUS, déjà résolus — ne lance JAMAIS de \`find\` pour les chercher) :\n` +
    `- testing-rubric.md    : ${refsDir}/testing-rubric.md\n` +
    `- review-dimensions.md : ${refsDir}/review-dimensions.md\n` +
    `Lis-les directement (Read) sur ces chemins, et SEULEMENT les blocs que ton rôle t'assigne.`
  : ``
log(`Branche ${branchInfo.branch} depuis ${branchInfo.base || 'défaut'}${branchInfo.baseUpToDate === false ? ' (base locale, remote absent)' : ' (à jour)'}${wtDir ? ` · worktree ${wtDir}` : ''}${refsDir ? '' : ' · ⚠ refsDir non résolu (agents en chemin relatif)'}`)

// Préventif : sur une branche fraîche c'est un no-op (idempotent), mais sur une REPRISE
// de run où la base a bougé entre-temps, on repose la branche sur la base à jour AVANT
// d'écrire. `push: auto` = ne pousse que si la branche est déjà publiée (sinon pr-author publiera).
// En mode worktree, la branche est déjà checkoutée dans le worktree → rebaser opère avec git -C
// et NE fait aucun git switch (qui échouerait, la branche étant liée au worktree).
phase('Rebase')
const rebased = await agent(
  `Rebase la branche du ticket sur sa base à jour, de façon idempotente, AVANT toute écriture de code.\n` +
  `ticketBranch: \`${branchInfo.branch}\`\nbase: \`${base || branchInfo.base}\`\n` +
  (oldBase ? `oldBase: \`${oldBase}\` (mode --onto : transplante les seuls commits du ticket)\n` : ``) +
  (wtDir ? `worktreeDir: \`${wtDir}\` (opère avec \`git -C "${wtDir}"\` ; la branche y est DÉJÀ checkoutée — ne fais AUCUN git switch/checkout de branche)\n` : ``) +
  `push: auto. Conflit → git rebase --abort et statut blocked-conflict (ne résous jamais un conflit).`,
  { agentType: 'scd-sdd:rebaser', schema: REBASE, model: 'haiku' },
)
if (rebased && (rebased.status === 'blocked-conflict' || rebased.status === 'blocked-dirty' || rebased.status === 'blocked-push')) {
  return { ticket, featureDir, status: 'blocked-rebase', rebase: rebased, branchInfo, worktreeDir: wtDir }
}
if (rebased && rebased.status === 'rebased') {
  log(`Branche re-rebasée sur ${rebased.base}${rebased.pushed ? ' (poussée --force-with-lease)' : ''}`)
}

phase('Prepare')
const brief = await agent(
  `Prépare l'implémentation du ticket ${ticket} de ${featureDir}.\n` +
  `Lis ${featureDir}/${ticket}-*.md (le ticket : Bloqué par, Vérif, Fichiers, Ce que ça livre, Critères), ` +
  `${featureDir}/SPEC.md (## Hors-périmètre et ## Décisions de test, seules sections qui comptent ici) ` +
  `(contrats + étape de vérif), et tout ${featureDir}/acceptance/*.feature du ticket. ` +
  `Détecte le mode de vérification (_vérif :_), la commande de test et les conventions du projet. ` +
  `Remplis aussi \`context\` (le matériau de la future description de PR : capability, rang du ticket, dépendances, budget estimé, ` +
  `valeur côté utilisateur, backref PRD, approche du plan, ADR contraignants, contrats, scope EXCLU, tickets suivants) — ` +
  `tu es le seul agent qui lit les trois documents, l'extraction est quasi gratuite ici. Retourne le brief structuré.` + iso,
  { agentType: 'scd-sdd:ticket-briefer', schema: BRIEF, model: 'sonnet' },
)
if (!brief) throw new Error('ticket-briefer : brief indisponible (agent skipped/failed)')
const mode = brief.verifMode || 'test'
log(`Ticket ${ticket} : ${brief.criteres.length} critère · ${brief.files.length} fichiers · mode ${mode}${brief.testCommand ? ` · test: ${brief.testCommand}` : ''}`)
if (mode !== 'test') log(`Mode ≠ test — justification du contrat : ${brief.verifJustification || '(non fournie)'}`)

// -------------------------------------------------------------------------
// Segment de vérification — VARIABLE selon le mode du ticket (brief.verifMode).
// Familles :
//   test (défaut) : Red(test-writer, rouge) → Validate → Green(implementer, tests intacts). Preuve = 0 failed.
//   observé       : Green(impl) → Verify(verifier, contexte frais). Preuve = observableProof / humanCheckRequired.
// À la sortie de ce segment : `green` est set (impl prouvée), `tests` = {files,mapping} (vide en observé),
// `verify` = VERIFY (observé) ou null. Le reste du workflow (Review→PR) est invariant.
// -------------------------------------------------------------------------
const usesTests = (mode === 'test')
let tests = { files: [], mapping: [] }
let green = null
let verify = null

if (usesTests) {
  phase('Red')
  tests = await agent(
    `Mode TEST. Écris les tests du ticket ${ticket} — un test nommé par critère — puis exécute \`${brief.testCommand}\` ` +
    `et CONFIRME le ROUGE (échec pour la bonne raison, pas une erreur de compilation triviale). red=true.` +
    `\nBrief:\n${JSON.stringify(brief)}` + iso + refs,
    { agentType: 'scd-sdd:test-writer', schema: TESTS, model: 'sonnet' },
  )
  if (!tests) throw new Error('test-writer : aucun test produit')

  phase('Validate')
  let verdict
  let tries = 0
  do {
    verdict = await agent(
      `Valide ces tests contre le brief et le rubric (1 critère = 1 test nommé ; cas limites If…then…shall… présents ; ` +
      `FIRST/AAA/nommage comportemental ; anti-patterns tautologie/sur-mock/couplage à l'implémentation ; ` +
      `état d'exécution attendu : ROUGE — rien n'est implémenté encore).\n` +
      `Brief:\n${JSON.stringify(brief)}\nTests:\n${JSON.stringify(tests)}` + iso + refs,
      { agentType: 'scd-sdd:test-validator', schema: TEST_VERDICT, model: 'opus' },
    )
    if (!verdict || verdict.ok) break
    log(`Tests à corriger (${verdict.gaps.length} gap(s)) — itération ${tries + 1}`)
    tests = await agent(
      `Corrige les tests du ticket ${ticket} selon ces gaps, ré-exécute \`${brief.testCommand}\`, ` +
      `reconfirme le ROUGE.\n` +
      `Gaps:\n${JSON.stringify(verdict.gaps)}\nTests actuels:\n${JSON.stringify(tests)}\nBrief:\n${JSON.stringify(brief)}` + iso + refs,
      { agentType: 'scd-sdd:test-writer', schema: TESTS, model: 'sonnet' },
    )
    if (!tests) throw new Error('test-writer : correction des tests échouée')
  } while (++tries < 2 && budget.remaining() > 40_000)

  if (verdict && !verdict.ok) {
    log(`Tests non validés après ${tries} itération(s) — gaps restants remontés, on poursuit vers le vert avec réserve.`)
  }

  // Porte verte : implémente jusqu'au vert.
  // Dans les deux cas, à l'arrivée : 0 failed ET tests intacts.
  phase('Green')
  let gtry = 0
  do {
    green = await agent(
      `Implémente/complète le code de production du ticket ${ticket} jusqu'à ce que \`${brief.testCommand}\` montre 0 failed. ` +
      `INTERDICTION d'éditer les fichiers de test ${JSON.stringify(tests.files)} — à la fin, exécute ` +
      `\`${gitPrefix} diff -- ${tests.files.join(' ')}\` : il DOIT être vide, sinon annule tes changements sur ces fichiers. ` +
      `Montre la sortie réelle de la commande (passing=true uniquement si 0 failed).\n` +
      `Brief:\n${JSON.stringify(brief)}` + iso,
      { agentType: 'scd-sdd:implementer', schema: GREEN, model: 'sonnet' },
    )
    if (green && green.passing && green.testsUntouched) break
    if (green) log(`Vert non atteint (passing=${green.passing}, testsUntouched=${green.testsUntouched}) — retry ${gtry + 1}`)
  } while (++gtry < 3 && budget.remaining() > 40_000)

  if (!green || !green.passing) {
    return { ticket, featureDir, status: 'blocked-red', mode, green, tests, worktreeDir: wtDir }
  }
  if (!green.testsUntouched) {
    return { ticket, featureDir, status: 'blocked-tests-modified', mode, green, tests, worktreeDir: wtDir }
  }
} else {
  // Mode observé : pas de test automatisé. Impl d'abord, puis vérif observable en CONTEXTE FRAIS
  // (producteur ≠ vérificateur : le verifier n'a pas écrit ce code).
  phase('Green')
  green = await agent(
    `Mode OBSERVÉ (pas de test automatisé). Implémente le ticket ${ticket} d'après ses critères, ` +
    `de façon à satisfaire la preuve observable décrite au brief — soit un critère déjà exécutable ` +
    `(le pipeline CI passe au vert, \`terraform apply\` converge), soit une vérification dédiée ` +
    `(lancer le service et constater, valider un artefact produit). ` +
    `Prouve que le code s'intègre (build/typecheck/lint/run selon ce qui existe) ; passing=true si aucune erreur d'intégration. ` +
    `Reste dans les fichiers du ticket. Aucun fichier de test à produire.\n` +
    `Brief:\n${JSON.stringify(brief)}` + iso,
    { agentType: 'scd-sdd:implementer', schema: GREEN, model: 'sonnet' },
  )
  if (!green || !green.passing) {
    return { ticket, featureDir, status: 'blocked-impl', mode, green, worktreeDir: wtDir }
  }

  phase('Verify')
  verify = await agent(
    `Mode OBSERVÉ. Vérifie le ticket ${ticket} en CONTEXTE FRAIS (tu n'as pas écrit ce code). ` +
    `Objectif : obtenir une PREUVE OBSERVABLE que chaque critère du brief est satisfait, SANS test unitaire. ` +
    `Si le critère est déjà exécutable, ré-exécute-le (build/lint CI en local, \`terraform plan\`/\`apply\`, le script one-shot) ; ` +
    `sinon joue la vérification observable décrite. Capture la sortie dans observableProof. ` +
    `Ce que tu ne PEUX PAS constater par exécution (mise en page visuelle, effet externe) → liste-le dans humanCheckRequired (ne prétends JAMAIS l'avoir vérifié). ` +
    `verified=true si tu as une preuve observable OU s'il ne reste que des humanCheckRequired documentés. method = la commande/observation utilisée (ré-exécutable après un correctif).\n` +
    `Preuve attendue (du contrat) : ${brief.verifJustification || '(voir le critère d\'acceptation des tâches du ticket)'}\n` +
    `Fichiers d'impl : ${JSON.stringify(green.diffFiles)}\nBrief:\n${JSON.stringify(brief)}` + iso,
    { agentType: 'scd-sdd:verifier', schema: VERIFY, model: 'opus' },
  )
  if (!verify || !verify.verified) {
    return { ticket, featureDir, status: 'blocked-verify', mode, verify, green, worktreeDir: wtDir }
  }
  const hc = (verify.humanCheckRequired || []).filter(Boolean)
  log(`Vérif ${mode} : ${verify.observableProof ? 'preuve observable capturée' : 'aucune preuve auto'}${hc.length ? ` · ${hc.length} point(s) à vérifier par un humain` : ''}`)
}

// Contexte de review résolu UNE fois (les six reviewers jugent le même diff : leur faire
// relire docs/adr/ et SPEC.md serait six lectures redondantes et divergentes). review-context
// ne juge pas — il cite. Repli sûr si l'agent est sauté : dossier vide, les reviewers ont
// chacun leur mode dégradé (architecture retombe sur l'existant, etc.).
phase('Context')
const dossier = await agent(
  `Collecte le DOSSIER DE CONTEXTE de review du ticket ${ticket} de ${featureDir}, en contexte frais, ` +
  `pour que six reviewers n'aient pas à relire les mêmes documents. Résous : la table des invariants de ` +
  `\`docs/adr/\` (invariants[], référent de la dimension architecture — vide si absente), le corps des ADR ` +
  `contraignant ce ticket (adrs[], résumés), les décisions d'impl de \`SPEC.md\` qui contraignent le diff (decisions[]), ` +
  `le hors-périmètre pertinent (outOfScope[]), les contrats d'interface (contracts). Cite (id + source), NE JUGE PAS ` +
  `(aucune sévérité, aucun finding), n'invente aucun champ.\n` +
  `Fichiers modifiés : ${JSON.stringify(green.diffFiles)}.\nBrief:\n${JSON.stringify(brief)}` + iso + refs,
  { agentType: 'scd-sdd:review-context', schema: REVIEW_CONTEXT, model: 'sonnet' },
)
const context = dossier || {}
const reviewCtx = {
  invariants: context.invariants || [],
  adrs: context.adrs || [],
  decisions: context.decisions || [],
  outOfScope: context.outOfScope || [],
  contracts: context.contracts || '',
}
log(`Dossier de contexte : ${reviewCtx.invariants.length} invariant(s) · ${reviewCtx.adrs.length} ADR${dossier ? '' : ' (agent sauté — dossier vide, replis dégradés)'}`)

// Fan-out : un reviewer par dimension, en PARALLÈLE, contexte frais (producteur ≠ vérificateur).
// Raisonnement dur en opus ; les deux dimensions de style en sonnet (levier de coût du fan-out).
phase('Review')
const REVIEWERS = [
  { dim: 'architecture',   agent: 'architecture-reviewer',   model: 'opus'   },
  { dim: 'couverture',     agent: 'coverage-reviewer',       model: 'opus'   },
  { dim: 'securite',       agent: 'security-reviewer',       model: 'opus'   },
  { dim: 'error-handling', agent: 'error-handling-reviewer', model: 'opus'   },
  { dim: 'proprete',       agent: 'cleanliness-reviewer',    model: 'sonnet' },
  { dim: 'conventions',    agent: 'conventions-reviewer',    model: 'sonnet' },
]
const reviewResults = await parallel(REVIEWERS.map((r) => () =>
  agent(
    `Review la dimension ${r.dim} de l'implémentation du ticket ${ticket} (contexte frais, tu n'as pas écrit ce code). ` +
    `Diff sur ${JSON.stringify(green.diffFiles)} (récupère-le via \`${gitPrefix} diff …\`). Mode de vérif du ticket : ${mode}` +
    (usesTests ? `` : ` — PAS de test automatisé attendu (c'est le contrat) : ne remonte jamais « absence de test », juge par la vérif observable.`) +
    `. Charge SEULEMENT ta dimension, classe bloquant/suggestion, propose un correction_prompt autonome.\n` +
    `Dossier de contexte:\n${JSON.stringify(reviewCtx)}\nBrief:\n${JSON.stringify(brief)}` + iso + refs,
    { agentType: `scd-sdd:${r.agent}`, schema: FINDINGS, model: r.model, phase: 'Review', label: `review:${r.dim}` },
  ).then((res) => ({ r, res })),
))
// Fusion : IDs préfixés par dimension pour éviter les collisions F1/F1 entre reviewers ;
// dimension forcée à celle du reviewer. Un reviewer sauté/échoué (null) est simplement absent.
const okReviews = reviewResults.filter(Boolean)
const findings = okReviews.flatMap(({ r, res }) =>
  ((res && res.findings) ? res.findings : []).filter(Boolean).map((f, i) => ({
    ...f,
    id: `${r.dim}-${f.id || ('F' + (i + 1))}`,
    dimension: r.dim,
  })),
)
if (okReviews.length < REVIEWERS.length) {
  log(`⚠ ${REVIEWERS.length - okReviews.length} reviewer(s) sauté(s)/échoué(s) — dimensions manquantes possibles`)
}
log(`Review : ${findings.length} finding(s) sur ${okReviews.length}/${REVIEWERS.length} dimensions`)

let triaged = { apply: [], skipped: [] }
if (findings.length) {
  phase('Triage')
  const t = await agent(
    `Triage sceptique et adversarial de ces findings. Pour chacun : reproduis-le dans le code, ` +
    `garde-le UNIQUEMENT s'il touche la correction ou une exigence (FR/SC du brief) ; rejette style, ` +
    `spéculation, sur-engineering, hors-scope. En cas de doute → skip.\n` +
    `Findings:\n${JSON.stringify(findings)}\nBrief:\n${JSON.stringify(brief)}\nFichiers d'impl:\n${JSON.stringify(green.diffFiles)}` + iso + refs,
    { agentType: 'scd-sdd:review-validator', schema: TRIAGE, model: 'opus' },
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
        { agentType: 'scd-sdd:fix-applier', schema: GREEN, model: 'sonnet' },
      )
    : await agent(
        // observé : pas de test à re-jouer ; re-prouve la vérif observable après le correctif.
        `Mode ${mode.toUpperCase()} : applique EXACTEMENT ces corrections validées (rien d'autre) au ticket ${ticket}, ` +
        `puis PROUVE que la vérif observable tient toujours en ré-exécutant \`${verify.method || 'la vérification observable du ticket (voir brief)'}\` ` +
        `et capture sa sortie. passing=true si l'intégration ET la preuve tiennent.\n` +
        `Corrections:\n${JSON.stringify(triaged.apply)}\nMéthode de vérif:\n${JSON.stringify(verify.method || '')}` + iso,
        { agentType: 'scd-sdd:fix-applier', schema: GREEN, model: 'sonnet' },
      )
  if (applied && applied.passing && (!usesTests || applied.testsUntouched)) {
    finalGreen = applied
  } else {
    return { ticket, featureDir, status: 'blocked-after-fix', mode, applied, triaged, green, verify, worktreeDir: wtDir }
  }
}

phase('Record')
const record = await agent(
  `Enregistre la progression du ticket ${ticket} de ${featureDir}. Tu es DÉJÀ sur la branche dédiée ` +
  `\`${branchInfo.branch}\` (créée en phase Branch` + (wtDir ? `, checkoutée dans le worktree` : ``) + `) — n'en crée aucune autre, ne change pas de branche. ` +
  `Coche les critères satisfaits dans ` + (wtDir ? `\`${wtDir}/${featureDir}/${ticket}-*.md\`` : `${featureDir}/${ticket}-*.md`) + ` ([ ] → [x]), ` +
  `sans modifier autre chose, crée les commits (un par tâche observable si possible), et retourne la branche courante ` +
  `(\`${gitPrefix} rev-parse --abbrev-ref HEAD\`).\n` +
  `Tâches du ticket:\n${JSON.stringify(brief.tasks)}` + iso,
  { agentType: 'scd-sdd:progress-recorder', schema: RECORD, model: 'haiku' },
)

// Filet déterministe : la branche portant les commits DOIT être celle posée par branch-setup.
// Si progress-recorder a dérivé (switch/branche involontaire), on refuse d'ouvrir une PR sur
// la mauvaise tête — échec bruyant plutôt que PR silencieusement cassée.
if (record && record.branch && record.branch !== branchInfo.branch) {
  return {
    ticket,
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
      `Compose la description de la PR du ticket ${ticket} de ${featureDir}, pour un REVIEWER HUMAIN : ` +
      `le fonctionnel (capability, valeur, backref PRD, hors-périmètre) ET le code (stats de diff réelles, ordre de lecture, ` +
      `points à scruter, findings appliqués ET rejetés avec leur motif, preuve d'exécution). ` +
      `Mesure le diff toi-même : \`${gitPrefix} merge-base ${base || branchInfo.base} HEAD\` (préfère \`origin/${base || branchInfo.base}\` s'il existe) ` +
      `puis \`${gitPrefix} diff --numstat <mb> HEAD\` et \`${gitPrefix} log --oneline --no-decorate <mb>..HEAD\` — aucun chiffre estimé. ` +
      `Corps en couches : lisible en 30 s, blocs volumineux dans des <details>. ` +
      `N'écris PAS le bloc « PR EMPILÉE » (c'est pr-author). Lecture seule : aucun push, aucune PR, aucune écriture.\n` +
      `Résumé:\n${JSON.stringify({
        ticket,
        featureDir,
        branch: (record && record.branch) || branchInfo.branch,
        base: base || branchInfo.base,
        worktreeDir: wtDir || undefined,
        context: brief.context || undefined,
        verifMode: mode,
        verifJustification: brief.verifJustification || undefined,
        criteres: brief.criteres,
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
      { agentType: 'scd-sdd:pr-describer', schema: PR_BODY, model: 'opus' },
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
  `Publie une PR "ready for review" pour le ticket ${ticket} de ${featureDir}. Détecte la plateforme (gh/glab), ` +
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
    ? `\n\nMode WORKTREE : la branche du ticket est checkoutée dans \`${wtDir}\`. Fais TOUT git local via \`git -C "${wtDir}" …\` ` +
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
    ticket,
    featureDir,
    branch: (record && record.branch) || branchInfo.branch,
    base: base || branchInfo.base,
    worktreeDir: wtDir || undefined,
    // Matériau du corps de REPLI uniquement (ignoré si `body` est fourni).
    verifMode: mode,
    verifJustification: brief.verifJustification || undefined,
    capability: (brief.context && brief.context.capability) || undefined,
    criteres: described ? undefined : brief.criteres,
    files: described ? undefined : finalGreen.diffFiles,
    tests: described ? undefined : tests.files,
    mapping: described ? undefined : tests.mapping,
    // Preuve : sortie 0 failed (mode test) OU preuve observable du verifier (mode observé).
    proof: described ? undefined : (usesTests ? finalGreen.output : (verify && verify.observableProof)),
    testCommand: described ? undefined : brief.testCommand,
    verifyMethod: described ? undefined : (verify ? verify.method : undefined),
    humanCheckRequired: described ? undefined : (verify ? (verify.humanCheckRequired || []) : []),
    appliedCount: triaged.apply.length,
    skippedCount: triaged.skipped.length,
  })}`,
  { agentType: 'scd-sdd:pr-author', schema: PR_RESULT, model: 'sonnet' },
)

// Nettoyage du worktree : en succès (PR créée), pr-author l'a supprimé. Sinon on le CONSERVE
// et on retourne son chemin pour inspection humaine (le travail du ticket n'existe que là si le
// push n'a pas pu se faire).
const worktreeKept = wtDir && !(pr && pr.created && pr.worktreeRemoved) ? wtDir : null

return {
  ticket,
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
