<settings_workflow>

## Workflow de configuration interactive

La commande `scd-review settings` présente un questionnaire interactif via `AskUserQuestion` et persiste les choix dans `config.json`.

## Étape 1 — Charger la configuration actuelle

Lire `.claude/review/config.json` avec Read. Extraire les valeurs actuelles pour les afficher comme défauts dans les options.

## Étape 2 — Questionnaire interactif

Poser les questions dans l'ordre suivant (chaque question attend la réponse avant de passer à la suivante) :

### Question 1 — Profil de modèles

```
AskUserQuestion(
  questions: [{
    question: "Quel profil de modèles pour les agents review ?",
    header: "Model Profile",
    options: [
      {
        label: "Balanced (Recommandé)",
        description: "Sonnet partout — bon ratio qualité/coût"
      },
      {
        label: "Quality",
        description: "Opus pour code-reviewer, test-reviewer et fix-applier — analyse profonde, coût élevé"
      },
      {
        label: "Budget",
        description: "Haiku pour review-validator — rapide, coût minimal"
      }
    ]
  }]
)
```

Mapping : Balanced → "balanced" | Quality → "quality" | Budget → "budget"

### Question 2 — Comportement par défaut après review

```
AskUserQuestion(
  questions: [{
    question: "Que faire après la review par défaut ?",
    header: "Default Output",
    options: [
      {
        label: "Interactif (Recommandé)",
        description: "Décider une par une (apply/skip/defer/discuss) avec persistance — usage solo dev quotidien"
      },
      {
        label: "Auto-fix",
        description: "Appliquer toutes les corrections validées sans interaction — usage CI / automation"
      },
      {
        label: "Post",
        description: "Poster les commentaires inline sur PR/MR (pas de décisions ni fix)"
      },
      {
        label: "Auto-fix + Post",
        description: "Corriger automatiquement puis poster les restes"
      }
    ]
  }]
)
```

Mapping : Interactif → "interactive" | Auto-fix → "fix" | Post → "post" | Auto-fix + Post → "both"

### Question 3 — Seuil de confiance du validator

```
AskUserQuestion(
  questions: [{
    question: "Seuil de confiance du validator ?",
    header: "Validator",
    options: [
      {
        label: "Standard 0.75 (Recommandé)",
        description: "Équilibre apply/escalate"
      },
      {
        label: "Strict 0.85",
        description: "Peu d'apply auto, plus d'escalations vers l'utilisateur"
      },
      {
        label: "Permissif 0.60",
        description: "Plus d'apply auto — risque de faux positifs appliqués"
      }
    ]
  }]
)
```

Mapping : Standard → 0.75 | Strict → 0.85 | Permissif → 0.60

### Question 4 — Agents parallèles maximum

```
AskUserQuestion(
  questions: [{
    question: "Nombre maximum d'agents parallèles ?",
    header: "Pipeline",
    options: [
      {
        label: "5 (Recommandé)",
        description: "Standard — review + validation en pipeline"
      },
      {
        label: "3",
        description: "Conservateur — moins de tokens simultanés"
      },
      {
        label: "8",
        description: "Agressif — gros projets, budget large"
      }
    ]
  }]
)
```

### Question 5 — Fichiers maximum par run

```
AskUserQuestion(
  questions: [{
    question: "Nombre maximum de fichiers par run ?",
    header: "Max Files",
    options: [
      {
        label: "20 (Recommandé)",
        description: "Standard"
      },
      {
        label: "10",
        description: "Petit scope"
      },
      {
        label: "40",
        description: "Gros scope — attention aux coûts"
      },
      {
        label: "Illimité",
        description: "Pas de limite (tous les fichiers du diff)"
      }
    ]
  }]
)
```

Mapping : 20 → 20 | 10 → 10 | 40 → 40 | Illimité → 999

### Question 6 — Plateforme

```
AskUserQuestion(
  questions: [{
    question: "Plateforme de code hosting ?",
    header: "Platform",
    options: [
      {
        label: "GitHub",
        description: "Intégration gh CLI"
      },
      {
        label: "GitLab",
        description: "Intégration glab CLI"
      },
      {
        label: "Local",
        description: "Pas de posting PR/MR"
      }
    ]
  }]
)
```

Mapping : GitHub → "github" | GitLab → "gitlab" | Local → null

### Question 7 — Checkpoint mi-parcours

```
AskUserQuestion(
  questions: [{
    question: "Afficher un checkpoint à 50% des fichiers ?",
    header: "Midpoint",
    options: [
      {
        label: "Oui (Recommandé)",
        description: "Pause optionnelle avec résumé intermédiaire"
      },
      {
        label: "Non",
        description: "Pipeline entièrement automatique sans pause"
      }
    ]
  }]
)
```

### Question 8 — Sauvegarder comme défaut global

```
AskUserQuestion(
  questions: [{
    question: "Sauvegarder comme défaut global (tous les projets) ?",
    header: "Scope",
    options: [
      {
        label: "Projet uniquement",
        description: "Écrire dans .claude/review/config.json uniquement"
      },
      {
        label: "Global",
        description: "Écrire aussi dans ~/.claude/scd-review/defaults.json"
      }
    ]
  }]
)
```

## Étape 3 — Persister les choix

### Mise à jour de config.json

Appliquer tous les choix dans `.claude/review/config.json` :

```bash
# Via jq (si disponible)
jq --arg profile "<balanced|quality|budget>" \
   --arg output "<fix|post|both>" \
   --argjson threshold <0.75|0.85|0.60> \
   --argjson max_agents <3|5|8> \
   --argjson max_files <10|20|40|999> \
   --arg platform "<github|gitlab|null>" \
   --argjson midpoint <true|false> '
  .model_profile = $profile |
  .default_output = $output |
  .validator.confidence_threshold = $threshold |
  .pipeline.max_parallel_agents = $max_agents |
  .pipeline.max_files_per_run = $max_files |
  .platform.type = (if $platform == "null" then null else $platform end) |
  .pipeline.midpoint_checkpoint = $midpoint
' .claude/review/config.json > .claude/review/config.json.tmp && \
mv .claude/review/config.json.tmp .claude/review/config.json
```

### Si global → écrire dans defaults.json

```bash
mkdir -p ~/.claude/scd-review
# Écrire les mêmes champs dans ~/.claude/scd-review/defaults.json
```

## Étape 4 — Confirmation

Afficher un résumé des paramètres appliqués :

```
## Configuration sauvegardée

| Paramètre | Valeur |
|-----------|--------|
| Profil modèles | balanced |
| Output par défaut | interactive |
| Validator threshold | 0.75 |
| Max agents parallèles | 5 |
| Max fichiers / run | 20 |
| Plateforme | github |
| Checkpoint mi-parcours | oui |

Scope : projet uniquement (.claude/review/config.json)

Lancez /scd-review:run pour démarrer une review avec ces paramètres.
```

</settings_workflow>
