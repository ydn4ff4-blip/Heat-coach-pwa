
let heat=0, dead=0, T_WARM=4, T_HOT=7, T_COLD=12;
let logs=[];
const ids=['cb_scatter','cb_multiplier','cb_connect','cb_free','cb_back2back','cb_big_tumble','cb_dead','cb_loss_buy'];
const $=id=>document.getElementById(id);

function now(){return new Date().toLocaleTimeString();}

function load(){
  try{
    const s=JSON.parse(localStorage.getItem('HeatCoachPro_state')||'{}');
    heat=s.heat||0; dead=s.dead||0; logs=s.logs||[];
    T_WARM=s.twarm??4; T_HOT=s.thot??7; T_COLD=s.tcold??12;
    $('twarm').value=T_WARM; $('thot').value=T_HOT; $('tcold').value=T_COLD;
    (s.checks||[]).forEach((v,i)=>{ if(ids[i]) $(ids[i]).checked=!!v; });
  }catch{}
}
function save(){
  const checks=ids.map(id=>$(id).checked);
  localStorage.setItem('HeatCoachPro_state', JSON.stringify({heat,dead,twarm:T_WARM,thot:T_HOT,tcold:T_COLD,logs,checks}));
}

function setStatus(txt, cls){
  const st=$('status'); st.textContent=txt; st.className='pill '+cls;
  const mini=$('mini'); mini.className='mini '+cls;
  $('miniText').textContent=txt;
  const dot=$('dot');
  dot.style.background=(cls==='s-hot')?'#ef4444':(cls==='s-warm')?'#f59e0b':(cls==='s-cold')?'#3b82f6':'#10b981';
  if (navigator.vibrate){ navigator.vibrate(cls==='s-hot'?[220,60,60]:cls==='s-warm'?120:[180,50,50]); }
}

function influenceScore(){
  let score=heat;
  if ($('cb_scatter').checked) score+=2;
  if ($('cb_multiplier').checked) score+=1;
  if ($('cb_connect').checked) score+=1;
  if ($('cb_free').checked) score+=3;
  if ($('cb_back2back').checked) score+=1;
  if ($('cb_big_tumble').checked) score+=2;
  if ($('cb_loss_buy').checked) score-=2;
  if ($('cb_dead').checked) score-=2;
  return score;
}

function refresh(){
  $('heat').textContent=heat; $('dead').textContent=dead;
  const score=influenceScore();
  let cls='s-ok', txt='OK';
  if (dead>=T_COLD){ cls='s-cold'; txt='COLD'; }
  else if (score>=T_HOT){ cls='s-hot'; txt='HOT'; }
  else if (score>=T_WARM){ cls='s-warm'; txt='WARM'; }
  setStatus(txt, cls);
  renderLog(); save();
}

function pushLog(type,delta){ logs.push({t:now(),type,delta,heat,dead}); if(logs.length>200) logs.shift(); }
function renderLog(){
  const el=$('log'); el.innerHTML='';
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
function toggleMini(){ const b=$('bubble'), m=$('mini'); if(b.style.display!=='none'){b.style.display='none'; m.style.display='flex';} else {b.style.display='block'; m.style.display='none';} }
function toggleConfig(){ $('config').classList.toggle('hidden'); }
function saveCfg(){ T_WARM=+$('twarm').value||4; T_HOT=+$('thot').value||7; T_COLD=+$('tcold').value||12; refresh(); }
function exportCSV(){ const header='time,type,delta,heat,dead\n'; const rows=logs.map(v=>[v.t,v.type,v.delta,v.heat,v.dead].join(',')); const blob=new Blob([header+rows.join('\n')],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='heat_session.csv'; a.click(); URL.revokeObjectURL(url); }
function wireChecklist(){ ids.forEach(id=> $(id).addEventListener('change', refresh)); }
function autoMinimize(){ setTimeout(()=>{ const mql=window.matchMedia('(display-mode: standalone)'); if(mql.matches) toggleMini(); },1400); }
function init(){ load(); wireChecklist(); refresh(); autoMinimize(); }
document.addEventListener('DOMContentLoaded', init);
