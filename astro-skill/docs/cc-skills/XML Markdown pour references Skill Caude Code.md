# Syntaxe XML/Markdown pour les fichiers références de Skills Claude Code

> Adapter le pattern GSD « XML sémantique + Markdown interne » aux fichiers `references/` d'un skill — ce qui s'applique, ce qui ne s'applique pas, et comment décider.

---

## Le principe fondamental

Claude a été **spécifiquement entraîné** pour reconnaître les balises XML comme mécanisme d'organisation des prompts. Ce n'est pas du parsing XML formel : Claude traite les balises comme des **marqueurs sémantiques** qui créent des frontières claires exploitées par le mécanisme d'attention du Transformer.

Le système GSD (Get Shit Done) a codifié ce principe en règle n°1 :

> **XML pour la structure sémantique, Markdown pour le contenu.**

Concrètement, les balises XML délimitent les **zones fonctionnelles** d'un fichier, tandis que le Markdown structure le contenu **à l'intérieur** de chaque zone. Ce pattern hybride combine le meilleur des deux mondes : la précision structurelle du XML et la lisibilité du Markdown.

```xml
<conventions>
## Naming
Routes en kebab-case, handlers en camelCase.

## Error Responses
Toujours retourner `{ error: string, code: number }`.
</conventions>

<examples>
## Correct
```ts
app.get('/user-profile', getUserProfile)
```

## Incorrect
```ts
app.get('/getUserProfile', get_user_profile)
```
</examples>
```

Les bénéfices mesurés : **10-42% d'amélioration** en instruction-following sur les tâches complexes, avec un overhead token de seulement 5-10% (études Microsoft 2024 et benchmarks communautaires).

---

## Contexte : comment un skill charge ses références

Comprendre le mécanisme de chargement est essentiel pour choisir le bon niveau de structuration.

Le processus fonctionne en **trois niveaux de progressive disclosure** :

1. **Au démarrage** — Claude charge uniquement les métadonnées (nom + description) de chaque skill disponible (~100 tokens par skill)
2. **À l'activation** — Claude charge le `SKILL.md` complet (recommandé < 5000 tokens)
3. **À la demande** — Les fichiers de support (`references/`, `templates/`, `scripts/`) sont chargés quand SKILL.md les référence

Les fichiers `references/` sont donc chargés **on-demand dans un contexte déjà occupé**. Chaque token compte. La règle d'or : les références depuis SKILL.md restent à **un seul niveau de profondeur** — pas de chaînes `SKILL.md → advanced.md → details.md → actual-info.md`.

---

## Ce qui s'applique aux fichiers références

### Les conteneurs XML sémantiques

Le pattern central de GSD est directement transposable : envelopper chaque section fonctionnelle d'un fichier de référence dans une balise XML au nom descriptif.

```xml
<!-- references/api-patterns.md -->

<routing_rules>
## URL Structure
Toutes les routes API suivent le pattern `/api/v{version}/{resource}`.
Les ressources sont en kebab-case au pluriel.

## HTTP Methods
- `GET` pour la lecture (jamais d'effets de bord)
- `POST` pour la création
- `PUT` pour le remplacement complet
- `PATCH` pour la mise à jour partielle
- `DELETE` pour la suppression (soft delete par défaut)
</routing_rules>

<error_handling>
## Format standard
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with id 123 not found",
    "status": 404
  }
}
```

## Codes d'erreur métier
Préfixer par le domaine : `AUTH_`, `BILLING_`, `USER_`.
Ne jamais exposer les détails d'implémentation dans les messages d'erreur.
</error_handling>
```

**Pourquoi ça fonctionne** : quand Claude charge ce fichier en contexte, les balises XML créent des frontières d'attention claires. Si une tâche concerne la gestion d'erreurs, le mécanisme d'attention se concentre naturellement sur le bloc `<error_handling>` plutôt que de scanner tout le fichier.

### Le mixing XML + Markdown

Anthropic recommande explicitement ce mixing. À l'intérieur d'un conteneur XML, utiliser les headers Markdown (`##`, `###`) pour la hiérarchie, les listes pour les énumérations, et les blocs de code fenced pour les exemples.

