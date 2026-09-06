export const meta = {
  name: 'implement-ticket',
  description:
    "Implémente UN ticket NN d'un change OpenSpec (changes/<x>/tickets/NN-slug.md) selon son mode de vérif (`tdd` par défaut du cycle, `test`, `observé`, `aucun`) : branche → rebase → BRIEF → segment de vérif variable → quality gate → review 8 dimensions en contexte frais → triage adversarial → apply → record → describe → PR. Un lancement = un ticket, une PR. On n'appelle JAMAIS /opsx:apply : run prend le relais sur les tickets.",
  whenToUse:
    "Depuis /scd-spec-dev:run, pour implémenter un ticket NN de changes/<x>/, une fois ses bloqueurs faits et l'arbre propre.",
  phases: [
    { title: 'Branch', detail: 'branch-setup : crée impl/<slug>-NN depuis la base à jour (arbre propre exigé en séquentiel ; en worktree → git worktree add dédié, arbre principal libre)' },
    { title: 'Rebase', detail: 'rebaser : (préventif, idempotent) repose la branche sur la base à jour ; no-op sur une branche fraîche' },
    { title: 'Prepare', detail: 'ticket-briefer : lit le fichier ticket SANS hypothèse OpenSpec, produit le BRIEF (critères SC-<NN><lettre>, verifMode, files, REVIEW_CONTEXT)' },
    { title: 'Red', detail: 'test-writer : (tdd) 1 test nommé par critère AVANT le code, état ROUGE ; (test) tests écrits juste APRÈS Green, état VERT' },
    { title: 'Validate', detail: 'test-validator : (tdd · test) 1 critère = 1 test, cas limites, anti-tautologie' },
    { title: 'Green', detail: 'implementer : (tdd · test) implémente jusqu\'au vert sans toucher aux tests ; (observé) prouve l\'intégration ; (aucun) spike' },
    { title: 'Verify', detail: 'verifier : (tdd · test) CEINTURE — rejeu sur checkout propre + git diff test vide ; (observé) preuve observable / humanCheckRequired' },
    { title: 'Quality', detail: 'quality-analyzer → quality-fixer (autofix sûr) → escalade des échecs non-autofixables : chaque check routé vers SON agent dédié quality-<id> (co-écrit par /scd-spec-dev:quality-agents, sinon générique quality-advisor) → triage → fix-applier → re-analyze. blocking résiduel échoue le ticket, advisory → findings. No-op sans .claude/quality.json' },
    { title: 'Context', detail: 'review-context : dossier de contexte (invariants docs/architecture.md, ADR, décisions/hors-périmètre) résolu UNE fois pour les six reviewers de code' },
    { title: 'Review', detail: 'HUIT reviewers en parallèle, contexte frais : architecture, sécurité, conventions, propreté, error-handling, couverture + change (niveau artefact) + integrity (escape-hatches/chemins protégés)' },
    { title: 'Triage', detail: 'review-validator : triage sceptique adversarial, au doute → skip' },
    { title: 'Apply', detail: 'fix-applier : applique les findings retenus chirurgicalement, re-vérifie selon le mode' },
    { title: 'Record', detail: 'progress-recorder : coche les critères satisfaits du ticket, commit sur la branche dédiée' },
    { title: 'Describe', detail: 'pr-describer : compose le corps de PR en couches + matrice critère → test → statut' },
    { title: 'PR', detail: 'pr-author : pousse la branche, ouvre la PR (ready, ou draft anti-orphelinage si empilée)' },
  ],
}

// ---------------------------------------------------------------------------
// Schémas de handoff (JSON Schema). Chaque étape aval consomme un objet validé.
// Les formes reprennent EXACTEMENT la sortie JSON de chaque agent du plugin.
// ---------------------------------------------------------------------------

const BRANCH = {
  type: 'object',
  required: ['branch'],
  properties: {
    branch: { type: 'string', description: 'impl/<slug>-<NN>' },
    base: { type: 'string', description: 'Base retenue (ex. origin/main)' },
    mode: { type: 'string', description: 'sequential | worktree' },
    worktreeDir: { type: 'string', description: 'Chemin ABSOLU du worktree du ticket (mode worktree ; null sinon)' },
    clean: { type: 'boolean', description: 'true si l\'arbre était propre (séquentiel)' },
    exists: { type: 'boolean', description: 'true si la branche existait déjà (reprise)' },
    stopped: { type: 'boolean', description: 'true si l\'agent a dû s\'arrêter sans rien modifier (arbre sale, chemin invalide)' },
    reason: { type: 'string', description: 'Motif de l\'arrêt le cas échéant' },
  },
}

const REBASE = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', description: 'rebased | already-up-to-date | conflict' },
    branch: { type: 'string' },
    newBase: { type: 'string' },
    conflictFiles: { type: 'array', items: { type: 'string' } },
    pushed: { type: 'boolean' },
  },
}

const BRIEF = {
  type: 'object',
  required: ['ticket', 'verifMode', 'criteres', 'files'],
  properties: {
    ticket: { type: 'string' },
    slug: { type: 'string' },
    title: { type: 'string', description: 'Intitulé du ticket : la capability en une phrase' },
    verifMode: { type: 'string', description: 'tdd | test | observé | aucun (jamais « arbitrage humain » : ce serait un gap)' },
    criteres: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'text'],
        properties: {
          id: { type: 'string', description: 'id stable SC-<NN><lettre>' },
          text: { type: 'string' },
          done: { type: 'boolean' },
        },
      },
    },
    files: { type: 'array', items: { type: 'string' }, description: 'Fichiers pressentis (ligne **Fichiers :**)' },
    blockedBy: { type: 'array', items: { type: 'string' } },
    context: {
      type: 'object',
      properties: {
        why: { type: 'string', description: '## Ce que ça livre — le comportement bout en bout' },
        decisions: { type: 'string', description: 'Approche technique à respecter (design)' },
        outOfScope: { type: 'string', description: 'Ce que le ticket ne couvre pas — ce qu\'aucun reviewer ne doit réclamer' },
      },
    },
    conventions: { type: 'string', description: 'Synthèse CLAUDE.md + patrons voisins (les reviewers de conventions lisent ce champ)' },
    testCommand: { type: 'string', description: 'Commande projet de test / vérif (null si indéterminée)' },
    REVIEW_CONTEXT: {
      type: 'object',
      description: 'Pointeurs résolvables consommés par review-context et les reviewers',
      properties: {
        adr: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, path: { type: 'string' } } } },
        architecture: { type: 'string', description: 'docs/architecture.md si présent' },
        securityReview: { type: 'string', description: 'changes/<x>/security-review.md ou null' },
        reviewJson: { type: 'string', description: '.claude/review.json ou null' },
      },
    },
    gaps: { type: 'array', items: { type: 'string' }, description: 'Ce que le ticket a forcé à deviner ou qui manque (id absent, Vérif illégale, Ce que ça livre vide)' },
  },
}

const TESTS = {
  type: 'object',
  required: ['testFiles'],
  properties: {
    skipped: { type: 'boolean', description: 'true en mode observé/aucun (pas de segment test)' },
    mode: { type: 'string' },
    testFiles: { type: 'array', items: { type: 'string' } },
    testsByCriterion: {
      type: 'array',
      items: { type: 'object', required: ['id', 'test'], properties: { id: { type: 'string' }, test: { type: 'string' } } },
    },
    expectedState: { type: 'string', description: 'red (tdd) | green (test)' },
    observedState: { type: 'string', description: 'État réellement observé — s\'il diffère, ne pas maquiller' },
    evidence: { type: 'string', description: 'Extrait de la sortie de test prouvant l\'état' },
  },
}

const TEST_VERDICT = {
  type: 'object',
  required: ['verdict'],
  properties: {
    verdict: { type: 'string', description: 'ok | gaps | n/a' },
    coverage: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, hasTest: { type: 'boolean' }, note: { type: 'string' } } } },
    gaps: {
      type: 'array',
      items: { type: 'object', required: ['detail'], properties: { severity: { type: 'string' }, kind: { type: 'string' }, detail: { type: 'string' } } },
    },
  },
}

const GREEN = {
  type: 'object',
  required: ['mode', 'implFiles'],
  properties: {
    mode: { type: 'string' },
    implFiles: { type: 'array', items: { type: 'string' }, description: 'Fichiers d\'implémentation modifiés' },
    testState: {
      type: 'object',
      description: 'Modes tdd/test : la preuve 0 failed (null en observé/aucun)',
      properties: { command: { type: 'string' }, failed: { type: 'integer' }, evidence: { type: 'string' } },
    },
    testsDiffEmpty: { type: 'boolean', description: 'true si git diff sur les fichiers de test est vide (modes tdd/test)' },
    integration: {
      type: 'object',
      description: 'Mode observé : preuve que le code s\'intègre (build/typecheck/lint/run)',
      properties: { command: { type: 'string' }, output: { type: 'string' } },
    },
    suspectTest: { type: 'string', description: 'Non nul : un test paraît contredire l\'énoncé — à trancher en amont, jamais à contourner' },
    spike: { type: 'boolean', description: 'true en mode aucun' },
  },
}

