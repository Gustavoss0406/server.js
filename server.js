/****************************************************
 * server.js
 * Ajustado para tratar método OPTIONS no Railway 
 * e permitir CORS adequadamente.
 ****************************************************/
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

// Se for MCC:
const MANAGER_ACCOUNT_ID = '9201538227';

const app = express();

// Configuração de CORS avançada
app.use(cors({
  origin: '*',               // ou especifique seu domínio
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
 * /listAccessibleCustomers
 ****************************************************/
app.post('/listAccessibleCustomers', async (req, res) => {
  try {
    const { accessToken, developerToken } = req.body;
    const url = 'https://googleads.googleapis.com/v10/customers:listAccessibleCustomers';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': MANAGER_ACCOUNT_ID, // se for MCC
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Erro ao listar customers:', error);
    res.status(500).json({ error: error.message });
  }
});

/****************************************************
 * /getCampaignMetrics
 ****************************************************/

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});


app.post('/getCampaignMetrics', async (req, res) => {
  try {
    const { accessToken, developerToken, customerId } = req.body;
    const url = `https://googleads.googleapis.com/v10/customers/${customerId}/googleAds:search`;

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

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ error: error.message });
  }
});

/****************************************************
 * Inicializa na porta dinâmica do Railway
 ****************************************************/
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
