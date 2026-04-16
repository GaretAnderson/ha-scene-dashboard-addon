const express = require('express');
const path = require('path');

// HA Supervisor provides these environment variables inside an add-on
const HA_BASE = 'http://supervisor/core';
const token = process.env.SUPERVISOR_TOKEN;
const port = process.env.PORT || 3000;

if (!token) {
  console.error('ERROR: SUPERVISOR_TOKEN not set. This add-on must run inside Home Assistant.');
  process.exit(1);
}

const app = express();
app.use(express.json());

// Serve dashboard at root (handles ingress base path)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Proxy /api/* to HA Supervisor API
app.all('/api/*', async (req, res) => {
  const haUrl = `${HA_BASE}/api${req.path.replace(/^\/api/, '')}`;

  const fetchOptions = {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (!['GET', 'HEAD'].includes(req.method)) {
    fetchOptions.body = JSON.stringify(req.body);
  }

  try {
    const haRes = await fetch(haUrl, fetchOptions);
    const data = await haRes.text();

    res.status(haRes.status);
    const ct = haRes.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.send(data);
  } catch (err) {
    console.error(`Proxy error for ${haUrl}: ${err.message}`);
    res.status(502).json({ error: 'Proxy error', message: err.message });
  }
});

// 404 for everything else
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(port, () => {
  console.log(`HA Scene Dashboard add-on running on port ${port}`);
});

process.on('SIGINT', () => { server.close(); process.exit(0); });
process.on('SIGTERM', () => { server.close(); process.exit(0); });
