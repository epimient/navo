(function(){
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── réplica de la TUI ── */
  var apps = [
    {n:'ffmpeg', k:'CLI', c:'Multimedia',  p:'/usr/bin/ffmpeg'},
    {n:'yoinks', k:'TUI', c:'Descargar',   p:'/home/eddy/.nvm/versions/node/v24.20.0/bin/yoinks'},
    {n:'pdfunite',k:'CLI',c:'Documentos',  p:'/usr/bin/pdfunite'},
    {n:'ranger', k:'TUI', c:'Archivos',    p:'/usr/bin/ranger'},
    {n:'git',    k:'CLI', c:'Desarrollo',  p:'/usr/bin/git'},
    {n:'ffprobe',k:'CLI', c:'Multimedia',  p:'/usr/bin/ffprobe'}
  ];
  apps[0].fav = true;

  var list = document.getElementById('tuiList');

  function pad(n,w){ n = String(n); while(n.length < w) n += ' '; return n; }
  function row(a){
    var div = document.createElement('div');
    div.className = 'app';
    div.setAttribute('aria-hidden','true');
    var star = a.fav ? '★' : '·';
    div.textContent = '> ' + star + ' ' + pad(a.n,24) + ' ' + pad(a.k,5) + ' ' + a.c;
    return div;
  }

  var els = apps.map(row);
  els.forEach(function(el){ list.appendChild(el); });

  function show(i){
    els.forEach(function(el, j){ el.classList.toggle('sel', j === i); });
    var path = document.getElementById('tuiPath');
    path.textContent = apps[i].p + ' — ' + apps[i].c.toUpperCase() +
      (apps[i].fav ? ' ★' : '');
    path.style.color = (i === 0) ? 'var(--bright)' : 'var(--muted)';
  }

  if (reduce.matches) { show(0); }
  else {
    var i = 0;
    show(0);
    var t = setInterval(function(){
      i = (i + 1) % apps.length;
      show(i);
    }, 1900);
    if (document.addEventListener) {
      document.addEventListener('visibilitychange', function(){
        if (document.hidden) clearInterval(t); else {
          t = setInterval(function(){ i = (i + 1) % apps.length; show(i); }, 1900);
        }
      });
    }
  }

  /* ── copiar instalación ── */
  function copyCmd(btn, text){
    function done(ok){
      var was = btn.textContent;
      btn.textContent = ok ? 'copiado ✓' : 'error';
      setTimeout(function(){ btn.textContent = was; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ fallback(); });
    } else fallback();
    function fallback(){
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { done(document.execCommand('copy')); } catch(e){ done(false); }
      document.body.removeChild(ta);
    }
  }

  var install = 'git clone https://github.com/epimient/navo.git navo\n' +
                'cd navo && ./install.sh\nnavo';

  var copyCmdBtn = document.getElementById('copyCmd');
  var copyInstallBtn = document.getElementById('copyInstall');
  if (copyCmdBtn) copyCmdBtn.addEventListener('click', function(){ copyCmd(copyCmdBtn, install); });
  if (copyInstallBtn) copyInstallBtn.addEventListener('click', function(){ copyCmd(copyInstallBtn, install); });
})();