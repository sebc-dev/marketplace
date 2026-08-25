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
import re
import shlex
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


# ═══ Analyse d'une ligne de shell ═══════════════════════════════════════════
#
# Partagée par les DEUX couches depuis 2.1.1. La couche 1b s'en sert pour savoir quel
# chemin une commande écrit ; la couche 2 pour savoir si une commande écrit tout court —
# sans quoi elle reste aveugle à `echo … >> src/a.ts`, et le garde ne réduit pas le
# comportement qu'il vise : il le DÉPLACE vers la surface qu'il ne regarde pas.

VERBES = {"rm", "mv", "cp", "tee", "truncate", "dd", "install"}
# Verbes de COPIE : la source est LUE, seule la destination est écrite. Ils ne rendent
# donc que leur dernier opérande (la cible), là où `rm`/`mv`/`tee`/`truncate`/`dd` rendent
# TOUS leurs opérandes. `mv` reste volontairement large : déplacer un fichier protégé hors
# de sa place le RETIRE de là où il garde — c'est une neutralisation, pas une lecture.
COPIE = {"cp", "install"}
GIT_ECRIT = {"rm", "mv", "restore", "clean"}
INTERPRETES = {"python", "python3", "node", "deno"}

EN_PLACE = re.compile(r"^-[a-zA-Z]*i")

CHARGE_ECRIT = re.compile(
    r"""open\s*\([^)]*['"][rbt+]*[wax][^'"]*['"]"""
    r"""|\.write\w*\s*\(|\.unlink\s*\(|\.mkdir\s*\(|\.touch\s*\("""
    r"""|os\.(remove|unlink|rename|replace|truncate|system|makedirs|rmdir)"""
    r"""|shutil\.|subprocess\.|writeFile|createWriteStream|appendFile"""
    r"""|Deno\.(write|remove|rename)"""
)

# Opérateurs dont la cible est le jeton suivant.
REDIR = {">", ">>", ">|", "&>", "&>>"}
# `2>&1` duplique un descripteur : il n'écrit aucun fichier. Mais `>&fichier` en écrit un,
# d'où le test sur ce qui SUIT plutôt qu'un rejet sec de l'opérateur.
REDIR_FD = {">&", ">>&"}
HEREDOC = {"<<", "<<-"}

SEPARATEURS = {";", "&&", "||", "|", "&", "(", ")", "|&", "\n"}

# Repli quand les guillemets ne ferment pas : un jeton grossier.
JETON = re.compile(r"[^\s'\";|&<>()]+")

# Repli : la ligne n'est pas analysable, mais écrit-elle quelque part ? Grossier ET
# volontairement large — on préfère un faux positif sur une ligne cassée à un trou.
ECRITURE_BRUTE = re.compile(
    r"(^|[;&|(]\s*)(sed\s+-[a-zA-Z]*i|perl\s+-[a-zA-Z]*i|rm\b|mv\b|cp\b|tee\b|truncate\b|"
    r"dd\b|install\b|git\s+(rm|mv|checkout\s+--|restore|clean)\b|"
    r"(python3?|node|deno)\s+-[ce]\b)"
    r"|>\s*\S|>>\s*\S"
)

# Les chaînes citées d'une charge utile `-c` / `-e` : c'est là que vivent ses chemins.
CITEES = re.compile(r"""['"]([^'"]+)['"]""")


def decoupe(commande):
    """Découpe la ligne comme un shell le ferait. Rend (jetons, analysable).

    `shlex` en mode `punctuation_chars` est ce qui rend trois faux positifs impossibles :
    une chaîne entre guillemets ne peut plus produire d'opérateur (`echo "=> ok"` n'est
    pas une redirection), et `2>&1` sort comme l'opérateur `>&`, distinct de `>`.

    Guillemets non fermés → `shlex` lève, on retombe sur le découpage grossier et
    `analysable` vaut False : l'appelant CONTINUE de protéger, en moins précis. Un garde
    qui rendrait la main sur une ligne mal formée ferait de la citation cassée son
    contournement le plus simple.
    """
    try:
        lex = shlex.shlex(commande, posix=True, punctuation_chars=True)
        lex.whitespace_split = True
        return list(lex), True
    except ValueError:
        return JETON.findall(commande), False


def base_effective(jetons, base):
    """Un `cd` en TÊTE de ligne déplace la racine des chemins relatifs qui suivent.

    Trois verrous, parce qu'un `cd` mal interprété OUVRIRAIT le garde : l'argument ne
    porte ni `$` ni substitution — `shlex` ne les développe pas, et `cd $VIDE` déplacerait
    la racine n'importe où — et il doit désigner un répertoire qui existe. Au moindre
    doute on garde la racine du projet : fermeture par défaut.
    """
    if len(jetons) < 2 or jetons[0] != "cd":
        return base
    cible = jetons[1]
    if not cible or cible.startswith("-") or "$" in cible or "`" in cible:
        return base
    chemin = os.path.expanduser(cible)
    if not os.path.isabs(chemin):
        chemin = os.path.join(base, chemin)
    chemin = os.path.normpath(chemin)
    return chemin if os.path.isdir(chemin) else base


