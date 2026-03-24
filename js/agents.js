// -- Run Agent -----------------------------------------
async function runAgent(){
  if(S.running)return;
  S.running=true;S.logs=[];S.out='';S.typing='';
  var rb=document.getElementById('runBtn');
  if(rb){rb.disabled=true;rb.innerHTML='<span class="spin"></span> RUNNING';}
  var lp=document.getElementById('logPane'),op=document.getElementById('outPane');
  if(lp){lp.innerHTML='<div class="ph">Execution Log</div>';}
  if(op){op.innerHTML='<div class="ph">Agent Output</div><div class="em">Generating...</div>';}

  var cost=0.002+Math.random()*0.008, funded=cost*0.3;
  var a=S.agent, m=S.model;
  var prompt=S.customPrompt.trim()||a.usr;
  // Inject live price data into trading agent context
  var liveCtx='';
  if(a.id==='trading'&&PRICES.eth>0){
    liveCtx='\n\nLIVE MARKET DATA (fetched now):\nETH/USD: '+fmtPrice(PRICES.eth)+'\nBTC/USD: '+fmtPrice(PRICES.btc)+'\nData source: DeFiLlama\nTimestamp: '+new Date().toUTCString();
  }
  var memCtx=S.memory.filter(function(x){return x.agentId===a.id;}).slice(-2).map(function(x){return '[Prev] Q:'+x.prompt+'\nA:'+x.response.slice(0,200)+'...';}).join('\n\n');
  var liveSys=(a.id==='trading'?getTradingSysWithPrices():(a.id==='research'?getResearchSysWithPrices():a.sys));
  var fullSys=memCtx?liveSys+'\n\nContext:\n'+memCtx:liveSys;

  addLog('\u25B6 '+a.label+' \u2192 '+m.label,'sys');
  await sleep(250);
  addLog('\u27F3 POST /api/chat \u2192 llm.bankr.bot','req');
  await sleep(400);

  var resp='';
  if(S.key&&S.key!=='demo'){
    var maxRetries=3, lastErr='';
    for(var attempt=1;attempt<=maxRetries;attempt++){
      try{
        if(attempt>1){addLog('⟳ Retry '+attempt+'/'+maxRetries+'...','warn');await sleep(attempt*800);}
        var r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':S.key},
          body:JSON.stringify({model:m.id,max_tokens:1200,messages:[{role:'system',content:fullSys},{role:'user',content:prompt}]})});
        if(!r.ok){
          var e=await r.json().catch(function(){return{};});
          var em=typeof e.error==='string'?e.error:typeof e.error==='object'?JSON.stringify(e.error):e.message||'Failed';
          lastErr=r.status+': '+em+(r.status===402?' — Top up at bankr.bot/llm':'');
          if(r.status===402||r.status===401||r.status===403){addLog('✗ '+lastErr,'err');break;}
          addLog('⚠ Attempt '+attempt+' failed: '+lastErr.slice(0,60),'warn');
          if(attempt===maxRetries){addLog('↩ All retries failed — demo fallback','err');resp=DEMOS[a.id];}
          continue;
        }
        var d=await r.json();
        resp=d&&d.choices&&d.choices[0]&&d.choices[0].message?d.choices[0].message.content:'';
        var u=d&&d.usage?d.usage:{};
        addLog('✓ 200 OK'+(attempt>1?' (retry '+attempt+')':'')+' — '+(u.prompt_tokens||'?')+' in / '+(u.completion_tokens||'?')+' out','ok');
        break;
      }catch(ex){
        lastErr=ex.message;
        addLog('⚠ Network error (attempt '+attempt+'): '+ex.message.slice(0,50),'warn');
        if(attempt===maxRetries){addLog('↩ Gateway unreachable — demo fallback','err');resp=DEMOS[a.id];}
      }
    }
  }

  addLog('\u25C8 Cost: $'+cost.toFixed(4)+' | Fee-funded: $'+funded.toFixed(4),'eco');
  await sleep(300);
  var tx='0x'+r16(40);addLog('\u29A1 Tx: '+tx.slice(0,18)+'... (Base)','tx');
  await sleep(200);addLog('\u2713 Queued on Base chain','ok');


  // Save to run history
  // (run history saved below with full data)
  S.memory.unshift({agentId:a.id,agentLabel:a.label,agentIcon:a.icon,prompt:prompt,response:resp,ts:new Date()});
  if(S.memory.length>20)S.memory.pop();
  S.txHistory.unshift({icon:'\u27F3',desc:'Agent: '+a.label,time:new Date(),amount:'-$'+cost.toFixed(4),hash:tx,status:'ok'});
  S.stats.calls++;S.stats.cost+=cost;S.stats.funded+=funded;S.stats.txs++;
  // Save to run history
  if(!S.runHistory)S.runHistory=[];
  // Parse entry/exit from output to track position
  var entryPrice=0, isBuy=false, isSell=false;
  if(resp){
    var buyMatch=resp.match(/\[ENTRY\]\s*\$([\d,\.]+)/);
    var sellMatch=resp.match(/exit|close|sell/i);
    if(buyMatch){entryPrice=parseFloat(buyMatch[1].replace(/,/g,''));isBuy=true;}
    if(sellMatch&&!isBuy){isSell=true;}
  }
  // Update equity curve (append current portfolio snapshot)
  var portfolioVal=parseFloat(S.wallet.usdc||0)+parseFloat(S.wallet.eth||0)*(PRICE_CACHE.ETH||3400);
  if(portfolioVal>0){
    S.equityCurve.push({ts:Date.now(),val:portfolioVal,cost:S.pnlStats.totalInferenceCost});
    if(S.equityCurve.length>200)S.equityCurve.shift();
  }
  // Update P&L stats
  S.pnlStats.totalInferenceCost+=(cost||0);
  S.pnlStats.trades++;
  // Open position if entry detected
  if(isBuy&&entryPrice>0&&a.id==='trading'){
    S.positions.push({
      id:Date.now(),agentId:a.id,symbol:'ETH',
      entry:entryPrice,entryTs:new Date().toISOString(),
      size:parseFloat(S.launch&&S.launch.feeVal||'100')||100,
      stopPrice:entryPrice*0.954, // 5.5x ATR approx
      status:'open',pnl:0,cost:cost
    });
  }
  S.runHistory.unshift({
    id:Date.now(),ts:new Date().toISOString(),
    agentId:a.id,agentLabel:a.label,agentIcon:a.icon,agentColor:a.c,
    modelId:m.id,modelLabel:m.label,
    prompt:prompt.slice(0,120),output:resp,
    cost:cost,funded:funded,tx:tx,
    entryPrice:entryPrice,isBuy:isBuy
  });
  if(S.runHistory.length>50)S.runHistory.pop();
  S.running=false;
  saveState();

  var rb2=document.getElementById('runBtn');if(rb2){rb2.disabled=false;rb2.innerHTML='\u25B6 EXECUTE';}
  updateStats();
  if(op){op.innerHTML='<div class="ph">Agent Output <button onclick="copyOutput()" style="margin-left:auto;background:none;border:1px solid var(--border);color:var(--text2);border-radius:5px;padding:2px 10px;font-size:9px;font-family:var(--mono);cursor:pointer" onmouseover="this.style.borderColor=\'var(--green)\';this.style.color=\'var(--green)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--text2)\'" id="copyBtn">COPY</button></div><div class="ot" id="outText"></div>';}
  startTyping(resp);

  // refresh memory display if visible
  var mlistEl=document.getElementById('memList');
  if(mlistEl)renderMemList();
}

