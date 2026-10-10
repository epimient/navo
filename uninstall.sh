#!/bin/sh
# Navo uninstaller — elimina el lanzador instalado por install.sh.
# No borra el código del proyecto ni la configuración del usuario.
set -eu

PREFIX=${PREFIX:-"$HOME/.local"}
BIN_DIR="$PREFIX/bin"
TARGET="$BIN_DIR/navo"

if [ -L "$TARGET" ]; then
  # Solo eliminamos si apunta a un bin/navo de este proyecto.
  DEST=$(readlink "$TARGET" 2>/dev/null || true)
  case "$DEST" in
    */bin/navo)
      rm -f "$TARGET"
      printf 'Lanzador eliminado: %s\n' "$TARGET"
      ;;
    *)
      printf 'Aviso: %s no apunta a un lanzador de Navo; no se elimina.\n' "$TARGET" >&2
      exit 1
      ;;
  esac
elif [ -e "$TARGET" ]; then
  printf 'Aviso: %s existe pero no es un enlace de Navo; no se elimina.\n' "$TARGET" >&2
  exit 1
else
  printf 'No hay lanzador en %s. Nada que hacer.\n' "$TARGET"
fi

printf 'Tu configuración en ~/.config/navo/ no se ha tocado.\n'
