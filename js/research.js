// DIRECTION B: AGENT STRATEGY PLATFORM
// ══════════════════════════════════════════════════════════

// Built-in strategies (Nunchi experiment milestones)
var BUILTIN_STRATEGIES = [
  {id:'nunchi-exp102',name:'Nunchi exp102',desc:'Best strategy — 103 experiments, Sharpe 21.4, 0.3% DD',
   params:{rsiPeriod:8,atrMult:5.5,minVotes:4,posPct:8,cooldown:2},
   source:'Nunchi autonomous research',sharpe:'21.4',dd:'0.3%',trades:7605,locked:true},
  {id:'nunchi-exp72',name:'Nunchi exp72',desc:'RSI-8 breakthrough — +5.0 Sharpe vs baseline',
   params:{rsiPeriod:8,atrMult:5.5,minVotes:4,posPct:8,cooldown:3},
   source:'Nunchi exp72',sharpe:'20.1',dd:'0.7%',trades:6283,locked:true},
  {id:'nunchi-baseline',name:'Simple Momentum',desc:'Original baseline before auto-research',
   params:{rsiPeriod:14,atrMult:3.5,minVotes:3,posPct:10,cooldown:1},
   source:'Nunchi baseline',sharpe:'2.7',dd:'7.6%',trades:9081,locked:true},
];

function getAllStrategies(){
  var custom=S.strategies||[];
  return BUILTIN_STRATEGIES.concat(custom);
}

function getActiveStrategy(){
  var all=getAllStrategies();
  return all.find(function(s){return s.id===S.activeStrategyId;})||BUILTIN_STRATEGIES[0];
}