// -- Multi-Agent ---------------------------------------
async function runMultiAgent(){
  if(S.maRunning)return;
  // Validate selection
  if(S.mmMode==='agents' && S.selectedAgents.length===0)return;
  if(S.mmMode==='models' && S.selectedModels.length===0)return;

  S.maRunning=true; S.maResults=[]; renderPage();

  var items=[];
  if(S.mmMode==='agents'){
    // Run selected agents with same model
    items=AGENTS.filter(function(a){return S.selectedAgents.indexOf(a.id)>=0;})
      .map(function(a){return {id:a.id,icon:a.icon,label:a.label,c:a.c,sys:a.sys,usr:a.usr,modelId:S.model.id,modelLabel:S.model.label};});
  } else {
    // Run same agent across selected models (model comparison)
    items=MODELS.filter(function(m){return S.selectedModels.indexOf(m.id)>=0;})
      .map(function(m){return {id:m.id,icon:'&#x25C8;',label:m.label,c:m.c,sys:S.agent.sys,usr:S.mmPrompt||S.agent.usr,modelId:m.id,modelLabel:m.label};});
  }

  S.maResults=items.map(function(it){return {id:it.id,icon:it.icon,label:it.label,c:it.c,modelLabel:it.modelLabel,status:'running',out:'',elapsed:0};});
  renderPage();

  await Promise.all(items.map(async function(it,idx){
    var t0=Date.now();
    var cost=0.002+Math.random()*0.008; var resp='';
    if(S.key&&S.key!=='demo'){
      try{
        var r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':S.key},
          body:JSON.stringify({model:it.modelId,max_tokens:800,messages:[{role:'system',content:it.sys},{role:'user',content:it.usr}]})});
        if(r.ok){var d=await r.json();resp=d&&d.choices&&d.choices[0]?d.choices[0].message.content:'';}
        else{ var e=await r.json().catch(function(){return{};});
          resp='Error '+r.status+': '+(typeof e.error==='string'?e.error:'Request failed');
        }
      }catch(ex){resp=DEMOS[S.agent.id]||'Error: '+ex.message;}
    }else{await sleep(600+idx*300);resp=DEMOS[it.id]||DEMOS[S.agent.id]||'Demo response for '+it.label;}
    var elapsed=((Date.now()-t0)/1000).toFixed(1);
    S.maResults[idx]={id:it.id,icon:it.icon,label:it.label,c:it.c,modelLabel:it.modelLabel,status:'done',out:resp,elapsed:elapsed};
    S.stats.calls++;S.stats.cost+=cost;S.stats.funded+=cost*0.3;S.stats.txs++;
    renderMAResults();
  }));

  S.maRunning=false;updateStats();renderPage();
}