def _verbe_ici(jetons, i):
    """Le nom du verbe d'écriture si le jeton i en est un, EN POSITION DE COMMANDE."""
    if i and jetons[i - 1] not in SEPARATEURS:
        return None
    j = jetons[i]

    if j in VERBES:
        return j

    if j in ("sed", "perl"):
        if i + 1 < len(jetons) and EN_PLACE.match(jetons[i + 1]):
            return j + " -i"
        return None

    if j == "git":
        for k in range(i + 1, len(jetons)):
            if jetons[k].startswith("-"):
                continue
            if jetons[k] in GIT_ECRIT:
                return "git " + jetons[k]
            if jetons[k] == "checkout" and k + 1 < len(jetons) and jetons[k + 1] == "--":
                return "git checkout --"
            return None
        return None

    if j in INTERPRETES:
        for k in range(i + 1, len(jetons)):
            if jetons[k] in ("-c", "-e"):
                charge = jetons[k + 1] if k + 1 < len(jetons) else ""
                return (j + " " + jetons[k]) if CHARGE_ECRIT.search(charge) else None
            if not jetons[k].startswith("-"):
                return None
        return None

    return None


def cibles_ecriture(jetons, commande, analysable=True):
    """Les jetons qu'une commande ÉCRIT, chacun avec ce qui l'y amène.

    Deux liens, jamais confondus. Une REDIRECTION ne rend que sa cible — le jeton qui la
    suit — où qu'elle soit sur la ligne. Un VERBE ne gouverne que SON segment : la ligne est
    découpée aux séparateurs (`;`, `&&`, `|`…), et un verbe trouvé dans un segment ne rend
    que les opérandes de CE segment, pas ceux de `echo … && rm …`. C'était le report 2.1.1
    qui reliait le verbe à son opérande ; le segment-scope de 2.1.2 rend le lien exact.

    Deux natures de verbe (2.1.2). Un verbe de COPIE (`cp`, `install`) LIT sa source et
    n'écrit que sa destination — son dernier opérande. Les autres (`rm`, `mv`, `tee`…)
    rendent tous leurs opérandes : `rm` peut viser n'importe lequel, et `mv` retire sa
    source de là où elle garde. Sans cette distinction, `cp .claude/guards.json sauvegarde/`
    bloquait sur la source d'une simple copie — un faux positif relevé en usage réel.

    Ligne non analysable → ancien régime : si quoi que ce soit ressemble à une écriture,
    tous les jetons sont candidats. Moins précis, jamais plus permissif.
    """
    if not analysable:
        if not ECRITURE_BRUTE.search(commande):
            return []
        return [(j, "ligne non analysable") for j in jetons if not j.startswith("-")]

    sortie = []
    verbe = None
    operandes = []  # opérandes non-option du segment courant

    def cloture():
        # Un verbe de copie ne rend que sa destination (le dernier opérande) ; les autres
        # rendent tout. La charge utile d'un `-c` est UN SEUL jeton pour le shell : les
        # chemins qu'elle vise y sont enfouis, et `CITEES` les en ressort.
        if verbe is None:
            return
        cibles = operandes[-1:] if verbe in COPIE else operandes
        for j in cibles:
            sortie.append((j, "verbe `" + verbe + "`"))
            for citee in CITEES.findall(j):
                sortie.append((citee, "verbe `" + verbe + "`"))

    i = 0
    while i < len(jetons):
        j = jetons[i]

        if j in SEPARATEURS:
            cloture()
            verbe, operandes = None, []
            i += 1
            continue

        if j in REDIR:
            if i + 1 < len(jetons) and jetons[i + 1] not in SEPARATEURS:
                sortie.append((jetons[i + 1], "redirection `" + j + "`"))
            i += 2
            continue

        if j in REDIR_FD:
            suivant = jetons[i + 1] if i + 1 < len(jetons) else ""
            if suivant and not suivant.isdigit() and suivant not in SEPARATEURS \
                    and suivant != "-":
                sortie.append((suivant, "redirection `" + j + "`"))
            i += 2
            continue

        if j in HEREDOC:
            i += 2  # l'opérateur ET son délimiteur (un mot, pas un chemin)
            continue

        if verbe is None:
            verbe = _verbe_ici(jetons, i)
        if not j.startswith("-"):
            operandes.append(j)
        i += 1

    cloture()
    return sortie


def deverse_dans_fichier(jetons, commande, analysable):
    """La commande DÉVERSE-t-elle du texte dans un fichier ? (redirection ou heredoc)

    Volontairement plus étroit que `cibles_ecriture` : c'est là-dessus, et là-dessus
    seulement, que la couche 2 s'arme sur `Bash`. `sed -i 's/<motif>//'` en est EXCLU de
    propos délibéré — la même forme sert à RETIRER un neutralisant, et la bloquer
    interdirait le nettoyage tout en n'empêchant qu'une manière d'ajouter parmi d'autres.
    """
    if not analysable:
        return bool(ECRITURE_BRUTE.search(commande))
    return any(j in REDIR or j in REDIR_FD or j in HEREDOC for j in jetons)
