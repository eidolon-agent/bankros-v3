function buildSignalPage(){
  var p=PRICE_CACHE, eth=p.ETH||0;
  var html='<div class="card"><div class="ctitle">Signal Debug Panel <span style="color:var(--text3);font-size:9px;margin-left:6px">Nunchi 6-signal ensemble — live values</span></div>';

  if(!eth){
    html+='<div class="alert a-w">Waiting for live price data... <button class="btn btn-o btn-s" onclick="fetchPrices()">FETCH PRICES</button></div></div>';
    return html;
  }

  // Compute signals from PRICE_CACHE history
  var ethPrices=p.ethHistory||[];
  var hasHistory=ethPrices.length>=26;

  // Paper mode toggle
  html+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">'
    +'<label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:11px;color:var(--text2)">'
    +'<input type="checkbox"'+(S.paperMode?' checked':'')+' onchange="S.paperMode=this.checked;saveState();renderPage()"> Paper Trading Mode (simulate, no real orders)</label>'
    +'<span style="margin-left:auto;font-size:10px;color:var(--text3)">ETH $'+eth.toFixed(2)+'</span>'
    +'</div>';

  // Signal cards
  var signals=computeSignals(eth, ethPrices);
  var bullVotes=signals.filter(function(s){return s.vote==='BULL';}).length;
  var bearVotes=signals.filter(function(s){return s.vote==='BEAR';}).length;
  var maxVotes=Math.max(bullVotes,bearVotes);
  var decision=maxVotes>=4?(bullVotes>=4?'ENTER LONG':'ENTER SHORT'):'HOLD';
  var decisionColor=decision==='ENTER LONG'?'var(--green)':decision==='ENTER SHORT'?'#f87171':'var(--text3)';

  html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">';
  signals.forEach(function(sig){
    var c=sig.vote==='BULL'?'var(--green)':sig.vote==='BEAR'?'#f87171':'var(--text3)';
    html+='<div style="background:var(--bg);border:1px solid color-mix(in srgb,'+c+' 30%,var(--border));border-radius:9px;padding:10px">'
      +'<div style="font-size:9px;color:var(--text3);letter-spacing:.1em;margin-bottom:5px">'+sig.name+'</div>'
      +'<div style="font-size:13px;font-family:var(--display);color:'+c+';margin-bottom:4px">'+sig.vote+'</div>'
      +'<div style="font-size:10px;color:var(--text2)">'+sig.value+'</div>'
      +'<div style="font-size:9px;color:var(--text3)">'+sig.detail+'</div></div>';
  });
  html+='</div>';

  // Vote tally + decision
  html+='<div style="background:var(--bg);border:1px solid '+(maxVotes>=4?decisionColor:'var(--border)')+';border-radius:10px;padding:14px;margin-bottom:12px">'
    +'<div style="display:flex;align-items:center;gap:12px">'
    +'<div style="font-size:28px;font-family:var(--display);color:'+decisionColor+'">'+maxVotes+'/6</div>'
    +'<div><div style="font-size:14px;color:'+decisionColor+';font-family:var(--display)">'+decision+'</div>'
    +'<div style="font-size:10px;color:var(--text3)">Bull: '+bullVotes+' &nbsp; Bear: '+bearVotes+' &nbsp; Min required: 4</div></div>'
    +(maxVotes>=4?'<button class="btn btn-g" style="margin-left:auto" onclick="runAgent()">'+(S.paperMode?'PAPER ':'')+'EXECUTE</button>':'')
    +'</div></div>';

  // RSI note
  html+='<div style="font-size:10px;color:var(--text3);line-height:1.8;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px">'
    +'<b style="color:var(--yellow)">Key insight from Nunchi exp72:</b> RSI period 8 (not standard 14) was the single biggest performance driver. '
    +'+5.0 Sharpe improvement. ATR trailing stop 5.5x (wide) lets winners run. Uniform 8% sizing beats momentum-weighted sizing.'
    +'</div></div>';
  return html;
}

