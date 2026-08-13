# Référence — Prompt Research (état au 6 août 2026, à revérifier)

Chargée par `/scd-sdd:research` seule, aux **deux** temps de son aller-retour, et **bloc par bloc**
(`DECISIONS.md` §D20) :

| Temps | Blocs à charger |
|---|---|
| **Aller** — composer le prompt | `<peremption>` `<obsolete>` `<stable>` `<gabarit>` `<completion>` |
| **Retour** — relire le rapport | `<peremption>` `<caveats>` |

`<peremption>` est le seul commun, et il se lit **en premier** aux deux temps : le reste du fichier
ne vaut que ce que sa date vaut. Charger le fichier entier au retour paierait la composition pour
rien. `lookup` ne le charge **jamais** — il répond en session, ne compose rien et ne classe rien.

Le `SKILL.md` porte ce qui **ne bouge pas** — ancrage par citations, incertitude permise, niveaux de
preuve, qualité de source. Ce fichier porte ce qui est **daté** : une doctrine d'éditeur et une
génération de modèles, l'une et l'autre volatiles de l'aveu même de leurs sources. Les deux sont
séparés pour que le second périme **visiblement**.

<peremption>

## La date en tête n'est pas décorative

État arrêté au **6 août 2026**, sur la base de deux rapports de recherche — état de l'art documenté
du prompting pour la recherche agentique, et fiabilité mesurée des systèmes de recherche
agentique — qui appliquent eux-mêmes le protocole décrit ici.

Avant de t'y fier :

- si la date remonte à **plus de six mois**, dis-le à l'humain avant de composer, et propose de
  revérifier les points marqués ⚠ — ce sont ceux qui dépendent d'une version de modèle ou d'API ;
- **ne cite aucun chiffre de ce fichier dans un document du socle.** Ils sont ici pour calibrer une
  relecture, pas pour fonder une décision : ce serait exactement le trajet interdit ;
- une contradiction constatée entre ce fichier et la documentation courante tranche **en faveur de
  la documentation courante**, et le fichier se corrige dans la foulée.

</peremption>

<obsolete>

## Ce qui ne se met plus dans un prompt

| Technique | Pourquoi elle tombe | Statut |
|---|---|---|
| « think step-by-step » générique | redondant quand le raisonnement adaptatif est actif ⚠ | obsolète |
| balise `<thinking>` manuelle par-dessus le thinking natif | second brouillon en conflit avec le brouillon interne, dégradation silencieuse ⚠ | obsolète |
| prefill sur le dernier tour assistant | erreur 400 à partir des modèles récents ⚠ | cassé |
| `budget_tokens` | erreur 400 à partir des modèles récents ; le contrôle passe par `effort` ⚠ | cassé |
| langage impératif massif (`CRITICAL` / `MUST` / `ALWAYS`) | provoque le sur-déclenchement d'outils et de sous-agents | contre-productif |
| répétition d'instructions en fin de prompt | calibré pour des modèles qui écoutaient mieux la fin du contexte | obsolète |
| gros document monolithique chargé en amont (`CLAUDE.md`) | remplacé par la divulgation progressive — skills et références chargés à la demande | anti-pattern |
| « prompts magiques » à gain chiffré sans protocole | rien à vérifier, donc rien à croire | folklore |

**Le chiffre à retenir sur le CoT manuel**, parce qu'il borne le débat : sur des modèles à
raisonnement, un rapport universitaire mesure des gains de l'ordre de **+3 %** pour le
« step by step » explicite, des **baisses** jusqu'à −13 % sur d'autres modèles, pour **+20 à 80 % de
temps** *(préprint non revu par les pairs — niveau : mesuré, source : préprint indépendant)*.

Le fil conducteur officiel, à garder en tête pendant toute la composition : *le meilleur prompt
n'est ni le plus long ni le plus complexe, c'est celui qui atteint le but de façon fiable avec le
minimum de structure nécessaire.*

</obsolete>

<stable>

## Ce qui reste : de la stratégie, pas de la mécanique

La bascule est là. On ne dit plus au modèle **comment réfléchir**, on lui dit **comment chercher**.

- **« Start wide, then narrow »** — cartographier le terrain avant d'aller au détail, plutôt que
  d'attaquer la première hypothèse plausible.
- **Arbre d'hypothèses tenu à jour**, et mis à jour explicitement quand une source le déplace.
- **Suivi de confiance par affirmation**, comme signal de classement (§ *SKILL.md* — jamais une
  probabilité).
- **Auto-critique régulière** : ce qui manque, ce qui a été supposé, quelle source n'a pas été lue.
- **Calibrage de l'effort** plutôt qu'injonction verbale : monter l'effort quand le raisonnement est
  bâclé, le baisser en cas de sur-déclenchement — au lieu d'ajouter des « think harder ».
