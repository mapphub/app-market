(async function(){
  try{ MiniApps.shell&&MiniApps.shell('setChrome',{topBar:false,bottomBar:false}); }catch(e){}
  const el=document.getElementById('list');
  const url='https://mapphub.github.io/market/catalog.json';
  try{
    const r=await fetch(url,{cache:'no-store'});
    const j=await r.json();
    el.innerHTML=(j.apps||[]).map(a=>'<article class="card"><b>'+a.name+'</b><div class="muted">'+a.version+' · '+(a.description||'')+'</div><button data-id="'+a.id+'" data-url="'+(a.packageUrl||'')+'">Установить</button></article>').join('')||'Пусто';
    el.onclick=async(e)=>{
      const b=e.target.closest('button[data-url]');
      if(!b)return;
      alert('Установка: '+b.dataset.id+'\n'+b.dataset.url);
    };
  }catch(e){ el.textContent=String(e.message||e); }
})();
