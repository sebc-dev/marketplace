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
  "plugin_root": null,
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

## 3. Detecter la racine du plugin

Lire `plugin_root` dans la config.

**Si `null` ou si le chemin ne contient plus de fichiers** (verifier avec `Glob("<plugin_root>/scripts/init-strategy.sh")`) :

1. Localiser le plugin : `Glob("**/scd-review/scripts/init-strategy.sh")`
2. Si aucun resultat → erreur : `Impossible de localiser le plugin scd-review. Verifiez l'installation.`
3. Si plusieurs resultats → privilegier le chemin le plus court (installation principale)
4. Deduire la racine : retirer `/scripts/init-strategy.sh` du chemin trouve (ex: `/home/user/.claude/plugins/scd-review/scripts/init-strategy.sh` → `/home/user/.claude/plugins/scd-review`)
5. Persister dans config.json avec Read + Write (la strategie jq n'est pas encore detectee a ce stade)
6. Confirmer : `Plugin root detecte : <chemin>`

**Si `plugin_root` est deja defini et valide** → indiquer `Plugin root : <chemin>`

## 4. Installer ou mettre a jour les scripts

1. Lister les scripts source : `Glob("<plugin_root>/scripts/*.sh")` → extraire les noms de fichiers
2. Lister les scripts installes : `Glob(".claude/review/scripts/*.sh")` → extraire les noms de fichiers
3. Comparer les deux listes :
   - **Si le repertoire n'existe pas** → copier tous les scripts source avec Read + Write
   - **Si des scripts source sont absents du projet** → copier uniquement les manquants avec Read + Write
   - **Si tout est a jour** → indiquer `Scripts a jour dans .claude/review/scripts/`
4. Si des scripts ont ete copies : `chmod +x .claude/review/scripts/*.sh`
5. Confirmer avec la liste des scripts installes/mis a jour (ou "a jour" si rien a copier)

## 5. Installer la rule testing-principles

1. Verifier si `.claude/rules/testing-principles.md` existe dans le projet (Glob)
2. Si absent :
   - Lire `<plugin_root>/rules/testing-principles.md` avec Read
   - Creer le repertoire `.claude/rules/` si necessaire
   - Ecrire le contenu vers `.claude/rules/testing-principles.md` du projet avec Write
   - Confirmer l'installation : `Rule testing-principles installee dans .claude/rules/`
3. Si present : indiquer `Rule testing-principles deja presente`

## 6. Detecter la strategie JSON

Lire `json_strategy` dans la config. Si la valeur est `null` :

1. Executer `jq --version` via Bash
2. Si succes → utiliser le script installe : `bash .claude/review/scripts/init-strategy.sh .claude/review/config.json jq`
3. Si echec → ecrire `"readwrite"` dans `json_strategy` avec Write

Si `json_strategy` est deja defini (`"jq"` ou `"readwrite"`), ne rien changer.

## 7. Choix plateforme

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

**Si "Aucune"** → ecrire `platform.type = null` dans config.json, sauter a l'etape 9.

**Si GitHub ou GitLab** → passer a l'etape 7-bis.

## 7-bis. Detection et installation CLI

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

Si "Continuer sans" → ecrire `platform.type = null`, sauter a l'etape 9.
Si "Verifier a nouveau" → re-executer la detection. Si toujours absent, re-proposer.

3. Si present → verifier l'auth : `gh auth status` / `glab auth status`
4. Si non authentifie → afficher `gh auth login` / `glab auth login` et re-proposer la verification

## 7-ter. Persister la config plateforme

Ecrire dans config.json :
- `platform.type` : `"github"` ou `"gitlab"`
- `platform.auto_post` : `true`

**Strategie `jq`** :
```bash
jq '.platform.type = "github" | .platform.auto_post = true' .claude/review/config.json > .claude/review/config.json.tmp && mv .claude/review/config.json.tmp .claude/review/config.json
```

**Strategie `readwrite`** : Read + Write pour mettre a jour les champs.

## 8. Rappel gitignore

Indiquer a l'utilisateur d'ajouter au `.gitignore` si ce n'est pas deja fait :
- `.claude/review/sessions/` — fichiers de session temporaires
- `.claude/review/scripts/` — scripts installes depuis le plugin

## 9. Resume

Afficher un resume :
```
Configuration code-review initialisee
  Plugin root    : <plugin_root>
  Strategie JSON : jq | readwrite
  Plateforme     : GitHub (gh) | GitLab (glab) | Aucune
  Config         : .claude/review/config.json
  Sessions       : .claude/review/sessions/
  Scripts        : .claude/review/scripts/ [installes | deja presents]
  Rule testing   : .claude/rules/testing-principles.md [installee | deja presente]
```

</process>