// ── Strategy Registry Page ────────────────────────────────
function buildStrategiesPage(){
  var all=getAllStrategies();
  var active=getActiveStrategy();
  var experiments=S.experiments||[];

  var html='<div class="card"><div class="ctitle">Strategy Registry <span style="color:var(--text3);font-size:9px;margin-left:6px">save, compare, promote strategies</span></div>'
    +'<div style="font-size:11px;color:var(--text2);margin-bottom:14px">Each strategy is a set of parameters for the Nunchi 6-signal engine. Test in paper mode, promote to live when Sharpe improves.</div>';

  // Strategy list
  all.forEach(function(strat){
    var isActive=strat.id===S.activeStrategyId;
    var c=isActive?'var(--green)':'var(--border)';
    html+='<div style="background:var(--bg);border:1px solid '+c+';border-radius:10px;padding:14px;margin-bottom:10px'+(isActive?';box-shadow:0 0 14px -6px var(--green)':'')+'">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
      '<div style="width:8px;height:8px;border-radius:50%;background:'+(isActive?'var(--green)':'var(--text3)')+';'+(isActive?'box-shadow:0 0 8px var(--green)':'')+'"></div>'+
      '<div style="font-family:var(--display);font-size:15px;color:'+(isActive?'var(--green)':'var(--text)')+';flex:1">'+esc(strat.name)+'</div>'+
      (strat.locked?'<span style="font-size:9px;color:var(--text3);border:1px solid var(--border);padding:2px 6px;border-radius:4px">LOCKED</span>':
       '<button class="btn btn-o btn-s" onclick="deleteStrategy(\''+strat.id+'\')">&#x2717;</button>')+
      '</div>'+
      '<div style="font-size:10px;color:var(--text2);margin-bottom:10px">'+esc(strat.desc)+'</div>'+
      '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10px;font-size:10px">'+
      ['RSI Period:'+strat.params.rsiPeriod,'ATR Mult:'+strat.params.atrMult+'x',
       'Min Votes:'+strat.params.minVotes+'/6','Position:'+strat.params.posPct+'%',
       'Cooldown:'+strat.params.cooldown+'h'
      ].map(function(p){
        var parts=p.split(':');
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:6px;text-align:center">'+
          '<div style="color:var(--text3);font-size:9px">'+parts[0]+'</div>'+
          '<div style="color:var(--text);font-family:var(--display);font-size:12px">'+parts[1]+'</div></div>';
      }).join('')+
      '</div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;font-size:10px;color:var(--text3);margin-bottom:10px">'+
      (strat.sharpe?'<span style="color:var(--purple)">Sharpe '+strat.sharpe+'</span>':'')+(strat.dd?'<span style="color:var(--yellow)">DD '+strat.dd+'</span>':'')+(strat.trades?'<span>'+strat.trades.toLocaleString()+' trades</span>':'')+(strat.source?'<span style="margin-left:auto">'+esc(strat.source)+'</span>':'')+
      '</div>'+
      '<div style="display:flex;gap:8px">'+
      (isActive?'<span class="badge bok">&#x25CF; ACTIVE</span>':
        '<button class="btn btn-g btn-s" onclick="activateStrategy(\''+strat.id+'\')">&#x25B6; ACTIVATE</button>')+
      '<button class="btn btn-o btn-s" onclick="backtestStrategy(\''+strat.id+'\')">&#x29BE; BACKTEST</button>'+
      '<button class="btn btn-o btn-s" onclick="loadStrategyToTuner(\''+strat.id+'\')">&#x29B7; TUNE</button>'+
      '</div></div>';
  });

  // Comparison chart if experiments have results
  var backtested=all.filter(function(s){return s.backtestSharpe;});
  if(backtested.length>1){
    html+='<div class="card"><div class="ctitle">Strategy Comparison</div>';
    html+='<div style="display:grid;grid-template-columns:repeat('+Math.min(backtested.length,4)+',1fr);gap:8px;margin-bottom:12px">';
    backtested.forEach(function(s){
      var c=parseFloat(s.backtestSharpe)>5?'var(--green)':parseFloat(s.backtestSharpe)>1?'var(--yellow)':'#f87171';
      html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:12px;text-align:center">'+
        '<div style="font-size:9px;color:var(--text3);margin-bottom:4px">'+esc(s.name)+'</div>'+
        '<div style="font-size:22px;font-family:var(--display);color:'+c+'">'+s.backtestSharpe+'</div>'+
        '<div style="font-size:9px;color:var(--text3)">Sharpe</div>'+
        '<div style="font-size:10px;color:var(--yellow);margin-top:4px">DD: '+s.backtestDD+'%</div>'+
        '</div>';
    });
    html+='</div></div>';
  }

  // Add custom strategy shortcut
  html+='<div style="text-align:center;padding:14px">'+
    '<button class="btn btn-o" onclick="setPage(\'tuner\')">&#x2B25; Create New Strategy via Tuner</button>'+
    '</div></div>';

  // Experiment log
  if(experiments.length){
    html+='<div class="card"><div class="ctitle">Experiment Log <span style="color:var(--text3);font-size:9px;margin-left:6px">'+experiments.length+' experiments run</span></div>';
    html+='<div style="display:flex;flex-direction:column;gap:5px">';
    experiments.slice().reverse().slice(0,20).forEach(function(exp){
      var improved=exp.improved;
      var c=improved?'var(--green)':'var(--text3)';
      html+='<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;font-size:10px">'+
        '<span style="color:'+c+'">'+(improved?'&#x25B2;':'&#x25BC;')+'</span>'+
        '<span style="color:var(--text2);flex:1">'+esc(exp.name)+'</span>'+
        '<span style="color:var(--purple)">'+exp.sharpe+'</span>'+
        '<span style="color:var(--yellow)">DD '+exp.dd+'%</span>'+
        '<span style="color:var(--text3)">'+new Date(exp.ts).toLocaleDateString()+'</span>'+
        '</div>';
    });
    html+='</div></div>';
  }

  return html;
}

function activateStrategy(id){
  S.activeStrategyId=id;
  var strat=getActiveStrategy();
  if(strat&&strat.params)S.tunerParams=Object.assign({},strat.params);
  saveState();renderPage();
}

function deleteStrategy(id){
  if(!S.strategies)return;
  S.strategies=S.strategies.filter(function(s){return s.id!==id;});
  if(S.activeStrategyId===id)S.activeStrategyId='nunchi-exp102';
  saveState();renderPage();
}

