<ensure_env>
## Guard : verification environnement

1. Lire `.claude/review/config.json` avec Read
2. Si absent → indiquer `Lancez /scd-review:review-init d'abord` et STOP
3. Si `state` absent dans le JSON (ancienne config) → migrer :
   - Ajouter le sous-objet `state` avec valeurs par defaut (copier la structure depuis @references/default-config.json, section `state`)
   - Persister avec Write
4. Si `state.env_cache` est `null` ou `state.env_cache.timestamp` date de plus de 24h :
   - Lancer scout-alpha (sub-agent probe) :
     ```
     Task(
       subagent_type: "scout-alpha",
       description: "Probe environnement review",
       prompt: "Scanne l'environnement de travail pour le systeme de code review."
     )
     ```
   - Ajouter un champ `timestamp` (ISO-8601 courant) au resultat
   - Persister le resultat dans `state.env_cache` via :
     `bash .claude/review/scripts/update-config-state.sh .claude/review/config.json "env_cache" '<probe_json>'`
5. Sinon → utiliser `state.env_cache` directement (cache valide)
6. Rendre disponible pour la suite de la commande :
   - `config` : l'objet config complet (incluant `json_strategy`, `plugin_root`, `platform`, etc.)
   - `env` : le contenu de `state.env_cache` (probe resultat)
</ensure_env>
