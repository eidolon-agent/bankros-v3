// ── Markdown Renderer ────────────────────────────────────
function renderMd(text){
  if(!text)return '';
  var h=text
    // code blocks
    .replace(/```([\s\S]*?)```/g,function(_,c){return '<pre style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:10px 12px;overflow-x:auto;font-size:10px;line-height:1.7;margin:8px 0">'+esc(c.trim())+'</pre>';})
    // inline code
    .replace(/`([^`]+)`/g,function(_,c){return '<code style="background:var(--bg3);border:1px solid var(--border);border-radius:3px;padding:1px 5px;font-size:10px">'+esc(c)+'</code>';})
    // h2/h3
    .replace(/^### (.+)$/gm,'<div style="font-family:var(--display);font-size:16px;letter-spacing:.04em;color:var(--text);margin:14px 0 6px">$1</div>')
    .replace(/^## (.+)$/gm,'<div style="font-family:var(--display);font-size:19px;letter-spacing:.04em;color:var(--green);margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--border)">$1</div>')
    .replace(/^# (.+)$/gm,'<div style="font-family:var(--display);font-size:22px;letter-spacing:.04em;color:var(--text);margin:16px 0 8px">$1</div>')
    // bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,'<strong style="color:var(--text)">$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    // tables (simple)
    .replace(/\|(.+)\|/g,function(row){
      var cells=row.split('|').filter(function(c){return c.trim();});
      var isHeader=false;
      return '<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid var(--border3,#0a1828)">'
        +cells.map(function(c){return '<span style="flex:1;font-size:11px;color:var(--text2)">'+c.trim()+'</span>';}).join('')
        +'</div>';
    })
    // horizontal rule
    .replace(/^---+$/gm,'<hr style="border:none;border-top:1px solid var(--border);margin:12px 0"/>')
    // bullet lists
    .replace(/^(\s*[-*+] .+)$/gm,function(_,item){
      var indent=item.match(/^\s*/)[0].length;
      var text2=item.replace(/^\s*[-*+] /,'');
      return '<div style="display:flex;gap:8px;padding:2px 0;padding-left:'+(indent*8)+'px"><span style="color:var(--green);flex-shrink:0">&#x25AA;</span><span style="font-size:11px;color:var(--text2)">'+text2+'</span></div>';
    })
    // numbered lists
    .replace(/^(\d+)\. (.+)$/gm,'<div style="display:flex;gap:8px;padding:2px 0"><span style="color:var(--blue);flex-shrink:0;min-width:18px">$1.</span><span style="font-size:11px;color:var(--text2)">$2</span></div>')
    // [BRACKET] labels — highlight signal/status words
    .replace(/\[([A-Z][A-Z\s/\-]{0,20})\]/g,'<span style="color:var(--green);font-family:var(--display);font-size:12px;letter-spacing:.05em">[$1]</span>')
    // newlines → breaks (after all block elements)
    .replace(/\n/g,'<br>');
  // Fix double-breaks after block elements
  h=h.replace(/(<\/div>|<\/pre>|<hr[^>]*\/>)<br>/g,'$1');
  return '<div style="font-size:11px;line-height:1.9;color:var(--text2)">'+h+'</div>';
}

// ── Price Ticker ─────────────────────────────────────────
function buildPriceTicker(){
  if(!PRICE_CACHE.ETH)return '';
  return '<div id="priceTicker" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:10px;color:var(--text2);margin-bottom:12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:8px 14px">'
    +'<span style="color:var(--text3);letter-spacing:.15em;font-size:9px">LIVE</span>'
    +'<span>ETH <b style="color:var(--blue)">$'+PRICE_CACHE.ETH.toFixed(2)+'</b></span>'
    +'<span>BTC <b style="color:var(--orange)">$'+Math.round(PRICE_CACHE.BTC).toLocaleString()+'</b></span>'
    +'<span>AERO <b style="color:var(--purple)">$'+PRICE_CACHE.AERO.toFixed(3)+'</b></span>'
    +'<span>MORPHO <b style="color:var(--teal,#06b6d4)">$'+PRICE_CACHE.MORPHO.toFixed(3)+'</b></span>'
    +'<span style="color:var(--text3);font-size:9px;margin-left:auto">'+new Date(PRICE_CACHE.ts).toLocaleTimeString()+'</span>'
    +'</div>';
}

// ── Page Builders ─────────────────────────────────────────
function renderPage(){
  var a=S.agent, m=S.model, html='';

  // Header
  html+='<div class="hdr">'
    +'<div class="eyebrow"><div class="pulse"></div><span class="e-txt">bankrOS &mdash; Autonomous Agent OS &mdash; <a href="https://x.com/eidolonagent" target="_blank" style="color:var(--green);text-decoration:none">@eidolonagent</a></span></div>'
    +'<div class="title">bankrOS</div>'
    +'<div class="sub"><span>20+ Models</span><span class="sdot"></span><span>Onchain Execution</span><span class="sdot"></span><span>Self-Sustaining Economics</span><span class="sdot"></span><span>Base Chain</span><span class="sdot"></span><span style="color:var(--green)">&#x25CF; AUTONOMOUS</span></div>'
    +'</div>';

  // Auth
  if(!S.key){
    html+='<div class="card"><div class="ctitle">Authentication</div>'
      +'<div class="irow"><input class="inp" id="ki" placeholder="bk_your_bankr_api_key" autocomplete="off" style="flex:1;min-width:200px"/>'
      +'<button class="btn btn-g" onclick="connectKey()">CONNECT</button>'
      +'<button class="btn btn-o" onclick="demoMode()">DEMO</button></div>'
      +'<div class="note">Get your key at bankr.bot/api &middot; No key needed &mdash; demo mode works instantly</div></div>';
  } else {
    html+='<div class="cbar"><div class="cdot"></div>'
      +'<span class="ctxt">'+(S.key==='demo'?'Demo mode &mdash; real API calls disabled':'Connected: bk_&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;'+esc(S.key.slice(-4)))+'</span>'
      +'<button class="disc" onclick="disconnect()">disconnect</button></div>';
  }

  // Price ticker
  html += buildPriceTicker();

  // Nav
  var pages=[['agents','&#x2B21; Agents'],['wallet','&#x25C8; Wallet'],['launch','&#x25CE; Launch'],['calculator','&#x25C9; Fee Calc'],['multiagent','Multi-Agent'],['economy','&#x27F3; Economics'],['status','&#x25CF; Status'],['history','&#x1F4DC; History'],['signals','&#x25C6; Signals'],['pnl','&#x24C5; P&amp;L'],['equity','&#x1F4C8; Equity'],['positions','&#x25A3; Positions'],['backtest','&#x29BE; Backtest'],['alerts','&#x1F514; Alerts'],['strategies','&#x2B25; Strategies'],['tuner','&#x29B7; Tuner'],['research','&#x27F3; Auto-Research']];
  html+='<nav class="nav">';
  pages.forEach(function(p){html+='<button class="ntab'+(S.page===p[0]?' active':'')+'" onclick="setPage('+pages.indexOf(p)+')">'+p[1]+'</button>';});
  html+='</nav>';

  if(S.page==='agents')    html+=buildAgentsPage(a,m);
  if(S.page==='wallet')    html+=buildWalletPage();
  if(S.page==='launch')    html+=buildLaunchPage();
  if(S.page==='calculator')html+=buildCalcPage();
  if(S.page==='multiagent')html+=buildMAPage();
  if(S.page==='economy')   html+=buildEconPage();
  if(S.page==='status')    html+=buildStatusPage();
  if(S.page==='history')   html+=buildHistoryPage();
  if(S.page==='custom')    html+=buildCustomAgentPage();
  if(S.page==='polymarket')html+=buildPolymarketPage();
  if(S.page==='webhook')   html+=buildWebhookPage();
  if(S.page==='signals')   html+=buildSignalPage();
  if(S.page==='pnl')       html+=buildPnlPage();
  if(S.page==='equity')    html+=buildEquityPage();
  if(S.page==='positions') html+=buildPositionsPage();
  if(S.page==='backtest')  html+=buildBacktestPage();
  if(S.page==='alerts')    html+=buildAlertsPage();
  if(S.page==='strategies')html+=buildStrategiesPage();
  if(S.page==='tuner')     html+=buildTunerPage();
  if(S.page==='research')  html+=buildAutoResearchPage();

  // Footer
  html+='<div class="foot"><span>bankrOS &mdash; <a href="https://x.com/eidolonagent" target="_blank" style="color:var(--green);text-decoration:none">@eidolonagent</a></span>'
    +'<div class="fl2">'
    +'<a href="https://x.com/eidolonagent" target="_blank">&#x1D54F; @eidolonagent</a>'
    +'<a href="https://github.com/eidolon-agent/bankrOS" target="_blank">GitHub</a>'
    +'<a href="https://bankr-agent-os.vercel.app" target="_blank">bankr-agent-os.vercel.app</a>'
    +'<a href="https://docs.bankr.bot" target="_blank">Docs</a>'
    +'</div></div>';

  document.getElementById('root').innerHTML=html;

  // Restore dynamic elements
  var lp=document.getElementById('logPane');
  if(lp){S.logs.forEach(function(l){var d=document.createElement('div');d.className='ll';var ts=document.createElement('span');ts.className='lt';ts.textContent=l.t+' ';var ms=document.createElement('span');ms.style.color=l.c;ms.textContent=l.msg;d.appendChild(ts);d.appendChild(ms);lp.appendChild(d);});lp.scrollTop=lp.scrollHeight;}
  if(S.out){var ot=document.getElementById('outText');if(ot){if(S.typing===S.out)ot.innerHTML=renderMd(S.out);else ot.textContent=S.typing;}}
  var sl=document.getElementById('csl');if(sl){sl.style.setProperty('--pct',(sl.value/1000000*100)+'%');sl.oninput=function(){onSlider(this);};}
  renderMemList();renderMAResults();
}

// setPage handled in event handlers below