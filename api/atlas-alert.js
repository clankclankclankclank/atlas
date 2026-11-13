const origin = 'https://clankclankclankclank.github.io';
const cooldownMs = 5 * 60_000;
let nextAlert = 0;

function discordWebhook() {
  try {
    const url = new URL(process.env.ATLAS_DISCORD_WEBHOOK);
    if (url.origin === 'https://discord.com' &&
        /^\/api\/webhooks\/\d+\/[\w-]+$/.test(url.pathname) &&
        !url.username && !url.password && !url.search && !url.hash) return url;
  } catch {}
}

export default async function handler(req,res) {
  res.setHeader('Vary','Origin');
  res.setHeader('Cache-Control','no-store');
  if (req.headers.origin !== origin) return res.status(403).end();
  res.setHeader('Access-Control-Allow-Origin',origin);
  if (req.method !== 'POST') return res.status(405).setHeader('Allow','POST').end();

  const webhook = discordWebhook();
  if (!webhook) return res.status(503).end();
  if (Date.now() < nextAlert) return res.status(204).end();
  nextAlert = Date.now() + cooldownMs;

  try {
    const result = await fetch(webhook,{
      method:'POST',
      redirect:'error',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        content:'Study Atlas reported a rejected sign-in.',
        allowed_mentions:{parse:[]}
      }),
      signal:AbortSignal.timeout(4000)
    });
    return res.status(result.ok?204:502).end();
  } catch {
    return res.status(502).end();
  }
}
