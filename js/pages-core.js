
function buildAgentsPage(a,m){
  var html='<div class="g2">';
  html+='<div class="card"><div class="ctitle">Agent Type</div><div class="ag">';
  AGENTS.forEach(function(ag){
    html+='<button class="ab'+(ag.id===a.id?' act':'')+'" style="--ac:'+ag.c+'" onclick="selAgent(\''+ag.id+'\')">'
      +'<span class="ai">'+ag.icon+'</span><span class="an">'+ag.label+'</span></button>';
  });
  html+='</div><div class="adesc">'+esc(a.desc)+'</div></div>';
  html+='<div class="card"><div class="ctitle">Model Routing</div><div class="ml">';
  MODELS.forEach(function(mo){
    html+='<button class="mb'+(mo.id===m.id?' act':'')+'" style="--mc:'+mo.c+'" onclick="selModel(\''+mo.id+'\')">'
      +'<div class="mdot" style="background:'+mo.c+'"></div><span class="mn">'+mo.label+'</span><span class="mt">'+mo.prov+'</span></button>';
  });
  html+='</div></div></div>';
  // Stats
  html+='<div class="sr">';
  [{l:'Inference Calls',v:S.stats.calls,c:'#60a5fa',id:'st0'},{l:'Total Cost',v:'$'+S.stats.cost.toFixed(4),c:'#f97316',id:'st1'},{l:'Fees Funded',v:'$'+S.stats.funded.toFixed(4),c:'#00ff88',id:'st2'},{l:'Onchain Txs',v:S.stats.txs,c:'#a78bfa',id:'st3'}].forEach(function(s){
    html+='<div class="sc" style="--s:'+s.c+'"><div class="sl">'+s.l+'</div><div class="sv" style="color:'+s.c+'" id="'+s.id+'">'+s.v+'</div></div>';
  });
  html+='</div>';
  html+=buildRollingMetricsBar();
  // Custom prompt + memory
  html+='<div class="card"><div class="ctitle">Custom Prompt <span style="color:var(--text3);font-size:9px;margin-left:6px">optional &mdash; overrides the default agent prompt</span></div>'
    +'<textarea class="pi" placeholder="Type your own prompt, or leave blank to use the default agent prompt..." oninput="S.customPrompt=this.value">'+esc(S.customPrompt)+'</textarea>';
  if(S.memory.length){
    html+='<div class="ctitle" style="margin-top:10px">Memory ('+S.memory.length+')'
      +' <button class="btn btn-o btn-s" style="margin-left:auto" onclick="S.memory=[];saveState();renderPage()">CLEAR</button></div>'
      +'<div class="mlist" id="memList"></div>';
  }
  html+='</div>';
  // Terminal
  html+='<div class="tp"><div class="tbar">'
    +'<button class="tbtn'+(S.tab==='terminal'?' act':'')+'" onclick="setTab(\'terminal\')">TERMINAL</button>'
    +'<button class="tbtn'+(S.tab==='models'?' act':'')+'" onclick="setTab(\'models\')">MODELS</button>'
    +'<div class="tsp"></div>'
    +'<button class="btn btn-o btn-s" id="copyBtn" onclick="copyOutput()" style="margin-right:4px;font-size:10px">&#x2398; COPY</button>'+'<button class="btn btn-o btn-s" id="dlBtn" onclick="downloadOutput()" style="margin-right:6px;font-size:10px">⭳ SAVE</button>'
    +'<button class="rb" id="runBtn" onclick="runAgent()"'+(S.running?' disabled':'')+'>'+( S.running?'<span class="spin"></span> RUNNING':'\u25B6 EXECUTE')+'</button>'
    +'</div>';
  if(S.tab==='terminal'){
    html+='<div class="tb2">'
      +'<div class="lp" id="logPane"><div class="ph">Execution Log</div>'+(S.logs.length===0?'<div class="em">Awaiting execution</div>':'')+'</div>'
      +'<div class="op" id="outPane"><div class="ph">Agent Output</div>'+(S.out?'<div class="ot" id="outText"></div>':'<div class="em">'+(S.running?'Generating...':'Run an agent to see output')+'</div>')+'</div>'
      +'</div>';
  } else {
    html+='<div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px">';
    MODELS.forEach(function(mo){
      html+='<div onclick="selModel(\''+mo.id+'\')" style="background:var(--bg);border:1px solid color-mix(in srgb,'+mo.c+' 22%,var(--border));border-radius:9px;padding:12px;cursor:pointer;transition:all .2s" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'\'">'
        +'<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px"><div style="width:7px;height:7px;border-radius:50%;background:'+mo.c+';box-shadow:0 0 8px '+mo.c+'"></div>'
        +'<span style="font-size:9px;color:var(--text3);background:var(--bg2);padding:2px 6px;border-radius:3px;border:1px solid var(--border);text-transform:uppercase">'+mo.prov+'</span></div>'
        +'<div style="font-size:11px;color:'+mo.c+';margin-bottom:3px">'+mo.label+'</div>'
        +'<div style="font-size:10px;color:var(--text3)">'+mo.id+'</div></div>';
    });
    html+='</div>';
  }
  html+='</div>';
  return html;
}

