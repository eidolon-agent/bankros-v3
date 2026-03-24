// -- Event handlers ------------------------------------
function connectKey(){var v=document.getElementById('ki');if(v&&v.value.trim()){S.key=v.value.trim();fetchWallet();saveState();renderPage();}}
function demoMode(){S.key='demo';fetchWallet();renderPage();}
function disconnect(){S.key='';saveState();renderPage();}
function copyOutput(){
  if(!S.out)return;
  navigator.clipboard.writeText(S.out).then(function(){
    var btn=document.querySelector('[onclick="copyOutput()"]');
    if(btn){btn.textContent='COPIED!';btn.style.color='var(--green)';setTimeout(function(){btn.textContent='COPY';btn.style.color='var(--text2)';},2000);}
  }).catch(function(){});
}
function resetAll(){if(confirm('Clear all saved data and settings?')){clearState();}}
function selAgent(id){S.agent=findAgent(id)||S.agent;S.logs=[];S.out='';S.typing='';saveState();renderPage();}
function selModel(id){S.model=findModel(id)||S.model;saveState();renderPage();}
function setTab(t){S.tab=t;renderPage();}
function setPage(p){
  // Handle both numeric index (from nav buttons) and string names (direct calls)
  if(typeof p==='number'){
    var pageNames=['agents','wallet','launch','calculator','multiagent','economy','status','history','signals','pnl','equity','positions','backtest','alerts','strategies','tuner','research'];
    p=pageNames[p]||'agents';
  }
  S.page=p;saveState();
  if(p==='wallet'&&!S.txHistory.length)fetchWallet();
  if(p==='signals')fetchPrices();
  renderPage();
}
function toggleMA(idx){var id=typeof idx==='number'?AGENTS[idx].id:idx;var i=S.selectedAgents.indexOf(id);if(i>=0)S.selectedAgents.splice(i,1);else S.selectedAgents.push(id);renderPage();}
function selAllMA(){S.selectedAgents=AGENTS.map(function(a){return a.id;});renderPage();}
function selAgentIdx(i){selAgent(AGENTS[i].id);}
function setMM(n){S.mmMode=n===0?'agents':'models';renderPage();}
function toggleMM(idx){var id=typeof idx==='number'?MODELS[idx].id:idx;var i=S.selectedModels.indexOf(id);if(i>=0)S.selectedModels.splice(i,1);else S.selectedModels.push(id);renderPage();}
function delMem(i){S.memory.splice(i,1);renderMemList();}

document.addEventListener('keydown',function(e){if(e.key==='Enter'&&document.getElementById('ki'))connectKey();});

loadState();
fetchWallet();

// Init
fetchPrices();
loadState();
fetchWallet();
startAlertMonitor();
renderPage();
