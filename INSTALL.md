# Instalación de Navo en Linux

Navo funciona en cualquier distribución de Linux con **Node.js 22 o superior**.
Esta guía cubre la instalación de los requisitos por familia de distribuciones y
las tres formas de instalar Navo.

## 1. Instalar Node.js 22+

Comprueba primero qué tienes:

```bash
node --version
```

Si el resultado es `v22` o superior, salta al paso 2. Muchas distribuciones
estables aún ofrecen Node 18/20; en ese caso usa una de estas alternativas.

### Debian, Ubuntu, Linux Mint, Pop!_OS, Kali, Zorin

El paquete `nodejs` de los repositorios suele ser antiguo. Opciones:

```bash
# Opción A — repositorio oficial de NodeSource (Node 22 LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Opción B — gestor de versiones (sin sudo, recomendado para uso personal)
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 22 && fnm use 22
```

Paquetes del sistema necesarios:

```bash
sudo apt-get update
sudo apt-get install -y coreutils
```

### Fedora, RHEL, CentOS Stream, Rocky, AlmaLinux, Nobara

```bash
# Node 22 desde el módulo oficial (Fedora/RHEL 8+) o NodeSource
sudo dnf install -y nodejs npm coreutils
node --version

# Si la versión es < 22, usa NodeSource:
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
```

### Arch Linux, CachyOS, Manjaro, EndeavourOS

```bash
sudo pacman -Syu --needed nodejs npm coreutils
node --version
```

### openSUSE Leap / Tumbleweed

```bash
sudo zypper install -y nodejs22 npm coreutils
# o el metapaquete: sudo zypper install -y nodejs npm
node --version
```

### Alpine Linux

```bash
sudo apk add nodejs npm coreutils
node --version
```

### Cualquier distribución (recomendado y uniforme): `fnm`

Si no quieres depender de los repositorios de tu distro:

```bash
curl -fsSL https://fnm.vercel.app/install | bash
# reinicia la shell o carga el entorno que indique el instalador
fnm install 22
fnm default 22
node --version      # debe mostrar v22.x o superior
```

## 2. Obtener Navo

```bash
git clone <url-del-repositorio> navo
cd navo
```

Si recibiste el proyecto como carpeta o archivo comprimido, entra en ella y
continúa con el paso 3.

## 3. Instalar Navo

### A. Script automático (no requiere sudo)

```bash
./install.sh
```

Instala las dependencias, compila y crea el comando `navo` en `~/.local/bin`.
Para elegir otro prefijo:

```bash
PREFIX=/usr/local ./install.sh     # necesitará sudo si el prefijo no es tuyo
```

### B. Instalación global con npm

```bash
npm install -g .
navo
```

### C. Ejecución local sin instalar

```bash
npm ci
npm run build
npm start
```

## 4. Verificar

```bash
navo --version
navo --help
navo --list
```

## 5. Desinstalar

```bash
./uninstall.sh                 # instalación por script (símbolo en ~/.local/bin)
npm uninstall -g navo          # instalación global con npm
```

La configuración en `~/.config/navo/config.json` no se elimina en ningún caso.
Bórrala manualmente si quieres restablecer Navo por completo.

## Instalación sin conexión (desde un tarball)

En una máquina con las dependencias ya instaladas puedes generar un paquete:

```bash
npm pack
# genera navo-0.1.0.tgz
```

Copia el `.tgz` a la máquina destino (que solo necesita Node 22+ y npm) e
instálalo:

```bash
npm install -g navo-0.1.0.tgz
navo
```