function buildWalletPage(){
  var w=S.wallet;
  var html='<div class="card">'
    +'<div class="ctitle">Wallet Dashboard</div>'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'
    +'<span class="badge '+(w.mode==='live'?'bok':w.mode==='error'?'a-e':'bpen')+'">'+(w.mode==='live'?'&#x25CF; LIVE':w.mode==='error'?'&#x2717; ERROR':'&#x25CB; DEMO')+'</span>'
    +(w.address?'<span style="font-size:10px;color:var(--text3)">'+w.address.slice(0,6)+'...'+w.address.slice(-4)+'</span>':'')
    +'<button class="btn btn-o btn-s" onclick="fetchWallet()" style="margin-left:auto">'+(S.walletLoading?'<span class="spin"></span>':'\u27F3 REFRESH')+'</button></div>';
  if(S.key==='demo')html+='<div class="alert a-w">Demo mode &mdash; showing simulated balances</div>';
  html+='<div class="wg">';
  [{l:'ETH',v:w.eth,c:'#60a5fa',s:'Base Chain'},{l:'USDC',v:'$'+w.usdc,c:'#00ff88',s:'Base Chain'},{l:'BNKR',v:w.bnkr,c:'#a78bfa',s:'Governance'},{l:'LLM Credits',v:'$'+(w.llm||S.stats.funded.toFixed(2)),c:'#f59e0b',s:'Bankr Gateway'},{l:'Unclaimed Fees',v:w.fees+' ETH',c:'#f97316',s:'Token launches'},{l:'Inference Calls',v:S.stats.calls,c:'#06b6d4',s:'This session'}].forEach(function(wc){
    html+='<div class="wc"><div class="wl">'+wc.l+'</div><div class="wv" style="color:'+wc.c+'">'+wc.v+'</div><div class="ws">'+wc.s+'</div></div>';
  });
  html+='</div>';
  html+='<div class="irow">'
    +'<button class="btn btn-g" onclick="alert(\'POST api.bankr.bot/agent/prompt\\n{\\\"prompt\\\":\\\"claim my token fees\\\"}\')">&#x25C8; CLAIM FEES</button>'
    +'<button class="btn btn-o" onclick="setPage(2)">&#x25CE; LAUNCH TOKEN</button>'
    +'<button class="btn btn-o" onclick="window.open(\'https://bankr.bot/llm?tab=credits\',\'_blank\')">&#x29A1; TOP UP</button>'
    +'</div></div>';
  html+='<div class="card"><div class="ctitle">Transaction History</div>';
  if(!S.txHistory.length){html+='<div class="em">No transactions yet</div>';}
  else{
    html+='<div class="txl">';
    S.txHistory.forEach(function(tx){
      html+='<div class="txi"><span class="txic">'+tx.icon+'</span><div class="txi2"><div class="txd">'+esc(tx.desc)+'</div>'
        +'<div class="txtt">'+tx.time.toLocaleTimeString()+' &middot; <a class="txh" href="https://basescan.org/tx/'+tx.hash+'" target="_blank">'+tx.hash.slice(0,14)+'...</a></div></div>'
        +'<span class="txa" style="color:'+(tx.amount[0]==='+' ?'var(--green)':'var(--text2)')+'">'+esc(tx.amount)+'</span>'
        +'<span class="badge '+(tx.status==='ok'?'bok':'bpen')+'">'+tx.status+'</span></div>';
    });
    html+='</div>';
  }
  html+='</div>';
  return html;
}

