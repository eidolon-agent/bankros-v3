const rateLimitMap = new Map();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60000;

const ALLOWED_MODELS = new Set([
  'claude-opus-4.6','claude-sonnet-4.6','claude-haiku-4.5-20251001',
  'gemini-3-pro','gemini-3-flash','gpt-5.2','kimi-k2.5','qwen3-coder',
]);

function getRateKey(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) { rateLimitMap.set(ip, { count: 1, start: now }); return true; }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return true;
}

function sanitizeBody(body) {
  const { model, messages, max_tokens } = body || {};
  if (!model || typeof model !== 'string') throw new Error('Invalid model');
  if (!ALLOWED_MODELS.has(model)) throw new Error('Model not permitted');
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20)
    throw new Error('Invalid messages array');
  for (const m of messages) {
    if (!['user','assistant','system'].includes(m?.role)) throw new Error('Invalid role');
    if (typeof m.content !== 'string' || m.content.length > 8000) throw new Error('Invalid content');
  }
  return { model, messages, max_tokens: Math.min(max_tokens || 1200, 2000) };
}

export default async function handler(req, res) {
  // Strict CORS — same origin only, not wildcard
  const origin = req.headers['origin'] || '';
  const host = req.headers['host'] || '';
  const isAllowed = origin.includes(host.split(':')[0]) ||
    origin.includes('vercel.app') || origin.includes('localhost');
  if (isAllowed) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit by IP
  if (!checkRateLimit(getRateKey(req)))
    return res.status(429).json({ error: 'Too many requests. Wait 60s.' });

  // Validate API key — must be bk_ prefixed
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('bk_') || apiKey.length < 10)
    return res.status(400).json({ error: 'Invalid API key format' });

  // Sanitize and whitelist request body
  let safeBody;
  try { safeBody = sanitizeBody(req.body); }
  catch (err) { return res.status(400).json({ error: err.message }); }

  try {
    const upstream = await fetch('https://llm.bankr.bot/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(safeBody),
    });
    const data = await upstream.json();
    // Return only safe fields — strip any internal metadata
    return res.status(upstream.status).json({
      id: data.id,
      model: data.model,
      choices: data.choices,
      usage: data.usage,
    });
  } catch (err) {
    console.error('[proxy error]', err.message); // server-side only
    return res.status(502).json({ error: 'Gateway error. Please try again.' });
  }
}
