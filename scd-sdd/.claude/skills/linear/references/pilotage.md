# Référence — Pilotage en lecture

Chargée par `/scd-sdd:linear-review` — **seule** —, avec les blocs `<auth>` et `<pilotage>` de
`references/api.md` et le `<contrat>` de `references/linear-md.md`.

Tout ce que cette référence décrit se **rend en session et meurt avec elle** : rien n'est persisté,
ni dans les fichiers, ni chez Linear. Les chiffres et les verbatims sont **arrêtés au 2026-08-10** et
viennent de la documentation officielle Linear, citée à l'endroit où chacun sert ; les requêtes qui
les mesurent vivent dans le bloc `<pilotage>` d'`api.md`.

<seuils>

## Le garde des 250 — deux seuils

Le plan Free plafonne à **250 issues non archivées**, et c'est un **mur dur**, pas une facturation
à l'usage — verbatim de la doc officielle (`linear.app/docs/billing-and-plans`, vérifié le
2026-08-10) : *« If you have over 250 issues, you will no longer be able to create new issues. »*

| Décompte | Verdict à rendre |
|---|---|
| < ~200 | rien à signaler — le décompte figure au rapport, c'est tout |
| ~200 à 249 | **avertir** : planifier une passe d'archivage (ou le passage à Basic) avant le mur |
| 250 | **mur atteint** : plus aucune issue ne peut être créée — le prochain push échouera sur toutes ses créations |

Les **archivées ne comptent pas**, et l'**auto-archivage** (réglage d'équipe, conseillé par la
checklist de `linear-setup`) est le mécanisme qui tient sous le plafond. Le comptage est
**workspace** — le plafond est workspace, pas équipe — et **à la demande, jamais en polling** : la
doc Linear le décourage explicitement.

</seuils>

<hygiene>

## L'hygiène — quatre contrôles, tous en lecture

| Contrôle | Ce qu'il cherche | Ce qui se rapporte |
|---|---|---|
| **terminées non archivées** | `state.type` ∈ `completed`/`canceled`, non archivées | candidates à l'archivage — c'est du plafond qui se libère ; si elles s'accumulent, l'auto-archivage est probablement inactif |
| **sans priorité** | `priority` = No priority sur des issues non terminées | à prioriser dans Linear (raccourci `P`) — sans priorité, une issue tombe en Later par défaut |
| **`started` dormantes** | `state.type` = `started`, `updatedAt` au-delà d'un cycle de revue (2-4 semaines, la cadence recommandée en solo) | du travail commencé qui n'avance plus : à finir, re-prioriser ou rendre au backlog — dans Linear |
| **contrepartie fichier disparue** | issue du miroir — **marqueur reconnu** en pied de description — dont la feature, le lot ou la fiche n'existe plus sur le disque | candidate à l'archivage, **rapportée et jamais touchée** — le miroir ne supprime ni n'archive rien |

Le quatrième contrôle est le seul qui croise le disque : `Glob`/`Read` sur `specs/` et
`docs/chantiers/`, en lecture seule. Une issue **sans marqueur** n'est pas du miroir : elle
appartient à l'humain et n'apparaît dans **aucun** contrôle.

</hygiene>

<rendu>

## Le rendu — Now / Next / Later, par priorité

Trois listes, dérivées du seul champ `priority` de Linear — l'arbitrage lui-même reste à l'humain,
chez Linear :

| Liste | Priorités | Lecture |
|---|---|---|
| **Now** | Urgent + High | ce qui se joue maintenant |
| **Next** | Medium | la suite proche |
| **Later** | Low + No priority | le reste — dont ce qui n'a jamais été priorisé |

**L'ossature du rendu n'est pas ici** : elle est le `<report>` **littéral** de
`/scd-sdd:linear-review`, que la charte §1 exige et que la commande émet tel quel. Ce bloc dit ce
qui se classe et selon quel champ ; la commande dit dans quel ordre et sous quels libellés ça
s'affiche — chaque fait à un seul endroit, alors que les deux sont chargés dans la même fenêtre
(§D35). Trois lignes du rapport n'ont pas d'autre source que la table ci-dessus : les libellés
`[Urgent + High]`, `[Medium]`, `[Low + No priority]`.

Les `identifier` Linear s'affichent **en session** — c'est légal, la vue meurt avec elle. Ils ne
s'écrivent dans **aucun** fichier du dépôt.

</rendu>