async function backtestStrategy(id){
  var strat=getAllStrategies().find(function(s){return s.id===id;});
  if(!strat)return;
  var origParams=Object.assign({},S.tunerParams);
  S.tunerParams=Object.assign({},strat.params);
  S.backtestRunning=true;S.backtestResult=null;
  setPage('backtest');
  await runBacktest();
  // Save result to strategy
  if(S.backtestResult&&!S.backtestResult.error){
    strat.backtestSharpe=S.backtestResult.sharpe;
    strat.backtestDD=S.backtestResult.maxDD;
    strat.backtestReturn=S.backtestResult.totalReturn;
    saveState();
  }
  S.tunerParams=origParams;
}

function loadStrategyToTuner(id){
  var strat=getAllStrategies().find(function(s){return s.id===id;});
  if(!strat)return;
  S.tunerParams=Object.assign({},strat.params);
  saveState();
  setPage('tuner');
}

// ── Parameter Tuner Page ──────────────────────────────────
function buildTunerPage(){
  var p=S.tunerParams||{rsiPeriod:8,atrMult:5.5,minVotes:4,posPct:8,cooldown:2};
  var active=getActiveStrategy();
  var experiments=S.experiments||[];

  var html='<div class="card"><div class="ctitle">Parameter Tuner <span style="color:var(--text3);font-size:9px;margin-left:6px">Nunchi 6-signal engine</span></div>'
    +'<div style="font-size:11px;color:var(--text2);margin-bottom:14px">Adjust strategy parameters and run backtest. If Sharpe improves, save as a new strategy or promote to active.</div>'
    +'<div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:14px;margin-bottom:12px">';

  // Parameter sliders
  var sliders=[
    {id:'rsiPeriod',label:'RSI Period',min:4,max:20,step:1,val:p.rsiPeriod,note:'Nunchi discovery: 8 outperforms standard 14',unit:''},
    {id:'atrMult',label:'ATR Stop Multiplier',min:2,max:9,step:0.5,val:p.atrMult,note:'5.5x = wide, lets winners run. <3x = tight, stops out early',unit:'x'},
    {id:'minVotes',label:'Min Votes to Enter',min:2,max:6,step:1,val:p.minVotes,note:'4/6 = balanced. Lower = more trades, higher = fewer high-conviction',unit:'/6'},
    {id:'posPct',label:'Position Size',min:2,max:20,step:1,val:p.posPct,note:'8% = Nunchi optimal. Higher = more exposure per trade',unit:'%'},
    {id:'cooldown',label:'Cooldown Bars',min:0,max:6,step:1,val:p.cooldown,note:'2 bars = Nunchi optimal. Prevents overtrading after exit',unit:'h'},
  ];

  sliders.forEach(function(sl){
    var pct=(sl.val-sl.min)/(sl.max-sl.min)*100;
    // Highlight when different from Nunchi exp102
    var isDefault={'rsiPeriod':8,'atrMult':5.5,'minVotes':4,'posPct':8,'cooldown':2}[sl.id];
    var changed=sl.val!==isDefault;
    html+='<div style="margin-bottom:16px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:11px">'
      +'<span style="color:var(--text2)">'+sl.label+'</span>'
      +'<span style="color:'+(changed?'var(--yellow)':'var(--green)')+';font-family:var(--display);font-size:16px" id="tv-'+sl.id+'">'+sl.val+sl.unit+'</span>'
      +'</div>'
      +'<input type="range" class="csl" min="'+sl.min+'" max="'+sl.max+'" step="'+sl.step+'" value="'+sl.val+'" style="--pct:'+pct+'%" '
      +'oninput="updateTuner(\''+sl.id+'\',parseFloat(this.value),\''+sl.unit+'\','+sl.min+','+sl.max+')">'
      +'<div style="font-size:9px;color:var(--text3);margin-top:4px">'+sl.note+(changed?' <b style="color:var(--yellow)">&#x25B2; Modified</b>':'')+'</div>'
      +'</div>';
  });
  html+='</div>';

  // Actions
  html+='<div class="irow">'
    +'<button class="btn btn-g" onclick="runTunerBacktest()">&#x29BE; TEST THESE PARAMS</button>'
    +'<button class="btn btn-o" onclick="resetTuner()">&#x27F3; RESET TO exp102</button>'
    +'</div>';

  // Save as new strategy
  html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:12px;margin-top:12px">'
    +'<div style="font-size:10px;color:var(--text2);letter-spacing:.1em;margin-bottom:8px">SAVE AS STRATEGY</div>'
    +'<div style="display:flex;gap:8px">'
    +'<input class="inp" id="strat-name" style="flex:1" placeholder="e.g. RSI-6 Aggressive"/>'
    +'<button class="btn btn-g btn-s" onclick="saveCurrentAsStrategy()">&#x2B25; SAVE</button>'
    +'</div></div>';

  // Show comparison to exp102
  html+='<div style="margin-top:12px;display:grid;grid-template-columns:repeat(5,1fr);gap:6px;font-size:10px">';
  var defaults={rsiPeriod:8,atrMult:5.5,minVotes:4,posPct:8,cooldown:2};
  Object.keys(defaults).forEach(function(k){
    var current=p[k];var def=defaults[k];
    var changed=current!==def;
    html+='<div style="background:var(--bg);border:1px solid '+(changed?'var(--yellow)':'var(--border)')+';border-radius:7px;padding:8px;text-align:center">'
      +'<div style="color:var(--text3);font-size:9px">'+k+'</div>'
      +'<div style="color:'+(changed?'var(--yellow)':'var(--text)')+';font-family:var(--display);font-size:14px">'+current+'</div>'
      +(changed?'<div style="color:var(--text3);font-size:9px">was '+def+'</div>':'')
      +'</div>';
  });
  html+='</div>';

  // Experiment history
  if(experiments.length){
    html+='<div style="margin-top:14px"><div style="font-size:10px;color:var(--text2);letter-spacing:.1em;margin-bottom:8px">EXPERIMENT HISTORY (last 10)</div>';
    html+='<div style="display:flex;flex-direction:column;gap:4px">';
    experiments.slice().reverse().slice(0,10).forEach(function(exp,i){
      var c=exp.improved?'var(--green)':'#f87171';
      html+='<div style="display:grid;grid-template-columns:auto 1fr auto auto auto;gap:8px;align-items:center;padding:7px 10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;font-size:10px">'
        +'<span style="color:'+c+'">'+(exp.improved?'&#x25B2;':'&#x25BC;')+'</span>'
        +'<span style="color:var(--text2)">'+esc(exp.name)+'</span>'
        +'<span style="color:var(--purple)">&#x3C3; '+exp.sharpe+'</span>'
        +'<span style="color:var(--yellow)">DD '+exp.dd+'%</span>'
        +'<button class="btn btn-o btn-s" onclick="reloadExperiment('+i+')" style="font-size:9px">LOAD</button>'
        +'</div>';
    });
    html+='</div></div>';
  }
  html+='</div>';
  return html;
}

