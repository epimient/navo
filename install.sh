#!/bin/sh
# Navo installer — instala el lanzador en $PREFIX/bin sin necesidad de sudo.
# Uso:  ./install.sh            (prefijo por defecto: ~/.local)
#       PREFIX=/usr/local ./install.sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PREFIX=${PREFIX:-"$HOME/.local"}
BIN_DIR="$PREFIX/bin"
MIN_NODE=22

say()  { printf '%s\n' "$*"; }
fail() { printf 'Error: %s\n' "$*" >&2; exit 1; }

# --- Comprobaciones básicas -------------------------------------------------
case "$(uname -s)" in
  Linux) ;;
  *) fail "Navo está pensado para Linux (detectado: $(uname -s))." ;;
esac

command -v node >/dev/null 2>&1 || fail "Node.js no está instalado. Instala Node 22+ y reintenta (ver INSTALL.md)."
command -v npm  >/dev/null 2>&1 || fail "npm no está instalado. Instálalo junto con Node.js."

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
[ "$NODE_MAJOR" -ge "$MIN_NODE" ] 2>/dev/null || fail "Se requiere Node.js >= $MIN_NODE (tienes $(node --version)). Ver INSTALL.md."

command -v stty >/dev/null 2>&1 || say "Aviso: no se encontró 'stty' (coreutils). Navo lo necesita para restaurar el terminal."

# --- Dependencias y compilación ---------------------------------------------
cd "$SCRIPT_DIR"
if [ -f package-lock.json ]; then
  say "Instalando dependencias (npm ci)..."
  npm ci --no-audit --no-fund
else
  say "Instalando dependencias (npm install)..."
  npm install --no-audit --no-fund
fi

say "Compilando TypeScript..."
npm run build

[ -f "$SCRIPT_DIR/dist/cli.js" ] || fail "La compilación no generó dist/cli.js."

# --- Lanzador ---------------------------------------------------------------
mkdir -p "$BIN_DIR"
chmod +x "$SCRIPT_DIR/bin/navo" 2>/dev/null || true
ln -sf "$SCRIPT_DIR/bin/navo" "$BIN_DIR/navo"
say "Lanzador instalado en $BIN_DIR/navo"

# --- Aviso de PATH ----------------------------------------------------------
case ":${PATH}:" in
  *":$BIN_DIR:"*) : ;;
  *)
    say ""
    say "Añade $BIN_DIR a tu PATH. Por ejemplo, para bash:"
    say "  echo 'export PATH=\"$BIN_DIR:\$PATH\"' >> ~/.bashrc && source ~/.bashrc"
    say "Para zsh cambia ~/.bashrc por ~/.zshrc; para fish usa:"
    say "  fish_add_path $BIN_DIR"
    ;;
esac

say ""
say "Instalación completada. Ejecuta: navo"
