# Référence — Premortem : durcir le contrat par projection d'échec (`premortem`)

<role>
**Passe de durcissement adverse, après la gate `analyze`.** `analyze` atteste que le contrat est
**conforme** (traçabilité, EARS, découpage reviewable). Le premortem pose une question orthogonale :
**si ce contrat était honoré tel quel, la feature échouerait-elle quand même ?** Un `FR` peut être
parfaitement tracé et testable et laisser passer le cas limite, le chemin d'erreur ou l'hypothèse
tue qui la fera échouer en production.

Contrairement à `analyze` (lecture seule), cette phase **écrit** : elle inscrit des remédiations dans
`spec.md`/`plan.md`/`tasks.md`. Comme toutes les phases d'écriture du plugin, elle reste **purement
documentaire** — aucun code, aucun test — et **l'humain décide du quoi** via un gate d'approbation
explicite avant toute modification.

La technique du premortem : se projeter après la livraison en **supposant l'échec** (« 3 mois plus
tard, la feature a échoué… »), puis remonter à ce que le contrat contenait — ou omettait — qui l'a
rendu possible. La prospective hindsight fait émerger des risques qu'une checklist de conformité ne
voit pas.
</role>

<lenses>
Le facilitateur balaie ces lentilles (**angle large** : produit + doc). La discipline ne vient pas
de restreindre les lentilles, mais de la règle de remédiation : **tout risque retenu doit se
refermer par un changement de document.**

- **Correction & cas limites** — vide/max/hors bornes, concurrence, idempotence, ordre, locales,
  zéro/un/plusieurs. Le contrat ne spécifie-t-il que le happy path ?
- **Chemins d'erreur** — dépendance en panne, timeout, refus : un `SHALL` couvre-t-il le dégradé ?
- **Fit produit / UX** — un critère mesure-t-il l'issue utilisateur (user story du PRD), ou seulement
  la mécanique interne ? Friction, découvrabilité, état vide.
- **Données & état** — migration, rétro-compat, cohérence, cycle de vie, rétention si cadrée par le PRD.
- **Frontières & intégrations** — contrats d'API implicites, hypothèses sur un tiers, effets de bord.
- **Opérabilité** — observabilité, charge, rollback exigés par le socle mais non déclinés.
- **Hypothèses tues** — ce que le contrat tient pour acquis sans l'écrire. Le mode de défaillance
  n°1 : « on avait supposé que… ».
</lenses>

<process>
Trois agents en contexte frais, un gate humain au milieu. Séparer *générer* de *trier* évite d'agir
sur chaque risque imaginé ; le gate humain garde la décision du *quoi* à l'humain.

1. **`premortem-facilitator`** (lecture seule) — anime le premortem, génère largement mais avec
   **vraisemblance**, classe par impact × vraisemblance. Ne rejuge pas la conformité.
2. **`premortem-validator`** (lecture seule) — contrepoids sceptique. Relit les documents lui-même et
   tranche chaque risque **RETENU / REJETÉ** avec motif vérifiable. Rejette : déjà couvert, non
   ancré, scope creep (au-delà du EXCLU/PRD), style, doublon. Normalise les retenus en remédiations
   concrètes et minimales. *Séquentiel après le facilitateur.*
3. **Gate d'approbation humain** — la commande présente les remédiations retenues (`AskUserQuestion`).
   L'humain approuve tout / un sous-ensemble / rien. **Aucune écriture avant ce gate.**
4. **`premortem-applier`** (écriture) — inscrit **uniquement** l'ensemble approuvé, en préservant la
   traçabilité (IDs stables, prochain ID libre, backref PRD, EARS conforme, bon lot `Rn`). N'édite
   jamais un ADR accepté (candidats seulement). Rend le journal des changements.
5. **Re-gate** — le contrat a changé : relancer `analyze` pour reconfirmer `PRÊT` avant le passage de main.
</process>

<remediation-forms>
Chaque risque retenu retombe en **une** de ces formes — la plus petite qui referme le trou :

- **Nouveau critère EARS** sur un `FR` existant (le cas fréquent : happy path → + chemin d'erreur).
- **Nouveau `FR`** — prochain ID libre, backref PRD (ou `[NEEDS CLARIFICATION]` si le lien est incertain), **+ tâche d'impl et vérification observable** (selon le mode de vérification du lot).
- **Item de scope EXCLU** — quand la bonne réponse est « on ne fait pas ça », l'écrire ferme la porte.
- **Nouvelle tâche** dans un lot `Rn`, avec backref `_Requirements:_` et ordre de vérification cohérent avec le mode du lot.
- **Note de plan** — hypothèse explicitée, contrat d'intégration nommé dans `plan.md`.
- **Candidat ADR** — décision structurante → `docs/adr/_candidates/`, jamais un edit d'ADR accepté.

Un risque qui ne peut se dire en aucune de ces formes est **hors périmètre** : on le signale à
l'aval, on ne l'inscrit pas.
</remediation-forms>

<guidance>
- **Passe optionnelle, calibrée.** Diff descriptible en une phrase → saute-la. Elle paie sur les
  features non triviales, à fort chemin d'erreur ou fort enjeu produit. Ne sur-cérémonialise pas.
- **Après `analyze`, pas à sa place.** Le premortem suppose un contrat déjà conforme ; il cherche les
  défaillances que la conformité ne couvre pas. Ne double pas les findings d'`ears-verifier`/`slice-auditor`.
- **L'humain décide du quoi.** Les agents proposent et trient ; l'humain approuve. C'est le même
  principe que partout dans le plugin, matérialisé ici par un gate avant écriture — parce que c'est la
  seule passe d'écriture *automatisable* du cycle et qu'un contrat qui part à l'implémentation ne doit
  pas avoir été modifié par une IA sans revue.
- **Générer large, appliquer étroit.** Le facilitateur ratisse ; le valideur rejette ; l'applicateur
  n'inscrit que l'approuvé. Le scope creep est le risque n°1 de cette étape — les trois barrières
  (validation, approbation, application littérale) existent pour ça.
- **Relançable, mais re-gate.** Toute modification du contrat invalide le dernier verdict `analyze` :
  reconfirmer `PRÊT` après application. Rien n'est persisté du premortem lui-même — comme `analyze`,
  il ne laisse pas d'état sur disque, seulement ses effets dans les documents.
- **Le cycle boucle après.** Une fois le contrat durci et re-gaté `PRÊT`, il part vers le workflow
  d'implémentation et on repart sur la feature suivante (`kickoff`, ou `status` si plusieurs en vol).
</guidance>