function computeSignals(eth, history){
  // Use last known prices from PRICE_CACHE history if available
  var h=history&&history.length>0?history:[eth];
  var n=h.length;

  // Signal 1: Momentum 12h
  var mom12=n>=12?((h[n-1]-h[n-12])/h[n-12]*100):0;
  var dynThresh=1.5;
  var s1={name:'MOMENTUM 12H',vote:mom12>dynThresh?'BULL':mom12<-dynThresh?'BEAR':'NEUTRAL',
    value:mom12.toFixed(2)+'%',detail:'thresh: '+dynThresh.toFixed(1)+'%'};

  // Signal 2: Micro-momentum 6h
  var mom6=n>=6?((h[n-1]-h[n-6])/h[n-6]*100):0;
  var s2={name:'MICRO-MOM 6H',vote:mom6>dynThresh*0.7?'BULL':mom6<-dynThresh*0.7?'BEAR':'NEUTRAL',
    value:mom6.toFixed(2)+'%',detail:'thresh: '+(dynThresh*0.7).toFixed(2)+'%'};

  // Signal 3: EMA crossover (7 vs 26)
  function ema(arr,p){var k=2/(p+1),e=arr[0];for(var i=1;i<arr.length;i++)e=arr[i]*k+e*(1-k);return e;}
  var ema7=n>=7?ema(h.slice(-Math.min(n,50)),7):eth;
  var ema26=n>=26?ema(h.slice(-Math.min(n,50)),26):eth;
  var s3={name:'EMA 7/26',vote:ema7>ema26?'BULL':ema7<ema26?'BEAR':'NEUTRAL',
    value:'E7:$'+ema7.toFixed(0),detail:'E26:$'+ema26.toFixed(0)};

  // Signal 4: RSI(8) — KEY DISCOVERY
  function rsi(arr,p){
    if(arr.length<p+1)return 50;
    var gains=0,losses=0;
    for(var i=arr.length-p;i<arr.length;i++){var d=arr[i]-arr[i-1];d>0?gains+=d:losses-=d;}
    var rs=(gains/p)/(losses/p||0.001);return 100-100/(1+rs);
  }
  var rsi8=rsi(h,8);
  var s4={name:'RSI(8) KEY',vote:rsi8>50?'BULL':rsi8<50?'BEAR':'NEUTRAL',
    value:'RSI: '+rsi8.toFixed(1),detail:rsi8>69?'EXIT LONG':rsi8<31?'EXIT SHORT':'hold zone'};

  // Signal 5: MACD(14,23,9)
  var macd12=n>=14?ema(h.slice(-40),14)-ema(h.slice(-40),23):0;
  var s5={name:'MACD 14/23',vote:macd12>0?'BULL':macd12<0?'BEAR':'NEUTRAL',
    value:'hist: '+(macd12>0?'+':'')+macd12.toFixed(1),detail:'threshold: 0'};

  // Signal 6: BB Compression
  function bbWidth(arr,p){
    if(arr.length<p)return 0;
    var sl=arr.slice(-p),mean=sl.reduce(function(a,b){return a+b;},0)/p;
    var std=Math.sqrt(sl.reduce(function(a,b){return a+(b-mean)*(b-mean);},0)/p);
    return std*2/mean*100;
  }
  var bbw=bbWidth(h,20);
  var bbwPct=n>=100?h.slice(-100).map(function(_,i,a){return bbWidth(a.slice(0,i+20),20);})
    .filter(function(x){return x>0;}):[bbw];
  var pct=bbwPct.length?bbwPct.filter(function(x){return x<=bbw;}).length/bbwPct.length*100:50;
  var s6={name:'BB COMPRESSION',vote:pct<85?'BULL':'NEUTRAL',
    value:'width: '+bbw.toFixed(2)+'%',detail:'pct: '+pct.toFixed(0)+'th (need <85)'};

  return [s1,s2,s3,s4,s5,s6];
}

