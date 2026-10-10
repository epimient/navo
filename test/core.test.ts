import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,chmod,rm,readFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scan,parseArgs,fresh,saveConfig,loadConfig,visible,manualApp,mergeApps} from '../src/core.js';
import {run} from '../src/runner.js';
test('argumentos: comillas, vacíos y metacaracteres literales',()=>{
 assert.deepEqual(parseArgs(`-i "mi video.mp4" '' '$(touch /tmp/no)' ';'`),['-i','mi video.mp4','','$(touch /tmp/no)',';']);
 assert.throws(()=>parseArgs('"sin cerrar'));assert.throws(()=>parseArgs('abc\\'));
});
test('PATH: precedencia, enlaces, permisos, directorios y biblioteca',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'navo-'));try{
 const a=join(dir,'a'),b=join(dir,'b');await mkdir(a);await mkdir(b);
 for(const p of [join(a,'ffmpeg'),join(b,'ffmpeg'),join(a,'extra')])await writeFile(p,'#!/bin/sh\nexit 0\n',{mode:0o755});
 await writeFile(join(a,'noexec'),'');await mkdir(join(a,'folder'));await symlink(join(a,'ffmpeg'),join(a,'alias'));
 const apps=await scan(`${a}:${b}:/not/a/directory`);assert.equal(apps.length,3);assert.equal(apps.find(x=>x.name==='ffmpeg')?.path,join(a,'ffmpeg'));
 const c=fresh();assert.deepEqual(visible(apps,c,0,'').map(a=>a.name),['alias','extra','ffmpeg']);c.favorites.push('path:extra');assert.equal(visible(apps,c,0,'')[0].name,'extra');assert.deepEqual(visible(apps,c,1,'').map(a=>a.name),['extra']);c.hidden.push('path:extra');assert.equal(visible(apps,c,2,'').length,1);assert.equal(visible(apps,c,1,'').length,0);
 const manual=await manualApp(join(a,'extra'),apps);c.manual.push(manual);await rm(manual.path);assert.equal((await mergeApps(apps,c)).find(a=>a.manual)?.available,false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('merge: el manual gana por nombre y visible(3) incluye ocultas',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'navo-merge-'));try{
  const a=join(dir,'a'),b=join(dir,'b');await mkdir(a);await mkdir(b);
  await writeFile(join(a,'foo'),'#!/bin/sh\nexit 0\n',{mode:0o755});await writeFile(join(b,'foo'),'#!/bin/sh\nexit 0\n',{mode:0o755});
  const inv=await scan(`${a}:${b}`);const c=fresh();
  c.manual.push({id:`manual:${join(b,'foo')}`,name:'foo',path:join(b,'foo'),kind:'CLI',category:'Manual',description:'x',available:true,manual:true});
  const merged=await mergeApps(inv,c);assert.equal(merged.filter(x=>x.name==='foo').length,1);assert.equal(merged.find(x=>x.name==='foo')?.manual,true);
  c.hidden.push(merged[0].id);
  assert.ok(visible(merged,c,3,'').some(x=>x.id===merged[0].id));assert.equal(visible(merged,c,0,'').some(x=>x.id===merged[0].id),false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('JSON round trip y archivo corrupto preservado',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'navo-config-'));try{const file=join(dir,'navo','config.json');const c=fresh();c.favorites=['path:ffmpeg'];await saveConfig(c,file);assert.deepEqual(await loadConfig(file),c);await writeFile(file,'broken');await assert.rejects(loadConfig(file));assert.equal(await readFile(file,'utf8'),'broken');}finally{await rm(dir,{recursive:true,force:true});}
});
test('spawn: argumentos literales, código distinto de cero y error de lanzamiento',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'navo-spawn-'));try{
 const output=join(dir,'args.json'),marker=join(dir,'injected');const literal=`$(touch ${marker})`;
 const result=await run(process.execPath,['-e','require("fs").writeFileSync(process.argv[1], JSON.stringify(process.argv.slice(2)));process.exit(7)',output,literal,';','a b']);
 assert.equal(result.code,7);assert.deepEqual(JSON.parse(await readFile(output,'utf8')),[literal,';','a b']);await assert.rejects(readFile(marker));await assert.rejects(run(join(dir,'missing'),[]));
 }finally{await rm(dir,{recursive:true,force:true});}
});
