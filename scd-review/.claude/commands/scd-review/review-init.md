---
name: review-init
description: Bootstrap de la configuration code review — detection jq et creation config.json
allowed-tools:
  - Bash(jq *)
  - Bash(bash .claude/review/scripts/*)
  - Bash(chmod +x *)
  - Bash(gh *)
  - Bash(glab *)
  - Bash(uname *)
  - Read
  - Write
  - Glob
  - AskUserQuestion
---

<objective>
Initialiser l'environnement de code review : detecter la strategie JSON (jq ou readwrite), creer le fichier de configuration, installer les scripts et le repertoire de sessions.
</objective>

<process>

## 1. Verifier si la config existe

Chercher `.claude/review/config.json` avec Glob.

### Si absent : creer la config par defaut

Creer `.claude/review/config.json` avec Write :

```json
{
  "json_strategy": null,
  "category_priority": [
    "build-config",
    "database-migrations",
    "domain-models",
    "infrastructure",
    "business-logic",
    "controllers-api",
    "views-ui",
    "integration-wiring",
    "tests",
    "i18n-docs"
  ],
  "review_criteria": [
    "architecture",
    "security",
    "performance",
    "conventions",
    "error-handling",
    "test-coverage"
  ],
  "severity": {
    "good": "Pattern ou choix remarquable",
    "question": "Point a clarifier ou discuter",
    "attention": "Probleme potentiel a adresser"
  },
  "options": {
    "default_base_branch": "main",
    "language": "fr"
  },
  "platform": {
    "type": null,
    "auto_post": false
  }
}
```

### Si present : lire et afficher la config actuelle

Utiliser Read pour afficher le contenu de la config.

## 2. Creer le repertoire de sessions

Verifier si `.claude/review/sessions/` existe (Glob). Si absent, le creer.

## 3. Installer les scripts

1. Verifier si `.claude/review/scripts/` existe (Glob)
2. Si absent :
   - Copier tous les fichiers de `${CLAUDE_PLUGIN_ROOT}/scripts/*.sh` vers `.claude/review/scripts/` avec Write (lire chaque script avec Read puis ecrire dans le projet)
   - Rendre les scripts executables : `chmod +x .claude/review/scripts/*.sh`
   - Confirmer : `Scripts installes dans .claude/review/scripts/`
3. Si present : indiquer `Scripts deja installes dans .claude/review/scripts/`

## 4. Installer la rule testing-principles

1. Verifier si `.claude/rules/testing-principles.md` existe dans le projet (Glob)
2. Si absent :
   - Lire `${CLAUDE_PLUGIN_ROOT}/rules/testing-principles.md` avec Read
   - Creer le repertoire `.claude/rules/` si necessaire
   - Ecrire le contenu vers `.claude/rules/testing-principles.md` du projet avec Write
   - Confirmer l'installation : `Rule testing-principles installee dans .claude/rules/`
3. Si present : indiquer `Rule testing-principles deja presente`

## 5. Detecter la strategie JSON

Lire `json_strategy` dans la config. Si la valeur est `null` :

1. Executer `jq --version` via Bash
2. Si succes → utiliser le script installe : `bash .claude/review/scripts/init-strategy.sh .claude/review/config.json jq`
3. Si echec → ecrire `"readwrite"` dans `json_strategy` avec Write

Si `json_strategy` est deja defini (`"jq"` ou `"readwrite"`), ne rien changer.

## 6. Choix plateforme

Proposer l'integration PR/MR :

```
AskUserQuestion(
  questions: [{
    question: "Poster automatiquement les resultats de review sur vos PR/MR ?",
    header: "Plateforme",
    options: [
      { label: "GitHub", description: "Poster sur les Pull Requests via gh CLI" },
      { label: "GitLab", description: "Poster sur les Merge Requests via glab CLI" },
      { label: "Aucune", description: "Review locale uniquement, pas de publication" }
    ],
    multiSelect: false
  }]
)
```

**Si "Aucune"** → ecrire `platform.type = null` dans config.json, sauter a l'etape 8.

**Si GitHub ou GitLab** → passer a l'etape 6-bis.

## 6-bis. Detection et installation CLI

1. Detecter l'outil : `gh --version` (GitHub) ou `glab --version` (GitLab)
2. Si absent → detecter l'OS via `uname -s` (si `uname` echoue → assumer Windows) et afficher le guide :

| Plateforme | macOS (Darwin) | Debian/Ubuntu (Linux) | Fedora/RHEL (Linux) | Windows (PowerShell) |
|------------|----------------|----------------------|---------------------|---------------------|
| GitHub CLI | `brew install gh` | `sudo apt install gh` | `sudo dnf install gh` | `winget install GitHub.cli` |
| GitLab CLI | `brew install glab` | `sudo apt install glab` | `sudo dnf install glab` | `winget install GLab.glab` |

Puis proposer :
```
AskUserQuestion(
  questions: [{
    question: "CLI installe ou continuer sans integration ?",
    header: "CLI",
    options: [
      { label: "Verifier a nouveau", description: "Je viens de l'installer, re-verifier" },
      { label: "Continuer sans", description: "Desactiver l'integration plateforme" }
    ],
    multiSelect: false
  }]
)
```

Si "Continuer sans" → ecrire `platform.type = null`, sauter a l'etape 8.
Si "Verifier a nouveau" → re-executer la detection. Si toujours absent, re-proposer.

3. Si present → verifier l'auth : `gh auth status` / `glab auth status`
4. Si non authentifie → afficher `gh auth login` / `glab auth login` et re-proposer la verification

## 6-ter. Persister la config plateforme

Ecrire dans config.json :
- `platform.type` : `"github"` ou `"gitlab"`
- `platform.auto_post` : `true`

**Strategie `jq`** :
```bash
jq '.platform.type = "github" | .platform.auto_post = true' .claude/review/config.json > .claude/review/config.json.tmp && mv .claude/review/config.json.tmp .claude/review/config.json
```

**Strategie `readwrite`** : Read + Write pour mettre a jour les champs.

## 7. Rappel gitignore

Indiquer a l'utilisateur d'ajouter au `.gitignore` si ce n'est pas deja fait :
- `.claude/review/sessions/` — fichiers de session temporaires
- `.claude/review/scripts/` — scripts installes depuis le plugin

## 8. Resume

Afficher un resume :
```
Configuration code-review initialisee
  Strategie JSON : jq | readwrite
  Plateforme     : GitHub (gh) | GitLab (glab) | Aucune
  Config         : .claude/review/config.json
  Sessions       : .claude/review/sessions/
  Scripts        : .claude/review/scripts/ [installes | deja presents]
  Rule testing   : .claude/rules/testing-principles.md [installee | deja presente]
```

</process>
