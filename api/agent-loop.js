// bankrOS Autonomous Agent Loop
// Triggered by Vercel Cron every 5 minutes
// Runs all active agents, executes onchain actions, self-funds via token fees

const BANKR_AGENT_API = 'https://api.bankr.bot/agent/prompt';
const BANKR_LLM_API   = 'https://llm.bankr.bot/v1/chat/completions';

// In-memory state (persists within a function instance)
// For production: replace with Vercel KV storage
const agentState = {
  lastRun: null,
  totalRuns: 0,
  lastActions: [],
};

// Autonomous tasks the agent runs on each cycle
const AUTONOMOUS_TASKS = [
  {
    id: 'market_monitor',
    name: 'Market Monitor',
    model: 'claude-sonnet-4.6',
    interval: 1, // every cycle
    prompt: 'Briefly analyze current ETH/USDC price action on Base. Is now a good time to DCA? Answer in 2 sentences max. If yes, output: ACTION:DCA:$10',
    onAction: async (response, apiKey) => {
      if (response.includes('ACTION:DCA:')) {
        const amount = response.match(/ACTION:DCA:\$(\d+)/)?.[1] || '10';
        return await bankrPrompt(`buy $${amount} of ETH on base`, apiKey);
      }
      return null;
    }
  },
  {
    id: 'fee_claimer',
    name: 'Fee Claimer',
    model: 'gemini-3-flash',
    interval: 12, // every 12 cycles = 1 hour
    prompt: 'Should I claim my token fees now? Consider gas costs vs accumulated fees. Answer: YES or NO with one reason.',
    onAction: async (response, apiKey) => {
      if (response.toUpperCase().includes('YES')) {
        return await bankrPrompt('claim my token fees', apiKey);
      }
      return null;
    }
  },
  {
    id: 'health_check',
    name: 'Health Check',
    model: 'gemini-3-flash',
    interval: 3, // every 15 minutes
    prompt: 'Report wallet health in one line: ETH price, USDC balance status, any urgent actions needed.',
    onAction: async () => null // monitor only, no action
  },
  {
    id: 'inference_fund',
    name: 'Inference Funder',
    model: 'claude-sonnet-4.6',
    interval: 6, // every 30 minutes
    prompt: 'Check if LLM credit balance is sufficient. If fees have accumulated enough, top up LLM credits. Answer: TOP_UP or SUFFICIENT.',
    onAction: async (response, apiKey) => {
      if (response.includes('TOP_UP')) {
        return await bankrPrompt('add $5 USDC to my LLM gateway credits', apiKey);
      }
      return null;
    }
  }
];

async function llmCall(model, prompt, apiKey) {
  const res = await fetch(BANKR_LLM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify({
      model,
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function bankrPrompt(prompt, apiKey) {
  const res = await fetch(BANKR_AGENT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error(`Agent API error ${res.status}`);
  const data = await res.json();
  return data;
}

export default async function handler(req, res) {
  // Verify this is a legitimate cron request from Vercel
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow manual trigger with API key for testing
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const apiKey = process.env.BANKR_API_KEY || req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(503).json({ error: 'Agent service unavailable.' });
  }

  const startTime = Date.now();
  agentState.totalRuns++;
  agentState.lastRun = new Date().toISOString();

  const results = [];
  const errors  = [];

  // Run each autonomous task
  for (const task of AUTONOMOUS_TASKS) {
    // Check if this task should run this cycle
    if (agentState.totalRuns % task.interval !== 0 && agentState.totalRuns !== 1) {
      results.push({ id: task.id, status: 'skipped', reason: 'interval not reached' });
      continue;
    }

    try {
      console.log(`[bankrOS] Running task: ${task.name}`);

      // Timeout each task at 25s to avoid function timeout
      const response = await Promise.race([
        llmCall(task.model, task.prompt, apiKey),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Task timeout')), 25000))
      ]);

      let actionResult = null;
      try {
        if (task.onAction) {
          actionResult = await task.onAction(response, apiKey);
        }
      } catch (actionErr) {
        console.error(`[bankrOS] Action failed for ${task.id}:`, actionErr.message);
        // Action failure is non-fatal — still record the response
      }

      results.push({
        id:     task.id,
        name:   task.name,
        status: 'ok',
        action: actionResult ? 'executed' : 'none',
        model:  task.model,
      });

      agentState.lastActions.unshift({
        ts:     new Date().toISOString(),
        task:   task.name,
        action: actionResult ? 'executed' : 'monitored',
      });

    } catch (err) {
      console.error(`[bankrOS] Task ${task.id} failed:`, err.message);
      errors.push({ id: task.id, error: 'Task failed' }); // generic to client
      results.push({ id: task.id, name: task.name, status: 'error' });
    }
  }

  // Keep last 20 actions
  agentState.lastActions = agentState.lastActions.slice(0, 20);

  const duration = Date.now() - startTime;
  console.log(`[bankrOS] Cycle ${agentState.totalRuns} complete in ${duration}ms`);

  return res.status(200).json({
    status:    'ok',
    cycle:     agentState.totalRuns,
    timestamp: agentState.lastRun,
    duration:  `${duration}ms`,
    results,
    errors,
    next:      '5 minutes',
  });
}
