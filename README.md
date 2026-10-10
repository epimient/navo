# Navo

```text
▓▒░ NAVO    tus aplicaciones, a mano

 ███╗   ██╗ █████╗ ██╗   ██╗ ██████╗ 
 ████╗  ██║██╔══██╗██║   ██║██╔═══██╗
 ██╔██╗ ██║███████║██║   ██║██║   ██║
 ██║╚██╗██║██╔══██║╚██╗ ██╔╝██║   ██║
 ██║ ╚████║██║  ██║ ╚████╔╝ ╚██████╔╝
 ╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝  ╚═════╝ 
```

**Navo** es un explorador y lanzador de aplicaciones de terminal para Linux.
Descubre los ejecutables disponibles en tu `PATH`, los organiza en una
biblioteca navegable y los ejecuta con los argumentos que escribas, sin salir
nunca de una interfaz de texto.

Interfaz construida con [Ink](https://github.com/vadimdemedes/ink) (React para
terminales) sobre Node.js. No instala paquetes ni modifica tus archivos: solo
lee lo que ya tienes, lo lanza y recuerda tus preferencias.

> Versión actual: **0.1.0**. Navo no instala los programas que lanza; los
> descubre en el sistema donde se ejecuta.

---

## Características

- **Biblioteca**: todos los ejecutables presentes en `PATH` (además de registros
  manuales y favoritos), deduplicados por nombre (gana la primera ruta), con
  soporte de enlaces simbólicos y descarte de directorios o archivos sin permiso
  de ejecución. Los elementos ocultos quedan fuera de esta vista.
- **Favoritos**: solo tus marcados con `f`. Marcar o desmarcar es reversible
  desde cualquier vista, y los favoritos aparecen siempre primero en la lista.
- **Ocultar** (`d`): quita la selección de la interfaz sin desinstalar ni borrar
  archivos. Lo oculto se conserva en `config.json` (campo `hidden`) y sigue
  apareciendo en la lista completa de `navo --all`.
- **Búsqueda** por nombre, categoría y descripción. Los favoritos aparecen
  primero.
- **Agregar** por nombre de `PATH` o por ruta absoluta a un ejecutable, incluso
  si está fuera de `PATH`.
- **Reescaneo** manual (`r`), automático cada 30 s y al volver de una
  aplicación, con aviso de altas, bajas y rutas cambiadas.
- **Lanzamiento seguro** con `child_process.spawn`, `shell: false` y
  entrada/salida heredadas. Los argumentos se pasan de forma literal: no hay
  evaluación de shell, tuberías, redirecciones ni sustitución de variables.
- **Preparación de argumentos** antes de ejecutar, con selección CLI/TUI por
  lanzamiento. Al terminar la aplicación, Navo muestra su estado y espera a que
  pulses Enter para volver, de modo que siempre puedes leer la salida o la ayuda
  que haya impreso (también en el caso TUI).
- **Persistencia** robusta en JSON: versión de esquema, escritura atómica
  (temporal + `rename`), permisos privados y validación al cargar.
- **CLI** para uso sin interfaz: `--list`, `--all`, `--config`, `--help`,
  `--version`.

---

## Requisitos

| Requisito | Detalle |
| --- | --- |
| Sistema | Linux (cualquier distribución) |
| Node.js | **22 o superior** |
| npm | Para instalar y compilar (incluido con Node) |
| `stty` | Normalmente en `coreutils` (viene de serie en todas las distros) |

Comprueba tu versión con `node --version`. Si es menor que 22 (habitual en
Ubuntu LTS) instala una versión LTS compatible antes de continuar; ver
[INSTALL.md](INSTALL.md).

---

## Instalación

### Opción 1 — Script automático (recomendado)

El instalador comprueba los requisitos, instala dependencias, compila y deja el
comando `navo` disponible en `~/.local/bin` sin `sudo`:

```bash
git clone https://github.com/epimient/navo.git navo
cd navo
./install.sh
```

Si `~/.local/bin` no está en tu `PATH`, el propio script te indica la línea que
debes añadir a tu shell. Vuelve a abrir la terminal y ejecuta:

```bash
navo
```

Puedes cambiar el prefijo de instalación (por ejemplo `/usr/local`) con:

```bash
PREFIX=/usr/local ./install.sh
```

