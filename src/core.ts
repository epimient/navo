import {access, stat, readdir, mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import {constants} from 'node:fs';
import {homedir} from 'node:os';
import {join, resolve, isAbsolute, basename} from 'node:path';
import {randomUUID} from 'node:crypto';
export type Kind = 'CLI' | 'TUI';
export type App = {id:string; name:string; path:string; kind:Kind; category:string; description:string; available:boolean; manual?:boolean};
export type Config = {version:1; manual:App[]; hidden:string[]; favorites:string[]};
export const fresh = ():Config => ({version:1,manual:[],hidden:[],favorites:[]});
const known: Record<string,[Kind,string,string]> = {
 // ── Multimedia ──
 ffmpeg:['CLI','Multimedia','Convierte y procesa audio y video'],
 mpv:['TUI','Multimedia','Reproductor multimedia ligero'],
 vlc:['CLI','Multimedia','Reproductor multimedia VLC'],
 cliamp:['TUI','Multimedia','Reproductor de música'],
 cmus:['TUI','Multimedia','Reproductor de música ncurses'],
 'ani-es':['TUI','Multimedia','Anime desde la terminal'],
 yoinks:['TUI','Multimedia','Descarga videos desde una interfaz interactiva'],
 // ── Documentos ──
 pdfunite:['CLI','Documentos','Combina archivos PDF'],
 // ── Archivos ──
 unrar:['CLI','Archivos','Extrae archivos RAR'],
 tar:['CLI','Archivos','Empaqueta y desempaqueta archivos'],
 zip:['CLI','Archivos','Comprime archivos en ZIP'],
 unzip:['CLI','Archivos','Extrae archivos ZIP'],
 gzip:['CLI','Archivos','Comprime archivos con gzip'],
 xz:['CLI','Archivos','Comprime archivos con xz'],
 bzip2:['CLI','Archivos','Comprime archivos con bzip2'],
 less:['TUI','Archivos','Visor de texto paginado'],
 bat:['CLI','Archivos','Visor de archivos con resaltado de sintaxis'],
 ranger:['TUI','Archivos','Explorador de archivos con vista previa'],
 yazi:['TUI','Archivos','Explorador de archivos rápido'],
 rg:['CLI','Archivos','Búsqueda rápida de texto (ripgrep)'],
 fd:['CLI','Archivos','Búsqueda rápida de archivos'],
 fzf:['TUI','Archivos','Buscador difuso interactivo'],
 tree:['CLI','Archivos','Muestra estructura de directorios'],
 eza:['CLI','Archivos','Listado de archivos mejorado (sucesor de exa)'],
 lsd:['CLI','Archivos','Listado de archivos con iconos'],
 ncdu:['TUI','Archivos','Uso de disco interactivo'],
 dust:['CLI','Archivos','Uso de disco visual'],
 rsync:['CLI','Archivos','Sincroniza archivos y directorios'],
 // ── Sistema ──
 htop:['TUI','Sistema','Monitor de procesos interactivo'],
 btop:['TUI','Sistema','Monitor de recursos del sistema'],
 top:['TUI','Sistema','Monitor de procesos básico'],
 glances:['TUI','Sistema','Monitor completo del sistema'],
 tmux:['TUI','Sistema','Multiplexor de terminal'],
 neofetch:['CLI','Sistema','Información del sistema con logo'],
 fastfetch:['CLI','Sistema','Información del sistema (rápido)'],
 lsblk:['CLI','Sistema','Lista dispositivos de bloques'],
 lscpu:['CLI','Sistema','Información del procesador'],
 lsusb:['CLI','Sistema','Lista dispositivos USB'],
 lspci:['CLI','Sistema','Lista dispositivos PCI'],
 systemctl:['CLI','Sistema','Administra servicios de systemd'],
 journalctl:['CLI','Sistema','Visor de registros del sistema'],
 // ── Internet ──
 'terminal-browser':['TUI','Internet','Navegador de terminal; verifica los argumentos de tu instalación'],
 w3m:['TUI','Internet','Navegador web de terminal'],
 curl:['CLI','Internet','Transfiere datos desde URLs'],
 wget:['CLI','Internet','Descarga archivos de la web'],
 ssh:['CLI','Internet','Conexión remota segura'],
 ping:['CLI','Internet','Comprueba conectividad de red'],
 dig:['CLI','Internet','Consulta registros DNS'],
 traceroute:['CLI','Internet','Traza la ruta de paquetes de red'],
 nmap:['CLI','Internet','Escáner de puertos y red'],
 // ── Editores ──
 nano:['TUI','Editor','Editor de texto sencillo'],
 nvim:['TUI','Editor','Neovim — editor avanzado'],
 vim:['TUI','Editor','Editor de texto Vi mejorado'],
 micro:['TUI','Editor','Editor de texto moderno'],
 helix:['TUI','Editor','Editor de texto modal moderno'],
 // ── Desarrollo ──
 git:['CLI','Desarrollo','Control de versiones'],
 lazygit:['TUI','Desarrollo','Interfaz interactiva de Git'],
 make:['CLI','Desarrollo','Sistema de compilación'],
 gcc:['CLI','Desarrollo','Compilador de C'],
 'g++':['CLI','Desarrollo','Compilador de C++'],
 rustc:['CLI','Desarrollo','Compilador de Rust'],
 cargo:['CLI','Desarrollo','Gestor de paquetes y compilación de Rust'],
 node:['CLI','Desarrollo','Entorno de ejecución JavaScript'],
 npm:['CLI','Desarrollo','Gestor de paquetes de Node.js'],
 python3:['CLI','Desarrollo','Intérprete de Python 3'],
 docker:['CLI','Desarrollo','Gestión de contenedores'],
 jq:['CLI','Desarrollo','Procesa y filtra JSON'],
 perl:['CLI','Desarrollo','Intérprete de Perl'],
 ruby:['CLI','Desarrollo','Intérprete de Ruby'],
 bc:['CLI','Desarrollo','Calculadora de precisión arbitraria'],
 flatpak:['CLI','Desarrollo','Gestión de aplicaciones Flatpak'],
};
export const safeText = (s:string) => s.replace(/[\x00-\x1f\x7f-\x9f]/g,'?');
export async function executable(path:string) {try {await access(path,constants.X_OK); return (await stat(path)).isFile();} catch {return false;}}
export async function scan(path=process.env.PATH??''):Promise<App[]> {
 const found=new Map<string,App>();
 for(const dir of [...new Set(path.split(':').map(p=>resolve(p||'.')))]) {
  let names:string[]; try {names=await readdir(dir);} catch {continue;}
  // Bounded batches keep PATH scans from exhausting file descriptors.
  for(let i=0;i<names.length;i+=64) await Promise.all(names.slice(i,i+64).map(async name=>{
   if(found.has(name)) return; const full=join(dir,name); if(!await executable(full)) return;
   const meta=known[name]; found.set(name,{id:`path:${name}`,name,path:full,kind:meta?.[0]??'CLI',category:meta?.[1]??'Sin clasificar',description:meta?.[2]??'Ejecutable de PATH; revisa su tipo antes de abrir',available:true});
  }));
 }
 return [...found.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
export async function manualApp(command:string, inventory:App[]):Promise<App> {
 const path=command.includes('/')?resolve(command):inventory.find(a=>a.name===command)?.path;
 if(!path || !await executable(path)) throw Error('No se encontró un archivo ejecutable. Usa un nombre de PATH o una ruta.');
 return {id:`manual:${path}`,name:basename(path),path,kind:'CLI',category:'Manual',description:'Aplicación agregada manualmente',available:true,manual:true};
}
export async function mergeApps(inventory:App[], config:Config) {
 const manual=await Promise.all(config.manual.map(async a=>({...a,available:await executable(a.path)})));
 const paths=new Set(manual.map(a=>a.path)),names=new Set(manual.map(a=>a.name)); return [...manual,...inventory.filter(a=>!paths.has(a.path)&&!names.has(a.name))];
}
export function visible(apps:App[],config:Config,view:number,query:string) {
 return apps.filter(a=>{
  if(view===3)return true;
  if(view===2)return config.hidden.includes(a.id);
  if(config.hidden.includes(a.id))return false;
  return view===1 ? config.favorites.includes(a.id) : true;
 })
 .filter(a=>`${a.name} ${a.category} ${a.description}`.toLowerCase().includes(query.toLowerCase()))
 .sort((a,b)=>Number(config.favorites.includes(b.id))-Number(config.favorites.includes(a.id)) || a.name.localeCompare(b.name));
}
export function configPath(env=process.env) {const base=env.XDG_CONFIG_HOME; return join(base&&isAbsolute(base)?base:join(homedir(),'.config'),'navo','config.json');}
export async function loadConfig(file=configPath()):Promise<Config> {
 let raw:string; try {raw=await readFile(file,'utf8');} catch(e) {if((e as NodeJS.ErrnoException).code==='ENOENT') return fresh(); throw e;}
 const c=JSON.parse(raw); const strings=(a:unknown)=>Array.isArray(a)&&a.every(x=>typeof x==='string');
 if(c.version!==1 || !strings(c.hidden)||!strings(c.favorites)||!Array.isArray(c.manual)||!c.manual.every((a:App)=>a&&typeof a.id==='string'&&typeof a.name==='string'&&typeof a.path==='string'&&isAbsolute(a.path)&&(a.kind==='CLI'||a.kind==='TUI')&&typeof a.category==='string'&&typeof a.description==='string')) throw Error('Configuración no válida. Conserva una copia y corrige config.json.');
 return c;
}
export async function saveConfig(config:Config,file=configPath()) {
 await mkdir(resolve(file,'..'),{recursive:true,mode:0o700});
 const temp=`${file}.${randomUUID()}.tmp`; await writeFile(temp,JSON.stringify(config,null,2)+'\n',{mode:0o600}); await rename(temp,file);
}
// Quotes group arguments only. No expansion, pipes, substitution or shell evaluation.
export function parseArgs(input:string):string[] {
 const args:string[]=[]; let word='',quote='',started=false,escape=false;
 for(const c of input) {
  if(c==='\0') throw Error('Argumento no válido');
  if(escape){word+=c;escape=false;started=true;continue;}
  if(c==='\\'&&quote!=="'"){escape=true;started=true;continue;}
  if(quote){if(c===quote) quote=''; else word+=c;continue;}
  if(c==='"'||c==="'"){quote=c;started=true;continue;}
  if(/\s/.test(c)){if(started){args.push(word);word='';started=false;}continue;}
  word+=c;started=true;
 }
 if(quote||escape) throw Error('Cierra las comillas o completa la barra invertida.');
 if(started) args.push(word); return args;
}
