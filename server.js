/****************************************************
 * server.js
 * Configuração mínima para funcionar no Railway
 * com Google Ads API (conta Manager).
 ****************************************************/
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

// Insira aqui o ID da sua conta Manager (MCC), sem hifens.
// Exemplo se no painel aparece 920-153-8227, use '9201538227'.
const MANAGER_ACCOUNT_ID = '9201538227';

// Cria a aplicação Express
const app = express();

// Middlewares básicos
app.use(express.json());   // Aceitar JSON no corpo
app.use(cors());           // Liberar CORS para qualquer origem

/****************************************************
 * Rota: /listAccessibleCustomers
 * - Recebe accessToken e developerToken no JSON body
 * - Faz GET na Google Ads API para listar as contas
 ****************************************************/
app.post('/listAccessibleCustomers', async (req, res) => {
  try {
    const { accessToken, developerToken } = req.body;

    // Endpoint oficial para listar contas
    const url = 'https://googleads.googleapis.com/v10/customers:listAccessibleCustomers';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // Token de OAuth
        'Authorization': `Bearer ${accessToken}`,
        // Seu Developer Token (precisa estar aprovado ou em teste adequado)
        'developer-token': developerToken,
        // Conta Manager (MCC) sem hifens
        'login-customer-id': MANAGER_ACCOUNT_ID,
        'Accept': 'application/json'
      }
    });

    // Decodifica a resposta
    const data = await response.json();

    // Retorna o JSON ao cliente (FlutterFlow, Postman, etc.)
    res.json(data);

  } catch (error) {
    console.error('Erro ao listar customers:', error);
    res.status(500).json({ error: error.message });
  }
});

/****************************************************
 * Rota: /getCampaignMetrics
 * - Recebe accessToken, developerToken, customerId
 * - Faz POST na Google Ads API para obter métricas
 ****************************************************/
app.post('/getCampaignMetrics', async (req, res) => {
  try {
    const { accessToken, developerToken, customerId } = req.body;

    // Endpoint que faz queries GAQL
    const url = `https://googleads.googleapis.com/v10/customers/${customerId}/googleAds:search`;

    // Exemplo de query GAQL para campanhas ativas
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
        'login-customer-id': MANAGER_ACCOUNT_ID, // MCC
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Corpo com a query em JSON
      body: JSON.stringify({ query: gaqlQuery.trim() })
    });

    // Decodifica a resposta
    const data = await response.json();

    // Retorna o JSON ao cliente
    res.json(data);

  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ error: error.message });
  }
});

/****************************************************
 * Inicializa o servidor na porta definida pelo Railway
 ****************************************************/
const PORT = process.env.PORT || 3000;

// Use '0.0.0.0' para escutar em todas as interfaces no Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
