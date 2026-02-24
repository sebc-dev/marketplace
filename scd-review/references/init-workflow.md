<init_workflow>
## Workflow d'initialisation

### Phase 1 — Probe (automatique, zero interaction)

Lancer l'agent scout-alpha via Task :

```
Task(
  subagent_type: "scout-alpha",
  description: "Probe environnement review",
  prompt: "Scanne l'environnement de travail pour le systeme de code review."
)
```

Recevoir le JSON structure de l'etat. Stocker comme `probe`.

### Phase 2 — Actions automatiques (basees sur probe)

Pour chaque step, verifier `steps_status` dans la config (si elle existe). Si le step est deja `"done"`, le sauter.

**Config** (`steps_status.config`) :
- Si `probe.config_exists == false` → creer `.claude/review/config.json` depuis @references/default-config.json avec Write
- Si config existe mais `state` absent (ancienne config) → migrer : ajouter le sous-objet `state` avec valeurs par defaut
- Marquer `"done"` via : `bash .claude/review/scripts/update-config-state.sh --nested .claude/review/config.json '["steps_status","config"]' '"done"'`

**Sessions dir** (`steps_status.sessions_dir`) :
- Si `probe.sessions_dir_exists == false` → creer `.claude/review/sessions/`
- Marquer `"done"` via : `bash .claude/review/scripts/update-config-state.sh --nested .claude/review/config.json '["steps_status","sessions_dir"]' '"done"'`

**Plugin root** (`steps_status.plugin_root`) :
- Utiliser `probe.plugin_root.detected` → persister dans config.json avec jq ou Read+Write
- Si `probe.plugin_root.valid == false` → erreur : `Impossible de localiser le plugin scd-review. Verifiez l'installation.`
- Marquer `"done"`

**Scripts** (`steps_status.scripts`) :
- Si `probe.scripts.missing` non vide → copier les manquants depuis `<plugin_root>/scripts/` vers `.claude/review/scripts/` avec Read + Write, puis `chmod +x .claude/review/scripts/*.sh`
- Si tout est present → rien a faire
- Marquer `"done"`

**Rules** (`steps_status.rules`) :
- Si `probe.rules.testing_principles_installed == false` → copier depuis `<plugin_root>/rules/testing-principles.md` vers `.claude/rules/testing-principles.md` avec Read + Write
- Marquer `"done"`

**JSON strategy** (`steps_status.json_strategy`) :
- Si `probe.jq.available == true` → executer `bash .claude/review/scripts/init-strategy.sh .claude/review/config.json jq`
- Sinon → ecrire `"readwrite"` dans `json_strategy` avec Write (Read + Write si config existante)
- Marquer `"done"`

Persister `state.last_init` (ISO-8601), `state.plugin_version` (depuis plugin.json), `state.env_cache` (le probe JSON complet avec un champ `timestamp` ajoute).

### Phase 3 — Checkpoint unique

Construire un resume intelligent base sur le probe.

**Actions effectuees** : lister ce qui a ete installe/configure automatiquement (config creee, X scripts copies, rule installee, strategie JSON detectee, etc.).

**Decision restante** : plateforme, basee sur la detection :

- `probe.platform_cli.gh.authenticated == true` →
  Proposer : "GitHub detecte et authentifie. Activer l'integration PR ?" avec options :
  - "Oui — GitHub" (defaut) : activer `platform.type = "github"`, `platform.auto_post = true`
  - "Non — review locale" : `platform.type = null`

- `probe.platform_cli.gh.installed == true` mais `authenticated == false` →
  Proposer : "gh detecte mais non authentifie." avec options :
  - "Configurer l'auth" : afficher instructions depuis @references/cli-install-guide.md `<github_cli>`, puis re-verifier
  - "Continuer sans" : `platform.type = null`

- `probe.platform_cli.glab.authenticated == true` →
  Meme logique que GitHub, avec GitLab

- `probe.platform_cli.glab.installed == true` mais `authenticated == false` →
  Meme logique, avec instructions depuis `<gitlab_cli>`

- Si gh ET glab sont authentifies →
  Proposer le choix entre GitHub et GitLab

- Rien detecte →
  Proposer : "Aucune CLI detectee. Review locale uniquement ?" avec options :
  - "Oui — locale" (defaut) : `platform.type = null`
  - "Installer une CLI" : charger @references/cli-install-guide.md complet et afficher

Un seul `AskUserQuestion` contextuel avec options adaptees a la situation detectee.

### Phase 4 — Finalisation

Appliquer le choix plateforme → persister dans config.json :
- **Strategie `jq`** : `jq '.platform.type = "<type>" | .platform.auto_post = <bool>' .claude/review/config.json > .tmp && mv .tmp .claude/review/config.json`
- **Strategie `readwrite`** : Read + Write pour mettre a jour les champs platform

Marquer `steps_status.platform` → `"done"`.

Rappeler les entrees gitignore recommandees si necessaire (@references/gitignore-entries.md).

### Phase 5 — Structured return

**Si tout OK** :

```
## INIT COMPLETE

Configuration code-review initialisee :
  Plugin root    : <plugin_root>
  Strategie JSON : jq | readwrite
  Plateforme     : GitHub (gh) | GitLab (glab) | Locale
  Config         : .claude/review/config.json
  Sessions       : .claude/review/sessions/
  Scripts        : .claude/review/scripts/ (<N> installes)
  Rule testing   : .claude/rules/testing-principles.md

### Next Steps
Lancez `/scd-review:code-review` pour demarrer une review.
```

**Si partiel** (certains steps done, d'autres echoues) :

```
## INIT INCOMPLETE

Steps completes : config, sessions_dir, plugin_root, scripts, rules
Steps echoues   : json_strategy (jq non disponible, readwrite applique)

Actions suggerees :
- Installer jq pour de meilleures performances JSON
- Relancer /scd-review:review-init pour completer
```

**Si bloque** (erreur critique) :

```
## INIT BLOCKED

Raison : <description de l'erreur>
Options :
- <action corrective 1>
- <action corrective 2>
```
</init_workflow>
