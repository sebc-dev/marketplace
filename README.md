# negus-marketplace

Marketplace de plugins [Claude Code](https://claude.com/code) et [Claude Cowork](https://claude.com/cowork) pour developpeurs.

## Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| **astro-skill** | 0.3.0 | Astro 5.x on Cloudflare Workers/Pages — rendering modes, Content Layer, bindings, breaking-change prevention + framework GSD |
| **article-writer** | 0.1.0 | Workflow d'ecriture en 7 phases — l'humain ecrit, Claude questionne et polit. Ne genere jamais de contenu a la place de l'auteur |

## Installation

```bash
# Ajouter le marketplace
/plugin marketplace add owner/negus-marketplace

# Installer un plugin
/plugin install astro-skill@negus-marketplace
/plugin install article-writer@negus-marketplace
```

## article-writer — Commandes

| Commande | Phase | Ratio H/IA |
|----------|-------|------------|
| `/braindump` | Capture brute + dialogue socratique | 70/30 |
| `/structure` | Plan structure (l'auteur propose, Claude challenge) | 80/20 |
| `/draft` | Redaction dirigee (deblocage ponctuel) | 70-90/10-30 |
| `/review` | Relecture critique multi-axes, sans reecriture | 40/60 |
| `/polish` | Corrections de surface (grammaire, fluidite) | 50/50 |

## astro-skill — Contenu

- 1 skill principal (`astro-cloudflare`) avec 11 fichiers de reference
- 47 commandes slash (3 Astro + 44 GSD)
- 11 agents GSD
- 10 regles critiques Astro 5.x breaking-changes

## Licence

MIT
