
let heat=0, dead=0, T_WARM=4, T_HOT=7, T_COLD=12;
let logs=[];
const ids=['cb_scatter','cb_multiplier','cb_connect','cb_free','cb_back2back','cb_big_tumble','cb_dead','cb_loss_buy'];

function now(){const d=new Date();return d.toLocaleTimeString();}
function g(id){return document.getElementById(id);}

function load(){
  try{
    const raw=localStorage.getItem('HeatCoachPro_state');
    if(!raw) return;
    const s=JSON.parse(raw);
    heat=s.heat||0; dead=s.dead||0; logs=s.logs||[];
    T_WARM=s.twarm||4; T_HOT=s.thot||7; T_COLD=s.tcold||12;
    g('twarm').value=T_WARM; g('thot').value=T_HOT; g('tcold').value=T_COLD;
    (s.checks||[]).forEach((v,i)=>{ if(ids[i]) g(ids[i]).checked=!!v; });
  }catch(e){}
}

function save(){
  const checks = ids.map(id=>g(id).checked);
  localStorage.setItem('HeatCoachPro_state', JSON.stringify({heat,dead,twarm:T_WARM,thot:T_HOT,tcold:T_COLD,logs,checks}));
}

function setStatus(txt, cls){
  const st=g('status'); st.textContent=txt; st.className='pill '+cls;
  const mini=document.getElementById('mini'); mini.className='mini '+cls;
  g('miniText').textContent=txt;
  const dot=g('dot');
  if (cls==='s-hot') dot.style.background='#ef4444';
  else if (cls==='s-warm') dot.style.background='#f59e0b';
  else if (cls==='s-cold') dot.style.background='#3b82f6';
  else dot.style.background='#10b981';
  if (navigator.vibrate){
    if (cls==='s-hot') navigator.vibrate([220,60,60]);
    else if (cls==='s-warm') navigator.vibrate(120);
    else if (cls==='s-cold') navigator.vibrate([180,50,50]);
  }
}

function influenceScore(){
  let score = heat;
  if (g('cb_scatter').checked) score += 2;
  if (g('cb_multiplier').checked) score += 1;
  if (g('cb_connect').checked) score += 1;
  if (g('cb_free').checked) score += 3;
  if (g('cb_back2back').checked) score += 1;
  if (g('cb_big_tumble').checked) score += 2;
  if (g('cb_loss_buy').checked) score -= 2;
  if (g('cb_dead').checked) score -= 2;
  return score;
}

function refresh(){
  g('heat').textContent=heat; g('dead').textContent=dead;
  let score=influenceScore();
  let cls='s-ok', txt='OK';
  if (dead>=T_COLD){ cls='s-cold'; txt='COLD'; }
  else if (score>=T_HOT){ cls='s-hot'; txt='HOT'; }
  else if (score>=T_WARM){ cls='s-warm'; txt='WARM'; }
  setStatus(txt, cls);
  renderLog();
  save();
}

function pushLog(type,delta){
  logs.push({t:now(), type, delta, heat, dead});
  if (logs.length>200) logs.shift();
}

function renderLog(){
  const el=g('log'); el.innerHTML='';
  logs.slice().reverse().forEach(v=>{
    const row=document.createElement('div'); row.className='logrow';
    const label=(v.type==='dead'?'Dead +'+v.delta:(v.type==='scatter'?'+2 Scatter':'+1 Connect'));
    row.innerHTML=`<span>${v.t} — ${label}</span><span class="${v.type==='dead'?'bad':'good'}">H:${v.heat} D:${v.dead}</span>`;
    el.appendChild(row);
  });
}

function mark(type,delta){
  if(type==='dead'){ dead+=delta; heat=Math.max(0, heat-1); }
  else{ heat=Math.max(0, heat+delta); dead=Math.max(0, dead-1); }
  pushLog(type,delta); refresh();
}

function resetRun(){ heat=0; dead=0; pushLog('reset',0); refresh(); }
function toggleMini(){
  const b=g('bubble'); const m=g('mini');
  if(b.style.display!=='none'){ b.style.display='none'; m.style.display='flex'; }
  else{ b.style.display='block'; m.style.display='none'; }
}
function toggleConfig(){ g('config').classList.toggle('hidden'); }
function saveCfg(){
  T_WARM=parseInt(g('twarm').value||'4',10);
  T_HOT =parseInt(g('thot').value ||'7',10);
  T_COLD=parseInt(g('tcold').value||'12',10);
  refresh();
}

function exportCSV(){
  const header='time,type,delta,heat,dead\n';
  const rows=logs.map(v=>[v.t,v.type,v.delta,v.heat,v.dead].join(','));
  const blob=new Blob([header+rows.join('\n')],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='heat_session.csv'; a.click();
  URL.revokeObjectURL(url);
}

function wireChecklist(){
  ids.forEach(id=> g(id).addEventListener('change', refresh));
}

function autoMinimize(){
  setTimeout(()=>{
    const mql = window.matchMedia('(display-mode: standalone)');
    if (mql.matches) toggleMini();
  }, 1400);
}

function init(){
  load(); wireChecklist(); refresh(); autoMinimize();
}
document.addEventListener('DOMContentLoaded', init);