```xml
<validation_rules>
## Input Validation
Valider côté serveur **même si** la validation client existe.

### Champs obligatoires
Retourner `400` avec la liste de tous les champs manquants (pas un par un).

### Sanitization
- Échapper le HTML dans tout input utilisateur
- Limiter les strings à 10 000 caractères par défaut
- Rejeter les fichiers > 10 MB sauf configuration explicite
</validation_rules>
```

### Les attributs XML pour la différenciation

Les attributs sont fonctionnels et utiles quand plusieurs éléments partagent le même type :

```xml
<pattern name="repository" category="data-access">
## Responsabilité
Abstraire l'accès aux données. Un repository par entité métier.

## Interface
```ts
interface Repository<T> {
  findById(id: string): Promise<T | null>
  findMany(filter: Filter<T>): Promise<T[]>
  create(data: CreateInput<T>): Promise<T>
  update(id: string, data: UpdateInput<T>): Promise<T>
  delete(id: string): Promise<void>
}
```
</pattern>

<pattern name="service" category="business-logic">
## Responsabilité
Orchestrer la logique métier. Un service peut utiliser plusieurs repositories.

## Règle
Jamais d'accès direct à la base de données depuis un service —
toujours passer par le repository.
</pattern>
```

### La séparation rules/examples

Un pattern récurrent et efficace : séparer les règles des exemples dans des conteneurs distincts. Claude distingue mieux ce qu'il doit **suivre** de ce qu'il doit **imiter**.

```xml
<rules>
## Composants Vue
- Un composant = un fichier `.vue`
- Props typées avec `defineProps<T>()`
- Emits typés avec `defineEmits<T>()`
- Pas de `any` dans les types
- Composition API uniquement (pas d'Options API)
</rules>

<examples>
## Composant bien structuré
```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
}
const props = withDefaults(defineProps<Props>(), {
  count: 0,
})

const emit = defineEmits<{
  update: [value: number]
}>()
</script>
```

## Anti-pattern
```vue
<!-- ❌ Options API + props non typées -->
<script>
export default {
  props: ['title', 'count'],
}
</script>
```
</examples>
```

---

## Ce qui NE s'applique PAS

Le style GSD contient des éléments spécifiques à son paradigme **plans-as-prompts / multi-agents orchestrés** qui n'ont pas leur place dans des fichiers de référence de skills.

### Le format de tâche exécutable

```xml
<!-- ❌ NE PAS utiliser dans des références de skill -->
<task type="auto">
  <n>Create login endpoint</n>
  <files>src/api/auth/login.ts</files>
  <action>POST endpoint accepting {email, password}...</action>
  <verify>curl -X POST localhost:3000/api/auth/login</verify>
  <done>Valid credentials → 200 + cookie</done>
</task>
```

Ce format est conçu pour que Claude **exécute** séquentiellement des tâches dans un plan. Un fichier de référence est **descriptif**, pas prescriptif — il documente des conventions, pas des actions à effectuer.

### Le système de checkpoints et gates

```xml
<!-- ❌ Spécifique à l'orchestration GSD -->
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Description</what-built>
  <how-to-verify>Steps</how-to-verify>
  <resume-signal>Continue</resume-signal>
</task>
```

Les checkpoints sont un mécanisme d'interaction humain-agent pendant l'exécution d'un plan. Les références de skills n'ont pas de flux d'exécution interactif.

### La logique conditionnelle

```xml
<!-- ❌ Spécifique aux modes GSD -->
<if mode="yolo">
  Skip all verifications
</if>
```

Les fichiers de référence fournissent de la connaissance statique. La logique conditionnelle appartient au `SKILL.md` lui-même ou aux slash commands.

### Les @-references de lazy loading

