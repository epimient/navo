# Contribuir a Navo

Gracias por tu interés en mejorar Navo. Esta guía explica cómo colaborar de
forma ordenada: qué necesitas, cómo preparar el entorno, las convenciones de
código que ya se usan en el proyecto y cómo validar tus cambios antes de
enviarlos.

## Formas de contribuir

- **Informar de un error**: describe qué esperabas, qué ocurrió, tu versión de
  Navo (`navo --version`), distribución y el terminal que usas. Si el problema
  deja el terminal con formato raro, indica si lo recuperaste con `reset`.
- **Proponer una mejora**: abre un *issue* con el caso de uso antes de escribir
  código. Cambios grandes se discuten mejor antes de implementar.
- **Enviar cambios**: sigue los pasos de abajo y abre un *pull request*.

## Entorno de desarrollo

Requisitos: Node.js **22 o superior** (ver [INSTALL.md](INSTALL.md)) y Python 3
solo para las pruebas de terminal.

```bash
npm install
npm run check          # comprobación de tipos (tsc --noEmit)
npm test               # pruebas unitarias (node:test)
npm run test:terminal  # pruebas de terminal en pseudoterminal (Python 3)
```

Un cambio solo es válido si pasan las tres comprobaciones.

## Estructura del proyecto

```text
src/
├── core.ts     Catálogo, descubrimiento en PATH, configuración y parseo de argumentos
├── ui.tsx      Interfaz React/Ink (sin lógica de sistema de archivos)
├── runner.ts   Ejecución de procesos hijo y manejo de señales
└── cli.tsx     Punto de entrada, ciclo de vida del terminal y bucle principal
test/
├── core.test.ts   Pruebas unitarias con node:test
└── terminal.py    Pruebas de terminal en pseudoterminal
```

## Convenciones de código

- **Capas**: `core.ts` es la única capa con lógica de sistema de archivos y
  configuración; no debe depender de Ink. `ui.tsx` solo presenta estado y delega
  la persistencia en `core.ts`. Añade lógica nueva a la capa correcta.
- **Estilo**: seguir el estilo del archivo que toques. El proyecto usa
  TypeScript estricto (`strict: true`), módulos ES (`NodeNext`) y el estilo sin
  punto y coma (ASI).
- **Nombres y textos**: identadores y clases sin prefijos innecesarios
  (`manualApp`, no `addManualApplication`). Los textos visibles para el usuario
  están en español; si tocas la interfaz, mantén ese idioma.
- **Comentarios**: mínimos y solo cuando expliquen el *porqué*, no el *qué*.
- **Seguridad**: nunca se ejecuta la aplicación con `shell: true`, no se
  expanden metacaracteres y la configuración se escribe atómicamente. No
  introduzcas cambios que debiliten esto sin avisar en el PR.
- **Compatibilidad**: el objetivo es cualquier distribución de Linux con Node
  22+. Los scripts de shell (`install.sh`, `uninstall.sh`) deben ser POSIX `sh`,
  no bash.

## Pruebas

- **Unitarias** (`test/core.test.ts`): cubren `core.ts` y `runner.ts`. Si añades
  lógica nueva, añade pruebas para ella.
- **De terminal** (`test/terminal.py`): verifican que la terminal queda en su
  estado original (`termios`) tras TUI, CLI, interrupción y salida. No usan tu
  biblioteca: crean una configuración y una aplicación de prueba temporales.

Ejecuta siempre `npm run test:terminal` después de tocar el ciclo de vida del
terminal; es lento, pero es la única garantía de que la pantalla se restaura.

## Flujo de un pull request

1. Crea una rama con nombre descriptivo: `fix/terminal-restore`,
   `feat/search-accent`.
2. Haz cambios pequeños y enfocados. Un PR = una cosa.
3. Ejecuta y verifica que pasen `npm run check`, `npm test` y
   `npm run test:terminal`.
4. En la descripción del PR explica el problema o la motivación, el enfoque y
   cómo lo verificaste (qué sistema y versión de Node).
5. Si el cambio toca documentación, mantenla al día (README, INSTALL).

## Ayuda

Si tienes dudas sobre dónde empieza cada responsabilidad o por qué se tomó una
decisión de diseño, revisa la sección **Arquitectura** del
[README.md](README.md). Los nombres de los archivos y las pruebas son la mejor
documentación del límite entre capas.