function buildLaunchPage(){
  var l=S.launch, r=S.launchResult;
  var sym=l.symbol||l.name.slice(0,4).toUpperCase()||'????';
  var html='<div class="card"><div class="ctitle">Launch Token on Base <span style="color:var(--text3);font-size:9px;margin-left:6px">POST api.bankr.bot/token-launches/deploy</span></div>';
  if(!S.key||S.key==='demo')html+='<div class="alert a-w">Demo mode &mdash; launch will be simulated</div>';
  html+='<div class="lf">'
    +'<div class="fld"><label>Token Name *</label><input class="inp" style="width:100%" placeholder="e.g. INFERENCE" value="'+esc(l.name)+'" oninput="S.launch.name=this.value"/></div>'
    +'<div class="fld"><label>Symbol (auto: '+esc(sym)+')</label><input class="inp" style="width:100%" placeholder="'+esc(sym)+'" value="'+esc(l.symbol)+'" oninput="S.launch.symbol=this.value"/></div>'
    +'<div class="fld" style="grid-column:1/-1"><label>Description</label><input class="inp" style="width:100%" placeholder="Short description (max 500 chars)" value="'+esc(l.desc)+'" oninput="S.launch.desc=this.value"/></div>'
    +'<div class="fld"><label>Fee Recipient Type</label><select class="sel" onchange="S.launch.feeType=this.value">'
    +['wallet','x','ens','farcaster'].map(function(t){return '<option value="'+t+'"'+(l.feeType===t?' selected':'')+'>'+t+'</option>';}).join('')
    +'</select></div>'
    +'<div class="fld"><label>Fee Recipient Value</label><input class="inp" style="width:100%" placeholder="'+ ({wallet:'0x...',x:'@handle',ens:'name.eth',farcaster:'handle'}[l.feeType])+'" value="'+esc(l.feeVal)+'" oninput="S.launch.feeVal=this.value"/></div>'
    +'</div>'
    +'<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:10px">'
    +'<div style="font-size:10px;color:var(--text2);margin-bottom:6px;letter-spacing:.1em">1.2% SWAP FEE DISTRIBUTION</div>'
    +'<div class="fbar"><div class="fseg" style="width:57%;background:#00ff88"></div><div class="fseg" style="width:36.1%;background:#f97316"></div><div class="fseg" style="width:1.9%;background:#a78bfa"></div><div class="fseg" style="width:5%;background:#60a5fa"></div></div>'
    +'<div class="fleg"><div class="fli"><div class="fld2" style="background:#00ff88"></div>Creator 57%</div><div class="fli"><div class="fld2" style="background:#f97316"></div>Bankr 36.1%</div><div class="fli"><div class="fld2" style="background:#a78bfa"></div>Ecosystem 1.9%</div><div class="fli"><div class="fld2" style="background:#60a5fa"></div>Doppler 5%</div></div>'
    +'</div>'
    +'<div class="irow" style="margin-top:12px;align-items:center">'
    +'<button class="btn btn-g" onclick="launchToken()"'+(S.launching||!l.name?' disabled':'')+'>'+(S.launching?'<span class="spin"></span> LAUNCHING...':'&#x25CE; LAUNCH TOKEN')+'</button>'
    +'<label style="display:flex;align-items:center;gap:7px;font-size:11px;color:var(--text2);cursor:pointer"><input type="checkbox"'+(l.simOnly?' checked':'')+' onchange="S.launch.simOnly=this.checked"> Simulate only</label>'
    +'</div></div>';
  if(r){
    html+='<div class="card"><div class="alert '+(r.success?'a-ok':'a-e')+'">'+(r.success?(r.simulated?'&#x2713; Simulated &mdash; no real token created':'&#x2713; Token deployed on Base!'):'&#x2717; Failed: '+esc(r.error||'Unknown'))+'</div>';
    if(r.success&&r.tokenAddress){
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;font-size:11px">'
        +'<div class="wc"><div class="wl">Token Address</div><div style="font-size:9px;color:var(--green);word-break:break-all">'+esc(r.tokenAddress)+'</div></div>'
        +'<div class="wc"><div class="wl">Pool ID</div><div style="font-size:9px;color:var(--blue);word-break:break-all">'+(r.poolId||'N/A')+'</div></div></div>';
      if(r.txHash)html+='<div style="margin-top:8px;font-size:10px;color:var(--text3)">Tx: <a class="txh" href="https://basescan.org/tx/'+r.txHash+'" target="_blank">'+r.txHash.slice(0,22)+'...</a></div>';
    }
    html+='</div>';
  }
  return html;
}

