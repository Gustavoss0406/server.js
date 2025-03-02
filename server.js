/****************************************************
 * server.js
 * Usa GAQL para listar contas acessíveis na REST v14
 * e exibe possíveis erros em HTML para debug.
 ****************************************************/
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

// Se for conta MCC (Manager), coloque o ID sem hifens aqui se quiser como fallback,
// ou faça o front passar esse ID pelo body. Ex.: const MANAGER_ACCOUNT_ID = '9201538227';

const app = express();

// Configuração de CORS (caso precise de requisições do front-end)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
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
 * /listAccessibleCustomers via GAQL (v14)
 * Em vez de 'customers:listAccessibleCustomers', 
 * chamamos 'POST /googleAds:search' com a GAQL Query
 ****************************************************/
app.post('/listAccessibleCustomers', async (req, res) => {
  try {
    // Esperamos que o cliente envie:
    // { accessToken, developerToken, managerId }
    // managerId é o MCC ID (ex.: "9201538227" sem hifens)
    const { accessToken, developerToken, managerId } = req.body;

    const url = `https://googleads.googleapis.com/v14/customers/${managerId}/googleAds:search`;

    // Consulta GAQL para listar contas sob o MCC
    // Você pode personalizar os campos conforme a doc (ex.: customer.time_zone, etc.)
    const gaqlQuery = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.manager
      FROM customer
      LIMIT 50
    `;

    // Faz a requisição POST
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': managerId, // se for MCC
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: gaqlQuery.trim() })
    });

    // Obtemos como texto para poder logar se for HTML
    const rawText = await response.text();
    console.log('Resposta bruta (listAccessibleCustomers via GAQL) v14:\n', rawText);

    // Tenta converter em JSON
    try {
      const data = JSON.parse(rawText);
      return res.json(data);
    } catch (parseError) {
      console.error('Falha ao interpretar JSON (listAccessibleCustomers via GAQL):', parseError);
      return res.status(500).json({
        error: 'Falha ao interpretar JSON',
        rawResponse: rawText
      });
    }

  } catch (error) {
    console.error('Erro ao listar contas via GAQL:', error);
    return res.status(500).json({ error: error.message });
  }
});

/****************************************************
 * /getCampaignMetrics (v14)
 * GAQL para buscar métricas da conta
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
        'login-customer-id': customerId, // caso seja MCC, use managerId
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: gaqlQuery.trim() })
    });

    const rawText = await response.text();
    console.log('Resposta bruta (getCampaignMetrics) v14:\n', rawText);

    try {
      const data = JSON.parse(rawText);
      return res.json(data);
    } catch (parseError) {
      console.error('Falha ao interpretar JSON (getCampaignMetrics) v14:', parseError);
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
