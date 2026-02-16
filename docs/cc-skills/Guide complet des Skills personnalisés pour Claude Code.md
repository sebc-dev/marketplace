# Guide complet des Skills personnalisés pour Claude Code

Les **Skills** constituent le mécanisme central pour étendre les capacités de Claude Code avec de l'expertise métier réutilisable. Un skill est essentiellement un dossier contenant un fichier `SKILL.md` avec des instructions que Claude charge automatiquement selon le contexte de la conversation. Cette approche de **progressive disclosure** permet d'injecter jusqu'à plusieurs milliers de tokens de documentation sans surcharger le contexte initial — Claude ne charge le contenu complet qu'au moment pertinent.

## Anatomie d'un fichier SKILL.md

Chaque skill repose sur un fichier `SKILL.md` structuré avec un **frontmatter YAML** obligatoire suivi d'instructions en Markdown. Le frontmatter doit commencer strictement à la première ligne du fichier (sans ligne vide avant) et contient deux champs requis :

```yaml
---
name: generating-commit-messages
description: Génère des messages de commit clairs à partir des diffs git. Utiliser pour écrire des commits ou réviser les changements staged.
---

# Generating Commit Messages

## Instructions
1. Exécuter `git diff --staged` pour voir les changements
2. Proposer un message avec :
   - Résumé sous 50 caractères
   - Description détaillée
   - Composants affectés

## Bonnes pratiques
- Utiliser le présent
- Expliquer quoi et pourquoi, pas comment
```

Le champ `name` accepte maximum **64 caractères** (minuscules, chiffres, tirets uniquement), tandis que `description` peut contenir jusqu'à **1024 caractères**. Cette description est critique car elle détermine quand Claude active automatiquement le skill. Des champs optionnels comme `allowed-tools: Read, Grep, Glob` permettent de restreindre les outils disponibles quand le skill est actif.

## Emplacements et découverte des skills

Claude Code découvre les skills dans une hiérarchie de répertoires avec des priorités claires :

| Emplacement | Usage | Priorité |
|-------------|-------|----------|
| `~/.claude/skills/` | Préférences personnelles, tous projets | Haute |
| `.claude/skills/` | Workflows d'équipe, partagés via git | Moyenne |
| Plugins installés | Fonctionnalités de plugins | Basse |

Le processus de découverte fonctionne en trois niveaux. Au démarrage, Claude charge uniquement les **métadonnées** (nom et description) de tous les skills disponibles — environ 100 tokens par skill. Lors d'une requête correspondant à une description, Claude demande confirmation avant de charger les **instructions complètes** (moins de 5000 tokens recommandés). Les **fichiers de support** (scripts, références, templates) sont chargés uniquement à la demande, permettant une documentation pratiquement illimitée.

Pour les monorepos, Claude découvre automatiquement les skills dans les sous-répertoires `.claude/skills/` lorsque vous travaillez dans ces répertoires.

## Structure multi-fichiers pour skills complexes

Un skill peut dépasser le simple fichier `SKILL.md` pour inclure scripts exécutables et documentation détaillée :

```
pdf-processing/
├── SKILL.md           # Point d'entrée (requis)
├── FORMS.md           # Documentation formulaires
├── REFERENCE.md       # Référence API détaillée
├── scripts/
│   ├── extract.py     # Extraction de texte
│   └── fill_form.py   # Remplissage formulaires
└── templates/
    └── report.txt     # Modèle de rapport
```

La **règle d'or** : les références depuis SKILL.md doivent rester à **un seul niveau de profondeur**. Éviter les chaînes `SKILL.md → advanced.md → details.md → actual-info.md` qui compliquent la navigation et augmentent les tokens consommés.

## Quand créer un skill versus autres approches

Le choix entre skills, CLAUDE.md et slash commands dépend du pattern d'utilisation :

**Skills** (invocation automatique) conviennent pour l'expertise réutilisable, les workflows multi-étapes, et les connaissances procédurales à capturer. Ils brillent quand vous tapez le même type de prompt dans plusieurs conversations.

**CLAUDE.md** (toujours chargé) fonctionne mieux pour les conventions de code courtes et les règles always-on comme les standards de formatage ou les contraintes d'architecture.

**Slash commands** (invocation explicite `/commande`) servent de raccourcis pour des actions ponctuelles fréquentes où l'utilisateur veut un déclenchement explicite.

Les tasks qui bénéficient le plus des skills incluent les **workflows multi-étapes avec outils** (préparation de réunions combinant Notion et Calendar), les **processus nécessitant cohérence** (analyses trimestrielles, audits sécurité), et l'**expertise métier à capturer** (méthodologies de recherche, standards de code review).

## Exemples de skills par cas d'usage

### Test-Driven Development
```yaml
---
name: test-driven-development
description: Enforce strict TDD with RED/GREEN/REFACTOR cycle. Use for all new features, bug fixes, and behavior changes.
---

# Test-Driven Development

Write the test first. Watch it fail. Write minimal code to pass.

## 🔴 RED Phase
1. Write a test describing expected behavior
2. Run the test
3. Confirm it fails for the RIGHT reason

## 🟢 GREEN Phase
1. Write MINIMUM code to pass
2. No extra functionality

## 🔵 REFACTOR Phase
1. Clean up the code
2. Keep tests passing
```

