export const meta = {
  name: 'implement-parallel',
  description: 'Lance plusieurs tickets de review en parallèle réel via des worktrees git isolés. Les tickets aux fichiers disjoints tournent concurremment ; les tickets qui se recoupent (fichiers non disjoints ou dépendance) sont sérialisés en chaînes --base. Chaque ticket passe par le workflow implement-ticket (mode worktree).',
  whenToUse: "Depuis /scd-sdd:run-parallel, après résolution des tickets, de leurs bases et du plan de co-parallélisabilité (chaînes) par la commande.",
  phases: [
    { title: 'Fan-out', detail: 'Lance chaque chaîne indépendante en parallèle ; au sein d une chaîne, les tickets sont empilés séquentiellement (--base).' },
  ],
}

// ---------------------------------------------------------------------------
// Orchestrateur de parallélisme. Il ne fait AUCUNE I/O (déterminisme) : le plan
// — quels tickets, dans quelles chaînes, avec quelles bases — est calculé EN AMONT
// par /scd-sdd:run-parallel (qui a les outils git) et passé dans `args`.
//
// Deux couches, distinctes (cf. le design du plugin) :
//  - couche 1 (collision d'exécution) : réglée par le mode worktree de implement-ticket
//    — chaque ticket a son propre checkout, plus de HEAD/arbre partagé ;
//  - couche 2 (conflit de contenu : fichiers non disjoints) : réglée AVANT ici, par
//    la commande, qui sérialise les tickets qui se recoupent dans une même chaîne --base.
//    L'orchestrateur ne lance en parallèle QUE des chaînes indépendantes.
//
// args = {
//   featureDir: "specs/NNN-slug",
//   implPath: "<chemin absolu de implement-ticket.js>",   // bundlé plugin → lancé par scriptPath
//   chains: [
//     { id: "R2",     tickets: [ { ticket: "R2", base: null,               oldBase: null } ] },
//     { id: "R3->R4", tickets: [ { ticket: "R3", base: null,               oldBase: null },
//                             { ticket: "R4", base: "impl/slug-R3",      oldBase: "impl/slug-R3" } ] },
//   ],
// }
// Une chaîne de longueur 1 = un ticket indépendant. Une chaîne de longueur > 1 = des tickets
// empilés (chaque étape branche/PR depuis la précédente via `base`).
// ---------------------------------------------------------------------------

const featureDir = args && args.featureDir
const implPath = args && args.implPath
const refsDir = args && args.refsDir ? args.refsDir : undefined // forwardé à chaque implement-ticket
const chains = args && Array.isArray(args.chains) ? args.chains : null
if (!featureDir || !implPath || !chains || !chains.length) {
  throw new Error('args requis : { featureDir, implPath, chains: [{ id, tickets: [{ ticket, base?, oldBase? }] }] }')
}

phase('Fan-out')
log(`${chains.length} chaîne(s) indépendante(s) — ` +
    `${chains.map((c) => c.tickets.map((l) => l.ticket).join('→')).join(' · ')}`)

// Chaque chaîne s'exécute comme un thunk (barrière parallel) ; à l'intérieur, ses tickets
// sont enchaînés SÉQUENTIELLEMENT (empilement --base). On casse la chaîne au premier ticket
// non `done` : un ticket empilé ne peut pas partir d'une base qui n'a pas abouti.
const perChain = await parallel(
  chains.map((chain) => async () => {
    const results = []
    for (let i = 0; i < chain.tickets.length; i++) {
      const step = chain.tickets[i]
      const out = await workflow(
        { scriptPath: implPath },
        {
          featureDir,
          ticket: step.ticket,
          base: step.base || undefined,
          oldBase: step.oldBase || undefined,
          refsDir, // chemin absolu des références du skill (évite le find / des agents de review)
          worktree: true,
          prefetched: true, // le remote a été fetché une fois avant le fan-out (pas de fetch concurrents)
        },
      )
      results.push(out || { ticket: step.ticket, featureDir, status: 'blocked-unknown', note: 'workflow implement-ticket sans retour (skip/échec)' })
      if (!out || out.status !== 'done') {
        // stoppe la chaîne : les tickets empilés en aval sont désormais non lançables.
        for (let j = i + 1; j < chain.tickets.length; j++) {
          results.push({ ticket: chain.tickets[j].ticket, featureDir, status: 'blocked-upstream', note: `chaîne interrompue : ${step.ticket} non abouti (${out ? out.status : 'no-result'})` })
        }
        break
      }
    }
    return { chainId: chain.id, results }
  }),
)

// Aplatis en rapport par ticket.
const tickets = []
for (const c of perChain.filter(Boolean)) {
  for (const r of c.results) {
    tickets.push({
      ticket: r.ticket,
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

const done = tickets.filter((l) => l.status === 'done')
const blocked = tickets.filter((l) => l.status !== 'done')
log(`Terminé : ${done.length} ticket(s) done, ${blocked.length} bloqué(s).`)

return {
  featureDir,
  status: blocked.length === 0 ? 'all-done' : (done.length ? 'partial' : 'all-blocked'),
  chains: chains.length,
  done: done.length,
  blocked: blocked.length,
  tickets,
}