function updateTuner(key,val,unit,min,max){
  if(!S.tunerParams)S.tunerParams={rsiPeriod:8,atrMult:5.5,minVotes:4,posPct:8,cooldown:2};
  S.tunerParams[key]=val;
  var el=document.getElementById('tv-'+key);
  if(el)el.textContent=val+unit;
  var sl=document.querySelector('[oninput*="'+key+'"]');
  if(sl){
    var pct=(val-min)/(max-min)*100;
    sl.style.setProperty('--pct',pct+'%');
  }
}

function resetTuner(){
  S.tunerParams={rsiPeriod:8,atrMult:5.5,minVotes:4,posPct:8,cooldown:2};
  saveState();renderPage();
}

async function runTunerBacktest(){
  // Run backtest with current tuner params
  S.backtestRunning=true;S.backtestResult=null;
  setPage('backtest');
  await runBacktest();
  // Record as experiment
  if(S.backtestResult&&!S.backtestResult.error){
    var p=S.tunerParams;
    var prevBest=S.experiments.length?Math.max.apply(null,S.experiments.map(function(e){return parseFloat(e.sharpe)||0;})):2.7;
    var improved=parseFloat(S.backtestResult.sharpe)>prevBest;
    var exp={
      id:'exp-'+Date.now(),
      name:'RSI'+p.rsiPeriod+' ATR'+p.atrMult+' V'+p.minVotes+'/6 P'+p.posPct+'%',
      params:Object.assign({},p),
      sharpe:S.backtestResult.sharpe,
      dd:S.backtestResult.maxDD,
      return:S.backtestResult.totalReturn,
      trades:S.backtestResult.trades,
      ts:Date.now(),
      improved:improved
    };
    if(!S.experiments)S.experiments=[];
    S.experiments.push(exp);
    if(S.experiments.length>50)S.experiments.shift();
    saveState();
  }
}