const VERIFY = {
  type: 'object',
  required: ['mode'],
  properties: {
    mode: { type: 'string' },
    beltPassed: {
      type: 'object',
      description: 'Modes tdd/test : la ceinture verify-time (null en observé)',
      properties: { testsDiffEmpty: { type: 'boolean' }, failed: { type: 'integer' }, evidence: { type: 'string' } },
    },
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          verified: { type: 'boolean' },
          method: { type: 'string' },
          evidence: { type: 'string' },
          humanCheckRequired: { type: 'string', description: 'Ce qu\'un agent ne peut pas constater — instruction pour le reviewer humain' },
        },
      },
    },
    allVerified: { type: 'boolean', description: 'false (échec de ceinture ou critère non prouvé) → échec ou attente humaine' },
  },
}

// Dossier de contexte résolu UNE fois par review-context et servi aux six reviewers de code.
const REVIEW_CONTEXT = {
  type: 'object',
  properties: {
    invariants: {
      type: 'object',
      description: 'Table des invariants de docs/architecture.md — référent de l\'architecture-reviewer',
      properties: { source: { type: 'string' }, rules: { type: 'array', items: { type: 'string' } } },
    },
    adr: {
      type: 'array',
      description: 'ADR contraignant ce ticket, corps résumé',
      items: { type: 'object', properties: { id: { type: 'string' }, titre: { type: 'string' }, decision: { type: 'string' }, consequences: { type: 'string' } } },
    },
    decisions: { type: 'string', description: 'Approche technique à respecter' },
    outOfScope: { type: 'string', description: 'Ce que le ticket ne couvre pas — ce qu\'aucun reviewer ne doit réclamer' },
    interfaces: { type: 'array', items: { type: 'object', properties: { symbol: { type: 'string' }, source: { type: 'string' } } } },
    aids: {
      type: 'object',
      description: 'Aides à la review : .claude/review.json fait autorité, l\'auto-détection complète. Skill local DISTILLÉ ; MCP en POINTEUR (non interrogeable).',
      properties: {
        skills: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, why: { type: 'string' }, digest: { type: 'string' } } } },
        mcp: { type: 'array', items: { type: 'object', properties: { server: { type: 'string' }, pointer: { type: 'string' } } } },
      },
    },
    notes: { type: 'array', items: { type: 'string' }, description: 'Ce qui n\'a pas pu être résolu (socle absent, ADR illisible)' },
  },
}

// Forme commune à TOUS les reviewers (les 6 de code + change + integrity).
const FINDINGS = {
  type: 'object',
  required: ['dimension', 'findings'],
  properties: {
    dimension: { type: 'string', description: 'architecture | securite | conventions | proprete | error-handling | coverage | change | integrity' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'summary'],
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', description: 'bloquant | suggestion' },
          location: { type: 'string', description: 'fichier:ligne' },
          summary: { type: 'string' },
          rationale: { type: 'string' },
          correction_prompt: { type: 'string', description: 'Autonome : suffit au fix-applier sans rouvrir le débat' },
        },
      },
    },
    note: { type: 'string', description: 'ex. « mode aucun — pas de couverture attendue »' },
  },
}

const TRIAGE = {
  type: 'object',
  required: ['decisions'],
  properties: {
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'decision'],
        properties: {
          id: { type: 'string' },
          dimension: { type: 'string' },
          decision: { type: 'string', description: 'apply | skip' },
          reason: { type: 'string' },
          correction_prompt: { type: 'string' },
        },
      },
    },
    summary: { type: 'object', properties: { in: { type: 'integer' }, apply: { type: 'integer' }, skip: { type: 'integer' } } },
  },
}

const QUALITY_ANALYSIS = {
  type: 'object',
  required: ['gate'],
  properties: {
    gate: { type: 'string', description: 'ok | skipped | error' },
    reason: { type: 'string' },
    summary: {
      type: 'object',
      properties: { checks: { type: 'integer' }, passed: { type: 'integer' }, blockingFailures: { type: 'integer' }, advisoryFailures: { type: 'integer' } },
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          checkId: { type: 'string' },
          severity: { type: 'string', description: 'blocking | advisory' },
          status: { type: 'string', description: 'pass | fail | unparseable' },
          measured: { type: 'string' },
          threshold: { type: 'string' },
          locations: { type: 'array', items: { type: 'string' } },
          autofixable: { type: 'boolean' },
          agent: { type: 'string', description: "agent dédié du check (quality-<id>) vérifié présent sur disque, ou null → générique quality-advisor" },
          evidence: { type: 'string' },
        },
      },
    },
  },
}

const QUALITY_FIX = {
  type: 'object',
  required: ['testsUntouched'],
  properties: {
    applied: { type: 'array', items: { type: 'object', properties: { checkId: { type: 'string' }, cmd: { type: 'string' }, result: { type: 'string' } } } },
    residual: { type: 'array', items: { type: 'object', properties: { checkId: { type: 'string' }, severity: { type: 'string' }, status: { type: 'string' }, reason: { type: 'string' } } } },
    testsUntouched: { type: 'boolean' },
    blockingResidual: { type: 'integer', description: '> 0 → le ticket doit échouer' },
  },
}

// Avis d'un quality-advisor sur UN check en échec non-autofixable : diagnostic + proposition
// (correction_prompt) si une édition de code bornée peut le résorber, sinon `applicable:false` + reason.
const QUALITY_ADVICE = {
  type: 'object',
  required: ['checkId', 'applicable'],
  properties: {
    checkId: { type: 'string' },
    applicable: { type: 'boolean', description: 'true ssi une correction de code bornée peut résorber le check ici' },
    kind: { type: 'string', description: 'refactor | dedupe | lint | complexity | …' },
    severity: { type: 'string', description: 'blocking | advisory (repris du check)' },
    location: { type: 'string' },
    diagnosis: { type: 'string' },
    correction_prompt: { type: 'string', description: 'autonome, chirurgical — présent ssi applicable:true' },
    reason: { type: 'string', description: 'pourquoi non applicable (ex. exige des tests neufs) — présent ssi applicable:false' },
    evidence: { type: 'string' },
  },
}

const APPLY = {
  type: 'object',
  required: ['applied'],
  properties: {
    applied: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, files: { type: 'array', items: { type: 'string' } }, result: { type: 'string' } } } },
    notApplied: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } } } },
    reverify: {
      type: 'object',
      properties: { mode: { type: 'string' }, failed: { type: 'integer' }, testsDiffEmpty: { type: 'boolean' }, evidence: { type: 'string' } },
    },
  },
}

const RECORD = {
  type: 'object',
  required: ['branch', 'checked'],
  properties: {
    branch: { type: 'string', description: 'Branche portant les commits du ticket' },
    checked: { type: 'array', items: { type: 'string' }, description: 'ids SC-<NN><lettre> cochés' },
    commits: { type: 'array', items: { type: 'object', properties: { sha: { type: 'string' }, message: { type: 'string' } } } },
    ticketFileUpdated: { type: 'boolean' },
    stopped: { type: 'boolean', description: 'true si progress-recorder s\'est arrêté (mauvaise branche)' },
  },
}

const PR_BODY = {
  type: 'object',
  required: ['title', 'body'],
  properties: {
    title: { type: 'string', description: 'Titre au scope du ticket' },
    body: { type: 'string', description: 'Corps Markdown en couches, SANS le bloc « PR EMPILÉE » (posé par pr-author)' },
  },
}

const PR_RESULT = {
  type: 'object',
  properties: {
    prUrl: { type: 'string' },
    branch: { type: 'string' },
    base: { type: 'string' },
    stacked: { type: 'boolean', description: 'true si base ≠ branche par défaut (PR empilée → draft)' },
    state: { type: 'string', description: 'draft (empilée) | ready' },
    labels: { type: 'array', items: { type: 'string' } },
    worktreeRemoved: { type: 'boolean' },
  },
}

// ---------------------------------------------------------------------------
// Orchestration. args = { changeDir: "changes/export-csv", ticket: "02", base?, oldBase?, worktree?, prefetched? }.
// Tout accès disque/git se fait DANS les agents (l'orchestrateur n'a pas d'I/O).
//
// Deux modes d'exécution, comme dans le patron du plugin :
//  - séquentiel (worktree absent/false) : git switch -c dans le checkout de session, arbre propre exigé ;
//  - worktree (worktree:true) : chaque ticket vit dans un worktree git dédié dont le chemin absolu est
//    propagé à chaque agent aval (git -C <wt>, chemins absolus, cwd de test = worktree). C'est ce qui
//    rend le parallélisme réel possible : la couche 1 (collision d'exécution sur le HEAD/arbre unique).
//    La couche 2 (conflit de contenu : fichiers non disjoints) se règle par sérialisation en amont
//    (implement-parallel.js), pas ici.
// ---------------------------------------------------------------------------

const changeDir = args && args.changeDir
const ticket = args && args.ticket
if (!changeDir || !ticket) {
  throw new Error('args requis : { changeDir: "changes/<x>", ticket: "NN" }')
}
const base = args && args.base ? args.base : null
const oldBase = args && args.oldBase ? args.oldBase : null
const useWorktree = !!(args && args.worktree)
const prefetched = !!(args && args.prefetched) // le remote a été fetché avant le fan-out (évite les fetch concurrents)

