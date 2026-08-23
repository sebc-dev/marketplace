#!/usr/bin/env python3
"""PreToolUse — couche 1 : les chemins que l'agent n'a pas le droit de réécrire.

Deux surfaces, un seul script :

  · Edit / Write / NotebookEdit / MultiEdit — le `file_path` est confronté à la liste ;
  · Bash — couche 1b, BEST-EFFORT ASSUMÉ : une commande d'écriture (`sed -i`, `rm`, `mv`,
    `tee`, une redirection…) qui mentionne un chemin protégé est bloquée. Un agent
    déterminé passera par une forme qu'aucun motif ne reconnaît. Cette couche relève la
    barre ; elle ne ferme pas le sujet, et c'est écrit dans guards.md.

L'opt-in est `.claude/guards.json`. Absent → silence total : le plugin ne devine jamais ce
qu'un projet protège (§D41 arbitrage 3 — le plugin porte le script, le projet porte la
liste).

⚠️ Les ADR ne sont PAS dans la liste par défaut et ne doivent pas y entrer :
block-adr-edits.sh les traite déjà, avec la distinction création/réécriture que la phase
`adr` exige. Les y remettre en mode `strict` interdirait d'écrire un ADR.
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _guardlib import (  # noqa: E402
    bloque,
    charge_config,
    charge_payload,
    entrees_protegees,
    match_glob,
    normalise,
    racine,
    trace,
)

# Verbes et opérateurs qui ÉCRIVENT. Un `cat`, un `grep`, un `git diff` sur un fichier
# protégé n'a aucune raison d'être bloqué : le garde vise l'écriture, pas la lecture.
ECRITURE = re.compile(
    r"(^|[;&|(]\s*)(sed\s+-[a-zA-Z]*i|perl\s+-[a-zA-Z]*i|rm\b|mv\b|cp\b|tee\b|truncate\b|"
    r"dd\b|install\b|git\s+(rm|mv|checkout\s+--|restore|clean)\b|"
    r"(python3?|node|deno)\s+-[ce]\b)"
    r"|>\s*\S|>>\s*\S"
)

# Un jeton de ligne de commande susceptible d'être un chemin.
JETON = re.compile(r"[^\s'\";|&<>()]+")


def _correspond(rel, absolu, entrees):
    """(motif, mode) de la première entrée qui attrape ce chemin, ou (None, None)."""
    for glob, mode in entrees:
        if rel and match_glob(glob, rel):
            return glob, mode
        if absolu and match_glob(glob, absolu.lstrip("/")):
            return glob, mode
    return None, None


def _fichier(payload, cfg, base, entrees, outil):
    ti = payload.get("tool_input") or {}
    file_path = ti.get("file_path") or ti.get("notebook_path") or ""
    absolu, rel = normalise(base, file_path)
    if not absolu:
        return  # rien d'exploitable : la couche 1 ne bloque pas à l'aveugle

    glob, mode = _correspond(rel, absolu, entrees)
    if not glob:
        return
    if mode == "no-rewrite" and not os.path.exists(absolu):
        return  # création autorisée — sémantique ADR

    cible = rel or file_path
    trace(base, cfg, {
        "couche": "chemins", "outil": outil, "fichier": cible,
        "regle": glob, "mode": mode, "action": "bloqué",
    })
    bloque([
        f"⛔ Chemin protégé : « {cible} » ne peut pas être écrit par l'agent.",
        f"   Règle : `{glob}` ({mode}), déclarée dans .claude/guards.json.",
        "",
        "   Ce fichier fait partie de ce qui VÉRIFIE le travail. Le modifier pour faire",
        "   passer autre chose est le mode de défaillance que ce garde attrape.",
        "",
        "   Trois issues, dans cet ordre :",
        "   1. corriger le CODE plutôt que la vérification ;",
        "   2. si la vérification est réellement fausse, le DIRE à l'humain et le laisser",
        "      trancher — c'est son fichier ;",
        "   3. si le périmètre est trop large, c'est une décision de projet :",
        "      /scd-sdd:guards, jamais une édition silencieuse de guards.json.",
        "",
        "   La tentative est consignée dans .claude/guard-log.jsonl.",
    ])


def _bash(payload, cfg, base, entrees):
    commande = (payload.get("tool_input") or {}).get("command") or ""
    if not commande or not ECRITURE.search(commande):
        return

    for jeton in JETON.findall(commande):
        if jeton.startswith("-"):
            continue
        if "/" not in jeton and "." not in jeton:
            continue  # ni chemin ni nom de fichier : un mot-clé du shell
        absolu, rel = normalise(base, jeton.strip("'\""))
        if not absolu:
            continue
        glob, mode = _correspond(rel, absolu, entrees)
        if not glob:
            continue
        if mode == "no-rewrite" and not os.path.exists(absolu):
            continue

        cible = rel or jeton
        trace(base, cfg, {
            "couche": "chemins", "outil": "Bash", "fichier": cible,
            "regle": glob, "mode": mode, "action": "bloqué",
            "extrait": commande[:200],
        })
        bloque([
            f"⛔ Chemin protégé : cette commande écrirait dans « {cible} ».",
            f"   Règle : `{glob}` ({mode}), déclarée dans .claude/guards.json.",
            "",
            "   Passer par le shell ne change pas la règle. Corrige le code, ou demande à",
            "   l'humain de trancher — c'est son fichier.",
            "",
            "   La tentative est consignée dans .claude/guard-log.jsonl.",
        ])


def main():
    payload = charge_payload()
    base = racine(payload)
    cfg = charge_config(base)
    if cfg is None:
        sys.exit(0)  # pas d'opt-in, pas de garde

    if cfg.get("_illisible"):
        # On AVERTIT sans rendre la main : les chemins protégés en dur s'appliquent
        # toujours. Sortir ici ferait d'un JSON cassé le contournement le plus simple de
        # tout le dispositif.
        print("⚠️ .claude/guards.json est présent mais illisible (JSON invalide).",
              file=sys.stderr)
        print("   Seule la protection en dur s'applique. Répare-le : /scd-sdd:guards",
              file=sys.stderr)

    entrees = entrees_protegees(cfg)
    outil = payload.get("tool_name") or ""
    if outil == "Bash":
        _bash(payload, cfg, base, entrees)
    else:
        _fichier(payload, cfg, base, entrees, outil or "Edit")
    sys.exit(0)


if __name__ == "__main__":
    main()
