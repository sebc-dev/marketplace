export const meta = {
  name: 'implement-parallel',
  description: 'Lance plusieurs lots de review en parallèle réel via des worktrees git isolés. Les lots aux fichiers disjoints tournent concurremment ; les lots qui se recoupent (fichiers non disjoints ou dépendance) sont sérialisés en chaînes --base. Chaque lot passe par le workflow implement-lot (mode worktree).',
  whenToUse: "Depuis /scd-implement:run-parallel, après résolution des lots, de leurs bases et du plan de co-parallélisabilité (chaînes) par la commande.",
  phases: [
    { title: 'Fan-out', detail: 'Lance chaque chaîne indépendante en parallèle ; au sein d une chaîne, les lots sont empilés séquentiellement (--base).' },
  ],
}

// ---------------------------------------------------------------------------
// Orchestrateur de parallélisme. Il ne fait AUCUNE I/O (déterminisme) : le plan
// — quels lots, dans quelles chaînes, avec quelles bases — est calculé EN AMONT
// par /scd-implement:run-parallel (qui a les outils git) et passé dans `args`.
//
// Deux couches, distinctes (cf. le design du plugin) :
//  - couche 1 (collision d'exécution) : réglée par le mode worktree de implement-lot
//    — chaque lot a son propre checkout, plus de HEAD/arbre partagé ;
//  - couche 2 (conflit de contenu : fichiers non disjoints) : réglée AVANT ici, par
//    la commande, qui sérialise les lots qui se recoupent dans une même chaîne --base.
//    L'orchestrateur ne lance en parallèle QUE des chaînes indépendantes.
//
// args = {
//   featureDir: "specs/NNN-slug",
//   implPath: "<chemin absolu de implement-lot.js>",   // bundlé plugin → lancé par scriptPath
//   chains: [
//     { id: "R2",     lots: [ { lot: "R2", base: null,               oldBase: null } ] },
//     { id: "R3->R4", lots: [ { lot: "R3", base: null,               oldBase: null },
//                             { lot: "R4", base: "impl/slug-R3",      oldBase: "impl/slug-R3" } ] },
//   ],
// }
// Une chaîne de longueur 1 = un lot indépendant. Une chaîne de longueur > 1 = des lots
// empilés (chaque étape branche/PR depuis la précédente via `base`).
// ---------------------------------------------------------------------------

const featureDir = args && args.featureDir
const implPath = args && args.implPath
const chains = args && Array.isArray(args.chains) ? args.chains : null
if (!featureDir || !implPath || !chains || !chains.length) {
  throw new Error('args requis : { featureDir, implPath, chains: [{ id, lots: [{ lot, base?, oldBase? }] }] }')
}

phase('Fan-out')
log(`${chains.length} chaîne(s) indépendante(s) — ` +
    `${chains.map((c) => c.lots.map((l) => l.lot).join('→')).join(' · ')}`)

// Chaque chaîne s'exécute comme un thunk (barrière parallel) ; à l'intérieur, ses lots
// sont enchaînés SÉQUENTIELLEMENT (empilement --base). On casse la chaîne au premier lot
// non `done` : un lot empilé ne peut pas partir d'une base qui n'a pas abouti.
const perChain = await parallel(
  chains.map((chain) => async () => {
    const results = []
    for (let i = 0; i < chain.lots.length; i++) {
      const step = chain.lots[i]
      const out = await workflow(
        { scriptPath: implPath },
        {
          featureDir,
          lot: step.lot,
          base: step.base || undefined,
          oldBase: step.oldBase || undefined,
          worktree: true,
          prefetched: true, // le remote a été fetché une fois avant le fan-out (pas de fetch concurrents)
        },
      )
      results.push(out || { lot: step.lot, featureDir, status: 'blocked-unknown', note: 'workflow implement-lot sans retour (skip/échec)' })
      if (!out || out.status !== 'done') {
        // stoppe la chaîne : les lots empilés en aval sont désormais non lançables.
        for (let j = i + 1; j < chain.lots.length; j++) {
          results.push({ lot: chain.lots[j].lot, featureDir, status: 'blocked-upstream', note: `chaîne interrompue : ${step.lot} non abouti (${out ? out.status : 'no-result'})` })
        }
        break
      }
    }
    return { chainId: chain.id, results }
  }),
)

// Aplatis en rapport par lot.
const lots = []
for (const c of perChain.filter(Boolean)) {
  for (const r of c.results) {
    lots.push({
      lot: r.lot,
      chain: c.chainId,
      status: r.status,
      branch: r.branch || null,
      base: r.base || null,
      pr: r.pr || null,
      worktreeDir: r.worktreeDir || null, // conservé si échec/bloqué, null si supprimé après succès
      note: r.note || null,
    })
  }
}

const done = lots.filter((l) => l.status === 'done')
const blocked = lots.filter((l) => l.status !== 'done')
log(`Terminé : ${done.length} lot(s) done, ${blocked.length} bloqué(s).`)

return {
  featureDir,
  status: blocked.length === 0 ? 'all-done' : (done.length ? 'partial' : 'all-blocked'),
  chains: chains.length,
  done: done.length,
  blocked: blocked.length,
  lots,
}
