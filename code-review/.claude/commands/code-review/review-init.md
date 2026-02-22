---
name: review-init
description: Bootstrap de la configuration code review — detection jq et creation config.json
allowed-tools:
  - Bash(jq *)
  - Read
  - Write
  - Glob
---

<objective>
Initialiser l'environnement de code review : detecter la strategie JSON (jq ou readwrite), creer le fichier de configuration et le repertoire de sessions.
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
  }
}
```

### Si present : lire et afficher la config actuelle

Utiliser Read pour afficher le contenu de la config.

## 2. Detecter la strategie JSON

Lire `json_strategy` dans la config. Si la valeur est `null` :

1. Executer `jq --version` via Bash
2. Si succes → ecrire `"jq"` dans `json_strategy`
3. Si echec → ecrire `"readwrite"` dans `json_strategy`

Si `json_strategy` est deja defini (`"jq"` ou `"readwrite"`), ne rien changer.

## 3. Creer le repertoire de sessions

Verifier si `.claude/review/sessions/` existe (Glob). Si absent, le creer.

## 3-bis. Installer la rule testing-principles

1. Verifier si `.claude/rules/testing-principles.md` existe dans le projet (Glob)
2. Si absent :
   - Lire `${CLAUDE_PLUGIN_ROOT}/rules/testing-principles.md` avec Read
   - Creer le repertoire `.claude/rules/` si necessaire
   - Ecrire le contenu vers `.claude/rules/testing-principles.md` du projet avec Write
   - Confirmer l'installation : `Rule testing-principles installee dans .claude/rules/`
3. Si present : indiquer `Rule testing-principles deja presente`

## 4. Rappel gitignore

Indiquer a l'utilisateur d'ajouter `.claude/review/sessions/` a son `.gitignore` si ce n'est pas deja fait. Les fichiers de session contiennent des donnees temporaires specifiques a chaque review et ne doivent pas etre commites.

## 5. Resume

Afficher un resume :
```
Configuration code-review initialisee
  Strategie JSON : jq | readwrite
  Config         : .claude/review/config.json
  Sessions       : .claude/review/sessions/
  Rule testing   : .claude/rules/testing-principles.md [installee | deja presente]
```

</process>
