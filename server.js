/****************************************************
 * server.js
 * Ajustado para usar v14 da Google Ads API
 * e exibir possíveis conteúdos HTML de erro.
 ****************************************************/
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

// Se for MCC (Manager Account):
const MANAGER_ACCOUNT_ID = '9201538227'; // Ajuste sem hifens

const app = express();

// Configuração de CORS (se precisar de requests do front-end)
app.use(cors({
  origin: '*',
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'developer-token',
    'login-customer-id',
    'Accept'
  ]
}));

// Faz o Express entender JSON
app.use(express.json());

// Handler para OPTIONS em todas as rotas (preflight)
app.options('*', (req, res) => {
  res.sendStatus(200);
});

/****************************************************
 * Rota de teste: /ping
 ****************************************************/
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

/****************************************************
 * /listAccessibleCustomers (GET para Google Ads v14)
 ****************************************************/
app.post('/listAccessibleCustomers', async (req, res) => {
  try {
    const { accessToken, developerToken } = req.body;
    const url = 'https://googleads.googleapis.com/v14/customers:listAccessibleCustomers';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': MANAGER_ACCOUNT_ID,
        'Accept': 'application/json',
      },
    });

    // Ao invés de response.json(), pegamos como texto para debug
    const rawText = await response.text();
    console.log('Resposta bruta (listAccessibleCustomers) v14:\n', rawText);

    // Tenta converter em JSON
    try {
      const data = JSON.parse(rawText);
      return res.json(data);
    } catch (parseError) {
      console.error('Falha ao interpretar JSON (listAccessibleCustomers):', parseError);
      return res.status(500).json({
        error: 'Falha ao interpretar JSON',
        rawResponse: rawText
      });
    }

  } catch (error) {
    console.error('Erro ao listar customers:', error);
    return res.status(500).json({ error: error.message });
  }
});

/****************************************************
 * /getCampaignMetrics (POST para Google Ads v14)
 ****************************************************/
app.post('/getCampaignMetrics', async (req, res) => {
  try {
    const { accessToken, developerToken, customerId } = req.body;
    const url = `https://googleads.googleapis.com/v14/customers/${customerId}/googleAds:search`;

    const gaqlQuery = `
      SELECT
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.conversions,
        metrics.average_cpc,
        metrics.cost_micros
      FROM campaign
      WHERE campaign.status = 'ENABLED'
      LIMIT 50
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': MANAGER_ACCOUNT_ID,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: gaqlQuery.trim() })
    });

    // Pega a resposta como texto para debug
    const rawText = await response.text();
    console.log('Resposta bruta (getCampaignMetrics) v14:\n', rawText);

    // Tenta converter em JSON
    try {
      const data = JSON.parse(rawText);
      return res.json(data);
    } catch (parseError) {
      console.error('Falha ao interpretar JSON (getCampaignMetrics):', parseError);
      return res.status(500).json({
        error: 'Falha ao interpretar JSON',
        rawResponse: rawText
      });
    }

  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    return res.status(500).json({ error: error.message });
  }
});

/****************************************************
 * Inicializa na porta dinâmica
 ****************************************************/
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
