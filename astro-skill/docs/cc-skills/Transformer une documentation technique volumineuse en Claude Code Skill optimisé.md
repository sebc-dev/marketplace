# Transformer une documentation technique volumineuse en Claude Code Skill optimisé

La création de skills à partir de documentation technique volumineuse (>100 pages) exige une méthodologie rigoureuse de **condensation intelligente** plutôt que de simple résumé. Le principe fondamental : le context window est une ressource partagée où chaque token doit apporter une valeur maximale. La documentation officielle Anthropic établit un plafond de **500 lignes** pour SKILL.md, mais la vraie contrainte est l'efficacité — les skills les plus performants atteignent **100% de pertinence** avec moins de 1000 tokens grâce au progressive disclosure.

---

# SECTION A : Knowledge Document

_[Format optimisé pour injection dans CLAUDE.md ou Project Knowledge]_

---

## Skill Creation from Technical Documentation

### Core Architecture [OFFICIEL - Confiance élevée]

```
skill-name/
├── SKILL.md              # REQUIS - instructions principales (<500 lignes)
├── references/           # Documentation détaillée (chargée à la demande)
│   ├── api-reference.md
│   └── troubleshooting.md
├── scripts/              # Code exécutable (output seul consomme tokens)
│   └── validate.py
└── assets/               # Templates et fichiers de sortie
```

**Progressive Disclosure** - trois niveaux de chargement :

|Niveau|Quand|Coût tokens|Contenu|
|---|---|---|---|
|1 - Metadata|Toujours (startup)|~100 tokens|`name` + `description` frontmatter|
|2 - Instructions|Skill déclenché|<5k tokens|Corps SKILL.md|
|3 - Ressources|À la demande|Illimité|Fichiers references/ et scripts/|

### Frontmatter Pattern [OFFICIEL - Confiance élevée]

```yaml
---
name: framework-api-skill
description: |
  Génère du code conforme à [Framework] API. Utiliser quand :
  - L'utilisateur mentionne [Framework], [termes spécifiques]
  - Fichiers *.framework détectés dans le projet
  - Questions sur [patterns spécifiques au framework]
---
```

**Règles frontmatter** :

- `name` : max 64 caractères, minuscules+tirets uniquement
- `description` : max 1024 caractères, DOIT inclure QUOI + QUAND utiliser
- Mots-clés spécifiques = meilleur triggering (pas de termes vagues)

### Decision Framework : Que mettre où [INFÉRÉ - Confiance moyenne]

```
QUESTION : Cette information est-elle...

├─ Évidente pour Claude (training data) ?
│   └─ NE PAS INCLURE
│
├─ Procédurale (workflow, étapes) ?
│   └─ SKILL.md (instructions directes)
│
├─ Référentielle (specs, schemas, API) ?
│   └─ references/ (grep hints dans SKILL.md)
│
├─ Déterministe (validation, transformation) ?
│   └─ scripts/ (exécution sans charger le code)
│
└─ Template/boilerplate ?
    └─ assets/ (copié, pas lu)
```

### Chunking Large Documentation [COMMUNAUTAIRE + INFÉRÉ - Confiance moyenne]

**Stratégie de découpage pour docs >100 pages** :

1. **Identifier les domaines orthogonaux**
    
    ```
    references/
    ├── authentication.md   # Domaine: Auth
    ├── data-models.md      # Domaine: Schema
    ├── api-endpoints.md    # Domaine: API
    └── error-handling.md   # Domaine: Errors
    ```
    
2. **Écrire grep hints dans SKILL.md**
    
    ```markdown
    ## Navigation références
    - Auth/JWT : `grep -n "bearer\|token\|jwt" references/authentication.md`
    - Endpoints REST : `grep -n "^### " references/api-endpoints.md`
    - Codes erreur : `grep -n "^[0-9]{3}" references/error-handling.md`
    ```
    
3. **Limiter la profondeur à UN niveau** depuis SKILL.md [OFFICIEL]
    

### Condensation Technique [INFÉRÉ - Confiance moyenne]

**Transformer 200 pages → 500 lignes efficaces** :

