#!/usr/bin/env bash
# SessionStart — annonce du chantier en cours.
# LECTURE SEULE. N'ecrit jamais de fiche : un hook ne connait pas l'issue de ce qu'il
# consignerait, et une fiche fabriquee est pire qu'un dossier vide.
#
# Cout en contexte = ce que ce script IMPRIME, pas ce qu'il lit. Il peut donc grepper
# autant de fiches que necessaire ; seule la sortie compte. Aucun chantier -> aucune sortie.
#
# Selection, dans l'ordre :
#   1. la fiche de en-cours/ dont le champ `branche` vaut la branche courante  (cas worktree)
#   2. sinon, l'unique fiche de en-cours/
#   3. sinon (plusieurs, sans correspondance) : les titres seuls
#   4. en-cours/ vide -> silence total
set -uo pipefail

input="$(cat 2>/dev/null || true)"
cwd="$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("cwd",""))' 2>/dev/null || true)"
[ -n "$cwd" ] || cwd="$PWD"

dir="$cwd/docs/chantiers/en-cours"
[ -d "$dir" ] || exit 0

# Fiches ouvertes (glob non matche -> liste vide)
shopt -s nullglob
fiches=("$dir"/*.md)
shopt -u nullglob
[ "${#fiches[@]}" -gt 0 ] || exit 0

branch="$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"

# Nb de fiches en attente, pour le pied de sortie
attente_dir="$cwd/docs/chantiers/en-attente"
attente=0
if [ -d "$attente_dir" ]; then
  shopt -s nullglob; a=("$attente_dir"/*.md); shopt -u nullglob
  attente="${#a[@]}"
fi

titre()  { grep -m1 '^# '            "$1" 2>/dev/null | sed 's/^# //'; }
portee() { grep -m1 '^Portée *:'     "$1" 2>/dev/null | sed 's/^Portée *: *//'; }
maj()    { grep -m1 '^Ouvert le '    "$1" 2>/dev/null | sed -n -e 's/.*Actualisé le \([0-9-]*\).*/\1/p' -e t -e 's/^Ouvert le \([0-9-]*\).*/\1/p'; }

pied() {
  [ "$attente" -gt 0 ] && printf '   · %s en attente\n' "$attente"
  return 0
}

# 1. Correspondance de branche — le cas worktree
match=""
if [ -n "$branch" ]; then
  match="$(grep -l -F "branche \`$branch\`" "${fiches[@]}" 2>/dev/null | head -1 || true)"
fi

# 2. Repli : une seule fiche ouverte
if [ -z "$match" ] && [ "${#fiches[@]}" -eq 1 ]; then
  match="${fiches[0]}"
fi

# 3. Plusieurs fiches sans correspondance -> titres seuls, aucune carte
if [ -z "$match" ]; then
  printf '⏸ %s chantiers en cours, aucun sur la branche courante :\n' "${#fiches[@]}"
  for f in "${fiches[@]}"; do
    printf '   · %s — %s\n' "$(titre "$f")" "$(portee "$f")"
  done
  printf '   → /scd-sdd:resume <slug> pour en charger un\n'
  pied
  exit 0
fi

# 4. Carte complete de la fiche selectionnee.
#    Les references du manifeste sont rendues telles quelles : ce sont des CHEMINS.
#    Le contenu des fichiers pointes n'est JAMAIS injecte ici — c'est resume qui charge,
#    apres controle de fraicheur. Ce hook annonce, il n'atteste rien.
printf '⏸ Chantier en cours — « %s »\n' "$(titre "$match")"
printf '   %s · actualisé le %s' "$(portee "$match")" "$(maj "$match")"
[ -n "$branch" ] && printf ' sur `%s`' "$branch"
printf '\n'

etape="$(awk '/^## Prochaine étape/{f=1;next} /^## /{f=0} f' "$match" 2>/dev/null | grep -m1 '[^[:space:]]' || true)"
[ -n "$etape" ] && printf '   Prochaine étape : %s\n' "$etape"

refs="$(awk '/^## Contexte à charger/{f=1;next} /^## /{f=0} f' "$match" 2>/dev/null \
        | grep -E '^(à lire|à extraire|à déléguer)' | head -6 || true)"
if [ -n "$refs" ]; then
  printf '   Contexte disponible (non chargé) :\n'
  printf '%s\n' "$refs" | sed 's/^/     /'
fi

printf '   → /scd-sdd:resume pour contrôler la fraîcheur et charger ce contexte\n'
pied
exit 0
