export const meta = {
  name: 'implement-lot',
  description: 'Implémente un lot de review Rn en TDD : rouge → valide → vert → review → triage → apply → record. Un lancement = un lot.',
  whenToUse: "Après une gate analyze au vert de scd-feature-specs, pour implémenter un lot Rn de specs/NNN-feature/tasks.md.",
  phases: [
    { title: 'Prepare', detail: 'lot-briefer : parse le lot, pull les SHALL, détecte le test runner' },
    { title: 'Red', detail: 'test-writer : écrit les tests, confirme le rouge' },
    { title: 'Validate', detail: 'test-validator : 1 SHALL = 1 test, cas limites, conventions' },
    { title: 'Green', detail: 'implementer : implémente jusqu au vert, tests intacts' },
    { title: 'Review', detail: 'code-reviewer : 6 dimensions' },
    { title: 'Triage', detail: 'review-validator : triage sceptique adversarial' },
    { title: 'Apply', detail: 'fix-applier : applique les findings retenus, re-vérifie le vert' },
    { title: 'Record', detail: 'progress-recorder : branche de lot, coche tasks.md, commit' },
    { title: 'PR', detail: 'pr-author : pousse la branche, ouvre la PR ready avec description' },
  ],
}

// ---------------------------------------------------------------------------
// Schémas de handoff (JSON Schema). Chaque étape aval consomme un objet validé.
// ---------------------------------------------------------------------------

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
    note: { type: 'string' },
  },
}

// ---------------------------------------------------------------------------
// Orchestration. args = { featureDir: "specs/003-auth", lot: "R2" }.
// Tout accès disque/git se fait DANS les agents (l'orchestrateur n'a pas d'I/O).
// ---------------------------------------------------------------------------

const featureDir = args && args.featureDir
const lot = args && args.lot
if (!featureDir || !lot) {
  throw new Error('args requis : { featureDir: "specs/NNN-slug", lot: "Rn" }')
}
phase('Prepare')
const brief = await agent(
  `Prépare l'implémentation du lot ${lot} de ${featureDir}.\n` +
  `Lis ${featureDir}/tasks.md (isole le lot ${lot} : ses tâches Tn, backrefs _Requirements:_, ligne Fichiers:), ` +
  `${featureDir}/spec.md (extrais chaque SHALL EARS des FR/SC livrés par le lot), ${featureDir}/plan.md ` +
  `(contrats + étape de vérif), et tout ${featureDir}/acceptance/*.feature du lot. ` +
  `Détecte la commande de test et les conventions du projet. Retourne le brief structuré.`,
  { agentType: 'scd-implement:lot-briefer', schema: BRIEF, model: 'sonnet' },
)
if (!brief) throw new Error('lot-briefer : brief indisponible (agent skipped/failed)')
log(`Lot ${lot} : ${brief.shalls.length} SHALL · ${brief.files.length} fichiers · test: ${brief.testCommand}`)

phase('Red')
let tests = await agent(
  `Écris les tests du lot ${lot} — un test nommé par SHALL — puis exécute \`${brief.testCommand}\` ` +
  `et CONFIRME le rouge (échec pour la bonne raison, pas une erreur de compilation triviale).\n` +
  `Brief:\n${JSON.stringify(brief)}`,
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
    `Brief:\n${JSON.stringify(brief)}\nTests:\n${JSON.stringify(tests)}`,
    { agentType: 'scd-implement:test-validator', schema: TEST_VERDICT, model: 'opus' },
  )
  if (!verdict || verdict.ok) break
  log(`Tests à corriger (${verdict.gaps.length} gap(s)) — itération ${tries + 1}`)
  tests = await agent(
    `Corrige les tests du lot ${lot} selon ces gaps, ré-exécute \`${brief.testCommand}\`, reconfirme le rouge.\n` +
    `Gaps:\n${JSON.stringify(verdict.gaps)}\nTests actuels:\n${JSON.stringify(tests)}\nBrief:\n${JSON.stringify(brief)}`,
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
    `\`git diff -- ${tests.files.join(' ')}\` : il DOIT être vide, sinon annule tes changements sur ces fichiers. ` +
    `Montre la sortie réelle de la commande (passing=true uniquement si 0 failed).\n` +
    `Brief:\n${JSON.stringify(brief)}`,
    { agentType: 'scd-implement:implementer', schema: GREEN, model: 'sonnet' },
  )
  if (green && green.passing && green.testsUntouched) break
  if (green) log(`Vert non atteint (passing=${green.passing}, testsUntouched=${green.testsUntouched}) — retry ${gtry + 1}`)
} while (++gtry < 3 && budget.remaining() > 40_000)

if (!green || !green.passing) {
  return { lot, featureDir, status: 'blocked-red', green, tests, verdict }
}
if (!green.testsUntouched) {
  return { lot, featureDir, status: 'blocked-tests-modified', green, tests }
}

phase('Review')
const review = await agent(
  `Review l'implémentation du lot ${lot} (contexte frais, tu n'as pas écrit ce code). ` +
  `Diff sur ${JSON.stringify(green.diffFiles)}. Six dimensions : architecture, propreté, conventions, ` +
  `couverture, sécurité, gestion d'erreur. Classe bloquant/suggestion, propose un correction_prompt autonome.\n` +
  `Brief:\n${JSON.stringify(brief)}`,
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
    `Findings:\n${JSON.stringify(findings)}\nBrief:\n${JSON.stringify(brief)}\nFichiers d'impl:\n${JSON.stringify(green.diffFiles)}`,
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
    `(git diff sur les tests doit rester vide).\n` +
    `Corrections:\n${JSON.stringify(triaged.apply)}`,
    { agentType: 'scd-implement:fix-applier', schema: GREEN, model: 'sonnet' },
  )
  if (applied && applied.passing && applied.testsUntouched) {
    finalGreen = applied
  } else {
    return { lot, featureDir, status: 'blocked-after-fix', applied, triaged, green }
  }
}

phase('Record')
const record = await agent(
  `Prépare la branche du lot puis enregistre la progression du lot ${lot} de ${featureDir}. ` +
  `Si tu es sur la branche par défaut du repo (main/master), crée d'abord une branche de lot ` +
  `\`impl/<slug>-${lot}\` (git switch -c ; les changements non commités la suivent) ; sinon reste sur la branche courante. ` +
  `Puis coche les cases des tâches Tn implémentées et le lot dans ${featureDir}/tasks.md ([ ] → [x]), ` +
  `sans modifier autre chose, crée les commits (un par tâche observable si possible), et retourne la branche.\n` +
  `Tâches du lot:\n${JSON.stringify(brief.tasks)}`,
  { agentType: 'scd-implement:progress-recorder', schema: RECORD, model: 'haiku' },
)

phase('PR')
const base = args && args.base ? args.base : null
const pr = await agent(
  `Publie une PR "ready for review" pour le lot ${lot} de ${featureDir}. Détecte la plateforme (gh/glab), ` +
  `pousse la branche \`${record ? record.branch : ''}\` (git push -u, jamais --force), et crée la PR vers ` +
  (base ? `la base \`${base}\`` : `la branche de base par défaut du repo`) +
  ` avec un titre et une description structurée de l'implémentation.\n` +
  `Résumé:\n${JSON.stringify({
    lot,
    featureDir,
    branch: record ? record.branch : null,
    base,
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
  branch: record ? record.branch : null,
  pr: pr && pr.created ? { url: pr.url, number: pr.number, state: pr.state } : null,
}
