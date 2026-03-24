// Live price data — fetched from DeFiLlama
var PRICE_CACHE={};
var PRICE_LOADING=false;




// Inject live prices into trading agent system prompt
function getTradingSysWithPrices(){
  var base=S.agent.sys;
  if(S.agent.id!=='trading'||!PRICE_CACHE.ETH)return base;
  var priceCtx='\n\nLIVE MARKET DATA (fetched just now):\n'+
    'ETH price: $'+PRICE_CACHE.ETH.toFixed(2)+'\n'+
    'BTC price: $'+Math.round(PRICE_CACHE.BTC).toLocaleString()+'\n'+
    'USDC peg: $'+PRICE_CACHE.USDC.toFixed(4)+'\n'+
    'AERO price: $'+PRICE_CACHE.AERO.toFixed(4)+'\n'+
    'Data timestamp: '+new Date(PRICE_CACHE.ts).toISOString()+'\n'+
    'Use these REAL prices in your analysis. Do not use placeholder prices.';
  return base+priceCtx;
}

// Inject live prices into research prompt
function getResearchSysWithPrices(){
  var base=S.agent.sys;
  if(S.agent.id!=='research'||!PRICE_CACHE.ETH)return base;
  var priceCtx='\n\nLIVE DEFI DATA (fetched just now):\n'+
    'ETH price: $'+PRICE_CACHE.ETH.toFixed(2)+'\n'+
    'AERO price: $'+PRICE_CACHE.AERO.toFixed(4)+'\n'+
    'MORPHO price: $'+PRICE_CACHE.MORPHO.toFixed(4)+'\n'+
    'COMP price: $'+PRICE_CACHE.COMP.toFixed(4)+'\n'+
    'Use these real prices for TVL calculations and yield analysis.';
  return base+priceCtx;
}

// Auto-refresh prices every 60s
setInterval(function(){
  if(PRICE_CACHE.ts&&Date.now()-PRICE_CACHE.ts<60000)return;
  fetchPrices();
},30000);


// -- Live Price Data ------------------------------------------

async function fetchPrices(){
  if(PRICE_LOADING)return;
  PRICE_LOADING=true;
  try{
    // DeFiLlama prices API — free, no API key, CORS-friendly
    var r=await fetch('https://coins.llama.fi/prices/current/coingecko:ethereum,coingecko:bitcoin,coingecko:usd-coin,coingecko:aerodrome-finance,coingecko:morpho-protocol,coingecko:compound-governance-token',{
      headers:{'Accept':'application/json'}
    });
    if(!r.ok)throw new Error('Price fetch failed');
    var d=await r.json();
    var coins=d.coins||{};
    var newEth=(coins['coingecko:ethereum']||{}).price||0;
    if(!PRICE_CACHE.ethHistory)PRICE_CACHE.ethHistory=[];
    if(newEth>0){PRICE_CACHE.ethHistory.push(newEth);if(PRICE_CACHE.ethHistory.length>200)PRICE_CACHE.ethHistory.shift();}
    PRICE_CACHE={
      ethHistory:PRICE_CACHE.ethHistory,
      ETH:  newEth,
      BTC:  (coins['coingecko:bitcoin']||{}).price||0,
      USDC: (coins['coingecko:usd-coin']||{}).price||1,
      AERO: (coins['coingecko:aerodrome-finance']||{}).price||0,
      COMP: (coins['coingecko:compound-governance-token']||{}).price||0,
      MORPHO:(coins['coingecko:morpho-protocol']||{}).price||0,
      ts: Date.now(),
    };
    // Update price ticker if visible
    updatePriceTicker();
  }catch(e){
    // Silently fail — prices are enhancement not requirement
  }
  PRICE_LOADING=false;
}

function updatePriceTicker(){
  var el=document.getElementById('priceTicker');
  if(!el||!PRICE_CACHE.ETH)return;
  el.innerHTML=
    '<span>ETH <b style="color:var(--green)">$'+PRICE_CACHE.ETH.toFixed(2)+'</b></span>'+
    '<span class="sdot"></span>'+
    '<span>BTC <b style="color:var(--orange)">$'+Math.round(PRICE_CACHE.BTC).toLocaleString()+'</b></span>'+
    '<span class="sdot"></span>'+
    '<span>AERO <b style="color:var(--purple)">$'+PRICE_CACHE.AERO.toFixed(3)+'</b></span>'+
    '<span class="sdot"></span>'+
    '<span style="color:var(--text3);font-size:9px">'+new Date(PRICE_CACHE.ts).toLocaleTimeString()+'</span>';
}

fetchPrices();
loadState();
fetchWallet();
startAlertMonitor();
renderPage();