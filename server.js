const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

// 1. Habilitar CORS para qualquer origem
app.use(cors());

// 2. Parse de JSON no body
app.use(express.json());

// Endpoint para listar Customer IDs
app.post('/api/listCustomers', async (req, res) => {
  try {
    const { accessToken } = req.body;
    const response = await fetch(
      'https://googleads.googleapis.com/v10/customers:listAccessibleCustomers',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Endpoint para buscar métricas
app.post('/api/getMetrics', async (req, res) => {
  try {
    const { accessToken, customerId } = req.body;
    const query = `
      SELECT 
        SUM(metrics.impressions) AS total_impressions,
        SUM(metrics.clicks) AS total_clicks,
        AVG(metrics.ctr) AS avg_ctr,
        SUM(metrics.conversions) AS total_conversions,
        AVG(metrics.average_cpc) AS avg_cpc,
        SUM(metrics.cost_micros) AS total_cost_micros
      FROM customer
    `;
    const response = await fetch(
      `https://googleads.googleapis.com/v10/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Porta definida pelo Railway
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});
