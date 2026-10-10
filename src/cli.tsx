#!/usr/bin/env node
import React,{useEffect,useState} from 'react';
import {render} from 'ink';
import {spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {scan,mergeApps,loadConfig,configPath,type App,type Config,safeText} from './core.js';
import {UI,type Launch} from './ui.js';
import {run} from './runner.js';
const flags=process.argv.slice(2);
if(flags.includes('--help')){console.log('navo — explorador CLI/TUI\n\nnavo          Abre la interfaz\nnavo --list   Lista la biblioteca sin interfaz\nnavo --all    Lista todos los ejecutables\nnavo --config Muestra la ubicación del JSON\nnavo --version');process.exit(0);}
if(flags.includes('--version')){console.log('0.1.0');process.exit(0);}
if(flags.includes('--config')){console.log(configPath());process.exit(0);}
if(flags.some(f=>!['--list','--all'].includes(f))){console.error('Opción desconocida. Usa --help.');process.exit(1);}
let config:Config;
try{config=await loadConfig();}catch(e){console.error(`No se pudo leer ${configPath()}: ${e}`);process.exit(1);}
let inventory=await scan();
if(flags.length){const {visible}=await import('./core.js');for(const a of visible(await mergeApps(inventory,config),config,flags.includes('--all')?3:0,''))console.log(`${a.kind}\t${safeText(a.name)}\t${safeText(a.path)}`);process.exit(0);}
if(!process.stdin.isTTY||!process.stdout.isTTY){console.error('Abre Navo en un terminal interactivo o usa --list.');process.exit(1);}
const saved=spawnSync('stty',['-g'],{stdio:['inherit','pipe','ignore'],encoding:'utf8'});
if(saved.status!==0){console.error('No se pudo guardar el estado del terminal (stty).');process.exit(1);}
const ttyState=saved.stdout.trim();let alternate=false;
const restore=()=>{process.stdin.setRawMode?.(false);spawnSync('stty',[ttyState],{stdio:['inherit','ignore','ignore']});process.stdout.write('\x1b[0m\x1b[?25h\x1b[?1000l\x1b[?1006l\x1b[?2004l'+(alternate?'\x1b[?1049l':''));alternate=false;};
process.on('exit',restore);
process.on('uncaughtException',e=>{restore();console.error(e);process.exit(1);});
process.on('unhandledRejection',e=>{restore();console.error(e);process.exit(1);});
let status='Listo';
function Root({onLaunch}:{onLaunch:(l:Launch)=>void}) {
 const [c,setC]=useState(config),[apps,setApps]=useState<App[]>([]),[message,setMessage]=useState(status);
 useEffect(()=>{let active=true;let scanning=false;
  const refresh=async()=>{if(scanning)return;scanning=true;try{const next=await scan();const old=new Map(inventory.map(a=>[a.id,a.path]));const added=next.filter(a=>!old.has(a.id)).length;const removed=inventory.filter(a=>!next.some(b=>b.id===a.id)).length;const changed=next.filter(a=>old.has(a.id)&&old.get(a.id)!==a.path).length;inventory=next;if(active){setApps(await mergeApps(next,c));setMessage(`Reescaneo: +${added} / −${removed} / ${changed} rutas cambiadas · cada 30 s`);}}catch(e){if(active)setMessage(String(e));}finally{scanning=false;}};
  void mergeApps(inventory,c).then(a=>{if(active)setApps(a);});
  refreshRef=refresh;const timer=setInterval(()=>void refresh(),30000);return()=>{active=false;clearInterval(timer);};
 },[c]);
 return <UI apps={apps} config={c} status={message} onChange={next=>{config=next;setC(next);}} onScan={()=>void refreshRef()} onLaunch={onLaunch}/>;
}
let refreshRef:()=>Promise<void>=async()=>{};
while(true){
 let launch:Launch|undefined;
 process.stdout.write('\x1b[?1049h\x1b[H');alternate=true;
 const terminate=()=>process.exit(143);process.on('SIGTERM',terminate);
 const instance=render(<Root onLaunch={l=>{launch=l;}}/>);await instance.waitUntilExit();instance.unmount();
 try { while(process.stdin.read()!==null){} } catch{}
 process.stdin.pause();process.off('SIGTERM',terminate);restore();
 if(!launch)break;
 const request=launch as Launch;
 console.log(`\nnavo → ${safeText(request.app.path)} ${request.args.map(a=>JSON.stringify(a)).join(' ')}\n`);
 try{const result=await run(request.app.path,request.args);status=`${request.app.name}: ${result.signal??`salida ${result.code}`}`;}catch(e){status=`No se pudo abrir: ${e}`;}
 restore();console.log(safeText(status));
 process.stdin.ref();const rl=createInterface({input:process.stdin,output:process.stdout});try{await rl.question('Enter para volver a Navo…');}catch{}finally{rl.close();}
 inventory=await scan();
}