function buildCalcPage(){
  var defaultVol=500000;
  // Build sparkline points for the chart
  var vols=[1000,5000,10000,25000,50000,100000,250000,500000,750000,1000000];
  var maxCalls=vols[vols.length-1]*0.012*0.57/0.004;
  var svgW=500,svgH=80;
  var points=vols.map(function(v,i){
    var calls=v*0.012*0.57/0.004;
    return {x:(i/(vols.length-1))*svgW, y:svgH-(calls/maxCalls)*svgH};
  });
  var pathD='M'+points.map(function(p){return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' L');
  var areaD=pathD+' L'+svgW+','+svgH+' L0,'+svgH+' Z';
  var chart='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;height:60px;margin:8px 0" preserveAspectRatio="none">'
    +'<defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00ff88" stop-opacity="0.3"/><stop offset="100%" stop-color="#00ff88" stop-opacity="0.02"/></linearGradient></defs>'
    +'<path d="'+areaD+'" fill="url(#chartGrad)"/>'
    +'<path d="'+pathD+'" fill="none" stroke="#00ff88" stroke-width="2"/>'
    +'</svg>';

  return '<div class="card"><div class="ctitle">Fee Calculator <span style="color:var(--text3);font-size:9px;margin-left:6px">57% of 1.2% swap fee funds inference</span></div>'
    +'<div style="font-size:11px;color:var(--text2);margin-bottom:12px">Drag to see how token trading volume translates into self-funded AI inference calls.</div>'
    +'<div style="font-size:10px;color:var(--text2);margin-bottom:5px;letter-spacing:.1em">DAILY TRADING VOLUME</div>'
    +'<input type="range" class="csl" id="csl" min="1000" max="1000000" step="1000" value="'+defaultVol+'"/>'
    +'<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-top:4px"><span>$1k</span><span id="slv">$500k</span><span>$1M</span></div>'
    +'<div style="font-size:9px;color:var(--text3);margin:6px 0 2px;letter-spacing:.15em">INFERENCE CALLS / DAY (chart)</div>'
    +chart
    +'<div class="co" id="cco">'+calcCards(defaultVol)+'</div>'
    +'<div style="height:1px;background:var(--border);margin:12px 0"></div>'
    +'<div style="font-size:10px;color:var(--text3);line-height:2"><b style="color:var(--text2)">Break-even:</b> ~$12/day trading volume funds continuous inference. <b style="color:var(--green)">At $100k/day: 171,000 inference calls/day — fully autonomous.</b></div>'
    +'</div>';
}

function buildEconPage(){
  var nodes=[{label:'AGENT WALLET',icon:'\u25C8',c:'#00ff88',d:'Cross-chain, gas sponsored'},{label:'LAUNCH TOKEN',icon:'\u25CE',c:'#f97316',d:'100B supply, Base'},{label:'TRADING FEES',icon:'\u29A1',c:'#f59e0b',d:'1.2% swap per trade'},{label:'CREATOR 57%',icon:'\u25C9',c:'#a78bfa',d:'Auto to your wallet'},{label:'LLM GATEWAY',icon:'\u25A7',c:'#60a5fa',d:'llm.bankr.bot'}];
  var html='<div class="card"><div class="ctitle">Self-Sustaining Flywheel</div><div class="ef">';
  nodes.forEach(function(n,i,arr){
    html+='<div class="fn" style="--nc:'+n.c+'"><div class="fi" style="color:'+n.c+'">'+n.icon+'</div><div class="fl" style="color:'+n.c+'">'+n.label+'</div><div class="fd">'+n.d+'</div></div>';
    if(i<arr.length-1)html+='<span class="fa">&rarr;</span>';
  });
  html+='<span class="fa">&rarr;</span><div class="lb">&#x21BA; REPEAT</div></div>'
    +'<div class="ec3">';
  [{t:'Token Launch Fees',c:'#f97316',v:'$100k vol \u00d7 1.2% = $1,200/day\nCreator 57% = $684/day\n\u2192 171,000 calls/day'},{t:'$10k Volume',c:'#00ff88',v:'$10k vol \u00d7 1.2% = $120/day\nCreator 57% = $68.40/day\n\u2192 17,100 calls/day'},{t:'Break-Even',c:'#60a5fa',v:'$12/day volume needed\nfor continuous inference\n\u2192 zero ongoing cost'}].forEach(function(e){
    html+='<div class="ec" style="--e:'+e.c+'"><div class="et" style="color:'+e.c+'">'+e.t+'</div><div class="ev">'+e.v+'</div></div>';
  });
  html+='</div></div>'
    +'<div class="card"><div class="ctitle">Fee Structure &mdash; docs.bankr.bot</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:11px">'
    +'<div><div style="color:var(--text2);margin-bottom:8px;font-size:10px;letter-spacing:.1em">1.2% SWAP FEE SPLIT</div>';
  [['Creator (you)','57%','#00ff88'],['Bankr','36.1%','#f97316'],['Bankr Ecosystem','1.9%','#a78bfa'],['Doppler Protocol','5%','#60a5fa']].forEach(function(row){
    html+='<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">'+row[0]+'</span><span style="color:'+row[2]+';font-family:var(--display);font-size:14px">'+row[1]+'</span></div>';
  });
  html+='</div><div><div style="color:var(--text2);margin-bottom:8px;font-size:10px;letter-spacing:.1em">CHAINS</div>';
  [['Base','Gas Sponsored','#00ff88'],['Polygon','Gas Sponsored','#a78bfa'],['Unichain','Gas Sponsored','#60a5fa'],['Ethereum','No Sponsorship','#f59e0b'],['Solana','Limited','#f472b6']].forEach(function(row){
    html+='<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">'+row[0]+'</span><span style="color:'+row[2]+';font-size:10px">'+row[1]+'</span></div>';
  });
  html+='</div></div></div>';
  return html;
}

function buildStatusPage(){
  var html='<div class="card"><div class="ctitle">Autonomous Loop Status</div>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">'
    +'<div class="wc"><div class="wl">Cron Schedule</div><div class="wv" style="color:var(--green);font-size:16px">Every 5 min</div><div class="ws">GitHub Actions (free)</div></div>'
    +'<div class="wc"><div class="wl">Agent Tasks</div><div class="wv" style="color:var(--blue)">4</div><div class="ws">Running autonomously</div></div>'
    +'<div class="wc"><div class="wl">Status</div><div class="wv" style="color:var(--green);font-size:16px">&#x25CF; LIVE</div><div class="ws">bankrOS is online</div></div>'
    +'</div>'
    +'<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:12px">'
    +'<div style="font-size:10px;color:var(--text2);letter-spacing:.12em;margin-bottom:8px">AUTONOMOUS TASK SCHEDULE</div>';
  [{name:'Market Monitor',model:'claude-sonnet-4.6',freq:'Every 5 min',action:'Monitor ETH/USDC, execute DCA if signal',c:'#00ff88'},{name:'Health Check',model:'gemini-3-flash',freq:'Every 15 min',action:'Check wallet + portfolio health',c:'#34d399'},{name:'Inference Funder',model:'claude-sonnet-4.6',freq:'Every 30 min',action:'Auto top-up LLM credits from fees',c:'#60a5fa'},{name:'Fee Claimer',model:'gemini-3-flash',freq:'Every 1 hour',action:'Claim token trading fees to wallet',c:'#f97316'}].forEach(function(t){
    html+='<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">'
      +'<div style="width:6px;height:6px;border-radius:50%;background:'+t.c+';box-shadow:0 0 7px '+t.c+';flex-shrink:0"></div>'
      +'<div style="flex:1"><div style="font-size:11px;color:var(--text);margin-bottom:2px">'+t.name+'</div><div style="font-size:10px;color:var(--text3)">'+t.action+'</div></div>'
      +'<div style="text-align:right"><div style="font-size:10px;color:'+t.c+'">'+t.freq+'</div><div style="font-size:9px;color:var(--text3)">'+t.model+'</div></div></div>';
  });
  html+='</div>'
    +'<div class="irow">'
    +'<button class="btn btn-g" onclick="triggerCron()"'+(S.cronRunning?' disabled':'')+'>'+(S.cronRunning?'<span class="spin"></span> RUNNING...':'&#x25B6; TRIGGER NOW')+'</button>'
    +'<a href="https://vercel.com/nikayrezzas-projects/bankr-agent-os-v2/settings/crons" target="_blank" class="btn btn-o" style="text-decoration:none">&#x29A1; VERCEL CRONS</a>'
    +'</div></div>'
    +'<div class="card"><div class="ctitle">Setup Required</div>'
    +'<div class="alert a-w" style="margin-bottom:12px">Add these environment variables in Vercel Dashboard to activate autonomous mode.</div>'
    +'<div style="display:flex;flex-direction:column;gap:8px;font-size:11px">';
  [{key:'BANKR_API_KEY',val:'bk_your_key',desc:'Your Bankr API key for onchain execution'},{key:'CRON_SECRET',val:'any_random_secret',desc:'Secret to verify cron requests from Vercel'}].forEach(function(e){
    html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 12px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--green);font-family:var(--mono)">'+e.key+'</span><span style="color:var(--text3);font-size:10px">Required</span></div>'
      +'<div style="color:var(--text3);font-size:10px">Value: <span style="color:var(--blue)">'+e.val+'</span></div>'
      +'<div style="color:var(--text2);font-size:10px;margin-top:3px">'+e.desc+'</div></div>';
  });
  html+='</div></div>';
  if(S.cronLog&&S.cronLog.length){
    html+='<div class="card"><div class="ctitle">Cron Log</div><div style="display:flex;flex-direction:column;gap:5px">';
    S.cronLog.forEach(function(l){
      html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 12px;font-size:11px">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'
        +'<span style="color:'+(l.ok?'var(--green)':'#f44')+'">'+(l.ok?'&#x2713;':'&#x2717;')+' Cycle '+l.cycle+'</span>'
        +'<span style="color:var(--text3)">'+l.ts+'</span></div>';
      if(l.results)l.results.forEach(function(r){html+='<div style="color:var(--text2);font-size:10px">&#x25C8; '+esc(r.name)+': <span style="color:'+(r.action==='executed'?'var(--green)':'var(--text3)')+'">'+esc(r.action)+'</span></div>';});
      html+='</div>';
    });
    html+='</div></div>';
  }
  return html;
}