### Opción 2 — Instalación global con npm

Requisito: Node.js 22 o superior. Desde la carpeta del proyecto:

```bash
npm install -g .
navo
```

### Opción 3 — Uso local sin instalar

```bash
npm ci
npm run build
npm start        # abre la interfaz
```

O bien, para tener el comando `navo` sin instalación global ni `sudo`:

```bash
mkdir -p "$HOME/.local/bin"
chmod +x bin/navo
ln -s "$PWD/bin/navo" "$HOME/.local/bin/navo"
export PATH="$HOME/.local/bin:$PATH"
navo
```

El enlace depende de que conserves el proyecto y sus dependencias en su
ubicación.

### Desinstalar

```bash
./uninstall.sh
```

Elimina el lanzador. No toca la copia del código ni tu configuración. Si
instalaste con npm: `npm uninstall -g navo`.

---

## Uso

### Interfaz

Ejecuta `navo` en una terminal interactiva (mínimo 48 × 18; recomendado
80 × 24).

| Tecla | Acción |
| --- | --- |
| `1` / `2` | Ir a Biblioteca / Favoritos |
| `←` / `→` o `Tab` | Cambiar vista (Biblioteca ↔ Favoritos) |
| `↑` / `↓` o `j` / `k` | Mover selección |
| `g` / `G` | Ir al inicio / fin de la lista |
| `/` | Editar búsqueda; `Enter` termina, `Esc` sale |
| `Esc` en la lista | Limpiar búsqueda |
| `f` | Alternar favorito |
| `a` | Agregar nombre o ruta; `Enter` guarda |
| `d` | Ocultar la selección (no la desinstala; se conserva en `config.json`) |
| `Enter` / `o` | Abrir la pantalla de preparación y lanzar (con o sin argumentos) |
| `Tab` en preparación | Alternar CLI/TUI para ese lanzamiento |
| `r` | Reescanear |
| `q` o `Ctrl+C` | Salir de Navo |

El editor de texto agrega al final y borra con retroceso; no tiene edición con
cursor ni autocompletado.

### Línea de comandos

```text
navo --help      Ayuda y opciones
navo --version   Muestra la versión
navo --config    Ruta del archivo de configuración
navo --list      Lista la biblioteca: todos los ejecutables del PATH (sin interfaz)
navo --all       Igual que --list, incluidos los ocultos (sin interfaz)
```

### Argumentos de lanzamiento

En el cuadro de argumentos escribe **solo los argumentos**, sin repetir el
comando:

| Aplicación | Tipo inicial | Ejemplo |
| --- | --- | --- |
| `ffmpeg` | CLI | `-i "mi video.mp4" salida.mp3` |
| `pdfunite` | CLI | `primero.pdf segundo.pdf combinado.pdf` |
| `unrar` | CLI | `x archivo.rar` |
| `cliamp` | TUI | Según tu instalación |
| `ani-es` | TUI | Según tu instalación |
| `terminal-browser` | TUI | Según tu instalación |
| `yoinks` | TUI | Vacío o una URL |

Las comillas simples o dobles agrupan argumentos; la barra invertida escapa un
carácter fuera de comillas simples. No se expanden `~`, `$HOME`, comodines,
tuberías, redirecciones ni sustituciones. Usa rutas explícitas.

La clasificación CLI/TUI se basa en el nombre, no en ejecutar ni inspeccionar el
programa: verifica el tipo para tu versión concreta, especialmente en los
wrappers de `terminal-browser`.

---

## Configuración y datos

Navo guarda su configuración en:

```text
$XDG_CONFIG_HOME/navo/config.json     # si XDG_CONFIG_HOME es absoluto
~/.config/navo/config.json            # en caso contrario
```

Se almacenan las aplicaciones manuales, los favoritos y los elementos ocultos.
Para restaurar un elemento oculto, quítalo del campo `hidden`. No se guardan
argumentos ni historial. Si el JSON está corrupto, Navo se detiene
mostrando su ruta y **no lo sobrescribe**: puedes conservarlo y corregirlo a
mano. Evita editarlo desde dos instancias simultáneas; no hay bloqueo entre
procesos.

---

## Arquitectura