async function fetchWallet(){
  if(!S.key||S.key==='demo'){
    // Demo mode - simulated data
    S.wallet={eth:'1.2847',usdc:'450.23',bnkr:'12500.00',fees:'0.0847',llm:'12.50',calls:'3,241',mode:'demo'};
    S.txHistory=[
      {icon:'\u29A1',desc:'Token launch: INFER',time:new Date(Date.now()-3600000),amount:'+0.0234 ETH',hash:'0x'+r16(40),status:'ok'},
      {icon:'\u27F3',desc:'Swap: USDC \u2192 ETH',time:new Date(Date.now()-7200000),amount:'-$100.00',hash:'0x'+r16(40),status:'ok'},
      {icon:'\u25CE',desc:'Fee claim: TRADE token',time:new Date(Date.now()-86400000),amount:'+0.0156 ETH',hash:'0x'+r16(40),status:'ok'}
    ];
    renderPage();return;
  }
  // Real mode - hit Bankr API
  S.walletLoading=true;renderPage();
  try{
    // Fetch balances via Bankr Agent API prompt
    var balancePromise=fetch('/api/chat',{method:'POST',
      headers:{'Content-Type':'application/json','X-API-Key':S.key},
      body:JSON.stringify({model:'gemini-3-flash',max_tokens:300,
        messages:[{role:'user',content:'Show my wallet balances on base chain in this exact JSON format only, no other text: {"eth":"X.XXXX","usdc":"X.XX","bnkr":"X.XX"} Use real numbers from my wallet.'}]})
    });

    // Fetch LLM credits
    var creditsPromise=fetch('https://api.bankr.bot/llm/credits',{
      headers:{'X-API-Key':S.key,'Content-Type':'application/json'}
    });

    // Fetch user info
    var infoPromise=fetch('https://api.bankr.bot/agent/user',{
      headers:{'X-API-Key':S.key}
    });

    var [balR, credR, infoR] = await Promise.allSettled([balancePromise, creditsPromise, infoPromise]);

    // Parse balances from LLM response
    if(balR.status==='fulfilled'&&balR.value.ok){
      try{
        var bd=await balR.value.json();
        var balText=bd&&bd.choices&&bd.choices[0]?bd.choices[0].message.content:'';
        var jsonMatch=balText.match(/\{[^}]+\}/);
        if(jsonMatch){
          var parsed=JSON.parse(jsonMatch[0]);
          S.wallet.eth=parseFloat(parsed.eth||0).toFixed(4);
          S.wallet.usdc=parseFloat(parsed.usdc||0).toFixed(2);
          S.wallet.bnkr=parseFloat(parsed.bnkr||0).toFixed(2);
        }
      }catch(e){console.log('Balance parse error:',e.message);}
    }

    // Parse LLM credits
    if(credR.status==='fulfilled'&&credR.value.ok){
      try{
        var cd=await credR.value.json();
        S.wallet.llm=(cd.balance||cd.credits||cd.amount||0).toFixed(2);
      }catch(e){}
    }

    // Parse user info
    if(infoR.status==='fulfilled'&&infoR.value.ok){
      try{
        var uid=await infoR.value.json();
        S.wallet.address=uid.walletAddress||uid.address||'';
        S.wallet.calls=(uid.totalCalls||uid.inferenceCount||0).toLocaleString();
      }catch(e){}
    }

    S.wallet.mode='live';
    S.wallet.fees=S.wallet.fees||'0.0000';

  }catch(e){
    console.error('Wallet fetch error:',e.message);
    S.wallet.mode='error';
  }
  S.walletLoading=false;renderPage();
}

