# Référence — Boucle autonome de maintenance du drift spec↔code

<scope>
**Périmètre strict : la détection de dérive, pas l'implémentation.**

Ce plugin est purement documentaire et **s'arrête à la validation du contrat** (gate `analyze`, plus
le durcissement `premortem` optionnel) : écrire le code et le vérifier sont hors périmètre, c'est un
workflow séparé. Aucune boucle décrite ici ne fait avancer une
implémentation, ne corrige du code, ni n'itère « jusqu'à ce que les tests passent ». La seule boucle
en périmètre **observe** les living files et **signale** les écarts — elle ne répare rien.

Si tu cherches à piloter une implémentation autonome, ce n'est pas ici.
</scope>

<loop-md>
Gabarit à copier dans `.claude/loop.md` du projet (`loop.md` est ignoré si un prompt est fourni en
ligne de commande). Il **propose**, il ne corrige pas :

```markdown
# Boucle de maintenance specs (bare /loop)
Pour chaque spec sous specs/*/ :
1. Lis spec.md, plan.md, tasks.md. Vérifie que chaque FR/SHALL (EARS) a une
   vérification correspondante (test, check, ou preuve inhérente selon le mode du
   lot) et que tasks.md reflète l'état réel du code.
2. Si un écart spec↔code↔test est détecté, note-le dans specs/<id>/DRIFT.md
   (ne corrige PAS le code — propose seulement).
3. Vérifie la cohérence avec docs/stack.md et docs/adr/. NE MODIFIE JAMAIS docs/adr/*.
4. Si une décision d'archi nouvelle est implicite dans le code mais absente des ADR,
   rédige un CANDIDAT dans docs/adr/_candidates/NNNN-draft.md (jamais dans adr/ final).
5. Si tout est cohérent, écris une ligne d'état dans docs/_maintenance/log.md.
```

Pourquoi c'est en périmètre : la dérive spec↔code est un problème **documentaire**. Les living files
sont l'actif que ce plugin produit ; les garder fidèles au code relève de sa responsabilité. Corriger
le code, non.
</loop-md>

<pitfalls>
- **Ne jamais laisser la boucle corriger le code.** Elle écrit dans `DRIFT.md` et `_candidates/`, jamais dans les sources. Une boucle de maintenance qui « répare » silencieusement est une dérive non revue.
- **Boucle sans condition d'arrêt** → toujours une clause « stop après N tours ».
- **Auto-évaluation biaisée** : la boucle ne valide pas son propre constat. Le juge indépendant du plugin est le subagent `ears-verifier` (phase `analyze`).
- **Fragilité session-scoped** : `/loop` meurt à la fermeture de session ou au `/clear`. Pour une maintenance durable (docs-drift hebdo), une **Routine cloud** (`/schedule`) est le bon outil — hors périmètre v1, mentionné pour référence.
- **Immutabilité ADR** : la boucle tourne sous le hook PreToolUse `block-adr-edits`, qui la bloque mécaniquement si elle tente d'éditer un ADR accepté.
</pitfalls>