async function triggerCron(){
  if(S.cronRunning)return;
  S.cronRunning=true;renderPage();
  try{
    var r=await fetch('/api/agent-loop',{method:'GET',headers:{'x-api-key':S.key||'demo'}});
    var d=await r.json();
    if(!S.cronLog)S.cronLog=[];
    S.cronLog.unshift({ok:d.status==='ok',cycle:d.cycle||1,ts:new Date().toLocaleTimeString(),
      results:d.results?d.results.filter(function(x){return x.status==='ok';}).map(function(x){return {name:x.name,action:x.action||'monitored'};}):[],
    });
    if(S.cronLog.length>10)S.cronLog.pop();
  }catch(e){if(!S.cronLog)S.cronLog=[];S.cronLog.unshift({ok:false,cycle:0,ts:new Date().toLocaleTimeString(),results:[]});}
  S.cronRunning=false;renderPage();
}




function downloadOutput(){
  if(!S.out)return;
  var a2=S.agent, m2=S.model;
  var filename='bankrOS-'+a2.id+'-'+new Date().toISOString().slice(0,19).replace(/:/g,'-')+'.md';
  var header='# bankrOS — '+a2.label+'\n'
    +'**Model:** '+m2.label+'\n'
    +'**Time:** '+new Date().toLocaleString()+'\n'
    +'**Cost:** $'+S.stats.cost.toFixed(4)+'\n\n---\n\n';
  var blob=new Blob([header+S.out],{type:'text/markdown'});
  var url=URL.createObjectURL(blob);
  var link=document.createElement('a');
  link.href=url;link.download=filename;
  document.body.appendChild(link);link.click();
  document.body.removeChild(link);URL.revokeObjectURL(url);
  var btn=document.getElementById('dlBtn');
  if(btn){btn.textContent='SAVED!';btn.style.color='var(--green)';setTimeout(function(){btn.textContent='\u2B73 SAVE';btn.style.color='';},2000);}
}


