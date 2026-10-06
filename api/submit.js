// Forwards the form to the n8n webhook. The webhook URL stays server-side.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return res.status(500).json({ error: 'N8N_WEBHOOK_URL is not set' });

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(55000)
    });
    const text = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'Upstream request failed' });
  }
};
