<ensure_env>
## Guard : verification environnement

1. Lire `.claude/review/config.json` avec Read
2. Si absent → indiquer `Lancez /scd-review:review-init d'abord` et STOP
3. Si `state` absent dans le JSON (ancienne config) → migrer :
   - Ajouter le sous-objet `state` avec valeurs par defaut (copier la structure depuis @references/default-config.json, section `state`)
   - Persister avec Write
4. Verifier que l'init est complete :
   - Lire `state.steps_status` dans la config
   - Si un step critique est absent ou `"pending"` (`config`, `plugin_root`, `scripts`, `json_strategy`) → indiquer `Init incomplete. Lancez /scd-review:review-init pour finaliser.` et STOP
5. Rendre disponible pour la suite de la commande :
   - `config` : l'objet config complet (incluant `json_strategy`, `plugin_root`, `platform`, etc.)
</ensure_env>