async function sendWebhook(agentLabel, output, cost){
  if(!S.webhook.enabled||!S.webhook.url)return;
  try{
    await fetch(S.webhook.url,{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        content:'**bankrOS** — '+agentLabel+' executed\n```\n'+output.slice(0,500)+'\n```\nCost: $'+cost.toFixed(4),
        embeds:[{
          title:'bankrOS Agent Execution',
          description:output.slice(0,2000),
          color:3066993,
          footer:{text:'bankr-agent-os.vercel.app'},
          timestamp:new Date().toISOString()
        }]
      })
    });
    addLog('✓ Webhook sent to '+S.webhook.url.slice(0,30)+'...','ok');
  }catch(e){
    addLog('⚠ Webhook failed: '+e.message,'warn');
  }
}


async function fetchPolymarkets(){
  try{
    // Polymarket Gamma API — free, no auth
    var r=await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=20&order=volume&ascending=false',{
      headers:{'Accept':'application/json'}
    });
    if(!r.ok)throw new Error('Polymarket fetch failed');
    var d=await r.json();
    S.polymarkets=(d||[]).slice(0,10).map(function(m){
      return {
        id:m.id,
        question:m.question,
        volume:parseFloat(m.volume||0),
        liquidity:parseFloat(m.liquidity||0),
        outcomes:m.outcomes,
        outcomePrices:m.outcomePrices,
        endDate:m.endDate,
        url:'https://polymarket.com/event/'+m.slug,
      };
    });
    renderPage();
  }catch(e){S.polymarkets=[];}
}


function saveCustomAgent(){
  var name=document.getElementById('ca-name');
  var icon=document.getElementById('ca-icon');
  var sys=document.getElementById('ca-sys');
  var usr=document.getElementById('ca-usr');
  var color=document.getElementById('ca-color');
  if(!name||!name.value.trim()||!sys||!sys.value.trim())return;
  var agent={
    id:'custom-'+Date.now(),
    icon:icon&&icon.value?icon.value:'&#x25C6;',
    label:name.value.trim(),
    c:color&&color.value?color.value:'#a78bfa',
    desc:'Custom agent: '+name.value.trim(),
    sys:sys.value.trim(),
    usr:usr&&usr.value.trim()?usr.value.trim():'Analyze and provide actionable insights.',
    custom:true
  };
  if(!S.customAgents)S.customAgents=[];
  S.customAgents.push(agent);
  saveState();
  renderPage();
}