// Glob du fichier ticket : la décomposition l'a écrit `NN-slug.md`. L'orchestrateur ne connaît pas le
// slug (aucune I/O) — les agents résolvent le fichier depuis ce glob.
const ticketGlob = `${changeDir}/tickets/${ticket}-*.md`

phase('Branch')
const branchInfo = await agent(
  useWorktree
    ? (
      `Mode WORKTREE (exécution isolée pour le parallélisme). Crée la branche dédiée du ticket ${ticket} du change ${changeDir} ` +
      `DANS UN WORKTREE git dédié, à partir de ` + (base ? `la base \`${base}\`` : `la branche par défaut du dépôt`) + ` mise à jour. ` +
      `N'EXIGE PAS un arbre principal propre (git worktree add n'y touche pas — c'est le bénéfice du mode). ` +
      `Le slug = le suffixe du nom de fichier \`${ticketGlob}\` après \`${ticket}-\`, sans l'extension .md (résous-le : \`ls ${ticketGlob}\`). ` +
      `Nom de branche : \`impl/<slug>-${ticket}\`. ` +
      `Purge d'abord les worktrees fantômes : \`git worktree prune\`. ` +
      `Ancre le RÉPERTOIRE CIBLE du worktree HORS de l'arbre suivi : \`WT_ROOT="$(git rev-parse --path-format=absolute --git-common-dir)/scd-worktrees"\`, ` +
      `répertoire cible \`"$WT_ROOT/<slug>-${ticket}"\`. ` +
      (prefetched
        ? `Le remote vient d'être fetché AVANT le fan-out : réutilise \`origin/<base>\` SANS re-fetch (évite les fetch concurrents) ; ne fetch que si \`origin/<base>\` est absent. `
        : `Fetch la base : \`git fetch origin\`. `) +
      `Crée branche + worktree en un geste : \`git worktree add "<répertoire cible>" -b impl/<slug>-${ticket} origin/<base>\` ` +
      `(fallback base locale \`<base>\` si \`origin/<base>\` absent). Si le worktree/la branche existe déjà (relance), ` +
      `réutilise proprement et retourne \`exists:true\`. Retourne \`mode:"worktree"\` et \`worktreeDir\` (chemin ABSOLU). ` +
      `Aucun commit, aucun push, aucune écriture de code.`
    )
    : (
      `Mode SÉQUENTIEL. Crée TOUJOURS la branche dédiée du ticket ${ticket} du change ${changeDir}, À PARTIR de ` +
      (base ? `la base \`${base}\`` : `la branche par défaut du dépôt`) +
      ` mise À JOUR (git fetch), AVANT tout autre travail. ` +
      `Exige un arbre de travail propre : si \`git status --porcelain\` n'est pas vide, STOP et retourne \`stopped:true\` avec le motif, sans rien faire. ` +
      `Le slug = le suffixe du nom de fichier \`${ticketGlob}\` après \`${ticket}-\`, sans .md (\`ls ${ticketGlob}\`). ` +
      `Sinon \`git switch -c impl/<slug>-${ticket} origin/<base>\` (ou la base fournie, résolue en remote-tracking), ` +
      `ou rejoins-la si elle existe déjà (\`exists:true\`). Retourne \`mode:"sequential"\`. Aucun commit, aucun push, aucune écriture de code.`
    ),
  { agentType: 'scd-spec-dev:branch-setup', schema: BRANCH, model: 'haiku' },
)
if (!branchInfo || branchInfo.stopped) {
  return { ticket, changeDir, status: 'blocked-branch', branchInfo, note: branchInfo && branchInfo.reason }
}
if (!branchInfo.branch) {
  return { ticket, changeDir, status: 'blocked-branch', branchInfo, note: 'branch-setup n\'a pas retourné de branche' }
}

// Racine d'isolation : en mode worktree, chaque agent aval doit rooter git ET fichiers ET commande de
// test sur ce chemin. `gitPrefix` et `iso` sont injectés dans les prompts aval.
const wtDir = useWorktree ? branchInfo.worktreeDir : null
if (useWorktree && !wtDir) {
  return { ticket, changeDir, status: 'blocked-branch', branchInfo, note: 'mode worktree demandé mais worktreeDir absent du retour branch-setup' }
}
const gitPrefix = wtDir ? `git -C "${wtDir}"` : `git`
const iso = wtDir
  ? `\n\n⚠ ISOLATION WORKTREE — opère EXCLUSIVEMENT dans le worktree du ticket : \`${wtDir}\`. ` +
    `TOUT git via \`git -C "${wtDir}" …\` (jamais un git implicite sur le cwd de session, partagé avec d'autres tickets). ` +
    `Chemins de fichiers (lecture/écriture) : ABSOLUS, sous \`${wtDir}\`. ` +
    `Commande de test : exécutée avec le worktree comme cwd (\`cd "${wtDir}" && <cmd>\`, ou l'option répertoire du gestionnaire de paquets — \`pnpm -C\`, \`npm --prefix\`, \`cargo --manifest-path\`). ` +
    `Ne touche JAMAIS au checkout principal ni au worktree d'un autre ticket.`
  : ``
log(`Branche ${branchInfo.branch} depuis ${base || branchInfo.base || 'défaut'}${branchInfo.exists ? ' (reprise)' : ''}${wtDir ? ` · worktree ${wtDir}` : ''}`)

// Préventif : no-op sur une branche fraîche (idempotent) ; sur une REPRISE où la base a bougé, on
// repose la branche sur la base à jour AVANT d'écrire.
phase('Rebase')
const rebased = await agent(
  `Rebase la branche du ticket sur sa base à jour, de façon idempotente, AVANT toute écriture de code.\n` +
  `lotBranch: \`${branchInfo.branch}\`\nnewBase: \`${base || branchInfo.base}\`\n` +
  (oldBase ? `oldBase: \`${oldBase}\` (mode --onto : transplante les seuls commits du ticket)\n` : `oldBase: \`${base || branchInfo.base}\` (branche fraîche : rebase idempotent, no-op attendu)\n`) +
  (wtDir ? `worktreeDir: \`${wtDir}\` (opère avec \`git -C "${wtDir}"\` ; la branche y est DÉJÀ checkoutée — ne fais AUCUN git switch/checkout de branche)\n` : ``) +
  `Publie le rebase seulement si la branche est déjà publiée. Conflit → git rebase --abort et status:"conflict" (ne résous JAMAIS un conflit).`,
  { agentType: 'scd-spec-dev:rebaser', schema: REBASE, model: 'haiku' },
)
if (rebased && rebased.status === 'conflict') {
  return { ticket, changeDir, status: 'blocked-rebase', rebase: rebased, branchInfo, worktreeDir: wtDir }
}
if (rebased && rebased.status === 'rebased') {
  log(`Branche re-rebasée sur ${rebased.newBase}${rebased.pushed ? ' (poussée --force-with-lease)' : ''}`)
}

phase('Prepare')
const brief = await agent(
  `Prépare l'implémentation du ticket ${ticket} du change ${changeDir}. Lis le fichier ticket \`${ticketGlob}\` ` +
  `(titre, **Bloqué par :**, **Vérif :**, **Fichiers :**, ## Ce que ça livre, ## Critères avec leurs ids SC-<NN><lettre>) ` +
  `SANS présumer d'OpenSpec : le fichier ticket se suffit ; ce qui manque, tu le signales dans \`gaps\`, tu ne rouvres pas le change. ` +
  `Détecte \`verifMode\` ∈ {tdd, test, observé, aucun} — « arbitrage humain » y serait un défaut bloquant (gap). ` +
  `Détecte la commande de test (\`docs/ci.md\` fait foi si présent) et les conventions (CLAUDE.md + patrons voisins). ` +
  `Résous les pointeurs de REVIEW_CONTEXT (ADR contraignants, docs/architecture.md, changes/<x>/security-review.md, .claude/review.json). ` +
  `Retourne le BRIEF structuré.` + iso,
  { agentType: 'scd-spec-dev:ticket-briefer', schema: BRIEF, model: 'sonnet' },
)
if (!brief) throw new Error('ticket-briefer : brief indisponible (agent skipped/failed)')
const mode = brief.verifMode || 'tdd'
if (!['tdd', 'test', 'observé', 'aucun'].includes(mode)) {
  return { ticket, changeDir, status: 'blocked-brief', note: `verifMode illégal : « ${mode} » (attendu tdd|test|observé|aucun)`, brief }
}
const usesTests = (mode === 'tdd' || mode === 'test')
log(`Ticket ${ticket} : ${brief.criteres.length} critère · ${brief.files.length} fichier(s) · mode ${mode}${brief.testCommand ? ` · test: ${brief.testCommand}` : ''}${(brief.gaps && brief.gaps.length) ? ` · ⚠ ${brief.gaps.length} gap(s)` : ''}`)

// -------------------------------------------------------------------------
// Segment de vérification — VARIABLE selon brief.verifMode.
//   tdd    : Red(rouge) → Validate → Green(0 failed, tests intacts) → Verify(ceinture).
//   test   : Green(intégration) → Red(tests APRÈS, vert) → Validate → Verify(ceinture, rejeu).
//   observé: Green(intégration) → Verify(preuve observable / humanCheckRequired).
//   aucun  : Green(spike). Pas de test, pas de verify.
// À la sortie : `green` (impl prouvée), `tests` = {testFiles, testsByCriterion} (vide en observé/aucun),
// `verify` = VERIFY ou null. Le reste (Quality → PR) est invariant.
// -------------------------------------------------------------------------
let tests = { testFiles: [], testsByCriterion: [] }
let green = null
let verify = null

