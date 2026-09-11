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
    { title: 'Preflight', detail: 'escalation-triage (§14) : un verdict par critère AVANT toute écriture — repair (id manquant → id suivant ; ou mode-mismatch : strategie-verif ré-invoqué en assertion active (b) route le critère vers un autre mode → consigné, jamais une réécriture du mode du ticket), proceed (ceinture + review arbitrent), escalate (deux lectures produit → blocked-arbitrage, code jamais écrit sur une mauvaise interprétation). Ne décide jamais le sens de la spec' },
    { title: 'Red', detail: 'test-writer : (tdd) 1 test nommé par critère AVANT le code, état ROUGE ; (test) tests écrits juste APRÈS Green, état VERT' },
    { title: 'Validate', detail: 'test-validator : (tdd · test) 1 critère = 1 test, cas limites, anti-tautologie' },
    { title: 'Green', detail: 'implementer : (tdd · test) implémente jusqu\'au vert sans toucher aux tests ; (observé) prouve l\'intégration ; (aucun) spike' },
    { title: 'Verify', detail: 'verifier : (tdd · test) CEINTURE — rejeu sur checkout propre + git diff test vide ; (observé) preuve observable / humanCheckRequired. §14 (c) : une passe de self-correction BORNÉE (une seule) si la ceinture est propre mais un critère reste inobservable par la stratégie test → tentée en observé (preuve montée ou humanCheckRequired) ; une ceinture violée n\'est JAMAIS self-corrigée' },
    { title: 'Quality', detail: 'quality-analyzer (localise + qualifie impl/test/mixed) → quality-fixer (autofix sûr, tests protégés par SNAPSHOT/RESTAURATION — jamais de git checkout : la gate ne détruit aucun contenu ; un autofix additif sur un test neuf est GARDÉ et audité par test-edit-validator, pas bloqué) → escalade des échecs non-autofixables : chaque check routé vers SON agent dédié quality-<id> (co-écrit par /scd-spec-dev:quality-agents, sinon générique quality-advisor) → triage → applier → re-analyze. L\'applier est le fix-applier générique (jamais les tests) ou, si quality.json déclare un applier DE PROJET, celui-ci — seul autorisé à renforcer les tests, ses éditions auditées en contexte frais par test-edit-validator (additivité rejouée + tests ajoutés jugés). blocking résiduel échoue le ticket, advisory → findings. No-op sans .claude/quality.json' },
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