function deleteCustomAgent(id){
  S.customAgents=(S.customAgents||[]).filter(function(a){return a.id!==id;});
  if(S.agent.id===id)S.agent=AGENTS[0];
  saveState();renderPage();
}


function buildHistoryPage(){
  var hist=S.runHistory||[];
  var html='<div class="card"><div class="ctitle">Run History <span style="color:var(--text3);font-size:9px;margin-left:6px">'+hist.length+' runs saved</span></div>';
  if(!hist.length){html+='<div class="em">No runs yet. Execute an agent to see history.</div></div>';return html;}
  html+='<div class="irow" style="margin-bottom:12px"><button class="btn btn-o btn-s" onclick="S.runHistory=[];saveState();renderPage()">CLEAR</button></div>';
  hist.forEach(function(run){
    var d=new Date(run.ts);
    html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:12px;margin-bottom:8px">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
      +'<span style="font-size:16px;color:'+run.agentColor+'">'+run.agentIcon+'</span>'
      +'<span style="font-size:11px;color:'+run.agentColor+'">'+esc(run.agentLabel)+'</span>'
      +'<span style="font-size:10px;color:var(--text3);background:var(--bg2);padding:2px 6px;border-radius:3px;border:1px solid var(--border)">'+esc(run.modelLabel)+'</span>'
      +'<span style="font-size:10px;color:var(--text3);margin-left:auto">'+d.toLocaleDateString()+' '+d.toLocaleTimeString()+'</span></div>'
      +'<div style="font-size:10px;color:var(--text2);margin-bottom:6px;font-style:italic">'+esc((run.prompt||'').slice(0,100))+'</div>'
      +'<div style="font-size:10px;color:var(--text2);background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:8px;max-height:80px;overflow:hidden">'+esc((run.output||'').slice(0,200))+'</div>'
      +'<div style="display:flex;gap:12px;margin-top:8px;font-size:10px">'
      +'<span style="color:var(--orange)">Cost: $'+run.cost.toFixed(4)+'</span>'
      +'<span style="color:var(--green)">Funded: $'+run.funded.toFixed(4)+'</span>'
      +(run.tx?'<a href="https://basescan.org/tx/'+run.tx+'" target="_blank" style="color:var(--blue);text-decoration:none">Tx &#x2197;</a>':'')
      +'</div></div>';
  });
  html+='</div>';return html;
}

function buildCustomAgentPage(){
  var customs=S.customAgents||[];
  var html='<div class="card"><div class="ctitle">Custom Agent Creator</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">'
    +'<div class="fld"><label>Agent Name *</label><input class="inp" id="ca-name" style="width:100%" placeholder="e.g. Yield Hunter"/></div>'
    +'<div class="fld"><label>Icon (HTML entity)</label><input class="inp" id="ca-icon" style="width:100%" placeholder="e.g. &#x25C6;"/></div>'
    +'<div class="fld"><label>Accent Color</label><input type="color" id="ca-color" value="#a78bfa" style="width:100%;height:36px;border:1px solid var(--border);border-radius:6px;background:var(--bg)"/></div>'
    +'</div>'
    +'<div class="fld" style="margin-bottom:10px"><label>System Prompt *</label>'
    +'<textarea class="pi" id="ca-sys" style="height:90px" placeholder="You are an autonomous DeFi agent..."></textarea></div>'
    +'<div class="fld" style="margin-bottom:12px"><label>Default User Prompt</label>'
    +'<textarea class="pi" id="ca-usr" style="height:52px" placeholder="Default task to execute..."></textarea></div>'
    +'<button class="btn btn-g" onclick="saveCustomAgent()">&#x2B22; CREATE AGENT</button></div>';
  if(customs.length){
    html+='<div class="card"><div class="ctitle">Your Custom Agents ('+customs.length+')</div>';
    customs.forEach(function(ag,ci){
      html+='<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">'
        +'<span style="font-size:18px;color:'+ag.c+'">'+ag.icon+'</span>'
        +'<div style="flex:1"><div style="font-size:11px;color:'+ag.c+'">'+esc(ag.label)+'</div>'
        +'<div style="font-size:10px;color:var(--text3)">'+esc(ag.sys.slice(0,60))+'...</div></div>'
        +'<button class="btn btn-g btn-s" onclick="useCustomAgent('+ci+')">USE</button>'
        +'<button class="btn btn-o btn-s" onclick="deleteCustomAgent('+ci+')">&#x2717;</button></div>';
    });
    html+='</div>';
  }
  return html;
}

