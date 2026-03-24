// -- State ---------------------------------------------
var S = {
  page:'agents', key:'', agent:AGENTS[0], model:MODELS[0], tab:'terminal',
  logs:[], out:'', typing:'', running:false, customPrompt:'',
  memory:[], stats:{calls:0,cost:0,funded:0,txs:0},
  wallet:{eth:'0.0000',usdc:'0.00',bnkr:'0.00',fees:'0.0000',llm:'0.00',calls:'0',address:'',mode:'demo'},
  walletLoading:false, txHistory:[], runHistory:[], cronLog:[], cronRunning:false, lastCronRun:null,
  launch:{name:'',symbol:'',desc:'',feeType:'wallet',feeVal:'',simOnly:false},
  launchResult:null, launching:false,
  selectedAgents:[], maRunning:false, maResults:[], mmMode:'agents', selectedModels:[], mmPrompt:'',
  runHistory:[], cronLog:[], cronRunning:false, lastCronRun:null,
  webhook:{url:'',enabled:false},
  customAgents:[],
  polymarkets:[],
  priceHistory:{ETH:[],BTC:[],ts:[]},
  positions:[],
  equityCurve:[],
  pnlStats:{totalPnl:0,totalInferenceCost:0,wins:0,losses:0,trades:0,rollingPnl:[]},
  paperMode:false,
  alerts:[],
  alertsEnabled:false,
  rollingMetrics:{sharpe:0,winRate:0,avgDuration:0,totalTrades:0,streak:0},
  backtestResult:null,
  backtestRunning:false,
  strategies:[],
  activeStrategyId:'nunchi-exp102',
  experiments:[],
  autoResearchRunning:false,
  tunerParams:{rsiPeriod:8,atrMult:5.5,minVotes:4,posPct:8,cooldown:2},
  compareIds:[]
};

var LC = {sys:'#c8d8e8',req:'#60a5fa',dim:'#1e3050',ok:'#00ff88',err:'#ff4444',warn:'#f59e0b',eco:'#f97316',tx:'#a78bfa'};
function fmtT(d){return d.toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function r16(n){var s='';for(var i=0;i<n;i++)s+='0123456789abcdef'[Math.floor(Math.random()*16)];return s;}
function findAgent(id){return AGENTS.find(function(a){return a.id===id;});}
function findModel(id){return MODELS.find(function(m){return m.id===id;});}

// -- Log -----------------------------------------------
function addLog(msg,type){
  type=type||'sys';
  S.logs.push({msg:msg,c:LC[type]||'#c8d8e8',t:fmtT(new Date())});
  var p=document.getElementById('logPane');
  if(p){
    var d=document.createElement('div');d.className='ll';
    var t=document.createElement('span');t.className='lt';t.textContent=S.logs[S.logs.length-1].t+' ';
    var m=document.createElement('span');m.style.color=S.logs[S.logs.length-1].c;m.textContent=msg;
    d.appendChild(t);d.appendChild(m);p.appendChild(d);p.scrollTop=p.scrollHeight;
  }
}

// -- Typewriter ----------------------------------------
var typerIv=null;
function startTyping(text){
  S.out=text;S.typing='';clearInterval(typerIv);var i=0;
  typerIv=setInterval(function(){
    i+=4;S.typing=text.slice(0,i);
    var el=document.getElementById('outText');
    if(el){
      // Use markdown rendering for final output, plain text while typing for speed
      if(i>=text.length){
        el.innerHTML=renderMd(text);
        var cur=document.getElementById('typeCursor');if(cur)cur.remove();
      } else {
        el.textContent=S.typing;
        var cur=document.getElementById('typeCursor');
        if(!cur){cur=document.createElement('span');cur.id='typeCursor';cur.className='cb';cur.textContent='\u2588';el.parentNode.appendChild(cur);}
      }
      el.parentNode.scrollTop=el.parentNode.scrollHeight;
    }
    if(i>=text.length)clearInterval(typerIv);
  },8);
}
