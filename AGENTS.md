# AGENTS.md

Navo: explorador/lanzador de aplicaciones de terminal para Linux. TypeScript,
React, Ink, ESM, Node >= 22. Interfaz y textos en español.

## Comandos

```bash
npm run check          # typecheck (tsc --noEmit). No hay linter ni formatter configurados.
npm test               # unitarias (node:test, vía tsx sobre src)
npm run build          # tsc → dist/
npm run dev            # ejecuta src/cli.tsx con tsx (sin compilar)
npm run test:terminal  # 4 pruebas PTY con Python 3 sobre dist/cli.js
```

- **Verificación completa**: `npm run check && npm test && npm run build && npm run test:terminal`.
- **`test:terminal` ejecuta `dist/cli.js`, no `src/`** — compila primero o probarás código obsoleto. Tarda ~2 min; para iterar corre un modo suelto: `python3 test/terminal.py tui`.
- Una sola prueba unitaria: `node --import tsx --test test/core.test.ts`.

## Estructura y arquitectura

- `src/core.ts` — única capa con fs/config/parseo; **no importa Ink ni React**.
- `src/ui.tsx` — UI React/Ink; solo presenta estado, no toca el sistema de archivos.
- `src/runner.ts` — `spawn` de la app hija y manejo de señales.
- `src/cli.tsx` — entrada, flags, ciclo de vida del terminal (stty, pantalla alternativa) y bucle principal.
- Añade lógica nueva a la capa correcta; las pruebas unitarias cubren `core.ts` y `runner.ts`, las PTY cubren el ciclo de vida del terminal.
- `test/terminal.py` crea configuración y app temporales; no toca la biblioteca del usuario.

## Convenciones que se rompen fácil

- **Imports ESM con extensión `.js` aunque el archivo sea `.ts`**: `import {x} from './core.js'`. Escribir `./core.ts` rompe el build bajo `NodeNext`.
- **Estilo ASI**: sin punto y coma, comillas simples, TS estricto.
- **Textos visibles en español** — mantenlo.
- **Invariante de seguridad**: ejecución siempre con `shell: false` y argumentos literales (sin expansión de metacaracteres). No lo debilites.
- `tsconfig.json` es JSON en una sola línea; edítalo con cuidado.
- Los scripts `install.sh`/`uninstall.sh` deben ser **POSIX `sh`** (sobreviven en dash), no bash. `uninstall.sh` solo borra el enlace; nunca la configuración del usuario.
- El paquete npm (`files`) empaqueta `dist/` precompilado y `bin/navo`; `prepare` reconstruye en instalación global (`npm install -g .`).
- Salida de `navo` headless: `--list`/`--all` funcionan sin TTY; la TUI no.

## Estado del repo

- Aún no es repositorio git (no hay `.git`): no asumas `git status` ni historial.
- No hay CI, pre-commit ni formatter: la verificación recae en los comandos de arriba.
- `.gitignore`: `node_modules/`, `dist/`, `*.tgz` — pero `dist/` está versionado en el tarball npm.