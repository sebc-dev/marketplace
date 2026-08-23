#!/usr/bin/env python3
"""PreToolUse — couche 2 : l'agent n'écrit pas du code qui échoue, il ÉTEINT le contrôle.

C'est le mode 2 de la grille des cinq modes de défaillance (§D25), mesuré comme le plus
attrapable de tous et couvert par aucun contrôle avant `verifier-guard`. Sa particularité
commande toute la conception : il vise un fichier que l'agent a parfaitement le DROIT
d'éditer — son propre code —, donc la couche 1 ne le voit pas et ne peut pas le voir.

Le test porte sur le CONTENU écrit, et sur ce qui est INTRODUIT : un motif déjà présent
dans `old_string` ne déclenche rien. Sans cette règle, éditer une ligne voisine d'un
`as any` existant bloquerait, et le garde serait désarmé dans la semaine.

Deux régimes, et l'asymétrie est délibérée (§D41 arbitrage 5) :
  · `.claude/guards.json` ABSENT  → AVERTIT et trace, ne bloque pas ;
  · présent                       → BLOQUE et trace.
Les motifs ci-dessous n'ont pas besoin de connaître le projet pour être justes — c'est ce
qui distingue cette couche de la couche 1, entièrement silencieuse sans opt-in.

⚠️ Un seuil de couverture ABAISSÉ n'est pas ici : comparer des nombres n'est pas gréper un
motif. Il est couvert par la couche 1 (les fichiers de config sont des chemins protégés)
et par la couche 3 (le job CI).
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _guardlib import (  # noqa: E402
    bloque,
    charge_config,
    charge_payload,
    match_glob,
    normalise,
    racine,
    trace,
)

# (identifiant, libellé humain, motif). L'identifiant est ce qu'une dérogation cite ;
# il ne se renomme pas sans casser les `guards.json` déjà écrits.
MOTIFS = [
    ("ts-ignore",   "typage TypeScript éteint",      r"@ts-(ignore|expect-error|nocheck)"),
    ("as-any",      "typage TypeScript contourné",   r"\bas\s+any\b"),
    ("eslint-off",  "lint désactivé",                r"eslint-disable|biome-ignore"),
    ("py-ignore",   "typage ou lint Python éteint",  r"#\s*(type:\s*ignore|noqa)"),
    ("jvm-warn",    "avertissement supprimé",        r"@SuppressWarnings|#pragma\s+warning\s+disable"),
    ("rust-allow",  "lint Rust désactivé",           r"#!?\[allow\("),
    ("go-nolint",   "lint Go désactivé",             r"//\s*nolint"),
    ("test-skip",   "test neutralisé",               r"\.(skip|only)\s*\(|\b(xit|xdescribe|fit|fdescribe)\s*\(|@Disabled\b|@pytest\.mark\.skip|\bt\.Skip\s*\("),
    ("no-verify",   "hook de commit contourné",      r"--no-verify|HUSKY\s*=\s*0|SKIP_HOOKS"),
    ("ci-off",      "étape de CI neutralisée",       r"continue-on-error:\s*true|if:\s*false\b"),
]
MOTIFS = [(i, lib, re.compile(m)) for i, lib, m in MOTIFS]


def _contenus(ti):
    """(nouveau, ancien) — le texte écrit, et celui qu'il remplace.

    Couvre Write (`content`), Edit (`new_string`/`old_string`), MultiEdit (`edits[]`) et
    NotebookEdit (`new_source`). Une clé inconnue rend du vide : on ne bloque jamais sur
    une charge utile qu'on ne comprend pas.
    """
    nouveau, ancien = [], []
    for cle in ("content", "new_string", "new_source"):
        v = ti.get(cle)
        if isinstance(v, str):
            nouveau.append(v)
    for cle in ("old_string", "old_source"):
        v = ti.get(cle)
        if isinstance(v, str):
            ancien.append(v)
    for e in ti.get("edits") or []:
        if isinstance(e, dict):
            if isinstance(e.get("new_string"), str):
                nouveau.append(e["new_string"])
            if isinstance(e.get("old_string"), str):
                ancien.append(e["old_string"])
    return "\n".join(nouveau), "\n".join(ancien)


def _derogations(cfg, ident, rel):
    """Une dérogation ne vaut que si elle porte une RAISON.

    Un `allow` sans motif écrit est une case à cocher : il désarmerait le garde sans que
    personne n'ait à défendre pourquoi. L'exiger coûte une phrase et rend la dérogation
    relisable.
    """
    for d in (cfg.get("weakening") or {}).get("allow") or []:
        if not isinstance(d, dict) or not d.get("raison"):
            continue
        if d.get("motif") not in (ident, "*"):
            continue
        chemin = d.get("chemin")
        if chemin and not (rel and match_glob(chemin, rel)):
            continue
        return d
    return None


def main():
    payload = charge_payload()
    base = racine(payload)
    cfg = charge_config(base)
    opt_in = cfg is not None
    cfg = cfg or {}

    if (cfg.get("weakening") or {}).get("block") is False:
        sys.exit(0)  # désactivation explicite, assumée par le projet

    ti = payload.get("tool_input") or {}
    nouveau, ancien = _contenus(ti)
    if not nouveau:
        sys.exit(0)

    _, rel = normalise(base, ti.get("file_path") or ti.get("notebook_path") or "")
    cible = rel or (ti.get("file_path") or "?")

    trouves = []
    for ident, libelle, motif in MOTIFS:
        n = len(motif.findall(nouveau))
        if n and n > len(motif.findall(ancien)):
            if _derogations(cfg, ident, rel):
                continue
            extrait = motif.search(nouveau)
            trouves.append((ident, libelle, extrait.group(0) if extrait else ident))

    if not trouves:
        sys.exit(0)

    action = "bloqué" if opt_in else "averti"
    for ident, libelle, extrait in trouves:
        trace(base, cfg, {
            "couche": "affaiblissement", "outil": payload.get("tool_name") or "Edit",
            "fichier": cible, "regle": ident, "action": action, "extrait": extrait,
        })

    liste = [f"   · {lib} — `{ext}`  (motif `{ident}`)" for ident, lib, ext in trouves]

    if not opt_in:
        print(f"⚠️ Vérificateur affaibli dans « {cible} » :", file=sys.stderr)
        print("\n".join(liste), file=sys.stderr)
        print("", file=sys.stderr)
        print("   Laissé passer : ce projet n'a pas de .claude/guards.json.", file=sys.stderr)
        print("   Signale-le à l'humain plutôt que de continuer en silence.", file=sys.stderr)
        print("   Pour que ce soit bloquant : /scd-sdd:guards", file=sys.stderr)
        sys.exit(0)

    bloque([
        f"⛔ Vérificateur affaibli dans « {cible} » :",
        *liste,
        "",
        "   Éteindre un contrôle n'est pas résoudre le problème qu'il signale — c'est le",
        "   rendre invisible. Ce que ces motifs ont en commun : après eux, le contrôle",
        "   passe au vert sans que rien n'ait été corrigé.",
        "",
        "   Trois issues, dans cet ordre :",
        "   1. corriger la cause — le type réel, le test qui échoue, la règle violée ;",
        "   2. si le contrôle est réellement faux ici, le DIRE à l'humain avec le cas",
        "      précis, et le laisser trancher ;",
        "   3. si la dérogation est justifiée et durable, elle s'écrit dans",
        "      .claude/guards.json avec sa RAISON (/scd-sdd:guards) — jamais en silence.",
        "",
        "   La tentative est consignée dans .claude/guard-log.jsonl.",
    ])


if __name__ == "__main__":
    main()
