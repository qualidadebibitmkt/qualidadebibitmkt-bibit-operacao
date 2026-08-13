// api/clickup.js — Proxy ClickUp · Bibit Operação
// Encaminha apenas as rotas necessárias ao dashboard, com o token no servidor.
// Env obrigatória no Vercel: CLICKUP_TOKEN (token da conta André Guedes, o mesmo dos demais projetos).

const ALLOW = [
  /^list\/901712531318\/task/,   // Growth (clientes)
  /^list\/901713519081\/task/,   // Cross-Sell (vendas)
  /^list\/901713333681\/task/,   // CSAT - Envios (CSAT + NPS)
  /^list\/901713545639\/task/,   // Ranking (produtividade / up-down mensais)
  /^task\/86e1fwefa/             // Card 2026 (métricas gerais)
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.CLICKUP_TOKEN || '';

  // Diagnóstico: /api/clickup?diag=1
  if (req.query && req.query.diag) {
    return res.status(200).json({ CLICKUP_TOKEN: token ? 'OK' : 'VAZIO' });
  }

  const path = (req.query && req.query.path) || '';
  if (!ALLOW.some((re) => re.test(path))) {
    return res.status(400).json({ error: 'path não permitido', path });
  }
  if (!token) {
    return res.status(500).json({ error: 'CLICKUP_TOKEN ausente no ambiente Vercel' });
  }

  try {
    const r = await fetch('https://api.clickup.com/api/v2/' + path, {
      headers: { Authorization: token, 'Content-Type': 'application/json' }
    });
    const body = await r.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(r.status).json(body);
  } catch (err) {
    return res.status(502).json({ error: 'Falha ao consultar o ClickUp', detail: String(err) });
  }
};