// Triage d'escalade §14, en pré-flight (AVANT toute écriture). Un verdict par critère.
// escalations non vide → le run s'arrête en blocked-arbitrage sans écrire de code.
const ESCALATION_TRIAGE = {
  type: 'object',
  required: ['triage'],
  properties: {
    triage: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'verdict'],
        properties: {
          id: { type: 'string', description: 'id du critère (SC-<NN><lettre>)' },
          verdict: { type: 'string', description: 'repair | proceed | escalate' },
          kind: { type: 'string', description: 'id-missing | ambiguous-oracle | none | …' },
          reason: { type: 'string' },
          modeAssertion: {
            type: 'object',
            description: 'Assertion ACTIVE (§14 b) : strategie-verif ré-invoqué par critère. holds=true → le verifMode figé tient. holds=false → mode ré-dérivé différent, PORTÉ EN repair kind:mode-mismatch (consigné, jamais un changement silencieux ni une réécriture du mode du ticket)',
            properties: { holds: { type: 'boolean' }, reDerivedMode: { type: 'string', description: 'holds=false : le mode que strategie-verif rend pour ce critère (tdd|test|observé|aucun)' }, note: { type: 'string' } },
          },
          repair: {
            type: 'object',
            description: 'verdict=repair : la correction mécanique appliquée (ex. id manquant → id suivant)',
            properties: { field: { type: 'string' }, from: {}, to: {}, verifiable: { type: 'string' } },
          },
          arbitrage: {
            type: 'object',
            description: 'verdict=escalate : l\'arbitrage façonné en décision',
            properties: {
              question: { type: 'string' },
              readings: { type: 'array', items: { type: 'string' } },
              options: {
                type: 'array',
                items: { type: 'object', properties: { label: { type: 'string' }, consequence: { type: 'string' }, runWillDo: { type: 'string' } } },
              },
            },
          },
        },
      },
    },
    repairedCriteres: {
      type: 'array',
      description: 'Le tableau criteres COMPLET du BRIEF, réparations mécaniques appliquées (adopté tel quel par le workflow)',
      items: { type: 'object', properties: { id: { type: 'string' }, text: { type: 'string' }, done: { type: 'boolean' } } },
    },
    escalations: { type: 'array', description: 'Sous-ensemble triage verdict=escalate ; NON VIDE → blocked-arbitrage', items: { type: 'object' } },
    repairs: { type: 'array', description: 'Sous-ensemble triage verdict=repair', items: { type: 'object' } },
    summary: { type: 'string' },
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
    testsDiffAdditiveOnly: { type: 'boolean', description: 'modes tdd/test : true si le diff de test (après git add -N) est non vide mais strictement additif — aucune assertion/cas retiré, aucun .skip(/.only(/.todo( ajouté' },
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
      properties: {
        testsDiffEmpty: { type: 'boolean', description: 'true si le git diff des fichiers de test est réellement vide' },
        // Un diff de test non vide n'est PAS une neutralisation s'il est strictement ADDITIF : aucune
        // assertion ni aucun cas retiré, aucun fichier de test vidé/supprimé, aucun .skip(/.only(/.todo(
        // ajouté. Un fichier de test NEUF et des cas AJOUTÉS sont le contrat. Contrôlé sur `git diff` après
        // `git add -N` (les fichiers neufs deviennent des additions visibles). Seul un `true` prouvé
        // remplace l'exigence de diff VIDE (voir beltViolated).
        testsDiffAdditiveOnly: { type: 'boolean' },
        removedAssertions: { type: 'array', items: { type: 'string' }, description: 'assertions/cas retirés ou affaiblis — non vide ⇒ neutralisation' },
        addedNeutralizers: { type: 'array', items: { type: 'string' }, description: '.skip(/.only(/.todo( ajoutés — non vide ⇒ neutralisation' },
        failed: { type: 'integer' },
        evidence: { type: 'string' },
      },
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
    applier: { type: 'string', description: "applier du projet (quality-<slug>) déclaré en top-level `applier` de quality.json et vérifié présent sur disque, ou null → générique fix-applier" },
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
          locationsNature: { type: 'string', description: "impl | test | mixed — nature des locations confrontées aux testFiles du ticket ; route un échec localisé dans un test neuf au lieu de le bloquer" },
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
    // Fichiers de test dont l'autofix additif (lint/format/typage sur un test neuf du ticket, modes
    // tdd/test) a été GARDÉ, en attente d'audit par le test-edit-validator. Non vide ⇒ audit, jamais blocage.
    testsEdited: { type: 'array', items: { type: 'string' } },
    testsUntouched: { type: 'boolean', description: 'true ssi le contenu final de chaque test == son snapshot (testsEdited vide) — verdict honnête sur l\'état final, un test restauré compte comme intact' },
    // La SEULE anomalie de tests qui échoue le ticket : une restauration depuis le snapshot n'a pas
    // reproduit le contenu d'avant autofix. Plus jamais un simple git diff non vide.
    restoreFailed: { type: 'boolean' },
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
      properties: {
        mode: { type: 'string' },
        failed: { type: 'integer' },
        testsDiffEmpty: { type: 'boolean' },
        // Renseigné par un applier de PROJET autorisé à renforcer les tests : le diff de test
        // n'a RETIRÉ ni assertion ni cas, et n'a ajouté aucun neutralisant (.skip(/.only(…).
        // Seul un `true` prouvé remplace l'exigence de diff de test VIDE (voir reverifyOk).
        testsDiffAdditiveOnly: { type: 'boolean' },
        evidence: { type: 'string' },
      },
    },
  },
}

