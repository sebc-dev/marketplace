<context_resolution>

## Vue d'ensemble

La résolution de contexte enrichit la review avec des informations métier (tickets, specs, documents). Elle est déterministe — pas de raisonnement LLM, uniquement des appels API + formatting.

## Sources supportées

### `ticket:<ref>` — Ticket Jira / GitHub Issue / GitLab Issue

```bash
bash .claude/review/scripts/scd.sh context resolve ticket <ref> \
  .claude/review/sessions <branch> .claude/review/config.json
```

**Résolution par plateforme :**
- `platform.type == "github"` → `gh issue view <ref> --json title,body,labels`
- `platform.type == "gitlab"` → `glab issue view <ref>` ou API GitLab
- `context.jira_api_url` configuré → `curl -H "Authorization: Bearer $JIRA_TOKEN" <url>/rest/api/3/issue/<ref>`

**Output :** section dans `<slug>-context.md` :
```markdown
## Ticket: PROJ-123 — Titre du ticket
**Source:** GitLab Issue #123
**Labels:** feature, security, P1

### Description
[corps du ticket]

### Acceptance Criteria
[si présents dans le corps]
```

### `file:<chemin>` — Fichier local (spec, PRD, doc archi)

```bash
bash .claude/review/scripts/scd.sh context resolve file specs/auth.md \
  .claude/review/sessions <branch> .claude/review/config.json
```

**Comportement :**
- Si fichier < `context.max_context_lines` (défaut 200) → copie intégrale
- Si fichier > seuil → copie les N premières lignes + avertissement `[...truncated]`

### `url:<url>` — URL externe (Confluence, Notion, etc.)

```bash
bash .claude/review/scripts/scd.sh context resolve url https://... \
  .claude/review/sessions <branch> .claude/review/config.json
```

**Comportement :**
- `curl -sL --max-time 15 <url>` + strip HTML basique
- Truncation à `context.max_context_lines`

## Fichier de sortie

Chemin : `.claude/review/sessions/<branch-slug>-context.md`

Structure finale (après une ou plusieurs résolutions) :
```markdown
# Review Context

---

## Ticket: PROJ-123 — OAuth2 Implementation
**Source:** GitLab Issue #123
...

---

## Spec: specs/auth.md
[contenu]

---

## URL: https://confluence.example.com/...
[contenu extrait]
```

## Injection dans les agents

Les agents `code-reviewer` et `test-reviewer` reçoivent le contexte via une `@`-reference conditionnelle dans leur prompt :

```
@.claude/review/sessions/<slug>-context.md
```

Cette référence n'est ajoutée au prompt que si le fichier existe (vérification côté orchestrateur avant de lancer l'agent). Si le fichier n'existe pas → aucun impact sur le prompt, aucun overhead.

Les agents utilisent ce contexte pour évaluer :
- Si l'implémentation respecte les acceptance criteria
- Si les edge cases du ticket sont gérés
- Si le naming reflète le vocabulaire du domaine

## Nettoyage

```bash
bash .claude/review/scripts/scd.sh context clear .claude/review/sessions <branch>
```

Supprime le fichier `<slug>-context.md`. Utile pour relancer une review sans contexte.

## Configuration

Dans `config.json` :
```json
{
  "context": {
    "jira_api_url": "https://myorg.atlassian.net",
    "jira_auth_token_env": "JIRA_TOKEN",
    "max_context_lines": 200
  }
}
```

`jira_auth_token_env` : nom de la variable d'environnement contenant le token (pas la valeur directement, pour éviter de la stocker dans config.json).

</context_resolution>
