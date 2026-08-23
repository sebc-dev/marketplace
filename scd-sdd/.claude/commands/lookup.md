---
description: "Recherche web courte, en session : répond maintenant à une question factuelle et datée — version d'un outil, API courante, état d'un écosystème — en citant ses sources et en distinguant ce qui est établi de ce qui ne l'est pas. N'écrit aucun fichier. Pour une question large qui mérite un rapport, c'est /scd-sdd:research."
argument-hint: "[question — obligatoire]"
allowed-tools:
  - WebSearch
  - WebFetch
  - Read
---

## Contexte

Une phase du cycle bute régulièrement sur un fait qu'on ne tient pas de mémoire : la version
courante d'une action de CI, le nom de l'outil de SCA usuel pour cet écosystème, l'état d'une
API. Écrire ce fait au jugé est le pire des trois choix possibles — pire que chercher, et pire
que déclarer qu'on ne sait pas — parce qu'il ressort plus loin dans la chaîne sous une forme que
plus personne ne questionne.

Tu réponds **maintenant, en session, et tu n'écris rien**. La réponse tient en quelques lignes,
chaque affirmation porte sa source, et ce qui n'est pas établi est nommé comme tel.

Ratio : 20% humain / 80% AI (l'humain pose la question et arbitre ce qu'il en fait ; tu cherches
et tu qualifies).

## Règles absolues

- **Tu appliques le skill `research`, tu ne le résumes pas.** Sa méthode est **chargée** — voir
  `## Skill active`, qui dit ce qu'elle contient —, donc absente d'ici. Elle ne s'assouplit **pas**
  parce que la question est courte : c'est justement là qu'on est tenté de la sauter.
- **Tu n'écris aucun fichier.** Ni rapport, ni note, ni document du socle.
  Ta sortie est la session, point. C'est ce qui te distingue de `/scd-sdd:research`, et ton
  `allowed-tools` en est la preuve : tu n'as aucun outil d'écriture.
- **Tu annonces les murs avant de chercher, jamais après.** Une question dont la réponse est
  derrière un mur se reformule ; elle ne se contourne pas. Lesquels : au skill, § *Ce que la
  recherche ne peut pas atteindre*.
- **Une question trop large ne se rétrécit pas en silence.** Tu réponds sur ce que tu peux, tu
  dis ce que tu as laissé de côté, et tu renvoies vers `/scd-sdd:research`.

## Définitions

- **Établi** : porté par une source primaire identifiée et lisible. C'est le mot que la ligne
  `Non établi` du bloc de sortie nie ; ce qu'« établi » ne garantit **pas** — publié n'est pas
  répliqué — est au skill.
- **Question courte** : une question dont la réponse tient en quelques affirmations sourcées,
  sans arbitrage entre hypothèses concurrentes ni comparaison multi-critères. Au-delà, c'est un
  rapport.

## Processus

1. **Cadre la question** en une phrase, et **annonce-la**. Une question implicite se répond de
   travers : dis ce que tu as compris, et à quelle date la réponse doit être vraie. Aucun
   argument fourni → demande la question plutôt que d'en inventer une.

2. **Charge le skill `research`.** Tu ne recopies rien de son contenu dans ta réponse : tu
   l'appliques. Tout ce qui suit nomme **quand** tu fais quoi ; le **comment** est là-dedans.

3. **Annonce les murs** si la question en touche un (source derrière une connexion, dépôt privé,
   outil interne). Avant la recherche, pas après.

4. **Cherche**, selon le § *Chercher — ce qui ne bouge pas* du skill, dans l'ordre de ses points.
   La seule chose que cette commande ajoute : **tu t'arrêtes dès que la réponse tient**. Une
   question courte ne mérite pas vingt sources — et si elle les mérite, l'étape 7 le dira.

5. **Qualifie** ce que tu as trouvé sur les **deux axes** du § *Niveaux de preuve séparés, sources
   étiquetées* — niveau de preuve **et** étiquette de source, avec les mots exacts que le skill
   fige. Jamais l'un pour l'autre : le bloc de sortie porte les deux.

6. **Si les sources divergent**, applique le § *Hypothèses concurrentes, et auto-critique*. Pour une
   question courte, une divergence réelle est en soi le signal que la question relève de
   `/scd-sdd:research`.

7. **Rends la réponse**, courte, une source par affirmation (voir le bloc ci-dessous). Puis
   **contrôle la largeur** : s'il a fallu plus de quelques affirmations, ou si un arbitrage
   pointe, dis-le et renvoie vers `/scd-sdd:research`.

<report>
```
🔎 actions/checkout — version courante ?

Réponse    v5 est la version majeure courante ; v4 reste maintenue.
           [officiel · mesuré] Releases du dépôt actions/checkout — https://…
           « Latest release v5.0.0 »

Nuance     Le tag flottant `@v5` suit les correctifs de la majeure ; épingler par SHA
           est la recommandation de durcissement.
           [officiel · rapporté] Security hardening for GitHub Actions — https://…

Non établi Aucune date d'arrêt du support de v4 n'est publiée. Pas trouvé, pas déduit.

Murs       Aucun.
```

Une question trop large ajoute en pied :
`⚠ Question large — j'ai répondu sur <X> et laissé de côté <Y>. Pour un rapport : /scd-sdd:research`
</report>

## Ce que tu NE fais PAS

- Tu n'écris aucun fichier, nulle part — y compris pas de brouillon « pour ne pas perdre ».
- Tu ne modifies aucun document du socle ni aucune spec, et tu n'ouvres aucun candidat d'ADR.
- Tu ne composes pas de prompt de recherche approfondie et tu ne classes aucun rapport : c'est
  `/scd-sdd:research`, dans ses deux temps.
- Tu ne contournes aucun mur — pas de cache, pas de miroir, pas de reformulation d'URL pour
  passer sous un `robots.txt`.
- Tu ne lances aucune commande, tu n'installes rien, tu n'exécutes aucun outil « pour voir ».

## Skill active

- `research` — toute la méthode, et c'est l'inventaire de ce qui n'est **pas** écrit dans ce
  fichier : ancrage par citations verbatim, incertitude permise et absence de donnée comme
  résultat, hypothèses concurrentes, les deux vocabulaires fermés (niveaux de preuve · étiquettes
  de source), qualité de source et remontée au document d'origine, murs de la recherche web.
  Aucune `references/` : `prompt-research.md` sert à composer un prompt et à relire un rapport,
  deux choses que tu ne fais pas — tu ne la charges **jamais**, pas même un de ses blocs.

## À la fin

Rappelle en une ligne ce qui, dans ta réponse, **n'est pas établi** — c'est ce qu'un lecteur
pressé reprendra le premier.

Si la question s'est révélée trop large pour une réponse courte — plusieurs hypothèses à
départager, une comparaison multi-critères, un arbitrage qui va finir dans un ADR — dis-le
explicitement et propose :
« `/scd-sdd:research "<la question reformulée>"` — il composera un prompt de recherche
approfondie et le rapport restera dans `docs/research/`. »

Sinon, rends la main sans rien proposer : la question est répondue, il n'y a pas de suite.