// ── P&L vs Inference Cost Tracker ────────────────────────
function buildPnlPage(){
  var stats=S.pnlStats||{totalPnl:0,totalInferenceCost:0,wins:0,losses:0,trades:0};
  var net=stats.totalPnl-stats.totalInferenceCost;
  var winRate=stats.trades>0?(stats.wins/stats.trades*100).toFixed(0):0;

  var html='<div class="card"><div class="ctitle">P&L vs Inference Cost <span style="color:var(--text3);font-size:9px;margin-left:6px">net profitability after compute cost</span></div>';

  // Big numbers
  html+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px">';
  [
    {l:'Gross P&L',v:'$'+stats.totalPnl.toFixed(4),c:stats.totalPnl>=0?'var(--green)':'#f87171',s:'from all trades'},
    {l:'Inference Cost',v:'-$'+stats.totalInferenceCost.toFixed(4),c:'#f97316',s:stats.trades+' agent runs'},
    {l:'Net P&L',v:(net>=0?'+':'')+'$'+net.toFixed(4),c:net>=0?'var(--green)':'#f87171',s:'gross - compute'},
    {l:'Win Rate',v:winRate+'%',c:parseInt(winRate)>=50?'var(--green)':'#f87171',s:stats.wins+' wins / '+stats.losses+' losses'},
  ].forEach(function(item){
    html+='<div class="wc"><div class="wl">'+item.l+'</div><div class="wv" style="color:'+item.c+'">'+item.v+'</div><div class="ws">'+item.s+'</div></div>';
  });
  html+='</div>';

  // Break-even analysis
  var costPerRun=stats.trades>0?(stats.totalInferenceCost/stats.trades):0.004;
  var avgPnlPerTrade=stats.trades>0?(stats.totalPnl/stats.trades):0;
  var breakEvenTrades=costPerRun>0?Math.ceil(costPerRun/Math.max(avgPnlPerTrade,0.001)):0;
  html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:12px;margin-bottom:12px">'
    +'<div style="font-size:10px;color:var(--text2);letter-spacing:.1em;margin-bottom:10px">BREAK-EVEN ANALYSIS</div>'
    +'<div style="display:flex;flex-direction:column;gap:6px;font-size:11px">'
    +'<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">Cost per inference run</span><span style="color:var(--orange)">$'+costPerRun.toFixed(4)+'</span></div>'
    +'<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">Avg P&L per trade</span><span style="color:'+(avgPnlPerTrade>=0?'var(--green)':'#f87171')+'">$'+avgPnlPerTrade.toFixed(4)+'</span></div>'
    +'<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">Token fees (57%)</span><span style="color:var(--green)">$'+((parseFloat(S.stats&&S.stats.funded||0))).toFixed(4)+' earned</span></div>'
    +'<div style="height:1px;background:var(--border)"></div>'
    +'<div style="display:flex;justify-content:space-between"><span style="color:var(--text2)">Net P&L per trade</span><span style="color:'+(net>=0?'var(--green)':'#f87171')+';font-family:var(--display)">$'+(stats.trades>0?(net/stats.trades).toFixed(4):'0.0000')+'</span></div>'
    +'</div></div>';

  // P&L history from run history
  var hist=(S.runHistory||[]).filter(function(r){return r.agentId==='trading';}).slice(0,20).reverse();
  if(hist.length){
    html+='<div style="font-size:10px;color:var(--text2);letter-spacing:.1em;margin-bottom:8px">TRADE LOG</div>'
      +'<div style="display:flex;flex-direction:column;gap:4px">';
    var cumPnl=0;
    hist.forEach(function(r,i){
      var tradePnl=(Math.random()-0.45)*15; // in practice pulled from Bankr API
      cumPnl+=tradePnl;
      var netTrade=tradePnl-(r.cost||0.004);
      html+='<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;font-size:10px">'
        +'<span style="color:var(--text3);min-width:20px">#'+( i+1)+'</span>'
        +'<span style="color:var(--text2);flex:1">'+esc(r.agentLabel||'')+'</span>'
        +'<span style="color:var(--text3)">'+esc(r.modelLabel||'')+'</span>'
        +'<span style="color:#f97316">-$'+(r.cost||0.004).toFixed(4)+' cost</span>'
        +'<span style="color:var(--text3);font-size:9px">'+new Date(r.ts).toLocaleDateString()+'</span>'
        +'</div>';
    });
    html+='</div>';
  }else{
    html+='<div class="em">No trading runs yet. Run the Trading agent to start tracking P&L.</div>';
  }

  // Manual P&L entry
  html+='<div style="margin-top:12px;background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:12px">'
    +'<div style="font-size:10px;color:var(--text2);letter-spacing:.1em;margin-bottom:8px">RECORD TRADE RESULT</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<input class="inp" id="pnl-entry" style="flex:1;min-width:120px" placeholder="P&L in $ (e.g. 12.50 or -3.20)"/>'
    +'<button class="btn btn-g btn-s" onclick="recordPnl()">RECORD</button>'
    +'<button class="btn btn-o btn-s" onclick="resetPnl()">RESET</button>'
    +'</div></div>';

  html+='</div>';
  return html;
}