```text
src/
├── core.ts     Catálogo, descubrimiento en PATH, configuración y parseo de argumentos
├── ui.tsx      Interfaz React/Ink (vistas, búsqueda, favoritos, lanzamiento)
├── runner.ts   Ejecución de procesos hijo y manejo de señales del terminal
└── cli.tsx     Punto de entrada: flags, ciclo de vida del terminal y bucle principal
```

- `core.ts` no depende de Ink y es la única capa con lógica de sistema de
  archivos y configuración; es la parte cubierta por las pruebas unitarias.
- `ui.tsx` presenta el estado y delega toda la persistencia en `core.ts`.
- `runner.ts` lanza el proceso con `shell: false` y gestiona `SIGINT`,
  `SIGQUIT` y `SIGTERM` para que la terminal quede siempre en un estado válido.
- `cli.tsx` guarda y restaura `termios` con `stty`, usa la pantalla alternativa
  y desmonta Ink antes de ceder el terminal a la aplicación hija.

Diseño visual retro de fósforo ámbar: marco doble, cabecera con bloques,
selección en vídeo inverso y tonos ámbar para texto y estado. El fondo se hereda
del terminal (se recomienda un tema oscuro). Una lista vertical más una ficha
inferior mantienen siempre visible la ruta del ejecutable. Se usa la fuente
monoespaciada que tenga configurada el usuario.

---

## Desarrollo

```bash
npm install
npm run check          # comprobación de tipos (tsc --noEmit)
npm test               # pruebas unitarias (node:test)
npm run build          # compila TypeScript a dist/
npm run dev            # ejecuta la interfaz en modo desarrollo (tsx)
npm run test:terminal  # pruebas de terminal en pseudoterminal (requiere Python 3)
```

¿Quieres colaborar? Consulta [CONTRIBUTING.md](CONTRIBUTING.md): convenciones
de código, cómo estructurar los cambios y qué pruebas deben pasar.

---

## Pruebas

- **Unitarias** (`test/core.test.ts`, con `node:test`): argumentos literales,
  precedencia y filtros de `PATH`, persistencia y corrupción del JSON, y
  errores/códigos de salida de procesos.
- **De terminal** (`test/terminal.py`, requiere Python 3 y un pseudoterminal):
  TUI, CLI, `Ctrl+C` durante la aplicación hija y `Ctrl+C` en Navo, comparando
  el estado `termios` antes y después. No modifican tu biblioteca: usan una
  aplicación de prueba y una configuración temporal.

---

## Solución de problemas

| Síntoma | Causa y solución |
| --- | --- |
| `comando no encontrado: navo` | `~/.local/bin` no está en `PATH`. Añade `export PATH="$HOME/.local/bin:$PATH"` a tu shell y reiníciala. |
| «No se pudo guardar el estado del terminal» | Falta `stty` (paquete `coreutils`). Instálalo con el gestor de tu distribución. |
| El terminal queda con formato raro tras un cierre forzado | Ejecuta `reset` o abre una terminal nueva. Navo restaura `termios` en salidas normales; `SIGKILL` no permite limpieza. |
| Necesitas Node 22+ y tu distro ofrece menos | Instala una versión LTS desde [nodejs.org](https://nodejs.org/en/download) o con un gestor de versiones (`nvm`, `fnm`). Ver [INSTALL.md](INSTALL.md). |
| Una aplicación manual aparece como no disponible | Su ruta ya no es ejecutable. Edita `config.json` o vuelve a agregarla. |

---

## Limitaciones

- No descubre alias, funciones de shell, aplicaciones gráficas ni comandos fuera
  de `PATH`, salvo que los agregues a mano.
- Los cambios de `PATH` hechos en otra shell requieren reiniciar Navo.
- El reescaneo es periódico; no observa el sistema de archivos en tiempo real.
- El tipo CLI/TUI elegido al lanzar no se persiste entre sesiones.
- No hay instalación de paquetes, plugins, ejecución en segundo plano ni
  cadenas de comandos.
- `SIGKILL` no permite limpieza del terminal; usa `reset` si ocurre.

---

## Licencia

MIT. Ver [LICENSE](LICENSE).

## Referencias

- [Ink](https://github.com/vadimdemedes/ink) — React para interfaces de terminal.
- [Yoinks](https://github.com/pablostanley/yoinks) — referencia de composición
  React/Ink y uso de la pantalla alternativa. La implementación de Navo es
  propia.