```markdown
<!-- ❌ Pattern GSD, pas natif aux références -->
@~/.claude/get-shit-done/workflows/execute-phase.md
@.planning/PROJECT.md (if exists)
```

Les `@-references` sont le mécanisme de lazy loading de GSD entre ses propres fichiers. Dans un skill, c'est le `SKILL.md` qui orchestre les références vers les fichiers de support — les fichiers de référence eux-mêmes ne devraient pas chaîner vers d'autres fichiers (règle du niveau unique de profondeur).

### Les tags de workflow/process

```xml
<!-- ❌ Pour workflows et commandes, pas pour références -->
<process>
  <step name="initialize" priority="first">...</step>
  <step name="execute">...</step>
  <step name="complete">...</step>
</process>

<success_criteria>
- [ ] Critère 1
- [ ] Critère 2
</success_criteria>
```

Ces structures appartiennent aux **commandes** et **workflows** qui définissent des séquences d'actions. GSD-STYLE.md le confirme : les références ont une *"internal organization [that] varies — semantic sub-containers, markdown headers within XML, code examples"*. Même GSD n'applique pas son format de commandes à ses propres fichiers de référence.

---

## Arbre de décision : quand utiliser XML dans une référence

```
Le fichier de référence contient-il 3+ sections distinctes ?
├── NON → Markdown pur suffit
└── OUI → Le fichier dépasse-t-il 500 tokens ?
    ├── NON → Markdown pur (overhead XML non rentabilisé)
    └── OUI → Utiliser des conteneurs XML sémantiques
        │
        ├── Sections mixant règles et exemples ?
        │   └── OUI → Séparer <rules> et <examples>
        │
        ├── Éléments répétés du même type ?
        │   └── OUI → Attributs XML pour différencier
        │       Ex: <pattern name="repository">
        │
        └── Code source dans les exemples ?
            └── OUI → Blocs fenced à l'intérieur du XML
                Ex: <examples>```ts ... ```</examples>
```

### Récapitulatif par situation

| Situation | Format recommandé | Justification |
|-----------|-------------------|---------------|
| Fichier court (< 500 tokens), 1-2 sections | Markdown pur | Overhead XML non rentable |
| Fichier multi-sections (3+), > 500 tokens | XML sémantique + Markdown | Gains d'attention mesurables |
| Référence contenant règles + exemples | `<rules>` + `<examples>` séparés | Claude distingue mieux les deux |
| Patterns architecturaux multiples | `<pattern name="...">` avec attributs | Différenciation claire |
| Template à remplir par Claude | XML pour les sections, Markdown interne | Structure de sortie guidée |
| Checklist simple | Markdown pur | Pas besoin de frontières sémantiques |

---

## Conventions de nommage des balises

Deux patterns observés dans la documentation Anthropic et le système GSD :

| Convention | Exemple | Usage |
|------------|---------|-------|
| **snake_case** | `<error_handling>`, `<routing_rules>` | Balises composées (recommandé) |
| **Mot simple** | `<rules>`, `<examples>`, `<conventions>` | Balises courtes courantes |

Règles à suivre :

- Les noms décrivent le **contenu**, pas le format — `<api_conventions>` plutôt que `<section_2>`
- Cohérence au sein d'un même fichier — ne pas mélanger `<errorHandling>` et `<routing_rules>`
- Profondeur maximale : **2-3 niveaux** d'imbrication, au-delà les bénéfices diminuent
- Pas de balises auto-fermantes (`<tag/>`) — pas documenté par Anthropic

---

## Anti-patterns à éviter

### Over-tagging : granularité excessive

```xml
<!-- ❌ Chaque paragraphe dans sa propre balise -->
<section>
  <subsection>
    <rule>
      <description>Utiliser kebab-case</description>
    </rule>
  </subsection>
</section>

<!-- ✅ Un conteneur sémantique, Markdown à l'intérieur -->
<naming_conventions>
## Routes
Utiliser kebab-case pour toutes les URLs.
## Variables
camelCase en TypeScript, snake_case en Python.
</naming_conventions>
```