// Audit, en contexte frais, des éditions de test faites par un applier DE PROJET. Le verdict fait
// foi : il prime sur le `testsDiffAdditiveOnly` que l'applier a rendu sur son propre travail.
const TEST_EDIT_AUDIT = {
  type: 'object',
  required: ['verdict'],
  properties: {
    verdict: { type: 'string', description: 'ok | violation' },
    additive: { type: 'boolean', description: 'contrôles rejoués par le validateur, pas repris de l\'applier' },
    removedAssertions: { type: 'array', items: { type: 'string' } },
    addedNeutralizers: { type: 'array', items: { type: 'string' } },
    addedTests: {
      type: 'array',
      items: { type: 'object', properties: { file: { type: 'string' }, test: { type: 'string' }, checkId: { type: 'string' }, judgment: { type: 'string' } } },
    },
    weakTests: {
      type: 'array',
      items: { type: 'object', properties: { file: { type: 'string' }, test: { type: 'string' }, why: { type: 'string' } } },
    },
    evidence: { type: 'string' },
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
// Preflight — TRIAGE D'ESCALADE §14, par critère, AVANT toute écriture de code.
//   escalate (oracle ambigu) → blocked-arbitrage, rien n'est écrit sur une mauvaise interprétation ;
//   repair (mécanique : id manquant, OU mode-mismatch — assertion active (b) : strategie-verif
//     ré-invoqué par critère, un mode ré-dérivé ≠ figé sans étape 0 est consigné, jamais une
//     réécriture du mode du ticket) → appliqué/consigné au BRIEF en vol, visible au corps de PR ;
//   proceed → la ceinture verify-time + la review 8 dimensions restent l'arbitre (barre inchangée).
// -------------------------------------------------------------------------
phase('Preflight')
const triage = await agent(
  `Triage d'escalade §14 du ticket ${ticket}, en PRÉ-FLIGHT — aucun code n'est encore écrit. Pour CHAQUE critère du BRIEF, ` +
  `applique le test opérationnel : existe-t-il une réponse vérifiablement juste, atteignable SANS choisir entre deux lectures produit plausibles ? ` +
  `Trois verdicts — \`repair\` (anomalie mécanique dont la bonne réponse est vérifiable : id manquant/dupliqué → id stable suivant de la série SC-<NN><lettre> ; ou mode figé « ${mode} » contredit par la nature du critère → kind:mode-mismatch ; réparé/consigné en vol, ne bloque pas), ` +
  `\`proceed\` (rien d'anormal → la ceinture verify-time et la review 8 dimensions restent l'arbitre unique), ` +
  `\`escalate\` (deux lectures produit menant à des codes différents, rien ne tranche → le SEUL motif d'arrêt-pour-décision ; façonne l'arbitrage en décision : question + 2-3 lectures avec le code de chacune + ce que le run fera de la réponse). ` +
  `Assertion de mode ACTIVE (§14 b) : ré-invoque le skill \`strategie-verif\` (outil Skill) par critère et applique son arbre à la nature du critère SEUL — son étape 0 (oracle ambigu) EST le discriminant d'escalate ; un mode rendu ≠ « ${mode} » sans porte d'étape 0 est un \`repair\` kind:mode-mismatch (renseigne modeAssertion.reDerivedMode, consigné, le critère poursuit — le verifier remontera humanCheckRequired si besoin). ` +
  `Tu ne décides JAMAIS le sens de la spec, tu ne changes JAMAIS le mode DU TICKET (« ${mode} » reste figé — tu assertes par critère, tu ne réécris pas la décision de décomposition). ` +
  `Retourne \`repairedCriteres\` (le tableau criteres COMPLET, ids réparés) et \`escalations\` (le sous-ensemble escalate, vide dans le cas nominal).\nBRIEF:\n${JSON.stringify(brief)}` + iso,
  { agentType: 'scd-spec-dev:escalation-triage', schema: ESCALATION_TRIAGE, model: 'opus' },
)
if (triage && Array.isArray(triage.escalations) && triage.escalations.length) {
  // Ambiguïté d'oracle : on s'arrête AVANT d'écrire. La branche existe (posée en amont), aucun code n'y est.
  return { ticket, changeDir, status: 'blocked-arbitrage', mode, arbitrage: triage.escalations, triage, brief, worktreeDir: wtDir }
}
if (triage && Array.isArray(triage.repairedCriteres) && triage.repairedCriteres.length) {
  brief.criteres = triage.repairedCriteres // réparations mécaniques adoptées avant de sérialiser le BRIEF pour l'aval
}
const preflightRepairs = (triage && Array.isArray(triage.repairs)) ? triage.repairs : []
if (preflightRepairs.length) log(`Preflight : ${preflightRepairs.length} réparation(s) mécanique(s) appliquée(s) au BRIEF (visible au corps de PR)`)

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
      `INTERDICTION d'affaiblir les fichiers de test ${JSON.stringify(tests.testFiles)} — les tests du test-writer sont l'acquis. À la fin, exécute ` +
      `\`${gitPrefix} add -N ${tests.testFiles.join(' ')}\` (rend les fichiers neufs visibles) puis \`${gitPrefix} diff -U0 -- ${tests.testFiles.join(' ')}\` : ` +
      `il doit être VIDE (testsDiffEmpty=true) OU strictement ADDITIF (testsDiffAdditiveOnly=true) — aucune assertion ni aucun cas RETIRÉ, aucun fichier de test vidé/supprimé, aucun \`.skip(\`/\`.only(\`/\`.todo(\` ajouté. ` +
      `Si TON diff retire ou affaiblit un test, annule tes changements sur ces fichiers. ` +
      `INTERDICTION de tout escape-hatch (@ts-ignore, as any, eslint-disable, # noqa, .skip(, --no-verify). ` +
      `Montre la sortie réelle (testState.failed=0 uniquement si 0 failed).\nBRIEF:\n${briefJson}` + iso,
      { agentType: 'scd-spec-dev:implementer', schema: GREEN, model: 'sonnet' },
    )
    if (green && green.testState && green.testState.failed === 0 && (green.testsDiffEmpty || green.testsDiffAdditiveOnly)) break
    if (green) log(`Vert non atteint (failed=${green.testState ? green.testState.failed : '?'}, testsDiffEmpty=${green.testsDiffEmpty}, testsDiffAdditiveOnly=${green.testsDiffAdditiveOnly}) — retry ${gtry + 1}`)
  } while (++gtry < 3 && budget.remaining() > 40_000)

  if (!green || !green.testState || green.testState.failed !== 0) {
    return { ticket, changeDir, status: 'blocked-red', mode, green, tests, worktreeDir: wtDir }
  }
  if (!green.testsDiffEmpty && !green.testsDiffAdditiveOnly) {
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
    `Mode ${mode.toUpperCase()}. Applique la CEINTURE en CONTEXTE FRAIS (tu n'as pas écrit ce code). ` +
    `La ceinture attrape la NEUTRALISATION d'un test, pas l'ajout de tests — un fichier de test NEUF et des cas AJOUTÉS sont exactement le contrat. ` +
    `1) Rends les fichiers neufs visibles : \`${gitPrefix} add -N ${testFiles.join(' ')}\` (un fichier untracked est INVISIBLE à git diff sans ça). ` +
    `2) Lis \`${gitPrefix} diff -U0 -- ${testFiles.join(' ')}\` (base → tête). VIDE → beltPassed.testsDiffEmpty=true. ` +
    `Non vide → décide beltPassed.testsDiffAdditiveOnly : true SSI strictement additif — aucune assertion ni aucun cas RETIRÉ ou affaibli, aucun fichier de test vidé/supprimé, aucun \`.skip(\`/\`.only(\`/\`.todo(\` AJOUTÉ. ` +
    `Cite dans beltPassed.removedAssertions et beltPassed.addedNeutralizers ce que tu trouves ; l'un des deux non vide ⇒ additiveOnly=false = neutralisation → échec, remonté tel quel. Au doute → additiveOnly=false. ` +
    `3) Rejoue \`${brief.testCommand}\` et confirme 0 failed sur TA sortie réelle (beltPassed.failed=0). ` +
    `4) DÉFAIS l'intent-to-add : \`${gitPrefix} reset -q -- ${testFiles.join(' ')}\` — le \`add -N\` de l'étape 1 a mis les fichiers neufs dans l'index avec un blob VIDE ; le laisser piégerait tout \`checkout\`/\`restore\` aval (il ramènerait le blob vide, pas le contenu de travail). Rends l'arbre exactement comme trouvé. ` +
    `Renseigne \`criteria\` (correspondance test → critère) et \`allVerified\`.\n` +
    `Fichiers d'impl : ${JSON.stringify(implFiles)}\nBRIEF:\n${briefJson}` + iso,
    { agentType: 'scd-spec-dev:verifier', schema: VERIFY, model: 'opus' },
  )
  // §14 (c) — SELF-CORRECTION BORNÉE (UNE seule passe), et SEULEMENT si la ceinture est PROPRE.
  //   Une ceinture violée (failed≠0 ou diff de test NON additif) est un signal de neutralisation :
  //   JAMAIS maquillée, elle bloque tel quel. Le cas rattrapé est le critère INOBSERVABLE par la
  //   stratégie « test/tdd » (colibri : composant jamais monté, test qui grepe le source) alors que
  //   la ceinture est propre → on tente UNE fois la stratégie suivante, en mode observé (strategie-verif
  //   étape 3 : niveau test inatteignable → observé) : preuve observable montée, ou humanCheckRequired.
  //   Résout-en-vol ou escalade bon marché le blocked-verify de fin de run, sans toucher à la barre de sortie.
  // Un diff de test non vide n'est PAS une violation s'il est prouvé strictement ADDITIF (fichier neuf,
  //   cas ajoutés). Seul un diff qui RETIRE/affaiblit un test ou ajoute un neutralisant viole la ceinture.
  const beltViolated = (v) => !!(v && v.beltPassed && (v.beltPassed.failed !== 0 || (v.beltPassed.testsDiffEmpty === false && v.beltPassed.testsDiffAdditiveOnly !== true)))
  if (verify && !verify.allVerified && !beltViolated(verify)) {
    const unproven = (verify.criteria || []).filter((c) => c && !c.verified && !c.humanCheckRequired)
    if (unproven.length) {
      phase('Verify')
      const sc = await agent(
        `SELF-CORRECTION BORNÉE §14 (c) du ticket ${ticket} — UNE seule passe, AUCUNE boucle. La ceinture est PROPRE ` +
        `(0 failed, git diff test VIDE) mais ${unproven.length} critère(s) ne sont pas prouvés par la stratégie « ${mode} » : ` +
        `${unproven.map((c) => c.id).join(', ')}. Pour CHACUN, tente la stratégie SUIVANTE en mode OBSERVÉ — obtiens une ` +
        `PREUVE OBSERVABLE (monte le composant / ré-exécute le critère et capture la sortie réelle), ou déclare un ` +
        `\`humanCheckRequired\` avec l'instruction exacte pour l'humain. Tu ne touches à AUCUN fichier de test (la ceinture ` +
        `est l'acquis, elle ne se rejoue pas), tu ne corriges pas le code, tu ne re-décides pas le mode du ticket. ` +
        `Ne coche JAMAIS un critère non réellement observé. Retourne le VERIFY des SEULS critères ci-dessus ` +
        `(chacun verified+evidence OU humanCheckRequired).\nFichiers d'impl : ${JSON.stringify(implFiles)}\n` +
        `BRIEF:\n${briefJson}\nCritères à rattraper:\n${JSON.stringify(unproven)}` + iso,
        { agentType: 'scd-spec-dev:verifier', schema: VERIFY, model: 'opus' },
      )
      if (sc && Array.isArray(sc.criteria)) {
        const byId = new Map((verify.criteria || []).map((c) => [c.id, c]))
        let resolved = 0
        for (const c of sc.criteria) if (c && c.id && (c.verified || c.humanCheckRequired)) { byId.set(c.id, c); resolved++ }
        verify.criteria = Array.from(byId.values())
        verify.allVerified = !verify.criteria.some((c) => c && !c.verified && !c.humanCheckRequired)
        verify.selfCorrected = { attempted: unproven.map((c) => c.id), resolved }
        log(`Self-correction §14 (c) : ${resolved}/${unproven.length} critère(s) rattrapé(s) — preuve observée ou humanCheckRequired${verify.allVerified ? '' : ' · reste non prouvé → blocked-verify'}`)
      }
    }
  }
  if (!verify || !verify.allVerified || beltViolated(verify)) {
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
  `classe pass/fail et blocking/advisory (sévérité du check, jamais ré-arbitrée), localise, note \`autofixable\` (autofix non nulle). ` +
  `Pour chaque échec, qualifie \`locationsNature\` (impl | test | mixed) en confrontant les fichiers cités aux fichiers de test du ticket ${JSON.stringify(testFiles)} (et convention *.test.*/*.spec.*/__tests__/tests/).\n` +
  `Reporte aussi l'\`applier\` du projet : le champ top-level \`applier\` de quality.json, mais SEULEMENT si \`.claude/agents/<applier>.md\` existe vraiment (Glob) ; sinon null.\n` +
  `BRIEF (files/verifMode/criteres):\n${briefJson}` + iso,
  { agentType: 'scd-spec-dev:quality-analyzer', schema: QUALITY_ANALYSIS, model: 'sonnet' },
)
if (q1 && q1.gate === 'error') {
  return { ticket, changeDir, status: 'blocked-quality-config', mode, quality: q1, worktreeDir: wtDir }
}
if (q1 && q1.gate === 'ok') {
  let residual = q1
  // APPLIER DE PROJET (optionnel). Le projet peut déclarer, en top-level `applier` de quality.json,
  // un applier À LUI — autorisé à RENFORCER les tests là où le fix-applier générique ne les touche
  // jamais. Motif : certains défauts ne sont réparables QUE dans les tests (un mutant qui survit
  // faute d'assertion), et les laisser ouverts vide la gate de son sens. Le droit est borné par
  // l'ADDITIVITÉ (aucune assertion ni aucun cas retiré, aucun neutralisant ajouté), que l'applier
  // prouve et rend dans `testsDiffAdditiveOnly` — sans quoi l'exigence de diff de test VIDE tient.
  // Le quality-analyzer l'a vérifié présent sur disque (le script n'a pas d'accès fichier).
  const qApplier = q1 && typeof q1.applier === 'string' && /^quality-[a-z0-9][a-z0-9-]*$/.test(q1.applier) ? q1.applier : null
  if (qApplier) log(`Quality gate — applier de projet déclaré : ${qApplier} (autorisé à renforcer les tests, additivité exigée)`)
  const fixable = (q1.findings || []).filter((f) => f.status === 'fail' && f.autofixable)
  // Findings autofixables LOCALISÉS DANS UN TEST NEUF du ticket (modes tdd/test) : leur autofix
  // (lint/format/typage) est une édition ADDITIVE légitime, pas une neutralisation. Le fixer la GARDE
  // au lieu de la détruire, et le test-edit-validator l'audite en contexte frais (juste en dessous).
  const testLocatedFixable = usesTests
    ? fixable.filter((f) => f.locationsNature === 'test' || f.locationsNature === 'mixed')
    : []
  if (fixable.length) {
    const qf = await agent(
      `Quality gate — AUTOFIX SÛR UNIQUEMENT. Relis \`.claude/quality.json\` pour la commande \`autofix\` exacte de chaque checkId. Préfixe git : \`${gitPrefix}\`. Mode : ${mode}. Fichiers de test du ticket : ${JSON.stringify(testFiles)}. ` +
      `AVANT tout autofix, SNAPSHOT chaque fichier de test existant hors de l'arbre (\`SNAP=$(mktemp -d)\` puis \`cp\` chemins préservés) — c'est ta seule voie de retour sûre, l'index/HEAD ramèneraient un blob vide ou la version d'avant le ticket. ` +
      `Pour chaque finding en échec dont le check déclare une \`autofix\` non nulle : exécute-la (respecte scope.paths), puis RE-JOUE la \`cmd\` du check pour confirmer. ` +
      `APRÈS les autofix, statue sur chaque fichier de test : inchangé → rien ; changé ET localisation d'un finding \`locationsNature\` test/mixed en mode tdd/test → GARDE la version corrigée (édition additive) et liste-le dans \`testsEdited\` ; changé pour toute autre raison → RESTAURE par \`cp\` depuis le snapshot (JAMAIS \`git checkout --\`/\`restore\`/\`rm\`) et rends ce check non-autofixable. ` +
      `Si une restauration ne reproduit pas le snapshot → \`restoreFailed: true\`. \`testsUntouched\` = état FINAL honnête (un test restauré compte comme intact). ` +
      `Jamais .claude/quality.json ; jamais un escape-hatch. Un finding sans autofix reste résiduel à l'identique.\n` +
      `Findings du quality-analyzer:\n${JSON.stringify(q1.findings || [])}` + iso,
      { agentType: 'scd-spec-dev:quality-fixer', schema: QUALITY_FIX, model: 'haiku' },
    )
    // La SEULE anomalie de tests qui échoue le ticket est une RESTAURATION ratée — plus jamais un
    // simple diff non vide (qui détruisait le contenu par `git checkout --`).
    if (qf && qf.restoreFailed === true) {
      return { ticket, changeDir, status: 'blocked-quality-tests-touched', mode, quality: q1, qualityFix: qf, worktreeDir: wtDir }
    }
    // AUDIT en contexte frais des autofix de test GARDÉS par le fixer (comme pour l'applier de projet).
    const fixerTestsEdited = (qf && Array.isArray(qf.testsEdited)) ? qf.testsEdited : []
    if (usesTests && fixerTestsEdited.length) {
      phase('Quality')
      const tev = await agent(
        `Audite les ÉDITIONS DE TEST gardées par le quality-fixer sur le ticket ${ticket} (contexte frais, tu n'as rien écrit). Ce sont des autofix de lint/format/typage sur des tests neufs du ticket. ` +
        `Rejoue TOI-MÊME les deux contrôles d'additivité sur \`${gitPrefix} diff -U0\` des fichiers ${JSON.stringify(fixerTestsEdited)} et cite leur sortie. ` +
        `ADMETS la seule exception d'une paire -/+ où l'assertion ET le cas restent identiques, seul le formatage ou une assertion de type inutile (\`as Foo\`) ayant changé — c'est le contrat d'un autofix additif, PAS un retrait. Un retrait RÉEL (assertion/cas disparu sans équivalent, \`.skip(\`/\`.only(\`/\`.todo(\` ajouté, fichier vidé) → violation. ` +
        `Un autofix ne doit RIEN ajouter comme cas/assertion : s'il en ajoute, c'est un hors-mandat → violation. Au doute → violation.\n` +
        `Rapport du fixer:\n${JSON.stringify(qf)}\nFindings de test qui l'ont mandaté (avec leur checkId):\n${JSON.stringify(testLocatedFixable)}` + iso,
        { agentType: 'scd-spec-dev:test-edit-validator', schema: TEST_EDIT_AUDIT, model: 'opus' },
      )
      if (!tev || tev.verdict !== 'ok') {
        return { ticket, changeDir, status: 'blocked-quality-test-edit', mode, quality: q1, qualityFix: qf, testEdit: tev, worktreeDir: wtDir }
      }
      log(`Quality gate — autofix de test gardé(s) audité(s) : additivité confirmée sur ${fixerTestsEdited.length} fichier(s)`)
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
        (qApplier
          ? `UNIQUEMENT si la correction est BORNÉE, SÛRE (ne touche ni config d'outillage, ni quality.json, aucun escape-hatch) et RESTE DANS LE PÉRIMÈTRE du ticket. ` +
            `Ce projet déclare un applier à lui (\`${qApplier}\`) AUTORISÉ à RENFORCER les tests : une correction qui AJOUTE un cas ou une assertion n'est donc PAS rejetée pour ce seul motif. ` +
            `En revanche REJETTE toute correction qui exigerait de RETIRER ou d'AFFAIBLIR une assertion, un cas ou un fichier de test, et toute correction qui viserait à faire monter un chiffre sans renforcer la détection (test qui exécute sans asserter). `
          : `UNIQUEMENT si la correction est BORNÉE, SÛRE (ne touche ni test, ni config, ni quality.json, aucun escape-hatch) et RESTE DANS LE PÉRIMÈTRE du ticket. `) +
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
          (qApplier
            ? `Tu PEUX renforcer les tests quand la correction l'exige — c'est ton contrat — mais SEULEMENT PAR AJOUT : aucune assertion, aucun cas, aucun fichier de test retiré ou affaibli, aucun \`.skip(\`/\`.only(\` ajouté. Prouve-le par le contrôle du diff de test et rends \`testsDiffAdditiveOnly\`. `
            : `JAMAIS un fichier de test, `) +
          `JAMAIS une config d'outillage, JAMAIS un escape-hatch. Si un correction_prompt s'avère infondé une fois dans le code, rends-le notApplied avec le motif (ne force pas). ` +
          `Puis RE-VÉRIFIE selon le mode : ` +
          (usesTests
            ? `modes tdd/test → ré-exécute \`${brief.testCommand}\` (0 failed) ET ` +
              (qApplier
                ? `\`${gitPrefix} diff\` sur les fichiers de test ${JSON.stringify(testFiles)} VIDE, ou — si tu les as renforcés — strictement ADDITIF, prouvé par la sortie du contrôle (\`testsDiffAdditiveOnly: true\`). Ne déclare JAMAIS \`testsDiffEmpty: true\` après avoir édité un test.`
                : `\`${gitPrefix} diff\` sur les fichiers de test ${JSON.stringify(testFiles)} VIDE.`)
            : `mode observé → rejoue la vérification observable pertinente, la preuve tient toujours.`) +
          `\nCorrections retenues:\n${JSON.stringify(retained)}\nBRIEF (verifMode/testCommand):\n${JSON.stringify({ verifMode: mode, testCommand: brief.testCommand })}` + iso,
          { agentType: qApplier || 'scd-spec-dev:fix-applier', schema: APPLY, model: 'sonnet' },
        )
        const rv = qapplied && qapplied.reverify
        // CEINTURE. Sans applier de projet, le diff de test doit être VIDE — inchangé. Avec un
        // applier déclaré, un diff de test non vide est accepté ICI à titre PROVISOIRE : la garde
        // n'est pas le `testsDiffAdditiveOnly` que l'applier rend sur son propre travail (producteur
        // = vérificateur, ce que le cycle interdit partout ailleurs), c'est l'audit en contexte frais
        // du test-edit-validator, juste en dessous, qui rejoue les contrôles lui-même.
        const reverifyOk = usesTests
          ? (rv && rv.failed === 0 && (rv.testsDiffEmpty !== false || !!qApplier))
          : !!(rv || (qapplied && qapplied.applied))
        if (!qapplied || !reverifyOk) {
          return { ticket, changeDir, status: 'blocked-quality-fix', mode, quality: residual, qualityFix: qapplied, green, verify, worktreeDir: wtDir }
        }
        log(`Quality gate — corrections appliquées : ${(qapplied.applied || []).length} · non appliquées : ${(qapplied.notApplied || []).length}`)

        // AUDIT DES ÉDITIONS DE TEST — producteur ≠ vérificateur jusqu'au bout. Dès qu'un applier DE
        // PROJET a travaillé en mode tdd/test, un agent en CONTEXTE FRAIS rejoue lui-même les
        // contrôles d'additivité sur le `git diff` réel (il ne croit pas le `testsDiffAdditiveOnly`
        // de la main qui a écrit) PUIS juge les tests AJOUTÉS : une tautologie ou une exécution sans
        // assertion satisfait l'additivité tout en ne détectant rien — c'est la fraude que le grep ne
        // voit pas. On l'invoque même si l'applier prétend n'avoir rien touché : c'est lui qui
        // constate le diff, pas l'applier (un champ omis ne doit pas ouvrir un angle mort).
        if (qApplier && usesTests) {
          phase('Quality')
          const tev = await agent(
            `Audite les ÉDITIONS DE TEST faites par l'applier \`${qApplier}\` sur le ticket ${ticket} (contexte frais, tu n'as rien écrit). ` +
            `NE CROIS PAS son \`testsDiffAdditiveOnly\` : rejoue TOI-MÊME les deux contrôles d'additivité sur \`${gitPrefix} diff -U0\` des fichiers de test ${JSON.stringify(testFiles)} ` +
            `(aucune assertion ni aucun cas RETIRÉ ; aucun \`.skip(\`/\`.only(\`/\`.todo(\` AJOUTÉ ; aucun fichier de test supprimé ou vidé), et cite leur sortie. ` +
            `Diff de test vide → verdict ok, tu t'arrêtes. Sinon JUGE chaque test AJOUTÉ : rejette tautologie, exécution sans assertion (toBeDefined/not.toThrow seuls), assertion sur un double au lieu du comportement, couplage à l'implémentation, et tout test qui ne se rattache à AUCUNE des corrections retenues. Au doute → violation.\n` +
            `Rapport de l'applier:\n${JSON.stringify(qapplied)}\nCorrections retenues (avec leur checkId):\n${JSON.stringify(retained)}` + iso,
            { agentType: 'scd-spec-dev:test-edit-validator', schema: TEST_EDIT_AUDIT, model: 'opus' },
          )
          if (!tev || tev.verdict !== 'ok') {
            return { ticket, changeDir, status: 'blocked-quality-test-edit', mode, quality: residual, qualityFix: qapplied, testEdit: tev, green, verify, worktreeDir: wtDir }
          }
          log(`Quality gate — éditions de test auditées : additivité confirmée · ${(tev.addedTests || []).length} test(s) ajouté(s) jugé(s) probants`)
        }

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
      ? `modes tdd/test → ré-exécute \`${brief.testCommand}\` (0 failed) ET \`${gitPrefix} add -N ${testFiles.join(' ')}\` puis \`${gitPrefix} diff -U0\` sur les fichiers de test VIDE (testsDiffEmpty=true), ou — tu n'as pas touché aux tests, mais le diff porte les tests du ticket — strictement ADDITIF (testsDiffAdditiveOnly=true : aucune assertion/cas retiré, aucun .skip(/.only(/.todo( ajouté).`
      : `mode observé → rejoue la vérification observable pertinente, la preuve tient toujours.`) +
    `\nFindings retenus:\n${JSON.stringify(triaged.apply)}\nBRIEF (verifMode/testCommand):\n${JSON.stringify({ verifMode: mode, testCommand: brief.testCommand })}` + iso,
    { agentType: 'scd-spec-dev:fix-applier', schema: APPLY, model: 'sonnet' },
  )
  const rv = applied && applied.reverify
  const reverifyOk = usesTests
    ? (rv && rv.failed === 0 && (rv.testsDiffEmpty !== false || rv.testsDiffAdditiveOnly === true))
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
// humanCheckRequired remonte à la PR en observé ET quand la self-correction §14 (c) en a produit
// (un critère test/tdd inobservable rattrapé en observé) — sinon un rattrapage resterait invisible au reviewer.
const humanChecks = (verify && verify.criteria && (mode === 'observé' || verify.selfCorrected))
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
      `3) la MATRICE critère → test → statut (colonne « Preuve » = sortie capturée / humanCheckRequired en observé, ou pour un critère rattrapé par la self-correction §14 c en test/tdd) ; 4) Points à scruter ; ` +
      `5) <details> Ce que la review a décidé — findings appliqués ET rejetés avec motif ; 6) <details> Preuve d'exécution. ` +
      (preflightRepairs.length ? `Si \`preflightRepairs\` est non vide, ajoute une ligne dans la couche 5 : les réparations mécaniques du triage §14 (ex. id de critère attribué), consignées, non bloquantes. ` : ``) +
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
        preflightRepairs,
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
