"""Socle commun des gardes de session — chargement de config, globs, trace.

Pourquoi Python et pas bash, contrairement aux trois hooks historiques : un garde qui
échoue échoue OUVERT, en silence. Les trois points où bash serait fragile sont exactement
ceux-là — le glob multi-segments (`tests/**`), la lecture d'un JSON de configuration, et
l'ajout d'une ligne JSONL sans corrompre le fichier. On paie une dépendance à python3, que
les hooks du plugin exigent déjà pour lire leur charge utile.

⚠️ python3 absent = AUCUNE protection, sans message. La commande /scd-sdd:guards le
contrôle et le signale ; la couche 3 (job CI) est le rattrapage. C'est une limite écrite,
pas un oubli — voir skills/socle/references/guards.md.
"""

import fnmatch
import json
import os
import sys
from datetime import datetime, timezone

# Toujours protégés dès qu'une configuration existe, que la liste du projet les cite ou
# non : un agent ne doit pas pouvoir éditer sa propre laisse, ni effacer la trace de ses
# tentatives. Les mettre dans le fichier de config aurait suffi à qui l'écrit — pas à qui
# l'oublie.
TOUJOURS_PROTEGE = (
    ".claude/guards.json",
    ".claude/guard-log.jsonl",
    ".claude/settings.json",
)

LOG_DEFAUT = ".claude/guard-log.jsonl"


def charge_payload():
    """La charge utile du hook, ou {} si elle est illisible."""
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def racine(payload):
    """Le répertoire du projet. `cwd` de la charge utile, sinon le répertoire courant."""
    cwd = payload.get("cwd") or ""
    return cwd if os.path.isabs(cwd) else os.getcwd()


def charge_config(base):
    """`.claude/guards.json`, ou None s'il est absent.

    Un fichier présent mais illisible n'est PAS traité comme absent : il rend une config
    vide mais *présente*, donc le régime bloquant s'applique et le défaut se voit. Un
    JSON cassé qui désarmerait silencieusement les gardes serait le contournement le plus
    simple de tout le dispositif.
    """
    chemin = os.path.join(base, ".claude", "guards.json")
    if not os.path.isfile(chemin):
        return None
    try:
        with open(chemin, encoding="utf-8") as f:
            cfg = json.load(f)
        return cfg if isinstance(cfg, dict) else {}
    except Exception:
        return {"_illisible": True}


def _match_segments(motif_seg, chemin_seg):
    """Glob à segments : `**` couvre zéro segment ou plus, `*` ne franchit pas un `/`."""
    if not motif_seg:
        return not chemin_seg
    if motif_seg[0] == "**":
        if len(motif_seg) == 1:
            return True
        for i in range(len(chemin_seg) + 1):
            if _match_segments(motif_seg[1:], chemin_seg[i:]):
                return True
        return False
    if not chemin_seg:
        return False
    if not fnmatch.fnmatchcase(chemin_seg[0], motif_seg[0]):
        return False
    return _match_segments(motif_seg[1:], chemin_seg[1:])


def match_glob(motif, chemin_relatif):
    """Un motif SANS `/` vaut pour tout suffixe — convention de `.gitignore`.

    `*.test.ts` attrape `a.test.ts` comme `src/deep/a.test.ts`. Sans cette règle, la
    liste la plus naturelle qu'un humain écrit ne protégerait que la racine.
    """
    # ⚠️ On retire le PRÉFIXE `./`, jamais par `lstrip("./")` — qui retire tous les
    # caractères de l'ensemble {'.', '/'} et transformerait `.github/**` en `github/**`.
    # Ce sont exactement les répertoires qui comptent (`.github`, `.husky`, `.claude`)
    # qui seraient dé-protégés en silence.
    motif = motif.strip()
    while motif.startswith("./"):
        motif = motif[2:]
    if not motif:
        return False
    if "/" not in motif.rstrip("/"):
        motif = "**/" + motif
    if motif.endswith("/"):
        motif += "**"
    return _match_segments(motif.split("/"), chemin_relatif.split("/"))


def normalise(base, file_path):
    """(chemin absolu, chemin relatif à la racine) — ou (None, None) si non résoluble.

    Le test porte TOUJOURS sur un chemin résolu : un `file_path` relatif évalué contre le
    répertoire courant du hook rouvrirait le garde dès que ce répertoire n'est pas la
    racine. C'est la leçon écrite dans l'en-tête de block-adr-edits.sh, et elle a coûté.
    """
    if not file_path:
        return None, None
    absolu = file_path if os.path.isabs(file_path) else os.path.join(base, file_path)
    absolu = os.path.normpath(absolu)
    base_n = os.path.normpath(base)
    if absolu == base_n or absolu.startswith(base_n + os.sep):
        return absolu, os.path.relpath(absolu, base_n).replace(os.sep, "/")
    return absolu, None


def entrees_protegees(cfg):
    """La liste `protected`, normalisée en (glob, mode).

    Deux modes. `strict` : toute écriture est bloquée. `no-rewrite` : la CRÉATION passe,
    la réécriture d'un fichier existant est bloquée — sémantique des ADR, et la seule qui
    laisse un agent produire un fichier neuf sous un chemin gardé.
    """
    sortie = [(g, "strict") for g in TOUJOURS_PROTEGE]
    for e in cfg.get("protected") or []:
        if isinstance(e, str):
            sortie.append((e, "strict"))
        elif isinstance(e, dict) and e.get("glob"):
            mode = e.get("mode") if e.get("mode") in ("strict", "no-rewrite") else "strict"
            sortie.append((e["glob"], mode))
    return sortie


def trace(base, cfg, ligne):
    """Ajoute une ligne au journal des tentatives. Ne crée JAMAIS `.claude/`.

    La trace est le livrable du dispositif (§D41 arbitrage 4) : savoir que l'agent a
    ESSAYÉ est l'information. Mais un hook qui créerait un répertoire dans n'importe quel
    dossier traversé serait un effet de bord, pas un garde.
    """
    rel = (cfg or {}).get("log") or LOG_DEFAUT
    chemin = os.path.join(base, rel)
    if not os.path.isdir(os.path.dirname(chemin)):
        return False
    ligne = dict(ligne)
    ligne["date"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    try:
        with open(chemin, "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")
        return True
    except Exception:
        return False


def bloque(lignes):
    """exit 2 — la seule valeur qui arrête l'outil. exit 1 serait une erreur ignorée."""
    for l in lignes:
        print(l, file=sys.stderr)
    sys.exit(2)


def avertit(lignes):
    """Message visible, outil laissé passer."""
    for l in lignes:
        print(l, file=sys.stderr)
    sys.exit(0)