### Code Review avec restriction d'outils
```yaml
---
name: code-reviewer
description: Reviews code for quality, security, and conventions. Use after writing or modifying code.
allowed-tools: Read, Grep, Glob
---

## Checklist
- [ ] No TypeScript `any` usage
- [ ] Error handling for async operations
- [ ] Loading states handled
- [ ] Tests included for new functionality
```

### Skill utilisant MCP
```yaml
---
name: meeting-prep
description: Prépare les réunions en utilisant Notion et Google Drive
allowed-tools: mcp__notion__search, mcp__notion__read, mcp__gdrive__search
---

## Workflow
1. Rechercher pages Notion via mcp__notion__search
2. Extraire contenu des réunions précédentes
3. Créer document de pré-lecture formaté
```

## Intégration MCP et hooks

**MCP** (Model Context Protocol) fournit la connectivité aux systèmes externes, tandis que les **skills** enseignent comment utiliser cette connectivité efficacement. Un skill peut orchestrer plusieurs serveurs MCP pour des analyses complexes — par exemple, combiner GitHub, CircleCI et Slack pour un dashboard CI/CD.

Les **hooks** permettent d'automatiser des actions autour de l'exécution de Claude. Un hook `PostToolUse` sur `Write|Edit` peut déclencher automatiquement un linting après chaque modification de fichier. Un hook `PreToolUse` peut valider les commandes avant exécution pour la sécurité.

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/lint.sh"
      }]
    }]
  }
}
```

## Composition et paramétrage avancé

Les slash commands acceptent des **arguments positionnels** via `$1`, `$2`, etc. :

```markdown
# .claude/commands/fix-issue.md
Corriger l'issue #$1 avec priorité $2 assignée à $3
```

Usage : `/fix-issue 123 high alice`

Pour les **variables d'environnement**, Claude Code expose `$CLAUDE_PROJECT_DIR`, `$CLAUDE_CODE_REMOTE` (true si environnement web), et `$CLAUDE_PLUGIN_ROOT` pour les plugins.

## Pièges courants et anti-patterns

Le piège le plus fréquent est la **description vague** qui empêche Claude de savoir quand activer le skill. "Aide avec les documents" ne fonctionne pas — préférer "Extrait texte et tables de fichiers PDF, remplit formulaires. Utiliser quand l'utilisateur mentionne PDFs ou extraction de documents."

Les **skills fourre-tout** qui essaient de tout faire sont également problématiques. Un skill devrait correspondre à **une capacité spécifique et répétable**. De même, éviter les listes interminables de slash commands — l'intérêt d'un agent est de comprendre le langage naturel.

Un problème méconnu : les skills ne s'activent automatiquement que dans **50-80% des cas** attendus. Pour améliorer la fiabilité, certains développeurs utilisent un **forced-eval hook** qui force Claude à évaluer explicitement chaque skill disponible avant de procéder.

Les **références trop profondes** (SKILL.md → fichier → fichier → contenu utile) compliquent la navigation et consomment plus de tokens. Garder les références à un niveau depuis SKILL.md.

## Organisation et maintenance d'une bibliothèque

L'architecture recommandée organise les skills par **domaine d'expertise** :

```
~/.claude/skills/
├── blogging/
│   ├── SKILL.md
│   ├── workflows/
│   │   ├── write.md
│   │   └── publish.md
│   └── context/
│       └── formatting.md
├── research/
│   └── SKILL.md
└── devops/
    └── SKILL.md
```

Pour le **versioning**, les skills projet (`.claude/skills/`) se commitent naturellement avec le code. Les skills personnels (`~/.claude/skills/`) peuvent être synchronisés via un dotfiles repo.

### Tests et validation

Adopter un **développement piloté par évaluation** :
1. Identifier les lacunes en exécutant Claude sur des tâches représentatives sans skill
2. Créer au moins 3 scénarios de test
3. Établir une baseline de performance
4. Écrire des instructions minimales comblant les lacunes
5. Itérer en comparant les résultats

Tester avec **plusieurs modèles** (Haiku, Sonnet, Opus) car les skills fonctionnent différemment selon la capacité du modèle.

## Métriques de qualité et checklist

Un skill de qualité respecte ces critères :

- **Description spécifique** incluant mots-clés d'utilisation et contextes de déclenchement
- **SKILL.md sous 500 lignes** avec détails dans fichiers séparés
- **Exemples concrets** avec format input/output
- **Terminologie cohérente** sans jargon ambigu
- **Progressive disclosure** bien conçue
- **Aucune information sensible au temps** (versions, dates) qui deviendrait obsolète

Pour la sécurité, traiter les skills comme des **extensions de navigateur** : pratiques quand ils proviennent de sources fiables, potentiellement catastrophiques quand compromis. Auditer le code des scripts bundled, vérifier les dépendances, et utiliser `allowed-tools` pour restreindre les capacités au strict nécessaire.

## Conclusion

Les skills transforment Claude Code d'un assistant générique en un expert métier personnalisé. Leur force réside dans la **modularité** (un skill = une capacité), la **découverte automatique** (Claude charge ce qui est pertinent), et l'**extensibilité** (scripts, références, intégration MCP). Les repositories officiels `anthropics/skills` et communautaires comme `obra/superpowers` offrent des exemples immédiatement réutilisables. La clé du succès est de commencer simple — un SKILL.md avec des instructions claires — puis d'itérer en ajoutant scripts et références selon les besoins réels plutôt que hypothétiques.