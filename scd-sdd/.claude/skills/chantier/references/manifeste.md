# Référence — Le manifeste de contexte d'une fiche

Chargée par `/scd-sdd:pause` (qui l'écrit et la contrôle), `/scd-sdd:resume` (qui l'honore) et
`/scd-sdd:premortem` de cible `chantier` (qui l'honore pour lire, et l'applique pour écrire).
Ni `status`, ni `status-impl`, ni le hook n'en ont besoin : ils ne lisent que l'en-tête d'une fiche.

Sans règle, un manifeste pointant `src/legacy/router.ts` (2 400 lignes) reproduirait exactement le
problème que la fiche devait résoudre — on rechargerait tout, avec une étape de plus.

<regle_maitresse>

## La règle qui prime

Au moment où `pause` s'écrit, la session **a déjà lu** les gros fichiers. La distillation a donc
déjà eu lieu : il suffit de l'écrire.

> Une référence dit **où retrouver** quelque chose. Si ce qu'on veut est une **conclusion**, elle
> va dans `## Acquis`, et le fichier n'est jamais rechargé.

Applique-la avant de choisir une classe. Une ligne `à extraire` dont la réponse tient déjà dans
`Acquis` est une ligne de trop.

</regle_maitresse>

<classes>

## Les quatre classes

Chaque ligne du `## Contexte à charger` commence par sa classe, alignée, suivie du pointeur et de
la raison pour laquelle il compte.

| Classe | Ce que c'est | Ce que `resume` en fait |
|---|---|---|
| `à lire` | cible petite et centrale | `Read` intégral |
| `à extraire` | grosse cible + **ancre** nommée : section, symbole, plage, motif | `Grep` / `Read` par offset sur l'ancre seule |
| `à déléguer` | grosse cible + une **question**, quand aucune ancre ne circonscrit | sous-agent `chantier-reader`, en contexte isolé |
| `à situer` | existe, ne doit **pas** être chargé — PR, dump, dossier, conclusion déjà distillée | **jamais chargé**, mentionné pour qu'on sache que ça existe |

```markdown
## Contexte à charger
à lire      `specs/001-auth/spec.md` § FR-004 — le critère SHALL-4 (18 l.)
à lire      `test/auth/lockout.test.ts` — le périmètre d'édition (42 l.)
à extraire  `src/legacy/router.ts` › `class RateLimiter` — 2400 l., seule cette classe compte
à déléguer  `src/legacy/middleware.ts` — « dans quel ordre les handlers sont-ils résolus ? »
à situer    `docs/adr/0003-sessions.md` — contraint le compteur, conclusion déjà dans Acquis
à situer    PR #12 — le lot R1 mergé, ne pas relire
```

Le séparateur d'ancre est `›`. Une ancre est **vérifiable** : un titre de section, un nom de
symbole, une plage `L120-L180`, un motif greppable. « la partie sur les sessions » n'est pas une
ancre.

</classes>

<controles>

## Contrôles à l'écriture — `pause`

Deux contrôles, appuyés sur `wc -l` de chaque cible existante. C'est la raison pour laquelle
`pause` a `Bash(wc *)` dans ses `allowed-tools`.

**1. Ancre obligatoire au-delà de ~300 lignes.** Un chemin nu vers une cible plus grosse est
**refusé**. Trois issues, dans cet ordre de préférence :

1. distiller la conclusion dans `## Acquis` et déclasser la ligne en `à situer` ;
2. nommer une ancre → `à extraire` ;
3. formuler la question → `à déléguer`.

**2. Budget annoncé, jamais bloquant.** Somme les lignes des cibles `à lire`. Au-delà de
~400 lignes, **dis-le** et propose — sans refuser :

> Ce manifeste coûtera ~12k tokens à la reprise. Trois références peuvent être ancrées ou
> distillées dans `Acquis` : `src/auth/service.ts` (380 l.), `docs/prd.md` (210 l.),
> `test/helpers.ts` (160 l.). On réduit, ou on garde tel quel ?

Un manifeste gros est souvent le **symptôme** d'un chantier trop large : le signal reste utile même
quand on passe outre. Bloquer serait pire — ça bloquerait juste avant le `/clear`, au moment
précis où l'on veut sauver ce qu'on a.

Une cible **inexistante** (fichier supprimé, chemin faux) est signalée et retirée, pas conservée
« au cas où ».

</controles>

<lecture>

## Contrôles à la lecture — `resume`

Honore la classe de chaque ligne, sans exception : une ligne `à situer` ne se charge **pas**, même
si elle paraît utile. Si elle l'est vraiment, c'est la fiche qui était mal classée — dis-le,
change-la, et continue.

Puis **rends tes comptes**, en une ligne, avant de reprendre le travail :

```
Contexte chargé — 2 fichiers / 118 l. · 1 extraction (class RateLimiter) · 1 délégation · 2 situés
```

C'est ce compte rendu qui rend visible une mauvaise classification : sans lui, un manifeste qui
coûte trop cher ne se remarque jamais.

</lecture>

<delegation>

## La délégation — agent `chantier-reader`

Une reprise pose parfois une question **nouvelle** sur une grosse cible : celle qu'`Acquis` ne
pouvait pas anticiper et qu'aucune ancre ne circonscrit. Charger le fichier ruinerait le budget de
la session.

`resume` invoque alors l'agent `chantier-reader` avec **la cible et la question, rien d'autre**.
L'agent lit dans **son** contexte et ne rend qu'une réponse ancrée — citations courtes et numéros
de ligne. La session principale reçoit une vingtaine de lignes au lieu de deux mille quatre cents.

C'est le patron « contexte frais » que le plugin applique déjà à ses autres agents : celui qui lit
n'est pas celui qui travaille.

Deux limites à respecter :

- une ligne `à déléguer` **sans question** est invalide — c'est la question qui borne la réponse ;
- l'agent ne rend **jamais** le fichier, ni un résumé exhaustif : il répond, ou il dit qu'il n'a
  pas trouvé.

</delegation>