function saveCurrentAsStrategy(){
  var nameEl=document.getElementById('strat-name');
  var name=nameEl&&nameEl.value.trim();
  if(!name){alert('Enter a strategy name');return;}
  var p=S.tunerParams;
  var bt=S.backtestResult;
  if(!S.strategies)S.strategies=[];
  S.strategies.push({
    id:'custom-'+Date.now(),
    name:name,
    desc:'Custom strategy — RSI'+p.rsiPeriod+', ATR'+p.atrMult+'x, '+p.minVotes+'/6 votes',
    params:Object.assign({},p),
    source:'Tuner '+new Date().toLocaleDateString(),
    sharpe:bt?bt.sharpe:null,
    dd:bt?bt.maxDD:null,
    trades:bt?bt.trades:null,
    locked:false
  });
  if(nameEl)nameEl.value='';
  saveState();
  setPage('strategies');
}

function reloadExperiment(idx){
  var exps=(S.experiments||[]).slice().reverse();
  var exp=exps[idx];
  if(!exp)return;
  S.tunerParams=Object.assign({},exp.params);
  saveState();renderPage();
}

// ── Auto-Research Page (Karpathy Pattern) ─────────────────
function buildAutoResearchPage(){
  var experiments=S.experiments||[];
  var bestExp=experiments.length?experiments.reduce(function(best,e){
    return parseFloat(e.sharpe)>parseFloat(best.sharpe)?e:best;
  },experiments[0]):null;

  var html='<div class="card"><div class="ctitle">Auto-Research Loop <span style="color:var(--text3);font-size:9px;margin-left:6px">Karpathy pattern — autonomous strategy improvement</span></div>'
    +'<div style="font-size:11px;color:var(--text2);margin-bottom:12px">Inspired by Nunchi\'s 103-experiment loop. Claude proposes parameter modifications, tests them, keeps improvements, reverts failures. Each iteration is one autonomous experiment.</div>';

  // How it works
  html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:14px;margin-bottom:14px">'
    +'<div style="font-size:10px;color:var(--text2);letter-spacing:.1em;margin-bottom:10px">HOW IT WORKS</div>'
    +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:10px">';
  ['READ current strategy + score','PROPOSE one parameter change via LLM','BACKTEST new params','KEEP if Sharpe improved','REVERT if not','REPEAT'].forEach(function(step,i){
    html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:7px;padding:7px 11px;color:var(--text2)">'+(i+1)+'. '+step+'</div>';
    if(i<5)html+='<span style="color:var(--text3)">&#x2192;</span>';
  });
  html+='</div></div>';

  // Current best
  if(bestExp){
    html+='<div style="background:color-mix(in srgb,var(--green) 5%,var(--bg));border:1px solid color-mix(in srgb,var(--green) 25%,var(--border));border-radius:9px;padding:12px;margin-bottom:12px">'
      +'<div style="font-size:9px;color:var(--text3);letter-spacing:.1em;margin-bottom:6px">CURRENT BEST (your experiments)</div>'
      +'<div style="display:flex;align-items:center;gap:12px">'
      +'<div><div style="color:var(--green);font-family:var(--display);font-size:20px">'+bestExp.sharpe+'</div><div style="font-size:9px;color:var(--text3)">Sharpe</div></div>'
      +'<div><div style="color:var(--yellow);font-family:var(--display);font-size:16px">'+bestExp.dd+'%</div><div style="font-size:9px;color:var(--text3)">Max DD</div></div>'
      +'<div style="flex:1"><div style="color:var(--text2);font-size:11px">'+esc(bestExp.name)+'</div><div style="font-size:9px;color:var(--text3)">'+new Date(bestExp.ts).toLocaleDateString()+'</div></div>'
      +'<button class="btn btn-g btn-s" onclick="reloadBestExperiment()">LOAD</button>'
      +'</div></div>';
  }

  // Start loop
  html+='<div class="irow">'
    +'<button class="btn btn-g" onclick="runAutoResearchCycle()"'+(S.autoResearchRunning?' disabled':'')+'>'
    +(S.autoResearchRunning?'<span class="spin"></span> RESEARCHING...':'&#x27F3; RUN ONE EXPERIMENT')+'</button>'
    +'<button class="btn btn-o" onclick="runAutoResearch5()"'+(S.autoResearchRunning?' disabled':'')+'>'
    +(S.autoResearchRunning?'':'&#x29BE; RUN 5 EXPERIMENTS')+'</button>'
    +'</div>';

  // Experiment table
  if(experiments.length){
    html+='<div style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
      +'<div style="font-size:10px;color:var(--text2);letter-spacing:.1em">EXPERIMENT LOG ('+experiments.length+' total)</div>'
      +'<button class="btn btn-o btn-s" onclick="S.experiments=[];saveState();renderPage()">CLEAR</button>'
      +'</div>'
      +'<div style="display:flex;flex-direction:column;gap:4px">';
    experiments.slice().reverse().forEach(function(exp){
      var c=exp.improved?'var(--green)':'var(--text3)';
      html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;font-size:10px">'
        +'<span style="color:'+c+';font-size:12px">'+(exp.improved?'&#x25B2;':'&#x25BC;')+'</span>'
        +'<span style="color:var(--text2);flex:1">'+esc(exp.name)+'</span>'
        +'<span style="color:var(--purple)">&#x3C3; '+exp.sharpe+'</span>'
        +'<span style="color:var(--yellow)">DD '+exp.dd+'%</span>'
        +'<span style="color:var(--blue)">'+exp.return+'%</span>'
        +'<span style="color:var(--text3)">'+exp.trades+' trades</span>'
        +'</div>';
    });
    html+='</div></div>';

    // Sharpe progression chart
    if(experiments.length>2){
      var sharpes=experiments.map(function(e){return parseFloat(e.sharpe)||0;});
      var maxS=Math.max.apply(null,sharpes)||1;
      var W=500,H=60,pad=8;
      var pts=sharpes.map(function(v,i){
        return{x:pad+(i/(sharpes.length-1||1))*(W-pad*2),y:pad+(1-v/maxS)*(H-pad*2)};
      });
      var pd='M'+pts.map(function(p){return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' L');
      html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:12px;margin-top:10px">'
        +'<div style="font-size:9px;color:var(--text3);letter-spacing:.15em;margin-bottom:6px">SHARPE PROGRESSION ACROSS EXPERIMENTS</div>'
        +'<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:50px" preserveAspectRatio="none">'
        +'<defs><linearGradient id="arGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a78bfa" stop-opacity="0.3"/><stop offset="100%" stop-color="#a78bfa" stop-opacity="0.02"/></linearGradient></defs>'
        +'<path d="'+pd+' L'+(W-pad)+','+(H-pad)+' L'+pad+','+(H-pad)+' Z" fill="url(#arGrad)"/>'
        +'<path d="'+pd+'" fill="none" stroke="#a78bfa" stroke-width="2"/>'
        +'</svg>'
        +'<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text3);margin-top:4px">'
        +'<span>Exp 1: '+sharpes[0].toFixed(1)+'</span>'
        +'<span style="color:var(--purple)">Best: '+Math.max.apply(null,sharpes).toFixed(1)+'</span>'
        +'<span>Latest: '+sharpes[sharpes.length-1].toFixed(1)+'</span>'
        +'</div></div>';
    }
  }else{
    html+='<div class="em" style="margin-top:12px">No experiments yet. Run your first experiment above.</div>';
  }
  html+='</div>';
  return html;
}

async function runAutoResearchCycle(){
  if(S.autoResearchRunning)return;
  S.autoResearchRunning=true;renderPage();

  try{
    var currentParams=Object.assign({},S.tunerParams);
    var experiments=S.experiments||[];
    var currentSharpe=experiments.length?
      parseFloat(experiments[experiments.length-1].sharpe)||2.7:2.7;

    // Ask Claude to propose a parameter change
    var expContext='Current best Sharpe: '+currentSharpe+'\n'+
      'Current params: RSI period '+currentParams.rsiPeriod+
      ', ATR mult '+currentParams.atrMult+
      ', min votes '+currentParams.minVotes+'/6'+
      ', position '+currentParams.posPct+'%'+
      ', cooldown '+currentParams.cooldown+' bars\n\n';

    if(experiments.length){
      expContext+='Recent experiments:\n'+
        experiments.slice(-5).map(function(e){
          return (e.improved?'KEPT':'REVERTED')+' — '+e.name+' → Sharpe '+e.sharpe;
        }).join('\n');
    }

    var proposal='';
    if(S.key&&S.key!=='demo'){
      try{
        var r=await fetch('/api/chat',{method:'POST',
          headers:{'Content-Type':'application/json','X-API-Key':S.key},
          body:JSON.stringify({
            model:'claude-sonnet-4.6',max_tokens:300,
            messages:[{
              role:'system',
              content:'You are an autonomous trading strategy optimizer. The Nunchi 6-signal strategy uses: RSI period (4-20), ATR multiplier (2-9), min votes (2-6), position size (2-20%), cooldown bars (0-6). Key insight: RSI period 8 was the biggest single improvement. Removing complexity consistently helped.'
            },{
              role:'user',
              content:expContext+'Propose ONE specific parameter change that might improve Sharpe. Return ONLY valid JSON: {"param":"rsiPeriod","value":8,"reasoning":"one sentence"}'
            }]
          })
        });
        if(r.ok){
          var d=await r.json();
          var txt=d.choices&&d.choices[0]?d.choices[0].message.content:'';
          var m=txt.match(/\{[^}]+\}/);
          if(m){var prop=JSON.parse(m[0]);proposal=prop;}
        }
      }catch(e){}
    }

    // Fallback: random perturbation if no LLM
    if(!proposal){
      var paramNames=['rsiPeriod','atrMult','minVotes','cooldown'];
      var paramRanges={rsiPeriod:[4,16,1],atrMult:[2,8,0.5],minVotes:[2,6,1],cooldown:[0,5,1]};
      var pick=paramNames[Math.floor(Math.random()*paramNames.length)];
      var range=paramRanges[pick];
      var delta=(Math.random()<0.5?-1:1)*range[2];
      var newVal=Math.min(range[1],Math.max(range[0],currentParams[pick]+delta));
      proposal={param:pick,value:newVal,reasoning:'Random perturbation'};
    }

    // Apply proposed change
    var newParams=Object.assign({},currentParams);
    if(proposal.param&&proposal.value!==undefined){
      newParams[proposal.param]=proposal.value;
    }

    // Run backtest with new params
    S.tunerParams=newParams;
    await runBacktest();

    var newSharpe=S.backtestResult&&!S.backtestResult.error?
      parseFloat(S.backtestResult.sharpe)||0:0;
    var improved=newSharpe>currentSharpe;

    var expName=proposal.param?
      proposal.param+'='+proposal.value+' ('+proposal.reasoning+')':
      'Random experiment';

    // Record experiment
    if(!S.experiments)S.experiments=[];
    S.experiments.push({
      id:'exp-'+Date.now(),
      name:expName,
      params:Object.assign({},newParams),
      sharpe:S.backtestResult?S.backtestResult.sharpe:'0',
      dd:S.backtestResult?S.backtestResult.maxDD:'0',
      return:S.backtestResult?S.backtestResult.totalReturn:'0',
      trades:S.backtestResult?S.backtestResult.trades:0,
      ts:Date.now(),
      improved:improved,
      proposal:proposal
    });
    if(S.experiments.length>50)S.experiments.shift();

    // Keep or revert
    if(improved){
      // Keep new params
      saveState();
    }else{
      // Revert
      S.tunerParams=currentParams;
      saveState();
    }

  }catch(e){
    S.autoResearchRunning=false;
  }

  S.autoResearchRunning=false;
  saveState();
  setPage('research');
}

async function runAutoResearch5(){
  for(var i=0;i<5;i++){
    await runAutoResearchCycle();
    await new Promise(function(r){setTimeout(r,500);});
  }
}

function reloadBestExperiment(){
  var experiments=S.experiments||[];
  if(!experiments.length)return;
  var best=experiments.reduce(function(b,e){
    return parseFloat(e.sharpe)>parseFloat(b.sharpe)?e:b;
  },experiments[0]);
  S.tunerParams=Object.assign({},best.params);
  saveState();
  setPage('tuner');
}