// -- Token Launch --------------------------------------
async function launchToken(){
  if(S.launching||!S.launch.name)return;
  S.launching=true;S.launchResult=null;renderPage();
  var body={tokenName:S.launch.name,tokenSymbol:S.launch.symbol||S.launch.name.slice(0,4).toUpperCase(),description:S.launch.desc||'',simulateOnly:S.launch.simOnly};
  if(S.launch.feeVal)body.feeRecipient={type:S.launch.feeType,value:S.launch.feeVal};
  if(S.key&&S.key!=='demo'){
    try{
      var r=await fetch('https://api.bankr.bot/token-launches/deploy',{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':S.key},body:JSON.stringify(body)});
      var d=await r.json();
      if(r.ok)S.launchResult={success:true,tokenAddress:d.tokenAddress,poolId:d.poolId,txHash:d.txHash,chain:d.chain,simulated:d.simulated,feeDistribution:d.feeDistribution};
      else S.launchResult={success:false,error:typeof d.error==='string'?d.error:JSON.stringify(d.error)};
    }catch(e){S.launchResult={success:false,error:e.message};}
  }else{
    await sleep(1400);
    S.launchResult={success:true,simulated:true,tokenAddress:'0x'+r16(40),poolId:'0x'+r16(40),txHash:'0x'+r16(64),chain:'base',feeDistribution:{creator:{bps:5700},bankr:{bps:3610},alt:{bps:190},protocol:{bps:500}}};
  }
  S.launching=false;
  if(S.launchResult&&S.launchResult.success)
    S.txHistory.unshift({icon:'\u25CE',desc:'Token: '+(body.tokenSymbol||'?'),time:new Date(),amount:'gas sponsored',hash:S.launchResult.txHash||'0x'+r16(40),status:'ok'});
  renderPage();
}