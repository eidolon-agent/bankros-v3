
// -- Calc ----------------------------------------------
function calcCards(vol){
  var fee=vol*0.012,cr=fee*0.57,calls=Math.floor(cr/0.004),mon=cr*30;
  function fmt(n){return n>=1000000?(n/1000000).toFixed(1)+'M':n>=1000?(n/1000).toFixed(0)+'k':n.toFixed(0);}
  var vStr=vol>=1000000?'$1M':vol>=1000?'$'+(vol/1000).toFixed(0)+'k':'$'+vol;
  return '<div class="cc"><div class="cv" style="color:var(--orange)">'+vStr+'</div><div class="cl">Daily Volume</div></div>'+
    '<div class="cc"><div class="cv" style="color:var(--blue)">$'+fee.toFixed(2)+'</div><div class="cl">Total Fees 1.2%</div></div>'+
    '<div class="cc"><div class="cv" style="color:var(--green)">$'+cr.toFixed(2)+'</div><div class="cl">Your Share 57%</div></div>'+
    '<div class="cc ch"><div class="cv">'+fmt(calls)+'</div><div class="cl">Calls / Day</div></div>'+
    '<div class="cc"><div class="cv" style="color:var(--purple)">$'+(mon>=1000?(mon/1000).toFixed(1)+'k':mon.toFixed(2))+'</div><div class="cl">Monthly Revenue</div></div>'+
    '<div class="cc"><div class="cv" style="color:var(--yellow)">'+fmt(calls*30)+'</div><div class="cl">Monthly Calls</div></div>';
}
function onSlider(el){
  var v=parseInt(el.value);
  el.style.setProperty('--pct',(v/1000000*100)+'%');
  var sv=document.getElementById('slv');if(sv)sv.textContent=v>=1000000?'$1M':v>=1000?'$'+(v/1000).toFixed(0)+'k':'$'+v;
  var co=document.getElementById('cco');if(co)co.innerHTML=calcCards(v);
}

// -- Stats ---------------------------------------------
function updateStats(){
  var pairs=[['st0',S.stats.calls],['st1','$'+S.stats.cost.toFixed(4)],['st2','$'+S.stats.funded.toFixed(4)],['st3',S.stats.txs]];
  pairs.forEach(function(p){var el=document.getElementById(p[0]);if(el)el.textContent=p[1];});
}

// -- Render helpers ------------------------------------
function renderMemList(){
  var el=document.getElementById('memList');
  if(!el)return;
  if(!S.memory.length){el.innerHTML='';return;}
  var html='';
  S.memory.slice(0,4).forEach(function(mm,i){
    var ag=AGENTS.find(function(a){return a.id===mm.agentId;});
    html+='<div class="mi">';
    html+='<span class="ma2" style="color:'+(ag?ag.c:'#888')+'">'+(mm.agentIcon||'')+'</span>';
    html+='<span class="mt2">'+esc(mm.response.slice(0,100))+'...</span>';
    html+='<button class="mdel" onclick="delMem('+i+')">&#x00D7;</button>';
    html+='</div>';
  });
  el.innerHTML=html;
}
function renderMAResults(){
  var el=document.getElementById('maResultList');if(!el)return;
  var html='';
  S.maResults.forEach(function(res){
    html+='<div class="mari"><div class="marh">';
    html+='<span style="font-size:15px">'+res.icon+'</span>';
    html+='<span style="font-size:11px;font-family:var(--display);color:'+res.c+'">'+esc(res.label)+'</span>';
    html+='<span style="margin-left:auto"><span class="badge '+(res.status==='done'?'bok':'bpen')+'">'+(res.status==='done'?'\u2713 DONE':'\u27F3 RUNNING')+'</span></span>';
    html+='</div><div class="maro">'+(res.status==='done'?renderMd(res.out):'Generating...')+'</div></div>';
  });
  el.innerHTML=html;
}



// ── Markdown Renderer ──────────────────────────────────────