|Source|Transformation|Cible|
|---|---|---|
|Tutoriel détaillé|Workflow numéroté|10-20 lignes SKILL.md|
|API complète|Table sommaire + grep hints|50 lignes + reference file|
|Exemples multiples|1-2 exemples canoniques|20 lignes|
|Configuration options|Decision tree|15 lignes|
|Error messages|Script de validation|scripts/validate.py|

**Règle de condensation** : Chaque paragraphe source → 1 phrase instruction OU supprimé si Claude sait déjà.

### Triggering Optimization [OFFICIEL + COMMUNAUTAIRE - Confiance élevée]

**Le description field est critique** — Claude utilise le raisonnement LLM (pas embeddings) pour décider d'activer un skill.

```yaml
# ❌ MAUVAIS - Vague, ne déclenchera pas
description: Aide avec le développement API

# ✅ BON - Spécifique, termes déclencheurs
description: |
  Génère endpoints FastAPI conformes au projet. Utiliser quand :
  - Création de routes /api/v1/*
  - Questions sur Pydantic models, dependencies injection
  - Fichiers routers/*.py modifiés
  NE PAS utiliser pour : Frontend, tests unitaires
```

### Scripts vs Instructions [OFFICIEL - Confiance élevée]

**Utiliser scripts/ quand** :

- Tâche déterministe (validation, transformation)
- Même code réécrit plusieurs fois par Claude
- Fiabilité critique (calculs, parsing)
- Output structuré requis (JSON, YAML)

**Avantage scripts** : Le code n'entre PAS dans le context window — seul l'output y entre.

```python
# scripts/validate_config.py
# Claude exécute: python scripts/validate_config.py config.yaml
# Seul le résultat entre dans le contexte, pas le code du script
```

### Patterns de Structure par Type de Documentation

**API REST/GraphQL** [INFÉRÉ - Confiance moyenne]

```
api-skill/
├── SKILL.md          # Conventions, auth pattern, workflow type requête
├── references/
│   ├── endpoints.md  # Table: Method | Path | Params | Response
│   └── schemas.md    # Définitions types principaux
└── scripts/
    └── generate_client.py  # Génération boilerplate
```

**Framework/Library** [INFÉRÉ - Confiance moyenne]

```
framework-skill/
├── SKILL.md          # Patterns recommandés, anti-patterns critiques
├── references/
│   ├── components.md # API composants principaux
│   ├── hooks.md      # Hooks/lifecycle disponibles
│   └── migration.md  # Changements breaking versions
└── assets/
    └── component-template.tsx
```

**Configuration/Déploiement** [INFÉRÉ - Confiance moyenne]

```
deploy-skill/
├── SKILL.md          # Decision tree: env → config appropriée
├── references/
│   └── env-variables.md  # Table complète variables
└── scripts/
    ├── validate_env.sh
    └── generate_config.py
```

### Failed Attempts Documentation [COMMUNAUTAIRE - Confiance élevée]

Pattern validé par équipes ML production (Sionic AI) :

```markdown
## Tentatives échouées (LIRE AVANT DE COMMENCER)

| Approche | Pourquoi échec | Leçon |
|----------|---------------|-------|
| ORM auto-mapping | Performance N+1 queries | Toujours requêtes explicites |
| Config YAML nested | Parsing ambigu | Flat structure + namespaces |
| Async everywhere | Deadlock sur DB calls | Sync pour opérations DB |
```

**Citation** : "Les histoires d'échec indiquent quels chemins éviter entièrement. La table 'Failed Attempts' est lue plus que toute autre section."

---

# SECTION B : Checklists et Anti-patterns

---

## Checklist Pré-création (Analyse documentation)

### Phase 1 : Évaluation initiale

- [ ] **Taille documentation** : Compter pages/mots totaux
- [ ] **Identifier domaines orthogonaux** : Lister les sections indépendantes
- [ ] **Tester connaissances Claude** : Poser questions basiques sans skill → marquer ce que Claude sait déjà
- [ ] **Lister use cases cibles** : 5-10 scénarios utilisateur concrets
- [ ] **Identifier informations volatiles** : Versions, dates, URLs qui changeront

### Phase 2 : Triage contenu

- [ ] **Catégoriser chaque section** :
    - 🟢 Procédural → SKILL.md
    - 🔵 Référentiel → references/
    - 🟡 Déterministe → scripts/
    - ⚫ Redondant avec Claude → SUPPRIMER