const briefJson = JSON.stringify(brief)

if (mode === 'tdd') {
  phase('Red')
  tests = await agent(
    `Mode TDD. Écris les tests du ticket ${ticket} — un test nommé par critère, l'id SC-<NN><lettre> DANS le nom — puis exécute ` +
    `\`${brief.testCommand}\` et CONFIRME le ROUGE (échec pour la BONNE raison : fonctionnalité absente, pas une erreur de compilation triviale). ` +
    `expectedState="red". Ne touche JAMAIS au code de production.\nBRIEF:\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:test-writer', schema: TESTS, model: 'sonnet' },
  )
  if (!tests || tests.skipped) throw new Error('test-writer : aucun test produit en mode tdd')

  phase('Validate')
  let verdict
  let vtry = 0
  do {
    verdict = await agent(
      `Valide ces tests contre le BRIEF et le rubric (1 critère = 1 test nommé portant son id ; cas limites EP+BVA présents ; ` +
      `FIRST/AAA/nommage comportemental ; anti-patterns tautologie/sur-mock/couplage à l'implémentation ; ` +
      `rouge LÉGITIME — les tests échouent sur la fonctionnalité absente, pas sur un import/compile cassé).\n` +
      `BRIEF:\n${briefJson}\nFichiers de test:\n${JSON.stringify(tests.testFiles)}` + iso,
      { agentType: 'scd-spec-dev:test-validator', schema: TEST_VERDICT, model: 'opus' },
    )
    if (!verdict || verdict.verdict === 'ok' || verdict.verdict === 'n/a') break
    const blocking = (verdict.gaps || []).filter((g) => g.severity === 'bloquant')
    if (!blocking.length) break
    log(`Tests à corriger (${blocking.length} gap(s) bloquant(s)) — itération ${vtry + 1}`)
    tests = await agent(
      `Corrige les tests du ticket ${ticket} selon ces gaps bloquants, ré-exécute \`${brief.testCommand}\`, reconfirme le ROUGE légitime.\n` +
      `Gaps:\n${JSON.stringify(blocking)}\nFichiers de test actuels:\n${JSON.stringify(tests.testFiles)}\nBRIEF:\n${briefJson}` + iso,
      { agentType: 'scd-spec-dev:test-writer', schema: TESTS, model: 'sonnet' },
    )
    if (!tests || tests.skipped) throw new Error('test-writer : correction des tests échouée')
  } while (++vtry < 2 && budget.remaining() > 40_000)

  phase('Green')
  let gtry = 0
  do {
    green = await agent(
      `Mode TDD. Implémente/complète le code de production du ticket ${ticket} jusqu'à ce que \`${brief.testCommand}\` montre 0 failed. ` +
      `INTERDICTION d'éditer les fichiers de test ${JSON.stringify(tests.testFiles)} — à la fin, exécute ` +
      `\`${gitPrefix} diff -- ${tests.testFiles.join(' ')}\` : il DOIT être vide (testsDiffEmpty=true), sinon annule tes changements sur ces fichiers. ` +
      `INTERDICTION de tout escape-hatch (@ts-ignore, as any, eslint-disable, # noqa, .skip(, --no-verify). ` +
      `Montre la sortie réelle (testState.failed=0 uniquement si 0 failed).\nBRIEF:\n${briefJson}` + iso,
      { agentType: 'scd-spec-dev:implementer', schema: GREEN, model: 'sonnet' },
    )
    if (green && green.testState && green.testState.failed === 0 && green.testsDiffEmpty) break
    if (green) log(`Vert non atteint (failed=${green.testState ? green.testState.failed : '?'}, testsDiffEmpty=${green.testsDiffEmpty}) — retry ${gtry + 1}`)
  } while (++gtry < 3 && budget.remaining() > 40_000)

  if (!green || !green.testState || green.testState.failed !== 0) {
    return { ticket, changeDir, status: 'blocked-red', mode, green, tests, worktreeDir: wtDir }
  }
  if (!green.testsDiffEmpty) {
    return { ticket, changeDir, status: 'blocked-tests-modified', mode, green, tests, worktreeDir: wtDir }
  }
} else if (mode === 'test') {
  // test-after : l'impl vient d'abord (prouve l'intégration), les tests sont écrits juste après, VERTS.
  phase('Green')
  green = await agent(
    `Mode TEST (test-after). Implémente le ticket ${ticket} d'après ses critères. Les tests seront écrits JUSTE APRÈS ` +
    `(ils n'existent pas encore) : prouve ici que le code S'INTÈGRE — build / typecheck / lint / run selon ce qui existe ` +
    `(\`docs/ci.md\` fait foi), capture la sortie dans \`integration\`. Reste dans les \`files[]\` du BRIEF. ` +
    `INTERDICTION de tout escape-hatch (@ts-ignore, as any, eslint-disable, # noqa, .skip(, --no-verify).\nBRIEF:\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:implementer', schema: GREEN, model: 'sonnet' },
  )
  if (!green || (!green.integration && (!green.implFiles || !green.implFiles.length))) {
    return { ticket, changeDir, status: 'blocked-impl', mode, green, worktreeDir: wtDir }
  }

  phase('Red')
  tests = await agent(
    `Mode TEST (test-after). Le code du ticket ${ticket} est écrit. Écris maintenant les tests — un test nommé par critère, ` +
    `l'id SC-<NN><lettre> DANS le nom — puis exécute \`${brief.testCommand}\` et CONFIRME le VERT (expectedState="green", 0 failed). ` +
    `Ne touche JAMAIS au code de production ; teste le comportement, pas l'implémentation.\n` +
    `Fichiers d'impl : ${JSON.stringify(green.implFiles)}\nBRIEF:\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:test-writer', schema: TESTS, model: 'sonnet' },
  )
  if (!tests || tests.skipped) throw new Error('test-writer : aucun test produit en mode test')

  phase('Validate')
  const verdict = await agent(
    `Valide ces tests contre le BRIEF et le rubric (1 critère = 1 test nommé portant son id ; cas limites EP+BVA ; ` +
    `FIRST/AAA/comportement ; anti-patterns tautologie/sur-mock/couplage). État attendu : VERT (le code existe déjà).\n` +
    `BRIEF:\n${briefJson}\nFichiers de test:\n${JSON.stringify(tests.testFiles)}` + iso,
    { agentType: 'scd-spec-dev:test-validator', schema: TEST_VERDICT, model: 'opus' },
  )
  if (verdict && verdict.verdict === 'gaps') {
    const blocking = (verdict.gaps || []).filter((g) => g.severity === 'bloquant')
    if (blocking.length) log(`⚠ ${blocking.length} gap(s) bloquant(s) sur les tests test-after — remontés, on poursuit vers la ceinture.`)
  }
} else if (mode === 'observé') {
  phase('Green')
  green = await agent(
    `Mode OBSERVÉ (pas de test automatisé possible). Implémente le ticket ${ticket} d'après ses critères, de façon à satisfaire ` +
    `la preuve observable attendue. PROUVE que le code s'intègre (build/typecheck/lint/run selon ce qui existe) et capture la sortie dans \`integration\`. ` +
    `La preuve observable DÉDIÉE par critère est le travail du verifier en aval — toi, tu prouves l'intégration. Reste dans les \`files[]\`. ` +
    `INTERDICTION de tout escape-hatch.\nBRIEF:\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:implementer', schema: GREEN, model: 'sonnet' },
  )
  if (!green || (!green.integration && (!green.implFiles || !green.implFiles.length))) {
    return { ticket, changeDir, status: 'blocked-impl', mode, green, worktreeDir: wtDir }
  }
} else {
  // aucun — spike jetable : impl exploratoire, aucune exigence de test ni de vérif observable.
  phase('Green')
  green = await agent(
    `Mode AUCUN (spike jetable). Produis le code exploratoire répondant à la question du ticket ${ticket}. ` +
    `Aucune exigence de test. Signale que c'est un spike (spike:true) — s'il est conservé, il ré-entrera dans le cycle en mode concret.\n` +
    `BRIEF:\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:implementer', schema: GREEN, model: 'sonnet' },
  )
  if (!green) {
    return { ticket, changeDir, status: 'blocked-impl', mode, green: null, worktreeDir: wtDir }
  }
}

const implFiles = (green && green.implFiles) || []
const testFiles = (tests && tests.testFiles) || []

