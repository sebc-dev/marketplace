---
name: review-post
description: Poster ou re-poster les resultats d'une review completee sur GitHub/GitLab
allowed-tools:
  - Bash(bash .claude/review/scripts/*)
  - Bash(gh pr *)
  - Bash(glab mr *)
  - Read
  - Glob
---

<objective>
Poster manuellement les resultats d'une review completee sur le PR/MR de la branche courante. Utile quand le PR/MR n'existait pas au moment de la review, apres une erreur reseau, ou pour re-poster.
</objective>

<process>

## 0. Verification environnement

Suivre la procedure @references/ensure-env.md pour charger la config et verifier l'env_cache.
Si config absente → indiquer de lancer `/scd-review:review-init` et STOP.

## 1. Verifier la configuration plateforme

Lire `platform` dans la config chargee.

Si `platform.type == null` :
```
Plateforme non configuree. Lancez /scd-review:review-init pour configurer l'integration GitHub/GitLab.
```
Et s'arreter.

## 2. Trouver la derniere session completee

1. `git branch --show-current`, calculer le slug (remplacer `/` par `-`)
2. Chercher les sessions via Glob :
   - `.claude/review/sessions/<slug>-followup.json`
   - `.claude/review/sessions/<slug>.json`
3. Prendre la derniere session avec `status == "completed"` (followup prioritaire sur review initiale)
4. Si aucune session completee :
   ```
   Aucune review completee pour cette branche. Lancez /scd-review:code-review d'abord.
   ```
   Et s'arreter.

## 3. Afficher le resume de la session

Lire la session et afficher :
```
Session trouvee : <chemin>
  Branche  : <branch>
  Type     : review | followup (round N)
  Date     : <created_at>
  Fichiers : <total>
  Bloquants: <blocking count>
```

## 4. Poster

Lire `json_strategy` dans config.json.

**Strategie jq** :
```bash
bash .claude/review/scripts/post-review-comments.sh <session> .claude/review/config.json
```
Afficher le resultat retourne.

**Strategie readwrite** :
1. Detecter le PR/MR :
   - GitHub : `gh pr list --head <branch> --json number --jq '.[0].number'`
   - GitLab : `glab mr list --source-branch <branch> -o json`
2. Si aucun PR/MR ouvert → "Aucun PR/MR ouvert pour la branche <branch>."
3. Construire le corps markdown (meme format que le script)
4. Poster via `gh pr review` / `glab mr note`
5. Afficher confirmation

</process>
