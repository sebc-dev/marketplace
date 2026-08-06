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

- **Une affirmation sans citation est une affirmation du modèle.** Elle s'écrit comme telle —
  « de mémoire, non vérifié » — ou elle ne s'écrit pas. C'est la règle du skill `research`, et
  elle ne s'assouplit pas parce que la question est courte.
- **Tu remontes à la source primaire.** Un chiffre trouvé sur trois pages qui se citent l'une
  l'autre n'est pas recoupé : c'est **une seule** source, et tu le dis.
- **L'absence de donnée est un résultat.** « Aucune source primaire trouvée » est une réponse
  valable, et souvent la plus utile. Tu ne combles jamais par une approximation plausible.
- **Tu n'écris aucun fichier.** Ni rapport, ni note, ni ligne de journal, ni document du socle.
  Ta sortie est la session, point. C'est ce qui te distingue de `/scd-sdd:research`.
- **Tu ne modifies aucun document du projet** — pas `docs/stack.md`, pas un ADR, pas `CLAUDE.md`.
  Ce que tu trouves alimente une décision humaine ; il ne descend pas tout seul (`DECISIONS.md`
  §D23).
- **Tu annonces les murs avant de chercher, jamais après** : paywall, connexion, CAPTCHA,
  `robots.txt`, données privées. Une question dont la réponse est derrière l'un d'eux se
  reformule ; elle ne se contourne pas.
- **Une question trop large ne se rétrécit pas en silence.** Tu réponds sur ce que tu peux, tu
  dis ce que tu as laissé de côté, et tu renvoies vers `/scd-sdd:research`.

## Définitions

- **Établi** : porté par une source primaire identifiée et lisible. Un chiffre d'éval interne
  publié par un éditeur est établi comme *publié*, pas comme *répliqué* — écris la différence.
- **Question courte** : une question dont la réponse tient en quelques affirmations sourcées,
  sans arbitrage entre hypothèses concurrentes ni comparaison multi-critères. Au-delà, c'est un
  rapport.

## Processus

1. **Cadre la question** en une phrase, et **annonce-la**. Une question implicite se répond de
   travers : dis ce que tu as compris, et à quelle date la réponse doit être vraie. Aucun
   argument fourni → demande la question plutôt que d'en inventer une.

2. **Charge le skill `research`** — méthode, niveaux de preuve, étiquetage des sources, murs. Tu
   ne recopies rien de son contenu dans ta réponse : tu l'appliques.

3. **Annonce les murs** si la question les touche (source derrière une connexion, dépôt privé,
   outil interne). Avant la recherche, pas après.

4. **Cherche large, puis resserre.** Cartographie d'abord ce qui existe sur le sujet, puis vas
   au document d'origine — documentation officielle, dépôt, changelog, PDF académique, texte de
   loi — plutôt qu'aux pages qui les recopient.

5. **Extrais les passages verbatim** qui portent la réponse, puis fonde la réponse dessus.
   L'ordre compte : citer après avoir conclu revient à chercher une justification.

6. **Étiquette chaque source et sépare les niveaux de preuve** — officiel · préprint indépendant ·
   benchmark d'éditeur · commercial, et mesuré / rapporté / anecdotique / non étayé. Les deux
   axes, pas l'un pour l'autre.

7. **Si les sources divergent, ne tranche pas artificiellement** : pose H1, H2 et ce qui les
   départagerait. Une divergence entre deux sources officielles est une information sur le
   sujet.

8. **Rends la réponse**, courte, une source par affirmation (voir le bloc ci-dessous). Puis
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
- Tu n'écris aucune ligne de journal (voir ci-dessous).
- Tu ne composes pas de prompt de recherche approfondie et tu ne classes aucun rapport : c'est
  `/scd-sdd:research`, dans ses deux temps.
- Tu ne contournes aucun mur — pas de cache, pas de miroir, pas de reformulation d'URL pour
  passer sous un `robots.txt`.
- Tu ne présentes pas un consensus de pages secondaires comme un recoupement.
- Tu ne rends pas un niveau de confiance comme une probabilité : c'est un classement.
- Tu ne lances aucune commande, tu n'installes rien, tu n'exécutes aucun outil « pour voir ».

## Consigne au journal

**Aucune.** Tu ne joues aucune phase du cycle, et tu ne produis même aucun fichier : il n'y a
rien à consigner. Une recherche qui n'a rien persisté n'est pas un événement du cycle
(`DECISIONS.md` §D23). C'est de nature, pas un oubli.

Si ce que tu as trouvé mérite de survivre à la session, ce n'est pas une ligne de journal qu'il
faut : c'est un rapport, donc `/scd-sdd:research`.

## Skill active

- `research` — méthode de recherche : ancrage par citations verbatim, incertitude permise,
  hypothèses concurrentes, niveaux de preuve et étiquetage des sources, qualité de source, murs
  de la recherche web. Tu n'as **pas** besoin de `references/prompt-research.md` : elle sert à
  composer un prompt et à relire un rapport, deux choses que tu ne fais pas.

## À la fin

Rappelle en une ligne ce qui, dans ta réponse, **n'est pas établi** — c'est ce qu'un lecteur
pressé reprendra le premier.

Si la question s'est révélée trop large pour une réponse courte — plusieurs hypothèses à
départager, une comparaison multi-critères, un arbitrage qui va finir dans un ADR — dis-le
explicitement et propose :
« `/scd-sdd:research "<la question reformulée>"` — il composera un prompt de recherche
approfondie et le rapport restera dans `docs/research/`. »

Sinon, rends la main sans rien proposer : la question est répondue, il n'y a pas de suite.
