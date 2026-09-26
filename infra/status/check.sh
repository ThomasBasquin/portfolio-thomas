#!/usr/bin/env bash
# Génère un snapshot JSON de l'état des sites hébergés sur le VPS.
# Déclenché toutes les 2h par vps-status-check.timer.
#
# Les domaines sont découverts automatiquement depuis
# /etc/nginx/sites-enabled/*, un par fichier : le premier server_name donne
# le domaine, les proxy_pass donnent les ports à surveiller (aucun
# proxy_pass = site statique, considéré up tant que nginx tourne). Seuls le
# libellé, l'ordre d'affichage et les exclusions se règlent à la main
# ci-dessous.
set -euo pipefail

NGINX_SITES_DIR="/etc/nginx/sites-enabled"
OUTPUT_DIR="/var/www/status-data"
OUTPUT_FILE="$OUTPUT_DIR/status.json"

# Domaines à ne pas afficher (ex: redirections pures vers un autre site listé).
EXCLUDE=(
  "myshelf.thomasbasquin.fr" # redirige vers nook.thomasbasquin.fr
)

# Domaines connus affichés en premier, dans cet ordre. Tout domaine découvert
# mais absent d'ORDER est ajouté ensuite, dans l'ordre de découverte.
ORDER=(
  "thomasbasquin.fr"
  "mariewach.fr"
  "martinbasquin.thomasbasquin.fr"
  "nook.thomasbasquin.fr"
  "pokedex.thomasbasquin.fr"
  "runway.thomasbasquin.fr"
  "notes.thomasbasquin.fr"
  "stats.thomasbasquin.fr"
  "ressources.thomasbasquin.fr"
)

# Libellé affiché par domaine. Absent de la table -> le domaine lui-même sert
# de libellé.
declare -A LABELS=(
  ["thomasbasquin.fr"]="Portfolio"
  ["pokedex.thomasbasquin.fr"]="Pokédex"
  ["runway.thomasbasquin.fr"]="Runway"
  ["martinbasquin.thomasbasquin.fr"]="Martin Basquin"
  ["mariewach.fr"]="Marie Wach"
  ["nook.thomasbasquin.fr"]="Nook"
  ["stats.thomasbasquin.fr"]="Code Server Titouan"
  ["notes.thomasbasquin.fr"]="Code Server Thomas"
  ["home.thomasbasquin.fr"]="Home"
  ["ressources.thomasbasquin.fr"]="Ressources"
  ["browser.thomasbasquin.fr"]="Browser"
)

# Domaines dont le libellé n'affiche pas les ports surveillés entre parenthèses.
NO_PORT_SUFFIX=(
  "nook.thomasbasquin.fr"
  "runway.thomasbasquin.fr"
)

contains() {
  local needle="$1"
  shift
  for item in "$@"; do
    [ "$item" = "$needle" ] && return 0
  done
  return 1
}

primary_domain() {
  grep -m1 "server_name" "$1" | sed 's/^[[:space:]]*server_name[[:space:]]*//; s/;.*//' | awk '{print $1}'
}

proxy_ports() {
  grep -ohE "proxy_pass[[:space:]]+https?://[^:/]+:[0-9]+" "$1" 2>/dev/null \
    | grep -oE "[0-9]+$" | sort -un
}

check_port() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

check_nginx() {
  systemctl is-active --quiet nginx
}

DOMAINS=()
declare -A ENTRY_LABEL=()
declare -A ENTRY_STATUS=()

for f in "$NGINX_SITES_DIR"/*; do
  [ -f "$f" ] || continue
  domain="$(primary_domain "$f")"
  [ -n "$domain" ] || continue
  contains "$domain" "${EXCLUDE[@]}" && continue

  mapfile -t ports < <(proxy_ports "$f")
  label="${LABELS[$domain]:-$domain}"

  if [ "${#ports[@]}" -eq 0 ]; then
    check_nginx && status=up || status=down
  else
    status=up
    for p in "${ports[@]}"; do
      check_port "$p" || status=down
    done
    if ! contains "$domain" "${NO_PORT_SUFFIX[@]}"; then
      ports_str="${ports[0]}"
      for ((i = 1; i < ${#ports[@]}; i++)); do
        ports_str+=", ${ports[i]}"
      done
      label="$label ($ports_str)"
    fi
  fi

  DOMAINS+=("$domain")
  ENTRY_LABEL["$domain"]="$label"
  ENTRY_STATUS["$domain"]="$status"
done

PRINT_ORDER=()
for d in "${ORDER[@]}"; do
  contains "$d" "${DOMAINS[@]}" && PRINT_ORDER+=("$d")
done
for d in "${DOMAINS[@]}"; do
  contains "$d" "${PRINT_ORDER[@]}" || PRINT_ORDER+=("$d")
done

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

{
  printf '{\n  "generated_at": "%s",\n  "sites": [\n' "$(date -Iseconds)"
  first=1
  for d in "${PRINT_ORDER[@]}"; do
    [ "$first" -eq 1 ] || printf ',\n'
    first=0
    printf '    {"label": "%s", "domain": "%s", "status": "%s"}' \
      "${ENTRY_LABEL[$d]}" "$d" "${ENTRY_STATUS[$d]}"
  done
  printf '\n  ]\n}\n'
} > "$TMP_FILE"

mkdir -p "$OUTPUT_DIR"
mv "$TMP_FILE" "$OUTPUT_FILE"
chmod 644 "$OUTPUT_FILE"
