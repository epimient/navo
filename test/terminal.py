import os,pty,termios,fcntl,struct,select,time,signal,tempfile,json,shutil,sys
mode=sys.argv[1] if len(sys.argv)>1 else 'tui'
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp=tempfile.mkdtemp(prefix='navo-pty-')
app=os.path.join(tmp,'probe')
with open(app,'w') as f:f.write('#!/usr/bin/env python3\nimport os,termios,sys\nprint("CHILD_TTY",os.isatty(0),flush=True)\ntermios.tcgetattr(0)\ninput("CHILD_READY\\n")\nprint("CHILD_DONE",flush=True)\n')
os.chmod(app,0o755)
os.makedirs(os.path.join(tmp,'navo'))
with open(os.path.join(tmp,'navo','config.json'),'w') as f:json.dump({'version':1,'manual':[{'id':'manual:'+app,'name':'probe','path':app,'kind':'CLI' if mode=='cli' else 'TUI','category':'Manual','description':'Prueba','available':True,'manual':True}],'hidden':[],'favorites':['manual:'+app]},f)
pid,fd=pty.fork()
if pid==0:
 os.environ['XDG_CONFIG_HOME']=tmp
 os.environ['TERM']='xterm-256color'
 os.execvp('node',['node',root+'/dist/cli.js'])
fcntl.ioctl(fd,termios.TIOCSWINSZ,struct.pack('HHHH',30,100,0,0))
before=termios.tcgetattr(fd)
data=b''
transcript=b''
def waitfor(s,timeout=10):
 global data,transcript
 end=time.time()+timeout
 while s.encode() not in data:
  if time.time()>end:raise Exception('Timeout: '+s+' '+repr(data[-2000:]))
  if select.select([fd],[],[],.1)[0]:
   try:chunk=os.read(fd,65536)
   except OSError:raise Exception(repr(transcript[-6000:]))
   data+=chunk;transcript+=chunk
 data=b''
 time.sleep(.3)
try:
 waitfor('probe')
 if mode=='quit':os.write(fd,b'\x03')
 else:
  os.write(fd,b'\r');waitfor('Argumentos');os.write(fd,b'\r');waitfor('CHILD_READY')
  os.write(fd,b'\x03' if mode=='interrupt' else b'\n')
  if mode in ('cli','interrupt','tui'):waitfor('Enter para volver');os.write(fd,b'\n')
  waitfor('tus aplicaciones');os.write(fd,b'q')
 _,status=os.waitpid(pid,0)
 after=termios.tcgetattr(fd)
 assert os.waitstatus_to_exitcode(status)==0, status
 assert before==after,(before,after)
 print('PASS:',mode,'— terminal restaurado y proceso cerrado correctamente.')
finally:
 try:os.kill(pid,signal.SIGKILL)
 except ProcessLookupError:pass
 os.close(fd);shutil.rmtree(tmp)
