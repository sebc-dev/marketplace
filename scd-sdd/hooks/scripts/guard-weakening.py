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

═══ Ce que la couche 2 a appris en usage réel (2.1.1) ═══

1. AUCUNE EXCLUSION DOCUMENTAIRE. Le job `verifier-guard` que le cycle écrit en CI exclut
   `docs/**` et `*.md`, et son commentaire dit pourquoi : c'est ce qui l'empêche de se
   bloquer LUI-MÊME, puisque le document qui décrit les motifs les cite forcément. Cette
   couche-ci n'avait pas la contrepartie, donc documenter le dispositif — ou écrire un
   script d'analyse qui cherche ces motifs — était bloqué.
   → Même exclusion qu'en CI. Un neutralisant garé dans un `.md` n'éteint aucun
     vérificateur : ce n'est pas du code.

2. AUCUNE BORNE DE PROJET. Le contenu était jugé où que vive le fichier, y compris hors de
   la racine. Un garde possédé par un projet refusait des écritures qui ne le regardaient
   pas.
   → Hors racine, cette couche se tait. La couche 1 fait désormais de même.

3. `Write` RÉ-INTRODUISAIT TOUT. La règle « seulement ce qui est INTRODUIT » comparait le
   contenu écrit au seul `old_string`, que `Write` ne fournit jamais. Réécrire un fichier
   comptait donc chacun de ses motifs DÉJÀ PRÉSENTS comme une introduction — un fichier
   portant une dérogation légitime devenait irréécrivable, et c'est ce défaut-là qui a
   bloqué le correctif des deux autres.
   → Sur un fichier qui existe, l'état antérieur est LU SUR LE DISQUE quand la charge
     utile ne le donne pas. La comparaison redevient ce qu'elle prétendait être.
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _guardlib import (  # noqa: E402
    base_effective,
    bloque,
    charge_config,
    charge_payload,
    cibles_ecriture,
    decoupe,
    deverse_dans_fichier,
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


# Ce que cette couche ne juge pas, à l'identique de ce que `verifier-guard` exclut en CI.
# La documentation d'un garde CITE les motifs qu'il traque ; sans cette exclusion, le
# dispositif s'interdit de se décrire lui-même.
HORS_PORTEE = ("*.md", "*.mdx", "*.txt", "*.rst", "docs/**")


def _hors_portee(cfg, rel):
    """Hors portée par défaut, ou par une exclusion que le PROJET déclare.

    `weakening.exclude` existe parce que l'exclusion documentaire ne couvre pas tout : le
    harnais de test d'un détecteur doit CITER ce qu'il détecte, et il n'est pas en `.md`.
    Même exigence que `weakening.allow` — sans `raison` écrite, l'entrée est ignorée : une
    exclusion muette désarmerait le garde sans que personne ait eu à défendre pourquoi.
    """
    if any(match_glob(g, rel) for g in HORS_PORTEE):
        return "documentation"
    for e in (cfg.get("weakening") or {}).get("exclude") or []:
        if not isinstance(e, dict) or not e.get("raison") or not e.get("chemin"):
            continue
        if match_glob(e["chemin"], rel):
            return e["raison"]
    return None


def _ancien_sur_disque(ti, rel_absolu):
    """L'état antérieur, lu sur le disque quand la charge utile ne le porte pas.

    `Write` ne fournit aucun `old_string` : sans cette lecture, chaque motif déjà présent
    dans le fichier compte comme introduit, et réécrire un fichier qui en porte un devient
    impossible. Illisible ou absent → chaîne vide, c'est-à-dire le comportement d'avant :
    on ne s'ouvre jamais sur une erreur de lecture.
    """
    if not rel_absolu or not os.path.isfile(rel_absolu):
        return ""
    try:
        with open(rel_absolu, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


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


def _bash(payload, cfg, base, opt_in):
    """Couche 2 sur `Bash` — la surface que le garde ne regardait pas.

    Le constat qui l'impose, relevé en usage réel : bloqué en écriture sur un fichier, le
    geste suivant qui vient est de passer les mêmes chaînes en argument de commande. La
    couche 2 n'étant câblée que sur `Edit|Write`, elle ne RÉDUISAIT pas le comportement,
    elle le DÉPLAÇAIT. C'est la réserve que `<limites>` fait écrire dans `docs/ci.md` —
    « réprimer un comportement peut le rendre plus subtil » —, ici refermée d'un cran.

    Deux bornes, étroites de propos délibéré. On ne s'arme que si la commande DÉVERSE du
    texte dans un fichier (redirection ou heredoc) : un `grep` qui cherche un motif, ou un
    `sed -i` qui le RETIRE, ne doivent rien déclencher. Et la cible doit être un fichier du
    projet, hors documentation — mêmes exclusions que la surface `Edit|Write`.
    """
    commande = (payload.get("tool_input") or {}).get("command") or ""
    if not commande:
        return

    jetons, analysable = decoupe(commande)
    if not deverse_dans_fichier(jetons, commande, analysable):
        return

    base_cd = base_effective(jetons, base) if analysable else base
    vise = []
    for jeton, _ in cibles_ecriture(jetons, commande, analysable):
        absolu, _r = normalise(base_cd, jeton.strip("'\""))
        if not absolu:
            continue
        _a, rel = normalise(base, absolu)
        if rel and not _hors_portee(cfg, rel):
            vise.append(rel)
    if not vise:
        return

    trouves = []
    for ident, libelle, motif in MOTIFS:
        if not motif.search(commande):
            continue
        if any(_derogations(cfg, ident, r) for r in vise):
            continue
        extrait = motif.search(commande)
        trouves.append((ident, libelle, extrait.group(0) if extrait else ident))
    if not trouves:
        return

    cible = vise[0]
    action = "bloqué" if opt_in else "averti"
    for ident, libelle, extrait in trouves:
        trace(base, cfg, {
            "couche": "affaiblissement", "outil": "Bash", "fichier": cible,
            "regle": ident, "action": action, "extrait": extrait,
            "declencheur": "déversement dans un fichier du projet",
        })

    liste = [f"   · {lib} — `{ext}`  (motif `{ident}`)" for ident, lib, ext in trouves]

    if not opt_in:
        print(f"⚠️ Vérificateur affaibli, déversé dans « {cible} » :", file=sys.stderr)
        print("\n".join(liste), file=sys.stderr)
        print("   Laissé passer : ce projet n'a pas de .claude/guards.json.", file=sys.stderr)
        return

    bloque([
        f"⛔ Vérificateur affaibli, déversé dans « {cible} » par le shell :",
        *liste,
        "",
        "   Passer par une redirection plutôt que par un Edit ne change pas la règle :",
        "   ce qui compte est ce qui atterrit dans le fichier.",
        "",
        "   Corrige la cause, ou dis à l'humain que le contrôle est faux ici. Une",
        "   dérogation durable s'écrit dans .claude/guards.json avec sa RAISON.",
        "",
        "   La tentative est consignée dans .claude/guard-log.jsonl.",
    ])


def main():
    payload = charge_payload()
    base = racine(payload)
    cfg = charge_config(base)
    opt_in = cfg is not None
    cfg = cfg or {}

    if (cfg.get("weakening") or {}).get("block") is False:
        sys.exit(0)  # désactivation explicite, assumée par le projet

    ti = payload.get("tool_input") or {}

    if (payload.get("tool_name") or "") == "Bash":
        _bash(payload, cfg, base, opt_in)
        sys.exit(0)

    nouveau, ancien = _contenus(ti)
    if not nouveau:
        sys.exit(0)

    chemin = ti.get("file_path") or ti.get("notebook_path") or ""
    absolu, rel = normalise(base, chemin)

    # Hors de la racine du projet : ce garde appartient à un projet, il n'a rien à dire
    # sur un fichier qui n'est pas le sien.
    if chemin and not rel:
        sys.exit(0)
    if rel and _hors_portee(cfg, rel):
        sys.exit(0)

    # `Write` ne porte pas d'état antérieur : on le lit sur le disque, sans quoi une
    # réécriture compte comme une introduction tout ce que le fichier contenait déjà.
    if not ancien:
        ancien = _ancien_sur_disque(ti, absolu)

    cible = rel or chemin or "?"

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
