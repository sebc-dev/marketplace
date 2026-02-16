# Negus Marketplace

Marketplace de plugins Claude Code et Claude Cowork.

## Structure

```
.claude-plugin/marketplace.json    # Manifeste du marketplace
astro-skill/                       # Plugin Astro 5.x + Cloudflare + GSD
article-writing/                   # Plugin workflow d'ecriture en 7 phases
docs/                              # Documentation de reference (guides skills)
```

## Conventions

### Plugins
Chaque plugin est un repertoire racine avec :
- `.claude-plugin/plugin.json` — manifeste du plugin
- `skills/<nom>/SKILL.md` — skills au format Agent Skills
- `commands/<nom>.md` — commandes slash
- `agents/<nom>.md` — definitions de sous-agents (optionnel)
- `hooks/hooks.json` — configuration des hooks (optionnel)

### Skills
- Frontmatter YAML obligatoire avec `name` et `description`
- `name` en kebab-case, doit correspondre au nom du repertoire
- `description` precise quand activer le skill (conditions, commandes)
- Contenu concis : cible < 200 lignes, max 500 lignes
- Exemples concrets obligatoires (pas de principes abstraits seuls)

### Commands
- Frontmatter YAML avec `description` et `argument-hint` (optionnel)
- Instructions claires sur ce que Claude fait et ne fait pas
- Ratio humain/IA explicite

### Marketplace
- `marketplace.json` a la racine dans `.claude-plugin/`
- Chaque plugin liste dans `plugins[]` avec `name`, `source`, `description`
- Sources en chemins relatifs pour les plugins locaux

## Commandes utiles

```bash
# Valider le marketplace
claude plugin validate .

# Ajouter ce marketplace (local)
/plugin marketplace add /chemin/vers/marketplace

# Installer un plugin
/plugin install astro-skill@negus-marketplace
/plugin install article-writer@negus-marketplace
```