function useCustomAgent(idx){
  var ag=(S.customAgents||[])[idx];
  if(!ag)return;
  if(!findAgent(ag.id))AGENTS.push(ag);
  selAgent(ag.id);setPage(0);
}

function deleteCustomAgent(idx){
  if(!S.customAgents)return;
  var ag=S.customAgents[idx];
  if(ag&&S.agent.id===ag.id)S.agent=AGENTS[0];
  S.customAgents.splice(idx,1);
  saveState();renderPage();
}

function buildPolymarketPage(){
  var markets=S.polymarkets||[];
  var html='<div class="card"><div class="ctitle">Polymarket <span style="color:var(--text3);font-size:9px;margin-left:6px">prediction markets via Bankr on Polygon</span></div>'
    +'<div class="irow" style="margin-bottom:12px">'
    +'<button class="btn btn-g" onclick="fetchPolymarkets()">'+(markets.length?'&#x27F3; REFRESH':'&#x25B6; LOAD MARKETS')+'</button>'
    +'<div style="font-size:10px;color:var(--text3)">Gas sponsored on Polygon</div></div>';
  if(!markets.length){
    html+='<div class="em">Click Load Markets to fetch live prediction markets.</div>'
      +'<div class="alert a-w" style="margin-top:10px">Trade via Bankr: prompt = buy 50 USDC of YES on [market] on polygon</div>';
  }else{
    html+='<div style="display:flex;flex-direction:column;gap:8px">';
    markets.forEach(function(m){
      var prices=[];try{prices=JSON.parse(m.outcomePrices||'[]').map(function(p){return (parseFloat(p)*100).toFixed(0)+'%';});}catch(e){}
      var outcomes=[];try{outcomes=JSON.parse(m.outcomes||'[]');}catch(e){}
      html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:12px">'
        +'<div style="font-size:11px;color:var(--text);margin-bottom:8px;line-height:1.5">'+esc(m.question)+'</div>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">';
      outcomes.forEach(function(o,i){
        var pct=prices[i]||'';var isYes=o.toLowerCase()==='yes';
        html+='<div style="border:1px solid '+(isYes?'var(--green)':'#f87171')+';border-radius:6px;padding:5px 10px;font-size:10px">'
          +'<span style="color:'+(isYes?'var(--green)':'#f87171')+'">'+esc(o)+'</span>'+(pct?' <b>'+pct+'</b>':'')+'</div>';
      });
      html+='</div><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3)">'
        +'<span>Vol: $'+Math.round(m.volume).toLocaleString()+'</span>'
        +'<span>Liq: $'+Math.round(m.liquidity).toLocaleString()+'</span>'
        +'<a href="'+esc(m.url)+'" target="_blank" style="color:var(--blue);text-decoration:none">View &#x2197;</a>'
        +'</div></div>';
    });
    html+='</div>';
  }
  html+='</div>';return html;
}

function buildWebhookPage(){
  var wh=S.webhook||{url:'',enabled:false};
  var html='<div class="card"><div class="ctitle">Webhook Notifications</div>'
    +'<div class="alert a-w" style="margin-bottom:12px">POST agent results to Discord or any webhook URL when an agent executes.</div>'
    +'<div class="fld" style="margin-bottom:10px"><label>Webhook URL</label>'
    +'<input class="inp" style="width:100%" placeholder="https://discord.com/api/webhooks/..." '
    +'value="'+esc(wh.url||'')+'" oninput="S.webhook.url=this.value;saveState()"/></div>'
    +'<div class="irow" style="margin-bottom:14px">'
    +'<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:11px;color:var(--text2)">'
    +'<input type="checkbox"'+(wh.enabled?' checked':'')+' onchange="S.webhook.enabled=this.checked;saveState()"> Enable notifications</label></div>'
    +'<button class="btn btn-g" onclick="testWebhook()">&#x1F514; TEST WEBHOOK</button></div>'
    +'<div class="card"><div class="ctitle">Discord Setup</div>'
    +'<div style="font-size:11px;color:var(--text2);line-height:2.2">'
    +'1. Discord &rarr; Server Settings &rarr; Integrations &rarr; Webhooks<br>'
    +'2. New Webhook &rarr; name it bankrOS &rarr; pick channel<br>'
    +'3. Copy Webhook URL &rarr; paste above &rarr; enable'
    +'</div></div>';
  return html;
}

async function testWebhook(){
  if(!S.webhook||!S.webhook.url){alert('Enter a webhook URL first');return;}
  await sendWebhook('bankrOS Test','Webhook test successful! Notifications are working.',0);
}



// ── Signal Debug Panel ────────────────────────────────────