- [ ] **Prioriser par fréquence d'usage** : 80/20 rule
- [ ] **Identifier dépendances** : Section A requiert B ?
- [ ] **Marquer anti-patterns critiques** : Erreurs coûteuses à documenter

### Phase 3 : Validation scope

- [ ] **Estimation tokens** : <500 lignes SKILL.md, <15k chars descriptions totales
- [ ] **Test mental** : "Si Claude lit seulement SKILL.md, peut-il accomplir 80% des tâches ?"
- [ ] **Définir boundaries** : Ce skill NE couvre PAS...

---

## Checklist Structuration (Organisation fichiers)

### Structure de base

- [ ] Créer répertoire `skill-name/` (minuscules, tirets)
- [ ] Créer `SKILL.md` avec frontmatter valide
- [ ] Créer `references/` si docs >50 lignes après condensation
- [ ] Créer `scripts/` si tâches déterministes identifiées

### Frontmatter [OFFICIEL]

- [ ] `name` : ≤64 chars, `[a-z0-9-]` uniquement
- [ ] `description` : ≤1024 chars, inclut QUOI + QUAND + exemples déclencheurs
- [ ] Pas de XML tags dans frontmatter
- [ ] Pas de "anthropic" ou "claude" dans name

### Organisation références [OFFICIEL]

- [ ] **UN niveau de profondeur** depuis SKILL.md (pas de references/sub/sub/)
- [ ] Fichiers >100 lignes : ajouter table des matières
- [ ] Noms descriptifs : `api-endpoints.md` pas `ref1.md`
- [ ] Grep hints dans SKILL.md pour chaque fichier référence

### Scripts

- [ ] Shebang approprié (`#!/usr/bin/env python3`)
- [ ] Gestion erreurs explicite (pas "punt to Claude")
- [ ] Output structuré (JSON préféré pour parsing)
- [ ] Testé manuellement avant intégration

---

## Checklist Rédaction (Contenu SKILL.md)

### Format et style [OFFICIEL + COMMUNAUTAIRE]

- [ ] **Impératif/infinitif** : "Valider le schema" pas "Tu dois valider"
- [ ] **Troisième personne pour description** : "Ce skill devrait être utilisé quand..."
- [ ] **Sections claires** : Instructions, Examples, Guidelines, References, Troubleshooting
- [ ] **Pas de bullet points <5 mots** (phrases complètes)

### Contenu obligatoire

- [ ] **Quick start** : 5-10 lignes pour cas simple
- [ ] **Workflow principal** : Étapes numérotées
- [ ] **Navigation références** : Grep hints et liens
- [ ] **Anti-patterns critiques** : 3-5 erreurs à éviter absolument
- [ ] **Failed attempts** : Table si expérience documentée existe

### Contenu à ÉVITER [OFFICIEL]

