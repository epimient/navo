import {spawn} from 'node:child_process';
export function run(path:string,args:string[]):Promise<{code:number|null;signal:NodeJS.Signals|null}> {
 return new Promise((resolve,reject)=>{
  const child=spawn(path,args,{shell:false,stdio:'inherit'});
  // The child shares our foreground process group and receives terminal signals.
  const ignore=()=>{}; const terminate=()=>child.kill('SIGTERM');
  process.on('SIGINT',ignore);process.on('SIGQUIT',ignore);process.on('SIGTERM',terminate);
  const cleanup=()=>{process.off('SIGINT',ignore);process.off('SIGQUIT',ignore);process.off('SIGTERM',terminate);};
  child.once('error',e=>{cleanup();reject(e);});child.once('close',(code,signal)=>{cleanup();resolve({code,signal});});
 });
}