- **Règles de scaling** — 1 agent pour un fait simple, 2 à 4 pour une comparaison directe, plus de
  10 pour une recherche complexe *(source : billet d'ingénierie de l'éditeur — niveau : rapporté)*.
- **XML structurel** : documents longs en tête, enveloppés ; la question à la fin. Pas de balise
  décorative sur un prompt court.

</stable>

<gabarit>

## Le gabarit de prompt

Six blocs. C'est le format qu'un rapport archivé dans `docs/research/` respecte — les rapports
déjà présents dans ce dossier sont des exemples légitimes à reprendre.

```markdown
## Question
<une question, fermée si possible, avec la décision qu'elle doit servir>

## Périmètre
Inclus : <ce qui compte>
Exclus : <ce qui ne compte pas — écrit, sinon la recherche s'étale>
Horizon : <à quelle date la réponse doit être vraie>

## Contraintes de sourcing
- source primaire exigée pour tout chiffre ; remonter au document d'origine
- étiqueter chaque source : officiel · préprint indépendant · benchmark d'éditeur · commercial
- séparer les niveaux de preuve : mesuré / rapporté / anecdotique / non étayé
- citer verbatim les passages qui portent une affirmation, et attribuer par affirmation
- l'absence de donnée est un résultat : l'écrire, ne pas l'approximer

## Hypothèses concurrentes
Quand les sources divergent, poser H1 / H2, ce qui les départagerait, et la confiance de chacune.
Ne pas trancher artificiellement.

## Format de rendu
TL;DR · Key Findings · Details · Recommendations · Caveats
Niveau de confiance par affirmation. Marqueurs `[À VÉRIFIER]` et `[INCERTAIN]` sur ce qui n'est
pas établi. Un tableau « chiffre circulant → source primaire trouvée ? → verdict » quand la
question porte sur des chiffres qui circulent.

## Ce qui ferait changer la recommandation
<les seuils : si tel fait est faux, ou si tel choix change, la réponse bascule>
```

Le dernier bloc est celui qu'on oublie, et c'est le plus rentable : sans lui, un rapport donne une
recommandation qu'on ne saura pas réviser quand le contexte bougera.

Affiche aussi, avec le prompt, **ce que la recherche ne pourra pas atteindre** — paywalls,
connexion, CAPTCHA, `robots.txt`, données privées (§ *SKILL.md*). Le dire après coup ne sert à rien.

</gabarit>

<caveats>

## Caveats de fiabilité — pour la relecture du rapport

Ce que la relecture critique doit savoir pour ne pas gober ce qui revient :

- **Aucun taux d'hallucination agrégé unique n'est publié** par l'éditeur : la factualité est mesurée
  par plusieurs protocoles distincts, avec comptage séparé des réponses correctes, incorrectes et
  des abstentions. Un rapport qui annonce « X % d'hallucination » cite donc soit un autre éditeur,
  soit rien. ⚠
- **Les chiffres d'éval interne ne sont pas reproductibles par un tiers** — gains multi-agents,
  multiplicateur de tokens, décompositions de variance. Ils sont *publiés*, ils ne sont pas
  *répliqués* : l'étiquette est « officiel », le niveau de preuve reste « rapporté ».
- **Les benchmarks d'éditeur sont auto-favorisants**, parfois entraînés sur les tâches qu'ils
  mesurent. Un classement en tête sur son propre benchmark n'est pas un résultat.
- **La confiance verbalisée est systématiquement sur-confiante** — signal de classement, jamais
  probabilité. Vaut aussi pour les niveaux de confiance que le rapport s'attribue à lui-même.
- **Les taux de fabrication de citations de la littérature** (fourchettes larges selon modèle et
  domaine) sont mesurés en **mémoire paramétrique, sans recherche web**. Les transposer à un mode
  de recherche avec vérification de citations est un hors-contexte : c'est le mécanisme qui se
  reprend, pas le chiffre.
- **Une source unique non recoupée reste unique** même si trois pages la répètent.

</caveats>

<completion>

## Avant de rendre le prompt

- [ ] la question sert une décision nommée, et le rapport saura dire ce qui la ferait changer
- [ ] périmètre **et exclusions** écrits ; horizon de validité donné
- [ ] contraintes de sourcing présentes : primaire exigée, sources étiquetées, niveaux de preuve
      séparés, citations verbatim, absence de donnée admise comme résultat
- [ ] hypothèses concurrentes demandées explicitement
- [ ] format de rendu et marqueurs `[À VÉRIFIER]` / `[INCERTAIN]` posés
- [ ] aucun déclencheur de la table `<obsolete>` n'a été écrit dans le prompt
- [ ] aucune injonction impérative massive, aucune instruction répétée
- [ ] les murs (paywall, connexion, CAPTCHA, `robots.txt`, données privées) ont été annoncés
- [ ] le fichier `docs/research/AAAA-MM-JJ-slug.prompt.md` est écrit et commité, `git add` scopé

</completion>