- [ ] ❌ Information que Claude connaît déjà (tester d'abord!)
- [ ] ❌ Chemins Windows (`scripts\helper.py` → `scripts/helper.py`)
- [ ] ❌ Information time-sensitive sans marqueur "OLD PATTERNS"
- [ ] ❌ Trop d'options sans défaut recommandé
- [ ] ❌ Références profondément imbriquées

### Test de concision

- [ ] Chaque phrase : "Claude a-t-il VRAIMENT besoin de ceci ?"
- [ ] Chaque exemple : Peut-on le raccourcir de 50% ?
- [ ] Chaque section : Est-ce une duplication d'une autre source ?

---

## Checklist Validation (Tests et qualité)

### Tests de triggering [OFFICIEL + COMMUNAUTAIRE]

- [ ] **Test positif** : 5 prompts qui DEVRAIENT activer le skill
- [ ] **Test négatif** : 3 prompts qui NE devraient PAS l'activer
- [ ] **Test ambiguïté** : Prompts edge-case
- [ ] **Vérifier avec `/context`** : Skill apparaît dans budget ?

### Tests fonctionnels

- [ ] **Cas simple** : Workflow de base fonctionne ?
- [ ] **Cas complexe** : Références chargées correctement ?
- [ ] **Scripts** : Exécution sans erreur ?
- [ ] **Multi-modèle** : Tester Haiku ET Sonnet (comportement différent!) [OFFICIEL]

### Tests de régression [OFFICIEL - Enterprise]

- [ ] **Isolation** : Skill seul fonctionne
- [ ] **Coexistence** : Skill + autres skills existants fonctionne
- [ ] **3-5 queries représentatives** par skill documentées

### Debug [OFFICIEL]

- [ ] `claude --debug` : Vérifier chargement sans erreurs
- [ ] `/context` : Budget skills non dépassé
- [ ] `cat SKILL.md | head -n 10` : YAML valide

---

## Anti-patterns Critiques

### Anti-patterns de Conception

|Anti-pattern|Problème|Solution|Confiance|
|---|---|---|---|
|**Skill monolithique**|1500+ lignes, progressive disclosure défait|Splitter: main <500 lignes + references/|[OFFICIEL] Élevée|
|**Slash commands complexes**|Crée vocabulaire à apprendre, défait langage naturel|Skills triggering automatique par description|[COMMUNAUTAIRE] Élevée|
|**Sur-spécification CLAUDE.md**|Règles importantes noyées dans le bruit|Élaguer ruthlessly, convertir en hooks|[COMMUNAUTAIRE] Élevée|
|**Skills pour problèmes hypothétiques**|Design inadapté car pas de feedback réel|Attendre la douleur réelle avant de créer|[COMMUNAUTAIRE] Moyenne|
|**Super-skills tout-en-un**|Difficile à maintenir, trigger trop large|Skills composables et focalisés|[COMMUNAUTAIRE] Moyenne|

### Anti-patterns de Contenu

|Anti-pattern|Exemple|Correction|Confiance|
|---|---|---|---|
|**Redondance Claude knowledge**|Expliquer syntaxe JavaScript basique|Supprimer — Claude sait déjà|[OFFICIEL] Élevée|
|**Description vague**|"Aide avec le développement"|Termes spécifiques + scénarios + file patterns|[OFFICIEL] Élevée|
|**Exemples trop nombreux**|10 variations du même pattern|1-2 exemples canoniques suffisent|[INFÉRÉ] Moyenne|
|**Références sans grep hints**|"Voir reference.md pour détails"|Inclure patterns grep spécifiques|[OFFICIEL] Élevée|
|**Info time-sensitive non marquée**|"API v2.3 actuelle"|Section "OLD PATTERNS" datée|[OFFICIEL] Élevée|

### Anti-patterns d'Organisation

|Anti-pattern|Problème|Solution|Confiance|
|---|---|---|---|
|**Références orphelines**|Fichiers dans references/ jamais mentionnés|Chaque fichier réf → mention dans SKILL.md|[INFÉRÉ] Moyenne|
|**Nesting profond**|references/sub/sub/file.md|Maximum 1 niveau depuis SKILL.md|[OFFICIEL] Élevée|
|**Duplication SKILL.md ↔ references/**|Même info deux endroits|Information à UN endroit uniquement|[OFFICIEL] Élevée|
|**Scripts sans gestion erreurs**|Script crash → Claude confus|Erreurs explicites, messages clairs|[OFFICIEL] Élevée|

### Anti-patterns Runtime (Bugs connus)

|Problème|Impact|Workaround|Source|
|---|---|---|---|
|**Skills pas auto-activés**|Claude ignore skills disponibles|Hooks UserPromptSubmit pour forcer|[COMMUNAUTAIRE] #9716|
|**Duplication contexte**|Skill content ajouté à chaque invocation|Éviter invocations manuelles répétées|[COMMUNAUTAIRE] #21891|
|**Perte après compaction**|Skills oubliés après auto-compaction|Utiliser dev docs system|[COMMUNAUTAIRE] #13919|
|**Progressive disclosure cassé**|50k+ tokens au démarrage|Convertir en plugin format|[COMMUNAUTAIRE] #14882|

---

# SECTION C : Template Annoté de Skill

---

## Template SKILL.md Complet

````yaml
---
# [POURQUOI] name utilisé pour invocation /skill-name et identification
# [RÈGLE] max 64 chars, [a-z0-9-] uniquement, pas "anthropic"/"claude"
name: fastapi-crud-skill

# [POURQUOI] description = SEUL critère de triggering automatique par Claude
# [RÈGLE] max 1024 chars, DOIT inclure QUOI + QUAND + keywords spécifiques
# [CRITIQUE] Termes vagues = skill jamais activé
description: |
  Génère endpoints FastAPI CRUD conformes aux conventions projet.
  Utiliser quand :
  - Création/modification routes dans routers/*.py
  - Questions sur Pydantic models, dependency injection, middleware
  - Patterns async/await pour database operations
  - Mots-clés: FastAPI, endpoint, router, Pydantic, CRUD
  NE PAS utiliser pour : Frontend React, tests pytest, deployment Docker
---

# FastAPI CRUD Patterns

<!-- [POURQUOI] Quick start = 80% des cas en <20 lignes -->
## Quick Start

Pour créer un endpoint CRUD standard :

1. Définir Pydantic model dans `models/`
2. Créer router dans `routers/`
3. Implémenter service dans `services/`
4. Enregistrer router dans `main.py`

<!-- [POURQUOI] Workflow numéroté = guidance pas-à-pas -->
## Workflow création endpoint

- [ ] Vérifier model existe : `grep -l "class.*BaseModel" models/`
- [ ] Créer route avec annotations type complètes
- [ ] Ajouter dependency injection pour DB session
- [ ] Implémenter error handling avec HTTPException
- [ ] Documenter avec docstring OpenAPI-compatible

<!-- [POURQUOI] Anti-patterns = éviter erreurs coûteuses -->
## Anti-patterns CRITIQUES

| ❌ Ne pas faire | ✅ Faire | Raison |
|----------------|----------|--------|
| `async def` + ORM sync | `def` pour DB ops | Deadlock SQLAlchemy |
| Exception générique | `HTTPException(status_code=...)` | Codes HTTP appropriés |
| Validation manuelle | Pydantic validators | DRY, testable |

<!-- [POURQUOI] Failed attempts = chemins à éviter -->
## Tentatives échouées documentées

| Approche | Échec | Leçon |
|----------|-------|-------|
| Async DB queries partout | Connection pool exhaustion | Limiter concurrence DB |
| Generic response model | Typing cassé client | Response model par endpoint |

<!-- [POURQUOI] Navigation références = lazy loading efficace -->
## Références détaillées

Pour information approfondie, consulter :

- **Endpoints patterns** : `grep -n "^### " references/endpoints.md`
- **Pydantic avancé** : `grep -n "validator\|Config" references/models.md`
- **Error codes projet** : `references/errors.md` (table complète)

<!-- [POURQUOI] Scripts = tâches déterministes hors contexte -->
## Scripts utilitaires

```bash
# Valider structure router (output seul entre dans contexte)
python scripts/validate_router.py routers/new_router.py

# Générer boilerplate CRUD
python scripts/generate_crud.py --model User --table users
````

<!-- [POURQUOI] Exemples = 1-2 canoniques suffisent -->

## Exemple canonique

```python
# routers/items.py - Pattern CRUD complet
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.item import Item, ItemCreate
from services.item_service import ItemService
from dependencies import get_db

router = APIRouter(prefix="/items", tags=["items"])

@router.post("/", response_model=Item)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    """Create new item. Returns created item with ID."""
    return ItemService(db).create(item)
```

```

---

## Structure references/ par Type de Documentation

### Pour API REST volumineuse

```

references/ ├── endpoints.md # [FORMAT] Table: Method | Path | Auth | Params | Response ├── schemas.md # [FORMAT] Définitions TypeScript-like des types ├── errors.md # [FORMAT] Table: Code | Message | Cause | Resolution └── auth.md # [FORMAT] Flow diagrams ASCII, token handling

````

**Exemple endpoints.md :**
```markdown
# API Endpoints Reference

## Authentication
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | /auth/login | None | `{email, password}` | `{token, user}` |
| POST | /auth/refresh | Bearer | None | `{token}` |

## Users
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | /users/{id} | Bearer | None | `User` |
| PATCH | /users/{id} | Bearer+Owner | `Partial<User>` | `User` |
````

### Pour Framework/Library

```
references/
├── components.md     # [FORMAT] Component | Props | Usage | Gotchas
├── hooks.md          # [FORMAT] Hook | Params | Returns | When to use
├── migration.md      # [FORMAT] Version | Breaking changes | Migration path
└── patterns.md       # [FORMAT] Pattern name | Problem | Solution | Example
```

### Pour Configuration/Déploiement

```
references/
├── env-vars.md       # [FORMAT] VAR | Type | Default | Required | Description
├── docker.md         # [FORMAT] Dockerfiles annotés par environnement
└── troubleshooting.md # [FORMAT] Symptom | Cause | Fix
```

---

## Patterns Frontmatter Optimisés

### Skill toujours actif (coding standards)

```yaml
---
name: project-conventions
description: |
  Conventions code projet. S'applique à TOUT code généré.
  Patterns : naming, imports, error handling, logging.
  Active automatiquement pour tous fichiers *.py, *.ts.
---
```

### Skill domain-specific (triggering précis)

```yaml
---
name: payment-integration
description: |
  Intégration Stripe payments. Utiliser UNIQUEMENT quand :
  - Fichiers dans payments/, billing/, stripe*
  - Mots: payment, subscription, invoice, Stripe, checkout
  - Questions sur webhooks payment, refunds, disputes
  NE PAS utiliser : Auth, users, general API
---
```

### Skill manuel uniquement

```yaml
---
name: database-migration
description: Exécute migrations Alembic avec validations safety.
disable-model-invocation: true  # [POURQUOI] Opération destructive = user-only
---
```

### Skill background (contexte sans invocation user)

```yaml
---
name: legacy-patterns
description: Patterns legacy à éviter. Contexte pour migration code ancien.
user-invocable: false  # [POURQUOI] Référence interne, pas commande user
---
```

---

## Outils Recommandés [COMMUNAUTAIRE]

|Outil|Usage|URL|Confiance|
|---|---|---|---|
|**Skill_Seekers**|Convertit docs/repos/PDFs → skills automatiquement|github.com/yusufkaraaslan/Skill_Seekers|Moyenne|
|**obra/superpowers**|Library 20+ skills battle-tested|Plugin marketplace|Moyenne|
|**VoltAgent/awesome-agent-skills**|200+ community skills à étudier|github.com/VoltAgent/awesome-agent-skills|Moyenne|

---

## Sources et Attribution

### Sources Officielles Utilisées

- Anthropic Platform Docs: platform.claude.com/docs/en/agents-and-tools/agent-skills/
- Anthropic Engineering Blog: anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- GitHub anthropics/skills: github.com/anthropics/skills
- Agent Skills Specification: agentskills.io

### Sources Communautaires Principales

- Sionic AI Case Study: huggingface.co/blog/sionic-ai/claude-code-skills-training
- Lee Hanchung Deep Dive: leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive
- "Holy Trinity" Pattern: dev.to/diet-code103/claude-code-is-a-beast-tips-from-6-months-of-hardcore-use
- Production Experience: blog.sshh.io/p/how-i-use-every-claude-code-feature

### Issues GitHub Clés à Surveiller

- #21891 (duplication contexte), #14882 (progressive disclosure), #13919 (perte compaction), #9716 (skills ignorés)

---

## Récapitulatif des Niveaux de Confiance

|Recommandation|Source|Confiance|
|---|---|---|
|Structure SKILL.md + frontmatter|[OFFICIEL] Anthropic docs|**Élevée**|
|Limite 500 lignes SKILL.md|[OFFICIEL] Anthropic docs|**Élevée**|
|Progressive disclosure 3 niveaux|[OFFICIEL] Anthropic engineering|**Élevée**|
|Description = critère triggering|[OFFICIEL] Anthropic docs|**Élevée**|
|Scripts exécutent hors contexte|[OFFICIEL] Anthropic docs|**Élevée**|
|Target 1500-2000 mots SKILL.md|[COMMUNAUTAIRE] GitHub skills|Moyenne|
|Failed attempts tables|[COMMUNAUTAIRE] Sionic AI|Moyenne|
|Hooks pour forcer activation|[COMMUNAUTAIRE] Production users|Moyenne|
|Chunking par domaines orthogonaux|[INFÉRÉ] Cross-system analysis|Moyenne|
|Condensation paragraphe→phrase|[INFÉRÉ] Token optimization research|Moyenne|

**Note finale** : Les bugs de progressive disclosure et d'auto-activation sont documentés dans les GitHub issues mais pas officiellement reconnus par Anthropic. Le workaround hooks est communautaire. Tester systématiquement le triggering dans votre environnement spécifique.