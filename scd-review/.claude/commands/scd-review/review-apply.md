---
name: review-apply
description: Appliquer les corrections d'une code review — traiter chaque observation interactivement (appliquer, sauter, rejeter, discuter)
allowed-tools:
  - Bash(git branch:*)
  - Bash(git rev-parse:*)
  - Bash(bash .claude/review/scripts/*)
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Apres une code review completee, traiter les observations (bloquantes et suggestions) interactivement. Pour chaque observation, l'utilisateur peut : appliquer la correction (via un agent isole), sauter, rejeter (faux positif), ou discuter.
</objective>

<process>

## 0. Verification environnement

Suivre la procedure @references/ensure-env.md pour charger la config et verifier l'env_cache.
Si config absente → indiquer de lancer `/scd-review:review-init` et STOP.

Lire `json_strategy` et `plugin_root` depuis la config chargee.
Si `plugin_root` est `null` → erreur : `Plugin root non configure. Lancez /scd-review:review-init d'abord.`

Lire `<plugin_root>/.claude/agents/fix-applier.md` → retenir comme `FIX_APPLIER_INSTRUCTIONS`
Si introuvable → erreur : `Agent fix-applier introuvable dans <plugin_root>. Relancez /scd-review:review-init pour mettre a jour.`

## Etape 0 — Trouver la session source

1. `git branch --show-current`, calculer le slug (remplacer `/` par `-`)
2. Chercher les sessions via Glob :
   - `.claude/review/sessions/<slug>-apply.json`
   - `.claude/review/sessions/<slug>-followup.json`
   - `.claude/review/sessions/<slug>.json`

**Si `<slug>-apply.json` existe et `status == "in_progress"` :**
Proposer la reprise :

```
AskUserQuestion(
  questions: [{
    question: "Une session apply est en cours. Que souhaitez-vous faire ?",
    header: "Session apply",
    options: [
      { label: "Reprendre", description: "Continuer depuis la derniere observation traitee" },
      { label: "Recommencer", description: "Supprimer la session apply et en creer une nouvelle" }
    ],
    multiSelect: false
  }]
)
```

- **Reprendre** → lire la session, trouver la premiere observation `pending`, aller a Etape 3
- **Recommencer** → supprimer le fichier, continuer vers la recherche de session source

**Trouver la derniere session completee (priorite : followup > review) :**
- Si `<slug>-followup.json` existe et `status == "completed"` → utiliser comme source
- Sinon si `<slug>.json` existe et `status == "completed"` → utiliser comme source
- Sinon → erreur : "Aucune review completee pour cette branche. Lancez /scd-review:code-review d'abord."

## Etape 1 — Extraire les observations

**Strategie `jq`** :
```bash
bash .claude/review/scripts/create-apply-session.sh <source_session>
```
Capturer le stdout JSON.

**Strategie `readwrite`** :
Read de la session source, extraire les fichiers avec observations red/yellow, construire le JSON apply manuellement.

Presenter le resume :
```
Apply des corrections — <branche>
Session source : <chemin> (completee le <date>)

Observations a traiter :
- X bloquantes (red)
- Y suggestions (yellow)
- Z fichiers concernes

Ordre : fichiers avec bloquants d'abord
```

Confirmer avec l'utilisateur avant de continuer.

## Etape 2 — Creer la session apply

Ecrire le JSON dans `.claude/review/sessions/<slug>-apply.json` avec Write.

## Etape 3 — Boucle observation par observation

Parcourir les fichiers dans l'ordre, puis les observations dans chaque fichier.

Pour chaque fichier :
```
--- Fichier X/Y : chemin/fichier.ext [CATEGORIE] ---
```

Pour chaque observation pending dans le fichier :

### 3a. Afficher l'observation

Presenter chaque observation avec un bloc structure extrait du fichier de suivi :

```
---
📋 Observation X.Y — <level_emoji> **<criterion>** [<SEVERITE>]

📁 Fichier : `<chemin/fichier.ext>`
🔍 Probleme : <texte de l'observation>
   <detail de l'observation — explication complete du probleme>
💡 Correction suggeree : <suggestion de l'observation — direction de correction>
---
```

Les champs `detail` et `suggestion` proviennent directement du JSON de la session. Si ces champs sont absents (anciennes sessions), afficher uniquement le `text`.

### 3b. Demander l'action

```
AskUserQuestion(
  questions: [{
    question: "Comment traiter cette observation ?",
    header: "Obs X.Y",
    options: [
      { label: "Appliquer", description: "Lancer le fix-applier pour corriger" },
      { label: "Sauter", description: "Passer cette observation sans la corriger" },
      { label: "Rejeter", description: "Faux positif — l'observation est incorrecte" },
      { label: "Discuter", description: "En parler avant de decider" }
    ],
    multiSelect: false
  }]
)
```

### 3c. Traiter la reponse

**Appliquer** :
Lancer le fix-applier en foreground (on attend le resultat) :

```
Task(
  subagent_type: "general-purpose",
  run_in_background: false,
  description: "Fix: <criterion> in <filename>",
  prompt: "Tu es un agent de correction de code. Voici ta definition :
<agent_instructions>
{FIX_APPLIER_INSTRUCTIONS}
</agent_instructions>

Corrige l'observation suivante :

📁 Fichier : <chemin>
Categorie : <category>

🔍 Observation :
- Critere : <criterion>
- Severite : <severity>
- Niveau : <level>
- Resume : <text>
- Detail : <detail>
- Correction suggeree : <suggestion>

Le champ 'detail' explique le probleme precis et le code concerne.
Le champ 'suggestion' indique la direction de correction a suivre.
Applique une correction chirurgicale en suivant cette direction."
)
```

Afficher le rapport du fix-applier.
Extraire le status du rapport (`applied` ou `skipped_ambiguous`).

**Strategie `jq`** :
```bash
bash .claude/review/scripts/update-apply-observation.sh <session> <file_index> <obs_index> "<status>" "<change_summary>"
```

**Strategie `readwrite`** : Read + Write pour mettre a jour l'observation.

Si le fix-applier retourne `skipped_ambiguous`, informer l'utilisateur et re-afficher le AskUserQuestion pour cette observation (il peut alors sauter ou discuter).

**Sauter** :
```bash
bash .claude/review/scripts/update-apply-observation.sh <session> <file_index> <obs_index> "skipped"
```

**Rejeter** :
```bash
bash .claude/review/scripts/update-apply-observation.sh <session> <file_index> <obs_index> "dismissed"
```

**Discuter** :
Discussion dans la conversation principale (pas cher en tokens). L'utilisateur peut poser des questions, demander des clarifications. Ensuite re-afficher le AskUserQuestion pour la meme observation.

### 3d. Avancer

Apres chaque observation traitee (sauf Discuter), passer a la suivante dans le fichier, puis au fichier suivant quand toutes les observations sont traitees.

Afficher la progression :
```
[X/Y observations traitees — A appliquees, S sautees, R rejetees]
```

## Etape 4 — Synthese

Apres la derniere observation :

**Strategie `jq`** :
```bash
bash .claude/review/scripts/apply-summary.sh .claude/review/sessions/<slug>-apply.json
```
Afficher la sortie telle quelle.

**Strategie `readwrite`** :
1. Lire la session apply
2. Construire le tableau recapitulatif par fichier
3. Lister les observations sautees et rejetees
4. Marquer la session `status: "completed"` + `completed_at`
5. Ecrire avec Write

</process>

<guidelines>
- Toujours communiquer en francais
- Le fix-applier est lance en foreground (pas background) — on attend son resultat avant de continuer
- Le fix-applier est un agent isole : il ne voit pas la conversation principale, il recoit tout le contexte necessaire dans son prompt
- Economiser le contexte : chaque observation ne devrait consommer que ~150-250 tokens dans la conversation principale
- Si l'utilisateur enchaine "Appliquer" sur plusieurs observations, ne pas ajouter de bavardage — afficher le rapport et passer a la suite
- La session apply est independante de la session review/followup — elle ne modifie pas la session source
- Apres l'apply, recommander un `/scd-review:review-followup` pour verifier que les corrections sont bien appliquees
</guidelines>
