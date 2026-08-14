#!/usr/bin/env bash
# PreToolUse — immutabilité des ADR.
# Bloque (exit 2) la RÉÉCRITURE d'un ADR final docs/adr/NNNN-*.md qui EXISTE DÉJÀ.
# La CRÉATION d'un ADR qui n'existe pas encore est autorisée : c'est le travail de la
# phase 5 du socle (/scd-sdd:adr), qui écrit docs/adr/NNNN-titre.md avec Write.
# Les candidats docs/adr/_candidates/* restent autorisés (ils seront promus à la main).
# Rappel : exit 2 = bloque ; exit 1 = erreur ignorée (ne bloquerait rien).
#
# Le test d'existence porte sur un chemin ABSOLU, jamais sur `file_path` tel quel :
# celui-ci peut arriver relatif, et un test relatif s'évaluerait contre le répertoire
# courant du hook — un ADR existant redeviendrait silencieusement réécrivable dès que
# ce répertoire n'est pas la racine du projet. La résolution s'appuie sur le champ `cwd`
# de la charge utile (précédent : chantier-notice.sh).
#
# Sens du repli : un chemin d'allure ADR qu'on ne sait pas résoudre en absolu est BLOQUÉ.
# Un blocage indu est visible et se contourne ; un blocage manqué détruit en silence un
# document immuable.
set -uo pipefail

input="$(cat)"

# Un seul appel python3 : `cwd` en 1re ligne, `file_path` sur le reste (un chemin
# est la valeur la plus susceptible de contenir un caractère exotique — il passe en
# dernier pour être relu entier).
payload="$(printf '%s' "$input" | python3 -c 'import json,sys
d = json.load(sys.stdin)
print(d.get("cwd", ""))
print(d.get("tool_input", {}).get("file_path", ""))' 2>/dev/null || true)"

cwd="$(printf '%s' "$payload" | sed -n '1p')"
file_path="$(printf '%s' "$payload" | sed '1d')"

# Pas de chemin exploitable → ne rien bloquer. Le matcher couvre TOUTE écriture :
# bloquer ici sur une charge utile illisible interdirait d'éditer quoi que ce soit.
[ -z "$file_path" ] && exit 0

# Résolution en absolu. `cwd` doit lui-même être absolu pour servir de base.
abs=""
case "$file_path" in
  /*) abs="$file_path" ;;
  *)  case "$cwd" in
        /*) abs="$cwd/$file_path" ;;
      esac ;;
esac

# Chemin non résolu : on ne peut pas savoir si l'ADR existe. On bloque s'il a l'allure
# d'un ADR final, on laisse passer le reste (le hook garde les ADR, pas tout le dépôt).
if [ -z "$abs" ]; then
  case "$file_path" in
    *_candidates/*) exit 0 ;;
    *adr/[0-9]*)
      echo "⛔ ADR : '$file_path' est relatif et le hook n'a pas reçu de \`cwd\` absolu." >&2
      echo "   Impossible de savoir si cet ADR existe déjà, donc impossible de distinguer" >&2
      echo "   une création (autorisée) d'une réécriture (interdite). Bloqué par prudence." >&2
      echo "   Relance l'écriture avec un chemin absolu." >&2
      exit 2 ;;
  esac
  exit 0
fi

case "$abs" in
  */docs/adr/_candidates/*)
    exit 0 ;;                                   # candidats : autorisés
  */docs/adr/[0-9]*)
    # Création (le fichier n'existe pas encore) : autorisée.
    [ -e "$abs" ] || exit 0
    echo "⛔ ADR immuable : '$file_path' ne peut pas être édité." >&2
    echo "   Un ADR accepté est superseded par un NOUVEL ADR, jamais réécrit." >&2
    echo "   Rédige un candidat dans docs/adr/_candidates/ puis promeus-le manuellement." >&2
    exit 2 ;;
esac

exit 0