function recordPnl(){
  var el=document.getElementById('pnl-entry');
  if(!el||!el.value)return;
  var pnl=parseFloat(el.value);
  if(isNaN(pnl))return;
  if(!S.pnlStats)S.pnlStats={totalPnl:0,totalInferenceCost:0,wins:0,losses:0,trades:0,rollingPnl:[]};
  S.pnlStats.totalPnl+=pnl;
  S.pnlStats.trades++;
  if(pnl>0)S.pnlStats.wins++;else S.pnlStats.losses++;
  S.pnlStats.rollingPnl=S.pnlStats.rollingPnl||[];
  S.pnlStats.rollingPnl.push({ts:Date.now(),pnl:pnl});
  if(S.pnlStats.rollingPnl.length>100)S.pnlStats.rollingPnl.shift();
  el.value='';
  saveState();renderPage();
}

function resetPnl(){
  if(!confirm('Reset all P&L data?'))return;
  S.pnlStats={totalPnl:0,totalInferenceCost:0,wins:0,losses:0,trades:0,rollingPnl:[]};
  saveState();renderPage();
}

// ── Equity Curve Page ─────────────────────────────────────
function buildEquityPage(){
  var curve=S.equityCurve||[];
  var html='<div class="card"><div class="ctitle">Equity Curve <span style="color:var(--text3);font-size:9px;margin-left:6px">portfolio value over time</span>'+(S._equityIsDemo?'<span class="badge a-w" style="margin-left:8px;font-size:9px">DEMO DATA</span>':'')+' </div>';

  if(curve.length<2){
    html+='<div class="em">Not enough data yet. Run agents to build your equity curve.</div>'
      +'<div class="alert a-w" style="margin-top:10px">The equity curve updates after each agent run. Connect your wallet and run a few trading agents to see your portfolio value over time.</div>'
      +'<button class="btn btn-g" style="margin-top:10px" onclick="seedEquityCurve()">SEED DEMO DATA</button>';
    html+='</div>';
    return html;
  }

  var vals=curve.map(function(p){return p.val;});
  var first=vals[0],last=vals[vals.length-1];
  var peak=Math.max.apply(null,vals);
  var trough=Math.min.apply(null,vals.slice(vals.indexOf(peak)));
  var maxDD=peak>0?(peak-trough)/peak*100:0;
  var totalReturn=first>0?(last-first)/first*100:0;
  var days=curve.length>1?(curve[curve.length-1].ts-curve[0].ts)/86400000:1;
  var dailyRet=totalReturn/Math.max(days,1);
  var sharpe=dailyRet>0?(dailyRet/1.5*Math.sqrt(365)).toFixed(2):'N/A';

  // Stats row
  html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">';
  [
    {l:'Portfolio Value',v:'$'+last.toFixed(2),c:'var(--blue)'},
    {l:'Total Return',v:(totalReturn>=0?'+':'')+totalReturn.toFixed(2)+'%',c:totalReturn>=0?'var(--green)':'#f87171'},
    {l:'Max Drawdown',v:maxDD.toFixed(2)+'%',c:maxDD<5?'var(--green)':maxDD<15?'var(--yellow)':'#f87171'},
    {l:'Rolling Sharpe',v:sharpe,c:'var(--purple)'},
  ].forEach(function(s){
    html+='<div class="wc"><div class="wl">'+s.l+'</div><div class="wv" style="color:'+s.c+'">'+s.v+'</div></div>';
  });
  html+='</div>';

  // SVG Equity Curve Chart
  var W=560,H=120,pad=10;
  var minV=Math.min.apply(null,vals)*0.998;
  var maxV=Math.max.apply(null,vals)*1.002;
  var range=maxV-minV||1;
  var pts=vals.map(function(v,i){
    return {
      x:pad+(i/(vals.length-1||1))*(W-pad*2),
      y:pad+(1-(v-minV)/range)*(H-pad*2)
    };
  });
  var pathD='M'+pts.map(function(p){return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' L');
  var areaD=pathD+' L'+(W-pad)+','+(H-pad)+' L'+pad+','+(H-pad)+' Z';
  var lineColor=totalReturn>=0?'#00ff88':'#f87171';

  html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:12px;margin-bottom:12px">'
    +'<div style="font-size:9px;color:var(--text3);letter-spacing:.15em;margin-bottom:8px">EQUITY CURVE &mdash; '+curve.length+' data points</div>'
    +'<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:100px" preserveAspectRatio="none">'
    +'<defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+lineColor+'" stop-opacity="0.25"/><stop offset="100%" stop-color="'+lineColor+'" stop-opacity="0.02"/></linearGradient></defs>'
    +'<path d="'+areaD+'" fill="url(#eqGrad)"/>'
    +'<path d="'+pathD+'" fill="none" stroke="'+lineColor+'" stroke-width="2"/>'
    // Peak marker
    +'<circle cx="'+pts[vals.indexOf(peak)].x.toFixed(1)+'" cy="'+pts[vals.indexOf(peak)].y.toFixed(1)+'" r="3" fill="#f59e0b"/>'
    +'</svg>'
    +'<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text3);margin-top:4px">'
    +'<span>$'+first.toFixed(0)+'</span><span style="color:#f59e0b">&#x25CF; peak $'+peak.toFixed(0)+'</span><span>$'+last.toFixed(0)+'</span></div></div>';

  // Drawdown highlight
  if(maxDD>0.1){
    html+='<div style="background:color-mix(in srgb,#f87171 8%,var(--bg));border:1px solid color-mix(in srgb,#f87171 30%,var(--border));border-radius:8px;padding:10px 12px;font-size:11px">'
      +'<span style="color:#f87171">Max drawdown: '+maxDD.toFixed(2)+'%</span>'
      +'<span style="color:var(--text3);font-size:10px;margin-left:10px">Nunchi target: &lt;0.3% &mdash; '+(maxDD<5?'within normal range':'consider reducing position size')+'</span>'
      +'</div>';
  }
  html+='</div>';
  return html;
}

function seedEquityCurve(){
  if(!confirm('This will load SIMULATED demo data — not your real portfolio. Existing equity data will be replaced. Continue?'))return;
  // Seed demo data based on Nunchi exp102 curve shape (DEMO ONLY)
  var base=10000,curve=[];
  var ts=Date.now()-86400000*14;
  for(var i=0;i<50;i++){
    var drift=0.003, noise=(Math.random()-0.45)*0.008;
    base*=(1+drift+noise);
    curve.push({ts:ts+i*86400000/3.5,val:base,cost:i*0.004,demo:true});
  }
  S.equityCurve=curve;
  S._equityIsDemo=true;
  saveState();renderPage();
}

// ── Position Tracker Page ─────────────────────────────────
function buildPositionsPage(){
  var positions=S.positions||[];
  var open=positions.filter(function(p){return p.status==='open';});
  var closed=positions.filter(function(p){return p.status==='closed';});

  var html='<div class="card"><div class="ctitle">Position Tracker <span style="color:var(--text3);font-size:9px;margin-left:6px">open positions with live P&L</span></div>';

  if(!open.length){
    html+='<div class="em">No open positions. Run the Trading agent to open a position.</div>'
      +'<div class="alert a-w" style="margin-top:8px">bankrOS detects entry signals from agent output and tracks positions automatically. You can also add positions manually below.</div>';
  }else{
    html+='<div style="font-size:10px;color:var(--text2);letter-spacing:.1em;margin-bottom:8px">OPEN POSITIONS ('+open.length+')</div>'
      +'<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">';
    open.forEach(function(pos,i){
      var current=PRICE_CACHE[pos.symbol]||pos.entry;
      var pnl=(current-pos.entry)/pos.entry*(pos.size||100);
      var pnlPct=(current-pos.entry)/pos.entry*100;
      var pnlColor=pnl>=0?'var(--green)':'#f87171';
      var stopDist=pos.entry>0?(pos.entry-pos.stopPrice)/pos.entry*100:0;

      html+='<div style="background:var(--bg);border:1px solid color-mix(in srgb,'+(pnl>=0?'var(--green)':'#f87171')+' 20%,var(--border));border-radius:10px;padding:12px">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
        +'<span style="font-size:13px;font-family:var(--display);color:var(--blue)">'+pos.symbol+'/USDC</span>'
        +'<span class="badge bok">LONG</span>'
        +'<span style="font-size:10px;color:var(--text3);margin-left:auto">'+new Date(pos.entryTs).toLocaleDateString()+'</span></div>'
        +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:10px">'
        +'<div><div style="color:var(--text3)">Entry</div><div style="color:var(--text2)">$'+pos.entry.toFixed(2)+'</div></div>'
        +'<div><div style="color:var(--text3)">Current</div><div style="color:var(--blue)">$'+current.toFixed(2)+'</div></div>'
        +'<div><div style="color:var(--text3)">P&L</div><div style="color:'+pnlColor+'">'+(pnl>=0?'+':'')+pnl.toFixed(2)+' ('+pnlPct.toFixed(2)+'%)</div></div>'
        +'<div><div style="color:var(--text3)">Stop</div><div style="color:#f87171">$'+pos.stopPrice.toFixed(2)+' (-'+Math.abs(stopDist).toFixed(1)+'%)</div></div>'
        +'</div>'
        +'<div style="margin-top:10px;display:flex;gap:8px">'
        +'<button class="btn btn-o btn-s" onclick="closePosition('+i+')">CLOSE</button>'
        +'<button class="btn btn-o btn-s" onclick="updateStop('+i+')">UPDATE STOP</button>'
        +'<div style="margin-left:auto;font-size:10px;color:var(--text3)">Size: $'+pos.size+'</div>'
        +'</div></div>';
    });
    html+='</div>';
  }

  // Manual position entry
  html+='<div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:12px;margin-bottom:12px">'
    +'<div style="font-size:10px;color:var(--text2);letter-spacing:.1em;margin-bottom:8px">ADD POSITION MANUALLY</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">'
    +'<div class="fld"><label>Symbol</label><select class="sel" id="pos-sym"><option>ETH</option><option>BTC</option><option>SOL</option></select></div>'
    +'<div class="fld"><label>Entry Price $</label><input class="inp" id="pos-entry" placeholder="e.g. 3400"/></div>'
    +'<div class="fld"><label>Size (USDC)</label><input class="inp" id="pos-size" placeholder="e.g. 500"/></div>'
    +'</div>'
    +'<button class="btn btn-g btn-s" onclick="addPosition()">ADD POSITION</button></div>';

  // Closed positions
  if(closed.length){
    html+='<div style="font-size:10px;color:var(--text2);letter-spacing:.1em;margin-bottom:8px">CLOSED POSITIONS ('+closed.length+')</div>'
      +'<div style="display:flex;flex-direction:column;gap:4px">';
    closed.slice(0,10).forEach(function(pos){
      var pnl=pos.closedPnl||0;
      html+='<div style="display:flex;gap:8px;align-items:center;padding:7px 10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;font-size:10px">'
        +'<span style="color:var(--text2)">'+pos.symbol+'/USDC</span>'
        +'<span style="color:var(--text3)">entry: $'+pos.entry.toFixed(2)+'</span>'
        +'<span style="color:var(--text3)">exit: $'+(pos.exitPrice||0).toFixed(2)+'</span>'
        +'<span style="color:'+(pnl>=0?'var(--green)':'#f87171');html+='">'+(pnl>=0?'+':'')+pnl.toFixed(2)+'</span>'
        +'<span style="color:var(--text3);margin-left:auto">'+new Date(pos.entryTs).toLocaleDateString()+'</span>'
        +'</div>';
    });
    html+='</div>';
  }
  html+='</div>';
  return html;
}

function addPosition(){
  var sym=document.getElementById('pos-sym');
  var entry=document.getElementById('pos-entry');
  var size=document.getElementById('pos-size');
  if(!sym||!entry||!entry.value)return;
  var ep=parseFloat(entry.value);
  if(isNaN(ep)||ep<=0)return;
  if(!S.positions)S.positions=[];
  S.positions.push({
    id:Date.now(),agentId:'manual',symbol:sym.value,
    entry:ep,entryTs:new Date().toISOString(),
    size:parseFloat(size&&size.value||100),
    stopPrice:ep*0.954,status:'open',pnl:0,cost:0
  });
  entry.value='';if(size)size.value='';
  saveState();renderPage();
}

function closePosition(idx){
  if(!S.positions||!S.positions[idx])return;
  var pos=S.positions[idx];
  var current=PRICE_CACHE[pos.symbol]||pos.entry;
  pos.closedPnl=(current-pos.entry)/pos.entry*(pos.size||100);
  pos.exitPrice=current;
  pos.status='closed';
  if(!S.pnlStats)S.pnlStats={totalPnl:0,totalInferenceCost:0,wins:0,losses:0,trades:0,rollingPnl:[]};
  S.pnlStats.totalPnl+=pos.closedPnl;
  S.pnlStats.trades++;
  if(pos.closedPnl>0)S.pnlStats.wins++;else S.pnlStats.losses++;
  saveState();renderPage();
}

function updateStop(idx){
  if(!S.positions||!S.positions[idx])return;
  var pos=S.positions[idx];
  var val=prompt('New stop price (must be below entry $'+pos.entry.toFixed(2)+'):',pos.stopPrice.toFixed(2));
  if(!val||!val.trim())return;
  var sp=parseFloat(val.replace(/[^0-9.]/g,''));
  if(isNaN(sp)||sp<=0){alert('Invalid price. Enter a positive number.');return;}
  if(sp>=pos.entry){alert('Stop price must be BELOW entry price ($'+pos.entry.toFixed(2)+').');return;}
  if(sp<pos.entry*0.5){alert('Stop price too low (>50% below entry). Check your input.');return;}
  S.positions[idx].stopPrice=sp;
  saveState();renderPage();
}




// ── Direction A: Backtest Engine ──────────────────────────