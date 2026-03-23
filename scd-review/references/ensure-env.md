<ensure_env>
## Guard : vérification environnement v2

1. Lire `.claude/review/config.json` avec Read
2. Si absent → indiquer `Lancez /scd-review:init d'abord` et STOP
3. **Détection version :**
   - Si le champ `"version"` est absent (config v0.13.0) → indiquer `Config v0.13.0 détectée. Lancez /scd-review:init pour migrer vers v2.` et STOP
   - Si `version` présent → continuer
4. Vérifier que l'init est complète :
   - Lire `state.steps_status` dans la config
   - Si un step critique est absent ou `"pending"` (`config`, `plugin_root`, `scripts`, `json_strategy`) → indiquer `Init incomplète. Lancez /scd-review:init pour finaliser.` et STOP
5. Rendre disponible pour la suite de la commande :
   - `config` : l'objet config complet (version, model_profile, default_output, pipeline, platform, validator, etc.)
   - `json_strategy` : depuis `environment.json_strategy` ou `json_strategy` racine (compatibilité)
</ensure_env>