### Reproduire le format commande/workflow dans une référence

```xml
<!-- ❌ Format commande GSD appliqué à une référence -->
<objective>Documenter les conventions API</objective>
<execution_context>@references/api.md</execution_context>
<process>
  <step name="load">Charger les conventions</step>
  <step name="apply">Appliquer aux fichiers</step>
</process>
<success_criteria>
- [ ] Conventions respectées
</success_criteria>

<!-- ✅ Format référence : descriptif, pas prescriptif -->
<api_conventions>
## URL Structure
Routes en kebab-case, ressources au pluriel.

## Response Format
Envelope standard : `{ data, meta, error }`.
</api_conventions>
```

### Balises qui dupliquent les headers Markdown

```xml
<!-- ❌ Redondant : la balise et le header disent la même chose -->
<error_handling>
## Error Handling
...
</error_handling>

<!-- ✅ La balise structure, le header précise -->
<error_handling>
## Format de réponse
...
## Codes métier
...
</error_handling>
```

### Fichier trop structuré pour son contenu

```xml
<!-- ❌ 200 tokens de contenu, 50 tokens de balisage XML -->
<conventions>
  <naming>
    <routes>kebab-case</routes>
    <handlers>camelCase</handlers>
  </naming>
</conventions>

<!-- ✅ Markdown suffit pour un contenu aussi court -->
## Naming
- Routes : kebab-case
- Handlers : camelCase
```

---

## Exemple complet : référence de skill avec syntaxe adaptée

```xml
<!-- .claude/skills/nuxt-cloudflare/references/deployment.md -->

<cloudflare_pages>
## Configuration Wrangler
Le fichier `wrangler.toml` à la racine du projet définit l'environnement de déploiement.

```toml
name = "my-app"
compatibility_date = "2025-01-01"
pages_build_output_dir = ".output/public"
```

## Variables d'environnement
Définir dans le dashboard Cloudflare, jamais dans `wrangler.toml`.
Accéder via `process.env` côté serveur ou `useRuntimeConfig()` côté Nuxt.

## Bindings
- **KV** : cache, sessions, feature flags
- **D1** : base de données SQL (SQLite-compatible)
- **R2** : stockage d'objets (compatible S3)
</cloudflare_pages>

<deployment_checklist>
## Avant chaque déploiement
- Build local réussi (`npm run build`)
- Tests passent (`npm run test`)
- Variables d'environnement vérifiées sur le dashboard
- Aucun secret dans le code source

## Commandes
```bash
# Preview
npx wrangler pages dev .output/public

# Production
npx wrangler pages deploy .output/public
```
</deployment_checklist>

<common_pitfalls>
## Erreurs fréquentes
- **Node.js APIs** : pas de `fs`, `path`, `crypto` natif — utiliser les polyfills Cloudflare
- **Cold starts** : les Workers ont un temps de démarrage, ne pas charger de gros modules au top-level
- **Taille du bundle** : limite de 1 MB pour les Workers — surveiller avec `wrangler deploy --dry-run`
- **D1 en production** : pas de migrations automatiques, gérer manuellement via `wrangler d1 migrations`
</common_pitfalls>
```

---

## Synthèse

Le pattern GSD « XML sémantique + Markdown interne » est un **principe général validé par Anthropic** qui s'applique bien aux fichiers de référence de skills, à condition de respecter la distinction entre ce qui est transposable (conteneurs sémantiques, mixing XML/Markdown, séparation rules/examples) et ce qui est spécifique à GSD (format de tâches exécutables, checkpoints, @-references, logique conditionnelle).

La règle de décision est simple : si le fichier de référence dépasse 500 tokens et contient 3+ sections fonctionnellement distinctes, l'investissement en balises XML (5-17% d'overhead) est rentabilisé par les gains en précision d'attention de Claude. En dessous de ce seuil, le Markdown pur reste le choix le plus efficient.