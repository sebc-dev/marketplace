<init_workflow>
## Workflow d'initialisation v2

### Phase 0 — Migration config v0.13.0 → v2 (si applicable)

Si `.claude/review/config.json` existe et ne contient pas le champ `"version"` :
1. Lire la config actuelle
2. Ajouter les nouveaux champs v2 avec leurs valeurs par défaut (depuis @references/default-config.json) :
   - `version: "2.0.0"`
   - `model_profile`, `model_overrides`, `default_output`
   - `pipeline`, `context`, `environment`
3. Supprimer les anciens champs v0.13.0 obsolètes : `auto_mode`, `platform.inline_comments`
4. Marquer toutes les sessions existantes de type `"apply"` comme `status: "abandoned"` si présentes
5. Écrire la config migrée avec Write
6. Afficher : "Config migrée v0.13.0 → v2.0.0"

### Phase 1 — Probe (automatique, zéro interaction)

**Vérification du cache en premier :**

```bash
bash .claude/review/scripts/scd.sh init detect-env .claude/review/config.json
```

Si le script retourne `CACHE_HIT: ...` → afficher le message et passer directement à la Phase 2.
Si le script retourne `PROBED: ...` → le cache a été mis à jour, continuer avec Phase 1-bis.

**Si probe nécessaire** (pas de cache valide) :

Lancer l'agent scout-alpha via Task :
```
Task(
  subagent_type: "scout-alpha",
  description: "Probe environnement review",
  prompt: "Scanne l'environnement de travail pour le système de code review."
)
```

Recevoir le JSON structuré de l'état. Stocker comme `probe`.

Si `probe.cache_hit == true` → utiliser `probe.environment` directement, passer à Phase 2.

### Phase 2 — Actions automatiques (basées sur probe)

Pour chaque step, vérifier `steps_status` dans la config. Si le step est déjà `"done"`, le sauter.

**Config** (`steps_status.config`) :
- Si `probe.config_exists == false` → créer `.claude/review/config.json` depuis @references/default-config.json avec Write
- Si config existe sans `"version"` → migration déjà faite en Phase 0, sinon migrer maintenant
- Marquer `"done"` via :
  ```bash
  bash .claude/review/scripts/scd.sh config update-state --nested \
    .claude/review/config.json '["steps_status","config"]' '"done"'
  ```

**Sessions dir** (`steps_status.sessions_dir`) :
- Si `probe.sessions_dir_exists == false` → créer `.claude/review/sessions/`
- Marquer `"done"` via :
  ```bash
  bash .claude/review/scripts/scd.sh config update-state --nested \
    .claude/review/config.json '["steps_status","sessions_dir"]' '"done"'
  ```

**Plugin root** (`steps_status.plugin_root`) :
- Utiliser `probe.plugin_root.detected` → persister dans config.json
- Si `probe.plugin_root.valid == false` → erreur : `Impossible de localiser le plugin scd-review. Vérifiez l'installation.`
- Marquer `"done"`

**Scripts** (`steps_status.scripts`) :
- Si `probe.scripts.missing` non vide → copier les manquants depuis `<plugin_root>/scripts/` vers `.claude/review/scripts/` avec Read + Write, puis `chmod +x .claude/review/scripts/scd.sh`
- Vérifier que `scd.sh` est bien installé (dispatcher v2)
- Marquer `"done"`

**Rules** (`steps_status.rules`) :
- Si `probe.rules.testing_principles_installed == false` → copier depuis `<plugin_root>/rules/testing-principles.md` vers `.claude/rules/testing-principles.md` avec Read + Write
- Marquer `"done"`

**JSON strategy** (`steps_status.json_strategy`) :
- Si `probe.jq.available == true` :
  ```bash
  bash .claude/review/scripts/scd.sh init detect-env .claude/review/config.json
  # json_strategy est maintenant dans config.environment.json_strategy
  # Persister dans config.json_strategy pour compatibilité
  ```
- Sinon → écrire `"readwrite"` dans `json_strategy`
- Marquer `"done"`

Persister `state.last_init` (ISO-8601), `state.plugin_version` (depuis plugin.json).

### Phase 3 — Checkpoint unique

Construire un résumé intelligent basé sur le probe.

**Actions effectuées** : lister ce qui a été installé/configuré automatiquement.

**Décision restante** : plateforme, basée sur la détection (même logique que v0.13.0) :

- `probe.platform_cli.gh.authenticated == true` →
  Proposer : "GitHub détecté et authentifié. Activer l'intégration PR ?" avec options :
  - "Oui — GitHub" (défaut) : activer `platform.type = "github"`
  - "Non — review locale" : `platform.type = null`

- `probe.platform_cli.glab.authenticated == true` →
  Même logique avec GitLab.
  Si `auth_method == "fallback_api"` → mentionner que l'auth a été vérifiée via API.

- Si gh ET glab sont authentifiés → proposer le choix entre les deux

- Rien détecté → proposer "Review locale uniquement" ou "Installer une CLI" (voir @references/cli-install-guide.md)

Un seul `AskUserQuestion` contextuel avec options adaptées à la situation.

### Phase 4 — Finalisation

Appliquer le choix plateforme → persister dans config.json.
Marquer `steps_status.platform` → `"done"`.

Rappeler les entrées gitignore si nécessaire (@references/gitignore-entries.md).

### Phase 5 — Structured return

**Si tout OK** :

```
## INIT COMPLETE v2.0.0

Configuration code-review initialisée :
  Plugin root    : <plugin_root>
  Stratégie JSON : jq | readwrite
  Plateforme     : GitHub (gh) | GitLab (glab) | Locale
  Config         : .claude/review/config.json
  Sessions       : .claude/review/sessions/
  Scripts        : .claude/review/scripts/scd.sh (dispatcher v2)
  Rule testing   : .claude/rules/testing-principles.md

### Next Steps
Lancez `/scd-review:run` pour démarrer une review.
Lancez `/scd-review:settings` pour configurer les profils de modèles.
```

**Si migration effectuée** : mentionner "Config migrée v0.13.0 → v2.0.0 — sessions apply abandonnées."

**Si partiel** (certains steps done, d'autres échoués) :

```
## INIT INCOMPLETE

Steps complétés : config, sessions_dir, plugin_root, scripts, rules
Steps échoués   : json_strategy (jq non disponible, readwrite appliqué)

Actions suggérées :
- Installer jq pour de meilleures performances JSON
- Relancer /scd-review:init pour compléter
```

**Si bloqué** (erreur critique) :

```
## INIT BLOCKED

Raison : <description de l'erreur>
Options :
- <action corrective 1>
- <action corrective 2>
```
</init_workflow>
