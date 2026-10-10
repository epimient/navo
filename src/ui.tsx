import React,{useState,useEffect} from 'react';
import {Box,Text,useInput,useApp,useStdout} from 'ink';
import {type App,type Config,type Kind,visible,parseArgs,manualApp,saveConfig,safeText} from './core.js';
export type Launch={app:App;args:string[];kind:Kind};
export function UI({apps,config,status,onChange,onScan,onLaunch}:{apps:App[];config:Config;status:string;onChange:(c:Config)=>void;onScan:()=>void;onLaunch:(l:Launch)=>void}) {
 const {exit}=useApp(); const {stdout}=useStdout();
 const [size,setSize]=useState({w:stdout.columns||80,h:stdout.rows||24});
 useEffect(()=>{const resize=()=>setSize({w:stdout.columns||80,h:stdout.rows||24});stdout.on('resize',resize);return()=>{stdout.off('resize',resize);};},[stdout]);
 const [view,setView]=useState(0),[query,setQuery]=useState(''),[index,setIndex]=useState(0);
 const [mode,setMode]=useState<'list'|'search'|'add'|'launch'>('list'),[input,setInput]=useState(''),[kind,setKind]=useState<Kind>('CLI'),[target,setTarget]=useState<App>();
 const [notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const rows=visible(apps,config,view,query), selected=rows[Math.min(index,Math.max(0,rows.length-1))];
 const count=Math.max(2,size.h-16),start=Math.max(0,Math.min(index,rows.length-1)-count+1);
 async function persist(c:Config){setBusy(true);try {await saveConfig(c);onChange(c);setNotice('Guardado');} catch(e){setNotice(String(e));}finally{setBusy(false);}}
 useInput((text,key)=>{
  if(busy)return;
  if(key.ctrl&&text==='c'){exit();return;}
  if(mode!=='list') {
   if(key.escape){setMode('list');setNotice('');return;}
   if(mode==='launch'&&key.tab){setKind(k=>k==='CLI'?'TUI':'CLI');return;}
   if(key.return){
    if(mode==='search'){setMode('list');return;}
    if(mode==='add'){setBusy(true);void manualApp(input,apps).then(a=>persist({...config,manual:[...config.manual.filter(x=>x.id!==a.id),a],hidden:config.hidden.filter(x=>x!==a.id)})).then(()=>setMode('list')).catch(e=>setNotice(String(e))).finally(()=>setBusy(false));return;}
    if(target)try{onLaunch({app:target,args:parseArgs(input),kind});exit();}catch(e){setNotice(String(e));}return;
   }
   if(key.backspace||key.delete){if(mode==='search'){setQuery(s=>[...s].slice(0,-1).join(''));setIndex(0);}else setInput(s=>[...s].slice(0,-1).join(''));return;}
   if(!key.ctrl&&!key.meta&&!key.upArrow&&!key.downArrow&&!key.leftArrow&&!key.rightArrow&&text){const clean=text.replace(/[\x00-\x1f\x7f-\x9f]/g,'');if(mode==='search'){setQuery(s=>s+clean);setIndex(0);}else setInput(s=>s+clean);}return;
  }
  if(text==='q'){exit();return;}
  if(text==='1'){setView(0);setIndex(0);return;}
  if(text==='2'){setView(1);setIndex(0);return;}
  if(key.tab||key.rightArrow){setView(v=>(v+1)%2);setIndex(0);return;}
  if(key.leftArrow){setView(v=>(v+1)%2);setIndex(0);return;}
  if(key.upArrow||text==='k'){setIndex(i=>Math.max(0,i-1));return;}
  if(key.downArrow||text==='j'){setIndex(i=>Math.max(0,Math.min(rows.length-1,i+1)));return;}
  if(text==='g'){setIndex(0);return;}
  if(text==='G'){setIndex(Math.max(0,rows.length-1));return;}
  if(text==='/'){setMode('search');return;}
  if(key.escape){setQuery('');setIndex(0);return;}
  if(text==='r'){onScan();return;}
  if(text==='a'){setMode('add');setInput('');setNotice('');return;}
  if(selected&&text==='f'){void persist({...config,favorites:config.favorites.includes(selected.id)?config.favorites.filter(x=>x!==selected.id):[...config.favorites,selected.id]});return;}
  if(selected&&text==='d'){void persist({...config,hidden:[...new Set([...config.hidden,selected.id])]});return;}
  if(selected&&(key.return||text==='o')){setTarget(selected);setKind(selected.kind);setInput('');setNotice('');setMode('launch');return;}
 });
 const clip=(s:string,n=size.w-8)=>safeText(s).slice(0,Math.max(1,n));
 if(size.w<48||size.h<18)return <Box flexDirection="column"><Text>Navo necesita 48 columnas × 18 filas.</Text><Text>Amplía el terminal. q para salir.</Text></Box>;
 const phosphor = '#E9B65C';
 const muted = '#A38B63';
 const paper = '#F6DEAE';
 const inkC = '#19150F';
 const bright = '#FFD700';
 const width = size.w - 6;
 const viewNames = ['Biblioteca','Favoritos'];
 if(mode==='launch'&&target) {
  // ── Pantalla completa de lanzamiento ──
  return <Box flexDirection="column" paddingX={1} width={size.w} borderStyle="double" borderColor={bright}>
   <Box justifyContent="space-between"><Text bold color={bright}> ▶ LANZAR APLICACIÓN </Text><Text color={muted}>Esc cancela</Text></Box>
   <Text color={muted} wrap="truncate-end">{'━'.repeat(size.w-4)}</Text>
   <Text> </Text>
   <Text color={paper} bold wrap="truncate-end">  Aplicación:  <Text color={bright}>{clip(target.name,40)}</Text></Text>
   <Text color={paper} wrap="truncate-end">  Ruta:        <Text color={muted}>{clip(target.path,size.w-20)}</Text></Text>
   <Text color={paper} wrap="truncate-end">  Categoría:   {target.category}</Text>
   <Text color={paper} wrap="truncate-end">  Modo:        <Text color={bright}>{kind}</Text> <Text color={muted}>(Tab para cambiar)</Text></Text>
   <Text> </Text>
   <Text color={muted} wrap="truncate-end">{'━'.repeat(size.w-4)}</Text>
   <Text color={paper} wrap="truncate-end">  Argumentos (opcional):</Text>
   <Box paddingX={2}><Text color={bright} wrap="truncate-end">{'>'} {input}█</Text></Box>
   <Text> </Text>
   <Box gap={2}>
    <Text backgroundColor={bright} color={inkC} bold> Enter → Ejecutar </Text>
    <Text color={muted}> Tab → CLI/TUI </Text>
    <Text color={muted}> Esc → Cancelar </Text>
   </Box>
  </Box>;
 }
 return <Box flexDirection="column" paddingX={1} width={size.w} borderStyle="double" borderColor={phosphor}>
  <Box justifyContent="space-between"><Text bold color={phosphor}> ▓▒░ NAVO </Text><Text color={muted}>tus aplicaciones, a mano </Text></Box>
  <Text color={muted} wrap="truncate-end">{'─'.repeat(size.w-4)}</Text>
  <Box gap={1}>{viewNames.map((name,i)=><Text key={name} bold={i===view} color={i===view?inkC:muted} backgroundColor={i===view?phosphor:undefined}> {i+1}·{name} </Text>)}<Text color={muted}> ←→ navegar</Text></Box>
  <Text color={mode==='search'?paper:muted} wrap="truncate-end"> BUSCAR / {query||'nombre o categoría'}{mode==='search'?'█':''}</Text>
  <Text color={muted} wrap="truncate-end"> {rows.length} resultados / {apps.length} ejecutables</Text>
  <Text color={phosphor} wrap="truncate-end">   APLICACIÓN                  TIPO  CATEGORÍA</Text>
  <Box flexDirection="column" height={count}>
   {rows.slice(start,start+count).map(a=>{
    const active=selected?.id===a.id;
    const line=`${active?'>':' '} ${config.favorites.includes(a.id)?'★':' '} ${clip(a.name,24).padEnd(24)} ${a.kind}  ${a.available?a.category:'No disponible'}`;
    return <Text key={a.id} color={active?inkC:paper} backgroundColor={active?phosphor:undefined} bold={active} wrap="truncate-end">{clip(line,width).padEnd(width)}</Text>;
   })}
   {!rows.length&&<Text color={muted} wrap="truncate-end">Sin resultados. 1-2 o ←→: cambiar vista / f para marcar favorito.</Text>}
  </Box>
  <Box flexDirection="column" borderStyle="single" borderColor={muted} paddingX={1}>
   {mode==='add'?<><Text color={phosphor} bold wrap="truncate-end">AGREGAR / nombre o ruta absoluta</Text><Text color={paper} wrap="truncate-end">{clip(input)}█</Text><Text color={muted} wrap="truncate-end">Enter guarda / Esc cancela</Text></>:<><Text color={paper} wrap="truncate-end">{clip(selected?.description??'Selecciona una aplicación')}</Text><Text color={muted} wrap="truncate-end">{clip(selected?.path??'')}</Text><Text color={phosphor} wrap="truncate-end">Enter o 'o': preparar y lanzar / f favorito / d quitar de la interfaz</Text></>}
  </Box>
  <Text color={phosphor} wrap="truncate-end"> {clip(notice||status)}</Text>
  <Text color={muted} wrap="truncate-end"> / buscar  ↑↓ mover  1-2 o ←→ vistas  g/G inicio/fin</Text>
  <Text color={muted} wrap="truncate-end"> a agregar  r reescanear  q salir</Text>
 </Box>;
}
