// Simple Mercado Pago HTTPS proxy (Node.js + Express)
// Deploy in Render/Railway/Vercel (Serverless) ou seu VPS.
// USO: defina no recurso: Config.ProxyBaseURL = 'https://SEU_PROXY/mp'
// Segurança mínima: exige header X-Proxy-Token igual ao token abaixo.

const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json({ limit: '1mb' }));

const UPSTREAM = 'https://api.mercadopago.com';
const REQUIRED_TOKEN = process.env.PROXY_TOKEN || 'troque-este-token';

app.use('/mp', async (req, res) => {
  if (req.headers['x-proxy-token'] !== REQUIRED_TOKEN) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const path = req.url.replace(/^\/mp/, '') || '/';
  const url = UPSTREAM + path;
  try {
    const mp = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': req.headers['authorization'] || '',
        'Content-Type': 'application/json',
        'x-integrator-id': req.headers['x-integrator-id'] || '',
        'User-Agent': 'tks_pix/1.2 (proxy)'
      },
      body: ['POST','PUT','PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });
    const body = await mp.text();
    res.status(mp.status);
    for (const [k, v] of mp.headers.entries()) res.setHeader(k, v);
    res.send(body);
  } catch (e) {
    res.status(502).json({ error: 'bad_gateway', detail: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy up on :' + PORT));
