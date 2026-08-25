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

═══ Ce que la couche 1b a appris en usage réel (2.1.1) ═══

Sept faux positifs en trois heures de travail ordinaire sur un projet réel, zéro tentative
vraie. La trace étant LE livrable du dispositif, du bruit dedans n'abîme pas l'ergonomie :
il abîme le produit. Quatre défauts, tous de RECONNAISSANCE DE COMMANDE, aucun de
périmètre.

1. Le verbe d'écriture et le chemin étaient cherchés SÉPARÉMENT, puis combinés par ET.
   Rien ne reliait les deux, donc `diff --label a/CONTRAT.md … > autre.patch` bloquait sur
   une étiquette d'option pendant que la redirection visait un tout autre fichier.
   → Une redirection ne désigne plus que LE JETON QUI LA SUIT. Un verbe, lui, fait
     toujours balayer la ligne : `rm` peut viser n'importe lequel de ses arguments.

2. `>` était cherché dans la ligne BRUTE, donc une flèche dans une chaîne entre guillemets
   (`echo "=> fini"`) passait pour une redirection, et `2>&1` pour une écriture.
   → Découpage par `shlex` en mode `punctuation_chars` : une chaîne quotée ne peut plus
     produire d'opérateur, et `2>&1` sort comme l'opérateur `>&`, distinct de `>`.

3. Le chemin ABSOLU était confronté aux globs du projet. Comme `match_glob` préfixe `**/`
   à tout motif sans `/`, une entrée nue attrapait le fichier de même nom de n'importe
   quel dépôt du disque — un projet bloquait des écritures qui ne le regardaient pas.
   → La couche 1 ne juge plus que ce qui est SOUS LA RACINE du projet.

4. `python3 -c` était un verbe d'écriture inconditionnel, ce qui rendait tout fichier
   protégé illisible par Python — en contradiction avec la règle écrite juste en dessous :
   le garde vise l'écriture, pas la lecture.
   → La charge utile est inspectée. Sans indice d'écriture, c'est une lecture.

Le compromis du point 4 est assumé et il se dit : une charge utile obfusquée passe. C'est
le même compromis que le reste de la couche 1b, qui n'a jamais prétendu être un parseur de
shell — mais il est désormais explicite plutôt que compensé par un faux positif.

═══ Ce qu'un second projet a ajouté (2.1.2) ═══

5. LA SOURCE D'UNE COPIE ÉTAIT PRISE POUR UNE CIBLE, et un verbe gouvernait TOUTE la ligne.
   `cp .claude/guards.json sauvegarde/` bloquait sur la source — lue, pas écrite —, et
   `echo x && rm y` faisait de `x` un candidat parce qu'un verbe existait quelque part.
   → Un verbe ne gouverne plus que SON segment (découpe aux `;`, `&&`, `|`…), et un verbe
     de COPIE (`cp`, `install`) ne rend que sa destination. `mv` reste large de propos
     délibéré : déplacer un fichier protégé hors de sa place le RETIRE de là où il garde.

Les trois autres faux positifs de ce projet — `2>&1`, un chemin en donnée de heredoc, un
`<email>` dans un message de commit — étaient déjà refermés par le découpage `shlex` du
point 2 : c'est la même correction qui les couvre.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _guardlib import (  # noqa: E402
    base_effective,
    bloque,
    charge_config,
    charge_payload,
    cibles_ecriture,
    decoupe,
    entrees_protegees,
    match_glob,
    normalise,
    racine,
    trace,
)

# L'analyse d'une ligne de shell vit dans `_guardlib` depuis 2.1.1 : la couche 2 en a
# besoin elle aussi, pour ne pas rester aveugle a `echo ... >> src/a.ts`.


def _correspond(rel, entrees):
    """(motif, mode) de la première entrée qui attrape ce chemin, ou (None, None).

    Le chemin est TOUJOURS relatif à la racine du projet. Confronter un chemin absolu aux
    globs serait le défaut 3 de l'en-tête : une entrée nue devient `**/<nom>`, qui attrape
    le fichier de même nom dans tous les dépôts du disque.
    """
    if not rel:
        return None, None
    for glob, mode in entrees:
        if match_glob(glob, rel):
            return glob, mode
    return None, None


def _fichier(payload, cfg, base, entrees, outil):
    ti = payload.get("tool_input") or {}
    file_path = ti.get("file_path") or ti.get("notebook_path") or ""
    absolu, rel = normalise(base, file_path)
    if not absolu or not rel:
        return  # rien d'exploitable, ou hors du projet : ce garde n'a rien à y dire

    glob, mode = _correspond(rel, entrees)
    if not glob:
        return
    if mode == "no-rewrite" and not os.path.exists(absolu):
        return  # création autorisée — sémantique ADR

    trace(base, cfg, {
        "couche": "chemins", "outil": outil, "fichier": rel,
        "regle": glob, "mode": mode, "action": "bloqué",
    })
    bloque([
        f"⛔ Chemin protégé : « {rel} » ne peut pas être écrit par l'agent.",
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
    if not commande:
        return

    jetons, analysable = decoupe(commande)
    base_cd = base_effective(jetons, base) if analysable else base

    for jeton, declencheur in cibles_ecriture(jetons, commande, analysable):
        absolu, _ = normalise(base_cd, jeton.strip("'\""))
        if not absolu:
            continue
        # Le verdict se prend TOUJOURS contre la racine du projet, jamais contre celle
        # où un `cd` nous a menés : un fichier d'un autre dépôt ne regarde pas ce garde.
        _, rel = normalise(base, absolu)
        if not rel:
            continue

        glob, mode = _correspond(rel, entrees)
        if not glob:
            continue
        if mode == "no-rewrite" and not os.path.exists(absolu):
            continue

        trace(base, cfg, {
            "couche": "chemins", "outil": "Bash", "fichier": rel,
            "regle": glob, "mode": mode, "action": "bloqué",
            "declencheur": declencheur, "extrait": commande[:200],
        })
        bloque([
            f"⛔ Chemin protégé : cette commande écrirait dans « {rel} ».",
            f"   Règle : `{glob}` ({mode}), déclarée dans .claude/guards.json.",
            f"   Déclencheur : {declencheur}.",
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