// La CEINTURE verify-time est le rattrapage réel du reward hacking (doctrine 0-hook-write-time).
// tdd/test : le verifier rejoue les tests sur checkout propre + exige un git diff test vide.
// observé  : preuve observable par critère / humanCheckRequired. aucun : pas de verify (spike).
if (usesTests) {
  phase('Verify')
  verify = await agent(
    `Mode ${mode.toUpperCase()}. Applique la CEINTURE en CONTEXTE FRAIS (tu n'as pas écrit ce code) : ` +
    `pars d'un checkout PROPRE ; vérifie que \`${gitPrefix} diff\` sur les fichiers de test ${JSON.stringify(testFiles)} entre la base et la tête est VIDE ` +
    `(un test modifié pendant l'implémentation = neutralisation → échec, beltPassed.testsDiffEmpty=false) ; ` +
    `rejoue \`${brief.testCommand}\` et confirme 0 failed sur TA sortie réelle (beltPassed.failed=0). ` +
    (mode === 'test' ? `NB : en test-after les tests sont NEUFS (ajoutés après l'impl) — la ceinture confirme surtout leur VERT réel sur checkout propre. ` : ``) +
    `Renseigne \`criteria\` (correspondance test → critère) et \`allVerified\`.\n` +
    `Fichiers d'impl : ${JSON.stringify(implFiles)}\nBRIEF:\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:verifier', schema: VERIFY, model: 'opus' },
  )
  if (!verify || !verify.allVerified || (verify.beltPassed && (verify.beltPassed.failed !== 0 || verify.beltPassed.testsDiffEmpty === false))) {
    return { ticket, changeDir, status: 'blocked-verify', mode, verify, green, tests, worktreeDir: wtDir }
  }
} else if (mode === 'observé') {
  phase('Verify')
  verify = await agent(
    `Mode OBSERVÉ. Vérifie le ticket ${ticket} en CONTEXTE FRAIS (tu n'as pas écrit ce code). Pour CHAQUE critère SC-<NN><lettre> : ` +
    `si le critère est déjà exécutable (CI local, terraform plan/apply, script one-shot, requête), RÉ-EXÉCUTE-le et capture la sortie (evidence) ; ` +
    `sinon joue la vérification observable dédiée. Ce que tu ne PEUX PAS constater par exécution (rendu visuel, effet externe, ressenti UX) → ` +
    `\`humanCheckRequired\` avec l'instruction exacte pour l'humain — ne coche JAMAIS un critère non réellement observé. ` +
    `allVerified=true si chaque critère a une preuve OU un humanCheckRequired documenté.\n` +
    `Fichiers d'impl : ${JSON.stringify(implFiles)}\nBRIEF:\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:verifier', schema: VERIFY, model: 'opus' },
  )
  if (!verify || !verify.allVerified) {
    return { ticket, changeDir, status: 'blocked-verify', mode, verify, green, worktreeDir: wtDir }
  }
  const hc = (verify.criteria || []).filter((c) => c && c.humanCheckRequired)
  log(`Vérif observé : ${verify.criteria ? verify.criteria.filter((c) => c && c.verified).length : 0} critère(s) prouvé(s)${hc.length ? ` · ${hc.length} à vérifier par un humain` : ''}`)
}

// -------------------------------------------------------------------------
// Quality gate (phase 7½) — DÉTERMINISTE, opt-in par check, advisory par défaut.
// No-op sans .claude/quality.json. quality-analyzer (lecture seule) → quality-fixer (autofix sûr,
// pas d'Edit) → re-analyze. blocking résiduel → le ticket échoue ; advisory résiduel → findings PR.
// -------------------------------------------------------------------------
phase('Quality')
let qualityAdvisory = []
const q1 = await agent(
  `Quality gate du ticket ${ticket}. Lis \`.claude/quality.json\` (possédé par le projet). ` +
  `ABSENT/illisible → la gate est un NO-OP : retourne { "gate": "skipped", "findings": [] } sans jouer aucun check, n'invente rien. ` +
  `Présent → joue chaque check sur le diff (fichiers d'impl : ${JSON.stringify(implFiles)}), capture la sortie réelle, évalue les seuils, ` +
  `classe pass/fail et blocking/advisory (sévérité du check, jamais ré-arbitrée), localise, note \`autofixable\` (autofix non nulle).\n` +
  `BRIEF (files/verifMode/criteres):\n${briefJson}` + iso,
  { agentType: 'scd-spec-dev:quality-analyzer', schema: QUALITY_ANALYSIS, model: 'sonnet' },
)
if (q1 && q1.gate === 'error') {
  return { ticket, changeDir, status: 'blocked-quality-config', mode, quality: q1, worktreeDir: wtDir }
}
if (q1 && q1.gate === 'ok') {
  let residual = q1
  const fixable = (q1.findings || []).filter((f) => f.status === 'fail' && f.autofixable)
  if (fixable.length) {
    const qf = await agent(
      `Quality gate — AUTOFIX SÛR UNIQUEMENT. Relis \`.claude/quality.json\` pour la commande \`autofix\` exacte de chaque checkId. ` +
      `Pour chaque finding en échec dont le check déclare une \`autofix\` non nulle : exécute-la (respecte scope.paths), puis RE-JOUE la \`cmd\` du check pour confirmer. ` +
      `GARDE-FOUS : jamais les tests (après chaque autofix, \`${gitPrefix} diff\` sur les tests DOIT rester vide, sinon \`git checkout --\` sur ces chemins et check non-autofixable) ; ` +
      `jamais .claude/quality.json ; jamais un escape-hatch. Un finding sans autofix reste résiduel à l'identique.\n` +
      `Findings du quality-analyzer:\n${JSON.stringify(q1.findings || [])}` + iso,
      { agentType: 'scd-spec-dev:quality-fixer', schema: QUALITY_FIX, model: 'haiku' },
    )
    if (qf && qf.testsUntouched === false) {
      return { ticket, changeDir, status: 'blocked-quality-tests-touched', mode, quality: q1, qualityFix: qf, worktreeDir: wtDir }
    }
    // Re-analyze après autofix : l'état résiduel fait autorité (blocking → échec, advisory → findings).
    residual = await agent(
      `Quality gate — RE-ANALYSE après autofix. Relis \`.claude/quality.json\` et RE-JOUE chaque check sur l'état courant du diff ` +
      `(fichiers d'impl : ${JSON.stringify(implFiles)}). Rends l'état résiduel réel (blockingFailures / advisoryFailures).\n` +
      `BRIEF (files/verifMode/criteres):\n${briefJson}` + iso,
      { agentType: 'scd-spec-dev:quality-analyzer', schema: QUALITY_ANALYSIS, model: 'sonnet' },
    ) || q1
  }

  // Escalade des échecs NON-autofixables (complexité, duplication, lint sans --fix, seuil manqué).
  // FAN-OUT DYNAMIQUE : un agent PAR check en échec (la liste vient de quality.json), en contexte
  // frais, qui DIAGNOSTIQUE et REMONTE les points à traiter — un correction_prompt si une édition de
  // code bornée résorbe le check, sinon applicable:false. Chaque check est routé vers SON agent DÉDIÉ
  // (quality-<id>, co-écrit par /scd-spec-dev:quality-agents et POSSÉDÉ par le projet — il porte les
  // instructions « comment traiter cette partie ») ; à défaut, le générique scd-spec-dev:quality-advisor.
  // Le champ `agent` vient du quality-analyzer, qui a vérifié la présence du fichier sur disque (le
  // script de workflow n'a pas d'accès disque). Producteur ≠ vérificateur : l'agent propose (lecture
  // seule), la proposition passe par le triage (review-validator) puis le fix-applier (Edit chirurgical,
  // re-vérifie), puis on RE-ANALYSE la gate. Le no-Edit reste vrai : c'est le fix-applier, sous triage.
  const adviceByCheck = new Map()
  const nonAutofix = (residual.findings || []).filter((f) => f.status === 'fail' && !f.autofixable)
  if (nonAutofix.length) {
    phase('Quality')
    const advices = (await parallel(nonAutofix.map((f) => () => {
      const dedicated = f.agent && /^quality-[a-z0-9][a-z0-9-]*$/.test(f.agent) ? f.agent : null
      return agent(
        `Agent de la quality gate pour le check "${f.checkId}" en échec sur le ticket ${ticket} (contexte frais, tu n'as pas écrit ce code). ` +
        (dedicated
          ? `Suis LES INSTRUCTIONS de ta partie (ton propre rôle) pour analyser et remonter les points à traiter. `
          : `DIAGNOSTIQUE et PROPOSE une correction adaptée, ou déclare-le non applicable ici. `) +
        `Relis l'entrée \`${f.checkId}\` de \`.claude/quality.json\` (cmd, seuil, intention), ancre-toi dans la sortie réelle et le diff (\`${gitPrefix} diff …\` sur ${JSON.stringify(implFiles)}). ` +
        `Si une édition de CODE DE PRODUCTION bornée, dans le périmètre du ticket, peut faire repasser le check → applicable:true + un correction_prompt AUTONOME et CHIRURGICAL. ` +
        `Sinon applicable:false + reason : couverture/seuil de tests → exige des tests neufs (le fix-applier ne touche JAMAIS les tests) ; ` +
        `seule issue = toucher un test/une config/quality.json → interdit ; refactor plus large que le ticket → à porter ailleurs. JAMAIS un escape-hatch. Au doute → non applicable.\n` +
        `Finding du quality-analyzer:\n${JSON.stringify(f)}\nBRIEF (files/verifMode/criteres/context):\n${briefJson}` + iso,
        { agentType: dedicated || 'scd-spec-dev:quality-advisor', schema: QUALITY_ADVICE, model: 'opus', phase: 'Quality', label: `quality:${f.checkId}${dedicated ? '' : '*'}` },
      ).then((advice) => ({ finding: f, advice }))
    }))).filter(Boolean)
    log(`Quality gate — escalade : ${nonAutofix.filter((f) => f.agent).length}/${nonAutofix.length} check(s) routé(s) vers un agent dédié (le reste → générique quality-advisor)`)
    for (const { finding, advice } of advices) if (advice) adviceByCheck.set(finding.checkId, advice)

    // Propositions applicables → findings mis en forme pour le triage adversarial existant.
    const qProposals = advices
      .filter(({ advice }) => advice && advice.applicable && advice.correction_prompt)
      .map(({ finding, advice }, i) => ({
        id: `quality-${finding.checkId || ('C' + (i + 1))}`,
        dimension: 'quality',
        severity: finding.severity || advice.severity || 'advisory',
        location: advice.location || (finding.locations && finding.locations[0]) || '',
        summary: `${finding.checkId} : ${advice.diagnosis || 'check de qualité en échec'}`,
        rationale: `Check déclaré par le projet dans .claude/quality.json, échec prouvé par la sortie de l'outil. ${advice.evidence || ''}`,
        correction_prompt: advice.correction_prompt,
      }))
    log(`Quality gate : ${nonAutofix.length} échec(s) non-autofixable(s) · ${qProposals.length} proposition(s) de correction · ${nonAutofix.length - qProposals.length} laissé(s) en finding`)

    if (qProposals.length) {
      // Triage adversarial : review-validator sait qu'un check DÉCLARÉ qui échoue est une exigence
      // (pas un goût), et rejette une proposition qui déborde du ticket ou n'est pas ancrée.
      phase('Quality')
      const qById = new Map(qProposals.map((f) => [f.id, f]))
      const qt = await agent(
        `Triage sceptique et adversarial de ces propositions de correction de qualité. Ce sont des ÉCHECS de checks DÉCLARÉS par le projet dans \`.claude/quality.json\` ` +
        `(faits outillés, pas des goûts) : un check \`blocking\` est une exigence. Pour chacune : REPRODUIS l'échec (lis la ligne citée, rejoue au besoin) et garde-la (decision:"apply") ` +
        `UNIQUEMENT si la correction est BORNÉE, SÛRE (ne touche ni test, ni config, ni quality.json, aucun escape-hatch) et RESTE DANS LE PÉRIMÈTRE du ticket. ` +
        `REJETTE (decision:"skip") ce qui déborde (refactor plus large que le ticket), n'est pas ancré dans la sortie de l'outil, ou est douteux. Au doute → skip. Chaque "apply" porte un correction_prompt autonome.\n` +
        `Propositions:\n${JSON.stringify(qProposals)}\nFichiers d'impl:\n${JSON.stringify(implFiles)}\nBRIEF:\n${briefJson}` + iso,
        { agentType: 'scd-spec-dev:review-validator', schema: TRIAGE, model: 'opus' },
      )
      const retained = ((qt && qt.decisions) || [])
        .filter((d) => d.decision === 'apply')
        .map((d) => {
          const src = qById.get(d.id) || {}
          return { id: d.id, dimension: 'quality', location: src.location, correction_prompt: d.correction_prompt || src.correction_prompt }
        })
      log(`Quality gate — triage : ${retained.length} correction(s) retenue(s) · ${qProposals.length - retained.length} rejetée(s)`)

      if (retained.length) {
        phase('Quality')
        const qapplied = await agent(
          `Applique EXACTEMENT ces corrections de qualité (rien d'autre), chirurgicalement — chaque édition ne touche que ce que son correction_prompt décrit. ` +
          `JAMAIS un fichier de test, JAMAIS une config d'outillage, JAMAIS un escape-hatch. Si un correction_prompt s'avère infondé une fois dans le code, rends-le notApplied avec le motif (ne force pas). ` +
          `Puis RE-VÉRIFIE selon le mode : ` +
          (usesTests
            ? `modes tdd/test → ré-exécute \`${brief.testCommand}\` (0 failed) ET \`${gitPrefix} diff\` sur les fichiers de test ${JSON.stringify(testFiles)} VIDE.`
            : `mode observé → rejoue la vérification observable pertinente, la preuve tient toujours.`) +
          `\nCorrections retenues:\n${JSON.stringify(retained)}\nBRIEF (verifMode/testCommand):\n${JSON.stringify({ verifMode: mode, testCommand: brief.testCommand })}` + iso,
          { agentType: 'scd-spec-dev:fix-applier', schema: APPLY, model: 'sonnet' },
        )
        const rv = qapplied && qapplied.reverify
        const reverifyOk = usesTests
          ? (rv && rv.failed === 0 && rv.testsDiffEmpty !== false)
          : !!(rv || (qapplied && qapplied.applied))
        if (!qapplied || !reverifyOk) {
          return { ticket, changeDir, status: 'blocked-quality-fix', mode, quality: residual, qualityFix: qapplied, green, verify, worktreeDir: wtDir }
        }
        log(`Quality gate — corrections appliquées : ${(qapplied.applied || []).length} · non appliquées : ${(qapplied.notApplied || []).length}`)
        // RE-ANALYSE après corrections : l'état résiduel final fait autorité pour la décision blocking.
        residual = await agent(
          `Quality gate — RE-ANALYSE après corrections adaptées. Relis \`.claude/quality.json\` et RE-JOUE chaque check sur l'état courant du diff ` +
          `(fichiers d'impl : ${JSON.stringify(implFiles)}). Rends l'état résiduel réel (blockingFailures / advisoryFailures).\n` +
          `BRIEF (files/verifMode/criteres):\n${briefJson}` + iso,
          { agentType: 'scd-spec-dev:quality-analyzer', schema: QUALITY_ANALYSIS, model: 'sonnet' },
        ) || residual
      }
    }
  }

  const s = residual.summary || {}
  if ((s.blockingFailures || 0) > 0) {
    return { ticket, changeDir, status: 'blocked-quality', mode, quality: residual, worktreeDir: wtDir }
  }
  // Les advisory résiduels ne passent PAS par le triage de code (ce sont des faits outillés) : ils
  // vont à la description de PR, enrichis du diagnostic de l'advisor (pourquoi non auto-corrigés).
  qualityAdvisory = (residual.findings || []).filter((f) => f.status === 'fail').map((f) => {
    const a = adviceByCheck.get(f.checkId)
    return a && !a.applicable && a.reason ? { ...f, advice: a.reason } : f
  })
  log(`Quality gate : ${(s.passed || 0)}/${(s.checks || 0)} check(s) au vert · ${qualityAdvisory.length} advisory résiduel(s)`)
} else {
  log(`Quality gate : ${q1 && q1.gate === 'skipped' ? 'no-op (pas de .claude/quality.json)' : 'indisponible'}`)
}

// Contexte de review résolu UNE fois pour les SIX reviewers de code (leur faire relire
// docs/architecture.md et les ADR serait six lectures redondantes). review-context cite, ne juge pas.
// Repli sûr si sauté : dossier vide, chaque reviewer a son mode dégradé.
phase('Context')
const dossier = await agent(
  `Collecte le DOSSIER DE CONTEXTE de review du ticket ${ticket} du change ${changeDir}, en contexte frais, ` +
  `pour que six reviewers de code n'aient pas à relire les mêmes documents. Résous : la table des invariants de ` +
  `\`docs/architecture.md\` (référent de l'architecture-reviewer — dis-le absent le cas échéant), le corps des ADR ` +
  `contraignant ce ticket (résumés), les décisions d'impl et le hors-périmètre (depuis context du BRIEF), les contrats ` +
  `d'interface, et les aides à la review (aids : skills locaux DISTILLÉS + serveurs MCP en POINTEUR ; \`.claude/review.json\` ` +
  `fait autorité, l'auto-détection complète). Cite (id + source), NE JUGE PAS, n'invente aucun champ.\n` +
  `Fichiers modifiés : ${JSON.stringify(implFiles)}\nBRIEF:\n${briefJson}` + iso,
  { agentType: 'scd-spec-dev:review-context', schema: REVIEW_CONTEXT, model: 'sonnet' },
)
const reviewCtx = {
  invariants: (dossier && dossier.invariants) || { source: null, rules: [] },
  adr: (dossier && dossier.adr) || [],
  decisions: (dossier && dossier.decisions) || (brief.context && brief.context.decisions) || '',
  outOfScope: (dossier && dossier.outOfScope) || (brief.context && brief.context.outOfScope) || '',
  interfaces: (dossier && dossier.interfaces) || [],
  aids: (dossier && dossier.aids) || { skills: [], mcp: [] },
}
const reviewCtxJson = JSON.stringify(reviewCtx)
log(`Dossier de contexte : ${(reviewCtx.invariants.rules || []).length} invariant(s) · ${reviewCtx.adr.length} ADR · ${(reviewCtx.aids.skills || []).length} skill(s)/${(reviewCtx.aids.mcp || []).length} MCP${dossier ? '' : ' (agent sauté — dossier vide, replis dégradés)'}`)

// Fan-out : HUIT reviewers en PARALLÈLE, contexte frais (producteur ≠ vérificateur).
//  - 6 reviewers de code : jugent le DIFF contre le dossier de review.
//  - change-reviewer : le SEUL au niveau artefact — reçoit le dossier du CHANGE (pas le dossier de review),
//    autorisé à rouvrir le change (conflit specs vivantes, critère non testable, openspec validate --strict).
//  - integrity-reviewer : jumeau review-time du filet CI — scanne le diff (escape-hatches, chemins protégés).
// Raisonnement dur en opus ; style et scan mécanique en sonnet (levier de coût du fan-out).
phase('Review')
const CODE_REVIEWERS = [
  { dim: 'architecture',   agent: 'architecture-reviewer',   model: 'opus'   },
  { dim: 'securite',       agent: 'security-reviewer',       model: 'opus'   },
  { dim: 'error-handling', agent: 'error-handling-reviewer', model: 'opus'   },
  { dim: 'coverage',       agent: 'coverage-reviewer',       model: 'opus'   },
  { dim: 'conventions',    agent: 'conventions-reviewer',    model: 'sonnet' },
  { dim: 'proprete',       agent: 'cleanliness-reviewer',    model: 'sonnet' },
]
const noAutoTest = usesTests ? `` : ` — PAS de test automatisé attendu (c'est le contrat) : ne remonte JAMAIS « absence de test », juge par la vérif observable.`

const reviewThunks = CODE_REVIEWERS.map((r) => () =>
  agent(
    `Review la SEULE dimension ${r.dim} de l'implémentation du ticket ${ticket} (contexte frais, tu n'as pas écrit ce code). ` +
    `Récupère le diff via \`${gitPrefix} diff …\` sur ${JSON.stringify(implFiles)} (+ tests ${JSON.stringify(testFiles)} pour la couverture). Mode de vérif : ${mode}${noAutoTest} ` +
    `Charge SEULEMENT ta dimension, classe bloquant/suggestion, rédige un correction_prompt autonome. ` +
    `Le dossier porte \`aids\` (skills DISTILLÉS / MCP en pointeur) : consulte ceux pertinents à ta dimension.\n` +
    `Dossier de contexte:\n${reviewCtxJson}\nBRIEF:\n${briefJson}` + iso,
    { agentType: `scd-spec-dev:${r.agent}`, schema: FINDINGS, model: r.model, phase: 'Review', label: `review:${r.dim}` },
  ).then((res) => ({ dim: r.dim, res })),
)

// change-reviewer : niveau artefact, reçoit le dossier du CHANGE, pas le dossier de review.
reviewThunks.push(() =>
  agent(
    `Review la SEULE dimension CHANGE du ticket ${ticket} (contexte frais). Tu es le SEUL reviewer au niveau artefact, ` +
    `autorisé à rouvrir le change OpenSpec : confronte le diff au change qu'il honore ET aux specs vivantes. ` +
    `Dossier du change : \`${changeDir}/\` (proposal.md, specs/** deltas ADDED/MODIFIED/REMOVED, design.md, + test-plan/security-review/ux s'ils existent). ` +
    `Fichier ticket : \`${ticketGlob}\`. Specs vivantes : \`openspec/specs/\`. Diff du ticket : \`${gitPrefix} diff …\` sur ${JSON.stringify(implFiles)}. ` +
    `Tu peux jouer \`openspec validate <change> --strict\`, \`openspec diff <change>\`, \`openspec show\`. ` +
    `BLOQUANT : conflit avec une capacité vivante (un ADDED qui redéclare, un MODIFIED/REMOVED sans cible vivante), critère non testable sur chemin critique, ` +
    `\`openspec validate --strict\` en échec. Flou de cadrage = suggestion. Le change a été relu par l'humain (1er geste) : ne rouvre pas une décision assumée, signale une incohérence RÉELLE. ` +
    `Classe bloquant/suggestion, rédige un correction_prompt autonome.\nBRIEF:\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:change-reviewer', schema: FINDINGS, model: 'opus', phase: 'Review', label: 'review:change' },
  ).then((res) => ({ dim: 'change', res })),
)

// integrity-reviewer : jumeau review-time du filet CI. Nuance anti-faux-positif : ajouter un test NEUF
// en tdd/test est le contrat, jamais un finding — l'infraction est d'AFFAIBLIR un contrôle existant.
reviewThunks.push(() =>
  agent(
    `Review la SEULE dimension INTÉGRITÉ du ticket ${ticket} (contexte frais). Tu es le jumeau review-time du filet CI : ` +
    `dans les LIGNES AJOUTÉES du diff (\`${gitPrefix} diff …\` sur ${JSON.stringify(implFiles)} et ${JSON.stringify(testFiles)}, avec le statut ajouté/modifié/supprimé), cherche : ` +
    `(1) les escape-hatches — @ts-ignore, @ts-expect-error injustifié, as any, eslint-disable, .skip(/.only(, # noqa, # type: ignore, --no-verify ; ` +
    `(2) un chemin protégé touché pour AFFAIBLIR un contrôle — test existant dont on retire des assertions/commente un cas/supprime le fichier, ` +
    `workflow de CI relâché, config d'outillage (tsconfig/eslint/coverage/jest·vitest/pyproject/pre-commit/Makefile) dont on abaisse un seuil ou désactive une règle. ` +
    `BLOQUANT sauf DÉROGATION déclarée au ticket (tu la constates, tu ne l'inventes pas). Un jeton RETIRÉ (ligne supprimée) = nettoyage, pas une infraction. ` +
    `NUANCE CARDINALE : en mode ${mode}, ajouter un fichier de test NEUF est ${usesTests ? 'exactement le contrat — JAMAIS un finding' : 'sans objet'} ; vérifie le statut ajouté vs modifié avant de conclure. ` +
    `Classe bloquant/suggestion, rédige un correction_prompt autonome.\nBRIEF (verifMode/files/context):\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:integrity-reviewer', schema: FINDINGS, model: 'sonnet', phase: 'Review', label: 'review:integrity' },
  ).then((res) => ({ dim: 'integrity', res })),
)

const reviewResults = await parallel(reviewThunks)
// Fusion : ids préfixés par dimension pour éviter les collisions F-1/F-1 ; dimension forcée à celle du
// reviewer. Un reviewer sauté/échoué (null) est simplement absent.
const okReviews = reviewResults.filter(Boolean)
const findings = okReviews.flatMap(({ dim, res }) =>
  ((res && res.findings) ? res.findings : []).filter(Boolean).map((f, i) => ({
    ...f,
    id: `${dim}-${f.id || ('F' + (i + 1))}`,
    dimension: dim,
  })),
)
const REVIEWER_COUNT = reviewThunks.length
if (okReviews.length < REVIEWER_COUNT) {
  log(`⚠ ${REVIEWER_COUNT - okReviews.length} reviewer(s) sauté(s)/échoué(s) — dimensions manquantes possibles`)
}
const blockingCount = findings.filter((f) => f.severity === 'bloquant').length
log(`Review : ${findings.length} finding(s) (${blockingCount} bloquant·s) sur ${okReviews.length}/${REVIEWER_COUNT} dimensions`)

// Index des findings par id enrichi, pour rejoindre la `location` après le triage (review-validator
// peut ne renvoyer que id/decision/correction_prompt).
const findingById = new Map(findings.map((f) => [f.id, f]))

let triaged = { apply: [], skip: [] }
if (findings.length) {
  phase('Triage')
  const t = await agent(
    `Triage sceptique et adversarial de ces findings (les huit dimensions). Pour chacun : REPRODUIS-le en lisant la ligne citée, ` +
    `garde-le (decision:"apply") UNIQUEMENT s'il touche la CORRECTION (défaut réel : bug, vuln confirmée, invariant violé, erreur non gérée sur chemin critique, critère sans test en tdd/test) ` +
    `ou une EXIGENCE (ADR, docs/architecture.md, conventions écrites, hors-périmètre). REJETTE (decision:"skip") style/goût, spéculation, sur-engineering, hors-scope, doublon, non reproductible. ` +
    `En cas de doute → skip. Chaque "apply" porte un correction_prompt autonome.\n` +
    `Findings:\n${JSON.stringify(findings)}\nFichiers d'impl:\n${JSON.stringify(implFiles)}\nBRIEF:\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:review-validator', schema: TRIAGE, model: 'opus' },
  )
  const decisions = (t && t.decisions) || []
  triaged = {
    apply: decisions.filter((d) => d.decision === 'apply').map((d) => {
      const src = findingById.get(d.id) || {}
      return { id: d.id, dimension: d.dimension || src.dimension, location: src.location, correction_prompt: d.correction_prompt || src.correction_prompt }
    }),
    skip: decisions.filter((d) => d.decision === 'skip'),
  }
  log(`Triage : ${triaged.apply.length} à appliquer · ${triaged.skip.length} rejetés`)
} else {
  log('Aucun finding — triage sauté.')
}

if (triaged.apply.length) {
  phase('Apply')
  const applied = await agent(
    `Applique EXACTEMENT ces findings retenus (rien d'autre), chirurgicalement — chaque édition ne touche que ce que son correction_prompt décrit. ` +
    `JAMAIS un fichier de test, JAMAIS un escape-hatch. Si un correction_prompt s'avère infondé une fois dans le code, rends-le notApplied avec le motif (ne force pas). ` +
    `Puis RE-VÉRIFIE selon le mode : ` +
    (usesTests
      ? `modes tdd/test → ré-exécute \`${brief.testCommand}\` (0 failed) ET \`${gitPrefix} diff\` sur les fichiers de test ${JSON.stringify(testFiles)} VIDE.`
      : `mode observé → rejoue la vérification observable pertinente, la preuve tient toujours.`) +
    `\nFindings retenus:\n${JSON.stringify(triaged.apply)}\nBRIEF (verifMode/testCommand):\n${JSON.stringify({ verifMode: mode, testCommand: brief.testCommand })}` + iso,
    { agentType: 'scd-spec-dev:fix-applier', schema: APPLY, model: 'sonnet' },
  )
  const rv = applied && applied.reverify
  const reverifyOk = usesTests
    ? (rv && rv.failed === 0 && rv.testsDiffEmpty !== false)
    : !!(rv || (applied && applied.applied))
  if (!applied || !reverifyOk) {
    return { ticket, changeDir, status: 'blocked-after-fix', mode, applied, triaged, green, verify, worktreeDir: wtDir }
  }
  log(`Corrections appliquées : ${(applied.applied || []).length} · non appliquées : ${(applied.notApplied || []).length}`)
}

phase('Record')
const record = await agent(
  `Enregistre la progression du ticket ${ticket}. Tu es DÉJÀ sur la branche dédiée \`${branchInfo.branch}\` ` +
  `(créée en phase Branch${wtDir ? `, checkoutée dans le worktree` : ``}) — n'en crée aucune autre, ne change pas de branche. ` +
  `Fichier ticket : ` + (wtDir ? `\`${wtDir}/${ticketGlob}\`` : `\`${ticketGlob}\``) + `. ` +
  `Coche ([ ] → [x]) les critères satisfaits — leurs ids : ${JSON.stringify((brief.criteres || []).map((c) => c.id))} — et rien d'autre. ` +
  `Vérifie \`${gitPrefix} branch --show-current\` = \`${branchInfo.branch}\` (sinon STOP, stopped:true). ` +
  `Index sélectif (impl + fichier ticket, jamais git add -A), un commit par tranche observable si possible, message court au scope du ticket. Jamais --no-verify. ` +
  `Fichiers d'impl modifiés : ${JSON.stringify(implFiles)}` + iso,
  { agentType: 'scd-spec-dev:progress-recorder', schema: RECORD, model: 'haiku' },
)
// Filet déterministe : la branche portant les commits DOIT être celle posée par branch-setup.
if (record && record.branch && record.branch !== branchInfo.branch) {
  return {
    ticket, changeDir, status: 'blocked-branch-drift',
    expectedBranch: branchInfo.branch, recordedBranch: record.branch,
    note: `progress-recorder a commité sur ${record.branch} au lieu de ${branchInfo.branch} — PR non ouverte.`,
    record, worktreeDir: wtDir,
  }
}
if (record && record.stopped) {
  return { ticket, changeDir, status: 'blocked-record', record, note: 'progress-recorder s\'est arrêté (mauvaise branche)', worktreeDir: wtDir }
}

// Preuve d'exécution pour la description (0 failed / diff test vide, ou preuve observable).
const proof = usesTests
  ? (verify && verify.beltPassed ? verify.beltPassed.evidence : (green.testState && green.testState.evidence))
  : (verify && verify.criteria ? verify.criteria.map((c) => `${c.id}: ${c.verified ? (c.evidence || 'vérifié') : (c.humanCheckRequired || 'non vérifié')}`).join('\n') : (green.integration && green.integration.output))
const humanChecks = (mode === 'observé' && verify && verify.criteria)
  ? verify.criteria.filter((c) => c && c.humanCheckRequired).map((c) => `${c.id} : ${c.humanCheckRequired}`)
  : []

// La description est un ARTEFACT DE REVIEW : juger le fonctionnel ET le code sans rouvrir les specs.
// Non bloquant : si le describer est sauté (budget) ou échoue, pr-author compose son corps de repli.
phase('Describe')
const canDescribe = !budget.total || budget.remaining() > 40_000
const desc = canDescribe
  ? await agent(
      `Compose la description de la PR du ticket ${ticket} du change ${changeDir}, pour un REVIEWER HUMAIN. Corps Markdown EN COUCHES : ` +
      `1) TL;DR (30 s : ce que le ticket livre, mode ${mode}, verdict vert/attente humaine) ; 2) Ce que ça livre (context.why, backréférence proposal/story, hors-périmètre) ; ` +
      `3) la MATRICE critère → test → statut (en observé : colonne « Preuve » = sortie capturée / humanCheckRequired) ; 4) Points à scruter ; ` +
      `5) <details> Ce que la review a décidé — findings appliqués ET rejetés avec motif ; 6) <details> Preuve d'exécution. ` +
      `Mesure le diff TOI-MÊME : \`${gitPrefix} diff --numstat <base>...<branche>\` — aucun chiffre inventé. ` +
      `N'écris PAS le bloc « PR EMPILÉE » (c'est pr-author). Lecture seule : aucun push, aucune PR.\n` +
      `Résumé:\n${JSON.stringify({
        ticket, changeDir,
        title: brief.title,
        branch: (record && record.branch) || branchInfo.branch,
        base: base || branchInfo.base,
        worktreeDir: wtDir || undefined,
        verifMode: mode,
        criteres: brief.criteres,
        testsByCriterion: tests.testsByCriterion,
        testFiles, implFiles,
        context: brief.context,
        proof,
        humanCheckRequired: humanChecks,
        findingsApplied: triaged.apply,
        findingsRejected: triaged.skip,
        qualityAdvisory,
        testCommand: brief.testCommand,
        checked: record ? record.checked : [],
        commits: record ? record.commits : [],
      })}` + iso,
      { agentType: 'scd-spec-dev:pr-describer', schema: PR_BODY, model: 'opus' },
    )
  : null
const described = desc && typeof desc.body === 'string' && desc.body.trim() ? desc : null
if (!canDescribe) log('Description riche sautée (budget) — pr-author composera le corps de repli.')
else if (described) log(`Description composée (${described.title})`)
else log('Description non produite — corps de repli de pr-author.')

phase('PR')
const pr = await agent(
  `Publie la PR du ticket ${ticket} du change ${changeDir}. Détecte la plateforme (gh/glab), pousse la branche ` +
  `\`${(record && record.branch) || branchInfo.branch}\` (\`${gitPrefix} push -u origin <branche>\`, jamais --force sec). ` +
  (described
    ? `Publie TEL QUEL le { title, body } fourni (tu es le publieur, pas l'auteur — ne réécris ni ne résume ; seule addition permise : le bloc « PR EMPILÉE » en tête s'il y a lieu). Écris le corps via un heredoc QUOTÉ et passe-le en --body-file/--description. `
    : `Aucune description fournie : compose ton corps de REPLI minimal (titre au scope, ce que le ticket livre + la preuve) et signale-le. `) +
  `ANTI-ORPHELINAGE : base (\`${base || branchInfo.base}\`) = branche par défaut → PR READY (stacked:false). ` +
  `base ≠ branche par défaut (EMPILÉE) → ouvre en DRAFT, labels \`stacked\`+\`needs-sync\` (best-effort), préfixe le bloc d'avertissement « ne pas merger directement, attendre la base puis /scd-spec-dev:sync » (stacked:true, state:draft). ` +
  (wtDir
    ? `\n\nMode WORKTREE : la branche est checkoutée dans \`${wtDir}\`. Fais TOUT git local via \`git -C "${wtDir}" …\`. ` +
      `NETTOYAGE — si ET SEULEMENT SI la PR est créée : \`git worktree remove "${wtDir}"\` puis \`git worktree prune\`, worktreeRemoved:true. ` +
      `Si la PR n'est PAS créée, CONSERVE le worktree (worktreeRemoved:false).`
    : ``) +
  `\nRésumé:\n${JSON.stringify({
    title: described ? described.title : undefined,
    body: described ? described.body : undefined,
    ticket, changeDir,
    branch: (record && record.branch) || branchInfo.branch,
    base: base || branchInfo.base,
    worktreeDir: wtDir || undefined,
    // Matériau du corps de REPLI (ignoré si body fourni).
    capability: described ? undefined : brief.title,
    criteres: described ? undefined : brief.criteres,
    proof: described ? undefined : proof,
    humanCheckRequired: described ? undefined : humanChecks,
    testCommand: described ? undefined : brief.testCommand,
  })}`,
  { agentType: 'scd-spec-dev:pr-author', schema: PR_RESULT, model: 'sonnet' },
)

// Nettoyage du worktree : en succès (PR créée), pr-author l'a supprimé ; sinon on le CONSERVE pour
// inspection humaine (le travail du ticket n'existe que là si le push n'a pas pu se faire).
const worktreeKept = wtDir && !(pr && pr.prUrl && pr.worktreeRemoved) ? wtDir : null

return {
  ticket, changeDir,
  status: 'done',
  mode,
  filesChanged: implFiles,
  testFiles,
  applied: triaged.apply.length,
  skipped: triaged.skip.length,
  blockingFindings: blockingCount,
  qualityAdvisory: qualityAdvisory.length,
  humanCheckRequired: humanChecks,
  checked: record ? record.checked : [],
  branch: (record && record.branch) || branchInfo.branch,
  base: base || branchInfo.base,
  worktree: useWorktree,
  worktreeDir: worktreeKept, // null si supprimé après succès ; chemin conservé sinon
  pr: pr && pr.prUrl ? { url: pr.prUrl, state: pr.state, stacked: pr.stacked, base: pr.base || base || branchInfo.base } : null,
}
